---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: „Per-agent sandbox + ograniczenia narzędzi, kolejność pierwszeństwa i przykłady”
title: Sandbox i narzędzia w środowisku wielu agentów
x-i18n:
    generated_at: "2026-04-05T14:08:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07985f7c8fae860a7b9bf685904903a4a8f90249e95e4179cf0775a1208c0597
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Konfiguracja sandboxa i narzędzi dla wielu agentów

Każdy agent w konfiguracji wielu agentów może nadpisać globalną politykę
sandboxa i narzędzi. Ta strona opisuje konfigurację per-agent, zasady
pierwszeństwa i przykłady.

- **Backendy i tryby sandboxa**: zobacz [Sandboxing](/pl/gateway/sandboxing).
- **Debugowanie zablokowanych narzędzi**: zobacz [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) oraz `openclaw sandbox explain`.
- **Elevated exec**: zobacz [Elevated Mode](/tools/elevated).

Uwierzytelnianie jest per-agent: każdy agent odczytuje dane z własnego magazynu uwierzytelniania `agentDir` w
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Poświadczenia **nie** są współdzielone między agentami. Nigdy nie używaj ponownie `agentDir` dla wielu agentów.
Jeśli chcesz współdzielić poświadczenia, skopiuj `auth-profiles.json` do `agentDir` drugiego agenta.

---

## Przykłady konfiguracji

### Przykład 1: agent osobisty + ograniczony agent rodzinny

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

**Wynik:**

- Agent `main`: działa na hoście, pełny dostęp do narzędzi
- Agent `family`: działa w Dockerze (jeden kontener na agenta), tylko narzędzie `read`

---

### Przykład 2: agent do pracy ze współdzielonym sandboxem

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

### Przykład 2b: globalny profil coding + agent tylko do wiadomości

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

- domyślni agenci otrzymują narzędzia coding
- agent `support` jest tylko do wiadomości (+ narzędzie Slack)

---

### Przykład 3: różne tryby sandboxa dla różnych agentów

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

- `agents.list[].sandbox.{docker,browser,prune}.*` nadpisuje `agents.defaults.sandbox.{docker,browser,prune}.*` dla tego agenta (ignorowane, gdy zakres sandboxa zostaje rozwiązany do `"shared"`).

### Ograniczenia narzędzi

Kolejność filtrowania jest następująca:

1. **Profil narzędzi** (`tools.profile` lub `agents.list[].tools.profile`)
2. **Profil narzędzi providera** (`tools.byProvider[provider].profile` lub `agents.list[].tools.byProvider[provider].profile`)
3. **Globalna polityka narzędzi** (`tools.allow` / `tools.deny`)
4. **Polityka narzędzi providera** (`tools.byProvider[provider].allow/deny`)
5. **Polityka narzędzi specyficzna dla agenta** (`agents.list[].tools.allow/deny`)
6. **Polityka providera dla agenta** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Polityka narzędzi sandboxa** (`tools.sandbox.tools` lub `agents.list[].tools.sandbox.tools`)
8. **Polityka narzędzi subagenta** (`tools.subagents.tools`, jeśli dotyczy)

Każdy poziom może dalej ograniczać narzędzia, ale nie może ponownie przyznać narzędzi odrzuconych na wcześniejszych poziomach.
Jeśli ustawiono `agents.list[].tools.sandbox.tools`, zastępuje ono `tools.sandbox.tools` dla tego agenta.
Jeśli ustawiono `agents.list[].tools.profile`, nadpisuje ono `tools.profile` dla tego agenta.
Klucze narzędzi providera akceptują zarówno `provider` (np. `google-antigravity`), jak i `provider/model` (np. `openai/gpt-5.4`).

Polityki narzędzi obsługują skróty `group:*`, które rozwijają się do wielu narzędzi. Pełną listę znajdziesz w [Grupach narzędzi](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Nadpisania elevated per-agent (`agents.list[].tools.elevated`) mogą dodatkowo ograniczać elevated exec dla konkretnych agentów. Szczegóły znajdziesz w [Elevated Mode](/tools/elevated).

---

## Migracja z pojedynczego agenta

**Przed (jeden agent):**

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

### Agent bezpiecznego wykonywania (bez modyfikacji plików)

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

` sessions_history` w tym profilu nadal zwraca ograniczony, zsanityzowany widok
przywoływania zamiast surowego zrzutu transkryptu. Przywoływanie asystenta usuwa znaczniki myślenia,
rusztowanie `<relevant-memories>`, tekstowe payloady XML wywołań narzędzi
(w tym `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi),
zdegradowane rusztowanie wywołań narzędzi, wyciekłe tokeny sterowania modeli ASCII/full-width
oraz nieprawidłowy XML wywołań narzędzi MiniMax przed redakcją/obcięciem.

---

## Częsty problem: `non-main`

`agents.defaults.sandbox.mode: "non-main"` opiera się na `session.mainKey` (domyślnie `"main"`),
a nie na identyfikatorze agenta. Sesje grupowe/kanałowe zawsze dostają własne klucze, więc
są traktowane jako non-main i będą objęte sandboxem. Jeśli chcesz, aby agent nigdy nie był objęty
sandboxem, ustaw `agents.list[].sandbox.mode: "off"`.

---

## Testowanie

Po skonfigurowaniu sandboxa i narzędzi dla wielu agentów:

1. **Sprawdź rozwiązywanie agenta:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Zweryfikuj kontenery sandboxa:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Przetestuj ograniczenia narzędzi:**
   - Wyślij wiadomość wymagającą ograniczonych narzędzi
   - Sprawdź, czy agent nie może używać zabronionych narzędzi

4. **Monitoruj logi:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Rozwiązywanie problemów

### Agent nie jest objęty sandboxem mimo `mode: "all"`

- Sprawdź, czy nie istnieje globalne `agents.defaults.sandbox.mode`, które to nadpisuje
- Konfiguracja specyficzna dla agenta ma pierwszeństwo, więc ustaw `agents.list[].sandbox.mode: "all"`

### Narzędzia są nadal dostępne mimo listy deny

- Sprawdź kolejność filtrowania narzędzi: globalna → agent → sandbox → subagent
- Każdy poziom może tylko dalej ograniczać, a nie ponownie przyznawać
- Zweryfikuj w logach: `[tools] filtering tools for agent:${agentId}`

### Kontener nie jest izolowany per-agent

- Ustaw `scope: "agent"` w konfiguracji sandboxa specyficznej dla agenta
- Domyślnie używane jest `"session"`, co tworzy jeden kontener na sesję

---

## Zobacz też

- [Sandboxing](/pl/gateway/sandboxing) -- pełna dokumentacja sandboxa (tryby, zakresy, backendy, obrazy)
- [Sandbox vs Tool Policy vs Elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) -- debugowanie „dlaczego to jest zablokowane?”
- [Elevated Mode](/tools/elevated)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Konfiguracja sandboxa](/pl/gateway/configuration-reference#agentsdefaultssandbox)
- [Zarządzanie sesjami](/pl/concepts/session)
