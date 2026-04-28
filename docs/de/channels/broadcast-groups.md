---
read_when:
    - Broadcast-Gruppen konfigurieren
    - Behebung von Problemen mit Antworten mehrerer Agenten in WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Eine WhatsApp-Nachricht an mehrere Agenten senden
title: Broadcast-Gruppen
x-i18n:
    generated_at: "2026-04-26T11:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b36710d9cc3eb4e2b8ba3d57031bd020aedbb6a502b400ec02a835a320d609
    source_path: channels/broadcast-groups.md
    workflow: 15
---

<Note>
**Status:** Experimentell. Hinzugefügt in 2026.1.9.
</Note>

## Überblick

Broadcast-Gruppen ermöglichen es mehreren Agenten, dieselbe Nachricht gleichzeitig zu verarbeiten und darauf zu antworten. So können Sie spezialisierte Agenten-Teams erstellen, die in einer einzelnen WhatsApp-Gruppe oder DM zusammenarbeiten — und dabei alle dieselbe Telefonnummer verwenden.

Aktueller Umfang: **nur WhatsApp** (Web-Channel).

Broadcast-Gruppen werden nach Channel-Allowlists und Regeln zur Gruppenaktivierung ausgewertet. In WhatsApp-Gruppen bedeutet das, dass Broadcasts stattfinden, wenn OpenClaw normalerweise antworten würde (zum Beispiel bei Erwähnung, abhängig von Ihren Gruppeneinstellungen).

## Anwendungsfälle

<AccordionGroup>
  <Accordion title="1. Spezialisierte Agenten-Teams">
    Stellen Sie mehrere Agenten mit atomaren, fokussierten Verantwortlichkeiten bereit:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Jeder Agent verarbeitet dieselbe Nachricht und liefert seine spezialisierte Perspektive.

  </Accordion>
  <Accordion title="2. Mehrsprachige Unterstützung">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Qualitätssicherungs-Workflows">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Aufgabenautomatisierung">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## Konfiguration

### Grundeinrichtung

Fügen Sie einen `broadcast`-Abschnitt auf oberster Ebene hinzu (neben `bindings`). Die Schlüssel sind WhatsApp-Peer-IDs:

- Gruppenchats: Gruppen-JID (z. B. `120363403215116621@g.us`)
- DMs: E.164-Telefonnummer (z. B. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Ergebnis:** Wenn OpenClaw in diesem Chat antworten würde, werden alle drei Agenten ausgeführt.

### Verarbeitungsstrategie

Steuern Sie, wie Agenten Nachrichten verarbeiten:

<Tabs>
  <Tab title="parallel (default)">
    Alle Agenten verarbeiten gleichzeitig:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    Agenten verarbeiten der Reihe nach (einer wartet, bis der vorherige fertig ist):

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

### Vollständiges Beispiel

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## So funktioniert es

### Nachrichtenfluss

<Steps>
  <Step title="Eingehende Nachricht kommt an">
    Eine WhatsApp-Gruppen- oder DM-Nachricht kommt an.
  </Step>
  <Step title="Broadcast-Prüfung">
    Das System prüft, ob sich die Peer-ID in `broadcast` befindet.
  </Step>
  <Step title="Wenn in der Broadcast-Liste">
    - Alle aufgeführten Agenten verarbeiten die Nachricht.
    - Jeder Agent hat seinen eigenen Sitzungsschlüssel und einen isolierten Kontext.
    - Agenten verarbeiten parallel (Standard) oder sequenziell.

  </Step>
  <Step title="Wenn nicht in der Broadcast-Liste">
    Es gilt das normale Routing (erste passende Bindung).
  </Step>
</Steps>

<Note>
Broadcast-Gruppen umgehen weder Channel-Allowlists noch Regeln zur Gruppenaktivierung (Erwähnungen/Befehle/usw.). Sie ändern nur, _welche Agenten ausgeführt werden_, wenn eine Nachricht für die Verarbeitung infrage kommt.
</Note>

### Sitzungsisolierung

Jeder Agent in einer Broadcast-Gruppe verwaltet vollständig getrennte:

- **Sitzungsschlüssel** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Konversationsverlauf** (der Agent sieht die Nachrichten anderer Agenten nicht)
- **Workspace** (separate Sandboxes, falls konfiguriert)
- **Tool-Zugriff** (unterschiedliche Allow-/Deny-Listen)
- **Arbeitsspeicher/Kontext** (separate IDENTITY.md, SOUL.md usw.)
- **Gruppenkontextpuffer** (zuletzt verwendete Gruppennachrichten für den Kontext) wird pro Peer gemeinsam genutzt, sodass alle Broadcast-Agenten beim Auslösen denselben Kontext sehen

Dadurch kann jeder Agent Folgendes haben:

- Unterschiedliche Persönlichkeiten
- Unterschiedlichen Tool-Zugriff (z. B. schreibgeschützt vs. Lesen/Schreiben)
- Unterschiedliche Modelle (z. B. opus vs. sonnet)
- Unterschiedliche installierte Skills

### Beispiel: isolierte Sitzungen

In Gruppe `120363403215116621@g.us` mit den Agenten `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Alfreds Kontext">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbels Kontext">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Best Practices

<AccordionGroup>
  <Accordion title="1. Agenten fokussiert halten">
    Entwerfen Sie jeden Agenten mit einer einzelnen, klaren Verantwortlichkeit:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Gut:** Jeder Agent hat genau eine Aufgabe. ❌ **Schlecht:** Ein allgemeiner Agent „dev-helper“.

  </Accordion>
  <Accordion title="2. Beschreibende Namen verwenden">
    Machen Sie klar, was jeder Agent tut:

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. Unterschiedlichen Tool-Zugriff konfigurieren">
    Geben Sie Agenten nur die Tools, die sie benötigen:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Read-only
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. Leistung überwachen">
    Bei vielen Agenten sollten Sie Folgendes berücksichtigen:

    - `"strategy": "parallel"` (Standard) für Geschwindigkeit verwenden
    - Broadcast-Gruppen auf 5–10 Agenten begrenzen
    - Schnellere Modelle für einfachere Agenten verwenden

  </Accordion>
  <Accordion title="5. Fehler robust behandeln">
    Agenten schlagen unabhängig voneinander fehl. Der Fehler eines Agenten blockiert die anderen nicht:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Kompatibilität

### Provider

Broadcast-Gruppen funktionieren derzeit mit:

- ✅ WhatsApp (implementiert)
- 🚧 Telegram (geplant)
- 🚧 Discord (geplant)
- 🚧 Slack (geplant)

### Routing

Broadcast-Gruppen funktionieren zusammen mit vorhandenem Routing:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: Nur alfred antwortet (normales Routing).
- `GROUP_B`: agent1 UND agent2 antworten (Broadcast).

<Note>
**Priorität:** `broadcast` hat Vorrang vor `bindings`.
</Note>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Agenten antworten nicht">
    **Prüfen Sie:**

    1. Agent-IDs existieren in `agents.list`.
    2. Das Peer-ID-Format ist korrekt (z. B. `120363403215116621@g.us`).
    3. Agenten befinden sich nicht in Deny-Listen.

    **Debuggen:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Nur ein Agent antwortet">
    **Ursache:** Die Peer-ID befindet sich möglicherweise in `bindings`, aber nicht in `broadcast`.

    **Behebung:** Fügen Sie sie der Broadcast-Konfiguration hinzu oder entfernen Sie sie aus `bindings`.

  </Accordion>
  <Accordion title="Leistungsprobleme">
    Wenn es mit vielen Agenten langsam ist:

    - Verringern Sie die Anzahl der Agenten pro Gruppe.
    - Verwenden Sie leichtere Modelle (sonnet statt opus).
    - Prüfen Sie die Startzeit der Sandbox.

  </Accordion>
</AccordionGroup>

## Beispiele

<AccordionGroup>
  <Accordion title="Beispiel 1: Code-Review-Team">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    **Benutzer sendet:** Code-Snippet.

    **Antworten:**

    - code-formatter: "Einrückung korrigiert und Typhinweise hinzugefügt"
    - security-scanner: "⚠️ SQL-Injection-Schwachstelle in Zeile 12"
    - test-coverage: "Die Abdeckung beträgt 45 %, Tests für Fehlerfälle fehlen"
    - docs-checker: "Fehlender Docstring für Funktion `process_data`"

  </Accordion>
  <Accordion title="Beispiel 2: Mehrsprachige Unterstützung">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## API-Referenz

### Konfigurationsschema

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Felder

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  So werden Agenten verarbeitet. `parallel` führt alle Agenten gleichzeitig aus; `sequential` führt sie in der Reihenfolge des Arrays aus.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp-Gruppen-JID, E.164-Nummer oder andere Peer-ID. Der Wert ist das Array von Agent-IDs, die Nachrichten verarbeiten sollen.
</ParamField>

## Einschränkungen

1. **Max. Agenten:** Kein hartes Limit, aber 10+ Agenten können langsam sein.
2. **Gemeinsamer Kontext:** Agenten sehen die Antworten der anderen nicht (absichtlich).
3. **Nachrichtenreihenfolge:** Parallele Antworten können in beliebiger Reihenfolge eintreffen.
4. **Ratenlimits:** Alle Agenten zählen für die WhatsApp-Ratenlimits.

## Zukünftige Erweiterungen

Geplante Funktionen:

- [ ] Modus mit gemeinsamem Kontext (Agenten sehen die Antworten der anderen)
- [ ] Agentenkoordination (Agenten können sich gegenseitig Signale senden)
- [ ] Dynamische Agentenauswahl (Agenten anhand des Nachrichteninhalts auswählen)
- [ ] Agentenprioritäten (einige Agenten antworten vor anderen)

## Verwandte Inhalte

- [Channel-Routing](/de/channels/channel-routing)
- [Gruppen](/de/channels/groups)
- [Sandbox-Tools für mehrere Agenten](/de/tools/multi-agent-sandbox-tools)
- [Koppeln](/de/channels/pairing)
- [Sitzungsverwaltung](/de/concepts/session)
