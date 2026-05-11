---
read_when:
    - Bilder über den Agenten erzeugen oder bearbeiten
    - Provider und Modelle für die Bildgenerierung konfigurieren
    - Die Parameter des image_generate-Tools verstehen
sidebarTitle: Image generation
summary: Bilder über image_generate bei OpenAI, Google, fal, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI und Vydra generieren und bearbeiten
title: Bildgenerierung
x-i18n:
    generated_at: "2026-05-11T20:37:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 10c15b48a673ef673e3cf7c4f4950a08961d64a3fd21eff9d1944ec6d4b9c410
    source_path: tools/image-generation.md
    workflow: 16
---

Das Tool `image_generate` ermöglicht es dem Agenten, mit Ihren
konfigurierten Providern Bilder zu erstellen und zu bearbeiten. Generierte
Bilder werden automatisch als Medienanhänge in der Antwort des Agenten
bereitgestellt.

<Note>
Das Tool erscheint nur, wenn mindestens ein Provider für die Bilderzeugung
verfügbar ist. Wenn Sie `image_generate` nicht in den Tools Ihres Agenten
sehen, konfigurieren Sie `agents.defaults.imageGenerationModel`, richten Sie
einen Provider-API-Schlüssel ein oder melden Sie sich mit OpenAI Codex OAuth an.
</Note>

## Schnellstart

