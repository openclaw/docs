---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox- und Tool-Einschränkungen pro Agent, Priorität und Beispiele
title: Sandbox und Tools für mehrere Agenten
x-i18n:
    generated_at: "2026-04-26T11:40:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

Jeder Agent in einer Multi-Agenten-Konfiguration kann die globale Sandbox- und Tool-Richtlinie überschreiben. Diese Seite behandelt die Konfiguration pro Agent, Prioritätsregeln und Beispiele.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/de/gateway/sandboxing">
    Backends und Modi — vollständige Sandbox-Referenz.
  </Card>
  <Card title="Sandbox vs Tool-Richtlinie vs Elevated" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debugging für „Warum wird das blockiert?“
  </Card>
  <Card title="Elevated-Modus" href="/de/tools/elevated">
    Erhöhte Ausführung für vertrauenswürdige Absender.
  </Card>
</CardGroup>

<Warning>
Die Authentifizierung erfolgt pro Agent: Jeder Agent liest aus seinem eigenen `agentDir`-Auth-Speicher unter `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Anmeldedaten werden **nicht** zwischen Agenten geteilt. Verwenden Sie `agentDir` niemals für mehrere Agenten gemeinsam. Wenn Sie Anmeldedaten teilen möchten, kopieren Sie `auth-profiles.json` in den `agentDir` des anderen Agenten.
</Warning>

---

## Konfigurationsbeispiele

<AccordionGroup>
  <Accordion title="Beispiel 1: Persönlicher Agent + eingeschränkter Familien-Agent">
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

    - Agent `main`: läuft auf dem Host, voller Tool-Zugriff.
    - Agent `family`: läuft in Docker (ein Container pro Agent), nur das Tool `read`.

  </Accordion>
  <Accordion title="Beispiel 2: Arbeits-Agent mit gemeinsamer Sandbox">
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
  <Accordion title="Beispiel 2b: Globales Coding-Profil + Agent nur für Nachrichten">
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

    - Standard-Agenten erhalten Coding-Tools.
    - Der Agent `support` ist nur für Nachrichten (+ Slack-Tool).

  </Accordion>
  <Accordion title="Beispiel 3: Unterschiedliche Sandbox-Modi pro Agent">
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

## Konfigurationspriorität

Wenn sowohl globale (`agents.defaults.*`) als auch agentenspezifische (`agents.list[].*`) Konfigurationen vorhanden sind:

### Sandbox-Konfiguration

Agentenspezifische Einstellungen überschreiben globale:

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
`agents.list[].sandbox.{docker,browser,prune}.*` überschreibt `agents.defaults.sandbox.{docker,browser,prune}.*` für diesen Agenten (ignoriert, wenn der Sandbox-Bereich zu `"shared"` aufgelöst wird).
</Note>

### Tool-Einschränkungen

Die Filterreihenfolge ist:

<Steps>
  <Step title="Tool-Profil">
    `tools.profile` oder `agents.list[].tools.profile`.
  </Step>
  <Step title="Provider-Tool-Profil">
    `tools.byProvider[provider].profile` oder `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Globale Tool-Richtlinie">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Provider-Tool-Richtlinie">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Agentenspezifische Tool-Richtlinie">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Agent-Provider-Richtlinie">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandbox-Tool-Richtlinie">
    `tools.sandbox.tools` oder `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Subagent-Tool-Richtlinie">
    `tools.subagents.tools`, falls zutreffend.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Prioritätsregeln">
    - Jede Ebene kann Tools weiter einschränken, aber keine in früheren Ebenen verweigerten Tools wieder zulassen.
    - Wenn `agents.list[].tools.sandbox.tools` gesetzt ist, ersetzt es `tools.sandbox.tools` für diesen Agenten.
    - Wenn `agents.list[].tools.profile` gesetzt ist, überschreibt es `tools.profile` für diesen Agenten.
    - Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).
  </Accordion>
  <Accordion title="Verhalten bei leerer Allowlist">
    Wenn eine explizite Allowlist in dieser Kette dazu führt, dass für den Lauf keine aufrufbaren Tools mehr übrig sind, stoppt OpenClaw, bevor der Prompt an das Modell gesendet wird. Das ist beabsichtigt: Ein Agent, der mit einem fehlenden Tool wie `agents.list[].tools.allow: ["query_db"]` konfiguriert ist, soll deutlich fehlschlagen, bis das Plugin aktiviert ist, das `query_db` registriert, und nicht stattdessen als reiner Text-Agent fortfahren.
  </Accordion>
</AccordionGroup>

Tool-Richtlinien unterstützen `group:*`-Kurzformen, die zu mehreren Tools expandieren. Die vollständige Liste finden Sie unter [Tool groups](/de/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Per-Agent-Elevated-Überschreibungen (`agents.list[].tools.elevated`) können erhöhte Ausführung für bestimmte Agenten weiter einschränken. Details finden Sie unter [Elevated mode](/de/tools/elevated).

---

## Migration von einem einzelnen Agenten

<Tabs>
  <Tab title="Vorher (einzelner Agent)">
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
  <Tab title="Nachher (mehrere Agenten)">
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
Veraltete `agent.*`-Konfigurationen werden von `openclaw doctor` migriert; verwenden Sie künftig bevorzugt `agents.defaults` + `agents.list`.
</Note>

---

## Beispiele für Tool-Einschränkungen

<Tabs>
  <Tab title="Schreibgeschützter Agent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Sichere Ausführung (keine Dateiänderungen)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="Nur Kommunikation">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` in diesem Profil gibt weiterhin eine begrenzte, bereinigte Recall-Ansicht zurück statt eines unverarbeiteten Transkript-Dumps. Assistant-Recall entfernt Thinking-Tags, `<relevant-memories>`-Gerüst, XML-Payloads von Tool-Aufrufen im Klartext (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke), herabgestuftes Tool-Call-Gerüst, offengelegte ASCII-/Vollbreiten-Modellsteuerungstoken und fehlerhaftes MiniMax-Tool-Call-XML vor Redaction/Truncation.

  </Tab>
