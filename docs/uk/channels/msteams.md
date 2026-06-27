---
read_when:
    - Робота над функціями каналу Microsoft Teams
summary: Стан підтримки, можливості та конфігурація бота Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-27T17:12:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

Стан: підтримуються текст і вкладення в DM; надсилання файлів у каналах/групах потребує `sharePointSiteId` + дозволів Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Опитування надсилаються через Adaptive Cards. Дії повідомлень надають явну дію `upload-file` для надсилань, де файл іде першим.

## Вбудований plugin

Microsoft Teams постачається як вбудований plugin у поточних випусках OpenClaw, тому в звичайній пакетованій збірці окреме встановлення не потрібне.

Якщо ви використовуєте старішу збірку або кастомне встановлення, яке виключає вбудований Teams, установіть npm-пакет напряму:

```bash
openclaw plugins install @openclaw/msteams
```

Використовуйте пакет без версії, щоб відстежувати поточний офіційний тег випуску. Закріплюйте точну версію лише тоді, коли вам потрібне відтворюване встановлення.

Локальний checkout (під час запуску з git-репозиторію):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Докладно: [Plugins](/uk/tools/plugin)

## Швидке налаштування

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) виконує реєстрацію бота, створення маніфесту та генерацію облікових даних однією командою.

**1. Установіть і ввійдіть**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI наразі перебуває в preview. Команди та прапорці можуть змінюватися між випусками.
</Note>

**2. Запустіть тунель** (Teams не може звертатися до localhost)

