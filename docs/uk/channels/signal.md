---
read_when:
    - Налаштування підтримки Signal
    - Налагодження надсилання/отримання в Signal
summary: Підтримка Signal через signal-cli (нативний daemon або контейнер bbernhard), шляхи налаштування та модель номера
title: Signal
x-i18n:
    generated_at: "2026-06-27T17:13:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f4d82f43a11494d371a9af9a8e55b227364594a5a144b5a4d8690e865d9ade8
    source_path: channels/signal.md
    workflow: 16
---

Стан: зовнішня інтеграція CLI. Gateway взаємодіє з `signal-cli` через HTTP — або нативний демон (JSON-RPC + SSE), або контейнер bbernhard/signal-cli-rest-api (REST + WebSocket).

## Передумови

- OpenClaw встановлено на вашому сервері (Linux-процес нижче протестовано на Ubuntu 24).
- Один із варіантів:
  - `signal-cli` доступний на хості (нативний режим), **або**
  - Docker-контейнер `bbernhard/signal-cli-rest-api` (контейнерний режим).
- Номер телефону, який може отримати одне SMS для перевірки (для шляху реєстрації через SMS).
- Доступ до браузера для captcha Signal (`signalcaptchas.org`) під час реєстрації.

## Швидке налаштування (для початківців)

1. Використайте **окремий номер Signal** для бота (рекомендовано).
2. Встановіть Plugin OpenClaw:

```bash
openclaw plugins install @openclaw/signal
```

3. Встановіть `signal-cli` (Java потрібна, якщо ви використовуєте JVM-збірку).
4. Виберіть один шлях налаштування:
   - **Шлях A (QR-прив’язування):** `signal-cli link -n "OpenClaw"` і проскануйте в Signal.
   - **Шлях B (SMS-реєстрація):** зареєструйте виділений номер із captcha + SMS-перевіркою.
5. Налаштуйте OpenClaw і перезапустіть Gateway.
6. Надішліть перше DM і схваліть сполучення (`openclaw pairing approve signal <CODE>`).

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

| Поле         | Опис                                                           |
| ------------ | -------------------------------------------------------------- |
| `account`    | Номер телефону бота у форматі E.164 (`+15551234567`)           |
| `cliPath`    | Шлях до `signal-cli` (`signal-cli`, якщо він є в `PATH`)        |
| `configPath` | Каталог конфігурації signal-cli, переданий як `--config`       |
| `dmPolicy`   | Політика доступу до DM (рекомендовано `pairing`)               |
| `allowFrom`  | Номери телефонів або значення `uuid:<id>`, яким дозволено DM   |

## Що це таке

- Канал Signal через `signal-cli` (не вбудований libsignal).
- Детермінована маршрутизація: відповіді завжди повертаються до Signal.
- DM спільно використовують основну сесію агента; групи ізольовані (`agent:<agentId>:signal:group:<groupId>`).

## Записи конфігурації

За замовчуванням Signal дозволено записувати оновлення конфігурації, спричинені `/config set|unset` (потрібно `commands.config: true`).

Вимкніть через:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Модель номера (важливо)

- Gateway підключається до **пристрою Signal** (облікового запису `signal-cli`).
- Якщо ви запускаєте бота на **своєму особистому обліковому записі Signal**, він ігноруватиме ваші власні повідомлення (захист від циклів).
- Для сценарію "я пишу боту, і він відповідає" використовуйте **окремий номер бота**.

## Шлях налаштування A: прив’язати наявний обліковий запис Signal (QR)

1. Встановіть `signal-cli` (JVM або нативну збірку).
2. Прив’яжіть обліковий запис бота:
   - `signal-cli link -n "OpenClaw"`, потім проскануйте QR у Signal.
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

