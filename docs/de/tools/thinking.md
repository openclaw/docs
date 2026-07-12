---
read_when:
    - Anpassen der Auswertung oder Standardwerte für Thinking-, Fast-Mode- oder Verbose-Direktiven
summary: Direktivsyntax für /think, /fast, /verbose, /trace und die Sichtbarkeit von Schlussfolgerungen
title: Denkstufen
x-i18n:
    generated_at: "2026-07-12T16:06:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## Funktionsweise

- Inline-Direktive in einem beliebigen eingehenden Textkörper: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, die ungefähr Anthropics klassische magische Wortfolge „think“ < „think hard“ < „think harder“ < „ultrathink“ widerspiegeln:
  - minimal ~ „denken“
  - low ~ „intensiv denken“
  - medium ~ „intensiver denken“
  - high ~ „maximal intensiv denken“ (maximales Budget)
  - xhigh ~ „maximal intensiv denken+“ (GPT-5.2+- und Codex-Modelle sowie die Effort-Einstellung von Anthropic Claude Opus 4.7+)
  - adaptive → vom Provider verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7+ und dynamisches Denken von Google Gemini)
  - max → maximale Schlussfolgerungsleistung des Providers (Anthropic Claude Opus 4.7+; Ollama ordnet dies seiner höchsten nativen `think`-Effort-Einstellung zu)
  - ultra → maximale Schlussfolgerungsleistung des Providers plus proaktive Subagenten-Orchestrierung, sofern das ausgewählte Modell bzw. die ausgewählte Runtime dies unterstützt
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden `xhigh` zugeordnet.
  - `highest` wird `high` zugeordnet.
