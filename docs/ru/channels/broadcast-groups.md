---
read_when:
    - Настройка групп рассылки
    - Отладка ответов нескольких агентов в WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Отправка сообщения WhatsApp нескольким агентам
title: Группы рассылки
x-i18n:
    generated_at: "2026-07-01T08:21:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97e8c2ade5d12a437864e6aca0d475e586289f71155188afed216881ebf89f88
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Статус:** Экспериментально. Добавлено в 2026.1.9.
</Note>

## Обзор

Группы рассылки позволяют нескольким агентам одновременно обрабатывать одно и то же сообщение и отвечать на него. Это позволяет создавать специализированные команды агентов, которые работают вместе в одной группе WhatsApp или личной переписке, используя один номер телефона.

Текущая область применения: **только WhatsApp** (веб-канал).

Группы рассылки оцениваются после списков разрешений канала и правил активации групп. В группах WhatsApp это означает, что рассылки происходят тогда, когда OpenClaw обычно ответил бы (например, при упоминании, в зависимости от настроек вашей группы).

Живой QA-маршрут WhatsApp включает `whatsapp-broadcast-group-fanout`, который проверяет, что одно сообщение в группе с упоминанием может создать отдельные видимые ответы от двух настроенных агентов.

## Сценарии использования

<AccordionGroup>
  <Accordion title="1. Специализированные команды агентов">
    Разверните нескольких агентов с точными, сфокусированными обязанностями:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Каждый агент обрабатывает одно и то же сообщение и предоставляет свой специализированный взгляд.

  </Accordion>
  <Accordion title="2. Многоязычная поддержка">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Рабочие процессы контроля качества">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Автоматизация задач">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## Конфигурация

### Базовая настройка

Добавьте раздел верхнего уровня `broadcast` (рядом с `bindings`). Ключи — это peer ID WhatsApp:

