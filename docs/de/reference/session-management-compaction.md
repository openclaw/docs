---
read_when:
    - Sie müssen Sitzungs-IDs, Transkript-JSONL oder Felder in sessions.json debuggen
    - Sie ändern das Auto-Compaction-Verhalten oder fügen "Pre-Compaction"-Aufräumarbeiten hinzu
    - Sie möchten Speicherleerungen oder stille Systemdurchläufe implementieren
summary: 'Tiefgehende Betrachtung: Sitzungsspeicher + Transkripte, Lebenszyklus und Interna der (automatischen) Compaction'
title: Vertiefung zur Sitzungsverwaltung
x-i18n:
    generated_at: "2026-05-11T20:36:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4ed30f6b1943b2ed5808c5ccdd593e6899e10fb7f75ff5911e6a9623a30ed6be
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw verwaltet Sitzungen Ende-zu-Ende über diese Bereiche hinweg:

- **Sitzungs-Routing** (wie eingehende Nachrichten einer `sessionKey` zugeordnet werden)
- **Session Store** (`sessions.json`) und was er erfasst
- **Transkript-Persistenz** (`*.jsonl`) und ihre Struktur
- **Transkript-Hygiene** (Provider-spezifische Korrekturen vor Läufen)
- **Kontextlimits** (Kontextfenster im Vergleich zu erfassten Token)
- **Compaction** (manuelle und automatische Compaction) und wo Sie Arbeit vor der Compaction einhängen
- **Stille Wartungsarbeiten** (Speicherschreibvorgänge, die keine für Benutzer sichtbare Ausgabe erzeugen sollten)

Wenn Sie zuerst einen Überblick auf höherer Ebene wünschen, beginnen Sie mit:

- [Sitzungsverwaltung](/de/concepts/session)
- [Compaction](/de/concepts/compaction)
- [Speicherübersicht](/de/concepts/memory)
- [Speichersuche](/de/concepts/memory-search)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Transkript-Hygiene](/de/reference/transcript-hygiene)

---

## Maßgebliche Quelle: der Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum konzipiert, der den Sitzungszustand besitzt.

- UIs (macOS-App, Web Control UI, TUI) sollten den Gateway nach Sitzungslisten und Token-Zählungen abfragen.
- Im Remote-Modus befinden sich Sitzungsdateien auf dem Remote-Host; „Ihre lokalen Mac-Dateien zu prüfen“ spiegelt nicht wider, was der Gateway verwendet.

---

## Zwei Persistenzschichten

OpenClaw persistiert Sitzungen in zwei Schichten:

1. **Session Store (`sessions.json`)**
   - Schlüssel/Wert-Zuordnung: `sessionKey -> SessionEntry`
   - Klein, veränderbar, sicher zu bearbeiten (oder Einträge zu löschen)
   - Erfasst Sitzungsmetadaten (aktuelle Sitzungs-ID, letzte Aktivität, Umschalter, Token-Zähler usw.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Append-only-Transkript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Unterhaltung + Tool-Aufrufe + Compaction-Zusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Turns neu aufzubauen
   - Große Debug-Prüfpunkte vor der Compaction werden übersprungen, sobald das aktive
     Transkript die Größenobergrenze für Prüfpunkte überschreitet, wodurch eine zweite riesige
     `.checkpoint.*.jsonl`-Kopie vermieden wird.

Gateway-History-Reader sollten vermeiden, das gesamte Transkript zu materialisieren, außer
die Oberfläche benötigt ausdrücklich beliebigen Zugriff auf die Historie. First-Page-History,
eingebettete Chat-History, Wiederherstellung nach Neustart und Token-/Nutzungsprüfungen verwenden begrenzte Tail-
Reads. Vollständige Transkript-Scans laufen über den asynchronen Transkriptindex, der
nach Dateipfad plus `mtimeMs`/`size` gecacht und von gleichzeitigen Readern gemeinsam genutzt wird.

---

## Speicherorte auf dem Datenträger

Pro Agent auf dem Gateway-Host:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkripte: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Themensitzungen: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Store-Wartung und Datenträgersteuerungen

Sitzungspersistenz hat automatische Wartungssteuerungen (`session.maintenance`) für `sessions.json`, Transkriptartefakte und Trajectory-Sidecars:

- `mode`: `warn` (Standard) oder `enforce`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: Obergrenze für Einträge in `sessions.json` (Standard `500`)
- `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive (Standard: wie `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Sitzungsverzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Normale Gateway-Schreibvorgänge laufen über einen sitzungsbezogenen Store-Writer, der In-Process-Mutationen serialisiert, ohne eine Laufzeit-Dateisperre zu nehmen. Hot-Path-Patch-Helfer leihen sich den validierten veränderbaren Cache aus, während sie diesen Writer-Slot halten, sodass große `sessions.json`-Dateien nicht für jedes Metadaten-Update geklont oder erneut gelesen werden. Laufzeitcode sollte `updateSessionStore(...)` oder `updateSessionStoreEntry(...)` bevorzugen; direkte Whole-Store-Speicherungen sind Kompatibilitäts- und Offline-Wartungstools. Wenn ein Gateway erreichbar ist, delegieren nicht als Dry Run ausgeführte `openclaw sessions cleanup` und `openclaw agents delete` Store-Mutationen an den Gateway, damit sich die Bereinigung in dieselbe Writer-Warteschlange einreiht; `--store <path>` ist der explizite Offline-Reparaturpfad für direkte Dateiwartung. Die `maxEntries`-Bereinigung wird für produktionsgroße Obergrenzen weiterhin gebündelt, sodass ein Store die konfigurierte Obergrenze kurzzeitig überschreiten kann, bevor die nächste High-Water-Bereinigung ihn wieder herunterschreibt. Session-Store-Lesevorgänge bereinigen oder begrenzen Einträge während des Gateway-Starts nicht; verwenden Sie Schreibvorgänge oder `openclaw sessions cleanup --enforce` für die Bereinigung. `openclaw sessions cleanup --enforce` wendet die konfigurierte Obergrenze weiterhin sofort an und bereinigt alte nicht referenzierte Transkript-, Prüfpunkt- und Trajectory-Artefakte, auch wenn kein Datenträgerbudget konfiguriert ist.

Die Wartung behält dauerhafte externe Unterhaltungspointer wie Gruppensitzungen
und Thread-bezogene Chatsitzungen bei, aber synthetische Laufzeiteinträge für Cron, Hooks,
Heartbeat, ACP und Sub-Agents können weiterhin entfernt werden, wenn sie das
konfigurierte Alter, die konfigurierte Anzahl oder das Datenträgerbudget überschreiten.

OpenClaw erstellt bei Gateway-Schreibvorgängen keine automatischen `sessions.json.bak.*`-Rotationssicherungen mehr. Der alte Schlüssel `session.maintenance.rotateBytes` wird ignoriert und `openclaw doctor --fix` entfernt ihn aus älteren Konfigurationen.

Transkript-Mutationen verwenden eine Sitzungsschreibsperre auf der Transkriptdatei. Der Sperrerwerb wartet bis zu
`session.writeLock.acquireTimeoutMs`, bevor ein Fehler wegen belegter Sitzung angezeigt wird; der Standardwert ist `60000`
ms. Erhöhen Sie dies nur, wenn legitime Vorbereitungs-, Bereinigungs-, Compaction- oder Transkript-Mirror-Arbeit
auf langsamen Maschinen länger konkurriert. Erkennung veralteter Sperren und Warnungen zur maximalen Haltedauer bleiben separate Richtlinien.

Durchsetzungsreihenfolge für die Bereinigung des Datenträgerbudgets (`mode: "enforce"`):

1. Entfernen Sie zuerst die ältesten archivierten, verwaisten Transkript- oder verwaisten Trajectory-Artefakte.
2. Wenn die Nutzung weiterhin über dem Ziel liegt, entfernen Sie die ältesten Sitzungseinträge und ihre Transkript-/Trajectory-Dateien.
3. Fahren Sie fort, bis die Nutzung bei oder unter `highWaterBytes` liegt.

In `mode: "warn"` meldet OpenClaw potenzielle Entfernungen, verändert den Store/die Dateien aber nicht.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sitzungen und Laufprotokolle

Isolierte Cron-Läufe erstellen ebenfalls Sitzungseinträge/Transkripte und haben eigene Aufbewahrungssteuerungen:

- `cron.sessionRetention` (Standard `24h`) bereinigt alte isolierte Cron-Laufsitzungen aus dem Session Store (`false` deaktiviert dies).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`-Dateien (Standardwerte: `2_000_000` Byte und `2000` Zeilen).

Wenn Cron eine neue isolierte Laufsitzung erzwingt, bereinigt es den vorherigen
`cron:<jobId>`-Sitzungseintrag, bevor die neue Zeile geschrieben wird. Es übernimmt sichere
Einstellungen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und explizite
vom Benutzer ausgewählte Modell-/Auth-Überschreibungen. Es verwirft umgebenden Unterhaltungskontext wie
Channel-/Gruppen-Routing, Sende- oder Warteschlangenrichtlinie, Elevation, Ursprung und ACP-
Laufzeitbindung, damit ein frischer isolierter Lauf keine veraltete Zustellung oder
Laufzeitberechtigung aus einem älteren Lauf erben kann.

---

## Sitzungsschlüssel (`sessionKey`)

Ein `sessionKey` identifiziert, _in welchem Unterhaltungs-Bucket_ Sie sich befinden (Routing + Isolation).

Gängige Muster:

- Haupt-/Direktchat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (sofern nicht überschrieben)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Sitzungs-IDs (`sessionId`)

Jede `sessionKey` verweist auf eine aktuelle `sessionId` (die Transkriptdatei, die die Unterhaltung fortsetzt).

Faustregeln:

- **Reset** (`/new`, `/reset`) erstellt eine neue `sessionId` für diese `sessionKey`.
- **Täglicher Reset** (standardmäßig 4:00 Uhr lokaler Zeit auf dem Gateway-Host) erstellt bei der nächsten Nachricht nach der Reset-Grenze eine neue `sessionId`.
- **Leerlaufablauf** (`session.reset.idleMinutes` oder älteres `session.idleMinutes`) erstellt eine neue `sessionId`, wenn nach dem Leerlauffenster eine Nachricht eintrifft. Wenn täglich + Leerlauf beide konfiguriert sind, gewinnt das, was zuerst abläuft.
- **Systemereignisse** (Heartbeat, Cron-Weckrufe, Exec-Benachrichtigungen, Gateway-Buchführung) können die Sitzungszeile verändern, verlängern aber nicht die Frische für den täglichen/Leerlauf-Reset. Reset-Rollover verwirft Systemereignis-Hinweise in der Warteschlange für die vorherige Sitzung, bevor der frische Prompt gebaut wird.
- **Parent-Fork-Richtlinie** verwendet den aktiven Branch von PI, wenn ein Thread- oder Subagent-Fork erstellt wird. Wenn dieser Branch zu groß ist, startet OpenClaw das Kind mit isoliertem Kontext, statt fehlzuschlagen oder unbrauchbare Historie zu übernehmen. Die Größenrichtlinie ist automatisch; die alte Konfiguration `session.parentForkMaxTokens` wird von `openclaw doctor --fix` entfernt.

Implementierungsdetail: Die Entscheidung erfolgt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Session-Store-Schema (`sessions.json`)

Der Werttyp des Stores ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID (der Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `sessionStartedAt`: Startzeitstempel für die aktuelle `sessionId`; die Frische für den täglichen Reset
  verwendet dies. Alte Zeilen können ihn aus dem JSONL-Sitzungsheader ableiten.
- `lastInteractionAt`: Zeitstempel der letzten echten Benutzer-/Channel-Interaktion; die Frische für den Leerlauf-Reset
  verwendet dies, sodass Heartbeat-, Cron- und Exec-Ereignisse Sitzungen nicht
  am Leben halten. Alte Zeilen ohne dieses Feld fallen für die Leerlauf-Frische auf die wiederhergestellte Sitzungsstartzeit
  zurück.
- `updatedAt`: Zeitstempel der letzten Store-Zeilen-Mutation, verwendet für Auflistung, Bereinigung und
  Buchführung. Er ist nicht maßgeblich für die Frische beim täglichen/Leerlauf-Reset.
- `sessionFile`: optionale explizite Überschreibung des Transkriptpfads
- `chatType`: `direct | group | room` (hilft UIs und Senderichtlinie)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Channel-Beschriftung
- Umschalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (sitzungsbezogene Überschreibung)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (Best-Effort / Provider-abhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft die automatische Compaction für diesen Sitzungsschlüssel abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel für den letzten Speicher-Flush vor der Compaction
- `memoryFlushCompactionCount`: Compaction-Zähler, als der letzte Flush lief

Der Store kann sicher bearbeitet werden, aber der Gateway ist maßgeblich: Er kann Einträge neu schreiben oder rehydrieren, während Sitzungen laufen.

---

## Transkriptstruktur (`*.jsonl`)

Transkripte werden vom `SessionManager` von `@earendil-works/pi-coding-agent` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Sitzungsheader (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Sitzungseinträge mit `id` + `parentId` (Baum)

Nennenswerte Eintragstypen:

- `message`: Benutzer-/Assistent-/ToolResult-Nachrichten
- `custom_message`: von der Erweiterung injizierte Nachrichten, die _in_ den Modellkontext eingehen (können in der UI verborgen werden)
- `custom`: Erweiterungszustand, der _nicht_ in den Modellkontext eingeht
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren in einem Baum-Branch

OpenClaw „korrigiert“ Transkripte absichtlich **nicht**; der Gateway verwendet `SessionManager`, um sie zu lesen/schreiben.

---

## Kontextfenster im Vergleich zu erfassten Token

Zwei unterschiedliche Konzepte sind wichtig:

1. **Modell-Kontextfenster**: harte Obergrenze pro Modell (Token, die für das Modell sichtbar sind)
2. **Session-Store-Zähler**: fortlaufende Statistiken, die in `sessions.json` geschrieben werden (verwendet für /status und Dashboards)

Wenn Sie Limits abstimmen:

- Das Kontextfenster stammt aus dem Modellkatalog (und kann über die Konfiguration überschrieben werden).
- `contextTokens` im Store ist ein Laufzeit-Schätz-/Berichtswert; behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen finden Sie unter [/token-use](/de/reference/token-use).

---

## Compaction: was sie ist

Compaction fasst ältere Unterhaltung in einem persistierten `compaction`-Eintrag im Transkript zusammen und lässt aktuelle Nachrichten intakt.

Nach der Compaction sehen zukünftige Turns:

- Die Compaction-Zusammenfassung
- Nachrichten nach `firstKeptEntryId`

Compaction ist **persistent** (anders als Session-Pruning). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Compaction-Chunk-Grenzen und Tool-Paarung

Wenn OpenClaw ein langes Transkript in Compaction-Chunks aufteilt, hält es
Assistant-Tool-Aufrufe mit ihren passenden `toolResult`-Einträgen zusammen.

- Wenn die Token-Anteil-Aufteilung zwischen einem Tool-Aufruf und seinem Ergebnis liegt, verschiebt OpenClaw
  die Grenze auf die Assistant-Tool-Aufruf-Nachricht, statt das Paar zu trennen.
- Wenn ein nachfolgender Tool-Ergebnis-Block den Chunk sonst über das Ziel bringen würde,
  bewahrt OpenClaw diesen ausstehenden Tool-Block auf und lässt das nicht zusammengefasste Ende
  intakt.
- Abgebrochene/fehlerhafte Tool-Aufruf-Blöcke halten keine ausstehende Aufteilung offen.

---

## Wann Auto-Compaction erfolgt (Pi-Laufzeit)

Im eingebetteten Pi-Agenten wird Auto-Compaction in zwei Fällen ausgelöst:

1. **Überlauf-Wiederherstellung**: Das Modell gibt einen Kontextüberlauffehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche Provider-förmige Varianten) → komprimieren → erneut versuchen.
2. **Schwellenwert-Wartung**: Nach einem erfolgreichen Turn, wenn:

`contextTokens > contextWindow - reserveTokens`

Dabei gilt:

- `contextWindow` ist das Kontextfenster des Modells
- `reserveTokens` ist der Puffer, der für Prompts + die nächste Modellausgabe reserviert ist

Dies sind Semantiken der Pi-Laufzeit (OpenClaw verarbeitet die Ereignisse, aber Pi entscheidet, wann komprimiert wird).

OpenClaw kann außerdem eine lokale Preflight-Compaction auslösen, bevor der nächste
Run geöffnet wird, wenn `agents.defaults.compaction.maxActiveTranscriptBytes` gesetzt ist und die
aktive Transkriptdatei diese Größe erreicht. Dies ist ein Dateigrößen-Schutz für lokale
Wiederöffnungskosten, keine rohe Archivierung: OpenClaw führt weiterhin normale semantische Compaction aus,
und sie erfordert `truncateAfterCompaction`, damit die komprimierte Zusammenfassung zu einem
neuen Nachfolge-Transkript werden kann.

Für eingebettete Pi-Runs fügt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
einen optionalen Tool-Loop-Schutz hinzu. Nachdem ein Tool-Ergebnis angehängt wurde und vor dem
nächsten Modellaufruf schätzt OpenClaw den Prompt-Druck mit derselben Preflight-
Budgetlogik, die beim Turn-Start verwendet wird. Wenn der Kontext nicht mehr passt, führt der Schutz
keine Compaction innerhalb von Pis `transformContext`-Hook aus. Er löst ein strukturiertes
Mid-Turn-Precheck-Signal aus, stoppt die aktuelle Prompt-Übermittlung und lässt die
äußere Run-Schleife den bestehenden Wiederherstellungspfad verwenden: übergroße Tool-Ergebnisse kürzen,
wenn das ausreicht, oder den konfigurierten Compaction-Modus auslösen und erneut versuchen. Die
Option ist standardmäßig deaktiviert und funktioniert sowohl mit dem Compaction-Modus `default` als auch mit
`safeguard`, einschließlich Provider-gestützter Safeguard-Compaction.
Dies ist unabhängig von `maxActiveTranscriptBytes`: Der Bytegrößen-Schutz läuft,
bevor ein Turn geöffnet wird, während der Mid-Turn-Precheck später im eingebetteten Pi-Tool-
Loop läuft, nachdem neue Tool-Ergebnisse angehängt wurden.

---

## Compaction-Einstellungen (`reserveTokens`, `keepRecentTokens`)

Pis Compaction-Einstellungen befinden sich in den Pi-Einstellungen:

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

OpenClaw erzwingt außerdem eine Sicherheitsuntergrenze für eingebettete Runs:

- Wenn `compaction.reserveTokens < reserveTokensFloor`, erhöht OpenClaw den Wert.
- Die Standarduntergrenze beträgt `20000` Tokens.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn der Wert bereits höher ist, lässt OpenClaw ihn unverändert.
- Manuelles `/compact` berücksichtigt ein explizites `agents.defaults.compaction.keepRecentTokens`
  und behält Pis Schnittpunkt für das jüngste Ende bei. Ohne ein explizites Aufbewahrungsbudget
  bleibt manuelle Compaction ein harter Checkpoint, und der neu aufgebaute Kontext beginnt bei
  der neuen Zusammenfassung.
- Setzen Sie `agents.defaults.compaction.midTurnPrecheck.enabled: true`, um den
  optionalen Tool-Loop-Precheck nach neuen Tool-Ergebnissen und vor dem nächsten Modell-
  aufruf auszuführen. Dies ist nur ein Auslöser; die Zusammenfassungserstellung verwendet weiterhin den konfigurierten
  Compaction-Pfad. Sie ist unabhängig von `maxActiveTranscriptBytes`, was ein
  Bytegrößen-Schutz für das aktive Transkript beim Turn-Start ist.
- Setzen Sie `agents.defaults.compaction.maxActiveTranscriptBytes` auf einen Bytewert oder
  eine Zeichenfolge wie `"20mb"`, um lokale Compaction vor einem Turn auszuführen, wenn das aktive
  Transkript groß wird. Dieser Schutz ist nur aktiv, wenn
  `truncateAfterCompaction` ebenfalls aktiviert ist. Lassen Sie den Wert ungesetzt oder setzen Sie ihn auf `0`, um
  ihn zu deaktivieren.
- Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist,
  rotiert OpenClaw das aktive Transkript nach der Compaction in eine komprimierte Nachfolger-JSONL.
  Das alte vollständige Transkript bleibt archiviert und wird vom
  Compaction-Checkpoint verlinkt, statt direkt überschrieben zu werden.

Warum: genug Puffer für mehrstufiges „Housekeeping“ (wie Speicher-Schreibvorgänge) lassen, bevor Compaction unvermeidbar wird.

Implementierung: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aufgerufen aus `src/agents/pi-embedded-runner.ts`).

---

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen Compaction-Provider registrieren. Wenn `agents.defaults.compaction.provider` auf eine registrierte Provider-ID gesetzt ist, delegiert die Safeguard-Extension die Zusammenfassung an diesen Provider statt an die eingebaute `summarizeInStages`-Pipeline.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Nicht setzen, um die standardmäßige LLM-Zusammenfassung zu verwenden.
- Das Setzen eines `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Identifier-Erhaltung wie der eingebaute Pfad.
- Der Safeguard bewahrt nach der Provider-Ausgabe weiterhin den Kontext der jüngsten Turns und der Split-Turn-Suffixe.
- Die eingebaute Safeguard-Zusammenfassung destilliert vorherige Zusammenfassungen mit neuen Nachrichten erneut,
  statt die vollständige vorherige Zusammenfassung wörtlich zu bewahren.
- Der Safeguard-Modus aktiviert standardmäßig Qualitätsprüfungen für Zusammenfassungen; setzen Sie
  `qualityGuard.enabled: false`, um das Verhalten „bei fehlerhaft geformter Ausgabe erneut versuchen“ zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw automatisch auf die eingebaute LLM-Zusammenfassung zurück.
- Abbruch-/Timeout-Signale werden erneut ausgelöst (nicht verschluckt), um die Abbruchanforderung des Aufrufers zu respektieren.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Benutzerseitig sichtbare Oberflächen

Sie können Compaction und Session-Status beobachten über:

- `/status` (in jeder Chat-Session)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Gateway-Logs (`pnpm gateway:watch` oder `openclaw logs --follow`): `embedded run auto-compaction start` + `complete`
- Ausführlicher Modus: `🧹 Auto-compaction complete` + Compaction-Anzahl

---

## Stilles Housekeeping (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen der Benutzer keine Zwischenausgabe sehen soll.

Konvention:

- Der Assistant beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` /
  `no_reply`, um anzuzeigen: „keine Antwort an den Benutzer ausliefern“.
- OpenClaw entfernt/unterdrückt dies in der Auslieferungsschicht.
- Die Unterdrückung des exakten stillen Tokens ist nicht case-sensitiv, sodass `NO_REPLY` und
  `no_reply` beide zählen, wenn die gesamte Nutzlast nur aus dem stillen Token besteht.
- Dies ist nur für echte Hintergrund-/Nicht-Auslieferungs-Turns gedacht; es ist keine Abkürzung für
  gewöhnliche handlungsorientierte Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw außerdem **Entwurfs-/Typing-Streaming**, wenn ein
Teil-Chunk mit `NO_REPLY` beginnt, sodass stille Vorgänge während des Turns keine teilweise
Ausgabe preisgeben.

---

## „Memory Flush“ vor der Compaction (implementiert)

Ziel: Bevor Auto-Compaction erfolgt, einen stillen agentischen Turn ausführen, der dauerhaften
Zustand auf die Festplatte schreibt (z. B. `memory/YYYY-MM-DD.md` im Agent-Arbeitsbereich), damit Compaction keinen
kritischen Kontext löschen kann.

OpenClaw verwendet den Ansatz **Pre-Threshold Flush**:

1. Session-Kontextnutzung überwachen.
2. Wenn sie einen „weichen Schwellenwert“ überschreitet (unterhalb von Pis Compaction-Schwellenwert), eine stille
   „Speicher jetzt schreiben“-Anweisung an den Agenten ausführen.
3. Das exakte stille Token `NO_REPLY` / `no_reply` verwenden, sodass der Benutzer
   nichts sieht.

Konfiguration (`agents.defaults.compaction.memoryFlush`):

- `enabled` (Standard: `true`)
- `model` (optionale exakte Provider-/Modell-Überschreibung für den Flush-Turn, zum Beispiel `ollama/qwen3:8b`)
- `softThresholdTokens` (Standard: `4000`)
- `prompt` (Benutzernachricht für den Flush-Turn)
- `systemPrompt` (zusätzlicher System-Prompt, der für den Flush-Turn angehängt wird)

Hinweise:

- Der Standard-Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis, um die
  Auslieferung zu unterdrücken.
- Wenn `model` gesetzt ist, verwendet der Flush-Turn dieses Modell, ohne die
  Fallback-Kette der aktiven Session zu erben, sodass lokales Housekeeping nicht stillschweigend
  auf ein kostenpflichtiges Konversationsmodell zurückfällt.
- Der Flush läuft einmal pro Compaction-Zyklus (nachverfolgt in `sessions.json`).
- Der Flush läuft nur für eingebettete Pi-Sessions (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Session-Arbeitsbereich schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Memory](/de/concepts/memory) für das Dateilayout und die Schreibmuster des Arbeitsbereichs.

Pi stellt außerdem einen `session_before_compact`-Hook in der Extension-API bereit, aber OpenClaws
Flush-Logik lebt derzeit auf der Gateway-Seite.

---

## Checkliste zur Fehlerbehebung

- Falscher Session-Schlüssel? Beginnen Sie mit [/concepts/session](/de/concepts/session) und bestätigen Sie den `sessionKey` in `/status`.
- Abweichung zwischen Store und Transkript? Bestätigen Sie den Gateway-Host und den Store-Pfad aus `openclaw status`.
- Compaction-Spam? Prüfen Sie:
  - Kontextfenster des Modells (zu klein)
  - Compaction-Einstellungen (`reserveTokens` zu hoch für das Modellfenster kann frühere Compaction verursachen)
  - aufgeblähte Tool-Ergebnisse: Session-Pruning aktivieren/anpassen
- Stille Turns lecken? Bestätigen Sie, dass die Antwort mit `NO_REPLY` beginnt (case-insensitives exaktes Token) und dass Sie einen Build verwenden, der den Streaming-Unterdrückungs-Fix enthält.

## Verwandt

- [Session-Verwaltung](/de/concepts/session)
- [Session-Pruning](/de/concepts/session-pruning)
- [Kontext-Engine](/de/concepts/context-engine)
