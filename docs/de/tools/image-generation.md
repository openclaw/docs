---
read_when:
    - Bilder über den Agent generieren oder bearbeiten
    - Bildgenerierungs-Provider und Modelle konfigurieren
    - Die Parameter des Tools image_generate verstehen
sidebarTitle: Image generation
summary: Bilder über image_generate mit OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI, Vydra generieren und bearbeiten
title: Bildgenerierung
x-i18n:
    generated_at: "2026-06-27T18:19:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df8187d3798925cf33ba243ee92c5c402eb4ba754b0c24521e965b60a0add947
    source_path: tools/image-generation.md
    workflow: 16
---

Das Tool `image_generate` ermöglicht es dem Agenten, Bilder mit Ihren
konfigurierten Providern zu erstellen und zu bearbeiten. In Chat-Sitzungen läuft die Bilderzeugung asynchron:
OpenClaw erfasst eine Hintergrundaufgabe, gibt die Aufgaben-ID sofort zurück und weckt
den Agenten, wenn der Provider fertig ist. Der Abschluss-Agent folgt dem
normalen Modus der Sitzung für sichtbare Antworten: automatische Zustellung der finalen Antwort, wenn
konfiguriert, oder `message(action="send")`, wenn die Sitzung das `message`-Tool
erfordert. Wenn die anfragende Sitzung inaktiv ist oder ihr aktives Wecken fehlschlägt und in der Abschlussantwort noch
generierte Bilder fehlen, sendet OpenClaw einen
idempotenten direkten Fallback nur mit den fehlenden Bildern.

<Note>
Das Tool erscheint nur, wenn mindestens ein Provider für Bilderzeugung
verfügbar ist. Wenn Sie `image_generate` nicht in den Tools Ihres Agenten sehen,
konfigurieren Sie `agents.defaults.imageGenerationModel`, richten Sie einen Provider-API-Schlüssel ein
oder melden Sie sich mit OpenAI ChatGPT/Codex OAuth an.
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

    ChatGPT/Codex OAuth verwendet dieselbe Modellreferenz `openai/gpt-image-2`. Wenn ein
    `openai`-OAuth-Profil konfiguriert ist, leitet OpenClaw Bildanfragen
    über dieses OAuth-Profil weiter, statt zuerst
    `OPENAI_API_KEY` zu versuchen. Eine explizite `models.providers.openai`-Konfiguration (API-Schlüssel,
    benutzerdefinierte/Azure-Basis-URL) aktiviert wieder die direkte Route über die OpenAI Images API.

  </Step>
  <Step title="Den Agenten fragen">
    _„Erzeuge ein Bild eines freundlichen Roboter-Maskottchens.“_

    Der Agent ruft `image_generate` automatisch auf. Es ist kein Allowlisting für Tools
    erforderlich - es ist standardmäßig aktiviert, wenn ein Provider verfügbar ist. Das Tool
    gibt eine Hintergrundaufgaben-ID zurück, danach sendet der Abschluss-Agent den generierten
    Anhang über das `message`-Tool, sobald er bereit ist.

  </Step>
</Steps>

<Warning>
Für OpenAI-kompatible LAN-Endpunkte wie LocalAI behalten Sie die benutzerdefinierte
`models.providers.openai.baseUrl` bei und stimmen Sie explizit mit
`browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` zu. Private und
interne Bild-Endpunkte bleiben standardmäßig blockiert.
</Warning>

## Häufige Routen

