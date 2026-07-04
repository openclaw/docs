---
read_when:
    - Вам нужна пошаговая настройка Gateway, рабочей области, аутентификации, каналов и Skills
summary: Справочник CLI для `openclaw onboard` (интерактивная начальная настройка)
title: Первичная настройка
x-i18n:
    generated_at: "2026-07-04T20:38:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 99362cdca49929f7d05c2bf7bd8b0a55811b7ad6c618be90effb8869cd2ad839
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Полное пошаговое первичное подключение для настройки локального или удаленного Gateway. Используйте его, когда нужно, чтобы OpenClaw провел вас через аутентификацию модели, рабочую область, Gateway, каналы, Skills и проверку работоспособности в одном потоке.

## Связанные руководства

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/ru/start/wizard" icon="rocket">
    Пошаговое руководство по интерактивному потоку CLI.
  </Card>
  <Card title="Onboarding overview" href="/ru/start/onboarding-overview" icon="map">
    Как устроено первичное подключение OpenClaw.
  </Card>
  <Card title="CLI setup reference" href="/ru/start/wizard-cli-reference" icon="book">
    Выводы, внутреннее устройство и поведение каждого шага.
  </Card>
  <Card title="CLI automation" href="/ru/start/wizard-cli-automation" icon="terminal">
    Неинтерактивные флаги и сценарные настройки.
  </Card>
  <Card title="macOS app onboarding" href="/ru/start/onboarding" icon="apple">
    Поток первичного подключения для приложения macOS в строке меню.
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

`--flow import` использует поставщиков миграции, принадлежащих Plugin, например Hermes. Он выполняется только для новой настройки OpenClaw; если уже существуют конфигурация, учетные данные, сеансы или файлы памяти/идентичности рабочей области, перед импортом сбросьте их или выберите новую настройку.

`--modern` запускает предварительную версию разговорного первичного подключения Crestodian. Без
`--modern` команда `openclaw onboard` сохраняет классический поток первичного подключения.

В интерактивном терминале простая команда `openclaw` (без подкоманды) выбирает маршрут по состоянию
конфигурации:

- Если активный файл конфигурации отсутствует или не содержит пользовательских настроек (пустой или
  только с метаданными), запускается этот классический поток первичного подключения.
- Если файл конфигурации существует, но не проходит проверку, запускается
  [Crestodian](/ru/cli/crestodian) для исправления.
- Если файл конфигурации корректен, открывается обычный агентский TUI, локально
  или с подключением к доступному настроенному Gateway. В настроенной установке
  открыть Crestodian можно через `/crestodian` внутри TUI или командой `openclaw crestodian`.

Открытый текстовый `ws://` принимается для loopback, частных IP-литералов, `.local` и
URL-адресов Gateway в Tailnet `*.ts.net`. Для других доверенных имен private-DNS задайте
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` в окружении процесса первичного подключения.

## Локаль

Интерактивное первичное подключение использует локаль мастера CLI для фиксированных текстов настройки. Порядок
разрешения:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Резервный английский

Поддерживаемые локали мастера: `en`, `zh-CN` и `zh-TW`. Значения локали могут использовать
подчеркивание или суффиксы POSIX, например `zh_CN.UTF-8`. Названия продуктов, имена команд,
ключи конфигурации, URL, идентификаторы поставщиков, идентификаторы моделей и метки Plugin/каналов
остаются буквальными.

Пример:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Неинтерактивный пользовательский поставщик:

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

`--custom-api-key` необязателен в неинтерактивном режиме. Если он не указан, первичное подключение проверяет `CUSTOM_API_KEY`.
OpenClaw автоматически помечает распространенные идентификаторы моделей зрения как поддерживающие изображения. Передайте `--custom-image-input` для неизвестных пользовательских идентификаторов моделей зрения или `--custom-text-input`, чтобы принудительно задать метаданные только для текста.
Используйте `--custom-compatibility openai-responses` для совместимых с OpenAI конечных точек, которые поддерживают `/v1/responses`, но не `/v1/chat/completions`.

LM Studio также поддерживает флаг ключа, специфичный для поставщика, в неинтерактивном режиме:

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

`--custom-base-url` по умолчанию равен `http://127.0.0.1:11434`. `--custom-model-id` необязателен; если он не указан, первичное подключение использует рекомендуемые значения Ollama по умолчанию. Здесь также работают идентификаторы облачных моделей, например `kimi-k2.5:cloud`.

