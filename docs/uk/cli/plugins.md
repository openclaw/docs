---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-05-04T04:43:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36ae7edb12986ead7e126f25e0761bf312b2644b35017181b674082105886776
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin-ами Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення проблем із Plugin-ами.
  </Card>
  <Card title="Manage plugins" href="/uk/plugins/manage-plugins">
    Короткі приклади для встановлення, перегляду списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Plugin bundles" href="/uk/plugins/bundles">
    Модель сумісності бандлів.
  </Card>
  <Card title="Plugin manifest" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Security" href="/uk/gateway/security">
    Посилення безпеки для встановлень Plugin-ів.
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
Вбудовані Plugin-и постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні Plugin-и OpenClaw мають постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Детальний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) і виявлені можливості бандла.
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
Прості імена пакетів встановлюються з npm за замовчуванням під час перехідного запуску. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення Plugin-ів як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів Plugin-ів і друкує
готові до встановлення імена пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для Skills ClawHub.

<Note>
ClawHub є основною поверхнею розповсюдження й пошуку для більшості Plugin-ів. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Належні OpenClaw
пакети Plugin-ів `@openclaw/*` знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар Plugin-ів](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення та оновлення beta-каналу віддають перевагу npm `beta` dist-tag, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і залишають `openclaw.json` без змін. Кореневі includes, масиви includes та includes із сусідніми перевизначеннями завершуються закрито замість вирівнювання. Див. [Включення конфігурації](/uk/gateway/configuration) для підтримуваних форм.

    Якщо конфігурація недійсна під час встановлення, `plugins install` зазвичай завершується закрито й повідомляє, що спершу потрібно запустити `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження недійсна конфігурація Plugin-ів завершується закрито, як і будь-яка інша недійсна конфігурація; `openclaw doctor --fix` може ізолювати недійсний запис Plugin. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого Plugin для Plugin-ів, які явно погоджуються на `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений Plugin або пакет хуків на місці. Використовуйте це, коли ви свідомо перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm Plugin віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id Plugin, який уже встановлено, OpenClaw зупиняється й вказує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з встановленнями `git:`; використовуйте явне git-посилання, як-от `git:github.com/acme/plugin@v1.2.3`, коли хочете закріплене джерело. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace замість npm spec.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибнопозитивних спрацювань вбудованого сканера небезпечного коду. Вона дає змогу продовжити встановлення навіть тоді, коли вбудований сканер повідомляє про знахідки `critical`, але вона **не** обходить блокування політики хуків Plugin `before_install` і **не** обходить збої сканування.

    Цей CLI-прапорець застосовується до потоків встановлення/оновлення Plugin. Встановлення залежностей Skills через Gateway використовує відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо Plugin, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які відкривають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Npm specs є **лише реєстровими** (ім’я пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file specs і semver-діапазони відхиляються. Встановлення залежностей запускаються локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете явно вказати npm-розв’язання. Прості package specs також встановлюються напряму з npm під час перехідного запуску.

    Прості specs і `@latest` залишаються на стабільній гілці. Датовані коригувальні версії OpenClaw, як-от `2026.5.3-1`, є стабільними випусками для цієї перевірки. Якщо npm розв’язує будь-який із них до prerelease, OpenClaw зупиняється й просить вас явно погодитися за допомогою prerelease-тега, як-от `@beta`/`@rc`, або точної prerelease-версії, як-от `@1.2.3-beta.4`.

    Якщо простий spec встановлення збігається з офіційним id Plugin (наприклад, `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб встановити npm-пакет із такою самою назвою, використовуйте явний scoped spec (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Використовуйте `git:<repo>`, щоб встановити напряму з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL для клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або commit.

    Git-встановлення клонують у тимчасову директорію, переходять на запитаний ref, якщо він наявний, а потім використовують звичайний інсталятор директорії Plugin. Це означає, що валідація маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення містять URL/ref джерела та розв’язаний commit, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і CLI-команди. Якщо Plugin зареєстрував CLI-корінь через `api.registerCli`, виконайте цю команду напряму через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних Plugin-ів OpenClaw мають містити дійсний `openclaw.plugin.json` у витягнутому корені Plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Встановлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Прості npm-безпечні specs Plugin встановлюються з npm за замовчуванням під час перехідного запуску:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити npm-only розв’язання явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошену сумісність plugin API / minimum gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-pack `.tgz`, перевіряє digest-заголовок ClawHub і digest артефакту, а потім встановлює його через звичайний архівний шлях. Старіші версії ClawHub без метаданих ClawPack досі встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої метадані джерела ClawHub, тип артефакту, npm integrity, npm shasum, ім’я tarball і факти digest ClawPack для подальших оновлень.
Неверсійні встановлення ClawHub зберігають неверсійний записаний spec, щоб `openclaw plugins update` міг стежити за новішими випусками ClawHub; явні селектори версії або тега, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

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
  <Tab title="Marketplace sources">
    - назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
    - корінь локального marketplace або шлях `marketplace.json`
    - скорочення репозиторію GitHub, наприклад `owner/repo`
    - URL репозиторію GitHub, наприклад `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші джерела плагінів, що не є шляхами, з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex бандли (`.codex-plugin/plugin.json`)
- сумісні з Claude бандли (`.claude-plugin/plugin.json` або стандартний макет компонентів Claude)
- сумісні з Cursor бандли (`.cursor-plugin/plugin.json`)

<Note>
Сумісні бандли встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються навички бандлів, Claude command-skills, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, Cursor command-skills і сумісні директорії хуків Codex; інші виявлені можливості бандлів показуються в діагностиці/info, але ще не підключені до виконання під час роботи.
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
  Перемкнутися з табличного подання на деталізовані рядки для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар разом із діагностикою реєстру та станом встановлення залежностей пакетів.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр плагінів, із похідним резервним варіантом лише на основі маніфестів, якщо реєстр відсутній або недійсний. Це корисно для перевірки, чи плагін встановлено, увімкнено та видно для планування холодного запуску, але це не живий runtime-зонд уже запущеного процесу Gateway. Після зміни коду плагіна, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного плагіна з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
присутні на звичайному для плагіна шляху пошуку Node `node_modules`; він
не імпортує runtime-код плагіна, не запускає менеджер пакетів і не виправляє
відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує runtime-код плагіна. Результати пошуку
містять назву пакета ClawHub, родину, канал, версію, підсумок і
підказку щодо встановлення, наприклад `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованим плагіном усередині запакованого Docker-образу змонтуйте директорію
джерела плагіна поверх відповідного запакованого шляху джерела, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване накладання джерела
перед `/app/dist/extensions/synology-chat`; звичайна скопійована директорія джерела
залишається неактивною, тому звичайні запаковані встановлення й далі використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженням модуля. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або встановити відсутні налаштовані завантажувані плагіни.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки сервісу/процесу, шлях конфігурації та справність RPC.
- Невбудовані хуки розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальну директорію (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки пов'язані встановлення повторно використовують шлях джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв'язану точну специфікацію (`name@version`) у керованому індексі плагінів, залишаючи стандартну поведінку незакріпленою.
</Note>

### Індекс плагінів

Метадані встановлення плагінів — це стан, керований машиною, а не користувацька конфігурація. Встановлення та оновлення записують його до `plugins/installs.json` у активній директорії стану OpenClaw. Його верхньорівнева мапа `installRecords` є стійким джерелом метаданих встановлення, зокрема записів для зламаних або відсутніх маніфестів плагінів. Масив `plugins` — це похідний із маніфестів кеш холодного реєстру. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою і холодним реєстром плагінів.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, він переносить їх в індекс плагінів і видаляє ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагіна з `plugins.entries`, збереженого індексу плагінів, записів списків дозволу/заборони плагінів і пов'язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не встановлено, видалення також прибирає відстежувану керовану директорію встановлення, коли вона розташована всередині кореня розширень плагінів OpenClaw. Для плагінів активної пам'яті слот пам'яті скидається до `memory-core`.

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
  <Accordion title="Resolving plugin id vs npm spec">
    Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом плагіна, оновлює цей встановлений плагін і записує нову npm-специфікацію для майбутніх оновлень на основі id.

    Передання назви npm-пакета без версії або тега також зіставляється назад із відстежуваним записом плагіна. Використовуйте це, коли плагін було закріплено на точній версії, і ви хочете повернути його до стандартної лінії випусків реєстру.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` повторно використовує відстежувану специфікацію плагіна, якщо ви не передасте нову специфікацію. `openclaw update` додатково знає активний канал оновлення OpenClaw: на beta-каналі записи npm і плагінів ClawHub зі стандартної лінії спершу пробують `@beta`, а потім повертаються до записаної специфікації default/latest, якщо beta-випуску плагіна не існує. Точні версії та явні теги залишаються закріпленими на цьому селекторі.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Перед живим npm-оновленням OpenClaw перевіряє встановлену версію пакета відносно метаданих npm-реєстру. Якщо встановлена версія та записана ідентичність артефакта вже відповідають розв'язаній цілі, оновлення пропускається без завантаження, повторного встановлення або перезапису `openclaw.json`.

    Коли існує збережений хеш цілісності й хеш отриманого артефакта змінюється, OpenClaw трактує це як дрейф npm-артефакта. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та запитує підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються закрито, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибних спрацювань вбудованого сканування небезпечного коду під час оновлень плагінів. Він усе одно не обходить блокування політики `before_install` плагіна або блокування через помилки сканування, і застосовується лише до оновлень плагінів, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Інспекція показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості бандла та будь-яку виявлену підтримку серверів MCP або LSP без імпорту runtime плагіна за замовчуванням. Додайте `--runtime`, щоб завантажити модуль плагіна та включити зареєстровані хуки, інструменти, команди, сервіси, методи gateway і HTTP-маршрути. Runtime-інспекція повідомляє про відсутні залежності плагіна напряму; встановлення та виправлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

Команди CLI, якими володіє плагін, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду під `cliCommands`, запустіть її як `openclaw <command> ...`; наприклад, плагін, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час роботи:

- **plain-capability** — один тип можливості (наприклад, плагін лише провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Див. [Форми плагінів](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машиночитний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього парку з формою, видами можливостей, повідомленнями сумісності, можливостями бандлів і колонками підсумку хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфестів/виявлення та повідомлення сумісності. Коли все чисто, він друкує `No plugin issues detected.`

Якщо налаштований плагін присутній на диску, але заблокований перевірками безпеки шляхів завантажувача, перевірка конфігурації зберігає запис плагіна та повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого плагіна, наприклад власника шляху або дозволи world-writable, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактний підсумок форми експортів у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена в OpenClaw модель холодного читання для ідентичності встановлених плагінів, стану ввімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентар плагінів можуть читати його без імпорту runtime-модулів плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації під час виконання.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через змінну середовища призначений лише для аварійного відновлення запуску, поки міграція розгортається.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список маркетплейсу приймає локальний шлях до маркетплейсу, шлях до `marketplace.json`, скорочений запис GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` виводить визначену мітку джерела разом із розібраним маніфестом маркетплейсу та записами Plugin.

## Пов’язане

- [Створення Plugin](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні Plugin](/uk/plugins/community)
