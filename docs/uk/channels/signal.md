---
read_when:
    - Налаштування підтримки Signal
    - Налагодження надсилання/отримання Signal
summary: Підтримка Signal через signal-cli (JSON-RPC + SSE), шляхи налаштування та модель номерів
title: Signal
x-i18n:
    generated_at: "2026-04-24T18:09:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc755f905af6c79903742e2ccdcc088666038dc78e36150f3f214e9c3245ad50
    source_path: channels/signal.md
    workflow: 15
---

Статус: інтеграція із зовнішнім CLI. Gateway взаємодіє з `signal-cli` через HTTP JSON-RPC + SSE.

## Передумови

- OpenClaw встановлено на вашому сервері (наведений нижче сценарій для Linux протестовано на Ubuntu 24).
- `signal-cli` доступний на хості, де працює gateway.
- Номер телефону, який може отримати одне SMS із кодом підтвердження (для сценарію реєстрації через SMS).
- Доступ до браузера для captcha Signal (`signalcaptchas.org`) під час реєстрації.

## Швидке налаштування (для початківців)

1. Використовуйте **окремий номер Signal** для бота (рекомендовано).
2. Встановіть `signal-cli` (потрібна Java, якщо ви використовуєте JVM-збірку).
3. Виберіть один зі шляхів налаштування:
   - **Шлях A (прив’язка через QR):** `signal-cli link -n "OpenClaw"` і відскануйте код у Signal.
   - **Шлях B (реєстрація через SMS):** зареєструйте окремий номер із captcha + підтвердженням через SMS.
4. Налаштуйте OpenClaw і перезапустіть gateway.
5. Надішліть перше приватне повідомлення та підтвердьте pairing (`openclaw pairing approve signal <CODE>`).

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

Довідка щодо полів:

| Field       | Description                                       |
| ----------- | ------------------------------------------------- |
| `account`   | Номер телефону бота у форматі E.164 (`+15551234567`) |
| `cliPath`   | Шлях до `signal-cli` (`signal-cli`, якщо є в `PATH`)  |
| `dmPolicy`  | Політика доступу до приватних повідомлень (`pairing` рекомендовано)          |
| `allowFrom` | Номери телефонів або значення `uuid:<id>`, яким дозволено писати в приватні повідомлення |

## Що це таке

- Канал Signal через `signal-cli` (не вбудований libsignal).
- Детермінована маршрутизація: відповіді завжди повертаються в Signal.
- Приватні повідомлення використовують основну сесію агента; групи ізольовані (`agent:<agentId>:signal:group:<groupId>`).

## Запис змін конфігурації

За замовчуванням Signal може записувати оновлення конфігурації, ініційовані через `/config set|unset` (потрібно `commands.config: true`).

Вимкнути можна так:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Модель номерів (важливо)

- Gateway підключається до **пристрою Signal** (акаунта `signal-cli`).
- Якщо ви запускаєте бота на **своєму особистому акаунті Signal**, він ігноруватиме ваші власні повідомлення (захист від циклів).
- Для сценарію «я пишу боту, і він відповідає» використовуйте **окремий номер бота**.

## Шлях налаштування A: прив’язати наявний акаунт Signal (QR)

1. Встановіть `signal-cli` (JVM або native-збірку).
2. Прив’яжіть акаунт бота:
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

