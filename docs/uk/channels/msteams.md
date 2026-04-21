---
read_when:
    - Працюємо над функціями каналу Microsoft Teams
summary: Статус підтримки бота Microsoft Teams, можливості та конфігурація
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-21T20:37:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed973d8948bc5c5b44f5bc28f361e883389ececc70403c6631fb18ee1254d542
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> «Полиште всяку надію, ті, хто сюди входить».

Оновлено: 2026-03-25

Статус: підтримуються текст + вкладення в DM; надсилання файлів у канали/групи потребує `sharePointSiteId` + дозволів Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Опитування надсилаються через Adaptive Cards. Дії з повідомленнями надають явний `upload-file` для надсилань, де файл є основним.

## Вбудований Plugin

Microsoft Teams постачається як вбудований Plugin у поточних релізах OpenClaw, тому в звичайній пакетованій збірці окреме встановлення не потрібне.

Якщо ви використовуєте старішу збірку або власне встановлення без вбудованого Teams,
встановіть його вручну:

```bash
openclaw plugins install @openclaw/msteams
```

Локальний checkout (коли запускаєте з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Microsoft Teams доступний.
   - Поточні пакетовані релізи OpenClaw уже містять його вбудованим.
   - У старіших/власних встановленнях його можна додати вручну командами вище.
2. Створіть **Azure Bot** (App ID + client secret + tenant ID).
3. Налаштуйте OpenClaw з цими обліковими даними.
4. Відкрийте `/api/messages` (типово порт 3978) через публічний URL або тунель.
5. Встановіть пакет застосунку Teams і запустіть Gateway.

Мінімальна конфігурація (client secret):

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Для production-розгортань розгляньте використання [federated authentication](#federated-authentication-certificate--managed-identity) (сертифікат або managed identity) замість client secret.

Примітка: групові чати типово заблоковані (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` (або використайте `groupPolicy: "open"`, щоб дозволити будь-якому учаснику, за умови згадки).

## Цілі

- Спілкуватися з OpenClaw через Teams DM, групові чати або канали.
- Зберігати детерміновану маршрутизацію: відповіді завжди повертаються в канал, звідки вони надійшли.
- Типово використовувати безпечну поведінку в каналах (потрібні згадки, якщо не налаштовано інакше).

## Записи конфігурації

Типово Microsoft Teams дозволено записувати оновлення конфігурації, ініційовані `/config set|unset` (потрібно `commands.config: true`).

Вимкнути можна так:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Контроль доступу (DM + групи)

**Доступ до DM**

- Типово: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються, доки їх не буде схвалено.
- `channels.msteams.allowFrom` має використовувати стабільні AAD object ID.
- UPN/display name є змінними; пряме зіставлення типово вимкнене й вмикається лише через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер налаштування може зіставляти імена з ID через Microsoft Graph, якщо це дозволяють облікові дані.

**Груповий доступ**

- Типово: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, доки ви не додасте `groupAllowFrom`). Використайте `channels.defaults.groupPolicy`, щоб змінити типове значення, якщо його не задано.
- `channels.msteams.groupAllowFrom` визначає, які відправники можуть ініціювати взаємодію в групових чатах/каналах (з резервним переходом до `channels.msteams.allowFrom`).
- Установіть `groupPolicy: "open"`, щоб дозволити будь-якому учаснику (типово все одно потрібна згадка).
- Щоб **заборонити всі канали**, установіть `channels.msteams.groupPolicy: "disabled"`.

Приклад:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + allowlist каналів**

- Обмежуйте відповіді в групах/каналах, перелічивши команди Teams і канали в `channels.msteams.teams`.
- Ключі мають використовувати стабільні team ID і channel conversation ID.
- Коли `groupPolicy="allowlist"` і присутній allowlist Teams, приймаються лише перелічені команди/канали (за умови згадки).
- Майстер налаштування приймає записи `Team/Channel` і зберігає їх для вас.
- Під час запуску OpenClaw зіставляє назви team/channel і allowlist користувачів з ID (коли це дозволяють дозволи Graph)
  і журналює це зіставлення; нерозпізнані назви team/channel зберігаються в тому вигляді, як були введені, але типово ігноруються для маршрутизації, якщо не ввімкнено `channels.msteams.dangerouslyAllowNameMatching: true`.

Приклад:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Як це працює

1. Переконайтеся, що Plugin Microsoft Teams доступний.
   - Поточні пакетовані релізи OpenClaw уже містять його вбудованим.
   - У старіших/власних встановленнях його можна додати вручну командами вище.
2. Створіть **Azure Bot** (App ID + secret + tenant ID).
3. Створіть **пакет застосунку Teams**, який посилається на бота й містить наведені нижче дозволи RSC.
4. Завантажте/встановіть застосунок Teams у команду (або в особистий scope для DM).
5. Налаштуйте `msteams` у `~/.openclaw/openclaw.json` (або через env vars) і запустіть Gateway.
6. Gateway типово слухає webhook-трафік Bot Framework на `/api/messages`.

## Налаштування Azure Bot (передумови)

Перш ніж налаштовувати OpenClaw, потрібно створити ресурс Azure Bot.

### Крок 1: Створіть Azure Bot

1. Перейдіть до [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Заповніть вкладку **Basics**:

   | Поле               | Значення                                                 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Назва вашого бота, наприклад `openclaw-msteams` (має бути унікальною) |
   | **Subscription**   | Виберіть свою підписку Azure                             |
   | **Resource group** | Створіть нову або використайте наявну                    |
   | **Pricing tier**   | **Free** для dev/тестування                              |
   | **Type of App**    | **Single Tenant** (рекомендовано — див. примітку нижче)  |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Сповіщення про застарівання:** створення нових multi-tenant ботів було застарілим після 2025-07-31. Для нових ботів використовуйте **Single Tenant**.

3. Натисніть **Review + create** → **Create** (зачекайте приблизно 1–2 хвилини)

### Крок 2: Отримайте облікові дані

1. Перейдіть до ресурсу Azure Bot → **Configuration**
2. Скопіюйте **Microsoft App ID** → це ваш `appId`
3. Натисніть **Manage Password** → перейдіть до App Registration
4. У розділі **Certificates & secrets** → **New client secret** → скопіюйте **Value** → це ваш `appPassword`
5. Перейдіть до **Overview** → скопіюйте **Directory (tenant) ID** → це ваш `tenantId`

### Крок 3: Налаштуйте Messaging endpoint

1. У Azure Bot → **Configuration**
2. Установіть **Messaging endpoint** на URL вашого webhook:
   - Production: `https://your-domain.com/api/messages`
   - Локальна розробка: використайте тунель (див. [Локальна розробка](#local-development-tunneling) нижче)

### Крок 4: Увімкніть канал Teams

1. У Azure Bot → **Channels**
2. Натисніть **Microsoft Teams** → Configure → Save
3. Прийміть Terms of Service

## Federated Authentication (Certificate + Managed Identity)

> Додано в 2026.3.24

Для production-розгортань OpenClaw підтримує **federated authentication** як безпечнішу альтернативу client secret. Доступні два методи:

### Варіант A: автентифікація на основі сертифіката

Використовуйте PEM-сертифікат, зареєстрований у вашому застосунку Entra ID app registration.

**Налаштування:**

1. Згенеруйте або отримайте сертифікат (формат PEM із приватним ключем).
2. У Entra ID → App Registration → **Certificates & secrets** → **Certificates** → завантажте публічний сертифікат.

**Конфігурація:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Варіант B: Azure Managed Identity

Використовуйте Azure Managed Identity для автентифікації без пароля. Це ідеально для розгортань в інфраструктурі Azure (AKS, App Service, Azure VMs), де доступна managed identity.

**Як це працює:**

1. Pod/VM бота має managed identity (system-assigned або user-assigned).
2. **Federated identity credential** пов’язує managed identity із застосунком Entra ID app registration.
3. Під час виконання OpenClaw використовує `@azure/identity`, щоб отримувати токени з endpoint Azure IMDS (`169.254.169.254`).
4. Токен передається в Teams SDK для автентифікації бота.

**Передумови:**

- Інфраструктура Azure з увімкненою managed identity (AKS workload identity, App Service, VM)
- Створений federated identity credential у застосунку Entra ID app registration
- Мережевий доступ до IMDS (`169.254.169.254:80`) з pod/VM

**Конфігурація (system-assigned managed identity):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Конфігурація (user-assigned managed identity):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Env vars:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (лише для user-assigned)

### Налаштування AKS Workload Identity

Для розгортань AKS із workload identity:

1. **Увімкніть workload identity** у своєму кластері AKS.
2. **Створіть federated identity credential** у застосунку Entra ID app registration:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Додайте анотацію до service account Kubernetes** із client ID застосунку:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Додайте label до pod** для інʼєкції workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Переконайтеся в наявності мережевого доступу** до IMDS (`169.254.169.254`) — якщо використовується NetworkPolicy, додайте правило egress, що дозволяє трафік до `169.254.169.254/32` на порт 80.

### Порівняння типів автентифікації

| Метод                | Конфігурація                                   | Переваги                           | Недоліки                              |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Просте налаштування                | Потрібна ротація секретів, менш безпечно |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Немає спільного секрету в мережі   | Додаткові витрати на керування сертифікатами |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Без пароля, не потрібно керувати секретами | Потрібна інфраструктура Azure         |

**Типова поведінка:** якщо `authType` не задано, OpenClaw типово використовує автентифікацію через client secret. Наявні конфігурації продовжують працювати без змін.

## Локальна розробка (тунелювання)

Teams не може дістатися до `localhost`. Для локальної розробки використовуйте тунель:

**Варіант A: ngrok**

```bash
ngrok http 3978
# Скопіюйте https URL, наприклад https://abc123.ngrok.io
# Установіть messaging endpoint на: https://abc123.ngrok.io/api/messages
```

**Варіант B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Використовуйте ваш URL Tailscale funnel як messaging endpoint
```

## Teams Developer Portal (альтернатива)

Замість ручного створення ZIP-файлу маніфесту, ви можете скористатися [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Натисніть **+ New app**
2. Заповніть базову інформацію (назва, опис, інформація про розробника)
3. Перейдіть до **App features** → **Bot**
4. Виберіть **Enter a bot ID manually** і вставте App ID вашого Azure Bot
5. Позначте scope: **Personal**, **Team**, **Group Chat**
6. Натисніть **Distribute** → **Download app package**
7. У Teams: **Apps** → **Manage your apps** → **Upload a custom app** → виберіть ZIP

Це часто простіше, ніж редагувати JSON-маніфести вручну.

## Тестування бота

**Варіант A: Azure Web Chat (спочатку перевірте webhook)**

1. У Azure Portal → ваш ресурс Azure Bot → **Test in Web Chat**
2. Надішліть повідомлення — ви маєте побачити відповідь
3. Це підтверджує, що ваш endpoint webhook працює до налаштування Teams

**Варіант B: Teams (після встановлення застосунку)**

1. Встановіть застосунок Teams (sideload або через org catalog)
2. Знайдіть бота в Teams і надішліть DM
3. Перевірте журнали Gateway на вхідну activity

## Налаштування (мінімальний лише текстовий режим)

1. **Переконайтеся, що Plugin Microsoft Teams доступний**
   - Поточні пакетовані релізи OpenClaw уже містять його вбудованим.
   - У старіших/власних встановленнях його можна додати вручну:
     - З npm: `openclaw plugins install @openclaw/msteams`
     - Із локального checkout: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Реєстрація бота**
   - Створіть Azure Bot (див. вище) і занотуйте:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Маніфест застосунку Teams**
   - Додайте запис `bot` із `botId = <App ID>`.
   - Scope: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (потрібно для обробки файлів в особистому scope).
   - Додайте дозволи RSC (нижче).
   - Створіть іконки: `outline.png` (32x32) і `color.png` (192x192).
   - Заархівуйте всі три файли разом: `manifest.json`, `outline.png`, `color.png`.

4. **Налаштуйте OpenClaw**

   ```json5
   {
     channels: {
       msteams: {
         enabled: true,
         appId: "<APP_ID>",
         appPassword: "<APP_PASSWORD>",
         tenantId: "<TENANT_ID>",
         webhook: { port: 3978, path: "/api/messages" },
       },
     },
   }
   ```

   Ви також можете використовувати змінні середовища замість ключів конфігурації:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE` (необов’язково: `"secret"` або `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (необов’язково, не потрібен для автентифікації)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (лише для user-assigned MI)

5. **Endpoint бота**
   - Установіть Azure Bot Messaging Endpoint на:
     - `https://<host>:3978/api/messages` (або ваш вибраний path/port).

6. **Запустіть Gateway**
   - Канал Teams запускається автоматично, коли доступний вбудований або встановлений вручну Plugin і наявна конфігурація `msteams` з обліковими даними.

## Дія інформації про учасника

OpenClaw надає підтримувану Graph дію `member-info` для Microsoft Teams, щоб агенти й автоматизації могли напряму отримувати відомості про учасників каналу (display name, email, role) з Microsoft Graph.

Вимоги:

- Дозвіл RSC `Member.Read.Group` (уже є в рекомендованому маніфесті)
- Для міжкомандного пошуку: дозвіл Graph Application `User.Read.All` з admin consent

Дія контролюється `channels.msteams.actions.memberInfo` (типово: увімкнено, коли доступні облікові дані Graph).

## Контекст історії

- `channels.msteams.historyLimit` визначає, скільки останніх повідомлень каналу/групи буде загорнуто в prompt.
- Використовує резервне значення з `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути (типово 50).
- Отримана історія гілки фільтрується за allowlist відправників (`allowFrom` / `groupAllowFrom`), тож початкове заповнення контексту гілки включає лише повідомлення від дозволених відправників.
- Контекст quoted attachment (`ReplyTo*`, похідний від HTML відповіді Teams) наразі передається як отримано.
- Інакше кажучи, allowlist керують тим, хто може запускати агента; сьогодні фільтруються лише окремі шляхи додаткового контексту.
- Історію DM можна обмежити через `channels.msteams.dmHistoryLimit` (ходи користувача). Перевизначення для окремих користувачів: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи Teams RSC (маніфест)

Це **наявні resourceSpecific permissions** у нашому маніфесті застосунку Teams. Вони застосовуються лише в межах команди/чату, де встановлено застосунок.

**Для каналів (scope команди):**

- `ChannelMessage.Read.Group` (Application) — отримання тексту всіх повідомлень каналу без @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Для групових чатів:**

- `ChatMessage.Read.Chat` (Application) — отримання всіх повідомлень групового чату без @mention

## Приклад маніфесту Teams (з редагуванням чутливих даних)

Мінімальний, коректний приклад з обов’язковими полями. Замініть ID та URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Застереження щодо маніфесту (обов’язкові поля)

- `bots[].botId` **має** збігатися з App ID Azure Bot.
- `webApplicationInfo.id` **має** збігатися з App ID Azure Bot.
- `bots[].scopes` мають включати поверхні, які ви плануєте використовувати (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` потрібен для обробки файлів в особистому scope.
- `authorization.permissions.resourceSpecific` мають включати читання/надсилання в канали, якщо ви хочете каналовий трафік.

### Оновлення наявного застосунку

Щоб оновити вже встановлений застосунок Teams (наприклад, щоб додати дозволи RSC):

1. Оновіть `manifest.json` новими налаштуваннями
2. **Збільште поле `version`** (наприклад, `1.0.0` → `1.1.0`)
3. **Повторно заархівуйте** маніфест з іконками (`manifest.json`, `outline.png`, `color.png`)
4. Завантажте новий zip:
   - **Варіант A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → знайдіть свій застосунок → Upload new version
   - **Варіант B (Sideload):** у Teams → Apps → Manage your apps → Upload a custom app
5. **Для каналів команди:** перевстановіть застосунок у кожній команді, щоб нові дозволи набули чинності
6. **Повністю закрийте й знову запустіть Teams** (не просто закрийте вікно), щоб очистити кешовані метадані застосунку

## Можливості: лише RSC проти Graph

### З **лише Teams RSC** (застосунок встановлено, без дозволів Graph API)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання файлових вкладень у **personal (DM)**.

НЕ працює:

- **Зображення або вміст файлів** у каналах/групах (payload містить лише HTML-заглушку).
- Завантаження вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень (поза live webhook event).

### З **Teams RSC + дозволами Microsoft Graph Application**

Додається:

- Завантаження hosted contents (зображення, вставлені в повідомлення).
- Завантаження файлових вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень каналу/чату через Graph.

### RSC проти Graph API

| Можливість             | Дозволи RSC          | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **Повідомлення в реальному часі** | Так (через webhook)  | Ні (лише polling)                   |
| **Історичні повідомлення** | Ні               | Так (можна запитувати історію)      |
| **Складність налаштування** | Лише маніфест застосунку | Потрібні admin consent + token flow |
| **Працює офлайн**      | Ні (має працювати)   | Так (можна запитувати будь-коли)    |

**Висновок:** RSC призначений для прослуховування в реальному часі; Graph API — для історичного доступу. Щоб наздоганяти пропущені повідомлення під час офлайну, вам потрібен Graph API з `ChannelMessage.Read.All` (потрібен admin consent).

## Graph-enabled media + history (потрібно для каналів)

Якщо вам потрібні зображення/файли в **каналах** або потрібно отримувати **історію повідомлень**, необхідно ввімкнути дозволи Microsoft Graph і надати admin consent.

1. У **App Registration** Entra ID (Azure AD) додайте дозволи Microsoft Graph **Application permissions**:
   - `ChannelMessage.Read.All` (вкладення каналів + історія)
   - `Chat.Read.All` або `ChatMessage.Read.All` (групові чати)
2. **Надайте admin consent** для tenant.
3. Збільште **версію маніфесту** застосунку Teams, повторно завантажте його й **перевстановіть застосунок у Teams**.
4. **Повністю закрийте й знову запустіть Teams**, щоб очистити кешовані метадані застосунку.

**Додатковий дозвіл для згадок користувачів:** @mentions користувачів працюють відразу для користувачів у поточній розмові. Однак якщо ви хочете динамічно шукати й згадувати користувачів, які **не перебувають у поточній розмові**, додайте дозвіл `User.Read.All` (Application) і надайте admin consent.

## Відомі обмеження

### Тайм-аути webhook

Teams доставляє повідомлення через HTTP webhook. Якщо обробка триває надто довго (наприклад, через повільні відповіді LLM), ви можете побачити:

- тайм-аути Gateway
- повторні спроби Teams доставити повідомлення (що спричиняє дублікати)
- втрачені відповіді

OpenClaw обробляє це, швидко повертаючи відповідь і надсилаючи відповіді проактивно, але дуже повільні відповіді все одно можуть спричиняти проблеми.

### Форматування

Markdown у Teams більш обмежений, ніж у Slack або Discord:

- Базове форматування працює: **жирний**, _курсив_, `code`, посилання
- Складний markdown (таблиці, вкладені списки) може відображатися некоректно
- Adaptive Cards підтримуються для опитувань і semantic presentation sends (див. нижче)

## Конфігурація

Ключові налаштування (див. `/gateway/configuration` для спільних шаблонів каналів):

- `channels.msteams.enabled`: увімкнути/вимкнути канал.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: облікові дані бота.
- `channels.msteams.webhook.port` (типово `3978`)
- `channels.msteams.webhook.path` (типово `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing)
- `channels.msteams.allowFrom`: allowlist для DM (рекомендовано AAD object ID). Майстер налаштування зіставляє імена з ID під час налаштування, коли доступний доступ до Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: аварійний перемикач для повторного ввімкнення зіставлення за змінними UPN/display-name та прямої маршрутизації за назвами team/channel.
- `channels.msteams.textChunkLimit`: розмір фрагмента вихідного тексту.
- `channels.msteams.chunkMode`: `length` (типово) або `newline`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.msteams.mediaAllowHosts`: allowlist для хостів вхідних вкладень (типово домени Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist для додавання заголовків Authorization під час повторних спроб отримання медіа (типово хости Graph + Bot Framework).
- `channels.msteams.requireMention`: вимагати @mention у каналах/групах (типово true).
- `channels.msteams.replyStyle`: `thread | top-level` (див. [Стиль відповіді](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.requireMention`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.tools`: типові перевизначення політики інструментів для команди (`allow`/`deny`/`alsoAllow`), які використовуються, коли немає перевизначення для каналу.
- `channels.msteams.teams.<teamId>.toolsBySender`: типові перевизначення політики інструментів для команди за відправником (підтримується wildcard `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: перевизначення політики інструментів для каналу (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: перевизначення політики інструментів для каналу за відправником (підтримується wildcard `"*"`).
- Ключі `toolsBySender` мають використовувати явні префікси:
  `id:`, `e164:`, `username:`, `name:` (застарілі ключі без префікса, як і раніше, зіставляються лише з `id:`).
- `channels.msteams.actions.memberInfo`: увімкнути або вимкнути дію інформації про учасника на основі Graph (типово: увімкнено, коли доступні облікові дані Graph).
- `channels.msteams.authType`: тип автентифікації — `"secret"` (типово) або `"federated"`.
- `channels.msteams.certificatePath`: шлях до PEM-файлу сертифіката (federated + автентифікація сертифікатом).
- `channels.msteams.certificateThumbprint`: thumbprint сертифіката (необов’язково, не потрібен для автентифікації).
- `channels.msteams.useManagedIdentity`: увімкнути автентифікацію через managed identity (режим federated).
- `channels.msteams.managedIdentityClientId`: client ID для user-assigned managed identity.
- `channels.msteams.sharePointSiteId`: SharePoint site ID для вивантаження файлів у групових чатах/каналах (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)).

## Маршрутизація й сесії

- Ключі сесій відповідають стандартному формату агента (див. [/concepts/session](/uk/concepts/session)):
  - Direct messages спільно використовують основну сесію (`agent:<agentId>:<mainKey>`).
  - Повідомлення каналу/групи використовують conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль відповіді: Threads проти Posts

Нещодавно Teams запровадив два стилі UI каналів поверх тієї самої базової моделі даних:

| Стиль                  | Опис                                                      | Рекомендований `replyStyle` |
| ---------------------- | --------------------------------------------------------- | --------------------------- |
| **Posts** (класичний)  | Повідомлення відображаються як картки з гілками відповідей під ними | `thread` (типово)           |
| **Threads** (як у Slack) | Повідомлення йдуть лінійно, більше схоже на Slack      | `top-level`                 |

**Проблема:** API Teams не показує, який стиль UI використовує канал. Якщо використати неправильний `replyStyle`:

- `thread` у каналі стилю Threads → відповіді виглядають незграбно вкладеними
- `top-level` у каналі стилю Posts → відповіді з’являються як окремі повідомлення верхнього рівня, а не в гілці

**Рішення:** Налаштуйте `replyStyle` для кожного каналу залежно від того, як налаштований канал:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Вкладення та зображення

**Поточні обмеження:**

- **DM:** зображення й файлові вкладення працюють через API файлів ботів Teams.
- **Канали/групи:** вкладення живуть у сховищі M365 (SharePoint/OneDrive). Payload webhook містить лише HTML-заглушку, а не фактичні байти файлу. **Для завантаження вкладень каналу потрібні дозволи Graph API**.
- Для явних надсилань, де файл є основним, використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов’язковий `message` стає супровідним текстом/коментарем, а `filename` перевизначає назву завантаженого файлу.

Без дозволів Graph повідомлення каналів із зображеннями надходитимуть лише як текст (вміст зображення для бота недоступний).
Типово OpenClaw завантажує медіа лише з хостів Microsoft/Teams. Перевизначайте це через `channels.msteams.mediaAllowHosts` (використайте `["*"]`, щоб дозволити будь-який хост).
Заголовки Authorization додаються лише для хостів у `channels.msteams.mediaAuthAllowHosts` (типово хости Graph + Bot Framework). Тримайте цей список строгим (уникайте multi-tenant суфіксів).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в DM через потік FileConsentCard (вбудований). Однак **надсилання файлів у групових чатах/каналах** потребує додаткового налаштування:

| Контекст                 | Як надсилаються файли                     | Потрібне налаштування                           |
| ------------------------ | ---------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → користувач приймає → бот вивантажує | Працює одразу                                    |
| **Групові чати/канали**  | Вивантаження в SharePoint → посилання для спільного доступу | Потрібні `sharePointSiteId` + дозволи Graph |
| **Зображення (будь-який контекст)** | Inline у кодуванні Base64         | Працює одразу                                    |

### Чому груповим чатам потрібен SharePoint

Боти не мають особистого диска OneDrive (endpoint Graph API `/me/drive` не працює для application identities). Щоб надсилати файли в групових чатах/каналах, бот вивантажує їх на **сайт SharePoint** і створює посилання для спільного доступу.

### Налаштування

1. **Додайте дозволи Graph API** в Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) — вивантаження файлів у SharePoint
   - `Chat.Read.All` (Application) — необов’язково, вмикає посилання для спільного доступу для окремих користувачів

2. **Надайте admin consent** для tenant.

3. **Отримайте ваш SharePoint site ID:**

   ```bash
   # Через Graph Explorer або curl з чинним токеном:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Приклад: для сайту за адресою "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Відповідь містить: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Налаштуйте OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Поведінка спільного доступу

| Дозвіл                                  | Поведінка спільного доступу                                |
| --------------------------------------- | ---------------------------------------------------------- |
| `Sites.ReadWrite.All` only              | Посилання для спільного доступу на рівні організації (доступне будь-кому в org) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Посилання для спільного доступу для окремих користувачів (доступне лише учасникам чату) |

Спільний доступ для окремих користувачів безпечніший, оскільки доступ до файлу мають лише учасники чату. Якщо дозвіл `Chat.Read.All` відсутній, бот повертається до спільного доступу на рівні організації.

### Резервна поведінка

| Сценарій                                         | Результат                                           |
| ------------------------------------------------ | --------------------------------------------------- |
| Груповий чат + файл + налаштовано `sharePointSiteId` | Вивантаження в SharePoint, надсилання посилання для спільного доступу |
| Груповий чат + файл + немає `sharePointSiteId`   | Спроба вивантаження в OneDrive (може не вдатися), надсилання лише тексту |
| Особистий чат + файл                             | Потік FileConsentCard (працює без SharePoint)      |
| Будь-який контекст + зображення                  | Inline у кодуванні Base64 (працює без SharePoint)  |

### Де зберігаються файли

Вивантажені файли зберігаються в папці `/OpenClawShared/` у типовій бібліотеці документів налаштованого сайту SharePoint.

## Опитування (Adaptive Cards)

OpenClaw надсилає опитування Teams як Adaptive Cards (рідного API опитувань Teams немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоси записуються Gateway у `~/.openclaw/msteams-polls.json`.
- Gateway має залишатися онлайн, щоб записувати голоси.
- Опитування поки не публікують підсумки результатів автоматично (за потреби перегляньте файл сховища).

## Картки presentation

Надсилайте семантичні payload presentation користувачам Teams або в розмови через інструмент `message` або CLI. OpenClaw відтворює їх як Teams Adaptive Cards із загального контракту presentation.

Параметр `presentation` приймає семантичні блоки. Якщо задано `presentation`, текст повідомлення є необов’язковим.

**Інструмент агента:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Докладно про формат цілі див. [Формати цілі](#target-formats) нижче.

## Формати цілі

Цілі MSTeams використовують префікси, щоб розрізняти користувачів і розмови:

| Тип цілі               | Формат                           | Приклад                                             |
| ---------------------- | -------------------------------- | --------------------------------------------------- |
| Користувач (за ID)     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Користувач (за ім’ям)  | `user:<display-name>`            | `user:John Smith` (потрібен Graph API)              |
| Група/канал            | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Група/канал (raw)      | `<conversation-id>`              | `19:abc123...@thread.tacv2` (якщо містить `@thread`) |

**Приклади CLI:**

```bash
# Надіслати користувачу за ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Надіслати користувачу за display name (викликає пошук через Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Надіслати в груповий чат або канал
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Надіслати картку presentation у розмову
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Приклади інструмента агента:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

Примітка: без префікса `user:` імена типово трактуються як цілі групи/команди. Завжди використовуйте `user:`, коли націлюєтеся на людей за display name.

## Проактивні повідомлення

- Проактивні повідомлення можливі лише **після** взаємодії користувача, оскільки саме тоді ми зберігаємо посилання на розмову.
- Див. `/gateway/configuration` для `dmPolicy` і керування через allowlist.

## ID команд і каналів (поширена пастка)

Параметр запиту `groupId` в URL Teams — **НЕ** той ID команди, який використовується для конфігурації. Натомість витягуйте ID зі шляху URL:

**URL команди:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID команди (декодуйте URL)
```

**URL каналу:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID каналу (декодуйте URL)
```

**Для конфігурації:**

- ID команди = сегмент шляху після `/team/` (після URL-декодування, наприклад `19:Bk4j...@thread.tacv2`)
- ID каналу = сегмент шляху після `/channel/` (після URL-декодування)
- Параметр запиту `groupId` **ігноруйте**

## Приватні канали

Боти мають обмежену підтримку в приватних каналах:

| Функція                      | Стандартні канали | Приватні канали       |
| --------------------------- | ----------------- | --------------------- |
| Встановлення бота           | Так               | Обмежено              |
| Повідомлення в реальному часі (webhook) | Так     | Може не працювати     |
| Дозволи RSC                 | Так               | Можуть поводитися інакше |
| @mentions                   | Так               | Якщо бот доступний    |
| Історія через Graph API     | Так               | Так (з дозволами)     |

**Обхідні варіанти, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом
2. Використовуйте DM — користувачі завжди можуть писати боту напряму
3. Використовуйте Graph API для історичного доступу (потрібен `ChannelMessage.Read.All`)

## Усунення несправностей

### Поширені проблеми

- **Зображення не відображаються в каналах:** відсутні дозволи Graph або admin consent. Перевстановіть застосунок Teams і повністю закрийте/заново відкрийте Teams.
- **Немає відповідей у каналі:** типово потрібні згадки; установіть `channels.msteams.requireMention=false` або налаштуйте це для окремої команди/каналу.
- **Невідповідність версій (Teams усе ще показує старий маніфест):** видаліть і повторно додайте застосунок та повністю закрийте Teams, щоб оновити стан.
- **401 Unauthorized від webhook:** це очікувано під час ручного тестування без Azure JWT — означає, що endpoint досяжний, але автентифікація не пройшла. Для коректної перевірки використовуйте Azure Web Chat.

### Помилки завантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли іконок розміром 0 байтів. Створіть коректні PNG-іконки (`outline.png` 32x32, `color.png` 192x192).
- **"webApplicationInfo.Id already in use":** застосунок усе ще встановлений в іншій команді/чаті. Спочатку знайдіть і видаліть його або зачекайте 5–10 хвилин на поширення змін.
- **"Something went wrong" під час завантаження:** завантажте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools у браузері (F12) → вкладка Network і перевірте тіло відповіді на фактичну помилку.
- **Sideload не працює:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app" — це часто обходить обмеження sideload.

### Дозволи RSC не працюють

1. Переконайтеся, що `webApplicationInfo.id` точно збігається з App ID вашого бота
2. Повторно завантажте застосунок і перевстановіть його в команді/чаті
3. Перевірте, чи адміністратор вашої org не заблокував дозволи RSC
4. Підтвердьте, що використовуєте правильний scope: `ChannelMessage.Read.Group` для команд, `ChatMessage.Read.Chat` для групових чатів

## Посилання

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - посібник із налаштування Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - створення та керування застосунками Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для каналу/групи потрібен Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Пов’язане

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Groups](/uk/channels/groups) — поведінка групового чату й керування через згадки
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та посилення захисту
