---
read_when:
    - Sie debuggen Ablehnungen von Provider-Anfragen, die mit der Struktur des Transkripts zusammenhängen.
    - Sie ändern die Bereinigung von Transkripten oder die Logik zur Reparatur von Tool-Aufrufen
    - Sie untersuchen Abweichungen bei Tool-Aufruf-IDs zwischen Providern
summary: 'Referenz: providerspezifische Regeln zur Bereinigung und Reparatur von Transkripten'
title: Transkripthygiene
x-i18n:
    generated_at: "2026-07-24T04:06:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 33d978772062cb2a81eb358bb5c62bd1261b433ffdc8acdbaa6679b121fbbf62
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw wendet vor einem Lauf (beim Aufbau des Modellkontexts)
**Provider-spezifische Korrekturen** auf Transkripte an. Die meisten davon sind
**In-Memory**-Anpassungen, die zur Erfüllung strenger Provider-Anforderungen
dienen. Ein separater Reparaturdurchlauf für Sitzungsdateien kann außerdem
gespeicherte JSONL-Daten umschreiben, bevor die Sitzung geladen wird, jedoch
nur bei fehlerhaften Zeilen oder persistierten Turns, die keine gültigen
dauerhaften Datensätze darstellen. Ausgelieferte Assistentenantworten bleiben
auf dem Datenträger erhalten; das Provider-spezifische Entfernen von
Assistenten-Prefills erfolgt nur beim Erstellen ausgehender Payloads.

Wenn eine Reparatur erfolgt, wird die Originaldatei vor dem atomaren Ersetzen
in eine temporäre `*.bak-<pid>-<ts>`-Geschwisterdatei geschrieben und nach
erfolgreichem Ersetzen entfernt. Die Sicherung bleibt nur erhalten, wenn die
Bereinigung selbst fehlschlägt; in diesem Fall wird der Pfad zurückgemeldet.

Der Umfang umfasst:

- Nur zur Laufzeit verwendeter Prompt-Kontext bleibt aus benutzersichtbaren Transkript-Turns heraus
- Bereinigung von Tool-Aufruf-IDs
- Validierung der Eingaben von Tool-Aufrufen
- Reparatur der Zuordnung von Tool-Ergebnissen
- Validierung/Reihenfolge von Turns
- Bereinigung von Gedankensignaturen
- Bereinigung von Thinking-Signaturen
- Bereinigung von Bild-Payloads
- Bereinigung leerer Textblöcke vor der Provider-Wiedergabe
- Bereinigung unvollständiger, ausschließlich aus Schlussfolgerungen bestehender Längen-Turns vor der Provider-Wiedergabe
- Kennzeichnung der Herkunft von Benutzereingaben (für sitzungsübergreifend weitergeleitete Prompts)
- Reparatur leerer Assistenten-Fehler-Turns für die Bedrock-Converse-Wiedergabe

Details zur Transkriptspeicherung finden Sie unter
[Ausführliche Erläuterung der Sitzungsverwaltung](/de/reference/session-management-compaction).

---

## Globale Regel: Laufzeitkontext ist kein Benutzertranskript

Laufzeit-/Systemkontext kann für einen Turn zum Modell-Prompt hinzugefügt
werden, ist jedoch kein vom Endbenutzer verfasster Inhalt. OpenClaw führt
einen separaten, für das Transkript bestimmten Prompt-Text für
Gateway-Antworten, nachfolgende Nachrichten in der Warteschlange, ACP, CLI
und eingebettete OpenClaw-Läufe. Gespeicherte sichtbare Benutzer-Turns
verwenden diesen Transkripttext statt des um Laufzeitinformationen
angereicherten Prompts.

Bei älteren Sitzungen, in denen Laufzeit-Wrapper bereits persistiert wurden,
wenden Gateway-Verlaufsoberflächen eine Anzeigeprojektion an, bevor sie
Nachrichten an WebChat-, TUI-, REST- oder SSE-Clients zurückgeben.

---

## Wo dies ausgeführt wird

Die gesamte Transkripthygiene ist im eingebetteten Runner zentralisiert:

- Richtlinienauswahl: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, basierend auf `provider`, `modelApi` und `modelId`)
- Anwendung der Bereinigung/Reparatur: `sanitizeSessionHistory` in
  `src/agents/embedded-agent-runner/replay-history.ts`

Unabhängig von der Transkripthygiene werden Sitzungsdateien vor dem Laden
repariert (falls erforderlich):

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aufgerufen von `src/agents/embedded-agent-runner/run/attempt.ts` und
  `src/agents/embedded-agent-runner/compact.ts`

---

## Globale Regel: Bildbereinigung

