---
read_when:
    - Sie debuggen Provider-Anfrageablehnungen, die mit der Transkriptform zusammenhängen
    - Sie ändern die Transkript-Bereinigung oder die Reparaturlogik für Tool-Aufrufe
    - Sie untersuchen Tool-Call-ID-Abweichungen zwischen Providern
summary: 'Referenz: Provider-spezifische Regeln zur Bereinigung und Reparatur von Transkripten'
title: Transkripthygiene
x-i18n:
    generated_at: "2026-06-27T18:13:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca1c747b33dc0d6730281d6c91d28a0f8a85bcc5e5cb00dbdebdb55157871a7d
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw wendet vor einem Durchlauf (beim Aufbau des Modellkontexts) **provider-spezifische Korrekturen** auf Transkripte an. Die meisten davon sind Anpassungen **im Arbeitsspeicher**, mit denen strikte Provider-Anforderungen erfüllt werden. Ein separater Reparaturlauf für Sitzungsdateien kann gespeicherte JSONL-Daten vor dem Laden der Sitzung ebenfalls neu schreiben, jedoch nur für fehlerhafte Zeilen oder persistierte Turns, die keine gültigen dauerhaften Datensätze sind. Zugestellte Assistentenantworten bleiben auf dem Datenträger erhalten; provider-spezifisches Entfernen von Assistenten-Prefills geschieht nur beim Erstellen ausgehender Payloads. Wenn eine Reparatur erfolgt, wird die ursprüngliche Datei vor dem atomaren Ersetzen in eine temporäre gleichgeordnete `*.bak-<pid>-<ts>`-Datei geschrieben und entfernt, sobald das Ersetzen erfolgreich war; die Sicherung bleibt nur erhalten, wenn die Bereinigung selbst fehlschlägt (in diesem Fall wird der Pfad zurückgemeldet).

Der Umfang umfasst:

- Laufzeitbezogener Prompt-Kontext bleibt außerhalb benutzersichtbarer Transkript-Turns
- Bereinigung von Tool-Call-IDs
- Validierung von Tool-Call-Eingaben
- Reparatur der Zuordnung von Tool-Ergebnissen
- Turn-Validierung/-Reihenfolge
- Bereinigung von Thought-Signaturen
- Bereinigung von Thinking-Signaturen
- Bereinigung von Bild-Payloads
- Bereinigung leerer Textblöcke vor der Provider-Wiedergabe
- Bereinigung unvollständiger reiner Reasoning-Längen-Turns vor der Provider-Wiedergabe
- Herkunftskennzeichnung von Benutzereingaben (für sitzungsübergreifend weitergeleitete Prompts)
- Reparatur leerer Assistenten-Fehler-Turns für Bedrock-Converse-Wiedergabe

Wenn Sie Details zur Transkriptspeicherung benötigen, siehe:

- [Ausführliche Sitzungsverwaltung](/de/reference/session-management-compaction)

---

## Globale Regel: Laufzeitkontext ist kein Benutzertranskript

Laufzeit-/Systemkontext kann dem Modell-Prompt für einen Turn hinzugefügt werden, ist aber kein vom Endbenutzer verfasster Inhalt. OpenClaw hält einen separaten transkriptbezogenen Prompt-Body für Gateway-Antworten, eingereihte Follow-ups, ACP, CLI und eingebettete OpenClaw-Durchläufe vor. Gespeicherte sichtbare Benutzer-Turns verwenden diesen Transkript-Body statt des zur Laufzeit angereicherten Prompts.

Für Legacy-Sitzungen, in denen Laufzeit-Wrapper bereits persistiert wurden, wenden Gateway-Verlaufsoberflächen vor der Rückgabe von Nachrichten an WebChat-, TUI-, REST- oder SSE-Clients eine Anzeigeprojektion an.

---

## Wo dies ausgeführt wird

Die gesamte Transkript-Hygiene ist im eingebetteten Runner zentralisiert:

- Richtlinienauswahl: `src/agents/transcript-policy.ts`
- Anwendung von Bereinigung/Reparatur: `sanitizeSessionHistory` in `src/agents/embedded-agent-runner/replay-history.ts`

