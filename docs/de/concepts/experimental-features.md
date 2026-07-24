---
read_when:
    - Sie sehen einen Konfigurationsschlüssel `.experimental` und möchten wissen, ob er stabil ist
    - Sie möchten Runtime-Funktionen in der Vorschau testen, ohne sie mit den regulären Standardeinstellungen zu verwechseln
    - Sie möchten eine zentrale Stelle, an der Sie die derzeit dokumentierten experimentellen Flags finden können
summary: Was experimentelle Flags in OpenClaw bedeuten und welche derzeit dokumentiert sind
title: Experimentelle Funktionen
x-i18n:
    generated_at: "2026-07-24T03:45:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 6c14b74bbafce77c0d1e1358ad94053675c4aad9e26be78719f58e78f455c3a2
    source_path: concepts/experimental-features.md
    workflow: 16
---

Experimentelle Funktionen sind Vorschaufunktionen hinter expliziten Flags. Sie benötigen mehr Praxiserfahrung, bevor sie eine stabile Standardeinstellung oder einen langfristigen Vertrag erhalten.

- Standardmäßig deaktiviert, sofern eine Dokumentation keine eng begrenzte Regel für die automatische Einrichtung beschreibt.
- Struktur und Verhalten können sich schneller ändern als stabile Konfigurationen.
- Bevorzugen Sie einen stabilen Weg, wenn bereits einer vorhanden ist.
- Führen Sie eine breite Einführung erst nach vorherigen Tests in einer kleineren Umgebung durch.

## Derzeit dokumentierte Flags

