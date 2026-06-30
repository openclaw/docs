---
read_when:
    - Вам нужно подробное описание поведения для `openclaw onboard`
    - Вы отлаживаете результаты онбординга или интегрируете клиенты онбординга
sidebarTitle: CLI reference
summary: Полный справочник по процессу настройки CLI, настройке аутентификации и моделей, выводам и внутреннему устройству
title: Справочник по настройке CLI
x-i18n:
    generated_at: "2026-06-30T22:28:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be3e95a300707eade19f5c7fdf6f3a330ffe7e1e83866b36fb9bd1f742256ef
    source_path: start/wizard-cli-reference.md
    workflow: 16
---

Эта страница является полным справочником по `openclaw onboard`.
Краткое руководство см. в [Онбординг (CLI)](/ru/start/wizard).

## Что делает мастер

Локальный режим (по умолчанию) проведет вас через:

- Настройку модели и аутентификации (OAuth для подписки OpenAI Code, Anthropic Claude CLI или API-ключ, а также варианты MiniMax, GLM, Ollama, Moonshot, StepFun и AI Gateway)
- Расположение рабочей области и загрузочные файлы
- Настройки Gateway (порт, привязка, аутентификация, Tailscale)
- Каналы и провайдеры (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, iMessage и другие встроенные Plugin каналов)
- Установку демона (LaunchAgent, пользовательский systemd unit или штатная задача Windows Scheduled Task с запасным вариантом через папку автозагрузки)
- Проверку работоспособности
- Настройку Skills

Удаленный режим настраивает этот компьютер для подключения к Gateway в другом месте.
Он не устанавливает и не изменяет ничего на удаленном хосте.

## Подробности локального процесса

