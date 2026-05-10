---
read_when:
    - Планування переходу з BlueBubbles на вбудований iMessage Plugin
    - Перетворення ключів конфігурації BlueBubbles на відповідники iMessage
    - Перевірка imsg перед увімкненням плагіна iMessage
summary: Перенесіть старі конфігурації BlueBubbles до вбудованого iMessage Plugin без втрати сполучення, списків дозволених або прив’язок груп.
title: Перехід із BlueBubbles
x-i18n:
    generated_at: "2026-05-10T19:21:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81ce77d7fe2d6fe054c1457e14624ebd2aba02f69ed7bc2cfb242cdb1de38a1e
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Вбудований Plugin `imessage` тепер отримує доступ до тієї самої поверхні приватного API, що й BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, керування групами, вкладення), керуючи [`steipete/imsg`](https://github.com/steipete/imsg) через JSON-RPC. Якщо ви вже запускаєте Mac зі встановленим `imsg`, можете прибрати сервер BlueBubbles і дозволити Plugin спілкуватися з Messages.app напряму.

Підтримку BlueBubbles вилучено. OpenClaw підтримує iMessage лише через `imsg`. Цей посібник призначений для міграції старих конфігурацій `channels.bluebubbles` на `channels.imessage`; іншого підтримуваного шляху міграції немає.

## Коли ця міграція має сенс

- Ви вже запускаєте `imsg` на тому самому Mac (або на Mac, доступному через SSH), де виконано вхід у Messages.app.
- Ви хочете на одну рухому частину менше — без окремого сервера BlueBubbles, без REST-кінцевої точки для автентифікації, без налаштування Webhook. Один бінарний файл CLI замість сервера + клієнтського застосунку + допоміжного компонента.
- Ви використовуєте [підтримувану збірку macOS / `imsg`](/uk/channels/imessage#requirements-and-permissions-macos), де перевірка приватного API повідомляє `available: true`.

## Що робить imsg

`imsg` — це локальний CLI для macOS для Messages. OpenClaw запускає `imsg rpc` як дочірній процес і спілкується через JSON-RPC по stdin/stdout. Немає HTTP-сервера, URL Webhook, фонового демона, launch agent або порту, який потрібно відкривати.

- Читання відбувається з `~/Library/Messages/chat.db` через read-only SQLite handle.
- Живі вхідні повідомлення надходять із `imsg watch` / `watch.subscribe`, який відстежує події файлової системи `chat.db` із резервним опитуванням.
- Надсилання використовує автоматизацію Messages.app для звичайного тексту й надсилання файлів.
- Розширені дії використовують `imsg launch`, щоб інʼєктувати допоміжний компонент `imsg` у Messages.app. Саме це відкриває сповіщення про прочитання, індикатори введення, розширене надсилання, редагування, скасування надсилання, відповіді в гілках, tapbacks і керування групами.
- Збірки Linux можуть переглядати скопійований `chat.db`, але не можуть надсилати, стежити за живою базою даних Mac або керувати Messages.app. Для OpenClaw iMessage запускайте `imsg` на Mac, де виконано вхід, або через SSH-обгортку до цього Mac.

## Перед початком

1. Установіть `imsg` на Mac, де працює Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Якщо `imsg chats` завершується помилкою `unable to open database file`, порожнім виводом або `authorization denied`, надайте Full Disk Access терміналу, редактору, процесу Node, службі Gateway або батьківському процесу SSH, який запускає `imsg`, а потім знову відкрийте цей батьківський процес.

2. Перевірте поверхні читання, спостереження, надсилання та RPC перед зміною конфігурації OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Замініть `42` на справжній chat id з `imsg chats`. Для надсилання потрібен дозвіл Automation для Messages.app. Якщо OpenClaw працюватиме через SSH, виконайте ці команди через ту саму SSH-обгортку або в тому самому контексті користувача, який використовуватиме OpenClaw.

3. Увімкніть міст приватного API, коли потрібні розширені дії:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` потребує вимкненого SIP. Базове надсилання, історія та спостереження працюють без `imsg launch`; розширені дії — ні.

4. Перевірте міст через OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Вам потрібно `imessage.privateApi.available: true`. Якщо повідомляється `false`, спочатку виправте це — див. [Виявлення можливостей](/uk/channels/imessage#private-api-actions).

5. Зробіть знімок конфігурації:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Переклад конфігурації

iMessage і BlueBubbles мають багато спільних налаштувань рівня каналу. Ключі, що змінюються, здебільшого стосуються транспорту (REST-сервер проти локального CLI). Ключі поведінки (`dmPolicy`, `groupPolicy`, `allowFrom` тощо) зберігають те саме значення.

| BlueBubbles                                                | вбудований iMessage                       | Примітки                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Та сама семантика.                                                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.serverUrl`                           | _(видалено)_                              | Немає REST-сервера — Plugin запускає `imsg rpc` через stdio.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.password`                            | _(видалено)_                              | Автентифікація webhook не потрібна.                                                                                                                                                                                                                                                                                                          |
| _(неявно)_                                                 | `channels.imessage.cliPath`               | Шлях до `imsg` (типово `imsg`); для SSH використовуйте скрипт-обгортку.                                                                                                                                                                                                                                                                      |
| _(неявно)_                                                 | `channels.imessage.dbPath`                | Необов'язкове перевизначення `chat.db` Messages.app; автоматично визначається, якщо пропущено.                                                                                                                                                                                                                                               |
| _(неявно)_                                                 | `channels.imessage.remoteHost`            | `host` або `user@host` — потрібно лише коли `cliPath` є SSH-обгорткою і вам потрібне отримання вкладень через SCP.                                                                                                                                                                                                                           |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Ті самі значення (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                             |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Схвалення сполучення переносяться за дескриптором, а не за токеном.                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Ті самі значення (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Те саме.                                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Скопіюйте це дослівно, включно з будь-яким wildcard-записом `groups: { "*": { ... } }`.** Групові `requireMention`, `tools`, `toolsBySender` переносяться. З `groupPolicy: "allowlist"` порожній або відсутній блок `groups` тихо відкидає кожне групове повідомлення — див. «Пастка реєстру груп» нижче.                                  |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Типово `true`. З вбудованим Plugin це спрацьовує лише коли проба приватного API активна.                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Та сама форма, **так само вимкнено за замовчуванням**. Якщо у вас вкладення надходили в BlueBubbles, потрібно явно знову задати це в блоці iMessage — неявно це не переноситься, а вхідні фото/медіа тихо відкидатимуться без рядка журналу `Inbound message`, доки ви цього не зробите.                                                   |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Локальні корені; ті самі правила wildcard.                                                                                                                                                                                                                                                                                                   |
| _(н/д)_                                                    | `channels.imessage.remoteAttachmentRoots` | Використовується лише коли `remoteHost` задано для отримання через SCP.                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Типово 16 MB в iMessage (типове значення BlueBubbles було 8 MB). Задайте явно, якщо хочете зберегти нижчу межу.                                                                                                                                                                                                                              |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Типово 4000 в обох.                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Та саме opt-in. Лише для DM — групові чати в обох каналах зберігають миттєву відправку кожного повідомлення. Коли ввімкнено без явного `messages.inbound.byChannel.imessage`, розширює типову затримку debounce для вхідних повідомлень до 2500 ms. Див. [документацію iMessage § Об'єднання DM, надісланих частинами](/uk/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(н/д)_                                   | iMessage уже читає відображувані імена відправників із `chat.db`.                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Перемикачі для окремих дій: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                  |

Конфігурації з кількома обліковими записами (`channels.bluebubbles.accounts.*`) переносяться один-до-одного в `channels.imessage.accounts.*`.

## Пастка реєстру груп

Вбудований iMessage Plugin запускає **два** окремі шлюзи allowlist для груп поспіль. Обидва мають пройти, щоб групове повідомлення дійшло до агента:

1. **Allowlist відправника / цільового чату** (`channels.imessage.groupAllowFrom`) — перевіряється `isAllowedIMessageSender`. Зіставляє вхідні повідомлення за дескриптором відправника, `chat_guid`, `chat_identifier` або `chat_id`. Та сама форма, що й у BlueBubbles.
2. **Реєстр груп** (`channels.imessage.groups`) — перевіряється `resolveChannelGroupPolicy` з `inbound-processing.ts:199`. З `groupPolicy: "allowlist"` цей шлюз вимагає або:
   - wildcard-запис `groups: { "*": { ... } }` (задає `allowAll = true`), або
   - явний запис для окремого `chat_id` у `groups`.

Якщо шлюз 1 проходить, але шлюз 2 ні, повідомлення відкидається. Plugin видає два сигнали рівня `warn`, тож це більше не є тихим на типовому рівні журналювання:

- Одноразовий `warn` під час запуску для кожного облікового запису, коли `groupPolicy: "allowlist"` задано, але `channels.imessage.groups` порожній (немає wildcard `"*"`, немає записів для окремих `chat_id`) — спрацьовує до надходження будь-яких повідомлень.
- Одноразовий `warn` для кожного `chat_id`, коли конкретну групу вперше відкинуто під час виконання, із назвою chat_id та точним ключем, який треба додати до `groups`, щоб дозволити її.

DM продовжують працювати, бо використовують інший шлях коду.

Це найпоширеніший режим відмови міграції BlueBubbles → вбудований iMessage: оператори копіюють `groupAllowFrom` і `groupPolicy`, але пропускають блок `groups`, бо `groups: { "*": { "requireMention": true } }` у BlueBubbles виглядає як непов'язане налаштування згадок. Насправді воно критично потрібне для шлюзу реєстру.

Мінімальна конфігурація, щоб групові повідомлення продовжували надходити після `groupPolicy: "allowlist"`:

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

`requireMention: true` під `*` нешкідливий, коли шаблони згадки не налаштовані: runtime встановлює `canDetectMention = false` і достроково пропускає відкидання згадки в `inbound-processing.ts:512`. Із налаштованими шаблонами згадки (`agents.list[].groupChat.mentionPatterns`) це працює як очікується.

Якщо в журналах gateway є `imessage: dropping group message from chat_id=<id>` або рядок запуску `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, спрацьовує бар’єр 2 — додайте блок `groups`.

## Покроково

1. Додайте блок iMessage поруч з наявним блоком BlueBubbles. Залиште старий блок лише як джерело для копіювання, доки новий шлях не буде перевірено:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... existing config ...
       },
       imessage: {
         enabled: false, // turn on after the dry run below
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

2. **Пробний запуск** — запустіть gateway і підтвердьте, що iMessage повідомляє про справний стан:

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # expect imessage.privateApi.available: true
   ```

   Оскільки `imessage.enabled` усе ще `false`, вхідний трафік iMessage ще не маршрутизується — але `--probe` перевіряє міст, щоб ви виявили проблеми з дозволами або встановленням до перемикання.

3. **Перемкніться.** Видаліть конфігурацію BlueBubbles і увімкніть iMessage одним редагуванням конфігурації:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Перезапустіть gateway. Вхідний трафік iMessage тепер проходитиме через вбудований Plugin.

4. **Перевірте приватні повідомлення.** Надішліть агенту пряме повідомлення; підтвердьте, що відповідь надійшла.

5. **Перевірте групи окремо.** Приватні повідомлення й групи проходять різними шляхами коду — успіх приватних повідомлень не доводить, що групи маршрутизуються. Надішліть агенту повідомлення в спареному груповому чаті й підтвердьте, що відповідь надійшла. Якщо група замовкає (немає відповіді агента, немає помилки), перевірте журнал gateway на `imessage: dropping group message from chat_id=<id>` або рядок запуску `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — обидва з’являються на стандартному рівні журналювання. Якщо з’являється будь-який із них, ваш блок `groups` відсутній або порожній — див. «Пастка реєстру груп» вище.

6. **Перевірте поверхню дій** — зі спареного приватного чату попросіть агента поставити реакцію, відредагувати, скасувати надсилання, відповісти, надіслати фото, а також (у групі) перейменувати групу / додати або видалити учасника. Кожна дія має нативно з’явитися в Messages.app. Якщо будь-яка з них видає "iMessage `<action>` requires the imsg private API bridge", знову виконайте `imsg launch` і оновіть `channels status --probe`.

7. **Видаліть сервер і конфігурацію BlueBubbles**, щойно приватні повідомлення, групи й дії iMessage буде перевірено. OpenClaw не використовуватиме `channels.bluebubbles`.

## Огляд паритету дій

| Дія                                                        | застарілий BlueBubbles              | вбудований iMessage                                                                                                     |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Надсилання тексту / резервний SMS                          | ✅                                  | ✅                                                                                                                      |
| Надсилання медіа (фото, відео, файл, голосове повідомлення) | ✅                                  | ✅                                                                                                                      |
| Відповідь у треді (`reply_to_guid`)                        | ✅                                  | ✅ (закриває [#51892](https://github.com/openclaw/openclaw/issues/51892))                                               |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Редагування / скасування надсилання (macOS 13+ отримувачі) | ✅                                  | ✅                                                                                                                      |
| Надсилання з екранним ефектом                              | ✅                                  | ✅ (закриває частину [#9394](https://github.com/openclaw/openclaw/issues/9394))                                         |
| Форматований текст: жирний / курсив / підкреслення / закреслення | ✅                                  | ✅ (форматування typed-run через attributedBody)                                                                        |
| Перейменування групи / встановлення значка групи           | ✅                                  | ✅                                                                                                                      |
| Додавання / видалення учасника, вихід із групи             | ✅                                  | ✅                                                                                                                      |
| Звіти про прочитання та індикатор набору                   | ✅                                  | ✅ (обмежено перевіркою приватного API)                                                                                 |
| Об’єднання приватних повідомлень від того самого відправника | ✅                                  | ✅ (лише для приватних повідомлень; вмикається через `channels.imessage.coalesceSameSenderDms`)                         |
| Доназдоганяння вхідних повідомлень, отриманих, поки gateway був вимкнений | ✅ (повтор webhook + отримання історії) | ✅ (вмикається через `channels.imessage.catchup.enabled`; закриває [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

Доназдоганяння iMessage тепер доступне як опціональна функція у вбудованому Plugin. Під час запуску gateway, якщо `channels.imessage.catchup.enabled` має значення `true`, gateway виконує один прохід `chats.list` + `messages.history` для кожного чату через той самий клієнт JSON-RPC, який використовує `imsg watch`, повторно пропускає кожен пропущений вхідний рядок через живий шлях диспетчеризації (allowlists, політика груп, debouncer, echo cache) і зберігає курсор для кожного облікового запису, щоб наступні запуски продовжували з місця зупинки. Див. [Доназдоганяння після простою gateway](/uk/channels/imessage#catching-up-after-gateway-downtime) для налаштування.

## Pairing, сесії та прив’язки ACP

- **Схвалення pairing** переносяться за handle. Вам не потрібно повторно схвалювати відомих відправників — `channels.imessage.allowFrom` розпізнає ті самі рядки `+15555550123` / `user@example.com`, які використовував BlueBubbles.
- **Сесії** залишаються обмеженими парою агент + чат. Приватні повідомлення згортаються в основну сесію агента за стандартного `session.dmScope=main`; групові сесії залишаються ізольованими для кожного `chat_id`. Ключі сесій відрізняються (`agent:<id>:imessage:group:<chat_id>` проти відповідника BlueBubbles) — стара історія розмов під ключами сесій BlueBubbles не переноситься в сесії iMessage.
- **Прив’язки ACP**, що посилаються на `match.channel: "bluebubbles"`, потрібно оновити до `"imessage"`. Форми `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, bare handle) ідентичні.

## Немає каналу відкату

Немає підтримуваного runtime BlueBubbles, на який можна перемкнутися назад. Якщо перевірка iMessage завершується невдачею, встановіть `channels.imessage.enabled: false`, перезапустіть Gateway, виправте блокер `imsg` і повторіть перемикання.

Кеш відповідей розташований у `~/.openclaw/state/imessage/reply-cache.jsonl` (режим `0600`, батьківський каталог `0700`). Його можна безпечно видалити, якщо потрібен чистий стан.

## Пов’язане

- [iMessage](/uk/channels/imessage) — повна довідка каналу iMessage, включно з налаштуванням `imsg launch` і виявленням можливостей.
- `/channels/bluebubbles` — застарілий URL, який переспрямовує на цей посібник із міграції.
- [Pairing](/uk/channels/pairing) — автентифікація приватних повідомлень і потік pairing.
- [Маршрутизація каналів](/uk/channels/channel-routing) — як gateway вибирає канал для вихідних відповідей.