| Ziel                                                 | Modellreferenz                                    | Authentifizierung                     |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| OpenAI-Bilderzeugung mit API-Abrechnung             | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| OpenAI-Bilderzeugung mit Codex-Abonnementauthentifizierung | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI PNG/WebP mit transparentem Hintergrund        | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` oder OpenAI Codex OAuth |
| DeepInfra-Bilderzeugung                             | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| fal Krea 2 expressive/stilgesteuerte Erzeugung      | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter-Bilderzeugung                            | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM-Bilderzeugung                               | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft Foundry MAI-Bilderzeugung                 | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` oder Entra ID   |
| Google Gemini-Bilderzeugung                         | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` oder `GOOGLE_API_KEY` |

Dasselbe Tool `image_generate` verarbeitet Text-zu-Bild und
Bearbeitung mit Referenzbildern. Verwenden Sie `image` für eine Referenz oder `images` für mehrere Referenzen.
Bei Krea-2-Modellen auf fal werden diese Referenzen als Stilreferenzen
statt als Bearbeitungseingaben gesendet.
Vom Provider unterstützte Ausgabehinweise wie `quality`, `outputFormat` und
`background` werden weitergeleitet, wenn verfügbar, und als ignoriert gemeldet, wenn ein
Provider sie nicht unterstützt. Die gebündelte Unterstützung für transparente Hintergründe ist
OpenAI-spezifisch; andere Provider können PNG-Alpha dennoch erhalten, wenn ihr
Backend es ausgibt.

## Unterstützte Provider

| Provider          | Standardmodell                         | Bearbeitungsunterstützung           | Authentifizierung                                      |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Ja (1 Bild, per Workflow konfiguriert) | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für Cloud |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Ja (1 Bild)                        | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Ja (modellspezifische Limits)      | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image-preview`        | Ja                                 | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                |
| LiteLLM           | `gpt-image-2`                           | Ja (bis zu 5 Eingabebilder)        | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Ja (nur MAI-Image-2.5-Modelle)     | `AZURE_OPENAI_API_KEY` oder Entra ID (`az login`)     |
| MiniMax           | `image-01`                              | Ja (Motivreferenz)                 | `MINIMAX_API_KEY` oder MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Ja (bis zu 4 Bilder)               | `OPENAI_API_KEY` oder OpenAI ChatGPT/Codex OAuth      |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Ja (bis zu 5 Eingabebilder)        | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Nein                               | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Ja (bis zu 5 Bilder)               | `XAI_API_KEY`                                         |

Verwenden Sie `action: "list"`, um verfügbare Provider und Modelle zur Laufzeit zu prüfen:

```text
/tool image_generate action=list
```

Verwenden Sie `action: "status"`, um die aktive Aufgabe zur Bilderzeugung für die
aktuelle Sitzung zu prüfen:

```text
/tool image_generate action=status
```

## Provider-Funktionen

| Funktion              | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| Erzeugen (max. Anzahl) | Durch Workflow definiert | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| Bearbeiten / Referenz  | 1 Bild (Workflow) | 1 Bild    | Flux: 1; GPT: 10; Krea-Stilreferenzen: 10; NB2: 14 | Bis zu 5 Bilder | 1 Bild            | 1 Bild (Motivreferenz) | Bis zu 5 Bilder | -     | Bis zu 5 Bilder |
| Größensteuerung        | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | Bis zu 4K      | -     | -              |
| Seitenverhältnis       | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| Auflösung (1K/2K/4K)   | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## Tool-Parameter

<ParamField path="prompt" type="string" required>
  Prompt für die Bilderzeugung. Erforderlich für `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Verwenden Sie `"status"`, um die aktive Sitzungsaufgabe zu prüfen, oder `"list"`, um
  verfügbare Provider und Modelle zur Laufzeit zu prüfen.
</ParamField>
<ParamField path="model" type="string">
  Provider-/Modellüberschreibung (z. B. `openai/gpt-image-2`). Verwenden Sie
  `openai/gpt-image-1.5` für transparente OpenAI-Hintergründe.
</ParamField>
<ParamField path="image" type="string">
  Einzelner Referenzbildpfad oder URL für den Bearbeitungsmodus.
</ParamField>
<ParamField path="images" type="string[]">
  Mehrere Referenzbilder für den Bearbeitungsmodus oder Stilreferenzmodelle (bis zu 10
  über das gemeinsame Tool; providerspezifische Limits gelten weiterhin).
</ParamField>
<ParamField path="size" type="string">
  Größenhinweis: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Seitenverhältnis: `1:1`, `2:3`, `3:2`, `2.35:1`, `3:4`, `4:3`, `4:5`,
  `5:4`, `9:16`, `16:9`, `21:9`, `4:1`, `1:4`, `8:1`, `1:8`. Provider
  validieren ihre modellspezifische Teilmenge.
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
  Optionales Timeout für Provider-Anfragen in Millisekunden. Wenn Codex
  `image_generate` über dynamische Tools aufruft, überschreibt dieser Wert pro Aufruf weiterhin
  den konfigurierten Standardwert und ist auf 600000 ms begrenzt.
</ParamField>
<ParamField path="filename" type="string">Hinweis für den Ausgabedateinamen.</ParamField>
<ParamField path="openai" type="object">
  Nur OpenAI-Hinweise: `background`, `moderation`, `outputCompression` und `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Kreativitätssteuerung für fal Krea 2. Standard ist `medium`.
</ParamField>

<Note>
Nicht alle Provider unterstützen alle Parameter. Wenn ein Fallback-Provider eine
ähnliche Geometrieoption statt der exakt angeforderten unterstützt, ordnet OpenClaw vor dem Absenden
der nächstliegenden unterstützten Größe, dem nächstliegenden Seitenverhältnis oder der nächstliegenden Auflösung zu.
Nicht unterstützte Ausgabehinweise werden für Provider verworfen, die keine
Unterstützung deklarieren, und im Tool-Ergebnis gemeldet. Tool-Ergebnisse melden die angewendeten
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