<Steps>
  <Step title="Обнаружение существующей конфигурации">
    - Если существует `~/.openclaw/openclaw.json`, выберите Keep, Modify или Reset.
    - Повторный запуск мастера ничего не стирает, если вы явно не выберете Reset (или не передадите `--reset`).
    - CLI `--reset` по умолчанию использует `config+creds+sessions`; используйте `--reset-scope full`, чтобы также удалить рабочую область.
    - Если конфигурация недействительна или содержит устаревшие ключи, мастер останавливается и просит запустить `openclaw doctor` перед продолжением.
    - Reset использует `trash` и предлагает области:
      - Только конфигурация
      - Конфигурация + учетные данные + сеансы
      - Полный сброс (также удаляет рабочую область)

  </Step>
  <Step title="Модель и аутентификация">
    - Полная матрица вариантов находится в разделе [Варианты аутентификации и моделей](#auth-and-model-options).

  </Step>
  <Step title="Рабочая область">
    - По умолчанию `~/.openclaw/workspace` (настраивается).
    - Добавляет исходные файлы рабочей области, необходимые для загрузочного ритуала первого запуска.
    - Структура рабочей области: [Рабочая область агента](/ru/concepts/agent-workspace).

  </Step>
  <Step title="Gateway">
    - Запрашивает порт, привязку, режим аутентификации и доступ через Tailscale.
    - Рекомендуется: оставьте токенную аутентификацию включенной даже для loopback, чтобы локальные WS-клиенты проходили аутентификацию.
    - В токенном режиме интерактивная настройка предлагает:
      - **Сгенерировать/сохранить токен в открытом виде** (по умолчанию)
      - **Использовать SecretRef** (по выбору)
    - В режиме пароля интерактивная настройка также поддерживает хранение в открытом виде или через SecretRef.
    - Неинтерактивный путь SecretRef для токена: `--gateway-token-ref-env <ENV_VAR>`.
      - Требует непустую переменную среды в окружении процесса онбординга.
      - Нельзя сочетать с `--gateway-token`.
    - Отключайте аутентификацию только если вы полностью доверяете каждому локальному процессу.
    - Привязки не к loopback все равно требуют аутентификации.

  </Step>
  <Step title="Каналы">
    - [WhatsApp](/ru/channels/whatsapp): необязательный вход по QR
    - [Telegram](/ru/channels/telegram): токен бота
    - [Discord](/ru/channels/discord): токен бота
    - [Google Chat](/ru/channels/googlechat): JSON сервисного аккаунта + аудитория Webhook
    - [Mattermost](/ru/channels/mattermost): токен бота + базовый URL
    - [Signal](/ru/channels/signal): необязательная установка `signal-cli` + конфигурация аккаунта
    - [iMessage](/ru/channels/imessage): путь к CLI `imsg` + доступ к БД Messages; используйте SSH-обертку, когда Gateway работает не на Mac
    - Безопасность личных сообщений: по умолчанию используется сопряжение. Первое личное сообщение отправляет код; подтвердите через
      `openclaw pairing approve <channel> <code>` или используйте списки разрешений.
  </Step>
  <Step title="Установка демона">
    - macOS: LaunchAgent
      - Требует сеанс вошедшего пользователя; для headless-сред используйте пользовательский LaunchDaemon (не поставляется).
    - Linux и Windows через WSL2: пользовательский systemd unit
      - Мастер пытается выполнить `loginctl enable-linger <user>`, чтобы gateway продолжал работать после выхода из системы.
      - Может запросить sudo (записывает в `/var/lib/systemd/linger`); сначала он пробует без sudo.
    - Нативная Windows: сначала Scheduled Task
      - Если создание задачи запрещено, OpenClaw возвращается к пользовательскому элементу входа в папке автозагрузки и немедленно запускает gateway.
      - Scheduled Tasks остаются предпочтительными, потому что дают лучший статус супервизора.
    - Выбор среды выполнения: Node (рекомендуется; требуется для WhatsApp и Telegram). Bun не рекомендуется.

  </Step>
  <Step title="Проверка работоспособности">
    - Запускает gateway (если нужно) и выполняет `openclaw health`.
    - `openclaw status --deep` добавляет в вывод статуса живую проверку работоспособности gateway, включая проверки каналов, когда они поддерживаются.

  </Step>
  <Step title="Skills">
    - Читает доступные Skills и проверяет требования.
    - Позволяет выбрать менеджер node: npm, pnpm или bun.
    - Устанавливает необязательные зависимости (некоторые используют Homebrew на macOS).

  </Step>
  <Step title="Завершение">
    - Сводка и дальнейшие шаги, включая варианты приложений для iOS, Android и macOS.

  </Step>
</Steps>

<Note>
Если GUI не обнаружен, мастер выводит инструкции SSH port-forward для Control UI вместо открытия браузера.
Если ресурсы Control UI отсутствуют, мастер пытается собрать их; запасной вариант — `pnpm ui:build` (автоматически устанавливает зависимости UI).
</Note>

## Подробности удаленного режима

Удаленный режим настраивает этот компьютер для подключения к Gateway в другом месте.

<Info>
Удаленный режим не устанавливает и не изменяет ничего на удаленном хосте.
</Info>

Что вы задаете:

- URL удаленного Gateway (`ws://...`)
- Токен, если удаленный Gateway требует аутентификацию (рекомендуется)

<Note>
- Если gateway доступен только через loopback, используйте SSH-туннелирование или tailnet.
- Подсказки обнаружения:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)

</Note>

## Варианты аутентификации и моделей

