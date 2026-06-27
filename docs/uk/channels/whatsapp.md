---
read_when:
    - Працюєте з поведінкою каналу WhatsApp/web або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, засоби контролю доступу, поведінка доставки та операційні аспекти
title: WhatsApp
x-i18n:
    generated_at: "2026-06-27T17:14:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88f81adc38bd64d1e35f382dfc209e690c059d52e522e5cbdf77d1da45c9d15f
    source_path: channels/whatsapp.md
    workflow: 16
---

Стан: готове до production через WhatsApp Web (Baileys). Gateway володіє пов’язаними сеансами.

## Встановлення (за потреби)

- Onboarding (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують встановити WhatsApp Plugin під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує потік встановлення, коли
  Plugin ще відсутній.
- Канал розробки + git checkout: типово використовує локальний шлях Plugin.
- Stable/Beta: спочатку встановлює офіційний `@openclaw/whatsapp` Plugin із ClawHub,
  з npm як fallback.
- Runtime WhatsApp поширюється поза основним npm-пакетом OpenClaw, щоб
  специфічні для WhatsApp runtime-залежності залишалися із зовнішнім Plugin.

Ручне встановлення залишається доступним:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Використовуйте голий npm-пакет (`@openclaw/whatsapp`) лише тоді, коли потрібен fallback
реєстру. Закріплюйте точну версію лише тоді, коли потрібне відтворюване встановлення.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Типова політика DM — pairing для невідомих відправників.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика та playbook-и відновлення.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Configure WhatsApp access policy">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Link WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Поточний вхід базується на QR. У віддалених або headless-середовищах переконайтеся, що
    маєте надійний спосіб доставити живий QR-код на телефон, який його скануватиме,
    перед початком входу.

    Для конкретного облікового запису:

```bash
openclaw channels login --channel whatsapp --account work
```

    Щоб під’єднати наявний/власний каталог автентифікації WhatsApp Web перед входом:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Start the gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approve first pairing request (if using pairing mode)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Запити pairing спливають через 1 годину. Очікувані запити обмежені 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує за можливості запускати WhatsApp на окремому номері. (Метадані каналу та потік налаштування оптимізовані для такого варіанту, але налаштування з особистим номером також підтримуються.)
</Note>

<Warning>
Поточний потік налаштування WhatsApp підтримує лише QR. QR, відрендерені в терміналі, знімки екрана,
PDF або вкладення в чаті можуть спливти або стати нечитабельними під час передавання
з віддаленої машини. Для віддалених/headless-хостів віддавайте перевагу прямому способу
передавання QR-зображення замість ручного захоплення з термінала.
</Warning>

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Dedicated number (recommended)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlist-и DM і межі маршрутизації
    - нижча ймовірність плутанини із self-chat

    Мінімальний шаблон політики:

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Personal-number fallback">
    Onboarding підтримує режим особистого номера й записує базову конфігурацію, дружню до self-chat:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    У runtime захисти self-chat спираються на пов’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="WhatsApp Web-only channel scope">
    Канал платформи обміну повідомленнями у поточній архітектурі каналів OpenClaw базується на WhatsApp Web (`Baileys`).

    У вбудованому реєстрі чат-каналів немає окремого каналу обміну повідомленнями Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Модель runtime

- Gateway володіє сокетом WhatsApp і циклом повторного підключення.
- Watchdog повторного підключення використовує активність транспорту WhatsApp Web, а не лише обсяг вхідних app-повідомлень, тому тихий сеанс пов’язаного пристрою не перезапускається тільки через те, що останнім часом ніхто не надсилав повідомлення. Довший ліміт тиші застосунку все одно примусово виконує повторне підключення, якщо транспортні фрейми продовжують надходити, але жодні повідомлення застосунку не обробляються протягом вікна watchdog; після тимчасового повторного підключення для нещодавно активного сеансу ця перевірка тиші застосунку використовує звичайний тайм-аут повідомлень для першого вікна відновлення.
- Таймінги сокета Baileys явно задаються в `web.whatsapp.*`: `keepAliveIntervalMs` керує ping-ами застосунку WhatsApp Web, `connectTimeoutMs` керує тайм-аутом початкового handshake, а `defaultQueryTimeoutMs` керує очікуваннями запитів Baileys разом із локальними межами OpenClaw для вихідного надсилання/presence та операцій вхідного read-receipt.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового облікового запису.
- Групові надсилання додають нативні метадані згадок для токенів `@+<digits>` і `@<digits>` у тексті та медіапідписах, коли токен відповідає поточним метаданим учасника WhatsApp, включно з групами на основі LID.
- Чати статусів і трансляцій ігноруються (`@status`, `@broadcast`).
- Watchdog повторного підключення стежить за активністю транспорту WhatsApp Web, а не лише за обсягом вхідних app-повідомлень: тихі сеанси пов’язаних пристроїв залишаються активними, доки транспортні фрейми продовжують надходити, але зависання транспорту примушує повторне підключення значно раніше за пізніший шлях віддаленого від’єднання.
- Прямі чати використовують правила DM-сеансів (`session.dmScope`; типове `main` згортає DM до головного сеансу агента).
- Групові сеанси ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters можуть бути явними вихідними цілями з їхнім нативним `@newsletter` JID. Вихідні надсилання до newsletter використовують метадані сеансу каналу (`agent:<agentId>:whatsapp:channel:<jid>`), а не семантику DM-сеансу.
- Транспорт WhatsApp Web дотримується стандартних змінних середовища проксі на хості Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Віддавайте перевагу конфігурації проксі на рівні хоста замість специфічних для каналу налаштувань проксі WhatsApp.
- Коли ввімкнено `messages.removeAckAfterReply`, OpenClaw очищає ack-реакцію WhatsApp після доставки видимої відповіді.

## Запити схвалення

WhatsApp може відображати запити схвалення exec і Plugin за допомогою реакцій `👍` / `👎`. Доставка
контролюється конфігурацією пересилання схвалень верхнього рівня:

```json5
{
  approvals: {
    exec: {
      enabled: true,
      mode: "session",
    },
    plugin: {
      enabled: true,
      mode: "targets",
      targets: [{ channel: "whatsapp", to: "+15551234567" }],
    },
  },
}
```

`approvals.exec` і `approvals.plugin` незалежні. Увімкнення WhatsApp як каналу лише пов’язує
транспорт; воно не надсилає запити схвалення, якщо відповідна сім’я схвалень не ввімкнена
та не маршрутизується до WhatsApp. Режим session доставляє нативні emoji-схвалення лише для схвалень, що
походять із WhatsApp. Режим target використовує спільний pipeline пересилання для явних цілей WhatsApp
і не створює окремий fanout approver-DM.

Реакції схвалення WhatsApp потребують явних approver-ів WhatsApp із `allowFrom` або `"*"`.
`defaultTo` керує звичайними типовими цілями повідомлень; це не approver для схвалень. Ручні
команди `/approve` все одно проходять звичайний шлях авторизації відправника WhatsApp перед
розв’язанням схвалення.

## Plugin hooks і приватність

Вхідні повідомлення WhatsApp можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сеансів. З цієї причини
WhatsApp не транслює вхідні payload-и hook `message_received` до Plugin,
якщо ви явно не ввімкнете це:

```json5
{
  channels: {
    whatsapp: {
      pluginHooks: {
        messageReceived: true,
      },
    },
  },
}
```

Можна обмежити opt-in одним обліковим записом:

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          pluginHooks: {
            messageReceived: true,
          },
        },
      },
    },
  },
}
```

Вмикайте це лише для Plugin, яким довіряєте отримання вхідного вмісту повідомлень
WhatsApp та ідентифікаторів.

## Контроль доступу й активація

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (нормалізуються внутрішньо).

    `allowFrom` — це список контролю доступу для відправників DM. Він не обмежує явні вихідні надсилання до групових JID WhatsApp або JID каналів `@newsletter`.

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над типовими значеннями рівня каналу для цього облікового запису.

    Деталі поведінки runtime:

    - pairing-и зберігаються в allow-store каналу та об’єднуються з налаштованим `allowFrom`
    - запланована автоматизація та fallback одержувачів Heartbeat використовують явні цілі доставки або налаштований `allowFrom`; схвалення DM pairing не є неявними одержувачами Cron або Heartbeat
    - якщо allowlist не налаштовано, пов’язаний власний номер дозволений типово
    - OpenClaw ніколи автоматично не pairing-ить вихідні DM `fromMe` (повідомлення, які ви надсилаєте собі з пов’язаного пристрою)

  </Tab>

  <Tab title="Group policy + allowlists">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, всі групи є придатними
       - якщо `groups` присутній, він діє як allowlist груп (`"*"` дозволено)

    2. **Політика відправників групи** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі групові вхідні повідомлення

    Fallback allowlist відправників:

    - якщо `groupAllowFrom` не задано, runtime fallback-ить до `allowFrom`, коли він доступний
    - allowlist-и відправників оцінюються перед активацією за згадкою/відповіддю

    Примітка: якщо блока `channels.whatsapp` взагалі немає, runtime fallback політики груп — `allowlist` (із warning-логом), навіть якщо задано `channels.defaults.groupPolicy`.

  </Tab>

  <Tab title="Mentions + /activation">
    Групові відповіді типово потребують згадки.

    Виявлення згадок охоплює:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - транскрипти вхідних голосових нотаток для авторизованих групових повідомлень
    - неявне виявлення reply-to-bot (відправник відповіді відповідає ідентичності бота)

    Примітка щодо безпеки:

    - quote/reply лише задовольняє mention gating; це **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації рівня сеансу:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сеансу (не глобальну конфігурацію). Вона owner-gated.

  </Tab>
</Tabs>

## Налаштовані ACP bindings

WhatsApp підтримує постійні ACP bindings із записами верхнього рівня `bindings[]`:

```json5
{
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "direct", id: "+15555550123" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "whatsapp",
        accountId: "work",
        peer: { kind: "group", id: "120363424282127706@g.us" },
      },
    },
  ],
}
```

- Прямі чати відповідають номерам E.164, як-от `+15555550123`.
- Групи відповідають WhatsApp group JID, як-от `120363424282127706@g.us`.
- Дозволені списки груп, політика відправників і шлюзи згадок або активації виконуються до того, як OpenClaw переконається, що налаштований сеанс ACP існує.
- Зіставлена налаштована прив’язка ACP володіє маршрутом. Групи розсилки WhatsApp не розгалужують цей хід на звичайні сеанси WhatsApp.

## Поведінка особистого номера та чату із собою

Коли пов’язаний власний номер також присутній у `allowFrom`, активуються запобіжники WhatsApp для чату із собою:

- пропускати сповіщення про прочитання для ходів у чаті із собою
- ігнорувати поведінку автоматичного запуску через mention-JID, яка інакше надсилала б пінг вам самим
- якщо `messages.responsePrefix` не задано, відповіді в чаті із собою типово мають префікс `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Вхідний конверт + контекст відповіді">
    Вхідні повідомлення WhatsApp загортаються у спільний вхідний конверт.

    Якщо існує цитована відповідь, контекст додається в такій формі:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 відправника).
    Коли ціль цитованої відповіді є медіа, яке можна завантажити, OpenClaw зберігає його через
    звичайне сховище вхідних медіа та показує як `MediaPath`/`MediaType`, щоб
    агент міг оглянути згадане зображення, а не бачив лише
    `<media:image>`.

  </Accordion>

  <Accordion title="Медіазаповнювачі та витягування геолокації/контактів">
    Вхідні повідомлення лише з медіа нормалізуються із заповнювачами, як-от:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові голосові нотатки транскрибуються до шлюзу згадок, коли
    тіло містить лише `<media:audio>`, тож згадування бота в голосовій нотатці може
    запустити відповідь. Якщо транскрипт усе одно не згадує бота,
    транскрипт зберігається в очікуваній історії групи замість сирого заповнювача.

    Тіла геолокації використовують стислий текст координат. Мітки/коментарі геолокації та дані контакту/vCard відтворюються як огороджені недовірені метадані, а не як вбудований текст prompt.

  </Accordion>

  <Accordion title="Вставлення очікуваної історії групи">
    Для груп необроблені повідомлення можуть буферизуватися й вставлятися як контекст, коли бот нарешті запускається.

    - типовий ліміт: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - резервне значення: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери вставлення:

    - `[Повідомлення чату з часу вашої останньої відповіді - для контексту]`
    - `[Поточне повідомлення - відповідайте на нього]`

  </Accordion>

  <Accordion title="Сповіщення про прочитання">
    Сповіщення про прочитання типово ввімкнені для прийнятих вхідних повідомлень WhatsApp.

    Вимкнути глобально:

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Перевизначення для окремого облікового запису:

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Ходи в чаті із собою пропускають сповіщення про прочитання, навіть коли вони глобально ввімкнені.

  </Accordion>
