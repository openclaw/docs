---
read_when:
    - Sie untersuchen Ablehnungen von Provider-Anfragen, die mit der Transkriptstruktur zusammenhängen
    - Sie ändern die Transkriptbereinigung oder die Reparaturlogik für Tool-Aufrufe
    - Sie untersuchen Unstimmigkeiten bei Tool-Call-IDs zwischen Providern
summary: 'Referenz: Provider-spezifische Regeln zur Transkriptbereinigung und Reparatur'
title: Transkripthygiene
x-i18n:
    generated_at: "2026-05-05T01:49:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9441494f3e8bb18d1648acc789a40bf9501fe3f2d32b6293792e6a24710675d0
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw wendet **Provider-spezifische Korrekturen** auf Transkripte an, bevor ein Lauf startet (beim Aufbau des Modellkontexts). Die meisten davon sind **In-Memory**-Anpassungen, um strenge Provider-Anforderungen zu erfüllen. Ein separater Reparaturlauf für Sitzungsdateien kann gespeicherte JSONL-Dateien ebenfalls neu schreiben, bevor die Sitzung geladen wird, jedoch nur bei fehlerhaften Zeilen oder persistierten Nachrichtenwechseln, die keine gültigen dauerhaften Datensätze sind. Ausgelieferte Assistentenantworten bleiben auf dem Datenträger erhalten; Provider-spezifisches Entfernen von Assistant-Prefill erfolgt nur beim Erstellen ausgehender Payloads. Wenn eine Reparatur erfolgt, wird die Originaldatei neben der Sitzungsdatei gesichert.

Der Umfang umfasst:

- Nur zur Laufzeit verwendeter Prompt-Kontext bleibt außerhalb nutzersichtbarer Transkript-Nachrichtenwechsel
- Bereinigung von Tool-Aufruf-IDs
- Validierung von Tool-Aufruf-Eingaben
- Reparatur der Paarung von Tool-Ergebnissen
- Validierung / Reihenfolge von Nachrichtenwechseln
- Bereinigung von Thought-Signaturen
- Bereinigung von Thinking-Signaturen
- Bereinigung von Bild-Payloads
- Bereinigung leerer Textblöcke vor der Provider-Wiedergabe
- Herkunftskennzeichnung von Nutzereingaben (für sitzungsübergreifend weitergeleitete Prompts)
- Reparatur leerer Assistenten-Fehler-Nachrichtenwechsel für Bedrock-Converse-Wiedergabe

Wenn Sie Details zur Transkriptspeicherung benötigen, siehe:

- [Ausführliche Informationen zur Sitzungsverwaltung](/de/reference/session-management-compaction)

---

## Globale Regel: Laufzeitkontext ist kein Nutzertranskript

Laufzeit-/Systemkontext kann dem Modell-Prompt für einen Nachrichtenwechsel hinzugefügt werden, ist aber kein vom Endnutzer verfasster Inhalt. OpenClaw verwaltet einen separaten transkriptbezogenen Prompt-Body für Gateway-Antworten, eingereihte Folgeanfragen, ACP, CLI und eingebettete Pi-Läufe. Gespeicherte sichtbare Nutzer-Nachrichtenwechsel verwenden diesen Transkript-Body anstelle des mit Laufzeitkontext angereicherten Prompts.

Für Altsitzungen, die Laufzeit-Wrapper bereits persistiert haben, wenden Gateway-Verlaufsoberflächen eine Anzeigeprojektion an, bevor sie Nachrichten an WebChat-, TUI-, REST- oder SSE-Clients zurückgeben.

---

## Wo dies läuft

Die gesamte Transkript-Hygiene ist im eingebetteten Runner zentralisiert:

- Policy-Auswahl: `src/agents/transcript-policy.ts`
- Anwendung von Bereinigung/Reparatur: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Die Policy verwendet `provider`, `modelApi` und `modelId`, um zu entscheiden, was angewendet wird.

Getrennt von der Transkript-Hygiene werden Sitzungsdateien vor dem Laden repariert (falls nötig):

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aufgerufen aus `run/attempt.ts` und `compact.ts` (eingebetteter Runner)

---

## Globale Regel: Bildbereinigung

Bild-Payloads werden immer bereinigt, um Provider-seitige Ablehnungen aufgrund von Größenbeschränkungen zu verhindern (Herunterskalieren/Neukomprimieren übergroßer Base64-Bilder).

Dies hilft außerdem, den bildbedingten Token-Druck für vision-fähige Modelle zu kontrollieren. Niedrigere maximale Abmessungen reduzieren im Allgemeinen die Token-Nutzung; höhere Abmessungen bewahren Details.