Установіть і автентифікуйте devtunnel CLI, якщо ще цього не зробили ([посібник із початку роботи](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` потрібен, бо Teams не може автентифікуватися через devtunnels. Кожен вхідний запит бота все одно автоматично перевіряється Teams SDK.
</Note>

Альтернативи: `ngrok http 3978` або `tailscale funnel 3978` (але вони можуть змінювати URL у кожному сеансі).

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
- Реєструє бота (за замовчуванням керований Teams - передплата Azure не потрібна)

Вивід покаже `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` і **Teams App ID** - занотуйте їх для наступних кроків. Він також пропонує встановити застосунок у Teams напряму.

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

**5. Установіть застосунок у Teams**

`teams app create` запропонує встановити застосунок - виберіть "Install in Teams". Якщо ви пропустили цей крок, посилання можна отримати пізніше:

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
Групові чати заблоковані за замовчуванням (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` або використайте `groupPolicy: "open"`, щоб дозволити будь-якого учасника (з перевіркою згадки).
</Note>

## Цілі

- Спілкуйтеся з OpenClaw через DM, групові чати або канали Teams.
- Зберігайте детерміновану маршрутизацію: відповіді завжди повертаються в канал, з якого вони надійшли.
- За замовчуванням використовуйте безпечну поведінку каналу (згадки обов’язкові, якщо не налаштовано інакше).

## Записи конфігурації

За замовчуванням Microsoft Teams дозволено записувати оновлення конфігурації, спричинені `/config set|unset` (потребує `commands.config: true`).

Вимкніть за допомогою:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Контроль доступу (DM + групи)

**Доступ до DM**

- За замовчуванням: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються, доки їх не буде схвалено.
- `channels.msteams.allowFrom` має використовувати стабільні object ID AAD або статичні групи доступу відправників, як-от `accessGroup:core-team`.
- Не покладайтеся на зіставлення UPN/display-name для allowlist - вони можуть змінюватися. OpenClaw вимикає пряме зіставлення імен за замовчуванням; увімкніть його явно через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер може зіставляти імена з ID через Microsoft Graph, коли облікові дані це дозволяють.

**Доступ до груп**

- За замовчуванням: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, якщо ви не додали `groupAllowFrom`). Використовуйте `channels.defaults.groupPolicy`, щоб перевизначити стандартне значення, коли воно не задане.
- `channels.msteams.groupAllowFrom` керує тим, які відправники або статичні групи доступу відправників можуть запускати дії в групових чатах/каналах (із fallback до `channels.msteams.allowFrom`).
- Задайте `groupPolicy: "open"`, щоб дозволити будь-якого учасника (за замовчуванням усе ще з перевіркою згадки).
- Щоб не дозволяти **жодних каналів**, задайте `channels.msteams.groupPolicy: "disabled"`.

Приклад:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Teams + allowlist каналів**

- Обмежуйте відповіді груп/каналів, перелічуючи teams і канали в `channels.msteams.teams`.
- Ключі мають використовувати стабільні conversation ID Teams із посилань Teams, а не змінні display names.
- Коли `groupPolicy="allowlist"` і наявний allowlist teams, приймаються лише перелічені teams/канали (з перевіркою згадки).
- Майстер налаштування приймає записи `Team/Channel` і зберігає їх для вас.
- Під час запуску OpenClaw зіставляє імена team/channel і користувацького allowlist з ID (коли дозволи Graph це дозволяють)
  і журналює мапінг; нерозпізнані імена team/channel зберігаються так, як введено, але за замовчуванням ігноруються для маршрутизації, якщо не ввімкнено `channels.msteams.dangerouslyAllowNameMatching: true`.

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

Якщо ви не можете використовувати Teams CLI, можна налаштувати бота вручну через Azure Portal.

### Як це працює

1. Переконайтеся, що plugin Microsoft Teams доступний (вбудований у поточні випуски).
2. Створіть **Azure Bot** (App ID + секрет + tenant ID).
3. Зберіть **пакет застосунку Teams**, який посилається на бота й містить наведені нижче дозволи RSC.
4. Завантажте/установіть застосунок Teams у team (або personal scope для DM).
5. Налаштуйте `msteams` у `~/.openclaw/openclaw.json` (або env vars) і запустіть gateway.
6. Gateway за замовчуванням слухає трафік Webhook Bot Framework на `/api/messages`.

### Крок 1: Створіть Azure Bot

1. Перейдіть до [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Заповніть вкладку **Basics**:

   | Поле               | Значення                                                        |
   | ------------------ | --------------------------------------------------------------- |
   | **Bot handle**     | Ім’я вашого бота, напр., `openclaw-msteams` (має бути унікальним) |
   | **Subscription**   | Виберіть свою передплату Azure                                  |
   | **Resource group** | Створіть нову або використайте наявну                           |
   | **Pricing tier**   | **Free** для dev/testing                                        |
   | **Type of App**    | **Single Tenant** (рекомендовано - див. примітку нижче)          |
   | **Creation type**  | **Create new Microsoft App ID**                                 |

<Warning>
Створення нових multi-tenant ботів було deprecated після 2025-07-31. Використовуйте **Single Tenant** для нових ботів.
</Warning>

3. Натисніть **Review + create** → **Create** (зачекайте ~1-2 хвилини)

### Крок 2: Отримайте облікові дані

1. Перейдіть до ресурсу Azure Bot → **Configuration**
2. Скопіюйте **Microsoft App ID** → це ваш `appId`
3. Натисніть **Manage Password** → перейдіть до App Registration
4. У **Certificates & secrets** → **New client secret** → скопіюйте **Value** → це ваш `appPassword`
5. Перейдіть до **Overview** → скопіюйте **Directory (tenant) ID** → це ваш `tenantId`

### Крок 3: Налаштуйте Messaging Endpoint

1. В Azure Bot → **Configuration**
2. Задайте **Messaging endpoint** як URL вашого Webhook:
   - Production: `https://your-domain.com/api/messages`
   - Local dev: використайте тунель (див. [Локальна розробка](#local-development-tunneling) нижче)

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

Канал Teams запускається автоматично, коли plugin доступний і існує конфігурація `msteams` з обліковими даними.

</details>

## Федеративна автентифікація (сертифікат плюс керована ідентичність)

> Додано в 2026.4.11

Для production-розгортань OpenClaw підтримує **федеративну автентифікацію** як безпечнішу альтернативу клієнтським секретам. Доступні два методи:

### Варіант A: автентифікація на основі сертифіката

Використовуйте PEM-сертифікат, зареєстрований у реєстрації застосунку Entra ID.

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

Використовуйте Azure Managed Identity для автентифікації без пароля. Це ідеально для розгортань в інфраструктурі Azure (AKS, App Service, Azure VMs), де доступна керована ідентичність.

**Як це працює:**

1. Pod/VM бота має керовану ідентичність (system-assigned або user-assigned).
2. **Облікові дані федеративної ідентичності** пов’язують керовану ідентичність із реєстрацією застосунку Entra ID.
3. Під час виконання OpenClaw використовує `@azure/identity`, щоб отримати токени з Azure IMDS endpoint (`169.254.169.254`).
4. Токен передається в Teams SDK для автентифікації бота.

**Передумови:**

- Інфраструктура Azure з увімкненою керованою ідентичністю (AKS workload identity, App Service, VM)
- Облікові дані федеративної ідентичності, створені в реєстрації застосунку Entra ID
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

Для розгортань AKS, що використовують workload identity:

1. **Увімкніть workload identity** у своєму кластері AKS.
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

4. **Додайте мітку до pod** для ін’єкції workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Переконайтеся в наявності мережевого доступу** до IMDS (`169.254.169.254`) - якщо використовується NetworkPolicy, додайте правило egress, яке дозволяє трафік до `169.254.169.254/32` на порту 80.

### Порівняння типів автентифікації

| Метод                   | Конфігурація                                  | Переваги                                | Недоліки                                         |
| ----------------------- | --------------------------------------------- | --------------------------------------- | ------------------------------------------------ |
| **Секрет клієнта**      | `appPassword`                                 | Просте налаштування                     | Потрібна ротація секретів, менш безпечно         |
| **Сертифікат**          | `authType: "federated"` + `certificatePath`   | Немає спільного секрету через мережу    | Додаткове керування сертифікатами                |
| **Managed Identity**    | `authType: "federated"` + `useManagedIdentity` | Без пароля, немає секретів для керування | Потрібна інфраструктура Azure                    |

**Типова поведінка:** Коли `authType` не задано, OpenClaw типово використовує автентифікацію за секретом клієнта. Наявні конфігурації продовжують працювати без змін.

## Локальна розробка (тунелювання)

Teams не може звертатися до `localhost`. Використовуйте постійний dev-тунель, щоб ваша URL-адреса залишалася однаковою між сесіями:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Альтернативи: `ngrok http 3978` або `tailscale funnel 3978` (URL-адреси можуть змінюватися в кожній сесії).

Якщо URL-адреса тунелю змінюється, оновіть endpoint:

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
2. Знайдіть бота в Teams і надішліть DM
3. Перевірте журнали Gateway на вхідну активність

## Змінні середовища

Натомість усі ключі конфігурації можна задати через змінні середовища:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (необов’язково: `"secret"` або `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (необов’язково, не потрібно для автентифікації)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (лише MI, призначена користувачем)

## Дія інформації про учасника

OpenClaw надає дію `member-info` на основі Graph для Microsoft Teams, щоб агенти й автоматизації могли отримувати деталі учасників каналу (відображуване ім’я, електронну пошту, роль) безпосередньо з Microsoft Graph.

Вимоги:

- Дозвіл RSC `Member.Read.Group` (уже є в рекомендованому маніфесті)
- Для пошуків між командами: дозвіл Graph Application `User.Read.All` зі згодою адміністратора

Дія керується `channels.msteams.actions.memberInfo` (типово: увімкнено, коли доступні облікові дані Graph).

## Контекст історії

- `channels.msteams.historyLimit` керує тим, скільки останніх повідомлень каналу/групи загортається в prompt.
- Повертається до `messages.groupChat.historyLimit`. Установіть `0`, щоб вимкнути (типово 50).
- Отримана історія thread фільтрується за allowlist відправників (`allowFrom` / `groupAllowFrom`), тому початкове наповнення контексту thread включає лише повідомлення від дозволених відправників.
- Контекст цитованих вкладень (`ReplyTo*`, отриманий із HTML-відповіді Teams) наразі передається як отримано.
- Іншими словами, allowlist визначають, хто може запускати агента; сьогодні фільтруються лише окремі додаткові шляхи контексту.
- Історію DM можна обмежити за допомогою `channels.msteams.dmHistoryLimit` (ходи користувача). Перевизначення для окремих користувачів: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи Teams RSC (маніфест)

Це **наявні resourceSpecific permissions** у нашому маніфесті застосунку Teams. Вони застосовуються лише всередині команди/чату, де встановлено застосунок.

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

### Застереження щодо маніфесту (обов’язкові поля)

- `bots[].botId` **має** збігатися з Azure Bot App ID.
- `webApplicationInfo.id` **має** збігатися з Azure Bot App ID.
- `bots[].scopes` має містити поверхні, які ви плануєте використовувати (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` потрібен для обробки файлів в особистій області.
- `authorization.permissions.resourceSpecific` має містити читання/надсилання каналу, якщо вам потрібен трафік каналу.

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
<summary>Ручне оновлення маніфесту (без CLI)</summary>

1. Оновіть свій `manifest.json` новими налаштуваннями
2. **Збільште поле `version`** (наприклад, `1.0.0` → `1.1.0`)
3. **Повторно заархівуйте** маніфест з іконками (`manifest.json`, `outline.png`, `color.png`)
4. Завантажте новий zip:
   - **Teams Admin Center:** Teams apps → Manage apps → знайдіть свій застосунок → Upload new version
   - **Sideload:** У Teams → Apps → Manage your apps → Upload a custom app

</details>

## Можливості: лише RSC проти Graph

### З **лише Teams RSC** (застосунок установлено, без дозволів Graph API)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання файлових вкладень **особистих (DM)** повідомлень.

НЕ працює:

- **Зображення або вміст файлів** у каналі/групі (payload містить лише HTML-заглушку).
- Завантаження вкладень, збережених у SharePoint/OneDrive.
- Читання історії повідомлень (поза живою подією Webhook).

### З **Teams RSC + дозволами Microsoft Graph Application**

Додає:

- Завантаження розміщеного вмісту (зображень, вставлених у повідомлення).
- Завантаження файлових вкладень, збережених у SharePoint/OneDrive.
- Читання історії повідомлень каналу/чату через Graph.

### RSC проти Graph API

| Можливість                  | Дозволи RSC          | Graph API                                   |
| --------------------------- | -------------------- | ------------------------------------------- |
| **Повідомлення в реальному часі** | Так (через Webhook) | Ні (лише опитування)                        |
| **Історичні повідомлення**  | Ні                   | Так (можна запитувати історію)              |
| **Складність налаштування** | Лише маніфест застосунку | Потрібна згода адміністратора + потік токена |
| **Працює офлайн**           | Ні (має бути запущено) | Так (запит будь-коли)                       |

**Підсумок:** RSC призначений для прослуховування в реальному часі; Graph API - для історичного доступу. Щоб наздоганяти пропущені повідомлення під час офлайну, потрібен Graph API з `ChannelMessage.Read.All` (потребує згоди адміністратора).

## Медіа + історія з Graph (потрібно для каналів)

Якщо вам потрібні зображення/файли в **каналах** або ви хочете отримувати **історію повідомлень**, потрібно ввімкнути дозволи Microsoft Graph і надати згоду адміністратора.

1. У **App Registration** Entra ID (Azure AD) додайте **Application permissions** Microsoft Graph:
   - `ChannelMessage.Read.All` (вкладення каналу + історія)
   - `Chat.Read.All` або `ChatMessage.Read.All` (групові чати)
2. **Надайте згоду адміністратора** для tenant.
3. Збільште **версію маніфесту** застосунку Teams, завантажте його повторно та **перевстановіть застосунок у Teams**.
4. **Повністю закрийте та перезапустіть Teams**, щоб очистити кешовані метадані застосунку.

**Додатковий дозвіл для згадок користувачів:** @mentions користувачів працюють із коробки для користувачів у розмові. Однак, якщо ви хочете динамічно шукати й згадувати користувачів, які **не перебувають у поточній розмові**, додайте дозвіл `User.Read.All` (Application) і надайте згоду адміністратора.

## Відомі обмеження

### Тайм-аути Webhook

Teams доставляє повідомлення через HTTP Webhook. Якщо обробка триває надто довго (наприклад, повільні відповіді LLM), ви можете побачити:

- Тайм-аути Gateway
- Teams повторно надсилає повідомлення (спричиняючи дублікати)
- Відкинуті відповіді

OpenClaw обробляє це, швидко повертаючи відповідь і проактивно надсилаючи репліки, але дуже повільні відповіді все одно можуть спричиняти проблеми.

### Підтримка хмари Teams і URL сервісу

Цей шлях Teams на базі SDK проходить живу перевірку для публічної хмари Microsoft Teams.

Вхідні відповіді використовують контекст turn вхідного Teams SDK. Проактивні операції поза контекстом - надсилання, редагування, видалення, картки, опитування, повідомлення з consent для файлів і поставлені в чергу довготривалі відповіді - використовують збережений `serviceUrl` посилання на розмову. Публічна хмара за замовчуванням використовує середовище публічної хмари Teams SDK і дозволяє збережені посилання на публічному хості Teams Connector: `https://smba.trafficmanager.net/`.

Публічна хмара є стандартною. Для звичайних ботів у публічній хмарі не потрібно задавати `channels.msteams.cloud` або `channels.msteams.serviceUrl`.

Для непублічних хмар Teams задайте `cloud` і відповідну проактивну межу, коли Microsoft її опублікує:

- `channels.msteams.cloud` вибирає хмарний пресет Teams SDK для автентифікації, перевірки JWT, сервісів токенів і області Graph.
- `channels.msteams.serviceUrl` вибирає межу кінцевої точки Bot Connector, яка використовується для перевірки збережених посилань на розмови перед проактивними надсиланнями, редагуваннями, видаленнями, картками, опитуваннями, повідомленнями з consent для файлів і поставленими в чергу довготривалими відповідями. Це обов'язково для хмар USGov і DoD SDK. Для China/21Vianet OpenClaw використовує пресет SDK `China` і приймає збережені/налаштовані URL сервісу лише на хостах каналів Azure China Bot Framework.

Microsoft публікує глобальні проактивні кінцеві точки Bot Connector у розділі [Створення розмови](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) документації Teams щодо проактивних повідомлень. Використовуйте `serviceUrl` вхідної активності, коли він доступний; якщо потрібна глобальна проактивна кінцева точка, використовуйте таблицю Microsoft.

| Середовище Teams | Конфігурація OpenClaw                                      | Проактивний `serviceUrl`                         |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Public            | конфігурація cloud/serviceUrl не потрібна                  | `https://smba.trafficmanager.net/teams`            |
| GCC               | задайте `serviceUrl`; окремого хмарного пресета Teams SDK немає | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | використовуйте `serviceUrl` вхідної активності     |

Приклад для GCC, де Microsoft документує окремий проактивний URL сервісу, але Teams SDK не надає окремого хмарного пресета GCC:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

Приклад для GCC High:

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl` обмежено підтримуваними хостами Microsoft Teams Bot Connector. Коли URL сервісу налаштовано, OpenClaw перевіряє, що збережений `serviceUrl` розмови використовує той самий хост, перш ніж виконуються проактивні надсилання, редагування, видалення, картки, опитування або поставлені в чергу довготривалі відповіді. Із типовою конфігурацією публічної хмари OpenClaw fail-closed, якщо збережена розмова вказує за межі публічного хоста Teams Connector. Після зміни налаштувань хмари/URL сервісу отримайте нове повідомлення з розмови, щоб збережене посилання на розмову було актуальним.

China/21Vianet не має окремого глобального проактивного URL `smba` у таблиці проактивних кінцевих точок Teams від Microsoft. Налаштуйте `cloud: "China"`, щоб Teams SDK використовував кінцеві точки автентифікації, токенів і JWT Azure China. Після цього проактивні надсилання потребують збереженого посилання на розмову з вхідної активності China Teams або явно налаштованого URL сервісу на межі каналу Azure China Bot Framework (`*.botframework.azure.cn`). Допоміжні функції Teams на базі Graph наразі вимкнено для `cloud: "China"`, доки OpenClaw не маршрутизуватиме запити Graph через кінцеву точку Azure China Graph.

### Форматування

Markdown у Teams обмеженіший, ніж у Slack або Discord:

- Базове форматування працює: **жирний**, _курсив_, `code`, посилання
- Складний markdown (таблиці, вкладені списки) може відображатися некоректно
- Adaptive Cards підтримуються для опитувань і семантичних презентаційних надсилань (див. нижче)

## Конфігурація

Ключові налаштування (див. `/gateway/configuration` для спільних шаблонів каналів):

- `channels.msteams.enabled`: увімкнути/вимкнути канал.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: облікові дані бота.
- `channels.msteams.cloud`: хмарне середовище Teams SDK (`Public`, `USGov`, `USGovDoD` або `China`; стандартно `Public`). Задавайте це разом із `serviceUrl` для хмар USGov/DoD SDK; China використовує пресет SDK і збережені посилання на розмови Azure China Bot Framework, а допоміжні функції на базі Graph вимкнено, доки не буде реалізовано маршрутизацію Azure China Graph.
- `channels.msteams.serviceUrl`: межа URL сервісу Bot Connector для проактивних операцій SDK. Публічна хмара використовує стандартне значення SDK; задайте це для GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High або DoD. China приймає хости каналів Azure China Bot Framework, коли збережене посилання на розмову надходить із Teams, яким керує 21Vianet.
- `channels.msteams.webhook.port` (стандартно `3978`)
- `channels.msteams.webhook.path` (стандартно `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (стандартно: pairing)
- `channels.msteams.allowFrom`: allowlist DM (рекомендовано AAD object IDs). Майстер під час налаштування перетворює імена на IDs, коли доступний доступ до Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: аварійний перемикач для повторного ввімкнення зіставлення змінних UPN/display-name і прямої маршрутизації за іменами team/channel.
- `channels.msteams.textChunkLimit`: розмір фрагмента вихідного тексту.
- `channels.msteams.chunkMode`: `length` (стандартно) або `newline`, щоб розділяти за порожніми рядками (межами абзаців) перед фрагментацією за довжиною.
- `channels.msteams.mediaAllowHosts`: allowlist для хостів вхідних вкладень (стандартно домени Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: allowlist для додавання заголовків Authorization під час повторних спроб медіа (стандартно хости Graph + Bot Framework).
- `channels.msteams.requireMention`: вимагати @mention у каналах/групах (стандартно true).
- `channels.msteams.replyStyle`: `thread | top-level` (див. [Стиль відповіді](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: перевизначення для команди.
- `channels.msteams.teams.<teamId>.requireMention`: перевизначення для команди.
- `channels.msteams.teams.<teamId>.tools`: стандартні перевизначення політики інструментів для команди (`allow`/`deny`/`alsoAllow`), які використовуються, коли перевизначення каналу відсутнє.
- `channels.msteams.teams.<teamId>.toolsBySender`: стандартні перевизначення політики інструментів для команди за відправником (підтримується wildcard `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: перевизначення для каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: перевизначення для каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: перевизначення політики інструментів для каналу (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: перевизначення політики інструментів для каналу за відправником (підтримується wildcard `"*"`).
- Ключі `toolsBySender` мають використовувати явні префікси:
  `channel:`, `id:`, `e164:`, `username:`, `name:` (застарілі ключі без префікса все ще зіставляються лише з `id:`).
- `channels.msteams.actions.memberInfo`: увімкнути або вимкнути дію інформації про учасника на базі Graph (стандартно: увімкнено, коли доступні облікові дані Graph).
- `channels.msteams.authType`: тип автентифікації - `"secret"` (стандартно) або `"federated"`.
- `channels.msteams.certificatePath`: шлях до файлу PEM-сертифіката (federated + certificate auth).
- `channels.msteams.certificateThumbprint`: відбиток сертифіката (необов'язково, не потрібно для auth).
- `channels.msteams.useManagedIdentity`: увімкнути автентифікацію керованої ідентичності (режим federated).
- `channels.msteams.managedIdentityClientId`: client ID для user-assigned managed identity.
- `channels.msteams.sharePointSiteId`: SharePoint site ID для завантажень файлів у групових чатах/каналах (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)).

## Маршрутизація та сесії

- Ключі сесій відповідають стандартному формату агента (див. [/concepts/session](/uk/concepts/session)):
  - Прямі повідомлення спільно використовують основну сесію (`agent:<agentId>:<mainKey>`).
  - Повідомлення каналів/груп використовують ідентифікатор розмови:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль відповіді: гілки проти дописів

Teams нещодавно представив два стилі інтерфейсу каналів поверх тієї самої базової моделі даних:

| Стиль                    | Опис                                                      | Рекомендований `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Дописи** (класичний)   | Повідомлення відображаються як картки з ланцюжками відповідей під ними | `thread` (стандартно)       |
| **Гілки** (подібний до Slack) | Повідомлення йдуть лінійно, більше схоже на Slack          | `top-level`              |

**Проблема:** Teams API не показує, який стиль інтерфейсу використовує канал. Якщо використати неправильний `replyStyle`:

- `thread` у каналі зі стилем гілок → відповіді виглядають незручно вкладеними
- `top-level` у каналі зі стилем дописів → відповіді з'являються як окремі дописи верхнього рівня замість відповідей у гілці

**Рішення:** Налаштуйте `replyStyle` для кожного каналу відповідно до того, як канал налаштовано:

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

### Пріоритет розв'язання

Коли бот надсилає відповідь у канал, `replyStyle` визначається від найконкретнішого перевизначення до стандартного значення. Перше значення, що не є `undefined`, перемагає:

1. **Для каналу** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Для команди** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Глобально** — `channels.msteams.replyStyle`
4. **Неявне стандартне значення** — виводиться з `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Якщо встановити `requireMention: false` глобально без явного `replyStyle`, згадки в каналах зі стилем дописів відображатимуться як дописи верхнього рівня, навіть коли вхідне повідомлення було відповіддю в гілці. Закріпіть `replyStyle: "thread"` на глобальному рівні, рівні команди або каналу, щоб уникнути несподіванок.

### Збереження контексту гілки

Коли діє `replyStyle: "thread"` і бота @mentioned зсередини гілки каналу, OpenClaw повторно прикріплює початковий корінь гілки до вихідного посилання на розмову (`19:…@thread.tacv2;messageid=<root>`), щоб відповідь потрапила в ту саму гілку. Це працює як для live (in-turn) надсилань, так і для проактивних надсилань після завершення строку дії turn-контексту Bot Framework (наприклад, довготривалі агенти, поставлені в чергу відповіді на tool-call через `mcp__openclaw__message`).

Корінь гілки береться зі збереженого `threadId` у посиланні на розмову. Старіші збережені посилання, що передують `threadId`, повертаються до `activityId` (будь-якої вхідної активності, яка востаннє ініціалізувала розмову), тому наявні розгортання продовжують працювати без повторного ініціалізування.

Коли діє `replyStyle: "top-level"`, вхідні повідомлення потоків каналу навмисно отримують відповіді як нові дописи верхнього рівня — суфікс потоку не додається. Це правильна поведінка для каналів у стилі Threads; якщо ви бачите дописи верхнього рівня там, де очікували відповіді в потоці, ваш `replyStyle` налаштовано неправильно для цього каналу.

## Вкладення та зображення

**Поточні обмеження:**

- **DM:** Зображення та файлові вкладення працюють через файлові API бота Teams.
- **Канали/групи:** Вкладення зберігаються в сховищі M365 (SharePoint/OneDrive). Корисне навантаження Webhook містить лише HTML-заглушку, а не фактичні байти файлу. **Для завантаження вкладень каналу потрібні дозволи Graph API**.
- Для явного надсилання спочатку файлу використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов'язкове `message` стає супровідним текстом/коментарем, а `filename` перевизначає назву завантаженого файлу.

Без дозволів Graph повідомлення каналу із зображеннями надходитимуть лише як текст (вміст зображення недоступний боту).
За замовчуванням OpenClaw завантажує медіа лише з хостів Microsoft/Teams. Перевизначте це через `channels.msteams.mediaAllowHosts` (використовуйте `["*"]`, щоб дозволити будь-який хост).
Заголовки авторизації додаються лише для хостів у `channels.msteams.mediaAuthAllowHosts` (за замовчуванням це хости Graph + Bot Framework). Тримайте цей список суворим (уникайте суфіксів для кількох орендарів).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в DM за допомогою потоку FileConsentCard (вбудовано). Однак **надсилання файлів у групових чатах/каналах** потребує додаткового налаштування:

| Контекст                 | Як надсилаються файли                         | Потрібне налаштування                           |
| ------------------------ | --------------------------------------------- | ----------------------------------------------- |
| **DM**                   | FileConsentCard → користувач приймає → бот завантажує | Працює з коробки                               |
| **Групові чати/канали**  | Завантаження до SharePoint → посилання для спільного доступу | Потрібні `sharePointSiteId` + дозволи Graph |
| **Зображення (будь-який контекст)** | Вбудовано з кодуванням Base64         | Працює з коробки                               |

### Чому груповим чатам потрібен SharePoint

Боти не мають особистого диска OneDrive (кінцева точка Graph API `/me/drive` не працює для ідентичностей застосунків). Щоб надсилати файли в групові чати/канали, бот завантажує їх на **сайт SharePoint** і створює посилання для спільного доступу.

### Налаштування

1. **Додайте дозволи Graph API** в Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - завантаження файлів до SharePoint
   - `Chat.Read.All` (Application) - необов'язково, вмикає посилання для спільного доступу на рівні користувача

2. **Надайте згоду адміністратора** для орендаря.

3. **Отримайте ID вашого сайту SharePoint:**

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

| Дозвіл                                  | Поведінка спільного доступу                              |
| --------------------------------------- | --------------------------------------------------------- |
| Лише `Sites.ReadWrite.All`              | Посилання для всієї організації (доступ має будь-хто в організації) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Посилання на рівні користувача (доступ мають лише учасники чату) |

Спільний доступ на рівні користувача безпечніший, оскільки доступ до файлу мають лише учасники чату. Якщо дозвіл `Chat.Read.All` відсутній, бот повертається до спільного доступу для всієї організації.

### Поведінка резервного варіанту

| Сценарій                                         | Результат                                          |
| ------------------------------------------------ | -------------------------------------------------- |
| Груповий чат + файл + налаштовано `sharePointSiteId` | Завантаження до SharePoint, надсилання посилання для спільного доступу |
| Груповий чат + файл + немає `sharePointSiteId`   | Спроба завантаження до OneDrive (може завершитися невдачею), надсилання лише тексту |
| Особистий чат + файл                             | Потік FileConsentCard (працює без SharePoint)      |
| Будь-який контекст + зображення                  | Вбудовано з кодуванням Base64 (працює без SharePoint) |

### Розташування збережених файлів

Завантажені файли зберігаються в папці `/OpenClawShared/` у стандартній бібліотеці документів налаштованого сайту SharePoint.

## Опитування (Adaptive Cards)

OpenClaw надсилає опитування Teams як Adaptive Cards (нативного API опитувань Teams немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоси записуються Gateway у SQLite стану Plugin OpenClaw за адресою `state/openclaw.sqlite`.
- Наявні файли `msteams-polls.json` імпортуються командою `openclaw doctor --fix`, а не запущеним Plugin.
- Gateway має залишатися онлайн, щоб записувати голоси.
- Опитування ще не публікують автоматично підсумки результатів, і підтримуваного CLI для результатів опитувань ще немає.

## Картки презентації

Надсилайте семантичні корисні навантаження презентації користувачам або розмовам Teams за допомогою інструмента `message`, CLI або звичайної доставки відповіді. OpenClaw відтворює їх як Teams Adaptive Cards із загального контракту презентації.

Параметр `presentation` приймає семантичні блоки. Коли надано `presentation`, текст повідомлення необов'язковий. Кнопки відтворюються як дії надсилання або URL в Adaptive Card. Меню вибору ще не є нативними в рендерері Teams, тому OpenClaw перед доставкою знижує їх до читабельного тексту.

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

Докладніше про формат цілі див. у розділі [Формати цілей](#target-formats) нижче.

## Формати цілей

Цілі MSTeams використовують префікси, щоб розрізняти користувачів і розмови:

| Тип цілі             | Формат                           | Приклад                                             |
| -------------------- | -------------------------------- | --------------------------------------------------- |
| Користувач (за ID)   | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Користувач (за іменем) | `user:<display-name>`          | `user:John Smith` (потрібен Graph API)              |
| Група/канал          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Група/канал (сирий)  | `<conversation-id>`              | `19:abc123...@thread.tacv2` (якщо містить `@thread`) |

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
Без префікса `user:` імена за замовчуванням розпізнаються як групи або команди. Завжди використовуйте `user:`, коли вказуєте людей за відображуваним іменем.
</Note>

## Проактивні повідомлення

- Проактивні повідомлення можливі лише **після** взаємодії користувача, оскільки в цей момент ми зберігаємо посилання на розмову.
- Див. `/gateway/configuration` щодо `dmPolicy` і контролю allowlist.

## ID команд і каналів (поширена помилка)

Параметр запиту `groupId` в URL Teams **НЕ** є ID команди, який використовується для конфігурації. Натомість витягуйте ID зі шляху URL:

**URL команди:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL каналу:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Для конфігурації:**

- Ключ команди = сегмент шляху після `/team/` (декодований з URL, наприклад `19:Bk4j...@thread.tacv2`; старіші орендарі можуть показувати `@thread.skype`, що також є дійсним)
- Ключ каналу = сегмент шляху після `/channel/` (декодований з URL)
- **Ігноруйте** параметр запиту `groupId` для маршрутизації OpenClaw. Це ID групи Microsoft Entra, а не ID розмови Bot Framework, який використовується у вхідних активностях Teams.

## Приватні канали

Боти мають обмежену підтримку в приватних каналах:

| Функція                       | Стандартні канали | Приватні канали       |
| ----------------------------- | ----------------- | --------------------- |
| Установлення бота             | Так               | Обмежено              |
| Повідомлення в реальному часі (Webhook) | Так     | Може не працювати     |
| Дозволи RSC                   | Так               | Можуть поводитися інакше |
| @mentions                     | Так               | Якщо бот доступний    |
| Історія Graph API             | Так               | Так (з дозволами)     |

**Обхідні шляхи, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом
2. Використовуйте DM - користувачі завжди можуть написати боту напряму
3. Використовуйте Graph API для доступу до історії (потрібен `ChannelMessage.Read.All`)

## Усунення несправностей

### Поширені проблеми

- **Зображення не показуються в каналах:** бракує дозволів Graph або згоди адміністратора. Перевстановіть застосунок Teams і повністю закрийте/відкрийте Teams.
- **Немає відповідей у каналі:** згадки потрібні за замовчуванням; установіть `channels.msteams.requireMention=false` або налаштуйте окремо для команди/каналу.
- **Невідповідність версій (Teams досі показує старий маніфест):** видаліть і повторно додайте застосунок, а також повністю закрийте Teams, щоб оновити.
- **401 Unauthorized від Webhook:** очікувано під час ручного тестування без Azure JWT - означає, що кінцева точка доступна, але автентифікація не вдалася. Використовуйте Azure Web Chat для належного тестування.

### Помилки завантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли іконок розміром 0 байтів. Створіть дійсні PNG-іконки (32x32 для `outline.png`, 192x192 для `color.png`).
- **"webApplicationInfo.Id already in use":** застосунок досі встановлено в іншій команді/чаті. Спершу знайдіть і видаліть його або зачекайте 5-10 хвилин на поширення.
- **"Something went wrong" під час завантаження:** натомість завантажте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools браузера (F12) → вкладку Network і перевірте тіло відповіді на фактичну помилку.
- **Не вдається sideload:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app" - це часто обходить обмеження sideload.

### Дозволи RSC не працюють

1. Перевірте, що `webApplicationInfo.id` точно збігається з App ID вашого бота
2. Повторно завантажте застосунок і перевстановіть його в команді/чаті
3. Перевірте, чи адміністратор вашої організації не заблокував дозволи RSC
4. Переконайтеся, що використовуєте правильну область: `ChannelMessage.Read.Group` для команд, `ChatMessage.Read.Chat` для групових чатів

## Посилання

- [Створення Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - посібник із налаштування Azure Bot
- [Портал розробника Teams](https://dev.teams.microsoft.com/apps) - створення застосунків Teams і керування ними
- [Схема маніфесту застосунку Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Отримання повідомлень каналу за допомогою RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Довідник дозволів RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Обробка файлів ботом Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для каналу/групи потрібен Graph)
- [Проактивні повідомлення](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI для керування ботами

## Пов’язане

- [Огляд каналів](/uk/channels) - усі підтримувані канали
- [Сполучення](/uk/channels/pairing) - автентифікація в DM і потік сполучення
- [Групи](/uk/channels/groups) - поведінка групових чатів і обмеження за згадками
- [Маршрутизація каналів](/uk/channels/channel-routing) - маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) - модель доступу й посилення захисту
