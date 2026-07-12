---
read_when:
    - Sie debuggen Ablehnungen von Provider-Anfragen, die mit der Struktur des Transkripts zusammenhängen
    - Sie ändern die Bereinigung von Transkripten oder die Reparaturlogik für Tool-Aufrufe
    - Sie untersuchen Abweichungen bei Tool-Call-IDs zwischen Providern
summary: 'Referenz: providerspezifische Regeln zur Bereinigung und Reparatur von Transkripten'
title: Transkripthygiene
x-i18n:
    generated_at: "2026-07-12T15:53:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4c78d718106498e92c34e3ad6af452a340f230fa88fbf3da36a568e9814ec759
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw wendet vor einem Lauf (beim Aufbau des Modellkontexts) **providerspezifische Korrekturen** auf Transkripte an. Die meisten davon sind **In-Memory**-Anpassungen, die zur Erfüllung strenger Provider-Anforderungen dienen. Ein separater Reparaturdurchlauf für Sitzungsdateien kann außerdem gespeicherte JSONL-Daten vor dem Laden der Sitzung neu schreiben, jedoch nur bei fehlerhaften Zeilen oder persistierten Turns, die keine gültigen dauerhaften Datensätze darstellen. Ausgelieferte Assistentenantworten bleiben auf dem Datenträger erhalten; das providerspezifische Entfernen von Assistenten-Prefills erfolgt nur beim Erstellen ausgehender Payloads.

Wenn eine Reparatur erfolgt, wird die Originaldatei vor dem atomaren Ersetzen in eine temporäre gleichgeordnete Datei namens `*.bak-<pid>-<ts>` geschrieben und nach erfolgreichem Ersetzen entfernt. Das Backup bleibt nur erhalten, wenn die Bereinigung selbst fehlschlägt; in diesem Fall wird der Pfad zurückgemeldet.

Der Umfang umfasst:

- Ausschluss ausschließlich zur Laufzeit verwendeten Prompt-Kontexts aus benutzersichtbaren Transkript-Turns
- Bereinigung von Tool-Aufruf-IDs
- Validierung der Eingaben von Tool-Aufrufen
- Reparatur der Zuordnung von Tool-Ergebnissen
- Validierung/Reihenfolge von Turns
- Bereinigung von Gedankensignaturen
- Bereinigung von Thinking-Signaturen
- Bereinigung von Bild-Payloads
- Bereinigung leerer Textblöcke vor der Provider-Wiedergabe
- Bereinigung unvollständiger, ausschließlich Reasoning enthaltender Längen-Turns vor der Provider-Wiedergabe
- Kennzeichnung der Herkunft von Benutzereingaben (für zwischen Sitzungen weitergeleitete Prompts)
- Reparatur leerer Assistenten-Fehler-Turns für die Bedrock-Converse-Wiedergabe

Details zur Transkriptspeicherung finden Sie unter
[Vertiefung zur Sitzungsverwaltung](/de/reference/session-management-compaction).

---

## Globale Regel: Laufzeitkontext ist kein Benutzertranskript

Laufzeit-/Systemkontext kann dem Modell-Prompt für einen Turn hinzugefügt werden, ist jedoch kein vom Endbenutzer verfasster Inhalt. OpenClaw verwaltet für Gateway-Antworten, in die Warteschlange gestellte Folgeanfragen, ACP, CLI und eingebettete OpenClaw-Läufe einen separaten, für das Transkript bestimmten Prompt-Text. Gespeicherte sichtbare Benutzer-Turns verwenden diesen Transkripttext anstelle des um Laufzeitinformationen angereicherten Prompts.

Bei älteren Sitzungen, in denen Laufzeit-Wrapper bereits persistiert wurden, wenden Gateway-Verlaufsoberflächen eine Anzeigeprojektion an, bevor sie Nachrichten an WebChat-, TUI-, REST- oder SSE-Clients zurückgeben.

---

## Ausführungsort

Die gesamte Transkripthygiene ist im eingebetteten Runner zentralisiert:

- Richtlinienauswahl: `src/agents/transcript-policy.ts`
  (`resolveTranscriptPolicy`, anhand von `provider`, `modelApi` und `modelId`)