Храните ключи поставщиков как ссылки вместо открытого текста:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

С `--secret-input-mode ref` первичное подключение записывает ссылки на основе переменных окружения вместо значений ключей в открытом тексте.
Для поставщиков на основе auth-profile это записывает записи `keyRef`; для пользовательских поставщиков это записывает `models.providers.<id>.apiKey` как ссылку на переменную окружения (например `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неинтерактивного режима `ref`:

- Задайте переменную окружения поставщика в окружении процесса первичного подключения (например `OPENAI_API_KEY`).
- Не передавайте встроенные флаги ключа (например `--openai-api-key`), если эта переменная окружения также не задана.
- Если встроенный флаг ключа передан без требуемой переменной окружения, первичное подключение быстро завершается с ошибкой и подсказкой.

Параметры токена Gateway в неинтерактивном режиме:

- `--gateway-auth token --gateway-token <token>` сохраняет токен в открытом тексте.
- `--gateway-auth token --gateway-token-ref-env <name>` сохраняет `gateway.auth.token` как SecretRef из переменной окружения.
- `--gateway-token` и `--gateway-token-ref-env` взаимоисключающие.
- `--gateway-token-ref-env` требует непустую переменную окружения в окружении процесса первичного подключения.
- С `--install-daemon`, когда аутентификация по токену требует токен, токены Gateway, управляемые SecretRef, проверяются, но не сохраняются как разрешенный открытый текст в метаданных окружения службы супервизора.
- С `--install-daemon`, если режим токена требует токен и настроенный SecretRef токена не разрешается, первичное подключение завершается закрытым отказом с инструкциями по исправлению.
- С `--install-daemon`, если настроены и `gateway.auth.token`, и `gateway.auth.password`, а `gateway.auth.mode` не задан, первичное подключение блокирует установку, пока режим не будет задан явно.
- Локальное первичное подключение записывает `gateway.mode="local"` в конфигурацию. Если в последующем файле конфигурации отсутствует `gateway.mode`, рассматривайте это как повреждение конфигурации или незавершенную ручную правку, а не как допустимое сокращение локального режима.
- Локальное первичное подключение устанавливает выбранные загружаемые Plugin, когда выбранный путь настройки требует их.
- Удаленное первичное подключение записывает только сведения о подключении к удаленному Gateway и не устанавливает локальные пакеты Plugin.
- `--allow-unconfigured` — отдельный аварийный обходной механизм среды выполнения Gateway. Он не означает, что первичное подключение может пропустить `gateway.mode`.

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

Неинтерактивная проверка работоспособности локального Gateway:

- Если не передан `--skip-health`, первичное подключение ждет доступный локальный Gateway перед успешным завершением.
- `--install-daemon` сначала запускает путь установки управляемого Gateway. Без него у вас уже должен быть запущен локальный Gateway, например `openclaw gateway run`.
- Если в автоматизации нужны только записи конфигурации/рабочей области/bootstrap, используйте `--skip-health`.
- Если вы управляете файлами рабочей области самостоятельно, передайте `--skip-bootstrap`, чтобы задать `agents.defaults.skipBootstrap: true` и пропустить создание `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` и `BOOTSTRAP.md`.
- В нативной Windows `--install-daemon` сначала пробует Scheduled Tasks и откатывается к элементу входа в систему в папке Startup текущего пользователя, если создание задачи запрещено.

Поведение интерактивного первичного подключения в режиме ссылок:

- Выберите **Use secret reference** при запросе.
- Затем выберите один из вариантов:
  - Переменная окружения
  - Настроенный поставщик секретов (`file` или `exec`)
- Первичное подключение выполняет быструю предварительную проверку перед сохранением ссылки.
  - Если проверка не проходит, первичное подключение показывает ошибку и позволяет повторить попытку.

### Варианты конечной точки Z.AI в неинтерактивном режиме

<Note>
`--auth-choice zai-api-key` автоматически определяет лучшую конечную точку и модель Z.AI для
вашего ключа. Конечные точки Coding Plan предпочитают `zai/glm-5.2`; общие конечные точки API используют
`zai/glm-5.1`. Чтобы принудительно выбрать конечную точку Coding Plan, укажите `zai-coding-global` или
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

Пример неинтерактивного Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Дополнительные неинтерактивные флаги

Аутентификация модели на основе токена (неинтерактивная; используется с `--auth-choice token`):

- `--token-provider <id>` — идентификатор поставщика токена. Указывает, какой поставщик выпускает токен.
- `--token <token>` — значение токена для аутентификации модели.
- `--token-profile-id <id>` — идентификатор auth profile. Универсальное хранилище токенов по умолчанию использует `<provider>:manual`; потоки настройки, принадлежащие поставщику, могут использовать собственное значение по умолчанию, например `anthropic:default`.
- `--token-expires-in <duration>` — необязательная длительность истечения токена (например `365d`, `12h`).

Cloudflare AI Gateway (неинтерактивно):

- `--cloudflare-ai-gateway-account-id <id>` — Cloudflare Account ID для маршрутизации через Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — Cloudflare AI Gateway ID.

Управление установкой демона:

- `--no-install-daemon` — явно пропустить установку службы Gateway.
- `--skip-daemon` — псевдоним для `--no-install-daemon`.

Управление настройкой UI и hook:

- `--skip-ui` — пропустить запросы Control UI / TUI во время первичного подключения.
- `--skip-hooks` — пропустить запросы настройки Webhook / hook во время первичного подключения.

Подавление вывода:

- `--suppress-gateway-token-output` — подавить вывод Gateway/UI, содержащий токены (подсказки токена, URL автоматического входа со встроенным токеном и автоматический запуск Control UI). Полезно в общих терминалах и средах CI.

## Примечания к потокам

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: минимальные запросы, автоматически генерирует токен Gateway.
    - `manual`: полные запросы порта, привязки и аутентификации (псевдоним `advanced`).
    - `import`: запускает обнаруженного поставщика миграции, показывает предварительный план, затем применяет после подтверждения.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Когда выбор аутентификации подразумевает предпочтительного поставщика, первичное подключение предварительно фильтрует средства выбора default-model и allowlist по этому поставщику. Для Volcengine и BytePlus это также сопоставляет варианты coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Если фильтр preferred-provider пока не дает загруженных моделей, первичное подключение возвращается к нефильтрованному каталогу вместо того, чтобы оставлять средство выбора пустым.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Некоторые поставщики web-search запускают дополнительные запросы, специфичные для поставщика:

    - **Grok** может предложить необязательную настройку `x_search` с тем же профилем xAI OAuth или API key и выбором модели `x_search`.
    - **Kimi** может запросить регион Moonshot API (`api.moonshot.ai` или `api.moonshot.cn`) и модель Kimi web-search по умолчанию.

  </Accordion>
  <Accordion title="Other behaviors">
    - Поведение области DM при локальном первичном подключении: [справочник настройки CLI](/ru/start/wizard-cli-reference#outputs-and-internals).
    - Самый быстрый первый чат: `openclaw dashboard` (Control UI, без настройки канала).
    - Пользовательский поставщик: подключите любую совместимую с OpenAI или Anthropic конечную точку, включая размещенных поставщиков, которых нет в списке. Используйте Unknown для автоопределения.
    - Если обнаружено состояние Hermes, первичное подключение предлагает поток миграции. Используйте [Migrate](/ru/cli/migrate) для планов dry-run, режима перезаписи, отчетов и точных сопоставлений.

  </Accordion>
</AccordionGroup>

## Общие последующие команды

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Используйте `openclaw setup` как ту же точку входа для пошагового онбординга. Используйте `openclaw setup --baseline`, когда вам нужны только базовая конфигурация и рабочая область, `openclaw configure` позже для точечных изменений и `openclaw channels add` для настройки только каналов.

<Note>
`--json` не подразумевает неинтерактивный режим. Используйте `--non-interactive` для скриптов.
</Note>