Bild-Payloads werden immer bereinigt, um eine Provider-seitige Ablehnung
aufgrund von Größenbeschränkungen zu verhindern (überdimensionierte
Base64-Bilder werden herunterskaliert/neu komprimiert). Dies hilft außerdem,
den bildbedingten Token-Druck bei visionsfähigen Modellen zu kontrollieren:
Kleinere Maximalabmessungen reduzieren die Token-Nutzung, größere Abmessungen
bewahren Details.

Implementierung:

- `sanitizeSessionMessagesImages` in
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildseitenlänge ist über `agents.defaults.imageMaxDimensionPx` konfigurierbar
  (Standard: `1200`)
- Leere Textblöcke werden entfernt, während dieser Durchlauf den Wiedergabeinhalt verarbeitet.
  Assistenten-Turns, die dadurch leer werden, werden aus der Wiedergabekopie
  entfernt; Benutzer- und Tool-Ergebnis-Turns, die leer werden, erhalten
  einen nicht leeren Platzhalter für ausgelassene Inhalte.

---

## Globale Regel: fehlerhafte Tool-Aufrufe

Assistentenblöcke für Tool-Aufrufe, denen sowohl `input` als auch
`arguments` fehlen, werden entfernt, bevor der Modellkontext erstellt
wird. Dies verhindert Provider-Ablehnungen durch teilweise persistierte
Tool-Aufrufe (beispielsweise nach einem Ratenbegrenzungsfehler).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Globale Regel: Zuordnung von Tool-Ergebnissen

Tool-Ergebnisse werden vor dem Umschreiben Provider-spezifischer Aufruf-IDs
den jeweiligen Tool-Aufruf-Vorkommen innerhalb jedes Assistenten-Turns
zugeordnet. Vom Provider erzeugte IDs können sich in späteren Turns
wiederholen, sodass ein Ergebnis neben einem wiederholten Aufruf diesem
Vorkommen zugeordnet bleibt. Ein verschobenes Ergebnis wird nur dann
verschoben, wenn es genau einem noch nicht aufgelösten Vorkommen zugeordnet
werden kann; mehrdeutige zusätzliche Ergebnisse werden entfernt und fehlende
Vorkommen erhalten synthetische Fehlerergebnisse.

Implementierung: `sanitizeToolUseResultPairing` in
`src/agents/session-transcript-repair.ts`

---

## Globale Regel: unvollständige oder stille, ausschließlich aus Schlussfolgerungen bestehende Turns

Assistenten-Turns werden aus der In-Memory-Wiedergabekopie ausgelassen, wenn
sie nach einem der folgenden Ereignisse nur Thinking- oder
Redacted-Thinking-Inhalte enthalten:

- Das Provider-Ausgabelimit beendet den Turn mit einem unvollständigen Schlussfolgerungszustand.
- Die Bereinigung stiller Antworten entfernt den einzigen sichtbaren `NO_REPLY`-Text des Turns.

Die Bereinigung stiller Antworten verhindert, dass verborgene
Schlussfolgerungen mit einem späteren Assistenten-Turn zur Tool-Nutzung
zusammengeführt werden, wenn strenge Provider die Unterhaltung neu aufbauen.

Leere Längen-Turns bleiben unverändert, ebenso Längen-Turns mit sichtbarem
Text, Tool-Aufrufen oder unbekannten Inhaltsblöcken. Turns mit stillen
Antworten und Tool-Aufrufen oder unbekannten Inhaltsblöcken bleiben ebenfalls
unverändert. Gespeicherte Transkripte werden nicht umgeschrieben.

Implementierung: `normalizeAssistantReplayContent` in
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Globale Regel: Herkunft sitzungsübergreifender Eingaben

Wenn ein Agent über `sessions_send` einen Prompt an eine andere Sitzung
sendet (einschließlich Antwort-/Ankündigungsschritten zwischen Agents),
persistiert OpenClaw den erstellten Benutzer-Turn mit
`message.provenance.kind = "inter_session"`.

OpenClaw stellt dem weitergeleiteten Prompt-Text außerdem im selben Turn eine
`[Inter-session message] ... isUser=false`-Markierung voran, damit der aktive Modellaufruf Ausgaben
einer anderen Sitzung von externen Endbenutzeranweisungen unterscheiden kann.
Diese Markierung enthält, sofern verfügbar, die Quellsitzung, den Kanal und
das Tool. Das Transkript verwendet aus Gründen der Provider-Kompatibilität
weiterhin `role: "user"`, aber sowohl der sichtbare Text als auch die
Herkunftsmetadaten kennzeichnen den Turn als sitzungsübergreifende Daten.

