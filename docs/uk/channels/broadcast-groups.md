---
read_when:
    - Налаштування груп трансляції
    - Налагодження відповідей кількох агентів у WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Надіслати повідомлення WhatsApp кільком агентам
title: Групи трансляції
x-i18n:
    generated_at: "2026-07-01T08:28:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97e8c2ade5d12a437864e6aca0d475e586289f71155188afed216881ebf89f88
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Статус:** Експериментально. Додано у 2026.1.9.
</Note>

## Огляд

Групи трансляції дають змогу кільком агентам одночасно обробляти одне й те саме повідомлення та відповідати на нього. Це дає змогу створювати спеціалізовані команди агентів, які працюють разом в одній групі WhatsApp або DM — і все це з використанням одного номера телефону.

Поточний обсяг: **лише WhatsApp** (вебканал).

Групи трансляції оцінюються після списків дозволених каналів і правил активації груп. У групах WhatsApp це означає, що трансляції відбуваються тоді, коли OpenClaw зазвичай відповів би (наприклад: при згадці, залежно від налаштувань вашої групи).

Жива лінія QA WhatsApp включає `whatsapp-broadcast-group-fanout`, яка перевіряє, що одне згадане групове повідомлення може створити різні видимі відповіді від двох налаштованих агентів.

## Випадки використання

<AccordionGroup>
  <Accordion title="1. Specialized agent teams">
    Розгортайте кількох агентів з атомарними, сфокусованими обов’язками:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Кожен агент обробляє те саме повідомлення й надає свою спеціалізовану перспективу.

  </Accordion>
  <Accordion title="2. Multi-language support">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Quality assurance workflows">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Task automation">
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

Додайте розділ верхнього рівня `broadcast` (поруч із `bindings`). Ключі — це peer ID WhatsApp:

- групові чати: JID групи (наприклад, `120363403215116621@g.us`)
- DM: номер телефону у форматі E.164 (наприклад, `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Результат:** Коли OpenClaw відповів би в цьому чаті, він запустить усіх трьох агентів.

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
    Агенти обробляють по порядку (кожен чекає, доки попередній завершить роботу):

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
  <Step title="Incoming message arrives">
    Надходить повідомлення групи WhatsApp або DM.
  </Step>
  <Step title="Route and admission">
    OpenClaw застосовує списки дозволених каналів, правила активації груп і налаштоване володіння прив’язками ACP.
  </Step>
  <Step title="Broadcast check">
    Якщо жодна налаштована прив’язка ACP не володіє маршрутом, OpenClaw перевіряє, чи є peer ID у `broadcast`.
  </Step>
  <Step title="If broadcast applies">
    - Усі перелічені агенти обробляють повідомлення.
    - Кожен агент має власний ключ сеансу та ізольований контекст.
    - Агенти обробляють паралельно (типово) або послідовно.

  </Step>
  <Step title="If broadcast does not apply">
    OpenClaw відправляє звичайний маршрут або налаштований маршрут сеансу ACP, вибраний під час маршрутизації.
  </Step>
</Steps>

<Note>
Групи трансляції не обходять списки дозволених каналів або правила активації груп (згадки/команди тощо). Вони лише змінюють _які агенти запускаються_, коли повідомлення придатне для обробки.
</Note>

### Ізоляція сеансів

Кожен агент у групі трансляції підтримує повністю окремі:

- **Ключі сеансу** (`agent:alfred:whatsapp:group:120363...` проти `agent:baerbel:whatsapp:group:120363...`)
- **Історію розмови** (агент не бачить повідомлення інших агентів)
- **Робочий простір** (окремі пісочниці, якщо налаштовано)
- **Доступ до інструментів** (різні списки дозволів/заборон)
- **Пам’ять/контекст** (окремі IDENTITY.md, SOUL.md тощо)
- **Буфер контексту групи** (нещодавні групові повідомлення, що використовуються як контекст) спільний для кожного peer, тому всі агенти трансляції бачать той самий контекст під час запуску

Це дає змогу кожному агенту мати:

- Різні особистості
- Різний доступ до інструментів (наприклад, лише читання проти читання й запису)
- Різні моделі (наприклад, opus проти sonnet)
- Різні встановлені Skills

### Приклад: ізольовані сеанси

У групі `120363403215116621@g.us` з агентами `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Alfred's context">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel's context">
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
  <Accordion title="1. Keep agents focused">
    Проєктуйте кожного агента з однією чіткою відповідальністю:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Добре:** Кожен агент має одну задачу. ❌ **Погано:** Один універсальний агент "dev-helper".

  </Accordion>
  <Accordion title="2. Use descriptive names">
    Зробіть очевидним, що робить кожен агент:

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
  <Accordion title="3. Configure different tool access">
    Надавайте агентам лише ті інструменти, які їм потрібні:

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

    `reviewer` має доступ лише для читання. `fixer` може читати й записувати.

  </Accordion>
  <Accordion title="4. Monitor performance">
    За великої кількості агентів враховуйте:

    - Використання `"strategy": "parallel"` (типово) для швидкості
    - Обмеження груп трансляції до 5-10 агентів
    - Використання швидших моделей для простіших агентів

  </Accordion>
  <Accordion title="5. Handle failures gracefully">
    Агенти дають збої незалежно. Помилка одного агента не блокує інших:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Сумісність

### Провайдери

Групи трансляції наразі працюють із:

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
**Пріоритет:** `broadcast` має пріоритет над звичайними прив’язками маршрутів. Налаштовані прив’язки ACP (`bindings[].type="acp"`) є ексклюзивними: коли одна з них збігається, OpenClaw відправляє до налаштованого сеансу ACP замість fan-out трансляції.
</Note>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Agents not responding">
    **Перевірте:**

    1. ID агентів існують у `agents.list`.
    2. Формат peer ID правильний (наприклад, `120363403215116621@g.us`).
    3. Агентів немає в списках заборони.

    **Налагодження:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Only one agent responding">
    **Причина:** Peer ID може бути у звичайних прив’язках маршрутів, але не в `broadcast`, або він може відповідати ексклюзивній налаштованій прив’язці ACP.

    **Виправлення:** Додайте peers, прив’язані до звичайних маршрутів, у конфігурацію трансляції або видаліть/змініть налаштовану прив’язку ACP, якщо потрібна fan-out трансляція.

  </Accordion>
  <Accordion title="Performance issues">
    Якщо робота повільна з великою кількістю агентів:

    - Зменште кількість агентів на групу.
    - Використовуйте легші моделі (sonnet замість opus).
    - Перевірте час запуску пісочниці.

  </Accordion>
</AccordionGroup>

## Приклади

<AccordionGroup>
  <Accordion title="Example 1: Code review team">
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
  <Accordion title="Example 2: Multi-language support">
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
  JID групи WhatsApp, номер E.164 або інший ідентифікатор peer. Значенням є масив ідентифікаторів агентів, які мають обробляти повідомлення.
</ParamField>

## Обмеження

1. **Максимальна кількість агентів:** Жорсткого обмеження немає, але 10+ агентів можуть працювати повільно.
2. **Спільний контекст:** Агенти не бачать відповіді одне одного (за задумом).
3. **Порядок повідомлень:** Паралельні відповіді можуть надходити в будь-якому порядку.
4. **Обмеження швидкості:** Усі агенти враховуються в обмеженнях швидкості WhatsApp.

## Майбутні вдосконалення

Заплановані функції:

- [ ] Режим спільного контексту (агенти бачать відповіді одне одного)
- [ ] Координація агентів (агенти можуть надсилати сигнали одне одному)
- [ ] Динамічний вибір агента (вибір агентів на основі вмісту повідомлення)
- [ ] Пріоритети агентів (деякі агенти відповідають раніше за інших)

## Пов’язане

- [Маршрутизація каналів](/uk/channels/channel-routing)
- [Групи](/uk/channels/groups)
- [Інструменти мультиагентної пісочниці](/uk/tools/multi-agent-sandbox-tools)
- [Сполучення](/uk/channels/pairing)
- [Керування сеансами](/uk/concepts/session)
