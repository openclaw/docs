---
read_when:
    - Anpassen der Denkstufen sowie des Parsings oder der Standardwerte für den Fast-Modus oder den Verbose-Modus
summary: Direktivsyntax für `/think`, `/fast`, `/verbose`, `/trace` und die Sichtbarkeit von Begründungen
title: Denkstufen
x-i18n:
    generated_at: "2026-04-25T13:59:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0537f10d3dd3251ac41590bebd2d83ba8b2562725c322040b20f32547c8af88d
    source_path: tools/thinking.md
    workflow: 15
---

## Was dies bewirkt

- Inline-Direktive in jedem eingehenden Nachrichtentext: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think“
  - low → „think hard“
  - medium → „think harder“
  - high → „ultrathink“ (maximales Budget)
  - xhigh → „ultrathink+“ (GPT-5.2+ und Codex-Modelle sowie Anthropic Claude Opus 4.7 effort)
  - adaptive → vom Anbieter verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock, Anthropic Claude Opus 4.7 und Google Gemini dynamic thinking)
  - max → maximales Reasoning des Anbieters (derzeit Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden auf `xhigh` abgebildet.
  - `highest` wird auf `high` abgebildet.
- Hinweise zu Anbietern:
  - Denkmenüs und Auswahlfelder werden durch Anbieterprofile gesteuert. Plugin-Anbieter deklarieren den genauen Satz an Stufen für das ausgewählte Modell, einschließlich Bezeichnungen wie binäres `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Anbieter-/Modellprofile angezeigt, die sie unterstützen. Getippte Direktiven für nicht unterstützte Stufen werden mit den gültigen Optionen dieses Modells abgelehnt.
  - Bereits gespeicherte nicht unterstützte Stufen werden anhand des Anbieterprofil-Rangs neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die größte unterstützte Stufe ungleich `off` für das ausgewählte Modell zurückfallen.
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denkstufe gesetzt ist.
  - Anthropic Claude Opus 4.7 verwendet standardmäßig kein adaptives Denken. Sein Standardwert für API-Effort bleibt vom Anbieter gesteuert, sofern du nicht explizit eine Denkstufe setzt.
  - Anthropic Claude Opus 4.7 bildet `/think xhigh` auf adaptives Denken plus `output_config.effort: "xhigh"` ab, weil `/think` eine Denk-Direktive ist und `xhigh` die Effort-Einstellung von Opus 4.7 ist.
  - Anthropic Claude Opus 4.7 stellt auch `/think max` bereit; es wird auf denselben anbieterseitigen Pfad für maximalen Effort abgebildet.
  - OpenAI-GPT-Modelle bilden `/think` über modellspezifische Unterstützung für Responses-API-Effort ab. `/think off` sendet `reasoning.effort: "none"` nur dann, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Payload weg, statt einen nicht unterstützten Wert zu senden.
  - Google Gemini bildet `/think adaptive` auf Geminis anbieterseitiges dynamic thinking ab. Gemini-3-Anfragen lassen einen festen `thinkingLevel` weg, während Gemini-2.5-Anfragen `thinkingBudget: -1` senden; feste Stufen werden weiterhin auf den nächstliegenden Gemini-`thinkingLevel` oder das nächstliegende Budget für diese Modellsfamilie abgebildet.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern du Thinking nicht explizit in Modellparametern oder Anfrageparametern setzt. Das verhindert auslaufende `reasoning_content`-Deltas aus dem nicht nativen Anthropic-Stream-Format von MiniMax.
  - Z.AI (`zai/*`) unterstützt nur binäres Thinking (`on`/`off`). Jede Stufe außer `off` wird als `on` behandelt (abgebildet auf `low`).
  - Moonshot (`moonshot/*`) bildet `/think off` auf `thinking: { type: "disabled" }` und jede Stufe außer `off` auf `thinking: { type: "enabled" }` ab. Wenn Thinking aktiviert ist, akzeptiert Moonshot nur `tool_choice` `auto|none`; OpenClaw normalisiert inkompatible Werte auf `auto`.

## Reihenfolge der Auflösung

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (gesetzt durch Senden einer Nachricht, die nur aus einer Direktive besteht).
3. Standardwert pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standardwert (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: vom Anbieter deklarierter Standardwert, falls vorhanden; andernfalls werden Reasoning-fähige Modelle zu `medium` oder zur nächstliegenden unterstützten Stufe ungleich `off` für dieses Modell aufgelöst, und Modelle ohne Reasoning bleiben bei `off`.

## Einen Sitzungsstandard festlegen

- Sende eine Nachricht, die **nur** aus der Direktive besteht (Leerraum ist erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender); gelöscht durch `/think:off` oder Zurücksetzen wegen Inaktivität der Sitzung.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungsstatus bleibt unverändert.
- Sende `/think` (oder `/think:`) ohne Argument, um die aktuelle Denkstufe anzuzeigen.

## Anwendung nach Agent

- **Embedded Pi**: Die aufgelöste Stufe wird an die Pi-Agent-Runtime im Prozess übergeben.

## Fast-Modus (/fast)

- Stufen: `on|off`.
- Eine Nachricht nur mit Direktive schaltet eine sitzungsbezogene Überschreibung für den Fast-Modus um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Sende `/fast` (oder `/fast status`) ohne Modus, um den aktuell effektiven Status des Fast-Modus anzuzeigen.
- OpenClaw löst den Fast-Modus in dieser Reihenfolge auf:
  1. Inline-/Direktive-only `/fast on|off`
  2. Sitzungsüberschreibung
  3. Standardwert pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der Fast-Modus auf priorisierte Verarbeitung bei OpenAI abgebildet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Fast-Modus dasselbe Flag `service_tier=priority` bei Codex-Responses. OpenClaw behält einen gemeinsamen Schalter `/fast` für beide Auth-Pfade bei.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich OAuth-authentifiziertem Datenverkehr an `api.anthropic.com`, wird der Fast-Modus auf Anthropic-Service-Tiers abgebildet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Standardwert des Fast-Modus, wenn beide gesetzt sind. OpenClaw überspringt weiterhin die Injektion von Anthropic-Service-Tiers für nicht-Anthropic-Proxy-Base-URLs.
- `/status` zeigt `Fast` nur an, wenn der Fast-Modus aktiviert ist.

## Verbose-Direktiven (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht nur mit Direktive schaltet sitzungsbezogen Verbose um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Status zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; lösche sie über die Sessions-UI, indem du `inherit` auswählst.
- Eine Inline-Direktive gilt nur für diese Nachricht; andernfalls gelten Sitzungs-/globale Standardwerte.
- Sende `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Verbose-Stufe anzuzeigen.
- Wenn Verbose aktiviert ist, senden Agenten, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agenten), jeden Tool-Aufruf als eigene Nachricht nur mit Metadaten zurück, sofern verfügbar mit dem Präfix `<emoji> <tool-name>: <arg>` (Pfad/Befehl). Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Sprechblasen), nicht als Streaming-Deltas.
- Zusammenfassungen von Tool-Fehlern bleiben im normalen Modus sichtbar, aber rohe Fehlersuffixe werden ausgeblendet, sofern Verbose nicht `on` oder `full` ist.
- Wenn Verbose `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Sprechblase, auf eine sichere Länge gekürzt). Wenn du während einer laufenden Ausführung `/verbose on|full|off` umschaltest, berücksichtigen nachfolgende Tool-Sprechblasen die neue Einstellung.

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine Nachricht nur mit Direktive schaltet die sitzungsbezogene Ausgabe von Plugin-Trace um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive gilt nur für diese Nachricht; andernfalls gelten Sitzungs-/globale Standardwerte.
- Sende `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es zeigt nur plugin-eigene Trace-/Debug-Zeilen wie Active-Memory-Debug-Zusammenfassungen an.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnosenachricht nach der normalen Assistentenantwort erscheinen.

## Sichtbarkeit von Reasoning (/reasoning)

- Stufen: `on|off|stream`.
- Eine Nachricht nur mit Direktive schaltet um, ob Thinking-Blöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit dem Präfix `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt Reasoning während der Antworterstellung in die Telegram-Entwurfsblase und sendet dann die endgültige Antwort ohne Reasoning.
- Alias: `/reason`.
- Sende `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe anzuzeigen.
- Reihenfolge der Auflösung: Inline-Direktive, dann Sitzungsüberschreibung, dann Standardwert pro Agent (`agents.list[].reasoningDefault`), dann Fallback (`off`).

## Zugehörig

- Die Dokumentation zum Elevated-Modus befindet sich unter [Elevated-Modus](/de/tools/elevated).

## Heartbeats

- Der Heartbeat-Probe-Text ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie gewohnt (vermeide aber, Sitzungsstandards durch Heartbeats zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die finale Payload. Um zusätzlich die separate `Reasoning:`-Nachricht zu senden (wenn verfügbar), setze `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Web-Chat-UI

- Der Thinking-Selektor im Web-Chat spiegelt beim Laden der Seite die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration wider.
- Die Auswahl einer anderen Stufe schreibt die Sitzungsüberschreibung sofort über `sessions.patch`; sie wartet nicht auf das nächste Senden und ist keine einmalige Überschreibung `thinkingOnce`.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standardwert aus dem Thinking-Profil des Anbieters für das aktive Sitzungsmodell plus derselben Fallback-Logik stammt, die auch `/status` und `session_status` verwenden.
- Der Picker verwendet `thinkingLevels`, die von der Gateway-Sitzungszeile bzw. den Standardwerten zurückgegeben werden, wobei `thinkingOptions` als veraltete Bezeichnungsliste beibehalten wird. Die Browser-UI pflegt keine eigene Regex-Liste für Anbieter; Plugins verwalten modellspezifische Stufensätze.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und der Picker synchron bleiben.

## Anbieterprofile

- Plugin-Anbieter können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standardwert des Modells zu definieren.
- Jede Profilstufe hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann eine Anzeige-`label` enthalten. Binäre Anbieter verwenden `{ id: "low", label: "on" }`.
- Veröffentlichte veraltete Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter bestehen, aber neue benutzerdefinierte Stufensätze sollten `resolveThinkingProfile` verwenden.
- Gateway-Zeilen/-Standards stellen `thinkingLevels`, `thinkingOptions` und `thinkingDefault` bereit, sodass ACP-/Chat-Clients dieselben Profil-IDs und Bezeichnungen rendern, die auch die Laufzeitvalidierung verwendet.
