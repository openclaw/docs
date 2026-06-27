---
read_when:
    - Ви хочете використовувати підписку Claude Max з інструментами, сумісними з OpenAI
    - Вам потрібен локальний API-сервер, який обгортає Claude Code CLI
    - Ви хочете оцінити доступ до Anthropic на основі передплати порівняно з доступом на основі API-ключа
summary: Проксі спільноти для надання облікових даних підписки Claude як OpenAI-сумісної кінцевої точки
title: API-проксі Claude Max
x-i18n:
    generated_at: "2026-06-27T18:09:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24bd2b4b56e4b8829e67f248d0e0a6bad53ccbd9ce98ee288bfa4de93508ef27
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** — це інструмент спільноти, який надає вашу підписку Claude Max/Pro як OpenAI-сумісну кінцеву точку API. Це дає змогу використовувати вашу підписку з будь-яким інструментом, що підтримує формат OpenAI API.

<Warning>
Цей шлях призначений лише для технічної сумісності. Anthropic у минулому блокувала деяке використання підписки
поза Claude Code. Ви маєте самостійно вирішити, чи використовувати
це, і перевірити поточні правила білінгу Anthropic, перш ніж покладатися на нього.

Поточна документація підтримки Anthropic каже, що `claude -p` — це використання Agent SDK/програмне використання.
Починаючи з 15 червня 2026 року, використання `claude -p` у плані підписки спершу витрачає окремий
щомісячний кредит Agent SDK, а потім кредити використання за стандартними тарифами API, якщо
кредити використання ввімкнено.
</Warning>

## Навіщо це використовувати?

| Підхід                   | Маршрут витрат                                      | Найкраще для                                      |
| ------------------------ | --------------------------------------------------- | ------------------------------------------------- |
| Anthropic API            | Оплата за токен через Claude Console або хмару      | Продакшн-додатки, спільна автоматизація, обсяг    |
| Проксі підписки Claude   | План і правила кредитів Claude Code / `claude -p`   | Особисті експерименти із сумісними інструментами  |

Якщо у вас є підписка Claude Max або Pro і ви хочете використовувати її з
OpenAI-сумісними інструментами, цей проксі може підійти для деяких особистих робочих процесів. Це не
безлімітний шлях із фіксованою оплатою. API-ключі залишаються зрозумілішим шляхом політики та білінгу для
продакшн-використання.

## Як це працює

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

Проксі:

1. Приймає запити у форматі OpenAI на `http://localhost:3456/v1/chat/completions`
2. Перетворює їх на команди Claude Code CLI
3. Повертає відповіді у форматі OpenAI (підтримується потокова передача)

## Початок роботи

<Steps>
  <Step title="Установіть проксі">
    Потрібні Node.js 22+ і Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Запустіть сервер">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Протестуйте проксі">
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
    Спрямуйте OpenClaw на проксі як на власну OpenAI-сумісну кінцеву точку:

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

## Вбудований каталог

| ID моделі          | Відповідає       |
| ------------------ | --------------- |
| `claude-opus-4`    | Claude Opus 4   |
| `claude-sonnet-4`  | Claude Sonnet 4 |
| `claude-haiku-4`   | Claude Haiku 4  |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Нотатки щодо OpenAI-сумісного проксі">
    Цей шлях використовує той самий проксі-стиль OpenAI-сумісного маршруту, що й інші власні
    бекенди `/v1`:

    - Нативне формування запитів лише для OpenAI не застосовується
    - Немає `service_tier`, немає Responses `store`, немає підказок prompt-cache і немає
      OpenAI reasoning-сумісного формування payload
    - Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
      не вставляються в URL проксі

  </Accordion>

  <Accordion title="Автозапуск на macOS через LaunchAgent">
    Створіть LaunchAgent, щоб запускати проксі автоматично:

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

## Нотатки

- Це **інструмент спільноти**, який офіційно не підтримується Anthropic або OpenClaw
- Потрібна активна підписка Claude Max/Pro з автентифікованим Claude Code CLI
- Успадковує поведінку білінгу, кредитів використання та обмежень швидкості Claude Code `claude -p`
- Проксі працює локально й не надсилає дані на сторонні сервери
- Потокові відповіді повністю підтримуються

<Note>
Для нативної інтеграції Anthropic із Claude CLI або API-ключами див. [провайдер Anthropic](/uk/providers/anthropic). Для підписок OpenAI/Codex див. [провайдер OpenAI](/uk/providers/openai).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдер Anthropic" href="/uk/providers/anthropic" icon="bolt">
    Нативна інтеграція OpenClaw із Claude CLI або API-ключами.
  </Card>
  <Card title="Провайдер OpenAI" href="/uk/providers/openai" icon="robot">
    Для підписок OpenAI/Codex.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації.
  </Card>
</CardGroup>
