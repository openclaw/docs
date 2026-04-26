---
read_when:
    - Sie debuggen Ablehnungen von Anbieteranfragen, die mit der Struktur des Transkripts zusammenhängen
    - Sie ändern die Bereinigung von Transkripten oder die Reparaturlogik für Tool-Aufrufe
    - Sie untersuchen Abweichungen bei Tool-Call-IDs zwischen Anbietern
summary: 'Referenz: anbieterspezifische Regeln zur Bereinigung und Reparatur von Transkripten'
title: Transkript-Hygiene
x-i18n:
    generated_at: "2026-04-26T11:39:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: e380be2b011afca5fedf89579e702c6d221d42e777c23bd766c8df07ff05ed18
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Dieses Dokument beschreibt **anbieterspezifische Korrekturen**, die auf Transkripte vor einem Lauf
(Erstellung des Modellkontexts) angewendet werden. Die meisten davon sind **In-Memory-**
Anpassungen, die verwendet werden, um strenge Anbieteranforderungen zu erfüllen. Ein separater
Reparaturdurchlauf für Sitzungsdateien kann vor dem Laden der Sitzung auch gespeichertes JSONL
umschreiben, entweder durch das Entfernen fehlerhafter JSONL-Zeilen oder durch die Reparatur
persistierter Turns, die syntaktisch gültig sind, aber bei der Wiederholung bekanntermaßen von
einem Anbieter abgelehnt werden. Wenn eine Reparatur erfolgt, wird die Originaldatei neben der
Sitzungsdatei gesichert.

Der Umfang umfasst:

- Laufzeit-only-Prompt-Kontext außerhalb der für Benutzer sichtbaren Transkript-Turns
- Bereinigung von Tool-Call-IDs
- Validierung von Tool-Call-Eingaben
- Reparatur der Zuordnung von Tool-Ergebnissen
- Turn-Validierung / -Reihenfolge
- Bereinigung von Thought-Signaturen
- Bereinigung von Thinking-Signaturen
- Bereinigung von Bild-Payloads
- Kennzeichnung der Herkunft von Benutzereingaben (für sitzungsübergreifend geroutete Prompts)
- Reparatur leerer Fehler-Turns von Assistants für Bedrock-Converse-Replay

Wenn Sie Details zur Transkriptspeicherung benötigen, siehe:

- [Vertiefung zum Sitzungsmanagement und Compaction](/de/reference/session-management-compaction)

---

## Globale Regel: Laufzeitkontext ist kein Benutzertranskript

Laufzeit-/Systemkontext kann dem Modell-Prompt für einen Turn hinzugefügt werden, ist aber
kein von Endbenutzern verfasster Inhalt. OpenClaw hält einen separaten Prompt-Textkörper mit
Transkriptbezug für Gateway-Antworten, in die Warteschlange eingereihte Follow-ups, ACP, CLI
und eingebettete Pi-Läufe vor. Gespeicherte sichtbare Benutzer-Turns verwenden diesen
Transkript-Textkörper anstelle des mit Laufzeitkontext angereicherten Prompts.

Bei älteren Sitzungen, die Laufzeit-Wrapper bereits persistent gespeichert haben, wenden
Gateway-History-Oberflächen vor der Rückgabe von Nachrichten an WebChat,
TUI-, REST- oder SSE-Clients eine Darstellungsprojektion an.

---

## Wo dies ausgeführt wird

Die gesamte Transkript-Hygiene ist im eingebetteten Runner zentralisiert:

- Auswahl der Richtlinie: `src/agents/transcript-policy.ts`
- Anwendung von Bereinigung/Reparatur: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Die Richtlinie verwendet `provider`, `modelApi` und `modelId`, um zu entscheiden, was angewendet wird.

Getrennt von der Transkript-Hygiene werden Sitzungsdateien vor dem Laden repariert (falls nötig):

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aufgerufen von `run/attempt.ts` und `compact.ts` (eingebetteter Runner)

---

## Globale Regel: Bildbereinigung

Bild-Payloads werden immer bereinigt, um eine anbieterseitige Ablehnung aufgrund von Größenlimits
zu verhindern (Verkleinerung/Neukomprimierung zu großer Base64-Bilder).

Dies hilft auch, den durch Bilder verursachten Token-Druck für vision-fähige Modelle zu kontrollieren.
Kleinere Maximalabmessungen reduzieren im Allgemeinen den Token-Verbrauch; größere Abmessungen erhalten mehr Details.

Implementierung:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildseite ist über `agents.defaults.imageMaxDimensionPx` konfigurierbar (Standard: `1200`).

---

## Globale Regel: fehlerhafte Tool-Calls

Assistant-Tool-Call-Blöcke, bei denen sowohl `input` als auch `arguments` fehlen, werden entfernt,
bevor der Modellkontext erstellt wird. Dadurch werden Anbieterablehnungen durch teilweise
persistierte Tool-Calls verhindert (zum Beispiel nach einem Rate-Limit-Fehler).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale Regel: Herkunft sitzungsübergreifender Eingaben

Wenn ein Agent über `sessions_send` einen Prompt in eine andere Sitzung sendet (einschließlich
Schritten für Antworten/Ankündigungen von Agent zu Agent), speichert OpenClaw den erzeugten
Benutzer-Turn mit:

- `message.provenance.kind = "inter_session"`

