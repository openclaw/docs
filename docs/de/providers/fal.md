---
read_when:
    - Sie möchten die Bilderzeugung mit fal in OpenClaw verwenden
    - Sie benötigen den Authentifizierungsablauf für FAL_KEY
    - Sie möchten fal-Standardeinstellungen für image_generate, video_generate oder music_generate
summary: Einrichtung der Bild-, Video- und Musikgenerierung mit fal in OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-07-24T04:04:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw enthält einen gebündelten `fal`-Provider für die gehostete Bild-, Video- und Musikgenerierung.

| Eigenschaft | Wert                                                                           |
| -------- | ------------------------------------------------------------------------------- |
| Provider | `fal`                                                                           |
| Authentifizierung | `FAL_KEY` (kanonisch; `FAL_API_KEY` funktioniert auch als Fallback)                   |
| API      | fal-Modellendpunkte (`https://fal.run`; Videoaufträge verwenden `https://queue.fal.run`) |
| Basis-URL | Mit `models.providers.fal.baseUrl` überschreiben                                    |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    Nicht interaktive Einrichtungen können `--fal-api-key <key>` übergeben oder `FAL_KEY` exportieren.
    Das Onboarding legt außerdem `fal/fal-ai/flux/dev` als Standardbildmodell fest, wenn
    keines konfiguriert ist.

  </Step>
  <Step title="Standardbildmodell festlegen">
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

| Funktion     | Wert                                                              |
| -------------- | ------------------------------------------------------------------ |
| Maximale Bildanzahl | 4 pro Anfrage; Krea 2: 1 pro Anfrage                               |
| Größenüberschreibungen | `1024x1024`, `1024x1536`, `1536x1024`, `1024x1792`, `1792x1024`    |
| Seitenverhältnis | Überall außer bei Flux-Bild-zu-Bild unterstützt                    |
| Auflösung     | `1K`, `2K`, `4K` (modellspezifische Beschränkungen unten)                          |
| Ausgabeformat | `png` (Standard) oder `jpeg`; Krea 2 lehnt `outputFormat`-Überschreibungen ab |

Bearbeitungsanfragen (Referenzbilder über die gemeinsamen Parameter `image` / `images`)
werden an einen modellspezifischen Bearbeitungsendpunkt mit modellspezifischen Referenzbeschränkungen weitergeleitet:

| Modellfamilie              | Modellreferenz nach `fal/`                 | Bearbeitungsendpunkt | Maximale Anzahl an Referenzbildern |
| ------------------------- | -------------------------------------- | ----------------- | -------------------- |
| Flux und andere fal-Modelle | `fal-ai/flux/dev` (Standard)            | `/image-to-image` | 1                    |
| GPT Image                 | `openai/gpt-image-*`                   | `/edit`           | 10                   |
| Grok Imagine              | `xai/grok-imagine-image`               | `/edit`           | 3                    |
| Nano Banana (veraltet)      | `fal-ai/nano-banana`                   | `/edit`           | 3                    |
| Nano Banana 2             | `fal-ai/nano-banana-*`                 | `/edit`           | 14                   |
| Nano Banana 2 Lite        | `google/nano-banana-2-lite`            | `/edit`           | 14                   |
| Krea 2                    | `krea/v2/{medium,large}/text-to-image` | keiner (Stilreferenzen) | 10 Stilreferenzen  |

<Warning>
Flux-Bild-zu-Bild-Anfragen unterstützen **keine** `aspectRatio`-Überschreibungen. GPT
Image- und Nano-Banana-2-Bearbeitungsanfragen verwenden den `/edit`-Endpunkt von fal und akzeptieren
Hinweise zum Seitenverhältnis. Nano Banana 2 akzeptiert außerdem zusätzliche native breite/hohe Seitenverhältnisse
wie `4:1`, `1:4`, `8:1` und `1:8`; Krea 2 validiert seine eigene kleinere
Teilmenge an Seitenverhältnissen. Grok Imagine besitzt eine eigene Liste von Seitenverhältnissen (einschließlich `2:1`,
`20:9`, `19.5:9` und ihrer Kehrwerte) und akzeptiert nur die Auflösungen `1K`/`2K`;
das veraltete Nano Banana und Nano Banana 2 Lite lehnen `resolution`-Überschreibungen ab.
</Warning>

Krea-2-Modelle verwenden das native Krea-Nutzlastschema von fal. OpenClaw sendet
`aspect_ratio`, `creativity` und `image_style_references` anstelle der
generischen `image_size`- / Bearbeitungsendpunkt-Nutzlast, die Flux verwendet. Die Modellreferenzen lauten:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

