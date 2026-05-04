---
read_when:
    - Anpassen der Auswertung oder Standardwerte für Denkmodus-, Schnellmodus- oder Ausführlichkeitsdirektiven
summary: Direktivensyntax für /think, /fast, /verbose, /trace und die Sichtbarkeit der Denkprozesse
title: Denkstufen
x-i18n:
    generated_at: "2026-05-04T18:24:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: fcd1cd76ca5d0b08656e0629df656ad8aa037201d8de68093b3e46eb0708f811
    source_path: tools/thinking.md
    workflow: 16
---

## Funktionsweise

- Inline-Direktive in einem beliebigen eingehenden Inhalt: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „denken“
  - low → „gründlich denken“
  - medium → „noch gründlicher denken“
  - high → „ultradenken“ (maximales Budget)
  - xhigh → „ultradenken+“ (GPT-5.2+ und Codex-Modelle sowie Anthropic Claude Opus 4.7-Aufwand)
  - adaptive → Provider-verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7 und dynamisches Denken von Google Gemini)
  - max → maximales Provider-Reasoning (Anthropic Claude Opus 4.7; Ollama ordnet dies seinem höchsten nativen `think`-Aufwand zu)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden `xhigh` zugeordnet.
  - `highest` wird `high` zugeordnet.
