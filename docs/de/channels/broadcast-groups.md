---
read_when:
    - Broadcast-Gruppen konfigurieren
    - Multi-Agent-Antworten in WhatsApp debuggen
sidebarTitle: Broadcast groups
status: experimental
summary: Eine WhatsApp-Nachricht an mehrere Agenten senden
title: Broadcast-Gruppen
x-i18n:
    generated_at: "2026-07-12T14:59:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Status:** Experimentell. Hinzugefügt in 2026.1.9. Nur WhatsApp (Webkanal).
</Note>

## Übersicht

Broadcast-Gruppen führen **mehrere Agenten** für dieselbe eingehende Nachricht aus. Jeder Agent verarbeitet die Nachricht in seiner eigenen isolierten Sitzung und sendet seine eigene Antwort, sodass eine WhatsApp-Nummer ein Team spezialisierter Agenten in einem einzelnen Gruppenchat oder einer Direktnachricht beherbergen kann.

Broadcast-Gruppen werden nach Kanal-Zulassungslisten und Gruppenaktivierungsregeln ausgewertet. In WhatsApp-Gruppen erfolgen Broadcasts, wenn OpenClaw normalerweise antworten würde (beispielsweise bei einer Erwähnung, abhängig von Ihren Gruppeneinstellungen). Sie ändern nur, **welche Agenten ausgeführt werden**, niemals, ob eine Nachricht verarbeitet werden darf.

Die aktive WhatsApp-QA-Teststrecke enthält `whatsapp-broadcast-group-fanout`. Sie überprüft, ob eine erwähnende Gruppennachricht unterschiedliche sichtbare Antworten von zwei konfigurierten Agenten erzeugen kann.

## Konfiguration

### Grundlegende Einrichtung

Fügen Sie einen `broadcast`-Abschnitt auf oberster Ebene hinzu (neben `bindings`). Die Schlüssel sind WhatsApp-Peer-IDs, die Werte sind Arrays von Agenten-IDs:

- Gruppenchats: Gruppen-JID (z. B. `120363403215116621@g.us`)
- Direktnachrichten: Telefonnummer des Absenders im E.164-Format (z. B. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Ergebnis:** Wenn OpenClaw in diesem Chat antworten würde, führt es alle drei Agenten aus.

Jede aufgeführte Agenten-ID muss in `agents.list` vorhanden sein: Die Konfigurationsvalidierung meldet unbekannte IDs, und die Laufzeit überspringt sie mit der Warnung `Broadcast agent <id> not found in agents.list; skipping`.

### Verarbeitungsstrategie

`broadcast.strategy` legt fest, wie Agenten die Nachricht verarbeiten:

| Strategie            | Verhalten                                                                    |
| -------------------- | --------------------------------------------------------------------------- |
| `parallel` (Standard) | Alle Agenten verarbeiten gleichzeitig; Antworten treffen in beliebiger Reihenfolge ein. |
| `sequential`         | Agenten verarbeiten in Array-Reihenfolge; jeder wartet, bis der vorherige fertig ist. |

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

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
  <Step title="Eingehende Nachricht trifft ein">
    Eine WhatsApp-Gruppen- oder Direktnachricht trifft ein.
  </Step>
  <Step title="Routing und Zulassung">
    OpenClaw wendet Kanal-Zulassungslisten, Gruppenaktivierungsregeln und die konfigurierte Zuständigkeit von ACP-Bindungen an.
  </Step>
  <Step title="Broadcast-Prüfung">
    Wenn keine konfigurierte ACP-Bindung für die Route zuständig ist, prüft OpenClaw, ob sich die Peer-ID in `broadcast` befindet.
  </Step>
  <Step title="Wenn Broadcast angewendet wird">
    - Alle aufgeführten Agenten verarbeiten die Nachricht.
    - Jeder Agent verfügt über einen eigenen Sitzungsschlüssel und isolierten Kontext.
    - Agenten verarbeiten parallel (Standard) oder sequenziell.
    - Audioanhänge werden vor der Verteilung einmal transkribiert, sodass die Agenten ein gemeinsames Transkript verwenden, statt separate STT-Aufrufe durchzuführen.

  </Step>
  <Step title="Wenn Broadcast nicht angewendet wird">
    OpenClaw führt die gewöhnliche Route oder die während des Routings ausgewählte konfigurierte ACP-Sitzungsroute aus.
  </Step>
</Steps>

<Note>
Broadcast-Gruppen umgehen weder Kanal-Zulassungslisten noch Gruppenaktivierungsregeln (Erwähnungen/Befehle/usw.). Sie ändern nur, _welche Agenten ausgeführt werden_, wenn eine Nachricht verarbeitet werden darf.
</Note>

### Sitzungsisolation

Jeder Agent in einer Broadcast-Gruppe verwaltet vollständig getrennte:

- **Sitzungsschlüssel** (`agent:alfred:whatsapp:group:120363...` gegenüber `agent:baerbel:whatsapp:group:120363...`)
- **Konversationsverläufe** (ein Agent sieht die Antworten anderer Agenten nicht)
- **Arbeitsbereiche** (separate Sandboxes, sofern konfiguriert)
- **Werkzeugzugriffe** (unterschiedliche Zulassungs-/Sperrlisten)
- **Speicher/Kontext** (separate `IDENTITY.md`, `SOUL.md` usw.)

Eine Ausnahme wird absichtlich gemeinsam genutzt: Der **Gruppenkontextpuffer** (zuletzt gesendete Gruppennachrichten, die als Kontext dienen) wird pro Peer gemeinsam verwendet, sodass alle Broadcast-Agenten bei ihrer Auslösung denselben Kontext sehen. Er wird nach Abschluss der Verteilung einmal geleert.

Dadurch kann jeder Agent unterschiedliche Persönlichkeiten, Modelle, Skills und Werkzeugzugriffe haben (beispielsweise nur Lesezugriff gegenüber Lese- und Schreibzugriff).

### Beispiel: isolierte Sitzungen

In der Gruppe `120363403215116621@g.us` mit den Agenten `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Alfreds Kontext">
    ```text
    Sitzung: agent:alfred:whatsapp:group:120363403215116621@g.us
    Verlauf: [Benutzernachricht, frühere Antworten von Alfred]
    Arbeitsbereich: ~/openclaw-alfred/
    Werkzeuge: Lesen, Schreiben, Ausführen
    ```
  </Tab>
  <Tab title="Baerbels Kontext">
    ```text
    Sitzung: agent:baerbel:whatsapp:group:120363403215116621@g.us
    Verlauf: [Benutzernachricht, frühere Antworten von Baerbel]
    Arbeitsbereich: ~/openclaw-baerbel/
    Werkzeuge: nur Lesen
    ```
  </Tab>
</Tabs>

## Anwendungsfälle

- **Spezialisierte Agententeams**: Eine Entwicklungsgruppe, in der `code-reviewer`, `security-auditor`, `test-generator` und `docs-checker` jeweils dieselbe Nachricht aus ihrer eigenen Perspektive beantworten.
- **Mehrsprachiger Support**: Ein Support-Chat, in dem `support-en`, `support-de` und `support-es` in ihren jeweiligen Sprachen antworten.
- **Qualitätssicherung**: `support-agent` antwortet, während `qa-agent` die Antwort überprüft und nur reagiert, wenn Probleme gefunden werden.
- **Aufgabenautomatisierung**: `task-tracker`, `time-logger` und `report-generator` verarbeiten alle dieselbe Statusaktualisierung.

## Bewährte Vorgehensweisen

<AccordionGroup>
  <Accordion title="1. Agenten fokussiert halten">
    Weisen Sie jedem Agenten eine einzelne, klare Verantwortung zu (`formatter`, `linter`, `tester`), statt einen generischen „dev-helper“-Agenten zu verwenden.
  </Accordion>
  <Accordion title="2. Aussagekräftige IDs und Namen verwenden">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. Unterschiedliche Werkzeugzugriffe konfigurieren">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` hat nur Lesezugriff. `fixer` kann lesen und schreiben.

  </Accordion>
  <Accordion title="4. Leistung überwachen">
    Bevorzugen Sie bei vielen Agenten `"strategy": "parallel"` (Standard), beschränken Sie Broadcast-Gruppen auf einige wenige Agenten und verwenden Sie schnellere Modelle für einfachere Agenten.
  </Accordion>
  <Accordion title="5. Fehler bleiben isoliert">
    Agenten schlagen unabhängig voneinander fehl. Der Fehler eines Agenten wird protokolliert (`Broadcast agent <id> failed: ...`) und blockiert die anderen nicht.
  </Accordion>
</AccordionGroup>

## Kompatibilität

### Provider

Broadcast-Gruppen sind derzeit nur für WhatsApp (Webkanal) implementiert. Andere Kanäle ignorieren die `broadcast`-Konfiguration.

### Routing

Broadcast-Gruppen funktionieren zusammen mit dem bestehenden Routing:

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
**Priorität:** `broadcast` hat Vorrang vor gewöhnlichen Routenbindungen. Konfigurierte ACP-Bindungen (`bindings[].type="acp"`) sind exklusiv: Wenn eine davon übereinstimmt, leitet OpenClaw an die konfigurierte ACP-Sitzung weiter, statt einen Broadcast an mehrere Agenten zu verteilen.
</Note>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Agenten antworten nicht">
    **Prüfen Sie Folgendes:**

    1. Die Agenten-IDs sind in `agents.list` vorhanden (die Konfigurationsvalidierung lehnt unbekannte IDs ab).
    2. Das Peer-ID-Format ist korrekt (Gruppen-JID wie `120363403215116621@g.us` oder E.164 wie `+15551234567` für Direktnachrichten).
    3. Die Nachricht hat die normale Zugangsprüfung bestanden (Erwähnungs-/Aktivierungsregeln gelten weiterhin).

    **Debugging:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    Eine erfolgreiche Verteilung protokolliert `Broadcasting message to <n> agents (<strategy>)`.

  </Accordion>
  <Accordion title="Nur ein Agent antwortet">
    **Ursache:** Die Peer-ID befindet sich möglicherweise in gewöhnlichen Routenbindungen, aber nicht in `broadcast`, oder sie stimmt mit einer exklusiven konfigurierten ACP-Bindung überein.

    **Lösung:** Fügen Sie an gewöhnliche Routen gebundene Peers zur Broadcast-Konfiguration hinzu oder entfernen/ändern Sie die konfigurierte ACP-Bindung, wenn eine Broadcast-Verteilung gewünscht ist.

  </Accordion>
  <Accordion title="Leistungsprobleme">
    Falls die Verarbeitung mit vielen Agenten langsam ist: Reduzieren Sie die Anzahl der Agenten pro Gruppe, verwenden Sie ressourcenschonendere Modelle und prüfen Sie die Startzeit der Sandbox.
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

    Ein Codeausschnitt in der Gruppe erzeugt vier Antworten: Formatierungskorrekturen, einen Sicherheitsbefund, eine Abdeckungslücke und einen kleinen Dokumentationshinweis.

  </Accordion>
  <Accordion title="Beispiel 2: Mehrsprachige Pipeline">
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
  Legt fest, wie Agenten verarbeitet werden. `parallel` führt alle Agenten gleichzeitig aus; `sequential` führt sie in Array-Reihenfolge aus.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp-Gruppen-JID oder Telefonnummer im E.164-Format. Der Wert ist das Array von Agenten-IDs, die alle Nachrichten von diesem Peer verarbeiten sollen.
</ParamField>

## Einschränkungen

1. **Maximale Agentenzahl:** Es gibt keine feste Begrenzung, aber viele Agenten (10+) können langsam sein.
2. **Gemeinsamer Kontext:** Agenten sehen die Antworten der anderen nicht (beabsichtigtes Verhalten).
3. **Nachrichtenreihenfolge:** Parallele Antworten können in beliebiger Reihenfolge eintreffen.
4. **Ratenbegrenzungen:** Alle Antworten stammen von einem WhatsApp-Konto, daher wird die Antwort jedes Agenten auf dieselben WhatsApp-Ratenbegrenzungen angerechnet.

## Verwandte Themen

- [Kanal-Routing](/de/channels/channel-routing)
- [Gruppen](/de/channels/groups)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [Kopplung](/de/channels/pairing)
- [Sitzungsverwaltung](/de/concepts/session)
