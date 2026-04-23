---
read_when:
    - Працюємо над функціями каналу Microsoft Teams
summary: Статус підтримки, можливості та конфігурація бота Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T15:10:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 872318a0f4ec42efef3c13bc90b4af1b3875ade431bd314583ea2cdc038cdc7c
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> «Полиште надію всяк, хто сюди входить».

Статус: підтримуються текстові повідомлення + вкладення в DM; надсилання файлів у канали/групи потребує `sharePointSiteId` + дозволів Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Опитування надсилаються через Adaptive Cards. Дії з повідомленнями надають явний `upload-file` для надсилань, де файл є основним.

## Bundled plugin

Microsoft Teams постачається як bundled Plugin у поточних випусках OpenClaw, тому
в окремому встановленні немає потреби у звичайній пакетованій збірці.

Якщо ви використовуєте старішу збірку або власне встановлення, яке не містить bundled Teams,
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
   - Поточні пакетовані випуски OpenClaw уже містять його.
   - У старіших/власних встановленнях його можна додати вручну за допомогою наведених вище команд.
2. Створіть **Azure Bot** (App ID + client secret + tenant ID).
3. Налаштуйте OpenClaw за допомогою цих облікових даних.
4. Відкрийте `/api/messages` (порт 3978 за замовчуванням) через публічний URL або тунель.
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

