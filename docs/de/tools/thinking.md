---
read_when:
    - Anpassen der Direktivenanalyse oder der Standardwerte für Thinking, Fast Mode oder Verbose Mode
summary: Direktivsyntax für /think, /fast, /verbose, /trace und die Sichtbarkeit von Schlussfolgerungen
title: Denkstufen
x-i18n:
    generated_at: "2026-07-24T04:13:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 80968ce58f642090ba0f807874e43eea1206cd31d919414c690b7537dc523658
    source_path: tools/thinking.md
    workflow: 16
---

## Funktionsweise

- Inline-Direktive in einem beliebigen eingehenden Nachrichtentext: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, ungefähr entsprechend Anthropics klassischer Zauberwort-Abstufung „think“ < „think hard“ < „think harder“ < „ultrathink“:
  - minimal ~ „think“
  - low ~ „think hard“
  - medium ~ „think harder“
  - high ~ „ultrathink“ (maximales Budget)
  - xhigh ~ „ultrathink+“ (GPT-5.2+- und Codex-Modelle sowie Anthropic Claude Opus 4.7+-Effort)
  - adaptive → vom Provider verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7+ und dynamisches Denken von Google Gemini)
  - max → maximale Reasoning-Stufe des Providers (Anthropic Claude Opus 4.7+; Ollama ordnet dies seinem höchsten nativen `think`-Effort zu)
  - ultra → maximale Reasoning-Stufe des Providers plus proaktive Sub-Agent-Orchestrierung, sofern das ausgewählte Modell bzw. die ausgewählte Runtime dies unterstützt
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden `xhigh` zugeordnet.
  - `highest` wird `high` zugeordnet.
