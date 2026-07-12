---
read_when:
    - Ви хочете використовувати підписку Claude Max з інструментами, сумісними з OpenAI
    - Вам потрібен локальний API-сервер, що є обгорткою для Claude Code CLI
    - Ви хочете порівняти доступ до Anthropic на основі передплати та ключа API
summary: Проксі спільноти, що надає облікові дані підписки Claude через сумісну з OpenAI кінцеву точку
title: Проксі API Claude Max
x-i18n:
    generated_at: "2026-07-12T13:41:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5d0d9a70e14d7d444e57e9bcf169816fec4013a2680dfc9b1761e6ab32109e9f
    source_path: providers/claude-max-api-proxy.md
    workflow: 16
---

**claude-max-api-proxy** — це пакет npm від спільноти (не плагін OpenClaw), який
надає підписку Claude Max/Pro як API-кінцеву точку, сумісну з OpenAI, щоб
ви могли підключити до своєї підписки будь-який інструмент, сумісний з OpenAI,
замість використання ключа API Anthropic.

<Warning>
Лише технічна сумісність, а не офіційно схвалений спосіб. Раніше Anthropic
блокувала деякі випадки використання підписки поза Claude Code; перш ніж
покладатися на цей спосіб, перевірте чинні правила оплати Anthropic.

У документації Anthropic щодо Claude Code `claude -p` описано як
програмне використання через Agent SDK. Згідно з оновленням служби підтримки
Anthropic від 15 червня 2026 року, використання Claude Agent SDK,
`claude -p` і сторонніх застосунків враховується в лімітах використання
підписки, у яку виконано вхід (раніше оголошений окремий план кредитів
для Agent SDK призупинено). Див. статтю Anthropic про
[план Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
статті про плани [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
і [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan),
а також сторінку [постачальника Anthropic](/uk/providers/anthropic), де наведено
примітки OpenClaw щодо оплати власної інтеграції з Claude CLI.
</Warning>

## Навіщо це використовувати

| Підхід                    | Спосіб оплати                                    | Найкраще підходить для                              |
| ------------------------- | ----------------------------------------------- | --------------------------------------------------- |
| Ключ API Anthropic        | Оплата за токени через Claude Console           | Робочих застосунків, спільної автоматизації, обсягів |
| Проксі підписки Claude    | Правила плану й кредитів Claude Code / `claude -p` | Особистих експериментів із сумісними інструментами |

Цей проксі дає змогу використовувати підписку Claude Max або Pro з
інструментами, сумісними з OpenAI. Це не безлімітний спосіб із фіксованою
оплатою — на нього поширюються ліміти використання Claude Code. Для робочого
використання ключі API залишаються прозорішим способом оплати.

## Як це працює

```text
Ваш застосунок -> claude-max-api-proxy -> Claude Code CLI / claude -p -> Anthropic
     (формат OpenAI)                    (перетворює формат)             (використовує ваш обліковий запис)
```

Для кожного запиту проксі запускає Claude Code CLI як підпроцес, перетворює
запити чату у форматі OpenAI на запити CLI та передає потоком (або повертає)
відповідь у форматі OpenAI.

## Початок роботи

<Steps>
  <Step title="Установіть проксі">
    Потрібні Node.js 20+ і автентифікований Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    claude auth login   # if not already authenticated
    ```

  </Step>
  <Step title="Запустіть сервер">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Перевірте проксі">
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
  <Step title="Налаштуйте OpenClaw">
    Спрямуйте OpenClaw до проксі як до власної кінцевої точки, сумісної з OpenAI:

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
Наведені нижче ідентифікатори моделей належать до власного каталогу проксі,
а не до посилань OpenClaw на моделі Anthropic. Кожен ідентифікатор відповідає
псевдоніму моделі Claude Code CLI (`opus`, `sonnet`, `haiku`), тому базова
модель змінюється щоразу, коли Anthropic оновлює цей псевдонім у CLI.
Перш ніж покладатися на конкретну відповідність, перевірте актуальний
README проксі.
</Note>

| Ідентифікатор моделі | Псевдонім CLI | Поточна відповідність |
| -------------------- | ------------- | --------------------- |
| `claude-opus-4`      | `opus`        | Claude Opus 4.5       |
| `claude-sonnet-4`    | `sonnet`      | Claude Sonnet 4       |
| `claude-haiku-4`     | `haiku`       | Claude Haiku 4        |

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Примітки щодо проксі, сумісного з OpenAI">
    Тут використовується універсальний власний маршрут OpenClaw `/v1`,
    сумісний з OpenAI, — той самий шлях, що й для будь-якого іншого
    самостійно розміщеного серверного компонента, сумісного з OpenAI:

    - Формування запитів, призначене лише для нативного OpenAI, не застосовується.
    - `/fast` і `service_tier` застосовуються лише до прямого трафіку
      `api.anthropic.com`; проксі-маршрути не змінюють `service_tier` (див.
      [швидкий режим постачальника Anthropic](/uk/providers/anthropic#advanced-configuration)).
    - Немає `store` для Responses, підказок кешу запитів або формування
      корисного навантаження для сумісності з міркуваннями OpenAI.
    - Заголовки атрибуції OpenAI/Codex від OpenClaw (`originator`, `version`,
      `User-Agent`) надсилаються лише для нативного OAuth-трафіку
      `api.openai.com`, а не до власних цілей `OPENAI_BASE_URL`, як-от цей проксі.

  </Accordion>

  <Accordion title="Автоматичний запуск у macOS за допомогою LaunchAgent">
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

## Примітки

- Успадковує поведінку Claude Code `claude -p` щодо оплати, кредитів використання та обмежень частоти запитів.
- Прив’язується лише до `127.0.0.1`; не надсилає дані жодному сторонньому серверу, крім власного виклику CLI до Anthropic.
- Підтримується потокове передавання відповідей.
- Помилки автентифікації не перевіряються під час запуску й з’являються лише після фактичного виконання запиту чату; якщо CLI не автентифіковано, слід очікувати помилки першого запиту, а не відмови сервера запускатися.

<Note>
Для нативної інтеграції Anthropic із Claude CLI або ключами API див.
[постачальника Anthropic](/uk/providers/anthropic). Для підписок OpenAI/Codex див.
[постачальника OpenAI](/uk/providers/openai).
</Note>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Постачальник Anthropic" href="/uk/providers/anthropic" icon="bolt">
    Нативна інтеграція OpenClaw із Claude CLI або ключами API.
  </Card>
  <Card title="Постачальник OpenAI" href="/uk/providers/openai" icon="robot">
    Для підписок OpenAI/Codex.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх постачальників, посилань на моделі та поведінки перемикання після відмови.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації.
  </Card>
</CardGroup>
