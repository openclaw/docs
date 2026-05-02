---
read_when:
    - Sie müssen Sitzungs-IDs, Transkript-JSONL oder sessions.json-Felder debuggen
    - Sie ändern das Verhalten der Auto-Compaction oder fügen „Vor-Compaction“-Bereinigungsarbeiten hinzu
    - Sie möchten Speicherleerungen oder stille Systemrunden implementieren
summary: 'Vertiefung: Sitzungsspeicher + Transkripte, Lebenszyklus und Interna der (Auto-)Compaction'
title: Vertiefung der Sitzungsverwaltung
x-i18n:
    generated_at: "2026-05-02T21:02:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8271d7b0786e1c47a8cec6e7bd73c3c86a433d629e17937fdd87fa756ed78d73
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw verwaltet Sessions durchgängig über diese Bereiche hinweg:

- **Session-Routing** (wie eingehende Nachrichten einer `sessionKey` zugeordnet werden)
- **Session-Speicher** (`sessions.json`) und was er nachverfolgt
- **Transkript-Persistenz** (`*.jsonl`) und ihre Struktur
- **Transkript-Hygiene** (Provider-spezifische Korrekturen vor Läufen)
- **Kontextlimits** (Kontextfenster im Vergleich zu nachverfolgten Tokens)
- **Compaction** (manuelle und automatische Compaction) und wo Vorarbeiten vor der Compaction eingehängt werden
- **Stille Verwaltungsarbeiten** (Speicherschreibvorgänge, die keine für Benutzer sichtbare Ausgabe erzeugen sollen)

Wenn Sie zuerst einen Überblick auf höherer Ebene wünschen, beginnen Sie mit:

- [Session-Verwaltung](/de/concepts/session)
- [Compaction](/de/concepts/compaction)
- [Speicherüberblick](/de/concepts/memory)
- [Speichersuche](/de/concepts/memory-search)
- [Session-Bereinigung](/de/concepts/session-pruning)
- [Transkript-Hygiene](/de/reference/transcript-hygiene)

---

## Verlässliche Quelle: der Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum aufgebaut, der den Session-Zustand besitzt.

- UIs (macOS-App, Web-Control-UI, TUI) sollten den Gateway nach Session-Listen und Token-Zählungen abfragen.
- Im Remote-Modus liegen Session-Dateien auf dem Remote-Host; „Ihre lokalen Mac-Dateien zu prüfen“ spiegelt nicht wider, was der Gateway verwendet.

---

## Zwei Persistenzebenen

OpenClaw persistiert Sessions in zwei Ebenen:

1. **Session-Speicher (`sessions.json`)**
   - Schlüssel/Wert-Zuordnung: `sessionKey -> SessionEntry`
   - Klein, veränderbar, gefahrlos bearbeitbar (oder Einträge löschbar)
   - Verfolgt Session-Metadaten (aktuelle Session-ID, letzte Aktivität, Schalter, Token-Zähler usw.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Nur anhängbares Transkript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Unterhaltung + Tool-Aufrufe + Compaction-Zusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Durchläufe neu aufzubauen
   - Große Debug-Prüfpunkte vor der Compaction werden übersprungen, sobald das aktive
     Transkript die Größenobergrenze für Prüfpunkte überschreitet; dadurch wird eine zweite riesige
     `.checkpoint.*.jsonl`-Kopie vermieden.

Gateway-History-Leser sollten vermeiden, das gesamte Transkript zu materialisieren, sofern
die Oberfläche keinen beliebigen historischen Zugriff ausdrücklich benötigt. History der ersten Seite,
eingebettete Chat-History, Wiederherstellung nach Neustart sowie Token-/Nutzungsprüfungen verwenden begrenzte Tail-
Lesevorgänge. Vollständige Transkript-Scans laufen über den asynchronen Transkriptindex, der
nach Dateipfad plus `mtimeMs`/`size` zwischengespeichert und von gleichzeitigen Lesern gemeinsam genutzt wird.

---

## Speicherorte auf der Festplatte

Pro Agent auf dem Gateway-Host:

- Speicher: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkripte: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Topic-Sessions: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Speicherwartung und Festplattenkontrollen

Die Session-Persistenz verfügt über automatische Wartungskontrollen (`session.maintenance`) für `sessions.json`, Transkriptartefakte und Trajectory-Sidecars:

- `mode`: `warn` (Standard) oder `enforce`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: Obergrenze für Einträge in `sessions.json` (Standard `500`)
- `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive (Standard: wie `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Session-Verzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Normale Gateway-Schreibvorgänge laufen über einen Session-Writer pro Speicher, der prozessinterne Mutationen serialisiert, ohne eine Laufzeit-Dateisperre zu nehmen. Hot-Path-Patch-Hilfsfunktionen leihen sich den validierten veränderbaren Cache, während sie diesen Writer-Slot halten, sodass große `sessions.json`-Dateien nicht für jede Metadatenaktualisierung geklont oder erneut gelesen werden. Laufzeitcode sollte `updateSessionStore(...)` oder `updateSessionStoreEntry(...)` bevorzugen; direkte Speicherungen des gesamten Speichers sind Werkzeuge für Kompatibilität und Offline-Wartung. Wenn ein Gateway erreichbar ist, delegieren nicht trockene Läufe von `openclaw sessions cleanup` und `openclaw agents delete` Speichermutationen an den Gateway, sodass die Bereinigung dieselbe Writer-Warteschlange nutzt; `--store <path>` ist der explizite Offline-Reparaturpfad für direkte Dateiwartung. Die `maxEntries`-Bereinigung ist für produktionsgroße Obergrenzen weiterhin gebündelt, sodass ein Speicher die konfigurierte Obergrenze kurzzeitig überschreiten kann, bevor die nächste High-Water-Bereinigung ihn wieder herunterschreibt. Lesevorgänge des Session-Speichers bereinigen oder begrenzen beim Gateway-Start keine Einträge; verwenden Sie Schreibvorgänge oder `openclaw sessions cleanup --enforce` für die Bereinigung. `openclaw sessions cleanup --enforce` wendet die konfigurierte Obergrenze weiterhin sofort an.

Die Wartung behält dauerhafte externe Unterhaltungspointer wie Gruppen-Sessions
und thread-bezogene Chat-Sessions bei, aber synthetische Laufzeiteinträge für Cron, Hooks,
Heartbeat, ACP und Sub-Agents können weiterhin entfernt werden, wenn sie das
konfigurierte Alters-, Zähl- oder Festplattenbudget überschreiten.

OpenClaw erstellt bei Gateway-Schreibvorgängen keine automatischen `sessions.json.bak.*`-Rotationsbackups mehr. Der veraltete Schlüssel `session.maintenance.rotateBytes` wird ignoriert und `openclaw doctor --fix` entfernt ihn aus älteren Konfigurationen.

Transkriptmutationen verwenden eine Session-Schreibsperre auf der Transkriptdatei. Der Erwerb der Sperre wartet bis zu
`session.writeLock.acquireTimeoutMs`, bevor ein Fehler wegen beschäftigter Session ausgegeben wird; der Standard ist `60000`
ms. Erhöhen Sie dies nur, wenn legitime Vorbereitungs-, Bereinigungs-, Compaction- oder Transkriptspiegelungsarbeiten
auf langsamen Maschinen länger konkurrieren. Erkennung veralteter Sperren und Warnungen zur maximalen Haltedauer bleiben separate Richtlinien.

Reihenfolge der Durchsetzung bei Bereinigung des Festplattenbudgets (`mode: "enforce"`):

1. Entfernen Sie zuerst die ältesten archivierten, verwaisten Transkript- oder verwaisten Trajectory-Artefakte.
2. Wenn die Nutzung weiterhin über dem Ziel liegt, entfernen Sie die ältesten Session-Einträge und ihre Transkript-/Trajectory-Dateien.
3. Fahren Sie fort, bis die Nutzung bei oder unter `highWaterBytes` liegt.

In `mode: "warn"` meldet OpenClaw potenzielle Entfernungen, mutiert aber weder Speicher noch Dateien.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sessions und Laufprotokolle

Isolierte Cron-Läufe erstellen ebenfalls Session-Einträge/Transkripte und haben eigene Aufbewahrungskontrollen:

- `cron.sessionRetention` (Standard `24h`) bereinigt alte isolierte Cron-Lauf-Sessions aus dem Session-Speicher (`false` deaktiviert dies).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`-Dateien (Standardwerte: `2_000_000` Bytes und `2000` Zeilen).

Wenn Cron eine neue isolierte Lauf-Session erzwingt, bereinigt es den vorherigen
`cron:<jobId>`-Session-Eintrag, bevor die neue Zeile geschrieben wird. Es übernimmt sichere
Einstellungen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und explizite
vom Benutzer ausgewählte Modell-/Auth-Überschreibungen. Es verwirft umgebenden Unterhaltungskontext wie
Channel-/Gruppen-Routing, Sende- oder Warteschlangenrichtlinien, Elevation, Ursprung und ACP-
Laufzeitbindung, sodass ein frischer isolierter Lauf keine veraltete Zustell- oder
Laufzeitautorität aus einem älteren Lauf erben kann.

---

## Session-Schlüssel (`sessionKey`)

Eine `sessionKey` identifiziert, _in welchem Unterhaltungseimer_ Sie sich befinden (Routing + Isolation).

Häufige Muster:

- Haupt-/Direktchat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Channel (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (sofern nicht überschrieben)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Session-IDs (`sessionId`)

Jede `sessionKey` verweist auf eine aktuelle `sessionId` (die Transkriptdatei, die die Unterhaltung fortsetzt).

Faustregeln:

- **Zurücksetzen** (`/new`, `/reset`) erstellt eine neue `sessionId` für diese `sessionKey`.
- **Tägliches Zurücksetzen** (standardmäßig 4:00 Uhr lokale Zeit auf dem Gateway-Host) erstellt bei der nächsten Nachricht nach der Zurücksetzungsgrenze eine neue `sessionId`.
- **Ablauf bei Inaktivität** (`session.reset.idleMinutes` oder veraltet `session.idleMinutes`) erstellt eine neue `sessionId`, wenn nach dem Inaktivitätsfenster eine Nachricht eintrifft. Wenn täglich + Inaktivität beide konfiguriert sind, gewinnt dasjenige, das zuerst abläuft.
- **Systemereignisse** (Heartbeat, Cron-Weckrufe, Exec-Benachrichtigungen, Gateway-Buchführung) können die Session-Zeile mutieren, verlängern aber nicht die Frische für tägliches Zurücksetzen/Inaktivitätszurücksetzung. Ein Zurücksetzungs-Rollover verwirft Systemereignis-Hinweise in der Warteschlange für die vorherige Session, bevor der frische Prompt erstellt wird.
- **Parent-Fork-Richtlinie** verwendet den aktiven Branch von PI beim Erstellen eines Thread- oder Subagent-Forks. Wenn dieser Branch zu groß ist, startet OpenClaw das Child mit isoliertem Kontext, statt fehlzuschlagen oder unbrauchbare History zu erben. Die Größenrichtlinie ist automatisch; die veraltete Konfiguration `session.parentForkMaxTokens` wird durch `openclaw doctor --fix` entfernt.

Implementierungsdetail: Die Entscheidung erfolgt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema des Session-Speichers (`sessions.json`)

Der Werttyp des Speichers ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID (der Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `sessionStartedAt`: Startzeitstempel für die aktuelle `sessionId`; die Frische für tägliches Zurücksetzen
  verwendet dies. Veraltete Zeilen können ihn aus dem JSONL-Session-Header ableiten.
- `lastInteractionAt`: Zeitstempel der letzten echten Benutzer-/Channel-Interaktion; die Frische für Inaktivitätszurücksetzung
  verwendet dies, sodass Heartbeat-, Cron- und Exec-Ereignisse Sessions nicht
  am Leben halten. Veraltete Zeilen ohne dieses Feld fallen für Inaktivitätsfrische auf die wiederhergestellte Session-Startzeit
  zurück.
- `updatedAt`: Zeitstempel der letzten Mutation der Speicherzeile, verwendet für Auflistung, Bereinigung und
  Buchführung. Er ist nicht maßgeblich für die Frische des täglichen Zurücksetzens oder der Inaktivitätszurücksetzung.
- `sessionFile`: optionale explizite Überschreibung des Transkriptpfads
- `chatType`: `direct | group | room` (hilft UIs und Senderichtlinien)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Channel-Beschriftung
- Schalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (Überschreibung pro Session)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (Best-Effort / Provider-abhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft die automatische Compaction für diesen Session-Schlüssel abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel für den letzten Speicher-Flush vor der Compaction
- `memoryFlushCompactionCount`: Compaction-Zählung, als der letzte Flush lief

Der Speicher kann gefahrlos bearbeitet werden, aber der Gateway ist maßgeblich: Er kann Einträge umschreiben oder erneut hydrieren, während Sessions laufen.

---

## Transkriptstruktur (`*.jsonl`)

Transkripte werden vom `SessionManager` von `@mariozechner/pi-coding-agent` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Session-Header (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Session-Einträge mit `id` + `parentId` (Baum)

Bemerkenswerte Eintragstypen:

- `message`: Benutzer-/Assistent-/ToolResult-Nachrichten
- `custom_message`: von Plugins eingefügte Nachrichten, die _in_ den Modellkontext eingehen (können in der UI verborgen sein)
- `custom`: Plugin-Zustand, der _nicht_ in den Modellkontext eingeht
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren eines Baum-Branches

OpenClaw „korrigiert“ Transkripte absichtlich **nicht**; der Gateway verwendet `SessionManager`, um sie zu lesen/schreiben.

---

## Kontextfenster im Vergleich zu nachverfolgten Tokens

Zwei unterschiedliche Konzepte sind wichtig:

1. **Modellkontextfenster**: harte Obergrenze pro Modell (Tokens, die für das Modell sichtbar sind)
2. **Session-Speicherzähler**: fortlaufende Statistiken, die in `sessions.json` geschrieben werden (verwendet für /status und Dashboards)

Wenn Sie Limits abstimmen:

- Das Kontextfenster stammt aus dem Modellkatalog (und kann per Konfiguration überschrieben werden).
- `contextTokens` im Speicher ist ein Laufzeit-Schätz-/Berichtswert; behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen finden Sie unter [/token-use](/de/reference/token-use).

---

## Compaction: was sie ist

Compaction fasst ältere Unterhaltung in einem persistierten `compaction`-Eintrag im Transkript zusammen und behält aktuelle Nachrichten unverändert bei.

Nach der Compaction sehen zukünftige Durchläufe:

- Die Compaction-Zusammenfassung
- Nachrichten nach `firstKeptEntryId`

Compaction ist **persistent** (anders als Session-Bereinigung). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Compaction-Chunk-Grenzen und Tool-Paarung

Wenn OpenClaw ein langes Transkript in Compaction-Chunks aufteilt, hält es
Assistant-Tool-Aufrufe mit ihren passenden `toolResult`-Einträgen gepaart.

- Wenn die Token-Anteil-Aufteilung zwischen einem Tool-Aufruf und seinem Ergebnis liegt, verschiebt OpenClaw
  die Grenze zur Assistant-Tool-Aufrufnachricht, statt das Paar zu trennen.
- Wenn ein abschließender Tool-Ergebnisblock den Chunk sonst über das Ziel hinaus schieben würde,
  bewahrt OpenClaw diesen ausstehenden Tool-Block und hält das nicht zusammengefasste Ende
  intakt.
- Abgebrochene/fehlerhafte Tool-Aufrufblöcke halten keine ausstehende Aufteilung offen.

---

## Wann Auto-Compaction geschieht (Pi-Laufzeit)

Im eingebetteten Pi-Agenten wird Auto-Compaction in zwei Fällen ausgelöst:

1. **Überlauf-Wiederherstellung**: Das Modell gibt einen Kontextüberlauffehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche Provider-geformte Varianten) → komprimieren → erneut versuchen.
2. **Schwellenwert-Wartung**: nach einem erfolgreichen Turn, wenn:

`contextTokens > contextWindow - reserveTokens`

Dabei gilt:

- `contextWindow` ist das Kontextfenster des Modells
- `reserveTokens` ist der für Prompts + die nächste Modellausgabe reservierte Spielraum

Dies sind Semantiken der Pi-Laufzeit (OpenClaw verarbeitet die Ereignisse, aber Pi entscheidet, wann komprimiert wird).

OpenClaw kann außerdem eine lokale Preflight-Compaction auslösen, bevor der nächste
Run geöffnet wird, wenn `agents.defaults.compaction.maxActiveTranscriptBytes` gesetzt ist und die
aktive Transkriptdatei diese Größe erreicht. Dies ist ein Dateigrößenschutz für lokale
Wiederöffnungskosten, keine rohe Archivierung: OpenClaw führt weiterhin normale semantische Compaction aus,
und es erfordert `truncateAfterCompaction`, damit die komprimierte Zusammenfassung zu einem
neuen Nachfolge-Transkript werden kann.

Für eingebettete Pi-Runs fügt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
einen optional aktivierbaren Tool-Loop-Schutz hinzu. Nachdem ein Tool-Ergebnis angehängt wurde und vor dem
nächsten Modellaufruf schätzt OpenClaw den Prompt-Druck mit derselben Preflight-
Budgetlogik, die zu Turn-Beginn verwendet wird. Wenn der Kontext nicht mehr passt, komprimiert der Schutz
nicht innerhalb von Pis `transformContext`-Hook. Er löst ein strukturiertes
Mid-Turn-Precheck-Signal aus, stoppt die aktuelle Prompt-Übermittlung und lässt die
äußere Run-Schleife den bestehenden Wiederherstellungspfad nutzen: übergroße Tool-Ergebnisse
abschneiden, wenn das genügt, oder den konfigurierten Compaction-Modus auslösen und erneut versuchen. Die
Option ist standardmäßig deaktiviert und funktioniert sowohl mit dem `default`- als auch dem `safeguard`-
Compaction-Modus, einschließlich Provider-gestützter Safeguard-Compaction.
Dies ist unabhängig von `maxActiveTranscriptBytes`: Der Bytegrößenschutz läuft
vor dem Öffnen eines Turns, während Mid-Turn-Precheck später im eingebetteten Pi-Tool-
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

- Wenn `compaction.reserveTokens < reserveTokensFloor`, hebt OpenClaw den Wert an.
- Die Standarduntergrenze beträgt `20000` Token.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn der Wert bereits höher ist, lässt OpenClaw ihn unverändert.
- Manuelles `/compact` berücksichtigt ein explizites `agents.defaults.compaction.keepRecentTokens`
  und behält Pis Schnittpunkt für das jüngste Ende bei. Ohne ein explizites Behaltungsbudget
  bleibt manuelle Compaction ein harter Checkpoint, und der neu aufgebaute Kontext beginnt bei
  der neuen Zusammenfassung.
- Setzen Sie `agents.defaults.compaction.midTurnPrecheck.enabled: true`, um den
  optionalen Tool-Loop-Precheck nach neuen Tool-Ergebnissen und vor dem nächsten Modell-
  Aufruf auszuführen. Dies ist nur ein Auslöser; die Zusammenfassungserzeugung nutzt weiterhin den konfigurierten
  Compaction-Pfad. Sie ist unabhängig von `maxActiveTranscriptBytes`, das ein
  Bytegrößenschutz für aktive Transkripte zu Turn-Beginn ist.
- Setzen Sie `agents.defaults.compaction.maxActiveTranscriptBytes` auf einen Bytewert oder
  eine Zeichenkette wie `"20mb"`, um lokale Compaction vor einem Turn auszuführen, wenn das aktive
  Transkript groß wird. Dieser Schutz ist nur aktiv, wenn
  `truncateAfterCompaction` ebenfalls aktiviert ist. Lassen Sie den Wert ungesetzt oder setzen Sie ihn auf `0`, um
  ihn zu deaktivieren.
- Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist,
  rotiert OpenClaw das aktive Transkript nach der Compaction zu einer komprimierten Nachfolge-JSONL-Datei.
  Das alte vollständige Transkript bleibt archiviert und wird vom
  Compaction-Checkpoint verlinkt, statt direkt überschrieben zu werden.

Warum: genügend Spielraum für mehrturnige „Verwaltungsaufgaben“ (wie Speicher-Schreibvorgänge) lassen, bevor Compaction unvermeidbar wird.

Implementierung: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aufgerufen aus `src/agents/pi-embedded-runner.ts`).

---

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen Compaction-Provider registrieren. Wenn `agents.defaults.compaction.provider` auf eine registrierte Provider-ID gesetzt ist, delegiert die Safeguard-Erweiterung die Zusammenfassung an diesen Provider statt an die eingebaute `summarizeInStages`-Pipeline.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Für die standardmäßige LLM-Zusammenfassung ungesetzt lassen.
- Das Setzen eines `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Identifier-Erhaltung wie der eingebaute Pfad.
- Der Safeguard bewahrt nach der Provider-Ausgabe weiterhin jüngsten Turn- und Split-Turn-Suffixkontext.
- Die eingebaute Safeguard-Zusammenfassung destilliert frühere Zusammenfassungen mit neuen Nachrichten
  erneut, statt die vollständige vorherige Zusammenfassung wortgetreu zu bewahren.
- Der Safeguard-Modus aktiviert standardmäßig Qualitätsaudits für Zusammenfassungen; setzen Sie
  `qualityGuard.enabled: false`, um das Verhalten „bei fehlerhaft geformter Ausgabe erneut versuchen“ zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw automatisch auf die eingebaute LLM-Zusammenfassung zurück.
- Abort-/Timeout-Signale werden erneut ausgelöst (nicht geschluckt), um die Abbruchanforderung des Aufrufers zu respektieren.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Für Benutzer sichtbare Oberflächen

Sie können Compaction und Sitzungszustand beobachten über:

- `/status` (in jeder Chatsitzung)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ausführlicher Modus: `🧹 Auto-compaction complete` + Compaction-Anzahl

---

## Stille Verwaltungsaufgaben (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen der Benutzer keine Zwischenausgabe sehen soll.

Konvention:

- Der Assistant beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` /
  `no_reply`, um „keine Antwort an den Benutzer zustellen“ anzuzeigen.
- OpenClaw entfernt/unterdrückt dies in der Zustellungsschicht.
- Die exakte Unterdrückung des stillen Tokens ist nicht groß-/kleinschreibungssensitiv, sodass `NO_REPLY` und
  `no_reply` beide zählen, wenn die gesamte Nutzlast nur das stille Token ist.
- Dies ist nur für echte Hintergrund-/Nichtzustellungs-Turns gedacht; es ist keine Abkürzung für
  gewöhnliche, handlungsrelevante Benutzeranfragen.

Ab `2026.1.10` unterdrückt OpenClaw außerdem **Entwurfs-/Typing-Streaming**, wenn ein
Teil-Chunk mit `NO_REPLY` beginnt, damit stille Vorgänge keine teilweise
Ausgabe mitten im Turn preisgeben.

---

## „Memory Flush“ vor der Compaction (implementiert)

Ziel: Bevor Auto-Compaction geschieht, einen stillen agentischen Turn ausführen, der dauerhaften
Zustand auf die Festplatte schreibt (z. B. `memory/YYYY-MM-DD.md` im Agent-Arbeitsbereich), damit Compaction
kritischen Kontext nicht löschen kann.

OpenClaw verwendet den Ansatz **Pre-Threshold Flush**:

1. Sitzungs-Kontextnutzung überwachen.
2. Wenn sie eine „weiche Schwelle“ überschreitet (unterhalb von Pis Compaction-Schwelle), eine stille
   Anweisung „Speicher jetzt schreiben“ an den Agenten ausführen.
3. Das exakte stille Token `NO_REPLY` / `no_reply` verwenden, damit der Benutzer
   nichts sieht.

Konfiguration (`agents.defaults.compaction.memoryFlush`):

- `enabled` (Standard: `true`)
- `model` (optionale exakte Provider-/Modellüberschreibung für den Flush-Turn, zum Beispiel `ollama/qwen3:8b`)
- `softThresholdTokens` (Standard: `4000`)
- `prompt` (Benutzernachricht für den Flush-Turn)
- `systemPrompt` (zusätzlicher System-Prompt, der für den Flush-Turn angehängt wird)

Hinweise:

- Der Standard-Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis, um
  Zustellung zu unterdrücken.
- Wenn `model` gesetzt ist, verwendet der Flush-Turn dieses Modell, ohne die
  Fallback-Kette der aktiven Sitzung zu erben, sodass lokale Verwaltungsaufgaben nicht stillschweigend
  auf ein kostenpflichtiges Konversationsmodell zurückfallen.
- Der Flush läuft einmal pro Compaction-Zyklus (nachverfolgt in `sessions.json`).
- Der Flush läuft nur für eingebettete Pi-Sitzungen (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Sitzungs-Arbeitsbereich schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Memory](/de/concepts/memory) für das Workspace-Dateilayout und Schreibmuster.

Pi stellt außerdem einen `session_before_compact`-Hook in der Erweiterungs-API bereit, aber OpenClaws
Flush-Logik lebt heute auf der Gateway-Seite.

---

## Checkliste zur Fehlerbehebung

- Sitzungsschlüssel falsch? Beginnen Sie mit [/concepts/session](/de/concepts/session) und bestätigen Sie den `sessionKey` in `/status`.
- Store- und Transkript-Abweichung? Bestätigen Sie den Gateway-Host und den Store-Pfad aus `openclaw status`.
- Compaction-Spam? Prüfen Sie:
  - Kontextfenster des Modells (zu klein)
  - Compaction-Einstellungen (`reserveTokens` ist für das Modellfenster zu hoch und kann frühere Compaction verursachen)
  - aufgeblähte Tool-Ergebnisse: Sitzungsbereinigung aktivieren/abstimmen
- Stille Turns geben etwas preis? Bestätigen Sie, dass die Antwort mit `NO_REPLY` beginnt (exaktes Token, nicht groß-/kleinschreibungssensitiv) und dass Sie einen Build verwenden, der den Streaming-Unterdrückungsfix enthält.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Kontext-Engine](/de/concepts/context-engine)