- Anwendung von Bereinigung/Reparatur: `sanitizeSessionHistory` in
  `src/agents/embedded-agent-runner/replay-history.ts`

Unabhängig von der Transkripthygiene werden Sitzungsdateien vor dem Laden bei Bedarf repariert:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aufgerufen aus `src/agents/embedded-agent-runner/run/attempt.ts` und
  `src/agents/embedded-agent-runner/compact.ts`

---

## Globale Regel: Bildbereinigung

Bild-Payloads werden immer bereinigt, um eine Ablehnung auf Provider-Seite aufgrund von Größenbeschränkungen zu verhindern (Verkleinerung/Neukomprimierung übergroßer Base64-Bilder). Dies hilft außerdem, den durch Bilder verursachten Token-Druck bei vision-fähigen Modellen zu kontrollieren: Kleinere Maximalabmessungen reduzieren die Token-Nutzung, größere Abmessungen bewahren Details.

Implementierung:

- `sanitizeSessionMessagesImages` in
  `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildseitenlänge ist über `agents.defaults.imageMaxDimensionPx`
  konfigurierbar (Standard: `1200`)
- Leere Textblöcke werden entfernt, während dieser Durchlauf die Wiedergabeinhalte verarbeitet.
  Assistenten-Turns, die dadurch leer werden, werden aus der Wiedergabekopie entfernt; Benutzer-
  und Tool-Ergebnis-Turns, die dadurch leer werden, erhalten einen nicht leeren
  Platzhalter für ausgelassene Inhalte.

---

## Globale Regel: fehlerhafte Tool-Aufrufe

Assistentenblöcke für Tool-Aufrufe, denen sowohl `input` als auch `arguments` fehlen, werden entfernt, bevor der Modellkontext erstellt wird. Dies verhindert Ablehnungen durch den Provider aufgrund teilweise persistierter Tool-Aufrufe (beispielsweise nach einem Fehler wegen einer Ratenbegrenzung).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory`
  (`src/agents/embedded-agent-runner/replay-history.ts`)

---

## Globale Regel: unvollständige Turns ausschließlich mit Reasoning

Assistenten-Turns, die das Provider-Ausgabelimit erreichen und ausschließlich Thinking- oder redigierte Thinking-Inhalte enthalten, werden aus der In-Memory-Wiedergabekopie ausgelassen. Solche Turns enthalten einen unvollständigen Provider-Zustand und können eine partielle Thinking-Signatur enthalten.

Leere Längen-Turns bleiben unverändert, ebenso Längen-Turns mit sichtbarem Text, Tool-Aufrufen oder unbekannten Inhaltsblöcken. Gespeicherte Transkripte werden nicht neu geschrieben.

Implementierung: `normalizeAssistantReplayContent` in
`src/agents/embedded-agent-runner/replay-history.ts`

---

## Globale Regel: Herkunft sitzungsübergreifender Eingaben

Wenn ein Agent über `sessions_send` einen Prompt an eine andere Sitzung sendet (einschließlich Antwort-/Ankündigungsschritten zwischen Agenten), persistiert OpenClaw den erstellten Benutzer-Turn mit `message.provenance.kind = "inter_session"`.

OpenClaw stellt dem weitergeleiteten Prompt-Text außerdem im selben Turn eine Markierung `[Inter-session message] ... isUser=false` voran, damit der aktive Modellaufruf Ausgaben einer fremden Sitzung von externen Endbenutzeranweisungen unterscheiden kann. Diese Markierung enthält, sofern verfügbar, die Quellsitzung, den Kanal und das Tool. Das Transkript verwendet aus Gründen der Provider-Kompatibilität weiterhin `role: "user"`, aber sowohl der sichtbare Text als auch die Herkunftsmetadaten kennzeichnen den Turn als sitzungsübergreifende Daten.

Beim erneuten Aufbau des Kontexts wendet OpenClaw dieselbe Markierung auf ältere persistierte sitzungsübergreifende Benutzer-Turns an, die nur Herkunftsmetadaten enthalten.

---

