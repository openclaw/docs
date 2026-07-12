---
read_when:
    - Anpassen der Verarbeitung oder Standardwerte für Thinking-, Fast-Mode- oder Verbose-Direktiven
summary: Direktivsyntax für /think, /fast, /verbose, /trace und die Sichtbarkeit von Schlussfolgerungen
title: Denkstufen
x-i18n:
    generated_at: "2026-07-12T02:17:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75170dd48f83dcb3ebb70eea2b37160208618d0aae23253c82fe88ce3afbc0e2
    source_path: tools/thinking.md
    workflow: 16
---

## Funktionsweise

- Inline-Direktive in einem beliebigen eingehenden Nachrichtentext: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive | max | ultra`, ungefähr entsprechend Anthropics klassischer Zauberwort-Abstufung „think“ < „think hard“ < „think harder“ < „ultrathink“:
  - minimal ~ „nachdenken“
  - low ~ „gründlich nachdenken“
  - medium ~ „noch gründlicher nachdenken“
  - high ~ „maximal gründlich nachdenken“ (maximales Budget)
  - xhigh ~ „maximal gründlich nachdenken+“ (GPT-5.2+- und Codex-Modelle sowie Anthropic Claude Opus 4.7+ mit entsprechender Verarbeitungsintensität)
  - adaptive → vom Provider verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7+ und dynamisches Denken von Google Gemini)
  - max → maximale Schlussfolgerungsintensität des Providers (Anthropic Claude Opus 4.7+; Ollama ordnet dies seiner höchsten nativen `think`-Intensität zu)
  - ultra → maximale Schlussfolgerungsintensität des Providers plus proaktive Unteragenten-Orchestrierung, wenn das ausgewählte Modell bzw. die Laufzeit dies unterstützt
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden `xhigh` zugeordnet.
  - `highest` wird `high` zugeordnet.
- Hinweise zu Providern:
  - Denk-Menüs und Auswahlelemente werden durch Provider-Profile gesteuert. Provider-Plugins deklarieren die genaue Stufenmenge für das ausgewählte Modell, einschließlich Bezeichnungen wie dem binären `on`.
  - `adaptive`, `xhigh`, `max` und `ultra` werden nur für Provider-/Modell-/Laufzeitprofile angeboten, die sie unterstützen. Eingegebene Direktiven für nicht unterstützte Stufen werden unter Angabe der für dieses Modell gültigen Optionen abgelehnt.
  - Bereits gespeicherte, nicht unterstützte Stufen werden anhand des Rangs im Provider-Profil neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die höchste unterstützte Stufe ungleich `off` für das ausgewählte Modell zurückfallen.
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denkstufe festgelegt ist.
  - Bei Anthropic Claude Opus 4.8 und Opus 4.7 bleibt das Denken deaktiviert, sofern Sie nicht ausdrücklich eine Denkstufe festlegen. Nachdem adaptives Denken aktiviert wurde, ist die vom Provider vorgegebene Standardintensität von Opus 4.8 `high`.
  - Anthropic Claude Opus 4.7+ ordnet `/think xhigh` adaptivem Denken plus `output_config.effort: "xhigh"` zu, da `/think` eine Denk-Direktive und `xhigh` die Opus-Intensitätseinstellung ist.
  - Anthropic Claude Opus 4.7+ stellt außerdem `/think max` bereit; dies wird demselben vom Provider verwalteten Pfad für maximale Intensität zugeordnet.
  - Direkte DeepSeek-V4-Modelle stellen `/think xhigh|max` bereit; beide werden DeepSeek `reasoning_effort: "max"` zugeordnet, während niedrigere Stufen ungleich `off` `high` zugeordnet werden.
  - Über OpenRouter geroutete DeepSeek-V4-Modelle stellen `/think xhigh` bereit und senden von OpenRouter unterstützte `reasoning.effort`-Werte anstelle des nativen DeepSeek-Felds `reasoning_effort` auf oberster Ebene. Niedrigere Stufen ungleich `off` werden `high` zugeordnet, und gespeicherte `max`-Überschreibungen fallen auf `xhigh` zurück.
  - Denkfähige Ollama-Modelle stellen `/think low|medium|high|max` bereit; `max` wird dem nativen `think: "high"` zugeordnet, da die native API von Ollama die Intensitätszeichenfolgen `low`, `medium` und `high` akzeptiert.
  - OpenAI-GPT-Modelle ordnen `/think` über die modellspezifische Unterstützung der Responses API für Verarbeitungsintensitäten zu. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Schlussfolgerungsnutzlast weg, statt einen nicht unterstützten Wert zu senden.
  - GPT-5.6 Sol und Terra stellen über die Codex-Laufzeit ein natives `/think ultra` bereit. GPT-5.6 Luna stellt Stufen bis einschließlich `max` bereit, da sein Codex-Katalog Ultra nicht ausweist.
  - Die eingebettete OpenClaw-Laufzeit stellt für GPT-5.6 Sol, Terra und Luna das logische `/think ultra` bereit. Sie sendet die maximale Intensität des Providers und fügt laufbezogene Anweisungen zur proaktiven Unteragenten-Orchestrierung hinzu.
  - Benutzerdefinierte OpenAI-kompatible Katalogeinträge können `/think xhigh` aktivieren, indem `"xhigh"` in `models.providers.<provider>.models[].compat.supportedReasoningEfforts` aufgenommen wird. Dies verwendet dieselben Kompatibilitätsmetadaten, die ausgehende OpenAI-Nutzlasten zur Schlussfolgerungsintensität zuordnen, sodass Menüs, Sitzungsvalidierung, Agenten-CLI und `llm-task` mit dem Transportverhalten übereinstimmen.
  - Veraltete konfigurierte OpenRouter-Hunter-Alpha-Referenzen überspringen die Proxy-Einspeisung von Schlussfolgerungen, da diese eingestellte Route endgültigen Antworttext über Schlussfolgerungsfelder zurückgeben konnte.
  - Google Gemini ordnet `/think adaptive` dem vom Provider verwalteten dynamischen Denken von Gemini zu. Bei Gemini-3-Anfragen wird ein fester `thinkingLevel` weggelassen, während Gemini-2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin dem nächstliegenden Gemini-`thinkingLevel` oder Budget für die jeweilige Modellfamilie zugeordnet.
  - MiniMax M2.x (`minimax/MiniMax-M2*`) verwendet im Anthropic-kompatiblen Streaming-Pfad standardmäßig `thinking: { type: "disabled" }`, sofern Sie das Denken nicht ausdrücklich in den Modell- oder Anfrageparametern festlegen. Dadurch werden durchgelassene `reasoning_content`-Deltas aus dem nicht nativen Anthropic-Streamformat von M2.x vermieden. MiniMax-M3 (und M3.x) ist davon ausgenommen: M3 gibt korrekte Anthropic-Denkblöcke aus und liefert bei deaktiviertem Denken leere Inhalte zurück. Daher belässt OpenClaw M3 auf dem Pfad des Providers mit ausgelassenem bzw. adaptivem Denken.
  - Z.AI (`zai/*`) ist für die meisten GLM-Modelle binär (`on`/`off`). GLM-5.2 ist die Ausnahme: Es stellt `/think off|low|high|max` bereit, ordnet `low` und `high` Z.AI `reasoning_effort: "high"` und `max` `reasoning_effort: "max"` zu.
  - Moonshot Kimi K2.7 Code (`moonshot/kimi-k2.7-code`) denkt immer. Sein Profil stellt nur `on` bereit, und OpenClaw lässt das ausgehende Feld `thinking` wie von Moonshot verlangt weg. Andere `moonshot/*`-Modelle ordnen `/think off` `thinking: { type: "disabled" }` und jede Stufe ungleich `off` `thinking: { type: "enabled" }` zu. Wenn das Denken aktiviert ist, akzeptiert Moonshot für `tool_choice` nur `auto|none`; OpenClaw normalisiert inkompatible Werte zu `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (wird durch Senden einer Nachricht festgelegt, die ausschließlich aus einer Direktive besteht).
3. Agentenspezifischer Standard (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Rückfall: vom Provider deklarierter Standard, sofern verfügbar; andernfalls werden schlussfolgerungsfähige Modelle auf `medium` oder die nächstliegende unterstützte Stufe ungleich `off` für dieses Modell aufgelöst, und Modelle ohne Schlussfolgerungsfähigkeit bleiben auf `off`.

## Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **ausschließlich** aus der Direktive besteht (Leerraum ist zulässig), z. B. `/think:medium` oder `/t high`.
- Diese Einstellung bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender). Verwenden Sie `/think default`, um die Sitzungsüberschreibung zu löschen und den konfigurierten bzw. vom Provider vorgegebenen Standard zu übernehmen; zu den Aliassen gehören `inherit`, `clear`, `reset` und `unpin`.
- `/think off` speichert eine explizite Deaktivierungsüberschreibung. Dadurch bleibt das Denken deaktiviert, bis Sie die Sitzungsüberschreibung ändern oder löschen.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Ist die Stufe ungültig (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungsstatus bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Denkstufe anzuzeigen.

## Anwendung durch den Agenten

- **Eingebettetes OpenClaw**: Die aufgelöste Stufe wird an die prozessinterne OpenClaw-Agentenlaufzeit übergeben.
- **Claude-CLI-Backend**: Konkrete Stufen ungleich `off` werden bei Verwendung von `claude-cli` als `--effort` an Claude Code übergeben; `adaptive` entfernt konfigurierte Intensitätsflags und überlässt die effektive Intensität der Umgebung, den Einstellungen und den Modellstandards von Claude Code. Siehe [CLI-Backends](/de/gateway/cli-backends).

## Schnellmodus (/fast)

- Stufen: `auto|on|off|default`.
- Eine Nachricht, die ausschließlich aus der Direktive besteht, schaltet eine sitzungsbezogene Schnellmodusüberschreibung um und antwortet mit `Fast mode set to auto.`, `Fast mode enabled.` oder `Fast mode disabled.`. Verwenden Sie `/fast default`, um die Sitzungsüberschreibung zu löschen und den konfigurierten Standard zu übernehmen; zu den Aliassen gehören `inherit`, `clear`, `reset` und `unpin`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuell wirksamen Schnellmodusstatus anzuzeigen.
- OpenClaw löst den Schnellmodus in dieser Reihenfolge auf:
  1. Inline- bzw. ausschließlich aus einer Direktive bestehende Überschreibung `/fast auto|on|off` (`/fast default` löscht diese Ebene)
  2. Sitzungsüberschreibung
  3. Agentenspezifischer Standard (`agents.list[].fastModeDefault`)
  4. Modellspezifische Konfiguration: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Rückfall: `off`
- `auto` belässt den Sitzungs- bzw. Konfigurationsmodus auf Automatik, löst jedoch jeden neuen Modellaufruf unabhängig auf. Bei Aufrufen, die vor dem automatischen Grenzzeitpunkt beginnen, ist der Schnellmodus aktiviert; spätere Wiederholungs-, Rückfall-, Werkzeugergebnis- oder Fortsetzungsaufrufe beginnen mit deaktiviertem Schnellmodus. Der Grenzzeitpunkt liegt standardmäßig bei 60 Sekunden; legen Sie für das aktive Modell `agents.defaults.models["<provider>/<model>"].params.fastAutoOnSeconds` fest, um ihn zu ändern.
- Für `openai/*` wird der Schnellmodus der priorisierten Verarbeitung von OpenAI zugeordnet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für Codex-gestützte `openai/*`- bzw. `openai-codex/*`-Modelle sendet der Schnellmodus dasselbe Flag `service_tier=priority` für Codex Responses. Native Codex-App-Server-Durchläufe erhalten die Stufe nur bei `turn/start` oder beim Starten bzw. Fortsetzen eines Threads. Daher kann `auto` einen bereits laufenden App-Server-Durchlauf nicht auf eine andere Stufe umstellen; es gilt für den nächsten von OpenClaw gestarteten Modelldurchlauf.
- Bei direkten öffentlichen `anthropic/*`-Anfragen, einschließlich per OAuth authentifiziertem Datenverkehr an `api.anthropic.com`, wird der Schnellmodus Anthropic-Dienststufen zugeordnet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` im Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` bzw. `service_tier` überschreiben den Schnellmodusstandard, wenn beide festgelegt sind. OpenClaw überspringt die Einspeisung der Anthropic-Dienststufe weiterhin bei Proxy-Basis-URLs, die nicht zu Anthropic gehören.
- `/status` zeigt `Fast` an, wenn der Schnellmodus aktiviert ist, und `Fast:auto`, wenn der konfigurierte Modus automatisch ist.

## Ausführlichkeitsdirektiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht, die ausschließlich aus der Direktive besteht, schaltet die Sitzungsausführlichkeit um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Status zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie über die Sitzungsoberfläche, indem Sie `inherit` auswählen.
- Autorisierte Absender externer Kanäle dürfen die sitzungsbezogene Ausführlichkeitsüberschreibung dauerhaft speichern. Interne Gateway-/Webchat-Clients benötigen `operator.admin`, um sie dauerhaft zu speichern.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; andernfalls gelten die Sitzungs- bzw. globalen Standards.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Ausführlichkeitsstufe anzuzeigen.
- Wenn die Ausführlichkeit aktiviert ist, senden Agenten, die strukturierte Werkzeugergebnisse ausgeben, jeden Werkzeugaufruf als eigene Nachricht zurück, die ausschließlich Metadaten enthält und, sofern verfügbar, das Präfix `<emoji> <tool-name>: <arg>` trägt. Diese Werkzeugzusammenfassungen werden gesendet, sobald das jeweilige Werkzeug startet (in separaten Nachrichtenblasen), nicht als Streaming-Deltas.
- Zusammenfassungen von Werkzeugfehlern bleiben im normalen Modus sichtbar, aber Suffixe mit Rohfehlerdetails werden ausgeblendet, sofern die Ausführlichkeit nicht auf `full` steht.
- Wenn die Ausführlichkeit auf `full` steht, werden auch Werkzeugausgaben nach Abschluss weitergeleitet (in einer separaten Nachrichtenblase und auf eine sichere Länge gekürzt). Wenn Sie während eines laufenden Durchlaufs zwischen `/verbose on|full|off` umschalten, berücksichtigen nachfolgende Werkzeugblasen die neue Einstellung.
- `agents.defaults.toolProgressDetail` steuert die Form der Werkzeugzusammenfassungen von `/verbose` und der Werkzeugzeilen in Fortschrittsentwürfen. Verwenden Sie `"explain"` (Standard) für kompakte, verständliche Bezeichnungen wie `🛠️ Exec: checking JS syntax`; verwenden Sie `"raw"`, wenn zusätzlich der Rohbefehl bzw. die Rohdetails zur Fehlerdiagnose angehängt werden sollen. Agentenspezifisches `agents.list[].toolProgressDetail` überschreibt den Standard.
  - `explain`: `🛠️ Exec: check JS syntax for /tmp/app.js`
  - `raw`: `🛠️ Exec: check JS syntax for /tmp/app.js, node --check /tmp/app.js`

## Plugin-Ablaufverfolgungsdirektiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine Nachricht, die ausschließlich aus der Direktive besteht, schaltet die Ausgabe der sitzungsbezogenen Plugin-Ablaufverfolgung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; andernfalls gelten die Sitzungs- bzw. globalen Standards.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Ablaufverfolgungsstufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es legt nur Plugin-eigene Ablaufverfolgungs-/Diagnosezeilen offen, beispielsweise Diagnosezusammenfassungen von Active Memory.
- Ablaufverfolgungszeilen können in `/status` und als nachfolgende Diagnosemeldung nach der normalen Assistentenantwort erscheinen.

## Sichtbarkeit der Schlussfolgerungen (/reasoning)

- Stufen: `on|off|stream`.
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet um, ob Denkblöcke in Antworten angezeigt werden.
- Wenn dies aktiviert ist, wird die Begründung als **separate Nachricht** mit dem Präfix `Thinking` gesendet.
- `stream`: Streamt die Begründung während der Generierung der Antwort, wenn der aktive Kanal Vorschauen der Begründung unterstützt, und sendet anschließend die endgültige Antwort ohne Begründung.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Begründungsstufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungsüberschreibung, dann Standardwert pro Agent (`agents.list[].reasoningDefault`), dann globaler Standardwert (`agents.defaults.reasoningDefault`), dann Rückfallwert (`off`).

Fehlerhafte Begründungs-Tags lokaler Modelle werden vorsichtig behandelt. Geschlossene `<think>...</think>`-Blöcke bleiben in normalen Antworten ausgeblendet, und eine nicht geschlossene Begründung nach bereits sichtbarem Text wird ebenfalls ausgeblendet. Wenn eine Antwort vollständig von einem einzelnen nicht geschlossenen öffnenden Tag umschlossen ist und andernfalls als leerer Text übermittelt würde, entfernt OpenClaw das fehlerhafte öffnende Tag und übermittelt den verbleibenden Text.

## Verwandte Themen

- Die Dokumentation zum Modus mit erhöhten Berechtigungen finden Sie unter [Modus mit erhöhten Berechtigungen](/de/tools/elevated).

## Heartbeats

- Der Text der Heartbeat-Prüfung ist die konfigurierte Heartbeat-Eingabeaufforderung (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht werden wie gewohnt angewendet (vermeiden Sie jedoch, Sitzungsstandardwerte über Heartbeats zu ändern).
- Bei der Heartbeat-Übermittlung wird standardmäßig nur die endgültige Nutzlast gesendet. Um zusätzlich die separate Nachricht `Thinking` zu senden (sofern verfügbar), legen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true` fest.

## Webchat-Benutzeroberfläche

- Beim Laden der Seite übernimmt die Denkauswahl des Webchats die gespeicherte Stufe der Sitzung aus dem Speicher beziehungsweise der Konfiguration der eingehenden Sitzung.
- Die Auswahl einer anderen Stufe schreibt die Sitzungsüberschreibung sofort über `sessions.patch`; sie wartet nicht bis zum nächsten Senden und ist keine einmalige `thinkingOnce`-Überschreibung.
- Wenn Sie eine Nachricht senden, während Änderungen an der Modell-, Begründungs- oder Geschwindigkeitsauswahl noch angewendet werden, wird auf alle ausstehenden Auswahlaktualisierungen gewartet; schlägt eine Änderung fehl, bleibt die Nachricht zur Überprüfung ungesendet.
- Die erste Option ist immer die Auswahl zum Löschen der Überschreibung. Sie zeigt `Inherited: <resolved level>` an, einschließlich `Inherited: Off`, wenn das übernommene Denken deaktiviert ist.
- Explizite Auswahloptionen verwenden ihre direkten Stufenbezeichnungen und behalten vorhandene Provider-Bezeichnungen bei (zum Beispiel `Maximum` für eine vom Provider als `max` bezeichnete Option).
- Die Auswahl verwendet `thinkingLevels`, die von der Gateway-Sitzungszeile beziehungsweise den Standardwerten zurückgegeben werden; `thinkingOptions` bleibt als veraltete Bezeichnungsliste erhalten. Die Browser-Benutzeroberfläche verwaltet keine eigene Liste regulärer Ausdrücke für Provider; Plugins verwalten die modellspezifischen Stufenmengen.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und Auswahl synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standardwert des Modells zu definieren.
- Provider-Plugins, die Claude-Modelle weiterleiten, sollten `resolveClaudeThinkingProfile(modelId)` aus `openclaw/plugin-sdk/provider-model-shared` wiederverwenden, damit direkte Anthropic- und Proxy-Kataloge übereinstimmen.
- Jede Profilstufe verfügt über eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` oder `ultra`) und kann eine anzuzeigende `label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Profil-Hooks erhalten, sofern verfügbar, zusammengeführte Kataloginformationen, darunter `reasoning`, `compat.thinkingFormat` und `compat.supportedReasoningEfforts`. Verwenden Sie diese Informationen, um binäre oder benutzerdefinierte Profile nur dann bereitzustellen, wenn der konfigurierte Anfragevertrag die entsprechende Nutzlast unterstützt.
- Tool-Plugins, die eine explizite Denküberschreibung validieren müssen, sollten `api.runtime.agent.resolveThinkingPolicy({ provider, model, agentRuntime })` zusammen mit `api.runtime.agent.normalizeThinkingLevel(...)` verwenden; sie sollten keine eigenen Listen der Provider-/Modellstufen verwalten. Übergeben Sie `agentRuntime`, wenn das Tool für den Ausführungspfad zuständig ist, etwa bei einer stets eingebetteten Ausführung.
- Tool-Plugins mit Zugriff auf konfigurierte Metadaten benutzerdefinierter Modelle können `catalog` an `resolveThinkingPolicy` übergeben, sodass Aktivierungen über `compat.supportedReasoningEfforts` bei der Plugin-seitigen Validierung berücksichtigt werden.
- Veröffentlichte veraltete Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter erhalten, neue benutzerdefinierte Stufenmengen sollten jedoch `resolveThinkingProfile` verwenden.
- Gateway-Zeilen und -Standardwerte stellen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` bereit, damit ACP-/Chat-Clients dieselben Profil-IDs und -Bezeichnungen darstellen, die auch von der Laufzeitvalidierung verwendet werden.
