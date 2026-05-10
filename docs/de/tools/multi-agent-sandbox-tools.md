---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox pro Agent + Tool-Einschränkungen, Vorrang und Beispiele
title: Multi-Agent-Sandbox und Werkzeuge
x-i18n:
    generated_at: "2026-05-10T19:54:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: c988613438f2d179b859902d3f7a39a1e29b60a0e2ae6ed598bb5f5881cf0b9f
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Jeder Agent in einem Multi-Agent-Setup kann die globale Sandbox- und Tool-Richtlinie überschreiben. Diese Seite behandelt die Konfiguration pro Agent, Vorrangregeln und Beispiele.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/de/gateway/sandboxing">
    Backends und Modi — vollständige Sandbox-Referenz.
  </Card>
  <Card title="Sandbox vs. Tool-Richtlinie vs. Elevated" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debuggen: „Warum ist das blockiert?“
  </Card>
  <Card title="Elevated-Modus" href="/de/tools/elevated">
    Elevated Exec für vertrauenswürdige Absender.
  </Card>
</CardGroup>

<Warning>
Auth ist nach Agent abgegrenzt: Jeder Agent hat seinen eigenen `agentDir`-Auth-Speicher unter `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Verwenden Sie `agentDir` niemals für mehrere Agents wieder. Agents können auf die Auth-Profile des Standard-/Haupt-Agents zurückgreifen, wenn sie kein lokales Profil haben, aber OAuth-Refresh-Tokens werden nicht in sekundäre Agent-Speicher geklont. Wenn Sie Zugangsdaten manuell kopieren, kopieren Sie nur portable statische `api_key`- oder `token`-Profile.
</Warning>

---

## Konfigurationsbeispiele

<AccordionGroup>
  <Accordion title="Beispiel 1: Persönlicher + eingeschränkter Familien-Agent">
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

    - `main`-Agent: wird auf dem Host ausgeführt, vollständiger Tool-Zugriff.
    - `family`-Agent: wird in Docker ausgeführt (ein Container pro Agent), nur das `read`-Tool.

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
  <Accordion title="Beispiel 2b: Globales Coding-Profil + reiner Messaging-Agent">
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

    - Standard-Agents erhalten Coding-Tools.
    - Der `support`-Agent ist nur für Messaging vorgesehen (+ Slack-Tool).

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

## Konfigurationsvorrang

Wenn sowohl globale (`agents.defaults.*`) als auch Agent-spezifische (`agents.list[].*`) Konfigurationen vorhanden sind:

### Sandbox-Konfiguration

Agent-spezifische Einstellungen überschreiben globale Einstellungen:

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
`agents.list[].sandbox.{docker,browser,prune}.*` überschreibt `agents.defaults.sandbox.{docker,browser,prune}.*` für diesen Agent (wird ignoriert, wenn der Sandbox-Scope zu `"shared"` aufgelöst wird).
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
  <Step title="Agent-spezifische Tool-Richtlinie">
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
  <Accordion title="Vorrangregeln">
    - Jede Ebene kann Tools weiter einschränken, aber zuvor auf früheren Ebenen verweigerte Tools nicht wieder erlauben.
    - Wenn `agents.list[].tools.sandbox.tools` gesetzt ist, ersetzt es `tools.sandbox.tools` für diesen Agent.
    - Wenn `agents.list[].tools.profile` gesetzt ist, überschreibt es `tools.profile` für diesen Agent.
    - Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Verhalten bei leerer Allowlist">
    Wenn eine explizite Allowlist in dieser Kette dazu führt, dass für den Lauf keine aufrufbaren Tools übrig bleiben, stoppt OpenClaw, bevor der Prompt an das Modell übermittelt wird. Das ist beabsichtigt: Ein Agent, der mit einem fehlenden Tool wie `agents.list[].tools.allow: ["query_db"]` konfiguriert ist, sollte klar fehlschlagen, bis das Plugin aktiviert ist, das `query_db` registriert, und nicht als reiner Text-Agent fortfahren.
  </Accordion>
</AccordionGroup>

Tool-Richtlinien unterstützen `group:*`-Kurzformen, die zu mehreren Tools erweitert werden. Die vollständige Liste finden Sie unter [Tool-Gruppen](/de/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Elevated-Überschreibungen pro Agent (`agents.list[].tools.elevated`) können Elevated Exec für bestimmte Agents weiter einschränken. Details finden Sie unter [Elevated-Modus](/de/tools/elevated).

---

## Migration von einem einzelnen Agent

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
  <Tab title="Nachher (Multi-Agent)">
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
Legacy-`agent.*`-Konfigurationen werden durch `openclaw doctor` migriert; verwenden Sie künftig bevorzugt `agents.defaults` + `agents.list`.
</Note>

---

## Beispiele für Tool-Einschränkungen

<Tabs>
  <Tab title="Read-only-Agent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Shell-Ausführung mit deaktivierten Dateisystem-Tools">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Diese Richtlinie deaktiviert die OpenClaw-Dateisystem-Tools, aber `exec` ist weiterhin eine Shell und kann Dateien überall dort schreiben, wo das ausgewählte Host- oder Sandbox-Dateisystem es zulässt. Für einen Read-only-Agent verweigern Sie `exec` und `process`, oder kombinieren Sie Shell-Zugriff mit Sandbox-Dateisystemkontrollen wie `agents.defaults.sandbox.workspaceAccess: "ro"` oder `"none"`.
    </Warning>

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

    `sessions_history` in diesem Profil gibt weiterhin eine begrenzte, bereinigte Recall-Ansicht zurück und keinen ungefilterten Transcript-Dump. Assistant-Recall entfernt Thinking-Tags, `<relevant-memories>`-Gerüst, Klartext-XML-Nutzlasten von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Aufrufblöcke), herabgestuftes Tool-Aufruf-Gerüst, durchgesickerte ASCII-/Full-width-Modellsteuerungstokens und fehlerhaftes MiniMax-Tool-Aufruf-XML vor Redaction/Truncation.

  </Tab>
</Tabs>

---

## Häufige Falle: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` basiert auf `session.mainKey` (Standard `"main"`), nicht auf der Agent-ID. Gruppen-/Channel-Sitzungen erhalten immer eigene Schlüssel, daher werden sie als nicht-main behandelt und in eine Sandbox gelegt. Wenn ein Agent niemals in eine Sandbox gelegt werden soll, setzen Sie `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Testing

Nach der Konfiguration von Multi-Agent-Sandbox und Tools:

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
  <Accordion title="Agent trotz `mode: 'all'` nicht in Sandbox">
    - Prüfen Sie, ob eine globale `agents.defaults.sandbox.mode` vorhanden ist, die dies überschreibt.
    - Agent-spezifische Konfiguration hat Vorrang, setzen Sie daher `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Tools trotz Deny-Liste weiterhin verfügbar">
    - Prüfen Sie die Tool-Filterreihenfolge: global → Agent → Sandbox → Subagent.
    - Jede Ebene kann nur weiter einschränken, nicht wieder erlauben.
    - Verifizieren Sie dies mit Logs: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Container nicht pro Agent isoliert">
    - Setzen Sie `scope: "agent"` in der Agent-spezifischen Sandbox-Konfiguration.
    - Standard ist `"session"`, wodurch ein Container pro Sitzung erstellt wird.

  </Accordion>
</AccordionGroup>

---

## Verwandte

- [Erhöhter Modus](/de/tools/elevated)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sandbox-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs. Tool-Richtlinie vs. erhöhter Modus](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — Debugging: „Warum wird dies blockiert?“
- [Sandboxing](/de/gateway/sandboxing) — vollständige Sandbox-Referenz (Modi, Bereiche, Backends, Images)
- [Sitzungsverwaltung](/de/concepts/session)