Підтримка кількох акаунтів: використовуйте `channels.signal.accounts` із конфігурацією для кожного акаунта та необов’язковим `name`. Спільний шаблон дивіться в [`gateway/configuration`](/uk/gateway/config-channels#multi-account-all-channels).

## Шлях налаштування B: зареєструвати окремий номер бота (SMS, Linux)

Використовуйте цей варіант, якщо вам потрібен окремий номер бота замість прив’язки до наявного акаунта застосунку Signal.

1. Отримайте номер, який може приймати SMS (або голосове підтвердження для стаціонарних телефонів).
   - Використовуйте окремий номер бота, щоб уникнути конфліктів акаунта/сесії.
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

3. Зареєструйте номер і підтвердьте його:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Якщо потрібна captcha:

1. Відкрийте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдіть captcha, скопіюйте ціль посилання `signalcaptcha://...` з "Open Signal".
3. За можливості виконуйте це з тієї самої зовнішньої IP-адреси, що й сесія браузера.
4. Відразу повторно запустіть реєстрацію (токени captcha швидко спливають):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Налаштуйте OpenClaw, перезапустіть gateway, перевірте канал:

```bash
# Якщо ви запускаєте gateway як systemd service користувача:
systemctl --user restart openclaw-gateway.service

# Потім перевірте:
openclaw doctor
openclaw channels status --probe
```

5. Виконайте pairing для відправника приватних повідомлень:
   - Надішліть будь-яке повідомлення на номер бота.
   - Підтвердьте код на сервері: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Збережіть номер бота як контакт у телефоні, щоб уникнути "Unknown contact".

Важливо: реєстрація телефонного номера акаунта через `signal-cli` може деавторизувати основну сесію застосунку Signal для цього номера. Віддавайте перевагу окремому номеру бота або використовуйте режим прив’язки через QR, якщо вам потрібно зберегти наявне налаштування застосунку на телефоні.

Посилання на матеріали upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Сценарій із captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Сценарій прив’язки: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Режим зовнішнього демона (httpUrl)

Якщо ви хочете самостійно керувати `signal-cli` (повільні холодні старти JVM, ініціалізація контейнера або спільно використовувані CPU), запустіть демон окремо та вкажіть його в OpenClaw:

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

Це пропускає автоматичний запуск і очікування старту всередині OpenClaw. Для повільних стартів під час автозапуску встановіть `channels.signal.startupTimeoutMs`.

## Контроль доступу (приватні повідомлення + групи)

Приватні повідомлення:

- За замовчуванням: `channels.signal.dmPolicy = "pairing"`.
- Невідомі відправники отримують код pairing; повідомлення ігноруються, доки їх не буде підтверджено (коди спливають через 1 годину).
- Підтвердження через:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing — це стандартний механізм обміну токенами для приватних повідомлень у Signal. Докладніше: [Pairing](/uk/channels/pairing)
- Відправники лише з UUID (із `sourceUuid`) зберігаються як `uuid:<id>` у `channels.signal.allowFrom`.

Групи:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` визначає, хто може активувати обробку в групах, коли встановлено `allowlist`.
- `channels.signal.groups["<group-id>" | "*"]` може перевизначати поведінку групи через `requireMention`, `tools` і `toolsBySender`.
- Для перевизначень на рівні акаунта в налаштуваннях із кількома акаунтами використовуйте `channels.signal.accounts.<id>.groups`.
- Примітка щодо runtime: якщо `channels.signal` повністю відсутній, runtime для перевірок груп використовує `groupPolicy="allowlist"` як резервне значення (навіть якщо встановлено `channels.defaults.groupPolicy`).

## Як це працює (поведінка)

- `signal-cli` працює як демон; gateway читає події через SSE.
- Вхідні повідомлення нормалізуються до спільного envelope каналу.
- Відповіді завжди маршрутизуються назад до того самого номера або групи.

## Медіа + обмеження

- Вихідний текст ділиться на частини відповідно до `channels.signal.textChunkLimit` (типово 4000).
- Необов’язкове розбиття за новими рядками: встановіть `channels.signal.chunkMode="newline"`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- Вкладення підтримуються (base64 отримується з `signal-cli`).
- Типове обмеження медіа: `channels.signal.mediaMaxMb` (типово 8).
- Використовуйте `channels.signal.ignoreAttachments`, щоб пропускати завантаження медіа.
- Контекст історії групи використовує `channels.signal.historyLimit` (або `channels.signal.accounts.*.historyLimit`) із резервним переходом до `messages.groupChat.historyLimit`. Встановіть `0`, щоб вимкнути (типово 50).

## Індикатори набору + сповіщення про прочитання

- **Індикатори набору**: OpenClaw надсилає сигнали набору через `signal-cli sendTyping` і оновлює їх, поки формується відповідь.
- **Сповіщення про прочитання**: коли `channels.signal.sendReadReceipts` має значення true, OpenClaw пересилає сповіщення про прочитання для дозволених приватних повідомлень.
- Signal-cli не надає сповіщення про прочитання для груп.

## Реакції (інструмент message)

- Використовуйте `message action=react` з `channel=signal`.
- Цілі: E.164 відправника або UUID (використовуйте `uuid:<id>` з виводу pairing; простий UUID теж працює).
- `messageId` — це позначка часу Signal для повідомлення, на яке ви реагуєте.
- Для реакцій у групах потрібен `targetAuthor` або `targetAuthorUuid`.

Приклади:

```
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Конфігурація:

- `channels.signal.actions.reactions`: увімкнення/вимкнення дій реакцій (типово true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` вимикає реакції агента (`react` в інструменті message поверне помилку).
  - `minimal`/`extensive` вмикає реакції агента та задає рівень рекомендацій.
- Перевизначення на рівні акаунта: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Цілі доставки (CLI/cron)

- Приватні повідомлення: `signal:+15551234567` (або просто E.164).
- Приватні повідомлення за UUID: `uuid:<id>` (або просто UUID).
- Групи: `signal:group:<groupId>`.
- Імена користувачів: `username:<name>` (якщо підтримується вашим акаунтом Signal).

## Усунення несправностей

Спочатку виконайте цей порядок перевірок:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Потім за потреби перевірте стан pairing для приватних повідомлень:

```bash
openclaw pairing list signal
```

Поширені проблеми:

- Демон доступний, але відповідей немає: перевірте налаштування акаунта/демона (`httpUrl`, `account`) і режим отримання.
- Приватні повідомлення ігноруються: відправник очікує підтвердження pairing.
- Повідомлення групи ігноруються: правила доступу для відправника/згадки в групі блокують доставку.
- Помилки валідації конфігурації після змін: виконайте `openclaw doctor --fix`.
- Signal відсутній у діагностиці: переконайтеся, що `channels.signal.enabled: true`.

Додаткові перевірки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Для сценарію діагностики див.: [/channels/troubleshooting](/uk/channels/troubleshooting).

## Примітки щодо безпеки

- `signal-cli` зберігає ключі акаунта локально (зазвичай у `~/.local/share/signal-cli/data/`).
- Робіть резервну копію стану акаунта Signal перед міграцією або перевстановленням сервера.
- Залишайте `channels.signal.dmPolicy: "pairing"`, якщо вам не потрібен ширший доступ до приватних повідомлень.
- Підтвердження через SMS потрібне лише для сценаріїв реєстрації або відновлення, але втрата контролю над номером/акаунтом може ускладнити повторну реєстрацію.

## Довідка з конфігурації (Signal)

Повна конфігурація: [Configuration](/uk/gateway/configuration)

Параметри провайдера:

- `channels.signal.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.signal.account`: E.164 для акаунта бота.
- `channels.signal.cliPath`: шлях до `signal-cli`.
- `channels.signal.httpUrl`: повний URL демона (перевизначає host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: прив’язка демона (типово 127.0.0.1:8080).
- `channels.signal.autoStart`: автоматичний запуск демона (типово true, якщо `httpUrl` не задано).
- `channels.signal.startupTimeoutMs`: таймаут очікування запуску в мс (обмеження 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: пропускати завантаження вкладень.
- `channels.signal.ignoreStories`: ігнорувати stories від демона.
- `channels.signal.sendReadReceipts`: пересилати сповіщення про прочитання.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing).
- `channels.signal.allowFrom`: allowlist для приватних повідомлень (E.164 або `uuid:<id>`). Для `open` потрібен `"*"`. Signal не має імен користувачів; використовуйте ідентифікатори телефону/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (типово: allowlist).
- `channels.signal.groupAllowFrom`: allowlist відправників груп.
- `channels.signal.groups`: перевизначення для окремих груп за ідентифікатором групи Signal (або `"*"`). Підтримувані поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: варіант `channels.signal.groups` на рівні акаунта для налаштувань із кількома акаунтами.
- `channels.signal.historyLimit`: максимальна кількість повідомлень групи, що включаються як контекст (0 вимикає).
- `channels.signal.dmHistoryLimit`: ліміт історії приватних повідомлень у ходах користувача. Перевизначення для окремих користувачів: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: розмір вихідних частин повідомлення (символи).
- `channels.signal.chunkMode`: `length` (типово) або `newline` для розбиття за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.signal.mediaMaxMb`: обмеження медіа для вхідних/вихідних повідомлень (МБ).

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (Signal не підтримує нативні згадки).
- `messages.groupChat.mentionPatterns` (глобальний резервний варіант).
- `messages.responsePrefix`.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація приватних повідомлень і сценарій pairing
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
