---
read_when:
    - Bilder über den Agenten generieren oder bearbeiten
    - Anbieter und Modelle für die Bildgenerierung konfigurieren
    - Die Parameter des Tools `image_generate` verstehen
sidebarTitle: Image generation
summary: Bilder über `image_generate` in OpenAI, Google, fal, MiniMax, ComfyUI, OpenRouter, LiteLLM, xAI und Vydra generieren und bearbeiten
title: Bildgenerierung
x-i18n:
    generated_at: "2026-04-26T11:40:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: c57d32667eed3d6449628f6f663359ece089233ed0fde5258e2b2e4713192758
    source_path: tools/image-generation.md
    workflow: 15
---

Das Tool `image_generate` ermöglicht dem Agenten, Bilder mit Ihren
konfigurierten Anbietern zu erstellen und zu bearbeiten. Generierte Bilder werden automatisch als Medien-
anhänge in der Antwort des Agenten ausgeliefert.

<Note>
Das Tool erscheint nur, wenn mindestens ein Anbieter für Bildgenerierung
verfügbar ist. Wenn Sie `image_generate` nicht in den Tools Ihres Agenten sehen,
konfigurieren Sie `agents.defaults.imageGenerationModel`, richten Sie einen API-Schlüssel für einen Anbieter ein
oder melden Sie sich mit OpenAI Codex OAuth an.
</Note>

## Schnellstart

