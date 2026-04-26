---
read_when:
    - Sie möchten die Bildgenerierung mit fal in OpenClaw verwenden.
    - Sie benötigen den Authentifizierungsablauf mit `FAL_KEY`.
    - Sie möchten fal-Standardeinstellungen für `image_generate` oder `video_generate`.
summary: Einrichtung der Bild- und Videogenerierung mit fal in OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-26T11:37:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 15
---

OpenClaw enthält einen gebündelten Anbieter `fal` für gehostete Bild- und Videogenerierung.

| Eigenschaft | Wert                                                          |
| ----------- | ------------------------------------------------------------- |
| Anbieter    | `fal`                                                         |
| Auth        | `FAL_KEY` (kanonisch; `FAL_API_KEY` funktioniert auch als Fallback) |
| API         | fal-Modellendpunkte                                           |

## Erste Schritte

<Steps>
  <Step title="Den API-Schlüssel setzen">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="Ein Standard-Bildmodell festlegen">
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

Der gebündelte Bildgenerierungsanbieter `fal` verwendet standardmäßig
`fal/fal-ai/flux/dev`.

| Fähigkeit      | Wert                       |
| --------------- | -------------------------- |
| Maximale Bilder | 4 pro Anfrage              |
| Bearbeitungsmodus | Aktiviert, 1 Referenzbild |
| Größen-Overrides | Unterstützt               |
| Seitenverhältnis | Unterstützt               |
| Auflösung       | Unterstützt               |
| Ausgabeformat   | `png` oder `jpeg`         |

<Warning>
Der fal-Endpunkt für Bildbearbeitung unterstützt **keine** Overrides für `aspectRatio`.
</Warning>

Verwenden Sie `outputFormat: "png"`, wenn Sie PNG-Ausgabe möchten. fal deklariert in OpenClaw
keine explizite Steuerung für transparenten Hintergrund, daher wird `background:
"transparent"` bei fal-Modellen als ignoriertes Override gemeldet.

Um fal als Standardanbieter für Bilder zu verwenden:

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

Der gebündelte Anbieter `fal` für die Videogenerierung verwendet standardmäßig
`fal/fal-ai/minimax/video-01-live`.

| Fähigkeit | Wert                                                                 |
| --------- | -------------------------------------------------------------------- |
| Modi      | Text-zu-Video, Einzelbild-Referenz, Seedance-Referenz-zu-Video       |
| Laufzeit  | Warteschlangenbasierter Submit-/Status-/Ergebnis-Flow für lang laufende Jobs |

<AccordionGroup>
  <Accordion title="Verfügbare Videomodelle">
    **HeyGen Video-Agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="Seedance-2.0-Konfigurationsbeispiel">
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

  <Accordion title="Seedance-2.0-Konfigurationsbeispiel für Reference-to-Video">
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

    Reference-to-Video akzeptiert bis zu 9 Bilder, 3 Videos und 3 Audio-Referenzen
    über die gemeinsamen Parameter `images`, `videos` und `audioRefs` von `video_generate`,
    mit insgesamt höchstens 12 Referenzdateien.

  </Accordion>

  <Accordion title="HeyGen-Video-Agent-Konfigurationsbeispiel">
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
Modelle anzuzeigen, einschließlich kürzlich hinzugefügter Einträge.
</Tip>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bild-Tools und Anbieterauswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Anbieterauswahl.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agent-Standardeinstellungen einschließlich Auswahl von Bild- und Videomodellen.
  </Card>
</CardGroup>
