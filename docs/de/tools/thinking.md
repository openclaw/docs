---
read_when:
    - Anpassen von Parsing oder Standardwerten für Thinking-, Fast-Mode- oder Verbose-Direktiven
summary: Direktivensyntax für /think, /fast, /verbose, /trace und Sichtbarkeit des Reasonings
title: Denkstufen
x-i18n:
    generated_at: "2026-06-27T18:21:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cea488a92c6d2a5371dbe0488199f41a56b44616a2936b077644f8a8324e8129
    source_path: tools/thinking.md
    workflow: 16
---

## Funktion

- Inline-Direktive in jedem eingehenden Body: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „denken“
  - low → „intensiv denken“
  - medium → „noch intensiver denken“
  - high → „ultrathink“ (maximales Budget)
  - xhigh → „ultrathink+“ (GPT-5.2+ und Codex-Modelle, plus Anthropic Claude Opus 4.7+ Effort)
  - adaptive → Provider-verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7+ und Google Gemini Dynamic Thinking)
  - max → maximales Provider-Reasoning (Anthropic Claude Opus 4.7+; Ollama ordnet dies seinem höchsten nativen `think`-Effort zu)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden `xhigh` zugeordnet.
  - `highest` wird `high` zugeordnet.
- Provider-Hinweise:
  - Thinking-Menüs und Auswahlfelder werden durch Provider-Profile gesteuert. Provider-Plugins deklarieren den exakten Stufensatz für das ausgewählte Modell, einschließlich Labels wie dem binären `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Provider-/Modellprofile angezeigt, die sie unterstützen. Getippte Direktiven für nicht unterstützte Stufen werden mit den gültigen Optionen dieses Modells abgelehnt.
  - Vorhandene gespeicherte nicht unterstützte Stufen werden anhand des Provider-Profil-Rangs neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die größte unterstützte nicht auf `off` gesetzte Stufe für das ausgewählte Modell zurückfallen.
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Thinking-Stufe gesetzt ist.
  - Anthropic Claude Opus 4.8 und Opus 4.7 lassen Thinking deaktiviert, sofern Sie nicht explizit eine Thinking-Stufe setzen. Der Provider-eigene Effort-Standard von Opus 4.8 ist `high`, nachdem adaptives Thinking aktiviert wurde.
  - Anthropic Claude Opus 4.7+ ordnet `/think xhigh` adaptivem Thinking plus `output_config.effort: "xhigh"` zu, weil `/think` eine Thinking-Direktive ist und `xhigh` die Opus-Effort-Einstellung ist.
  - Anthropic Claude Opus 4.7+ stellt außerdem `/think max` bereit; es wird demselben Provider-eigenen Max-Effort-Pfad zugeordnet.
  - Direkte DeepSeek-V4-Modelle stellen `/think xhigh|max` bereit; beide werden DeepSeek `reasoning_effort: "max"` zugeordnet, während niedrigere nicht auf `off` gesetzte Stufen `high` zugeordnet werden.
  - Über OpenRouter geroutete DeepSeek-V4-Modelle stellen `/think xhigh` bereit und senden von OpenRouter unterstützte `reasoning_effort`-Werte. Gespeicherte `max`-Overrides fallen auf `xhigh` zurück.
  - Ollama-Modelle mit Thinking-Fähigkeit stellen `/think low|medium|high|max` bereit; `max` wird nativem `think: "high"` zugeordnet, weil Ollamas native API die Effort-Strings `low`, `medium` und `high` akzeptiert.
  - OpenAI-GPT-Modelle ordnen `/think` über die modellspezifische Effort-Unterstützung der Responses API zu. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw den deaktivierten Reasoning-Payload weg, statt einen nicht unterstützten Wert zu senden.
  - Benutzerdefinierte OpenAI-kompatible Katalogeinträge können `/think xhigh` aktivieren, indem sie `models.providers.<provider>.models[].compat.supportedReasoningEfforts` so setzen, dass `"xhigh"` enthalten ist. Dies nutzt dieselben Compat-Metadaten, die ausgehende OpenAI-Reasoning-Effort-Payloads zuordnen, sodass Menüs, Sitzungsvalidierung, Agent-CLI und `llm-task` mit dem Transportverhalten übereinstimmen.
  - Veraltete konfigurierte OpenRouter-Hunter-Alpha-Refs überspringen Proxy-Reasoning-Injektion, weil diese eingestellte Route finalen Antworttext über Reasoning-Felder zurückgeben konnte.
  - Google Gemini ordnet `/think adaptive` dem Provider-eigenen dynamischen Thinking von Gemini zu. Gemini-3-Anfragen lassen ein festes `thinkingLevel` weg, während Gemini-2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin dem nächstliegenden Gemini-`thinkingLevel` oder Budget für diese Modellfamilie zugeordnet.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Thinking nicht explizit in Modellparametern oder Anfrageparametern setzen. Dadurch werden geleakte `reasoning_content`-Deltas aus dem nicht nativen Anthropic-Stream-Format von M2.x vermieden. MiniMax-M3 (und M3.x) ist ausgenommen: M3 gibt korrekte Anthropic-Thinking-Blöcke aus und gibt leeren Inhalt zurück, wenn Thinking deaktiviert ist, daher belässt OpenClaw M3 auf dem weggelassenen/adaptiven Thinking-Pfad des Providers.
  - Z.AI (`zai/*`) ist für die meisten GLM-Modelle binär (`on`/`off`). GLM-5.2 ist die Ausnahme: Es stellt `/think off|low|high|max` bereit, ordnet `low` und `high` Z.AI `reasoning_effort: "high"` zu und ordnet `max` `reasoning_effort: "max"` zu.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) denkt immer. Sein Profil stellt nur `on` bereit, und OpenClaw lässt das ausgehende Feld `thinking` wie von Moonshot gefordert weg. Andere `moonshot/*`-Modelle ordnen `/think off` `thinking: { type: "disabled" }` und jede nicht auf `off` gesetzte Stufe `thinking: { type: "enabled" }` zu. Wenn Thinking aktiviert ist, akzeptiert Moonshot nur `tool_choice` `auto|none`; OpenClaw normalisiert inkompatible Werte zu `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungs-Override (gesetzt durch Senden einer reinen Direktiven-Nachricht).
3. Agent-spezifischer Standard (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: Provider-deklarierter Standard, sofern verfügbar; andernfalls werden Reasoning-fähige Modelle zu `medium` oder zur nächstliegenden unterstützten nicht auf `off` gesetzten Stufe für dieses Modell aufgelöst, und Modelle ohne Reasoning bleiben `off`.

## Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** die Direktive enthält (Leerraum erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender). Verwenden Sie `/think default`, um den Sitzungs-Override zu löschen und den konfigurierten/Provider-Standard zu erben; Aliasse sind `inherit`, `clear`, `reset` und `unpin`.
- `/think off` speichert einen expliziten Off-Override. Dadurch wird Thinking deaktiviert, bis Sie den Sitzungs-Override ändern oder löschen.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungsstatus bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Thinking-Stufe anzuzeigen.

## Anwendung nach Agent

- **Eingebettetes OpenClaw**: Die aufgelöste Stufe wird an die prozessinterne OpenClaw-Agent-Laufzeit übergeben.
- **Claude-CLI-Backend**: Nicht auf `off` gesetzte Stufen werden bei Verwendung von `claude-cli` als `--effort` an Claude Code übergeben; siehe [CLI-Backends](/de/gateway/cli-backends).

## Schneller Modus (/fast)

- Stufen: `auto|on|off|default`.
- Eine reine Direktiven-Nachricht schaltet einen Sitzungs-Override für den schnellen Modus um und antwortet mit `Fast mode set to auto.`, `Fast mode enabled.` oder `Fast mode disabled.`. Verwenden Sie `/fast default`, um den Sitzungs-Override zu löschen und den konfigurierten Standard zu erben; Aliasse sind `inherit`, `clear`, `reset` und `unpin`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuellen effektiven Status des schnellen Modus anzuzeigen.
- OpenClaw löst den schnellen Modus in dieser Reihenfolge auf:
  1. Inline-/reiner Direktiven-Override `/fast auto|on|off` (`/fast default` löscht diese Ebene)
  2. Sitzungs-Override
  3. Agent-spezifischer Standard (`agents.list[].fastModeDefault`)
  4. Modellbezogene Konfiguration: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `auto` behält den Sitzungs-/Konfigurationsmodus als auto bei, löst aber jeden neuen Modellaufruf unabhängig auf. Aufrufe, die vor dem Auto-Cutoff starten, haben den schnellen Modus aktiviert; spätere Retry-, Fallback-, Tool-Ergebnis- oder Fortsetzungsaufrufe starten mit deaktiviertem schnellen Modus. Der Cutoff beträgt standardmäßig 60 Sekunden; setzen Sie `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` am aktiven Modell, um ihn zu ändern.
- Für `openai/*` wird der schnelle Modus OpenAI Priority Processing zugeordnet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für Codex-gestützte `openai/*`- / `openai-codex/*`-Modelle sendet der schnelle Modus dasselbe Flag `service_tier=priority` bei Codex Responses. Native Codex-App-Server-Turns erhalten den Tier nur bei `turn/start` oder beim Start/Fortsetzen eines Threads, daher kann `auto` einen bereits laufenden App-Server-Turn nicht neu einstufen; es gilt für den nächsten Modell-Turn, den OpenClaw startet.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich OAuth-authentifizierten Datenverkehrs an `api.anthropic.com`, wird der schnelle Modus Anthropic-Service-Tiers zugeordnet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` zu `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-`serviceTier`- / `service_tier`-Modellparameter überschreiben den Standard des schnellen Modus, wenn beide gesetzt sind. OpenClaw überspringt weiterhin die Anthropic-Service-Tier-Injektion für nicht-Anthropic-Proxy-Basis-URLs.
- `/status` zeigt `Fast`, wenn der schnelle Modus aktiviert ist, und `Fast:auto`, wenn der konfigurierte Modus auto ist.

## Ausführliche Direktiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine reine Direktiven-Nachricht schaltet ausführliche Sitzungsausgabe um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Status zu ändern.
- `/verbose off` speichert einen expliziten Sitzungs-Override; löschen Sie ihn über die Sitzungs-UI, indem Sie `inherit` wählen.
- Autorisierte externe Kanalabsender dürfen den ausführlichen Sitzungs-Override persistent speichern. Interne Gateway-/Webchat-Clients benötigen `operator.admin`, um ihn persistent zu speichern.
- Eine Inline-Direktive wirkt nur auf diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Ausführlichkeitsstufe anzuzeigen.
- Wenn verbose aktiviert ist, senden Agents, die strukturierte Tool-Ergebnisse ausgeben, jeden Tool-Aufruf als eigene reine Metadaten-Nachricht zurück, wenn verfügbar mit dem Präfix `<emoji> <tool-name>: <arg>`. Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Bubbles), nicht als Streaming-Deltas.
- Tool-Fehlerzusammenfassungen bleiben im normalen Modus sichtbar, aber rohe Fehlerdetailsuffixe werden ausgeblendet, sofern verbose nicht `full` ist.
- Wenn verbose `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Bubble, auf eine sichere Länge gekürzt). Wenn Sie während eines laufenden Runs `/verbose on|full|off` umschalten, beachten nachfolgende Tool-Bubbles die neue Einstellung.
- `agents.defaults.toolProgressDetail` steuert die Form der `/verbose`-Tool-Zusammenfassungen und Tool-Zeilen in Fortschrittsentwürfen. Verwenden Sie `"explain"` (Standard) für kompakte menschliche Labels wie `🛠️ Exec: checking JS syntax`; verwenden Sie `"raw"`, wenn Sie zusätzlich den rohen Befehl/das rohe Detail zum Debugging anhängen möchten. Agent-spezifisches `agents.list[].toolProgressDetail` überschreibt den Standard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine reine Direktiven-Nachricht schaltet die Plugin-Trace-Ausgabe der Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive wirkt nur auf diese Nachricht; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es macht nur Plugin-eigene Trace-/Debug-Zeilen sichtbar, etwa Active-Memory-Debug-Zusammenfassungen.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnosenachricht nach der normalen Assistentenantwort erscheinen.

## Reasoning-Sichtbarkeit (/reasoning)

- Stufen: `on|off|stream`.
- Eine reine Direktiven-Nachricht schaltet um, ob Thinking-Blöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** gesendet, mit dem Präfix `Thinking`.
- `stream`: streamt Reasoning während der Generierung der Antwort, wenn der aktive Kanal Reasoning-Vorschauen unterstützt, und sendet anschließend die finale Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungs-Override, dann Agent-spezifischer Standard (`agents.list[].reasoningDefault`), dann globaler Standard (`agents.defaults.reasoningDefault`), dann Fallback (`off`).

Fehlerhafte Reasoning-Tags lokaler Modelle werden konservativ behandelt. Geschlossene `<think>...</think>`-Blöcke bleiben bei normalen Antworten verborgen, und nicht geschlossenes Reasoning nach bereits sichtbarem Text wird ebenfalls verborgen. Wenn eine Antwort vollständig in ein einzelnes nicht geschlossenes öffnendes Tag eingeschlossen ist und andernfalls als leerer Text ausgeliefert würde, entfernt OpenClaw das fehlerhafte öffnende Tag und liefert den verbleibenden Text aus.

## Verwandt

- Die Dokumentation zum erhöhten Modus finden Sie unter [Erhöhter Modus](/de/tools/elevated).

## Heartbeats

- Der Heartbeat-Prüftext ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Anweisungen in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie jedoch, Sitzungsstandards über Heartbeats zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die endgültige Nutzlast. Um zusätzlich die separate `Thinking`-Nachricht zu senden (falls verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Webchat-Benutzeroberfläche

- Der Thinking-Auswähler im Webchat spiegelt beim Laden der Seite die in der eingehenden Sitzungsspeicherung/Konfiguration gespeicherte Stufe der Sitzung wider.
- Wenn Sie eine andere Stufe auswählen, wird die Sitzungsüberschreibung sofort über `sessions.patch` geschrieben; sie wartet nicht auf den nächsten Sendevorgang und ist keine einmalige `thinkingOnce`-Überschreibung.
- Die erste Option ist immer die Auswahl zum Löschen der Überschreibung. Sie zeigt `Inherited: <resolved level>` an, einschließlich `Inherited: Off`, wenn vererbtes Thinking deaktiviert ist.
- Explizite Auswahlen im Auswähler verwenden ihre direkten Stufenbeschriftungen und behalten dabei Provider-Beschriftungen bei, sofern vorhanden (zum Beispiel `Maximum` für eine vom Provider beschriftete Option `max`).
- Der Auswähler verwendet `thinkingLevels`, die von der Gateway-Sitzungszeile beziehungsweise den Standards zurückgegeben werden, wobei `thinkingOptions` als veraltete Beschriftungsliste beibehalten wird. Die Browser-Benutzeroberfläche führt keine eigene Provider-Regex-Liste; Plugins besitzen modellspezifische Stufensätze.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Anweisungen und Auswähler synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standard des Modells zu definieren.
- Provider-Plugins, die Claude-Modelle als Proxy bereitstellen, sollten `resolveClaudeThinkingProfile(modelId)` aus `openclaw/plugin-sdk/provider-model-shared` wiederverwenden, damit direkte Anthropic-Kataloge und Proxy-Kataloge abgestimmt bleiben.
- Jede Profilstufe hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann eine Anzeige-`label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Profil-Hooks erhalten zusammengeführte Katalogfakten, sofern verfügbar, einschließlich `reasoning`, `compat.thinkingFormat` und `compat.supportedReasoningEfforts`. Verwenden Sie diese Fakten, um binäre oder benutzerdefinierte Profile nur dann bereitzustellen, wenn der konfigurierte Anforderungsvertrag die passende Nutzlast unterstützt.
- Tool-Plugins, die eine explizite Thinking-Überschreibung validieren müssen, sollten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` verwenden; sie sollten keine eigenen Provider-/Modell-Stufenlisten führen.
- Tool-Plugins mit Zugriff auf konfigurierte benutzerdefinierte Modellmetadaten können `catalog` an `resolveThinkingPolicy` übergeben, sodass Opt-ins über `compat.supportedReasoningEfforts` in der Plugin-seitigen Validierung berücksichtigt werden.
- Veröffentlichte Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter erhalten, aber neue benutzerdefinierte Stufensätze sollten `resolveThinkingProfile` verwenden.
- Gateway-Zeilen und -Standards stellen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` bereit, damit ACP-/Chat-Clients dieselben Profil-IDs und Beschriftungen rendern, die auch die Laufzeitvalidierung verwendet.
