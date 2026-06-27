---
read_when:
    - Налаштування підтримки iMessage
    - Налагодження надсилання/отримання в iMessage
summary: Нативна підтримка iMessage через imsg (JSON-RPC через stdio), з діями приватного API для відповідей, tapbacks, ефектів, вкладень і керування групами. Рекомендовано для нових налаштувань OpenClaw iMessage, коли вимоги до хоста підходять.
title: iMessage
x-i18n:
    generated_at: "2026-06-27T17:10:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 065c0426af6230f9be2f0a12ecc4553724d8ce1a2b6b0dad640b5ae8a8a480f0
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Для розгортань OpenClaw iMessage використовуйте `imsg` на хості macOS Messages із виконаним входом. Якщо ваш Gateway працює на Linux або Windows, вкажіть `channels.imessage.cliPath` на SSH-обгортку, яка запускає `imsg` на Mac.

**Вхідне відновлення автоматичне.** Після перезапуску моста або Gateway iMessage повторно відтворює повідомлення, пропущені під час простою, і пригнічує застарілу «backlog bomb», яку Apple може скинути після Push-відновлення, виконуючи дедуплікацію, щоб нічого не було доставлено двічі. Немає конфігурації для ввімкнення — див. [Вхідне відновлення після перезапуску моста або Gateway](#inbound-recovery-after-a-bridge-or-gateway-restart).
</Note>

<Warning>
Підтримку BlueBubbles вилучено. Перенесіть конфігурації `channels.bluebubbles` до `channels.imessage`; OpenClaw підтримує iMessage лише через `imsg`. Почніть із [Вилучення BlueBubbles і шлях imsg iMessage](/uk/announcements/bluebubbles-imessage) для короткого оголошення або [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles) для повної таблиці міграції.
</Warning>

Статус: нативна інтеграція із зовнішнім CLI. Gateway запускає `imsg rpc` і взаємодіє через JSON-RPC на stdio (без окремого демона/порту). Розширені дії потребують `imsg launch` і успішної перевірки приватного API.

<CardGroup cols={3}>
  <Card title="Private API actions" icon="wand-sparkles" href="#private-api-actions">
    Відповіді, tapbacks, ефекти, вкладення та керування групами.
  </Card>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    iMessage DM за замовчуванням використовують режим сполучення.
  </Card>
  <Card title="Remote Mac" icon="terminal" href="#remote-mac-over-ssh">
    Використовуйте SSH-обгортку, коли Gateway не працює на Mac із Messages.
  </Card>
  <Card title="Configuration reference" icon="settings" href="/uk/gateway/config-channels#imessage">
    Повний довідник полів iMessage.
  </Card>
</CardGroup>

## Швидке налаштування

<Tabs>
  <Tab title="Local Mac (fast path)">
    <Steps>
      <Step title="Install and verify imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approve first DM pairing (default dmPolicy)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Запити на сполучення завершуються через 1 годину.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Remote Mac over SSH">
    OpenClaw потребує лише сумісний зі stdio `cliPath`, тож можна вказати `cliPath` на скрипт-обгортку, який підключається SSH до віддаленого Mac і запускає `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Рекомендована конфігурація, коли вкладення ввімкнені:

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

    Якщо `remoteHost` не задано, OpenClaw намагається автоматично визначити його, розбираючи скрипт SSH-обгортки.
    `remoteHost` має бути `host` або `user@host` (без пробілів чи SSH-опцій).
    OpenClaw використовує сувору перевірку ключа хоста для SCP, тому ключ ретрансляційного хоста вже має існувати в `~/.ssh/known_hosts`.
    Шляхи вкладень перевіряються відносно дозволених коренів (`attachmentRoots` / `remoteAttachmentRoots`).

<Warning>
Будь-яка обгортка `cliPath` або SSH-проксі, які ви ставите перед `imsg`, МАЮТЬ поводитися як прозорий stdio-канал для довготривалого JSON-RPC. OpenClaw обмінюється невеликими JSON-RPC повідомленнями, розділеними новими рядками, через stdin/stdout обгортки протягом усього часу роботи каналу:

- Передавайте кожен фрагмент/рядок stdin **щойно байти доступні** — не чекайте EOF.
- Негайно передавайте кожен фрагмент/рядок stdout у зворотному напрямку.
- Зберігайте символи нового рядка.
- Уникайте блокувальних читань фіксованого розміру (`read(4096)`, `cat | buffer`, стандартний shell `read`), які можуть зупиняти малі кадри.
- Тримайте stderr окремо від потоку JSON-RPC stdout.

Обгортка, яка буферизує stdin до заповнення великого блока, спричинить симптоми, схожі на збій iMessage — `imsg rpc timeout (chats.list)` або повторні перезапуски каналу — хоча сам `imsg rpc` справний. `ssh -T host imsg "$@"` (вище) безпечний, бо передає аргументи `cliPath` OpenClaw, як-от `rpc` і `--db`. Конвеєри на кшталт `ssh host imsg | grep -v '^DEBUG'` НЕ безпечні — інструменти з рядковою буферизацією все одно можуть утримувати кадри; використовуйте `stdbuf -oL -eL` на кожному етапі, якщо фільтрація необхідна.
</Warning>

  </Tab>
</Tabs>

## Вимоги та дозволи (macOS)

- На Mac, де працює `imsg`, має бути виконано вхід у Messages.
- Для процесного контексту, у якому працює OpenClaw/`imsg`, потрібен Повний доступ до диска (доступ до БД Messages).
- Потрібен дозвіл Automation для надсилання повідомлень через Messages.app.
- Для розширених дій (react / edit / unsend / threaded reply / effects / group ops) потрібно вимкнути System Integrity Protection — див. [Увімкнення приватного API imsg](#enabling-the-imsg-private-api) нижче. Базове надсилання/отримання тексту й медіа працює без цього.

<Tip>
Дозволи надаються для кожного процесного контексту. Якщо gateway працює безголово (LaunchAgent/SSH), виконайте одноразову інтерактивну команду в тому самому контексті, щоб викликати запити дозволів:

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

<Accordion title="SSH wrapper sends fail with AppleEvents -1743">
  Віддалене SSH-налаштування може читати чати, проходити `channels status --probe` і обробляти вхідні повідомлення, тоді як вихідні надсилання все ще не вдаються з помилкою авторизації AppleEvents:

```text
Not authorized to send Apple events to Messages. (-1743)
```

Перевірте базу даних TCC користувача Mac із виконаним входом або System Settings > Privacy & Security > Automation. Якщо запис Automation зафіксовано для `/usr/libexec/sshd-keygen-wrapper` замість процесу `imsg` або локальної shell, macOS може не показувати придатний перемикач Messages для цього серверного SSH-клієнта:

```text
kTCCServiceAppleEvents | /usr/libexec/sshd-keygen-wrapper | auth_value=0 | com.apple.MobileSMS
```

У такому стані повторення `tccutil reset AppleEvents` або повторний запуск `imsg send` через ту саму SSH-обгортку може й далі завершуватися невдачею, бо процесний контекст, якому потрібна Messages Automation, — це SSH-обгортка, а не застосунок, якому UI може надати дозвіл.

Натомість використовуйте один із підтримуваних процесних контекстів `imsg`:

- Запускайте Gateway або принаймні міст `imsg` у локальній сесії користувача Messages із виконаним входом.
- Запускайте Gateway через LaunchAgent для цього користувача після надання Повного доступу до диска й Automation із тієї самої сесії.
- Якщо ви зберігаєте двокористувацьку SSH-топологію, перевірте, що реальне вихідне `imsg send` успішно проходить через точну обгортку, перш ніж вмикати канал. Якщо Automation неможливо надати, переналаштуйте на однокористувацьке налаштування `imsg` замість покладання на SSH-обгортку для надсилань.

</Accordion>

## Увімкнення приватного API imsg

`imsg` постачається у двох робочих режимах:

- **Базовий режим** (за замовчуванням, зміни SIP не потрібні): вихідний текст і медіа через `send`, вхідний watch/history, список чатів. Це те, що ви отримуєте одразу після свіжого `brew install steipete/tap/imsg` плюс стандартні дозволи macOS вище.
- **Режим приватного API**: `imsg` інжектує допоміжну dylib у `Messages.app`, щоб викликати внутрішні функції `IMCore`. Це відкриває `react`, `edit`, `unsend`, `reply` (тредова), `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, а також індикатори набору та сповіщення про прочитання.

Щоб отримати доступ до розширеної поверхні дій, яку документує ця сторінка каналу, потрібен режим приватного API. README `imsg` прямо зазначає вимогу:

> Розширені функції, як-от `read`, `typing`, `launch`, насичене надсилання через міст, мутація повідомлень і керування чатами, є opt-in. Вони потребують вимкненого SIP і допоміжної dylib, інжектованої в `Messages.app`. `imsg launch` відмовляється виконувати інжекцію, коли SIP увімкнено.

Техніка інжекції допоміжної бібліотеки використовує власну dylib `imsg` для доступу до приватних API Messages. У шляху OpenClaw iMessage немає стороннього сервера або runtime BlueBubbles.

<Warning>
**Вимкнення SIP — реальний компроміс безпеки.** SIP є одним із ключових захистів macOS від запуску зміненого системного коду; його вимкнення на рівні всієї системи відкриває додаткову поверхню атаки та побічні ефекти. Зокрема, **вимкнення SIP на Mac з Apple Silicon також вимикає можливість встановлювати й запускати iOS-застосунки на вашому Mac**.

Ставтеся до цього як до свідомого операційного вибору, а не до значення за замовчуванням. Якщо ваша модель загроз не допускає вимкнений SIP, вбудований iMessage обмежується базовим режимом — лише надсиланням/отриманням тексту й медіа, без реакцій / edit / unsend / effects / group ops.
</Warning>

### Налаштування

1. **Установіть (або оновіть) `imsg`** на Mac, де працює Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   Вивід `imsg status --json` повідомляє `bridge_version`, `rpc_methods` і `selectors` для кожного методу, щоб ви могли побачити, що підтримує поточна збірка, перш ніж почати.

2. **Вимкніть System Integrity Protection і (на сучасній macOS) Library Validation.** Інжекція не-Apple допоміжної dylib у підписаний Apple `Messages.app` потребує вимкненого SIP **і** послабленої валідації бібліотек. Крок SIP у Recovery mode залежить від версії macOS:
   - **macOS 10.13-10.15 (Sierra-Catalina):** вимкніть Library Validation через Terminal, перезавантажтеся в Recovery Mode, виконайте `csrutil disable`, перезапустіть.
   - **macOS 11+ (Big Sur і новіші), Intel:** Recovery Mode (або Internet Recovery), `csrutil disable`, перезапустіть.
   - **macOS 11+, Apple Silicon:** послідовність запуску кнопкою живлення для входу в Recovery; у нещодавніх версіях macOS утримуйте клавішу **Left Shift**, коли натискаєте Continue, потім `csrutil disable`. Налаштування віртуальних машин мають окремий процес, тож спершу зробіть знімок VM.

   **На macOS 11 і новіших одного `csrutil disable` зазвичай недостатньо.** Apple усе ще застосовує валідацію бібліотек до `Messages.app` як до платформного бінарника, тому adhoc-підписаний helper відхиляється (`Library Validation failed: ... platform binary, but mapped file is not`) навіть із вимкненим SIP. Після вимкнення SIP також вимкніть валідацію бібліотек і перезавантажтеся:

   ```bash
   sudo defaults write /Library/Preferences/com.apple.security.libraryvalidation.plist DisableLibraryValidation -bool true
   ```

   **macOS 26 (Tahoe), перевірено на 26.5.1:** вимкнений SIP **плюс** команда `DisableLibraryValidation` вище достатні для інжекції helper у версіях від 26.0 до 26.5.x. **Boot-args не потрібні.** Plist є вирішальним чинником і найпоширенішим пропущеним кроком, коли інжекція не вдається на Tahoe:
   - **З plist:** `imsg launch` виконує інжекцію, а `imsg status` повідомляє `advanced_features: true`.
   - **Без plist (навіть із вимкненим SIP):** `imsg launch` завершується помилкою `Failed to launch: Timeout waiting for Messages.app to initialize`. AMFI відхиляє adhoc helper під час завантаження, тому міст так і не стає готовим, а запуск завершується тайм-аутом. Цей тайм-аут — симптом, з яким більшість стикається на Tahoe, і виправленням є plist вище, а не щось радикальніше.

   Це було підтверджено контрольованим порівнянням до/після на macOS 26.5.1 (Apple Silicon): з plist dylib мапиться в `Messages.app`, і міст запускається; якщо вилучити plist і перезавантажитися, `imsg launch` видає наведену вище помилку тайм-ауту, а dylib не мапиться.

   Якщо інʼєкція `imsg launch` або певні `selectors` починають повертати false після оновлення macOS, зазвичай причиною є цей шлюз. Перевірте стан SIP і library validation, перш ніж припускати, що сам крок SIP завершився невдало. Якщо ці параметри правильні, але міст усе одно не може виконати інʼєкцію, зберіть `imsg status --json` разом із виводом `imsg launch` і повідомте про це проєкту `imsg` замість послаблення додаткових загальносистемних засобів безпеки.

   Дотримуйтесь процедури Apple у Recovery mode для вашого Mac, щоб вимкнути SIP перед запуском `imsg launch`.

3. **Виконайте інʼєкцію допоміжного компонента.** Коли SIP вимкнено і виконано вхід у Messages.app:

   ```bash
   imsg launch
   ```

   `imsg launch` відмовляється виконувати інʼєкцію, якщо SIP усе ще ввімкнено, тому це також слугує підтвердженням, що крок 2 спрацював.

4. **Перевірте міст з OpenClaw:**

   ```bash
   openclaw channels status --probe
   ```

   Запис iMessage має повідомити `works`, а `imsg status --json | jq '.selectors'` має показати `retractMessagePart: true` разом із тими селекторами редагування / введення / прочитання, які надає ваша збірка macOS. Поопераційний шлюз можливостей Plugin OpenClaw у `actions.ts` рекламує лише дії, чий базовий селектор має значення `true`, тому поверхня дій, яку ви бачите у списку інструментів агента, відображає те, що міст фактично може робити на цьому хості.

Якщо `openclaw channels status --probe` повідомляє, що канал має стан `works`, але певні дії під час відправлення викидають "iMessage `<action>` requires the imsg private API bridge", знову запустіть `imsg launch` — допоміжний компонент може випасти (перезапуск Messages.app, оновлення ОС тощо), а кешований статус `available: true` продовжуватиме рекламувати дії, доки наступна перевірка не оновить його.

### Коли ви не можете вимкнути SIP

Якщо вимкнений SIP неприйнятний для вашої моделі загроз:

- `imsg` повертається до базового режиму — лише текст + медіа + отримання.
- Plugin OpenClaw усе ще рекламує надсилання тексту/медіа та вхідний моніторинг; він просто приховує `react`, `edit`, `unsend`, `reply`, `sendWithEffect` і групові операції з поверхні дій (відповідно до поопераційного шлюзу можливостей).
- Ви можете запустити окремий Mac не на Apple Silicon (або виділений бот-Mac) з вимкненим SIP для робочого навантаження iMessage, залишаючи SIP увімкненим на основних пристроях. Див. [Виділений користувач macOS для бота (окрема ідентичність iMessage)](#deployment-patterns) нижче.

## Контроль доступу та маршрутизація

<Tabs>
  <Tab title="Політика DM">
    `channels.imessage.dmPolicy` керує прямими повідомленнями:

    - `pairing` (типово)
    - `allowlist`
    - `open` (потребує, щоб `allowFrom` містив `"*"`)
    - `disabled`

    Поле списку дозволених: `channels.imessage.allowFrom`.

    Записи списку дозволених мають ідентифікувати відправників: handles або статичні групи доступу відправників (`accessGroup:<name>`). Використовуйте `channels.imessage.groupAllowFrom` для цілей чату, як-от `chat_id:*`, `chat_guid:*` або `chat_identifier:*`; використовуйте `channels.imessage.groups` для числових ключів реєстру `chat_id`.

  </Tab>

  <Tab title="Групова політика + згадки">
    `channels.imessage.groupPolicy` керує обробкою груп:

    - `allowlist` (типово, коли налаштовано)
    - `open`
    - `disabled`

    Список дозволених відправників груп: `channels.imessage.groupAllowFrom`.

    Записи `groupAllowFrom` також можуть посилатися на статичні групи доступу відправників (`accessGroup:<name>`).

    Резервна поведінка runtime: якщо `groupAllowFrom` не задано, перевірки відправників груп iMessage використовують `allowFrom`; задайте `groupAllowFrom`, коли правила допуску для DM і груп мають відрізнятися.
    Примітка runtime: якщо `channels.imessage` повністю відсутній, runtime повертається до `groupPolicy="allowlist"` і записує попередження в журнал (навіть якщо задано `channels.defaults.groupPolicy`).

    <Warning>
    Групова маршрутизація має **два** шлюзи списку дозволених, які виконуються послідовно, і обидва мають пройти:

    1. **Список дозволених відправників / цілей чату** (`channels.imessage.groupAllowFrom`) — handle, `chat_guid`, `chat_identifier` або `chat_id`.
    2. **Реєстр груп** (`channels.imessage.groups`) — з `groupPolicy: "allowlist"` цей шлюз потребує або wildcard-запису `groups: { "*": { ... } }` (встановлює `allowAll = true`), або явного запису для кожного `chat_id` у `groups`.

    Якщо шлюз 2 порожній, кожне групове повідомлення відкидається. Plugin видає два сигнали рівня `warn` на типовому рівні журналювання:

    - один раз для кожного акаунта під час запуску: `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - один раз для кожного `chat_id` під час runtime: `imessage: dropping group message from chat_id=<id> ...`

    DM продовжують працювати, бо вони використовують інший шлях коду.

    Мінімальна конфігурація, щоб групи продовжували проходити з `groupPolicy: "allowlist"`:

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

    Якщо ці рядки `warn` зʼявляються в журналі Gateway, відкидає шлюз 2 — додайте блок `groups`.
    </Warning>

    Шлюз згадок для груп:

    - iMessage не має нативних метаданих згадок
    - виявлення згадок використовує regex-шаблони (`agents.list[].groupChat.mentionPatterns`, fallback `messages.groupChat.mentionPatterns`)
    - без налаштованих шаблонів шлюз згадок не може бути примусово застосований

    Керівні команди від авторизованих відправників можуть обходити шлюз згадок у групах.

    По-груповий `systemPrompt`:

    Кожен запис у `channels.imessage.groups.*` приймає необовʼязковий рядок `systemPrompt`. Значення впроваджується в системний prompt агента на кожному ході, який обробляє повідомлення в цій групі. Розвʼязання віддзеркалює розвʼязання по-групового prompt, яке використовується `channels.whatsapp.groups`:

    1. **Системний prompt конкретної групи** (`groups["<chat_id>"].systemPrompt`): використовується, коли конкретний запис групи існує в мапі **і** його ключ `systemPrompt` визначено. Якщо `systemPrompt` є порожнім рядком (`""`), wildcard пригнічується і до цієї групи не застосовується жоден системний prompt.
    2. **Wildcard-системний prompt групи** (`groups["*"].systemPrompt`): використовується, коли конкретний запис групи повністю відсутній у мапі або коли він існує, але не визначає ключ `systemPrompt`.

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

    По-групові prompt застосовуються лише до групових повідомлень — прямі повідомлення в цьому каналі не змінюються.

  </Tab>

  <Tab title="Сесії та детерміновані відповіді">
    - DM використовують пряму маршрутизацію; групи використовують групову маршрутизацію.
    - З типовим `session.dmScope=main` DM iMessage згортаються в основну сесію агента.
    - Групові сесії ізольовані (`agent:<agentId>:imessage:group:<chat_id>`).
    - Відповіді маршрутизуються назад до iMessage за допомогою метаданих початкового каналу/цілі.

    Поведінка потоків, схожих на групові:

    Деякі потоки iMessage з кількома учасниками можуть надходити з `is_group=false`.
    Якщо цей `chat_id` явно налаштовано в `channels.imessage.groups`, OpenClaw трактує його як груповий трафік (груповий шлюз + ізоляція групової сесії).

  </Tab>
</Tabs>

## Привʼязки розмов ACP

Застарілі чати iMessage також можна привʼязати до сесій ACP.

Швидкий flow оператора:

- Запустіть `/acp spawn codex --bind here` у DM або дозволеному груповому чаті.
- Майбутні повідомлення в тій самій розмові iMessage маршрутизуються до створеної сесії ACP.
- `/new` і `/reset` скидають ту саму привʼязану сесію ACP на місці.
- `/acp close` закриває сесію ACP і видаляє привʼязку.

Налаштовані постійні привʼязки підтримуються через записи верхнього рівня `bindings[]` з `type: "acp"` і `match.channel: "imessage"`.

`match.peer.id` може використовувати:

- нормалізований handle DM, як-от `+15555550123` або `user@example.com`
- `chat_id:<id>` (рекомендовано для стабільних групових привʼязок)
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

Див. [Агенти ACP](/uk/tools/acp-agents) для спільної поведінки привʼязок ACP.

## Шаблони розгортання

<AccordionGroup>
  <Accordion title="Виділений користувач macOS для бота (окрема ідентичність iMessage)">
    Використовуйте виділений Apple ID і користувача macOS, щоб трафік бота був ізольований від вашого особистого профілю Messages.

    Типовий flow:

    1. Створіть/увійдіть у виділеного користувача macOS.
    2. Увійдіть у Messages з Apple ID бота в цьому користувачі.
    3. Встановіть `imsg` у цьому користувачі.
    4. Створіть SSH-обгортку, щоб OpenClaw міг запускати `imsg` у контексті цього користувача.
    5. Вкажіть `channels.imessage.accounts.<id>.cliPath` і `.dbPath` на профіль цього користувача.

    Перший запуск може потребувати GUI-схвалень (Automation + Full Disk Access) у сесії цього користувача-бота.

  </Accordion>

  <Accordion title="Віддалений Mac через Tailscale (приклад)">
    Поширена топологія:

    - gateway працює на Linux/VM
    - iMessage + `imsg` працюють на Mac у вашій tailnet
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
    Спочатку переконайтеся, що ключ хоста довірений (наприклад, `ssh bot@mac-mini.tailnet-1234.ts.net`), щоб `known_hosts` було заповнено.

  </Accordion>

  <Accordion title="Шаблон із кількома акаунтами">
    iMessage підтримує конфігурацію для кожного акаунта в `channels.imessage.accounts`.

    Кожен акаунт може перевизначати поля, як-от `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, налаштування історії та списки дозволених коренів вкладень.

  </Accordion>

  <Accordion title="Історія прямих повідомлень">
    Встановіть `channels.imessage.dmHistoryLimit`, щоб наповнювати нові сесії прямих повідомлень нещодавньою декодованою історією `imsg` для цієї розмови. Використовуйте `channels.imessage.dms["<sender>"].historyLimit` для перевизначень для окремих відправників, включно з `0`, щоб вимкнути історію для відправника.

    Історія DM iMessage отримується на вимогу з `imsg`. Якщо `dmHistoryLimit` не задано, глобальне наповнення історії DM вимкнене, але додатний `channels.imessage.dms["<sender>"].historyLimit` для окремого відправника все одно вмикає наповнення для цього відправника.

  </Accordion>
</AccordionGroup>

## Медіа, поділ на фрагменти та цілі доставки

<AccordionGroup>
  <Accordion title="Вкладення та медіа">
    - отримання вхідних вкладень **вимкнено за замовчуванням** — задайте `channels.imessage.includeAttachments: true`, щоб пересилати фотографії, голосові нотатки, відео та інші вкладення агенту. Якщо це вимкнено, iMessages лише з вкладеннями відкидаються до потрапляння до агента й можуть узагалі не створювати рядок журналу `Inbound message`.
    - шляхи до віддалених вкладень можна отримувати через SCP, коли задано `remoteHost`
    - шляхи до вкладень мають відповідати дозволеним кореням:
      - `channels.imessage.attachmentRoots` (локально)
      - `channels.imessage.remoteAttachmentRoots` (режим віддаленого SCP)
      - стандартний шаблон кореня: `/Users/*/Library/Messages/Attachments`
    - SCP використовує сувору перевірку ключа хоста (`StrictHostKeyChecking=yes`)
    - розмір вихідних медіа використовує `channels.imessage.mediaMaxMb` (за замовчуванням 16 MB)

  </Accordion>

  <Accordion title="Розбиття вихідних повідомлень">
    - ліміт текстового фрагмента: `channels.imessage.textChunkLimit` (за замовчуванням 4000)
    - режим розбиття: `channels.imessage.chunkMode`
      - `length` (за замовчуванням)
      - `newline` (розбиття спершу за абзацами)

  </Accordion>

  <Accordion title="Формати адресації">
    Бажані явні цілі:

    - `chat_id:123` (рекомендовано для стабільної маршрутизації)
    - `chat_guid:...`
    - `chat_identifier:...`

    Цілі за ідентифікатором контакту також підтримуються:

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
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Доступні дії">
    - **react**: Додати/видалити tapback-реакції iMessage (`messageId`, `emoji`, `remove`). Підтримувані tapback-реакції відповідають love, like, dislike, laugh, emphasize і question.
    - **reply**: Надіслати відповідь у гілці до наявного повідомлення (`messageId`, `text` або `message`, а також `chatGuid`, `chatId`, `chatIdentifier` або `to`).
    - **sendWithEffect**: Надіслати текст з ефектом iMessage (`text` або `message`, `effect` або `effectId`).
    - **edit**: Редагувати надіслане повідомлення в підтримуваних версіях macOS/приватного API (`messageId`, `text` або `newText`).
    - **unsend**: Відкликати надіслане повідомлення в підтримуваних версіях macOS/приватного API (`messageId`).
    - **upload-file**: Надіслати медіа/файли (`buffer` як base64 або гідратоване `media`/`path`/`filePath`, `filename`, необов’язково `asVoice`). Застарілий псевдонім: `sendAttachment`.
    - **renameGroup**, **setGroupIcon**, **addParticipant**, **removeParticipant**, **leaveGroup**: Керувати груповими чатами, коли поточна ціль є груповою розмовою.

  </Accordion>

  <Accordion title="Ідентифікатори повідомлень">
    Вхідний контекст iMessage містить як короткі значення `MessageSid`, так і повні GUID повідомлень, коли вони доступні. Короткі ідентифікатори обмежені нещодавнім кешем відповідей на базі SQLite і перед використанням перевіряються щодо поточного чату. Якщо короткий ідентифікатор застарів або належить іншому чату, повторіть спробу з повним `MessageSidFull`.

  </Accordion>

  <Accordion title="Виявлення можливостей">
    OpenClaw приховує дії приватного API лише тоді, коли кешований статус перевірки каже, що міст недоступний. Якщо статус невідомий, дії лишаються видимими, а диспетчеризація запускає перевірки ліниво, щоб перша дія могла успішно виконатися після `imsg launch` без окремого ручного оновлення статусу.

  </Accordion>

  <Accordion title="Сповіщення про прочитання та набір тексту">
    Коли міст приватного API працює, прийняті вхідні чати позначаються як прочитані, а прямі чати показують бульбашку набору тексту щойно хід прийнято, доки агент готує контекст і генерує відповідь. Вимкніть позначення прочитання так:

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Старіші збірки `imsg`, що передують списку можливостей для кожного методу, безшумно вимикатимуть набір тексту/прочитання; OpenClaw записує одноразове попередження за перезапуск, щоб відсутнє сповіщення можна було пояснити.

  </Accordion>

  <Accordion title="Вхідні tapback-реакції">
    OpenClaw підписується на tapback-реакції iMessage і маршрутизує прийняті реакції як системні події замість звичайного тексту повідомлення, тому користувацька tapback-реакція не запускає звичайний цикл відповіді.

    Режим сповіщень керується `channels.imessage.reactionNotifications`:

    - `"own"` (за замовчуванням): сповіщати лише коли користувачі реагують на повідомлення, створені ботом.
    - `"all"`: сповіщати про всі вхідні tapback-реакції від авторизованих відправників.
    - `"off"`: ігнорувати вхідні tapback-реакції.

    Перевизначення для окремого облікового запису використовують `channels.imessage.accounts.<id>.reactionNotifications`.

  </Accordion>

  <Accordion title="Реакції схвалення (👍 / 👎)">
    Коли `approvals.exec.enabled` або `approvals.plugin.enabled` має значення true і запит маршрутизується до iMessage, gateway доставляє запит на схвалення нативно й приймає tapback-реакцію для його вирішення:

    - `👍` (tapback Like) → `allow-once`
    - `👎` (tapback Dislike) → `deny`
    - `allow-always` лишається ручним резервним варіантом: надішліть `/approve <id> allow-always` як звичайну відповідь.

    Обробка реакцій вимагає, щоб ідентифікатор користувача, який реагує, був явним схвалювачем. Список схвалювачів читається з `channels.imessage.allowFrom` (або `channels.imessage.accounts.<id>.allowFrom`); додайте номер телефону користувача у форматі E.164 або його електронну адресу Apple ID. Запис із шаблоном `"*"` враховується, але дозволяє будь-якому відправнику схвалювати. Скорочення через реакцію навмисно обходить `reactionNotifications`, `dmPolicy` і `groupAllowFrom`, бо явний allowlist схвалювачів є єдиним шлюзом, важливим для вирішення схвалення.

    **Зміна поведінки в цьому випуску:** Коли `channels.imessage.allowFrom` не порожній, текстова команда `/approve <id> <decision>` тепер авторизується за цим списком схвалювачів (а не за ширшим allowlist для DM). Відправники, дозволені в allowlist для DM, але відсутні в `allowFrom`, отримають явну відмову. Додайте кожного оператора, який має мати змогу схвалювати через `/approve` (і через реакції), до `allowFrom`, щоб зберегти попередню поведінку. Коли `allowFrom` порожній, застарілий «резервний варіант того самого чату» лишається чинним, і `/approve` далі авторизує будь-кого, кого дозволяє allowlist для DM.

    Нотатки для оператора:
    - Прив’язка реакції зберігається як у пам’яті (з TTL, узгодженим із терміном дії схвалення), так і в постійному сховищі ключів gateway, тому tapback-реакція, що надходить невдовзі після перезапуску gateway, все одно вирішує схвалення.
    - Міжпристроєві tapback-реакції `is_from_me=true` (власна реакція оператора на спареному пристрої Apple) навмисно ігноруються, щоб бот не міг схвалити сам себе.
    - Застарілі tapback-реакції у текстовому стилі (`Liked "…"` як звичайний текст від дуже старих клієнтів Apple) не можуть вирішувати схвалення, бо не несуть GUID повідомлення; вирішення через реакцію потребує структурованих метаданих tapback, які випускають поточні клієнти macOS / iOS.

  </Accordion>
</AccordionGroup>

## Записи конфігурації

iMessage за замовчуванням дозволяє ініційовані каналом записи конфігурації (для `/config set|unset`, коли `commands.config: true`).

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

## Об’єднання DM із розділеним надсиланням (команда + URL в одній композиції)

Коли користувач вводить команду й URL разом — наприклад, `Dump https://example.com/article` — застосунок Messages від Apple розділяє надсилання на **два окремі рядки `chat.db`**:

1. Текстове повідомлення (`"Dump"`).
2. Бульбашка попереднього перегляду URL (`"https://..."`) із зображеннями OG-попереднього перегляду як вкладеннями.

Два рядки надходять до OpenClaw з інтервалом приблизно 0.8-2.0 с у більшості налаштувань. Без об’єднання агент отримує лише команду на ході 1, відповідає (часто «надішліть мені URL») і бачить URL лише на ході 2 — коли контекст команди вже втрачено. Це конвеєр надсилання Apple, а не щось, що додає OpenClaw або `imsg`.

`channels.imessage.coalesceSameSenderDms` вмикає для DM буферизацію послідовних рядків від того самого відправника. Коли `imsg` надає структурний маркер попереднього перегляду URL `balloon_bundle_id: "com.apple.messages.URLBalloonProvider"` в одному з вихідних рядків, OpenClaw об’єднує лише це справжнє розділене надсилання й залишає всі інші буферизовані рядки окремими ходами. У старіших збірках `imsg`, які взагалі не передають метадані бульбашки, OpenClaw не може відрізнити розділене надсилання від окремих надсилань, тому резервно об’єднує буфер. Це зберігає поведінку до появи метаданих замість регресії розділених надсилань `Dump <url>` у два ходи. Групові чати й далі диспетчеризуються по одному повідомленню, щоб зберегти структуру ходів для кількох користувачів.

<Tabs>
  <Tab title="Коли вмикати">
    Увімкніть, коли:

    - Ви постачаєте Skills, які очікують `command + payload` в одному повідомленні (dump, paste, save, queue тощо).
    - Ваші користувачі вставляють URL разом із командами.
    - Ви можете прийняти додану затримку ходу DM (див. нижче).

    Залиште вимкненим, коли:

    - Вам потрібна мінімальна затримка команд для однословних тригерів у DM.
    - Усі ваші потоки є одноразовими командами без подальших корисних навантажень.

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

    Коли прапорець увімкнено й немає явного `messages.inbound.byChannel.imessage` або глобального `messages.inbound.debounceMs`, вікно debounce розширюється до **7000 ms** (застаріле значення за замовчуванням — 0 ms, тобто без debounce). Ширше вікно потрібне, бо каденція розділеного надсилання з URL-попереднім переглядом від Apple може розтягуватися на кілька секунд, доки Messages.app випускає рядок попереднього перегляду.

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
    - **Точне об’єднання потребує поточних метаданих payload від `imsg`.** Коли рядок URL містить `balloon_bundle_id`, об’єднується лише це справжнє розділене надсилання, а інші буферизовані рядки лишаються окремими. У старіших збірках `imsg`, які не надають метаданих бульбашки, OpenClaw резервно об’єднує буферизований набір, щоб розділені надсилання `Dump <url>` не регресували у два ходи (тимчасова зворотна сумісність, буде вилучено, щойно `imsg` почне об’єднувати розділені надсилання upstream).
    - **Додана затримка для повідомлень DM.** Коли прапорець увімкнено, кожен DM (включно з автономними керівними командами й однотекстовими подальшими повідомленнями) чекає до завершення вікна debounce перед диспетчеризацією, на випадок якщо надходить рядок URL-попереднього перегляду. Повідомлення групових чатів зберігають миттєву диспетчеризацію.
    - **Об’єднаний вихід обмежений.** Об’єднаний текст обмежується 4000 символами з явним маркером `…[truncated]`; вкладення обмежуються 20; вихідні записи обмежуються 10 (понад це зберігаються перший і найновіші). Кожен вихідний GUID відстежується в `coalescedMessageGuids` для подальшої телеметрії.
    - **Лише DM.** Групові чати проходять до диспетчеризації по одному повідомленню, щоб бот лишався чуйним, коли друкують кілька людей.
    - **Opt-in, для окремого каналу.** Інші канали (Telegram, WhatsApp, Slack, …) не зачіпаються. Застарілі конфігурації BlueBubbles, які задають `channels.bluebubbles.coalesceSameSenderDms`, мають перенести це значення до `channels.imessage.coalesceSameSenderDms`.

  </Tab>
</Tabs>

### Сценарії та те, що бачить агент

Стовпець "Flag on" показує поведінку в збірці `imsg`, яка видає `balloon_bundle_id`. У старіших збірках `imsg`, які взагалі не видають метадані balloon, наведені нижче рядки з позначками "Two turns" / "N turns" натомість повертаються до застарілого злиття (один хід): OpenClaw не може структурно відрізнити розділене надсилання від окремих надсилань, тому зберігає злиття, що існувало до появи метаданих. Точне розділення активується, щойно збірка починає видавати метадані balloon.

| Користувач складає                                                   | `chat.db` створює                   | Flag off (типово)                         | Flag on + вікно (`imsg` видає метадані balloon)                                                               |
| -------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Dump https://example.com` (одне надсилання)                         | 2 рядки з інтервалом ~1 с           | Два ходи агента: лише "Dump", потім URL   | Один хід: об’єднаний текст `Dump https://example.com`                                                         |
| `Save this 📎image.jpg caption` (вкладення + текст)                  | 2 рядки без метаданих URL balloon   | Два ходи                                  | Два ходи після виявлення метаданих; один об’єднаний хід у старих/дофіксаційних сеансах без метаданих          |
| `/status` (самостійна команда)                                       | 1 рядок                             | Миттєве надсилання                        | **Чекати до завершення вікна, потім надіслати**                                                               |
| URL, вставлений окремо                                               | 1 рядок                             | Миттєве надсилання                        | Чекати до завершення вікна, потім надіслати                                                                   |
| Текст + URL надіслані як два навмисно окремі повідомлення за хвилини | 2 рядки поза вікном                 | Два ходи                                  | Два ходи (вікно спливає між ними)                                                                             |
| Швидкий потік (>10 малих DM у межах вікна)                           | N рядків без метаданих URL balloon  | N ходів                                   | N ходів після виявлення метаданих; один обмежений об’єднаний хід у старих/дофіксаційних сеансах без метаданих |
| Двоє людей набирають у груповому чаті                                | N рядків від M відправників         | M+ ходів (по одному на бакет відправника) | M+ ходів — групові чати не об’єднуються                                                                       |

## Вхідне відновлення після перезапуску bridge або Gateway

iMessage відновлює повідомлення, пропущені під час простою Gateway, і водночас пригнічує застарілу "backlog bomb", яку Apple може скинути після Push-відновлення. Типова поведінка завжди ввімкнена та побудована на вхідній дедуплікації.

- **Дедуплікація повторного відтворення.** Кожне доставлене вхідне повідомлення записується за його Apple GUID у сталому стані Plugin (`imessage.inbound-dedupe`), заявляється під час приймання та фіксується після обробки (звільняється у разі тимчасового збою, щоб його можна було повторити). Усе вже оброблене відкидається замість повторного доставлення. Саме це дає змогу відновленню агресивно повторно відтворювати без обліку кожного повідомлення.
- **Відновлення після простою.** Під час запуску монітор запам’ятовує останній доставлений `chat.db` rowid (сталий курсор для облікового запису) і передає його в `imsg watch.subscribe` як `since_rowid`, тому imsg повторно відтворює рядки, що надійшли, поки Gateway був вимкнений, а потім відстежує наживо. Повторне відтворення обмежене найновішими рядками та повідомленнями віком до ~2 годин, а дедуплікація відкидає все вже оброблене.
- **Віковий бар’єр застарілого backlog.** Рядки вище межі запуску справді живі; той, чия дата надсилання більш ніж на ~15 хвилин старіша за прибуття, є backlog зі скидання Push і пригнічується. Повторно відтворені рядки (на межі або нижче) натомість використовують ширше вікно відновлення, тому нещодавно пропущене повідомлення доставляється, а давня історія — ні.

Відновлення працює як із локальними, так і з віддаленими налаштуваннями `cliPath`, оскільки повторне відтворення `since_rowid` виконується через те саме RPC-з’єднання `imsg`. Різниця у вікні: коли Gateway може читати `chat.db` (локально), він прив’язує межу rowid запуску, обмежує діапазон повторного відтворення та доставляє пропущені повідомлення віком до кількох годин. Через віддалений SSH `cliPath` він не може читати базу даних, тому повторне відтворення не обмежене, і кожен рядок використовує живий віковий бар’єр — він усе ще відновлює нещодавно пропущені повідомлення та пригнічує старий backlog, але з вужчим живим вікном. Запускайте Gateway на Mac із Messages для ширшого вікна відновлення.

### Сигнал, видимий оператору

Пригнічений backlog журналюється на типовому рівні й ніколи не відкидається мовчки (прапорець `recovery` показує, яке вікно застосовано):

```
imessage: suppressed stale inbound backlog account=<id> sent=<iso> recovery=<bool> (<N> suppressed since start)
```

### Міграція

`channels.imessage.catchup.*` застаріло — відновлення після простою тепер автоматичне й не потребує конфігурації для нових налаштувань. Наявні конфігурації з `catchup.enabled: true` і далі підтримуються як профіль сумісності для вікна повторного відтворення відновлення. Вимкнені блоки catchup (`enabled: false` або без `enabled: true`) виведені з ужитку; `openclaw doctor --fix` видаляє їх.

## Усунення несправностей

<AccordionGroup>
  <Accordion title="imsg не знайдено або RPC не підтримується">
    Перевірте бінарний файл і підтримку RPC:

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    Якщо перевірка повідомляє, що RPC не підтримується, оновіть `imsg`. Якщо дії private API недоступні, запустіть `imsg launch` у сеансі користувача macOS, який увійшов у систему, і повторіть перевірку. Якщо Gateway не працює на macOS, використовуйте наведене вище налаштування Remote Mac через SSH замість типового локального шляху `imsg`.

  </Accordion>

  <Accordion title="Messages надсилає, але вхідні iMessages не надходять">
    Спершу доведіть, чи повідомлення дійшло до локального Mac. Якщо `chat.db` не змінюється, OpenClaw не може отримати повідомлення, навіть коли `imsg status --json` повідомляє про справний bridge.

```bash
imsg chats --limit 10 --json
imsg watch --chat-id <chat-id> --json
sqlite3 ~/Library/Messages/chat.db \
  "select datetime(max(date)/1000000000 + 978307200, 'unixepoch', 'localtime'), max(ROWID) from message;"
```

    Якщо повідомлення, надіслані з телефона, не створюють нових рядків, відремонтуйте шар macOS Messages і Apple Push, перш ніж змінювати конфігурацію OpenClaw. Одноразового оновлення сервісів часто достатньо:

```bash
launchctl kickstart -k system/com.apple.apsd
launchctl kickstart -k gui/$(id -u)/com.apple.CommCenter
launchctl kickstart -k gui/$(id -u)/com.apple.identityservicesd
launchctl kickstart -k gui/$(id -u)/com.apple.imagent
imsg launch
openclaw gateway restart
```

    Надішліть свіже iMessage з телефона й підтвердьте новий рядок `chat.db` або подію `imsg watch`, перш ніж налагоджувати сеанси OpenClaw. Не запускайте це як періодичний цикл перезапуску bridge; повторні `imsg launch` разом із перезапусками Gateway під час активної роботи можуть переривати доставлення й залишати виконання каналу в процесі завислими.

  </Accordion>

  <Accordion title="Gateway не працює на macOS">
    Типовий `cliPath: "imsg"` має виконуватися на Mac, у якому виконано вхід у Messages. На Linux або Windows встановіть `channels.imessage.cliPath` на wrapper-скрипт, який підключається SSH до цього Mac і запускає `imsg "$@"`.

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    Потім виконайте:

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="DM ігноруються">
    Перевірте:

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - схвалення сполучення (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Групові повідомлення ігноруються">
    Перевірте:

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - поведінку списку дозволених `channels.imessage.groups`
    - конфігурацію шаблонів згадок (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Віддалені вкладення не працюють">
    Перевірте:

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - автентифікацію ключем SSH/SCP з хоста Gateway
    - наявність ключа хоста в `~/.ssh/known_hosts` на хості Gateway
    - доступність читання віддаленого шляху на Mac, де працює Messages

  </Accordion>

  <Accordion title="Запити дозволів macOS було пропущено">
    Повторно запустіть в інтерактивному GUI-терміналі в тому самому контексті користувача/сеансу та схваліть запити:

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    Підтвердьте, що Full Disk Access + Automation надані для контексту процесу, який запускає OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Вказівники на довідник конфігурації

- [Довідник конфігурації - iMessage](/uk/gateway/config-channels#imessage)
- [Конфігурація Gateway](/uk/gateway/configuration)
- [Сполучення](/uk/channels/pairing)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Видалення BlueBubbles і шлях imsg iMessage](/uk/announcements/bluebubbles-imessage) — оголошення та підсумок міграції
- [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles) — таблиця перекладу конфігурації та покрокове перемикання
- [Сполучення](/uk/channels/pairing) — автентифікація DM і потік сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та контроль згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