</AccordionGroup>

## Доставка, розбиття на частини та медіа

<AccordionGroup>
  <Accordion title="Розбиття тексту на частини">
    - типовий ліміт частини: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` віддає перевагу межам абзаців (порожнім рядкам), а потім повертається до безпечного за довжиною розбиття

  </Accordion>

  <Accordion title="Поведінка вихідних медіа">
    - підтримує payload зображень, відео, аудіо (голосова нотатка PTT) і документів
    - аудіомедіа надсилається через payload Baileys `audio` з `ptt: true`, тому клієнти WhatsApp відтворюють його як голосову нотатку push-to-talk
    - payload відповідей зберігає `audioAsVoice`; вивід голосової нотатки TTS для WhatsApp залишається на цьому шляху PTT, навіть коли провайдер повертає MP3 або WebM
    - нативне аудіо Ogg/Opus надсилається як `audio/ogg; codecs=opus` для сумісності з голосовими нотатками
    - аудіо не у форматі Ogg, зокрема вивід Microsoft Edge TTS MP3/WebM, перекодовується за допомогою `ffmpeg` у моно Ogg/Opus 48 кГц перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку та пригнічує повторні надсилання для тієї самої відповіді; `/tts chat on|off|default` керує автоматичним TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - `forceDocument` / `asDocument` надсилає вихідні зображення, GIF і відео через payload документа Baileys, щоб уникнути стискання медіа WhatsApp, зберігаючи визначене ім’я файлу й тип MIME
    - підписи застосовуються до першого медіаелемента під час надсилання payload відповіді з кількома медіа, окрім голосових нотаток PTT: вони надсилають аудіо першим, а видимий текст окремо, бо клієнти WhatsApp не відтворюють підписи голосових нотаток стабільно
    - джерело медіа може бути HTTP(S), `file://` або локальними шляхами

  </Accordion>

  <Accordion title="Обмеження розміру медіа та резервна поведінка">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/перебір якості), щоб уміститися в ліміти, якщо `forceDocument` / `asDocument` не вимагає доставки як документа
    - у разі помилки надсилання медіа резерв для першого елемента надсилає текстове попередження замість тихого відкидання відповіді

  </Accordion>
