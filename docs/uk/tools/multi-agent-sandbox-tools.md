---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: «Sandbox для кожного агента + обмеження інструментів, пріоритет і приклади»
title: Sandbox та інструменти для мультиагентності
x-i18n:
    generated_at: "2026-04-23T21:16:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1f9a3e1b2bb280be8ac8f87ca98f969e1ff465470f2b47398b53993130223b17
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Конфігурація sandbox та інструментів для мультиагентності

Кожен агент у мультиагентній конфігурації може перевизначати глобальну політику
sandbox та інструментів. Ця сторінка описує конфігурацію для кожного агента окремо, правила пріоритету та
приклади.

- **Бекенди та режими sandbox**: див. [Sandboxing](/uk/gateway/sandboxing).
- **Налагодження заблокованих інструментів**: див. [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) і `openclaw sandbox explain`.
- **Elevated exec**: див. [Elevated Mode](/uk/tools/elevated).

Автентифікація прив’язана до агента: кожен агент читає зі свого власного сховища автентифікації в
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Облікові дані **не** спільні між агентами. Ніколи не використовуйте один `agentDir` повторно для кількох агентів.
Якщо ви хочете поділитися обліковими даними, скопіюйте `auth-profiles.json` до `agentDir` іншого агента.

---

## Приклади конфігурації

### Приклад 1: Особистий + обмежений сімейний агент

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

- Агент `main`: працює на хості, повний доступ до інструментів
- Агент `family`: працює в Docker (один container на агента), лише інструмент `read`

---

### Приклад 2: Робочий агент зі спільним sandbox

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

---

### Приклад 2b: Глобальний профіль coding + агент лише для messaging

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

- типові агенти отримують інструменти coding
- агент `support` — лише для messaging (+ інструмент Slack)

---

### Приклад 3: Різні режими sandbox для різних агентів

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Global default
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Override: main never sandboxed
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public always sandboxed
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

---

## Пріоритет конфігурації

Коли існують і глобальні (`agents.defaults.*`), і специфічні для агента (`agents.list[].*`) конфігурації:

### Конфігурація sandbox

Налаштування конкретного агента перевизначають глобальні:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Примітки:**

- `agents.list[].sandbox.{docker,browser,prune}.*` перевизначає `agents.defaults.sandbox.{docker,browser,prune}.*` для цього агента (ігнорується, коли область sandbox визначається як `"shared"`).

### Обмеження інструментів

Порядок фільтрації такий:

1. **Профіль інструментів** (`tools.profile` або `agents.list[].tools.profile`)
2. **Профіль інструментів провайдера** (`tools.byProvider[provider].profile` або `agents.list[].tools.byProvider[provider].profile`)
3. **Глобальна політика інструментів** (`tools.allow` / `tools.deny`)
4. **Політика інструментів провайдера** (`tools.byProvider[provider].allow/deny`)
5. **Політика інструментів для конкретного агента** (`agents.list[].tools.allow/deny`)
6. **Політика провайдера агента** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Політика інструментів sandbox** (`tools.sandbox.tools` або `agents.list[].tools.sandbox.tools`)
8. **Політика інструментів субагента** (`tools.subagents.tools`, якщо застосовно)

Кожен рівень може додатково обмежувати інструменти, але не може повернути вже заборонені інструменти з попередніх рівнів.
Якщо встановлено `agents.list[].tools.sandbox.tools`, воно замінює `tools.sandbox.tools` для цього агента.
Якщо встановлено `agents.list[].tools.profile`, воно перевизначає `tools.profile` для цього агента.
Ключі інструментів провайдера приймають або `provider` (наприклад `google-antigravity`), або `provider/model` (наприклад `openai/gpt-5.5`).

Політики інструментів підтримують скорочення `group:*`, які розгортаються в кілька інструментів. Повний список див. у [Групи інструментів](/uk/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Перевизначення elevated для кожного агента (`agents.list[].tools.elevated`) можуть додатково обмежувати elevated exec для окремих агентів. Деталі див. у [Elevated Mode](/uk/tools/elevated).

---

## Міграція з одного агента

**Було (один агент):**

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

**Стало (мультиагентність з різними профілями):**

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

Застарілі конфігурації `agent.*` мігруються через `openclaw doctor`; надалі віддавайте перевагу `agents.defaults` + `agents.list`.

---

## Приклади обмежень інструментів

### Агент лише для читання

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Агент для безпечного виконання (без змін файлів)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Агент лише для комунікації

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

`sessions_history` у цьому профілі все одно повертає обмежений, санітизований
вигляд recall, а не сирий дамп transcript. Recall помічника видаляє thinking tags,
каркас `<relevant-memories>`, XML-пейлоади викликів інструментів у звичайному тексті
(включно з `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` і усіченими блоками викликів інструментів),
понижений каркас викликів інструментів, leaked ASCII/full-width токени
керування моделлю та некоректний XML викликів інструментів MiniMax до застосування
редагування/усікання.

---

## Поширена пастка: "non-main"

`agents.defaults.sandbox.mode: "non-main"` базується на `session.mainKey` (типово `"main"`),
а не на id агента. Групові/канальні сесії завжди отримують власні ключі, тому
вони вважаються non-main і потрапляють у sandbox. Якщо ви хочете, щоб агент ніколи
не використовував sandbox, установіть `agents.list[].sandbox.mode: "off"`.

---

## Тестування

Після налаштування мультиагентного sandbox і інструментів:

1. **Перевірте визначення агента:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Перевірте sandbox-containers:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Перевірте обмеження інструментів:**
   - Надішліть повідомлення, яке потребує обмежених інструментів
   - Переконайтеся, що агент не може використовувати заборонені інструменти

4. **Слідкуйте за журналами:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Усунення неполадок

### Агент не в sandbox попри `mode: "all"`

- Перевірте, чи немає глобального `agents.defaults.sandbox.mode`, яке це перевизначає
- Конфігурація агента має пріоритет, тому встановіть `agents.list[].sandbox.mode: "all"`

### Інструменти все ще доступні попри deny list

- Перевірте порядок фільтрації інструментів: global → agent → sandbox → subagent
- Кожен рівень може лише додатково обмежувати, а не повертати назад
- Перевіряйте через журнали: `[tools] filtering tools for agent:${agentId}`

### Container не ізольований для кожного агента

- Установіть `scope: "agent"` у sandbox-конфігурації конкретного агента
- Типове значення — `"session"`, що створює один container на сесію

---

## Див. також

- [Sandboxing](/uk/gateway/sandboxing) -- повний довідник по sandbox (режими, області, бекенди, образи)
- [Sandbox vs Tool Policy vs Elevated](/uk/gateway/sandbox-vs-tool-policy-vs-elevated) -- налагодження "чому це заблоковано?"
- [Elevated Mode](/uk/tools/elevated)
- [Мультиагентна маршрутизація](/uk/concepts/multi-agent)
- [Конфігурація Sandbox](/uk/gateway/configuration-reference#agentsdefaultssandbox)
- [Керування сесіями](/uk/concepts/session)
