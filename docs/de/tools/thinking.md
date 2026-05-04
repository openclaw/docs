---
read_when:
    - Anpassen des Parsings oder der Standardwerte für thinking-, fast-mode- oder verbose-Direktiven
summary: Direktivensyntax für /think, /fast, /verbose, /trace und Sichtbarkeit des Denkprozesses
title: Denkstufen
x-i18n:
    generated_at: "2026-05-04T02:26:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fa1b0a2b5f7b93a706488c3ad39dfe08c08eed0bdd30880eb4c07d730ee4d4f
    source_path: tools/thinking.md
    workflow: 16
---

## Was es tut

- Inline-Direktive in einem beliebigen eingehenden Text: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliase): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „denken“
  - low → „intensiv denken“
  - medium → „intensiver denken“
  - high → „ultradenken“ (maximales Budget)
  - xhigh → „ultradenken+“ (GPT-5.2+ und Codex-Modelle sowie Anthropic Claude Opus 4.7 effort)
  - adaptive → vom Provider verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7 und Google Gemini dynamic thinking)
  - max → maximales Reasoning des Providers (Anthropic Claude Opus 4.7; Ollama ordnet dies seinem höchsten nativen `think`-Aufwand zu)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden `xhigh` zugeordnet.
  - `highest` wird `high` zugeordnet.
