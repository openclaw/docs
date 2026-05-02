---
read_when:
    - Налаштування Matrix в OpenClaw
    - Налаштування Matrix E2EE та перевірки
summary: Статус підтримки Matrix, початкове налаштування та приклади конфігурації
title: Матриця
x-i18n:
    generated_at: "2026-05-02T06:09:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78461a7cc60172fead3b1b0be02fe37b43fab2c5cada3a536e0bbee2e3e2cd8e
    source_path: channels/matrix.md
    workflow: 16
---

Matrix — це вбудований channel Plugin для OpenClaw.
Він використовує офіційний `matrix-js-sdk` і підтримує DM, кімнати, гілки, медіа, реакції, опитування, геолокацію та E2EE.

## Вбудований Plugin

Поточні пакетовані випуски OpenClaw постачають Matrix Plugin одразу в комплекті. Вам не потрібно нічого встановлювати; налаштування `channels.matrix.*` (див. [Налаштування](#setup)) активує його.

Для старіших збірок або користувацьких інсталяцій, які не містять Matrix, установіть актуальний npm
пакет, коли його буде опубліковано:

```bash
openclaw plugins install @openclaw/matrix
```

Якщо npm повідомляє, що пакет, який належить OpenClaw, застарілий, використовуйте актуальну пакетовану
збірку OpenClaw або локальний checkout, доки не буде опубліковано новіший npm пакет.

З локального checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

`plugins install` реєструє та вмикає Plugin, тому окремий крок `openclaw plugins enable matrix` не потрібен. Plugin усе одно нічого не робить, доки ви не налаштуєте channel нижче. Загальну поведінку Plugin та правила встановлення див. у [Plugins](/uk/tools/plugin).

## Налаштування

1. Створіть обліковий запис Matrix на своєму homeserver.
2. Налаштуйте `channels.matrix` за допомогою `homeserver` + `accessToken` або `homeserver` + `userId` + `password`.
3. Перезапустіть Gateway.
4. Почніть DM з ботом або запросіть його до кімнати (див. [auto-join](#auto-join) — нові запрошення потрапляють лише тоді, коли `autoJoin` це дозволяє).

### Інтерактивне налаштування

```bash
openclaw channels add
openclaw configure --section channels
```

Майстер запитує: URL homeserver, метод автентифікації (access token або password), user ID (лише для password auth), необов’язкову назву пристрою, чи вмикати E2EE, а також чи налаштовувати доступ до кімнат і auto-join.

Якщо відповідні env vars `MATRIX_*` вже існують і вибраний обліковий запис не має збереженої автентифікації, майстер пропонує скорочення через env-var. Щоб визначити назви кімнат перед збереженням allowlist, виконайте `openclaw channels resolve --channel matrix "Project Room"`. Коли E2EE увімкнено, майстер записує config і запускає той самий bootstrap, що й [`openclaw matrix encryption setup`](#encryption-and-verification).

### Мінімальний config

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

### Auto-join

`channels.matrix.autoJoin` за замовчуванням має значення `off`. Із цим значенням за замовчуванням бот не з’являтиметься в нових кімнатах або DM із нових запрошень, доки ви не приєднаєтеся вручну.

OpenClaw не може визначити під час запрошення, чи запрошена кімната є DM або групою, тому всі запрошення — зокрема запрошення у стилі DM — спочатку проходять через `autoJoin`. `dm.policy` застосовується лише пізніше, після того як бот приєднався і кімнату було класифіковано.

<Warning>
Установіть `autoJoin: "allowlist"` разом з `autoJoinAllowlist`, щоб обмежити, які запрошення приймає бот, або `autoJoin: "always"`, щоб приймати кожне запрошення.

`autoJoinAllowlist` приймає лише стабільні цілі: `!roomId:server`, `#alias:server` або `*`. Звичайні назви кімнат відхиляються; записи alias визначаються відносно homeserver, а не відносно стану, заявленого запрошеною кімнатою.
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

Allowlist для DM і кімнат найкраще заповнювати стабільними ID:

- DM (`dm.allowFrom`, `groupAllowFrom`, `groups.<room>.users`): використовуйте `@user:server`. Відображувані імена визначаються лише тоді, коли каталог homeserver повертає рівно один збіг.
- Кімнати (`groups`, `autoJoinAllowlist`): використовуйте `!room:server` або `#alias:server`. Назви визначаються best-effort за приєднаними кімнатами; невизначені записи ігноруються під час виконання.

### Нормалізація account ID

Майстер перетворює зрозумілу назву на нормалізований account ID. Наприклад, `Ops Bot` стає `ops-bot`. Пунктуація екранується в scoped env-var names, щоб два облікові записи не могли збігтися: `-` → `_X2D_`, тож `ops-prod` відображається в `MATRIX_OPS_X2D_PROD_*`.

### Кешовані credentials

Matrix зберігає кешовані credentials у `~/.openclaw/credentials/matrix/`:

- обліковий запис за замовчуванням: `credentials.json`
- іменовані облікові записи: `credentials-<account>.json`

Коли кешовані credentials існують там, OpenClaw вважає Matrix налаштованим, навіть якщо access token відсутній у config файлі — це охоплює налаштування, `openclaw doctor` і probes стану channel.

### Змінні середовища

Використовуються, коли еквівалентний config key не встановлено. Обліковий запис за замовчуванням використовує назви без префікса; іменовані облікові записи використовують account ID, вставлений перед суфіксом.

| Обліковий запис за замовчуванням | Іменований обліковий запис (`<ID>` — нормалізований account ID) |
| --------------------- | --------------------------------------------------- |
| `MATRIX_HOMESERVER`   | `MATRIX_<ID>_HOMESERVER`                            |
| `MATRIX_ACCESS_TOKEN` | `MATRIX_<ID>_ACCESS_TOKEN`                          |
| `MATRIX_USER_ID`      | `MATRIX_<ID>_USER_ID`                               |
| `MATRIX_PASSWORD`     | `MATRIX_<ID>_PASSWORD`                              |
| `MATRIX_DEVICE_ID`    | `MATRIX_<ID>_DEVICE_ID`                             |
| `MATRIX_DEVICE_NAME`  | `MATRIX_<ID>_DEVICE_NAME`                           |
| `MATRIX_RECOVERY_KEY` | `MATRIX_<ID>_RECOVERY_KEY`                          |

Для облікового запису `ops` назви стають `MATRIX_OPS_HOMESERVER`, `MATRIX_OPS_ACCESS_TOKEN` тощо. Env vars recovery-key читаються CLI потоками, що враховують recovery (`verify backup restore`, `verify device`, `verify bootstrap`), коли ви передаєте ключ через `--recovery-key-stdin`.

`MATRIX_HOMESERVER` не можна встановити з workspace `.env`; див. [Workspace `.env` файли](/uk/gateway/security).

## Приклад конфігурації

Практичний базовий варіант із DM pairing, allowlist кімнат і E2EE:

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

## Потокові previews

Потокове передавання відповідей Matrix вмикається явно. `streaming` керує тим, як OpenClaw доставляє поточну відповідь асистента; `blockStreaming` керує тим, чи кожен завершений блок зберігається як окреме повідомлення Matrix.

```json5
{
  channels: {
    matrix: {
      streaming: "partial",
    },
  },
}
```

Щоб зберегти live previews відповідей, але приховати проміжні рядки tool/progress, використовуйте object
form:

```json5
{
  channels: {
    matrix: {
      streaming: {
        mode: "partial",
        preview: {
          toolProgress: false,
        },
      },
    },
  },
}
```

| `streaming`       | Поведінка                                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"off"` (за замовчуванням) | Чекати повної відповіді, надіслати один раз. `true` ↔ `"partial"`, `false` ↔ `"off"`.                                                                                        |
| `"partial"`       | Редагувати одне звичайне текстове повідомлення на місці, поки модель пише поточний блок. Стандартні клієнти Matrix можуть сповістити про перший preview, а не про фінальне редагування.              |
| `"quiet"`         | Те саме, що `"partial"`, але повідомлення є notice без сповіщення. Одержувачі отримують сповіщення лише тоді, коли per-user push rule збігається з фіналізованим редагуванням (див. нижче). |

`blockStreaming` не залежить від `streaming`:

| `streaming`             | `blockStreaming: true`                                              | `blockStreaming: false` (за замовчуванням)                    |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------- |
| `"partial"` / `"quiet"` | Live draft для поточного блоку, завершені блоки збережено як повідомлення | Live draft для поточного блоку, фіналізовано на місці |
| `"off"`                 | Одне повідомлення Matrix зі сповіщенням на кожен завершений блок                     | Одне повідомлення Matrix зі сповіщенням для повної відповіді      |

Примітки:

- Якщо preview перевищує per-event size limit Matrix, OpenClaw припиняє потокове передавання preview і повертається до доставки лише фінального результату.
- Відповіді з медіа завжди надсилають вкладення звичайним способом. Якщо застарілий preview більше не можна безпечно використати повторно, OpenClaw редагує його перед надсиланням фінальної відповіді з медіа.
- Оновлення preview для tool-progress увімкнені за замовчуванням, коли активне потокове передавання preview Matrix. Установіть `streaming.preview.toolProgress: false`, щоб зберегти preview edits для тексту відповіді, але залишити прогрес інструментів на звичайному шляху доставки.
- Preview edits коштують додаткових викликів Matrix API. Залиште `streaming: "off"`, якщо потрібен найконсервативніший профіль rate-limit.

## Метадані approval

Нативні prompts approval Matrix — це звичайні події `m.room.message` зі специфічним для OpenClaw custom event content у `com.openclaw.approval`. Matrix дозволяє custom event-content keys, тому стандартні клієнти все одно відображають текстове тіло, а клієнти, обізнані з OpenClaw, можуть читати структурований approval id, kind, state, доступні decisions і деталі exec/plugin.

Коли prompt approval занадто довгий для однієї події Matrix, OpenClaw розбиває видимий текст на chunks і додає `com.openclaw.approval` лише до першого chunk. Реакції для рішень allow/deny прив’язані до цієї першої події, тому довгі prompts зберігають ту саму ціль approval, що й prompts з однією подією.

### Self-hosted push rules для quiet фіналізованих previews

`streaming: "quiet"` сповіщає одержувачів лише після фіналізації блоку або turn — per-user push rule має збігтися з фіналізованим preview marker. Повний рецепт (recipient token, pusher check, rule install, нотатки для кожного homeserver) див. у [Matrix push rules for quiet previews](/uk/channels/matrix-push-rules).

## Кімнати bot-to-bot

За замовчуванням повідомлення Matrix від інших налаштованих облікових записів OpenClaw Matrix ігноруються.

Використовуйте `allowBots`, коли ви навмисно хочете міжагентський трафік Matrix:

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
- `allowBots: "mentions"` приймає ці повідомлення лише тоді, коли вони видимо згадують цього бота в кімнатах. DM усе ще дозволені.
- `groups.<room>.allowBots` перевизначає налаштування рівня облікового запису для однієї кімнати.
- OpenClaw усе одно ігнорує повідомлення від того самого Matrix user ID, щоб уникнути циклів самовідповідей.
- Matrix не надає тут нативний bot flag; OpenClaw трактує "bot-authored" як "надіслано іншим налаштованим обліковим записом Matrix на цьому OpenClaw gateway".

Використовуйте строгі allowlist кімнат і вимоги згадування, коли вмикаєте bot-to-bot трафік у спільних кімнатах.

## Шифрування та верифікація

В зашифрованих (E2EE) кімнатах вихідні події зображень використовують `thumbnail_file`, щоб попередні перегляди зображень шифрувалися разом із повним вкладенням. Незашифровані кімнати й далі використовують звичайний `thumbnail_url`. Налаштування не потрібне — Plugin автоматично визначає стан E2EE.

Усі команди `openclaw matrix` приймають `--verbose` (повна діагностика), `--json` (машиночитаний вивід) і `--account <id>` (налаштування з кількома обліковими записами). За замовчуванням вивід стислий, із тихим внутрішнім логуванням SDK. Приклади нижче показують канонічну форму; додавайте прапорці за потреби.

### Увімкнення шифрування

```bash
openclaw matrix encryption setup
```

Ініціалізує сховище секретів і перехресне підписування, створює резервну копію ключів кімнат за потреби, а потім виводить стан і наступні кроки. Корисні прапорці:

- `--recovery-key <key>` застосувати ключ відновлення перед ініціалізацією (краще використовувати форму через stdin, задокументовану нижче)
- `--force-reset-cross-signing` відкинути поточну ідентичність перехресного підписування та створити нову (використовуйте лише свідомо)

Для нового облікового запису увімкніть E2EE під час створення:

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

### Стан і сигнали довіри

```bash
openclaw matrix verify status
openclaw matrix verify status --include-recovery-key --json
```

`verify status` повідомляє три незалежні сигнали довіри (`--verbose` показує всі):

- `Locally trusted`: довірений лише цим клієнтом
- `Cross-signing verified`: SDK повідомляє про перевірку через перехресне підписування
- `Signed by owner`: підписано вашим власним ключем самопідписування (лише для діагностики)

`Verified by owner` стає `yes` лише коли `Cross-signing verified` має значення `yes`. Локальної довіри або самого лише підпису власника недостатньо.

`--allow-degraded-local-state` повертає діагностику з максимальними зусиллями без попередньої підготовки облікового запису Matrix; корисно для офлайн-перевірок або частково налаштованих перевірок.

### Перевірка цього пристрою за допомогою ключа відновлення

Ключ відновлення є чутливим — передавайте його через stdin замість передавання в командному рядку. Задайте `MATRIX_RECOVERY_KEY` (або `MATRIX_<ID>_RECOVERY_KEY` для іменованого облікового запису):

```bash
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
```

Команда повідомляє три стани:

- `Recovery key accepted`: Matrix прийняв ключ для сховища секретів або довіри пристрою.
- `Backup usable`: резервну копію ключів кімнат можна завантажити за допомогою довіреного матеріалу відновлення.
- `Device verified by owner`: цей пристрій має повну довіру ідентичності перехресного підписування Matrix.

Вона завершується з ненульовим кодом, коли повна довіра ідентичності неповна, навіть якщо ключ відновлення розблокував матеріал резервної копії. У такому разі завершіть самоперевірку з іншого клієнта Matrix:

```bash
openclaw matrix verify self
```

`verify self` очікує на `Cross-signing verified: yes`, перш ніж успішно завершитися. Використовуйте `--timeout-ms <ms>`, щоб налаштувати час очікування.

Форма з буквальним ключем `openclaw matrix verify device "<recovery-key>"` також підтримується, але ключ потрапляє в історію вашої оболонки.

### Ініціалізація або відновлення перехресного підписування

```bash
openclaw matrix verify bootstrap
```

`verify bootstrap` — це команда відновлення та налаштування для зашифрованих облікових записів. По порядку вона:

- ініціалізує сховище секретів, повторно використовуючи наявний ключ відновлення, коли це можливо
- ініціалізує перехресне підписування та завантажує відсутні публічні ключі
- позначає й перехресно підписує поточний пристрій
- створює серверну резервну копію ключів кімнат, якщо її ще немає

Якщо homeserver вимагає UIA для завантаження ключів перехресного підписування, OpenClaw спочатку пробує без автентифікації, потім `m.login.dummy`, потім `m.login.password` (потребує `channels.matrix.password`).

Корисні прапорці:

- `--recovery-key-stdin` (використовуйте разом із `printf '%s\n' "$MATRIX_RECOVERY_KEY" | …`) або `--recovery-key <key>`
- `--force-reset-cross-signing`, щоб відкинути поточну ідентичність перехресного підписування (лише свідомо)

### Резервна копія ключів кімнат

```bash
openclaw matrix verify backup status
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
```

`backup status` показує, чи існує серверна резервна копія та чи може цей пристрій її розшифрувати. `backup restore` імпортує резервні ключі кімнат у локальне криптосховище; якщо ключ відновлення вже є на диску, можна опустити `--recovery-key-stdin`.

Щоб замінити пошкоджену резервну копію свіжою базовою версією (приймаючи втрату невідновлюваної старої історії; також може повторно створити сховище секретів, якщо поточний секрет резервної копії неможливо завантажити):

```bash
openclaw matrix verify backup reset --yes
```

Додавайте `--rotate-recovery-key` лише тоді, коли навмисно хочете, щоб попередній ключ відновлення перестав розблоковувати свіжу базову резервну копію.

### Перелік, запит і відповідь на перевірки

```bash
openclaw matrix verify list
```

Показує список очікуваних запитів перевірки для вибраного облікового запису.

```bash
openclaw matrix verify request --own-user
openclaw matrix verify request --user-id @ops:example.org --device-id ABCDEF
```

Надсилає запит перевірки з цього облікового запису OpenClaw. `--own-user` запитує самоперевірку (ви приймаєте запит в іншому клієнті Matrix того самого користувача); `--user-id`/`--device-id`/`--room-id` націлюють когось іншого. `--own-user` не можна поєднувати з іншими прапорцями націлювання.

Для нижчорівневого керування життєвим циклом — зазвичай під час супроводу вхідних запитів з іншого клієнта — ці команди діють над конкретним запитом `<id>` (виводиться `verify list` і `verify request`):

| Команда                                    | Призначення                                                        |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `openclaw matrix verify accept <id>`       | Прийняти вхідний запит                                             |
| `openclaw matrix verify start <id>`        | Запустити потік SAS                                                |
| `openclaw matrix verify sas <id>`          | Вивести емодзі або десяткові числа SAS                             |
| `openclaw matrix verify confirm-sas <id>`  | Підтвердити, що SAS збігається з тим, що показує інший клієнт       |
| `openclaw matrix verify mismatch-sas <id>` | Відхилити SAS, коли емодзі або десяткові числа не збігаються       |
| `openclaw matrix verify cancel <id>`       | Скасувати; приймає необов’язкові `--reason <text>` і `--code <matrix-code>` |

`accept`, `start`, `sas`, `confirm-sas`, `mismatch-sas` і `cancel` усі приймають `--user-id` і `--room-id` як підказки для подальшого DM, коли перевірка прив’язана до конкретної кімнати прямих повідомлень.

### Примітки щодо кількох облікових записів

Без `--account <id>` команди Matrix CLI використовують неявний обліковий запис за замовчуванням. Якщо у вас є кілька іменованих облікових записів і не задано `channels.matrix.defaultAccount`, вони відмовляться вгадувати й попросять вибрати. Коли E2EE вимкнено або недоступне для іменованого облікового запису, помилки вказують на ключ конфігурації цього облікового запису, наприклад `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Startup behavior">
    З `encryption: true` значенням `startupVerification` за замовчуванням є `"if-unverified"`. Під час запуску неперевірений пристрій запитує самоперевірку в іншому клієнті Matrix, пропускаючи дублікати та застосовуючи період очікування (24 години за замовчуванням). Налаштуйте за допомогою `startupVerificationCooldownHours` або вимкніть через `startupVerification: "off"`.

    Під час запуску також виконується консервативний прохід ініціалізації криптографії, який повторно використовує поточне сховище секретів та ідентичність перехресного підписування. Якщо стан ініціалізації пошкоджено, OpenClaw намагається виконати захищене відновлення навіть без `channels.matrix.password`; якщо homeserver вимагає UIA з паролем, запуск записує попередження й не завершується аварійно. Пристрої, уже підписані власником, зберігаються.

    Див. [міграцію Matrix](/uk/channels/matrix-migration) для повного потоку оновлення.

  </Accordion>

  <Accordion title="Verification notices">
    Matrix публікує сповіщення життєвого циклу перевірки в сувору DM-кімнату перевірки як повідомлення `m.notice`: запит, готовність (із порадою "Verify by emoji"), запуск/завершення та деталі SAS (емодзі/десяткові числа), коли доступні.

    Вхідні запити з іншого клієнта Matrix відстежуються й автоматично приймаються. Для самоперевірки OpenClaw автоматично запускає потік SAS і підтверджує свою сторону, щойно доступна перевірка емодзі — вам усе одно потрібно порівняти й підтвердити "They match" у вашому клієнті Matrix.

    Системні сповіщення перевірки не пересилаються в конвеєр чату агента.

  </Accordion>

  <Accordion title="Deleted or invalid Matrix device">
    Якщо `verify status` повідомляє, що поточного пристрою більше немає в списку на homeserver, створіть новий пристрій OpenClaw Matrix. Для входу за паролем:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Для автентифікації токеном створіть свіжий access token у вашому клієнті Matrix або UI адміністратора, а потім оновіть OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Замініть `assistant` на ID облікового запису з невдалої команди або опустіть `--account` для облікового запису за замовчуванням.

  </Accordion>

  <Accordion title="Device hygiene">
    Старі пристрої, керовані OpenClaw, можуть накопичуватися. Перегляньте список і приберіть застарілі:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE використовує офіційний криптографічний шлях Rust у `matrix-js-sdk` з `fake-indexeddb` як сумісним шаром IndexedDB. Криптографічний стан зберігається в `crypto-idb-snapshot.json` (обмежувальні дозволи файлу).

    Зашифрований стан виконання міститься в `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` і включає сховище синхронізації, криптосховище, ключ відновлення, знімок IDB, прив’язки потоків і стан перевірки під час запуску. Коли токен змінюється, але ідентичність облікового запису лишається тією самою, OpenClaw повторно використовує найкращий наявний корінь, щоб попередній стан залишався видимим.

  </Accordion>
</AccordionGroup>

## Керування профілем

Оновіть самопрофіль Matrix для вибраного облікового запису:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Можна передати обидва параметри в одному виклику. Matrix приймає URL аватарів `mxc://` напряму; коли ви передаєте `http://` або `https://`, OpenClaw спочатку завантажує файл і зберігає розв’язаний URL `mxc://` у `channels.matrix.avatarUrl` (або в перевизначенні для конкретного облікового запису).

## Потоки

Matrix підтримує нативні потоки Matrix як для автоматичних відповідей, так і для надсилань через інструмент повідомлень. Дві незалежні ручки керують поведінкою:

### Маршрутизація сесії (`sessionScope`)

`dm.sessionScope` визначає, як DM-кімнати Matrix зіставляються із сесіями OpenClaw:

- `"per-user"` (за замовчуванням): усі DM-кімнати з тим самим маршрутизованим співрозмовником спільно використовують одну сесію.
- `"per-room"`: кожна DM-кімната Matrix отримує власний ключ сесії, навіть коли співрозмовник той самий.

Явні прив’язки розмов завжди мають пріоритет над `sessionScope`, тому прив’язані кімнати й потоки зберігають вибрану цільову сесію.

### Потокове оформлення відповідей (`threadReplies`)

`threadReplies` визначає, де бот публікує свою відповідь:

- `"off"`: відповіді є верхньорівневими. Вхідні повідомлення в потоках лишаються в батьківській сесії.
- `"inbound"`: відповідати всередині потоку лише коли вхідне повідомлення вже було в цьому потоці.
- `"always"`: відповідати всередині потоку, коренем якого є повідомлення-тригер; ця розмова маршрутизується через відповідну сесію з областю потоку від першого тригера й надалі.

`dm.threadReplies` перевизначає це лише для DM — наприклад, можна ізолювати потоки кімнат, але лишити DM пласкими.

### Успадкування потоків і slash-команди

- Вхідні повідомлення в гілках включають кореневе повідомлення гілки як додатковий контекст агента.
- Надсилання через інструмент повідомлень автоматично успадковують поточну гілку Matrix, коли ціль указує на ту саму кімнату (або на ту саму цільового користувача DM), якщо не надано явний `threadId`.
- Повторне використання цільового користувача DM спрацьовує лише тоді, коли метадані поточної сесії підтверджують того самого співрозмовника DM у тому самому обліковому записі Matrix; інакше OpenClaw повертається до звичайної маршрутизації в межах користувача.
- `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язаний до гілки `/acp spawn` працюють у кімнатах Matrix і DM.
- Верхньорівневий `/focus` створює нову гілку Matrix і прив’язує її до цільової сесії, коли ввімкнено `threadBindings.spawnSessions`.
- Запуск `/focus` або `/acp spawn --thread here` всередині наявної гілки Matrix прив’язує цю гілку на місці.

Коли OpenClaw виявляє кімнату Matrix DM, що конфліктує з іншою кімнатою DM у тій самій спільній сесії, він одноразово публікує в цій кімнаті `m.notice` із посиланням на аварійний вихід `/focus` і пропозицією змінити `dm.sessionScope`. Повідомлення з’являється лише тоді, коли ввімкнено прив’язки гілок.

## Прив’язки розмов ACP

Кімнати Matrix, DM і наявні гілки Matrix можна перетворити на сталі робочі простори ACP без зміни поверхні чату.

Швидкий операторський процес:

- Запустіть `/acp spawn codex --bind here` всередині Matrix DM, кімнати або наявної гілки, якими ви хочете продовжити користуватися.
- У верхньорівневому Matrix DM або кімнаті поточний DM/кімната лишається поверхнею чату, а майбутні повідомлення маршрутизуються до створеної сесії ACP.
- Всередині наявної гілки Matrix `--bind here` прив’язує поточну гілку на місці.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Примітки:

- `--bind here` не створює дочірню гілку Matrix.
- `threadBindings.spawnSessions` керує `/acp spawn --thread auto|here`, коли OpenClaw потрібно створити або прив’язати дочірню гілку Matrix.

### Конфігурація прив’язки гілок

Matrix успадковує глобальні типові значення з `session.threadBindings`, а також підтримує перевизначення для окремих каналів:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSessions`
- `threadBindings.defaultSpawnContext`

Створення сесій, прив’язаних до гілок Matrix, типово ввімкнене:

- Установіть `threadBindings.spawnSessions: false`, щоб заборонити верхньорівневому `/focus` і `/acp spawn --thread auto|here` створювати/прив’язувати гілки Matrix.
- Установіть `threadBindings.defaultSpawnContext: "isolated"`, коли нативне створення гілок субагентів не має відгалужувати батьківський транскрипт.

## Реакції

Matrix підтримує вихідні реакції, вхідні сповіщення про реакції та реакції-підтвердження.

Інструменти вихідних реакцій керуються `channels.matrix.actions.reactions`:

- `react` додає реакцію до події Matrix.
- `reactions` показує поточний підсумок реакцій для події Matrix.
- `emoji=""` видаляє власні реакції бота на цю подію.
- `remove: true` видаляє лише вказану emoji-реакцію від бота.

**Порядок визначення** (перемагає перше визначене значення):

| Налаштування           | Порядок                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| `ackReaction`          | для облікового запису → канал → `messages.ackReaction` → запасний emoji ідентичності агента |
| `ackReactionScope`     | для облікового запису → канал → `messages.ackReactionScope` → типово `"group-mentions"` |
| `reactionNotifications` | для облікового запису → канал → типово `"own"`                                  |

`reactionNotifications: "own"` пересилає додані події `m.reaction`, коли вони спрямовані на повідомлення Matrix, створені ботом; `"off"` вимикає системні події реакцій. Видалення реакцій не синтезуються в системні події, бо Matrix подає їх як редагування з видаленням, а не як окремі видалення `m.reaction`.

## Контекст історії

- `channels.matrix.historyLimit` керує тим, скільки нещодавніх повідомлень кімнати включається як `InboundHistory`, коли повідомлення в кімнаті Matrix запускає агента. Повертається до `messages.groupChat.historyLimit`; якщо обидва не задано, ефективне типове значення — `0`. Установіть `0`, щоб вимкнути.
- Історія кімнати Matrix обмежена лише кімнатою. DM і далі використовують звичайну історію сесії.
- Історія кімнати Matrix є лише відкладеною: OpenClaw буферизує повідомлення кімнати, які ще не спричинили відповідь, а потім створює знімок цього вікна, коли надходить згадка або інший тригер.
- Поточне повідомлення-тригер не включається в `InboundHistory`; воно лишається в основному вхідному тілі для цього ходу.
- Повторні спроби тієї самої події Matrix повторно використовують початковий знімок історії замість зміщення вперед до новіших повідомлень кімнати.

## Видимість контексту

Matrix підтримує спільний елемент керування `contextVisibility` для додаткового контексту кімнати, такого як отриманий текст відповіді, корені гілок і відкладена історія.

- `contextVisibility: "all"` є типовим. Додатковий контекст зберігається в отриманому вигляді.
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників, дозволених активними перевірками списку дозволених для кімнати/користувача.
- `contextVisibility: "allowlist_quote"` поводиться як `allowlist`, але все одно зберігає одну явну цитовану відповідь.

Це налаштування впливає на видимість додаткового контексту, а не на те, чи може саме вхідне повідомлення спричинити відповідь.
Авторизація тригера й надалі походить із `groupPolicy`, `groups`, `groupAllowFrom` і налаштувань політики DM.

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

Щоб повністю заглушити DM, зберігши роботу кімнат, установіть `dm.enabled: false`:

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

Див. [Групи](/uk/channels/groups) щодо поведінки керування згадками та списку дозволених.

Приклад сполучення для Matrix DM:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Якщо незатверджений користувач Matrix продовжує писати вам до затвердження, OpenClaw повторно використовує той самий код сполучення в очікуванні й може надіслати відповідь-нагадування після короткого періоду очікування замість створення нового коду.

Див. [Сполучення](/uk/channels/pairing) щодо спільного процесу сполучення DM і структури сховища.

## Відновлення прямих кімнат

Якщо стан прямих повідомлень розсинхронізується, OpenClaw може отримати застарілі зіставлення `m.direct`, які вказують на старі окремі кімнати замість активного DM. Перевірте поточне зіставлення для співрозмовника:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Відновіть його:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Обидві команди приймають `--account <id>` для конфігурацій із кількома обліковими записами. Процес відновлення:

- віддає перевагу суворому DM 1:1, який уже зіставлено в `m.direct`
- переходить до будь-якого поточного приєднаного суворого DM 1:1 із цим користувачем
- створює нову пряму кімнату й переписує `m.direct`, якщо справного DM не існує

Він не видаляє старі кімнати автоматично. Він вибирає справний DM і оновлює зіставлення, щоб майбутні надсилання Matrix, сповіщення про перевірку та інші потоки прямих повідомлень спрямовувалися до правильної кімнати.

## Схвалення exec

Matrix може діяти як нативний клієнт схвалень. Налаштуйте в `channels.matrix.execApprovals` (або `channels.matrix.accounts.<account>.execApprovals` для перевизначення на рівні облікового запису):

- `enabled`: доставляти схвалення через нативні запити Matrix. Якщо не задано або встановлено `"auto"`, Matrix автоматично вмикається, щойно можна визначити принаймні одного схвалювача. Установіть `false`, щоб явно вимкнути.
- `approvers`: ідентифікатори користувачів Matrix (`@owner:example.org`), яким дозволено схвалювати exec-запити. Необов’язково — повертається до `channels.matrix.dm.allowFrom`.
- `target`: куди надходять запити. `"dm"` (типово) надсилає в DM схвалювачів; `"channel"` надсилає до вихідної кімнати Matrix або DM; `"both"` надсилає в обидва місця.
- `agentFilter` / `sessionFilter`: необов’язкові списки дозволених агентів/сесій, які запускають доставку Matrix.

Авторизація трохи відрізняється між видами схвалень:

- **Схвалення exec** використовують `execApprovals.approvers`, повертаючись до `dm.allowFrom`.
- **Схвалення Plugin** авторизуються лише через `dm.allowFrom`.

Обидва види спільно використовують скорочення реакцій Matrix і оновлення повідомлень. Схвалювачі бачать скорочення реакцій у головному повідомленні схвалення:

- `✅` дозволити один раз
- `❌` відхилити
- `♾️` дозволяти завжди (коли це дозволяє ефективна політика exec)

Запасні slash-команди: `/approve <id> allow-once`, `/approve <id> allow-always`, `/approve <id> deny`.

Лише визначені схвалювачі можуть схвалювати або відхиляти. Доставка в канал для схвалень exec включає текст команди — вмикайте `channel` або `both` лише в довірених кімнатах.

Пов’язано: [Схвалення exec](/uk/tools/exec-approvals).

## Slash-команди

Slash-команди (`/new`, `/reset`, `/model`, `/focus`, `/unfocus`, `/agents`, `/session`, `/acp`, `/approve` тощо) працюють безпосередньо в DM. У кімнатах OpenClaw також розпізнає команди, яким передує власна згадка бота в Matrix, тому `@bot:server /new` запускає шлях команди без власного регулярного виразу згадки. Це зберігає чутливість бота до повідомлень кімнатного стилю `@mention /command`, які Element і подібні клієнти створюють, коли користувач завершує ім’я бота клавішею Tab перед введенням команди.

Правила авторизації й далі застосовуються: відправники команд мають відповідати тим самим політикам списку дозволених/власника для DM або кімнати, що й звичайні повідомлення.

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

- Верхньорівневі значення `channels.matrix` діють як типові для іменованих облікових записів, якщо обліковий запис їх не перевизначає.
- Обмежте успадкований запис кімнати конкретним обліковим записом за допомогою `groups.<room>.account`. Записи без `account` спільні для всіх облікових записів; `account: "default"` усе ще працює, коли типовий обліковий запис налаштовано на верхньому рівні.

**Вибір типового облікового запису:**

- Установіть `defaultAccount`, щоб вибрати іменований обліковий запис, якому віддають перевагу неявна маршрутизація, перевірка та CLI-команди.
- Якщо у вас кілька облікових записів і один буквально має назву `default`, OpenClaw використовує його неявно, навіть коли `defaultAccount` не задано.
- Якщо у вас кілька іменованих облікових записів і типовий не вибрано, CLI-команди відмовляються вгадувати — установіть `defaultAccount` або передайте `--account <id>`.
- Верхньорівневий блок `channels.matrix.*` розглядається як неявний обліковий запис `default` лише тоді, коли його автентифікація повна (`homeserver` + `accessToken` або `homeserver` + `userId` + `password`). Іменовані облікові записи лишаються доступними для виявлення з `homeserver` + `userId`, щойно кешовані облікові дані покривають автентифікацію.

**Підвищення:**

- Коли OpenClaw підвищує конфігурацію з одним обліковим записом до конфігурації з кількома обліковими записами під час відновлення або налаштування, він зберігає наявний іменований обліковий запис, якщо такий існує або `defaultAccount` уже вказує на нього. До підвищеного облікового запису переміщуються лише ключі автентифікації/початкового налаштування Matrix; спільні ключі політики доставки лишаються на верхньому рівні.

Див. [Довідник конфігурації](/uk/gateway/config-channels#multi-account-all-channels) щодо спільного шаблону кількох облікових записів.

## Приватні/LAN homeserver-и

Типово OpenClaw блокує приватні/внутрішні Matrix homeserver-и для захисту від SSRF, якщо ви
явно не ввімкнете це для кожного облікового запису.

Якщо ваш homeserver працює на localhost, LAN/Tailscale IP або внутрішньому імені хоста, увімкніть
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

Приклад налаштування CLI:

```bash
openclaw matrix account add \
  --account ops \
  --homeserver http://matrix-synapse:8008 \
  --allow-private-network \
  --access-token syt_ops_xxx
```

Це ввімкнення за явним вибором дозволяє лише довірені приватні/внутрішні цільові адреси. Публічні домашні сервери без шифрування, такі як
`http://matrix.example.org:8008`, залишаються заблокованими. Надавайте перевагу `https://`, коли це можливо.

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

Іменовані облікові записи можуть перевизначати типове значення верхнього рівня через `channels.matrix.accounts.<id>.proxy`.
OpenClaw використовує те саме налаштування проксі для трафіку Matrix під час виконання та перевірок стану облікового запису.

## Визначення цілі

Matrix приймає ці форми цілей усюди, де OpenClaw запитує ціль кімнати або користувача:

- Користувачі: `@user:server`, `user:@user:server` або `matrix:user:@user:server`
- Кімнати: `!room:server`, `room:!room:server` або `matrix:room:!room:server`
- Псевдоніми: `#alias:server`, `channel:#alias:server` або `matrix:channel:#alias:server`

ID кімнат Matrix чутливі до регістру. Використовуйте точний регістр ID кімнати з Matrix
під час налаштування явних цілей доставки, завдань cron, прив’язок або списків дозволів.
OpenClaw зберігає внутрішні ключі сеансів у канонічному вигляді для сховища, тому ці ключі в нижньому регістрі
не є надійним джерелом для ID доставки Matrix.

Живий пошук у каталозі використовує обліковий запис Matrix, у який виконано вхід:

- Пошуки користувачів запитують каталог користувачів Matrix на цьому домашньому сервері.
- Пошуки кімнат напряму приймають явні ID кімнат і псевдоніми, а потім переходять до пошуку назв приєднаних кімнат для цього облікового запису.
- Пошук за назвою приєднаної кімнати виконується за принципом найкращої спроби. Якщо назву кімнати не вдається зіставити з ID або псевдонімом, вона ігнорується під час визначення списку дозволів у runtime.

## Довідник конфігурації

Поля у стилі списку дозволів (`groupAllowFrom`, `dm.allowFrom`, `groups.<room>.users`) приймають повні ID користувачів Matrix (найбезпечніше). Точні збіги в каталозі визначаються під час запуску та щоразу, коли список дозволів змінюється, поки монітор працює; записи, які неможливо визначити, ігноруються під час виконання. Списки дозволів кімнат з тієї самої причини надають перевагу ID кімнат або псевдонімам.

### Обліковий запис і підключення

- `enabled`: увімкнути або вимкнути канал.
- `name`: необов’язкова мітка відображення для облікового запису.
- `defaultAccount`: бажаний ID облікового запису, коли налаштовано кілька облікових записів Matrix.
- `accounts`: іменовані перевизначення для окремих облікових записів. Значення верхнього рівня `channels.matrix` успадковуються як типові.
- `homeserver`: URL домашнього сервера, наприклад `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: дозволити цьому обліковому запису підключатися до `localhost`, LAN/Tailscale IP-адрес або внутрішніх імен хостів.
- `proxy`: необов’язковий URL HTTP(S)-проксі для трафіку Matrix. Підтримується перевизначення для окремого облікового запису.
- `userId`: повний ID користувача Matrix (`@bot:example.org`).
- `accessToken`: токен доступу для автентифікації на основі токена. Підтримуються значення у відкритому тексті та SecretRef через провайдери env/file/exec ([Керування секретами](/uk/gateway/secrets)).
- `password`: пароль для входу на основі пароля. Підтримуються значення у відкритому тексті та SecretRef.
- `deviceId`: явний ID пристрою Matrix.
- `deviceName`: відображувана назва пристрою, що використовується під час входу з паролем.
- `avatarUrl`: збережений URL власного аватара для синхронізації профілю та оновлень `profile set`.
- `initialSyncLimit`: максимальна кількість подій, отриманих під час синхронізації при запуску.

### Шифрування

- `encryption`: увімкнути E2EE. Типово: `false`.
- `startupVerification`: `"if-unverified"` (типово, коли E2EE увімкнено) або `"off"`. Автоматично запитує самоперевірку під час запуску, коли цей пристрій неперевірений.
- `startupVerificationCooldownHours`: період очікування перед наступним автоматичним запитом під час запуску. Типово: `24`.

### Доступ і політика

- `groupPolicy`: `"open"`, `"allowlist"` або `"disabled"`. Типово: `"allowlist"`.
- `groupAllowFrom`: список дозволених ID користувачів для трафіку кімнати.
- `dm.enabled`: коли `false`, ігнорувати всі DM. Типово: `true`.
- `dm.policy`: `"pairing"` (типово), `"allowlist"`, `"open"` або `"disabled"`. Застосовується після того, як бот приєднався та класифікував кімнату як DM; не впливає на обробку запрошень.
- `dm.allowFrom`: список дозволених ID користувачів для трафіку DM.
- `dm.sessionScope`: `"per-user"` (типово) або `"per-room"`.
- `dm.threadReplies`: перевизначення лише для DM для ланцюжків відповідей (`"off"`, `"inbound"`, `"always"`).
- `allowBots`: приймати повідомлення від інших налаштованих облікових записів ботів Matrix (`true` або `"mentions"`).
- `allowlistOnly`: коли `true`, примусово переводить усі активні політики DM (крім `"disabled"`) і політики груп `"open"` у `"allowlist"`. Не змінює політики `"disabled"`.
- `autoJoin`: `"always"`, `"allowlist"` або `"off"`. Типово: `"off"`. Застосовується до кожного запрошення Matrix, включно із запрошеннями у стилі DM.
- `autoJoinAllowlist`: кімнати/псевдоніми, дозволені, коли `autoJoin` має значення `"allowlist"`. Записи псевдонімів визначаються відносно домашнього сервера, а не відносно стану, заявленого запрошеною кімнатою.
- `contextVisibility`: додаткова видимість контексту (`"all"` типово, `"allowlist"`, `"allowlist_quote"`).

### Поведінка відповідей

- `replyToMode`: `"off"`, `"first"`, `"all"` або `"batched"`.
- `threadReplies`: `"off"`, `"inbound"` або `"always"`.
- `threadBindings`: перевизначення для окремого каналу для маршрутизації та життєвого циклу сеансів, прив’язаних до ланцюжків.
- `streaming`: `"off"` (типово), `"partial"`, `"quiet"` або об’єктна форма `{ mode, preview: { toolProgress } }`. `true` ↔ `"partial"`, `false` ↔ `"off"`.
- `blockStreaming`: коли `true`, завершені блоки асистента зберігаються як окремі повідомлення прогресу.
- `markdown`: необов’язкова конфігурація рендерингу Markdown для вихідного тексту.
- `responsePrefix`: необов’язковий рядок, що додається на початок вихідних відповідей.
- `textChunkLimit`: розмір вихідного фрагмента в символах, коли `chunkMode: "length"`. Типово: `4000`.
- `chunkMode`: `"length"` (типово, ділить за кількістю символів) або `"newline"` (ділить на межах рядків).
- `historyLimit`: кількість нещодавніх повідомлень кімнати, включених як `InboundHistory`, коли повідомлення кімнати запускає агента. Повертається до `messages.groupChat.historyLimit`; ефективне типове значення `0` (вимкнено).
- `mediaMaxMb`: обмеження розміру медіа в MB для вихідних надсилань і вхідної обробки.

### Налаштування реакцій

- `ackReaction`: перевизначення реакції підтвердження для цього каналу/облікового запису.
- `ackReactionScope`: перевизначення області (`"group-mentions"` типово, `"group-all"`, `"direct"`, `"all"`, `"none"`, `"off"`).
- `reactionNotifications`: режим сповіщень про вхідні реакції (`"own"` типово, `"off"`).

### Інструменти та перевизначення для окремих кімнат

- `actions`: керування доступом до інструментів для окремих дій (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).
- `groups`: мапа політик для окремих кімнат. Ідентичність сеансу використовує стабільний ID кімнати після визначення. (`rooms` є застарілим псевдонімом.)
  - `groups.<room>.account`: обмежити один успадкований запис кімнати певним обліковим записом.
  - `groups.<room>.allowBots`: перевизначення для окремої кімнати налаштування рівня каналу (`true` або `"mentions"`).
  - `groups.<room>.users`: список дозволених відправників для окремої кімнати.
  - `groups.<room>.tools`: перевизначення дозволу/заборони інструментів для окремої кімнати.
  - `groups.<room>.autoReply`: перевизначення для окремої кімнати керування згадками. `true` вимикає вимоги до згадок для цієї кімнати; `false` примусово вмикає їх знову.
  - `groups.<room>.skills`: фільтр Skills для окремої кімнати.
  - `groups.<room>.systemPrompt`: фрагмент системного промпта для окремої кімнати.

### Налаштування схвалення exec

- `execApprovals.enabled`: доставляти схвалення exec через нативні підказки Matrix.
- `execApprovals.approvers`: ID користувачів Matrix, яким дозволено схвалювати. Повертається до `dm.allowFrom`.
- `execApprovals.target`: `"dm"` (типово), `"channel"` або `"both"`.
- `execApprovals.agentFilter` / `execApprovals.sessionFilter`: необов’язкові списки дозволених агентів/сеансів для доставки.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Спарювання](/uk/channels/pairing) — автентифікація DM і потік спарювання
- [Групи](/uk/channels/groups) — поведінка групового чату та керування згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
