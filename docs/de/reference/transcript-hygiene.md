---
read_when:
    - Sie untersuchen Ablehnungen von Provider-Anfragen, die mit der Transkriptstruktur zusammenhängen.
    - Sie ändern die Transkriptbereinigung oder die Reparaturlogik für Tool-Aufrufe
    - Sie untersuchen Abweichungen bei Tool-Aufruf-IDs über Provider hinweg
summary: 'Referenz: Provider-spezifische Regeln für Transkriptbereinigung und Reparatur'
title: Transkript-Hygiene
x-i18n:
    generated_at: "2026-05-03T06:43:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff3a364a4c4d1c0d1e03b2860396c2d7e32c554d7acd0791ed2eaadae06d35ab
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw wendet **Provider-spezifische Korrekturen** auf Transkripte an, bevor ein Lauf beginnt (beim Aufbau des Modellkontexts). Die meisten davon sind **In-Memory**-Anpassungen, um strikte Provider-Anforderungen zu erfüllen. Ein separater Reparaturlauf für Session-Dateien kann gespeicherte JSONL-Daten ebenfalls neu schreiben, bevor die Session geladen wird, aber nur bei fehlerhaften Zeilen oder persistierten Turns, die keine gültigen dauerhaften Datensätze sind. Zugestellte Assistentenantworten bleiben auf dem Datenträger erhalten; Provider-spezifisches Entfernen von Assistenten-Prefill geschieht nur beim Erstellen ausgehender Payloads. Wenn eine Reparatur erfolgt, wird die Originaldatei neben der Session-Datei gesichert.

Der Umfang umfasst:

- Reiner Runtime-Prompt-Kontext bleibt außerhalb der für Benutzer sichtbaren Transkript-Turns
- Bereinigung von Tool-Call-IDs
- Validierung von Tool-Call-Eingaben
- Reparatur der Zuordnung von Tool-Ergebnissen
- Turn-Validierung/Reihenfolge
- Bereinigung von Thought-Signaturen
- Bereinigung von Thinking-Signaturen
- Bereinigung von Bild-Payloads
- Bereinigung leerer Textblöcke vor Provider-Replay
- Herkunftsmarkierung von Benutzereingaben (für zwischen Sessions weitergeleitete Prompts)
- Reparatur leerer Assistenten-Fehler-Turns für Bedrock-Converse-Replay

Wenn Sie Details zur Transkriptspeicherung benötigen, siehe:

- [Session-Management im Detail](/de/reference/session-management-compaction)

---

## Globale Regel: Runtime-Kontext ist kein Benutzertranskript

Runtime-/Systemkontext kann dem Modell-Prompt für einen Turn hinzugefügt werden, ist aber kein vom Endbenutzer verfasster Inhalt. OpenClaw hält einen separaten transkriptbezogenen Prompt-Body für Gateway-Antworten, eingereihte Follow-ups, ACP, CLI und eingebettete Pi-Läufe vor. Gespeicherte sichtbare Benutzer-Turns verwenden diesen Transkript-Body statt des mit Runtime-Kontext angereicherten Prompts.

Für Legacy-Sessions, die Runtime-Wrapper bereits persistiert haben, wenden Gateway-Verlaufsoberflächen eine Anzeigeprojektion an, bevor Nachrichten an WebChat-, TUI-, REST- oder SSE-Clients zurückgegeben werden.

---

## Wo dies läuft

Die gesamte Transkript-Hygiene ist im eingebetteten Runner zentralisiert:

- Richtlinienauswahl: `src/agents/transcript-policy.ts`
- Anwendung von Bereinigung/Reparatur: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Die Richtlinie verwendet `provider`, `modelApi` und `modelId`, um zu entscheiden, was angewendet wird.

Getrennt von der Transkript-Hygiene werden Session-Dateien vor dem Laden repariert (falls nötig):

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aufgerufen aus `run/attempt.ts` und `compact.ts` (eingebetteter Runner)

---

## Globale Regel: Bildbereinigung

Bild-Payloads werden immer bereinigt, um Provider-seitige Ablehnung aufgrund von Größenbeschränkungen zu verhindern (Herunterskalieren/Neukomprimieren übergroßer Base64-Bilder).

Dies hilft außerdem, den durch Bilder verursachten Token-Druck für vision-fähige Modelle zu kontrollieren. Kleinere Maximalabmessungen reduzieren im Allgemeinen die Token-Nutzung; größere Abmessungen erhalten Details.

