---
read_when:
    - Налаштування Matrix в OpenClaw
    - Налаштування Matrix E2EE та верифікації
summary: Статус підтримки Matrix, налаштування та приклади конфігурації
title: Matrix
x-i18n:
    generated_at: "2026-04-27T10:57:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 253c91d0b425617a2f6e9bf1edfa56db9fee0607509ec382b3abfb99452f6003
    source_path: channels/matrix.md
    workflow: 15
---

Matrix — це вбудований plugin каналу для OpenClaw.
Він використовує офіційний `matrix-js-sdk` і підтримує DM, кімнати, треди, медіа, реакції, опитування, геолокацію та E2EE.

## Вбудований plugin

Поточні пакетні релізи OpenClaw постачаються з plugin Matrix з коробки. Вам не потрібно нічого встановлювати; активація виконується через налаштування `channels.matrix.*` (див. [Налаштування](#setup)).

Для старіших збірок або кастомних інсталяцій, які не містять Matrix, спочатку встановіть його вручну:

```bash
openclaw plugins install @openclaw/matrix
# or, from a local checkout
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` реєструє та вмикає plugin, тому окремий крок `openclaw plugins enable matrix` не потрібен. Однак plugin усе одно нічого не робить, доки ви не налаштуєте канал нижче. Див. [Plugins](/uk/tools/plugin) для загальної поведінки plugin та правил встановлення.

## Налаштування

1. Створіть обліковий запис Matrix на вашому homeserver.
2. Налаштуйте `channels.matrix` за допомогою `homeserver` + `accessToken` або `homeserver` + `userId` + `password`.
3. Перезапустіть Gateway.
4. Почніть DM з ботом або запросіть його до кімнати (див. [автоприєднання](#auto-join) — нові запрошення спрацьовують, лише якщо це дозволяє `autoJoin`).

### Інтерактивне налаштування

```bash
openclaw channels add
openclaw configure --section channels
```

Майстер запитує: URL homeserver, метод автентифікації (токен доступу або пароль), ID користувача (лише для автентифікації паролем), необов’язкову назву пристрою, чи потрібно ввімкнути E2EE, а також чи потрібно налаштувати доступ до кімнат і автоприєднання.

Якщо відповідні змінні середовища `MATRIX_*` уже існують і для вибраного облікового запису немає збереженої автентифікації, майстер запропонує скористатися env-var shortcut. Щоб визначити назви кімнат перед збереженням allowlist, виконайте `openclaw channels resolve --channel matrix "Project Room"`. Якщо E2EE увімкнено, майстер записує конфігурацію та запускає той самий bootstrap, що й [`openclaw matrix encryption setup`](#encryption-and-verification).

### Мінімальна конфігурація

На основі токена:

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

На основі пароля (токен кешується після першого входу):

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

### Автоприєднання

Значення `channels.matrix.autoJoin` за замовчуванням — `off`. За цього типового налаштування бот не з’являтиметься в нових кімнатах або DM із нових запрошень, доки ви не приєднаєте його вручну.

OpenClaw не може визначити в момент запрошення, чи запрошена кімната є DM чи групою, тому всі запрошення — включно із запрошеннями у стилі DM — спочатку проходять через `autoJoin`. `dm.policy` застосовується лише пізніше, після того як бот уже приєднався й кімнату було класифіковано.

<Warning>
Установіть `autoJoin: "allowlist"` разом із `autoJoinAllowlist`, щоб обмежити, які запрошення бот приймає, або `autoJoin: "always"`, щоб приймати кожне запрошення.

`autoJoinAllowlist` приймає лише стабільні цілі: `!roomId:server`, `#alias:server` або `*`. Звичайні назви кімнат відхиляються; записи alias визначаються через homeserver, а не за станом, заявленим запрошеною кімнатою.
</Warning>

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": { requireMention: true },
      },
    },
  },
}
```

Щоб приймати кожне запрошення, використовуйте `autoJoin: "always"`.

### Формати цілей allowlist

Списки дозволів для DM і кімнат найкраще заповнювати стабільними ID:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): використовуйте `@user:server`. Відображувані імена визначаються лише тоді, коли каталог homeserver повертає рівно один збіг.
- Кімнати (`groups`, `autoJoinAllowlist`): використовуйте `!room:server` або `#alias:server`. Імена визначаються best-effort за приєднаними кімнатами; нерозпізнані записи ігноруються під час виконання.

### Нормалізація ID облікового запису

Майстер перетворює дружню назву на нормалізований ID облікового запису. Наприклад, `Ops Bot` стає `ops-bot`. Пунктуація екранується в scoped назвах env-var, щоб два облікові записи не конфліктували: `-` → `_X2D_`, тож `ops-prod` відповідає `MATRIX_OPS_X2D_PROD_*`.

### Кешовані облікові дані

Matrix зберігає кешовані облікові дані в `~/.openclaw/credentials/matrix/`:

- обліковий запис за замовчуванням: `credentials.json`
- іменовані облікові записи: `credentials-<account>.json`

Коли там існують кешовані облікові дані, OpenClaw вважає Matrix налаштованим, навіть якщо токена доступу немає у файлі конфігурації — це стосується налаштування, `openclaw doctor` і перевірок стану каналу.

### Змінні середовища

Використовуються, коли еквівалентний ключ конфігурації не задано. Обліковий запис за замовчуванням використовує назви без префікса; іменовані облікові записи використовують ID облікового запису, вставлений перед суфіксом.

| Обліковий запис за замовчуванням | Іменований обліковий запис (`<ID>` — нормалізований ID облікового запису) |
| ------------------------------- | -------------------------------------------------------------------------- |
| `MATRIX_HOMESERVER`             | `MATRIX_<ID>_HOMESERVER`                                                   |
| `MATRIX_ACCESS_TOKEN`           | `MATRIX_<ID>_ACCESS_TOKEN`                                                 |
| `MATRIX_USER_ID`                | `MATRIX_<ID>_USER_ID`                                                      |
| `MATRIX_PASSWORD`               | `MATRIX_<ID>_PASSWORD`                                                     |
| `MATRIX_DEVICE_ID`              | `MATRIX_<ID>_DEVICE_ID`                                                    |
| `MATRIX_DEVICE_NAME`            | `MATRIX_<ID>_DEVICE_NAME`                                                  |
| `MATRIX_RECOVERY_KEY`           | `MATRIX_<ID>_RECOVERY_KEY`                                                 |

Для облікового запису `ops` назви стають `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` тощо. Змінні середовища recovery key зчитуються CLI-потоками, які підтримують відновлення (`verify backup restore`, `verify device`, `verify bootstrap`), коли ви передаєте ключ через `--recovery-key-stdin`.

`MATRIX_HOMESERVER` не можна задавати з робочого `.env`; див. [Файли `.env` робочого простору](/uk/gateway/security).

## Приклад конфігурації

Практична базова конфігурація з pairing для DM, allowlist кімнат і E2EE:

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
        "!roomid:example.org": { requireMention: true },
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

## Попередній перегляд потокових відповідей

Потокова передача відповідей у Matrix є опціональною. `streaming` керує тим, як OpenClaw доставляє проміжну відповідь асистента; `blockStreaming` визначає, чи зберігати кожен завершений блок як окреме повідомлення Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

| `streaming`       | Поведінка                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (default) | Очікує повну відповідь і надсилає один раз. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                               |
| `"partial"`       | Редагує одне звичайне текстове повідомлення на місці, поки модель пише поточний блок. Стандартні клієнти Matrix можуть надсилати сповіщення про перший попередній перегляд, а не про фінальне редагування. |
| `"quiet"`         | Те саме, що й `"partial"`, але повідомлення є notice без сповіщення. Одержувачі отримують сповіщення лише тоді, коли для фіналізованого редагування спрацьовує правило push для конкретного користувача (див. нижче). |

`blockStreaming` не залежить від `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (default)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Живий чернетковий варіант поточного блоку, завершені блоки зберігаються як повідомлення | Живий чернетковий варіант поточного блоку, фіналізується на місці |
| `"off"`                 | Одне повідомлення Matrix зі сповіщенням на кожен завершений блок    | Одне повідомлення Matrix зі сповіщенням для всієї відповіді      |

Примітки:

- Якщо попередній перегляд перевищує ліміт Matrix на розмір події, OpenClaw припиняє потокову передачу попереднього перегляду й переходить до доставки лише фінальної відповіді.
- Відповіді з медіа завжди надсилають вкладення у звичайному режимі. Якщо застарілий попередній перегляд більше не можна безпечно повторно використати, OpenClaw редагує його перед надсиланням фінальної відповіді з медіа.
- Редагування попереднього перегляду потребує додаткових викликів API Matrix. Залишайте `streaming: "off"`, якщо вам потрібен найконсервативніший профіль обмеження швидкості.

### Самостійно розміщені правила push для тихих фіналізованих попередніх переглядів

`streaming: "quiet"` сповіщає одержувачів лише після фіналізації блоку або ходу — правило push для конкретного користувача має збігтися з маркером фіналізованого попереднього перегляду. Повний рецепт див. у [Правилах push Matrix для тихих попередніх переглядів](/uk/channels/matrix-push-rules) (токен одержувача, перевірка pusher, встановлення правил, примітки для окремих homeserver).

## Кімнати бот-бот

За замовчуванням повідомлення Matrix від інших налаштованих облікових записів OpenClaw Matrix ігноруються.

Використовуйте `allowBots`, якщо ви навмисно хочете міжагентний трафік Matrix:

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

- `allowBots: true` приймає повідомлення від інших налаштованих облікових записів ботів Matrix у дозволених кімнатах і DM.
- `allowBots: "mentions"` приймає ці повідомлення лише тоді, коли вони явно згадують цього бота в кімнатах. DM усе одно дозволені.
- `groups.<room>.allowBots` перевизначає налаштування рівня облікового запису для однієї кімнати.
- OpenClaw усе одно ігнорує повідомлення від того самого Matrix user ID, щоб уникнути циклів самовідповідей.
- Matrix тут не надає нативного прапорця бота; OpenClaw трактує «створене ботом» як «надіслане іншим налаштованим обліковим записом Matrix на цьому Gateway OpenClaw».

Використовуйте суворі allowlist кімнат і вимоги щодо згадувань, коли вмикаєте трафік бот-бот у спільних кімнатах.

## Шифрування та верифікація

У зашифрованих (E2EE) кімнатах вихідні події зображень використовують `thumbnail_file`, тому попередні перегляди зображень шифруються разом із повним вкладенням. Незашифровані кімнати, як і раніше, використовують звичайний `thumbnail_url`. Жодної конфігурації не потрібно — plugin автоматично визначає стан E2EE.

Усі команди `openclaw matrix` приймають `--verbose` (повна діагностика), `--json` (машиночитаний вивід) і `--account <id>` (для конфігурацій із кількома обліковими записами). За замовчуванням вивід стислий, із тихим внутрішнім логуванням SDK. У прикладах нижче показано канонічну форму; за потреби додайте прапорці.

### Увімкнення шифрування

```bash
openclaw matrix encryption setup
```

Виконує bootstrap secret storage і cross-signing, за потреби створює резервну копію ключів кімнати, а потім виводить статус і наступні кроки. Корисні прапорці:

- `--recovery-key <key>` застосувати recovery key перед bootstrap (краще використовувати форму stdin, задокументовану нижче)
- `--force-reset-cross-signing` відкинути поточну ідентичність cross-signing і створити нову (використовуйте лише навмисно)

Для нового облікового запису ввімкніть E2EE під час створення:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` є псевдонімом для `--enable-e2ee`.

Еквівалент ручної конфігурації:

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

### Статус і сигнали довіри

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` повідомляє про три незалежні сигнали довіри (`--verbose` показує всі):

- `Locally trusted`: довіряється лише цим клієнтом
- `Cross-signing verified`: SDK повідомляє про верифікацію через cross-signing
- `Signed by owner`: підписано вашим власним self-signing key (лише для діагностики)

`Verified by owner` стає `yes` лише тоді, коли `Cross-signing verified` має значення `yes`. Локальної довіри або лише підпису власника недостатньо.

`--allow-degraded-local-state` повертає best-effort діагностику без попередньої підготовки облікового запису Matrix; це корисно для офлайн-перевірок або частково налаштованих probe.

### Верифікація цього пристрою за допомогою recovery key

Recovery key є чутливим — передавайте його через stdin, а не в командному рядку. Установіть `MATRIX_RECOVERY_KEY` (або `MATRIX_<ID>_RECOVERY_KEY` для іменованого облікового запису):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Команда повідомляє про три стани:

- `Recovery key accepted`: Matrix прийняв ключ для secret storage або довіри до пристрою.
- `Backup usable`: резервну копію ключів кімнати можна завантажити за допомогою довіреного recovery material.
- `Device verified by owner`: цей пристрій має повну довіру до Matrix cross-signing identity.

Команда завершується з ненульовим кодом, якщо повна довіра до identity не завершена, навіть якщо recovery key розблокував матеріали резервної копії. У такому разі завершіть self-verification з іншого клієнта Matrix:

```bash
openclaw matrix verify self
```

`verify self` очікує `Cross-signing verified: yes`, перш ніж успішно завершитися. Використовуйте `--timeout-ms <ms>`, щоб налаштувати очікування.

Форма з буквальним ключем `openclaw matrix verify device "<recovery-key>"` також підтримується, але ключ потрапляє в історію вашої оболонки.

### Bootstrap або відновлення cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` — це команда відновлення й налаштування для зашифрованих облікових записів. По черзі вона:

- виконує bootstrap secret storage, повторно використовуючи наявний recovery key, коли це можливо
- виконує bootstrap cross-signing і завантажує відсутні публічні ключі
- позначає поточний пристрій і виконує cross-signing
- створює серверну резервну копію ключів кімнати, якщо її ще не існує

Якщо homeserver вимагає UIA для завантаження ключів cross-signing, OpenClaw спочатку намагається без автентифікації, потім `m.login.dummy`, а потім `m.login.password` (потрібен `channels.matrix.password`).

Корисні прапорці:

- `--recovery-key-stdin` (у парі з `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) або `--recovery-key <key>`
- `--force-reset-cross-signing`, щоб відкинути поточну cross-signing identity (лише за свідомого наміру)

### Резервна копія ключів кімнати

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` показує, чи існує серверна резервна копія і чи може цей пристрій її розшифрувати. `backup restore` імпортує збережені резервні ключі кімнат у локальне криптосховище; якщо recovery key уже є на диску, `--recovery-key-stdin` можна не вказувати.

Щоб замінити зламану резервну копію новою базовою версією (допускає втрату невідновлюваної старої історії; також може повторно створити secret storage, якщо поточний backup secret неможливо завантажити):

```bash
openclaw matrix verify backup reset --yes
```

Додавайте `--rotate-recovery-key` лише тоді, коли ви свідомо хочете, щоб попередній recovery key більше не розблоковував нову базову резервну копію.

### Перелік, запит і відповідь на верифікації

```bash
openclaw matrix verify list
```

Показує список очікуваних запитів на верифікацію для вибраного облікового запису.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Надсилає запит на верифікацію з цього облікового запису OpenClaw. `--own-user` запитує self-verification (ви приймаєте запрошення в іншому клієнті Matrix того самого користувача); `--user-id`/`--device-id`/`--room-id` націлюють запит на іншу особу. `--own-user` не можна поєднувати з іншими прапорцями націлювання.

Для обробки життєвого циклу на нижчому рівні — зазвичай під час супроводу вхідних запитів з іншого клієнта — ці команди працюють із конкретним запитом `<id>` (виводиться командами `verify list` і `verify request`):

| Команда                                    | Призначення                                                          |
| ------------------------------------------ | -------------------------------------------------------------------- |
| `openclaw matrix verify accept <id>`       | Прийняти вхідний запит                                               |
| `openclaw matrix verify start <id>`        | Запустити потік SAS                                                  |
| `openclaw matrix verify sas <id>`          | Показати емодзі SAS або десяткові числа                              |
| `openclaw matrix verify confirm-sas <id>`  | Підтвердити, що SAS збігається з тим, що показує інший клієнт        |
| `openclaw matrix verify mismatch-sas <id>` | Відхилити SAS, якщо емодзі або десяткові числа не збігаються         |
| `openclaw matrix verify cancel <id>`       | Скасувати; приймає необов’язкові `--reason <text>` і `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` і `cancel` також приймають `--user-id` і `--room-id` як підказки для продовження в DM, коли верифікація прив’язана до певної кімнати прямих повідомлень.

### Примітки щодо кількох облікових записів

Без `--account <id>` команди Matrix CLI використовують неявний обліковий запис за замовчуванням. Якщо у вас є кілька іменованих облікових записів і не задано `channels.matrix.defaultAccount`, вони не будуть вгадувати й попросять вас вибрати. Коли E2EE вимкнено або недоступне для іменованого облікового запису, помилки вказують на ключ конфігурації цього облікового запису, наприклад `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Поведінка під час запуску">
    Якщо `encryption: true`, значення `startupVerification` за замовчуванням — `"if-unverified"`. Під час запуску неперевірений пристрій запитує self-verification в іншому клієнті Matrix, пропускаючи дублікати й застосовуючи cooldown (24 години за замовчуванням). Налаштуйте через `startupVerificationCooldownHours` або вимкніть за допомогою `startupVerification: "off"`.

    Під час запуску також виконується консервативний bootstrap криптографії, який повторно використовує поточні secret storage і cross-signing identity. Якщо стан bootstrap пошкоджений, OpenClaw намагається виконати захищене відновлення навіть без `channels.matrix.password`; якщо homeserver вимагає password UIA, під час запуску журналюється попередження, але це не є фатальним. Пристрої, уже підписані власником, зберігаються.

    Див. [Міграція Matrix](/uk/channels/matrix-migration), щоб ознайомитися з повним потоком оновлення.

  </Accordion>

  <Accordion title="Сповіщення про верифікацію">
    Matrix публікує сповіщення про життєвий цикл верифікації в сувору DM-кімнату верифікації як повідомлення `m.notice`: запит, готовність (із підказкою «Verify by emoji»), початок/завершення, а також деталі SAS (емодзі/десяткові числа), коли вони доступні.

    Вхідні запити з іншого клієнта Matrix відстежуються й автоматично приймаються. Для self-verification OpenClaw автоматично запускає потік SAS і підтверджує свій бік, щойно стає доступною верифікація за емодзі — вам усе одно потрібно порівняти й підтвердити «They match» у вашому клієнті Matrix.

    Системні сповіщення про верифікацію не пересилаються в pipeline чату агента.

  </Accordion>

  <Accordion title="Видалений або недійсний пристрій Matrix">
    Якщо `verify status` повідомляє, що поточний пристрій більше не значиться на homeserver, створіть новий пристрій Matrix для OpenClaw. Для входу за паролем:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Для автентифікації токеном створіть новий токен доступу у вашому клієнті Matrix або UI адміністратора, а потім оновіть OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Замініть `assistant` на ID облікового запису з команди, що завершилася помилкою, або пропустіть `--account` для облікового запису за замовчуванням.

  </Accordion>

  <Accordion title="Гігієна пристроїв">
    Старі пристрої під керуванням OpenClaw можуть накопичуватися. Переглядайте список і очищайте:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Криптосховище">
    Matrix E2EE використовує офіційний Rust crypto path із `matrix-js-sdk` з `fake-indexeddb` як shim для IndexedDB. Криптографічний стан зберігається в `crypto-idb-snapshot.json` (з обмежувальними правами доступу до файла).

    Зашифрований стан виконання зберігається в `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` і містить sync store, crypto store, recovery key, знімок IDB, прив’язки тредів і стан startup verification. Коли токен змінюється, але identity облікового запису лишається тією самою, OpenClaw повторно використовує найкращий наявний корінь, щоб попередній стан залишався доступним.

  </Accordion>
</AccordionGroup>

## Керування профілем

Оновіть власний профіль Matrix для вибраного облікового запису:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Ви можете передати обидва параметри в одному виклику. Matrix безпосередньо приймає URL аватара `mxc://`; якщо ви передаєте `http://` або `https://`, OpenClaw спочатку завантажує файл, а потім зберігає визначений URL `mxc://` у `channels.matrix.avatarUrl` (або в перевизначенні для конкретного облікового запису).

## Треди

Matrix підтримує нативні треди Matrix як для автоматичних відповідей, так і для надсилання через message-tool. Поведінку контролюють два незалежні параметри:

### Маршрутизація сесій (`sessionScope`)

`dm.sessionScope` визначає, як DM-кімнати Matrix зіставляються із сесіями OpenClaw:

- `"per-user"` (default): усі DM-кімнати з тим самим маршрутизованим співрозмовником використовують одну сесію.
- `"per-room"`: кожна DM-кімната Matrix отримує власний ключ сесії, навіть якщо співрозмовник той самий.

Явні conversation bindings завжди мають пріоритет над `sessionScope`, тому прив’язані кімнати й треди зберігають свою вибрану цільову сесію.

### Потоковість відповідей (`threadReplies`)

`threadReplies` визначає, куди бот публікує свою відповідь:

- `"off"`: відповіді верхнього рівня. Вхідні повідомлення в тредах залишаються в батьківській сесії.
- `"inbound"`: відповідати всередині треду лише тоді, коли вхідне повідомлення вже було в цьому треді.
- `"always"`: відповідати всередині треду, коренем якого є повідомлення-тригер; ця розмова маршрутизується через відповідну сесію з областю треду вже з першого тригера.

`dm.threadReplies` перевизначає це лише для DM — наприклад, можна ізолювати треди в кімнатах, залишивши DM пласкими.

### Успадкування тредів і slash-команди

- Вхідні повідомлення в тредах включають кореневе повідомлення треду як додатковий контекст агента.
- Надсилання через message-tool автоматично успадковує поточний тред Matrix, якщо цілиться в ту саму кімнату (або ту саму ціль DM-користувача), якщо явно не задано `threadId`.
- Повторне використання DM user-target спрацьовує лише тоді, коли метадані поточної сесії підтверджують того самого DM-співрозмовника в тому самому обліковому записі Matrix; інакше OpenClaw повертається до звичайної маршрутизації в межах користувача.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язаний до треду `/acp spawn` працюють у кімнатах Matrix і DM.
- `/focus` верхнього рівня створює новий тред Matrix і прив’язує його до цільової сесії, коли `threadBindings.spawnSubagentSessions: true`.
- Запуск `/focus` або `/acp spawn --thread here` всередині наявного треду Matrix прив’язує цей тред на місці.

Коли OpenClaw виявляє, що DM-кімната Matrix конфліктує з іншою DM-кімнатою в межах тієї самої спільної сесії, він публікує одноразове `m.notice` у цій кімнаті з посиланням на можливість виходу через `/focus` і пропозицією змінити `dm.sessionScope`. Це повідомлення з’являється лише тоді, коли ввімкнено прив’язки тредів.

## Прив’язки розмов ACP

Кімнати Matrix, DM і наявні треди Matrix можна перетворити на постійні робочі простори ACP без зміни поверхні чату.

Швидкий операторський сценарій:

- Виконайте `/acp spawn codex --bind here` у Matrix DM, кімнаті або наявному треді, який ви хочете й надалі використовувати.
- У Matrix DM або кімнаті верхнього рівня поточний DM/кімната лишається поверхнею чату, а майбутні повідомлення маршрутизуються до створеної ACP-сесії.
- Усередині наявного треду Matrix `--bind here` прив’язує цей поточний тред на місці.
- `/new` і `/reset` скидають ту саму прив’язану ACP-сесію на місці.
- `/acp close` закриває ACP-сесію та видаляє прив’язку.

Примітки:

- `--bind here` не створює дочірній тред Matrix.
- `threadBindings.spawnAcpSessions` потрібен лише для `/acp spawn --thread auto|here`, коли OpenClaw має створити або прив’язати дочірній тред Matrix.

### Конфігурація прив’язки тредів

Matrix успадковує глобальні значення за замовчуванням із `session.threadBindings`, а також підтримує перевизначення для каналу:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Прапорці створення з прив’язкою до тредів Matrix є опціональними:

- Установіть `threadBindings.spawnSubagentSessions: true`, щоб дозволити `/focus` верхнього рівня створювати й прив’язувати нові треди Matrix.
- Установіть `threadBindings.spawnAcpSessions: true`, щоб дозволити `/acp spawn --thread auto|here` прив’язувати ACP-сесії до тредів Matrix.

## Реакції

Matrix підтримує вихідні реакції, вхідні сповіщення про реакції та реакції-підтвердження.

Інструментарій вихідних реакцій контролюється параметром `channels.matrix.actions.reactions`:

- `react` додає реакцію до події Matrix.
- `reactions` показує поточне зведення реакцій для події Matrix.
- `emoji=""` видаляє власні реакції бота для цієї події.
- `remove: true` видаляє лише вказану реакцію-емодзі від бота.

**Порядок визначення** (перемагає перше визначене значення):

| Налаштування            | Порядок                                                                         |
| ----------------------- | ------------------------------------------------------------------------------- |
| `ackReaction`           | для облікового запису → канал → `messages.ackReaction` → запасний emoji identity агента |
| `ackReactionScope`      | для облікового запису → канал → `messages.ackReactionScope` → значення за замовчуванням `"group-mentions"` |
| `reactionNotifications` | для облікового запису → канал → значення за замовчуванням `"own"`               |

`reactionNotifications: "own"` пересилає додані події `m.reaction`, коли вони націлені на повідомлення Matrix, створені ботом; `"off"` вимикає системні події реакцій. Видалення реакцій не синтезується в системні події, тому що Matrix показує їх як редагування, а не як окремі видалення `m.reaction`.

## Контекст історії

- `channels.matrix.historyLimit` визначає, скільки останніх повідомлень кімнати включаються як `InboundHistory`, коли повідомлення Matrix у кімнаті запускає агента. Використовує запасне значення `messages.groupChat.historyLimit`; якщо обидва не задані, фактичне значення за замовчуванням — `0`. Установіть `0`, щоб вимкнути.
- Історія кімнати Matrix обмежується лише кімнатою. DM і далі використовують звичайну історію сесії.
- Історія кімнати Matrix працює лише для pending: OpenClaw буферизує повідомлення кімнати, які ще не викликали відповіді, а потім фіксує це вікно, коли надходить згадка чи інший тригер.
- Поточне тригерне повідомлення не включається до `InboundHistory`; воно лишається в основному тілі вхідного повідомлення для цього ходу.
- Повторні спроби тієї самої події Matrix повторно використовують початковий знімок історії, а не зміщуються вперед до новіших повідомлень кімнати.

## Видимість контексту

Matrix підтримує спільний параметр `contextVisibility` для додаткового контексту кімнати, такого як отриманий текст відповіді, корені тредів і відкладена історія.

- `contextVisibility: "all"` — значення за замовчуванням. Додатковий контекст зберігається як отримано.
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників, дозволених активними перевірками allowlist для кімнати/користувача.
- `contextVisibility: "allowlist_quote"` працює як `allowlist`, але все одно зберігає одну явну цитовану відповідь.

Цей параметр впливає на видимість додаткового контексту, а не на те, чи може саме вхідне повідомлення викликати відповідь.
Авторизація тригерів, як і раніше, визначається через налаштування `groupPolicy`, `groups`, `groupAllowFrom` і політики DM.

## Політика DM і кімнат

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
        "!roomid:example.org": { requireMention: true },
      },
    },
  },
}
```

Щоб повністю заглушити DM, залишивши кімнати працювати, установіть `dm.enabled: false`:

```json5
{
  channels: {
    matrix: {
      dm: { enabled: false },
      groupPolicy: "allowlist",
      groupAllowFrom: ["@admin:example.org"],
    },
  },
}
```

Див. [Групи](/uk/channels/groups) для поведінки згадувань і allowlist.

Приклад pairing для Matrix DM:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Якщо непідтверджений користувач Matrix продовжує писати вам до схвалення, OpenClaw повторно використовує той самий pending pairing code і може надіслати відповідь-нагадування після короткого cooldown замість створення нового коду.

Див. [Pairing](/uk/channels/pairing) для спільного потоку pairing у DM і схеми зберігання.

## Відновлення direct room

Якщо стан прямих повідомлень виходить із синхронізації, OpenClaw може отримати застарілі прив’язки `m.direct`, які вказують на старі solo rooms замість актуального DM. Перевірте поточну прив’язку для співрозмовника:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Виправте її:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Обидві команди приймають `--account <id>` для конфігурацій із кількома обліковими записами. Потік відновлення:

- надає перевагу строгому DM 1:1, який уже прив’язано в `m.direct`
- за потреби переходить до будь-якого поточного strict 1:1 DM із цим користувачем
- створює нову direct room і переписує `m.direct`, якщо справного DM не існує

Він не видаляє старі кімнати автоматично. Він вибирає справний DM і оновлює прив’язку так, щоб майбутні надсилання Matrix, сповіщення про верифікацію та інші потоки прямих повідомлень націлювалися на правильну кімнату.

## Підтвердження exec

Matrix може працювати як нативний клієнт підтверджень. Налаштування розміщуються в `channels.matrix.execApprovals` (або в `channels.matrix.accounts.<account>.execApprovals` для перевизначення на рівні облікового запису):

- `enabled`: доставляти підтвердження через нативні підказки Matrix. Якщо не задано або встановлено `"auto"`, Matrix автоматично вмикається, щойно вдається визначити принаймні одного approver. Установіть `false`, щоб явно вимкнути.
- `approvers`: Matrix user ID (`@owner:example.org`), яким дозволено підтверджувати exec-запити. Необов’язково — використовує запасне значення `channels.matrix.dm.allowFrom`.
- `target`: куди надсилати підказки. `"dm"` (за замовчуванням) надсилає в DM approver; `"channel"` надсилає у вихідну кімнату Matrix або DM; `"both"` надсилає в обидва місця.
- `agentFilter` / `sessionFilter`: необов’язкові allowlist для того, які агенти/сесії запускають доставку через Matrix.

Авторизація трохи відрізняється залежно від типу підтвердження:

- **Exec approvals** використовують `execApprovals.approvers`, із запасним значенням `dm.allowFrom`.
- **Plugin approvals** авторизуються лише через `dm.allowFrom`.

Обидва типи використовують спільні shortcut реакцій Matrix та оновлення повідомлень. Approver бачать shortcut реакцій у головному повідомленні підтвердження:

- `✅` дозволити один раз
- `❌` відхилити
- `♾️` дозволити завжди (коли це дозволяє ефективна політика exec)

Запасні slash-команди: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Лише визначені approver можуть дозволяти або відхиляти. Доставка в канал для exec approvals включає текст команди — вмикайте `channel` або `both` лише в довірених кімнатах.

Пов’язано: [Exec approvals](/uk/tools/exec-approvals).

## Slash-команди

Slash-команди (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` тощо) працюють безпосередньо в DM. У кімнатах OpenClaw також розпізнає команди, перед якими стоїть власна згадка Matrix бота, тому `@bot:server /new` запускає шлях команди без кастомного regex для згадок. Це дає змогу боту залишатися чутливим до повідомлень у стилі кімнат `@mention /command`, які Element та подібні клієнти надсилають, коли користувач доповнює ім’я бота через tab перед введенням команди.

