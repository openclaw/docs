---
read_when:
    - Sie debuggen Provider-Ablehnungen von Anfragen, die mit der Transkriptstruktur zusammenhängen
    - Sie ändern die Transkriptbereinigung oder die Reparaturlogik für Tool-Aufrufe
    - Sie untersuchen Nichtübereinstimmungen bei Tool-Call-IDs zwischen Providern.
summary: 'Referenz: Provider-spezifische Regeln zur Bereinigung und Reparatur von Transkripten'
title: Transkript-Hygiene
x-i18n:
    generated_at: "2026-05-10T19:52:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 197081fe829cf6463e84c5ead9b4c631a8088e771e68163a35ed39d9efbdbf6a
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw wendet vor einem Lauf (beim Aufbau des Modellkontexts) **Provider-spezifische Korrekturen** auf Transkripte an. Die meisten davon sind **In-Memory**-Anpassungen, die strenge Provider-Anforderungen erfüllen. Ein separater Reparaturdurchlauf für Sitzungsdateien kann gespeichertes JSONL ebenfalls neu schreiben, bevor die Sitzung geladen wird, jedoch nur bei fehlerhaften Zeilen oder persistierten Turns, die keine gültigen dauerhaften Datensätze sind. Ausgelieferte Assistant-Antworten bleiben auf der Festplatte erhalten; Provider-spezifisches Entfernen von Assistant-Prefill geschieht nur beim Erstellen ausgehender Payloads. Wenn eine Reparatur erfolgt, wird die Originaldatei neben der Sitzungsdatei gesichert.

Der Umfang umfasst:

- Runtime-only-Prompt-Kontext, der nicht in benutzersichtbaren Transkript-Turns landet
- Bereinigung von Tool-Call-IDs
- Validierung von Tool-Call-Eingaben
- Reparatur der Tool-Result-Zuordnung
- Turn-Validierung/-Reihenfolge
- Bereinigung von Gedankensignaturen
- Bereinigung von Thinking-Signaturen
- Bereinigung von Bild-Payloads
- Bereinigung leerer Textblöcke vor Provider-Replay
- Herkunftsmarkierung von Benutzereingaben (für sitzungsübergreifend geroutete Prompts)
- Reparatur leerer Assistant-Fehler-Turns für Bedrock-Converse-Replay

Wenn Sie Details zur Transkriptspeicherung benötigen, siehe:

- [Vertiefung zur Sitzungsverwaltung](/de/reference/session-management-compaction)

---

## Globale Regel: Runtime-Kontext ist kein Benutzertranskript

Runtime-/Systemkontext kann dem Modell-Prompt für einen Turn hinzugefügt werden, ist aber
kein vom Endbenutzer verfasster Inhalt. OpenClaw hält einen separaten
transkriptbezogenen Prompt-Body für Gateway-Antworten, eingereihte Follow-ups, ACP, CLI und eingebettete Pi-
Läufe. Gespeicherte sichtbare Benutzer-Turns verwenden diesen Transkript-Body statt des
um Runtime-Daten angereicherten Prompts.

Für Legacy-Sitzungen, in denen Runtime-Wrapper bereits persistiert wurden, wenden Gateway-Verlaufs-
Oberflächen eine Anzeigeprojektion an, bevor sie Nachrichten an WebChat-,
TUI-, REST- oder SSE-Clients zurückgeben.

---

## Wo dies ausgeführt wird

Die gesamte Transkripthygiene ist im eingebetteten Runner zentralisiert:

- Richtlinienauswahl: `src/agents/transcript-policy.ts`
- Anwendung von Bereinigung/Reparatur: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Die Richtlinie verwendet `provider`, `modelApi` und `modelId`, um zu entscheiden, was angewendet wird.

Getrennt von der Transkripthygiene werden Sitzungsdateien (falls nötig) vor dem Laden repariert:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aufgerufen aus `run/attempt.ts` und `compact.ts` (eingebetteter Runner)

---

## Globale Regel: Bildbereinigung

Bild-Payloads werden immer bereinigt, um Provider-seitige Ablehnungen aufgrund von Größen-
limits zu verhindern (Herunterskalieren/erneutes Komprimieren übergroßer base64-Bilder).

