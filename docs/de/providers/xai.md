---
read_when:
    - Sie möchten Grok-Modelle in OpenClaw verwenden
    - Sie konfigurieren xAI-Authentifizierung oder Modell-IDs
summary: Grok-Modelle von xAI in OpenClaw verwenden
title: xAI
x-i18n:
    generated_at: "2026-04-06T03:11:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64bc899655427cc10bdc759171c7d1ec25ad9f1e4f9d803f1553d3d586c6d71d
    source_path: providers/xai.md
    workflow: 15
---

# xAI

OpenClaw liefert ein gebündeltes Provider-Plugin `xai` für Grok-Modelle mit.

## Einrichtung

1. Erstellen Sie einen API-Key in der xAI-Konsole.
2. Setzen Sie `XAI_API_KEY` oder führen Sie Folgendes aus:

```bash
openclaw onboard --auth-choice xai-api-key
```

3. Wählen Sie ein Modell wie zum Beispiel:

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

OpenClaw verwendet jetzt die xAI Responses API als gebündelten xAI-Transport. Derselbe
`XAI_API_KEY` kann auch Grok-basiertes `web_search`, erstklassiges `x_search`
und entferntes `code_execution` antreiben.
Wenn Sie einen xAI-Schlüssel unter `plugins.entries.xai.config.webSearch.apiKey` speichern,
verwendet der gebündelte xAI-Modell-Provider diesen Schlüssel jetzt ebenfalls als Fallback.
Die Feinabstimmung für `code_execution` befindet sich unter `plugins.entries.xai.config.codeExecution`.

## Aktueller gebündelter Modellkatalog

OpenClaw enthält jetzt standardmäßig diese xAI-Modellfamilien:

- `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`
- `grok-4`, `grok-4-0709`
- `grok-4-fast`, `grok-4-fast-non-reasoning`
- `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

Das Plugin löst auch neuere IDs `grok-4*` und `grok-code-fast*` vorwärts auf, wenn
sie derselben API-Form folgen.

Hinweise zu Fast-Modellen:

- `grok-4-fast`, `grok-4-1-fast` und die Varianten `grok-4.20-beta-*` sind die
  aktuellen bildfähigen Grok-Referenzen im gebündelten Katalog.
- `/fast on` oder `agents.defaults.models["xai/<model>"].params.fastMode: true`
  schreibt native xAI-Requests wie folgt um:
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

Veraltete Kompatibilitäts-Aliasse werden weiterhin auf die kanonischen gebündelten IDs normalisiert. Zum
Beispiel:

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Web Search

Der gebündelte Web-Search-Provider `grok` verwendet ebenfalls `XAI_API_KEY`:

```bash
openclaw config set tools.web.search.provider grok
```

## Videogenerierung

Das gebündelte Plugin `xai` registriert außerdem Videogenerierung über das gemeinsame
Tool `video_generate`.

- Standard-Videomodell: `xai/grok-imagine-video`
- Modi: Text-zu-Video, Bild-zu-Video und entfernte Abläufe zum Bearbeiten/Erweitern von Videos
- Unterstützt `aspectRatio` und `resolution`
- Aktuelle Einschränkung: lokale Videopuffer werden nicht akzeptiert; verwenden Sie entfernte `http(s)`-
  URLs für Video-Referenz-/Bearbeitungseingaben

So verwenden Sie xAI als Standard-Video-Provider:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "xai/grok-imagine-video",
      },
    },
  },
}
```

Unter [Videogenerierung](/tools/video-generation) finden Sie die gemeinsamen Tool-
Parameter, die Provider-Auswahl und das Failover-Verhalten.

## Bekannte Einschränkungen

- Auth ist derzeit nur per API-Key möglich. Es gibt in OpenClaw noch keinen xAI-OAuth-/Device-Code-Ablauf.
- `grok-4.20-multi-agent-experimental-beta-0304` wird auf dem normalen xAI-Provider-Pfad nicht unterstützt, da es eine andere Upstream-API-Oberfläche erfordert als der standardmäßige xAI-Transport von OpenClaw.

## Hinweise

- OpenClaw wendet xAI-spezifische Kompatibilitätskorrekturen für Tool-Schemas und Tool-Calls automatisch auf dem gemeinsamen Runner-Pfad an.
- Native xAI-Requests verwenden standardmäßig `tool_stream: true`. Setzen Sie
  `agents.defaults.models["xai/<model>"].params.tool_stream` auf `false`, um
  dies zu deaktivieren.
- Der gebündelte xAI-Wrapper entfernt nicht unterstützte strikte Tool-Schema-Flags und
  Reasoning-Payload-Schlüssel, bevor native xAI-Requests gesendet werden.
- `web_search`, `x_search` und `code_execution` werden als OpenClaw-Tools bereitgestellt. OpenClaw aktiviert das jeweils benötigte xAI-Built-in innerhalb jeder Tool-Anfrage, anstatt alle nativen Tools an jeden Chat-Turn anzuhängen.
- `x_search` und `code_execution` gehören dem gebündelten xAI-Plugin, statt fest im Core-Modell-Runtime codiert zu sein.
- `code_execution` ist entfernte xAI-Sandbox-Ausführung, nicht lokales [`exec`](/de/tools/exec).
- Einen umfassenderen Überblick über Provider finden Sie unter [Modell-Provider](/de/providers/index).
