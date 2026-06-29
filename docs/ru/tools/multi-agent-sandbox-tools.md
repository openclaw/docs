---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Песочница и ограничения инструментов для каждого агента, приоритет и примеры
title: Многоагентная песочница и инструменты
x-i18n:
    generated_at: "2026-06-28T23:53:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Каждый агент в многоагентной конфигурации может переопределять глобальную политику песочницы и инструментов. На этой странице описаны настройки для отдельных агентов, правила приоритета и примеры.

<CardGroup cols={3}>
  <Card title="Песочница" href="/ru/gateway/sandboxing">
    Бэкенды и режимы — полный справочник по песочнице.
  </Card>
  <Card title="Песочница, политика инструментов и повышенный режим" href="/ru/gateway/sandbox-vs-tool-policy-vs-elevated">
    Отладка вопроса «почему это заблокировано?»
  </Card>
  <Card title="Повышенный режим" href="/ru/tools/elevated">
    Повышенный exec для доверенных отправителей.
  </Card>
</CardGroup>

<Warning>
Аутентификация ограничена областью агента: у каждого агента есть собственное хранилище аутентификации `agentDir` в `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Никогда не переиспользуйте `agentDir` между агентами. Агенты могут читать профили аутентификации агента по умолчанию/главного агента, если у них нет локального профиля, но токены обновления OAuth не клонируются в хранилища вторичных агентов. Если вы копируете учетные данные вручную, копируйте только переносимые статические профили `api_key` или `token`.
</Warning>

---

## Примеры конфигурации

<AccordionGroup>
  <Accordion title="Пример 1: личный агент + ограниченный семейный агент">
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

    - агент `main`: работает на хосте, полный доступ к инструментам.
    - агент `family`: работает в Docker (один контейнер на агента), доступны только `read` и отправка сообщений в текущей беседе.

  </Accordion>
  <Accordion title="Пример 2: рабочий агент с общей песочницей">
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
  <Accordion title="Пример 2b: глобальный профиль программирования + агент только для сообщений">
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

    - агенты по умолчанию получают инструменты для программирования.
    - агент `support` работает только с сообщениями (+ инструмент Slack).

  </Accordion>
  <Accordion title="Пример 3: разные режимы песочницы для разных агентов">
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

## Приоритет конфигурации

Когда существуют и глобальные (`agents.defaults.*`), и агентские (`agents.list[].*`) конфигурации:

### Конфигурация песочницы

Настройки конкретного агента переопределяют глобальные:

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
`agents.list[].sandbox.{docker,browser,prune}.*` переопределяет `agents.defaults.sandbox.{docker,browser,prune}.*` для этого агента (игнорируется, когда область песочницы разрешается в `"shared"`).
</Note>

### Ограничения инструментов

Порядок фильтрации:

<Steps>
  <Step title="Профиль инструментов">
    `tools.profile` или `agents.list[].tools.profile`.
  </Step>
  <Step title="Профиль инструментов провайдера">
    `tools.byProvider[provider].profile` или `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Глобальная политика инструментов">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Политика инструментов провайдера">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Политика инструментов конкретного агента">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Политика провайдера агента">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Политика инструментов песочницы">
    `tools.sandbox.tools` или `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Политика инструментов субагента">
    `tools.subagents.tools`, если применимо.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Правила приоритета">
    - Каждый уровень может дополнительно ограничивать инструменты, но не может снова разрешить инструменты, запрещенные на предыдущих уровнях.
    - Если задано `agents.list[].tools.sandbox.tools`, оно заменяет `tools.sandbox.tools` для этого агента.
    - Если задано `agents.list[].tools.profile`, оно переопределяет `tools.profile` для этого агента.
    - Ключи инструментов провайдера принимают либо `provider` (например, `google-antigravity`), либо `provider/model` (например, `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Поведение пустого списка разрешений">
    Если любой явный список разрешений в этой цепочке оставляет запуск без доступных для вызова инструментов, OpenClaw останавливается до отправки промпта модели. Это сделано намеренно: агент, настроенный с отсутствующим инструментом, например `agents.list[].tools.allow: ["query_db"]`, должен явно завершаться ошибкой, пока не будет включен Plugin, регистрирующий `query_db`, а не продолжать работу как агент только с текстом.
  </Accordion>