## Provider-Matrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bildbereinigung.
- Verwaiste Reasoning-Signaturen (eigenständige Reasoning-Elemente ohne nachfolgenden Inhaltsblock) werden bei OpenAI-Responses-/Codex-Transkripten entfernt; nach einem Wechsel der Modellroute wird außerdem wiedergabefähiges OpenAI-Reasoning entfernt.
- Wiedergabefähige Payloads von OpenAI-Responses-Reasoning-Elementen einschließlich verschlüsselter Elemente mit leerer Zusammenfassung bleiben erhalten, damit bei manueller/WebSocket-Wiedergabe der erforderliche `rs_*`-Zustand den Assistentenausgabeelementen zugeordnet bleibt.
- Native ChatGPT Codex Responses folgt der Codex-Wire-Parität, indem vorherige Responses-Reasoning-/Nachrichten-/Funktions-Payloads ohne vorherige Element-IDs wiedergegeben werden, während der Sitzungswert `prompt_cache_key` erhalten bleibt.
- Die Wiedergabe der OpenAI-Responses-Familie bewahrt kanonische `call_*|fc_*`-Reasoning-Paare desselben Modells, normalisiert jedoch fehlerhafte oder überlange `call_id`-/Funktionsaufruf-Element-IDs vor der pi-ai-Payload-Konvertierung deterministisch.
- Die Reparatur der Zuordnung von Tool-Ergebnissen kann echte übereinstimmende Ausgaben verschieben und für fehlende Tool-Aufrufe Codex-artige `aborted`-Ausgaben synthetisieren.
- Keine Validierung oder Neuordnung von Turns; kein Entfernen von Gedankensignaturen.

**OpenAI-kompatible Chat Completions**

- Historische Assistentenblöcke mit Thinking/Reasoning werden vor der Wiedergabe entfernt, damit lokale und Proxy-artige OpenAI-kompatible Server keine Reasoning-Felder vorheriger Turns wie `reasoning` oder `reasoning_content` erhalten.
- Aktuelle Fortsetzungen von Tool-Aufrufen im selben Turn lassen den Assistenten-Reasoning-Block mit dem Tool-Aufruf verbunden, bis das Tool-Ergebnis wiedergegeben wurde.
- Benutzerdefinierte/selbst gehostete Modelleinträge mit `reasoning: true` bewahren wiedergegebene Reasoning-Metadaten.
- Provider-eigene Ausnahmen können darauf verzichten, wenn ihr Wire-Protokoll wiedergegebene Reasoning-Metadaten erfordert.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Bereinigung von Tool-Aufruf-IDs: streng alphanumerisch.
- Reparatur der Zuordnung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Turn-Validierung (Turn-Wechsel im Gemini-Stil).
- Korrektur der Google-Turn-Reihenfolge (Voranstellen eines kleinen Benutzer-Bootstraps, wenn der Verlauf mit dem Assistenten beginnt).
- Antigravity Claude: Thinking-Signaturen normalisieren; unsignierte Thinking-Blöcke entfernen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Zuordnung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Turn-Validierung (aufeinanderfolgende Benutzer-Turns zusammenführen, um die strenge Abwechslung einzuhalten).
- Abschließende Assistenten-Prefill-Turns werden bei aktiviertem Thinking aus ausgehenden Anthropic-Messages-Payloads entfernt, einschließlich Cloudflare-AI-Gateway-Routen.
- Assistenten-Thinking-Signaturen vor der Compaction werden vor der Provider-Wiedergabe entfernt, wenn eine Sitzung komprimiert wurde. Thinking-Signaturen sind zum Zeitpunkt ihrer Erzeugung kryptografisch an das Konversationspräfix gebunden; nach der Compaction ändert sich das Präfix (zusammengefasster Inhalt ersetzt das Original), sodass die Wiedergabe der ursprünglichen Signaturen Anthropic dazu veranlasst, die Anfrage mit "Invalid signature in thinking block" abzulehnen. Der Thinking-Text bleibt als unsignierter Block erhalten und wird anschließend durch die nachstehende Regel verarbeitet.
- Thinking-Blöcke mit fehlenden, leeren oder ausschließlich aus Leerraum bestehenden Wiedergabesignaturen werden vor der Provider-Konvertierung entfernt. Wenn dadurch ein Assistenten-Turn geleert wird, behält OpenClaw die Turn-Struktur mit einem nicht leeren Text für ausgelassenes Reasoning bei.
- Ältere Assistenten-Turns, die ausschließlich Thinking enthalten und entfernt werden müssen, werden durch einen nicht leeren Text für ausgelassenes Reasoning ersetzt, damit Provider-Adapter den Wiedergabe-Turn nicht verwerfen.