<AccordionGroup>
  <Accordion title="API-ключ Anthropic">
    Использует `ANTHROPIC_API_KEY`, если он задан, или запрашивает ключ, а затем сохраняет его для использования демоном.
  </Accordion>
  <Accordion title="Подписка OpenAI Code (OAuth)">
    Поток через браузер; вставьте `code#state`.

    Устанавливает `agents.defaults.model` в `openai/gpt-5.5` через среду выполнения Codex, когда модель не задана или уже относится к семейству OpenAI.

  </Accordion>
  <Accordion title="Подписка OpenAI Code (сопряжение устройства)">
    Поток браузерного сопряжения с краткоживущим кодом устройства.

    Устанавливает `agents.defaults.model` в `openai/gpt-5.5` через среду выполнения Codex, когда модель не задана или уже относится к семейству OpenAI.

  </Accordion>
  <Accordion title="API-ключ OpenAI">
    Использует `OPENAI_API_KEY`, если он задан, или запрашивает ключ, а затем сохраняет учетные данные в профилях аутентификации.

    Устанавливает `agents.defaults.model` в `openai/gpt-5.5`, когда модель не задана, является `openai/*` или устаревшей ссылкой на модель Codex.

  </Accordion>
  <Accordion title="xAI (Grok) OAuth">
    Вход через браузер для подходящих аккаунтов SuperGrok или X Premium. Это
    рекомендуемый путь xAI для большинства пользователей. OpenClaw сохраняет полученный профиль
    аутентификации для моделей Grok, Grok `web_search`, `x_search` и `code_execution`.
  </Accordion>
  <Accordion title="xAI (Grok) код устройства">
    Удобный для удаленного доступа вход через браузер с коротким кодом вместо callback
    на localhost. Используйте это из SSH, Docker или VPS-хостов.
  </Accordion>
  <Accordion title="API-ключ xAI (Grok)">
    Запрашивает `XAI_API_KEY` и настраивает xAI как провайдера моделей. Используйте это,
    когда вам нужен API-ключ xAI Console вместо подписочного OAuth.
  </Accordion>
  <Accordion title="OpenCode">
    Запрашивает `OPENCODE_API_KEY` (или `OPENCODE_ZEN_API_KEY`) и позволяет выбрать каталог Zen или Go.
    URL настройки: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-ключ (универсальный)">
    Сохраняет ключ для вас.
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
    Конфигурация записывается автоматически для StepFun standard или Step Plan на китайских или глобальных конечных точках.
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
    Режимы на базе хоста запрашивают базовый URL (по умолчанию `http://127.0.0.1:11434`), обнаруживают доступные модели и предлагают значения по умолчанию.
    `Cloud + Local` также проверяет, выполнен ли вход на этом хосте Ollama для облачного доступа.
    Подробнее: [Ollama](/ru/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot и Kimi Coding">
    Конфигурации Moonshot (Kimi K2) и Kimi Coding записываются автоматически.
    Подробнее: [Moonshot AI (Kimi + Kimi Coding)](/ru/providers/moonshot).
  </Accordion>
  <Accordion title="Пользовательский провайдер">
    Работает с OpenAI-совместимыми и Anthropic-совместимыми конечными точками.

    Интерактивный онбординг поддерживает те же варианты хранения API-ключей, что и другие потоки API-ключей провайдеров:
    - **Вставить API-ключ сейчас** (открытый текст)
    - **Использовать ссылку на секрет** (ссылка env или настроенная ссылка провайдера, с предварительной проверкой)

    Неинтерактивные флаги:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необязательно; использует `CUSTOM_API_KEY` как запасной вариант)
    - `--custom-provider-id` (необязательно)
    - `--custom-compatibility <openai|openai-responses|anthropic>` (необязательно; по умолчанию `openai`)
    - `--custom-image-input` / `--custom-text-input` (необязательно; переопределяет выведенную возможность ввода модели)

  </Accordion>
  <Accordion title="Пропустить">
    Оставляет аутентификацию ненастроенной.
  </Accordion>
</AccordionGroup>

Поведение модели:

- Выберите модель по умолчанию из обнаруженных вариантов или введите провайдера и модель вручную.
- Онбординг пользовательского провайдера выводит поддержку изображений для распространенных ID моделей и спрашивает только когда имя модели неизвестно.
- Когда онбординг начинается с выбора аутентификации провайдера, средство выбора модели автоматически предпочитает
  этого провайдера. Для Volcengine и BytePlus то же предпочтение
  также совпадает с их вариантами coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Если этот фильтр предпочтительного провайдера оказался бы пустым, средство выбора возвращается к
  полному каталогу вместо отображения отсутствия моделей.
- Мастер выполняет проверку модели и предупреждает, если настроенная модель неизвестна или отсутствует аутентификация.

Пути учетных данных и профилей:

- Профили аутентификации (API-ключи + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Импорт устаревшего OAuth: `~/.openclaw/credentials/oauth.json`

Режим хранения учетных данных:

- По умолчанию первичная настройка сохраняет API-ключи как значения открытым текстом в профилях аутентификации.
- `--secret-input-mode ref` включает режим ссылок вместо хранения ключей открытым текстом.
  В интерактивной настройке можно выбрать один из вариантов:
  - ссылка на переменную окружения (например, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ссылка на настроенного провайдера (`file` или `exec`) с псевдонимом провайдера + id
- Интерактивный режим ссылок выполняет быструю предварительную проверку перед сохранением.
  - Ссылки на env: проверяет имя переменной + непустое значение в текущем окружении первичной настройки.
  - Ссылки на провайдера: проверяет конфигурацию провайдера и разрешает запрошенный id.
  - Если предварительная проверка не проходит, первичная настройка показывает ошибку и позволяет повторить попытку.
- В неинтерактивном режиме `--secret-input-mode ref` поддерживается только через env.
  - Задайте env-переменную провайдера в окружении процесса первичной настройки.
  - Флаги ключей напрямую (например, `--openai-api-key`) требуют, чтобы эта env-переменная была задана; иначе первичная настройка быстро завершается ошибкой.
  - Для пользовательских провайдеров неинтерактивный режим `ref` сохраняет `models.providers.<id>.apiKey` как `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - В этом случае пользовательского провайдера `--custom-api-key` требует, чтобы `CUSTOM_API_KEY` был задан; иначе первичная настройка быстро завершается ошибкой.
- Учетные данные аутентификации Gateway поддерживают варианты открытым текстом и SecretRef в интерактивной настройке:
  - Режим токена: **Сгенерировать/сохранить токен открытым текстом** (по умолчанию) или **Использовать SecretRef**.
  - Режим пароля: открытый текст или SecretRef.
- Неинтерактивный путь Token SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
- Существующие настройки с открытым текстом продолжают работать без изменений.

<Note>
Совет для безголовых и серверных сред: завершите OAuth на машине с браузером, затем скопируйте
`auth-profiles.json` этого агента (например
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` или соответствующий
путь `$OPENCLAW_STATE_DIR/...`) на хост Gateway. `credentials/oauth.json`
является только устаревшим источником импорта.
</Note>

## Выводы и внутренние данные

Типичные поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap`, когда передан `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (если выбран Minimax)
- `tools.profile` (локальная первичная настройка по умолчанию использует `"coding"`, если значение не задано; существующие явные значения сохраняются)
- `gateway.*` (режим, привязка, аутентификация, Tailscale)
- `session.dmScope` (локальная первичная настройка по умолчанию задает `per-channel-peer`, если значение не задано; существующие явные значения сохраняются)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Списки разрешенных каналов (Slack, Discord, Matrix, Microsoft Teams), когда вы соглашаетесь на это во время подсказок (имена по возможности разрешаются в ID)
- `skills.install.nodeManager`
  - Флаг `setup --node-manager` принимает `npm`, `pnpm` или `bun`.
  - Ручная конфигурация по-прежнему может позже задать `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`
- `wizard.securityAcknowledgedAt`

`openclaw agents add` записывает `agents.list[]` и необязательные `bindings`.

Учетные данные WhatsApp размещаются в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сессии хранятся в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Некоторые каналы поставляются как plugins. При выборе во время настройки мастер
предлагает установить plugin (npm или локальный путь) перед конфигурацией канала.
</Note>

RPC мастера Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клиенты (приложение macOS и Control UI) могут отображать шаги без повторной реализации логики первичной настройки.

Поведение настройки Signal:

- Загружает подходящий артефакт релиза
- Сохраняет его в `~/.openclaw/tools/signal-cli/<version>/`
- Записывает `channels.signal.cliPath` в конфигурацию
- Сборки JVM требуют Java 21
- Нативные сборки используются, когда доступны
- Windows использует WSL2 и следует Linux-процессу signal-cli внутри WSL

## Связанные документы

- Центр первичной настройки: [Первичная настройка (CLI)](/ru/start/wizard)
- Автоматизация и скрипты: [Автоматизация CLI](/ru/start/wizard-cli-automation)
- Справочник команд: [`openclaw onboard`](/ru/cli/onboard)
