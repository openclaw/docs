---
read_when:
    - Sie debuggen abgelehnte Provider-Anfragen, die mit der Transkriptstruktur zusammenhängen
    - Sie ändern die Transkriptbereinigung oder die Reparaturlogik für Tool-Aufrufe
    - Sie untersuchen Tool-Call-ID-Abweichungen zwischen Providern
summary: 'Referenz: Provider-spezifische Regeln zur Bereinigung und Reparatur von Transkripten'
title: Transkript-Hygiene
x-i18n:
    generated_at: "2026-05-02T06:45:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6976d4349e47954f49c9dbf300822013851b604ed665f4ab647c62025760a96c
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw wendet vor einem Lauf (beim Aufbau des Modellkontexts) **Provider-spezifische Korrekturen** auf Transkripte an. Die meisten davon sind Anpassungen **im Arbeitsspeicher**, die strikte Provider-Anforderungen erfüllen. Ein separater Reparaturdurchlauf für Sitzungsdateien kann außerdem gespeichertes JSONL neu schreiben, bevor die Sitzung geladen wird, entweder durch Verwerfen fehlerhafter JSONL-Zeilen oder durch Reparieren persistierter Turns, die syntaktisch gültig sind, aber bekanntermaßen von einem
Provider beim Replay abgelehnt werden. Wenn eine Reparatur erfolgt, wird die Originaldatei neben
der Sitzungsdatei gesichert.

Der Umfang umfasst:

- Reiner Laufzeit-Prompt-Kontext bleibt außerhalb der für Benutzer sichtbaren Transkript-Turns
- Bereinigung von Tool-Aufruf-IDs
- Validierung von Tool-Aufruf-Eingaben
- Reparatur der Paarung von Tool-Ergebnissen
- Turn-Validierung / Reihenfolge
- Bereinigung von Thought-Signaturen
- Bereinigung von Thinking-Signaturen
- Bereinigung von Bild-Payloads
- Bereinigung leerer Textblöcke vor dem Provider-Replay
- Herkunftsmarkierung von Benutzereingaben (für sitzungsübergreifend geroutete Prompts)
- Reparatur leerer Assistant-Fehler-Turns für Bedrock-Converse-Replay

Wenn Sie Details zur Transkriptspeicherung benötigen, siehe:

- [Ausführliche Informationen zur Sitzungsverwaltung](/de/reference/session-management-compaction)

---

## Globale Regel: Laufzeitkontext ist kein Benutzertranskript

Laufzeit-/Systemkontext kann dem Modell-Prompt für einen Turn hinzugefügt werden, ist aber
kein vom Endbenutzer verfasster Inhalt. OpenClaw hält einen separaten transkriptsichtbaren
Prompt-Body für Gateway-Antworten, eingereihte Follow-ups, ACP, CLI und eingebettete Pi-
Läufe vor. Gespeicherte sichtbare Benutzer-Turns verwenden diesen Transkript-Body anstelle des
laufzeitangereicherten Prompts.

Für Legacy-Sitzungen, die bereits Laufzeit-Wrapper persistiert haben, wenden Gateway-Verlaufsoberflächen
eine Anzeigeprojektion an, bevor Nachrichten an WebChat,
TUI-, REST- oder SSE-Clients zurückgegeben werden.

---

## Wo dies ausgeführt wird

Die gesamte Transkript-Hygiene ist im eingebetteten Runner zentralisiert:

- Richtlinienauswahl: `src/agents/transcript-policy.ts`
- Anwendung von Bereinigung/Reparatur: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Die Richtlinie verwendet `provider`, `modelApi` und `modelId`, um zu entscheiden, was angewendet wird.

Getrennt von der Transkript-Hygiene werden Sitzungsdateien vor dem Laden repariert (falls nötig):

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aufgerufen aus `run/attempt.ts` und `compact.ts` (eingebetteter Runner)

---

## Globale Regel: Bildbereinigung

Bild-Payloads werden immer bereinigt, um eine Provider-seitige Ablehnung wegen Größenbeschränkungen
zu verhindern (Herunterskalieren/Neukomprimieren übergroßer base64-Bilder).

Dies hilft außerdem, den durch Bilder verursachten Token-Druck für vision-fähige Modelle zu kontrollieren.
Niedrigere Maximalabmessungen reduzieren in der Regel die Token-Nutzung; höhere Abmessungen bewahren Details.

