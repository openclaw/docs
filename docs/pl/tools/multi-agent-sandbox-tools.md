---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: „Per-agent sandbox + ograniczenia narzędzi, pierwszeństwo i przykłady”
title: Sandbox i narzędzia dla wielu agentów
x-i18n:
    generated_at: "2026-04-24T09:37:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7239e28825759efb060b821f87f5ebd9a7f3b720b30ff16dc076b186e47fcde9
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Konfiguracja sandboxa i narzędzi dla wielu agentów

Każdy agent w konfiguracji wieloagentowej może nadpisać globalny sandbox i politykę
narzędzi. Ta strona opisuje konfigurację per agent, reguły pierwszeństwa i
przykłady.

- **Backendy i tryby sandboxa**: zobacz [Sandboxing](/pl/gateway/sandboxing).
- **Debugowanie zablokowanych narzędzi**: zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) oraz `openclaw sandbox explain`.
- **Elevated exec**: zobacz [Elevated Mode](/pl/tools/elevated).

Auth jest per agent: każdy agent odczytuje ze swojego magazynu auth `agentDir` w
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Poświadczenia **nie** są współdzielone między agentami. Nigdy nie używaj ponownie `agentDir` między agentami.
Jeśli chcesz współdzielić poświadczenia, skopiuj `auth-profiles.json` do `agentDir` drugiego agenta.

---

## Przykłady konfiguracji

### Przykład 1: Agent osobisty + ograniczony agent rodzinny

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Osobisty asystent",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Bot rodzinny",
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

**Wynik:**

- agent `main`: działa na hoście, pełny dostęp do narzędzi
- agent `family`: działa w Dockerze (jeden kontener na agenta), tylko narzędzie `read`

---

### Przykład 2: Agent roboczy ze współdzielonym sandboxem

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

### Przykład 2b: Globalny profil coding + agent tylko do wiadomości

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

**Wynik:**

- domyślni agenci dostają narzędzia coding
- agent `support` jest tylko do wiadomości (+ narzędzie Slack)

---

### Przykład 3: Różne tryby sandboxa per agent

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

## Pierwszeństwo konfiguracji

Gdy istnieją zarówno konfiguracje globalne (`agents.defaults.*`), jak i specyficzne dla agenta (`agents.list[].*`):

### Konfiguracja sandboxa

Ustawienia specyficzne dla agenta nadpisują globalne:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Uwagi:**

- `agents.list[].sandbox.{docker,browser,prune}.*` nadpisuje `agents.defaults.sandbox.{docker,browser,prune}.*` dla tego agenta (ignorowane, gdy zakres sandboxa rozwiązuje się do `"shared"`).

### Ograniczenia narzędzi

Kolejność filtrowania jest następująca:

1. **Profil narzędzi** (`tools.profile` lub `agents.list[].tools.profile`)
2. **Profil narzędzi providera** (`tools.byProvider[provider].profile` lub `agents.list[].tools.byProvider[provider].profile`)
3. **Globalna polityka narzędzi** (`tools.allow` / `tools.deny`)
4. **Polityka narzędzi providera** (`tools.byProvider[provider].allow/deny`)
5. **Polityka narzędzi specyficzna dla agenta** (`agents.list[].tools.allow/deny`)
6. **Polityka providera agenta** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Polityka narzędzi sandboxa** (`tools.sandbox.tools` lub `agents.list[].tools.sandbox.tools`)
8. **Polityka narzędzi subagenta** (`tools.subagents.tools`, jeśli dotyczy)

Każdy poziom może dalej ograniczać narzędzia, ale nie może przywracać narzędzi odrzuconych na wcześniejszych poziomach.
Jeśli ustawiono `agents.list[].tools.sandbox.tools`, zastępuje ono `tools.sandbox.tools` dla tego agenta.
Jeśli ustawiono `agents.list[].tools.profile`, nadpisuje ono `tools.profile` dla tego agenta.
Klucze narzędzi providera akceptują zarówno `provider` (np. `google-antigravity`), jak i `provider/model` (np. `openai/gpt-5.4`).

Polityki narzędzi obsługują skróty `group:*`, które rozwijają się do wielu narzędzi. Pełną listę znajdziesz w [Tool groups](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Nadpisania elevated per agent (`agents.list[].tools.elevated`) mogą dodatkowo ograniczać elevated exec dla konkretnych agentów. Szczegóły znajdziesz w [Elevated Mode](/pl/tools/elevated).

---

## Migracja z pojedynczego agenta

**Przed (pojedynczy agent):**

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

**Po (wielu agentów z różnymi profilami):**

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

Starsze konfiguracje `agent.*` są migrowane przez `openclaw doctor`; od teraz preferuj `agents.defaults` + `agents.list`.

---

## Przykłady ograniczeń narzędzi

### Agent tylko do odczytu

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agent do bezpiecznego wykonywania (bez modyfikacji plików)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agent tylko do komunikacji

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

` sessions_history` w tym profilu nadal zwraca ograniczony, sanityzowany widok
przywołania zamiast surowego zrzutu transkryptu. Przywołanie asystenta usuwa thinking tags,
szkielet `<relevant-memories>`, payloady XML wywołań narzędzi w postaci plaintext
(w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi),
zdegradowany szkielet wywołań narzędzi, wyciekłe tokeny kontroli modelu ASCII/full-width
oraz nieprawidłowy XML wywołań narzędzi MiniMax przed redakcją/ucięciem.

---

## Częsta pułapka: `"non-main"`

`agents.defaults.sandbox.mode: "non-main"` opiera się na `session.mainKey` (domyślnie `"main"`),
a nie na id agenta. Sesje grupowe/kanałowe zawsze dostają własne klucze, więc
są traktowane jako non-main i będą sandboxowane. Jeśli chcesz, aby agent nigdy nie był
sandboxowany, ustaw `agents.list[].sandbox.mode: "off"`.

---

## Testowanie

Po skonfigurowaniu sandboxa i narzędzi dla wielu agentów:

1. **Sprawdź rozwiązywanie agentów:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Zweryfikuj kontenery sandboxa:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Przetestuj ograniczenia narzędzi:**
   - Wyślij wiadomość wymagającą ograniczonych narzędzi
   - Zweryfikuj, że agent nie może użyć odrzuconych narzędzi

4. **Monitoruj logi:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Rozwiązywanie problemów

### Agent nie jest sandboxowany mimo `mode: "all"`

- Sprawdź, czy istnieje globalne `agents.defaults.sandbox.mode`, które to nadpisuje
- Konfiguracja specyficzna dla agenta ma pierwszeństwo, więc ustaw `agents.list[].sandbox.mode: "all"`

### Narzędzia są nadal dostępne mimo listy deny

- Sprawdź kolejność filtrowania narzędzi: globalna → agent → sandbox → subagent
- Każdy poziom może tylko dalej ograniczać, a nie przywracać
- Zweryfikuj w logach: `[tools] filtering tools for agent:${agentId}`

### Kontener nie jest izolowany per agent

- Ustaw `scope: "agent"` w konfiguracji sandboxa specyficznej dla agenta
- Domyślnie jest `"session"`, co tworzy jeden kontener na sesję

---

## Powiązane

- [Sandboxing](/pl/gateway/sandboxing) -- pełna dokumentacja sandboxa (tryby, zakresy, backendy, obrazy)
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugowanie „dlaczego to jest zablokowane?”
- [Elevated Mode](/pl/tools/elevated)
- [Multi-Agent Routing](/pl/concepts/multi-agent)
- [Konfiguracja sandboxa](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Zarządzanie sesjami](/pl/concepts/session)
