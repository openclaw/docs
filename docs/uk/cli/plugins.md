---
read_when:
    - Ви хочете встановлювати Plugin-и Gateway або керувати ними чи сумісними бандлами
    - Ви хочете створити каркас або перевірити простий Plugin інструмента
    - Ви хочете налагодити збої завантаження plugin
sidebarTitle: Plugins
summary: Довідник CLI для `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Плагіни
x-i18n:
    generated_at: "2026-06-28T22:33:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Керуйте Plugin-ами Gateway, наборами хуків і сумісними наборами.

<CardGroup cols={2}>
  <Card title="Plugin system" href="/uk/tools/plugin">
    Посібник для кінцевих користувачів зі встановлення, увімкнення та усунення несправностей Plugin-ів.
  </Card>
  <Card title="Manage plugins" href="/uk/plugins/manage-plugins">
    Швидкі приклади для встановлення, перегляду списку, оновлення, видалення та публікації.
  </Card>
  <Card title="Plugin bundles" href="/uk/plugins/bundles">
    Модель сумісності наборів.
  </Card>
  <Card title="Plugin manifest" href="/uk/plugins/manifest">
    Поля маніфесту та схема конфігурації.
  </Card>
  <Card title="Security" href="/uk/gateway/security">
    Посилення безпеки для встановлення Plugin-ів.
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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Для розслідування повільного встановлення, інспектування, видалення або оновлення реєстру запустіть
команду з `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1`. Трасування записує таймінги фаз
у stderr і зберігає JSON-вивід придатним для розбору. Див. [Налагодження](/uk/help/debugging#plugin-lifecycle-trace).

<Note>
У режимі Nix (`OPENCLAW_NIX_MODE=1`) змінювальні операції життєвого циклу Plugin-ів вимкнено. Для цього встановлення використовуйте джерело Nix замість `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` або `plugins disable`; для nix-openclaw використовуйте орієнтований на агента [Швидкий старт](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Вбудовані Plugin-и постачаються з OpenClaw. Деякі увімкнені за замовчуванням (наприклад, вбудовані провайдери моделей, вбудовані провайдери мовлення та вбудований браузерний Plugin); інші потребують `plugins enable`.

Нативні Plugin-и OpenClaw мають постачати `openclaw.plugin.json` з вбудованою JSON Schema (`configSchema`, навіть якщо вона порожня). Сумісні набори натомість використовують власні маніфести наборів.

`plugins list` показує `Format: openclaw` або `Format: bundle`. Докладний вивід list/info також показує підтип набору (`codex`, `claude` або `cursor`) і виявлені можливості набору.
</Note>

### Автор

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` за замовчуванням створює мінімальний інструментальний Plugin TypeScript. Перший
аргумент — це ідентифікатор Plugin-а; передайте `--name` для відображуваної назви. OpenClaw використовує
ідентифікатор для типової вихідної директорії та іменування пакета. Заготовки інструментів використовують
`defineToolPlugin`.
`plugins build` імпортує зібрану точку входу, читає її статичні метадані інструментів, записує
`openclaw.plugin.json` і підтримує `package.json` `openclaw.extensions` узгодженим.
`plugins validate` перевіряє, що згенерований маніфест, метадані пакета та
поточний експорт точки входу досі узгоджуються. Див. [Tool Plugins](/uk/plugins/tool-plugins) для
повного робочого процесу створення інструментів.

Заготовка записує вихідний код TypeScript, але генерує метадані зі зібраної
точки входу `./dist/index.js`, тому робочий процес також працює з опублікованим CLI. Використовуйте
`--entry <path>`, коли точка входу не є типовою точкою входу пакета. Використовуйте
`plugins build --check` у CI, щоб завершуватися з помилкою, коли згенеровані метадані застаріли, без
перезапису файлів.

### Заготовка провайдера

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Заготовки провайдерів створюють загальний текстовий/модельний Plugin провайдера з OpenAI-сумісною
проводкою API-ключів, вбудованим скриптом `npm run validate` для `clawhub package
validate`, метаданими пакета ClawHub і вручну запущеним робочим процесом GitHub
для майбутньої довіреної публікації через GitHub Actions OIDC. Заготовки провайдерів
не генерують Skills і не використовують `openclaw plugins build` або
`openclaw plugins validate`; ці команди призначені для шляху згенерованих метаданих
заготовки інструмента.

Перед публікацією замініть заповнювач URL бази API, каталог моделей, маршрут документації,
текст облікових даних і текст README реальними даними провайдера. Використовуйте
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

