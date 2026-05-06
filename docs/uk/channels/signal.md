---
read_when:
    - Налаштування підтримки Signal
    - Налагодження надсилання/отримання Signal
summary: Підтримка Signal через signal-cli (JSON-RPC + SSE), шляхи налаштування та модель номерів
title: Signal
x-i18n:
    generated_at: "2026-05-06T04:33:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0290318ed0cda8f258a96da379b9774418fd888e1b78271a051c98b327a2f45
    source_path: channels/signal.md
    workflow: 16
---

Стан: інтеграція зовнішнього CLI. Gateway спілкується з `signal-cli` через HTTP JSON-RPC + SSE.

## Передумови

- OpenClaw встановлено на вашому сервері (потік Linux нижче протестовано на Ubuntu 24).
- `signal-cli` доступний на хості, де працює Gateway.
- Номер телефону, який може отримати одне SMS для перевірки (для шляху реєстрації через SMS).
- Доступ до браузера для капчі Signal (`signalcaptchas.org`) під час реєстрації.

## Швидке налаштування (для початківців)

1. Використовуйте **окремий номер Signal** для бота (рекомендовано).
2. Встановіть `signal-cli` (Java потрібна, якщо ви використовуєте JVM-збірку).
3. Виберіть один шлях налаштування:
   - **Шлях A (QR-підключення):** `signal-cli link -n "OpenClaw"` і відскануйте в Signal.
   - **Шлях B (реєстрація через SMS):** зареєструйте виділений номер із капчею + SMS-перевіркою.
4. Налаштуйте OpenClaw і перезапустіть Gateway.
5. Надішліть перше DM і схваліть сполучення (`openclaw pairing approve signal <CODE>`).

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

| Поле        | Опис                                              |
| ----------- | ------------------------------------------------- |
| `account`   | Номер телефону бота у форматі E.164 (`+15551234567`) |
| `cliPath`   | Шлях до `signal-cli` (`signal-cli`, якщо він у `PATH`) |
| `dmPolicy`  | Політика доступу до DM (рекомендовано `pairing`)  |
| `allowFrom` | Номери телефонів або значення `uuid:<id>`, яким дозволено надсилати DM |

## Що це таке

- Канал Signal через `signal-cli` (не вбудований libsignal).
- Детермінована маршрутизація: відповіді завжди повертаються до Signal.
- DM спільно використовують основну сесію агента; групи ізольовані (`agent:<agentId>:signal:group:<groupId>`).

## Запис конфігурації

За замовчуванням Signal дозволено записувати оновлення конфігурації, ініційовані `/config set|unset` (потрібно `commands.config: true`).

Вимкніть за допомогою:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Модель номера (важливо)

- Gateway підключається до **пристрою Signal** (облікового запису `signal-cli`).
- Якщо ви запускаєте бота на **своєму особистому обліковому записі Signal**, він ігноруватиме ваші власні повідомлення (захист від циклів).
- Для сценарію "я пишу боту, і він відповідає" використовуйте **окремий номер бота**.

## Шлях налаштування A: підключити наявний обліковий запис Signal (QR)

1. Встановіть `signal-cli` (JVM або нативну збірку).
2. Підключіть обліковий запис бота:
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

Використовуйте це, коли потрібен виділений номер бота замість підключення наявного облікового запису застосунку Signal.

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
Підтримуйте `signal-cli` оновленим; upstream зазначає, що старі релізи можуть ламатися через зміни API серверів Signal.

3. Зареєструйте та підтвердьте номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Якщо потрібна капча:

1. Відкрийте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдіть капчу, скопіюйте ціль посилання `signalcaptcha://...` з "Open Signal".
3. За можливості запускайте з тієї самої зовнішньої IP-адреси, що й браузерна сесія.
4. Одразу запустіть реєстрацію знову (токени капчі швидко спливають):

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

5. Спаруйте вашого відправника DM:
   - Надішліть будь-яке повідомлення на номер бота.
   - Схваліть код на сервері: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Збережіть номер бота як контакт на телефоні, щоб уникнути "Unknown contact".

