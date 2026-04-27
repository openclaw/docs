---
read_when:
    - Працюємо над функціями каналу Microsoft Teams
summary: Статус підтримки бота Microsoft Teams, можливості та конфігурація
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-27T07:07:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e11562a30a71ae92b677ac3cf1c6b96b925d4064bfce5fd325da13489c98f99
    source_path: channels/msteams.md
    workflow: 15
---

Статус: підтримуються текст + вкладення в DM; надсилання файлів у канали/групи вимагає `sharePointSiteId` + дозволи Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Опитування надсилаються через Adaptive Cards. Дії з повідомленнями надають явний `upload-file` для надсилань, де файл є основним.

## Вбудований Plugin

Microsoft Teams постачається як вбудований Plugin у поточних випусках OpenClaw, тож вичайній пакетній збірці окреме встановлення не потрібне.

Якщо ви використовуєте старішу збірку або власне встановлення без вбудованого Teams,
встановіть його вручну:

```bash
openclaw plugins install @openclaw/msteams
```

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) виконує реєстрацію бота, створення маніфесту та генерацію облікових даних однією командою.

**1. Встановіть і виконайте вхід**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # переконайтеся, що ви ввійшли в систему та бачите інформацію про свій tenant
```

<Note>
Teams CLI наразі перебуває в preview. Команди та прапорці можуть змінюватися між випусками.
</Note>

**2. Запустіть тунель** (Teams не може звертатися до localhost)

Встановіть і автентифікуйте devtunnel CLI, якщо ще цього не зробили ([посібник із початку роботи](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Одноразове налаштування (постійний URL між сесіями):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Кожна сесія розробки:
devtunnel host my-openclaw-bot
# Ваша кінцева точка: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` є обов’язковим, оскільки Teams не може автентифікуватися через devtunnels. Кожен вхідний запит бота все одно автоматично перевіряється Teams SDK.
</Note>

Альтернативи: `ngrok http 3978` або `tailscale funnel 3978` (але вони можуть змінювати URL у кожній сесії).

**3. Створіть застосунок**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Ця одна команда:

- Створює застосунок Entra ID (Azure AD)
- Генерує секрет клієнта
- Збирає та завантажує маніфест Teams app (з іконками)
- Реєструє бота (за замовчуванням керується Teams — підписка Azure не потрібна)

У виводі буде показано `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` і **Teams App ID** — запишіть їх для наступних кроків. Також буде запропоновано встановити застосунок безпосередньо в Teams.

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

Або використовуйте змінні середовища безпосередньо: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Встановіть застосунок у Teams**

`teams app create` запропонує вам встановити застосунок — виберіть "Install in Teams". Якщо ви пропустили цей крок, можете отримати посилання пізніше:

```bash
teams app get <teamsAppId> --install-link
```

**6. Переконайтеся, що все працює**

```bash
teams app doctor <teamsAppId>
```

Ця команда запускає діагностику реєстрації бота, конфігурації AAD app, коректності маніфесту та налаштування SSO.