Implementierung:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildseite ist über `agents.defaults.imageMaxDimensionPx` konfigurierbar (Standard: `1200`).
- Leere Textblöcke werden entfernt, während dieser Durchlauf Replay-Inhalte durchläuft. Assistenten-Turns, die dadurch leer werden, werden aus der Replay-Kopie entfernt; Benutzer- und Tool-Ergebnis-Turns, die leer werden, erhalten einen nicht leeren Platzhalter für ausgelassene Inhalte.

---

## Globale Regel: fehlerhafte Tool-Aufrufe

Assistenten-Tool-Call-Blöcke, denen sowohl `input` als auch `arguments` fehlen, werden entfernt, bevor der Modellkontext aufgebaut wird. Dies verhindert Provider-Ablehnungen durch teilweise persistierte Tool-Aufrufe (zum Beispiel nach einem Rate-Limit-Fehler).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale Regel: Herkunft von Eingaben zwischen Sessions

Wenn ein Agent über `sessions_send` einen Prompt in eine andere Session sendet (einschließlich Antwort-/Ankündigungsschritten von Agent zu Agent), persistiert OpenClaw den erstellten Benutzer-Turn mit:

- `message.provenance.kind = "inter_session"`

OpenClaw stellt dem weitergeleiteten Prompt-Text außerdem im selben Turn eine Markierung `[Inter-session message ... isUser=false]` voran, damit der aktive Modellaufruf Ausgaben fremder Sessions von externen Endbenutzeranweisungen unterscheiden kann. Diese Markierung enthält, sofern verfügbar, die Quell-Session, den Channel und das Tool. Das Transkript verwendet aus Provider-Kompatibilitätsgründen weiterhin `role: "user"`, aber sowohl der sichtbare Text als auch die Herkunftsmetadaten markieren den Turn als Daten zwischen Sessions.

Beim Neuaufbau des Kontexts wendet OpenClaw dieselbe Markierung auf ältere persistierte Inter-Session-Benutzer-Turns an, die nur Herkunftsmetadaten haben.

---

## Provider-Matrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bildbereinigung.
- Verwaiste Reasoning-Signaturen (eigenständige Reasoning-Elemente ohne folgenden Inhaltsblock) für OpenAI-Responses-/Codex-Transkripte entfernen und replay-fähiges OpenAI-Reasoning nach einem Modellroutenwechsel entfernen.
- Replay-fähige Reasoning-Element-Payloads von OpenAI Responses beibehalten, einschließlich verschlüsselter Elemente mit leerer Zusammenfassung, damit manuelles/WebSocket-Replay den erforderlichen `rs_*`-Status mit Assistentenausgabeelementen gekoppelt hält.
- Keine Bereinigung von Tool-Call-IDs.
- Die Reparatur der Tool-Ergebnis-Zuordnung kann echte passende Ausgaben verschieben und Codex-artige `aborted`-Ausgaben für fehlende Tool-Aufrufe synthetisieren.
- Keine Turn-Validierung oder Neuordnung.
- Fehlende Tool-Ausgaben der OpenAI-Responses-Familie werden als `aborted` synthetisiert, passend zur Codex-Replay-Normalisierung.
- Kein Entfernen von Thought-Signaturen.

**OpenAI-kompatibles Gemma 4**

- Historische Assistenten-Thinking-/Reasoning-Blöcke werden vor dem Replay entfernt, damit lokale OpenAI-kompatible Gemma-4-Server keine Reasoning-Inhalte aus vorherigen Turns erhalten.
- Aktuelle Tool-Call-Fortsetzungen im selben Turn behalten den Assistenten-Reasoning-Block am Tool-Aufruf, bis das Tool-Ergebnis erneut abgespielt wurde.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Bereinigung von Tool-Call-IDs: strikt alphanumerisch.
- Reparatur der Tool-Ergebnis-Zuordnung und synthetische Tool-Ergebnisse.
- Turn-Validierung (Turn-Wechsel im Gemini-Stil).
- Korrektur der Google-Turn-Reihenfolge (kleines Benutzer-Bootstrap voranstellen, wenn der Verlauf mit dem Assistenten beginnt).
- Antigravity Claude: Thinking-Signaturen normalisieren; unsignierte Thinking-Blöcke entfernen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Tool-Ergebnis-Zuordnung und synthetische Tool-Ergebnisse.
- Turn-Validierung (aufeinanderfolgende Benutzer-Turns zusammenführen, um strikte Alternation zu erfüllen).
- Nachfolgende Assistenten-Prefill-Turns werden aus ausgehenden Anthropic-Messages-Payloads entfernt, wenn Thinking aktiviert ist, einschließlich Cloudflare-AI-Gateway-Routen.
- Thinking-Blöcke mit fehlenden, leeren oder nur aus Leerraum bestehenden Replay-Signaturen werden vor der Provider-Konvertierung entfernt. Wenn dadurch ein Assistenten-Turn leer wird, behält OpenClaw die Turn-Form mit nicht leerem Text für ausgelassenes Reasoning bei.
- Ältere reine Thinking-Assistenten-Turns, die entfernt werden müssen, werden durch nicht leeren Text für ausgelassenes Reasoning ersetzt, damit Provider-Adapter den Replay-Turn nicht verwerfen.

