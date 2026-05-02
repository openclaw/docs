---
read_when:
    - Sie sehen einen `.experimental`-Konfigurationsschlüssel und möchten wissen, ob er stabil ist
    - Sie möchten Vorschau-Runtime-Funktionen ausprobieren, ohne sie mit den normalen Standardwerten zu verwechseln
    - Sie möchten eine zentrale Stelle, um die aktuell dokumentierten experimentellen Flags zu finden
summary: Was experimentelle Flags in OpenClaw bedeuten und welche derzeit dokumentiert sind
title: Experimentelle Funktionen
x-i18n:
    generated_at: "2026-05-02T22:17:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 066efa297bac995597f1092ed6473d9cff28c01d7e28fa1382d7997f8f83a346
    source_path: concepts/experimental-features.md
    workflow: 16
---

Experimentelle Funktionen in OpenClaw sind **Opt-in-Vorschauflächen**. Sie liegen
hinter expliziten Flags, weil sie noch Erprobung im realen Einsatz benötigen,
bevor sie einen stabilen Standard oder einen langlebigen öffentlichen Vertrag
verdienen.

Behandeln Sie sie anders als normale Konfiguration:

- Lassen Sie sie **standardmäßig deaktiviert**, sofern die zugehörige Dokumentation Sie nicht auffordert, eine davon auszuprobieren.
- Rechnen Sie damit, dass sich **Form und Verhalten** schneller ändern als bei stabiler Konfiguration.
- Bevorzugen Sie zuerst den stabilen Pfad, wenn bereits einer vorhanden ist.
- Wenn Sie OpenClaw breit ausrollen, testen Sie experimentelle Flags in einer kleineren
  Umgebung, bevor Sie sie in eine gemeinsame Baseline übernehmen.

## Derzeit dokumentierte Flags

| Oberfläche               | Schlüssel                                                 | Verwenden Sie es, wenn                                                                                         | Mehr                                                                                          |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Lokale Modelllaufzeit    | `agents.defaults.experimental.localModelLean`             | Ein kleineres oder strengeres lokales Backend mit OpenClaws vollständiger standardmäßiger Tool-Oberfläche überfordert ist | [Lokale Modelle](/de/gateway/local-models)                                                       |
| Speichersuche            | `agents.defaults.memorySearch.experimental.sessionMemory` | Sie möchten, dass `memory_search` frühere Sitzungstranskripte indexiert, und akzeptieren die zusätzlichen Speicher-/Indexierungskosten | [Referenz zur Speicherkonfiguration](/de/reference/memory-config#session-memory-search-experimental) |
| Strukturiertes Planungstool | `tools.experimental.planTool`                          | Sie möchten das strukturierte Tool `update_plan` für die Nachverfolgung mehrstufiger Arbeit in kompatiblen Laufzeiten und UIs verfügbar machen | [Gateway-Konfigurationsreferenz](/de/gateway/config-tools#toolsexperimental)                    |

## Schlanker Modus für lokale Modelle

`agents.defaults.experimental.localModelLean: true` ist ein Entlastungsventil für schwächere Setups mit lokalen Modellen. Wenn es aktiviert ist, entfernt OpenClaw drei Standardtools — `browser`, `cron` und `message` — aus der Tool-Oberfläche des Agenten für jeden Turn. Sonst ändert sich nichts.

### Warum diese drei Tools

Diese drei Tools haben die umfangreichsten Beschreibungen und die meisten Parameterformen in der standardmäßigen OpenClaw-Laufzeit. Auf einem Backend mit kleinem Kontext oder einem strengeren OpenAI-kompatiblen Backend macht das den Unterschied zwischen:

- Tool-Schemas, die sauber in den Prompt passen, statt den Gesprächsverlauf zu verdrängen.
- Dem Modell, das das richtige Tool auswählt, statt fehlerhafte Tool-Aufrufe auszugeben, weil es zu viele ähnlich aussehende Schemas gibt.
- Dem Chat-Completions-Adapter, der innerhalb der Structured-Output-Grenzen des Servers bleibt, statt wegen der Payload-Größe von Tool-Aufrufen einen 400-Fehler auszulösen.

Das Entfernen dieser Tools verdrahtet OpenClaw nicht stillschweigend neu — es verkürzt nur die Tool-Liste. Dem Modell stehen weiterhin `read`, `write`, `edit`, `exec`, `apply_patch`, Websuche/-Abruf (wenn konfiguriert), Speicher sowie Sitzungs-/Agenten-Tools zur Verfügung.

### Wann Sie ihn aktivieren sollten

Aktivieren Sie den schlanken Modus, wenn Sie bereits nachgewiesen haben, dass das Modell mit dem Gateway sprechen kann, vollständige Agenten-Turns sich aber fehlerhaft verhalten. Die typische Signalkette ist:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` ist erfolgreich.
2. Ein normaler Agenten-Turn schlägt mit fehlerhaften Tool-Aufrufen, übergroßen Prompts oder einem Modell fehl, das seine Tools ignoriert.
3. Das Umschalten von `localModelLean: true` behebt den Fehler.

### Wann Sie ihn deaktiviert lassen sollten

Wenn Ihr Backend die vollständige Standardlaufzeit sauber verarbeitet, lassen Sie dies deaktiviert. Der schlanke Modus ist ein Workaround, kein Standard. Er existiert, weil einige lokale Stacks eine kleinere Tool-Oberfläche benötigen, um zuverlässig zu funktionieren; gehostete Modelle und gut ausgestattete lokale Systeme benötigen ihn nicht.

Der schlanke Modus ersetzt außerdem nicht `tools.profile`, `tools.allow`/`tools.deny` oder die Ausweichoption `compat.supportsTools: false` des Modells. Wenn Sie für einen bestimmten Agenten dauerhaft eine schmalere Tool-Oberfläche benötigen, bevorzugen Sie diese stabilen Stellschrauben gegenüber dem experimentellen Flag.

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

Starten Sie den Gateway nach dem Ändern des Flags neu und bestätigen Sie anschließend die gekürzte Tool-Liste mit:

```bash
openclaw status --deep
```

Die ausführliche Statusausgabe listet die aktiven Agenten-Tools auf; `browser`, `cron` und `message` sollten fehlen, wenn der schlanke Modus aktiviert ist.

## Experimentell bedeutet nicht versteckt

Wenn eine Funktion experimentell ist, sollte OpenClaw dies in der Dokumentation und im
Konfigurationspfad selbst klar sagen. Was es **nicht** tun sollte, ist Vorschauverhalten in eine
stabil wirkende Standardstellschraube einzuschleusen und so zu tun, als wäre das normal. So werden
Konfigurationsoberflächen unübersichtlich.

## Verwandt

- [Funktionen](/de/concepts/features)
- [Release-Kanäle](/de/install/development-channels)