Для продакшн-розгортань розгляньте використання [federated authentication](#federated-authentication-certificate--managed-identity) (сертифікат або managed identity) замість client secret.

Примітка: групові чати заблоковані за замовчуванням (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` (або використайте `groupPolicy: "open"`, щоб дозволити будь-якого учасника, із вимогою згадки).

## Цілі

- Спілкуватися з OpenClaw через Teams DM, групові чати або канали.
- Забезпечити детерміновану маршрутизацію: відповіді завжди повертаються в той канал, з якого вони надійшли.
- Використовувати безпечну поведінку каналів за замовчуванням (потрібні згадки, якщо не налаштовано інакше).

## Запис у конфігурацію

За замовчуванням Microsoft Teams може записувати оновлення конфігурації, ініційовані через `/config set|unset` (потребує `commands.config: true`).

Щоб вимкнути, використайте:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Контроль доступу (DM + групи)

**Доступ до DM**

- За замовчуванням: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються, доки їх не буде схвалено.
- `channels.msteams.allowFrom` має використовувати стабільні AAD object ID.
- UPN/відображувані імена є змінними; пряме зіставлення вимкнене за замовчуванням і вмикається лише через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер налаштування може зіставляти імена з ID через Microsoft Graph, якщо це дозволяють облікові дані.

**Груповий доступ**

- За замовчуванням: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, доки ви не додасте `groupAllowFrom`). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити значення за замовчуванням, якщо його не задано.
- `channels.msteams.groupAllowFrom` визначає, які відправники можуть ініціювати взаємодію в групових чатах/каналах (резервно використовується `channels.msteams.allowFrom`).
- Встановіть `groupPolicy: "open"`, щоб дозволити будь-якого учасника (за замовчуванням усе одно потрібна згадка).
- Щоб **не дозволяти жодних каналів**, встановіть `channels.msteams.groupPolicy: "disabled"`.

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

**Список дозволених Teams + каналів**

- Обмежуйте відповіді в групах/каналах, перелічивши teams і канали в `channels.msteams.teams`.
- Ключі мають використовувати стабільні team ID і channel conversation ID.
- Якщо `groupPolicy="allowlist"` і присутній список дозволених teams, приймаються лише перелічені teams/канали (із вимогою згадки).
- Майстер налаштування приймає записи `Team/Channel` і сам зберігає їх.
- Під час запуску OpenClaw зіставляє імена team/channel і user у списку дозволених з ID (коли це дозволяють дозволи Graph)
  і записує це зіставлення в журнал; імена team/channel, які не вдалося зіставити, зберігаються як введені, але за замовчуванням ігноруються під час маршрутизації, якщо не ввімкнено `channels.msteams.dangerouslyAllowNameMatching: true`.

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

## Налаштування Azure Bot

Перш ніж налаштовувати OpenClaw, створіть ресурс Azure Bot і збережіть його облікові дані.

<Steps>
  <Step title="Створіть Azure Bot">
    Перейдіть до [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) і заповніть вкладку **Basics**:

    | Field              | Value                                                    |
    | ------------------ | -------------------------------------------------------- |
    | **Bot handle**     | Назва вашого бота, наприклад `openclaw-msteams` (має бути унікальною) |
    | **Subscription**   | Ваша підписка Azure                                      |
    | **Resource group** | Створіть нову або використайте наявну                    |
    | **Pricing tier**   | **Free** для розробки/тестування                         |
    | **Type of App**    | **Single Tenant** (рекомендовано)                        |
    | **Creation type**  | **Create new Microsoft App ID**                          |

    <Note>
    Нові multi-tenant боти застаріли після 2025-07-31. Для нових ботів використовуйте **Single Tenant**.
    </Note>

    Натисніть **Review + create** → **Create** (зачекайте приблизно 1–2 хвилини).

  </Step>

  <Step title="Збережіть облікові дані">
    У ресурсі Azure Bot → **Configuration**:

    - скопіюйте **Microsoft App ID** → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → скопіюйте значення → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="Налаштуйте endpoint для повідомлень">
    Azure Bot → **Configuration** → задайте **Messaging endpoint**:

    - Продакшн: `https://your-domain.com/api/messages`
    - Локальна розробка: використайте тунель (див. [Локальна розробка](#local-development-tunneling))

  </Step>

  <Step title="Увімкніть канал Teams">
    Azure Bot → **Channels** → натисніть **Microsoft Teams** → Configure → Save. Прийміть Terms of Service.
  </Step>
</Steps>

<a id="federated-authentication-certificate--managed-identity"></a>

## Federated authentication

> Додано в 2026.3.24

Для продакшн-розгортань OpenClaw підтримує **federated authentication** як безпечнішу альтернативу client secret. Доступні два методи:

### Варіант A: Автентифікація на основі сертифіката

Використовуйте PEM-сертифікат, зареєстрований у вашій реєстрації застосунку Entra ID.

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

**Змінні середовища:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Варіант B: Azure Managed Identity

Використовуйте Azure Managed Identity для автентифікації без пароля. Це ідеальний варіант для розгортань в інфраструктурі Azure (AKS, App Service, Azure VMs), де доступна managed identity.

**Як це працює:**

1. Pod/VM бота має managed identity (system-assigned або user-assigned).
2. **Federated identity credential** пов’язує managed identity з реєстрацією застосунку Entra ID.
3. Під час виконання OpenClaw використовує `@azure/identity` для отримання токенів з endpoint Azure IMDS (`169.254.169.254`).
4. Токен передається в SDK Teams для автентифікації бота.

**Передумови:**

- Інфраструктура Azure з увімкненою managed identity (AKS workload identity, App Service, VM)
- Створений federated identity credential у реєстрації застосунку Entra ID
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

**Змінні середовища:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (лише для user-assigned)

### Налаштування AKS workload identity

Для розгортань AKS, що використовують workload identity:

1. **Увімкніть workload identity** у своєму кластері AKS.
2. **Створіть federated identity credential** у реєстрації застосунку Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Додайте анотацію до облікового запису служби Kubernetes** з client ID застосунку:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Додайте мітку до pod** для ін’єкції workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Переконайтеся в наявності мережевого доступу** до IMDS (`169.254.169.254`) — якщо використовується NetworkPolicy, додайте правило egress, яке дозволяє трафік до `169.254.169.254/32` на порт 80.

### Порівняння типів автентифікації

| Method               | Config                                         | Pros                               | Cons                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Просте налаштування                | Потрібна ротація секретів, менш безпечно |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Немає спільного секрету в мережі   | Додаткові витрати на керування сертифікатами |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Без пароля, не потрібно керувати секретами | Потрібна інфраструктура Azure         |

**Поведінка за замовчуванням:** якщо `authType` не задано, OpenClaw за замовчуванням використовує автентифікацію через client secret. Наявні конфігурації продовжать працювати без змін.

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

Замість того щоб вручну створювати ZIP-файл маніфесту, ви можете скористатися [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Натисніть **+ New app**
2. Заповніть базову інформацію (назва, опис, інформація про розробника)
3. Перейдіть до **App features** → **Bot**
4. Виберіть **Enter a bot ID manually** і вставте ваш Azure Bot App ID
5. Позначте області: **Personal**, **Team**, **Group Chat**
6. Натисніть **Distribute** → **Download app package**
7. У Teams: **Apps** → **Manage your apps** → **Upload a custom app** → виберіть ZIP

Часто це простіше, ніж вручну редагувати JSON-маніфести.

## Тестування бота

**Варіант A: Azure Web Chat (спочатку перевірте Webhook)**

1. У Azure Portal → ваш ресурс Azure Bot → **Test in Web Chat**
2. Надішліть повідомлення — ви маєте побачити відповідь
3. Це підтверджує, що ваш endpoint Webhook працює до налаштування Teams

**Варіант B: Teams (після встановлення застосунку)**

1. Встановіть застосунок Teams (sideload або через org catalog)
2. Знайдіть бота в Teams і надішліть DM
3. Перевірте журнали Gateway на наявність вхідної активності

## Налаштування (мінімальна конфігурація лише для тексту)

1. **Переконайтеся, що Plugin Microsoft Teams доступний**
   - Поточні пакетовані випуски OpenClaw уже містять його.
   - У старіших/власних встановленнях його можна додати вручну:
     - З npm: `openclaw plugins install @openclaw/msteams`
     - З локального checkout: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Реєстрація бота**
   - Створіть Azure Bot (див. вище) і збережіть:
     - App ID
     - Client secret (App password)
     - Tenant ID (single-tenant)

3. **Маніфест застосунку Teams**
   - Додайте запис `bot` з `botId = <App ID>`.
   - Scopes: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (обов’язково для обробки файлів в області personal).
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
   - `MSTEAMS_CERTIFICATE_PATH` (federated + сертифікат)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (необов’язково, не потрібен для автентифікації)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (лише для user-assigned MI)

5. **Endpoint бота**
   - Установіть Azure Bot Messaging Endpoint на:
     - `https://<host>:3978/api/messages` (або ваш власний path/port).

6. **Запустіть Gateway**
   - Канал Teams запускається автоматично, коли доступний bundled Plugin або вручну встановлений Plugin і присутня конфігурація `msteams` з обліковими даними.

## Дія з інформацією про учасника

OpenClaw надає дію `member-info` на базі Graph для Microsoft Teams, щоб агенти й автоматизації могли напряму отримувати дані про учасників каналу (відображуване ім’я, email, роль) з Microsoft Graph.

Вимоги:

- Дозвіл RSC `Member.Read.Group` (вже є в рекомендованому маніфесті)
- Для пошуку між командами: дозвіл Application Microsoft Graph `User.Read.All` з admin consent

Дія керується параметром `channels.msteams.actions.memberInfo` (типово: увімкнено, коли доступні облікові дані Graph).

## Контекст історії

- `channels.msteams.historyLimit` керує тим, скільки останніх повідомлень каналу/групи додається до prompt.
- Резервно використовується `messages.groupChat.historyLimit`. Встановіть `0`, щоб вимкнути (типово 50).
- Отримана історія треду фільтрується за списками дозволених відправників (`allowFrom` / `groupAllowFrom`), тому початкове заповнення контексту треду включає лише повідомлення від дозволених відправників.
- Контекст цитованих вкладень (`ReplyTo*`, похідний від HTML відповіді Teams) наразі передається як отримано.
- Іншими словами, списки дозволених визначають, хто може активувати агента; сьогодні фільтруються лише окремі шляхи додаткового контексту.
- Історію DM можна обмежити через `channels.msteams.dmHistoryLimit` (ходи користувача). Перевизначення для окремих користувачів: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи RSC Teams

Це **наявні resourceSpecific permissions** у маніфесті нашого застосунку Teams. Вони діють лише в межах команди/чату, де встановлено застосунок.

**Для каналів (область team):**

- `ChannelMessage.Read.Group` (Application) - отримання всіх текстових повідомлень каналу без @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Для групових чатів:**

- `ChatMessage.Read.Chat` (Application) - отримання всіх повідомлень групового чату без @mention

## Приклад маніфесту Teams

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
- `bots[].scopes` мають включати поверхні, які ви плануєте використовувати (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` є обов’язковим для обробки файлів в області personal.
- `authorization.permissions.resourceSpecific` має включати читання/надсилання в каналах, якщо вам потрібен трафік каналів.

### Оновлення наявного застосунку

Щоб оновити вже встановлений застосунок Teams (наприклад, щоб додати дозволи RSC):

1. Оновіть свій `manifest.json` новими параметрами
2. **Збільште значення поля `version`** (наприклад, `1.0.0` → `1.1.0`)
3. **Повторно заархівуйте** маніфест разом з іконками (`manifest.json`, `outline.png`, `color.png`)
4. Завантажте новий zip:
   - **Варіант A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → знайдіть свій застосунок → Upload new version
   - **Варіант B (Sideload):** У Teams → Apps → Manage your apps → Upload a custom app
5. **Для командних каналів:** перевстановіть застосунок у кожній команді, щоб нові дозволи набули чинності
6. **Повністю закрийте і знову запустіть Teams** (а не просто закрийте вікно), щоб очистити кешовані метадані застосунку

## Можливості: лише RSC проти Graph

### Лише Teams RSC (без дозволів Microsoft Graph API)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання вкладень файлів у **personal (DM)**.

НЕ працює:

- **Вміст зображень або файлів** у каналах/групах (payload містить лише HTML-заглушку).
- Завантаження вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень (понад межі події Webhook у реальному часі).

### Teams RSC плюс дозволи Application Microsoft Graph

Додає:

- Завантаження hosted contents (зображення, вставлені в повідомлення).
- Завантаження вкладень файлів, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень каналів/чатів через Graph.

### RSC проти Graph API

| Capability              | RSC Permissions      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Real-time messages**  | Так (через webhook)  | Ні (лише polling)                   |
| **Historical messages** | Ні                   | Так (можна запитувати історію)      |
| **Setup complexity**    | Лише маніфест застосунку | Потрібні admin consent + потік токенів |
| **Works offline**       | Ні (має бути запущено) | Так (запит у будь-який час)         |

**Підсумок:** RSC призначений для прослуховування в реальному часі; Graph API — для історичного доступу. Щоб надолужувати пропущені повідомлення під час офлайну, вам потрібен Graph API з `ChannelMessage.Read.All` (потребує admin consent).

## Graph-enabled медіа + історія (обов’язково для каналів)

Якщо вам потрібні зображення/файли в **каналах** або потрібно отримувати **історію повідомлень**, необхідно увімкнути дозволи Microsoft Graph і надати admin consent.

1. У **App Registration** Entra ID (Azure AD) додайте **Application permissions** Microsoft Graph:
   - `ChannelMessage.Read.All` (вкладення каналів + історія)
   - `Chat.Read.All` або `ChatMessage.Read.All` (групові чати)
2. **Надайте admin consent** для тенанта.
3. Збільшіть **версію маніфесту** застосунку Teams, повторно завантажте його та **перевстановіть застосунок у Teams**.
4. **Повністю закрийте і знову запустіть Teams**, щоб очистити кешовані метадані застосунку.

**Додатковий дозвіл для згадок користувачів:** @mentions користувачів працюють одразу для користувачів у поточній розмові. Однак якщо ви хочете динамічно шукати й згадувати користувачів, які **не перебувають у поточній розмові**, додайте дозвіл `User.Read.All` (Application) і надайте admin consent.

## Відомі обмеження

### Тайм-аути Webhook

Teams доставляє повідомлення через HTTP Webhook. Якщо обробка займає надто багато часу (наприклад, повільні відповіді LLM), ви можете побачити:

- Тайм-аути Gateway
- Повторні спроби доставки повідомлення з боку Teams (що спричиняє дублікати)
- Втрачені відповіді

OpenClaw обробляє це, швидко повертаючи відповідь і надсилаючи її проактивно, але дуже повільні відповіді все одно можуть спричиняти проблеми.

### Форматування

Підтримка markdown у Teams обмеженіша, ніж у Slack або Discord:

- Базове форматування працює: **bold**, _italic_, `code`, посилання
- Складний markdown (таблиці, вкладені списки) може відображатися некоректно
- Adaptive Cards підтримуються для опитувань і надсилань semantic presentation (див. нижче)

## Конфігурація

Згруповані параметри (див. `/gateway/configuration` для спільних шаблонів каналів).

<AccordionGroup>
  <Accordion title="Ядро і webhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`, `appPassword`, `tenantId`: облікові дані бота
    - `channels.msteams.webhook.port` (типово `3978`)
    - `channels.msteams.webhook.path` (типово `/api/messages`)
  </Accordion>

  <Accordion title="Автентифікація">
    - `authType`: `"secret"` (типово) або `"federated"`
    - `certificatePath`, `certificateThumbprint`: federated + автентифікація сертифікатом (thumbprint необов’язковий)
    - `useManagedIdentity`, `managedIdentityClientId`: federated + автентифікація через managed identity
  </Accordion>

  <Accordion title="Контроль доступу">
    - `dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing)
    - `allowFrom`: список дозволених для DM, переважно AAD object ID; майстер зіставляє імена, коли доступ до Graph доступний
    - `dangerouslyAllowNameMatching`: аварійний режим для змінних UPN/display-name і маршрутизації за назвами team/channel
    - `requireMention`: вимагати @mention у каналах/групах (типово `true`)
  </Accordion>

  <Accordion title="Перевизначення для команд і каналів">
    Усі ці параметри перевизначають значення верхнього рівня за замовчуванням:

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender`: параметри політики інструментів за замовчуванням для команди
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    Ключі `toolsBySender` приймають префікси `id:`, `e164:`, `username:`, `name:` (ключі без префікса зіставляються з `id:`). `"*"` — це шаблонний символ.

  </Accordion>

  <Accordion title="Доставка, медіа та дії">
    - `textChunkLimit`: розмір вихідного текстового фрагмента
    - `chunkMode`: `length` (типово) або `newline` (розбиття за межами абзаців перед обмеженням довжини)
    - `mediaAllowHosts`: список дозволених хостів для вхідних вкладень (типово домени Microsoft/Teams)
    - `mediaAuthAllowHosts`: хости, які можуть отримувати заголовки Authorization під час повторних спроб (типово Graph + Bot Framework)
    - `replyStyle`: `thread | top-level` (див. [Стиль відповіді](#reply-style-threads-vs-posts))
    - `actions.memberInfo`: перемикач дії `member-info` на базі Graph (типово ввімкнено, коли Graph доступний)
    - `sharePointSiteId`: обов’язковий для завантаження файлів у групових чатах/каналах (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats))
  </Accordion>
</AccordionGroup>

## Маршрутизація та сесії

- Ключі сесій дотримуються стандартного формату агентів (див. [/concepts/session](/uk/concepts/session)):
  - Прямі повідомлення використовують основну сесію (`agent:<agentId>:<mainKey>`).
  - Повідомлення каналу/групи використовують conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль відповіді: треди проти дописів

Нещодавно Teams запровадив два стилі інтерфейсу каналів поверх тієї самої базової моделі даних:

| Style                    | Description                                               | Recommended `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (classic)      | Повідомлення відображаються як картки з тредовими відповідями під ними | `thread` (типово)        |
| **Threads** (Slack-like) | Повідомлення йдуть лінійно, більше схоже на Slack         | `top-level`              |

**Проблема:** API Teams не показує, який стиль інтерфейсу використовує канал. Якщо використати неправильний `replyStyle`:

- `thread` у каналі зі стилем Threads → відповіді будуть незручно вкладеними
- `top-level` у каналі зі стилем Posts → відповіді з’являтимуться як окремі дописи верхнього рівня, а не в треді

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

- **DM:** зображення та файлові вкладення працюють через Teams bot file APIs.
- **Канали/групи:** вкладення зберігаються у сховищі M365 (SharePoint/OneDrive). Payload Webhook містить лише HTML-заглушку, а не фактичні байти файлу. **Для завантаження вкладень каналів потрібні дозволи Graph API**.
- Для явних надсилань, де файл є основним, використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов’язковий `message` стане супровідним текстом/коментарем, а `filename` перевизначить ім’я завантаженого файлу.

Без дозволів Graph повідомлення каналів із зображеннями будуть отримані лише як текст (вміст зображення недоступний боту).
За замовчуванням OpenClaw завантажує медіа лише з хостів Microsoft/Teams. Це можна перевизначити через `channels.msteams.mediaAllowHosts` (використайте `["*"]`, щоб дозволити будь-який хост).
Заголовки Authorization додаються лише для хостів у `channels.msteams.mediaAuthAllowHosts` (типово хости Graph + Bot Framework). Тримайте цей список суворим (уникайте багатотенантних суфіксів).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в DM через потік FileConsentCard (вбудований). Однак **надсилання файлів у групових чатах/каналах** потребує додаткового налаштування:

| Context                  | How files are sent                           | Setup needed                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → користувач приймає → бот завантажує | Працює одразу                                   |
| **Group chats/channels** | Завантаження в SharePoint → посилання для спільного доступу | Потрібні `sharePointSiteId` + дозволи Graph     |
| **Images (any context)** | Inline у кодуванні Base64                    | Працює одразу                                   |

### Чому груповим чатам потрібен SharePoint

Боти не мають персонального диска OneDrive (endpoint Graph API `/me/drive` не працює для ідентичностей застосунків). Щоб надсилати файли в групових чатах/каналах, бот завантажує їх на **сайт SharePoint** і створює посилання для спільного доступу.

### Налаштування

1. **Додайте дозволи Graph API** у Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - завантаження файлів у SharePoint
   - `Chat.Read.All` (Application) - необов’язково, вмикає посилання для спільного доступу на рівні користувача

2. **Надайте admin consent** для тенанта.

3. **Отримайте ID вашого сайту SharePoint:**

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
         // ... інша конфігурація ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Поведінка спільного доступу

| Permission                              | Sharing behavior                                          |
| --------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` лише              | Посилання для спільного доступу на рівні всієї організації (доступ має будь-хто в організації) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Посилання для спільного доступу на рівні користувача (доступ мають лише учасники чату) |

Спільний доступ на рівні користувача безпечніший, оскільки лише учасники чату можуть отримати доступ до файлу. Якщо дозвіл `Chat.Read.All` відсутній, бот повертається до спільного доступу на рівні всієї організації.

### Резервна поведінка

| Scenario                                          | Result                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Груповий чат + файл + налаштовано `sharePointSiteId` | Завантаження в SharePoint, надсилання посилання для спільного доступу |
| Груповий чат + файл + без `sharePointSiteId`         | Спроба завантаження в OneDrive (може не вдатися), надсилання лише тексту |
| Personal chat + файл                              | Потік FileConsentCard (працює без SharePoint)      |
| Будь-який контекст + зображення                   | Inline у кодуванні Base64 (працює без SharePoint)  |

### Розташування збережених файлів

Завантажені файли зберігаються в папці `/OpenClawShared/` у стандартній бібліотеці документів налаштованого сайту SharePoint.

## Опитування (adaptive cards)

OpenClaw надсилає опитування Teams як Adaptive Cards (вбудованого API опитувань у Teams немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоси записуються Gateway у `~/.openclaw/msteams-polls.json`.
- Gateway має залишатися онлайн, щоб записувати голоси.
- Опитування поки що не публікують підсумки результатів автоматично (за потреби перевіряйте файл сховища).

## Картки presentation

Надсилайте semantic payloads presentation користувачам Teams або в розмови за допомогою інструмента `message` або CLI. OpenClaw рендерить їх як Teams Adaptive Cards із загального контракту presentation.

Параметр `presentation` приймає semantic blocks. Якщо вказано `presentation`, текст повідомлення необов’язковий.

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

Докладніше про формат target див. у розділі [Формати target](#target-formats) нижче.

## Формати target

Target у MSTeams використовують префікси, щоб розрізняти користувачів і розмови:

| Target type         | Format                           | Example                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Користувач (за ID)  | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Користувач (за ім’ям) | `user:<display-name>`          | `user:John Smith` (потрібен Graph API)              |
| Група/канал         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Група/канал (raw)   | `<conversation-id>`              | `19:abc123...@thread.tacv2` (якщо містить `@thread`) |

**Приклади CLI:**

```bash
# Надіслати користувачу за ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Надіслати користувачу за display name (запускає пошук через Graph API)
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

Примітка: без префікса `user:` імена за замовчуванням інтерпретуються як група/team. Завжди використовуйте `user:`, коли звертаєтеся до людей за display name.

## Проактивні повідомлення

- Проактивні повідомлення можливі лише **після** взаємодії користувача, тому що саме тоді ми зберігаємо посилання на розмову.
- Див. `/gateway/configuration` для параметрів `dmPolicy` і обмеження через список дозволених.

## ID команд і каналів

Параметр запиту `groupId` в URL Teams **НЕ** є team ID, який використовується для конфігурації. Натомість витягайте ID зі шляху URL:

**URL команди:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (декодуйте URL)
```

**URL каналу:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (декодуйте URL)
```

**Для конфігурації:**

- Team ID = сегмент шляху після `/team/` (після декодування URL, наприклад `19:Bk4j...@thread.tacv2`)
- Channel ID = сегмент шляху після `/channel/` (після декодування URL)
- **Ігноруйте** параметр запиту `groupId`

## Приватні канали

Боти мають обмежену підтримку в приватних каналах:

| Feature                      | Standard Channels | Private Channels       |
| ---------------------------- | ----------------- | ---------------------- |
| Встановлення бота            | Так               | Обмежено               |
| Повідомлення в реальному часі (webhook) | Так      | Може не працювати      |
| Дозволи RSC                  | Так               | Можуть поводитися інакше |
| @mentions                    | Так               | Якщо бот доступний     |
| Історія Graph API            | Так               | Так (за наявності дозволів) |

**Обхідні шляхи, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом
2. Використовуйте DM — користувачі завжди можуть напряму написати боту
3. Використовуйте Graph API для історичного доступу (потрібен `ChannelMessage.Read.All`)

## Усунення неполадок

### Поширені проблеми

- **Зображення не показуються в каналах:** відсутні дозволи Graph або admin consent. Перевстановіть застосунок Teams і повністю закрийте/заново відкрийте Teams.
- **Немає відповідей у каналі:** за замовчуванням потрібні згадки; установіть `channels.msteams.requireMention=false` або налаштуйте окремо для кожної команди/каналу.
- **Невідповідність версії (Teams усе ще показує старий маніфест):** видаліть і знову додайте застосунок та повністю закрийте Teams, щоб оновити дані.
- **401 Unauthorized від Webhook:** це очікувано під час ручного тестування без Azure JWT — це означає, що endpoint доступний, але автентифікація не пройшла. Для коректного тестування використовуйте Azure Web Chat.

### Помилки завантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли іконок розміром 0 байт. Створіть коректні PNG-іконки (`outline.png` 32x32, `color.png` 192x192).
- **"webApplicationInfo.Id already in use":** застосунок усе ще встановлений в іншій команді/чаті. Спочатку знайдіть і видаліть його або зачекайте 5–10 хвилин на поширення змін.
- **"Something went wrong" під час завантаження:** замість цього завантажте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools браузера (F12) → вкладка Network і перевірте тіло відповіді, щоб побачити фактичну помилку.
- **Не вдається sideload:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app" — це часто обходить обмеження sideload.

### Дозволи RSC не працюють

1. Переконайтеся, що `webApplicationInfo.id` точно збігається з App ID вашого бота
2. Повторно завантажте застосунок і перевстановіть його в команді/чаті
3. Перевірте, чи адміністратор вашої організації не заблокував дозволи RSC
4. Підтвердьте, що ви використовуєте правильну область: `ChannelMessage.Read.Group` для команд, `ChatMessage.Read.Chat` для групових чатів

## Посилання

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - посібник із налаштування Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - створення/керування застосунками Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для каналу/групи потрібен Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Пов’язане

- [Channels Overview](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і процес pairингy
- [Groups](/uk/channels/groups) — поведінка групових чатів і вимога згадки
- [Channel Routing](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Security](/uk/gateway/security) — модель доступу та посилення безпеки