<Warning>
Реєстрація облікового запису номера телефону за допомогою `signal-cli` може деавторизувати основну сесію застосунку Signal для цього номера. Надавайте перевагу виділеному номеру бота або використовуйте режим QR-підключення, якщо потрібно зберегти наявне налаштування телефонного застосунку.
</Warning>

Upstream-посилання:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Потік капчі: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Потік підключення: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

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

Це пропускає автоматичний запуск і очікування старту всередині OpenClaw. Для повільних стартів під час автоматичного запуску встановіть `channels.signal.startupTimeoutMs`.

## Контроль доступу (DM + групи)

DM:

- За замовчуванням: `channels.signal.dmPolicy = "pairing"`.
- Невідомі відправники отримують код сполучення; повідомлення ігноруються до схвалення (коди спливають через 1 годину).
- Схвалення через:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Сполучення є стандартним обміном токенами для DM Signal. Докладніше: [Сполучення](/uk/channels/pairing)
- Відправники лише з UUID (з `sourceUuid`) зберігаються як `uuid:<id>` у `channels.signal.allowFrom`.

Групи:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` контролює, які групи або відправники можуть ініціювати групові відповіді, коли встановлено `allowlist`; записи можуть бути ID груп Signal (сирі, `group:<id>` або `signal:group:<id>`), номери телефонів відправників, значення `uuid:<id>` або `*`.
- `channels.signal.groups["<group-id>" | "*"]` може перевизначати поведінку груп із `requireMention`, `tools` і `toolsBySender`.
- Використовуйте `channels.signal.accounts.<id>.groups` для перевизначень за обліковими записами в налаштуваннях із кількома обліковими записами.
- Додавання групи Signal до allowlist через `groupAllowFrom` саме по собі не вимикає вимогу згадки. Спеціально налаштований запис `channels.signal.groups["<group-id>"]` обробляє кожне повідомлення групи, якщо не встановлено `requireMention=true`.
- Примітка щодо runtime: якщо `channels.signal` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо встановлено `channels.defaults.groupPolicy`).

## Як це працює (поведінка)

- `signal-cli` працює як демон; Gateway читає події через SSE.
- Вхідні повідомлення нормалізуються у спільну оболонку каналу.
- Відповіді завжди маршрутизуються назад до того самого номера або групи.

## Медіа + обмеження

- Вихідний текст розбивається на фрагменти до `channels.signal.textChunkLimit` (за замовчуванням 4000).
- Необов’язкове розбиття за новими рядками: встановіть `channels.signal.chunkMode="newline"`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- Вкладення підтримуються (base64 отримується з `signal-cli`).
- Вкладення голосових нотаток використовують ім’я файлу `signal-cli` як резервний MIME, коли `contentType` відсутній, тож транскрипція аудіо все одно може класифікувати голосові нотатки AAC.
- Стандартний ліміт медіа: `channels.signal.mediaMaxMb` (за замовчуванням 8).
- Використовуйте `channels.signal.ignoreAttachments`, щоб пропускати завантаження медіа.
- Контекст історії груп використовує `channels.signal.historyLimit` (або `channels.signal.accounts.*.historyLimit`), з поверненням до `messages.groupChat.historyLimit`. Встановіть `0`, щоб вимкнути (за замовчуванням 50).

## Індикатор набору + сповіщення про прочитання

- **Індикатори набору**: OpenClaw надсилає сигнали набору через `signal-cli sendTyping` і оновлює їх, поки виконується відповідь.
- **Сповіщення про прочитання**: коли `channels.signal.sendReadReceipts` має значення true, OpenClaw пересилає сповіщення про прочитання для дозволених DM.
- Signal-cli не надає сповіщення про прочитання для груп.

## Реакції (інструмент повідомлень)

- Використовуйте `message action=react` з `channel=signal`.
- Цілі: E.164 відправника або UUID (використовуйте `uuid:<id>` з виводу сполучення; голий UUID також працює).
- `messageId` — це timestamp Signal для повідомлення, на яке ви реагуєте.
- Для реакцій у групах потрібен `targetAuthor` або `targetAuthorUuid`.

Приклади:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Конфігурація:

- `channels.signal.actions.reactions`: увімкнути/вимкнути дії реакцій (за замовчуванням true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` вимикає реакції агента (інструмент повідомлень `react` поверне помилку).
  - `minimal`/`extensive` вмикає реакції агента та встановлює рівень настанов.