</AccordionGroup>

## Цитування відповідей

WhatsApp підтримує нативне цитування відповідей, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим через `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                             |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                |
| `"first"`   | Цитувати лише першу частину вихідної відповіді                        |
| `"all"`     | Цитувати кожну частину вихідної відповіді                             |
| `"batched"` | Цитувати пакетні відповіді з черги, залишаючи негайні відповіді без цитування |

Типове значення: `"off"`. Перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "first",
    },
  },
}
```

## Рівень реакцій

`channels.whatsapp.reactionLevel` керує тим, наскільки широко агент використовує emoji-реакції у WhatsApp:

| Рівень        | Ack-реакції | Реакції, ініційовані агентом | Опис                                             |
| ------------- | ----------- | ---------------------------- | ------------------------------------------------ |
| `"off"`       | Ні          | Ні                           | Жодних реакцій                                   |
| `"ack"`       | Так         | Ні                           | Лише Ack-реакції (квитанція перед відповіддю)    |
| `"minimal"`   | Так         | Так (консервативно)          | Ack + реакції агента з консервативними настановами |
| `"extensive"` | Так         | Так (заохочується)           | Ack + реакції агента із заохочувальними настановами |

Типово: `"minimal"`.

Перевизначення для окремих облікових записів використовують `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Реакції підтвердження

WhatsApp підтримує негайні Ack-реакції після отримання вхідного повідомлення через `channels.whatsapp.ackReaction`.
Ack-реакції обмежуються `reactionLevel` — вони пригнічуються, коли `reactionLevel` дорівнює `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Примітки щодо поведінки:

- надсилається негайно після прийняття вхідного повідомлення (перед відповіддю)
- якщо `ackReaction` присутній без `emoji`, WhatsApp використовує emoji ідентичності маршрутизованого агента, повертаючись до "👀"; пропустіть `ackReaction` або задайте `emoji: ""`, щоб не надсилати Ack-реакцію
- помилки журналюються, але не блокують звичайну доставку відповіді
- режим групи `mentions` реагує на ходи, запущені згадкою; активація групи `always` діє як обхід для цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Реакції статусу життєвого циклу

Задайте `messages.statusReactions.enabled: true`, щоб WhatsApp замінював Ack-реакцію під час ходу замість того, щоб залишати статичний emoji квитанції. Коли ввімкнено, OpenClaw використовує той самий слот реакції вхідного повідомлення для станів життєвого циклу, як-от у черзі, обмірковування, активність інструментів, Compaction, завершено та помилка.

```json5
{
  messages: {
    statusReactions: {
      enabled: true,
      emojis: {
        deploy: "🛫",
        build: "🏗️",
        concierge: "💁",
      },
    },
  },
}
```

Примітки щодо поведінки:

- `channels.whatsapp.ackReaction` усе ще керує тим, чи можуть реакції статусу застосовуватися для прямих повідомлень і груп.
- Реакція статусу в черзі використовує той самий ефективний Ack-emoji, що й звичайні Ack-реакції.
- WhatsApp має один слот реакції бота на повідомлення, тому оновлення життєвого циклу замінюють поточну реакцію на місці.
- `messages.removeAckAfterReply: true` очищає фінальну реакцію статусу після налаштованої затримки для завершення/помилки.
- Категорії emoji інструментів включають `tool`, `coding`, `web`, `deploy`, `build` і `concierge`.

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та типові значення">
    - ідентифікатори облікових записів походять із `channels.whatsapp.accounts`
    - типовий вибір облікового запису: `default`, якщо він присутній, інакше перший налаштований ідентифікатор облікового запису (відсортований)
    - ідентифікатори облікових записів нормалізуються внутрішньо для пошуку

  </Accordion>

  <Accordion title="Шляхи облікових даних і сумісність із застарілим форматом">
    - поточний шлях auth: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - застарілий типовий auth у `~/.openclaw/credentials/` усе ще розпізнається/мігрується для потоків типового облікового запису

  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищає стан auth WhatsApp для цього облікового запису.

    Коли Gateway доступний, вихід спершу зупиняє активний слухач WhatsApp для вибраного облікового запису, щоб пов’язаний сеанс не продовжував отримувати повідомлення до наступного перезапуску. `openclaw channels remove --channel whatsapp` також зупиняє активний слухач перед вимкненням або видаленням конфігурації облікового запису.

    У застарілих каталогах auth `oauth.json` зберігається, а файли auth Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Шлюзи дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, типово ввімкнені (вимикаються через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не пов’язано (потрібен QR)">
    Симптом: статус каналу повідомляє, що його не пов’язано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Пов’язано, але від’єднано / цикл повторного підключення">
    Симптом: пов’язаний обліковий запис із повторними від’єднаннями або спробами повторного підключення.

    Тихі облікові записи можуть залишатися підключеними після звичайного тайм-ауту повідомлень; watchdog
    перезапускається, коли активність транспорту WhatsApp Web зупиняється, сокет закривається або
    активність на рівні застосунку залишається тихою довше за розширене безпечне вікно.

    Якщо журнали показують повторюване `status=408 Request Time-out Connection was lost`, налаштуйте
    таймінги сокета Baileys у `web.whatsapp`. Почніть зі скорочення
    `keepAliveIntervalMs` нижче таймауту простою вашої мережі та збільшення
    `connectTimeoutMs` для повільних або нестабільних з’єднань:

    ```json5
    {
      web: {
        whatsapp: {
          keepAliveIntervalMs: 15000,
          connectTimeoutMs: 60000,
          defaultQueryTimeoutMs: 60000,
        },
      },
    }
    ```

    Виправлення:

    ```bash
    openclaw channels status --probe
    openclaw doctor
    openclaw logs --follow
    openclaw gateway status
    ```

    Якщо цикл зберігається після виправлення підключення хоста й таймінгів, створіть резервну копію
    каталогу автентифікації облікового запису та повторно прив’яжіть цей обліковий запис:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Якщо `~/.openclaw/logs/whatsapp-health.log` повідомляє `Gateway inactive`, але
    `openclaw gateway status` і `openclaw channels status --probe` показують, що
    Gateway і WhatsApp працюють справно, запустіть `openclaw doctor`. У Linux doctor
    попереджає про застарілі записи crontab, які досі викликають
    `~/.openclaw/bin/ensure-whatsapp.sh`; видаліть ці застарілі записи за допомогою
    `crontab -e`, оскільки cron може не мати середовища user-bus systemd і
    змушувати цей старий скрипт неправильно повідомляти про стан Gateway.

    За потреби повторно прив’яжіть за допомогою `channels login`.

  </Accordion>

  <Accordion title="Час очікування входу через QR минає за проксі">
    Симптом: `openclaw channels login --channel whatsapp` завершується помилкою до показу придатного QR-коду з `status=408 Request Time-out` або розривом TLS-сокета.

    Вхід у WhatsApp Web використовує стандартне проксі-середовище хоста Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти в нижньому регістрі та `NO_PROXY`). Перевірте, що процес Gateway успадковує змінні середовища проксі та що `NO_PROXY` не збігається з `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання швидко завершуються помилкою, коли для цільового облікового запису немає активного слухача Gateway.

    Переконайтеся, що Gateway запущено, а обліковий запис прив’язано.

  </Accordion>

  <Accordion title="Відповідь з’являється в транскрипті, але не в WhatsApp">
    Рядки транскрипту записують те, що згенерував агент. Доставка WhatsApp перевіряється окремо: OpenClaw вважає автовідповідь надісланою лише після того, як Baileys поверне ідентифікатор вихідного повідомлення принаймні для одного видимого надсилання тексту або медіа.

    Реакції-підтвердження є незалежними квитанціями перед відповіддю. Успішна реакція не доводить, що подальшу текстову або медіавідповідь прийняв WhatsApp.

    Перевірте журнали Gateway на наявність `auto-reply delivery failed` або `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Групові повідомлення неочікувано ігноруються">
    Перевірте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи списку дозволених у `groups`
    - обмеження за згадкою (`requireMention` + шаблони згадок)
    - дублікати ключів у `openclaw.json` (JSON5): пізніші записи перевизначають попередні, тому тримайте один `groupPolicy` для кожної області

    Якщо `channels.whatsapp.groups` присутній, WhatsApp усе одно може спостерігати повідомлення з інших груп, але OpenClaw відкидає їх до маршрутизації сеансу. Додайте JID групи до `channels.whatsapp.groups` або додайте `groups["*"]`, щоб допустити всі групи, зберігаючи авторизацію відправника під `groupPolicy` і `groupAllowFrom`.

  </Accordion>

  <Accordion title="Попередження середовища виконання Bun">
    Середовище виконання WhatsApp Gateway має використовувати Node. Bun позначено як несумісний для стабільної роботи WhatsApp/Telegram Gateway.
  </Accordion>