Мейнтейнери, які тестують встановлення під час налаштування, можуть перевизначати автоматичні джерела
встановлення Plugin-ів за допомогою захищених змінних середовища. Див.
[Перевизначення встановлення Plugin-ів](/uk/plugins/install-overrides).

<Warning>
Голі імена пакетів за замовчуванням установлюються з npm під час перехідного запуску, якщо вони не збігаються з ідентифікатором офіційного Plugin-а. Необроблені специфікації пакетів `@openclaw/*`, які збігаються з вбудованими Plugin-ами, використовують вбудовану копію, що постачалася з поточною збіркою OpenClaw. Використовуйте `npm:<package>`, коли навмисно хочете зовнішній пакет npm. Використовуйте `clawhub:<package>` для ClawHub. Ставтеся до встановлення Plugin-ів як до запуску коду. Надавайте перевагу закріпленим версіям.
</Warning>

`plugins search` запитує ClawHub щодо доступних для встановлення пакетів Plugin-ів і друкує
готові до встановлення імена пакетів. Він шукає пакети code-plugin і bundle-plugin,
а не Skills. Використовуйте `openclaw skills search` для Skills ClawHub.

<Note>
ClawHub є основною поверхнею поширення та виявлення для більшості Plugin-ів. Npm
залишається підтримуваним запасним варіантом і шляхом прямого встановлення. Належні OpenClaw
пакети Plugin-ів `@openclaw/*` знову публікуються в npm; див. поточний список
на [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) або
[інвентар Plugin-ів](/uk/plugins/plugin-inventory). Стабільні встановлення використовують `latest`.
Встановлення та оновлення бета-каналу надають перевагу npm dist-tag `beta`, коли цей тег
доступний, а потім повертаються до `latest`.
</Note>