**Amazon Bedrock (Converse API)**

- Leere Assistenten-Stream-Error-Turns werden vor dem Replay zu einem nicht leeren Fallback-Textblock repariert. Bedrock Converse lehnt Assistentennachrichten mit `content: []` ab; daher werden persistierte Assistenten-Turns mit `stopReason: "error"` und leerem Inhalt vor dem Laden auch auf dem Datenträger repariert.
- Assistenten-Stream-Error-Turns, die nur leere Textblöcke enthalten, werden aus der In-Memory-Replay-Kopie entfernt, statt einen ungültigen leeren Block erneut abzuspielen.
- Claude-Thinking-Blöcke mit fehlenden, leeren oder nur aus Leerraum bestehenden Replay-Signaturen werden vor dem Converse-Replay entfernt. Wenn dadurch ein Assistenten-Turn leer wird, behält OpenClaw die Turn-Form mit nicht leerem Text für ausgelassenes Reasoning bei.
- Ältere reine Thinking-Assistenten-Turns, die entfernt werden müssen, werden durch nicht leeren Text für ausgelassenes Reasoning ersetzt, damit das Converse-Replay die strikte Turn-Form beibehält.
- Replay filtert Delivery-Mirror- und Gateway-injizierte Assistenten-Turns von OpenClaw.
- Bildbereinigung erfolgt über die globale Regel.

**Mistral (einschließlich modell-ID-basierter Erkennung)**

- Bereinigung von Tool-Call-IDs: strict9 (alphanumerisch, Länge 9).

**OpenRouter Gemini**

- Bereinigung von Thought-Signaturen: Nicht-Base64-`thought_signature`-Werte entfernen (Base64 beibehalten).

**OpenRouter Anthropic**

- Nachfolgende Assistenten-Prefill-Turns werden aus verifizierten OpenRouter-OpenAI-kompatiblen Anthropic-Modell-Payloads entfernt, wenn Reasoning aktiviert ist, passend zum Replay-Verhalten von direktem Anthropic und Cloudflare Anthropic.

**Alles andere**

- Nur Bildbereinigung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor dem Release 2026.1.22 wendete OpenClaw mehrere Schichten der Transkript-Hygiene an:

- Eine **transcript-sanitize-Erweiterung** lief bei jedem Kontextaufbau und konnte:
  - Tool-Use-/Ergebnis-Zuordnung reparieren.
  - Tool-Call-IDs bereinigen (einschließlich eines nicht strikten Modus, der `_`/`-` beibehielt).
- Der Runner führte außerdem Provider-spezifische Bereinigung durch, wodurch Arbeit dupliziert wurde.
- Zusätzliche Mutationen erfolgten außerhalb der Provider-Richtlinie, darunter:
  - Entfernen von `<final>`-Tags aus Assistententext vor der Persistierung.
  - Entfernen leerer Assistenten-Fehler-Turns.
  - Kürzen von Assistenteninhalten nach Tool-Aufrufen.

Diese Komplexität verursachte providerübergreifende Regressionen (insbesondere bei der `call_id|fc_id`-Zuordnung von `openai-responses`). Die Bereinigung in 2026.1.22 entfernte die Erweiterung, zentralisierte die Logik im Runner und machte OpenAI jenseits der Bildbereinigung **no-touch**.

## Verwandt

- [Session-Management](/de/concepts/session)
- [Session-Pruning](/de/concepts/session-pruning)