Dies hilft außerdem, den bildbedingten Tokendruck für vision-fähige Modelle zu kontrollieren.
Niedrigere Maximalabmessungen reduzieren im Allgemeinen die Token-Nutzung; höhere Abmessungen erhalten Details.

Implementierung:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildseite ist über `agents.defaults.imageMaxDimensionPx` konfigurierbar (Standard: `1200`).
- Leere Textblöcke werden entfernt, während dieser Durchlauf Replay-Inhalte durchläuft. Assistant-
  Turns, die dadurch leer werden, werden aus der Replay-Kopie entfernt; Benutzer- und Tool-Result-
  Turns, die leer werden, erhalten einen nicht leeren Platzhalter für ausgelassene Inhalte.

---

## Globale Regel: fehlerhafte Tool-Calls

Assistant-Tool-Call-Blöcke, denen sowohl `input` als auch `arguments` fehlen, werden entfernt,
bevor der Modellkontext aufgebaut wird. Dies verhindert Provider-Ablehnungen durch teilweise
persistierte Tool-Calls (zum Beispiel nach einem Rate-Limit-Fehler).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale Regel: Herkunft sitzungsübergreifender Eingaben

Wenn ein Agent über `sessions_send` einen Prompt in eine andere Sitzung sendet (einschließlich
Agent-zu-Agent-Antwort-/Ankündigungsschritten), persistiert OpenClaw den erstellten Benutzer-Turn mit:

- `message.provenance.kind = "inter_session"`

OpenClaw stellt dem gerouteten Prompt-Text außerdem im selben Turn einen
Marker `[Inter-session message ... isUser=false]` voran, damit der aktive Modellaufruf
fremde Sitzungsausgabe von externen Endbenutzeranweisungen unterscheiden kann. Dieser Marker enthält,
wenn verfügbar, die Quellsitzung, den Kanal und das Tool. Das Transkript verwendet aus
Provider-Kompatibilitätsgründen weiterhin `role: "user"`, aber sichtbarer Text und Herkunfts-
Metadaten markieren den Turn beide als sitzungsübergreifende Daten.

Beim Neuaufbau des Kontexts wendet OpenClaw denselben Marker auf ältere persistierte
sitzungsübergreifende Benutzer-Turns an, die nur Herkunftsmetadaten besitzen.

---

## Provider-Matrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bildbereinigung.
- Verwaiste Reasoning-Signaturen (eigenständige Reasoning-Items ohne folgenden Inhaltsblock) für OpenAI-Responses-/Codex-Transkripte entfernen und replay-fähiges OpenAI-Reasoning nach einem Modellroutenwechsel entfernen.
- Replay-fähige Reasoning-Item-Payloads von OpenAI Responses beibehalten, einschließlich verschlüsselter Items mit leerer Zusammenfassung, damit manuelles/WebSocket-Replay den erforderlichen `rs_*`-Zustand mit Assistant-Ausgabe-Items gekoppelt hält.
- Native ChatGPT Codex Responses folgt der Codex-Wire-Parität, indem frühere Responses-Reasoning-/Message-/Function-Payloads ohne frühere Item-IDs replayed werden, während der Sitzungs-`prompt_cache_key` erhalten bleibt.
- Keine Bereinigung von Tool-Call-IDs.
- Die Reparatur der Tool-Result-Zuordnung kann echte passende Outputs verschieben und Codex-artige `aborted`-Outputs für fehlende Tool-Calls synthetisieren.
- Keine Turn-Validierung oder Neuordnung.
- Fehlende Tool-Outputs aus der OpenAI-Responses-Familie werden als `aborted` synthetisiert, um der Codex-Replay-Normalisierung zu entsprechen.
- Kein Entfernen von Gedankensignaturen.

**OpenAI-kompatible Chat Completions**

- Historische Assistant-Thinking-/Reasoning-Blöcke werden vor dem Replay entfernt, damit
  lokale und proxyartige OpenAI-kompatible Server keine Reasoning-Felder früherer Turns
  wie `reasoning` oder `reasoning_content` erhalten.
- Aktuelle Tool-Call-Fortsetzungen im selben Turn behalten den Assistant-Reasoning-Block
  am Tool-Call, bis das Tool-Result replayed wurde.
