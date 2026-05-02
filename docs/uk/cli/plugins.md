---
read_when:
    - Ви хочете встановити Plugin Gateway або керувати ними чи сумісними пакетами
    - Ви хочете діагностувати збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-05-02T19:23:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fc046a04175c1b22f787920bf5ec28c24d0bb7d62eda4d9517da8f5dbac4c50
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin для Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів з установлення, увімкнення та усунення проблем із plugins.
  </Card>
  <Card title="Керування plugins" href="/uk/plugins/manage-plugins">
    Швидкі приклади для встановлення, перегляду списку, оновлення, видалення та публікації.
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
у stderr і зберігає JSON-вивід придатним для парсингу. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані plugins постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний plugin); інші потребують `plugins enable`.

Нативні plugins OpenClaw мають постачати `openclaw.plugin.json` з вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід списку/інформації також показує підтип бандла (`codex`, `claude` або `cursor`) і виявлені можливості бандла.
</Note>

### Установлення

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
Голі назви пакетів під час перехідного запуску встановлюються з npm за замовчуванням. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення plugins як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів plugins і виводить
готові до встановлення назви пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для Skills ClawHub.

<Note>
ClawHub є основною поверхнею розповсюдження та виявлення для більшості plugins. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Під час міграції до
ClawHub OpenClaw усе ще постачає деякі пакети plugins, що належать OpenClaw, `@openclaw/*`
у npm; версії цих пакетів можуть відставати від вбудованого вихідного коду між
циклами випуску plugins. Якщо npm повідомляє, що пакет plugin, який належить OpenClaw, застарів, ця
опублікована версія є старим зовнішнім артефактом; використовуйте plugin, вбудований у
поточний OpenClaw, або локальний checkout, доки не буде опубліковано новіший пакет npm.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення після недійсної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записує зміни в цей включений файл і лишає `openclaw.json` без змін. Кореневі включення, масиви включень і включення з одноранговими перевизначеннями завершуються закрито замість вирівнювання. Див. [Включення конфігурації](/uk/gateway/configuration) для підтримуваних форм.

    Якщо під час установлення конфігурація недійсна, `plugins install` зазвичай завершується закрито й повідомляє, що спершу треба запустити `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація одного plugin ізолюється до цього plugin, щоб інші канали та plugins могли продовжувати роботу; `openclaw doctor --fix` може помістити недійсний запис plugin у карантин. Єдиний задокументований виняток під час установлення — вузький шлях відновлення для вбудованих plugins, які явно погоджуються на `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення порівняно з оновленням">
    `--force` повторно використовує наявну ціль установлення та перезаписує вже встановлений plugin або пакет хуків на місці. Використовуйте його, коли навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакта npm. Для звичайних оновлень уже відстежуваного plugin npm надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id plugin, який уже встановлено, OpenClaw зупиняється й указує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли ви справді хочете перезаписати поточну установку з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з установленнями `git:`; використовуйте явне посилання git, наприклад `git:github.com/acme/plugin@v1.2.3`, коли хочете закріпити джерело. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійний параметр для хибних спрацьовувань у вбудованому сканері небезпечного коду. Він дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але **не** обходить блокування політик хуків plugin `before_install` і **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків установлення/оновлення plugin. Встановлення залежностей Skills через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення Skills із ClawHub.

    Якщо plugin, який ви опублікували в ClawHub, заблоковано скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Пакети хуків і специфікації npm">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для фільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконується локально для проєкту з `--ignore-scripts` задля безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете явно вказати розв’язання npm. Голі специфікації пакетів також установлюються напряму з npm під час перехідного запуску.

    Голі специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв’язує будь-яку з них до prerelease, OpenClaw зупиняється й просить вас явно погодитися за допомогою prerelease-тегу, такого як `@beta`/`@rc`, або точної prerelease-версії, такої як `@1.2.3-beta.4`.

    Якщо гола специфікація встановлення збігається з офіційним id plugin (наприклад `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб установити пакет npm з такою самою назвою, використовуйте явну scoped-специфікацію (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Репозиторії Git">
    Використовуйте `git:<repo>` для встановлення напряму з репозиторію git. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед установленням перейти на гілку, тег або коміт.

    Установлення з Git клонують у тимчасовий каталог, переходять на запитаний ref, якщо він присутній, а потім використовують звичайний інсталятор каталогу plugin. Це означає, що перевірка маніфесту, сканування небезпечного коду, робота встановлення менеджера пакетів і записи встановлення поводяться як установлення npm. Записані встановлення git включають URL/ref джерела плюс розв’язаний коміт, щоб `openclaw plugins update` міг повторно розв’язати джерело пізніше.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити реєстрації часу виконання, як-от методи gateway та команди CLI. Якщо plugin зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду напряму через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних plugins OpenClaw мають містити дійсний `openclaw.plugin.json` у корені витягнутого plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Встановлення з marketplace Claude також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення з ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-сумісні специфікації plugins під час перехідного запуску встановлюються з npm за замовчуванням:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб явно вказати розв’язання лише через npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошену сумісність API plugin / мінімального gateway перед установленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версіонований npm-pack `.tgz`, перевіряє заголовок дайджесту ClawHub і дайджест артефакта, а потім установлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої метадані джерела ClawHub, тип артефакта, npm integrity, npm shasum, назву tarball і факти дайджесту ClawPack для подальших оновлень.
Неверсіоновані встановлення ClawHub зберігають неверсіоновану записану специфікацію, щоб `openclaw plugins update` міг відстежувати новіші випуски ClawHub; явні селектори версії або тегу, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими до цього селектора.

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
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення репозиторію GitHub, як-от `owner/repo`
    - URL репозиторію GitHub, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела відносних шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела плагінів із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- Codex-сумісні пакети (`.codex-plugin/plugin.json`)
- Claude-сумісні пакети (`.claude-plugin/plugin.json` або стандартне компонування компонентів Claude)
- Cursor-сумісні пакети (`.cursor-plugin/plugin.json`)

<Note>
Сумісні пакети встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються Skills пакетів, command-skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошених у маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості пакетів показуються в diagnostics/info, але ще не підключені до виконання під час runtime.
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
  Показувати лише увімкнені плагіни.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на рядки деталей для кожного плагіна з метаданими source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Машиночитний інвентар, а також діагностика registry і стан встановлення залежностей пакета.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний registry плагінів, із резервним варіантом, похідним лише з маніфесту, коли registry відсутній або недійсний. Це корисно для перевірки, чи плагін встановлено, увімкнено та видно для планування холодного запуску, але це не live runtime-перевірка вже запущеного процесу Gateway. Після зміни коду плагіна, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/container розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного плагіна з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи присутні ці назви пакетів
уздовж звичайного шляху пошуку Node `node_modules` для плагіна; він
не імпортує runtime-код плагіна, не запускає менеджер пакетів і не відновлює відсутні
залежності.
</Note>

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює config, не встановлює пакети й не завантажує runtime-код плагіна. Результати
пошуку включають назву пакета ClawHub, family, channel, version, summary та
підказку встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованими плагінами всередині упакованого Docker-образу змонтуйте bind-mount вихідний
каталог плагіна поверх відповідного упакованого вихідного шляху, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване накладання source
перед `/app/dist/extensions/synology-chat`; звичайний скопійований вихідний
каталог лишається неактивним, тож звичайні упаковані встановлення й далі використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки та діагностику з проходу інспекції із завантаженням модуля. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або встановити відсутні налаштовані завантажувані плагіни.
- `openclaw gateway status --deep --require-rpc` підтверджує досяжний Gateway, підказки service/process, шлях config і справність RPC.
- Невбудовані conversation-хуки (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується з `--link`, оскільки linked-встановлення повторно використовують вихідний шлях замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти resolved exact spec (`name@version`) у керованому індексі плагінів, зберігаючи стандартну поведінку unpinned.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це керований машиною стан, а не користувацький config. Встановлення та оновлення записують його в `plugins/installs.json` під активним каталогом стану OpenClaw. Його верхньорівнева мапа `installRecords` є довговічним джерелом метаданих встановлення, зокрема записів для пошкоджених або відсутніх маніфестів плагінів. Масив `plugins` — це похідний від маніфесту cache холодного registry. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, uninstall, diagnostics і холодним registry плагінів.

Коли OpenClaw бачить у config доставлені застарілі записи `plugins.installs`, він переносить їх в індекс плагінів і видаляє ключ config; якщо будь-який запис не вдається, записи config зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагінів із `plugins.entries`, збереженого індексу плагінів, записів allow/deny list плагінів і linked-записів `plugins.load.paths`, коли застосовно. Якщо `--keep-files` не задано, uninstall також видаляє відстежуваний керований каталог встановлення, коли він міститься всередині кореня plugin extensions OpenClaw. Для плагінів active memory слот memory скидається до `memory-core`.

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
  <Accordion title="Resolving plugin id vs npm spec">
    Коли ви передаєте plugin id, OpenClaw повторно використовує записаний install spec для цього плагіна. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні pinned-версії продовжують використовуватися під час подальших запусків `update <id>`.

    Для npm-встановлень ви також можете передати явний npm package spec із dist-tag або точною версією. OpenClaw зіставляє цю назву пакета назад із відстежуваним записом плагіна, оновлює цей встановлений плагін і записує новий npm spec для майбутніх id-based оновлень.

    Передавання назви npm-пакета без версії або тега також зіставляється назад із відстежуваним записом плагіна. Використовуйте це, коли плагін було pinned до точної версії і ви хочете повернути його до стандартної release line registry.

  </Accordion>
  <Accordion title="Beta channel updates">
    `openclaw plugins update` повторно використовує відстежуваний plugin spec, якщо ви не передасте новий spec. `openclaw update` додатково знає активний канал оновлення OpenClaw: на beta-каналі записи npm і ClawHub плагінів default-line спершу пробують `@beta`, а потім повертаються до записаного default/latest spec, якщо beta-релізу плагіна немає. Точні версії та явні теги залишаються pinned до цього selector.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Перед live npm update OpenClaw перевіряє встановлену версію пакета щодо метаданих npm registry. Якщо встановлена версія та записана ідентичність artifact уже відповідають resolved target, оновлення пропускається без завантаження, перевстановлення або переписування `openclaw.json`.

    Коли збережений integrity hash існує, а hash отриманого artifact змінюється, OpenClaw трактує це як npm artifact drift. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний hashes та просить підтвердження перед продовженням. Неінтерактивні update helpers завершуються fail-closed, якщо caller не надасть явну continuation policy.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як break-glass override для хибнопозитивних спрацювань built-in dangerous-code scan під час оновлень плагінів. Він усе одно не обходить policy blocks plugin `before_install` або блокування scan-failure і застосовується лише до оновлень плагінів, а не оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує identity, load status, source, можливості маніфесту, policy flags, diagnostics, install metadata, можливості пакета та будь-яку виявлену підтримку MCP або LSP server без стандартного імпорту runtime плагіна. Додайте `--runtime`, щоб завантажити модуль плагіна й включити зареєстровані хуки, tools, commands, services, gateway methods і HTTP routes. Runtime-інспекція повідомляє про відсутні залежності плагіна напряму; встановлення та відновлення залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, власником яких є плагін, встановлюються як кореневі групи команд `openclaw`. Після того як `inspect --runtime` показує команду в `cliCommands`, запускайте її як `openclaw <command> ...`; наприклад, плагін, який реєструє `demo-git`, можна перевірити через `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час runtime:

- **plain-capability** — один тип capability (наприклад, provider-only плагін)
- **hybrid-capability** — кілька типів capability (наприклад, text + speech + images)
- **hook-only** — лише хуки, без capabilities або surfaces
- **non-capability** — tools/commands/services, але без capabilities

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель capability.

<Note>
Прапорець `--json` виводить машиночитний звіт, придатний для scripting і auditing. `inspect --all` відображає таблицю для всього fleet зі стовпцями shape, capability kinds, compatibility notices, bundle capabilities і hook summary. `info` — псевдонім для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику manifest/discovery і compatibility notices. Коли все чисто, він друкує `No plugin issues detected.`

Для module-shape failures, як-от відсутні експорти `register`/`activate`, повторно запустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити стислий export-shape summary у diagnostic output.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний registry плагінів — це збережена холодна read model OpenClaw для identity встановлених плагінів, enablement, source metadata і contribution ownership. Звичайний startup, provider owner lookup, channel setup classification та plugin inventory можуть читати його без імпорту runtime modules плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений registry присутній, поточний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу плагінів, config policy і manifest/package metadata. Це шлях repair, а не шлях runtime activation.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант через змінну середовища призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Маркетплейс

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Команда списку маркетплейса приймає локальний шлях до маркетплейса, шлях до `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` виводить визначену мітку джерела, а також розібраний маніфест маркетплейса й записи плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Спільнотні плагіни](/uk/plugins/community)
