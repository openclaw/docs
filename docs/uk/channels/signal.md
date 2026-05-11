---
read_when:
    - Налаштування підтримки Signal
    - Налагодження надсилання/отримання в Signal
summary: Підтримка Signal через signal-cli (нативний демон або контейнер bbernhard), шляхи налаштування та модель номерів
title: Signal
x-i18n:
    generated_at: "2026-05-11T20:21:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d92f94f6c1363a795366501bb5c6d5f09756c03f156b482d17021c276e3577c
    source_path: channels/signal.md
    workflow: 16
---

Статус: інтеграція зовнішнього CLI. Gateway взаємодіє з `signal-cli` через HTTP — або з нативним демоном (JSON-RPC + SSE), або з контейнером bbernhard/signal-cli-rest-api (REST + WebSocket).

## Передумови

- OpenClaw встановлено на вашому сервері (Linux-процес нижче протестовано на Ubuntu 24).
- Одне з наведеного:
  - `signal-cli` доступний на хості (нативний режим), **або**
  - Docker-контейнер `bbernhard/signal-cli-rest-api` (контейнерний режим).
- Номер телефону, який може отримати одне SMS для перевірки (для шляху реєстрації через SMS).
- Доступ до браузера для капчі Signal (`signalcaptchas.org`) під час реєстрації.

## Швидке налаштування (для початківців)

1. Використовуйте **окремий номер Signal** для бота (рекомендовано).
2. Встановіть `signal-cli` (потрібна Java, якщо ви використовуєте JVM-збірку).
3. Виберіть один шлях налаштування:
   - **Шлях A (зв’язування через QR):** `signal-cli link -n "OpenClaw"` і відскануйте в Signal.
   - **Шлях B (реєстрація через SMS):** зареєструйте виділений номер із капчею та SMS-перевіркою.
4. Налаштуйте OpenClaw і перезапустіть Gateway.
5. Надішліть перше приватне повідомлення й підтвердьте сполучення (`openclaw pairing approve signal <CODE>`).

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

Довідник полів:

| Поле        | Опис                                                              |
| ----------- | ----------------------------------------------------------------- |
| `account`   | Номер телефону бота у форматі E.164 (`+15551234567`)              |
| `cliPath`   | Шлях до `signal-cli` (`signal-cli`, якщо він у `PATH`)            |
| `dmPolicy`  | Політика доступу до приватних повідомлень (рекомендовано `pairing`) |
| `allowFrom` | Номери телефонів або значення `uuid:<id>`, яким дозволено надсилати приватні повідомлення |

## Що це таке

- Канал Signal через `signal-cli` (не вбудований libsignal).
- Детермінізована маршрутизація: відповіді завжди повертаються до Signal.
- Приватні повідомлення використовують основний сеанс агента; групи ізольовані (`agent:<agentId>:signal:group:<groupId>`).

## Записи конфігурації

За замовчуванням Signal дозволено записувати оновлення конфігурації, спричинені `/config set|unset` (потрібно `commands.config: true`).

Вимкнення:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Модель номера (важливо)

- Gateway підключається до **пристрою Signal** (облікового запису `signal-cli`).
- Якщо ви запускаєте бота на **своєму особистому обліковому записі Signal**, він ігноруватиме ваші власні повідомлення (захист від циклів).
- Для сценарію «я пишу боту, і він відповідає» використовуйте **окремий номер бота**.

## Шлях налаштування A: зв’язати наявний обліковий запис Signal (QR)

1. Встановіть `signal-cli` (JVM або нативну збірку).
2. Зв’яжіть обліковий запис бота:
   - `signal-cli link -n "OpenClaw"`, потім відскануйте QR у Signal.
3. Налаштуйте Signal і запустіть Gateway.

Приклад:

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