- групповые чаты: JID группы (например, `120363403215116621@g.us`)
- личные переписки: номер телефона в формате E.164 (например, `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Результат:** Когда OpenClaw должен ответить в этом чате, он запустит всех трех агентов.

### Стратегия обработки

Управляйте тем, как агенты обрабатывают сообщения:

<Tabs>
  <Tab title="parallel (по умолчанию)">
    Все агенты обрабатывают одновременно:

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
    Агенты обрабатывают по порядку (каждый ждет завершения предыдущего):

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

### Полный пример

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

## Как это работает

### Поток сообщений

<Steps>
  <Step title="Поступает входящее сообщение">
    Поступает сообщение из группы WhatsApp или личной переписки.
  </Step>
  <Step title="Маршрутизация и допуск">
    OpenClaw применяет списки разрешений канала, правила активации групп и настроенное владение привязками ACP.
  </Step>
  <Step title="Проверка рассылки">
    Если ни одна настроенная привязка ACP не владеет маршрутом, OpenClaw проверяет, есть ли peer ID в `broadcast`.
  </Step>
  <Step title="Если применяется рассылка">
    - Все перечисленные агенты обрабатывают сообщение.
    - У каждого агента есть собственный ключ сеанса и изолированный контекст.
    - Агенты обрабатывают параллельно (по умолчанию) или последовательно.

  </Step>
  <Step title="Если рассылка не применяется">
    OpenClaw отправляет обычный маршрут или настроенный маршрут сеанса ACP, выбранный во время маршрутизации.
  </Step>
</Steps>

<Note>
Группы рассылки не обходят списки разрешений канала или правила активации групп (упоминания/команды/и т. д.). Они меняют только то, _какие агенты запускаются_, когда сообщение подходит для обработки.
</Note>

### Изоляция сеансов

Каждый агент в группе рассылки поддерживает полностью отдельные:

- **Ключи сеанса** (`agent:alfred:whatsapp:group:120363...` и `agent:baerbel:whatsapp:group:120363...`)
- **Историю диалога** (агент не видит сообщения других агентов)
- **Рабочую область** (отдельные песочницы, если настроены)
- **Доступ к инструментам** (разные списки разрешений/запретов)
- **Память/контекст** (отдельные IDENTITY.md, SOUL.md и т. д.)
- **Буфер контекста группы** (последние сообщения группы, используемые для контекста) общий для каждого peer, поэтому все агенты рассылки видят один и тот же контекст при запуске

Это позволяет каждому агенту иметь:

- Разные личности
- Разный доступ к инструментам (например, только чтение или чтение и запись)
- Разные модели (например, opus или sonnet)
- Разные установленные Skills

### Пример: изолированные сеансы

В группе `120363403215116621@g.us` с агентами `["alfred", "baerbel"]`:

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

## Рекомендации

<AccordionGroup>
  <Accordion title="1. Сохраняйте фокус агентов">
    Проектируйте каждого агента с одной четкой ответственностью:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Хорошо:** У каждого агента одна задача. ❌ **Плохо:** Один универсальный агент "dev-helper".

  </Accordion>
  <Accordion title="2. Используйте описательные имена">
    Сделайте понятным, что делает каждый агент:

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
  <Accordion title="3. Настраивайте разный доступ к инструментам">
    Давайте агентам только те инструменты, которые им нужны:

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

    `reviewer` доступен только режим чтения. `fixer` может читать и записывать.

  </Accordion>
  <Accordion title="4. Отслеживайте производительность">
    При большом количестве агентов учитывайте:

    - Использование `"strategy": "parallel"` (по умолчанию) для скорости
    - Ограничение групп рассылки до 5-10 агентов
    - Использование более быстрых моделей для более простых агентов

  </Accordion>
  <Accordion title="5. Обрабатывайте сбои корректно">
    Агенты дают сбой независимо. Ошибка одного агента не блокирует остальных:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Совместимость

### Провайдеры

Группы рассылки сейчас работают с:

- ✅ WhatsApp (реализовано)
- 🚧 Telegram (запланировано)
- 🚧 Discord (запланировано)
- 🚧 Slack (запланировано)

### Маршрутизация

Группы рассылки работают вместе с существующей маршрутизацией:

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

- `GROUP_A`: отвечает только alfred (обычная маршрутизация).
- `GROUP_B`: отвечают agent1 И agent2 (рассылка).

<Note>
**Приоритет:** `broadcast` имеет приоритет над обычными привязками маршрутов. Настроенные привязки ACP (`bindings[].type="acp"`) являются эксклюзивными: когда одна из них совпадает, OpenClaw отправляет сообщение в настроенный сеанс ACP вместо веерной рассылки.
</Note>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Агенты не отвечают">
    **Проверьте:**

    1. ID агентов существуют в `agents.list`.
    2. Формат peer ID корректен (например, `120363403215116621@g.us`).
    3. Агенты не находятся в списках запрета.

    **Отладка:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Отвечает только один агент">
    **Причина:** Peer ID может находиться в обычных привязках маршрутов, но не в `broadcast`, или он может совпадать с эксклюзивной настроенной привязкой ACP.

    **Исправление:** Добавьте peer, привязанные к обычным маршрутам, в конфигурацию рассылки или удалите/измените настроенную привязку ACP, если нужна веерная рассылка.

  </Accordion>
  <Accordion title="Проблемы с производительностью">
    Если работа замедляется при большом количестве агентов:

    - Уменьшите количество агентов на группу.
    - Используйте более легкие модели (sonnet вместо opus).
    - Проверьте время запуска песочницы.

  </Accordion>
</AccordionGroup>

## Примеры

<AccordionGroup>
  <Accordion title="Пример 1: Команда проверки кода">
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

    **Пользователь отправляет:** Фрагмент кода.

    **Ответы:**

    - code-formatter: "Fixed indentation and added type hints"
    - security-scanner: "⚠️ SQL injection vulnerability in line 12"
    - test-coverage: "Coverage is 45%, missing tests for error cases"
    - docs-checker: "Missing docstring for function `process_data`"

  </Accordion>
  <Accordion title="Пример 2: Многоязычная поддержка">
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

## Справочник API

### Схема конфигурации

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
  Как обрабатывать агентов. `parallel` запускает всех агентов одновременно; `sequential` запускает их в порядке массива.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID группы WhatsApp, номер E.164 или другой идентификатор peer. Значение — массив идентификаторов агентов, которые должны обрабатывать сообщения.
</ParamField>

## Ограничения

1. **Максимум агентов:** Жесткого ограничения нет, но 10+ агентов могут работать медленно.
2. **Общий контекст:** Агенты не видят ответы друг друга (это сделано намеренно).
3. **Порядок сообщений:** Параллельные ответы могут приходить в любом порядке.
4. **Ограничения частоты:** Все агенты учитываются в ограничениях частоты WhatsApp.

## Будущие улучшения

Запланированные функции:

- [ ] Режим общего контекста (агенты видят ответы друг друга)
- [ ] Координация агентов (агенты могут посылать сигналы друг другу)
- [ ] Динамический выбор агентов (выбор агентов на основе содержимого сообщения)
- [ ] Приоритеты агентов (некоторые агенты отвечают раньше других)

## Связанные материалы

- [Маршрутизация каналов](/ru/channels/channel-routing)
- [Группы](/ru/channels/groups)
- [Инструменты многоагентной песочницы](/ru/tools/multi-agent-sandbox-tools)
- [Сопряжение](/ru/channels/pairing)
- [Управление сеансами](/ru/concepts/session)
