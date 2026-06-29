---
read_when:
    - Планирование перехода с BlueBubbles на встроенный plugin iMessage
    - Перевод ключей конфигурации BlueBubbles в эквиваленты iMessage
    - Проверка imsg перед включением Plugin iMessage
summary: Перенесите старые конфигурации BlueBubbles в встроенный Plugin iMessage без потери сопряжения, списков разрешений или привязок групп.
title: Переход с BlueBubbles
x-i18n:
    generated_at: "2026-06-28T22:34:20Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dae45911686697a064b19265b11acb87d377992f762256c44a22dd3f1b4c4b08
    source_path: channels/imessage-from-bluebubbles.md
    workflow: 16
---

Встроенный Plugin `imessage` теперь обращается к тому же набору приватных API, что и BlueBubbles (`react`, `edit`, `unsend`, `reply`, `sendWithEffect`, управление группами, вложения), управляя [`steipete/imsg`](https://github.com/steipete/imsg) через JSON-RPC. Если у вас уже есть Mac с установленным `imsg`, можно отказаться от сервера BlueBubbles и позволить Plugin обращаться к Messages.app напрямую.

Поддержка BlueBubbles удалена. OpenClaw поддерживает iMessage только через `imsg`. Это руководство предназначено для миграции старых конфигураций `channels.bluebubbles` на `channels.imessage`; другого поддерживаемого пути миграции нет.

<Note>
Краткий анонс и сводку для оператора см. в разделе [Удаление BlueBubbles и путь iMessage через imsg](/ru/announcements/bluebubbles-imessage).
</Note>

## Контрольный список миграции

Используйте этот список, если вы уже знаете свою старую конфигурацию BlueBubbles и хотите пройти самый короткий безопасный путь:

1. Проверьте `imsg` напрямую на Mac, где запущен Messages.app (`imsg chats`, `imsg history`, `imsg send` и `imsg rpc --help`).
2. Скопируйте ключи поведения из `channels.bluebubbles` в `channels.imessage`: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit`, `coalesceSameSenderDms` и `actions`.
3. Удалите транспортные ключи, которых больше нет: `serverUrl`, `password`, URL-адреса Webhook и настройку сервера BlueBubbles.
4. Если Gateway не запущен на Mac с Messages, задайте для `channels.imessage.cliPath` SSH-обертку и задайте `remoteHost` для удаленной загрузки вложений.
5. При остановленном Gateway включите `channels.imessage`, затем выполните `openclaw channels status --probe --channel imessage`.
6. Проверьте одно личное сообщение, одну разрешенную группу, вложения, если они включены, и каждое действие приватного API, которое, как вы ожидаете, будет использовать агент.
7. Удалите сервер BlueBubbles и старую конфигурацию `channels.bluebubbles` после проверки пути iMessage.

## Когда эта миграция имеет смысл

- Вы уже запускаете `imsg` на том же Mac (или на доступном по SSH), где выполнен вход в Messages.app.
- Вам нужен один компонент вместо нескольких — без отдельного сервера BlueBubbles, REST-эндпоинта для аутентификации и Webhook-обвязки. Один двоичный файл CLI вместо сервера, клиентского приложения и помощника.
- Вы используете [поддерживаемую сборку macOS / `imsg`](/ru/channels/imessage#requirements-and-permissions-macos), где проверка приватного API сообщает `available: true`.

## Что делает imsg

`imsg` — это локальный CLI для macOS Messages. OpenClaw запускает `imsg rpc` как дочерний процесс и обменивается JSON-RPC через stdin/stdout. Здесь нет HTTP-сервера, URL-адреса Webhook, фонового демона, launch agent или порта, который нужно открывать.

- Чтение выполняется из `~/Library/Messages/chat.db` с использованием дескриптора SQLite только для чтения.
- Входящие сообщения в реальном времени поступают из `imsg watch` / `watch.subscribe`, который отслеживает события файловой системы `chat.db` с резервным опросом.
- Отправка использует автоматизацию Messages.app для обычного текста и файлов.
- Расширенные действия используют `imsg launch`, чтобы внедрить помощник `imsg` в Messages.app. Именно это открывает уведомления о прочтении, индикаторы набора, расширенную отправку, редактирование, отмену отправки, ответы в ветках, tapback-реакции и управление группами.
- Сборки Linux могут просматривать скопированный `chat.db`, но не могут отправлять сообщения, отслеживать живую базу данных Mac или управлять Messages.app. Для OpenClaw iMessage запускайте `imsg` на Mac, где выполнен вход, или через SSH-обертку к этому Mac.

## Перед началом

1. Установите `imsg` на Mac, где запущен Messages.app:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   Если `imsg chats` завершается с ошибкой `unable to open database file`, пустым выводом или `authorization denied`, предоставьте Full Disk Access терминалу, редактору, процессу Node, службе Gateway или родительскому SSH-процессу, который запускает `imsg`, затем перезапустите этот родительский процесс.

2. Проверьте поверхности чтения, наблюдения, отправки и RPC перед изменением конфигурации OpenClaw:

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   Замените `42` на реальный идентификатор чата из `imsg chats`. Для отправки требуется разрешение Automation для Messages.app. Если OpenClaw будет работать через SSH, выполните эти команды через ту же SSH-обертку или в том же пользовательском контексте, который будет использовать OpenClaw. Если чтение и проверки работают, но отправка завершается ошибкой AppleEvents `-1743`, проверьте, не было ли разрешение Automation назначено `/usr/libexec/sshd-keygen-wrapper`; см. [Отправка через SSH-обертку завершается ошибкой AppleEvents -1743](/ru/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

3. Включите мост приватного API, если нужны расширенные действия:

   ```bash
   imsg launch
   imsg status --json
   ```

   Для `imsg launch` требуется отключенный SIP. Базовая отправка, история и наблюдение работают без `imsg launch`; расширенные действия — нет.

4. После добавления включенной конфигурации `channels.imessage` проверьте мост через OpenClaw:

   ```bash
   openclaw channels status --probe
   ```

   Вам нужно `imessage.privateApi.available: true`. Если отображается `false`, сначала исправьте это — см. [Обнаружение возможностей](/ru/channels/imessage#private-api-actions). `channels status --probe` проверяет только настроенные и включенные учетные записи.

5. Сделайте снимок конфигурации:

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## Перенос конфигурации

iMessage и BlueBubbles имеют много общих настроек уровня канала. Изменяющиеся ключи в основном относятся к транспорту (REST-сервер против локального CLI). Ключи поведения (`dmPolicy`, `groupPolicy`, `allowFrom` и т. д.) сохраняют тот же смысл.

| BlueBubbles                                                | встроенный iMessage                       | Примечания                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | Та же семантика.                                                                                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.serverUrl`                           | _(удалено)_                               | REST-сервера нет — Plugin запускает `imsg rpc` через stdio.                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.password`                            | _(удалено)_                               | Аутентификация Webhook не требуется.                                                                                                                                                                                                                                                                                                                                                |
| _(неявно)_                                                 | `channels.imessage.cliPath`               | Путь к `imsg` (по умолчанию `imsg`); используйте скрипт-обертку для SSH.                                                                                                                                                                                                                                                                                                            |
| _(неявно)_                                                 | `channels.imessage.dbPath`                | Необязательное переопределение Messages.app `chat.db`; автоматически определяется, если не указано.                                                                                                                                                                                                                                                                                 |
| _(неявно)_                                                 | `channels.imessage.remoteHost`            | `host` или `user@host` — требуется только когда `cliPath` является SSH-оберткой и нужны загрузки вложений через SCP.                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | Те же значения (`pairing` / `allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | Одобрения сопряжения переносятся по handle, а не по токену.                                                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | Те же значения (`allowlist` / `open` / `disabled`).                                                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | То же самое.                                                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **Скопируйте это дословно, включая любую wildcard-запись `groups: { "*": { ... } }`.** Групповые `requireMention`, `tools`, `toolsBySender` переносятся. При `groupPolicy: "allowlist"` пустой или отсутствующий блок `groups` без предупреждения отбрасывает каждое групповое сообщение — см. «Ловушка реестра групп» ниже.                                                        |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | По умолчанию `true`. Со встроенным Plugin это срабатывает только когда активна проверка private API.                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | Та же форма, **так же отключено по умолчанию**. Если у вас вложения передавались в BlueBubbles, нужно явно заново задать это в блоке iMessage — неявно это не переносится, и входящие фото/медиа будут без предупреждения отбрасываться без строки журнала `Inbound message`, пока вы этого не сделаете.                                                                             |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | Локальные корни; те же правила wildcard.                                                                                                                                                                                                                                                                                                                                            |
| _(Н/Д)_                                                    | `channels.imessage.remoteAttachmentRoots` | Используется только когда `remoteHost` задан для загрузок через SCP.                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | По умолчанию 16 MB в iMessage (в BlueBubbles было 8 MB). Задайте явно, если хотите сохранить более низкий лимит.                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | По умолчанию 4000 в обоих случаях.                                                                                                                                                                                                                                                                                                                                                  |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | То же включение по желанию. Только для личных сообщений — групповые чаты в обоих каналах сохраняют мгновенную отправку каждого сообщения. Расширяет стандартную задержку входящих сообщений до 7000 мс, если включено без явного `messages.inbound.byChannel.imessage` или глобального `messages.inbound.debounceMs`. См. [документацию iMessage § Объединение разделенных отправок личных сообщений](/ru/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition). |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _(Н/Д)_                                   | iMessage уже считывает отображаемые имена отправителей из `chat.db`.                                                                                                                                                                                                                                                                                                                |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | Переключатели для отдельных действий: `reactions`, `edit`, `unsend`, `reply`, `sendWithEffect`, `renameGroup`, `setGroupIcon`, `addParticipant`, `removeParticipant`, `leaveGroup`, `sendAttachment`.                                                                                                                                                                               |

Конфигурации с несколькими учетными записями (`channels.bluebubbles.accounts.*`) переводятся один к одному в `channels.imessage.accounts.*`.

## Ловушка реестра групп

Встроенный Plugin iMessage запускает **два** отдельных шлюза allowlist для групп подряд. Оба должны пройти, чтобы групповое сообщение дошло до агента:

1. **Allowlist отправителей / целевых чатов** (`channels.imessage.groupAllowFrom`) — проверяется `isAllowedIMessageSender`. Сопоставляет входящие сообщения по handle отправителя, `chat_guid`, `chat_identifier` или `chat_id`. Та же форма, что и в BlueBubbles.
2. **Реестр групп** (`channels.imessage.groups`) — проверяется `resolveChannelGroupPolicy` из `inbound-processing.ts:199`. При `groupPolicy: "allowlist"` этот шлюз требует одно из следующего:
   - wildcard-запись `groups: { "*": { ... } }` (задает `allowAll = true`), или
   - явную запись для конкретного `chat_id` в `groups`.

Если шлюз 1 проходит, а шлюз 2 не проходит, сообщение отбрасывается. Plugin выводит два сигнала уровня `warn`, так что на стандартном уровне журналирования это больше не происходит молча:

- Одноразовый `warn` при запуске для каждой учетной записи, когда задано `groupPolicy: "allowlist"`, но `channels.imessage.groups` пустой (нет wildcard `"*"`, нет записей для отдельных `chat_id`) — срабатывает до поступления любых сообщений.
- Одноразовый `warn` для каждого `chat_id` при первом отбрасывании конкретной группы во время выполнения, с указанием chat_id и точного ключа, который нужно добавить в `groups`, чтобы разрешить ее.

DM продолжают работать, потому что проходят по другому пути кода.

Это самый распространенный сценарий сбоя миграции BlueBubbles → встроенный iMessage: операторы копируют `groupAllowFrom` и `groupPolicy`, но пропускают блок `groups`, потому что `groups: { "*": { "requireMention": true } }` в BlueBubbles выглядит как несвязанная настройка упоминаний. На самом деле она критична для проверки реестра.

Минимальная конфигурация, чтобы сообщения в группах продолжали проходить после `groupPolicy: "allowlist"`:

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

`requireMention: true` под `*` безвреден, если шаблоны упоминаний не настроены: runtime устанавливает `canDetectMention = false` и досрочно обходит отбрасывание по упоминанию в `inbound-processing.ts:512`. Если шаблоны упоминаний настроены (`agents.list[].groupChat.mentionPatterns`), это работает ожидаемым образом.

Если в логах gateway есть `imessage: dropping group message from chat_id=<id>` или строка запуска `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`, значит отбрасывает проверка 2 — добавьте блок `groups`.

## Пошагово

1. Добавьте блок iMessage рядом с существующим блоком BlueBubbles. Держите его отключенным, пока Gateway все еще маршрутизирует трафик BlueBubbles:

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

2. **Проверьте до того, как трафик станет важен** — остановите Gateway, временно включите блок iMessage и убедитесь через CLI, что iMessage сообщает о работоспособности:

   ```bash
   openclaw gateway stop
   # edit config: channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # expect imessage.privateApi.available: true
   ```

   `channels status --probe` проверяет только настроенные и включенные аккаунты. Не перезапускайте Gateway с одновременно включенными BlueBubbles и iMessage, если вы не хотите намеренно запустить оба монитора каналов. Если вы не переключаетесь немедленно, перед перезапуском Gateway снова установите `channels.imessage.enabled` в `false`. Используйте прямые команды `imsg` из раздела [Перед началом](#before-you-start), чтобы проверить Mac перед включением трафика OpenClaw.

3. **Переключитесь.** Когда включенный аккаунт iMessage сообщает о работоспособности, удалите конфигурацию BlueBubbles и оставьте iMessage включенным:

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   Перезапустите gateway. Входящий трафик iMessage теперь проходит через встроенный Plugin.

4. **Проверьте DM.** Отправьте агенту личное сообщение; убедитесь, что ответ доставлен.

5. **Проверьте группы отдельно.** DM и группы проходят по разным путям кода — успешная работа DM не доказывает, что группы маршрутизируются. Отправьте агенту сообщение в сопряженном групповом чате и убедитесь, что ответ доставлен. Если группа замолкает (нет ответа агента, нет ошибки), проверьте лог gateway на `imessage: dropping group message from chat_id=<id>` или строку запуска `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` — обе появляются на стандартном уровне логирования. Если появляется любая из них, ваш блок `groups` отсутствует или пуст — см. «Ловушка реестра групп» выше.

6. **Проверьте поверхность действий** — из сопряженного DM попросите агента поставить реакцию, отредактировать, отменить отправку, ответить, отправить фотографию и (в группе) переименовать группу / добавить или удалить участника. Каждое действие должно нативно примениться в Messages.app. Если любое из них выдает "iMessage `<action>` requires the imsg private API bridge", снова выполните `imsg launch` и обновите `channels status --probe`.

7. **Удалите сервер и конфигурацию BlueBubbles**, когда DM, группы и действия iMessage будут проверены. OpenClaw не будет использовать `channels.bluebubbles`.

## Краткий обзор паритета действий

| Действие                                            | устаревший BlueBubbles               | встроенный iMessage                                                            |
| --------------------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------ |
| Отправка текста / резервная отправка SMS            | ✅                                   | ✅                                                                             |
| Отправка медиа (фото, видео, файл, голос)           | ✅                                   | ✅                                                                             |
| Ответ в ветке (`reply_to_guid`)                     | ✅                                   | ✅ (закрывает [#51892](https://github.com/openclaw/openclaw/issues/51892))     |
| Tapback (`react`)                                   | ✅                                   | ✅                                                                             |
| Редактирование / отмена отправки (получатели macOS 13+) | ✅                               | ✅                                                                             |
| Отправка с экранным эффектом                        | ✅                                   | ✅ (закрывает часть [#9394](https://github.com/openclaw/openclaw/issues/9394)) |
| Жирный / курсив / подчеркивание / зачеркивание в форматированном тексте | ✅                 | ✅ (форматирование типизированными фрагментами через attributedBody)           |
| Переименование группы / установка иконки группы     | ✅                                   | ✅                                                                             |
| Добавление / удаление участника, выход из группы    | ✅                                   | ✅                                                                             |
| Отчеты о прочтении и индикатор набора               | ✅                                   | ✅ (зависит от проверки private API)                                           |
| Объединение DM от одного отправителя                | ✅                                   | ✅ (только DM; включается через `channels.imessage.coalesceSameSenderDms`)      |
| Восстановление входящих после перезапуска           | ✅ (повтор webhook + загрузка истории) | ✅ (автоматически: повтор пропущенных через since_rowid + дедупликация; более широкое окно локально) |

iMessage восстанавливает сообщения, пропущенные во время простоя gateway: при запуске он повторяет с последнего отправленного rowid через `imsg watch.subscribe` `since_rowid` и дедуплицирует по GUID, а ограничение возраста устаревшего бэклога подавляет «взрыв бэклога» от Push-flush. Это работает через RPC-соединение `imsg`, поэтому подходит и для удаленных настроек SSH `cliPath`; локальные настройки получают более широкое окно восстановления, потому что могут читать `chat.db`. См. [Восстановление входящих после перезапуска bridge или gateway](/ru/channels/imessage#inbound-recovery-after-a-bridge-or-gateway-restart).

## Сопряжение, сессии и привязки ACP

- **Подтверждения сопряжения** переносятся по handle. Вам не нужно заново подтверждать известных отправителей — `channels.imessage.allowFrom` распознает те же строки `+15555550123` / `user@example.com`, которые использовал BlueBubbles.
- **Сессии** остаются ограниченными парой агент + чат. DM сворачиваются в основную сессию агента при стандартном `session.dmScope=main`; групповые сессии остаются изолированными по `chat_id`. Ключи сессий отличаются (`agent:<id>:imessage:group:<chat_id>` и эквивалент BlueBubbles) — старая история разговоров под ключами сессий BlueBubbles не переносится в сессии iMessage.
- **Привязки ACP**, ссылающиеся на `match.channel: "bluebubbles"`, нужно обновить на `"imessage"`. Формы `match.peer.id` (`chat_id:`, `chat_guid:`, `chat_identifier:`, простой handle) идентичны.

## Канала отката нет

Поддерживаемого runtime BlueBubbles, на который можно переключиться обратно, нет. Если проверка iMessage не проходит, установите `channels.imessage.enabled: false`, перезапустите Gateway, исправьте блокер `imsg` и повторите переключение.

Кэш ответов хранится в состоянии Plugin в SQLite. `openclaw doctor --fix` импортирует и архивирует старый sidecar `imessage/reply-cache.jsonl`, если он присутствует.

## См. также

- [Удаление BlueBubbles и путь iMessage через imsg](/ru/announcements/bluebubbles-imessage) — краткое объявление и сводка для операторов.
- [iMessage](/ru/channels/imessage) — полный справочник канала iMessage, включая настройку `imsg launch` и обнаружение возможностей.
- `/channels/bluebubbles` — устаревший URL, который перенаправляет на это руководство по миграции.
- [Сопряжение](/ru/channels/pairing) — аутентификация DM и поток сопряжения.
- [Маршрутизация каналов](/ru/channels/channel-routing) — как gateway выбирает канал для исходящих ответов.
