---
read_when:
    - Налаштування підтримки Signal
    - Налагодження надсилання/отримання Signal
summary: Підтримка Signal через signal-cli (JSON-RPC + SSE), шляхи налаштування та модель номерів
title: Signal
x-i18n:
    generated_at: "2026-04-25T05:54:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1ff4328aae73576a78b00be3dd79e9768badfc6193843ed3c05439765ae295
    source_path: channels/signal.md
    workflow: 15
---

Статус: інтеграція із зовнішнім CLI. Gateway спілкується з `signal-cli` через HTTP JSON-RPC + SSE.

## Передумови

- OpenClaw встановлено на вашому сервері (наведений нижче Linux-процес перевірено на Ubuntu 24).
- `signal-cli` доступний на хості, де працює gateway.
- Номер телефону, який може отримати одне SMS із кодом підтвердження (для шляху реєстрації через SMS).
- Доступ до браузера для captcha Signal (`signalcaptchas.org`) під час реєстрації.

## Швидке налаштування (для початківців)

1. Використовуйте **окремий номер Signal** для бота (рекомендовано).
2. Встановіть `signal-cli` (потрібна Java, якщо ви використовуєте JVM-збірку).
3. Виберіть один шлях налаштування:
   - **Шлях A (прив’язка через QR):** `signal-cli link -n "OpenClaw"` і відскануйте код у Signal.
   - **Шлях B (реєстрація через SMS):** зареєструйте окремий номер за допомогою captcha + підтвердження через SMS.
4. Налаштуйте OpenClaw і перезапустіть gateway.
5. Надішліть перше приватне повідомлення та підтвердьте сполучення (`openclaw pairing approve signal <CODE>`).

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

Довідка за полями:

| Поле        | Опис                                              |
| ----------- | ------------------------------------------------- |
| `account`   | Номер телефону бота у форматі E.164 (`+15551234567`) |
| `cliPath`   | Шлях до `signal-cli` (`signal-cli`, якщо є в `PATH`) |
| `dmPolicy`  | Політика доступу до приватних повідомлень (рекомендовано `pairing`) |
| `allowFrom` | Номери телефонів або значення `uuid:<id>`, яким дозволено надсилати приватні повідомлення |

## Що це таке

- Канал Signal через `signal-cli` (не вбудований libsignal).
- Детерміноване маршрутизування: відповіді завжди повертаються в Signal.
- Приватні повідомлення використовують основну сесію агента; групи ізольовані (`agent:<agentId>:signal:group:<groupId>`).

## Записи конфігурації

За замовчуванням Signal може записувати оновлення конфігурації, ініційовані через `/config set|unset` (потрібно `commands.config: true`).

Щоб вимкнути:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Модель номерів (важливо)

- Gateway підключається до **пристрою Signal** (облікового запису `signal-cli`).
- Якщо ви запускаєте бота на **своєму особистому обліковому записі Signal**, він ігноруватиме ваші власні повідомлення (захист від циклів).
- Для сценарію «я пишу боту, а він відповідає» використовуйте **окремий номер бота**.

## Шлях налаштування A: прив’язати наявний обліковий запис Signal (QR)

1. Встановіть `signal-cli` (JVM або native-збірку).
2. Прив’яжіть обліковий запис бота:
   - `signal-cli link -n "OpenClaw"` і відскануйте QR-код у Signal.
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

