---
read_when:
    - Sie sehen einen `.experimental`-Konfigurationsschlüssel und möchten wissen, ob er stabil ist
    - Sie möchten Vorschau-Runtime-Funktionen ausprobieren, ohne sie mit den normalen Standardeinstellungen zu verwechseln
    - Sie möchten an einem Ort die derzeit dokumentierten experimentellen Flags finden
summary: Was experimentelle Flags in OpenClaw bedeuten und welche derzeit dokumentiert sind
title: Experimentelle Funktionen
x-i18n:
    generated_at: "2026-06-27T17:23:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0f42e6b574c5db9508412c9c5d9919d1a54a16fe00edea43664f3a01e8e38f5
    source_path: concepts/experimental-features.md
    workflow: 16
---

Experimentelle Funktionen in OpenClaw sind **Opt-in-Vorschauflächen**. Sie befinden sich
hinter expliziten Flags, weil sie noch Praxiserfahrung benötigen, bevor sie
einen stabilen Standard oder einen langlebigen öffentlichen Vertrag verdienen.

Behandeln Sie sie anders als normale Konfiguration:

- Lassen Sie sie **standardmäßig deaktiviert**, sofern die zugehörige Dokumentation Sie nicht auffordert, eines auszuprobieren.
- Rechnen Sie damit, dass sich **Form und Verhalten** schneller ändern als bei stabiler Konfiguration.
- Bevorzugen Sie zuerst den stabilen Weg, wenn bereits einer existiert.
- Wenn Sie OpenClaw breit ausrollen, testen Sie experimentelle Flags in einer kleineren
  Umgebung, bevor Sie sie in eine gemeinsame Baseline übernehmen.

## Derzeit dokumentierte Flags