Правила авторизації, як і раніше, діють: відправники команд мають відповідати тим самим політикам DM або allowlist/owner для кімнат, що й звичайні повідомлення.

## Кілька облікових записів

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

**Успадкування:**

- Значення верхнього рівня `channels.matrix` працюють як значення за замовчуванням для іменованих облікових записів, якщо обліковий запис не перевизначає їх.
- Щоб обмежити успадкований запис кімнати конкретним обліковим записом, використовуйте `groups.<room>.account`. Записи без `account` спільні для всіх облікових записів; `account: "default"` теж працює, коли обліковий запис за замовчуванням налаштовано на верхньому рівні.

**Вибір облікового запису за замовчуванням:**

- Установіть `defaultAccount`, щоб вибрати іменований обліковий запис, якому надають перевагу неявна маршрутизація, probe і команди CLI.
- Якщо у вас кілька облікових записів і один із них буквально називається `default`, OpenClaw використовує його неявно, навіть якщо `defaultAccount` не задано.
- Якщо у вас кілька іменованих облікових записів і жоден обліковий запис за замовчуванням не вибрано, команди CLI не будуть вгадувати — установіть `defaultAccount` або передайте `--account <id>`.
- Блок верхнього рівня `channels.matrix.*` розглядається як неявний обліковий запис `default`, лише якщо його автентифікація повна (`homeserver` + `accessToken` або `homeserver` + `userId` + `password`). Іменовані облікові записи залишаються доступними через `homeserver` + `userId`, щойно кешовані облікові дані покривають автентифікацію.