Implementierung:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildseite ist über `agents.defaults.imageMaxDimensionPx` konfigurierbar (Standard: `1200`).
- Leere Textblöcke werden entfernt, während dieser Lauf Wiedergabeinhalte durchläuft. Assistenten-Nachrichtenwechsel, die dadurch leer werden, werden aus der Wiedergabekopie entfernt; Nutzer- und Tool-Ergebnis-Nachrichtenwechsel, die dadurch leer werden, erhalten einen nicht leeren Platzhalter für ausgelassenen Inhalt.

---

## Globale Regel: fehlerhafte Tool-Aufrufe

Assistenten-Tool-Aufrufblöcke, denen sowohl `input` als auch `arguments` fehlen, werden verworfen, bevor der Modellkontext aufgebaut wird. Dies verhindert Provider-Ablehnungen durch teilweise persistierte Tool-Aufrufe (zum Beispiel nach einem Ratenlimitfehler).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale Regel: Herkunft sitzungsübergreifender Eingaben

Wenn ein Agent über `sessions_send` einen Prompt in eine andere Sitzung sendet (einschließlich Agent-zu-Agent-Antwort-/Ankündigungsschritten), persistiert OpenClaw den erstellten Nutzer-Nachrichtenwechsel mit:

- `message.provenance.kind = "inter_session"`

OpenClaw stellt dem weitergeleiteten Prompt-Text außerdem im selben Nachrichtenwechsel eine Markierung `[Inter-session message ... isUser=false]` voran, damit der aktive Modellaufruf fremde Sitzungsausgabe von externen Endnutzeranweisungen unterscheiden kann. Diese Markierung enthält, sofern verfügbar, Quellsitzung, Kanal und Tool. Das Transkript verwendet aus Provider-Kompatibilitätsgründen weiterhin `role: "user"`, aber sichtbarer Text und Herkunftsmetadaten kennzeichnen den Nachrichtenwechsel beide als sitzungsübergreifende Daten.

Beim Neuaufbau des Kontexts wendet OpenClaw dieselbe Markierung auf ältere persistierte sitzungsübergreifende Nutzer-Nachrichtenwechsel an, die nur Herkunftsmetadaten haben.

---

## Provider-Matrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bildbereinigung.
- Verwaiste Reasoning-Signaturen (eigenständige Reasoning-Elemente ohne folgenden Inhaltsblock) für OpenAI-Responses-/Codex-Transkripte verwerfen und wiedergabefähiges OpenAI-Reasoning nach einem Modellroutenwechsel verwerfen.
- Wiedergabefähige OpenAI-Responses-Reasoning-Element-Payloads einschließlich verschlüsselter Empty-Summary-Elemente beibehalten, damit manuelle/WebSocket-Wiedergabe den erforderlichen `rs_*`-Zustand mit Assistentenausgabe-Elementen gepaart hält.
- Native ChatGPT-Codex-Responses folgt der Codex-Wire-Parität, indem frühere Responses-Reasoning-/Message-/Function-Payloads ohne frühere Element-IDs wiedergegeben werden, während der Sitzungs-`prompt_cache_key` erhalten bleibt.
- Keine Bereinigung von Tool-Aufruf-IDs.
- Die Reparatur der Paarung von Tool-Ergebnissen kann echte zugeordnete Ausgaben verschieben und Codex-artige `aborted`-Ausgaben für fehlende Tool-Aufrufe synthetisieren.
- Keine Validierung oder Neuordnung von Nachrichtenwechseln.
- Fehlende Tool-Ausgaben der OpenAI-Responses-Familie werden als `aborted` synthetisiert, um der Codex-Wiedergabenormalisierung zu entsprechen.
- Kein Entfernen von Thought-Signaturen.

**OpenAI-kompatibles Gemma 4**

