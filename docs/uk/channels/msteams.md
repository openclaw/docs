---
read_when:
    - Робота над функціями каналу Microsoft Teams
summary: Статус підтримки, можливості та конфігурація бота Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-29T07:51:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 535bd7f9713f221572a99ae3a7a39d7acdd5a1e41c2d79a43d4caf9c2ce2b159
    source_path: channels/msteams.md
    workflow: 16
---

Статус: підтримуються текст + вкладення в DM; надсилання файлів у канали/групи потребує `sharePointSiteId` + дозволів Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Опитування надсилаються через Adaptive Cards. Дії повідомлень надають явний `upload-file` для надсилання, де файл є основним.

## Вбудований Plugin

Microsoft Teams постачається як вбудований Plugin у поточних випусках OpenClaw, тому
окреме встановлення у звичайній пакетній збірці не потрібне.

Якщо ви використовуєте старішу збірку або власне встановлення, що виключає вбудований Teams,
встановіть поточний npm-пакет, коли його буде опубліковано:

```bash
openclaw plugins install @openclaw/msteams
```

Якщо npm повідомляє, що пакет, яким володіє OpenClaw, застарілий, використовуйте поточну пакетну
збірку OpenClaw або локальний шлях checkout, доки не буде
опубліковано новіший npm-пакет.

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) обробляє реєстрацію бота, створення маніфесту та генерування облікових даних однією командою.

**1. Встановіть і ввійдіть**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI зараз перебуває в preview. Команди та прапорці можуть змінюватися між випусками.
</Note>

**2. Запустіть тунель** (Teams не може дістатися до localhost)