- Перевизначення за обліковими записами: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Цілі доставки (CLI/cron)

- DM: `signal:+15551234567` (або звичайний E.164).
- DM за UUID: `uuid:<id>` (або голий UUID).
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

Потім за потреби підтвердьте стан сполучення DM:

```bash
openclaw pairing list signal
```

Поширені збої:

- Демон доступний, але відповідей немає: перевірте налаштування облікового запису/демона (`httpUrl`, `account`) і режим приймання.
- DM ігноруються: відправник очікує схвалення сполучення.
- Повідомлення груп ігноруються: блокування відправника групи/вимоги згадки перешкоджає доставці.
- Помилки перевірки конфігурації після змін: запустіть `openclaw doctor --fix`.
- Signal відсутній у діагностиці: підтвердьте `channels.signal.enabled: true`.

Додаткові перевірки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Для потоку triage: [/channels/troubleshooting](/uk/channels/troubleshooting).

## Примітки щодо безпеки

- `signal-cli` зберігає ключі облікового запису локально (зазвичай `~/.local/share/signal-cli/data/`).
- Зробіть резервну копію стану облікового запису Signal перед міграцією або перебудовою сервера.
- Залишайте `channels.signal.dmPolicy: "pairing"`, якщо явно не потрібен ширший доступ до DM.
- SMS-перевірка потрібна лише для потоків реєстрації або відновлення, але втрата контролю над номером/обліковим записом може ускладнити повторну реєстрацію.

## Довідник конфігурації (Signal)

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.signal.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.signal.account`: E.164 для облікового запису бота.
- `channels.signal.cliPath`: шлях до `signal-cli`.
- `channels.signal.httpUrl`: повна URL-адреса демона (перевизначає host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: прив’язка демона (типово 127.0.0.1:8080).
- `channels.signal.autoStart`: автоматично запускати демон (типово true, якщо `httpUrl` не задано).
- `channels.signal.startupTimeoutMs`: таймаут очікування запуску в мс (верхня межа 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: пропускати завантаження вкладень.
- `channels.signal.ignoreStories`: ігнорувати історії від демона.
- `channels.signal.sendReadReceipts`: пересилати підтвердження прочитання.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing).
- `channels.signal.allowFrom`: список дозволених DM (E.164 або `uuid:<id>`). `open` вимагає `"*"`. У Signal немає імен користувачів; використовуйте ідентифікатори телефону/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (типово: allowlist).
- `channels.signal.groupAllowFrom`: список дозволених для груп; приймає ідентифікатори груп Signal (сирі, `group:<id>` або `signal:group:<id>`), номери відправників у форматі E.164 або значення `uuid:<id>`.
- `channels.signal.groups`: перевизначення для окремих груп із ключами за ідентифікатором групи Signal (або `"*"`). Підтримувані поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: версія `channels.signal.groups` для окремого облікового запису в налаштуваннях із кількома обліковими записами.
- `channels.signal.historyLimit`: максимальна кількість групових повідомлень, які включати як контекст (0 вимикає).
- `channels.signal.dmHistoryLimit`: ліміт історії DM у ходах користувача. Перевизначення для окремих користувачів: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: розмір вихідного фрагмента (символи).
- `channels.signal.chunkMode`: `length` (типово) або `newline`, щоб розділяти за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.signal.mediaMaxMb`: ліміт вхідних/вихідних медіа (МБ).

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (Signal не підтримує нативні згадки).
- `messages.groupChat.mentionPatterns` (глобальний запасний варіант).
- `messages.responsePrefix`.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату й пропуск за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу й посилення захисту
