---
read_when:
    - Sie möchten, dass die Speicher-Promotion automatisch ausgeführt wird
    - Sie möchten verstehen, was jede Dreaming-Phase bewirkt
    - Sie möchten die Konsolidierung abstimmen, ohne `MEMORY.md` zu verschmutzen
summary: Hintergrund-Konsolidierung von Erinnerungen mit leichten, tiefen und REM-Phasen plus einem Traumtagebuch
title: Dreaming
x-i18n:
    generated_at: "2026-04-22T04:21:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 050e99bd2b3a18d7d2f02747e3010a7679515098369af5061d0a97b5703fc581
    source_path: concepts/dreaming.md
    workflow: 15
---

# Dreaming

Dreaming ist das System zur Hintergrund-Konsolidierung von Erinnerungen in `memory-core`.
Es hilft OpenClaw dabei, starke Kurzzeitsignale in dauerhafte Erinnerungen zu überführen und
den Prozess dabei erklärbar und überprüfbar zu halten.

Dreaming ist **Opt-in** und standardmäßig deaktiviert.

## Was Dreaming schreibt

Dreaming verwaltet zwei Arten von Ausgaben:

- **Maschinenzustand** in `memory/.dreams/` (Recall-Speicher, Phasensignale, Ingestion-Checkpoints, Sperren).
- **Für Menschen lesbare Ausgabe** in `DREAMS.md` (oder vorhandenem `dreams.md`) und optionalen Phasenberichtdateien unter `memory/dreaming/<phase>/YYYY-MM-DD.md`.

Langfristige Promotion schreibt weiterhin nur in `MEMORY.md`.

## Phasenmodell

Dreaming verwendet drei kooperative Phasen:

| Phase | Zweck                                     | Dauerhafter Schreibvorgang |
| ----- | ----------------------------------------- | -------------------------- |
| Light | Aktuelles Kurzzeitmaterial sortieren und vormerken | Nein                       |
| Deep  | Dauerhafte Kandidaten bewerten und hochstufen      | Ja (`MEMORY.md`)           |
| REM   | Über Themen und wiederkehrende Ideen reflektieren  | Nein                       |

Diese Phasen sind interne Implementierungsdetails, keine separaten benutzerkonfigurierbaren
„Modi“.

### Light-Phase

Die Light-Phase verarbeitet aktuelle tägliche Erinnerungssignale und Recall-Traces, dedupliziert sie
und stellt Kandidatenzeilen bereit.

- Liest aus dem Kurzzeit-Recall-Zustand, aktuellen täglichen Erinnerungsdateien und redigierten Sitzungs-Transkripten, sofern verfügbar.
- Schreibt einen verwalteten Block `## Light Sleep`, wenn der Speicher Inline-Ausgabe enthält.
- Erfasst Verstärkungssignale für das spätere Deep-Ranking.
- Schreibt niemals in `MEMORY.md`.

### Deep-Phase

Die Deep-Phase entscheidet, was zu langfristiger Erinnerung wird.

- Bewertet Kandidaten mit gewichteter Punktzahl und Schwellwert-Gates.
- Erfordert, dass `minScore`, `minRecallCount` und `minUniqueQueries` erfüllt sind.
- Hydriert Snippets vor dem Schreiben erneut aus Live-Tagesdateien, sodass veraltete/gelöschte Snippets übersprungen werden.
- Hängt hochgestufte Einträge an `MEMORY.md` an.
- Schreibt eine Zusammenfassung `## Deep Sleep` in `DREAMS.md` und optional in `memory/dreaming/deep/YYYY-MM-DD.md`.

### REM-Phase

Die REM-Phase extrahiert Muster und reflektierende Signale.

- Erstellt Themen- und Reflexionszusammenfassungen aus aktuellen Kurzzeit-Traces.
- Schreibt einen verwalteten Block `## REM Sleep`, wenn der Speicher Inline-Ausgabe enthält.
- Erfasst REM-Verstärkungssignale, die vom Deep-Ranking verwendet werden.
- Schreibt niemals in `MEMORY.md`.

## Ingestion von Sitzungs-Transkripten

Dreaming kann redigierte Sitzungs-Transkripte in den Dreaming-Korpus aufnehmen. Wenn
Transkripte verfügbar sind, werden sie zusammen mit täglichen Erinnerungssignalen und Recall-Traces
in die Light-Phase eingespeist. Persönliche und sensible Inhalte werden vor der Aufnahme redigiert.

## Traumtagebuch

Dreaming führt außerdem ein erzählerisches **Traumtagebuch** in `DREAMS.md`.
Sobald nach einer Phase genügend Material vorhanden ist, führt `memory-core` im Best-Effort-Verfahren
einen Hintergrund-Subagenten-Turn aus (mit dem Standard-Runtime-Modell) und hängt einen kurzen Tagebucheintrag an.

Dieses Tagebuch ist für menschliches Lesen in der Dreams-Benutzeroberfläche gedacht, nicht als Promotionsquelle.
Von Dreaming erzeugte Tagebuch-/Berichtsartefakte sind von der Kurzzeit-
Promotion ausgeschlossen. Nur fundierte Erinnerungssnippets kommen für eine
Promotion nach `MEMORY.md` infrage.

Es gibt außerdem eine fundierte historische Backfill-Spur für Überprüfungs- und Wiederherstellungsarbeiten:

- `memory rem-harness --path ... --grounded` zeigt eine Vorschau fundierter Tagebuchausgabe aus historischen Notizen `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` schreibt reversible fundierte Tagebucheinträge in `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` stellt fundierte dauerhafte Kandidaten in denselben Kurzzeit-Evidenzspeicher bereit, den die normale Deep-Phase bereits verwendet.
- `memory rem-backfill --rollback` und `--rollback-short-term` entfernen diese bereitgestellten Backfill-Artefakte, ohne normale Tagebucheinträge oder den Live-Kurzzeit-Recall zu berühren.

