---
read_when:
    - Робота над функціями каналу Microsoft Teams
summary: Стан підтримки бота Microsoft Teams, можливості та налаштування
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-23T20:44:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 930de8b9d715d758ceb56b8eaf967a88e9729c18abd595bc8a89d281515f387e
    source_path: channels/msteams.md
    workflow: 15
---

Підтримуються текст і вкладення в DM; надсилання файлів у каналах і групах потребує `sharePointSiteId` + дозволів Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Опитування надсилаються через Adaptive Cards. Дії з повідомленнями надають явний `upload-file` для сценаріїв надсилання, де файл є основним.

## Вбудований Plugin

Microsoft Teams постачається як вбудований Plugin у поточних релізах OpenClaw, тому в типовій пакетованій збірці окреме встановлення не потрібне.

Якщо ви використовуєте старішу збірку або кастомне встановлення без вбудованого Teams, встановіть його вручну:

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
   - Поточні пакетовані релізи OpenClaw уже містять його в комплекті.
   - У старіших/кастомних встановленнях його можна додати вручну командами вище.
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

Для production-розгортань розгляньте використання [federated authentication](#federated-authentication) (сертифікат або managed identity) замість client secret.

Примітка: групові чати типово заблоковані (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` (або використайте `groupPolicy: "open"`, щоб дозволити будь-якого учасника з обов’язковим згадуванням).

## Записи конфігурації

Типово Microsoft Teams дозволено записувати оновлення конфігурації, ініційовані через `/config set|unset` (потребує `commands.config: true`).

Щоб вимкнути:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Контроль доступу (DM + групи)

**Доступ у DM**

- Типово: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються, доки їх не буде схвалено.
- `channels.msteams.allowFrom` має використовувати стабільні AAD object ID.
- UPN/display names можна змінювати; пряме зіставлення типово вимкнене й вмикається лише через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер налаштування може зіставляти імена з ID через Microsoft Graph, якщо облікові дані це дозволяють.

**Доступ у групах**

- Типово: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, доки ви не додасте `groupAllowFrom`). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити типову поведінку, якщо значення не задано.
- `channels.msteams.groupAllowFrom` визначає, які відправники можуть ініціювати роботу в групових чатах/каналах (із fallback на `channels.msteams.allowFrom`).
- Установіть `groupPolicy: "open"`, щоб дозволити будь-якого учасника (типово все одно потрібне згадування).
- Щоб **не дозволяти жодних каналів**, задайте `channels.msteams.groupPolicy: "disabled"`.

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

- Обмежуйте відповіді в групах/каналах, перелічуючи teams і channels у `channels.msteams.teams`.
- Ключі мають використовувати стабільні team ID та channel conversation ID.
- Коли `groupPolicy="allowlist"` і присутній allowlist teams, приймаються лише перелічені teams/channels (із обов’язковим згадуванням).
- Майстер налаштування приймає записи `Team/Channel` і зберігає їх за вас.
- Під час запуску OpenClaw зіставляє назви team/channel і користувачів з allowlist в ID (якщо дозволи Graph це дозволяють)
  і логуватиме це зіставлення; назви team/channel, які не вдалося зіставити, зберігаються як введені, але типово ігноруються для маршрутизації, якщо не ввімкнено `channels.msteams.dangerouslyAllowNameMatching: true`.

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
    Перейдіть на [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) і заповніть вкладку **Basics**:

    | Field              | Value                                                    |
    | ------------------ | -------------------------------------------------------- |
    | **Bot handle**     | Назва вашого бота, наприклад `openclaw-msteams` (має бути унікальною) |
    | **Subscription**   | Ваша підписка Azure                                      |
    | **Resource group** | Створіть нову або використайте наявну                    |
    | **Pricing tier**   | **Free** для розробки/тестування                         |
    | **Type of App**    | **Single Tenant** (рекомендовано)                        |
    | **Creation type**  | **Create new Microsoft App ID**                          |

    <Note>
    Нові multi-tenant боти були застарілими після 2025-07-31. Для нових ботів використовуйте **Single Tenant**.
    </Note>

    Натисніть **Review + create** → **Create** (зачекайте ~1–2 хвилини).

  </Step>

  <Step title="Збережіть облікові дані">
    У ресурсі Azure Bot → **Configuration**:

    - скопіюйте **Microsoft App ID** → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → скопіюйте значення → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="Налаштуйте endpoint для повідомлень">
    Azure Bot → **Configuration** → задайте **Messaging endpoint**:

    - Production: `https://your-domain.com/api/messages`
    - Локальна розробка: використайте тунель (див. [Локальна розробка](#local-development-tunneling))

  </Step>

  <Step title="Увімкніть канал Teams">
    Azure Bot → **Channels** → натисніть **Microsoft Teams** → Configure → Save. Прийміть Terms of Service.
  </Step>
</Steps>

## Federated authentication

> Додано в 2026.3.24

Для production-розгортань OpenClaw підтримує **federated authentication** як безпечнішу альтернативу client secret. Доступні два методи:

### Варіант A: автентифікація на основі сертифіката

Використовуйте PEM-сертифікат, зареєстрований у вашій Entra ID app registration.

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

Використовуйте Azure Managed Identity для автентифікації без пароля. Це ідеально для розгортань в інфраструктурі Azure (AKS, App Service, Azure VM), де доступна managed identity.

**Як це працює:**

1. Pod/VM бота має managed identity (system-assigned або user-assigned).
2. **Federated identity credential** пов’язує managed identity з Entra ID app registration.
3. Під час виконання OpenClaw використовує `@azure/identity` для отримання токенів із endpoint Azure IMDS (`169.254.169.254`).
4. Токен передається в Teams SDK для автентифікації бота.

**Передумови:**

- Інфраструктура Azure з увімкненою managed identity (AKS workload identity, App Service, VM)
- Створений federated identity credential в Entra ID app registration
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

Для розгортань AKS з workload identity:

1. **Увімкніть workload identity** у вашому кластері AKS.
2. **Створіть federated identity credential** в Entra ID app registration:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Додайте анотацію до Kubernetes service account** з app client ID:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Додайте label до pod** для ін’єкції workload identity:

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
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Автентифікація без пароля, не потрібно керувати секретами | Потрібна інфраструктура Azure         |

**Типова поведінка:** коли `authType` не задано, OpenClaw типово використовує автентифікацію через client secret. Наявні конфігурації продовжують працювати без змін.

## Локальна розробка (тунелювання)

Teams не може звертатися до `localhost`. Для локальної розробки використовуйте тунель:

**Варіант A: ngrok**

```bash
ngrok http 3978
# Скопіюйте https URL, наприклад https://abc123.ngrok.io
# Задайте messaging endpoint: https://abc123.ngrok.io/api/messages
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
5. Позначте області дії: **Personal**, **Team**, **Group Chat**
6. Натисніть **Distribute** → **Download app package**
7. У Teams: **Apps** → **Manage your apps** → **Upload a custom app** → виберіть ZIP

Це часто простіше, ніж вручну редагувати JSON-маніфести.

## Тестування бота

**Варіант A: Azure Web Chat (спочатку перевірте webhook)**

1. У Azure Portal → ваш ресурс Azure Bot → **Test in Web Chat**
2. Надішліть повідомлення — ви маєте побачити відповідь
3. Це підтверджує, що ваш webhook endpoint працює до налаштування Teams

**Варіант B: Teams (після встановлення застосунку)**

1. Встановіть застосунок Teams (sideload або через org catalog)
2. Знайдіть бота в Teams і надішліть йому DM
3. Перевірте логи Gateway на наявність вхідної активності

<Accordion title="Перевизначення через змінні середовища">

Будь-які ключі конфігурації бота/автентифікації також можна задати через змінні середовища:

- `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (`"secret"` або `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH`, `MSTEAMS_CERTIFICATE_THUMBPRINT` (federated + сертифікат)
- `MSTEAMS_USE_MANAGED_IDENTITY`, `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (federated + managed identity; client ID лише для user-assigned)

</Accordion>

## Дія інформації про учасника

OpenClaw надає для Microsoft Teams дію `member-info`, що працює через Graph, щоб агенти й автоматизації могли безпосередньо через Microsoft Graph отримувати дані про учасників каналу (display name, email, role).

Вимоги:

- дозвіл RSC `Member.Read.Group` (вже є в рекомендованому маніфесті)
- для міжкомандних lookup: дозвіл Graph Application `User.Read.All` з admin consent

Дія контролюється через `channels.msteams.actions.memberInfo` (типово: увімкнено, коли доступні облікові дані Graph).

## Контекст історії

- `channels.msteams.historyLimit` визначає, скільки останніх повідомлень каналу/групи буде додано в prompt.
- Має fallback на `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути (типово 50).
- Отримана історія треду фільтрується за списками дозволених відправників (`allowFrom` / `groupAllowFrom`), тож початковий контекст треду містить лише повідомлення від дозволених відправників.
- Контекст цитованих вкладень (`ReplyTo*`, похідний від HTML-відповіді Teams) наразі передається як отримано.
- Іншими словами, allowlist контролюють, хто може запускати агента; наразі фільтруються лише окремі шляхи додаткового контексту.
- Історію DM можна обмежити через `channels.msteams.dmHistoryLimit` (ходи користувача). Перевизначення для окремих користувачів: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи Teams RSC

Це **наявні resourceSpecific permissions** у нашому маніфесті застосунку Teams. Вони діють лише в межах team/chat, де встановлено застосунок.

**Для каналів (область дії team):**

- `ChannelMessage.Read.Group` (Application) - отримання всіх повідомлень каналу без @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Для групових чатів:**

- `ChatMessage.Read.Chat` (Application) - отримання всіх повідомлень групового чату без @mention

## Приклад маніфесту Teams

Мінімальний коректний приклад з потрібними полями. Замініть ID та URL.

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
- `bots[].supportsFiles: true` є обов’язковим для обробки файлів в особистій області.
- `authorization.permissions.resourceSpecific` має включати дозволи на читання/надсилання в каналах, якщо вам потрібен трафік каналів.

### Оновлення наявного застосунку

Щоб оновити вже встановлений застосунок Teams (наприклад, щоб додати дозволи RSC):

1. Оновіть свій `manifest.json` новими налаштуваннями
2. **Збільшіть значення поля `version`** (наприклад, `1.0.0` → `1.1.0`)
3. **Запакуйте маніфест заново** разом з іконками (`manifest.json`, `outline.png`, `color.png`)
4. Завантажте новий zip:
   - **Варіант A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → знайдіть свій застосунок → Upload new version
   - **Варіант B (Sideload):** у Teams → Apps → Manage your apps → Upload a custom app
5. **Для team channels:** перевстановіть застосунок у кожній team, щоб нові дозволи набули чинності
6. **Повністю закрийте й заново запустіть Teams** (а не просто закрийте вікно), щоб очистити кешовані метадані застосунку

## Можливості: лише RSC проти Graph

### Лише Teams RSC (без дозволів Graph API)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання файлових вкладень у **особистих повідомленнях (DM)**.

Не працює:

- **Зображення або вміст файлів** у каналах/групах (payload містить лише HTML-заглушку).
- Завантаження вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень (поза межами події живого webhook).

### Teams RSC плюс дозволи застосунку Microsoft Graph

Додає:

- Завантаження hosted contents (зображень, вставлених у повідомлення).
- Завантаження файлових вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень каналів/чатів через Graph.

### RSC проти Graph API

| Capability              | RSC Permissions      | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Real-time messages**  | Так (через webhook)  | Ні (лише опитування)                |
| **Historical messages** | Ні                   | Так (можна запитувати історію)      |
| **Setup complexity**    | Лише маніфест застосунку | Потрібні admin consent + потік токенів |
| **Works offline**       | Ні (має бути запущено) | Так (можна запитувати будь-коли)   |

**Підсумок:** RSC призначено для прослуховування в реальному часі; Graph API — для доступу до історії. Щоб надолужувати пропущені повідомлення під час офлайну, потрібен Graph API з `ChannelMessage.Read.All` (потребує admin consent).

## Media + history з Graph (обов’язково для каналів)

Якщо вам потрібні зображення/файли в **каналах** або потрібно отримувати **історію повідомлень**, необхідно ввімкнути дозволи Microsoft Graph і надати admin consent.

1. У **App Registration** Entra ID (Azure AD) додайте **Application permissions** Microsoft Graph:
   - `ChannelMessage.Read.All` (вкладення каналів + історія)
   - `Chat.Read.All` або `ChatMessage.Read.All` (групові чати)
2. **Надайте admin consent** для тенанта.
3. Збільшіть **версію маніфесту** застосунку Teams, повторно завантажте його та **перевстановіть застосунок у Teams**.
4. **Повністю закрийте й заново запустіть Teams**, щоб очистити кешовані метадані застосунку.

**Додатковий дозвіл для згадувань користувачів:** згадування користувачів через @ працюють одразу для користувачів у межах поточної розмови. Однак якщо ви хочете динамічно шукати й згадувати користувачів, які **не входять до поточної розмови**, додайте дозвіл `User.Read.All` (Application) і надайте admin consent.

## Відомі обмеження

### Тайм-аути webhook

Teams доставляє повідомлення через HTTP webhook. Якщо обробка займає забагато часу (наприклад, через повільні відповіді LLM), ви можете побачити:

- тайм-аути Gateway
- повторні спроби Teams доставити повідомлення (що спричиняє дублікати)
- втрачені відповіді

OpenClaw обробляє це, швидко повертаючи відповідь і надсилаючи відповіді проактивно, але дуже повільні відповіді все одно можуть спричиняти проблеми.

### Форматування

Markdown у Teams обмеженіший, ніж у Slack або Discord:

- Базове форматування працює: **жирний**, _курсив_, `code`, посилання
- Складний Markdown (таблиці, вкладені списки) може відображатися некоректно
- Adaptive Cards підтримуються для опитувань і надсилань із семантичним представленням (див. нижче)

## Налаштування

Згруповані параметри (див. `/gateway/configuration` для спільних шаблонів каналів).

<AccordionGroup>
  <Accordion title="Core і webhook">
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
    - `allowFrom`: allowlist для DM, бажано використовувати AAD object ID; майстер зіставляє імена, коли доступний доступ до Graph
    - `dangerouslyAllowNameMatching`: аварійний режим для маршрутизації за змінюваними UPN/display-name і назвами team/channel
    - `requireMention`: вимагати @mention у каналах/групах (типово `true`)
  </Accordion>

  <Accordion title="Перевизначення для team і channel">
    Усі ці параметри перевизначають значення верхнього рівня:

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender`: типові політики інструментів для конкретної team
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    Ключі `toolsBySender` приймають префікси `id:`, `e164:`, `username:`, `name:` (ключі без префікса зіставляються з `id:`). `"*"` — wildcard.

  </Accordion>

  <Accordion title="Доставка, media і дії">
    - `textChunkLimit`: розмір фрагмента вихідного тексту
    - `chunkMode`: `length` (типово) або `newline` (спочатку розбивати за межами абзаців, а потім за довжиною)
    - `mediaAllowHosts`: allowlist хостів для вхідних вкладень (типово домени Microsoft/Teams)
    - `mediaAuthAllowHosts`: хости, яким можна надсилати заголовки Authorization під час повторних спроб (типово Graph + Bot Framework)
    - `replyStyle`: `thread | top-level` (див. [Стиль відповіді](#reply-style-threads-vs-posts))
    - `actions.memberInfo`: перемикач дії member info через Graph (типово ввімкнено, коли Graph доступний)
    - `sharePointSiteId`: обов’язковий для завантаження файлів у групових чатах/каналах (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats))
  </Accordion>
</AccordionGroup>

## Маршрутизація та сесії

- Ключі сесій відповідають стандартному формату агента (див. [/concepts/session](/uk/concepts/session)):
  - Прямі повідомлення використовують основну сесію (`agent:<agentId>:<mainKey>`).
  - Повідомлення каналу/групи використовують conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль відповіді: треди проти дописів

Нещодавно Teams запровадив два стилі UI для каналів поверх тієї самої базової моделі даних:

| Style                    | Description                                               | Recommended `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (classic)      | Повідомлення відображаються як картки з тредовими відповідями під ними | `thread` (типово)        |
| **Threads** (like Slack) | Повідомлення йдуть лінійно, більше схоже на Slack         | `top-level`              |

**Проблема:** API Teams не надає інформації про те, який стиль UI використовує канал. Якщо ви використовуєте неправильний `replyStyle`:

- `thread` у каналі зі стилем Threads → відповіді виглядають незграбно вкладеними
- `top-level` у каналі зі стилем Posts → відповіді з’являються як окремі дописи верхнього рівня, а не в треді

**Рішення:** налаштуйте `replyStyle` окремо для кожного каналу залежно від того, як налаштовано канал:

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
- **Канали/групи:** вкладення зберігаються в сховищі M365 (SharePoint/OneDrive). Payload webhook містить лише HTML-заглушку, а не фактичні байти файла. **Для завантаження вкладень каналів потрібні дозволи Graph API**.
- Для явних надсилань, де файл є основним, використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов’язкове `message` стає супровідним текстом/коментарем, а `filename` перевизначає назву завантаженого файла.

Без дозволів Graph повідомлення каналів із зображеннями будуть отримуватися лише як текст (вміст зображення боту недоступний).
Типово OpenClaw завантажує media лише з hostname Microsoft/Teams. Це можна перевизначити через `channels.msteams.mediaAllowHosts` (використайте `["*"]`, щоб дозволити будь-який хост).
Заголовки Authorization додаються лише для хостів із `channels.msteams.mediaAuthAllowHosts` (типово це хости Graph + Bot Framework). Залишайте цей список суворим (уникайте суфіксів multi-tenant).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в DM через потік FileConsentCard (вбудований). Однак **надсилання файлів у групових чатах/каналах** потребує додаткового налаштування:

| Context                  | How files are sent                           | Setup needed                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → користувач приймає → бот завантажує | Працює одразу                                   |
| **Group chats/channels** | Завантаження в SharePoint → посилання для спільного доступу | Потрібні `sharePointSiteId` + дозволи Graph     |
| **Images (any context)** | Base64-кодування inline                      | Працює одразу                                   |

### Чому груповим чатам потрібен SharePoint

Боти не мають персонального диска OneDrive (endpoint Graph API `/me/drive` не працює для application identities). Щоб надсилати файли в групових чатах/каналах, бот завантажує їх на **сайт SharePoint** і створює посилання для спільного доступу.

### Налаштування

1. **Додайте дозволи Graph API** у Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - завантаження файлів у SharePoint
   - `Chat.Read.All` (Application) - необов’язково, вмикає посилання для доступу для окремих користувачів

2. **Надайте admin consent** для тенанта.

3. **Отримайте ID свого сайту SharePoint:**

   ```bash
   # Через Graph Explorer або curl з чинним токеном:
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
| `Sites.ReadWrite.All` only              | Посилання для спільного доступу на рівні всієї організації (будь-хто в org має доступ) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Посилання для доступу окремим користувачам (доступ мають лише учасники чату) |

Доступ для окремих користувачів безпечніший, оскільки файл доступний лише учасникам чату. Якщо дозвіл `Chat.Read.All` відсутній, бот використовує fallback на спільний доступ для всієї організації.

### Поведінка fallback

| Scenario                                          | Result                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Груповий чат + файл + налаштовано `sharePointSiteId` | Завантаження в SharePoint, надсилання посилання для спільного доступу |
| Груповий чат + файл + без `sharePointSiteId`      | Спроба завантаження в OneDrive (може не вдатися), надсилання лише тексту |
| Особистий чат + файл                              | Потік FileConsentCard (працює без SharePoint)      |
| Будь-який контекст + зображення                   | Base64-кодування inline (працює без SharePoint)    |

### Місце зберігання файлів

Завантажені файли зберігаються в папці `/OpenClawShared/` у типовій бібліотеці документів налаштованого сайту SharePoint.

## Опитування (adaptive cards)

OpenClaw надсилає опитування Teams як Adaptive Cards (вбудованого API опитувань у Teams немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоси записуються Gateway у `~/.openclaw/msteams-polls.json`.
- Gateway має залишатися онлайн, щоб записувати голоси.
- Опитування поки що не публікують підсумки результатів автоматично (за потреби перегляньте файл сховища).

## Картки представлення

Надсилайте semantic payload представлення користувачам або в розмови Teams за допомогою інструмента `message` або CLI. OpenClaw рендерить їх як Teams Adaptive Cards із загального контракту представлення.

Параметр `presentation` приймає semantic blocks. Якщо передано `presentation`, текст повідомлення не є обов’язковим.

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

Докладно про формат target див. [Формати target](#target-formats) нижче.

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

# Надіслати користувачу за display name (викликає lookup через Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Надіслати в груповий чат або канал
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Надіслати картку представлення в розмову
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

Примітка: без префікса `user:` імена типово трактуються як група/team для зіставлення. Завжди використовуйте `user:`, коли звертаєтеся до людей за display name.

## Проактивні повідомлення

- Проактивні повідомлення можливі лише **після** того, як користувач уже взаємодіяв, оскільки саме тоді ми зберігаємо посилання на розмову.
- Див. `/gateway/configuration` щодо `dmPolicy` та обмежень allowlist.

## ID team і channel

Параметр запиту `groupId` в URL Teams **не є** team ID, який використовується для конфігурації. Натомість витягуйте ID зі шляху URL:

**URL team:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (URL-decode this)
```

**URL channel:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Для конфігурації:**

- Team ID = сегмент шляху після `/team/` (після URL-decode, наприклад `19:Bk4j...@thread.tacv2`)
- Channel ID = сегмент шляху після `/channel/` (після URL-decode)
- **Ігноруйте** параметр запиту `groupId`

## Приватні канали

Боти мають обмежену підтримку в приватних каналах:

| Feature                      | Standard Channels | Private Channels       |
| ---------------------------- | ----------------- | ---------------------- |
| Встановлення бота            | Так               | Обмежено               |
| Повідомлення в реальному часі (webhook) | Так    | Може не працювати      |
| Дозволи RSC                  | Так               | Можуть поводитися інакше |
| @mentions                    | Так               | Якщо бот доступний     |
| Історія через Graph API      | Так               | Так (за наявності дозволів) |

**Обхідні шляхи, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом
2. Використовуйте DM — користувачі завжди можуть написати боту напряму
3. Використовуйте Graph API для історичного доступу (потребує `ChannelMessage.Read.All`)

## Усунення несправностей

### Поширені проблеми

- **Зображення не показуються в каналах:** відсутні дозволи Graph або admin consent. Перевстановіть застосунок Teams і повністю закрийте/заново відкрийте Teams.
- **Немає відповідей у каналі:** типово потрібні згадування; задайте `channels.msteams.requireMention=false` або налаштуйте це окремо для team/channel.
- **Невідповідність версії (Teams досі показує старий маніфест):** видаліть і знову додайте застосунок та повністю закрийте Teams для оновлення.
- **401 Unauthorized від webhook:** очікувано під час ручного тестування без Azure JWT — це означає, що endpoint доступний, але автентифікація не пройшла. Для коректної перевірки використовуйте Azure Web Chat.

### Помилки завантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли іконок розміром 0 байт. Створіть коректні PNG-іконки (32x32 для `outline.png`, 192x192 для `color.png`).
- **"webApplicationInfo.Id already in use":** застосунок усе ще встановлений в іншій team/chat. Спочатку знайдіть і видаліть його або зачекайте 5–10 хвилин на поширення змін.
- **"Something went wrong" під час завантаження:** завантажте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools браузера (F12) → вкладка Network і перевірте тіло відповіді, щоб побачити фактичну помилку.
- **Помилка sideload:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app" — це часто обходить обмеження sideload.

### Дозволи RSC не працюють

1. Переконайтеся, що `webApplicationInfo.id` точно збігається з App ID вашого бота
2. Повторно завантажте застосунок і перевстановіть його в team/chat
3. Перевірте, чи адміністратор вашої org не заблокував дозволи RSC
4. Підтвердьте, що ви використовуєте правильну область дії: `ChannelMessage.Read.Group` для teams, `ChatMessage.Read.Chat` для групових чатів

## Посилання

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - посібник із налаштування Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - створення та керування застосунками Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для channel/group потрібен Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Пов’язане

<CardGroup cols={2}>
  <Card title="Огляд каналів" icon="list" href="/uk/channels">
    Усі підтримувані канали.
  </Card>
  <Card title="Pairing" icon="link" href="/uk/channels/pairing">
    Автентифікація DM і потік pairing.
  </Card>
  <Card title="Групи" icon="users" href="/uk/channels/groups">
    Поведінка групового чату та обмеження через згадування.
  </Card>
  <Card title="Маршрутизація каналів" icon="route" href="/uk/channels/channel-routing">
    Маршрутизація сесій для повідомлень.
  </Card>
  <Card title="Безпека" icon="shield" href="/uk/gateway/security">
    Модель доступу та посилення безпеки.
  </Card>
</CardGroup>
