---
read_when:
    - Налаштування підтримки Signal
    - Налагодження надсилання/отримання в Signal
summary: Підтримка Signal через signal-cli (JSON-RPC + SSE), шляхи налаштування та модель номерів
title: Signal
x-i18n:
    generated_at: "2026-04-30T14:53:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 244a171e969b210b58cd7b5042eb29b167473af6bee979910ba705d8d2f8283a
    source_path: channels/signal.md
    workflow: 16
---

Стан: зовнішня інтеграція CLI. Gateway взаємодіє з `signal-cli` через HTTP JSON-RPC + SSE.

## Передумови

- OpenClaw встановлено на вашому сервері (Linux-процес нижче протестовано на Ubuntu 24).
- `signal-cli` доступний на хості, де працює Gateway.
- Номер телефону, який може отримати одне SMS для підтвердження (для шляху реєстрації через SMS).
- Доступ до браузера для captcha Signal (`signalcaptchas.org`) під час реєстрації.

## Швидке налаштування (для початківців)

1. Використовуйте **окремий номер Signal** для бота (рекомендовано).
2. Встановіть `signal-cli` (потрібна Java, якщо використовуєте JVM-збірку).
3. Виберіть один шлях налаштування:
   - **Шлях A (QR-прив’язування):** `signal-cli link -n "OpenClaw"` і відскануйте через Signal.
   - **Шлях B (реєстрація через SMS):** зареєструйте виділений номер із captcha + SMS-підтвердженням.
4. Налаштуйте OpenClaw і перезапустіть Gateway.
5. Надішліть перше особисте повідомлення й підтвердьте прив’язування (`openclaw pairing approve signal <CODE>`).

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

| Поле        | Опис                                                     |
| ----------- | -------------------------------------------------------- |
| `account`   | Номер телефону бота у форматі E.164 (`+15551234567`)     |
| `cliPath`   | Шлях до `signal-cli` (`signal-cli`, якщо він у `PATH`)   |
| `dmPolicy`  | Політика доступу до особистих повідомлень (рекомендовано `pairing`) |
| `allowFrom` | Номери телефонів або значення `uuid:<id>`, яким дозволено надсилати особисті повідомлення |

## Що це таке

- Канал Signal через `signal-cli` (не вбудований libsignal).
- Детермінізована маршрутизація: відповіді завжди повертаються в Signal.
- Особисті повідомлення використовують основний сеанс агента; групи ізольовані (`agent:<agentId>:signal:group:<groupId>`).

## Записи конфігурації

За замовчуванням Signal дозволено записувати оновлення конфігурації, ініційовані через `/config set|unset` (потрібно `commands.config: true`).

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

1. Встановіть `signal-cli` (JVM або native-збірку).
2. Прив’яжіть обліковий запис бота:
   - `signal-cli link -n "OpenClaw"`, а потім відскануйте QR у Signal.
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

Використовуйте це, коли потрібен виділений номер бота замість прив’язування наявного облікового запису застосунку Signal.

1. Отримайте номер, який може приймати SMS (або голосове підтвердження для стаціонарних номерів).
   - Використовуйте виділений номер бота, щоб уникнути конфліктів облікового запису/сеансу.
2. Встановіть `signal-cli` на хості Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Якщо ви використовуєте JVM-збірку (`signal-cli-${VERSION}.tar.gz`), спочатку встановіть JRE 25+.
Підтримуйте `signal-cli` оновленим; upstream зазначає, що старі випуски можуть ламатися через зміни API серверів Signal.

3. Зареєструйте й підтвердьте номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Якщо потрібна captcha:

1. Відкрийте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдіть captcha, скопіюйте ціль посилання `signalcaptcha://...` з "Open Signal".
3. За можливості запускайте з тієї самої зовнішньої IP-адреси, що й браузерна сесія.
4. Негайно повторно запустіть реєстрацію (captcha-токени швидко спливають):

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

5. Прив’яжіть відправника особистих повідомлень:
   - Надішліть будь-яке повідомлення на номер бота.
   - Підтвердьте код на сервері: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Збережіть номер бота як контакт на телефоні, щоб уникнути "Unknown contact".

<Warning>
Реєстрація облікового запису телефонного номера через `signal-cli` може деавторизувати основний сеанс застосунку Signal для цього номера. Надавайте перевагу виділеному номеру бота або використовуйте режим QR-прив’язування, якщо потрібно зберегти наявне налаштування телефонного застосунку.
</Warning>

Посилання upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Процес captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Процес прив’язування: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Режим зовнішнього daemon (httpUrl)

Якщо ви хочете керувати `signal-cli` самостійно (повільні холодні запуски JVM, ініціалізація контейнера або спільні CPU), запустіть daemon окремо й укажіть OpenClaw на нього:

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

Це пропускає автоматичний запуск процесу й очікування запуску всередині OpenClaw. Для повільних запусків під час автоматичного запуску задайте `channels.signal.startupTimeoutMs`.

## Контроль доступу (особисті повідомлення + групи)

Особисті повідомлення:

- За замовчуванням: `channels.signal.dmPolicy = "pairing"`.
- Невідомі відправники отримують код прив’язування; повідомлення ігноруються до підтвердження (коди спливають через 1 годину).
- Підтвердження через:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Прив’язування є типовим обміном токенами для особистих повідомлень Signal. Подробиці: [Прив’язування](/uk/channels/pairing)
- Відправники лише з UUID (з `sourceUuid`) зберігаються як `uuid:<id>` у `channels.signal.allowFrom`.

