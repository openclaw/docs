---
read_when:
    - Налаштування груп розсилки
    - Налагодження відповідей кількох агентів у WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Надішліть повідомлення WhatsApp кільком агентам
title: Групи розсилки
x-i18n:
    generated_at: "2026-04-26T09:06:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b36710d9cc3eb4e2b8ba3d57031bd020aedbb6a502b400ec02a835a320d609
    source_path: channels/broadcast-groups.md
    workflow: 15
---

<Note>
**Статус:** Експериментально. Додано в 2026.1.9.
</Note>

## Огляд

Групи розсилки дають змогу кільком агентам одночасно обробляти те саме повідомлення та відповідати на нього. Це дає змогу створювати спеціалізовані команди агентів, які працюють разом в одній групі WhatsApp або DM — і все це з використанням одного номера телефону.

Поточна сфера дії: **лише WhatsApp** (веб-канал).

Групи розсилки оцінюються після allowlist каналів і правил активації груп. У групах WhatsApp це означає, що розсилки відбуваються тоді, коли OpenClaw зазвичай відповідав би (наприклад, при згадуванні, залежно від ваших налаштувань групи).

## Варіанти використання

<AccordionGroup>
  <Accordion title="1. Спеціалізовані команди агентів">
    Розгорніть кількох агентів з атомарними, вузько сфокусованими обов’язками:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Кожен агент обробляє те саме повідомлення та надає свою спеціалізовану перспективу.

  </Accordion>
  <Accordion title="2. Багатомовна підтримка">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Робочі процеси забезпечення якості">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Автоматизація завдань">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## Конфігурація

### Базове налаштування

Додайте секцію верхнього рівня `broadcast` (поруч із `bindings`). Ключі — це peer id WhatsApp:

- групові чати: JID групи (наприклад, `120363403215116621@g.us`)
- DM: номер телефону у форматі E.164 (наприклад, `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Результат:** коли OpenClaw мав би відповісти в цьому чаті, він запустить усіх трьох агентів.

### Стратегія обробки

Керуйте тим, як агенти обробляють повідомлення:

<Tabs>
  <Tab title="parallel (default)">
    Усі агенти обробляють одночасно:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    Агенти обробляють по черзі (кожен наступний чекає завершення попереднього):

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

### Повний приклад

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Як це працює

### Потік повідомлення

<Steps>
  <Step title="Надходить вхідне повідомлення">
    Надходить повідомлення з групи WhatsApp або DM.
  </Step>
  <Step title="Перевірка розсилки">
    Система перевіряє, чи є peer ID у `broadcast`.
  </Step>
  <Step title="Якщо є у списку розсилки">
    - Усі перелічені агенти обробляють повідомлення.
    - Кожен агент має власний ключ сесії та ізольований контекст.
    - Агенти обробляють паралельно (типово) або послідовно.
  </Step>
  <Step title="Якщо немає у списку розсилки">
    Застосовується звичайна маршрутизація (перше binding, що збіглося).
  </Step>
</Steps>

<Note>
Групи розсилки не обходять allowlist каналів або правила активації груп (згадування/команди тощо). Вони лише змінюють _які агенти запускаються_, коли повідомлення відповідає умовам для обробки.
</Note>

### Ізоляція сесій

Кожен агент у групі розсилки підтримує повністю окремі:

- **Ключі сесій** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Історію розмови** (агент не бачить повідомлень інших агентів)
- **Робочий простір** (окремі sandbox, якщо налаштовано)
- **Доступ до інструментів** (різні списки allow/deny)
- **Пам’ять/контекст** (окремі `IDENTITY.md`, `SOUL.md` тощо)
- **Буфер контексту групи** (останні повідомлення групи, що використовуються як контекст) є спільним для peer, тож усі агенти розсилки бачать однаковий контекст під час спрацювання

Це дає змогу кожному агенту мати:

- Різні особистості
- Різний доступ до інструментів (наприклад, лише читання або читання-запис)
- Різні моделі (наприклад, opus vs. sonnet)
- Різні встановлені Skills

### Приклад: ізольовані сесії

У групі `120363403215116621@g.us` з агентами `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Контекст Alfred">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Контекст Bärbel">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Найкращі практики

<AccordionGroup>
  <Accordion title="1. Тримайте агентів сфокусованими">
    Проєктуйте кожного агента з однією чіткою відповідальністю:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Добре:** кожен агент має одне завдання. ❌ **Погано:** один універсальний агент "dev-helper".

  </Accordion>
  <Accordion title="2. Використовуйте описові назви">
    Має бути зрозуміло, що саме робить кожен агент:

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. Налаштовуйте різний доступ до інструментів">
    Надавайте агентам лише ті інструменти, які їм потрібні:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Лише читання
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Читання-запис
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. Стежте за продуктивністю">
    Якщо агентів багато, врахуйте таке:

    - Використовуйте `"strategy": "parallel"` (типово) для швидкості
    - Обмежуйте групи розсилки до 5–10 агентів
    - Використовуйте швидші моделі для простіших агентів

  </Accordion>
  <Accordion title="5. Обробляйте збої коректно">
    Агенти дають збої незалежно один від одного. Помилка одного агента не блокує інших:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Сумісність

### Провайдери

Групи розсилки наразі працюють із:

- ✅ WhatsApp (реалізовано)
- 🚧 Telegram (заплановано)
- 🚧 Discord (заплановано)
- 🚧 Slack (заплановано)

### Маршрутизація

Групи розсилки працюють разом з наявною маршрутизацією:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: відповідає лише alfred (звичайна маршрутизація).
- `GROUP_B`: відповідають agent1 І agent2 (розсилка).

<Note>
**Пріоритет:** `broadcast` має пріоритет над `bindings`.
</Note>

## Усунення неполадок

<AccordionGroup>
  <Accordion title="Агенти не відповідають">
    **Перевірте:**

    1. ID агентів існують у `agents.list`.
    2. Формат peer ID правильний (наприклад, `120363403215116621@g.us`).
    3. Агенти не перебувають у списках deny.

    **Налагодження:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Відповідає лише один агент">
    **Причина:** peer ID може бути у `bindings`, але не у `broadcast`.

    **Виправлення:** додайте його до конфігурації broadcast або видаліть із bindings.

  </Accordion>
  <Accordion title="Проблеми з продуктивністю">
    Якщо повільно при великій кількості агентів:

    - Зменште кількість агентів на групу.
    - Використовуйте легші моделі (sonnet замість opus).
    - Перевірте час запуску sandbox.

  </Accordion>
</AccordionGroup>

## Приклади

<AccordionGroup>
  <Accordion title="Приклад 1: команда для рев’ю коду">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    **Користувач надсилає:** фрагмент коду.

    **Відповіді:**

    - code-formatter: "Виправлено відступи та додано підказки типів"
    - security-scanner: "⚠️ Уразливість до SQL-ін’єкції в рядку 12"
    - test-coverage: "Покриття становить 45%, бракує тестів для випадків помилок"
    - docs-checker: "Бракує docstring для функції `process_data`"

  </Accordion>
  <Accordion title="Приклад 2: багатомовна підтримка">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## Довідник API

### Схема конфігурації

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Поля

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  Як обробляти агентів. `parallel` запускає всіх агентів одночасно; `sequential` запускає їх у порядку масиву.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID групи WhatsApp, номер E.164 або інший peer ID. Значення — це масив ID агентів, які мають обробляти повідомлення.
</ParamField>

## Обмеження

1. **Максимум агентів:** жорсткого ліміту немає, але 10+ агентів можуть працювати повільно.
2. **Спільний контекст:** агенти не бачать відповіді один одного (за задумом).
3. **Порядок повідомлень:** паралельні відповіді можуть надходити в будь-якому порядку.
4. **Ліміти швидкості:** усі агенти враховуються в лімітах швидкості WhatsApp.

## Майбутні покращення

Заплановані можливості:

- [ ] Режим спільного контексту (агенти бачать відповіді один одного)
- [ ] Координація агентів (агенти можуть подавати сигнали один одному)
- [ ] Динамічний вибір агентів (вибір агентів на основі вмісту повідомлення)
- [ ] Пріоритети агентів (деякі агенти відповідають раніше за інших)

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Групи](/uk/channels/groups)
- [Інструменти sandbox для кількох агентів](/uk/tools/multi-agent-sandbox-tools)
- [Pairing](/uk/channels/pairing)
- [Керування сесіями](/uk/concepts/session)
