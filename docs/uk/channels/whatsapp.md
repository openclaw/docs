---
read_when:
    - Робота над поведінкою каналу WhatsApp/web або маршрутизацією вхідних повідомлень
summary: Підтримка каналу WhatsApp, засоби контролю доступу, поведінка доставки та експлуатація
title: WhatsApp
x-i18n:
    generated_at: "2026-07-04T10:58:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a968c08c461708fb4b8cabe4528af2514b0a5768d272abab8f88e36e24bde302
    source_path: channels/whatsapp.md
    workflow: 16
---

Status: готово до production через WhatsApp Web (Baileys). Gateway керує пов’язаними сеансами.

## Установлення (на вимогу)

- Onboarding (`openclaw onboard`) і `openclaw channels add --channel whatsapp`
  пропонують установити плагін WhatsApp під час першого вибору.
- `openclaw channels login --channel whatsapp` також пропонує потік установлення, коли
  плагін ще не наявний.
- Dev-канал + git checkout: за замовчуванням використовує локальний шлях плагіна.
- Stable/Beta: спершу встановлює офіційний плагін `@openclaw/whatsapp` із ClawHub,
  з npm як резервним варіантом.
- Runtime WhatsApp поширюється поза основним npm-пакетом OpenClaw, щоб
  специфічні для WhatsApp runtime-залежності залишалися із зовнішнім плагіном.

Ручне встановлення залишається доступним:

```bash
openclaw plugins install clawhub:@openclaw/whatsapp
```

Використовуйте голий npm-пакет (`@openclaw/whatsapp`) лише тоді, коли потрібен резервний
варіант registry. Закріплюйте точну версію лише тоді, коли потрібне відтворюване встановлення.

<CardGroup cols={3}>
  <Card title="Сполучення" icon="link" href="/uk/channels/pairing">
    Стандартна політика DM — сполучення для невідомих відправників.
  </Card>
  <Card title="Усунення несправностей каналу" icon="wrench" href="/uk/channels/troubleshooting">
    Міжканальна діагностика й інструкції з відновлення.
  </Card>
  <Card title="Конфігурація Gateway" icon="settings" href="/uk/gateway/configuration">
    Повні шаблони й приклади конфігурації каналів.
  </Card>
</CardGroup>

## Швидке налаштування

<Steps>
  <Step title="Налаштуйте політику доступу WhatsApp">

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

  <Step title="Під’єднайте WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Поточний вхід базується на QR. У віддалених або headless-середовищах переконайтеся, що
    маєте надійний спосіб доставити live QR-код на телефон, який його скануватиме,
    перш ніж починати вхід.

    Для конкретного облікового запису:

```bash
openclaw channels login --channel whatsapp --account work
```

    Щоб під’єднати наявний або власний каталог автентифікації WhatsApp Web перед входом:

```bash
openclaw channels add --channel whatsapp --account work --auth-dir /path/to/wa-auth
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Запустіть gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Схваліть перший запит на сполучення (якщо використовується режим сполучення)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Запити на сполучення спливають через 1 годину. Очікувані запити обмежено 3 на канал.

  </Step>
</Steps>

<Note>
OpenClaw рекомендує запускати WhatsApp на окремому номері, коли це можливо. (Метадані каналу й потік налаштування оптимізовані для такого налаштування, але налаштування з особистим номером також підтримуються.)
</Note>

<Warning>
Поточний потік налаштування WhatsApp працює лише з QR. QR, відрендерені в терміналі, знімки екрана,
PDF або вкладення чату можуть спливати або ставати нечитабельними під час передавання
з віддаленої машини. Для віддалених/headless-хостів віддавайте перевагу прямому способу
передавання QR-зображення замість ручного захоплення з термінала.
</Warning>

## Виклик поточного запитувача за допомогою MeowCaller (експериментально)

Плагін WhatsApp може надавати `whatsapp_call` у WhatsApp-ініційованих ходах агента. Інструмент
використовує [MeowCaller](https://github.com/purpshell/meowcaller), щоб здійснити голосовий виклик WhatsApp
поточному авторизованому запитувачу та відтворити повідомлення OpenClaw TTS після відповіді. Інструмент
не приймає номер призначення, тому prompt не може перенаправити виклик третій стороні.
Ця експериментальна можливість вимкнена за замовчуванням.

<Warning>
MeowCaller є експериментальним, не має тегованого релізу й використовує окремо сполучений сеанс
пов’язаного пристрою whatsmeow. Він не може повторно використовувати облікові дані Baileys плагіна WhatsApp. Сполучення додає
ще один пов’язаний пристрій до того самого облікового запису WhatsApp. Скануйте ідентичністю WhatsApp, яку використовує
OpenClaw. Режим особистого номера/чату із собою не може викликати сам себе; використовуйте виділений номер OpenClaw,
щоб телефонувати на свій особистий номер.
</Warning>

<Steps>
  <Step title="Увімкніть експериментальні виклики">

    Додайте `actions.calls: true` до каналу WhatsApp в `openclaw.json`:

```json
{
  "channels": {
    "whatsapp": {
      "actions": {
        "calls": true
      }
    }
  }
}
```

    Об’єднайте це з наявною конфігурацією WhatsApp, а потім перезапустіть gateway. Коли
    параметр відсутній або має значення `false`, OpenClaw не надає агенту інструмент `whatsapp_call`.

  </Step>

  <Step title="Установіть перевірений MeowCaller CLI">

    Адаптер очікує виконуваний файл з назвою `meowcaller` у `PATH` хоста gateway.
    Поки [MeowCaller PR #7](https://github.com/purpshell/meowcaller/pull/7) не буде злито, зберіть
    перевірену гілку на коміті `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f`:

```bash
git clone --branch feat/send-only-notify https://github.com/steipete/meowcaller.git
cd meowcaller
git checkout 752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f
mkdir -p "$HOME/.local/bin"
go build -o "$HOME/.local/bin/meowcaller" ./cmd/meowcaller
```

    Переконайтеся, що `$HOME/.local/bin` також є в `PATH` служби gateway. Ця ревізія надає
    явні команди `pair` і send-only `notify`. `notify` не відкриває мікрофон, динамік,
    відеопристрій, приймач вхідного аудіо або діагностичне захоплення. Не підставляйте команду
    `play` з прикладу CLI.

  </Step>

  <Step title="Сполучіть пов’язаний пристрій MeowCaller">

    Попросіть агента WhatsApp перевірити налаштування викликів. Status-дія `whatsapp_call` повідомляє
    каталог стану для конкретного облікового запису й команду сполучення. Для стандартного облікового запису:

```bash
state_dir="$HOME/.openclaw/credentials/whatsapp-calls/default"
mkdir -p "$state_dir"
chmod 700 "$state_dir"
meowcaller pair --store "$state_dir/wa-voip.db"
```

    Запустіть команду в інтерактивному терміналі. Скануйте її QR з **WhatsApp > Linked devices**
    і дочекайтеся `MeowCaller linked device ready`. Після цього команда завершується. Зберігайте `wa-voip.db`
    приватним; це сеанс пов’язаного пристрою MeowCaller. Status-дія `whatsapp_call`
    повертає команду й shell для конкретного облікового запису, коли використовується нестандартний обліковий запис. На
    Windows запустіть відповідну команду PowerShell; MeowCaller створить каталог сховища.

  </Step>

  <Step title="Налаштуйте TTS і виклик з WhatsApp">

    Налаштуйте придатного для телефонії [провайдера TTS](/uk/tools/tts), перезапустіть gateway, а потім надішліть
    запит WhatsApp, наприклад `Call me and say the build finished.` Інструмент визначає відправника
    з довіреного вхідного контексту, синтезує тимчасовий приватний WAV-файл, запускає MeowCaller на
    обмежене вікно виклику й після цього видаляє аудіофайл. OpenClaw явно передає сховище
    облікового запису, очікує нульовий код завершення після відповіді, відтворення й завершення виклику та вважає
    timeout або ненульовий код завершення невдалим викликом інструмента.

  </Step>
</Steps>

Поточні обмеження:

- лише вихідні аудіовиклики один-на-один
- немає довільних номерів призначення
- немає спільної автентифікації зі з’єднанням чату
- немає самовикликів у режимі особистого номера/чату із собою
- синтезоване аудіо обмежене 60 секундами
- немає підтвердження чутності на боці слухавки, окрім завершення відповіді/відтворення/завершення виклику MeowCaller
- OpenClaw зупиняє супровідний процес після обмеженого вікна 115–175 секунд, включно з
  фазами з’єднання, відповіді, відтворення й завершення MeowCaller

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Виділений номер (рекомендовано)">
    Це найчистіший операційний режим:

    - окрема ідентичність WhatsApp для OpenClaw
    - чіткіші allowlist для DM і межі маршрутизації
    - нижча ймовірність плутанини з чатом із собою

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

  <Accordion title="Резервний варіант з особистим номером">
    Onboarding підтримує режим особистого номера й записує базову конфігурацію, дружню до чату із собою:

    - `dmPolicy: "allowlist"`
    - `allowFrom` містить ваш особистий номер
    - `selfChatMode: true`

    У runtime захисти чату із собою спираються на пов’язаний власний номер і `allowFrom`.

  </Accordion>

  <Accordion title="Обсяг каналу лише WhatsApp Web">
    Канал платформи обміну повідомленнями базується на WhatsApp Web (`Baileys`) у поточній архітектурі каналів OpenClaw.

    У вбудованому registry каналів чату немає окремого каналу повідомлень Twilio WhatsApp.

  </Accordion>
</AccordionGroup>

## Runtime-модель

- Gateway керує сокетом WhatsApp і циклом повторного підключення.
- Watchdog повторного підключення використовує транспортну активність WhatsApp Web, а не лише обсяг вхідних повідомлень застосунку, тому тихий сеанс пов’язаного пристрою не перезапускається лише через те, що ніхто не надсилав повідомлення останнім часом. Довше обмеження application-silence усе ще примусово виконує повторне підключення, якщо транспортні кадри продовжують надходити, але жодні повідомлення застосунку не обробляються протягом watchdog-вікна; після тимчасового повторного підключення для нещодавно активного сеансу ця перевірка application-silence використовує звичайний timeout повідомлення для першого вікна відновлення.
- Таймінги сокета Baileys явно задані в `web.whatsapp.*`: `keepAliveIntervalMs` керує application ping WhatsApp Web, `connectTimeoutMs` керує timeout початкового handshake, а `defaultQueryTimeoutMs` керує очікуваннями запитів Baileys плюс локальними межами операцій OpenClaw для вихідного надсилання/presence і вхідного read-receipt.
- Вихідні надсилання потребують активного слухача WhatsApp для цільового облікового запису.
- Групові надсилання додають нативні метадані згадок для токенів `@+<digits>` і `@<digits>` у тексті та підписах медіа, коли токен відповідає поточним метаданим учасника WhatsApp, включно з групами на базі LID.
- Чати статусів і broadcast ігноруються (`@status`, `@broadcast`).
- Watchdog повторного підключення стежить за транспортною активністю WhatsApp Web, а не лише за обсягом вхідних повідомлень застосунку: тихі сеанси пов’язаних пристроїв залишаються активними, доки транспортні кадри продовжують надходити, але зависання транспорту примусово викликає повторне підключення значно раніше за пізніший шлях віддаленого від’єднання.
- Прямі чати використовують правила DM-сеансів (`session.dmScope`; стандартний `main` згортає DM до головного сеансу агента).
- Групові сеанси ізольовані (`agent:<agentId>:whatsapp:group:<jid>`).
- WhatsApp Channels/Newsletters можуть бути явними вихідними цілями зі своїм нативним JID `@newsletter`. Вихідні надсилання newsletter використовують метадані сеансу каналу (`agent:<agentId>:whatsapp:channel:<jid>`), а не семантику DM-сеансу.
- Транспорт WhatsApp Web поважає стандартні змінні середовища proxy на хості gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / варіанти в нижньому регістрі). Віддавайте перевагу proxy-конфігурації на рівні хоста над специфічними для каналу налаштуваннями proxy WhatsApp.
- Коли ввімкнено `messages.removeAckAfterReply`, OpenClaw очищає ack-реакцію WhatsApp після доставки видимої відповіді.

## Prompt-и схвалення

WhatsApp може рендерити prompt-и схвалення exec і плагіна за допомогою реакцій `👍` / `👎`. Доставкою
керує конфігурація пересилання схвалень верхнього рівня:

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

`approvals.exec` і `approvals.plugin` є незалежними. Увімкнення WhatsApp як каналу лише під’єднує
транспорт; воно не надсилає prompt-и схвалення, якщо відповідну family схвалень не ввімкнено
й не маршрутизовано до WhatsApp. Режим session доставляє нативні emoji-схвалення лише для схвалень, що
походять із WhatsApp. Режим target використовує спільний pipeline пересилання для явних цілей WhatsApp
і не створює окремий fanout approver-DM.

Реакції схвалення WhatsApp потребують явних approver-ів WhatsApp із `allowFrom` або `"*"`.
`defaultTo` керує звичайними стандартними цілями повідомлень; це не approver для схвалень. Ручні
команди `/approve` усе ще проходять через звичайний шлях авторизації відправника WhatsApp перед
вирішенням схвалення.

## Хуки плагіна та приватність

Повідомлення, що надходять у WhatsApp, можуть містити особистий вміст повідомлень, номери телефонів,
ідентифікатори груп, імена відправників і поля кореляції сеансів. З цієї причини
WhatsApp не транслює вхідні payload-и hook-а `message_received` до plugins,
якщо ви явно не погодитеся на це:

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

Ви можете обмежити цю згоду одним обліковим записом:

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

Увімкніть це лише для plugins, яким ви довіряєте отримувати вміст і
ідентифікатори вхідних повідомлень WhatsApp.

## Контроль доступу й активація

<Tabs>
  <Tab title="DM policy">
    `channels.whatsapp.dmPolicy` керує доступом до прямих чатів:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    `allowFrom` приймає номери у стилі E.164 (нормалізуються внутрішньо).

    `allowFrom` — це список контролю доступу відправників DM. Він не обмежує явні вихідні надсилання до JID груп WhatsApp або JID каналів `@newsletter`.

    Перевизначення для кількох облікових записів: `channels.whatsapp.accounts.<id>.dmPolicy` (і `allowFrom`) мають пріоритет над типовими значеннями рівня каналу для цього облікового запису.

    Подробиці поведінки під час виконання:

    - спарювання зберігаються в allow-store каналу й об’єднуються з налаштованим `allowFrom`
    - запланована автоматизація та fallback отримувача Heartbeat використовують явні цілі доставки або налаштований `allowFrom`; схвалення спарювання DM не є неявними отримувачами Cron або Heartbeat
    - якщо allowlist не налаштовано, пов’язаний власний номер дозволено типово
    - OpenClaw ніколи автоматично не спаровує вихідні DM `fromMe` (повідомлення, які ви надсилаєте собі з пов’язаного пристрою)

  </Tab>

  <Tab title="Group policy + allowlists">
    Доступ до груп має два рівні:

    1. **Allowlist членства в групах** (`channels.whatsapp.groups`)
       - якщо `groups` пропущено, придатні всі групи
       - якщо `groups` присутній, він діє як allowlist груп (`"*"` дозволено)

    2. **Політика відправників групи** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open`: allowlist відправників обходиться
       - `allowlist`: відправник має відповідати `groupAllowFrom` (або `*`)
       - `disabled`: блокувати всі вхідні повідомлення груп

    Fallback allowlist відправників:

    - якщо `groupAllowFrom` не задано, runtime повертається до `allowFrom`, коли він доступний
    - allowlist-и відправників оцінюються перед активацією через згадку/відповідь

    Примітка: якщо блоку `channels.whatsapp` взагалі немає, fallback політики груп runtime — `allowlist` (із попереджувальним логом), навіть якщо `channels.defaults.groupPolicy` задано.

  </Tab>

  <Tab title="Mentions + /activation">
    Відповіді в групах типово потребують згадки.

    Виявлення згадок охоплює:

    - явні згадки WhatsApp ідентичності бота
    - налаштовані regex-шаблони згадок (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - транскрипти вхідних голосових нотаток для авторизованих групових повідомлень
    - неявне виявлення відповіді боту (відправник відповіді збігається з ідентичністю бота)

    Примітка щодо безпеки:

    - цитата/відповідь лише задовольняє перевірку згадки; вона **не** надає авторизацію відправнику
    - з `groupPolicy: "allowlist"` відправники поза allowlist усе одно блокуються, навіть якщо вони відповідають на повідомлення користувача з allowlist

    Команда активації на рівні сеансу:

    - `/activation mention`
    - `/activation always`

    `activation` оновлює стан сеансу (не глобальну конфігурацію). Вона обмежена власником.

  </Tab>
</Tabs>

## Налаштовані прив’язки ACP

WhatsApp підтримує сталі прив’язки ACP із записами верхнього рівня `bindings[]`:

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

- Прямі чати зіставляються з номерами E.164, як-от `+15555550123`.
- Групи зіставляються з JID груп WhatsApp, як-от `120363424282127706@g.us`.
- Allowlist-и груп, політика відправників і перевірка згадки або активації виконуються до того, як OpenClaw забезпечує існування налаштованого сеансу ACP.
- Зіставлена налаштована прив’язка ACP володіє маршрутом. Групи трансляції WhatsApp не розгалужують цей turn до звичайних сеансів WhatsApp.

## Поведінка особистого номера й чату із собою

Коли пов’язаний власний номер також присутній у `allowFrom`, активуються запобіжники чату із собою у WhatsApp:

- пропускати сповіщення про прочитання для turn-ів чату із собою
- ігнорувати поведінку автоматичного запуску за mention-JID, яка інакше пінгувала б вас самих
- якщо `messages.responsePrefix` не задано, відповіді в чаті із собою типово мають префікс `[{identity.name}]` або `[openclaw]`

## Нормалізація повідомлень і контекст

<AccordionGroup>
  <Accordion title="Inbound envelope + reply context">
    Вхідні повідомлення WhatsApp обгортаються в спільний вхідний envelope.

    Якщо існує цитована відповідь, контекст додається в такій формі:

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Поля метаданих відповіді також заповнюються, коли доступні (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID/E.164 відправника).
    Коли ціль цитованої відповіді — медіа, яке можна завантажити, OpenClaw зберігає його через
    звичайне сховище вхідних медіа й показує як `MediaPath`/`MediaType`, щоб
    агент міг переглянути посилане зображення, а не лише бачити
    `<media:image>`.

  </Accordion>

  <Accordion title="Media placeholders and location/contact extraction">
    Вхідні повідомлення лише з медіа нормалізуються із placeholder-ами, як-от:

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Авторизовані групові голосові нотатки транскрибуються перед перевіркою згадки, коли
    тіло містить лише `<media:audio>`, тож вимовлена згадка бота в голосовій нотатці може
    запустити відповідь. Якщо транскрипт усе одно не згадує бота,
    транскрипт зберігається в очікуваній історії групи замість сирого placeholder-а.

    Тіла локацій використовують стислий текст координат. Мітки/коментарі локацій і деталі контактів/vCard відображаються як fenced недовірені метадані, а не як inline текст prompt-а.

  </Accordion>

  <Accordion title="Pending group history injection">
    Для груп необроблені повідомлення можуть буферизуватися й додаватися як контекст, коли бота нарешті запускають.

    - типовий ліміт: `50`
    - конфігурація: `channels.whatsapp.historyLimit`
    - fallback: `messages.groupChat.historyLimit`
    - `0` вимикає

    Маркери вставлення:

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Read receipts">
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

    Turn-и чату із собою пропускають сповіщення про прочитання, навіть коли їх глобально ввімкнено.

  </Accordion>
</AccordionGroup>

## Доставка, chunking і медіа

<AccordionGroup>
  <Accordion title="Text chunking">
    - типовий ліміт chunk-а: `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - режим `newline` надає перевагу межам абзаців (порожнім рядкам), а потім повертається до chunking-а, безпечного за довжиною

  </Accordion>

  <Accordion title="Outbound media behavior">
    - підтримує payload-и зображень, відео, аудіо (голосова нотатка PTT) і документів
    - аудіомедіа надсилається через payload Baileys `audio` з `ptt: true`, тож клієнти WhatsApp відображають його як push-to-talk голосову нотатку
    - payload-и відповідей зберігають `audioAsVoice`; вивід голосової нотатки TTS для WhatsApp залишається на цьому PTT-шляху, навіть коли провайдер повертає MP3 або WebM
    - native Ogg/Opus-аудіо надсилається як `audio/ogg; codecs=opus` для сумісності голосових нотаток
    - аудіо не в Ogg, зокрема MP3/WebM-вивід Microsoft Edge TTS, транскодується за допомогою `ffmpeg` у моно Ogg/Opus 48 kHz перед доставкою PTT
    - `/tts latest` надсилає останню відповідь асистента як одну голосову нотатку й пригнічує повторні надсилання для тієї самої відповіді; `/tts chat on|off|default` керує auto-TTS для поточного чату WhatsApp
    - відтворення анімованих GIF підтримується через `gifPlayback: true` під час надсилання відео
    - `forceDocument` / `asDocument` надсилає вихідні зображення, GIF і відео через document payload Baileys, щоб уникнути стиснення медіа WhatsApp, зберігаючи визначені ім’я файлу та MIME-тип
    - підписи застосовуються до першого медіаелемента під час надсилання payload-ів відповідей із кількома медіа, окрім голосових нотаток PTT: вони надсилають аудіо першим, а видимий текст окремо, бо клієнти WhatsApp не відображають підписи голосових нотаток послідовно
    - джерело медіа може бути HTTP(S), `file://` або локальними шляхами

  </Accordion>

  <Accordion title="Media size limits and fallback behavior">
    - ліміт збереження вхідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - ліміт надсилання вихідних медіа: `channels.whatsapp.mediaMaxMb` (типово `50`)
    - перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - зображення автоматично оптимізуються (зміна розміру/підбір якості), щоб укластися в ліміти, якщо `forceDocument` / `asDocument` не запитує доставку як документа
    - у разі збою надсилання медіа fallback першого елемента надсилає текстове попередження замість мовчазного відкидання відповіді

  </Accordion>
</AccordionGroup>

## Цитування відповідей

WhatsApp підтримує native цитування відповідей, коли вихідні відповіді видимо цитують вхідне повідомлення. Керуйте цим через `channels.whatsapp.replyToMode`.

| Значення    | Поведінка                                                             |
| ----------- | --------------------------------------------------------------------- |
| `"off"`     | Ніколи не цитувати; надсилати як звичайне повідомлення                |
| `"first"`   | Цитувати лише перший chunk вихідної відповіді                         |
| `"all"`     | Цитувати кожен chunk вихідної відповіді                               |
| `"batched"` | Цитувати queued batched відповіді, залишаючи негайні відповіді без цитування |

Типово — `"off"`. Перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<id>.replyToMode`.

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

| Рівень       | Ack-реакції | Реакції, ініційовані агентом | Опис                                             |
| ------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `"off"`       | Ні            | Ні                        | Жодних реакцій                                   |
| `"ack"`       | Так           | Ні                        | Лише ack-реакції (підтвердження перед відповіддю) |
| `"minimal"`   | Так           | Так (консервативно)       | Ack + реакції агента з консервативними настановами |
| `"extensive"` | Так           | Так (заохочується)        | Ack + реакції агента із заохочувальними настановами |

Типово: `"minimal"`.

Перевизначення для окремого облікового запису використовують `channels.whatsapp.accounts.<id>.reactionLevel`.

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

WhatsApp підтримує негайні ack-реакції на отримання вхідних повідомлень через `channels.whatsapp.ackReaction`.
Ack-реакції обмежуються `reactionLevel` — вони пригнічуються, коли `reactionLevel` має значення `"off"`.

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

- надсилається одразу після прийняття вхідного повідомлення (до відповіді)
- якщо `ackReaction` вказано без `emoji`, WhatsApp використовує емодзі ідентичності маршрутизованого агента, з відступом до "👀"; пропустіть `ackReaction` або встановіть `emoji: ""`, щоб не надсилати реакцію підтвердження
- збої журналюються, але не блокують звичайну доставку відповіді
- груповий режим `mentions` реагує на ходи, запущені згадкою; групова активація `always` діє як обхід цієї перевірки
- WhatsApp використовує `channels.whatsapp.ackReaction` (застарілий `messages.ackReaction` тут не використовується)

## Реакції стану життєвого циклу

Установіть `messages.statusReactions.enabled: true`, щоб WhatsApp замінював реакцію підтвердження під час ходу, а не залишав статичний емодзі отримання. Коли це ввімкнено, OpenClaw використовує той самий слот реакції вхідного повідомлення для станів життєвого циклу, як-от у черзі, обдумування, активність інструментів, Compaction, завершено й помилка.

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

- `channels.whatsapp.ackReaction` і далі контролює, чи можуть реакції стану застосовуватися для прямих повідомлень і груп.
- Реакція стану в черзі використовує той самий ефективний емодзі підтвердження, що й звичайні реакції підтвердження.
- WhatsApp має один слот реакції бота на повідомлення, тому оновлення життєвого циклу замінюють поточну реакцію на місці.
- `messages.removeAckAfterReply: true` очищує фінальну реакцію стану після налаштованого утримання стану завершення/помилки.
- Категорії емодзі інструментів включають `tool`, `coding`, `web`, `deploy`, `build` і `concierge`.

## Кілька облікових записів і облікові дані

<AccordionGroup>
  <Accordion title="Вибір облікового запису та типові значення">
    - ідентифікатори облікових записів походять із `channels.whatsapp.accounts`
    - типовий вибір облікового запису: `default`, якщо він наявний, інакше перший налаштований ідентифікатор облікового запису (за сортуванням)
    - ідентифікатори облікових записів внутрішньо нормалізуються для пошуку

  </Accordion>

  <Accordion title="Шляхи облікових даних і сумісність із застарілими версіями">
    - поточний шлях автентифікації: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - файл резервної копії: `creds.json.bak`
    - застаріла типова автентифікація в `~/.openclaw/credentials/` досі розпізнається/мігрується для потоків типового облікового запису

  </Accordion>

  <Accordion title="Поведінка виходу">
    `openclaw channels logout --channel whatsapp [--account <id>]` очищує стан автентифікації WhatsApp для цього облікового запису.

    Коли Gateway доступний, вихід спершу зупиняє активний слухач WhatsApp для вибраного облікового запису, щоб пов'язана сесія не продовжувала отримувати повідомлення до наступного перезапуску. `openclaw channels remove --channel whatsapp` також зупиняє активний слухач перед вимкненням або видаленням конфігурації облікового запису.

    У застарілих каталогах автентифікації `oauth.json` зберігається, а файли автентифікації Baileys видаляються.

  </Accordion>
</AccordionGroup>

## Інструменти, дії та записи конфігурації

- Підтримка інструментів агента включає дію реакції WhatsApp (`react`).
- Шлюзи дій:
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Записи конфігурації, ініційовані каналом, увімкнено типово (вимкнення через `channels.whatsapp.configWrites=false`).

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Не пов'язано (потрібен QR)">
    Симптом: стан каналу повідомляє, що його не пов'язано.

    Виправлення:

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Пов'язано, але від'єднано / цикл перепідключення">
    Симптом: пов'язаний обліковий запис із повторюваними від'єднаннями або спробами перепідключення.

    Тихі облікові записи можуть залишатися підключеними після звичайного тайм-ауту повідомлень; сторожовий механізм
    перезапускається, коли активність транспорту WhatsApp Web зупиняється, сокет закривається або
    активність на рівні застосунку залишається безшумною довше за розширене безпечне вікно.

    Якщо журнали показують повторюване `status=408 Request Time-out Connection was lost`, налаштуйте
    таймінги сокета Baileys у `web.whatsapp`. Почніть зі скорочення
    `keepAliveIntervalMs` нижче тайм-ауту простою вашої мережі та збільшення
    `connectTimeoutMs` на повільних або нестабільних з'єднаннях:

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

    Якщо цикл зберігається після виправлення з'єднання хоста й таймінгів, створіть резервну копію
    каталогу автентифікації облікового запису та повторно пов'яжіть цей обліковий запис:

    ```bash
    cp -a ~/.openclaw/credentials/whatsapp/<accountId> \
      ~/.openclaw/credentials/whatsapp/<accountId>.bak
    openclaw channels logout --channel whatsapp --account <accountId>
    openclaw channels login --channel whatsapp --account <accountId>
    ```

    Якщо `~/.openclaw/logs/whatsapp-health.log` каже `Gateway inactive`, але
    `openclaw gateway status` і `openclaw channels status --probe` показують, що
    gateway і WhatsApp справні, запустіть `openclaw doctor`. У Linux doctor
    попереджає про застарілі записи crontab, які досі викликають
    `~/.openclaw/bin/ensure-whatsapp.sh`; видаліть ці застарілі записи через
    `crontab -e`, оскільки cron може не мати середовища користувацької шини systemd і
    змушувати цей старий скрипт неправильно повідомляти про справність gateway.

    За потреби повторно пов'яжіть через `channels login`.

  </Accordion>

  <Accordion title="Вхід за QR завершується тайм-аутом за проксі">
    Симптом: `openclaw channels login --channel whatsapp` завершується збоєм до показу придатного QR-коду з `status=408 Request Time-out` або від'єднанням TLS-сокета.

    Вхід WhatsApp Web використовує стандартне проксі-середовище хоста gateway (`HTTPS_PROXY`, `HTTP_PROXY`, варіанти в нижньому регістрі та `NO_PROXY`). Перевірте, що процес gateway успадковує змінні середовища проксі та що `NO_PROXY` не збігається з `mmg.whatsapp.net`.

  </Accordion>

  <Accordion title="Немає активного слухача під час надсилання">
    Вихідні надсилання швидко завершуються збоєм, коли для цільового облікового запису немає активного слухача gateway.

    Переконайтеся, що gateway запущено, а обліковий запис пов'язано.

  </Accordion>

  <Accordion title="Відповідь з'являється в транскрипті, але не в WhatsApp">
    Рядки транскрипту записують те, що згенерував агент. Доставка WhatsApp перевіряється окремо: OpenClaw вважає автоматичну відповідь надісланою лише після того, як Baileys поверне ідентифікатор вихідного повідомлення принаймні для одного видимого текстового або медіанадсилання.

    Реакції підтвердження є незалежними квитанціями до відповіді. Успішна реакція не доводить, що пізнішу текстову або медіавідповідь прийняв WhatsApp.

    Перевірте журнали gateway на `auto-reply delivery failed` або `auto-reply was not accepted by WhatsApp provider`.

  </Accordion>

  <Accordion title="Групові повідомлення неочікувано ігноруються">
    Перевірте в такому порядку:

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - записи allowlist у `groups`
    - шлюзування згадок (`requireMention` + шаблони згадок)
    - дублікати ключів у `openclaw.json` (JSON5): пізніші записи перевизначають раніші, тому залишайте один `groupPolicy` на область

    Якщо `channels.whatsapp.groups` наявний, WhatsApp усе ще може спостерігати повідомлення з інших груп, але OpenClaw відкидає їх до маршрутизації сесії. Додайте JID групи до `channels.whatsapp.groups` або додайте `groups["*"]`, щоб допустити всі групи, зберігаючи авторизацію відправників під `groupPolicy` і `groupAllowFrom`.

  </Accordion>

  <Accordion title="Попередження середовища виконання Bun">
    Середовище виконання gateway WhatsApp має використовувати Node. Bun позначено як несумісний для стабільної роботи gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Системні промпти

WhatsApp підтримує системні промпти в стилі Telegram для груп і прямих чатів через мапи `groups` і `direct`.

Ієрархія розв'язання для групових повідомлень:

Ефективна мапа `groups` визначається першою: якщо обліковий запис визначає власну `groups`, вона повністю замінює кореневу мапу `groups` (без глибокого злиття). Потім пошук промпта виконується на отриманій єдиній мапі:

1. **Системний промпт для конкретної групи** (`groups["<groupId>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується й системний промпт не застосовується.
2. **Wildcard-системний промпт групи** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

Ієрархія розв'язання для прямих повідомлень:

Ефективна мапа `direct` визначається першою: якщо обліковий запис визначає власну `direct`, вона повністю замінює кореневу мапу `direct` (без глибокого злиття). Потім пошук промпта виконується на отриманій єдиній мапі:

1. **Системний промпт для конкретного прямого чату** (`direct["<peerId>"].systemPrompt`): використовується, коли конкретний запис співрозмовника існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується й системний промпт не застосовується.
2. **Wildcard-системний промпт прямого чату** (`direct["*"].systemPrompt`): використовується, коли конкретний запис співрозмовника повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

<Note>
`dms` залишається легким контейнером перевизначення історії для окремих DM (`dms.<id>.historyLimit`). Перевизначення промптів розміщуються в `direct`.
</Note>

**Відмінність від поведінки кількох облікових записів Telegram:** У Telegram кореневий `groups` навмисно пригнічується для всіх облікових записів у налаштуванні з кількома обліковими записами — навіть для тих, що не визначають власні `groups`, — щоб запобігти отриманню ботом групових повідомлень із груп, до яких він не належить. WhatsApp не застосовує цей запобіжник: кореневі `groups` і кореневий `direct` завжди успадковуються обліковими записами, які не визначають перевизначення на рівні облікового запису, незалежно від кількості налаштованих облікових записів. У налаштуванні WhatsApp із кількома обліковими записами, якщо потрібні групові або прямі промпти для кожного облікового запису, визначайте повну мапу явно в кожному обліковому записі, а не покладайтеся на типові значення кореневого рівня.

Важлива поведінка:

- `channels.whatsapp.groups` є одночасно мапою конфігурації для окремих груп і allowlist груп рівня чату. На кореневому рівні або в області облікового запису `groups["*"]` означає "усі групи допускаються" для цієї області.
- Додавайте wildcard-групу `systemPrompt` лише тоді, коли вже хочете, щоб ця область допускала всі групи. Якщо ви все ще хочете, щоб придатним був лише фіксований набір ідентифікаторів груп, не використовуйте `groups["*"]` як типовий промпт. Натомість повторіть промпт у кожному явно внесеному до allowlist записі групи.
- Допуск групи та авторизація відправника є окремими перевірками. `groups["*"]` розширює набір груп, які можуть досягти обробки груп, але сам по собі не авторизує кожного відправника в цих групах. Доступ відправника й далі окремо контролюється `channels.whatsapp.groupPolicy` і `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` не має такого самого побічного ефекту для DM. `direct["*"]` лише надає типову конфігурацію прямого чату після того, як DM уже допущено через `dmPolicy` плюс `allowFrom` або правила сховища парування.

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

Поля WhatsApp із високою інформативністю:

- доступ: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- доставка: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- кілька облікових записів: `accounts.<id>.enabled`, `accounts.<id>.authDir`, перевизначення на рівні облікового запису
- операції: `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`, `web.whatsapp.*`
- поведінка сесії: `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- промпти: `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Пов’язане

- [Зв’язування](/uk/channels/pairing)
- [Групи](/uk/channels/groups)
- [Безпека](/uk/gateway/security)
- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Усунення несправностей](/uk/channels/troubleshooting)