Die Control-Benutzeroberfläche stellt denselben Tagebuch-Backfill-/Reset-Ablauf bereit, sodass Sie
Ergebnisse in der Dreams-Szene prüfen können, bevor Sie entscheiden, ob die fundierten Kandidaten
eine Promotion verdienen. Die Szene zeigt außerdem eine separate fundierte Spur, sodass Sie sehen können,
welche bereitgestellten Kurzzeiteinträge aus historischem Replay stammen, welche hochgestuften
Elemente fundiert geführt waren, und nur fundiert-only bereitgestellte Einträge löschen können, ohne
den normalen Live-Kurzzeitzustand zu berühren.

## Deep-Ranking-Signale

Das Deep-Ranking verwendet sechs gewichtete Basissignale plus Phasenverstärkung:

| Signal               | Gewicht | Beschreibung                                      |
| -------------------- | ------- | ------------------------------------------------- |
| Frequency            | 0.24    | Wie viele Kurzzeitsignale der Eintrag gesammelt hat |
| Relevance            | 0.30    | Durchschnittliche Retrieval-Qualität für den Eintrag |
| Query diversity      | 0.15    | Unterschiedliche Query-/Tageskontexte, in denen er auftauchte |
| Recency              | 0.15    | Zeitlich abklingender Frische-Score               |
| Consolidation        | 0.10    | Wiederkehrstärke über mehrere Tage                |
| Conceptual richness  | 0.06    | Dichte von Konzept-Tags aus Snippet/Pfad          |

Treffer aus der Light- und REM-Phase fügen einen kleinen, zeitlich abklingenden Boost aus
`memory/.dreams/phase-signals.json` hinzu.

## Planung

Wenn aktiviert, verwaltet `memory-core` automatisch einen Cron-Job für einen vollständigen Dreaming-Durchlauf. Jeder Durchlauf führt die Phasen der Reihe nach aus: light -> REM -> deep.

Standardverhalten der Taktung:

| Einstellung           | Standard    |
| --------------------- | ----------- |
| `dreaming.frequency`  | `0 3 * * *` |

## Schnellstart

Dreaming aktivieren:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Dreaming mit benutzerdefinierter Durchlauf-Taktung aktivieren:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Slash-Befehl

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI-Workflow

Verwenden Sie die CLI-Promotion für Vorschau oder manuelles Anwenden:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Manuelles `memory promote` verwendet standardmäßig die Schwellwerte der Deep-Phase, sofern sie nicht
durch CLI-Flags überschrieben werden.

Erklären, warum ein bestimmter Kandidat hochgestuft würde oder nicht:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

REM-Reflexionen, Kandidatenwahrheiten und Deep-Promotion-Ausgabe in der Vorschau anzeigen, ohne
etwas zu schreiben:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Wichtige Standardwerte

Alle Einstellungen befinden sich unter `plugins.entries.memory-core.config.dreaming`.

| Schlüssel   | Standard    |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

Phasenrichtlinie, Schwellwerte und Speicherverhalten sind interne Implementierungs-
details (keine benutzerseitige Konfiguration).

Siehe [Memory configuration reference](/de/reference/memory-config#dreaming)
für die vollständige Schlüsselliste.

## Dreams-Benutzeroberfläche

Wenn aktiviert, zeigt der Gateway-Tab **Dreams**:

- aktuellen Dreaming-Aktivierungsstatus
- Status auf Phasenebene und Vorhandensein eines verwalteten Durchlaufs
- Zählungen für kurzfristig, fundiert, Signale und heute hochgestuft
- Zeitpunkt des nächsten geplanten Laufs
- eine separate fundierte Scene-Spur für bereitgestellte historische Replay-Einträge
- einen ausklappbaren Traumtagebuch-Leser auf Basis von `doctor.memory.dreamDiary`

## Fehlerbehebung

### Dreaming läuft nie (Status zeigt blocked)

Der verwaltete Dreaming-Cron läuft auf dem Heartbeat des Standard-Agenten. Wenn für diesen Agenten kein Heartbeat ausgelöst wird, reiht der Cron ein Systemereignis ein, das niemand verarbeitet, und Dreaming läuft stillschweigend nicht. Sowohl `openclaw memory status` als auch `/dreaming status` melden in diesem Fall `blocked` und nennen den Agenten, dessen Heartbeat der Blocker ist.

Zwei häufige Ursachen:

- Ein anderer Agent deklariert einen expliziten `heartbeat:`-Block. Wenn irgendein Eintrag in `agents.list` einen eigenen `heartbeat`-Block hat, senden nur diese Agenten Heartbeats — die Standardwerte gelten dann nicht mehr für alle anderen, sodass der Standard-Agent verstummen kann. Verschieben Sie die Heartbeat-Einstellungen nach `agents.defaults.heartbeat`, oder fügen Sie dem Standard-Agenten einen expliziten `heartbeat`-Block hinzu. Siehe [Geltungsbereich und Vorrang](/de/gateway/heartbeat#scope-and-precedence).
- `heartbeat.every` ist `0`, leer oder kann nicht geparst werden. Der Cron hat dann kein Intervall, nach dem er planen kann, sodass der Heartbeat effektiv deaktiviert ist. Setzen Sie `every` auf eine positive Dauer wie `30m`. Siehe [Standards](/de/gateway/heartbeat#defaults).

## Verwandt

- [Heartbeat](/de/gateway/heartbeat)
- [Memory](/de/concepts/memory)
- [Memory Search](/de/concepts/memory-search)
- [memory CLI](/cli/memory)
- [Memory configuration reference](/de/reference/memory-config)