Beim Neuaufbau des Kontexts wendet OpenClaw dieselbe Markierung auf ältere
persistierte sitzungsübergreifende Benutzer-Turns an, die nur über
Herkunftsmetadaten verfügen.

---

## Provider-Matrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bildbereinigung.
- Verwaiste Schlussfolgerungssignaturen (eigenständige Schlussfolgerungselemente ohne
  nachfolgenden Inhaltsblock) werden bei OpenAI-Responses-/Codex-Transkripten
  entfernt; außerdem werden wiedergabefähige OpenAI-Schlussfolgerungen nach
  einem Wechsel der Modellroute entfernt.
- Wiedergabefähige Payloads von OpenAI-Responses-Schlussfolgerungselementen werden einschließlich
  verschlüsselter Elemente mit leerer Zusammenfassung beibehalten, damit bei
  manueller/WebSocket-Wiedergabe der erforderliche
  `rs_*`-Zustand den Assistentenausgabeelementen zugeordnet bleibt.
- Native ChatGPT Codex Responses stellt Codex-Leitungskompatibilität her, indem
  vorherige Responses-Schlussfolgerungs-/Nachrichten-/Funktions-Payloads ohne
  vorherige Element-IDs wiedergegeben werden, während Sitzungs-`prompt_cache_key`
  erhalten bleibt.
- Die Wiedergabe der OpenAI-Responses-Familie bewahrt kanonische `call_*|fc_*`-
  Schlussfolgerungspaare desselben Modells, normalisiert jedoch fehlerhafte
  oder überlange `call_id`-/Funktionsaufruf-Element-IDs deterministisch vor der
  pi-ai-Payload-Konvertierung.
- Die Reparatur der Tool-Ergebniszuordnung kann echte übereinstimmende Ausgaben verschieben und
  für fehlende Tool-Aufrufe Codex-artige `aborted`-Ausgaben synthetisieren.
- Keine Turn-Validierung oder -Neuanordnung; keine Entfernung von Gedankensignaturen.

**OpenAI-kompatible Chat Completions**

- Historische Thinking-/Schlussfolgerungsblöcke des Assistenten werden vor der Wiedergabe entfernt,
  damit lokale und Proxy-artige OpenAI-kompatible Server keine
  Schlussfolgerungsfelder aus vorherigen Turns wie `reasoning` oder `reasoning_content` erhalten.
- Aktuelle Fortsetzungen von Tool-Aufrufen im selben Turn behalten den Assistenten-Schlussfolgerungsblock
  am Tool-Aufruf, bis das Tool-Ergebnis wiedergegeben wurde.
- Benutzerdefinierte/selbst gehostete Modelleinträge mit `reasoning: true` bewahren wiedergegebene
  Schlussfolgerungsmetadaten.
- Provider-eigene Ausnahmen können dies deaktivieren, wenn ihr Leitungsprotokoll
  wiedergegebene Schlussfolgerungsmetadaten erfordert.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Bereinigung von Tool-Aufruf-IDs: strikt alphanumerisch.
- Reparatur der Tool-Ergebniszuordnung und synthetische Tool-Ergebnisse.
- Turn-Validierung (Turn-Wechsel im Gemini-Stil).
- Korrektur der Google-Turn-Reihenfolge (einen kleinen Benutzer-Bootstrap voranstellen, wenn der Verlauf
  mit dem Assistenten beginnt).
- Antigravity Claude: Thinking-Signaturen normalisieren; unsignierte Thinking-Blöcke entfernen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Tool-Ergebniszuordnung und synthetische Tool-Ergebnisse.
- Turn-Validierung (aufeinanderfolgende Benutzer-Turns zusammenführen, um die strikte
  Abwechslung zu erfüllen).
- Nachgestellte Assistenten-Prefill-Turns werden bei aktiviertem Thinking aus ausgehenden Anthropic-
  Messages-Payloads entfernt, einschließlich Routen über Cloudflare AI
  Gateway.
- Assistenten-Thinking-Signaturen vor der Compaction werden vor der Provider-
  Wiedergabe entfernt, wenn eine Sitzung einer Compaction unterzogen wurde.
  Thinking-Signaturen sind zum Erzeugungszeitpunkt kryptografisch an das
  Unterhaltungspräfix gebunden; nach der Compaction ändert sich das Präfix
  (zusammengefasster Inhalt ersetzt das Original), sodass die Wiedergabe der
  ursprünglichen Signaturen dazu führt, dass Anthropic die Anfrage mit
  "Ungültige Signatur im Thinking-Block" ablehnt. Der Thinking-Text bleibt
  als unsignierter Block erhalten und wird anschließend von der folgenden
  Regel verarbeitet.
