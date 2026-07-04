---
read_when:
    - Вам нужно подробное описание поведения openclaw onboard
    - Вы отлаживаете результаты онбординга или интегрируете клиенты онбординга
sidebarTitle: CLI reference
summary: Полный справочник по процессу настройки CLI, настройке аутентификации и моделей, выходным данным и внутреннему устройству
title: Справочник по настройке CLI
x-i18n:
    generated_at: "2026-07-04T06:44:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 016ea0c85cefd5cc70d0988e82f2cbb5898c0ae3134f68df645dddb58c2dfe9a
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Эта страница является полным справочником по `openclaw onboard`.
Краткое руководство см. в [Онбординг (CLI)](/ru/start/wizard).

## Что делает мастер

Локальный режим (по умолчанию) проводит вас через:

- Настройку модели и аутентификации (OAuth для подписки OpenAI Code, Anthropic Claude CLI или API-ключ, а также варианты MiniMax, GLM, Ollama, Moonshot, StepFun и AI Gateway)
- Расположение рабочей области и файлы начальной настройки
- Настройки Gateway (порт, привязка, аутентификация, Tailscale)
- Каналы и провайдеры (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage и другие встроенные канальные plugins)
- Установку демона (LaunchAgent, пользовательский юнит systemd или нативная задача Windows Scheduled Task с резервным вариантом через папку автозагрузки)
- Проверку работоспособности
- Настройку Skills

Удаленный режим настраивает эту машину для подключения к Gateway в другом месте.
Он не устанавливает и не изменяет ничего на удаленном хосте.

## Подробности локального сценария