Підтримка кількох облікових записів: використовуйте `channels.signal.accounts` з конфігурацією для кожного облікового запису та необов’язковим `name`. Див. [`gateway/configuration`](/uk/gateway/config-channels#multi-account-all-channels) для спільного шаблону.

## Шлях налаштування B: зареєструвати виділений номер бота (SMS, Linux)

Використовуйте це, коли потрібен виділений номер бота замість зв’язування наявного облікового запису застосунку Signal.

1. Отримайте номер, який може приймати SMS (або голосову перевірку для стаціонарних номерів).
   - Використовуйте виділений номер бота, щоб уникнути конфліктів облікового запису або сеансу.
2. Встановіть `signal-cli` на хості Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Якщо ви використовуєте JVM-збірку (`signal-cli-${VERSION}.tar.gz`), спочатку встановіть JRE 25+.
Підтримуйте `signal-cli` в актуальному стані; upstream зазначає, що старі випуски можуть ламатися зі змінами API серверів Signal.

3. Зареєструйте й перевірте номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Якщо потрібна капча:

1. Відкрийте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдіть капчу, скопіюйте цільове посилання `signalcaptcha://...` з «Open Signal».
3. За можливості виконуйте з тієї самої зовнішньої IP-адреси, що й сеанс браузера.
4. Негайно повторіть реєстрацію (токени капчі швидко спливають):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Налаштуйте OpenClaw, перезапустіть Gateway, перевірте канал:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Сполучіть свого відправника приватних повідомлень:
   - Надішліть будь-яке повідомлення на номер бота.
   - Підтвердьте код на сервері: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Збережіть номер бота як контакт на телефоні, щоб уникнути «Unknown contact».

<Warning>
Реєстрація облікового запису номера телефону через `signal-cli` може деавторизувати основний сеанс застосунку Signal для цього номера. Надавайте перевагу виділеному номеру бота або використовуйте режим зв’язування через QR, якщо потрібно зберегти наявне налаштування телефонного застосунку.
</Warning>

Upstream-посилання:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Потік капчі: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Потік зв’язування: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Режим зовнішнього демона (httpUrl)

Якщо ви хочете керувати `signal-cli` самостійно (повільні холодні запуски JVM, ініціалізація контейнера або спільні CPU), запустіть демон окремо й вкажіть OpenClaw на нього:

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

Це пропускає автозапуск і очікування запуску всередині OpenClaw. Для повільних запусків під час автозапуску задайте `channels.signal.startupTimeoutMs`.

## Контейнерний режим (bbernhard/signal-cli-rest-api)

Замість нативного запуску `signal-cli` можна використати Docker-контейнер [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Він обгортає `signal-cli` REST API та WebSocket-інтерфейсом.

Вимоги:

- Контейнер **має** запускатися з `MODE=json-rpc` для отримання повідомлень у реальному часі.
- Зареєструйте або зв’яжіть обліковий запис Signal усередині контейнера перед підключенням OpenClaw.

Приклад сервісу `docker-compose.yml`:

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
      apiMode: "container", // or "auto" to detect automatically
    },
  },
}
```

Поле `apiMode` керує тим, який протокол використовує OpenClaw:

| Значення     | Поведінка                                                                            |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (За замовчуванням) Перевіряє обидва транспорти; streaming перевіряє отримання через WebSocket контейнера |
| `"native"`    | Примусово використовує нативний signal-cli (JSON-RPC на `/api/v1/rpc`, SSE на `/api/v1/events`) |
| `"container"` | Примусово використовує контейнер bbernhard (REST на `/v2/send`, WebSocket на `/v1/receive/{account}`) |

Коли `apiMode` дорівнює `"auto"`, OpenClaw кешує виявлений режим на 30 секунд, щоб уникнути повторних перевірок. Отримання через контейнер вибирається для streaming лише після того, як `/v1/receive/{account}` оновлюється до WebSocket, що потребує `MODE=json-rpc`.

Контейнерний режим підтримує ті самі операції каналу Signal, що й нативний режим, якщо контейнер надає відповідні API: надсилання, отримання, вкладення, індикатори набору, квитанції про прочитання/перегляд, реакції, групи та стилізований текст. OpenClaw перетворює свої нативні RPC-виклики Signal у REST-навантаження контейнера, зокрема ID груп `group.{base64(internal_id)}` і `text_mode: "styled"` для форматованого тексту.

Операційні примітки:

- Використовуйте `autoStart: false` з контейнерним режимом. OpenClaw не має запускати нативний демон, коли вибрано `apiMode: "container"`.
- Використовуйте `MODE=json-rpc` для отримання. `MODE=normal` може зробити `/v1/about` справним на вигляд, але `/v1/receive/{account}` не виконує WebSocket-upgrade, тож OpenClaw не вибере streaming отримання через контейнер у режимі `auto`.
- Задайте `apiMode: "container"`, коли ви знаєте, що `httpUrl` вказує на REST API bbernhard. Задайте `apiMode: "native"`, коли ви знаєте, що він вказує на нативний JSON-RPC/SSE `signal-cli`. Використовуйте `"auto"`, коли розгортання може відрізнятися.
- Завантаження вкладень у контейнерному режимі дотримуються тих самих обмежень байтів медіа, що й нативний режим. Завеликі відповіді відхиляються до повного буферизування, якщо сервер надсилає `Content-Length`, і під час streaming в інших випадках.

## Контроль доступу (приватні повідомлення + групи)

Приватні повідомлення:

- За замовчуванням: `channels.signal.dmPolicy = "pairing"`.
- Невідомі відправники отримують код сполучення; повідомлення ігноруються до підтвердження (коди спливають через 1 годину).
- Підтвердьте через:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Сполучення є стандартним обміном токенами для приватних повідомлень Signal. Докладніше: [Сполучення](/uk/channels/pairing)
- Відправники лише з UUID (із `sourceUuid`) зберігаються як `uuid:<id>` у `channels.signal.allowFrom`.

Групи:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` керує тим, які групи або відправники можуть запускати групові відповіді, коли задано `allowlist`; записи можуть бути ID груп Signal (raw, `group:<id>` або `signal:group:<id>`), номерами телефонів відправників, значеннями `uuid:<id>` або `*`.
- `channels.signal.groups["<group-id>" | "*"]` може перевизначати поведінку групи за допомогою `requireMention`, `tools` і `toolsBySender`.
- Використовуйте `channels.signal.accounts.<id>.groups` для перевизначень на рівні облікового запису в налаштуваннях із кількома обліковими записами.
- Додавання групи Signal до allowlist через `groupAllowFrom` саме по собі не вимикає вимогу згадки. Спеціально налаштований запис `channels.signal.groups["<group-id>"]` обробляє кожне повідомлення групи, якщо не задано `requireMention=true`.
- Примітка часу виконання: якщо `channels.signal` повністю відсутній, середовище виконання відступає до `groupPolicy="allowlist"` для перевірок груп (навіть якщо задано `channels.defaults.groupPolicy`).

