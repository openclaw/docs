---
read_when:
    - Ви хочете використовувати підписку Claude Max з OpenAI-compatible tools
    - Вам потрібен локальний API server, який обгортає Claude Code CLI
    - Ви хочете оцінити доступ Anthropic на основі підписки порівняно з доступом на основі API key
summary: Спільнотний proxy для надання облікових даних підписки Claude як OpenAI-compatible endpoint
title: API proxy Claude Max
x-i18n:
    generated_at: "2026-04-23T21:05:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0242e162c8057d1740ca2f9b3945ceb9b81f7f6d480a3a6b4f5470b4b7bf47ee
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

**claude-max-api-proxy** — це інструмент спільноти, який надає вашу підписку Claude Max/Pro як OpenAI-compatible API endpoint. Це дає змогу використовувати вашу підписку з будь-яким інструментом, що підтримує формат OpenAI API.

<Warning>
Цей шлях призначений лише для технічної сумісності. У минулому Anthropic блокував
деякі сценарії використання підписки поза Claude Code. Ви самі маєте вирішити, чи
використовувати це, і перевірити актуальні умови Anthropic, перш ніж покладатися на цей варіант.
</Warning>

## Навіщо це використовувати?

| Підхід                  | Вартість                                             | Найкраще підходить для                    |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------- |
| Anthropic API           | Оплата за token (~$15/M за input, $75/M за output для Opus) | Production-застосунків, великого обсягу   |
| Підписка Claude Max     | $200/місяць фіксовано                                | Особистого використання, розробки, необмеженого використання |

Якщо у вас є підписка Claude Max і ви хочете використовувати її з OpenAI-compatible tools, цей proxy може зменшити витрати для деяких робочих процесів. API key залишаються більш зрозумілим шляхом з погляду політики для production-використання.

## Як це працює

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

Proxy:

1. Приймає запити у форматі OpenAI за адресою `http://localhost:3456/v1/chat/completions`
2. Перетворює їх на команди Claude Code CLI
3. Повертає відповіді у форматі OpenAI (streaming підтримується)

## Початок роботи

<Steps>
  <Step title="Установіть proxy">
    Потрібні Node.js 20+ і Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Запустіть server">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Перевірте proxy">
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
  <Step title="Налаштуйте OpenClaw">
    Спрямуйте OpenClaw на proxy як на власний OpenAI-compatible endpoint:

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

## Доступні моделі

| ID моделі         | Відображається на   |
| ----------------- | ------------------- |
| `claude-opus-4`   | Claude Opus 4       |
| `claude-sonnet-4` | Claude Sonnet 4     |
| `claude-haiku-4`  | Claude Haiku 4      |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Примітки щодо proxy-style OpenAI-compatible">
    Цей шлях використовує той самий proxy-style маршрут OpenAI-compatible, що й інші власні
    backend-и `/v1`:

    - Shaping запитів, специфічний лише для нативного OpenAI, не застосовується
    - Немає `service_tier`, немає Responses `store`, немає підказок prompt-cache і немає
      shaping payload для сумісності з reasoning OpenAI
    - Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
      не ін’єктуються в URL proxy

  </Accordion>

  <Accordion title="Автозапуск на macOS через LaunchAgent">
    Створіть LaunchAgent, щоб автоматично запускати proxy:

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

## Посилання

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Примітки

- Це **інструмент спільноти**, а не офіційно підтримуваний Anthropic або OpenClaw
- Потрібна активна підписка Claude Max/Pro з автентифікованим Claude Code CLI
- Proxy запускається локально й не надсилає дані на сторонні сервери
- Streaming-відповіді повністю підтримуються

<Note>
Для нативної інтеграції Anthropic з Claude CLI або API key див. [Anthropic provider](/uk/providers/anthropic). Для підписок OpenAI/Codex див. [OpenAI provider](/uk/providers/openai).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/uk/providers/anthropic" icon="bolt">
    Нативна інтеграція OpenClaw з Claude CLI або API key.
  </Card>
  <Card title="OpenAI provider" href="/uk/providers/openai" icon="robot">
    Для підписок OpenAI/Codex.
  </Card>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх provider-ів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Configuration" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації.
  </Card>
</CardGroup>
