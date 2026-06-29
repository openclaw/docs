---
read_when:
    - Настройка групп рассылки
    - Отладка ответов нескольких агентов в WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Разослать сообщение WhatsApp нескольким агентам
title: Группы рассылки
x-i18n:
    generated_at: "2026-06-28T22:33:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a89b936322baf0fea7b487cb5354b9fad3fc021abb2970f7cd934b1880da2a0e
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Статус:** экспериментально. Добавлено в 2026.1.9.
</Note>

## Обзор

Broadcast Groups позволяют нескольким агентам одновременно обрабатывать одно и то же сообщение и отвечать на него. Это позволяет создавать специализированные команды агентов, которые работают вместе в одной группе WhatsApp или личном чате, используя один номер телефона.

Текущая область применения: **только WhatsApp** (веб-канал).

Broadcast groups оцениваются после allowlist каналов и правил активации групп. В группах WhatsApp это означает, что широковещательная обработка происходит тогда, когда OpenClaw обычно ответил бы (например, при упоминании, в зависимости от настроек группы).

## Сценарии использования

<AccordionGroup>
  <Accordion title="1. Специализированные команды агентов">
    Разверните несколько агентов с атомарными, сфокусированными обязанностями:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Каждый агент обрабатывает одно и то же сообщение и предоставляет свою специализированную точку зрения.

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

Добавьте раздел верхнего уровня `broadcast` (рядом с `bindings`). Ключи — это идентификаторы peer в WhatsApp:

- групповые чаты: group JID (например, `120363403215116621@g.us`)
- личные чаты: номер телефона в формате E.164 (например, `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Результат:** когда OpenClaw должен ответить в этом чате, он запустит всех трех агентов.

### Стратегия обработки

Управляйте тем, как агенты обрабатывают сообщения:

<Tabs>
  <Tab title="parallel (по умолчанию)">
    Все агенты обрабатывают сообщение одновременно:

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
    Агенты обрабатывают сообщение по порядку (каждый ждет завершения предыдущего):

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
    Поступает сообщение из группы WhatsApp или личного чата.
  </Step>
  <Step title="Маршрутизация и допуск">
    OpenClaw применяет allowlist каналов, правила активации групп и настроенное владение привязками ACP.
  </Step>
  <Step title="Проверка broadcast">
    Если ни одна настроенная привязка ACP не владеет маршрутом, OpenClaw проверяет, есть ли peer ID в `broadcast`.
  </Step>
  <Step title="Если применяется broadcast">
    - Все перечисленные агенты обрабатывают сообщение.
    - У каждого агента есть собственный ключ сессии и изолированный контекст.
    - Агенты обрабатывают сообщение параллельно (по умолчанию) или последовательно.

  </Step>
  <Step title="Если broadcast не применяется">
    OpenClaw отправляет сообщение по обычному маршруту или по настроенному маршруту сессии ACP, выбранному во время маршрутизации.
  </Step>
</Steps>

<Note>
Broadcast groups не обходят allowlist каналов или правила активации групп (упоминания/команды/и т. д.). Они меняют только _какие агенты запускаются_, когда сообщение подходит для обработки.
</Note>

### Изоляция сессий

Каждый агент в broadcast group поддерживает полностью отдельные:

- **Ключи сессий** (`agent:alfred:whatsapp:group:120363...` и `agent:baerbel:whatsapp:group:120363...`)
- **Историю разговора** (агент не видит сообщения других агентов)
- **Рабочую область** (отдельные песочницы, если настроены)
- **Доступ к инструментам** (разные списки allow/deny)
- **Память/контекст** (отдельные IDENTITY.md, SOUL.md и т. д.)
- **Буфер контекста группы** (последние сообщения группы, используемые как контекст) является общим для каждого peer, поэтому все агенты broadcast видят один и тот же контекст при запуске

Это позволяет каждому агенту иметь:

- Разные характеры
- Разный доступ к инструментам (например, только чтение или чтение-запись)
- Разные модели (например, opus или sonnet)
- Разные установленные Skills

### Пример: изолированные сессии

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

## Лучшие практики

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

    ✅ **Хорошо:** у каждого агента одна задача. ❌ **Плохо:** один универсальный агент "dev-helper".

  </Accordion>
  <Accordion title="2. Используйте описательные имена">
    Сделайте так, чтобы было понятно, что делает каждый агент:

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
  <Accordion title="3. Настройте разный доступ к инструментам">
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

    `reviewer` доступен только для чтения. `fixer` может читать и писать.

  </Accordion>
  <Accordion title="4. Отслеживайте производительность">
    При большом количестве агентов учитывайте:

    - Использование `"strategy": "parallel"` (по умолчанию) для скорости
    - Ограничение broadcast groups до 5-10 агентов
    - Использование более быстрых моделей для более простых агентов

  </Accordion>
  <Accordion title="5. Корректно обрабатывайте сбои">
    Агенты завершаются с ошибками независимо. Ошибка одного агента не блокирует остальных:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Совместимость

### Провайдеры

Broadcast groups сейчас работают с:

- ✅ WhatsApp (реализовано)
- 🚧 Telegram (запланировано)
- 🚧 Discord (запланировано)
- 🚧 Slack (запланировано)

### Маршрутизация

Broadcast groups работают вместе с существующей маршрутизацией:

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
- `GROUP_B`: отвечают agent1 И agent2 (broadcast).

<Note>
**Приоритет:** `broadcast` имеет приоритет над обычными привязками маршрутов. Настроенные привязки ACP (`bindings[].type="acp"`) являются эксклюзивными: когда одна из них совпадает, OpenClaw отправляет сообщение в настроенную сессию ACP вместо широковещательной рассылки с разветвлением.
</Note>

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Агенты не отвечают">
    **Проверьте:**

    1. ID агентов существуют в `agents.list`.
    2. Формат peer ID корректен (например, `120363403215116621@g.us`).
    3. Агенты не находятся в deny lists.

    **Отладка:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Отвечает только один агент">
    **Причина:** peer ID может находиться в обычных привязках маршрута, но не в `broadcast`, или он может совпадать с эксклюзивной настроенной привязкой ACP.

    **Исправление:** добавьте peer, привязанные к обычным маршрутам, в конфигурацию broadcast или удалите/измените настроенную привязку ACP, если нужна широковещательная рассылка с разветвлением.

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
  <Accordion title="Пример 1: команда ревью кода">
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

    **Пользователь отправляет:** фрагмент кода.

    **Ответы:**

    - code-formatter: "Fixed indentation and added type hints"
    - security-scanner: "⚠️ SQL injection vulnerability in line 12"
    - test-coverage: "Coverage is 45%, missing tests for error cases"
    - docs-checker: "Missing docstring for function `process_data`"

  </Accordion>
  <Accordion title="Пример 2: многоязычная поддержка">
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
  WhatsApp group JID, номер E.164 или другой peer ID. Значение — массив ID агентов, которые должны обрабатывать сообщения.
</ParamField>

## Ограничения

1. **Максимум агентов:** Жесткого ограничения нет, но 10+ агентов могут работать медленно.
2. **Общий контекст:** Агенты не видят ответы друг друга (так задумано).
3. **Порядок сообщений:** Параллельные ответы могут приходить в любом порядке.
4. **Ограничения частоты:** Все агенты учитываются в ограничениях частоты WhatsApp.

## Будущие улучшения

Запланированные функции:

- [ ] Режим общего контекста (агенты видят ответы друг друга)
- [ ] Координация агентов (агенты могут посылать сигналы друг другу)
- [ ] Динамический выбор агента (выбор агентов на основе содержимого сообщения)
- [ ] Приоритеты агентов (некоторые агенты отвечают раньше других)

## Связанные материалы

- [Маршрутизация каналов](/ru/channels/channel-routing)
- [Группы](/ru/channels/groups)
- [Инструменты песочницы для нескольких агентов](/ru/tools/multi-agent-sandbox-tools)
- [Сопряжение](/ru/channels/pairing)
- [Управление сеансами](/ru/concepts/session)
