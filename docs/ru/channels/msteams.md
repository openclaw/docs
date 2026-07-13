---
read_when:
    - Работа над функциями канала Microsoft Teams
summary: Статус поддержки, возможности и настройка бота Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-13T19:31:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: c01ef9ac8892c19b42e0f03e427f9e87be9868b8901879d93d1762d1533aab70
    source_path: channels/msteams.md
    workflow: 16
---

Статус: поддерживаются текст и вложения в личных сообщениях; для отправки файлов в каналы и группы требуются `sharePointSiteId` и разрешения Graph (см. [Отправка файлов в групповых чатах](#sending-files-in-group-chats)). Опросы отправляются через Adaptive Cards. Действия с сообщениями предоставляют явный параметр `upload-file` для отправок, в которых файл идет первым.

## Встроенный плагин

Microsoft Teams поставляется как встроенный плагин в текущих выпусках OpenClaw; в обычной пакетной сборке отдельная установка не требуется.

В более старой сборке или пользовательской установке без встроенного Teams установите пакет npm напрямую:

```bash
openclaw plugins install @openclaw/msteams
```

Используйте пакет без указания версии, чтобы следовать текущему официальному тегу выпуска. Фиксируйте точную версию только тогда, когда нужна воспроизводимая установка.

Локальная рабочая копия (запуск из репозитория git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Подробнее: [Плагины](/ru/tools/plugin)

## Быстрая настройка

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) выполняет регистрацию бота, создание манифеста и генерацию учетных данных одной командой.

**1. Установите и войдите в систему**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # убедитесь, что вы вошли в систему, и просмотрите сведения о клиенте
```

<Note>
Teams CLI сейчас находится на стадии предварительной версии. Команды и флаги могут меняться между выпусками.
</Note>

**2. Запустите туннель** (Teams не может подключиться к localhost)

При необходимости установите и аутентифицируйте CLI devtunnel ([руководство по началу работы](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Однократная настройка (постоянный URL между сеансами):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Для каждого сеанса разработки:
devtunnel host my-openclaw-bot
# Ваша конечная точка: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` требуется, поскольку Teams не может пройти аутентификацию через devtunnels. Каждый входящий запрос бота по-прежнему проверяется Teams SDK.
</Note>

Альтернативы: `ngrok http 3978` или `tailscale funnel 3978` (URL-адреса могут меняться в каждом сеансе).

**3. Создайте приложение**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Эта команда создает приложение Entra ID (Azure AD), генерирует клиентский секрет, формирует и загружает манифест приложения Teams (со значками), а также регистрирует управляемого Teams бота (подписка Azure не требуется). Вывод содержит `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` и **идентификатор приложения Teams**; также предлагается установить приложение непосредственно в Teams.

**4. Настройте OpenClaw**, используя учетные данные из вывода:

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

Или используйте переменные среды напрямую: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Установите приложение в Teams**

`teams app create` предложит установить приложение; выберите "Install in Teams". Чтобы получить ссылку для установки позднее:

```bash
teams app get <teamsAppId> --install-link
```

**6. Убедитесь, что все работает**

```bash
teams app doctor <teamsAppId>
```

Запускает диагностику регистрации бота, конфигурации приложения AAD, корректности манифеста и настройки SSO.

Для рабочей среды рассмотрите [федеративную аутентификацию](#federated-authentication-certificate-plus-managed-identity) (сертификат или управляемое удостоверение) вместо клиентских секретов.

<Note>
Групповые чаты по умолчанию заблокированы (`channels.msteams.groupPolicy: "allowlist"`). Чтобы разрешить ответы в группах, задайте `channels.msteams.groupAllowFrom` или используйте `groupPolicy: "open"`, чтобы разрешить их любому участнику (при обязательном упоминании).
</Note>

## Цели

- Общайтесь с OpenClaw через личные сообщения, групповые чаты или каналы Teams.
- Сохраняйте детерминированную маршрутизацию: ответы всегда возвращаются в канал, из которого поступило сообщение.
- По умолчанию используйте безопасное поведение в каналах (упоминания обязательны, если не настроено иное).

## Запись конфигурации

По умолчанию Microsoft Teams может записывать обновления конфигурации, инициированные `/config set|unset` (требуется `commands.config: true`).

Чтобы отключить:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Управление доступом (личные сообщения и группы)

**Доступ к личным сообщениям**

- По умолчанию: `channels.msteams.dmPolicy = "pairing"`. Неизвестные отправители игнорируются до одобрения.
- В `channels.msteams.allowFrom` следует использовать стабильные идентификаторы объектов AAD или статические группы доступа отправителей, например `accessGroup:core-team`.
- Не полагайтесь на сопоставление UPN или отображаемого имени в списках разрешений: они могут изменяться. OpenClaw по умолчанию отключает прямое сопоставление имен; включите его с помощью `channels.msteams.dangerouslyAllowNameMatching: true`.
- Мастер может преобразовывать имена в идентификаторы через Microsoft Graph, если это позволяют учетные данные.

**Доступ к группам**

- По умолчанию: `channels.msteams.groupPolicy = "allowlist"` (заблокировано, пока вы не добавите `groupAllowFrom`). `channels.defaults.groupPolicy` может переопределить общее значение по умолчанию, если `channels.msteams.groupPolicy` не задано.
- `channels.msteams.groupAllowFrom` определяет, какие отправители или статические группы доступа отправителей могут инициировать обработку в групповых чатах и каналах (с резервным использованием `channels.msteams.allowFrom`).
- Задайте `groupPolicy: "open"`, чтобы разрешить доступ любому участнику (по умолчанию упоминание по-прежнему обязательно).
- Чтобы заблокировать **все** каналы, задайте `channels.msteams.groupPolicy: "disabled"`.

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

**Список разрешений команд и каналов**

- Ограничьте ответы в группах и каналах, перечислив команды и каналы в `channels.msteams.teams`.
- Используйте в качестве ключей стабильные идентификаторы бесед Teams из ссылок Teams, а не изменяемые отображаемые имена (см. [Идентификаторы команд и каналов](#team-and-channel-ids-common-gotcha)).
- Если задано `groupPolicy="allowlist"` и присутствует список разрешенных команд, принимаются только указанные команды и каналы (при обязательном упоминании).
- Мастер настройки принимает записи `Team/Channel` и сохраняет их.
- При запуске OpenClaw преобразует имена команд, каналов и пользователей из списков разрешений в идентификаторы (если это допускают разрешения Graph) и записывает сопоставление в журнал. Неразрешенные имена сохраняются в исходном виде, но игнорируются при маршрутизации, если не задано `channels.msteams.dangerouslyAllowNameMatching: true`.

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

### Как это работает

1. Убедитесь, что плагин Microsoft Teams доступен (встроен в текущие выпуски).
2. Создайте **Azure Bot** (идентификатор приложения + секрет + идентификатор клиента).
3. Создайте **пакет приложения Teams**, ссылающийся на бота и включающий указанные ниже разрешения RSC.
4. Загрузите или установите приложение Teams в команду (либо в личную область для личных сообщений).
5. Настройте `msteams` в `~/.openclaw/openclaw.json` (или переменных среды) и запустите Gateway.
6. По умолчанию Gateway принимает трафик Webhook Bot Framework на `/api/messages`.

### Шаг 1. Создайте Azure Bot

1. Перейдите на страницу [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Заполните вкладку **Basics**:

   | Поле               | Значение                                                         |
   | ------------------ | ---------------------------------------------------------------- |
   | **Bot handle**     | Имя вашего бота, например `openclaw-msteams` (должно быть уникальным) |
   | **Subscription**   | Выберите подписку Azure                                          |
   | **Resource group** | Создайте новую или используйте существующую                      |
   | **Pricing tier**   | **Free** для разработки и тестирования                           |
   | **Type of App**    | **Single Tenant** (рекомендуется; см. примечание ниже)            |
   | **Creation type**  | **Create new Microsoft App ID**                                  |

<Warning>
Создание новых мультитенантных ботов стало устаревшим после 2025-07-31. Для новых ботов используйте **Single Tenant**.
</Warning>

3. Нажмите **Review + create**, затем **Create** (~1-2 минуты).

### Шаг 2. Получите учетные данные

1. Ресурс Azure Bot → **Configuration** → скопируйте **Microsoft App ID** (ваш `appId`).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → скопируйте **Value** (ваш `appPassword`).
3. **Overview** → скопируйте **Directory (tenant) ID** (ваш `tenantId`).

### Шаг 3. Настройте конечную точку обмена сообщениями

1. Azure Bot → **Configuration**.
2. Задайте **Messaging endpoint**:
   - Рабочая среда: `https://your-domain.com/api/messages`
   - Локальная разработка: используйте туннель (см. [Локальная разработка](#local-development-tunneling))

### Шаг 4. Включите канал Teams

1. Azure Bot → **Channels**.
2. Нажмите **Microsoft Teams** → Configure → Save.
3. Примите условия обслуживания.

### Шаг 5. Создайте манифест приложения Teams

- Включите запись `bot` с `botId = <App ID>`.
- Области: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (требуется для обработки файлов в личной области).
- Добавьте разрешения RSC (см. [Разрешения RSC](#current-teams-rsc-permissions-manifest)).
- Создайте значки: `outline.png` (32x32) и `color.png` (192x192).
- Упакуйте `manifest.json`, `outline.png` и `color.png` в один ZIP-архив.

### Шаг 6. Настройте OpenClaw

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

Переменные среды: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Шаг 7. Запустите Gateway

Канал Teams запускается автоматически, когда плагин доступен, а конфигурация `msteams` содержит учетные данные.

</details>

## Федеративная аутентификация (сертификат и управляемое удостоверение)

Для рабочей среды OpenClaw поддерживает **федеративную аутентификацию** через `channels.msteams.authType: "federated"` как альтернативу клиентским секретам. Доступны два метода:

### Вариант A. Аутентификация на основе сертификата

Используйте сертификат PEM, зарегистрированный для вашего приложения Entra ID.

**Настройка:**

1. Создайте или получите сертификат (в формате PEM с закрытым ключом).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → загрузите открытый сертификат.

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

**Переменные среды:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Вариант B. Управляемое удостоверение Azure

Используйте управляемое удостоверение Azure для аутентификации без пароля в инфраструктуре Azure (AKS, App Service, виртуальные машины Azure).

**Как это работает:**

1. Под или виртуальная машина бота имеет управляемое удостоверение (назначенное системой или пользователем).
2. Учетные данные федеративного удостоверения связывают управляемое удостоверение с регистрацией приложения Entra ID.
3. Во время выполнения OpenClaw использует `@azure/identity` для получения токенов из конечной точки Azure IMDS.
4. Токен передается в Teams SDK для аутентификации бота.

**Предварительные требования:**

- Инфраструктура Azure с включённым управляемым удостоверением (удостоверение рабочей нагрузки AKS, App Service, виртуальная машина).
- Учётные данные федеративного удостоверения созданы в регистрации приложения Entra ID.
- Сетевой доступ к IMDS (`169.254.169.254:80`) из пода/виртуальной машины.

**Конфигурация (управляемое удостоверение, назначенное системой):**

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

**Конфигурация (управляемое удостоверение, назначенное пользователем):** добавьте `managedIdentityClientId: "<MI_CLIENT_ID>"` в приведённый выше блок.

**Переменные среды:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (только для удостоверения, назначенного пользователем)

### Настройка удостоверения рабочей нагрузки AKS

Для развёртываний AKS с удостоверением рабочей нагрузки:

1. **Включите удостоверение рабочей нагрузки** в кластере AKS.
2. **Создайте учётные данные федеративного удостоверения** в регистрации приложения Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Добавьте аннотацию к учётной записи службы Kubernetes** с идентификатором клиента приложения:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Добавьте метку к поду** для внедрения удостоверения рабочей нагрузки:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Разрешите сетевой доступ** к IMDS (`169.254.169.254`): если используется NetworkPolicy, добавьте правило исходящего трафика для `169.254.169.254/32` на порту 80.

### Сравнение типов аутентификации

| Метод                       | Конфигурация                                  | Преимущества                              | Недостатки                                           |
| --------------------------- | --------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| **Секрет клиента**          | `appPassword`                            | Простая настройка                         | Требуется ротация секрета, менее безопасно            |
| **Сертификат**              | `authType: "federated"` + `certificatePath`       | Общий секрет не передаётся по сети        | Дополнительные затраты на управление сертификатами   |
| **Управляемое удостоверение** | `authType: "federated"` + `useManagedIdentity`     | Без паролей и секретов, требующих управления | Требуется инфраструктура Azure                    |

`certificateThumbprint` можно задать вместе с `certificatePath`, но в настоящее время путь аутентификации его не считывает; он принимается только для прямой совместимости.

**По умолчанию:** если `authType` не задан, OpenClaw использует аутентификацию с секретом клиента (`appPassword`). Существующие конфигурации продолжают работать без изменений.

## Локальная разработка (туннелирование)

Teams не может обращаться к `localhost`. Используйте постоянный туннель разработки, чтобы URL оставался неизменным между сеансами:

```bash
# Однократная настройка:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Каждый сеанс разработки:
devtunnel host my-openclaw-bot
```

Альтернативы: `ngrok http 3978` или `tailscale funnel 3978` (URL могут изменяться в каждом сеансе).

Если URL туннеля изменился, обновите конечную точку:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Тестирование бота

**Запустите диагностику:**

```bash
teams app doctor <teamsAppId>
```

За один проход проверяются регистрация бота, приложение AAD, манифест и конфигурация SSO.

**Отправьте тестовое сообщение:**

1. Установите приложение Teams (ссылка на установку из `teams app get <id> --install-link`).
2. Найдите бота в Teams и отправьте ему личное сообщение.
3. Проверьте журналы Gateway на наличие входящих событий.

## Переменные среды

Эти связанные с аутентификацией ключи конфигурации можно задать с помощью переменных среды вместо `openclaw.json` (другие ключи конфигурации, например `groupPolicy` или `historyLimit`, можно задать только в конфигурации):

| Переменная среды                     | Ключ конфигурации         | Примечания                                      |
| ------------------------------------ | ------------------------- | ----------------------------------------------- |
| `MSTEAMS_APP_ID`                   | `appId`        |                                                 |
| `MSTEAMS_APP_PASSWORD`                   | `appPassword`        |                                                 |
| `MSTEAMS_TENANT_ID`                   | `tenantId`        |                                                 |
| `MSTEAMS_AUTH_TYPE`                   | `authType`        | `"secret"` или `"federated"`       |
| `MSTEAMS_CERTIFICATE_PATH`                   | `certificatePath`        | федеративное удостоверение + сертификат         |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`                   | `certificateThumbprint`        | принимается, но не требуется для аутентификации |
| `MSTEAMS_USE_MANAGED_IDENTITY`                   | `useManagedIdentity`        | федеративное + управляемое удостоверение         |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`                   | `managedIdentityClientId`        | только управляемое удостоверение, назначенное пользователем |

## Действие для получения сведений об участнике

OpenClaw предоставляет для Microsoft Teams действие `member-info` на основе Graph, позволяющее агентам и средствам автоматизации получать проверенные сведения о составе участников настроенной беседы.

Требования:

- Разрешения RSC `ChannelSettings.Read.Group` и `TeamMember.Read.Group` (уже включены в рекомендуемый манифест).

Действие доступно всегда, когда настроены учётные данные Graph; отдельного переключателя `channels.msteams.actions.memberInfo` нет.
При поиске в стандартном канале возвращаются соответствующее удостоверение из состава команды, отображаемое имя, адрес электронной почты и роли.
В текущем личном или групповом чате действие может вернуть стабильный идентификатор доверенного отправителя.
Для поиска участников в закрытых/общих каналах и чатах, отличных от текущего, требуются дополнительные разрешения на доступ к составу участников,
поэтому при базовом наборе разрешений по умолчанию такие запросы отклоняются.

## Контекст истории

- `channels.msteams.historyLimit` определяет, сколько последних сообщений канала или группы включается в запрос. Если параметр не задан, используется `messages.groupChat.historyLimit`, а затем значение по умолчанию 50. Чтобы отключить эту функцию, задайте `0`.
- Полученная история ветки фильтруется по спискам разрешённых отправителей (`allowFrom` / `groupAllowFrom`), поэтому начальное наполнение контекста ветки включает только сообщения от разрешённых отправителей.
- Контекст цитируемых вложений (извлечённый из HTML по схеме Skype Reply в собственных вложениях ответа) передаётся без фильтрации; в настоящее время фильтр списка разрешённых отправителей применяется только к начальному наполнению из истории ветки.
- Историю личных сообщений можно ограничить с помощью `channels.msteams.dmHistoryLimit` (реплики пользователя). Переопределения для отдельных пользователей: `channels.msteams.dms["<user_id>"].historyLimit`.

## Текущие разрешения RSC Teams (манифест)

Ниже перечислены **существующие разрешения resourceSpecific** в манифесте нашего приложения Teams. Они действуют только в команде или чате, где установлено приложение.

**Для каналов (область команды):**

- `ChannelMessage.Read.Group` (Application) — получение всех сообщений канала без @упоминания
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Для групповых чатов:**

- `ChatMessage.Read.Chat` (Application) — получение всех сообщений группового чата без @упоминания

Добавьте разрешения RSC с помощью CLI Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Пример манифеста Teams (с отредактированными данными)

Минимальный корректный пример с обязательными полями. Замените идентификаторы и URL.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Ваша организация",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw в Teams", full: "OpenClaw в Teams" },
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

- `bots[].botId` **должен** совпадать с идентификатором приложения Azure Bot.
- `webApplicationInfo.id` **должен** совпадать с идентификатором приложения Azure Bot.
- `bots[].scopes` должен включать поверхности, которые вы планируете использовать (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` требуется для обработки файлов в личной области.
- `authorization.permissions.resourceSpecific` должен включать разрешения на чтение и отправку сообщений канала для трафика каналов.

### Обновление существующего приложения

```bash
# Загрузите манифест, отредактируйте его и отправьте обратно
teams app manifest download <teamsAppId> manifest.json
# Отредактируйте manifest.json локально...
teams app manifest upload manifest.json <teamsAppId>
# Версия увеличивается автоматически, если содержимое изменилось
```

После обновления переустановите приложение в каждой команде и **полностью закройте и перезапустите Teams** (недостаточно просто закрыть окно), чтобы очистить кэшированные метаданные приложения.

<details>
<summary>Обновление манифеста вручную (без CLI)</summary>

1. Обновите `manifest.json`, указав новые параметры.
2. **Увеличьте значение поля `version`** (например, `1.0.0` → `1.1.0`).
3. **Повторно создайте ZIP-архив** манифеста со значками (`manifest.json`, `outline.png`, `color.png`).
4. Загрузите новый ZIP-архив:
   - **Teams Admin Center:** Teams apps → Manage apps → найдите своё приложение → Upload new version.
   - **Загрузка неопубликованного приложения:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## Возможности: только RSC или Graph

### С **только RSC Teams** (приложение установлено, разрешения Graph API отсутствуют)

Работает:

- Чтение **текстового** содержимого сообщений канала.
- Отправка **текстового** содержимого сообщений канала.
- Получение файловых вложений в **личных сообщениях**.

НЕ работает:

- Получение **содержимого изображений или файлов** из каналов и групп (полезная нагрузка содержит только HTML-заглушку).
- Скачивание вложений, хранящихся в SharePoint/OneDrive.
- Чтение истории сообщений за пределами текущего события Webhook.

### С **RSC Teams и разрешениями приложения Microsoft Graph**

Дополнительно доступно:

- Скачивание размещённого содержимого (изображений, вставленных в сообщения).
- Скачивание файловых вложений, хранящихся в SharePoint/OneDrive.
- Чтение истории сообщений каналов и чатов через Graph.

### RSC и Graph API

| Возможность                  | Разрешения RSC          | Graph API                                      |
| ---------------------------- | ----------------------- | ---------------------------------------------- |
| **Сообщения в реальном времени** | Да (через webhook)      | Нет (только опрос)                             |
| **Исторические сообщения**   | Нет                     | Да (можно запрашивать историю)                 |
| **Сложность настройки**      | Только манифест приложения | Требуются согласие администратора и процесс получения токена |
| **Работа в автономном режиме** | Нет (должен быть запущен) | Да (запросы можно выполнять в любое время)     |

**Итог:** RSC предназначен для отслеживания в реальном времени, а Graph API — для доступа к истории. Чтобы получить пропущенные сообщения после работы в автономном режиме, необходим Graph API с `ChannelMessage.Read.All` (требуется согласие администратора).

## Медиафайлы и история через Graph

Включайте только те разрешения приложения Microsoft Graph, которые необходимы для используемых областей и данных Teams:

1. Entra ID (Azure AD) **App Registration** → добавьте **Application permissions** Graph:
   - `ChannelMessage.Read.All` для вложений и истории каналов.
   - `Chat.Read.All` для вложений и истории групповых чатов.
   - `Files.Read.All`, если байты вложений необходимо загружать из хранилища SharePoint/OneDrive; для конфигураций, использующих только историю, это разрешение не требуется.
2. Выполните **Grant admin consent** для клиента.
3. Увеличьте **версию манифеста** приложения Teams, повторно загрузите его и **переустановите приложение в Teams**.
4. **Полностью закройте и снова запустите Teams**, чтобы очистить кэшированные метаданные приложения.

### Восстановление файлов каналов и групп (`graphMediaFallback`)

Teams может удалять маркеры файлов из HTML-действия, отправляемого боту. В этом случае действие Bot Framework невозможно отличить от обычного HTML-сообщения; полная ссылка на вложение существует только в копии сообщения в Graph.

После предоставления указанных выше разрешений включите резервный механизм:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

Это относится только к каналам и групповым чатам. При каждом HTML-действии, не содержащем медиафайлов, доступных для непосредственного скачивания, выполняется один дополнительный поиск сообщения в Graph, в том числе для обычных сообщений и сообщений, содержащих только упоминание. Значение по умолчанию — `false`, поэтому существующие установки не создают дополнительный трафик Graph и не получают ошибки разрешений автоматически.

**Упоминания пользователей:** @упоминания сразу работают для пользователей, уже участвующих в беседе. Чтобы динамически искать и упоминать пользователей, **не участвующих в текущей беседе**, добавьте разрешение `User.Read.All` (Application) и предоставьте согласие администратора.

## Известные ограничения

### Тайм-ауты webhook

Teams доставляет сообщения через HTTP-webhook. OpenClaw применяет к этому обработчику webhook фиксированные тайм-ауты HTTP-сервера: 30 с бездействия, 30 с на весь запрос и 15 с на получение заголовков. Для необязательной обработки входящих медиафайлов и расширения контекста предусмотрен общий бюджет в 10 секунд, однако SDK Teams всё равно ожидает завершения хода агента перед возвратом ответа webhook. Если полный ход превышает окно повторных попыток Teams, возможны следующие последствия:

- Teams повторно отправляет сообщение (что приводит к появлению дубликатов).
- Ответы теряются.

Ответы отправляются проактивно после ответа агента, но медленные запуски агента всё равно могут приводить к повторным попыткам или дубликатам на стороне Teams.

### Поддержка облаков Teams и URL-адресов служб

Этот путь Teams на основе SDK проверен в рабочей среде для публичного облака Microsoft Teams.

Для входящих ответов используется контекст хода SDK Teams из входящего сообщения. Проактивные операции вне контекста — отправка, редактирование и удаление сообщений, карточки, опросы, сообщения о согласии на доступ к файлам и отложенные длительные ответы — используют сохранённую ссылку на беседу `serviceUrl`. Для публичного облака по умолчанию используется среда публичного облака SDK Teams, а сохранённые ссылки разрешены на публичном узле Teams Connector: `https://smba.trafficmanager.net/`.

Публичное облако используется по умолчанию. Для обычных ботов публичного облака задавать `channels.msteams.cloud` или `channels.msteams.serviceUrl` не требуется.

Для непубличных облаков Teams задайте `cloud` и соответствующую границу проактивных операций, когда Microsoft её опубликует:

- `channels.msteams.cloud` выбирает предустановку облака SDK Teams для аутентификации, проверки JWT, служб токенов и области Graph.
- `channels.msteams.serviceUrl` выбирает границу конечной точки Bot Connector, используемую для проверки сохранённых ссылок на беседы перед проактивной отправкой, редактированием и удалением сообщений, отправкой карточек, опросов, сообщений о согласии на доступ к файлам и отложенных длительных ответов. Этот параметр обязателен для облаков SDK USGov и DoD. Для China/21Vianet OpenClaw использует предустановку SDK `China` и принимает сохранённые или настроенные URL-адреса служб только на узлах каналов Azure China Bot Framework.

Microsoft публикует глобальные конечные точки Bot Connector для проактивных операций в разделе [Создание беседы](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) документации Teams по проактивному обмену сообщениями. По возможности используйте `serviceUrl` входящего действия; в противном случае используйте приведённую ниже таблицу Microsoft.

| Среда Teams       | Конфигурация OpenClaw                                       | Проактивный `serviceUrl`                       |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Public            | конфигурация облака/serviceUrl не требуется                 | `https://smba.trafficmanager.net/teams`            |
| GCC               | задайте `serviceUrl`; отдельной предустановки облака SDK Teams не существует | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | используйте `serviceUrl` входящего действия           |

Пример для GCC, где Microsoft документирует отдельный URL-адрес службы для проактивных операций, но SDK Teams не предоставляет отдельной предустановки облака GCC:

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

`channels.msteams.serviceUrl` ограничен поддерживаемыми узлами Microsoft Teams Bot Connector. Если настроен URL-адрес службы, OpenClaw перед проактивной отправкой, редактированием и удалением сообщений, отправкой карточек, опросов или отложенных длительных ответов проверяет, что сохранённая беседа `serviceUrl` использует тот же узел. При конфигурации публичного облака по умолчанию OpenClaw завершает операцию с ошибкой, если сохранённая беседа указывает за пределы публичного узла Teams Connector. После изменения настроек облака или URL-адреса службы получите новое сообщение из беседы, чтобы обновить сохранённую ссылку на неё.

В таблице проактивных конечных точек Teams от Microsoft для China/21Vianet отсутствует отдельный глобальный проактивный URL-адрес `smba`. Настройте `cloud: "China"`, чтобы SDK Teams использовал конечные точки аутентификации, токенов и JWT Azure China. Для проактивной отправки после этого требуется сохранённая ссылка на беседу из входящего действия China Teams либо явно настроенный URL-адрес службы в пределах канала Azure China Bot Framework (`*.botframework.azure.cn`). Вспомогательные функции Teams на основе Graph отключены для `cloud: "China"`, пока OpenClaw не направляет запросы Graph через конечную точку Azure China Graph.

### Форматирование

Поддержка Markdown в Teams более ограничена, чем в Slack или Discord:

- Поддерживается базовое форматирование: **полужирный текст**, _курсив_, `code`, ссылки.
- Сложная разметка Markdown (таблицы, вложенные списки) может отображаться некорректно.
- Adaptive Cards поддерживаются для опросов и отправки семантического представления (см. ниже).

## Конфигурация

Основные настройки (общие шаблоны каналов см. в разделе [/gateway/configuration](/ru/gateway/configuration)):

- `channels.msteams.enabled`: включить/отключить канал.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: учетные данные бота.
- `channels.msteams.cloud`: облачная среда Teams SDK (`Public`, `USGov`, `USGovDoD` или `China`; по умолчанию `Public`). Задайте с помощью `serviceUrl` для облаков USGov/DoD SDK; для Китая используется предустановка SDK и сохраненные ссылки на разговоры Azure China Bot Framework, а вспомогательные функции на основе Graph отключены до появления маршрутизации Azure China Graph.
- `channels.msteams.serviceUrl`: граница URL службы Bot Connector для проактивных операций SDK. В общедоступном облаке используется значение SDK по умолчанию; задайте для GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High или DoD. Для Китая принимаются хосты каналов Azure China Bot Framework, если сохраненная ссылка на разговор получена из Teams под управлением 21Vianet.
- `channels.msteams.webhook.port` (по умолчанию `3978`).
- `channels.msteams.webhook.path` (по умолчанию `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (по умолчанию `pairing`).
- `channels.msteams.allowFrom`: список разрешенных пользователей для личных сообщений (рекомендуются идентификаторы объектов AAD). Если доступ к Graph имеется, мастер во время настройки преобразует имена в идентификаторы.
- `channels.msteams.dangerouslyAllowNameMatching`: аварийный переключатель для повторного включения сопоставления по изменяемым UPN/отображаемым именам и прямой маршрутизации по именам команд/каналов.
- `channels.msteams.textChunkLimit`: размер фрагмента исходящего текста в символах (по умолчанию `4000`; жесткое ограничение — `4000`, даже если настроено большее значение).
- `channels.msteams.streaming.chunkMode`: `length` (по умолчанию) или `newline`, чтобы перед разбиением по длине разделять текст по пустым строкам (границам абзацев).
- `channels.msteams.mediaAllowHosts`: список разрешенных хостов для входящих вложений (по умолчанию домены Microsoft/Teams: Graph, SharePoint/OneDrive, Teams CDN, Bot Framework, Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: список разрешенных хостов для добавления заголовков Authorization при повторных попытках получения медиафайлов (по умолчанию хосты Graph и Bot Framework).
- `channels.msteams.graphMediaFallback`: включить поиск сообщений через Graph, когда HTML канала/группы не содержит маркеров файлов (по умолчанию `false`; см. [Восстановление файлов канала/группы](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb`: переопределение ограничения размера медиафайлов для отдельного канала в МБ. Если не задано, используется `agents.defaults.mediaMaxMb`.
- `channels.msteams.requireMention`: требовать @упоминание в каналах/группах (по умолчанию `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (см. [Стиль ответов](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: переопределение для отдельной команды.
- `channels.msteams.teams.<teamId>.requireMention`: переопределение для отдельной команды.
- `channels.msteams.teams.<teamId>.tools`: стандартные переопределения политики инструментов для отдельной команды (`allow`/`deny`/`alsoAllow`), используемые при отсутствии переопределения для канала.
- `channels.msteams.teams.<teamId>.toolsBySender`: стандартные переопределения политики инструментов для отдельных отправителей в команде (поддерживается подстановочный знак `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: переопределение для отдельного канала.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: переопределение для отдельного канала.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: переопределения политики инструментов для отдельного канала (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: переопределения политики инструментов для отдельных отправителей в канале (поддерживается подстановочный знак `"*"`).
- Ключи `toolsBySender` должны использовать явные префиксы: `channel:`, `id:`, `e164:`, `username:`, `name:` (устаревшие ключи без префикса по-прежнему сопоставляются только с `id:`).
- `channels.msteams.authType`: тип аутентификации — `"secret"` (по умолчанию) или `"federated"`.
- `channels.msteams.certificatePath`: путь к файлу сертификата PEM (федеративная аутентификация и аутентификация с помощью сертификата).
- `channels.msteams.certificateThumbprint`: отпечаток сертификата; принимается, но для аутентификации не требуется.
- `channels.msteams.useManagedIdentity`: включить аутентификацию с помощью управляемого удостоверения (федеративный режим).
- `channels.msteams.managedIdentityClientId`: идентификатор клиента назначенного пользователем управляемого удостоверения.
- `channels.msteams.sharePointSiteId`: идентификатор сайта SharePoint для отправки файлов в групповых чатах/каналах (см. [Отправка файлов в групповых чатах](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: приветственная адаптивная карточка, показываемая при первом контакте в личном сообщении/группе, и кнопки с предлагаемыми запросами.
- `channels.msteams.responsePrefix`: текст, добавляемый перед исходящими ответами.
- `channels.msteams.feedbackEnabled` (по умолчанию `true`), `channels.msteams.feedbackReflection` (по умолчанию `true`), `channels.msteams.feedbackReflectionCooldownMs`: обратная связь с помощью значков «палец вверх/вниз» для ответов и последующий анализ отрицательной обратной связи.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: OAuth-подключение Bot Framework и делегированные области Graph для потоков на основе SSO; `sso.enabled: true` требует `sso.connectionName`.

## Маршрутизация и сеансы

- Ключи сеансов соответствуют стандартному формату агента (см. [/concepts/session](/ru/concepts/session)):
  - Личные сообщения используют общий основной сеанс (`agent:<agentId>:<mainKey>`).
  - Для сообщений каналов/групп используется идентификатор разговора:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Стиль ответов: ветки и публикации

В Teams используются два стиля интерфейса каналов поверх одной и той же базовой модели данных:

| Стиль                    | Описание                                               | Рекомендуемое значение `replyStyle` |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Публикации** (классические)      | Сообщения отображаются как карточки с ответами в ветке под ними | `thread` (по умолчанию)       |
| **Ветки** (как в Slack) | Сообщения идут линейно, подобно Slack                   | `top-level`              |

**Проблема:** API Teams не сообщает, какой стиль интерфейса используется в канале. Если указано неверное значение `replyStyle`:

- `thread` в канале со стилем «Ветки» → ответы отображаются с неудобной вложенностью.
- `top-level` в канале со стилем «Публикации» → ответы отображаются как отдельные публикации верхнего уровня, а не внутри ветки.

**Решение:** настройте `replyStyle` для каждого канала в соответствии с его конфигурацией:

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

Когда бот отправляет ответ в канал, значение `replyStyle` определяется начиная с наиболее конкретного переопределения и заканчивая значением по умолчанию. Используется первое значение, отличное от `undefined`:

1. **Для канала** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Для команды** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Глобальное** — `channels.msteams.replyStyle`
4. **Неявное значение по умолчанию** — определяется из `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Если глобально задать `requireMention: false` без явного значения `replyStyle`, ответы на упоминания в каналах со стилем «Публикации» будут отображаться как публикации верхнего уровня, даже если входящее сообщение было ответом в ветке. Явно задайте `replyStyle: "thread"` на глобальном уровне, уровне команды или канала, чтобы избежать неожиданного поведения.

Для проактивной отправки в сохраненный разговор канала (ответы на поставленные в очередь вызовы инструментов, агенты с длительным временем выполнения) применяется то же разрешение на уровне команды/канала; для групповых чатов и личных разговоров при проактивной отправке всегда выбирается `top-level` независимо от `replyStyle`.

### Сохранение контекста ветки

Когда действует `replyStyle: "thread"` и бот был @упомянут внутри ветки канала, OpenClaw повторно присоединяет корень исходной ветки к ссылке на исходящий разговор (`19:...@thread.tacv2;messageid=<root>`), чтобы ответ попал в ту же ветку. Это справедливо как для отправки в реальном времени (в рамках текущего цикла), так и для проактивной отправки после истечения срока действия контекста Bot Framework (например, для агентов с длительным временем выполнения и поставленных в очередь ответов на вызовы инструментов через `mcp__openclaw__message`).

Корень ветки берется из сохраненного значения `threadId` в ссылке на разговор. Для старых сохраненных ссылок, созданных до появления `threadId`, используется резервное значение `activityId` (действие входящего сообщения, которое последним инициализировало разговор), поэтому существующие развертывания продолжают работать без повторной инициализации.

Когда действует `replyStyle: "top-level"`, на входящие сообщения из веток каналов намеренно отвечают новыми публикациями верхнего уровня; суффикс ветки не добавляется. Это корректно для каналов со стилем «Ветки»; если публикации верхнего уровня появляются там, где ожидались ответы в ветке, значит для этого канала неверно задано значение `replyStyle`.

## Вложения и изображения

**Текущие ограничения:**

- **Личные сообщения:** изображения и файловые вложения работают через файловые API бота Teams.
- **Каналы/группы:** вложения хранятся в хранилище M365 (SharePoint/OneDrive). Полезная нагрузка вебхука содержит только HTML-заглушку, а не фактические байты файла. **Для скачивания вложений канала требуются разрешения Graph API**.
- Для явной отправки с приоритетом файла используйте `action=upload-file` с `media` / `filePath` / `path`; необязательное значение `message` становится сопроводительным текстом/комментарием, а `filename` (или `title`) переопределяет имя отправляемого файла.

Без разрешений Graph сообщения каналов с изображениями поступают только в текстовом виде (содержимое изображения недоступно боту).
По умолчанию OpenClaw скачивает медиафайлы только с имен хостов Microsoft/Teams. Переопределите это с помощью `channels.msteams.mediaAllowHosts` (используйте `["*"]`, чтобы разрешить любой хост).
Заголовки Authorization добавляются только для хостов из `channels.msteams.mediaAuthAllowHosts` (по умолчанию хосты Graph и Bot Framework). Сохраняйте этот список строгим (избегайте многопользовательских суффиксов).

## Отправка файлов в групповых чатах

Боты могут отправлять файлы в личных сообщениях с помощью встроенного потока FileConsentCard. **Для отправки файлов в групповых чатах/каналах** требуется дополнительная настройка:

| Контекст                  | Как отправляются файлы                           | Необходимая настройка                                    |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **Личные сообщения**                  | FileConsentCard → пользователь принимает → бот отправляет файл | Работает без дополнительной настройки                            |
| **Групповые чаты/каналы** | Отправка в SharePoint → нативная файловая карточка      | Требуется `sharePointSiteId` и разрешения Graph |
| **Изображения (любой контекст)** | Встроенные данные в кодировке Base64                        | Работает без дополнительной настройки                            |

### Почему для групповых чатов нужен SharePoint

Боты используют удостоверение приложения, а ресурс `/me` Microsoft Graph [требует вошедшего в систему пользователя](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). Для отправки файлов в групповых чатах/каналах бот загружает их на **сайт SharePoint** и создает ссылку для общего доступа.

### Настройка

1. **Добавьте разрешения Graph API** в Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) — отправка файлов в SharePoint.
   - `Chat.Read.All` (Application) — необязательно; позволяет создавать ссылки для общего доступа для отдельных пользователей.
2. **Предоставьте согласие администратора** для клиента.
3. **Получите идентификатор сайта SharePoint:**

   ```bash
   # Через Graph Explorer или curl с действительным токеном:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Пример: для сайта по адресу "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Ответ содержит: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Настройте OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... другая конфигурация ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Поведение общего доступа

| Разрешение                              | Поведение общего доступа                                          |
| --------------------------------------- | --------------------------------------------------------- |
| Только `Sites.ReadWrite.All`              | Ссылка для общего доступа в пределах организации (доступна любому сотруднику организации) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Индивидуальная ссылка для общего доступа (доступна только участникам чата)      |

Индивидуальный общий доступ безопаснее, поскольку доступ к файлу получают только участники чата. Если `Chat.Read.All` отсутствует, бот использует общий доступ в пределах организации.

### Резервное поведение

| Сценарий                                          | Результат                                           |
| ------------------------------------------------- | ------------------------------------------------ |
| Групповой чат + файл + настроен `sharePointSiteId` | Загрузка в SharePoint и отправка нативной карточки файла    |
| Групповой чат + файл + нет `sharePointSiteId`         | Ошибка конфигурации с указанием необходимых действий      |
| Личный чат + файл                              | Поток FileConsentCard (работает без SharePoint)  |
| Любой контекст + изображение                               | Встроенные данные в кодировке Base64 (работает без SharePoint) |

### Место хранения файлов

Загруженные файлы хранятся в папке `/OpenClawShared/` в стандартной библиотеке документов настроенного сайта SharePoint.

## Опросы (Adaptive Cards)

OpenClaw отправляет опросы Teams в виде Adaptive Cards (нативного API опросов Teams не существует).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- Голоса записываются Gateway в SQLite состояния плагина OpenClaw в разделе `state/openclaw.sqlite`.
- Существующие файлы `msteams-polls.json` импортируются командой `openclaw doctor --fix`, а не работающим плагином.
- Gateway должен оставаться в сети для записи голосов.
- Опросы не публикуют сводки результатов автоматически, а CLI для просмотра результатов опросов пока отсутствует.

## Карточки представления

Отправляйте семантические данные представления пользователям или беседам Teams с помощью инструмента `message`, CLI или обычной доставки ответов. OpenClaw отображает их как Adaptive Cards Teams на основе универсального контракта представления.

Параметр `presentation` принимает семантические блоки. Если указан `presentation`, текст сообщения необязателен. Кнопки отображаются как действия отправки Adaptive Card или перехода по URL. Меню выбора не поддерживаются нативно средством отображения Teams, поэтому перед доставкой OpenClaw преобразует их в удобочитаемый текст.

**Инструмент агента:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Здравствуйте",
    blocks: [{ type: "text", text: "Здравствуйте!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Здравствуйте","blocks":[{"type":"text","text":"Здравствуйте!"}]}'
```

Подробности о форматах целей см. ниже в разделе [Форматы целей](#target-formats).

## Форматы целей

В целях MSTeams используются префиксы, позволяющие различать пользователей и беседы:

| Тип цели         | Формат                           | Пример                                                                                                |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Пользователь (по ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| Пользователь (по имени)      | `user:<display-name>`            | `user:John Smith` (требуется Graph API)                                                                 |
| Группа/канал       | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| Группа/канал (без префикса) | `<conversation-id>`              | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces` или идентификатор Bot Framework без префикса: `a:`/`8:orgid:`/`29:` |

**Примеры CLI:**

```bash
# Отправка пользователю по ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Здравствуйте"

# Отправка пользователю по отображаемому имени (запускает поиск через Graph API)
openclaw message send --channel msteams --target "user:John Smith" --message "Здравствуйте"

# Отправка в групповой чат или канал
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Здравствуйте"

# Отправка карточки представления в беседу
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Здравствуйте","blocks":[{"type":"text","text":"Здравствуйте"}]}'
```

**Примеры инструмента агента:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Здравствуйте!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Здравствуйте",
    blocks: [{ type: "text", text: "Здравствуйте" }],
  },
}
```

<Note>
Без префикса `user:` имена по умолчанию разрешаются как группы или команды. При указании людей по отображаемому имени всегда используйте `user:`.
</Note>

## Проактивные сообщения

- Проактивные сообщения возможны только **после** взаимодействия пользователя, поскольку именно в этот момент OpenClaw сохраняет ссылки на беседу.
- Сведения о `dmPolicy` и проверке списка разрешений см. в разделе [/gateway/configuration](/ru/gateway/configuration).

## Идентификаторы команды и канала (распространённая ошибка)

Параметр запроса `groupId` в URL-адресах Teams — **НЕ** идентификатор команды, используемый для конфигурации. Вместо него извлеките идентификаторы из пути URL:

**URL команды:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Идентификатор беседы команды (декодируйте URL)
```

**URL канала:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Идентификатор канала (декодируйте URL)
```

**Для конфигурации:**

- Ключ команды = сегмент пути после `/team/` (декодированный из URL, например `19:Bk4j...@thread.tacv2`; в старых арендаторах может отображаться `@thread.skype`, что также допустимо).
- Ключ канала = сегмент пути после `/channel/` (декодированный из URL).
- **Игнорируйте** параметр запроса `groupId` при маршрутизации OpenClaw. Это идентификатор группы Microsoft Entra, а не идентификатор беседы Bot Framework, используемый во входящих действиях Teams.

## Частные каналы

Поддержка ботов в частных каналах ограничена:

| Возможность                      | Стандартные каналы | Частные каналы       |
| ---------------------------- | ----------------- | ---------------------- |
| Установка бота             | Да               | Ограниченно                |
| Сообщения в реальном времени (Webhook) | Да               | Могут не работать           |
| Разрешения RSC              | Да               | Могут работать иначе |
| @упоминания                    | Да               | Если бот доступен   |
| История через Graph API            | Да               | Да (при наличии разрешений) |

**Временные решения, если частные каналы не работают:**

1. Используйте стандартные каналы для взаимодействия с ботом.
2. Используйте личные сообщения; пользователи всегда могут написать боту напрямую.
3. Используйте Graph API для доступа к истории (требуется `ChannelMessage.Read.All`).

## Устранение неполадок

### Распространённые проблемы

- **Изображения не отображаются в каналах:** отсутствуют разрешения Graph или согласие администратора. Переустановите приложение Teams, полностью закройте Teams и снова откройте его.
- **Нет ответов в канале:** по умолчанию упоминания обязательны; задайте `channels.msteams.requireMention=false` или настройте параметр для конкретной команды или канала.
- **Несоответствие версий (Teams по-прежнему отображает старый манифест):** удалите и снова добавьте приложение, затем полностью закройте Teams, чтобы обновить данные.
- **Ошибка 401 Unauthorized от Webhook:** ожидаема при ручном тестировании без JWT Azure; она означает, что конечная точка доступна, но аутентификация завершилась неудачно. Для корректного тестирования используйте Azure Web Chat.

### Ошибки загрузки манифеста

- **"Icon file cannot be empty":** манифест ссылается на файлы значков размером 0 байт. Создайте допустимые значки PNG (32x32 для `outline.png`, 192x192 для `color.png`).
- **"webApplicationInfo.Id already in use":** приложение всё ещё установлено в другой команде или чате. Сначала найдите и удалите его либо подождите 5-10 минут, пока изменения распространятся.
- **"Something went wrong" при загрузке:** вместо этого загрузите приложение через [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), откройте инструменты разработчика браузера (F12) → вкладку Network и проверьте тело ответа, содержащее фактическую ошибку.
- **Не удаётся выполнить неопубликованную загрузку:** попробуйте "Upload an app to your org's app catalog" вместо "Upload a custom app"; это часто позволяет обойти ограничения неопубликованной загрузки.

### Разрешения RSC не работают

1. Убедитесь, что `webApplicationInfo.id` точно совпадает с App ID вашего бота.
2. Повторно загрузите приложение и переустановите его в команде или чате.
3. Проверьте, не заблокировал ли администратор вашей организации разрешения RSC.
4. Убедитесь, что используется правильная область: `ChannelMessage.Read.Group` для команд, `ChatMessage.Read.Chat` для групповых чатов.

## Справочные материалы

- [Создание Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) — руководство по настройке Azure Bot
- [Портал разработчика Teams](https://dev.teams.microsoft.com/apps) — создание приложений Teams и управление ими
- [Схема манифеста приложения Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Получение сообщений канала с помощью RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Справочник по разрешениям RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Обработка файлов ботами Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (для канала или группы требуется Graph)
- [Проактивные сообщения](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) — CLI Teams для управления ботами

## Связанные разделы

- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Сопряжение](/ru/channels/pairing) — аутентификация в личных сообщениях и поток сопряжения
- [Группы](/ru/channels/groups) — поведение групповых чатов и проверка упоминаний
- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сеансов для сообщений
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