### Auswahlreihenfolge der Provider

OpenClaw versucht Provider in dieser Reihenfolge:

1. **Parameter `model`** aus dem Tool-Aufruf (falls der Agent einen angibt).
2. **`imageGenerationModel.primary`** aus der Konfiguration.
3. **`imageGenerationModel.fallbacks`** der Reihe nach.
4. **Automatische Erkennung** - nur auth-gestützte Provider-Standards:
   - aktueller Standard-Provider zuerst;
   - übrige registrierte Bildgenerierungs-Provider in Provider-ID-Reihenfolge.

Wenn ein Provider fehlschlägt (Authentifizierungsfehler, Ratenlimit usw.), wird der nächste konfigurierte
Kandidat automatisch versucht. Wenn alle fehlschlagen, enthält der Fehler Details
zu jedem Versuch.

<AccordionGroup>
  <Accordion title="Modellüberschreibungen pro Aufruf sind exakt">
    Eine `model`-Überschreibung pro Aufruf versucht nur diesen Provider/dieses Modell und fährt
    nicht mit konfigurierten Primary-/Fallback- oder automatisch erkannten Providern fort.
  </Accordion>
  <Accordion title="Automatische Erkennung ist auth-bewusst">
    Ein Provider-Standard wird nur dann in die Kandidatenliste aufgenommen, wenn OpenClaw
    diesen Provider tatsächlich authentifizieren kann. Setzen Sie
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, um nur
    explizite Einträge für `model`, `primary` und `fallbacks` zu verwenden.
  </Accordion>
  <Accordion title="Timeouts">
    Setzen Sie `agents.defaults.imageGenerationModel.timeoutMs` für langsame Bild-
    Backends. Ein Tool-Parameter `timeoutMs` pro Aufruf überschreibt den konfigurierten
    Standard, und konfigurierte Standards überschreiben von Plugins definierte Provider-
    Standards. Von Google und OpenRouter gehostete Bild-Provider verwenden Standards von
    180 Sekunden; Microsoft Foundry MAI, xAI und Azure OpenAI-Bildgenerierung verwenden
    600 Sekunden. Codex-Dynamic-Tool-Aufrufe verwenden einen 120-Sekunden-Standard für die
    `image_generate`-Bridge und respektieren bei Konfiguration dasselbe Timeout-Budget,
    begrenzt durch das Dynamic-Tool-Bridge-Maximum von OpenClaw von 600000 ms.
  </Accordion>
  <Accordion title="Zur Laufzeit prüfen">
    Verwenden Sie `action: "list"`, um die aktuell registrierten Provider,
    ihre Standardmodelle und Hinweise zu Auth-Env-Vars zu prüfen.
  </Accordion>
</AccordionGroup>

### Bildbearbeitung

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI und xAI unterstützen das Bearbeiten von Referenzbildern. Krea 2-Modelle auf fal verwenden dieselben
Felder `image` / `images` als Stilreferenzen statt als Bearbeitungseingaben. Übergeben Sie
einen Referenzbildpfad oder eine URL:

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter, Google und xAI unterstützen bis zu 5 Referenzbilder über den
Parameter `images`. fal unterstützt 1 Referenzbild für Flux Image-to-Image, bis
zu 10 für GPT Image 2-Bearbeitungen, bis zu 10 Stilreferenzen für Krea 2 und bis zu
14 für Nano Banana 2-Bearbeitungen. Microsoft Foundry, MiniMax und ComfyUI unterstützen 1.

