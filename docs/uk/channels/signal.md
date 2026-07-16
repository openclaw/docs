---
read_when:
    - Налаштування підтримки Signal
    - Налагодження надсилання й отримання повідомлень у Signal
summary: Підтримка Signal через signal-cli (нативний демон або контейнер bbernhard), способи налаштування та модель номерів
title: Signal
x-i18n:
    generated_at: "2026-07-16T17:42:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3941a5f0cde97b87c46b27f2b865cf473093dad0a5a5ada06b1934466420a6ea
    source_path: channels/signal.md
    workflow: 16
---

Signal — це завантажуваний плагін каналу (`@openclaw/signal`). Gateway взаємодіє з `signal-cli` через HTTP: або з нативним фоновим процесом (JSON-RPC + SSE), або з контейнером [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api) (REST + WebSocket). OpenClaw не містить вбудованої libsignal.

## Модель номерів (спочатку прочитайте це)

- Gateway підключається до **пристрою Signal**: облікового запису `signal-cli`.
- Якщо запустити бота у **власному особистому обліковому записі Signal**, він ігноруватиме ваші повідомлення (захист від зациклення).
- Щоб реалізувати сценарій «я пишу боту, а він відповідає», використовуйте **окремий номер бота**.

## Встановлення

```bash
openclaw plugins install @openclaw/signal
```

