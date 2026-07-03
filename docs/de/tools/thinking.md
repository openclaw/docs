---
read_when:
    - Anpassen der Direktivenanalyse oder Standardwerte für Denken, Schnellmodus oder ausführliche Ausgabe
summary: Direktivensyntax für /think, /fast, /verbose, /trace und Reasoning-Sichtbarkeit
title: Denkstufen
x-i18n:
    generated_at: "2026-07-03T09:31:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6383ac18fbef0d06a97df5c204d57829ae4993b8287f8ef60aeae197ea711722
    source_path: tools/thinking.md
    workflow: 16
---

## Was es macht

- Inline-Direktive in einem eingehenden Textkörper: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „denken“
  - low → „gründlich denken“
  - medium → „noch gründlicher denken“
  - high → „ultradenken“ (maximales Budget)
  - xhigh → „ultradenken+“ (GPT-5.2+ und Codex-Modelle sowie Anthropic-Claude-Opus-4.7+-Aufwand)
  - adaptive → vom Provider verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7+ und dynamisches Denken von Google Gemini)
  - max → maximales Reasoning des Providers (Anthropic Claude Opus 4.7+; Ollama ordnet dies seinem höchsten nativen `think`-Aufwand zu)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden `xhigh` zugeordnet.
  - `highest` wird `high` zugeordnet.
