---
read_when:
    - Налаштування груп розсилки
    - Налагодження багатоагентних відповідей у WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Розіслати повідомлення WhatsApp кільком агентам
title: Групи трансляції
x-i18n:
    generated_at: "2026-05-03T22:49:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab43d3c3ffddb360340469433d74a380fbab98e662b2463a54f62eafc375b55
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Статус:** Експериментально. Додано у 2026.1.9.
</Note>

## Огляд

Групи трансляції дають змогу кільком агентам обробляти одне й те саме повідомлення та відповідати на нього одночасно. Це дає змогу створювати спеціалізовані команди агентів, які працюють разом в одній групі WhatsApp або особистому чаті — і все це з використанням одного номера телефону.

Поточна область застосування: **лише WhatsApp** (вебканал).

Групи трансляції оцінюються після списків дозволених каналів і правил активації груп. У групах WhatsApp це означає, що трансляції відбуваються тоді, коли OpenClaw зазвичай відповідав би (наприклад, за згадкою, залежно від налаштувань вашої групи).

## Сценарії використання

<AccordionGroup>
  <Accordion title="1. Спеціалізовані команди агентів">
    Розгорніть кількох агентів з атомарними, сфокусованими обов’язками:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Кожен агент обробляє одне й те саме повідомлення та надає свою спеціалізовану перспективу.

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
  <Accordion title="3. Робочі процеси контролю якості">
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

Додайте розділ верхнього рівня `broadcast` (поруч із `bindings`). Ключі — це ідентифікатори peer WhatsApp:

- групові чати: JID групи (наприклад, `120363403215116621@g.us`)
- особисті чати: номер телефону E.164 (наприклад, `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Результат:** Коли OpenClaw мав би відповісти в цьому чаті, він запустить усіх трьох агентів.

### Стратегія обробки

Керуйте тим, як агенти обробляють повідомлення:

<Tabs>
  <Tab title="parallel (типово)">
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
    Агенти обробляють по черзі (кожен чекає завершення попереднього):

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

### Потік повідомлень

<Steps>
  <Step title="Надходить вхідне повідомлення">
    Надходить повідомлення з групи WhatsApp або особистого чату.
  </Step>
  <Step title="Перевірка трансляції">
    Система перевіряє, чи є ідентифікатор peer у `broadcast`.
  </Step>
  <Step title="Якщо є у списку трансляції">
    - Усі перелічені агенти обробляють повідомлення.
    - Кожен агент має власний ключ сесії та ізольований контекст.
    - Агенти обробляють паралельно (типово) або послідовно.

  </Step>
  <Step title="Якщо немає у списку трансляції">
    Застосовується звичайна маршрутизація (перше відповідне прив’язування).
  </Step>
</Steps>

<Note>
Групи трансляції не обходять списки дозволених каналів або правила активації груп (згадки/команди тощо). Вони лише змінюють, _які агенти запускаються_, коли повідомлення придатне для обробки.
</Note>

### Ізоляція сесій

Кожен агент у групі трансляції підтримує повністю окремі:

- **Ключі сесій** (`agent:alfred:whatsapp:group:120363...` проти `agent:baerbel:whatsapp:group:120363...`)
- **Історію розмови** (агент не бачить повідомлень інших агентів)
- **Робочий простір** (окремі пісочниці, якщо налаштовано)
- **Доступ до інструментів** (різні списки дозволу/заборони)
- **Пам’ять/контекст** (окремі IDENTITY.md, SOUL.md тощо)
- **Буфер групового контексту** (нещодавні повідомлення групи, що використовуються як контекст) спільний для кожного peer, тому всі агенти трансляції бачать один і той самий контекст під час запуску

Це дає змогу кожному агенту мати:

- Різні персоналії
- Різний доступ до інструментів (наприклад, лише читання або читання-запис)
- Різні моделі (наприклад, opus проти sonnet)
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

    ✅ **Добре:** Кожен агент має одне завдання. ❌ **Погано:** Один загальний агент "dev-helper".

  </Accordion>
  <Accordion title="2. Використовуйте описові назви">
    Зробіть зрозумілим, що робить кожен агент:

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
    Надавайте агентам лише потрібні їм інструменти:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` має доступ лише для читання. `fixer` може читати й писати.

  </Accordion>
  <Accordion title="4. Відстежуйте продуктивність">
    За великої кількості агентів врахуйте:

    - Використання `"strategy": "parallel"` (типово) для швидкості
    - Обмеження груп трансляції до 5-10 агентів
    - Використання швидших моделей для простіших агентів

  </Accordion>
  <Accordion title="5. Обробляйте збої коректно">
    Агенти зазнають збоїв незалежно. Помилка одного агента не блокує інших:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Сумісність

### Провайдери

Групи трансляції зараз працюють із:

- ✅ WhatsApp (реалізовано)
- 🚧 Telegram (заплановано)
- 🚧 Discord (заплановано)
- 🚧 Slack (заплановано)

### Маршрутизація

Групи трансляції працюють разом з наявною маршрутизацією:

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
- `GROUP_B`: відповідають agent1 І agent2 (трансляція).

<Note>
**Пріоритет:** `broadcast` має пріоритет над `bindings`.
</Note>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Агенти не відповідають">
    **Перевірте:**

    1. Ідентифікатори агентів існують у `agents.list`.
    2. Формат ідентифікатора peer правильний (наприклад, `120363403215116621@g.us`).
    3. Агентів немає у списках заборони.

    **Налагодження:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Відповідає лише один агент">
    **Причина:** Ідентифікатор peer може бути в `bindings`, але не в `broadcast`.

    **Виправлення:** Додайте до конфігурації трансляції або видаліть із прив’язувань.

  </Accordion>
  <Accordion title="Проблеми з продуктивністю">
    Якщо повільно з багатьма агентами:

    - Зменште кількість агентів у групі.
    - Використовуйте легші моделі (sonnet замість opus).
    - Перевірте час запуску пісочниці.

  </Accordion>
</AccordionGroup>

## Приклади

<AccordionGroup>
  <Accordion title="Приклад 1: Команда рев’ю коду">
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

    **Користувач надсилає:** Фрагмент коду.

    **Відповіді:**

    - code-formatter: "Fixed indentation and added type hints"
    - security-scanner: "⚠️ SQL injection vulnerability in line 12"
    - test-coverage: "Coverage is 45%, missing tests for error cases"
    - docs-checker: "Missing docstring for function `process_data`"

  </Accordion>
  <Accordion title="Приклад 2: Багатомовна підтримка">
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
  JID групи WhatsApp, номер E.164 або інший ідентифікатор peer. Значення — це масив ідентифікаторів агентів, які мають обробляти повідомлення.
</ParamField>

## Обмеження

1. **Максимум агентів:** Жорсткого обмеження немає, але 10+ агентів можуть працювати повільно.
2. **Спільний контекст:** Агенти не бачать відповіді один одного (за задумом).
3. **Порядок повідомлень:** Паралельні відповіді можуть надходити в будь-якому порядку.
4. **Обмеження частоти:** Усі агенти враховуються в обмеженнях частоти WhatsApp.

## Майбутні покращення

Заплановані функції:

- [ ] Режим спільного контексту (агенти бачать відповіді один одного)
- [ ] Координація агентів (агенти можуть сигналізувати один одному)
- [ ] Динамічний вибір агентів (вибір агентів на основі вмісту повідомлення)
- [ ] Пріоритети агентів (деякі агенти відповідають раніше за інших)

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Групи](/uk/channels/groups)
- [Інструменти пісочниці для кількох агентів](/uk/tools/multi-agent-sandbox-tools)
- [Сполучення](/uk/channels/pairing)
- [Керування сеансами](/uk/concepts/session)