Підтримка кількох облікових записів: використовуйте `channels.signal.accounts` із конфігурацією для кожного облікового запису та необов’язковим `name`. Див. [`gateway/configuration`](/uk/gateway/config-channels#multi-account-all-channels) для спільного шаблону.

## Шлях налаштування B: зареєструвати виділений номер бота (SMS, Linux)

Використовуйте це, коли потрібен виділений номер бота замість прив’язування наявного облікового запису застосунку Signal.

1. Отримайте номер, який може приймати SMS (або голосову перевірку для стаціонарних номерів).
   - Використовуйте виділений номер бота, щоб уникнути конфліктів облікового запису/сесії.
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

3. Зареєструйте та перевірте номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Якщо потрібна captcha:

1. Відкрийте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдіть captcha, скопіюйте ціль посилання `signalcaptcha://...` з "Open Signal".
3. За можливості запускайте з тієї самої зовнішньої IP-адреси, що й браузерна сесія.
4. Негайно запустіть реєстрацію знову (токени captcha швидко спливають):

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

5. Спарте свого відправника DM:
   - Надішліть будь-яке повідомлення на номер бота.
   - Схваліть код на сервері: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Збережіть номер бота як контакт на телефоні, щоб уникнути "Unknown contact".

<Warning>
Реєстрація облікового запису з номером телефону через `signal-cli` може деавторизувати основну сесію застосунку Signal для цього номера. Надавайте перевагу виділеному номеру бота або використовуйте режим QR-прив’язування, якщо потрібно зберегти наявне налаштування телефонного застосунку.
</Warning>

Upstream-посилання:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Потік captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Потік прив’язування: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Режим зовнішнього демона (httpUrl)

Якщо ви хочете керувати `signal-cli` самостійно (повільні холодні запуски JVM, ініціалізація контейнера або спільні CPU), запустіть демон окремо й спрямуйте OpenClaw до нього:

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

Це пропускає автоматичний запуск і очікування старту всередині OpenClaw. Для повільних запусків під час автоматичного запуску встановіть `channels.signal.startupTimeoutMs`.

## Контейнерний режим (bbernhard/signal-cli-rest-api)

Замість нативного запуску `signal-cli` можна використовувати Docker-контейнер [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Він обгортає `signal-cli` REST API та інтерфейсом WebSocket.

Вимоги:

- Контейнер **має** працювати з `MODE=json-rpc` для отримання повідомлень у реальному часі.
- Зареєструйте або прив’яжіть свій обліковий запис Signal усередині контейнера перед підключенням OpenClaw.

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
| `"auto"`      | (За замовчуванням) Перевіряє обидва транспорти; streaming перевіряє отримання через контейнерний WebSocket |
| `"native"`    | Примусово використовує нативний signal-cli (JSON-RPC на `/api/v1/rpc`, SSE на `/api/v1/events`) |
| `"container"` | Примусово використовує контейнер bbernhard (REST на `/v2/send`, WebSocket на `/v1/receive/{account}`) |

Коли `apiMode` має значення `"auto"`, OpenClaw кешує виявлений режим на 30 секунд, щоб уникнути повторних перевірок. Отримання через контейнер вибирається для streaming лише після оновлення `/v1/receive/{account}` до WebSocket, що потребує `MODE=json-rpc`.

Контейнерний режим підтримує ті самі операції каналу Signal, що й нативний режим, там, де контейнер надає відповідні API: надсилання, отримання, вкладення, індикатори набору, квитанції про прочитання/перегляд, реакції, групи та стилізований текст. OpenClaw перекладає свої нативні Signal RPC-виклики в REST-пейлоади контейнера, включно з ідентифікаторами груп `group.{base64(internal_id)}` і `text_mode: "styled"` для форматованого тексту.

Операційні примітки:

- Використовуйте `autoStart: false` з контейнерним режимом. OpenClaw не повинен запускати нативний демон, коли вибрано `apiMode: "container"`.
- Використовуйте `MODE=json-rpc` для отримання. `MODE=normal` може робити `/v1/about` справним на вигляд, але `/v1/receive/{account}` не оновлюється до WebSocket, тому OpenClaw не вибере streaming отримання через контейнер у режимі `auto`.
- Встановіть `apiMode: "container"`, коли ви знаєте, що `httpUrl` вказує на REST API bbernhard. Встановіть `apiMode: "native"`, коли ви знаєте, що він вказує на нативний JSON-RPC/SSE `signal-cli`. Використовуйте `"auto"`, коли розгортання може відрізнятися.
- Завантаження вкладень у контейнерному режимі дотримуються тих самих лімітів байтів медіа, що й нативний режим. Завеликі відповіді відхиляються до повного буферизування, коли сервер надсилає `Content-Length`, а в іншому разі — під час streaming.

## Контроль доступу (DM + групи)

DM:

- За замовчуванням: `channels.signal.dmPolicy = "pairing"`.
- Невідомі відправники отримують код сполучення; повідомлення ігноруються до схвалення (коди спливають через 1 годину).
- Схвалити через:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Сполучення є типовим обміном токенами для Signal DM. Деталі: [Сполучення](/uk/channels/pairing)
- Відправники лише з UUID (із `sourceUuid`) зберігаються як `uuid:<id>` у `channels.signal.allowFrom`.

Групи:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` керує тим, які групи або відправники можуть запускати групові відповіді, коли встановлено `allowlist`; записи можуть бути ідентифікаторами груп Signal (сирими, `group:<id>` або `signal:group:<id>`), номерами телефонів відправників, значеннями `uuid:<id>` або `*`.
- `channels.signal.groups["<group-id>" | "*"]` може перевизначати поведінку групи через `requireMention`, `tools` і `toolsBySender`.
- Використовуйте `channels.signal.accounts.<id>.groups` для перевизначень на рівні облікового запису в налаштуваннях із кількома обліковими записами.
- Додавання групи Signal до allowlist через `groupAllowFrom` саме по собі не вимикає обмеження за згадкою. Спеціально налаштований запис `channels.signal.groups["<group-id>"]` обробляє кожне групове повідомлення, якщо не встановлено `requireMention=true`.
- Примітка щодо runtime: якщо `channels.signal` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо встановлено `channels.defaults.groupPolicy`).

## Як це працює (поведінка)

- Нативний режим: `signal-cli` працює як демон; Gateway читає події через SSE.
- Контейнерний режим: Gateway надсилає через REST API й отримує через WebSocket.
- Вхідні повідомлення нормалізуються в спільний конверт каналу.
- Відповіді завжди маршрутизуються назад до того самого номера або групи.

## Медіа + ліміти

- Вихідний текст ділиться на фрагменти за `channels.signal.textChunkLimit` (за замовчуванням 4000).
- Необов’язкове розбиття за новими рядками: встановіть `channels.signal.chunkMode="newline"`, щоб розділяти за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- Вкладення підтримуються (base64 отримується з `signal-cli`).
- Вкладення голосових нотаток використовують ім’я файлу `signal-cli` як резервний MIME, коли `contentType` відсутній, тож аудіотранскрипція все одно може класифікувати голосові нотатки AAC.
- Типовий ліміт медіа: `channels.signal.mediaMaxMb` (за замовчуванням 8).
- Використовуйте `channels.signal.ignoreAttachments`, щоб пропускати завантаження медіа.
- Контекст історії груп використовує `channels.signal.historyLimit` (або `channels.signal.accounts.*.historyLimit`), із поверненням до `messages.groupChat.historyLimit`. Встановіть `0`, щоб вимкнути (за замовчуванням 50).

## Набір тексту + квитанції про прочитання

- **Індикатори набору тексту**: OpenClaw надсилає сигнали набору тексту через `signal-cli sendTyping` і оновлює їх, доки виконується відповідь.
- **Сповіщення про прочитання**: коли `channels.signal.sendReadReceipts` має значення true, OpenClaw пересилає сповіщення про прочитання для дозволених приватних повідомлень.
- Signal-cli не надає сповіщення про прочитання для груп.

## Реакції (інструмент повідомлень)

- Використовуйте `message action=react` з `channel=signal`.
- Цілі: E.164 відправника або UUID (використовуйте `uuid:<id>` з виводу спарювання; простий UUID також працює).
- `messageId` — це часовий штамп Signal для повідомлення, на яке ви реагуєте.
- Для групових реакцій потрібен `targetAuthor` або `targetAuthorUuid`.

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
  - `minimal`/`extensive` вмикає реакції агента та встановлює рівень настанов.
- Перевизначення для окремого облікового запису: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Реакції схвалення

Підказки схвалення виконання Signal і Plugin використовують блоки маршрутизації верхнього рівня `approvals.exec` та
`approvals.plugin`. Signal не має блока
`channels.signal.execApprovals`.

- `👍` схвалює один раз.
- `👎` відхиляє.
- Використовуйте `/approve <id> allow-always`, коли запит пропонує постійне схвалення.

Визначення реакції схвалення потребує явних схвалювачів Signal з
`channels.signal.allowFrom`, `channels.signal.defaultTo` або відповідних полів рівня облікового запису.
Прямі підказки схвалення виконання в тому самому чаті все ще можуть приховувати дубльований локальний резервний варіант `/approve`
без явних схвалювачів; групові схвалення без схвалювача залишають локальний резервний варіант видимим.

## Цілі доставки (CLI/Cron)

- Приватні повідомлення: `signal:+15551234567` (або звичайний E.164).
- Приватні повідомлення UUID: `uuid:<id>` (або простий UUID).
- Групи: `signal:group:<groupId>`.
- Імена користувачів: `username:<name>` (якщо підтримується вашим обліковим записом Signal).

## Усунення несправностей

Спершу виконайте цю послідовність:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Потім за потреби підтвердьте стан спарювання приватних повідомлень:

```bash
openclaw pairing list signal
```

Поширені помилки:

- Демон доступний, але відповідей немає: перевірте налаштування облікового запису/демона (`httpUrl`, `account`) і режим отримання.
- Приватні повідомлення ігноруються: відправник очікує схвалення спарювання.
- Групові повідомлення ігноруються: шлюзування за відправником/згадкою у групі блокує доставку.
- Помилки перевірки конфігурації після редагувань: виконайте `openclaw doctor --fix`.
- Signal відсутній у діагностиці: підтвердьте `channels.signal.enabled: true`.

Додаткові перевірки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Про потік тріажу: [/channels/troubleshooting](/uk/channels/troubleshooting).

## Примітки щодо безпеки

- `signal-cli` зберігає ключі облікового запису локально (зазвичай у `~/.local/share/signal-cli/data/`).
- Створіть резервну копію стану облікового запису Signal перед міграцією сервера або перебудовою.
- Залишайте `channels.signal.dmPolicy: "pairing"`, якщо явно не хочете ширшого доступу до приватних повідомлень.
- SMS-перевірка потрібна лише для потоків реєстрації або відновлення, але втрата контролю над номером/обліковим записом може ускладнити повторну реєстрацію.

## Довідник конфігурації (Signal)

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.signal.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.signal.apiMode`: `auto | native | container` (типово: auto). Див. [Режим контейнера](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 для облікового запису бота.
- `channels.signal.cliPath`: шлях до `signal-cli`.
- `channels.signal.configPath`: необов’язковий каталог `signal-cli --config`.
- `channels.signal.httpUrl`: повна URL-адреса демона (перевизначає хост/порт).
- `channels.signal.httpHost`, `channels.signal.httpPort`: прив’язка демона (типово 127.0.0.1:8080).
- `channels.signal.autoStart`: автоматично породжувати демон (типово true, якщо `httpUrl` не задано).
- `channels.signal.startupTimeoutMs`: час очікування запуску в мс (обмеження 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: пропускати завантаження вкладень.
- `channels.signal.ignoreStories`: ігнорувати історії з демона.
- `channels.signal.sendReadReceipts`: пересилати сповіщення про прочитання.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing).
- `channels.signal.allowFrom`: список дозволених приватних повідомлень (E.164 або `uuid:<id>`). `open` потребує `"*"`. Signal не має імен користувачів; використовуйте ідентифікатори телефону/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (типово: allowlist).
- `channels.signal.groupAllowFrom`: список дозволених груп; приймає ідентифікатори груп Signal (необроблені, `group:<id>` або `signal:group:<id>`), номери E.164 відправників або значення `uuid:<id>`.
- `channels.signal.groups`: перевизначення для окремих груп, ключовані за ідентифікатором групи Signal (або `"*"`). Підтримувані поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: версія `channels.signal.groups` для окремого облікового запису в налаштуваннях із кількома обліковими записами.
- `channels.signal.historyLimit`: максимальна кількість групових повідомлень, які слід включати як контекст (0 вимикає).
- `channels.signal.dmHistoryLimit`: ліміт історії приватних повідомлень у ходах користувача. Перевизначення для окремого користувача: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: розмір вихідного фрагмента (символи).
- `channels.signal.chunkMode`: `length` (типово) або `newline`, щоб розділяти за порожніми рядками (межами абзаців) перед фрагментацією за довжиною.
- `channels.signal.mediaMaxMb`: обмеження вхідних/вихідних медіа (МБ).

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (Signal не підтримує нативні згадки).
- `messages.groupChat.mentionPatterns` (глобальний резервний варіант).
- `messages.responsePrefix`.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Спарювання](/uk/channels/pairing) — автентифікація приватних повідомлень і потік спарювання
- [Групи](/uk/channels/groups) — поведінка групового чату та шлюзування згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
