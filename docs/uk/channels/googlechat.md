---
read_when:
    - Робота над функціями каналу Google Chat
summary: Стан підтримки, можливості та конфігурація застосунку Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-06-27T17:09:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

Статус: завантажуваний Plugin для DM і просторів через Webhook-и Google Chat API (лише HTTP).

## Встановлення

Установіть Google Chat перед налаштуванням каналу:

```bash
openclaw plugins install @openclaw/googlechat
```

Локальний checkout (під час запуску з git-репозиторію):

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
   - Залиште принципалів із доступом порожніми (натисніть **Done**).
3. Створіть і завантажте **JSON Key**:
   - У списку service account-ів натисніть той, який ви щойно створили.
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
   - У розділі **Triggers** виберіть **Use a common HTTP endpoint URL for all triggers** і задайте публічну URL-адресу вашого Gateway з доданим `/googlechat`.
     - _Порада: запустіть `openclaw status`, щоб знайти публічну URL-адресу вашого Gateway._
   - У розділі **Visibility** позначте **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Введіть свою адресу електронної пошти (наприклад, `user@example.com`) у текстове поле.
   - Натисніть **Save** внизу.
6. **Увімкніть статус застосунку**:
   - Після збереження **оновіть сторінку**.
   - Знайдіть розділ **App status** (зазвичай він розташований угорі або внизу після збереження).
   - Змініть статус на **Live - available to users**.
   - Знову натисніть **Save**.
7. Налаштуйте OpenClaw зі шляхом до service account + аудиторією Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Або конфігурація: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Задайте тип і значення аудиторії Webhook (відповідає конфігурації вашого застосунку Chat).
9. Запустіть Gateway. Google Chat надсилатиме POST на шлях вашого Webhook.

## Додавання до Google Chat

Коли Gateway запущено, а вашу адресу електронної пошти додано до списку видимості:

