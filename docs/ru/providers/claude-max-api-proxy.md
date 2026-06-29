---
read_when:
    - Вы хотите использовать подписку Claude Max с OpenAI-совместимыми инструментами
    - Вам нужен локальный API-сервер, который оборачивает Claude Code CLI
    - Вы хотите сравнить доступ к Anthropic по подписке и по API-ключу
summary: Прокси сообщества для предоставления учетных данных подписки Claude в виде OpenAI-совместимой конечной точки
title: API-прокси Claude Max
x-i18n:
    generated_at: "2026-06-28T23:35:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** — это инструмент сообщества, который предоставляет вашу подписку Claude Max/Pro как OpenAI-совместимую конечную точку API. Это позволяет использовать вашу подписку с любым инструментом, поддерживающим формат OpenAI API.

<Warning>
Этот путь предназначен только для технической совместимости. В прошлом Anthropic блокировала некоторое использование подписок
за пределами Claude Code. Вы должны самостоятельно решить, использовать ли
его, и проверить текущие правила биллинга Anthropic, прежде чем на него полагаться.

В текущей документации поддержки Anthropic сказано, что `claude -p` относится к использованию Agent SDK/программному использованию.
Обновление поддержки Anthropic от 15 июня 2026 года приостановило объявленный отдельный кредитный план
Agent SDK. На данный момент Claude Agent SDK, `claude -p` и использование сторонних приложений
по-прежнему расходуют лимиты использования подписки, под которой выполнен вход.

Перед тем как полагаться на этот путь, проверьте статью Anthropic о [плане Agent SDK
article](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
а также статьи поддержки Claude Code для учетных записей
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
или
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).
</Warning>

## Зачем это использовать?

| Подход                    | Маршрут оплаты                                   | Лучше всего подходит для                   |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API             | Оплата за токен через Claude Console или облако | Продакшен-приложения, совместная автоматизация, объем |
| Прокси подписки Claude    | План и кредитные правила Claude Code / `claude -p` | Личные эксперименты с совместимыми инструментами |

Если у вас есть подписка Claude Max или Pro и вы хотите использовать ее с
OpenAI-совместимыми инструментами, этот прокси может подойти для некоторых личных рабочих процессов. Это не
безлимитный путь с фиксированной оплатой. API-ключи остаются более понятным вариантом с точки зрения политики и биллинга для
продакшен-использования.

## Как это работает

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

Прокси:

1. Принимает запросы в формате OpenAI на `http://localhost:3456/v1/chat/completions`
2. Преобразует их в команды Claude Code CLI
3. Возвращает ответы в формате OpenAI (поддерживается потоковая передача)

## Начало работы

<Steps>
  <Step title="Установите прокси">
    Требуется Node.js 22+ и Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
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
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Настройте OpenClaw">
    Укажите OpenClaw на прокси как на пользовательскую OpenAI-совместимую конечную точку:

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

## Встроенный каталог

| ID модели         | Соответствует  |
| ----------------- | -------------- |
| `claude-opus-4`   | Claude Opus 4  |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4 |

## Расширенная настройка

<AccordionGroup>
  <Accordion title="Примечания о прокси-стиле OpenAI-совместимости">
    Этот путь использует тот же прокси-стиль OpenAI-совместимого маршрута, что и другие пользовательские
    бэкенды `/v1`:

    - Нативное формирование запросов только для OpenAI не применяется
    - Нет `service_tier`, нет Responses `store`, нет подсказок prompt-cache и нет
      формирования payload для совместимости с reasoning OpenAI
    - Скрытые заголовки атрибуции OpenClaw (`originator`, `version`, `User-Agent`)
      не вставляются в URL прокси

  </Accordion>

  <Accordion title="Автозапуск в macOS через LaunchAgent">
    Создайте LaunchAgent, чтобы запускать прокси автоматически:

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

- Это **инструмент сообщества**, официально не поддерживаемый Anthropic или OpenClaw
- Требуется активная подписка Claude Max/Pro с аутентифицированным Claude Code CLI
- Наследует поведение биллинга, кредитов использования и rate-limit Claude Code `claude -p`
- Прокси работает локально и не отправляет данные на сторонние серверы
- Потоковые ответы полностью поддерживаются

<Note>
Для нативной интеграции Anthropic с Claude CLI или API-ключами см. [провайдер Anthropic](/ru/providers/anthropic). Для подписок OpenAI/Codex см. [провайдер OpenAI](/ru/providers/openai).
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
    Обзор всех провайдеров, ссылок на модели и поведения failover.
  </Card>
  <Card title="Конфигурация" href="/ru/gateway/configuration" icon="gear">
    Полный справочник конфигурации.
  </Card>
</CardGroup>
