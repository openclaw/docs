---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: „Sandbox und Tool-Einschränkungen pro Agent, Priorität und Beispiele“
title: Multi-Agent-Sandbox und Tools
x-i18n:
    generated_at: "2026-04-25T13:58:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4473b8ea0f10c891b08cb56c9ba5a073f79c55b42f5b348b69ffb3c3d94c8f88
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Multi-Agent-Sandbox- und Tool-Konfiguration

Jeder Agent in einer Multi-Agent-Umgebung kann die globale Sandbox- und Tool-
Policy überschreiben. Diese Seite behandelt die Konfiguration pro Agent,
Prioritätsregeln und Beispiele.

- **Sandbox-Backends und -Modi**: siehe [Sandboxing](/de/gateway/sandboxing).
- **Debugging blockierter Tools**: siehe [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) und `openclaw sandbox explain`.
- **Elevated Exec**: siehe [Elevated Mode](/de/tools/elevated).

Die Authentifizierung erfolgt pro Agent: Jeder Agent liest aus seinem eigenen `agentDir`-Auth-Store unter
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Anmeldedaten werden **nicht** zwischen Agents geteilt. Verwenden Sie niemals dasselbe `agentDir` für mehrere Agents.
Wenn Sie Anmeldedaten teilen möchten, kopieren Sie `auth-profiles.json` in das `agentDir` des anderen Agents.

---

## Konfigurationsbeispiele

### Beispiel 1: Persönlicher + eingeschränkter Familien-Agent

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

**Ergebnis:**

- Agent `main`: Läuft auf dem Host, voller Tool-Zugriff
- Agent `family`: Läuft in Docker (ein Container pro Agent), nur das Tool `read`

---

### Beispiel 2: Arbeits-Agent mit gemeinsamer Sandbox

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

### Beispiel 2b: Globales Coding-Profil + Agent nur für Messaging

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

**Ergebnis:**

- Standard-Agents erhalten Coding-Tools
- Agent `support` ist nur für Messaging vorgesehen (+ Slack-Tool)

---

### Beispiel 3: Unterschiedliche Sandbox-Modi pro Agent

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Globaler Standard
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Überschreibung: main wird nie in einer Sandbox ausgeführt
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Überschreibung: public wird immer in einer Sandbox ausgeführt
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

## Konfigurationspriorität

Wenn sowohl globale (`agents.defaults.*`) als auch agentspezifische (`agents.list[].*`) Konfigurationen vorhanden sind:

### Sandbox-Konfiguration

Agentspezifische Einstellungen überschreiben globale:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Hinweise:**

- `agents.list[].sandbox.{docker,browser,prune}.*` überschreibt `agents.defaults.sandbox.{docker,browser,prune}.*` für diesen Agent (wird ignoriert, wenn der Sandbox-Umfang zu `"shared"` aufgelöst wird).

### Tool-Einschränkungen

Die Filterreihenfolge ist:

1. **Tool-Profil** (`tools.profile` oder `agents.list[].tools.profile`)
2. **Anbieter-Tool-Profil** (`tools.byProvider[provider].profile` oder `agents.list[].tools.byProvider[provider].profile`)
3. **Globale Tool-Policy** (`tools.allow` / `tools.deny`)
4. **Anbieter-Tool-Policy** (`tools.byProvider[provider].allow/deny`)
5. **Agentspezifische Tool-Policy** (`agents.list[].tools.allow/deny`)
6. **Agent-Anbieter-Policy** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Sandbox-Tool-Policy** (`tools.sandbox.tools` oder `agents.list[].tools.sandbox.tools`)
8. **Subagent-Tool-Policy** (`tools.subagents.tools`, falls zutreffend)

Jede Ebene kann Tools weiter einschränken, kann aber auf früheren Ebenen verweigerte Tools nicht wieder zulassen.
Wenn `agents.list[].tools.sandbox.tools` gesetzt ist, ersetzt es `tools.sandbox.tools` für diesen Agent.
Wenn `agents.list[].tools.profile` gesetzt ist, überschreibt es `tools.profile` für diesen Agent.
Anbieter-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

