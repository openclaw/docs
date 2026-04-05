---
read_when:
    - Налаштування Matrix в OpenClaw
    - Налаштування Matrix E2EE і верифікації
summary: Стан підтримки Matrix, приклади налаштування та конфігурації
title: Matrix
x-i18n:
    generated_at: "2026-04-05T22:39:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddd4f14094388b1a4cd542a5956fcf47f7d6734b7a11fde1d6125b3f0d7202c9
    source_path: channels/matrix.md
    workflow: 15
---

# Matrix

Matrix — це вбудований плагін каналу Matrix для OpenClaw.
Він використовує офіційний `matrix-js-sdk` і підтримує особисті повідомлення, кімнати, треди, медіа, реакції, опитування, геолокацію та E2EE.

## Вбудований плагін

Matrix постачається як вбудований плагін у поточних релізах OpenClaw, тож звичайним
зібраним версіям не потрібне окреме встановлення.

Якщо ви використовуєте старішу збірку або кастомне встановлення без Matrix, встановіть
його вручну:

Встановлення з npm:

```bash
openclaw plugins install @openclaw/matrix
```

Встановлення з локального checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Див. [Plugins](/uk/tools/plugin) щодо поведінки плагінів і правил встановлення.

## Налаштування

1. Переконайтеся, що плагін Matrix доступний.
   - Поточні зібрані релізи OpenClaw уже містять його.
   - У старіших/кастомних встановленнях його можна додати вручну командами вище.
2. Створіть обліковий запис Matrix на своєму homeserver.
3. Налаштуйте `channels.matrix` одним із варіантів:
   - `homeserver` + `accessToken`, або
   - `homeserver` + `userId` + `password`.
4. Перезапустіть gateway.
5. Почніть DM з ботом або запросіть його до кімнати.

Інтерактивні шляхи налаштування:

```bash
openclaw channels add
openclaw configure --section channels
```

Що саме запитує майстер Matrix:

- URL homeserver
- метод автентифікації: токен доступу або пароль
- ID користувача лише якщо ви обираєте автентифікацію паролем
- необов’язкова назва пристрою
- чи вмикати E2EE
- чи налаштувати доступ до кімнат Matrix зараз

Важлива поведінка майстра:

- Якщо для вибраного облікового запису вже існують змінні середовища автентифікації Matrix, і для цього облікового запису ще не збережено автентифікацію в конфігурації, майстер пропонує скористатися env і записує для цього облікового запису лише `enabled: true`.
- Коли ви інтерактивно додаєте ще один обліковий запис Matrix, введена назва облікового запису нормалізується до ID облікового запису, який використовується в конфігурації та змінних середовища. Наприклад, `Ops Bot` стає `ops-bot`.
- Підказки allowlist для DM одразу приймають повні значення `@user:server`. Відображувані імена працюють лише тоді, коли живий пошук у каталозі знаходить один точний збіг; інакше майстер просить повторити спробу з повним Matrix ID.
- Підказки allowlist для кімнат безпосередньо приймають ID кімнат і псевдоніми. Вони також можуть у реальному часі визначати назви приєднаних кімнат, але нерозпізнані назви під час налаштування зберігаються лише як введені й надалі ігноруються під час runtime-розв’язання allowlist. Надавайте перевагу `!room:server` або `#alias:server`.
- Ідентичність кімнати/сесії під час runtime використовує стабільний Matrix room ID. Псевдоніми, оголошені кімнатою, використовуються лише як вхідні дані для пошуку, а не як довгостроковий ключ сесії чи стабільна ідентичність групи.
- Щоб визначити назви кімнат перед збереженням, використовуйте `openclaw channels resolve --channel matrix "Project Room"`.

Мінімальне налаштування на основі токена:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      dm: { policy: "pairing" },
    },
  },
}
```

Налаштування на основі пароля (після входу токен кешується):

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      userId: "@bot:example.org",
      password: "replace-me", // pragma: allowlist secret
      deviceName: "OpenClaw Gateway",
    },
  },
}
```

Matrix зберігає кешовані облікові дані в `~/.openclaw/credentials/matrix/`.
Обліковий запис за замовчуванням використовує `credentials.json`; іменовані облікові записи використовують `credentials-<account>.json`.

Еквіваленти змінних середовища (використовуються, коли ключ конфігурації не задано):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Для облікових записів не за замовчуванням використовуйте змінні середовища з областю облікового запису:

- `MATRIX_<ACCOUNT_ID>_HOMESERVER`
- `MATRIX_<ACCOUNT_ID>_ACCESS_TOKEN`
- `MATRIX_<ACCOUNT_ID>_USER_ID`
- `MATRIX_<ACCOUNT_ID>_PASSWORD`
- `MATRIX_<ACCOUNT_ID>_DEVICE_ID`
- `MATRIX_<ACCOUNT_ID>_DEVICE_NAME`

Приклад для облікового запису `ops`:

- `MATRIX_OPS_HOMESERVER`
- `MATRIX_OPS_ACCESS_TOKEN`

Для нормалізованого ID облікового запису `ops-bot` використовуйте:

- `MATRIX_OPS_X2D_BOT_HOMESERVER`
- `MATRIX_OPS_X2D_BOT_ACCESS_TOKEN`

Matrix екранує розділові знаки в ID облікових записів, щоб уникнути колізій у змінних середовища з областю дії.
Наприклад, `-` перетворюється на `_X2D_`, тому `ops-prod` відповідає `MATRIX_OPS_X2D_PROD_*`.

Інтерактивний майстер пропонує скористатися змінними середовища лише тоді, коли ці env-змінні автентифікації вже присутні, а для вибраного облікового запису ще не збережено автентифікацію Matrix у конфігурації.

## Приклад конфігурації

