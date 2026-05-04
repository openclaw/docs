---
read_when:
    - Ви хочете встановити або керувати Plugin Gateway чи сумісними пакетами
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-04T09:37:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: f561ce098181b07f25db3520b1726162863469ac05fb4a3e786915257d97c9a4
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin для Gateway, пакетами хуків і сумісними наборами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення й усунення проблем із plugins.
  </Card>
  <Card title="Керування plugins" href="/uk/plugins/manage-plugins">
    Короткі приклади встановлення, виведення списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Набори Plugin" href="/uk/plugins/bundles">
    Модель сумісності наборів.
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

Щоб дослідити повільне встановлення, інспектування, видалення або оновлення реєстру, запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і залишає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані plugins постачаються разом з OpenClaw. Деякі ввімкнені типово (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні OpenClaw plugins мають постачати `openclaw.plugin.json` з inline JSON Schema (`configSchema`, навіть якщо порожня). Сумісні набори натомість використовують власні маніфести наборів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Деталізований вивід list/info також показує підтип набору (`codex`, `claude` або `cursor`) плюс виявлені можливості набору.
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
Під час перехідного запуску голі імена пакетів типово встановлюються з npm. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення Plugin як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` надсилає запит до ClawHub щодо встановлюваних пакетів Plugin і друкує
готові до встановлення імена пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для ClawHub skills.

<Note>
ClawHub є основною поверхнею розповсюдження та пошуку для більшості plugins. Npm
залишається підтримуваним резервним і прямим шляхом встановлення. Пакети Plugin
`@openclaw/*`, що належать OpenClaw, знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар Plugin](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення та оновлення beta-каналу надають перевагу npm `beta` dist-tag, коли такий тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення некоректної конфігурації">
    Якщо ваш розділ `plugins` спирається на однофайловий `$include`, `plugins install/update/enable/disable/uninstall` записує зміни в цей включений файл і залишає `openclaw.json` без змін. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються закрито замість сплющення. Див. [Включення конфігурації](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо конфігурація некоректна під час встановлення, `plugins install` зазвичай завершується закрито й повідомляє, що спершу потрібно запустити `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження некоректна конфігурація Plugin завершується закрито, як і будь-яка інша некоректна конфігурація; `openclaw doctor --fix` може помістити некоректний запис Plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого Plugin для plugins, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення порівняно з оновленням">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений Plugin або пакет хуків на місці. Використовуйте його, коли ви навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакта npm. Для звичайних оновлень уже відстежуваного npm Plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з установленнями `git:`; використовуйте явне посилання git, наприклад `git:github.com/acme/plugin@v1.2.3`, коли потрібне закріплене джерело. Він не підтримується з `--marketplace`, оскільки встановлення з маркетплейсу зберігають метадані джерела маркетплейсу замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний параметр для хибних спрацьовувань у вбудованому сканері небезпечного коду. Він дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але **не** обходить блокування політик хука `before_install` Plugin і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення Plugin. Встановлення залежностей skill через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення ClawHub skill.

    Якщо Plugin, який ви опублікували на ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (ім’я пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і діапазони semver відхиляються. Встановлення залежностей виконується локально для проєкту з `--ignore-scripts` заради безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете зробити npm-розв’язання явним. Під час перехідного запуску голі package specs також встановлюються напряму з npm.

    Голі specs і `@latest` залишаються на стабільному каналі. Версії виправлень OpenClaw із датою, як-от `2026.5.3-1`, є стабільними релізами для цієї перевірки. Якщо npm розв’язує будь-який із них у prerelease, OpenClaw зупиняється й просить вас явно погодитися за допомогою prerelease-тега, як-от `@beta`/`@rc`, або точної prerelease-версії, як-от `@1.2.3-beta.4`.

    Якщо голий spec встановлення збігається з офіційним id Plugin (наприклад `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб установити npm-пакет із тією самою назвою, використовуйте явний scoped spec (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Репозиторії Git">
    Використовуйте `git:<repo>` для встановлення напряму з репозиторію git. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб отримати гілку, тег або коміт перед встановленням.

    Установлення Git клонують у тимчасовий каталог, отримують запитаний ref, якщо він присутній, а потім використовують звичайний інсталятор каталогу Plugin. Це означає, що валідація маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення містять URL/ref джерела плюс розв’язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і команди CLI. Якщо Plugin зареєстрував CLI-корінь через `api.registerCli`, виконайте цю команду напряму через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних OpenClaw Plugin мають містити валідний `openclaw.plugin.json` у корені розпакованого Plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw записує записи встановлення.

    Установлення з маркетплейсу Claude також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-safe specs Plugin типово встановлюються з npm під час перехідного запуску:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити npm-only розв’язання явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошену сумісність plugin API / мінімального gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-pack `.tgz`, перевіряє digest-заголовок ClawHub і digest артефакта, а потім встановлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої метадані джерела ClawHub, тип артефакта, npm integrity, npm shasum, ім’я tarball і факти digest ClawPack для подальших оновлень.
Неверсійовані встановлення ClawHub зберігають неверсійований записаний spec, щоб `openclaw plugins update` міг відстежувати новіші релізи ClawHub; явні селектори версії або тега, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

#### Скорочення маркетплейсу

Використовуйте скорочення `plugin@marketplace`, коли назва маркетплейсу існує в локальному кеші реєстру Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

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
    - назва відомого маркетплейсу Claude з `~/.claude/plugins/known_marketplaces.json`
    - корінь локального маркетплейсу або шлях `marketplace.json`
    - скорочення репозиторію GitHub, як-от `owner/repo`
    - URL репозиторію GitHub, як-от `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Правила віддаленого маркетплейсу">
    Для віддалених маркетплейсів, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію маркетплейсу. OpenClaw приймає джерела відносних шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непутьові джерела плагінів із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакета, command-Skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, command-Skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не підключені до виконання під час роботи.
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
  Перемкнутися з табличного подання на рядки деталізації для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар, а також діагностика реєстру й стан встановлення залежностей пакетів.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів із резервним варіантом, виведеним лише з маніфестів, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи плагін встановлено, увімкнено та видно для планування холодного запуску, але це не live-перевірка runtime уже запущеного процесу Gateway. Після зміни коду плагіна, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` містить `dependencyStatus` кожного плагіна з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
наявні вздовж звичайного шляху пошуку Node `node_modules` для плагіна; він
не імпортує runtime-код плагіна, не запускає менеджер пакетів і не виправляє
відсутні залежності.
</Note>

`plugins search` — це пошук у віддаленому каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує runtime-код плагіна. Результати пошуку
містять назву пакета ClawHub, сімейство, канал, версію, короткий опис і
підказку для встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з bundled plugin усередині запакованого Docker-образу змонтуйте з прив'язкою
каталог джерел плагіна поверх відповідного запакованого шляху джерел, як-от
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване накладання джерел
перед `/app/dist/extensions/synology-chat`; звичайно скопійований каталог джерел
залишається неактивним, тож звичайні запаковані встановлення й далі використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженим модулем. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або встановити відсутні налаштовані завантажувані плагіни.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки сервісу/процесу, шлях конфігурації та справність RPC.
- Невбудовані хуки розмови (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов'язані встановлення повторно використовують шлях джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв'язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи типову поведінку без закріплення.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це стан, керований машиною, а не конфігурація користувача. Встановлення й оновлення записують його до `plugins/installs.json` в активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є сталим джерелом метаданих встановлення, включно із записами для пошкоджених або відсутніх маніфестів плагінів. Масив `plugins` — це холодний кеш реєстру, виведений із маніфестів. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою й холодним реєстром плагінів.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, він переміщує їх в індекс плагінів і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, збереженого індексу плагінів, записів списків дозволу/заборони плагінів і пов'язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не задано, видалення також вилучає відстежуваний керований каталог встановлення, коли він розташований усередині кореня розширень плагінів OpenClaw. Для плагінів Active Memory слот пам'яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і відстежуваних встановлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв'язання ідентифікатора плагіна й npm-специфікації">
    Коли ви передаєте ідентифікатор плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-теги, як-от `@beta`, і точні закріплені версії й надалі використовуються під час пізніших запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-тегом або точною версією. OpenClaw розв'язує цю назву пакета назад до відстежуваного запису плагіна, оновлює цей встановлений плагін і записує нову npm-специфікацію для майбутніх оновлень на основі ідентифікатора.

    Передавання назви npm-пакета без версії або тегу також розв'язується назад до відстежуваного запису плагіна. Використовуйте це, коли плагін було закріплено до точної версії, а ви хочете повернути його до типової лінії випусків реєстру.

  </Accordion>
  <Accordion title="Оновлення бета-каналу">
    `openclaw plugins update` повторно використовує відстежувану специфікацію плагіна, якщо ви не передаєте нову специфікацію. `openclaw update` додатково знає активний канал оновлень OpenClaw: на бета-каналі записи плагінів npm і ClawHub типової лінії спочатку пробують `@beta`, а потім повертаються до записаної типової/останньої специфікації, якщо бета-випуску плагіна не існує. Точні версії та явні теги залишаються закріпленими за цим селектором.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед live-оновленням npm OpenClaw перевіряє встановлену версію пакета щодо метаданих npm-реєстру. Якщо встановлена версія та записана ідентичність артефакта вже збігаються з розв'язаною ціллю, оновлення пропускається без завантаження, повторного встановлення або переписування `openclaw.json`.

    Коли збережений хеш цілісності існує, а хеш отриманого артефакта змінюється, OpenClaw трактує це як дрейф npm-артефакта. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та запитує підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються відмовою за замовчуванням, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як екстрене перевизначення для хибних спрацьовувань вбудованого сканування небезпечного коду під час оновлень плагінів. Він усе одно не обходить блокування політики `before_install` плагіна або блокування через помилку сканування, і застосовується лише до оновлень плагінів, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політик, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP без імпорту runtime плагіна за замовчуванням. Додайте `--runtime`, щоб завантажити модуль плагіна та включити зареєстровані хуки, інструменти, команди, сервіси, методи Gateway і HTTP-маршрути. Runtime-інспекція повідомляє про відсутні залежності плагіна напряму; встановлення та виправлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, якими володіє плагін, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, плагін, що реєструє `demo-git`, можна перевірити через `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час виконання:

- **plain-capability** — один тип можливостей (наприклад, плагін лише провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машиночитний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього набору зі стовпцями форми, видів можливостей, приміток сумісності, можливостей пакета та підсумку хуків. `info` — псевдонім для `inspect`.
</Note>

### Діагностика

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфестів/виявлення та примітки сумісності. Коли все чисто, він друкує `No plugin issues detected.`

Якщо налаштований плагін наявний на диску, але заблокований перевірками безпеки шляхів завантажувача, валідація конфігурації зберігає запис плагіна й повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого плагіна, як-от власність шляху або дозволи на запис для всіх, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, перезапустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити стислий підсумок форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена холодна модель читання OpenClaw для встановленої ідентичності плагінів, увімкнення, метаданих джерела та власників внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентар плагінів можуть читати його без імпорту runtime-модулів плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи наявний збережений реєстр, чи він актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації під час виконання.

`openclaw doctor --fix` також виправляє кероване розходження npm поруч із реєстром: якщо осиротілий або відновлений пакет `@openclaw/*` у керованому npm-корені Plugin затінює вбудований Plugin, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за вбудованим маніфестом.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через змінну середовища призначений лише для аварійного відновлення запуску, поки міграція розгортається.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список маркетплейсу приймає локальний шлях до маркетплейсу, шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` виводить мітку розв’язаного джерела, а також розібраний маніфест маркетплейсу та записи Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні Plugin](/uk/plugins/community)
