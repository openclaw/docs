---
read_when:
    - Робота над функціями каналу Microsoft Teams
summary: Стан підтримки, можливості та налаштування бота Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T17:41:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

Статус: підтримуються текст і вкладення в особистих повідомленнях; надсилання файлів у каналах/групах потребує `sharePointSiteId` і дозволів Graph (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)). Опитування надсилаються через Adaptive Cards. Дії з повідомленнями надають явний параметр `upload-file` для надсилань, у яких файл іде першим.

## Вбудований Plugin

Microsoft Teams постачається як вбудований Plugin у поточних випусках OpenClaw; у звичайній пакетній збірці окреме встановлення не потрібне.

У старішій збірці або спеціальній інсталяції, що не містить вбудованого Teams, установіть пакет npm безпосередньо:

```bash
openclaw plugins install @openclaw/msteams
```

Використовуйте пакет без зазначення версії, щоб отримувати поточний офіційний тег випуску. Закріплюйте точну версію лише тоді, коли потрібне відтворюване встановлення.

Локальна робоча копія (запуск із репозиторію git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Докладніше: [Plugins](/uk/tools/plugin)

## Швидке налаштування

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) виконує реєстрацію бота, створення маніфесту та генерування облікових даних однією командою.

**1. Установіть і ввійдіть**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # перевірте, що ви ввійшли, і перегляньте відомості про свій клієнт
```

<Note>
Teams CLI наразі перебуває на етапі попереднього перегляду. Команди та прапорці можуть змінюватися між випусками.
</Note>

**2. Запустіть тунель** (Teams не може отримати доступ до localhost)

За потреби встановіть CLI devtunnel та автентифікуйтеся в ньому ([посібник із початку роботи](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Одноразове налаштування (стала URL-адреса між сеансами):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Кожен сеанс розробки:
devtunnel host my-openclaw-bot
# Ваша кінцева точка: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` є обов’язковим, оскільки Teams не може автентифікуватися за допомогою devtunnels. Кожен вхідний запит до бота все одно перевіряється SDK Teams.
</Note>

Альтернативи: `ngrok http 3978` або `tailscale funnel 3978` (URL-адреси можуть змінюватися в кожному сеансі).

**3. Створіть застосунок**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Ця команда створює застосунок Entra ID (Azure AD), генерує клієнтський секрет, збирає та завантажує маніфест застосунку Teams (з піктограмами), а також реєструє бота, керованого Teams (передплата Azure не потрібна). Вивід містить `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` і **ідентифікатор застосунку Teams**; також пропонується встановити застосунок безпосередньо в Teams.

**4. Налаштуйте OpenClaw**, використовуючи облікові дані з виводу:

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

**5. Установіть застосунок у Teams**

`teams app create` запропонує встановити застосунок; виберіть "Install in Teams". Щоб отримати посилання для встановлення пізніше:

```bash
teams app get <teamsAppId> --install-link
```

**6. Перевірте, чи все працює**

```bash
teams app doctor <teamsAppId>
```

Виконує діагностику реєстрації бота, конфігурації застосунку AAD, чинності маніфесту та налаштування SSO.