- Thinking-Blöcke mit fehlenden, leeren oder ausschließlich aus Leerzeichen bestehenden Wiedergabesignaturen werden
  vor der Provider-Konvertierung entfernt. Wenn dadurch ein Assistenten-Turn
  leer wird, behält OpenClaw die Turn-Struktur mit einem nicht leeren Text
  für ausgelassene Schlussfolgerungen bei.
- Ältere Assistenten-Turns, die ausschließlich aus Thinking bestehen und entfernt werden müssen, werden
  durch einen nicht leeren Text für ausgelassene Schlussfolgerungen ersetzt,
  damit Provider-Adapter den Wiedergabe-Turn nicht verwerfen.

**Amazon Bedrock (Converse API)**

- Leere Assistenten-Stream-Fehler-Turns werden vor der Wiedergabe durch einen nicht leeren Ersatz-
  Textblock repariert. Bedrock Converse lehnt Assistentennachrichten mit
  `content: []` ab, daher werden persistierte Assistenten-Turns mit `stopReason:
"error"` und leerem Inhalt ebenfalls vor dem Laden auf dem Datenträger repariert.
- Assistenten-Stream-Fehler-Turns, die nur leere Textblöcke enthalten, werden aus
  der In-Memory-Wiedergabekopie entfernt, anstatt einen ungültigen leeren
  Block wiederzugeben.
- Assistenten-Thinking-Signaturen vor der Compaction werden vor der Converse-
  Wiedergabe entfernt, wenn eine Sitzung einer Compaction unterzogen wurde,
  und zwar aus demselben Grund wie oben bei Anthropic.
- Claude-Thinking-Blöcke mit fehlenden, leeren oder ausschließlich aus Leerzeichen bestehenden Wiedergabesignaturen
  werden vor der Converse-Wiedergabe entfernt. Wenn dadurch ein
  Assistenten-Turn leer wird, behält OpenClaw die Turn-Struktur mit einem
  nicht leeren Text für ausgelassene Schlussfolgerungen bei.
- Ältere Assistenten-Turns, die ausschließlich aus Thinking bestehen und entfernt werden müssen, werden
  durch einen nicht leeren Text für ausgelassene Schlussfolgerungen ersetzt,
  damit die Converse-Wiedergabe die strikte Turn-Struktur beibehält.
- Die Wiedergabe filtert OpenClaw-Turns des Assistenten, die durch Zustellungsspiegelung oder das Gateway
  eingefügt wurden.
- Die Bildbereinigung erfolgt gemäß der globalen Regel.

**Mistral (einschließlich Erkennung anhand der Modell-ID)**

- Bereinigung von Tool-Aufruf-IDs: strict9 (alphanumerisch, Länge 9).

**OpenRouter Gemini**

- Bereinigung von Gedankensignaturen: Nicht-Base64-Werte von `thought_signature` entfernen
  (Base64 beibehalten).

**OpenRouter Anthropic**

- Nachgestellte Assistenten-Prefill-Turns werden bei aktivierten Schlussfolgerungen aus verifizierten OpenRouter-
  Payloads OpenAI-kompatibler Anthropic-Modelle entfernt, entsprechend dem
  Wiedergabeverhalten von direktem Anthropic und Cloudflare Anthropic.

**Alles andere**

- Nur Bildbereinigung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor der Version 2026.1.22 wendete OpenClaw mehrere Ebenen der
Transkripthygiene an:

- Eine **transcript-sanitize-Erweiterung** wurde bei jedem Kontextaufbau ausgeführt und konnte:
  - Die Zuordnung von Tool-Nutzung und -Ergebnis reparieren.
  - Tool-Aufruf-IDs bereinigen (einschließlich eines nicht strikten Modus, der
    `_`/`-` beibehielt).
- Der Runner führte außerdem eine providerspezifische Bereinigung durch, wodurch
  Arbeit doppelt ausgeführt wurde.
- Weitere Änderungen erfolgten außerhalb der Provider-Richtlinie, darunter
  das Entfernen von `<final>`-Tags aus Assistententext vor der Persistierung, das Verwerfen
  leerer Assistenten-Fehlerbeiträge und das Kürzen von Assistenteninhalten nach Tool-
  Aufrufen.

Diese Komplexität verursachte providerübergreifende Regressionen (insbesondere bei der
Zuordnung von `openai-responses` und `call_id|fc_id`). Die Bereinigung vom 2026.1.22 entfernte
die Erweiterung, zentralisierte die Logik im Runner und ließ OpenAI über die Bildbereinigung
hinaus **unverändert**.

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
