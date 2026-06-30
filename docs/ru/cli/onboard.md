---
read_when:
    - Вам нужна пошаговая настройка gateway, рабочей области, аутентификации, каналов и навыков
summary: Справочник CLI для `openclaw onboard` (интерактивная настройка)
title: Первичная настройка
x-i18n:
    generated_at: "2026-06-30T22:26:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Полное пошаговое подключение для локальной или удаленной настройки Gateway. Используйте это, когда хотите, чтобы OpenClaw в одном потоке провел настройку авторизации модели, рабочей области, Gateway, каналов, Skills и проверки работоспособности.

## Связанные руководства

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/ru/start/wizard" icon="rocket">
    Пошаговое описание интерактивного потока CLI.
  </Card>
  <Card title="Onboarding overview" href="/ru/start/onboarding-overview" icon="map">
    Как устроено подключение в OpenClaw.
  </Card>
  <Card title="CLI setup reference" href="/ru/start/wizard-cli-reference" icon="book">
    Вывод, внутреннее устройство и поведение каждого шага.
  </Card>
  <Card title="CLI automation" href="/ru/start/wizard-cli-automation" icon="terminal">
    Неинтерактивные флаги и скриптовые настройки.
  </Card>
  <Card title="macOS app onboarding" href="/ru/start/onboarding" icon="apple">
    Поток подключения для приложения macOS в строке меню.
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

`--flow import` использует принадлежащих Plugin поставщиков миграции, таких как Hermes. Он запускается только для новой установки OpenClaw; если уже существуют конфигурация, учетные данные, сессии или файлы памяти/идентичности рабочей области, перед импортом сбросьте настройку или выберите новую.

`--modern` запускает предварительную версию диалогового подключения Crestodian. Без
`--modern` команда `openclaw onboard` сохраняет классический поток подключения.

В новой установке, где активный файл конфигурации отсутствует или не содержит
заданных пользователем настроек (пустой или только с метаданными), простая команда `openclaw` также запускает классический
поток подключения. Когда в файле конфигурации появляются заданные пользователем настройки, простая команда `openclaw`
вместо этого открывает Crestodian.

Открытый `ws://` принимается для loopback, литералов частных IP, `.local` и
URL-адресов Gateway в Tailnet `*.ts.net`. Для других доверенных имен private-DNS задайте
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
подчеркивание или суффиксы POSIX, например `zh_CN.UTF-8`. Названия продуктов, имена команд,
ключи конфигурации, URL-адреса, ID поставщиков, ID моделей и метки Plugin/каналов
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

`--custom-api-key` необязателен в неинтерактивном режиме. Если он не указан, подключение проверяет `CUSTOM_API_KEY`.
OpenClaw автоматически помечает распространенные ID моделей компьютерного зрения как поддерживающие изображения. Передайте `--custom-image-input` для неизвестных пользовательских ID моделей зрения или `--custom-text-input`, чтобы принудительно задать метаданные только для текста.
Используйте `--custom-compatibility openai-responses` для OpenAI-совместимых конечных точек, которые поддерживают `/v1/responses`, но не `/v1/chat/completions`.

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

`--custom-base-url` по умолчанию равен `http://127.0.0.1:11434`. `--custom-model-id` необязателен; если он не указан, подключение использует предложенные Ollama значения по умолчанию. Здесь также работают ID облачных моделей, например `kimi-k2.5:cloud`.

Храните ключи поставщиков как ссылки вместо открытого текста:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

