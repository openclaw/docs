---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Ограничения песочницы и инструментов для каждого агента, приоритеты и примеры
title: Песочница и инструменты для нескольких агентов
x-i18n:
    generated_at: "2026-07-12T11:57:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Каждый агент в многоагентной конфигурации может переопределять глобальные политики песочницы и инструментов. На этой странице описаны конфигурация отдельных агентов, правила приоритета и примеры.

<CardGroup cols={3}>
  <Card title="Изоляция в песочнице" href="/ru/gateway/sandboxing">
    Бэкенды и режимы — полное справочное руководство по песочнице.
  </Card>
  <Card title="Песочница, политика инструментов и повышенные привилегии" href="/ru/gateway/sandbox-vs-tool-policy-vs-elevated">
    Диагностика причины блокировки.
  </Card>
  <Card title="Режим повышенных привилегий" href="/ru/tools/elevated">
    Выполнение команд с повышенными привилегиями для доверенных отправителей.
  </Card>
</CardGroup>

<Warning>
Аутентификация изолирована на уровне агента: у каждого агента есть собственное хранилище аутентификации `agentDir` в `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Никогда не используйте один и тот же `agentDir` для нескольких агентов. Если у агента нет локального профиля, он может обращаться к профилям аутентификации стандартного/основного агента, но токены обновления OAuth не копируются в хранилища дополнительных агентов. При ручном копировании учетных данных копируйте только переносимые статические профили `api_key` или `token`.
</Warning>

---

## Примеры конфигурации

<AccordionGroup>
  <Accordion title="Пример 1: личный агент и ограниченный семейный агент">
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

    - Агент `main`: работает на хосте и имеет полный доступ к инструментам.
    - Агент `family`: работает в Docker (отдельный контейнер для каждого агента), ему доступны только `read` и отправка сообщений в текущую беседу.

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
  <Accordion title="Пример 2б: глобальный профиль программирования и агент только для обмена сообщениями">
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

    - Стандартные агенты получают инструменты программирования.
    - Агент `support` может только обмениваться сообщениями (и использовать инструмент Slack).

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

Если одновременно существуют глобальная конфигурация (`agents.defaults.*`) и конфигурация конкретного агента (`agents.list[].*`):

### Конфигурация песочницы

Настройки конкретного агента переопределяют глобальные:

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
`agents.list[].sandbox.{docker,browser,prune}.*` переопределяет `agents.defaults.sandbox.{docker,browser,prune}.*` для соответствующего агента (игнорируется, если область песочницы имеет значение `"shared"`).
</Note>

### Ограничения инструментов

Фильтрация выполняется в следующем порядке:

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
  <Step title="Политика провайдера для агента">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Политика инструментов песочницы">
    `tools.sandbox.tools` или `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Политика инструментов подагента">
    `tools.subagents.tools`, если применимо.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Правила приоритета">
    - Каждый уровень может дополнительно ограничивать инструменты, но не может снова разрешить инструменты, запрещенные на предыдущих уровнях.
    - Если задано `agents.list[].tools.sandbox.tools`, оно заменяет `tools.sandbox.tools` для соответствующего агента.
    - Если задано `agents.list[].tools.profile`, оно переопределяет `tools.profile` для соответствующего агента.
    - Ключи инструментов провайдера принимают как `provider` (например, `google-antigravity`), так и `provider/model` (например, `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Поведение при пустом списке разрешенных инструментов">
    Если какой-либо явно заданный список разрешенных инструментов в этой цепочке не оставляет ни одного доступного для вызова инструмента, OpenClaw останавливается до отправки запроса модели. Это сделано намеренно: агент, настроенный с отсутствующим инструментом, например `agents.list[].tools.allow: ["query_db"]`, должен завершиться с явной ошибкой до включения плагина, регистрирующего `query_db`, а не продолжать работу в режиме только текста.
  </Accordion>
</AccordionGroup>

Политики инструментов поддерживают сокращения `group:*`, которые разворачиваются в несколько инструментов. Полный список приведен в разделе [Группы инструментов](/ru/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Переопределения повышенных привилегий для отдельных агентов (`agents.list[].tools.elevated`) могут дополнительно ограничивать выполнение команд с повышенными привилегиями для конкретных агентов. Подробнее см. в разделе [Режим повышенных привилегий](/ru/tools/elevated).

---

## Переход с одного агента

<Tabs>
  <Tab title="До перехода (один агент)">
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
  <Tab title="После перехода (несколько агентов)">
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
Устаревшие ключи конфигурации `agents.defaults.*`/`agents.list[].*` (например, `sandbox.perSession`, `agentRuntime`, `embeddedPi`) переносятся командой `openclaw doctor`; в дальнейшем рекомендуется использовать `agents.defaults` и `agents.list`.
</Note>

---

## Примеры ограничения инструментов

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
  <Tab title="Выполнение команд оболочки с отключенными файловыми инструментами">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Эта политика отключает файловые инструменты OpenClaw, однако `exec` по-прежнему предоставляет командную оболочку и может записывать файлы везде, где это разрешено файловой системой выбранного хоста или песочницы. Для агента, работающего только на чтение, запретите `exec` и `process` либо сочетайте доступ к оболочке с ограничениями файловой системы песочницы, например `agents.defaults.sandbox.workspaceAccess: "ro"` или `"none"`.
    </Warning>

  </Tab>
  <Tab title="Только для обмена данными">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    В этом профиле `sessions_history` по-прежнему возвращает ограниченное и очищенное представление истории, а не необработанную выгрузку расшифровки. При восстановлении истории ассистента перед редактированием и усечением удаляются теги рассуждений, служебная структура `<relevant-memories>`, текстовые XML-данные вызовов инструментов (включая `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` и усеченные блоки вызовов инструментов), упрощенная служебная структура вызовов инструментов, утекшие управляющие токены модели в ASCII или полноширинном формате, а также некорректный XML вызовов инструментов MiniMax.

  </Tab>
</Tabs>

---

## Распространенная ошибка: `"non-main"`

<Warning>
`agents.defaults.sandbox.mode: "non-main"` сравнивает ключ сеанса с ключом основного сеанса (всегда `"main"`; параметр `session.mainKey` не настраивается пользователем, а OpenClaw предупреждает о любом другом значении и игнорирует его), а не с идентификатором агента. Сеансы групп и каналов всегда получают собственные ключи, поэтому считаются неосновными и помещаются в песочницу. Чтобы агент никогда не помещался в песочницу, задайте `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Тестирование

После настройки песочницы и инструментов для нескольких агентов:

<Steps>
  <Step title="Проверьте разрешение агентов">
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
    - Отправьте сообщение, для обработки которого требуются ограниченные инструменты.
    - Убедитесь, что агент не может использовать запрещенные инструменты.

  </Step>
  <Step title="Отслеживайте журналы">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Устранение неполадок

<AccordionGroup>
  <Accordion title="Агент не помещается в песочницу, несмотря на `mode: 'all'`">
    - Проверьте, нет ли глобального параметра `agents.defaults.sandbox.mode`, который переопределяет это значение.
    - Конфигурация конкретного агента имеет более высокий приоритет, поэтому задайте `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Инструменты по-прежнему доступны, несмотря на список запретов">
    - Проверьте [полный порядок фильтрации](#tool-restrictions): профиль → профиль провайдера → глобальная политика → политика провайдера → политика агента → политика провайдера агента → песочница → субагент.
    - Каждый уровень может только вводить дополнительные ограничения, но не возвращать доступ.
    - Пошаговые инструкции по отладке см. в разделе [Песочница, политика инструментов и режим повышенных привилегий](/ru/gateway/sandbox-vs-tool-policy-vs-elevated).

  </Accordion>
  <Accordion title="Контейнер не изолирован для каждого агента">
    - По умолчанию `scope` имеет значение `"agent"` (один контейнер на идентификатор агента).
    - Установите `scope: "session"`, чтобы использовать отдельный контейнер для каждого сеанса, или `scope: "shared"`, чтобы повторно использовать один контейнер для нескольких агентов.

  </Accordion>
</AccordionGroup>

---

## Связанные разделы

- [Режим повышенных привилегий](/ru/tools/elevated)
- [Маршрутизация между несколькими агентами](/ru/concepts/multi-agent)
- [Настройка песочницы](/ru/gateway/config-agents#agentsdefaultssandbox)
- [Песочница, политика инструментов и режим повышенных привилегий](/ru/gateway/sandbox-vs-tool-policy-vs-elevated) — отладка вопроса «почему это заблокировано?»
- [Изоляция в песочнице](/ru/gateway/sandboxing) — полное справочное руководство по песочнице (режимы, области действия, серверные компоненты, образы)
- [Управление сеансами](/ru/concepts/session)