</Tabs>

---

## Häufiger Stolperstein: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` basiert auf `session.mainKey` (Standard: `"main"`), nicht auf der Agent-ID. Gruppen-/Kanal-Sitzungen erhalten immer ihre eigenen Schlüssel und werden daher als nicht-main behandelt und in die Sandbox gesetzt. Wenn Sie möchten, dass ein Agent niemals in die Sandbox gesetzt wird, setzen Sie `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Testen

Nach der Konfiguration von Sandbox und Tools für mehrere Agenten:

<Steps>
  <Step title="Agent-Auflösung prüfen">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Sandbox-Container verifizieren">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Tool-Einschränkungen testen">
    - Senden Sie eine Nachricht, die eingeschränkte Tools erfordert.
    - Verifizieren Sie, dass der Agent verweigerte Tools nicht verwenden kann.
  </Step>
  <Step title="Logs überwachen">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Agent wird trotz `mode: 'all'` nicht in die Sandbox gesetzt">
    - Prüfen Sie, ob es ein globales `agents.defaults.sandbox.mode` gibt, das dies überschreibt.
    - Agentenspezifische Konfiguration hat Vorrang, setzen Sie also `agents.list[].sandbox.mode: "all"`.
  </Accordion>
  <Accordion title="Tools trotz Deny-Liste weiterhin verfügbar">
    - Prüfen Sie die Reihenfolge der Tool-Filterung: global → Agent → Sandbox → Subagent.
    - Jede Ebene kann nur weiter einschränken, nicht wieder freigeben.
    - Verifizieren Sie mit Logs: `[tools] filtering tools for agent:${agentId}`.
  </Accordion>
  <Accordion title="Container nicht pro Agent isoliert">
    - Setzen Sie `scope: "agent"` in der agentenspezifischen Sandbox-Konfiguration.
    - Standard ist `"session"`, wodurch ein Container pro Sitzung erstellt wird.
  </Accordion>
</AccordionGroup>

---

## Verwandt

- [Elevated mode](/de/tools/elevated)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sandbox-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs Tool-Richtlinie vs Elevated](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — Debugging für „Warum wird das blockiert?“
- [Sandboxing](/de/gateway/sandboxing) — vollständige Sandbox-Referenz (Modi, Bereiche, Backends, Images)
- [Sitzungsverwaltung](/de/concepts/session)
