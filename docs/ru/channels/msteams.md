---
read_when:
    - Работа над функциями канала Microsoft Teams
summary: Состояние поддержки бота Microsoft Teams, возможности и конфигурация
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-28T22:35:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

Статус: поддерживаются текст и вложения в личных сообщениях; отправка файлов в канал/группу требует `sharePointSiteId` + разрешения Graph (см. [Отправка файлов в групповые чаты](#sending-files-in-group-chats)). Опросы отправляются через Adaptive Cards. Действия с сообщениями предоставляют явное `upload-file` для отправок, где файл идет первым.

## Встроенный plugin

Microsoft Teams поставляется как встроенный plugin в текущих выпусках OpenClaw, поэтому в обычной пакетной сборке отдельная установка не требуется.

Если вы используете более старую сборку или пользовательскую установку, которая исключает встроенный Teams, установите npm-пакет напрямую:

```bash
openclaw plugins install @openclaw/msteams
```

Используйте пакет без версии, чтобы следовать текущему официальному тегу выпуска. Закрепляйте точную версию только тогда, когда вам нужна воспроизводимая установка.

Локальный checkout (при запуске из git-репозитория):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Подробности: [Plugins](/ru/tools/plugin)

## Быстрая настройка

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) выполняет регистрацию бота, создание манифеста и генерацию учетных данных одной командой.

**1. Установите и войдите**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
Teams CLI сейчас находится в preview. Команды и флаги могут меняться между выпусками.
</Note>

**2. Запустите туннель** (Teams не может обращаться к localhost)

Установите и аутентифицируйте devtunnel CLI, если еще не сделали этого ([руководство по началу работы](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` требуется, потому что Teams не может аутентифицироваться через devtunnels. Каждый входящий запрос бота все равно автоматически проверяется Teams SDK.
</Note>

Альтернативы: `ngrok http 3978` или `tailscale funnel 3978` (но они могут менять URL в каждом сеансе).

**3. Создайте приложение**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Эта одна команда:

- Создает приложение Entra ID (Azure AD)
- Генерирует клиентский секрет
- Собирает и загружает манифест приложения Teams (с иконками)
- Регистрирует бота (по умолчанию управляется Teams - подписка Azure не нужна)

В выводе будут показаны `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` и **Teams App ID** - запишите их для следующих шагов. Также будет предложено установить приложение напрямую в Teams.

**4. Настройте OpenClaw** с помощью учетных данных из вывода:

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

Или используйте переменные окружения напрямую: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Установите приложение в Teams**

`teams app create` предложит установить приложение - выберите "Install in Teams". Если вы пропустили этот шаг, ссылку можно получить позже:

```bash
teams app get <teamsAppId> --install-link
```

**6. Проверьте, что все работает**

```bash
teams app doctor <teamsAppId>
```

Эта команда запускает диагностику регистрации бота, конфигурации приложения AAD, корректности манифеста и настройки SSO.

Для production-развертываний рассмотрите использование [федеративной аутентификации](/ru/channels/msteams#federated-authentication-certificate-plus-managed-identity) (сертификат или managed identity) вместо клиентских секретов.

<Note>
Групповые чаты по умолчанию заблокированы (`channels.msteams.groupPolicy: "allowlist"`). Чтобы разрешить ответы в группах, задайте `channels.msteams.groupAllowFrom` или используйте `groupPolicy: "open"`, чтобы разрешить любого участника (с обязательным упоминанием).
</Note>

## Цели

- Общаться с OpenClaw через личные сообщения Teams, групповые чаты или каналы.
- Сохранять детерминированную маршрутизацию: ответы всегда возвращаются в тот канал, откуда пришли.
- По умолчанию использовать безопасное поведение канала (упоминания обязательны, если не настроено иначе).

## Запись конфигурации

По умолчанию Microsoft Teams разрешено записывать обновления конфигурации, вызванные `/config set|unset` (требует `commands.config: true`).

Отключить:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Контроль доступа (личные сообщения + группы)

**Доступ к личным сообщениям**

- По умолчанию: `channels.msteams.dmPolicy = "pairing"`. Неизвестные отправители игнорируются до одобрения.
- `channels.msteams.allowFrom` должен использовать стабильные object ID AAD или статические группы доступа отправителей, такие как `accessGroup:core-team`.
- Не полагайтесь на сопоставление UPN/отображаемого имени для allowlist - они могут измениться. OpenClaw по умолчанию отключает прямое сопоставление имен; включайте его явно через `channels.msteams.dangerouslyAllowNameMatching: true`.
- Мастер может разрешать имена в ID через Microsoft Graph, если учетные данные позволяют.

**Доступ групп**

- По умолчанию: `channels.msteams.groupPolicy = "allowlist"` (заблокировано, если не добавить `groupAllowFrom`). Используйте `channels.defaults.groupPolicy`, чтобы переопределить значение по умолчанию, когда оно не задано.
- `channels.msteams.groupAllowFrom` управляет тем, какие отправители или статические группы доступа отправителей могут запускать действия в групповых чатах/каналах (с fallback к `channels.msteams.allowFrom`).
- Задайте `groupPolicy: "open"`, чтобы разрешить любого участника (по умолчанию все еще требуется упоминание).
- Чтобы не разрешать **никакие каналы**, задайте `channels.msteams.groupPolicy: "disabled"`.

Пример:

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

**Teams + allowlist каналов**

- Ограничивайте ответы групп/каналов, перечисляя команды и каналы в `channels.msteams.teams`.
- Ключи должны использовать стабильные ID бесед Teams из ссылок Teams, а не изменяемые отображаемые имена.
- Когда `groupPolicy="allowlist"` и присутствует allowlist команд, принимаются только перечисленные команды/каналы (с обязательным упоминанием).
- Мастер настройки принимает записи `Team/Channel` и сохраняет их за вас.
- При запуске OpenClaw разрешает имена team/channel и пользовательские имена allowlist в ID (когда разрешения Graph позволяют)
  и логирует сопоставление; неразрешенные имена team/channel сохраняются как введены, но по умолчанию игнорируются при маршрутизации, если не включено `channels.msteams.dangerouslyAllowNameMatching: true`.

Пример:

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
<summary><strong>Ручная настройка (без Teams CLI)</strong></summary>

Если вы не можете использовать Teams CLI, можно настроить бота вручную через Azure Portal.

### Как это работает

1. Убедитесь, что plugin Microsoft Teams доступен (встроен в текущие выпуски).
2. Создайте **Azure Bot** (App ID + секрет + tenant ID).
3. Соберите **пакет приложения Teams**, который ссылается на бота и включает разрешения RSC ниже.
4. Загрузите/установите приложение Teams в команду (или в личную область для личных сообщений).
5. Настройте `msteams` в `~/.openclaw/openclaw.json` (или env vars) и запустите Gateway.
6. Gateway по умолчанию слушает Webhook-трафик Bot Framework на `/api/messages`.

### Шаг 1: Создайте Azure Bot

1. Перейдите к [созданию Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Заполните вкладку **Basics**:

   | Поле              | Значение                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Имя вашего бота, например `openclaw-msteams` (должно быть уникальным) |
   | **Subscription**   | Выберите вашу подписку Azure                           |
   | **Resource group** | Создайте новую или используйте существующую                               |
   | **Pricing tier**   | **Free** для разработки/тестирования                                 |
   | **Type of App**    | **Single Tenant** (рекомендуется - см. примечание ниже)         |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
Создание новых мультитенантных ботов было прекращено после 2025-07-31. Используйте **Single Tenant** для новых ботов.
</Warning>

3. Нажмите **Review + create** → **Create** (подождите ~1-2 минуты)

### Шаг 2: Получите учетные данные

1. Перейдите к вашему ресурсу Azure Bot → **Configuration**
2. Скопируйте **Microsoft App ID** → это ваш `appId`
3. Нажмите **Manage Password** → перейдите в App Registration
4. В разделе **Certificates & secrets** → **New client secret** → скопируйте **Value** → это ваш `appPassword`
5. Перейдите в **Overview** → скопируйте **Directory (tenant) ID** → это ваш `tenantId`

### Шаг 3: Настройте Messaging Endpoint

1. В Azure Bot → **Configuration**
2. Установите **Messaging endpoint** в URL вашего Webhook:
   - Production: `https://your-domain.com/api/messages`
   - Локальная разработка: используйте туннель (см. [Локальная разработка](#local-development-tunneling) ниже)

### Шаг 4: Включите канал Teams

1. В Azure Bot → **Channels**
2. Нажмите **Microsoft Teams** → Configure → Save
3. Примите Terms of Service

### Шаг 5: Соберите манифест приложения Teams

- Включите запись `bot` с `botId = <App ID>`.
- Области: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (требуется для обработки файлов в личной области).
- Добавьте разрешения RSC (см. [Разрешения RSC](#current-teams-rsc-permissions-manifest)).
- Создайте иконки: `outline.png` (32x32) и `color.png` (192x192).
- Заархивируйте все три файла вместе: `manifest.json`, `outline.png`, `color.png`.

### Шаг 6: Настройте OpenClaw

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

Переменные окружения: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Шаг 7: Запустите Gateway

Канал Teams запускается автоматически, когда plugin доступен и существует конфигурация `msteams` с учетными данными.

</details>

## Федеративная аутентификация (сертификат плюс managed identity)

> Добавлено в 2026.4.11

Для production-развертываний OpenClaw поддерживает **федеративную аутентификацию** как более безопасную альтернативу клиентским секретам. Доступны два метода:

### Вариант A: Аутентификация на основе сертификата

Используйте PEM-сертификат, зарегистрированный в регистрации приложения Entra ID.

**Настройка:**

1. Сгенерируйте или получите сертификат (формат PEM с приватным ключом).
2. В Entra ID → App Registration → **Certificates & secrets** → **Certificates** → загрузите публичный сертификат.

**Конфигурация:**

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

### Вариант B: Azure Managed Identity

Используйте Azure Managed Identity для аутентификации без пароля. Это идеально для развертываний в инфраструктуре Azure (AKS, App Service, Azure VMs), где доступна managed identity.

**Как это работает:**

1. У pod/VM бота есть managed identity (назначенная системой или назначенная пользователем).
2. **Federated identity credential** связывает managed identity с регистрацией приложения Entra ID.
3. Во время выполнения OpenClaw использует `@azure/identity`, чтобы получать токены из Azure IMDS endpoint (`169.254.169.254`).
4. Токен передается в Teams SDK для аутентификации бота.

**Предварительные требования:**

- Инфраструктура Azure с включенной managed identity (AKS workload identity, App Service, VM)
- Federated identity credential, созданный в регистрации приложения Entra ID
- Сетевой доступ к IMDS (`169.254.169.254:80`) из pod/VM

**Конфигурация (system-assigned managed identity):**

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

**Конфигурация (управляемое удостоверение, назначенное пользователем):**

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

**Переменные окружения:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (только для назначенного пользователем)

### Настройка AKS Workload Identity

Для развертываний AKS с использованием Workload Identity:

1. **Включите Workload Identity** в кластере AKS.
2. **Создайте учетные данные федеративного удостоверения** в регистрации приложения Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Добавьте аннотацию к сервисной учетной записи Kubernetes** с идентификатором клиента приложения:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Добавьте метку к pod** для внедрения Workload Identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Убедитесь, что есть сетевой доступ** к IMDS (`169.254.169.254`) - если используется NetworkPolicy, добавьте правило исходящего трафика, разрешающее трафик к `169.254.169.254/32` на порту 80.

### Сравнение типов аутентификации

| Метод                         | Конфигурация                                  | Плюсы                                    | Минусы                                           |
| ----------------------------- | --------------------------------------------- | ---------------------------------------- | ------------------------------------------------ |
| **Секрет клиента**            | `appPassword`                                 | Простая настройка                        | Требуется ротация секрета, менее безопасно       |
| **Сертификат**                | `authType: "federated"` + `certificatePath`   | Нет общего секрета, передаваемого по сети | Дополнительные затраты на управление сертификатами |
| **Управляемое удостоверение** | `authType: "federated"` + `useManagedIdentity` | Без паролей, нет секретов для управления | Требуется инфраструктура Azure                   |

**Поведение по умолчанию:** Если `authType` не задан, OpenClaw по умолчанию использует аутентификацию с секретом клиента. Существующие конфигурации продолжают работать без изменений.

## Локальная разработка (туннелирование)

Teams не может обращаться к `localhost`. Используйте постоянный туннель для разработки, чтобы URL оставался одинаковым между сеансами:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Альтернативы: `ngrok http 3978` или `tailscale funnel 3978` (URL могут меняться в каждом сеансе).

Если URL туннеля изменился, обновите конечную точку:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Тестирование бота

**Запустите диагностику:**

```bash
teams app doctor <teamsAppId>
```

Проверяет регистрацию бота, приложение AAD, манифест и конфигурацию SSO за один проход.

**Отправьте тестовое сообщение:**

1. Установите приложение Teams (используйте ссылку установки из `teams app get <id> --install-link`)
2. Найдите бота в Teams и отправьте личное сообщение
3. Проверьте журналы Gateway на наличие входящей активности

## Переменные окружения

Все ключи конфигурации можно задать через переменные окружения:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (необязательно: `"secret"` или `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (федеративная аутентификация + сертификат)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (необязательно, не требуется для аутентификации)
- `MSTEAMS_USE_MANAGED_IDENTITY` (федеративная аутентификация + управляемое удостоверение)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (только MI, назначенное пользователем)

## Действие сведений об участнике

OpenClaw предоставляет действие `member-info` на базе Graph для Microsoft Teams, чтобы агенты и автоматизации могли получать сведения об участниках канала (отображаемое имя, email, роль) напрямую из Microsoft Graph.

Требования:

- Разрешение RSC `Member.Read.Group` (уже включено в рекомендуемый манифест)
- Для поиска между командами: разрешение приложения Graph `User.Read.All` с согласием администратора

Действие ограничивается настройкой `channels.msteams.actions.memberInfo` (по умолчанию: включено, когда доступны учетные данные Graph).

## Контекст истории

- `channels.msteams.historyLimit` управляет тем, сколько недавних сообщений канала/группы добавляется в промпт.
- Используется резервное значение `messages.groupChat.historyLimit`. Установите `0`, чтобы отключить (по умолчанию 50).
- Полученная история треда фильтруется по спискам разрешенных отправителей (`allowFrom` / `groupAllowFrom`), поэтому начальное заполнение контекста треда включает только сообщения от разрешенных отправителей.
- Контекст цитированных вложений (`ReplyTo*`, полученный из HTML ответа Teams) сейчас передается как получен.
- Иными словами, списки разрешений определяют, кто может запускать агента; на сегодня фильтруются только отдельные пути дополнительного контекста.
- Историю личных сообщений можно ограничить через `channels.msteams.dmHistoryLimit` (ходы пользователя). Переопределения для отдельных пользователей: `channels.msteams.dms["<user_id>"].historyLimit`.

## Текущие разрешения Teams RSC (манифест)

Это **существующие разрешения resourceSpecific** в манифесте нашего приложения Teams. Они применяются только внутри команды/чата, где установлено приложение.

**Для каналов (область команды):**

- `ChannelMessage.Read.Group` (Application) - получать все сообщения канала без @упоминания
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Для групповых чатов:**

- `ChatMessage.Read.Chat` (Application) - получать все сообщения группового чата без @упоминания

Чтобы добавить разрешения RSC через Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Пример манифеста Teams (с редактированными данными)

Минимальный действительный пример с обязательными полями. Замените идентификаторы и URL.

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

### Особенности манифеста (обязательные поля)

- `bots[].botId` **должен** совпадать с Azure Bot App ID.
- `webApplicationInfo.id` **должен** совпадать с Azure Bot App ID.
- `bots[].scopes` должен включать поверхности, которые вы планируете использовать (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` требуется для обработки файлов в личной области.
- `authorization.permissions.resourceSpecific` должен включать чтение/отправку канала, если нужен трафик канала.

### Обновление существующего приложения

Чтобы обновить уже установленное приложение Teams (например, добавить разрешения RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

После обновления переустановите приложение в каждой команде, чтобы новые разрешения вступили в силу, и **полностью завершите работу Teams и запустите его заново** (не просто закройте окно), чтобы очистить кэшированные метаданные приложения.

<details>
<summary>Ручное обновление манифеста (без CLI)</summary>

1. Обновите `manifest.json` новыми настройками
2. **Увеличьте поле `version`** (например, `1.0.0` → `1.1.0`)
3. **Заново упакуйте в zip** манифест с иконками (`manifest.json`, `outline.png`, `color.png`)
4. Загрузите новый zip:
   - **Teams Admin Center:** приложения Teams → Управление приложениями → найдите свое приложение → Загрузить новую версию
   - **Sideload:** в Teams → Приложения → Управление приложениями → Загрузить пользовательское приложение

</details>

## Возможности: только RSC или Graph

### С **только Teams RSC** (приложение установлено, разрешений Graph API нет)

Работает:

- Чтение **текстового** содержимого сообщений канала.
- Отправка **текстового** содержимого сообщений канала.
- Получение файловых вложений в **личных сообщениях (DM)**.

Не работает:

- **Содержимое изображений или файлов** в каналах/группах (полезная нагрузка включает только HTML-заглушку).
- Скачивание вложений, хранящихся в SharePoint/OneDrive.
- Чтение истории сообщений (помимо события Webhook в реальном времени).

### С **Teams RSC + разрешениями приложения Microsoft Graph**

Добавляет:

- Скачивание размещенного содержимого (изображений, вставленных в сообщения).
- Скачивание файловых вложений, хранящихся в SharePoint/OneDrive.
- Чтение истории сообщений канала/чата через Graph.

### RSC и Graph API

| Возможность                       | Разрешения RSC        | Graph API                                      |
| --------------------------------- | --------------------- | ---------------------------------------------- |
| **Сообщения в реальном времени**  | Да (через Webhook)    | Нет (только опрос)                             |
| **Исторические сообщения**        | Нет                   | Да (можно запрашивать историю)                 |
| **Сложность настройки**           | Только манифест приложения | Требуется согласие администратора + поток токенов |
| **Работает офлайн**               | Нет (должно быть запущено) | Да (запрос в любое время)                    |

**Итог:** RSC предназначен для прослушивания в реальном времени; Graph API - для доступа к истории. Чтобы наверстать пропущенные сообщения во время офлайна, нужен Graph API с `ChannelMessage.Read.All` (требуется согласие администратора).

## Медиа и история с поддержкой Graph (обязательно для каналов)

Если вам нужны изображения/файлы в **каналах** или нужно получать **историю сообщений**, необходимо включить разрешения Microsoft Graph и предоставить согласие администратора.

1. В **регистрации приложения** Entra ID (Azure AD) добавьте **разрешения приложения** Microsoft Graph:
   - `ChannelMessage.Read.All` (вложения канала + история)
   - `Chat.Read.All` или `ChatMessage.Read.All` (групповые чаты)
2. **Предоставьте согласие администратора** для тенанта.
3. Увеличьте **версию манифеста** приложения Teams, загрузите его заново и **переустановите приложение в Teams**.
4. **Полностью завершите работу Teams и запустите его заново**, чтобы очистить кэшированные метаданные приложения.

**Дополнительное разрешение для упоминаний пользователей:** @упоминания пользователей работают из коробки для пользователей в беседе. Однако если вы хотите динамически искать и упоминать пользователей, которые **не находятся в текущей беседе**, добавьте разрешение `User.Read.All` (Application) и предоставьте согласие администратора.

## Известные ограничения

### Тайм-ауты Webhook

Teams доставляет сообщения через HTTP Webhook. Если обработка занимает слишком много времени (например, медленные ответы LLM), вы можете увидеть:

- Тайм-ауты Gateway
- Повторную отправку сообщения Teams (вызывает дубликаты)
- Потерянные ответы

OpenClaw обрабатывает это, быстро возвращая управление и отправляя ответы проактивно, но очень медленные ответы все равно могут вызывать проблемы.

### Поддержка облака Teams и URL службы

Этот путь Teams на базе SDK прошел live-валидацию для общедоступного облака Microsoft Teams.

Входящие ответы используют входящий контекст turn из Teams SDK. Вне контекста проактивные операции - отправки, редактирования, удаления, карточки, опросы, сообщения согласия на файлы и поставленные в очередь долгие ответы - используют сохраненный `serviceUrl` ссылки на беседу. Общедоступное облако по умолчанию использует среду общедоступного облака Teams SDK и разрешает сохраненные ссылки на общедоступном хосте Teams Connector: `https://smba.trafficmanager.net/`.

Общедоступное облако используется по умолчанию. Для обычных ботов в общедоступном облаке не нужно задавать `channels.msteams.cloud` или `channels.msteams.serviceUrl`.

Для необщедоступных облаков Teams задайте `cloud` и соответствующую проактивную границу, когда Microsoft ее опубликует:

- `channels.msteams.cloud` выбирает облачный пресет Teams SDK для аутентификации, проверки JWT, служб токенов и области Graph.
- `channels.msteams.serviceUrl` выбирает границу конечной точки Bot Connector, используемую для проверки сохраненных ссылок на беседу перед проактивными отправками, редактированиями, удалениями, карточками, опросами, сообщениями согласия на файлы и поставленными в очередь долгими ответами. Она обязательна для облаков SDK USGov и DoD. Для China/21Vianet OpenClaw использует пресет SDK `China` и принимает сохраненные/настроенные URL служб только на хостах каналов Azure China Bot Framework.

Microsoft публикует глобальные проактивные конечные точки Bot Connector в разделе [Создание беседы](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) документации Teams по проактивным сообщениям. Используйте `serviceUrl` входящей активности, когда он доступен; если нужна глобальная проактивная конечная точка, используйте таблицу Microsoft.

| Среда Teams       | Конфигурация OpenClaw                                      | Проактивный `serviceUrl`                         |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Public            | конфигурация cloud/serviceUrl не нужна                      | `https://smba.trafficmanager.net/teams`            |
| GCC               | задайте `serviceUrl`; отдельного облачного пресета Teams SDK нет | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | используйте `serviceUrl` входящей активности       |

Пример для GCC, где Microsoft документирует отдельный проактивный URL службы, но Teams SDK не предоставляет отдельный облачный пресет GCC:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

Пример для GCC High:

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

`channels.msteams.serviceUrl` ограничен поддерживаемыми хостами Microsoft Teams Bot Connector. Когда URL службы настроен, OpenClaw перед проактивными отправками, редактированиями, удалениями, карточками, опросами или поставленными в очередь долгими ответами проверяет, что сохраненный `serviceUrl` беседы использует тот же хост. С конфигурацией общедоступного облака по умолчанию OpenClaw закрывается с ошибкой, если сохраненная беседа указывает за пределы общедоступного хоста Teams Connector. После изменения настроек cloud/service URL получите новое сообщение из беседы, чтобы сохраненная ссылка на беседу была актуальной.

China/21Vianet не имеет отдельного глобального проактивного URL `smba` в таблице проактивных конечных точек Teams от Microsoft. Настройте `cloud: "China"`, чтобы Teams SDK использовал конечные точки аутентификации, токенов и JWT Azure China. После этого проактивные отправки требуют сохраненной ссылки на беседу из входящей активности China Teams или явно настроенного URL службы на границе канала Azure China Bot Framework (`*.botframework.azure.cn`). Вспомогательные функции Teams на базе Graph сейчас отключены для `cloud: "China"`, пока OpenClaw не маршрутизирует запросы Graph через конечную точку Azure China Graph.

### Форматирование

Markdown в Teams более ограничен, чем в Slack или Discord:

- Базовое форматирование работает: **жирный**, _курсив_, `code`, ссылки
- Сложный markdown (таблицы, вложенные списки) может отображаться некорректно
- Adaptive Cards поддерживаются для опросов и семантических отправок представления (см. ниже)

## Конфигурация

Ключевые настройки (см. `/gateway/configuration` для общих шаблонов каналов):

- `channels.msteams.enabled`: включить/отключить канал.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: учетные данные бота.
- `channels.msteams.cloud`: облачная среда Teams SDK (`Public`, `USGov`, `USGovDoD` или `China`; по умолчанию `Public`). Задавайте это вместе с `serviceUrl` для облаков SDK USGov/DoD; China использует пресет SDK и сохраненные ссылки на беседы Azure China Bot Framework, а вспомогательные функции на базе Graph отключены, пока не будет реализована маршрутизация Azure China Graph.
- `channels.msteams.serviceUrl`: граница URL службы Bot Connector для проактивных операций SDK. Общедоступное облако использует значение SDK по умолчанию; задайте это для GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High или DoD. China принимает хосты каналов Azure China Bot Framework, когда сохраненная ссылка на беседу приходит из Teams, управляемого 21Vianet.
- `channels.msteams.webhook.port` (по умолчанию `3978`)
- `channels.msteams.webhook.path` (по умолчанию `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (по умолчанию: pairing)
- `channels.msteams.allowFrom`: список разрешений для личных сообщений (рекомендуются object ID AAD). Мастер во время настройки преобразует имена в ID, когда доступен Graph.
- `channels.msteams.dangerouslyAllowNameMatching`: аварийный переключатель для повторного включения сопоставления по изменяемому UPN/отображаемому имени и прямой маршрутизации по имени команды/канала.
- `channels.msteams.textChunkLimit`: размер фрагмента исходящего текста.
- `channels.msteams.chunkMode`: `length` (по умолчанию) или `newline`, чтобы разбивать по пустым строкам (границам абзацев) перед разбиением по длине.
- `channels.msteams.mediaAllowHosts`: список разрешенных хостов для входящих вложений (по умолчанию домены Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: список разрешенных хостов для добавления заголовков Authorization при повторных попытках загрузки медиа (по умолчанию хосты Graph + Bot Framework).
- `channels.msteams.requireMention`: требовать @упоминание в каналах/группах (по умолчанию true).
- `channels.msteams.replyStyle`: `thread | top-level` (см. [Стиль ответа](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: переопределение для отдельной команды.
- `channels.msteams.teams.<teamId>.requireMention`: переопределение для отдельной команды.
- `channels.msteams.teams.<teamId>.tools`: переопределения политики инструментов по умолчанию для отдельной команды (`allow`/`deny`/`alsoAllow`), используемые, когда переопределение канала отсутствует.
- `channels.msteams.teams.<teamId>.toolsBySender`: переопределения политики инструментов по отправителю по умолчанию для отдельной команды (поддерживается wildcard `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: переопределение для отдельного канала.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: переопределение для отдельного канала.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: переопределения политики инструментов для отдельного канала (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: переопределения политики инструментов по отправителю для отдельного канала (поддерживается wildcard `"*"`).
- Ключи `toolsBySender` должны использовать явные префиксы:
  `channel:`, `id:`, `e164:`, `username:`, `name:` (устаревшие ключи без префикса по-прежнему сопоставляются только с `id:`).
- `channels.msteams.actions.memberInfo`: включить или отключить действие сведений об участнике на базе Graph (по умолчанию включено, когда доступны учетные данные Graph).
- `channels.msteams.authType`: тип аутентификации - `"secret"` (по умолчанию) или `"federated"`.
- `channels.msteams.certificatePath`: путь к PEM-файлу сертификата (federated + certificate auth).
- `channels.msteams.certificateThumbprint`: отпечаток сертификата (необязательно, не требуется для аутентификации).
- `channels.msteams.useManagedIdentity`: включить аутентификацию managed identity (режим federated).
- `channels.msteams.managedIdentityClientId`: client ID для назначаемого пользователем managed identity.
- `channels.msteams.sharePointSiteId`: ID сайта SharePoint для загрузки файлов в групповых чатах/каналах (см. [Отправка файлов в групповых чатах](#sending-files-in-group-chats)).

## Маршрутизация и сеансы

- Ключи сеансов следуют стандартному формату агента (см. [/concepts/session](/ru/concepts/session)):
  - Личные сообщения используют общий основной сеанс (`agent:<agentId>:<mainKey>`).
  - Сообщения каналов/групп используют id беседы:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль ответа: потоки или публикации

Teams недавно ввел два стиля UI каналов поверх одной и той же базовой модели данных:

| Стиль                    | Описание                                                   | Рекомендуемый `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Публикации** (классический) | Сообщения отображаются как карточки с цепочками ответов под ними | `thread` (по умолчанию) |
| **Потоки** (как в Slack) | Сообщения идут линейно, больше похоже на Slack             | `top-level`              |

**Проблема:** API Teams не раскрывает, какой стиль UI использует канал. Если использовать неправильный `replyStyle`:

- `thread` в канале со стилем Threads → ответы выглядят неудачно вложенными
- `top-level` в канале со стилем Posts → ответы отображаются как отдельные публикации верхнего уровня, а не внутри потока

**Решение:** Настройте `replyStyle` для каждого канала в зависимости от того, как настроен канал:

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

### Приоритет разрешения

Когда бот отправляет ответ в канал, `replyStyle` определяется от самого конкретного переопределения к значению по умолчанию. Побеждает первое значение, не равное `undefined`:

1. **Для канала** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Для команды** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Глобально** — `channels.msteams.replyStyle`
4. **Неявное значение по умолчанию** — выводится из `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Если задать `requireMention: false` глобально без явного `replyStyle`, упоминания в каналах со стилем Posts будут появляться как публикации верхнего уровня, даже когда входящее сообщение было ответом в потоке. Закрепите `replyStyle: "thread"` на глобальном уровне, уровне команды или канала, чтобы избежать неожиданностей.

### Сохранение контекста потока

Когда действует `replyStyle: "thread"` и бот был @упомянут внутри потока канала, OpenClaw повторно привязывает исходный корень потока к исходящей ссылке на беседу (`19:…@thread.tacv2;messageid=<root>`), чтобы ответ попал в тот же поток. Это работает как для live-отправок (внутри turn), так и для проактивных отправок после истечения контекста turn Bot Framework (например, долгие агенты, поставленные в очередь ответы на вызовы инструментов через `mcp__openclaw__message`).

Корень потока берется из сохраненного `threadId` в ссылке на беседу. Более старые сохраненные ссылки, появившиеся до `threadId`, используют fallback на `activityId` (любой входящей активности, которая последней инициализировала беседу), поэтому существующие развертывания продолжают работать без повторного заполнения.

Когда действует `replyStyle: "top-level"`, входящие сообщения из каналов с тредами намеренно получают ответ как новые публикации верхнего уровня — суффикс треда не добавляется. Это корректное поведение для каналов в стиле Threads; если вы видите публикации верхнего уровня там, где ожидали ответы в треде, значит `replyStyle` для этого канала настроен неверно.

## Вложения и изображения

**Текущие ограничения:**

- **Личные сообщения:** изображения и файловые вложения работают через файловые API бота Teams.
- **Каналы/группы:** вложения находятся в хранилище M365 (SharePoint/OneDrive). Полезная нагрузка webhook содержит только HTML-заглушку, а не фактические байты файла. **Для скачивания вложений канала требуются разрешения Graph API**.
- Для явной отправки, где файл идет первым, используйте `action=upload-file` с `media` / `filePath` / `path`; необязательный `message` становится сопроводительным текстом/комментарием, а `filename` переопределяет имя загруженного файла.

Без разрешений Graph сообщения канала с изображениями будут получаться только как текст (содержимое изображения недоступно боту).
По умолчанию OpenClaw скачивает медиа только с имен хостов Microsoft/Teams. Переопределите это через `channels.msteams.mediaAllowHosts` (используйте `["*"]`, чтобы разрешить любой хост).
Заголовки авторизации добавляются только для хостов из `channels.msteams.mediaAuthAllowHosts` (по умолчанию это хосты Graph + Bot Framework). Держите этот список строгим (избегайте многоарендных суффиксов).

## Отправка файлов в групповые чаты

Боты могут отправлять файлы в личных сообщениях через поток FileConsentCard (встроенный). Однако **отправка файлов в групповые чаты/каналы** требует дополнительной настройки:

| Контекст                 | Как отправляются файлы                         | Требуемая настройка                              |
| ------------------------ | ---------------------------------------------- | ----------------------------------------------- |
| **Личные сообщения**     | FileConsentCard → пользователь принимает → бот загружает | Работает из коробки                             |
| **Групповые чаты/каналы** | Загрузка в SharePoint → ссылка общего доступа | Требуются `sharePointSiteId` + разрешения Graph |
| **Изображения (любой контекст)** | Встроенное кодирование Base64                 | Работает из коробки                             |

### Почему для групповых чатов нужен SharePoint

У ботов нет личного диска OneDrive (конечная точка Graph API `/me/drive` не работает для удостоверений приложений). Чтобы отправлять файлы в групповые чаты/каналы, бот загружает их на **сайт SharePoint** и создает ссылку общего доступа.

### Настройка

1. **Добавьте разрешения Graph API** в Entra ID (Azure AD) → регистрация приложения:
   - `Sites.ReadWrite.All` (Application) - загрузка файлов в SharePoint
   - `Chat.Read.All` (Application) - необязательно, включает ссылки общего доступа для отдельных пользователей

2. **Предоставьте согласие администратора** для арендатора.

3. **Получите ID сайта SharePoint:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Настройте OpenClaw:**

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

### Поведение общего доступа

| Разрешение                              | Поведение общего доступа                                      |
| --------------------------------------- | ------------------------------------------------------------- |
| Только `Sites.ReadWrite.All`            | Ссылка общего доступа для всей организации (доступна всем в организации) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Ссылка общего доступа для отдельных пользователей (доступна только участникам чата) |

Общий доступ для отдельных пользователей безопаснее, поскольку файл доступен только участникам чата. Если разрешение `Chat.Read.All` отсутствует, бот возвращается к общему доступу для всей организации.

### Резервное поведение

| Сценарий                                           | Результат                                                   |
| -------------------------------------------------- | ----------------------------------------------------------- |
| Групповой чат + файл + настроен `sharePointSiteId` | Загрузка в SharePoint, отправка ссылки общего доступа       |
| Групповой чат + файл + нет `sharePointSiteId`      | Попытка загрузки в OneDrive (может завершиться ошибкой), отправка только текста |
| Личный чат + файл                                  | Поток FileConsentCard (работает без SharePoint)             |
| Любой контекст + изображение                       | Встроенное кодирование Base64 (работает без SharePoint)     |

### Расположение сохраненных файлов

Загруженные файлы хранятся в папке `/OpenClawShared/` в стандартной библиотеке документов настроенного сайта SharePoint.

## Опросы (Adaptive Cards)

OpenClaw отправляет опросы Teams как Adaptive Cards (нативного API опросов Teams нет).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Голоса записываются Gateway в SQLite состояния Plugin OpenClaw по пути `state/openclaw.sqlite`.
- Существующие файлы `msteams-polls.json` импортируются командой `openclaw doctor --fix`, а не работающим Plugin.
- Gateway должен оставаться онлайн, чтобы записывать голоса.
- Опросы пока не публикуют сводки результатов автоматически, и поддерживаемого CLI для результатов опросов пока нет.

## Карточки представления

Отправляйте семантические полезные нагрузки представления пользователям или беседам Teams с помощью инструмента `message`, CLI или обычной доставки ответов. OpenClaw преобразует их в Teams Adaptive Cards из общего контракта представления.

Параметр `presentation` принимает семантические блоки. Когда указан `presentation`, текст сообщения необязателен. Кнопки отображаются как действия отправки Adaptive Card или URL-действия. Меню выбора пока не являются нативными в рендерере Teams, поэтому OpenClaw перед доставкой понижает их до читаемого текста.

**Инструмент агента:**

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

Подробности о формате цели см. в разделе [Форматы целей](#target-formats) ниже.

## Форматы целей

Цели MSTeams используют префиксы, чтобы различать пользователей и беседы:

| Тип цели              | Формат                           | Пример                                              |
| --------------------- | -------------------------------- | --------------------------------------------------- |
| Пользователь (по ID)  | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Пользователь (по имени) | `user:<display-name>`          | `user:John Smith` (требуется Graph API)             |
| Группа/канал          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Группа/канал (сырой формат) | `<conversation-id>`        | `19:abc123...@thread.tacv2` (если содержит `@thread`) |

**Примеры CLI:**

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

**Примеры инструмента агента:**

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
Без префикса `user:` имена по умолчанию разрешаются как группы или команды. Всегда используйте `user:`, когда указываете людей по отображаемому имени.
</Note>

## Проактивные сообщения

- Проактивные сообщения возможны только **после** взаимодействия пользователя, потому что в этот момент мы сохраняем ссылки на беседы.
- См. `/gateway/configuration` для `dmPolicy` и ограничения по списку разрешенных.

## ID команды и канала (частая ошибка)

Параметр запроса `groupId` в URL Teams **НЕ** является ID команды, используемым для конфигурации. Вместо этого извлекайте ID из пути URL:

**URL команды:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL канала:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Для конфигурации:**

- Ключ команды = сегмент пути после `/team/` (после URL-декодирования, например `19:Bk4j...@thread.tacv2`; в старых арендаторах может отображаться `@thread.skype`, это тоже допустимо)
- Ключ канала = сегмент пути после `/channel/` (после URL-декодирования)
- **Игнорируйте** параметр запроса `groupId` для маршрутизации OpenClaw. Это ID группы Microsoft Entra, а не ID беседы Bot Framework, используемый во входящих активностях Teams.

## Закрытые каналы

Поддержка ботов в закрытых каналах ограничена:

| Функция                       | Стандартные каналы | Закрытые каналы           |
| ----------------------------- | ------------------ | ------------------------- |
| Установка бота                | Да                 | Ограниченно               |
| Сообщения в реальном времени (webhook) | Да        | Может не работать         |
| Разрешения RSC                | Да                 | Могут вести себя иначе    |
| @упоминания                   | Да                 | Если бот доступен         |
| История Graph API             | Да                 | Да (с разрешениями)       |

**Обходные пути, если закрытые каналы не работают:**

1. Используйте стандартные каналы для взаимодействий с ботом
2. Используйте личные сообщения - пользователи всегда могут написать боту напрямую
3. Используйте Graph API для доступа к истории (требуется `ChannelMessage.Read.All`)

## Устранение неполадок

### Распространенные проблемы

- **Изображения не отображаются в каналах:** отсутствуют разрешения Graph или согласие администратора. Переустановите приложение Teams и полностью закройте/откройте Teams заново.
- **Нет ответов в канале:** по умолчанию требуются упоминания; задайте `channels.msteams.requireMention=false` или настройте для конкретной команды/канала.
- **Несоответствие версии (Teams все еще показывает старый манифест):** удалите и заново добавьте приложение, затем полностью закройте Teams, чтобы обновить состояние.
- **401 Unauthorized от webhook:** ожидаемо при ручном тестировании без Azure JWT - означает, что конечная точка доступна, но авторизация не прошла. Используйте Azure Web Chat для корректного тестирования.

### Ошибки загрузки манифеста

- **"Icon file cannot be empty":** манифест ссылается на файлы значков размером 0 байт. Создайте корректные PNG-значки (32x32 для `outline.png`, 192x192 для `color.png`).
- **"webApplicationInfo.Id already in use":** приложение все еще установлено в другой команде/чате. Сначала найдите и удалите его или подождите 5-10 минут для распространения изменений.
- **"Something went wrong" при загрузке:** вместо этого загрузите через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), откройте DevTools браузера (F12) → вкладку Network и проверьте тело ответа с фактической ошибкой.
- **Сбой sideload:** попробуйте "Upload an app to your org's app catalog" вместо "Upload a custom app" - это часто обходит ограничения sideload.

### Разрешения RSC не работают

1. Убедитесь, что `webApplicationInfo.id` точно совпадает с App ID вашего бота
2. Повторно загрузите приложение и переустановите его в команде/чате
3. Проверьте, не заблокировал ли администратор вашей организации разрешения RSC
4. Подтвердите, что используете правильную область: `ChannelMessage.Read.Group` для команд, `ChatMessage.Read.Chat` для групповых чатов

## Ссылки

- [Создание Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - руководство по настройке Azure Bot
- [Портал разработчика Teams](https://dev.teams.microsoft.com/apps) - создание и управление приложениями Teams
- [Схема манифеста приложения Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Получение сообщений каналов с RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Справочник разрешений RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Обработка файлов ботом Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для канала/группы требуется Graph)
- [Проактивные сообщения](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI для управления ботами

## Связанные материалы

- [Обзор каналов](/ru/channels) - все поддерживаемые каналы
- [Сопряжение](/ru/channels/pairing) - аутентификация в DM и процесс сопряжения
- [Группы](/ru/channels/groups) - поведение групповых чатов и ограничение по упоминаниям
- [Маршрутизация каналов](/ru/channels/channel-routing) - маршрутизация сеансов для сообщений
- [Безопасность](/ru/gateway/security) - модель доступа и усиление защиты
