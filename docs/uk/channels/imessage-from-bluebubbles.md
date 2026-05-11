---
read_when:
    - Планування переходу з BlueBubbles на вбудований iMessage Plugin
    - Переклад ключів конфігурації BlueBubbles на еквіваленти iMessage
    - Перевірка imsg перед увімкненням iMessage Plugin
summary: Перенесіть старі конфігурації BlueBubbles до вбудованого iMessage Plugin без втрати спарювання, списків дозволених або прив’язок груп.
title: Перехід з BlueBubbles
x-i18n:
    generated_at: "2026-05-11T20:20:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 255bb79faf8e19215728c0401e6cac530f7bf4bfc8577df33518ab21a1597e90
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Комплектний Plugin `imessage` тепер отримує доступ до тієї самої поверхні приватного API, що й BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, керування групами, вкладення), запускаючи [`steipete/imsg`](https://github.com/steipete/imsg) через JSON-RPC. Якщо у вас уже працює Mac зі встановленим `imsg`, ви можете прибрати сервер BlueBubbles і дозволити Plugin напряму взаємодіяти з Messages.app.

Підтримку BlueBubbles видалено. OpenClaw підтримує iMessage лише через `imsg`. Цей посібник призначений для міграції старих конфігурацій `channels.bluebubbles` на `channels.imessage`; іншого підтримуваного шляху міграції немає.

<Note>
Коротке оголошення та зведення для операторів див. у [Видалення BlueBubbles і шлях imsg для iMessage](/uk/announcements/bluebubbles-imessage).
</Note>

## Контрольний список міграції

Скористайтеся цим списком, якщо ви вже знаєте свою стару конфігурацію BlueBubbles і хочете найкоротший безпечний шлях:

1. Перевірте `imsg` напряму на Mac, де працює Messages.app (`imsg chats`, `imsg history`, `imsg send` і `imsg rpc --help`).
2. Скопіюйте ключі поведінки з `channels.bluebubbles` до `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` і `actions`.
3. Видаліть транспортні ключі, яких більше не існує: `serverUrl`, `password`, URL-адреси Webhook і налаштування сервера BlueBubbles.
4. Якщо Gateway не працює на Mac із Messages, встановіть `channels.imessage.cliPath` на SSH-обгортку та задайте `remoteHost` для віддаленого отримання вкладень.
5. Коли Gateway зупинено, увімкніть `channels.imessage`, а потім виконайте `openclaw channels status --probe --channel imessage`.
6. Перевірте один DM, одну дозволену групу, вкладення, якщо їх увімкнено, і кожну дію приватного API, яку, як очікується, використовуватиме агент.
7. Видаліть сервер BlueBubbles і стару конфігурацію `channels.bluebubbles` після перевірки шляху iMessage.

## Коли ця міграція має сенс

- Ви вже запускаєте `imsg` на тому самому Mac (або на доступному через SSH), де виконано вхід у Messages.app.
- Ви хочете мати на один рухомий компонент менше — без окремого сервера BlueBubbles, без REST-ендпоінта для автентифікації, без зв’язування Webhook. Один бінарний файл CLI замість сервера + клієнтського застосунку + помічника.
- Ви використовуєте [підтримувану macOS / збірку `imsg`](/uk/channels/imessage#requirements-and-permissions-macos), де проба приватного API повідомляє `available: true`.

## Що робить imsg

`imsg` — це локальний macOS CLI для Messages. OpenClaw запускає `imsg rpc` як дочірній процес і взаємодіє через JSON-RPC поверх stdin/stdout. Тут немає HTTP-сервера, URL Webhook, фонового демона, агента запуску чи порту, який потрібно відкривати.

- Читання відбувається з `~/Library/Messages/chat.db` через SQLite-дескриптор лише для читання.
- Живі вхідні повідомлення надходять із `imsg watch` / `watch.subscribe`, який відстежує події файлової системи `chat.db` із резервним опитуванням.
- Надсилання використовує автоматизацію Messages.app для звичайного надсилання тексту й файлів.
- Розширені дії використовують `imsg launch`, щоб ін’єктувати помічник `imsg` у Messages.app. Саме це розблоковує звіти про прочитання, індикатори набору тексту, розширене надсилання, редагування, скасування надсилання, відповіді в тредах, tapbacks і керування групами.
- Збірки Linux можуть переглядати скопійований `chat.db`, але не можуть надсилати повідомлення, стежити за живою базою даних Mac або керувати Messages.app. Для OpenClaw iMessage запускайте `imsg` на Mac, де виконано вхід, або через SSH-обгортку до цього Mac.

## Перш ніж почати

1. Встановіть `imsg` на Mac, де працює Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Якщо `imsg chats` завершується помилкою `unable to open database file`, порожнім виводом або `authorization denied`, надайте повний доступ до диска терміналу, редактору, процесу Node, сервісу Gateway або батьківському процесу SSH, який запускає `imsg`, а потім знову відкрийте цей батьківський процес.

2. Перевірте поверхні читання, спостереження, надсилання та RPC перед зміною конфігурації OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Замініть `42` на справжній ідентифікатор чату з `imsg chats`. Для надсилання потрібен дозвіл автоматизації для Messages.app. Якщо OpenClaw працюватиме через SSH, виконайте ці команди через ту саму SSH-обгортку або контекст користувача, який використовуватиме OpenClaw.

3. Увімкніть міст приватного API, коли потрібні розширені дії:

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` вимагає вимкненого SIP. Базове надсилання, історія та спостереження працюють без `imsg launch`; розширені дії — ні.

4. Після додавання увімкненої конфігурації `channels.imessage` перевірте міст через OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Потрібне значення `imessage.privateApi.available: true`. Якщо виводиться `false`, спочатку виправте це — див. [Виявлення можливостей](/uk/channels/imessage#private-api-actions). `channels status --probe` перевіряє лише налаштовані й увімкнені облікові записи.

5. Зробіть знімок конфігурації:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Переклад конфігурації

iMessage і BlueBubbles мають багато спільної конфігурації на рівні каналу. Ключі, що змінюються, здебільшого стосуються транспорту (REST-сервер проти локального CLI). Ключі поведінки (`dmPolicy`, `groupPolicy`, `allowFrom` тощо) зберігають те саме значення.

| BlueBubbles                                                | вбудований iMessage                       | Примітки                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Та сама семантика.                                                                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.serverUrl`                           | _(вилучено)_                              | Немає REST-сервера — Plugin запускає `imsg rpc` через stdio.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.password`                            | _(вилучено)_                              | Автентифікація Webhook не потрібна.                                                                                                                                                                                                                                                                                                          |
| _(неявно)_                                                 | `channels.imessage.cliPath`               | Шлях до `imsg` (типово `imsg`); використовуйте wrapper script для SSH.                                                                                                                                                                                                                                                                       |
| _(неявно)_                                                 | `channels.imessage.dbPath`                | Необов'язкове перевизначення `chat.db` Messages.app; автоматично виявляється, якщо пропущено.                                                                                                                                                                                                                                                |
| _(неявно)_                                                 | `channels.imessage.remoteHost`            | `host` або `user@host` — потрібно лише коли `cliPath` є SSH wrapper і ви хочете отримувати вкладення через SCP.                                                                                                                                                                                                                              |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Ті самі значення (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Підтвердження спарювання переносяться за handle, а не за токеном.                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Ті самі значення (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | Те саме.                                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Скопіюйте це дослівно, включно з будь-яким wildcard-записом `groups: { "*": { ... } }`.** Групові `requireMention`, `tools`, `toolsBySender` переносяться. З `groupPolicy: "allowlist"` порожній або відсутній блок `groups` тихо відкидає кожне групове повідомлення — див. "Пастка реєстру груп" нижче.                                  |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | Типово `true`. З вбудованим Plugin це спрацьовує лише коли probe приватного API працює.                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Та сама форма, **так само вимкнено за замовчуванням**. Якщо у вас вкладення проходили в BlueBubbles, потрібно явно повторно задати це в блоці iMessage — воно не переноситься неявно, а вхідні фото/медіа будуть тихо відкидатися без рядка журналу `Inbound message`, доки ви цього не зробите.                                           |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Локальні корені; ті самі правила wildcard.                                                                                                                                                                                                                                                                                                   |
| _(Н/Д)_                                                    | `channels.imessage.remoteAttachmentRoots` | Використовується лише коли `remoteHost` задано для отримання через SCP.                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | Типово 16 МБ в iMessage (типове значення BlueBubbles було 8 МБ). Задайте явно, якщо хочете зберегти нижчу межу.                                                                                                                                                                                                                              |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | Типово 4000 в обох.                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | Те саме опціональне ввімкнення. Лише для DM — групові чати в обох каналах зберігають миттєве надсилання кожного повідомлення. Розширює типовий вхідний debounce до 2500 мс, якщо ввімкнено без явного `messages.inbound.byChannel.imessage`. Див. [документацію iMessage § Об'єднання DM із розділеним надсиланням](/uk/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(Н/Д)_                                   | iMessage вже читає display names відправників із `chat.db`.                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Перемикачі для окремих дій: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                  |

Конфігурації з кількома обліковими записами (`channels.bluebubbles.accounts.*`) перекладаються один-до-одного в `channels.imessage.accounts.*`.

## Пастка реєстру груп

Вбудований iMessage Plugin запускає **два** окремі gates allowlist для груп поспіль. Обидва мають пройти, щоб групове повідомлення дійшло до агента:

1. **Allowlist відправника / цільового чату** (`channels.imessage.groupAllowFrom`) — перевіряється `isAllowedIMessageSender`. Зіставляє вхідні повідомлення за handle відправника, `chat_guid`, `chat_identifier` або `chat_id`. Та сама форма, що й у BlueBubbles.
2. **Реєстр груп** (`channels.imessage.groups`) — перевіряється `resolveChannelGroupPolicy` з `inbound-processing.ts:199`. З `groupPolicy: "allowlist"` цей gate вимагає або:
   - wildcard-запис `groups: { "*": { ... } }` (задає `allowAll = true`), або
   - явний запис для окремого `chat_id` у `groups`.

Якщо gate 1 проходить, але gate 2 ні, повідомлення відкидається. Plugin видає два сигнали рівня `warn`, тож це більше не є тихим за типового рівня журналювання:

- Одноразовий startup `warn` для кожного облікового запису, коли задано `groupPolicy: "allowlist"`, але `channels.imessage.groups` порожній (немає wildcard `"*"`, немає записів для окремих `chat_id`) — спрацьовує до надходження будь-яких повідомлень.
- Одноразовий `warn` для кожного `chat_id` під час першого відкидання конкретної групи в runtime, із назвою chat_id та точним ключем, який треба додати до `groups`, щоб дозволити її.

DM продовжують працювати, бо вони йдуть іншим code path.

Це найпоширеніший режим збою міграції BlueBubbles → вбудований iMessage: оператори копіюють `groupAllowFrom` і `groupPolicy`, але пропускають блок `groups`, бо BlueBubbles `groups: { "*": { "requireMention": true } }` виглядає як непов'язане налаштування згадки. Насправді воно критично важливе для gate реєстру.

Мінімальна конфігурація, щоб групові повідомлення продовжували проходити після `groupPolicy: "allowlist"`:

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

`requireMention: true` під `*` не шкодить, коли шаблони згадок не налаштовані: runtime встановлює `canDetectMention = false` і коротко замикає відкидання згадки на `inbound-processing.ts:512`. Із налаштованими шаблонами згадок (`agents.list[].groupChat.mentionPatterns`) це працює як очікується.

Якщо в журналах Gateway є `imessage: dropping group message from chat_id=<id>` або стартовий рядок `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, відкидає друга перевірка — додайте блок `groups`.

## Покроково

1. Додайте блок iMessage поряд з наявним блоком BlueBubbles. Тримайте його вимкненим, доки Gateway усе ще маршрутизує трафік BlueBubbles:

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

2. **Перевірте до того, як трафік стане важливим** — зупиніть Gateway, тимчасово увімкніть блок iMessage і підтвердьте через CLI, що iMessage повідомляє про справний стан:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` перевіряє лише налаштовані, увімкнені облікові записи. Не перезапускайте Gateway з одночасно увімкненими BlueBubbles і iMessage, якщо ви навмисно не хочете запускати обидва монітори каналів. Якщо ви не перемикаєтеся негайно, поверніть `channels.imessage.enabled` до `false` перед перезапуском Gateway. Використовуйте прямі команди `imsg` у розділі [Перед початком](#before-you-start), щоб перевірити Mac до вмикання трафіку OpenClaw.

3. **Перемкніться.** Щойно увімкнений обліковий запис iMessage повідомить про справний стан, видаліть конфігурацію BlueBubbles і залиште iMessage увімкненим:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Перезапустіть Gateway. Вхідний трафік iMessage тепер проходить через вбудований Plugin.

4. **Перевірте DM.** Надішліть агенту пряме повідомлення; підтвердьте, що відповідь надходить.

5. **Перевірте групи окремо.** DM і групи проходять різними шляхами коду — успіх DM не доводить, що групи маршрутизуються. Надішліть агенту повідомлення в спареному груповому чаті й підтвердьте, що відповідь надходить. Якщо група замовкає (немає відповіді агента, немає помилки), перевірте журнал Gateway на `imessage: dropping group message from chat_id=<id>` або стартовий рядок `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — обидва спрацьовують на стандартному рівні журналювання. Якщо з’являється будь-який із них, ваш блок `groups` відсутній або порожній — див. "Group registry footgun" вище.

6. **Перевірте поверхню дій** — зі спареного DM попросіть агента поставити реакцію, відредагувати, скасувати надсилання, відповісти, надіслати фото і (в групі) перейменувати групу / додати або вилучити учасника. Кожна дія має нативно з’явитися в Messages.app. Якщо будь-яка викидає "iMessage `<action>` requires the imsg private API bridge", знову запустіть `imsg launch` і оновіть `channels status --probe`.

7. **Видаліть сервер і конфігурацію BlueBubbles**, щойно DM, групи й дії iMessage буде перевірено. OpenClaw не використовуватиме `channels.bluebubbles`.

## Коротко про паритет дій

| Дія                                                        | застарілий BlueBubbles              | вбудований iMessage                                                                                                     |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Надсилання тексту / резервне SMS                           | ✅                                  | ✅                                                                                                                      |
| Надсилання медіа (фото, відео, файл, голос)                | ✅                                  | ✅                                                                                                                      |
| Відповідь у гілці (`reply_to_guid`)                        | ✅                                  | ✅ (закриває [#51892](https://github.com/openclaw/openclaw/issues/51892))                                               |
| Tapback (`react`)                                          | ✅                                  | ✅                                                                                                                      |
| Редагування / скасування надсилання (отримувачі macOS 13+) | ✅                                  | ✅                                                                                                                      |
| Надсилання з екранним ефектом                              | ✅                                  | ✅ (закриває частину [#9394](https://github.com/openclaw/openclaw/issues/9394))                                         |
| Форматований текст: жирний / курсив / підкреслення / закреслення | ✅                                  | ✅ (форматування typed-run через attributedBody)                                                                        |
| Перейменування групи / встановлення іконки групи           | ✅                                  | ✅                                                                                                                      |
| Додавання / вилучення учасника, вихід із групи             | ✅                                  | ✅                                                                                                                      |
| Сповіщення про прочитання та індикатор набору              | ✅                                  | ✅ (обмежено перевіркою приватного API)                                                                                 |
| Об’єднання DM від того самого відправника                  | ✅                                  | ✅ (лише DM; увімкнення через `channels.imessage.coalesceSameSenderDms`)                                                |
| Доганяння вхідних повідомлень, отриманих, поки Gateway був вимкнений | ✅ (повтор Webhook + отримання історії) | ✅ (увімкнення через `channels.imessage.catchup.enabled`; закриває [#78649](https://github.com/openclaw/openclaw/issues/78649)) |

Доганяння iMessage тепер доступне як опційна функція у вбудованому Plugin. Під час запуску Gateway, якщо `channels.imessage.catchup.enabled` має значення `true`, Gateway виконує один прохід `chats.list` + `messages.history` для кожного чату через той самий клієнт JSON-RPC, який використовує `imsg watch`, повторно пропускає кожен пропущений вхідний рядок через живий шлях dispatch (списки дозволів, політика груп, debouncer, кеш echo) і зберігає курсор для кожного облікового запису, щоб наступні запуски продовжували з місця зупинки. Див. [Доганяння після простою Gateway](/uk/channels/imessage#catching-up-after-gateway-downtime) для налаштування.

## Спарювання, сесії та прив’язки ACP

- **Схвалення спарювання** переносяться за handle. Вам не потрібно повторно схвалювати відомих відправників — `channels.imessage.allowFrom` розпізнає ті самі рядки `+15555550123` / `user@example.com`, які використовував BlueBubbles.
- **Сесії** залишаються обмеженими на рівні агент + чат. DM згортаються в основну сесію агента за стандартного `session.dmScope=main`; групові сесії залишаються ізольованими для кожного `chat_id`. Ключі сесій відрізняються (`agent:<id>:imessage:group:<chat_id>` проти еквівалента BlueBubbles) — стара історія розмов під ключами сесій BlueBubbles не переноситься в сесії iMessage.
- **Прив’язки ACP**, що посилаються на `match.channel: "bluebubbles"`, потрібно оновити до `"imessage"`. Форми `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, bare handle) ідентичні.

## Немає каналу відкату

Немає підтримуваного runtime BlueBubbles, на який можна перемкнутися назад. Якщо перевірка iMessage не вдається, встановіть `channels.imessage.enabled: false`, перезапустіть Gateway, усуньте блокер `imsg` і повторіть перемикання.

Кеш відповідей розташований у `~/.openclaw/state/imessage/reply-cache.jsonl` (режим `0600`, батьківський каталог `0700`). Його безпечно видалити, якщо потрібен чистий старт.

## Пов’язане

- [Видалення BlueBubbles і шлях imsg iMessage](/uk/announcements/bluebubbles-imessage) — коротке оголошення та резюме для оператора.
- [iMessage](/uk/channels/imessage) — повний довідник каналу iMessage, включно з налаштуванням `imsg launch` і визначенням можливостей.
- `/channels/bluebubbles` — застаріла URL-адреса, що переспрямовує на цей посібник із міграції.
- [Спарювання](/uk/channels/pairing) — автентифікація DM і потік спарювання.
- [Маршрутизація каналів](/uk/channels/channel-routing) — як Gateway обирає канал для вихідних відповідей.
