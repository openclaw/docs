---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Пісочниця для кожного агента, обмеження інструментів, пріоритети та приклади
title: Пісочниця та інструменти для кількох агентів
x-i18n:
    generated_at: "2026-07-12T13:53:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Кожен агент у багатоагентній конфігурації може перевизначати глобальну політику пісочниці та інструментів. На цій сторінці описано конфігурацію для окремих агентів, правила пріоритетності та приклади.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/uk/gateway/sandboxing">
    Бекенди та режими — повний довідник із пісочниці.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/uk/gateway/sandbox-vs-tool-policy-vs-elevated">
    Налагодження проблеми «чому це заблоковано?»
  </Card>
  <Card title="Elevated mode" href="/uk/tools/elevated">
    Виконання з підвищеними привілеями для довірених відправників.
  </Card>
</CardGroup>

<Warning>
Автентифікація обмежена областю агента: кожен агент має власне сховище автентифікації `agentDir` у `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Ніколи не використовуйте один `agentDir` для кількох агентів. Якщо агенти не мають локального профілю, вони можуть читати профілі автентифікації типового/основного агента, але токени оновлення OAuth не клонуються до сховищ другорядних агентів. Якщо ви копіюєте облікові дані вручну, копіюйте лише переносні статичні профілі `api_key` або `token`.
</Warning>

---

## Приклади конфігурації

<AccordionGroup>
  <Accordion title="Example 1: Personal + restricted family agent">
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

    - Агент `main`: працює на хості та має повний доступ до інструментів.
    - Агент `family`: працює в Docker (один контейнер на агента), може лише читати за допомогою `read` і надсилати повідомлення в поточній розмові.

  </Accordion>
  <Accordion title="Example 2: Work agent with shared sandbox">
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
  <Accordion title="Example 2b: Global coding profile + messaging-only agent">
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

    - типові агенти отримують інструменти для програмування.
    - агент `support` може лише обмінюватися повідомленнями (+ інструмент Slack).

  </Accordion>
  <Accordion title="Example 3: Different sandbox modes per agent">
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

Коли одночасно існують глобальні (`agents.defaults.*`) і специфічні для агента (`agents.list[].*`) конфігурації:

### Конфігурація пісочниці

Специфічні для агента налаштування перевизначають глобальні:

```text
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` перевизначає `agents.defaults.sandbox.{docker,browser,prune}.*` для цього агента (ігнорується, якщо область пісочниці визначається як `"shared"`).
</Note>

### Обмеження інструментів

Порядок фільтрації:

<Steps>
  <Step title="Tool profile">
    `tools.profile` або `agents.list[].tools.profile`.
  </Step>
  <Step title="Provider tool profile">
    `tools.byProvider[provider].profile` або `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Global tool policy">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Provider tool policy">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Agent-specific tool policy">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Agent provider policy">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandbox tool policy">
    `tools.sandbox.tools` або `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Subagent tool policy">
    `tools.subagents.tools`, якщо застосовно.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Precedence rules">
    - Кожен рівень може додатково обмежувати інструменти, але не може повторно дозволяти інструменти, заборонені на попередніх рівнях.
    - Якщо задано `agents.list[].tools.sandbox.tools`, воно замінює `tools.sandbox.tools` для цього агента.
    - Якщо задано `agents.list[].tools.profile`, воно перевизначає `tools.profile` для цього агента.
    - Ключі інструментів провайдера приймають як `provider` (наприклад, `google-antigravity`), так і `provider/model` (наприклад, `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Empty allowlist behavior">
    Якщо будь-який явний список дозволених інструментів у цьому ланцюжку залишає запуск без доступних для виклику інструментів, OpenClaw зупиняється до надсилання запиту моделі. Це навмисна поведінка: агент, налаштований із відсутнім інструментом, наприклад `agents.list[].tools.allow: ["query_db"]`, має завершуватися з явною помилкою, доки не буде ввімкнено Plugin, який реєструє `query_db`, а не продовжувати роботу як агент, що підтримує лише текст.
  </Accordion>
</AccordionGroup>