Для production-розгортань розгляньте використання [federated authentication](#federated-authentication-certificate--managed-identity) (сертифікат або managed identity) замість секретів клієнта.

<Note>
Групові чати за замовчуванням заблоковані (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` або використайте `groupPolicy: "open"`, щоб дозволити будь-якому учаснику (із обов’язковою згадкою).
</Note>

## Цілі

- Спілкуватися з OpenClaw через DM, групові чати або канали Teams.
- Зберігати детерміновану маршрутизацію: відповіді завжди повертаються в канал, звідки вони надійшли.
- За замовчуванням використовувати безпечну поведінку каналів (потрібні згадки, якщо не налаштовано інакше).

## Записи конфігурації

За замовчуванням Microsoft Teams дозволено записувати оновлення конфігурації, ініційовані через `/config set|unset` (потрібно `commands.config: true`).

Щоб вимкнути:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Керування доступом (DM + групи)

**Доступ до DM**

- За замовчуванням: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються, доки їх не буде схвалено.
- `channels.msteams.allowFrom` має використовувати стабільні ID об’єктів AAD.
- Не покладайтеся на зіставлення UPN/відображуваного імені для списків дозволу — вони можуть змінюватися. OpenClaw за замовчуванням вимикає пряме зіставлення імен; увімкніть його явно через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер може зіставляти імена з ID через Microsoft Graph, якщо облікові дані це дозволяють.

**Груповий доступ**

- За замовчуванням: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, доки ви не додасте `groupAllowFrom`). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити значення за замовчуванням, якщо його не встановлено.
- `channels.msteams.groupAllowFrom` визначає, які відправники можуть ініціювати взаємодію в групових чатах/каналах (із поверненням до `channels.msteams.allowFrom`).
- Установіть `groupPolicy: "open"`, щоб дозволити будь-якому учаснику (за замовчуванням згадка все одно обов’язкова).
- Щоб не дозволяти **жодних каналів**, установіть `channels.msteams.groupPolicy: "disabled"`.

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

**Список дозволу Teams + канали**

- Обмежуйте відповіді в групах/каналах, перелічуючи команди та канали в `channels.msteams.teams`.
- Ключі мають використовувати стабільні ID команд і ID розмов каналів.
- Якщо `groupPolicy="allowlist"` і присутній список дозволу команд, прийматимуться лише перелічені команди/канали (із обов’язковою згадкою).
- Майстер налаштування приймає записи `Team/Channel` і зберігає їх за вас.
- Під час запуску OpenClaw зіставляє назви команд/каналів і користувачів зі списку дозволу з ID (якщо це дозволяють дозволи Graph)
  і записує це зіставлення в журнал; назви команд/каналів, які не вдалося зіставити, зберігаються як введені, але за замовчуванням ігноруються для маршрутизації, якщо не ввімкнено `channels.msteams.dangerouslyAllowNameMatching: true`.

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

Якщо ви не можете використовувати Teams CLI, ви можете налаштувати бота вручну через Azure Portal.

### Як це працює

1. Переконайтеся, що Plugin Microsoft Teams доступний (він вбудований у поточні випуски).
2. Створіть **Azure Bot** (App ID + secret + tenant ID).
3. Зберіть **пакет Teams app**, який посилається на бота та містить наведені нижче дозволи RSC.
4. Завантажте/встановіть Teams app у команду (або в особисту область для DM).
5. Налаштуйте `msteams` у `~/.openclaw/openclaw.json` (або змінні середовища) і запустіть Gateway.
6. Gateway за замовчуванням прослуховує трафік webhook Bot Framework на `/api/messages`.

### Крок 1: Створіть Azure Bot

1. Перейдіть до [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Заповніть вкладку **Basics**:

   | Поле               | Значення                                                 |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Ім’я вашого бота, наприклад `openclaw-msteams` (має бути унікальним) |
   | **Subscription**   | Виберіть вашу підписку Azure                             |
   | **Resource group** | Створіть нову або використайте наявну                    |
   | **Pricing tier**   | **Free** для розробки/тестування                         |
   | **Type of App**    | **Single Tenant** (рекомендовано — див. примітку нижче)  |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Створення нових multi-tenant ботів було застаріло після 2025-07-31. Для нових ботів використовуйте **Single Tenant**.
</Warning>

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
   - Локальна розробка: використовуйте тунель (див. [Локальна розробка](#local-development-tunneling) нижче)

### Крок 4: Увімкніть канал Teams

1. У Azure Bot → **Channels**
2. Натисніть **Microsoft Teams** → Configure → Save
3. Прийміть Terms of Service

### Крок 5: Зберіть маніфест Teams app

- Додайте запис `bot` з `botId = <App ID>`.
- Області: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (потрібно для обробки файлів в особистій області).
- Додайте дозволи RSC (див. [Дозволи RSC](#current-teams-rsc-permissions-manifest)).
- Створіть іконки: `outline.png` (32x32) і `color.png` (192x192).
- Запакуйте всі три файли разом: `manifest.json`, `outline.png`, `color.png`.

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

## Federated authentication (сертифікат і managed identity)

> Додано в 2026.3.24

Для production-розгортань OpenClaw підтримує **federated authentication** як безпечнішу альтернативу секретам клієнта. Доступні два методи:

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

Використовуйте Azure Managed Identity для автентифікації без пароля. Це ідеально підходить для розгортань в інфраструктурі Azure (AKS, App Service, Azure VM), де доступна managed identity.

**Як це працює:**

1. Pod/VM бота має managed identity (system-assigned або user-assigned).
2. **Federated identity credential** пов’язує managed identity з реєстрацією застосунку Entra ID.
3. Під час виконання OpenClaw використовує `@azure/identity` для отримання токенів з кінцевої точки Azure IMDS (`169.254.169.254`).
4. Токен передається до Teams SDK для автентифікації бота.

**Передумови:**

- Інфраструктура Azure з увімкненою managed identity (AKS workload identity, App Service, VM)
- Federated identity credential, створений у реєстрації застосунку Entra ID
- Мережевий доступ до IMDS (`169.254.169.254:80`) із pod/VM

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

### Налаштування AKS Workload Identity

Для розгортань AKS із використанням workload identity:

1. **Увімкніть workload identity** у вашому кластері AKS.
2. **Створіть federated identity credential** у реєстрації застосунку Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Додайте анотацію до Kubernetes service account** із client ID застосунку:

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

5. **Забезпечте мережевий доступ** до IMDS (`169.254.169.254`) — якщо ви використовуєте NetworkPolicy, додайте правило egress, яке дозволяє трафік до `169.254.169.254/32` на порт 80.

### Порівняння типів автентифікації

| Метод                | Конфігурація                                   | Переваги                           | Недоліки                              |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Просте налаштування                | Потрібна ротація секретів, менш безпечно |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Немає спільного секрету в мережі   | Додаткові витрати на керування сертифікатами |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Без паролів, не потрібно керувати секретами | Потрібна інфраструктура Azure         |

**Поведінка за замовчуванням:** якщо `authType` не встановлено, OpenClaw за замовчуванням використовує автентифікацію через client secret. Наявні конфігурації й надалі працюватимуть без змін.

## Локальна розробка (тунелювання)

Teams не може звертатися до `localhost`. Використовуйте постійний dev tunnel, щоб URL залишався незмінним між сесіями:

```bash
# Одноразове налаштування:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Кожна сесія розробки:
devtunnel host my-openclaw-bot
```

Альтернативи: `ngrok http 3978` або `tailscale funnel 3978` (URL можуть змінюватися в кожній сесії).

Якщо URL вашого тунелю змінюється, оновіть endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Тестування бота

**Запустіть діагностику:**

```bash
teams app doctor <teamsAppId>
```

Перевіряє реєстрацію бота, AAD app, маніфест і конфігурацію SSO за один прохід.

**Надішліть тестове повідомлення:**

1. Установіть Teams app (використайте посилання встановлення з `teams app get <id> --install-link`)
2. Знайдіть бота в Teams і надішліть DM
3. Перевірте журнали Gateway на вхідну активність

## Змінні середовища

Натомість усі ключі конфігурації можна задавати через змінні середовища:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (необов’язково: `"secret"` або `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (необов’язково, не потрібен для автентифікації)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (лише для user-assigned MI)

## Дія з інформацією про учасника

OpenClaw надає дію `member-info` на основі Graph для Microsoft Teams, щоб агенти й автоматизації могли безпосередньо через Microsoft Graph визначати дані учасників каналу (ім’я для відображення, email, роль).

Вимоги:

- Дозвіл RSC `Member.Read.Group` (вже є в рекомендованому маніфесті)
- Для пошуку між командами: дозвіл Graph Application `User.Read.All` із consent адміністратора

Ця дія керується параметром `channels.msteams.actions.memberInfo` (за замовчуванням: увімкнено, коли доступні облікові дані Graph).

## Контекст історії

- `channels.msteams.historyLimit` керує тим, скільки останніх повідомлень каналу/групи включається в prompt.
- Використовує `messages.groupChat.historyLimit`, якщо не встановлено. Установіть `0`, щоб вимкнути (за замовчуванням 50).
- Отримана історія гілки фільтрується за списками дозволених відправників (`allowFrom` / `groupAllowFrom`), тож початкове заповнення контексту гілки включає лише повідомлення від дозволених відправників.
- Контекст цитованих вкладень (`ReplyTo*`, похідний від HTML-відповіді Teams) наразі передається як отримано.
- Інакше кажучи, списки дозволу визначають, хто може активувати агента; наразі фільтруються лише окремі шляхи додаткового контексту.
- Історію DM можна обмежити через `channels.msteams.dmHistoryLimit` (ходи користувача). Перевизначення для окремих користувачів: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи Teams RSC (маніфест)

Це **наявні resourceSpecific permissions** у маніфесті нашого Teams app. Вони застосовуються лише в межах команди/чату, де встановлено застосунок.

**Для каналів (область команди):**

- `ChannelMessage.Read.Group` (Application) - отримувати всі повідомлення каналу без @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Для групових чатів:**

- `ChatMessage.Read.Chat` (Application) - отримувати всі повідомлення групового чату без @mention

Щоб додати дозволи RSC через Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Приклад маніфесту Teams (із прихованими даними)

Мінімальний коректний приклад з обов’язковими полями. Замініть ID та URL.

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
- `bots[].supportsFiles: true` потрібен для обробки файлів в особистій області.
- `authorization.permissions.resourceSpecific` має включати читання/надсилання каналів, якщо ви хочете трафік каналів.

### Оновлення наявного застосунку

Щоб оновити вже встановлений Teams app (наприклад, щоб додати дозволи RSC):

```bash
# Завантажте, відредагуйте та повторно вивантажте маніфест
teams app manifest download <teamsAppId> manifest.json
# Відредагуйте manifest.json локально...
teams app manifest upload manifest.json <teamsAppId>
# Версію буде автоматично збільшено, якщо вміст змінився
```

Після оновлення перевстановіть застосунок у кожній команді, щоб нові дозволи набули чинності, і **повністю закрийте та знову запустіть Teams** (а не просто закрийте вікно), щоб очистити кешовані метадані застосунку.

<details>
<summary>Ручне оновлення маніфесту (без CLI)</summary>

1. Оновіть ваш `manifest.json` новими параметрами
2. **Збільшіть поле `version`** (наприклад, `1.0.0` → `1.1.0`)
3. **Повторно запакуйте** маніфест з іконками (`manifest.json`, `outline.png`, `color.png`)
4. Завантажте новий zip:
   - **Teams Admin Center:** Teams apps → Manage apps → знайдіть свій застосунок → Upload new version
   - **Sideload:** у Teams → Apps → Manage your apps → Upload a custom app

</details>

## Можливості: лише RSC чи Graph

### Із **лише Teams RSC** (застосунок встановлено, без дозволів Graph API)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання файлових вкладень у **особистих повідомленнях (DM)**.

НЕ працює:

- **Зображення або вміст файлів** у каналі/групі (payload містить лише HTML-заглушку).
- Завантаження вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень (поза поточною подією webhook).

### Із **Teams RSC + дозволами Microsoft Graph Application**

Додається:

- Завантаження розміщеного вмісту (зображення, вставлені в повідомлення).
- Завантаження файлових вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень каналу/чату через Graph.

### RSC проти Graph API

| Можливість             | Дозволи RSC          | Graph API                           |
| ---------------------- | -------------------- | ----------------------------------- |
| **Повідомлення в реальному часі** | Так (через webhook)   | Ні (лише polling)                   |
| **Історичні повідомлення** | Ні                   | Так (можна запитувати історію)      |
| **Складність налаштування** | Лише маніфест застосунку | Потрібен consent адміністратора + потік токенів |
| **Працює офлайн**      | Ні (має бути запущено) | Так (можна запитувати будь-коли)    |

**Підсумок:** RSC призначено для прослуховування в реальному часі; Graph API — для історичного доступу. Щоб надолужувати пропущені повідомлення в автономному режимі, потрібен Graph API з `ChannelMessage.Read.All` (потрібен consent адміністратора).

## Media + history з Graph (обов’язково для каналів)

Якщо вам потрібні зображення/файли в **каналах** або ви хочете отримувати **історію повідомлень**, потрібно ввімкнути дозволи Microsoft Graph і надати consent адміністратора.

1. У **App Registration** Entra ID (Azure AD) додайте **Application permissions** Microsoft Graph:
   - `ChannelMessage.Read.All` (вкладення каналів + історія)
   - `Chat.Read.All` або `ChatMessage.Read.All` (групові чати)
2. **Надайте consent адміністратора** для tenant.
3. Збільште **версію маніфесту** Teams app, повторно завантажте його та **перевстановіть застосунок у Teams**.
4. **Повністю закрийте та знову запустіть Teams**, щоб очистити кешовані метадані застосунку.

**Додатковий дозвіл для згадок користувачів:** @mentions користувачів працюють одразу для користувачів у розмові. Однак якщо ви хочете динамічно шукати й згадувати користувачів, які **не перебувають у поточній розмові**, додайте дозвіл `User.Read.All` (Application) і надайте consent адміністратора.

## Відомі обмеження

### Тайм-аути Webhook

Teams доставляє повідомлення через HTTP webhook. Якщо обробка триває надто довго (наприклад, через повільні відповіді LLM), ви можете побачити:

- Тайм-аути Gateway
- Повторні спроби доставки повідомлення з боку Teams (що спричиняє дублікати)
- Втрачені відповіді

OpenClaw обробляє це, швидко повертаючи відповідь і надсилаючи відповіді проактивно, але дуже повільні відповіді все одно можуть спричиняти проблеми.

### Форматування

Markdown у Teams більш обмежений, ніж у Slack або Discord:

- Базове форматування працює: **жирний**, _курсив_, `code`, посилання
- Складний markdown (таблиці, вкладені списки) може відображатися некоректно
- Adaptive Cards підтримуються для опитувань і semantic presentation sends (див. нижче)

## Конфігурація

Ключові параметри (спільні шаблони каналів див. в `/gateway/configuration`):

- `channels.msteams.enabled`: увімкнути/вимкнути канал.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: облікові дані бота.
- `channels.msteams.webhook.port` (за замовчуванням `3978`)
- `channels.msteams.webhook.path` (за замовчуванням `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing)
- `channels.msteams.allowFrom`: список дозволу для DM (рекомендовано ID об’єктів AAD). Майстер зіставляє імена з ID під час налаштування, коли доступний доступ до Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: аварійний перемикач для повторного ввімкнення змінного зіставлення UPN/відображуваного імені та прямої маршрутизації за назвами команд/каналів.
- `channels.msteams.textChunkLimit`: розмір фрагмента вихідного тексту.
- `channels.msteams.chunkMode`: `length` (за замовчуванням) або `newline`, щоб розбивати за порожніми рядками (межі абзаців) перед розбиттям за довжиною.
- `channels.msteams.mediaAllowHosts`: список дозволених хостів для вхідних вкладень (за замовчуванням домени Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: список дозволених хостів для додавання заголовків Authorization під час повторних спроб завантаження media (за замовчуванням хости Graph + Bot Framework).
- `channels.msteams.requireMention`: вимагати @mention у каналах/групах (за замовчуванням true).
- `channels.msteams.replyStyle`: `thread | top-level` (див. [Стиль відповіді](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.requireMention`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.tools`: перевизначення політики інструментів за замовчуванням для окремої команди (`allow`/`deny`/`alsoAllow`), яке використовується, якщо перевизначення каналу відсутнє.
- `channels.msteams.teams.<teamId>.toolsBySender`: перевизначення політики інструментів для окремої команди й окремого відправника за замовчуванням (підтримується шаблон `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: перевизначення політики інструментів для окремого каналу (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: перевизначення політики інструментів для окремого каналу й окремого відправника (підтримується шаблон `"*"`).
- Ключі `toolsBySender` мають використовувати явні префікси:
  `id:`, `e164:`, `username:`, `name:` (застарілі ключі без префікса, як і раніше, зіставляються лише з `id:`).
- `channels.msteams.actions.memberInfo`: увімкнути або вимкнути дію member info на основі Graph (за замовчуванням: увімкнено, коли доступні облікові дані Graph).
- `channels.msteams.authType`: тип автентифікації — `"secret"` (за замовчуванням) або `"federated"`.
- `channels.msteams.certificatePath`: шлях до файла сертифіката PEM (federated + certificate auth).
- `channels.msteams.certificateThumbprint`: thumbprint сертифіката (необов’язково, не потрібно для автентифікації).
- `channels.msteams.useManagedIdentity`: увімкнути автентифікацію через managed identity (режим federated).
- `channels.msteams.managedIdentityClientId`: client ID для user-assigned managed identity.
- `channels.msteams.sharePointSiteId`: ID сайта SharePoint для вивантаження файлів у групових чатах/каналах (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)).

## Маршрутизація та сесії

- Ключі сесій відповідають стандартному формату агента (див. [/concepts/session](/uk/concepts/session)):
  - Прямі повідомлення використовують основну сесію (`agent:<agentId>:<mainKey>`).
  - Повідомлення каналу/групи використовують conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль відповіді: threads чи posts

Нещодавно Teams представив два стилі UI каналів поверх тієї самої базової моделі даних:

| Стиль                 | Опис                                                      | Рекомендований `replyStyle` |
| --------------------- | --------------------------------------------------------- | --------------------------- |
| **Posts** (класичний) | Повідомлення відображаються як картки з відповідями в треді під ними | `thread` (за замовчуванням) |
| **Threads** (у стилі Slack) | Повідомлення йдуть лінійно, більше схоже на Slack     | `top-level`                 |

**Проблема:** API Teams не показує, який стиль UI використовує канал. Якщо використати неправильний `replyStyle`:

- `thread` у каналі зі стилем Threads → відповіді відображаються незручно вкладеними
- `top-level` у каналі зі стилем Posts → відповіді відображаються як окремі повідомлення верхнього рівня, а не в треді

**Рішення:** налаштовуйте `replyStyle` для кожного каналу залежно від того, як налаштовано канал:

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
- **Канали/групи:** вкладення зберігаються в сховищі M365 (SharePoint/OneDrive). Payload webhook містить лише HTML-заглушку, а не фактичні байти файла. Для завантаження вкладень каналів **потрібні дозволи Graph API**.
- Для явних надсилань, де файл є основним, використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов’язковий `message` стане супровідним текстом/коментарем, а `filename` перевизначить завантажене ім’я.

Без дозволів Graph повідомлення каналу із зображеннями отримуватимуться лише як текст (вміст зображення буде недоступний боту).
За замовчуванням OpenClaw завантажує media лише з імен хостів Microsoft/Teams. Перевизначте через `channels.msteams.mediaAllowHosts` (використайте `["*"]`, щоб дозволити будь-який хост).
Заголовки Authorization додаються лише для хостів у `channels.msteams.mediaAuthAllowHosts` (за замовчуванням хости Graph + Bot Framework). Зберігайте цей список суворим (уникайте суфіксів для кількох tenant).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в DM через потік FileConsentCard (вбудовано). Однак **надсилання файлів у групових чатах/каналах** вимагає додаткового налаштування:

| Контекст                 | Як надсилаються файли                     | Потрібне налаштування                          |
| ------------------------ | ----------------------------------------- | ---------------------------------------------- |
| **DM**                   | FileConsentCard → користувач підтверджує → бот вивантажує | Працює одразу                                  |
| **Групові чати/канали**  | Вивантаження у SharePoint → посилання для спільного доступу | Потрібні `sharePointSiteId` + дозволи Graph |
| **Зображення (будь-який контекст)** | Inline у форматі Base64              | Працює одразу                                  |

### Чому груповим чатам потрібен SharePoint

Боти не мають особистого диска OneDrive (кінцева точка Graph API `/me/drive` не працює для application identities). Щоб надсилати файли в групових чатах/каналах, бот вивантажує їх на **сайт SharePoint** і створює посилання для спільного доступу.

### Налаштування

1. **Додайте дозволи Graph API** в Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - вивантаження файлів у SharePoint
   - `Chat.Read.All` (Application) - необов’язково, увімкне посилання для спільного доступу на рівні користувачів

2. **Надайте consent адміністратора** для tenant.

3. **Отримайте ID вашого сайта SharePoint:**

   ```bash
   # Через Graph Explorer або curl з дійсним токеном:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Приклад: для сайта за адресою "contoso.sharepoint.com/sites/BotFiles"
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

| Дозвіл                                  | Поведінка спільного доступу                              |
| --------------------------------------- | -------------------------------------------------------- |
| `Sites.ReadWrite.All` only              | Посилання для спільного доступу на рівні всієї організації (доступ має будь-хто в org) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Посилання для спільного доступу на рівні користувачів (доступ мають лише учасники чату) |

Спільний доступ на рівні користувачів безпечніший, оскільки файл доступний лише учасникам чату. Якщо дозвіл `Chat.Read.All` відсутній, бот повертається до спільного доступу на рівні всієї організації.

### Поведінка резервного варіанта

| Сценарій                                         | Результат                                           |
| ------------------------------------------------ | --------------------------------------------------- |
| Груповий чат + файл + налаштовано `sharePointSiteId` | Вивантаження у SharePoint, надсилання посилання для спільного доступу |
| Груповий чат + файл + немає `sharePointSiteId`   | Спроба вивантаження в OneDrive (може не вдатися), надсилання лише тексту |
| Особистий чат + файл                             | Потік FileConsentCard (працює без SharePoint)       |
| Будь-який контекст + зображення                  | Inline у форматі Base64 (працює без SharePoint)     |

### Місце зберігання файлів

Вивантажені файли зберігаються в папці `/OpenClawShared/` у стандартній бібліотеці документів налаштованого сайта SharePoint.

## Опитування (Adaptive Cards)

OpenClaw надсилає опитування Teams як Adaptive Cards (вбудованого API опитувань у Teams немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоси записуються Gateway у `~/.openclaw/msteams-polls.json`.
- Щоб записувати голоси, Gateway має залишатися онлайн.
- Опитування поки не публікують підсумки результатів автоматично (за потреби перегляньте файл сховища).

## Картки presentation

Надсилайте semantic presentation payloads користувачам або в розмови Teams за допомогою інструмента `message` або CLI. OpenClaw відтворює їх як Teams Adaptive Cards із загального контракту presentation.

Параметр `presentation` приймає semantic blocks. Якщо надано `presentation`, текст повідомлення не є обов’язковим.

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

Targets MSTeams використовують префікси, щоб розрізняти користувачів і розмови:

| Тип target           | Формат                           | Приклад                                             |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| Користувач (за ID)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Користувач (за іменем) | `user:<display-name>`          | `user:John Smith` (потрібен Graph API)              |
| Група/канал          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Група/канал (сирий)  | `<conversation-id>`              | `19:abc123...@thread.tacv2` (якщо містить `@thread`) |

**Приклади CLI:**

```bash
# Надіслати користувачу за ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Надіслати користувачу за відображуваним іменем (запускає пошук через Graph API)
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

<Note>
Без префікса `user:` імена за замовчуванням інтерпретуються як група або команда. Завжди використовуйте `user:` при зверненні до людей за відображуваним іменем.
</Note>

## Проактивні повідомлення

- Проактивні повідомлення можливі **лише після** взаємодії користувача, оскільки саме тоді ми зберігаємо посилання на розмову.
- Параметри `dmPolicy` і керування через список дозволу див. у `/gateway/configuration`.

## ID команди та каналу (поширена помилка)

Параметр запиту `groupId` в URL Teams **НЕ** є ID команди, який використовується в конфігурації. Натомість витягуйте ID зі шляху URL:

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

- ID команди = сегмент шляху після `/team/` (після декодування URL, наприклад `19:Bk4j...@thread.tacv2`)
- ID каналу = сегмент шляху після `/channel/` (після декодування URL)
- Параметр запиту `groupId` **ігноруйте**

## Приватні канали

Боти мають обмежену підтримку в приватних каналах:

| Функція                      | Стандартні канали | Приватні канали       |
| ---------------------------- | ----------------- | --------------------- |
| Встановлення бота            | Так               | Обмежено              |
| Повідомлення в реальному часі (webhook) | Так      | Може не працювати     |
| Дозволи RSC                  | Так               | Можуть поводитися інакше |
| @mentions                    | Так               | Якщо бот доступний    |
| Історія через Graph API      | Так               | Так (за наявності дозволів) |

**Обхідні шляхи, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом
2. Використовуйте DM — користувачі завжди можуть писати боту напряму
3. Використовуйте Graph API для історичного доступу (потрібен `ChannelMessage.Read.All`)

## Усунення несправностей

### Поширені проблеми

- **Зображення не відображаються в каналах:** відсутні дозволи Graph або consent адміністратора. Перевстановіть Teams app і повністю закрийте/заново відкрийте Teams.
- **Немає відповідей у каналі:** за замовчуванням потрібні згадки; установіть `channels.msteams.requireMention=false` або налаштуйте окремо для команди/каналу.
- **Невідповідність версії (Teams усе ще показує старий маніфест):** видаліть і повторно додайте застосунок та повністю закрийте Teams, щоб оновити стан.
- **401 Unauthorized від webhook:** очікувана поведінка при ручному тестуванні без Azure JWT — означає, що endpoint доступний, але автентифікація не пройшла. Для коректного тестування використовуйте Azure Web Chat.

### Помилки завантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли іконок розміром 0 байт. Створіть коректні PNG-іконки (32x32 для `outline.png`, 192x192 для `color.png`).
- **"webApplicationInfo.Id already in use":** застосунок усе ще встановлено в іншій команді/чаті. Спочатку знайдіть і видаліть його або зачекайте 5-10 хвилин на поширення змін.
- **"Something went wrong" під час завантаження:** натомість завантажте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools браузера (F12) → вкладка Network і перевірте тіло відповіді, щоб побачити фактичну помилку.
- **Не вдається sideload:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app" — це часто обходить обмеження sideload.

### Дозволи RSC не працюють

1. Переконайтеся, що `webApplicationInfo.id` точно збігається з App ID вашого бота
2. Повторно завантажте застосунок і перевстановіть його в команді/чаті
3. Перевірте, чи адміністратор вашої org не заблокував дозволи RSC
4. Підтвердьте, що ви використовуєте правильну область: `ChannelMessage.Read.Group` для команд, `ChatMessage.Read.Chat` для групових чатів

## Посилання

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - посібник із налаштування Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - створення та керування Teams apps
- [Схема маніфесту Teams app](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Отримання повідомлень каналу за допомогою RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Довідник дозволів RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Обробка файлів ботом Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для каналу/групи потрібен Graph)
- [Проактивні повідомлення](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI для керування ботом

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Pairing](/uk/channels/pairing) — автентифікація DM і потік pairing
- [Groups](/uk/channels/groups) — поведінка групового чату та обов’язкові згадки
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сесій для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та hardening