**Підвищення:**

- Коли OpenClaw під час відновлення або налаштування переводить конфігурацію з одного облікового запису в кілька, він зберігає наявний іменований обліковий запис, якщо такий існує або `defaultAccount` уже вказує на нього. Лише ключі автентифікації/bootstrap Matrix переміщуються до підвищеного облікового запису; спільні ключі політики доставки залишаються на верхньому рівні.

Див. [Довідник із конфігурації](/uk/gateway/config-channels#multi-account-all-channels) для спільного шаблону кількох облікових записів.

## Приватні/LAN homeserver

За замовчуванням OpenClaw блокує приватні/внутрішні homeserver Matrix для захисту від SSRF, якщо ви
явно не дозволите це окремо для кожного облікового запису.

Якщо ваш homeserver працює на localhost, LAN/Tailscale IP або внутрішньому hostname, увімкніть
`network.dangerouslyAllowPrivateNetwork` для цього облікового запису Matrix:

```json5
{
  channels: {
    matrix: {
      homeserver: "http://matrix-synapse:8008",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
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

Ця згода дозволяє лише довірені приватні/внутрішні цілі. Публічні homeserver без шифрування, як-от
`http://matrix.example.org:8008`, залишаються заблокованими. За можливості віддавайте перевагу `https://`.

## Проксіювання трафіку Matrix

Якщо вашому розгортанню Matrix потрібен явний вихідний HTTP(S)-проксі, задайте `channels.matrix.proxy`:

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

Іменовані облікові записи можуть перевизначати значення верхнього рівня через `channels.matrix.accounts.<id>.proxy`.
OpenClaw використовує той самий параметр проксі для робочого трафіку Matrix і probe стану облікового запису.

## Визначення цілей

Matrix приймає такі форми цілей скрізь, де OpenClaw просить указати ціль кімнати або користувача:

- Користувачі: `@user:server`, `user:@user:server` або `matrix:user:@user:server`
- Кімнати: `!room:server`, `room:!room:server` або `matrix:room:!room:server`
- Аліаси: `#alias:server`, `channel:#alias:server` або `matrix:channel:#alias:server`

ID кімнат Matrix чутливі до регістру. Використовуйте точне написання ID кімнати з Matrix
під час налаштування явних цілей доставки, завдань Cron, прив’язок або allowlist.
OpenClaw зберігає внутрішні ключі сесій у канонічному вигляді для сховища, тому ці
ключі в нижньому регістрі не є надійним джерелом ID доставки Matrix.

Пошук у живому каталозі використовує обліковий запис Matrix, під яким виконано вхід:

- Пошук користувачів звертається до каталогу користувачів Matrix на цьому homeserver.
- Пошук кімнат безпосередньо приймає явні ID кімнат і аліаси, а потім за потреби переходить до пошуку назв приєднаних кімнат для цього облікового запису.
- Пошук назв приєднаних кімнат працює best-effort. Якщо назву кімнати не вдається визначити як ID або аліас, вона ігнорується під час визначення allowlist у runtime.

## Довідник із конфігурації

Поля у стилі allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) приймають повні Matrix user ID (найбезпечніший варіант). Точні збіги каталогу визначаються під час запуску та щоразу, коли allowlist змінюється під час роботи монітора; записи, які неможливо визначити, ігноруються під час виконання. Allowlist кімнат з тієї ж причини надають перевагу ID кімнат або аліасам.

