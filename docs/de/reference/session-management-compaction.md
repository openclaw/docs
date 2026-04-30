---
read_when:
    - Sie müssen Sitzungs-IDs, Transkript-JSONL oder Felder in sessions.json debuggen
    - Sie ändern das Auto-Compaction-Verhalten oder fügen „Pre-Compaction“-Housekeeping hinzu
    - Sie möchten Speicherleerungen oder stille Systemdurchläufe implementieren
summary: 'Tiefgehender Einblick: Sitzungsspeicher + Transkripte, Lebenszyklus und Interna der (automatischen) Compaction'
title: Vertiefung zur Sitzungsverwaltung
x-i18n:
    generated_at: "2026-04-30T07:13:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1e9785723ebf9b5411440a8f3b2885a50d659f669811ba749c431a2b3aeed700
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw verwaltet Sitzungen durchgängig über diese Bereiche hinweg:

- **Sitzungsrouting** (wie eingehende Nachrichten einer `sessionKey` zugeordnet werden)
- **Sitzungsspeicher** (`sessions.json`) und was er nachverfolgt
- **Transkriptpersistenz** (`*.jsonl`) und ihre Struktur
- **Transkripthygiene** (Provider-spezifische Korrekturen vor Läufen)
- **Kontextlimits** (Kontextfenster im Vergleich zu nachverfolgten Tokens)
- **Compaction** (manuelle und automatische Compaction) und wo Vorarbeiten vor der Compaction eingehängt werden
- **Stille Verwaltung** (Speicherschreibvorgänge, die keine für Benutzer sichtbare Ausgabe erzeugen sollten)

Wenn Sie zuerst einen übergeordneten Überblick möchten, beginnen Sie mit:

- [Sitzungsverwaltung](/de/concepts/session)
- [Compaction](/de/concepts/compaction)
- [Speicherübersicht](/de/concepts/memory)
- [Speichersuche](/de/concepts/memory-search)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Transkripthygiene](/de/reference/transcript-hygiene)

---

## Verlässliche Quelle: der Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum konzipiert, der den Sitzungszustand besitzt.

- UIs (macOS-App, Web-Control-UI, TUI) sollten den Gateway nach Sitzungslisten und Token-Zahlen abfragen.
- Im Remote-Modus liegen Sitzungsdateien auf dem Remote-Host; „Ihre lokalen Mac-Dateien zu prüfen“ spiegelt nicht wider, was der Gateway verwendet.

---

## Zwei Persistenzschichten

OpenClaw persistiert Sitzungen in zwei Schichten:

1. **Sitzungsspeicher (`sessions.json`)**
   - Schlüssel/Wert-Zuordnung: `sessionKey -> SessionEntry`
   - Klein, veränderbar, sicher zu bearbeiten (oder Einträge zu löschen)
   - Verfolgt Sitzungsmetadaten (aktuelle Sitzungs-ID, letzte Aktivität, Umschalter, Token-Zähler usw.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Nur anhängbares Transkript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die tatsächliche Unterhaltung + Tool-Aufrufe + Compaction-Zusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Züge neu aufzubauen
   - Große Debug-Prüfpunkte vor der Compaction werden übersprungen, sobald das aktive
     Transkript die Größenobergrenze für Prüfpunkte überschreitet, wodurch eine zweite riesige
     `.checkpoint.*.jsonl`-Kopie vermieden wird.

---

## Speicherorte auf der Festplatte

Pro Agent auf dem Gateway-Host:

- Speicher: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkripte: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Themensitzungen: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Speicherwartung und Datenträgersteuerung

Die Sitzungspersistenz verfügt über automatische Wartungssteuerungen (`session.maintenance`) für `sessions.json`, Transkriptartefakte und Trajectory-Sidecars:

- `mode`: `warn` (Standard) oder `enforce`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: Obergrenze für Einträge in `sessions.json` (Standard `500`)
- `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive (Standard: wie `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Sitzungsverzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Normale Gateway-Schreibvorgänge bündeln die `maxEntries`-Bereinigung für produktionsgroße Obergrenzen, sodass ein Speicher die konfigurierte Obergrenze kurzzeitig überschreiten kann, bevor die nächste High-Water-Bereinigung ihn wieder herunter schreibt. `openclaw sessions cleanup --enforce` wendet die konfigurierte Obergrenze weiterhin sofort an.

OpenClaw erstellt bei Gateway-Schreibvorgängen keine automatischen `sessions.json.bak.*`-Rotationssicherungen mehr. Der ältere Schlüssel `session.maintenance.rotateBytes` wird ignoriert, und `openclaw doctor --fix` entfernt ihn aus älteren Konfigurationen.

Durchsetzungsreihenfolge für die Bereinigung des Datenträgerbudgets (`mode: "enforce"`):

1. Entfernen Sie zuerst die ältesten archivierten, verwaisten Transkript- oder verwaisten Trajectory-Artefakte.
2. Wenn weiterhin mehr als das Ziel belegt ist, entfernen Sie die ältesten Sitzungseinträge und deren Transkript-/Trajectory-Dateien.
3. Fahren Sie fort, bis die Nutzung bei oder unter `highWaterBytes` liegt.

In `mode: "warn"` meldet OpenClaw potenzielle Entfernungen, verändert den Speicher/die Dateien aber nicht.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sitzungen und Laufprotokolle

Isolierte Cron-Läufe erstellen ebenfalls Sitzungseinträge/Transkripte und verfügen über eigene Aufbewahrungssteuerungen:

- `cron.sessionRetention` (Standard `24h`) entfernt alte isolierte Cron-Laufsitzungen aus dem Sitzungsspeicher (`false` deaktiviert dies).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`-Dateien (Standards: `2_000_000` Byte und `2000` Zeilen).

Wenn Cron eine neue isolierte Laufsitzung erzwungen erstellt, bereinigt es den vorherigen
`cron:<jobId>`-Sitzungseintrag, bevor die neue Zeile geschrieben wird. Sichere
Präferenzen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und explizite
vom Benutzer ausgewählte Modell-/Auth-Overrides werden übernommen. Umgebender Unterhaltungskontext wie
Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Elevation, Ursprung und ACP-
Runtime-Bindung wird verworfen, damit ein frischer isolierter Lauf keine veraltete Zustellungs- oder
Runtime-Autorität aus einem älteren Lauf übernehmen kann.

---

## Sitzungsschlüssel (`sessionKey`)

Ein `sessionKey` identifiziert, _in welchem Unterhaltungsbereich_ Sie sich befinden (Routing + Isolation).

Gängige Muster:

- Haupt-/Direktchat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (sofern nicht überschrieben)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Sitzungs-IDs (`sessionId`)

Jeder `sessionKey` verweist auf eine aktuelle `sessionId` (die Transkriptdatei, die die Unterhaltung fortsetzt).

Faustregeln:

- **Zurücksetzen** (`/new`, `/reset`) erstellt eine neue `sessionId` für diesen `sessionKey`.
- **Tägliches Zurücksetzen** (standardmäßig 4:00 Uhr lokale Zeit auf dem Gateway-Host) erstellt bei der nächsten Nachricht nach der Reset-Grenze eine neue `sessionId`.
- **Leerlaufablauf** (`session.reset.idleMinutes` oder älter `session.idleMinutes`) erstellt eine neue `sessionId`, wenn nach dem Leerlauffenster eine Nachricht eintrifft. Wenn täglich + Leerlauf beide konfiguriert sind, gilt das zuerst ablaufende Limit.
- **Systemereignisse** (Heartbeat, Cron-Aufweckvorgänge, Exec-Benachrichtigungen, Gateway-Buchhaltung) können die Sitzungszeile verändern, verlängern aber nicht die Aktualität für tägliches/Leerlauf-Zurücksetzen. Der Reset-Rollover verwirft Systemereignis-Hinweise in der Warteschlange für die vorherige Sitzung, bevor der frische Prompt erstellt wird.
- **Thread-Parent-Fork-Schutz** (`session.parentForkMaxTokens`, Standard `100000`) überspringt das Forken des übergeordneten Transkripts, wenn die übergeordnete Sitzung bereits zu groß ist; der neue Thread startet frisch. Setzen Sie `0`, um dies zu deaktivieren.

Implementierungsdetail: Die Entscheidung erfolgt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema des Sitzungsspeichers (`sessions.json`)

Der Werttyp des Speichers ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID (der Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `sessionStartedAt`: Startzeitstempel für die aktuelle `sessionId`; tägliche Reset-
  Aktualität verwendet diesen Wert. Ältere Zeilen können ihn aus dem JSONL-Sitzungsheader ableiten.
- `lastInteractionAt`: Zeitstempel der letzten echten Benutzer-/Kanalinteraktion; Leerlauf-Reset-
  Aktualität verwendet diesen Wert, sodass Heartbeat-, Cron- und Exec-Ereignisse Sitzungen nicht
  am Leben halten. Ältere Zeilen ohne dieses Feld fallen für die Leerlauf-Aktualität auf die wiederhergestellte Sitzungsstartzeit
  zurück.
- `updatedAt`: Zeitstempel der letzten Speicherzeilenmutation, verwendet für Auflistung, Bereinigung und
  Buchhaltung. Er ist nicht die maßgebliche Quelle für die Aktualität von täglichem/Leerlauf-Reset.
- `sessionFile`: optionale explizite Überschreibung des Transkriptpfads
- `chatType`: `direct | group | room` (hilft UIs und Senderichtlinie)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Kanallabels
- Umschalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (sitzungsspezifische Überschreibung)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (Best-Effort / Provider-abhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft automatische Compaction für diesen Sitzungsschlüssel abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel für den letzten Speicher-Flush vor der Compaction
- `memoryFlushCompactionCount`: Compaction-Anzahl, als der letzte Flush lief

Der Speicher kann sicher bearbeitet werden, aber der Gateway ist maßgeblich: Er kann Einträge neu schreiben oder rehydrieren, während Sitzungen laufen.

---

## Transkriptstruktur (`*.jsonl`)

Transkripte werden vom `SessionManager` von `@mariozechner/pi-coding-agent` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Sitzungsheader (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Sitzungseinträge mit `id` + `parentId` (Baum)

Wichtige Eintragstypen:

- `message`: Benutzer-/Assistant-/`toolResult`-Nachrichten
- `custom_message`: von Erweiterungen injizierte Nachrichten, die _in_ den Modellkontext eingehen (können in der UI ausgeblendet sein)
- `custom`: Erweiterungszustand, der _nicht_ in den Modellkontext eingeht
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren in einem Baumzweig

OpenClaw nimmt absichtlich keine „Korrekturen“ an Transkripten vor; der Gateway verwendet `SessionManager`, um sie zu lesen/schreiben.

---

## Kontextfenster im Vergleich zu nachverfolgten Tokens

Zwei unterschiedliche Konzepte sind wichtig:

1. **Modellkontextfenster**: harte Obergrenze pro Modell (Tokens, die für das Modell sichtbar sind)
2. **Zähler im Sitzungsspeicher**: fortlaufende Statistiken, die in `sessions.json` geschrieben werden (für /status und Dashboards verwendet)

Wenn Sie Limits abstimmen:

- Das Kontextfenster stammt aus dem Modellkatalog (und kann über die Konfiguration überschrieben werden).
- `contextTokens` im Speicher ist ein Laufzeit-Schätz-/Berichtswert; behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen finden Sie unter [/token-use](/de/reference/token-use).

---

## Compaction: was es ist

Compaction fasst ältere Unterhaltung in einem persistierten `compaction`-Eintrag im Transkript zusammen und lässt aktuelle Nachrichten unverändert.

Nach der Compaction sehen zukünftige Züge:

- Die Compaction-Zusammenfassung
- Nachrichten nach `firstKeptEntryId`

Compaction ist **persistent** (anders als die Sitzungsbereinigung). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Compaction-Chunk-Grenzen und Tool-Kopplung

Wenn OpenClaw ein langes Transkript in Compaction-Chunks aufteilt, hält es
Assistant-Tool-Aufrufe mit den passenden `toolResult`-Einträgen gekoppelt.

- Wenn die Token-Anteil-Aufteilung zwischen einem Tool-Aufruf und seinem Ergebnis landet, verschiebt OpenClaw
  die Grenze zur Assistant-Tool-Aufrufnachricht, statt das Paar zu trennen.
- Wenn ein nachlaufender Tool-Ergebnisblock den Chunk sonst über das Ziel hinaus schieben würde,
  bewahrt OpenClaw diesen ausstehenden Tool-Block und lässt das nicht zusammengefasste Ende
  intakt.
- Abgebrochene/fehlerhafte Tool-Aufrufblöcke halten keine ausstehende Aufteilung offen.

---

## Wann automatische Compaction erfolgt (Pi-Runtime)

Im eingebetteten Pi-Agent wird automatische Compaction in zwei Fällen ausgelöst:

1. **Überlaufwiederherstellung**: Das Modell gibt einen Kontextüberlauffehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche Provider-geprägte Varianten) → compact → retry.
2. **Schwellwert-Wartung**: nach einem erfolgreichen Zug, wenn:

`contextTokens > contextWindow - reserveTokens`

Dabei gilt:

- `contextWindow` ist das Kontextfenster des Modells
- `reserveTokens` ist der reservierte Spielraum für Prompts + die nächste Modellausgabe

Dies sind Pi-Runtime-Semantiken (OpenClaw nutzt die Ereignisse, aber Pi entscheidet, wann eine Compaction durchgeführt wird).

OpenClaw kann außerdem vor dem Öffnen des nächsten Laufs eine lokale Preflight-Compaction auslösen,
wenn `agents.defaults.compaction.maxActiveTranscriptBytes` gesetzt ist und die
aktive Transkriptdatei diese Größe erreicht. Dies ist ein Dateigrößenschutz für lokale
Wiederöffnungskosten, keine reine Archivierung: OpenClaw führt weiterhin normale semantische Compaction aus,
und sie erfordert `truncateAfterCompaction`, damit die komprimierte Zusammenfassung zu einem
neuen Nachfolge-Transkript werden kann.

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

OpenClaw erzwingt außerdem eine Sicherheitsuntergrenze für eingebettete Ausführungen:

- Wenn `compaction.reserveTokens < reserveTokensFloor` gilt, hebt OpenClaw den Wert an.
- Die Standarduntergrenze beträgt `20000` Tokens.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn der Wert bereits höher ist, lässt OpenClaw ihn unverändert.
- Manuelles `/compact` berücksichtigt ein explizites `agents.defaults.compaction.keepRecentTokens`
  und behält Pis Schnittpunkt für das aktuelle Ende bei. Ohne explizites Behaltebudget
  bleibt manuelle Compaction ein harter Checkpoint, und der neu aufgebaute Kontext beginnt mit
  der neuen Zusammenfassung.
- Setzen Sie `agents.defaults.compaction.maxActiveTranscriptBytes` auf einen Byte-Wert oder
  eine Zeichenfolge wie `"20mb"`, um lokale Compaction vor einem Turn auszuführen, wenn das aktive
  Transkript groß wird. Dieser Schutz ist nur aktiv, wenn
  `truncateAfterCompaction` ebenfalls aktiviert ist. Lassen Sie den Wert ungesetzt oder setzen Sie ihn auf `0`, um
  ihn zu deaktivieren.
- Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist,
  rotiert OpenClaw das aktive Transkript nach der Compaction in eine komprimierte Nachfolger-JSONL.
  Das alte vollständige Transkript bleibt archiviert und wird vom
  Compaction-Checkpoint verlinkt, statt direkt überschrieben zu werden.

Warum: Es bleibt genug Spielraum für mehrteilige „Housekeeping“-Aufgaben (wie Speicher-Schreibvorgänge), bevor Compaction unvermeidbar wird.

Implementierung: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aufgerufen aus `src/agents/pi-embedded-runner.ts`).

---

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen Compaction-Provider registrieren. Wenn `agents.defaults.compaction.provider` auf eine registrierte Provider-ID gesetzt ist, delegiert die Schutz-Erweiterung die Zusammenfassung an diesen Provider statt an die integrierte `summarizeInStages`-Pipeline.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Für die standardmäßige LLM-Zusammenfassung ungesetzt lassen.
- Das Setzen eines `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Kennungen wie der integrierte Pfad.
- Der Schutz erhält nach der Provider-Ausgabe weiterhin Kontext aus aktuellen Turns und Split-Turn-Suffixen.
- Die integrierte Schutz-Zusammenfassung destilliert frühere Zusammenfassungen mit neuen Nachrichten erneut,
  statt die vollständige vorherige Zusammenfassung wortgetreu beizubehalten.
- Der Schutzmodus aktiviert Qualitätsprüfungen für Zusammenfassungen standardmäßig; setzen Sie
  `qualityGuard.enabled: false`, um das Wiederholen bei fehlerhaft formatierter Ausgabe zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw automatisch auf die integrierte LLM-Zusammenfassung zurück.
- Abbruch-/Timeout-Signale werden erneut ausgelöst (nicht verschluckt), um die Abbruchanforderung des Aufrufers zu respektieren.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Für Benutzer sichtbare Oberflächen

Sie können Compaction und Sitzungsstatus beobachten über:

- `/status` (in jeder Chat-Sitzung)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ausführlicher Modus: `🧹 Auto-Compaction abgeschlossen` + Compaction-Anzahl

---

## Stilles Housekeeping (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen Benutzer keine Zwischenausgabe sehen sollen.

Konvention:

- Der Assistent beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` /
  `no_reply`, um anzuzeigen: „keine Antwort an den Benutzer ausliefern“.
- OpenClaw entfernt/unterdrückt dies in der Auslieferungsschicht.
- Die Unterdrückung des exakten stillen Tokens ist nicht zwischen Groß- und Kleinschreibung unterscheidend, daher zählen `NO_REPLY` und
  `no_reply` beide, wenn die gesamte Nutzlast nur aus dem stillen Token besteht.
- Dies ist nur für echte Hintergrund-Turns ohne Auslieferung gedacht; es ist keine Abkürzung für
  normale umsetzbare Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw außerdem **Entwurfs-/Tipp-Streaming**, wenn ein
Teil-Chunk mit `NO_REPLY` beginnt, sodass stille Vorgänge keine Teilausgabe
mitten im Turn preisgeben.

---

## „Memory Flush“ vor der Compaction (implementiert)

Ziel: Bevor Auto-Compaction erfolgt, einen stillen agentischen Turn ausführen, der dauerhaften
Zustand auf die Festplatte schreibt (z. B. `memory/YYYY-MM-DD.md` im Agent-Arbeitsbereich), damit Compaction
kritischen Kontext nicht löschen kann.

OpenClaw verwendet den Ansatz **Flush vor dem Schwellenwert**:

1. Kontextnutzung der Sitzung überwachen.
2. Wenn sie einen „weichen Schwellenwert“ überschreitet (unterhalb von Pis Compaction-Schwelle), eine stille
   „Speicher jetzt schreiben“-Anweisung an den Agenten ausführen.
3. Das exakte stille Token `NO_REPLY` / `no_reply` verwenden, damit Benutzer
   nichts sehen.

Konfiguration (`agents.defaults.compaction.memoryFlush`):

- `enabled` (Standard: `true`)
- `model` (optionale exakte Provider-/Modell-Überschreibung für den Flush-Turn, zum Beispiel `ollama/qwen3:8b`)
- `softThresholdTokens` (Standard: `4000`)
- `prompt` (Benutzernachricht für den Flush-Turn)
- `systemPrompt` (zusätzlicher System-Prompt, der für den Flush-Turn angehängt wird)

Hinweise:

- Der Standard-Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis, um
  die Auslieferung zu unterdrücken.
- Wenn `model` gesetzt ist, verwendet der Flush-Turn dieses Modell, ohne die
  Fallback-Kette der aktiven Sitzung zu übernehmen, sodass lokales Housekeeping nicht stillschweigend
  auf ein kostenpflichtiges Konversationsmodell zurückfällt.
- Der Flush wird einmal pro Compaction-Zyklus ausgeführt (nachverfolgt in `sessions.json`).
- Der Flush wird nur für eingebettete Pi-Sitzungen ausgeführt (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Sitzungsarbeitsbereich schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Memory](/de/concepts/memory) für das Dateilayout des Arbeitsbereichs und Schreibmuster.

Pi stellt außerdem einen `session_before_compact`-Hook in der Erweiterungs-API bereit, aber OpenClaws
Flush-Logik befindet sich derzeit auf der Gateway-Seite.

---

## Checkliste zur Fehlerbehebung

- Sitzungsschlüssel falsch? Beginnen Sie mit [/concepts/session](/de/concepts/session) und bestätigen Sie den `sessionKey` in `/status`.
- Store und Transkript stimmen nicht überein? Bestätigen Sie den Gateway-Host und den Store-Pfad aus `openclaw status`.
- Compaction-Spam? Prüfen Sie:
  - Kontextfenster des Modells (zu klein)
  - Compaction-Einstellungen (`reserveTokens` zu hoch für das Modellfenster kann frühere Compaction verursachen)
  - Aufblähung durch Tool-Ergebnisse: Sitzungsbereinigung aktivieren/anpassen
- Stille Turns werden sichtbar? Bestätigen Sie, dass die Antwort mit `NO_REPLY` beginnt (exaktes Token, Groß-/Kleinschreibung egal) und dass Sie einen Build verwenden, der die Streaming-Unterdrückungskorrektur enthält.

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Kontext-Engine](/de/concepts/context-engine)
