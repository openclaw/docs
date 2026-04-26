---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Пісочниця та обмеження інструментів для кожного агента, пріоритетність і приклади
title: Пісочниця та інструменти для кількох агентів
x-i18n:
    generated_at: "2026-04-26T09:05:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

Кожен агент у багатoагентному налаштуванні може перевизначати глобальну політику пісочниці та інструментів. На цій сторінці описано конфігурацію для окремих агентів, правила пріоритетності та приклади.

<CardGroup cols={3}>
  <Card title="Пісочниця" href="/uk/gateway/sandboxing">
    Бекенди та режими — повний довідник із пісочниці.
  </Card>
  <Card title="Пісочниця vs політика інструментів vs elevated" href="/uk/gateway/sandbox-vs-tool-policy-vs-elevated">
    Налагодження «чому це заблоковано?»
  </Card>
  <Card title="Режим elevated" href="/uk/tools/elevated">
    Elevated exec для довірених відправників.
  </Card>
</CardGroup>

<Warning>
Автентифікація прив’язана до агента: кожен агент читає зі свого сховища auth у `agentDir` за шляхом `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Облікові дані **не** спільні між агентами. Ніколи не використовуйте один і той самий `agentDir` для кількох агентів. Якщо ви хочете поділитися обліковими даними, скопіюйте `auth-profiles.json` до `agentDir` іншого агента.
</Warning>

---

## Приклади конфігурації

<AccordionGroup>
  <Accordion title="Приклад 1: Особистий + обмежений сімейний агент">
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
  <Accordion title="Приклад 2: Робочий агент зі спільною пісочницею">
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
  <Accordion title="Приклад 2b: Глобальний профіль для кодування + агент лише для обміну повідомленнями">
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

    - агенти за замовчуванням отримують інструменти для кодування.
    - агент `support` призначений лише для обміну повідомленнями (+ інструмент Slack).

  </Accordion>
  <Accordion title="Приклад 3: Різні режими пісочниці для різних агентів">
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

## Пріоритетність конфігурації

Коли існують і глобальні (`agents.defaults.*`), і специфічні для агента (`agents.list[].*`) налаштування:

### Конфігурація пісочниці

Налаштування агента мають пріоритет над глобальними:

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
`agents.list[].sandbox.{docker,browser,prune}.*` перевизначає `agents.defaults.sandbox.{docker,browser,prune}.*` для цього агента (ігнорується, коли область дії пісочниці зводиться до `"shared"`).
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
  <Step title="Політика провайдера для агента">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Політика інструментів пісочниці">
    `tools.sandbox.tools` або `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Політика інструментів субагентів">
    `tools.subagents.tools`, якщо застосовується.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Правила пріоритетності">
    - Кожен рівень може додатково обмежувати інструменти, але не може повторно надати доступ до інструментів, заборонених на попередніх рівнях.
    - Якщо встановлено `agents.list[].tools.sandbox.tools`, це замінює `tools.sandbox.tools` для цього агента.
    - Якщо встановлено `agents.list[].tools.profile`, це перевизначає `tools.profile` для цього агента.
    - Ключі інструментів провайдера можуть приймати або `provider` (наприклад, `google-antigravity`), або `provider/model` (наприклад, `openai/gpt-5.4`).
  </Accordion>
  <Accordion title="Поведінка порожнього allowlist">
    Якщо будь-який явний список дозволених інструментів у цьому ланцюжку призводить до того, що для запуску не залишається жодного викликаного інструмента, OpenClaw зупиняється до надсилання запиту моделі. Це зроблено навмисно: агент, налаштований із відсутнім інструментом, наприклад `agents.list[].tools.allow: ["query_db"]`, має завершуватися з явною помилкою, доки не буде увімкнено Plugin, який реєструє `query_db`, а не продовжувати працювати як текстовий агент.
  </Accordion>
</AccordionGroup>

Політики інструментів підтримують скорочення `group:*`, які розгортаються в кілька інструментів. Повний список див. у [Групи інструментів](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Перевизначення elevated для окремих агентів (`agents.list[].tools.elevated`) можуть додатково обмежувати elevated exec для конкретних агентів. Докладніше див. у [Режим elevated](/uk/tools/elevated).

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
  <Tab title="Після (кілька агентів)">
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
Застарілі конфігурації `agent.*` мігруються через `openclaw doctor`; надалі віддавайте перевагу `agents.defaults` + `agents.list`.
</Note>

---

## Приклади обмежень інструментів

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

    `sessions_history` у цьому профілі все одно повертає обмежене, санітизоване подання для згадування, а не сирий дамп транскрипту. Згадування асистента прибирає thinking-теги, каркас `<relevant-memories>`, XML-пейлоади викликів інструментів у відкритому тексті (включно з `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і усіченими блоками викликів інструментів), спрощений каркас викликів інструментів, витеклі ASCII/повноширинні токени керування моделлю та некоректний XML викликів інструментів MiniMax до редагування/усічення.

  </Tab>
</Tabs>

---

## Поширена пастка: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` ґрунтується на `session.mainKey` (типове значення `"main"`), а не на id агента. Сесії груп/каналів завжди отримують власні ключі, тому вважаються non-main і будуть ізольовані в пісочниці. Якщо ви хочете, щоб агент ніколи не використовував пісочницю, установіть `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Тестування

Після налаштування багатoагентної пісочниці та інструментів:

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
  <Step title="Перевірте обмеження інструментів">
    - Надішліть повідомлення, яке вимагає обмежених інструментів.
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
  <Accordion title="Агент не працює в пісочниці попри `mode: 'all'`">
    - Перевірте, чи немає глобального `agents.defaults.sandbox.mode`, яке це перевизначає.
    - Конфігурація агента має пріоритет, тож установіть `agents.list[].sandbox.mode: "all"`.
  </Accordion>
  <Accordion title="Інструменти все ще доступні попри список deny">
    - Перевірте порядок фільтрації інструментів: global → agent → sandbox → subagent.
    - Кожен рівень може лише додатково обмежувати, а не повертати доступ.
    - Перевірте через журнали: `[tools] filtering tools for agent:${agentId}`.
  </Accordion>
  <Accordion title="Контейнер не ізольований для кожного агента">
    - Установіть `scope: "agent"` у конфігурації пісочниці для конкретного агента.
    - Типове значення — `"session"`, яке створює один контейнер на сесію.
  </Accordion>
</AccordionGroup>

---

## Пов’язане

- [Режим elevated](/uk/tools/elevated)
- [Маршрутизація кількох агентів](/uk/concepts/multi-agent)
- [Конфігурація пісочниці](/uk/gateway/config-agents#agentsdefaultssandbox)
- [Пісочниця vs політика інструментів vs elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) — налагодження «чому це заблоковано?»
- [Пісочниця](/uk/gateway/sandboxing) — повний довідник із пісочниці (режими, області дії, бекенди, образи)
- [Керування сесіями](/uk/concepts/session)