### Обліковий запис і з’єднання

- `enabled`: увімкнути або вимкнути канал.
- `name`: необов’язкова відображувана мітка для облікового запису.
- `defaultAccount`: бажаний ID облікового запису, коли налаштовано кілька облікових записів Matrix.
- `accounts`: іменовані перевизначення для окремих облікових записів. Значення верхнього рівня `channels.matrix` успадковуються як значення за замовчуванням.
- `homeserver`: URL homeserver, наприклад `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: дозволити цьому обліковому запису підключатися до `localhost`, LAN/Tailscale IP або внутрішніх hostname.
- `proxy`: необов’язковий URL HTTP(S)-проксі для трафіку Matrix. Підтримується перевизначення на рівні облікового запису.
- `userId`: повний Matrix user ID (`@bot:example.org`).
- `accessToken`: токен доступу для автентифікації на основі токена. Підтримуються значення відкритим текстом і SecretRef у провайдерах env/file/exec ([Керування секретами](/uk/gateway/secrets)).
- `password`: пароль для входу на основі пароля. Підтримуються значення відкритим текстом і SecretRef.
- `deviceId`: явний Matrix device ID.
- `deviceName`: відображувана назва пристрою, яка використовується під час входу за паролем.
- `avatarUrl`: збережений URL власного аватара для синхронізації профілю й оновлень `profile set`.
- `initialSyncLimit`: максимальна кількість подій, які отримуються під час синхронізації на запуску.

### Шифрування

- `encryption`: увімкнути E2EE. Значення за замовчуванням: `false`.
- `startupVerification`: `"if-unverified"` (значення за замовчуванням, коли E2EE увімкнено) або `"off"`. Автоматично запитує self-verification під час запуску, якщо цей пристрій не верифіковано.
- `startupVerificationCooldownHours`: час cooldown до наступного автоматичного запиту під час запуску. Значення за замовчуванням: `24`.

### Доступ і політика

- `groupPolicy`: `"open"`, `"allowlist"` або `"disabled"`. Значення за замовчуванням: `"allowlist"`.
- `groupAllowFrom`: allowlist user ID для трафіку кімнат.
- `dm.enabled`: якщо `false`, ігнорувати всі DM. Значення за замовчуванням: `true`.
- `dm.policy`: `"pairing"` (за замовчуванням), `"allowlist"`, `"open"` або `"disabled"`. Застосовується після того, як бот уже приєднався й класифікував кімнату як DM; не впливає на обробку запрошень.
- `dm.allowFrom`: allowlist user ID для трафіку DM.
- `dm.sessionScope`: `"per-user"` (за замовчуванням) або `"per-room"`.
- `dm.threadReplies`: перевизначення потоковості відповідей лише для DM (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: приймати повідомлення від інших налаштованих облікових записів ботів Matrix (`true` або `"mentions"`).
- `allowlistOnly`: якщо `true`, примусово змінює всі активні політики DM (крім `"disabled"`) і політики груп `"open"` на `"allowlist"`. Не змінює політики `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"` або `"off"`. Значення за замовчуванням: `"off"`. Застосовується до кожного запрошення Matrix, включно із запрошеннями у стилі DM.
- `autoJoinAllowlist`: кімнати/аліаси, дозволені, коли `autoJoin` має значення `"allowlist"`. Записи аліасів визначаються через homeserver, а не за станом, заявленим запрошеною кімнатою.
- `contextVisibility`: видимість додаткового контексту (`"all"` за замовчуванням, `"allowlist"`, `"allowlist_quote"`).

