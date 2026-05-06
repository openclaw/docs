---
read_when:
    - Anpassen des Parsings oder der Standardwerte für thinking-, fast-mode- oder verbose-Direktiven
summary: Direktivensyntax für /think, /fast, /verbose, /trace und Sichtbarkeit der Schlussfolgerungen
title: Denkstufen
x-i18n:
    generated_at: "2026-05-06T07:07:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19fed0d7d8499d177361d125027ca5001dfe73a4ea5bc7f7475faa10541c7a83
    source_path: tools/thinking.md
    workflow: 16
---

## Was es bewirkt

- Inline-Direktive in jedem eingehenden Inhalt: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliase): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (maximales Budget)
  - xhigh → "ultrathink+" (GPT-5.2+ und Codex-Modelle sowie Anthropic Claude Opus 4.7 Effort)
  - adaptive → Provider-verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7 und Google Gemini Dynamic Thinking)
  - max → maximales Reasoning des Providers (Anthropic Claude Opus 4.7; Ollama bildet dies auf seinen höchsten nativen `think`-Effort ab)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden auf `xhigh` abgebildet.
  - `highest` wird auf `high` abgebildet.
- Provider-Hinweise:
  - Denk-Menüs und Auswahllisten werden durch Provider-Profile gesteuert. Provider-Plugins deklarieren die genaue Stufenmenge für das ausgewählte Modell, einschließlich Labels wie binärem `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Provider-/Modellprofile angezeigt, die sie unterstützen. Eingegebene Direktiven für nicht unterstützte Stufen werden mit den gültigen Optionen dieses Modells abgelehnt.
  - Vorhandene gespeicherte nicht unterstützte Stufen werden anhand des Provider-Profilrangs neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die größte unterstützte Nicht-`off`-Stufe für das ausgewählte Modell zurückfallen.
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denkstufe festgelegt ist.
  - Anthropic Claude Opus 4.7 verwendet standardmäßig kein adaptives Denken. Der API-Standard für Effort bleibt Provider-eigene Zuständigkeit, sofern Sie nicht explizit eine Denkstufe festlegen.
  - Anthropic Claude Opus 4.7 bildet `/think xhigh` auf adaptives Denken plus `output_config.effort: "xhigh"` ab, weil `/think` eine Denk-Direktive ist und `xhigh` die Effort-Einstellung von Opus 4.7 ist.
  - Anthropic Claude Opus 4.7 stellt auch `/think max` bereit; es wird auf denselben Provider-eigenen Pfad für maximalen Effort abgebildet.
  - Direkte DeepSeek-V4-Modelle stellen `/think xhigh|max` bereit; beide werden auf DeepSeek `reasoning_effort: "max"` abgebildet, während niedrigere Nicht-`off`-Stufen auf `high` abgebildet werden.
  - Über OpenRouter geroutete DeepSeek-V4-Modelle stellen `/think xhigh` bereit und senden von OpenRouter unterstützte `reasoning_effort`-Werte. Gespeicherte `max`-Overrides fallen auf `xhigh` zurück.
  - Ollama-Modelle mit Denkfähigkeit stellen `/think low|medium|high|max` bereit; `max` wird auf natives `think: "high"` abgebildet, weil Ollamas native API die Effort-Strings `low`, `medium` und `high` akzeptiert.
  - OpenAI-GPT-Modelle bilden `/think` über die modellspezifische Effort-Unterstützung der Responses API ab. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Nutzlast weg, statt einen nicht unterstützten Wert zu senden.
  - Benutzerdefinierte OpenAI-kompatible Katalogeinträge können `/think xhigh` aktivieren, indem sie `models.providers.<provider>.models[].compat.supportedReasoningEfforts` so setzen, dass `"xhigh"` enthalten ist. Dies nutzt dieselben Compat-Metadaten, die ausgehende OpenAI-Reasoning-Effort-Nutzlasten abbilden, sodass Menüs, Sitzungsvalidierung, Agent-CLI und `llm-task` mit dem Transportverhalten übereinstimmen.
  - Veraltete konfigurierte OpenRouter-Hunter-Alpha-Refs überspringen die Proxy-Reasoning-Injektion, weil diese eingestellte Route finalen Antworttext über Reasoning-Felder zurückgeben konnte.
  - Google Gemini bildet `/think adaptive` auf Geminis Provider-eigenes dynamisches Denken ab. Gemini-3-Anfragen lassen ein festes `thinkingLevel` weg, während Gemini-2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin auf das nächste Gemini-`thinkingLevel` oder Budget für diese Modellfamilie abgebildet.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Denken nicht explizit in Modellparametern oder Anfrageparametern festlegen. Dies vermeidet durchgesickerte `reasoning_content`-Deltas aus MiniMax' nicht nativem Anthropic-Stream-Format.
  - Z.AI (`zai/*`) unterstützt nur binäres Denken (`on`/`off`). Jede Nicht-`off`-Stufe wird als `on` behandelt (auf `low` abgebildet).
  - Moonshot (`moonshot/*`) bildet `/think off` auf `thinking: { type: "disabled" }` und jede Nicht-`off`-Stufe auf `thinking: { type: "enabled" }` ab. Wenn Denken aktiviert ist, akzeptiert Moonshot nur `tool_choice` `auto|none`; OpenClaw normalisiert inkompatible Werte auf `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungs-Override (durch Senden einer Nachricht, die nur aus einer Direktive besteht, festgelegt).
3. Standard pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: vom Provider deklarierter Standard, sofern verfügbar; andernfalls werden Reasoning-fähige Modelle auf `medium` oder die nächstliegende unterstützte Nicht-`off`-Stufe für dieses Modell aufgelöst, und Nicht-Reasoning-Modelle bleiben `off`.

## Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** aus der Direktive besteht (Leerraum erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender); gelöscht durch `/think:off` oder Zurücksetzen bei Sitzungsinaktivität.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungszustand bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Denkstufe anzuzeigen.

## Anwendung durch Agent

- **Eingebetteter Pi**: Die aufgelöste Stufe wird an die In-Process-Pi-Agent-Laufzeit übergeben.
- **Claude-CLI-Backend**: Nicht-`off`-Stufen werden bei Verwendung von `claude-cli` als `--effort` an Claude Code übergeben; siehe [CLI-Backends](/de/gateway/cli-backends).

## Schnellmodus (/fast)

- Stufen: `on|off`.
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet einen Sitzungs-Override für den Schnellmodus um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuellen effektiven Schnellmodus-Zustand anzuzeigen.
- OpenClaw löst den Schnellmodus in dieser Reihenfolge auf:
  1. Inline- oder Direktiven-only-`/fast on|off`
  2. Sitzungs-Override
  3. Standard pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der Schnellmodus auf OpenAI Priority Processing abgebildet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Schnellmodus dasselbe `service_tier=priority`-Flag bei Codex Responses. OpenClaw hält einen gemeinsamen `/fast`-Schalter über beide Auth-Pfade hinweg.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich OAuth-authentifiziertem Traffic an `api.anthropic.com`, wird der Schnellmodus auf Anthropic-Service-Tiers abgebildet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-`serviceTier`- / `service_tier`-Modellparameter überschreiben den Schnellmodus-Standard, wenn beide gesetzt sind. OpenClaw überspringt weiterhin die Anthropic-Service-Tier-Injektion für Nicht-Anthropic-Proxy-Basis-URLs.
- `/status` zeigt `Fast` nur an, wenn der Schnellmodus aktiviert ist.

## Ausführliche Direktiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet die ausführliche Sitzungsausgabe um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Zustand zu ändern.
- `/verbose off` speichert einen expliziten Sitzungs-Override; löschen Sie ihn über die Sessions-UI, indem Sie `inherit` wählen.
- Inline-Direktiven wirken sich nur auf diese Nachricht aus; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Ausführlichkeitsstufe anzuzeigen.
- Wenn ausführliche Ausgabe aktiviert ist, senden Agents, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agents), jeden Tool-Aufruf als eigene reine Metadaten-Nachricht zurück, sofern verfügbar mit `<emoji> <tool-name>: <arg>` vorangestellt. Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Sprechblasen), nicht als Streaming-Deltas.
- Zusammenfassungen von Tool-Fehlern bleiben im normalen Modus sichtbar, aber Rohdetailsuffixe von Fehlern werden ausgeblendet, sofern die Ausführlichkeit nicht `on` oder `full` ist.
- Wenn die Ausführlichkeit `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Sprechblase, auf eine sichere Länge gekürzt). Wenn Sie `/verbose on|full|off` umschalten, während ein Lauf aktiv ist, berücksichtigen nachfolgende Tool-Sprechblasen die neue Einstellung.
- `agents.defaults.toolProgressDetail` steuert die Form von `/verbose`-Tool-Zusammenfassungen und Tool-Zeilen in Fortschrittsentwürfen. Verwenden Sie `"explain"` (Standard) für kompakte menschenlesbare Labels wie `🛠️ Exec: checking JS syntax`; verwenden Sie `"raw"`, wenn Sie zusätzlich den rohen Befehl bzw. das rohe Detail zum Debuggen anhängen möchten. Pro-Agent-`agents.list[].toolProgressDetail` überschreibt den Standard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet die Plugin-Trace-Ausgabe für die Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Inline-Direktiven wirken sich nur auf diese Nachricht aus; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es legt nur Plugin-eigene Trace-/Debug-Zeilen offen, etwa Active-Memory-Debug-Zusammenfassungen.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnosemeldung nach der normalen Assistentenantwort erscheinen.

## Reasoning-Sichtbarkeit (/reasoning)

- Stufen: `on|off|stream`.
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet um, ob Denkblöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit dem Präfix `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfsblase, während die Antwort generiert wird, und sendet anschließend die finale Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungs-Override, dann Standard pro Agent (`agents.list[].reasoningDefault`), dann Fallback (`off`).

Fehlerhafte Reasoning-Tags lokaler Modelle werden konservativ behandelt. Geschlossene `<think>...</think>`-Blöcke bleiben bei normalen Antworten verborgen, und nicht geschlossene Reasoning-Inhalte nach bereits sichtbarem Text werden ebenfalls verborgen. Wenn eine Antwort vollständig in ein einzelnes nicht geschlossenes öffnendes Tag eingeschlossen ist und andernfalls als leerer Text ausgeliefert würde, entfernt OpenClaw das fehlerhafte öffnende Tag und liefert den verbleibenden Text aus.

## Verwandt

- Dokumentation zum erhöhten Modus finden Sie unter [Erhöhter Modus](/de/tools/elevated).

## Heartbeats

- Der Heartbeat-Prüfkörper ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie jedoch, Sitzungsstandards über Heartbeats zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die finale Nutzlast. Um zusätzlich die separate `Reasoning:`-Nachricht zu senden (wenn verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Webchat-UI

- Der Denkstufen-Selektor im Webchat spiegelt beim Laden der Seite die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration wider.
- Die Auswahl einer anderen Stufe schreibt den Sitzungs-Override sofort über `sessions.patch`; sie wartet nicht auf das nächste Senden und ist kein einmaliger `thinkingOnce`-Override.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standard aus dem Provider-Denkprofil des aktiven Sitzungsmodells plus derselben Fallback-Logik stammt, die `/status` und `session_status` verwenden.
- Der Selektor verwendet `thinkingLevels`, die von der Gateway-Sitzungszeile bzw. den Standards zurückgegeben werden, wobei `thinkingOptions` als Legacy-Label-Liste beibehalten wird. Die Browser-UI hält keine eigene Provider-Regex-Liste vor; Plugins besitzen modellspezifische Stufenmengen.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und Selektor synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standardwert des Modells zu definieren.
- Provider-Plugins, die Claude-Modelle proxyn, sollten `resolveClaudeThinkingProfile(modelId)` aus `openclaw/plugin-sdk/provider-model-shared` wiederverwenden, damit direkte Anthropic- und Proxy-Kataloge abgestimmt bleiben.
- Jede Profilstufe hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann ein Anzeige-`label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Tool-Plugins, die eine explizite Thinking-Überschreibung validieren müssen, sollten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` verwenden; sie sollten keine eigenen Provider-/Modell-Stufenlisten pflegen.
- Tool-Plugins mit Zugriff auf konfigurierte benutzerdefinierte Modellmetadaten können `catalog` an `resolveThinkingPolicy` übergeben, damit `compat.supportedReasoningEfforts`-Opt-ins in der Plugin-seitigen Validierung berücksichtigt werden.
- Veröffentlichte Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter erhalten, neue benutzerdefinierte Stufensätze sollten jedoch `resolveThinkingProfile` verwenden.
- Gateway-Zeilen/-Standardwerte stellen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` bereit, damit ACP-/Chat-Clients dieselben Profil-IDs und Labels rendern, die auch die Laufzeitvalidierung verwendet.
