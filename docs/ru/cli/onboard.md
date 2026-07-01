---
read_when:
    - Вам нужна пошаговая настройка Gateway, рабочей области, аутентификации, каналов и Skills
summary: Справочник CLI для `openclaw onboard` (интерактивная первичная настройка)
title: Начало работы
x-i18n:
    generated_at: "2026-07-01T13:16:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8f1f1b1e4f3a9e3c544efede027d50123050660a999ae61573e41cd466bbfa4
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Полное пошаговое подключение для настройки локального или удаленного Gateway. Используйте его, когда нужно, чтобы OpenClaw провел через аутентификацию модели, рабочую область, Gateway, каналы, Skills и проверку состояния в одном потоке.

## Связанные руководства

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/ru/start/wizard" icon="rocket">
    Пошаговое описание интерактивного потока CLI.
  </Card>
  <Card title="Onboarding overview" href="/ru/start/onboarding-overview" icon="map">
    Как устроено подключение OpenClaw.
  </Card>
  <Card title="CLI setup reference" href="/ru/start/wizard-cli-reference" icon="book">
    Вывод, внутреннее устройство и поведение по шагам.
  </Card>
  <Card title="CLI automation" href="/ru/start/wizard-cli-automation" icon="terminal">
    Неинтерактивные флаги и сценарные настройки.
  </Card>
  <Card title="macOS app onboarding" href="/ru/start/onboarding" icon="apple">
    Поток подключения для приложения строки меню macOS.
  </Card>
</CardGroup>

## Примеры

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` использует принадлежащие Plugin поставщики миграции, такие как Hermes. Он выполняется только для свежей настройки OpenClaw; если уже есть конфигурация, учетные данные, сессии или файлы памяти/идентичности рабочей области, перед импортом сбросьте их или выберите свежую настройку.

`--modern` запускает предварительную версию разговорного подключения Crestodian. Без
`--modern` команда `openclaw onboard` сохраняет классический поток подключения.

При свежей установке, когда активный файл конфигурации отсутствует или не содержит
заданных пользователем настроек (пустой или только с метаданными), простая команда `openclaw` также запускает классический
поток подключения. После того как в файле конфигурации появляются заданные пользователем настройки, простая команда `openclaw`
открывает Crestodian.

Открытый текст `ws://` принимается для loopback, литералов частных IP, `.local` и
URL Gateway Tailnet `*.ts.net`. Для других доверенных имен private-DNS задайте
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` в окружении процесса подключения.

## Локаль

Интерактивное подключение использует локаль мастера CLI для фиксированного текста настройки. Порядок
разрешения:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Резервный английский

Поддерживаемые локали мастера: `en`, `zh-CN` и `zh-TW`. Значения локали могут использовать
подчеркивание или формы суффиксов POSIX, например `zh_CN.UTF-8`. Названия продуктов, имена
команд, ключи конфигурации, URL, ID провайдеров, ID моделей и метки plugin/каналов
остаются буквальными.

Пример:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Неинтерактивный пользовательский провайдер:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` необязателен в неинтерактивном режиме. Если он опущен, подключение проверяет `CUSTOM_API_KEY`.
OpenClaw автоматически помечает распространенные ID моделей с поддержкой зрения как поддерживающие изображения. Передайте `--custom-image-input` для неизвестных пользовательских ID моделей зрения или `--custom-text-input`, чтобы принудительно указать метаданные только для текста.
Используйте `--custom-compatibility openai-responses` для OpenAI-совместимых endpoint, которые поддерживают `/v1/responses`, но не `/v1/chat/completions`.

LM Studio также поддерживает флаг ключа, специфичный для провайдера, в неинтерактивном режиме:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Неинтерактивный Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` по умолчанию равен `http://127.0.0.1:11434`. `--custom-model-id` необязателен; если он опущен, подключение использует рекомендуемые Ollama значения по умолчанию. Здесь также работают ID облачных моделей, например `kimi-k2.5:cloud`.

