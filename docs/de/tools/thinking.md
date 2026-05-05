---
read_when:
    - Anpassen des Parsings oder der Standardwerte für Denk-, Schnellmodus- oder Ausführlichkeitsdirektiven
summary: Direktivensyntax für /think, /fast, /verbose, /trace und die Sichtbarkeit des Reasonings
title: Denkstufen
x-i18n:
    generated_at: "2026-05-05T01:50:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2282c9eccda4693680bbfbfc42de508021f4472b00d40a1a8c1bc19a4516012
    source_path: tools/thinking.md
    workflow: 16
---

## Was es macht

- Inline-Direktive in jedem eingehenden Inhalt: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „denken“
  - low → „intensiv denken“
  - medium → „intensiver denken“
  - high → „ultrathink“ (maximales Budget)
  - xhigh → „ultrathink+“ (GPT-5.2+ und Codex-Modelle sowie Anthropic Claude Opus 4.7 Effort)
  - adaptive → vom Provider verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7 und Google Gemini Dynamic Thinking)
  - max → maximale Provider-Reasoning (Anthropic Claude Opus 4.7; Ollama ordnet dies seinem höchsten nativen `think`-Effort zu)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden `xhigh` zugeordnet.
  - `highest` wird `high` zugeordnet.
- Provider-Hinweise:
  - Denk-Menüs und Auswahlfelder werden über Provider-Profile gesteuert. Provider-Plugins deklarieren den exakten Stufensatz für das ausgewählte Modell, einschließlich Labels wie binärem `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Provider-/Modellprofile angezeigt, die sie unterstützen. Eingegebene Direktiven für nicht unterstützte Stufen werden mit den für dieses Modell gültigen Optionen abgelehnt.
  - Bereits gespeicherte, nicht unterstützte Stufen werden anhand des Provider-Profilrangs neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die größte unterstützte Nicht-`off`-Stufe für das ausgewählte Modell zurückfallen.
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denkstufe gesetzt ist.
  - Anthropic Claude Opus 4.7 verwendet adaptives Denken nicht standardmäßig. Der API-Effort-Standard bleibt Provider-eigen, sofern Sie nicht explizit eine Denkstufe setzen.
  - Anthropic Claude Opus 4.7 ordnet `/think xhigh` adaptivem Denken plus `output_config.effort: "xhigh"` zu, weil `/think` eine Denk-Direktive ist und `xhigh` die Opus-4.7-Effort-Einstellung ist.
  - Anthropic Claude Opus 4.7 stellt außerdem `/think max` bereit; dies wird demselben Provider-eigenen Pfad für maximalen Effort zugeordnet.
  - Direkte DeepSeek-V4-Modelle stellen `/think xhigh|max` bereit; beide werden DeepSeek `reasoning_effort: "max"` zugeordnet, während niedrigere Nicht-`off`-Stufen `high` zugeordnet werden.
  - Über OpenRouter geroutete DeepSeek-V4-Modelle stellen `/think xhigh` bereit und senden von OpenRouter unterstützte `reasoning_effort`-Werte. Gespeicherte `max`-Overrides fallen auf `xhigh` zurück.
  - Denkfähige Ollama-Modelle stellen `/think low|medium|high|max` bereit; `max` wird nativem `think: "high"` zugeordnet, weil Ollamas native API die Effort-Strings `low`, `medium` und `high` akzeptiert.
  - OpenAI-GPT-Modelle ordnen `/think` der modellspezifischen Effort-Unterstützung der Responses API zu. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Nutzlast weg, statt einen nicht unterstützten Wert zu senden.
  - Benutzerdefinierte OpenAI-kompatible Katalogeinträge können `/think xhigh` aktivieren, indem `models.providers.<provider>.models[].compat.supportedReasoningEfforts` so gesetzt wird, dass `"xhigh"` enthalten ist. Dies nutzt dieselben Kompatibilitätsmetadaten, die ausgehende OpenAI-Reasoning-Effort-Nutzlasten zuordnen, sodass Menüs, Sitzungsvalidierung, Agent-CLI und `llm-task` mit dem Transportverhalten übereinstimmen.
  - Veraltete konfigurierte OpenRouter-Hunter-Alpha-Referenzen überspringen die Proxy-Reasoning-Injektion, weil diese eingestellte Route endgültigen Antworttext über Reasoning-Felder zurückgeben konnte.
  - Google Gemini ordnet `/think adaptive` dem Provider-eigenen Dynamic Thinking von Gemini zu. Gemini-3-Anfragen lassen ein festes `thinkingLevel` weg, während Gemini-2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin dem nächstliegenden Gemini-`thinkingLevel` oder Budget für diese Modellfamilie zugeordnet.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Denken nicht explizit in Modellparametern oder Anfrageparametern setzen. Dies verhindert durchgesickerte `reasoning_content`-Deltas aus MiniMax’ nicht nativem Anthropic-Streamformat.
  - Z.AI (`zai/*`) unterstützt nur binäres Denken (`on`/`off`). Jede Nicht-`off`-Stufe wird als `on` behandelt (`low` zugeordnet).
  - Moonshot (`moonshot/*`) ordnet `/think off` `thinking: { type: "disabled" }` und jede Nicht-`off`-Stufe `thinking: { type: "enabled" }` zu. Wenn Denken aktiviert ist, akzeptiert Moonshot nur `tool_choice` `auto|none`; OpenClaw normalisiert inkompatible Werte zu `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungs-Override (gesetzt durch das Senden einer reinen Direktivenachricht).
3. Standard pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: vom Provider deklarierter Standard, sofern verfügbar; andernfalls werden reasoning-fähige Modelle auf `medium` oder die nächstliegende unterstützte Nicht-`off`-Stufe für dieses Modell aufgelöst, und Modelle ohne Reasoning bleiben `off`.

## Sitzungsstandard setzen

- Senden Sie eine Nachricht, die **nur** aus der Direktive besteht (Leerraum erlaubt), z. B. `/think:medium` oder `/t high`.
- Dies bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender); gelöscht durch `/think:off` oder das Zurücksetzen bei Sitzungsinaktivität.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungsstatus bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Denkstufe anzuzeigen.

## Anwendung nach Agent

- **Eingebetteter Pi**: Die aufgelöste Stufe wird an die prozessinterne Pi-Agent-Laufzeit übergeben.
- **Claude-CLI-Backend**: Nicht-`off`-Stufen werden bei Verwendung von `claude-cli` als `--effort` an Claude Code übergeben; siehe [CLI-Backends](/de/gateway/cli-backends).

## Schneller Modus (/fast)

- Stufen: `on|off`.
- Eine reine Direktivenachricht schaltet einen Sitzungs-Override für den schnellen Modus um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuell wirksamen Status des schnellen Modus anzuzeigen.
- OpenClaw löst den schnellen Modus in dieser Reihenfolge auf:
  1. Inline-/reine Direktive `/fast on|off`
  2. Sitzungs-Override
  3. Standard pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der schnelle Modus OpenAI Priority Processing zugeordnet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der schnelle Modus dasselbe `service_tier=priority`-Flag bei Codex Responses. OpenClaw verwendet einen gemeinsamen `/fast`-Schalter für beide Authentifizierungspfade.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich OAuth-authentifiziertem Traffic an `api.anthropic.com`, wird der schnelle Modus Anthropic-Service-Tiers zugeordnet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-`serviceTier`- / `service_tier`-Modellparameter überschreiben den Standard des schnellen Modus, wenn beide gesetzt sind. OpenClaw überspringt weiterhin die Anthropic-Service-Tier-Injektion für Nicht-Anthropic-Proxy-Basis-URLs.
- `/status` zeigt `Fast` nur an, wenn der schnelle Modus aktiviert ist.

## Ausführliche Direktiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine reine Direktivenachricht schaltet ausführliche Sitzungsprotokollierung um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Status zu ändern.
- `/verbose off` speichert einen expliziten Sitzungs-Override; löschen Sie ihn über die Sessions-UI, indem Sie `inherit` auswählen.
- Eine Inline-Direktive wirkt nur auf diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Ausführlichkeitsstufe anzuzeigen.
- Wenn ausführliche Ausgabe aktiviert ist, senden Agents, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agents), jeden Tool-Aufruf als eigene reine Metadaten-Nachricht zurück, sofern verfügbar mit `<emoji> <tool-name>: <arg>` vorangestellt. Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Sprechblasen), nicht als Streaming-Deltas.
- Tool-Fehlerzusammenfassungen bleiben im normalen Modus sichtbar, aber Rohfehlerdetailsuffixe werden ausgeblendet, sofern ausführliche Ausgabe nicht `on` oder `full` ist.
- Wenn ausführliche Ausgabe `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Sprechblase, auf eine sichere Länge gekürzt). Wenn Sie während eines laufenden Durchlaufs `/verbose on|full|off` umschalten, beachten nachfolgende Tool-Sprechblasen die neue Einstellung.
- `agents.defaults.toolProgressDetail` steuert die Form von `/verbose`-Tool-Zusammenfassungen und Tool-Zeilen in Fortschrittsentwürfen. Verwenden Sie `"explain"` (Standard) für kompakte menschenlesbare Labels wie `🛠️ Exec: checking JS syntax`; verwenden Sie `"raw"`, wenn zusätzlich der rohe Befehl bzw. das rohe Detail zum Debuggen angehängt werden soll. `agents.list[].toolProgressDetail` pro Agent überschreibt den Standard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine reine Direktivenachricht schaltet die Plugin-Trace-Ausgabe der Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive wirkt nur auf diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es legt nur Plugin-eigene Trace-/Debug-Zeilen offen, etwa Active Memory-Debug-Zusammenfassungen.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnosemeldung nach der normalen Assistentenantwort erscheinen.

## Reasoning-Sichtbarkeit (/reasoning)

- Stufen: `on|off|stream`.
- Eine reine Direktivenachricht schaltet um, ob Denkblöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit dem Präfix `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfsblase, während die Antwort generiert wird, und sendet anschließend die endgültige Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungs-Override, dann Standard pro Agent (`agents.list[].reasoningDefault`), dann Fallback (`off`).

Fehlgeformte Reasoning-Tags lokaler Modelle werden konservativ behandelt. Geschlossene `<think>...</think>`-Blöcke bleiben bei normalen Antworten verborgen, und nicht geschlossene Reasoning-Anteile nach bereits sichtbarem Text werden ebenfalls verborgen. Wenn eine Antwort vollständig in ein einzelnes nicht geschlossenes öffnendes Tag eingeschlossen ist und andernfalls als leerer Text geliefert würde, entfernt OpenClaw das fehlgeformte öffnende Tag und liefert den verbleibenden Text.

## Verwandt

- Dokumentation zum erhöhten Modus finden Sie unter [Erhöhter Modus](/de/tools/elevated).

## Heartbeats

- Der Heartbeat-Probetext ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie jedoch, Sitzungsstandards aus Heartbeats heraus zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die endgültige Nutzlast. Um zusätzlich die separate `Reasoning:`-Nachricht zu senden (wenn verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Webchat-UI

- Der Denk-Selector des Webchats spiegelt beim Laden der Seite die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration wider.
- Die Auswahl einer anderen Stufe schreibt den Sitzungs-Override sofort über `sessions.patch`; sie wartet nicht auf das nächste Senden und ist kein einmaliger `thinkingOnce`-Override.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standard aus dem Provider-Denkprofil des aktiven Sitzungsmodells plus derselben Fallback-Logik stammt, die `/status` und `session_status` verwenden.
- Das Auswahlfeld verwendet `thinkingLevels`, die von der Gateway-Sitzungszeile bzw. den Standards zurückgegeben werden, wobei `thinkingOptions` als Legacy-Labelliste beibehalten wird. Die Browser-UI führt keine eigene Provider-Regex-Liste; Plugins besitzen modellspezifische Stufensätze.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und Auswahlfeld synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standardwert des Modells zu definieren.
- Provider-Plugins, die Claude-Modelle per Proxy bereitstellen, sollten `resolveClaudeThinkingProfile(modelId)` aus `openclaw/plugin-sdk/provider-model-shared` wiederverwenden, damit direkte Anthropic- und Proxy-Kataloge synchron bleiben.
- Jede Profilstufe hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann ein Anzeige-`label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Werkzeug-Plugins, die eine explizite Thinking-Überschreibung validieren müssen, sollten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` verwenden; sie sollten keine eigenen Provider-/Modellstufenlisten pflegen.
- Werkzeug-Plugins mit Zugriff auf konfigurierte benutzerdefinierte Modellmetadaten können `catalog` an `resolveThinkingPolicy` übergeben, damit `compat.supportedReasoningEfforts`-Opt-ins in der Plugin-seitigen Validierung berücksichtigt werden.
- Veröffentlichte Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter bestehen, aber neue benutzerdefinierte Stufensätze sollten `resolveThinkingProfile` verwenden.
- Gateway-Zeilen/-Standardwerte stellen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` bereit, damit ACP-/Chat-Clients dieselben Profil-IDs und Labels rendern, die auch die Runtime-Validierung verwendet.
