---
read_when:
    - Sie müssen Sitzungs-IDs, Transkript-JSONL oder sessions.json-Felder debuggen
    - Sie ändern das Verhalten der Auto-Compaction oder fügen „Pre-Compaction“-Aufräumarbeiten hinzu
    - Sie möchten Speicherleerungen oder stille Systemdurchgänge implementieren
summary: 'Vertiefung: Sitzungsspeicher + Transkripte, Lebenszyklus und Interna der (Auto-)Compaction'
title: Detaillierter Einblick in die Sitzungsverwaltung
x-i18n:
    generated_at: "2026-05-05T08:26:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3161dd9c98bff7ea24266f44a9261693d8a9ee2b47d9af2d152de7057016748b
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw verwaltet Sessions Ende-zu-Ende in diesen Bereichen:

- **Session-Routing** (wie eingehende Nachrichten einem `sessionKey` zugeordnet werden)
- **Session-Store** (`sessions.json`) und was er nachverfolgt
- **Transkript-Persistenz** (`*.jsonl`) und ihre Struktur
- **Transkript-Hygiene** (Provider-spezifische Korrekturen vor Läufen)
- **Kontextlimits** (Kontextfenster im Vergleich zu nachverfolgten Tokens)
- **Compaction** (manuelle und automatische Compaction) und wo Vorarbeiten vor der Compaction eingehängt werden
- **Stille Aufräumarbeiten** (Speicherschreibvorgänge, die keine für Benutzer sichtbare Ausgabe erzeugen sollen)

Wenn Sie zuerst einen Überblick auf höherer Ebene wünschen, beginnen Sie mit:

- [Session-Verwaltung](/de/concepts/session)
- [Compaction](/de/concepts/compaction)
- [Speicherübersicht](/de/concepts/memory)
- [Speichersuche](/de/concepts/memory-search)
- [Session-Bereinigung](/de/concepts/session-pruning)
- [Transkript-Hygiene](/de/reference/transcript-hygiene)

---

## Quelle der Wahrheit: der Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum entworfen, der den Session-Status besitzt.

- UIs (macOS-App, Web-Control-UI, TUI) sollten den Gateway nach Session-Listen und Token-Anzahlen abfragen.
- Im Remote-Modus liegen Session-Dateien auf dem Remote-Host; „Ihre lokalen Mac-Dateien zu prüfen“ spiegelt nicht wider, was der Gateway verwendet.

---

## Zwei Persistenzebenen

OpenClaw persistiert Sessions in zwei Ebenen:

1. **Session-Store (`sessions.json`)**
   - Schlüssel/Wert-Zuordnung: `sessionKey -> SessionEntry`
   - Klein, veränderbar, sicher zu bearbeiten (oder Einträge zu löschen)
   - Verfolgt Session-Metadaten (aktuelle Session-ID, letzte Aktivität, Umschalter, Token-Zähler usw.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Nur anhängbares Transkript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Unterhaltung + Tool-Aufrufe + Compaction-Zusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Turns neu aufzubauen
   - Große Debug-Checkpoints vor der Compaction werden übersprungen, sobald das aktive
     Transkript die Größenobergrenze für Checkpoints überschreitet. Dadurch wird eine zweite riesige
     `.checkpoint.*.jsonl`-Kopie vermieden.

Gateway-Verlaufsleser sollten vermeiden, das gesamte Transkript zu materialisieren, außer
die Oberfläche benötigt ausdrücklich beliebigen Zugriff auf frühere Inhalte. Verlauf der ersten Seite,
eingebetteter Chatverlauf, Wiederherstellung nach Neustart sowie Token-/Nutzungsprüfungen verwenden begrenzte Tail-Reads. Vollständige Transkript-Scans laufen über den asynchronen Transkriptindex, der
nach Dateipfad plus `mtimeMs`/`size` zwischengespeichert und von gleichzeitigen Lesern gemeinsam genutzt wird.

---

## Speicherorte auf dem Datenträger

Pro Agent auf dem Gateway-Host:

- Store: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkripte: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Themen-Sessions: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Store-Wartung und Datenträgersteuerung

Session-Persistenz verfügt über automatische Wartungssteuerungen (`session.maintenance`) für `sessions.json`, Transkriptartefakte und Trajektorien-Sidecars:

- `mode`: `warn` (Standard) oder `enforce`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: Obergrenze für Einträge in `sessions.json` (Standard `500`)
- `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive (Standard: wie `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Sessions-Verzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Normale Gateway-Schreibvorgänge laufen über einen Session-Writer pro Store, der Mutationen innerhalb des Prozesses serialisiert, ohne eine Laufzeit-Dateisperre zu nehmen. Hot-Path-Patch-Helfer leihen sich den validierten veränderbaren Cache, während sie diesen Writer-Slot halten, sodass große `sessions.json`-Dateien nicht für jede Metadatenaktualisierung geklont oder erneut gelesen werden. Laufzeitcode sollte `updateSessionStore(...)` oder `updateSessionStoreEntry(...)` bevorzugen; direkte Whole-Store-Speicherungen sind Kompatibilitäts- und Offline-Wartungstools. Wenn ein Gateway erreichbar ist, delegieren nicht trockene Läufe von `openclaw sessions cleanup` und `openclaw agents delete` Store-Mutationen an den Gateway, sodass die Bereinigung derselben Writer-Warteschlange beitritt; `--store <path>` ist der explizite Offline-Reparaturpfad für direkte Dateiwartung. `maxEntries`-Bereinigung wird für produktionsgroße Obergrenzen weiterhin gebündelt, sodass ein Store die konfigurierte Obergrenze kurzzeitig überschreiten kann, bevor die nächste High-Water-Bereinigung ihn wieder herunterschreibt. Session-Store-Lesevorgänge bereinigen oder begrenzen während des Gateway-Starts keine Einträge; verwenden Sie Schreibvorgänge oder `openclaw sessions cleanup --enforce` für die Bereinigung. `openclaw sessions cleanup --enforce` wendet die konfigurierte Obergrenze weiterhin sofort an und bereinigt alte, nicht referenzierte Transkript-, Checkpoint- und Trajektorienartefakte, selbst wenn kein Datenträgerbudget konfiguriert ist.

Die Wartung behält dauerhafte externe Unterhaltungspointer wie Gruppen-Sessions
und Thread-bezogene Chat-Sessions bei, aber synthetische Laufzeiteinträge für Cron, Hooks,
Heartbeat, ACP und Sub-Agents können weiterhin entfernt werden, wenn sie das
konfigurierte Alter, die Anzahl oder das Datenträgerbudget überschreiten.

OpenClaw erstellt bei Gateway-Schreibvorgängen keine automatischen `sessions.json.bak.*`-Rotationssicherungen mehr. Der Legacy-Schlüssel `session.maintenance.rotateBytes` wird ignoriert und `openclaw doctor --fix` entfernt ihn aus älteren Konfigurationen.

Transkriptmutationen verwenden eine Session-Schreibsperre auf der Transkriptdatei. Die Sperrenakquise wartet bis zu
`session.writeLock.acquireTimeoutMs`, bevor ein Busy-Session-Fehler angezeigt wird; der Standardwert ist `60000`
ms. Erhöhen Sie dies nur, wenn legitime Vorbereitungs-, Bereinigungs-, Compaction- oder Transkriptspiegelungsarbeiten
auf langsamen Maschinen länger konkurrieren. Erkennung veralteter Sperren und Warnungen zur maximalen Haltezeit bleiben separate Richtlinien.

Durchsetzungsreihenfolge für die Bereinigung des Datenträgerbudgets (`mode: "enforce"`):

1. Entfernen Sie zuerst die ältesten archivierten, verwaisten Transkript- oder verwaisten Trajektorienartefakte.
2. Wenn die Nutzung weiterhin über dem Ziel liegt, entfernen Sie die ältesten Session-Einträge und ihre Transkript-/Trajektoriendateien.
3. Fahren Sie fort, bis die Nutzung bei oder unter `highWaterBytes` liegt.

Im `mode: "warn"` meldet OpenClaw potenzielle Entfernungen, ändert den Store/die Dateien jedoch nicht.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sessions und Laufprotokolle

Isolierte Cron-Läufe erstellen ebenfalls Session-Einträge/Transkripte und haben eigene Aufbewahrungssteuerungen:

- `cron.sessionRetention` (Standard `24h`) bereinigt alte isolierte Cron-Lauf-Sessions aus dem Session-Store (`false` deaktiviert dies).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`-Dateien (Standards: `2_000_000` Bytes und `2000` Zeilen).

Wenn Cron eine neue isolierte Lauf-Session zwangsweise erstellt, bereinigt es den vorherigen
`cron:<jobId>`-Session-Eintrag, bevor die neue Zeile geschrieben wird. Es übernimmt sichere
Einstellungen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und ausdrücklich
vom Benutzer ausgewählte Modell-/Authentifizierungsüberschreibungen. Es verwirft umgebenden Unterhaltungskontext wie
Channel-/Gruppen-Routing, Sende- oder Warteschlangenrichtlinie, Elevation, Ursprung und ACP-
Laufzeitbindung, sodass ein frischer isolierter Lauf keine veraltete Zustellungs- oder
Laufzeitautorität aus einem älteren Lauf erben kann.

---

## Session-Schlüssel (`sessionKey`)

Ein `sessionKey` identifiziert, _in welchem Unterhaltungs-Bucket_ Sie sich befinden (Routing + Isolation).

Gängige Muster:

- Haupt-/Direktchat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (sofern nicht überschrieben)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Session-IDs (`sessionId`)

Jeder `sessionKey` verweist auf eine aktuelle `sessionId` (die Transkriptdatei, die die Unterhaltung fortsetzt).

Faustregeln:

- **Reset** (`/new`, `/reset`) erstellt eine neue `sessionId` für diesen `sessionKey`.
- **Täglicher Reset** (standardmäßig 4:00 Uhr lokale Zeit auf dem Gateway-Host) erstellt eine neue `sessionId` bei der nächsten Nachricht nach der Reset-Grenze.
- **Ablauf bei Inaktivität** (`session.reset.idleMinutes` oder Legacy `session.idleMinutes`) erstellt eine neue `sessionId`, wenn eine Nachricht nach dem Inaktivitätsfenster eintrifft. Wenn täglicher Reset und Inaktivität beide konfiguriert sind, gewinnt, was zuerst abläuft.
- **Systemereignisse** (Heartbeat, Cron-Weckrufe, Exec-Benachrichtigungen, Gateway-Buchhaltung) können die Session-Zeile verändern, verlängern aber nicht die Frische für tägliche/Inaktivitäts-Resets. Reset-Rollover verwirft Systemereignis-Hinweise in der Warteschlange für die vorherige Session, bevor der frische Prompt erstellt wird.
- **Parent-Fork-Richtlinie** verwendet den aktiven Branch von PI, wenn ein Thread- oder Subagent-Fork erstellt wird. Wenn dieser Branch zu groß ist, startet OpenClaw das Kind mit isoliertem Kontext, statt fehlzuschlagen oder unbrauchbaren Verlauf zu erben. Die Größenrichtlinie ist automatisch; die Legacy-Konfiguration `session.parentForkMaxTokens` wird von `openclaw doctor --fix` entfernt.

Implementierungsdetail: Die Entscheidung erfolgt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Session-Store-Schema (`sessions.json`)

Der Werttyp des Stores ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID (Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `sessionStartedAt`: Startzeitstempel für die aktuelle `sessionId`; die Frische für den täglichen Reset
  verwendet dies. Legacy-Zeilen können ihn aus dem JSONL-Session-Header ableiten.
- `lastInteractionAt`: Zeitstempel der letzten echten Benutzer-/Channel-Interaktion; die Frische für den Inaktivitätsreset
  verwendet dies, sodass Heartbeat-, Cron- und Exec-Ereignisse Sessions nicht
  am Leben halten. Legacy-Zeilen ohne dieses Feld fallen für die Inaktivitätsfrische auf die wiederhergestellte Session-Startzeit
  zurück.
- `updatedAt`: Zeitstempel der letzten Store-Zeilenmutation, verwendet für Auflistung, Bereinigung und
  Buchhaltung. Er ist nicht maßgeblich für die Frische täglicher/Inaktivitäts-Resets.
- `sessionFile`: optionale explizite Überschreibung des Transkriptpfads
- `chatType`: `direct | group | room` (hilft UIs und Senderichtlinie)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Channel-Beschriftung
- Umschalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (Session-spezifische Überschreibung)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (Best-Effort / Provider-abhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft Auto-Compaction für diesen Session-Schlüssel abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel des letzten Speicher-Flush vor der Compaction
- `memoryFlushCompactionCount`: Compaction-Zählerstand, als der letzte Flush lief

Der Store kann sicher bearbeitet werden, aber der Gateway ist maßgeblich: Er kann Einträge neu schreiben oder rehydrieren, während Sessions laufen.

---

## Transkriptstruktur (`*.jsonl`)

Transkripte werden vom `SessionManager` von `@mariozechner/pi-coding-agent` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Session-Header (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Session-Einträge mit `id` + `parentId` (Baum)

Bemerkenswerte Eintragstypen:

- `message`: Benutzer-/Assistent-/toolResult-Nachrichten
- `custom_message`: von der Erweiterung eingefügte Nachrichten, die _in_ den Modellkontext eingehen (können in der UI ausgeblendet sein)
- `custom`: Erweiterungsstatus, der _nicht_ in den Modellkontext eingeht
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren in einem Baum-Branch

OpenClaw führt absichtlich keine „Korrekturen“ an Transkripten durch; der Gateway verwendet `SessionManager`, um sie zu lesen/schreiben.

---

## Kontextfenster im Vergleich zu nachverfolgten Tokens

Zwei unterschiedliche Konzepte sind wichtig:

1. **Modellkontextfenster**: harte Obergrenze pro Modell (für das Modell sichtbare Tokens)
2. **Session-Store-Zähler**: fortlaufende Statistiken, die in `sessions.json` geschrieben werden (verwendet für /status und Dashboards)

Wenn Sie Limits abstimmen:

- Das Kontextfenster stammt aus dem Modellkatalog (und kann per Konfiguration überschrieben werden).
- `contextTokens` im Store ist ein Laufzeit-Schätz-/Berichtswert; behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen finden Sie unter [/token-use](/de/reference/token-use).

---

## Compaction: was sie ist

Compaction fasst ältere Unterhaltung in einem persistierten `compaction`-Eintrag im Transkript zusammen und lässt aktuelle Nachrichten intakt.

Nach der Compaction sehen zukünftige Turns:

- Die Compaction-Zusammenfassung
- Nachrichten nach `firstKeptEntryId`

Compaction ist **persistent** (anders als Sitzungsbereinigung). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Compaction-Chunk-Grenzen und Tool-Paarung

Wenn OpenClaw ein langes Transkript in Compaction-Chunks aufteilt, hält es
Tool-Aufrufe des Assistenten mit den zugehörigen `toolResult`-Einträgen zusammen.

- Wenn die tokenanteilsbasierte Aufteilung zwischen einem Tool-Aufruf und seinem Ergebnis landet, verschiebt OpenClaw
  die Grenze zur Tool-Aufruf-Nachricht des Assistenten, statt das Paar zu trennen.
- Wenn ein nachfolgender Tool-Ergebnisblock den Chunk andernfalls über das Ziel hinaus schieben würde,
  bewahrt OpenClaw diesen ausstehenden Tool-Block und hält den nicht zusammengefassten Rest
  intakt.
- Abgebrochene/fehlerhafte Tool-Aufruf-Blöcke halten keine ausstehende Aufteilung offen.

---

## Wann Auto-Compaction ausgelöst wird (Pi-Runtime)

Im eingebetteten Pi-Agenten wird Auto-Compaction in zwei Fällen ausgelöst:

1. **Wiederherstellung bei Überlauf**: Das Modell gibt einen Kontextüberlauffehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche providergeprägte Varianten) → komprimieren → erneut versuchen.
2. **Schwellenwert-Wartung**: nach einem erfolgreichen Turn, wenn:

`contextTokens > contextWindow - reserveTokens`

Dabei gilt:

- `contextWindow` ist das Kontextfenster des Modells
- `reserveTokens` ist der für Prompts + die nächste Modellausgabe reservierte Spielraum

Dies sind Semantiken der Pi-Runtime (OpenClaw verarbeitet die Ereignisse, aber Pi entscheidet, wann komprimiert wird).

OpenClaw kann außerdem eine lokale Preflight-Compaction auslösen, bevor der nächste
Run geöffnet wird, wenn `agents.defaults.compaction.maxActiveTranscriptBytes` gesetzt ist und die
aktive Transkriptdatei diese Größe erreicht. Dies ist ein Dateigrößenschutz für lokale
Wiederöffnungskosten, keine rohe Archivierung: OpenClaw führt weiterhin normale semantische Compaction aus,
und dafür ist `truncateAfterCompaction` erforderlich, damit die komprimierte Zusammenfassung zu einem
neuen Nachfolgetranskript werden kann.

Für eingebettete Pi-Runs fügt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
einen optionalen Tool-Loop-Schutz hinzu. Nachdem ein Tool-Ergebnis angehängt wurde und vor dem
nächsten Modellaufruf schätzt OpenClaw den Prompt-Druck mit derselben Preflight-
Budgetlogik, die beim Turn-Start verwendet wird. Wenn der Kontext nicht mehr passt, führt der Schutz
keine Compaction innerhalb von Pis `transformContext`-Hook aus. Er löst ein strukturiertes
Mid-Turn-Precheck-Signal aus, stoppt die aktuelle Prompt-Übermittlung und lässt die
äußere Run-Schleife den bestehenden Wiederherstellungspfad verwenden: übergroße Tool-Ergebnisse
abschneiden, wenn das ausreicht, oder den konfigurierten Compaction-Modus auslösen und erneut versuchen. Die
Option ist standardmäßig deaktiviert und funktioniert sowohl mit `default`- als auch mit `safeguard`-
Compaction-Modi, einschließlich providergestützter Safeguard-Compaction.
Dies ist unabhängig von `maxActiveTranscriptBytes`: Der Bytegrößenschutz läuft,
bevor ein Turn geöffnet wird, während der Mid-Turn-Precheck später in der eingebetteten Pi-Tool-
Schleife läuft, nachdem neue Tool-Ergebnisse angehängt wurden.

---

## Compaction-Einstellungen (`reserveTokens`, `keepRecentTokens`)

Pis Compaction-Einstellungen liegen in den Pi-Einstellungen:

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
- Die Standarduntergrenze beträgt `20000` Token.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn der Wert bereits höher ist, lässt OpenClaw ihn unverändert.
- Manuelles `/compact` berücksichtigt ein explizites `agents.defaults.compaction.keepRecentTokens`
  und behält Pis Schnittpunkt für den jüngsten Rest bei. Ohne explizites Beibehaltungsbudget
  bleibt manuelle Compaction ein harter Checkpoint, und der neu aufgebaute Kontext beginnt bei
  der neuen Zusammenfassung.
- Setzen Sie `agents.defaults.compaction.midTurnPrecheck.enabled: true`, um den
  optionalen Tool-Loop-Precheck nach neuen Tool-Ergebnissen und vor dem nächsten Modell-
  aufruf auszuführen. Dies ist nur ein Auslöser; die Zusammenfassungserzeugung verwendet weiterhin den konfigurierten
  Compaction-Pfad. Er ist unabhängig von `maxActiveTranscriptBytes`, das ein
  Bytegrößenschutz für aktive Transkripte beim Turn-Start ist.
- Setzen Sie `agents.defaults.compaction.maxActiveTranscriptBytes` auf einen Bytewert oder
  eine Zeichenfolge wie `"20mb"`, um lokale Compaction vor einem Turn auszuführen, wenn das aktive
  Transkript groß wird. Dieser Schutz ist nur aktiv, wenn
  `truncateAfterCompaction` ebenfalls aktiviert ist. Lassen Sie ihn unset oder setzen Sie `0`, um
  ihn zu deaktivieren.
- Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist,
  rotiert OpenClaw das aktive Transkript nach der Compaction in eine komprimierte Nachfolger-JSONL.
  Das alte vollständige Transkript bleibt archiviert und wird vom
  Compaction-Checkpoint verlinkt, statt direkt überschrieben zu werden.

Warum: genügend Spielraum für mehrturnige „Housekeeping“-Aufgaben (wie Speicherschreibvorgänge) lassen, bevor Compaction unvermeidlich wird.

Implementierung: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aufgerufen aus `src/agents/pi-embedded-runner.ts`).

---

## Pluggable Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen Compaction-Provider registrieren. Wenn `agents.defaults.compaction.provider` auf eine registrierte Provider-ID gesetzt ist, delegiert das Safeguard-Plugin die Zusammenfassung an diesen Provider statt an die integrierte `summarizeInStages`-Pipeline.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Für die standardmäßige LLM-Zusammenfassung unset lassen.
- Das Setzen eines `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Kennungen wie der integrierte Pfad.
- Safeguard behält nach der Provider-Ausgabe weiterhin den Kontext aus jüngsten Turns und aufgeteilten Turns bei.
- Die integrierte Safeguard-Zusammenfassung destilliert frühere Zusammenfassungen mit neuen Nachrichten neu,
  statt die vollständige vorherige Zusammenfassung wortwörtlich beizubehalten.
- Der Safeguard-Modus aktiviert standardmäßig Qualitätsprüfungen für Zusammenfassungen; setzen Sie
  `qualityGuard.enabled: false`, um das Verhalten „bei fehlerhafter Ausgabe erneut versuchen“ zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw automatisch auf die integrierte LLM-Zusammenfassung zurück.
- Abbruch-/Timeout-Signale werden erneut geworfen (nicht verschluckt), um die Aufruferabbruchlogik zu respektieren.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Für Benutzer sichtbare Oberflächen

Sie können Compaction und Sitzungszustand beobachten über:

- `/status` (in jeder Chatsitzung)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ausführlicher Modus: `🧹 Auto-compaction complete` + Compaction-Anzahl

---

## Stilles Housekeeping (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen der Benutzer keine Zwischenausgabe sehen soll.

Konvention:

- Der Assistent beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` /
  `no_reply`, um anzuzeigen: „keine Antwort an den Benutzer ausliefern“.
- OpenClaw entfernt/unterdrückt dies in der Auslieferungsschicht.
- Die exakte Unterdrückung des stillen Tokens ist nicht groß-/kleinschreibungssensitiv, daher zählen `NO_REPLY` und
  `no_reply` beide, wenn die gesamte Nutzlast nur aus dem stillen Token besteht.
- Dies ist nur für echte Hintergrund-/Nichtauslieferungs-Turns gedacht; es ist keine Abkürzung für
  gewöhnliche, ausführbare Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw außerdem **Entwurfs-/Tipp-Streaming**, wenn ein
Teilchunk mit `NO_REPLY` beginnt, sodass stille Vorgänge keine Teilausgabe
während eines Turns preisgeben.

---

## „Memory Flush“ vor der Compaction (implementiert)

Ziel: Bevor Auto-Compaction ausgelöst wird, einen stillen agentischen Turn ausführen, der dauerhaften
Zustand auf die Festplatte schreibt (z. B. `memory/YYYY-MM-DD.md` im Agenten-Workspace), damit Compaction
kritischen Kontext nicht löschen kann.

OpenClaw verwendet den Ansatz **Pre-Threshold Flush**:

1. Nutzung des Sitzungskontexts überwachen.
2. Wenn sie einen „weichen Schwellenwert“ überschreitet (unterhalb von Pis Compaction-Schwelle), eine stille
   Direktive „Speicher jetzt schreiben“ an den Agenten ausführen.
3. Den exakten stillen Token `NO_REPLY` / `no_reply` verwenden, damit der Benutzer
   nichts sieht.

Konfiguration (`agents.defaults.compaction.memoryFlush`):

- `enabled` (Standard: `true`)
- `model` (optionale exakte Provider-/Modell-Überschreibung für den Flush-Turn, zum Beispiel `ollama/qwen3:8b`)
- `softThresholdTokens` (Standard: `4000`)
- `prompt` (Benutzernachricht für den Flush-Turn)
- `systemPrompt` (zusätzlicher System-Prompt, der für den Flush-Turn angehängt wird)

Hinweise:

- Der Standard-Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis, um
  Auslieferung zu unterdrücken.
- Wenn `model` gesetzt ist, verwendet der Flush-Turn dieses Modell, ohne die
  Fallback-Kette der aktiven Sitzung zu übernehmen, sodass lokales Housekeeping nicht unbemerkt
  auf ein kostenpflichtiges Konversationsmodell zurückfällt.
- Der Flush läuft einmal pro Compaction-Zyklus (nachverfolgt in `sessions.json`).
- Der Flush läuft nur für eingebettete Pi-Sitzungen (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Sitzungs-Workspace schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Memory](/de/concepts/memory) für das Workspace-Dateilayout und Schreibmuster.

Pi stellt außerdem einen `session_before_compact`-Hook in der Plugin-API bereit, aber OpenClaws
Flush-Logik liegt derzeit auf der Gateway-Seite.

---

## Fehlerbehebungs-Checkliste

- Sitzungsschlüssel falsch? Beginnen Sie mit [/concepts/session](/de/concepts/session) und bestätigen Sie den `sessionKey` in `/status`.
- Store- und Transkript-Abweichung? Bestätigen Sie den Gateway-Host und den Store-Pfad aus `openclaw status`.
- Compaction-Spam? Prüfen Sie:
  - Kontextfenster des Modells (zu klein)
  - Compaction-Einstellungen (`reserveTokens` ist für das Modellfenster zu hoch und kann frühere Compaction verursachen)
  - aufgeblähte Tool-Ergebnisse: Sitzungsbereinigung aktivieren/abstimmen
- Stille Turns geben etwas preis? Bestätigen Sie, dass die Antwort mit `NO_REPLY` beginnt (exakter Token, nicht groß-/kleinschreibungssensitiv) und dass Sie einen Build verwenden, der den Fix zur Streaming-Unterdrückung enthält.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Kontext-Engine](/de/concepts/context-engine)
