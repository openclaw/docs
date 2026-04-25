---
read_when:
    - Bilder über den Agent generieren
    - Provider und Modelle für die Bildgenerierung konfigurieren
    - Die Parameter des Tools `image_generate` verstehen
summary: Bilder mit konfigurierten Providern generieren und bearbeiten (OpenAI, OpenAI Codex OAuth, Google Gemini, OpenRouter, LiteLLM, fal, MiniMax, ComfyUI, Vydra, xAI)
title: Bildgenerierung
x-i18n:
    generated_at: "2026-04-25T18:22:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 40ec0e9a004e769b3db8b98b1a687097cb4bc6aa78dc903e4f6a17c3731156c0
    source_path: tools/image-generation.md
    workflow: 15
---

Das Tool `image_generate` lässt den Agent Bilder mit Ihren konfigurierten Providern erstellen und bearbeiten. Generierte Bilder werden automatisch als Medienanhänge in der Antwort des Agenten zugestellt.

<Note>
Das Tool erscheint nur, wenn mindestens ein Provider für Bildgenerierung verfügbar ist. Wenn Sie `image_generate` nicht in den Tools Ihres Agenten sehen, konfigurieren Sie `agents.defaults.imageGenerationModel`, richten Sie einen API-Schlüssel für einen Provider ein oder melden Sie sich mit OpenAI Codex OAuth an.
</Note>

## Schnellstart

1. Setzen Sie für mindestens einen Provider einen API-Schlüssel (zum Beispiel `OPENAI_API_KEY`, `GEMINI_API_KEY` oder `OPENROUTER_API_KEY`) oder melden Sie sich mit OpenAI Codex OAuth an.
2. Legen Sie optional Ihr bevorzugtes Modell fest:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        // Optionales Standard-Timeout für Provider-Anfragen von image_generate.
        timeoutMs: 180_000,
      },
    },
  },
}
```

Codex OAuth verwendet dieselbe Modell-Ref `openai/gpt-image-2`. Wenn ein
OAuth-Profil `openai-codex` konfiguriert ist, leitet OpenClaw Bildanfragen
über dasselbe OAuth-Profil weiter, statt zuerst `OPENAI_API_KEY` zu versuchen.
Explizite benutzerdefinierte Bildkonfiguration für `models.providers.openai`, wie ein API-Schlüssel oder
eine benutzerdefinierte/Azure-Base-URL, aktiviert wieder den direkten Pfad zur OpenAI-Images-API.
Für OpenAI-kompatible LAN-Endpunkte wie LocalAI behalten Sie die benutzerdefinierte
`models.providers.openai.baseUrl` bei und aktivieren Sie explizit
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`; private/interne
Bildendpunkte bleiben standardmäßig blockiert.

3. Fragen Sie den Agenten: _„Erzeuge ein Bild eines freundlichen Roboter-Maskottchens.“_

Der Agent ruft `image_generate` automatisch auf. Kein Allow-Listing für Tools nötig — es ist standardmäßig aktiviert, wenn ein Provider verfügbar ist.

## Häufige Wege

