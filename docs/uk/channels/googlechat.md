---
read_when:
    - Робота над функціями каналу Google Chat
summary: Стан підтримки застосунку Google Chat, можливості та конфігурація
title: Google Chat
x-i18n:
    generated_at: "2026-04-23T20:43:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 15
---

Стан: готово для особистих повідомлень і просторів через Webhook Google Chat API (лише HTTP).

## Швидке налаштування (для початківців)

1. Створіть проєкт Google Cloud і ввімкніть **Google Chat API**.
   - Перейдіть сюди: [Облікові дані Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Увімкніть API, якщо його ще не ввімкнено.
2. Створіть **Service Account**:
   - Натисніть **Create Credentials** > **Service Account**.
   - Назвіть його як завгодно (наприклад, `openclaw-chat`).
   - Залиште дозволи порожніми (натисніть **Continue**).
   - Залиште список принципалів із доступом порожнім (натисніть **Done**).
3. Створіть і завантажте **JSON Key**:
   - У списку Service Account натисніть на щойно створений запис.
   - Перейдіть на вкладку **Keys**.
   - Натисніть **Add Key** > **Create new key**.
   - Виберіть **JSON** і натисніть **Create**.
4. Збережіть завантажений JSON-файл на хості вашого gateway (наприклад, `~/.openclaw/googlechat-service-account.json`).
5. Створіть застосунок Google Chat у [налаштуваннях Chat у Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Заповніть **Application info**:
     - **App name**: (наприклад, `OpenClaw`)
     - **Avatar URL**: (наприклад, `https://openclaw.ai/logo.png`)
     - **Description**: (наприклад, `Personal AI Assistant`)
   - Увімкніть **Interactive features**.
   - У розділі **Functionality** позначте **Join spaces and group conversations**.
   - У розділі **Connection settings** виберіть **HTTP endpoint URL**.
   - У розділі **Triggers** виберіть **Use a common HTTP endpoint URL for all triggers** і встановіть значення як публічну URL-адресу вашого gateway з доданим `/googlechat`.
     - _Порада: запустіть `openclaw status`, щоб знайти публічну URL-адресу вашого gateway._
   - У розділі **Visibility** позначте **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Введіть свою адресу електронної пошти (наприклад, `user@example.com`) у текстове поле.
   - Натисніть **Save** внизу сторінки.
6. **Увімкніть статус застосунку**:
   - Після збереження **оновіть сторінку**.
   - Знайдіть розділ **App status** (зазвичай ближче до верху або низу сторінки після збереження).
   - Змініть статус на **Live - available to users**.
   - Ще раз натисніть **Save**.
7. Налаштуйте OpenClaw із шляхом до Service Account і аудиторією Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Або config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Установіть тип і значення аудиторії Webhook (має відповідати конфігурації вашого застосунку Chat).
9. Запустіть gateway. Google Chat надсилатиме POST-запити на ваш шлях Webhook.

## Додавання до Google Chat

Щойно gateway запущено і вашу адресу електронної пошти додано до списку видимості:

1. Перейдіть у [Google Chat](https://chat.google.com/).
2. Натисніть значок **+** (плюс) поруч із **Direct Messages**.
3. У рядку пошуку (де ви зазвичай додаєте людей) введіть **App name**, яке ви налаштували в Google Cloud Console.
   - **Примітка**: бот _не_ з’явиться у списку перегляду "Marketplace", оскільки це приватний застосунок. Його потрібно шукати за назвою.
4. Виберіть свого бота з результатів.
5. Натисніть **Add** або **Chat**, щоб почати розмову 1:1.
6. Надішліть "Hello", щоб активувати помічника!

## Публічна URL-адреса (лише Webhook)

Webhook Google Chat вимагають публічної HTTPS-адреси. З міркувань безпеки **відкривайте в інтернет лише шлях `/googlechat`**. Залишайте панель OpenClaw та інші чутливі кінцеві точки у приватній мережі.

### Варіант A: Tailscale Funnel (рекомендовано)

Використовуйте Tailscale Serve для приватної панелі та Funnel для публічного шляху Webhook. Це дозволяє тримати `/` приватним, відкриваючи назовні лише `/googlechat`.

1. **Перевірте, до якої адреси прив’язаний ваш gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Зверніть увагу на IP-адресу (наприклад, `127.0.0.1`, `0.0.0.0` або вашу адресу Tailscale, як-от `100.x.x.x`).

2. **Відкрийте панель лише для tailnet (порт 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Публічно відкрийте лише шлях Webhook:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Авторизуйте вузол для доступу через Funnel:**
   Якщо з’явиться запит, перейдіть за URL-адресою авторизації, показаною у виводі, щоб увімкнути Funnel для цього вузла у вашій політиці tailnet.

5. **Перевірте конфігурацію:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Ваша публічна URL-адреса Webhook буде:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Ваша приватна панель залишиться доступною лише в tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Використовуйте публічну URL-адресу (без `:8443`) у конфігурації застосунку Google Chat.

> Примітка: ця конфігурація зберігається після перезавантаження. Щоб видалити її пізніше, виконайте `tailscale funnel reset` і `tailscale serve reset`.

### Варіант B: Зворотний проксі (Caddy)

Якщо ви використовуєте зворотний проксі, як-от Caddy, проксіюйте лише конкретний шлях:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

З цією конфігурацією будь-який запит до `your-domain.com/` буде проігноровано або поверне 404, тоді як `your-domain.com/googlechat` безпечно маршрутизуватиметься до OpenClaw.

### Варіант C: Cloudflare Tunnel

Налаштуйте правила ingress вашого тунелю так, щоб маршрутизувався лише шлях Webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Як це працює

1. Google Chat надсилає POST-запити Webhook до gateway. Кожен запит містить заголовок `Authorization: Bearer <token>`.
   - OpenClaw перевіряє bearer-автентифікацію до читання/розбору повних тіл Webhook, якщо цей заголовок присутній.
   - Запити Google Workspace Add-on, які містять `authorizationEventObject.systemIdToken` у тілі, підтримуються через суворіший бюджет тіла перед автентифікацією.
2. OpenClaw перевіряє токен відповідно до налаштованих `audienceType` і `audience`:
   - `audienceType: "app-url"` → аудиторія — це ваша HTTPS URL-адреса Webhook.
   - `audienceType: "project-number"` → аудиторія — це номер Cloud-проєкту.
3. Повідомлення маршрутизуються за простором:
   - Для особистих повідомлень використовується ключ сесії `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Для просторів використовується ключ сесії `agent:<agentId>:googlechat:group:<spaceId>`.
4. Доступ до особистих повідомлень типово працює через pairing. Невідомі відправники отримують код pairing; схваліть його командою:
   - `openclaw pairing approve googlechat <code>`
5. Для групових просторів типово потрібна @-згадка. Використовуйте `botUser`, якщо для виявлення згадки потрібне ім’я користувача застосунку.

## Цілі

Використовуйте ці ідентифікатори для доставки та списків дозволу:

- Особисті повідомлення: `users/<userId>` (рекомендовано).
- Сира адреса електронної пошти `name@example.com` є змінною і використовується лише для прямого зіставлення у списку дозволу, коли `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Застаріле: `users/<email>` обробляється як id користувача, а не як список дозволу за електронною поштою.
- Простори: `spaces/<spaceId>`.

## Основні моменти конфігурації

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          allow: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Примітки:

- Облікові дані Service Account також можна передати вбудовано через `serviceAccount` (рядок JSON).
- Також підтримується `serviceAccountRef` (SecretRef env/file), зокрема посилання для окремих облікових записів у `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Типовий шлях Webhook — `/googlechat`, якщо `webhookPath` не встановлено.
- `dangerouslyAllowNameMatching` знову вмикає зіставлення зі змінними email-принципалами для списків дозволу (аварійний режим сумісності).
- Реакції доступні через інструмент `reactions` і `channels action`, коли ввімкнено `actions.reactions`.
- Дії з повідомленнями надають `send` для тексту і `upload-file` для явного надсилання вкладень. `upload-file` приймає `media` / `filePath` / `path`, а також необов’язкові `message`, `filename` і націлювання на потік.
- `typingIndicator` підтримує `none`, `message` (типово) і `reaction` (для reaction потрібен OAuth користувача).
- Вкладення завантажуються через Chat API і зберігаються в медіапайплайні (розмір обмежується через `mediaMaxMb`).

Докладно про посилання на секрети: [Керування секретами](/uk/gateway/secrets).

## Усунення неполадок

### 405 Method Not Allowed

Якщо Google Cloud Logs Explorer показує помилки на кшталт:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Це означає, що обробник Webhook не зареєстрований. Поширені причини:

1. **Канал не налаштовано**: у вашій конфігурації відсутній розділ `channels.googlechat`. Перевірте так:

   ```bash
   openclaw config get channels.googlechat
   ```

   Якщо повертається "Config path not found", додайте конфігурацію (див. [Основні моменти конфігурації](#config-highlights)).

2. **Plugin не ввімкнено**: перевірте стан Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Якщо показано "disabled", додайте `plugins.entries.googlechat.enabled: true` у вашу конфігурацію.

3. **Gateway не перезапущено**: після додавання конфігурації перезапустіть gateway:

   ```bash
   openclaw gateway restart
   ```

Переконайтеся, що канал запущено:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Інші проблеми

- Перевірте `openclaw channels status --probe` на наявність помилок автентифікації або відсутньої конфігурації audience.
- Якщо повідомлення не надходять, підтвердьте URL-адресу Webhook і підписки на події у застосунку Chat.
- Якщо обмеження за згадками блокує відповіді, встановіть `botUser` як назву ресурсу користувача застосунку та перевірте `requireMention`.
- Використовуйте `openclaw logs --follow`, надсилаючи тестове повідомлення, щоб побачити, чи доходять запити до gateway.

Пов’язані документи:

- [Конфігурація Gateway](/uk/gateway/configuration)
- [Безпека](/uk/gateway/security)
- [Reactions](/uk/tools/reactions)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація особистих повідомлень і процес pairing
- [Groups](/uk/channels/groups) — поведінка групового чату та обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