</AccordionGroup>

Политики инструментов поддерживают сокращения `group:*`, которые раскрываются в несколько инструментов. Полный список см. в разделе [Группы инструментов](/ru/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Переопределения повышенного режима для отдельных агентов (`agents.list[].tools.elevated`) могут дополнительно ограничивать повышенный exec для конкретных агентов. Подробнее см. в разделе [Повышенный режим](/ru/tools/elevated).

---

## Миграция с одного агента

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
  <Tab title="После (мультиагентный режим)">
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
Устаревшие конфигурации `agent.*` мигрируются через `openclaw doctor`; в дальнейшем предпочитайте `agents.defaults` + `agents.list`.
</Note>

---

## Примеры ограничений инструментов

<Tabs>
  <Tab title="Агент только для чтения">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Выполнение shell с отключенными файловыми инструментами">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Эта политика отключает файловые инструменты OpenClaw, но `exec` все равно является shell и может записывать файлы везде, где это позволяет выбранный хост или файловая система песочницы. Для агента только для чтения запретите `exec` и `process` либо сочетайте доступ к shell с ограничениями файловой системы песочницы, например `agents.defaults.sandbox.workspaceAccess: "ro"` или `"none"`.
    </Warning>

  </Tab>
  <Tab title="Только коммуникация">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` в этом профиле все равно возвращает ограниченное, очищенное представление извлеченного контекста, а не необработанный дамп транскрипта. Извлечение контекста ассистента удаляет теги размышлений, каркас `<relevant-memories>`, текстовые XML-пейлоады вызовов инструментов (включая `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` и усеченные блоки вызовов инструментов), пониженный каркас вызовов инструментов, утекшие ASCII/полноширинные управляющие токены модели и некорректный XML вызовов инструментов MiniMax перед редактированием/усечением.

  </Tab>
</Tabs>

---

## Распространенная ошибка: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` основан на `session.mainKey` (по умолчанию `"main"`), а не на идентификаторе агента. Сеансы групп/каналов всегда получают собственные ключи, поэтому они считаются неосновными и будут запускаться в песочнице. Если вы хотите, чтобы агент никогда не запускался в песочнице, задайте `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Тестирование

После настройки мультиагентной песочницы и инструментов:

<Steps>
  <Step title="Проверьте разрешение агента">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Проверьте контейнеры песочницы">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Проверьте ограничения инструментов">
    - Отправьте сообщение, требующее ограниченных инструментов.
    - Убедитесь, что агент не может использовать запрещенные инструменты.

  </Step>
  <Step title="Отслеживайте журналы">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Агент не запускается в песочнице, несмотря на `mode: 'all'`">
    - Проверьте, есть ли глобальный `agents.defaults.sandbox.mode`, который переопределяет это значение.
    - Конфигурация конкретного агента имеет приоритет, поэтому задайте `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Инструменты все еще доступны, несмотря на список запретов">
    - Проверьте порядок фильтрации инструментов: глобальный → агент → песочница → субагент.
    - Каждый уровень может только дополнительно ограничивать, а не возвращать доступ.
    - Проверьте по журналам: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Контейнер не изолирован для каждого агента">
    - Задайте `scope: "agent"` в конфигурации песочницы конкретного агента.
    - Значение по умолчанию — `"session"`, при котором создается один контейнер на сеанс.

  </Accordion>
</AccordionGroup>

---

## Связанные материалы

- [Повышенный режим](/ru/tools/elevated)
- [Маршрутизация между несколькими агентами](/ru/concepts/multi-agent)
- [Конфигурация песочницы](/ru/gateway/config-agents#agentsdefaultssandbox)
- [Песочница, политика инструментов и повышенный режим](/ru/gateway/sandbox-vs-tool-policy-vs-elevated) — отладка «почему это заблокировано?»
- [Песочница](/ru/gateway/sandboxing) — полный справочник по песочнице (режимы, области, бэкенды, образы)
- [Управление сеансами](/ru/concepts/session)
