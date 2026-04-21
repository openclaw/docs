---
read_when:
    - Робота над функціями каналу Microsoft Teams
summary: Статус підтримки бота Microsoft Teams, можливості та налаштування
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-21T21:27:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9d52fb2cc7801e84249a705e0fa2052d4afbb7ef58cee2d3362b3e7012348c
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> «Полиште надію всяк, хто входить сюди».

Статус: підтримуються текст + вкладення DM; надсилання файлів у канали/групи потребує `sharePointSiteId` + дозволів Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Опитування надсилаються через Adaptive Cards. Дії з повідомленнями надають явний `upload-file` для надсилань, де файл є основним.

## Вбудований Plugin

Microsoft Teams постачається як вбудований Plugin у поточних релізах OpenClaw, тож
в окремому встановленні немає потреби у звичайній пакетованій збірці.

Якщо ви використовуєте старішу збірку або спеціальне встановлення, що не містить вбудований Teams,
встановіть його вручну:

```bash
openclaw plugins install @openclaw/msteams
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування (для початківців)

1. Переконайтеся, що Plugin Microsoft Teams доступний.
   - Поточні пакетовані релізи OpenClaw уже містять його вбудовано.
   - У старіших/спеціальних встановленнях його можна додати вручну командами вище.
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

Примітка: групові чати типово заблоковані (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` (або використайте `groupPolicy: "open"`, щоб дозволити будь-якому учаснику, з обов’язковою згадкою).

## Цілі

- Спілкуватися з OpenClaw через Teams DM, групові чати або канали.
- Зберігати детерміновану маршрутизацію: відповіді завжди повертаються в той канал, звідки вони надійшли.
- Типово використовувати безпечну поведінку каналу (згадки обов’язкові, якщо не налаштовано інакше).

## Запис конфігурації

Типово Microsoft Teams дозволено записувати оновлення конфігурації, ініційовані `/config set|unset` (потребує `commands.config: true`).

Щоб вимкнути:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Керування доступом (DM + групи)

**Доступ до DM**

- Типово: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються, доки їх не схвалять.
- `channels.msteams.allowFrom` має використовувати стабільні AAD object ID.
- UPN/display name можуть змінюватися; пряме зіставлення типово вимкнене й вмикається лише через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер налаштування може зіставляти імена з ID через Microsoft Graph, якщо це дозволяють облікові дані.

**Доступ до груп**

- Типово: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, доки ви не додасте `groupAllowFrom`). Використовуйте `channels.defaults.groupPolicy`, щоб змінити типову поведінку, якщо значення не задане.
- `channels.msteams.groupAllowFrom` визначає, які відправники можуть ініціювати дію в групових чатах/каналах (з резервним використанням `channels.msteams.allowFrom`).
- Установіть `groupPolicy: "open"`, щоб дозволити будь-якого учасника (типово все одно потрібна згадка).
- Щоб заборонити **усі канали**, задайте `channels.msteams.groupPolicy: "disabled"`.

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

- Обмежуйте відповіді в групах/каналах, перелічуючи teams і канали в `channels.msteams.teams`.
- Ключі мають використовувати стабільні team ID і channel conversation ID.
- Коли `groupPolicy="allowlist"` і задано allowlist teams, приймаються лише перелічені teams/канали (з обов’язковою згадкою).
- Майстер налаштування приймає записи `Team/Channel` і збереже їх для вас.
- Під час запуску OpenClaw зіставляє team/channel та імена користувачів з ID (коли це дозволяють дозволи Graph)
  і записує зіставлення в журнал; нерозпізнані назви team/channel зберігаються як введені, але типово ігноруються для маршрутизації, якщо не ввімкнено `channels.msteams.dangerouslyAllowNameMatching: true`.

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
   - Поточні пакетовані релізи OpenClaw уже містять його вбудовано.
   - У старіших/спеціальних встановленнях його можна додати вручну командами вище.
2. Створіть **Azure Bot** (App ID + secret + tenant ID).
3. Зберіть **пакет застосунку Teams**, який посилається на бота й містить дозволи RSC нижче.
4. Завантажте/встановіть застосунок Teams у team (або в personal scope для DM).
5. Налаштуйте `msteams` у `~/.openclaw/openclaw.json` (або через env vars) і запустіть Gateway.
6. Gateway типово слухає webhook-трафік Bot Framework на `/api/messages`.

