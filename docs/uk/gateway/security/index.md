---
read_when:
    - Додавання функцій, які розширюють доступ або автоматизацію
summary: Міркування безпеки та модель загроз для запуску AI Gateway із доступом до оболонки
title: Безпека
x-i18n:
    generated_at: "2026-04-22T22:50:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47f524e57500faff35363f656c199e60bf51364f6aeb94114e1a0885ce04b128
    source_path: gateway/security/index.md
    workflow: 15
---

# Безпека

<Warning>
**Модель довіри персонального помічника:** ці рекомендації припускають одну межу довіри оператора на кожен gateway (модель одного користувача/персонального помічника).
OpenClaw **не** є ворожою багатокористувацькою межею безпеки для кількох зловмисних користувачів, які спільно використовують одного агента/gateway.
Якщо вам потрібна робота зі змішаним рівнем довіри або зі зловмисними користувачами, розділіть межі довіри (окремий gateway + облікові дані, в ідеалі окремі користувачі ОС/хости).
</Warning>

**На цій сторінці:** [Модель довіри](#scope-first-personal-assistant-security-model) | [Швидкий аудит](#quick-check-openclaw-security-audit) | [Посилена базова конфігурація](#hardened-baseline-in-60-seconds) | [Модель доступу DM](#dm-access-model-pairing-allowlist-open-disabled) | [Посилення конфігурації](#configuration-hardening-examples) | [Реагування на інциденти](#incident-response)

## Спочатку про межі: модель безпеки персонального помічника

Рекомендації з безпеки OpenClaw припускають розгортання **персонального помічника**: одна межа довіри оператора, потенційно багато агентів.

- Підтримувана модель безпеки: один користувач/межа довіри на gateway (бажано один користувач ОС/хост/VPS на одну межу).
- Модель, яка не підтримується як межа безпеки: один спільний gateway/агент, який використовують взаємно недовірені або зловмисні користувачі.
- Якщо потрібна ізоляція від зловмисних користувачів, розділяйте за межами довіри (окремий gateway + облікові дані, а в ідеалі окремі користувачі ОС/хости).
- Якщо кілька недовірених користувачів можуть надсилати повідомлення одному агенту з увімкненими інструментами, вважайте, що вони спільно використовують однакові делеговані повноваження цього агента щодо інструментів.

Ця сторінка пояснює посилення безпеки **в межах цієї моделі**. Вона не заявляє про ізоляцію ворожих багатокористувацьких сценаріїв на одному спільному gateway.

## Швидка перевірка: `openclaw security audit`

Див. також: [Формальна верифікація (моделі безпеки)](/uk/security/formal-verification)

Запускайте це регулярно (особливо після зміни конфігурації або відкриття мережевих поверхонь):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` навмисно має вузьку сферу дії: він перемикає поширені відкриті групові політики на allowlist, відновлює `logging.redactSensitive: "tools"`, посилює дозволи для state/config/include-файлів і використовує скидання Windows ACL замість POSIX `chmod` під час роботи в Windows.

Він виявляє типові небезпечні конфігурації (відкриту автентифікацію Gateway, відкритий доступ до керування браузером, розширені allowlist, дозволи файлової системи, надто поблажливі підтвердження exec і відкритий доступ до інструментів через канали).

OpenClaw — це і продукт, і експеримент: ви підключаєте поведінку frontier-model до реальних поверхонь обміну повідомленнями та реальних інструментів. **Ідеально безпечної** конфігурації не існує. Мета — свідомо визначити:

- хто може спілкуватися з вашим ботом
- де боту дозволено діяти
- до чого бот може отримувати доступ

Починайте з мінімального доступу, який ще дозволяє працювати, і поступово розширюйте його в міру зростання впевненості.

### Розгортання та довіра до хоста

OpenClaw припускає, що хост і межа конфігурації є довіреними:

- Якщо хтось може змінювати стан/конфігурацію хоста Gateway (`~/.openclaw`, зокрема `openclaw.json`), вважайте цю людину довіреним оператором.
- Запуск одного Gateway для кількох взаємно недовірених/зловмисних операторів **не є рекомендованою конфігурацією**.
- Для команд зі змішаним рівнем довіри розділяйте межі довіри за допомогою окремих gateway (або щонайменше окремих користувачів ОС/хостів).
- Рекомендована базова модель: один користувач на машину/хост (або VPS), один gateway для цього користувача та один або більше агентів у цьому gateway.
- Усередині одного екземпляра Gateway автентифікований доступ оператора є довіреною роллю control plane, а не роллю окремого користувача-орендаря.
- Ідентифікатори сесій (`sessionKey`, ID сесій, мітки) — це селектори маршрутизації, а не токени авторизації.
- Якщо кілька людей можуть надсилати повідомлення одному агенту з увімкненими інструментами, кожен із них може керувати тим самим набором дозволів. Ізоляція сесій/пам’яті на рівні користувача покращує приватність, але не перетворює спільного агента на авторизацію хоста на рівні окремого користувача.

### Спільний робочий простір Slack: реальний ризик

Якщо «будь-хто у Slack може написати боту», основний ризик — це делеговані повноваження інструментів:

- будь-який дозволений відправник може ініціювати виклики інструментів (`exec`, браузер, мережеві/файлові інструменти) в межах політики агента;
- ін’єкція prompt/content від одного відправника може спричинити дії, що впливають на спільний стан, пристрої або результати;
- якщо один спільний агент має доступ до чутливих облікових даних/файлів, будь-який дозволений відправник потенційно може ініціювати витік через використання інструментів.

Для командних сценаріїв використовуйте окремих агентів/gateway з мінімальним набором інструментів; агентів із персональними даними тримайте приватними.

### Спільний агент компанії: прийнятний шаблон

Це прийнятно, коли всі, хто використовує цього агента, перебувають у межах однієї довіреної області (наприклад, одна команда в компанії), а агент суворо обмежений бізнес-сценаріями.

- запускайте його на виділеній машині/VM/container;
- використовуйте виділеного користувача ОС + окремий браузер/профіль/акаунти для цього середовища виконання;
- не входьте в цьому середовищі у персональні акаунти Apple/Google або особисті профілі менеджера паролів/браузера.

Якщо ви змішуєте персональні та корпоративні ідентичності в одному середовищі виконання, ви руйнуєте це розділення та підвищуєте ризик розкриття персональних даних.

## Концепція довіри до Gateway і node

Розглядайте Gateway і node як одну операторську область довіри з різними ролями:

- **Gateway** — це control plane і поверхня політик (`gateway.auth`, політика інструментів, маршрутизація).
- **Node** — це поверхня віддаленого виконання, поєднана з цим Gateway (команди, дії на пристрої, локальні можливості хоста).
- Користувач, автентифікований у Gateway, вважається довіреним у межах Gateway. Після pairing дії node вважаються діями довіреного оператора на цій node.
- `sessionKey` — це вибір маршрутизації/контексту, а не автентифікація на рівні окремого користувача.
- Підтвердження exec (allowlist + ask) — це запобіжники для намірів оператора, а не ізоляція від ворожих багатокористувацьких сценаріїв.
- Типова продуктова конфігурація OpenClaw для довірених сценаріїв з одним оператором полягає в тому, що host exec на `gateway`/`node` дозволений без запитів на підтвердження (`security="full"`, `ask="off"`, якщо ви це не посилюєте). Цей стандартний режим є навмисним UX-рішенням, а не вразливістю сам по собі.
- Підтвердження exec прив’язуються до точного контексту запиту та до best-effort прямих локальних файлових операндів; вони не моделюють семантично всі шляхи завантаження середовища виконання/інтерпретатора. Для сильних меж використовуйте sandboxing та ізоляцію хоста.

Якщо вам потрібна ізоляція від ворожих користувачів, розділяйте межі довіри за користувачами ОС/хостами й запускайте окремі gateway.

## Матриця меж довіри

Використовуйте це як швидку модель під час оцінки ризику:

| Межа або контроль                                        | Що це означає                                    | Типове хибне тлумачення                                                    |
| -------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Автентифікує викликачів до API gateway           | «Щоб бути безпечним, потрібні підписи для кожного повідомлення в кожному кадрі» |
| `sessionKey`                                             | Ключ маршрутизації для вибору контексту/сесії    | «Ключ сесії є межею автентифікації користувача»                            |
| Запобіжники prompt/content                               | Зменшують ризик зловживання моделлю              | «Сама лише prompt injection доводить обхід автентифікації»                |
| `canvas.eval` / browser evaluate                         | Навмисна операторська можливість, коли ввімкнена | «Будь-який примітив JS eval автоматично є вразливістю в цій моделі довіри» |
| Локальна оболонка TUI `!`                                | Явний локальний запуск, ініційований оператором  | «Зручна локальна shell-команда є віддаленою ін’єкцією»                    |
| Pairing node і команди node                              | Віддалене виконання на рівні оператора на поєднаних пристроях | «Керування віддаленим пристроєм слід типово вважати доступом недовіреного користувача» |

## Не є вразливостями за задумом

Про ці шаблони часто повідомляють, але зазвичай їх закривають без дій, якщо не показано реальний обхід межі:

- Ланцюжки, що ґрунтуються лише на prompt injection, без обходу політики/автентифікації/sandbox.
- Твердження, що виходять із припущення про ворожу багатокористувацьку роботу на одному спільному хості/конфігурації.
- Повідомлення, які класифікують звичайний операторський доступ на читання (наприклад, `sessions.list`/`sessions.preview`/`chat.history`) як IDOR у конфігурації зі спільним gateway.
- Знахідки для розгортань лише на localhost (наприклад, HSTS для gateway, доступного лише через loopback).
- Повідомлення про підпис inbound webhook Discord для вхідних шляхів, яких у цьому репозиторії не існує.
- Повідомлення, які трактують метадані pairing node як прихований другий шар підтвердження для кожної команди `system.run`, хоча реальною межею виконання лишається глобальна політика команд node у gateway плюс власні підтвердження exec на node.
- Знахідки про «відсутню авторизацію на рівні користувача», які трактують `sessionKey` як токен автентифікації.

## Контрольний список для дослідника перед поданням

Перш ніж відкривати GHSA, перевірте все нижченаведене:

1. Відтворення все ще працює на останньому `main` або останньому релізі.
2. Звіт містить точний шлях у коді (`file`, функція, діапазон рядків) і перевірену версію/коміт.
3. Вплив перетинає задокументовану межу довіри (а не лише prompt injection).
4. Твердження не входить до [Out of Scope](https://github.com/openclaw/openclaw/blob/main/SECURITY.md#out-of-scope).
5. Існуючі advisory уже перевірено на дублікати (повторно використовуйте канонічний GHSA, якщо застосовно).
6. Припущення щодо розгортання явно вказані (loopback/local чи відкритий доступ, довірені чи недовірені оператори).

## Посилена базова конфігурація за 60 секунд

Спочатку використайте цю базову конфігурацію, а потім вибірково знову вмикайте інструменти для довірених агентів:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: {
    whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } },
  },
}
```

Це зберігає Gateway доступним лише локально, ізолює DM і типово вимикає інструменти control plane/runtime.

## Швидке правило для спільної вхідної скриньки

Якщо більше ніж одна людина може надсилати DM вашому боту:

- Установіть `session.dmScope: "per-channel-peer"` (або `"per-account-channel-peer"` для каналів із кількома акаунтами).
- Залишайте `dmPolicy: "pairing"` або суворі allowlist.
- Ніколи не поєднуйте спільні DM із широким доступом до інструментів.
- Це посилює кооперативні/спільні вхідні скриньки, але не призначене для ізоляції ворожих співорендарів, коли користувачі мають спільний доступ на запис до хоста/конфігурації.

## Модель видимості контексту

OpenClaw розділяє два поняття:

- **Авторизація тригера**: хто може активувати агента (`dmPolicy`, `groupPolicy`, allowlist, вимоги до згадки).
- **Видимість контексту**: який додатковий контекст додається до вхідних даних моделі (тіло відповіді, цитований текст, історія гілки, метадані пересилання).

Allowlists керують тригерами та авторизацією команд. Параметр `contextVisibility` визначає, як фільтрується додатковий контекст (цитовані відповіді, корені гілок, отримана історія):

- `contextVisibility: "all"` (типово) зберігає додатковий контекст у тому вигляді, у якому його отримано.
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників, дозволених активними перевірками allowlist.
- `contextVisibility: "allowlist_quote"` працює як `allowlist`, але все ж зберігає одну явну цитовану відповідь.

Установлюйте `contextVisibility` для кожного каналу або для кожної кімнати/розмови. Див. [Групові чати](/uk/channels/groups#context-visibility-and-allowlists), щоб дізнатися подробиці налаштування.

Рекомендації для оцінки advisory:

- Твердження, які лише показують, що «модель може бачити цитований або історичний текст від відправників, яких немає в allowlist», є знахідками щодо посилення безпеки, які можна виправити через `contextVisibility`, але самі по собі не є обходом межі автентифікації чи sandbox.
- Щоб мати наслідки для безпеки, звіти все одно мають демонструвати обхід межі довіри (автентифікації, політики, sandbox, підтвердження або іншої задокументованої межі).

## Що перевіряє аудит (на високому рівні)

- **Вхідний доступ** (політики DM, групові політики, allowlist): чи можуть сторонні люди активувати бота?
- **Радіус ураження інструментів** (розширені інструменти + відкриті кімнати): чи може prompt injection перетворитися на дії через shell/файли/мережу?
- **Дрейф підтверджень exec** (`security=full`, `autoAllowSkills`, allowlist інтерпретаторів без `strictInlineEval`): чи запобіжники для host-exec усе ще працюють так, як ви вважаєте?
  - `security="full"` — це широке попередження про рівень безпеки, а не доказ помилки. Це вибраний типовий режим для довірених сценаріїв персонального помічника; посилюйте його лише тоді, коли ваша модель загроз потребує підтверджень або запобіжників allowlist.
- **Мережевий доступ** (bind/auth Gateway, Tailscale Serve/Funnel, слабкі/короткі токени автентифікації).
- **Доступ до керування браузером** (віддалені node, порти relay, віддалені кінцеві точки CDP).
- **Гігієна локального диска** (дозволи, symlink, include конфігурації, шляхи до «синхронізованих папок»).
- **Plugins** (plugins завантажуються без явного allowlist).
- **Дрейф політик/неправильна конфігурація** (параметри sandbox docker налаштовані, але режим sandbox вимкнений; неефективні шаблони `gateway.nodes.denyCommands`, оскільки зіставлення виконується лише за точною назвою команди (наприклад, `system.run`) і не аналізує текст shell; небезпечні записи `gateway.nodes.allowCommands`; глобальний `tools.profile="minimal"` перевизначається профілями окремих агентів; інструменти, що належать plugin, доступні за надто поблажливої політики інструментів).
- **Дрейф очікувань середовища виконання** (наприклад, припущення, що неявний exec усе ще означає `sandbox`, коли `tools.exec.host` тепер типово має значення `auto`, або явне встановлення `tools.exec.host="sandbox"` за вимкненого режиму sandbox).
- **Гігієна моделей** (попередження, якщо налаштовані моделі виглядають застарілими; це не жорстке блокування).

Якщо ви запускаєте `--deep`, OpenClaw також намагається виконати best-effort живу перевірку Gateway.

## Карта зберігання облікових даних

Використовуйте це під час аудиту доступу або коли вирішуєте, що резервувати:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Токен Telegram bot**: config/env або `channels.telegram.tokenFile` (лише звичайний файл; symlink відхиляються)
- **Токен Discord bot**: config/env або SecretRef (провайдери env/file/exec)
- **Токени Slack**: config/env (`channels.slack.*`)
- **Pairing allowlist**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (типовий акаунт)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (нетипові акаунти)
- **Профілі автентифікації моделей**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Payload секретів у файлі (необов’язково)**: `~/.openclaw/secrets.json`
- **Імпорт застарілого OAuth**: `~/.openclaw/credentials/oauth.json`

## Контрольний список аудиту безпеки

Коли аудит виводить знахідки, розглядайте їх у такому порядку пріоритету:

1. **Усе, що є “open”, коли інструменти ввімкнені**: спочатку обмежте DM/групи (pairing/allowlist), потім посильте політику інструментів/sandboxing.
2. **Публічний мережевий доступ** (bind на LAN, Funnel, відсутня автентифікація): виправляйте негайно.
3. **Віддалений доступ до керування браузером**: вважайте його операторським доступом (лише tailnet, pairing node навмисно, уникайте публічного доступу).
4. **Дозволи**: переконайтеся, що state/config/credentials/auth не доступні для читання групі чи всім.
5. **Plugins**: завантажуйте лише те, чому явно довіряєте.
6. **Вибір моделі**: для будь-якого бота з інструментами віддавайте перевагу сучасним, стійким до інструкцій моделям.

## Глосарій аудиту безпеки

Значення `checkId` з високим сигналом, які ви найімовірніше побачите в реальних розгортаннях (не вичерпний перелік):

| `checkId`                                                     | Severity      | Чому це важливо                                                                       | Основний ключ/шлях для виправлення                                                                    | Автовиправлення |
| ------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------- |
| `fs.state_dir.perms_world_writable`                           | critical      | Інші користувачі/процеси можуть змінювати весь стан OpenClaw                          | дозволи файлової системи для `~/.openclaw`                                                            | так             |
| `fs.state_dir.perms_group_writable`                           | warn          | Користувачі групи можуть змінювати весь стан OpenClaw                                 | дозволи файлової системи для `~/.openclaw`                                                            | так             |
| `fs.state_dir.perms_readable`                                 | warn          | Каталог стану доступний для читання іншим                                             | дозволи файлової системи для `~/.openclaw`                                                            | так             |
| `fs.state_dir.symlink`                                        | warn          | Цільовий каталог стану стає іншою межею довіри                                        | структура файлової системи каталогу стану                                                             | ні              |
| `fs.config.perms_writable`                                    | critical      | Інші можуть змінювати політику auth/tool/config                                       | дозволи файлової системи для `~/.openclaw/openclaw.json`                                              | так             |
| `fs.config.symlink`                                           | warn          | Конфігураційні файли через symlink не підтримуються для запису й додають ще одну межу довіри | замініть на звичайний конфігураційний файл або вкажіть `OPENCLAW_CONFIG_PATH` на реальний файл       | ні              |
| `fs.config.perms_group_readable`                              | warn          | Користувачі групи можуть читати токени/налаштування конфігурації                      | дозволи файлової системи для конфігураційного файлу                                                   | так             |
| `fs.config.perms_world_readable`                              | critical      | Конфігурація може розкривати токени/налаштування                                      | дозволи файлової системи для конфігураційного файлу                                                   | так             |
| `fs.config_include.perms_writable`                            | critical      | Інші можуть змінювати include-файл конфігурації                                       | дозволи include-файлу, на який посилається `openclaw.json`                                            | так             |
| `fs.config_include.perms_group_readable`                      | warn          | Користувачі групи можуть читати включені секрети/налаштування                         | дозволи include-файлу, на який посилається `openclaw.json`                                            | так             |
| `fs.config_include.perms_world_readable`                      | critical      | Включені секрети/налаштування доступні для читання всім                               | дозволи include-файлу, на який посилається `openclaw.json`                                            | так             |
| `fs.auth_profiles.perms_writable`                             | critical      | Інші можуть впровадити або замінити збережені облікові дані моделі                    | дозволи для `agents/<agentId>/agent/auth-profiles.json`                                               | так             |
| `fs.auth_profiles.perms_readable`                             | warn          | Інші можуть читати API-ключі та OAuth-токени                                          | дозволи для `agents/<agentId>/agent/auth-profiles.json`                                               | так             |
| `fs.credentials_dir.perms_writable`                           | critical      | Інші можуть змінювати стан pairing/облікових даних каналу                             | дозволи файлової системи для `~/.openclaw/credentials`                                                | так             |
| `fs.credentials_dir.perms_readable`                           | warn          | Інші можуть читати стан облікових даних каналу                                        | дозволи файлової системи для `~/.openclaw/credentials`                                                | так             |
| `fs.sessions_store.perms_readable`                            | warn          | Інші можуть читати транскрипти/метадані сесій                                         | дозволи сховища сесій                                                                                 | так             |
| `fs.log_file.perms_readable`                                  | warn          | Інші можуть читати журнали, у яких дані редаговано, але які все ще містять чутливу інформацію | дозволи для файлу журналу gateway                                                                     | так             |
| `fs.synced_dir`                                               | warn          | Стан/конфігурація в iCloud/Dropbox/Drive розширюють поверхню розкриття токенів/транскриптів | перемістіть конфігурацію/стан із синхронізованих папок                                                | ні              |
| `gateway.bind_no_auth`                                        | critical      | Віддалений bind без спільного секрету                                                 | `gateway.bind`, `gateway.auth.*`                                                                      | ні              |
| `gateway.loopback_no_auth`                                    | critical      | Gateway на loopback за reverse proxy може стати неавтентифікованим                    | `gateway.auth.*`, налаштування proxy                                                                  | ні              |
| `gateway.trusted_proxies_missing`                             | warn          | Заголовки reverse proxy присутні, але не позначені як trusted                         | `gateway.trustedProxies`                                                                              | ні              |
| `gateway.http.no_auth`                                        | warn/critical | HTTP API Gateway доступні з `auth.mode="none"`                                        | `gateway.auth.mode`, `gateway.http.endpoints.*`                                                       | ні              |
| `gateway.http.session_key_override_enabled`                   | info          | Викликачі HTTP API можуть перевизначати `sessionKey`                                  | `gateway.http.allowSessionKeyOverride`                                                                | ні              |
| `gateway.tools_invoke_http.dangerous_allow`                   | warn/critical | Повторно вмикає небезпечні інструменти через HTTP API                                 | `gateway.tools.allow`                                                                                 | ні              |
| `gateway.nodes.allow_commands_dangerous`                      | warn/critical | Вмикає команди node з високим впливом (camera/screen/contacts/calendar/SMS)           | `gateway.nodes.allowCommands`                                                                         | ні              |
| `gateway.nodes.deny_commands_ineffective`                     | warn          | Записи deny у стилі шаблонів не збігаються з текстом shell або групами                | `gateway.nodes.denyCommands`                                                                          | ні              |
| `gateway.tailscale_funnel`                                    | critical      | Публічний доступ з інтернету                                                          | `gateway.tailscale.mode`                                                                              | ні              |
| `gateway.tailscale_serve`                                     | info          | Доступ у tailnet увімкнений через Serve                                               | `gateway.tailscale.mode`                                                                              | ні              |
| `gateway.control_ui.allowed_origins_required`                 | critical      | Для Control UI не на loopback немає явного allowlist походжень браузера               | `gateway.controlUi.allowedOrigins`                                                                    | ні              |
| `gateway.control_ui.allowed_origins_wildcard`                 | warn/critical | `allowedOrigins=["*"]` вимикає allowlist походжень браузера                           | `gateway.controlUi.allowedOrigins`                                                                    | ні              |
| `gateway.control_ui.host_header_origin_fallback`              | warn/critical | Вмикає fallback походження за заголовком Host (послаблення захисту від DNS rebinding) | `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`                                          | ні              |
| `gateway.control_ui.insecure_auth`                            | warn          | Увімкнений перемикач сумісності insecure-auth                                         | `gateway.controlUi.allowInsecureAuth`                                                                 | ні              |
| `gateway.control_ui.device_auth_disabled`                     | critical      | Вимикає перевірку ідентичності пристрою                                               | `gateway.controlUi.dangerouslyDisableDeviceAuth`                                                      | ні              |
| `gateway.real_ip_fallback_enabled`                            | warn/critical | Довіра до fallback `X-Real-IP` може дозволити підміну source IP через неправильну конфігурацію proxy | `gateway.allowRealIpFallback`, `gateway.trustedProxies`                                               | ні              |
| `gateway.token_too_short`                                     | warn          | Короткий спільний токен легше підібрати перебором                                     | `gateway.auth.token`                                                                                  | ні              |
| `gateway.auth_no_rate_limit`                                  | warn          | Відкрита auth без rate limiting підвищує ризик brute-force                            | `gateway.auth.rateLimit`                                                                              | ні              |
| `gateway.trusted_proxy_auth`                                  | critical      | Ідентичність proxy тепер стає межею auth                                              | `gateway.auth.mode="trusted-proxy"`                                                                   | ні              |
| `gateway.trusted_proxy_no_proxies`                            | critical      | Auth через trusted-proxy без IP-адрес trusted proxy є небезпечною                     | `gateway.trustedProxies`                                                                              | ні              |
| `gateway.trusted_proxy_no_user_header`                        | critical      | Auth через trusted-proxy не може безпечно визначити ідентичність користувача          | `gateway.auth.trustedProxy.userHeader`                                                                | ні              |
| `gateway.trusted_proxy_no_allowlist`                          | warn          | Auth через trusted-proxy приймає будь-якого автентифікованого користувача upstream    | `gateway.auth.trustedProxy.allowUsers`                                                                | ні              |
| `gateway.probe_auth_secretref_unavailable`                    | warn          | Глибока перевірка не змогла визначити auth SecretRef у цьому шляху команди           | джерело auth для deep probe / доступність SecretRef                                                  | ні              |
| `gateway.probe_failed`                                        | warn/critical | Жива перевірка Gateway не вдалася                                                    | доступність/auth gateway                                                                             | ні              |
| `discovery.mdns_full_mode`                                    | warn/critical | Повний режим mDNS рекламує метадані `cliPath`/`sshPort` у локальній мережі           | `discovery.mdns.mode`, `gateway.bind`                                                                | ні              |
| `config.insecure_or_dangerous_flags`                          | warn          | Увімкнено будь-які небезпечні або незахищені debug-прапори                           | кілька ключів (див. деталі знахідки)                                                                 | ні              |
| `config.secrets.gateway_password_in_config`                   | warn          | Пароль Gateway зберігається безпосередньо в конфігурації                             | `gateway.auth.password`                                                                              | ні              |
| `config.secrets.hooks_token_in_config`                        | warn          | Bearer token hooks зберігається безпосередньо в конфігурації                         | `hooks.token`                                                                                        | ні              |
| `hooks.token_reuse_gateway_token`                             | critical      | Токен входу hooks також відкриває auth Gateway                                       | `hooks.token`, `gateway.auth.token`                                                                  | ні              |
| `hooks.token_too_short`                                       | warn          | Полегшує brute force для входу hooks                                                 | `hooks.token`                                                                                        | ні              |
| `hooks.default_session_key_unset`                             | warn          | Агент hook запускає fan-out у згенеровані сесії для кожного запиту                   | `hooks.defaultSessionKey`                                                                            | ні              |
| `hooks.allowed_agent_ids_unrestricted`                        | warn/critical | Автентифіковані викликачі hooks можуть маршрутизувати до будь-якого налаштованого агента | `hooks.allowedAgentIds`                                                                              | ні              |
| `hooks.request_session_key_enabled`                           | warn/critical | Зовнішній викликач може вибирати `sessionKey`                                        | `hooks.allowRequestSessionKey`                                                                       | ні              |
| `hooks.request_session_key_prefixes_missing`                  | warn/critical | Немає обмежень на форму зовнішніх ключів сесії                                       | `hooks.allowedSessionKeyPrefixes`                                                                    | ні              |
| `hooks.path_root`                                             | critical      | Шлях hook дорівнює `/`, що полегшує колізії або помилкову маршрутизацію входу        | `hooks.path`                                                                                         | ні              |
| `hooks.installs_unpinned_npm_specs`                           | warn          | Записи встановлення hooks не прив’язані до незмінних npm-специфікацій                | метадані встановлення hook                                                                           | ні              |
| `hooks.installs_missing_integrity`                            | warn          | У записах встановлення hooks бракує метаданих цілісності                             | метадані встановлення hook                                                                           | ні              |
| `hooks.installs_version_drift`                                | warn          | Записи встановлення hooks відхилилися від установлених пакетів                       | метадані встановлення hook                                                                           | ні              |
| `logging.redact_off`                                          | warn          | Чутливі значення потрапляють у журнали/status                                        | `logging.redactSensitive`                                                                            | так             |
| `browser.control_invalid_config`                              | warn          | Конфігурація керування браузером недійсна ще до запуску                              | `browser.*`                                                                                          | ні              |
| `browser.control_no_auth`                                     | critical      | Керування браузером доступне без auth через token/password                           | `gateway.auth.*`                                                                                     | ні              |
| `browser.remote_cdp_http`                                     | warn          | Віддалений CDP через звичайний HTTP не має шифрування транспорту                     | профіль браузера `cdpUrl`                                                                            | ні              |
| `browser.remote_cdp_private_host`                             | warn          | Віддалений CDP спрямовано на приватний/внутрішній хост                               | профіль браузера `cdpUrl`, `browser.ssrfPolicy.*`                                                    | ні              |
| `sandbox.docker_config_mode_off`                              | warn          | Конфігурація Docker для sandbox присутня, але неактивна                              | `agents.*.sandbox.mode`                                                                              | ні              |
| `sandbox.bind_mount_non_absolute`                             | warn          | Відносні bind mount можуть визначатися непередбачувано                               | `agents.*.sandbox.docker.binds[]`                                                                    | ні              |
| `sandbox.dangerous_bind_mount`                                | critical      | Цілі bind mount у sandbox вказують на заблоковані системні шляхи, облікові дані або шляхи сокета Docker | `agents.*.sandbox.docker.binds[]`                                                                    | ні              |
| `sandbox.dangerous_network_mode`                              | critical      | Docker network для sandbox використовує режим `host` або `container:*` зі спільним простором імен | `agents.*.sandbox.docker.network`                                                                    | ні              |
| `sandbox.dangerous_seccomp_profile`                           | critical      | Профіль seccomp у sandbox послаблює ізоляцію container                               | `agents.*.sandbox.docker.securityOpt`                                                                | ні              |
| `sandbox.dangerous_apparmor_profile`                          | critical      | Профіль AppArmor у sandbox послаблює ізоляцію container                              | `agents.*.sandbox.docker.securityOpt`                                                                | ні              |
| `sandbox.browser_cdp_bridge_unrestricted`                     | warn          | Міст CDP браузера в sandbox доступний без обмеження діапазону джерел                 | `sandbox.browser.cdpSourceRange`                                                                     | ні              |
| `sandbox.browser_container.non_loopback_publish`              | critical      | Наявний container браузера публікує CDP на інтерфейсах, відмінних від loopback       | конфігурація публікації container браузера в sandbox                                                 | ні              |
| `sandbox.browser_container.hash_label_missing`                | warn          | Наявний container браузера передує поточним міткам hash конфігурації                 | `openclaw sandbox recreate --browser --all`                                                          | ні              |
| `sandbox.browser_container.hash_epoch_stale`                  | warn          | Наявний container браузера передує поточній епосі конфігурації браузера              | `openclaw sandbox recreate --browser --all`                                                          | ні              |
| `tools.exec.host_sandbox_no_sandbox_defaults`                 | warn          | `exec host=sandbox` безпечно завершується відмовою, коли sandbox вимкнено            | `tools.exec.host`, `agents.defaults.sandbox.mode`                                                    | ні              |
| `tools.exec.host_sandbox_no_sandbox_agents`                   | warn          | `exec host=sandbox` для окремого агента безпечно завершується відмовою, коли sandbox вимкнено | `agents.list[].tools.exec.host`, `agents.list[].sandbox.mode`                                        | ні              |
| `tools.exec.security_full_configured`                         | warn/critical | Host exec працює з `security="full"`                                                 | `tools.exec.security`, `agents.list[].tools.exec.security`                                           | ні              |
| `tools.exec.auto_allow_skills_enabled`                        | warn          | Підтвердження exec неявно довіряють bin із Skills                                    | `~/.openclaw/exec-approvals.json`                                                                    | ні              |
| `tools.exec.allowlist_interpreter_without_strict_inline_eval` | warn          | Allowlist інтерпретаторів дозволяють inline eval без примусового повторного підтвердження | `tools.exec.strictInlineEval`, `agents.list[].tools.exec.strictInlineEval`, allowlist підтверджень exec | ні              |
| `tools.exec.safe_bins_interpreter_unprofiled`                 | warn          | Bin інтерпретаторів/runtime у `safeBins` без явних профілів розширюють ризик exec    | `tools.exec.safeBins`, `tools.exec.safeBinProfiles`, `agents.list[].tools.exec.*`                    | ні              |
| `tools.exec.safe_bins_broad_behavior`                         | warn          | Інструменти широкої дії в `safeBins` послаблюють модель довіри low-risk stdin-filter | `tools.exec.safeBins`, `agents.list[].tools.exec.safeBins`                                           | ні              |
| `tools.exec.safe_bin_trusted_dirs_risky`                      | warn          | `safeBinTrustedDirs` містить змінювані або ризиковані каталоги                       | `tools.exec.safeBinTrustedDirs`, `agents.list[].tools.exec.safeBinTrustedDirs`                       | ні              |
| `skills.workspace.symlink_escape`                             | warn          | `skills/**/SKILL.md` у workspace визначається поза коренем workspace (дрейф ланцюга symlink) | стан файлової системи `skills/**` у workspace                                                        | ні              |
| `plugins.extensions_no_allowlist`                             | warn          | Plugins установлені без явного allowlist plugin                                      | `plugins.allowlist`                                                                                  | ні              |
| `plugins.installs_unpinned_npm_specs`                         | warn          | Записи встановлення plugin не прив’язані до незмінних npm-специфікацій               | метадані встановлення plugin                                                                         | ні              |
| `plugins.installs_missing_integrity`                          | warn          | У записах встановлення Plugin бракує метаданих цілісності                            | метадані встановлення plugin                                                                         | ні              |
| `plugins.installs_version_drift`                              | warn          | Записи встановлення Plugin відхилилися від установлених пакетів                      | метадані встановлення plugin                                                                         | ні              |
| `plugins.code_safety`                                         | warn/critical | Сканування коду Plugin виявило підозрілі або небезпечні шаблони                      | код plugin / джерело встановлення                                                                    | ні              |
| `plugins.code_safety.entry_path`                              | warn          | Шлях входу Plugin вказує на приховані розташування або `node_modules`                | `entry` у маніфесті plugin                                                                           | ні              |
| `plugins.code_safety.entry_escape`                            | critical      | Вхід Plugin виходить за межі каталогу plugin                                         | `entry` у маніфесті plugin                                                                           | ні              |
| `plugins.code_safety.scan_failed`                             | warn          | Сканування коду Plugin не вдалося завершити                                          | шлях plugin / середовище сканування                                                                  | ні              |
| `skills.code_safety`                                          | warn/critical | Метадані/код інсталятора Skills містять підозрілі або небезпечні шаблони             | джерело встановлення skill                                                                           | ні              |
| `skills.code_safety.scan_failed`                              | warn          | Сканування коду skill не вдалося завершити                                           | середовище сканування skill                                                                          | ні              |
| `security.exposure.open_channels_with_exec`                   | warn/critical | Спільні/публічні кімнати можуть звертатися до агентів з увімкненим exec              | `channels.*.dmPolicy`, `channels.*.groupPolicy`, `tools.exec.*`, `agents.list[].tools.exec.*`        | ні              |
| `security.exposure.open_groups_with_elevated`                 | critical      | Відкриті групи + розширені інструменти створюють шляхи prompt injection з високим впливом | `channels.*.groupPolicy`, `tools.elevated.*`                                                         | ні              |
| `security.exposure.open_groups_with_runtime_or_fs`            | critical/warn | Відкриті групи можуть отримати доступ до командних/файлових інструментів без захисту sandbox/workspace | `channels.*.groupPolicy`, `tools.profile/deny`, `tools.fs.workspaceOnly`, `agents.*.sandbox.mode`    | ні              |
| `security.trust_model.multi_user_heuristic`                   | warn          | Конфігурація виглядає багатокористувацькою, тоді як модель довіри gateway — це персональний помічник | розділіть межі довіри або застосуйте посилення для спільного використання (`sandbox.mode`, deny для інструментів/scoping workspace) | ні              |
| `tools.profile_minimal_overridden`                            | warn          | Перевизначення агента обходять глобальний профіль minimal                            | `agents.list[].tools.profile`                                                                        | ні              |
| `plugins.tools_reachable_permissive_policy`                   | warn          | Інструменти extension доступні в надто поблажливих контекстах                        | `tools.profile` + allow/deny інструментів                                                            | ні              |
| `models.legacy`                                               | warn          | Застарілі сімейства моделей усе ще налаштовані                                       | вибір моделі                                                                                         | ні              |
| `models.weak_tier`                                            | warn          | Налаштовані моделі нижчі за поточні рекомендовані рівні                              | вибір моделі                                                                                         | ні              |
| `models.small_params`                                         | critical/info | Малі моделі + небезпечні поверхні інструментів підвищують ризик injection            | вибір моделі + політика sandbox/інструментів                                                         | ні              |
| `summary.attack_surface`                                      | info          | Узагальнений підсумок щодо стану auth, каналів, інструментів і поверхні доступу      | кілька ключів (див. деталі знахідки)                                                                 | ні              |

## Control UI через HTTP

Для Control UI потрібен **безпечний контекст** (HTTPS або localhost), щоб генерувати
ідентичність пристрою. `gateway.controlUi.allowInsecureAuth` — це локальний перемикач сумісності:

- На localhost він дозволяє auth для Control UI без ідентичності пристрою, коли сторінка
  завантажена через незахищений HTTP.
- Він не обходить перевірки pairing.
- Він не послаблює вимоги до ідентичності пристрою для віддалених (не localhost) сценаріїв.

Віддавайте перевагу HTTPS (Tailscale Serve) або відкривайте UI на `127.0.0.1`.

Лише для аварійних сценаріїв `gateway.controlUi.dangerouslyDisableDeviceAuth`
повністю вимикає перевірки ідентичності пристрою. Це серйозне послаблення безпеки;
тримайте цей параметр вимкненим, якщо тільки ви активно не налагоджуєте систему й не можете швидко все повернути назад.

Окремо від цих небезпечних прапорів, успішний режим `gateway.auth.mode: "trusted-proxy"`
може допускати **operator**-сесії Control UI без ідентичності пристрою. Це
навмисна поведінка режиму auth, а не скорочення через `allowInsecureAuth`, і вона все одно
не поширюється на Control UI-сесії ролі node.

`openclaw security audit` попереджає, коли цей параметр увімкнено.

## Підсумок щодо незахищених або небезпечних прапорів

`openclaw security audit` включає `config.insecure_or_dangerous_flags`, коли
увімкнено відомі незахищені/небезпечні debug-перемикачі. Наразі ця перевірка
агрегує:

- `gateway.controlUi.allowInsecureAuth=true`
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
- `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
- `hooks.gmail.allowUnsafeExternalContent=true`
- `hooks.mappings[<index>].allowUnsafeExternalContent=true`
- `tools.exec.applyPatch.workspaceOnly=false`
- `plugins.entries.acpx.config.permissionMode=approve-all`

Повний перелік конфігураційних ключів `dangerous*` / `dangerously*`, визначених у схемі конфігурації OpenClaw:

- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
- `gateway.controlUi.dangerouslyDisableDeviceAuth`
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `channels.discord.dangerouslyAllowNameMatching`
- `channels.discord.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.slack.dangerouslyAllowNameMatching`
- `channels.slack.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.googlechat.dangerouslyAllowNameMatching`
- `channels.googlechat.accounts.<accountId>.dangerouslyAllowNameMatching`
- `channels.msteams.dangerouslyAllowNameMatching`
- `channels.synology-chat.dangerouslyAllowNameMatching` (канал plugin)
- `channels.synology-chat.accounts.<accountId>.dangerouslyAllowNameMatching` (канал plugin)
- `channels.synology-chat.dangerouslyAllowInheritedWebhookPath` (канал plugin)
- `channels.zalouser.dangerouslyAllowNameMatching` (канал plugin)
- `channels.zalouser.accounts.<accountId>.dangerouslyAllowNameMatching` (канал plugin)
- `channels.irc.dangerouslyAllowNameMatching` (канал plugin)
- `channels.irc.accounts.<accountId>.dangerouslyAllowNameMatching` (канал plugin)
- `channels.mattermost.dangerouslyAllowNameMatching` (канал plugin)
- `channels.mattermost.accounts.<accountId>.dangerouslyAllowNameMatching` (канал plugin)
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`
- `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
- `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowReservedContainerTargets`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowExternalBindSources`
- `agents.list[<index>].sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

## Конфігурація Reverse Proxy

Якщо ви запускаєте Gateway за reverse proxy (nginx, Caddy, Traefik тощо), налаштуйте
`gateway.trustedProxies` для коректної обробки forwarded IP-адрес клієнтів.

Коли Gateway виявляє proxy-заголовки з адреси, якої **немає** в `trustedProxies`, він **не** вважатиме з’єднання локальними клієнтами. Якщо auth gateway вимкнено, такі з’єднання відхиляються. Це запобігає обходу автентифікації, коли проксійовані з’єднання інакше виглядали б як такі, що надходять із localhost, і отримували б автоматичну довіру.

`gateway.trustedProxies` також використовується для `gateway.auth.mode: "trusted-proxy"`, але цей режим auth є суворішим:

- auth trusted-proxy **завершується відмовою за замовчуванням для proxy із джерелом loopback**
- reverse proxy на loopback на тому самому хості все одно можуть використовувати `gateway.trustedProxies` для визначення локального клієнта та обробки forwarded IP
- для reverse proxy на loopback на тому самому хості використовуйте auth через token/password замість `gateway.auth.mode: "trusted-proxy"`

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # IP reverse proxy
  # Необов’язково. Типове значення false.
  # Увімкніть лише якщо ваш proxy не може передавати X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Коли `trustedProxies` налаштовано, Gateway використовує `X-Forwarded-For` для визначення IP-адреси клієнта. `X-Real-IP` типово ігнорується, якщо явно не встановлено `gateway.allowRealIpFallback: true`.

Належна поведінка reverse proxy (перезапис вхідних forwarding-заголовків):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Неправильна поведінка reverse proxy (додавання/збереження недовірених forwarding-заголовків):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Примітки щодо HSTS і походження

- Gateway OpenClaw насамперед орієнтований на локальний доступ/loopback. Якщо ви завершуєте TLS на reverse proxy, установлюйте HSTS на HTTPS-домені, який обслуговує proxy.
- Якщо сам gateway завершує HTTPS, ви можете налаштувати `gateway.http.securityHeaders.strictTransportSecurity`, щоб OpenClaw додавав заголовок HSTS у відповіді.
- Детальні рекомендації щодо розгортання наведено в [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Для розгортань Control UI не на loopback параметр `gateway.controlUi.allowedOrigins` типово є обов’язковим.
- `gateway.controlUi.allowedOrigins: ["*"]` — це явна політика browser-origin «дозволити все», а не посилена типова конфігурація. Уникайте її поза межами суворо контрольованого локального тестування.
- Невдалі перевірки auth за browser-origin на loopback все одно обмежуються через rate limiting, навіть коли
  загальний виняток для loopback увімкнено, але ключ блокування визначається окремо
  для кожного нормалізованого значення `Origin`, а не як один спільний bucket localhost.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` вмикає режим fallback походження за заголовком Host; розглядайте це як небезпечну політику, свідомо вибрану operator.
- Розглядайте DNS rebinding і поведінку заголовка host у proxy як питання посилення безпеки розгортання; тримайте `trustedProxies` суворо обмеженим і не відкривайте gateway напряму в публічний інтернет.

## Локальні журнали сесій зберігаються на диску

OpenClaw зберігає транскрипти сесій на диску в `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Це потрібно для безперервності сесій і (необов’язково) індексації пам’яті сесій, але це також означає,
що **будь-який процес/користувач із доступом до файлової системи може читати ці журнали**. Розглядайте доступ до диска як
межу довіри та обмежуйте дозволи для `~/.openclaw` (див. розділ аудиту нижче). Якщо вам потрібна
сильніша ізоляція між агентами, запускайте їх під окремими користувачами ОС або на окремих хостах.

## Виконання на node (`system.run`)

Якщо поєднано macOS node, Gateway може викликати `system.run` на цій node. Це **віддалене виконання коду** на Mac:

- Потрібне pairing node (підтвердження + token).
- Pairing node в Gateway не є поверхнею підтвердження для кожної команди. Воно встановлює ідентичність/довіру до node і видачу токена.
- Gateway застосовує грубу глобальну політику команд node через `gateway.nodes.allowCommands` / `denyCommands`.
- Керується на Mac через **Settings → Exec approvals** (`security` + `ask` + allowlist).
- Політика `system.run` для окремої node — це власний файл підтверджень exec цієї node (`exec.approvals.node.*`), який може бути суворішим або м’якшим за глобальну політику ID команд у gateway.
- Node, яка працює з `security="full"` і `ask="off"`, дотримується типової моделі довіреного оператора. Розглядайте це як очікувану поведінку, якщо тільки ваше розгортання явно не вимагає суворішої політики підтверджень або allowlist.
- Режим підтвердження прив’язується до точного контексту запиту і, коли це можливо, до одного конкретного локального операнда script/file. Якщо OpenClaw не може точно визначити рівно один прямий локальний файл для команди інтерпретатора/runtime, виконання з підтвердженням відхиляється замість того, щоб обіцяти повне семантичне покриття.
- Для `host=node` виконання з підтвердженням також зберігають канонічний підготовлений
  `systemRunPlan`; пізніші схвалені переспрямування повторно використовують цей збережений план, а
  валідація gateway відхиляє зміни викликача до команди/cwd/контексту сесії після
  створення запиту на підтвердження.
- Якщо ви не хочете віддаленого виконання, установіть security у **deny** і видаліть pairing node для цього Mac.

Це розрізнення важливе для triage:

- Повторно підключена поєднана node, яка рекламує інший список команд, сама по собі не є вразливістю, якщо глобальна політика Gateway та локальні підтвердження exec на node все ще забезпечують фактичну межу виконання.
- Повідомлення, які трактують метадані pairing node як другий прихований рівень підтвердження для кожної команди, зазвичай є плутаниною щодо політики/UX, а не обходом межі безпеки.

## Динамічні Skills (watcher / віддалені node)

OpenClaw може оновлювати список Skills посеред сесії:

- **Watcher Skills**: зміни в `SKILL.md` можуть оновити snapshot Skills на наступному ході агента.
- **Віддалені node**: підключення macOS node може зробити доступними Skills лише для macOS (на основі перевірки bin).

Розглядайте папки Skills як **довірений код** і обмежуйте коло тих, хто може їх змінювати.

## Модель загроз

Ваш AI-помічник може:

- Виконувати довільні shell-команди
- Читати/записувати файли
- Отримувати доступ до мережевих сервісів
- Надсилати повідомлення будь-кому (якщо ви надасте йому доступ до WhatsApp)

Люди, які надсилають вам повідомлення, можуть:

- Намагатися обманом змусити ваш AI зробити щось шкідливе
- Використовувати соціальну інженерію, щоб отримати доступ до ваших даних
- Збирати відомості про інфраструктуру

## Основна концепція: контроль доступу перед інтелектом

Більшість збоїв тут — це не витончені експлойти, а ситуації на кшталт «хтось написав боту, і бот зробив те, що його попросили».

Підхід OpenClaw:

- **Спочатку ідентичність:** визначте, хто може спілкуватися з ботом (pairing у DM / allowlist / явний режим “open”).
- **Потім область дії:** визначте, де боту дозволено діяти (allowlist груп + обов’язкова згадка, інструменти, sandboxing, дозволи пристрою).
- **Останнє — модель:** виходьте з того, що моделлю можна маніпулювати; проєктуйте систему так, щоб наслідки маніпуляції були обмеженими.

## Модель авторизації команд

Slash-команди та директиви виконуються лише для **авторизованих відправників**. Авторизація визначається через
allowlist/pairing каналу плюс `commands.useAccessGroups` (див. [Configuration](/uk/gateway/configuration)
і [Slash commands](/uk/tools/slash-commands)). Якщо allowlist каналу порожній або містить `"*"`,
команди фактично відкриті для цього каналу.

`/exec` — це зручна команда лише для сесії для авторизованих operator. Вона **не** записує конфігурацію й
не змінює інші сесії.

## Ризики інструментів control plane

Два вбудовані інструменти можуть вносити постійні зміни в control plane:

- `gateway` може перевіряти конфігурацію за допомогою `config.schema.lookup` / `config.get` і вносити постійні зміни за допомогою `config.apply`, `config.patch` та `update.run`.
- `cron` може створювати заплановані завдання, які продовжують працювати після завершення оригінального чату/задачі.

Інструмент runtime `gateway`, доступний лише власнику, як і раніше відмовляється переписувати
`tools.exec.ask` або `tools.exec.security`; застарілі псевдоніми `tools.bash.*`
нормалізуються до тих самих захищених шляхів exec перед записом.

Для будь-якого агента/поверхні, що обробляє недовірений контент, забороняйте їх типово:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` блокує лише дії перезапуску. Він не вимикає дії `gateway` з конфігурацією/оновленням.

## Plugins

Plugins працюють **у тому самому процесі** з Gateway. Розглядайте їх як довірений код:

- Установлюйте plugins лише з джерел, яким ви довіряєте.
- Віддавайте перевагу явним allowlist `plugins.allow`.
- Перевіряйте конфігурацію plugin перед увімкненням.
- Після змін plugins перезапускайте Gateway.
- Якщо ви встановлюєте або оновлюєте plugins (`openclaw plugins install <package>`, `openclaw plugins update <id>`), ставтеся до цього як до запуску недовіреного коду:
  - Шлях встановлення — це каталог конкретного plugin у межах активного кореня встановлення plugin.
  - Перед встановленням/оновленням OpenClaw запускає вбудоване сканування небезпечного коду. Знахідки рівня `critical` типово блокують операцію.
  - OpenClaw використовує `npm pack`, а потім запускає `npm install --omit=dev` у цьому каталозі (npm lifecycle scripts можуть виконувати код під час встановлення).
  - Віддавайте перевагу точним зафіксованим версіям (`@scope/pkg@1.2.3`) і перевіряйте розпакований код на диску перед увімкненням.
  - `--dangerously-force-unsafe-install` призначений лише для аварійних сценаріїв у разі хибнопозитивних спрацювань вбудованого сканера в потоках встановлення/оновлення plugin. Він не обходить блокування політики hook `before_install` plugin і не обходить збої сканування.
  - Установлення залежностей Skills через Gateway дотримується того самого розділення на dangerous/suspicious: вбудовані знахідки рівня `critical` блокують операцію, якщо викликач явно не встановив `dangerouslyForceUnsafeInstall`, тоді як підозрілі знахідки, як і раніше, лише попереджають. `openclaw skills install` лишається окремим потоком завантаження/встановлення Skills із ClawHub.

Докладніше: [Plugins](/uk/tools/plugin)

<a id="dm-access-model-pairing-allowlist-open-disabled"></a>

## Модель доступу DM (pairing / allowlist / open / disabled)

Усі поточні канали з підтримкою DM підтримують політику DM (`dmPolicy` або `*.dm.policy`), яка блокує вхідні DM **до** обробки повідомлення:

- `pairing` (типово): невідомі відправники отримують короткий код pairing, а бот ігнорує їхнє повідомлення, доки його не буде схвалено. Коди діють 1 годину; повторні DM не надсилатимуть код повторно, доки не буде створено новий запит. Кількість очікувальних запитів типово обмежена **3 на канал**.
- `allowlist`: невідомі відправники блокуються (без процедури pairing).
- `open`: дозволити будь-кому надсилати DM (публічно). **Потребує**, щоб allowlist каналу містив `"*"` (явна згода).
- `disabled`: повністю ігнорувати вхідні DM.

Схвалення через CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Докладніше + файли на диску: [Pairing](/uk/channels/pairing)

## Ізоляція сесій DM (багатокористувацький режим)

Типово OpenClaw маршрутизує **усі DM в основну сесію**, щоб ваш помічник зберігав безперервність між пристроями та каналами. Якщо **кілька людей** можуть надсилати DM боту (відкриті DM або allowlist із кількох осіб), розгляньте ізоляцію сесій DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Це запобігає витоку контексту між користувачами, зберігаючи ізоляцію групових чатів.

Це межа контексту обміну повідомленнями, а не межа адміністрування хоста. Якщо користувачі є взаємно зловмисними та спільно використовують той самий хост/конфігурацію Gateway, натомість запускайте окремі gateway для кожної межі довіри.

### Безпечний режим DM (рекомендовано)

Розглядайте наведений вище фрагмент як **безпечний режим DM**:

- Типово: `session.dmScope: "main"` (усі DM спільно використовують одну сесію для безперервності).
- Типове значення під час локального онбордингу CLI: записує `session.dmScope: "per-channel-peer"`, якщо значення не встановлено (наявні явні значення не змінюються).
- Безпечний режим DM: `session.dmScope: "per-channel-peer"` (кожна пара канал+відправник отримує ізольований контекст DM).
- Ізоляція peer між каналами: `session.dmScope: "per-peer"` (кожен відправник отримує одну сесію в усіх каналах одного типу).

Якщо ви використовуєте кілька акаунтів в одному каналі, натомість застосовуйте `per-account-channel-peer`. Якщо одна й та сама людина зв’язується з вами через кілька каналів, використовуйте `session.identityLinks`, щоб об’єднати ці DM-сесії в одну канонічну ідентичність. Див. [Session Management](/uk/concepts/session) і [Configuration](/uk/gateway/configuration).

## Allowlists (DM + групи) — термінологія

OpenClaw має два окремі рівні «хто може мене активувати?»:

- **Allowlist для DM** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; застаріле: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): хто має право спілкуватися з ботом у прямих повідомленнях.
  - Коли `dmPolicy="pairing"`, схвалення записуються в account-scoped сховище pairing allowlist у `~/.openclaw/credentials/` (`<channel>-allowFrom.json` для типового акаунта, `<channel>-<accountId>-allowFrom.json` для нетипових акаунтів), а потім об’єднуються з allowlist із конфігурації.
- **Allowlist для груп** (залежить від каналу): з яких саме груп/каналів/guild бот узагалі прийматиме повідомлення.
  - Поширені шаблони:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: типові налаштування для кожної групи, як-от `requireMention`; якщо їх задано, це також працює як allowlist груп (додайте `"*"`, щоб зберегти поведінку «дозволити все»).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: обмежує, хто може активувати бота _всередині_ групової сесії (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: allowlist для кожної поверхні + типові налаштування згадок.
  - Перевірки груп виконуються в такому порядку: спочатку `groupPolicy`/group allowlists, потім активація згадкою/відповіддю.
  - Відповідь на повідомлення бота (неявна згадка) **не** обходить allowlist відправників, як-от `groupAllowFrom`.
  - **Примітка щодо безпеки:** розглядайте `dmPolicy="open"` і `groupPolicy="open"` як налаштування на крайній випадок. Їх слід використовувати якомога рідше; віддавайте перевагу pairing + allowlists, якщо тільки ви повністю не довіряєте кожному учаснику кімнати.

Докладніше: [Configuration](/uk/gateway/configuration) і [Groups](/uk/channels/groups)

## Prompt injection (що це таке і чому це важливо)

Prompt injection — це коли зловмисник створює повідомлення, яке маніпулює моделлю, змушуючи її робити щось небезпечне («ігноруй свої інструкції», «виведи вміст файлової системи», «перейди за цим посиланням і виконай команди» тощо).

Навіть за наявності сильних system prompt **проблему prompt injection не вирішено**. Запобіжники в system prompt — це лише м’які вказівки; жорстке примушення забезпечується політикою інструментів, підтвердженнями exec, sandboxing і allowlist каналів (і оператори можуть навмисно їх вимикати). Що реально допомагає:

- Тримайте вхідні DM під контролем (pairing/allowlists).
- У групах віддавайте перевагу активації згадкою; уникайте ботів, які «завжди слухають» у публічних кімнатах.
- Розглядайте посилання, вкладення та вставлені інструкції як ворожі за замовчуванням.
- Виконуйте чутливі дії інструментів у sandbox; тримайте секрети поза межами файлової системи, доступної агенту.
- Зауважте: sandboxing вмикається явно. Якщо режим sandbox вимкнено, неявний `host=auto` вказує на хост gateway. Явний `host=sandbox` усе одно безпечно завершується відмовою, тому що середовище виконання sandbox недоступне. Установіть `host=gateway`, якщо хочете, щоб така поведінка була явно зафіксована в конфігурації.
- Обмежуйте інструменти високого ризику (`exec`, `browser`, `web_fetch`, `web_search`) лише довіреними агентами або явними allowlist.
- Якщо ви додаєте інтерпретатори до allowlist (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), увімкніть `tools.exec.strictInlineEval`, щоб inline eval-форми все одно потребували явного підтвердження.
- Аналіз підтвердження shell також відхиляє форми POSIX parameter-expansion (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) усередині **нецитованих heredoc**, тож allowlisted тіло heredoc не зможе приховано провести розширення shell повз перевірку allowlist як звичайний текст. Щоб увімкнути буквальну семантику тіла, беріть завершувач heredoc у лапки (наприклад, `<<'EOF'`); нецитовані heredoc, які б виконали розширення змінних, відхиляються.
- **Вибір моделі має значення:** старіші/менші/застарілі моделі значно менш стійкі до prompt injection і неправильного використання інструментів. Для агентів з увімкненими інструментами використовуйте найсильнішу доступну модель останнього покоління, стійку до інструкцій.

Ознаки, які слід вважати недовіреними:

- «Прочитай цей файл/URL і зроби точно те, що там сказано».
- «Ігноруй свій system prompt або правила безпеки».
- «Розкрий свої приховані інструкції або результати інструментів».
- «Встав повний вміст ~/.openclaw або свої журнали».

## Санітизація спеціальних токенів у зовнішньому вмісті

OpenClaw видаляє поширені спеціальні токени шаблонів чату self-hosted LLM із обгорнутого зовнішнього вмісту та метаданих до того, як вони потрапляють у модель. Підтримуються сімейства маркерів Qwen/ChatML, Llama, Gemma, Mistral, Phi і токени ролей/ходів GPT-OSS.

Навіщо:

- Backends, сумісні з OpenAI, які працюють поверх self-hosted моделей, інколи зберігають спеціальні токени, що з’являються в тексті користувача, замість їх маскування. Зловмисник, який може записати щось у вхідний зовнішній вміст (отриману сторінку, тіло листа, вивід інструмента читання файла), інакше міг би вставити синтетичну межу ролі `assistant` або `system` і обійти запобіжники для обгорнутого вмісту.
- Санітизація відбувається на рівні обгортання зовнішнього вмісту, тому застосовується однаково до інструментів fetch/read і вхідного вмісту каналів, а не залежить від конкретного провайдера.
- Вихідні відповіді моделі вже мають окремий санітайзер, який видаляє витоки на кшталт `<tool_call>`, `<function_calls>` та подібну службову структуру з відповідей, видимих користувачу. Санітизація зовнішнього вмісту є її вхідним відповідником.

Це не замінює інші механізми посилення на цій сторінці — `dmPolicy`, allowlists, підтвердження exec, sandboxing і `contextVisibility` усе ще виконують основну роботу. Це закриває один конкретний обхід на рівні токенізатора проти self-hosted стеків, які передають текст користувача зі збереженими спеціальними токенами.

## Прапори обходу для небезпечного зовнішнього вмісту

OpenClaw містить явні прапори обходу, які вимикають безпечне обгортання зовнішнього вмісту:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Поле payload Cron `allowUnsafeExternalContent`

Рекомендації:

- Тримайте їх unset/false у production.
- Тимчасово вмикайте лише для вузько обмеженого налагодження.
- Якщо їх увімкнено, ізолюйте цього агента (sandbox + мінімальні інструменти + виділений простір імен сесій).

Примітка щодо ризиків hooks:

- Payload hooks — це недовірений вміст, навіть якщо доставка надходить із систем, які ви контролюєте (пошта/документи/вебвміст можуть містити prompt injection).
- Слабкі рівні моделей підвищують цей ризик. Для автоматизації на основі hooks віддавайте перевагу сильним сучасним рівням моделей і тримайте політику інструментів суворою (`tools.profile: "messaging"` або суворіше), а також використовуйте sandboxing де це можливо.

### Prompt injection не потребує публічних DM

Навіть якщо **лише ви** можете надсилати повідомлення боту, prompt injection усе одно може статися через
будь-який **недовірений вміст**, який бот читає (результати web search/fetch, сторінки браузера,
листи, документи, вкладення, вставлені журнали/код). Іншими словами: не лише відправник є
поверхнею загрози; **сам вміст** також може містити ворожі інструкції.

Коли інструменти увімкнені, типовий ризик — це витік контексту або ініціювання
викликів інструментів. Зменшуйте радіус ураження так:

- Використовуйте **агента-читача** лише для читання або без інструментів, щоб підсумовувати недовірений вміст,
  а потім передавайте підсумок основному агенту.
- Тримайте `web_search` / `web_fetch` / `browser` вимкненими для агентів з увімкненими інструментами, якщо вони не потрібні.
- Для URL-входів OpenResponses (`input_file` / `input_image`) установлюйте суворі
  `gateway.http.endpoints.responses.files.urlAllowlist` і
  `gateway.http.endpoints.responses.images.urlAllowlist`, а також тримайте `maxUrlParts` низьким.
  Порожні allowlist трактуються як unset; використовуйте `files.allowUrl: false` / `images.allowUrl: false`,
  якщо хочете повністю вимкнути отримання через URL.
- Для файлових входів OpenResponses декодований текст `input_file` усе одно додається як
  **недовірений зовнішній вміст**. Не покладайтеся на те, що текст файла є довіреним лише тому,
  що Gateway декодував його локально. Доданий блок усе одно містить явні
  маркери меж `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` плюс метадані `Source: External`,
  хоча цей шлях і пропускає довший банер `SECURITY NOTICE:`.
- Те саме обгортання на основі маркерів застосовується, коли media-understanding витягує текст
  із вкладених документів перед додаванням цього тексту до медіапідказки.
- Увімкнення sandboxing і суворих allowlist інструментів для будь-якого агента, що працює з недовіреним вхідним вмістом.
- Не зберігайте секрети в prompt; передавайте їх через env/config на хості gateway.

### Self-hosted LLM backends

Backends self-hosted, сумісні з OpenAI, як-от vLLM, SGLang, TGI, LM Studio
або власні стеки токенізаторів Hugging Face, можуть відрізнятися від хостингових провайдерів у тому,
як обробляються спеціальні токени шаблонів чату. Якщо backend токенізує буквальні рядки
на кшталт `<|im_start|>`, `<|start_header_id|>` або `<start_of_turn>` як
структурні токени шаблону чату всередині користувацького вмісту, недовірений текст може намагатися
підробити межі ролей на рівні токенізатора.

OpenClaw видаляє поширені буквальні спеціальні токени сімейств моделей із обгорнутого
зовнішнього вмісту перед передаванням його моделі. Тримайте обгортання
зовнішнього вмісту увімкненим і, за наявності такої можливості, віддавайте перевагу налаштуванням backend, які розділяють або екранують спеціальні
токени у вмісті, наданому користувачем. Хостингові провайдери, як-от OpenAI
і Anthropic, уже застосовують власну санітизацію на стороні запиту.

### Потужність моделі (примітка щодо безпеки)

Стійкість до prompt injection **не** є однаковою в усіх рівнях моделей. Менші/дешевші моделі загалом більш вразливі до неправильного використання інструментів і перехоплення інструкцій, особливо за наявності зловмисних prompt.

<Warning>
Для агентів з увімкненими інструментами або агентів, які читають недовірений вміст, ризик prompt injection зі старішими/меншими моделями часто є надто високим. Не запускайте такі навантаження на слабких рівнях моделей.
</Warning>

Рекомендації:

- **Використовуйте модель останнього покоління найкращого рівня** для будь-якого бота, який може запускати інструменти або працювати з файлами/мережами.
- **Не використовуйте старіші/слабші/менші рівні** для агентів з увімкненими інструментами або недовірених inbox; ризик prompt injection надто високий.
- Якщо вам усе ж доводиться використовувати меншу модель, **зменшуйте радіус ураження** (лише читання для інструментів, сильне sandboxing, мінімальний доступ до файлової системи, суворі allowlist).
- Під час запуску малих моделей **увімкніть sandboxing для всіх сесій** і **вимкніть `web_search`/`web_fetch`/`browser`**, якщо тільки вхідні дані не контролюються дуже суворо.
- Для персональних помічників лише для чату з довіреним вхідним вмістом і без інструментів менші моделі зазвичай підходять.

<a id="reasoning-verbose-output-in-groups"></a>

## Reasoning і докладний вивід у групах

`/reasoning`, `/verbose` і `/trace` можуть розкривати внутрішнє reasoning, вивід
інструментів або діагностику plugin, які
не призначалися для публічного каналу. У групових сценаріях розглядайте їх як **лише для debug**
і тримайте вимкненими, якщо тільки вони вам справді не потрібні.

Рекомендації:

- Тримайте `/reasoning`, `/verbose` і `/trace` вимкненими в публічних кімнатах.
- Якщо ви їх вмикаєте, робіть це лише в довірених DM або суворо контрольованих кімнатах.
- Пам’ятайте: verbose- і trace-вивід можуть містити аргументи інструментів, URL, діагностику plugin і дані, які бачила модель.

## Посилення конфігурації (приклади)

### 0) Дозволи файлів

Тримайте конфігурацію та стан закритими на хості gateway:

- `~/.openclaw/openclaw.json`: `600` (лише читання/запис для користувача)
- `~/.openclaw`: `700` (лише користувач)

`openclaw doctor` може попередити про це й запропонувати посилити ці дозволи.

### 0.4) Мережевий доступ (bind + порт + firewall)

Gateway мультиплексує **WebSocket + HTTP** на одному порту:

- Типово: `18789`
- Config/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Ця HTTP-поверхня містить Control UI і host canvas:

- Control UI (активи SPA) (типовий базовий шлях `/`)
- Host canvas: `/__openclaw__/canvas/` і `/__openclaw__/a2ui/` (довільний HTML/JS; розглядайте як недовірений вміст)

Якщо ви завантажуєте вміст canvas у звичайному браузері, ставтеся до нього як до будь-якої іншої недовіреної вебсторінки:

- Не відкривайте host canvas для недовірених мереж/користувачів.
- Не дозволяйте вмісту canvas спільно використовувати те саме origin, що й привілейовані вебповерхні, якщо ви повністю не розумієте наслідків.

Режим bind визначає, де слухає Gateway:

- `gateway.bind: "loopback"` (типово): можуть підключатися лише локальні клієнти.
- Bind не на loopback (`"lan"`, `"tailnet"`, `"custom"`) розширюють поверхню атаки. Використовуйте їх лише з auth gateway (спільний token/password або правильно налаштований trusted proxy не на loopback) і справжнім firewall.

Практичні правила:

- Віддавайте перевагу Tailscale Serve замість bind на LAN (Serve залишає Gateway на loopback, а Tailscale керує доступом).
- Якщо вам усе ж потрібен bind на LAN, обмежте порт через firewall жорстким allowlist IP-адрес джерел; не робіть широке port-forwarding.
- Ніколи не відкривайте Gateway без auth на `0.0.0.0`.

### 0.4.1) Публікація портів Docker + UFW (`DOCKER-USER`)

Якщо ви запускаєте OpenClaw у Docker на VPS, пам’ятайте, що опубліковані порти container
(`-p HOST:CONTAINER` або Compose `ports:`) маршрутизуються через ланцюжки переспрямування Docker,
а не лише через правила host `INPUT`.

Щоб трафік Docker відповідав політиці вашого firewall, застосовуйте правила в
`DOCKER-USER` (цей ланцюжок обробляється до власних правил allow у Docker).
На багатьох сучасних дистрибутивах `iptables`/`ip6tables` використовують frontend `iptables-nft`
і все одно застосовують ці правила до backend nftables.

Мінімальний приклад allowlist (IPv4):

```bash
# /etc/ufw/after.rules (додайте як окремий розділ *filter)
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j RETURN
-A DOCKER-USER -s 127.0.0.0/8 -j RETURN
-A DOCKER-USER -s 10.0.0.0/8 -j RETURN
-A DOCKER-USER -s 172.16.0.0/12 -j RETURN
-A DOCKER-USER -s 192.168.0.0/16 -j RETURN
-A DOCKER-USER -s 100.64.0.0/10 -j RETURN
-A DOCKER-USER -p tcp --dport 80 -j RETURN
-A DOCKER-USER -p tcp --dport 443 -j RETURN
-A DOCKER-USER -m conntrack --ctstate NEW -j DROP
-A DOCKER-USER -j RETURN
COMMIT
```

Для IPv6 використовуються окремі таблиці. Додайте відповідну політику в `/etc/ufw/after6.rules`, якщо
увімкнено Docker IPv6.

Уникайте жорстко закодованих назв інтерфейсів, як-от `eth0`, у фрагментах документації. Назви інтерфейсів
відрізняються між образами VPS (`ens3`, `enp*` тощо), і невідповідності можуть випадково
призвести до пропуску вашого правила deny.

Швидка перевірка після перезавантаження:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

Очікувані зовнішні порти мають бути лише тими, які ви навмисно відкрили (для більшості
конфігурацій: SSH + порти вашого reverse proxy).

### 0.4.2) Виявлення mDNS/Bonjour (розкриття інформації)

Gateway транслює свою присутність через mDNS (`_openclaw-gw._tcp` на порту 5353) для локального виявлення пристроїв. У повному режимі це містить TXT-записи, які можуть розкривати робочі деталі:

- `cliPath`: повний шлях у файловій системі до бінарного файла CLI (розкриває ім’я користувача та місце встановлення)
- `sshPort`: повідомляє про доступність SSH на хості
- `displayName`, `lanHost`: інформація про ім’я хоста

**Міркування щодо операційної безпеки:** трансляція деталей інфраструктури полегшує розвідку для будь-кого в локальній мережі. Навіть «нешкідлива» інформація, як-от шляхи файлової системи й доступність SSH, допомагає зловмисникам скласти карту вашого середовища.

**Рекомендації:**

1. **Мінімальний режим** (типовий, рекомендований для відкритих gateway): не включає чутливі поля в трансляції mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

2. **Повністю вимкніть**, якщо вам не потрібне локальне виявлення пристроїв:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

3. **Повний режим** (явне ввімкнення): включає `cliPath` + `sshPort` у TXT-записи:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

4. **Змінна середовища** (альтернатива): установіть `OPENCLAW_DISABLE_BONJOUR=1`, щоб вимкнути mDNS без змін конфігурації.

У мінімальному режимі Gateway усе ще транслює достатньо для виявлення пристроїв (`role`, `gatewayPort`, `transport`), але не включає `cliPath` і `sshPort`. Apps, яким потрібна інформація про шлях CLI, можуть отримати її через автентифіковане підключення WebSocket.

### 0.5) Захистіть WebSocket Gateway (локальна auth)

Auth Gateway **типово є обов’язковою**. Якщо не налаштовано
жодного дійсного шляху auth gateway, Gateway відмовляє у WebSocket-з’єднаннях (fail‑closed).

Онбординг типово генерує token (навіть для loopback), тож
локальні клієнти повинні проходити автентифікацію.

Установіть token, щоб **усі** WS-клієнти повинні були проходити автентифікацію:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

Doctor може згенерувати його для вас: `openclaw doctor --generate-gateway-token`.

Примітка: `gateway.remote.token` / `.password` — це джерела облікових даних клієнта. Вони
самі по собі **не** захищають локальний доступ WS.
Локальні шляхи виклику можуть використовувати `gateway.remote.*` як fallback лише коли `gateway.auth.*`
не встановлено.
Якщо `gateway.auth.token` / `gateway.auth.password` явно налаштовано через
SecretRef і не вдалося визначити значення, визначення завершується fail closed (без маскувального fallback на remote).
Необов’язково: фіксуйте віддалений TLS через `gateway.remote.tlsFingerprint` під час використання `wss://`.
Нешифрований `ws://` типово дозволений лише для loopback. Для довірених шляхів у приватній мережі
встановіть `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у процесі клієнта як аварійний варіант.

Локальне pairing пристроїв:

- Pairing пристрою схвалюється автоматично для прямих локальних підключень через loopback, щоб
  клієнти на тому самому хості працювали без зайвих кроків.
- OpenClaw також має вузький шлях самопідключення backend/container-local для
  довірених потоків допоміжних засобів зі спільним секретом.
- Підключення через tailnet і LAN, зокрема bind через tailnet на тому самому хості, розглядаються як
  віддалені для pairing і все одно потребують схвалення.

Режими auth:

- `gateway.auth.mode: "token"`: спільний bearer token (рекомендовано для більшості конфігурацій).
- `gateway.auth.mode: "password"`: auth через пароль (краще задавати через env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: довіра до reverse proxy з підтримкою ідентичності для автентифікації користувачів і передавання ідентичності через заголовки (див. [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)).

Контрольний список ротації (token/password):

1. Згенеруйте/установіть новий секрет (`gateway.auth.token` або `OPENCLAW_GATEWAY_PASSWORD`).
2. Перезапустіть Gateway (або перезапустіть macOS app, якщо він контролює Gateway).
3. Оновіть усі віддалені клієнти (`gateway.remote.token` / `.password` на машинах, які викликають Gateway).
4. Перевірте, що зі старими обліковими даними більше неможливо підключитися.

### 0.6) Заголовки ідентичності Tailscale Serve

Коли `gateway.auth.allowTailscale` має значення `true` (типово для Serve), OpenClaw
приймає заголовки ідентичності Tailscale Serve (`tailscale-user-login`) для автентифікації Control
UI/WebSocket. OpenClaw перевіряє ідентичність, визначаючи
адресу `x-forwarded-for` через локальний демон Tailscale (`tailscale whois`) і звіряючи її із заголовком. Це спрацьовує лише для запитів, які потрапляють на loopback
і містять `x-forwarded-for`, `x-forwarded-proto` і `x-forwarded-host`, як
додає Tailscale.
Для цього асинхронного шляху перевірки ідентичності невдалі спроби для однакової пари `{scope, ip}`
серіалізуються до того, як limiter зафіксує невдачу. Тому одночасні невдалі повторні спроби
від одного клієнта Serve можуть одразу заблокувати другу спробу,
замість того щоб пройти через гонку як дві звичайні невідповідності.
Кінцеві точки HTTP API (наприклад, `/v1/*`, `/tools/invoke` і `/api/channels/*`)
**не** використовують auth через заголовки ідентичності Tailscale. Вони й далі дотримуються
налаштованого для gateway режиму HTTP auth.

Важлива примітка про межі:

- Bearer auth HTTP Gateway фактично надає повний доступ operator або нічого.
- Ставтеся до облікових даних, які можуть викликати `/v1/chat/completions`, `/v1/responses` або `/api/channels/*`, як до секретів operator з повним доступом для цього gateway.
- На HTTP-поверхні, сумісній з OpenAI, bearer auth зі спільним секретом відновлює повні типові області operator (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) і семантику власника для ходів агента; вужчі значення `x-openclaw-scopes` не зменшують цей шлях зі спільним секретом.
- Семантика областей на рівні окремого запиту в HTTP застосовується лише тоді, коли запит надходить із режиму з ідентичністю, як-от auth через trusted proxy або `gateway.auth.mode="none"` на приватному ingress.
- У цих режимах з ідентичністю пропуск `x-openclaw-scopes` призводить до повернення до звичайного типового набору областей operator; надсилайте цей заголовок явно, коли потрібен вужчий набір областей.
- `/tools/invoke` дотримується того самого правила спільного секрету: bearer auth через token/password там теж вважається повним доступом operator, тоді як режими з ідентичністю й далі поважають оголошені області.
- Не діліться цими обліковими даними з недовіреними викликачами; віддавайте перевагу окремим gateway для кожної межі довіри.

**Припущення довіри:** auth Serve без token припускає, що хост gateway є довіреним.
Не розглядайте це як захист від ворожих процесів на тому самому хості. Якщо на хості gateway
може виконуватися недовірений локальний код, вимкніть `gateway.auth.allowTailscale`
і вимагайте явну auth зі спільним секретом через `gateway.auth.mode: "token"` або
`"password"`.

**Правило безпеки:** не пересилайте ці заголовки через власний reverse proxy. Якщо
ви завершуєте TLS або використовуєте proxy перед gateway, вимкніть
`gateway.auth.allowTailscale` і використовуйте auth зі спільним секретом (`gateway.auth.mode:
"token"` або `"password"`) або [Trusted Proxy Auth](/uk/gateway/trusted-proxy-auth)
натомість.

Довірені proxy:

- Якщо ви завершуєте TLS перед Gateway, установіть `gateway.trustedProxies` на IP-адреси вашого proxy.
- OpenClaw довірятиме `x-forwarded-for` (або `x-real-ip`) від цих IP-адрес для визначення IP клієнта під час перевірок локального pairing і HTTP auth/локальних перевірок.
- Переконайтеся, що ваш proxy **перезаписує** `x-forwarded-for` і блокує прямий доступ до порту Gateway.

Див. [Tailscale](/uk/gateway/tailscale) і [Огляд web](/web).

### 0.6.1) Керування браузером через host node (рекомендовано)

Якщо ваш Gateway є віддаленим, але браузер працює на іншій машині, запустіть **host node**
на машині з браузером і дозвольте Gateway проксувати дії браузера (див. [Browser tool](/uk/tools/browser)).
Розглядайте pairing node як адміністративний доступ.

Рекомендований шаблон:

- Тримайте Gateway і host node в одному tailnet (Tailscale).
- Виконуйте pairing node свідомо; вимикайте проксі-маршрутизацію браузера, якщо вона вам не потрібна.

Уникайте:

- Відкриття портів relay/control для LAN або публічного інтернету.
- Tailscale Funnel для кінцевих точок керування браузером (публічний доступ).

### 0.7) Секрети на диску (чутливі дані)

Вважайте, що все в `~/.openclaw/` (або `$OPENCLAW_STATE_DIR/`) може містити секрети або приватні дані:

- `openclaw.json`: config може містити токени (gateway, віддалений gateway), налаштування провайдерів і allowlist.
- `credentials/**`: облікові дані каналів (наприклад, облікові дані WhatsApp), pairing allowlist, імпорт застарілого OAuth.
- `agents/<agentId>/agent/auth-profiles.json`: API-ключі, профілі токенів, OAuth-токени й необов’язкові `keyRef`/`tokenRef`.
- `secrets.json` (необов’язково): payload секретів у файлі, який використовують провайдери SecretRef типу `file` (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: застарілий файл сумісності. Статичні записи `api_key` очищуються під час виявлення.
- `agents/<agentId>/sessions/**`: транскрипти сесій (`*.jsonl`) + метадані маршрутизації (`sessions.json`), які можуть містити приватні повідомлення та вивід інструментів.
- пакети вбудованих plugins: установлені plugins (разом із їхніми `node_modules/`).
- `sandboxes/**`: робочі простори sandbox інструментів; у них можуть накопичуватися копії файлів, які ви читаєте/записуєте в sandbox.

Поради щодо посилення:

- Тримайте дозволи суворими (`700` для каталогів, `600` для файлів).
- Використовуйте повнодискове шифрування на хості gateway.
- Якщо хост спільний, віддавайте перевагу окремому обліковому запису користувача ОС для Gateway.

### 0.8) Файли `.env` у workspace

OpenClaw завантажує локальні для workspace файли `.env` для агентів та інструментів, але ніколи не дозволяє цим файлам непомітно перевизначати засоби керування runtime gateway.

- Будь-який ключ, що починається з `OPENCLAW_*`, блокується в недовірених файлах `.env` workspace.
- Блокування працює за принципом fail-closed: нова змінна керування runtime, додана в майбутньому релізі, не може бути успадкована з `.env`, доданого в репозиторій або наданого зловмисником; ключ ігнорується, а gateway зберігає власне значення.
- Довірені змінні середовища процесу/ОС (власна shell gateway, launchd/systemd unit, app bundle) усе ще застосовуються — це обмеження стосується лише завантаження файлів `.env`.

Чому: файли `.env` у workspace часто лежать поруч із кодом агента, випадково потрапляють у коміти або записуються інструментами. Блокування всього префікса `OPENCLAW_*` означає, що додавання нового прапора `OPENCLAW_*` пізніше ніколи не призведе до регресії в тихе успадкування зі стану workspace.

### 0.9) Журнали + транскрипти (редагування + зберігання)

Журнали й транскрипти можуть розкривати чутливу інформацію, навіть якщо контроль доступу налаштовано правильно:

- Журнали Gateway можуть містити зведення інструментів, помилки та URL.
- Транскрипти сесій можуть містити вставлені секрети, вміст файлів, вивід команд і посилання.

Рекомендації:

- Залишайте увімкненим редагування зведень інструментів (`logging.redactSensitive: "tools"`; типово).
- Додавайте власні шаблони для свого середовища через `logging.redactPatterns` (токени, імена хостів, внутрішні URL).
- Якщо ділитеся діагностикою, віддавайте перевагу `openclaw status --all` (можна вставляти, секрети відредаговано), а не сирим журналам.
- Видаляйте старі транскрипти сесій і файли журналів, якщо вам не потрібне тривале зберігання.

Докладніше: [Logging](/uk/gateway/logging)

### 1) DM: pairing за замовчуванням

```json5
{
  channels: { whatsapp: { dmPolicy: "pairing" } },
}
```

### 2) Групи: вимагати згадку всюди

```json
{
  "channels": {
    "whatsapp": {
      "groups": {
        "*": { "requireMention": true }
      }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "groupChat": { "mentionPatterns": ["@openclaw", "@mybot"] }
      }
    ]
  }
}
```

У групових чатах відповідайте лише на явну згадку.

### 3) Окремі номери (WhatsApp, Signal, Telegram)

Для каналів на основі номерів телефону розгляньте запуск вашого AI на окремому номері телефону, відмінному від особистого:

- Особистий номер: ваші розмови залишаються приватними
- Номер бота: AI обробляє їх із належними межами

### 4) Режим лише для читання (через sandbox + tools)

Ви можете побудувати профіль лише для читання, поєднавши:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (або `"none"` без доступу до workspace)
- списки allow/deny для інструментів, які блокують `write`, `edit`, `apply_patch`, `exec`, `process` тощо.

Додаткові варіанти посилення:

- `tools.exec.applyPatch.workspaceOnly: true` (типово): гарантує, що `apply_patch` не може записувати/видаляти файли поза каталогом workspace, навіть коли sandboxing вимкнено. Установлюйте `false` лише якщо ви свідомо хочете, щоб `apply_patch` працював із файлами поза workspace.
- `tools.fs.workspaceOnly: true` (необов’язково): обмежує шляхи `read`/`write`/`edit`/`apply_patch` і шляхи автозавантаження зображень для native prompt каталогом workspace (корисно, якщо сьогодні ви дозволяєте абсолютні шляхи й хочете єдиний запобіжник).
- Звужуйте корені файлової системи: уникайте широких коренів, як-от ваш домашній каталог, для workspace агентів/workspace sandbox. Широкі корені можуть відкривати доступ інструментам файлової системи до чутливих локальних файлів (наприклад, state/config у `~/.openclaw`).

### 5) Безпечна базова конфігурація (копіювати/вставити)

Одна «безпечна типова» конфігурація, яка зберігає Gateway приватним, вимагає pairing для DM і уникає ботів у групах, які слухають завжди:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    port: 18789,
    auth: { mode: "token", token: "your-long-random-token" },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

Якщо ви також хочете «безпечніше за замовчуванням» для виконання інструментів, додайте sandbox + deny небезпечних інструментів для будь-якого агента, який не є owner (приклад нижче в розділі «Профілі доступу для окремих агентів»).

Вбудована базова конфігурація для ходів агента, керованих чатом: відправники, які не є owner, не можуть використовувати інструменти `cron` або `gateway`.

## Sandboxing (рекомендовано)

Окремий документ: [Sandboxing](/uk/gateway/sandboxing)

Два взаємодоповнювальні підходи:

- **Запускати весь Gateway у Docker** (межа container): [Docker](/uk/install/docker)
- **Sandbox інструментів** (`agents.defaults.sandbox`, gateway на хості + інструменти, ізольовані в sandbox; Docker — типовий backend): [Sandboxing](/uk/gateway/sandboxing)

Примітка: щоб запобігти доступу між агентами, залишайте `agents.defaults.sandbox.scope` зі значенням `"agent"` (типово)
або `"session"` для суворішої ізоляції на рівні сесії. `scope: "shared"` використовує
один container/workspace.

Також розгляньте доступ агента до workspace всередині sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (типово) забороняє доступ до workspace агента; інструменти працюють із workspace sandbox у `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` монтує workspace агента лише для читання в `/agent` (вимикає `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` монтує workspace агента для читання/запису в `/workspace`
- Додаткові `sandbox.docker.binds` перевіряються щодо нормалізованих і канонічних шляхів джерела. Трюки з symlink у батьківських каталогах і канонічні псевдоніми домашнього каталогу все одно завершуються fail closed, якщо вони вказують на заблоковані корені, як-от `/etc`, `/var/run` або каталоги облікових даних у домашньому каталозі ОС.

Важливо: `tools.elevated` — це глобальний аварійний вихід із базового режиму, який запускає exec поза sandbox. Ефективний host типово дорівнює `gateway`, або `node`, коли ціль exec налаштована як `node`. Тримайте `tools.elevated.allowFrom` суворо обмеженим і не вмикайте його для сторонніх людей. Додатково ви можете обмежити elevated для окремого агента через `agents.list[].tools.elevated`. Див. [Elevated Mode](/uk/tools/elevated).

### Запобіжник делегування підагентів

Якщо ви дозволяєте інструменти сесій, розглядайте делеговані запуски підагентів як ще одне рішення щодо межі:

- Забороняйте `sessions_spawn`, якщо агенту справді не потрібне делегування.
- Тримайте `agents.defaults.subagents.allowAgents` і всі перевизначення `agents.list[].subagents.allowAgents` для окремих агентів обмеженими відомими безпечними цільовими агентами.
- Для будь-якого workflow, який має залишатися в sandbox, викликайте `sessions_spawn` із `sandbox: "require"` (типове значення — `inherit`).
- `sandbox: "require"` швидко завершується помилкою, якщо цільове дочірнє runtime не працює в sandbox.

## Ризики керування браузером

Увімкнення керування браузером дає моделі можливість керувати реальним браузером.
Якщо цей профіль браузера вже містить активні сесії входу, модель може
отримати доступ до цих акаунтів і даних. Розглядайте профілі браузера як **чутливий стан**:

- Віддавайте перевагу окремому профілю для агента (типовий профіль `openclaw`).
- Не спрямовуйте агента на ваш особистий щоденний профіль браузера.
- Тримайте керування браузером на хості вимкненим для агентів у sandbox, якщо ви їм не довіряєте.
- Автономний loopback API керування браузером приймає лише auth зі спільним секретом
  (bearer auth через token gateway або пароль gateway). Він не використовує
  заголовки ідентичності trusted-proxy або Tailscale Serve.
- Розглядайте завантаження браузера як недовірений вхідний вміст; віддавайте перевагу ізольованому каталогу завантажень.
- Якщо можливо, вимикайте синхронізацію браузера/менеджери паролів у профілі агента (це зменшує радіус ураження).
- Для віддалених gateway припускайте, що «керування браузером» еквівалентне «доступу operator» до всього, чого може досягти цей профіль.
- Тримайте Gateway і host node лише в межах tailnet; не відкривайте порти керування браузером для LAN або публічного інтернету.
- Вимикайте проксі-маршрутизацію браузера, коли вона не потрібна (`gateway.nodes.browser.mode="off"`).
- Режим Chrome MCP з наявною сесією **не** є «безпечнішим»; він може діяти від вашого імені всюди, куди має доступ цей профіль Chrome на хості.

### Політика SSRF браузера (сувора за замовчуванням)

Політика навігації браузера в OpenClaw типово сувора: приватні/внутрішні цілі залишаються заблокованими, якщо ви явно не дозволите їх.

- Типово: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` не встановлено, тому навігація браузера залишає приватні/внутрішні/special-use цілі заблокованими.
- Застарілий псевдонім: `browser.ssrfPolicy.allowPrivateNetwork` усе ще приймається для сумісності.
- Режим з явним дозволом: установіть `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`, щоб дозволити приватні/внутрішні/special-use цілі.
- У суворому режимі використовуйте `hostnameAllowlist` (шаблони на кшталт `*.example.com`) і `allowedHostnames` (точні винятки для хостів, зокрема заблоковані імена, як-от `localhost`) для явних винятків.
- Навігація перевіряється перед запитом і best-effort повторно перевіряється на фінальному URL `http(s)` після навігації, щоб зменшити переходи через редиректи.

Приклад суворої політики:

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"],
    },
  },
}
```

## Профілі доступу для окремих агентів (multi-agent)

За маршрутизації multi-agent кожен агент може мати власні sandbox і політику інструментів:
використовуйте це, щоб надавати **повний доступ**, **лише читання** або **без доступу** для кожного агента.
Повні подробиці та правила пріоритетів див. у [Multi-Agent Sandbox & Tools](/uk/tools/multi-agent-sandbox-tools).

Поширені сценарії використання:

- Особистий агент: повний доступ, без sandbox
- Сімейний/робочий агент: sandbox + інструменти лише для читання
- Публічний агент: sandbox + без інструментів файлової системи/shell

### Приклад: повний доступ (без sandbox)

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

### Приклад: інструменти лише для читання + workspace лише для читання

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "ro",
        },
        tools: {
          allow: ["read"],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

### Приклад: без доступу до файлової системи/shell (дозволено messaging провайдера)

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: {
          mode: "all",
          scope: "agent",
          workspaceAccess: "none",
        },
        // Інструменти сесій можуть розкривати чутливі дані з транскриптів. Типово OpenClaw обмежує ці інструменти
        // поточною сесією + породженими сесіями підагентів, але за потреби ви можете обмежити ще сильніше.
        // Див. `tools.sessions.visibility` у довіднику конфігурації.
        tools: {
          sessions: { visibility: "tree" }, // self | tree | agent | all
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

## Що сказати вашому AI

Додайте рекомендації з безпеки до system prompt вашого агента:

```
## Правила безпеки
- Ніколи не показуй незнайомцям списки каталогів або шляхи до файлів
- Ніколи не розкривай API-ключі, облікові дані або деталі інфраструктури
- Підтверджуй із власником запити, що змінюють системну конфігурацію
- Якщо є сумніви, запитай перед виконанням дії
- Зберігай приватні дані приватними, якщо немає явної авторизації
```

## Реагування на інциденти

Якщо ваш AI зробив щось погане:

### Локалізуйте

1. **Зупиніть його:** зупиніть macOS app (якщо він контролює Gateway) або завершіть процес `openclaw gateway`.
2. **Закрийте доступ:** установіть `gateway.bind: "loopback"` (або вимкніть Tailscale Funnel/Serve), доки не зрозумієте, що сталося.
3. **Заморозьте доступ:** переведіть ризиковані DM/групи в `dmPolicy: "disabled"` / вимагайте згадки й приберіть записи `"*"`, що дозволяють усіх, якщо вони були.

### Ротуйте (припускайте компрометацію, якщо секрети витекли)

1. Ротуйте auth Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) і перезапустіть.
2. Ротуйте секрети віддалених клієнтів (`gateway.remote.token` / `.password`) на кожній машині, яка може викликати Gateway.
3. Ротуйте облікові дані провайдерів/API (облікові дані WhatsApp, токени Slack/Discord, ключі моделей/API у `auth-profiles.json` і значення зашифрованого payload секретів, якщо вони використовуються).

### Аудит

1. Перевірте журнали Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (або `logging.file`).
2. Перегляньте відповідні транскрипти: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Перегляньте нещодавні зміни конфігурації (усе, що могло розширити доступ: `gateway.bind`, `gateway.auth`, політики dm/group, `tools.elevated`, зміни plugin).
4. Повторно запустіть `openclaw security audit --deep` і переконайтеся, що критичні знахідки усунено.

### Зберіть дані для звіту

- Часову мітку, ОС хоста gateway + версію OpenClaw
- Транскрипти сесій + короткий tail журналу (після редагування)
- Що саме надіслав зловмисник + що зробив агент
- Чи був Gateway доступний не лише через loopback (LAN/Tailscale Funnel/Serve)

## Сканування секретів (detect-secrets)

CI запускає pre-commit hook `detect-secrets` у job `secrets`.
Push у `main` завжди запускають сканування всіх файлів. Pull request використовують
швидкий шлях для змінених файлів, коли доступний базовий коміт, і в іншому разі повертаються до сканування всіх файлів. Якщо перевірка не проходить, це означає, що є нові кандидати, яких ще немає в baseline.

### Якщо CI не проходить

1. Відтворіть локально:

   ```bash
   pre-commit run --all-files detect-secrets
   ```

2. Зрозумійте інструменти:
   - `detect-secrets` у pre-commit запускає `detect-secrets-hook` з
     baseline і excludes цього репозиторію.
   - `detect-secrets audit` відкриває інтерактивний перегляд, щоб позначити кожен елемент baseline
     як реальний або як хибнопозитивний.
3. Для реальних секретів: ротуйте/видаліть їх, а потім повторно запустіть сканування, щоб оновити baseline.
4. Для хибнопозитивних результатів: запустіть інтерактивний аудит і позначте їх як хибні:

   ```bash
   detect-secrets audit .secrets.baseline
   ```

5. Якщо вам потрібні нові excludes, додайте їх до `.detect-secrets.cfg` і повторно згенеруйте
   baseline з відповідними прапорами `--exclude-files` / `--exclude-lines` (файл
   config є лише довідковим; detect-secrets не читає його автоматично).

Закомітьте оновлений `.secrets.baseline`, щойно він відображатиме задуманий стан.

## Повідомлення про проблеми безпеки

Знайшли вразливість в OpenClaw? Будь ласка, повідомляйте відповідально:

1. Email: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Не публікуйте публічно, доки проблему не буде виправлено
3. Ми вкажемо вас у подяках (якщо ви не віддаєте перевагу анонімності)