Diese Metadaten werden beim Anhängen an das Transkript geschrieben und ändern nicht die Rolle
(`role: "user"` bleibt aus Gründen der Anbieterkompatibilität erhalten). Leser des Transkripts
können dies verwenden, um intern weitergeleitete Prompts nicht als von Endbenutzern verfasste
Anweisungen zu behandeln.

Beim Neuaufbau des Kontexts stellt OpenClaw diesen Benutzer-Turns außerdem In-Memory einen kurzen
Marker `[Inter-session message]` voran, damit das Modell sie von externen Endbenutzeranweisungen
unterscheiden kann.

---

## Anbietermatrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bildbereinigung.
- Entfernt verwaiste Reasoning-Signaturen (eigenständige Reasoning-Elemente ohne folgenden Content-Block) für OpenAI-Responses-/Codex-Transkripte und entfernt replayfähiges OpenAI-Reasoning nach einem Wechsel der Modellroute.
- Keine Bereinigung von Tool-Call-IDs.
- Die Reparatur der Zuordnung von Tool-Ergebnissen kann echte passende Ausgaben verschieben und Codex-artige `aborted`-Ausgaben für fehlende Tool-Calls synthetisieren.
- Keine Turn-Validierung oder Neuordnung.
- Fehlende Tool-Ausgaben der OpenAI-Responses-Familie werden als `aborted` synthetisiert, um der Codex-Replay-Normalisierung zu entsprechen.
- Kein Entfernen von Thought-Signaturen.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Bereinigung von Tool-Call-IDs: strikt alphanumerisch.
- Reparatur der Zuordnung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Turn-Validierung (Gemini-artige Turn-Alternation).
- Google-Turn-Reihenfolge-Fixup (stellt einen kleinen Bootstrap-Benutzer-Turn voran, wenn die History mit einem Assistant beginnt).
- Antigravity Claude: Thinking-Signaturen normalisieren; unsignierte Thinking-Blöcke entfernen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Zuordnung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Turn-Validierung (führt aufeinanderfolgende Benutzer-Turns zusammen, um strenge Alternation einzuhalten).
- Thinking-Blöcke mit fehlenden, leeren oder nur aus Leerraum bestehenden Replay-Signaturen werden
  vor der Anbieterkonvertierung entfernt. Wenn dadurch ein Assistant-Turn leer wird, behält OpenClaw
  die Turn-Form mit nicht leerem Text für ausgelassenes Reasoning bei.
- Ältere Assistant-Turns, die nur aus Thinking bestehen und entfernt werden müssen, werden durch
  nicht leeren Text für ausgelassenes Reasoning ersetzt, damit Anbieteradapter den Replay-
  Turn nicht verwerfen.

**Amazon Bedrock (Converse API)**

- Leere Fehler-Turns von Assistant-Streams werden vor dem Replay in einen nicht leeren Fallback-Textblock
  repariert. Bedrock Converse lehnt Assistant-Nachrichten mit `content: []` ab, daher werden
  persistierte Assistant-Turns mit `stopReason: "error"` und leerem Inhalt auch auf dem Datenträger
  vor dem Laden repariert.
- Claude-Thinking-Blöcke mit fehlenden, leeren oder nur aus Leerraum bestehenden Replay-Signaturen werden
  vor dem Converse-Replay entfernt. Wenn dadurch ein Assistant-Turn leer wird, behält OpenClaw
  die Turn-Form mit nicht leerem Text für ausgelassenes Reasoning bei.
- Ältere Assistant-Turns, die nur aus Thinking bestehen und entfernt werden müssen, werden durch
  nicht leeren Text für ausgelassenes Reasoning ersetzt, damit das Converse-Replay die strenge
  Turn-Form beibehält.
- Replay filtert OpenClaw-Delivery-Mirror- und Gateway-injizierte Assistant-Turns.
- Bildbereinigung wird über die globale Regel angewendet.

**Mistral (einschließlich modell-ID-basierter Erkennung)**

- Bereinigung von Tool-Call-IDs: strict9 (alphanumerische Länge 9).

**OpenRouter Gemini**

- Bereinigung von Thought-Signaturen: entfernt nicht-Base64-`thought_signature`-Werte (Base64 bleibt erhalten).

**Alles andere**

- Nur Bildbereinigung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor dem Release 2026.1.22 wandte OpenClaw mehrere Ebenen der Transkript-Hygiene an:

- Eine **transcript-sanitize extension** lief bei jedem Kontextaufbau und konnte:
  - die Zuordnung von Tool-Verwendung/Tool-Ergebnissen reparieren.
  - Tool-Call-IDs bereinigen (einschließlich eines nicht strikten Modus, der `_`/`-` beibehielt).
- Der Runner führte außerdem anbieterspezifische Bereinigung durch, was Arbeit doppelte.
- Zusätzliche Mutationen erfolgten außerhalb der Anbieterrichtlinie, darunter:
  - Entfernen von `<final>`-Tags aus Assistant-Text vor der Persistierung.
  - Entfernen leerer Fehler-Turns von Assistants.
  - Kürzen von Assistant-Inhalten nach Tool-Calls.

Diese Komplexität verursachte anbieterübergreifende Regressionen (insbesondere bei der Zuordnung
`call_id|fc_id` in `openai-responses`). Die Bereinigung in 2026.1.22 entfernte die Extension,
zentralisierte die Logik im Runner und machte OpenAI jenseits der Bildbereinigung zu einem
**No-Touch**-Pfad.

## Verwandt

- [Sitzungsmanagement](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
