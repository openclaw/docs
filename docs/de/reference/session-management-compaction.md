---
read_when:
    - Sie müssen Sitzungs-IDs, Transkript-JSONL oder sessions.json-Felder debuggen
    - Sie ändern das Auto-Compaction-Verhalten oder fügen „Pre-Compaction“-Aufräumarbeiten hinzu
    - Sie möchten Memory Flushes oder stille System-Turns implementieren
summary: 'Detaillierte Betrachtung: Sitzungsspeicher + Transkripte, Lebenszyklus und Interna der (Auto-)Compaction'
title: Vertiefung zur Sitzungsverwaltung
x-i18n:
    generated_at: "2026-04-30T16:30:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5a6a7031cebd90d27784a32a0d0378ea9959249389d209f0745395f90b8a0df9
    source_path: reference/session-management-compaction.md
    workflow: 16
---

OpenClaw verwaltet Sitzungen Ende-zu-Ende über diese Bereiche hinweg:

- **Sitzungsrouting** (wie eingehende Nachrichten einer `sessionKey` zugeordnet werden)
- **Sitzungsspeicher** (`sessions.json`) und was er nachverfolgt
- **Transkriptpersistenz** (`*.jsonl`) und ihre Struktur
- **Transkripthygiene** (Provider-spezifische Korrekturen vor Läufen)
- **Kontextgrenzen** (Kontextfenster vs. nachverfolgte Tokens)
- **Compaction** (manuelle und automatische Compaction) und wo Vorarbeiten vor der Compaction eingehängt werden
- **Stille Hintergrundpflege** (Speicher-Schreibvorgänge, die keine für Benutzer sichtbare Ausgabe erzeugen sollten)

Wenn Sie zuerst einen Überblick auf höherer Ebene wünschen, beginnen Sie mit:

- [Sitzungsverwaltung](/de/concepts/session)
- [Compaction](/de/concepts/compaction)
- [Speicherübersicht](/de/concepts/memory)
- [Speichersuche](/de/concepts/memory-search)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
- [Transkripthygiene](/de/reference/transcript-hygiene)

---

## Quelle der Wahrheit: der Gateway

OpenClaw ist um einen einzelnen **Gateway-Prozess** herum entworfen, der den Sitzungszustand besitzt.

- UIs (macOS-App, Web-Control-UI, TUI) sollten den Gateway nach Sitzungslisten und Token-Zahlen abfragen.
- Im Remote-Modus liegen Sitzungsdateien auf dem Remote-Host; „Ihre lokalen Mac-Dateien zu prüfen“ spiegelt nicht wider, was der Gateway verwendet.

---

## Zwei Persistenzschichten

OpenClaw persistiert Sitzungen in zwei Schichten:

1. **Sitzungsspeicher (`sessions.json`)**
   - Schlüssel/Wert-Zuordnung: `sessionKey -> SessionEntry`
   - Klein, veränderbar, sicher zu bearbeiten (oder Einträge zu löschen)
   - Verfolgt Sitzungsmetadaten (aktuelle Sitzungs-ID, letzte Aktivität, Schalter, Token-Zähler usw.)

2. **Transkript (`<sessionId>.jsonl`)**
   - Nur anhängbares Transkript mit Baumstruktur (Einträge haben `id` + `parentId`)
   - Speichert die eigentliche Unterhaltung + Tool-Aufrufe + Compaction-Zusammenfassungen
   - Wird verwendet, um den Modellkontext für künftige Durchläufe wieder aufzubauen
   - Große Debug-Prüfpunkte vor der Compaction werden übersprungen, sobald das aktive
     Transkript die Größenobergrenze für Prüfpunkte überschreitet, wodurch eine zweite riesige
     `.checkpoint.*.jsonl`-Kopie vermieden wird.

---

## Speicherorte auf dem Datenträger

Pro Agent auf dem Gateway-Host:

- Speicher: `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- Transkripte: `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram-Themensitzungen: `.../<sessionId>-topic-<threadId>.jsonl`

