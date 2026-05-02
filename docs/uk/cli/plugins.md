---
read_when:
    - Ви хочете встановити Plugin-и Gateway чи сумісні пакети або керувати ними
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T17:21:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2f29ff970a535812be046648547bb3851d870c2e6d8ce2f836f991c0ca28bbfc
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте плагінами Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевого користувача з установлення, увімкнення та усунення несправностей плагінів.
  </Card>
  <Card title="Бандли Plugin" href="/uk/plugins/bundles">
    Модель сумісності бандлів.
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

Для дослідження повільного встановлення, перевірки, видалення або оновлення реєстру запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для розбору. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані плагіни постачаються з OpenClaw. Деякі увімкнені за замовчуванням (наприклад вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний плагін); інші потребують `plugins enable`.

Нативні плагіни OpenClaw мають постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Детальний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) і виявлені можливості бандла.
</Note>

### Установлення

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
Голі назви пакетів спершу перевіряються в ClawHub, а потім у npm. Ставтеся до встановлення плагінів як до запуску коду. Надавайте перевагу зафіксованим версіям.
</Warning>

`plugins search` запитує ClawHub щодо пакетів плагінів, доступних для встановлення, і друкує
назви пакетів, готові до встановлення. Пошук охоплює пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для Skills ClawHub.