Храните ключи провайдеров как ссылки вместо открытого текста:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

С `--secret-input-mode ref` подключение записывает ссылки на основе переменных окружения вместо значений ключей открытым текстом.
Для провайдеров на основе auth-profile это записывает записи `keyRef`; для пользовательских провайдеров это записывает `models.providers.<id>.apiKey` как ссылку на переменную окружения (например `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неинтерактивного режима `ref`:

- Задайте переменную окружения провайдера в окружении процесса подключения (например `OPENAI_API_KEY`).
- Не передавайте inline-флаги ключей (например `--openai-api-key`), если эта переменная окружения также не задана.
- Если inline-флаг ключа передан без требуемой переменной окружения, подключение быстро завершается ошибкой с подсказками.

Параметры токена Gateway в неинтерактивном режиме:

- `--gateway-auth token --gateway-token <token>` сохраняет токен открытым текстом.
- `--gateway-auth token --gateway-token-ref-env <name>` сохраняет `gateway.auth.token` как env SecretRef.
- `--gateway-token` и `--gateway-token-ref-env` взаимоисключающие.
- `--gateway-token-ref-env` требует непустую переменную окружения в окружении процесса подключения.
- С `--install-daemon`, когда для token auth требуется токен, токены Gateway, управляемые SecretRef, проверяются, но не сохраняются как разрешенный открытый текст в метаданных окружения supervisor service.
- С `--install-daemon`, если token mode требует токен, а настроенный token SecretRef не разрешается, подключение закрывается с ошибкой и рекомендациями по исправлению.
- С `--install-daemon`, если настроены и `gateway.auth.token`, и `gateway.auth.password`, а `gateway.auth.mode` не задан, подключение блокирует установку, пока режим не будет задан явно.
- Локальное подключение записывает `gateway.mode="local"` в конфигурацию. Если в более позднем файле конфигурации отсутствует `gateway.mode`, считайте это повреждением конфигурации или незавершенным ручным редактированием, а не допустимым сокращением local-mode.
- Локальное подключение устанавливает выбранные загружаемые plugins, когда выбранный путь настройки их требует.
- Удаленное подключение записывает только сведения о подключении к удаленному Gateway и не устанавливает локальные пакеты plugin.
- `--allow-unconfigured` — это отдельный аварийный обходной путь runtime Gateway. Он не означает, что подключение может опустить `gateway.mode`.

Пример:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Проверка состояния локального Gateway в неинтерактивном режиме:

- Если не передать `--skip-health`, подключение ждет доступного локального Gateway перед успешным завершением.
- `--install-daemon` сначала запускает путь установки управляемого Gateway. Без него у вас уже должен быть запущен локальный Gateway, например `openclaw gateway run`.
- Если в автоматизации нужны только записи конфигурации/рабочей области/bootstrap, используйте `--skip-health`.
- Если вы управляете файлами рабочей области самостоятельно, передайте `--skip-bootstrap`, чтобы задать `agents.defaults.skipBootstrap: true` и пропустить создание `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` и `BOOTSTRAP.md`.
- В native Windows `--install-daemon` сначала пытается использовать Scheduled Tasks и откатывается к login item в пользовательской папке Startup-folder, если создание задачи запрещено.

Поведение интерактивного подключения в режиме ссылок:

- Выберите **Use secret reference**, когда появится запрос.
- Затем выберите одно из:
  - Переменная окружения
  - Настроенный поставщик секретов (`file` или `exec`)
- Перед сохранением ссылки подключение выполняет быструю preflight-проверку.
  - Если проверка завершается неудачно, подключение показывает ошибку и позволяет повторить попытку.

### Варианты endpoint Z.AI в неинтерактивном режиме

<Note>
`--auth-choice zai-api-key` автоматически определяет лучший endpoint Z.AI и модель для
вашего ключа. Endpoint Coding Plan предпочитают `zai/glm-5.2`; общие API endpoint используют
`zai/glm-5.1`. Чтобы принудительно выбрать endpoint Coding Plan, укажите `zai-coding-global` или
`zai-coding-cn`.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Неинтерактивный пример Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Дополнительные неинтерактивные флаги

Аутентификация модели на основе токена (неинтерактивная; используется с `--auth-choice token`):

- `--token-provider <id>` — ID поставщика токена. Определяет, какой провайдер выдает токен.
- `--token <token>` — Значение токена для аутентификации модели.
- `--token-profile-id <id>` — ID профиля аутентификации. Общее хранилище токенов по умолчанию использует `<provider>:manual`; принадлежащие провайдеру потоки настройки могут использовать собственное значение по умолчанию, например `anthropic:default`.
- `--token-expires-in <duration>` — Необязительная длительность истечения токена (например `365d`, `12h`).

Cloudflare AI Gateway (неинтерактивно):

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare Account ID для маршрутизации через Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway ID.

Управление установкой демона:

- `--no-install-daemon` — Явно пропустить установку сервиса Gateway.
- `--skip-daemon` — Псевдоним для `--no-install-daemon`.

Управление настройкой UI и hooks:

- `--skip-ui` — Пропустить подсказки Control UI / TUI во время подключения.
- `--skip-hooks` — Пропустить подсказки настройки webhook / hook во время подключения.

Подавление вывода:

- `--suppress-gateway-token-output` — Подавить вывод Gateway/UI, содержащий токены (подсказки токенов, URL автоматического входа со встроенным токеном и автоматический запуск Control UI). Полезно в общих терминалах и средах CI.

## Примечания по потокам

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: минимальные подсказки, автоматически создает токен Gateway.
    - `manual`: полные подсказки для порта, привязки и аутентификации (псевдоним `advanced`).
    - `import`: запускает обнаруженного поставщика миграции, показывает предварительный план, затем применяет после подтверждения.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Когда вариант аутентификации подразумевает предпочитаемого провайдера, подключение предварительно фильтрует селекторы модели по умолчанию и allowlist по этому провайдеру. Для Volcengine и BytePlus это также сопоставляет варианты coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Если фильтр предпочитаемого провайдера пока не дает загруженных моделей, подключение возвращается к нефильтрованному каталогу вместо того, чтобы оставлять селектор пустым.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Некоторые провайдеры web-search запускают дополнительные подсказки, специфичные для провайдера:

    - **Grok** может предложить необязательную настройку `x_search` с тем же профилем xAI OAuth или API-ключом и выбором модели `x_search`.
    - **Kimi** может запросить регион Moonshot API (`api.moonshot.ai` или `api.moonshot.cn`) и модель web-search Kimi по умолчанию.

  </Accordion>
  <Accordion title="Other behaviors">
    - Поведение области DM при локальном подключении: [справочник настройки CLI](/ru/start/wizard-cli-reference#outputs-and-internals).
    - Самый быстрый первый чат: `openclaw dashboard` (Control UI, без настройки канала).
    - Пользовательский провайдер: подключите любой OpenAI- или Anthropic-совместимый endpoint, включая размещенных провайдеров, которых нет в списке. Используйте Unknown для автоопределения.
    - Если обнаружено состояние Hermes, подключение предлагает поток миграции. Используйте [Migrate](/ru/cli/migrate) для планов dry-run, режима перезаписи, отчетов и точных сопоставлений.

  </Accordion>
</AccordionGroup>

## Распространенные последующие команды

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Используйте `openclaw setup` как ту же точку входа в пошаговое подключение. Используйте `openclaw setup --baseline`, когда нужна только базовая конфигурация/рабочая область, `openclaw configure` позже для целевых изменений и `openclaw channels add` для настройки только канала.

<Note>
`--json` не подразумевает неинтерактивный режим. Используйте `--non-interactive` для скриптов.
</Note>