## Provider-Details

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (und gpt-image-1.5)">
    OpenAI-Bildgenerierung verwendet standardmäßig `openai/gpt-image-2`. Wenn ein
    `openai`-OAuth-Profil konfiguriert ist, verwendet OpenClaw dasselbe
    OAuth-Profil erneut, das von Codex-Abonnement-Chatmodellen verwendet wird, und sendet die
    Bildanfrage über das Codex Responses-Backend. Legacy-Codex-Basis-
    URLs wie `https://chatgpt.com/backend-api` werden für Bildanfragen zu
    `https://chatgpt.com/backend-api/codex` kanonisiert. OpenClaw
    fällt für diese Anfrage **nicht** stillschweigend auf `OPENAI_API_KEY` zurück -
    um direktes Routing über die OpenAI Images API zu erzwingen, konfigurieren Sie
    `models.providers.openai` explizit mit einem API-Schlüssel, einer benutzerdefinierten Basis-URL
    oder einem Azure-Endpunkt.

    Die Modelle `openai/gpt-image-1.5`, `openai/gpt-image-1` und
    `openai/gpt-image-1-mini` können weiterhin explizit ausgewählt werden. Verwenden Sie
    `gpt-image-1.5` für PNG/WebP-Ausgabe mit transparentem Hintergrund; die aktuelle
    `gpt-image-2`-API lehnt `background: "transparent"` ab.

    `gpt-image-2` unterstützt sowohl Text-zu-Bild-Generierung als auch
    Bearbeitung von Referenzbildern über dasselbe Tool `image_generate`.
    OpenClaw leitet `prompt`, `count`, `size`, `quality`, `outputFormat`
    und Referenzbilder an OpenAI weiter. OpenAI erhält **nicht**
    `aspectRatio` oder `resolution` direkt; wenn möglich, ordnet OpenClaw
    diese einer unterstützten `size` zu, andernfalls meldet das Tool sie als
    ignorierte Überschreibungen.

    OpenAI-spezifische Optionen liegen im Objekt `openai`:

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
    transparenzfähiges OpenAI-Bildmodell. OpenClaw routet standardmäßige
    `gpt-image-2`-Anfragen mit transparentem Hintergrund an `gpt-image-1.5`.
    `openai.outputCompression` gilt für JPEG/WebP-Ausgaben und wird
    für PNG-Ausgaben ignoriert.

    Der Top-Level-Hinweis `background` ist Provider-neutral und wird derzeit
    demselben OpenAI-Anfragefeld `background` zugeordnet, wenn der OpenAI-Provider
    ausgewählt ist. Provider, die keine Hintergrundunterstützung deklarieren, geben
    ihn in `ignoredOverrides` zurück, statt den nicht unterstützten Parameter zu erhalten.

    Um OpenAI-Bildgenerierung über eine Azure OpenAI-Bereitstellung
    statt über `api.openai.com` zu routen, siehe
    [Azure OpenAI-Endpunkte](/de/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Microsoft Foundry MAI-Bildmodelle">
    Microsoft Foundry-Bildgenerierung verwendet bereitgestellte MAI-Bildbereitstellungsnamen
    unter dem Provider-Präfix `microsoft-foundry/`. Es gibt kein Provider-weites
    Standardmodell, weil die MAI-API Ihren Bereitstellungsnamen im Feld
    `model` erwartet:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "microsoft-foundry/<deployment-name>",
            timeoutMs: 600_000,
          },
        },
      },
    }
    ```

    Der Provider verwendet Microsoft Foundrys MAI-API, nicht die OpenAI Images API:

    - Generierungsendpunkt: `/mai/v1/images/generations`
    - Bearbeitungsendpunkt: `/mai/v1/images/edits`
    - Auth: `AZURE_OPENAI_API_KEY` / Provider-API-Schlüssel oder Entra ID über `az login`
    - Ausgabe: ein PNG-Bild
    - Größe: Standard `1024x1024`; Breite und Höhe müssen jeweils mindestens 768 px betragen,
      und die Gesamtpixelzahl darf höchstens 1.048.576 betragen
    - Bearbeitungen: ein PNG- oder JPEG-Referenzbild, unterstützt nur von
      `MAI-Image-2.5-Flash`- und `MAI-Image-2.5`-Bereitstellungen

    Prompt-only-Generierung kann einen benutzerdefinierten Bereitstellungsnamen verwenden, wenn nur der
    Foundry-Endpunkt konfiguriert ist. Bearbeitungen mit benutzerdefinierten Bereitstellungsnamen benötigen
    Onboarding-/Modellmetadaten, damit OpenClaw überprüfen kann, dass die Bereitstellung
    auf `MAI-Image-2.5-Flash` oder `MAI-Image-2.5` basiert.

    Aktuelle MAI-Bildmodelle sind `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` und `MAI-Image-2`. Siehe
    [Microsoft Foundry-Plugin](/de/plugins/reference/microsoft-foundry) für Einrichtung
    und Chatmodellverhalten.

  </Accordion>
  <Accordion title="OpenRouter-Bildmodelle">
    OpenRouter-Bildgenerierung verwendet denselben `OPENROUTER_API_KEY` und
    routet über OpenRouters Chat-Completions-Bild-API. Wählen Sie
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
    Gemini-kompatible Hinweise für `aspectRatio` / `resolution` an OpenRouter weiter.
    Aktuelle integrierte OpenRouter-Bildmodell-Kurzbefehle umfassen
    `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` und `openai/gpt-5.4-image-2`. Verwenden Sie
    `action: "list"`, um zu sehen, was Ihr konfiguriertes Plugin bereitstellt.

  </Accordion>
  <Accordion title="fal Krea 2">
    Krea 2-Modelle auf fal verwenden fals natives Krea-Schema statt des generischen
    `image_size`-Schemas, das von Flux verwendet wird. OpenClaw sendet:

    - `aspect_ratio` für Hinweise zum Seitenverhältnis
    - `creativity`, standardmäßig `medium`
    - `image_style_references`, wenn `image` oder `images` bereitgestellt werden

    Wählen Sie Krea 2 Medium für schnellere ausdrucksstarke Illustration und Krea 2 Large
    für langsamere, detailliertere fotorealistische und texturierte Looks:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/krea/v2/medium/text-to-image",
          },
        },
      },
    }
    ```

    Krea 2 gibt derzeit ein Bild pro Anfrage zurück. Bevorzugen Sie `aspectRatio` für
    Krea; OpenClaw ordnet `size` dem nächstgelegenen unterstützten Krea-Seitenverhältnis zu und
    lehnt `resolution` für Krea ab, statt es zu verwerfen. Verwenden Sie `fal.creativity`,
    wenn Sie eine native Krea-Kreativitätsstufe wünschen:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "A cyber zine portrait with risograph texture",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="MiniMax Dual-Auth">
    MiniMax-Bildgenerierung ist über beide gebündelten MiniMax-
    Auth-Pfade verfügbar:

    - `minimax/image-01` für API-Schlüssel-Setups
    - `minimax-portal/image-01` für OAuth-Setups

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Der gebündelte xAI-Provider verwendet `/v1/images/generations` für Prompt-only-
    Anfragen und `/v1/images/edits`, wenn `image` oder `images` vorhanden ist.

    - Modelle: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Anzahl: bis zu 4
    - Referenzen: ein `image` oder bis zu fünf `images`
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `2:3`, `3:2`
    - Auflösungen: `1K`, `2K`
    - Ausgaben: werden als von OpenClaw verwaltete Bildanhänge zurückgegeben

    OpenClaw stellt xAI-native `quality`, `mask`,
    `user` oder zusätzliche nur native Seitenverhältnisse absichtlich nicht bereit,
    bis diese Steuerungen im gemeinsamen Provider-übergreifenden Vertrag
    `image_generate` existieren.

  </Accordion>
