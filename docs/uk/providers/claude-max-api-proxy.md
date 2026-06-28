---
read_when:
    - Ви хочете використовувати підписку Claude Max з інструментами, сумісними з OpenAI
    - Вам потрібен локальний API-сервер, який обгортає Claude Code CLI
    - Ви хочете оцінити доступ до Anthropic на основі підписки порівняно з доступом на основі API-ключа
summary: Спільнотний проксі для надання облікових даних підписки Claude як кінцевої точки, сумісної з OpenAI
title: Проксі API Claude Max
x-i18n:
    generated_at: "2026-06-28T20:45:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d8800f7d5bd7adf9bff4825a45878a1bbde73b4d54afe4b5b4aa2b1b5523bee
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** — це інструмент спільноти, який надає вашу передплату Claude Max/Pro як сумісну з OpenAI кінцеву точку API. Це дає змогу використовувати вашу передплату з будь-яким інструментом, що підтримує формат OpenAI API.

<Warning>
Цей шлях призначений лише для технічної сумісності. Anthropic у минулому блокувала деяке використання передплати
поза Claude Code. Ви маєте самостійно вирішити, чи використовувати
його, і перевірити поточні правила білінгу Anthropic, перш ніж покладатися на нього.

Поточна документація підтримки Anthropic каже, що `claude -p` — це використання Agent SDK/програмне використання.
Оновлення підтримки Anthropic від 15 червня 2026 року призупинило оголошений окремий план кредитів
Agent SDK. Наразі Claude Agent SDK, `claude -p` і використання сторонніх застосунків
досі списуються з лімітів використання передплати, у яку виконано вхід.

Перш ніж покладатися на цей шлях, перевірте [статтю про план Agent SDK
](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan) від Anthropic,
а також статті підтримки Claude Code для облікових записів
[Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
або
[Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).
</Warning>

## Навіщо це використовувати?

| Підхід                    | Маршрут витрат                                  | Найкраще для                                |
| ------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Anthropic API             | Оплата за токен через Claude Console або хмару  | Продакшн-застосунки, спільна автоматизація, обсяг |
| Проксі передплати Claude  | План і правила кредитів Claude Code / `claude -p` | Особисті експерименти із сумісними інструментами |

Якщо у вас є передплата Claude Max або Pro і ви хочете використовувати її з
інструментами, сумісними з OpenAI, цей проксі може підійти для деяких особистих робочих процесів. Це не
безлімітний шлях із фіксованою оплатою. API-ключі залишаються зрозумілішим політичним і білінговим шляхом для
використання в продакшні.

## Як це працює

```
Your App → claude-max-api-proxy → Claude Code CLI / claude -p → Anthropic
     (OpenAI format)              (converts format)          (uses your login)
```

Проксі:

1. Приймає запити у форматі OpenAI на `http://localhost:3456/v1/chat/completions`
2. Перетворює їх на команди Claude Code CLI
3. Повертає відповіді у форматі OpenAI (підтримується потокове передавання)

## Початок роботи

<Steps>
  <Step title="Встановіть проксі">
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
    Спрямуйте OpenClaw на проксі як на користувацьку сумісну з OpenAI кінцеву точку:

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

| Ідентифікатор моделі | Відповідає       |
| -------------------- | ---------------- |
| `claude-opus-4`      | Claude Opus 4    |
| `claude-sonnet-4`    | Claude Sonnet 4  |
| `claude-haiku-4`     | Claude Haiku 4   |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Нотатки про сумісність із OpenAI у стилі проксі">
    Цей шлях використовує той самий маршрут, сумісний з OpenAI у стилі проксі, що й інші користувацькі
    бекенди `/v1`:

    - Нативне формування запитів лише для OpenAI не застосовується
    - Немає `service_tier`, немає Responses `store`, немає підказок prompt-cache і немає
      формування payload для сумісності з reasoning OpenAI
    - Приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
      не додаються до URL проксі

  </Accordion>

  <Accordion title="Автозапуск на macOS за допомогою LaunchAgent">
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

- Це **інструмент спільноти**, офіційно не підтримуваний Anthropic або OpenClaw
- Потрібна активна передплата Claude Max/Pro з автентифікованим Claude Code CLI
- Успадковує поведінку білінгу, кредитів використання та лімітів частоти Claude Code `claude -p`
- Проксі працює локально й не надсилає дані на жодні сторонні сервери
- Потокові відповіді повністю підтримуються

<Note>
Для нативної інтеграції Anthropic із Claude CLI або API-ключами див. [провайдер Anthropic](/uk/providers/anthropic). Для передплат OpenAI/Codex див. [провайдер OpenAI](/uk/providers/openai).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Провайдер Anthropic" href="/uk/providers/anthropic" icon="bolt">
    Нативна інтеграція OpenClaw із Claude CLI або API-ключами.
  </Card>
  <Card title="Провайдер OpenAI" href="/uk/providers/openai" icon="robot">
    Для передплат OpenAI/Codex.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник конфігурації.
  </Card>
</CardGroup>