- Hinweise zu Providern:
  - Denkstufenmenüs und Auswahllisten werden vom Provider-Profil gesteuert. Provider-Plugins deklarieren den genauen Stufensatz für das ausgewählte Modell, einschließlich Bezeichnungen wie dem binären `on`.
  - `adaptive`, `xhigh`, `max` und `ultra` werden nur für Provider-/Modell-/Runtime-Profile angeboten, die sie unterstützen. Typisierte Direktiven für nicht unterstützte Stufen werden mit den für dieses Modell gültigen Optionen abgelehnt.
  - Bereits gespeicherte, nicht unterstützte Stufen werden anhand des Rangs im Provider-Profil neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die höchste unterstützte, nicht deaktivierte Stufe des ausgewählten Modells zurückfallen.
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine Denkstufe ausdrücklich festgelegt ist.
  - Bei Anthropic Claude Opus 4.8 und Opus 4.7 bleibt das Denken deaktiviert, sofern Sie nicht ausdrücklich eine Denkstufe festlegen. Nachdem adaptives Denken aktiviert wurde, lautet die vom Provider vorgegebene Effort-Standardeinstellung von Opus 4.8 `high`.
  - Anthropic Claude Opus 4.7+ ordnet `/think xhigh` adaptivem Denken plus `output_config.effort: "xhigh"` zu, da `/think` eine Denkdirektive und `xhigh` die Effort-Einstellung von Opus ist.
  - Anthropic Claude Opus 4.7+ stellt außerdem `/think max` bereit; es wird demselben vom Provider verwalteten Pfad für maximale Effort-Einstellung zugeordnet.
  - Direkte DeepSeek-V4-Modelle stellen `/think xhigh|max` bereit; beide werden DeepSeek `reasoning_effort: "max"` zugeordnet, während niedrigere, nicht deaktivierte Stufen `high` zugeordnet werden.
  - Über OpenRouter weitergeleitete DeepSeek-V4-Modelle stellen `/think xhigh` bereit und senden von OpenRouter unterstützte `reasoning.effort`-Werte anstelle des nativen DeepSeek-Werts `reasoning_effort` auf oberster Ebene. Niedrigere, nicht deaktivierte Stufen werden `high` zugeordnet, und gespeicherte `max`-Überschreibungen fallen auf `xhigh` zurück.
  - Denkfähige Ollama-Modelle stellen `/think low|medium|high|max` bereit; `max` wird dem nativen Wert `think: "high"` zugeordnet, da die native API von Ollama die Effort-Zeichenfolgen `low`, `medium` und `high` akzeptiert.
  - OpenAI-GPT-Modelle ordnen `/think` über die modellspezifische Effort-Unterstützung der Responses API zu. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Schlussfolgerungsnutzlast weg, anstatt einen nicht unterstützten Wert zu senden.
  - GPT-5.6 Sol und Terra stellen über die Codex-Runtime nativ `/think ultra` bereit. GPT-5.6 Luna stellt Stufen bis `max` bereit, da sein Codex-Katalog Ultra nicht ausweist.
  - Die eingebettete OpenClaw-Runtime stellt für GPT-5.6 Sol, Terra und Luna logisch `/think ultra` bereit. Sie sendet die maximale Effort-Einstellung des Providers und fügt für den jeweiligen Lauf Hinweise zur proaktiven Subagenten-Orchestrierung hinzu.
  - Benutzerdefinierte OpenAI-kompatible Katalogeinträge können `/think xhigh` aktivieren, indem `models.providers.<provider>.models[].compat.supportedReasoningEfforts` so festgelegt wird, dass `"xhigh"` enthalten ist. Dabei werden dieselben Kompatibilitätsmetadaten verwendet, die ausgehende Nutzlasten für die OpenAI-Schlussfolgerungsleistung zuordnen, sodass Menüs, Sitzungsvalidierung, Agenten-CLI und `llm-task` mit dem Transportverhalten übereinstimmen.
  - Veraltete konfigurierte OpenRouter-Hunter-Alpha-Referenzen überspringen die Proxy-Injektion für Schlussfolgerungen, da diese eingestellte Route endgültigen Antworttext über Schlussfolgerungsfelder zurückgeben konnte.
  - Google Gemini ordnet `/think adaptive` dem vom Provider verwalteten dynamischen Denken von Gemini zu. Gemini-3-Anfragen lassen einen festen `thinkingLevel`-Wert weg, während Gemini-2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin dem nächstgelegenen Gemini-`thinkingLevel`-Wert oder Budget für diese Modellfamilie zugeordnet.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) verwendet im Anthropic-kompatiblen Streaming-Pfad standardmäßig `thinking: { type: "disabled" }`, sofern Sie das Denken nicht ausdrücklich in den Modell- oder Anfrageparametern festlegen. Dadurch wird verhindert, dass `reasoning_content`-Deltas aus dem nicht nativen Anthropic-Streamformat von M2.x durchsickern. MiniMax-M3 (und M3.x) ist davon ausgenommen: M3 gibt korrekte Anthropic-Denkblöcke aus und liefert leeren Inhalt zurück, wenn das Denken deaktiviert ist. Daher belässt OpenClaw M3 auf dem Pfad des Providers für ausgelassenes/adaptives Denken.
  - Z.AI (`zai/*`) ist für die meisten GLM-Modelle binär (`on`/`off`). GLM-5.2 bildet die Ausnahme: Es stellt `/think off|low|high|max` bereit, ordnet `low` und `high` dem Z.AI-Wert `reasoning_effort: "high"` sowie `max` dem Wert `reasoning_effort: "max"` zu.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) denkt immer. Sein Profil stellt ausschließlich `on` bereit, und OpenClaw lässt das ausgehende Feld `thinking` weg, wie von Moonshot vorgeschrieben. Andere `moonshot/*`-Modelle ordnen `/think off` dem Wert `thinking: { type: "disabled" }` und jede nicht auf `off` gesetzte Stufe dem Wert `thinking: { type: "enabled" }` zu. Wenn das Denken aktiviert ist, akzeptiert Moonshot für `tool_choice` ausschließlich `auto|none`; OpenClaw normalisiert inkompatible Werte zu `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (wird durch Senden einer Nachricht festgelegt, die nur eine Direktive enthält).
3. Agentenspezifischer Standard (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: vom Provider deklarierter Standard, sofern verfügbar; andernfalls werden für reasoning-fähige Modelle `medium` oder die nächstgelegene unterstützte Stufe ungleich `off` für das jeweilige Modell verwendet, während Modelle ohne Reasoning-Fähigkeit auf `off` bleiben.

## Festlegen eines Sitzungsstandards

- Senden Sie eine Nachricht, die **nur** die Direktive enthält (Leerraum ist zulässig), z. B. `/think:medium` oder `/t high`.
- Diese Einstellung bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender). Verwenden Sie `/think default`, um die Sitzungsüberschreibung zu löschen und den konfigurierten bzw. vom Provider vorgegebenen Standard zu übernehmen; zu den Aliasen gehören `inherit`, `clear`, `reset` und `unpin`.
- `/think off` speichert eine explizite Deaktivierungsüberschreibung. Dadurch wird das Denken deaktiviert, bis Sie die Sitzungsüberschreibung ändern oder löschen.
- Es wird eine Bestätigungsantwort gesendet (`Thinking level set to high.` / `Thinking disabled.`). Ist die Stufe ungültig (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungsstatus bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Denkstufe anzuzeigen.

## Anwendung durch den Agenten

- **Eingebettetes OpenClaw**: Die aufgelöste Stufe wird an die prozessinterne OpenClaw-Agent-Laufzeit übergeben.
- **Claude-CLI-Backend**: Konkrete Stufen außer „Aus“ werden bei Verwendung von `claude-cli` als `--effort` an Claude Code übergeben; `adaptive` entfernt konfigurierte Aufwand-Flags und überlässt den effektiven Aufwand der Umgebung, den Einstellungen und den Modellstandards von Claude Code. Siehe [CLI-Backends](/de/gateway/cli-backends).

## Schnellmodus (/fast)

- Stufen: `auto|on|off|default`.
- Eine Nachricht, die nur aus der Direktive besteht, schaltet eine sitzungsbezogene Überschreibung des Schnellmodus um und antwortet mit `Fast mode set to auto.`, `Fast mode enabled.` oder `Fast mode disabled.`. Verwenden Sie `/fast default`, um die Sitzungsüberschreibung zu löschen und den konfigurierten Standard zu übernehmen; zu den Aliasen gehören `inherit`, `clear`, `reset` und `unpin`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuellen effektiven Schnellmodus-Status anzuzeigen.
- OpenClaw löst den Schnellmodus in dieser Reihenfolge auf:
  1. Inline-Überschreibung bzw. nur aus einer Direktive bestehende Überschreibung durch `/fast auto|on|off` (`/fast default` löscht diese Ebene)
  2. Sitzungsüberschreibung
  3. Agent-spezifischer Standard (`agents.list[].fastModeDefault`)
  4. Modellspezifische Konfiguration: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Rückfallwert: `off`
- `auto` behält den Sitzungs-/Konfigurationsmodus als „Automatisch“ bei, löst jedoch jeden neuen Modellaufruf unabhängig auf. Bei Aufrufen, die vor dem automatischen Grenzzeitpunkt beginnen, ist der Schnellmodus aktiviert; spätere Wiederholungs-, Rückfall-, Werkzeugergebnis- oder Fortsetzungsaufrufe beginnen mit deaktiviertem Schnellmodus. Der Grenzzeitpunkt liegt standardmäßig bei 60 Sekunden; legen Sie `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` für das aktive Modell fest, um ihn zu ändern.
- Für `openai/*` wird der Schnellmodus der priorisierten Verarbeitung von OpenAI zugeordnet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Bei Codex-basierten `openai/*`- / `openai-codex/*`-Modellen sendet der Schnellmodus dasselbe Flag `service_tier=priority` bei Codex-Responses. Native Codex-App-Server-Durchläufe erhalten die Stufe nur bei `turn/start` oder beim Starten/Fortsetzen eines Threads, daher kann `auto` die Stufe eines bereits laufenden App-Server-Durchlaufs nicht ändern; sie gilt für den nächsten von OpenClaw gestarteten Modelldurchlauf.
- Bei direkten öffentlichen `anthropic/*`-Anfragen, einschließlich OAuth-authentifiziertem Datenverkehr an `api.anthropic.com`, wird der Schnellmodus Anthropic-Dienststufen zugeordnet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` über den Anthropic-kompatiblen Pfad ersetzt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` durch `MiniMax-M2.7-highspeed`.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Schnellmodus-Standard, wenn beide festgelegt sind. OpenClaw überspringt die Einfügung der Anthropic-Dienststufe weiterhin bei Nicht-Anthropic-Proxy-Basis-URLs.
- `/status` zeigt `Fast` an, wenn der Schnellmodus aktiviert ist, und `Fast:auto`, wenn der konfigurierte Modus „Automatisch“ ist.

## Ausführlichkeitsdirektiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht, die nur die Direktive enthält, schaltet die ausführliche Sitzungsprotokollierung um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Zustand zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie über die Sitzungsoberfläche, indem Sie `inherit` auswählen.
- Autorisierte Absender externer Kanäle dürfen die Überschreibung für die ausführliche Sitzungsprotokollierung dauerhaft speichern. Interne Gateway-/Webchat-Clients benötigen `operator.admin`, um sie dauerhaft zu speichern.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; andernfalls gelten die Sitzungs-/globalen Standardwerte.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Ausführlichkeitsstufe anzuzeigen.
- Wenn die ausführliche Protokollierung aktiviert ist, senden Agenten, die strukturierte Werkzeugergebnisse ausgeben, jeden Werkzeugaufruf als eigene Nachricht zurück, die nur Metadaten enthält und, sofern verfügbar, mit `<emoji> <tool-name>: <arg>` beginnt. Diese Werkzeugzusammenfassungen werden gesendet, sobald das jeweilige Werkzeug startet (in separaten Sprechblasen), nicht als Streaming-Deltas.
- Zusammenfassungen von Werkzeugfehlern bleiben im normalen Modus sichtbar, aber Suffixe mit Rohfehlerdetails werden ausgeblendet, sofern die Ausführlichkeitsstufe nicht `full` ist.
- Wenn die Ausführlichkeitsstufe `full` ist, werden nach Abschluss auch Werkzeugausgaben weitergeleitet (in einer separaten Sprechblase, auf eine sichere Länge gekürzt). Wenn Sie während eines laufenden Durchlaufs mit `/verbose on|full|off` umschalten, berücksichtigen nachfolgende Werkzeug-Sprechblasen die neue Einstellung.
- `agents.defaults.toolProgressDetail` steuert die Form der `/verbose`-Werkzeugzusammenfassungen und Werkzeugzeilen in Fortschrittsentwürfen. Verwenden Sie `"explain"` (Standard) für kompakte, verständliche Bezeichnungen wie `🛠️ Exec: checking JS syntax`; verwenden Sie `"raw"`, wenn zum Debuggen zusätzlich der rohe Befehl bzw. die Rohdetails angehängt werden sollen. Die agentenspezifische Einstellung `agents.list[].toolProgressDetail` überschreibt den Standardwert.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine Nachricht, die nur die Direktive enthält, schaltet die Plugin-Trace-Ausgabe der Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; andernfalls gelten die Sitzungs-/globalen Standardwerte.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Plugin-eigene Trace-/Debug-Zeilen an, beispielsweise Debug-Zusammenfassungen von Active Memory.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnosemeldung nach der normalen Antwort des Assistenten erscheinen.

## Sichtbarkeit der Schlussfolgerungen (/reasoning)

- Stufen: `on|off|stream`.
- Eine Nachricht, die nur eine Direktive enthält, schaltet um, ob Denkblöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird die Herleitung als **separate Nachricht** mit dem Präfix `Thinking` gesendet.
- `stream`: Streamt die Herleitung während der Generierung der Antwort, wenn der aktive Kanal Vorschauen der Herleitung unterstützt, und sendet anschließend die endgültige Antwort ohne Herleitung.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Herleitungsstufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungsüberschreibung, dann agentenspezifischer Standardwert (`agents.list[].reasoningDefault`), dann globaler Standardwert (`agents.defaults.reasoningDefault`), dann Rückfallwert (`off`).

Fehlerhafte Reasoning-Tags lokaler Modelle werden konservativ behandelt. Geschlossene `<think>...</think>`-Blöcke bleiben in normalen Antworten ausgeblendet, und nicht geschlossene Herleitungen nach bereits sichtbarem Text werden ebenfalls ausgeblendet. Wenn eine Antwort vollständig von einem einzelnen nicht geschlossenen öffnenden Tag umschlossen ist und andernfalls als leerer Text übermittelt würde, entfernt OpenClaw das fehlerhafte öffnende Tag und übermittelt den verbleibenden Text.

## Verwandte Themen

- Die Dokumentation zum Modus mit erhöhten Berechtigungen finden Sie unter [Modus mit erhöhten Berechtigungen](/de/tools/elevated).

## Heartbeat-Nachrichten

- Der Inhalt der Heartbeat-Prüfung ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie jedoch, Sitzungsvorgaben durch Heartbeats zu ändern).
- Bei der Heartbeat-Zustellung wird standardmäßig nur die endgültige Nutzlast gesendet. Um zusätzlich die separate `Thinking`-Nachricht zu senden (sofern verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder agentenspezifisch `agents.list[].heartbeat.includeReasoning: true`.

## Webchat-Benutzeroberfläche

- Beim Laden der Seite übernimmt die Denkstufenauswahl des Webchats die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration.
- Die Auswahl einer anderen Stufe schreibt die Sitzungsüberschreibung sofort über `sessions.patch`; sie wartet nicht bis zum nächsten Senden und ist keine einmalige `thinkingOnce`-Überschreibung.
- Wenn Sie eine Nachricht senden, während Änderungen an der Modell-, Denk- oder Geschwindigkeitsauswahl noch angewendet werden, wird auf alle ausstehenden Auswahl-Patches gewartet; schlägt eine Änderung fehl, bleibt die Nachricht zur Überprüfung ungesendet.
- Die erste Option ist immer die Auswahl zum Löschen der Überschreibung. Sie zeigt `Inherited: <resolved level>` an, einschließlich `Inherited: Off`, wenn das geerbte Denken deaktiviert ist.
- Explizite Auswahloptionen verwenden ihre direkten Stufenbezeichnungen und behalten vorhandene Provider-Bezeichnungen bei (beispielsweise `Maximum` für eine vom Provider als `max` bezeichnete Option).
- Die Auswahl verwendet die von der Sitzungzeile bzw. den Vorgaben des Gateways zurückgegebenen `thinkingLevels`; `thinkingOptions` bleibt als veraltete Bezeichnungsliste erhalten. Die Browser-Benutzeroberfläche verwaltet keine eigene Liste regulärer Ausdrücke für Provider; Plugins verwalten modellspezifische Stufensätze.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und die Auswahl synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standardwert des Modells zu definieren.
- Provider-Plugins, die Claude-Modelle als Proxy bereitstellen, sollten `resolveClaudeThinkingProfile(modelId)` aus `openclaw/plugin-sdk/provider-model-shared` wiederverwenden, damit direkte Anthropic- und Proxy-Kataloge konsistent bleiben.
- Jede Profilstufe besitzt eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` oder `ultra`) und kann eine Anzeige-`label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Profil-Hooks erhalten, sofern verfügbar, zusammengeführte Kataloginformationen, einschließlich `reasoning`, `compat.thinkingFormat` und `compat.supportedReasoningEfforts`. Verwenden Sie diese Informationen, um binäre oder benutzerdefinierte Profile nur dann bereitzustellen, wenn der konfigurierte Anfragevertrag die entsprechende Nutzlast unterstützt.
- Tool-Plugins, die eine explizite Denküberschreibung validieren müssen, sollten `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` zusammen mit `api.runtime.agent.normalizeThinkingLevel(...)` verwenden; sie sollten keine eigenen Listen von Provider-/Modellstufen verwalten. Übergeben Sie `agentRuntime`, wenn das Tool den Ausführungspfad verwaltet, beispielsweise bei einer stets eingebetteten Ausführung.
- Tool-Plugins mit Zugriff auf konfigurierte benutzerdefinierte Modellmetadaten können `catalog` an `resolveThinkingPolicy` übergeben, sodass Aktivierungen über `compat.supportedReasoningEfforts` bei der Plugin-seitigen Validierung berücksichtigt werden.
- Veröffentlichte veraltete Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter erhalten, neue benutzerdefinierte Stufensätze sollten jedoch `resolveThinkingProfile` verwenden.
- Gateway-Zeilen bzw. -Vorgaben stellen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` bereit, damit ACP-/Chat-Clients dieselben Profil-IDs und -Bezeichnungen darstellen, die auch von der Laufzeitvalidierung verwendet werden.