Implementierung:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildseite ist über `agents.defaults.imageMaxDimensionPx` konfigurierbar (Standard: `1200`).
- Leere Textblöcke werden entfernt, während dieser Durchlauf Replay-Inhalte durchläuft. Assistant-
  Turns, die dadurch leer werden, werden aus der Replay-Kopie verworfen; Benutzer- und Tool-Ergebnis-
  Turns, die dadurch leer werden, erhalten einen nicht leeren Platzhalter für ausgelassenen Inhalt.

---

## Globale Regel: fehlerhafte Tool-Aufrufe

Assistant-Tool-Aufruf-Blöcke, denen sowohl `input` als auch `arguments` fehlen, werden verworfen,
bevor der Modellkontext aufgebaut wird. Dies verhindert Provider-Ablehnungen durch teilweise
persistierte Tool-Aufrufe (zum Beispiel nach einem Rate-Limit-Fehler).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale Regel: Herkunft sitzungsübergreifender Eingaben

Wenn ein Agent über `sessions_send` einen Prompt in eine andere Sitzung sendet (einschließlich
Agent-zu-Agent-Antwort-/Ankündigungsschritten), persistiert OpenClaw den erstellten Benutzer-Turn mit:

- `message.provenance.kind = "inter_session"`

OpenClaw stellt dem gerouteten Prompt-Text außerdem im selben Turn eine Markierung
`[Inter-session message ... isUser=false]` voran, damit der aktive Modellaufruf
fremde Sitzungsausgaben von externen Endbenutzeranweisungen unterscheiden kann. Diese Markierung enthält,
sofern verfügbar, die Quellsitzung, den Kanal und das Tool. Das Transkript verwendet aus
Provider-Kompatibilitätsgründen weiterhin `role: "user"`, aber sowohl der sichtbare Text als auch die Herkunftsmetadaten
kennzeichnen den Turn als sitzungsübergreifende Daten.

Beim Neuaufbau des Kontexts wendet OpenClaw dieselbe Markierung auf ältere persistierte
sitzungsübergreifende Benutzer-Turns an, die nur Herkunftsmetadaten haben.

---

## Provider-Matrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bildbereinigung.
- Verwaiste Reasoning-Signaturen (eigenständige Reasoning-Elemente ohne folgenden Inhaltsblock) für OpenAI-Responses-/Codex-Transkripte verwerfen und replayfähiges OpenAI-Reasoning nach einem Modellroutenwechsel verwerfen.
- Replayfähige Payloads von OpenAI-Responses-Reasoning-Elementen beibehalten, einschließlich verschlüsselter Elemente mit leerer Zusammenfassung, damit manuelles/WebSocket-Replay den erforderlichen `rs_*`-Zustand mit Assistant-Ausgabeelementen gepaart hält.
- Keine Bereinigung von Tool-Aufruf-IDs.
- Die Reparatur der Tool-Ergebnis-Paarung kann echte übereinstimmende Ausgaben verschieben und Codex-artige `aborted`-Ausgaben für fehlende Tool-Aufrufe synthetisieren.
- Keine Turn-Validierung oder Neuordnung.
- Fehlende Tool-Ausgaben der OpenAI-Responses-Familie werden als `aborted` synthetisiert, um der Codex-Replay-Normalisierung zu entsprechen.
- Kein Entfernen von Thought-Signaturen.

**OpenAI-kompatibles Gemma 4**

- Frühere Assistant-Thinking-/Reasoning-Blöcke werden vor dem Replay entfernt, damit lokale
  OpenAI-kompatible Gemma-4-Server keine Reasoning-Inhalte aus vorherigen Turns erhalten.
- Aktuelle Tool-Aufruf-Fortsetzungen im selben Turn behalten den Assistant-Reasoning-Block
  am Tool-Aufruf, bis das Tool-Ergebnis replayt wurde.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Bereinigung von Tool-Aufruf-IDs: strikt alphanumerisch.
- Reparatur der Tool-Ergebnis-Paarung und synthetische Tool-Ergebnisse.
- Turn-Validierung (Turn-Abwechslung im Gemini-Stil).
- Korrektur der Google-Turn-Reihenfolge (einen kleinen Benutzer-Bootstrap voranstellen, wenn der Verlauf mit Assistant beginnt).
- Antigravity Claude: Thinking-Signaturen normalisieren; nicht signierte Thinking-Blöcke verwerfen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Tool-Ergebnis-Paarung und synthetische Tool-Ergebnisse.
- Turn-Validierung (aufeinanderfolgende Benutzer-Turns zusammenführen, um strikte Abwechslung zu erfüllen).
- Nachlaufende Assistant-Prefill-Turns werden aus ausgehenden Anthropic-Messages-
  Payloads entfernt, wenn Thinking aktiviert ist, einschließlich Cloudflare-AI-Gateway-Routen.