Встановіть і автентифікуйте devtunnel CLI, якщо ще цього не зробили ([посібник із початку роботи](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` потрібен, бо Teams не може автентифікуватися з devtunnels. Кожен вхідний запит бота все одно автоматично перевіряється Teams SDK.
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
- Генерує клієнтський секрет
- Збирає та завантажує маніфест застосунку Teams (з іконками)
- Реєструє бота (типово керований Teams — передплата Azure не потрібна)

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

`teams app create` запропонує встановити застосунок — виберіть "Встановити в Teams". Якщо ви пропустили це, посилання можна отримати пізніше:

```bash
teams app get <teamsAppId> --install-link
```

**6. Перевірте, що все працює**

```bash
teams app doctor <teamsAppId>
```

Це запускає діагностику реєстрації бота, конфігурації застосунку AAD, чинності маніфесту та налаштування SSO.

Для production-розгортань розгляньте використання [федеративної автентифікації](/uk/channels/msteams#federated-authentication-certificate-plus-managed-identity) (сертифікат або керована ідентичність) замість клієнтських секретів.

<Note>
Групові чати типово заблоковані (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` або використайте `groupPolicy: "open"`, щоб дозволити будь-якому учаснику (з вимогою згадки).
</Note>

## Цілі

- Спілкуватися з OpenClaw через DM, групові чати або канали Teams.
- Зберігати детерміновану маршрутизацію: відповіді завжди повертаються до каналу, з якого вони надійшли.
- Типово використовувати безпечну поведінку каналів (згадки обов’язкові, якщо не налаштовано інакше).

## Записи конфігурації

Типово Microsoft Teams дозволено записувати оновлення конфігурації, спричинені `/config set|unset` (потребує `commands.config: true`).

Вимкніть за допомогою:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Контроль доступу (DM + групи)

**Доступ до DM**

- Типово: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються, доки їх не схвалять.
- `channels.msteams.allowFrom` має використовувати стабільні object ID AAD.
- Не покладайтеся на зіставлення UPN/відображуваного імені для allowlist — вони можуть змінюватися. OpenClaw типово вимикає пряме зіставлення імен; увімкніть його явно через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер може зіставляти імена з ID через Microsoft Graph, коли облікові дані це дозволяють.

**Доступ до груп**

- Типово: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, якщо ви не додасте `groupAllowFrom`). Використайте `channels.defaults.groupPolicy`, щоб перевизначити типове значення, коли воно не задане.
- `channels.msteams.groupAllowFrom` контролює, які відправники можуть запускати обробку в групових чатах/каналах (із fallback до `channels.msteams.allowFrom`).
- Задайте `groupPolicy: "open"`, щоб дозволити будь-якому учаснику (типово все одно з вимогою згадки).
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

- Обмежуйте відповіді в групах/каналах, перелічуючи команди та канали в `channels.msteams.teams`.
- Ключі мають використовувати стабільні ID команд і conversation ID каналів.
- Коли `groupPolicy="allowlist"` і наявний allowlist Teams, приймаються лише перелічені команди/канали (з вимогою згадки).
- Майстер налаштування приймає записи `Team/Channel` і зберігає їх для вас.
- Під час запуску OpenClaw зіставляє імена команд/каналів та імена allowlist користувачів з ID (коли дозволи Graph це дозволяють)
  і записує зіставлення в журнал; нерозв’язані імена команд/каналів зберігаються як введені, але типово ігноруються для маршрутизації, якщо не ввімкнено `channels.msteams.dangerouslyAllowNameMatching: true`.

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

1. Переконайтеся, що Microsoft Teams Plugin доступний (вбудований у поточні випуски).
2. Створіть **Azure Bot** (App ID + secret + tenant ID).
3. Зберіть **пакет застосунку Teams**, який посилається на бота й містить дозволи RSC нижче.
4. Завантажте/встановіть застосунок Teams у команду (або personal scope для DM).
5. Налаштуйте `msteams` у `~/.openclaw/openclaw.json` (або змінних середовища) і запустіть Gateway.
6. Gateway типово слухає трафік Webhook Bot Framework на `/api/messages`.

### Крок 1: Створіть Azure Bot

1. Перейдіть до [Створити Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Заповніть вкладку **Основи**:

   | Поле               | Значення                                                 |
   | ------------------ | -------------------------------------------------------- |
   | **Дескриптор бота** | Ім’я вашого бота, напр., `openclaw-msteams` (має бути унікальним) |
   | **Передплата**     | Виберіть вашу передплату Azure                           |
   | **Група ресурсів** | Створіть нову або використайте наявну                    |
   | **Ціновий рівень** | **Free** для розробки/тестування                         |
   | **Тип застосунку** | **Single Tenant** (рекомендовано - див. примітку нижче)  |
   | **Тип створення**  | **Create new Microsoft App ID**                          |

<Warning>
Створення нових мультитенантних ботів застаріло після 2025-07-31. Використовуйте **Single Tenant** для нових ботів.
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
   - Локальна розробка: використайте тунель (див. [Локальна розробка](#local-development-tunneling) нижче)

### Крок 4: Увімкніть канал Teams

1. В Azure Bot → **Channels**
2. Натисніть **Microsoft Teams** → Configure → Save
3. Прийміть Terms of Service

### Крок 5: Зберіть маніфест застосунку Teams

- Додайте запис `bot` з `botId = <App ID>`.
- Scopes: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (потрібно для обробки файлів у personal scope).
- Додайте дозволи RSC (див. [Дозволи RSC](#current-teams-rsc-permissions-manifest)).
- Створіть іконки: `outline.png` (32x32) і `color.png` (192x192).
- Заархівуйте всі три файли разом: `manifest.json`, `outline.png`, `color.png`.

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

## Федеративна автентифікація (сертифікат плюс керована ідентичність)

> Додано у 2026.4.11

Для production-розгортань OpenClaw підтримує **федеративну автентифікацію** як безпечнішу альтернативу клієнтським секретам. Доступні два методи:

### Варіант A: Автентифікація на основі сертифіката

Використайте PEM-сертифікат, зареєстрований у вашій реєстрації застосунку Entra ID.

**Налаштування:**

1. Згенеруйте або отримайте сертифікат (PEM-формат із приватним ключем).
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

**Змінні середовища:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Варіант B: Azure Managed Identity

Використовуйте Azure Managed Identity для автентифікації без пароля. Це ідеально для розгортань в інфраструктурі Azure (AKS, App Service, Azure VMs), де доступна керована ідентичність.

**Як це працює:**

1. Pod/VM бота має керовану ідентичність (system-assigned або user-assigned).
2. **Федеративні облікові дані ідентичності** зв’язують керовану ідентичність із реєстрацією застосунку Entra ID.
3. Під час виконання OpenClaw використовує `@azure/identity`, щоб отримувати токени з endpoint Azure IMDS (`169.254.169.254`).
4. Токен передається до Teams SDK для автентифікації бота.

**Передумови:**

- Інфраструктура Azure з увімкненою керованою ідентичністю (AKS workload identity, App Service, VM)
- Федеративні облікові дані ідентичності, створені в реєстрації застосунку Entra ID
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

**Конфігурація (керована ідентичність, призначена користувачем):**

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

### Налаштування AKS Workload Identity

Для розгортань AKS, що використовують ідентичність робочого навантаження:

1. **Увімкніть ідентичність робочого навантаження** у вашому кластері AKS.
2. **Створіть облікові дані федеративної ідентичності** для реєстрації застосунку Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Додайте анотацію до сервісного облікового запису Kubernetes** з клієнтським ID застосунку:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Додайте мітку до pod** для ін’єкції ідентичності робочого навантаження:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Забезпечте мережевий доступ** до IMDS (`169.254.169.254`) — якщо використовуєте NetworkPolicy, додайте правило вихідного трафіку, що дозволяє трафік до `169.254.169.254/32` на порту 80.

### Порівняння типів автентифікації

| Метод                  | Конфігурація                                  | Переваги                              | Недоліки                                        |
| ---------------------- | --------------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| **Клієнтський секрет** | `appPassword`                                 | Просте налаштування                   | Потрібна ротація секрету, менш безпечно          |
| **Сертифікат**         | `authType: "federated"` + `certificatePath`   | Немає спільного секрету через мережу  | Додаткове керування сертифікатами                |
| **Керована ідентичність** | `authType: "federated"` + `useManagedIdentity` | Без паролів, не потрібно керувати секретами | Потрібна інфраструктура Azure                    |

**Поведінка за замовчуванням:** Якщо `authType` не задано, OpenClaw за замовчуванням використовує автентифікацію через клієнтський секрет. Наявні конфігурації продовжують працювати без змін.

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

Якщо URL-адреса вашого тунелю змінилася, оновіть endpoint:

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
2. Знайдіть бота в Teams і надішліть приватне повідомлення
3. Перевірте журнали Gateway на наявність вхідної активності

## Змінні середовища

Усі ключі конфігурації можна натомість задати через змінні середовища:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (необов’язково: `"secret"` або `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (федеративна + сертифікат)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (необов’язково, не потрібне для автентифікації)
- `MSTEAMS_USE_MANAGED_IDENTITY` (федеративна + керована ідентичність)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (лише MI, призначена користувачем)

## Дія з інформацією про учасника

OpenClaw надає дію `member-info` на основі Graph для Microsoft Teams, щоб агенти й автоматизації могли отримувати відомості про учасників каналу (відображуване ім’я, електронну пошту, роль) безпосередньо з Microsoft Graph.

Вимоги:

- Дозвіл RSC `Member.Read.Group` (уже є в рекомендованому маніфесті)
- Для пошуків між командами: дозвіл Graph Application `User.Read.All` зі згодою адміністратора

Дію обмежує `channels.msteams.actions.memberInfo` (за замовчуванням: увімкнено, коли доступні облікові дані Graph).

## Контекст історії

- `channels.msteams.historyLimit` керує тим, скільки останніх повідомлень каналу/групи загортаються в prompt.
- Якщо не задано, використовується `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути (за замовчуванням 50).
- Отримана історія thread фільтрується за списками дозволених відправників (`allowFrom` / `groupAllowFrom`), тому ініціалізація контексту thread включає лише повідомлення від дозволених відправників.
- Контекст цитованих вкладень (`ReplyTo*`, отриманий із HTML-відповіді Teams) наразі передається як отримано.
- Іншими словами, списки дозволених відправників визначають, хто може запускати агента; сьогодні фільтруються лише окремі додаткові шляхи контексту.
- Історію приватних повідомлень можна обмежити за допомогою `channels.msteams.dmHistoryLimit` (ходи користувача). Перевизначення для окремих користувачів: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи Teams RSC (маніфест)

Це **наявні resourceSpecific дозволи** у нашому маніфесті застосунку Teams. Вони застосовуються лише всередині команди/чату, де встановлено застосунок.

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

## Приклад маніфесту Teams (відредаговано)

Мінімальний дійсний приклад із потрібними полями. Замініть ID та URL-адреси.

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
- `bots[].supportsFiles: true` потрібне для обробки файлів в особистій області.
- `authorization.permissions.resourceSpecific` має включати читання/надсилання каналів, якщо вам потрібен трафік каналів.

### Оновлення наявного застосунку

Щоб оновити вже встановлений застосунок Teams (наприклад, додати дозволи RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Після оновлення перевстановіть застосунок у кожній команді, щоб нові дозволи набули чинності, і **повністю закрийте та перезапустіть Teams** (не просто закрийте вікно), щоб очистити кешовані метадані застосунку.

<details>
<summary>Оновлення маніфесту вручну (без CLI)</summary>

1. Оновіть ваш `manifest.json` новими налаштуваннями
2. **Збільште поле `version`** (наприклад, `1.0.0` → `1.1.0`)
3. **Повторно запакуйте в zip** маніфест з іконками (`manifest.json`, `outline.png`, `color.png`)
4. Завантажте новий zip:
   - **Teams Admin Center:** застосунки Teams → Керування застосунками → знайдіть ваш застосунок → Завантажити нову версію
   - **Sideload:** у Teams → Застосунки → Керування вашими застосунками → Завантажити власний застосунок

</details>

## Можливості: лише RSC проти Graph

### З **лише Teams RSC** (застосунок установлено, дозволів Graph API немає)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання файлових вкладень у **особистих (DM)** повідомленнях.

Не працює:

- **Вміст зображень або файлів** у каналах/групах (payload містить лише HTML-заглушку).
- Завантаження вкладень, збережених у SharePoint/OneDrive.
- Читання історії повідомлень (поза live-подією Webhook).

### З **Teams RSC + дозволами Microsoft Graph Application**

Додає:

- Завантаження hosted contents (зображень, вставлених у повідомлення).
- Завантаження файлових вкладень, збережених у SharePoint/OneDrive.
- Читання історії повідомлень каналів/чатів через Graph.

### RSC проти Graph API

| Можливість              | Дозволи RSC          | Graph API                              |
| ----------------------- | -------------------- | -------------------------------------- |
| **Повідомлення в реальному часі** | Так (через Webhook) | Ні (лише опитування)                   |
| **Історичні повідомлення** | Ні                   | Так (можна запитувати історію)         |
| **Складність налаштування** | Лише маніфест застосунку | Потрібна згода адміністратора + token flow |
| **Працює офлайн**       | Ні (має бути запущено) | Так (запит у будь-який час)            |

**Підсумок:** RSC призначений для прослуховування в реальному часі; Graph API — для доступу до історії. Щоб наздогнати пропущені повідомлення під час офлайну, потрібен Graph API з `ChannelMessage.Read.All` (потрібна згода адміністратора).

## Медіа й історія з увімкненим Graph (потрібно для каналів)

Якщо вам потрібні зображення/файли в **каналах** або ви хочете отримувати **історію повідомлень**, потрібно ввімкнути дозволи Microsoft Graph і надати згоду адміністратора.

1. У **реєстрації застосунку** Entra ID (Azure AD) додайте **дозволи Application** Microsoft Graph:
   - `ChannelMessage.Read.All` (вкладення каналів + історія)
   - `Chat.Read.All` або `ChatMessage.Read.All` (групові чати)
2. **Надайте згоду адміністратора** для tenant.
3. Збільште **версію маніфесту** застосунку Teams, повторно завантажте його та **перевстановіть застосунок у Teams**.
4. **Повністю закрийте та перезапустіть Teams**, щоб очистити кешовані метадані застосунку.

**Додатковий дозвіл для згадок користувачів:** User @mentions працюють одразу для користувачів у розмові. Однак, якщо ви хочете динамічно шукати й згадувати користувачів, яких **немає в поточній розмові**, додайте дозвіл `User.Read.All` (Application) і надайте згоду адміністратора.

## Відомі обмеження

### Тайм-аути Webhook

Teams доставляє повідомлення через HTTP Webhook. Якщо обробка триває занадто довго (наприклад, повільні відповіді LLM), ви можете побачити:

- Тайм-аути Gateway
- Teams повторно надсилає повідомлення (що спричиняє дублікати)
- Відкинуті відповіді

OpenClaw обробляє це, швидко повертаючи відповідь і проактивно надсилаючи відповіді, але дуже повільні відповіді все одно можуть спричиняти проблеми.

### Форматування

Markdown у Teams обмеженіший, ніж у Slack або Discord:

- Базове форматування працює: **жирний**, _курсив_, `code`, посилання
- Складний markdown (таблиці, вкладені списки) може відображатися некоректно
- Adaptive Cards підтримуються для опитувань і надсилання семантичних презентацій (див. нижче)

## Конфігурація

Ключові налаштування (спільні шаблони каналів див. у `/gateway/configuration`):

- `channels.msteams.enabled`: увімкнути/вимкнути канал.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: облікові дані бота.
- `channels.msteams.webhook.port` (за замовчуванням `3978`)
- `channels.msteams.webhook.path` (за замовчуванням `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (за замовчуванням: pairing)
- `channels.msteams.allowFrom`: allowlist для особистих повідомлень (рекомендовано AAD object IDs). Майстер під час налаштування зіставляє імена з ID, коли доступний Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: аварійний перемикач для повторного ввімкнення змінного зіставлення за UPN/відображуваним іменем і прямої маршрутизації за назвою команди/каналу.
- `channels.msteams.textChunkLimit`: розмір фрагмента вихідного тексту.
- `channels.msteams.chunkMode`: `length` (за замовчуванням) або `newline`, щоб розділяти за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.msteams.mediaAllowHosts`: allowlist для хостів вхідних вкладень (за замовчуванням домени Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist для додавання заголовків Authorization під час повторних спроб медіа (за замовчуванням хости Graph + Bot Framework).
- `channels.msteams.requireMention`: вимагати @mention у каналах/групах (за замовчуванням true).
- `channels.msteams.replyStyle`: `thread | top-level` (див. [Стиль відповіді](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.requireMention`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.tools`: стандартні перевизначення політики інструментів для окремої команди (`allow`/`deny`/`alsoAllow`), які використовуються, коли перевизначення каналу відсутнє.
- `channels.msteams.teams.<teamId>.toolsBySender`: стандартні перевизначення політики інструментів для окремої команди й окремого відправника (підтримується wildcard `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: перевизначення політики інструментів для окремого каналу (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: перевизначення політики інструментів для окремого каналу й окремого відправника (підтримується wildcard `"*"`).
- Ключі `toolsBySender` мають використовувати явні префікси:
  `id:`, `e164:`, `username:`, `name:` (застарілі ключі без префікса все ще зіставляються лише з `id:`).
- `channels.msteams.actions.memberInfo`: увімкнути або вимкнути дію інформації про учасника на основі Graph (за замовчуванням: увімкнено, коли доступні облікові дані Graph).
- `channels.msteams.authType`: тип автентифікації — `"secret"` (за замовчуванням) або `"federated"`.
- `channels.msteams.certificatePath`: шлях до файлу PEM-сертифіката (федеративна автентифікація + автентифікація за сертифікатом).
- `channels.msteams.certificateThumbprint`: відбиток сертифіката (необов’язково, не потрібен для автентифікації).
- `channels.msteams.useManagedIdentity`: увімкнути автентифікацію через керовану ідентичність (федеративний режим).
- `channels.msteams.managedIdentityClientId`: client ID для user-assigned managed identity.
- `channels.msteams.sharePointSiteId`: SharePoint site ID для завантаження файлів у групових чатах/каналах (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)).

## Маршрутизація та сеанси

- Ключі сеансів відповідають стандартному формату агента (див. [/concepts/session](/uk/concepts/session)):
  - Особисті повідомлення спільно використовують головний сеанс (`agent:<agentId>:<mainKey>`).
  - Повідомлення каналів/груп використовують conversation id:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль відповіді: гілки проти дописів

Teams нещодавно запровадив два стилі інтерфейсу каналів поверх тієї самої базової моделі даних:

| Стиль                    | Опис                                               | Рекомендований `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (класичний)      | Повідомлення відображаються як картки з гілковими відповідями під ними | `thread` (за замовчуванням)       |
| **Threads** (як у Slack) | Повідомлення йдуть лінійно, більше схоже на Slack                   | `top-level`              |

**Проблема:** Teams API не показує, який стиль інтерфейсу використовує канал. Якщо використати неправильний `replyStyle`:

- `thread` у каналі зі стилем Threads → відповіді виглядають незручно вкладеними
- `top-level` у каналі зі стилем Posts → відповіді відображаються як окремі дописи верхнього рівня, а не в гілці

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

- **Особисті повідомлення:** Зображення та файлові вкладення працюють через файлові API бота Teams.
- **Канали/групи:** Вкладення зберігаються в сховищі M365 (SharePoint/OneDrive). Корисне навантаження Webhook містить лише HTML-заглушку, а не фактичні байти файлу. **Для завантаження вкладень каналів потрібні дозволи Graph API**.
- Для явного надсилання, де файл є основним вмістом, використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов’язковий `message` стає супровідним текстом/коментарем, а `filename` перевизначає назву завантаженого файлу.

Без дозволів Graph повідомлення каналу із зображеннями будуть отримані лише як текст (вміст зображення недоступний боту).
За замовчуванням OpenClaw завантажує медіа лише з імен хостів Microsoft/Teams. Перевизначте через `channels.msteams.mediaAllowHosts` (використовуйте `["*"]`, щоб дозволити будь-який хост).
Заголовки Authorization додаються лише для хостів у `channels.msteams.mediaAuthAllowHosts` (за замовчуванням хости Graph + Bot Framework). Тримайте цей список суворим (уникайте суфіксів для кількох tenant).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в особистих повідомленнях за допомогою потоку FileConsentCard (вбудовано). Однак **надсилання файлів у групових чатах/каналах** потребує додаткового налаштування:

| Контекст                  | Як надсилаються файли                           | Потрібне налаштування                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **Особисті повідомлення**                  | FileConsentCard → користувач приймає → бот завантажує | Працює одразу                            |
| **Групові чати/канали** | Завантаження в SharePoint → поширення посилання            | Потрібні `sharePointSiteId` + дозволи Graph |
| **Зображення (будь-який контекст)** | Inline у кодуванні Base64                        | Працює одразу                            |

### Чому груповим чатам потрібен SharePoint

Боти не мають персонального диска OneDrive (endpoint Graph API `/me/drive` не працює для application identities). Щоб надсилати файли в групових чатах/каналах, бот завантажує їх на **сайт SharePoint** і створює посилання для спільного доступу.

### Налаштування

1. **Додайте дозволи Graph API** в Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - завантаження файлів у SharePoint
   - `Chat.Read.All` (Application) - необов’язково, вмикає посилання для спільного доступу на рівні користувача

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

### Поведінка спільного доступу

| Дозвіл                              | Поведінка спільного доступу                                          |
| --------------------------------------- | --------------------------------------------------------- |
| Лише `Sites.ReadWrite.All`              | Посилання для спільного доступу в межах організації (доступ має будь-хто в організації) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Посилання для спільного доступу на рівні користувача (доступ мають лише учасники чату)      |

Спільний доступ на рівні користувача безпечніший, оскільки лише учасники чату можуть отримати доступ до файлу. Якщо дозволу `Chat.Read.All` немає, бот повертається до спільного доступу в межах організації.

### Резервна поведінка

| Сценарій                                          | Результат                                             |
| ------------------------------------------------- | -------------------------------------------------- |
| Груповий чат + файл + налаштований `sharePointSiteId` | Завантаження в SharePoint, надсилання посилання для спільного доступу            |
| Груповий чат + файл + без `sharePointSiteId`         | Спроба завантаження в OneDrive (може завершитися помилкою), надсилання лише тексту |
| Особистий чат + файл                              | Потік FileConsentCard (працює без SharePoint)    |
| Будь-який контекст + зображення                               | Inline у кодуванні Base64 (працює без SharePoint)   |

### Місце зберігання файлів

Завантажені файли зберігаються в папці `/OpenClawShared/` у стандартній бібліотеці документів налаштованого сайту SharePoint.

## Опитування (Adaptive Cards)

OpenClaw надсилає опитування Teams як Adaptive Cards (нативного Teams poll API немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоси записуються Gateway у `~/.openclaw/msteams-polls.json`.
- Gateway має залишатися онлайн, щоб записувати голоси.
- Опитування поки що не публікують підсумки результатів автоматично (за потреби перегляньте файл сховища).

## Картки презентацій

Надсилайте семантичні презентаційні payload користувачам або розмовам Teams за допомогою інструмента `message` або CLI. OpenClaw відтворює їх як Teams Adaptive Cards із загального контракту презентацій.

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

Докладніше про формат цілі див. у [Формати цілей](#target-formats) нижче.

## Формати цілей

Цілі MSTeams використовують префікси, щоб розрізняти користувачів і розмови:

| Тип цілі         | Формат                           | Приклад                                             |
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
Без префікса `user:` імена за замовчуванням розпізнаються як групи або команди. Завжди використовуйте `user:`, коли націлюєтеся на людей за відображуваним іменем.
</Note>

## Проактивний обмін повідомленнями

- Проактивні повідомлення можливі лише **після** взаємодії користувача, оскільки в цей момент ми зберігаємо посилання на розмову.
- Див. `/gateway/configuration` щодо `dmPolicy` і керування списком дозволених.

## Ідентифікатори команд і каналів (поширена пастка)

Параметр запиту `groupId` в URL Teams **НЕ** є ідентифікатором команди, який використовується для конфігурації. Натомість витягайте ідентифікатори зі шляху URL:

**URL команди:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (URL-decode this)
```

**URL каналу:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Для конфігурації:**

- Ідентифікатор команди = сегмент шляху після `/team/` (URL-декодований, наприклад, `19:Bk4j...@thread.tacv2`)
- Ідентифікатор каналу = сегмент шляху після `/channel/` (URL-декодований)
- **Ігноруйте** параметр запиту `groupId`

## Приватні канали

Боти мають обмежену підтримку в приватних каналах:

| Функція                      | Стандартні канали | Приватні канали                 |
| ---------------------------- | ----------------- | ------------------------------- |
| Встановлення бота            | Так               | Обмежено                        |
| Повідомлення в реальному часі (webhook) | Так               | Може не працювати               |
| Дозволи RSC                  | Так               | Можуть поводитися інакше        |
| @згадки                      | Так               | Якщо бот доступний              |
| Історія Graph API            | Так               | Так (за наявності дозволів)     |

**Обхідні рішення, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом
2. Використовуйте DM - користувачі завжди можуть написати боту напряму
3. Використовуйте Graph API для доступу до історії (потрібен `ChannelMessage.Read.All`)

## Усунення несправностей

### Поширені проблеми

- **Зображення не відображаються в каналах:** відсутні дозволи Graph або згода адміністратора. Перевстановіть застосунок Teams і повністю закрийте/знову відкрийте Teams.
- **Немає відповідей у каналі:** за замовчуванням потрібні згадки; встановіть `channels.msteams.requireMention=false` або налаштуйте окремо для команди/каналу.
- **Невідповідність версії (Teams усе ще показує старий маніфест):** видаліть і повторно додайте застосунок, а потім повністю закрийте Teams, щоб оновити дані.
- **401 Unauthorized від webhook:** очікувано під час ручного тестування без Azure JWT - це означає, що кінцева точка доступна, але автентифікація не вдалася. Використовуйте Azure Web Chat для коректного тестування.

### Помилки завантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли піктограм розміром 0 байтів. Створіть коректні PNG-піктограми (32x32 для `outline.png`, 192x192 для `color.png`).
- **"webApplicationInfo.Id already in use":** застосунок усе ще встановлено в іншій команді/чаті. Спочатку знайдіть і видаліть його або зачекайте 5-10 хвилин на поширення змін.
- **"Something went wrong" під час завантаження:** натомість завантажте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools браузера (F12) → вкладку Network і перевірте тіло відповіді на фактичну помилку.
- **Sideload не вдається:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app" - це часто обходить обмеження sideload.

### Дозволи RSC не працюють

1. Переконайтеся, що `webApplicationInfo.id` точно збігається з App ID вашого бота
2. Повторно завантажте застосунок і перевстановіть його в команді/чаті
3. Перевірте, чи адміністратор вашої організації не заблокував дозволи RSC
4. Підтвердьте, що використовуєте правильну область: `ChannelMessage.Read.Group` для команд, `ChatMessage.Read.Chat` для групових чатів

## Посилання

- [Створити Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - посібник із налаштування Azure Bot
- [Портал розробника Teams](https://dev.teams.microsoft.com/apps) - створення й керування застосунками Teams
- [Схема маніфесту застосунку Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Отримання повідомлень каналу за допомогою RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Довідник дозволів RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Обробка файлів ботом Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (канал/група потребує Graph)
- [Проактивний обмін повідомленнями](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI для керування ботом

## Пов’язане

- [Огляд каналів](/uk/channels) — усі підтримувані канали
- [Сполучення](/uk/channels/pairing) — автентифікація DM і процес сполучення
- [Групи](/uk/channels/groups) — поведінка групового чату та керування згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) — маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) — модель доступу та зміцнення безпеки