| Fläche                   | Schlüssel                                                                                  | Verwenden Sie es, wenn                                                                                                            | Mehr                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Lokale Modelllaufzeit    | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Ein kleineres oder strengeres lokales Backend an OpenClaws vollständiger Standard-Tool-Fläche scheitert                           | [Lokale Modelle](/de/gateway/local-models)                                                       |
| Speichersuche            | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Sie möchten, dass `memory_search` frühere Sitzungstranskripte indexiert, und akzeptieren die zusätzlichen Speicher-/Indexierungskosten | [Speicherkonfigurationsreferenz](/de/reference/memory-config#session-memory-search-experimental) |
| Codex-Harness            | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Sie möchten, dass der native Codex app-server 0.132.0 oder neuer einen von der OpenClaw-Sandbox gestützten exec-server ansteuert, statt den Code-Modus zu deaktivieren | [Codex-Harness-Referenz](/de/plugins/codex-harness-reference#sandboxed-native-execution)         |
| Strukturiertes Planungstool | `tools.experimental.planTool`                                                           | Sie möchten das strukturierte Tool `update_plan` für die Nachverfolgung mehrstufiger Arbeit in kompatiblen Laufzeiten und UIs verfügbar machen | [Gateway-Konfigurationsreferenz](/de/gateway/config-tools#toolsexperimental)                     |

## Schlanker Modus für lokale Modelle

`agents.defaults.experimental.localModelLean: true` ist ein Entlastungsventil für schwächere Setups mit lokalen Modellen. Wenn es aktiviert ist, entfernt OpenClaw drei Standard-Tools - `browser`, `cron` und `message` - bei jedem Turn aus der Tool-Fläche des Agenten. Außerdem wird dieser Lauf standardmäßig auf strukturierte Tool Search-Steuerelemente gesetzt, wenn `tools.toolSearch` nicht explizit konfiguriert ist, sodass größere Plugin-, MCP- oder Client-Tool-Kataloge hinter `tool_search`, `tool_describe` und `tool_call` bleiben, statt in den Prompt gekippt zu werden. Läufe, die eine direkte `message`-Zustellung erfordern, behalten dieses Tool direkt, statt den Tool Search-Standard des schlanken Modus zu aktivieren. Verwenden Sie `agents.list[].experimental.localModelLean`, um dasselbe Verhalten für einen konfigurierten Agenten zu aktivieren oder zu deaktivieren.

### Warum diese drei Tools

Diese drei Tools haben die größten Beschreibungen und die meisten Parameterformen in der Standardlaufzeit von OpenClaw. Bei einem Backend mit kleinem Kontext oder einem strengeren OpenAI-kompatiblen Backend ist das der Unterschied zwischen:

- Tool-Schemas, die sauber in den Prompt passen, und solchen, die den Gesprächsverlauf verdrängen.
- Dem Modell, das das richtige Tool auswählt, und fehlerhaft formatierten Tool-Aufrufen, weil es zu viele ähnlich aussehende Schemas gibt.
- Dem Chat Completions-Adapter, der innerhalb der strukturierten Ausgabelimits des Servers bleibt, und einem 400-Fehler wegen der Payload-Größe von Tool-Aufrufen.

Ihre Entfernung verdrahtet OpenClaw nicht stillschweigend neu - sie verkürzt lediglich die direkte Tool-Liste. Dem Modell stehen weiterhin `read`, `write`, `edit`, `exec`, `apply_patch`, Websuche/Abruf (wenn konfiguriert), Speicher sowie Sitzungs-/Agenten-Tools zur Verfügung. Zusätzliche Kataloge bleiben über Tool Search aufrufbar, sofern Sie nicht explizit `tools.toolSearch: false` setzen.

### Wann Sie ihn aktivieren sollten

Aktivieren Sie den schlanken Modus, wenn Sie bereits nachgewiesen haben, dass das Modell mit dem Gateway sprechen kann, vollständige Agenten-Turns sich aber falsch verhalten. Die typische Signalkette ist:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` ist erfolgreich.
2. Ein normaler Agenten-Turn schlägt mit fehlerhaft formatierten Tool-Aufrufen, übergroßen Prompts oder einem Modell fehl, das seine Tools ignoriert.
3. Das Umschalten von `localModelLean: true` behebt den Fehler.

### Wann Sie ihn deaktiviert lassen sollten

Wenn Ihr Backend die vollständige Standardlaufzeit sauber verarbeitet, lassen Sie dies deaktiviert. Der schlanke Modus ist ein Workaround, kein Standard. Er existiert, weil einige lokale Stacks eine kleinere Tool-Fläche benötigen, um sich korrekt zu verhalten; gehostete Modelle und gut ausgestattete lokale Setups benötigen das nicht.

Der schlanke Modus ersetzt außerdem nicht `tools.profile`, `tools.allow`/`tools.deny` oder den Ausweg `compat.supportsTools: false` des Modells. Wenn Sie für einen bestimmten Agenten dauerhaft eine schmalere Tool-Fläche benötigen, bevorzugen Sie diese stabilen Stellschrauben gegenüber dem experimentellen Flag.

Wenn Sie Tool Search bereits global anpassen, lässt OpenClaw diese Betreiberkonfiguration unverändert. Setzen Sie `tools.toolSearch: false`, um den Tool Search-Standard des schlanken Modus abzuwählen.

### Aktivieren

```json5
{
  agents: {
    defaults: {
      experimental: {
        localModelLean: true,
      },
    },
  },
}
```

Nur für einen Agenten:

```json5
{
  agents: {
    list: [
      {
        id: "local",
        model: "lmstudio/gemma-4-e4b-it",
        experimental: {
          localModelLean: true,
        },
      },
    ],
  },
}
```

Starten Sie das Gateway nach dem Ändern des Flags neu und bestätigen Sie anschließend die gekürzte Tool-Liste mit:

```bash
openclaw status --deep
```

Die ausführliche Statusausgabe listet die aktiven Agenten-Tools auf; `browser`, `cron` und `message` sollten fehlen, wenn der schlanke Modus aktiviert ist, es sei denn, der aktuelle Zustellmodus erzwingt direkte `message`-Antworten.

## Experimentell bedeutet nicht versteckt

Wenn eine Funktion experimentell ist, sollte OpenClaw dies in der Dokumentation und im
Konfigurationspfad selbst klar sagen. Was es **nicht** tun sollte, ist Vorschauverhalten in eine
stabil aussehende Standardstellschraube hineinzuschmuggeln und so zu tun, als sei das normal. So werden
Konfigurationsflächen unübersichtlich.

## Verwandt

- [Funktionen](/de/concepts/features)
- [Release-Kanäle](/de/install/development-channels)
