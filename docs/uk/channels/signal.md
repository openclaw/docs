---
read_when:
    - Налаштування підтримки Signal
    - Налагодження надсилання/отримання Signal
summary: Підтримка Signal через signal-cli (нативний демон або контейнер bbernhard), шляхи налаштування та модель номера
title: Signal
x-i18n:
    generated_at: "2026-07-03T17:39:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 862afe3764e89aa026d245f57134b8e8e157539f24975ca341d67296fb8852d0
    source_path: channels/signal.md
    workflow: 16
---

Status: інтеграція із зовнішнім CLI. Gateway взаємодіє з `signal-cli` через HTTP — або з нативним daemon (JSON-RPC + SSE), або з контейнером bbernhard/signal-cli-rest-api (REST + WebSocket).

## Передумови

- OpenClaw установлено на вашому сервері (Linux-процес нижче протестовано на Ubuntu 24).
- Один із варіантів:
  - `signal-cli` доступний на хості (нативний режим), **або**
  - Docker-контейнер `bbernhard/signal-cli-rest-api` (контейнерний режим).
- Номер телефону, який може отримати одне SMS для перевірки (для шляху реєстрації через SMS).
- Доступ до браузера для captcha Signal (`signalcaptchas.org`) під час реєстрації.

## Швидке налаштування (для початківців)

1. Використовуйте **окремий номер Signal** для бота (рекомендовано).
2. Установіть OpenClaw Plugin:

```bash
openclaw plugins install @openclaw/signal
```

3. Установіть `signal-cli` (Java потрібна, якщо ви використовуєте JVM-збірку).
4. Виберіть один шлях налаштування:
   - **Шлях A (QR-зв’язування):** `signal-cli link -n "OpenClaw"` і відскануйте в Signal.
   - **Шлях B (SMS-реєстрація):** зареєструйте виділений номер із captcha + SMS-перевіркою.
5. Налаштуйте OpenClaw і перезапустіть gateway.
6. Надішліть перше DM і підтвердьте pairing (`openclaw pairing approve signal <CODE>`).

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

| Поле         | Опис                                                   |
| ------------ | ------------------------------------------------------ |
| `account`    | Номер телефону бота у форматі E.164 (`+15551234567`)   |
| `cliPath`    | Шлях до `signal-cli` (`signal-cli`, якщо він у `PATH`) |
| `configPath` | Каталог конфігурації signal-cli, переданий як `--config` |
| `dmPolicy`   | Політика доступу до DM (`pairing` рекомендовано)       |
| `allowFrom`  | Номери телефонів або значення `uuid:<id>`, яким дозволено надсилати DM |

## Що це таке

- Канал Signal через `signal-cli` (не вбудований libsignal).
- Детермінізоване маршрутизування: відповіді завжди повертаються в Signal.
- DM використовують основну сесію агента; групи ізольовані (`agent:<agentId>:signal:group:<groupId>`).

## Записи конфігурації

За замовчуванням Signal дозволено записувати оновлення конфігурації, спричинені `/config set|unset` (потрібно `commands.config: true`).

Вимкнути можна так:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## Модель номера (важливо)

- Gateway підключається до **пристрою Signal** (облікового запису `signal-cli`).
- Якщо ви запускаєте бота на **своєму особистому обліковому записі Signal**, він ігноруватиме ваші власні повідомлення (захист від циклу).
- Для сценарію «я пишу боту, і він відповідає» використовуйте **окремий номер бота**.

## Шлях налаштування A: зв’язати наявний обліковий запис Signal (QR)

1. Установіть `signal-cli` (JVM або нативну збірку).
2. Зв’яжіть обліковий запис бота:
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

