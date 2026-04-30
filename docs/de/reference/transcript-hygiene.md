---
read_when:
    - Sie debuggen Provider-Anfrageablehnungen, die mit der Transkriptstruktur zusammenhängen
    - Sie ändern die Transkriptbereinigung oder die Reparaturlogik für Tool-Aufrufe
    - Sie untersuchen Nichtübereinstimmungen bei Tool-Call-IDs über Provider hinweg
summary: 'Referenz: Provider-spezifische Regeln zur Transkriptbereinigung und -reparatur'
title: Transkript-Hygiene
x-i18n:
    generated_at: "2026-04-30T07:14:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d95f065d87ce58019ff2e6cdd6801879404d3b4fa402d26fc6fed9d51966b0a1
    source_path: reference/transcript-hygiene.md
    workflow: 16
---

OpenClaw wendet vor einem Lauf (beim Erstellen des Modellkontexts) **Provider-spezifische Korrekturen** auf Transkripte an. Die meisten davon sind **In-Memory**-Anpassungen, die strenge Provider-Anforderungen erfüllen. Ein separater Reparaturdurchlauf für Sitzungsdateien kann außerdem gespeicherte JSONL-Daten umschreiben, bevor die Sitzung geladen wird, entweder indem fehlerhafte JSONL-Zeilen entfernt oder persistierte Turns repariert werden, die syntaktisch gültig sind, aber bekanntermaßen von einem
Provider während der Wiedergabe abgelehnt werden. Wenn eine Reparatur erfolgt, wird die Originaldatei neben
der Sitzungsdatei gesichert.

Der Umfang umfasst:

- Reiner Laufzeit-Prompt-Kontext bleibt außerhalb benutzerseitig sichtbarer Transkript-Turns
- Bereinigung von Tool-Call-IDs
- Validierung von Tool-Call-Eingaben
- Reparatur der Zuordnung von Tool-Ergebnissen
- Turn-Validierung / -Reihenfolge
- Bereinigung von Thought-Signaturen
- Bereinigung von Thinking-Signaturen
- Bereinigung von Bild-Payloads
- Bereinigung leerer Textblöcke vor der Provider-Wiedergabe
- Provenienzkennzeichnung von Benutzereingaben (für zwischen Sitzungen weitergeleitete Prompts)
- Reparatur leerer Assistant-Fehler-Turns für Bedrock-Converse-Wiedergabe

Wenn Sie Details zur Transkriptspeicherung benötigen, siehe:

- [Detaillierte Erläuterung der Sitzungsverwaltung](/de/reference/session-management-compaction)

---

## Globale Regel: Laufzeitkontext ist kein Benutzertranskript

Laufzeit-/Systemkontext kann dem Modell-Prompt für einen Turn hinzugefügt werden, ist aber
kein vom Endbenutzer verfasster Inhalt. OpenClaw hält einen separaten transkriptbezogenen
Prompt-Text für Gateway-Antworten, eingereihte Folgeanfragen, ACP, CLI und eingebettete Pi-
Läufe vor. Gespeicherte sichtbare Benutzer-Turns verwenden diesen Transkripttext anstelle des
mit Laufzeitkontext angereicherten Prompts.

Für Legacy-Sitzungen, die bereits Laufzeit-Wrapper persistiert haben, wenden Gateway-Verlaufsoberflächen
eine Anzeigeprojektion an, bevor Nachrichten an WebChat,
TUI-, REST- oder SSE-Clients zurückgegeben werden.

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

Bild-Payloads werden immer bereinigt, um Provider-seitige Ablehnungen aufgrund von Größenbeschränkungen
zu verhindern (Herunterskalieren/Neukomprimieren übergroßer base64-Bilder).

Dies hilft außerdem dabei, bildbedingten Token-Druck für vision-fähige Modelle zu steuern.
Niedrigere Maximalabmessungen reduzieren im Allgemeinen die Token-Nutzung; höhere Abmessungen erhalten Details.

