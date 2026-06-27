---
read_when:
    - Broadcast-Gruppen konfigurieren
    - Debugging von Multi-Agent-Antworten in WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Eine WhatsApp-Nachricht an mehrere Agenten senden
title: Broadcast-Gruppen
x-i18n:
    generated_at: "2026-06-27T17:09:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a89b936322baf0fea7b487cb5354b9fad3fc021abb2970f7cd934b1880da2a0e
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Status:** Experimentell. Hinzugefügt in 2026.1.9.
</Note>

## Überblick

Broadcast-Gruppen ermöglichen es mehreren Agenten, dieselbe Nachricht gleichzeitig zu verarbeiten und darauf zu antworten. Dadurch können Sie spezialisierte Agententeams erstellen, die gemeinsam in einer einzelnen WhatsApp-Gruppe oder DM arbeiten – alle mit einer Telefonnummer.

Aktueller Umfang: **nur WhatsApp** (Webkanal).

Broadcast-Gruppen werden nach Kanal-Allowlists und Gruppenaktivierungsregeln ausgewertet. In WhatsApp-Gruppen bedeutet das, dass Broadcasts stattfinden, wenn OpenClaw normalerweise antworten würde (zum Beispiel: bei Erwähnung, abhängig von Ihren Gruppeneinstellungen).

## Anwendungsfälle

<AccordionGroup>
  <Accordion title="1. Spezialisierte Agententeams">
    Setzen Sie mehrere Agenten mit atomaren, fokussierten Verantwortlichkeiten ein:

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
  <Accordion title="3. Workflows zur Qualitätssicherung">
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

### Grundlegende Einrichtung

Fügen Sie einen `broadcast`-Abschnitt auf oberster Ebene hinzu (neben `bindings`). Schlüssel sind WhatsApp-Peer-IDs:

- Gruppenchats: Gruppen-JID (z. B. `120363403215116621@g.us`)
- DMs: E.164-Telefonnummer (z. B. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Ergebnis:** Wenn OpenClaw in diesem Chat antworten würde, führt es alle drei Agenten aus.

### Verarbeitungsstrategie

Steuern Sie, wie Agenten Nachrichten verarbeiten:

<Tabs>
  <Tab title="parallel (Standard)">
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

## Funktionsweise

### Nachrichtenfluss

<Steps>
  <Step title="Eingehende Nachricht kommt an">
    Eine WhatsApp-Gruppen- oder DM-Nachricht kommt an.
  </Step>
  <Step title="Routing und Zulassung">
    OpenClaw wendet Kanal-Allowlists, Gruppenaktivierungsregeln und die konfigurierte ACP-Binding-Eigentümerschaft an.
  </Step>
  <Step title="Broadcast-Prüfung">
    Wenn kein konfiguriertes ACP-Binding die Route besitzt, prüft OpenClaw, ob die Peer-ID in `broadcast` enthalten ist.
  </Step>
  <Step title="Wenn Broadcast zutrifft">
    - Alle aufgeführten Agenten verarbeiten die Nachricht.
    - Jeder Agent hat seinen eigenen Sitzungsschlüssel und isolierten Kontext.
    - Agenten verarbeiten parallel (Standard) oder sequenziell.

  </Step>
  <Step title="Wenn Broadcast nicht zutrifft">
    OpenClaw dispatcht die normale Route oder die konfigurierte ACP-Sitzungsroute, die während des Routings ausgewählt wurde.
  </Step>
</Steps>

<Note>
Broadcast-Gruppen umgehen keine Kanal-Allowlists oder Gruppenaktivierungsregeln (Erwähnungen/Befehle/usw.). Sie ändern nur, _welche Agenten ausgeführt werden_, wenn eine Nachricht für die Verarbeitung berechtigt ist.
</Note>

### Sitzungsisolation

Jeder Agent in einer Broadcast-Gruppe verwaltet vollständig getrennte:

- **Sitzungsschlüssel** (`agent:alfred:whatsapp:group:120363...` vs. `agent:baerbel:whatsapp:group:120363...`)
- **Unterhaltungsverlauf** (Agent sieht die Nachrichten anderer Agenten nicht)
- **Workspace** (getrennte Sandboxes, falls konfiguriert)
- **Tool-Zugriff** (unterschiedliche Allow/Deny-Listen)
- **Memory/Kontext** (separate IDENTITY.md, SOUL.md, usw.)
- **Gruppenkontextpuffer** (aktuelle Gruppennachrichten, die für den Kontext verwendet werden) wird pro Peer geteilt, sodass alle Broadcast-Agenten beim Auslösen denselben Kontext sehen

Dies ermöglicht jedem Agenten:

- Unterschiedliche Persönlichkeiten
- Unterschiedlichen Tool-Zugriff (z. B. nur lesend vs. lesend-schreibend)
- Unterschiedliche Modelle (z. B. opus vs. sonnet)
- Unterschiedlich installierte Skills

### Beispiel: isolierte Sitzungen

In Gruppe `120363403215116621@g.us` mit Agenten `["alfred", "baerbel"]`:

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

## Bewährte Praktiken

<AccordionGroup>
  <Accordion title="1. Agenten fokussiert halten">
    Gestalten Sie jeden Agenten mit einer einzelnen, klaren Verantwortung:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Gut:** Jeder Agent hat eine Aufgabe. ❌ **Schlecht:** Ein generischer „dev-helper“-Agent.

  </Accordion>
  <Accordion title="2. Aussagekräftige Namen verwenden">
    Machen Sie deutlich, was jeder Agent tut:

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
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` ist nur lesend. `fixer` kann lesen und schreiben.

  </Accordion>
  <Accordion title="4. Leistung überwachen">
    Bei vielen Agenten sollten Sie Folgendes berücksichtigen:

    - `"strategy": "parallel"` (Standard) für Geschwindigkeit verwenden
    - Broadcast-Gruppen auf 5–10 Agenten begrenzen
    - Schnellere Modelle für einfachere Agenten verwenden

  </Accordion>
  <Accordion title="5. Fehler elegant behandeln">
    Agenten schlagen unabhängig voneinander fehl. Der Fehler eines Agenten blockiert andere nicht:

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
**Rangfolge:** `broadcast` hat Vorrang vor normalen Route-Bindings. Konfigurierte ACP-Bindings (`bindings[].type="acp"`) sind exklusiv: Wenn eines übereinstimmt, dispatcht OpenClaw an die konfigurierte ACP-Sitzung statt an einen Fan-out-Broadcast.
</Note>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Agenten antworten nicht">
    **Prüfen:**

    1. Agenten-IDs existieren in `agents.list`.
    2. Das Peer-ID-Format ist korrekt (z. B. `120363403215116621@g.us`).
    3. Agenten sind nicht in Deny-Listen.

    **Debugging:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Nur ein Agent antwortet">
    **Ursache:** Die Peer-ID könnte in normalen Route-Bindings enthalten sein, aber nicht in `broadcast`, oder sie könnte einem exklusiven konfigurierten ACP-Binding entsprechen.

    **Behebung:** Fügen Sie Peers mit normalem Route-Binding zur Broadcast-Konfiguration hinzu, oder entfernen/ändern Sie das konfigurierte ACP-Binding, wenn Fan-out-Broadcast gewünscht ist.

  </Accordion>
  <Accordion title="Leistungsprobleme">
    Wenn es mit vielen Agenten langsam ist:

    - Reduzieren Sie die Anzahl der Agenten pro Gruppe.
    - Verwenden Sie leichtere Modelle (sonnet statt opus).
    - Prüfen Sie die Sandbox-Startzeit.

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

    **Benutzer sendet:** Codeausschnitt.

    **Antworten:**

    - code-formatter: „Einrückung korrigiert und Typhinweise hinzugefügt“
    - security-scanner: „⚠️ SQL-Injection-Schwachstelle in Zeile 12“
    - test-coverage: „Abdeckung beträgt 45 %, Tests für Fehlerfälle fehlen“
    - docs-checker: „Fehlender Docstring für Funktion `process_data`“

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
  Wie Agenten verarbeitet werden. `parallel` führt alle Agenten gleichzeitig aus; `sequential` führt sie in Array-Reihenfolge aus.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp-Gruppen-JID, E.164-Nummer oder andere Peer-ID. Der Wert ist das Array der Agenten-IDs, die Nachrichten verarbeiten sollen.
</ParamField>

## Einschränkungen

1. **Max. Agenten:** Keine feste Begrenzung, aber 10+ Agenten können langsam sein.
2. **Gemeinsamer Kontext:** Agenten sehen die Antworten der jeweils anderen nicht (absichtlich).
3. **Nachrichtenreihenfolge:** Parallele Antworten können in beliebiger Reihenfolge eintreffen.
4. **Rate Limits:** Alle Agenten zählen gegen die WhatsApp-Rate-Limits.

## Zukünftige Erweiterungen

Geplante Funktionen:

- [ ] Modus für gemeinsamen Kontext (Agenten sehen die Antworten der jeweils anderen)
- [ ] Agentenkoordination (Agenten können einander Signale senden)
- [ ] Dynamische Agentenauswahl (Agenten basierend auf dem Nachrichteninhalt auswählen)
- [ ] Agentenprioritäten (einige Agenten antworten vor anderen)

## Verwandte Themen

- [Kanalrouting](/de/channels/channel-routing)
- [Gruppen](/de/channels/groups)
- [Multi-Agenten-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [Kopplung](/de/channels/pairing)
- [Sitzungsverwaltung](/de/concepts/session)