- Provider-Hinweise:
  - Thinking-Menüs und Auswahlfelder werden durch das Provider-Profil gesteuert. Provider-Plugins deklarieren die exakte Stufenmenge für das ausgewählte Modell, einschließlich Labels wie binärem `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Provider-/Modellprofile angeboten, die sie unterstützen. Eingegebene Direktiven für nicht unterstützte Stufen werden mit den gültigen Optionen dieses Modells abgelehnt.
  - Vorhandene gespeicherte nicht unterstützte Stufen werden anhand des Provider-Profilrangs neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die größte unterstützte Nicht-`off`-Stufe für das ausgewählte Modell zurückfallen.
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Thinking-Stufe festgelegt ist.
  - Anthropic Claude Opus 4.7 verwendet nicht standardmäßig adaptives Denken. Der API-effort-Standard bleibt Provider-eigen, sofern Sie nicht explizit eine Thinking-Stufe festlegen.
  - Anthropic Claude Opus 4.7 ordnet `/think xhigh` adaptivem Denken plus `output_config.effort: "xhigh"` zu, weil `/think` eine Thinking-Direktive ist und `xhigh` die Opus-4.7-effort-Einstellung ist.
  - Anthropic Claude Opus 4.7 stellt außerdem `/think max` bereit; es wird demselben Provider-eigenen Pfad für maximalen effort zugeordnet.
  - DeepSeek-V4-Modelle stellen `/think xhigh|max` bereit; beide werden DeepSeek `reasoning_effort: "max"` zugeordnet, während niedrigere Nicht-`off`-Stufen `high` zugeordnet werden.
  - Ollama-Modelle mit Thinking-Unterstützung stellen `/think low|medium|high|max` bereit; `max` wird dem nativen `think: "high"` zugeordnet, weil Ollamas native API die effort-Zeichenfolgen `low`, `medium` und `high` akzeptiert.
  - OpenAI-GPT-Modelle ordnen `/think` über die modellspezifische Unterstützung für Responses-API-effort zu. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Nutzlast weg, statt einen nicht unterstützten Wert zu senden.
  - Benutzerdefinierte OpenAI-kompatible Katalogeinträge können `/think xhigh` aktivieren, indem sie `models.providers.<provider>.models[].compat.supportedReasoningEfforts` so setzen, dass `"xhigh"` enthalten ist. Dies nutzt dieselben Kompatibilitätsmetadaten, die ausgehende OpenAI-Reasoning-effort-Nutzlasten zuordnen, sodass Menüs, Sitzungsvalidierung, Agent-CLI und `llm-task` mit dem Transportverhalten übereinstimmen.
  - Veraltete konfigurierte OpenRouter-Hunter-Alpha-Refs überspringen Proxy-Reasoning-Injektion, weil diese eingestellte Route endgültigen Antworttext über Reasoning-Felder zurückgeben konnte.
  - Google Gemini ordnet `/think adaptive` Geminis Provider-eigenem dynamischem Denken zu. Gemini-3-Anfragen lassen ein festes `thinkingLevel` weg, während Gemini-2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin dem nächstliegenden Gemini-`thinkingLevel` oder Budget für diese Modellfamilie zugeordnet.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Thinking nicht explizit in Modellparametern oder Anfrageparametern festlegen. Dies vermeidet durchgesickerte `reasoning_content`-Deltas aus MiniMax’ nicht nativem Anthropic-Stream-Format.
  - Z.AI (`zai/*`) unterstützt nur binäres Thinking (`on`/`off`). Jede Nicht-`off`-Stufe wird als `on` behandelt (`low` zugeordnet).
  - Moonshot (`moonshot/*`) ordnet `/think off` `thinking: { type: "disabled" }` zu und jede Nicht-`off`-Stufe `thinking: { type: "enabled" }`. Wenn Thinking aktiviert ist, akzeptiert Moonshot nur `tool_choice` `auto|none`; OpenClaw normalisiert inkompatible Werte zu `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (durch Senden einer Nur-Direktive-Nachricht festgelegt).
3. Agent-spezifischer Standard (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: vom Provider deklarierter Standard, sofern verfügbar; andernfalls werden Reasoning-fähige Modelle zu `medium` oder zur nächstliegenden unterstützten Nicht-`off`-Stufe für dieses Modell aufgelöst, und Nicht-Reasoning-Modelle bleiben `off`.

## Einen Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** die Direktive enthält (Leerraum zulässig), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung erhalten (standardmäßig pro Absender); gelöscht durch `/think:off` oder Zurücksetzen nach Sitzungsleerlauf.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungszustand bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Thinking-Stufe anzuzeigen.

## Anwendung nach Agent

- **Eingebetteter Pi**: Die aufgelöste Stufe wird an die prozessinterne Pi-Agent-Laufzeit übergeben.

## Schnellmodus (/fast)

- Stufen: `on|off`.
- Eine Nur-Direktive-Nachricht schaltet eine Schnellmodus-Sitzungsüberschreibung um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuell wirksamen Schnellmoduszustand anzuzeigen.
- OpenClaw löst den Schnellmodus in dieser Reihenfolge auf:
  1. Inline-/Nur-Direktive `/fast on|off`
  2. Sitzungsüberschreibung
  3. Agent-spezifischer Standard (`agents.list[].fastModeDefault`)
  4. Modellbezogene Konfiguration: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der Schnellmodus auf OpenAI priority processing abgebildet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Schnellmodus dasselbe `service_tier=priority`-Flag bei Codex Responses. OpenClaw verwendet einen gemeinsamen `/fast`-Schalter für beide Authentifizierungspfade.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich OAuth-authentifiziertem Datenverkehr an `api.anthropic.com`, wird der Schnellmodus auf Anthropic-Service-Tiers abgebildet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Schnellmodusstandard, wenn beide gesetzt sind. OpenClaw überspringt Anthropic-Service-Tier-Injektion weiterhin für Nicht-Anthropic-Proxy-Basis-URLs.
- `/status` zeigt `Fast` nur an, wenn der Schnellmodus aktiviert ist.

## Ausführliche Direktiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Nur-Direktive-Nachricht schaltet ausführliche Sitzungsprotokollierung um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Zustand zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie über die Sitzungsoberfläche, indem Sie `inherit` auswählen.
- Eine Inline-Direktive betrifft nur diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Ausführlichkeitsstufe anzuzeigen.
- Wenn ausführliche Ausgabe aktiviert ist, senden Agents, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agents), jeden Tool-Aufruf als eigene reine Metadaten-Nachricht zurück, sofern verfügbar mit `<emoji> <tool-name>: <arg>` vorangestellt. Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Sprechblasen), nicht als Streaming-Deltas.
- Zusammenfassungen von Tool-Fehlern bleiben im normalen Modus sichtbar, aber Rohfehlerdetail-Suffixe werden ausgeblendet, sofern verbose nicht `on` oder `full` ist.
- Wenn verbose `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Sprechblase, auf eine sichere Länge gekürzt). Wenn Sie `/verbose on|full|off` umschalten, während ein Lauf aktiv ist, berücksichtigen nachfolgende Tool-Sprechblasen die neue Einstellung.
- `agents.defaults.toolProgressDetail` steuert die Form der `/verbose`-Tool-Zusammenfassungen und der Tool-Zeilen in Fortschrittsentwürfen. Verwenden Sie `"explain"` (Standard) für kompakte menschenlesbare Labels wie `🛠️ Exec: checking JS syntax`; verwenden Sie `"raw"`, wenn Sie auch den Rohbefehl bzw. das Rohdetail zum Debugging angehängt haben möchten. Agent-spezifisches `agents.list[].toolProgressDetail` überschreibt den Standard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine Nur-Direktive-Nachricht schaltet die Plugin-Trace-Ausgabe für die Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive betrifft nur diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es legt nur Plugin-eigene Trace-/Debug-Zeilen offen, etwa Active-Memory-Debug-Zusammenfassungen.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnosenachricht nach der normalen Assistant-Antwort erscheinen.

## Reasoning-Sichtbarkeit (/reasoning)

- Stufen: `on|off|stream`.
- Eine Nur-Direktive-Nachricht schaltet um, ob Thinking-Blöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit dem Präfix `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfsblase, während die Antwort generiert wird, und sendet danach die endgültige Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungsüberschreibung, dann Agent-spezifischer Standard (`agents.list[].reasoningDefault`), dann Fallback (`off`).

Fehlgeformte Reasoning-Tags lokaler Modelle werden konservativ behandelt. Geschlossene `<think>...</think>`-Blöcke bleiben bei normalen Antworten ausgeblendet, und nicht geschlossene Reasoning-Inhalte nach bereits sichtbarem Text werden ebenfalls ausgeblendet. Wenn eine Antwort vollständig in ein einzelnes nicht geschlossenes öffnendes Tag eingeschlossen ist und andernfalls als leerer Text ausgeliefert würde, entfernt OpenClaw das fehlgeformte öffnende Tag und liefert den verbleibenden Text aus.

## Verwandtes

- Die Dokumentation zum erhöhten Modus finden Sie unter [Erhöhter Modus](/de/tools/elevated).

## Heartbeats

- Der Heartbeat-Prüftext ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie jedoch, Sitzungsstandards durch Heartbeats zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die endgültige Nutzlast. Um zusätzlich die separate `Reasoning:`-Nachricht zu senden (sofern verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder agent-spezifisch `agents.list[].heartbeat.includeReasoning: true`.

## Webchat-Oberfläche

- Der Thinking-Auswahlschalter im Webchat spiegelt beim Laden der Seite die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration wider.
- Die Auswahl einer anderen Stufe schreibt die Sitzungsüberschreibung sofort über `sessions.patch`; sie wartet nicht auf das nächste Senden und ist keine einmalige `thinkingOnce`-Überschreibung.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standard aus dem Provider-Thinking-Profil des aktiven Sitzungsmodells plus derselben Fallback-Logik stammt, die `/status` und `session_status` verwenden.
- Der Picker verwendet `thinkingLevels`, die von der Gateway-Sitzungszeile bzw. den Standards zurückgegeben werden, wobei `thinkingOptions` als Legacy-Label-Liste beibehalten wird. Die Browseroberfläche führt keine eigene Provider-Regex-Liste; Plugins besitzen modellspezifische Stufensätze.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und Picker synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standardwert des Modells zu definieren.
- Provider-Plugins, die Claude-Modelle als Proxy bereitstellen, sollten `resolveClaudeThinkingProfile(modelId)` aus `openclaw/plugin-sdk/provider-model-shared` wiederverwenden, damit direkte Anthropic- und Proxy-Kataloge abgestimmt bleiben.
- Jede Profilstufe hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann ein anzuzeigendes `label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Tool-Plugins, die eine explizite Thinking-Überschreibung validieren müssen, sollten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` verwenden; sie sollten keine eigenen Provider-/Modell-Stufenlisten pflegen.
- Tool-Plugins mit Zugriff auf konfigurierte benutzerdefinierte Modellmetadaten können `catalog` an `resolveThinkingPolicy` übergeben, damit Opt-ins von `compat.supportedReasoningEfforts` in der Plugin-seitigen Validierung berücksichtigt werden.
- Veröffentlichte Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter erhalten, neue benutzerdefinierte Stufensätze sollten jedoch `resolveThinkingProfile` verwenden.
- Gateway-Zeilen/-Standardwerte legen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` offen, damit ACP-/Chat-Clients dieselben Profil-IDs und Labels darstellen, die auch die Laufzeitvalidierung verwendet.