Die Richtlinie verwendet `provider`, `modelApi` und `modelId`, um zu entscheiden, was angewendet wird.

Getrennt von der Transkript-Hygiene werden Sitzungsdateien vor dem Laden repariert (falls erforderlich):

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aufgerufen aus `run/attempt.ts` und `compact.ts` (eingebetteter Runner)

---

## Globale Regel: Bildbereinigung

Bild-Payloads werden immer bereinigt, um provider-seitige Ablehnungen aufgrund von Größenbeschränkungen zu verhindern (Herunterskalieren/Neukomprimieren übergroßer base64-Bilder).

Dies hilft außerdem, bildgetriebenen Token-Druck für vision-fähige Modelle zu steuern. Niedrigere Maximalabmessungen reduzieren im Allgemeinen die Token-Nutzung; höhere Abmessungen erhalten Details.

Implementierung:

- `sanitizeSessionMessagesImages` in `src/agents/embedded-agent-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildkante ist über `agents.defaults.imageMaxDimensionPx` konfigurierbar (Standard: `1200`).
- Leere Textblöcke werden entfernt, während dieser Lauf Wiedergabeinhalte durchläuft. Assistenten-Turns, die dadurch leer werden, werden aus der Wiedergabekopie entfernt; Benutzer- und Tool-Ergebnis-Turns, die leer werden, erhalten einen nicht leeren Platzhalter für ausgelassenen Inhalt.

---

## Globale Regel: fehlerhafte Tool-Calls

Assistenten-Tool-Call-Blöcke, denen sowohl `input` als auch `arguments` fehlen, werden entfernt, bevor der Modellkontext aufgebaut wird. Dies verhindert Provider-Ablehnungen durch teilweise persistierte Tool-Calls (zum Beispiel nach einem Rate-Limit-Fehler).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory` in `src/agents/embedded-agent-runner/replay-history.ts`

---

## Globale Regel: unvollständige reine Reasoning-Turns

Assistenten-Turns, die das Provider-Ausgabelimit nur mit Thinking- oder redacted-thinking-Inhalt erreichen, werden aus der Wiedergabekopie im Arbeitsspeicher ausgelassen. Solche Turns enthalten unvollständigen Provider-Zustand und können eine teilweise Thinking-Signatur tragen.

Leere Längen-Turns bleiben unverändert, ebenso Längen-Turns mit sichtbarem Text, Tool-Calls oder unbekannten Inhaltsblöcken. Gespeicherte Transkripte werden nicht neu geschrieben.

Implementierung:

- `normalizeAssistantReplayContent` in `src/agents/embedded-agent-runner/replay-history.ts`

---

## Globale Regel: Herkunft sitzungsübergreifender Eingaben

Wenn ein Agent über `sessions_send` einen Prompt an eine andere Sitzung sendet (einschließlich Agent-zu-Agent-Antwort-/Ankündigungsschritten), persistiert OpenClaw den erstellten Benutzer-Turn mit:

- `message.provenance.kind = "inter_session"`

OpenClaw stellt außerdem dem weitergeleiteten Prompt-Text im selben Turn eine `[Inter-session message ... isUser=false]`-Markierung voran, damit der aktive Modellaufruf fremde Sitzungsausgabe von externen Endbenutzeranweisungen unterscheiden kann. Diese Markierung enthält, sofern verfügbar, die Quellsitzung, den Kanal und das Tool. Das Transkript verwendet aus Provider-Kompatibilitätsgründen weiterhin `role: "user"`, aber sowohl der sichtbare Text als auch die Herkunftsmetadaten markieren den Turn als sitzungsübergreifende Daten.

Beim Neuaufbau des Kontexts wendet OpenClaw dieselbe Markierung auf ältere persistierte sitzungsübergreifende Benutzer-Turns an, die nur Herkunftsmetadaten besitzen.

---