Для робочого середовища замість клієнтських секретів розгляньте [федеративну автентифікацію](#federated-authentication-certificate-plus-managed-identity) (сертифікат або керована ідентичність).

<Note>
Групові чати за замовчуванням заблоковані (`channels.msteams.groupPolicy: "allowlist"`). Щоб дозволити відповіді в групах, задайте `channels.msteams.groupAllowFrom` або скористайтеся `groupPolicy: "open"`, щоб дозволити будь-якого учасника (з обов’язковою згадкою).
</Note>

## Цілі

- Спілкуватися з OpenClaw через особисті повідомлення, групові чати або канали Teams.
- Зберігати детерміновану маршрутизацію: відповіді завжди повертаються до каналу, з якого вони надійшли.
- За замовчуванням використовувати безпечну поведінку каналів (згадки обов’язкові, якщо не налаштовано інакше).

## Запис конфігурації

За замовчуванням Microsoft Teams може записувати оновлення конфігурації, ініційовані `/config set|unset` (потребує `commands.config: true`).

Щоб вимкнути:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Керування доступом (особисті повідомлення та групи)

**Доступ до особистих повідомлень**

- За замовчуванням: `channels.msteams.dmPolicy = "pairing"`. Невідомі відправники ігноруються до схвалення.
- `channels.msteams.allowFrom` має використовувати сталі ідентифікатори об’єктів AAD або статичні групи доступу відправників, як-от `accessGroup:core-team`.
- Не покладайтеся на зіставлення UPN/відображуваного імені для списків дозволених користувачів; вони можуть змінюватися. OpenClaw за замовчуванням вимикає пряме зіставлення імен; увімкніть його за допомогою `channels.msteams.dangerouslyAllowNameMatching: true`.
- Майстер може зіставляти імена з ідентифікаторами через Microsoft Graph, якщо це дозволяють облікові дані.

**Доступ до груп**

- За замовчуванням: `channels.msteams.groupPolicy = "allowlist"` (заблоковано, доки не додано `groupAllowFrom`). `channels.defaults.groupPolicy` може перевизначити спільне значення за замовчуванням, якщо `channels.msteams.groupPolicy` не задано.
- `channels.msteams.groupAllowFrom` визначає, які відправники або статичні групи доступу відправників можуть ініціювати дії в групових чатах/каналах (у разі відсутності використовується `channels.msteams.allowFrom`).
- Задайте `groupPolicy: "open"`, щоб дозволити будь-якого учасника (за замовчуванням згадка все одно обов’язкова).
- Щоб заблокувати **всі** канали, задайте `channels.msteams.groupPolicy: "disabled"`.

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

**Список дозволених команд і каналів**

- Обмежте відповіді в групах/каналах, перелічивши команди та канали в `channels.msteams.teams`.
- Використовуйте як ключі сталі ідентифікатори розмов Teams із посилань Teams, а не змінювані відображувані імена (див. [Ідентифікатори команди та каналу](#team-and-channel-ids-common-gotcha)).
- Коли наявні `groupPolicy="allowlist"` і список дозволених команд, приймаються лише перелічені команди/канали (з обов’язковою згадкою).
- Майстер налаштування приймає записи `Team/Channel` і зберігає їх.
- Під час запуску OpenClaw зіставляє назви команд/каналів та імена зі списку дозволених користувачів з ідентифікаторами (якщо це дозволяють дозволи Graph) і записує зіставлення в журнал. Нерозпізнані імена зберігаються у введеному вигляді, але ігноруються під час маршрутизації, якщо не задано `channels.msteams.dangerouslyAllowNameMatching: true`.

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
<summary><strong>Налаштування вручну (без Teams CLI)</strong></summary>

### Як це працює

1. Переконайтеся, що Plugin Microsoft Teams доступний (вбудований у поточні випуски).
2. Створіть **Azure Bot** (ідентифікатор застосунку + секрет + ідентифікатор клієнта).
3. Створіть **пакет застосунку Teams**, що посилається на бота та містить наведені нижче дозволи RSC.
4. Завантажте/встановіть застосунок Teams у команду (або в особисту область для особистих повідомлень).
5. Налаштуйте `msteams` у `~/.openclaw/openclaw.json` (або змінні середовища) і запустіть Gateway.
6. Gateway за замовчуванням прослуховує трафік Webhook Bot Framework на `/api/messages`.

### Крок 1. Створіть Azure Bot

1. Перейдіть до [створення Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Заповніть вкладку **Basics**:

   | Поле               | Значення                                                     |
   | ------------------ | ------------------------------------------------------------ |
   | **Bot handle**     | Назва вашого бота, наприклад `openclaw-msteams` (має бути унікальною) |
   | **Subscription**   | Виберіть свою передплату Azure                               |
   | **Resource group** | Створіть нову або використайте наявну                        |
   | **Pricing tier**   | **Free** для розробки/тестування                             |
   | **Type of App**    | **Single Tenant** (рекомендовано; див. примітку нижче)       |
   | **Creation type**  | **Create new Microsoft App ID**                              |

<Warning>
Створення нових багатоклієнтських ботів припинено після 2025-07-31. Використовуйте **Single Tenant** для нових ботів.
</Warning>

3. Натисніть **Review + create**, а потім **Create** (~1-2 хвилини).

### Крок 2. Отримайте облікові дані

1. Ресурс Azure Bot → **Configuration** → скопіюйте **Microsoft App ID** (ваш `appId`).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → скопіюйте **Value** (ваш `appPassword`).
3. **Overview** → скопіюйте **Directory (tenant) ID** (ваш `tenantId`).

### Крок 3. Налаштуйте кінцеву точку обміну повідомленнями

1. Azure Bot → **Configuration**.
2. Задайте **Messaging endpoint**:
   - Робоче середовище: `https://your-domain.com/api/messages`
   - Локальна розробка: використовуйте тунель (див. [Локальна розробка](#local-development-tunneling))

### Крок 4. Увімкніть канал Teams

1. Azure Bot → **Channels**.
2. Натисніть **Microsoft Teams** → Configure → Save.
3. Прийміть Умови обслуговування.

### Крок 5. Створіть маніфест застосунку Teams

- Додайте запис `bot` із `botId = <App ID>`.
- Області: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (потрібно для обробки файлів в особистій області).
- Додайте дозволи RSC (див. [Дозволи RSC](#current-teams-rsc-permissions-manifest)).
- Створіть піктограми: `outline.png` (32x32) і `color.png` (192x192).
- Запакуйте разом у ZIP-архів `manifest.json`, `outline.png` і `color.png`.

### Крок 6. Налаштуйте OpenClaw

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

### Крок 7. Запустіть Gateway

Канал Teams запускається автоматично, коли Plugin доступний, а конфігурація `msteams` містить облікові дані.

</details>

## Федеративна автентифікація (сертифікат і керована ідентичність)

Для робочого середовища OpenClaw підтримує **федеративну автентифікацію** через `channels.msteams.authType: "federated"` як альтернативу клієнтським секретам. Доступні два методи:

### Варіант A. Автентифікація на основі сертифіката

Використовуйте сертифікат PEM, зареєстрований у реєстрації застосунку Entra ID.

**Налаштування:**

1. Згенеруйте або отримайте сертифікат (у форматі PEM із закритим ключем).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → завантажте відкритий сертифікат.

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

### Варіант B. Керована ідентичність Azure

Використовуйте керовану ідентичність Azure для автентифікації без пароля в інфраструктурі Azure (AKS, App Service, віртуальні машини Azure).

**Як це працює:**

1. Под/віртуальна машина бота має керовану ідентичність (призначену системою або користувачем).
2. Облікові дані федеративної ідентичності пов’язують керовану ідентичність із реєстрацією застосунку Entra ID.
3. Під час виконання OpenClaw використовує `@azure/identity` для отримання токенів із кінцевої точки Azure IMDS.
4. Токен передається до SDK Teams для автентифікації бота.

**Передумови:**

- Інфраструктура Azure з увімкненою керованою ідентичністю (ідентичність робочого навантаження AKS, App Service, віртуальна машина).
- Облікові дані федеративної ідентичності створено в реєстрації застосунку Entra ID.
- Мережевий доступ до IMDS (`169.254.169.254:80`) із пода/віртуальної машини.

**Конфігурація (керована ідентичність, призначена системою):**

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

**Конфігурація (керована ідентичність, призначена користувачем):** додайте `managedIdentityClientId: "<MI_CLIENT_ID>"` до наведеного вище блоку.

**Змінні середовища:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (лише для призначеної користувачем)

### Налаштування ідентичності робочого навантаження AKS

Для розгортань AKS, що використовують ідентичність робочого навантаження:

1. **Увімкніть ідентичність робочого навантаження** у своєму кластері AKS.
2. **Створіть облікові дані федеративної ідентичності** в реєстрації застосунку Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Додайте анотацію до облікового запису служби Kubernetes** з ідентифікатором клієнта застосунку:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Додайте мітку до пода** для впровадження ідентичності робочого навантаження:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Дозвольте мережевий доступ** до IMDS (`169.254.169.254`): якщо використовується NetworkPolicy, додайте правило вихідного трафіку для `169.254.169.254/32` на порту 80.

### Порівняння типів автентифікації

| Метод               | Конфігурація                                         | Переваги                               | Недоліки                                  |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Секрет клієнта**    | `appPassword`                                  | Просте налаштування                       | Потрібна ротація секрету, нижчий рівень безпеки |
| **Сертифікат**      | `authType: "federated"` + `certificatePath`    | Немає спільного секрету, що передається мережею      | Додаткові витрати на керування сертифікатами       |
| **Керована ідентичність** | `authType: "federated"` + `useManagedIdentity` | Без пароля, немає секретів для керування | Потрібна інфраструктура Azure         |

`certificateThumbprint` можна задати разом із `certificatePath`, але наразі шлях автентифікації його не зчитує; його прийнято лише для прямої сумісності.

**Типово:** якщо `authType` не задано, OpenClaw використовує автентифікацію за секретом клієнта (`appPassword`). Наявні конфігурації продовжують працювати без змін.

## Локальна розробка (тунелювання)

Teams не може підключитися до `localhost`. Використовуйте постійний тунель розробки, щоб URL-адреса залишалася незмінною між сеансами:

```bash
# Одноразове налаштування:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Кожен сеанс розробки:
devtunnel host my-openclaw-bot
```

Альтернативи: `ngrok http 3978` або `tailscale funnel 3978` (URL-адреси можуть змінюватися в кожному сеансі).

Якщо URL-адреса тунелю зміниться, оновіть кінцеву точку:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Тестування бота

**Запустіть діагностику:**

```bash
teams app doctor <teamsAppId>
```

За один прохід перевіряє реєстрацію бота, застосунок AAD, маніфест і конфігурацію SSO.

**Надішліть тестове повідомлення:**

1. Установіть застосунок Teams (посилання для встановлення з `teams app get <id> --install-link`).
2. Знайдіть бота в Teams і надішліть йому приватне повідомлення.
3. Перевірте журнали Gateway на наявність вхідної активності.

## Змінні середовища

Ці пов’язані з автентифікацією ключі конфігурації можна задати за допомогою змінних середовища замість `openclaw.json` (інші ключі конфігурації, як-от `groupPolicy` або `historyLimit`, можна задавати лише в конфігурації):

| Змінна середовища                              | Ключ конфігурації                | Примітки                               |
| ------------------------------------ | ------------------------- | ----------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                     |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                     |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                     |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` або `"federated"`         |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | федеративна + сертифікат             |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | приймається, але не потрібна для автентифікації     |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | федеративна + керована ідентичність        |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | лише керована ідентичність, призначена користувачем |

## Дія отримання відомостей про учасника

OpenClaw надає підтримувану Graph дію `member-info` для Microsoft Teams, щоб агенти й автоматизації могли отримувати перевірені відомості про склад учасників налаштованої розмови.

Вимоги:

- Дозволи RSC `ChannelSettings.Read.Group` і `TeamMember.Read.Group` (уже є в рекомендованому маніфесті).

Дія доступна щоразу, коли налаштовано облікові дані Graph; окремого перемикача `channels.msteams.actions.memberInfo` немає.
Пошук у стандартних каналах повертає відповідну ідентичність зі складу команди, відображуване ім’я, адресу електронної пошти та ролі.
У поточному приватному повідомленні або груповому чаті дія може повертати стабільний ідентифікатор довіреного відправника.
Для пошуку учасників у приватних/спільних каналах і чатах, відмінних від поточного, потрібні додаткові дозволи на доступ до складу учасників,
і типовий базовий набір дозволів відхиляє такі запити.

## Контекст історії

- `channels.msteams.historyLimit` визначає, скільки останніх повідомлень каналу/групи додається до запиту. Якщо значення не задано, використовується `messages.groupChat.historyLimit`, а потім типове значення 50. Задайте `0`, щоб вимкнути.
- Отримана історія гілки фільтрується за списками дозволених відправників (`allowFrom` / `groupAllowFrom`), тому початкове наповнення контексту гілки містить лише повідомлення від дозволених відправників.
- Контекст цитованих вкладень (розібраний із HTML схеми Skype Reply у власних вкладеннях відповіді) передається без фільтрації; наразі фільтр списку дозволених відправників застосовується лише до початкового наповнення історією гілки.
- Історію приватних повідомлень можна обмежити за допомогою `channels.msteams.dmHistoryLimit` (репліки користувача). Перевизначення для окремих користувачів: `channels.msteams.dms["<user_id>"].historyLimit`.

## Поточні дозволи RSC Teams (маніфест)

Це **наявні дозволи resourceSpecific** у маніфесті нашого застосунку Teams. Вони діють лише в команді/чаті, де встановлено застосунок.

**Для каналів (область команди):**

- `ChannelMessage.Read.Group` (Application) — отримувати всі повідомлення каналу без @згадки
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Для групових чатів:**

- `ChatMessage.Read.Chat` (Application) — отримувати всі повідомлення групового чату без @згадки

Додайте дозволи RSC за допомогою CLI Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Приклад маніфесту Teams (відредагований)

Мінімальний коректний приклад із потрібними полями. Замініть ідентифікатори та URL-адреси.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Ваша організація",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw у Teams", full: "OpenClaw у Teams" },
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

- `bots[].botId` **має** відповідати ідентифікатору застосунку Azure Bot.
- `webApplicationInfo.id` **має** відповідати ідентифікатору застосунку Azure Bot.
- `bots[].scopes` має містити поверхні, які планується використовувати (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` потрібне для обробки файлів у персональній області.
- `authorization.permissions.resourceSpecific` має містити дозволи на читання/надсилання повідомлень каналів для трафіку каналів.

### Оновлення наявного застосунку

```bash
# Завантажте, відредагуйте та повторно передайте маніфест
teams app manifest download <teamsAppId> manifest.json
# Відредагуйте manifest.json локально...
teams app manifest upload manifest.json <teamsAppId>
# Версія збільшується автоматично, якщо вміст змінився
```

Після оновлення повторно встановіть застосунок у кожній команді та **повністю завершіть роботу Teams і запустіть його знову** (не просто закрийте вікно), щоб очистити кешовані метадані застосунку.

<details>
<summary>Оновлення маніфесту вручну (без CLI)</summary>

1. Оновіть `manifest.json` новими параметрами.
2. **Збільште значення поля `version`** (наприклад, `1.0.0` → `1.1.0`).
3. **Повторно створіть ZIP-архів** маніфесту з піктограмами (`manifest.json`, `outline.png`, `color.png`).
4. Передайте новий ZIP-архів:
   - **Teams Admin Center:** Teams apps → Manage apps → find your app → Upload new version.
   - **Бічне завантаження:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## Можливості: лише RSC чи Graph

### З **лише RSC Teams** (застосунок установлено, дозволів Graph API немає)

Працює:

- Читання **текстового** вмісту повідомлень каналу.
- Надсилання **текстового** вмісту повідомлень каналу.
- Отримання файлових вкладень у **персональних повідомленнях (DM)**.

НЕ працює:

- **Вміст зображень або файлів** каналу/групи (корисне навантаження містить лише HTML-заглушку).
- Завантаження вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень поза межами поточної події Webhook.

### З **RSC Teams + дозволами застосунку Microsoft Graph**

Додається:

- Завантаження розміщеного вмісту (зображень, вставлених у повідомлення).
- Завантаження файлових вкладень, що зберігаються в SharePoint/OneDrive.
- Читання історії повідомлень каналу/чату через Graph.

### RSC і Graph API

| Можливість                    | Дозволи RSC                     | Graph API                                       |
| ----------------------------- | ------------------------------- | ----------------------------------------------- |
| **Повідомлення в реальному часі** | Так (через webhook)         | Ні (лише опитування)                            |
| **Історичні повідомлення**    | Ні                              | Так (можна запитувати історію)                  |
| **Складність налаштування**   | Лише маніфест застосунку        | Потрібна згода адміністратора + потік токенів   |
| **Працює офлайн**             | Ні (має бути запущено)          | Так (запити можна виконувати будь-коли)         |

**Підсумок:** RSC призначено для прослуховування в реальному часі, а Graph API — для доступу до історії. Щоб отримати пропущені повідомлення після роботи офлайн, потрібен Graph API з `ChannelMessage.Read.All` (потрібна згода адміністратора).

## Медіафайли та історія через Graph

Увімкніть лише ті дозволи застосунку Microsoft Graph, які потрібні для використовуваних областей Teams і даних:

1. Entra ID (Azure AD) **App Registration** → додайте Graph **Application permissions**:
   - `ChannelMessage.Read.All` для вкладень та історії каналів.
   - `Chat.Read.All` для вкладень та історії групових чатів.
   - `Files.Read.All`, коли байти вкладень потрібно завантажувати зі сховища SharePoint/OneDrive; для конфігурацій, що використовують лише історію, цей дозвіл не потрібен.
2. Надайте **Grant admin consent** для клієнта.
3. Збільште **manifest version** застосунку Teams, повторно завантажте його та **перевстановіть застосунок у Teams**.
4. **Повністю закрийте та перезапустіть Teams**, щоб очистити кешовані метадані застосунку.

### Відновлення файлів каналів/груп (`graphMediaFallback`)

Teams може видаляти позначки файлів з HTML-активності, надісланої боту. У такому разі активність Bot Framework неможливо відрізнити від звичайного HTML-повідомлення; повне посилання на вкладення існує лише в копії повідомлення у Graph.

Після надання зазначених вище дозволів увімкніть резервний механізм:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

Це стосується лише каналів і групових чатів. Додається один пошук повідомлення через Graph щоразу, коли HTML-активність не містить медіафайлів, доступних для безпосереднього завантаження, зокрема для звичайних повідомлень або повідомлень лише зі згадкою. Типове значення — `false`, тому наявні інсталяції не отримують автоматично додатковий трафік Graph або помилки дозволів.

**Згадки користувачів:** @згадки одразу працюють для користувачів, які вже беруть участь у розмові. Щоб динамічно шукати та згадувати користувачів, **яких немає в поточній розмові**, додайте дозвіл `User.Read.All` (Application) і надайте згоду адміністратора.

## Відомі обмеження

### Тайм-аути webhook

Teams доставляє повідомлення через HTTP webhook. OpenClaw застосовує до цього слухача webhook фіксовані тайм-аути HTTP-сервера: 30 с бездіяльності, 30 с на весь запит, 15 с на отримання заголовків. Необов’язкові вхідні медіафайли та збагачення контексту мають спільний бюджет у 10 секунд, але Teams SDK однаково очікує завершення ходу агента, перш ніж повернути відповідь webhook. Якщо повний хід перевищує вікно повторних спроб Teams, можуть виникнути:

- Повторні спроби надсилання повідомлення з боку Teams (що спричиняє дублікати).
- Втрачені відповіді.

Щойно агент відповідає, відповіді надсилаються проактивно, але повільні запуски агента все одно можуть спричиняти повторні спроби або дублікати на боці Teams.

### Підтримка хмари Teams і URL-адреси служби

Цей шлях Teams на основі SDK перевірено наживо для загальнодоступної хмари Microsoft Teams.

Вхідні відповіді використовують контекст ходу Teams SDK із вхідного повідомлення. Проактивні операції поза контекстом — надсилання, редагування, видалення, картки, опитування, повідомлення про згоду на доступ до файлів і відповіді тривалих завдань у черзі — використовують збережене посилання на розмову `serviceUrl`. Для загальнодоступної хмари типовим є середовище загальнодоступної хмари Teams SDK, а збережені посилання дозволено на загальнодоступному хості Teams Connector: `https://smba.trafficmanager.net/`.

Загальнодоступна хмара використовується типово. Для звичайних ботів у загальнодоступній хмарі не потрібно задавати `channels.msteams.cloud` або `channels.msteams.serviceUrl`.

Для незагальнодоступних хмар Teams задайте `cloud` і відповідну межу проактивних операцій, коли Microsoft опублікує її:

- `channels.msteams.cloud` вибирає хмарний профіль Teams SDK для автентифікації, перевірки JWT, служб токенів та області Graph.
- `channels.msteams.serviceUrl` вибирає межу кінцевої точки Bot Connector, що використовується для перевірки збережених посилань на розмови перед проактивним надсиланням, редагуванням, видаленням, надсиланням карток, опитувань, повідомлень про згоду на доступ до файлів і відповідей тривалих завдань у черзі. Це обов’язково для хмар SDK USGov і DoD. Для China/21Vianet OpenClaw використовує профіль SDK `China` і приймає збережені/налаштовані URL-адреси служби лише на хостах каналів Azure China Bot Framework.

Microsoft публікує глобальні проактивні кінцеві точки Bot Connector у розділі [Створення розмови](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) документації Teams щодо проактивного обміну повідомленнями. Використовуйте `serviceUrl` вхідної активності, якщо він доступний; інакше скористайтеся наведеною нижче таблицею Microsoft.

| Середовище Teams | Конфігурація OpenClaw                                             | Проактивний `serviceUrl`                             |
| ---------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| Public           | конфігурація cloud/serviceUrl не потрібна                         | `https://smba.trafficmanager.net/teams`                                        |
| GCC              | задайте `serviceUrl`; окремого хмарного профілю Teams SDK немає | `https://smba.infra.gcc.teams.microsoft.com/teams`                                    |
| GCC High         | `cloud: "USGov"` + `serviceUrl`                           | `https://smba.infra.gov.teams.microsoft.us/teams`                                        |
| DoD              | `cloud: "USGovDoD"` + `serviceUrl`                           | `https://smba.infra.dod.teams.microsoft.us/teams`                                        |
| China/21Vianet   | `cloud: "China"`                                                | використовуйте `serviceUrl` вхідної активності      |

Приклад для GCC, де Microsoft документує окрему URL-адресу служби проактивних операцій, але Teams SDK не надає окремого хмарного профілю GCC:

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

`channels.msteams.serviceUrl` обмежено підтримуваними хостами Microsoft Teams Bot Connector. Якщо URL-адресу служби налаштовано, OpenClaw перед виконанням проактивного надсилання, редагування, видалення, надсилання карток, опитувань або відповідей тривалих завдань у черзі перевіряє, чи використовує збережена розмова `serviceUrl` той самий хост. За типової конфігурації загальнодоступної хмари OpenClaw відмовляє в операції, якщо збережена розмова вказує за межі загальнодоступного хоста Teams Connector. Після зміни параметрів хмари/URL-адреси служби отримайте нове повідомлення з розмови, щоб збережене посилання на розмову було актуальним.

У таблиці проактивних кінцевих точок Teams від Microsoft для China/21Vianet немає окремої глобальної URL-адреси проактивного `smba`. Налаштуйте `cloud: "China"`, щоб Teams SDK використовував кінцеві точки автентифікації, токенів і JWT Azure China. Після цього для проактивного надсилання потрібне збережене посилання на розмову з вхідної активності China Teams або явно налаштована URL-адреса служби в межах каналу Azure China Bot Framework (`*.botframework.azure.cn`). Допоміжні засоби Teams на основі Graph вимкнено для `cloud: "China"`, доки OpenClaw не спрямовуватиме запити Graph через кінцеву точку Azure China Graph.

### Форматування

Markdown у Teams має більше обмежень, ніж у Slack або Discord:

- Базове форматування працює: **жирний текст**, _курсив_, `code`, посилання.
- Складний Markdown (таблиці, вкладені списки) може відображатися неправильно.
- Adaptive Cards підтримуються для опитувань і надсилання семантичних подань (див. нижче).

## Конфігурація

Основні параметри (спільні шаблони каналів див. у розділі [/gateway/configuration](/uk/gateway/configuration)):

- `channels.msteams.enabled`: увімкнути/вимкнути канал.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: облікові дані бота.
- `channels.msteams.cloud`: хмарне середовище Teams SDK (`Public`, `USGov`, `USGovDoD` або `China`; типово `Public`). Задайте за допомогою `serviceUrl` для хмар SDK USGov/DoD; для Китаю використовується попередньо налаштований профіль SDK і збережені посилання на розмови Azure China Bot Framework, а допоміжні засоби на основі Graph вимкнені, доки не буде реалізовано маршрутизацію Azure China Graph.
- `channels.msteams.serviceUrl`: межа URL-адреси служби Bot Connector для проактивних операцій SDK. Публічна хмара використовує типове значення SDK; задайте його для GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High або DoD. Для Китаю підтримуються хости каналів Azure China Bot Framework, якщо збережене посилання на розмову походить із Teams під керуванням 21Vianet.
- `channels.msteams.webhook.port` (типово `3978`).
- `channels.msteams.webhook.path` (типово `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (типово `pairing`).
- `channels.msteams.allowFrom`: список дозволених для приватних повідомлень (рекомендовано ідентифікатори об’єктів AAD). Майстер перетворює імена на ідентифікатори під час налаштування, коли доступ до Graph наявний.
- `channels.msteams.dangerouslyAllowNameMatching`: аварійний перемикач для повторного ввімкнення зіставлення за змінюваними UPN/відображуваними іменами та прямої маршрутизації за назвами команд/каналів.
- `channels.msteams.textChunkLimit`: розмір фрагмента вихідного тексту в символах (типово `4000`; жорстко обмежено значенням `4000` незалежно від вищого налаштованого значення).
- `channels.msteams.streaming.chunkMode`: `length` (типово) або `newline` для поділу за порожніми рядками (межами абзаців) перед поділом за довжиною.
- `channels.msteams.mediaAllowHosts`: список дозволених хостів вхідних вкладень (типово домени Microsoft/Teams: Graph, SharePoint/OneDrive, Teams CDN, Bot Framework, Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: список дозволених хостів для додавання заголовків Authorization під час повторних спроб отримання медіафайлів (типово хости Graph + Bot Framework).
- `channels.msteams.graphMediaFallback`: увімкнути пошук повідомлень через Graph, коли HTML каналу/групи не містить маркерів файлів (типово `false`; див. [Відновлення файлів каналу/групи](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb`: перевизначення обмеження розміру медіафайлів для окремого каналу в МБ. Якщо не задано, використовується `agents.defaults.mediaMaxMb`.
- `channels.msteams.requireMention`: вимагати @згадку в каналах/групах (типово `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (див. [Стиль відповіді](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.requireMention`: перевизначення для окремої команди.
- `channels.msteams.teams.<teamId>.tools`: типові перевизначення політики інструментів для окремої команди (`allow`/`deny`/`alsoAllow`), які використовуються за відсутності перевизначення для каналу.
- `channels.msteams.teams.<teamId>.toolsBySender`: типові перевизначення політики інструментів для окремої команди й відправника (підтримується символ узагальнення `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: перевизначення для окремого каналу.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: перевизначення політики інструментів для окремого каналу (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: перевизначення політики інструментів для окремого каналу й відправника (підтримується символ узагальнення `"*"`).
- Ключі `toolsBySender` мають використовувати явні префікси: `channel:`, `id:`, `e164:`, `username:`, `name:` (застарілі ключі без префіксів і надалі зіставляються лише з `id:`).
- `channels.msteams.authType`: тип автентифікації — `"secret"` (типово) або `"federated"`.
- `channels.msteams.certificatePath`: шлях до файлу сертифіката PEM (федеративна автентифікація + автентифікація за сертифікатом).
- `channels.msteams.certificateThumbprint`: відбиток сертифіката; приймається, але не є обов’язковим для автентифікації.
- `channels.msteams.useManagedIdentity`: увімкнути автентифікацію за допомогою керованої ідентичності (федеративний режим).
- `channels.msteams.managedIdentityClientId`: ідентифікатор клієнта для керованої ідентичності, призначеної користувачем.
- `channels.msteams.sharePointSiteId`: ідентифікатор сайту SharePoint для завантаження файлів у групових чатах/каналах (див. [Надсилання файлів у групових чатах](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: вітальна Adaptive Card, що відображається під час першого контакту в приватному повідомленні/групі, та її кнопки із запропонованими запитами.
- `channels.msteams.responsePrefix`: текст, що додається на початку вихідних відповідей.
- `channels.msteams.feedbackEnabled` (типово `true`), `channels.msteams.feedbackReflection` (типово `true`), `channels.msteams.feedbackReflectionCooldownMs`: зворотний зв’язок «подобається/не подобається» щодо відповідей і подальша рефлексія у відповідь на негативний відгук.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: підключення OAuth Bot Framework і делеговані області Graph для потоків на основі SSO; `sso.enabled: true` потребує `sso.connectionName`.

## Маршрутизація та сеанси

- Ключі сеансів відповідають стандартному формату агента (див. [/concepts/session](/uk/concepts/session)):
  - Приватні повідомлення спільно використовують основний сеанс (`agent:<agentId>:<mainKey>`).
  - Повідомлення каналів/груп використовують ідентифікатор розмови:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль відповіді: потоки чи дописи

Teams має два стилі інтерфейсу каналів поверх тієї самої базової моделі даних:

| Стиль                   | Опис                                                        | Рекомендоване значення `replyStyle` |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| **Posts** (класичний)   | Повідомлення відображаються як картки з відповідями у потоках під ними | `thread` (типово)       |
| **Threads** (як у Slack) | Повідомлення йдуть лінійно, подібно до Slack                | `top-level`              |

**Проблема:** API Teams не повідомляє, який стиль інтерфейсу використовує канал. Якщо використати неправильне значення `replyStyle`:

- `thread` у каналі зі стилем Threads → відповіді відображаються незручно вкладеними.
- `top-level` у каналі зі стилем Posts → відповіді відображаються як окремі дописи верхнього рівня замість відповідей у потоці.

**Рішення:** налаштуйте `replyStyle` окремо для кожного каналу відповідно до його конфігурації:

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

### Пріоритет визначення

Коли бот надсилає відповідь у канал, значення `replyStyle` визначається від найконкретнішого перевизначення до типового. Перемагає перше значення, відмінне від `undefined`:

1. **Для каналу** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Для команди** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Глобальне** — `channels.msteams.replyStyle`
4. **Неявне типове значення** — визначається з `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Якщо глобально задати `requireMention: false` без явного `replyStyle`, згадки в каналах зі стилем Posts відображатимуться як дописи верхнього рівня, навіть якщо вхідне повідомлення було відповіддю в потоці. Зафіксуйте `replyStyle: "thread"` на глобальному рівні, рівні команди або каналу, щоб уникнути несподіванок.

Для проактивних надсилань у збережену розмову каналу (відповіді на виклики інструментів у черзі, довготривалі агенти) застосовується таке саме визначення на рівні команди/каналу; для групових чатів і особистих розмов (приватних повідомлень) під час проактивних надсилань завжди визначається `top-level` незалежно від `replyStyle`.

### Збереження контексту потоку

Коли діє `replyStyle: "thread"` і бота згадано через @ усередині потоку каналу, OpenClaw повторно додає початковий кореневий допис потоку до посилання на вихідну розмову (`19:...@thread.tacv2;messageid=<root>`), щоб відповідь потрапила в той самий потік. Це стосується як надсилань у реальному часі (у межах поточного ходу), так і проактивних надсилань після завершення терміну дії контексту ходу Bot Framework (наприклад, довготривалих агентів і поставлених у чергу відповідей на виклики інструментів через `mcp__openclaw__message`).

Кореневий допис потоку береться зі збереженого `threadId` у посиланні на розмову. Для старіших збережених посилань, створених до появи `threadId`, резервно використовується `activityId` (вхідна активність, яка востаннє ініціалізувала розмову), тому наявні розгортання продовжують працювати без повторної ініціалізації.

Коли діє `replyStyle: "top-level"`, на вхідні повідомлення в потоках каналів навмисно надсилаються відповіді як нові дописи верхнього рівня; суфікс потоку не додається. Це правильно для каналів зі стилем Threads; якщо дописи верхнього рівня з’являються там, де очікувалися відповіді в потоці, для цього каналу неправильно задано `replyStyle`.

## Вкладення та зображення

**Поточні обмеження:**

- **Приватні повідомлення:** зображення та файлові вкладення працюють через файлові API бота Teams.
- **Канали/групи:** вкладення зберігаються в сховищі M365 (SharePoint/OneDrive). Корисне навантаження Webhook містить лише HTML-заглушку, а не фактичні байти файлу. Для завантаження вкладень із каналів **потрібні дозволи Graph API**.
- Для явного надсилання насамперед файлу використовуйте `action=upload-file` з `media` / `filePath` / `path`; необов’язковий `message` стає супровідним текстом/коментарем, а `filename` (або `title`) перевизначає ім’я завантаженого файлу.

Без дозволів Graph повідомлення каналів із зображеннями надходять лише як текст (вміст зображення недоступний боту).
Типово OpenClaw завантажує медіафайли лише з імен хостів Microsoft/Teams. Перевизначте це за допомогою `channels.msteams.mediaAllowHosts` (використовуйте `["*"]`, щоб дозволити будь-який хост).
Заголовки Authorization додаються лише для хостів у `channels.msteams.mediaAuthAllowHosts` (типово хости Graph + Bot Framework). Зберігайте цей список суворо обмеженим (уникайте суфіксів із підтримкою кількох клієнтів).

## Надсилання файлів у групових чатах

Боти можуть надсилати файли в приватних повідомленнях за допомогою вбудованого потоку FileConsentCard. **Надсилання файлів у групових чатах/каналах** потребує додаткового налаштування:

| Контекст                 | Спосіб надсилання файлів                      | Потрібне налаштування                          |
| ------------------------ | --------------------------------------------- | ---------------------------------------------- |
| **Приватні повідомлення** | FileConsentCard → користувач приймає → бот завантажує | Працює без додаткового налаштування             |
| **Групові чати/канали**  | Завантаження до SharePoint → вбудована картка файлу | Потребує `sharePointSiteId` + дозволів Graph |
| **Зображення (будь-який контекст)** | Вбудовуються з кодуванням Base64       | Працює без додаткового налаштування             |

### Чому для групових чатів потрібен SharePoint

Боти використовують ідентичність застосунку, тоді як ресурс `/me` у Microsoft Graph [потребує користувача, який увійшов у систему](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). Щоб надсилати файли в групових чатах/каналах, бот завантажує їх на **сайт SharePoint** і створює посилання для спільного доступу.

### Налаштування

1. **Додайте дозволи Graph API** в Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) — завантаження файлів до SharePoint.
   - `ChatMember.Read.All` (Application) — дозвіл із найменшими привілеями в межах усього клієнта для надсилання файлів у групових чатах. `Chat.Read.All` також працює й уже охоплює це, коли ввімкнено історію групових чатів. Як альтернативу для окремого чату використовуйте [дозвіл на згоду для конкретного ресурсу](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat`.
2. **Надайте згоду адміністратора** для клієнта.
3. **Отримайте ідентифікатор сайту SharePoint:**

   ```bash
   # Через Graph Explorer або curl із чинним токеном:
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

| Контекст і дозвіл                                                        | Поведінка спільного доступу                                           |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| Канал + `Sites.ReadWrite.All`                                         | Посилання для всієї організації (доступ має кожен в організації) |
| Груповий чат + `Sites.ReadWrite.All` + підтримуваний дозвіл на читання учасників чату | Посилання для окремих користувачів (доступ мають лише учасники чату)      |
| Груповий чат без підтримуваного дозволу на читання учасників чату                   | Надсилання безпечно завершується помилкою                                         |

Спільний доступ для окремих користувачів безпечніший, оскільки доступ до файлу мають лише учасники чату. Для групових чатів OpenClaw вимагає успішного пошуку учасників; у разі перевищення часу очікування, збоїв передавання, порожніх результатів і відмов Graph API надсилання завершується помилкою замість розширення доступу на всю організацію.

### Резервна поведінка

| Сценарій                                                         | Результат                                           |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| Груповий чат + файл + налаштовані дозволи SharePoint і учасників | Завантаження до SharePoint, надсилання нативної картки файлу    |
| Груповий чат + файл + відсутні дозволи SharePoint або учасників     | Помилка конфігурації з указівками щодо її усунення      |
| Канал + файл + налаштовано `sharePointSiteId`                   | Завантаження до SharePoint, надсилання нативної картки файлу    |
| Особистий чат + файл                                             | Потік FileConsentCard (працює без SharePoint)  |
| Будь-який контекст + зображення                                              | Вбудовані дані в кодуванні Base64 (працює без SharePoint) |

### Розташування збережених файлів

Завантажені файли зберігаються в папці `/OpenClawShared/` у стандартній бібліотеці документів налаштованого сайту SharePoint.

## Опитування (Adaptive Cards)

OpenClaw надсилає опитування Teams як Adaptive Cards (нативного API опитувань Teams немає).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- Голоси записуються Gateway до SQLite стану Plugin OpenClaw у `state/openclaw.sqlite`.
- Наявні файли `msteams-polls.json` імпортує `openclaw doctor --fix`, а не запущений Plugin.
- Gateway має залишатися в мережі для записування голосів.
- Опитування не публікують підсумки результатів автоматично, а CLI для результатів опитувань поки немає.

## Картки презентацій

Надсилайте семантичні дані презентацій користувачам або розмовам Teams за допомогою інструмента `message`, CLI або звичайного доставлення відповіді. OpenClaw відтворює їх як Teams Adaptive Cards із загального контракту презентацій.

Параметр `presentation` приймає семантичні блоки. Якщо вказано `presentation`, текст повідомлення необов’язковий. Кнопки відтворюються як дії надсилання Adaptive Card або переходу за URL-адресою. Меню вибору не є нативними для засобу відтворення Teams, тому перед доставленням OpenClaw перетворює їх на читабельний текст.

**Інструмент агента:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Вітаємо",
    blocks: [{ type: "text", text: "Вітаємо!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Вітаємо","blocks":[{"type":"text","text":"Вітаємо!"}]}'
```

Докладніше про формати цілей див. у розділі [Формати цілей](#target-formats) нижче.

## Формати цілей

Цілі MSTeams використовують префікси для розрізнення користувачів і розмов:

| Тип цілі         | Формат                           | Приклад                                                                                                |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Користувач (за ідентифікатором)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| Користувач (за іменем)      | `user:<display-name>`            | `user:John Smith` (потрібен Graph API)                                                                 |
| Група/канал       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| Група/канал (необроблений формат) | `<conversation-id>`              | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces` або ідентифікатор Bot Framework без префікса `a:`/`8:orgid:`/`29:` |

**Приклади CLI:**

```bash
# Надіслати користувачу за ідентифікатором
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Вітаємо"

# Надіслати користувачу за відображуваним ім’ям (запускає пошук через Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Вітаємо"

# Надіслати до групового чату або каналу
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Вітаємо"

# Надіслати картку презентації до розмови
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Вітаємо","blocks":[{"type":"text","text":"Вітаємо"}]}'
```

**Приклади інструмента агента:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Вітаємо!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Вітаємо",
    blocks: [{ type: "text", text: "Вітаємо" }],
  },
}
```

<Note>
Без префікса `user:` імена за замовчуванням зіставляються з групами або командами. Завжди використовуйте `user:`, коли вказуєте людей за відображуваним ім’ям.
</Note>

## Проактивне надсилання повідомлень

- Проактивні повідомлення можна надсилати лише **після** взаємодії користувача, оскільки саме тоді OpenClaw зберігає посилання на розмову.
- Відомості про `dmPolicy` і обмеження списком дозволених значень див. у розділі [/gateway/configuration](/uk/gateway/configuration).

## Ідентифікатори команди й каналу (поширена пастка)

Параметр запиту `groupId` в URL-адресах Teams — це **НЕ** ідентифікатор команди, який використовується для конфігурації. Натомість видобувайте ідентифікатори зі шляху URL-адреси:

**URL-адреса команди:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Ідентифікатор розмови команди (декодуйте з URL)
```

**URL-адреса каналу:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Ідентифікатор каналу (декодуйте з URL)
```

**Для конфігурації:**

- Ключ команди = сегмент шляху після `/team/` (декодований з URL, наприклад, `19:Bk4j...@thread.tacv2`; у старіших клієнтах може відображатися `@thread.skype`, що також є чинним).
- Ключ каналу = сегмент шляху після `/channel/` (декодований з URL).
- **Ігноруйте** параметр запиту `groupId` для маршрутизації OpenClaw. Це ідентифікатор групи Microsoft Entra, а не ідентифікатор розмови Bot Framework, що використовується у вхідних діях Teams.

## Приватні канали

Боти мають обмежену підтримку в приватних каналах:

| Функція                      | Стандартні канали | Приватні канали       |
| ---------------------------- | ----------------- | ---------------------- |
| Установлення бота             | Так               | Обмежено                |
| Повідомлення в реальному часі (Webhook) | Так               | Можуть не працювати           |
| Дозволи RSC              | Так               | Можуть діяти інакше |
| @згадки                    | Так               | Якщо бот доступний   |
| Історія Graph API            | Так               | Так (із дозволами) |

**Обхідні рішення, якщо приватні канали не працюють:**

1. Використовуйте стандартні канали для взаємодії з ботом.
2. Використовуйте особисті повідомлення; користувачі завжди можуть написати боту безпосередньо.
3. Використовуйте Graph API для доступу до історії (потрібен `ChannelMessage.Read.All`).

## Усунення несправностей

### Поширені проблеми

- **Зображення не відображаються в каналах:** відсутні дозволи Graph або згода адміністратора. Повторно встановіть застосунок Teams, повністю закрийте й знову відкрийте Teams.
- **У каналі немає відповідей:** згадки потрібні за замовчуванням; установіть `channels.msteams.requireMention=false` або налаштуйте окремо для команди чи каналу.
- **Невідповідність версій (Teams досі показує старий маніфест):** видаліть і повторно додайте застосунок, а потім повністю закрийте Teams, щоб оновити дані.
- **401 Unauthorized від Webhook:** це очікувано під час ручного тестування без Azure JWT; означає, що кінцева точка доступна, але автентифікація завершилася помилкою. Для належного тестування використовуйте Azure Web Chat.

### Помилки завантаження маніфесту

- **"Icon file cannot be empty":** маніфест посилається на файли піктограм розміром 0 байтів. Створіть чинні PNG-піктограми (32x32 для `outline.png`, 192x192 для `color.png`).
- **"webApplicationInfo.Id already in use":** застосунок досі встановлено в іншій команді або чаті. Спочатку знайдіть і видаліть його або зачекайте 5-10 хвилин на поширення змін.
- **"Something went wrong" під час завантаження:** натомість завантажте через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), відкрийте DevTools браузера (F12) → вкладку Network і перевірте тіло відповіді, щоб побачити фактичну помилку.
- **Не вдається завантаження неопублікованого застосунку:** спробуйте "Upload an app to your org's app catalog" замість "Upload a custom app"; це часто дає змогу обійти обмеження на завантаження неопублікованих застосунків.

### Дозволи RSC не працюють

1. Переконайтеся, що `webApplicationInfo.id` точно відповідає App ID вашого бота.
2. Повторно завантажте застосунок і встановіть його в команді або чаті.
3. Перевірте, чи адміністратор організації не заблокував дозволи RSC.
4. Переконайтеся, що використовується правильна область: `ChannelMessage.Read.Group` для команд, `ChatMessage.Read.Chat` для групових чатів.

## Посилання

- [Створення Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) — посібник із налаштування Azure Bot
- [Портал розробника Teams](https://dev.teams.microsoft.com/apps) — створення застосунків Teams і керування ними
- [Схема маніфесту застосунку Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Отримання повідомлень каналу за допомогою RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Довідник дозволів RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Оброблення файлів ботом Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для каналу або групи потрібен Graph)
- [Проактивне надсилання повідомлень](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) — Teams CLI для керування ботами

## Пов’язані матеріали

- [Огляд каналів](/uk/channels) - усі підтримувані канали
- [Сполучення](/uk/channels/pairing) - автентифікація в особистих повідомленнях і процес сполучення
- [Групи](/uk/channels/groups) - поведінка групових чатів і обмеження за згадуванням
- [Маршрутизація каналів](/uk/channels/channel-routing) - маршрутизація сеансів для повідомлень
- [Безпека](/uk/gateway/security) - модель доступу та посилення захисту