OpenClaw löst diese über `src/config/sessions.ts` auf.

---

## Speicherpflege und Datenträgersteuerung

Die Sitzungspersistenz verfügt über automatische Wartungssteuerungen (`session.maintenance`) für `sessions.json`, Transkriptartefakte und Trajektorien-Sidecars:

- `mode`: `warn` (Standard) oder `enforce`
- `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`)
- `maxEntries`: Obergrenze für Einträge in `sessions.json` (Standard `500`)
- `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive (Standard: identisch mit `pruneAfter`; `false` deaktiviert die Bereinigung)
- `maxDiskBytes`: optionales Budget für das Sitzungsverzeichnis
- `highWaterBytes`: optionales Ziel nach der Bereinigung (Standard `80%` von `maxDiskBytes`)

Normale Gateway-Schreibvorgänge bündeln die `maxEntries`-Bereinigung für produktionsgroße Obergrenzen, sodass ein Speicher die konfigurierte Obergrenze kurzzeitig überschreiten kann, bevor die nächste High-Water-Bereinigung ihn wieder darunter schreibt. `openclaw sessions cleanup --enforce` wendet die konfigurierte Obergrenze weiterhin sofort an.

OpenClaw erstellt bei Gateway-Schreibvorgängen keine automatischen rotierenden `sessions.json.bak.*`-Sicherungen mehr. Der Legacy-Schlüssel `session.maintenance.rotateBytes` wird ignoriert, und `openclaw doctor --fix` entfernt ihn aus älteren Konfigurationen.

Durchsetzungsreihenfolge für die Bereinigung des Datenträgerbudgets (`mode: "enforce"`):

1. Entfernen Sie zuerst die ältesten archivierten, verwaisten Transkript- oder verwaisten Trajektorienartefakte.
2. Wenn die Nutzung weiterhin über dem Ziel liegt, entfernen Sie die ältesten Sitzungseinträge und ihre Transkript-/Trajektoriendateien.
3. Fahren Sie fort, bis die Nutzung bei oder unter `highWaterBytes` liegt.

In `mode: "warn"` meldet OpenClaw mögliche Entfernungen, verändert aber weder Speicher noch Dateien.

Wartung bei Bedarf ausführen:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

---

## Cron-Sitzungen und Laufprotokolle

Isolierte Cron-Läufe erstellen ebenfalls Sitzungseinträge/Transkripte und verfügen über eigene Aufbewahrungssteuerungen:

- `cron.sessionRetention` (Standard `24h`) entfernt alte isolierte Cron-Laufsitzungen aus dem Sitzungsspeicher (`false` deaktiviert dies).
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` bereinigen `~/.openclaw/cron/runs/<jobId>.jsonl`-Dateien (Standards: `2_000_000` Bytes und `2000` Zeilen).

Wenn Cron eine neue isolierte Laufsitzung erzwingt, bereinigt es den vorherigen
`cron:<jobId>`-Sitzungseintrag, bevor die neue Zeile geschrieben wird. Es übernimmt sichere
Präferenzen wie Einstellungen für Denken/Schnell/ausführlich, Labels und explizite
vom Benutzer ausgewählte Modell-/Auth-Überschreibungen. Es entfernt umgebenden Unterhaltungskontext wie
Kanal-/Gruppenrouting, Sende- oder Warteschlangenrichtlinie, Erhöhung, Ursprung und ACP-
Laufzeitbindung, damit ein neuer isolierter Lauf keine veraltete Zustellungs- oder
Laufzeitautorität von einem älteren Lauf erben kann.

---

## Sitzungsschlüssel (`sessionKey`)

Eine `sessionKey` identifiziert, _in welchem Unterhaltungs-Bucket_ Sie sich befinden (Routing + Isolation).

Häufige Muster:

- Haupt-/Direktchat (pro Agent): `agent:<agentId>:<mainKey>` (Standard `main`)
- Gruppe: `agent:<agentId>:<channel>:group:<id>`
- Raum/Kanal (Discord/Slack): `agent:<agentId>:<channel>:channel:<id>` oder `...:room:<id>`
- Cron: `cron:<job.id>`
- Webhook: `hook:<uuid>` (sofern nicht überschrieben)

Die kanonischen Regeln sind unter [/concepts/session](/de/concepts/session) dokumentiert.

---

## Sitzungs-IDs (`sessionId`)

Jede `sessionKey` verweist auf eine aktuelle `sessionId` (die Transkriptdatei, die die Unterhaltung fortsetzt).

Faustregeln:

- **Zurücksetzen** (`/new`, `/reset`) erstellt eine neue `sessionId` für diese `sessionKey`.
- **Tägliches Zurücksetzen** (standardmäßig 4:00 Uhr Ortszeit auf dem Gateway-Host) erstellt bei der nächsten Nachricht nach der Reset-Grenze eine neue `sessionId`.
- **Leerlaufablauf** (`session.reset.idleMinutes` oder Legacy `session.idleMinutes`) erstellt eine neue `sessionId`, wenn nach dem Leerlauffenster eine Nachricht eingeht. Wenn täglich + Leerlauf beide konfiguriert sind, gewinnt die Grenze, die zuerst abläuft.
- **Systemereignisse** (Heartbeat, Cron-Weckrufe, Exec-Benachrichtigungen, Gateway-Buchhaltung) können die Sitzungszeile verändern, verlängern aber nicht die Frische für tägliche/Leerlauf-Resets. Ein Reset-Rollover verwirft eingereihte Systemereignis-Hinweise für die vorherige Sitzung, bevor der neue Prompt erstellt wird.
- **Thread-Parent-Fork-Schutz** (`session.parentForkMaxTokens`, Standard `100000`) überspringt das Forken des übergeordneten Transkripts, wenn die übergeordnete Sitzung bereits zu groß ist; der neue Thread startet frisch. Setzen Sie `0`, um dies zu deaktivieren.

Implementierungsdetail: Die Entscheidung erfolgt in `initSessionState()` in `src/auto-reply/reply/session.ts`.

---

## Schema des Sitzungsspeichers (`sessions.json`)

Der Werttyp des Speichers ist `SessionEntry` in `src/config/sessions.ts`.

Wichtige Felder (nicht vollständig):

- `sessionId`: aktuelle Transkript-ID (der Dateiname wird daraus abgeleitet, sofern `sessionFile` nicht gesetzt ist)
- `sessionStartedAt`: Startzeitstempel für die aktuelle `sessionId`; die Frische für das tägliche Zurücksetzen
  verwendet diesen Wert. Legacy-Zeilen können ihn aus dem JSONL-Sitzungsheader ableiten.
- `lastInteractionAt`: Zeitstempel der letzten echten Benutzer-/Kanalinteraktion; die Frische für das Leerlauf-Zurücksetzen
  verwendet diesen Wert, sodass Heartbeat-, Cron- und Exec-Ereignisse Sitzungen nicht
  am Leben halten. Legacy-Zeilen ohne dieses Feld fallen für die Leerlauffrische auf die wiederhergestellte Sitzungsstartzeit
  zurück.
- `updatedAt`: Zeitstempel der letzten Speicherzeilenänderung, verwendet für Auflistung, Bereinigung und
  Buchhaltung. Er ist nicht maßgeblich für die Frische von täglichem/Leerlauf-Zurücksetzen.
- `sessionFile`: optionale explizite Überschreibung des Transkriptpfads
- `chatType`: `direct | group | room` (hilft UIs und Senderichtlinie)
- `provider`, `subject`, `room`, `space`, `displayName`: Metadaten für Gruppen-/Kanalbeschriftung
- Schalter:
  - `thinkingLevel`, `verboseLevel`, `reasoningLevel`, `elevatedLevel`
  - `sendPolicy` (sitzungsbezogene Überschreibung)
- Modellauswahl:
  - `providerOverride`, `modelOverride`, `authProfileOverride`