## Provider-Matrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bildbereinigung.
- Verwaiste Reasoning-Signaturen (eigenständige Reasoning-Elemente ohne folgenden Inhaltsblock) für OpenAI-Responses-/Codex-Transkripte entfernen und wiedergabefähiges OpenAI-Reasoning nach einem Modellroutenwechsel entfernen.
- Wiedergabefähige OpenAI-Responses-Reasoning-Element-Payloads erhalten, einschließlich verschlüsselter Elemente mit leerer Zusammenfassung, damit manuelle/WebSocket-Wiedergabe den erforderlichen `rs_*`-Zustand mit Assistenten-Ausgabeelementen gekoppelt hält.
- Native ChatGPT Codex Responses folgt der Codex-Wire-Parität, indem frühere Responses-Reasoning-/Nachrichten-/Funktions-Payloads ohne vorherige Element-IDs wiedergegeben werden, während der Sitzungs-`prompt_cache_key` erhalten bleibt.
- Wiedergabe der OpenAI-Responses-Familie erhält kanonische `call_*|fc_*`-Reasoning-Paare desselben Modells, normalisiert aber fehlerhafte oder überlange `call_id`-/Function-Call-Element-IDs vor der pi-ai-Payload-Konvertierung deterministisch.
- Die Reparatur der Tool-Ergebnis-Zuordnung kann tatsächlich passende Ausgaben verschieben und Codex-artige `aborted`-Ausgaben für fehlende Tool-Calls synthetisieren.
- Keine Turn-Validierung oder Neusortierung.
- Fehlende Tool-Ausgaben der OpenAI-Responses-Familie werden als `aborted` synthetisiert, um der Codex-Wiedergabenormalisierung zu entsprechen.
- Kein Entfernen von Thought-Signaturen.

**OpenAI-kompatible Chat Completions**

- Historische Assistenten-Thinking-/Reasoning-Blöcke werden vor der Wiedergabe entfernt, damit lokale und proxy-artige OpenAI-kompatible Server keine Reasoning-Felder aus vorherigen Turns wie `reasoning` oder `reasoning_content` erhalten.
- Aktuelle Tool-Call-Fortsetzungen im selben Turn behalten den Assistenten-Reasoning-Block am Tool-Call, bis das Tool-Ergebnis wiedergegeben wurde.
- Benutzerdefinierte/selbstgehostete Modelleinträge mit `reasoning: true` erhalten wiedergegebene Reasoning-Metadaten.
- Provider-eigene Ausnahmen können sich abmelden, wenn ihr Wire-Protokoll wiedergegebene Reasoning-Metadaten erfordert.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Bereinigung von Tool-Call-IDs: strikt alphanumerisch.
- Reparatur der Tool-Ergebnis-Zuordnung und synthetische Tool-Ergebnisse.
- Turn-Validierung (Turn-Wechsel im Gemini-Stil).
- Google-Turn-Reihenfolgenkorrektur (einen winzigen Benutzer-Bootstrap voranstellen, wenn der Verlauf mit dem Assistenten beginnt).
- Antigravity Claude: Thinking-Signaturen normalisieren; unsignierte Thinking-Blöcke entfernen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Tool-Ergebnis-Zuordnung und synthetische Tool-Ergebnisse.
- Turn-Validierung (aufeinanderfolgende Benutzer-Turns zusammenführen, um strikten Wechsel zu erfüllen).
- Nachgestellte Assistenten-Prefill-Turns werden aus ausgehenden Anthropic-Messages-Payloads entfernt, wenn Thinking aktiviert ist, einschließlich Cloudflare-AI-Gateway-Routen.
- Vor-Compaction-Assistenten-Thinking-Signaturen werden vor der Provider-Wiedergabe entfernt, wenn eine Sitzung kompaktiert wurde. Thinking-Signaturen sind zum Erzeugungszeitpunkt kryptografisch an das Konversationspräfix gebunden; nach der Compaction ändert sich das Präfix (zusammengefasster Inhalt wird durch eine Compaction-Zusammenfassung ersetzt), sodass die Wiedergabe der ursprünglichen Signaturen dazu führt, dass Anthropic die Anfrage mit "Invalid signature in thinking block" ablehnt. Der Thinking-Text bleibt als unsignierter Block erhalten und wird dann durch die folgende Regel behandelt.
- Thinking-Blöcke mit fehlenden, leeren oder blanken Wiedergabesignaturen werden vor der Provider-Konvertierung entfernt. Wenn dadurch ein Assistenten-Turn leer wird, behält OpenClaw die Turn-Form mit nicht leerem ausgelassenem Reasoning-Text bei.
- Ältere reine Thinking-Assistenten-Turns, die entfernt werden müssen, werden durch nicht leeren ausgelassenen Reasoning-Text ersetzt, damit Provider-Adapter den Wiedergabe-Turn nicht entfernen.