<Steps>
  <Step title="Authentifizierung konfigurieren">
    Legen Sie einen API-Schlüssel für mindestens einen Provider fest (zum Beispiel `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) oder melden Sie sich mit OpenAI Codex OAuth an.
  </Step>
  <Step title="Standardmodell auswählen (optional)">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    Codex OAuth verwendet dieselbe Modellreferenz `openai/gpt-image-2`. Wenn ein
    `openai-codex` OAuth-Profil konfiguriert ist, leitet OpenClaw Bildanfragen
    über dieses OAuth-Profil weiter, anstatt zuerst `OPENAI_API_KEY` zu versuchen.
    Eine explizite Konfiguration von `models.providers.openai` (API-Schlüssel,
    benutzerdefinierte/Azure-Basis-URL) aktiviert wieder die direkte Route zur OpenAI Images API.

  </Step>
  <Step title="Agenten anfragen">
    _"Erzeuge ein Bild eines freundlichen Roboter-Maskottchens."_

    Der Agent ruft `image_generate` automatisch auf. Keine Tool-Zulassungsliste
    erforderlich - es ist standardmäßig aktiviert, wenn ein Provider verfügbar ist.

  </Step>
</Steps>

<Warning>
Für OpenAI-kompatible LAN-Endpunkte wie LocalAI behalten Sie die benutzerdefinierte
`models.providers.openai.baseUrl` bei und aktivieren Sie sie ausdrücklich mit
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Private und
interne Bild-Endpunkte bleiben standardmäßig blockiert.
</Warning>

## Gängige Routen

| Ziel                                                 | Modellreferenz                                    | Authentifizierung                      |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| OpenAI-Bilderzeugung mit API-Abrechnung              | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| OpenAI-Bilderzeugung mit Codex-Abonnementauthentifizierung | `openai/gpt-image-2`                         | OpenAI Codex OAuth                     |
| OpenAI PNG/WebP mit transparentem Hintergrund        | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` oder OpenAI Codex OAuth |
| DeepInfra-Bilderzeugung                             | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| OpenRouter-Bilderzeugung                            | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM-Bilderzeugung                               | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Google Gemini-Bilderzeugung                         | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` oder `GOOGLE_API_KEY` |

Dasselbe Tool `image_generate` verarbeitet Text-zu-Bild und die Bearbeitung mit
Referenzbildern. Verwenden Sie `image` für eine Referenz oder `images` für
mehrere Referenzen. Vom Provider unterstützte Ausgabehinweise wie `quality`,
`outputFormat` und `background` werden, sofern verfügbar, weitergeleitet und
als ignoriert gemeldet, wenn ein Provider sie nicht unterstützt. Die gebündelte
Unterstützung für transparente Hintergründe ist OpenAI-spezifisch; andere
Provider können PNG-Alpha dennoch beibehalten, wenn ihr Backend es ausgibt.

## Unterstützte Provider

| Provider   | Standardmodell                         | Bearbeitungsunterstützung          | Authentifizierung                                     |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Ja (1 Bild, Workflow-konfiguriert) | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für Cloud  |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | Ja (1 Bild)                        | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | Ja (modellspezifische Grenzen)     | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Ja                                 | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                |
| LiteLLM    | `gpt-image-2`                           | Ja (bis zu 5 Eingabebilder)        | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Ja (Motivreferenz)                 | `MINIMAX_API_KEY` oder MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Ja (bis zu 4 Bilder)               | `OPENAI_API_KEY` oder OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Ja (bis zu 5 Eingabebilder)        | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | Nein                               | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Ja (bis zu 5 Bilder)               | `XAI_API_KEY`                                         |

Verwenden Sie `action: "list"`, um verfügbare Provider und Modelle zur Laufzeit zu prüfen:

```text
/tool image_generate action=list
```

## Provider-Funktionen

| Funktion              | ComfyUI              | DeepInfra | fal                       | Google          | MiniMax                  | OpenAI         | Vydra | xAI             |
| --------------------- | -------------------- | --------- | ------------------------- | --------------- | ------------------------ | -------------- | ----- | --------------- |
| Erzeugen (max. Anzahl) | Workflow-definiert  | 4         | 4                         | 4               | 9                        | 4              | 1     | 4               |
| Bearbeiten / Referenz | 1 Bild (Workflow)    | 1 Bild    | Flux: 1; GPT: 10; NB2: 14 | Bis zu 5 Bilder | 1 Bild (Motivreferenz)   | Bis zu 5 Bilder | -    | Bis zu 5 Bilder |
| Größensteuerung       | -                    | ✓         | ✓                         | ✓               | -                        | Bis zu 4K      | -     | -               |
| Seitenverhältnis      | -                    | -         | ✓                         | ✓               | ✓                        | -              | -     | ✓               |
| Auflösung (1K/2K/4K)  | -                    | -         | ✓                         | ✓               | -                        | -              | -     | 1K, 2K          |

## Tool-Parameter

<ParamField path="prompt" type="string" required>
  Prompt für die Bilderzeugung. Erforderlich für `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Verwenden Sie `"list"`, um verfügbare Provider und Modelle zur Laufzeit zu prüfen.
</ParamField>
<ParamField path="model" type="string">
  Provider-/Modellüberschreibung (z. B. `openai/gpt-image-2`). Verwenden Sie
  `openai/gpt-image-1.5` für transparente OpenAI-Hintergründe.
</ParamField>
<ParamField path="image" type="string">
  Einzelner Referenzbildpfad oder URL für den Bearbeitungsmodus.
</ParamField>
<ParamField path="images" type="string[]">
  Mehrere Referenzbilder für den Bearbeitungsmodus (bis zu 5 bei unterstützenden Providern).
</ParamField>
<ParamField path="size" type="string">
  Größenhinweis: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Seitenverhältnis: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Auflösungshinweis.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Qualitätshinweis, wenn der Provider ihn unterstützt.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Ausgabeformathinweis, wenn der Provider ihn unterstützt.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Hintergrundhinweis, wenn der Provider ihn unterstützt. Verwenden Sie `transparent` mit
  `outputFormat: "png"` oder `"webp"` für Provider mit Transparenzunterstützung.
</ParamField>
<ParamField path="count" type="number">Anzahl der zu erzeugenden Bilder (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Optionales Provider-Anfrage-Timeout in Millisekunden. Wenn Codex
  `image_generate` über dynamische Tools aufruft, überschreibt dieser Wert pro Aufruf weiterhin
  den konfigurierten Standard und ist auf 600000 ms begrenzt.
</ParamField>
<ParamField path="filename" type="string">Hinweis für den Ausgabedateinamen.</ParamField>
<ParamField path="openai" type="object">
  Nur OpenAI-Hinweise: `background`, `moderation`, `outputCompression` und `user`.
</ParamField>

<Note>
Nicht alle Provider unterstützen alle Parameter. Wenn ein Fallback-Provider
eine nahegelegene Geometrieoption statt der exakt angeforderten unterstützt,
ordnet OpenClaw vor dem Absenden der nächstliegenden unterstützten Größe,
dem nächstliegenden Seitenverhältnis oder der nächstliegenden Auflösung zu.
Nicht unterstützte Ausgabehinweise werden für Provider verworfen, die keine
Unterstützung deklarieren, und im Tool-Ergebnis gemeldet. Tool-Ergebnisse melden
die angewendeten Einstellungen; `details.normalization` erfasst jede Übersetzung
von angefordert zu angewendet.
</Note>

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

### Provider-Auswahlreihenfolge

OpenClaw versucht Provider in dieser Reihenfolge:

1. **`model`-Parameter** aus dem Tool-Aufruf (wenn der Agent einen angibt).
2. **`imageGenerationModel.primary`** aus der Konfiguration.
3. **`imageGenerationModel.fallbacks`** der Reihe nach.
4. **Automatische Erkennung** - nur authentifizierungsbasierte Provider-Standards:
   - aktueller Standard-Provider zuerst;
   - verbleibende registrierte Provider für die Bilderzeugung in Provider-ID-Reihenfolge.

Wenn ein Provider fehlschlägt (Authentifizierungsfehler, Ratenlimit usw.), wird der nächste konfigurierte
Kandidat automatisch versucht. Wenn alle fehlschlagen, enthält der Fehler Details
zu jedem Versuch.

<AccordionGroup>
  <Accordion title="Modellüberschreibungen pro Aufruf sind exakt">
    Eine `model`-Überschreibung pro Aufruf versucht nur diesen Provider/dieses Modell und fährt
    nicht mit konfiguriertem primärem Modell/Fallback oder automatisch erkannten Providern fort.
  </Accordion>
  <Accordion title="Automatische Erkennung berücksichtigt Authentifizierung">
    Ein Provider-Standard wird nur in die Kandidatenliste aufgenommen, wenn OpenClaw
    diesen Provider tatsächlich authentifizieren kann. Setzen Sie
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, um nur
    explizite Einträge für `model`, `primary` und `fallbacks` zu verwenden.
  </Accordion>
  <Accordion title="Timeouts">
    Setzen Sie `agents.defaults.imageGenerationModel.timeoutMs` für langsame Bild-
    Backends. Ein `timeoutMs`-Tool-Parameter pro Aufruf überschreibt den konfigurierten
    Standard. Dynamische Tool-Aufrufe von Codex berücksichtigen dasselbe Timeout-Budget,
    begrenzt durch das Maximum der dynamischen Tool-Bridge von OpenClaw von 600000 ms.
  </Accordion>
  <Accordion title="Zur Laufzeit prüfen">
    Verwenden Sie `action: "list"`, um die derzeit registrierten Provider,
    ihre Standardmodelle und Hinweise zu Authentifizierungs-Env-Vars zu prüfen.
  </Accordion>
</AccordionGroup>

### Bildbearbeitung

OpenAI, OpenRouter, Google, DeepInfra, fal, MiniMax, ComfyUI und xAI unterstützen die Bearbeitung von
Referenzbildern. Übergeben Sie einen Referenzbildpfad oder eine URL:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google und xAI unterstützen bis zu 5 Referenzbilder über den
Parameter `images`. fal unterstützt 1 Referenzbild für Flux image-to-image, bis
zu 10 für GPT Image 2-Bearbeitungen und bis zu 14 für Nano Banana 2-Bearbeitungen. MiniMax und
ComfyUI unterstützen 1.

## Detaillierte Provider-Einblicke

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (and gpt-image-1.5)">
    Die OpenAI-Bildgenerierung verwendet standardmäßig `openai/gpt-image-2`. Wenn ein
    `openai-codex`-OAuth-Profil konfiguriert ist, verwendet OpenClaw dasselbe
    OAuth-Profil wieder, das von Codex-Abonnement-Chatmodellen genutzt wird, und sendet die
    Bildanfrage über das Codex Responses-Backend. Legacy-Codex-Basis-
    URLs wie `https://chatgpt.com/backend-api` werden für
    Bildanfragen zu `https://chatgpt.com/backend-api/codex` kanonisiert. OpenClaw
    fällt für diese Anfrage **nicht** stillschweigend auf `OPENAI_API_KEY` zurück -
    um direktes Routing über die OpenAI Images API zu erzwingen, konfigurieren Sie
    `models.providers.openai` explizit mit einem API-Schlüssel, einer benutzerdefinierten Basis-URL
    oder einem Azure-Endpunkt.

    Die Modelle `openai/gpt-image-1.5`, `openai/gpt-image-1` und
    `openai/gpt-image-1-mini` können weiterhin explizit ausgewählt werden. Verwenden Sie
    `gpt-image-1.5` für PNG/WebP-Ausgaben mit transparentem Hintergrund; die aktuelle
    `gpt-image-2`-API lehnt `background: "transparent"` ab.

    `gpt-image-2` unterstützt sowohl Text-zu-Bild-Generierung als auch
    Bearbeitung mit Referenzbildern über dasselbe `image_generate`-Tool.
    OpenClaw leitet `prompt`, `count`, `size`, `quality`, `outputFormat`
    und Referenzbilder an OpenAI weiter. OpenAI erhält **nicht**
    direkt `aspectRatio` oder `resolution`; wenn möglich, ordnet OpenClaw
    diese einer unterstützten `size` zu, andernfalls meldet das Tool sie als
    ignorierte Überschreibungen.

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

    `openai.background` akzeptiert `transparent`, `opaque` oder `auto`;
    transparente Ausgaben erfordern `outputFormat` `png` oder `webp` und ein
    OpenAI-Bildmodell mit Transparenzunterstützung. OpenClaw leitet standardmäßige
    `gpt-image-2`-Anfragen mit transparentem Hintergrund an `gpt-image-1.5` weiter.
    `openai.outputCompression` gilt für JPEG/WebP-Ausgaben.

    Der Top-Level-Hinweis `background` ist Provider-neutral und wird derzeit dem
    gleichen OpenAI-Anfragefeld `background` zugeordnet, wenn der OpenAI-Provider
    ausgewählt ist. Provider, die keine Hintergrundunterstützung deklarieren, geben
    ihn in `ignoredOverrides` zurück, statt den nicht unterstützten Parameter zu erhalten.

    Um die OpenAI-Bildgenerierung über eine Azure OpenAI-Bereitstellung
    statt über `api.openai.com` zu leiten, siehe
    [Azure OpenAI-Endpunkte](/de/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="OpenRouter image models">
    Die OpenRouter-Bildgenerierung verwendet denselben `OPENROUTER_API_KEY` und
    wird über die Chat-Completions-Bild-API von OpenRouter geroutet. Wählen Sie
    OpenRouter-Bildmodelle mit dem Präfix `openrouter/` aus:

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

    OpenClaw leitet `prompt`, `count`, Referenzbilder und
    Gemini-kompatible `aspectRatio`- / `resolution`-Hinweise an OpenRouter weiter.
    Zu den aktuellen integrierten Kurzbefehlen für OpenRouter-Bildmodelle gehören
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` und `openai/gpt-5.4-image-2`. Verwenden Sie
    `action: "list"`, um zu sehen, was Ihr konfiguriertes Plugin bereitstellt.

  </Accordion>
  <Accordion title="MiniMax dual-auth">
    MiniMax-Bildgenerierung ist über beide gebündelten MiniMax-
    Authentifizierungspfade verfügbar:

    - `minimax/image-01` für Setups mit API-Schlüssel
    - `minimax-portal/image-01` für OAuth-Setups

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Der gebündelte xAI-Provider verwendet `/v1/images/generations` für reine Prompt-
    Anfragen und `/v1/images/edits`, wenn `image` oder `images` vorhanden ist.

    - Modelle: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Anzahl: bis zu 4
    - Referenzen: ein `image` oder bis zu fünf `images`
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Auflösungen: `1K`, `2K`
    - Ausgaben: werden als von OpenClaw verwaltete Bildanhänge zurückgegeben

    OpenClaw stellt xAI-native `quality`, `mask`, `user` oder zusätzliche
    ausschließlich native Seitenverhältnisse absichtlich nicht bereit, bis diese Steuerelemente
    im gemeinsamen Provider-übergreifenden `image_generate`-Vertrag existieren.

  </Accordion>
</AccordionGroup>

## Beispiele

<Tabs>
  <Tab title="Generate (4K landscape)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generate (transparent PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Entsprechende CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Generate (two square)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Edit (one reference)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Edit (multiple references)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Dieselben Flags `--output-format` und `--background` sind für
`openclaw infer image edit` verfügbar; `--openai-background` bleibt ein
OpenAI-spezifischer Alias. Gebündelte Provider außer OpenAI deklarieren derzeit
keine explizite Hintergrundsteuerung, daher wird `background: "transparent"` für sie
als ignoriert gemeldet.

## Verwandte Themen

- [Tools-Übersicht](/de/tools) - alle verfügbaren Agent-Tools
- [ComfyUI](/de/providers/comfy) - Einrichtung lokaler ComfyUI- und Comfy Cloud-Workflows
- [fal](/de/providers/fal) - Einrichtung des fal-Bild- und Video-Providers
- [Google (Gemini)](/de/providers/google) - Einrichtung des Gemini-Bild-Providers
- [MiniMax](/de/providers/minimax) - Einrichtung des MiniMax-Bild-Providers
- [OpenAI](/de/providers/openai) - Einrichtung des OpenAI Images-Providers
- [Vydra](/de/providers/vydra) - Einrichtung von Vydra für Bild, Video und Sprache
- [xAI](/de/providers/xai) - Einrichtung von Grok für Bild, Video, Suche, Codeausführung und TTS
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) - `imageGenerationModel`-Konfiguration
- [Modelle](/de/concepts/models) - Modellkonfiguration und Failover