Політики інструментів підтримують скорочення `group:*`, які розгортаються в кілька інструментів. Повний список наведено в розділі [Групи інструментів](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Перевизначення підвищених привілеїв для окремих агентів (`agents.list[].tools.elevated`) можуть додатково обмежувати виконання з підвищеними привілеями для певних агентів. Докладніше див. у розділі [Режим підвищених привілеїв](/uk/tools/elevated).

---

## Міграція з одного агента

<Tabs>
  <Tab title="Before (single agent)">
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
  <Tab title="After (multi-agent)">
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
Застарілі ключі конфігурації `agents.defaults.*`/`agents.list[].*` (наприклад, `sandbox.perSession`, `agentRuntime`, `embeddedPi`) мігруються командою `openclaw doctor`; надалі використовуйте `agents.defaults` + `agents.list`.
</Note>

---

## Приклади обмеження інструментів

<Tabs>
  <Tab title="Read-only agent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Shell execution with filesystem tools disabled">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Ця політика вимикає інструменти файлової системи OpenClaw, але `exec` усе одно є оболонкою та може записувати файли всюди, де це дозволяє файлова система вибраного хоста або пісочниці. Для агента лише для читання забороніть `exec` і `process` або поєднайте доступ до оболонки з елементами керування файловою системою пісочниці, наприклад `agents.defaults.sandbox.workspaceAccess: "ro"` або `"none"`.
    </Warning>

  </Tab>
  <Tab title="Communication-only">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` у цьому профілі все одно повертає обмежене й очищене подання відновленого контексту, а не необроблений дамп стенограми. Під час відновлення контексту асистента видаляються теги міркувань, службова структура `<relevant-memories>`, XML-навантаження викликів інструментів у вигляді звичайного тексту (зокрема `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` і обрізані блоки викликів інструментів), службова структура викликів інструментів зі зниженим рівнем, витіклі керівні токени моделі у форматі ASCII або повноширинному форматі та некоректний XML викликів інструментів MiniMax — усе це відбувається до редагування й обрізання.

  </Tab>
</Tabs>

---

## Поширена помилка: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` перевіряє ключ сеансу відносно ключа основного сеансу (завжди `"main"`; `session.mainKey` не налаштовується користувачем, а OpenClaw попереджає та ігнорує будь-яке інше значення), а не ідентифікатор агента. Сеанси груп і каналів завжди отримують власні ключі, тому вважаються неосновними та запускаються в пісочниці. Якщо агент ніколи не повинен запускатися в пісочниці, задайте `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Тестування

Після налаштування багатоагентної пісочниці та інструментів:

<Steps>
  <Step title="Check agent resolution">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Verify sandbox containers">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Test tool restrictions">
    - Надішліть повідомлення, яке потребує обмежених інструментів.
    - Переконайтеся, що агент не може використовувати заборонені інструменти.

  </Step>
  <Step title="Monitor logs">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Agent not sandboxed despite `mode: 'all'`">
    - Перевірте, чи немає глобального `agents.defaults.sandbox.mode`, яке його перевизначає.
    - Конфігурація конкретного агента має вищий пріоритет, тому задайте `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Інструменти все ще доступні попри список заборон">
    - Перевірте [повний порядок фільтрації](#tool-restrictions): профіль → профіль провайдера → глобальна політика → політика провайдера → політика агента → політика провайдера агента → пісочниця → підагенти.
    - Кожен рівень може лише додатково обмежувати, але не відновлювати доступ.
    - Покрокові вказівки з налагодження див. у розділі [Пісочниця, політика інструментів і підвищений режим](/uk/gateway/sandbox-vs-tool-policy-vs-elevated).

  </Accordion>
  <Accordion title="Контейнер не ізольовано для кожного агента">
    - Стандартне значення `scope` — `"agent"` (один контейнер на ідентифікатор агента).
    - Установіть `scope: "session"`, щоб використовувати один контейнер на сеанс, або `scope: "shared"`, щоб повторно використовувати один контейнер для кількох агентів.

  </Accordion>
</AccordionGroup>

---

## Пов’язані матеріали

- [Режим підвищених привілеїв](/uk/tools/elevated)
- [Маршрутизація між кількома агентами](/uk/concepts/multi-agent)
- [Налаштування пісочниці](/uk/gateway/config-agents#agentsdefaultssandbox)
- [Пісочниця, політика інструментів і підвищений режим](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) — налагодження проблеми «чому це заблоковано?»
- [Ізоляція в пісочниці](/uk/gateway/sandboxing) — повний довідник із пісочниці (режими, області дії, бекенди, образи)
- [Керування сеансами](/uk/concepts/session)
