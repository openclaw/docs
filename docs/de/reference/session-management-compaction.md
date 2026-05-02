---
read_when:
    - Sie müssen Sitzungs-IDs, Transkript-JSONL oder Felder in sessions.json debuggen.
    - Sie ändern das Verhalten der automatischen Compaction oder fügen Aufräumarbeiten vor der Compaction hinzu
    - Sie möchten Speicherleerungen oder stille Systemdurchläufe implementieren
summary: 'Vertiefung: Sitzungsspeicher + Transkripte, Lebenszyklus und Interna der (Auto-)Compaction'
title: Vertiefung zur Sitzungsverwaltung
x-i18n:
    generated_at: "2026-05-02T06:45:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb2df70fb8c70f8ba8236165d9f5455b292e8a6d01d3bbfcafdd14d193df718e
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw verwaltet Sitzungen Ende zu Ende über diese Bereiche hinweg:

- **Sitzungsrouting** (wie eingehende Nachrichten einer `sessionKey` zugeordnet werden)
- **Sitzungsspeicher** (`sessions.json`) und was er nachverfolgt
- **Transkriptpersistenz** (`*.jsonl`) und ihre Struktur
- **Transkripthygiene** (Provider-spezifische Korrekturen vor Ausführungen)
- **Kontextlimits** (Kontextfenster im Vergleich zu nachverfolgten Token)
- **Compaction** (manuelle und automatische Compaction) und wo Arbeit vor der Compaction eingehängt wird
- **Stille Wartungsarbeiten** (Speicherschreibvorgänge, die keine für Benutzer sichtbare Ausgabe erzeugen sollten)

Wenn Sie zuerst einen Überblick auf höherer Ebene möchten, beginnen Sie mit:

- [Sitzungsverwaltung](/de/concepts/session)
- [Compaction](/de/concepts/compaction)
- [Speicherübersicht](/de/concepts/memory)
- [Speichersuche](/de/concepts/memory-search)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Transkripthygiene](/de/reference/transcript-hygiene)

---

## Maßgebliche Quelle: der Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum konzipiert, der den Sitzungszustand besitzt.

- UIs (macOS-App, Web-Control-UI, TUI) sollten den Gateway nach Sitzungslisten und Token-Zahlen abfragen.
- Im Remote-Modus liegen Sitzungsdateien auf dem Remote-Host; „Ihre lokalen Mac-Dateien zu prüfen“ spiegelt nicht wider, was der Gateway verwendet.

---

## Zwei Persistenzebenen

OpenClaw persistiert Sitzungen in zwei Ebenen:

1. **Sitzungsspeicher (`sessions.json`)**
   - Schlüssel/Wert-Zuordnung: `sessionKey -> SessionEntry`
   - Klein, veränderbar, sicher zu bearbeiten (oder Einträge zu löschen)
   - Verfolgt Sitzungsmetadaten (aktuelle Sitzungs-ID, letzte Aktivität, Umschalter, Token-Zähler usw.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Nur anhängbares Transkript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Unterhaltung + Tool-Aufrufe + Compaction-Zusammenfassungen
   - Wird verwendet, um den Modellkontext für zukünftige Turns neu aufzubauen
   - Große Debug-Prüfpunkte vor der Compaction werden übersprungen, sobald das aktive
     Transkript die Größenobergrenze für Prüfpunkte überschreitet. Dadurch wird eine zweite riesige
     `.checkpoint.*.jsonl`-Kopie vermieden.

---

## Speicherorte auf der Festplatte

Pro Agent auf dem Gateway-Host:

- Speicher: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkripte: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Themensitzungen: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Speicherwartung und Festplattensteuerung

Die Sitzungspersistenz verfügt über automatische Wartungssteuerungen (`session.maintenance`) für `sessions.json`, Transkriptartefakte und Trajektorien-Begleitdateien:

- `mode`: `warn` (Standard) oder `enforce`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: Obergrenze für Einträge in `sessions.json` (Standard `500`)
- `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive (Standard: wie `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Sitzungsverzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Normale Gateway-Schreibvorgänge bündeln die `maxEntries`-Bereinigung für produktionsgroße Obergrenzen. Daher kann ein Speicher die konfigurierte Obergrenze kurzzeitig überschreiten, bevor die nächste High-Water-Bereinigung ihn wieder verkleinert. Lesevorgänge des Sitzungsspeichers bereinigen oder begrenzen Einträge beim Gateway-Start nicht; verwenden Sie Schreibvorgänge oder `openclaw sessions cleanup --enforce` für die Bereinigung. `openclaw sessions cleanup --enforce` wendet die konfigurierte Obergrenze weiterhin sofort an.

Die Wartung behält dauerhafte externe Unterhaltungspointer wie Gruppensitzungen
und Thread-bezogene Chat-Sitzungen bei, aber synthetische Laufzeiteinträge für Cron, Hooks,
Heartbeat, ACP und Sub-Agents können weiterhin entfernt werden, wenn sie das
konfigurierte Alter, die Anzahl oder das Festplattenbudget überschreiten.

OpenClaw erstellt während Gateway-Schreibvorgängen keine automatischen `sessions.json.bak.*`-Rotationssicherungen mehr. Der Legacy-Schlüssel `session.maintenance.rotateBytes` wird ignoriert, und `openclaw doctor --fix` entfernt ihn aus älteren Konfigurationen.

Durchsetzungsreihenfolge für die Bereinigung des Festplattenbudgets (`mode: "enforce"`):

1. Entfernen Sie zuerst die ältesten archivierten, verwaisten Transkript- oder verwaisten Trajektorienartefakte.
2. Wenn das Ziel weiterhin überschritten wird, entfernen Sie die ältesten Sitzungseinträge und ihre Transkript-/Trajektoriendateien.
3. Fahren Sie fort, bis die Nutzung bei oder unter `highWaterBytes` liegt.

In `mode: "warn"` meldet OpenClaw potenzielle Entfernungen, verändert den Speicher oder die Dateien aber nicht.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sitzungen und Ausführungsprotokolle

Isolierte Cron-Ausführungen erstellen ebenfalls Sitzungseinträge/Transkripte und haben eigene Aufbewahrungssteuerungen:

- `cron.sessionRetention` (Standard `24h`) entfernt alte isolierte Cron-Ausführungssitzungen aus dem Sitzungsspeicher (`false` deaktiviert dies).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`-Dateien (Standardwerte: `2_000_000` Byte und `2000` Zeilen).

Wenn Cron erzwingt, dass eine neue isolierte Ausführungssitzung erstellt wird, bereinigt es den vorherigen
`cron:<jobId>`-Sitzungseintrag, bevor die neue Zeile geschrieben wird. Es übernimmt sichere
Präferenzen wie Thinking-/Fast-/Verbose-Einstellungen, Labels und explizit
vom Benutzer ausgewählte Modell-/Auth-Überschreibungen. Es verwirft umgebenden Unterhaltungskontext wie
Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Erhöhung, Ursprung und ACP-
Laufzeitbindung, damit eine frische isolierte Ausführung keine veraltete Zustellungs- oder
Laufzeitberechtigung aus einer älteren Ausführung erben kann.

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
- **Tägliches Zurücksetzen** (standardmäßig 4:00 Uhr Ortszeit auf dem Gateway-Host) erstellt eine neue `sessionId` bei der nächsten Nachricht nach der Zurücksetzungsgrenze.
- **Leerlaufablauf** (`session.reset.idleMinutes` oder Legacy `session.idleMinutes`) erstellt eine neue `sessionId`, wenn nach dem Leerlauffenster eine Nachricht eintrifft. Wenn täglich + Leerlauf beide konfiguriert sind, gewinnt das zuerst ablaufende Limit.
- **Systemereignisse** (Heartbeat, Cron-Wakeups, Exec-Benachrichtigungen, Gateway-Buchhaltung) können die Sitzungszeile verändern, verlängern aber nicht die Frische für tägliches/Leerlauf-Zurücksetzen. Der Reset-Rollover verwirft in der Warteschlange befindliche Hinweise zu Systemereignissen für die vorherige Sitzung, bevor der frische Prompt erstellt wird.
- **Übergeordnete Fork-Richtlinie** verwendet den aktiven Branch von Pi beim Erstellen eines Threads oder Sub-Agent-Forks. Wenn dieser Branch zu groß ist, startet OpenClaw das Kind mit isoliertem Kontext, anstatt fehlzuschlagen oder unbrauchbaren Verlauf zu erben. Die Größenrichtlinie ist automatisch; die Legacy-Konfiguration `session.parentForkMaxTokens` wird durch `openclaw doctor --fix` entfernt.

Implementierungsdetail: Die Entscheidung erfolgt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema des Sitzungsspeichers (`sessions.json`)

Der Werttyp des Speichers ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID (der Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `sessionStartedAt`: Startzeitstempel für die aktuelle `sessionId`; die Frische für tägliches Zurücksetzen
  verwendet diesen. Legacy-Zeilen können ihn aus dem JSONL-Sitzungsheader ableiten.
- `lastInteractionAt`: Zeitstempel der letzten echten Benutzer-/Kanalinteraktion; die Frische für Leerlauf-Zurücksetzen
  verwendet diesen, sodass Heartbeat-, Cron- und Exec-Ereignisse Sitzungen nicht
  am Leben halten. Legacy-Zeilen ohne dieses Feld fallen für die Leerlauf-Frische auf die wiederhergestellte Sitzungsstartzeit zurück.
- `updatedAt`: Zeitstempel der letzten Mutation der Speicherzeile, verwendet für Auflistung, Bereinigung und
  Buchhaltung. Er ist nicht maßgeblich für die Frische von täglichem/Leerlauf-Zurücksetzen.
- `sessionFile`: optionale explizite Überschreibung des Transkriptpfads
- `chatType`: `direct | group | room` (hilft UIs und Senderichtlinie)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Kanallabels
- Umschalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (Überschreibung pro Sitzung)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (Best-Effort / Provider-abhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft automatische Compaction für diesen Sitzungsschlüssel abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel für den letzten Speicher-Flush vor der Compaction
- `memoryFlushCompactionCount`: Compaction-Zählerstand, als der letzte Flush ausgeführt wurde

Der Speicher kann sicher bearbeitet werden, aber der Gateway ist maßgeblich: Er kann Einträge neu schreiben oder neu hydratisieren, während Sitzungen laufen.

---

## Transkriptstruktur (`*.jsonl`)

Transkripte werden vom `SessionManager` von `@mariozechner/pi-coding-agent` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Sitzungsheader (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Sitzungseinträge mit `id` + `parentId` (Baum)

Bemerkenswerte Eintragstypen:

- `message`: Benutzer-/Assistent-/toolResult-Nachrichten
- `custom_message`: von Erweiterungen eingefügte Nachrichten, die _in_ den Modellkontext eingehen (können vor der UI verborgen werden)
- `custom`: Erweiterungszustand, der _nicht_ in den Modellkontext eingeht
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren in einem Baum-Branch

OpenClaw „korrigiert“ Transkripte absichtlich **nicht**; der Gateway verwendet `SessionManager`, um sie zu lesen/schreiben.

---

## Kontextfenster im Vergleich zu nachverfolgten Token

Zwei unterschiedliche Konzepte sind wichtig:

1. **Modellkontextfenster**: harte Obergrenze pro Modell (Token, die für das Modell sichtbar sind)
2. **Zähler im Sitzungsspeicher**: fortlaufende Statistiken, die in `sessions.json` geschrieben werden (verwendet für /status und Dashboards)

Wenn Sie Limits abstimmen:

- Das Kontextfenster stammt aus dem Modellkatalog (und kann per Konfiguration überschrieben werden).
- `contextTokens` im Speicher ist ein Laufzeitschätzwert/Meldewert; behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen finden Sie unter [/token-use](/de/reference/token-use).

---

## Compaction: was es ist

Compaction fasst ältere Unterhaltung in einem persistierten `compaction`-Eintrag im Transkript zusammen und lässt aktuelle Nachrichten unverändert.

Nach der Compaction sehen zukünftige Turns:

- Die Compaction-Zusammenfassung
- Nachrichten nach `firstKeptEntryId`

Compaction ist **persistent** (anders als Sitzungsbereinigung). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Compaction-Chunk-Grenzen und Tool-Paarung

Wenn OpenClaw ein langes Transkript in Compaction-Chunks aufteilt, hält es
Assistent-Tool-Aufrufe mit ihren passenden `toolResult`-Einträgen zusammen.

- Wenn die Token-Anteil-Aufteilung zwischen einem Tool-Aufruf und seinem Ergebnis landet, verschiebt OpenClaw
  die Grenze auf die Assistent-Tool-Aufrufnachricht, anstatt das
  Paar zu trennen.
- Wenn ein nachfolgender Tool-Ergebnisblock den Chunk andernfalls über das Ziel schieben würde,
  behält OpenClaw diesen ausstehenden Tool-Block bei und lässt den nicht zusammengefassten Rest
  unverändert.
- Abgebrochene/fehlerhafte Tool-Aufrufblöcke halten keine ausstehende Aufteilung offen.

---

## Wann automatische Compaction stattfindet (Pi-Laufzeit)

Im eingebetteten Pi-Agent wird automatische Compaction in zwei Fällen ausgelöst:

1. **Überlaufwiederherstellung**: Das Modell gibt einen Kontextüberlauffehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche Provider-geprägte Varianten) → komprimieren → erneut versuchen.
2. **Schwellenwertwartung**: nach einem erfolgreichen Turn, wenn:

`contextTokens > contextWindow - reserveTokens`

Dabei gilt:

- `contextWindow` ist das Kontextfenster des Modells
- `reserveTokens` ist der für Prompts + die nächste Modellausgabe reservierte Spielraum

Dies sind Pi-Laufzeitsemantiken (OpenClaw konsumiert die Ereignisse, aber Pi entscheidet, wann komprimiert wird).

OpenClaw kann auch eine lokale Preflight-Compaction auslösen, bevor die nächste
Ausführung geöffnet wird, wenn `agents.defaults.compaction.maxActiveTranscriptBytes` gesetzt ist und die
aktive Transkriptdatei diese Größe erreicht. Dies ist ein Dateigrößenschutz für lokale
Kosten beim erneuten Öffnen, keine Roharchivierung: OpenClaw führt weiterhin die normale semantische Compaction aus,
und dafür ist `truncateAfterCompaction` erforderlich, damit die kompaktierte Zusammenfassung zu einem
neuen Nachfolge-Transkript werden kann.

Für eingebettete Pi-Ausführungen fügt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
einen optional aktivierbaren Tool-Loop-Schutz hinzu. Nachdem ein Tool-Ergebnis angehängt wurde und vor dem
nächsten Modellaufruf schätzt OpenClaw den Prompt-Druck mit derselben Preflight-
Budgetlogik, die beim Start eines Turns verwendet wird. Wenn der Kontext nicht mehr passt, führt der Schutz
keine Compaction innerhalb des `transformContext`-Hooks von Pi aus. Er löst ein strukturiertes
Mid-Turn-Precheck-Signal aus, stoppt die aktuelle Prompt-Übermittlung und lässt die
äußere Ausführungsschleife den vorhandenen Wiederherstellungspfad verwenden: übergroße Tool-Ergebnisse
abschneiden, wenn das ausreicht, oder den konfigurierten Compaction-Modus auslösen und erneut versuchen. Die
Option ist standardmäßig deaktiviert und funktioniert sowohl mit dem `default`- als auch mit dem `safeguard`-
Compaction-Modus, einschließlich Provider-gestützter Safeguard-Compaction.
Dies ist unabhängig von `maxActiveTranscriptBytes`: Der Byte-Größenschutz läuft,
bevor ein Turn geöffnet wird, während der Mid-Turn-Precheck später in der eingebetteten Pi-Tool-
Schleife läuft, nachdem neue Tool-Ergebnisse angehängt wurden.

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

OpenClaw erzwingt außerdem eine Sicherheitsuntergrenze für eingebettete Ausführungen:

- Wenn `compaction.reserveTokens < reserveTokensFloor`, hebt OpenClaw den Wert an.
- Die Standarduntergrenze beträgt `20000` Tokens.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn der Wert bereits höher ist, lässt OpenClaw ihn unverändert.
- Manuelles `/compact` berücksichtigt ein explizites `agents.defaults.compaction.keepRecentTokens`
  und behält Pis Schnittpunkt für den jüngsten Nachlauf bei. Ohne explizites Aufbewahrungsbudget
  bleibt manuelle Compaction ein harter Prüfpunkt, und der neu aufgebaute Kontext beginnt bei
  der neuen Zusammenfassung.
- Setzen Sie `agents.defaults.compaction.midTurnPrecheck.enabled: true`, um den
  optionalen Tool-Loop-Precheck nach neuen Tool-Ergebnissen und vor dem nächsten Modellaufruf auszuführen. Dies ist nur ein Auslöser; die Zusammenfassungserstellung verwendet weiterhin den konfigurierten
  Compaction-Pfad. Er ist unabhängig von `maxActiveTranscriptBytes`, einem
  Byte-Größenschutz für aktive Transkripte beim Turn-Start.
- Setzen Sie `agents.defaults.compaction.maxActiveTranscriptBytes` auf einen Byte-Wert oder
  eine Zeichenfolge wie `"20mb"`, um lokale Compaction vor einem Turn auszuführen, wenn das aktive
  Transkript groß wird. Dieser Schutz ist nur aktiv, wenn
  `truncateAfterCompaction` ebenfalls aktiviert ist. Lassen Sie den Wert ungesetzt oder setzen Sie `0`, um
  ihn zu deaktivieren.
- Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist,
  rotiert OpenClaw das aktive Transkript nach der Compaction in eine kompaktierte Nachfolge-JSONL-Datei.
  Das alte vollständige Transkript bleibt archiviert und vom
  Compaction-Prüfpunkt verlinkt, statt direkt überschrieben zu werden.

Warum: genug Spielraum für mehrstufige „Housekeeping“-Aufgaben wie Speicherschreibvorgänge lassen, bevor Compaction unvermeidbar wird.

Implementierung: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aufgerufen aus `src/agents/pi-embedded-runner.ts`).

---

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen Compaction-Provider registrieren. Wenn `agents.defaults.compaction.provider` auf eine registrierte Provider-ID gesetzt ist, delegiert die Safeguard-Erweiterung die Zusammenfassung an diesen Provider statt an die integrierte `summarizeInStages`-Pipeline.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Nicht setzen, um die standardmäßige LLM-Zusammenfassung zu verwenden.
- Das Setzen eines `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Bezeichnern wie der integrierte Pfad.
- Der Safeguard behält nach der Provider-Ausgabe weiterhin den Kontext der jüngsten Turns und den Suffix-Kontext geteilter Turns bei.
- Die integrierte Safeguard-Zusammenfassung destilliert frühere Zusammenfassungen mit neuen Nachrichten erneut,
  statt die vollständige vorherige Zusammenfassung wörtlich beizubehalten.
- Der Safeguard-Modus aktiviert standardmäßig Qualitätsaudits für Zusammenfassungen; setzen Sie
  `qualityGuard.enabled: false`, um das Verhalten für Wiederholungen bei fehlerhaft formatierter Ausgabe zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw automatisch auf die integrierte LLM-Zusammenfassung zurück.
- Abbruch-/Timeout-Signale werden erneut geworfen (nicht verschluckt), um Abbrüche des Aufrufers zu respektieren.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Für Benutzer sichtbare Oberflächen

Sie können Compaction und Sitzungsstatus über Folgendes beobachten:

- `/status` (in jeder Chat-Sitzung)
- `openclaw status` (CLI)
- `openclaw sessions` / `sessions --json`
- Ausführlicher Modus: `🧹 Auto-compaction complete` + Compaction-Zähler

---

## Stilles Housekeeping (`NO_REPLY`)

OpenClaw unterstützt „stille“ Turns für Hintergrundaufgaben, bei denen der Benutzer keine Zwischenausgabe sehen soll.

Konvention:

- Der Assistent beginnt seine Ausgabe mit dem exakten stillen Token `NO_REPLY` /
  `no_reply`, um anzuzeigen: „keine Antwort an den Benutzer ausliefern“.
- OpenClaw entfernt/unterdrückt dies in der Auslieferungsschicht.
- Die Unterdrückung des exakten stillen Tokens unterscheidet nicht nach Groß-/Kleinschreibung, daher zählen `NO_REPLY` und
  `no_reply` beide, wenn die gesamte Nutzlast nur aus dem stillen Token besteht.
- Dies ist nur für echte Hintergrund-Turns ohne Auslieferung gedacht; es ist keine Abkürzung für
  gewöhnliche, bearbeitbare Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw auch **Entwurfs-/Tippen-Streaming**, wenn ein
Teil-Chunk mit `NO_REPLY` beginnt, damit stille Vorgänge keine Teilausgabe
mitten im Turn durchsickern lassen.

---

## „Memory Flush“ vor der Compaction (implementiert)

Ziel: Bevor Auto-Compaction stattfindet, einen stillen agentischen Turn ausführen, der dauerhaften
Zustand auf die Festplatte schreibt (z. B. `memory/YYYY-MM-DD.md` im Agent-Arbeitsbereich), damit Compaction
kritischen Kontext nicht löschen kann.

OpenClaw verwendet den Ansatz **Pre-Threshold Flush**:

1. Kontextnutzung der Sitzung überwachen.
2. Wenn sie einen „weichen Schwellenwert“ überschreitet (unterhalb von Pis Compaction-Schwelle), eine stille
   „Speicher jetzt schreiben“-Anweisung an den Agent ausführen.
3. Das exakte stille Token `NO_REPLY` / `no_reply` verwenden, damit der Benutzer
   nichts sieht.

Konfiguration (`agents.defaults.compaction.memoryFlush`):

- `enabled` (Standard: `true`)
- `model` (optionale exakte Provider-/Modellüberschreibung für den Flush-Turn, zum Beispiel `ollama/qwen3:8b`)
- `softThresholdTokens` (Standard: `4000`)
- `prompt` (Benutzernachricht für den Flush-Turn)
- `systemPrompt` (zusätzlicher System-Prompt, der für den Flush-Turn angehängt wird)

Hinweise:

- Der Standard-Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis, um die
  Auslieferung zu unterdrücken.
- Wenn `model` gesetzt ist, verwendet der Flush-Turn dieses Modell, ohne die
  Fallback-Kette der aktiven Sitzung zu erben, damit rein lokales Housekeeping nicht stillschweigend
  auf ein kostenpflichtiges Konversationsmodell zurückfällt.
- Der Flush läuft einmal pro Compaction-Zyklus (nachverfolgt in `sessions.json`).
- Der Flush läuft nur für eingebettete Pi-Sitzungen (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Sitzungsarbeitsbereich schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Speicher](/de/concepts/memory) für das Dateilayout und die Schreibmuster des Arbeitsbereichs.

Pi stellt außerdem einen `session_before_compact`-Hook in der Erweiterungs-API bereit, aber OpenClaws
Flush-Logik befindet sich derzeit auf der Gateway-Seite.

---

## Checkliste zur Fehlerbehebung

- Sitzungsschlüssel falsch? Beginnen Sie mit [/concepts/session](/de/concepts/session) und bestätigen Sie den `sessionKey` in `/status`.
- Speicher und Transkript stimmen nicht überein? Bestätigen Sie den Gateway-Host und den Speicherpfad aus `openclaw status`.
- Compaction-Spam? Prüfen Sie:
  - Kontextfenster des Modells (zu klein)
  - Compaction-Einstellungen (`reserveTokens` ist zu hoch für das Modellfenster und kann frühere Compaction verursachen)
  - Aufblähung durch Tool-Ergebnisse: Sitzungsbereinigung aktivieren/abstimmen
- Stille Turns lecken? Bestätigen Sie, dass die Antwort mit `NO_REPLY` beginnt (exaktes Token, Groß-/Kleinschreibung egal) und dass Sie einen Build verwenden, der die Korrektur zur Streaming-Unterdrückung enthält.

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Kontext-Engine](/de/concepts/context-engine)
