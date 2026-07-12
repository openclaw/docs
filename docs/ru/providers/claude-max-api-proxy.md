---
read_when:
    - Вы хотите использовать подписку Claude Max с инструментами, совместимыми с OpenAI
    - Вам нужен локальный API-сервер, предоставляющий оболочку для Claude Code CLI
    - Вы хотите сравнить доступ к Anthropic по подписке и по API-ключу
summary: Прокси сообщества для предоставления учётных данных подписки Claude через OpenAI-совместимую конечную точку
title: Прокси API Claude Max
x-i18n:
    generated_at: "2026-07-12T11:46:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** — это npm-пакет сообщества (не плагин OpenClaw), который
предоставляет подписку Claude Max/Pro в виде API-эндпоинта, совместимого с OpenAI,
позволяя использовать подписку с любым инструментом, совместимым с OpenAI,
вместо API-ключа Anthropic.

<Warning>
Обеспечивается только техническая совместимость; этот способ официально не
поддерживается. Ранее Anthropic блокировала некоторые варианты использования
подписки вне Claude Code; прежде чем полагаться на этот способ, проверьте
актуальные правила тарификации Anthropic.

В документации Anthropic по Claude Code команда `claude -p` описывается как
программное использование или использование через Agent SDK. Согласно
обновлению службы поддержки Anthropic от 15 июня 2026 года, использование
Claude Agent SDK, `claude -p` и сторонних приложений учитывается в лимитах
активной подписки (ранее объявленный отдельный план кредитов для Agent SDK
приостановлен). См. статью Anthropic о [плане Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
статьи о планах [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
и [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan),
а также примечания OpenClaw о тарификации Claude CLI на странице
[провайдера Anthropic](/ru/providers/anthropic).
</Warning>

## Зачем это использовать

| Подход                    | Способ оплаты                                            | Лучше всего подходит для                                  |
| ------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| API-ключ Anthropic        | Оплата за каждый токен через Claude Console              | Рабочих приложений, общей автоматизации, больших объёмов   |
| Прокси подписки Claude    | Правила плана и кредитов Claude Code / `claude -p`       | Личных экспериментов с совместимыми инструментами          |

Этот прокси позволяет использовать подписку Claude Max или Pro с инструментами,
совместимыми с OpenAI. Это не безлимитный вариант с фиксированной оплатой — на
него распространяются лимиты использования Claude Code. Для рабочего
использования API-ключи остаются более прозрачным способом тарификации.

## Как это работает

```text
Ваше приложение -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
    (формат OpenAI)                    (преобразует формат)          (использует ваш вход)
```

Прокси запускает Claude Code CLI как отдельный подпроцесс для каждого запроса,
преобразует запросы чата в формате OpenAI в запросы CLI и передаёт ответ
потоком (или возвращает целиком) в формате OpenAI.

## Начало работы

<Steps>
  <Step title="Установите прокси">
    Требуются Node.js 20+ и прошедший аутентификацию Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    claude auth login   # if not already authenticated
    ```

  </Step>
  <Step title="Запустите сервер">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Проверьте прокси">
    ```bash
    curl http://localhost:3456/health
    curl http://localhost:3456/v1/models

    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Настройте OpenClaw">
    Укажите прокси в OpenClaw как пользовательский эндпоинт, совместимый с OpenAI:

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

<Note>
Приведённые ниже идентификаторы моделей относятся к собственному каталогу
прокси, а не к ссылкам на модели Anthropic в OpenClaw. Каждый идентификатор
соответствует псевдониму модели Claude Code CLI (`opus`, `sonnet`, `haiku`),
поэтому базовая модель меняется всякий раз, когда Anthropic обновляет этот
псевдоним в CLI. Прежде чем полагаться на конкретное соответствие, проверьте
актуальный README прокси.
</Note>

| Идентификатор модели | Псевдоним CLI | Текущее соответствие |
| -------------------- | ------------- | -------------------- |
| `claude-opus-4`      | `opus`        | Claude Opus 4.5      |
| `claude-sonnet-4`    | `sonnet`      | Claude Sonnet 4      |
| `claude-haiku-4`     | `haiku`       | Claude Haiku 4       |

## Расширенная настройка

<AccordionGroup>
  <Accordion title="Примечания о прокси-маршруте, совместимом с OpenAI">
    Здесь используется универсальный пользовательский маршрут OpenClaw `/v1`,
    совместимый с OpenAI, — тот же путь, что и для любого другого самостоятельно
    размещённого серверного приложения, совместимого с OpenAI:

    - Формирование запросов, предназначенное только для нативного OpenAI, не применяется.
    - `/fast` и `service_tier` применяются только к прямому трафику
      `api.anthropic.com`; прокси-маршруты оставляют `service_tier` без изменений
      (см. [быстрый режим провайдера Anthropic](/ru/providers/anthropic#advanced-configuration)).
    - Не выполняется формирование полезной нагрузки для `store` Responses,
      подсказок кэша запросов или совместимости рассуждений OpenAI.
    - Заголовки атрибуции OpenAI/Codex в OpenClaw (`originator`, `version`,
      `User-Agent`) отправляются только для нативного OAuth-трафика
      `api.openai.com`, но не для пользовательских целей `OPENAI_BASE_URL`,
      таких как этот прокси.

  </Accordion>

  <Accordion title="Автоматический запуск в macOS с помощью LaunchAgent">
    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## Примечания

- Наследует поведение `claude -p` в Claude Code в отношении тарификации, кредитов использования и ограничений частоты запросов.
- Привязывается только к `127.0.0.1`; не отправляет данные сторонним серверам, кроме собственного обращения CLI к Anthropic.
- Поддерживаются потоковые ответы.
- Ошибки аутентификации не проверяются при запуске и проявляются только при фактическом выполнении запроса чата; если CLI не прошёл аутентификацию, первый запрос завершится ошибкой, а сервер всё равно запустится.

<Note>
Для нативной интеграции с Anthropic через Claude CLI или API-ключи см.
[провайдер Anthropic](/ru/providers/anthropic). Для подписок OpenAI/Codex см.
[провайдер OpenAI](/ru/providers/openai).
</Note>

## Связанные материалы

<CardGroup cols={2}>
  <Card title="Провайдер Anthropic" href="/ru/providers/anthropic" icon="bolt">
    Нативная интеграция OpenClaw с Claude CLI или API-ключами.
  </Card>
  <Card title="Провайдер OpenAI" href="/ru/providers/openai" icon="robot">
    Для подписок OpenAI/Codex.
  </Card>
  <Card title="Выбор модели" href="/ru/concepts/model-providers" icon="layers">
    Обзор всех провайдеров, ссылок на модели и поведения при переключении после сбоя.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полный справочник по конфигурации.
  </Card>
</CardGroup>