Wenn eine explizite Allowlist in dieser Kette dazu führt, dass für den Lauf keine aufrufbaren Tools mehr übrig bleiben,
stoppt OpenClaw, bevor der Prompt an das Modell gesendet wird. Das ist beabsichtigt:
Ein Agent, der mit einem fehlenden Tool wie
`agents.list[].tools.allow: ["query_db"]` konfiguriert ist, sollte deutlich fehlschlagen, bis das Plugin,
das `query_db` registriert, aktiviert ist, statt als reiner Text-Agent weiterzulaufen.

Tool-Policies unterstützen `group:*`-Kurzformen, die auf mehrere Tools erweitert werden. Die vollständige Liste finden Sie unter [Tool groups](/de/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Per-Agent-Elevated-Überschreibungen (`agents.list[].tools.elevated`) können Elevated Exec für bestimmte Agents zusätzlich einschränken. Details finden Sie unter [Elevated Mode](/de/tools/elevated).

---

## Migration von einem einzelnen Agent

**Vorher (einzelner Agent):**

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

**Nachher (Multi-Agent mit unterschiedlichen Profilen):**

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

Legacy-`agent.*`-Konfigurationen werden von `openclaw doctor` migriert; verwenden Sie künftig bevorzugt `agents.defaults` + `agents.list`.

---

## Beispiele für Tool-Einschränkungen

### Schreibgeschützter Agent

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agent für sichere Ausführung (keine Dateimodifikationen)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agent nur für Kommunikation

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

`sessions_history` gibt in diesem Profil weiterhin eine begrenzte, bereinigte Recall-
Ansicht zurück statt eines ungefilterten Transkript-Dumps. Assistant-Recall entfernt Thinking-Tags,
das `<relevant-memories>`-Gerüst, XML-Payloads von Tool-Aufrufen im Klartext
(einschließlich `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke),
herabgestuftes Tool-Call-Gerüst, durchgesickerte ASCII-/Full-Width-Modell-Steuer-
Tokens und fehlerhaftes MiniMax-Tool-Call-XML vor Redaktion/Kürzung.

---

## Häufige Stolperfalle: "non-main"

`agents.defaults.sandbox.mode: "non-main"` basiert auf `session.mainKey` (Standard `"main"`),
nicht auf der Agent-ID. Gruppen-/Kanal-Sitzungen erhalten immer eigene Schlüssel und
werden daher als non-main behandelt und in einer Sandbox ausgeführt. Wenn Sie möchten, dass ein Agent niemals
in einer Sandbox ausgeführt wird, setzen Sie `agents.list[].sandbox.mode: "off"`.

---

## Testen

Nach der Konfiguration von Multi-Agent-Sandbox und Tools:

1. **Agent-Auflösung prüfen:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Sandbox-Container verifizieren:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Tool-Einschränkungen testen:**
   - Senden Sie eine Nachricht, die eingeschränkte Tools erfordert
   - Verifizieren Sie, dass der Agent verweigerte Tools nicht verwenden kann

4. **Logs überwachen:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Fehlerbehebung

### Agent wird trotz `mode: "all"` nicht in einer Sandbox ausgeführt

- Prüfen Sie, ob ein globales `agents.defaults.sandbox.mode` vorhanden ist, das dies überschreibt
- Agentspezifische Konfiguration hat Vorrang; setzen Sie daher `agents.list[].sandbox.mode: "all"`

### Tools sind trotz Denylist weiterhin verfügbar

- Prüfen Sie die Reihenfolge der Tool-Filterung: global → Agent → Sandbox → Subagent
- Jede Ebene kann nur weiter einschränken, nicht wieder zulassen
- Verifizieren Sie dies mit Logs: `[tools] filtering tools for agent:${agentId}`

### Container ist nicht pro Agent isoliert

- Setzen Sie `scope: "agent"` in der agentspezifischen Sandbox-Konfiguration
- Standard ist `"session"`, wodurch ein Container pro Sitzung erstellt wird

---

## Verwandt

- [Sandboxing](/de/gateway/sandboxing) -- vollständige Sandbox-Referenz (Modi, Umfänge, Backends, Images)
- [Sandbox vs Tool Policy vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) -- Debugging von „warum wird das blockiert?“
- [Elevated Mode](/de/tools/elevated)
- [Multi-Agent Routing](/de/concepts/multi-agent)
- [Sandbox Configuration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Session Management](/de/concepts/session)