С `--secret-input-mode ref` подключение записывает ссылки на основе переменных окружения вместо значений ключей в открытом тексте.
Для поставщиков на основе профилей авторизации это записывает записи `keyRef`; для пользовательских поставщиков это записывает `models.providers.<id>.apiKey` как ссылку на переменную окружения (например `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неинтерактивного режима `ref`:

- Задайте переменную окружения поставщика в окружении процесса подключения (например `OPENAI_API_KEY`).
- Не передавайте встроенные флаги ключей (например `--openai-api-key`), если эта переменная окружения также не задана.
- Если встроенный флаг ключа передан без обязательной переменной окружения, подключение быстро завершается ошибкой с инструкциями.

Параметры токена Gateway в неинтерактивном режиме:

- `--gateway-auth token --gateway-token <token>` сохраняет токен в открытом тексте.
- `--gateway-auth token --gateway-token-ref-env <name>` сохраняет `gateway.auth.token` как SecretRef переменной окружения.
- `--gateway-token` и `--gateway-token-ref-env` взаимоисключающие.
- `--gateway-token-ref-env` требует непустую переменную окружения в окружении процесса подключения.
- С `--install-daemon`, когда авторизации по токену требуется токен, токены Gateway, управляемые SecretRef, проверяются, но не сохраняются как разрешенный открытый текст в метаданных окружения службы супервизора.
- С `--install-daemon`, если режим токена требует токен, а настроенный SecretRef токена не разрешается, подключение завершается закрытым отказом с инструкциями по исправлению.
- С `--install-daemon`, если настроены и `gateway.auth.token`, и `gateway.auth.password`, а `gateway.auth.mode` не задан, подключение блокирует установку до явного задания режима.
- Локальное подключение записывает `gateway.mode="local"` в конфигурацию. Если в более позднем файле конфигурации отсутствует `gateway.mode`, считайте это повреждением конфигурации или незавершенной ручной правкой, а не допустимым сокращением локального режима.
- Локальное подключение устанавливает выбранные загружаемые Plugins, когда этого требует выбранный путь настройки.
- Удаленное подключение записывает только сведения о подключении к удаленному Gateway и не устанавливает локальные пакеты Plugin.
- `--allow-unconfigured` — это отдельный аварийный обходной путь времени выполнения Gateway. Он не означает, что подключение может пропустить `gateway.mode`.

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

Проверка работоспособности локального Gateway в неинтерактивном режиме:

- Если вы не передали `--skip-health`, подключение ждет доступный локальный Gateway перед успешным завершением.
- `--install-daemon` сначала запускает управляемый путь установки Gateway. Без него у вас уже должен быть запущен локальный Gateway, например `openclaw gateway run`.
- Если в автоматизации нужны только записи конфигурации/рабочей области/bootstrap, используйте `--skip-health`.
- Если вы управляете файлами рабочей области самостоятельно, передайте `--skip-bootstrap`, чтобы задать `agents.defaults.skipBootstrap: true` и пропустить создание `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` и `BOOTSTRAP.md`.
- В нативной Windows `--install-daemon` сначала пробует Scheduled Tasks и откатывается к пользовательскому элементу входа в папке Startup, если создание задачи запрещено.

Поведение интерактивного подключения в режиме ссылок:

- Выберите **Использовать ссылку на секрет**, когда появится запрос.
- Затем выберите одно из:
  - Переменная окружения
  - Настроенный поставщик секретов (`file` или `exec`)
- Подключение выполняет быструю предварительную проверку перед сохранением ссылки.
  - Если проверка не проходит, подключение показывает ошибку и позволяет повторить попытку.

### Выборы конечной точки Z.AI в неинтерактивном режиме

<Note>
`--auth-choice zai-api-key` автоматически определяет лучшую конечную точку и модель Z.AI для
вашего ключа. Конечные точки Coding Plan предпочитают `zai/glm-5.2`; общие конечные точки API используют
`zai/glm-5.1`. Чтобы принудительно выбрать конечную точку Coding Plan, выберите `zai-coding-global` или
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

## Примечания к потоку

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: минимальные запросы, автоматически генерирует токен Gateway.
    - `manual`: полные запросы для порта, привязки и авторизации (псевдоним `advanced`).
    - `import`: запускает обнаруженного поставщика миграции, показывает предварительный план, затем применяет после подтверждения.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Когда выбор авторизации подразумевает предпочтительного поставщика, подключение предварительно фильтрует средства выбора модели по умолчанию и allowlist до этого поставщика. Для Volcengine и BytePlus это также сопоставляет варианты coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Если фильтр предпочтительного поставщика пока не дает загруженных моделей, подключение откатывается к нефильтрованному каталогу вместо того, чтобы оставлять средство выбора пустым.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Некоторые поставщики веб-поиска вызывают дополнительные запросы, специфичные для поставщика:

    - **Grok** может предложить необязательную настройку `x_search` с тем же профилем xAI OAuth или ключом API и выбором модели `x_search`.
    - **Kimi** может запросить регион Moonshot API (`api.moonshot.ai` или `api.moonshot.cn`) и модель веб-поиска Kimi по умолчанию.

  </Accordion>
  <Accordion title="Other behaviors">
    - Поведение области DM при локальном подключении: [справочник настройки CLI](/ru/start/wizard-cli-reference#outputs-and-internals).
    - Самый быстрый первый чат: `openclaw dashboard` (Control UI, без настройки канала).
    - Пользовательский поставщик: подключите любую OpenAI- или Anthropic-совместимую конечную точку, включая размещенных поставщиков, которых нет в списке. Используйте Unknown для автоопределения.
    - Если обнаружено состояние Hermes, подключение предлагает поток миграции. Используйте [Миграция](/ru/cli/migrate) для планов dry-run, режима перезаписи, отчетов и точных сопоставлений.

  </Accordion>
</AccordionGroup>

## Распространенные последующие команды

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Используйте `openclaw setup` как ту же входную точку пошагового подключения. Используйте `openclaw setup --baseline`, когда нужна только базовая конфигурация/рабочая область, `openclaw configure` позже для целевых изменений и `openclaw channels add` для настройки только каналов.

<Note>
`--json` не подразумевает неинтерактивный режим. Используйте `--non-interactive` для скриптов.
</Note>
