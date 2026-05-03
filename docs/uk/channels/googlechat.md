---
read_when:
    - Робота над функціями каналу Google Chat
summary: Стан підтримки застосунку Google Chat, можливості та конфігурація
title: Google Chat
x-i18n:
    generated_at: "2026-05-03T22:00:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: afa2ca4d9673396aa24a55ca5855a34ad26a4640c3a1f6928dbf7246e403cb04
    source_path: channels/googlechat.md
    workflow: 16
---

Стан: завантажуваний Plugin для DM і просторів через Webhook Google Chat API (лише HTTP).

## Встановлення

Встановіть Google Chat перед налаштуванням каналу:

```bash
openclaw plugins install @openclaw/googlechat
```

Локальна копія (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Швидке налаштування (для початківців)

1. Створіть проєкт Google Cloud і ввімкніть **Google Chat API**.
   - Перейдіть до: [Облікові дані Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Увімкніть API, якщо його ще не ввімкнено.
2. Створіть **Service Account**:
   - Натисніть **Create Credentials** > **Service Account**.
   - Назвіть його як завгодно (наприклад, `openclaw-chat`).
   - Залиште дозволи порожніми (натисніть **Continue**).
   - Залиште принципали з доступом порожніми (натисніть **Done**).
3. Створіть і завантажте **JSON Key**:
   - У списку service accounts натисніть на той, який ви щойно створили.
   - Перейдіть на вкладку **Keys**.
   - Натисніть **Add Key** > **Create new key**.
   - Виберіть **JSON** і натисніть **Create**.
4. Збережіть завантажений JSON-файл на хості вашого Gateway (наприклад, `~/.openclaw/googlechat-service-account.json`).
5. Створіть застосунок Google Chat у [налаштуваннях Chat у Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Заповніть **Application info**:
     - **App name**: (наприклад, `OpenClaw`)
     - **Avatar URL**: (наприклад, `https://openclaw.ai/logo.png`)
     - **Description**: (наприклад, `Personal AI Assistant`)
   - Увімкніть **Interactive features**.
   - У розділі **Functionality** позначте **Join spaces and group conversations**.
   - У розділі **Connection settings** виберіть **HTTP endpoint URL**.
   - У розділі **Triggers** виберіть **Use a common HTTP endpoint URL for all triggers** і встановіть його як публічну URL-адресу вашого Gateway з доданим `/googlechat`.
     - _Порада: запустіть `openclaw status`, щоб знайти публічну URL-адресу вашого Gateway._
   - У розділі **Visibility** позначте **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Введіть свою email-адресу (наприклад, `user@example.com`) у текстове поле.
   - Натисніть **Save** внизу.
6. **Увімкніть статус застосунку**:
   - Після збереження **оновіть сторінку**.
   - Знайдіть розділ **App status** (зазвичай він з’являється біля верху або низу після збереження).
   - Змініть статус на **Live - available to users**.
   - Знову натисніть **Save**.
7. Налаштуйте OpenClaw із шляхом до service account + аудиторією Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Або config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Встановіть тип і значення аудиторії Webhook (має відповідати конфігурації вашого застосунку Chat).
9. Запустіть Gateway. Google Chat надсилатиме POST-запити на шлях вашого Webhook.

## Додавання до Google Chat

Після запуску Gateway і додавання вашої email-адреси до списку видимості:

1. Перейдіть до [Google Chat](https://chat.google.com/).
2. Натисніть іконку **+** (плюс) поруч із **Direct Messages**.
3. У рядку пошуку (де ви зазвичай додаєте людей) введіть **App name**, налаштоване в Google Cloud Console.
   - **Примітка**: бот _не_ з’явиться в списку перегляду "Marketplace", оскільки це приватний застосунок. Його потрібно шукати за назвою.
4. Виберіть свого бота з результатів.
5. Натисніть **Add** або **Chat**, щоб почати розмову 1:1.
6. Надішліть "Hello", щоб запустити асистента!

## Публічна URL-адреса (лише Webhook)

Webhook Google Chat вимагають публічного HTTPS endpoint. Для безпеки **відкривайте в інтернет лише шлях `/googlechat`**. Залишайте панель OpenClaw та інші чутливі endpoint у приватній мережі.

### Варіант A: Tailscale Funnel (рекомендовано)

Використовуйте Tailscale Serve для приватної панелі й Funnel для публічного шляху Webhook. Це залишає `/` приватним, відкриваючи лише `/googlechat`.

1. **Перевірте, до якої адреси прив’язаний ваш Gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Занотуйте IP-адресу (наприклад, `127.0.0.1`, `0.0.0.0` або вашу Tailscale IP на кшталт `100.x.x.x`).

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

4. **Авторизуйте Node для доступу Funnel:**
   Якщо з’явиться запит, відкрийте URL авторизації, показану у виводі, щоб увімкнути Funnel для цього Node у політиці вашого tailnet.

5. **Перевірте конфігурацію:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Публічна URL-адреса вашого Webhook буде:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Ваша приватна панель залишається доступною лише в tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Використовуйте публічну URL-адресу (без `:8443`) у конфігурації застосунку Google Chat.

> Примітка: ця конфігурація зберігається після перезавантажень. Щоб видалити її пізніше, запустіть `tailscale funnel reset` і `tailscale serve reset`.

### Варіант B: Reverse Proxy (Caddy)

Якщо ви використовуєте Reverse Proxy на кшталт Caddy, проксіюйте лише конкретний шлях:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

З цією конфігурацією будь-який запит до `your-domain.com/` буде проігноровано або поверне 404, тоді як `your-domain.com/googlechat` безпечно маршрутизуватиметься до OpenClaw.

### Варіант C: Cloudflare Tunnel

Налаштуйте ingress-правила вашого тунелю так, щоб маршрутизувати лише шлях Webhook:

- **Шлях**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Правило за замовчуванням**: HTTP 404 (Not Found)

## Як це працює

1. Google Chat надсилає Webhook POST-запити до Gateway. Кожен запит містить заголовок `Authorization: Bearer <token>`.
   - OpenClaw перевіряє bearer-автентифікацію перед читанням/розбором повних тіл Webhook, коли заголовок присутній.
   - Запити Google Workspace Add-on, які містять `authorizationEventObject.systemIdToken` у тілі, підтримуються через суворіший бюджет тіла перед автентифікацією.
2. OpenClaw перевіряє токен відносно налаштованих `audienceType` + `audience`:
   - `audienceType: "app-url"` → аудиторія — це ваша HTTPS URL-адреса Webhook.
   - `audienceType: "project-number"` → аудиторія — це номер проєкту Cloud.
3. Повідомлення маршрутизуються за простором:
   - DM використовують ключ сесії `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Простори використовують ключ сесії `agent:<agentId>:googlechat:group:<spaceId>`.
4. Доступ до DM за замовчуванням відбувається через pairing. Невідомі відправники отримують код pairing; підтвердьте за допомогою:
   - `openclaw pairing approve googlechat <code>`
5. Групові простори за замовчуванням потребують @-згадки. Використовуйте `botUser`, якщо для виявлення згадок потрібне ім’я користувача застосунку.

## Цілі

Використовуйте ці ідентифікатори для доставки й allowlists:

- Прямі повідомлення: `users/<userId>` (рекомендовано).
- Необроблена email-адреса `name@example.com` є змінною і використовується лише для зіставлення прямого allowlist, коли `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Застаріле: `users/<email>` трактується як user id, а не як email allowlist.
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
          enabled: true,
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

- Облікові дані service account також можна передати inline через `serviceAccount` (JSON-рядок).
- `serviceAccountRef` також підтримується (env/file SecretRef), зокрема refs для окремих акаунтів у `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Шлях Webhook за замовчуванням — `/googlechat`, якщо `webhookPath` не задано.
- `dangerouslyAllowNameMatching` знову вмикає зіставлення змінних email-принципалів для allowlists (режим сумісності break-glass).
- Реакції доступні через інструмент `reactions` і `channels action`, коли `actions.reactions` увімкнено.
- Дії повідомлень надають `send` для тексту та `upload-file` для явного надсилання вкладень. `upload-file` приймає `media` / `filePath` / `path` плюс необов’язкові `message`, `filename` і цільовий thread.
- `typingIndicator` підтримує `none`, `message` (за замовчуванням) і `reaction` (reaction потребує OAuth користувача).
- Вкладення завантажуються через Chat API і зберігаються в медіа-конвеєрі (розмір обмежено `mediaMaxMb`).

Докладніше про посилання на секрети: [Керування секретами](/uk/gateway/secrets).

## Усунення несправностей

### 405 Method Not Allowed

Якщо Google Cloud Logs Explorer показує помилки на кшталт:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Це означає, що обробник Webhook не зареєстровано. Поширені причини:

1. **Канал не налаштовано**: розділ `channels.googlechat` відсутній у вашій конфігурації. Перевірте за допомогою:

   ```bash
   openclaw config get channels.googlechat
   ```

   Якщо повертається "Config path not found", додайте конфігурацію (див. [Основні моменти конфігурації](#config-highlights)).

2. **Plugin не ввімкнено**: перевірте статус Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Якщо показує "disabled", додайте `plugins.entries.googlechat.enabled: true` до своєї конфігурації.

3. **Gateway не перезапущено**: після додавання конфігурації перезапустіть Gateway:

   ```bash
   openclaw gateway restart
   ```

Перевірте, що канал запущено:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Інші проблеми

- Перевірте `openclaw channels status --probe` на помилки автентифікації або відсутню конфігурацію аудиторії.
- Якщо повідомлення не надходять, підтвердьте URL-адресу Webhook застосунку Chat + підписки на події.
- Якщо обмеження за згадками блокує відповіді, встановіть `botUser` як ім’я ресурсу користувача застосунку й перевірте `requireMention`.
- Використовуйте `openclaw logs --follow` під час надсилання тестового повідомлення, щоб побачити, чи доходять запити до Gateway.

Пов’язані документи:

- [Конфігурація Gateway](/uk/gateway/configuration)
- [Безпека](/uk/gateway/security)
- [Реакції](/uk/tools/reactions)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
