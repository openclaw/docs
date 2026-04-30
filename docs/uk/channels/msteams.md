---
read_when:
    - Робота над функціями каналу Microsoft Teams
summary: Стан підтримки, можливості та налаштування бота Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-30T00:42:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: c2c8cd13a72941a18d609b1f7263d9b9ed3284873f9b1483975ca1356b543979
    source_path: channels/msteams.md
    workflow: 16
---

Стан: підтримуються текст і вкладення в DM; надсилання файлів у канал/групу потребує `sharePointSiteId` + дозволів Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Опитування надсилаються через Adaptive Cards. Дії з повідомленнями надають явний `upload-file` для надсилань, де файл є першим.

## Вбудований Plugin

Microsoft Teams постачається як вбудований Plugin у поточних випусках OpenClaw, тому в звичайній пакетованій збірці окреме встановлення не потрібне.

Якщо ви використовуєте старішу збірку або власне встановлення, яке виключає вбудований Teams, встановіть поточний npm-пакет, коли його буде опубліковано:

```bash
openclaw plugins install @openclaw/msteams
```

Якщо npm повідомляє, що пакет, який належить OpenClaw, застарілий, використовуйте поточну пакетовану збірку OpenClaw або шлях до локального checkout, доки не буде опубліковано новіший npm-пакет.

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Докладно: [Plugins](/uk/tools/plugin)

## Швидке налаштування

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) обробляє реєстрацію бота, створення маніфесту та генерування облікових даних однією командою.

**1. Встановіть і ввійдіть**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI наразі перебуває в preview. Команди й прапорці можуть змінюватися між випусками.
</Note>

**2. Запустіть тунель** (Teams не може дістатися localhost)

