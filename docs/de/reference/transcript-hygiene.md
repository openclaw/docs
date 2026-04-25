---
read_when:
    - Sie debuggen Provider-Anfrageablehnungen, die mit der Form des Transkripts zusammenhängen
    - Sie ändern die Transkript-Bereinigung oder die Tool-Call-Reparaturlogik
    - Sie untersuchen Tool-Call-ID-Mismatches bei verschiedenen Providern
summary: 'Referenz: providerspezifische Regeln für Transkript-Bereinigung und -Reparatur'
title: Transkript-Hygiene
x-i18n:
    generated_at: "2026-04-25T18:22:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 880a72d4f73e195ff93f26537d3c80c88dc454691765d3d44032ff43076a07c3
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Dieses Dokument beschreibt **providerspezifische Korrekturen**, die vor einem Lauf auf Transkripte angewendet werden
(Erstellung des Modellkontexts). Die meisten davon sind **In-Memory**-Anpassungen, die verwendet werden, um
strenge Provider-Anforderungen zu erfüllen. Ein separater Reparaturdurchlauf für Sitzungsdateien kann auch gespeicherte
JSONL-Dateien umschreiben, bevor die Sitzung geladen wird, entweder durch Entfernen fehlerhafter JSONL-Zeilen oder
durch Reparatur persistierter Turns, die syntaktisch gültig sind, aber bekanntermaßen von einem
Provider beim Replay abgelehnt werden. Wenn eine Reparatur erfolgt, wird die Originaldatei neben der Sitzungsdatei gesichert.

Der Umfang umfasst:

- Nur zur Laufzeit vorhandenen Prompt-Kontext, der nicht in benutzersichtbaren Transkript-Turns erscheint
- Bereinigung von Tool-Call-IDs
- Validierung von Tool-Call-Eingaben
- Reparatur der Paarung von Tool-Ergebnissen
- Turn-Validierung / -Reihenfolge
- Bereinigung von Thought-Signaturen
- Bereinigung von Bild-Payloads
- Kennzeichnung der Herkunft von Benutzereingaben (für sitzungsübergreifend weitergeleitete Prompts)
- Reparatur leerer Assistant-Fehler-Turns für Bedrock-Converse-Replay

Wenn Sie Details zur Transkriptspeicherung benötigen, siehe:

- [Tiefgehender Einblick in das Sitzungsmanagement](/de/reference/session-management-compaction)

---

## Globale Regel: Laufzeitkontext ist kein Benutzertranskript

Laufzeit-/Systemkontext kann für einen Turn dem Modell-Prompt hinzugefügt werden, ist aber
kein vom Endbenutzer verfasster Inhalt. OpenClaw hält einen separaten, transkriptseitigen
Prompt-Body für Gateway-Antworten, eingereihte Folgeaktionen, ACP, CLI und eingebettete Pi-
Läufe vor. Gespeicherte sichtbare Benutzer-Turns verwenden diesen Transkript-Body anstelle des
mit Laufzeitkontext angereicherten Prompts.

Für ältere Sitzungen, die bereits Laufzeit-Wrapper gespeichert haben,
wenden Gateway-Verlaufsoberflächen vor der Rückgabe von Nachrichten an WebChat,
TUI, REST- oder SSE-Clients eine Anzeigeprojektion an.

---

## Wo dies ausgeführt wird

Die gesamte Transkript-Hygiene ist im eingebetteten Runner zentralisiert:

- Richtlinienauswahl: `src/agents/transcript-policy.ts`
- Anwendung von Bereinigung/Reparatur: `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

Die Richtlinie verwendet `provider`, `modelApi` und `modelId`, um zu entscheiden, was angewendet wird.

Getrennt von der Transkript-Hygiene werden Sitzungsdateien (falls nötig) vor dem Laden repariert:

- `repairSessionFileIfNeeded` in `src/agents/session-file-repair.ts`
- Aufgerufen aus `run/attempt.ts` und `compact.ts` (eingebetteter Runner)

---

## Globale Regel: Bild-Bereinigung

Bild-Payloads werden immer bereinigt, um providerseitige Ablehnungen aufgrund von Größenlimits zu verhindern
(Herunterskalieren/Neu-Komprimieren übergroßer Base64-Bilder).

Dies hilft auch, den bildgetriebenen Tokendruck für visionfähige Modelle zu kontrollieren.
Kleinere Maximalabmessungen reduzieren im Allgemeinen die Tokennutzung; größere Abmessungen erhalten Details.

Implementierung:

- `sanitizeSessionMessagesImages` in `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` in `src/agents/tool-images.ts`
- Die maximale Bildseite ist über `agents.defaults.imageMaxDimensionPx` konfigurierbar (Standard: `1200`).

---

## Globale Regel: fehlerhafte Tool-Calls

Assistant-Tool-Call-Blöcke, denen sowohl `input` als auch `arguments` fehlen, werden entfernt,
bevor der Modellkontext aufgebaut wird. Dies verhindert Provider-Ablehnungen durch teilweise
persistierte Tool-Calls (zum Beispiel nach einem Ausfall wegen Ratenbegrenzung).

Implementierung:

- `sanitizeToolCallInputs` in `src/agents/session-transcript-repair.ts`
- Angewendet in `sanitizeSessionHistory` in `src/agents/pi-embedded-runner/replay-history.ts`

---

## Globale Regel: Herkunft sitzungsübergreifender Eingaben

Wenn ein Agent über `sessions_send` einen Prompt in eine andere Sitzung sendet (einschließlich
Schritten agent-zu-agent-Antwort/Ankündigung), speichert OpenClaw den erstellten Benutzer-Turn mit:

- `message.provenance.kind = "inter_session"`

Diese Metadaten werden beim Anhängen an das Transkript geschrieben und ändern die Rolle
nicht (`role: "user"` bleibt aus Kompatibilitätsgründen mit Providern bestehen). Transkript-Leser können
dies verwenden, um weitergeleitete interne Prompts nicht als vom Endbenutzer verfasste Anweisungen zu behandeln.

Beim Neuaufbau des Kontexts stellt OpenClaw diesen Benutzer-Turns außerdem In-Memory einen kurzen Marker
`[Inter-session message]` voran, damit das Modell sie von externen Endbenutzer-Anweisungen unterscheiden kann.

---

## Provider-Matrix (aktuelles Verhalten)

**OpenAI / OpenAI Codex**

- Nur Bild-Bereinigung.
- Verwaiste Reasoning-Signaturen entfernen (eigenständige Reasoning-Elemente ohne folgenden Inhaltsblock) für OpenAI-Responses-/Codex-Transkripte, und replayfähiges OpenAI-Reasoning nach einem Modellroutenwechsel entfernen.
- Keine Bereinigung von Tool-Call-IDs.
- Die Reparatur der Paarung von Tool-Ergebnissen kann echte passende Ausgaben verschieben und Codex-artige `aborted`-Ausgaben für fehlende Tool-Calls synthetisieren.
- Keine Turn-Validierung oder Neuordnung.
- Fehlende Tool-Ausgaben der OpenAI-Responses-Familie werden als `aborted` synthetisiert, damit sie der Codex-Replay-Normalisierung entsprechen.
- Kein Entfernen von Thought-Signaturen.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Bereinigung von Tool-Call-IDs: strikt alphanumerisch.
- Reparatur der Paarung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Turn-Validierung (Gemini-artige Turn-Alternierung).
- Korrektur der Google-Turn-Reihenfolge (stellt einen winzigen Benutzer-Bootstrap voran, wenn der Verlauf mit dem Assistant beginnt).
- Antigravity Claude: Thinking-Signaturen normalisieren; unsignierte Thinking-Blöcke entfernen.

**Anthropic / Minimax (Anthropic-kompatibel)**

- Reparatur der Paarung von Tool-Ergebnissen und synthetische Tool-Ergebnisse.
- Turn-Validierung (aufeinanderfolgende Benutzer-Turns zusammenführen, um strenge Alternierung zu erfüllen).

**Amazon Bedrock (Converse API)**

- Leere Assistant-Stream-Error-Turns werden vor dem Replay zu einem nicht leeren Fallback-Textblock repariert. Bedrock Converse lehnt Assistant-Nachrichten mit `content: []` ab, daher
  werden persistierte Assistant-Turns mit `stopReason: "error"` und leerem Inhalt auch auf der Festplatte vor dem Laden repariert.
- Replay filtert OpenClaw-Delivery-Mirror- und vom Gateway injizierte Assistant-Turns.
- Bild-Bereinigung wird über die globale Regel angewendet.

**Mistral (einschließlich modell-ID-basierter Erkennung)**

- Bereinigung von Tool-Call-IDs: strict9 (alphanumerisch, Länge 9).

**OpenRouter Gemini**

- Bereinigung von Thought-Signaturen: nicht-Base64-`thought_signature`-Werte entfernen (Base64 beibehalten).

**Alles andere**

- Nur Bild-Bereinigung.

---

## Historisches Verhalten (vor 2026.1.22)

Vor dem Release 2026.1.22 wandte OpenClaw mehrere Ebenen von Transkript-Hygiene an:

- Eine Erweiterung **transcript-sanitize** lief bei jeder Kontexterstellung und konnte:
  - die Paarung von Tool-Nutzung/-Ergebnis reparieren.
  - Tool-Call-IDs bereinigen (einschließlich eines nicht strikten Modus, der `_`/`-` beibehielt).
- Der Runner führte außerdem providerspezifische Bereinigung durch, was Arbeit doppelte.
- Zusätzliche Mutationen traten außerhalb der Provider-Richtlinie auf, darunter:
  - Entfernen von `<final>`-Tags aus Assistant-Text vor der Persistierung.
  - Entfernen leerer Assistant-Fehler-Turns.
  - Kürzen von Assistant-Inhalt nach Tool-Calls.

Diese Komplexität verursachte providerübergreifende Regressionen (insbesondere bei `openai-responses`
`call_id|fc_id`-Paarung). Die Bereinigung in 2026.1.22 entfernte die Erweiterung, zentralisierte
die Logik im Runner und machte OpenAI **no-touch** außer der Bild-Bereinigung.

## Verwandt

- [Sitzungsmanagement](/de/concepts/session)
- [Sitzungsbereinigung](/de/concepts/session-pruning)
