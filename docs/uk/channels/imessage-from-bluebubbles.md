---
read_when:
    - Планування переходу з BlueBubbles на вбудований Plugin iMessage
    - Переклад ключів конфігурації BlueBubbles у відповідники iMessage
    - Перевірка imsg перед увімкненням Plugin iMessage
summary: Перенесіть старі конфігурації BlueBubbles до вбудованого Plugin iMessage без втрати сполучення, списків дозволених адрес або прив’язок груп.
title: Перехід із BlueBubbles
x-i18n:
    generated_at: "2026-06-27T17:10:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Вбудований Plugin `imessage` тепер досягає тієї самої поверхні приватного API, що й BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, керування групами, вкладення), керуючи [`steipete/imsg`](https://github.com/steipete/imsg) через JSON-RPC. Якщо у вас уже працює Mac із установленим `imsg`, ви можете прибрати сервер BlueBubbles і дозволити Plugin напряму спілкуватися з Messages.app.

Підтримку BlueBubbles видалено. OpenClaw підтримує iMessage лише через `imsg`. Цей посібник призначений для міграції старих конфігурацій `channels.bluebubbles` на `channels.imessage`; іншого підтримуваного шляху міграції немає.

<Note>
Коротке оголошення та резюме для оператора див. у [Видалення BlueBubbles і шлях imsg для iMessage](/uk/announcements/bluebubbles-imessage).
</Note>

## Контрольний список міграції

Використовуйте цей контрольний список, якщо ви вже знаєте свою стару конфігурацію BlueBubbles і хочете пройти найкоротший безпечний шлях:

1. Перевірте `imsg` напряму на Mac, де працює Messages.app (`imsg chats`, `imsg history`, `imsg send` і `imsg rpc --help`).
2. Скопіюйте ключі поведінки з `channels.bluebubbles` до `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` і `actions`.
3. Приберіть транспортні ключі, яких більше не існує: `serverUrl`, `password`, URL-адреси Webhook і налаштування сервера BlueBubbles.
4. Якщо Gateway не працює на Mac із Messages, задайте для `channels.imessage.cliPath` SSH-обгортку та задайте `remoteHost` для віддаленого отримання вкладень.
5. Коли Gateway зупинено, увімкніть `channels.imessage`, а потім виконайте `openclaw channels status --probe --channel imessage`.
6. Протестуйте одне особисте повідомлення, одну дозволену групу, вкладення, якщо вони ввімкнені, і кожну дію приватного API, яку, як ви очікуєте, використовуватиме агент.
7. Видаліть сервер BlueBubbles і стару конфігурацію `channels.bluebubbles` після перевірки шляху iMessage.

## Коли ця міграція має сенс