Це практична базова конфігурація з pairing для DM, allowlist кімнат і ввімкненим E2EE:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,

      dm: {
        policy: "pairing",
        sessionScope: "per-room",
        threadReplies: "off",
      },

      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },

      autoJoin: "allowlist",
      autoJoinAllowlist: ["!roomid:example.org"],
      threadReplies: "inbound",
      replyToMode: "off",
      streaming: "partial",
    },
  },
}
```

## Попередній перегляд під час streaming

Streaming відповідей у Matrix є опціональним.

Установіть `channels.matrix.streaming` у `"partial"`, якщо хочете, щоб OpenClaw надсилав один живий попередній
варіант відповіді, редагував його на місці під час генерації тексту моделлю, а потім завершував, коли
відповідь буде готова:

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

- `streaming: "off"` — значення за замовчуванням. OpenClaw чекає фінальну відповідь і надсилає її один раз.
- `streaming: "partial"` створює одне редаговане повідомлення-попередній перегляд для поточного блоку асистента, використовуючи звичайні текстові повідомлення Matrix. Це зберігає стару поведінку Matrix із попереднім сповіщенням за першим preview, тому стандартні клієнти можуть надсилати сповіщення за першим текстом попереднього перегляду, а не за завершеним блоком.
- `streaming: "quiet"` створює одне редаговане тихе повідомлення-попередній перегляд для поточного блоку асистента. Використовуйте це лише тоді, коли ви також налаштували push rules отримувача для фіналізованих редагувань preview.
- `blockStreaming: true` вмикає окремі повідомлення про прогрес Matrix. Якщо preview streaming увімкнено, Matrix зберігає живу чернетку для поточного блоку та залишає завершені блоки як окремі повідомлення.
- Коли preview streaming увімкнено, а `blockStreaming` вимкнено, Matrix редагує живу чернетку на місці та фіналізує ту саму подію, коли блок або хід завершується.
- Якщо preview більше не вміщується в одну подію Matrix, OpenClaw зупиняє preview streaming і повертається до звичайної фінальної доставки.
- Відповіді з медіа, як і раніше, надсилають вкладення звичайним способом. Якщо застарілий preview більше не можна безпечно перевикористати, OpenClaw редагує його перед надсиланням фінальної медіавідповіді.
- Редагування preview потребують додаткових викликів Matrix API. Залишайте streaming вимкненим, якщо вам потрібна максимально консервативна поведінка щодо rate limit.

`blockStreaming` сам по собі не вмикає preview чернеток.
Використовуйте `streaming: "partial"` або `streaming: "quiet"` для редагувань preview; потім додавайте `blockStreaming: true`, лише якщо також хочете, щоб завершені блоки асистента залишалися видимими як окремі повідомлення про прогрес.

Якщо вам потрібні стандартні сповіщення Matrix без кастомних push rules, використовуйте `streaming: "partial"` для поведінки з попереднім preview або залиште `streaming` вимкненим для доставки лише фінальної відповіді. Для `streaming: "off"`:

- `blockStreaming: true` надсилає кожен завершений блок як звичайне повідомлення Matrix зі сповіщенням.
- `blockStreaming: false` надсилає лише фінальну завершену відповідь як звичайне повідомлення Matrix зі сповіщенням.

### Self-hosted push rules для тихих фіналізованих preview

Якщо ви запускаєте власну інфраструктуру Matrix і хочете, щоб тихі preview надсилали сповіщення лише тоді, коли блок або
фінальна відповідь завершені, установіть `streaming: "quiet"` і додайте push rule для кожного користувача для фіналізованих редагувань preview.

Зазвичай це налаштування на рівні користувача-отримувача, а не глобальна зміна конфігурації homeserver:

Швидка схема перед початком:

- recipient user = людина, яка має отримати сповіщення
- bot user = обліковий запис OpenClaw Matrix, що надсилає відповідь
- для наведених нижче викликів API використовуйте токен доступу користувача-отримувача
- у push rule звіряйте `sender` з повним MXID користувача-бота

1. Налаштуйте OpenClaw на використання тихих preview:

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

2. Переконайтеся, що обліковий запис отримувача вже отримує звичайні push-сповіщення Matrix. Правила тихих preview
   працюють лише тоді, коли в цього користувача вже є робочі pusher-и/пристрої.

3. Отримайте токен доступу користувача-отримувача.
   - Використовуйте токен користувача, який отримує повідомлення, а не токен бота.
   - Зазвичай найпростіше повторно використати токен існуючої сесії клієнта.
   - Якщо потрібно випустити новий токен, можна увійти через стандартний Matrix Client-Server API:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "@alice:example.org"
    },
    "password": "REDACTED"
  }'
```

4. Перевірте, що обліковий запис отримувача вже має pusher-и:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Якщо це не повертає активних pusher-ів/пристроїв, спочатку виправте звичайні сповіщення Matrix, а вже потім додавайте
наведене нижче правило OpenClaw.

OpenClaw позначає фіналізовані редагування preview лише з текстом так:

```json
{
  "com.openclaw.finalized_preview": true
}
```

5. Створіть override push rule для кожного облікового запису отримувача, який має отримувати ці сповіщення:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

Замініть ці значення перед запуском команди:

- `https://matrix.example.org`: базовий URL вашого homeserver
- `$USER_ACCESS_TOKEN`: токен доступу користувача-отримувача
- `@bot:example.org`: MXID вашого бота OpenClaw Matrix, а не MXID користувача-отримувача

Правило оцінюється відносно відправника події:

- автентифікуйтеся токеном користувача-отримувача
- звіряйте `sender` з MXID бота OpenClaw