Підтримка кількох облікових записів: використовуйте `channels.signal.accounts` із конфігурацією для кожного облікового запису та необов’язковим `name`. Див. [`gateway/configuration`](/uk/gateway/config-channels#multi-account-all-channels) для спільного шаблону.

## Шлях налаштування B: зареєструвати окремий номер бота (SMS, Linux)

Використовуйте це, якщо вам потрібен окремий номер бота замість прив’язки до наявного облікового запису застосунку Signal.

1. Отримайте номер, який може приймати SMS (або голосове підтвердження для стаціонарних телефонів).
   - Використовуйте окремий номер бота, щоб уникнути конфліктів облікового запису/сесії.
2. Встановіть `signal-cli` на хості gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Якщо ви використовуєте JVM-збірку (`signal-cli-${VERSION}.tar.gz`), спочатку встановіть JRE 25+.
Підтримуйте `signal-cli` в актуальному стані; upstream зазначає, що старі релізи можуть перестати працювати, коли змінюються API серверів Signal.

3. Зареєструйте та підтвердьте номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Якщо потрібна captcha:

1. Відкрийте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдіть captcha, скопіюйте ціль посилання `signalcaptcha://...` з "Open Signal".
3. За можливості запускайте з тієї самої зовнішньої IP-адреси, що й сеанс браузера.
4. Негайно знову виконайте реєстрацію (токени captcha швидко спливають):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Налаштуйте OpenClaw, перезапустіть gateway, перевірте канал:

```bash
# Якщо ви запускаєте gateway як користувацький сервіс systemd:
systemctl --user restart openclaw-gateway.service

# Потім перевірте:
openclaw doctor
openclaw channels status --probe
```

5. Виконайте сполучення відправника приватних повідомлень:
   - Надішліть будь-яке повідомлення на номер бота.
   - Підтвердьте код на сервері: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Збережіть номер бота як контакт у своєму телефоні, щоб уникнути "Unknown contact".

Важливо: реєстрація облікового запису телефонного номера через `signal-cli` може деавторизувати основну сесію застосунку Signal для цього номера. Віддавайте перевагу окремому номеру бота або використовуйте режим прив’язки через QR, якщо вам потрібно зберегти наявне налаштування застосунку на телефоні.

Посилання на upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Потік captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Потік прив’язки: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Режим зовнішнього демона (httpUrl)

Якщо ви хочете самостійно керувати `signal-cli` (повільні холодні старти JVM, ініціалізація контейнера або спільні CPU), запустіть демон окремо й укажіть його в OpenClaw:

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

Це пропускає автоматичний запуск і очікування старту всередині OpenClaw. Для повільного запуску при автостарті встановіть `channels.signal.startupTimeoutMs`.

## Керування доступом (приватні повідомлення + групи)

Приватні повідомлення:

- За замовчуванням: `channels.signal.dmPolicy = "pairing"`.
- Невідомі відправники отримують код сполучення; повідомлення ігноруються, доки їх не підтверджено (коди спливають через 1 годину).
- Підтвердити можна через:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Сполучення — це типовий механізм обміну токенами для приватних повідомлень у Signal. Докладніше: [Pairing](/uk/channels/pairing)
- Відправники лише з UUID (із `sourceUuid`) зберігаються як `uuid:<id>` у `channels.signal.allowFrom`.

Групи:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` визначає, хто може активувати обробку в групах, коли встановлено `allowlist`.
- `channels.signal.groups["<group-id>" | "*"]` може перевизначати поведінку групи через `requireMention`, `tools` і `toolsBySender`.
- Використовуйте `channels.signal.accounts.<id>.groups` для перевизначень на рівні облікового запису в конфігураціях із кількома обліковими записами.
- Примітка щодо runtime: якщо `channels.signal` повністю відсутній, runtime використовує резервне значення `groupPolicy="allowlist"` для перевірок груп (навіть якщо встановлено `channels.defaults.groupPolicy`).

## Як це працює (поведінка)

- `signal-cli` працює як демон; gateway читає події через SSE.
- Вхідні повідомлення нормалізуються в спільний конверт каналу.
- Відповіді завжди маршрутизуються назад до того самого номера або групи.

## Медіа + обмеження

- Вихідний текст розбивається на частини відповідно до `channels.signal.textChunkLimit` (типово 4000).
- Необов’язкове розбиття за новими рядками: встановіть `channels.signal.chunkMode="newline"`, щоб розділяти за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- Вкладення підтримуються (base64 отримується з `signal-cli`).
- Вкладення голосових повідомлень використовують ім’я файлу з `signal-cli` як резервне значення MIME, коли відсутній `contentType`, тому транскрибування аудіо все одно може класифікувати голосові нотатки AAC.
- Типове обмеження медіа: `channels.signal.mediaMaxMb` (типово 8).
- Використовуйте `channels.signal.ignoreAttachments`, щоб пропустити завантаження медіа.
- Контекст історії групи використовує `channels.signal.historyLimit` (або `channels.signal.accounts.*.historyLimit`), із резервним значенням `messages.groupChat.historyLimit`. Встановіть `0`, щоб вимкнути (типово 50).

## Індикатори набору + сповіщення про прочитання

- **Індикатори набору**: OpenClaw надсилає сигнали набору через `signal-cli sendTyping` і оновлює їх, поки виконується відповідь.
- **Сповіщення про прочитання**: коли `channels.signal.sendReadReceipts` має значення true, OpenClaw пересилає сповіщення про прочитання для дозволених приватних повідомлень.
- Signal-cli не надає сповіщення про прочитання для груп.

## Реакції (інструмент message)

- Використовуйте `message action=react` з `channel=signal`.
- Цілі: E.164 відправника або UUID (використовуйте `uuid:<id>` з виводу pairing; bare UUID також працює).
- `messageId` — це мітка часу Signal для повідомлення, на яке ви реагуєте.
- Реакції в групах вимагають `targetAuthor` або `targetAuthorUuid`.

Приклади:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Конфігурація:

- `channels.signal.actions.reactions`: увімкнення/вимкнення дій реакцій (типово true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` вимикає реакції агента (інструмент message `react` поверне помилку).
  - `minimal`/`extensive` вмикає реакції агента та встановлює рівень підказок.
- Перевизначення на рівні облікового запису: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Цілі доставки (CLI/cron)

- Приватні повідомлення: `signal:+15551234567` (або просто E.164).
- Приватні повідомлення UUID: `uuid:<id>` (або bare UUID).
- Групи: `signal:group:<groupId>`.
- Імена користувачів: `username:<name>` (якщо підтримується вашим обліковим записом Signal).

## Усунення неполадок

Спочатку виконайте цей ланцюжок перевірок:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Потім за потреби підтвердьте стан сполучення приватних повідомлень:

```bash
openclaw pairing list signal
```

Поширені збої:

- Демон доступний, але відповідей немає: перевірте налаштування облікового запису/демона (`httpUrl`, `account`) і режим отримання.
- Приватні повідомлення ігноруються: відправник очікує підтвердження pairing.
- Групові повідомлення ігноруються: доставка блокується обмеженнями для відправника/згадки в групі.
- Помилки валідації конфігурації після змін: виконайте `openclaw doctor --fix`.
- Signal відсутній у діагностиці: переконайтеся, що `channels.signal.enabled: true`.

Додаткові перевірки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Для процесу діагностики: [/channels/troubleshooting](/uk/channels/troubleshooting).

## Примітки щодо безпеки

- `signal-cli` зберігає ключі облікового запису локально (зазвичай у `~/.local/share/signal-cli/data/`).
- Зробіть резервну копію стану облікового запису Signal перед міграцією або перевстановленням сервера.
- Зберігайте `channels.signal.dmPolicy: "pairing"`, якщо тільки ви явно не хочете надати ширший доступ до приватних повідомлень.
- Підтвердження через SMS потрібне лише для реєстрації або сценаріїв відновлення, але втрата контролю над номером/обліковим записом може ускладнити повторну реєстрацію.

## Довідка з конфігурації (Signal)

Повна конфігурація: [Configuration](/uk/gateway/configuration)

Параметри провайдера:

- `channels.signal.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.signal.account`: E.164 для облікового запису бота.
- `channels.signal.cliPath`: шлях до `signal-cli`.
- `channels.signal.httpUrl`: повний URL демона (перевизначає host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: прив’язка демона (типово 127.0.0.1:8080).
- `channels.signal.autoStart`: автоматичний запуск демона (типово true, якщо `httpUrl` не задано).
- `channels.signal.startupTimeoutMs`: тайм-аут очікування запуску в мс (максимум 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: пропустити завантаження вкладень.
- `channels.signal.ignoreStories`: ігнорувати stories від демона.
- `channels.signal.sendReadReceipts`: пересилати сповіщення про прочитання.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing).
- `channels.signal.allowFrom`: allowlist для приватних повідомлень (E.164 або `uuid:<id>`). Для `open` потрібне `"*"`. Signal не має імен користувачів; використовуйте ідентифікатори телефону/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (типово: allowlist).
- `channels.signal.groupAllowFrom`: allowlist відправників у групах.
- `channels.signal.groups`: перевизначення для окремих груп із ключем за id групи Signal (або `"*"`). Підтримувані поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: версія `channels.signal.groups` на рівні облікового запису для конфігурацій із кількома обліковими записами.
- `channels.signal.historyLimit`: максимальна кількість групових повідомлень, що включаються як контекст (0 вимикає).
- `channels.signal.dmHistoryLimit`: ліміт історії приватних повідомлень у ходах користувача. Перевизначення для окремих користувачів: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: розмір вихідних частин повідомлення (символи).
- `channels.signal.chunkMode`: `length` (типово) або `newline`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.signal.mediaMaxMb`: обмеження медіа для вхідних/вихідних повідомлень (МБ).

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (Signal не підтримує нативні згадки).
- `messages.groupChat.mentionPatterns` (глобальне резервне значення).
- `messages.responsePrefix`.

## Пов’язане

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація приватних повідомлень і потік сполучення
- [Groups](/uk/channels/groups) — поведінка групового чату та обмеження за згадками
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та захист
