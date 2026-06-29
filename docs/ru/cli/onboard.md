---
read_when:
    - Вам нужна пошаговая настройка gateway, рабочего пространства, аутентификации, каналов и skills
summary: Справочник CLI для `openclaw onboard` (интерактивная первичная настройка)
title: Подключение
x-i18n:
    generated_at: "2026-06-28T22:44:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ffee6b90e72f1859634fbd7ccac2f44e88bc37879b9e5b099c33b760cc0e9af
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Полное пошаговое подключение для локальной или удаленной настройки Gateway. Используйте это, когда хотите, чтобы OpenClaw провел вас через аутентификацию модели, рабочую область, Gateway, каналы, Skills и проверку работоспособности в одном процессе.

## Связанные руководства

<CardGroup cols={2}>
  <Card title="Центр подключения CLI" href="/ru/start/wizard" icon="rocket">
    Пошаговое описание интерактивного процесса CLI.
  </Card>
  <Card title="Обзор подключения" href="/ru/start/onboarding-overview" icon="map">
    Как устроено подключение в OpenClaw.
  </Card>
  <Card title="Справочник по настройке CLI" href="/ru/start/wizard-cli-reference" icon="book">
    Вывод, внутреннее устройство и поведение каждого шага.
  </Card>
  <Card title="Автоматизация CLI" href="/ru/start/wizard-cli-automation" icon="terminal">
    Неинтерактивные флаги и скриптовые настройки.
  </Card>
  <Card title="Подключение приложения для macOS" href="/ru/start/onboarding" icon="apple">
    Процесс подключения для приложения в строке меню macOS.
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

`--flow import` использует поставщиков миграции, принадлежащих плагинам, например Hermes. Он запускается только для свежей установки OpenClaw; если уже есть конфигурация, учетные данные, сессии или файлы памяти/идентичности рабочей области, перед импортом сбросьте их или выберите свежую настройку.

`--modern` запускает предварительную версию диалогового подключения Crestodian. Без
`--modern` команда `openclaw onboard` сохраняет классический процесс подключения.

При свежей установке, если активный файл конфигурации отсутствует или не содержит
пользовательских настроек (пустой или только с метаданными), простой `openclaw` также запускает классический
процесс подключения. Когда файл конфигурации уже содержит пользовательские настройки, простой `openclaw`
открывает Crestodian.

Открытый текст `ws://` принимается для loopback, литералов частных IP, `.local` и
URL Gateway Tailnet `*.ts.net`. Для других доверенных имен частного DNS задайте
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
подчеркивание или суффиксы POSIX, например `zh_CN.UTF-8`. Имена продуктов, имена
команд, ключи конфигурации, URL, идентификаторы поставщиков, идентификаторы моделей и метки плагинов/каналов
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

`--custom-api-key` необязателен в неинтерактивном режиме. Если он опущен, подключение проверяет `CUSTOM_API_KEY`.
OpenClaw автоматически помечает распространенные идентификаторы моделей для зрения как поддерживающие изображения. Передайте `--custom-image-input` для неизвестных пользовательских идентификаторов моделей зрения или `--custom-text-input`, чтобы принудительно задать метаданные только для текста.
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

`--custom-base-url` по умолчанию равен `http://127.0.0.1:11434`. `--custom-model-id` необязателен; если он опущен, подключение использует рекомендуемые значения Ollama по умолчанию. Облачные идентификаторы моделей, такие как `kimi-k2.5:cloud`, также работают здесь.

Храните ключи поставщиков как ссылки вместо открытого текста:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