## Як це працює (поведінка)

- Нативний режим: `signal-cli` працює як демон; Gateway читає події через SSE.
- Контейнерний режим: Gateway надсилає через REST API й отримує через WebSocket.
- Вхідні повідомлення нормалізуються до спільного конверта каналу.
- Відповіді завжди маршрутизуються назад до того самого номера або групи.

## Медіа + обмеження

- Вихідний текст розбивається на фрагменти до `channels.signal.textChunkLimit` (за замовчуванням 4000).
- Необов’язкове розбиття за новими рядками: задайте `channels.signal.chunkMode="newline"`, щоб розділяти за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- Вкладення підтримуються (base64 отримується з `signal-cli`).
- Вкладення голосових нотаток використовують ім’я файлу `signal-cli` як MIME-запасний варіант, коли `contentType` відсутній, тож транскрипція аудіо все ще може класифікувати голосові нотатки AAC.
- Стандартне обмеження медіа: `channels.signal.mediaMaxMb` (за замовчуванням 8).
- Використовуйте `channels.signal.ignoreAttachments`, щоб пропускати завантаження медіа.
- Контекст історії групи використовує `channels.signal.historyLimit` (або `channels.signal.accounts.*.historyLimit`) із відступом до `messages.groupChat.historyLimit`. Задайте `0`, щоб вимкнути (за замовчуванням 50).

## Набір тексту + квитанції про прочитання

- **Індикатори набору**: OpenClaw надсилає сигнали набору через `signal-cli sendTyping` і оновлює їх, поки виконується відповідь.
- **Квитанції про прочитання**: коли `channels.signal.sendReadReceipts` має значення true, OpenClaw пересилає квитанції про прочитання для дозволених приватних повідомлень.
- Signal-cli не надає квитанції про прочитання для груп.

## Реакції (інструмент повідомлень)

- Використовуйте `message action=react` з `channel=signal`.
- Цілі: E.164 відправника або UUID (використовуйте `uuid:<id>` з виводу сполучення; простий UUID також працює).
- `messageId` — це timestamp Signal для повідомлення, на яке ви реагуєте.
- Реакції в групах потребують `targetAuthor` або `targetAuthorUuid`.