<Note>
ClawHub є основною поверхнею розповсюдження й пошуку для більшості плагінів. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Під час міграції на
ClawHub OpenClaw усе ще постачає деякі пакети плагінів `@openclaw/*`, що належать OpenClaw,
у npm; версії цих пакетів можуть відставати від вбудованого вихідного коду між релізними
потягами плагінів. Якщо npm повідомляє, що пакет плагіна, який належить OpenClaw, застарів, ця
опублікована версія є старим зовнішнім артефактом; використовуйте плагін, вбудований у
поточний OpenClaw, або локальний checkout, доки не буде опубліковано новіший пакет npm.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення після недійсної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються закрито замість вирівнювання. Див. [Включення конфігурації](/uk/gateway/configuration) для підтримуваних форм.

    Якщо конфігурація недійсна під час установлення, `plugins install` зазвичай завершується закрито й просить спершу запустити `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація одного плагіна ізолюється до цього плагіна, щоб інші канали та плагіни могли продовжувати роботу; `openclaw doctor --fix` може помістити недійсний запис плагіна в карантин. Єдиний задокументований виняток під час установлення — вузький шлях відновлення вбудованого плагіна для плагінів, які явно погоджуються на `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і повторне встановлення проти оновлення">
    `--force` повторно використовує наявну ціль установлення та на місці перезаписує вже встановлений плагін або пакет хуків. Використовуйте його, коли навмисно перевстановлюєте той самий id із нового локального шляху, архіву, пакета ClawHub або артефакта npm. Для звичайних оновлень уже відстежуваного npm-плагіна надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється й указує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли справді потрібно перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з установленнями `git:`; використовуйте явний git ref, наприклад `git:github.com/acme/plugin@v1.2.3`, коли потрібно зафіксувати джерело. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибних спрацьовувань у вбудованому сканері небезпечного коду. Вона дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але вона **не** обходить блокування політики хуків `before_install` плагіна й **не** обходить помилки сканування.

    Цей CLI-прапорець застосовується до потоків install/update для плагінів. Установлення залежностей Skills, підтримувані Gateway, використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` лишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо плагін, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які експонують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і діапазони semver відхиляються. Установлення залежностей виконуються локально для проєкту з `--ignore-scripts` заради безпеки, навіть якщо ваша оболонка має глобальні налаштування npm install.

    Використовуйте `npm:<package>`, коли хочете пропустити пошук у ClawHub і встановити напряму з npm. Голі specs пакетів усе ще віддають перевагу ClawHub і повертаються до npm лише тоді, коли ClawHub не має такого пакета або версії.

    Голі specs і `@latest` залишаються на стабільному треку. Якщо npm вирішує будь-який із них у prerelease, OpenClaw зупиняється й просить явно погодитися за допомогою prerelease-тега, як-от `@beta`/`@rc`, або точної prerelease-версії, як-от `@1.2.3-beta.4`.

    Якщо голий spec установлення відповідає офіційному id плагіна (наприклад `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб встановити npm-пакет із такою самою назвою, використовуйте явний scoped spec (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>` для прямого встановлення з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні clone URL `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед установленням перейти на гілку, тег або коміт.

    Git-установлення клонують у тимчасовий каталог, переходять на запитаний ref, якщо він присутній, а потім використовують звичайний інсталятор каталогу плагіна. Це означає, що перевірка маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як у npm-установленнях. Записані git-установлення включають URL/ref джерела та розв’язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і CLI-команди. Якщо плагін зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду напряму через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних плагінів OpenClaw мають містити дійсний `openclaw.plugin.json` у корені витягнутого плагіна; архіви, які містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Установлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Установлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw тепер також віддає перевагу ClawHub для голих npm-безпечних specs плагінів. Він повертається до npm лише якщо ClawHub не має такого пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусово застосувати розв’язання лише через npm, наприклад коли ClawHub недоступний або ви знаєте, що пакет існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє рекламований plugin API / мінімальну сумісність gateway перед установленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-pack `.tgz`, перевіряє digest-заголовок ClawHub і digest артефакта, а потім встановлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої метадані джерела ClawHub, тип артефакта, npm integrity, npm shasum, назву tarball і факти digest ClawPack для подальших оновлень.
Неверсійовані встановлення ClawHub зберігають неверсійований записаний spec, щоб `openclaw plugins update` міг стежити за новішими релізами ClawHub; явні селектори версії або тега, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються зафіксованими на цьому селекторі.

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
  <Tab title="Джерела Marketplace">
    - відома назва marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях до `marketplace.json`
    - скорочення репозиторію GitHub, як-от `owner/repo`
    - URL репозиторію GitHub, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи plugin мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непутьові джерела plugin із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні plugins OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або стандартну структуру компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакета, command-skills Claude, типові значення `settings.json` Claude, типові значення `.lsp.json` Claude / оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не підключені до виконання під час роботи.
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
  Перемкнутися з табличного подання на рядки деталей для кожного plugin з метаданими source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитувана інвентаризація плюс діагностика реєстру.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр plugin, із запасним варіантом, виведеним лише з маніфестів, коли реєстр відсутній або недійсний. Це корисно, щоб перевірити, чи встановлено plugin, чи його ввімкнено і чи він видимий для планування холодного запуску, але це не live-зонд під час роботи вже запущеного процесу Gateway. Після зміни коду plugin, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати виконання нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує runtime-код plugin. Результати пошуку
містять назву пакета ClawHub, family, channel, version, summary і
підказку для встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованими plugin всередині запакованого образу Docker змонтуйте каталог
джерел plugin поверх відповідного запакованого шляху до джерел, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване overlay джерел
перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерел
залишається неактивним, тож стандартні запаковані встановлення й далі використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженням модуля. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або встановити відсутні налаштовані завантажувані plugins.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки service/process, шлях конфігурації та стан RPC.
- Невбудовані хуки розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов'язані встановлення повторно використовують шлях до джерел замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв'язану точну специфікацію (`name@version`) у керованому індексі plugin, залишаючи стандартну поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це машинно керований стан, а не користувацька конфігурація. Встановлення й оновлення записують його до `plugins/installs.json` у активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є довговічним джерелом метаданих встановлення, включно із записами для зламаних або відсутніх маніфестів plugin. Масив `plugins` — це кеш холодного реєстру, виведений із маніфестів. Файл містить попередження не редагувати його і використовується `openclaw plugins update`, видаленням, діагностикою та холодним реєстром plugin.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, він переносить їх в індекс plugin і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи plugin з `plugins.entries`, збереженого індексу plugin, записів списку дозволів/заборон plugin і пов'язаних записів `plugins.load.paths`, коли це застосовно. Якщо не задано `--keep-files`, видалення також прибирає відстежуваний керований каталог встановлення, коли він розташований у корені розширень plugin OpenClaw. Для plugins active memory слот пам'яті скидається до `memory-core`.

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
  <Accordion title="Розв'язання id plugin порівняно з npm spec">
    Коли ви передаєте id plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього plugin. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії й надалі використовуються під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом plugin, оновлює встановлений plugin і записує нову npm-специфікацію для майбутніх оновлень на основі id.

    Передавання назви npm-пакета без версії або тегу також зіставляється назад із відстежуваним записом plugin. Використовуйте це, коли plugin було закріплено на точній версії, а ви хочете повернути його до стандартної лінії релізів реєстру.

  </Accordion>
  <Accordion title="Перевірки версії та drift цілісності">
    Перед live-оновленням npm OpenClaw перевіряє встановлену версію пакета за метаданими npm registry. Якщо встановлена версія і записана ідентичність артефакта вже збігаються з розв'язаною ціллю, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли існує збережений integrity hash і hash отриманого артефакта змінюється, OpenClaw трактує це як drift артефакта npm. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний hashes та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення fail closed, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час update">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як break-glass override для хибних спрацювань вбудованого сканування dangerous-code під час оновлень plugin. Він усе одно не обходить блокування політики `before_install` plugin або блокування через помилку сканування, і застосовується лише до оновлень plugin, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує identity, load status, source, manifest capabilities, policy flags, diagnostics, install metadata, bundle capabilities і будь-яку виявлену підтримку серверів MCP або LSP без імпорту runtime plugin за замовчуванням. Додайте `--runtime`, щоб завантажити модуль plugin і включити зареєстровані hooks, tools, commands, services, gateway methods і HTTP routes. Runtime-інспекція повідомляє про відсутні залежності plugin напряму; встановлення й ремонти залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, якими володіє plugin, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` показує команду в `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, plugin, який реєструє `demo-git`, можна перевірити через `openclaw demo-git ping`.

Кожен plugin класифікується за тим, що він фактично реєструє під час роботи:

- **plain-capability** — один тип capability (наприклад, plugin лише для provider)
- **hybrid-capability** — кілька типів capability (наприклад, text + speech + images)
- **hook-only** — лише hooks, без capabilities або surfaces
- **non-capability** — tools/commands/services, але без capabilities

Докладніше про модель capability див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машинозчитуваний звіт, придатний для скриптів і аудиту. `inspect --all` рендерить таблицю для всього парку з колонками shape, capability kinds, compatibility notices, bundle capabilities і hook summary. `info` — це псевдонім для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження plugin, діагностику manifest/discovery і compatibility notices. Коли все чисто, він друкує `No plugin issues detected.`

Для помилок форми модуля, як-от відсутні exports `register`/`activate`, повторіть запуск із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактний підсумок export-shape у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр plugin — це збережена cold read model OpenClaw для installed plugin identity, enablement, source metadata і contribution ownership. Звичайний запуск, пошук власника provider, класифікація налаштування каналу та інвентаризація plugin можуть читати його без імпорту runtime-модулів plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу plugin, config policy і manifest/package metadata. Це шлях ремонту, а не шлях runtime-активації.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — застарілий break-glass compatibility switch для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; env fallback призначений лише для аварійного відновлення запуску, доки міграція розгортається.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list приймає локальний шлях marketplace, шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує розв'язану мітку джерела плюс розібраний маніфест marketplace і записи plugin.

## Пов'язане

- [Створення plugins](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Plugins спільноти](/uk/plugins/community)
