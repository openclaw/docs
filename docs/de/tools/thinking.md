---
read_when:
    - Anpassen des Parsings oder der Standardwerte für Denkmodus-, Schnellmodus- oder ausführliche Direktiven
summary: Direktivensyntax für /think, /fast, /verbose, /trace und Sichtbarkeit der Schlussfolgerungen
title: Denkstufen
x-i18n:
    generated_at: "2026-05-07T13:26:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8890563aa0171d41549f1d1a6af3279babbcba17eb19302753275e9e2ff01980
    source_path: tools/thinking.md
    workflow: 16
---

## Was es tut

- Inline-Direktive in jedem eingehenden Text: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliase): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink" (maximales Budget)
  - xhigh → "ultrathink+" (GPT-5.2+ und Codex-Modelle sowie Anthropic Claude Opus 4.7-Aufwand)
  - adaptive → vom Provider verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7 und dynamisches Denken von Google Gemini)
  - max → maximale Reasoning-Stufe des Providers (Anthropic Claude Opus 4.7; Ollama ordnet dies seinem höchsten nativen `think`-Aufwand zu)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden `xhigh` zugeordnet.
  - `highest` wird `high` zugeordnet.
- Provider-Hinweise:
  - Denk-Menüs und Auswahlfelder werden durch Provider-Profile gesteuert. Provider-Plugins deklarieren die genaue Stufenmenge für das ausgewählte Modell, einschließlich Labels wie dem binären `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Provider-/Modellprofile angezeigt, die sie unterstützen. Eingegebene Direktiven für nicht unterstützte Stufen werden mit den gültigen Optionen dieses Modells abgelehnt.
  - Vorhandene gespeicherte nicht unterstützte Stufen werden anhand des Provider-Profilrangs neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die größte unterstützte Nicht-`off`-Stufe für das ausgewählte Modell zurückfallen.
  - Anthropic Claude 4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denk-Stufe gesetzt ist.
  - Anthropic Claude Opus 4.7 verwendet adaptives Denken nicht standardmäßig. Der API-Aufwand-Standardwert bleibt Provider-eigen, sofern Sie nicht explizit eine Denk-Stufe setzen.
  - Anthropic Claude Opus 4.7 ordnet `/think xhigh` adaptivem Denken plus `output_config.effort: "xhigh"` zu, weil `/think` eine Denk-Direktive ist und `xhigh` die Aufwandseinstellung von Opus 4.7 ist.
  - Anthropic Claude Opus 4.7 stellt außerdem `/think max` bereit; es wird demselben Provider-eigenen Max-Aufwandspfad zugeordnet.
  - Direkte DeepSeek V4-Modelle stellen `/think xhigh|max` bereit; beide werden DeepSeek `reasoning_effort: "max"` zugeordnet, während niedrigere Nicht-`off`-Stufen `high` zugeordnet werden.
  - Über OpenRouter geroutete DeepSeek V4-Modelle stellen `/think xhigh` bereit und senden von OpenRouter unterstützte `reasoning_effort`-Werte. Gespeicherte `max`-Overrides fallen auf `xhigh` zurück.
  - Denkfähige Ollama-Modelle stellen `/think low|medium|high|max` bereit; `max` wird nativem `think: "high"` zugeordnet, weil Ollamas native API die Aufwandszeichenfolgen `low`, `medium` und `high` akzeptiert.
  - OpenAI GPT-Modelle ordnen `/think` über die modellspezifische Aufwandsunterstützung der Responses API zu. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Nutzlast weg, statt einen nicht unterstützten Wert zu senden.
  - Benutzerdefinierte OpenAI-kompatible Katalogeinträge können `/think xhigh` aktivieren, indem `models.providers.<provider>.models[].compat.supportedReasoningEfforts` so gesetzt wird, dass es `"xhigh"` enthält. Dies verwendet dieselben Kompatibilitätsmetadaten, die ausgehende OpenAI-Reasoning-Aufwandsnutzlasten zuordnen, sodass Menüs, Sitzungsvalidierung, Agent-CLI und `llm-task` mit dem Transportverhalten übereinstimmen.
  - Veraltete konfigurierte OpenRouter Hunter Alpha-Referenzen überspringen Proxy-Reasoning-Injektion, weil diese eingestellte Route finalen Antworttext über Reasoning-Felder zurückgeben konnte.
  - Google Gemini ordnet `/think adaptive` dem Provider-eigenen dynamischen Denken von Gemini zu. Gemini 3-Anfragen lassen ein festes `thinkingLevel` weg, während Gemini 2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin dem nächstliegenden Gemini-`thinkingLevel` oder Budget für diese Modellfamilie zugeordnet.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Denken nicht explizit in Modellparametern oder Anfrageparametern setzen. Dies vermeidet durchgereichte `reasoning_content`-Deltas aus MiniMaxs nicht nativem Anthropic-Streamformat.
  - Z.AI (`zai/*`) unterstützt nur binäres Denken (`on`/`off`). Jede Nicht-`off`-Stufe wird als `on` behandelt (`low` zugeordnet).
  - Moonshot (`moonshot/*`) ordnet `/think off` `thinking: { type: "disabled" }` und jede Nicht-`off`-Stufe `thinking: { type: "enabled" }` zu. Wenn Denken aktiviert ist, akzeptiert Moonshot nur `tool_choice` `auto|none`; OpenClaw normalisiert inkompatible Werte zu `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungs-Override (gesetzt durch Senden einer reinen Direktiven-Nachricht).
3. Pro-Agent-Standard (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: vom Provider deklarierter Standard, wenn verfügbar; andernfalls werden Reasoning-fähige Modelle zu `medium` oder der nächstliegenden unterstützten Nicht-`off`-Stufe für dieses Modell aufgelöst, und Modelle ohne Reasoning bleiben `off`.

## Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** aus der Direktive besteht (Leerzeichen erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender); es wird durch `/think:off` oder das Zurücksetzen nach Sitzungsinaktivität gelöscht.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungszustand bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Denk-Stufe anzuzeigen.

## Anwendung nach Agent

- **Eingebetteter Pi**: Die aufgelöste Stufe wird an die In-Process-Pi-Agent-Laufzeit übergeben.
- **Claude CLI-Backend**: Nicht-`off`-Stufen werden bei Verwendung von `claude-cli` als `--effort` an Claude Code übergeben; siehe [CLI-Backends](/de/gateway/cli-backends).

## Schnellmodus (/fast)

- Stufen: `on|off`.
- Eine reine Direktiven-Nachricht schaltet einen Sitzungs-Override für den Schnellmodus um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuellen effektiven Schnellmodusstatus anzuzeigen.
- OpenClaw löst den Schnellmodus in dieser Reihenfolge auf:
  1. Inline-/reine Direktive `/fast on|off`
  2. Sitzungs-Override
  3. Pro-Agent-Standard (`agents.list[].fastModeDefault`)
  4. Pro-Modell-Konfiguration: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der Schnellmodus auf OpenAI-Prioritätsverarbeitung abgebildet, indem `service_tier=priority` bei unterstützten Responses-Anfragen gesendet wird.
- Für `openai-codex/*` sendet der Schnellmodus dasselbe `service_tier=priority`-Flag bei Codex Responses. OpenClaw verwendet einen gemeinsamen `/fast`-Schalter für beide Authentifizierungspfade.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich OAuth-authentifiziertem Traffic an `api.anthropic.com`, wird der Schnellmodus auf Anthropic-Service-Tiers abgebildet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-`serviceTier`-/`service_tier`-Modellparameter überschreiben den Schnellmodus-Standard, wenn beide gesetzt sind. OpenClaw überspringt weiterhin die Anthropic-Service-Tier-Injektion für Nicht-Anthropic-Proxy-Basis-URLs.
- `/status` zeigt `Fast` nur an, wenn der Schnellmodus aktiviert ist.

## Ausführliche Direktiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine reine Direktiven-Nachricht schaltet ausführliche Sitzungsausgabe um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Zustand zu ändern.
- `/verbose off` speichert einen expliziten Sitzungs-Override; löschen Sie ihn über die Sessions-UI, indem Sie `inherit` wählen.
- Eine Inline-Direktive betrifft nur diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Ausführlichkeitsstufe anzuzeigen.
- Wenn ausführliche Ausgabe aktiviert ist, senden Agenten, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agenten), jeden Tool-Aufruf als eigene reine Metadaten-Nachricht zurück, sofern verfügbar mit `<emoji> <tool-name>: <arg>` vorangestellt. Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Sprechblasen), nicht als Streaming-Deltas.
- Tool-Fehlerzusammenfassungen bleiben im normalen Modus sichtbar, aber reine Fehlerdetailsuffixe werden ausgeblendet, sofern ausführliche Ausgabe nicht `on` oder `full` ist.
- Wenn ausführliche Ausgabe `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Sprechblase, auf eine sichere Länge gekürzt). Wenn Sie während eines laufenden Durchlaufs `/verbose on|full|off` umschalten, beachten nachfolgende Tool-Sprechblasen die neue Einstellung.
- `agents.defaults.toolProgressDetail` steuert die Form der `/verbose`-Tool-Zusammenfassungen und Tool-Zeilen in Fortschrittsentwürfen. Verwenden Sie `"explain"` (Standard) für kompakte menschenlesbare Labels wie `🛠️ Exec: checking JS syntax`; verwenden Sie `"raw"`, wenn Sie zusätzlich den rohen Befehl bzw. das rohe Detail zum Debuggen anhängen möchten. Pro-Agent-`agents.list[].toolProgressDetail` überschreibt den Standard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine reine Direktiven-Nachricht schaltet die Plugin-Trace-Ausgabe für die Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive betrifft nur diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es legt nur Plugin-eigene Trace-/Debug-Zeilen offen, etwa Active Memory-Debug-Zusammenfassungen.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnosemeldung nach der normalen Assistentenantwort erscheinen.

## Reasoning-Sichtbarkeit (/reasoning)

- Stufen: `on|off|stream`.
- Eine reine Direktiven-Nachricht schaltet um, ob Denkblöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit dem Präfix `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfs-Sprechblase, während die Antwort generiert wird, und sendet anschließend die finale Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungs-Override, dann Pro-Agent-Standard (`agents.list[].reasoningDefault`), dann Fallback (`off`).

Fehlerhafte Reasoning-Tags lokaler Modelle werden konservativ behandelt. Geschlossene `<think>...</think>`-Blöcke bleiben bei normalen Antworten ausgeblendet, und nicht geschlossene Reasoning-Abschnitte nach bereits sichtbarem Text werden ebenfalls ausgeblendet. Wenn eine Antwort vollständig in ein einzelnes nicht geschlossenes öffnendes Tag eingeschlossen ist und andernfalls als leerer Text ausgeliefert würde, entfernt OpenClaw das fehlerhafte öffnende Tag und liefert den verbleibenden Text aus.

## Verwandte Themen

- Dokumentation zum erhöhten Modus finden Sie unter [Erhöhter Modus](/de/tools/elevated).

## Heartbeats

- Der Heartbeat-Testtext ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie jedoch, Sitzungsstandards über Heartbeats zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die finale Nutzlast. Um auch die separate `Reasoning:`-Nachricht (wenn verfügbar) zu senden, setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Webchat-UI

- Die Denkstufenauswahl im Webchat spiegelt beim Laden der Seite die in der Sitzung gespeicherte Stufe aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration wider.
- Wird eine andere Stufe ausgewählt, schreibt dies die Sitzungsüberschreibung sofort über `sessions.patch`; es wartet nicht bis zum nächsten Senden und ist keine einmalige `thinkingOnce`-Überschreibung.
- Die erste Option ist immer die Auswahl zum Löschen der Überschreibung. Sie zeigt `Inherited: <resolved level>`, wenn die Sitzung eine nicht deaktivierte effektive Standardeinstellung erbt, oder `Off`, wenn geerbtes Denken deaktiviert ist.
- Explizite Auswahlen im Picker werden als Überschreibungen gekennzeichnet, wobei Provider-Beschriftungen beibehalten werden, wenn sie vorhanden sind (zum Beispiel `Override: maximum` für eine vom Provider beschriftete Option `max`).
- Der Picker verwendet `thinkingLevels`, die von der Gateway-Sitzungszeile bzw. den Standardwerten zurückgegeben werden, wobei `thinkingOptions` als Legacy-Beschriftungsliste beibehalten wird. Die Browser-UI führt keine eigene Provider-Regex-Liste; Plugins besitzen modellspezifische Stufensätze.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und Picker synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standardwert des Modells zu definieren.
- Provider-Plugins, die Claude-Modelle weiterleiten, sollten `resolveClaudeThinkingProfile(modelId)` aus `openclaw/plugin-sdk/provider-model-shared` wiederverwenden, damit direkte Anthropic-Kataloge und Proxy-Kataloge aufeinander abgestimmt bleiben.
- Jede Profilstufe hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann ein anzuzeigendes `label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Tool-Plugins, die eine explizite Denküberschreibung validieren müssen, sollten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` verwenden; sie sollten keine eigenen Provider-/Modell-Stufenlisten führen.
- Tool-Plugins mit Zugriff auf konfigurierte benutzerdefinierte Modellmetadaten können `catalog` an `resolveThinkingPolicy` übergeben, sodass Opt-ins für `compat.supportedReasoningEfforts` in der pluginseitigen Validierung berücksichtigt werden.
- Veröffentlichte Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter erhalten, neue benutzerdefinierte Stufensätze sollten jedoch `resolveThinkingProfile` verwenden.
- Gateway-Zeilen und -Standardwerte stellen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` bereit, sodass ACP-/Chat-Clients dieselben Profil-IDs und Beschriftungen rendern, die auch die Laufzeitvalidierung verwendet.
