---
read_when:
    - Налаштування контролю доступу до прямих повідомлень
    - Створення пари з новим вузлом iOS/Android
    - Огляд стану безпеки OpenClaw
summary: 'Огляд сполучення: схваліть, хто може писати вам у приватні повідомлення + які вузли можуть приєднатися'
title: Сполучення
x-i18n:
    generated_at: "2026-05-06T16:00:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcee04ae47bf28caa76c5f6e7218e8b1b24f9ee70bc1b7b65d3f8859797a4645
    source_path: channels/pairing.md
    workflow: 16
---

"Pairing" — це явний крок підтвердження доступу в OpenClaw.
Він використовується у двох місцях:

1. **DM pairing** (кому дозволено спілкуватися з ботом)
2. **Node pairing** (яким пристроям/вузлам дозволено приєднуватися до мережі Gateway)

Контекст безпеки: [Безпека](/uk/gateway/security)

## 1) DM pairing (доступ вхідного чату)

Коли канал налаштовано з політикою DM `pairing`, невідомі відправники отримують короткий код, а їхнє повідомлення **не обробляється**, доки ви його не схвалите.

Стандартні політики DM задокументовано тут: [Безпека](/uk/gateway/security)

`dmPolicy: "open"` є публічною лише тоді, коли ефективний список дозволених DM містить `"*"`.
Налаштування й перевірка вимагають цього wildcard для публічних відкритих конфігурацій. Якщо наявний
стан містить `open` із конкретними записами `allowFrom`, під час виконання все одно допускаються
лише ці відправники, а схвалення в сховищі pairing не розширюють доступ `open`.

Коди pairing:

- 8 символів, у верхньому регістрі, без неоднозначних символів (`0O1I`).
- **Закінчуються через 1 годину**. Бот надсилає повідомлення pairing лише під час створення нового запиту (приблизно раз на годину для кожного відправника).
- Очікувані запити DM pairing за замовчуванням обмежені **3 на канал**; додаткові запити ігноруються, доки один із них не закінчиться або не буде схвалений.

### Схвалити відправника

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Якщо власника команд ще не налаштовано, схвалення коду DM pairing також початково налаштовує
`commands.ownerAllowFrom` на схваленого відправника, наприклад `telegram:123456789`.
Це дає первинним налаштуванням явного власника для привілейованих команд і запитів
схвалення exec. Після появи власника подальші схвалення pairing надають лише доступ
DM; вони не додають інших власників.

Підтримувані канали: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Багаторазові групи відправників

Використовуйте верхньорівневі `accessGroups`, коли той самий набір довірених відправників має застосовуватися до
кількох каналів повідомлень або одночасно до списків дозволених DM і груп.

Статичні групи використовують `type: "message.senders"` і в списках дозволених каналів посилаються як
`accessGroup:<name>`:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

Групи доступу докладно задокументовано тут: [Групи доступу](/uk/channels/access-groups)

### Де зберігається стан

Зберігається в `~/.openclaw/credentials/`:

- Очікувані запити: `<channel>-pairing.json`
- Сховище схваленого списку дозволених:
  - Стандартний обліковий запис: `<channel>-allowFrom.json`
  - Нестандартний обліковий запис: `<channel>-<accountId>-allowFrom.json`

Поведінка області дії облікового запису:

- Нестандартні облікові записи читають/записують лише свій файл списку дозволених з областю дії.
- Стандартний обліковий запис використовує файл списку дозволених каналу без області дії.

Ставтеся до них як до чутливих даних (вони контролюють доступ до вашого асистента).

<Note>
Сховище списку дозволених pairing призначене для доступу DM. Авторизація груп окрема.
Схвалення коду DM pairing не дозволяє автоматично цьому відправнику запускати групові
команди або керувати ботом у групах. Первинне налаштування першого власника є окремим станом конфігурації
в `commands.ownerAllowFrom`, а доставка групових чатів і далі відповідає
спискам дозволених груп каналу (наприклад `groupAllowFrom`, `groups` або перевизначенням
для окремих груп чи тем, залежно від каналу).
</Note>

## 2) Node device pairing (вузли iOS/Android/macOS/headless)

Вузли підключаються до Gateway як **пристрої** з `role: node`. Gateway
створює запит device pairing, який потрібно схвалити.

### Pair через Telegram (рекомендовано для iOS)

Якщо ви використовуєте Plugin `device-pair`, ви можете виконати первинний device pairing повністю з Telegram:

1. У Telegram надішліть боту повідомлення: `/pair`
2. Бот відповість двома повідомленнями: повідомленням з інструкціями та окремим повідомленням із **кодом налаштування** (його легко копіювати/вставляти в Telegram).
3. На телефоні відкрийте застосунок OpenClaw для iOS → Settings → Gateway.
4. Відскануйте QR-код або вставте код налаштування й підключіться.
5. Назад у Telegram: `/pair pending` (перегляньте ідентифікатори запитів, роль і області дії), потім схваліть.

Код налаштування — це JSON payload у кодуванні base64, який містить:

- `url`: URL WebSocket для Gateway (`ws://...` або `wss://...`)
- `bootstrapToken`: короткоживучий bootstrap token для одного пристрою, який використовується для початкового pairing handshake

Цей bootstrap token має вбудований pairing bootstrap profile:

- основний переданий токен `node` залишається з `scopes: []`
- будь-який переданий токен `operator` залишається обмеженим bootstrap allowlist:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- перевірки bootstrap scope мають префікс ролі, а не є одним плоским пулом scope:
  записи operator scope задовольняють лише operator requests, а ролі не-operator
  все одно мають запитувати scopes під власним префіксом ролі
- подальша ротація/відкликання токенів залишається обмеженою як схваленим
  рольовим контрактом пристрою, так і operator scopes сесії виклику

Ставтеся до коду налаштування як до пароля, доки він чинний.

Для Tailscale, публічного або іншого віддаленого mobile pairing використовуйте Tailscale Serve/Funnel
або інший URL Gateway `wss://`. Текстові коди налаштування `ws://` приймаються лише
для loopback, приватних LAN-адрес, хостів Bonjour `.local` і хоста емулятора
Android. Адреси tailnet CGNAT, імена `.ts.net` і публічні хости все одно
закриваються з помилкою до видачі QR/setup-code.

### Схвалити пристрій-вузол

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Коли явне схвалення відхилено, бо сесію схвалювального paired-device
було відкрито лише з pairing-only scope, CLI повторює той самий запит із
`operator.admin`. Це дає наявному admin-capable paired device змогу відновити новий
Control UI/browser pairing без ручного редагування `devices/paired.json`. Gateway
все одно перевіряє повторне підключення; токени, які не можуть автентифікуватися
з `operator.admin`, залишаються заблокованими.

Якщо той самий пристрій повторює спробу з іншими даними автентифікації (наприклад іншими
role/scopes/public key), попередній очікуваний запит замінюється й створюється новий
`requestId`.

<Note>
Уже спарений пристрій не отримує ширшого доступу непомітно. Якщо він повторно підключається із запитом на більше scopes або ширшу роль, OpenClaw зберігає наявне схвалення без змін і створює новий очікуваний запит на підвищення доступу. Використовуйте `openclaw devices list`, щоб порівняти поточний схвалений доступ із новим запитаним доступом перед схваленням.
</Note>

### Необов’язкове автоcхвалення вузлів із довірених CIDR

Device pairing за замовчуванням залишається ручним. Для жорстко контрольованих мереж вузлів
можна ввімкнути автоcхвалення першого node із явними CIDR або точними IP:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Це застосовується лише до нових запитів pairing `role: node` без запитаних
scopes. Operator, browser, Control UI і WebChat clients усе одно потребують ручного
схвалення. Зміни role, scope, metadata і public-key також потребують ручного
схвалення.

### Сховище стану Node pairing

Зберігається в `~/.openclaw/devices/`:

- `pending.json` (короткоживучий; очікувані запити закінчуються)
- `paired.json` (спарені пристрої + токени)

### Примітки

- Застарілий API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) є
  окремим сховищем pairing, яким володіє gateway. WS nodes усе одно потребують device pairing.
- Запис pairing є довговічним джерелом істини для схвалених ролей. Активні
  device tokens залишаються обмеженими цим схваленим набором ролей; випадковий запис токена
  поза схваленими ролями не створює нового доступу.

## Пов’язана документація

- Модель безпеки + prompt injection: [Безпека](/uk/gateway/security)
- Безпечне оновлення (запустіть doctor): [Оновлення](/uk/install/updating)
- Конфігурації каналів:
  - Telegram: [Telegram](/uk/channels/telegram)
  - WhatsApp: [WhatsApp](/uk/channels/whatsapp)
  - Signal: [Signal](/uk/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/uk/channels/bluebubbles)
  - iMessage (застаріле): [iMessage](/uk/channels/imessage)
  - Discord: [Discord](/uk/channels/discord)
  - Slack: [Slack](/uk/channels/slack)