- Provider-Hinweise:
  - Denken-Menüs und Auswahlfelder werden vom Provider-Profil gesteuert. Provider-Plugins deklarieren den exakten Stufensatz für das ausgewählte Modell, einschließlich Labels wie binärem `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Provider-/Modellprofile angezeigt, die sie unterstützen. Eingegebene Direktiven für nicht unterstützte Stufen werden mit den gültigen Optionen dieses Modells zurückgewiesen.
  - Vorhandene gespeicherte nicht unterstützte Stufen werden anhand der Rangfolge des Provider-Profils neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die größte unterstützte nicht-`off`-Stufe für das ausgewählte Modell zurückfallen.
  - Anthropic Claude 4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denkstufe festgelegt ist.
  - Anthropic Claude Opus 4.7 verwendet nicht standardmäßig adaptives Denken. Sein API-Effort-Standardwert bleibt Provider-eigen, sofern Sie nicht explizit eine Denkstufe festlegen.
  - Anthropic Claude Opus 4.7 ordnet `/think xhigh` adaptivem Denken plus `output_config.effort: "xhigh"` zu, weil `/think` eine Denken-Direktive ist und `xhigh` die Opus 4.7-Effort-Einstellung ist.
  - Anthropic Claude Opus 4.7 stellt außerdem `/think max` bereit; es wird demselben Provider-eigenen maximalen Effort-Pfad zugeordnet.
  - DeepSeek V4-Modelle stellen `/think xhigh|max` bereit; beide werden DeepSeek `reasoning_effort: "max"` zugeordnet, während niedrigere nicht-`off`-Stufen `high` zugeordnet werden.
  - Denkfähige Ollama-Modelle stellen `/think low|medium|high|max` bereit; `max` wird nativem `think: "high"` zugeordnet, weil Ollamas native API die Effort-Strings `low`, `medium` und `high` akzeptiert.
  - OpenAI-GPT-Modelle ordnen `/think` über die modellspezifische Effort-Unterstützung der Responses API zu. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Nutzlast weg, statt einen nicht unterstützten Wert zu senden.
  - Benutzerdefinierte OpenAI-kompatible Katalogeinträge können `/think xhigh` aktivieren, indem `models.providers.<provider>.models[].compat.supportedReasoningEfforts` so gesetzt wird, dass es `"xhigh"` enthält. Dies verwendet dieselben Kompatibilitätsmetadaten, die ausgehende OpenAI-Reasoning-Effort-Nutzlasten zuordnen, sodass Menüs, Sitzungsvalidierung, Agent-CLI und `llm-task` mit dem Transportverhalten übereinstimmen.
  - Veraltete konfigurierte OpenRouter Hunter Alpha-Refs überspringen die Proxy-Reasoning-Injektion, weil diese eingestellte Route finalen Antworttext über Reasoning-Felder zurückgeben konnte.
  - Google Gemini ordnet `/think adaptive` dem Provider-eigenen dynamischen Denken von Gemini zu. Gemini 3-Anfragen lassen ein festes `thinkingLevel` weg, während Gemini 2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin der nächstliegenden Gemini-`thinkingLevel`- oder Budget-Einstellung für diese Modellfamilie zugeordnet.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Denken nicht explizit in Modellparametern oder Anfrageparametern festlegen. Dadurch werden ungewollt weitergeleitete `reasoning_content`-Deltas aus dem nicht nativen Anthropic-Stream-Format von MiniMax vermieden.
  - Z.AI (`zai/*`) unterstützt nur binäres Denken (`on`/`off`). Jede nicht-`off`-Stufe wird als `on` behandelt (`low` zugeordnet).
  - Moonshot (`moonshot/*`) ordnet `/think off` `thinking: { type: "disabled" }` zu und jede nicht-`off`-Stufe `thinking: { type: "enabled" }`. Wenn Denken aktiviert ist, akzeptiert Moonshot nur `tool_choice` `auto|none`; OpenClaw normalisiert inkompatible Werte zu `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (durch Senden einer Nachricht, die nur aus einer Direktive besteht).
3. Standard pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: Provider-deklarierter Standardwert, wenn verfügbar; andernfalls werden Reasoning-fähige Modelle zu `medium` oder zur nächstliegenden unterstützten nicht-`off`-Stufe für dieses Modell aufgelöst, und nicht Reasoning-fähige Modelle bleiben `off`.

## Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** aus der Direktive besteht (Leerraum ist erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender); gelöscht durch `/think:off` oder eine Leerlauf-Zurücksetzung der Sitzung.
- Es wird eine Bestätigungsantwort gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis zurückgewiesen und der Sitzungszustand bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Denkstufe anzuzeigen.

## Anwendung pro Agent

- **Eingebettetes Pi**: Die aufgelöste Stufe wird an die prozessinterne Pi-Agent-Laufzeit übergeben.
- **Claude-CLI-Backend**: Nicht-`off`-Stufen werden bei Verwendung von `claude-cli` als `--effort` an Claude Code übergeben; siehe [CLI-Backends](/de/gateway/cli-backends).

## Schnellmodus (/fast)

- Stufen: `on|off`.
- Eine Direktive-only-Nachricht schaltet eine Sitzungsüberschreibung für den Schnellmodus um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuell wirksamen Schnellmodus-Zustand anzuzeigen.
- OpenClaw löst den Schnellmodus in dieser Reihenfolge auf:
  1. Inline-/Direktive-only `/fast on|off`
  2. Sitzungsüberschreibung
  3. Standard pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der Schnellmodus OpenAI-Prioritätsverarbeitung zugeordnet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Schnellmodus dasselbe Flag `service_tier=priority` bei Codex Responses. OpenClaw behält einen gemeinsamen `/fast`-Schalter für beide Authentifizierungspfade bei.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich per OAuth authentifiziertem Traffic an `api.anthropic.com`, wird der Schnellmodus Anthropic-Service-Tiers zugeordnet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` zu `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Schnellmodus-Standardwert, wenn beide gesetzt sind. OpenClaw überspringt weiterhin die Anthropic-Service-Tier-Injektion für nicht-Anthropic-Proxy-Basis-URLs.
- `/status` zeigt `Fast` nur an, wenn der Schnellmodus aktiviert ist.

## Ausführliche Direktiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Direktive-only-Nachricht schaltet die ausführliche Sitzungsprotokollierung um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Zustand zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie über die Sessions-UI, indem Sie `inherit` wählen.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Ausführlichkeitsstufe anzuzeigen.
- Wenn verbose aktiviert ist, senden Agents, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agents), jeden Tool-Aufruf als eigene Nur-Metadaten-Nachricht zurück, mit dem Präfix `<emoji> <tool-name>: <arg>`, wenn verfügbar. Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Nachrichtenblasen), nicht als Streaming-Deltas.
- Tool-Fehlerzusammenfassungen bleiben im Normalmodus sichtbar, aber Rohdetails zu Fehlern als Suffixe werden ausgeblendet, sofern verbose nicht `on` oder `full` ist.
- Wenn verbose `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Nachrichtenblase, auf eine sichere Länge gekürzt). Wenn Sie `/verbose on|full|off` umschalten, während ein Lauf läuft, beachten nachfolgende Tool-Nachrichtenblasen die neue Einstellung.
- `agents.defaults.toolProgressDetail` steuert die Form der `/verbose`-Tool-Zusammenfassungen und Tool-Zeilen in Fortschrittsentwürfen. Verwenden Sie `"explain"` (Standard) für kompakte menschliche Labels wie `🛠️ Exec: checking JS syntax`; verwenden Sie `"raw"`, wenn Sie außerdem den rohen Befehl bzw. das rohe Detail zum Debuggen anhängen möchten. `agents.list[].toolProgressDetail` pro Agent überschreibt den Standard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine Direktive-only-Nachricht schaltet die Plugin-Trace-Ausgabe der Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es legt nur Plugin-eigene Trace-/Debug-Zeilen offen, z. B. Active Memory-Debug-Zusammenfassungen.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnosenachricht nach der normalen Assistant-Antwort erscheinen.

## Reasoning-Sichtbarkeit (/reasoning)

- Stufen: `on|off|stream`.
- Eine Direktive-only-Nachricht schaltet um, ob Denkblöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit dem Präfix `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfsblase, während die Antwort generiert wird, und sendet danach die finale Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungsüberschreibung, dann Standard pro Agent (`agents.list[].reasoningDefault`), dann Fallback (`off`).

Fehlerhafte Reasoning-Tags lokaler Modelle werden konservativ behandelt. Geschlossene <think>...</think>-Blöcke bleiben bei normalen Antworten ausgeblendet, und nicht geschlossenes Reasoning nach bereits sichtbarem Text wird ebenfalls ausgeblendet. Wenn eine Antwort vollständig in ein einzelnes nicht geschlossenes öffnendes Tag eingeschlossen ist und andernfalls als leerer Text ausgeliefert würde, entfernt OpenClaw das fehlerhafte öffnende Tag und liefert den verbleibenden Text aus.

## Siehe auch

- Die Dokumentation zum erhöhten Modus finden Sie unter [Erhöhter Modus](/de/tools/elevated).

## Heartbeats

- Der Inhalt der Heartbeat-Prüfung ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie gewohnt (vermeiden Sie jedoch, Sitzungsstandards aus Heartbeats heraus zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die finale Nutzlast. Um zusätzlich die separate Nachricht `Reasoning:` zu senden (wenn verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Webchat-UI

- Die Denken-Auswahl im Webchat spiegelt beim Laden der Seite die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration wider.
- Wenn Sie eine andere Stufe auswählen, wird die Sitzungsüberschreibung sofort per `sessions.patch` geschrieben; sie wartet nicht auf das nächste Senden und ist keine einmalige `thinkingOnce`-Überschreibung.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standard aus dem Provider-Denkprofil des aktiven Sitzungsmodells plus derselben Fallback-Logik stammt, die `/status` und `session_status` verwenden.
- Das Auswahlfeld verwendet `thinkingLevels`, die von der Gateway-Sitzungszeile bzw. den Standardwerten zurückgegeben werden, wobei `thinkingOptions` als Legacy-Label-Liste beibehalten wird. Die Browser-UI hält keine eigene Provider-Regex-Liste vor; Plugins besitzen modellspezifische Stufensätze.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und Auswahlfeld synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standardwert des Modells zu definieren.
- Provider-Plugins, die Claude-Modelle per Proxy weiterleiten, sollten `resolveClaudeThinkingProfile(modelId)` aus `openclaw/plugin-sdk/provider-model-shared` wiederverwenden, damit direkte Anthropic- und Proxy-Kataloge abgestimmt bleiben.
- Jede Profilstufe hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann ein Anzeige-`label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Tool-Plugins, die eine explizite Thinking-Überschreibung validieren müssen, sollten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` verwenden; sie sollten keine eigenen Provider-/Modell-Stufenlisten pflegen.
- Tool-Plugins mit Zugriff auf konfigurierte benutzerdefinierte Modellmetadaten können `catalog` an `resolveThinkingPolicy` übergeben, damit Opt-ins für `compat.supportedReasoningEfforts` in der Plugin-seitigen Validierung berücksichtigt werden.
- Veröffentlichte Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter bestehen, aber neue benutzerdefinierte Stufensätze sollten `resolveThinkingProfile` verwenden.
- Gateway-Zeilen/-Standardwerte stellen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` bereit, damit ACP-/Chat-Clients dieselben Profil-IDs und Labels rendern, die auch die Laufzeitvalidierung verwendet.
