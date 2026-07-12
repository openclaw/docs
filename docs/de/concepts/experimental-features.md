---
read_when:
    - Sie sehen einen Konfigurationsschlüssel `.experimental` und möchten wissen, ob er stabil ist
    - Sie möchten Runtime-Funktionen in der Vorschau ausprobieren, ohne sie mit den normalen Standardeinstellungen zu verwechseln
    - Sie möchten eine zentrale Stelle, an der Sie die derzeit dokumentierten experimentellen Flags finden.
summary: Was experimentelle Flags in OpenClaw bedeuten und welche derzeit dokumentiert sind
title: Experimentelle Funktionen
x-i18n:
    generated_at: "2026-07-12T15:17:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1d4f6d066ef80cad2fb8a54c8aecb9fca5b4ed91cd5a3626dad4ad889dc3e8f2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Experimentelle Funktionen sind Opt-in-Vorschaufunktionen hinter expliziten Flags. Sie benötigen mehr Praxiserfahrung, bevor sie eine stabile Standardeinstellung oder einen langfristigen Vertrag erhalten.

- Standardmäßig deaktiviert, sofern Sie nicht in einer Dokumentation zur Aktivierung aufgefordert werden.
- Struktur und Verhalten können sich schneller ändern als stabile Konfigurationen.
- Bevorzugen Sie einen stabilen Weg, wenn bereits einer vorhanden ist.
- Führen Sie eine breite Einführung erst nach Tests in einer kleineren Umgebung durch.

## Derzeit dokumentierte Flags

