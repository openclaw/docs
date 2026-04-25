---
read_when:
    - Налаштування Matrix в OpenClaw
    - Налаштування Matrix E2EE та верифікації
summary: Статус підтримки Matrix, налаштування та приклади конфігурації
title: Matrix
x-i18n:
    generated_at: "2026-04-25T21:54:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: faa07a34cbf7b660675298dd0570d1f09b00d578466e7e65e6909c9677bdbccf
    source_path: channels/matrix.md
    workflow: 15
---

Matrix — це вбудований channel Plugin для OpenClaw.
Він використовує офіційний `matrix-js-sdk` і підтримує DM, кімнати, треди, медіа, реакції, опитування, геолокацію та E2EE.

## Вбудований Plugin

Matrix постачається як вбудований Plugin у поточних релізах OpenClaw, тож для звичайних
пакетованих збірок окреме встановлення не потрібне.

Якщо ви використовуєте старішу збірку або власне встановлення без Matrix, встановіть
його вручну:

Встановлення з npm:

```bash
openclaw plugins install @openclaw/matrix
```

Встановлення з локального checkout:

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

Див. [Plugins](/uk/tools/plugin) щодо поведінки Plugin і правил встановлення.

## Налаштування

1. Переконайтеся, що Plugin Matrix доступний.
   - У поточних пакетованих релізах OpenClaw він уже вбудований.
   - У старіших/власних встановленнях його можна додати вручну за допомогою наведених вище команд.
2. Створіть обліковий запис Matrix на своєму homeserver.
3. Налаштуйте `channels.matrix`, використовуючи один із варіантів:
   - `homeserver` + `accessToken`, або
   - `homeserver` + `userId` + `password`.
4. Перезапустіть Gateway.
5. Почніть DM із ботом або запросіть його до кімнати.
   - Нові запрошення Matrix працюють лише тоді, коли `channels.matrix.autoJoin` це дозволяє.

Інтерактивні шляхи налаштування:

```bash
openclaw channels add
openclaw configure --section channels
```

Майстер Matrix запитує:

- URL homeserver
- метод автентифікації: access token або пароль
- ID користувача (лише для автентифікації паролем)
- необов’язкову назву пристрою
- чи вмикати E2EE
- чи налаштовувати доступ до кімнат і автоматичне приєднання за запрошеннями

Ключова поведінка майстра:

- Якщо змінні середовища автентифікації Matrix уже існують і для цього облікового запису ще не збережено автентифікацію в config, майстер запропонує скорочений варіант із env, щоб зберегти автентифікацію у змінних середовища.
- Назви облікових записів нормалізуються до ID облікового запису. Наприклад, `Ops Bot` стає `ops-bot`.
- Записи allowlist для DM напряму приймають `@user:server`; відображувані імена працюють лише тоді, коли live directory lookup знаходить одну точну відповідність.
- Записи allowlist для кімнат напряму приймають ID кімнат і псевдоніми. Надавайте перевагу `!room:server` або `#alias:server`; невизначені назви ігноруються під час виконання під час розв’язання allowlist.
- У режимі allowlist для автоматичного приєднання за запрошеннями використовуйте лише стабільні цілі запрошень: `!roomId:server`, `#alias:server` або `*`. Звичайні назви кімнат відхиляються.
- Щоб розв’язати назви кімнат перед збереженням, використовуйте `openclaw channels resolve --channel matrix "Project Room"`.

<Warning>
`channels.matrix.autoJoin` за замовчуванням має значення `off`.

Якщо залишити його невстановленим, бот не приєднуватиметься до запрошених кімнат або нових запрошень у стилі DM, тож він не з’являтиметься в нових групах або запрошених DM, якщо ви спершу не приєднаєтеся вручну.

Установіть `autoJoin: "allowlist"` разом із `autoJoinAllowlist`, щоб обмежити, які запрошення він прийматиме, або встановіть `autoJoin: "always"`, якщо хочете, щоб він приєднувався до кожного запрошення.

У режимі `allowlist` `autoJoinAllowlist` приймає лише `!roomId:server`, `#alias:server` або `*`.
</Warning>

Приклад allowlist:

```json5
{
  channels: {
    matrix: {
      autoJoin: "allowlist",
      autoJoinAllowlist: ["!ops:example.org", "#support:example.org"],
      groups: {
        "!ops:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Приєднуватися до кожного запрошення:

```json5
{
  channels: {
    matrix: {
      autoJoin: "always",
    },
  },
}
```

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

Налаштування на основі пароля (токен кешується після входу):

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
Для облікового запису за замовчуванням використовується `credentials.json`; іменовані облікові записи використовують `credentials-<account>.json`.
Коли там існують кешовані облікові дані, OpenClaw вважає Matrix налаштованим для setup, doctor і виявлення channel-status, навіть якщо поточна автентифікація не задана безпосередньо в config.

Еквіваленти змінних середовища (використовуються, коли ключ config не встановлено):

- `MATRIX_HOMESERVER`
- `MATRIX_ACCESS_TOKEN`
- `MATRIX_USER_ID`
- `MATRIX_PASSWORD`
- `MATRIX_DEVICE_ID`
- `MATRIX_DEVICE_NAME`

Для облікових записів не за замовчуванням використовуйте змінні середовища з областю дії облікового запису:

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

Matrix екранує розділові знаки в ID облікових записів, щоб уникнути колізій змінних середовища з областю дії.
Наприклад, `-` стає `_X2D_`, тож `ops-prod` перетворюється на `MATRIX_OPS_X2D_PROD_*`.

Інтерактивний майстер пропонує скорочений варіант із env vars лише тоді, коли ці змінні середовища автентифікації вже присутні, а для вибраного облікового запису ще не збережено автентифікацію Matrix у config.

`MATRIX_HOMESERVER` не можна встановити з workspace `.env`; див. [Файли workspace `.env`](/uk/gateway/security).

## Приклад конфігурації

Це практична базова конфігурація з pairing для DM, allowlist для кімнат і ввімкненим E2EE:

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

`autoJoin` застосовується до всіх запрошень Matrix, включно із запрошеннями у стилі DM. OpenClaw не може надійно
класифікувати запрошену кімнату як DM або групу в момент запрошення, тому всі запрошення спочатку проходять через `autoJoin`.
`dm.policy` застосовується після того, як бот приєднався і кімнату класифіковано як DM.

## Попередній перегляд потокової відповіді

Потокова передача відповідей у Matrix є добровільною функцією.

Установіть `channels.matrix.streaming` у `"partial"`, якщо хочете, щоб OpenClaw надсилав одну live preview
відповідь, редагував цей preview на місці, поки модель генерує текст, а потім завершував його, коли
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

- `streaming: "off"` — значення за замовчуванням. OpenClaw чекає на фінальну відповідь і надсилає її один раз.
- `streaming: "partial"` створює одне редаговане preview-повідомлення для поточного блоку відповіді асистента, використовуючи звичайні текстові повідомлення Matrix. Це зберігає застарілу поведінку Matrix із сповіщенням спочатку про preview, тому стандартні клієнти можуть сповіщати про перший текст потокового preview, а не про завершений блок.
- `streaming: "quiet"` створює одне редаговане тихе preview-повідомлення для поточного блоку відповіді асистента. Використовуйте це лише тоді, коли ви також налаштували push rules отримувача для завершених редагувань preview.
- `blockStreaming: true` вмикає окремі повідомлення про поступ у Matrix. Якщо ввімкнено потокову передачу preview, Matrix зберігає live draft для поточного блоку та зберігає завершені блоки як окремі повідомлення.
- Коли потокова передача preview увімкнена, а `blockStreaming` вимкнено, Matrix редагує live draft на місці та завершує ту саму подію, коли блок або хід завершено.
- Якщо preview більше не вміщується в одну подію Matrix, OpenClaw припиняє потокову передачу preview і повертається до звичайної фінальної доставки.
- Відповіді з медіа, як і раніше, надсилають вкладення у звичайному режимі. Якщо застарілий preview більше не можна безпечно повторно використати, OpenClaw редагує його перед надсиланням фінальної відповіді з медіа.
- Редагування preview вимагають додаткових викликів API Matrix. Залиште streaming вимкненим, якщо хочете найобережнішої поведінки щодо обмеження швидкості.

`blockStreaming` сам по собі не вмикає чернетки preview.
Використовуйте `streaming: "partial"` або `streaming: "quiet"` для редагувань preview; потім додавайте `blockStreaming: true`, лише якщо також хочете, щоб завершені блоки асистента залишалися видимими як окремі повідомлення про поступ.

Якщо вам потрібні стандартні сповіщення Matrix без власних push rules, використовуйте `streaming: "partial"` для поведінки з preview спочатку або залиште `streaming` вимкненим для доставки лише фінального повідомлення. З `streaming: "off"`:

- `blockStreaming: true` надсилає кожен завершений блок як звичайне повідомлення Matrix зі сповіщенням.
- `blockStreaming: false` надсилає лише фінальну завершену відповідь як звичайне повідомлення Matrix зі сповіщенням.

### Self-hosted push rules для тихих завершених preview

Тиха потокова передача (`streaming: "quiet"`) сповіщає отримувачів лише тоді, коли блок або хід завершено — правило push для кожного користувача має збігатися з маркером завершеного preview. Див. [Правила push Matrix для тихих preview](/uk/channels/matrix-push-rules) для повного налаштування (токен отримувача, перевірка pusher, встановлення правил, примітки для окремих homeserver).

## Кімнати бот-до-бота

За замовчуванням повідомлення Matrix від інших налаштованих облікових записів OpenClaw Matrix ігноруються.

Використовуйте `allowBots`, якщо ви свідомо хочете міжагентний трафік Matrix:

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

- `allowBots: true` приймає повідомлення від інших налаштованих бот-облікових записів Matrix у дозволених кімнатах і DM.
- `allowBots: "mentions"` приймає такі повідомлення лише тоді, коли вони явно згадують цього бота в кімнатах. DM усе одно дозволені.
- `groups.<room>.allowBots` перевизначає налаштування рівня облікового запису для однієї кімнати.
- OpenClaw, як і раніше, ігнорує повідомлення від того самого ID користувача Matrix, щоб уникнути циклів самовідповідей.
- Matrix тут не надає вбудованого прапорця бота; OpenClaw трактує "автор повідомлення — бот" як "надіслано іншим налаштованим обліковим записом Matrix на цьому Gateway OpenClaw".

Використовуйте суворі allowlist для кімнат і вимоги до згадування, коли вмикаєте трафік бот-до-бота у спільних кімнатах.

## Шифрування та верифікація

У зашифрованих (E2EE) кімнатах вихідні події зображень використовують `thumbnail_file`, тож preview зображень шифруються разом із повним вкладенням. Незашифровані кімнати, як і раніше, використовують звичайний `thumbnail_url`. Налаштування не потрібне — Plugin автоматично визначає стан E2EE.

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

Команди верифікації (усі підтримують `--verbose` для діагностики та `--json` для машиночитаного виводу):

```bash
openclaw matrix verify status
```

Докладний статус (повна діагностика):

```bash
openclaw matrix verify status --verbose
```

Включити збережений recovery key у машиночитаний вивід:

```bash
openclaw matrix verify status --include-recovery-key --json
```

Ініціалізувати cross-signing і стан верифікації:

```bash
openclaw matrix verify bootstrap
```

Докладна діагностика bootstrap:

```bash
openclaw matrix verify bootstrap --verbose
```

Примусово скинути поточну ідентичність cross-signing перед bootstrap:

```bash
openclaw matrix verify bootstrap --force-reset-cross-signing
```

Верифікувати цей пристрій за допомогою recovery key:

```bash
openclaw matrix verify device "<your-recovery-key>"
```

Ця команда повідомляє про три окремі стани:

- `Recovery key accepted`: Matrix прийняв recovery key для secret storage або довіри до пристрою.
- `Backup usable`: резервну копію ключів кімнат можна завантажити за допомогою довіреного recovery material.
- `Device verified by owner`: поточний пристрій OpenClaw має повну довіру до ідентичності Matrix cross-signing.

`Signed by owner` у докладному або JSON-виводі — це лише діагностичний показник. OpenClaw не
вважає цього достатнім, якщо `Cross-signing verified` також не має значення `yes`.

Команда все одно завершується з ненульовим кодом виходу, якщо повна довіра до ідентичності Matrix не завершена,
навіть якщо recovery key може розблокувати матеріал резервної копії. У такому разі завершіть
self-verification з іншого клієнта Matrix:

```bash
openclaw matrix verify self
```

Прийміть запит в іншому клієнті Matrix, порівняйте емодзі SAS або десяткові числа
і вводьте `yes` лише тоді, коли вони збігаються. Команда чекає, доки Matrix не повідомить
`Cross-signing verified: yes`, перш ніж завершитися успішно.

Використовуйте `verify bootstrap --force-reset-cross-signing` лише тоді, коли свідомо
хочете замінити поточну ідентичність cross-signing.

Докладні відомості про верифікацію пристрою:

```bash
openclaw matrix verify device "<your-recovery-key>" --verbose
```

Перевірка стану резервної копії ключів кімнат:

```bash
openclaw matrix verify backup status
```

Докладна діагностика стану резервної копії:

```bash
openclaw matrix verify backup status --verbose
```

Відновлення ключів кімнат із резервної копії на сервері:

```bash
openclaw matrix verify backup restore
```

Якщо ключ резервної копії ще не завантажено на диск, передайте Matrix recovery key:

```bash
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
```

Інтерактивний процес self-verification:

```bash
openclaw matrix verify self
```

Для низькорівневих або вхідних запитів на верифікацію використовуйте:

```bash
openclaw matrix verify accept <id>
openclaw matrix verify start <id>
openclaw matrix verify sas <id>
openclaw matrix verify confirm-sas <id>
```

Щоб скасувати запит, використовуйте `openclaw matrix verify cancel <id>`.

Докладна діагностика відновлення:

```bash
openclaw matrix verify backup restore --verbose
```

Видалити поточну резервну копію на сервері та створити нову базову резервну копію. Якщо збережений
ключ резервної копії не вдається коректно завантажити, це скидання також може повторно створити secret storage, щоб
під час майбутніх cold start можна було завантажити новий ключ резервної копії:

```bash
openclaw matrix verify backup reset --yes
```

Усі команди `verify` за замовчуванням лаконічні (включно з тихим внутрішнім журналюванням SDK) і показують детальну діагностику лише з `--verbose`.
Для повного машиночитаного виводу під час створення скриптів використовуйте `--json`.

У конфігураціях із кількома обліковими записами команди Matrix CLI використовують неявний типовий обліковий запис Matrix, якщо не передати `--account <id>`.
Якщо ви налаштовуєте кілька іменованих облікових записів, спочатку встановіть `channels.matrix.defaultAccount`, інакше такі неявні операції CLI зупинятимуться та проситимуть явно вибрати обліковий запис.
Використовуйте `--account`, коли хочете, щоб операції верифікації або пристроїв були явно спрямовані на іменований обліковий запис:

```bash
openclaw matrix verify status --account assistant
openclaw matrix verify backup restore --account assistant
openclaw matrix devices list --account assistant
```

Коли шифрування вимкнено або недоступне для іменованого облікового запису, попередження Matrix і помилки верифікації вказують на ключ config цього облікового запису, наприклад `channels.matrix.accounts.assistant.encryption`.

<AccordionGroup>
  <Accordion title="Що означає verified">
    OpenClaw вважає пристрій verified лише тоді, коли його підписує ваша власна ідентичність cross-signing. `verify status --verbose` показує три сигнали довіри:

    - `Locally trusted`: довірений лише цим клієнтом
    - `Cross-signing verified`: SDK повідомляє про верифікацію через cross-signing
    - `Signed by owner`: підписаний вашим власним ключем self-signing

    `Verified by owner` стає `yes` лише тоді, коли присутня верифікація cross-signing.
    Локальної довіри або самого лише підпису власника недостатньо, щоб OpenClaw вважав
    пристрій повністю verified.

  </Accordion>

  <Accordion title="Що робить bootstrap">
    `verify bootstrap` — це команда відновлення та налаштування для зашифрованих облікових записів. Послідовно вона:

    - ініціалізує secret storage, повторно використовуючи наявний recovery key, коли це можливо
    - ініціалізує cross-signing і вивантажує відсутні публічні ключі cross-signing
    - позначає та підписує cross-signing поточний пристрій
    - створює серверну резервну копію ключів кімнат, якщо вона ще не існує

    Якщо homeserver вимагає UIA для вивантаження ключів cross-signing, OpenClaw спочатку пробує без автентифікації, потім `m.login.dummy`, а потім `m.login.password` (потрібен `channels.matrix.password`). Використовуйте `--force-reset-cross-signing` лише тоді, коли свідомо відкидаєте поточну ідентичність.

  </Accordion>

  <Accordion title="Нова базова резервна копія">
    Якщо ви хочете, щоб майбутні зашифровані повідомлення продовжували працювати, і погоджуєтеся втратити стару історію, яку неможливо відновити:

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

    Додайте `--account <id>`, щоб націлити команду на іменований обліковий запис. Це також може повторно створити secret storage, якщо поточний секрет резервної копії неможливо безпечно завантажити.
    Додавайте `--rotate-recovery-key` лише тоді, коли свідомо хочете, щоб старий recovery
    key перестав розблоковувати нову базову резервну копію.

  </Accordion>

  <Accordion title="Поведінка під час запуску">
    Якщо `encryption: true`, `startupVerification` за замовчуванням має значення `"if-unverified"`. Під час запуску неперевірений пристрій запитує self-verification в іншому клієнті Matrix, пропускаючи дублікати та застосовуючи cooldown. Налаштовуйте через `startupVerificationCooldownHours` або вимикайте через `startupVerification: "off"`.

    Під час запуску також виконується консервативний прохід crypto bootstrap, який повторно використовує поточні secret storage та ідентичність cross-signing. Якщо стан bootstrap пошкоджено, OpenClaw намагається виконати захищене відновлення навіть без `channels.matrix.password`; якщо homeserver вимагає UIA з паролем, під час запуску записується попередження, але це не є фатальним. Уже підписані власником пристрої зберігаються.

    Див. [Міграція Matrix](/uk/install/migrating-matrix) для повного процесу оновлення.

  </Accordion>

  <Accordion title="Сповіщення про верифікацію">
    Matrix публікує повідомлення про життєвий цикл верифікації в строгій DM-кімнаті верифікації як повідомлення `m.notice`: запит, готовність (із підказкою "Verify by emoji"), початок/завершення та відомості SAS (емодзі/десяткові числа), коли вони доступні.

    Вхідні запити з іншого клієнта Matrix відстежуються та автоматично приймаються. Для self-verification OpenClaw автоматично запускає процес SAS і підтверджує свій бік, щойно стає доступною верифікація емодзі — вам усе одно потрібно порівняти й підтвердити "They match" у своєму клієнті Matrix.

    Системні сповіщення верифікації не пересилаються в pipeline чату агента.

  </Accordion>

  <Accordion title="Видалений або недійсний пристрій Matrix">
    Якщо `verify status` повідомляє, що поточного пристрою більше немає в списку на
    homeserver, створіть новий пристрій OpenClaw Matrix. Для входу за паролем:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --user-id '@assistant:example.org' \
  --password '<password>' \
  --device-name OpenClaw-Gateway
```

    Для автентифікації токеном створіть новий access token у своєму клієнті Matrix або в UI адміністратора,
    а потім оновіть OpenClaw:

```bash
openclaw matrix account add \
  --account assistant \
  --homeserver https://matrix.example.org \
  --access-token '<token>'
```

    Замініть `assistant` на ID облікового запису з команди, що завершилася помилкою, або пропустіть
    `--account` для облікового запису за замовчуванням.

  </Accordion>

  <Accordion title="Гігієна пристроїв">
    Старі пристрої під керуванням OpenClaw можуть накопичуватися. Перегляньте список і очистьте їх:

```bash
openclaw matrix devices list
openclaw matrix devices prune-stale
```

  </Accordion>

  <Accordion title="Crypto store">
    Matrix E2EE використовує офіційний crypto-шлях Rust у `matrix-js-sdk` із `fake-indexeddb` як shim для IndexedDB. Crypto state зберігається в `crypto-idb-snapshot.json` (із суворими правами доступу до файлу).

    Стан зашифрованого runtime зберігається в `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/` і включає sync store, crypto store, recovery key, snapshot IDB, прив’язки тредів і стан startup verification. Коли токен змінюється, але ідентичність облікового запису залишається тією самою, OpenClaw повторно використовує найкращий наявний root, щоб попередній стан залишався видимим.

  </Accordion>
</AccordionGroup>

## Керування профілем

Оновити власний профіль Matrix для вибраного облікового запису можна так:

```bash
openclaw matrix profile set --name "OpenClaw Assistant"
openclaw matrix profile set --avatar-url https://cdn.example.org/avatar.png
```

Додайте `--account <id>`, якщо хочете явно націлити команду на іменований обліковий запис Matrix.

Matrix напряму приймає URL аватара `mxc://`. Коли ви передаєте URL аватара `http://` або `https://`, OpenClaw спочатку вивантажує його до Matrix, а потім зберігає отриманий URL `mxc://` назад у `channels.matrix.avatarUrl` (або в перевизначення для вибраного облікового запису).

## Треди

Matrix підтримує нативні треди Matrix як для автоматичних відповідей, так і для надсилання через message-tool.

- `dm.sessionScope: "per-user"` (типове значення) зберігає маршрутизацію Matrix DM у межах відправника, тож кілька кімнат DM можуть використовувати один сеанс, якщо вони визначаються як той самий співрозмовник.
- `dm.sessionScope: "per-room"` ізолює кожну кімнату Matrix DM у власний ключ сеансу, водночас і далі використовуючи звичайні перевірки автентифікації та allowlist для DM.
- Явні прив’язки розмов Matrix усе одно мають пріоритет над `dm.sessionScope`, тож прив’язані кімнати й треди зберігають вибраний цільовий сеанс.
- `threadReplies: "off"` залишає відповіді на верхньому рівні та прив’язує вхідні тредові повідомлення до батьківського сеансу.
- `threadReplies: "inbound"` відповідає всередині треду лише тоді, коли вхідне повідомлення вже було в цьому треді.
- `threadReplies: "always"` зберігає відповіді в кімнаті в треді, коренем якого є повідомлення-тригер, і маршрутизує цю розмову через відповідний сеанс із областю дії треду від першого повідомлення-тригера.
- `dm.threadReplies` перевизначає параметр верхнього рівня лише для DM. Наприклад, можна ізолювати треди в кімнатах, залишивши DM пласкими.
- Вхідні тредові повідомлення включають кореневе повідомлення треду як додатковий контекст агента.
- Надсилання через message-tool автоматично успадковує поточний тред Matrix, коли ціллю є та сама кімната або той самий цільовий користувач DM, якщо явно не вказано `threadId`.
- Повторне використання цільового користувача DM в межах того самого сеансу спрацьовує лише тоді, коли поточні метадані сеансу підтверджують того самого співрозмовника DM у тому самому обліковому записі Matrix; інакше OpenClaw повертається до звичайної маршрутизації в межах користувача.
- Коли OpenClaw бачить, що кімната Matrix DM конфліктує з іншою кімнатою DM у межах того самого спільного сеансу Matrix DM, він публікує одноразове `m.notice` у цій кімнаті з можливістю обходу `/focus`, коли ввімкнено прив’язки тредів і є підказка `dm.sessionScope`.
- Прив’язки тредів під час runtime підтримуються для Matrix. `/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` і прив’язаний до треду `/acp spawn` працюють у кімнатах і DM Matrix.
- `/focus` на верхньому рівні кімнати/DM Matrix створює новий тред Matrix і прив’язує його до цільового сеансу, коли `threadBindings.spawnSubagentSessions=true`.
- Виконання `/focus` або `/acp spawn --thread here` всередині наявного треду Matrix натомість прив’язує цей поточний тред.