**Amazon Bedrock (Converse API)**

- Leere Assistenten-Stream-Fehler-Turns werden vor der Wiedergabe zu einem nicht leeren Fallback-Textblock repariert. Bedrock Converse lehnt Assistentennachrichten mit `content: []` ab, daher werden persistierte Assistenten-Turns mit `stopReason: "error"` und leerem Inhalt auch vor dem Laden auf dem Datenträger repariert.
- Assistenten-Stream-Fehler-Turns, die nur leere Textblöcke enthalten, werden aus der Wiedergabekopie im Arbeitsspeicher entfernt, statt einen ungültigen leeren Block wiederzugeben.
- Vor-Compaction-Assistenten-Thinking-Signaturen werden vor der Converse-Wiedergabe entfernt, wenn eine Sitzung kompaktiert wurde, aus demselben Grund wie bei Anthropic oben.
- Claude-Thinking-Blöcke mit fehlenden, leeren oder blanken Wiedergabesignaturen werden vor der Converse-Wiedergabe entfernt. Wenn dadurch ein Assistenten-Turn leer wird, behält OpenClaw die Turn-Form mit nicht leerem ausgelassenem Reasoning-Text bei.
- Ältere reine Thinking-Assistenten-Turns, die entfernt werden müssen, werden durch nicht leeren ausgelassenen Reasoning-Text ersetzt, damit die Converse-Wiedergabe die strikte Turn-Form beibehält.
- Die Wiedergabe filtert OpenClaw-Zustellungsspiegel- und Gateway-injizierte Assistenten-Turns.
- Bildbereinigung gilt über die globale Regel.

**Mistral (einschließlich modell-ID-basierter Erkennung)**

- Bereinigung von Tool-Call-IDs: strict9 (alphanumerisch, Länge 9).

**OpenRouter Gemini**

- Bereinigung von Thought-Signaturen: nicht-base64-`thought_signature`-Werte entfernen (base64 beibehalten).

**OpenRouter Anthropic**

- Nachgestellte Assistenten-Prefill-Turns werden aus verifizierten OpenRouter-OpenAI-kompatiblen Anthropic-Modell-Payloads entfernt, wenn Reasoning aktiviert ist; dies entspricht dem Wiedergabeverhalten von direktem Anthropic und Cloudflare Anthropic.

**Alles andere**

- Nur Bildbereinigung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor dem Release 2026.1.22 wendete OpenClaw mehrere Ebenen der Transkript-Hygiene an:

- Eine **transcript-sanitize-Erweiterung** lief bei jedem Kontextaufbau und konnte:
  - Tool-Use-/Ergebnis-Zuordnung reparieren.
  - Tool-Call-IDs bereinigen (einschließlich eines nicht strikten Modus, der `_`/`-` beibehielt).
- Der Runner führte außerdem provider-spezifische Bereinigung aus, wodurch Arbeit dupliziert wurde.
- Zusätzliche Mutationen erfolgten außerhalb der Provider-Richtlinie, darunter:
  - Entfernen von `<final>`-Tags aus Assistententext vor der Persistierung.
  - Entfernen leerer Assistenten-Fehler-Turns.
  - Kürzen von Assistenteninhalten nach Tool-Calls.

Diese Komplexität verursachte provider-übergreifende Regressionen (insbesondere `openai-responses`-`call_id|fc_id`-Zuordnung). Die Bereinigung in 2026.1.22 entfernte die Erweiterung, zentralisierte die Logik im Runner und machte OpenAI über die Bildbereinigung hinaus **no-touch**.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