<Steps>
  <Step title="Обнаружение существующей конфигурации">
    - Если `~/.openclaw/openclaw.json` существует, выберите сохранение, изменение или сброс.
    - Повторный запуск мастера ничего не стирает, если вы явно не выберете сброс (или не передадите `--reset`).
    - CLI `--reset` по умолчанию использует `config+creds+sessions`; используйте `--reset-scope full`, чтобы также удалить рабочую область.
    - Если конфигурация недействительна или содержит устаревшие ключи, мастер останавливается и просит запустить `openclaw doctor` перед продолжением.
    - Сброс использует `trash` и предлагает области:
      - Только конфигурация
      - Конфигурация + учетные данные + сеансы
      - Полный сброс (также удаляет рабочую область)

  </Step>
  <Step title="Модель и аутентификация">
    - Полная матрица вариантов находится в разделе [Параметры аутентификации и моделей](#auth-and-model-options).

  </Step>
  <Step title="Рабочая область">
    - По умолчанию `~/.openclaw/workspace` (настраивается).
    - Добавляет в рабочую область файлы, нужные для ритуала начальной загрузки при первом запуске.
    - Структура рабочей области: [Рабочая область агента](/ru/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Запрашивает порт, привязку, режим аутентификации и экспозицию Tailscale.
    - Рекомендуется: оставьте аутентификацию по токену включенной даже для loopback, чтобы локальные WS-клиенты должны были проходить аутентификацию.
    - В режиме токена интерактивная настройка предлагает:
      - **Создать/сохранить токен в открытом виде** (по умолчанию)
      - **Использовать SecretRef** (по выбору)
    - В режиме пароля интерактивная настройка также поддерживает хранение в открытом виде или через SecretRef.
    - Неинтерактивный путь SecretRef для токена: `--gateway-token-ref-env <ENV_VAR>`.
      - Требует непустую переменную среды в окружении процесса онбординга.
      - Нельзя сочетать с `--gateway-token`.
    - Отключайте аутентификацию только если полностью доверяете каждому локальному процессу.
    - Привязки не к loopback по-прежнему требуют аутентификации.

  </Step>
  <Step title="Каналы">
    - [WhatsApp](/ru/channels/whatsapp): необязательный вход по QR
    - [Telegram](/ru/channels/telegram): токен бота
    - [Discord](/ru/channels/discord): токен бота
    - [Google Chat](/ru/channels/googlechat): JSON сервисного аккаунта + аудитория Webhook
    - [Mattermost](/ru/channels/mattermost): токен бота + базовый URL
    - [Signal](/ru/channels/signal): необязательная установка `signal-cli` + конфигурация аккаунта
    - [iMessage](/ru/channels/imessage): путь к CLI `imsg` + доступ к базе данных Messages; используйте SSH-обертку, когда Gateway работает не на Mac
    - Безопасность личных сообщений: по умолчанию используется связывание. Первое личное сообщение отправляет код; подтвердите через
      `openclaw pairing approve <channel> <code>` или используйте списки разрешений.
  </Step>
  <Step title="Установка демона">
    - macOS: LaunchAgent
      - Требует сеанс вошедшего пользователя; для headless-режима используйте собственный LaunchDaemon (не поставляется).
    - Linux и Windows через WSL2: пользовательский юнит systemd
      - Мастер пытается выполнить `loginctl enable-linger <user>`, чтобы gateway продолжал работать после выхода из системы.
      - Может запросить sudo (записывает в `/var/lib/systemd/linger`); сначала пытается без sudo.
    - Нативная Windows: сначала Scheduled Task
      - Если создание задачи запрещено, OpenClaw откатывается к пользовательскому элементу входа в папке автозагрузки и сразу запускает gateway.
      - Scheduled Tasks остаются предпочтительным вариантом, потому что дают лучший статус супервизора.
    - Выбор runtime: Node (рекомендуется; требуется для WhatsApp и Telegram). Bun не рекомендуется.

  </Step>
  <Step title="Проверка работоспособности">
    - Запускает gateway (если нужно) и выполняет `openclaw health`.
    - `openclaw status --deep` добавляет к выводу статуса живую проверку работоспособности gateway, включая проверки каналов, когда они поддерживаются.

  </Step>
  <Step title="Skills">
    - Читает доступные skills и проверяет требования.
    - Позволяет выбрать менеджер node: npm, pnpm или bun.
    - Устанавливает необязательные зависимости для доверенных встроенных skills, когда требуемый
      установщик доступен.
    - Пропускает недоступные установщики Homebrew, uv и Go, затем группирует затронутые
      skills с указаниями по ручной настройке. Запустите `openclaw doctor` после установки
      отсутствующих предварительных требований.

  </Step>
  <Step title="Завершение">
    - Сводка и следующие шаги, включая варианты приложений для iOS, Android и macOS.

  </Step>
</Steps>

<Note>
Если GUI не обнаружен, мастер печатает инструкции по SSH-пробросу портов для Control UI вместо открытия браузера.
Если ресурсы Control UI отсутствуют, мастер пытается собрать их; резервный вариант — `pnpm ui:build` (автоматически устанавливает зависимости UI).
</Note>

## Подробности удаленного режима

Удаленный режим настраивает эту машину для подключения к Gateway в другом месте.

<Info>
Удаленный режим не устанавливает и не изменяет ничего на удаленном хосте.
</Info>

Что вы задаете:

- URL удаленного gateway (`ws://...`)
- Токен, если удаленный gateway требует аутентификацию (рекомендуется)

<Note>
- Если gateway доступен только через loopback, используйте SSH-туннелирование или tailnet.
- Подсказки обнаружения:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Параметры аутентификации и моделей

<AccordionGroup>
  <Accordion title="API-ключ Anthropic">
    Использует `ANTHROPIC_API_KEY`, если он задан, или запрашивает ключ, затем сохраняет его для использования демоном.
  </Accordion>
  <Accordion title="Подписка OpenAI Code (OAuth)">
    Поток через браузер; вставьте `code#state`.

    Устанавливает `agents.defaults.model` в `openai/gpt-5.5` через Codex runtime, когда модель не задана или уже относится к семейству OpenAI.

  </Accordion>
  <Accordion title="Подписка OpenAI Code (связывание устройства)">
    Поток связывания через браузер с краткоживущим кодом устройства.

    Устанавливает `agents.defaults.model` в `openai/gpt-5.5` через Codex runtime, когда модель не задана или уже относится к семейству OpenAI.

  </Accordion>
  <Accordion title="API-ключ OpenAI">
    Использует `OPENAI_API_KEY`, если он задан, или запрашивает ключ, затем сохраняет учетные данные в профилях аутентификации.

    Устанавливает `agents.defaults.model` в `openai/gpt-5.5`, когда модель не задана, имеет вид `openai/*` или является устаревшей ссылкой на модель Codex.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Вход через браузер для подходящих аккаунтов SuperGrok или X Premium. Это
    рекомендуемый путь xAI для большинства пользователей. OpenClaw сохраняет полученный профиль
    аутентификации для моделей Grok, Grok `web_search`, `x_search` и `code_execution`.
  </Accordion>
  <Accordion title="xAI (Grok) код устройства">
    Удобный для удаленных хостов вход через браузер с коротким кодом вместо localhost
    callback. Используйте это из SSH, Docker или VPS-хостов.
  </Accordion>
  <Accordion title="API-ключ xAI (Grok)">
    Запрашивает `XAI_API_KEY` и настраивает xAI как провайдера моделей. Используйте это,
    когда нужен API-ключ xAI Console вместо OAuth по подписке.
  </Accordion>
  <Accordion title="OpenCode">
    Запрашивает `OPENCODE_API_KEY` (или `OPENCODE_ZEN_API_KEY`) и позволяет выбрать каталог Zen или Go.
    URL настройки: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-ключ (универсальный)">
    Сохраняет ключ за вас.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Запрашивает `AI_GATEWAY_API_KEY`.
    Подробнее: [Vercel AI Gateway](/ru/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Запрашивает ID аккаунта, ID gateway и `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Подробнее: [Cloudflare AI Gateway](/ru/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Конфигурация записывается автоматически. Размещенное значение по умолчанию — `MiniMax-M3`; настройка с API-ключом использует
    `minimax/...`, а настройка OAuth использует `minimax-portal/...`.
    Подробнее: [MiniMax](/ru/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфигурация записывается автоматически для стандартного StepFun или Step Plan на китайских или глобальных конечных точках.
    Standard сейчас включает `step-3.5-flash`, а Step Plan также включает `step-3.5-flash-2603`.
    Подробнее: [StepFun](/ru/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (совместимый с Anthropic)">
    Запрашивает `SYNTHETIC_API_KEY`.
    Подробнее: [Synthetic](/ru/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (облачные и локальные открытые модели)">
    Сначала запрашивает `Cloud + Local`, `Cloud only` или `Local only`.
    `Cloud only` использует `OLLAMA_API_KEY` с `https://ollama.com`.
    Режимы с хостом запрашивают базовый URL (по умолчанию `http://127.0.0.1:11434`), обнаруживают доступные модели и предлагают значения по умолчанию.
    `Cloud + Local` также проверяет, вошел ли этот хост Ollama для облачного доступа.
    Подробнее: [Ollama](/ru/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot и Kimi Coding">
    Конфигурации Moonshot (Kimi K2) и Kimi Coding записываются автоматически.
    Подробнее: [Moonshot AI (Kimi + Kimi Coding)](/ru/providers/moonshot).
  </Accordion>
  <Accordion title="Пользовательский провайдер">
    Работает с конечными точками, совместимыми с OpenAI и Anthropic.

    Интерактивный онбординг поддерживает те же варианты хранения API-ключа, что и другие потоки API-ключей провайдеров:
    - **Вставить API-ключ сейчас** (открытый текст)
    - **Использовать ссылку на секрет** (ссылка env или настроенная ссылка провайдера, с предварительной проверкой)

    Неинтерактивные флаги:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необязательно; откатывается к `CUSTOM_API_KEY`)
    - `--custom-provider-id` (необязательно)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (необязательно; по умолчанию `openai`)
    - `--custom-image-input` / `--custom-text-input` (необязательно; переопределяют выведенную возможность ввода модели)

  </Accordion>
  <Accordion title="Пропустить">
    Оставляет аутентификацию ненастроенной.
  </Accordion>
</AccordionGroup>

Поведение моделей:

- Выберите модель по умолчанию из обнаруженных вариантов или введите провайдера и модель вручную.
- Онбординг пользовательского провайдера выводит поддержку изображений для распространенных ID моделей и спрашивает только когда имя модели неизвестно.
- Когда онбординг запускается с выбора аутентификации провайдера, выбор модели автоматически предпочитает
  этого провайдера. Для Volcengine и BytePlus то же предпочтение
  также сопоставляется с их вариантами coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Если фильтр по предпочитаемому провайдеру оказался бы пустым, средство выбора откатывается к
  полному каталогу вместо показа отсутствия моделей.
- Мастер выполняет проверку модели и предупреждает, если настроенная модель неизвестна или отсутствует аутентификация.

Пути учетных данных и профилей:

- Профили аутентификации (API-ключи + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Импорт устаревшего OAuth: `~/.openclaw/credentials/oauth.json`

Режим хранения учетных данных:

- Поведение onboarding по умолчанию сохраняет API-ключи как значения открытым текстом в профилях аутентификации.
- `--secret-input-mode ref` включает режим ссылок вместо хранения ключей открытым текстом.
  В интерактивной настройке можно выбрать один из вариантов:
  - ссылка на переменную окружения (например, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ссылка на настроенный provider (`file` или `exec`) с псевдонимом provider + id
- Интерактивный режим ссылок выполняет быструю предварительную проверку перед сохранением.
  - Ссылки Env: проверяет имя переменной + непустое значение в текущем окружении onboarding.
  - Ссылки provider: проверяет конфигурацию provider и разрешает запрошенный id.
  - Если предварительная проверка завершается ошибкой, onboarding показывает ошибку и позволяет повторить попытку.
- В неинтерактивном режиме `--secret-input-mode ref` поддерживается только через env.
  - Задайте env-переменную provider в окружении процесса onboarding.
  - Inline-флаги ключей (например, `--openai-api-key`) требуют, чтобы эта env-переменная была задана; иначе onboarding быстро завершится ошибкой.
  - Для пользовательских providers неинтерактивный режим `ref` сохраняет `models.providers.<id>.apiKey` как `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - В этом случае с пользовательским provider `--custom-api-key` требует, чтобы `CUSTOM_API_KEY` был задан; иначе onboarding быстро завершится ошибкой.
- Учетные данные аутентификации Gateway поддерживают выбор между открытым текстом и SecretRef в интерактивной настройке:
  - Режим токена: **Сгенерировать/сохранить токен открытым текстом** (по умолчанию) или **Использовать SecretRef**.
  - Режим пароля: открытый текст или SecretRef.
- Неинтерактивный путь Token SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
- Существующие настройки с открытым текстом продолжают работать без изменений.

<Note>
Совет для headless- и серверной среды: завершите OAuth на машине с браузером, затем скопируйте
`auth-profiles.json` этого агента (например,
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` или соответствующий
путь `$OPENCLAW_STATE_DIR/...`) на хост Gateway. `credentials/oauth.json`
является только устаревшим источником импорта.
</Note>

## Выходные данные и внутреннее устройство

Типичные поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, когда передан `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (если выбран Minimax)
- `tools.profile` (локальный onboarding по умолчанию использует `"coding"`, если значение не задано; существующие явно заданные значения сохраняются)
- `gateway.*` (режим, привязка, аутентификация, tailscale)
- `session.dmScope` (локальный onboarding по умолчанию задает это как `per-channel-peer`, если значение не задано; существующие явно заданные значения сохраняются)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlist каналов (Slack, Discord, Matrix, Microsoft Teams), когда вы соглашаетесь на это во время prompts (имена разрешаются в ID, когда возможно)
- `skills.install.nodeManager`
  - Флаг `setup --node-manager` принимает `npm`, `pnpm` или `bun`.
  - Ручная конфигурация может позже по-прежнему задать `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` записывает `agents.list[]` и необязательные `bindings`.

Учетные данные WhatsApp помещаются в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сессии хранятся в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Некоторые каналы поставляются как plugins. При выборе во время настройки wizard
предлагает установить Plugin (npm или локальный путь) перед конфигурацией канала.
</Note>

RPC wizard Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клиенты (приложение macOS и Control UI) могут отображать шаги без повторной реализации логики onboarding.

Поведение настройки Signal:

- Загружает подходящий release asset
- Сохраняет его в `~/.openclaw/tools/signal-cli/<version>/`
- Записывает `channels.signal.cliPath` в конфигурацию
- JVM-сборки требуют Java 21
- Native-сборки используются, когда доступны
- Windows использует WSL2 и следует Linux-процессу signal-cli внутри WSL

## Связанные документы

- Центр onboarding: [Onboarding (CLI)](/ru/start/wizard)
- Автоматизация и скрипты: [Автоматизация CLI](/ru/start/wizard-cli-automation)
- Справочник команд: [`openclaw onboard`](/ru/cli/onboard)
