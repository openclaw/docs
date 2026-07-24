---
read_when:
    - Sie möchten das Anwachsen des Kontexts durch Tool-Ausgaben reduzieren
    - Sie möchten die Optimierung des Anthropic-Prompt-Caches verstehen
summary: Alte Tool-Ergebnisse kürzen, um den Kontext schlank und das Caching effizient zu halten
title: Sitzungsbereinigung
x-i18n:
    generated_at: "2026-07-24T03:46:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dd5cb4582cb8d9d7265213abe1f5b5893634882b9f8b3ce1deef746293dd07db
    source_path: concepts/session-pruning.md
    workflow: 16
---

Session-Pruning kürzt **alte Tool-Ergebnisse** vor jedem LLM-Aufruf aus dem Kontext. Es reduziert die Aufblähung des Kontexts durch angesammelte Tool-Ausgaben (Ausführungsergebnisse, gelesene Dateien, Suchergebnisse), ohne normalen Konversationstext umzuschreiben.

<Info>
Pruning erfolgt nur im Arbeitsspeicher -- es ändert nicht das auf dem Datenträger gespeicherte Sitzungsprotokoll. Ihr vollständiger Verlauf bleibt stets erhalten.
</Info>

## Warum es wichtig ist

In langen Sitzungen sammeln sich Tool-Ausgaben an, die das Kontextfenster aufblähen. Dies erhöht die Kosten und kann eine [Compaction](/de/concepts/compaction) früher als nötig erzwingen.

Pruning ist besonders wertvoll für das **Prompt-Caching von Anthropic**. Nach Ablauf der Cache-TTL speichert die nächste Anfrage den vollständigen Prompt erneut im Cache. Pruning reduziert die Größe des Cache-Schreibvorgangs und senkt dadurch direkt die Kosten.

## Funktionsweise

Pruning wird im Modus `cache-ttl` ausgeführt und setzt sowohl eine Zeitprüfung als auch eine Prüfung der Kontextgröße voraus:

1. Warten Sie, bis die Cache-TTL abgelaufen ist (standardmäßig 5 Minuten bei manueller Festlegung; den automatischen Anthropic-Standardwert finden Sie unter [Intelligente Standardwerte](#smart-defaults)). Vor Ablauf der TTL wird Pruning vollständig übersprungen, damit der Prompt-Cache für zeitlich nahe aufeinanderfolgende Durchläufe wiederverwendet werden kann.
2. Nach Ablauf der TTL wird die gesamte Kontextgröße im Verhältnis zum Kontextfenster des Modells geschätzt. Liegt das Verhältnis unter `softTrimRatio` (Standardwert 0.3), wird Pruning übersprungen und die TTL-Uhr läuft weiter.
3. **Sanftes Kürzen** übergroßer Tool-Ergebnisse oberhalb des Verhältnisses: Anfang und Ende bleiben erhalten (standardmäßig jeweils 1500 Zeichen, zusammen auf 4000 Zeichen begrenzt), dazwischen wird `...` eingefügt.
4. Liegt das Verhältnis weiterhin bei oder über `hardClearRatio` (Standardwert 0.5) und verbleiben mindestens `minPrunableToolChars` (Standardwert 50,000) kürzbare Tool-Inhalte, werden diese Ergebnisse **vollständig geleert**: Ihr Inhalt wird durch einen Platzhalter ersetzt (standardmäßig `[Old tool result content cleared]`).
5. Die TTL-Uhr wird nur zurückgesetzt, wenn Pruning den Kontext tatsächlich geändert hat, damit nachfolgende Anfragen den neu erstellten Cache wiederverwenden.

Unabhängig von den Schwellenwerten gelten zwei Sicherheitsregeln: Die neuesten `keepLastAssistants` Assistant-Durchläufe (Standardwert 3) werden niemals gekürzt, und nichts vor der ersten Benutzernachricht der Sitzung wird jemals gekürzt (dies schützt initiale Lesevorgänge wie `SOUL.md`/`USER.md`).

Nur `toolResult`-Nachrichten kommen infrage; normaler Konversationstext bleibt unverändert. Mit `agents.defaults.contextPruning.tools.{allow,deny}` legen Sie fest, welche Tool-Namen gekürzt werden können.

## Bereinigung älterer Bilder

OpenClaw erstellt außerdem eine separate idempotente Wiedergabeansicht für Sitzungen, in deren Verlauf rohe Bildblöcke oder Medienmarker zur Prompt-Hydration gespeichert sind.

- Die **3 neuesten abgeschlossenen Durchläufe** bleiben Byte für Byte erhalten, damit die Präfixe des Prompt-Caches für aktuelle Folgeanfragen stabil bleiben. Diese Anzahl umfasst alle abgeschlossenen Durchläufe, nicht nur solche mit Bildern; daher zählen auch reine Textdurchläufe zum Fenster.
- In der Wiedergabeansicht werden ältere, bereits verarbeitete Bildblöcke aus dem `user`- oder `toolResult`-Verlauf durch `[image data removed - already processed by model]` ersetzt.
- Ältere textuelle Medienverweise wie `[media attached: ...]`, `[Image: source: ...]` und `media://inbound/...` werden durch `[media reference removed - already processed by model]` ersetzt. Anhangsmarker des aktuellen Durchlaufs bleiben unverändert, damit Vision-Modelle neue Bilder weiterhin hydratisieren können.
- Das rohe Sitzungsprotokoll wird nicht umgeschrieben, sodass Verlaufsanzeigen weiterhin die ursprünglichen Nachrichteneinträge und deren Bilder darstellen können.
- Dies erfolgt getrennt vom normalen Cache-TTL-Pruning oben. Es verhindert, dass wiederholte Bildnutzlasten oder veraltete Medienverweise die Prompt-Caches bei späteren Durchläufen unbrauchbar machen.

## Intelligente Standardwerte

Das mitgelieferte Anthropic-Plugin konfiguriert Pruning und den Heartbeat-Rhythmus automatisch, wenn es erstmals ein Anthropic-Authentifizierungsprofil (oder Claude-CLI-Authentifizierungsprofil) auflöst, jedoch nur für Felder, die Sie nicht bereits ausdrücklich festgelegt haben:

| Authentifizierungsmodus                  | `contextPruning.mode` | `contextPruning.ttl` | `heartbeat.every` |
| ---------------------------------------- | --------------------- | -------------------- | ----------------- |
| OAuth/Token (einschließlich Wiederverwendung der Claude CLI) | `cache-ttl`           | `1h`                 | `1h`              |
| API-Schlüssel                            | `cache-ttl`           | `1h`                 | `30m`             |

Wenn Sie `agents.defaults.contextPruning.mode` oder `agents.defaults.heartbeat.every` selbst festlegen, überschreibt OpenClaw diese Werte nicht. Dieser automatische Standardwert wird nur für Authentifizierungen der Anthropic-Familie angewendet; bei anderen Providern ist Pruning `off`, sofern Sie es nicht konfigurieren.

## Aktivieren oder deaktivieren

Für Provider außer Anthropic ist Pruning standardmäßig deaktiviert. So aktivieren Sie es:

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

Zum Deaktivieren: Legen Sie `mode: "off"` fest.

## Pruning im Vergleich zu Compaction

|              | Pruning               | Compaction                    |
| ------------ | --------------------- | ----------------------------- |
| **Was**      | Kürzt Tool-Ergebnisse | Fasst die Konversation zusammen |
| **Gespeichert?** | Nein (pro Anfrage) | Ja (im Protokoll)             |
| **Umfang**   | Nur Tool-Ergebnisse   | Gesamte Konversation          |

Beide ergänzen sich -- Pruning hält die Tool-Ausgaben zwischen Compaction-Zyklen schlank.

## Weiterführende Informationen

- [Compaction](/de/concepts/compaction): kontextreduzierende Zusammenfassung
- [Gateway-Konfiguration](/de/gateway/configuration): alle Konfigurationsoptionen für Pruning (`contextPruning.*`)

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungs-Tools](/de/concepts/session-tool)
- [Kontext-Engine](/de/concepts/context-engine)
