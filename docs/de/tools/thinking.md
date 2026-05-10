---
read_when:
    - Anpassen des Parsings oder der Standardwerte für Thinking-, Schnellmodus- oder Verbose-Direktiven
summary: Direktivensyntax für /think, /fast, /verbose, /trace und Sichtbarkeit des Reasonings
title: Denkstufen
x-i18n:
    generated_at: "2026-05-10T19:56:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: c75e2360a260aaf4571f2da6c7519fb4987e4c8c7947e3dc37f94a0ad260ad55
    source_path: tools/thinking.md
    workflow: 16
---

## Was es bewirkt

- Inline-Direktive in jedem eingehenden Textkörper: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "denken"
  - low → "intensiv denken"
  - medium → "intensiver denken"
  - high → "ultradenken" (maximales Budget)
  - xhigh → "ultradenken+" (GPT-5.2+ und Codex-Modelle sowie Anthropic Claude Opus 4.7 Effort)
  - adaptive → Provider-verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7 und Google Gemini dynamisches Denken)
  - max → maximales Reasoning des Providers (Anthropic Claude Opus 4.7; Ollama ordnet dies seinem höchsten nativen `think`-Effort zu)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden `xhigh` zugeordnet.
  - `highest` wird `high` zugeordnet.
- Provider-Hinweise:
  - Thinking-Menüs und Auswahlelemente werden durch das Provider-Profil gesteuert. Provider-Plugins deklarieren den genauen Stufensatz für das ausgewählte Modell, einschließlich Labels wie binärem `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Provider-/Modellprofile angeboten, die sie unterstützen. Eingegebene Direktiven für nicht unterstützte Stufen werden mit den gültigen Optionen dieses Modells abgelehnt.
  - Vorhandene gespeicherte, nicht unterstützte Stufen werden nach dem Rang des Provider-Profils neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die größte unterstützte Nicht-`off`-Stufe für das ausgewählte Modell zurückfallen.
  - Anthropic Claude 4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Thinking-Stufe festgelegt ist.
  - Anthropic Claude Opus 4.7 verwendet nicht standardmäßig adaptives Denken. Der API-Effort-Standard bleibt Provider-eigen, sofern Sie nicht explizit eine Thinking-Stufe festlegen.
  - Anthropic Claude Opus 4.7 ordnet `/think xhigh` adaptivem Denken plus `output_config.effort: "xhigh"` zu, weil `/think` eine Thinking-Direktive ist und `xhigh` die Opus 4.7-Effort-Einstellung ist.
  - Anthropic Claude Opus 4.7 stellt außerdem `/think max` bereit; es wird demselben Provider-eigenen Max-Effort-Pfad zugeordnet.
  - Direkte DeepSeek V4-Modelle stellen `/think xhigh|max` bereit; beide werden DeepSeek `reasoning_effort: "max"` zugeordnet, während niedrigere Nicht-`off`-Stufen `high` zugeordnet werden.
  - Über OpenRouter geroutete DeepSeek V4-Modelle stellen `/think xhigh` bereit und senden von OpenRouter unterstützte `reasoning_effort`-Werte. Gespeicherte `max`-Overrides fallen auf `xhigh` zurück.
  - Ollama-Modelle mit Thinking-Unterstützung stellen `/think low|medium|high|max` bereit; `max` wird nativem `think: "high"` zugeordnet, weil Ollamas native API die Effort-Zeichenfolgen `low`, `medium` und `high` akzeptiert.
  - OpenAI GPT-Modelle ordnen `/think` über die modellspezifische Effort-Unterstützung der Responses API zu. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Nutzlast weg, statt einen nicht unterstützten Wert zu senden.
  - Benutzerdefinierte OpenAI-kompatible Katalogeinträge können `/think xhigh` aktivieren, indem `models.providers.<provider>.models[].compat.supportedReasoningEfforts` so gesetzt wird, dass es `"xhigh"` enthält. Dies verwendet dieselben Compat-Metadaten, die ausgehende OpenAI-Reasoning-Effort-Nutzlasten zuordnen, sodass Menüs, Sitzungsvalidierung, Agent-CLI und `llm-task` mit dem Transportverhalten übereinstimmen.
  - Veraltete konfigurierte OpenRouter Hunter Alpha-Refs überspringen die Proxy-Reasoning-Injektion, weil diese eingestellte Route endgültigen Antworttext über Reasoning-Felder zurückgeben konnte.
  - Google Gemini ordnet `/think adaptive` Geminis Provider-eigenem dynamischem Denken zu. Gemini 3-Anfragen lassen ein festes `thinkingLevel` weg, während Gemini 2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin dem nächstliegenden Gemini-`thinkingLevel` oder Budget für diese Modellfamilie zugeordnet.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Thinking nicht explizit in Modellparametern oder Anfrageparametern festlegen. Dies verhindert durchgesickerte `reasoning_content`-Deltas aus MiniMax' nicht nativem Anthropic-Stream-Format.
  - Z.AI (`zai/*`) unterstützt nur binäres Thinking (`on`/`off`). Jede Nicht-`off`-Stufe wird als `on` behandelt (`low` zugeordnet).
  - Moonshot (`moonshot/*`) ordnet `/think off` `thinking: { type: "disabled" }` und jede Nicht-`off`-Stufe `thinking: { type: "enabled" }` zu. Wenn Thinking aktiviert ist, akzeptiert Moonshot nur `tool_choice` `auto|none`; OpenClaw normalisiert inkompatible Werte zu `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungs-Override (durch Senden einer Nur-Direktive-Nachricht festgelegt).
3. Standard pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: vom Provider deklarierter Standard, wenn verfügbar; andernfalls werden Reasoning-fähige Modelle zu `medium` oder zur nächstliegenden unterstützten Nicht-`off`-Stufe für dieses Modell aufgelöst, und Nicht-Reasoning-Modelle bleiben `off`.

## Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** die Direktive enthält (Leerraum erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender). Verwenden Sie `/think default`, um den Sitzungs-Override zu löschen und den konfigurierten/Provider-Standard zu erben; Aliasse sind `inherit`, `clear`, `reset` und `unpin`.
- `/think off` speichert einen expliziten Off-Override. Es deaktiviert Thinking, bis Sie den Sitzungs-Override ändern oder löschen.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungszustand bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Thinking-Stufe anzuzeigen.

## Anwendung nach Agent

- **Eingebetteter Pi**: Die aufgelöste Stufe wird an die In-Process-Pi-Agent-Laufzeit übergeben.
- **Claude CLI-Backend**: Nicht-`off`-Stufen werden bei Verwendung von `claude-cli` als `--effort` an Claude Code übergeben; siehe [CLI-Backends](/de/gateway/cli-backends).

## Schnellmodus (/fast)

- Stufen: `on|off|default`.
- Eine Nur-Direktive-Nachricht schaltet einen Sitzungs-Override für den Schnellmodus um und antwortet `Fast mode enabled.` / `Fast mode disabled.`. Verwenden Sie `/fast default`, um den Sitzungs-Override zu löschen und den konfigurierten Standard zu erben; Aliasse sind `inherit`, `clear`, `reset` und `unpin`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuellen effektiven Schnellmodus-Zustand anzuzeigen.
- OpenClaw löst den Schnellmodus in dieser Reihenfolge auf:
  1. Inline-/Nur-Direktive-Override `/fast on|off` (`/fast default` löscht diese Ebene)
  2. Sitzungs-Override
  3. Standard pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der Schnellmodus OpenAI-Prioritätsverarbeitung zugeordnet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Schnellmodus dasselbe `service_tier=priority`-Flag bei Codex Responses. OpenClaw verwendet einen gemeinsamen `/fast`-Schalter für beide Authentifizierungspfade.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich per OAuth authentifiziertem Traffic an `api.anthropic.com`, wird der Schnellmodus Anthropic-Service-Tiers zugeordnet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` zu `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-`serviceTier`- / `service_tier`-Modellparameter überschreiben den Schnellmodus-Standard, wenn beide gesetzt sind. OpenClaw überspringt weiterhin die Anthropic-Service-Tier-Injektion für Nicht-Anthropic-Proxy-Basis-URLs.
- `/status` zeigt `Fast` nur an, wenn der Schnellmodus aktiviert ist.

## Ausführliche Direktiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Nur-Direktive-Nachricht schaltet ausführliche Sitzungsausgabe um und antwortet `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Zustand zu ändern.
- `/verbose off` speichert einen expliziten Sitzungs-Override; löschen Sie ihn über die Sitzungs-UI, indem Sie `inherit` wählen.
- Eine Inline-Direktive wirkt nur auf diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle ausführliche Stufe anzuzeigen.
- Wenn ausführliche Ausgabe aktiviert ist, senden Agents, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agents), jeden Tool-Aufruf als eigene Nur-Metadaten-Nachricht zurück, sofern verfügbar mit `<emoji> <tool-name>: <arg>` vorangestellt. Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Blasen), nicht als Streaming-Deltas.
- Tool-Fehlerzusammenfassungen bleiben im normalen Modus sichtbar, aber rohe Fehlerdetailsuffixe werden ausgeblendet, sofern ausführliche Ausgabe nicht `on` oder `full` ist.
- Wenn ausführliche Ausgabe `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Blase, auf eine sichere Länge gekürzt). Wenn Sie `/verbose on|full|off` umschalten, während ein Lauf aktiv ist, beachten nachfolgende Tool-Blasen die neue Einstellung.
- `agents.defaults.toolProgressDetail` steuert die Form der `/verbose`-Tool-Zusammenfassungen und Tool-Zeilen im Fortschrittsentwurf. Verwenden Sie `"explain"` (Standard) für kompakte, menschenlesbare Labels wie `🛠️ Exec: checking JS syntax`; verwenden Sie `"raw"`, wenn Sie zusätzlich den rohen Befehl/das rohe Detail zum Debuggen anhängen möchten. `agents.list[].toolProgressDetail` pro Agent überschreibt den Standard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine Nur-Direktive-Nachricht schaltet die Plugin-Trace-Ausgabe für die Sitzung um und antwortet `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive wirkt nur auf diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es stellt nur Plugin-eigene Trace-/Debug-Zeilen bereit, etwa Active Memory-Debug-Zusammenfassungen.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnosemeldung nach der normalen Assistentenantwort erscheinen.

## Reasoning-Sichtbarkeit (/reasoning)

- Stufen: `on|off|stream`.
- Eine Nur-Direktive-Nachricht schaltet um, ob Thinking-Blöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** gesendet, vorangestellt mit `Reasoning:`.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfsblase, während die Antwort generiert wird, und sendet dann die endgültige Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungs-Override, dann Standard pro Agent (`agents.list[].reasoningDefault`), dann globaler Standard (`agents.defaults.reasoningDefault`), dann Fallback (`off`).

Fehlerhaft geformte Reasoning-Tags lokaler Modelle werden konservativ behandelt. Geschlossene `<think>...</think>`-Blöcke bleiben in normalen Antworten ausgeblendet, und nicht geschlossene Reasoning-Inhalte nach bereits sichtbarem Text werden ebenfalls ausgeblendet. Wenn eine Antwort vollständig in ein einzelnes nicht geschlossenes öffnendes Tag eingeschlossen ist und andernfalls als leerer Text ausgeliefert würde, entfernt OpenClaw das fehlerhafte öffnende Tag und liefert den verbleibenden Text aus.

## Verwandte Themen

- Dokumentation zum erhöhten Modus befindet sich unter [Erhöhter Modus](/de/tools/elevated).

## Heartbeats

- Der Heartbeat-Prüftext ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie jedoch, Sitzungsstandards aus Heartbeats zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die endgültige Nutzlast. Um zusätzlich die separate `Reasoning:`-Nachricht (wenn verfügbar) zu senden, setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Webchat-UI

- Die Auswahl einer Denkstufe im Webchat spiegelt beim Laden der Seite die in der Sitzung gespeicherte Stufe aus dem eingehenden Sitzungsspeicher bzw. der eingehenden Konfiguration wider.
- Wenn Sie eine andere Stufe auswählen, wird die Sitzungsüberschreibung sofort über `sessions.patch` geschrieben; sie wartet nicht bis zum nächsten Senden und ist keine einmalige `thinkingOnce`-Überschreibung.
- Die erste Option ist immer die Auswahl zum Löschen der Überschreibung. Sie zeigt `Inherited: <resolved level>`, wenn die Sitzung einen nicht deaktivierten wirksamen Standard erbt, oder `Off`, wenn geerbtes Denken deaktiviert ist.
- Explizite Auswahloptionen werden als Überschreibungen beschriftet, wobei Provider-Beschriftungen erhalten bleiben, sofern vorhanden (zum Beispiel `Override: maximum` für eine vom Provider beschriftete Option `max`).
- Die Auswahl verwendet `thinkingLevels`, die von der Gateway-Sitzungszeile bzw. den Gateway-Standardwerten zurückgegeben werden, wobei `thinkingOptions` als veraltete Beschriftungsliste beibehalten wird. Die Browser-Benutzeroberfläche führt keine eigene Provider-Regex-Liste; Plugins besitzen modellspezifische Stufensätze.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und die Auswahl synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standardwert des Modells zu definieren.
- Provider-Plugins, die Claude-Modelle proxyn, sollten `resolveClaudeThinkingProfile(modelId)` aus `openclaw/plugin-sdk/provider-model-shared` wiederverwenden, damit direkte Anthropic- und Proxy-Kataloge aufeinander abgestimmt bleiben.
- Jede Profilstufe hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann eine Anzeige-`label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Tool-Plugins, die eine explizite Denküberschreibung validieren müssen, sollten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` verwenden; sie sollten keine eigenen Provider-/Modell-Stufenlisten führen.
- Tool-Plugins mit Zugriff auf konfigurierte benutzerdefinierte Modellmetadaten können `catalog` an `resolveThinkingPolicy` übergeben, sodass Opt-ins über `compat.supportedReasoningEfforts` in der Plugin-seitigen Validierung berücksichtigt werden.
- Veröffentlichte Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter erhalten, aber neue benutzerdefinierte Stufensätze sollten `resolveThinkingProfile` verwenden.
- Gateway-Zeilen und -Standardwerte stellen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` bereit, damit ACP-/Chat-Clients dieselben Profil-IDs und Beschriftungen rendern, die auch die Laufzeitvalidierung verwendet.
