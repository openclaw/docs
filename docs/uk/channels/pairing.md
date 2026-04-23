---
read_when:
    - Налаштування керування доступом до DM
    - Підключення нового Node iOS/Android через Pairing
    - Огляд моделі безпеки OpenClaw
summary: 'Огляд Pairing: схвалення того, хто може надсилати вам DM, і того, які Node можуть приєднуватися'
title: Pairing
x-i18n:
    generated_at: "2026-04-23T20:44:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 373eaa02865995ada0c906df9bad4e8328f085a8bb3679b0a5820dc397130137
    source_path: channels/pairing.md
    workflow: 15
---

«Pairing» в OpenClaw — це явний етап **схвалення власником**.
Він використовується у двох місцях:

1. **DM pairing** (кому дозволено спілкуватися з ботом)
2. **Node pairing** (яким пристроям/Node дозволено приєднуватися до мережі gateway)

Контекст безпеки: [Безпека](/uk/gateway/security)

## 1) DM pairing (вхідний доступ через чат)

Коли канал налаштовано з DM policy `pairing`, невідомі відправники отримують короткий код, а їхнє повідомлення **не обробляється**, доки ви його не схвалите.

Стандартні DM policy задокументовано тут: [Безпека](/uk/gateway/security)

Коди pairing:

- 8 символів, великі літери, без неоднозначних символів (`0O1I`).
- **Спливають через 1 годину**. Бот надсилає повідомлення pairing лише тоді, коли створюється новий запит (приблизно раз на годину для кожного відправника).
- Кількість очікуваних запитів на DM pairing за замовчуванням обмежена **3 на канал**; додаткові запити ігноруються, доки один із них не спливе або не буде схвалений.

### Схвалення відправника

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Підтримувані канали: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Де зберігається стан

Зберігається в `~/.openclaw/credentials/`:

- Очікувані запити: `<channel>-pairing.json`
- Сховище схваленого allowlist:
  - Обліковий запис за замовчуванням: `<channel>-allowFrom.json`
  - Неосновний обліковий запис: `<channel>-<accountId>-allowFrom.json`

Поведінка обмеження за обліковим записом:

- Неосновні облікові записи читають і записують лише свій обмежений файл allowlist.
- Основний обліковий запис використовує не обмежений обліковим записом файл allowlist на рівні каналу.

Вважайте ці дані чутливими (вони керують доступом до вашого помічника).

Важливо: це сховище призначене для доступу через DM. Авторизація груп є окремою.
Схвалення коду DM pairing не надає автоматично цьому відправникові права запускати групові команди або керувати ботом у групах. Для доступу до груп налаштуйте явні групові allowlist каналу (наприклад, `groupAllowFrom`, `groups` або перевизначення для групи/теми залежно від каналу).

## 2) Pairing пристроїв Node (вузли iOS/Android/macOS/headless)

Node підключаються до Gateway як **пристрої** з `role: node`. Gateway
створює запит на pairing пристрою, який потрібно схвалити.

### Pairing через Telegram (рекомендовано для iOS)

Якщо ви використовуєте plugin `device-pair`, ви можете виконати первинне pairing пристрою повністю з Telegram:

1. У Telegram надішліть боту: `/pair`
2. Бот відповість двома повідомленнями: повідомленням з інструкціями та окремим повідомленням із **кодом налаштування** (його зручно копіювати/вставляти в Telegram).
3. На телефоні відкрийте застосунок OpenClaw для iOS → Settings → Gateway.
4. Вставте код налаштування й підключіться.
5. Поверніться в Telegram: `/pair pending` (перегляньте ID запитів, роль і scope), потім схваліть.

Код налаштування — це JSON payload у base64-кодуванні, який містить:

- `url`: URL WebSocket Gateway (`ws://...` або `wss://...`)
- `bootstrapToken`: короткоживучий bootstrap token для одного пристрою, який використовується для початкового handshake pairing

Цей bootstrap token містить вбудований bootstrap profile pairing:

- основний переданий token `node` зберігає `scopes: []`
- будь-який переданий token `operator` залишається обмеженим bootstrap allowlist:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- перевірки bootstrap scope мають префікси ролей, а не один спільний пул scope:
  записи scope для operator задовольняють лише запити operator, а ролі, що не є operator,
  усе одно мають запитувати scope під префіксом власної ролі

Ставтеся до коду налаштування як до пароля, поки він чинний.

### Схвалення пристрою Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Якщо той самий пристрій повторює спробу з іншими даними автентифікації (наприклад, з іншими
role/scopes/public key), попередній очікуваний запит заміщується і створюється новий
`requestId`.

Важливо: уже paired пристрій не отримує ширший доступ безшумно. Якщо він
повторно підключається, запитуючи більше scope або ширшу роль, OpenClaw зберігає
наявне схвалення без змін і створює новий очікуваний запит на розширення. Використовуйте
`openclaw devices list`, щоб порівняти наразі схвалений доступ із новим
запитаним доступом, перш ніж схвалювати.

### Зберігання стану pairing Node

Зберігається в `~/.openclaw/devices/`:

- `pending.json` (короткоживучий; очікувані запити спливають)
- `paired.json` (paired пристрої + token-и)

### Примітки

- Застарілий API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) — це
  окреме сховище pairing, яким володіє gateway. WS Node усе одно потребують pairing пристрою.
- Запис pairing — це довготривале джерело істини для схвалених ролей. Активні
  token-и пристроїв залишаються обмеженими цим набором схвалених ролей; сторонній запис token
  поза межами схвалених ролей не створює нового доступу.

## Пов’язані документи

- Модель безпеки + prompt injection: [Безпека](/uk/gateway/security)
- Безпечне оновлення (запустіть doctor): [Оновлення](/uk/install/updating)
- Конфігурації каналів:
  - Telegram: [Telegram](/uk/channels/telegram)
  - WhatsApp: [WhatsApp](/uk/channels/whatsapp)
  - Signal: [Signal](/uk/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/uk/channels/bluebubbles)
  - iMessage (legacy): [iMessage](/uk/channels/imessage)
  - Discord: [Discord](/uk/channels/discord)
  - Slack: [Slack](/uk/channels/slack)