- Historische Assistenten-Thinking-/Reasoning-Blöcke werden vor der Wiedergabe entfernt, damit lokale OpenAI-kompatible Gemma-4-Server keine Reasoning-Inhalte aus früheren Nachrichtenwechseln erhalten.
- Aktuelle Tool-Aufruf-Fortsetzungen im selben Nachrichtenwechsel behalten den Assistenten-Reasoning-Block am Tool-Aufruf angehängt, bis das Tool-Ergebnis wiedergegeben wurde.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Bereinigung von Tool-Aufruf-IDs: strikt alphanumerisch.
- Reparatur der Paarung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Validierung von Nachrichtenwechseln (Gemini-artige Alternation der Nachrichtenwechsel).
- Korrektur der Google-Nachrichtenwechsel-Reihenfolge (einen winzigen Nutzer-Bootstrap voranstellen, wenn der Verlauf mit dem Assistenten beginnt).
- Antigravity Claude: Thinking-Signaturen normalisieren; unsignierte Thinking-Blöcke verwerfen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Paarung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Validierung von Nachrichtenwechseln (aufeinanderfolgende Nutzer-Nachrichtenwechsel zusammenführen, um strikte Alternation zu erfüllen).
- Abschließende Assistant-Prefill-Nachrichtenwechsel werden aus ausgehenden Anthropic-Messages-Payloads entfernt, wenn Thinking aktiviert ist, einschließlich Cloudflare-AI-Gateway-Routen.
- Thinking-Blöcke mit fehlenden, leeren oder nur aus Leerzeichen bestehenden Wiedergabe-Signaturen werden vor der Provider-Konvertierung entfernt. Wenn dadurch ein Assistenten-Nachrichtenwechsel leer wird, behält OpenClaw die Form des Nachrichtenwechsels mit nicht leerem Text für ausgelassenes Reasoning bei.
- Ältere reine Thinking-Assistenten-Nachrichtenwechsel, die entfernt werden müssen, werden durch nicht leeren Text für ausgelassenes Reasoning ersetzt, damit Provider-Adapter den Wiedergabe-Nachrichtenwechsel nicht verwerfen.

**Amazon Bedrock (Converse API)**

- Leere Assistenten-Stream-Fehler-Nachrichtenwechsel werden vor der Wiedergabe in einen nicht leeren Fallback-Textblock repariert. Bedrock Converse lehnt Assistentennachrichten mit `content: []` ab, daher werden persistierte Assistenten-Nachrichtenwechsel mit `stopReason: "error"` und leerem Inhalt vor dem Laden auch auf dem Datenträger repariert.
- Assistenten-Stream-Fehler-Nachrichtenwechsel, die nur leere Textblöcke enthalten, werden aus der In-Memory-Wiedergabekopie entfernt, statt einen ungültigen leeren Block wiederzugeben.
- Claude-Thinking-Blöcke mit fehlenden, leeren oder nur aus Leerzeichen bestehenden Wiedergabe-Signaturen werden vor der Converse-Wiedergabe entfernt. Wenn dadurch ein Assistenten-Nachrichtenwechsel leer wird, behält OpenClaw die Form des Nachrichtenwechsels mit nicht leerem Text für ausgelassenes Reasoning bei.
- Ältere reine Thinking-Assistenten-Nachrichtenwechsel, die entfernt werden müssen, werden durch nicht leeren Text für ausgelassenes Reasoning ersetzt, damit die Converse-Wiedergabe die strikte Form der Nachrichtenwechsel beibehält.
- Die Wiedergabe filtert OpenClaw-Auslieferungsspiegel- und Gateway-injizierte Assistenten-Nachrichtenwechsel.
- Bildbereinigung wird über die globale Regel angewendet.

**Mistral (einschließlich modell-ID-basierter Erkennung)**

- Bereinigung von Tool-Aufruf-IDs: strict9 (alphanumerisch, Länge 9).

**OpenRouter Gemini**

- Bereinigung von Thought-Signaturen: Nicht-Base64-`thought_signature`-Werte entfernen (Base64 beibehalten).

**OpenRouter Anthropic**

- Abschließende Assistant-Prefill-Nachrichtenwechsel werden aus verifizierten OpenRouter-OpenAI-kompatiblen Anthropic-Modell-Payloads entfernt, wenn Reasoning aktiviert ist, entsprechend dem Wiedergabeverhalten von direktem Anthropic und Cloudflare Anthropic.

**Alles Weitere**

- Nur Bildbereinigung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor dem Release 2026.1.22 wendete OpenClaw mehrere Ebenen der Transkript-Hygiene an:

- Eine **Transcript-Sanitize-Erweiterung** lief bei jedem Kontextaufbau und konnte:
  - Tool-Nutzung-/Ergebnis-Paarung reparieren.
  - Tool-Aufruf-IDs bereinigen (einschließlich eines nicht strikten Modus, der `_`/`-` beibehielt).
- Der Runner führte außerdem Provider-spezifische Bereinigung aus, was Arbeit duplizierte.
- Zusätzliche Mutationen erfolgten außerhalb der Provider-Policy, darunter:
  - Entfernen von `<final>`-Tags aus Assistententext vor der Persistierung.
  - Verwerfen leerer Assistenten-Fehler-Nachrichtenwechsel.
  - Kürzen von Assistenteninhalten nach Tool-Aufrufen.

Diese Komplexität verursachte providerübergreifende Regressionen (insbesondere bei der `openai-responses`-Paarung von `call_id|fc_id`). Die Bereinigung in 2026.1.22 entfernte die Erweiterung, zentralisierte die Logik im Runner und machte OpenAI über die Bildbereinigung hinaus **unangetastet**.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
