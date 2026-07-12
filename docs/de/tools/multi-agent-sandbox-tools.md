---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox- und Tool-Einschränkungen pro Agent, Prioritätsregeln und Beispiele
title: Multi-Agenten-Sandbox und Tools
x-i18n:
    generated_at: "2026-07-12T02:16:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Jeder Agent in einer Multi-Agent-Konfiguration kann die globale Sandbox- und Tool-Richtlinie überschreiben. Diese Seite behandelt die agentenspezifische Konfiguration, Vorrangregeln und Beispiele.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/de/gateway/sandboxing">
    Backends und Modi – vollständige Sandbox-Referenz.
  </Card>
  <Card title="Sandbox, Tool-Richtlinie und erhöhter Modus im Vergleich" href="/de/gateway/sandbox-vs-tool-policy-vs-elevated">
    Fehlersuche bei „Warum wird dies blockiert?“
  </Card>
  <Card title="Erhöhter Modus" href="/de/tools/elevated">
    Erhöhte Ausführung für vertrauenswürdige Absender.
  </Card>
</CardGroup>

<Warning>
Die Authentifizierung ist auf den jeweiligen Agenten beschränkt: Jeder Agent besitzt einen eigenen `agentDir`-Authentifizierungsspeicher unter `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Verwenden Sie `agentDir` niemals für mehrere Agenten. Agenten können auf die Authentifizierungsprofile des Standard-/Hauptagenten zurückgreifen, wenn sie kein lokales Profil besitzen. OAuth-Aktualisierungstoken werden jedoch nicht in die Speicher sekundärer Agenten kopiert. Wenn Sie Anmeldedaten manuell kopieren, kopieren Sie nur portable statische Profile vom Typ `api_key` oder `token`.
</Warning>

---

## Konfigurationsbeispiele

<AccordionGroup>
  <Accordion title="Beispiel 1: Persönlicher Agent und eingeschränkter Familienagent">
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

    - Agent `main`: wird auf dem Host mit vollständigem Tool-Zugriff ausgeführt.
    - Agent `family`: wird in Docker ausgeführt (ein Container pro Agent) und kann nur `read` sowie das Senden von Nachrichten in der aktuellen Unterhaltung verwenden.

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
  <Accordion title="Beispiel 2b: Globales Programmierprofil und Agent ausschließlich für Nachrichten">
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

    - Standardagenten erhalten Programmier-Tools.
    - Der Agent `support` kann ausschließlich Nachrichtenfunktionen verwenden (zuzüglich des Slack-Tools).

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
`agents.list[].sandbox.{docker,browser,prune}.*` überschreibt für diesen Agenten `agents.defaults.sandbox.{docker,browser,prune}.*` (wird ignoriert, wenn der Sandbox-Geltungsbereich zu `"shared"` aufgelöst wird).
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
  <Step title="Agentenbezogene Provider-Richtlinie">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandbox-Tool-Richtlinie">
    `tools.sandbox.tools` oder `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Subagenten-Tool-Richtlinie">
    `tools.subagents.tools`, sofern zutreffend.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Vorrangregeln">
    - Jede Ebene kann Tools weiter einschränken, aber keine auf früheren Ebenen verweigerten Tools erneut freigeben.
    - Wenn `agents.list[].tools.sandbox.tools` festgelegt ist, ersetzt es `tools.sandbox.tools` für diesen Agenten.
    - Wenn `agents.list[].tools.profile` festgelegt ist, überschreibt es `tools.profile` für diesen Agenten.
    - Provider-Tool-Schlüssel akzeptieren entweder `provider` (z. B. `google-antigravity`) oder `provider/model` (z. B. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Verhalten bei leerer Zulassungsliste">
    Wenn eine explizite Zulassungsliste in dieser Kette dazu führt, dass für die Ausführung keine aufrufbaren Tools verbleiben, hält OpenClaw an, bevor der Prompt an das Modell übermittelt wird. Dies ist beabsichtigt: Ein Agent, der mit einem fehlenden Tool wie `agents.list[].tools.allow: ["query_db"]` konfiguriert ist, sollte mit einer deutlichen Fehlermeldung abbrechen, bis das Plugin aktiviert ist, das `query_db` registriert, statt als reiner Textagent fortzufahren.
  </Accordion>
</AccordionGroup>

Tool-Richtlinien unterstützen `group:*`-Kurzformen, die zu mehreren Tools erweitert werden. Die vollständige Liste finden Sie unter [Tool-Gruppen](/de/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Agentenspezifische Überschreibungen für den erhöhten Modus (`agents.list[].tools.elevated`) können die erhöhte Ausführung für bestimmte Agenten weiter einschränken. Weitere Informationen finden Sie unter [Erhöhter Modus](/de/tools/elevated).

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
Veraltete Konfigurationsschlüssel unter `agents.defaults.*`/`agents.list[].*` (wie `sandbox.perSession`, `agentRuntime`, `embeddedPi`) werden von `openclaw doctor` migriert. Verwenden Sie künftig vorzugsweise `agents.defaults` und `agents.list`.
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
    Diese Richtlinie deaktiviert die Dateisystem-Tools von OpenClaw, aber `exec` bleibt eine Shell und kann überall dort Dateien schreiben, wo das ausgewählte Host- oder Sandbox-Dateisystem dies zulässt. Verweigern Sie für einen schreibgeschützten Agenten `exec` und `process`, oder kombinieren Sie den Shell-Zugriff mit Sandbox-Dateisystemkontrollen wie `agents.defaults.sandbox.workspaceAccess: "ro"` oder `"none"`.
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

    `sessions_history` gibt in diesem Profil weiterhin eine begrenzte, bereinigte Erinnerungsansicht statt einer Rohfassung des Transkripts zurück. Die Assistentenerinnerung entfernt Denk-Tags, das `<relevant-memories>`-Gerüst, Tool-Aufruf-Nutzdaten im Klartext-XML-Format (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Aufrufblöcke), herabgestufte Tool-Aufrufgerüste, offengelegte ASCII-/vollbreite Modellsteuerungstoken sowie fehlerhaftes MiniMax-Tool-Aufruf-XML, bevor Schwärzung und Kürzung erfolgen.

  </Tab>
</Tabs>

---

## Häufige Fehlerquelle: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` vergleicht den Sitzungsschlüssel mit dem Schlüssel der Hauptsitzung (immer `"main"`; `session.mainKey` kann nicht benutzerseitig konfiguriert werden, und OpenClaw warnt bei jedem anderen Wert und ignoriert ihn), nicht mit der Agenten-ID. Gruppen-/Kanalsitzungen erhalten immer eigene Schlüssel, werden daher nicht als Hauptsitzung behandelt und in einer Sandbox ausgeführt. Wenn ein Agent niemals in einer Sandbox ausgeführt werden soll, legen Sie `agents.list[].sandbox.mode: "off"` fest.
</Warning>

---

## Tests

Nach der Konfiguration der Sandbox und Tools für mehrere Agenten:

<Steps>
  <Step title="Agentenauflösung prüfen">
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
    - Vergewissern Sie sich, dass der Agent verweigerte Tools nicht verwenden kann.

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
  <Accordion title="Agent trotz `mode: 'all'` nicht in einer Sandbox ausgeführt">
    - Prüfen Sie, ob eine globale Einstellung `agents.defaults.sandbox.mode` vorhanden ist, die diese Einstellung überschreibt.
    - Die agentenspezifische Konfiguration hat Vorrang. Legen Sie daher `agents.list[].sandbox.mode: "all"` fest.

  </Accordion>
  <Accordion title="Tools trotz Sperrliste weiterhin verfügbar">
    - Prüfen Sie die [vollständige Filterreihenfolge](#tool-restrictions): Profil → Provider-Profil → globale Richtlinie → Provider-Richtlinie → Agent-Richtlinie → Agent-Provider-Richtlinie → Sandbox → Subagent.
    - Jede Ebene kann den Zugriff nur weiter einschränken, nicht erneut gewähren.
    - Eine schrittweise Fehlerbehebung finden Sie unter [Sandbox im Vergleich zu Tool-Richtlinie und erhöhtem Modus](/de/gateway/sandbox-vs-tool-policy-vs-elevated).

  </Accordion>
  <Accordion title="Container nicht pro Agent isoliert">
    - Der standardmäßige `scope` ist `"agent"` (ein Container pro Agent-ID).
    - Legen Sie `scope: "session"` für einen Container pro Sitzung oder `scope: "shared"` für die Wiederverwendung eines Containers durch mehrere Agenten fest.

  </Accordion>
</AccordionGroup>

---

## Verwandte Themen

- [Erhöhter Modus](/de/tools/elevated)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sandbox-Konfiguration](/de/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox im Vergleich zu Tool-Richtlinie und erhöhtem Modus](/de/gateway/sandbox-vs-tool-policy-vs-elevated) — Fehlerbehebung für „Warum wird dies blockiert?“
- [Sandboxing](/de/gateway/sandboxing) — vollständige Sandbox-Referenz (Modi, Geltungsbereiche, Backends, Images)
- [Sitzungsverwaltung](/de/concepts/session)
