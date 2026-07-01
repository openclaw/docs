---
read_when:
    - Налаштування підтримки iMessage
    - Налагодження надсилання й отримання iMessage
summary: Нативна підтримка iMessage через imsg (JSON-RPC через stdio), з приватними діями API для відповідей, реакцій Tapback, ефектів, опитувань, вкладень і керування групами. Рекомендовано для нових налаштувань OpenClaw iMessage, якщо вимоги до хоста підходять.
title: iMessage
x-i18n:
    generated_at: "2026-07-01T13:20:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0fbddd770d05762c64b81e9c6443ac8fd487ba15a34ed70b068a69776d355b81
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Для розгортань OpenClaw iMessage використовуйте `imsg` на хості macOS Messages із виконаним входом. Якщо ваш Gateway працює на Linux або Windows, укажіть для `channels.imessage.cliPath` SSH-обгортку, яка запускає `imsg` на Mac.

**Вхідне відновлення автоматичне.** Після перезапуску bridge або gateway iMessage повторно відтворює повідомлення, пропущені під час простою, і пригнічує застарілу «бомбу беклогу», яку Apple може скинути після Push-відновлення, виконуючи дедуплікацію, щоб нічого не було надіслано двічі. Немає конфігурації для ввімкнення — див. [Вхідне відновлення після перезапуску bridge або gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Підтримку BlueBubbles було вилучено. Перенесіть конфігурації `channels.bluebubbles` до `channels.imessage`; OpenClaw підтримує iMessage лише через `imsg`. Почніть із [Вилучення BlueBubbles і шлях imsg для iMessage](/uk/announcements/bluebubbles-imessage) для короткого оголошення або [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles) для повної таблиці міграції.
</Warning>

Стан: нативна інтеграція із зовнішнім CLI. Gateway запускає `imsg rpc` і обмінюється даними через JSON-RPC у stdio (без окремого демона/порту). Розширені дії потребують `imsg launch` і успішної перевірки приватного API.

<CardGroup cols={3}>
  <Card title="Дії приватного API" icon="wand-sparkles" href="#private-api-actions">
    Відповіді, tapback-реакції, ефекти, опитування, вкладення та керування групами.
  </Card>
  <Card title="Спарювання" icon="link" href="/uk/channels/pairing">
    Особисті повідомлення iMessage за замовчуванням використовують режим спарювання.
  </Card>
  <Card title="Віддалений Mac" icon="terminal" href="#remote-mac-over-ssh">
    Використовуйте SSH-обгортку, коли Gateway не працює на Mac із Messages.
  </Card>
  <Card title="Довідник конфігурації" icon="settings" href="/uk/gateway/config-channels#imessage">
    Повний довідник полів iMessage.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Локальний Mac (швидкий шлях)">
    <Steps>
      <Step title="Установіть і перевірте imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Налаштуйте OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Запустіть gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Схваліть перше спарювання особистого повідомлення (типовий dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Запити на спарювання спливають через 1 годину.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Віддалений Mac через SSH">
    OpenClaw потребує лише сумісного зі stdio `cliPath`, тож ви можете вказати `cliPath` на скрипт-обгортку, який підключається SSH до віддаленого Mac і запускає `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Рекомендована конфігурація, коли вкладення ввімкнено:

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Якщо `remoteHost` не задано, OpenClaw намагається автоматично визначити його, аналізуючи SSH-скрипт-обгортку.
    `remoteHost` має бути `host` або `user@host` (без пробілів чи SSH-опцій).
    OpenClaw використовує сувору перевірку ключів хоста для SCP, тому ключ хоста ретранслятора вже має існувати в `~/.ssh/known_hosts`.
    Шляхи вкладень перевіряються за дозволеними коренями (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Будь-яка обгортка `cliPath` або SSH-проксі, які ви ставите перед `imsg`, МАЮТЬ поводитися як прозорий stdio-канал для довготривалого JSON-RPC. OpenClaw обмінюється невеликими JSON-RPC повідомленнями з розділенням новими рядками через stdin/stdout обгортки протягом усього часу роботи каналу:

- Пересилайте кожен фрагмент/рядок stdin **щойно байти стають доступними** — не чекайте EOF.
- Оперативно пересилайте кожен фрагмент/рядок stdout у зворотному напрямку.
- Зберігайте нові рядки.
- Уникайте блокувальних читань фіксованого розміру (`read(4096)`, `cat | buffer`, типовий shell `read`), які можуть виснажувати малі кадри.
- Тримайте stderr окремо від JSON-RPC потоку stdout.

Обгортка, яка буферизує stdin, доки не заповниться великий блок, спричинить симптоми, схожі на збій iMessage — `imsg rpc timeout (chats.list)` або повторні перезапуски каналу — навіть якщо сам `imsg rpc` справний. `ssh -T host imsg "$@"` (вище) безпечний, бо він пересилає аргументи `cliPath` OpenClaw, як-от `rpc` і `--db`. Конвеєри на кшталт `ssh host imsg | grep -v '^DEBUG'` НЕ безпечні — інструменти з рядковою буферизацією все одно можуть утримувати кадри; використовуйте `stdbuf -oL -eL` на кожному етапі, якщо вам потрібно фільтрувати.
</Warning>

  </Tab>
</Tabs>

## Вимоги та дозволи (macOS)

- У Messages має бути виконано вхід на Mac, де працює `imsg`.
- Для контексту процесу, у якому працює OpenClaw/`imsg`, потрібен повний доступ до диска (доступ до БД Messages).
- Для надсилання повідомлень через Messages.app потрібен дозвіл на автоматизацію.
- Для розширених дій (реакція / редагування / скасування надсилання / відповідь у гілці / ефекти / опитування / групові операції) захист цілісності системи має бути вимкнено — див. [Увімкнення приватного API imsg](#enabling-the-imsg-private-api) нижче. Базове надсилання/отримання тексту й медіа працює без цього.

<Tip>
Дозволи надаються для кожного контексту процесу. Якщо gateway працює безголово (LaunchAgent/SSH), виконайте одноразову інтерактивну команду в тому самому контексті, щоб викликати запити дозволів:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="Надсилання через SSH-обгортку завершується помилкою AppleEvents -1743">
  Налаштування через віддалений SSH може читати чати, проходити `channels status --probe` і обробляти вхідні повідомлення, тоді як вихідні надсилання все одно завершуються помилкою авторизації AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Перевірте базу TCC користувача Mac із виконаним входом або System Settings > Privacy & Security > Automation. Якщо запис Automation зареєстровано для `/usr/libexec/sshd-keygen-wrapper` замість процесу `imsg` або локальної оболонки, macOS може не показувати придатний перемикач Messages для цього серверного SSH-клієнта:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

У такому стані повторення `tccutil reset AppleEvents` або повторний запуск `imsg send` через ту саму SSH-обгортку може й надалі завершуватися помилкою, бо контекст процесу, якому потрібна автоматизація Messages, — це SSH-обгортка, а не застосунок, якому UI може надати дозвіл.

Натомість використовуйте один із підтримуваних контекстів процесу `imsg`:

- Запускайте Gateway або принаймні bridge `imsg` у локальній сесії користувача Messages із виконаним входом.
- Запустіть Gateway через LaunchAgent для цього користувача після надання повного доступу до диска й дозволу на автоматизацію з тієї самої сесії.
- Якщо ви зберігаєте двокористувацьку SSH-топологію, перевірте, що реальне вихідне `imsg send` успішно проходить через точну обгортку перед увімкненням каналу. Якщо дозвіл на автоматизацію надати неможливо, переналаштуйте систему на однокористувацьке налаштування `imsg` замість покладання на SSH-обгортку для надсилань.

</Accordion>

## Увімкнення приватного API imsg

`imsg` постачається у двох робочих режимах:

- **Базовий режим** (типовий, зміни SIP не потрібні): вихідний текст і медіа через `send`, вхідне спостереження/історія, список чатів. Це те, що ви отримуєте одразу після свіжого `brew install steipete/tap/imsg` плюс стандартні дозволи macOS, описані вище.
- **Режим приватного API**: `imsg` інжектує допоміжну dylib у `Messages.app`, щоб викликати внутрішні функції `IMCore`. Саме це відкриває `react`, `edit`, `unsend`, `reply` (у гілці), `sendWithEffect`, `poll` і `poll-vote` (нативні опитування Messages), `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, а також індикатори набору тексту й прочитання.

Щоб отримати доступ до розширеної поверхні дій, яку документує ця сторінка каналу, вам потрібен режим приватного API. README `imsg` прямо вказує вимогу:

> Розширені можливості, як-от `read`, `typing`, `launch`, bridge-backed rich send, мутація повідомлень і керування чатами, є опційними. Вони потребують вимкнення SIP та інжектування допоміжної dylib у `Messages.app`. `imsg launch` відмовляється інжектувати, коли SIP увімкнено.

Техніка інжектування helper використовує власну dylib `imsg` для доступу до приватних API Messages. У шляху OpenClaw iMessage немає стороннього сервера або середовища виконання BlueBubbles.

<Warning>
**Вимкнення SIP — це реальний компроміс безпеки.** SIP є одним із базових захистів macOS від запуску зміненого системного коду; його вимкнення на рівні всієї системи відкриває додаткову поверхню атаки та побічні ефекти. Зокрема, **вимкнення SIP на Mac з Apple Silicon також вимикає можливість установлювати й запускати iOS-застосунки на вашому Mac**.

Сприймайте це як свідомий операційний вибір, а не як типову поведінку. Якщо ваша модель загроз не допускає вимкненого SIP, вбудований iMessage обмежений базовим режимом — лише надсилання/отримання тексту й медіа, без реакцій / редагування / скасування надсилання / ефектів / групових операцій.
</Warning>

### Налаштування

1. **Установіть (або оновіть) `imsg`** на Mac, де працює Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Вивід `imsg status --json` повідомляє `bridge_version`, `rpc_methods` і `selectors` для кожного методу, щоб ви могли побачити, що підтримує поточна збірка, перш ніж почати.

2. **Вимкніть System Integrity Protection і (на сучасних macOS) Library Validation.** Інжектування не-Apple helper dylib у підписаний Apple `Messages.app` потребує вимкненого SIP **і** послабленої перевірки бібліотек. Крок SIP у режимі Recovery залежить від версії macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** вимкніть Library Validation через Terminal, перезавантажтеся в Recovery Mode, виконайте `csrutil disable`, перезапустіть.
   - **macOS 11+ (Big Sur і новіші), Intel:** Recovery Mode (або Internet Recovery), `csrutil disable`, перезапуск.
   - **macOS 11+, Apple Silicon:** послідовність запуску кнопкою живлення для входу в Recovery; у нових версіях macOS утримуйте клавішу **Left Shift**, коли натискаєте Continue, потім `csrutil disable`. Налаштування віртуальних машин мають окремий процес, тож спочатку зробіть знімок VM.

   **На macOS 11 і новіших одного `csrutil disable` зазвичай недостатньо.** Apple усе ще застосовує перевірку бібліотек до `Messages.app` як до платформного бінарного файлу, тому adhoc-підписаний helper відхиляється (`Library Validation failed: ... platform binary, but mapped file is not`) навіть із вимкненим SIP. Після вимкнення SIP також вимкніть перевірку бібліотек і перезавантажтеся:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), перевірено на 26.5.1:** вимкнений SIP **плюс** команда `DisableLibraryValidation` вище достатні для інжектування helper у версіях від 26.0 до 26.5.x. **Жодні boot-args не потрібні.** Plist є вирішальним чинником і найпоширенішим пропущеним кроком, коли інжектування не вдається на Tahoe:
   - **З plist:** `imsg launch` інжектує, а `imsg status` повідомляє `advanced_features: true`.
   - **Без plist (навіть із вимкненим SIP):** `imsg launch` завершується помилкою `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI відхиляє adhoc helper під час завантаження, тому bridge так і не стає готовим, а запуск завершується за таймаутом. Саме цей таймаут є симптомом, з яким більшість стикається на Tahoe, і виправленням є plist вище, а не щось радикальніше.

   Це було підтверджено контрольованим порівнянням до/після на macOS 26.5.1 (Apple Silicon): з plist dylib мапиться в `Messages.app`, і bridge запускається; якщо вилучити plist і перезавантажитися, `imsg launch` видає наведену вище помилку таймауту, а dylib не мапиться.

   Якщо ін’єкція `imsg launch` або конкретні `selectors` починають повертати false після оновлення macOS, зазвичай причина саме в цьому контрольному бар’єрі. Перевірте стан SIP і library validation, перш ніж припускати, що сам крок SIP завершився невдало. Якщо ці налаштування правильні, але міст усе одно не може виконати ін’єкцію, зберіть `imsg status --json` разом із виводом `imsg launch` і повідомте про це в проєкт `imsg`, замість послаблювати додаткові загальносистемні засоби безпеки.

   Дотримуйтеся процедури Apple у Recovery Mode для вашого Mac, щоб вимкнути SIP перед запуском `imsg launch`.

3. **Виконайте ін’єкцію допоміжного компонента.** Коли SIP вимкнено, а в Messages.app виконано вхід:

   ```bash
   imsg launch
   ```

   `imsg launch` відмовляється виконувати ін’єкцію, якщо SIP досі ввімкнено, тож це також слугує підтвердженням, що крок 2 спрацював.

4. **Перевірте міст з OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Запис iMessage має повідомляти `works`, а `imsg status --json | jq '{rpc_methods, selectors}'` має показувати можливості, які надає ваша збірка macOS. Створення опитувань потребує `selectors.pollPayloadMessage`; голосування потребує і `selectors.pollVoteMessage`, і RPC-методу `poll.vote`. Plugin OpenClaw оголошує лише дії, підтримані кешованою перевіркою, тоді як порожній кеш залишається оптимістичним і виконує перевірку під час першого надсилання.

Якщо `openclaw channels status --probe` повідомляє, що канал має стан `works`, але конкретні дії під час надсилання викидають "iMessage `<action>` requires the imsg private API bridge", запустіть `imsg launch` ще раз — допоміжний компонент може від’єднатися (перезапуск Messages.app, оновлення ОС тощо), а кешований статус `available: true` продовжить оголошувати дії, доки наступна перевірка не оновить стан.

### Коли неможливо вимкнути SIP

Якщо вимкнений SIP неприйнятний для вашої моделі загроз:

- `imsg` повертається до базового режиму — лише текст + медіа + отримання.
- Plugin OpenClaw усе ще оголошує надсилання тексту/медіа та вхідний моніторинг; він лише приховує `react`, `edit`, `unsend`, `reply`, `sendWithEffect` і групові операції з поверхні дій (відповідно до контрольного бар’єра можливостей для кожного методу).
- Ви можете запустити окремий Mac не на Apple Silicon (або виділений Mac для бота) з вимкненим SIP для навантаження iMessage, залишивши SIP увімкненим на основних пристроях. Див. [Dedicated bot macOS user (separate iMessage identity)](#deployment-patterns) нижче.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` керує прямими повідомленнями:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    Поле списку дозволених: `channels.imessage.allowFrom`.

    Записи списку дозволених мають ідентифікувати відправників: handles або статичні групи доступу відправників (`accessGroup:<name>`). Використовуйте `channels.imessage.groupAllowFrom` для цілей чатів, як-от `chat_id:*`, `chat_guid:*` або `chat_identifier:*`; використовуйте `channels.imessage.groups` для числових ключів реєстру `chat_id`.

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` керує обробкою груп:

    - `allowlist` (типово, якщо налаштовано)
    - `open`
    - `disabled`

    Список дозволених відправників груп: `channels.imessage.groupAllowFrom`.

    Записи `groupAllowFrom` також можуть посилатися на статичні групи доступу відправників (`accessGroup:<name>`).

    Резервна поведінка під час виконання: якщо `groupAllowFrom` не задано, перевірки відправників груп iMessage використовують `allowFrom`; задайте `groupAllowFrom`, коли допуск для DM і груп має відрізнятися.
    Примітка щодо виконання: якщо `channels.imessage` повністю відсутній, середовище виконання повертається до `groupPolicy="allowlist"` і записує попередження (навіть якщо задано `channels.defaults.groupPolicy`).

    <Warning>
    Маршрутизація груп має **два** контрольні бар’єри списку дозволених, які виконуються один за одним, і обидва мають пройти:

    1. **Список дозволених відправників / цілей чату** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` або `chat_id`.
    2. **Реєстр груп** (`channels.imessage.groups`) — з `groupPolicy: "allowlist"` цей бар’єр потребує або wildcard-запису `groups: { "*": { ... } }` (задає `allowAll = true`), або явного запису для кожного `chat_id` у `groups`.

    Якщо в бар’єрі 2 нічого немає, кожне групове повідомлення відкидається. Plugin видає два сигнали рівня `warn` на типовому рівні журналювання:

    - одноразово для кожного облікового запису під час запуску: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - одноразово для кожного `chat_id` під час виконання: `imessage: dropping group message from chat_id=<id> ...`

    DM продовжують працювати, бо вони використовують інший шлях коду.

    Мінімальна конфігурація, щоб групи продовжували проходити за `groupPolicy: "allowlist"`:

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    Якщо ці рядки `warn` з’являються в журналі gateway, відкидає бар’єр 2 — додайте блок `groups`.
    </Warning>

    Контроль згадок для груп:

    - iMessage не має власних метаданих згадок
    - виявлення згадок використовує regex-шаблони (`agents.list[].groupChat.mentionPatterns`, резервно `messages.groupChat.mentionPatterns`)
    - без налаштованих шаблонів контроль згадок неможливо застосувати

    Керівні команди від авторизованих відправників можуть обходити контроль згадок у групах.

    `systemPrompt` для кожної групи:

    Кожен запис у `channels.imessage.groups.*` приймає необов’язковий рядок `systemPrompt`. Значення вставляється в системний prompt агента на кожному ході, який обробляє повідомлення в цій групі. Розв’язання віддзеркалює розв’язання prompt для кожної групи, яке використовується `channels.whatsapp.groups`:

    1. **Системний prompt конкретної групи** (`groups["<chat_id>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується, і до цієї групи не застосовується системний prompt.
    2. **Wildcard системного prompt групи** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // explicit suppression: the wildcard "Use British spelling." does not apply here
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    Prompt для кожної групи застосовуються лише до групових повідомлень — прямі повідомлення в цьому каналі не зачіпаються.

  </Tab>

  <Tab title="Sessions and deterministic replies">
    - DM використовують пряму маршрутизацію; групи використовують групову маршрутизацію.
    - З типовим `session.dmScope=main` DM iMessage згортаються в основну сесію агента.
    - Групові сесії ізольовані (`agent:<agentId>:imessage:group:<chat_id>`).
    - Відповіді маршрутизуються назад до iMessage за допомогою метаданих початкового каналу/цілі.

    Поведінка потоків, схожих на групи:

    Деякі потоки iMessage з кількома учасниками можуть надходити з `is_group=false`.
    Якщо цей `chat_id` явно налаштовано в `channels.imessage.groups`, OpenClaw обробляє його як груповий трафік (контроль груп + ізоляція групової сесії).

  </Tab>
</Tabs>

## Прив’язки розмов ACP

Застарілі чати iMessage також можна прив’язувати до сесій ACP.

Швидкий операторський потік:

- Запустіть `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Майбутні повідомлення в тій самій розмові iMessage маршрутизуються до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму прив’язану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє прив’язку.

Налаштовані постійні прив’язки підтримуються через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "imessage"`.

`match.peer.id` може використовувати:

- нормалізований handle DM, як-от `+15555550123` або `user@example.com`
- `chat_id:<id>` (рекомендовано для стабільних прив’язок груп)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Приклад:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Див. [Агенти ACP](/uk/tools/acp-agents) щодо спільної поведінки прив’язок ACP.

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Dedicated bot macOS user (separate iMessage identity)">
    Використовуйте виділений Apple ID і користувача macOS, щоб трафік бота був ізольований від вашого особистого профілю Messages.

    Типовий потік:

    1. Створіть виділеного користувача macOS або ввійдіть у нього.
    2. Увійдіть у Messages з Apple ID бота в цьому користувачі.
    3. Установіть `imsg` для цього користувача.
    4. Створіть SSH-обгортку, щоб OpenClaw міг запускати `imsg` у контексті цього користувача.
    5. Спрямуйте `channels.imessage.accounts.<id>.cliPath` і `.dbPath` до профілю цього користувача.

    Перший запуск може потребувати GUI-схвалень (Automation + Full Disk Access) у сесії цього користувача бота.

  </Accordion>

  <Accordion title="Remote Mac over Tailscale (example)">
    Поширена топологія:

    - gateway працює на Linux/VM
    - iMessage + `imsg` працює на Mac у вашій tailnet
    - обгортка `cliPath` використовує SSH для запуску `imsg`
    - `remoteHost` вмикає отримання вкладень через SCP

    Приклад:

    ```json5
    {
      channels: {
        imessage: {
          enabled: true,
          cliPath: "~/.openclaw/scripts/imsg-ssh",
          remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
          includeAttachments: true,
          dbPath: "/Users/bot/Library/Messages/chat.db",
        },
      },
    }
    ```

    ```bash
    #!/usr/bin/env bash
    exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
    ```

    Використовуйте SSH-ключі, щоб і SSH, і SCP були неінтерактивними.
    Спершу переконайтеся, що ключ хоста є довіреним (наприклад, `ssh bot@mac-mini.tailnet-1234.ts.net`), щоб було заповнено `known_hosts`.

  </Accordion>

  <Accordion title="Multi-account pattern">
    iMessage підтримує конфігурацію для кожного облікового запису в `channels.imessage.accounts`.

    Кожен обліковий запис може перевизначати такі поля, як `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, налаштування історії та списки дозволених коренів вкладень.

  </Accordion>

  <Accordion title="Direct-message history">
    Задайте `channels.imessage.dmHistoryLimit`, щоб ініціалізувати нові сесії прямих повідомлень нещодавньою декодованою історією `imsg` для цієї розмови. Використовуйте `channels.imessage.dms["<sender>"].historyLimit` для перевизначень за відправником, зокрема `0`, щоб вимкнути історію для відправника.

    Історія DM iMessage отримується на вимогу з `imsg`. Якщо `dmHistoryLimit` не задано, глобальне ініціалізування історії DM вимикається, але додатне значення `channels.imessage.dms["<sender>"].historyLimit` для конкретного відправника все одно вмикає ініціалізування для цього відправника.

  </Accordion>
</AccordionGroup>

## Медіа, фрагментація та цілі доставки

<AccordionGroup>
  <Accordion title="Вкладення та медіа">
    - обробка вхідних вкладень **вимкнена за замовчуванням** — установіть `channels.imessage.includeAttachments: true`, щоб пересилати фотографії, голосові нотатки, відео та інші вкладення агенту. Коли це вимкнено, iMessage лише з вкладеннями відкидаються до потрапляння до агента й можуть взагалі не створювати рядок журналу `Inbound message`.
    - віддалені шляхи вкладень можна отримувати через SCP, коли задано `remoteHost`
    - шляхи вкладень мають відповідати дозволеним кореням:
      - `channels.imessage.attachmentRoots` (локально)
      - `channels.imessage.remoteAttachmentRoots` (віддалений режим SCP)
      - стандартний шаблон кореня: `/Users/*/Library/Messages/Attachments`
    - SCP використовує сувору перевірку ключа хоста (`StrictHostKeyChecking=yes`)
    - розмір вихідних медіа використовує `channels.imessage.mediaMaxMb` (типово 16 MB)

  </Accordion>

  <Accordion title="Розбиття вихідних повідомлень">
    - обмеження фрагмента тексту: `channels.imessage.textChunkLimit` (типово 4000)
    - режим фрагментації: `channels.imessage.chunkMode`
      - `length` (типово)
      - `newline` (розбиття з пріоритетом абзаців)

  </Accordion>

  <Accordion title="Формати адресації">
    Бажані явні цілі:

    - `chat_id:123` (рекомендовано для стабільної маршрутизації)
    - `chat_guid:...`
    - `chat_identifier:...`

    Цілі-дескриптори також підтримуються:

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## Дії приватного API

Коли `imsg launch` запущено, а `openclaw channels status --probe` повідомляє `privateApi.available: true`, інструмент повідомлень може використовувати нативні дії iMessage на додачу до звичайного надсилання тексту.

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
        polls: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Доступні дії">
    - **react**: Додати/видалити tapback iMessage (`messageId`, `emoji`, `remove`). Підтримувані tapback відповідають love, like, dislike, laugh, emphasize і question.
    - **reply**: Надіслати відповідь у гілці на наявне повідомлення (`messageId`, `text` або `message`, а також `chatGuid`, `chatId`, `chatIdentifier` або `to`).
    - **sendWithEffect**: Надіслати текст з ефектом iMessage (`text` або `message`, `effect` або `effectId`).
    - **edit**: Редагувати надіслане повідомлення в підтримуваних версіях macOS/приватного API (`messageId`, `text` або `newText`).
    - **unsend**: Відкликати надіслане повідомлення в підтримуваних версіях macOS/приватного API (`messageId`).
    - **upload-file**: Надіслати медіа/файли (`buffer` як base64 або гідратований `media`/`path`/`filePath`, `filename`, необов’язково `asVoice`). Застарілий псевдонім: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Керувати груповими чатами, коли поточна ціль є груповою розмовою.
    - **poll**: Створити нативне опитування Apple Messages (`pollQuestion`, `pollOption`, повторений від 2 до 12 разів, а також `chatGuid`, `chatId`, `chatIdentifier` або `to`). Отримувачі на iOS/iPadOS/macOS 26+ бачать його й голосують у ньому нативно; старіші версії ОС отримують текстовий резервний варіант "Sent a poll". Потребує `selectors.pollPayloadMessage`.
    - **poll-vote**: Проголосувати в наявному опитуванні (`pollId` або `messageId`, а також рівно одне з `pollOptionIndex`, `pollOptionId` або `pollOptionText`). Потребує `selectors.pollVoteMessage` і методу RPC `poll.vote`.

    Прийняті вхідні опитування відображаються для агента із запитанням, нумерованими мітками варіантів, кількістю голосів та ID повідомлення опитування, потрібним для `poll-vote`.

  </Accordion>

  <Accordion title="ID повідомлень">
    Вхідний контекст iMessage містить як короткі значення `MessageSid`, так і повні GUID повідомлень, коли вони доступні. Короткі ID обмежені нещодавнім кешем відповідей на базі SQLite й перед використанням перевіряються щодо поточного чату. Якщо короткий ID протермінований або належить іншому чату, повторіть спробу з повним `MessageSidFull`.

  </Accordion>

  <Accordion title="Виявлення можливостей">
    OpenClaw приховує дії приватного API лише тоді, коли кешований стан перевірки каже, що міст недоступний. Якщо стан невідомий, дії залишаються видимими й ліниво запускають перевірки, щоб перша дія могла успішно виконатися після `imsg launch` без окремого ручного оновлення стану.

  </Accordion>

  <Accordion title="Підтвердження прочитання та набір тексту">
    Коли міст приватного API працює, прийняті вхідні чати позначаються як прочитані, а прямі чати показують індикатор набору, щойно звернення прийнято, поки агент готує контекст і генерує відповідь. Вимкніть позначення прочитання так:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Старіші збірки `imsg`, які передують списку можливостей для окремих методів, тихо вимикатимуть набір/прочитання; OpenClaw записує одноразове попередження для кожного перезапуску, щоб відсутнє підтвердження можна було пояснити.

  </Accordion>

  <Accordion title="Вхідні tapback">
    OpenClaw підписується на tapback iMessage і маршрутизує прийняті реакції як системні події замість звичайного тексту повідомлення, тож tapback користувача не запускає звичайний цикл відповіді.

    Режим сповіщень керується `channels.imessage.reactionNotifications`:

    - `"own"` (типово): сповіщати лише тоді, коли користувачі реагують на повідомлення, написані ботом.
    - `"all"`: сповіщати про всі вхідні tapback від авторизованих відправників.
    - `"off"`: ігнорувати вхідні tapback.

    Перевизначення для окремого облікового запису використовують `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Реакції схвалення (👍 / 👎)">
    Коли `approvals.exec.enabled` або `approvals.plugin.enabled` дорівнює true і запит маршрутизується до iMessage, Gateway доставляє запит на схвалення нативно й приймає tapback для його вирішення:

    - `👍` (tapback Like) → `allow-once`
    - `👎` (tapback Dislike) → `deny`
    - `allow-always` лишається ручним резервним варіантом: надішліть `/approve <id> allow-always` як звичайну відповідь.

    Обробка реакцій вимагає, щоб дескриптор користувача, який реагує, був явним схвалювачем. Список схвалювачів читається з `channels.imessage.allowFrom` (або `channels.imessage.accounts.<id>.allowFrom`); додайте номер телефону користувача у форматі E.164 або його email Apple ID. Запис із символом узагальнення `"*"` враховується, але дозволяє схвалювати будь-якому відправнику. Скорочення через реакцію навмисно обходить `reactionNotifications`, `dmPolicy` і `groupAllowFrom`, бо єдиним важливим обмеженням для вирішення схвалення є явний список дозволених схвалювачів.

    **Зміна поведінки в цьому випуску:** Коли `channels.imessage.allowFrom` непорожній, текстова команда `/approve <id> <decision>` тепер авторизується за цим списком схвалювачів (а не за ширшим списком дозволених DM). Відправники, дозволені у списку дозволених DM, але не в `allowFrom`, отримають явну відмову. Додайте кожного оператора, який має мати змогу схвалювати через `/approve` (і через реакції), до `allowFrom`, щоб зберегти попередню поведінку. Коли `allowFrom` порожній, застарілий "резервний варіант того самого чату" залишається чинним, і `/approve` продовжує авторизувати всіх, кого дозволяє список дозволених DM.

    Нотатки для оператора:
    - Прив’язка реакції зберігається і в пам’яті (з TTL, узгодженим із завершенням терміну схвалення), і в постійному сховищі Gateway з ключами, тож tapback, який надходить невдовзі після перезапуску Gateway, усе одно вирішує схвалення.
    - Міжпристроєві tapback `is_from_me=true` (власна реакція оператора на спареному пристрої Apple) навмисно ігноруються, щоб бот не міг схвалити сам себе.
    - Застарілі tapback у текстовому стилі (`Liked "…"` як звичайний текст від дуже старих клієнтів Apple) не можуть вирішувати схвалення, бо не несуть GUID повідомлення; вирішення через реакцію потребує структурованих метаданих tapback, які передають поточні клієнти macOS / iOS.

  </Accordion>
</AccordionGroup>

## Записи конфігурації

iMessage за замовчуванням дозволяє записи конфігурації, ініційовані каналом (для `/config set|unset`, коли `commands.config: true`).

Вимкнути:

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Об’єднання розділених DM-відправлень (команда + URL в одній композиції)

Коли користувач вводить команду й URL разом — наприклад, `Dump https://example.com/article` — застосунок Apple Messages розділяє надсилання на **два окремі рядки `chat.db`**:

1. Текстове повідомлення (`"Dump"`).
2. Бульбашка попереднього перегляду URL (`"https://..."`) із зображеннями OG-перегляду як вкладеннями.

На більшості налаштувань ці два рядки надходять до OpenClaw з інтервалом приблизно 0,8-2,0 с. Без об’єднання агент отримує лише команду на зверненні 1, відповідає (часто "надішліть мені URL") і бачить URL лише на зверненні 2 — коли контекст команди вже втрачено. Це конвеєр надсилання Apple, а не щось, що додає OpenClaw або `imsg`.

`channels.imessage.coalesceSameSenderDms` вмикає для DM буферизацію послідовних рядків від того самого відправника. Коли `imsg` на одному з вихідних рядків надає структурний маркер попереднього перегляду URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"`, OpenClaw об’єднує лише це справжнє розділене відправлення й залишає всі інші буферизовані рядки як окремі звернення. У старіших збірках `imsg`, які взагалі не передають метадані бульбашки, OpenClaw не може відрізнити розділене відправлення від окремих надсилань, тому повертається до об’єднання кошика. Це зберігає поведінку до появи метаданих, а не регресує розділені відправлення `Dump <url>` у два звернення. Групові чати й надалі надсилаються окремо для кожного повідомлення, щоб зберегти структуру звернень із кількома користувачами.

<Tabs>
  <Tab title="Коли вмикати">
    Вмикайте, коли:

    - Ви постачаєте Skills, які очікують `command + payload` в одному повідомленні (dump, paste, save, queue тощо).
    - Ваші користувачі вставляють URL поруч із командами.
    - Ви можете прийняти додану затримку звернення DM (див. нижче).

    Залишайте вимкненим, коли:

    - Вам потрібна мінімальна затримка команди для однослівних тригерів DM.
    - Усі ваші потоки є одноразовими командами без подальших payload.

  </Tab>
  <Tab title="Увімкнення">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Коли прапорець увімкнено й немає явного `messages.inbound.byChannel.imessage` або глобального `messages.inbound.debounceMs`, вікно debounce розширюється до **7000 ms** (застаріле типове значення — 0 ms, тобто без debounce). Ширше вікно потрібне, бо темп розділеного надсилання попереднього перегляду URL в Apple може розтягуватися на кілька секунд, поки Messages.app створює рядок попереднього перегляду.

    Щоб налаштувати вікно самостійно:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 7000 ms covers observed Messages.app URL-preview delays.
            imessage: 7000,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Компроміси">
    - **Точне об’єднання потребує актуальних метаданих payload `imsg`.** Коли рядок URL містить `balloon_bundle_id`, об’єднується лише це реальне розділене надсилання, а інші буферизовані рядки лишаються окремими. У старіших збірках `imsg`, які не надають метаданих balloon, OpenClaw повертається до об’єднання буферизованого кошика, щоб розділені надсилання `Dump <url>` не регресували у два ходи (тимчасова зворотна сумісність, буде вилучено, щойно `imsg` почне об’єднувати розділені надсилання вище за потоком).
    - **Додана затримка для особистих повідомлень.** Коли прапорець увімкнено, кожне особисте повідомлення (зокрема окремі керівні команди й одиночні текстові продовження) чекає до завершення вікна debounce перед відправленням, на випадок якщо надходить рядок попереднього перегляду URL. Повідомлення групових чатів відправляються миттєво.
    - **Об’єднаний вивід обмежений.** Об’єднаний текст обмежується 4000 символами з явним маркером `…[truncated]`; вкладення обмежуються 20; записи джерел обмежуються 10 (поза цим зберігаються перший і найновіший). Кожен GUID джерела відстежується в `coalescedMessageGuids` для подальшої телеметрії.
    - **Лише для особистих повідомлень.** Групові чати проходять до відправлення кожного повідомлення окремо, щоб бот залишався чуйним, коли кілька людей пишуть одночасно.
    - **Увімкнення за вибором, для кожного каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не змінюються. Застарілі конфігурації BlueBubbles, які встановлюють `channels.bluebubbles.coalesceSameSenderDms`, мають перенести це значення до `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Сценарії та що бачить агент

Стовпець "Прапорець увімкнено" показує поведінку у збірці `imsg`, яка випускає `balloon_bundle_id`. У старіших збірках `imsg`, які взагалі не випускають метаданих balloon, рядки нижче, позначені "Два ходи" / "N ходів", натомість повертаються до застарілого об’єднання (один хід): OpenClaw не може структурно відрізнити розділене надсилання від окремих надсилань, тому зберігає об’єднання до появи метаданих. Точне розділення активується, щойно збірка починає випускати метадані balloon.

| Користувач складає                                                | `chat.db` створює                   | Прапорець вимкнено (типово)                  | Прапорець увімкнено + вікно (`imsg` випускає метадані balloon)                                      |
| ------------------------------------------------------------------ | ----------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (одне надсилання)                       | 2 рядки з інтервалом ~1 с           | Два ходи агента: "Dump" окремо, потім URL    | Один хід: об’єднаний текст `Dump https://example.com`                                               |
| `Save this 📎image.jpg caption` (вкладення + текст)                | 2 рядки без метаданих URL balloon   | Два ходи                                    | Два ходи після виявлення метаданих; один об’єднаний хід у старих/до-latch сеансах без метаданих     |
| `/status` (окрема команда)                                         | 1 рядок                             | Миттєве відправлення                         | **Чекати до завершення вікна, потім відправити**                                                    |
| URL вставлено окремо                                               | 1 рядок                             | Миттєве відправлення                         | Чекати до завершення вікна, потім відправити                                                        |
| Текст + URL надіслано як два навмисно окремі повідомлення, з інтервалом у хвилини | 2 рядки поза вікном                 | Два ходи                                    | Два ходи (вікно спливає між ними)                                                                   |
| Швидкий потік (>10 малих особистих повідомлень у межах вікна)      | N рядків без метаданих URL balloon  | N ходів                                     | N ходів після виявлення метаданих; один обмежений об’єднаний хід у старих/до-latch сеансах без метаданих |
| Дві людини пишуть у груповому чаті                                 | N рядків від M відправників         | M+ ходів (один на кошик відправника)         | M+ ходів — групові чати не об’єднуються                                                             |

## Вхідне відновлення після перезапуску bridge або Gateway

iMessage відновлює повідомлення, пропущені, поки Gateway був недоступний, і водночас пригнічує застарілу "backlog bomb", яку Apple може скинути після відновлення Push. Типова поведінка завжди ввімкнена й побудована на вхідній дедуплікації.

- **Дедуплікація replay.** Кожне відправлене вхідне повідомлення записується за його Apple GUID у постійному стані Plugin (`imessage.inbound-dedupe`), заявляється під час приймання й фіксується після обробки (звільняється за тимчасової помилки, щоб можна було повторити спробу). Усе вже оброблене відкидається, а не відправляється двічі. Саме це дає відновленню змогу агресивно відтворювати без обліку кожного повідомлення.
- **Відновлення після простою.** Під час запуску монітор пам’ятає останній відправлений rowid `chat.db` (збережений курсор для кожного облікового запису) і передає його до `imsg watch.subscribe` як `since_rowid`, тож imsg відтворює рядки, що надійшли, поки Gateway був недоступний, а потім стежить за живим потоком. Replay обмежений найновішими рядками й повідомленнями віком до ~2 годин, а дедуплікація відкидає все вже оброблене.
- **Віковий бар’єр застарілого backlog.** Рядки вище межі запуску справді живі; той, чия дата надсилання більш ніж на ~15 хвилин старіша за час прибуття, є backlog від Push-flush і пригнічується. Відтворені рядки (на межі або нижче) натомість використовують ширше вікно відновлення, тож нещодавно пропущене повідомлення доставляється, а давня історія — ні.

Відновлення працює як із локальними, так і з віддаленими налаштуваннями `cliPath`, бо replay `since_rowid` проходить через те саме RPC-з’єднання `imsg`. Різниця у вікні: коли Gateway може читати `chat.db` (локально), він прив’язує межу rowid запуску, обмежує діапазон replay і доставляє пропущені повідомлення віком до кількох годин. Через віддалений SSH `cliPath` він не може читати базу даних, тому replay не обмежується, а кожен рядок використовує живий віковий бар’єр — нещодавно пропущені повідомлення все одно відновлюються, а старий backlog усе одно пригнічується, просто з вужчим живим вікном. Запускайте Gateway на Mac з Messages для ширшого вікна відновлення.

### Сигнал, видимий оператору

Пригнічений backlog журналюється на типовому рівні, ніколи не відкидається мовчки (прапорець `recovery` показує, яке вікно застосовано):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Міграція

`channels.imessage.catchup.*` застаріло — відновлення після простою тепер автоматичне й не потребує конфігурації для нових налаштувань. Наявні конфігурації з `catchup.enabled: true` залишаються чинними як профіль сумісності для вікна recovery replay. Вимкнені блоки catchup (`enabled: false` або без `enabled: true`) вилучаються; `openclaw doctor --fix` видаляє їх.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="imsg не знайдено або RPC не підтримується">
    Перевірте binary та підтримку RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Якщо probe повідомляє, що RPC не підтримується, оновіть `imsg`. Якщо дії private API недоступні, запустіть `imsg launch` у сеансі користувача macOS, який увійшов у систему, і повторіть probe. Якщо Gateway не працює на macOS, використовуйте налаштування Remote Mac over SSH вище замість типового локального шляху `imsg`.

  </Accordion>

  <Accordion title="Повідомлення надсилаються, але вхідні iMessages не надходять">
    Спершу доведіть, чи повідомлення дійшло до локального Mac. Якщо `chat.db` не змінюється, OpenClaw не може отримати повідомлення, навіть коли `imsg status --json` повідомляє про справний bridge.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Якщо повідомлення, надіслані з телефона, не створюють нових рядків, відновіть шар macOS Messages і Apple Push перед зміною конфігурації OpenClaw. Одноразового оновлення service часто достатньо:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Надішліть нове iMessage з телефона й підтвердьте новий рядок `chat.db` або подію `imsg watch`, перш ніж налагоджувати сеанси OpenClaw. Не запускайте це як періодичний цикл перезапуску bridge; повторні `imsg launch` плюс перезапуски Gateway під час активної роботи можуть перервати доставки й залишити поточні запускі каналу завислими.

  </Accordion>

  <Accordion title="Gateway не працює на macOS">
    Типовий `cliPath: "imsg"` має запускатися на Mac, який увійшов у Messages. На Linux або Windows установіть `channels.imessage.cliPath` на wrapper script, який підключається SSH до цього Mac і запускає `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Потім виконайте:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="Особисті повідомлення ігноруються">
    Перевірте:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - схвалення pairing (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Групові повідомлення ігноруються">
    Перевірте:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - поведінку allowlist `channels.imessage.groups`
    - конфігурацію шаблонів згадок (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Віддалені вкладення не працюють">
    Перевірте:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - автентифікацію ключем SSH/SCP з хоста Gateway
    - наявність host key у `~/.ssh/known_hosts` на хості Gateway
    - читабельність віддаленого шляху на Mac, де працює Messages

  </Accordion>

  <Accordion title="Запити дозволів macOS було пропущено">
    Повторно запустіть в інтерактивному GUI terminal у тому самому контексті користувача/сеансу й схваліть запити:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Підтвердьте, що Full Disk Access + Automation надано для контексту процесу, який запускає OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Посилання на довідник конфігурації

- [Довідник конфігурації - iMessage](/uk/gateway/config-channels#imessage)
- [Конфігурація Gateway](/uk/gateway/configuration)
- [Pairing](/uk/channels/pairing)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Вилучення BlueBubbles і шлях imsg iMessage](/uk/announcements/bluebubbles-imessage) — оголошення та підсумок міграції
- [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles) — таблиця перекладу конфігурації та покрокове перемикання
- [Pairing](/uk/channels/pairing) — автентифікація особистих повідомлень і потік pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та gating за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
