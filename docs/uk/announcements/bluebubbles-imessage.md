---
read_when:
    - Ви використовували старий канал BlueBubbles і маєте перейти на iMessage
    - Ви вибираєте підтримуваний спосіб налаштування iMessage в OpenClaw
    - Вам потрібне коротке пояснення щодо видалення BlueBubbles
summary: Підтримку BlueBubbles було видалено з OpenClaw. Для нових і перенесених конфігурацій iMessage використовуйте вбудований плагін iMessage з imsg.
title: Видалення BlueBubbles і шлях imsg для iMessage
x-i18n:
    generated_at: "2026-07-12T12:57:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Видалення BlueBubbles і шлях iMessage через imsg

OpenClaw більше не постачається з каналом BlueBubbles. Підтримка iMessage працює через вбудований плагін `imessage`: Gateway запускає [`imsg`](https://github.com/steipete/imsg) як дочірній процес — локально або через обгортку SSH — і обмінюється з ним даними за протоколом JSON-RPC через stdin/stdout. Жодного сервера, Webhook чи порту.

Якщо ваша конфігурація досі містить `channels.bluebubbles`, перенесіть її до `channels.imessage`. Застаріла URL-адреса документації `/channels/bluebubbles` переспрямовує на сторінку [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles), де наведено повну таблицю перетворення конфігурації та контрольний список переходу.

## Що змінилося

- Підтримуваний шлях iMessage не використовує HTTP-сервер BlueBubbles, маршрут Webhook, пароль REST або середовище виконання плагіна BlueBubbles.
- OpenClaw читає та відстежує повідомлення через `imsg` на Mac, де виконано вхід у Messages.app.
- Базове надсилання, отримання, перегляд історії та робота з медіафайлами використовують звичайні інтерфейси `imsg` і дозволи macOS.
- Для розширених дій (відповідей у гілках, реакцій tapback, редагування, скасування надсилання, ефектів, сповіщень про прочитання, індикаторів набору тексту та керування групами) потрібен міст приватного API: виконайте `imsg launch`, для чого потрібно вимкнути SIP.
- Gateway на Linux і Windows усе ще можуть використовувати iMessage, якщо в `channels.imessage.cliPath` указати обгортку SSH, яка запускає `imsg` на Mac із виконаним входом.

## Що потрібно зробити

1. Установіть і перевірте `imsg` на Mac із Messages:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Надайте дозволи Full Disk Access і Automation контексту процесу, у якому виконуються `imsg` та OpenClaw.

3. Перетворіть стару конфігурацію:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Перезапустіть Gateway і виконайте перевірку:

   ```bash
   openclaw channels status --probe
   ```

5. Перш ніж видаляти старий сервер BlueBubbles, перевірте особисті повідомлення, групи, вкладення та всі дії приватного API, від яких ви залежите.

## Примітки щодо міграції

- `channels.bluebubbles.serverUrl` і `channels.bluebubbles.password` не мають відповідників в iMessage: немає сервера, до якого потрібно підключатися або на якому потрібно автентифікуватися.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` і `actions.*` зберігають своє значення в `channels.imessage`.
- `channels.imessage.includeAttachments` за замовчуванням усе ще вимкнено. Увімкніть його явно, якщо очікуєте, що вхідні фотографії, голосові повідомлення, відео або файли надходитимуть до агента.
- Якщо задано `groupPolicy: "allowlist"`, скопіюйте старий блок `groups`, включно з усіма записами з підстановним символом `"*"`. Списки дозволених відправників груп і реєстр груп є окремими перевірками: блок `groups` із записами, але без відповідного `chat_id` (або без `"*"`) відхиляє повідомлення під час виконання, а порожній блок `groups` реєструє попередження під час запуску, хоча фільтрування відправників усе одно пропускає повідомлення.
- У прив’язках ACP значення `match.channel: "bluebubbles"` потрібно змінити на `"imessage"`.
- Старі ключі сеансів BlueBubbles не стають ключами сеансів iMessage. Підтвердження сполучення прив’язуються до ідентифікаторів відправників, тому скопійовані записи `allowFrom` продовжують працювати, але історія розмов за ключами сеансів BlueBubbles не переноситься.

## Дивіться також

- [Перехід із BlueBubbles](/uk/channels/imessage-from-bluebubbles)
- [iMessage](/uk/channels/imessage)
- [Довідник із конфігурації — iMessage](/uk/gateway/config-channels#imessage)