<AccordionGroup>
  <Accordion title="Config includes and invalid-config repair">
    Якщо ваш розділ `plugins` підкріплений однофайловим `$include`, `plugins install/update/enable/disable/uninstall` записують у цей включений файл і залишають `openclaw.json` без змін. Кореневі включення, масиви включень і включення з сусідніми перевизначеннями завершуються закрито замість вирівнювання. Див. [Включення конфігурації](/uk/gateway/configuration) для підтримуваних форм.

    Якщо конфігурація недійсна під час встановлення, `plugins install` зазвичай завершується закрито і просить вас спочатку запустити `openclaw doctor --fix`. Під час запуску Gateway і гарячого перезавантаження недійсна конфігурація Plugin-а завершується закрито, як і будь-яка інша недійсна конфігурація; `openclaw doctor --fix` може помістити недійсний запис Plugin-а в карантин. Єдиний задокументований виняток під час встановлення — вузький шлях відновлення вбудованого Plugin-а для Plugin-ів, які явно обирають `openclaw.install.allowInvalidConfigRecovery`.

  </Accordion>
  <Accordion title="--force and reinstall vs update">
    `--force` повторно використовує наявну ціль встановлення та перезаписує вже встановлений Plugin або набір хуків на місці. Використовуйте його, коли ви навмисно перевстановлюєте той самий ідентифікатор з нового локального шляху, архіву, пакета ClawHub або артефакту npm. Для звичайних оновлень уже відстежуваного npm Plugin-а надавайте перевагу `openclaw plugins update <id-or-npm-spec>`.

    Якщо ви запускаєте `plugins install` для ідентифікатора Plugin-а, який уже встановлено, OpenClaw зупиняється і вказує на `plugins update <id-or-npm-spec>` для звичайного оновлення або на `plugins install <package> --force`, коли ви справді хочете перезаписати поточне встановлення з іншого джерела.

  </Accordion>
  <Accordion title="--pin scope">
    `--pin` застосовується лише до встановлень npm. Він не підтримується з установленнями `git:`; використовуйте явне посилання git, наприклад `git:github.com/acme/plugin@v1.2.3`, коли хочете закріплене джерело. Він не підтримується з `--marketplace`, тому що встановлення з marketplace зберігають метадані джерела marketplace замість специфікації npm.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` застаріло і тепер нічого не робить. OpenClaw більше не виконує вбудоване блокування небезпечного коду під час встановлення Plugin-ів.

    Використовуйте спільну поверхню `security.installPolicy`, якою володіє оператор, коли потрібна специфічна для хоста політика встановлення. Хуки Plugin-а `before_install` є хуками життєвого циклу середовища виконання Plugin-а і не є основною політичною межею для встановлень CLI.

    Якщо Plugin, який ви опублікували в ClawHub, прихований або заблокований скануванням реєстру, використовуйте кроки видавця в [Публікація ClawHub](/uk/clawhub/publishing). `--dangerously-force-unsafe-install` не просить ClawHub повторно просканувати Plugin або зробити заблокований реліз публічним.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Встановлення зі спільноти ClawHub перевіряють запис довіри вибраного релізу перед завантаженням пакета. Якщо ClawHub вимикає завантаження для релізу, повідомляє про шкідливі результати сканування або переводить реліз у блокувальний стан модерації, наприклад карантин, OpenClaw відхиляє реліз. Для неблокувальних ризикових статусів сканування, ризикових станів модерації або причин реєстру OpenClaw показує подробиці довіри і просить підтвердження перед продовженням.

    Використовуйте `--acknowledge-clawhub-risk` лише після перегляду попередження ClawHub і рішення продовжити без інтерактивного запиту. Очікувані або застарілі чисті записи довіри попереджають, але не потребують підтвердження. Офіційні пакети ClawHub і вбудовані джерела Plugin-ів OpenClaw обходять цей запит довіри до релізу.

  </Accordion>
  <Accordion title="Hook packs and npm specs">
    `plugins install` також є поверхнею встановлення для наборів хуків, які надають `openclaw.hooks` у `package.json`. Використовуйте `openclaw hooks` для відфільтрованої видимості хуків і ввімкнення окремих хуків, а не для встановлення пакета.

    Специфікації npm є **лише реєстровими** (назва пакета + необов’язкова **точна версія** або **dist-tag**). Специфікації Git/URL/file і діапазони semver відхиляються. Встановлення залежностей виконується в одному керованому npm-проєкті на Plugin із `--ignore-scripts` для безпеки, навіть якщо у вашій оболонці задані глобальні налаштування встановлення npm. Керовані npm-проєкти Plugin успадковують npm `overrides` OpenClaw на рівні пакета, тож хостові security pins застосовуються і до піднятих залежностей Plugin.

    Використовуйте `npm:<package>`, коли хочете явно вказати npm-розв’язання. Голі специфікації пакетів також встановлюються безпосередньо з npm під час запускового переходу, якщо вони не збігаються з офіційним id Plugin.

    Необроблені специфікації пакетів `@openclaw/*`, що збігаються з вбудованими plugins, розв’язуються до вбудованої копії, що належить образу, перед fallback до npm. Наприклад, `openclaw plugins install @openclaw/discord@2026.5.20 --pin` використовує вбудований Discord plugin із поточного білда OpenClaw замість створення керованого npm override. Щоб примусово використати зовнішній npm-пакет, застосуйте `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Голі специфікації та `@latest` залишаються на стабільній гілці. Версії виправлень OpenClaw із датованою позначкою, як-от `2026.5.3-1`, для цієї перевірки є стабільними релізами. Якщо npm розв’язує будь-яку з них до prerelease, OpenClaw зупиняється і просить вас явно погодитися через prerelease-тег, як-от `@beta`/`@rc`, або точну prerelease-версію, як-от `@1.2.3-beta.4`.

    Для npm-встановлень без точної версії (`npm:<package>` або `npm:<package>@latest`) OpenClaw перевіряє розв’язані метадані пакета перед встановленням. Якщо найновіший стабільний пакет потребує новішого OpenClaw plugin API або мінімальної версії хоста, OpenClaw переглядає старіші стабільні версії й натомість встановлює найновіший сумісний реліз. Точні версії та явні dist-tags, як-от `@beta`, залишаються строгими: якщо вибраний пакет несумісний, команда завершується помилкою і просить оновити OpenClaw або вибрати сумісну версію.

    Якщо гола специфікація встановлення збігається з офіційним id Plugin (наприклад `diffs`), OpenClaw встановлює запис каталогу безпосередньо. Щоб встановити npm-пакет із такою самою назвою, використовуйте явну scoped-специфікацію (наприклад `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Використовуйте `git:<repo>`, щоб встановити безпосередньо з git-репозиторію. Підтримувані форми включають `git:github.com/owner/repo`, `git:owner/repo`, повні URL клонування `https://`, `ssh://`, `git://`, `file://` і `git@host:owner/repo.git`. Додайте `@<ref>` або `#<ref>`, щоб перед встановленням перейти на гілку, тег або коміт.

    Git-встановлення клонують у тимчасовий каталог, переходять на запитаний ref за наявності, а потім використовують звичайний інсталятор каталогу Plugin. Це означає, що валідація маніфесту, політика встановлення оператора, робота встановлення менеджера пакетів і записи встановлення поводяться так само, як npm-встановлення. Записані git-встановлення включають вихідний URL/ref плюс розв’язаний коміт, щоб `openclaw plugins update` міг пізніше повторно розв’язати джерело.

    Після встановлення з git використовуйте `openclaw plugins inspect <id> --runtime --json`, щоб перевірити runtime-реєстрації, як-от методи gateway і CLI-команди. Якщо Plugin зареєстрував CLI-корінь через `api.registerCli`, виконайте цю команду безпосередньо через кореневий CLI OpenClaw, наприклад `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Підтримувані архіви: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Нативні архіви OpenClaw Plugin мають містити дійсний `openclaw.plugin.json` у корені розпакованого Plugin; архіви, що містять лише `package.json`, відхиляються до того, як OpenClaw запише записи встановлення.

    Використовуйте `npm-pack:<path.tgz>`, коли файл є npm-pack tarball і ви хочете
    протестувати той самий шлях керованого npm-проєкту на Plugin, що використовується реєстровими
    встановленнями, включно з перевіркою `package-lock.json`, скануванням піднятих залежностей
    і записами npm-встановлення. Звичайні шляхи до архівів і надалі встановлюються як локальні
    архіви під коренем розширень Plugin.

    Встановлення з Claude marketplace також підтримуються.

  </Accordion>
</AccordionGroup>

Встановлення ClawHub використовують явний locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Голі npm-безпечні специфікації Plugin типово встановлюються з npm під час запускового переходу, якщо вони не збігаються з офіційним id Plugin:

```bash
openclaw plugins install openclaw-codex-app-server
```

Використовуйте `npm:`, щоб явно вказати лише npm-розв’язання:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw перевіряє заявлену сумісність plugin API / мінімального gateway перед встановленням. Коли вибрана версія ClawHub публікує артефакт ClawPack, OpenClaw завантажує версійний npm-pack `.tgz`, перевіряє заголовок digest ClawHub і digest артефакту, а потім встановлює його через звичайний шлях архіву. Старіші версії ClawHub без метаданих ClawPack і надалі встановлюються через застарілий шлях перевірки архіву пакета. Записані встановлення зберігають свої вихідні метадані ClawHub, тип артефакту, npm integrity, npm shasum, назву tarball і факти ClawPack digest для подальших оновлень.
Неверсійні встановлення ClawHub зберігають неверсійну записану специфікацію, щоб `openclaw plugins update` міг відстежувати новіші релізи ClawHub; явні селектори версії або тегу, як-от `clawhub:pkg@1.2.3` і `clawhub:pkg@beta`, залишаються закріпленими за цим селектором.

#### Скорочення marketplace

Використовуйте скорочення `plugin@marketplace`, коли назва marketplace існує в локальному кеші реєстру Claude за шляхом `~/.claude/plugins/known_marketplaces.json`:

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
    - відома Claude назва marketplace з `~/.claude/plugins/known_marketplaces.json`
    - локальний корінь marketplace або шлях `marketplace.json`
    - скорочення GitHub repo, як-от `owner/repo`
    - URL GitHub repo, як-от `https://github.com/owner/repo`
    - git URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Для віддалених marketplaces, завантажених із GitHub або git, записи Plugin мають залишатися всередині клонованого marketplace repo. OpenClaw приймає джерела з відносними шляхами з цього repo і відхиляє HTTP(S), абсолютні шляхи, git, GitHub та інші не-шляхові джерела Plugin з віддалених маніфестів.
  </Tab>
</Tabs>

Для локальних шляхів і архівів OpenClaw автоматично визначає:

- нативні OpenClaw plugins (`openclaw.plugin.json`)
- Codex-сумісні bundles (`.codex-plugin/plugin.json`)
- Claude-сумісні bundles (`.claude-plugin/plugin.json` або типовий макет компонентів Claude)
- Cursor-сумісні bundles (`.cursor-plugin/plugin.json`)

Керовані локальні встановлення мають бути каталогами або архівами Plugin. Окремі файли Plugin `.js`,
`.mjs`, `.cjs` і `.ts` не копіюються в керований корінь Plugin
командою `plugins install`; натомість явно перелічіть їх у `plugins.load.paths`.

<Note>
Сумісні bundles встановлюються у звичайний корінь Plugin і беруть участь у тому самому потоці list/info/enable/disable. Наразі підтримуються bundle skills, Claude command-skills, типові значення Claude `settings.json`, типові значення Claude `.lsp.json` / оголошені в маніфесті `lspServers`, Cursor command-skills і сумісні каталоги hook Codex; інші виявлені можливості bundle показуються в diagnostics/info, але ще не під’єднані до runtime-виконання.
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
  Показати лише увімкнені plugins.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Перемкнутися з табличного подання на деталізовані рядки для кожного Plugin із метаданими source/origin/version/activation.
</ParamField>
<ParamField path="--json" type="boolean">
  Машинозчитуваний inventory плюс diagnostics реєстру і стан встановлення залежностей пакета.
</ParamField>

<Note>
`plugins list` спершу читає збережений локальний реєстр Plugin, із fallback на основі лише маніфесту, коли реєстр відсутній або недійсний. Це корисно для перевірки, чи Plugin встановлений, увімкнений і видимий для планування холодного запуску, але це не живий runtime-пробник уже запущеного процесу Gateway. Після зміни коду Plugin, enablement, політики hook або `plugins.load.paths` перезапустіть Gateway, який обслуговує канал, перш ніж очікувати виконання нового коду `register(api)` або hooks. Для віддалених/container deployments перевірте, що ви перезапускаєте фактичний дочірній процес `openclaw gateway run`, а не лише wrapper-процес.

`plugins list --json` включає `dependencyStatus` кожного Plugin із `package.json`
`dependencies` і `optionalDependencies`. OpenClaw перевіряє, чи ці назви пакетів
наявні вздовж звичайного шляху пошуку Node `node_modules` для Plugin; він
не імпортує runtime-код Plugin, не запускає менеджер пакетів і не ремонтує відсутні
залежності.
</Note>

Якщо startup logs показують `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...`,
запустіть `openclaw plugins list --enabled --verbose` або
`openclaw plugins inspect <id>` із переліченим id Plugin, щоб підтвердити
ids Plugin і скопіювати довірені ids у `plugins.allow` в `openclaw.json`. Коли
попередження може перелічити кожен виявлений Plugin, воно друкує готовий для вставлення
фрагмент `plugins.allow`, який уже містить ці ids. Якщо Plugin завантажується
без provenance встановлення/load-path, перевірте цей id Plugin, а потім або закріпіть
довірений id у `plugins.allow`, або перевстановіть Plugin із довіреного джерела,
щоб OpenClaw записав provenance встановлення.

`plugins search` — це віддалений пошук у каталозі ClawHub. Він не перевіряє локальний
стан, не змінює config, не встановлює пакети і не завантажує runtime-код Plugin. Результати пошуку
містять назву пакета ClawHub, family, channel, версію, summary і
підказку для встановлення, як-от `openclaw plugins install clawhub:<package>`.

Для роботи з вбудованим Plugin усередині запакованого Docker image змонтуйте bind-mount каталогу
джерел Plugin поверх відповідного запакованого шляху джерел, як-от
`/app/extensions/synology-chat`. OpenClaw виявить цей змонтований source
overlay перед `/app/dist/extensions/synology-chat`; звичайний скопійований source
directory залишається неактивним, тож нормальні запаковані встановлення й надалі використовують скомпільований dist.

Для debugging runtime hooks:

- `openclaw plugins inspect <id> --runtime --json` показує зареєстровані hooks і diagnostics з проходу inspection із завантаженим module. Runtime inspection ніколи не встановлює залежності; використовуйте `openclaw doctor --fix`, щоб очистити застарілий стан залежностей або відновити відсутні downloadable plugins, на які посилається config.
- `openclaw gateway status --deep --require-rpc` підтверджує досяжний Gateway URL/profile, підказки service/process, шлях config і RPC health.
- Невбудовані conversation hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) потребують `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Використовуйте `--link`, щоб уникнути копіювання локального каталогу Plugin (додає до `plugins.load.paths`):

```bash
openclaw plugins install -l ./my-plugin
```

Окремі файли Plugin мають бути перелічені в `plugins.load.paths`, а не
встановлені через `plugins install` чи розміщені безпосередньо в `~/.openclaw/extensions`
або `<workspace>/.openclaw/extensions`. Ці auto-discovered roots завантажують каталоги
package або bundle Plugin, тоді як top-level script files трактуються як локальні
helpers і пропускаються.

<Note>
Плагіни з джерелом у робочій області, виявлені з кореня розширень робочої області, не
імпортуються й не виконуються, доки їх явно не ввімкнено. Для локальної розробки
запустіть `openclaw plugins enable <plugin-id>` або задайте
`plugins.entries.<plugin-id>.enabled: true`; якщо ваша конфігурація використовує
`plugins.allow`, додайте туди той самий ідентифікатор плагіна. Це правило fail-closed
також застосовується, коли налаштування каналу явно націлюється на плагін із робочої області для
завантаження лише під час налаштування, тому локальний код налаштування канального плагіна не запускатиметься, доки цей
плагін робочої області лишається вимкненим або виключеним зі списку дозволених. Пов’язані встановлення
та явні записи `plugins.load.paths` дотримуються звичайної політики для свого
розв’язаного джерела плагіна. Див.
[Налаштування політики плагінів](/uk/tools/plugin#configure-plugin-policy)
і [Довідник конфігурації](/uk/gateway/configuration-reference#plugins).

`--force` не підтримується з `--link`, оскільки пов’язані встановлення повторно використовують шлях до джерела замість копіювання поверх керованої цілі встановлення.

Використовуйте `--pin` для npm-встановлень, щоб зберегти розв’язану точну специфікацію (`name@version`) у керованому індексі плагінів, зберігаючи типову поведінку без закріплення.
</Note>

### Індекс Plugin

Метадані встановлення плагінів є машинно керованим станом, а не користувацькою конфігурацією. Встановлення й оновлення записують їх до спільної бази даних стану SQLite в активному каталозі стану OpenClaw. Рядок `installed_plugin_index` зберігає довговічні метадані `installRecords`, зокрема записи для пошкоджених або відсутніх маніфестів плагінів, а також похідний від маніфесту холодний кеш реєстру, який використовується `openclaw plugins update`, видаленням, діагностикою та холодним реєстром плагінів.

Коли OpenClaw бачить у конфігурації поставлені застарілі записи `plugins.installs`, читання під час виконання трактують їх як сумісний вхід без перезапису `openclaw.json`. Явні записи плагінів і `openclaw doctor --fix` переміщують ці записи в індекс плагінів і видаляють ключ конфігурації, коли записи конфігурації дозволені; якщо будь-який запис завершується невдало, записи конфігурації зберігаються, щоб метадані встановлення не було втрачено.

### Видалення

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` видаляє записи плагінів із `plugins.entries`, збереженого індексу плагінів, записів списків дозволу/заборони плагінів і пов’язаних записів `plugins.load.paths`, коли це застосовно. Якщо `--keep-files` не задано, видалення також прибирає відстежуваний каталог керованого встановлення, коли він розміщений у корені розширень плагінів OpenClaw. Для плагінів Active Memory слот пам’яті скидається до `memory-core`.

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

Оновлення застосовуються до відстежуваних встановлень плагінів у керованому індексі плагінів і відстежуваних встановлень hook-pack у `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Resolving plugin id vs npm spec">
    Коли ви передаєте ідентифікатор плагіна, OpenClaw повторно використовує записану специфікацію встановлення для цього плагіна. Це означає, що раніше збережені dist-tags, як-от `@beta`, і точні закріплені версії продовжують використовуватися під час подальших запусків `update <id>`.

    Під час `update <id> --dry-run` точно закріплені npm-встановлення лишаються закріпленими. Якщо OpenClaw також може розв’язати типову лінію реєстру пакета і ця типова лінія новіша за встановлену закріплену версію, пробний запуск повідомляє про закріплення й друкує явну команду оновлення пакета `@latest`, щоб перейти на типову лінію реєстру.

    Це правило цільового оновлення відрізняється від масового шляху обслуговування `openclaw plugins update --all`. Масові оновлення й далі поважають звичайні відстежувані специфікації встановлення, але записи довірених офіційних плагінів OpenClaw можуть синхронізуватися з поточною ціллю офіційного каталогу замість того, щоб залишатися на застарілому точному офіційному пакеті. Використовуйте цільове `update <id>`, коли навмисно хочете залишити точну або теговану офіційну специфікацію без змін.

    Для npm-встановлень ви також можете передати явну специфікацію npm-пакета з dist-tag або точною версією. OpenClaw розв’язує цю назву пакета назад до відстежуваного запису плагіна, оновлює цей встановлений плагін і записує нову npm-специфікацію для майбутніх оновлень за ідентифікатором.

    Передавання назви npm-пакета без версії або тегу також розв’язується назад до відстежуваного запису плагіна. Використовуйте це, коли плагін було закріплено на точній версії, а ви хочете повернути його до типової релізної лінії реєстру.

  </Accordion>
  <Accordion title="Beta channel updates">
    Цільове `openclaw plugins update <id-or-npm-spec>` повторно використовує відстежувану специфікацію плагіна, якщо ви не передаєте нову специфікацію. Масове `openclaw plugins update --all` використовує налаштований `update.channel`, коли синхронізує записи довірених офіційних плагінів із ціллю офіційного каталогу, тож встановлення з бета-каналу можуть залишатися на бета-релізній лінії замість тихої нормалізації до stable/latest.

    `openclaw update` також знає активний канал оновлень OpenClaw: на бета-каналі записи npm і плагінів ClawHub типової лінії спершу пробують `@beta`. Вони повертаються до записаної типової/latest специфікації, якщо бета-релізу плагіна не існує; npm-плагіни також повертаються назад, коли бета-пакет існує, але не проходить перевірку встановлення. Про такий fallback повідомляється як про попередження, і він не провалює основне оновлення. Точні версії та явні теги лишаються закріпленими на цьому селекторі для цільових оновлень.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Перед живим npm-оновленням OpenClaw перевіряє встановлену версію пакета за метаданими npm-реєстру. Якщо встановлена версія й записана ідентичність артефакту вже відповідають розв’язаній цілі, оновлення пропускається без завантаження, перевстановлення або перезапису `openclaw.json`.

    Коли існує збережений хеш цілісності, а хеш отриманого артефакту змінюється, OpenClaw трактує це як дрейф npm-артефакту. Інтерактивна команда `openclaw plugins update` друкує очікуваний і фактичний хеші та просить підтвердження перед продовженням. Неінтерактивні помічники оновлення fail closed, якщо викликач не надає явну політику продовження.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` також приймається в `plugins update` для сумісності, але він застарілий і більше не змінює поведінку оновлення плагінів. Операторська `security.installPolicy` усе ще може блокувати оновлення; хуки плагіна `before_install` застосовуються лише в процесах, де хуки плагінів завантажені.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    Оновлення плагінів спільноти, підтримані ClawHub, виконують ту саму перевірку довіри до точного релізу, що й встановлення, перед завантаженням замінного пакета. Використовуйте `--acknowledge-clawhub-risk` для перевіреної автоматизації, яка має продовжувати роботу, коли вибраний реліз ClawHub має ризикове попередження довіри. Офіційні пакети ClawHub і вбудовані джерела плагінів OpenClaw обходять цей запит довіри до релізу.
  </Accordion>
</AccordionGroup>

### Перевірка

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect показує ідентичність, статус завантаження, джерело, можливості маніфесту, прапорці політики, діагностику, метадані встановлення, можливості бандла та будь-яку виявлену підтримку MCP- або LSP-сервера без типового імпорту середовища виконання плагіна. JSON-вивід містить контракти маніфесту плагіна, як-от `contracts.agentToolResultMiddleware` і `contracts.trustedToolPolicies`, щоб оператори могли перевірити декларації довіреної поверхні перед увімкненням або перезапуском плагіна. Додайте `--runtime`, щоб завантажити модуль плагіна й додати зареєстровані хуки, інструменти, команди, сервіси, методи Gateway та HTTP-маршрути. Runtime inspection напряму повідомляє про відсутні залежності плагіна; встановлення й ремонти лишаються в `openclaw plugins install`, `openclaw plugins update` і `openclaw doctor --fix`.

Команди CLI, що належать плагінам, зазвичай встановлюються як кореневі групи команд `openclaw`, але плагіни також можуть реєструвати вкладені команди під основним батьківським вузлом, наприклад `openclaw nodes`. Після того як `inspect --runtime` покаже команду в `cliCommands`, запустіть її за вказаним шляхом; наприклад, плагін, що реєструє `demo-git`, можна перевірити за допомогою `openclaw demo-git ping`.

Кожен плагін класифікується за тим, що він фактично реєструє під час виконання:

- **plain-capability** — один тип можливості (наприклад, плагін лише провайдера)
- **hybrid-capability** — кілька типів можливостей (наприклад, текст + мовлення + зображення)
- **hook-only** — лише хуки, без можливостей або поверхонь
- **non-capability** — інструменти/команди/сервіси, але без можливостей

Див. [Форми Plugin](/uk/plugins/architecture#plugin-shapes), щоб дізнатися більше про модель можливостей.

<Note>
Прапорець `--json` виводить машинозчитуваний звіт, придатний для скриптів і аудиту. `inspect --all` відтворює таблицю для всього парку зі стовпцями форми, видів можливостей, сповіщень про сумісність, можливостей бандла та підсумку хуків. `info` є псевдонімом для `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` повідомляє про помилки завантаження плагінів, діагностику маніфестів/виявлення, сповіщення про сумісність і застарілі посилання конфігурації плагінів, як-от відсутні слоти плагінів. Коли дерево встановлення й конфігурація плагінів чисті, він друкує `No plugin issues detected.` Якщо застаріла конфігурація лишається, але дерево встановлення інакше справне, підсумок каже саме це, а не натякає на повне здоров’я плагінів.

Якщо налаштований плагін присутній на диску, але заблокований перевірками безпеки шляхів завантажувача, перевірка конфігурації зберігає запис плагіна й повідомляє про нього як `present but blocked`. Виправте попередню діагностику заблокованого плагіна, наприклад власника шляху або дозволи world-writable, замість видалення конфігурації `plugins.entries.<id>` або `plugins.allow`.

Для помилок форми модуля, як-от відсутні експорти `register`/`activate`, перезапустіть із `OPENCLAW_PLUGIN_LOAD_DEBUG=1`, щоб додати компактний підсумок форми експортів до діагностичного виводу.

### Реєстр

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Локальний реєстр плагінів — це збережена холодна модель читання OpenClaw для ідентичності встановлених плагінів, увімкнення, метаданих джерела та власності внесків. Звичайний запуск, пошук власника провайдера, класифікація налаштування каналу та інвентаризація плагінів можуть читати його без імпорту модулів середовища виконання плагінів.

Використовуйте `plugins registry`, щоб перевірити, чи збережений реєстр наявний, поточний або застарілий. Використовуйте `--refresh`, щоб перебудувати його зі збереженого індексу плагінів, політики конфігурації та метаданих маніфесту/пакета. Це шлях ремонту, а не шлях активації під час виконання.

`openclaw doctor --fix` також ремонтує суміжний із реєстром керований npm-дрейф: якщо осиротілий або відновлений пакет `@openclaw/*` у керованому npm-проєкті плагіна або застарілому пласкому керованому npm-корені затіняє вбудований плагін, doctor видаляє цей застарілий пакет і перебудовує реєстр, щоб запуск перевірявся за вбудованим маніфестом. Doctor також повторно пов’язує хостовий пакет `openclaw` у керовані npm-плагіни, які оголошують `peerDependencies.openclaw`, щоб локальні для пакета імпорти під час виконання, як-от `openclaw/plugin-sdk/*`, розв’язувалися після оновлень або npm-ремонтів.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` — це застарілий аварійний перемикач сумісності для збоїв читання реєстру. Надавайте перевагу `plugins registry --refresh` або `openclaw doctor --fix`; fallback через змінну середовища призначений лише для аварійного відновлення запуску під час розгортання міграції.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` виводить записи з налаштованої стрічки маркетплейсу OpenClaw. За замовчуванням вона пробує використати розміщену стрічку й повертається до останнього прийнятого знімка або вбудованих даних. Використовуйте `--feed-profile <name>`, щоб читати певний налаштований профіль, `--feed-url <url>`, щоб читати явну URL-адресу розміщеної стрічки, і `--offline`, щоб читати останній прийнятий знімок без отримання стрічки.

`plugins marketplace refresh` оновлює налаштований знімок розміщеної стрічки та повідомляє, чи OpenClaw прийняв розміщені дані, розміщений знімок або вбудовані резервні дані. Використовуйте `--expected-sha256`, коли виклику потрібно, щоб команда завершилася помилкою, якщо свіжий розміщений вміст не збігається із закріпленою контрольною сумою.

Marketplace `list` приймає локальний шлях маркетплейсу, шлях `marketplace.json`, скорочення GitHub на кшталт `owner/repo`, URL репозиторію GitHub або git URL. `--json` виводить розв’язану мітку джерела, а також розібраний маніфест маркетплейсу й записи плагінів.

Оновлення маркетплейсу завантажує розміщену стрічку маркетплейсу OpenClaw і зберігає
перевірену відповідь як локальний знімок розміщеної стрічки. Без параметрів воно використовує
налаштований стандартний профіль стрічки. Використовуйте `--feed-profile <name>`, щоб оновити
певний налаштований профіль, `--feed-url <url>`, щоб оновити явну URL-адресу розміщеної
стрічки, `--expected-sha256 <sha256>`, щоб вимагати збігу контрольної суми вмісту
(`sha256:<hex>` або простий 64-символьний шістнадцятковий дайджест), і `--json` для
машиночитного виводу. Явні URL-адреси розміщених стрічок не мають містити
облікові дані, рядки запиту або фрагменти. Незакріплені оновлення можуть повідомити про
розміщений знімок або вбудований резервний результат без помилки команди. Закріплені
оновлення завершуються помилкою, якщо вони не приймають свіжий розміщений вміст, а успішні розміщені
оновлення завершуються помилкою, якщо OpenClaw не може зберегти перевірений знімок.

## Пов’язане

- [Створення плагінів](/uk/plugins/building-plugins)
- [Довідник CLI](/uk/cli)
- [ClawHub](/uk/clawhub)