## Прив’язки розмов ACP

Кімнати Matrix, DM і наявні треди Matrix можна перетворити на довговічні робочі області ACP без зміни поверхні чату.

Швидкий процес для оператора:

- Виконайте `/acp spawn codex --bind here` у Matrix DM, кімнаті або наявному треді, який хочете й надалі використовувати.
- У Matrix DM або кімнаті верхнього рівня поточний DM/кімната залишається поверхнею чату, а майбутні повідомлення маршрутизуються до створеного сеансу ACP.
- Усередині наявного треду Matrix `--bind here` прив’язує цей поточний тред на місці.
- `/new` і `/reset` скидають той самий прив’язаний сеанс ACP на місці.
- `/acp close` закриває сеанс ACP і видаляє прив’язку.

Примітки:

- `--bind here` не створює дочірній тред Matrix.
- `threadBindings.spawnAcpSessions` потрібен лише для `/acp spawn --thread auto|here`, коли OpenClaw має створити або прив’язати дочірній тред Matrix.

### Конфігурація прив’язки тредів

Matrix успадковує глобальні значення за замовчуванням із `session.threadBindings`, а також підтримує перевизначення для окремого channel:

- `threadBindings.enabled`
- `threadBindings.idleHours`
- `threadBindings.maxAgeHours`
- `threadBindings.spawnSubagentSessions`
- `threadBindings.spawnAcpSessions`

Прапорці створення з прив’язкою до тредів у Matrix є добровільними:

- Установіть `threadBindings.spawnSubagentSessions: true`, щоб дозволити `/focus` верхнього рівня створювати та прив’язувати нові треди Matrix.
- Установіть `threadBindings.spawnAcpSessions: true`, щоб дозволити `/acp spawn --thread auto|here` прив’язувати сеанси ACP до тредів Matrix.

## Реакції

Matrix підтримує вихідні дії реакцій, вхідні сповіщення про реакції та вхідні реакції-підтвердження.

- Використання вихідних reaction-інструментів контролюється через `channels["matrix"].actions.reactions`.
- `react` додає реакцію до певної події Matrix.
- `reactions` показує поточне зведення реакцій для певної події Matrix.
- `emoji=""` видаляє власні реакції облікового запису бота на цю подію.
- `remove: true` видаляє лише вказану реакцію emoji з облікового запису бота.

Область дії ack reaction визначається у стандартному порядку OpenClaw:

- `channels["matrix"].accounts.<accountId>.ackReaction`
- `channels["matrix"].ackReaction`
- `messages.ackReaction`
- резервний emoji з identity агента

Область дії ack reaction визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.ackReactionScope`
- `channels["matrix"].ackReactionScope`
- `messages.ackReactionScope`

Режим сповіщень про реакції визначається в такому порядку:

- `channels["matrix"].accounts.<accountId>.reactionNotifications`
- `channels["matrix"].reactionNotifications`
- типове значення: `own`

Поведінка:

- `reactionNotifications: "own"` пересилає додані події `m.reaction`, коли вони націлені на повідомлення Matrix, створені ботом.
- `reactionNotifications: "off"` вимикає системні події реакцій.
- Видалення реакцій не синтезується в системні події, оскільки Matrix показує їх як redaction, а не як окремі видалення `m.reaction`.

## Контекст історії

- `channels.matrix.historyLimit` визначає, скільки останніх повідомлень кімнати включати як `InboundHistory`, коли повідомлення кімнати Matrix запускає агента. Використовується резервне значення `messages.groupChat.historyLimit`; якщо обидва параметри не задані, фактичне типове значення — `0`. Установіть `0`, щоб вимкнути.
- Історія кімнат Matrix обмежується лише кімнатою. DM і далі використовують звичайну історію сеансу.
- Історія кімнат Matrix працює лише для очікуваних повідомлень: OpenClaw буферизує повідомлення кімнати, які ще не викликали відповідь, а потім знімає snapshot цього вікна, коли надходить згадка або інший тригер.
- Поточне повідомлення-тригер не включається в `InboundHistory`; воно залишається в основному вхідному тілі для цього ходу.
- Повторні спроби для тієї самої події Matrix повторно використовують початковий snapshot історії, а не зсуваються вперед до новіших повідомлень кімнати.

## Видимість контексту

Matrix підтримує спільний параметр `contextVisibility` для додаткового контексту кімнати, такого як отриманий текст відповіді, корені тредів і очікувана історія.

- `contextVisibility: "all"` — типове значення. Додатковий контекст зберігається як отримано.
- `contextVisibility: "allowlist"` фільтрує додатковий контекст до відправників, дозволених активними перевірками allowlist для кімнати/користувача.
- `contextVisibility: "allowlist_quote"` працює як `allowlist`, але все одно зберігає одну явну цитовану відповідь.

Цей параметр впливає на видимість додаткового контексту, а не на те, чи може саме вхідне повідомлення викликати відповідь.
Авторизація тригера, як і раніше, походить із параметрів `groupPolicy`, `groups`, `groupAllowFrom` і політики DM.

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
        "!roomid:example.org": {
          requireMention: true,
        },
      },
    },
  },
}
```