- Provider-Hinweise:
  - Denk-Menüs und Auswahlen werden durch Provider-Profile gesteuert. Provider-Plugins deklarieren die genaue Stufenauswahl für das ausgewählte Modell, einschließlich Labels wie binär `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Provider-/Modellprofile angezeigt, die sie unterstützen. Typisierte Direktiven für nicht unterstützte Stufen werden mit den gültigen Optionen dieses Modells abgewiesen.
  - Vorhandene gespeicherte nicht unterstützte Stufen werden anhand des Provider-Profilrangs neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die größte unterstützte Nicht-`off`-Stufe für das ausgewählte Modell zurückfallen.
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denkstufe festgelegt ist.
  - Anthropic Claude Opus 4.8 und Opus 4.7 lassen Denken deaktiviert, sofern Sie nicht explizit eine Denkstufe festlegen. Der providerseitige Standardaufwand von Opus 4.8 ist `high`, nachdem adaptives Denken aktiviert wurde.
  - Anthropic Claude Opus 4.7+ ordnet `/think xhigh` adaptivem Denken plus `output_config.effort: "xhigh"` zu, weil `/think` eine Denk-Direktive ist und `xhigh` die Opus-Aufwandseinstellung ist.
  - Anthropic Claude Opus 4.7+ stellt außerdem `/think max` bereit; es wird demselben providerseitigen Pfad für maximalen Aufwand zugeordnet.
  - Direkte DeepSeek-V4-Modelle stellen `/think xhigh|max` bereit; beide werden DeepSeek `reasoning_effort: "max"` zugeordnet, während niedrigere Nicht-`off`-Stufen `high` zugeordnet werden.
  - Über OpenRouter geroutete DeepSeek-V4-Modelle stellen `/think xhigh` bereit und senden von OpenRouter unterstützte `reasoning.effort`-Werte statt DeepSeek-nativem Top-Level-`reasoning_effort`. Niedrigere Nicht-`off`-Stufen werden `high` zugeordnet, und gespeicherte `max`-Overrides fallen auf `xhigh` zurück.
  - Ollama-Modelle mit Denkfähigkeit stellen `/think low|medium|high|max` bereit; `max` wird nativem `think: "high"` zugeordnet, weil Ollamas native API die Aufwandszeichenfolgen `low`, `medium` und `high` akzeptiert.
  - OpenAI-GPT-Modelle ordnen `/think` über die modellspezifische Aufwandunterstützung der Responses API zu. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Nutzlast weg, statt einen nicht unterstützten Wert zu senden.
  - Benutzerdefinierte OpenAI-kompatible Katalogeinträge können `/think xhigh` aktivieren, indem `models.providers.<provider>.models[].compat.supportedReasoningEfforts` so festgelegt wird, dass `"xhigh"` enthalten ist. Dies verwendet dieselben Kompatibilitätsmetadaten, die ausgehende OpenAI-Reasoning-Aufwandsnutzlasten zuordnen, sodass Menüs, Sitzungsvalidierung, Agent-CLI und `llm-task` mit dem Transportverhalten übereinstimmen.
  - Veraltete konfigurierte OpenRouter-Hunter-Alpha-Referenzen überspringen die Proxy-Reasoning-Injektion, weil diese eingestellte Route endgültigen Antworttext über Reasoning-Felder zurückgeben konnte.
  - Google Gemini ordnet `/think adaptive` Geminis providerseitigem dynamischem Denken zu. Gemini-3-Anfragen lassen ein festes `thinkingLevel` weg, während Gemini-2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin dem nächstliegenden Gemini-`thinkingLevel` oder Budget für diese Modellfamilie zugeordnet.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Denken nicht explizit in Modellparametern oder Anfrageparametern festlegen. Dies vermeidet durchgereichte `reasoning_content`-Deltas aus dem nicht nativen Anthropic-Streamformat von M2.x. MiniMax-M3 (und M3.x) ist ausgenommen: M3 gibt korrekte Anthropic-Denkblöcke aus und liefert leeren Inhalt zurück, wenn Denken deaktiviert ist, daher belässt OpenClaw M3 auf dem ausgelassenen/adaptiven Denkpfad des Providers.
  - Z.AI (`zai/*`) ist für die meisten GLM-Modelle binär (`on`/`off`). GLM-5.2 ist die Ausnahme: Es stellt `/think off|low|high|max` bereit, ordnet `low` und `high` Z.AI `reasoning_effort: "high"` zu und ordnet `max` `reasoning_effort: "max"` zu.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) denkt immer. Sein Profil stellt nur `on` bereit, und OpenClaw lässt das ausgehende Feld `thinking` weg, wie von Moonshot verlangt. Andere `moonshot/*`-Modelle ordnen `/think off` `thinking: { type: "disabled" }` und jede Nicht-`off`-Stufe `thinking: { type: "enabled" }` zu. Wenn Denken aktiviert ist, akzeptiert Moonshot für `tool_choice` nur `auto|none`; OpenClaw normalisiert inkompatible Werte auf `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungs-Override (durch Senden einer Nachricht, die nur eine Direktive enthält, festgelegt).
3. Standard pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: vom Provider deklarierter Standard, falls verfügbar; andernfalls werden Reasoning-fähige Modelle zu `medium` oder zur nächstliegenden unterstützten Nicht-`off`-Stufe für dieses Modell aufgelöst, und Modelle ohne Reasoning bleiben `off`.

## Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** die Direktive enthält (Leerraum ist erlaubt), z. B. `/think:medium` oder `/t high`.
- Dies bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender). Verwenden Sie `/think default`, um den Sitzungs-Override zu löschen und den konfigurierten bzw. Provider-Standard zu erben; Aliasse umfassen `inherit`, `clear`, `reset` und `unpin`.
- `/think off` speichert einen expliziten Aus-Override. Er deaktiviert Denken, bis Sie den Sitzungs-Override ändern oder löschen.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgewiesen, und der Sitzungsstatus bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Denkstufe anzuzeigen.

## Anwendung nach Agent

- **Eingebettetes OpenClaw**: Die aufgelöste Stufe wird an die prozessinterne OpenClaw-Agent-Laufzeit übergeben.
- **Claude-CLI-Backend**: Nicht-`off`-Stufen werden bei Verwendung von `claude-cli` als `--effort` an Claude Code übergeben; siehe [CLI-Backends](/de/gateway/cli-backends).

## Schneller Modus (/fast)

- Stufen: `auto|on|off|default`.
- Eine Nachricht, die nur eine Direktive enthält, schaltet einen Sitzungs-Override für den schnellen Modus um und antwortet mit `Fast mode set to auto.`, `Fast mode enabled.` oder `Fast mode disabled.`. Verwenden Sie `/fast default`, um den Sitzungs-Override zu löschen und den konfigurierten Standard zu erben; Aliasse umfassen `inherit`, `clear`, `reset` und `unpin`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuellen wirksamen Zustand des schnellen Modus anzuzeigen.
- OpenClaw löst den schnellen Modus in dieser Reihenfolge auf:
  1. Inline-/Direktive-nur-Override `/fast auto|on|off` (`/fast default` löscht diese Ebene)
  2. Sitzungs-Override
  3. Standard pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `auto` hält den Sitzungs-/Konfigurationsmodus auf auto, löst aber jeden neuen Modellaufruf unabhängig auf. Aufrufe, die vor dem Auto-Grenzwert starten, haben den schnellen Modus aktiviert; spätere Wiederholungs-, Fallback-, Tool-Ergebnis- oder Fortsetzungsaufrufe starten mit deaktiviertem schnellem Modus. Der Grenzwert beträgt standardmäßig 60 Sekunden; legen Sie `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` für das aktive Modell fest, um ihn zu ändern.
- Für `openai/*` wird der schnelle Modus OpenAI Priority Processing zugeordnet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für Codex-gestützte `openai/*`- / `openai-codex/*`-Modelle sendet der schnelle Modus dasselbe Flag `service_tier=priority` für Codex Responses. Native Codex-App-Server-Turns erhalten die Stufe nur bei `turn/start` oder Thread-Start/-Wiederaufnahme, daher kann `auto` einen bereits laufenden App-Server-Turn nicht neu einstufen; es gilt für den nächsten Modell-Turn, den OpenClaw startet.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich OAuth-authentifiziertem Traffic an `api.anthropic.com`, wird der schnelle Modus Anthropic-Service-Stufen zugeordnet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` zu `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Standard des schnellen Modus, wenn beide festgelegt sind. OpenClaw überspringt weiterhin die Anthropic-Service-Stufen-Injektion für Nicht-Anthropic-Proxy-Basis-URLs.
- `/status` zeigt `Fast`, wenn der schnelle Modus aktiviert ist, und `Fast:auto`, wenn der konfigurierte Modus auto ist.

## Ausführliche Direktiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht, die nur eine Direktive enthält, schaltet ausführliche Sitzungsausgaben um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Status zu ändern.
- `/verbose off` speichert einen expliziten Sitzungs-Override; löschen Sie ihn über die Sitzungs-UI, indem Sie `inherit` auswählen.
- Autorisierte Absender externer Kanäle können den ausführlichen Sitzungs-Override dauerhaft speichern. Interne Gateway-/Webchat-Clients benötigen `operator.admin`, um ihn dauerhaft zu speichern.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Ausführlichkeitsstufe anzuzeigen.
- Wenn ausführliche Ausgabe aktiviert ist, senden Agents, die strukturierte Tool-Ergebnisse ausgeben, jeden Tool-Aufruf als eigene reine Metadaten-Nachricht zurück, nach Möglichkeit mit Präfix `<emoji> <tool-name>: <arg>`. Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Sprechblasen), nicht als Streaming-Deltas.
- Tool-Fehlerzusammenfassungen bleiben im normalen Modus sichtbar, aber Rohfehlerdetail-Suffixe werden ausgeblendet, sofern die Ausführlichkeit nicht `full` ist.
- Wenn die Ausführlichkeit `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Sprechblase, auf eine sichere Länge gekürzt). Wenn Sie `/verbose on|full|off` umschalten, während ein Lauf aktiv ist, beachten nachfolgende Tool-Sprechblasen die neue Einstellung.
- `agents.defaults.toolProgressDetail` steuert die Form von `/verbose`-Tool-Zusammenfassungen und Tool-Zeilen in Fortschrittsentwürfen. Verwenden Sie `"explain"` (Standard) für kompakte menschenlesbare Labels wie `🛠️ Exec: checking JS syntax`; verwenden Sie `"raw"`, wenn Sie zusätzlich den rohen Befehl bzw. das Detail zur Fehlersuche angehängt haben möchten. `agents.list[].toolProgressDetail` pro Agent überschreibt den Standard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine Nachricht, die nur eine Direktive enthält, schaltet die Plugin-Trace-Ausgabe der Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; andernfalls gelten Sitzungs-/globale Standards.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es macht nur Plugin-eigene Trace-/Debug-Zeilen sichtbar, etwa Active-Memory-Debug-Zusammenfassungen.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnosenachricht nach der normalen Assistentenantwort erscheinen.

## Reasoning-Sichtbarkeit (/reasoning)

- Stufen: `on|off|stream`.
- Eine Nachricht, die nur eine Direktive enthält, schaltet um, ob Denkblöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit Präfix `Thinking` gesendet.
- `stream`: streamt Reasoning, während die Antwort generiert wird, wenn der aktive Kanal Reasoning-Vorschauen unterstützt, und sendet anschließend die endgültige Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungs-Override, dann Standard pro Agent (`agents.list[].reasoningDefault`), dann globaler Standard (`agents.defaults.reasoningDefault`), dann Fallback (`off`).

Fehlerhafte Reasoning-Tags lokaler Modelle werden konservativ behandelt. Geschlossene `<think>...</think>`-Blöcke bleiben bei normalen Antworten verborgen, und nicht geschlossene Reasoning-Abschnitte nach bereits sichtbarem Text werden ebenfalls verborgen. Wenn eine Antwort vollständig von einem einzelnen nicht geschlossenen öffnenden Tag umschlossen ist und sonst als leerer Text ausgeliefert würde, entfernt OpenClaw das fehlerhafte öffnende Tag und liefert den verbleibenden Text aus.

## Verwandt

- Die Dokumentation zum erhöhten Modus finden Sie unter [Erhöhter Modus](/de/tools/elevated).

## Heartbeats

- Der Body der Heartbeat-Prüfung ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Anweisungen in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie jedoch, Sitzungsstandardwerte über Heartbeats zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die finale Nutzlast. Um zusätzlich die separate `Thinking`-Nachricht zu senden (sofern verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Webchat-Benutzeroberfläche

- Die Thinking-Auswahl im Webchat spiegelt beim Laden der Seite die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration wider.
- Das Auswählen einer anderen Stufe schreibt die Sitzungsüberschreibung sofort über `sessions.patch`; es wartet nicht auf den nächsten Sendevorgang und ist keine einmalige `thinkingOnce`-Überschreibung.
- Die erste Option ist immer die Auswahl zum Löschen der Überschreibung. Sie zeigt `Inherited: <resolved level>`, einschließlich `Inherited: Off`, wenn geerbtes Thinking deaktiviert ist.
- Explizite Auswahloptionen verwenden ihre direkten Stufenbezeichnungen und behalten vorhandene Provider-Bezeichnungen bei (zum Beispiel `Maximum` für eine vom Provider bezeichnete `max`-Option).
- Die Auswahl verwendet `thinkingLevels`, die von der Gateway-Sitzungszeile bzw. den Standardwerten zurückgegeben werden, während `thinkingOptions` als Legacy-Bezeichnungsliste beibehalten wird. Die Browser-Benutzeroberfläche führt keine eigene Regex-Liste für Provider; Plugins besitzen modellspezifische Stufensätze.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Anweisungen und Auswahl synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die vom Modell unterstützten Stufen und den Standard zu definieren.
- Provider-Plugins, die Claude-Modelle per Proxy bereitstellen, sollten `resolveClaudeThinkingProfile(modelId)` aus `openclaw/plugin-sdk/provider-model-shared` wiederverwenden, damit direkte Anthropic-Kataloge und Proxy-Kataloge abgestimmt bleiben.
- Jede Profilstufe hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann ein Anzeige-`label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Profil-Hooks erhalten zusammengeführte Katalogfakten, sofern verfügbar, einschließlich `reasoning`, `compat.thinkingFormat` und `compat.supportedReasoningEfforts`. Verwenden Sie diese Fakten, um binäre oder benutzerdefinierte Profile nur offenzulegen, wenn der konfigurierte Anfragevertrag die passende Nutzlast unterstützt.
- Tool-Plugins, die eine explizite Thinking-Überschreibung validieren müssen, sollten `api.runtime.agent.resolveThinkingPolicy({ provider, model })` plus `api.runtime.agent.normalizeThinkingLevel(...)` verwenden; sie sollten keine eigenen Provider-/Modell-Stufenlisten führen.
- Tool-Plugins mit Zugriff auf konfigurierte benutzerdefinierte Modellmetadaten können `catalog` an `resolveThinkingPolicy` übergeben, damit Opt-ins über `compat.supportedReasoningEfforts` in der Plugin-seitigen Validierung berücksichtigt werden.
- Veröffentlichte Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter erhalten, neue benutzerdefinierte Stufensätze sollten jedoch `resolveThinkingProfile` verwenden.
- Gateway-Zeilen und -Standardwerte stellen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` bereit, damit ACP-/Chat-Clients dieselben Profil-IDs und Bezeichnungen darstellen, die auch die Laufzeitvalidierung verwendet.