- Token-Zähler (Best-Effort / Provider-abhängig):
  - `inputTokens`, `outputTokens`, `totalTokens`, `contextTokens`
- `compactionCount`: wie oft die automatische Compaction für diesen Sitzungsschlüssel abgeschlossen wurde
- `memoryFlushAt`: Zeitstempel für die letzte Speicherspülung vor der Compaction
- `memoryFlushCompactionCount`: Compaction-Zählerstand, als die letzte Spülung lief

Der Speicher kann sicher bearbeitet werden, aber der Gateway ist maßgeblich: Er kann Einträge neu schreiben oder rehydrieren, während Sitzungen laufen.

---

## Transkriptstruktur (`*.jsonl`)

Transkripte werden vom `SessionManager` von `@mariozechner/pi-coding-agent` verwaltet.

Die Datei ist JSONL:

- Erste Zeile: Sitzungsheader (`type: "session"`, enthält `id`, `cwd`, `timestamp`, optional `parentSession`)
- Danach: Sitzungseinträge mit `id` + `parentId` (Baum)

Bemerkenswerte Eintragstypen:

- `message`: Benutzer-/Assistent-/`toolResult`-Nachrichten
- `custom_message`: von Erweiterungen eingefügte Nachrichten, die _in_ den Modellkontext eingehen (können in der UI verborgen werden)
- `custom`: Erweiterungszustand, der _nicht_ in den Modellkontext eingeht
- `compaction`: persistierte Compaction-Zusammenfassung mit `firstKeptEntryId` und `tokensBefore`
- `branch_summary`: persistierte Zusammenfassung beim Navigieren in einem Baumzweig

OpenClaw führt absichtlich keine „Korrekturen“ an Transkripten durch; der Gateway verwendet `SessionManager`, um sie zu lesen/zu schreiben.

---

## Kontextfenster vs. nachverfolgte Tokens

Zwei unterschiedliche Konzepte sind wichtig:

1. **Modellkontextfenster**: harte Obergrenze pro Modell (für das Modell sichtbare Tokens)
2. **Zähler im Sitzungsspeicher**: fortlaufende Statistiken, die in `sessions.json` geschrieben werden (verwendet für /status und Dashboards)

Wenn Sie Grenzen abstimmen:

- Das Kontextfenster stammt aus dem Modellkatalog (und kann über die Konfiguration überschrieben werden).
- `contextTokens` im Speicher ist ein Laufzeit-Schätz-/Meldewert; behandeln Sie ihn nicht als strikte Garantie.

Weitere Informationen finden Sie unter [/token-use](/de/reference/token-use).

---

## Compaction: was sie ist

Compaction fasst ältere Unterhaltung in einem persistierten `compaction`-Eintrag im Transkript zusammen und lässt aktuelle Nachrichten intakt.

Nach der Compaction sehen künftige Durchläufe:

- Die Compaction-Zusammenfassung
- Nachrichten nach `firstKeptEntryId`

Compaction ist **persistent** (anders als Sitzungsbereinigung). Siehe [/concepts/session-pruning](/de/concepts/session-pruning).

## Compaction-Chunk-Grenzen und Tool-Paarung

Wenn OpenClaw ein langes Transkript in Compaction-Chunks aufteilt, hält es
Assistenten-Tool-Aufrufe mit ihren passenden `toolResult`-Einträgen zusammen.

- Wenn die Token-Anteil-Aufteilung zwischen einem Tool-Aufruf und seinem Ergebnis landet, verschiebt OpenClaw
  die Grenze zur Assistenten-Tool-Aufrufnachricht, statt
  das Paar zu trennen.
- Wenn ein nachgestellter Tool-Ergebnisblock den Chunk sonst über das Ziel schieben würde,
  erhält OpenClaw diesen ausstehenden Tool-Block und lässt das nicht zusammengefasste Ende
  intakt.
- Abgebrochene/fehlerhafte Tool-Aufrufblöcke halten keine ausstehende Aufteilung offen.