Групи:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` керує тим, які групи або відправники можуть запускати відповіді в групах, коли встановлено `allowlist`; записами можуть бути ID груп Signal (сирі, `group:<id>` або `signal:group:<id>`), номери телефонів відправників або значення `uuid:<id>`.
- `channels.signal.groups["<group-id>" | "*"]` може перевизначати поведінку групи через `requireMention`, `tools` і `toolsBySender`.
- Використовуйте `channels.signal.accounts.<id>.groups` для перевизначень на рівні облікового запису в налаштуваннях із кількома обліковими записами.
- Примітка щодо runtime: якщо `channels.signal` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо встановлено `channels.defaults.groupPolicy`).

## Як це працює (поведінка)

- `signal-cli` працює як daemon; Gateway читає події через SSE.
- Вхідні повідомлення нормалізуються в спільний конверт каналу.
- Відповіді завжди маршрутизуються назад до того самого номера або групи.

## Медіа + обмеження

- Вихідний текст розбивається на фрагменти за `channels.signal.textChunkLimit` (за замовчуванням 4000).
- Необов’язкове розбиття за новими рядками: задайте `channels.signal.chunkMode="newline"`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- Вкладення підтримуються (base64 отримується з `signal-cli`).
- Вкладення голосових нотаток використовують назву файлу `signal-cli` як резервний MIME, коли `contentType` відсутній, тож транскрипція аудіо все одно може класифікувати голосові нотатки AAC.
- Типове обмеження медіа: `channels.signal.mediaMaxMb` (за замовчуванням 8).
- Використовуйте `channels.signal.ignoreAttachments`, щоб пропускати завантаження медіа.
- Контекст історії груп використовує `channels.signal.historyLimit` (або `channels.signal.accounts.*.historyLimit`), з відступом до `messages.groupChat.historyLimit`. Задайте `0`, щоб вимкнути (за замовчуванням 50).

## Індикатори набору + сповіщення про прочитання

- **Індикатори набору**: OpenClaw надсилає сигнали набору через `signal-cli sendTyping` і оновлює їх, доки виконується відповідь.
- **Сповіщення про прочитання**: коли `channels.signal.sendReadReceipts` має значення true, OpenClaw пересилає сповіщення про прочитання для дозволених особистих повідомлень.
- Signal-cli не надає сповіщення про прочитання для груп.

## Реакції (інструмент повідомлень)

- Використовуйте `message action=react` з `channel=signal`.
- Цілі: E.164 відправника або UUID (використовуйте `uuid:<id>` з виводу прив’язування; голий UUID також працює).
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
  - `minimal`/`extensive` вмикає реакції агента й задає рівень настанов.
- Перевизначення на рівні облікового запису: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Цілі доставки (CLI/cron)

- Особисті повідомлення: `signal:+15551234567` (або простий E.164).
- Особисті повідомлення UUID: `uuid:<id>` (або голий UUID).
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

Потім за потреби підтвердьте стан прив’язування особистих повідомлень:

```bash
openclaw pairing list signal
```

Поширені збої:

- Daemon доступний, але відповідей немає: перевірте налаштування облікового запису/daemon (`httpUrl`, `account`) і режим отримання.
- Особисті повідомлення ігноруються: відправник очікує підтвердження прив’язування.
- Повідомлення груп ігноруються: обмеження відправника/згадки в групі блокує доставку.
- Помилки валідації конфігурації після редагувань: запустіть `openclaw doctor --fix`.
- Signal відсутній у діагностиці: підтвердьте `channels.signal.enabled: true`.

Додаткові перевірки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Для процесу тріажу: [/channels/troubleshooting](/uk/channels/troubleshooting).

## Примітки з безпеки

- `signal-cli` зберігає ключі облікового запису локально (зазвичай `~/.local/share/signal-cli/data/`).
- Створіть резервну копію стану облікового запису Signal перед міграцією сервера або перебудовою.
- Залишайте `channels.signal.dmPolicy: "pairing"`, якщо явно не потрібен ширший доступ до особистих повідомлень.
- SMS-підтвердження потрібне лише для реєстрації або процесів відновлення, але втрата контролю над номером/обліковим записом може ускладнити повторну реєстрацію.

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
- `channels.signal.sendReadReceipts`: пересилати сповіщення про прочитання.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing).
- `channels.signal.allowFrom`: список дозволених DM (E.164 або `uuid:<id>`). `open` вимагає `"*"`. Signal не має імен користувачів; використовуйте ідентифікатори телефону/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (за замовчуванням: allowlist).
- `channels.signal.groupAllowFrom`: список дозволених груп; приймає ідентифікатори груп Signal (необроблені, `group:<id>` або `signal:group:<id>`), номери відправників у E.164 або значення `uuid:<id>`.
- `channels.signal.groups`: перевизначення для окремих груп, ключовані ідентифікатором групи Signal (або `"*"`). Підтримувані поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: версія `channels.signal.groups` для окремих облікових записів у налаштуваннях із кількома обліковими записами.
- `channels.signal.historyLimit`: максимальна кількість групових повідомлень, які потрібно включати як контекст (0 вимикає).
- `channels.signal.dmHistoryLimit`: ліміт історії DM у ходах користувача. Перевизначення для окремих користувачів: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: розмір вихідного фрагмента (символи).
- `channels.signal.chunkMode`: `length` (за замовчуванням) або `newline`, щоб ділити за порожніми рядками (межі абзаців) перед поділом за довжиною.
- `channels.signal.mediaMaxMb`: обмеження для вхідних/вихідних медіа (MB).

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (Signal не підтримує вбудовані згадки).
- `messages.groupChat.mentionPatterns` (глобальний резервний варіант).
- `messages.responsePrefix`.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Зв’язування](/uk/channels/pairing) — автентифікація DM і потік зв’язування
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення безпеки
