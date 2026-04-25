---
read_when:
    - Sie debuggen Anbieterablehnungen, die mit der Form des Transkripts zusammenhängen.
    - Sie ändern die Bereinigung von Transkripten oder die Reparaturlogik für Tool-Aufrufe.
    - Sie untersuchen Abweichungen bei Tool-Call-IDs zwischen Anbietern.
summary: 'Referenz: anbieterspezifische Regeln für die Bereinigung und Reparatur von Transkripten'
title: Transkripthygiene
x-i18n:
    generated_at: "2026-04-25T13:56:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00cac47fb9a238e3cb8b6ea69b47210685ca6769a31973b4aeef1d18e75d78e6
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Dieses Dokument beschreibt **anbieterspezifische Korrekturen**, die auf Transkripte vor einer Ausführung angewendet werden (beim Aufbau des Modellkontexts). Diese Hygieneschritte sind **Anpassungen im Speicher**, die dazu dienen, strenge Anforderungen von Anbietern zu erfüllen. Diese Schritte schreiben das gespeicherte JSONL-Transkript auf der Festplatte **nicht** um; ein separater Reparaturdurchlauf für Sitzungsdateien kann jedoch fehlerhafte JSONL-Dateien umschreiben, indem ungültige Zeilen verworfen werden, bevor die Sitzung geladen wird. Wenn eine Reparatur erfolgt, wird die Originaldatei neben der Sitzungsdatei gesichert.

Der Umfang umfasst:

- Reiner Runtime-Prompt-Kontext, der nicht in benutzersichtbaren Transkript-Turns erscheint
- Bereinigung von Tool-Call-IDs
- Validierung von Tool-Call-Eingaben
- Reparatur der Paarung von Tool-Ergebnissen
- Turn-Validierung / Reihenfolge
- Bereinigung von Thought Signatures
- Bereinigung von Bild-Payloads
- Kennzeichnung der Herkunft von Benutzereingaben (für zwischen Sitzungen weitergeleitete Prompts)

Wenn Sie Details zur Transkriptspeicherung benötigen, siehe:

- [Detaillierte Betrachtung der Sitzungsverwaltung](/de/reference/session-management-compaction)

---

## Globale Regel: Runtime-Kontext ist kein Benutzertranskript

Runtime-/Systemkontext kann für einen Turn zum Modell-Prompt hinzugefügt werden, ist aber kein von Endbenutzern verfasster Inhalt. OpenClaw führt einen separaten, transkriptbezogenen Prompt-Body für Gateway-Antworten, in die Warteschlange gestellte Nachverfolgungen, ACP, CLI und eingebettete Pi-Ausführungen. Gespeicherte sichtbare Benutzer-Turns verwenden diesen Transkript-Body statt des mit Runtime-Kontext angereicherten Prompts.

Für ältere Sitzungen, die Runtime-Wrapper bereits persistent gespeichert haben, wenden Gateway-Verlaufsoberflächen vor der Rückgabe von Nachrichten an WebChat-, TUI-, REST- oder SSE-Clients eine Anzeigeprojektion an.

---

## Wo dies ausgeführt wird

Die gesamte Transkripthygiene ist im eingebetteten Runner zentralisiert:

- Richtlinienauswahl: `src/agents/transcript-policy.ts`
- Anwendung von Bereinigung/Reparatur: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Die Richtlinie verwendet `provider`, `modelApi` und `modelId`, um zu entscheiden, was angewendet wird.

Getrennt von der Transkripthygiene werden Sitzungsdateien bei Bedarf vor dem Laden repariert:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aufgerufen von `run/attempt.ts` und `compact.ts` (eingebetteter Runner)

---

## Globale Regel: Bildbereinigung

Bild-Payloads werden immer bereinigt, um anbieterseitige Ablehnungen aufgrund von Größenbeschränkungen zu verhindern (Herunterskalieren/Neukomprimieren übergroßer Base64-Bilder).

Dies hilft auch dabei, den durch Bilder verursachten Token-Druck für visionfähige Modelle zu kontrollieren. Niedrigere Maximalabmessungen reduzieren im Allgemeinen die Token-Nutzung; höhere Abmessungen erhalten mehr Details.

Implementierung:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildkante ist über `agents.defaults.imageMaxDimensionPx` konfigurierbar (Standard: `1200`).

---

## Globale Regel: fehlerhafte Tool-Calls