</AccordionGroup>

## Beispiele

<Tabs>
  <Tab title="Generieren (4K-Landschaft)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generieren (transparentes PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

Äquivalente CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="Generieren (OpenAI niedrige Qualität)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Low-cost draft poster for a quiet productivity app" quality=low openai='{"moderation":"low"}'
```

Äquivalente CLI:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Low-cost draft poster for a quiet productivity app" \
  --json
```

  </Tab>
  <Tab title="Generieren (zwei quadratisch)">
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
  <Tab title="Krea-Stilreferenzen">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="An expressive editorial portrait using this color palette and print texture" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Dieselben Flags `--output-format`, `--background`, `--quality` und
`--openai-moderation` sind in `openclaw infer image edit` verfügbar;
`--openai-background` bleibt als OpenAI-spezifischer Alias erhalten. Mitgelieferte Provider
außer OpenAI deklarieren derzeit keine explizite Hintergrundsteuerung, daher wird
`background: "transparent"` bei ihnen als ignoriert gemeldet.

## Verwandte Themen

- [Tools-Übersicht](/de/tools) - alle verfügbaren Agent-Tools
- [ComfyUI](/de/providers/comfy) - Einrichtung lokaler ComfyUI- und Comfy Cloud-Workflows
- [fal](/de/providers/fal) - Einrichtung des fal-Bild- und Video-Providers
- [Google (Gemini)](/de/providers/google) - Einrichtung des Gemini-Bild-Providers
- [Microsoft Foundry-Plugin](/de/plugins/reference/microsoft-foundry) - Einrichtung von Microsoft Foundry Chat und MAI-Bildern
- [MiniMax](/de/providers/minimax) - Einrichtung des MiniMax-Bild-Providers
- [OpenAI](/de/providers/openai) - Einrichtung des OpenAI Images-Providers
- [Vydra](/de/providers/vydra) - Einrichtung von Vydra für Bild, Video und Sprache
- [xAI](/de/providers/xai) - Einrichtung von Grok für Bild, Video, Suche, Codeausführung und TTS
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) - `imageGenerationModel`-Konfiguration
- [Modelle](/de/concepts/models) - Modellkonfiguration und Failover
