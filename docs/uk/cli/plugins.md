---
read_when:
    - Ви хочете встановити Plugin для Gateway або сумісні набори чи керувати ними
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-05-02T19:03:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 162dac7c3e082d7de3bb4d97573761e824f30f6b0a5a806038ee9fb4f116ee4a
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення й усунення несправностей Plugin.
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
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує час виконання фаз
у stderr і зберігає JSON-вивід придатним для розбору. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані Plugin постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні Plugin OpenClaw мають постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

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
Голі назви пакетів спочатку перевіряються в ClawHub, а потім у npm. Ставтеся до встановлення Plugin як до запуску коду. Надавайте перевагу зафіксованим версіям.
</Warning>

`plugins search` запитує ClawHub щодо пакетів Plugin, доступних для встановлення, і виводить
готові до встановлення назви пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не Skills. Використовуйте `openclaw skills search` для Skills у ClawHub.

<Note>
ClawHub є основною поверхнею розповсюдження й пошуку для більшості Plugin. Npm
залишається підтримуваним резервним і прямим шляхом встановлення. Під час міграції до
ClawHub OpenClaw усе ще постачає деякі пакети Plugin `@openclaw/*`, що належать OpenClaw,
у npm; версії цих пакетів можуть відставати від вбудованого джерела між релізними
потоками Plugin. Якщо npm повідомляє, що пакет Plugin, який належить OpenClaw, застарілий,
ця опублікована версія є старим зовнішнім артефактом; використовуйте Plugin, вбудований у
поточний OpenClaw, або локальний checkout, доки не буде опубліковано новіший пакет npm.
</Note>