<Steps>
  <Step title="Authentifizierung konfigurieren">
    Setzen Sie einen API-Schlüssel für mindestens einen Anbieter (zum Beispiel `OPENAI_API_KEY`,
    `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) oder melden Sie sich mit OpenAI Codex OAuth an.
  </Step>
  <Step title="Ein Standardmodell auswählen (optional)">
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
    OAuth-Profil `openai-codex` konfiguriert ist, leitet OpenClaw Bild-
    anfragen über dieses OAuth-Profil, anstatt zuerst
    `OPENAI_API_KEY` zu versuchen. Eine explizite Konfiguration von `models.providers.openai` (API-Schlüssel,
    benutzerdefinierte/Azure-Basis-URL) aktiviert wieder die direkte OpenAI-Images-API-
    Route.

  </Step>
  <Step title="Den Agenten fragen">
    _„Generiere ein Bild eines freundlichen Roboter-Maskottchens.“_

    Der Agent ruft `image_generate` automatisch auf. Keine Tool-Allowlist
    erforderlich — es ist standardmäßig aktiviert, wenn ein Anbieter verfügbar ist.

  </Step>
</Steps>

<Warning>
Für OpenAI-kompatible LAN-Endpunkte wie LocalAI behalten Sie die benutzerdefinierte
`models.providers.openai.baseUrl` bei und aktivieren Sie dies explizit mit
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Private und
interne Bildendpunkte bleiben standardmäßig blockiert.
</Warning>

## Häufige Routen

| Ziel                                                 | Modellreferenz                                     | Authentifizierung                      |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| OpenAI-Bildgenerierung mit API-Abrechnung            | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| OpenAI-Bildgenerierung mit Codex-Abonnement-Auth     | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI-PNG/WebP mit transparentem Hintergrund        | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` oder OpenAI Codex OAuth |
| OpenRouter-Bildgenerierung                           | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM-Bildgenerierung                              | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Google-Gemini-Bildgenerierung                        | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`   |

Dasselbe Tool `image_generate` verarbeitet Text-zu-Bild und die Bearbeitung von Referenzbildern.
Verwenden Sie `image` für eine Referenz oder `images` für mehrere Referenzen.
Anbieterspezifisch unterstützte Ausgabehinweise wie `quality`, `outputFormat` und
`background` werden weitergeleitet, wenn verfügbar, und als ignoriert gemeldet, wenn ein
Anbieter sie nicht unterstützt. Die gebündelte Unterstützung für transparente Hintergründe ist
OpenAI-spezifisch; andere Anbieter können PNG-Alpha dennoch beibehalten, wenn ihr
Backend dies ausgibt.

## Unterstützte Anbieter

| Anbieter   | Standardmodell                          | Unterstützung für Bearbeitung         | Auth                                                  |
| ---------- | --------------------------------------- | ------------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | Ja (1 Bild, workflowkonfiguriert)     | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für Cloud  |
| fal        | `fal-ai/flux/dev`                       | Ja                                    | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | Ja                                    | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                |
| LiteLLM    | `gpt-image-2`                           | Ja (bis zu 5 Eingabebilder)           | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | Ja (Subjektreferenz)                  | `MINIMAX_API_KEY` oder MiniMax OAuth (`minimax-portal`) |
| OpenAI     | `gpt-image-2`                           | Ja (bis zu 4 Bilder)                  | `OPENAI_API_KEY` oder OpenAI Codex OAuth              |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | Ja (bis zu 5 Eingabebilder)           | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | Nein                                  | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | Ja (bis zu 5 Bilder)                  | `XAI_API_KEY`                                         |

Verwenden Sie `action: "list"`, um verfügbare Anbieter und Modelle zur Laufzeit zu prüfen:

```text
/tool image_generate action=list
```

## Anbieterfähigkeiten

| Fähigkeit             | ComfyUI             | fal               | Google         | MiniMax                | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------- | ----------------- | -------------- | ---------------------- | -------------- | ----- | -------------- |
| Generieren (max. Anzahl) | Workflow-definiert | 4                 | 4              | 9                      | 4              | 1     | 4              |
| Bearbeiten / Referenz | 1 Bild (Workflow)   | 1 Bild            | Bis zu 5 Bilder | 1 Bild (Subjektreferenz) | Bis zu 5 Bilder | —     | Bis zu 5 Bilder |
| Größensteuerung       | —                   | ✓                 | ✓              | —                      | Bis zu 4K      | —     | —              |
| Seitenverhältnis      | —                   | ✓ (nur Generierung) | ✓            | ✓                      | —              | —     | ✓              |
| Auflösung (1K/2K/4K)  | —                   | ✓                 | ✓              | —                      | —              | —     | 1K, 2K         |

## Tool-Parameter

<ParamField path="prompt" type="string" required>
  Prompt für die Bildgenerierung. Erforderlich für `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "list"' default="generate">
  Verwenden Sie `"list"`, um verfügbare Anbieter und Modelle zur Laufzeit zu prüfen.
</ParamField>
<ParamField path="model" type="string">
  Override für Anbieter/Modell (z. B. `openai/gpt-image-2`). Verwenden Sie
  `openai/gpt-image-1.5` für transparente OpenAI-Hintergründe.
</ParamField>
<ParamField path="image" type="string">
  Pfad oder URL eines einzelnen Referenzbilds für den Bearbeitungsmodus.
</ParamField>
<ParamField path="images" type="string[]">
  Mehrere Referenzbilder für den Bearbeitungsmodus (bis zu 5 bei unterstützenden Anbietern).
</ParamField>
<ParamField path="size" type="string">
  Größenhinweis: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Seitenverhältnis: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Auflösungshinweis.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Qualitätshinweis, wenn der Anbieter dies unterstützt.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Hinweis zum Ausgabeformat, wenn der Anbieter dies unterstützt.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Hintergrundhinweis, wenn der Anbieter dies unterstützt. Verwenden Sie `transparent` mit
  `outputFormat: "png"` oder `"webp"` für Anbieter mit Transparenzunterstützung.
</ParamField>
<ParamField path="count" type="number">Anzahl der zu generierenden Bilder (1–4).</ParamField>
<ParamField path="timeoutMs" type="number">Optionaler Timeout für Anbieteranfragen in Millisekunden.</ParamField>
<ParamField path="filename" type="string">Hinweis für den Ausgabedateinamen.</ParamField>
<ParamField path="openai" type="object">
  Nur OpenAI-Hinweise: `background`, `moderation`, `outputCompression` und `user`.
</ParamField>

<Note>
Nicht alle Anbieter unterstützen alle Parameter. Wenn ein Fallback-Anbieter eine
naheliegende Geometrieoption statt der exakt angeforderten unterstützt, bildet OpenClaw vor der Übermittlung
auf die nächstgelegene unterstützte Größe, das nächstgelegene Seitenverhältnis oder die nächstgelegene Auflösung ab.
Nicht unterstützte Ausgabehinweise werden bei Anbietern, die keine Unterstützung deklarieren,
entfernt und im Tool-Ergebnis gemeldet. Tool-Ergebnisse melden die angewendeten
Einstellungen; `details.normalization` erfasst jede Übersetzung von angefordert zu angewendet.
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

### Reihenfolge der Anbieterauswahl

OpenClaw versucht Anbieter in dieser Reihenfolge:

1. **Parameter `model`** aus dem Tool-Aufruf (falls der Agent einen angibt).
2. **`imageGenerationModel.primary`** aus der Konfiguration.
3. **`imageGenerationModel.fallbacks`** in der angegebenen Reihenfolge.
4. **Automatische Erkennung** — nur auth-gestützte Anbieterstandards:
   - zuerst der aktuelle Standardanbieter;
   - verbleibende registrierte Anbieter für Bildgenerierung in Reihenfolge der Anbieter-ID.

Wenn ein Anbieter fehlschlägt (Authentifizierungsfehler, Ratenlimit usw.), wird automatisch
der nächste konfigurierte Kandidat versucht. Wenn alle fehlschlagen, enthält der Fehler Details
zu jedem Versuch.

<AccordionGroup>
  <Accordion title="Modell-Overrides pro Aufruf sind exakt">
    Ein Modell-Override pro Aufruf versucht nur genau diesen Anbieter/dieses Modell und
    fährt nicht mit konfiguriertem Primär-/Fallback- oder automatisch erkannten Anbietern fort.
  </Accordion>
  <Accordion title="Automatische Erkennung ist auth-bewusst">
    Ein Anbieterstandard wird nur dann in die Kandidatenliste aufgenommen, wenn OpenClaw diesen
    Anbieter tatsächlich authentifizieren kann. Setzen Sie
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, um nur
    explizite Einträge `model`, `primary` und `fallbacks` zu verwenden.
  </Accordion>
  <Accordion title="Timeouts">
    Setzen Sie `agents.defaults.imageGenerationModel.timeoutMs` für langsame Bild-
    Backends. Ein Tool-Parameter `timeoutMs` pro Aufruf überschreibt den konfigurierten
    Standard.
  </Accordion>
  <Accordion title="Zur Laufzeit prüfen">
    Verwenden Sie `action: "list"`, um die aktuell registrierten Anbieter,
    ihre Standardmodelle und Hinweise auf Auth-Umgebungsvariablen zu prüfen.
  </Accordion>
</AccordionGroup>

### Bildbearbeitung

OpenAI, OpenRouter, Google, fal, MiniMax, ComfyUI und xAI unterstützen die Bearbeitung von
Referenzbildern. Übergeben Sie einen Pfad oder eine URL zu einem Referenzbild:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google und xAI unterstützen bis zu 5 Referenzbilder über den
Parameter `images`. fal, MiniMax und ComfyUI unterstützen 1.

## Detaillierte Anbieteransichten

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (und gpt-image-1.5)">
    Die OpenAI-Bildgenerierung verwendet standardmäßig `openai/gpt-image-2`. Wenn ein
    OAuth-Profil `openai-codex` konfiguriert ist, verwendet OpenClaw dasselbe
    OAuth-Profil wieder, das von Chat-Modellen mit Codex-Abonnement verwendet wird, und sendet die
    Bildanfrage über das Codex-Responses-Backend. Legacy-Codex-Basis-
    URLs wie `https://chatgpt.com/backend-api` werden für Bildanfragen auf
    `https://chatgpt.com/backend-api/codex` kanonisiert. OpenClaw
    fällt für diese Anfrage **nicht** stillschweigend auf `OPENAI_API_KEY` zurück —
    um direktes Routing über die OpenAI Images API zu erzwingen, konfigurieren Sie
    `models.providers.openai` explizit mit einem API-Schlüssel, einer benutzerdefinierten Basis-URL
    oder einem Azure-Endpunkt.

    Die Modelle `openai/gpt-image-1.5`, `openai/gpt-image-1` und
    `openai/gpt-image-1-mini` können weiterhin explizit ausgewählt werden. Verwenden Sie
    `gpt-image-1.5` für PNG-/WebP-Ausgabe mit transparentem Hintergrund; die aktuelle
    `gpt-image-2`-API lehnt `background: "transparent"` ab.

    `gpt-image-2` unterstützt sowohl Text-zu-Bild-Generierung als auch
    die Bearbeitung von Referenzbildern über dasselbe Tool `image_generate`.
    OpenClaw leitet `prompt`, `count`, `size`, `quality`, `outputFormat`
    und Referenzbilder an OpenAI weiter. OpenAI erhält **nicht**
    direkt `aspectRatio` oder `resolution`; wenn möglich bildet OpenClaw
    diese auf eine unterstützte `size` ab, andernfalls meldet das Tool sie als
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

    `openai.background` akzeptiert `transparent`, `opaque` oder `auto`;
    transparente Ausgaben erfordern `outputFormat` `png` oder `webp` und ein
    OpenAI-Bildmodell mit Transparenzunterstützung. OpenClaw leitet standardmäßige
    transparente Hintergrundanfragen an `gpt-image-2` auf `gpt-image-1.5` um.
    `openai.outputCompression` gilt für JPEG-/WebP-Ausgaben.

    Der Hintergrundhinweis auf oberster Ebene `background` ist anbieterneutral und wird derzeit
    bei Auswahl des OpenAI-Anbieters dem gleichen OpenAI-Request-Feld `background` zugeordnet.
    Anbieter, die keine Unterstützung für Hintergründe deklarieren, geben dies
    stattdessen in `ignoredOverrides` zurück, anstatt den nicht unterstützten Parameter zu erhalten.

    Um die OpenAI-Bildgenerierung über ein Azure-OpenAI-Deployment
    statt über `api.openai.com` zu routen, siehe
    [Azure-OpenAI-Endpunkte](/de/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="OpenRouter-Bildmodelle">
    Die OpenRouter-Bildgenerierung verwendet denselben `OPENROUTER_API_KEY` und
    läuft über OpenRouters Image-API für Chat Completions. Wählen Sie
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
    Gemini-kompatible Hinweise zu `aspectRatio` / `resolution` an OpenRouter weiter.
    Aktuelle integrierte Shortcuts für OpenRouter-Bildmodelle umfassen
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` und `openai/gpt-5.4-image-2`. Verwenden Sie
    `action: "list"`, um zu sehen, was Ihr konfiguriertes Plugin bereitstellt.

  </Accordion>
  <Accordion title="MiniMax mit doppelter Authentifizierung">
    MiniMax-Bildgenerierung ist über beide gebündelten MiniMax-
    Authentifizierungspfade verfügbar:

    - `minimax/image-01` für Setups mit API-Schlüssel
    - `minimax-portal/image-01` für OAuth-Setups

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Der gebündelte xAI-Anbieter verwendet `/v1/images/generations` für reine Prompt-
    Anfragen und `/v1/images/edits`, wenn `image` oder `images` vorhanden ist.

    - Modelle: `xai/grok-imagine-image`, `xai/grok-imagine-image-pro`
    - Anzahl: bis zu 4
    - Referenzen: ein `image` oder bis zu fünf `images`
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Auflösungen: `1K`, `2K`
    - Ausgaben: werden als von OpenClaw verwaltete Bildanhänge zurückgegeben

    OpenClaw stellt bewusst keine xAI-nativen Optionen wie `quality`, `mask`,
    `user` oder zusätzliche native-only-Seitenverhältnisse bereit, solange diese Steuerelemente nicht
    im gemeinsamen anbieterübergreifenden Vertrag von `image_generate` existieren.

  </Accordion>
</AccordionGroup>

## Beispiele

<Tabs>
  <Tab title="Generieren (4K Querformat)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generieren (transparentes PNG)">
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
  <Tab title="Generieren (zwei quadratische)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Bearbeiten (eine Referenz)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Bearbeiten (mehrere Referenzen)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

Dieselben Flags `--output-format` und `--background` sind auch für
`openclaw infer image edit` verfügbar; `--openai-background` bleibt als
OpenAI-spezifischer Alias erhalten. Gebündelte Anbieter außer OpenAI deklarieren heute keine
explizite Hintergrundsteuerung, daher wird `background: "transparent"` bei ihnen
als ignoriert gemeldet.

## Verwandte Themen

- [Tool-Überblick](/de/tools) — alle verfügbaren Agent-Tools
- [ComfyUI](/de/providers/comfy) — Einrichtung von lokalem ComfyUI und Comfy Cloud Workflows
- [fal](/de/providers/fal) — Einrichtung des Bild- und Videoanbieters fal
- [Google (Gemini)](/de/providers/google) — Einrichtung des Gemini-Bildanbieters
- [MiniMax](/de/providers/minimax) — Einrichtung des MiniMax-Bildanbieters
- [OpenAI](/de/providers/openai) — Einrichtung des OpenAI-Images-Anbieters
- [Vydra](/de/providers/vydra) — Einrichtung von Vydra für Bild, Video und Sprache
- [xAI](/de/providers/xai) — Einrichtung von Grok für Bild, Video, Suche, Codeausführung und TTS
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) — Konfiguration von `imageGenerationModel`
- [Modelle](/de/concepts/models) — Modellkonfiguration und Failover
