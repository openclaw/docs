---
read_when:
    - Робота над функціями каналу Google Chat
summary: Стан підтримки застосунку Google Chat, можливості та конфігурація
title: Google Chat
x-i18n:
    generated_at: "2026-05-02T07:07:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdb8dcf651602e92801d7107646d853871ea6cef188a8733a831695a1243740e
    source_path: channels/googlechat.md
    workflow: 16
---

Status: завантажуваний plugin для DM і просторів через webhooks Google Chat API (лише HTTP).

## Встановлення

Встановіть Google Chat перед налаштуванням каналу:

```bash
openclaw plugins install @openclaw/googlechat
```

Локальний checkout (коли запускаєте з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Швидке налаштування (для початківців)

1. Створіть проєкт Google Cloud і ввімкніть **Google Chat API**.
   - Перейдіть до: [Облікові дані Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Увімкніть API, якщо його ще не ввімкнено.
2. Створіть **сервісний обліковий запис**:
   - Натисніть **Створити облікові дані** > **Сервісний обліковий запис**.
   - Назвіть його як завгодно (наприклад, `openclaw-chat`).
   - Залиште дозволи порожніми (натисніть **Продовжити**).
   - Залиште principals із доступом порожніми (натисніть **Готово**).
3. Створіть і завантажте **JSON-ключ**:
   - У списку сервісних облікових записів натисніть той, який щойно створили.
   - Перейдіть на вкладку **Ключі**.
   - Натисніть **Додати ключ** > **Створити новий ключ**.
   - Виберіть **JSON** і натисніть **Створити**.
4. Збережіть завантажений JSON-файл на хості Gateway (наприклад, `~/.openclaw/googlechat-service-account.json`).
5. Створіть застосунок Google Chat у [конфігурації Chat у Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Заповніть **інформацію про застосунок**:
     - **Назва застосунку**: (наприклад, `OpenClaw`)
     - **URL аватара**: (наприклад, `https://openclaw.ai/logo.png`)
     - **Опис**: (наприклад, `Personal AI Assistant`)
   - Увімкніть **інтерактивні функції**.
   - У розділі **Функціональність** позначте **Приєднуватися до просторів і групових розмов**.
   - У розділі **Налаштування підключення** виберіть **URL HTTP endpoint**.
   - У розділі **Тригери** виберіть **Використовувати спільний URL HTTP endpoint для всіх тригерів** і встановіть його на публічний URL вашого Gateway з доданим `/googlechat`.
     - _Порада: запустіть `openclaw status`, щоб знайти публічний URL вашого Gateway._
   - У розділі **Видимість** позначте **Зробити цей застосунок Chat доступним для певних людей і груп у `<Your Domain>`**.
   - Введіть свою адресу електронної пошти (наприклад, `user@example.com`) у текстове поле.
   - Натисніть **Зберегти** внизу.
6. **Увімкніть статус застосунку**:
   - Після збереження **оновіть сторінку**.
   - Знайдіть розділ **Статус застосунку** (зазвичай після збереження він розташований угорі або внизу).
   - Змініть статус на **Live - доступно користувачам**.
   - Натисніть **Зберегти** ще раз.
7. Налаштуйте OpenClaw зі шляхом до сервісного облікового запису + аудиторією webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Або config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Встановіть тип і значення аудиторії webhook (має відповідати конфігурації вашого застосунку Chat).
9. Запустіть Gateway. Google Chat надсилатиме POST на шлях вашого webhook.

## Додавання до Google Chat

Коли Gateway працює, а вашу електронну пошту додано до списку видимості:

1. Перейдіть до [Google Chat](https://chat.google.com/).
2. Натисніть іконку **+** (плюс) поруч із **Прямі повідомлення**.
3. У рядку пошуку (де ви зазвичай додаєте людей) введіть **назву застосунку**, яку налаштували в Google Cloud Console.
   - **Примітка**: бот _не_ з’явиться у списку перегляду "Marketplace", бо це приватний застосунок. Його потрібно знайти за назвою.
4. Виберіть свого бота в результатах.
5. Натисніть **Додати** або **Chat**, щоб почати розмову 1:1.
6. Надішліть "Привіт", щоб активувати помічника!

## Публічний URL (лише Webhook)

Webhooks Google Chat потребують публічного HTTPS endpoint. З міркувань безпеки **відкривайте в інтернет лише шлях `/googlechat`**. Панель OpenClaw та інші чутливі endpoints залишайте у приватній мережі.

### Варіант A: Tailscale Funnel (рекомендовано)

Використовуйте Tailscale Serve для приватної панелі та Funnel для публічного шляху webhook. Так `/` залишається приватним, а відкритим є лише `/googlechat`.

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

3. **Публічно відкрийте лише шлях webhook:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Авторизуйте node для доступу Funnel:**
   Якщо з’явиться запит, відкрийте URL авторизації, показаний у виводі, щоб увімкнути Funnel для цього node у політиці вашого tailnet.

5. **Перевірте конфігурацію:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Ваш публічний URL webhook буде:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Ваша приватна панель залишається доступною лише в tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Використовуйте публічний URL (без `:8443`) у конфігурації застосунку Google Chat.

> Примітка: ця конфігурація зберігається після перезавантажень. Щоб видалити її пізніше, запустіть `tailscale funnel reset` і `tailscale serve reset`.

### Варіант B: Reverse Proxy (Caddy)

Якщо ви використовуєте reverse proxy на кшталт Caddy, проксіюйте лише конкретний шлях:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

З цією конфігурацією будь-який запит до `your-domain.com/` буде проігноровано або повернено як 404, тоді як `your-domain.com/googlechat` безпечно маршрутизуватиметься до OpenClaw.

### Варіант C: Cloudflare Tunnel

Налаштуйте ingress rules вашого tunnel так, щоб маршрутизувався лише шлях webhook:

- **Шлях**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Правило за замовчуванням**: HTTP 404 (Not Found)

## Як це працює

1. Google Chat надсилає webhook POSTs до Gateway. Кожен запит містить заголовок `Authorization: Bearer <token>`.
   - OpenClaw перевіряє bearer auth перед читанням/розбором повних тіл webhook, коли заголовок наявний.
   - Запити Google Workspace Add-on, які містять `authorizationEventObject.systemIdToken` у тілі, підтримуються через суворіший бюджет тіла pre-auth.
2. OpenClaw перевіряє token щодо налаштованих `audienceType` + `audience`:
   - `audienceType: "app-url"` → аудиторія — це ваш HTTPS URL webhook.
   - `audienceType: "project-number"` → аудиторія — це номер проєкту Cloud.
3. Повідомлення маршрутизуються за простором:
   - DM використовують ключ сесії `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Простори використовують ключ сесії `agent:<agentId>:googlechat:group:<spaceId>`.
4. Доступ до DM за замовчуванням відбувається через pairing. Невідомі відправники отримують код pairing; підтвердьте за допомогою:
   - `openclaw pairing approve googlechat <code>`
5. Групові простори за замовчуванням потребують @-mention. Використовуйте `botUser`, якщо для виявлення згадок потрібне ім’я користувача застосунку.

## Цілі

Використовуйте ці ідентифікатори для доставки та allowlists:

- Прямі повідомлення: `users/<userId>` (рекомендовано).
- Raw email `name@example.com` є змінним і використовується лише для прямого зіставлення allowlist, коли `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Застаріле: `users/<email>` трактується як user id, а не email allowlist.
- Простори: `spaces/<spaceId>`.

## Основні параметри config

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

- Облікові дані сервісного облікового запису також можна передати inline через `serviceAccount` (JSON string).
- `serviceAccountRef` також підтримується (env/file SecretRef), включно з per-account refs у `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Стандартний шлях webhook — `/googlechat`, якщо `webhookPath` не задано.
- `dangerouslyAllowNameMatching` повторно вмикає зіставлення змінних email principals для allowlists (режим сумісності break-glass).
- Reactions доступні через інструмент `reactions` і `channels action`, коли ввімкнено `actions.reactions`.
- Дії з повідомленнями надають `send` для тексту та `upload-file` для явного надсилання вкладень. `upload-file` приймає `media` / `filePath` / `path` плюс необов’язкові `message`, `filename` і targeting thread.
- `typingIndicator` підтримує `none`, `message` (за замовчуванням) і `reaction` (reaction потребує user OAuth).
- Вкладення завантажуються через Chat API і зберігаються в media pipeline (розмір обмежується `mediaMaxMb`).

Докладніше про secrets reference: [Керування secrets](/uk/gateway/secrets).

## Усунення несправностей

### 405 Method Not Allowed

Якщо Google Cloud Logs Explorer показує помилки на кшталт:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Це означає, що обробник webhook не зареєстрований. Поширені причини:

1. **Канал не налаштований**: у вашому config відсутній розділ `channels.googlechat`. Перевірте за допомогою:

   ```bash
   openclaw config get channels.googlechat
   ```

   Якщо повертається "Config path not found", додайте конфігурацію (див. [Основні параметри config](#config-highlights)).

2. **Plugin не ввімкнено**: перевірте статус plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Якщо показує "disabled", додайте `plugins.entries.googlechat.enabled: true` до вашого config.

3. **Gateway не перезапущено**: після додавання config перезапустіть Gateway:

   ```bash
   openclaw gateway restart
   ```

Перевірте, що канал запущений:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Інші проблеми

- Перевірте `openclaw channels status --probe` на помилки auth або відсутню конфігурацію аудиторії.
- Якщо повідомлення не надходять, підтвердьте URL webhook застосунку Chat + event subscriptions.
- Якщо mention gating блокує відповіді, встановіть `botUser` на user resource name застосунку та перевірте `requireMention`.
- Використовуйте `openclaw logs --follow` під час надсилання тестового повідомлення, щоб побачити, чи запити доходять до Gateway.

Пов’язані документи:

- [Конфігурація Gateway](/uk/gateway/configuration)
- [Безпека](/uk/gateway/security)
- [Reactions](/uk/tools/reactions)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/uk/channels/groups) — поведінка групових чатів і mention gating
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та hardening
