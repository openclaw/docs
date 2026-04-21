---
read_when:
    - Parsing oder Standardwerte für Thinking-, Fast-Mode- oder Verbose-Direktiven anpassen
summary: Direktivsyntax für /think, /fast, /verbose, /trace und die Sichtbarkeit von Reasoning
title: Thinking-Level
x-i18n:
    generated_at: "2026-04-21T13:38:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b0217f6e5a5cb3400090f31ad5271ca61848a40f77d3f942851e7c2f2352886
    source_path: tools/thinking.md
    workflow: 15
---

# Thinking-Level (/think-Direktiven)

## Was es bewirkt

- Inline-Direktive in jedem eingehenden Body: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Level (Aliase): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „think“
  - low → „think hard“
  - medium → „think harder“
  - high → „ultrathink“ (maximales Budget)
  - xhigh → „ultrathink+“ (GPT-5.2- und Codex-Modelle sowie Anthropic Claude Opus 4.7 effort)
  - adaptive → vom Provider verwaltetes adaptives Thinking (unterstützt für Claude 4.6 auf Anthropic/Bedrock und Anthropic Claude Opus 4.7)
  - max → maximales Provider-Reasoning (derzeit Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden auf `xhigh` abgebildet.
  - `highest` wird auf `high` abgebildet.
- Hinweise zu Providern:
  - Thinking-Menüs und -Picker sind providerprofilgesteuert. Provider-Plugins deklarieren den genauen Level-Satz für das ausgewählte Modell, einschließlich Labels wie binäres `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Provider-/Modellprofile angezeigt, die sie unterstützen. Eingegebene Direktiven für nicht unterstützte Level werden mit den gültigen Optionen dieses Modells abgelehnt.
  - Bereits gespeicherte, nicht unterstützte Level, einschließlich alter `max`-Werte nach einem Modellwechsel, werden auf das höchste unterstützte Level für das ausgewählte Modell umgebildet.
  - Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive`, wenn kein explizites Thinking-Level gesetzt ist.
  - Anthropic Claude Opus 4.7 verwendet standardmäßig kein adaptives Thinking. Sein standardmäßiger API-effort bleibt providerseitig verwaltet, sofern Sie nicht explizit ein Thinking-Level setzen.
  - Anthropic Claude Opus 4.7 bildet `/think xhigh` auf adaptives Thinking plus `output_config.effort: "xhigh"` ab, weil `/think` eine Thinking-Direktive ist und `xhigh` die Opus-4.7-effort-Einstellung ist.
  - Anthropic Claude Opus 4.7 stellt auch `/think max` bereit; dies wird auf denselben providerseitigen Pfad für maximalen effort abgebildet.
  - OpenAI-GPT-Modelle bilden `/think` über modellabhängige Unterstützung für effort in der Responses API ab. `/think off` sendet `reasoning.effort: "none"` nur dann, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Payload weg, statt einen nicht unterstützten Wert zu senden.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Thinking nicht explizit in Modellparametern oder Request-Parametern setzen. Dies verhindert durchgesickerte `reasoning_content`-Deltas aus dem nicht nativen Anthropic-Stream-Format von MiniMax.
  - Z.AI (`zai/*`) unterstützt nur binäres Thinking (`on`/`off`). Jedes andere Level als `off` wird als `on` behandelt (abgebildet auf `low`).
  - Moonshot (`moonshot/*`) bildet `/think off` auf `thinking: { type: "disabled" }` und jedes andere Level als `off` auf `thinking: { type: "enabled" }` ab. Wenn Thinking aktiviert ist, akzeptiert Moonshot für `tool_choice` nur `auto|none`; OpenClaw normalisiert inkompatible Werte auf `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (gesetzt durch Senden einer Nachricht, die nur aus einer Direktive besteht).
3. Standardwert pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standardwert (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Fallback: vom Provider deklarierter Standardwert, falls verfügbar, `low` für andere Katalogmodelle mit aktivierter Reasoning-Fähigkeit, sonst `off`.

## Einen Sitzungsstandard setzen

- Senden Sie eine Nachricht, die **nur** aus der Direktive besteht (Leerraum erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung bestehen (standardmäßig pro Absender); zurückgesetzt durch `/think:off` oder Sitzungs-Idle-Reset.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn das Level ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis abgelehnt und der Sitzungszustand bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um das aktuelle Thinking-Level anzuzeigen.

## Anwendung nach Agent

- **Eingebettetes Pi**: Das aufgelöste Level wird an die In-Process-Agent-Laufzeit von Pi übergeben.

## Fast-Modus (/fast)

- Level: `on|off`.
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet eine Sitzungsüberschreibung für den Fast-Modus um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuell wirksamen Fast-Mode-Status anzuzeigen.
- OpenClaw löst den Fast-Modus in dieser Reihenfolge auf:
  1. Inline-/Direktive-only-`/fast on|off`
  2. Sitzungsüberschreibung
  3. Standardwert pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Fallback: `off`
- Für `openai/*` wird der Fast-Modus auf priorisierte OpenAI-Verarbeitung abgebildet, indem bei unterstützten Responses-Requests `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Fast-Modus dasselbe Flag `service_tier=priority` bei Codex Responses. OpenClaw verwendet einen gemeinsamen `/fast`-Schalter über beide Auth-Pfade hinweg.
- Für direkte öffentliche `anthropic/*`-Requests, einschließlich per OAuth authentifiziertem Traffic an `api.anthropic.com`, wird der Fast-Modus auf Anthropic-Service-Tiers abgebildet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Standard des Fast-Modus, wenn beide gesetzt sind. OpenClaw überspringt weiterhin die Einfügung von Anthropic-Service-Tiers für nicht-Anthropic-Proxy-`baseUrl`s.

## Verbose-Direktiven (/verbose oder /v)

- Level: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet Verbose auf Sitzungsebene um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Level liefern einen Hinweis zurück, ohne den Zustand zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie über die Sessions-UI, indem Sie `inherit` auswählen.
- Eine Inline-Direktive gilt nur für diese Nachricht; Sitzungs-/globale Standardwerte gelten sonst.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um das aktuelle Verbose-Level anzuzeigen.
- Wenn Verbose aktiviert ist, senden Agenten, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agenten), jeden Tool-Aufruf als eigene Nachricht nur mit Metadaten zurück, sofern verfügbar mit Präfix `<emoji> <tool-name>: <arg>` (Pfad/Befehl). Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Bubbles), nicht als Streaming-Deltas.
- Zusammenfassungen von Tool-Fehlern bleiben im normalen Modus sichtbar, aber rohe Detailsuffixe von Fehlern werden ausgeblendet, sofern Verbose nicht `on` oder `full` ist.
- Wenn Verbose `full` ist, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Bubble, auf eine sichere Länge gekürzt). Wenn Sie `/verbose on|full|off` während einer laufenden Ausführung umschalten, berücksichtigen nachfolgende Tool-Bubbles die neue Einstellung.

## Plugin-Trace-Direktiven (/trace)

- Level: `on` | `off` (Standard).
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet die Plugin-Trace-Ausgabe auf Sitzungsebene um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive gilt nur für diese Nachricht; Sitzungs-/globale Standardwerte gelten sonst.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um das aktuelle Trace-Level anzuzeigen.
- `/trace` ist enger als `/verbose`: Es zeigt nur plugin-eigene Trace-/Debug-Zeilen wie Debug-Zusammenfassungen von Active Memory an.
- Trace-Zeilen können in `/status` und als nachfolgende Diagnosenachricht nach der normalen Assistant-Antwort erscheinen.

## Sichtbarkeit von Reasoning (/reasoning)

- Level: `on|off|stream`.
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet um, ob Thinking-Blöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit dem Präfix `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfs-Bubble, während die Antwort erzeugt wird, und sendet dann die finale Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um das aktuelle Reasoning-Level anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungsüberschreibung, dann Standardwert pro Agent (`agents.list[].reasoningDefault`), dann Fallback (`off`).

## Verwandt

- Die Dokumentation zum Elevated mode finden Sie unter [Elevated mode](/de/tools/elevated).

## Heartbeats

- Der Heartbeat-Probe-Body ist der konfigurierte Heartbeat-Prompt (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie aber, Sitzungsstandardwerte über Heartbeats zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die finale Payload. Um zusätzlich die separate `Reasoning:`-Nachricht zu senden (falls verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Web-Chat-UI

- Der Thinking-Selektor im Web-Chat spiegelt beim Laden der Seite das gespeicherte Level der Sitzung aus dem eingehenden Sitzungs-Store bzw. der Konfiguration wider.
- Die Auswahl eines anderen Levels schreibt die Sitzungsüberschreibung sofort über `sessions.patch`; sie wartet nicht auf das nächste Senden und ist keine einmalige `thinkingOnce`-Überschreibung.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standardwert aus dem Thinking-Profil des Providers des aktiven Sitzungsmodells stammt.
- Der Picker verwendet `thinkingOptions`, die von der Gateway-Sitzungszeile zurückgegeben werden. Die Browser-UI verwaltet keine eigene Regex-Liste für Provider; Plugins besitzen die modellspezifischen Level-Sätze.
- `/think:<level>` funktioniert weiterhin und aktualisiert dasselbe gespeicherte Sitzungslevel, sodass Chat-Direktiven und der Picker synchron bleiben.

## Provider-Profile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Level und den Standardwert des Modells zu definieren.
- Jedes Profil-Level hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann ein Anzeige-`label` enthalten. Binäre Provider verwenden `{ id: "low", label: "on" }`.
- Veröffentliche Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter erhalten, aber neue benutzerdefinierte Level-Sätze sollten `resolveThinkingProfile` verwenden.
- Gateway-Zeilen stellen `thinkingOptions` und `thinkingDefault` bereit, sodass ACP/Chat-Clients dasselbe Profil rendern, das auch von der Laufzeitvalidierung verwendet wird.
