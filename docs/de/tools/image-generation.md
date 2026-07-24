---
read_when:
    - Bilder über den Agenten generieren oder bearbeiten
    - Konfigurieren von Providern und Modellen für die Bilderzeugung
    - Grundlegendes zu den Parametern des Tools image_generate
sidebarTitle: Image generation
summary: Bilder über image_generate mit OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI und Vydra generieren und bearbeiten
title: Bilderzeugung
x-i18n:
    generated_at: "2026-07-24T04:10:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9688b1bc649713d8ed345a69a28d20b36ecd768b6a6d28a2d6c022d65b081862
    source_path: tools/image-generation.md
    workflow: 16
---

Das Tool `image_generate` erstellt und bearbeitet Bilder über Ihre konfigurierten
Provider. In Chatsitzungen wird es asynchron ausgeführt: OpenClaw erfasst eine
Hintergrundaufgabe, gibt die Aufgaben-ID sofort zurück und aktiviert den Agenten,
wenn der Provider fertig ist. Der Abschlussagent folgt dem normalen Modus der
Sitzung für sichtbare Antworten: automatische Zustellung der abschließenden Antwort,
wenn dies konfiguriert ist, oder `message(action="send")`, wenn die Sitzung das
Nachrichten-Tool erfordert. Wenn die anfordernde Sitzung inaktiv ist oder ihre aktive
Aktivierung fehlschlägt, sendet OpenClaw einen idempotenten direkten Fallback mit den
generierten Bildern, damit das Ergebnis nicht verloren geht.

<Note>
Das Tool wird nur angezeigt, wenn mindestens ein Provider für die Bilderzeugung
verfügbar ist. Wenn `image_generate` nicht in den Tools Ihres Agenten angezeigt
wird, konfigurieren Sie `agents.defaults.mediaModels.image`, richten Sie einen Provider-API-Schlüssel
ein oder melden Sie sich mit OpenAI ChatGPT/Codex OAuth an.
</Note>

## Schnellstart