| Oberfläche                | Schlüssel                                                                                     | Verwenden, wenn                                                                                                                     | Weitere Informationen                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Lokale Modelllaufzeit     | `agents.defaults.experimental.localModelLean`, `agents.entries.*.experimental.localModelLean` | Ein kleineres oder strengeres lokales Backend mit der vollständigen standardmäßigen Tool-Oberfläche von OpenClaw nicht zurechtkommt | [Lokale Modelle](/de/gateway/local-models)                                                  |
| Codex-Harness             | `plugins.entries.codex.config.appServer.experimental.sandboxExecServer`                       | Sie möchten, dass der native Codex-App-Server ab Version 0.132.0 einen durch eine OpenClaw-Sandbox gestützten Exec-Server anspricht, statt Code Mode zu deaktivieren | [Codex-Harness-Referenz](/de/plugins/codex-harness-reference#sandboxed-native-execution) |
| Strukturiertes Planungstool | `tools.experimental.planTool`                                                                 | Sie möchten das strukturierte Tool `update_plan` für die mehrstufige Arbeitsverfolgung in kompatiblen Laufzeiten und Benutzeroberflächen bereitstellen | [Referenz zur Gateway-Konfiguration](/de/gateway/config-tools#toolsexperimental)             |
| Code Mode                 | `tools.codeMode.enabled`                                                                      | Sie möchten kompakten, codegesteuerten Zugriff auf einen verborgenen OpenClaw-Toolkatalog                                          | [Code Mode](/de/tools/code-mode)                                                           |
| Swarm                     | `tools.swarm.enabled`                                                                         | Sie möchten mit Code-Mode-Skripten begrenzte Gruppen von Sub-Agenten parallel orchestrieren                                        | [Swarm](/tools/swarm)                                                                   |

## Labs in der Control UI

Öffnen Sie **Settings → Agents & Tools → Labs**, um Experimente zu verwalten, die über einen
Schalter in der Control UI verfügen. Das Aktivieren oder Deaktivieren eines Labs passt die kanonische Gateway-
Konfiguration sofort an; die Seite zeigt nur dann einen Hinweis zum Neustart an, wenn eine Funktion
einen Neustart erfordert.

Code Mode und Swarm sind die derzeit ausgelieferten Labs-Einträge. Beide Schalter
schreiben vorhandene validierte Konfigurationsschlüssel und werden normalerweise bei zukünftigen Agent-
Ausführungen ohne Neustart des Gateways wirksam.

## Lean-Modus für lokale Modelle

`agents.defaults.experimental.localModelLean: true` entfernt in jedem Durchlauf umfangreiche optionale Tools von der direkten Oberfläche des Agenten: `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` und `pdf`. Explizit zugelassene oder für die Zustellung erforderliche Tools bleiben verfügbar, obwohl Tool Search sie möglicherweise katalogisiert, anstatt sie direkt bereitzustellen. Der Lean-Modus stellt außerdem Plugin-/MCP-/Client-Kataloge standardmäßig auf die strukturierte Tool Search (`tool_search`, `tool_describe`, `tool_call`) ein, wenn `tools.toolSearch` noch nicht festgelegt ist. Verwenden Sie `agents.entries.*.experimental.localModelLean`, um dies auf einen Agenten zu beschränken.

Während des Onboardings setzt eine verifizierte Inferenzroute über `ollama` oder `lmstudio` automatisch `agents.defaults.experimental.localModelLean: true`, wenn dieser Wert fehlt. OpenClaw zeichnet auf, dass die Einstellung aus dem Onboarding stammt, sodass eine später verifizierte nicht lokale Route nur die automatische Einstellung aufhebt. Eine explizit konfigurierte Einstellung `true` oder `false` bleibt erhalten. Andere selbst gehostete und OpenAI-kompatible Provider werden nicht aus Modellnamen oder URLs abgeleitet.

Wenn Sie Tool Search bereits global abstimmen, lässt OpenClaw diese Konfiguration unverändert. Legen Sie `tools.toolSearch: false` fest, um die Tool-Search-Standardeinstellung des Lean-Modus abzulehnen.

Im strukturierten Modus `tools` bleibt bei Lean-Ausführungen `exec` neben den Tool-Search-Steuerelementen direkt sichtbar, damit auf Programmierung abgestimmte lokale Modelle weiterhin ihren vertrauten Shell-Pfad wählen können. Dies ändert nur die Sichtbarkeit im Schema: Die normale Tool-Richtlinie, das Sandboxing und die Exec-Genehmigungen gelten weiterhin. Die expliziten Modi `code` und `directory` behalten ihr normales Compaction-Verhalten bei.

### Warum diese Tools

Diese Tools haben die längsten Beschreibungen, die umfangreichsten Parameterstrukturen oder die höchste Wahrscheinlichkeit, ein kleines Modell vom normalen Programmier- und Konversationspfad abzulenken. Bei einem Backend mit kleinem Kontext oder einem strengeren OpenAI-kompatiblen Backend macht dies den Unterschied zwischen:

- Tool-Schemata, die in den Prompt passen, und solchen, die den Konversationsverlauf verdrängen.
- Der Auswahl des richtigen Tools durch das Modell und fehlerhaften Tool-Aufrufen aufgrund zu vieler ähnlicher Schemata.
- Dem Einhalten der Grenzwerte für strukturierte Ausgaben durch den Chat-Completions-Adapter und einem 400-Fehler aufgrund der Größe der Tool-Aufruf-Nutzlast.

Ihre Entfernung verkürzt lediglich die direkte Tool-Liste. Dem Modell stehen weiterhin `read`, `write`, `edit`, `exec`, `apply_patch`, Bildverständnis, Websuche/-abruf (sofern konfiguriert), Speicher sowie Sitzungs-/Agenten-Tools zur Verfügung. Zusätzliche Kataloge bleiben über Tool Search erreichbar, sofern Sie nicht `tools.toolSearch: false` festlegen; durch explizite Tool-Zulassungen kann ein Lean-Agent wieder Zugriff auf einen gekürzten Arbeitsablauf erhalten.

### Wann der Modus aktiviert werden sollte

Aktivieren Sie den Lean-Modus, sobald Sie nachgewiesen haben, dass das Modell mit dem Gateway kommunizieren kann, sich vollständige Agentendurchläufe jedoch fehlerhaft verhalten:

1. `openclaw infer model run --gateway --model <ref> --prompt "Reply with exactly: pong"` ist erfolgreich.
2. Ein normaler Agentendurchlauf schlägt aufgrund fehlerhafter Tool-Aufrufe oder übergroßer Prompts fehl oder weil das Modell seine Tools ignoriert.
3. Das Umschalten von `localModelLean: true` behebt den Fehler.

### Wann der Modus deaktiviert bleiben sollte

Wenn Ihr Backend die vollständige Standardlaufzeit problemlos verarbeitet, lassen Sie diese Option deaktiviert. Sie ist eine Übergangslösung für lokale Stacks, die eine kleinere Tool-Oberfläche benötigen, und keine Standardeinstellung für gehostete Modelle oder gut ausgestattete lokale Systeme.

Der Lean-Modus ersetzt weder `tools.profile`, `tools.allow`/`tools.deny` noch den Ausweichmechanismus `compat.supportsTools: false` des Modells. Für eine dauerhaft schmalere Tool-Oberfläche eines bestimmten Agenten sollten Sie diese stabilen Stellschrauben bevorzugen.

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

Starten Sie das Gateway nach einer Änderung des Flags neu. Die Lean-Filterung entfernt `browser`, `cron`, `message`, `image_generate`, `music_generate`, `video_generate`, `tts` und `pdf`, sofern Sie sie nicht explizit mit `tools.allow` oder `tools.alsoAllow` beibehalten; Tool Search kann beibehaltene Tools weiterhin katalogisieren, anstatt sie direkt bereitzustellen.

## Experimentell bedeutet nicht verborgen

Eine experimentelle Funktion sollte sowohl in der Dokumentation als auch im Konfigurationspfad selbst eindeutig als solche gekennzeichnet sein und sich nicht hinter einer stabil wirkenden Standardeinstellung verbergen.

## Verwandte Themen

- [Funktionen](/de/concepts/features)
- [Veröffentlichungskanäle](/de/install/development-channels)