### Поведінка відповідей

- `replyToMode`: `"off"`, `"first"`, `"all"` або `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` або `"always"`.
- `threadBindings`: перевизначення для каналу для маршрутизації сесій, прив’язаних до тредів, і їх життєвого циклу.
- `streaming`: `"off"` (за замовчуванням), `"partial"`, `"quiet"`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: якщо `true`, завершені блоки асистента зберігаються як окремі повідомлення про прогрес.
- `markdown`: необов’язкова конфігурація рендерингу Markdown для вихідного тексту.
- `responsePrefix`: необов’язковий рядок, який додається перед вихідними відповідями.
- `textChunkLimit`: розмір вихідного фрагмента в символах, коли `chunkMode: "length"`. Значення за замовчуванням: `4000`.
- `chunkMode`: `"length"` (за замовчуванням, розбиває за кількістю символів) або `"newline"` (розбиває за межами рядків).
- `historyLimit`: кількість останніх повідомлень кімнати, що включаються як `InboundHistory`, коли повідомлення в кімнаті запускає агента. Використовує запасне значення `messages.groupChat.historyLimit`; фактичне значення за замовчуванням — `0` (вимкнено).
- `mediaMaxMb`: обмеження розміру медіа в МБ для вихідного надсилання та вхідної обробки.