---

## Wann automatische Compaction stattfindet (Pi-Laufzeit)

Im eingebetteten Pi-Agent wird automatische Compaction in zwei Fällen ausgelöst:

1. **Überlaufwiederherstellung**: Das Modell gibt einen Kontextüberlauffehler zurück
   (`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded` und ähnliche Provider-geprägte Varianten) → komprimieren → erneut versuchen.
2. **Schwellenwert-Wartung**: nach einem erfolgreichen Durchlauf, wenn:

`contextTokens > contextWindow - reserveTokens`

Dabei gilt:

- `contextWindow` ist das Kontextfenster des Modells
- `reserveTokens` ist der für Prompts + die nächste Modellausgabe reservierte Spielraum

Dies sind Semantiken der Pi-Laufzeit (OpenClaw konsumiert die Ereignisse, aber Pi entscheidet, wann komprimiert wird).

OpenClaw kann außerdem eine lokale Preflight-Compaction auslösen, bevor der nächste
Lauf geöffnet wird, wenn `agents.defaults.compaction.maxActiveTranscriptBytes` gesetzt ist und die
aktive Transkriptdatei diese Größe erreicht. Dies ist ein Dateigrößenschutz für lokale
Wiederöffnungskosten, keine rohe Archivierung: OpenClaw führt weiterhin normale semantische Compaction aus,
und sie erfordert `truncateAfterCompaction`, damit die komprimierte Zusammenfassung zu einem
neuen Nachfolgetranskript werden kann.

Bei eingebetteten Pi-Ausführungen fügt `agents.defaults.compaction.midTurnPrecheck.enabled: true`
eine optionale Tool-Loop-Schutzprüfung hinzu. Nachdem ein Tool-Ergebnis angehängt wurde und bevor der
nächste Modellaufruf erfolgt, schätzt OpenClaw den Prompt-Druck mit derselben Preflight-
Budgetlogik, die zu Beginn eines Turns verwendet wird. Wenn der Kontext nicht mehr passt, führt die Schutzprüfung
keine Compaction innerhalb von Pis `transformContext`-Hook aus. Sie löst ein strukturiertes
Mid-Turn-Precheck-Signal aus, stoppt die aktuelle Prompt-Übermittlung und lässt den
äußeren Ausführungsloop den bestehenden Wiederherstellungspfad verwenden: übergroße Tool-Ergebnisse kürzen,
wenn das ausreicht, oder den konfigurierten Compaction-Modus auslösen und erneut versuchen. Die
Option ist standardmäßig deaktiviert und funktioniert sowohl mit den Compaction-Modi `default` als auch
`safeguard`, einschließlich Provider-gestützter Safeguard-Compaction.
Dies ist unabhängig von `maxActiveTranscriptBytes`: Die Byte-Größen-Schutzprüfung läuft,
bevor ein Turn beginnt, während Mid-Turn-Precheck später im eingebetteten Pi-Tool-
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

OpenClaw erzwingt außerdem eine Sicherheitsuntergrenze für eingebettete Ausführungen:

- Wenn `compaction.reserveTokens < reserveTokensFloor`, erhöht OpenClaw den Wert.
- Die Standarduntergrenze beträgt `20000` Token.
- Setzen Sie `agents.defaults.compaction.reserveTokensFloor: 0`, um die Untergrenze zu deaktivieren.
- Wenn der Wert bereits höher ist, lässt OpenClaw ihn unverändert.
- Manuelles `/compact` berücksichtigt ein explizites `agents.defaults.compaction.keepRecentTokens`
  und behält Pis Schnittpunkt für den aktuellen Tail bei. Ohne explizites Keep-Budget
  bleibt manuelle Compaction ein harter Checkpoint, und der neu aufgebaute Kontext beginnt mit
  der neuen Zusammenfassung.