- Ви вже запускаєте `imsg` на тому самому Mac (або на доступному через SSH), де виконано вхід у Messages.app.
- Ви хочете на один рухомий компонент менше — без окремого сервера BlueBubbles, без кінцевої точки REST для автентифікації, без обв’язки Webhook. Один бінарний файл CLI замість сервера + клієнтського застосунку + допоміжного компонента.
- Ви використовуєте [підтримувану збірку macOS / `imsg`](/uk/channels/imessage#requirements-and-permissions-macos), де перевірка приватного API повідомляє `available: true`.

## Що робить imsg

`imsg` — це локальний CLI для macOS для Messages. OpenClaw запускає `imsg rpc` як дочірній процес і спілкується через JSON-RPC поверх stdin/stdout. Немає HTTP-сервера, URL Webhook, фонової служби, агента запуску чи порту, який потрібно відкривати.

- Читання відбувається з `~/Library/Messages/chat.db` через дескриптор SQLite лише для читання.
- Живі вхідні повідомлення надходять із `imsg watch` / `watch.subscribe`, що відстежує події файлової системи `chat.db` із резервним опитуванням.
- Надсилання використовує автоматизацію Messages.app для звичайного надсилання тексту й файлів.
- Розширені дії використовують `imsg launch`, щоб ін’єктувати допоміжний компонент `imsg` у Messages.app. Саме це відкриває сповіщення про прочитання, індикатори набору, розширене надсилання, редагування, скасування надсилання, відповідь у треді, tapback-реакції та керування групами.
- Збірки Linux можуть переглядати скопійований `chat.db`, але не можуть надсилати, стежити за живою базою даних Mac або керувати Messages.app. Для OpenClaw iMessage запускайте `imsg` на Mac із виконаним входом або через SSH-обгортку до цього Mac.

## Перш ніж почати

1. Установіть `imsg` на Mac, де працює Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Якщо `imsg chats` завершується помилкою `unable to open database file`, порожнім виводом або `authorization denied`, надайте повний доступ до диска терміналу, редактору, процесу Node, службі Gateway або батьківському SSH-процесу, який запускає `imsg`, а потім повторно відкрийте цей батьківський процес.

2. Перевірте поверхні читання, спостереження, надсилання та RPC перед зміною конфігурації OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Замініть `42` на справжній ідентифікатор чату з `imsg chats`. Для надсилання потрібен дозвіл автоматизації для Messages.app. Якщо OpenClaw працюватиме через SSH, запускайте ці команди через ту саму SSH-обгортку або контекст користувача, який використовуватиме OpenClaw. Якщо читання й перевірки працюють, але надсилання завершується помилкою AppleEvents `-1743`, перевірте, чи дозвіл автоматизації потрапив на `/usr/libexec/sshd-keygen-wrapper`; див. [Надсилання через SSH-обгортку завершується помилкою AppleEvents -1743](/uk/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

3. Увімкніть міст приватного API, якщо вам потрібні розширені дії:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` вимагає вимкненого SIP. Базове надсилання, історія та спостереження працюють без `imsg launch`; розширені дії — ні.

4. Після додавання ввімкненої конфігурації `channels.imessage` перевірте міст через OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Вам потрібно `imessage.privateApi.available: true`. Якщо повідомляється `false`, спершу виправте це — див. [Виявлення можливостей](/uk/channels/imessage#private-api-actions). `channels status --probe` перевіряє лише налаштовані й увімкнені облікові записи.

5. Зробіть знімок конфігурації:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Переклад конфігурації

iMessage і BlueBubbles мають багато спільної конфігурації на рівні каналу. Ключі, які змінюються, здебільшого стосуються транспорту (REST-сервер проти локального CLI). Ключі поведінки (`dmPolicy`, `groupPolicy`, `allowFrom` тощо) зберігають те саме значення.

| BlueBubbles                                                | bundled iMessage                          | Примітки                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Та сама семантика.                                                                                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.serverUrl`                           | _(вилучено)_                              | Немає REST-сервера — plugin запускає `imsg rpc` через stdio.                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.password`                            | _(вилучено)_                              | Автентифікація webhook не потрібна.                                                                                                                                                                                                                                                                                                                                                  |
| _(неявно)_                                                 | `channels.imessage.cliPath`               | Шлях до `imsg` (типово `imsg`); використовуйте wrapper-скрипт для SSH.                                                                                                                                                                                                                                                                                                               |
| _(неявно)_                                                 | `channels.imessage.dbPath`                | Необов’язкове перевизначення `chat.db` для Messages.app; автоматично визначається, якщо пропущено.                                                                                                                                                                                                                                                                                   |
| _(неявно)_                                                 | `channels.imessage.remoteHost`            | `host` або `user@host` — потрібно лише тоді, коли `cliPath` є SSH wrapper і ви хочете отримувати вкладення через SCP.                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Ті самі значення (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Схвалення спарювання переносяться за handle, а не за токеном.                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Ті самі значення (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Так само.                                                                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Скопіюйте це дослівно, включно з будь-яким wildcard-записом `groups: { "*": { ... } }`.** Параметри `requireMention`, `tools`, `toolsBySender` для окремих груп переносяться. З `groupPolicy: "allowlist"` порожній або відсутній блок `groups` непомітно відкидає кожне групове повідомлення — див. «Пастка реєстру груп» нижче.                                                 |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Типово `true`. З bundled plugin це спрацьовує лише тоді, коли активна перевірка приватного API.                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Та сама форма, **так само вимкнено за замовчуванням**. Якщо у вас вкладення передавалися в BlueBubbles, потрібно явно знову встановити це в блоці iMessage — це не переноситься неявно, а вхідні фото/медіа тихо відкидатися без рядка журналу `Inbound message`, доки ви цього не зробите.                                                                                         |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Локальні корені; ті самі правила wildcard.                                                                                                                                                                                                                                                                                                                                           |
| _(Н/Д)_                                                    | `channels.imessage.remoteAttachmentRoots` | Використовується лише тоді, коли `remoteHost` задано для отримання через SCP.                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Типово 16 MB в iMessage (типове значення BlueBubbles було 8 MB). Задайте явно, якщо хочете зберегти нижче обмеження.                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Типово 4000 в обох.                                                                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Те саме явне ввімкнення. Лише для DM — групові чати в обох каналах зберігають миттєве надсилання кожного повідомлення. Якщо ввімкнено без явного `messages.inbound.byChannel.imessage` або глобального `messages.inbound.debounceMs`, розширює типовий debounce для вхідних повідомлень до 7000 мс. Див. [документацію iMessage § Об’єднання DM, надісланих частинами](/uk/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(Н/Д)_                                   | iMessage вже читає відображувані імена відправників із `chat.db`.                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Перемикачі для кожної дії: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                                           |

Конфігурації з кількома обліковими записами (`channels.bluebubbles.accounts.*`) переносяться один-до-одного в `channels.imessage.accounts.*`.

## Пастка реєстру груп

Bundled iMessage plugin запускає **два** окремі шлюзи allowlist для груп поспіль. Обидва мають пройти, щоб групове повідомлення дійшло до агента:

1. **Allowlist відправника / цілі чату** (`channels.imessage.groupAllowFrom`) — перевіряється `isAllowedIMessageSender`. Зіставляє вхідні повідомлення за handle відправника, `chat_guid`, `chat_identifier` або `chat_id`. Та сама форма, що й у BlueBubbles.
2. **Реєстр груп** (`channels.imessage.groups`) — перевіряється `resolveChannelGroupPolicy` з `inbound-processing.ts:199`. З `groupPolicy: "allowlist"` цей шлюз вимагає одне з такого:
   - wildcard-запис `groups: { "*": { ... } }` (встановлює `allowAll = true`), або
   - явний запис для окремого `chat_id` у `groups`.

Якщо шлюз 1 проходить, а шлюз 2 ні, повідомлення відкидається. Plugin видає два сигнали рівня `warn`, тож це більше не відбувається непомітно на типовому рівні журналювання:

- Одноразовий стартовий `warn` для кожного облікового запису, коли задано `groupPolicy: "allowlist"`, але `channels.imessage.groups` порожній (немає wildcard `"*"`, немає записів для окремих `chat_id`) — спрацьовує до надходження будь-яких повідомлень.
- Одноразовий `warn` для кожного `chat_id` під час першого відкидання конкретної групи в runtime, із зазначенням chat_id і точного ключа, який потрібно додати до `groups`, щоб дозволити її.

Приватні повідомлення продовжують працювати, бо вони проходять іншим шляхом коду.

Це найпоширеніший режим відмови міграції BlueBubbles → вбудований iMessage: оператори копіюють `groupAllowFrom` і `groupPolicy`, але пропускають блок `groups`, бо BlueBubbles' `groups: { "*": { "requireMention": true } }` виглядає як не пов'язане налаштування згадки. Насправді воно критично важливе для шлюзу реєстру.

Мінімальна конфігурація, щоб групові повідомлення продовжили проходити після `groupPolicy: "allowlist"`:

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`requireMention: true` під `*` нешкідливий, коли шаблони згадок не налаштовані: runtime встановлює `canDetectMention = false` і обходить відкидання згадки в `inbound-processing.ts:512`. З налаштованими шаблонами згадок (`agents.list[].groupChat.mentionPatterns`) це працює як очікується.

Якщо в журналах Gateway є `imessage: dropping group message from chat_id=<id>` або стартовий рядок `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, відкидає шлюз 2 — додайте блок `groups`.

## Покроково

1. Додайте блок iMessage поруч з наявним блоком BlueBubbles. Тримайте його вимкненим, поки Gateway усе ще маршрутизує трафік BlueBubbles:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // copy from bluebubbles.allowFrom
         groupPolicy: "allowlist",
         groupAllowFrom: [], // copy from bluebubbles.groupAllowFrom
         groups: { "*": { requireMention: true } }, // copy from bluebubbles.groups — silently drops groups if missing, see "Group registry footgun" above
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **Перевірте до того, як трафік стане важливим** — зупиніть Gateway, тимчасово увімкніть блок iMessage і підтвердьте, що iMessage повідомляє про справний стан із CLI:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` перевіряє лише налаштовані, увімкнені облікові записи. Не перезапускайте Gateway з одночасно увімкненими BlueBubbles та iMessage, якщо ви навмисно не хочете, щоб працювали обидва монітори каналів. Якщо ви не перемикаєтесь негайно, встановіть `channels.imessage.enabled` назад у `false` перед перезапуском Gateway. Використовуйте прямі команди `imsg` у [Перед початком](#before-you-start), щоб перевірити Mac перед увімкненням трафіку OpenClaw.

3. **Перемкніться.** Коли увімкнений обліковий запис iMessage повідомляє про справний стан, видаліть конфігурацію BlueBubbles і залиште iMessage увімкненим:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Перезапустіть Gateway. Вхідний трафік iMessage тепер проходить через вбудований Plugin.

4. **Перевірте приватні повідомлення.** Надішліть агенту пряме повідомлення; підтвердьте, що відповідь доставлена.

5. **Перевірте групи окремо.** Приватні повідомлення й групи проходять різними шляхами коду — успіх приватного повідомлення не доводить, що групи маршрутизуються. Надішліть агенту повідомлення в спарений груповий чат і підтвердьте, що відповідь доставлена. Якщо група замовкає (немає відповіді агента, немає помилки), перевірте журнал Gateway на `imessage: dropping group message from chat_id=<id>` або стартовий рядок `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — обидва з'являються на типовому рівні журналювання. Якщо з'являється будь-який із них, ваш блок `groups` відсутній або порожній — див. «пастку реєстру груп» вище.

6. **Перевірте поверхню дій** — зі спареного приватного повідомлення попросіть агента поставити реакцію, відредагувати, скасувати надсилання, відповісти, надіслати фото, а також (у групі) перейменувати групу / додати або видалити учасника. Кожна дія має нативно з'явитися в Messages.app. Якщо будь-що видає "iMessage `<action>` requires the imsg private API bridge", знову запустіть `imsg launch` і оновіть `channels status --probe`.

7. **Видаліть сервер і конфігурацію BlueBubbles**, коли приватні повідомлення iMessage, групи й дії перевірено. OpenClaw не використовуватиме `channels.bluebubbles`.

## Стислий огляд паритету дій

| Дія                                                 | застарілий BlueBubbles              | вбудований iMessage                                                           |
| --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| Надсилання тексту / резервний SMS                   | ✅                                  | ✅                                                                            |
| Надсилання медіа (фото, відео, файл, голос)         | ✅                                  | ✅                                                                            |
| Відповідь у треді (`reply_to_guid`)                 | ✅                                  | ✅ (закриває [#51892](https://github.com/openclaw/openclaw/issues/51892))     |
| Tapback (`react`)                                   | ✅                                  | ✅                                                                            |
| Редагування / скасування надсилання (одержувачі macOS 13+) | ✅                                  | ✅                                                                            |
| Надсилання з екранним ефектом                       | ✅                                  | ✅ (закриває частину [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Форматований текст жирний / курсив / підкреслення / закреслення | ✅                                  | ✅ (форматування typed-run через attributedBody)                              |
| Перейменування групи / встановлення іконки групи    | ✅                                  | ✅                                                                            |
| Додавання / видалення учасника, вихід із групи      | ✅                                  | ✅                                                                            |
| Сповіщення про прочитання й індикатор набору        | ✅                                  | ✅ (обмежено перевіркою приватного API)                                       |
| Об'єднання приватних повідомлень від того самого відправника | ✅                                  | ✅ (лише для приватних повідомлень; opt-in через `channels.imessage.coalesceSameSenderDms`) |
| Відновлення вхідних повідомлень після перезапуску   | ✅ (повтор webhook + отримання історії) | ✅ (автоматично: повтор пропущених через since_rowid + дедуплікація; ширше вікно локально) |

iMessage відновлює повідомлення, пропущені, поки Gateway був вимкнений: під час запуску він повторно програє з останнього відправленого rowid через `imsg watch.subscribe` `since_rowid` і дедуплікує за GUID, а віковий бар'єр застарілого backlog приглушує Push-flush "backlog bomb". Це працює через RPC-з'єднання `imsg`, тому працює і для налаштувань віддаленого SSH `cliPath`; локальні налаштування отримують ширше вікно відновлення, бо можуть читати `chat.db`. Див. [Відновлення вхідних повідомлень після перезапуску мосту або Gateway](/uk/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Спарювання, сеанси та прив'язки ACP

- **Схвалення спарювання** переносяться за handle. Вам не потрібно повторно схвалювати відомих відправників — `channels.imessage.allowFrom` розпізнає ті самі рядки `+15555550123` / `user@example.com`, які використовував BlueBubbles.
- **Сеанси** залишаються обмеженими агентом + чатом. Приватні повідомлення згортаються в основний сеанс агента за типового `session.dmScope=main`; групові сеанси залишаються ізольованими за `chat_id`. Ключі сеансів відрізняються (`agent:<id>:imessage:group:<chat_id>` проти еквівалента BlueBubbles) — стара історія розмов за ключами сеансів BlueBubbles не переноситься в сеанси iMessage.
- **Прив'язки ACP**, що посилаються на `match.channel: "bluebubbles"`, потрібно оновити до `"imessage"`. Форми `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, простий handle) ідентичні.

## Немає каналу відкату

Немає підтримуваного runtime BlueBubbles, на який можна перемкнутися назад. Якщо перевірка iMessage не вдається, встановіть `channels.imessage.enabled: false`, перезапустіть Gateway, виправте блокер `imsg` і повторіть перемикання.

Кеш відповідей зберігається в SQLite-стані Plugin. `openclaw doctor --fix` імпортує та архівує старий sidecar `imessage/reply-cache.jsonl`, якщо він присутній.

## Пов'язане

- [Видалення BlueBubbles і шлях imsg iMessage](/uk/announcements/bluebubbles-imessage) — коротке оголошення та підсумок для оператора.
- [iMessage](/uk/channels/imessage) — повна довідка каналу iMessage, зокрема налаштування `imsg launch` і виявлення можливостей.
- `/channels/bluebubbles` — застаріла URL-адреса, що переспрямовує на цей посібник із міграції.
- [Спарювання](/uk/channels/pairing) — автентифікація приватних повідомлень і потік спарювання.
- [Маршрутизація каналів](/uk/channels/channel-routing) — як Gateway вибирає канал для вихідних відповідей.
