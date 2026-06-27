---
read_when:
    - Sie möchten die fal-Bildgenerierung in OpenClaw verwenden
    - Sie benötigen den `FAL_KEY`-Auth-Flow
    - Sie möchten fal-Standardwerte für image_generate, video_generate oder music_generate
summary: fal-Einrichtung für Bild-, Video- und Musikgenerierung in OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-27T18:03:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw enthält einen gebündelten `fal`-Provider für gehostete Bild-, Video- und Musikgenerierung.

| Eigenschaft | Wert                                                          |
| -------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| Auth     | `FAL_KEY` (kanonisch; `FAL_API_KEY` funktioniert auch als Fallback) |
| API      | fal-Modellendpunkte                                           |

## Erste Schritte

<Steps>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Set a default image model">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## Bildgenerierung

Der gebündelte `fal`-Provider für die Bildgenerierung verwendet standardmäßig
`fal/fal-ai/flux/dev`.

| Fähigkeit      | Wert                                                               |
| -------------- | ------------------------------------------------------------------ |
| Max. Bilder    | 4 pro Anfrage; Krea 2: 1 pro Anfrage                               |
| Bearbeitungsmodus | Flux: 1 Referenzbild; GPT Image 2: 10; Nano Banana 2: 14        |
| Stilreferenzen | Krea 2: bis zu 10 Stilreferenzen über `image` / `images`           |
| Größen-Overrides | Unterstützt                                                       |
| Seitenverhältnis | Unterstützt für Generieren, Krea 2 und Bearbeitung mit GPT Image 2/Nano Banana 2 |
| Auflösung      | Unterstützt                                                        |
| Ausgabeformat  | `png` oder `jpeg`                                                  |

<Warning>
Flux-Anfragen für Bild-zu-Bild unterstützen **keine** `aspectRatio`-Overrides. Bearbeitungsanfragen für GPT
Image 2 und Nano Banana 2 verwenden fals `/edit`-Endpunkt und akzeptieren
Hinweise zum Seitenverhältnis. Nano Banana 2 akzeptiert außerdem zusätzliche native breite/hohe Verhältnisse
wie `4:1`, `1:4`, `8:1` und `1:8`; Krea 2 validiert seine eigene kleinere
Teilmenge von Seitenverhältnissen.
</Warning>

Krea-2-Modelle verwenden fals natives Krea-Payload-Schema. OpenClaw sendet
`aspect_ratio`, `creativity` und `image_style_references` statt des
generischen `image_size`- / Bearbeitungsendpunkt-Payloads, der von Flux verwendet wird. Die Modellreferenzen sind:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Verwenden Sie Medium für schnellere ausdrucksstarke Illustrationen, Anime, Malerei und künstlerische
Stile. Verwenden Sie Large für langsamere fotorealistische Ergebnisse, rohe Texturen, Filmkorn und detaillierte
Looks. Krea verwendet standardmäßig `fal.creativity: "medium"`; unterstützte Werte sind
`raw`, `low`, `medium` und `high`.

Krea 2 stellt in fals Anfrageschema das Seitenverhältnis bereit, nicht `image_size`. Bevorzugen Sie
`aspectRatio`; OpenClaw ordnet `size` dem nächstgelegenen unterstützten Krea-Seitenverhältnis zu
und lehnt `resolution` für Krea ab, statt es zu verwerfen.

Verwenden Sie `outputFormat: "png"`, wenn Sie PNG-Ausgabe von fal-Modellen wünschen, die
`output_format` bereitstellen. fal deklariert in OpenClaw keine explizite Steuerung
für transparenten Hintergrund, daher wird `background: "transparent"` als ignorierter
Override für fal-Modelle gemeldet.
Krea-2-Endpunkte stellen über fal kein `output_format`-Anfragefeld bereit, daher
lehnt OpenClaw `outputFormat`-Overrides für Krea-Anfragen ab.

So verwenden Sie fal als Standard-Provider für Bilder:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

So verwenden Sie Krea 2 Medium:

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

## Videogenerierung

Der gebündelte `fal`-Provider für die Videogenerierung verwendet standardmäßig
`fal/fal-ai/minimax/video-01-live`.

| Fähigkeit | Wert                                                               |
| ---------- | ------------------------------------------------------------------ |
| Modi       | Text-zu-Video, Einzelbildreferenz, Seedance-Referenz-zu-Video |
| Laufzeit   | Queue-gestützter Einreichungs-/Status-/Ergebnisablauf für lang laufende Jobs |

<AccordionGroup>
  <Accordion title="Available video models">
    **HeyGen-Video-Agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 config example">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Seedance 2.0 reference-to-video config example">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    Referenz-zu-Video akzeptiert bis zu 9 Bilder, 3 Videos und 3 Audioreferenzen
    über die gemeinsamen `video_generate`-Parameter `images`, `videos` und `audioRefs`,
    mit insgesamt höchstens 12 Referenzdateien.

  </Accordion>

  <Accordion title="HeyGen video-agent config example">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Musikgenerierung

Das gebündelte `fal`-Plugin registriert außerdem einen Provider für die Musikgenerierung für das
gemeinsame Tool `music_generate`.

| Fähigkeit     | Wert                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| Standardmodell | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| Modelle       | `fal-ai/minimax-music/v2.6`, `fal-ai/ace-step/prompt-to-audio`, `fal-ai/stable-audio-25/text-to-audio` |
| Laufzeit      | Synchrone Anfrage plus Download des generierten Audios                                                 |

Verwenden Sie fal als Standard-Provider für Musik:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` unterstützt explizite Liedtexte und Instrumentalmodus.
ACE-Step und Stable Audio sind Prompt-zu-Audio-Endpunkte; wählen Sie sie mit dem
`model`-Override, wenn Sie diese Modellfamilien verwenden möchten.

<Tip>
Verwenden Sie `openclaw models list --provider fal`, um die vollständige Liste der verfügbaren fal-
Modelle zu sehen, einschließlich kürzlich hinzugefügter Einträge.
</Tip>

## Verwandt

<CardGroup cols={2}>
  <Card title="Image generation" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter für Bildtools und Provider-Auswahl.
  </Card>
  <Card title="Video generation" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter für Videotools und Provider-Auswahl.
  </Card>
  <Card title="Music generation" href="/de/tools/music-generation" icon="music">
    Gemeinsame Parameter für Musiktools und Provider-Auswahl.
  </Card>
  <Card title="Configuration reference" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standardeinstellungen einschließlich Auswahl von Bild-, Video- und Musikmodell.
  </Card>
</CardGroup>
