---
read_when:
    - Налаштування підтримки Signal
    - Налагодження надсилання/отримання в Signal
summary: Підтримка Signal через signal-cli (JSON-RPC + SSE), шляхи налаштування та модель номера
title: Signal
x-i18n:
    generated_at: "2026-04-30T14:57:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d5f79b34b85b0d963373026d33b066d7865282e9a3619bddd334e67de30940d6
    source_path: channels/signal.md
    workflow: 16
---

Стан: зовнішня інтеграція CLI. Gateway взаємодіє з `signal-cli` через HTTP JSON-RPC + SSE.

## Передумови

- OpenClaw встановлено на вашому сервері (Linux-процес нижче протестовано на Ubuntu 24).
- `signal-cli` доступний на хості, де працює gateway.
- Номер телефону, який може отримати одне перевірочне SMS (для шляху реєстрації через SMS).
- Доступ до браузера для Signal captcha (`signalcaptchas.org`) під час реєстрації.

## Швидке налаштування (для початківців)

1. Використовуйте **окремий номер Signal** для бота (рекомендовано).
2. Встановіть `signal-cli` (потрібна Java, якщо використовуєте JVM-збірку).
3. Виберіть один шлях налаштування:
   - **Шлях A (QR-посилання):** `signal-cli link -n "OpenClaw"` і відскануйте за допомогою Signal.
   - **Шлях B (реєстрація через SMS):** зареєструйте виділений номер із captcha + перевіркою через SMS.
4. Налаштуйте OpenClaw і перезапустіть gateway.
5. Надішліть перше DM і підтвердьте сполучення (`openclaw pairing approve signal <CODE>`).

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

| Поле        | Опис                                                         |
| ----------- | ------------------------------------------------------------ |
| `account`   | Номер телефону бота у форматі E.164 (`+15551234567`)         |
| `cliPath`   | Шлях до `signal-cli` (`signal-cli`, якщо він у `PATH`)       |
| `dmPolicy`  | Політика доступу до DM (`pairing` рекомендовано)             |
| `allowFrom` | Номери телефонів або значення `uuid:<id>`, яким дозволено DM |

## Що це таке

- Канал Signal через `signal-cli` (не вбудований libsignal).
- Детермінізована маршрутизація: відповіді завжди повертаються в Signal.
- DM використовують основну сесію агента; групи ізольовані (`agent:<agentId>:signal:group:<groupId>`).

## Записи конфігурації

За замовчуванням Signal дозволено записувати оновлення конфігурації, спричинені `/config set|unset` (потрібно `commands.config: true`).

Вимкніть за допомогою:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Модель номера (важливо)

- Gateway підключається до **пристрою Signal** (облікового запису `signal-cli`).
- Якщо ви запускаєте бота на **своєму особистому обліковому записі Signal**, він ігноруватиме ваші власні повідомлення (захист від циклів).
- Для сценарію «я пишу боту, і він відповідає» використовуйте **окремий номер бота**.

## Шлях налаштування A: прив’язати наявний обліковий запис Signal (QR)

1. Встановіть `signal-cli` (JVM або нативну збірку).
2. Прив’яжіть обліковий запис бота:
   - `signal-cli link -n "OpenClaw"`, потім відскануйте QR у Signal.
3. Налаштуйте Signal і запустіть gateway.

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

