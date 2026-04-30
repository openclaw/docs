---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Agentenspezifische Sandbox + Tool-Einschränkungen, Rangfolge und Beispiele
title: Multi-Agenten-Sandbox und Werkzeuge
x-i18n:
    generated_at: "2026-04-30T07:18:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Jeder Agent in einer Multi-Agent-Konfiguration kann die globale Sandbox- und Tool-Richtlinie überschreiben. Diese Seite behandelt agentenspezifische Konfiguration, Vorrangregeln und Beispiele.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/de/gateway/sandboxing">
    Backends und Modi — vollständige Sandbox-Referenz.
  </Card>
  <Card title="Sandbox vs. Tool-Richtlinie vs. erhöht" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated">
    Fehlersuche: „Warum ist das blockiert?“
  </Card>
  <Card title="Erhöhter Modus" href="/de/tools/elevated">
    Erhöhte Ausführung für vertrauenswürdige Absender.
  </Card>
</CardGroup>

<Warning>
Die Authentifizierung ist nach Agent abgegrenzt: Jeder Agent hat seinen eigenen `agentDir`-Authentifizierungsspeicher unter `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Verwenden Sie `agentDir` niemals agentenübergreifend wieder. Agenten können auf die Authentifizierungsprofile des Standard-/Hauptagenten zurückgreifen, wenn sie kein lokales Profil haben, aber OAuth-Refresh-Token werden nicht in sekundäre Agentenspeicher geklont. Wenn Sie Anmeldedaten manuell kopieren, kopieren Sie nur portable statische `api_key`- oder `token`-Profile.
</Warning>

---

## Konfigurationsbeispiele

<AccordionGroup>
  <Accordion title="Beispiel 1: Persönlicher + eingeschränkter Familienagent">
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

    - Agent `main`: läuft auf dem Host, vollständiger Tool-Zugriff.
    - Agent `family`: läuft in Docker (ein Container pro Agent), nur das Tool `read`.

  </Accordion>
  <Accordion title="Beispiel 2: Arbeitsagent mit gemeinsam genutzter Sandbox">
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
  <Accordion title="Beispiel 2b: Globales Coding-Profil + Nur-Messaging-Agent">
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

    - Standardagenten erhalten Coding-Tools.
    - Der Agent `support` ist nur für Messaging konfiguriert (+ Slack-Tool).

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
`agents.list[].sandbox.{docker,browser,prune}.*` überschreibt `agents.defaults.sandbox.{docker,browser,prune}.*` für diesen Agenten (wird ignoriert, wenn der Sandbox-Geltungsbereich zu `"shared"` aufgelöst wird).
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
    `tools.subagents.tools`, falls anwendbar.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Vorrangregeln">
    - Jede Ebene kann Tools weiter einschränken, aber zuvor verweigerte Tools nicht wieder gewähren.
    - Wenn `agents.list[].tools.sandbox.tools` gesetzt ist, ersetzt es `tools.sandbox.tools` für diesen Agenten.
    - Wenn `agents.list[].tools.profile` gesetzt ist, überschreibt es `tools.profile` für diesen Agenten.
    - Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Verhalten bei leerer Allowlist">
    Wenn eine explizite Allowlist in dieser Kette dazu führt, dass für den Lauf keine Tools aufrufbar sind, stoppt OpenClaw, bevor der Prompt an das Modell gesendet wird. Das ist beabsichtigt: Ein Agent, der mit einem fehlenden Tool wie `agents.list[].tools.allow: ["query_db"]` konfiguriert ist, soll deutlich fehlschlagen, bis das Plugin, das `query_db` registriert, aktiviert ist, statt als reiner Textagent fortzufahren.
  </Accordion>
</AccordionGroup>

Tool-Richtlinien unterstützen `group:*`-Kurzformen, die zu mehreren Tools erweitert werden. Die vollständige Liste finden Sie unter [Tool-Gruppen](/de/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Agentenspezifische erhöhte Überschreibungen (`agents.list[].tools.elevated`) können erhöhte Ausführung für bestimmte Agenten weiter einschränken. Details finden Sie unter [Erhöhter Modus](/de/tools/elevated).

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

    `sessions_history` in diesem Profil gibt weiterhin eine begrenzte, bereinigte Erinnerungsansicht zurück, statt eines rohen Transcript-Dumps. Der Assistentenabruf entfernt Denk-Tags, `<relevant-memories>`-Gerüste, Klartext-XML-Nutzlasten von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und gekürzter Tool-Aufrufblöcke), herabgestufte Tool-Aufrufgerüste, offengelegte ASCII-/vollbreite Modellsteuerungstoken und fehlerhaftes MiniMax-Tool-Aufruf-XML vor Redaktion/Kürzung.

  </Tab>
</Tabs>

---

## Häufige Fehlerquelle: „non-main“

<Warning>
`agents.defaults.sandbox.mode: "non-main"` basiert auf `session.mainKey` (Standardwert `"main"`), nicht auf der Agenten-ID. Gruppen-/Kanalsitzungen erhalten immer eigene Schlüssel, daher werden sie als nicht-main behandelt und in die Sandbox verschoben. Wenn ein Agent niemals in einer Sandbox laufen soll, setzen Sie `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Tests

Nach der Konfiguration von Multi-Agent-Sandbox und Tools:

<Steps>
  <Step title="Agentenauflösung prüfen">
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
  <Accordion title="Agent trotz `mode: 'all'` nicht in der Sandbox">
    - Prüfen Sie, ob eine globale `agents.defaults.sandbox.mode` vorhanden ist, die dies überschreibt.
    - Agentenspezifische Konfiguration hat Vorrang; setzen Sie daher `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Tools trotz Deny-Liste weiterhin verfügbar">
    - Prüfen Sie die Tool-Filterreihenfolge: global → Agent → Sandbox → Subagent.
    - Jede Ebene kann nur weiter einschränken, nicht wieder gewähren.
    - Verifizieren Sie dies mit Logs: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Container nicht pro Agent isoliert">
    - Setzen Sie `scope: "agent"` in der agentenspezifischen Sandbox-Konfiguration.
    - Standard ist `"session"`, wodurch ein Container pro Sitzung erstellt wird.

  </Accordion>
</AccordionGroup>

---

## Verwandte Themen

- [Erhöhter Modus](/de/tools/elevated)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sandbox-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs. Tool-Richtlinie vs. erhöht](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — Fehlersuche: „Warum ist das blockiert?“
- [Sandboxing](/de/gateway/sandboxing) — vollständige Sandbox-Referenz (Modi, Geltungsbereiche, Backends, Images)
- [Sitzungsverwaltung](/de/concepts/session)