Див. [Groups](/uk/channels/groups) щодо згадок як умови доступу та поведінки allowlist.

Приклад pairing для Matrix DM:

```bash
openclaw pairing list matrix
openclaw pairing approve matrix <CODE>
```

Якщо непідтверджений користувач Matrix продовжує надсилати вам повідомлення до схвалення, OpenClaw повторно використовує той самий код pairing, що очікує, і може знову надіслати відповідь-нагадування після короткого cooldown, замість того щоб створювати новий код.

Див. [Pairing](/uk/channels/pairing) щодо спільного процесу pairing для DM і структури зберігання.

## Виправлення direct room

Якщо стан direct-message розсинхронізується, OpenClaw може отримати застарілі зіставлення `m.direct`, що вказують на старі solo-кімнати замість активного DM. Перевірити поточне зіставлення для співрозмовника можна так:

```bash
openclaw matrix direct inspect --user-id @alice:example.org
```

Виправити його можна так:

```bash
openclaw matrix direct repair --user-id @alice:example.org
```

Процес виправлення:

- надає перевагу строгому 1:1 DM, який уже зіставлено в `m.direct`
- якщо такого немає, використовує будь-який поточний strict 1:1 DM із цим користувачем, до якого виконано приєднання
- створює нову direct room і переписує `m.direct`, якщо справного DM не існує

Процес виправлення не видаляє старі кімнати автоматично. Він лише вибирає справний DM і оновлює зіставлення, щоб нові надсилання Matrix, сповіщення про верифікацію та інші процеси direct-message знову були спрямовані до правильної кімнати.

## Підтвердження exec

Matrix може діяти як нативний клієнт підтвердження для облікового запису Matrix. Нативні
параметри маршрутизації DM/channel, як і раніше, знаходяться в конфігурації підтверджень exec:

- `channels.matrix.execApprovals.enabled`
- `channels.matrix.execApprovals.approvers` (необов’язково; резервно використовується `channels.matrix.dm.allowFrom`)
- `channels.matrix.execApprovals.target` (`dm` | `channel` | `both`, типове значення: `dm`)
- `channels.matrix.execApprovals.agentFilter`
- `channels.matrix.execApprovals.sessionFilter`

Особи, що підтверджують, повинні бути ID користувачів Matrix, наприклад `@owner:example.org`. Matrix автоматично вмикає нативні підтвердження, коли `enabled` не задано або дорівнює `"auto"` і вдається визначити принаймні одного approver. Підтвердження exec спочатку використовують `execApprovals.approvers`, а потім можуть резервно використовувати `channels.matrix.dm.allowFrom`. Підтвердження Plugin авторизуються через `channels.matrix.dm.allowFrom`. Установіть `enabled: false`, щоб явно вимкнути Matrix як нативний клієнт підтвердження. В іншому разі запити на підтвердження резервно переходять до інших налаштованих маршрутів підтвердження або до резервної політики підтвердження.

Нативна маршрутизація Matrix підтримує обидва види підтверджень:

- `channels.matrix.execApprovals.*` керує нативним режимом fanout DM/channel для запитів на підтвердження Matrix.
- Підтвердження exec використовують набір approver для exec із `execApprovals.approvers` або `channels.matrix.dm.allowFrom`.
- Підтвердження Plugin використовують allowlist Matrix DM із `channels.matrix.dm.allowFrom`.
- Скорочення через реакції Matrix і оновлення повідомлень застосовуються і до підтверджень exec, і до підтверджень Plugin.

Правила доставки:

- `target: "dm"` надсилає запити на підтвердження в DM тих, хто підтверджує
- `target: "channel"` надсилає запит назад у вихідну кімнату або DM Matrix
- `target: "both"` надсилає запит у DM тих, хто підтверджує, і у вихідну кімнату або DM Matrix

Запити Matrix на підтвердження ініціалізують скорочення через реакції в основному повідомленні підтвердження:

- `✅` = дозволити один раз
- `❌` = заборонити
- `♾️` = дозволити завжди, коли таке рішення дозволене ефективною політикою exec

Ті, хто підтверджує, можуть реагувати на це повідомлення або використовувати резервні slash-команди: `/approve <id> allow-once`, `/approve <id> allow-always` або `/approve <id> deny`.

Лише визначені approver можуть підтверджувати або відхиляти. Для підтверджень exec доставка в channel включає текст команди, тож вмикайте `channel` або `both` лише в довірених кімнатах.

Перевизначення для облікового запису:

- `channels.matrix.accounts.<account>.execApprovals`

Пов’язана документація: [Підтвердження exec](/uk/tools/exec-approvals)

## Slash-команди

Slash-команди Matrix (наприклад, `/new`, `/reset`, `/model`) працюють безпосередньо в DM. У кімнатах OpenClaw також розпізнає slash-команди, перед якими стоїть власна згадка бота Matrix, тож `@bot:server /new` запускає шлях команди без потреби у спеціальному regex для згадки. Це дозволяє боту залишатися чутливим до повідомлень у стилі кімнат `@mention /command`, які Element та подібні клієнти надсилають, коли користувач завершує ім’я бота табуляцією перед введенням команди.

Правила авторизації, як і раніше, діють: відправники команд повинні відповідати політикам DM або allowlist/owner для кімнат так само, як і для звичайних повідомлень.

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