## Налаштування Azure Bot (передумови)

Перш ніж налаштовувати OpenClaw, потрібно створити ресурс Azure Bot.

### Крок 1: Створіть Azure Bot

1. Перейдіть до [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Заповніть вкладку **Basics**:

   | Field              | Value                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Назва вашого бота, наприклад `openclaw-msteams` (має бути унікальною) |
   | **Subscription**   | Виберіть вашу підписку Azure                             |
   | **Resource group** | Створіть нову або використайте наявну                    |
   | **Pricing tier**   | **Free** для розробки/тестування                         |
   | **Type of App**    | **Single Tenant** (рекомендовано — див. примітку нижче)  |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Повідомлення про застарівання:** створення нових multi-tenant ботів застаріло після 2025-07-31. Для нових ботів використовуйте **Single Tenant**.

3. Натисніть **Review + create** → **Create** (зачекайте ~1-2 хвилини)

### Крок 2: Отримайте облікові дані

1. Перейдіть до ресурсу Azure Bot → **Configuration**
2. Скопіюйте **Microsoft App ID** → це ваш `appId`
3. Натисніть **Manage Password** → перейдіть до App Registration
4. У розділі **Certificates & secrets** → **New client secret** → скопіюйте **Value** → це ваш `appPassword`
5. Перейдіть до **Overview** → скопіюйте **Directory (tenant) ID** → це ваш `tenantId`

### Крок 3: Налаштуйте кінцеву точку обміну повідомленнями

1. У Azure Bot → **Configuration**
2. Установіть **Messaging endpoint** на ваш webhook URL:
   - Production: `https://your-domain.com/api/messages`
   - Локальна розробка: використайте тунель (див. [Локальна розробка](#local-development-tunneling) нижче)

### Крок 4: Увімкніть канал Teams

1. У Azure Bot → **Channels**
2. Натисніть **Microsoft Teams** → Configure → Save
3. Прийміть Terms of Service

## Federated Authentication (сертифікат + managed identity)

> Додано в 2026.3.24

Для production-розгортань OpenClaw підтримує **federated authentication** як безпечнішу альтернативу client secret. Доступні два методи:

### Варіант A: автентифікація на основі сертифіката

Використовуйте PEM-сертифікат, зареєстрований у вашому застосунку Entra ID.

**Налаштування:**

1. Згенеруйте або отримайте сертифікат (формат PEM із private key).
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

Використовуйте Azure Managed Identity для автентифікації без пароля. Це ідеальний варіант для розгортань в інфраструктурі Azure (AKS, App Service, Azure VM), де доступна managed identity.

**Як це працює:**

1. Pod/VM бота має managed identity (system-assigned або user-assigned).
2. **Federated identity credential** пов’язує managed identity із застосунком Entra ID.
3. Під час виконання OpenClaw використовує `@azure/identity`, щоб отримувати токени з кінцевої точки Azure IMDS (`169.254.169.254`).
4. Токен передається до Teams SDK для автентифікації бота.

**Передумови:**

- Інфраструктура Azure з увімкненою managed identity (AKS workload identity, App Service, VM)
- Створений federated identity credential у застосунку Entra ID
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

1. **Увімкніть workload identity** у вашому кластері AKS.
2. **Створіть federated identity credential** у застосунку Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Додайте анотацію до service account Kubernetes** з app client ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Додайте мітку pod** для ін’єкції workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Забезпечте мережевий доступ** до IMDS (`169.254.169.254`) — якщо ви використовуєте NetworkPolicy, додайте правило egress, яке дозволяє трафік до `169.254.169.254/32` на порт 80.

### Порівняння типів автентифікації

| Method               | Config                                         | Pros                               | Cons                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Просте налаштування                | Потрібна ротація секретів, менш безпечно |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Немає спільного секрету в мережі   | Додаткове навантаження на керування сертифікатами |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Автентифікація без пароля, не треба керувати секретами | Потрібна інфраструктура Azure         |

**Поведінка за замовчуванням:** якщо `authType` не задано, OpenClaw типово використовує автентифікацію через client secret. Наявні конфігурації й надалі працюватимуть без змін.

## Локальна розробка (тунелювання)

Teams не може звертатися до `localhost`. Для локальної розробки використовуйте тунель:

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

Замість ручного створення ZIP-файлу маніфесту ви можете скористатися [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Натисніть **+ New app**
2. Заповніть базову інформацію (назва, опис, інформація про розробника)
3. Перейдіть до **App features** → **Bot**
4. Виберіть **Enter a bot ID manually** і вставте ваш Azure Bot App ID
5. Позначте області: **Personal**, **Team**, **Group Chat**
6. Натисніть **Distribute** → **Download app package**
7. У Teams: **Apps** → **Manage your apps** → **Upload a custom app** → виберіть ZIP

Часто це простіше, ніж редагувати JSON-маніфести вручну.

## Тестування бота

**Варіант A: Azure Web Chat (спочатку перевірте webhook)**

1. У Azure Portal → ваш ресурс Azure Bot → **Test in Web Chat**
2. Надішліть повідомлення — ви маєте побачити відповідь
3. Це підтверджує, що ваш webhook endpoint працює до налаштування Teams

**Варіант B: Teams (після встановлення застосунку)**

1. Встановіть застосунок Teams (sideload або через каталог організації)
2. Знайдіть бота в Teams і надішліть DM
3. Перевірте журнали Gateway на вхідну активність

## Налаштування (мінімальний лише текстовий режим)

1. **Переконайтеся, що Plugin Microsoft Teams доступний**
   - Поточні пакетовані релізи OpenClaw уже містять його вбудовано.
   - У старіших/спеціальних встановленнях його можна додати вручну:
     - З npm: `openclaw plugins install @openclaw/msteams`
     - З локального checkout: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Реєстрація бота**
   - Створіть Azure Bot (див. вище) і занотуйте:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Маніфест застосунку Teams**
   - Додайте запис `bot` з `botId = <App ID>`.
   - Області: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (обов’язково для обробки файлів у personal scope).
   - Додайте дозволи RSC (нижче).
   - Створіть іконки: `outline.png` (32x32) і `color.png` (192x192).
   - Запакуйте всі три файли разом: `manifest.json`, `outline.png`, `color.png`.

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
   - `MSTEAMS_CERTIFICATE_PATH` (federated + сертифікат)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (необов’язково, не потрібен для автентифікації)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (лише для user-assigned MI)

5. **Кінцева точка бота**
   - Установіть Azure Bot Messaging Endpoint на:
     - `https://<host>:3978/api/messages` (або ваш вибраний path/port).

6. **Запустіть Gateway**
   - Канал Teams запускається автоматично, коли доступний вбудований або встановлений вручну Plugin і наявна конфігурація `msteams` з обліковими даними.

## Дія інформації про учасника

OpenClaw надає для Microsoft Teams дію `member-info`, що працює через Graph, щоб агенти й автоматизації могли напряму отримувати відомості про учасників каналу (display name, email, роль) із Microsoft Graph.

Вимоги:

- Дозвіл RSC `Member.Read.Group` (уже є в рекомендованому маніфесті)
- Для пошуку між teams: дозвіл Graph Application `User.Read.All` з admin consent

Дія контролюється через `channels.msteams.actions.memberInfo` (типово: увімкнено, коли доступні облікові дані Graph).

## Контекст історії

- `channels.msteams.historyLimit` керує кількістю недавніх повідомлень каналу/групи, які додаються до prompt.
- Використовує резервне значення з `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути (типово 50).
- Отримана історія треду фільтрується за allowlist відправників (`allowFrom` / `groupAllowFrom`), тож початкове наповнення контексту треду містить лише повідомлення від дозволених відправників.
- Контекст цитованих вкладень (`ReplyTo*`, похідний від HTML відповіді Teams) зараз передається як отриманий.
- Інакше кажучи, allowlists контролюють, хто може активувати агента; наразі фільтруються лише окремі шляхи додаткового контексту.
- Історію DM можна обмежити через `channels.msteams.dmHistoryLimit` (ходи користувача). Перевизначення для конкретного користувача: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи Teams RSC (маніфест)

Це **наявні resourceSpecific permissions** у маніфесті нашого застосунку Teams. Вони діють лише в межах team/chat, де встановлено застосунок.

**Для каналів (область team):**

- `ChannelMessage.Read.Group` (Application) — отримувати всі текстові повідомлення каналу без @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Для групових чатів:**

- `ChatMessage.Read.Chat` (Application) — отримувати всі повідомлення групового чату без @mention

## Приклад маніфесту Teams (із вилученими даними)

Мінімальний, коректний приклад із потрібними полями. Замініть ID та URL.

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

- `bots[].botId` **має** збігатися з Azure Bot App ID.
- `webApplicationInfo.id` **має** збігатися з Azure Bot App ID.
- `bots[].scopes` має включати поверхні, які ви плануєте використовувати (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` є обов’язковим для обробки файлів у personal scope.
- `authorization.permissions.resourceSpecific` має містити дозволи на читання/надсилання в канал, якщо вам потрібен трафік каналу.

### Оновлення наявного застосунку

Щоб оновити вже встановлений застосунок Teams (наприклад, додати дозволи RSC):

1. Оновіть `manifest.json` новими налаштуваннями
2. **Збільшіть поле `version`** (наприклад, `1.0.0` → `1.1.0`)
3. **Повторно запакуйте в zip** маніфест разом з іконками (`manifest.json`, `outline.png`, `color.png`)
4. Завантажте новий zip:
   - **Варіант A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → знайдіть ваш застосунок → Upload new version
   - **Варіант B (Sideload):** У Teams → Apps → Manage your apps → Upload a custom app
5. **Для каналів team:** перевстановіть застосунок у кожній team, щоб нові дозволи набрали чинності
6. **Повністю закрийте і знову запустіть Teams** (а не просто закрийте вікно), щоб очистити кешовані метадані застосунку

## Можливості: лише RSC проти Graph

### Із **лише Teams RSC** (застосунок встановлено, без дозволів Microsoft Graph API)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання **особистих (DM)** файлових вкладень.

НЕ працює:

- Вміст **зображень або файлів** у каналах/групах (payload містить лише HTML-заглушку).
- Завантаження вкладень, що зберігаються у SharePoint/OneDrive.
- Читання історії повідомлень (поза межами живої webhook-події).

### Із **Teams RSC + дозволами Microsoft Graph Application**

Додається:

- Завантаження hosted contents (зображень, вставлених у повідомлення).
- Завантаження файлових вкладень, що зберігаються у SharePoint/OneDrive.
- Читання історії повідомлень каналу/чату через Graph.

### RSC проти Graph API

| Capability              | RSC Permissions      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Real-time messages**  | Так (через webhook)  | Ні (лише polling)                   |
| **Historical messages** | Ні                   | Так (можна запитувати історію)      |
| **Setup complexity**    | Лише маніфест застосунку | Потребує admin consent + token flow |
| **Works offline**       | Ні (має бути запущено) | Так (можна запитувати будь-коли)   |

**Підсумок:** RSC призначено для прослуховування в реальному часі; Graph API — для історичного доступу. Щоб надолужувати пропущені повідомлення під час офлайну, вам потрібен Graph API з `ChannelMessage.Read.All` (потребує admin consent).

## Media + history з Graph (обов’язково для каналів)

Якщо вам потрібні зображення/файли в **каналах** або ви хочете отримувати **історію повідомлень**, потрібно ввімкнути дозволи Microsoft Graph і надати admin consent.

1. У **App Registration** Entra ID (Azure AD) додайте дозволи Microsoft Graph **Application permissions**:
   - `ChannelMessage.Read.All` (вкладення каналів + історія)
   - `Chat.Read.All` або `ChatMessage.Read.All` (групові чати)
2. **Надайте admin consent** для tenant.
3. Збільшіть **версію маніфесту** застосунку Teams, повторно завантажте його й **перевстановіть застосунок у Teams**.
4. **Повністю закрийте й знову запустіть Teams**, щоб очистити кешовані метадані застосунку.

**Додатковий дозвіл для згадок користувачів:** @mentions користувачів працюють одразу для користувачів у розмові. Однак якщо ви хочете динамічно шукати й згадувати користувачів, які **не перебувають у поточній розмові**, додайте дозвіл `User.Read.All` (Application) і надайте admin consent.

## Відомі обмеження

### Тайм-аути webhook

Teams доставляє повідомлення через HTTP webhook. Якщо обробка триває надто довго (наприклад, повільні відповіді LLM), ви можете побачити:

- тайм-аути Gateway
- повторні спроби Teams доставити повідомлення (що спричиняє дублікати)
- втрачені відповіді

OpenClaw обробляє це, швидко повертаючи відповідь і надсилаючи відповіді проактивно, але дуже повільні відповіді все одно можуть спричиняти проблеми.

### Форматування

Markdown у Teams більш обмежений, ніж у Slack або Discord:

- Працює базове форматування: **жирний**, _курсив_, `code`, посилання
- Складний markdown (таблиці, вкладені списки) може відображатися некоректно
- Adaptive Cards підтримуються для опитувань і semantic presentation sends (див. нижче)

## Конфігурація

Основні параметри (див. `/gateway/configuration` для спільних шаблонів каналів):

- `channels.msteams.enabled`: увімкнути/вимкнути канал.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: облікові дані бота.
- `channels.msteams.webhook.port` (типово `3978`)
- `channels.msteams.webhook.path` (типово `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing)
- `channels.msteams.allowFrom`: allowlist для DM (рекомендовано AAD object ID). Майстер налаштування під час setup зіставляє імена з ID, коли доступний доступ до Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: аварійний перемикач для повторного ввімкнення зіставлення за змінюваними UPN/display-name і прямої маршрутизації за назвами team/channel.
- `channels.msteams.textChunkLimit`: розмір фрагмента вихідного тексту.
- `channels.msteams.chunkMode`: `length` (типово) або `newline`, щоб розбивати за порожніми рядками (межами абзаців) перед розбиттям за довжиною.
- `channels.msteams.mediaAllowHosts`: allowlist для хостів вхідних вкладень (типово домени Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist для додавання заголовків Authorization під час повторних спроб отримання медіа (типово хости Graph + Bot Framework).
- `channels.msteams.requireMention`: вимагати @mention у каналах/групах (типово true).
- `channels.msteams.replyStyle`: `thread | top-level` (див. [Стиль відповіді](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: перевизначення для конкретної team.
- `channels.msteams.teams.<teamId>.requireMention`: перевизначення для конкретної team.
- `channels.msteams.teams.<teamId>.tools`: типові перевизначення політики інструментів для team (`allow`/`deny`/`alsoAllow`), які використовуються, коли немає перевизначення для каналу.
- `channels.msteams.teams.<teamId>.toolsBySender`: типові перевизначення політики інструментів для team за відправником (`"*"` wildcard підтримується).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: перевизначення для конкретного каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: перевизначення для конкретного каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: перевизначення політики інструментів для конкретного каналу (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: перевизначення політики інструментів для конкретного каналу за відправником (`"*"` wildcard підтримується).
- Ключі `toolsBySender` мають використовувати явні префікси:
  `id:`, `e164:`, `username:`, `name:` (застарілі ключі без префікса все ще зіставляються лише з `id:`).
- `channels.msteams.actions.memberInfo`: увімкнути або вимкнути дію інформації про учасника, що працює через Graph (типово: увімкнено, коли доступні облікові дані Graph).
- `channels.msteams.authType`: тип автентифікації — `"secret"` (типово) або `"federated"`.
- `channels.msteams.certificatePath`: шлях до PEM-файлу сертифіката (federated + автентифікація сертифікатом).
- `channels.msteams.certificateThumbprint`: thumbprint сертифіката (необов’язково, не потрібен для автентифікації).
- `channels.msteams.useManagedIdentity`: увімкнути автентифікацію через managed identity (режим federated).
- `channels.msteams.managedIdentityClientId`: client ID для user-assigned managed identity.
- `channels.msteams.sharePointSiteId`: SharePoint site ID для вивантаження файлів у групових чатах/каналах (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)).

## Маршрутизація та сесії

- Ключі сесій відповідають стандартному формату агента (див. [/concepts/session](/uk/concepts/session)):
  - Прямі повідомлення використовують основну сесію (`agent:<agentId>:<mainKey>`).
  - Повідомлення каналу/групи використовують conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль відповіді: треди проти дописів

Нещодавно Teams запровадив два стилі UI каналів поверх тієї самої базової моделі даних:

| Style                    | Description                                               | Recommended `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (classic)      | Повідомлення відображаються як картки з тредовими відповідями під ними | `thread` (типово)        |
| **Threads** (Slack-like) | Повідомлення йдуть лінійно, більше схоже на Slack         | `top-level`              |

**Проблема:** Teams API не показує, який саме стиль UI використовує канал. Якщо використовувати неправильний `replyStyle`:

- `thread` у каналі зі стилем Threads → відповіді відображаються незручно вкладеними
- `top-level` у каналі зі стилем Posts → відповіді з’являються як окремі дописи верхнього рівня, а не в треді

**Рішення:** налаштуйте `replyStyle` для кожного каналу залежно від того, як налаштований канал:

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

- **DM:** зображення й файлові вкладення працюють через file API бота Teams.
- **Канали/групи:** вкладення зберігаються в M365 storage (SharePoint/OneDrive). Payload webhook містить лише HTML-заглушку, а не фактичні байти файлу. Для завантаження вкладень каналу **потрібні дозволи Graph API**.
- Для явного надсилання, де файл є основним, використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов’язковий `message` стає супровідним текстом/коментарем, а `filename` перевизначає ім’я завантаженого файлу.

Без дозволів Graph повідомлення каналів із зображеннями отримуватимуться лише як текст (вміст зображення боту недоступний).
Типово OpenClaw завантажує медіа лише з hostname Microsoft/Teams. Перевизначте це через `channels.msteams.mediaAllowHosts` (використайте `["*"]`, щоб дозволити будь-який хост).
Заголовки Authorization додаються лише для хостів у `channels.msteams.mediaAuthAllowHosts` (типово хости Graph + Bot Framework). Тримайте цей список суворим (уникайте multi-tenant suffixes).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в DM, використовуючи потік FileConsentCard (вбудований). Однак **надсилання файлів у групових чатах/каналах** потребує додаткового налаштування:

| Context                  | How files are sent                           | Setup needed                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → користувач приймає → бот вивантажує | Працює одразу                                   |
| **Group chats/channels** | Вивантаження до SharePoint → посилання для спільного доступу | Потрібні `sharePointSiteId` + дозволи Graph     |
| **Images (any context)** | Inline у форматі Base64                      | Працює одразу                                   |

### Чому груповим чатам потрібен SharePoint

Боти не мають особистого диска OneDrive (кінцева точка Graph API `/me/drive` не працює для application identities). Щоб надсилати файли в групових чатах/каналах, бот вивантажує їх на **сайт SharePoint** і створює посилання для спільного доступу.

### Налаштування

1. **Додайте дозволи Graph API** у Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) — вивантаження файлів до SharePoint
   - `Chat.Read.All` (Application) — необов’язково, вмикає посилання для спільного доступу на рівні користувачів

2. **Надайте admin consent** для tenant.

3. **Отримайте ваш SharePoint site ID:**

   ```bash
   # Через Graph Explorer або curl з дійсним токеном:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Приклад: для сайту "contoso.sharepoint.com/sites/BotFiles"
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

| Permission                              | Sharing behavior                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` only              | Посилання для спільного доступу на всю організацію (доступне будь-кому в організації) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Посилання для спільного доступу на рівні користувачів (доступне лише учасникам чату) |

Спільний доступ на рівні користувачів безпечніший, оскільки лише учасники чату можуть отримати доступ до файлу. Якщо дозвіл `Chat.Read.All` відсутній, бот повертається до спільного доступу на всю організацію.

### Резервна поведінка

| Scenario                                          | Result                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Груповий чат + файл + налаштовано `sharePointSiteId` | Вивантаження до SharePoint, надсилання посилання для спільного доступу |
| Груповий чат + файл + немає `sharePointSiteId`       | Спроба вивантаження в OneDrive (може завершитися помилкою), надсилається лише текст |
| Особистий чат + файл                              | Потік FileConsentCard (працює без SharePoint)      |
| Будь-який контекст + зображення                   | Inline у форматі Base64 (працює без SharePoint)    |

### Де зберігаються файли

Вивантажені файли зберігаються в папці `/OpenClawShared/` у стандартній бібліотеці документів налаштованого сайту SharePoint.

## Опитування (Adaptive Cards)

OpenClaw надсилає опитування Teams як Adaptive Cards (власного API опитувань у Teams немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоси записуються Gateway у `~/.openclaw/msteams-polls.json`.
- Щоб записувати голоси, Gateway має залишатися онлайн.
- Підсумкові зведення результатів опитувань поки не публікуються автоматично (за потреби перевіряйте файл сховища).

## Картки presentation

Надсилайте семантичні payload presentation користувачам або розмовам Teams за допомогою інструмента `message` або CLI. OpenClaw відтворює їх як Teams Adaptive Cards на основі узагальненого контракту presentation.

Параметр `presentation` приймає семантичні блоки. Якщо передано `presentation`, текст повідомлення не є обов’язковим.

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

Докладніше про формат target див. у [Формати target](#target-formats) нижче.

## Формати target

Target у MSTeams використовують префікси, щоб розрізняти користувачів і розмови:

| Target type         | Format                           | Example                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Користувач (за ID)  | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Користувач (за ім’ям) | `user:<display-name>`          | `user:John Smith` (потребує Graph API)              |
| Група/канал         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Група/канал (raw)   | `<conversation-id>`              | `19:abc123...@thread.tacv2` (якщо містить `@thread`) |

**Приклади CLI:**

```bash
# Надіслати користувачу за ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Надіслати користувачу за display name (запускає Graph API lookup)
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

Примітка: без префікса `user:` імена типово трактуються як цілі групи/team. Завжди використовуйте `user:`, коли адресуєте повідомлення людям за display name.

## Проактивні повідомлення

- Проактивні повідомлення можливі лише **після** взаємодії користувача, оскільки саме тоді ми зберігаємо посилання на розмову.
- Див. `/gateway/configuration` для `dmPolicy` і обмеження через allowlist.

## ID team і channel (типова пастка)

Параметр запиту `groupId` в URL Teams — **НЕ** той team ID, який використовується для конфігурації. Натомість витягуйте ID зі шляху URL:

**URL team:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (декодуйте URL)
```

**URL channel:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (декодуйте URL)
```

**Для конфігурації:**

- Team ID = сегмент шляху після `/team/` (після декодування URL, наприклад, `19:Bk4j...@thread.tacv2`)
- Channel ID = сегмент шляху після `/channel/` (після декодування URL)
- Параметр запиту `groupId` **ігноруйте**

## Приватні канали

Боти мають обмежену підтримку в приватних каналах:

| Feature                      | Standard Channels | Private Channels      |
| ---------------------------- | ----------------- | --------------------- |
| Встановлення бота            | Так               | Обмежено              |
| Повідомлення в реальному часі (webhook) | Так      | Може не працювати     |
| Дозволи RSC                  | Так               | Можуть працювати інакше |
| @mentions                    | Так               | Якщо бот доступний    |
| Історія через Graph API      | Так               | Так (за наявності дозволів) |

**Обхідні шляхи, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом
2. Використовуйте DM — користувачі завжди можуть писати боту напряму
3. Використовуйте Graph API для історичного доступу (потребує `ChannelMessage.Read.All`)

## Усунення проблем

### Типові проблеми

- **Зображення не відображаються в каналах:** відсутні дозволи Graph або admin consent. Перевстановіть застосунок Teams і повністю закрийте/заново відкрийте Teams.
- **Немає відповідей у каналі:** згадки типово обов’язкові; задайте `channels.msteams.requireMention=false` або налаштуйте це для конкретної team/channel.
- **Невідповідність версій (Teams досі показує старий маніфест):** видаліть і знову додайте застосунок та повністю закрийте Teams, щоб оновити дані.
- **401 Unauthorized від webhook:** очікувана поведінка під час ручного тестування без Azure JWT — означає, що endpoint доступний, але автентифікація не пройшла. Для коректної перевірки використовуйте Azure Web Chat.

### Помилки завантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли іконок розміром 0 байт. Створіть коректні PNG-іконки (`outline.png` 32x32, `color.png` 192x192).
- **"webApplicationInfo.Id already in use":** застосунок усе ще встановлений в іншій team/chat. Спочатку знайдіть і видаліть його або зачекайте 5–10 хвилин на поширення змін.
- **"Something went wrong" під час завантаження:** замість цього завантажуйте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools у браузері (F12) → вкладка Network і перевірте тіло відповіді на фактичну помилку.
- **Не вдається sideload:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app" — це часто обходить обмеження sideload.

### Дозволи RSC не працюють

1. Переконайтеся, що `webApplicationInfo.id` точно збігається з App ID вашого бота
2. Повторно завантажте застосунок і перевстановіть його в team/chat
3. Перевірте, чи адміністратор вашої організації не заблокував дозволи RSC
4. Підтвердьте, що ви використовуєте правильну область: `ChannelMessage.Read.Group` для teams, `ChatMessage.Read.Chat` для групових чатів

## Посилання

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - посібник із налаштування Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - створення/керування застосунками Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для channel/group потрібен Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Групи](/uk/channels/groups) — поведінка групового чату та обмеження через згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