| Ziel                                                 | Modell-Ref                                         | Auth                                 |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| OpenAI-Bildgenerierung mit API-Abrechnung            | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                     |
| OpenAI-Bildgenerierung mit Codex-Abonnement-Auth     | `openai/gpt-image-2`                               | OpenAI Codex OAuth                   |
| OpenRouter-Bildgenerierung                           | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                 |
| LiteLLM-Bildgenerierung                              | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                    |
| Google-Gemini-Bildgenerierung                        | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` oder `GOOGLE_API_KEY` |

Dasselbe Tool `image_generate` verarbeitet sowohl Text-zu-Bild als auch das
Bearbeiten von Referenzbildern. Verwenden Sie `image` für eine Referenz oder `images` für mehrere Referenzen.
Vom Provider unterstützte Ausgabehinweise wie `quality`, `outputFormat` und
OpenAI-spezifisches `background` werden weitergeleitet, wenn verfügbar, und als
ignoriert gemeldet, wenn ein Provider sie nicht unterstützt.

## Unterstützte Provider

| Provider   | Standardmodell                          | Unterstützung für Bearbeitung      | Auth                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| OpenAI     | `gpt-image-2`                           | Ja (bis zu 4 Bilder)               | `OPENAI_API_KEY` oder OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Ja (bis zu 5 Eingabebilder)        | `OPENROUTER_API_KEY`                                  |
| LiteLLM    | `gpt-image-2`                           | Ja (bis zu 5 Eingabebilder)        | `LITELLM_API_KEY`                                     |
| Google     | `gemini-3.1-flash-image-preview`        | Ja                                 | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                |
| fal        | `fal-ai/flux/dev`                       | Ja                                 | `FAL_KEY`                                             |
| MiniMax    | `image-01`                              | Ja (Subjektreferenz)               | `MINIMAX_API_KEY` oder MiniMax OAuth (`minimax-portal`) |
| ComfyUI    | `workflow`                              | Ja (1 Bild, per Workflow konfiguriert) | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für Cloud    |
| Vydra      | `grok-imagine`                          | Nein                               | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Ja (bis zu 5 Bilder)               | `XAI_API_KEY`                                         |

Verwenden Sie `action: "list"`, um verfügbare Provider und Modelle zur Laufzeit zu prüfen:

```
/tool image_generate action=list
```

## Tool-Parameter

<ParamField path="prompt" type="string" required>
Prompt für die Bildgenerierung. Erforderlich für `action: "generate"`.
</ParamField>

<ParamField path="action" type="'generate' | 'list'" default="generate">
Verwenden Sie `"list"`, um verfügbare Provider und Modelle zur Laufzeit zu prüfen.
</ParamField>

<ParamField path="model" type="string">
Override für Provider/Modell, z. B. `openai/gpt-image-2`.
</ParamField>

<ParamField path="image" type="string">
Pfad oder URL eines einzelnen Referenzbildes für den Bearbeitungsmodus.
</ParamField>

<ParamField path="images" type="string[]">
Mehrere Referenzbilder für den Bearbeitungsmodus (bis zu 5).
</ParamField>

<ParamField path="size" type="string">
Größenhinweis: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>

<ParamField path="aspectRatio" type="string">
Seitenverhältnis: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>

<ParamField path="resolution" type="'1K' | '2K' | '4K'">
Auflösungshinweis.
</ParamField>

<ParamField path="quality" type="'low' | 'medium' | 'high' | 'auto'">
Qualitätshinweis, wenn der Provider dies unterstützt.
</ParamField>

<ParamField path="outputFormat" type="'png' | 'jpeg' | 'webp'">
Ausgabeformat-Hinweis, wenn der Provider dies unterstützt.
</ParamField>

<ParamField path="count" type="number">
Anzahl der zu generierenden Bilder (1–4).
</ParamField>

<ParamField path="timeoutMs" type="number">
Optionales Timeout für Provider-Anfragen in Millisekunden.
</ParamField>

<ParamField path="filename" type="string">
Hinweis für den Ausgabedateinamen.
</ParamField>

<ParamField path="openai" type="object">
Nur für OpenAI geltende Hinweise: `background`, `moderation`, `outputCompression` und `user`.
</ParamField>

Nicht alle Provider unterstützen alle Parameter. Wenn ein Fallback-Provider statt der exakt angeforderten Geometrie nur eine nahe verwandte Geometrieoption unterstützt, ordnet OpenClaw vor dem Absenden die nächstunterstützte Größe, das nächstunterstützte Seitenverhältnis oder die nächstunterstützte Auflösung zu. Nicht unterstützte Ausgabehinweise wie `quality` oder `outputFormat` werden bei Providern, die keine Unterstützung deklarieren, verworfen und im Tool-Ergebnis gemeldet.

Tool-Ergebnisse melden die angewendeten Einstellungen. Wenn OpenClaw bei einem Provider-Fallback die Geometrie neu zuordnet, geben die zurückgegebenen Werte `size`, `aspectRatio` und `resolution` wieder, was tatsächlich gesendet wurde, und `details.normalization` erfasst die Übersetzung von angefordert zu angewendet.

## Konfiguration

### Modellauswahl

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Reihenfolge der Providerauswahl

Beim Generieren eines Bildes versucht OpenClaw Provider in dieser Reihenfolge:

1. **Parameter `model`** aus dem Tool-Aufruf (wenn der Agent einen angibt)
2. **`imageGenerationModel.primary`** aus der Konfiguration
3. **`imageGenerationModel.fallbacks`** in Reihenfolge
4. **Auto-Erkennung** — verwendet nur auth-gestützte Provider-Standards:
   - zuerst der aktuelle Standard-Provider
   - verbleibende registrierte Bildgenerierungs-Provider in Reihenfolge der Provider-ID

Wenn ein Provider fehlschlägt (Auth-Fehler, Rate-Limit usw.), wird automatisch der nächste konfigurierte Kandidat versucht. Wenn alle fehlschlagen, enthält der Fehler Details aus jedem Versuch.

Hinweise:

- Ein pro Aufruf gesetztes `model`-Override ist exakt: OpenClaw versucht nur dieses Provider-/Modell
  und fährt nicht mit konfigurierten primären/Fallback- oder automatisch erkannten
  Providern fort.
- Die Auto-Erkennung ist auth-bewusst. Ein Provider-Standard gelangt nur dann in die Kandidatenliste,
  wenn OpenClaw diesen Provider tatsächlich authentifizieren kann.
- Die Auto-Erkennung ist standardmäßig aktiviert. Setzen Sie
  `agents.defaults.mediaGenerationAutoProviderFallback: false`, wenn die Bild-
  generierung nur die expliziten Einträge `model`, `primary` und `fallbacks`
  verwenden soll.
- Setzen Sie `agents.defaults.imageGenerationModel.timeoutMs` für langsame Bild-Backends.
  Ein Tool-Parameter `timeoutMs` pro Aufruf überschreibt den konfigurierten Standard.
- Verwenden Sie `action: "list"`, um die aktuell registrierten Provider, ihre
  Standardmodelle und Hinweise zu Auth-Env-Variablen zu prüfen.

### Bildbearbeitung

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI und xAI unterstützen das Bearbeiten von Referenzbildern. Übergeben Sie einen Pfad oder eine URL zu einem Referenzbild:

```
"Erzeuge eine Aquarellversion dieses Fotos" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google und xAI unterstützen über den Parameter `images` bis zu 5 Referenzbilder. fal, MiniMax und ComfyUI unterstützen 1.

