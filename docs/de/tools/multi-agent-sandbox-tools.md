---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox- und Tool-Einschränkungen pro Agent, Vorrangregeln und Beispiele
title: Multi-Agent-Sandbox und Werkzeuge
x-i18n:
    generated_at: "2026-05-11T20:38:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Jeder Agent in einer Multi-Agent-Konfiguration kann die globale Sandbox- und Tool-Richtlinie überschreiben. Diese Seite behandelt die Konfiguration pro Agent, Vorrangregeln und Beispiele.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/de/gateway/sandboxing">
    Backends und Modi — vollständige Sandbox-Referenz.
  </Card>
  <Card title="Sandbox vs. Tool-Richtlinie vs. Elevated" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debugging von „warum ist das blockiert?“
  </Card>
  <Card title="Elevated-Modus" href="/de/tools/elevated">
    Elevated exec für vertrauenswürdige Absender.
  </Card>
</CardGroup>

<Warning>
Die Authentifizierung ist nach Agent abgegrenzt: Jeder Agent hat seinen eigenen `agentDir`-Authentifizierungsspeicher unter `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Verwenden Sie `agentDir` niemals agentenübergreifend wieder. Agents können auf die Authentifizierungsprofile des Standard-/Haupt-Agent zugreifen, wenn sie kein lokales Profil haben, aber OAuth-Aktualisierungstoken werden nicht in sekundäre Agent-Speicher geklont. Wenn Sie Zugangsdaten manuell kopieren, kopieren Sie nur portable statische `api_key`- oder `token`-Profile.
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

    **Ergebnis:**

    - `main`-Agent: läuft auf dem Host, vollständiger Tool-Zugriff.
    - `family`-Agent: läuft in Docker (ein Container pro Agent), nur `read` und Nachrichtenversand in der aktuellen Unterhaltung.

  </Accordion>
  <Accordion title="Beispiel 2: Arbeits-Agent mit geteilter Sandbox">
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
  <Accordion title="Beispiel 2b: Globales Coding-Profil + Agent nur für Messaging">
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

Wenn sowohl globale (`agents.defaults.*`) als auch agentenspezifische (`agents.list[].*`) Konfigurationen vorhanden sind:

### Sandbox-Konfiguration

Agentenspezifische Einstellungen überschreiben globale Einstellungen:

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

Die Filterreihenfolge lautet:

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
  <Accordion title="Vorrangregeln">
    - Jede Ebene kann Tools weiter einschränken, aber zuvor verweigerte Tools aus früheren Ebenen nicht wieder gewähren.
    - Wenn `agents.list[].tools.sandbox.tools` gesetzt ist, ersetzt es `tools.sandbox.tools` für diesen Agent.
    - Wenn `agents.list[].tools.profile` gesetzt ist, überschreibt es `tools.profile` für diesen Agent.
    - Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Verhalten bei leerer Allowlist">
    Wenn eine explizite Allowlist in dieser Kette dazu führt, dass für den Lauf keine aufrufbaren Tools übrig bleiben, stoppt OpenClaw, bevor der Prompt an das Modell übermittelt wird. Das ist beabsichtigt: Ein Agent, der mit einem fehlenden Tool wie `agents.list[].tools.allow: ["query_db"]` konfiguriert ist, sollte deutlich fehlschlagen, bis das Plugin aktiviert ist, das `query_db` registriert, und nicht als reiner Text-Agent fortfahren.
  </Accordion>
</AccordionGroup>

Tool-Richtlinien unterstützen `group:*`-Kurzformen, die zu mehreren Tools erweitert werden. Die vollständige Liste finden Sie unter [Tool-Gruppen](/de/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Elevated-Überschreibungen pro Agent (`agents.list[].tools.elevated`) können Elevated exec für bestimmte Agents weiter einschränken. Details finden Sie unter [Elevated-Modus](/de/tools/elevated).

---

## Migration vom Einzelagenten

<Tabs>
  <Tab title="Vorher (Einzelagent)">
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
Legacy-`agent.*`-Konfigurationen werden von `openclaw doctor` migriert; verwenden Sie künftig bevorzugt `agents.defaults` + `agents.list`.
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
    Diese Richtlinie deaktiviert die OpenClaw-Dateisystem-Tools, aber `exec` ist weiterhin eine Shell und kann Dateien überall dort schreiben, wo der ausgewählte Host oder das Sandbox-Dateisystem dies erlaubt. Für einen schreibgeschützten Agent verweigern Sie `exec` und `process`, oder kombinieren Sie Shell-Zugriff mit Sandbox-Dateisystemkontrollen wie `agents.defaults.sandbox.workspaceAccess: "ro"` oder `"none"`.
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

    `sessions_history` gibt in diesem Profil weiterhin eine begrenzte, bereinigte Abrufansicht zurück, statt einen rohen Transkript-Dump. Der Assistentenabruf entfernt Thinking-Tags, `<relevant-memories>`-Gerüste, Klartext-XML-Nutzlasten von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Aufrufblöcke), herabgestufte Tool-Aufruf-Gerüste, durchgesickerte ASCII-/Vollbreiten-Modellsteuerungstokens sowie fehlerhaftes MiniMax-Tool-Aufruf-XML vor Redaktion/Kürzung.

  </Tab>
</Tabs>

---

## Häufige Fehlerquelle: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` basiert auf `session.mainKey` (Standard `"main"`), nicht auf der Agent-ID. Gruppen-/Kanalsitzungen erhalten immer eigene Schlüssel, daher werden sie als non-main behandelt und in einer Sandbox ausgeführt. Wenn ein Agent niemals in einer Sandbox ausgeführt werden soll, setzen Sie `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Testen

Nach dem Konfigurieren von Multi-Agent-Sandbox und Tools:

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
    - Prüfen Sie, ob es ein globales `agents.defaults.sandbox.mode` gibt, das dies überschreibt.
    - Agent-spezifische Konfiguration hat Vorrang, setzen Sie daher `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Tools trotz Deny-Liste weiterhin verfügbar">
    - Prüfen Sie die Reihenfolge der Tool-Filterung: global → Agent → Sandbox → Subagent.
    - Jede Ebene kann nur weiter einschränken, nicht erneut gewähren.
    - Verifizieren Sie dies mit Logs: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Container nicht pro Agent isoliert">
    - Setzen Sie `scope: "agent"` in der Agent-spezifischen Sandbox-Konfiguration.
    - Standard ist `"session"`, wodurch ein Container pro Sitzung erstellt wird.

  </Accordion>
</AccordionGroup>

---

## Verwandte Themen

- [Erweiterter Modus](/de/tools/elevated)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sandbox-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs. Tool-Richtlinie vs. erweiterte Berechtigungen](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — Debugging: „Warum wird das blockiert?“
- [Sandboxing](/de/gateway/sandboxing) — vollständige Sandbox-Referenz (Modi, Bereiche, Backends, Images)
- [Sitzungsverwaltung](/de/concepts/session)