**Amazon Bedrock (Converse API)**

- Leere Assistenten-Turns mit Stream-Fehlern werden vor der Wiedergabe in einen nicht leeren Ersatztextblock umgewandelt. Bedrock Converse lehnt Assistentennachrichten mit `content: []` ab, daher werden persistierte Assistenten-Turns mit `stopReason:
"error"` und leerem Inhalt ebenfalls vor dem Laden auf dem Datenträger repariert.
- Assistenten-Turns mit Stream-Fehlern, die ausschließlich leere Textblöcke enthalten, werden aus der In-Memory-Wiedergabekopie entfernt, anstatt einen ungültigen leeren Block wiederzugeben.
- Assistenten-Thinking-Signaturen vor der Compaction werden vor der Converse-Wiedergabe entfernt, wenn eine Sitzung komprimiert wurde, und zwar aus demselben Grund wie oben bei Anthropic.
- Claude-Thinking-Blöcke mit fehlenden, leeren oder ausschließlich aus Leerraum bestehenden Wiedergabesignaturen werden vor der Converse-Wiedergabe entfernt. Wenn dadurch ein Assistenten-Turn geleert wird, behält OpenClaw die Turn-Struktur mit einem nicht leeren Text für ausgelassenes Reasoning bei.
- Ältere Assistenten-Turns, die ausschließlich Thinking enthalten und entfernt werden müssen, werden durch einen nicht leeren Text für ausgelassenes Reasoning ersetzt, damit die Converse-Wiedergabe die strenge Turn-Struktur beibehält.
- Die Wiedergabe filtert OpenClaw-Assistenten-Turns heraus, die durch Auslieferungsspiegelung oder das Gateway eingefügt wurden.
- Die Bildbereinigung erfolgt gemäß der globalen Regel.

**Mistral (einschließlich Erkennung anhand der Modell-ID)**

- Bereinigung von Tool-Aufruf-IDs: strict9 (alphanumerisch, Länge 9).

**OpenRouter Gemini**

- Bereinigung von Gedankensignaturen: Nicht-Base64-Werte von `thought_signature` entfernen (Base64 beibehalten).

**OpenRouter Anthropic**

- Abschließende Assistenten-Prefill-Turns werden bei aktiviertem Reasoning aus Payloads verifizierter OpenRouter-Anthropic-Modelle entfernt, die mit OpenAI kompatibel sind, entsprechend dem Wiedergabeverhalten von direktem Anthropic und Cloudflare Anthropic.

**Alles andere**

- Nur Bildbereinigung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor der Version 2026.1.22 wendete OpenClaw mehrere Ebenen der Transkripthygiene an:

- Eine **transcript-sanitize-Erweiterung** wurde bei jedem Kontextaufbau ausgeführt und konnte:
  - Die Zuordnung von Tool-Nutzung und -Ergebnis reparieren.
  - Tool-Aufruf-IDs bereinigen (einschließlich eines nicht strengen Modus, der
    `_`/`-` beibehielt).
- Der Runner führte außerdem eine providerspezifische Bereinigung durch, wodurch
  Arbeit doppelt ausgeführt wurde.
- Weitere Mutationen erfolgten außerhalb der Provider-Richtlinie, darunter
  das Entfernen von `<final>`-Tags aus Assistententext vor der Persistierung, das Verwerfen
  leerer Assistenten-Fehler-Turns und das Kürzen von Assistenteninhalten nach Tool-
  Aufrufen.

Diese Komplexität verursachte providerübergreifende Regressionen (insbesondere bei der
`openai-responses`-Zuordnung von `call_id|fc_id`). Die Bereinigung in Version 2026.1.22 entfernte
die Erweiterung, zentralisierte die Logik im Runner und ließ OpenAI abgesehen von der Bildbereinigung
**unverändert**.

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