- Hinweise zu Providern:
  - Thinking-Menüs und Auswahlfelder werden durch das Provider-Profil gesteuert. Provider-Plugins deklarieren die genaue Stufenmenge für das ausgewählte Modell, einschließlich Bezeichnungen wie dem binären `on`.
  - `adaptive`, `xhigh`, `max` und `ultra` werden nur für Provider-/Modell-/Runtime-Profile angeboten, die sie unterstützen. Eingegebene Direktiven für nicht unterstützte Stufen werden mit den gültigen Optionen des jeweiligen Modells abgelehnt.
  - Vorhandene gespeicherte, nicht unterstützte Stufen werden anhand des Provider-Profilrangs neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die höchste unterstützte, nicht deaktivierte Stufe des ausgewählten Modells zurückfallen.
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine ausdrückliche Thinking-Stufe festgelegt ist.
  - Bei Anthropic Claude Opus 4.8 und Opus 4.7 bleibt Thinking deaktiviert, sofern Sie nicht ausdrücklich eine Thinking-Stufe festlegen. Der vom Provider vorgegebene Effort-Standardwert von Opus 4.8 ist `high`, nachdem adaptives Denken aktiviert wurde.
  - Anthropic Claude Opus 4.7+ ordnet `/think xhigh` adaptivem Denken plus `output_config.effort: "xhigh"` zu, da `/think` eine Thinking-Direktive und `xhigh` die Effort-Einstellung von Opus ist.
  - Anthropic Claude Opus 4.7+ stellt außerdem `/think max` bereit; es wird demselben vom Provider verwalteten Pfad für maximalen Effort zugeordnet.
  - Direkte DeepSeek-V4-Modelle stellen `/think xhigh|max` bereit; beide werden DeepSeek `reasoning_effort: "max"` zugeordnet, während niedrigere, nicht deaktivierte Stufen `high` zugeordnet werden.
  - Über OpenRouter geroutete DeepSeek-V4-Modelle stellen `/think xhigh` bereit und senden von OpenRouter unterstützte `reasoning.effort`-Werte anstelle des nativen DeepSeek-Top-Level-Felds `reasoning_effort`. Niedrigere, nicht deaktivierte Stufen werden `high` zugeordnet, und gespeicherte `max`-Überschreibungen fallen auf `xhigh` zurück.
  - Thinking-fähige Ollama-Modelle stellen `/think low|medium|high|max` bereit; `max` wird dem nativen `think: "high"` zugeordnet, da die native Ollama-API die Effort-Zeichenfolgen `low`, `medium` und `high` akzeptiert.
  - OpenAI-GPT-Modelle ordnen `/think` über die modellspezifische Effort-Unterstützung der Responses API zu. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Nutzlast weg, statt einen nicht unterstützten Wert zu senden.
  - GPT-5.6 Sol und Terra stellen natives `/think ultra` über die Codex-Runtime bereit. GPT-5.6 Luna stellt Stufen bis einschließlich `max` bereit, da sein Codex-Katalog Ultra nicht ausweist.
  - Die eingebettete OpenClaw-Runtime stellt logisches `/think ultra` für GPT-5.6 Sol, Terra und Luna bereit. Sie sendet den maximalen Effort des Providers und ergänzt laufbezogene Anweisungen zur proaktiven Sub-Agent-Orchestrierung.
  - Benutzerdefinierte OpenAI-kompatible Katalogeinträge können `/think xhigh` aktivieren, indem `models.providers.<provider>.models[].compat.supportedReasoningEfforts` so festgelegt wird, dass es `"xhigh"` enthält. Dabei werden dieselben Kompatibilitätsmetadaten verwendet, die ausgehende OpenAI-Reasoning-Effort-Nutzlasten zuordnen, sodass Menüs, Sitzungsvalidierung, Agent-CLI und `llm-task` mit dem Transportverhalten übereinstimmen.
  - Veraltete konfigurierte OpenRouter-Hunter-Alpha-Referenzen überspringen die Proxy-Reasoning-Injektion, da diese eingestellte Route endgültigen Antworttext über Reasoning-Felder zurückgeben konnte.
  - Google Gemini ordnet `/think adaptive` dem vom Provider verwalteten dynamischen Denken von Gemini zu. Gemini-3-Anfragen lassen ein festes `thinkingLevel` weg, während Gemini-2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin dem nächstgelegenen Gemini-`thinkingLevel` oder Budget der jeweiligen Modellfamilie zugeordnet.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) verwendet auf dem Anthropic-kompatiblen Streaming-Pfad standardmäßig `thinking: { type: "disabled" }`, sofern Sie Thinking nicht ausdrücklich in Modell- oder Anfrageparametern festlegen. Dadurch werden durchgesickerte `reasoning_content`-Deltas aus dem nicht nativen Anthropic-Streamformat von M2.x vermieden. MiniMax-M3 (und M3.x) ist davon ausgenommen: M3 gibt korrekte Anthropic-Thinking-Blöcke aus und liefert bei deaktiviertem Thinking leeren Inhalt zurück, daher belässt OpenClaw M3 auf dem Pfad des Providers für ausgelassenes/adaptives Denken.
  - Z.AI (`zai/*`) ist für die meisten GLM-Modelle binär (`on`/`off`). GLM-5.2 ist die Ausnahme: Es stellt `/think off|low|high|max` bereit, ordnet `low` und `high` Z.AI `reasoning_effort: "high"` sowie `max` dem Wert `reasoning_effort: "max"` zu.
  - Moonshot API Kimi K3 (`moonshot/kimi-k3`) denkt immer mit `max`, sendet `reasoning_effort: "max"`, lässt das K2-Feld `thinking` und feste Sampling-Überschreibungen weg und bewahrt die von K3 unterstützten Werkzeugauswahlen. Kimi Code K3 (`kimi/k3` und `kimi/k3[1m]`) stellt `/think off|max` bereit: Bei deaktiviertem Zustand wird `thinking.type: "disabled"` gesendet, während die Maximalstufe adaptives Denken mit maximalem Effort sendet. Aktuelle Kimi-Code-Referenzen umfassen außerdem `kimi/kimi-for-coding` und `kimi/kimi-for-coding-highspeed`. Kimi K2.7 Code (`moonshot/kimi-k2.7-code` und `moonshot/kimi-k2.7-code-highspeed`) denkt immer, stellt nur `on` bereit und lässt sowohl ausgehendes `thinking` als auch `reasoning_effort` weg. Andere `moonshot/*`-Modelle ordnen `/think off` dem Wert `thinking: { type: "disabled" }` und jede nicht auf `off` gesetzte Stufe dem Wert `thinking: { type: "enabled" }` zu. Wenn K2-Thinking aktiviert ist, akzeptiert Moonshot nur `tool_choice` `auto|none`; OpenClaw normalisiert inkompatible Werte auf `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (durch Senden einer Nachricht festgelegt, die nur eine Direktive enthält).
3. Agent-spezifischer Standardwert (`agents.entries.*.thinkingDefault` in der Konfiguration).
4. Globaler Standardwert (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: vom Provider deklarierter Standardwert, sofern verfügbar; andernfalls werden Reasoning-fähige Modelle auf `medium` oder die nächstgelegene unterstützte, nicht auf `off` gesetzte Stufe des jeweiligen Modells aufgelöst, während Modelle ohne Reasoning-Fähigkeit auf `off` bleiben.

## Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** die Direktive enthält (Leerraum ist zulässig), z. B. `/think:medium` oder `/t high`.
- Diese Einstellung bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender). Verwenden Sie `/think default`, um die Sitzungsüberschreibung zu löschen und den konfigurierten Standardwert bzw. den Standardwert des Providers zu übernehmen; zu den Aliassen gehören `inherit`, `clear`, `reset` und `unpin`.
- `/think off` speichert eine ausdrückliche Deaktivierungsüberschreibung. Dadurch wird Thinking deaktiviert, bis Sie die Sitzungsüberschreibung ändern oder löschen.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungsstatus bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Thinking-Stufe anzuzeigen.

## Anwendung nach Agent

- **Eingebettetes OpenClaw**: Die aufgelöste Stufe wird an die prozessinterne OpenClaw-Agent-Runtime übergeben.
- **Claude-CLI-Backend**: Konkrete, nicht deaktivierte Stufen werden bei Verwendung von `claude-cli` als `--effort` an Claude Code übergeben; `adaptive` entfernt konfigurierte Effort-Flags und überlässt den effektiven Effort der Umgebung, den Einstellungen und den Modellstandardwerten von Claude Code. Siehe [CLI-Backends](/de/gateway/cli-backends).

## Schnellmodus (/fast)

- Stufen: `auto|on|off|default`.
- Eine Nachricht, die nur die Direktive enthält, schaltet eine Sitzungsüberschreibung für den Schnellmodus um und antwortet mit `Fast mode set to auto.`, `Fast mode enabled.` oder `Fast mode disabled.`. Verwenden Sie `/fast default`, um die Sitzungsüberschreibung zu löschen und den konfigurierten Standardwert zu übernehmen; zu den Aliassen gehören `inherit`, `clear`, `reset` und `unpin`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuellen effektiven Schnellmodusstatus anzuzeigen.
- OpenClaw löst den Schnellmodus in dieser Reihenfolge auf:
  1. Inline-/Nur-Direktive-Überschreibung `/fast auto|on|off` (`/fast default` löscht diese Ebene)
  2. Sitzungsüberschreibung
  3. Agent-spezifischer Standardwert (`agents.entries.*.fastModeDefault`)
  4. Modellspezifische Konfiguration: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- `auto` behält den Sitzungs-/Konfigurationsmodus als automatisch bei, löst jedoch jeden neuen Modellaufruf unabhängig auf. Bei Aufrufen, die vor dem automatischen Grenzwert beginnen, ist der Schnellmodus aktiviert; spätere Wiederholungs-, Fallback-, Werkzeugergebnis- oder Fortsetzungsaufrufe beginnen mit deaktiviertem Schnellmodus. Der Grenzwert beträgt standardmäßig 60 Sekunden; legen Sie `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` für das aktive Modell fest, um ihn zu ändern.
- Für `openai/*` wird der Schnellmodus dem priorisierten OpenAI-Processing zugeordnet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Bei Codex-basierten `openai/*`- / `openai-codex/*`-Modellen sendet der Schnellmodus dasselbe `service_tier=priority`-Flag bei Codex Responses. Native Codex-App-Server-Turns erhalten die Stufe nur bei `turn/start` oder beim Starten/Fortsetzen eines Threads, daher kann `auto` einen bereits laufenden App-Server-Turn nicht neu einstufen; die Einstellung gilt für den nächsten von OpenClaw gestarteten Modell-Turn.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich OAuth-authentifiziertem Datenverkehr an `api.anthropic.com`, wird der Schnellmodus Anthropic-Service-Stufen zugeordnet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Schnellmodus-Standardwert, wenn beide festgelegt sind. OpenClaw überspringt die Injektion der Anthropic-Service-Stufe weiterhin bei Proxy-Basis-URLs, die nicht zu Anthropic gehören.
- `/status` zeigt `Fast` an, wenn der Schnellmodus aktiviert ist, und `Fast:auto`, wenn der konfigurierte Modus automatisch ist.

## Ausführliche Direktiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht, die nur eine Direktive enthält, schaltet die ausführliche Ausgabe der Sitzung um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Zustand zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie über die Sitzungsoberfläche, indem Sie `inherit` auswählen.
- Autorisierte Absender externer Kanäle können die Überschreibung der ausführlichen Sitzungsausgabe dauerhaft speichern. Interne Gateway-/Webchat-Clients benötigen `operator.admin`, um sie dauerhaft zu speichern.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; andernfalls gelten die Sitzungs-/globalen Standardwerte.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Ausführlichkeitsstufe anzuzeigen.
- Wenn die ausführliche Ausgabe aktiviert ist, senden Agenten, die strukturierte Werkzeugergebnisse ausgeben, jeden Werkzeugaufruf als eigene Nachricht zurück, die nur Metadaten enthält und, sofern verfügbar, das Präfix `<emoji> <tool-name>: <arg>` trägt. Diese Werkzeugzusammenfassungen werden gesendet, sobald das jeweilige Werkzeug startet (in separaten Sprechblasen), nicht als Streaming-Deltas.
- Zusammenfassungen von Werkzeugfehlern bleiben im normalen Modus sichtbar, aber Suffixe mit Rohfehlerdetails werden ausgeblendet, sofern die Ausführlichkeit nicht auf `full` gesetzt ist.
- Wenn die Ausführlichkeit auf `full` gesetzt ist, werden Werkzeugausgaben nach Abschluss ebenfalls weitergeleitet (in einer separaten Sprechblase, auf eine sichere Länge gekürzt). Wenn Sie `/verbose on|full|off` während eines laufenden Durchlaufs umschalten, berücksichtigen nachfolgende Werkzeug-Sprechblasen die neue Einstellung.
- `agents.defaults.toolProgressDetail` steuert die Form der Werkzeugzusammenfassungen von `/verbose` und der Werkzeugzeilen in Fortschrittsentwürfen. Verwenden Sie `"explain"` (Standard) für kompakte, menschenlesbare Bezeichnungen wie `🛠️ Exec: checking JS syntax`; verwenden Sie `"raw"`, wenn für die Fehlersuche zusätzlich der rohe Befehl bzw. die Details angehängt werden sollen. Die agentenspezifische Einstellung `agents.entries.*.toolProgressDetail` überschreibt den Standardwert.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine Nachricht, die nur eine Direktive enthält, schaltet die Plugin-Trace-Ausgabe der Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; andernfalls gelten die Sitzungs-/globalen Standardwerte.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es legt nur Plugin-eigene Trace-/Debug-Zeilen offen, beispielsweise Debug-Zusammenfassungen von Active Memory.
- Trace-Zeilen können in `/status` und nach der normalen Assistentenantwort als nachfolgende Diagnosemeldung erscheinen.

## Sichtbarkeit der Schlussfolgerungen (/reasoning)

- Stufen: `on|off|stream`.
- Eine Nachricht, die nur eine Direktive enthält, schaltet um, ob Denkblöcke in Antworten angezeigt werden.
- Wenn aktiviert, werden Schlussfolgerungen als **separate Nachricht** mit dem Präfix `Thinking` gesendet.
- `stream`: streamt Schlussfolgerungen während der Generierung der Antwort, sofern der aktive Kanal Vorschauen von Schlussfolgerungen unterstützt, und sendet anschließend die endgültige Antwort ohne Schlussfolgerungen.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Schlussfolgerungsstufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungsüberschreibung, dann agentenspezifischer Standardwert (`agents.entries.*.reasoningDefault`), dann globaler Standardwert (`agents.defaults.reasoningDefault`), dann Rückfallwert (`off`).

Fehlerhafte Schlussfolgerungs-Tags lokaler Modelle werden vorsichtig behandelt. Geschlossene `<think>...</think>`-Blöcke bleiben in normalen Antworten ausgeblendet, und nicht geschlossene Schlussfolgerungen nach bereits sichtbarem Text werden ebenfalls ausgeblendet. Wenn eine Antwort vollständig von einem einzelnen nicht geschlossenen öffnenden Tag umschlossen ist und andernfalls als leerer Text ausgeliefert würde, entfernt OpenClaw den fehlerhaften öffnenden Tag und liefert den verbleibenden Text aus.

## Verwandte Themen

- Die Dokumentation zum erweiterten Modus finden Sie unter [Erweiterter Modus](/de/tools/elevated).

## Heartbeats

- Der Text der Heartbeat-Prüfung ist die konfigurierte Heartbeat-Eingabeaufforderung (Standard: `Follow the heartbeat monitor scratch context when provided. Recurring tasks are cron jobs; create or change their schedules with cron tools or the openclaw cron CLI, not heartbeat scratch. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie jedoch, Sitzungsstandardwerte über Heartbeats zu ändern).
- Standardmäßig wird bei der Heartbeat-Zustellung nur die endgültige Nutzlast gesendet. Um zusätzlich die separate Nachricht `Thinking` zu senden (sofern verfügbar), legen Sie `agents.defaults.heartbeat.includeReasoning: true` oder die agentenspezifische Einstellung `agents.entries.*.heartbeat.includeReasoning: true` fest.

## Webchat-Oberfläche

- Beim Laden der Seite übernimmt die Auswahl für das Denken im Webchat die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration.
- Die Auswahl einer anderen Stufe schreibt die Sitzungsüberschreibung sofort über `sessions.patch`; sie wartet nicht bis zum nächsten Senden und ist keine einmalige Überschreibung durch `thinkingOnce`.
- Wird eine Nachricht gesendet, während Änderungen an der Modell-, Schlussfolgerungs- oder Geschwindigkeitsauswahl noch angewendet werden, wird auf alle ausstehenden Auswahl-Patches gewartet; schlägt eine Änderung fehl, bleibt die Nachricht zur Überprüfung ungesendet.
- Die erste Option ist immer die Auswahl zum Löschen der Überschreibung. Sie zeigt `Inherited: <resolved level>` an, einschließlich `Inherited: Off`, wenn das geerbte Denken deaktiviert ist.
- Explizite Auswahloptionen verwenden ihre direkten Stufenbezeichnungen und behalten vorhandene Provider-Bezeichnungen bei (zum Beispiel `Maximum` für eine mit einem Provider bezeichnete Option `max`).
- Die Auswahl verwendet `thinkingLevels`, das von der Gateway-Sitzungszeile bzw. den Standardwerten zurückgegeben wird, wobei `thinkingOptions` als ältere Bezeichnungsliste beibehalten wird. Die Browseroberfläche verwaltet keine eigene Liste regulärer Provider-Ausdrücke; Plugins sind für modellspezifische Stufenmengen zuständig.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und die Auswahl synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standardwert des Modells zu definieren.
- Provider-Plugins, die Claude-Modelle weiterleiten, sollten `resolveClaudeThinkingProfile(modelId)` aus `openclaw/plugin-sdk/provider-model-shared` wiederverwenden, damit direkte Anthropic- und Proxy-Kataloge aufeinander abgestimmt bleiben.
- Jede Profilstufe besitzt einen gespeicherten kanonischen Wert `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` oder `ultra`) und kann eine Anzeigebezeichnung `label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Profil-Hooks erhalten, sofern verfügbar, zusammengeführte Kataloginformationen, einschließlich `reasoning`, `compat.thinkingFormat` und `compat.supportedReasoningEfforts`. Verwenden Sie diese Informationen, um binäre oder benutzerdefinierte Profile nur dann bereitzustellen, wenn der konfigurierte Anfragevertrag die entsprechende Nutzlast unterstützt.
- Werkzeug-Plugins, die eine explizite Überschreibung für das Denken validieren müssen, sollten `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` zusammen mit `api.runtime.agent.normalizeThinkingLevel(...)` verwenden; sie sollten keine eigenen Listen der Provider-/Modellstufen führen. Übergeben Sie `agentRuntime`, wenn das Werkzeug für den Ausführungspfad zuständig ist, etwa bei einem immer eingebetteten Durchlauf.
- Werkzeug-Plugins mit Zugriff auf konfigurierte Metadaten benutzerdefinierter Modelle können `catalog` an `resolveThinkingPolicy` übergeben, damit Opt-ins für `compat.supportedReasoningEfforts` bei der Plugin-seitigen Validierung berücksichtigt werden.
- Veröffentlichte ältere Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter bestehen, neue benutzerdefinierte Stufenmengen sollten jedoch `resolveThinkingProfile` verwenden.
- Gateway-Zeilen/-Standardwerte stellen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` bereit, damit ACP-/Chat-Clients dieselben Profil-IDs und -Bezeichnungen darstellen, die auch von der Laufzeitvalidierung verwendet werden.
