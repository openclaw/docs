---
read_when:
    - Bilder über den Agenten generieren oder bearbeiten
    - Konfigurieren von Providern und Modellen für die Bildgenerierung
    - Die Parameter des Tools image_generate verstehen
sidebarTitle: Image generation
summary: Bilder über image_generate mit OpenAI, Google, fal, Microsoft Foundry, MiniMax, ComfyUI, DeepInfra, OpenRouter, LiteLLM, xAI und Vydra generieren und bearbeiten
title: Bilderzeugung
x-i18n:
    generated_at: "2026-07-12T15:57:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 56d4c9efada07c64fc6aaa92510bf8cad982c098f62d7a71bfdf093cf434c4bc
    source_path: tools/image-generation.md
    workflow: 16
---

Das Tool `image_generate` erstellt und bearbeitet Bilder über Ihre konfigurierten
Provider. In Chatsitzungen wird es asynchron ausgeführt: OpenClaw erfasst eine
Hintergrundaufgabe, gibt sofort die Aufgaben-ID zurück und weckt den Agenten, sobald
der Provider fertig ist. Der Abschluss-Agent folgt dem normalen Modus der Sitzung
für sichtbare Antworten: automatische Zustellung der abschließenden Antwort, wenn
dies konfiguriert ist, oder `message(action="send")`, wenn die Sitzung das
Nachrichten-Tool erfordert. Wenn die anfordernde Sitzung inaktiv ist oder ihr aktives
Wecken fehlschlägt, sendet OpenClaw einen idempotenten direkten Fallback mit den
generierten Bildern, damit das Ergebnis nicht verloren geht.

<Note>
Das Tool wird nur angezeigt, wenn mindestens ein Provider für die Bilderzeugung
verfügbar ist. Wenn `image_generate` nicht unter den Tools Ihres Agenten erscheint,
konfigurieren Sie `agents.defaults.imageGenerationModel`, richten Sie einen
Provider-API-Schlüssel ein oder melden Sie sich über OpenAI ChatGPT/Codex OAuth an.
</Note>

## Schnellstart