С `--secret-input-mode ref` подключение записывает ссылки на основе переменных окружения вместо значений ключей в открытом тексте.
Для поставщиков на основе профиля аутентификации это записывает записи `keyRef`; для пользовательских поставщиков это записывает `models.providers.<id>.apiKey` как ссылку на переменную окружения (например, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неинтерактивного режима `ref`:

- Задайте переменную окружения поставщика в окружении процесса подключения (например, `OPENAI_API_KEY`).
- Не передавайте встроенные флаги ключей (например, `--openai-api-key`), если эта переменная окружения также не задана.
- Если встроенный флаг ключа передан без обязательной переменной окружения, подключение быстро завершается ошибкой с подсказками.

Параметры токена Gateway в неинтерактивном режиме:

- `--gateway-auth token --gateway-token <token>` сохраняет токен в открытом тексте.
- `--gateway-auth token --gateway-token-ref-env <name>` сохраняет `gateway.auth.token` как env SecretRef.
- `--gateway-token` и `--gateway-token-ref-env` взаимоисключающие.
- `--gateway-token-ref-env` требует непустую переменную окружения в окружении процесса подключения.
- С `--install-daemon`, когда аутентификация по токену требует токен, управляемые SecretRef токены Gateway проверяются, но не сохраняются как разрешенный открытый текст в метаданных окружения службы супервизора.
- С `--install-daemon`, если режим токена требует токен, а настроенный SecretRef токена не разрешается, подключение завершается закрытой ошибкой с рекомендациями по исправлению.
- С `--install-daemon`, если настроены и `gateway.auth.token`, и `gateway.auth.password`, а `gateway.auth.mode` не задан, подключение блокирует установку, пока режим не будет задан явно.
- Локальное подключение записывает `gateway.mode="local"` в конфигурацию. Если в более позднем файле конфигурации отсутствует `gateway.mode`, считайте это повреждением конфигурации или незавершенной ручной правкой, а не допустимым сокращением локального режима.
- Локальное подключение устанавливает выбранные загружаемые плагины, когда выбранный путь настройки их требует.
- Удаленное подключение записывает только сведения о подключении для удаленного Gateway и не устанавливает локальные пакеты плагинов.
- `--allow-unconfigured` — это отдельный аварийный выход для среды выполнения Gateway. Он не означает, что подключение может опустить `gateway.mode`.

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

Работоспособность локального Gateway в неинтерактивном режиме:

- Если вы не передаете `--skip-health`, подключение ждет доступный локальный Gateway, прежде чем успешно завершиться.
- `--install-daemon` сначала запускает путь установки управляемого Gateway. Без него у вас уже должен быть запущен локальный Gateway, например `openclaw gateway run`.
- Если в автоматизации вам нужны только записи конфигурации/рабочей области/bootstrap, используйте `--skip-health`.
- Если вы сами управляете файлами рабочей области, передайте `--skip-bootstrap`, чтобы задать `agents.defaults.skipBootstrap: true` и пропустить создание `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` и `BOOTSTRAP.md`.
- На нативной Windows `--install-daemon` сначала пробует Scheduled Tasks и откатывается к пользовательскому элементу входа в папке Startup, если создание задачи запрещено.

Поведение интерактивного подключения в режиме ссылок:

- Выберите **Использовать ссылку на секрет**, когда появится запрос.
- Затем выберите один из вариантов:
  - Переменная окружения
  - Настроенный поставщик секретов (`file` или `exec`)
- Перед сохранением ссылки подключение выполняет быструю предварительную проверку.
  - Если проверка завершается ошибкой, подключение показывает ошибку и позволяет повторить попытку.

### Выбор конечных точек Z.AI в неинтерактивном режиме

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

Неинтерактивный пример Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

## Примечания к процессу

<AccordionGroup>
  <Accordion title="Типы процессов">
    - `quickstart`: минимум запросов, автоматически создает токен Gateway.
    - `manual`: полный набор запросов для порта, привязки и аутентификации (псевдоним `advanced`).
    - `import`: запускает обнаруженного поставщика миграции, показывает предварительный план, затем применяет его после подтверждения.

  </Accordion>
  <Accordion title="Предварительная фильтрация поставщиков">
    Когда вариант аутентификации подразумевает предпочтительного поставщика, подключение предварительно фильтрует средства выбора модели по умолчанию и списка разрешенных моделей по этому поставщику. Для Volcengine и BytePlus это также сопоставляет варианты coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Если фильтр предпочтительного поставщика пока не возвращает загруженных моделей, подключение использует нефильтрованный каталог вместо того, чтобы оставлять средство выбора пустым.

  </Accordion>
  <Accordion title="Последующие запросы для веб-поиска">
    Некоторые поставщики веб-поиска запускают дополнительные запросы, специфичные для поставщика:

    - **Grok** может предложить дополнительную настройку `x_search` с тем же профилем OAuth xAI или API-ключом и выбором модели `x_search`.
    - **Kimi** может запросить регион API Moonshot (`api.moonshot.ai` или `api.moonshot.cn`) и модель веб-поиска Kimi по умолчанию.

  </Accordion>
  <Accordion title="Другое поведение">
    - Поведение области DM при локальном подключении: [Справочник по настройке CLI](/ru/start/wizard-cli-reference#outputs-and-internals).
    - Самый быстрый первый чат: `openclaw dashboard` (Control UI, без настройки канала).
    - Пользовательский поставщик: подключите любую конечную точку, совместимую с OpenAI или Anthropic, включая размещенных поставщиков, которых нет в списке. Используйте Unknown для автоматического обнаружения.
    - Если обнаружено состояние Hermes, подключение предлагает процесс миграции. Используйте [Миграцию](/ru/cli/migrate) для планов пробного запуска, режима перезаписи, отчетов и точных сопоставлений.

  </Accordion>
</AccordionGroup>

## Распространенные последующие команды

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Используйте `openclaw setup`, когда вам нужна только базовая конфигурация/рабочая область. Используйте `openclaw configure` позже для целевых изменений и `openclaw channels add` для настройки только канала.

<Note>
`--json` не подразумевает неинтерактивный режим. Используйте `--non-interactive` для скриптов.
</Note>
