---
read_when:
    - Ви хочете встановити або керувати плагінами Gateway чи сумісними пакетами
    - Ви хочете налагодити помилки завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (list, install, marketplace, uninstall, enable/disable, deps, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-05-01T07:53:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc4b2b753b541dd143e9c2f7e8a2153711a18e15773c65f91756d2729ca3d6fb
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте плагінами Gateway, наборами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення й усунення неполадок плагінів.
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

Для розслідування повільного встановлення, перевірки, видалення або оновлення реєстру запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує часові показники фаз
у stderr і зберігає JSON-вивід придатним для розбору. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
Вбудовані плагіни постачаються з OpenClaw. Деякі ввімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний плагін); інші потребують `plugins enable`.

Нативні плагіни OpenClaw повинні постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) разом із виявленими можливостями бандла.
</Note>

### Встановлення

```bash
openclaw plugins install <package>                      # ClawHub first, then npm
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

<Warning>
Голі імена пакетів спершу перевіряються в ClawHub, а потім у npm. Ставтеся до встановлення плагінів як до запуску коду. Надавайте перевагу зафіксованим версіям.
</Warning>

<Note>
ClawHub є основною поверхнею поширення та пошуку для більшості плагінів. Npm
залишається підтримуваним запасним варіантом і шляхом прямого встановлення. Під час міграції до
ClawHub OpenClaw все ще постачає деякі пакети плагінів `@openclaw/*`, що належать OpenClaw,
у npm; версії цих пакетів можуть відставати від вбудованого вихідного коду між циклами випуску
плагінів. Якщо npm повідомляє, що пакет плагіна, який належить OpenClaw, застарів, ця
опублікована версія є старим зовнішнім артефактом; використовуйте плагін, вбудований у
поточний OpenClaw, або локальну робочу копію, доки не буде опубліковано новіший пакет npm.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та відновлення після недійсної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують зміни до цього включеного файлу й залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення із сусідніми перевизначеннями завершуються закрито замість сплющення. Див. [Включення конфігурації](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо конфігурація недійсна під час встановлення, `plugins install` зазвичай завершується закрито й просить спершу виконати `openclaw doctor --fix`. Під час запуску Gateway недійсна конфігурація одного плагіна ізолюється до цього плагіна, щоб інші канали й плагіни могли продовжувати роботу; `openclaw doctor --fix` може помістити недійсний запис плагіна в карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення для вбудованих плагінів, які явно вмикають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і повторне встановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення й перезаписує вже встановлений плагін або набір хуків на місці. Використовуйте його, коли ви навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакта npm. Для звичайних оновлень уже відстежуваного плагіна npm надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється й вказує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з `--marketplace`, оскільки встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` — це аварійна опція для хибних спрацювань вбудованого сканера небезпечного коду. Вона дозволяє продовжити встановлення, навіть коли вбудований сканер повідомляє про знахідки `critical`, але вона **не** обходить блокування політики хука `before_install` плагіна й **не** обходить збої сканування.

    Цей прапорець CLI застосовується до потоків встановлення/оновлення плагінів. Встановлення залежностей skill через Gateway використовують відповідне перевизначення запиту `dangerouslyForceUnsafeInstall`, тоді як `openclaw skills install` залишається окремим потоком завантаження/встановлення skill з ClawHub.

    Якщо плагін, який ви опублікували в ClawHub, заблокований скануванням реєстру, скористайтеся кроками для видавця в [ClawHub](/uk/tools/clawhub).

  </Accordion>
  <Accordion title="Набори хуків і специфікації npm">
    `plugins install` також є поверхнею встановлення для наборів хуків, які відкривають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакетів.

    Специфікації npm є **лише реєстровими** (ім'я пакета + необов'язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконується локально в проєкті з `--ignore-scripts` задля безпеки, навіть якщо ваша оболонка має глобальні налаштування встановлення npm.

    Використовуйте `npm:<package>`, коли хочете пропустити пошук у ClawHub і встановити безпосередньо з npm. Голі специфікації пакетів усе ще надають перевагу ClawHub і відступають до npm лише тоді, коли в ClawHub немає цього пакета або версії.

    Голі специфікації та `@latest` залишаються на стабільній гілці. Якщо npm розв'язує будь-яку з них у попередній випуск, OpenClaw зупиняється й просить вас явно погодитися за допомогою тегу попереднього випуску, наприклад `@beta`/`@rc`, або точної версії попереднього випуску, наприклад `@1.2.3-beta.4`.

    Якщо гола специфікація встановлення збігається з id вбудованого плагіна (наприклад, `diffs`), OpenClaw встановлює вбудований плагін безпосередньо. Щоб установити пакет npm з такою самою назвою, використовуйте явну scoped-специфікацію (наприклад, `@scope/diffs`).

  </Accordion>
  <Accordion title="Архіви">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Архіви нативних плагінів OpenClaw повинні містити дійсний `openclaw.plugin.json` у корені розпакованого плагіна; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw записує записи встановлення.

    Встановлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Тепер OpenClaw також надає перевагу ClawHub для голих npm-безпечних специфікацій плагінів. Він відступає до npm лише тоді, коли в ClawHub немає цього пакета або версії:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб примусово застосувати розв'язання лише через npm, наприклад коли ClawHub недоступний або ви знаєте, що пакет існує лише в npm:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw завантажує архів пакета з ClawHub, перевіряє оголошену сумісність API плагіна / мінімального gateway, а потім встановлює його через звичайний архівний шлях. Записані встановлення зберігають метадані джерела ClawHub для подальших оновлень.
Неверсійовані встановлення ClawHub зберігають неверсійовану записану специфікацію, щоб `openclaw plugins update` міг слідувати за новішими випусками ClawHub; явні селектори версії або тегу, такі як `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються зафіксованими на цьому селекторі.

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
    - назва Claude known-marketplace з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення репозиторію GitHub на кшталт `owner/repo`
    - URL репозиторію GitHub на кшталт `https://github.com/owner/repo`
    - URL git

  </Tab>
  <Tab title="Правила віддаленого marketplace">
    Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає відносні джерела шляхів із цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела плагінів із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично виявляє:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex бандли (`.codex-plugin/plugin.json`)
- сумісні з Claude бандли (`.claude-plugin/plugin.json` або стандартний макет компонентів Claude)
- сумісні з Cursor бандли (`.cursor-plugin/plugin.json`)

<Note>
Сумісні бандли встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються skills бандлів, command-skills Claude, стандартні значення Claude `settings.json`, стандартні значення Claude `.lsp.json` / оголошених у маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості бандлів показуються в діагностиці/info, але ще не під'єднані до виконання в runtime.
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
  Перемкнутися з табличного подання на рядки подробиць для кожного плагіна з метаданими джерела/походження/версії/активації.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний інвентар плюс діагностика реєстру.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр плагінів, із резервним варіантом, похідним лише з маніфесту, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи плагін встановлений, увімкнений і видимий для планування холодного запуску, але це не live-перевірка середовища виконання вже запущеного процесу Gateway. Після зміни коду плагіна, увімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.
</Note>

Для роботи з вбудованими плагінами всередині упакованого Docker-образу змонтуйте
вихідний каталог плагіна поверх відповідного упакованого шляху джерела, наприклад
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване джерельне
перекриття перед `/app/dist/extensions/synology-chat`; простий скопійований
джерельний каталог лишається неактивним, тому звичайні упаковані встановлення
й надалі використовують скомпільований dist.

Для налагодження хуків середовища виконання:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки й діагностику з проходу інспекції із завантаженим модулем. Інспекція середовища виконання ніколи не завантажує відсутні вбудовані залежності середовища виконання; використовуйте `openclaw plugins deps --repair`, коли потрібне відновлення.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний Gateway, підказки щодо служби/процесу, шлях конфігурації та справність RPC.
- Невбудовані хуки розмов (`llm_input`, `llm_output`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

<Note>
`--force` не підтримується разом із `--link`, тому що пов’язані встановлення повторно використовують шлях джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, зберігаючи типову поведінку без закріплення.
</Note>

### Індекс Plugin

Метадані встановлення Plugin є станом, керованим машиною, а не користувацькою конфігурацією. Встановлення й оновлення записують їх у `plugins/installs.json` під активним каталогом стану OpenClaw. Його мапа верхнього рівня `installRecords` є довговічним джерелом метаданих встановлення, включно із записами для пошкоджених або відсутніх маніфестів плагінів. Масив `plugins` є похідним від маніфестів кешем холодного реєстру. Файл містить попередження не редагувати його та використовується `openclaw plugins update`, видаленням, діагностикою й холодним реєстром плагінів.

Коли OpenClaw бачить поставлені застарілі записи `plugins.installs` у конфігурації, він переносить їх в індекс плагінів і видаляє ключ конфігурації; якщо будь-який запис не вдається, конфігураційні записи зберігаються, щоб метадані встановлення не були втрачені.

### Залежності середовища виконання

```bash
openclaw plugins deps
openclaw plugins deps --repair
openclaw plugins deps --prune
openclaw plugins deps --json
```

`plugins deps` інспектує упакований етап залежностей середовища виконання для вбудованих плагінів, що належать OpenClaw і вибрані конфігурацією плагінів, увімкненими/налаштованими каналами, налаштованими провайдерами моделей або типовими значеннями вбудованих маніфестів. Це не шлях встановлення/оновлення для сторонніх npm-плагінів або плагінів ClawHub.

Використовуйте `--repair`, коли упаковане встановлення повідомляє про відсутні вбудовані залежності середовища виконання під час запуску Gateway або `plugins doctor`. Відновлення встановлює лише відсутні залежності увімкнених вбудованих плагінів із вимкненими lifecycle-скриптами. Використовуйте `--prune`, щоб видалити застарілі невідомі зовнішні корені залежностей середовища виконання, залишені старішими упакованими макетами.

Повний план, етапування та життєвий цикл відновлення див. у [Розв’язанні залежностей плагінів](/uk/plugins/dependency-resolution).

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагінів із `plugins.entries`, збереженого індексу плагінів, записів списків дозволів/заборон плагінів і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не задано, видалення також видаляє відстежуваний керований каталог встановлення, коли він розташований усередині кореня розширень плагінів OpenClaw. Для плагінів активної пам’яті слот пам’яті скидається до `memory-core`.

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
  <Accordion title="Розв’язання id плагіна порівняно з npm-специфікацією">
    Коли ви передаєте id плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час наступних запусків `update <id>`.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw розв’язує назву цього пакета назад до відстежуваного запису плагіна, оновлює цей встановлений плагін і записує нову npm-специфікацію для майбутніх оновлень на основі id.

    Передавання назви npm-пакета без версії або тегу також розв’язується назад до відстежуваного запису плагіна. Використовуйте це, коли плагін був закріплений на точній версії, а ви хочете повернути його до типової лінії випусків реєстру.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед live-оновленням npm OpenClaw перевіряє встановлену версію пакета за метаданими npm-реєстру. Якщо встановлена версія й записана ідентичність артефакту вже збігаються з розв’язаною ціллю, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли існує збережений хеш цілісності, а хеш отриманого артефакту змінюється, OpenClaw трактує це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` виводить очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення завершуються із закритою відмовою, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також доступний у `plugins update` як аварійне перевизначення для хибнопозитивних спрацьовувань вбудованого сканування небезпечного коду під час оновлень плагінів. Він усе одно не обходить блокування політики `before_install` плагіна або блокування через збій сканування, і застосовується лише до оновлень плагінів, а не до оновлень hook-pack.
  </Accordion>
</AccordionGroup>

### Інспекція

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Інспекція показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості пакета та будь-яку виявлену підтримку серверів MCP або LSP без типового імпорту середовища виконання плагіна. Додайте `--runtime`, щоб завантажити модуль плагіна й включити зареєстровані хуки, інструменти, команди, служби, методи Gateway і HTTP-маршрути. Інспекція середовища виконання завершується з підказкою відновлення, коли відсутні вбудовані залежності середовища виконання; використовуйте `openclaw plugins deps --repair`, щоб відновити їх явно.

Кожен плагін класифікується за тим, що він фактично реєструє в середовищі виконання:

- **plain-capability** — один тип можливості (наприклад, плагін лише провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/служби, але без можливостей

Докладніше про модель можливостей див. у [Формах Plugin](/uk/plugins/architecture#plugin-shapes).

<Note>
Прапорець `--json` виводить машинозчитуваний звіт, придатний для скриптів і аудиту. `inspect --all` відтворює таблицю для всього парку з формою, видами можливостей, повідомленнями сумісності, можливостями пакета та стовпцями зведення хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфестів/виявлення та повідомлення сумісності. Коли все чисто, він друкує `No plugin issues detected.`

Для збоїв форми модуля, як-от відсутні експорти `register`/`activate`, повторно запустіть з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб включити компактне зведення форми експорту в діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів є збереженою холодною моделлю читання OpenClaw для ідентичності встановлених плагінів, увімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу й інвентаризація плагінів можуть читати його без імпорту модулів середовища виконання плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу плагінів, політики конфігурації та метаданих маніфесту/пакета. Це шлях відновлення, а не шлях активації середовища виконання.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` є застарілим аварійним перемикачем сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; резервний варіант env призначений лише для екстреного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Список Marketplace приймає локальний шлях marketplace, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує розв’язану мітку джерела, а також розібраний маніфест marketplace і записи плагінів.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [Плагіни спільноти](/uk/plugins/community)
