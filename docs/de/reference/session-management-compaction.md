---
read_when:
    - Sie müssen Sitzungs-IDs, Transkript-JSONL oder Felder in `sessions.json` debuggen
    - Sie ändern das Verhalten der automatischen Compaction oder fügen „Vor-Compaction“-Housekeeping hinzu
    - Sie möchten Memory-Flushing oder stille System-Turns implementieren
summary: 'Detaillierter Einblick: Sitzungsspeicher + Transkripte, Lebenszyklus und Interna von (automatischer) Compaction'
title: Detaillierter Einblick in die Sitzungsverwaltung
x-i18n:
    generated_at: "2026-04-06T03:12:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0d8c2d30be773eac0424f7a4419ab055fdd50daac8bc654e7d250c891f2c3b8
    source_path: reference/session-management-compaction.md
    workflow: 15
---

# Sitzungsverwaltung und Compaction (detaillierter Einblick)

Dieses Dokument erklärt, wie OpenClaw Sitzungen Ende zu Ende verwaltet:

- **Sitzungsrouting** (wie eingehende Nachrichten einer `sessionKey` zugeordnet werden)
- **Sitzungsspeicher** (`sessions.json`) und was er verfolgt
- **Persistenz von Transkripten** (`*.jsonl`) und ihre Struktur
- **Transkript-Hygiene** (providerspezifische Korrekturen vor Läufen)
- **Kontextgrenzen** (Kontextfenster vs. verfolgte Token)
- **Compaction** (manuelle + automatische Compaction) und wo Arbeiten vor der Compaction eingehängt werden können
- **Stilles Housekeeping** (z. B. Memory-Schreibvorgänge, die keine für Benutzer sichtbare Ausgabe erzeugen sollen)

Wenn Sie zuerst einen Überblick auf höherer Ebene möchten, beginnen Sie mit:

- [/concepts/session](/de/concepts/session)
- [/concepts/compaction](/de/concepts/compaction)
- [/concepts/memory](/de/concepts/memory)
- [/concepts/memory-search](/de/concepts/memory-search)
- [/concepts/session-pruning](/de/concepts/session-pruning)
- [/reference/transcript-hygiene](/de/reference/transcript-hygiene)

---

## Quelle der Wahrheit: das Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum entworfen, der den Sitzungszustand besitzt.

- UIs (macOS-App, Web-Control-UI, TUI) sollten das Gateway nach Sitzungslisten und Token-Anzahlen abfragen.
- Im Remote-Modus liegen die Sitzungsdateien auf dem Remote-Host; „die lokalen Dateien auf Ihrem Mac zu prüfen“ spiegelt nicht wider, was das Gateway verwendet.

---

## Zwei Persistenzebenen

OpenClaw speichert Sitzungen in zwei Ebenen:

1. **Sitzungsspeicher (`sessions.json`)**
   - Schlüssel/Wert-Map: `sessionKey -> SessionEntry`
   - Klein, veränderbar, sicher zu bearbeiten (oder Einträge zu löschen)
   - Verfolgt Sitzungsmetadaten (aktuelle Sitzungs-ID, letzte Aktivität, Umschalter, Token-Zähler usw.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Nur anhängbares Transkript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Unterhaltung + Tool-Calls + Compaction-Zusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Turns neu aufzubauen

---

## Speicherorte auf dem Datenträger

Pro Agent auf dem Gateway-Host:

- Speicher: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkripte: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Topic-Sitzungen: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Speicherwartung und Festplattenkontrollen

Die Sitzungspersistenz verfügt über automatische Wartungssteuerungen (`session.maintenance`) für `sessions.json` und Transkriptartefakte:

- `mode`: `warn` (Standard) oder `enforce`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: Obergrenze für Einträge in `sessions.json` (Standard `500`)
- `rotateBytes`: rotiert `sessions.json`, wenn sie zu groß ist (Standard `10mb`)
- `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive (Standard: identisch mit `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Sitzungsverzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Reihenfolge der Durchsetzung bei der Bereinigung des Festplattenbudgets (`mode: "enforce"`):

1. Zuerst die ältesten archivierten oder verwaisten Transkriptartefakte entfernen.
2. Wenn weiterhin über dem Ziel, die ältesten Sitzungseinträge und ihre Transkriptdateien auswerfen.
3. Fortfahren, bis die Nutzung bei oder unter `highWaterBytes` liegt.

Im `mode: "warn"` meldet OpenClaw mögliche Auswürfe, verändert den Speicher/die Dateien aber nicht.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sitzungen und Ausführungsprotokolle

Isolierte Cron-Läufe erzeugen ebenfalls Sitzungseinträge/Transkripte, und dafür gibt es eigene Aufbewahrungssteuerungen:

- `cron.sessionRetention` (Standard `24h`) entfernt alte isolierte Cron-Laufsitzungen aus dem Sitzungsspeicher (`false` deaktiviert dies).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` beschneiden `~/.openclaw/cron/runs/<jobId>.jsonl`-Dateien (Standard: `2_000_000` Bytes und `2000` Zeilen).

---

## Sitzungsschlüssel (`sessionKey`)

Ein `sessionKey` identifiziert, _in welchem Gesprächs-Bucket_ Sie sich befinden (Routing + Isolierung).

Häufige Muster:

- Haupt-/direkter Chat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (sofern nicht überschrieben)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Sitzungs-IDs (`sessionId`)

Jeder `sessionKey` zeigt auf eine aktuelle `sessionId` (die Transkriptdatei, die das Gespräch fortsetzt).

Faustregeln:

- **Reset** (`/new`, `/reset`) erzeugt eine neue `sessionId` für diesen `sessionKey`.
- **Täglicher Reset** (standardmäßig 4:00 Uhr Ortszeit auf dem Gateway-Host) erzeugt bei der nächsten Nachricht nach der Reset-Grenze eine neue `sessionId`.
- **Leerlaufablauf** (`session.reset.idleMinutes` oder älteres `session.idleMinutes`) erzeugt eine neue `sessionId`, wenn nach dem Leerlauffenster eine Nachricht eingeht. Wenn täglich + Leerlauf beide konfiguriert sind, gewinnt der zuerst ablaufende.
- **Thread-Parent-Fork-Guard** (`session.parentForkMaxTokens`, Standard `100000`) überspringt das Forken des Parent-Transkripts, wenn die Parent-Sitzung bereits zu groß ist; der neue Thread startet frisch. Setzen Sie `0`, um dies zu deaktivieren.

Implementierungsdetail: Die Entscheidung erfolgt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema des Sitzungsspeichers (`sessions.json`)

Der Werttyp des Speichers ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID (der Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `updatedAt`: Zeitstempel der letzten Aktivität
- `sessionFile`: optionales explizites Override des Transkriptpfads
- `chatType`: `direct | group | room` (hilft UIs und der Send-Richtlinie)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Channel-Beschriftung
- Umschalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (Override pro Sitzung)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (Best-Effort / providerabhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft die automatische Compaction für diesen Sitzungsschlüssel abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel für das letzte Memory-Flushing vor der Compaction
- `memoryFlushCompactionCount`: Compaction-Anzahl, bei der das letzte Flushing ausgeführt wurde

Der Speicher kann sicher bearbeitet werden, aber das Gateway ist die Autorität: Es kann Einträge umschreiben oder neu hydratisieren, während Sitzungen laufen.

---

## Transkriptstruktur (`*.jsonl`)

Transkripte werden vom `SessionManager` aus `@mariozechner/pi-coding-agent` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Sitzungs-Header (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Sitzungseinträge mit `id` + `parentId` (Baum)

Bemerkenswerte Eintragstypen:

- `message`: Benutzer-/Assistent-/toolResult-Nachrichten
- `custom_message`: von Erweiterungen injizierte Nachrichten, die _in den Modellkontext eingehen_ (können in der UI verborgen sein)
- `custom`: Erweiterungszustand, der _nicht_ in den Modellkontext eingeht
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren eines Baumzweigs

OpenClaw „korrigiert“ Transkripte absichtlich **nicht**; das Gateway verwendet `SessionManager`, um sie zu lesen/schreiben.

---

## Kontextfenster vs. verfolgte Token

Zwei unterschiedliche Konzepte sind wichtig:

1. **Kontextfenster des Modells**: harte Obergrenze pro Modell (für das Modell sichtbare Token)
2. **Zähler im Sitzungsspeicher**: rollierende Statistiken, die in `sessions.json` geschrieben werden (für /status und Dashboards verwendet)

Wenn Sie Grenzwerte anpassen:

- Das Kontextfenster stammt aus dem Modellkatalog (und kann per Konfiguration überschrieben werden).
- `contextTokens` im Speicher ist ein Laufzeitschätzwert/-berichtswert; behandeln Sie ihn nicht als strikte Garantie.

Mehr dazu unter [/token-use](/de/reference/token-use).

---

## Compaction: was sie ist

Compaction fasst ältere Unterhaltungen in einem persistenten `compaction`-Eintrag im Transkript zusammen und hält aktuelle Nachrichten intakt.

Nach der Compaction sehen zukünftige Turns:

- Die Compaction-Zusammenfassung
- Nachrichten nach `firstKeptEntryId`

Compaction ist **persistent** (anders als Session Pruning). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Chunk-Grenzen bei der Compaction und Tool-Pairing

Wenn OpenClaw ein langes Transkript in Compaction-Chunks aufteilt, hält es
Tool-Calls des Assistenten mit den passenden `toolResult`-Einträgen gepaart.

- Wenn die tokenanteilige Aufteilung zwischen einem Tool-Call und seinem Ergebnis landet, verschiebt OpenClaw
  die Grenze zur Assistenten-Nachricht mit dem Tool-Call, anstatt
  das Paar zu trennen.
- Wenn ein nachlaufender Tool-Result-Block den Chunk sonst über das Ziel hinausschieben würde,
  behält OpenClaw diesen ausstehenden Tool-Block bei und lässt den nicht zusammengefassten Tail
  intakt.
- Abgebrochene/fehlerhafte Tool-Call-Blöcke halten eine ausstehende Aufteilung nicht offen.

---

## Wann automatische Compaction stattfindet (Pi-Runtime)

Im eingebetteten Pi-Agenten wird automatische Compaction in zwei Fällen ausgelöst:

1. **Overflow-Wiederherstellung**: Das Modell gibt einen Kontext-Overflow-Fehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche providerspezifische Varianten) → compact → retry.
2. **Schwellenwert-Wartung**: nach einem erfolgreichen Turn, wenn:

`contextTokens > contextWindow - reserveTokens`

Dabei gilt:

- `contextWindow` ist das Kontextfenster des Modells
- `reserveTokens` ist die Reserve für Prompts + die nächste Modellausgabe

Dies ist Semantik der Pi-Runtime (OpenClaw konsumiert die Ereignisse, aber Pi entscheidet, wann kompaktiert wird).

---

## Compaction-Einstellungen (`reserveTokens`, `keepRecentTokens`)

Die Compaction-Einstellungen von Pi befinden sich in den Pi-Einstellungen:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw erzwingt außerdem eine Sicherheitsuntergrenze für eingebettete Läufe:

- Wenn `compaction.reserveTokens < reserveTokensFloor`, erhöht OpenClaw diesen Wert.
- Die Standarduntergrenze beträgt `20000` Token.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn er bereits höher ist, lässt OpenClaw ihn unverändert.

Warum: genügend Spielraum für mehrturniges „Housekeeping“ (wie Memory-Schreibvorgänge) lassen, bevor Compaction unvermeidlich wird.

Implementierung: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aufgerufen von `src/agents/pi-embedded-runner.ts`).

---

## Für Benutzer sichtbare Oberflächen

Sie können Compaction und Sitzungszustand beobachten über:

- `/status` (in jeder Chat-Sitzung)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Verbose-Modus: `🧹 Auto-compaction complete` + Compaction-Anzahl

---

## Stilles Housekeeping (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen der Benutzer keine Zwischenausgabe sehen soll.

Konvention:

- Der Assistent beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` /
  `no_reply`, um „keine Antwort an den Benutzer zustellen“ anzuzeigen.
- OpenClaw entfernt/unterdrückt dies in der Zustellungsschicht.
- Die Unterdrückung des exakten stillen Tokens ist nicht case-sensitiv, sodass `NO_REPLY` und
  `no_reply` beide zählen, wenn die gesamte Payload nur aus dem stillen Token besteht.
- Dies ist nur für echte Hintergrund-/Nicht-Zustellungs-Turns gedacht; es ist keine Abkürzung für
  gewöhnliche umsetzbare Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw außerdem **Entwurf-/Typing-Streaming**, wenn ein
partieller Chunk mit `NO_REPLY` beginnt, sodass stille Operationen mitten im Turn keine partielle
Ausgabe preisgeben.

---

## „Memory Flush“ vor der Compaction (implementiert)

Ziel: bevor automatische Compaction stattfindet, einen stillen agentischen Turn ausführen, der dauerhaften
Zustand auf die Festplatte schreibt (z. B. `memory/YYYY-MM-DD.md` im Agent-Workspace), damit Compaction keinen
kritischen Kontext löschen kann.

OpenClaw verwendet den Ansatz **Flushing vor dem Schwellenwert**:

1. Nutzung des Sitzungskontexts überwachen.
2. Wenn sie einen „weichen Schwellenwert“ überschreitet (unterhalb des Compaction-Schwellenwerts von Pi), einen stillen
   „Memory jetzt schreiben“-Befehl an den Agenten ausführen.
3. Das exakte stille Token `NO_REPLY` / `no_reply` verwenden, damit der Benutzer
   nichts sieht.

Konfiguration (`agents.defaults.compaction.memoryFlush`):

- `enabled` (Standard: `true`)
- `softThresholdTokens` (Standard: `4000`)
- `prompt` (Benutzernachricht für den Flush-Turn)
- `systemPrompt` (zusätzlicher System-Prompt, der für den Flush-Turn angehängt wird)

Hinweise:

- Der Standard-Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis, um
  die Zustellung zu unterdrücken.
- Das Flushing läuft einmal pro Compaction-Zyklus (verfolgt in `sessions.json`).
- Das Flushing läuft nur für eingebettete Pi-Sitzungen.
- Das Flushing wird übersprungen, wenn der Sitzungs-Workspace schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Memory](/de/concepts/memory) für das Dateilayout und die Schreibmuster des Workspace.

Pi stellt in der Erweiterungs-API auch einen Hook `session_before_compact` bereit, aber die
Flush-Logik von OpenClaw lebt heute auf der Gateway-Seite.

---

## Checkliste zur Fehlerbehebung

- Falscher Sitzungsschlüssel? Beginnen Sie mit [/concepts/session](/de/concepts/session) und bestätigen Sie den `sessionKey` in `/status`.
- Abweichung zwischen Speicher und Transkript? Bestätigen Sie den Gateway-Host und den Speicherpfad aus `openclaw status`.
- Compaction-Spam? Prüfen Sie:
  - Kontextfenster des Modells (zu klein)
  - Compaction-Einstellungen (`reserveTokens` zu hoch für das Modellfenster kann frühere Compaction verursachen)
  - Aufblähung durch Tool-Resultate: Session Pruning aktivieren/anpassen
- Stille Turns lecken? Bestätigen Sie, dass die Antwort mit `NO_REPLY` beginnt (nicht case-sensitives exaktes Token) und dass Sie einen Build mit dem Fix zur Streaming-Unterdrückung verwenden.