### OpenRouter-Bildmodelle

Die OpenRouter-Bildgenerierung verwendet denselben `OPENROUTER_API_KEY` und wird über OpenRouters Chat-Completions-Image-API geroutet. Wählen Sie OpenRouter-Bildmodelle mit dem Präfix `openrouter/`:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw leitet `prompt`, `count`, Referenzbilder und Gemini-kompatible Hinweise für `aspectRatio` / `resolution` an OpenRouter weiter. Zu den aktuellen integrierten OpenRouter-Kurzformen für Bildmodelle gehören `google/gemini-3.1-flash-image-preview`, `google/gemini-3-pro-image-preview` und `openai/gpt-5.4-image-2`; verwenden Sie `action: "list"`, um zu sehen, was Ihr konfiguriertes Plugin bereitstellt.

### OpenAI `gpt-image-2`

Die OpenAI-Bildgenerierung verwendet standardmäßig `openai/gpt-image-2`. Wenn ein
OAuth-Profil `openai-codex` konfiguriert ist, verwendet OpenClaw dasselbe OAuth-
Profil erneut, das auch für Codex-Abonnement-Chat-Modelle verwendet wird, und sendet die Bildanfrage
über das Codex-Responses-Backend. Legacy-Codex-Base-URLs wie
`https://chatgpt.com/backend-api` werden für Bildanfragen kanonisiert zu
`https://chatgpt.com/backend-api/codex`. Für diese Anfrage erfolgt kein
stiller Fallback auf `OPENAI_API_KEY`. Um direktes Routing über die OpenAI-
Images-API zu erzwingen, konfigurieren Sie `models.providers.openai` explizit mit einem API-
Schlüssel, einer benutzerdefinierten Base-URL oder einem Azure-Endpunkt. Das ältere
Modell `openai/gpt-image-1` kann weiterhin explizit ausgewählt werden, aber neue OpenAI-
Anfragen zur Bildgenerierung und Bildbearbeitung sollten `gpt-image-2` verwenden.

`gpt-image-2` unterstützt sowohl Text-zu-Bild-Generierung als auch das Bearbeiten von Referenzbildern
über dasselbe Tool `image_generate`. OpenClaw leitet `prompt`,
`count`, `size`, `quality`, `outputFormat` und Referenzbilder an OpenAI weiter.
OpenAI erhält `aspectRatio` oder `resolution` nicht direkt; wenn möglich
ordnet OpenClaw diese einer unterstützten `size` zu, andernfalls meldet das Tool sie als
ignorierte Overrides.

OpenAI-spezifische Optionen befinden sich unter dem Objekt `openai`:

```json
{
  "quality": "low",
  "outputFormat": "jpeg",
  "openai": {
    "background": "opaque",
    "moderation": "low",
    "outputCompression": 60,
    "user": "end-user-42"
  }
}
```