Підтримка кількох облікових записів: використовуйте `channels.signal.accounts` з конфігурацією для кожного облікового запису та необов’язковим `name`. Див. [`gateway/configuration`](/uk/gateway/config-channels#multi-account-all-channels) для спільного патерну.

## Шлях налаштування B: зареєструвати виділений номер бота (SMS, Linux)

Використовуйте це, якщо потрібен виділений номер бота замість прив’язування наявного облікового запису застосунку Signal.

1. Отримайте номер, який може приймати SMS (або голосову перевірку для стаціонарних ліній).
   - Використовуйте виділений номер бота, щоб уникнути конфліктів облікового запису/сесії.
2. Встановіть `signal-cli` на хості gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Якщо використовуєте JVM-збірку (`signal-cli-${VERSION}.tar.gz`), спочатку встановіть JRE 25+.
Підтримуйте `signal-cli` в актуальному стані; upstream зазначає, що старі випуски можуть зламатися через зміни API серверів Signal.

3. Зареєструйте та перевірте номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Якщо потрібна captcha:

1. Відкрийте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдіть captcha, скопіюйте ціль посилання `signalcaptcha://...` з "Open Signal".
3. За можливості запускайте з тієї самої зовнішньої IP-адреси, що й браузерна сесія.
4. Негайно запустіть реєстрацію ще раз (токени captcha швидко спливають):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Налаштуйте OpenClaw, перезапустіть gateway, перевірте канал:

```bash
# If you run the gateway as a user systemd service:
systemctl --user restart openclaw-gateway.service

# Then verify:
openclaw doctor
openclaw channels status --probe
```

5. Сполучіть вашого відправника DM:
   - Надішліть будь-яке повідомлення на номер бота.
   - Підтвердьте код на сервері: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Збережіть номер бота як контакт на телефоні, щоб уникнути "Unknown contact".

<Warning>
Реєстрація облікового запису номера телефону через `signal-cli` може деавтентифікувати основну сесію застосунку Signal для цього номера. Надавайте перевагу виділеному номеру бота або використовуйте режим QR-прив’язування, якщо потрібно зберегти наявне налаштування застосунку на телефоні.
</Warning>

Upstream-посилання:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Процес captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Процес прив’язування: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Режим зовнішнього демона (httpUrl)

Якщо ви хочете керувати `signal-cli` самостійно (повільні холодні старти JVM, ініціалізація контейнера або спільні CPU), запустіть daemon окремо та вкажіть OpenClaw на нього:

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

Це пропускає автоматичний запуск і очікування старту всередині OpenClaw. Для повільних стартів під час автоматичного запуску задайте `channels.signal.startupTimeoutMs`.

## Контроль доступу (DM + групи)

DM:

- За замовчуванням: `channels.signal.dmPolicy = "pairing"`.
- Невідомі відправники отримують код сполучення; повідомлення ігноруються до підтвердження (коди спливають через 1 годину).
- Підтвердження через:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Сполучення є стандартним обміном токенами для Signal DM. Докладніше: [Сполучення](/uk/channels/pairing)
- Відправники лише з UUID (з `sourceUuid`) зберігаються як `uuid:<id>` у `channels.signal.allowFrom`.

Групи:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` керує тим, які групи або відправники можуть запускати відповіді групи, коли встановлено `allowlist`; записи можуть бути ідентифікаторами груп Signal (сирі, `group:<id>` або `signal:group:<id>`), номерами телефонів відправників або значеннями `uuid:<id>`.
- `channels.signal.groups["<group-id>" | "*"]` може перевизначати поведінку групи за допомогою `requireMention`, `tools` і `toolsBySender`.
- Використовуйте `channels.signal.accounts.<id>.groups` для перевизначень на рівні облікового запису в налаштуваннях із кількома обліковими записами.
- Додавання групи Signal до allowlist не вимикає перевірку згадок. Щоб обробляти кожне повідомлення в групі з allowlist, встановіть `channels.signal.groups["<group-id>"].requireMention=false` або використовуйте стандартне значення групи `"*"`.
- Примітка щодо runtime: якщо `channels.signal` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо задано `channels.defaults.groupPolicy`).

## Як це працює (поведінка)

- `signal-cli` працює як daemon; gateway читає події через SSE.
- Вхідні повідомлення нормалізуються у спільний envelope каналу.
- Відповіді завжди маршрутизуються назад на той самий номер або в ту саму групу.

## Медіа + обмеження

- Вихідний текст розбивається на фрагменти до `channels.signal.textChunkLimit` (стандартно 4000).
- Необов’язкове розбиття за новими рядками: задайте `channels.signal.chunkMode="newline"`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- Вкладення підтримуються (base64 отримується з `signal-cli`).
- Вкладення голосових нотаток використовують ім’я файлу `signal-cli` як fallback для MIME, коли `contentType` відсутній, тому транскрипція аудіо все одно може класифікувати голосові нотатки AAC.
- Стандартний ліміт медіа: `channels.signal.mediaMaxMb` (стандартно 8).
- Використовуйте `channels.signal.ignoreAttachments`, щоб пропускати завантаження медіа.
- Контекст історії групи використовує `channels.signal.historyLimit` (або `channels.signal.accounts.*.historyLimit`), з fallback до `messages.groupChat.historyLimit`. Встановіть `0`, щоб вимкнути (стандартно 50).

## Індикатори набору + сповіщення про прочитання

- **Індикатори набору**: OpenClaw надсилає сигнали набору через `signal-cli sendTyping` і оновлює їх, доки формується відповідь.
- **Сповіщення про прочитання**: коли `channels.signal.sendReadReceipts` має значення true, OpenClaw пересилає сповіщення про прочитання для дозволених DM.
- Signal-cli не надає сповіщення про прочитання для груп.

## Реакції (інструмент повідомлень)

- Використовуйте `message action=react` з `channel=signal`.
- Цілі: E.164 відправника або UUID (використовуйте `uuid:<id>` з виводу сполучення; голий UUID також працює).
- `messageId` — це timestamp Signal для повідомлення, на яке ви реагуєте.
- Для групових реакцій потрібен `targetAuthor` або `targetAuthorUuid`.

Приклади:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Конфігурація:

- `channels.signal.actions.reactions`: увімкнути/вимкнути дії реакцій (стандартно true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` вимикає реакції агента (інструмент повідомлень `react` поверне помилку).
  - `minimal`/`extensive` вмикає реакції агента та задає рівень інструкцій.
- Перевизначення на рівні облікового запису: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Цілі доставки (CLI/Cron)

- DM: `signal:+15551234567` (або звичайний E.164).
- UUID DM: `uuid:<id>` (або голий UUID).
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

- Daemon доступний, але відповідей немає: перевірте налаштування облікового запису/daemon (`httpUrl`, `account`) і режим прийому.
- DM ігноруються: відправник очікує підтвердження сполучення.
- Повідомлення груп ігноруються: перевірка відправника/згадки для групи блокує доставку.
- Помилки перевірки конфігурації після змін: запустіть `openclaw doctor --fix`.
- Signal відсутній у діагностиці: підтвердьте `channels.signal.enabled: true`.

Додаткові перевірки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Для процесу тріажу: [/channels/troubleshooting](/uk/channels/troubleshooting).

## Примітки щодо безпеки

- `signal-cli` зберігає ключі облікового запису локально (зазвичай `~/.local/share/signal-cli/data/`).
- Створіть резервну копію стану облікового запису Signal перед міграцією сервера або перебудовою.
- Залишайте `channels.signal.dmPolicy: "pairing"`, якщо вам явно не потрібен ширший доступ до DM.
- Перевірка через SMS потрібна лише для реєстрації або сценаріїв відновлення, але втрата контролю над номером/обліковим записом може ускладнити повторну реєстрацію.

## Довідник конфігурації (Signal)

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.signal.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.signal.account`: E.164 для облікового запису бота.
- `channels.signal.cliPath`: шлях до `signal-cli`.
- `channels.signal.httpUrl`: повна URL-адреса демона (перевизначає host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: прив’язка демона (за замовчуванням 127.0.0.1:8080).
- `channels.signal.autoStart`: автоматично запускати демон (за замовчуванням true, якщо `httpUrl` не задано).
- `channels.signal.startupTimeoutMs`: тайм-аут очікування запуску в мс (межа 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: пропускати завантаження вкладень.
- `channels.signal.ignoreStories`: ігнорувати історії від демона.
- `channels.signal.sendReadReceipts`: пересилати підтвердження прочитання.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing).
- `channels.signal.allowFrom`: список дозволених DM (E.164 або `uuid:<id>`). `open` потребує `"*"`. У Signal немає імен користувачів; використовуйте телефонні номери/UUID-ідентифікатори.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (за замовчуванням: allowlist).
- `channels.signal.groupAllowFrom`: список дозволених груп; приймає ID груп Signal (необроблені, `group:<id>` або `signal:group:<id>`), номери відправників у форматі E.164 або значення `uuid:<id>`.
- `channels.signal.groups`: перевизначення для окремих груп із ключами за id групи Signal (або `"*"`). Підтримувані поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: версія `channels.signal.groups` для окремого облікового запису в налаштуваннях із кількома обліковими записами.
- `channels.signal.historyLimit`: максимальна кількість повідомлень групи, які потрібно включати як контекст (0 вимикає).
- `channels.signal.dmHistoryLimit`: ліміт історії DM у ходах користувача. Перевизначення для окремих користувачів: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: розмір вихідного фрагмента (символи).
- `channels.signal.chunkMode`: `length` (за замовчуванням) або `newline`, щоб розділяти за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.signal.mediaMaxMb`: обмеження для вхідних/вихідних медіа (МБ).

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (Signal не підтримує нативні згадки).
- `messages.groupChat.mentionPatterns` (глобальний резервний варіант).
- `messages.responsePrefix`.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Спарювання](/uk/channels/pairing) — автентифікація DM і процес спарювання
- [Групи](/uk/channels/groups) — поведінка групового чату й обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