Verwenden Sie Medium für schnellere ausdrucksstarke Illustrationen, Anime, Gemälde und künstlerische
Stile. Verwenden Sie Large für langsamere fotorealistische Darstellungen, unverfälschte Texturen, Filmkörnung und detaillierte
Optik. Krea verwendet standardmäßig `fal.creativity: "medium"`; unterstützte Werte sind
`raw`, `low`, `medium` und `high`.

Krea 2 stellt im Anfrageschema von fal das Seitenverhältnis und nicht `image_size` bereit. Bevorzugen Sie
`aspectRatio`; OpenClaw ordnet `size` dem nächstgelegenen unterstützten Krea-Seitenverhältnis zu
und lehnt `resolution` für Krea ab, anstatt es zu verwerfen.

Verwenden Sie `outputFormat: "png"`, wenn Sie eine PNG-Ausgabe von fal-Modellen wünschen, die
`output_format` bereitstellen. fal deklariert in OpenClaw keine explizite Steuerung für einen transparenten
Hintergrund, daher wird `background: "transparent"` bei fal-Modellen als ignorierte
Überschreibung gemeldet.
Krea-2-Endpunkte stellen über fal kein `output_format`-Anfragefeld bereit, daher
lehnt OpenClaw `outputFormat`-Überschreibungen für Krea-Anfragen ab.

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

| Funktion | Wert                                                              |
| ---------- | ------------------------------------------------------------------ |
| Modi      | Text-zu-Video, Einzelbildreferenz, Seedance-Referenz-zu-Video |
| Laufzeit | Warteschlangengestützter Übermittlungs-/Status-/Ergebnisablauf für lang laufende Aufträge |
| Zeitüberschreitung | Standardmäßig 20 Minuten pro Auftrag; Statusabfrage alle 5 Sekunden       |

<AccordionGroup>
  <Accordion title="Verfügbare Videomodelle">
    **MiniMax (Standard):**

    - `fal/fal-ai/minimax/video-01-live`

    **HeyGen-Video-Agent:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling und Wan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    MiniMax-Live- und HeyGen-Anfragen senden nur den Prompt sowie optional ein
    einzelnes Referenzbild; andere Überschreibungen werden nicht weitergeleitet. Seedance-Modelle
    akzeptieren `aspectRatio`, `size`, `resolution`, Laufzeiten von 4–15 Sekunden und
    einen Audioschalter.

  </Accordion>

  <Accordion title="Konfigurationsbeispiel für Seedance 2.0">
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

  <Accordion title="Konfigurationsbeispiel für Seedance 2.0 Referenz-zu-Video">
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
    über die gemeinsamen Parameter `video_generate` `images`, `videos` und `audioRefs`,
    wobei insgesamt höchstens 12 Referenzdateien zulässig sind. Audioreferenzen erfordern
    mindestens eine Bild- oder Videoreferenz in derselben Anfrage.

  </Accordion>

  <Accordion title="Konfigurationsbeispiel für den HeyGen-Video-Agent">
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
gemeinsame `music_generate`-Werkzeug.

| Funktion    | Wert                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Standardmodell | `fal/fal-ai/minimax-music/v2.6`                                                                                          |
| Modelle        | `fal-ai/minimax-music/v2.6` (mp3), `fal-ai/ace-step/prompt-to-audio` (wav), `fal-ai/stable-audio-25/text-to-audio` (wav) |
| Maximale Dauer | 240 Sekunden                                                                                                              |
| Laufzeit       | Synchrone Anfrage mit anschließendem Download der generierten Audiodatei                                                                        |

So verwenden Sie fal als Standard-Provider für Musik:

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

`fal-ai/minimax-music/v2.6` unterstützt explizite Liedtexte und den Instrumentalmodus,
jedoch nicht beides in derselben Anfrage. ACE-Step und Stable Audio sind
Prompt-zu-Audio-Endpunkte; wählen Sie sie mit der `model`-Überschreibung aus, wenn Sie
diese Modellfamilien verwenden möchten. ACE-Step lehnt explizite Liedtexte ab; Stable Audio lehnt
sowohl Liedtexte als auch den Instrumentalmodus ab.

<Tip>
Die Tabellen und Akkordeons oben behandeln die Modellfamilien, die der gebündelte fal-
Provider speziell berücksichtigt. Andere IDs von fal-Bildendpunkten können weiterhin als
Bildmodell ausgewählt werden; sie werden wie Flux behandelt (generische `image_size`-Nutzlast, ein
Referenzbild über `/image-to-image`).
</Tip>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Gemeinsame Parameter des Bildwerkzeugs und Provider-Auswahl.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Videowerkzeugs und Provider-Auswahl.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Gemeinsame Parameter des Musikwerkzeugs und Provider-Auswahl.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Agentenstandards einschließlich der Auswahl von Bild-, Video- und Musikmodellen.
  </Card>
</CardGroup>
