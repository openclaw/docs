---
read_when:
    - Поиск конкретного шага онбординга или флага
    - Автоматизация онбординга в неинтерактивном режиме
    - Отладка поведения онбординга
sidebarTitle: Onboarding Reference
summary: 'Полный справочник по первоначальной настройке через CLI: каждый шаг, флаг и поле конфигурации'
title: Справочник по онбордингу
x-i18n:
    generated_at: "2026-06-28T23:46:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 739048d53983febc32adaeab10225a288ae66752bee70cfea500d1664fd8546b
    source_path: reference/wizard.md
    workflow: 16
---

Это полный справочник по `openclaw onboard`.
Общий обзор см. в разделе [Онбординг (CLI)](/ru/start/wizard).

## Подробности потока (локальный режим)

<Steps>
  <Step title="Обнаружение существующей конфигурации">
    - Если `~/.openclaw/openclaw.json` существует, выберите **Сохранить текущие значения**, **Просмотреть и обновить** или **Сбросить перед настройкой**.
    - Повторный запуск онбординга **не** удаляет ничего, если вы явно не выберете **Сброс**
      (или не передадите `--reset`).
    - CLI `--reset` по умолчанию использует `config+creds+sessions`; используйте `--reset-scope full`,
      чтобы также удалить рабочую область.
    - Если конфигурация недействительна или содержит устаревшие ключи, мастер останавливается и просит
      выполнить `openclaw doctor`, прежде чем продолжить.
    - Сброс использует `trash` (никогда `rm`) и предлагает области:
      - Только конфигурация
      - Конфигурация + учетные данные + сеансы
      - Полный сброс (также удаляет рабочую область)

  </Step>
  <Step title="Модель/аутентификация">
    - **Ключ API Anthropic**: использует `ANTHROPIC_API_KEY`, если он есть, или запрашивает ключ, затем сохраняет его для использования демоном.
    - **Ключ API Anthropic**: предпочтительный выбор ассистента Anthropic в onboarding/configure.
    - **setup-token Anthropic**: по-прежнему доступен в onboarding/configure, хотя OpenClaw теперь предпочитает повторно использовать Claude CLI, когда это доступно.
    - **Подписка OpenAI Code (Codex) (OAuth)**: браузерный поток; вставьте `code#state`.
      - Устанавливает `agents.defaults.model` в `openai/gpt-5.5` через среду выполнения Codex, когда модель не задана или уже относится к семейству OpenAI.
    - **Подписка OpenAI Code (Codex) (сопряжение устройства)**: браузерный поток сопряжения с краткоживущим кодом устройства.
      - Устанавливает `agents.defaults.model` в `openai/gpt-5.5` через среду выполнения Codex, когда модель не задана или уже относится к семейству OpenAI.
    - **Ключ API OpenAI**: использует `OPENAI_API_KEY`, если он есть, или запрашивает ключ, затем сохраняет его в профилях аутентификации.
      - Устанавливает `agents.defaults.model` в `openai/gpt-5.5`, когда модель не задана, имеет вид `openai/*` или является устаревшей ссылкой на модель Codex.
    - **xAI (Grok) OAuth / ключ API**: выполняет вход через xAI OAuth при выборе этого варианта или запрашивает `XAI_API_KEY` на пути ключа API и настраивает xAI как поставщика моделей.
    - **OpenCode**: запрашивает `OPENCODE_API_KEY` (или `OPENCODE_ZEN_API_KEY`, получите его на https://opencode.ai/auth) и позволяет выбрать каталог Zen или Go.
    - **Ollama**: сначала предлагает **Облако + локально**, **Только облако** или **Только локально**. `Cloud only` запрашивает `OLLAMA_API_KEY` и использует `https://ollama.com`; режимы с хостом запрашивают базовый URL Ollama, обнаруживают доступные модели и при необходимости автоматически загружают выбранную локальную модель; `Cloud + Local` также проверяет, выполнен ли вход на этом хосте Ollama для облачного доступа.
    - Подробнее: [Ollama](/ru/providers/ollama)
    - **Ключ API**: сохраняет ключ за вас.
    - **Vercel AI Gateway (мультимодельный прокси)**: запрашивает `AI_GATEWAY_API_KEY`.
    - Подробнее: [Vercel AI Gateway](/ru/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: запрашивает Account ID, Gateway ID и `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Подробнее: [Cloudflare AI Gateway](/ru/providers/cloudflare-ai-gateway)
    - **MiniMax**: конфигурация записывается автоматически; размещенная по умолчанию модель — `MiniMax-M3`.
      Настройка с ключом API использует `minimax/...`, а настройка OAuth использует
      `minimax-portal/...`.
    - Подробнее: [MiniMax](/ru/providers/minimax)
    - **StepFun**: конфигурация записывается автоматически для стандартного StepFun или Step Plan на китайских или глобальных конечных точках.
    - Standard сейчас включает `step-3.5-flash`, а Step Plan также включает `step-3.5-flash-2603`.
    - Подробнее: [StepFun](/ru/providers/stepfun)
    - **Synthetic (совместимый с Anthropic)**: запрашивает `SYNTHETIC_API_KEY`.
    - Подробнее: [Synthetic](/ru/providers/synthetic)
    - **Moonshot (Kimi K2)**: конфигурация записывается автоматически.
    - **Kimi Coding**: конфигурация записывается автоматически.
    - Подробнее: [Moonshot AI (Kimi + Kimi Coding)](/ru/providers/moonshot)
    - **Пропустить**: аутентификация пока не настроена.
    - Выберите модель по умолчанию из обнаруженных вариантов (или введите поставщика/модель вручную). Для лучшего качества и меньшего риска prompt-injection выберите самую сильную модель последнего поколения, доступную в вашем стеке поставщиков.
    - Онбординг запускает проверку модели и предупреждает, если настроенная модель неизвестна или отсутствует аутентификация.
    - Режим хранения ключей API по умолчанию использует текстовые значения auth-profile. Используйте `--secret-input-mode ref`, чтобы вместо этого хранить ссылки на env (например, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Профили аутентификации находятся в `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (ключи API + OAuth). `~/.openclaw/credentials/oauth.json` используется только для импорта из устаревшего формата.
    - Подробнее: [/concepts/oauth](/ru/concepts/oauth)
    <Note>
    Совет для headless/серверного режима: завершите OAuth на машине с браузером, затем скопируйте
    `auth-profiles.json` этого агента (например,
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` или соответствующий
    путь `$OPENCLAW_STATE_DIR/...`) на хост gateway. `credentials/oauth.json`
    является только устаревшим источником импорта.
    </Note>
  </Step>
  <Step title="Рабочая область">
    - По умолчанию `~/.openclaw/workspace` (настраивается).
    - Заполняет рабочую область файлами, необходимыми для ритуала начальной загрузки агента.
    - Полная структура рабочей области + руководство по резервному копированию: [Рабочая область агента](/ru/concepts/agent-workspace)

  </Step>
  <Step title="Gateway">
    - Порт, привязка, режим аутентификации, предоставление доступа через tailscale.
    - Рекомендация по аутентификации: сохраняйте **Токен** даже для loopback, чтобы локальные WS-клиенты должны были проходить аутентификацию.
    - В режиме токена интерактивная настройка предлагает:
      - **Сгенерировать/сохранить текстовый токен** (по умолчанию)
      - **Использовать SecretRef** (по явному выбору)
      - Quickstart повторно использует существующие SecretRef `gateway.auth.token` у поставщиков `env`, `file` и `exec` для онбордингового probe/bootstrap dashboard.
      - Если этот SecretRef настроен, но не может быть разрешен, онбординг завершается раньше с понятным сообщением об исправлении вместо тихого ухудшения runtime-аутентификации.
    - В режиме пароля интерактивная настройка также поддерживает хранение в открытом виде или через SecretRef.
    - Неинтерактивный путь SecretRef для токена: `--gateway-token-ref-env <ENV_VAR>`.
      - Требует непустую переменную окружения в окружении процесса онбординга.
      - Нельзя сочетать с `--gateway-token`.
    - Отключайте аутентификацию только если полностью доверяете каждому локальному процессу.
    - Привязки не к loopback по-прежнему требуют аутентификации.

  </Step>
  <Step title="Каналы">
    - [WhatsApp](/ru/channels/whatsapp): необязательный вход по QR-коду.
    - [Telegram](/ru/channels/telegram): токен бота.
    - [Discord](/ru/channels/discord): токен бота.
    - [Google Chat](/ru/channels/googlechat): JSON сервисного аккаунта + webhook audience.
    - [Mattermost](/ru/channels/mattermost) (plugin): токен бота + базовый URL.
    - [Signal](/ru/channels/signal): необязательная установка `signal-cli` + конфигурация аккаунта.
    - [iMessage](/ru/channels/imessage): путь к CLI `imsg` + доступ к БД Messages; используйте SSH-обертку, когда Gateway работает не на Mac.
    - Безопасность DM: по умолчанию используется сопряжение. Первое DM отправляет код; подтвердите через `openclaw pairing approve <channel> <code>` или используйте allowlists.

  </Step>
  <Step title="Веб-поиск">
    - Выберите поддерживаемого поставщика, например Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG или Tavily (или пропустите).
    - Поставщики с API могут использовать переменные окружения или существующую конфигурацию для быстрой настройки; поставщики без ключей используют свои требования.
    - Пропустите с помощью `--skip-search`.
    - Настройте позже: `openclaw configure --section web`.

  </Step>
  <Step title="Установка демона">
    - macOS: LaunchAgent
      - Требует сеанс вошедшего пользователя; для headless используйте пользовательский LaunchDaemon (не поставляется).
    - Linux (и Windows через WSL2): пользовательский unit systemd
      - Онбординг пытается включить lingering через `loginctl enable-linger <user>`, чтобы Gateway оставался запущенным после выхода.
      - Может запросить sudo (записывает `/var/lib/systemd/linger`); сначала пытается без sudo.
    - **Выбор среды выполнения:** Node (рекомендуется; требуется для WhatsApp/Telegram). Bun **не рекомендуется**.
    - Если токенная аутентификация требует токен и `gateway.auth.token` управляется через SecretRef, установка демона проверяет его, но не сохраняет разрешенные текстовые значения токена в метаданные окружения службы supervisor.
    - Если токенная аутентификация требует токен и настроенный SecretRef токена не разрешается, установка демона блокируется с практическими указаниями.
    - Если настроены и `gateway.auth.token`, и `gateway.auth.password`, а `gateway.auth.mode` не задан, установка демона блокируется, пока режим не будет задан явно.

  </Step>
  <Step title="Проверка работоспособности">
    - Запускает Gateway (при необходимости) и выполняет `openclaw health`.
    - Совет: `openclaw status --deep` добавляет live-проверку работоспособности gateway в вывод статуса, включая probes каналов, когда они поддерживаются (требуется доступный gateway).

  </Step>
  <Step title="Skills (рекомендуется)">
    - Считывает доступные skills и проверяет требования.
    - Позволяет выбрать менеджер node: **npm / pnpm** (bun не рекомендуется).
    - Устанавливает необязательные зависимости (некоторые используют Homebrew на macOS).

  </Step>
  <Step title="Завершение">
    - Сводка + следующие шаги, включая prompt **Как вы хотите вывести своего агента?** для терминала, браузера или позже.

  </Step>
</Steps>

<Note>
Если GUI не обнаружен, онбординг выводит инструкции по SSH port-forward для Control UI вместо открытия браузера.
Если ресурсы Control UI отсутствуют, онбординг пытается собрать их; запасной вариант — `pnpm ui:build` (автоматически устанавливает зависимости UI).
</Note>

## Неинтерактивный режим

Используйте `--non-interactive`, чтобы автоматизировать онбординг или запускать его из скриптов:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Добавьте `--json` для машиночитаемой сводки.

SecretRef токена Gateway в неинтерактивном режиме:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` и `--gateway-token-ref-env` являются взаимоисключающими.

<Note>
`--json` **не** подразумевает неинтерактивный режим. Используйте `--non-interactive` (и `--workspace`) для скриптов.
</Note>

Примеры команд для конкретных поставщиков находятся в [Автоматизация CLI](/ru/start/wizard-cli-automation#provider-specific-examples).
Используйте эту справочную страницу для семантики флагов и порядка шагов.

### Добавить агента (неинтерактивно)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.5 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC мастера Gateway

Gateway предоставляет поток онбординга через RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Клиенты (приложение macOS, Control UI) могут отображать шаги без повторной реализации логики онбординга.

## Настройка Signal (signal-cli)

Онбординг может установить `signal-cli` из GitHub releases:

- Загружает подходящий release asset.
- Сохраняет его в `~/.openclaw/tools/signal-cli/<version>/`.
- Записывает `channels.signal.cliPath` в вашу конфигурацию.

Примечания:

- JVM-сборки требуют **Java 21**.
- Нативные сборки используются, когда доступны.
- Windows использует WSL2; установка signal-cli следует Linux-потоку внутри WSL.

## Что записывает мастер

Типичные поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (если выбран Minimax)
- `tools.profile` (локальная первичная настройка по умолчанию использует `"coding"`, если значение не задано; существующие явные значения сохраняются)
- `gateway.*` (режим, привязка, аутентификация, tailscale)
- `session.dmScope` (подробности поведения: [Справочник по настройке CLI](/ru/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Списки разрешений каналов (Slack/Discord/Matrix/Microsoft Teams), если вы включаете их во время запросов (имена по возможности преобразуются в ID).
- `skills.install.nodeManager`
  - `setup --node-manager` принимает `npm`, `pnpm` или `bun`.
  - Ручная конфигурация по-прежнему может использовать `yarn`, если задать `skills.install.nodeManager` напрямую.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записывает `agents.list[]` и необязательные `bindings`.

Учетные данные WhatsApp помещаются в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сеансы хранятся в `~/.openclaw/agents/<agentId>/sessions/`.

Некоторые каналы поставляются как plugins. Когда вы выбираете такой канал во время настройки, первичная настройка
предложит установить его (из npm или локального пути), прежде чем его можно будет настроить.

## Связанные документы

- Обзор первичной настройки: [Первичная настройка (CLI)](/ru/start/wizard)
- Первичная настройка приложения macOS: [Первичная настройка](/ru/start/onboarding)
- Справочник по конфигурации: [Конфигурация Gateway](/ru/gateway/configuration)
- Провайдеры: [WhatsApp](/ru/channels/whatsapp), [Telegram](/ru/channels/telegram), [Discord](/ru/channels/discord), [Google Chat](/ru/channels/googlechat), [Signal](/ru/channels/signal), [iMessage](/ru/channels/imessage)
- Skills: [Skills](/ru/tools/skills), [Конфигурация Skills](/ru/tools/skills-config)
