---
read_when:
    - Anpassen der Auswertung oder Standardeinstellungen für Thinking-, fast-mode- oder verbose-Direktiven
summary: Direktivensyntax für /think, /fast, /verbose, /trace und die Sichtbarkeit des Denkprozesses
title: Denkstufen
x-i18n:
    generated_at: "2026-04-30T16:31:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: f9adf065e46cb64e4c2149b95ecd69ed887a17e2eff5a5569894defa3e7217b7
    source_path: tools/thinking.md
    workflow: 16
---

## Was es bewirkt

- Inline-Direktive in jedem eingehenden Textkörper: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliase): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „denken“
  - low → „intensiv denken“
  - medium → „intensiver denken“
  - high → „ultrathink“ (maximales Budget)
  - xhigh → „ultrathink+“ (GPT-5.2+ und Codex-Modelle, plus Anthropic Claude Opus 4.7-Aufwand)
  - adaptive → vom Provider verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7 und dynamisches Denken von Google Gemini)
  - max → maximale Reasoning-Leistung des Providers (Anthropic Claude Opus 4.7; Ollama ordnet dies seiner höchsten nativen `think`-Aufwandsstufe zu)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden `xhigh` zugeordnet.
  - `highest` wird `high` zugeordnet.
- Provider-Hinweise:
  - Thinking-Menüs und Auswahlelemente werden durch Provider-Profile gesteuert. Provider-Plugins deklarieren die exakte Stufenmenge für das ausgewählte Modell, einschließlich Labels wie dem binären `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Provider-/Modellprofile angezeigt, die sie unterstützen. Eingegebene Direktiven für nicht unterstützte Stufen werden mit den gültigen Optionen dieses Modells abgelehnt.
  - Vorhandene gespeicherte nicht unterstützte Stufen werden anhand des Rangs im Provider-Profil neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die größte unterstützte Nicht-`off`-Stufe für das ausgewählte Modell zurückfallen.
  - Anthropic Claude 4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Thinking-Stufe festgelegt ist.
  - Anthropic Claude Opus 4.7 verwendet adaptives Denken nicht standardmäßig. Der API-Standard für Aufwand bleibt Provider-gesteuert, sofern Sie nicht explizit eine Thinking-Stufe festlegen.
  - Anthropic Claude Opus 4.7 ordnet `/think xhigh` adaptivem Denken plus `output_config.effort: "xhigh"` zu, da `/think` eine Thinking-Direktive ist und `xhigh` die Aufwandseinstellung von Opus 4.7 ist.
  - Anthropic Claude Opus 4.7 stellt auch `/think max` bereit; es wird demselben Provider-eigenen Pfad für maximalen Aufwand zugeordnet.
  - DeepSeek V4-Modelle stellen `/think xhigh|max` bereit; beide werden DeepSeek `reasoning_effort: "max"` zugeordnet, während niedrigere Nicht-`off`-Stufen `high` zugeordnet werden.
  - Denkfähige Ollama-Modelle stellen `/think low|medium|high|max` bereit; `max` wird nativem `think: "high"` zugeordnet, da Ollamas native API die Aufwandszeichenfolgen `low`, `medium` und `high` akzeptiert.
  - OpenAI GPT-Modelle ordnen `/think` über die modellspezifische Unterstützung für Aufwand in der Responses API zu. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Nutzlast weg, statt einen nicht unterstützten Wert zu senden.
  - Benutzerdefinierte OpenAI-kompatible Katalogeinträge können `/think xhigh` aktivieren, indem `models.providers.<provider>.models[].compat.supportedReasoningEfforts` so gesetzt wird, dass `"xhigh"` enthalten ist. Dies verwendet dieselben Kompatibilitätsmetadaten, die ausgehende OpenAI-Reasoning-Aufwandsnutzlasten zuordnen, sodass Menüs, Sitzungsvalidierung, Agent-CLI und `llm-task` mit dem Transportverhalten übereinstimmen.
  - Veraltete konfigurierte OpenRouter Hunter Alpha-Refs überspringen Proxy-Reasoning-Injektion, da diese eingestellte Route finalen Antworttext über Reasoning-Felder zurückgeben konnte.
  - Google Gemini ordnet `/think adaptive` dem Provider-eigenen dynamischen Denken von Gemini zu. Gemini 3-Anfragen lassen ein festes `thinkingLevel` weg, während Gemini 2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin dem nächstliegenden Gemini-`thinkingLevel` oder Budget für diese Modellfamilie zugeordnet.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Thinking nicht explizit in Modellparametern oder Anfrageparametern festlegen. Dadurch werden durchgesickerte `reasoning_content`-Deltas aus MiniMaxs nicht nativem Anthropic-Stream-Format vermieden.
  - Z.AI (`zai/*`) unterstützt nur binäres Thinking (`on`/`off`). Jede Nicht-`off`-Stufe wird als `on` behandelt (zu `low` zugeordnet).
  - Moonshot (`moonshot/*`) ordnet `/think off` `thinking: { type: "disabled" }` und jede Nicht-`off`-Stufe `thinking: { type: "enabled" }` zu. Wenn Thinking aktiviert ist, akzeptiert Moonshot für `tool_choice` nur `auto|none`; OpenClaw normalisiert inkompatible Werte zu `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (festgelegt durch Senden einer Nachricht, die nur aus einer Direktive besteht).
3. Standard pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: vom Provider deklarierter Standard, sofern verfügbar; andernfalls werden Reasoning-fähige Modelle zu `medium` oder zur nächstliegenden unterstützten Nicht-`off`-Stufe für dieses Modell aufgelöst, und Modelle ohne Reasoning bleiben `off`.

## Einen Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** aus der Direktive besteht (Leerzeichen sind erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender); gelöscht durch `/think:off` oder Zurücksetzen nach Sitzungsinaktivität.
- Es wird eine Bestätigungsantwort gesendet (`Thinking level set to high.` / `Thinking disabled.`). Ist die Stufe ungültig (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungszustand bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Thinking-Stufe anzuzeigen.

## Anwendung nach Agent

- **Eingebetteter Pi**: Die aufgelöste Stufe wird an die prozessinterne Pi-Agent-Laufzeit übergeben.

## Schnellmodus (/fast)

- Stufen: `on|off`.
- Eine Nachricht, die nur aus der Direktive besteht, schaltet eine Sitzungsüberschreibung für den Schnellmodus um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuellen effektiven Schnellmodus-Zustand anzuzeigen.
- OpenClaw löst den Schnellmodus in dieser Reihenfolge auf:
  1. Inline-/Nur-Direktive `/fast on|off`
  2. Sitzungsüberschreibung
  3. Standard pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der Schnellmodus der OpenAI-Prioritätsverarbeitung zugeordnet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Schnellmodus dasselbe `service_tier=priority`-Flag bei Codex Responses. OpenClaw verwendet einen gemeinsamen `/fast`-Schalter für beide Authentifizierungspfade.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich OAuth-authentifiziertem Verkehr an `api.anthropic.com`, wird der Schnellmodus Anthropic-Service-Tiers zugeordnet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` zu `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Schnellmodus-Standard, wenn beide gesetzt sind. OpenClaw überspringt die Anthropic-Service-Tier-Injektion weiterhin für nicht-Anthropic-Proxy-Basis-URLs.
- `/status` zeigt `Fast` nur an, wenn der Schnellmodus aktiviert ist.

## Ausführliche Direktiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht, die nur aus der Direktive besteht, schaltet ausführliche Sitzungsprotokollierung um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Zustand zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie über die Sitzungs-UI, indem Sie `inherit` auswählen.
- Eine Inline-Direktive betrifft nur diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Ausführlichkeitsstufe anzuzeigen.
- Wenn ausführliche Protokollierung aktiviert ist, senden Agenten, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agenten), jeden Tool-Aufruf als eigene nur aus Metadaten bestehende Nachricht zurück, bei Verfügbarkeit (Pfad/Befehl) mit `<emoji> <tool-name>: <arg>` vorangestellt. Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Blasen), nicht als Streaming-Deltas.
- Zusammenfassungen von Tool-Fehlern bleiben im normalen Modus sichtbar, aber Rohfehlerdetails als Suffixe werden ausgeblendet, sofern die Ausführlichkeit nicht `on` oder `full` ist.
- Wenn die Ausführlichkeit `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Blase, auf eine sichere Länge gekürzt). Wenn Sie während eines laufenden Durchlaufs `/verbose on|full|off` umschalten, berücksichtigen nachfolgende Tool-Blasen die neue Einstellung.

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine Nachricht, die nur aus der Direktive besteht, schaltet Plugin-Trace-Ausgaben der Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive betrifft nur diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es legt nur Plugin-eigene Trace-/Debug-Zeilen offen, etwa Active Memory-Debug-Zusammenfassungen.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnosenachricht nach der normalen Assistentenantwort erscheinen.

## Reasoning-Sichtbarkeit (/reasoning)

- Stufen: `on|off|stream`.
- Eine Nachricht, die nur aus der Direktive besteht, schaltet um, ob Thinking-Blöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit vorangestelltem `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfsblase, während die Antwort erzeugt wird, und sendet anschließend die finale Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungsüberschreibung, dann Standard pro Agent (`agents.list[].reasoningDefault`), dann Fallback (`off`).

Fehlgeformte Reasoning-Tags lokaler Modelle werden konservativ behandelt. Geschlossene `<think>...</think>`-Blöcke bleiben in normalen Antworten verborgen, und nicht geschlossene Reasoning-Ausgaben nach bereits sichtbarem Text werden ebenfalls verborgen. Wenn eine Antwort vollständig in ein einzelnes nicht geschlossenes öffnendes Tag eingeschlossen ist und andernfalls als leerer Text ausgeliefert würde, entfernt OpenClaw das fehlgeformte öffnende Tag und liefert den verbleibenden Text aus.

## Verwandt

- Dokumentation zum erweiterten Modus befindet sich unter [Erweiterter Modus](/de/tools/elevated).

## Heartbeats

- Der Heartbeat-Prüftext ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie jedoch, Sitzungsstandards durch Heartbeats zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die finale Nutzlast. Um zusätzlich die separate `Reasoning:`-Nachricht zu senden (falls verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Webchat-UI

- Der Thinking-Auswahlschalter des Webchats spiegelt beim Laden der Seite die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration wider.
- Die Auswahl einer anderen Stufe schreibt die Sitzungsüberschreibung sofort über `sessions.patch`; sie wartet nicht auf das nächste Senden und ist keine einmalige `thinkingOnce`-Überschreibung.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standard aus dem Provider-Thinking-Profil des aktiven Sitzungsmodells plus derselben Fallback-Logik stammt, die `/status` und `session_status` verwenden.
- Der Auswahlschalter verwendet `thinkingLevels`, die von der Gateway-Sitzungszeile bzw. den Standards zurückgegeben werden, wobei `thinkingOptions` als Legacy-Labelliste beibehalten wird. Die Browser-UI führt keine eigene Provider-Regex-Liste; Plugins besitzen modellspezifische Stufenmengen.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und Auswahlschalter synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standardwert des Modells zu definieren.
- Provider-Plugins, die Claude-Modelle per Proxy bereitstellen, sollten `resolveClaudeThinkingProfile(modelId)` aus `openclaw/plugin-sdk/provider-model-shared` wiederverwenden, damit direkte Anthropic- und Proxy-Kataloge aufeinander abgestimmt bleiben.
- Jede Profilstufe hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann ein Anzeige-`label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Tool-Plugins, die eine explizite Denküberschreibung validieren müssen, sollten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` verwenden; sie sollten keine eigenen Provider-/Modell-Stufenlisten pflegen.
- Tool-Plugins mit Zugriff auf konfigurierte benutzerdefinierte Modellmetadaten können `catalog` an `resolveThinkingPolicy` übergeben, damit Opt-ins für `compat.supportedReasoningEfforts` in der Plugin-seitigen Validierung berücksichtigt werden.
- Veröffentlichte Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter erhalten, aber neue benutzerdefinierte Stufensätze sollten `resolveThinkingProfile` verwenden.
- Gateway-Zeilen/-Standardwerte stellen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` bereit, damit ACP-/Chat-Clients dieselben Profil-IDs und Labels darstellen, die auch die Laufzeitvalidierung verwendet.
