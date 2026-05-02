---
read_when:
    - Ви хочете встановити або керувати plugins Gateway чи сумісними пакетами
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідка CLI для `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable`/`disable`, `doctor`)
title: Плагіни
x-i18n:
    generated_at: "2026-05-02T21:59:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b077ab0739e2453ccba434aa3b02b1d441bab792b7b131216221a8048d551cd
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Gateway Plugin, пакетами hook і сумісними bundles.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення неполадок plugins.
  </Card>
  <Card title="Керування plugins" href="/uk/plugins/manage-plugins">
    Короткі приклади для встановлення, перегляду списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Plugin bundles" href="/uk/plugins/bundles">
    Модель сумісності bundle.
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

Для розслідування повільного встановлення, інспектування, видалення або оновлення registry запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує тривалість фаз
до stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані plugins постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний plugin); інші потребують `plugins enable`.

Нативні OpenClaw plugins мають постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні bundles натомість використовують власні маніфести bundle.

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
Голі назви пакетів встановлюються з npm за замовчуванням під час перехідного запуску. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення plugins як до запуску коду. Віддавайте перевагу закріпленим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів plugin і виводить
готові до встановлення назви пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для ClawHub skills.

<Note>
ClawHub є основною поверхнею розповсюдження та пошуку для більшості plugins. Npm
залишається підтримуваним запасним і прямим шляхом встановлення. Пакети plugin
`@openclaw/*`, що належать OpenClaw, знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або в
[інвентарі plugin](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення й оновлення beta-каналу віддають перевагу npm dist-tag `beta`, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення після недійсної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни в цей включений файл і залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються закрито замість сплющення. Див. [Включення конфігурації](/uk/gateway/configuration) для підтримуваних форм.

    Якщо конфігурація недійсна під час встановлення, `plugins install` зазвичай завершується закрито й повідомляє, що спочатку потрібно запустити `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація одного plugin ізолюється до цього plugin, щоб інші канали та plugins могли продовжувати роботу; `openclaw doctor --fix` може помістити недійсний запис plugin у карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення для вбудованих plugins, які явно погоджуються на `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і повторне встановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений plugin або пакет hook на місці. Використовуйте його, коли ви навмисно повторно встановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакта npm. Для звичайних оновлень уже відстежуваного npm plugin віддавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id plugin, який уже встановлено, OpenClaw зупиняється та спрямовує вас до `plugins update <id-or-npm-spec>` для звичайного оновлення або до `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з встановленнями `git:`; використовуйте явний git ref, наприклад `git:github.com/acme/plugin@v1.2.3`, коли вам потрібне закріплене джерело. Він не підтримується з `--marketplace`, оскільки встановлення marketplace зберігають метадані джерела marketplace замість специфікації npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний параметр для хибних спрацьовувань у вбудованому сканері небезпечного коду. Він дозволяє встановленню продовжитися, навіть коли вбудований сканер повідомляє про знахідки `critical`, але **не** обходить блокування політики hook `before_install` plugin і **не** обходить помилки сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення plugin. Встановлення залежностей skill, підтримувані Gateway, використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення skill з ClawHub.

    Якщо plugin, який ви опублікували на ClawHub, заблоковано скануванням registry, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети hook і специфікації npm">
    `plugins install` також є поверхнею встановлення для пакетів hook, які відкривають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості hook і ввімкнення окремих hook, а не для встановлення пакетів.

    Специфікації npm є **лише registry** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконуються локально в проєкті з `--ignore-scripts` задля безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете зробити розв’язання npm явним. Голі специфікації пакетів також встановлюються безпосередньо з npm під час перехідного запуску.

    Голі специфікації та `@latest` залишаються на стабільному треку. Якщо npm розв’язує будь-яку з них у prerelease, OpenClaw зупиняється й просить вас явно погодитися за допомогою prerelease-тега, наприклад `@beta`/`@rc`, або точної prerelease-версії, наприклад `@1.2.3-beta.4`.

    Якщо гола специфікація встановлення збігається з офіційним id plugin (наприклад `diffs`), OpenClaw встановлює запис каталогу безпосередньо. Щоб встановити пакет npm з такою самою назвою, використовуйте явну scoped-специфікацію (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-репозиторії">
    Використовуйте `git:<repo>` для встановлення безпосередньо з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або commit.

    Git-встановлення клонують у тимчасову директорію, переходять на запитаний ref, якщо він є, а потім використовують звичайний інсталятор директорії plugin. Це означає, що перевірка маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як npm-встановлення. Записані git-встановлення містять вихідний URL/ref і розв’язаний commit, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і команди CLI. Якщо plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду безпосередньо через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних OpenClaw plugin мають містити дійсний `openclaw.plugin.json` у витягнутому корені plugin; архіви, які містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Встановлення Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-безпечні специфікації plugin встановлюються з npm за замовчуванням під час перехідного запуску:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити розв’язання лише через npm явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошену сумісність plugin API / мінімальну сумісність gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версіонований npm-pack `.tgz`, перевіряє заголовок digest ClawHub і digest артефакта, а потім встановлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої метадані джерела ClawHub, тип артефакта, цілісність npm, shasum npm, назву tarball і факти digest ClawPack для подальших оновлень.
Неверсіоновані встановлення ClawHub зберігають неверсіоновану записану специфікацію, щоб `openclaw plugins update` міг відстежувати новіші випуски ClawHub; явні селектори версії або тегу, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими на цьому селекторі.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші registry Claude за адресою `~/.claude/plugins/known_marketplaces.json`:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Використовуйте `--marketplace`, коли хочете передати джерело marketplace явно:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Джерела marketplace">
    - назва відомого marketplace Claude з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення репозиторію GitHub, як-от `owner/repo`
    - URL репозиторію GitHub, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи Plugin мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела Plugin із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні Plugin OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex пакети (`.codex-plugin/plugin.json`)
- сумісні з Claude пакети (`.claude-plugin/plugin.json` або стандартну структуру компонентів Claude)
- сумісні з Cursor пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь Plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакетів, command-skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошених у маніфесті `lspServers`, command-skills Cursor і сумісні каталоги hook Codex; інші виявлені можливості пакетів показуються в діагностиці/info, але ще не підключені до виконання під час роботи.
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
  Перемкнутися з табличного подання на рядки деталей для кожного Plugin із метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар, а також діагностика реєстру й стан встановлення залежностей пакета.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр Plugin, із резервним варіантом, виведеним лише з маніфестів, коли реєстр відсутній або недійсний. Це корисно, щоб перевірити, чи Plugin встановлений, увімкнений і видимий для планування холодного запуску, але це не live-зонд процесу Gateway, який уже працює. Після зміни коду Plugin, стану ввімкнення, політики hook або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати виконання нового коду `register(api)` або hook. Для віддалених/контейнерних розгортань перевірте, що перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного Plugin з `dependencies` і `optionalDependencies` у `package.json`. OpenClaw перевіряє, чи ці назви пакетів присутні вздовж звичайного для Plugin шляху пошуку Node `node_modules`; він не імпортує runtime-код Plugin, не запускає менеджер пакетів і не виправляє відсутні залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує runtime-код Plugin. Результати пошуку містять назву пакета ClawHub, сімейство, канал, версію, короткий опис і підказку для встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованими Plugin усередині запакованого Docker-образу змонтуйте вихідний каталог Plugin поверх відповідного запакованого шляху до джерел, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване накладання джерел перед `/app/dist/extensions/synology-chat`; просто скопійований каталог джерел залишиться неактивним, тому звичайні запаковані встановлення й далі використовуватимуть скомпільований dist.

Для налагодження runtime hook:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані hook і діагностику з проходу інспекції із завантаженням модуля. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або встановити відсутні налаштовані завантажувані Plugin.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо сервісу/процесу, шлях до конфігурації та справність RPC.
- Невбудовані hook розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, тому що зв’язані встановлення повторно використовують шлях до джерел замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти вирішену точну специфікацію (`name@version`) у керованому індексі Plugin, залишаючи типову поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це машинно керований стан, а не користувацька конфігурація. Встановлення й оновлення записують його до `plugins/installs.json` в активному каталозі стану OpenClaw. Його верхньорівнева мапа `installRecords` є тривалим джерелом метаданих встановлення, включно із записами для пошкоджених або відсутніх маніфестів Plugin. Масив `plugins` — це виведений із маніфестів кеш холодного реєстру. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою й холодним реєстром Plugin.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, він переносить їх до індексу Plugin і вилучає ключ конфігурації; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не були втрачені.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` вилучає записи Plugin з `plugins.entries`, збереженого індексу Plugin, записів списку дозволів/заборон Plugin і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не задано, видалення також вилучає відстежуваний керований каталог встановлення, коли він розташований усередині кореня розширень Plugin OpenClaw. Для Plugin активної пам’яті слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень Plugin у керованому індексі Plugin і відстежуваних встановлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Вирішення id Plugin і npm spec">
    Коли ви передаєте id Plugin, OpenClaw повторно використовує записану специфікацію встановлення для цього Plugin. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії надалі використовуються під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє цю назву пакета з відстежуваним записом Plugin, оновлює цей встановлений Plugin і записує нову npm-специфікацію для майбутніх оновлень на основі id.

    Передавання назви npm-пакета без версії або тегу також зіставляється з відстежуваним записом Plugin. Використовуйте це, коли Plugin був закріплений на точній версії, а ви хочете повернути його до стандартної лінії випусків реєстру.

  </Accordion>
  <Accordion title="Оновлення beta-каналу">
    `openclaw plugins update` повторно використовує відстежувану специфікацію Plugin, якщо ви не передасте нову специфікацію. `openclaw update` додатково знає активний канал оновлень OpenClaw: на beta-каналі записи npm і ClawHub Plugin стандартної лінії спершу пробують `@beta`, а потім повертаються до записаної стандартної/latest специфікації, якщо beta-випуску Plugin не існує. Точні версії та явні теги залишаються закріпленими за цим селектором.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед live-оновленням npm OpenClaw перевіряє встановлену версію пакета за метаданими npm-реєстру. Якщо встановлена версія й записана ідентичність артефакту вже збігаються з вирішеною ціллю, оновлення пропускається без завантаження, повторного встановлення або перезапису `openclaw.json`.

    Коли існує збережений hash цілісності, а hash отриманого артефакту змінюється, OpenClaw трактує це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний hashes та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються із закритою відмовою, якщо викликач не надасть явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибних спрацьовувань вбудованого сканування небезпечного коду під час оновлень Plugin. Він усе одно не обходить блокування політики `before_install` Plugin або блокування через збій сканування, і застосовується лише до оновлень Plugin, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості пакетів і будь-яку виявлену підтримку серверів MCP або LSP, типово без імпорту runtime-коду Plugin. Додайте `--runtime`, щоб завантажити модуль Plugin і включити зареєстровані hook, tools, commands, services, gateway methods і HTTP routes. Runtime-інспекція прямо повідомляє про відсутні залежності Plugin; встановлення й виправлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, що належать Plugin, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, Plugin, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен Plugin класифікується за тим, що він фактично реєструє під час роботи:

- **plain-capability** — один тип можливостей (наприклад, Plugin лише для provider)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише hook, без можливостей або surface
- **non-capability** — tools/commands/services, але без можливостей

Докладніше про модель можливостей див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машиночитний звіт, придатний для скриптів і аудиту. `inspect --all` відображає таблицю для всього парку зі shape, видами можливостей, повідомленнями сумісності, можливостями пакетів і колонками зведення hook. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження Plugin, діагностику маніфесту/виявлення та повідомлення сумісності. Коли все чисто, він друкує `No plugin issues detected.`

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб додати до діагностичного виводу компактне зведення форми експортів.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр Plugin — це збережена в OpenClaw холодна модель читання для ідентичності встановлених Plugin, стану ввімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника provider, класифікація налаштування каналу та інвентар Plugin можуть читати його без імпорту runtime-модулів Plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр присутній, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу Plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях виправлення, а не шлях runtime-активації.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний env-механізм призначений лише для аварійного відновлення запуску, поки міграція розгортається.
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
- [Plugin спільноти](/uk/plugins/community)
