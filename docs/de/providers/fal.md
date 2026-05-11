---
read_when:
    - Sie möchten die Bildgenerierung von fal in OpenClaw verwenden
    - Sie benötigen den FAL_KEY-Authentifizierungsablauf
    - Sie möchten fal-Standardwerte für image_generate oder video_generate
summary: Einrichtung der Bild- und Videogenerierung mit fal in OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:35:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw liefert einen gebündelten `fal`-Provider für gehostete Bild- und Videogenerierung aus.

| Eigenschaft | Wert                                                              |
| -------- | ----------------------------------------------------------------- |
| Provider | `fal`                                                             |
| Authentifizierung | `FAL_KEY` (kanonisch; `FAL_API_KEY` funktioniert auch als Fallback) |
| API      | fal-Modellendpunkte                                               |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Standard-Bildmodell festlegen">
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

Der gebündelte `fal`-Provider für Bildgenerierung verwendet standardmäßig
`fal/fal-ai/flux/dev`.

| Fähigkeit      | Wert                                                        |
| -------------- | ----------------------------------------------------------- |
| Maximale Bilder | 4 pro Anfrage                                             |
| Bearbeitungsmodus | Flux: 1 Referenzbild; GPT Image 2: 10; Nano Banana 2: 14 |
| Größenüberschreibungen | Unterstützt                                      |
| Seitenverhältnis | Unterstützt für Generierung und Bearbeitung mit GPT Image 2/Nano Banana 2 |
| Auflösung      | Unterstützt                                                |
| Ausgabeformat  | `png` oder `jpeg`                                           |

<Warning>
Flux-Anfragen für Bild-zu-Bild unterstützen **keine** `aspectRatio`-Überschreibungen. GPT
Image 2- und Nano Banana 2-Bearbeitungsanfragen verwenden den `/edit`-Endpunkt von fal und akzeptieren
Hinweise zum Seitenverhältnis.
</Warning>

Verwenden Sie `outputFormat: "png"`, wenn Sie eine PNG-Ausgabe möchten. fal deklariert in OpenClaw keine
explizite Steuerung für transparente Hintergründe, daher wird `background:
"transparent"` für fal-Modelle als ignorierte Überschreibung gemeldet.

So verwenden Sie fal als Standard-Bild-Provider:

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

## Videogenerierung

Der gebündelte `fal`-Provider für Videogenerierung verwendet standardmäßig
`fal/fal-ai/minimax/video-01-live`.

| Fähigkeit | Wert                                                               |
| ---------- | ------------------------------------------------------------------ |
| Modi       | Text-zu-Video, Einzelbildreferenz, Seedance-Referenz-zu-Video      |
| Laufzeit   | Warteschlangenbasierter Ablauf für Submit/Status/Ergebnis bei lang laufenden Jobs |

<AccordionGroup>
  <Accordion title="Verfügbare Videomodelle">
    **HeyGen video-agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0-Konfigurationsbeispiel">
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

  <Accordion title="Seedance 2.0-Konfigurationsbeispiel für Referenz-zu-Video">
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
    über die gemeinsamen Parameter `images`, `videos` und `audioRefs` von `video_generate`,
    mit maximal 12 Referenzdateien insgesamt.

  </Accordion>

  <Accordion title="HeyGen video-agent-Konfigurationsbeispiel">
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

<Tip>
Verwenden Sie `openclaw models list --provider fal`, um die vollständige Liste der verfügbaren fal-
Modelle einschließlich kürzlich hinzugefügter Einträge anzuzeigen.
</Tip>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Bild-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Video-Tool-Parameter und Provider-Auswahl.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standardwerte einschließlich Auswahl von Bild- und Videomodellen.
  </Card>
</CardGroup>