`openai.background` akzeptiert `transparent`, `opaque` oder `auto`; transparente
Ausgaben erfordern `outputFormat` `png` oder `webp`. `openai.outputCompression`
gilt für JPEG-/WebP-Ausgaben.

Ein 4K-Bild im Querformat generieren:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Ein klares redaktionelles Poster für die Bildgenerierung in OpenClaw" size=3840x2160 count=1
```

Zwei quadratische Bilder generieren:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Zwei visuelle Richtungen für ein ruhiges Produktivitäts-App-Symbol" size=1024x1024 count=2
```

Ein lokales Referenzbild bearbeiten:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Behalte das Motiv bei und ersetze den Hintergrund durch ein helles Studio-Setup" image=/path/to/reference.png size=1024x1536
```

Mit mehreren Referenzen bearbeiten:

```
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Kombiniere die Charakteridentität aus dem ersten Bild mit der Farbpalette aus dem zweiten" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```

Um die OpenAI-Bildgenerierung über ein Azure-OpenAI-Deployment statt über
`api.openai.com` zu routen, siehe [Azure OpenAI endpoints](/de/providers/openai#azure-openai-endpoints)
in der OpenAI-Provider-Dokumentation.

MiniMax-Bildgenerierung ist über beide mitgelieferten MiniMax-Auth-Pfade verfügbar:

- `minimax/image-01` für API-Key-Setups
- `minimax-portal/image-01` für OAuth-Setups

## Provider-Fähigkeiten

| Fähigkeit             | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   | xAI                  |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- | -------------------- |
| Generieren            | Ja (bis zu 4)        | Ja (bis zu 4)        | Ja (bis zu 4)       | Ja (bis zu 9)              | Ja (workflowdefinierte Ausgaben)   | Ja (1)  | Ja (bis zu 4)        |
| Bearbeiten/Referenz   | Ja (bis zu 5 Bilder) | Ja (bis zu 5 Bilder) | Ja (1 Bild)         | Ja (1 Bild, Subjektreferenz) | Ja (1 Bild, per Workflow konfiguriert) | Nein    | Ja (bis zu 5 Bilder) |
| Größensteuerung       | Ja (bis zu 4K)       | Ja                   | Ja                  | Nein                       | Nein                               | Nein    | Nein                 |
| Seitenverhältnis      | Nein                 | Ja                   | Ja (nur Generierung) | Ja                        | Nein                               | Nein    | Ja                   |
| Auflösung (1K/2K/4K)  | Nein                 | Ja                   | Ja                  | Nein                       | Nein                               | Nein    | Ja (1K/2K)           |

### xAI `grok-imagine-image`

Der mitgelieferte xAI-Provider verwendet `/v1/images/generations` für reine Prompt-Anfragen
und `/v1/images/edits`, wenn `image` oder `images` vorhanden ist.

- Modelle: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
- Anzahl: bis zu 4
- Referenzen: ein `image` oder bis zu fünf `images`
- Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
- Auflösungen: `1K`, `2K`
- Ausgaben: werden als von OpenClaw verwaltete Bildanhänge zurückgegeben

OpenClaw stellt xAI-native Optionen wie `quality`, `mask`, `user` oder
zusätzliche nur nativ verfügbare Seitenverhältnisse absichtlich nicht bereit,
bis diese Steuerungen im gemeinsamen providerübergreifenden Vertrag von
`image_generate` existieren.

## Verwandt

- [Tools-Übersicht](/de/tools) — alle verfügbaren Agent-Tools
- [fal](/de/providers/fal) — Einrichtung des Bild- und Video-Providers fal
- [ComfyUI](/de/providers/comfy) — Einrichtung lokaler ComfyUI- und Comfy-Cloud-Workflows
- [Google (Gemini)](/de/providers/google) — Einrichtung des Bild-Providers Gemini
- [MiniMax](/de/providers/minimax) — Einrichtung des Bild-Providers MiniMax
- [OpenAI](/de/providers/openai) — Einrichtung des Providers OpenAI Images
- [Vydra](/de/providers/vydra) — Einrichtung von Bild, Video und Sprache für Vydra
- [xAI](/de/providers/xai) — Einrichtung von Grok für Bild, Video, Suche, Codeausführung und TTS
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Konfiguration `imageGenerationModel`
- [Modelle](/de/concepts/models) — Modellkonfiguration und Failover