- Thinking-Blöcke mit fehlenden, leeren oder nur aus Leerraum bestehenden Replay-Signaturen werden
  vor der Provider-Konvertierung entfernt. Wenn dadurch ein Assistant-Turn leer wird, behält OpenClaw
  die Turn-Form mit nicht leerem Text für ausgelassenes Reasoning bei.
- Ältere reine Thinking-Assistant-Turns, die entfernt werden müssen, werden durch
  nicht leeren Text für ausgelassenes Reasoning ersetzt, damit Provider-Adapter den Replay-
  Turn nicht verwerfen.

**Amazon Bedrock (Converse API)**

- Leere Assistant-Stream-Error-Turns werden vor dem Replay zu einem nicht leeren Fallback-Textblock
  repariert. Bedrock Converse lehnt Assistant-Nachrichten mit `content: []` ab, daher werden
  persistierte Assistant-Turns mit `stopReason: "error"` und leerem Inhalt außerdem
  vor dem Laden auf der Festplatte repariert.
- Assistant-Stream-Error-Turns, die nur leere Textblöcke enthalten, werden
  aus der In-Memory-Replay-Kopie verworfen, anstatt einen ungültigen leeren Block zu replayen.
- Claude-Thinking-Blöcke mit fehlenden, leeren oder nur aus Leerraum bestehenden Replay-Signaturen werden
  vor dem Converse-Replay entfernt. Wenn dadurch ein Assistant-Turn leer wird, behält OpenClaw
  die Turn-Form mit nicht leerem Text für ausgelassenes Reasoning bei.
- Ältere reine Thinking-Assistant-Turns, die entfernt werden müssen, werden durch
  nicht leeren Text für ausgelassenes Reasoning ersetzt, damit das Converse-Replay die strikte Turn-Form beibehält.
- Replay filtert OpenClaw-Delivery-Mirror- und Gateway-injizierte Assistant-Turns.
- Bildbereinigung wird über die globale Regel angewendet.

**Mistral (einschließlich model-id-basierter Erkennung)**

- Bereinigung von Tool-Aufruf-IDs: strict9 (alphanumerisch, Länge 9).

**OpenRouter Gemini**

- Bereinigung von Thought-Signaturen: nicht-base64-`thought_signature`-Werte entfernen (base64 beibehalten).

**OpenRouter Anthropic**

- Nachlaufende Assistant-Prefill-Turns werden aus verifizierten OpenRouter-
  OpenAI-kompatiblen Anthropic-Modell-Payloads entfernt, wenn Reasoning aktiviert ist, entsprechend
  dem Replay-Verhalten von direktem Anthropic und Cloudflare Anthropic.

**Alles andere**

- Nur Bildbereinigung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor dem Release 2026.1.22 wendete OpenClaw mehrere Ebenen der Transkript-Hygiene an:

- Eine **transcript-sanitize-Erweiterung** lief bei jedem Kontextaufbau und konnte:
  - Paarungen aus Tool-Nutzung/Ergebnis reparieren.
  - Tool-Aufruf-IDs bereinigen (einschließlich eines nicht strikten Modus, der `_`/`-` beibehielt).
- Der Runner führte außerdem Provider-spezifische Bereinigung aus, wodurch Arbeit dupliziert wurde.
- Zusätzliche Mutationen erfolgten außerhalb der Provider-Richtlinie, darunter:
  - Entfernen von `<final>`-Tags aus Assistant-Text vor der Persistierung.
  - Verwerfen leerer Assistant-Fehler-Turns.
  - Kürzen von Assistant-Inhalten nach Tool-Aufrufen.

Diese Komplexität verursachte Cross-Provider-Regressionen (insbesondere bei der Paarung von `openai-responses`
`call_id|fc_id`). Die Bereinigung in 2026.1.22 entfernte die Erweiterung, zentralisierte
die Logik im Runner und machte OpenAI abgesehen von der Bildbereinigung **unverändert**.

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