Значення верхнього рівня `channels.matrix` діють як типові для іменованих облікових записів, якщо обліковий запис не перевизначає їх.
Ви можете обмежити успадковані записи кімнат одним обліковим записом Matrix через `groups.<room>.account`.
Записи без `account` залишаються спільними для всіх облікових записів Matrix, а записи з `account: "default"` і далі працюють, коли типовий обліковий запис налаштовано безпосередньо на верхньому рівні `channels.matrix.*`.
Часткові спільні типові значення автентифікації самі по собі не створюють окремого неявного типового облікового запису. OpenClaw синтезує обліковий запис верхнього рівня `default` лише тоді, коли цей типовий обліковий запис має актуальну автентифікацію (`homeserver` плюс `accessToken` або `homeserver` плюс `userId` і `password`); іменовані облікові записи все одно можуть залишатися доступними для виявлення через `homeserver` плюс `userId`, коли кешовані облікові дані пізніше забезпечують автентифікацію.
Якщо Matrix уже має рівно один іменований обліковий запис або `defaultAccount` вказує на наявний ключ іменованого облікового запису, відновлення/підвищення від одного облікового запису до кількох під час setup зберігає цей обліковий запис замість створення нового запису `accounts.default`. До такого підвищеного облікового запису переміщуються лише ключі автентифікації/bootstrap Matrix; спільні ключі політики доставки залишаються на верхньому рівні.
Установіть `defaultAccount`, якщо хочете, щоб OpenClaw віддавав перевагу одному іменованому обліковому запису Matrix для неявної маршрутизації, перевірок і операцій CLI.
Якщо налаштовано кілька облікових записів Matrix і один ID облікового запису має значення `default`, OpenClaw неявно використовує цей обліковий запис, навіть коли `defaultAccount` не задано.
Якщо ви налаштовуєте кілька іменованих облікових записів, установіть `defaultAccount` або передавайте `--account <id>` для команд CLI, які залежать від неявного вибору облікового запису.
Передавайте `--account <id>` до `openclaw matrix verify ...` і `openclaw matrix devices ...`, коли хочете перевизначити цей неявний вибір для однієї команди.