Приклади:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Конфігурація:

- `channels.signal.actions.reactions`: увімкнути/вимкнути дії реакцій (типово true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` вимикає реакції агента (інструмент повідомлень `react` поверне помилку).
  - `minimal`/`extensive` вмикає реакції агента та задає рівень настанов.
- Перевизначення для окремих облікових записів: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Цілі доставки (CLI/Cron)

- Особисті повідомлення: `signal:+15551234567` (або простий E.164).
- Особисті повідомлення UUID: `uuid:<id>` (або простий UUID).
- Групи: `signal:group:<groupId>`.
- Імена користувачів: `username:<name>` (якщо підтримується вашим обліковим записом Signal).

## Усунення несправностей

Спочатку виконайте цю послідовність:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Потім за потреби підтвердьте стан сполучення для особистих повідомлень:

```bash
openclaw pairing list signal
```

Поширені збої:

- Демон доступний, але відповідей немає: перевірте налаштування облікового запису/демона (`httpUrl`, `account`) і режим отримання.
- Особисті повідомлення ігноруються: відправник очікує схвалення сполучення.
- Групові повідомлення ігноруються: фільтрація за відправником/згадкою у групі блокує доставку.
- Помилки перевірки конфігурації після редагувань: виконайте `openclaw doctor --fix`.
- Signal відсутній у діагностиці: підтвердьте `channels.signal.enabled: true`.

Додаткові перевірки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Для процесу тріажу: [/channels/troubleshooting](/uk/channels/troubleshooting).

## Примітки з безпеки

- `signal-cli` зберігає ключі облікового запису локально (зазвичай у `~/.local/share/signal-cli/data/`).
- Створіть резервну копію стану облікового запису Signal перед міграцією сервера або перебудовою.
- Залишайте `channels.signal.dmPolicy: "pairing"`, якщо явно не хочете ширший доступ до особистих повідомлень.
- SMS-перевірка потрібна лише для потоків реєстрації або відновлення, але втрата контролю над номером/обліковим записом може ускладнити повторну реєстрацію.

## Довідник конфігурації (Signal)

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.signal.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.signal.apiMode`: `auto | native | container` (типово: auto). Див. [Режим контейнера](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 для облікового запису бота.
- `channels.signal.cliPath`: шлях до `signal-cli`.
- `channels.signal.httpUrl`: повна URL-адреса демона (перевизначає host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: прив’язка демона (типово 127.0.0.1:8080).
- `channels.signal.autoStart`: автоматично запускати демон (типово true, якщо `httpUrl` не задано).
- `channels.signal.startupTimeoutMs`: тайм-аут очікування запуску в мс (ліміт 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: пропускати завантаження вкладень.
- `channels.signal.ignoreStories`: ігнорувати stories від демона.
- `channels.signal.sendReadReceipts`: пересилати сповіщення про прочитання.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing).
- `channels.signal.allowFrom`: список дозволених для особистих повідомлень (E.164 або `uuid:<id>`). `open` потребує `"*"`. Signal не має імен користувачів; використовуйте ідентифікатори телефону/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (типово: allowlist).
- `channels.signal.groupAllowFrom`: список дозволених для груп; приймає ідентифікатори груп Signal (raw, `group:<id>` або `signal:group:<id>`), номери відправників E.164 або значення `uuid:<id>`.
- `channels.signal.groups`: перевизначення для окремих груп, ключовані за id групи Signal (або `"*"`). Підтримувані поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: версія `channels.signal.groups` для окремого облікового запису в налаштуваннях із кількома обліковими записами.
- `channels.signal.historyLimit`: максимальна кількість групових повідомлень, які потрібно включати як контекст (0 вимикає).
- `channels.signal.dmHistoryLimit`: ліміт історії особистих повідомлень у ходах користувача. Перевизначення для окремих користувачів: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: розмір вихідного фрагмента (символи).
- `channels.signal.chunkMode`: `length` (типово) або `newline`, щоб розділяти за порожніми рядками (межами абзаців) перед фрагментацією за довжиною.
- `channels.signal.mediaMaxMb`: ліміт вхідних/вихідних медіа (MB).

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (Signal не підтримує нативні згадки).
- `messages.groupChat.mentionPatterns` (глобальний запасний варіант).
- `messages.responsePrefix`.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація особистих повідомлень і потік сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та фільтрація за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