Implementierung:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildseite ist über `agents.defaults.imageMaxDimensionPx` konfigurierbar (Standard: `1200`).
- Leere Textblöcke werden entfernt, während dieser Durchlauf Wiedergabeinhalte durchläuft. Assistant-
  Turns, die dadurch leer werden, werden aus der Wiedergabekopie entfernt; Benutzer- und Tool-Ergebnis-
  Turns, die dadurch leer werden, erhalten einen nicht leeren Platzhalter für ausgelassene Inhalte.

---

## Globale Regel: fehlerhafte Tool Calls

Assistant-Tool-Call-Blöcke, denen sowohl `input` als auch `arguments` fehlen, werden entfernt,
bevor der Modellkontext erstellt wird. Dies verhindert Provider-Ablehnungen durch teilweise
persistierte Tool Calls (zum Beispiel nach einem Rate-Limit-Fehler).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale Regel: Provenienz von sitzungsübergreifenden Eingaben

Wenn ein Agent über `sessions_send` einen Prompt in eine andere Sitzung sendet (einschließlich
Agent-zu-Agent-Antwort-/Ankündigungsschritten), persistiert OpenClaw den erstellten Benutzer-Turn mit:

- `message.provenance.kind = "inter_session"`

OpenClaw stellt außerdem demselben Turn eine Markierung `[Inter-session message ... isUser=false]`
vor den weitergeleiteten Prompt-Text, damit der aktive Modellaufruf fremde Sitzungsausgabe von
externen Endbenutzeranweisungen unterscheiden kann. Diese Markierung enthält, sofern verfügbar,
die Quellsitzung, den Kanal und das Tool. Das Transkript verwendet aus Provider-Kompatibilitätsgründen weiterhin
`role: "user"`, aber sowohl der sichtbare Text als auch die Provenienzmetadaten kennzeichnen den Turn
als sitzungsübergreifende Daten.

Beim Neuaufbau des Kontexts wendet OpenClaw dieselbe Markierung auf ältere persistierte
sitzungsübergreifende Benutzer-Turns an, die nur Provenienzmetadaten haben.

---

## Provider-Matrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bildbereinigung.
- Verwaiste Reasoning-Signaturen (eigenständige Reasoning-Elemente ohne folgenden Inhaltsblock) für OpenAI-Responses-/Codex-Transkripte entfernen und wiedergabefähiges OpenAI-Reasoning nach einem Modellroutenwechsel entfernen.
- Wiedergabefähige Payloads von OpenAI-Responses-Reasoning-Elementen beibehalten, einschließlich verschlüsselter Elemente mit leerer Zusammenfassung, damit manuelle/WebSocket-Wiedergabe den erforderlichen `rs_*`-Zustand mit Assistant-Ausgabeelementen gekoppelt hält.
- Keine Bereinigung von Tool-Call-IDs.
- Die Reparatur der Tool-Ergebnis-Zuordnung kann echte passende Ausgaben verschieben und Codex-artige `aborted`-Ausgaben für fehlende Tool Calls synthetisieren.
- Keine Turn-Validierung oder Neuordnung.
- Fehlende Tool-Ausgaben der OpenAI-Responses-Familie werden als `aborted` synthetisiert, um der Codex-Wiedergabenormalisierung zu entsprechen.
- Kein Entfernen von Thought-Signaturen.

**OpenAI-kompatibles Gemma 4**

- Historische Assistant-Thinking-/Reasoning-Blöcke werden vor der Wiedergabe entfernt, damit lokale
  OpenAI-kompatible Gemma-4-Server keine Reasoning-Inhalte aus früheren Turns erhalten.
- Aktuelle Tool-Call-Fortsetzungen im selben Turn behalten den Assistant-Reasoning-Block
  am Tool Call, bis das Tool-Ergebnis wiedergegeben wurde.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Bereinigung von Tool-Call-IDs: streng alphanumerisch.
- Reparatur der Tool-Ergebnis-Zuordnung und synthetische Tool-Ergebnisse.
- Turn-Validierung (Gemini-artige Turn-Alternierung).
- Google-Turn-Reihenfolgekorrektur (einen kleinen Benutzer-Bootstrap voranstellen, wenn der Verlauf mit Assistant beginnt).
- Antigravity Claude: Thinking-Signaturen normalisieren; unsignierte Thinking-Blöcke entfernen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Tool-Ergebnis-Zuordnung und synthetische Tool-Ergebnisse.
- Turn-Validierung (aufeinanderfolgende Benutzer-Turns zusammenführen, um strenge Alternierung zu erfüllen).
- Nachgestellte Assistant-Prefill-Turns werden aus ausgehenden Anthropic-Messages-
  Payloads entfernt, wenn Thinking aktiviert ist, einschließlich Cloudflare-AI-Gateway-Routen.
