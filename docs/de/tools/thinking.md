---
read_when:
    - Anpassen der Verarbeitung oder Standardwerte für Direktiven zu Denkniveau, Fast-Modus oder Ausführlichkeit
summary: Direktivsyntax für /think, /fast, /verbose, /trace und Sichtbarkeit der Begründung
title: Denkstufen
x-i18n:
    generated_at: "2026-04-21T19:21:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: c77f6f1318c428bbd21725ea5f32f8088506a10cbbf5b5cbca5973c72a5a81f9
    source_path: tools/thinking.md
    workflow: 15
---

# Denkstufen (/think-Direktiven)

## Was es bewirkt

- Inline-Direktive in jedem eingehenden Text: `/t <level>`, `/think:<level>` oder `/thinking <level>`.
- Stufen (Aliasse): `off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → „denken“
  - low → „intensiv denken“
  - medium → „noch intensiver denken“
  - high → „ultrathink“ (maximales Budget)
  - xhigh → „ultrathink+“ (GPT-5.2 + Codex-Modelle und Anthropic Claude Opus 4.7-Aufwand)
  - adaptive → vom Anbieter verwaltetes adaptives Denken (unterstützt für Claude 4.6 auf Anthropic/Bedrock und Anthropic Claude Opus 4.7)
  - max → maximales Reasoning des Anbieters (derzeit Anthropic Claude Opus 4.7)
  - `x-high`, `x_high`, `extra-high`, `extra high` und `extra_high` werden auf `xhigh` abgebildet.
  - `highest` wird auf `high` abgebildet.
- Hinweise zu Anbietern:
  - Menüs und Auswahllisten für Denkstufen werden durch Anbieterprofile gesteuert. Provider-Plugins deklarieren die genaue Stufenmenge für das ausgewählte Modell, einschließlich Bezeichnungen wie dem binären `on`.
  - `adaptive`, `xhigh` und `max` werden nur für Anbieter-/Modellprofile angezeigt, die sie unterstützen. Getippte Direktiven für nicht unterstützte Stufen werden mit den gültigen Optionen dieses Modells zurückgewiesen.
  - Bereits gespeicherte, nicht unterstützte Stufen werden anhand des Rangs des Anbieterprofils neu zugeordnet. `adaptive` fällt bei nicht adaptiven Modellen auf `medium` zurück, während `xhigh` und `max` auf die größte unterstützte Stufe ungleich `off` für das ausgewählte Modell zurückfallen.
  - Anthropic Claude 4.6-Modelle verwenden standardmäßig `adaptive`, wenn keine explizite Denkstufe gesetzt ist.
  - Anthropic Claude Opus 4.7 verwendet adaptives Denken nicht standardmäßig. Der Standardwert für den API-Aufwand bleibt vom Anbieter gesteuert, sofern Sie nicht explizit eine Denkstufe setzen.
  - Anthropic Claude Opus 4.7 ordnet `/think xhigh` adaptivem Denken plus `output_config.effort: "xhigh"` zu, weil `/think` eine Denk-Direktive ist und `xhigh` die Aufwandseinstellung von Opus 4.7 ist.
  - Anthropic Claude Opus 4.7 stellt auch `/think max` bereit; es wird auf denselben vom Anbieter gesteuerten Pfad für maximalen Aufwand abgebildet.
  - OpenAI-GPT-Modelle bilden `/think` über die modellspezifische Unterstützung für Aufwand in der Responses API ab. `/think off` sendet `reasoning.effort: "none"` nur, wenn das Zielmodell dies unterstützt; andernfalls lässt OpenClaw die deaktivierte Reasoning-Nutzlast weg, statt einen nicht unterstützten Wert zu senden.
  - MiniMax (`minimax/*`) auf dem Anthropic-kompatiblen Streaming-Pfad verwendet standardmäßig `thinking: { type: "disabled" }`, sofern Sie Denken nicht explizit in den Modellparametern oder Anfrageparametern setzen. Dadurch werden durchgesickerte `reasoning_content`-Deltas aus dem nicht nativen Anthropic-Streamformat von MiniMax vermieden.
  - Z.AI (`zai/*`) unterstützt nur binäres Denken (`on`/`off`). Jede Stufe ungleich `off` wird als `on` behandelt (auf `low` abgebildet).
  - Moonshot (`moonshot/*`) bildet `/think off` auf `thinking: { type: "disabled" }` und jede Stufe ungleich `off` auf `thinking: { type: "enabled" }` ab. Wenn Denken aktiviert ist, akzeptiert Moonshot für `tool_choice` nur `auto|none`; OpenClaw normalisiert inkompatible Werte auf `auto`.

## Auflösungsreihenfolge

1. Inline-Direktive in der Nachricht (gilt nur für diese Nachricht).
2. Sitzungsüberschreibung (gesetzt durch Senden einer Nachricht, die nur aus einer Direktive besteht).
3. Standard pro Agent (`agents.list[].thinkingDefault` in der Konfiguration).
4. Globaler Standard (`agents.defaults.thinkingDefault` in der Konfiguration).
5. Rückfall: vom Anbieter deklarierter Standard, falls verfügbar, `low` für andere Katalogmodelle mit Reasoning-Fähigkeit, andernfalls `off`.

## Einen Sitzungsstandard festlegen

- Senden Sie eine Nachricht, die **nur** aus der Direktive besteht (Leerraum erlaubt), z. B. `/think:medium` oder `/t high`.
- Das bleibt für die aktuelle Sitzung erhalten (standardmäßig pro Absender); wird durch `/think:off` oder einen Sitzungs-Idle-Reset gelöscht.
- Eine Bestätigungsantwort wird gesendet (`Thinking level set to high.` / `Thinking disabled.`). Wenn die Stufe ungültig ist (z. B. `/thinking big`), wird der Befehl mit einem Hinweis zurückgewiesen und der Sitzungszustand bleibt unverändert.
- Senden Sie `/think` (oder `/think:`) ohne Argument, um die aktuelle Denkstufe anzuzeigen.

## Anwendung nach Agent

- **Embedded Pi**: Die aufgelöste Stufe wird an die In-Process-Laufzeit des Pi-Agenten übergeben.

## Fast-Modus (/fast)

- Stufen: `on|off`.
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet eine Sitzungsüberschreibung für den Fast-Modus um und antwortet mit `Fast mode enabled.` / `Fast mode disabled.`.
- Senden Sie `/fast` (oder `/fast status`) ohne Modus, um den aktuell wirksamen Fast-Modus-Status anzuzeigen.
- OpenClaw löst den Fast-Modus in dieser Reihenfolge auf:
  1. Inline-/direktivenbasiert nur `/fast on|off`
  2. Sitzungsüberschreibung
  3. Standard pro Agent (`agents.list[].fastModeDefault`)
  4. Konfiguration pro Modell: `agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. Rückfall: `off`
- Für `openai/*` wird der Fast-Modus auf priorisierte OpenAI-Verarbeitung abgebildet, indem bei unterstützten Responses-Anfragen `service_tier=priority` gesendet wird.
- Für `openai-codex/*` sendet der Fast-Modus dasselbe Flag `service_tier=priority` bei Codex-Responses. OpenClaw verwendet einen gemeinsamen Schalter `/fast` über beide Auth-Pfade hinweg.
- Für direkte öffentliche `anthropic/*`-Anfragen, einschließlich OAuth-authentifiziertem Verkehr an `api.anthropic.com`, wird der Fast-Modus auf Anthropic-Service-Tiers abgebildet: `/fast on` setzt `service_tier=auto`, `/fast off` setzt `service_tier=standard_only`.
- Für `minimax/*` auf dem Anthropic-kompatiblen Pfad schreibt `/fast on` (oder `params.fastMode: true`) `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` um.
- Explizite Anthropic-Modellparameter `serviceTier` / `service_tier` überschreiben den Fast-Modus-Standard, wenn beide gesetzt sind. OpenClaw überspringt weiterhin die Einfügung von Anthropic-Service-Tiers für nicht-Anthropic-Proxy-Basis-URLs.

## Direktiven für Ausführlichkeit (/verbose oder /v)

- Stufen: `on` (minimal) | `full` | `off` (Standard).
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet die Sitzungsausführlichkeit um und antwortet mit `Verbose logging enabled.` / `Verbose logging disabled.`; ungültige Stufen geben einen Hinweis zurück, ohne den Zustand zu ändern.
- `/verbose off` speichert eine explizite Sitzungsüberschreibung; löschen Sie sie in der Sitzungen-UI, indem Sie `inherit` wählen.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; Sitzungs-/globale Standards gelten sonst.
- Senden Sie `/verbose` (oder `/verbose:`) ohne Argument, um die aktuelle Ausführlichkeitsstufe anzuzeigen.
- Wenn die Ausführlichkeit aktiviert ist, senden Agents, die strukturierte Tool-Ergebnisse ausgeben (Pi, andere JSON-Agents), jeden Tool-Aufruf als eigene Nur-Metadaten-Nachricht zurück, sofern verfügbar mit dem Präfix `<emoji> <tool-name>: <arg>` (Pfad/Befehl). Diese Tool-Zusammenfassungen werden gesendet, sobald jedes Tool startet (separate Nachrichtenblasen), nicht als Streaming-Deltas.
- Zusammenfassungen von Tool-Fehlern bleiben im normalen Modus sichtbar, aber rohe Fehlerdetailsuffixe werden ausgeblendet, sofern `verbose` nicht `on` oder `full` ist.
- Wenn `verbose` auf `full` steht, werden Tool-Ausgaben nach Abschluss ebenfalls weitergeleitet (separate Blase, auf eine sichere Länge gekürzt). Wenn Sie `/verbose on|full|off` während eines laufenden Vorgangs umschalten, beachten nachfolgende Tool-Blasen die neue Einstellung.

## Plugin-Trace-Direktiven (/trace)

- Stufen: `on` | `off` (Standard).
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet die Plugin-Trace-Ausgabe der Sitzung um und antwortet mit `Plugin trace enabled.` / `Plugin trace disabled.`.
- Eine Inline-Direktive wirkt sich nur auf diese Nachricht aus; Sitzungs-/globale Standards gelten sonst.
- Senden Sie `/trace` (oder `/trace:`) ohne Argument, um die aktuelle Trace-Stufe anzuzeigen.
- `/trace` ist enger gefasst als `/verbose`: Es zeigt nur Plugin-eigene Trace-/Debug-Zeilen wie Active Memory-Debugzusammenfassungen an.
- Trace-Zeilen können in `/status` und als diagnostische Folgemeldung nach der normalen Assistant-Antwort erscheinen.

## Sichtbarkeit von Reasoning (/reasoning)

- Stufen: `on|off|stream`.
- Eine Nachricht, die nur aus einer Direktive besteht, schaltet um, ob Thinking-Blöcke in Antworten angezeigt werden.
- Wenn aktiviert, wird Reasoning als **separate Nachricht** mit dem Präfix `Reasoning:` gesendet.
- `stream` (nur Telegram): streamt Reasoning in die Telegram-Entwurfsblase, während die Antwort erzeugt wird, und sendet dann die endgültige Antwort ohne Reasoning.
- Alias: `/reason`.
- Senden Sie `/reasoning` (oder `/reasoning:`) ohne Argument, um die aktuelle Reasoning-Stufe anzuzeigen.
- Auflösungsreihenfolge: Inline-Direktive, dann Sitzungsüberschreibung, dann Standard pro Agent (`agents.list[].reasoningDefault`), dann Rückfall (`off`).

## Verwandt

- Die Dokumentation zum Elevated-Modus befindet sich unter [Elevated mode](/de/tools/elevated).

## Heartbeats

- Der Nachrichtentext für Heartbeat-Probes ist die konfigurierte Heartbeat-Eingabeaufforderung (Standard: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`). Inline-Direktiven in einer Heartbeat-Nachricht gelten wie üblich (vermeiden Sie es jedoch, Sitzungsstandards durch Heartbeats zu ändern).
- Die Heartbeat-Zustellung verwendet standardmäßig nur die endgültige Nutzlast. Um zusätzlich die separate Nachricht `Reasoning:` zu senden (falls verfügbar), setzen Sie `agents.defaults.heartbeat.includeReasoning: true` oder pro Agent `agents.list[].heartbeat.includeReasoning: true`.

## Web-Chat-UI

- Der Thinking-Selektor im Web-Chat spiegelt beim Laden der Seite die gespeicherte Stufe der Sitzung aus dem eingehenden Sitzungsspeicher bzw. der Konfiguration wider.
- Das Auswählen einer anderen Stufe schreibt die Sitzungsüberschreibung sofort über `sessions.patch`; es wartet nicht auf das nächste Senden und ist keine einmalige Überschreibung `thinkingOnce`.
- Die erste Option ist immer `Default (<resolved level>)`, wobei der aufgelöste Standard aus dem Thinking-Profil des Anbieters für das aktive Sitzungsmodell stammt.
- Die Auswahl verwendet `thinkingOptions`, die von der Gateway-Sitzungszeile zurückgegeben werden. Die Browser-UI führt keine eigene Regex-Liste für Anbieter; Plugins besitzen die modellspezifischen Stufenmengen.
- `/think:<level>` funktioniert weiterhin und aktualisiert dieselbe gespeicherte Sitzungsstufe, sodass Chat-Direktiven und die Auswahl synchron bleiben.

## Anbieterprofile

- Provider-Plugins können `resolveThinkingProfile(ctx)` bereitstellen, um die unterstützten Stufen und den Standard des Modells zu definieren.
- Jede Profilstufe hat eine gespeicherte kanonische `id` (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive` oder `max`) und kann eine Anzeige-`label` enthalten. Binäre Anbieter verwenden `{ id: "low", label: "on" }`.
- Veröffentlichten Legacy-Hooks (`supportsXHighThinking`, `isBinaryThinking` und `resolveDefaultThinkingLevel`) bleiben als Kompatibilitätsadapter erhalten, aber neue benutzerdefinierte Stufenmengen sollten `resolveThinkingProfile` verwenden.
- Gateway-Zeilen stellen `thinkingOptions` und `thinkingDefault` bereit, damit ACP-/Chat-Clients dasselbe Profil rendern, das auch die Laufzeitvalidierung verwendet.
