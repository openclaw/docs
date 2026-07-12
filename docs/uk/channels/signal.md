---
read_when:
    - Налаштування підтримки Signal
    - Налагодження надсилання й отримання повідомлень у Signal
summary: Підтримка Signal через signal-cli (нативний демон або контейнер bbernhard), способи налаштування та модель номерів
title: Signal
x-i18n:
    generated_at: "2026-07-12T13:00:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: db2497d0d6dcdc61cf9f7388929f9ee107602c9ed97bd248e20e67519e878b8b
    source_path: channels/signal.md
    workflow: 16
---

Signal — це завантажуваний плагін каналу (`@openclaw/signal`). Gateway взаємодіє із `signal-cli` через HTTP: або з нативним демоном (JSON-RPC + SSE), або з контейнером [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw не містить вбудованої libsignal.

## Модель номерів (спочатку прочитайте це)

- Gateway підключається до **пристрою Signal**: облікового запису `signal-cli`.
- Якщо запустити бота у **вашому особистому обліковому записі Signal**, він ігноруватиме ваші власні повідомлення (захист від зациклення).
- Щоб реалізувати сценарій «я пишу боту, а він відповідає», використовуйте **окремий номер бота**.

## Встановлення

```bash
openclaw plugins install @openclaw/signal
```

Для специфікацій плагінів без префікса спочатку виконується спроба встановлення з ClawHub, а потім резервна спроба з npm. Щоб примусово вибрати джерело, використовуйте `openclaw plugins install clawhub:@openclaw/signal` або `npm:@openclaw/signal`. Команда `plugins install` реєструє та вмикає плагін; окремий крок `enable` не потрібен. Загальні правила встановлення наведено в розділі [Плагіни](/uk/tools/plugin).

## Швидке налаштування

<Steps>
  <Step title="Виберіть номер">
    Використовуйте для бота **окремий номер Signal** (рекомендовано).
  </Step>
  <Step title="Встановіть плагін">
    ```bash
    openclaw plugins install @openclaw/signal
    ```
  </Step>
  <Step title="Запустіть кероване налаштування">
    ```bash
    openclaw channels add
    ```
    Майстер визначає, чи доступний `signal-cli` у `PATH`, а якщо ні — пропонує його встановити: завантажує офіційну нативну збірку GraalVM для Linux x86-64 або встановлює через Homebrew на macOS та інших архітектурах. Потім він запитує номер бота та шлях до `signal-cli`.
  </Step>
  <Step title="Прив’яжіть або зареєструйте обліковий запис">
    - **Прив’язування за QR-кодом (найшвидше):** `signal-cli link -n "OpenClaw"`, потім відскануйте код у Signal. Див. [Шлях A](#setup-path-a-link-existing-signal-account-qr).
    - **Реєстрація через SMS:** окремий номер із перевіркою captcha та SMS. Див. [Шлях B](#setup-path-b-register-dedicated-bot-number-sms-linux).

  </Step>
  <Step title="Перевірте та створіть пару">
    ```bash
    openclaw gateway call channels.status --params '{"probe":true}'
    ```
    Надішліть перше приватне повідомлення та схваліть створення пари: `openclaw pairing approve signal <CODE>`.
  </Step>
</Steps>

Мінімальна конфігурація:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

| Поле         | Опис                                                        |
| ------------ | ----------------------------------------------------------- |
| `account`    | Номер телефону бота у форматі E.164 (`+15551234567`)         |
| `cliPath`    | Шлях до `signal-cli` (`signal-cli`, якщо він доступний у `PATH`) |
| `configPath` | Каталог конфігурації signal-cli, переданий як `--config`     |
| `dmPolicy`   | Політика доступу до приватних повідомлень (рекомендовано `pairing`) |
| `allowFrom`  | Номери телефонів або значення `uuid:<id>`, яким дозволено надсилати приватні повідомлення |

Підтримка кількох облікових записів: використовуйте `channels.signal.accounts` із конфігурацією для кожного облікового запису та необов’язковим `name`. Спільний шаблон описано в розділі [Канали з кількома обліковими записами](/uk/gateway/config-channels#multi-account-all-channels).

## Що це таке

- Детермінізована маршрутизація: відповіді завжди повертаються до Signal.
- Приватні повідомлення використовують основний сеанс агента; групи ізольовані (`agent:<agentId>:signal:group:<groupId>`).
- За замовчуванням Signal може записувати зміни конфігурації, ініційовані командою `/config set|unset` (потрібно `commands.config: true`). Щоб вимкнути це, установіть `channels.signal.configWrites: false`.

## Шлях налаштування A: прив’язування наявного облікового запису Signal (QR-код)

1. Установіть `signal-cli` (JVM або нативну збірку) чи дозвольте `openclaw channels add` установити його.
2. Прив’яжіть обліковий запис бота: `signal-cli link -n "OpenClaw"`, потім відскануйте QR-код у Signal.
3. Налаштуйте Signal і запустіть Gateway.

## Шлях налаштування B: реєстрація окремого номера бота (SMS, Linux)

Використовуйте цей спосіб для окремого номера бота замість прив’язування наявного облікового запису застосунку Signal. Наведений нижче процес перевірено на Ubuntu 24.

1. Отримайте номер, який може приймати SMS (або голосовий виклик для перевірки стаціонарних номерів). Окремий номер бота дає змогу уникнути конфліктів облікового запису або сеансу.
2. Установіть `signal-cli` на хості Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Якщо ви використовуєте збірку JVM (`signal-cli-${VERSION}.tar.gz`), спочатку встановіть JRE. Регулярно оновлюйте `signal-cli`: розробники зазначають, що старі випуски можуть перестати працювати через зміни серверних API Signal.

3. Зареєструйте та підтвердьте номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Якщо потрібна captcha (для виконання цього кроку необхідний доступ до браузера):

1. Відкрийте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдіть captcha та скопіюйте цільове посилання `signalcaptcha://...` з "Open Signal".
3. За можливості запускайте команду з тієї самої зовнішньої IP-адреси, що й сеанс браузера (строк дії токенів captcha швидко спливає).
4. Негайно зареєструйте та підтвердьте номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Налаштуйте OpenClaw, перезапустіть Gateway і перевірте канал:

```bash
# Якщо Gateway запущено як користувацьку службу systemd:
systemctl --user restart openclaw-gateway.service

# Потім виконайте перевірку:
openclaw doctor
openclaw channels status --probe
```

5. Створіть пару з відправником приватних повідомлень:
   - Надішліть будь-яке повідомлення на номер бота.
   - Схваліть на сервері: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Збережіть номер бота як контакт у телефоні, щоб уникнути позначки "Unknown contact".

<Warning>
Реєстрація облікового запису з номером телефону через `signal-cli` може скасувати автентифікацію основного сеансу застосунку Signal для цього номера. Віддавайте перевагу окремому номеру бота або використовуйте режим прив’язування за QR-кодом, щоб зберегти наявне налаштування застосунку на телефоні.
</Warning>

Посилання на першоджерела:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Процес captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Процес прив’язування: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Режим зовнішнього демона (httpUrl)

Щоб самостійно керувати `signal-cli` (повільний холодний запуск JVM, ініціалізація контейнера, спільні ресурси процесора), запустіть демон окремо та спрямуйте OpenClaw до нього:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

У цьому разі автоматичний запуск і очікування OpenClaw під час запуску пропускаються. Для повільного автоматичного запуску задайте `channels.signal.startupTimeoutMs`.

## Режим контейнера (bbernhard/signal-cli-rest-api)

Замість нативного запуску `signal-cli` використовуйте Docker-контейнер [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), який надає доступ до `signal-cli` через інтерфейс REST + WebSocket.

Вимоги:

- Для отримання повідомлень у реальному часі контейнер **має** працювати з `MODE=json-rpc`.
- Зареєструйте або прив’яжіть свій обліковий запис Signal усередині контейнера, перш ніж підключати OpenClaw.

Приклад служби `docker-compose.yml`:

```yaml
signal-cli:
  image: bbernhard/signal-cli-rest-api:latest
  environment:
    MODE: json-rpc
  ports:
    - "8080:8080"
  volumes:
    - signal-cli-data:/home/.local/share/signal-cli
```

Конфігурація OpenClaw:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      httpUrl: "http://signal-cli:8080",
      autoStart: false,
      apiMode: "container", // або "auto" для автоматичного визначення
    },
  },
}
```

`apiMode` визначає, який протокол використовує OpenClaw:

| Значення      | Поведінка                                                                            |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (За замовчуванням) Перевіряє обидва транспорти; потоковий режим перевіряє отримання через WebSocket контейнера |
| `"native"`    | Примусово використовує нативний signal-cli (JSON-RPC на `/api/v1/rpc`, SSE на `/api/v1/events`) |
| `"container"` | Примусово використовує контейнер bbernhard (REST на `/v2/send`, WebSocket на `/v1/receive/{account}`) |

Коли `apiMode` має значення `"auto"`, OpenClaw кешує визначений режим на 30 секунд для кожної URL-адреси демона, щоб уникнути повторних перевірок (нативний режим має пріоритет, якщо обидва транспорти справні). Отримання через контейнер вибирається для потокового режиму лише після оновлення з’єднання `/v1/receive/{account}` до WebSocket, для чого потрібно `MODE=json-rpc`.

Режим контейнера підтримує ті самі операції Signal, що й нативний режим, якщо контейнер надає відповідні API: надсилання, отримання, вкладення, індикатори набору тексту, підтвердження прочитання та перегляду, реакції, групи й форматований текст. OpenClaw перетворює нативні RPC-виклики Signal на корисні навантаження REST контейнера, зокрема ідентифікатори груп `group.{base64(internal_id)}` і `text_mode: "styled"` для форматованого тексту.

Примітки щодо експлуатації:

- Використовуйте `autoStart: false` у режимі контейнера; OpenClaw не повинен запускати нативний демон, коли вибрано `apiMode: "container"`.
- Для отримання повідомлень використовуйте `MODE=json-rpc`. За `MODE=normal` ендпоінт `/v1/about` може виглядати справним, але `/v1/receive/{account}` не оновить з’єднання до WebSocket, тому OpenClaw не вибере потокове отримання через контейнер у режимі `auto`.
- Установіть `apiMode: "container"`, коли `httpUrl` вказує на REST API bbernhard, `"native"` — коли він вказує на JSON-RPC/SSE нативного `signal-cli`, і `"auto"` — коли розгортання може відрізнятися.
- Завантаження вкладень у режимі контейнера підпорядковується тим самим обмеженням розміру медіаданих у байтах, що й нативний режим. Завеликі відповіді відхиляються до повної буферизації, якщо сервер надсилає `Content-Length`, а в інших випадках — під час потокового передавання.

## Керування доступом (приватні повідомлення та групи)

Приватні повідомлення:

- За замовчуванням: `channels.signal.dmPolicy = "pairing"`.
- Невідомі відправники отримують код створення пари; повідомлення ігноруються до схвалення (строк дії кодів спливає через 1 годину).
- Схвалюйте за допомогою `openclaw pairing list signal` і `openclaw pairing approve signal <CODE>`.
- Створення пари — стандартний обмін токенами для приватних повідомлень Signal. Докладніше: [Створення пари](/uk/channels/pairing)
- Відправники лише з UUID (із `sourceUuid`) зберігаються як `uuid:<id>` у `channels.signal.allowFrom`.

Групи:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` визначає, які групи або відправники можуть ініціювати відповіді в групах, коли встановлено `allowlist`; значеннями можуть бути ідентифікатори груп Signal (необроблені, `group:<id>` або `signal:group:<id>`), номери телефонів відправників, значення `uuid:<id>` або `*`.
- `channels.signal.groups["<group-id>" | "*"]` може перевизначати поведінку групи за допомогою `requireMention`, `tools` і `toolsBySender`.
- Використовуйте `channels.signal.accounts.<id>.groups` для перевизначень на рівні облікового запису в конфігураціях із кількома обліковими записами.
- Додавання групи до списку дозволених через `groupAllowFrom` саме по собі не вимикає вимогу згадування. Явно налаштований запис `channels.signal.groups["<group-id>"]` обробляє кожне повідомлення групи, якщо явно не встановлено `requireMention: true`.
- Примітка щодо виконання: якщо `channels.signal` повністю відсутній, середовище виконання використовує резервне значення `groupPolicy="allowlist"` для перевірок груп (навіть якщо встановлено `channels.defaults.groupPolicy`).

## Як це працює (поведінка)

- Нативний режим: `signal-cli` працює як демон; Gateway читає події через SSE.
- Режим контейнера: Gateway надсилає дані через REST API та отримує їх через WebSocket.
- Вхідні повідомлення нормалізуються у спільний конверт каналу.
- Відповіді завжди маршрутизуються назад до того самого номера або групи.
- Відповіді на вхідні повідомлення містять нативні метадані цитування Signal, якщо серверна частина приймає позначку часу та автора вхідного повідомлення; якщо метадані цитування відсутні або відхилені, OpenClaw надсилає відповідь як звичайне повідомлення.
- Налаштуйте використання нативного цитування через `channels.signal.replyToMode = off | first | all | batched` або `channels.signal.replyToModeByChatType.direct/group` для перевизначень за типом чату. Значення на рівні облікового запису в `channels.signal.accounts.<id>` мають пріоритет.

## Медіафайли та обмеження

- Вихідний текст розбивається на фрагменти відповідно до `channels.signal.textChunkLimit` (типове значення — 4000).
- Необов’язкове розбиття за новими рядками: установіть `channels.signal.chunkMode="newline"`, щоб перед розбиттям за довжиною розділяти текст за порожніми рядками (межами абзаців).
- Вкладення підтримуються (отримуються з `signal-cli` у форматі base64).
- Для вкладень із голосовими повідомленнями використовується ім’я файлу від `signal-cli` як резервне джерело MIME-типу, якщо `contentType` відсутній, тому транскрибування аудіо все одно може розпізнати голосові нотатки AAC.
- Типове обмеження медіафайлів: `channels.signal.mediaMaxMb` (типове значення — 8).
- Використовуйте `channels.signal.ignoreAttachments`, щоб не завантажувати медіафайли.
- Контекст історії групи використовує `channels.signal.historyLimit` (або `channels.signal.accounts.*.historyLimit`) із резервним переходом до `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути цю функцію (типове значення — 50).

## Індикатори введення та сповіщення про прочитання

- **Індикатори введення**: OpenClaw надсилає сигнали введення через `signal-cli sendTyping` і поновлює їх, поки формується відповідь.
- **Сповіщення про прочитання**: коли `channels.signal.sendReadReceipts` має значення true, OpenClaw пересилає сповіщення про прочитання для дозволених приватних повідомлень.
- `signal-cli` не надає сповіщень про прочитання для груп.

## Реакції стану життєвого циклу

Установіть `messages.statusReactions.enabled: true`, щоб Signal показував спільний життєвий цикл реакцій «у черзі»/«обмірковування»/«інструмент»/Compaction/«завершено»/«помилка» для вхідних звернень. Signal використовує часову позначку вхідного повідомлення як ціль реакції; групові реакції надсилаються з ідентифікатором групи Signal, а автором цілі вказується початковий відправник.

Для реакцій стану також потрібна реакція-підтвердження та відповідне значення `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` або `all`). Установіть `channels.signal.reactionLevel: "off"`, щоб вимкнути реакції стану Signal.

`messages.removeAckAfterReply: true` видаляє остаточну реакцію стану після налаштованого часу утримання. Інакше Signal відновлює початкову реакцію-підтвердження після остаточного стану завершення або помилки.

## Реакції (інструмент повідомлень)

Використовуйте `message action=react` із `channel=signal`.

- Цілі: E.164 або UUID відправника (використовуйте `uuid:<id>` із результату сполучення; також працює UUID без префікса).
- `messageId` — це часова позначка Signal для повідомлення, на яке ви реагуєте.
- Для групових реакцій потрібен `targetAuthor` або `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Конфігурація:

- `channels.signal.actions.reactions`: увімкнути або вимкнути дії з реакціями (типове значення — true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (типове значення — `minimal`).
  - `off`/`ack` вимикає реакції агента (інструмент повідомлень `react` повертає помилки).
  - `minimal`/`extensive` вмикає реакції агента та задає рівень рекомендацій.
- Перевизначення для окремих облікових записів: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Реакції схвалення

Запити на схвалення виконання команд і плагінів у Signal використовують блоки маршрутизації верхнього рівня `approvals.exec` і `approvals.plugin`. У Signal немає блоку `channels.signal.execApprovals`.

- `👍` схвалює один раз.
- `👎` відхиляє.
- Використовуйте `/approve <id> allow-always`, якщо запит передбачає постійне схвалення.

Обробка реакцій схвалення потребує явно вказаних осіб, уповноважених схвалювати в Signal, у `channels.signal.allowFrom`, `channels.signal.defaultTo` або у відповідних полях рівня облікового запису. Прямі запити на схвалення виконання команд у тому самому чаті можуть і без явно вказаних уповноважених осіб приховувати дубльований локальний резервний варіант `/approve`; для групових схвалень без уповноважених осіб локальний резервний варіант залишається видимим.

## Цілі доставки (CLI/Cron)

- Приватні повідомлення: `signal:+15551234567` (або звичайний номер E.164).
- Приватні повідомлення за UUID: `uuid:<id>` (або UUID без префікса).
- Групи: `signal:group:<groupId>`.
- Імена користувачів: `username:<name>` (якщо підтримується вашим обліковим записом Signal).

## Псевдоніми

Налаштуйте псевдоніми для сталих назв цілей Signal, які використовуються повторно. Псевдоніми існують лише в конфігурації OpenClaw; вони не створюють і не редагують контакти Signal.

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
        jane: "uuid:123e4567-e89b-12d3-a456-426614174000",
        ops: "group:<groupId>",
      },
      defaultTo: "signal:me",
    },
  },
}
```

Використовуйте псевдоніми всюди, де приймаються цілі доставки Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Псевдоніми окремого облікового запису успадковують псевдоніми верхнього рівня та можуть додавати або перевизначати назви:

```json5
{
  channels: {
    signal: {
      aliases: {
        me: "+15557654321",
      },
      accounts: {
        work: {
          aliases: {
            ops: "group:<workGroupId>",
          },
        },
      },
    },
  },
}
```

`openclaw directory peers list --channel signal` і `openclaw directory groups list --channel signal` виводять налаштовані псевдоніми. Каталог Signal базується на конфігурації; він не опитує контакти Signal у реальному часі та не змінює обліковий запис Signal.

## Усунення несправностей

Спочатку виконайте цю послідовність:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Потім за потреби перевірте стан сполучення приватних повідомлень:

```bash
openclaw pairing list signal
```

Поширені помилки:

- Демон доступний, але відповідей немає: перевірте налаштування облікового запису та демона (`httpUrl`, `account`), а також режим отримання.
- Приватні повідомлення ігноруються: відправник очікує схвалення сполучення.
- Групові повідомлення ігноруються: обмеження за відправником або згадкою в групі блокують доставку.
- Помилки перевірки конфігурації після редагування: виконайте `openclaw doctor --fix`.
- Signal відсутній у діагностиці: переконайтеся, що встановлено `channels.signal.enabled: true`.

Додаткові перевірки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Процес діагностики описано в розділі [Усунення несправностей каналів](/uk/channels/troubleshooting).

## Примітки щодо безпеки

- `signal-cli` зберігає ключі облікового запису локально (зазвичай у `~/.local/share/signal-cli/data/`).
- Перед міграцією або повторним розгортанням сервера створіть резервну копію стану облікового запису Signal.
- Залишайте `channels.signal.dmPolicy: "pairing"`, якщо вам явно не потрібен ширший доступ до приватних повідомлень.
- SMS-перевірка потрібна лише для реєстрації або відновлення, але втрата контролю над номером чи обліковим записом може ускладнити повторну реєстрацію.

## Довідник із конфігурації (Signal)

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри постачальника:

- `channels.signal.enabled`: увімкнути або вимкнути запуск каналу.
- `channels.signal.apiMode`: `auto | native | container` (типове значення — auto). Див. [Контейнерний режим](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: номер E.164 облікового запису бота.
- `channels.signal.cliPath`: шлях до `signal-cli`.
- `channels.signal.configPath`: необов’язковий каталог `signal-cli --config`.
- `channels.signal.httpUrl`: повна URL-адреса демона (перевизначає хост і порт).
- `channels.signal.httpHost`, `channels.signal.httpPort`: прив’язка демона (типове значення — `127.0.0.1:8080`).
- `channels.signal.autoStart`: автоматично запускати демон (типове значення — true, якщо `httpUrl` не задано).
- `channels.signal.startupTimeoutMs`: граничний час очікування запуску в мс (мінімум 1000, максимум 120000; типове значення — 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: не завантажувати вкладення.
- `channels.signal.ignoreStories`: ігнорувати історії від демона.
- `channels.signal.sendReadReceipts`: пересилати сповіщення про прочитання.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (типове значення — pairing).
- `channels.signal.allowFrom`: список дозволених відправників приватних повідомлень (E.164 або `uuid:<id>`). Для `open` потрібно `"*"`. Signal не має імен користувачів; використовуйте ідентифікатори телефону або UUID.
- `channels.signal.aliases`: псевдоніми OpenClaw для цілей доставки приватних або групових повідомлень.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (типове значення — allowlist).
- `channels.signal.groupAllowFrom`: список дозволених для груп; приймає ідентифікатори груп Signal (без префікса, `group:<id>` або `signal:group:<id>`), номери E.164 відправників або значення `uuid:<id>`.
- `channels.signal.groups`: перевизначення для окремих груп, ключами яких є ідентифікатори груп Signal (або `"*"`). Підтримувані поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: версія `channels.signal.groups` для окремого облікового запису в конфігураціях із кількома обліковими записами.
- `channels.signal.accounts.<id>.aliases`: псевдоніми окремого облікового запису, об’єднані з псевдонімами верхнього рівня.
- `channels.signal.replyToMode`: режим вбудованого цитування відповіді, `off | first | all | batched` (типове значення — `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: перевизначення вбудованого цитування відповіді для окремих типів чатів.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: перевизначення цитування відповіді для окремих облікових записів.
- `channels.signal.historyLimit`: максимальна кількість групових повідомлень, які включаються до контексту (0 вимикає).
- `channels.signal.dmHistoryLimit`: обмеження історії приватних повідомлень у зверненнях користувача. Перевизначення для окремих користувачів: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: розмір вихідного фрагмента в символах (типове значення — 4000).
- `channels.signal.chunkMode`: `length` (типове значення) або `newline`, щоб перед розбиттям за довжиною розділяти текст за порожніми рядками (межами абзаців).
- `channels.signal.mediaMaxMb`: обмеження розміру вхідних і вихідних медіафайлів у МБ (типове значення — 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (типове значення — `minimal`). Див. [Реакції](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (типове значення — `own`) — визначає, коли агент отримує сповіщення про вхідні реакції інших користувачів.
- `channels.signal.reactionAllowlist`: відправники, реакції яких сповіщають агента, коли `reactionNotifications: "allowlist"`.
- `channels.signal.blockStreaming`, `channels.signal.blockStreamingCoalesce`: спільні для каналів засоби керування потоковою передачею в блоковому режимі. Див. [Потокова передача](/uk/concepts/streaming).

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (Signal не підтримує вбудовані згадки).
- `messages.groupChat.mentionPatterns` (глобальний резервний варіант).
- `messages.responsePrefix`.

## Пов’язані матеріали

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація приватних повідомлень і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
