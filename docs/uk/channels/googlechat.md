---
read_when:
    - Робота над функціями каналу Google Chat
summary: Стан підтримки застосунку Google Chat, можливості та налаштування
title: Google Chat
x-i18n:
    generated_at: "2026-05-06T06:16:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2b6ac581578df0fccfb560057e4b30ec359a368cb671519a153e1c727d7b920c
    source_path: channels/googlechat.md
    workflow: 16
---

Стан: завантажуваний Plugin для особистих повідомлень і просторів через Webhook-и Google Chat API (лише HTTP).

## Установлення

Установіть Google Chat перед налаштуванням каналу:

```bash
openclaw plugins install @openclaw/googlechat
```

Локальна робоча копія (під час запуску з git-репозиторію):

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
   - Залиште principals із доступом порожніми (натисніть **Done**).
3. Створіть і завантажте **JSON Key**:
   - У списку service accounts натисніть щойно створений обліковий запис.
   - Перейдіть на вкладку **Keys**.
   - Натисніть **Add Key** > **Create new key**.
   - Виберіть **JSON** і натисніть **Create**.
4. Збережіть завантажений JSON-файл на хості Gateway (наприклад, `~/.openclaw/googlechat-service-account.json`).
5. Створіть застосунок Google Chat у [конфігурації Chat у Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Заповніть **Application info**:
     - **App name**: (наприклад, `OpenClaw`)
     - **Avatar URL**: (наприклад, `https://openclaw.ai/logo.png`)
     - **Description**: (наприклад, `Personal AI Assistant`)
   - Увімкніть **Interactive features**.
   - У розділі **Functionality** позначте **Join spaces and group conversations**.
   - У розділі **Connection settings** виберіть **HTTP endpoint URL**.
   - У розділі **Triggers** виберіть **Use a common HTTP endpoint URL for all triggers** і задайте публічний URL вашого Gateway з доданим `/googlechat`.
     - _Порада: запустіть `openclaw status`, щоб знайти публічний URL вашого Gateway._
   - У розділі **Visibility** позначте **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Введіть свою адресу електронної пошти (наприклад, `user@example.com`) у текстове поле.
   - Натисніть **Save** внизу.
6. **Увімкніть стан застосунку**:
   - Після збереження **оновіть сторінку**.
   - Знайдіть розділ **App status** (зазвичай біля верху або низу після збереження).
   - Змініть стан на **Live - available to users**.
   - Знову натисніть **Save**.
7. Налаштуйте OpenClaw із шляхом до service account + аудиторією Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Або config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Задайте тип аудиторії Webhook + значення (відповідає конфігурації вашого застосунку Chat).
9. Запустіть Gateway. Google Chat надсилатиме POST-запити на шлях вашого Webhook.

## Додавання до Google Chat

Коли Gateway запущено, а вашу електронну пошту додано до списку видимості:

1. Перейдіть до [Google Chat](https://chat.google.com/).
2. Натисніть піктограму **+** (плюс) поруч із **Direct Messages**.
3. У рядку пошуку (де ви зазвичай додаєте людей) введіть **App name**, який ви налаштували в Google Cloud Console.
   - **Примітка**: бот _не_ з'явиться у списку перегляду "Marketplace", бо це приватний застосунок. Його потрібно знайти за назвою.
4. Виберіть свого бота з результатів.
5. Натисніть **Add** або **Chat**, щоб почати розмову 1:1.
6. Надішліть "Hello", щоб запустити асистента!

## Публічний URL (лише Webhook)

Webhook-и Google Chat потребують публічної HTTPS-точки доступу. З міркувань безпеки **відкривайте в інтернет лише шлях `/googlechat`**. Панель керування OpenClaw та інші чутливі точки доступу тримайте у приватній мережі.

### Варіант A: Tailscale Funnel (рекомендовано)

Використовуйте Tailscale Serve для приватної панелі керування і Funnel для публічного шляху Webhook. Так `/` лишається приватним, а відкривається лише `/googlechat`.

1. **Перевірте, до якої адреси прив'язаний ваш Gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Занотуйте IP-адресу (наприклад, `127.0.0.1`, `0.0.0.0` або вашу Tailscale IP на кшталт `100.x.x.x`).

2. **Відкрийте панель керування лише для tailnet (порт 8443):**

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

4. **Авторизуйте node для доступу Funnel:**
   Якщо з'явиться запит, перейдіть за URL авторизації, показаним у виводі, щоб увімкнути Funnel для цього node у політиці вашого tailnet.

5. **Перевірте конфігурацію:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Ваш публічний URL Webhook буде:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Ваша приватна панель керування лишається доступною лише в tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Використовуйте публічний URL (без `:8443`) у конфігурації застосунку Google Chat.

> Примітка: ця конфігурація зберігається після перезавантажень. Щоб пізніше її прибрати, запустіть `tailscale funnel reset` і `tailscale serve reset`.

### Варіант B: Reverse Proxy (Caddy)

Якщо ви використовуєте reverse proxy на кшталт Caddy, проксіюйте лише конкретний шлях:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

З цією конфігурацією будь-який запит до `your-domain.com/` буде проігноровано або поверне 404, тоді як `your-domain.com/googlechat` буде безпечно спрямовано до OpenClaw.

### Варіант C: Cloudflare Tunnel

Налаштуйте ingress-правила вашого tunnel так, щоб маршрутизувати лише шлях Webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Як це працює

1. Google Chat надсилає Webhook POST-запити до Gateway. Кожен запит містить заголовок `Authorization: Bearer <token>`.
   - OpenClaw перевіряє bearer auth перед читанням/розбором повних тіл Webhook, коли заголовок присутній.
   - Запити Google Workspace Add-on, які містять `authorizationEventObject.systemIdToken` у тілі, підтримуються через суворіший ліміт тіла до автентифікації.
2. OpenClaw перевіряє token відносно налаштованих `audienceType` + `audience`:
   - `audienceType: "app-url"` → аудиторія — це ваш HTTPS URL Webhook.
   - `audienceType: "project-number"` → аудиторія — це номер Cloud project.
3. Повідомлення маршрутизуються за простором:
   - Особисті повідомлення використовують ключ сесії `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Простори використовують ключ сесії `agent:<agentId>:googlechat:group:<spaceId>`.
4. Доступ до особистих повідомлень за замовчуванням працює через pairing. Невідомі відправники отримують код pairing; підтвердьте його так:
   - `openclaw pairing approve googlechat <code>`
5. Групові простори за замовчуванням потребують @-згадки. Використовуйте `botUser`, якщо для виявлення згадки потрібне ім'я користувача застосунку.

## Цілі

Використовуйте ці ідентифікатори для доставки й allowlists:

- Особисті повідомлення: `users/<userId>` (рекомендовано).
- Необроблена електронна адреса `name@example.com` є змінною і використовується лише для зіставлення direct allowlist, коли `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Застаріло: `users/<email>` обробляється як user id, а не як email allowlist.
- Простори: `spaces/<spaceId>`.

## Основні параметри конфігурації

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
- `serviceAccountRef` також підтримується (env/file SecretRef), включно з refs для окремих облікових записів у `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Стандартний шлях Webhook — `/googlechat`, якщо `webhookPath` не задано.
- `dangerouslyAllowNameMatching` повторно вмикає зіставлення змінних email principals для allowlists (режим сумісності break-glass).
- Реакції доступні через інструмент `reactions` і `channels action`, коли `actions.reactions` увімкнено.
- Дії з повідомленнями надають `send` для тексту та `upload-file` для явного надсилання вкладень. `upload-file` приймає `media` / `filePath` / `path`, а також необов'язкові `message`, `filename` і thread targeting.
- `typingIndicator` підтримує `none`, `message` (за замовчуванням) і `reaction` (для реакції потрібен OAuth користувача).
- Вкладення завантажуються через Chat API і зберігаються в media pipeline (розмір обмежено `mediaMaxMb`).

Докладно про посилання на секрети: [Керування секретами](/uk/gateway/secrets).

## Усунення несправностей

### 405 Method Not Allowed

Якщо Google Cloud Logs Explorer показує помилки на кшталт:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Це означає, що обробник Webhook не зареєстровано. Поширені причини:

1. **Канал не налаштовано**: у вашій конфігурації відсутній розділ `channels.googlechat`. Перевірте так:

   ```bash
   openclaw config get channels.googlechat
   ```

   Якщо повертається "Config path not found", додайте конфігурацію (див. [Основні параметри конфігурації](#config-highlights)).

2. **Plugin не ввімкнено**: перевірте стан Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Якщо показано "disabled", додайте `plugins.entries.googlechat.enabled: true` до своєї конфігурації.

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
- Якщо повідомлення не надходять, підтвердьте URL Webhook застосунку Chat + підписки на події.
- Якщо фільтр згадок блокує відповіді, задайте `botUser` як ім'я ресурсу користувача застосунку й перевірте `requireMention`.
- Використовуйте `openclaw logs --follow` під час надсилання тестового повідомлення, щоб побачити, чи доходять запити до Gateway.

Пов'язані документи:

- [Конфігурація Gateway](/uk/gateway/configuration)
- [Безпека](/uk/gateway/security)
- [Реакції](/uk/tools/reactions)

## Пов'язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація особистих повідомлень і потік pairing
- [Групи](/uk/channels/groups) — поведінка групових чатів і фільтрація згадок
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