</AccordionGroup>

## Системні промпти

WhatsApp підтримує системні промпти в стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія визначення для групових повідомлень:

Ефективна мапа `groups` визначається першою: якщо обліковий запис визначає власну `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Потім пошук промпта виконується на отриманій єдиній мапі:

1. **Системний промпт для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли запис конкретної групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується й системний промпт не застосовується.
2. **Wildcard системного промпта групи** (`groups["*"].systemPrompt`): використовується, коли запис конкретної групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія визначення для прямих повідомлень:

Ефективна мапа `direct` визначається першою: якщо обліковий запис визначає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Потім пошук промпта виконується на отриманій єдиній мапі:

1. **Системний промпт для конкретного прямого чату** (`direct["<peerId>"].systemPrompt`): використовується, коли запис конкретного співрозмовника існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується й системний промпт не застосовується.
2. **Wildcard системного промпта прямого чату** (`direct["*"].systemPrompt`): використовується, коли запис конкретного співрозмовника повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` залишається легким контейнером перевизначення історії для окремих DM (`dms.<id>.historyLimit`). Перевизначення промптів розміщуються під `direct`.
</Note>

**Відмінність від багатооблікової поведінки Telegram:** У Telegram коренева `groups` навмисно пригнічується для всіх облікових записів у багатообліковому налаштуванні — навіть для облікових записів, які не визначають власну `groups` — щоб запобігти отриманню ботом групових повідомлень для груп, до яких він не належить. WhatsApp не застосовує цей запобіжник: кореневі `groups` і `direct` завжди успадковуються обліковими записами, які не визначають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У багатообліковому налаштуванні WhatsApp, якщо потрібні групові або прямі промпти для кожного облікового запису, явно визначте повну мапу під кожним обліковим записом, а не покладайтеся на кореневі типові значення.

