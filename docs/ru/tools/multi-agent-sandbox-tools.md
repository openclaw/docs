---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Изоляция и ограничения инструментов для каждого агента, приоритеты и примеры
title: Песочница и инструменты для нескольких агентов
x-i18n:
    generated_at: "2026-07-13T18:43:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 24
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Каждый агент в многоагентной конфигурации может переопределять глобальные политики песочницы и инструментов. На этой странице рассматриваются конфигурация отдельных агентов, правила приоритета и примеры.

<CardGroup cols={3}>
  <Card title="Песочница" href="/ru/gateway/sandboxing">
    Бэкенды и режимы — полное справочное руководство по песочнице.
  </Card>
  <Card title="Песочница, политика инструментов и привилегированный режим" href="/ru/gateway/sandbox-vs-tool-policy-vs-elevated">
    Диагностика вопроса «почему это заблокировано?»
  </Card>
  <Card title="Привилегированный режим" href="/ru/tools/elevated">
    Привилегированное выполнение команд для доверенных отправителей.
  </Card>
</CardGroup>

<Warning>
Аутентификация ограничена областью агента: у каждого агента есть собственное хранилище аутентификации `agentDir` в `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Никогда не используйте `agentDir` повторно для разных агентов. Если у агентов нет локального профиля, они могут читать профили аутентификации стандартного/основного агента, однако токены обновления OAuth не клонируются в хранилища вторичных агентов. Если вы копируете учётные данные вручную, копируйте только переносимые статические профили `api_key` или `token`.
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
    - Агент `family`: работает в Docker (один контейнер на агента), доступны только `read` и отправка сообщений в текущую беседу.

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
    - Агент `support` предназначен только для обмена сообщениями (плюс инструмент Slack).

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

Если существуют как глобальная (`agents.defaults.*`), так и относящаяся к конкретному агенту (`agents.list[].*`) конфигурации:

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
`agents.list[].sandbox.{docker,browser,prune}.*` переопределяет `agents.defaults.sandbox.{docker,browser,prune}.*` для этого агента (игнорируется, если область песочницы разрешается в `"shared"`).
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
  <Step title="Политика провайдера агента">
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
    - Каждый уровень может дополнительно ограничивать инструменты, но не может снова разрешить инструменты, запрещённые на предыдущих уровнях.
    - Если задано `agents.list[].tools.sandbox.tools`, оно заменяет `tools.sandbox.tools` для этого агента.
    - Если задано `agents.list[].tools.profile`, оно переопределяет `tools.profile` для этого агента.
    - Ключи инструментов провайдера принимают либо `provider` (например, `google-antigravity`), либо `provider/model` (например, `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Поведение пустого списка разрешений">
    Если какой-либо явный список разрешений в этой цепочке не оставляет доступных для вызова инструментов, OpenClaw останавливается до отправки запроса модели. Это сделано намеренно: агент, настроенный на отсутствующий инструмент, такой как `agents.list[].tools.allow: ["query_db"]`, должен завершаться с явной ошибкой, пока не будет включён регистрирующий `query_db` плагин, а не продолжать работу как агент, способный обрабатывать только текст.
  </Accordion>
</AccordionGroup>

Политики инструментов поддерживают сокращения `group:*`, которые разворачиваются в несколько инструментов. Полный список приведён в разделе [Группы инструментов](/ru/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Переопределения привилегированного режима для отдельных агентов (`agents.list[].tools.elevated`) могут дополнительно ограничивать привилегированное выполнение команд для конкретных агентов. Подробнее см. в разделе [Привилегированный режим](/ru/tools/elevated).

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
  <Tab title="После (несколько агентов)">
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
Устаревшие ключи конфигурации `agents.defaults.*`/`agents.list[].*` (такие как `sandbox.perSession`, `agentRuntime`, `embeddedPi`) переносятся с помощью `openclaw doctor`; в дальнейшем предпочтительно использовать `agents.defaults` + `agents.list`.
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
  <Tab title="Выполнение команд оболочки при отключённых инструментах файловой системы">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Эта политика отключает инструменты файловой системы OpenClaw, однако `exec` по-прежнему является оболочкой и может записывать файлы везде, где это разрешено файловой системой выбранного хоста или песочницы. Для агента с доступом только для чтения запретите `exec` и `process` либо сочетайте доступ к оболочке с ограничениями файловой системы песочницы, такими как `agents.defaults.sandbox.workspaceAccess: "ro"` или `"none"`.
    </Warning>

  </Tab>
  <Tab title="Только обмен данными">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` в этом профиле по-прежнему возвращает ограниченное, очищенное представление воспоминаний, а не необработанную выгрузку стенограммы. При восстановлении ответов ассистента удаляются теги рассуждений, служебная структура `<relevant-memories>`, XML-данные вызовов инструментов в виде обычного текста (включая `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` и усечённые блоки вызовов инструментов), пониженная служебная структура вызовов инструментов, утёкшие управляющие токены модели в ASCII и полноширинном формате, а также некорректный XML вызовов инструментов MiniMax — до редактирования и усечения.

  </Tab>
</Tabs>

---

## Распространённая ошибка: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` сопоставляет ключ сеанса с ключом основного сеанса (всегда `"main"`; `session.mainKey` не настраивается пользователем, а OpenClaw предупреждает и игнорирует любое другое значение), а не с идентификатором агента. Сеансы групп и каналов всегда получают собственные ключи, поэтому считаются неосновными и помещаются в песочницу. Если агент никогда не должен помещаться в песочницу, задайте `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Тестирование

После настройки песочницы и инструментов для нескольких агентов:

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
    - Отправьте сообщение, требующее использования ограниченных инструментов.
    - Убедитесь, что агент не может использовать запрещённые инструменты.

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
    - Проверьте, нет ли глобального значения `agents.defaults.sandbox.mode`, которое его переопределяет.
    - Конфигурация конкретного агента имеет приоритет, поэтому задайте `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Инструменты по-прежнему доступны, несмотря на список запретов">
    - Проверьте [полный порядок фильтрации](#tool-restrictions): профиль → профиль провайдера → глобальная политика → политика провайдера → политика агента → политика провайдера агента → песочница → подагент.
    - Каждый уровень может только дополнительно ограничивать доступ, но не возвращать его.
    - Пошаговые инструкции по диагностике см. в разделе [Песочница, политика инструментов и привилегированный режим](/ru/gateway/sandbox-vs-tool-policy-vs-elevated).

  </Accordion>
  <Accordion title="Контейнер не изолирован для каждого агента">
    - По умолчанию `scope` имеет значение `"agent"` (один контейнер для каждого идентификатора агента).
    - Установите `scope: "session"`, чтобы использовать отдельный контейнер для каждого сеанса, или `scope: "shared"`, чтобы повторно использовать один контейнер для нескольких агентов.

  </Accordion>
</AccordionGroup>

---

## Связанные материалы

- [Режим повышенных привилегий](/ru/tools/elevated)
- [Маршрутизация между несколькими агентами](/ru/concepts/multi-agent)
- [Настройка песочницы](/ru/gateway/config-agents#agentsdefaultssandbox)
- [Песочница, политика инструментов и режим повышенных привилегий](/ru/gateway/sandbox-vs-tool-policy-vs-elevated) — диагностика вопроса «почему это заблокировано?»
- [Изоляция в песочнице](/ru/gateway/sandboxing) — полное справочное руководство по песочнице (режимы, области действия, бэкенды, образы)
- [Управление сеансами](/ru/concepts/session)