<Steps>
  <Step title="Authentifizierung konfigurieren">
    Legen Sie einen API-Schlüssel für mindestens einen Provider fest (zum Beispiel
    `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) oder melden Sie
    sich mit OpenAI Codex OAuth an.
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

    ChatGPT/Codex OAuth verwendet dieselbe Modellreferenz `openai/gpt-image-2`. Wenn
    ein OAuth-Profil `openai` konfiguriert ist, leitet OpenClaw Bildanfragen
    über dieses OAuth-Profil weiter, anstatt zuerst `OPENAI_API_KEY` zu versuchen.
    Eine explizite Konfiguration von `models.providers.openai` (API-Schlüssel,
    benutzerdefinierte/Azure-Basis-URL) aktiviert wieder den direkten Weg über die
    OpenAI Images API.

  </Step>
  <Step title="Den Agenten anweisen">
    _„Erzeuge ein Bild eines freundlichen Robotermaskottchens.“_

    Der Agent ruft `image_generate` automatisch auf. Das Tool muss nicht in eine
    Zulassungsliste aufgenommen werden – es ist standardmäßig aktiviert, wenn ein
    Provider verfügbar ist. Das Tool gibt eine Hintergrundaufgaben-ID zurück;
    anschließend sendet der Abschlussagent den generierten Anhang über das Tool
    `message`, sobald er bereit ist.

  </Step>
</Steps>

<Warning>
Behalten Sie bei OpenAI-kompatiblen LAN-Endpunkten wie LocalAI die
benutzerdefinierte Einstellung `models.providers.openai.baseUrl` bei und aktivieren Sie sie
ausdrücklich mit `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Private und interne Bildendpunkte bleiben
standardmäßig gesperrt.
</Warning>

## Gängige Wege

| Ziel                                                 | Modellreferenz                                      | Authentifizierung                       |
| ---------------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| OpenAI-Bilderzeugung mit API-Abrechnung              | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| OpenAI-Bilderzeugung mit Codex-Abonnementauthentifizierung | `openai/gpt-image-2`                               | OpenAI ChatGPT/Codex OAuth             |
| OpenAI-PNG/WebP mit transparentem Hintergrund        | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` oder OpenAI Codex OAuth |
| DeepInfra-Bilderzeugung                              | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| Ausdrucksstarke/stilgesteuerte Erzeugung mit fal Krea 2 | `fal/krea/v2/medium/text-to-image`                 | `FAL_KEY`                              |
| OpenRouter-Bilderzeugung                             | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM-Bilderzeugung                                | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Microsoft-Foundry-MAI-Bilderzeugung                  | `microsoft-foundry/<deployment-name>`              | `AZURE_OPENAI_API_KEY` oder Entra ID     |
| Google-Gemini-Bilderzeugung                          | `google/gemini-3.1-flash-image`                    | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`   |

Dasselbe Tool verarbeitet Text-zu-Bild-Erzeugung und die Bearbeitung von
Referenzbildern. Verwenden Sie `image` für eine Referenz oder
`images` für mehrere. Bei Krea-2-Modellen auf fal werden diese Referenzen
als Stilreferenzen statt als Bearbeitungseingaben gesendet.
Vom Provider unterstützte Ausgabehinweise wie `quality`,
`outputFormat` und `background` werden weitergeleitet, sofern verfügbar,
und als ignoriert gemeldet, wenn ein Provider keine Unterstützung dafür deklariert.
Die gebündelte Unterstützung für transparente Hintergründe ist OpenAI-spezifisch;
andere Provider können den PNG-Alphakanal dennoch beibehalten, wenn ihr Backend ihn
ausgibt.

## Unterstützte Provider

| Provider          | Standardmodell                          | Bearbeitungsunterstützung           | Authentifizierung                                      |
| ----------------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI           | `workflow`                              | Ja (1 Bild, Workflow-konfiguriert) | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für die Cloud |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Ja (1 Bild)                        | `DEEPINFRA_API_KEY`                                   |
| fal               | `fal-ai/flux/dev`                       | Ja (modellspezifische Beschränkungen) | `FAL_KEY`                                             |
| Google            | `gemini-3.1-flash-image`                | Ja (bis zu 5 Bilder)               | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                  |
| LiteLLM           | `gpt-image-2`                           | Ja (bis zu 5 Eingabebilder)        | `LITELLM_API_KEY`                                     |
| Microsoft Foundry | `<deployment-name>`                     | Ja (nur MAI-Image-2.5-Modelle)     | `AZURE_OPENAI_API_KEY` oder Entra ID (`az login`)       |
| MiniMax           | `image-01`                              | Ja (Motivreferenz)                 | `MINIMAX_API_KEY` oder MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Ja (bis zu 5 Bilder)               | `OPENAI_API_KEY` oder OpenAI ChatGPT/Codex OAuth        |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Ja (bis zu 5 Eingabebilder)        | `OPENROUTER_API_KEY`                                  |
| Vydra             | `grok-imagine`                          | Nein                               | `VYDRA_API_KEY`                                       |
| xAI               | `grok-imagine-image`                    | Ja (bis zu 3 Bilder)               | `XAI_API_KEY`                                         |

Verwenden Sie `action: "list"`, um die zur Laufzeit verfügbaren Provider und
Modelle anzuzeigen:

```text
/tool image_generate action=list
```

Verwenden Sie `action: "status"`, um die aktive Bilderzeugungsaufgabe der aktuellen
Sitzung anzuzeigen:

```text
/tool image_generate action=status
```

## Provider-Funktionen

| Funktion              | ComfyUI            | DeepInfra | fal                                            | Google         | Microsoft Foundry | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | ---------------------------------------------- | -------------- | ----------------- | --------------------- | -------------- | ----- | -------------- |
| Erzeugen (Höchstzahl) | 1                  | 4         | 4                                              | 4              | 1                 | 9                     | 4              | 1     | 4              |
| Bearbeitung / Referenz | 1 Bild (Workflow)  | 1 Bild    | Flux: 1; GPT: 10; Krea-Stilreferenzen: 10; NB2: 14 | Bis zu 5 Bilder | 1 Bild            | 1 Bild (Motivreferenz) | Bis zu 5 Bilder | -     | Bis zu 3 Bilder |
| Größensteuerung       | -                  | ✓         | ✓                                              | ✓              | ✓                 | -                     | Bis zu 4K      | -     | -              |
| Seitenverhältnis      | -                  | -         | ✓                                              | ✓              | -                 | ✓                     | -              | -     | ✓              |
| Auflösung (1K/2K/4K)  | -                  | -         | ✓                                              | ✓              | -                 | -                     | -              | -     | 1K, 2K         |

## Tool-Parameter

<ParamField path="prompt" type="string" required>
  Eingabeaufforderung für die Bilderzeugung. Für `action: "generate"` erforderlich.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Verwenden Sie `"status"`, um die aktive Sitzungsaufgabe anzuzeigen, oder
  `"list"`, um die zur Laufzeit verfügbaren Provider und Modelle anzuzeigen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibung von Provider/Modell (z. B. `openai/gpt-image-2`). Verwenden Sie
  `openai/gpt-image-1.5` für transparente OpenAI-Hintergründe.
</ParamField>
<ParamField path="image" type="string">
  Pfad oder URL eines einzelnen Referenzbilds für den Bearbeitungsmodus.
</ParamField>
<ParamField path="images" type="string[]">
  Mehrere Referenzbilder für den Bearbeitungsmodus oder Stilreferenzmodelle (bis zu
  14 über das gemeinsame Tool; providerspezifische Beschränkungen gelten weiterhin).
</ParamField>
<ParamField path="size" type="string">
  Größenhinweis: `1024x1024`, `1536x1024`, `1024x1536`, `2048x2048`, `3840x2160`.
</ParamField>
<ParamField path="aspectRatio" type="string">
  Seitenverhältnis: `1:1`, `2:1`, `20:9`, `19.5:9`, `2:3`, `3:2`, `2.35:1`, `3:4`,
  `4:3`, `4:5`, `5:4`, `9:16`, `9:19.5`, `9:20`, `16:9`, `21:9`, `1:2`, `4:1`,
  `1:4`, `8:1`, `1:8`. Provider validieren ihre modellspezifische Teilmenge.
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>Auflösungshinweis.</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  Qualitätshinweis, wenn der Provider ihn unterstützt.
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  Ausgabeformathinweis, wenn der Provider ihn unterstützt.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Hintergrundhinweis, wenn der Provider ihn unterstützt. Verwenden Sie
  `transparent` mit `outputFormat: "png"` oder `"webp"` für
  transparenzfähige Provider.
</ParamField>
<ParamField path="count" type="number">Anzahl der zu erzeugenden Bilder (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Optionales Zeitlimit für Provider-Anfragen in Millisekunden. Wenn Codex
  `image_generate` über dynamische Tools aufruft, überschreibt dieser Wert pro
  Aufruf weiterhin den konfigurierten Standardwert und ist auf 600000 ms begrenzt.
</ParamField>
<ParamField path="filename" type="string">Hinweis für den Ausgabedateinamen.</ParamField>
<ParamField path="openai" type="object">
  Nur für OpenAI geltende Hinweise: `background`, `moderation`,
  `outputCompression` und `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Kreativitätssteuerung für fal Krea 2. Der Standardwert ist `medium`.
</ParamField>

<Note>
Nicht alle Provider unterstützen alle Parameter. Wenn ein Fallback-Provider eine
ähnliche Geometrieoption statt der exakt angeforderten unterstützt, ordnet OpenClaw
die Anfrage vor dem Absenden der nächstgelegenen unterstützten Größe, dem
nächstgelegenen Seitenverhältnis oder der nächstgelegenen Auflösung zu.
Nicht unterstützte Ausgabehinweise werden bei Providern verworfen, die keine
Unterstützung deklarieren, und im Tool-Ergebnis gemeldet. Tool-Ergebnisse melden
die angewendeten Einstellungen; `details.normalization` erfasst jede Übersetzung von
angeforderten in angewendete Werte.
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
          "google/gemini-3.1-flash-image",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### Reihenfolge der Provider-Auswahl

OpenClaw versucht Provider in dieser Reihenfolge:

1. **`model`-Parameter** aus dem Tool-Aufruf (falls der Agent einen angibt).
2. **`imageGenerationModel.primary`** aus der Konfiguration.
3. **`imageGenerationModel.fallbacks`** der Reihe nach.
4. **Automatische Erkennung** – nur authentifizierungsgestützte Provider-Standardwerte:
   - zuerst der aktuelle Standard-Provider;
   - anschließend die übrigen registrierten Provider für die Bilderzeugung, sortiert nach Provider-ID.

Wenn ein Provider fehlschlägt (Authentifizierungsfehler, Ratenbegrenzung usw.), wird automatisch
der nächste konfigurierte Kandidat versucht. Wenn alle fehlschlagen, enthält der Fehler Details
zu jedem Versuch.

<AccordionGroup>
  <Accordion title="Modellüberschreibungen pro Aufruf gelten exakt">
    Eine `model`-Überschreibung pro Aufruf versucht nur diesen Provider/dieses Modell und fährt
    nicht mit konfigurierten primären/Fallback- oder automatisch erkannten Providern fort.
  </Accordion>
  <Accordion title="Die automatische Erkennung berücksichtigt die Authentifizierung">
    Ein Provider-Standardwert wird nur dann in die Kandidatenliste aufgenommen, wenn OpenClaw
    diesen Provider tatsächlich authentifizieren kann. Der automatische Fallback zwischen authentifizierten
    Providern ist immer aktiviert; eine `model`-Angabe pro Aufruf bleibt maßgeblich.
  </Accordion>
  <Accordion title="Zeitüberschreitungen">
    Legen Sie `agents.defaults.mediaModels.image.timeoutMs` für langsame Bild-
    Backends fest. Ein `timeoutMs`-Tool-Parameter pro Aufruf überschreibt den konfigurierten
    Standardwert, und konfigurierte Standardwerte überschreiben die vom Plugin definierten
    Provider-Standardwerte. Von Google und OpenRouter gehostete Bild-Provider verwenden Standardwerte von
    180 Sekunden; die Bilderzeugung mit Microsoft Foundry MAI, xAI und Azure OpenAI verwendet
    600 Sekunden. Dynamische Tool-Aufrufe von Codex verwenden für die `image_generate`-Bridge einen Standardwert von
    120 Sekunden und berücksichtigen bei entsprechender Konfiguration dasselbe Zeitlimit, begrenzt
    durch das Maximum von 600000 ms für die dynamische Tool-Bridge von OpenClaw.
  </Accordion>
  <Accordion title="Zur Laufzeit prüfen">
    Verwenden Sie `action: "list"`, um die aktuell registrierten Provider,
    ihre Standardmodelle und Hinweise zu Umgebungsvariablen für die Authentifizierung zu prüfen.
  </Accordion>
</AccordionGroup>

### Bildbearbeitung

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI und xAI unterstützen die Bearbeitung von Referenzbildern. Krea-2-Modelle auf fal verwenden
dieselben Felder `image` / `images` als Stilreferenzen statt als Bearbeitungs-
eingaben. Übergeben Sie einen Referenzbildpfad oder eine URL:

```text
„Erzeuge eine Aquarellversion dieses Fotos“ + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter und Google unterstützen über den Parameter
`images` bis zu 5 Referenzbilder; xAI unterstützt bis zu 3. fal unterstützt 1 Referenzbild für
Flux-Bild-zu-Bild, bis zu 10 für GPT-Image-2-Bearbeitungen, bis zu 10 Stilreferenzen
für Krea 2 und bis zu 14 für Nano-Banana-2-Bearbeitungen. Microsoft Foundry, MiniMax
und ComfyUI unterstützen 1.

## Provider im Detail

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (und gpt-image-1.5)">
    Die OpenAI-Bilderzeugung verwendet standardmäßig `openai/gpt-image-2`. Wenn ein
    `openai`-OAuth-Profil konfiguriert ist, verwendet OpenClaw dasselbe
    OAuth-Profil wie die Chatmodelle des Codex-Abonnements und sendet die
    Bildanfrage über das Codex-Responses-Backend. Veraltete Codex-Basis-
    URLs wie `https://chatgpt.com/backend-api` werden für
    Bildanfragen zu `https://chatgpt.com/backend-api/codex` kanonisiert. OpenClaw
    weicht für diese Anfrage **nicht** stillschweigend auf `OPENAI_API_KEY` aus –
    um das direkte Routing über die OpenAI Images API zu erzwingen, konfigurieren Sie
    `models.providers.openai` explizit mit einem API-Schlüssel, einer benutzerdefinierten Basis-URL
    oder einem Azure-Endpunkt.

    Die Modelle `openai/gpt-image-1.5`, `openai/gpt-image-1` und
    `openai/gpt-image-1-mini` können weiterhin explizit ausgewählt werden. Verwenden Sie
    `gpt-image-1.5` für PNG-/WebP-Ausgaben mit transparentem Hintergrund; die aktuelle
    `gpt-image-2`-API lehnt `background: "transparent"` ab.

    `gpt-image-2` unterstützt sowohl die Text-zu-Bild-Erzeugung als auch
    die Bearbeitung von Referenzbildern über dasselbe `image_generate`-Tool.
    OpenClaw leitet `prompt`, `count`, `size`, `quality`, `outputFormat`
    und Referenzbilder an OpenAI weiter. OpenAI erhält
    `aspectRatio` oder `resolution` **nicht** direkt; wenn möglich, ordnet OpenClaw
    diese einem unterstützten `size` zu, andernfalls meldet das Tool sie als
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
    transparente Ausgaben erfordern `outputFormat` `png` oder `webp` sowie ein
    transparenzfähiges OpenAI-Bildmodell. OpenClaw leitet standardmäßige
    `gpt-image-2`-Anfragen mit transparentem Hintergrund an `gpt-image-1.5` weiter.
    `openai.outputCompression` gilt für JPEG-/WebP-Ausgaben und wird
    bei PNG-Ausgaben ignoriert.

    Der `background`-Hinweis auf oberster Ebene ist Provider-neutral und wird derzeit
    demselben OpenAI-Anfragefeld `background` zugeordnet, wenn der OpenAI-Provider
    ausgewählt ist. Provider, die keine Unterstützung für Hintergründe deklarieren, geben
    ihn in `ignoredOverrides` zurück, statt den nicht unterstützten Parameter zu erhalten.

    Informationen zum Routing der OpenAI-Bilderzeugung über eine Azure-OpenAI-Bereitstellung
    anstelle von `api.openai.com` finden Sie unter
    [Azure-OpenAI-Endpunkte](/de/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Microsoft-Foundry-MAI-Bildmodelle">
    Die Microsoft-Foundry-Bilderzeugung verwendet die Namen bereitgestellter MAI-Bildbereitstellungen
    unter dem Provider-Präfix `microsoft-foundry/`. Es gibt kein Standardmodell auf Provider-Ebene,
    da die MAI-API den Namen Ihrer Bereitstellung im Feld
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

    Der Provider verwendet die MAI-API von Microsoft Foundry, nicht die OpenAI Images API:

    - Erzeugungsendpunkt: `/mai/v1/images/generations`
    - Bearbeitungsendpunkt: `/mai/v1/images/edits`
    - Authentifizierung: `AZURE_OPENAI_API_KEY` / Provider-API-Schlüssel oder Entra ID über `az login`
    - Ausgabe: ein PNG-Bild
    - Größe: standardmäßig `1024x1024`; Breite und Höhe müssen jeweils mindestens 768 px betragen,
      und die Gesamtzahl der Pixel darf höchstens 1,048,576 betragen
    - Bearbeitungen: ein PNG- oder JPEG-Referenzbild, nur unterstützt von
      `MAI-Image-2.5-Flash`- und `MAI-Image-2.5`-Bereitstellungen

    Für die reine Prompt-Erzeugung kann ein benutzerdefinierter Bereitstellungsname verwendet werden, wenn nur der
    Foundry-Endpunkt konfiguriert ist. Bearbeitungen mit benutzerdefinierten Bereitstellungsnamen benötigen
    Onboarding-/Modellmetadaten, damit OpenClaw überprüfen kann, ob die Bereitstellung auf
    `MAI-Image-2.5-Flash` oder `MAI-Image-2.5` basiert.

    Aktuelle MAI-Bildmodelle sind `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` und `MAI-Image-2`. Informationen zur Einrichtung
    und zum Verhalten von Chatmodellen finden Sie unter
    [Microsoft-Foundry-Plugin](/de/plugins/reference/microsoft-foundry).

  </Accordion>
  <Accordion title="OpenRouter-Bildmodelle">
    Die OpenRouter-Bilderzeugung verwendet dasselbe `OPENROUTER_API_KEY` und
    wird über die Bild-API für Chat Completions von OpenRouter geleitet. Wählen Sie
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
    Zu den aktuellen integrierten Kurzformen für OpenRouter-Bildmodelle gehören
    `google/gemini-3.1-flash-image`,
    `google/gemini-3-pro-image` und `openai/gpt-5.4-image-2`. Verwenden Sie
    `action: "list"`, um zu sehen, was Ihr konfiguriertes Plugin bereitstellt.

  </Accordion>
  <Accordion title="fal Krea 2">
    Krea-2-Modelle auf fal verwenden das native Krea-Schema von fal anstelle des generischen
    `image_size`-Schemas, das von Flux verwendet wird. OpenClaw sendet:

    - `aspect_ratio` für Hinweise zum Seitenverhältnis
    - `creativity`, standardmäßig `medium`
    - `image_style_references`, wenn `image` oder `images` angegeben werden

    Wählen Sie Krea 2 Medium für schnellere, ausdrucksstarke Illustrationen und Krea 2 Large
    für langsamere, detailliertere fotorealistische und texturierte Darstellungen:

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
      "prompt": "Ein Cyber-Zine-Porträt mit Risografie-Textur",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="Doppelte MiniMax-Authentifizierung">
    Die MiniMax-Bilderzeugung ist über beide gebündelten MiniMax-
    Authentifizierungspfade verfügbar:

    - `minimax/image-01` für Einrichtungen mit API-Schlüssel
    - `minimax-portal/image-01` für Einrichtungen mit OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Der gebündelte xAI-Provider verwendet `/v1/images/generations` für reine Prompt-
    Anfragen und `/v1/images/edits`, wenn `image` oder `images` vorhanden ist.

    - Modelle: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Anzahl: bis zu 4
    - Referenzen: ein `image` oder bis zu drei `images`
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Auflösungen: `1K`, `2K`
    - Ausgaben: werden als von OpenClaw verwaltete Bildanhänge zurückgegeben

    OpenClaw stellt die xAI-nativen Optionen `quality`, `mask`,
    `user` oder das Seitenverhältnis `auto` bewusst nicht bereit, bis diese Steuerelemente im gemeinsamen
    Provider-übergreifenden `image_generate`-Vertrag vorhanden sind.

  </Accordion>
</AccordionGroup>

## Beispiele

<Tabs>
  <Tab title="Erzeugen (4K-Querformat)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Ein klares redaktionelles Poster für die OpenClaw-Bilderzeugung" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Erzeugen (transparentes PNG)">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="Ein einfacher roter Kreisaufkleber auf transparentem Hintergrund" outputFormat=png background=transparent
```

Entsprechender CLI-Befehl:

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Ein einfacher roter Kreisaufkleber auf transparentem Hintergrund" \
  --json
```

  </Tab>
  <Tab title="Erzeugen (niedrige OpenAI-Qualität)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Kostengünstiger Posterentwurf für eine zurückhaltende Produktivitäts-App" quality=low openai='{"moderation":"low"}'
```

Entsprechender CLI-Befehl:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Kostengünstiger Posterentwurf für eine ruhige Produktivitäts-App" \
  --json
```

  </Tab>
  <Tab title="Generieren (zwei quadratische)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Zwei visuelle Richtungen für das Symbol einer ruhigen Produktivitäts-App" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Bearbeiten (eine Referenz)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Das Motiv beibehalten und den Hintergrund durch eine helle Studioumgebung ersetzen" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="Bearbeiten (mehrere Referenzen)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Die Identität der Figur aus dem ersten Bild mit der Farbpalette aus dem zweiten kombinieren" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
  <Tab title="Krea-Stilreferenzen">
```text
/tool image_generate action=generate model=fal/krea/v2/medium/text-to-image prompt="Ein ausdrucksstarkes redaktionelles Porträt mit dieser Farbpalette und Drucktextur" images='["/path/to/palette.png","/path/to/texture.jpg"]' aspectRatio=9:16 fal='{"creativity":"high"}'
```
  </Tab>
</Tabs>

Dieselben Flags `--output-format`, `--background`, `--quality` und
`--openai-moderation` sind für `openclaw infer image edit` verfügbar;
`--openai-background` bleibt ein OpenAI-spezifischer Alias. Andere gebündelte Provider
als OpenAI deklarieren derzeit keine explizite Hintergrundsteuerung, daher wird
`background: "transparent"` bei ihnen als ignoriert gemeldet.

## Verwandte Themen

- [Werkzeugübersicht](/de/tools) - alle verfügbaren Agentenwerkzeuge
- [ComfyUI](/de/providers/comfy) - Einrichtung von Workflows für lokales ComfyUI und Comfy Cloud
- [fal](/de/providers/fal) - Einrichtung des fal-Providers für Bilder und Videos
- [Google (Gemini)](/de/providers/google) - Einrichtung des Gemini-Bild-Providers
- [Microsoft-Foundry-Plugin](/de/plugins/reference/microsoft-foundry) - Einrichtung von Microsoft-Foundry-Chat und MAI-Bildern
- [MiniMax](/de/providers/minimax) - Einrichtung des MiniMax-Bild-Providers
- [OpenAI](/de/providers/openai) - Einrichtung des OpenAI-Images-Providers
- [Vydra](/de/providers/vydra) - Einrichtung von Vydra für Bilder, Videos und Sprache
- [xAI](/de/providers/xai) - Einrichtung von Grok für Bilder, Videos, Suche, Codeausführung und TTS
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) - `imageGenerationModel`-Konfiguration
- [Modelle](/de/concepts/models) - Modellkonfiguration und Failover
