---
read_when:
    - Broadcast-Gruppen konfigurieren
    - Debugging von Multi-Agent-Antworten in WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Eine WhatsApp-Nachricht an mehrere Agenten senden
title: Broadcast-Gruppen
x-i18n:
    generated_at: "2026-07-24T03:38:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a468e4c65d2cc89bda24e8e599f8a45015e3f77f1073612b105daed8877c0ff9
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Status:** Experimentell. Hinzugefügt in 2026.1.9. Nur WhatsApp (Webkanal).
</Note>

## Überblick

Broadcast-Gruppen führen **mehrere Agenten** für dieselbe eingehende Nachricht aus. Jeder Agent verarbeitet die Nachricht in seiner eigenen isolierten Sitzung und sendet eine eigene Antwort, sodass eine WhatsApp-Nummer ein Team spezialisierter Agenten in einem einzigen Gruppenchat oder einer DM bereitstellen kann.

Broadcast-Gruppen werden nach den Kanal-Zulassungslisten und Gruppenaktivierungsregeln ausgewertet. In WhatsApp-Gruppen erfolgen Broadcasts, wenn OpenClaw normalerweise antworten würde (beispielsweise bei einer Erwähnung, abhängig von Ihren Gruppeneinstellungen). Sie ändern nur, **welche Agenten ausgeführt werden**, niemals, ob eine Nachricht verarbeitet werden darf.

Die aktive WhatsApp-QA-Spur enthält `whatsapp-broadcast-group-fanout`, womit überprüft wird, dass eine erwähnte Gruppennachricht unterschiedliche sichtbare Antworten von zwei konfigurierten Agenten erzeugen kann.

## Konfiguration

### Grundlegende Einrichtung

Fügen Sie einen `broadcast`-Abschnitt auf oberster Ebene hinzu (neben `bindings`). Die Schlüssel sind WhatsApp-Peer-IDs, die Werte sind Arrays von Agenten-IDs:

- Gruppenchats: Gruppen-JID (z. B. `120363403215116621@g.us`)
- DMs: E.164-Telefonnummer des Absenders (z. B. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Ergebnis:** Wenn OpenClaw in diesem Chat antworten würde, führt es alle drei Agenten aus.

Jede aufgeführte Agenten-ID muss in `agents.entries` vorhanden sein: Die Konfigurationsvalidierung meldet unbekannte IDs, und die Laufzeit überspringt sie mit einer `Broadcast agent <id> not found in agents.entries; skipping`-Warnung.

### Verarbeitungsstrategie

`broadcast.strategy` legt fest, wie Agenten die Nachricht verarbeiten:

| Strategie             | Verhalten                                                              |
| -------------------- | --------------------------------------------------------------------- |
| `parallel` (Standard) | Alle Agenten verarbeiten gleichzeitig; Antworten treffen in beliebiger Reihenfolge ein.       |
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
    Eine WhatsApp-Gruppen- oder DM-Nachricht trifft ein.
  </Step>
  <Step title="Routing und Zulassung">
    OpenClaw wendet Kanal-Zulassungslisten, Gruppenaktivierungsregeln und die konfigurierte Zuständigkeit von ACP-Bindungen an.
  </Step>
  <Step title="Broadcast-Prüfung">
    Wenn keine konfigurierte ACP-Bindung für die Route zuständig ist, prüft OpenClaw, ob die Peer-ID in `broadcast` enthalten ist.
  </Step>
  <Step title="Wenn der Broadcast angewendet wird">
    - Alle aufgeführten Agenten verarbeiten die Nachricht.
    - Jeder Agent verfügt über einen eigenen Sitzungsschlüssel und isolierten Kontext.
    - Die Agenten verarbeiten parallel (Standard) oder sequenziell.
    - Audioanhänge werden vor der Verteilung einmal transkribiert, sodass die Agenten ein gemeinsames Transkript verwenden, anstatt separate STT-Aufrufe durchzuführen.

  </Step>
  <Step title="Wenn der Broadcast nicht angewendet wird">
    OpenClaw leitet an die gewöhnliche Route oder die beim Routing ausgewählte konfigurierte ACP-Sitzungsroute weiter.
  </Step>
</Steps>

<Note>
Broadcast-Gruppen umgehen weder Kanal-Zulassungslisten noch Gruppenaktivierungsregeln (Erwähnungen/Befehle usw.). Sie ändern nur, _welche Agenten ausgeführt werden_, wenn eine Nachricht verarbeitet werden darf.
</Note>

### Sitzungsisolation

Jeder Agent in einer Broadcast-Gruppe verwaltet vollständig getrennte:

- **Sitzungsschlüssel** (`agent:alfred:whatsapp:group:120363...` gegenüber `agent:baerbel:whatsapp:group:120363...`)
- **Konversationsverläufe** (ein Agent sieht die Antworten anderer Agenten nicht)
- **Arbeitsbereiche** (separate Sandboxes, sofern konfiguriert)
- **Werkzeugzugriffe** (unterschiedliche Zulassungs-/Sperrlisten)
- **Speicher/Kontexte** (separate `IDENTITY.md`, `SOUL.md` usw.)

Eine Ausnahme wird bewusst gemeinsam genutzt: Der **Gruppenkontextpuffer** (aktuelle Gruppennachrichten, die als Kontext verwendet werden) wird pro Peer geteilt, sodass alle Broadcast-Agenten bei ihrer Auslösung denselben Kontext sehen. Er wird nach Abschluss der Verteilung einmal geleert.

Dadurch kann jeder Agent unterschiedliche Persönlichkeiten, Modelle, Skills und Werkzeugzugriffe haben (beispielsweise nur lesend gegenüber lesend und schreibend).

### Beispiel: isolierte Sitzungen

In der Gruppe `120363403215116621@g.us` mit den Agenten `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Alfreds Kontext">
    ```text
    Sitzung: agent:alfred:whatsapp:group:120363403215116621@g.us
    Verlauf: [Benutzernachricht, vorherige Antworten von Alfred]
    Arbeitsbereich: ~/openclaw-alfred/
    Werkzeuge: lesen, schreiben, ausführen
    ```
  </Tab>
  <Tab title="Baerbels Kontext">
    ```text
    Sitzung: agent:baerbel:whatsapp:group:120363403215116621@g.us
    Verlauf: [Benutzernachricht, vorherige Antworten von Baerbel]
    Arbeitsbereich: ~/openclaw-baerbel/
    Werkzeuge: nur lesen
    ```
  </Tab>
</Tabs>

## Anwendungsfälle

- **Spezialisierte Agententeams**: eine Entwicklungsgruppe, in der `code-reviewer`, `security-auditor`, `test-generator` und `docs-checker` jeweils dieselbe Nachricht aus ihrer eigenen Perspektive beantworten.
- **Mehrsprachiger Support**: ein Supportchat, in dem `support-en`, `support-de` und `support-es` in ihren jeweiligen Sprachen antworten.
- **Qualitätssicherung**: `support-agent` antwortet, während `qa-agent` die Antwort überprüft und nur reagiert, wenn Probleme gefunden werden.
- **Aufgabenautomatisierung**: `task-tracker`, `time-logger` und `report-generator` verarbeiten alle dieselbe Statusaktualisierung.

## Bewährte Vorgehensweisen

<AccordionGroup>
  <Accordion title="1. Agenten fokussiert halten">
    Weisen Sie jedem Agenten eine einzelne, klar definierte Aufgabe zu (`formatter`, `linter`, `tester`), statt einen allgemeinen „dev-helper“-Agenten zu verwenden.
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

    `reviewer` verfügt nur über Lesezugriff. `fixer` kann lesen und schreiben.

  </Accordion>
  <Accordion title="4. Leistung überwachen">
    Bei vielen Agenten sollten Sie `"strategy": "parallel"` (Standard) bevorzugen, Broadcast-Gruppen auf wenige Agenten beschränken und für einfachere Agenten schnellere Modelle verwenden.
  </Accordion>
  <Accordion title="5. Fehler bleiben isoliert">
    Agenten schlagen unabhängig voneinander fehl. Der Fehler eines Agenten wird protokolliert (`Broadcast agent <id> failed: ...`) und blockiert die anderen nicht.
  </Accordion>
</AccordionGroup>

## Kompatibilität

### Provider

Broadcast-Gruppen sind derzeit nur für WhatsApp (Webkanal) implementiert. Andere Kanäle ignorieren die `broadcast`-Konfiguration.

### Routing

Broadcast-Gruppen funktionieren zusammen mit dem vorhandenen Routing:

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

- `GROUP_A`: Nur Alfred antwortet (normales Routing).
- `GROUP_B`: Agent1 UND Agent2 antworten (Broadcast).

<Note>
**Priorität:** `broadcast` hat Vorrang vor gewöhnlichen Routenbindungen. Konfigurierte ACP-Bindungen (`bindings[].type="acp"`) sind exklusiv: Wenn eine davon übereinstimmt, leitet OpenClaw an die konfigurierte ACP-Sitzung weiter, anstatt einen verteilten Broadcast auszuführen.
</Note>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Agenten antworten nicht">
    **Prüfen Sie Folgendes:**

    1. Die Agenten-IDs sind in `agents.entries` vorhanden (die Konfigurationsvalidierung weist unbekannte IDs zurück).
    2. Das Peer-ID-Format ist korrekt (Gruppen-JID wie `120363403215116621@g.us` oder E.164 wie `+15551234567` für DMs).
    3. Die Nachricht hat die normale Zugangskontrolle passiert (Erwähnungs-/Aktivierungsregeln gelten weiterhin).

    **Fehlersuche:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    Eine erfolgreiche Verteilung protokolliert `Broadcasting message to <n> agents (<strategy>)`.

  </Accordion>
  <Accordion title="Nur ein Agent antwortet">
    **Ursache:** Die Peer-ID befindet sich möglicherweise in gewöhnlichen Routenbindungen, aber nicht in `broadcast`, oder sie stimmt möglicherweise mit einer exklusiven konfigurierten ACP-Bindung überein.

    **Lösung:** Fügen Sie gewöhnlich routengebundene Peers der Broadcast-Konfiguration hinzu oder entfernen/ändern Sie die konfigurierte ACP-Bindung, wenn ein verteilter Broadcast gewünscht ist.

  </Accordion>
  <Accordion title="Leistungsprobleme">
    Wenn die Verarbeitung bei vielen Agenten langsam ist: Reduzieren Sie die Anzahl der Agenten pro Gruppe, verwenden Sie schlankere Modelle und prüfen Sie die Startzeit der Sandbox.
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
  WhatsApp-Gruppen-JID oder E.164-Telefonnummer. Der Wert ist das Array der Agenten-IDs, die alle Nachrichten von diesem Peer verarbeiten sollen.
</ParamField>

## Einschränkungen

1. **Maximale Anzahl an Agenten:** keine feste Begrenzung, aber viele Agenten (10+) können langsam sein.
2. **Gemeinsamer Kontext:** Agenten sehen die Antworten der jeweils anderen nicht (beabsichtigtes Verhalten).
3. **Nachrichtenreihenfolge:** Parallele Antworten können in beliebiger Reihenfolge eintreffen.
4. **Ratenbegrenzungen:** Alle Antworten werden von einem einzigen WhatsApp-Konto gesendet, daher wird die Antwort jedes Agenten auf dieselben WhatsApp-Ratenbegrenzungen angerechnet.

## Verwandte Themen

- [Kanalrouting](/de/channels/channel-routing)
- [Gruppen](/de/channels/groups)
- [Multi-Agent-Sandbox-Tools](/de/tools/multi-agent-sandbox-tools)
- [Kopplung](/de/channels/pairing)
- [Sitzungsverwaltung](/de/concepts/session)