- Setzen Sie `agents.defaults.compaction.midTurnPrecheck.enabled: true`, um den
  optionalen Tool-Loop-Precheck nach neuen Tool-Ergebnissen und vor dem nächsten Modellaufruf
  auszuführen. Dies ist nur ein Auslöser; die Zusammenfassungserstellung verwendet weiterhin den konfigurierten
  Compaction-Pfad. Er ist unabhängig von `maxActiveTranscriptBytes`, das eine
  Byte-Größen-Schutzprüfung für das aktive Transkript zu Turn-Beginn ist.
- Setzen Sie `agents.defaults.compaction.maxActiveTranscriptBytes` auf einen Byte-Wert oder
  eine Zeichenfolge wie `"20mb"`, um lokale Compaction vor einem Turn auszuführen, wenn das aktive
  Transkript groß wird. Diese Schutzprüfung ist nur aktiv, wenn
  `truncateAfterCompaction` ebenfalls aktiviert ist. Lassen Sie den Wert unset oder setzen Sie ihn auf `0`, um
  sie zu deaktivieren.
- Wenn `agents.defaults.compaction.truncateAfterCompaction` aktiviert ist,
  rotiert OpenClaw das aktive Transkript nach der Compaction in eine kompakte Nachfolger-JSONL.
  Das alte vollständige Transkript bleibt archiviert und wird vom
  Compaction-Checkpoint verlinkt, statt direkt überschrieben zu werden.

Warum: genug Spielraum für mehrturnige „Housekeeping“-Aufgaben (wie Speicher-Schreibvorgänge) lassen, bevor Compaction unvermeidbar wird.

Implementierung: `ensurePiCompactionReserveTokens()` in `src/agents/pi-settings.ts`
(aufgerufen aus `src/agents/pi-embedded-runner.ts`).

---

## Austauschbare Compaction-Provider

Plugins können über `registerCompactionProvider()` in der Plugin-API einen Compaction-Provider registrieren. Wenn `agents.defaults.compaction.provider` auf eine registrierte Provider-ID gesetzt ist, delegiert die Safeguard-Erweiterung die Zusammenfassung an diesen Provider statt an die integrierte `summarizeInStages`-Pipeline.

- `provider`: ID eines registrierten Compaction-Provider-Plugins. Unset lassen für standardmäßige LLM-Zusammenfassung.
- Das Setzen eines `provider` erzwingt `mode: "safeguard"`.
- Provider erhalten dieselben Compaction-Anweisungen und dieselbe Richtlinie zur Beibehaltung von Bezeichnern wie der integrierte Pfad.
- Die Safeguard-Logik bewahrt nach der Provider-Ausgabe weiterhin den Kontext aktueller Turns und Split-Turn-Suffixe.
- Die integrierte Safeguard-Zusammenfassung destilliert vorherige Zusammenfassungen mit neuen Nachrichten erneut,
  statt die vollständige vorherige Zusammenfassung wortgetreu beizubehalten.
- Der Safeguard-Modus aktiviert standardmäßig Qualitätsprüfungen für Zusammenfassungen; setzen Sie
  `qualityGuard.enabled: false`, um das Verhalten zum Wiederholen bei fehlerhaft formatierter Ausgabe zu überspringen.
- Wenn der Provider fehlschlägt oder ein leeres Ergebnis zurückgibt, fällt OpenClaw automatisch auf die integrierte LLM-Zusammenfassung zurück.
- Abbruch-/Timeout-Signale werden erneut ausgelöst (nicht geschluckt), um die Abbruchanforderung des Aufrufers zu respektieren.

Quelle: `src/plugins/compaction-provider.ts`, `src/agents/pi-hooks/compaction-safeguard.ts`.

---

## Für Benutzer sichtbare Oberflächen

Sie können Compaction und Sitzungszustand über Folgendes beobachten:

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
- Die Unterdrückung exakter stiller Tokens unterscheidet nicht zwischen Groß- und Kleinschreibung, sodass `NO_REPLY` und
  `no_reply` beide zählen, wenn die gesamte Nutzlast nur aus dem stillen Token besteht.
