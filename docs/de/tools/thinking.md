---
read_when:
    - Anpassen der Denkmodus-, Schnellmodus- oder ausführlichen Direktivenverarbeitung oder -Standardwerte
summary: Direktivensyntax für /think, /fast, /verbose, /trace und Sichtbarkeit des Denkprozesses
title: Denkstufen
x-i18n:
    generated_at: "2026-04-30T07:19:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9fabead8d2f58fc5bce3bf8b281ad9d52da2cd02ba2777bc1597359537b7705
    source_path: tools/thinking.md
    workflow: 16
---

## Was es tut

- Inline-Direktive in jedem eingehenden Text: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think“
  - low → „think hard“
  - medium → „think harder“
  - high → „ultrathink“ (maximales Budget)
  - xhigh → „ultrathink+“ (GPT-5.2+ und Codex-Modelle, plus Anthropic Claude Opus 4.7 effort)
  - adaptive → vom Provider verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7 und Google Gemini Dynamic Thinking)
  - max → maximales Reasoning des Providers (Anthropic Claude Opus 4.7; Ollama ordnet dies seinem höchsten nativen `think`-Aufwand zu)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden `xhigh` zugeordnet.
  - `highest` wird `high` zugeordnet.
- Provider-Hinweise:
  - Denk-Menüs und Auswahllisten werden durch Provider-Profile gesteuert. Provider-Plugins deklarieren den exakten Stufensatz für das ausgewählte Modell, einschließlich Labels wie binärem `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Provider-/Modellprofile angeboten, die sie unterstützen. Eingegebene Direktiven für nicht unterstützte Stufen werden mit den gültigen Optionen dieses Modells abgelehnt.
  - Vorhandene gespeicherte, nicht unterstützte Stufen werden anhand des Provider-Profilrangs neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die größte unterstützte Nicht-`off`-Stufe für das ausgewählte Modell zurückfallen.
  - Anthropic Claude 4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denkstufe festgelegt ist.
  - Anthropic Claude Opus 4.7 verwendet standardmäßig kein adaptives Denken. Der API-Standardwert für Aufwand bleibt Provider-eigen, sofern Sie nicht explizit eine Denkstufe festlegen.
  - Anthropic Claude Opus 4.7 ordnet `/think xhigh` adaptivem Denken plus `output_config.effort: "xhigh"` zu, weil `/think` eine Denk-Direktive ist und `xhigh` die Opus 4.7-Aufwandseinstellung ist.
  - Anthropic Claude Opus 4.7 stellt auch `/think max` bereit; es wird demselben Provider-eigenen Pfad für maximalen Aufwand zugeordnet.
  - Denkfähige Ollama-Modelle stellen `/think low|medium|high|max` bereit; `max` wird nativem `think: "high"` zugeordnet, weil Ollamas native API die Aufwand-Strings `low`, `medium` und `high` akzeptiert.
  - OpenAI GPT-Modelle ordnen `/think` über die modellspezifische Unterstützung für Aufwand in der Responses API zu. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Nutzlast weg, statt einen nicht unterstützten Wert zu senden.
  - Benutzerdefinierte OpenAI-kompatible Katalogeinträge können `/think xhigh` aktivieren, indem `models.providers.<provider>.models[].compat.supportedReasoningEfforts` so gesetzt wird, dass `"xhigh"` enthalten ist. Dies verwendet dieselben Kompatibilitätsmetadaten, die ausgehende OpenAI-Reasoning-Aufwand-Nutzlasten zuordnen, sodass Menüs, Sitzungsvalidierung, Agent-CLI und `llm-task` mit dem Transportverhalten übereinstimmen.
  - Veraltete konfigurierte OpenRouter Hunter Alpha-Referenzen überspringen die Proxy-Reasoning-Injektion, weil diese eingestellte Route finalen Antworttext über Reasoning-Felder zurückgeben konnte.
  - Google Gemini ordnet `/think adaptive` dem Provider-eigenen dynamischen Denken von Gemini zu. Gemini 3-Anfragen lassen ein festes `thinkingLevel` weg, während Gemini 2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin dem nächstliegenden Gemini-`thinkingLevel` oder Budget für diese Modellfamilie zugeordnet.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Denken nicht explizit in Modellparametern oder Anfrageparametern festlegen. Dies verhindert geleakte `reasoning_content`-Deltas aus MiniMaxs nicht nativem Anthropic-Stream-Format.
  - Z.AI (`zai/*`) unterstützt nur binäres Denken (`on`/`off`). Jede Nicht-`off`-Stufe wird als `on` behandelt (`low` zugeordnet).
  - Moonshot (`moonshot/*`) ordnet `/think off` `thinking: { type: "disabled" }` und jede Nicht-`off`-Stufe `thinking: { type: "enabled" }` zu. Wenn Denken aktiviert ist, akzeptiert Moonshot für `tool_choice` nur `auto|none`; OpenClaw normalisiert inkompatible Werte zu `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (durch Senden einer reinen Direktiven-Nachricht gesetzt).
3. Agent-spezifischer Standard (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Rückfall: vom Provider deklarierter Standard, wenn verfügbar; andernfalls werden reasoning-fähige Modelle zu `medium` oder zur nächstliegenden unterstützten Nicht-`off`-Stufe für dieses Modell aufgelöst, und Modelle ohne Reasoning bleiben `off`.

## Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** die Direktive enthält (Leerraum erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender); gelöscht durch `/think:off` oder Zurücksetzen nach Sitzungsinaktivität.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungszustand bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Denkstufe anzuzeigen.

## Anwendung nach Agent

- **Eingebetteter Pi**: Die aufgelöste Stufe wird an die In-Process-Pi-Agent-Laufzeit übergeben.

## Schnellmodus (/fast)

- Stufen: `on|off`.
- Eine reine Direktiven-Nachricht schaltet eine Sitzungsüberschreibung für den Schnellmodus um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuell wirksamen Schnellmoduszustand anzuzeigen.
- OpenClaw löst den Schnellmodus in dieser Reihenfolge auf:
  1. Inline/reine Direktive `/fast on|off`
  2. Sitzungsüberschreibung
  3. Agent-spezifischer Standard (`agents.list[].fastModeDefault`)
  4. Modellbezogene Konfiguration: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Rückfall: `off`
- Für `openai/*` wird der Schnellmodus OpenAI Priority Processing zugeordnet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Schnellmodus dasselbe Flag `service_tier=priority` bei Codex Responses. OpenClaw behält einen gemeinsamen `/fast`-Schalter für beide Authentifizierungspfade bei.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich per OAuth authentifiziertem Traffic an `api.anthropic.com`, wird der Schnellmodus Anthropic-Service-Tiers zugeordnet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` zu `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Schnellmodus-Standard, wenn beide gesetzt sind. OpenClaw überspringt Anthropic-Service-Tier-Injektion weiterhin für nicht-Anthropic-Proxy-Basis-URLs.
- `/status` zeigt `Fast` nur an, wenn der Schnellmodus aktiviert ist.

## Ausführliche Direktiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine reine Direktiven-Nachricht schaltet ausführliche Sitzungsausgaben um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Zustand zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie über die Sitzungs-UI, indem Sie `inherit` wählen.
- Eine Inline-Direktive betrifft nur diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Ausführlichkeitsstufe anzuzeigen.
- Wenn ausführliche Ausgabe aktiviert ist, senden Agents, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agents), jeden Tool-Aufruf als eigene reine Metadaten-Nachricht zurück, vorangestellt mit `<emoji> <tool-name>: <arg>`, wenn verfügbar (Pfad/Befehl). Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Sprechblasen), nicht als Streaming-Deltas.
- Zusammenfassungen von Tool-Fehlern bleiben im Normalmodus sichtbar, aber rohe Fehlerdetailsuffixe werden ausgeblendet, sofern verbose nicht `on` oder `full` ist.
- Wenn verbose `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Sprechblase, auf eine sichere Länge gekürzt). Wenn Sie während eines laufenden Durchlaufs `/verbose on|full|off` umschalten, berücksichtigen nachfolgende Tool-Sprechblasen die neue Einstellung.

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine reine Direktiven-Nachricht schaltet die Plugin-Trace-Ausgabe der Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive betrifft nur diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es stellt nur Plugin-eigene Trace-/Debug-Zeilen bereit, etwa Active Memory-Debug-Zusammenfassungen.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnose-Nachricht nach der normalen Assistant-Antwort erscheinen.

## Reasoning-Sichtbarkeit (/reasoning)

- Stufen: `on|off|stream`.
- Eine reine Direktiven-Nachricht schaltet um, ob Denkblöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** gesendet, vorangestellt mit `Reasoning:`.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfs-Sprechblase, während die Antwort generiert wird, und sendet danach die finale Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungsüberschreibung, dann Agent-spezifischer Standard (`agents.list[].reasoningDefault`), dann Rückfall (`off`).

Fehlerhafte Reasoning-Tags lokaler Modelle werden konservativ behandelt. Geschlossene `<think>...</think>`-Blöcke bleiben in normalen Antworten verborgen, und nicht geschlossene Reasoning-Ausgaben nach bereits sichtbarem Text werden ebenfalls verborgen. Wenn eine Antwort vollständig in ein einzelnes nicht geschlossenes öffnendes Tag eingeschlossen ist und andernfalls als leerer Text ausgeliefert würde, entfernt OpenClaw das fehlerhafte öffnende Tag und liefert den verbleibenden Text aus.

## Verwandt

- Die Dokumentation zum erhöhten Modus befindet sich unter [Erhöhter Modus](/de/tools/elevated).

## Heartbeats

- Der Heartbeat-Probetext ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie gewohnt (vermeiden Sie jedoch, Sitzungsstandards durch Heartbeats zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die finale Nutzlast. Um zusätzlich die separate `Reasoning:`-Nachricht zu senden (wenn verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder Agent-spezifisch `agents.list[].heartbeat.includeReasoning: true`.

## Webchat-UI

- Der Denk-Auswahlschalter im Webchat spiegelt beim Laden der Seite die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher/der Konfiguration wider.
- Die Auswahl einer anderen Stufe schreibt die Sitzungsüberschreibung sofort über `sessions.patch`; sie wartet nicht auf das nächste Senden und ist keine einmalige `thinkingOnce`-Überschreibung.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standard aus dem Provider-Denkprofil des aktiven Sitzungsmodells plus derselben Rückfalllogik stammt, die `/status` und `session_status` verwenden.
- Die Auswahlliste verwendet `thinkingLevels`, die von der Gateway-Sitzungszeile/den Defaults zurückgegeben werden, wobei `thinkingOptions` als Legacy-Label-Liste beibehalten wird. Die Browser-UI führt keine eigene Provider-Regex-Liste; Plugins besitzen modellspezifische Stufensätze.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und Auswahlliste synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standardwert des Modells zu definieren.
- Provider-Plugins, die Claude-Modelle per Proxy bereitstellen, sollten `resolveClaudeThinkingProfile(modelId)` aus `openclaw/plugin-sdk/provider-model-shared` wiederverwenden, damit direkte Anthropic- und Proxy-Kataloge synchron bleiben.
- Jede Profilstufe hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann ein Anzeige-`label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Tool-Plugins, die einen expliziten Thinking-Override validieren müssen, sollten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` verwenden; sie sollten keine eigenen Provider-/Modell-Stufenlisten pflegen.
- Tool-Plugins mit Zugriff auf konfigurierte benutzerdefinierte Modellmetadaten können `catalog` an `resolveThinkingPolicy` übergeben, damit Opt-ins für `compat.supportedReasoningEfforts` in der Plugin-seitigen Validierung berücksichtigt werden.
- Veröffentlichte Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter erhalten, aber neue benutzerdefinierte Stufensätze sollten `resolveThinkingProfile` verwenden.
- Gateway-Zeilen/-Standardwerte stellen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` bereit, damit ACP-/Chat-Clients dieselben Profil-IDs und Labels rendern, die auch die Laufzeitvalidierung verwendet.
