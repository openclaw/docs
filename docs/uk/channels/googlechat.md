---
read_when:
    - Робота над функціями каналу Google Chat
summary: Статус підтримки, можливості та налаштування застосунку Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T12:58:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat працює як офіційний plugin `@openclaw/googlechat`: особисті повідомлення та простори через вебхуки Google Chat API (лише кінцева точка HTTP, без Pub/Sub).

## Встановлення

```bash
openclaw plugins install @openclaw/googlechat
```

Локальна робоча копія (під час запуску з репозиторію git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Швидке налаштування (для початківців)

1. Створіть проєкт Google Cloud і ввімкніть **Google Chat API**.
   - Перейдіть до: [облікових даних Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Увімкніть API, якщо його ще не ввімкнено.
2. Створіть **Service Account**:
   - Натисніть **Create Credentials** > **Service Account**.
   - Назвіть його як завгодно (наприклад, `openclaw-chat`).
   - Залиште дозволи та суб’єкти порожніми (**Continue**, потім **Done**).
3. Створіть і завантажте **ключ JSON**:
   - Натисніть новий сервісний обліковий запис > вкладка **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. Збережіть завантажений файл JSON на хості Gateway (наприклад, `~/.openclaw/googlechat-service-account.json`).
5. Створіть застосунок Google Chat у розділі [налаштування Chat у Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Заповніть **Application info** (назва застосунку, URL аватара, опис).
   - Увімкніть **Interactive features**.
   - У розділі **Functionality** позначте **Join spaces and group conversations**.
   - У розділі **Connection settings** виберіть **HTTP endpoint URL**.
   - У розділі **Triggers** виберіть **Use a common HTTP endpoint URL for all triggers** і вкажіть публічну URL-адресу Gateway із доданим `/googlechat` (див. [Публічна URL-адреса](#public-url-webhook-only)).
   - У розділі **Visibility** позначте **Make this Chat app available to specific people and groups in `<Your Domain>`** і введіть свою адресу електронної пошти.
   - Натисніть **Save**.
6. Увімкніть статус застосунку: оновіть сторінку, знайдіть **App status**, установіть **Live - available to users** і знову натисніть **Save**.
7. Налаштуйте OpenClaw за допомогою сервісного облікового запису та аудиторії вебхука (має відповідати конфігурації застосунку Chat):
   - Змінна середовища: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (лише для облікового запису за замовчуванням), або
   - Конфігурація: див. [Основні параметри конфігурації](#config-highlights). `openclaw channels add --channel googlechat` також приймає `--audience-type`, `--audience`, `--webhook-path` і `--webhook-url`.
8. Запустіть Gateway. Google Chat надсилатиме POST-запити на шлях вебхука (за замовчуванням `/googlechat`).

## Додавання до Google Chat

Коли Gateway запущено, а вашу адресу електронної пошти додано до списку видимості:

1. Перейдіть до [Google Chat](https://chat.google.com/).
2. Натисніть значок **+** (плюс) поруч із **Direct Messages**.
3. Знайдіть **App name**, налаштовану в Google Cloud Console.
   - Бот _не_ відображається у списку огляду Marketplace, оскільки це приватний застосунок; шукайте його за назвою.
4. Виберіть бота, натисніть **Add** або **Chat** і надішліть повідомлення.

## Публічна URL-адреса (лише вебхук)

Для вебхуків Google Chat потрібна публічна кінцева точка HTTPS. З міркувань безпеки відкривайте в інтернеті **лише шлях `/googlechat`**, а панель керування OpenClaw та інші кінцеві точки залишайте приватними.

### Варіант A: Tailscale Funnel (рекомендовано)

Використовуйте Tailscale Serve для приватної панелі керування та Funnel для публічного шляху вебхука.

1. Перевірте, до якої адреси прив’язано Gateway:

   ```bash
   ss -tlnp | grep 18789
   ```

   Занотуйте IP-адресу (наприклад, `127.0.0.1`, `0.0.0.0` або адресу Tailscale `100.x.x.x`).

2. Відкрийте доступ до панелі керування лише для tailnet (порт 8443):

   ```bash
   # Якщо прив’язано до localhost (127.0.0.1 або 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Якщо прив’язано лише до IP-адреси Tailscale:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Відкрийте публічний доступ лише до шляху вебхука:

   ```bash
   # Якщо прив’язано до localhost (127.0.0.1 або 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Якщо прив’язано лише до IP-адреси Tailscale:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Якщо з’явиться запит, перейдіть за URL-адресою авторизації, показаною у виводі, щоб увімкнути Funnel для цього вузла.

5. Перевірте:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Публічна URL-адреса вебхука: `https://<node-name>.<tailnet>.ts.net/googlechat`; панель керування залишається доступною лише в tailnet за адресою `https://<node-name>.<tailnet>.ts.net:8443/`. Використовуйте публічну URL-адресу (без `:8443`) у конфігурації застосунку Google Chat.

> Примітка: ця конфігурація зберігається після перезавантажень. Згодом її можна видалити за допомогою `tailscale funnel reset` і `tailscale serve reset`.

### Варіант B: зворотний проксі (Caddy)

Проксіюйте лише шлях вебхука:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Запити до `your-domain.com/` ігноруються або отримують відповідь 404, а `your-domain.com/googlechat` спрямовується до OpenClaw.

### Варіант C: Cloudflare Tunnel

Налаштуйте правила вхідного трафіку тунелю, щоб спрямовувати лише шлях вебхука:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default rule**: HTTP 404 (Not Found)

## Принцип роботи

1. Google Chat надсилає JSON за допомогою POST-запитів на шлях вебхука Gateway (лише POST, потрібен тип вмісту JSON, діє обмеження частоти запитів для кожної IP-адреси).
2. OpenClaw автентифікує кожен запит перед передаванням:
   - Події застосунку Chat містять `Authorization: Bearer <token>`; токен перевіряється до розбору повного тіла запиту.
   - Події доповнення Google Workspace містять токен у тілі (`authorizationEventObject.systemIdToken`) і зчитуються до перевірки в межах суворіших обмежень попередньої автентифікації (16 КБ, 3 с).
3. Токен перевіряється за `audienceType` + `audience`:
   - `audienceType: "app-url"` → аудиторією є URL-адреса HTTPS вашого вебхука.
   - `audienceType: "project-number"` → аудиторією є номер проєкту Cloud.
   - Для токенів доповнень із `app-url` додатково потрібно встановити `appPrincipal` у числовий ідентифікатор клієнта OAuth 2.0 застосунку (21 цифра, не адреса електронної пошти); інакше перевірка завершується помилкою із записом попередження в журнал.
4. Повідомлення маршрутизуються за простором:
   - Простори отримують окремі сеанси `agent:<agentId>:googlechat:group:<spaceId>`; відповіді надсилаються до гілки повідомлення.
   - Особисті повідомлення за замовчуванням об’єднуються з основним сеансом агента; установіть `session.dmScope` для окремих сеансів особистих повідомлень із кожним співрозмовником (див. [Сеанс](/uk/concepts/session)).
5. Доступ до особистих повідомлень за замовчуванням потребує сполучення. Невідомі відправники отримують код сполучення; підтвердьте його за допомогою:
   - `openclaw pairing approve googlechat <code>`
6. У групових просторах за замовчуванням потрібна @згадка. Згадки виявляються за анотаціями Chat `USER_MENTION`, спрямованими на застосунок; установіть `botUser` (наприклад, `users/1234567890`), якщо для виявлення потрібне ім’я ресурсу користувача застосунку.
7. Коли запит на схвалення виконання команди або plugin ініційовано з Google Chat і налаштовано стабільного схвалювача `users/<id>`, OpenClaw публікує вбудовану картку схвалення (`cardsV2`) у вихідному просторі або гілці. Кнопки картки містять непрозорі токени зворотного виклику; запит ручного введення `/approve <id> <decision>` з’являється лише тоді, коли вбудоване доставлення недоступне.

## Цілі

Використовуйте ці ідентифікатори для доставлення та списків дозволених:

- Особисті повідомлення: `users/<userId>` (рекомендовано).
- Простори: `spaces/<spaceId>`.
- Необроблена адреса електронної пошти `name@example.com` може змінюватися й використовується для зіставлення зі списком дозволених, лише коли `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Застарілий варіант: `users/<email>` вважається ідентифікатором користувача, а не записом адреси електронної пошти в списку дозволених.
- Префікси `googlechat:`, `google-chat:` і `gchat:` приймаються та видаляються.

## Основні параметри конфігурації

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // або serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // лише перевірка доповнення; числовий ідентифікатор клієнта OAuth
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // необов’язково; допомагає виявляти згадки
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
          systemPrompt: "Лише короткі відповіді.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Примітки:

- Облікові дані сервісного облікового запису: `serviceAccountFile` (шлях), `serviceAccount` (вбудований рядок або об’єкт JSON) чи `serviceAccountRef` (SecretRef для змінної середовища або файлу). Змінні середовища `GOOGLE_CHAT_SERVICE_ACCOUNT` (вбудований JSON) і `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (шлях) застосовуються лише до облікового запису за замовчуванням. У конфігураціях із кількома обліковими записами використовується `channels.googlechat.accounts.<id>` із тими самими ключами, зокрема окремим `serviceAccountRef` для кожного облікового запису.
- Якщо `webhookPath` не встановлено, шлях вебхука за замовчуванням — `/googlechat`; натомість шлях можна вказати через `webhookUrl`.
- Ключами груп мають бути стабільні ідентифікатори просторів (`spaces/<spaceId>`). Ключі з відображуваними назвами застаріли, і це фіксується в журналі.
- `dangerouslyAllowNameMatching` повторно вмикає зіставлення змінних суб’єктів електронної пошти зі списками дозволених (режим аварійної сумісності); doctor попереджає про записи з адресами електронної пошти.
- Дії з реакціями Google Chat недоступні. Plugin використовує автентифікацію сервісного облікового запису, тоді як кінцеві точки реакцій Google Chat потребують автентифікації користувача. Наявна конфігурація `actions.reactions` приймається для сумісності, але не має жодного ефекту.
- Вбудовані картки схвалення використовують натискання кнопок Google Chat `cardsV2`, а не події реакцій. Схвалювачі беруться з `dm.allowFrom` або `defaultTo` та мають бути стабільними числовими значеннями `users/<id>`.
- Дії з повідомленнями надають лише текстову дію `send`. Для передавання вкладень Google Chat потрібна автентифікація користувача, тоді як цей plugin використовує автентифікацію сервісного облікового запису, тому вихідне передавання файлів недоступне.
- `typingIndicator`: `message` (за замовчуванням) публікує заповнювач `_<Bot> is typing..._` і замінює його першою відповіддю; `none` вимикає його; `reaction` потребує OAuth користувача й наразі повертається до `message` із записом помилки в журнал за автентифікації сервісного облікового запису.
- Вхідні вкладення (перше вкладення кожного повідомлення) завантажуються через Chat API до конвеєра медіаданих з обмеженням `mediaMaxMb` (за замовчуванням 20).
- Повідомлення, створені ботами, за замовчуванням ігноруються. За `allowBots: true` прийняті повідомлення ботів використовують спільний [захист від зациклення ботів](/uk/channels/bot-loop-protection): налаштуйте `channels.defaults.botLoopProtection`, а потім перевизначте через `channels.googlechat.botLoopProtection` або `channels.googlechat.groups.<space>.botLoopProtection`.

Докладніше про посилання на секрети: [Керування секретами](/uk/gateway/secrets).

## Усунення несправностей

### 405 Method Not Allowed

Якщо Google Cloud Logs Explorer показує помилки на кшталт:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Обробник вебхука не зареєстровано. Поширені причини:

1. **Канал не налаштовано**: розділ `channels.googlechat` відсутній. Перевірте за допомогою:

   ```bash
   openclaw config get channels.googlechat
   ```

   Якщо команда повертає "Config path not found", додайте конфігурацію (див. [Основні параметри конфігурації](#config-highlights)).

2. **Plugin не ввімкнено**: перевірте стан plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Якщо відображається "disabled", додайте `plugins.entries.googlechat.enabled: true` до конфігурації.

3. **Gateway не перезапущено** після змін конфігурації:

   ```bash
   openclaw gateway restart
   ```

Переконайтеся, що канал працює:

```bash
openclaw channels status
# Має відображатися: Google Chat default: enabled, configured, ...
```

### Інші проблеми

- `openclaw channels status --probe` показує помилки автентифікації та відсутню конфігурацію аудиторії (`audience` і `audienceType` є обов’язковими).
- Якщо повідомлення не надходять, перевірте URL-адресу вебхука та конфігурацію тригерів застосунку Chat.
- Якщо вимога згадки блокує відповіді, установіть `botUser` на ім’я ресурсу користувача застосунку та перевірте `requireMention`.
- `openclaw logs --follow` під час надсилання тестового повідомлення показує, чи досягають запити Gateway.

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Налаштування Gateway](/uk/gateway/configuration)
- [Групи](/uk/channels/groups) — поведінка групових чатів і обмеження згадок
- [Сполучення](/uk/channels/pairing) — автентифікація в особистих повідомленнях і процес сполучення
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
