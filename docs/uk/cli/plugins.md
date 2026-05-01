---
read_when:
    - Ви хочете встановити або керувати Gateway plugins чи сумісними пакетами
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-01T10:03:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7aebe4ee647d7821b881cdb9d5af01d70508c38b36462ff7b57fb44769dc2f
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Gateway plugins, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів щодо встановлення, увімкнення та усунення несправностей plugins.
  </Card>
  <Card title="Бандли Plugin" href="/uk/plugins/bundles">
    Модель сумісності бандлів.
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
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Для дослідження повільного встановлення, перевірки, видалення або оновлення реєстру запускайте
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує тривалість фаз
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані plugins постачаються з OpenClaw. Деякі ввімкнено за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований browser plugin); інші потребують `plugins enable`.

Нативні OpenClaw plugins мають постачати `openclaw.plugin.json` з вбудованою JSON Schema (`configSchema`, навіть якщо порожньою). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) і виявлені можливості бандла.
</Note>

### Встановлення

```bash
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
Імена пакетів без префікса спершу перевіряються в ClawHub, потім у npm. Ставтеся до встановлення plugins як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

<Note>
ClawHub є основною поверхнею розповсюдження й пошуку для більшості plugins. Npm
залишається підтримуваним резервним і прямим шляхом встановлення. Під час міграції на
ClawHub OpenClaw усе ще постачає деякі належні OpenClaw пакети plugins `@openclaw/*`
у npm; версії цих пакетів можуть відставати від вбудованого вихідного коду між хвилями
випусків plugins. Якщо npm повідомляє, що належний OpenClaw пакет plugin застарів, ця
опублікована версія є старим зовнішнім артефактом; використовуйте plugin, вбудований у
поточний OpenClaw, або локальний checkout, доки не буде опубліковано новіший пакет npm.
</Note>

<AccordionGroup>
  <Accordion title="Config includes і відновлення після недійсної конфігурації">
    Якщо ваш розділ `plugins` спирається на однофайловий `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файла й залишають `openclaw.json` без змін. Кореневі includes, масиви includes та includes із сусідніми перевизначеннями завершуються закрито замість розгортання. Див. [Config includes](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо під час встановлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й просить спершу виконати `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація одного plugin ізолюється до цього plugin, щоб інші канали та plugins могли продовжувати роботу; `openclaw doctor --fix` може помістити недійсний запис plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого plugin для plugins, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення порівняно з оновленням">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений plugin або пакет хуків на місці. Використовуйте це, коли навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm plugin надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id plugin, який уже встановлено, OpenClaw зупиняється й спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли справді потрібно перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з установленнями `git:`; використовуйте явний git ref, наприклад `git:github.com/acme/plugin@v1.2.3`, коли потрібне закріплене джерело. Він не підтримується з `--marketplace`, бо встановлення з marketplace зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Вона дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але вона **не** обходить блокування політики хуків plugin `before_install` і **не** обходить помилки сканування.

    Цей CLI-прапорець застосовується до потоків встановлення/оновлення plugin. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо plugin, який ви опублікували в ClawHub, заблокований скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які експортують `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і по-хукового ввімкнення, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (ім’я пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і діапазони semver відхиляються. Встановлення залежностей виконуються локально в проєкті з `--ignore-scripts` для безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете пропустити пошук у ClawHub і встановити напряму з npm. Specs пакетів без префікса все ще надають перевагу ClawHub і повертаються до npm лише тоді, коли ClawHub не має такого пакета або версії.

    Specs без версії та `@latest` залишаються на стабільному треку. Якщо npm розв’язує будь-який із них у prerelease, OpenClaw зупиняється й просить вас явно погодитися за допомогою prerelease-тега, такого як `@beta`/`@rc`, або точної prerelease-версії, такої як `@1.2.3-beta.4`.

    Якщо bare install spec збігається з id вбудованого plugin (наприклад, `diffs`), OpenClaw встановлює вбудований plugin напряму. Щоб встановити npm-пакет із такою самою назвою, використовуйте явний scoped spec (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>`, щоб встановити напряму з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або коміт.

    Git-встановлення клонують у тимчасовий каталог, переходять на запитаний ref, якщо він наявний, а потім використовують звичайний інсталятор каталогу plugin. Це означає, що перевірка маніфесту, сканування небезпечного коду, підготовка runtime-залежностей і записи встановлення поводяться як встановлення з локального шляху. Записані git-встановлення містять URL/ref джерела та розв’язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, такі як методи gateway і CLI-команди. Якщо plugin зареєстрував CLI root через `api.registerCli`, виконайте цю команду напряму через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних OpenClaw plugins мають містити чинний `openclaw.plugin.json` у витягнутому корені plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw записує записи встановлення.

    Встановлення з marketplace Claude також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw тепер також надає перевагу ClawHub для npm-safe specs plugin без префікса. Він повертається до npm лише тоді, коли ClawHub не має такого пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусово застосувати лише npm-розв’язання, наприклад коли ClawHub недоступний або ви знаєте, що пакет існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє оголошену сумісність plugin API / мінімальну сумісність gateway, а потім встановлює його через звичайний шлях архіву. Записані встановлення зберігають метадані джерела ClawHub для подальших оновлень.
Встановлення ClawHub без версії зберігають записаний spec без версії, щоб `openclaw plugins update` міг відстежувати новіші випуски ClawHub; явні селектори версії або тега, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими на цьому селекторі.

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
    - відома Claude назва marketplace з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення GitHub-репозиторію, таке як `owner/repo`
    - URL GitHub-репозиторію, такий як `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplaces, завантажених із GitHub або git, записи plugins мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає відносні джерела шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші непутьові джерела plugins із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються навички пакетів, командні навички Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, командні навички Cursor і сумісні каталоги гачків Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не підключені до виконання під час роботи.
</Note>

### Список

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Показати лише ввімкнені плагіни.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на докладні рядки для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар плюс діагностика реєстру.
</ParamField>

<Note>
`plugins list` спочатку читає збережений локальний реєстр плагінів, із резервним варіантом, похідним лише від маніфестів, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи встановлено плагін, чи він увімкнений і видимий для планування холодного запуску, але це не живе зондування середовища виконання вже запущеного процесу Gateway. Після зміни коду плагіна, стану ввімкнення, політики гачків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або гачків. Для віддалених/контейнерних розгортань переконайтеся, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

Для роботи з вбудованими плагінами всередині запакованого Docker-образу примонтуйте каталог джерел плагіна поверх відповідного запакованого шляху джерел, наприклад `/app/extensions/synology-chat`. OpenClaw виявить цей змонтований шар джерел перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерел залишається неактивним, тож звичайні запаковані встановлення й надалі використовують скомпільований dist.

Для налагодження гачків під час роботи:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані гачки й діагностику з проходу інспекції із завантаженим модулем. Інспекція під час роботи ніколи не завантажує відсутні вбудовані залежності середовища виконання; використовуйте `openclaw plugins deps --repair`, коли потрібне відновлення.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо сервісу/процесу, шлях конфігурації та справність RPC.
- Невбудовані гачки розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, тому що пов’язані встановлення повторно використовують шлях джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи стандартну поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin є машинно керованим станом, а не користувацькою конфігурацією. Встановлення й оновлення записують їх у `plugins/installs.json` у активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є довготривалим джерелом метаданих встановлення, включно із записами для пошкоджених або відсутніх маніфестів плагінів. Масив `plugins` є кешем холодного реєстру, похідним від маніфестів. Файл містить попередження не редагувати його й використовується `openclaw plugins update`, видаленням, діагностикою та холодним реєстром плагінів.

Коли OpenClaw бачить доставлені застарілі записи `plugins.installs` у конфігурації, він переносить їх в індекс плагінів і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Залежності середовища виконання

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` перевіряє запакований етап залежностей середовища виконання для вбудованих плагінів, що належать OpenClaw і вибрані конфігурацією плагінів, увімкненими/налаштованими каналами, налаштованими постачальниками моделей або стандартними значеннями вбудованого маніфесту. Це не шлях встановлення/оновлення для сторонніх npm- або ClawHub-плагінів.

Використовуйте `--repair`, коли запаковане встановлення повідомляє про відсутні вбудовані залежності середовища виконання під час запуску Gateway або `plugins doctor`. Відновлення встановлює лише відсутні залежності ввімкнених вбудованих плагінів із вимкненими lifecycle-скриптами. Використовуйте `--prune`, щоб видалити застарілі невідомі зовнішні корені залежностей середовища виконання, залишені старішими запакованими макетами.

Повний план, етапування та життєвий цикл відновлення див. у [розв’язанні залежностей Plugin](/uk/plugins/dependency-resolution).

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагінів із `plugins.entries`, збереженого індексу плагінів, записів списків allow/deny плагінів і пов’язаних записів `plugins.load.paths`, коли застосовно. Якщо `--keep-files` не встановлено, видалення також видаляє відстежуваний керований каталог встановлення, коли він розташований усередині кореня розширень плагінів OpenClaw. Для плагінів Active Memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і відстежуваних встановлень пакетів гачків у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Розв’язання ідентифікатора плагіна проти npm-специфікації">
    Коли ви передаєте ідентифікатор плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час пізніших запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом плагіна, оновлює цей установлений плагін і записує нову npm-специфікацію для майбутніх оновлень на основі ідентифікатора.

    Передавання назви npm-пакета без версії або тегу також зіставляється назад із відстежуваним записом плагіна. Використовуйте це, коли плагін був закріплений на точній версії, а ви хочете повернути його до стандартної лінії випусків реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим npm-оновленням OpenClaw перевіряє версію встановленого пакета щодо метаданих npm-реєстру. Якщо встановлена версія та записана ідентичність артефакту вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли збережений хеш цілісності існує і хеш отриманого артефакту змінюється, OpenClaw розглядає це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються закрито, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацювань вбудованого сканування небезпечного коду під час оновлень плагінів. Він усе одно не обходить блокування політики плагіна `before_install` або блокування через збій сканування й застосовується лише до оновлень плагінів, а не до оновлень пакетів гачків.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Інспекція показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості пакета й будь-яку виявлену підтримку серверів MCP або LSP без імпорту середовища виконання плагіна за замовчуванням. Додайте `--runtime`, щоб завантажити модуль плагіна й включити зареєстровані гачки, інструменти, команди, сервіси, методи gateway і HTTP-маршрути. Інспекція під час роботи завершується з підказкою відновлення, коли відсутні вбудовані залежності середовища виконання; використовуйте `openclaw plugins deps --repair`, щоб явно їх відновити.

Команди CLI, що належать плагіну, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` показує команду під `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, плагін, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час роботи:

- **plain-capability** — один тип можливостей (наприклад, плагін лише постачальника)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише гачки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Докладніше про модель можливостей див. у [формах Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машиночитний звіт, придатний для сценаріїв і аудиту. `inspect --all` відображає таблицю для всього парку зі стовпцями форми, видів можливостей, повідомлень сумісності, можливостей пакетів і підсумку гачків. `info` є псевдонімом для `inspect`.
</Note>

### Лікар

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфесту/виявлення та повідомлення сумісності. Коли все чисто, він друкує `No plugin issues detected.`

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактний підсумок форми експорту в діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена в OpenClaw модель холодного читання для ідентичності встановлених плагінів, стану ввімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника постачальника, класифікація налаштування каналів та інвентар плагінів можуть читати його без імпорту модулів середовища виконання плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу плагінів, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації під час роботи.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через env призначений лише для аварійного відновлення запуску, поки міграція розгортається.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список маркетплейсу приймає локальний шлях маркетплейсу, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує розв’язану мітку джерела плюс розібраний маніфест маркетплейсу та записи плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Плагіни спільноти](/uk/plugins/community)
