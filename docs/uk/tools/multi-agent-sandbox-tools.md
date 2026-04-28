---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Пісочниця й обмеження інструментів для кожного агента, пріоритетність і приклади
title: Багатоагентна пісочниця та інструменти
x-i18n:
    generated_at: "2026-04-28T11:27:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c43b9ff881d05c49f3e9d93859dd620e7b8e9febfddb16b7a9fd8b8e331e65
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Кожен агент у багатоагентному налаштуванні може перевизначати глобальну політику пісочниці та інструментів. На цій сторінці описано конфігурацію для окремих агентів, правила пріоритету та приклади.

<CardGroup cols={3}>
  <Card title="Пісочниця" href="/uk/gateway/sandboxing">
    Бекенди та режими — повна довідка з пісочниці.
  </Card>
  <Card title="Пісочниця, політика інструментів і підвищений режим" href="/uk/gateway/sandbox-vs-tool-policy-vs-elevated">
    Налагодження питання «чому це заблоковано?»
  </Card>
  <Card title="Підвищений режим" href="/uk/tools/elevated">
    Підвищений exec для довірених відправників.
  </Card>
</CardGroup>

<Warning>
Автентифікація налаштовується для кожного агента: кожен агент читає зі свого сховища автентифікації `agentDir` у `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Облікові дані **не** спільні між агентами. Ніколи не використовуйте той самий `agentDir` для кількох агентів. Якщо потрібно поділитися обліковими даними, скопіюйте `auth-profiles.json` до `agentDir` іншого агента.
</Warning>

---

## Приклади конфігурації

<AccordionGroup>
  <Accordion title="Приклад 1: особистий + обмежений сімейний агент">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "name": "Personal Assistant",
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "family",
            "name": "Family Bot",
            "workspace": "~/.openclaw/workspace-family",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
            }
          }
        ]
      },
      "bindings": [
        {
          "agentId": "family",
          "match": {
            "provider": "whatsapp",
            "accountId": "*",
            "peer": {
              "kind": "group",
              "id": "120363424282127706@g.us"
            }
          }
        }
      ]
    }
    ```

    **Результат:**

    - агент `main`: працює на хості, повний доступ до інструментів.
    - агент `family`: працює в Docker (один контейнер на агента), лише інструмент `read`.

  </Accordion>
  <Accordion title="Приклад 2: робочий агент зі спільною пісочницею">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "personal",
            "workspace": "~/.openclaw/workspace-personal",
            "sandbox": { "mode": "off" }
          },
          {
            "id": "work",
            "workspace": "~/.openclaw/workspace-work",
            "sandbox": {
              "mode": "all",
              "scope": "shared",
              "workspaceRoot": "/tmp/work-sandboxes"
            },
            "tools": {
              "allow": ["read", "write", "apply_patch", "exec"],
              "deny": ["browser", "gateway", "discord"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="Приклад 2b: глобальний профіль кодування + агент лише для повідомлень">
    ```json
    {
      "tools": { "profile": "coding" },
      "agents": {
        "list": [
          {
            "id": "support",
            "tools": { "profile": "messaging", "allow": ["slack"] }
          }
        ]
      }
    }
    ```

    **Результат:**

    - агенти за замовчуванням отримують інструменти кодування.
    - агент `support` призначений лише для повідомлень (+ інструмент Slack).

  </Accordion>
  <Accordion title="Приклад 3: різні режими пісочниці для кожного агента">
    ```json
    {
      "agents": {
        "defaults": {
          "sandbox": {
            "mode": "non-main",
            "scope": "session"
          }
        },
        "list": [
          {
            "id": "main",
            "workspace": "~/.openclaw/workspace",
            "sandbox": {
              "mode": "off"
            }
          },
          {
            "id": "public",
            "workspace": "~/.openclaw/workspace-public",
            "sandbox": {
              "mode": "all",
              "scope": "agent"
            },
            "tools": {
              "allow": ["read"],
              "deny": ["exec", "write", "edit", "apply_patch"]
            }
          }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

---

## Пріоритет конфігурації

Коли існують і глобальні (`agents.defaults.*`), і специфічні для агента (`agents.list[].*`) конфігурації:

### Конфігурація пісочниці

Налаштування для конкретного агента перевизначають глобальні:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` перевизначає `agents.defaults.sandbox.{docker,browser,prune}.*` для цього агента (ігнорується, коли область пісочниці визначається як `"shared"`).
</Note>

### Обмеження інструментів

Порядок фільтрації такий:

<Steps>
  <Step title="Профіль інструментів">
    `tools.profile` або `agents.list[].tools.profile`.
  </Step>
  <Step title="Профіль інструментів провайдера">
    `tools.byProvider[provider].profile` або `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Глобальна політика інструментів">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Політика інструментів провайдера">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Політика інструментів для конкретного агента">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Політика провайдера агента">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Політика інструментів пісочниці">
    `tools.sandbox.tools` або `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Політика інструментів підагента">
    `tools.subagents.tools`, якщо застосовно.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Правила пріоритету">
    - Кожен рівень може додатково обмежувати інструменти, але не може знову дозволити інструменти, заборонені на попередніх рівнях.
    - Якщо задано `agents.list[].tools.sandbox.tools`, воно замінює `tools.sandbox.tools` для цього агента.
    - Якщо задано `agents.list[].tools.profile`, воно перевизначає `tools.profile` для цього агента.
    - Ключі інструментів провайдера приймають або `provider` (наприклад, `google-antigravity`), або `provider/model` (наприклад, `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Поведінка порожнього списку дозволів">
    Якщо будь-який явний список дозволів у цьому ланцюжку залишає запуск без доступних для виклику інструментів, OpenClaw зупиняється до надсилання промпта моделі. Це навмисно: агент, налаштований із відсутнім інструментом, наприклад `agents.list[].tools.allow: ["query_db"]`, має явно завершитися помилкою, доки Plugin, який реєструє `query_db`, не буде ввімкнено, а не продовжувати як агент лише з текстом.
  </Accordion>
</AccordionGroup>

Політики інструментів підтримують скорочення `group:*`, які розгортаються в кілька інструментів. Повний список див. у [Групи інструментів](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Перевизначення підвищеного режиму для окремих агентів (`agents.list[].tools.elevated`) можуть додатково обмежувати підвищений exec для конкретних агентів. Докладніше див. у [Підвищений режим](/uk/tools/elevated).

---

## Міграція з одного агента

<Tabs>
  <Tab title="До (один агент)">
    ```json
    {
      "agents": {
        "defaults": {
          "workspace": "~/.openclaw/workspace",
          "sandbox": {
            "mode": "non-main"
          }
        }
      },
      "tools": {
        "sandbox": {
          "tools": {
            "allow": ["read", "write", "apply_patch", "exec"],
            "deny": []
          }
        }
      }
    }
    ```
  </Tab>
  <Tab title="Після (багато агентів)">
    ```json
    {
      "agents": {
        "list": [
          {
            "id": "main",
            "default": true,
            "workspace": "~/.openclaw/workspace",
            "sandbox": { "mode": "off" }
          }
        ]
      }
    }
    ```
  </Tab>
</Tabs>

<Note>
Застарілі конфігурації `agent.*` мігруються через `openclaw doctor`; надалі надавайте перевагу `agents.defaults` + `agents.list`.
</Note>

---

## Приклади обмеження інструментів

<Tabs>
  <Tab title="Агент лише для читання">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Безпечне виконання (без змін файлів)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="Лише комунікація">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` у цьому профілі все одно повертає обмежене й очищене представлення пригадування, а не сирий дамп стенограми. Пригадування асистента прибирає теги мислення, службову структуру `<relevant-memories>`, plain-text XML-навантаження викликів інструментів (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів), понижену службову структуру викликів інструментів, витіклі ASCII/повноширинні керівні токени моделі та некоректний XML викликів інструментів MiniMax перед редагуванням/обрізанням.

  </Tab>
</Tabs>

---

## Поширена пастка: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` базується на `session.mainKey` (за замовчуванням `"main"`), а не на ідентифікаторі агента. Сеанси груп/каналів завжди отримують власні ключі, тому вони вважаються non-main і будуть поміщені в пісочницю. Якщо ви хочете, щоб агент ніколи не використовував пісочницю, задайте `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Тестування

Після налаштування багатоагентної пісочниці та інструментів:

<Steps>
  <Step title="Перевірте визначення агента">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Перевірте контейнери пісочниці">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Протестуйте обмеження інструментів">
    - Надішліть повідомлення, яке потребує обмежених інструментів.
    - Переконайтеся, що агент не може використовувати заборонені інструменти.

  </Step>
  <Step title="Відстежуйте журнали">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Агент не в пісочниці, попри `mode: 'all'`">
    - Перевірте, чи немає глобального `agents.defaults.sandbox.mode`, який це перевизначає.
    - Конфігурація для конкретного агента має пріоритет, тому задайте `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Інструменти все ще доступні, попри список заборон">
    - Перевірте порядок фільтрації інструментів: глобальний → агент → пісочниця → підагент.
    - Кожен рівень може лише додатково обмежувати, а не знову дозволяти.
    - Перевірте за журналами: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Контейнер не ізольований для кожного агента">
    - Задайте `scope: "agent"` у конфігурації пісочниці для конкретного агента.
    - За замовчуванням використовується `"session"`, що створює один контейнер на сеанс.

  </Accordion>
</AccordionGroup>

---

## Пов’язане

- [Підвищений режим](/uk/tools/elevated)
- [Багатоагентна маршрутизація](/uk/concepts/multi-agent)
- [Конфігурація пісочниці](/uk/gateway/config-agents#agentsdefaultssandbox)
- [Пісочниця, політика інструментів і підвищений режим](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) — налагодження питання «чому це заблоковано?»
- [Пісочниця](/uk/gateway/sandboxing) — повна довідка з пісочниці (режими, області, бекенди, образи)
- [Керування сеансами](/uk/concepts/session)
