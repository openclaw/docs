---
read_when:
    - Sie möchten das Kontextwachstum durch Tool-Ausgaben reduzieren
    - Sie möchten die Optimierung des Anthropic-Prompt-Caches verstehen
summary: Alte Tool-Ergebnisse kürzen, um den Kontext schlank und das Caching effizient zu halten
title: Sitzungsbereinigung
x-i18n:
    generated_at: "2026-07-12T15:20:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

Das Bereinigen von Sitzungen kürzt **alte Tool-Ergebnisse** vor jedem LLM-Aufruf aus dem Kontext. Es reduziert die Aufblähung des Kontexts durch angesammelte Tool-Ausgaben (Ausführungsergebnisse, gelesene Dateien, Suchergebnisse), ohne normalen Konversationstext umzuschreiben.

<Info>
Die Bereinigung erfolgt nur im Arbeitsspeicher – sie verändert nicht das auf dem Datenträger gespeicherte Sitzungsprotokoll. Ihr vollständiger Verlauf bleibt stets erhalten.
</Info>

## Warum dies wichtig ist

In langen Sitzungen sammeln sich Tool-Ausgaben an, die das Kontextfenster aufblähen. Dies erhöht die Kosten und kann eine [Compaction](/de/concepts/compaction) früher als nötig erzwingen.

Die Bereinigung ist besonders wertvoll für das **Prompt-Caching von Anthropic**. Nach Ablauf der Cache-TTL wird bei der nächsten Anfrage der gesamte Prompt erneut zwischengespeichert. Die Bereinigung reduziert die Größe des Cache-Schreibvorgangs und senkt dadurch direkt die Kosten.

## Funktionsweise

Die Bereinigung wird im Modus `cache-ttl` ausgeführt und ist sowohl an eine Zeitprüfung als auch an eine Prüfung der Kontextgröße gebunden:

1. Warten Sie, bis die Cache-TTL abgelaufen ist (standardmäßig 5 Minuten bei manueller Festlegung; die automatische Anthropic-Voreinstellung finden Sie unter [Intelligente Voreinstellungen](#smart-defaults)). Vor Ablauf der TTL wird die Bereinigung vollständig übersprungen, damit der Prompt-Cache bei zeitlich nah beieinanderliegenden Interaktionen wiederverwendet werden kann.
2. Sobald die TTL abgelaufen ist, wird die Gesamtkontextgröße im Verhältnis zum Kontextfenster des Modells geschätzt. Liegt das Verhältnis unter `softTrimRatio` (standardmäßig 0.3), wird die Bereinigung übersprungen und die TTL-Uhr läuft weiter.
3. **Sanftes Kürzen** übergroßer Tool-Ergebnisse oberhalb des Verhältnisses: Anfang und Ende werden beibehalten (standardmäßig jeweils 1500 Zeichen, zusammen auf 4000 Zeichen begrenzt), dazwischen wird `...` eingefügt.
4. Liegt das Verhältnis weiterhin bei oder über `hardClearRatio` (standardmäßig 0.5) und verbleiben mindestens `minPrunableToolChars` (standardmäßig 50,000) Zeichen bereinigungsfähiger Tool-Inhalte, werden diese Ergebnisse **vollständig geleert**: Ihr Inhalt wird durch einen Platzhalter ersetzt (standardmäßig `[Old tool result content cleared]`).
5. Die TTL-Uhr wird nur zurückgesetzt, wenn die Bereinigung den Kontext tatsächlich verändert hat, sodass nachfolgende Anfragen den neuen Cache wiederverwenden.

Unabhängig von den Schwellenwerten gelten zwei Sicherheitsregeln: Die neuesten `keepLastAssistants` Assistenteninteraktionen (standardmäßig 3) werden niemals bereinigt, und nichts vor der ersten Benutzernachricht der Sitzung wird jemals bereinigt (dies schützt initiale Lesevorgänge wie `SOUL.md`/`USER.md`).

Nur `toolResult`-Nachrichten kommen infrage; normaler Konversationstext bleibt unverändert. Mit `agents.defaults.contextPruning.tools.{allow,deny}` legen Sie fest, welche Tool-Namen bereinigt werden dürfen.

## Bereinigung veralteter Bilder

OpenClaw erstellt außerdem eine separate idempotente Wiedergabeansicht für Sitzungen, deren Verlauf rohe Bildblöcke oder Medienmarker aus der Prompt-Hydration enthält.

- Die **3 neuesten abgeschlossenen Interaktionen** werden bytegenau beibehalten, damit die Präfixe des Prompt-Caches für aktuelle Folgeanfragen stabil bleiben. Diese Anzahl umfasst alle abgeschlossenen Interaktionen, nicht nur solche mit Bildern, sodass auch reine Textinteraktionen das Fenster beanspruchen.
- In der Wiedergabeansicht werden ältere, bereits verarbeitete Bildblöcke aus dem Verlauf von `user` oder `toolResult` durch `[image data removed - already processed by model]` ersetzt.
- Ältere textuelle Medienreferenzen wie `[media attached: ...]`, `[Image: source: ...]` und `media://inbound/...` werden durch `[media reference removed - already processed by model]` ersetzt. Anhangsmarker der aktuellen Interaktion bleiben unverändert, damit Vision-Modelle neue Bilder weiterhin hydratisieren können.
- Das rohe Sitzungsprotokoll wird nicht umgeschrieben, sodass Verlaufsansichten weiterhin die ursprünglichen Nachrichteneinträge und deren Bilder darstellen können.
- Dies erfolgt getrennt von der oben beschriebenen normalen Cache-TTL-Bereinigung. Es verhindert, dass wiederholte Bildnutzlasten oder veraltete Medienreferenzen bei späteren Interaktionen Prompt-Caches unbrauchbar machen.

## Intelligente Voreinstellungen

Das gebündelte Anthropic-Plugin konfiguriert die Bereinigung und den Heartbeat-Takt automatisch, wenn es erstmals ein Anthropic-Authentifizierungsprofil (oder Claude-CLI-Authentifizierungsprofil) auflöst, jedoch nur für Felder, die Sie nicht bereits ausdrücklich festgelegt haben:

| Authentifizierungsmodus                          | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| ------------------------------------------------ | --------------------- | -------------------- | ----------------- |
| OAuth/Token (einschließlich Claude-CLI-Nutzung)   | `cache-ttl`           | `1h`                 | `1h`              |
| API-Schlüssel                                     | `cache-ttl`           | `1h`                 | `30m`             |

Wenn Sie `agents.defaults.contextPruning.mode` oder `agents.defaults.heartbeat.every` selbst festlegen, überschreibt OpenClaw diese Werte nicht. Diese automatische Voreinstellung wird nur bei der Authentifizierung für die Anthropic-Produktfamilie angewendet; bei anderen Providern bleibt die Bereinigung `off`, sofern Sie sie nicht konfigurieren.

## Aktivieren oder deaktivieren

Bei Providern außerhalb der Anthropic-Produktfamilie ist die Bereinigung standardmäßig deaktiviert. So aktivieren Sie sie:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

So deaktivieren Sie sie: Legen Sie `mode: "off"` fest.

## Bereinigung im Vergleich zur Compaction

|                  | Bereinigung             | Compaction                  |
| ---------------- | ----------------------- | --------------------------- |
| **Was**          | Kürzt Tool-Ergebnisse   | Fasst die Konversation zusammen |
| **Gespeichert?** | Nein (pro Anfrage)      | Ja (im Protokoll)           |
| **Umfang**       | Nur Tool-Ergebnisse     | Gesamte Konversation        |

Beide ergänzen sich – die Bereinigung hält die Tool-Ausgaben zwischen Compaction-Zyklen schlank.

## Weiterführende Informationen

- [Compaction](/de/concepts/compaction): kontextreduzierende Zusammenfassung
- [Gateway-Konfiguration](/de/gateway/configuration): alle Konfigurationsoptionen für die Bereinigung (`contextPruning.*`)

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungs-Tools](/de/concepts/session-tool)
- [Kontext-Engine](/de/concepts/context-engine)
