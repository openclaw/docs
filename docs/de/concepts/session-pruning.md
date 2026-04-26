---
read_when:
    - Sie möchten das Anwachsen des Kontexts durch Tool-Ausgaben verringern
    - Sie möchten die Optimierung des Anthropic-Prompt-Caches verstehen
summary: Alte Tool-Ergebnisse kürzen, um den Kontext schlank und das Caching effizient zu halten
title: Sitzungsbereinigung
x-i18n:
    generated_at: "2026-04-26T11:27:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ea07f0ae23076906e2ff0246ac75813572f98cffa50afddb6a6b0af8964c4a9
    source_path: concepts/session-pruning.md
    workflow: 15
---

Die Sitzungsbereinigung kürzt **alte Tool-Ergebnisse** aus dem Kontext vor jedem LLM-
Aufruf. Sie reduziert das Anwachsen des Kontexts durch angesammelte Tool-Ausgaben (Exec-Ergebnisse, Datei-
Lesevorgänge, Suchergebnisse), ohne normalen Konversationstext umzuschreiben.

<Info>
Die Bereinigung erfolgt nur im Speicher -- sie verändert nicht das Sitzungs-Transkript auf der Festplatte.
Ihr vollständiger Verlauf bleibt immer erhalten.
</Info>

## Warum das wichtig ist

Lange Sitzungen sammeln Tool-Ausgaben an, die das Kontextfenster aufblähen. Das
erhöht die Kosten und kann [Compaction](/de/concepts/compaction) früher als nötig erzwingen.

Die Bereinigung ist besonders wertvoll für das **Anthropic-Prompt-Caching**. Nach Ablauf der Cache-
TTL schreibt die nächste Anfrage den vollständigen Prompt erneut in den Cache. Die Bereinigung reduziert die
Größe dieses Cache-Schreibvorgangs und senkt damit direkt die Kosten.

## So funktioniert es

1. Warten, bis die Cache-TTL abläuft (standardmäßig 5 Minuten).
2. Alte Tool-Ergebnisse für die normale Bereinigung finden (Konversationstext bleibt unberührt).
3. Übergroße Ergebnisse **weich kürzen** -- Anfang und Ende beibehalten, `...` einfügen.
4. Den Rest **hart leeren** -- durch einen Platzhalter ersetzen.
5. Die TTL zurücksetzen, damit Folgeanfragen den frischen Cache wiederverwenden.

## Legacy-Bildbereinigung

OpenClaw erstellt außerdem eine separate idempotente Replay-Ansicht für Sitzungen, die
rohe Bildblöcke oder Prompt-Hydration-Medienmarker im Verlauf speichern.

- Dabei bleiben die **3 neuesten abgeschlossenen Turns** bytegenau erhalten, damit Prompt-
  Cache-Präfixe für aktuelle Folgeanfragen stabil bleiben.
- In der Replay-Ansicht können ältere, bereits verarbeitete Bildblöcke aus dem Verlauf von `user` oder
  `toolResult` durch
  `[image data removed - already processed by model]`
  ersetzt werden.
- Ältere textuelle Medienreferenzen wie `[media attached: ...]`,
  `[Image: source: ...]` und `media://inbound/...` können durch
  `[media reference removed - already processed by model]` ersetzt werden. Marker für Anhänge
  im aktuellen Turn bleiben erhalten, damit Vision-Modelle weiterhin frische
  Bilder hydrieren können.
- Das rohe Sitzungs-Transkript wird nicht umgeschrieben, sodass Verlaufsansichten weiterhin
  die ursprünglichen Nachrichteneinträge und ihre Bilder rendern können.
- Dies ist getrennt von der normalen Cache-TTL-Bereinigung. Es existiert, um zu verhindern,
  dass wiederholte Bild-Payloads oder veraltete Medienreferenzen bei späteren Turns
  Prompt-Caches ungültig machen.

## Intelligente Standardwerte

OpenClaw aktiviert die Bereinigung automatisch für Anthropic-Profile:

| Profiltyp                                                | Bereinigung aktiviert | Heartbeat |
| -------------------------------------------------------- | --------------------- | --------- |
| Anthropic-OAuth-/Token-Auth (einschließlich Wiederverwendung der Claude CLI) | Ja | 1 Stunde |
| API-Schlüssel                                            | Ja                    | 30 min    |

Wenn Sie explizite Werte setzen, überschreibt OpenClaw diese nicht.

## Aktivieren oder deaktivieren

Für Nicht-Anthropic-Provider ist die Bereinigung standardmäßig deaktiviert. Zum Aktivieren:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Zum Deaktivieren: `mode: "off"` setzen.

## Bereinigung vs. Compaction

|            | Bereinigung         | Compaction              |
| ---------- | ------------------- | ----------------------- |
| **Was**    | Kürzt Tool-Ergebnisse | Fasst die Konversation zusammen |
| **Gespeichert?** | Nein (pro Anfrage) | Ja (im Transkript)     |
| **Umfang** | Nur Tool-Ergebnisse | Gesamte Konversation    |

Sie ergänzen sich -- die Bereinigung hält Tool-Ausgaben zwischen
Compaction-Zyklen schlank.

## Weiterführende Informationen

- [Compaction](/de/concepts/compaction) -- zusammenfassungsbasierte Kontextreduktion
- [Gateway-Konfiguration](/de/gateway/configuration) -- alle Konfigurationsoptionen für die Bereinigung
  (`contextPruning.*`)

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungstools](/de/concepts/session-tool)
- [Context engine](/de/concepts/context-engine)