Для специфікацій плагінів без уточнення джерела спочатку виконується пошук у ClawHub, а потім — резервний пошук у npm. Примусово вкажіть джерело за допомогою `openclaw plugins install clawhub:@openclaw/signal` або `npm:@openclaw/signal`. `plugins install` реєструє та вмикає плагін; окремий крок `enable` не потрібен. Загальні правила встановлення див. у розділі [Плагіни](/uk/tools/plugin).

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
  <Step title="Запустіть покрокове налаштування">
    ```bash
    openclaw channels add
    ```
    Майстер визначає, чи є `signal-cli` у `PATH`, і за відсутності пропонує встановити його: завантажує офіційну нативну збірку GraalVM для Linux x86-64 або встановлює через Homebrew у macOS та на інших архітектурах. Потім він запитує номер бота та шлях `signal-cli`.

    Для неінтерактивного налаштування `openclaw channels add --channel signal` також приймає `--signal-number <e164>` для номера телефону бота, а також `--http-host <host>` і `--http-port <port>` для кінцевої точки фонового процесу Signal (типове значення — `127.0.0.1:8080`).

  </Step>
  <Step title="Прив’яжіть або зареєструйте обліковий запис">
    - **Прив’язування за QR-кодом (найшвидше):** `signal-cli link -n "OpenClaw"`, потім відскануйте код у Signal. Див. [Шлях A](#setup-path-a-link-existing-signal-account-qr).
    - **Реєстрація через SMS:** окремий номер із CAPTCHA та підтвердженням через SMS. Див. [Шлях B](#setup-path-b-register-dedicated-bot-number-sms-linux).

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

| Поле        | Опис                                       |
| ------------ | ------------------------------------------------- |
| `account`    | Номер телефону бота у форматі E.164 (`+15551234567`) |
| `cliPath`    | Шлях до `signal-cli` (`signal-cli`, якщо він є у `PATH`)  |
| `configPath` | Каталог конфігурації signal-cli, переданий як `--config`        |
| `dmPolicy`   | Політика доступу до приватних повідомлень (рекомендовано `pairing`)          |
| `allowFrom`  | Номери телефонів або значення `uuid:<id>`, яким дозволено надсилати приватні повідомлення |

Підтримка кількох облікових записів: використовуйте `channels.signal.accounts` із конфігурацією кожного облікового запису та необов’язковим `name`. Спільний шаблон див. у розділі [Канали з кількома обліковими записами](/uk/gateway/config-channels#multi-account-all-channels).

## Що це таке

- Детермінізована маршрутизація: відповіді завжди повертаються до Signal.
- Приватні повідомлення використовують основний сеанс агента спільно; групи ізольовані (`agent:<agentId>:signal:group:<groupId>`).
- Типово Signal може записувати оновлення конфігурації, ініційовані `/config set|unset` (потрібен `commands.config: true`). Вимкніть за допомогою `channels.signal.configWrites: false`.

## Шлях налаштування A: прив’язування наявного облікового запису Signal (QR-код)

1. Встановіть `signal-cli` (збірку JVM або нативну) або дозвольте `openclaw channels add` встановити його.
2. Прив’яжіть обліковий запис бота: `signal-cli link -n "OpenClaw"`, потім відскануйте QR-код у Signal.
3. Налаштуйте Signal і запустіть Gateway.

## Шлях налаштування B: реєстрація окремого номера бота (SMS, Linux)

Використовуйте цей варіант для окремого номера бота замість прив’язування наявного облікового запису застосунку Signal. Наведений нижче процес перевірено в Ubuntu 24.

1. Отримайте номер, здатний приймати SMS (або голосові виклики для підтвердження стаціонарних номерів). Окремий номер бота дає змогу уникнути конфліктів облікових записів і сеансів.
2. Встановіть `signal-cli` на хості Gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Якщо ви використовуєте збірку JVM (`signal-cli-${VERSION}.tar.gz`), спочатку встановіть JRE. Підтримуйте `signal-cli` в актуальному стані; розробники вказують, що старі випуски можуть припинити працювати через зміни API серверів Signal.

3. Зареєструйте та підтвердьте номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Якщо потрібна CAPTCHA (для виконання цього кроку необхідний доступ до браузера):

1. Відкрийте `https://signalcaptchas.org/registration/generate.html`.
2. Пройдіть CAPTCHA та скопіюйте цільове посилання `signalcaptcha://...` з «Open Signal».
3. За можливості запускайте команду з тієї самої зовнішньої IP-адреси, що й сеанс браузера (строк дії токенів CAPTCHA швидко спливає).
4. Негайно зареєструйте та підтвердьте номер:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Налаштуйте OpenClaw, перезапустіть Gateway і перевірте канал:

```bash
# Якщо ви запускаєте Gateway як користувацьку службу systemd:
systemctl --user restart openclaw-gateway.service

# Потім перевірте:
openclaw doctor
openclaw channels status --probe
```

5. Створіть пару з відправником приватних повідомлень:
   - Надішліть будь-яке повідомлення на номер бота.
   - Схваліть на сервері: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Збережіть номер бота як контакт у телефоні, щоб уникнути позначки «Unknown contact».

<Warning>
Реєстрація облікового запису з номером телефону за допомогою `signal-cli` може скасувати автентифікацію основного сеансу застосунку Signal для цього номера. Віддавайте перевагу окремому номеру бота або використовуйте режим прив’язування за QR-кодом, щоб зберегти поточне налаштування застосунку на телефоні.
</Warning>

Посилання на першоджерела:

- README `signal-cli`: `https://github.com/AsamK/signal-cli`
- Процес із CAPTCHA: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Процес прив’язування: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Режим зовнішнього фонового процесу (httpUrl)

Щоб керувати `signal-cli` самостійно (повільний холодний запуск JVM, ініціалізація контейнера, спільні ресурси процесора), запустіть фоновий процес окремо та спрямуйте OpenClaw до нього:

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

Це вимикає автоматичний запуск і очікування запуску з боку OpenClaw. Для повільного автоматичного запуску задайте `channels.signal.startupTimeoutMs`.

## Режим контейнера (bbernhard/signal-cli-rest-api)

Замість нативного запуску `signal-cli` використовуйте Docker-контейнер [bbernhard/signal-cli-rest-api](https://github.com/bbernhard/signal-cli-rest-api), який надає доступ до `signal-cli` через інтерфейс REST + WebSocket.

Вимоги:

- Для отримання повідомлень у реальному часі контейнер **обов’язково** має працювати з `MODE=json-rpc`.
- Зареєструйте або прив’яжіть свій обліковий запис Signal усередині контейнера до підключення OpenClaw.

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

| Значення         | Поведінка                                                                             |
| ------------- | ------------------------------------------------------------------------------------ |
| `"auto"`      | (Типово) Перевіряє обидва транспорти; потокове передавання перевіряє отримання через WebSocket контейнера    |
| `"native"`    | Примусово використовує нативний signal-cli (JSON-RPC за адресою `/api/v1/rpc`, SSE за адресою `/api/v1/events`)         |
| `"container"` | Примусово використовує контейнер bbernhard (REST за адресою `/v2/send`, WebSocket за адресою `/v1/receive/{account}`) |

Коли `apiMode` має значення `"auto"`, OpenClaw кешує визначений режим на 30 секунд для кожної URL-адреси фонового процесу, щоб уникнути повторних перевірок (нативний транспорт має перевагу, коли обидва транспорти справні). Отримання через контейнер вибирається для потокового передавання лише після того, як `/v1/receive/{account}` перейде на WebSocket, для чого потрібен `MODE=json-rpc`.

Режим контейнера підтримує ті самі операції Signal, що й нативний режим, якщо контейнер надає відповідні API: надсилання, отримання, вкладення, індикатори введення, сповіщення про прочитання й перегляд, реакції, групи та стилізований текст. OpenClaw перетворює нативні RPC-виклики Signal на корисні навантаження REST контейнера, зокрема ідентифікатори груп `group.{base64(internal_id)}` і `text_mode: "styled"` для форматованого тексту.

Примітки щодо експлуатації:

- Використовуйте `autoStart: false` у режимі контейнера; OpenClaw не повинен запускати нативний фоновий процес, коли вибрано `apiMode: "container"`.
- Для отримання використовуйте `MODE=json-rpc`. `MODE=normal` може створити враження, що `/v1/about` справний, але `/v1/receive/{account}` не перейде на WebSocket, тому OpenClaw не вибере потокове отримання через контейнер у режимі `auto`.
- Установіть `apiMode: "container"`, коли `httpUrl` вказує на REST API bbernhard, `"native"`, коли він вказує на нативний JSON-RPC/SSE `signal-cli`, і `"auto"`, коли розгортання може відрізнятися.
- Завантаження вкладень у режимі контейнера дотримується тих самих обмежень розміру медіаданих у байтах, що й нативний режим. Завеликі відповіді відхиляються до повного завантаження в буфер, коли сервер надсилає `Content-Length`, а в інших випадках — під час потокового передавання.

## Керування доступом (приватні повідомлення та групи)

Приватні повідомлення:

- Типове значення: `channels.signal.dmPolicy = "pairing"`.
- Невідомі відправники отримують код створення пари; повідомлення ігноруються до схвалення (строк дії кодів спливає через 1 годину).
- Схвалюйте за допомогою `openclaw pairing list signal` і `openclaw pairing approve signal <CODE>`.
- Створення пари — типовий механізм обміну токенами для приватних повідомлень Signal. Докладніше: [Створення пари](/uk/channels/pairing)
- Відправники лише з UUID (з `sourceUuid`) зберігаються як `uuid:<id>` у `channels.signal.allowFrom`.

Групи:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` визначає, які групи або відправники можуть ініціювати відповіді в групі, коли встановлено `allowlist`; записами можуть бути ідентифікатори груп Signal (необроблені, `group:<id>` або `signal:group:<id>`), номери телефонів відправників, значення `uuid:<id>` або `*`.
- `channels.signal.groups["<group-id>" | "*"]` може перевизначити поведінку групи за допомогою `requireMention`, `tools` і `toolsBySender`.
- Використовуйте `channels.signal.accounts.<id>.groups` для перевизначень окремих облікових записів у конфігураціях із кількома обліковими записами.
- Додавання групи Signal до списку дозволених через `groupAllowFrom` саме собою не вимикає обмеження за згадуванням. Окремо налаштований запис `channels.signal.groups["<group-id>"]` обробляє кожне повідомлення групи, якщо не встановлено `requireMention=true`.
- За використання `requireMention=true` нативні @згадування Signal зіставляються зі структурованими метаданими згадувань за номером телефону облікового запису бота або `accountUuid`. Налаштовані `mentionPatterns` залишаються резервним варіантом зіставлення звичайного тексту.
- Примітка щодо виконання: якщо `channels.signal` повністю відсутній, середовище виконання використовує `groupPolicy="allowlist"` як резервний варіант для перевірок груп (навіть якщо встановлено `channels.defaults.groupPolicy`).

Група з обмеженням за згадуванням і обмеженим контекстом:

```json5
{
  channels: {
    signal: {
      account: "+15551234567",
      accountUuid: "bot-signal-uuid",
      groupPolicy: "allowlist",
      groupAllowFrom: ["group:<signal-group-id>"],
      historyLimit: 8,
      groups: {
        "<signal-group-id>": { requireMention: true },
      },
    },
  },
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
}
```

Дозволені групові повідомлення, у яких бот не згадується, залишаються без відповіді й зберігаються лише в обмеженому вікні історії очікування. Коли пізніше нативна @згадка або резервна текстова згадка активує бота, OpenClaw додає цей нещодавній контекст і відповідає в тій самій групі. Вміст пропущених вкладень не завантажується; у контексті очікування вони можуть відображатися лише як компактні заповнювачі медіафайлів.

## Принцип роботи (поведінка)

- Нативний режим: `signal-cli` працює як демон; Gateway зчитує події через SSE.
- Контейнерний режим: Gateway надсилає дані через REST API й отримує їх через WebSocket.
- Вхідні повідомлення нормалізуються до спільного конверта каналу.
- Відповіді завжди спрямовуються назад на той самий номер або в ту саму групу.
- Відповіді на вхідні повідомлення містять нативні метадані цитування Signal, коли серверна частина приймає позначку часу й автора вхідного повідомлення; якщо метадані цитування відсутні або відхилені, OpenClaw надсилає відповідь як звичайне повідомлення.
- Налаштуйте використання нативного цитування за допомогою `channels.signal.replyToMode = off | first | all | batched` або `channels.signal.replyToModeByChatType.direct/group` для перевизначень за типом чату. Значення рівня облікового запису в `channels.signal.accounts.<id>` мають пріоритет.

## Медіафайли й обмеження

- Вихідний текст розбивається на фрагменти відповідно до `channels.signal.textChunkLimit` (типово 4000).
- Необов’язкове розбиття за новими рядками: установіть `channels.signal.streaming.chunkMode="newline"`, щоб спочатку розбивати текст за порожніми рядками (межами абзаців), а потім — за довжиною.
- Вкладення підтримуються (base64 отримується з `signal-cli`).
- Для вкладень із голосовими нотатками використовується ім’я файлу `signal-cli` як резервне значення MIME, коли `contentType` відсутнє, щоб транскрибування аудіо все одно могло класифікувати голосові нотатки AAC.
- Типове обмеження медіафайлів: `channels.signal.mediaMaxMb` (типово 8).
- Використовуйте `channels.signal.ignoreAttachments`, щоб пропускати завантаження медіафайлів.
- Контекст історії групи використовує `channels.signal.historyLimit` (або `channels.signal.accounts.*.historyLimit`), а резервним значенням є `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути цю функцію (типово 50).

## Індикатори введення й сповіщення про прочитання

- **Індикатори введення**: OpenClaw надсилає сигнали введення через `signal-cli sendTyping` і оновлює їх, доки формується відповідь.
- **Сповіщення про прочитання**: коли `channels.signal.sendReadReceipts` має значення true, OpenClaw пересилає сповіщення про прочитання для дозволених особистих повідомлень.
- `signal-cli` не надає сповіщень про прочитання для груп.

## Реакції стану життєвого циклу

Установіть `messages.statusReactions.enabled: true`, щоб Signal відображав спільний життєвий цикл реакцій «у черзі»/«обмірковування»/«інструмент»/«ущільнення»/«завершено»/«помилка» для вхідних запитів. Signal використовує позначку часу вхідного повідомлення як ціль реакції; групові реакції надсилаються з ідентифікатором групи Signal та початковим відправником як цільовим автором.

Для реакцій стану також потрібні реакція-підтвердження та відповідний `messages.ackReactionScope` (`direct`, `group-all`, `group-mentions` або `all`). Установіть `channels.signal.reactionLevel: "off"`, щоб вимкнути реакції стану Signal.

`messages.removeAckAfterReply: true` видаляє фінальну реакцію стану після налаштованого часу утримання. Інакше Signal відновлює початкову реакцію-підтвердження після фінального стану завершення або помилки.

## Реакції (інструмент повідомлень)

Використовуйте `message action=react` з `channel=signal`.

- Цілі: E.164 або UUID відправника (використовуйте `uuid:<id>` з результату сполучення; також працює UUID без префікса).
- `messageId` — це позначка часу Signal для повідомлення, на яке додається реакція.
- Для групових реакцій потрібен `targetAuthor` або `targetAuthorUuid`.

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Конфігурація:

- `channels.signal.actions.reactions`: увімкнути або вимкнути дії з реакціями (типово true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (типово `minimal`).
  - `off`/`ack` вимикає реакції агента (інструмент повідомлень `react` повертає помилки).
  - `minimal`/`extensive` вмикає реакції агента й задає рівень настанов.
- Перевизначення для окремих облікових записів: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Реакції схвалення

Запити Signal на схвалення виконання та Plugin використовують блоки маршрутизації верхнього рівня `approvals.exec` і `approvals.plugin`. Signal не має блоку `channels.signal.execApprovals`.

- `👍` схвалює одноразово.
- `👎` відхиляє.
- Використовуйте `/approve <id> allow-always`, коли запит передбачає постійне схвалення.

Для обробки реакції схвалення потрібні явно вказані уповноважені особи Signal з `channels.signal.allowFrom`, `channels.signal.defaultTo` або відповідних полів рівня облікового запису. Прямі запити на схвалення виконання в тому самому чаті все одно можуть приховувати дубльований локальний резервний варіант `/approve` без явно вказаних уповноважених осіб; для групових схвалень без уповноважених осіб локальний резервний варіант залишається видимим.

## Цілі доставлення (CLI/cron)

- Особисті повідомлення: `signal:+15551234567` (або звичайний E.164).
- Особисті повідомлення за UUID: `uuid:<id>` (або UUID без префікса).
- Групи: `signal:group:<groupId>`.
- Імена користувачів: `username:<name>` (якщо підтримується обліковим записом Signal).

## Псевдоніми

Налаштуйте псевдоніми для сталих назв повторюваних цілей Signal. Псевдоніми існують лише в конфігурації OpenClaw; вони не створюють і не редагують контакти Signal.

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

Використовуйте псевдоніми всюди, де приймаються цілі доставлення Signal:

```bash
openclaw message send --channel signal --target signal:ops --message "Розгортання завершено"
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

`openclaw directory peers list --channel signal` і `openclaw directory groups list --channel signal` виводять список налаштованих псевдонімів. Каталог Signal ґрунтується на конфігурації; він не запитує контакти Signal у реальному часі й не змінює обліковий запис Signal.

## Усунення несправностей

Спочатку виконайте цю послідовність:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Потім за потреби перевірте стан сполучення для особистих повідомлень:

```bash
openclaw pairing list signal
```

Поширені збої:

- Демон доступний, але відповідей немає: перевірте налаштування облікового запису й демона (`httpUrl`, `account`) та режим отримання.
- Особисті повідомлення ігноруються: відправник очікує схвалення сполучення.
- Групові повідомлення ігноруються: обмеження за відправником групи або згадкою блокують доставлення.
- Помилки перевірки конфігурації після змін: виконайте `openclaw doctor --fix`.
- Signal відсутній у діагностиці: перевірте `channels.signal.enabled: true`.

Додаткові перевірки:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Процес діагностики: [Усунення несправностей каналів](/uk/channels/troubleshooting).

## Примітки щодо безпеки

- `signal-cli` зберігає ключі облікового запису локально (зазвичай у `~/.local/share/signal-cli/data/`).
- Створіть резервну копію стану облікового запису Signal перед перенесенням або перебудовою сервера.
- Залиште `channels.signal.dmPolicy: "pairing"`, якщо ширший доступ до особистих повідомлень не потрібен явно.
- Перевірка через SMS потрібна лише для реєстрації або відновлення, але втрата контролю над номером чи обліковим записом може ускладнити повторну реєстрацію.

## Довідник конфігурації (Signal)

Повна конфігурація: [Конфігурація](/uk/gateway/configuration)

Параметри провайдера:

- `channels.signal.enabled`: увімкнути або вимкнути запуск каналу.
- `channels.signal.apiMode`: `auto | native | container` (типово: auto). Див. [Контейнерний режим](#container-mode-bbernhardsignal-cli-rest-api).
- `channels.signal.account`: E.164 облікового запису бота.
- `channels.signal.accountUuid`: необов’язковий UUID облікового запису бота для виявлення нативних @згадок і захисту від зациклення.
- `channels.signal.cliPath`: шлях до `signal-cli`.
- `channels.signal.configPath`: необов’язковий каталог `signal-cli --config`.
- `channels.signal.httpUrl`: повна URL-адреса демона (перевизначає хост і порт).
- `channels.signal.httpHost`, `channels.signal.httpPort`: адреса прив’язування демона (типово `127.0.0.1:8080`).
- `channels.signal.autoStart`: автоматично запускати демон (типово true, якщо `httpUrl` не задано).
- `channels.signal.startupTimeoutMs`: граничний час очікування запуску в мс (мін. 1000, макс. 120000; типово 30000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: пропускати завантаження вкладень.
- `channels.signal.ignoreStories`: ігнорувати історії від демона.
- `channels.signal.sendReadReceipts`: пересилати сповіщення про прочитання.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (типово: сполучення).
- `channels.signal.allowFrom`: список дозволених для особистих повідомлень (E.164 або `uuid:<id>`). `open` потребує `"*"`. Signal не має імен користувачів; використовуйте ідентифікатори телефону або UUID.
- `channels.signal.aliases`: псевдоніми на стороні OpenClaw для цілей доставлення особистих або групових повідомлень.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (типово: список дозволених).
- `channels.signal.groupAllowFrom`: список дозволених для груп; приймає ідентифікатори груп Signal (без префікса, `group:<id>` або `signal:group:<id>`), номери E.164 відправників або значення `uuid:<id>`.
- `channels.signal.groups`: перевизначення для окремих груп, ключами яких є ідентифікатори груп Signal (або `"*"`). Підтримувані поля: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: версія `channels.signal.groups` для окремого облікового запису в конфігураціях із кількома обліковими записами.
- `channels.signal.accounts.<id>.aliases`: псевдоніми окремого облікового запису, об’єднані з псевдонімами верхнього рівня.
- `channels.signal.replyToMode`: режим нативного цитування у відповідях, `off | first | all | batched` (типово: `all`).
- `channels.signal.replyToModeByChatType.direct`, `channels.signal.replyToModeByChatType.group`: перевизначення нативного цитування у відповідях для окремих типів чатів.
- `channels.signal.accounts.<id>.replyToMode`, `channels.signal.accounts.<id>.replyToModeByChatType.direct`, `channels.signal.accounts.<id>.replyToModeByChatType.group`: перевизначення цитування у відповідях для окремих облікових записів.
- `channels.signal.historyLimit`: максимальна кількість групових повідомлень, що додаються як контекст (0 вимикає).
- `channels.signal.dmHistoryLimit`: обмеження історії особистих повідомлень у репліках користувача. Перевизначення для окремих користувачів: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: розмір вихідного фрагмента в символах (типово 4000).
- `channels.signal.streaming.chunkMode`: `length` (типово) або `newline`, щоб спочатку розбивати текст за порожніми рядками (межами абзаців), а потім — за довжиною.
- `channels.signal.mediaMaxMb`: обмеження вхідних і вихідних медіафайлів у МБ (типово 8).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive` (типово `minimal`). Див. [Реакції](#reactions-message-tool).
- `channels.signal.reactionNotifications`: `off | own | all | allowlist` (типово `own`) — коли агент отримує сповіщення про вхідні реакції інших користувачів.
- `channels.signal.reactionAllowlist`: відправники, чиї реакції сповіщають агента, коли `reactionNotifications: "allowlist"`.
- `channels.signal.streaming.block.enabled`, `channels.signal.streaming.block.coalesce`: спільні для всіх каналів засоби керування потоковим передаванням у блоковому режимі. Див. [Потокове передавання](/uk/concepts/streaming).

Пов’язані глобальні параметри:

- `agents.list[].groupChat.mentionPatterns` (резервний варіант у вигляді звичайного тексту; нативні @згадки Signal виявляються зі структурованих метаданих, коли налаштовано ідентичність облікового запису бота).
- `messages.groupChat.mentionPatterns` (глобальний резервний варіант).
- `messages.responsePrefix`.

## Пов’язані матеріали

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація в особистих повідомленнях і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату й обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу й посилення захисту