- Thinking-Blöcke mit fehlenden, leeren oder nur aus Leerraum bestehenden Wiedergabesignaturen werden
  vor der Provider-Konvertierung entfernt. Wenn dadurch ein Assistant-Turn leer wird, behält OpenClaw
  die Turn-Form mit nicht leerem Text für ausgelassenes Reasoning bei.
- Ältere reine Thinking-Assistant-Turns, die entfernt werden müssen, werden durch
  nicht leeren Text für ausgelassenes Reasoning ersetzt, damit Provider-Adapter den Wiedergabe-
  Turn nicht verwerfen.

**Amazon Bedrock (Converse API)**

- Leere Assistant-Stream-Fehler-Turns werden vor der Wiedergabe zu einem nicht leeren Fallback-Textblock
  repariert. Bedrock Converse lehnt Assistant-Nachrichten mit `content: []` ab, daher werden
  persistierte Assistant-Turns mit `stopReason: "error"` und leerem Inhalt außerdem
  vor dem Laden auf der Festplatte repariert.
- Assistant-Stream-Fehler-Turns, die nur leere Textblöcke enthalten, werden
  aus der In-Memory-Wiedergabekopie entfernt, anstatt einen ungültigen leeren Block wiederzugeben.
- Claude-Thinking-Blöcke mit fehlenden, leeren oder nur aus Leerraum bestehenden Wiedergabesignaturen werden
  vor der Converse-Wiedergabe entfernt. Wenn dadurch ein Assistant-Turn leer wird, behält OpenClaw
  die Turn-Form mit nicht leerem Text für ausgelassenes Reasoning bei.
- Ältere reine Thinking-Assistant-Turns, die entfernt werden müssen, werden durch
  nicht leeren Text für ausgelassenes Reasoning ersetzt, damit die Converse-Wiedergabe die strenge Turn-Form beibehält.
- Die Wiedergabe filtert OpenClaw-Delivery-Mirror- und Gateway-injizierte Assistant-Turns.
- Bildbereinigung gilt gemäß der globalen Regel.

**Mistral (einschließlich modell-ID-basierter Erkennung)**

- Bereinigung von Tool-Call-IDs: strict9 (alphanumerisch, Länge 9).

**OpenRouter Gemini**

- Bereinigung von Thought-Signaturen: nicht-base64-`thought_signature`-Werte entfernen (base64 beibehalten).

**Alles andere**

- Nur Bildbereinigung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor dem Release 2026.1.22 wendete OpenClaw mehrere Ebenen der Transkripthygiene an:

- Eine **transcript-sanitize extension** lief bei jedem Kontextaufbau und konnte:
  - Tool-Use-/Ergebnis-Zuordnung reparieren.
  - Tool-Call-IDs bereinigen (einschließlich eines nicht strengen Modus, der `_`/`-` beibehielt).
- Der Runner führte außerdem Provider-spezifische Bereinigung durch, was Arbeit duplizierte.
- Zusätzliche Mutationen erfolgten außerhalb der Provider-Richtlinie, einschließlich:
  - Entfernen von `<final>`-Tags aus Assistant-Text vor der Persistierung.
  - Entfernen leerer Assistant-Fehler-Turns.
  - Kürzen von Assistant-Inhalten nach Tool Calls.

Diese Komplexität verursachte providerübergreifende Regressionen (insbesondere bei der
`call_id|fc_id`-Zuordnung von `openai-responses`). Die Bereinigung in 2026.1.22 entfernte die extension, zentralisierte
die Logik im Runner und machte OpenAI über die Bildbereinigung hinaus **unangetastet**.

## Verwandt

- [Sitzungsverwaltung](/de/concepts/session)
- [Sitzungsbeschneidung](/de/concepts/session-pruning)