<AccordionGroup>
  <Accordion title="Config includes і відновлення після недійсної конфігурації">
    Якщо ваш розділ `plugins` підкріплений однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файлу й залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення із сусідніми перевизначеннями завершуються закрито замість розгортання. Див. [Config includes](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й повідомляє, що спершу потрібно запустити `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація одного Plugin ізолюється до цього Plugin, щоб інші канали та Plugin могли продовжувати працювати; `openclaw doctor --fix` може помістити недійсний запис Plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення для вбудованих Plugin, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення порівняно з оновленням">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений Plugin або пакет хуків на місці. Використовуйте його, коли ви навмисно перевстановлюєте той самий id із нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm Plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з установленнями `git:`; використовуйте явний git ref, наприклад `git:github.com/acme/plugin@v1.2.3`, коли хочете зафіксоване джерело. Він не підтримується з `--marketplace`, бо встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибних спрацювань у вбудованому сканері небезпечного коду. Вона дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але вона **не** обходить блокування політики хуків Plugin `before_install` і **не** обходить помилки сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення Plugin. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо Plugin, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавців у [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і специфікації npm">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які відкривають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконується локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете пропустити пошук у ClawHub і встановити безпосередньо з npm. Голі специфікації пакетів усе ще надають перевагу ClawHub і повертаються до npm лише тоді, коли ClawHub не має такого пакета або версії.

    Голі специфікації та `@latest` залишаються на стабільному треку. Якщо npm розв’язує будь-яку з них у prerelease, OpenClaw зупиняється й просить вас явно погодитися за допомогою prerelease-тега, наприклад `@beta`/`@rc`, або точної prerelease-версії, наприклад `@1.2.3-beta.4`.

    Якщо гола специфікація встановлення збігається з офіційним id Plugin (наприклад `diffs`), OpenClaw встановлює запис каталогу безпосередньо. Щоб встановити пакет npm із такою самою назвою, використовуйте явну scoped-специфікацію (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>`, щоб встановити безпосередньо з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб checkout гілку, тег або коміт перед встановленням.

    Встановлення з Git клонують у тимчасовий каталог, виконують checkout запитаного ref, якщо він є, а потім використовують звичайний інсталятор каталогу Plugin. Це означає, що валідація маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як встановлення npm. Записані встановлення з git містять URL/ref джерела та розв’язаний коміт, щоб `openclaw plugins update` міг повторно розв’язати джерело пізніше.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити реєстрації runtime, як-от методи Gateway і команди CLI. Якщо Plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду безпосередньо через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних Plugin OpenClaw мають містити чинний `openclaw.plugin.json` у корені розпакованого Plugin; архіви, які містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Також підтримуються встановлення з Claude marketplace.

  </Accordion>
</AccordionGroup>

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw тепер також надає перевагу ClawHub для голих npm-безпечних специфікацій Plugin. Він повертається до npm лише якщо ClawHub не має такого пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусити розв’язання лише через npm, наприклад коли ClawHub недоступний або ви знаєте, що пакет існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє заявлену сумісність API Plugin / мінімального Gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-pack `.tgz`, перевіряє заголовок дайджесту ClawHub і дайджест артефакту, а потім встановлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої метадані джерела ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і факти дайджесту ClawPack для подальших оновлень.
Неверсійні встановлення з ClawHub зберігають неверсійну записану специфікацію, щоб `openclaw plugins update` міг стежити за новішими релізами ClawHub; явні селектори версії або тега, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються зафіксованими на цьому селекторі.

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
    - скорочення репозиторію GitHub, як-от `owner/repo`
    - URL репозиторію GitHub, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого маркетплейсу">
    Для віддалених маркетплейсів, завантажених із GitHub або git, записи Plugin мають залишатися всередині клонованого репозиторію маркетплейсу. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непутеві джерела Plugin з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні Plugin OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь Plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакетів, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошених у маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не підключені до виконання під час роботи.
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
  Показувати лише ввімкнені Plugin.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на рядки з деталями для кожного Plugin, що містять метадані джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар, а також діагностика реєстру й стан встановлення залежностей пакетів.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр Plugin, із резервним варіантом, виведеним лише з маніфестів, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи встановлений Plugin, чи ввімкнений він і чи видимий для планування холодного запуску, але це не live-зонд середовища виконання вже запущеного процесу Gateway. Після зміни коду Plugin, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного Plugin з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи присутні ці назви пакетів
уздовж звичайного шляху пошуку Node `node_modules` для Plugin; він
не імпортує код Plugin часу виконання, не запускає менеджер пакетів і не виправляє
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує код Plugin часу виконання. Результати пошуку
містять назву пакета ClawHub, сімейство, канал, версію, короткий опис і
підказку для встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованими Plugin у запакованому образі Docker змонтуйте з прив’язкою каталог
джерельного коду Plugin поверх відповідного запакованого шляху джерел, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване
перекриття джерел перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог
джерел залишиться інертним, тому звичайні запаковані встановлення й надалі використовуватимуть скомпільований dist.

Для налагодження хуків часу виконання:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженням модуля. Інспекція часу виконання ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або встановити відсутні налаштовані завантажувані Plugin.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо служби/процесу, шлях конфігурації та справність RPC.
- Невбудовані хуки розмови (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` під час npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі Plugin, зберігаючи типову поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це машинно керований стан, а не користувацька конфігурація. Встановлення й оновлення записують його до `plugins/installs.json` у поточному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є довготривалим джерелом метаданих встановлення, включно із записами для зламаних або відсутніх маніфестів Plugin. Масив `plugins` — це холодний кеш реєстру, виведений із маніфестів. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою й холодним реєстром Plugin.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, він переносить їх в індекс Plugin і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи Plugin з `plugins.entries`, збереженого індексу Plugin, записів списків дозволу/заборони Plugin і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не задано, видалення також прибирає відстежуваний керований каталог встановлення, коли він розташований у корені розширень Plugin OpenClaw. Для Plugin active memory слот пам’яті скидається до `memory-core`.

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
  <Accordion title="Розв’язання id Plugin проти специфікації npm">
    Коли ви передаєте id Plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього Plugin. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом Plugin, оновлює цей встановлений Plugin і записує нову специфікацію npm для майбутніх оновлень на основі id.

    Передавання назви npm-пакета без версії або тега також зіставляється назад із відстежуваним записом Plugin. Використовуйте це, коли Plugin був закріплений на точній версії, а ви хочете повернути його до типової лінії випусків реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед live-оновленням npm OpenClaw перевіряє встановлену версію пакета за метаданими реєстру npm. Якщо встановлена версія та записана ідентичність артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли існує збережений хеш цілісності й хеш отриманого артефакту змінюється, OpenClaw трактує це як дрейф артефакту npm. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються закрито, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час update">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійний override для хибних спрацювань вбудованого сканування небезпечного коду під час оновлень Plugin. Він усе одно не обходить блокування політики `before_install` Plugin або блокування через помилки сканування, і застосовується лише до оновлень Plugin, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політик, діагностику, метадані встановлення, можливості пакетів і будь-яку виявлену підтримку серверів MCP або LSP без імпорту коду Plugin часу виконання за замовчуванням. Додайте `--runtime`, щоб завантажити модуль Plugin і включити зареєстровані хуки, інструменти, команди, служби, методи Gateway і HTTP-маршрути. Інспекція часу виконання прямо повідомляє про відсутні залежності Plugin; встановлення й виправлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, якими володіє Plugin, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` показує команду в `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, Plugin, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен Plugin класифікується за тим, що він фактично реєструє під час виконання:

- **plain-capability** — один тип можливості (наприклад, Plugin лише для провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/служби, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машиночитний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього парку з колонками форми, типів можливостей, повідомлень сумісності, можливостей пакетів і зведення хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику маніфесту/виявлення та повідомлення сумісності. Коли все чисто, він друкує `No plugin issues detected.`

Для збоїв форми модуля, як-от відсутніх експортів `register`/`activate`, запустіть повторно з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin — це збережена в OpenClaw холодна модель читання для ідентичності встановлених Plugin, стану ввімкнення, метаданих джерела й володіння внесками. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентар Plugin можуть читати його без імпорту модулів Plugin часу виконання.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях виправлення, а не шлях активації часу виконання.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант env призначений лише для аварійного відновлення запуску, поки розгортається міграція.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список маркетплейсу приймає локальний шлях маркетплейсу, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує розв’язану мітку джерела, а також розібраний маніфест маркетплейсу й записи Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Plugin спільноти](/uk/plugins/community)