- Dies ist nur für echte Hintergrund-/Nichtauslieferungs-Turns gedacht; es ist keine Abkürzung für
  normale, handlungsorientierte Benutzeranfragen.

Seit `2026.1.10` unterdrückt OpenClaw außerdem **Entwurfs-/Typing-Streaming**, wenn ein
Teil-Chunk mit `NO_REPLY` beginnt, sodass stille Vorgänge keine Teilausgabe
mitten im Turn preisgeben.

---

## „Memory Flush“ vor der Compaction (implementiert)

Ziel: Bevor Auto-Compaction erfolgt, einen stillen agentischen Turn ausführen, der dauerhaften
Zustand auf die Festplatte schreibt (z. B. `memory/YYYY-MM-DD.md` im Agent-Arbeitsbereich), damit Compaction
keinen kritischen Kontext löschen kann.

OpenClaw verwendet den Ansatz **Pre-Threshold Flush**:

1. Sitzungs-Kontextnutzung überwachen.
2. Wenn sie einen „Soft Threshold“ überschreitet (unterhalb von Pis Compaction-Schwelle), eine stille
   „Schreibe jetzt Speicher“-Anweisung an den Agent ausführen.
3. Das exakte stille Token `NO_REPLY` / `no_reply` verwenden, damit der Benutzer
   nichts sieht.

Konfiguration (`agents.defaults.compaction.memoryFlush`):

- `enabled` (Standard: `true`)
- `model` (optionaler exakter Provider-/Modell-Override für den Flush-Turn, zum Beispiel `ollama/qwen3:8b`)
- `softThresholdTokens` (Standard: `4000`)
- `prompt` (Benutzernachricht für den Flush-Turn)
- `systemPrompt` (zusätzlicher System-Prompt, der für den Flush-Turn angehängt wird)

Hinweise:

- Der Standard-Prompt/System-Prompt enthält einen `NO_REPLY`-Hinweis, um
  die Auslieferung zu unterdrücken.
- Wenn `model` gesetzt ist, verwendet der Flush-Turn dieses Modell, ohne die
  Fallback-Kette der aktiven Sitzung zu erben, sodass lokales Housekeeping nicht stillschweigend
  auf ein kostenpflichtiges Konversationsmodell zurückfällt.
- Der Flush läuft einmal pro Compaction-Zyklus (nachverfolgt in `sessions.json`).
- Der Flush läuft nur für eingebettete Pi-Sitzungen (CLI-Backends überspringen ihn).
- Der Flush wird übersprungen, wenn der Sitzungsarbeitsbereich schreibgeschützt ist (`workspaceAccess: "ro"` oder `"none"`).
- Siehe [Memory](/de/concepts/memory) für das Dateilayout und die Schreibmuster des Arbeitsbereichs.

Pi stellt in der Erweiterungs-API auch einen `session_before_compact`-Hook bereit, aber OpenClaws
Flush-Logik befindet sich derzeit auf der Gateway-Seite.

---

## Fehlerbehebungs-Checkliste

- Sitzungsschlüssel falsch? Beginnen Sie mit [/concepts/session](/de/concepts/session) und bestätigen Sie den `sessionKey` in `/status`.
- Store und Transkript stimmen nicht überein? Bestätigen Sie den Gateway-Host und den Store-Pfad aus `openclaw status`.
- Compaction-Spam? Prüfen Sie:
  - Modell-Kontextfenster (zu klein)
  - Compaction-Einstellungen (`reserveTokens` zu hoch für das Modellfenster kann frühere Compaction verursachen)
  - aufgeblähte Tool-Ergebnisse: Sitzungs-Pruning aktivieren/anpassen
- Stille Turns werden sichtbar? Bestätigen Sie, dass die Antwort mit `NO_REPLY` beginnt (exaktes Token, unabhängig von Groß-/Kleinschreibung) und Sie einen Build verwenden, der den Streaming-Unterdrückungsfix enthält.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungs-Pruning](/de/concepts/session-pruning)
- [Kontext-Engine](/de/concepts/context-engine)