Важлива поведінка:

- `channels.whatsapp.groups` є одночасно мапою конфігурації для кожної групи та списком дозволених груп на рівні чату. У кореневій області або області облікового запису `groups["*"]` означає «допускаються всі групи» для цієї області.
- Додавайте wildcard `systemPrompt` для групи лише тоді, коли вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб придатним був лише фіксований набір ідентифікаторів груп, не використовуйте `groups["*"]` для типового промпта. Натомість повторіть промпт у кожному явно дозволеному записі групи.
- Допуск групи й авторизація відправника є окремими перевірками. `groups["*"]` розширює набір груп, які можуть потрапити до обробки груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправника все ще окремо контролюється `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає типову конфігурацію прямого чату після того, як DM уже допущено за `dmPolicy` плюс `allowFrom` або правилами сховища парування.

Приклад:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // Use only if all groups should be admitted at the root scope.
        // Applies to all accounts that do not define their own groups map.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // Applies to all accounts that do not define their own direct map.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // This account defines its own groups, so root groups are fully
            // replaced. To keep a wildcard, define "*" explicitly here too.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // Use only if all groups should be admitted in this account.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // This account defines its own direct map, so root direct entries are
            // fully replaced. To keep a wildcard, define "*" explicitly here too.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Вказівники на довідник конфігурації

Основний довідник:

- [Довідник конфігурації - WhatsApp](/uk/gateway/config-channels#whatsapp)

Найважливіші поля WhatsApp:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- багатообліковість: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні облікового запису
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- поведінка сеансу: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- промпти: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Парування](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