<Steps>
  <Step title="Authentifizierung konfigurieren">
    Legen Sie einen API-Schlüssel für mindestens einen Provider fest (zum Beispiel
    `OPENAI_API_KEY`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`) oder melden Sie sich
    über OpenAI Codex OAuth an.
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

    ChatGPT/Codex OAuth verwendet dieselbe Modellreferenz `openai/gpt-image-2`. Wenn
    ein `openai`-OAuth-Profil konfiguriert ist, leitet OpenClaw Bildanfragen über
    dieses OAuth-Profil weiter, anstatt zuerst `OPENAI_API_KEY` zu verwenden.
    Eine explizite `models.providers.openai`-Konfiguration (API-Schlüssel,
    benutzerdefinierte/Azure-Basis-URL) aktiviert wieder den direkten Weg über die
    OpenAI Images API.

  </Step>
  <Step title="Den Agenten auffordern">
    _„Erzeuge ein Bild eines freundlichen Roboter-Maskottchens.“_

    Der Agent ruft `image_generate` automatisch auf. Eine Aufnahme in die Tool-
    Zulassungsliste ist nicht erforderlich – das Tool ist standardmäßig aktiviert,
    wenn ein Provider verfügbar ist. Das Tool gibt eine ID für die Hintergrundaufgabe
    zurück; anschließend sendet der Abschluss-Agent den generierten Anhang über das
    Tool `message`, sobald er bereit ist.

  </Step>
</Steps>

<Warning>
Behalten Sie für OpenAI-kompatible LAN-Endpunkte wie LocalAI die benutzerdefinierte
Einstellung `models.providers.openai.baseUrl` bei und aktivieren Sie sie ausdrücklich
mit `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`. Private und interne
Bildendpunkte bleiben standardmäßig blockiert.
</Warning>

## Häufig verwendete Wege

| Ziel                                                     | Modellreferenz                                      | Authentifizierung                      |
| -------------------------------------------------------- | --------------------------------------------------- | -------------------------------------- |
| OpenAI-Bilderzeugung mit API-Abrechnung                  | `openai/gpt-image-2`                                | `OPENAI_API_KEY`                       |
| OpenAI-Bilderzeugung mit Codex-Abonnementauthentifizierung | `openai/gpt-image-2`                              | OpenAI ChatGPT/Codex OAuth             |
| OpenAI-PNG/WebP mit transparentem Hintergrund            | `openai/gpt-image-1.5`                              | `OPENAI_API_KEY` oder OpenAI Codex OAuth |
| DeepInfra-Bilderzeugung                                  | `deepinfra/black-forest-labs/FLUX-1-schnell`        | `DEEPINFRA_API_KEY`                    |
| Ausdrucksstarke/stilgesteuerte Erzeugung mit fal Krea 2  | `fal/krea/v2/medium/text-to-image`                  | `FAL_KEY`                              |
| OpenRouter-Bilderzeugung                                 | `openrouter/google/gemini-3.1-flash-image-preview`  | `OPENROUTER_API_KEY`                   |
| LiteLLM-Bilderzeugung                                    | `litellm/gpt-image-2`                               | `LITELLM_API_KEY`                      |
| Microsoft-Foundry-MAI-Bilderzeugung                      | `microsoft-foundry/<deployment-name>`               | `AZURE_OPENAI_API_KEY` oder Entra ID   |
| Google-Gemini-Bilderzeugung                              | `google/gemini-3.1-flash-image-preview`             | `GEMINI_API_KEY` oder `GOOGLE_API_KEY` |

Dasselbe Tool übernimmt sowohl Text-zu-Bild als auch die Bearbeitung mit
Referenzbildern. Verwenden Sie `image` für eine Referenz oder `images` für mehrere.
Bei Krea-2-Modellen auf fal werden diese Referenzen als Stilreferenzen statt als
Bearbeitungseingaben gesendet. Vom Provider unterstützte Ausgabehinweise wie
`quality`, `outputFormat` und `background` werden weitergeleitet, sofern verfügbar,
und als ignoriert gemeldet, wenn ein Provider keine Unterstützung dafür deklariert.
Die gebündelte Unterstützung für transparente Hintergründe ist OpenAI-spezifisch;
andere Provider können den PNG-Alphakanal dennoch beibehalten, wenn ihr Backend ihn
ausgibt.

## Unterstützte Provider

| Provider          | Standardmodell                          | Bearbeitungsunterstützung                 | Authentifizierung                                      |
| ----------------- | --------------------------------------- | ----------------------------------------- | ------------------------------------------------------ |
| ComfyUI           | `workflow`                              | Ja (1 Bild, im Workflow konfiguriert)     | `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für die Cloud |
| DeepInfra         | `black-forest-labs/FLUX-1-schnell`      | Ja (1 Bild)                               | `DEEPINFRA_API_KEY`                                    |
| fal               | `fal-ai/flux/dev`                       | Ja (modellspezifische Beschränkungen)     | `FAL_KEY`                                              |
| Google            | `gemini-3.1-flash-image-preview`        | Ja (bis zu 5 Bilder)                      | `GEMINI_API_KEY` oder `GOOGLE_API_KEY`                 |
| LiteLLM           | `gpt-image-2`                           | Ja (bis zu 5 Eingabebilder)               | `LITELLM_API_KEY`                                      |
| Microsoft Foundry | `<deployment-name>`                     | Ja (nur MAI-Image-2.5-Modelle)            | `AZURE_OPENAI_API_KEY` oder Entra ID (`az login`)      |
| MiniMax           | `image-01`                              | Ja (Motivreferenz)                        | `MINIMAX_API_KEY` oder MiniMax OAuth (`minimax-portal`) |
| OpenAI            | `gpt-image-2`                           | Ja (bis zu 5 Bilder)                      | `OPENAI_API_KEY` oder OpenAI ChatGPT/Codex OAuth       |
| OpenRouter        | `google/gemini-3.1-flash-image-preview` | Ja (bis zu 5 Eingabebilder)               | `OPENROUTER_API_KEY`                                   |
| Vydra             | `grok-imagine`                          | Nein                                      | `VYDRA_API_KEY`                                        |
| xAI               | `grok-imagine-image`                    | Ja (bis zu 3 Bilder)                      | `XAI_API_KEY`                                          |

Verwenden Sie `action: "list"`, um die zur Laufzeit verfügbaren Provider und Modelle
zu prüfen:

```text
/tool image_generate action=list
```

Verwenden Sie `action: "status"`, um die aktive Bilderzeugungsaufgabe der aktuellen
Sitzung zu prüfen:

```text
/tool image_generate action=status
```

## Provider-Funktionen

| Funktion                  | ComfyUI             | DeepInfra | fal                                            | Google          | Microsoft Foundry | MiniMax                 | OpenAI          | Vydra | xAI             |
| ------------------------- | ------------------- | --------- | ---------------------------------------------- | --------------- | ----------------- | ----------------------- | --------------- | ----- | --------------- |
| Erzeugen (max. Anzahl)    | 1                   | 4         | 4                                              | 4               | 1                 | 9                       | 4               | 1     | 4               |
| Bearbeitung/Referenz      | 1 Bild (Workflow)   | 1 Bild    | Flux: 1; GPT: 10; Krea-Stilreferenzen: 10; NB2: 14 | Bis zu 5 Bilder | 1 Bild            | 1 Bild (Motivreferenz) | Bis zu 5 Bilder | -     | Bis zu 3 Bilder |
| Größensteuerung           | -                   | ✓         | ✓                                              | ✓               | ✓                 | -                       | Bis zu 4K       | -     | -               |
| Seitenverhältnis          | -                   | -         | ✓                                              | ✓               | -                 | ✓                       | -               | -     | ✓               |
| Auflösung (1K/2K/4K)      | -                   | -         | ✓                                              | ✓               | -                 | -                       | -               | -     | 1K, 2K          |

## Tool-Parameter

<ParamField path="prompt" type="string" required>
  Eingabeaufforderung für die Bilderzeugung. Für `action: "generate"` erforderlich.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  Verwenden Sie `"status"`, um die aktive Sitzungsaufgabe zu prüfen, oder `"list"`,
  um die zur Laufzeit verfügbaren Provider und Modelle zu prüfen.
</ParamField>
<ParamField path="model" type="string">
  Überschreibung von Provider/Modell (z. B. `openai/gpt-image-2`). Verwenden Sie
  `openai/gpt-image-1.5` für transparente OpenAI-Hintergründe.
</ParamField>
<ParamField path="image" type="string">
  Pfad oder URL eines einzelnen Referenzbilds für den Bearbeitungsmodus.
</ParamField>
<ParamField path="images" type="string[]">
  Mehrere Referenzbilder für den Bearbeitungsmodus oder Modelle mit Stilreferenzen
  (bis zu 14 über das gemeinsame Tool; providerspezifische Beschränkungen gelten
  weiterhin).
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
  Hinweis zum Ausgabeformat, wenn der Provider ihn unterstützt.
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  Hintergrundhinweis, wenn der Provider ihn unterstützt. Verwenden Sie `transparent`
  mit `outputFormat: "png"` oder `"webp"` für Provider, die Transparenz unterstützen.
</ParamField>
<ParamField path="count" type="number">Anzahl der zu erzeugenden Bilder (1-4).</ParamField>
<ParamField path="timeoutMs" type="number">
  Optionale Zeitüberschreitung für die Provider-Anfrage in Millisekunden. Wenn Codex
  `image_generate` über dynamische Tools aufruft, überschreibt dieser Wert pro Aufruf
  weiterhin den konfigurierten Standardwert und ist auf 600000 ms begrenzt.
</ParamField>
<ParamField path="filename" type="string">Hinweis zum Ausgabedateinamen.</ParamField>
<ParamField path="openai" type="object">
  Nur für OpenAI geltende Hinweise: `background`, `moderation`, `outputCompression`
  und `user`.
</ParamField>
<ParamField path="fal.creativity" type='"raw" | "low" | "medium" | "high"'>
  Kreativitätssteuerung für fal Krea 2. Der Standardwert ist `medium`.
</ParamField>

<Note>
Nicht alle Provider unterstützen alle Parameter. Wenn ein Fallback-Provider statt
der exakt angeforderten Geometrieoption eine ähnliche unterstützt, ordnet OpenClaw
die Anfrage vor dem Absenden der nächstgelegenen unterstützten Größe, dem
nächstgelegenen Seitenverhältnis oder der nächstgelegenen Auflösung zu. Nicht
unterstützte Ausgabehinweise werden bei Providern verworfen, die keine Unterstützung
dafür deklarieren, und im Tool-Ergebnis gemeldet. Tool-Ergebnisse melden die
angewendeten Einstellungen; `details.normalization` erfasst jede Übertragung von
angeforderten auf angewendete Werte.
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

### Reihenfolge der Provider-Auswahl

OpenClaw versucht die Provider in dieser Reihenfolge:

1. **Parameter `model`** aus dem Tool-Aufruf (falls der Agent einen angibt).
2. **`imageGenerationModel.primary`** aus der Konfiguration.
3. **`imageGenerationModel.fallbacks`** in der angegebenen Reihenfolge.
4. **Automatische Erkennung** – nur durch Authentifizierung gestützte Provider-Standardwerte:
   - zuerst der aktuelle Standard-Provider;
   - danach die übrigen registrierten Provider für die Bildgenerierung in der Reihenfolge ihrer Provider-IDs.

Wenn ein Provider fehlschlägt (Authentifizierungsfehler, Ratenbegrenzung usw.), wird
automatisch der nächste konfigurierte Kandidat ausprobiert. Wenn alle fehlschlagen,
enthält der Fehler Details zu jedem Versuch.

<AccordionGroup>
  <Accordion title="Modellüberschreibungen pro Aufruf sind exakt">
    Eine `model`-Überschreibung pro Aufruf versucht nur diesen Provider bzw. dieses
    Modell und fährt nicht mit dem konfigurierten primären Modell, Fallback-Modellen
    oder automatisch erkannten Providern fort.
  </Accordion>
  <Accordion title="Die automatische Erkennung berücksichtigt die Authentifizierung">
    Der Standardwert eines Providers wird nur dann in die Kandidatenliste aufgenommen,
    wenn OpenClaw diesen Provider tatsächlich authentifizieren kann. Setzen Sie
    `agents.defaults.mediaGenerationAutoProviderFallback: false`, um ausschließlich
    explizite Einträge für `model`, `primary` und `fallbacks` zu verwenden.
  </Accordion>
  <Accordion title="Zeitüberschreitungen">
    Legen Sie für langsame Bild-Backends
    `agents.defaults.imageGenerationModel.timeoutMs` fest. Ein Tool-Parameter
    `timeoutMs` pro Aufruf überschreibt den konfigurierten Standardwert, und
    konfigurierte Standardwerte überschreiben die vom Plugin definierten
    Provider-Standardwerte. Bei Google und von OpenRouter gehosteten
    Bild-Providern beträgt der Standardwert 180 Sekunden; bei der Bildgenerierung
    mit Microsoft Foundry MAI, xAI und Azure OpenAI sind es 600 Sekunden. Dynamische
    Tool-Aufrufe von Codex verwenden für die `image_generate`-Bridge standardmäßig
    120 Sekunden und berücksichtigen bei entsprechender Konfiguration dasselbe
    Zeitlimit, begrenzt durch das Maximum von 600000 ms für dynamische Tool-Bridges
    in OpenClaw.
  </Accordion>
  <Accordion title="Zur Laufzeit prüfen">
    Verwenden Sie `action: "list"`, um die derzeit registrierten Provider,
    ihre Standardmodelle und Hinweise zu Umgebungsvariablen für die Authentifizierung
    zu prüfen.
  </Accordion>
</AccordionGroup>

### Bildbearbeitung

OpenAI, OpenRouter, Google, DeepInfra, fal, Microsoft Foundry, MiniMax,
ComfyUI und xAI unterstützen die Bearbeitung von Referenzbildern. Krea-2-Modelle
auf fal verwenden dieselben Felder `image` / `images` als Stilreferenzen statt
als Bearbeitungseingaben. Übergeben Sie den Pfad oder die URL eines Referenzbilds:

```text
„Erzeuge eine Aquarellversion dieses Fotos“ + image: "/path/to/photo.jpg"
```

OpenAI, OpenRouter und Google unterstützen über den Parameter `images` bis zu
5 Referenzbilder; xAI unterstützt bis zu 3. fal unterstützt 1 Referenzbild für
Flux-Bild-zu-Bild, bis zu 10 für Bearbeitungen mit GPT Image 2, bis zu
10 Stilreferenzen für Krea 2 und bis zu 14 für Bearbeitungen mit Nano Banana 2.
Microsoft Foundry, MiniMax und ComfyUI unterstützen 1.

## Detaillierte Provider-Betrachtung

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2 (und gpt-image-1.5)">
    Die OpenAI-Bildgenerierung verwendet standardmäßig `openai/gpt-image-2`.
    Wenn ein OAuth-Profil für `openai` konfiguriert ist, verwendet OpenClaw
    dasselbe OAuth-Profil wieder, das von Codex-Abonnement-Chatmodellen verwendet
    wird, und sendet die Bildanfrage über das Codex-Responses-Backend. Veraltete
    Codex-Basis-URLs wie `https://chatgpt.com/backend-api` werden für Bildanfragen
    zu `https://chatgpt.com/backend-api/codex` kanonisiert. OpenClaw greift für
    diese Anfrage **nicht** stillschweigend auf `OPENAI_API_KEY` zurück. Um die
    Anfrage direkt über die OpenAI Images API zu leiten, konfigurieren Sie
    `models.providers.openai` explizit mit einem API-Schlüssel, einer
    benutzerdefinierten Basis-URL oder einem Azure-Endpunkt.

    Die Modelle `openai/gpt-image-1.5`, `openai/gpt-image-1` und
    `openai/gpt-image-1-mini` können weiterhin explizit ausgewählt werden.
    Verwenden Sie `gpt-image-1.5` für PNG-/WebP-Ausgaben mit transparentem
    Hintergrund; die aktuelle API von `gpt-image-2` lehnt
    `background: "transparent"` ab.

    `gpt-image-2` unterstützt sowohl die Text-zu-Bild-Generierung als auch
    die Bearbeitung von Referenzbildern über dasselbe Tool `image_generate`.
    OpenClaw leitet `prompt`, `count`, `size`, `quality`, `outputFormat`
    und Referenzbilder an OpenAI weiter. OpenAI empfängt `aspectRatio` oder
    `resolution` **nicht** direkt; wenn möglich, ordnet OpenClaw diese einem
    unterstützten `size` zu. Andernfalls meldet das Tool sie als ignorierte
    Überschreibungen.

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
    transparente Ausgaben erfordern für `outputFormat` den Wert `png` oder
    `webp` sowie ein OpenAI-Bildmodell, das Transparenz unterstützt. OpenClaw
    leitet Anfragen mit dem Standardmodell `gpt-image-2` und transparentem
    Hintergrund an `gpt-image-1.5` weiter. `openai.outputCompression` gilt
    für JPEG-/WebP-Ausgaben und wird bei PNG-Ausgaben ignoriert.

    Der übergeordnete Hinweis `background` ist Provider-neutral und wird
    derzeit demselben OpenAI-Anfragefeld `background` zugeordnet, wenn der
    OpenAI-Provider ausgewählt ist. Provider, die keine Unterstützung für
    Hintergründe deklarieren, geben ihn in `ignoredOverrides` zurück, statt
    den nicht unterstützten Parameter zu empfangen.

    Informationen dazu, wie Sie die OpenAI-Bildgenerierung statt über
    `api.openai.com` über eine Azure-OpenAI-Bereitstellung leiten, finden Sie
    unter [Azure-OpenAI-Endpunkte](/de/providers/openai#azure-openai-endpoints).

  </Accordion>
  <Accordion title="Microsoft-Foundry-MAI-Bildmodelle">
    Die Microsoft-Foundry-Bildgenerierung verwendet die Namen bereitgestellter
    MAI-Bildbereitstellungen unter dem Provider-Präfix `microsoft-foundry/`.
    Es gibt kein Standardmodell auf Provider-Ebene, da die MAI-API den Namen
    Ihrer Bereitstellung im Feld `model` erwartet:

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

    - Generierungsendpunkt: `/mai/v1/images/generations`
    - Bearbeitungsendpunkt: `/mai/v1/images/edits`
    - Authentifizierung: `AZURE_OPENAI_API_KEY` / Provider-API-Schlüssel oder Entra ID über `az login`
    - Ausgabe: ein PNG-Bild
    - Größe: standardmäßig `1024x1024`; Breite und Höhe müssen jeweils mindestens 768 px betragen,
      und die Gesamtzahl der Pixel darf höchstens 1,048,576 betragen
    - Bearbeitungen: ein PNG- oder JPEG-Referenzbild, nur von Bereitstellungen
      mit `MAI-Image-2.5-Flash` und `MAI-Image-2.5` unterstützt

    Für die reine Prompt-Generierung kann ein benutzerdefinierter Bereitstellungsname
    verwendet werden, wenn lediglich der Foundry-Endpunkt konfiguriert ist.
    Bearbeitungen mit benutzerdefinierten Bereitstellungsnamen benötigen
    Onboarding-/Modellmetadaten, damit OpenClaw überprüfen kann, ob die Bereitstellung
    auf `MAI-Image-2.5-Flash` oder `MAI-Image-2.5` basiert.

    Aktuelle MAI-Bildmodelle sind `MAI-Image-2.5-Flash`, `MAI-Image-2.5`,
    `MAI-Image-2e` und `MAI-Image-2`. Informationen zur Einrichtung und zum
    Verhalten von Chatmodellen finden Sie unter
    [Microsoft-Foundry-Plugin](/de/plugins/reference/microsoft-foundry).

  </Accordion>
  <Accordion title="OpenRouter-Bildmodelle">
    Die OpenRouter-Bildgenerierung verwendet denselben `OPENROUTER_API_KEY`
    und wird über die Bild-API für Chat Completions von OpenRouter geleitet.
    Wählen Sie OpenRouter-Bildmodelle mit dem Präfix `openrouter/` aus:

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

    OpenClaw leitet `prompt`, `count`, Referenzbilder sowie Gemini-kompatible
    Hinweise für `aspectRatio` / `resolution` an OpenRouter weiter.
    Zu den derzeit integrierten Kurzbezeichnungen für OpenRouter-Bildmodelle
    gehören `google/gemini-3.1-flash-image-preview`,
    `google/gemini-3-pro-image-preview` und `openai/gpt-5.4-image-2`.
    Verwenden Sie `action: "list"`, um zu sehen, was Ihr konfiguriertes Plugin
    bereitstellt.

  </Accordion>
  <Accordion title="fal Krea 2">
    Krea-2-Modelle auf fal verwenden das native Krea-Schema von fal statt des
    generischen Schemas `image_size`, das von Flux verwendet wird. OpenClaw sendet:

    - `aspect_ratio` für Hinweise zum Seitenverhältnis
    - `creativity`, standardmäßig `medium`
    - `image_style_references`, wenn `image` oder `images` angegeben werden

    Wählen Sie Krea 2 Medium für schnellere, ausdrucksstarke Illustrationen und
    Krea 2 Large für langsamere, detailliertere fotorealistische und texturierte
    Darstellungen:

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

    Krea 2 gibt derzeit ein Bild pro Anfrage zurück. Bevorzugen Sie für Krea
    `aspectRatio`; OpenClaw ordnet `size` dem nächstgelegenen unterstützten
    Krea-Seitenverhältnis zu und lehnt `resolution` für Krea ab, statt den Wert
    zu verwerfen. Verwenden Sie `fal.creativity`, wenn Sie eine native
    Krea-Kreativitätsstufe festlegen möchten:

    ```json
    {
      "model": "fal/krea/v2/medium/text-to-image",
      "prompt": "Ein Cyber-Zine-Porträt mit Risograph-Textur",
      "aspectRatio": "9:16",
      "fal": {
        "creativity": "high"
      }
    }
    ```

  </Accordion>
  <Accordion title="Doppelte MiniMax-Authentifizierung">
    Die MiniMax-Bildgenerierung ist über beide mitgelieferten
    MiniMax-Authentifizierungswege verfügbar:

    - `minimax/image-01` für Einrichtungen mit API-Schlüssel
    - `minimax-portal/image-01` für Einrichtungen mit OAuth

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    Der mitgelieferte xAI-Provider verwendet `/v1/images/generations` für
    reine Prompt-Anfragen und `/v1/images/edits`, wenn `image` oder `images`
    vorhanden ist.

    - Modelle: `xai/grok-imagine-image`, `xai/grok-imagine-image-quality`
    - Anzahl: bis zu 4
    - Referenzen: ein `image` oder bis zu drei `images`
    - Seitenverhältnisse: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `2:1`,
      `1:2`, `19.5:9`, `9:19.5`, `20:9`, `9:20`
    - Auflösungen: `1K`, `2K`
    - Ausgaben: werden als von OpenClaw verwaltete Bildanhänge zurückgegeben

    OpenClaw stellt die xAI-nativen Optionen `quality`, `mask`, `user` sowie
    das Seitenverhältnis `auto` absichtlich nicht bereit, bis diese
    Steuerelemente im gemeinsamen Provider-übergreifenden Vertrag
    `image_generate` vorhanden sind.

  </Accordion>
</AccordionGroup>

## Beispiele

<Tabs>
  <Tab title="Generieren (4K-Querformat)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Ein klares redaktionelles Poster für die OpenClaw-Bildgenerierung" size=3840x2160 count=1
```
  </Tab>
  <Tab title="Generieren (transparentes PNG)">
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
  <Tab title="Generieren (niedrige OpenAI-Qualität)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Kostengünstiger Posterentwurf für eine unaufdringliche Produktivitäts-App" quality=low openai='{"moderation":"low"}'
```

Entsprechender CLI-Befehl:

```bash
openclaw infer image generate \
  --model openai/gpt-image-2 \
  --quality low \
  --openai-moderation low \
  --prompt "Kostengünstiger Posterentwurf für eine unaufdringliche Produktivitäts-App" \
  --json
```

  </Tab>
  <Tab title="Generieren (zwei quadratische Bilder)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Zwei visuelle Richtungen für das Icon einer ruhigen Produktivitäts-App" size=1024x1024 count=2
```
  </Tab>
  <Tab title="Bearbeiten (eine Referenz)">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Das Motiv beibehalten und den Hintergrund durch eine helle Studiokulisse ersetzen" image=/path/to/reference.png size=1024x1536
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
`--openai-moderation` sind auch für `openclaw infer image edit` verfügbar;
`--openai-background` bleibt als OpenAI-spezifischer Alias erhalten. Andere gebündelte Provider
als OpenAI deklarieren derzeit keine explizite Hintergrundsteuerung, daher wird
`background: "transparent"` bei ihnen als ignoriert gemeldet.

## Verwandte Themen

- [Werkzeugübersicht](/de/tools) - alle verfügbaren Agentenwerkzeuge
- [ComfyUI](/de/providers/comfy) - Einrichtung lokaler ComfyUI- und Comfy-Cloud-Workflows
- [fal](/de/providers/fal) - Einrichtung des fal-Providers für Bilder und Videos
- [Google (Gemini)](/de/providers/google) - Einrichtung des Gemini-Bild-Providers
- [Microsoft Foundry-Plugin](/de/plugins/reference/microsoft-foundry) - Einrichtung von Microsoft-Foundry-Chat und MAI-Bildern
- [MiniMax](/de/providers/minimax) - Einrichtung des MiniMax-Bild-Providers
- [OpenAI](/de/providers/openai) - Einrichtung des OpenAI-Images-Providers
- [Vydra](/de/providers/vydra) - Einrichtung von Vydra für Bilder, Videos und Sprache
- [xAI](/de/providers/xai) - Einrichtung von Grok für Bilder, Videos, Suche, Codeausführung und TTS
- [Konfigurationsreferenz](/de/gateway/config-agents#agent-defaults) - Konfiguration von `imageGenerationModel`
- [Modelle](/de/concepts/models) - Modellkonfiguration und Failover
