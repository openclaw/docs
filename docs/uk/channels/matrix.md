---
read_when:
    - Налаштування Matrix в OpenClaw
    - Налаштування E2EE та верифікації Matrix
summary: Статус підтримки Matrix, налаштування та приклади конфігурації
title: Matrix
x-i18n:
    generated_at: "2026-04-27T18:55:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: adfd82ef371046cd537455db77285ab27e3a09f7e589a773c5e12bc766d25512
    source_path: channels/matrix.md
    workflow: 15
---

Matrix — це вбудований channel plugin для OpenClaw.
Він використовує офіційний `matrix-js-sdk` і підтримує DM, кімнати, треди, медіа, реакції, опитування, геолокацію та E2EE.

## Вбудований plugin

Поточні пакетовані релізи OpenClaw постачаються з plugin Matrix у комплекті. Вам не потрібно нічого встановлювати; його активує налаштування `channels.matrix.*` (див. [Налаштування](#setup)).

Для старіших збірок або кастомних інсталяцій без Matrix спочатку встановіть його вручну:

```bash
openclaw plugins install @openclaw/matrix
# або з локального checkout
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` реєструє та вмикає plugin, тому окремий крок `openclaw plugins enable matrix` не потрібен. Однак plugin усе одно нічого не робить, доки ви не налаштуєте канал нижче. Загальну поведінку plugin і правила встановлення див. у [Plugins](/uk/tools/plugin).

## Налаштування

1. Створіть обліковий запис Matrix на вашому homeserver.
2. Налаштуйте `channels.matrix`, використовуючи або `homeserver` + `accessToken`, або `homeserver` + `userId` + `password`.
3. Перезапустіть Gateway.
4. Почніть DM із ботом або запросіть його до кімнати (див. [автоприєднання](#auto-join) — нові запрошення спрацьовують лише тоді, коли це дозволяє `autoJoin`).

### Інтерактивне налаштування

```bash
openclaw channels add
openclaw configure --section channels
```

Майстер запитує: URL homeserver, метод автентифікації (токен доступу або пароль), ID користувача (лише для автентифікації паролем), необов’язкову назву пристрою, чи вмикати E2EE, і чи налаштовувати доступ до кімнат та автоприєднання.

Якщо відповідні змінні середовища `MATRIX_*` уже існують і для вибраного облікового запису немає збереженої автентифікації, майстер запропонує скористатися змінними середовища. Щоб визначити імена кімнат перед збереженням allowlist, виконайте `openclaw channels resolve --channel matrix "Project Room"`. Якщо E2EE увімкнено, майстер записує конфігурацію та запускає той самий bootstrap, що й [`openclaw matrix encryption setup`](#encryption-and-verification).

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

`channels.matrix.autoJoin` за замовчуванням має значення `off`. За цього стандартного значення бот не з’являтиметься в нових кімнатах або DM із нових запрошень, доки ви не приєднаєтеся вручну.

OpenClaw не може визначити під час запрошення, чи є запрошена кімната DM чи групою, тому всі запрошення — включно із запрошеннями у стилі DM — спочатку проходять через `autoJoin`. `dm.policy` застосовується лише пізніше, після того як бот приєднався, а кімната була класифікована.

<Warning>
Установіть `autoJoin: "allowlist"` разом із `autoJoinAllowlist`, щоб обмежити, які запрошення бот приймає, або `autoJoin: "always"`, щоб приймати кожне запрошення.

`autoJoinAllowlist` приймає лише стабільні цілі: `!roomId:server`, `#alias:server` або `*`. Звичайні назви кімнат відхиляються; записи alias зіставляються через homeserver, а не через стан, заявлений запрошеною кімнатою.
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

Щоб приймати всі запрошення, використовуйте `autoJoin: "always"`.

### Формати цілей allowlist

Allowlist для DM і кімнат найкраще заповнювати стабільними ID:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): використовуйте `@user:server`. Відображувані імена визначаються лише тоді, коли каталог homeserver повертає рівно один збіг.
- Кімнати (`groups`, `autoJoinAllowlist`): використовуйте `!room:server` або `#alias:server`. Імена зіставляються best-effort із приєднаними кімнатами; записи, які не вдалося зіставити, ігноруються під час виконання.

### Нормалізація ID облікового запису

Майстер перетворює зрозумілу назву на нормалізований ID облікового запису. Наприклад, `Ops Bot` стає `ops-bot`. Пунктуація екранується в scoped-іменах змінних середовища, щоб два облікові записи не конфліктували: `-` → `_X2D_`, тому `ops-prod` відповідає `MATRIX_OPS_X2D_PROD_*`.

### Кешовані облікові дані

Matrix зберігає кешовані облікові дані в `~/.openclaw/credentials/matrix/`:

- обліковий запис за замовчуванням: `credentials.json`
- іменовані облікові записи: `credentials-<account>.json`

Якщо там існують кешовані облікові дані, OpenClaw вважає Matrix налаштованим, навіть якщо токена доступу немає у файлі конфігурації — це охоплює налаштування, `openclaw doctor` і перевірки статусу каналу.

### Змінні середовища

Використовуються, коли еквівалентний ключ конфігурації не задано. Для облікового запису за замовчуванням використовуються імена без префікса; для іменованих облікових записів перед суфіксом вставляється ID облікового запису.

| Обліковий запис за замовчуванням | Іменований обліковий запис (`<ID>` — це нормалізований ID облікового запису) |
| ------------------------------- | ----------------------------------------------------------------------------- |
| `MATRIX_HOMESERVER`             | `MATRIX_<ID>_HOMESERVER`                                                      |
| `MATRIX_ACCESS_TOKEN`           | `MATRIX_<ID>_ACCESS_TOKEN`                                                    |
| `MATRIX_USER_ID`                | `MATRIX_<ID>_USER_ID`                                                         |
| `MATRIX_PASSWORD`               | `MATRIX_<ID>_PASSWORD`                                                        |
| `MATRIX_DEVICE_ID`              | `MATRIX_<ID>_DEVICE_ID`                                                       |
| `MATRIX_DEVICE_NAME`            | `MATRIX_<ID>_DEVICE_NAME`                                                     |
| `MATRIX_RECOVERY_KEY`           | `MATRIX_<ID>_RECOVERY_KEY`                                                    |

Для облікового запису `ops` назви стають `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` і так далі. Змінні середовища recovery key зчитуються recovery-aware потоками CLI (`verify backup restore`, `verify device`, `verify bootstrap`), коли ви передаєте ключ через `--recovery-key-stdin`.

`MATRIX_HOMESERVER` не можна задати з робочого `.env`; див. [Файли `.env` робочого простору](/uk/gateway/security).

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

Потокова передача відповідей Matrix opt-in. `streaming` визначає, як OpenClaw доставляє відповідь асистента в процесі генерації; `blockStreaming` визначає, чи зберігається кожен завершений блок як окреме повідомлення Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

| `streaming`       | Поведінка                                                                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (типово)  | Дочекатися повної відповіді та надіслати один раз. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                          |
| `"partial"`       | Редагувати одне звичайне текстове повідомлення на місці, поки модель записує поточний блок. Стандартні клієнти Matrix можуть сповістити про перший попередній перегляд, а не про фінальне редагування. |
| `"quiet"`         | Те саме, що й `"partial"`, але повідомлення є notice без сповіщення. Одержувачі отримають сповіщення лише тоді, коли правилу push для користувача відповідатиме фіналізоване редагування (див. нижче). |

`blockStreaming` не залежить від `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (типово)                    |
| ----------------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| `"partial"` / `"quiet"` | Жива чернетка для поточного блоку, завершені блоки зберігаються як повідомлення | Жива чернетка для поточного блоку, фіналізується на місці |
| `"off"`                 | Одне повідомлення Matrix зі сповіщенням на кожен завершений блок    | Одне повідомлення Matrix зі сповіщенням для всієї відповіді |

Примітки:

- Якщо попередній перегляд перевищує ліміт Matrix на розмір однієї події, OpenClaw припиняє потоковий попередній перегляд і переходить до доставки лише фінальної відповіді.
- Медіавідповіді завжди надсилають вкладення звичайним способом. Якщо застарілий попередній перегляд більше не можна безпечно повторно використати, OpenClaw редагує його перед надсиланням фінальної медіавідповіді.
- Редагування попереднього перегляду потребує додаткових викликів API Matrix. Залиште `streaming: "off"`, якщо хочете найконсервативніший профіль обмеження частоти запитів.

## Метадані схвалення

Власні запити на схвалення Matrix — це звичайні події `m.room.message` із OpenClaw-специфічним вмістом кастомної події в `com.openclaw.approval`. Matrix дозволяє кастомні ключі у вмісті подій, тому стандартні клієнти все одно відображають текст повідомлення, а клієнти з підтримкою OpenClaw можуть читати структурований ID схвалення, тип, стан, доступні рішення та деталі exec/plugin.

Коли запит на схвалення надто довгий для однієї події Matrix, OpenClaw розбиває видимий текст на частини й додає `com.openclaw.approval` лише до першої частини. Реакції для рішень allow/deny прив’язуються до цієї першої події, тому довгі запити мають ту саму ціль схвалення, що й запити з однією подією.

### Self-hosted правила push для тихих фіналізованих попередніх переглядів

`streaming: "quiet"` сповіщає одержувачів лише після того, як блок або хід буде фіналізовано — правило push для користувача має відповідати маркеру фіналізованого попереднього перегляду. Повний рецепт див. у [Правила push Matrix для тихих попередніх переглядів](/uk/channels/matrix-push-rules) (токен одержувача, перевірка pusher, установлення правила, примітки для окремих homeserver).

## Кімнати бот-до-бота

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

- `allowBots: true` приймає повідомлення від інших налаштованих бот-акаунтів Matrix у дозволених кімнатах і DM.
- `allowBots: "mentions"` приймає такі повідомлення лише тоді, коли вони явно згадують цього бота в кімнатах. DM усе одно дозволені.
- `groups.<room>.allowBots` перевизначає налаштування рівня облікового запису для однієї кімнати.
- OpenClaw однаково ігнорує повідомлення від того самого ID користувача Matrix, щоб уникнути циклів самовідповідей.
- Matrix тут не надає власного прапорця бота; OpenClaw трактує "bot-authored" як "надіслане іншим налаштованим обліковим записом Matrix на цьому Gateway OpenClaw".

Увімкнюючи трафік бот-до-бота в спільних кімнатах, використовуйте суворі allowlist кімнат і вимоги до згадувань.

## Шифрування та верифікація

У зашифрованих кімнатах (E2EE) вихідні події зображень використовують `thumbnail_file`, тому попередні перегляди зображень шифруються разом із повним вкладенням. Незашифровані кімнати, як і раніше, використовують звичайний `thumbnail_url`. Нічого налаштовувати не потрібно — plugin автоматично визначає стан E2EE.

Усі команди `openclaw matrix` підтримують `--verbose` (повна діагностика), `--json` (машиночитаний вивід) і `--account <id>` (багатооблікові конфігурації). За замовчуванням вивід стислий, а внутрішнє логування SDK — тихе. У прикладах нижче показано канонічну форму; за потреби додавайте прапорці.

### Увімкнення шифрування

```bash
openclaw matrix encryption setup
```

Виконує bootstrap secret storage і cross-signing, за потреби створює резервну копію ключів кімнат, а потім виводить статус і наступні кроки. Корисні прапорці:

- `--recovery-key <key>` застосувати recovery key перед bootstrap (бажано використовувати форму через stdin, задокументовану нижче)
- `--force-reset-cross-signing` відкинути поточну identity cross-signing і створити нову (використовуйте лише свідомо)

Для нового облікового запису увімкніть E2EE під час створення:

```bash
openclaw matrix account add \
  --homeserver https://matrix.example.org \
  --access-token syt_xxx \
  --enable-e2ee
```

`--encryption` — це псевдонім для `--enable-e2ee`.

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

- `Locally trusted`: довірено лише цим клієнтом
- `Cross-signing verified`: SDK повідомляє про верифікацію через cross-signing
- `Signed by owner`: підписано вашим власним self-signing key (лише для діагностики)

`Verified by owner` стає `yes` лише тоді, коли `Cross-signing verified` має значення `yes`. Локальної довіри або лише підпису owner недостатньо.

`--allow-degraded-local-state` повертає best-effort діагностику без попередньої підготовки облікового запису Matrix; корисно для офлайн- або частково налаштованих перевірок.

### Верифікація цього пристрою за допомогою recovery key

Recovery key є чутливим — передавайте його через stdin замість командного рядка. Установіть `MATRIX_RECOVERY_KEY` (або `MATRIX_<ID>_RECOVERY_KEY` для іменованого облікового запису):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Команда повідомляє про три стани:

- `Recovery key accepted`: Matrix прийняв ключ для secret storage або довіри до пристрою.
- `Backup usable`: резервну копію ключів кімнат можна завантажити за допомогою довіреного recovery material.
- `Device verified by owner`: цей пристрій має повну довіру до identity Matrix cross-signing.

Вона завершується з ненульовим кодом, якщо повна довіра до identity не завершена, навіть якщо recovery key розблокував матеріал резервної копії. У такому разі завершіть self-verification з іншого клієнта Matrix:

```bash
openclaw matrix verify self
```

`verify self` очікує на `Cross-signing verified: yes`, перш ніж успішно завершитися. Використовуйте `--timeout-ms <ms>`, щоб налаштувати очікування.

Форма з буквальним ключем `openclaw matrix verify device "<recovery-key>"` також підтримується, але ключ потрапить в історію shell.

### Bootstrap або відновлення cross-signing

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` — це команда відновлення та налаштування для зашифрованих облікових записів. Послідовно вона:

- виконує bootstrap secret storage, повторно використовуючи наявний recovery key, коли це можливо
- виконує bootstrap cross-signing і завантажує відсутні публічні ключі
- позначає та cross-signs поточний пристрій
- створює серверну резервну копію ключів кімнат, якщо її ще не існує

Якщо homeserver вимагає UIA для завантаження ключів cross-signing, OpenClaw спочатку пробує без автентифікації, потім `m.login.dummy`, потім `m.login.password` (потребує `channels.matrix.password`).

Корисні прапорці:

- `--recovery-key-stdin` (у парі з `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) або `--recovery-key <key>`
- `--force-reset-cross-signing`, щоб відкинути поточну identity cross-signing (лише свідомо)

### Резервне копіювання ключів кімнат

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` показує, чи існує серверна резервна копія і чи може цей пристрій її розшифрувати. `backup restore` імпортує резервні ключі кімнат у локальне crypto store; якщо recovery key уже збережено на диску, можна не вказувати `--recovery-key-stdin`.

Щоб замінити зламану резервну копію новою базовою копією (допускає втрату старої історії, яку неможливо відновити; також може заново створити secret storage, якщо поточний секрет резервної копії неможливо завантажити):

```bash
openclaw matrix verify backup reset --yes
```

Додавайте `--rotate-recovery-key` лише тоді, коли свідомо хочете, щоб попередній recovery key більше не розблоковував нову базову резервну копію.

### Перелік, запит і відповіді на верифікації

```bash
openclaw matrix verify list
```

Показує список очікуваних запитів на верифікацію для вибраного облікового запису.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Надсилає запит на верифікацію з цього облікового запису OpenClaw. `--own-user` запитує self-verification (ви приймаєте запит в іншому клієнті Matrix того самого користувача); `--user-id`/`--device-id`/`--room-id` націлюються на когось іншого. `--own-user` не можна поєднувати з іншими прапорцями націлювання.

Для обробки lifecycle на нижчому рівні — зазвичай коли ви відстежуєте вхідні запити з іншого клієнта — ці команди працюють із конкретним запитом `<id>` (виводиться командами `verify list` і `verify request`):

| Команда                                    | Призначення                                                        |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `openclaw matrix verify accept <id>`       | Прийняти вхідний запит                                             |
| `openclaw matrix verify start <id>`        | Запустити SAS flow                                                 |
| `openclaw matrix verify sas <id>`          | Вивести SAS emoji або десяткові числа                              |
| `openclaw matrix verify confirm-sas <id>`  | Підтвердити, що SAS збігається з тим, що показує інший клієнт      |
| `openclaw matrix verify mismatch-sas <id>` | Відхилити SAS, якщо emoji або десяткові числа не збігаються        |
| `openclaw matrix verify cancel <id>`       | Скасувати; приймає необов’язкові `--reason <text>` і `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` і `cancel` також приймають `--user-id` і `--room-id` як підказки для подальших дій у DM, коли верифікація прив’язана до конкретної кімнати прямого повідомлення.

### Примітки щодо кількох облікових записів

Без `--account <id>` команди Matrix CLI використовують неявний обліковий запис за замовчуванням. Якщо у вас кілька іменованих облікових записів і не задано `channels.matrix.defaultAccount`, вони не намагатимуться вгадувати й попросять вас вибрати. Коли E2EE вимкнено або недоступне для іменованого облікового запису, помилки вказують на ключ конфігурації цього облікового запису, наприклад `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Поведінка під час запуску">
    Із `encryption: true` значення `startupVerification` за замовчуванням — `"if-unverified"`. Під час запуску неперевірений пристрій запитує self-verification в іншому клієнті Matrix, пропускаючи дублікати й застосовуючи cooldown (24 години за замовчуванням). Налаштуйте через `startupVerificationCooldownHours` або вимкніть через `startupVerification: "off"`.

    Під час запуску також виконується консервативний прохід bootstrap crypto, який повторно використовує поточні secret storage та identity cross-signing. Якщо стан bootstrap зламано, OpenClaw намагається виконати захищене відновлення навіть без `channels.matrix.password`; якщо homeserver вимагає password UIA, під час запуску записується попередження, але це не є фатальною помилкою. Пристрої, уже підписані owner, зберігаються.

    Повний процес оновлення див. у [Міграція Matrix](/uk/channels/matrix-migration).

  </Accordion>

  <Accordion title="Сповіщення про верифікацію">
    Matrix публікує сповіщення lifecycle верифікації у строгій DM-кімнаті верифікації як повідомлення `m.notice`: запит, готовність (із підказкою "Verify by emoji"), початок/завершення та деталі SAS (emoji/десяткові числа), коли доступні.

    Вхідні запити з іншого клієнта Matrix відстежуються та автоматично приймаються. Для self-verification OpenClaw автоматично запускає SAS flow і підтверджує свій бік, щойно стає доступною верифікація emoji — вам усе одно потрібно порівняти й підтвердити "They match" у вашому клієнті Matrix.

    Системні сповіщення про верифікацію не пересилаються в pipeline чату агента.

  </Accordion>

  <Accordion title="Видалений або недійсний пристрій Matrix">
    Якщо `verify status` повідомляє, що поточний пристрій більше не відображається на homeserver, створіть новий пристрій OpenClaw Matrix. Для входу за паролем:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Для автентифікації токеном створіть новий access token у вашому клієнті Matrix або admin UI, а потім оновіть OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Замініть `assistant` на ID облікового запису з команди, що завершилася помилкою, або не вказуйте `--account` для облікового запису за замовчуванням.

  </Accordion>

  <Accordion title="Гігієна пристроїв">
    Старі пристрої, якими керує OpenClaw, можуть накопичуватися. Перегляд і очищення:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE використовує офіційний шлях Rust crypto з `matrix-js-sdk` із `fake-indexeddb` як shim для IndexedDB. Стан crypto зберігається в `crypto-idb-snapshot.json` (із обмежувальними правами доступу до файлу).

    Зашифрований стан виконання зберігається в `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` і містить sync store, crypto store, recovery key, IDB snapshot, thread bindings і стан startup verification. Коли токен змінюється, але identity облікового запису залишається тією самою, OpenClaw повторно використовує найкращий наявний root, щоб попередній стан залишався доступним.

  </Accordion>
</AccordionGroup>

## Керування профілем

Оновіть self-profile Matrix для вибраного облікового запису:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Ви можете передати обидва параметри одним викликом. Matrix безпосередньо приймає URL аватарів `mxc://`; якщо ви передаєте `http://` або `https://`, OpenClaw спочатку завантажує файл і зберігає визначений URL `mxc://` у `channels.matrix.avatarUrl` (або в перевизначенні для конкретного облікового запису).

## Треди

Matrix підтримує нативні треди Matrix як для автоматичних відповідей, так і для надсилань через message-tool. Поведінку керують два незалежні параметри:

### Маршрутизація сесій (`sessionScope`)

`dm.sessionScope` визначає, як DM-кімнати Matrix відображаються на сесії OpenClaw:

- `"per-user"` (типово): усі DM-кімнати з тим самим маршрутизованим співрозмовником спільно використовують одну сесію.
- `"per-room"`: кожна DM-кімната Matrix отримує власний ключ сесії, навіть якщо співрозмовник той самий.

Явні прив’язки розмов завжди мають пріоритет над `sessionScope`, тому прив’язані кімнати й треди зберігають вибрану цільову сесію.

### Тредування відповідей (`threadReplies`)

`threadReplies` визначає, куди бот публікує свою відповідь:

- `"off"`: відповіді верхнього рівня. Вхідні повідомлення в тредах залишаються на батьківській сесії.
- `"inbound"`: відповідати всередині треду лише тоді, коли вхідне повідомлення вже було в цьому треді.
- `"always"`: відповідати всередині треду, коренем якого є повідомлення-тригер; така розмова маршрутизується через відповідну thread-scoped сесію з першого тригера й далі.

`dm.threadReplies` перевизначає це лише для DM — наприклад, щоб ізолювати треди в кімнатах, але зберегти DM пласкими.

### Успадкування тредів і slash commands

- Вхідні повідомлення в тредах включають кореневе повідомлення треду як додатковий контекст агента.
- Надсилання через message-tool автоматично успадковують поточний тред Matrix, якщо ціль — та сама кімната (або той самий DM-користувач), якщо не вказано явний `threadId`.
- Повторне використання DM user-target спрацьовує лише тоді, коли метадані поточної сесії підтверджують того самого DM-співрозмовника в тому самому обліковому записі Matrix; інакше OpenClaw повертається до звичайної маршрутизації в межах користувача.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язаний до треду `/acp spawn` працюють у кімнатах Matrix і DM.
- `/focus` верхнього рівня створює новий тред Matrix і прив’язує його до цільової сесії, коли `threadBindings.spawnSubagentSessions: true`.
- Виконання `/focus` або `/acp spawn --thread here` всередині наявного треду Matrix прив’язує цей тред на місці.

Коли OpenClaw виявляє, що DM-кімната Matrix конфліктує з іншою DM-кімнатою в межах тієї самої спільної сесії, він публікує одноразове `m.notice` у цій кімнаті з вказівкою на можливість виходу через `/focus` і пропозицією змінити `dm.sessionScope`. Повідомлення з’являється лише тоді, коли увімкнені прив’язки тредів.

## ACP-прив’язки розмов

Кімнати Matrix, DM і наявні треди Matrix можна перетворити на постійні робочі простори ACP без зміни поверхні чату.

Швидкий операторський сценарій:

- Виконайте `/acp spawn codex --bind here` у Matrix DM, кімнаті або наявному треді, яким ви хочете й надалі користуватися.
- У Matrix DM або кімнаті верхнього рівня поточний DM/кімната залишається поверхнею чату, а майбутні повідомлення маршрутизуються до створеної ACP-сесії.
- Усередині наявного треду Matrix `--bind here` прив’язує поточний тред на місці.
- `/new` і `/reset` скидають ту саму прив’язану ACP-сесію на місці.
- `/acp close` закриває ACP-сесію та видаляє прив’язку.

Примітки:

- `--bind here` не створює дочірній тред Matrix.
- `threadBindings.spawnAcpSessions` потрібен лише для `/acp spawn --thread auto|here`, коли OpenClaw має створити або прив’язати дочірній тред Matrix.

### Конфігурація прив’язки тредів

Matrix успадковує глобальні значення за замовчуванням із `session.threadBindings`, а також підтримує перевизначення для окремого каналу:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Прапорці запуску з прив’язкою до треду Matrix вмикаються опційно:

- Установіть `threadBindings.spawnSubagentSessions: true`, щоб дозволити `/focus` верхнього рівня створювати й прив’язувати нові треди Matrix.
- Установіть `threadBindings.spawnAcpSessions: true`, щоб дозволити `/acp spawn --thread auto|here` прив’язувати ACP-сесії до тредів Matrix.

## Реакції

Matrix підтримує вихідні реакції, вхідні сповіщення про реакції та реакції-підтвердження.

Інструменти вихідних реакцій контролюються через `channels.matrix.actions.reactions`:

- `react` додає реакцію до події Matrix.
- `reactions` показує поточний підсумок реакцій для події Matrix.
- `emoji=""` видаляє власні реакції бота на цю подію.
- `remove: true` видаляє лише вказану emoji-реакцію від бота.

**Порядок визначення** (перемагає перше задане значення):

| Налаштування            | Порядок                                                                          |
| ----------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`           | для облікового запису → каналу → `messages.ackReaction` → fallback на emoji identity агента |
| `ackReactionScope`      | для облікового запису → каналу → `messages.ackReactionScope` → типове `"group-mentions"` |
| `reactionNotifications` | для облікового запису → каналу → типове `"own"`                                  |

`reactionNotifications: "own"` пересилає додані події `m.reaction`, коли вони націлені на повідомлення Matrix, створені ботом; `"off"` вимикає системні події реакцій. Видалення реакцій не синтезується в системні події, тому що Matrix показує їх як редагування, а не як окреме видалення `m.reaction`.

## Контекст історії

- `channels.matrix.historyLimit` визначає, скільки нещодавніх повідомлень кімнати включати як `InboundHistory`, коли повідомлення кімнати Matrix запускає агента. Використовує fallback на `messages.groupChat.historyLimit`; якщо обидва не задані, ефективне значення за замовчуванням — `0`. Установіть `0`, щоб вимкнути.
- Історія кімнати Matrix стосується лише кімнати. DM і далі використовують звичайну історію сесії.
- Історія кімнати Matrix є лише pending: OpenClaw буферизує повідомлення кімнати, які ще не запустили відповідь, а потім фіксує це вікно, коли надходить згадка або інший тригер.
- Поточне повідомлення-тригер не включається до `InboundHistory`; воно залишається в основному вхідному тілі для цього ходу.
- Повторні спроби для тієї самої події Matrix повторно використовують початковий snapshot історії замість зсуву вперед до новіших повідомлень кімнати.

## Видимість контексту

Matrix підтримує спільний параметр `contextVisibility` для додаткового контексту кімнати, такого як отриманий текст відповіді, корені тредів і pending history.

- `contextVisibility: "all"` — значення за замовчуванням. Додатковий контекст зберігається як отримано.
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників, дозволених активними перевірками allowlist кімнати/користувача.
- `contextVisibility: "allowlist_quote"` працює як `allowlist`, але все одно зберігає одну явну цитовану відповідь.

Це налаштування впливає на видимість додаткового контексту, а не на те, чи саме вхідне повідомлення може запускати відповідь.
Авторизація тригера, як і раніше, визначається через `groupPolicy`, `groups`, `groupAllowFrom` і налаштування політики DM.

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

Щоб повністю заглушити DM, але зберегти роботу кімнат, установіть `dm.enabled: false`:

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

Поведінку згадок і allowlist див. у [Групи](/uk/channels/groups).

Приклад pairing для Matrix DM:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Якщо непідтверджений користувач Matrix продовжує писати вам до схвалення, OpenClaw повторно використовує той самий pending pairing code і може надіслати відповідь-нагадування після короткого cooldown замість створення нового коду.

Спільний процес pairing для DM і структуру зберігання див. у [Pairing](/uk/channels/pairing).

## Відновлення direct-кімнати

Якщо стан direct-message виходить із синхронізації, OpenClaw може залишитися зі застарілими зіставленнями `m.direct`, які вказують на старі solo-кімнати замість актуального DM. Перегляньте поточне зіставлення для співрозмовника:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Відновіть його:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Обидві команди приймають `--account <id>` для багатооблікових конфігурацій. Процес відновлення:

- надає перевагу строгому 1:1 DM, який уже зіставлений у `m.direct`
- у разі потреби переходить до будь-якого поточного strict 1:1 DM із цим користувачем
- створює нову direct-кімнату та переписує `m.direct`, якщо здорового DM не існує

Він не видаляє старі кімнати автоматично. Він вибирає здоровий DM і оновлює зіставлення, щоб майбутні надсилання Matrix, сповіщення про верифікацію та інші direct-message потоки націлювалися на правильну кімнату.

## Погодження exec

Matrix може виступати нативним клієнтом погодження. Налаштування виконується через `channels.matrix.execApprovals` (або `channels.matrix.accounts.<account>.execApprovals` для перевизначення на рівні облікового запису):

- `enabled`: доставляти погодження через нативні запити Matrix. Якщо не задано або має значення `"auto"`, Matrix автоматично вмикається, щойно вдається визначити хоча б одного погоджувача. Установіть `false`, щоб явно вимкнути.
- `approvers`: ID користувачів Matrix (`@owner:example.org`), яким дозволено погоджувати exec-запити. Необов’язково — використовує fallback на `channels.matrix.dm.allowFrom`.
- `target`: куди надсилаються запити. `"dm"` (типово) надсилає в DM погоджувачів; `"channel"` надсилає у вихідну кімнату або DM Matrix; `"both"` надсилає в обидва місця.
- `agentFilter` / `sessionFilter`: необов’язкові allowlist для агентів/сесій, які запускають доставку через Matrix.

Авторизація трохи відрізняється залежно від типу погодження:

- **Exec approvals** використовують `execApprovals.approvers`, із fallback на `dm.allowFrom`.
- **Plugin approvals** авторизуються лише через `dm.allowFrom`.

Обидва типи використовують спільні скорочення реакцій Matrix і оновлення повідомлень. Погоджувачі бачать скорочення реакцій на основному повідомленні погодження:

- `✅` дозволити один раз
- `❌` відхилити
- `♾️` дозволити завжди (коли це дозволяє ефективна політика exec)

Резервні slash commands: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Лише визначені погоджувачі можуть схвалювати або відхиляти. Доставка exec approvals у канал містить текст команди — вмикайте `channel` або `both` лише в довірених кімнатах.

Пов’язане: [Exec approvals](/uk/tools/exec-approvals).

## Slash commands

Slash commands (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` тощо) працюють безпосередньо в DM. У кімнатах OpenClaw також розпізнає команди з префіксом власної згадки Matrix бота, тому `@bot:server /new` запускає шлях команди без спеціального regex для згадки. Це дає змогу боту реагувати на повідомлення у стилі кімнати `@mention /command`, які Element та подібні клієнти надсилають, коли користувач автодоповнює бота перед введенням команди.

Правила авторизації все одно застосовуються: відправники команд мають відповідати тим самим політикам allowlist/owner для DM або кімнат, що й для звичайних повідомлень.

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

- Значення верхнього рівня `channels.matrix` працюють як значення за замовчуванням для іменованих облікових записів, якщо обліковий запис не має власного перевизначення.
- Щоб прив’язати успадкований запис кімнати до конкретного облікового запису, використовуйте `groups.<room>.account`. Записи без `account` спільні для всіх облікових записів; `account: "default"` і далі працює, коли обліковий запис за замовчуванням налаштований на верхньому рівні.

**Вибір облікового запису за замовчуванням:**

- Установіть `defaultAccount`, щоб вибрати іменований обліковий запис, якому надають перевагу неявна маршрутизація, перевірки та команди CLI.
- Якщо у вас кілька облікових записів і один із них буквально має назву `default`, OpenClaw використовує його неявно, навіть якщо `defaultAccount` не задано.
- Якщо у вас кілька іменованих облікових записів і жоден не вибрано за замовчуванням, команди CLI не намагатимуться вгадувати — установіть `defaultAccount` або передайте `--account <id>`.
- Блок верхнього рівня `channels.matrix.*` розглядається як неявний обліковий запис `default`, лише якщо його автентифікацію завершено (`homeserver` + `accessToken` або `homeserver` + `userId` + `password`). Іменовані облікові записи залишаються доступними через `homeserver` + `userId`, якщо автентифікацію покривають кешовані облікові дані.

**Підвищення:**

- Коли OpenClaw під час відновлення або налаштування переводить однооблікову конфігурацію в багатооблікову, він зберігає наявний іменований обліковий запис, якщо такий існує або `defaultAccount` уже вказує на нього. У promoted account переміщуються лише ключі автентифікації/bootstrap Matrix; спільні ключі політики доставки залишаються на верхньому рівні.

Спільний шаблон багатообліковості див. у [Довідник з конфігурації](/uk/gateway/config-channels#multi-account-all-channels).

## Приватні/LAN homeserver

За замовчуванням OpenClaw блокує приватні/внутрішні homeserver Matrix для захисту від SSRF, якщо ви
явно не ввімкнете це окремо для кожного облікового запису.

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

Це opt-in дозволяє лише довірені приватні/внутрішні цілі. Публічні незашифровані homeserver, такі як
`http://matrix.example.org:8008`, і надалі блокуються. За можливості віддавайте перевагу `https://`.

## Проксіювання трафіку Matrix

Якщо вашому розгортанню Matrix потрібен явний вихідний HTTP(S)-proxy, задайте `channels.matrix.proxy`:

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
OpenClaw використовує те саме налаштування proxy як для робочого трафіку Matrix, так і для перевірок статусу облікового запису.

## Визначення цілей

Matrix приймає такі формати цілей усюди, де OpenClaw просить вас вказати кімнату або користувача:

- Користувачі: `@user:server`, `user:@user:server` або `matrix:user:@user:server`
- Кімнати: `!room:server`, `room:!room:server` або `matrix:room:!room:server`
- Alias: `#alias:server`, `channel:#alias:server` або `matrix:channel:#alias:server`

ID кімнат Matrix чутливі до регістру. Використовуйте точний регістр ID кімнати з Matrix
під час налаштування явних цілей доставки, Cron jobs, прив’язок або allowlist.
OpenClaw зберігає внутрішні ключі сесій у канонічному вигляді для зберігання, тому ці ключі
в нижньому регістрі не є надійним джерелом ID доставки Matrix.

Живий пошук у каталозі використовує вхідний обліковий запис Matrix:

- Пошук користувачів виконує запити до каталогу користувачів Matrix на цьому homeserver.
- Пошук кімнат напряму приймає явні ID кімнат і alias, а потім, у разі потреби, шукає за назвами приєднаних кімнат для цього облікового запису.
- Пошук за назвами приєднаних кімнат є best-effort. Якщо назву кімнати не вдається визначити як ID або alias, під час виконання її буде проігноровано в allowlist resolution.

## Довідник з конфігурації

Поля у стилі allowlist (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) приймають повні ID користувачів Matrix (найбезпечніший варіант). Точні збіги з каталогом визначаються під час запуску та щоразу, коли allowlist змінюється під час роботи монітора; записи, які не вдається визначити, ігноруються під час виконання. Allowlist кімнат із тієї ж причини надають перевагу ID кімнат або alias.

### Обліковий запис і з’єднання

- `enabled`: увімкнути або вимкнути канал.
- `name`: необов’язкова відображувана мітка для облікового запису.
- `defaultAccount`: бажаний ID облікового запису, коли налаштовано кілька облікових записів Matrix.
- `accounts`: іменовані перевизначення для окремих облікових записів. Значення верхнього рівня `channels.matrix` успадковуються як типові.
- `homeserver`: URL homeserver, наприклад `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: дозволити цьому обліковому запису підключатися до `localhost`, LAN/Tailscale IP або внутрішніх hostname.
- `proxy`: необов’язковий URL HTTP(S)-proxy для трафіку Matrix. Підтримується перевизначення на рівні облікового запису.
- `userId`: повний ID користувача Matrix (`@bot:example.org`).
- `accessToken`: токен доступу для автентифікації на основі токена. Підтримуються значення у відкритому тексті та SecretRef у провайдерах env/file/exec ([Керування секретами](/uk/gateway/secrets)).
- `password`: пароль для входу на основі пароля. Підтримуються значення у відкритому тексті та SecretRef.
- `deviceId`: явний ID пристрою Matrix.
- `deviceName`: відображувана назва пристрою, яка використовується під час входу за паролем.
- `avatarUrl`: збережений URL self-avatar для синхронізації профілю та оновлень `profile set`.
- `initialSyncLimit`: максимальна кількість подій, що отримуються під час початкової синхронізації при запуску.

### Шифрування

- `encryption`: увімкнути E2EE. Типово: `false`.
- `startupVerification`: `"if-unverified"` (типово, коли E2EE увімкнено) або `"off"`. Автоматично запитує self-verification під час запуску, якщо цей пристрій не верифіковано.
- `startupVerificationCooldownHours`: cooldown перед наступним автоматичним запитом під час запуску. Типово: `24`.

### Доступ і політика

- `groupPolicy`: `"open"`, `"allowlist"` або `"disabled"`. Типово: `"allowlist"`.
- `groupAllowFrom`: allowlist ID користувачів для трафіку кімнат.
- `dm.enabled`: коли `false`, ігнорувати всі DM. Типово: `true`.
- `dm.policy`: `"pairing"` (типово), `"allowlist"`, `"open"` або `"disabled"`. Застосовується після того, як бот приєднався та класифікував кімнату як DM; не впливає на обробку запрошень.
- `dm.allowFrom`: allowlist ID користувачів для трафіку DM.
- `dm.sessionScope`: `"per-user"` (типово) або `"per-room"`.
- `dm.threadReplies`: перевизначення тредування відповідей лише для DM (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: приймати повідомлення від інших налаштованих бот-акаунтів Matrix (`true` або `"mentions"`).
- `allowlistOnly`: коли `true`, примусово змінює всі активні політики DM (крім `"disabled"`) і політики груп `"open"` на `"allowlist"`. Не змінює політики `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"` або `"off"`. Типово: `"off"`. Застосовується до кожного запрошення Matrix, включно із запрошеннями у стилі DM.
- `autoJoinAllowlist`: кімнати/alias, дозволені, коли `autoJoin` має значення `"allowlist"`. Записи alias визначаються через homeserver, а не через стан, заявлений запрошеною кімнатою.
- `contextVisibility`: видимість додаткового контексту (`"all"` типово, `"allowlist"`, `"allowlist_quote"`).

### Поведінка відповідей

- `replyToMode`: `"off"`, `"first"`, `"all"` або `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` або `"always"`.
- `threadBindings`: перевизначення на рівні каналу для маршрутизації сесій і lifecycle, прив’язаних до тредів.
- `streaming`: `"off"` (типово), `"partial"`, `"quiet"`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: коли `true`, завершені блоки асистента зберігаються як окремі повідомлення прогресу.
- `markdown`: необов’язкова конфігурація рендерингу Markdown для вихідного тексту.
- `responsePrefix`: необов’язковий рядок, що додається на початок вихідних відповідей.
- `textChunkLimit`: розмір вихідного фрагмента в символах, коли `chunkMode: "length"`. Типово: `4000`.
- `chunkMode`: `"length"` (типово, поділ за кількістю символів) або `"newline"` (поділ за межами рядків).
- `historyLimit`: кількість нещодавніх повідомлень кімнати, що включаються як `InboundHistory`, коли повідомлення кімнати запускає агента. Використовує fallback на `messages.groupChat.historyLimit`; ефективне типове значення `0` (вимкнено).
- `mediaMaxMb`: ліміт розміру медіа в МБ для вихідного надсилання та вхідної обробки.

### Налаштування реакцій

- `ackReaction`: перевизначення ack reaction для цього каналу/облікового запису.
- `ackReactionScope`: перевизначення scope (`"group-mentions"` типово, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: режим вхідних сповіщень про реакції (`"own"` типово, `"off"`).

### Інструменти та перевизначення для окремих кімнат

- `actions`: керування доступністю інструментів для окремих дій (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: карта політик для окремих кімнат. Identity сесії використовує стабільний ID кімнати після визначення. (`rooms` — це застарілий alias.)
  - `groups.<room>.account`: обмежити один успадкований запис кімнати конкретним обліковим записом.
  - `groups.<room>.allowBots`: перевизначення для кімнати параметра рівня каналу (`true` або `"mentions"`).
  - `groups.<room>.users`: allowlist відправників для кімнати.
  - `groups.<room>.tools`: перевизначення allow/deny інструментів для кімнати.
  - `groups.<room>.autoReply`: перевизначення gating згадок для кімнати. `true` вимикає вимоги до згадок для цієї кімнати; `false` примусово знову вмикає їх.
  - `groups.<room>.skills`: фільтр Skills для кімнати.
  - `groups.<room>.systemPrompt`: фрагмент system prompt для кімнати.

### Налаштування погодження exec

- `execApprovals.enabled`: доставляти exec approvals через нативні запити Matrix.
- `execApprovals.approvers`: ID користувачів Matrix, яким дозволено погоджувати. Використовує fallback на `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (типово), `"channel"` або `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: необов’язкові allowlist агентів/сесій для доставки.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та gating згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
