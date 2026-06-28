---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Пісочниця та обмеження інструментів для кожного агента, пріоритетність і приклади
title: Багатоагентна пісочниця та інструменти
x-i18n:
    generated_at: "2026-05-11T21:01:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Кожен агент у багатоагентному налаштуванні може перевизначати глобальні політики пісочниці та інструментів. На цій сторінці описано конфігурацію для окремих агентів, правила пріоритету та приклади.

<CardGroup cols={3}>
  <Card title="Пісочниця" href="/uk/gateway/sandboxing">
    Бекенди та режими — повна довідка з пісочниці.
  </Card>
  <Card title="Пісочниця, політика інструментів і підвищений режим" href="/uk/gateway/sandbox-vs-tool-policy-vs-elevated">
    Налагодження: «чому це заблоковано?»
  </Card>
  <Card title="Підвищений режим" href="/uk/tools/elevated">
    Підвищений exec для довірених відправників.
  </Card>
</CardGroup>

<Warning>
Автентифікація має область дії агента: кожен агент має власне сховище автентифікації `agentDir` за адресою `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Ніколи не використовуйте `agentDir` повторно для різних агентів. Агенти можуть читати профілі автентифікації типового/основного агента, коли не мають локального профілю, але токени оновлення OAuth не клонуються до сховищ другорядних агентів. Якщо копіюєте облікові дані вручну, копіюйте лише переносні статичні профілі `api_key` або `token`.
</Warning>

---

## Приклади конфігурації

<AccordionGroup>
  <Accordion title="Приклад 1: особистий агент + обмежений сімейний агент">
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
              "allow": ["read", "message"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"],
              "message": {
                "crossContext": {
                  "allowWithinProvider": false,
                  "allowAcrossProviders": false
                }
              }
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
    - агент `family`: працює в Docker (один контейнер на агента), лише `read` і надсилання повідомлень у поточній розмові.

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

    - типові агенти отримують інструменти для кодування.
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

Параметри конкретного агента перевизначають глобальні:

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
`agents.list[].sandbox.{docker,browser,prune}.*` перевизначає `agents.defaults.sandbox.{docker,browser,prune}.*` для цього агента (ігнорується, коли область дії пісочниці розв’язується як `"shared"`).
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
  <Step title="Політика інструментів конкретного агента">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Політика провайдера агента">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Політика інструментів пісочниці">
    `tools.sandbox.tools` або `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Політика інструментів субагента">
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
  <Accordion title="Поведінка порожнього allowlist">
    Якщо будь-який явний allowlist у цьому ланцюжку залишає запуск без доступних для виклику інструментів, OpenClaw зупиняється до надсилання prompt до моделі. Це навмисно: агент, налаштований із відсутнім інструментом, як-от `agents.list[].tools.allow: ["query_db"]`, має явно завершитися помилкою, доки не буде ввімкнено Plugin, що реєструє `query_db`, а не продовжувати як агент лише для тексту.
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
  <Tab title="Після (multi-agent)">
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
Застарілі конфігурації `agent.*` мігруються за допомогою `openclaw doctor`; надалі надавайте перевагу `agents.defaults` + `agents.list`.
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
  <Tab title="Виконання оболонки з вимкненими інструментами файлової системи">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Ця політика вимикає інструменти файлової системи OpenClaw, але `exec` все ще є оболонкою і може записувати файли всюди, де це дозволяє вибраний хост або файлова система пісочниці. Для агента лише для читання забороніть `exec` і `process` або поєднайте доступ до оболонки з контролями файлової системи пісочниці, такими як `agents.defaults.sandbox.workspaceAccess: "ro"` або `"none"`.
    </Warning>

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

    `sessions_history` у цьому профілі все одно повертає обмежений, очищений вигляд пригадування, а не необроблений дамп транскрипту. Пригадування асистента видаляє теги мислення, каркас `<relevant-memories>`, XML-навантаження викликів інструментів у звичайному тексті (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів), понижений каркас викликів інструментів, витеклі ASCII/повноширинні керівні токени моделі та некоректний XML викликів інструментів MiniMax перед редагуванням/обрізанням.

  </Tab>
</Tabs>

---

## Поширена помилка: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` базується на `session.mainKey` (типово `"main"`), а не на ідентифікаторі агента. Сесії груп/каналів завжди отримують власні ключі, тому вони вважаються non-main і будуть виконуватися в пісочниці. Якщо ви хочете, щоб агент ніколи не використовував пісочницю, задайте `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Тестування

Після налаштування пісочниці та інструментів для multi-agent:

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
  <Accordion title="Агент не ізольований у пісочниці попри `mode: 'all'`">
    - Перевірте, чи немає глобального `agents.defaults.sandbox.mode`, який його перевизначає.
    - Конфігурація конкретного агента має пріоритет, тому задайте `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Інструменти все ще доступні попри список заборон">
    - Перевірте порядок фільтрації інструментів: глобальний → агент → пісочниця → підагент.
    - Кожен рівень може лише додатково обмежувати, а не повертати дозволи.
    - Перевірте за журналами: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Контейнер не ізольований для кожного агента">
    - Задайте `scope: "agent"` у конфігурації пісочниці конкретного агента.
    - Типове значення — `"session"`, що створює один контейнер на сесію.

  </Accordion>
</AccordionGroup>

---

## Пов’язане

- [Підвищений режим](/uk/tools/elevated)
- [Маршрутизація між агентами](/uk/concepts/multi-agent)
- [Конфігурація пісочниці](/uk/gateway/config-agents#agentsdefaultssandbox)
- [Пісочниця порівняно з політикою інструментів і підвищеним режимом](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) — налагодження «чому це заблоковано?»
- [Ізоляція в пісочниці](/uk/gateway/sandboxing) — повний довідник пісочниці (режими, області, бекенди, образи)
- [Керування сеансами](/uk/concepts/session)
