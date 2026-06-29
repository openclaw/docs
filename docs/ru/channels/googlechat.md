---
read_when:
    - Работа над функциями канала Google Chat
summary: Статус поддержки приложения Google Chat, возможности и конфигурация
title: Google Chat
x-i18n:
    generated_at: "2026-06-28T22:33:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

Status: загружаемый Plugin для личных сообщений и пространств через Webhook’и Google Chat API (только HTTP).

## Установка

Установите Google Chat перед настройкой канала:

```bash
openclaw plugins install @openclaw/googlechat
```

Локальная рабочая копия (при запуске из git-репозитория):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Быстрая настройка (для начинающих)

1. Создайте проект Google Cloud и включите **Google Chat API**.
   - Перейдите сюда: [Учетные данные Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Включите API, если он еще не включен.
2. Создайте **Service Account**:
   - Нажмите **Create Credentials** > **Service Account**.
   - Назовите его как хотите (например, `openclaw-chat`).
   - Оставьте разрешения пустыми (нажмите **Continue**).
   - Оставьте участников с доступом пустыми (нажмите **Done**).
3. Создайте и скачайте **JSON Key**:
   - В списке сервисных аккаунтов нажмите на только что созданный аккаунт.
   - Перейдите на вкладку **Keys**.
   - Нажмите **Add Key** > **Create new key**.
   - Выберите **JSON** и нажмите **Create**.
4. Сохраните скачанный JSON-файл на хосте Gateway (например, `~/.openclaw/googlechat-service-account.json`).
5. Создайте приложение Google Chat в [конфигурации Chat в Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Заполните **Application info**:
     - **App name**: (например, `OpenClaw`)
     - **Avatar URL**: (например, `https://openclaw.ai/logo.png`)
     - **Description**: (например, `Personal AI Assistant`)
   - Включите **Interactive features**.
   - В разделе **Functionality** отметьте **Join spaces and group conversations**.
   - В разделе **Connection settings** выберите **HTTP endpoint URL**.
   - В разделе **Triggers** выберите **Use a common HTTP endpoint URL for all triggers** и задайте публичный URL вашего Gateway с добавленным `/googlechat`.
     - _Совет: выполните `openclaw status`, чтобы найти публичный URL вашего Gateway._
   - В разделе **Visibility** отметьте **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Введите свой адрес электронной почты (например, `user@example.com`) в текстовое поле.
   - Нажмите **Save** внизу.
6. **Включите статус приложения**:
   - После сохранения **обновите страницу**.
   - Найдите раздел **App status** (обычно после сохранения он находится ближе к верхней или нижней части страницы).
   - Измените статус на **Live - available to users**.
   - Снова нажмите **Save**.
7. Настройте OpenClaw, указав путь к сервисному аккаунту и аудиторию Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Или config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Задайте тип и значение аудитории Webhook (должны совпадать с конфигурацией вашего приложения Chat).
9. Запустите Gateway. Google Chat будет отправлять POST-запросы на путь вашего Webhook.

## Добавление в Google Chat

Когда Gateway запущен, а ваш адрес электронной почты добавлен в список видимости:

1. Перейдите в [Google Chat](https://chat.google.com/).
2. Нажмите значок **+** (плюс) рядом с **Direct Messages**.
3. В строке поиска (где вы обычно добавляете людей) введите **App name**, настроенное в Google Cloud Console.
   - **Примечание**: бот _не_ появится в списке просмотра "Marketplace", потому что это частное приложение. Его нужно искать по имени.
4. Выберите своего бота в результатах.
5. Нажмите **Add** или **Chat**, чтобы начать разговор 1:1.
6. Отправьте «Привет», чтобы запустить ассистента!

## Публичный URL (только Webhook)

Webhook’ам Google Chat требуется публичная HTTPS-конечная точка. В целях безопасности **открывайте в интернет только путь `/googlechat`**. Оставьте панель OpenClaw и другие чувствительные конечные точки в своей частной сети.

### Вариант A: Tailscale Funnel (рекомендуется)

Используйте Tailscale Serve для частной панели и Funnel для публичного пути Webhook. Это сохраняет `/` частным и открывает только `/googlechat`.

1. **Проверьте, к какому адресу привязан ваш Gateway:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Обратите внимание на IP-адрес (например, `127.0.0.1`, `0.0.0.0` или ваш IP Tailscale вроде `100.x.x.x`).

2. **Откройте панель только для tailnet (порт 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Откройте публично только путь Webhook:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Авторизуйте узел для доступа Funnel:**
   Если появится запрос, откройте URL авторизации, показанный в выводе, чтобы включить Funnel для этого узла в политике вашего tailnet.

5. **Проверьте конфигурацию:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Публичный URL вашего Webhook будет таким:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Ваша частная панель остается доступной только в tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Используйте публичный URL (без `:8443`) в конфигурации приложения Google Chat.

> Примечание: эта конфигурация сохраняется после перезагрузок. Чтобы удалить ее позже, выполните `tailscale funnel reset` и `tailscale serve reset`.

### Вариант B: обратный прокси (Caddy)

Если вы используете обратный прокси вроде Caddy, проксируйте только конкретный путь:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

С этой конфигурацией любой запрос к `your-domain.com/` будет проигнорирован или вернет 404, а `your-domain.com/googlechat` будет безопасно направлен в OpenClaw.

### Вариант C: Cloudflare Tunnel

Настройте правила входящего трафика вашего туннеля так, чтобы маршрутизировался только путь Webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Как это работает

1. Google Chat отправляет Webhook POST-запросы в Gateway. Каждый запрос содержит заголовок `Authorization: Bearer <token>`.
   - OpenClaw проверяет bearer-аутентификацию перед чтением и разбором полных тел Webhook, когда заголовок присутствует.
   - Запросы Google Workspace Add-on, которые передают `authorizationEventObject.systemIdToken` в теле, поддерживаются через более строгий бюджет тела для предварительной аутентификации.
2. OpenClaw проверяет токен по настроенным `audienceType` и `audience`:
   - `audienceType: "app-url"` → аудитория — это HTTPS URL вашего Webhook.
   - `audienceType: "project-number"` → аудитория — это номер Cloud-проекта.
3. Сообщения маршрутизируются по пространству:
   - Личные сообщения используют ключ сеанса `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Пространства используют ключ сеанса `agent:<agentId>:googlechat:group:<spaceId>`.
4. Доступ к личным сообщениям по умолчанию выполняется через сопряжение. Неизвестные отправители получают код сопряжения; подтвердите его командой:
   - `openclaw pairing approve googlechat <code>`
5. Групповые пространства по умолчанию требуют @-упоминания. Используйте `botUser`, если для обнаружения упоминаний нужно имя пользователя приложения.
6. Когда запрос на подтверждение exec или plugin запускается из Google Chat и настроен стабильный утверждающий `users/<id>`, OpenClaw публикует нативную карточку подтверждения Google Chat в исходном пространстве или ветке. Кнопки карточки используют непрозрачные callback-токены, а ручная подсказка `/approve <id> <decision>` показывается только тогда, когда нативная доставка подтверждения недоступна.

## Цели

Используйте эти идентификаторы для доставки и списков разрешений:

- Личные сообщения: `users/<userId>` (рекомендуется).
- Необработанный адрес электронной почты `name@example.com` изменяем и используется для сопоставления с прямым списком разрешений только при `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Устарело: `users/<email>` рассматривается как идентификатор пользователя, а не список разрешений по электронной почте.
- Пространства: `spaces/<spaceId>`.

## Основные настройки конфигурации

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Примечания:

- Учетные данные сервисного аккаунта также можно передать inline через `serviceAccount` (JSON-строка).
- `serviceAccountRef` также поддерживается (env/file SecretRef), включая ссылки для отдельных аккаунтов в `channels.googlechat.accounts.<id>.serviceAccountRef`.
- Путь Webhook по умолчанию — `/googlechat`, если `webhookPath` не задан.
- `dangerouslyAllowNameMatching` снова включает сопоставление изменяемых email-принципалов для списков разрешений (режим совместимости break-glass).
- Реакции доступны через инструмент `reactions` и `channels action`, когда включен `actions.reactions`.
- Нативные карточки подтверждения используют нажатия кнопок Google Chat `cardsV2`, а не события реакций. Утверждающие берутся из `dm.allowFrom` или `defaultTo` и должны быть стабильными числовыми значениями `users/<id>`.
- Действия сообщений предоставляют `send` для текста и `upload-file` для явной отправки вложений. `upload-file` принимает `media` / `filePath` / `path`, а также необязательные `message`, `filename` и указание ветки.
- `typingIndicator` поддерживает `message` (по умолчанию), `none` и `reaction` (для реакции требуется пользовательский OAuth).
- Вложения скачиваются через Chat API и сохраняются в медиаконвейере (размер ограничивается `mediaMaxMb`).
- Сообщения Google Chat, созданные ботом, по умолчанию игнорируются. Если вы намеренно задаете `allowBots: true`, принятые сообщения от ботов используют общую [защиту от циклов ботов](/ru/channels/bot-loop-protection). Настройте `channels.defaults.botLoopProtection`, затем переопределите через `channels.googlechat.botLoopProtection` или `channels.googlechat.groups.<space>.botLoopProtection`, когда для одного пространства нужен другой бюджет.

Подробности ссылок на секреты: [Управление секретами](/ru/gateway/secrets).

## Устранение неполадок

### 405 Method Not Allowed

Если Google Cloud Logs Explorer показывает ошибки вида:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Это означает, что обработчик Webhook не зарегистрирован. Частые причины:

1. **Канал не настроен**: раздел `channels.googlechat` отсутствует в вашей конфигурации. Проверьте командой:

   ```bash
   openclaw config get channels.googlechat
   ```

   Если она возвращает "Config path not found", добавьте конфигурацию (см. [Основные настройки конфигурации](#config-highlights)).

2. **Plugin не включен**: проверьте статус Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Если отображается "disabled", добавьте `plugins.entries.googlechat.enabled: true` в свою конфигурацию.

3. **Gateway не перезапущен**: после добавления конфигурации перезапустите Gateway:

   ```bash
   openclaw gateway restart
   ```

Проверьте, что канал запущен:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Другие проблемы

- Проверьте `openclaw channels status --probe` на ошибки аутентификации или отсутствующую конфигурацию аудитории.
- Если сообщения не приходят, проверьте URL Webhook приложения Chat и подписки на события.
- Если ограничение по упоминаниям блокирует ответы, задайте `botUser` как имя пользовательского ресурса приложения и проверьте `requireMention`.
- Используйте `openclaw logs --follow` при отправке тестового сообщения, чтобы увидеть, доходят ли запросы до Gateway.

Связанные документы:

- [Конфигурация Gateway](/ru/gateway/configuration)
- [Безопасность](/ru/gateway/security)
- [Реакции](/ru/tools/reactions)

## Связанные

- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Сопряжение](/ru/channels/pairing) — аутентификация в личных сообщениях и процесс сопряжения
- [Группы](/ru/channels/groups) — поведение групповых чатов и фильтрация по упоминаниям
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