### Налаштування реакцій

- `ackReaction`: перевизначення ack reaction для цього каналу/облікового запису.
- `ackReactionScope`: перевизначення області (`"group-mentions"` за замовчуванням, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: режим вхідних сповіщень про реакції (`"own"` за замовчуванням, `"off"`).

### Інструменти та перевизначення для кімнат

- `actions`: керування доступом до інструментів для окремих дій (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: карта політик для окремих кімнат. Ідентичність сесії після визначення використовує стабільний ID кімнати. (`rooms` — застарілий псевдонім.)
  - `groups.<room>.account`: обмежити один успадкований запис кімнати конкретним обліковим записом.
  - `groups.<room>.allowBots`: перевизначення параметра рівня каналу для окремої кімнати (`true` або `"mentions"`).
  - `groups.<room>.users`: allowlist відправників для окремої кімнати.
  - `groups.<room>.tools`: перевизначення дозволу/заборони інструментів для окремої кімнати.
  - `groups.<room>.autoReply`: перевизначення вимоги згадування для окремої кімнати. `true` вимикає вимоги згадування для цієї кімнати; `false` знову примусово вмикає їх.
  - `groups.<room>.skills`: фільтр Skills для окремої кімнати.
  - `groups.<room>.systemPrompt`: фрагмент system prompt для окремої кімнати.

### Налаштування підтвердження exec

- `execApprovals.enabled`: доставляти exec approvals через нативні підказки Matrix.
- `execApprovals.approvers`: Matrix user ID, яким дозволено підтверджувати. Використовує запасне значення `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (за замовчуванням), `"channel"` або `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: необов’язкові allowlist агентів/сесій для доставки.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та керування згадуваннями
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