Див. [Довідник із конфігурації](/uk/gateway/config-channels#multi-account-all-channels) щодо спільного шаблону для кількох облікових записів.

## Приватні/LAN homeserver

За замовчуванням OpenClaw блокує приватні/внутрішні homeserver Matrix для захисту від SSRF, якщо ви
явно не ввімкнете їх для кожного облікового запису окремо.

Якщо ваш homeserver працює на localhost, IP LAN/Tailscale або внутрішньому імені хоста, увімкніть
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

Це явне ввімкнення дозволяє лише довірені приватні/внутрішні цілі. Публічні homeserver без шифрування, такі як
`http://matrix.example.org:8008`, і далі блокуються. Коли можливо, надавайте перевагу `https://`.

## Проксіювання трафіку Matrix

Якщо вашому розгортанню Matrix потрібен явний вихідний HTTP(S)-проксі, установіть `channels.matrix.proxy`:

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
OpenClaw використовує той самий параметр проксі для runtime-трафіку Matrix і перевірок стану облікового запису.

## Визначення цілі

Matrix приймає такі форми цілей усюди, де OpenClaw просить вас указати ціль кімнати або користувача:

- Користувачі: `@user:server`, `user:@user:server` або `matrix:user:@user:server`
- Кімнати: `!room:server`, `room:!room:server` або `matrix:room:!room:server`
- Псевдоніми: `#alias:server`, `channel:#alias:server` або `matrix:channel:#alias:server`

Live directory lookup використовує обліковий запис Matrix, під яким виконано вхід:

- Пошук користувачів виконує запит до каталогу користувачів Matrix на цьому homeserver.
- Пошук кімнат напряму приймає явні ID кімнат і псевдоніми, а потім резервно переходить до пошуку за назвами кімнат, до яких приєднано цей обліковий запис.
- Пошук за назвами приєднаних кімнат є best-effort. Якщо назву кімнати неможливо визначити як ID або псевдонім, вона ігнорується під час runtime-розв’язання allowlist.

## Довідник із конфігурації

- `enabled`: увімкнути або вимкнути channel.
- `name`: необов’язкова мітка для облікового запису.
- `defaultAccount`: бажаний ID облікового запису, коли налаштовано кілька облікових записів Matrix.
- `homeserver`: URL homeserver, наприклад `https://matrix.example.org`.
- `network.dangerouslyAllowPrivateNetwork`: дозволити цьому обліковому запису Matrix підключатися до приватних/внутрішніх homeserver. Увімкніть це, якщо homeserver визначається як `localhost`, IP LAN/Tailscale або внутрішній хост, такий як `matrix-synapse`.
- `proxy`: необов’язковий URL HTTP(S)-проксі для трафіку Matrix. Іменовані облікові записи можуть перевизначати типове значення верхнього рівня власним `proxy`.
- `userId`: повний ID користувача Matrix, наприклад `@bot:example.org`.
- `accessToken`: access token для автентифікації на основі токена. Для `channels.matrix.accessToken` і `channels.matrix.accounts.<id>.accessToken` підтримуються як plaintext-значення, так і значення SecretRef у провайдерах env/file/exec. Див. [Керування секретами](/uk/gateway/secrets).
- `password`: пароль для входу на основі пароля. Підтримуються як plaintext-значення, так і значення SecretRef.
- `deviceId`: явний ID пристрою Matrix.
- `deviceName`: відображувана назва пристрою для входу за паролем.
- `avatarUrl`: збережений URL власного аватара для синхронізації профілю та оновлень `profile set`.
- `initialSyncLimit`: максимальна кількість подій, що отримуються під час стартової синхронізації.
- `encryption`: увімкнути E2EE.
- `allowlistOnly`: коли має значення `true`, підвищує політику кімнати `open` до `allowlist` і примусово переводить усі активні політики DM, крім `disabled` (включно з `pairing` і `open`), у `allowlist`. Не впливає на політики `disabled`.
- `allowBots`: дозволити повідомлення від інших налаштованих облікових записів OpenClaw Matrix (`true` або `"mentions"`).
- `groupPolicy`: `open`, `allowlist` або `disabled`.
- `contextVisibility`: режим видимості додаткового контексту кімнати (`all`, `allowlist`, `allowlist_quote`).
- `groupAllowFrom`: allowlist ID користувачів для трафіку кімнат. Повні ID користувачів Matrix є найбезпечнішими; точні збіги в каталозі визначаються під час запуску та коли allowlist змінюється під час роботи монітора. Невизначені імена ігноруються.
- `historyLimit`: максимальна кількість повідомлень кімнати, що включаються як контекст історії групи. Використовується резервне значення `messages.groupChat.historyLimit`; якщо обидва параметри не задані, фактичне типове значення — `0`. Установіть `0`, щоб вимкнути.
- `replyToMode`: `off`, `first`, `all` або `batched`.
- `markdown`: необов’язкова конфігурація рендерингу Markdown для вихідного тексту Matrix.
- `streaming`: `off` (типове значення), `"partial"`, `"quiet"`, `true` або `false`. `"partial"` і `true` вмикають оновлення чернеток у режимі preview-first зі звичайними текстовими повідомленнями Matrix. `"quiet"` використовує preview notice без сповіщень для self-hosted конфігурацій із push rules. `false` еквівалентне `"off"`.
- `blockStreaming`: `true` вмикає окремі повідомлення про поступ для завершених блоків асистента, поки активна потокова передача чернетки preview.
- `threadReplies`: `off`, `inbound` або `always`.
- `threadBindings`: перевизначення на рівні channel для маршрутизації та життєвого циклу сеансів, прив’язаних до тредів.
- `startupVerification`: режим автоматичного запиту self-verification під час запуску (`if-unverified`, `off`).
- `startupVerificationCooldownHours`: cooldown перед повторною спробою автоматичних запитів верифікації під час запуску.
- `textChunkLimit`: розмір фрагмента вихідного повідомлення в символах (застосовується, коли `chunkMode` має значення `length`).
- `chunkMode`: `length` розбиває повідомлення за кількістю символів; `newline` розбиває на межах рядків.
- `responsePrefix`: необов’язковий рядок, що додається на початок усіх вихідних відповідей для цього channel.
- `ackReaction`: необов’язкове перевизначення ack reaction для цього channel/облікового запису.
- `ackReactionScope`: необов’язкове перевизначення області дії ack reaction (`group-mentions`, `group-all`, `direct`, `all`, `none`, `off`).
- `reactionNotifications`: режим вхідних сповіщень про реакції (`own`, `off`).
- `mediaMaxMb`: ліміт розміру медіа в МБ для вихідних надсилань і обробки вхідних медіа.
- `autoJoin`: політика автоматичного приєднання за запрошенням (`always`, `allowlist`, `off`). Типове значення: `off`. Застосовується до всіх запрошень Matrix, включно із запрошеннями у стилі DM.
- `autoJoinAllowlist`: кімнати/псевдоніми, дозволені, коли `autoJoin` має значення `allowlist`. Записи псевдонімів визначаються до ID кімнат під час обробки запрошення; OpenClaw не довіряє стану псевдоніма, заявленому запрошеною кімнатою.
- `dm`: блок політики DM (`enabled`, `policy`, `allowFrom`, `sessionScope`, `threadReplies`).
- `dm.policy`: керує доступом до DM після того, як OpenClaw приєднався до кімнати та класифікував її як DM. Це не змінює, чи буде автоматично прийнято запрошення.
- `dm.allowFrom`: allowlist ID користувачів для трафіку DM. Повні ID користувачів Matrix є найбезпечнішими; точні збіги в каталозі визначаються під час запуску та коли allowlist змінюється під час роботи монітора. Невизначені імена ігноруються.
- `dm.sessionScope`: `per-user` (типове значення) або `per-room`. Використовуйте `per-room`, якщо хочете, щоб кожна кімната Matrix DM зберігала окремий контекст, навіть якщо співрозмовник той самий.
- `dm.threadReplies`: перевизначення політики тредів лише для DM (`off`, `inbound`, `always`). Воно перевизначає параметр верхнього рівня `threadReplies` як для розміщення відповідей, так і для ізоляції сеансів у DM.
- `execApprovals`: нативна доставка підтверджень exec у Matrix (`enabled`, `approvers`, `target`, `agentFilter`, `sessionFilter`).
- `execApprovals.approvers`: ID користувачів Matrix, яким дозволено підтверджувати запити exec. Необов’язковий параметр, якщо `dm.allowFrom` уже визначає тих, хто підтверджує.
- `execApprovals.target`: `dm | channel | both` (типове значення: `dm`).
- `accounts`: іменовані перевизначення для окремих облікових записів. Значення верхнього рівня `channels.matrix` діють як типові для цих записів.
- `groups`: карта політик для окремих кімнат. Надавайте перевагу ID кімнат або псевдонімам; невизначені назви кімнат ігноруються під час виконання. Ідентичність сеансу/групи після визначення використовує стабільний ID кімнати.
- `groups.<room>.account`: обмежити один успадкований запис кімнати певним обліковим записом Matrix у конфігураціях із кількома обліковими записами.
- `groups.<room>.allowBots`: перевизначення на рівні кімнати для відправників-ботів із конфігурації (`true` або `"mentions"`).
- `groups.<room>.users`: allowlist відправників для окремої кімнати.
- `groups.<room>.tools`: перевизначення allow/deny для інструментів у межах кімнати.
- `groups.<room>.autoReply`: перевизначення вимоги згадування на рівні кімнати. `true` вимикає вимогу згадування для цієї кімнати; `false` примусово знову вмикає її.
- `groups.<room>.skills`: необов’язковий фільтр Skills на рівні кімнати.
- `groups.<room>.systemPrompt`: необов’язковий фрагмент system prompt на рівні кімнати.
- `rooms`: застарілий псевдонім для `groups`.
- `actions`: керування доступом до інструментів для окремих дій (`messages`, `reactions`, `pins`, `profile`, `memberInfo`, `channelInfo`, `verification`).

## Пов’язане

- [Огляд Channels](/uk/channels) — усі підтримувані channels
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Groups](/uk/channels/groups) — поведінка групового чату та вимога згадування
- [Маршрутизація channel](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
