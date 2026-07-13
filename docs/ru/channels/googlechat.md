---
read_when:
    - Работа над функциями канала Google Chat
summary: Статус поддержки, возможности и настройка приложения Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-13T17:52:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

Google Chat работает как официальный плагин `@openclaw/googlechat`: личные сообщения и пространства через вебхуки Google Chat API (только конечная точка HTTP, без Pub/Sub).

## Установка

```bash
openclaw plugins install @openclaw/googlechat
```

Локальная рабочая копия (при запуске из репозитория git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Быстрая настройка (для начинающих)

1. Создайте проект Google Cloud и включите **Google Chat API**.
   - Перейдите на страницу: [учётные данные Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Включите API, если он ещё не включён.
2. Создайте **Service Account**:
   - Нажмите **Create Credentials** > **Service Account**.
   - Задайте любое имя (например, `openclaw-chat`).
   - Оставьте разрешения и субъектов пустыми (**Continue**, затем **Done**).
3. Создайте и скачайте **ключ JSON**:
   - Нажмите новую учётную запись службы > вкладка **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. Сохраните скачанный файл JSON на хосте Gateway (например, `~/.openclaw/googlechat-service-account.json`).
5. Создайте приложение Google Chat на странице [конфигурации Chat в Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Заполните раздел **Application info** (имя приложения, URL аватара, описание).
   - Включите **Interactive features**.
   - В разделе **Functionality** установите флажок **Join spaces and group conversations**.
   - В разделе **Connection settings** выберите **HTTP endpoint URL**.
   - В разделе **Triggers** выберите **Use a common HTTP endpoint URL for all triggers** и укажите общедоступный URL Gateway с добавлением `/googlechat` (см. [Общедоступный URL](#public-url-webhook-only)).
   - В разделе **Visibility** установите флажок **Make this Chat app available to specific people and groups in `<Your Domain>`** и введите свой адрес электронной почты.
   - Нажмите **Save**.
6. Включите приложение: обновите страницу, найдите **App status**, установите значение **Live - available to users** и снова нажмите **Save**.
7. Настройте OpenClaw с учётной записью службы и аудиторией вебхука (она должна соответствовать конфигурации приложения Chat):
   - Переменная окружения: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (только для учётной записи по умолчанию) или
   - Конфигурация: см. [Основные параметры конфигурации](#config-highlights). `openclaw channels add --channel googlechat` также принимает `--audience-type`, `--audience`, `--webhook-path` и `--webhook-url`.
8. Запустите Gateway. Google Chat будет отправлять POST-запросы по пути вебхука (по умолчанию `/googlechat`).

## Добавление в Google Chat

После запуска Gateway и добавления вашего адреса электронной почты в список видимости:

1. Перейдите в [Google Chat](https://chat.google.com/).
2. Нажмите значок **+** (плюс) рядом с **Direct Messages**.
3. Найдите **App name**, настроенное в Google Cloud Console.
   - Бот _не_ отображается в списке приложений Marketplace, поскольку это закрытое приложение; найдите его по имени.
4. Выберите бота, нажмите **Add** или **Chat** и отправьте сообщение.

## Общедоступный URL (только вебхук)

Для вебхуков Google Chat требуется общедоступная конечная точка HTTPS. В целях безопасности предоставляйте доступ из интернета **только к пути `/googlechat`**, а панель управления OpenClaw и остальные конечные точки оставьте закрытыми.

### Вариант A: Tailscale Funnel (рекомендуется)

Используйте Tailscale Serve для закрытой панели управления, а Funnel — для общедоступного пути вебхука.

1. Проверьте, к какому адресу привязан Gateway:

   ```bash
   ss -tlnp | grep 18789
   ```

   Запомните IP-адрес (например, `127.0.0.1`, `0.0.0.0` или адрес Tailscale `100.x.x.x`).

2. Предоставьте доступ к панели управления только из tailnet (порт 8443):

   ```bash
   # Если привязано к localhost (127.0.0.1 или 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Если привязано только к IP-адресу Tailscale:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Предоставьте публичный доступ только к пути вебхука:

   ```bash
   # Если привязано к localhost (127.0.0.1 или 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Если привязано только к IP-адресу Tailscale:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Если появится соответствующий запрос, перейдите по URL авторизации, указанному в выводе, чтобы включить Funnel для этого узла.

5. Проверьте настройку:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Общедоступный URL вебхука — `https://<node-name>.<tailnet>.ts.net/googlechat`; панель управления остаётся доступной только из tailnet по адресу `https://<node-name>.<tailnet>.ts.net:8443/`. Используйте общедоступный URL (без `:8443`) в конфигурации приложения Google Chat.

> Примечание: эта конфигурация сохраняется после перезагрузок. Чтобы впоследствии удалить её, используйте `tailscale funnel reset` и `tailscale serve reset`.

### Вариант B: обратный прокси-сервер (Caddy)

Проксируйте только путь вебхука:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Запросы к `your-domain.com/` игнорируются или получают ответ 404, а `your-domain.com/googlechat` перенаправляется в OpenClaw.

### Вариант C: Cloudflare Tunnel

Настройте правила входящего трафика туннеля так, чтобы перенаправлялся только путь вебхука:

- **Путь**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Правило по умолчанию**: HTTP 404 (Not Found)

## Принцип работы

1. Google Chat отправляет JSON методом POST по пути вебхука Gateway (только POST, обязателен тип содержимого JSON, действует ограничение частоты запросов по IP-адресу).
2. OpenClaw аутентифицирует каждый запрос перед его обработкой:
   - События приложения Chat содержат `Authorization: Bearer <token>`; токен проверяется до полного разбора тела запроса.
   - События дополнения Google Workspace содержат токен в теле запроса (`authorizationEventObject.systemIdToken`) и до проверки считываются с более строгими ограничениями предварительной аутентификации (16 КБ, 3 с).
3. Токен проверяется по `audienceType` + `audience`:
   - `audienceType: "app-url"` → аудиторией является HTTPS-URL вебхука.
   - `audienceType: "project-number"` → аудиторией является номер проекта Cloud.
   - Для токенов дополнений при `app-url` также требуется, чтобы `appPrincipal` содержал числовой идентификатор клиента OAuth 2.0 приложения (21 цифра, не адрес электронной почты); иначе проверка завершается сбоем, а в журнал записывается предупреждение.
4. Сообщения маршрутизируются по пространству:
   - Пространства получают отдельные сеансы `agent:<agentId>:googlechat:group:<spaceId>`; ответы отправляются в ветку сообщения.
   - Личные сообщения по умолчанию объединяются в основном сеансе агента; задайте `session.dmScope`, чтобы использовать отдельные сеансы личных сообщений для каждого собеседника (см. [Сеанс](/ru/concepts/session)).
5. Доступ к личным сообщениям по умолчанию предоставляется через сопряжение. Неизвестные отправители получают код сопряжения; подтвердите его командой:
   - `openclaw pairing approve googlechat <code>`
6. В групповых пространствах по умолчанию требуется @-упоминание. Упоминания определяются по аннотациям Chat `USER_MENTION`, указывающим на приложение; задайте `botUser` (например, `users/1234567890`), если для определения требуется имя пользовательского ресурса приложения.
7. Когда из Google Chat запрашивается подтверждение выполнения команды или действия плагина и настроен подтверждающий со стабильным `users/<id>`, OpenClaw публикует встроенную карточку подтверждения (`cardsV2`) в исходном пространстве или ветке. Кнопки карточки содержат непрозрачные токены обратного вызова; запрос ручного подтверждения `/approve <id> <decision>` появляется только тогда, когда встроенная доставка недоступна.

## Цели

Используйте следующие идентификаторы для доставки и списков разрешений:

- Личные сообщения: `users/<userId>` (рекомендуется).
- Пространства: `spaces/<spaceId>`.
- Необработанный адрес электронной почты `name@example.com` изменяем и используется для сопоставления со списком разрешений только при `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Устарело: `users/<email>` обрабатывается как идентификатор пользователя, а не как запись адреса электронной почты в списке разрешений.
- Префиксы `googlechat:`, `google-chat:` и `gchat:` принимаются и удаляются.

## Основные параметры конфигурации

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // или serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // только для проверки дополнения; числовой идентификатор клиента OAuth
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // необязательно; помогает определять упоминания
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
          systemPrompt: "Только короткие ответы.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Примечания:

- Учётные данные учётной записи службы: `serviceAccountFile` (путь), `serviceAccount` (встроенная строка или объект JSON) либо `serviceAccountRef` (SecretRef для переменной окружения или файла). Переменные окружения `GOOGLE_CHAT_SERVICE_ACCOUNT` (встроенный JSON) и `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (путь) применяются только к учётной записи по умолчанию. В конфигурациях с несколькими учётными записями используется `channels.googlechat.accounts.<id>` с теми же ключами, включая отдельный `serviceAccountRef` для каждой учётной записи.
- Если `webhookPath` не задан, путь вебхука по умолчанию — `/googlechat`; вместо него путь также можно указать через `webhookUrl`.
- Ключами групп должны быть стабильные идентификаторы пространств (`spaces/<spaceId>`). Ключи с отображаемыми именами устарели, что отмечается в журнале.
- `dangerouslyAllowNameMatching` повторно включает сопоставление изменяемых субъектов по адресам электронной почты для списков разрешений (режим аварийной совместимости); doctor предупреждает о записях с адресами электронной почты.
- Действия с реакциями Google Chat недоступны. Плагин использует аутентификацию учётной записи службы, тогда как конечным точкам реакций Google Chat требуется пользовательская аутентификация. Существующая конфигурация `actions.reactions` принимается для совместимости, но ни на что не влияет.
- Встроенные карточки подтверждения используют нажатия кнопок Google Chat `cardsV2`, а не события реакций. Подтверждающие задаются через `dm.allowFrom` или `defaultTo` и должны иметь стабильные числовые значения `users/<id>`.
- Действия с сообщениями предоставляют только текстовый `send`. Для загрузки вложений в Google Chat требуется пользовательская аутентификация, а этот плагин использует аутентификацию учётной записи службы, поэтому исходящая загрузка файлов недоступна.
- `typingIndicator`: `message` (по умолчанию) публикует заполнитель `_<Bot> is typing..._` и заменяет его первым ответом; `none` отключает эту функцию; `reaction` требует пользовательский OAuth и при аутентификации учётной записи службы в настоящее время переключается на `message`, записывая ошибку в журнал.
- Входящие вложения (первое вложение каждого сообщения) скачиваются через Chat API в конвейер обработки медиафайлов с ограничением `mediaMaxMb` (по умолчанию 20).
- Сообщения, созданные ботами, по умолчанию игнорируются. При `allowBots: true` принятые сообщения ботов используют общую [защиту от зацикливания ботов](/ru/channels/bot-loop-protection): настройте `channels.defaults.botLoopProtection`, а затем переопределите его через `channels.googlechat.botLoopProtection` или `channels.googlechat.groups.<space>.botLoopProtection`.

Подробнее о ссылках на секреты: [Управление секретами](/ru/gateway/secrets).

## Устранение неполадок

### 405 Method Not Allowed

Если в Google Cloud Logs Explorer отображаются такие ошибки:

```text
код состояния: 405, описание причины: ответ с ошибкой HTTP: HTTP/1.1 405 Method Not Allowed
```

Обработчик вебхука не зарегистрирован. Распространённые причины:

1. **Канал не настроен**: раздел `channels.googlechat` отсутствует. Проверьте командой:

   ```bash
   openclaw config get channels.googlechat
   ```

   Если команда возвращает "Config path not found", добавьте конфигурацию (см. [Основные параметры конфигурации](#config-highlights)).

2. **Плагин не включён**: проверьте состояние плагина:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Если отображается "disabled", добавьте `plugins.entries.googlechat.enabled: true` в конфигурацию.

3. **Gateway не перезапущен** после изменений конфигурации:

   ```bash
   openclaw gateway restart
   ```

Убедитесь, что канал работает:

```bash
openclaw channels status
# Должно отображаться: Google Chat default: enabled, configured, ...
```

### Другие проблемы

- `openclaw channels status --probe` отображает ошибки аутентификации и отсутствие конфигурации аудитории (требуются и `audience`, и `audienceType`).
- Если сообщения не поступают, проверьте URL Webhook приложения Chat и конфигурацию триггера.
- Если проверка упоминаний блокирует ответы, задайте для `botUser` имя пользовательского ресурса приложения и проверьте `requireMention`.
- `openclaw logs --follow` при отправке тестового сообщения показывает, достигают ли запросы Gateway.

## Связанные материалы

- [Обзор каналов](/ru/channels) — все поддерживаемые каналы
- [Маршрутизация каналов](/ru/channels/channel-routing) — маршрутизация сеансов для сообщений
- [Конфигурация Gateway](/ru/gateway/configuration)
- [Группы](/ru/channels/groups) — поведение групповых чатов и проверка упоминаний
- [Сопряжение](/ru/channels/pairing) — аутентификация в личных сообщениях и процесс сопряжения
- [Безопасность](/ru/gateway/security) — модель доступа и усиление защиты