6. Перевірте, що правило існує:

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview"
```

7. Перевірте відповідь зі streaming. У тихому режимі кімната має показувати тихий preview чернетки, а фінальне
   редагування на місці має надіслати одне сповіщення, коли блок або хід завершиться.

Примітки:

- Створюйте правило з токеном доступу користувача-отримувача, а не бота.
- Нові визначені користувачем правила `override` вставляються перед правилами придушення за замовчуванням, тож додатковий параметр порядку не потрібен.
- Це впливає лише на редагування preview лише з текстом, які OpenClaw може безпечно фіналізувати на місці. Fallback-и для медіа та fallback-и для застарілих preview, як і раніше, використовують звичайну доставку Matrix.
- Якщо `GET /_matrix/client/v3/pushers` не показує жодного pusher, значить для цього облікового запису/пристрою в користувача ще не працює доставка push-сповіщень Matrix.

#### Synapse

Для Synapse описаного вище налаштування зазвичай достатньо саме по собі:

- Для фіналізованих сповіщень preview OpenClaw не потрібні спеціальні зміни `homeserver.yaml`.
- Якщо ваше розгортання Synapse уже надсилає звичайні push-сповіщення Matrix, головний крок налаштування — токен користувача + виклик `pushrules` вище.
- Якщо ви запускаєте Synapse за reverse proxy або workers, переконайтеся, що `/_matrix/client/.../pushrules/` коректно доходить до Synapse.
- Якщо ви використовуєте workers Synapse, переконайтеся, що pusher-и справні. Доставка push-сповіщень обробляється головним процесом або `synapse.app.pusher` / налаштованими pusher worker-ами.

#### Tuwunel

Для Tuwunel використовуйте той самий сценарій налаштування й виклик API `pushrules`, показаний вище:

- Специфічна конфігурація Tuwunel для самого маркера фіналізованого preview не потрібна.
- Якщо звичайні сповіщення Matrix уже працюють для цього користувача, головний крок налаштування — токен користувача + виклик `pushrules` вище.
- Якщо сповіщення, схоже, зникають, коли користувач активний на іншому пристрої, перевірте, чи ввімкнено `suppress_push_when_active`. Tuwunel додав цю опцію у Tuwunel 1.4.2 12 вересня 2025 року, і вона може навмисно приглушувати push-сповіщення на інших пристроях, поки один пристрій активний.

## Шифрування та верифікація

В зашифрованих (E2EE) кімнатах вихідні події зображень використовують `thumbnail_file`, тож preview зображень шифруються разом із повним вкладенням. У незашифрованих кімнатах і далі використовується звичайний `thumbnail_url`. Налаштування не потрібні — плагін автоматично визначає стан E2EE.

### Кімнати бот-бот

За замовчуванням повідомлення Matrix від інших налаштованих облікових записів OpenClaw Matrix ігноруються.

Використовуйте `allowBots`, якщо ви навмисно хочете дозволити міжагентний трафік Matrix:

```json5
{
  channels: {
    matrix: {
      allowBots: "mentions", // true | "mentions"
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

- `allowBots: true` приймає повідомлення від інших налаштованих облікових записів Matrix bot у дозволених кімнатах і DM.
- `allowBots: "mentions"` приймає ці повідомлення лише тоді, коли вони явно згадують цього бота в кімнатах. DM усе одно дозволені.
- `groups.<room>.allowBots` перевизначає налаштування на рівні облікового запису для однієї кімнати.
- OpenClaw і далі ігнорує повідомлення від того самого Matrix user ID, щоб уникати циклів самовідповіді.
- Matrix тут не надає вбудованого прапорця bot; OpenClaw трактує "створене ботом" як "надіслане іншим налаштованим обліковим записом Matrix на цьому OpenClaw gateway".

Використовуйте строгі allowlist кімнат і вимоги до згадок, коли вмикаєте трафік bot-to-bot у спільних кімнатах.

Увімкнення шифрування:

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_xxx",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

Перевірка стану верифікації:

```bash
openclaw matrix verify status
```

Докладний стан (повна діагностика):

```bash
openclaw matrix verify status --verbose
```

Включення збереженого recovery key у машиночитаний вивід:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Ініціалізація cross-signing і стану верифікації:

```bash
openclaw matrix verify bootstrap
```

Підтримка кількох облікових записів: використовуйте `channels.matrix.accounts` з обліковими даними для кожного облікового запису та необов’язковим `name`. Див. [Configuration reference](/uk/gateway/configuration-reference#multi-account-all-channels) для спільного шаблону.

Докладна діагностика bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Примусове скидання ідентичності cross-signing перед bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Верифікація цього пристрою за допомогою recovery key:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Докладні відомості про верифікацію пристрою:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Перевірка стану резервного копіювання ключів кімнат:

```bash
openclaw matrix verify backup status
```

Докладна діагностика стану резервного копіювання:

```bash
openclaw matrix verify backup status --verbose
```

Відновлення ключів кімнат із серверної резервної копії:

```bash
openclaw matrix verify backup restore
```

Докладна діагностика відновлення:

```bash
openclaw matrix verify backup restore --verbose
```

Видалення поточної серверної резервної копії та створення нової базової резервної копії. Якщо збережений
ключ резервної копії не вдається коректно завантажити, це скидання також може повторно створити secret storage, щоб
майбутні холодні запуски могли завантажувати новий ключ резервної копії:

```bash
openclaw matrix verify backup reset --yes
```

Усі команди `verify` за замовчуванням лаконічні (включно з тихим внутрішнім логуванням SDK) і показують детальну діагностику лише з `--verbose`.
Для повного машиночитаного виводу під час скриптування використовуйте `--json`.

У конфігураціях із кількома обліковими записами команди Matrix CLI використовують неявний обліковий запис Matrix за замовчуванням, якщо ви не передасте `--account <id>`.
Якщо ви налаштували кілька іменованих облікових записів, спочатку задайте `channels.matrix.defaultAccount`, інакше такі неявні операції CLI зупинятимуться й проситимуть вас явно вибрати обліковий запис.
Використовуйте `--account`, коли хочете, щоб операції верифікації або з пристроями явно були спрямовані на конкретний іменований обліковий запис:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Коли шифрування вимкнене або недоступне для іменованого облікового запису, попередження Matrix і помилки верифікації вказують на ключ конфігурації цього облікового запису, наприклад `channels.matrix.accounts.assistant.encryption`.

### Що означає "verified"

OpenClaw вважає цей пристрій Matrix верифікованим лише тоді, коли його верифікувала ваша власна ідентичність cross-signing.
На практиці `openclaw matrix verify status --verbose` показує три сигнали довіри:

- `Locally trusted`: цьому пристрою довіряє лише поточний клієнт
- `Cross-signing verified`: SDK повідомляє, що пристрій верифіковано через cross-signing
- `Signed by owner`: пристрій підписано вашим власним self-signing key

`Verified by owner` стає `yes` лише тоді, коли присутня верифікація через cross-signing або підпис власника.
Локальної довіри самої по собі недостатньо, щоб OpenClaw вважав пристрій повністю верифікованим.

### Що робить bootstrap

`openclaw matrix verify bootstrap` — це команда відновлення та налаштування для зашифрованих облікових записів Matrix.
Вона виконує все наведене нижче в такому порядку:

- ініціалізує secret storage, повторно використовуючи наявний recovery key, коли це можливо
- ініціалізує cross-signing і завантажує відсутні публічні ключі cross-signing
- намагається позначити й підписати поточний пристрій через cross-signing
- створює нову серверну резервну копію ключів кімнат, якщо її ще не існує

Якщо homeserver вимагає інтерактивну автентифікацію для завантаження ключів cross-signing, OpenClaw спочатку пробує завантаження без автентифікації, потім з `m.login.dummy`, а потім з `m.login.password`, якщо налаштовано `channels.matrix.password`.

Використовуйте `--force-reset-cross-signing` лише тоді, коли ви навмисно хочете відкинути поточну ідентичність cross-signing і створити нову.

Якщо ви навмисно хочете відкинути поточну резервну копію ключів кімнат і почати нову
базову резервну копію для майбутніх повідомлень, використовуйте `openclaw matrix verify backup reset --yes`.
Робіть це лише тоді, коли погоджуєтеся, що стару зашифровану історію, яку неможливо відновити,
буде й надалі недоступно, і що OpenClaw може повторно створити secret storage, якщо поточний секрет
резервної копії не вдається безпечно завантажити.

### Нова базова резервна копія

Якщо ви хочете зберегти роботу майбутніх зашифрованих повідомлень і погоджуєтеся втратити стару історію, яку неможливо відновити, виконайте ці команди по черзі:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Додавайте `--account <id>` до кожної команди, якщо хочете явно націлити їх на іменований обліковий запис Matrix.

### Поведінка під час запуску

Коли `encryption: true`, Matrix за замовчуванням встановлює `startupVerification` у `"if-unverified"`.
Під час запуску, якщо цей пристрій усе ще не верифікований, Matrix запросить self-verification в іншому Matrix client,
пропустить дублікати запитів, якщо один уже очікує, і застосує локальний cooldown перед повторною спробою після перезапусків.
За замовчуванням спроби, що завершилися помилкою, повторюються швидше, ніж успішне створення запиту.
Установіть `startupVerification: "off"`, щоб вимкнути автоматичні запити під час запуску, або налаштуйте `startupVerificationCooldownHours`,
якщо хочете коротше або довше вікно повторної спроби.

Під час запуску також автоматично виконується консервативний bootstrap криптографії.
Цей прохід спочатку намагається повторно використати поточні secret storage та ідентичність cross-signing і не скидає cross-signing, якщо ви не запускаєте явний сценарій відновлення bootstrap.

Якщо під час запуску виявлено зламаний стан bootstrap і налаштовано `channels.matrix.password`, OpenClaw може спробувати суворіший шлях відновлення.
Якщо поточний пристрій уже підписаний власником, OpenClaw зберігає цю ідентичність замість автоматичного скидання.

Оновлення з попереднього публічного плагіна Matrix:

- OpenClaw автоматично повторно використовує той самий обліковий запис Matrix, токен доступу та ідентичність пристрою, коли це можливо.
- Перш ніж запускати будь-які практичні зміни міграції Matrix, OpenClaw створює або повторно використовує snapshot відновлення в `~/Backups/openclaw-migrations/`.
- Якщо ви використовуєте кілька облікових записів Matrix, перед оновленням зі старого макета flat-store задайте `channels.matrix.defaultAccount`, щоб OpenClaw знав, який обліковий запис має отримати цей спільний legacy state.
- Якщо попередній плагін зберігав локально ключ розшифрування резервної копії ключів кімнат Matrix, startup або `openclaw doctor --fix` автоматично імпортують його в новий сценарій recovery-key.
- Якщо токен доступу Matrix змінився після підготовки міграції, startup тепер сканує сусідні корені сховища з token-hash на наявність незавершеного legacy restore state, перш ніж відмовитися від автоматичного відновлення резервної копії.
- Якщо токен доступу Matrix змінюється пізніше для того самого облікового запису, homeserver і користувача, OpenClaw тепер надає перевагу повторному використанню найбільш повного наявного кореня сховища з token-hash замість запуску з порожнього каталогу стану Matrix.
- Під час наступного запуску gateway збережені резервні ключі кімнат автоматично відновлюються в новому crypto store.
- Якщо старий плагін мав лише локальні ключі кімнат, які ніколи не потрапляли в резервну копію, OpenClaw чітко попередить про це. Ці ключі не можна автоматично експортувати з попереднього rust crypto store, тому частина старої зашифрованої історії може залишатися недоступною, доки її не буде відновлено вручну.
- Див. [Matrix migration](/uk/install/migrating-matrix) для повного сценарію оновлення, обмежень, команд відновлення та типових повідомлень міграції.

Зашифрований runtime state організовано в коренях на основі token-hash для кожного облікового запису й користувача в
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/`.
Цей каталог містить sync store (`bot-storage.json`), crypto store (`crypto/`),
файл recovery key (`recovery-key.json`), snapshot IndexedDB (`crypto-idb-snapshot.json`),
прив’язки тредів (`thread-bindings.json`) і стан startup verification (`startup-verification.json`),
коли ці можливості використовуються.
Коли токен змінюється, але ідентичність облікового запису лишається тією самою, OpenClaw повторно використовує найкращий наявний
корінь для цього кортежу облікового запису/homeserver/користувача, щоб попередній стан sync, crypto state, прив’язки тредів
і startup verification state залишалися видимими.

### Модель Node crypto store

Matrix E2EE у цьому плагіні використовує офіційний шлях Rust crypto з `matrix-js-sdk` у Node.
Цей шлях очікує persistence на основі IndexedDB, якщо ви хочете, щоб crypto state переживав перезапуски.

Наразі OpenClaw забезпечує це в Node таким чином:

- використовує `fake-indexeddb` як shim API IndexedDB, якого очікує SDK
- відновлює вміст Rust crypto IndexedDB з `crypto-idb-snapshot.json` перед `initRustCrypto`
- зберігає оновлений вміст IndexedDB назад у `crypto-idb-snapshot.json` після init і під час runtime
- серіалізує відновлення та збереження snapshot відносно `crypto-idb-snapshot.json` за допомогою advisory file lock, щоб persistence runtime gateway і обслуговування CLI не змагалися за один і той самий файл snapshot

Це plumbing сумісності/сховища, а не кастомна криптографічна реалізація.
Файл snapshot — це чутливий runtime state, і він зберігається з обмеженими правами доступу до файлів.
У межах моделі безпеки OpenClaw gateway host і локальний каталог стану OpenClaw вже входять до межі довіри оператора, тож це насамперед питання операційної стійкості, а не окрема віддалена межа довіри.

Заплановане покращення:

- додати підтримку SecretRef для постійного ключового матеріалу Matrix, щоб recovery keys і пов’язані секрети шифрування сховища можна було отримувати з провайдерів секретів OpenClaw, а не лише з локальних файлів

## Керування профілем

Оновіть self-profile Matrix для вибраного облікового запису за допомогою:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Додайте `--account <id>`, якщо хочете явно націлити команду на іменований обліковий запис Matrix.

Matrix безпосередньо приймає URL аватарів `mxc://`. Якщо ви передаєте URL аватара `http://` або `https://`, OpenClaw спочатку завантажує його в Matrix, а потім зберігає визначений URL `mxc://` назад у `channels.matrix.avatarUrl` (або у перевизначення вибраного облікового запису).

## Автоматичні сповіщення про верифікацію

Тепер Matrix публікує повідомлення про життєвий цикл верифікації безпосередньо в строгій кімнаті DM для верифікації як повідомлення `m.notice`.
Це включає:

- повідомлення про запит на верифікацію
- повідомлення про готовність до верифікації (з явною підказкою "Verify by emoji")
- повідомлення про початок і завершення верифікації
- деталі SAS (emoji і десяткові значення), коли вони доступні

Вхідні запити на верифікацію від іншого Matrix client відстежуються і автоматично приймаються OpenClaw.
Для сценаріїв self-verification OpenClaw також автоматично запускає SAS, коли стає доступною верифікація через emoji, і підтверджує свій бік.
Для запитів на верифікацію від іншого Matrix user/device OpenClaw автоматично приймає запит, а потім чекає, поки SAS продовжиться у звичайному режимі.
Вам усе одно потрібно порівняти emoji або десятковий SAS у вашому Matrix client і підтвердити там "They match", щоб завершити верифікацію.

OpenClaw не приймає сліпо дублікати власноруч ініційованих сценаріїв. Під час startup не створюється новий запит, якщо self-verification request уже очікує.

Повідомлення протоколу/системи верифікації не передаються в конвеєр чату агента, тож вони не призводять до `NO_REPLY`.

### Гігієна пристроїв

Старі пристрої Matrix, якими керував OpenClaw, можуть накопичуватися в обліковому записі й ускладнювати розуміння довіри в зашифрованих кімнатах.
Перелічіть їх за допомогою:

```bash
openclaw matrix devices list
```

Видаліть застарілі пристрої Matrix, якими керував OpenClaw, за допомогою:

```bash
openclaw matrix devices prune-stale
```

### Відновлення Direct Room

Якщо стан direct-message виходить із синхронізації, OpenClaw може отримати застарілі мапінги `m.direct`, які вказують на старі окремі кімнати замість живого DM. Перевірте поточне зіставлення для співрозмовника за допомогою:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Виправте його за допомогою:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Відновлення зберігає логіку, специфічну для Matrix, усередині плагіна:

- воно надає перевагу суворому DM 1:1, який уже відображено в `m.direct`
- інакше повертається до будь-якого поточно приєднаного суворого DM 1:1 із цим користувачем
- якщо здорового DM не існує, створює нову direct room і переписує `m.direct`, щоб вона вказувала на неї

Сценарій відновлення не видаляє старі кімнати автоматично. Він лише обирає здоровий DM і оновлює мапінг, щоб нові надсилання Matrix, сповіщення про верифікацію та інші direct-message сценарії знову спрямовувалися до правильної кімнати.

## Треди

Matrix підтримує нативні треди Matrix як для автоматичних відповідей, так і для надсилань через message-tool.

- `dm.sessionScope: "per-user"` (за замовчуванням) зберігає маршрутизацію Matrix DM із прив’язкою до відправника, тож кілька кімнат DM можуть ділити одну сесію, якщо вони визначаються як той самий співрозмовник.
- `dm.sessionScope: "per-room"` ізолює кожну кімнату Matrix DM у власний ключ сесії, водночас і далі використовуючи звичайну автентифікацію DM та перевірки allowlist.
- Явні прив’язки розмов Matrix усе одно мають пріоритет над `dm.sessionScope`, тому прив’язані кімнати й треди зберігають свою вибрану цільову сесію.
- `threadReplies: "off"` залишає відповіді на верхньому рівні й зберігає вхідні threaded messages у батьківській сесії.
- `threadReplies: "inbound"` відповідає всередині треду лише тоді, коли вхідне повідомлення вже було в цьому треді.
- `threadReplies: "always"` зберігає відповіді в кімнаті в треді, що починається від повідомлення-тригера, і маршрутизує цю розмову через відповідну сесію з прив’язкою до треду від першого повідомлення-тригера.
- `dm.threadReplies` перевизначає налаштування верхнього рівня лише для DM. Наприклад, ви можете ізолювати треди в кімнатах, залишивши DM плоскими.
- Вхідні threaded messages включають кореневе повідомлення треду як додатковий контекст для агента.
- Надсилання через message-tool тепер автоматично успадковують поточний тред Matrix, коли ціллю є та сама кімната або той самий DM-користувач, якщо не задано явний `threadId`.
- Повторне використання цілі DM-користувача в тій самій сесії спрацьовує лише тоді, коли метадані поточної сесії підтверджують того самого DM-співрозмовника в тому самому обліковому записі Matrix; інакше OpenClaw повертається до звичайної маршрутизації з областю користувача.
- Коли OpenClaw бачить, що Matrix DM room конфліктує з іншою DM room у межах тієї самої спільної Matrix DM session, він публікує одноразове `m.notice` у цій кімнаті з escape hatch `/focus`, якщо прив’язки тредів увімкнено, і з підказкою `dm.sessionScope`.
- Runtime-прив’язки тредів підтримуються для Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язаний до треду `/acp spawn` тепер працюють у кімнатах і DM Matrix.
- `/focus` у Matrix room/DM верхнього рівня створює новий тред Matrix і прив’язує його до цільової сесії, коли `threadBindings.spawnSubagentSessions=true`.
- Запуск `/focus` або `/acp spawn --thread here` всередині наявного треду Matrix натомість прив’язує цей поточний тред.

## Прив’язки розмов ACP

Кімнати Matrix, DM і наявні треди Matrix можна перетворити на довговічні робочі простори ACP без зміни поверхні чату.

Швидкий сценарій для оператора:

- Виконайте `/acp spawn codex --bind here` всередині Matrix DM, кімнати або наявного треду, яким хочете продовжувати користуватися.
- У Matrix DM або кімнаті верхнього рівня поточний DM/кімната залишається поверхнею чату, а майбутні повідомлення маршрутизуються до створеної сесії ACP.
- Усередині наявного треду Matrix `--bind here` прив’язує цей поточний тред на місці.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Примітки:

- `--bind here` не створює дочірній тред Matrix.
- `threadBindings.spawnAcpSessions` потрібен лише для `/acp spawn --thread auto|here`, де OpenClaw має створити або прив’язати дочірній тред Matrix.

### Конфігурація прив’язки тредів

Matrix успадковує глобальні значення за замовчуванням із `session.threadBindings`, а також підтримує перевизначення для окремого каналу:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Прапорці spawn для thread-bound у Matrix є opt-in:

- Установіть `threadBindings.spawnSubagentSessions: true`, щоб дозволити `/focus` верхнього рівня створювати та прив’язувати нові треди Matrix.
- Установіть `threadBindings.spawnAcpSessions: true`, щоб дозволити `/acp spawn --thread auto|here` прив’язувати сесії ACP до тредів Matrix.

## Реакції

Matrix підтримує вихідні дії з реакціями, вхідні сповіщення про реакції та вхідні ack reactions.

- Інструментарій вихідних реакцій контролюється через `channels["matrix"].actions.reactions`.
- `react` додає реакцію до певної події Matrix.
- `reactions` перелічує поточне зведення реакцій для певної події Matrix.
- `emoji=""` видаляє власні реакції облікового запису бота на цій події.
- `remove: true` видаляє з облікового запису бота лише реакцію з указаним emoji.

Область ack reactions визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- fallback до emoji ідентичності агента

Область дії ack reaction визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Режим сповіщень про реакції визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- за замовчуванням: `own`

Поточна поведінка:

- `reactionNotifications: "own"` передає додані події `m.reaction`, коли вони спрямовані на повідомлення Matrix, створені ботом.
- `reactionNotifications: "off"` вимикає системні події реакцій.
- Видалення реакцій досі не синтезуються в системні події, тому що Matrix представляє їх як redaction-и, а не як окремі видалення `m.reaction`.

## Контекст історії

- `channels.matrix.historyLimit` визначає, скільки останніх повідомлень кімнати включається як `InboundHistory`, коли повідомлення кімнати Matrix активує агента.
- Використовується fallback до `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути.
- Історія кімнати Matrix — лише для кімнати. DM і далі використовують звичайну історію сесії.
- Історія кімнати Matrix є pending-only: OpenClaw буферизує повідомлення кімнати, які ще не викликали відповідь, а потім робить snapshot цього вікна, коли надходить згадка або інший тригер.
- Поточне повідомлення-тригер не включається в `InboundHistory`; воно залишається в основному вхідному тілі для цього ходу.
- Повторні спроби для тієї самої події Matrix повторно використовують оригінальний snapshot історії замість зміщення вперед до новіших повідомлень кімнати.

## Видимість контексту

Matrix підтримує спільний контроль `contextVisibility` для додаткового контексту кімнати, як-от отриманий текст відповіді, корені тредів і незавершена історія.

- `contextVisibility: "all"` — значення за замовчуванням. Додатковий контекст зберігається як отримано.
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників, дозволених активними перевірками allowlist кімнати/користувача.
- `contextVisibility: "allowlist_quote"` працює як `allowlist`, але все одно зберігає одну явну цитовану відповідь.

Це налаштування впливає на видимість додаткового контексту, а не на те, чи може саме вхідне повідомлення викликати відповідь.
Авторизація тригера, як і раніше, походить із `groupPolicy`, `groups`, `groupAllowFrom` і налаштувань політики DM.

## Приклад політики для DM і кімнат

```json5
{
  channels: {
    matrix: {
      dm: {
        policy: "allowlist",
        allowFrom: ["@admin:example.org"],
        threadReplies: "off",
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
      groups: {
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Див. [Groups](/uk/channels/groups) щодо керування згадками й поведінки allowlist.

Приклад pairing для Matrix DM:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Якщо непідтверджений користувач Matrix продовжує писати вам до схвалення, OpenClaw повторно використовує той самий pending pairing code і може знову надіслати нагадування після короткого cooldown замість створення нового коду.

Див. [Pairing](/uk/channels/pairing) для спільного сценарію pairing у DM і структури сховища.

## Погодження exec

Matrix може діяти як клієнт погодження exec для облікового запису Matrix.

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (необов’язково; fallback до `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, за замовчуванням: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Approvers мають бути Matrix user ID, наприклад `@owner:example.org`. Matrix автоматично вмикає нативні exec approvals, коли `enabled` не задано або дорівнює `"auto"` і можна визначити принаймні одного approver, або з `execApprovals.approvers`, або з `channels.matrix.dm.allowFrom`. Установіть `enabled: false`, щоб явно вимкнути Matrix як нативний клієнт погодження. Інакше запити на погодження переходять до інших налаштованих маршрутів погодження або до fallback policy для exec approval.

Нативна маршрутизація Matrix наразі стосується лише exec:

- `channels.matrix.execApprovals.*` керує нативною маршрутизацією DM/channel лише для exec approvals.
- Погодження плагінів і далі використовують спільний `/approve` у тому ж чаті плюс будь-яке налаштоване пересилання `approvals.plugin`.
- Matrix усе ще може повторно використовувати `channels.matrix.dm.allowFrom` для авторизації погоджень плагінів, коли може безпечно визначити approver-ів, але не надає окремого нативного шляху fanout DM/channel для погоджень плагінів.

Правила доставки:

- `target: "dm"` надсилає запити на погодження в DM approver-ів
- `target: "channel"` надсилає запит назад у вихідну кімнату Matrix або DM
- `target: "both"` надсилає в DM approver-ів і у вихідну кімнату Matrix або DM

Запити на погодження Matrix ініціалізують shortcut-реакції на основному повідомленні погодження:

- `✅` = дозволити один раз
- `❌` = відхилити
- `♾️` = дозволити завжди, якщо таке рішення дозволене ефективною політикою exec

Approver-и можуть реагувати на це повідомлення або використовувати fallback slash-команди: `/approve <id> allow-once`, `/approve <id> allow-always` або `/approve <id> deny`.

Лише визначені approver-и можуть дозволяти або відхиляти. Доставка в канал включає текст команди, тому вмикайте `channel` або `both` лише в довірених кімнатах.

Запити на погодження Matrix повторно використовують спільний core approval planner. Нативна поверхня Matrix — це лише транспорт для exec approvals: маршрутизація кімнат/DM і поведінка надсилання/оновлення/видалення повідомлень.

Перевизначення для окремого облікового запису:

- `channels.matrix.accounts.<account>.execApprovals`

Пов’язана документація: [Exec approvals](/uk/tools/exec-approvals)

## Приклад із кількома обліковими записами

```json5
{
  channels: {
    matrix: {
      enabled: true,
      defaultAccount: "assistant",
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_xxx",
          encryption: true,
        },
        alerts: {
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_xxx",
          dm: {
            policy: "allowlist",
            allowFrom: ["@ops:example.org"],
            threadReplies: "off",
          },
        },
      },
    },
  },
}
```

Значення верхнього рівня `channels.matrix` діють як значення за замовчуванням для іменованих облікових записів, якщо обліковий запис не перевизначає їх.
Ви можете обмежити успадковані записи кімнат одним обліковим записом Matrix за допомогою `groups.<room>.account` (або legacy `rooms.<room>.account`).
Записи без `account` залишаються спільними для всіх облікових записів Matrix, а записи з `account: "default"` і далі працюють, коли обліковий запис за замовчуванням налаштовано безпосередньо на верхньому рівні `channels.matrix.*`.
Часткові спільні значення автентифікації за замовчуванням самі по собі не створюють окремий неявний обліковий запис за замовчуванням. OpenClaw синтезує верхньорівневий обліковий запис `default` лише тоді, коли цей обліковий запис має актуальну автентифікацію (`homeserver` плюс `accessToken`, або `homeserver` плюс `userId` і `password`); іменовані облікові записи все одно можуть залишатися доступними через `homeserver` плюс `userId`, коли пізніше автентифікація задовольняється кешованими обліковими даними.
Якщо Matrix уже має рівно один іменований обліковий запис або `defaultAccount` вказує на наявний ключ іменованого облікового запису, просування від single-account до multi-account під час відновлення/налаштування зберігає цей обліковий запис замість створення нового запису `accounts.default`. У цей просунутий обліковий запис переміщуються лише ключі Matrix auth/bootstrap; спільні ключі політики доставки залишаються на верхньому рівні.
Установіть `defaultAccount`, якщо хочете, щоб OpenClaw віддавав перевагу одному іменованому обліковому запису Matrix для неявної маршрутизації, probing і операцій CLI.
Якщо ви налаштували кілька іменованих облікових записів, задайте `defaultAccount` або передавайте `--account <id>` для команд CLI, які покладаються на неявний вибір облікового запису.
Передавайте `--account <id>` до `openclaw matrix verify ...` і `openclaw matrix devices ...`, якщо хочете перевизначити цей неявний вибір для однієї команди.

## Приватні/LAN homeserver-и

За замовчуванням OpenClaw блокує приватні/внутрішні Matrix homeserver-и для захисту від SSRF, якщо ви
явно не дозволите це для кожного облікового запису окремо.

Якщо ваш homeserver працює на localhost, LAN/Tailscale IP або внутрішньому імені хоста, увімкніть
`allowPrivateNetwork` для цього облікового запису Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      allowPrivateNetwork: true,
      accessToken: "syt_internal_xxx",
    },
  },
}
```

Приклад налаштування через CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Ця opt-in опція дозволяє лише довірені приватні/внутрішні цілі. Публічні homeserver-и без шифрування, наприклад
`http://matrix.example.org:8008`, і далі блокуються. За можливості віддавайте перевагу `https://`.

## Проксіювання трафіку Matrix

Якщо вашому розгортанню Matrix потрібен явний вихідний HTTP(S) proxy, задайте `channels.matrix.proxy`:

```json5
{
  channels: {
    matrix: {
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
    },
  },
}
```

Іменовані облікові записи можуть перевизначати верхньорівневе значення за замовчуванням через `channels.matrix.accounts.<id>.proxy`.
OpenClaw використовує той самий параметр proxy для runtime-трафіку Matrix і перевірок стану облікового запису.

## Визначення цілей

Matrix приймає такі форми цілей скрізь, де OpenClaw просить указати ціль кімнати або користувача:

- Користувачі: `@user:server`, `user:@user:server` або `matrix:user:@user:server`
- Кімнати: `!room:server`, `room:!room:server` або `matrix:room:!room:server`
- Псевдоніми: `#alias:server`, `channel:#alias:server` або `matrix:channel:#alias:server`

Живий пошук у каталозі використовує обліковий запис Matrix, у який виконано вхід:

- Пошук користувачів виконує запити до каталогу користувачів Matrix на цьому homeserver.
- Пошук кімнат безпосередньо приймає явні ID кімнат і псевдоніми, а потім переходить до пошуку серед назв приєднаних кімнат цього облікового запису.
- Пошук за назвами приєднаних кімнат є best-effort. Якщо назву кімнати не вдається визначити як ID або псевдонім, вона ігнорується під час runtime-розв’язання allowlist.

## Довідник конфігурації

- `enabled`: увімкнути або вимкнути канал.
- `name`: необов’язкова мітка для облікового запису.
- `defaultAccount`: бажаний ID облікового запису, коли налаштовано кілька облікових записів Matrix.
- `homeserver`: URL homeserver, наприклад `https://matrix.example.org`.
- `allowPrivateNetwork`: дозволити цьому обліковому запису Matrix підключатися до приватних/внутрішніх homeserver-ів. Увімкніть це, коли homeserver визначається як `localhost`, LAN/Tailscale IP або внутрішній хост, наприклад `matrix-synapse`.
- `proxy`: необов’язковий URL HTTP(S) proxy для трафіку Matrix. Іменовані облікові записи можуть перевизначати верхньорівневе значення за замовчуванням власним `proxy`.
- `userId`: повний Matrix user ID, наприклад `@bot:example.org`.
- `accessToken`: токен доступу для автентифікації на основі токена. Для `channels.matrix.accessToken` і `channels.matrix.accounts.<id>.accessToken` підтримуються значення plaintext і SecretRef у провайдерах env/file/exec. Див. [Secrets Management](/uk/gateway/secrets).
- `password`: пароль для входу на основі пароля. Підтримуються значення plaintext і SecretRef.
- `deviceId`: явний Matrix device ID.
- `deviceName`: відображувана назва пристрою для входу за паролем.
- `avatarUrl`: збережений URL власного аватара для синхронізації профілю та оновлень `set-profile`.
- `initialSyncLimit`: ліміт подій синхронізації під час запуску.
- `encryption`: увімкнути E2EE.
- `allowlistOnly`: примусова поведінка лише за allowlist для DM і кімнат.
- `allowBots`: дозволити повідомлення від інших налаштованих облікових записів OpenClaw Matrix (`true` або `"mentions"`).
- `groupPolicy`: `open`, `allowlist` або `disabled`.
- `contextVisibility`: режим видимості додаткового контексту кімнати (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist user ID для трафіку кімнат.
- Записи `groupAllowFrom` мають бути повними Matrix user ID. Нерозпізнані імена ігноруються під час runtime.
- `historyLimit`: максимальна кількість повідомлень кімнати для включення як контекст історії групи. Використовує fallback до `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути.
- `replyToMode`: `off`, `first` або `all`.
- `markdown`: необов’язкова конфігурація рендерингу Markdown для вихідного тексту Matrix.
- `streaming`: `off` (за замовчуванням), `partial`, `quiet`, `true` або `false`. `partial` і `true` вмикають оновлення чернеток із попереднім preview через звичайні текстові повідомлення Matrix. `quiet` використовує preview notices без сповіщень для self-hosted конфігурацій із push rules.
- `blockStreaming`: `true` вмикає окремі повідомлення про прогрес для завершених блоків асистента, поки активний draft preview streaming.
- `threadReplies`: `off`, `inbound` або `always`.
- `threadBindings`: перевизначення для окремого каналу щодо маршрутизації та життєвого циклу сесій, прив’язаних до тредів.
- `startupVerification`: режим автоматичного запиту self-verification під час запуску (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown перед повторною спробою автоматичних запитів верифікації під час запуску.
- `textChunkLimit`: розмір chunk вихідного повідомлення.
- `chunkMode`: `length` або `newline`.
- `responsePrefix`: необов’язковий префікс повідомлення для вихідних відповідей.
- `ackReaction`: необов’язкове перевизначення ack reaction для цього каналу/облікового запису.
- `ackReactionScope`: необов’язкове перевизначення області ack reaction (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: режим вхідних сповіщень про реакції (`own`, `off`).
- `mediaMaxMb`: обмеження розміру медіа в МБ для обробки медіа Matrix. Застосовується до вихідного надсилання та обробки вхідних медіа.
- `autoJoin`: політика автоматичного приєднання до запрошень (`always`, `allowlist`, `off`). За замовчуванням: `off`.
- `autoJoinAllowlist`: кімнати/псевдоніми, дозволені, коли `autoJoin` має значення `allowlist`. Псевдоніми визначаються як room ID під час обробки запрошення; OpenClaw не довіряє стану псевдоніма, який заявляє запрошена кімната.
- `dm`: блок політики DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- Записи `dm.allowFrom` мають бути повними Matrix user ID, якщо тільки ви вже не визначили їх через живий пошук у каталозі.
- `dm.sessionScope`: `per-user` (за замовчуванням) або `per-room`. Використовуйте `per-room`, якщо хочете, щоб кожна кімната Matrix DM зберігала окремий контекст, навіть якщо співрозмовник той самий.
- `dm.threadReplies`: перевизначення політики тредів лише для DM (`off`, `inbound`, `always`). Воно перевизначає верхньорівневе `threadReplies` як для розміщення відповідей, так і для ізоляції сесій у DM.
- `execApprovals`: нативна доставка погоджень exec у Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: Matrix user ID, яким дозволено погоджувати exec-запити. Необов’язково, якщо `dm.allowFrom` уже визначає approver-ів.
- `execApprovals.target`: `dm | channel | both` (за замовчуванням: `dm`).
- `accounts`: іменовані перевизначення для окремих облікових записів. Значення верхнього рівня `channels.matrix` діють як значення за замовчуванням для цих записів.
- `groups`: мапа політик для окремих кімнат. Віддавайте перевагу room ID або псевдонімам; нерозпізнані назви кімнат ігноруються під час runtime. Ідентичність сесії/групи після визначення використовує стабільний room ID, тоді як людськочитані мітки все ще походять із назв кімнат.
- `groups.<room>.account`: обмежити один успадкований запис кімнати конкретним обліковим записом Matrix у конфігураціях із кількома обліковими записами.
- `groups.<room>.allowBots`: перевизначення на рівні кімнати для відправників-ботів із конфігурації (`true` або `"mentions"`).
- `groups.<room>.users`: allowlist відправників для окремої кімнати.
- `groups.<room>.tools`: перевизначення allow/deny інструментів для окремої кімнати.
- `groups.<room>.autoReply`: перевизначення керування згадками на рівні кімнати. `true` вимикає вимоги до згадок для цієї кімнати; `false` примусово вмикає їх знову.
- `groups.<room>.skills`: необов’язковий фільтр Skills на рівні кімнати.
- `groups.<room>.systemPrompt`: необов’язковий фрагмент system prompt на рівні кімнати.
- `rooms`: legacy-псевдонім для `groups`.
- `actions`: контроль доступу до інструментів для окремих дій (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Пов’язане

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і сценарій pairing
- [Groups](/uk/channels/groups) — поведінка групового чату й керування згадками
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та посилення захисту