Встановіть і автентифікуйте devtunnel CLI, якщо ви ще цього не зробили ([посібник із початку роботи](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` потрібен, оскільки Teams не може автентифікуватися з devtunnels. Кожен вхідний запит бота все одно автоматично перевіряється Teams SDK.
</Note>

Альтернативи: `ngrok http 3978` або `tailscale funnel 3978` (але вони можуть змінювати URL кожної сесії).

**3. Створіть застосунок**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Ця одна команда:

- Створює застосунок Entra ID (Azure AD)
- Генерує client secret
- Збирає й завантажує маніфест застосунку Teams (з іконками)
- Реєструє бота (типово керується Teams — підписка Azure не потрібна)

Вивід покаже `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` і **Teams App ID** — занотуйте їх для наступних кроків. Він також запропонує встановити застосунок безпосередньо в Teams.

**4. Налаштуйте OpenClaw** за допомогою облікових даних із виводу:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Або використовуйте змінні середовища напряму: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Встановіть застосунок у Teams**

`teams app create` запропонує встановити застосунок — виберіть "Install in Teams". Якщо ви пропустили це, можете отримати посилання пізніше:

```bash
teams app get <teamsAppId> --install-link
```

**6. Перевірте, що все працює**

```bash
teams app doctor <teamsAppId>
```

Це запускає діагностику реєстрації бота, конфігурації застосунку AAD, чинності маніфесту й налаштування SSO.

Для production-розгортань розгляньте використання [федеративної автентифікації](/uk/channels/msteams#federated-authentication-certificate-plus-managed-identity) (сертифікат або managed identity) замість client secrets.

<Note>
Групові чати типово заблоковані (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` або використайте `groupPolicy: "open"`, щоб дозволити будь-якого учасника (з обмеженням за згадкою).
</Note>

## Цілі

- Спілкуватися з OpenClaw через DM, групові чати або канали Teams.
- Зберігати детермінізм маршрутизації: відповіді завжди повертаються в канал, з якого надійшли.
- Типово використовувати безпечну поведінку каналів (згадки обов’язкові, якщо не налаштовано інакше).

## Записи конфігурації

Типово Microsoft Teams дозволено записувати оновлення конфігурації, ініційовані `/config set|unset` (потребує `commands.config: true`).

Вимкніть за допомогою:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Контроль доступу (DM + групи)

**Доступ до DM**

- Типово: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються, доки їх не схвалено.
- `channels.msteams.allowFrom` має використовувати стабільні object IDs AAD.
- Не покладайтеся на зіставлення UPN/display-name для allowlists — вони можуть змінюватися. OpenClaw типово вимикає пряме зіставлення імен; увімкніть його явно через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер може зіставляти імена з IDs через Microsoft Graph, коли облікові дані це дозволяють.

**Доступ груп**

- Типово: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, якщо ви не додасте `groupAllowFrom`). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити типове значення, коли воно не задане.
- `channels.msteams.groupAllowFrom` керує тим, які відправники можуть запускати дії в групових чатах/каналах (із fallback до `channels.msteams.allowFrom`).
- Задайте `groupPolicy: "open"`, щоб дозволити будь-якого учасника (типово все одно з обмеженням за згадкою).
- Щоб не дозволяти **жодних каналів**, задайте `channels.msteams.groupPolicy: "disabled"`.

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

- Обмежуйте відповіді в групах/каналах, перелічуючи команди й канали в `channels.msteams.teams`.
- Ключі мають використовувати стабільні Teams conversation IDs із посилань Teams, а не змінні відображувані назви.
- Коли `groupPolicy="allowlist"` і наявний allowlist команд, приймаються лише перелічені команди/канали (з обмеженням за згадкою).
- Майстер налаштування приймає записи `Team/Channel` і зберігає їх для вас.
- Під час запуску OpenClaw зіставляє назви team/channel і user allowlist з IDs (коли дозволи Graph це дозволяють)
  і логує мапінг; нерозв’язані назви team/channel зберігаються так, як введені, але типово ігноруються для маршрутизації, якщо не ввімкнено `channels.msteams.dangerouslyAllowNameMatching: true`.

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

<details>
<summary><strong>Ручне налаштування (без Teams CLI)</strong></summary>

Якщо ви не можете використовувати Teams CLI, можете налаштувати бота вручну через Azure Portal.

### Як це працює

1. Переконайтеся, що Microsoft Teams Plugin доступний (вбудований у поточні випуски).
2. Створіть **Azure Bot** (App ID + secret + tenant ID).
3. Зберіть **пакет застосунку Teams**, який посилається на бота й містить дозволи RSC нижче.
4. Завантажте/встановіть застосунок Teams у команду (або personal scope для DM).
5. Налаштуйте `msteams` у `~/.openclaw/openclaw.json` (або env vars) і запустіть Gateway.
6. Gateway типово слухає трафік Bot Framework Webhook на `/api/messages`.

### Крок 1: Створіть Azure Bot

1. Перейдіть до [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Заповніть вкладку **Basics**:

   | Поле               | Значення                                                 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Назва вашого бота, напр., `openclaw-msteams` (має бути унікальною) |
   | **Subscription**   | Виберіть вашу підписку Azure                             |
   | **Resource group** | Створіть нову або використайте наявну                    |
   | **Pricing tier**   | **Free** для розробки/тестування                         |
   | **Type of App**    | **Single Tenant** (рекомендовано - див. примітку нижче)  |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Створення нових multi-tenant ботів було застарілим після 2025-07-31. Використовуйте **Single Tenant** для нових ботів.
</Warning>

3. Натисніть **Review + create** → **Create** (зачекайте ~1-2 хвилини)

### Крок 2: Отримайте облікові дані

1. Перейдіть до вашого ресурсу Azure Bot → **Configuration**
2. Скопіюйте **Microsoft App ID** → це ваш `appId`
3. Натисніть **Manage Password** → перейдіть до App Registration
4. У **Certificates & secrets** → **New client secret** → скопіюйте **Value** → це ваш `appPassword`
5. Перейдіть до **Overview** → скопіюйте **Directory (tenant) ID** → це ваш `tenantId`

### Крок 3: Налаштуйте Messaging Endpoint

1. В Azure Bot → **Configuration**
2. Задайте **Messaging endpoint** як URL вашого Webhook:
   - Production: `https://your-domain.com/api/messages`
   - Локальна розробка: використовуйте тунель (див. [Локальна розробка](#local-development-tunneling) нижче)

### Крок 4: Увімкніть канал Teams

1. В Azure Bot → **Channels**
2. Натисніть **Microsoft Teams** → Configure → Save
3. Прийміть Terms of Service

### Крок 5: Зберіть маніфест застосунку Teams

- Додайте запис `bot` із `botId = <App ID>`.
- Scopes: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (потрібно для обробки файлів у personal scope).
- Додайте дозволи RSC (див. [Дозволи RSC](#current-teams-rsc-permissions-manifest)).
- Створіть іконки: `outline.png` (32x32) і `color.png` (192x192).
- Запакуйте всі три файли разом у zip: `manifest.json`, `outline.png`, `color.png`.

### Крок 6: Налаштуйте OpenClaw

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

Змінні середовища: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Крок 7: Запустіть Gateway

Канал Teams запускається автоматично, коли Plugin доступний і конфігурація `msteams` існує з обліковими даними.

</details>

## Федеративна автентифікація (сертифікат плюс managed identity)

> Додано у 2026.4.11

Для production-розгортань OpenClaw підтримує **федеративну автентифікацію** як безпечнішу альтернативу client secrets. Доступні два методи:

### Варіант A: Автентифікація на основі сертифіката

Використовуйте PEM-сертифікат, зареєстрований у вашій реєстрації застосунку Entra ID.

**Налаштування:**

1. Згенеруйте або отримайте сертифікат (формат PEM із приватним ключем).
2. В Entra ID → App Registration → **Certificates & secrets** → **Certificates** → завантажте публічний сертифікат.

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
2. **Federated identity credential** пов’язує managed identity із реєстрацією застосунку Entra ID.
3. Під час виконання OpenClaw використовує `@azure/identity`, щоб отримувати токени з Azure IMDS endpoint (`169.254.169.254`).
4. Токен передається в Teams SDK для автентифікації бота.

**Передумови:**

- Інфраструктура Azure з увімкненою managed identity (AKS workload identity, App Service, VM)
- Federated identity credential, створений у реєстрації застосунку Entra ID
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

**Конфігурація (призначена користувачем керована ідентичність):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (лише для призначеної користувачем)

### Налаштування ідентичності робочого навантаження AKS

Для розгортань AKS, що використовують ідентичність робочого навантаження:

1. **Увімкніть ідентичність робочого навантаження** у вашому кластері AKS.
2. **Створіть облікові дані федеративної ідентичності** у реєстрації застосунку Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Додайте анотацію до сервісного облікового запису Kubernetes** з ID клієнта застосунку:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Додайте мітку до пода** для інʼєкції ідентичності робочого навантаження:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Забезпечте мережевий доступ** до IMDS (`169.254.169.254`) — якщо використовується NetworkPolicy, додайте правило вихідного трафіку, яке дозволяє трафік до `169.254.169.254/32` на порті 80.

### Порівняння типів автентифікації

| Метод                    | Конфігурація                                  | Переваги                              | Недоліки                                      |
| ------------------------ | --------------------------------------------- | ------------------------------------- | --------------------------------------------- |
| **Секрет клієнта**       | `appPassword`                                 | Просте налаштування                   | Потрібна ротація секрету, менш безпечно       |
| **Сертифікат**           | `authType: "federated"` + `certificatePath`   | Немає спільного секрету через мережу  | Додаткове керування сертифікатами             |
| **Керована ідентичність** | `authType: "federated"` + `useManagedIdentity` | Без пароля, не потрібно керувати секретами | Потрібна інфраструктура Azure                 |

**Поведінка за замовчуванням:** Коли `authType` не задано, OpenClaw за замовчуванням використовує автентифікацію через секрет клієнта. Наявні конфігурації продовжують працювати без змін.

## Локальна розробка (тунелювання)

Teams не може звертатися до `localhost`. Використовуйте постійний dev-тунель, щоб ваша URL-адреса залишалася однаковою між сеансами:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Альтернативи: `ngrok http 3978` або `tailscale funnel 3978` (URL-адреси можуть змінюватися в кожному сеансі).

Якщо URL-адреса вашого тунелю зміниться, оновіть кінцеву точку:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Тестування бота

**Запустіть діагностику:**

```bash
teams app doctor <teamsAppId>
```

Перевіряє реєстрацію бота, застосунок AAD, маніфест і конфігурацію SSO за один прохід.

**Надішліть тестове повідомлення:**

1. Установіть застосунок Teams (скористайтеся посиланням для встановлення з `teams app get <id> --install-link`)
2. Знайдіть бота в Teams і надішліть йому DM
3. Перевірте журнали Gateway на наявність вхідної активності

## Змінні середовища

Усі ключі конфігурації натомість можна задавати через змінні середовища:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (необовʼязково: `"secret"` або `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (федеративна автентифікація + сертифікат)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (необовʼязково, не потрібно для автентифікації)
- `MSTEAMS_USE_MANAGED_IDENTITY` (федеративна автентифікація + керована ідентичність)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (лише призначена користувачем керована ідентичність)

## Дія з інформацією про учасника

OpenClaw надає дію `member-info` на основі Graph для Microsoft Teams, щоб агенти й автоматизації могли отримувати відомості про учасників каналу (відображуване імʼя, електронна пошта, роль) безпосередньо з Microsoft Graph.

Вимоги:

- Дозвіл RSC `Member.Read.Group` (уже є в рекомендованому маніфесті)
- Для пошуку між командами: дозвіл Graph Application `User.Read.All` зі згодою адміністратора

Дія керується параметром `channels.msteams.actions.memberInfo` (за замовчуванням: увімкнено, коли доступні облікові дані Graph).

## Контекст історії

- `channels.msteams.historyLimit` керує тим, скільки останніх повідомлень каналу/групи загортається в запит.
- Має резервне значення `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути (за замовчуванням 50).
- Отримана історія треду фільтрується за списками дозволених відправників (`allowFrom` / `groupAllowFrom`), тому початкове наповнення контексту треду містить лише повідомлення від дозволених відправників.
- Контекст цитованих вкладень (отриманий із HTML-відповіді Teams `ReplyTo*`) наразі передається як отримано.
- Іншими словами, списки дозволених визначають, хто може запускати агента; сьогодні фільтруються лише окремі шляхи додаткового контексту.
- Історію DM можна обмежити за допомогою `channels.msteams.dmHistoryLimit` (ходи користувача). Перевизначення для окремих користувачів: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи RSC Teams (маніфест)

Це **наявні ресурсно-специфічні дозволи** в маніфесті нашого застосунку Teams. Вони застосовуються лише всередині команди/чату, де встановлено застосунок.

**Для каналів (область команди):**

- `ChannelMessage.Read.Group` (Application) - отримувати всі повідомлення каналу без @згадки
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Для групових чатів:**

- `ChatMessage.Read.Chat` (Application) - отримувати всі повідомлення групового чату без @згадки

Щоб додати дозволи RSC через Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Приклад маніфесту Teams (відредаговано)

Мінімальний, чинний приклад із потрібними полями. Замініть ID та URL-адреси.

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

### Застереження щодо маніфесту (обовʼязкові поля)

- `bots[].botId` **має** збігатися з Azure Bot App ID.
- `webApplicationInfo.id` **має** збігатися з Azure Bot App ID.
- `bots[].scopes` має включати поверхні, які ви плануєте використовувати (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` потрібен для обробки файлів в особистій області.
- `authorization.permissions.resourceSpecific` має включати читання/надсилання для каналів, якщо вам потрібен трафік каналів.

### Оновлення наявного застосунку

Щоб оновити вже встановлений застосунок Teams (наприклад, щоб додати дозволи RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Після оновлення перевстановіть застосунок у кожній команді, щоб нові дозволи набули чинності, і **повністю закрийте та перезапустіть Teams** (не просто закрийте вікно), щоб очистити кешовані метадані застосунку.

<details>
<summary>Ручне оновлення маніфесту (без CLI)</summary>

1. Оновіть ваш `manifest.json` новими налаштуваннями
2. **Збільште поле `version`** (наприклад, `1.0.0` → `1.1.0`)
3. **Заново запакуйте в zip** маніфест з іконками (`manifest.json`, `outline.png`, `color.png`)
4. Завантажте новий zip:
   - **Teams Admin Center:** застосунки Teams → Керування застосунками → знайдіть ваш застосунок → Завантажити нову версію
   - **Sideload:** у Teams → Застосунки → Керування вашими застосунками → Завантажити власний застосунок

</details>

## Можливості: лише RSC проти Graph

### З **лише Teams RSC** (застосунок установлено, дозволів Graph API немає)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання файлових вкладень **особистих (DM)** повідомлень.

Не працює:

- **Вміст зображень або файлів** у каналі/групі (корисне навантаження містить лише HTML-заглушку).
- Завантаження вкладень, збережених у SharePoint/OneDrive.
- Читання історії повідомлень (поза межами події live Webhook).

### З **Teams RSC + дозволами Microsoft Graph Application**

Додає:

- Завантаження розміщеного вмісту (зображень, вставлених у повідомлення).
- Завантаження файлових вкладень, збережених у SharePoint/OneDrive.
- Читання історії повідомлень каналу/чату через Graph.

### RSC проти Graph API

| Можливість                  | Дозволи RSC         | Graph API                                  |
| --------------------------- | ------------------- | ------------------------------------------ |
| **Повідомлення в реальному часі** | Так (через Webhook) | Ні (лише опитування)                       |
| **Історичні повідомлення**  | Ні                  | Так (можна запитувати історію)             |
| **Складність налаштування** | Лише маніфест застосунку | Потрібна згода адміністратора + потік токенів |
| **Працює офлайн**           | Ні (має бути запущено) | Так (запит у будь-який час)                |

**Підсумок:** RSC призначено для прослуховування в реальному часі; Graph API — для доступу до історії. Щоб наздоганяти пропущені повідомлення під час офлайну, потрібен Graph API з `ChannelMessage.Read.All` (потрібна згода адміністратора).

## Медіа та історія з увімкненим Graph (потрібно для каналів)

Якщо вам потрібні зображення/файли в **каналах** або ви хочете отримувати **історію повідомлень**, потрібно ввімкнути дозволи Microsoft Graph і надати згоду адміністратора.

1. В **реєстрації застосунку** Entra ID (Azure AD) додайте **дозволи Application** Microsoft Graph:
   - `ChannelMessage.Read.All` (вкладення каналу + історія)
   - `Chat.Read.All` або `ChatMessage.Read.All` (групові чати)
2. **Надайте згоду адміністратора** для клієнта.
3. Підвищте **версію маніфесту** застосунку Teams, повторно завантажте його та **перевстановіть застосунок у Teams**.
4. **Повністю закрийте та перезапустіть Teams**, щоб очистити кешовані метадані застосунку.

**Додатковий дозвіл для згадок користувачів:** @згадки користувачів працюють одразу для користувачів у розмові. Однак, якщо ви хочете динамічно шукати й згадувати користувачів, яких **немає в поточній розмові**, додайте дозвіл `User.Read.All` (Application) і надайте згоду адміністратора.

## Відомі обмеження

### Тайм-аути Webhook

Teams доставляє повідомлення через HTTP Webhook. Якщо обробка триває надто довго (наприклад, повільні відповіді LLM), ви можете побачити:

- Тайм-аути Gateway
- Повторні спроби Teams надіслати повідомлення (що спричиняє дублікати)
- Відкинуті відповіді

OpenClaw обробляє це, швидко повертаючи відповідь і проактивно надсилаючи повідомлення, але дуже повільні відповіді все одно можуть спричиняти проблеми.

### Форматування

Markdown у Teams обмеженіший, ніж у Slack або Discord:

- Базове форматування працює: **жирний**, _курсив_, `code`, посилання
- Складний markdown (таблиці, вкладені списки) може відображатися некоректно
- Adaptive Cards підтримуються для опитувань і семантичних presentation-відправлень (див. нижче)

## Конфігурація

Ключові налаштування (див. `/gateway/configuration` для спільних патернів каналів):

- `channels.msteams.enabled`: увімкнути/вимкнути канал.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: облікові дані бота.
- `channels.msteams.webhook.port` (типово `3978`)
- `channels.msteams.webhook.path` (типово `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (типово: pairing)
- `channels.msteams.allowFrom`: allowlist для DM (рекомендовано AAD object IDs). Майстер зіставляє імена з ID під час налаштування, коли доступний доступ до Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: аварійний перемикач для повторного ввімкнення зіставлення за змінними UPN/display-name і прямої маршрутизації за назвою команди/каналу.
- `channels.msteams.textChunkLimit`: розмір фрагмента вихідного тексту.
- `channels.msteams.chunkMode`: `length` (типово) або `newline`, щоб ділити за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.msteams.mediaAllowHosts`: allowlist для хостів вхідних вкладень (типово домени Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist для додавання заголовків Authorization під час повторних спроб роботи з медіа (типово хости Graph + Bot Framework).
- `channels.msteams.requireMention`: вимагати @mention у каналах/групах (типово true).
- `channels.msteams.replyStyle`: `thread | top-level` (див. [Стиль відповіді](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.requireMention`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.tools`: стандартні перевизначення політики інструментів для окремої команди (`allow`/`deny`/`alsoAllow`), що використовуються, коли немає перевизначення для каналу.
- `channels.msteams.teams.<teamId>.toolsBySender`: стандартні перевизначення політики інструментів для окремої команди й окремого відправника (підтримується wildcard `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: перевизначення політики інструментів для окремого каналу (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: перевизначення політики інструментів для окремого каналу й окремого відправника (підтримується wildcard `"*"`).
- Ключі `toolsBySender` мають використовувати явні префікси:
  `id:`, `e164:`, `username:`, `name:` (застарілі ключі без префікса все ще зіставляються лише з `id:`).
- `channels.msteams.actions.memberInfo`: увімкнути або вимкнути дію отримання інформації про учасника на основі Graph (типово: увімкнено, коли доступні облікові дані Graph).
- `channels.msteams.authType`: тип автентифікації — `"secret"` (типово) або `"federated"`.
- `channels.msteams.certificatePath`: шлях до PEM-файлу сертифіката (федеративна автентифікація + автентифікація сертифікатом).
- `channels.msteams.certificateThumbprint`: відбиток сертифіката (необов’язково, не потрібно для автентифікації).
- `channels.msteams.useManagedIdentity`: увімкнути автентифікацію managed identity (федеративний режим).
- `channels.msteams.managedIdentityClientId`: client ID для призначеної користувачем managed identity.
- `channels.msteams.sharePointSiteId`: SharePoint site ID для завантаження файлів у групових чатах/каналах (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)).

## Маршрутизація та сесії

- Ключі сесій відповідають стандартному формату агента (див. [/concepts/session](/uk/concepts/session)):
  - Прямі повідомлення спільно використовують основну сесію (`agent:<agentId>:<mainKey>`).
  - Повідомлення каналів/груп використовують conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль відповіді: треди проти дописів

Teams нещодавно запровадив два стилі UI каналу поверх тієї самої базової моделі даних:

| Стиль                    | Опис                                               | Рекомендований `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (класичний)      | Повідомлення відображаються як картки з тредовими відповідями під ними | `thread` (типово)       |
| **Threads** (як у Slack) | Повідомлення йдуть лінійно, більше схоже на Slack                   | `top-level`              |

**Проблема:** Teams API не показує, який стиль UI використовує канал. Якщо використати неправильний `replyStyle`:

- `thread` у каналі стилю Threads → відповіді виглядають незручно вкладеними
- `top-level` у каналі стилю Posts → відповіді відображаються як окремі дописи верхнього рівня, а не всередині треду

**Рішення:** Налаштуйте `replyStyle` для кожного каналу залежно від того, як налаштовано канал:

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

- **DM:** Зображення й файлові вкладення працюють через файлові API бота Teams.
- **Канали/групи:** Вкладення зберігаються в сховищі M365 (SharePoint/OneDrive). Webhook payload містить лише HTML-заглушку, а не фактичні байти файлу. **Для завантаження вкладень каналів потрібні дозволи Graph API**.
- Для явних надсилань, де файл є основним вмістом, використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов’язковий `message` стає супровідним текстом/коментарем, а `filename` перевизначає назву завантаженого файлу.

Без дозволів Graph повідомлення каналів із зображеннями надходитимуть лише як текст (вміст зображення недоступний боту).
Типово OpenClaw завантажує медіа лише з імен хостів Microsoft/Teams. Перевизначте це за допомогою `channels.msteams.mediaAllowHosts` (використовуйте `["*"]`, щоб дозволити будь-який хост).
Заголовки Authorization додаються лише для хостів у `channels.msteams.mediaAuthAllowHosts` (типово хости Graph + Bot Framework). Тримайте цей список суворим (уникайте багатотенантних суфіксів).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в DM за допомогою потоку FileConsentCard (вбудовано). Однак **надсилання файлів у групових чатах/каналах** потребує додаткового налаштування:

| Контекст                  | Як надсилаються файли                           | Потрібне налаштування                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DM**                  | FileConsentCard → користувач приймає → бот завантажує | Працює одразу                            |
| **Групові чати/канали** | Завантаження в SharePoint → поширення посилання            | Потрібні `sharePointSiteId` + дозволи Graph |
| **Зображення (будь-який контекст)** | Вбудовано з кодуванням Base64                        | Працює одразу                            |

### Чому груповим чатам потрібен SharePoint

Боти не мають особистого диска OneDrive (endpoint Graph API `/me/drive` не працює для ідентичностей застосунків). Щоб надсилати файли в групові чати/канали, бот завантажує їх на **сайт SharePoint** і створює посилання для поширення.

### Налаштування

1. **Додайте дозволи Graph API** в Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - завантаження файлів у SharePoint
   - `Chat.Read.All` (Application) - необов’язково, вмикає посилання для поширення для окремих користувачів

2. **Надайте згоду адміністратора** для tenant.

3. **Отримайте свій SharePoint site ID:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
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

### Поведінка поширення

| Дозвіл                              | Поведінка поширення                                          |
| --------------------------------------- | --------------------------------------------------------- |
| лише `Sites.ReadWrite.All`              | Посилання для поширення на всю організацію (доступ має будь-хто в організації) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Посилання для поширення для окремих користувачів (доступ мають лише учасники чату)      |

Поширення для окремих користувачів безпечніше, оскільки доступ до файлу мають лише учасники чату. Якщо дозволу `Chat.Read.All` бракує, бот повертається до поширення на всю організацію.

### Резервна поведінка

| Сценарій                                          | Результат                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Груповий чат + файл + налаштовано `sharePointSiteId` | Завантаження в SharePoint, надсилання посилання для поширення            |
| Груповий чат + файл + немає `sharePointSiteId`         | Спроба завантаження в OneDrive (може завершитися помилкою), надсилання лише тексту |
| Особистий чат + файл                              | Потік FileConsentCard (працює без SharePoint)    |
| Будь-який контекст + зображення                               | Вбудовано з кодуванням Base64 (працює без SharePoint)   |

### Розташування збережених файлів

Завантажені файли зберігаються в папці `/OpenClawShared/` у стандартній бібліотеці документів налаштованого сайту SharePoint.

## Опитування (Adaptive Cards)

OpenClaw надсилає опитування Teams як Adaptive Cards (нативного API опитувань Teams немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоси записуються Gateway у `~/.openclaw/msteams-polls.json`.
- Gateway має залишатися онлайн, щоб записувати голоси.
- Опитування поки що не публікують автоматично підсумки результатів (за потреби перегляньте файл сховища).

## Presentation-картки

Надсилайте семантичні presentation payloads користувачам або conversations Teams за допомогою інструмента `message` або CLI. OpenClaw рендерить їх як Teams Adaptive Cards із загального presentation-контракту.

Параметр `presentation` приймає семантичні блоки. Коли надано `presentation`, текст повідомлення необов’язковий.

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

Targets MSTeams використовують префікси, щоб розрізняти користувачів і conversations:

| Тип target         | Формат                           | Приклад                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Користувач (за ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Користувач (за іменем)      | `user:<display-name>`            | `user:John Smith` (потрібен Graph API)              |
| Група/канал       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Група/канал (raw) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (якщо містить `@thread`) |

**Приклади CLI:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Приклади інструментів агента:**

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

<Note>
Без префікса `user:` імена за замовчуванням обробляються як групи або команди. Завжди використовуйте `user:`, коли вказуєте людей за відображуваним іменем.
</Note>

## Проактивні повідомлення

- Проактивні повідомлення можливі лише **після** взаємодії користувача, оскільки в цей момент ми зберігаємо посилання на розмову.
- Див. `/gateway/configuration` для `dmPolicy` і керування allowlist.

## ID команди та каналу (поширена помилка)

Параметр запиту `groupId` в URL Teams **НЕ** є ID команди, що використовується для конфігурації. Натомість витягуйте ID зі шляху URL:

**URL команди:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID розмови команди (URL-декодуйте це)
```

**URL каналу:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID каналу (URL-декодуйте це)
```

**Для конфігурації:**

- Ключ команди = сегмент шляху після `/team/` (URL-декодований, напр., `19:Bk4j...@thread.tacv2`; старіші тенанти можуть показувати `@thread.skype`, що також є чинним)
- Ключ каналу = сегмент шляху після `/channel/` (URL-декодований)
- **Ігноруйте** параметр запиту `groupId` для маршрутизації OpenClaw. Це ID групи Microsoft Entra, а не ID розмови Bot Framework, що використовується у вхідних активностях Teams.

## Приватні канали

Боти мають обмежену підтримку в приватних каналах:

| Функція                       | Стандартні канали | Приватні канали              |
| ----------------------------- | ----------------- | ---------------------------- |
| Встановлення бота             | Так               | Обмежено                     |
| Повідомлення в реальному часі (Webhook) | Так       | Може не працювати            |
| Дозволи RSC                   | Так               | Можуть поводитися інакше     |
| @mentions                     | Так               | Якщо бот доступний           |
| Історія Graph API             | Так               | Так (з дозволами)            |

**Обхідні варіанти, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом
2. Використовуйте приватні повідомлення - користувачі завжди можуть написати боту напряму
3. Використовуйте Graph API для доступу до історії (потрібен `ChannelMessage.Read.All`)

## Усунення неполадок

### Поширені проблеми

- **Зображення не відображаються в каналах:** відсутні дозволи Graph або згода адміністратора. Перевстановіть застосунок Teams і повністю закрийте та знову відкрийте Teams.
- **Немає відповідей у каналі:** згадки потрібні за замовчуванням; задайте `channels.msteams.requireMention=false` або налаштуйте для конкретної команди/каналу.
- **Невідповідність версії (Teams досі показує старий маніфест):** видаліть і повторно додайте застосунок, а також повністю закрийте Teams для оновлення.
- **401 Unauthorized від Webhook:** очікувано під час ручного тестування без Azure JWT - це означає, що endpoint доступний, але автентифікація не пройшла. Використовуйте Azure Web Chat для коректного тестування.

### Помилки завантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли іконок розміром 0 байтів. Створіть коректні PNG-іконки (32x32 для `outline.png`, 192x192 для `color.png`).
- **"webApplicationInfo.Id already in use":** застосунок досі встановлений в іншій команді/чаті. Спершу знайдіть і видаліть його або зачекайте 5-10 хвилин на поширення змін.
- **"Something went wrong" під час завантаження:** натомість завантажте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools браузера (F12) → вкладку Network і перевірте тіло відповіді на фактичну помилку.
- **Sideload не вдається:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app" - це часто обходить обмеження sideload.

### Дозволи RSC не працюють

1. Переконайтеся, що `webApplicationInfo.id` точно збігається з App ID вашого бота
2. Повторно завантажте застосунок і перевстановіть його в команді/чаті
3. Перевірте, чи адміністратор вашої організації не заблокував дозволи RSC
4. Підтвердьте, що використовуєте правильний scope: `ChannelMessage.Read.Group` для команд, `ChatMessage.Read.Chat` для групових чатів

## Посилання

- [Створення Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - посібник із налаштування Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - створення й керування застосунками Teams
- [Схема маніфесту застосунку Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Отримання повідомлень каналу з RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Довідник дозволів RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Обробка файлів ботом Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для каналу/групи потрібен Graph)
- [Проактивні повідомлення](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI для керування ботами

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація в приватних повідомленнях і потік сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та керування згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та посилення захисту