Tool-Call-Blöcke von Assistenten, bei denen sowohl `input` als auch `arguments` fehlen, werden verworfen, bevor der Modellkontext aufgebaut wird. Dadurch werden Ablehnungen durch Anbieter aufgrund teilweise persistent gespeicherter Tool-Calls verhindert (zum Beispiel nach einem Rate-Limit-Fehler).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale Regel: Herkunft zwischen Sitzungen übergebener Eingaben

Wenn ein Agent über `sessions_send` einen Prompt in eine andere Sitzung sendet (einschließlich Agent-zu-Agent-Schritten für Antwort/Ankündigung), speichert OpenClaw den erzeugten Benutzer-Turn mit:

- `message.provenance.kind = "inter_session"`

Diese Metadaten werden beim Anhängen an das Transkript geschrieben und ändern die Rolle nicht (`role: "user"` bleibt aus Kompatibilitätsgründen mit Anbietern erhalten). Leser des Transkripts können dies verwenden, um intern weitergeleitete Prompts nicht als von Endbenutzern verfasste Anweisungen zu behandeln.

Beim Neuaufbau des Kontexts stellt OpenClaw diesen Benutzer-Turns im Speicher außerdem einen kurzen Marker `[Inter-session message]` voran, damit das Modell sie von externen Endbenutzeranweisungen unterscheiden kann.

---

## Anbietermatrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bildbereinigung.
- Verwaiste Reasoning Signatures entfernen (eigenständige Reasoning-Elemente ohne folgenden Inhaltsblock) für OpenAI-Responses-/Codex-Transkripte, und replayfähiges OpenAI-Reasoning nach einem Wechsel der Modellroute verwerfen.
- Keine Bereinigung von Tool-Call-IDs.
- Die Reparatur der Paarung von Tool-Ergebnissen kann echte übereinstimmende Ausgaben verschieben und Codex-artige `aborted`-Ausgaben für fehlende Tool-Calls synthetisieren.
- Keine Turn-Validierung oder Neuordnung.
- Fehlende Tool-Ausgaben der OpenAI-Responses-Familie werden als `aborted` synthetisiert, passend zur Codex-Replay-Normalisierung.
- Kein Entfernen von Thought Signatures.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Bereinigung von Tool-Call-IDs: strikt alphanumerisch.
- Reparatur der Paarung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Turn-Validierung (Turn-Alternation im Gemini-Stil).
- Korrektur der Google-Turn-Reihenfolge (ein winziger Benutzer-Bootstrap wird vorangestellt, wenn der Verlauf mit einem Assistenten beginnt).
- Antigravity Claude: Thinking Signatures normalisieren; unsignierte Thinking-Blöcke verwerfen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Paarung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Turn-Validierung (aufeinanderfolgende Benutzer-Turns zusammenführen, um strikte Alternation zu erfüllen).

**Mistral (einschließlich Erkennung auf Basis der Modell-ID)**

- Bereinigung von Tool-Call-IDs: strict9 (alphanumerisch, Länge 9).

**OpenRouter Gemini**

- Bereinigung von Thought Signatures: `thought_signature`-Werte entfernen, die nicht Base64 sind (Base64 behalten).

**Alles andere**

- Nur Bildbereinigung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor der Version 2026.1.22 wandte OpenClaw mehrere Ebenen von Transkripthygiene an:

- Eine **transcript-sanitize extension** wurde bei jedem Aufbau des Kontexts ausgeführt und konnte:
  - Die Paarung von Tool-Nutzung und Tool-Ergebnis reparieren.
  - Tool-Call-IDs bereinigen (einschließlich eines nicht strikten Modus, der `_`/`-` beibehielt).
- Der Runner führte zusätzlich anbieterspezifische Bereinigung aus, wodurch Arbeit doppelt ausgeführt wurde.
- Zusätzliche Mutationen erfolgten außerhalb der Anbieterrichtlinie, darunter:
  - Entfernen von `<final>`-Tags aus Assistententext vor der Persistierung.
  - Verwerfen leerer Assistenten-Fehler-Turns.
  - Kürzen von Assistenteninhalten nach Tool-Calls.

Diese Komplexität führte zu anbieterübergreifenden Regressionen (insbesondere bei der Paarung `call_id|fc_id` in `openai-responses`). Die Bereinigung in 2026.1.22 entfernte die Erweiterung, zentralisierte die Logik im Runner und machte OpenAI **ohne Eingriffe** über die Bildbereinigung hinaus.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
