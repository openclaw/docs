---
read_when:
    - Ви хочете встановити плагіни Gateway чи сумісні пакети або керувати ними
    - Ви хочете створити каркас або перевірити простий Plugin інструмента
    - Ви хочете налагодити збої завантаження Plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-27T17:22:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте плагінами Gateway, пакетами хуків і сумісними бандлами.

<CardGroup cols={2}>
  <Card title="Система Plugin" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення неполадок плагінів.
  </Card>
  <Card title="Керування плагінами" href="/uk/plugins/manage-plugins">
    Короткі приклади для встановлення, перегляду списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Бандли Plugin" href="/uk/plugins/bundles">
    Модель сумісності бандлів.
  </Card>
  <Card title="Маніфест Plugin" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Безпека" href="/uk/gateway/security">
    Посилення безпеки для встановлення плагінів.
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
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Для дослідження повільного встановлення, інспектування, видалення або оновлення реєстру запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для розбору. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
У режимі Nix (`OPENCLAW_NIX_MODE=1`) мутаторів життєвого циклу плагінів вимкнено. Використовуйте джерело Nix для цього встановлення замість `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` або `plugins disable`; для nix-openclaw використовуйте агент-орієнтований [Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Вбудовані плагіни постачаються з OpenClaw. Деякі з них увімкнені за замовчуванням (наприклад, вбудовані постачальники моделей, вбудовані постачальники мовлення та вбудований браузерний плагін); інші потребують `plugins enable`.

Нативні плагіни OpenClaw мають постачати `openclaw.plugin.json` із вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні бандли натомість використовують власні маніфести бандлів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Детальний вивід list/info також показує підтип бандла (`codex`, `claude` або `cursor`) плюс виявлені можливості бандла.
</Note>

### Автор

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` за замовчуванням створює мінімальний інструментальний плагін TypeScript. Перший
аргумент — це id плагіна; передайте `--name` для відображуваної назви. OpenClaw використовує
id для стандартного вихідного каталогу та іменування пакета. Заготовки інструментів використовують
`defineToolPlugin`.
`plugins build` імпортує зібрану точку входу, читає її статичні метадані інструменту, записує
`openclaw.plugin.json` і підтримує `package.json` `openclaw.extensions` узгодженим.
`plugins validate` перевіряє, що згенерований маніфест, метадані пакета та
поточний експорт точки входу все ще узгоджуються. Див. [Плагіни інструментів](/uk/plugins/tool-plugins), щоб переглянути
повний робочий процес для авторів інструментів.

Заготовка записує вихідний код TypeScript, але генерує метадані зі зібраної
точки входу `./dist/index.js`, тому робочий процес також працює з опублікованим CLI. Використовуйте
`--entry <path>`, коли точка входу не є стандартною точкою входу пакета. Використовуйте
`plugins build --check` у CI, щоб отримувати помилку, коли згенеровані метадані застаріли, без
перезапису файлів.

### Заготовка постачальника

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Заготовки постачальника створюють універсальний текстовий/модельний плагін постачальника з OpenAI-сумісною
інфраструктурою API-ключів, вбудованим скриптом `npm run validate` для `clawhub package
validate`, метаданими пакета ClawHub і вручну запущуваним робочим процесом GitHub
для майбутньої довіреної публікації через GitHub Actions OIDC. Заготовки постачальника
не генерують Skills і не використовують `openclaw plugins build` або
`openclaw plugins validate`; ці команди призначені для шляху згенерованих метаданих
заготовки інструменту.

Перед публікацією замініть заповнювач базової URL-адреси API, каталог моделей, маршрут документації,
текст облікових даних і текст README реальними даними постачальника. Використовуйте
згенерований README для першої публікації в ClawHub і налаштування довіреного видавця.

### Встановлення

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Мейнтейнери, які тестують встановлення під час налаштування, можуть перевизначати автоматичні джерела встановлення плагінів
за допомогою захищених змінних середовища. Див.
[Перевизначення встановлення плагінів](/uk/plugins/install-overrides).

<Warning>
Голі назви пакетів під час перехідного запуску за замовчуванням встановлюються з npm, якщо вони не збігаються з офіційним id плагіна. Необроблені специфікації пакетів `@openclaw/*`, що збігаються з вбудованими плагінами, використовують вбудовану копію, яка постачалася з поточною збіркою OpenClaw. Використовуйте `npm:<package>`, коли навмисно потрібен зовнішній npm-пакет. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення плагінів як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів плагінів і друкує
готові до встановлення назви пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не skills. Використовуйте `openclaw skills search` для Skills у ClawHub.

<Note>
ClawHub є основною поверхнею розповсюдження та виявлення для більшості плагінів. Npm
залишається підтримуваним резервним варіантом і шляхом прямого встановлення. Належні OpenClaw
пакети плагінів `@openclaw/*` знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар плагінів](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення й оновлення beta-каналу віддають перевагу npm `beta` dist-tag, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Включення конфігурації та виправлення недійсної конфігурації">
    Якщо ваш розділ `plugins` підтримується однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують у цей включений файл і залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються закрито замість вирівнювання. Див. [Включення конфігурації](/uk/gateway/configuration) щодо підтримуваних форм.

    Якщо конфігурація недійсна під час встановлення, `plugins install` зазвичай завершується закрито й повідомляє, що спершу потрібно запустити `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження недійсна конфігурація плагіна завершується закрито, як і будь-яка інша недійсна конфігурація; `openclaw doctor --fix` може помістити недійсний запис плагіна в карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого плагіна для плагінів, які явно ввімкнули `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force і перевстановлення проти оновлення">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений плагін або пакет хуків на місці. Використовуйте це, коли ви навмисно перевстановлюєте той самий id з нового локального шляху, архіву, пакета ClawHub або артефакта npm. Для звичайних оновлень уже відстежуваного npm-плагіна надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для id плагіна, який уже встановлено, OpenClaw зупиняється та вказує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли справді потрібно перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="Область дії --pin">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з установленнями `git:`; використовуйте явне git-посилання, наприклад `git:github.com/acme/plugin@v1.2.3`, коли потрібно закріплене джерело. Він не підтримується з `--marketplace`, оскільки marketplace-встановлення зберігають метадані джерела marketplace замість npm-специфікації.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` застарів і тепер нічого не робить. OpenClaw більше не запускає вбудоване блокування небезпечного коду під час встановлення плагінів.

    Використовуйте спільну поверхню `security.installPolicy`, якою володіє оператор, коли потрібна політика встановлення, специфічна для хоста. Хуки Plugin `before_install` є хуками життєвого циклу runtime плагіна й не є основною межею політики для встановлень CLI.

    Якщо плагін, який ви опублікували в ClawHub, приховано або заблоковано скануванням реєстру, скористайтеся кроками видавця в [Публікація ClawHub](/uk/clawhub/publishing). `--dangerously-force-unsafe-install` не просить ClawHub повторно просканувати плагін або зробити заблокований реліз публічним.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Встановлення зі спільноти ClawHub перевіряють запис довіри вибраного релізу перед завантаженням пакета. Якщо ClawHub вимикає завантаження для релізу, повідомляє про шкідливі результати сканування або переводить реліз у блокувальний стан модерації, наприклад карантин, OpenClaw відхиляє реліз. Для неблокувальних ризикових статусів сканування, ризикових станів модерації або причин реєстру OpenClaw показує деталі довіри та запитує підтвердження перед продовженням.

    Використовуйте `--acknowledge-clawhub-risk` лише після перегляду попередження ClawHub і рішення продовжити без інтерактивного запиту. Очікувані або застарілі чисті записи довіри попереджають, але не потребують підтвердження. Офіційні пакети ClawHub і вбудовані джерела плагінів OpenClaw обходять цей запит довіри до релізу.

  </Accordion>
  <Accordion title="Пакети хуків і специфікації npm">
    `plugins install` також є поверхнею встановлення для пакетів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакета.

    Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Git/URL/file-специфікації та діапазони semver відхиляються. Встановлення залежностей виконуються в одному керованому npm-проєкті на плагін з `--ignore-scripts` для безпеки, навіть якщо у вашій оболонці є глобальні налаштування npm install. Керовані npm-проєкти плагінів успадковують npm `overrides` рівня пакета OpenClaw, тому захисні закріплення хоста застосовуються і до піднятих залежностей плагінів.

    Використовуйте `npm:<package>`, коли хочете зробити npm-резолюцію явною. Голі специфікації пакетів також встановлюються напряму з npm під час перехідного запуску, якщо вони не збігаються з офіційним id плагіна.

    Сирі специфікації пакетів `@openclaw/*`, які відповідають вбудованим плагінам, спершу розв’язуються до вбудованої копії, що належить образу, перед резервним переходом до npm. Наприклад, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` використовує вбудований плагін Discord із поточної збірки OpenClaw замість створення керованого перевизначення npm. Щоб примусово використати зовнішній пакет npm, скористайтеся `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Специфікації без префікса та `@latest` залишаються на стабільній гілці. Версії виправлень OpenClaw із датованими позначками, як-от `2026.5.3-1`, для цієї перевірки є стабільними релізами. Якщо npm розв’язує будь-яку з них до попереднього релізу, OpenClaw зупиняється й просить вас явно погодитися за допомогою тегу попереднього релізу, як-от `@beta`/`@rc`, або точної версії попереднього релізу, як-от `@1.2.3-beta.4`.

    Для встановлень npm без точної версії (`npm:<package>` або `npm:<package>@latest`) OpenClaw перевіряє розв’язані метадані пакета перед встановленням. Якщо найновіший стабільний пакет потребує новішого API плагінів OpenClaw або мінімальної версії хоста, OpenClaw перевіряє старіші стабільні версії та натомість встановлює найновіший сумісний реліз. Точні версії та явні dist-теги, як-от `@beta`, залишаються строгими: якщо вибраний пакет несумісний, команда завершується помилкою й просить вас оновити OpenClaw або вибрати сумісну версію.

    Якщо специфікація встановлення без префікса відповідає офіційному ідентифікатору плагіна (наприклад `diffs`), OpenClaw встановлює запис каталогу напряму. Щоб встановити пакет npm із такою самою назвою, використовуйте явну специфікацію з областю видимості (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Використовуйте `git:<repo>` для встановлення безпосередньо з git-репозиторію. Підтримувані форми включають URL клонування `git:github.com/owner/repo`, `git:owner/repo`, повні `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або коміт.

    Git-встановлення клонують у тимчасовий каталог, переходять на запитаний ref, якщо його вказано, а потім використовують звичайний інсталятор каталогу плагіна. Це означає, що валідація маніфесту, політика встановлення оператора, робота встановлення менеджера пакетів і записи встановлення поводяться як встановлення npm. Записані git-встановлення включають URL/ref джерела плюс розв’язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити реєстрації runtime, як-от методи gateway і команди CLI. Якщо плагін зареєстрував корінь CLI через `api.registerCli`, виконайте цю команду безпосередньо через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Нативні архіви плагінів OpenClaw мають містити валідний `openclaw.plugin.json` у витягнутому корені плагіна; архіви, які містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Використовуйте `npm-pack:<path.tgz>`, коли файл є tarball npm-pack і ви хочете
    протестувати той самий шлях керованого npm-проєкту для кожного плагіна, який використовують
    встановлення з реєстру, включно з перевіркою `package-lock.json`, скануванням піднятих залежностей
    і записами встановлення npm. Звичайні шляхи архівів усе ще встановлюються як локальні
    архіви під коренем розширень плагінів.

    Встановлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний локатор `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Під час перехідного періоду запуску специфікації плагінів без префікса, безпечні для npm, типово встановлюються з npm, якщо вони не відповідають офіційному ідентифікатору плагіна:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб зробити розв’язання лише через npm явним:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє оголошену сумісність API плагіна / мінімального gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-pack `.tgz`, перевіряє digest-заголовок ClawHub і digest артефакту, а потім встановлює його через звичайний шлях архівів. Старіші версії ClawHub без метаданих ClawPack усе ще встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої метадані джерела ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і факти digest ClawPack для подальших оновлень.
Неверсійні встановлення ClawHub зберігають неверсійну записану специфікацію, щоб `openclaw plugins update` міг стежити за новішими релізами ClawHub; явні селектори версії або тегу, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

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
    Для віддалених marketplace, завантажених із GitHub або git, записи плагінів мають залишатися всередині клонованого репозиторію marketplace. OpenClaw приймає джерела з відносними шляхами з цього репозиторію та відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела плагінів із віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні плагіни OpenClaw (`openclaw.plugin.json`)
- сумісні з Codex бандли (`.codex-plugin/plugin.json`)
- сумісні з Claude бандли (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- сумісні з Cursor бандли (`.cursor-plugin/plugin.json`)

Керовані локальні встановлення мають бути каталогами або архівами плагінів. Окремі файли плагінів `.js`,
`.mjs`, `.cjs` і `.ts` не копіюються в керований корінь плагінів командою `plugins install`; натомість явно перелічіть їх у `plugins.load.paths`.

<Note>
Сумісні бандли встановлюються у звичайний корінь плагінів і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle skills, command-skills Claude, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, command-skills Cursor і сумісні каталоги хуків Codex; інші виявлені можливості бандлів показуються в diagnostics/info, але ще не підключені до runtime-виконання.
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
  Перемкнутися з табличного подання на детальні рядки для кожного плагіна з метаданими source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний інвентар плюс діагностика реєстру та стан встановлення залежностей пакета.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр плагінів, із резервним варіантом, виведеним лише з маніфестів, коли реєстр відсутній або невалідний. Це корисно для перевірки, чи плагін встановлений, увімкнений і видимий для планування холодного запуску, але це не живий runtime-зонд уже запущеного процесу Gateway. Після зміни коду плагіна, стану ввімкнення, політики хуків або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати запуску нового коду `register(api)` або хуків. Для віддалених/контейнерних розгортань перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише процес-обгортку.

`plugins list --json` включає `dependencyStatus` кожного плагіна з `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи присутні ці назви пакетів
уздовж звичайного шляху пошуку Node `node_modules` для плагіна; він
не імпортує runtime-код плагіна, не запускає менеджер пакетів і не виправляє відсутні
залежності.
</Note>

Якщо журнали запуску містять `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
запустіть `openclaw plugins list --enabled --verbose` або
`openclaw plugins inspect <id>` із переліченим ідентифікатором плагіна, щоб підтвердити
ідентифікатори плагінів і скопіювати довірені ідентифікатори в `plugins.allow` у `openclaw.json`. Коли
попередження може перелічити кожен виявлений плагін, воно друкує готовий до вставлення
фрагмент `plugins.allow`, який уже містить ці ідентифікатори. Якщо плагін завантажується
без походження встановлення/шляху завантаження, перевірте цей ідентифікатор плагіна, а потім або закріпіть
довірений ідентифікатор у `plugins.allow`, або перевстановіть плагін із довіреного джерела,
щоб OpenClaw записав походження встановлення.

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює конфігурацію, не встановлює пакети й не завантажує runtime-код плагіна. Результати
пошуку включають назву пакета ClawHub, сімейство, канал, версію, резюме та
підказку для встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованими плагінами всередині запакованого Docker-образу змонтуйте bind-mount каталогу
джерела плагіна поверх відповідного запакованого шляху джерела, як-от
`/app/extensions/synology-chat`. OpenClaw виявить це змонтоване перекриття джерела
перед `/app/dist/extensions/synology-chat`; звичайний скопійований каталог джерела
залишається неактивним, тож звичайні запаковані встановлення все ще використовують скомпільований dist.

Для налагодження runtime-хуків:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані хуки й діагностику з проходу інспекції завантаженого модуля. Runtime-інспекція ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або відновити відсутні завантажувані плагіни, на які посилається конфігурація.
- `openclaw gateway status --deep --require-rpc` підтверджує доступний URL/profile Gateway, підказки service/process, шлях конфігурації та стан RPC.
- Невбудовані хуки розмов (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб не копіювати локальний каталог плагіна (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Окремі файли плагінів потрібно перелічувати в `plugins.load.paths`, а не
встановлювати через `plugins install` чи розміщувати безпосередньо в `~/.openclaw/extensions`
або `<workspace>/.openclaw/extensions`. Ці автоматично виявлені корені завантажують каталоги
пакетів або бандлів плагінів, тоді як script-файли верхнього рівня вважаються локальними
помічниками й пропускаються.

<Note>
Workspace-origin plugins, виявлені з кореня розширень робочої області, не
імпортуються й не виконуються, доки їх явно не ввімкнено. Для локальної розробки
запустіть `openclaw plugins enable <plugin-id>` або встановіть
`plugins.entries.<plugin-id>.enabled: true`; якщо ваша конфігурація використовує
`plugins.allow`, також додайте туди той самий plugin id. Це правило відмови із
закриттям доступу також застосовується, коли налаштування каналу явно націлюється
на workspace-origin plugin для завантаження лише під час налаштування, тому код
налаштування локального channel plugin не запускатиметься, доки цей workspace
plugin залишається вимкненим або виключеним зі списку дозволених. Пов’язані
встановлення й явні записи `plugins.load.paths` дотримуються звичайної політики
для їхнього визначеного походження plugin. Див.
[Налаштування політики plugin](/uk/tools/plugin#configure-plugin-policy)
і [Довідник конфігурації](/uk/gateway/configuration-reference#plugins).

`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях до джерела замість копіювання в керовану ціль встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти визначену точну специфікацію (`name@version`) у керованому індексі plugin, залишаючи типову поведінку незакріпленою.
</Note>

### Індекс Plugin

Метадані встановлення Plugin — це керований системою стан, а не користувацька конфігурація. Встановлення й оновлення записують його до спільної бази стану SQLite в активному каталозі стану OpenClaw. Рядок `installed_plugin_index` зберігає довговічні метадані `installRecords`, зокрема записи для пошкоджених або відсутніх маніфестів plugin, а також похідний від маніфесту холодний кеш реєстру, який використовують `openclaw plugins update`, видалення, діагностика та холодний реєстр plugin.

Коли OpenClaw бачить у конфігурації доставлені застарілі записи `plugins.installs`, runtime-читання трактують їх як сумісний вхід без перезапису `openclaw.json`. Явні записи plugin і `openclaw doctor --fix` переносять ці записи в індекс plugin і видаляють ключ конфігурації, коли записи конфігурації дозволені; якщо будь-який запис не вдається, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи plugin з `plugins.entries`, збереженого індексу plugin, записів списків дозволу/заборони plugin і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не встановлено, видалення також прибирає відстежуваний керований каталог встановлення, коли він розташований усередині кореня plugin-розширень OpenClaw. Для active memory plugins слот пам’яті скидається до `memory-core`.

<Note>
`--keep-config` підтримується як застарілий псевдонім для `--keep-files`.
</Note>

### Оновлення

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Оновлення застосовуються до відстежуваних встановлень plugin у керованому індексі plugin і відстежуваних встановлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Визначення plugin id або npm spec">
    Коли ви передаєте plugin id, OpenClaw повторно використовує записану специфікацію встановлення для цього plugin. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії надалі використовуються під час наступних запусків `update <id>`.

    Це правило цільового оновлення відрізняється від масового шляху обслуговування `openclaw plugins update --all`. Масові оновлення все ще враховують звичайні відстежувані специфікації встановлення, але записи довірених офіційних OpenClaw plugin можуть синхронізуватися з поточною ціллю офіційного каталогу замість того, щоб залишатися на застарілому точному офіційному пакеті. Використовуйте цільове `update <id>`, коли навмисно хочете залишити точну або теговану офіційну специфікацію без змін.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw зіставляє назву цього пакета з відстежуваним записом plugin, оновлює цей встановлений plugin і записує нову npm-специфікацію для майбутніх оновлень за id.

    Передавання назви npm-пакета без версії або тегу також зіставляється з відстежуваним записом plugin. Використовуйте це, коли plugin було закріплено на точній версії, а ви хочете повернути його до типової лінії випусків реєстру.

  </Accordion>
  <Accordion title="Оновлення beta-каналу">
    Цільове `openclaw plugins update <id-or-npm-spec>` повторно використовує відстежувану специфікацію plugin, якщо ви не передасте нову специфікацію. Масове `openclaw plugins update --all` використовує налаштований `update.channel`, коли синхронізує записи довірених офіційних plugin з ціллю офіційного каталогу, тому встановлення beta-каналу можуть залишатися на beta-лінії випусків замість тихої нормалізації до stable/latest.

    `openclaw update` також знає активний канал оновлення OpenClaw: на beta-каналі записи npm і ClawHub plugin типової лінії спочатку пробують `@beta`. Вони повертаються до записаної специфікації default/latest, якщо beta-випуску plugin не існує; npm plugins також повертаються назад, коли beta-пакет існує, але не проходить перевірку встановлення. Таке повернення повідомляється як попередження і не призводить до збою оновлення ядра. Точні версії та явні теги залишаються закріпленими за цим селектором для цільових оновлень.

  </Accordion>
  <Accordion title="Перевірки версій і дрейф цілісності">
    Перед живим npm-оновленням OpenClaw перевіряє встановлену версію пакета за метаданими npm-реєстру. Якщо встановлена версія й записана ідентичність артефакту вже збігаються з визначеною ціллю, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли існує збережений хеш цілісності, а хеш отриманого артефакту змінюється, OpenClaw трактує це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення відмовляють із закриттям доступу, якщо викликач не надасть явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install під час оновлення">
    `--dangerously-force-unsafe-install` також приймається в `plugins update` для сумісності, але він застарілий і більше не змінює поведінку оновлення plugin. Операторський `security.installPolicy` усе ще може блокувати оновлення; hooks `before_install` plugin застосовуються лише в процесах, де завантажено hooks plugin.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk під час оновлення">
    Оновлення спільнотних plugin на основі ClawHub виконують ту саму перевірку довіри до точного випуску, що й встановлення, перед завантаженням пакета-замінника. Використовуйте `--acknowledge-clawhub-risk` для перевіреної автоматизації, яка має продовжуватися, коли вибраний випуск ClawHub має ризиковане попередження довіри. Офіційні пакети ClawHub і вбудовані джерела OpenClaw plugin обходять цей запит довіри до випуску.
  </Accordion>
</AccordionGroup>

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, стан завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості bundle і будь-яку виявлену підтримку MCP або LSP server без імпорту runtime plugin за замовчуванням. JSON-вивід містить контракти маніфесту plugin, як-от `contracts.agentToolResultMiddleware` і `contracts.trustedToolPolicies`, щоб оператори могли перевіряти декларації довірених поверхонь перед увімкненням або перезапуском plugin. Додайте `--runtime`, щоб завантажити модуль plugin і включити зареєстровані hooks, tools, commands, services, gateway methods і HTTP routes. Runtime-перевірка прямо повідомляє про відсутні залежності plugin; встановлення й ремонти залишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

CLI-команди, що належать plugin, зазвичай встановлюються як кореневі групи команд `openclaw`, але plugins також можуть реєструвати вкладені команди під батьківською командою ядра, наприклад `openclaw nodes`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запустіть її за вказаним шляхом; наприклад, plugin, який реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен plugin класифікується за тим, що він фактично реєструє під час runtime:

- **plain-capability** — один тип можливості (наприклад, provider-only plugin)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише hooks, без можливостей або поверхонь
- **non-capability** — tools/commands/services, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машинозчитуваний звіт, придатний для сценаріїв і аудиту. `inspect --all` відображає таблицю для всього парку з колонками форми, типів можливостей, повідомлень сумісності, можливостей bundle і зведення hooks. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження plugin, діагностику маніфесту/виявлення, повідомлення сумісності та застарілі посилання конфігурації plugin, як-от відсутні слоти plugin. Коли дерево встановлення й конфігурація plugin чисті, він друкує `No plugin issues detected.` Якщо застаріла конфігурація залишається, але дерево встановлення в іншому здорове, підсумок говорить саме це, а не натякає на повне здоров’я plugin.

Якщо налаштований plugin присутній на диску, але заблокований перевірками безпеки шляхів завантажувача, валідація конфігурації зберігає запис plugin і повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого plugin, наприклад право власності на шлях або дозволи world-writable, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для збоїв форми модуля, як-от відсутні exports `register`/`activate`, запустіть повторно з `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб додати компактне зведення форми exports у діагностичний вивід.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр plugin — це збережена холодна модель читання OpenClaw для ідентичності встановлених plugin, стану ввімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника provider, класифікація налаштування каналу й інвентаризація plugin можуть читати його без імпорту runtime-модулів plugin.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, актуальний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу plugin, політики конфігурації та метаданих маніфесту/пакета. Це шлях ремонту, а не шлях runtime-активації.

`openclaw doctor --fix` також ремонтує суміжний із реєстром дрейф керованих npm: якщо осиротілий або відновлений пакет `@openclaw/*` у керованому npm-проєкті plugin або застарілому плоскому керованому npm-корені затіняє вбудований plugin, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за вбудованим маніфестом. Doctor також повторно пов’язує хостовий пакет `openclaw` із керованими npm plugins, які оголошують `peerDependencies.openclaw`, щоб package-local runtime imports, як-от `openclaw/plugin-sdk/*`, визначалися після оновлень або npm-ремонтів.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; fallback через env призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list приймає локальний шлях marketplace, шлях `marketplace.json`, GitHub-скорочення на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` друкує визначену мітку джерела, а також розібраний маніфест marketplace і записи plugin.

## Пов’язане

- [Створення plugins](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [ClawHub](/uk/clawhub)