| Oberfläche                 | Schlüssel                                                                                  | Verwenden, wenn                                                                                                                    | Weitere Informationen                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Lokale Modelllaufzeit      | `agents.defaults.experimental.localModelLean`, `agents.list[].experimental.localModelLean` | Ein kleineres oder strengeres lokales Backend mit der vollständigen standardmäßigen Tool-Oberfläche von OpenClaw nicht zurechtkommt | [Lokale Modelle](/de/gateway/local-models)                                                                |
| Speichersuche              | `agents.defaults.memorySearch.experimental.sessionMemory`                                  | Sie möchten, dass `memory_search` frühere Sitzungstranskripte indiziert, und akzeptieren die zusätzlichen Speicher-/Indizierungskosten | [Referenz zur Speicherkonfiguration](/de/reference/memory-config#session-memory-search-experimental)       |
| Codex-Harness              | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                    | Sie möchten, dass der native Codex-App-Server 0.132.0 oder neuer einen durch eine OpenClaw-Sandbox gestützten Exec-Server verwendet, statt den Code-Modus zu deaktivieren | [Referenz zum Codex-Harness](/de/plugins/codex-harness-reference#sandboxed-native-execution)               |
| Strukturiertes Planungstool | `tools.experimental.planTool`                                                             | Sie möchten das strukturierte Tool `update_plan` zur Verfolgung mehrstufiger Arbeiten in kompatiblen Laufzeiten und Benutzeroberflächen bereitstellen | [Referenz zur Gateway-Konfiguration](/de/gateway/config-tools#toolsexperimental)                           |

## Schlanker Modus für lokale Modelle

`agents.defaults.experimental.localModelLean: true` entfernt bei jedem Durchlauf umfangreiche optionale Tools aus der direkten Oberfläche des Agenten: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` und `pdf`. Explizit erlaubte oder für die Zustellung erforderliche Tools bleiben verfügbar, allerdings kann die Tool-Suche sie katalogisieren, statt sie direkt bereitzustellen. Wenn `tools.toolSearch` noch nicht festgelegt ist, verwendet der schlanke Modus außerdem standardmäßig die strukturierte Tool-Suche (`tool_search`, `tool_describe`, `tool_call`) für Plugin-/MCP-/Client-Kataloge. Verwenden Sie `agents.list[].experimental.localModelLean`, um dies auf einen einzelnen Agenten zu beschränken.

Wenn Sie die Tool-Suche bereits global konfigurieren, lässt OpenClaw diese Konfiguration unverändert. Legen Sie `tools.toolSearch: false` fest, um die standardmäßige Tool-Suche des schlanken Modus zu deaktivieren.

Im strukturierten `tools`-Modus bleibt bei schlanken Durchläufen `exec` neben den Steuerelementen der Tool-Suche direkt sichtbar, damit für das Programmieren optimierte lokale Modelle weiterhin ihren vertrauten Shell-Pfad wählen können. Dadurch ändert sich nur die Sichtbarkeit des Schemas: Die normale Tool-Richtlinie, das Sandboxing und die Exec-Genehmigungen gelten weiterhin. Die expliziten Modi `code` und `directory` behalten ihr normales Compaction-Verhalten bei.

### Warum diese Tools

Diese Tools haben die umfangreichsten Beschreibungen, die breitesten Parameterstrukturen oder die höchste Wahrscheinlichkeit, ein kleines Modell vom normalen Programmier- und Konversationsablauf abzulenken. Bei einem Backend mit kleinem Kontext oder strenger OpenAI-Kompatibilität macht dies den Unterschied zwischen:

- Tool-Schemas, die in den Prompt passen, und solchen, die den Konversationsverlauf verdrängen.
- Dem Modell, das das richtige Tool auswählt, und fehlerhaften Tool-Aufrufen aufgrund zu vieler ähnlicher Schemas.
- Dem Chat-Completions-Adapter, der innerhalb der Grenzen für strukturierte Ausgaben bleibt, und einem 400-Fehler aufgrund der Nutzlastgröße von Tool-Aufrufen.

Ihre Entfernung verkürzt lediglich die direkte Tool-Liste. Dem Modell stehen weiterhin `read`, `write`, `edit`, `exec`, `apply_patch`, Bildverständnis, Websuche/-abruf (wenn konfiguriert), Speicher sowie Sitzungs-/Agenten-Tools zur Verfügung. Zusätzliche Kataloge bleiben über die Tool-Suche erreichbar, sofern Sie nicht `tools.toolSearch: false` festlegen; durch explizite Tool-Freigaben kann ein schlanker Agent wieder auf einen reduzierten Arbeitsablauf zugreifen.

### Wann Sie ihn aktivieren sollten

Aktivieren Sie den schlanken Modus, sobald Sie nachgewiesen haben, dass das Modell mit dem Gateway kommunizieren kann, vollständige Agentendurchläufe jedoch fehlerhaft funktionieren:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` ist erfolgreich.
2. Ein normaler Agentendurchlauf schlägt aufgrund fehlerhafter Tool-Aufrufe oder übergroßer Prompts fehl oder weil das Modell seine Tools ignoriert.
3. Das Umschalten auf `localModelLean: true` behebt den Fehler.

### Wann Sie ihn deaktiviert lassen sollten

Wenn Ihr Backend die vollständige Standardlaufzeit problemlos verarbeitet, lassen Sie diese Option deaktiviert. Sie ist eine Umgehungslösung für lokale Stacks, die eine kleinere Tool-Oberfläche benötigen, und keine Standardeinstellung für gehostete Modelle oder gut ausgestattete lokale Systeme.

Der schlanke Modus ersetzt weder `tools.profile`, `tools.allow`/`tools.deny` noch den Ausweichmechanismus `compat.supportsTools: false` des Modells. Für eine dauerhaft eingeschränkte Tool-Oberfläche eines bestimmten Agenten sollten Sie diese stabilen Einstellungen bevorzugen.

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

Starten Sie das Gateway nach dem Ändern des Flags neu. Die schlanke Filterung entfernt `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` und `pdf`, sofern Sie sie nicht explizit mit `tools.allow` oder `tools.alsoAllow` beibehalten; die Tool-Suche kann beibehaltene Tools weiterhin katalogisieren, statt sie direkt bereitzustellen.

## Experimentell bedeutet nicht verborgen

Eine experimentelle Funktion sollte in der Dokumentation und im Konfigurationspfad selbst klar als solche gekennzeichnet sein und nicht hinter einer stabil wirkenden Standardeinstellung verborgen werden.

## Verwandte Themen

- [Funktionen](/de/concepts/features)
- [Veröffentlichungskanäle](/de/install/development-channels)
