---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox- und Tool-Beschränkungen pro Agent, Rangfolge und Beispiele
title: Multi-Agenten-Sandbox und -Tools
x-i18n:
    generated_at: "2026-07-12T15:59:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Jeder Agent in einer Multi-Agent-Konfiguration kann die globale Sandbox- und Tool-Richtlinie überschreiben. Diese Seite behandelt die Konfiguration pro Agent, Vorrangregeln und Beispiele.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/de/gateway/sandboxing">
    Backends und Modi – vollständige Sandbox-Referenz.
  </Card>
  <Card title="Sandbox vs. Tool-Richtlinie vs. Elevated" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated">
    Fehlerbehebung für „Warum wird dies blockiert?“
  </Card>
  <Card title="Elevated-Modus" href="/de/tools/elevated">
    Elevated-Ausführung für vertrauenswürdige Absender.
  </Card>
</CardGroup>

<Warning>
Die Authentifizierung ist auf den jeweiligen Agent beschränkt: Jeder Agent verfügt über einen eigenen `agentDir`-Authentifizierungsspeicher unter `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Verwenden Sie `agentDir` niemals für mehrere Agents. Agents können auf die Authentifizierungsprofile des standardmäßigen primären Agents zurückgreifen, wenn sie kein lokales Profil besitzen; OAuth-Aktualisierungstoken werden jedoch nicht in die Speicher sekundärer Agents kopiert. Wenn Sie Anmeldedaten manuell kopieren, kopieren Sie ausschließlich portable statische Profile des Typs `api_key` oder `token`.
</Warning>

---

## Konfigurationsbeispiele

<AccordionGroup>
  <Accordion title="Beispiel 1: Persönlicher und eingeschränkter Familien-Agent">
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

    - Agent `main`: wird auf dem Host ausgeführt und hat vollständigen Tool-Zugriff.
    - Agent `family`: wird in Docker ausgeführt (ein Container pro Agent) und darf nur `read` sowie Nachrichten in der aktuellen Unterhaltung senden.

  </Accordion>
  <Accordion title="Beispiel 2: Arbeits-Agent mit gemeinsam genutzter Sandbox">
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
  <Accordion title="Beispiel 2b: Globales Programmierprofil und Agent nur für Nachrichten">
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

    - Standard-Agents erhalten Programmier-Tools.
    - Der Agent `support` ist auf Nachrichten beschränkt (zuzüglich des Slack-Tools).

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
`agents.list[].sandbox.{docker,browser,prune}.*` überschreibt für diesen Agent `agents.defaults.sandbox.{docker,browser,prune}.*` (wird ignoriert, wenn der Sandbox-Gültigkeitsbereich zu `"shared"` aufgelöst wird).
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
    - Jede Ebene kann Tools weiter einschränken, jedoch keine auf früheren Ebenen verweigerten Tools erneut gewähren.
    - Wenn `agents.list[].tools.sandbox.tools` festgelegt ist, ersetzt es für diesen Agent `tools.sandbox.tools`.
    - Wenn `agents.list[].tools.profile` festgelegt ist, überschreibt es für diesen Agent `tools.profile`.
    - Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Verhalten bei leerer Zulassungsliste">
    Wenn eine explizite Zulassungsliste in dieser Kette dazu führt, dass für die Ausführung keine aufrufbaren Tools verbleiben, hält OpenClaw an, bevor der Prompt an das Modell übermittelt wird. Dies ist beabsichtigt: Ein Agent, der mit einem fehlenden Tool wie `agents.list[].tools.allow: ["query_db"]` konfiguriert ist, sollte mit einem eindeutigen Fehler abbrechen, bis das Plugin aktiviert wurde, das `query_db` registriert, statt als reiner Text-Agent fortzufahren.
  </Accordion>
</AccordionGroup>

Tool-Richtlinien unterstützen Kurzformen vom Typ `group:*`, die zu mehreren Tools erweitert werden. Die vollständige Liste finden Sie unter [Tool-Gruppen](/de/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Agent-spezifische Elevated-Überschreibungen (`agents.list[].tools.elevated`) können die Elevated-Ausführung für bestimmte Agents weiter einschränken. Weitere Einzelheiten finden Sie unter [Elevated-Modus](/de/tools/elevated).

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
  <Tab title="Nachher (mehrere Agents)">
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
Veraltete Konfigurationsschlüssel unter `agents.defaults.*`/`agents.list[].*` (wie `sandbox.perSession`, `agentRuntime`, `embeddedPi`) werden durch `openclaw doctor` migriert; verwenden Sie künftig vorzugsweise `agents.defaults` und `agents.list`.
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
    Diese Richtlinie deaktiviert die Dateisystem-Tools von OpenClaw, `exec` ist jedoch weiterhin eine Shell und kann überall dort Dateien schreiben, wo das Dateisystem des ausgewählten Hosts oder der Sandbox dies zulässt. Verweigern Sie für einen schreibgeschützten Agent `exec` und `process`, oder kombinieren Sie den Shell-Zugriff mit Sandbox-Dateisystemkontrollen wie `agents.defaults.sandbox.workspaceAccess: "ro"` oder `"none"`.
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

    `sessions_history` gibt in diesem Profil weiterhin eine begrenzte, bereinigte Erinnerungsansicht statt eines Rohabzugs des Transkripts zurück. Bei der Erinnerung des Assistenten werden Denk-Tags, `<relevant-memories>`-Gerüststrukturen, Tool-Aufruf-XML-Nutzlasten im Klartext (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Aufrufblöcke), herabgestufte Tool-Aufruf-Gerüststrukturen, offengelegte Modellsteuerungstoken in ASCII oder voller Breite sowie fehlerhaftes MiniMax-Tool-Aufruf-XML vor der Schwärzung und Kürzung entfernt.

  </Tab>
</Tabs>

---

## Häufiger Stolperstein: „non-main“

<Warning>
`agents.defaults.sandbox.mode: "non-main"` prüft den Sitzungsschlüssel gegen den Schlüssel der primären Sitzung (immer `"main"`; `session.mainKey` kann nicht vom Benutzer konfiguriert werden, und OpenClaw warnt bei jedem anderen Wert und ignoriert ihn), nicht gegen die Agent-ID. Gruppen- und Kanalsitzungen erhalten stets eigene Schlüssel, werden daher als nicht primär behandelt und in einer Sandbox ausgeführt. Wenn ein Agent niemals in einer Sandbox ausgeführt werden soll, legen Sie `agents.list[].sandbox.mode: "off"` fest.
</Warning>

---

## Tests

Nach der Konfiguration von Multi-Agent-Sandbox und Tools:

<Steps>
  <Step title="Agent-Auflösung prüfen">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Sandbox-Container überprüfen">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Tool-Einschränkungen testen">
    - Senden Sie eine Nachricht, für die eingeschränkte Tools erforderlich sind.
    - Überprüfen Sie, dass der Agent verweigerte Tools nicht verwenden kann.

  </Step>
  <Step title="Protokolle überwachen">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Agent trotz `mode: 'all'` nicht in einer Sandbox">
    - Prüfen Sie, ob eine globale Einstellung `agents.defaults.sandbox.mode` vorhanden ist, die den Wert überschreibt.
    - Die Agent-spezifische Konfiguration hat Vorrang; legen Sie daher `agents.list[].sandbox.mode: "all"` fest.

  </Accordion>
  <Accordion title="Tools trotz Sperrliste weiterhin verfügbar">
    - Prüfen Sie die [vollständige Filterreihenfolge](#tool-restrictions): Profil → Provider-Profil → globale Richtlinie → Provider-Richtlinie → Agent-Richtlinie → Agent-Provider-Richtlinie → Sandbox → Subagent.
    - Jede Ebene kann nur weitere Einschränkungen vornehmen, nicht zuvor entzogene Berechtigungen wieder erteilen.
    - Eine schrittweise Fehlerbehebung finden Sie unter [Sandbox im Vergleich zu Tool-Richtlinie und „elevated“](/de/gateway/sandbox-vs-tool-policy-vs-elevated).

  </Accordion>
  <Accordion title="Container nicht pro Agent isoliert">
    - Der Standardwert für `scope` ist `"agent"` (ein Container pro Agent-ID).
    - Legen Sie `scope: "session"` für einen Container pro Sitzung oder `scope: "shared"` fest, um einen Container agentübergreifend wiederzuverwenden.

  </Accordion>
</AccordionGroup>

---

## Verwandte Themen

- [„Elevated“-Modus](/de/tools/elevated)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sandbox-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox im Vergleich zu Tool-Richtlinie und „elevated“](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — Fehlerbehebung für „Warum wird dies blockiert?“
- [Sandboxing](/de/gateway/sandboxing) — vollständige Sandbox-Referenz (Modi, Geltungsbereiche, Backends, Images)
- [Sitzungsverwaltung](/de/concepts/session)