Підтримка кількох облікових записів: використовуйте `channels.signal.accounts` з конфігурацією для кожного облікового запису та необов’язковим `name`. Див. [`gateway/configuration`](/uk/gateway/config-channels#multi-account-all-channels) для спільного шаблону.

## Шлях налаштування B: зареєструвати виділений номер бота (SMS, Linux)

Використовуйте це, коли потрібен виділений номер бота замість зв’язування наявного облікового запису застосунку Signal.

1. Отримайте номер, який може отримувати SMS (або голосову перевірку для стаціонарних номерів).
   - Використовуйте виділений номер бота, щоб уникнути конфліктів облікового запису/сесії.
2. Установіть `signal-cli` на хості gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Якщо ви використовуєте JVM-збірку (`signal-cli-${VERSION}.tar.gz`), спершу встановіть JRE 25+.
Підтримуйте `signal-cli` актуальним; upstream зазначає, що старі випуски можуть перестати працювати через зміни API серверів Signal.

3. Зареєструйте та перевірте номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Якщо потрібна captcha:

1. Відкрийте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдіть captcha, скопіюйте ціль посилання `signalcaptcha://...` з "Open Signal".
3. За можливості запускайте з тієї самої зовнішньої IP-адреси, що й сесія браузера.
4. Негайно запустіть реєстрацію знову (captcha-токени швидко спливають):

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

5. Виконайте pairing для вашого відправника DM:
   - Надішліть будь-яке повідомлення на номер бота.
   - Підтвердьте код на сервері: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Збережіть номер бота як контакт на телефоні, щоб уникнути "Unknown contact".

<Warning>
Реєстрація облікового запису номера телефону через `signal-cli` може деавторизувати основну сесію застосунку Signal для цього номера. Віддавайте перевагу виділеному номеру бота або використовуйте режим QR-зв’язування, якщо потрібно зберегти наявне налаштування застосунку на телефоні.
</Warning>

Посилання upstream:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Процес captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Процес зв’язування: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Режим зовнішнього daemon (httpUrl)

Якщо ви хочете керувати `signal-cli` самостійно (повільні холодні старти JVM, ініціалізація контейнера або спільні CPU), запустіть daemon окремо й вкажіть OpenClaw шлях до нього:

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

## Контейнерний режим (bbernhard/signal-cli-rest-api)

Замість нативного запуску `signal-cli` можна використовувати Docker-контейнер [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api). Він обгортає `signal-cli` REST API та WebSocket-інтерфейсом.

Вимоги:

- Контейнер **має** працювати з `MODE=json-rpc` для отримання повідомлень у реальному часі.
- Зареєструйте або зв’яжіть свій обліковий запис Signal усередині контейнера перед підключенням OpenClaw.

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

Коли `apiMode` дорівнює `"auto"`, OpenClaw кешує виявлений режим на 30 секунд, щоб уникати повторних перевірок. Отримання контейнером вибирається для streaming лише після WebSocket-upgrade `/v1/receive/{account}`, для чого потрібен `MODE=json-rpc`.

Контейнерний режим підтримує ті самі операції каналу Signal, що й нативний режим, коли контейнер надає відповідні API: надсилання, отримання, вкладення, індикатори набору, квитанції прочитання/перегляду, реакції, групи та стилізований текст. OpenClaw перетворює свої нативні Signal RPC-виклики на REST-пейлоади контейнера, зокрема ID груп `group.{base64(internal_id)}` і `text_mode: "styled"` для форматованого тексту.

Операційні примітки:

- Використовуйте `autoStart: false` з контейнерним режимом. OpenClaw не має запускати нативний daemon, коли вибрано `apiMode: "container"`.
- Використовуйте `MODE=json-rpc` для отримання. `MODE=normal` може показувати `/v1/about` як справний, але `/v1/receive/{account}` не виконує WebSocket-upgrade, тому OpenClaw не вибере streaming отримання контейнера в режимі `auto`.
- Установіть `apiMode: "container"`, коли знаєте, що `httpUrl` вказує на REST API bbernhard. Установіть `apiMode: "native"`, коли знаєте, що він вказує на нативний JSON-RPC/SSE `signal-cli`. Використовуйте `"auto"`, коли розгортання може відрізнятися.
- Завантаження вкладень у контейнерному режимі дотримуються тих самих лімітів байтів медіа, що й нативний режим. Завеликі відповіді відхиляються до повного буферизування, коли сервер надсилає `Content-Length`, а в іншому разі — під час streaming.

## Контроль доступу (DM + групи)

DM:

- За замовчуванням: `channels.signal.dmPolicy = "pairing"`.
- Невідомі відправники отримують код pairing; повідомлення ігноруються, доки їх не підтверджено (коди спливають через 1 годину).
- Підтвердьте через:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- Pairing є типовим обміном токенами для Signal DM. Докладно: [Pairing](/uk/channels/pairing)
- Відправники лише з UUID (з `sourceUuid`) зберігаються як `uuid:<id>` у `channels.signal.allowFrom`.

Групи:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` керує тим, які групи або відправники можуть запускати відповіді в групах, коли встановлено `allowlist`; записами можуть бути ID груп Signal (raw, `group:<id>` або `signal:group:<id>`), номери телефонів відправників, значення `uuid:<id>` або `*`.
- `channels.signal.groups["<group-id>" | "*"]` може перевизначати поведінку групи за допомогою `requireMention`, `tools` і `toolsBySender`.
- Використовуйте `channels.signal.accounts.<id>.groups` для перевизначень за обліковим записом у налаштуваннях із кількома обліковими записами.
- Allowlisting групи Signal через `groupAllowFrom` сам собою не вимикає mention gating. Спеціально налаштований запис `channels.signal.groups["<group-id>"]` обробляє кожне повідомлення групи, якщо не встановлено `requireMention=true`.
- Примітка runtime: якщо `channels.signal` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` для перевірок груп (навіть якщо встановлено `channels.defaults.groupPolicy`).

## Як це працює (поведінка)

- Нативний режим: `signal-cli` працює як daemon; gateway читає події через SSE.
- Контейнерний режим: gateway надсилає через REST API й отримує через WebSocket.
- Вхідні повідомлення нормалізуються в спільний envelope каналу.
- Відповіді завжди маршрутизуються назад до того самого номера або групи.

## Медіа + ліміти

- Вихідний текст розбивається на частини за `channels.signal.textChunkLimit` (за замовчуванням 4000).
- Необов’язкове розбиття за новими рядками: установіть `channels.signal.chunkMode="newline"`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- Вкладення підтримуються (base64 отримується з `signal-cli`).
- Вкладення голосових нотаток використовують ім’я файлу `signal-cli` як MIME fallback, коли `contentType` відсутній, тож транскрипція аудіо все одно може класифікувати голосові memo AAC.
- Стандартний ліміт медіа: `channels.signal.mediaMaxMb` (за замовчуванням 8).
- Використовуйте `channels.signal.ignoreAttachments`, щоб пропускати завантаження медіа.
- Контекст історії груп використовує `channels.signal.historyLimit` (або `channels.signal.accounts.*.historyLimit`), з fallback до `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути (за замовчуванням 50).

## Набір тексту + квитанції прочитання

- **Індикатори набору**: OpenClaw надсилає сигнали набору через `signal-cli sendTyping` і оновлює їх, поки формується відповідь.
- **Сповіщення про прочитання**: коли `channels.signal.sendReadReceipts` має значення true, OpenClaw пересилає сповіщення про прочитання для дозволених DM.
- Signal-cli не надає сповіщення про прочитання для груп.

## Реакції стану життєвого циклу

Установіть `messages.statusReactions.enabled: true`, щоб Signal показував спільний
життєвий цикл реакцій queued/thinking/tool/compaction/done/error для вхідних звернень.
Signal використовує часову мітку вхідного повідомлення як ціль реакції; групові
реакції надсилаються з ідентифікатором групи Signal і початковим відправником як
цільовим автором.

Реакції стану також потребують реакції підтвердження та відповідного
`messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` або `all`).
Установіть `channels.signal.reactionLevel: "off"`, щоб вимкнути реакції стану Signal.
Дія `react` інструмента повідомлень суворіша: вона потребує
`reactionLevel: "minimal"` або `"extensive"`.

`messages.removeAckAfterReply: true` очищає фінальну реакцію стану після
налаштованого часу утримання. Інакше Signal відновлює початкову реакцію підтвердження після
фінального стану done/error.

## Реакції (інструмент повідомлень)

- Використовуйте `message action=react` з `channel=signal`.
- Цілі: E.164 відправника або UUID (використовуйте `uuid:<id>` з виводу сполучення; звичайний UUID також працює).
- `messageId` — це часова мітка Signal для повідомлення, на яке ви реагуєте.
- Групові реакції потребують `targetAuthor` або `targetAuthorUuid`.

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
  - `minimal`/`extensive` вмикає реакції агента та задає рівень підказок.
- Перевизначення для окремого облікового запису: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Реакції схвалення

Підказки схвалення виконання Signal і Plugin використовують блоки маршрутизації верхнього рівня `approvals.exec` і
`approvals.plugin`. Signal не має блока
`channels.signal.execApprovals`.

- `👍` схвалює один раз.
- `👎` відхиляє.
- Використовуйте `/approve <id> allow-always`, коли запит пропонує постійне схвалення.

Визначення реакцій схвалення потребує явних схвалювачів Signal із
`channels.signal.allowFrom`, `channels.signal.defaultTo` або відповідних полів рівня облікового запису.
Прямі підказки схвалення виконання в тому самому чаті все ще можуть приховувати дубльований локальний резервний варіант `/approve`
без явних схвалювачів; групові схвалення без схвалювача залишають локальний резервний варіант видимим.

## Цілі доставлення (CLI/cron)

- DM: `signal:+15551234567` (або звичайний E.164).
- DM UUID: `uuid:<id>` (або звичайний UUID).
- Групи: `signal:group:<groupId>`.
- Імена користувачів: `username:<name>` (якщо підтримується вашим обліковим записом Signal).

## Псевдоніми

Налаштовуйте псевдоніми, коли потрібні стабільні імена для повторюваних цілей Signal.
Псевдоніми є лише конфігурацією на боці OpenClaw; вони не створюють і не редагують контакти Signal.

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

Використовуйте псевдоніми будь-де, де приймаються цілі доставлення Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Deployment is complete"
```

Псевдоніми для окремого облікового запису успадковують псевдоніми верхнього рівня та можуть додавати або перевизначати імена:

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

`openclaw directory peers list --channel signal` і
`openclaw directory groups list --channel signal` показують налаштовані псевдоніми. Каталог
Signal базується на конфігурації; він не виконує live-запити до контактів Signal і не
змінює обліковий запис Signal.

## Усунення несправностей

Спершу виконайте цю послідовність:

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

- Daemon доступний, але відповідей немає: перевірте налаштування облікового запису/daemon (`httpUrl`, `account`) і режим отримання.
- DM ігноруються: відправник очікує схвалення сполучення.
- Групові повідомлення ігноруються: обмеження за відправником групи/згадкою блокує доставлення.
- Помилки перевірки конфігурації після редагувань: виконайте `openclaw doctor --fix`.
- Signal відсутній у діагностиці: підтвердьте `channels.signal.enabled: true`.

Додаткові перевірки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Для процесу тріажу: [/channels/troubleshooting](/uk/channels/troubleshooting).

## Нотатки щодо безпеки

- `signal-cli` зберігає ключі облікового запису локально (зазвичай `~/.local/share/signal-cli/data/`).
- Створіть резервну копію стану облікового запису Signal перед міграцією сервера або перебудовою.
- Залишайте `channels.signal.dmPolicy: "pairing"`, якщо вам явно не потрібен ширший доступ до DM.
- SMS-перевірка потрібна лише для реєстрації або процесів відновлення, але втрата контролю над номером/обліковим записом може ускладнити повторну реєстрацію.

## Довідник конфігурації (Signal)

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.signal.enabled`: увімкнути/вимкнути запуск каналу.
- `channels.signal.apiMode`: `auto | native | container` (типово: auto). Див. [Режим контейнера](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 для облікового запису бота.
- `channels.signal.cliPath`: шлях до `signal-cli`.
- `channels.signal.configPath`: необов’язковий каталог `signal-cli --config`.
- `channels.signal.httpUrl`: повна URL-адреса daemon (перевизначає host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: прив’язка daemon (типово 127.0.0.1:8080).
- `channels.signal.autoStart`: автоматично запускати daemon (типово true, якщо `httpUrl` не задано).
- `channels.signal.startupTimeoutMs`: таймаут очікування запуску в мс (ліміт 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: пропускати завантаження вкладень.
- `channels.signal.ignoreStories`: ігнорувати stories від daemon.
- `channels.signal.sendReadReceipts`: пересилати сповіщення про прочитання.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing).
- `channels.signal.allowFrom`: allowlist DM (E.164 або `uuid:<id>`). `open` потребує `"*"`. Signal не має імен користувачів; використовуйте ідентифікатори телефону/UUID.
- `channels.signal.aliases`: псевдоніми на боці OpenClaw для цілей доставлення DM або груп.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (типово: allowlist).
- `channels.signal.groupAllowFrom`: груповий allowlist; приймає ідентифікатори груп Signal (raw, `group:<id>` або `signal:group:<id>`), номери відправників E.164 або значення `uuid:<id>`.
- `channels.signal.groups`: перевизначення для окремих груп, ключовані ідентифікатором групи Signal (або `"*"`). Підтримувані поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: версія `channels.signal.groups` для окремого облікового запису в налаштуваннях із кількома обліковими записами.
- `channels.signal.accounts.<id>.aliases`: псевдоніми для окремого облікового запису, об’єднані з псевдонімами верхнього рівня.
- `channels.signal.historyLimit`: максимальна кількість групових повідомлень, які потрібно включити як контекст (0 вимикає).
- `channels.signal.dmHistoryLimit`: ліміт історії DM у зверненнях користувача. Перевизначення для окремого користувача: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: розмір вихідного фрагмента (символи).
- `channels.signal.chunkMode`: `length` (типово) або `newline`, щоб розділяти за порожніми рядками (межами абзаців) перед фрагментацією за довжиною.
- `channels.signal.mediaMaxMb`: ліміт вхідних/вихідних медіа (МБ).

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (Signal не підтримує нативні згадки).
- `messages.groupChat.mentionPatterns` (глобальний резервний варіант).
- `messages.responsePrefix`.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