- Provider-eigene Ausnahmen können sich abmelden, wenn ihr Wire-Protokoll
  replayed Reasoning-Metadaten erfordert.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Bereinigung von Tool-Call-IDs: strikt alphanumerisch.
- Reparatur der Tool-Result-Zuordnung und synthetische Tool-Results.
- Turn-Validierung (Turn-Abwechslung im Gemini-Stil).
- Google-Korrektur der Turn-Reihenfolge (stellt einen kleinen Benutzer-Bootstrap voran, wenn der Verlauf mit Assistant beginnt).
- Antigravity Claude: Thinking-Signaturen normalisieren; unsignierte Thinking-Blöcke entfernen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Tool-Result-Zuordnung und synthetische Tool-Results.
- Turn-Validierung (zusammenführen aufeinanderfolgender Benutzer-Turns, um strikte Abwechslung zu erfüllen).
- Nachgestellte Assistant-Prefill-Turns werden aus ausgehenden Anthropic-Messages-
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
  persistierte Assistant-Turns mit `stopReason: "error"` und leerem Inhalt auch
  auf der Festplatte vor dem Laden repariert.
- Assistant-Stream-Error-Turns, die nur leere Textblöcke enthalten, werden
  aus der In-Memory-Replay-Kopie entfernt, statt einen ungültigen leeren Block zu replayen.
- Claude-Thinking-Blöcke mit fehlenden, leeren oder nur aus Leerraum bestehenden Replay-Signaturen werden
  vor dem Converse-Replay entfernt. Wenn dadurch ein Assistant-Turn leer wird, behält OpenClaw
  die Turn-Form mit nicht leerem Text für ausgelassenes Reasoning bei.
- Ältere reine Thinking-Assistant-Turns, die entfernt werden müssen, werden durch
  nicht leeren Text für ausgelassenes Reasoning ersetzt, damit das Converse-Replay die strikte Turn-Form behält.
- Replay filtert OpenClaw-Delivery-Mirror- und vom Gateway injizierte Assistant-Turns.
- Die Bildbereinigung gilt über die globale Regel.

**Mistral (einschließlich Modell-ID-basierter Erkennung)**

- Bereinigung von Tool-Call-IDs: strict9 (alphanumerisch, Länge 9).

**OpenRouter Gemini**

- Bereinigung von Gedankensignaturen: Nicht-base64-`thought_signature`-Werte entfernen (base64 beibehalten).

**OpenRouter Anthropic**

- Nachgestellte Assistant-Prefill-Turns werden aus verifizierten OpenRouter-
  OpenAI-kompatiblen Anthropic-Modell-Payloads entfernt, wenn Reasoning aktiviert ist, entsprechend
  dem direkten Anthropic- und Cloudflare-Anthropic-Replay-Verhalten.

**Alles andere**

- Nur Bildbereinigung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor dem Release 2026.1.22 wendete OpenClaw mehrere Ebenen der Transkripthygiene an:

- Eine **transcript-sanitize-Erweiterung** lief bei jedem Kontextaufbau und konnte:
  - Tool-Use-/Result-Zuordnung reparieren.
  - Tool-Call-IDs bereinigen (einschließlich eines nicht strikten Modus, der `_`/`-` beibehielt).
- Der Runner führte außerdem Provider-spezifische Bereinigung aus, wodurch Arbeit dupliziert wurde.
- Zusätzliche Mutationen erfolgten außerhalb der Provider-Richtlinie, darunter:
  - Entfernen von `<final>`-Tags aus Assistant-Text vor der Persistierung.
  - Entfernen leerer Assistant-Fehler-Turns.
  - Kürzen von Assistant-Inhalten nach Tool-Calls.

Diese Komplexität verursachte providerübergreifende Regressionen (insbesondere bei der
`openai-responses`-`call_id|fc_id`-Zuordnung). Die Bereinigung in 2026.1.22 entfernte die Erweiterung, zentralisierte
die Logik im Runner und machte OpenAI über die Bildbereinigung hinaus **no-touch**.

## Verwandte Themen

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungskürzung](/de/concepts/session-pruning)