1. Перейдіть до [Google Chat](https://chat.google.com/).
2. Натисніть піктограму **+** (плюс) поруч із **Прямі повідомлення**.
3. У рядку пошуку (де зазвичай додають людей) введіть **App name**, який ви налаштували в Google Cloud Console.
   - **Примітка**: бот _не_ з’явиться в списку перегляду "Marketplace", оскільки це приватний застосунок. Його потрібно шукати за назвою.
4. Виберіть свого бота з результатів.
5. Натисніть **Add** або **Chat**, щоб почати розмову 1:1.
6. Надішліть "Hello", щоб запустити асистента!

## Публічна URL-адреса (лише Webhook)

Webhook-и Google Chat потребують публічної HTTPS-кінцевої точки. З міркувань безпеки **відкривайте в інтернет лише шлях `/googlechat`**. Тримайте панель керування OpenClaw та інші чутливі кінцеві точки у приватній мережі.

### Варіант A: Tailscale Funnel (рекомендовано)

Використовуйте Tailscale Serve для приватної панелі керування та Funnel для публічного шляху Webhook. Так `/` залишається приватним, а відкривається лише `/googlechat`.

1. **Перевірте, до якої адреси прив’язаний ваш Gateway:**

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

4. **Авторизуйте вузол для доступу Funnel:**
   Якщо з’явиться запит, перейдіть за URL-адресою авторизації, показаною у виводі, щоб увімкнути Funnel для цього вузла в політиці вашого tailnet.

5. **Перевірте конфігурацію:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Ваша публічна URL-адреса Webhook буде:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Ваша приватна панель керування залишається доступною лише в tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Використовуйте публічну URL-адресу (без `:8443`) у конфігурації застосунку Google Chat.

> Примітка: ця конфігурація зберігається після перезавантажень. Щоб видалити її пізніше, запустіть `tailscale funnel reset` і `tailscale serve reset`.

### Варіант B: Reverse Proxy (Caddy)

Якщо ви використовуєте reverse proxy на кшталт Caddy, проксіюйте лише конкретний шлях:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

З цією конфігурацією будь-який запит до `your-domain.com/` буде проігноровано або поверне 404, тоді як `your-domain.com/googlechat` безпечно маршрутизується до OpenClaw.

### Варіант C: Cloudflare Tunnel

Налаштуйте правила ingress для вашого тунелю так, щоб маршрутизувати лише шлях webhook:

- **Шлях**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Правило за замовчуванням**: HTTP 404 (Не знайдено)

## Як це працює

1. Google Chat надсилає webhook POST до gateway. Кожен запит містить заголовок `Authorization: Bearer <token>`.
   - OpenClaw перевіряє bearer-автентифікацію перед читанням/розбором повних тіл webhook, коли заголовок присутній.
   - Запити Google Workspace Add-on, що містять `authorizationEventObject.systemIdToken` у тілі, підтримуються через суворіший бюджет тіла до автентифікації.
2. OpenClaw перевіряє токен відповідно до налаштованих `audienceType` + `audience`:
   - `audienceType: "app-url"` → audience — це ваша HTTPS URL-адреса webhook.
   - `audienceType: "project-number"` → audience — це номер Cloud project.
3. Повідомлення маршрутизуються за простором:
   - Приватні повідомлення використовують ключ сеансу `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Простори використовують ключ сеансу `agent:<agentId>:googlechat:group:<spaceId>`.
4. Доступ до приватних повідомлень за замовчуванням виконується через спарювання. Невідомі відправники отримують код спарювання; підтвердьте за допомогою:
   - `openclaw pairing approve googlechat <code>`
5. Групові простори за замовчуванням потребують @-згадки. Використовуйте `botUser`, якщо виявленню згадок потрібне ім'я користувача застосунку.
6. Коли запит на підтвердження виконання або plugin запускається з Google Chat і налаштовано стабільного підтверджувача `users/<id>`, OpenClaw публікує нативну картку підтвердження Google Chat у початковому просторі або треді. Кнопки картки використовують непрозорі callback-токени, а ручний запит `/approve <id> <decision>` показується лише тоді, коли нативна доставка підтвердження недоступна.

## Цілі

Використовуйте ці ідентифікатори для доставки та allowlist:

- Приватні повідомлення: `users/<userId>` (рекомендовано).
- Необроблена email-адреса `name@example.com` є змінюваною та використовується лише для прямого зіставлення allowlist, коли `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Застаріло: `users/<email>` трактується як ідентифікатор користувача, а не як allowlist email-адрес.
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
      allowBots: false,
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
- `serviceAccountRef` також підтримується (env/file SecretRef), зокрема посилання для окремих акаунтів у `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Шлях webhook за замовчуванням — `/googlechat`, якщо `webhookPath` не задано.
- `dangerouslyAllowNameMatching` повторно вмикає зіставлення змінюваних email principal для allowlist (режим сумісності break-glass).
- Реакції доступні через інструмент `reactions` і `channels action`, коли `actions.reactions` увімкнено.
- Нативні картки підтвердження використовують кліки кнопок Google Chat `cardsV2`, а не події реакцій. Підтверджувачі беруться з `dm.allowFrom` або `defaultTo` і мають бути стабільними числовими значеннями `users/<id>`.
- Дії повідомлень надають `send` для тексту та `upload-file` для явного надсилання вкладень. `upload-file` приймає `media` / `filePath` / `path`, а також необов'язкові `message`, `filename` і цільовий тред.
- `typingIndicator` підтримує `message` (за замовчуванням), `none` і `reaction` (реакція потребує user OAuth).
- Вкладення завантажуються через Chat API і зберігаються в медіаконвеєрі (розмір обмежено `mediaMaxMb`).
- Повідомлення Google Chat, створені ботами, за замовчуванням ігноруються. Якщо ви навмисно встановлюєте `allowBots: true`, прийняті повідомлення від ботів використовують спільний [захист від циклів ботів](/uk/channels/bot-loop-protection). Налаштуйте `channels.defaults.botLoopProtection`, а потім перевизначте через `channels.googlechat.botLoopProtection` або `channels.googlechat.groups.<space>.botLoopProtection`, коли одному простору потрібен інший бюджет.

Докладніше про посилання на секрети: [Керування секретами](/uk/gateway/secrets).

## Усунення несправностей

### 405 Метод не дозволено

Якщо Google Cloud Logs Explorer показує помилки на кшталт:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Це означає, що обробник webhook не зареєстровано. Поширені причини:

1. **Канал не налаштовано**: розділ `channels.googlechat` відсутній у вашій конфігурації. Перевірте за допомогою:

   ```bash
   openclaw config get channels.googlechat
   ```

   Якщо повертається "Config path not found", додайте конфігурацію (див. [Основні параметри конфігурації](#config-highlights)).

2. **Plugin не ввімкнено**: перевірте стан plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Якщо показано "disabled", додайте `plugins.entries.googlechat.enabled: true` до вашої конфігурації.

3. **Gateway не перезапущено**: після додавання конфігурації перезапустіть gateway:

   ```bash
   openclaw gateway restart
   ```

Перевірте, що канал запущено:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Інші проблеми

- Перевірте `openclaw channels status --probe` на помилки автентифікації або відсутню конфігурацію audience.
- Якщо повідомлення не надходять, підтвердьте URL-адресу webhook застосунку Chat і підписки на події.
- Якщо шлюз згадок блокує відповіді, встановіть `botUser` на ім'я ресурсу користувача застосунку й перевірте `requireMention`.
- Використовуйте `openclaw logs --follow` під час надсилання тестового повідомлення, щоб побачити, чи запити доходять до gateway.

Пов'язана документація:

- [Конфігурація Gateway](/uk/gateway/configuration)
- [Безпека](/uk/gateway/security)
- [Реакції](/uk/tools/reactions)

## Пов'язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Спарювання](/uk/channels/pairing) — автентифікація в особистих повідомленнях і потік спарювання
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
