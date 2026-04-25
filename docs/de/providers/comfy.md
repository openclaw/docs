---
read_when:
    - Sie möchten lokale ComfyUI-Workflows mit OpenClaw verwenden.
    - Sie möchten Comfy Cloud mit Bild-, Video- oder Musik-Workflows verwenden.
    - Sie benötigen die Konfigurationsschlüssel des gebündelten comfy-Plugin.
summary: ComfyUI-Workflow-Einrichtung für Bild-, Video- und Musikgenerierung in OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-25T13:54:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 15
---

OpenClaw enthält ein gebündeltes `comfy` Plugin für workflowgesteuerte ComfyUI-Ausführungen. Das Plugin ist vollständig workflowgesteuert, daher versucht OpenClaw nicht, generische Steuerelemente wie `size`, `aspectRatio`, `resolution`, `durationSeconds` oder TTS-ähnliche Optionen auf Ihren Graphen abzubilden.

| Eigenschaft       | Detail                                                                              |
| ----------------- | ----------------------------------------------------------------------------------- |
| Anbieter          | `comfy`                                                                             |
| Modelle           | `comfy/workflow`                                                                    |
| Gemeinsame Oberflächen | `image_generate`, `video_generate`, `music_generate`                            |
| Authentifizierung | Keine für lokales ComfyUI; `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für Comfy Cloud |
| API               | ComfyUI `/prompt` / `/history` / `/view` und Comfy Cloud `/api/*`                   |

## Was unterstützt wird

- Bildgenerierung aus einer Workflow-JSON
- Bildbearbeitung mit 1 hochgeladenen Referenzbild
- Videogenerierung aus einer Workflow-JSON
- Videogenerierung mit 1 hochgeladenen Referenzbild
- Musik- oder Audiogenerierung über das gemeinsame Tool `music_generate`
- Herunterladen der Ausgabe von einem konfigurierten Node oder von allen passenden Ausgabe-Nodes

## Erste Schritte

Wählen Sie zwischen dem Ausführen von ComfyUI auf Ihrem eigenen Rechner oder der Nutzung von Comfy Cloud.

<Tabs>
  <Tab title="Local">
    **Am besten geeignet für:** das Ausführen Ihrer eigenen ComfyUI-Instanz auf Ihrem Rechner oder im LAN.

    <Steps>
      <Step title="Start ComfyUI locally">
        Stellen Sie sicher, dass Ihre lokale ComfyUI-Instanz läuft (standardmäßig unter `http://127.0.0.1:8188`).
      </Step>
      <Step title="Prepare your workflow JSON">
        Exportieren oder erstellen Sie eine ComfyUI-Workflow-JSON-Datei. Notieren Sie die Node-IDs für den Node zur Prompt-Eingabe und den Ausgabe-Node, aus dem OpenClaw lesen soll.
      </Step>
      <Step title="Configure the provider">
        Setzen Sie `mode: "local"` und verweisen Sie auf Ihre Workflow-Datei. Hier ist ein minimales Bildbeispiel:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Set the default model">
        Verweisen Sie OpenClaw für die konfigurierte Fähigkeit auf das Modell `comfy/workflow`:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Am besten geeignet für:** das Ausführen von Workflows in Comfy Cloud, ohne lokale GPU-Ressourcen verwalten zu müssen.

    <Steps>
      <Step title="Get an API key">
        Registrieren Sie sich unter [comfy.org](https://comfy.org) und generieren Sie einen API-Schlüssel in Ihrem Kontodashboard.
      </Step>
      <Step title="Set the API key">
        Stellen Sie Ihren Schlüssel mit einer der folgenden Methoden bereit:

        ```bash
        # Umgebungsvariable (bevorzugt)
        export COMFY_API_KEY="your-key"

        # Alternative Umgebungsvariable
        export COMFY_CLOUD_API_KEY="your-key"

        # Oder direkt in der Konfiguration
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Prepare your workflow JSON">
        Exportieren oder erstellen Sie eine ComfyUI-Workflow-JSON-Datei. Notieren Sie die Node-IDs für den Node zur Prompt-Eingabe und den Ausgabe-Node.
      </Step>
      <Step title="Configure the provider">
        Setzen Sie `mode: "cloud"` und verweisen Sie auf Ihre Workflow-Datei:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        Im Cloud-Modus ist `baseUrl` standardmäßig auf `https://cloud.comfy.org` gesetzt. Sie müssen `baseUrl` nur festlegen, wenn Sie einen benutzerdefinierten Cloud-Endpunkt verwenden.
        </Tip>
      </Step>
      <Step title="Set the default model">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfiguration

Comfy unterstützt gemeinsame Verbindungseinstellungen auf oberster Ebene sowie workflowbezogene Abschnitte pro Fähigkeit (`image`, `video`, `music`):

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
          mode: "local",
          baseUrl: "http://127.0.0.1:8188",
          image: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
          video: {
            workflowPath: "./workflows/video-api.json",
            promptNodeId: "12",
            outputNodeId: "21",
          },
          music: {
            workflowPath: "./workflows/music-api.json",
            promptNodeId: "3",
            outputNodeId: "18",
          },
        },
      },
    },
  },
}
```

### Gemeinsame Schlüssel

| Schlüssel              | Typ                    | Beschreibung                                                                          |
| ---------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                 | `"local"` oder `"cloud"` | Verbindungsmodus.                                                                   |
| `baseUrl`              | string                 | Standard ist `http://127.0.0.1:8188` für lokal oder `https://cloud.comfy.org` für Cloud. |
| `apiKey`               | string                 | Optionaler Inline-Schlüssel als Alternative zu den Umgebungsvariablen `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork`  | boolean                | Erlaubt eine private/LAN-`baseUrl` im Cloud-Modus.                                   |

### Schlüssel pro Fähigkeit

Diese Schlüssel gelten innerhalb der Abschnitte `image`, `video` oder `music`:

| Schlüssel                    | Erforderlich | Standard | Beschreibung                                                                 |
| ---------------------------- | ------------ | -------- | ---------------------------------------------------------------------------- |
| `workflow` oder `workflowPath` | Ja         | --       | Pfad zur ComfyUI-Workflow-JSON-Datei.                                        |
| `promptNodeId`               | Ja           | --       | Node-ID, die den Text-Prompt empfängt.                                       |
| `promptInputName`            | Nein         | `"text"` | Eingabename auf dem Prompt-Node.                                             |
| `outputNodeId`               | Nein         | --       | Node-ID, aus der die Ausgabe gelesen wird. Wenn weggelassen, werden alle passenden Ausgabe-Nodes verwendet. |
| `pollIntervalMs`             | Nein         | --       | Abfrageintervall in Millisekunden für den Abschluss des Jobs.                |
| `timeoutMs`                  | Nein         | --       | Timeout in Millisekunden für die Workflow-Ausführung.                        |

Die Abschnitte `image` und `video` unterstützen außerdem:

| Schlüssel              | Erforderlich                            | Standard  | Beschreibung                                        |
| ---------------------- | --------------------------------------- | --------- | -------------------------------------------------- |
| `inputImageNodeId`     | Ja (beim Übergeben eines Referenzbilds) | --        | Node-ID, die das hochgeladene Referenzbild empfängt. |
| `inputImageInputName`  | Nein                                    | `"image"` | Eingabename auf dem Bild-Node.                     |

## Workflow-Details

<AccordionGroup>
  <Accordion title="Image workflows">
    Setzen Sie das Standardmodell für Bilder auf `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **Beispiel für die Bearbeitung mit Referenzbild:**

    Um die Bildbearbeitung mit einem hochgeladenen Referenzbild zu aktivieren, fügen Sie `inputImageNodeId` zu Ihrer Bildkonfiguration hinzu:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              image: {
                workflowPath: "./workflows/edit-api.json",
                promptNodeId: "6",
                inputImageNodeId: "7",
                inputImageInputName: "image",
                outputNodeId: "9",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Video workflows">
    Setzen Sie das Standardmodell für Videos auf `comfy/workflow`:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Comfy-Video-Workflows unterstützen Text-zu-Video und Bild-zu-Video über den konfigurierten Graphen.

    <Note>
    OpenClaw übergibt keine Eingabevideos an Comfy-Workflows. Als Eingaben werden nur Text-Prompts und einzelne Referenzbilder unterstützt.
    </Note>

  </Accordion>

  <Accordion title="Music workflows">
    Das gebündelte Plugin registriert einen Anbieter für Musikgenerierung für workflowdefinierte Audio- oder Musikausgaben, bereitgestellt über das gemeinsame Tool `music_generate`:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    Verwenden Sie den Konfigurationsabschnitt `music`, um auf Ihre Audio-Workflow-JSON und den Ausgabe-Node zu verweisen.

  </Accordion>

  <Accordion title="Backward compatibility">
    Die bestehende Bildkonfiguration auf oberster Ebene (ohne den verschachtelten Abschnitt `image`) funktioniert weiterhin:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw behandelt diese ältere Form als Konfiguration für den Bild-Workflow. Sie müssen nicht sofort migrieren, aber die verschachtelten Abschnitte `image` / `video` / `music` werden für neue Setups empfohlen.

    <Tip>
    Wenn Sie nur Bildgenerierung verwenden, sind die ältere flache Konfiguration und der neue verschachtelte Abschnitt `image` funktional gleichwertig.
    </Tip>

  </Accordion>

  <Accordion title="Live tests">
    Es gibt eine opt-in Live-Abdeckung für das gebündelte Plugin:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Der Live-Test überspringt einzelne Fälle für Bild, Video oder Musik, sofern der passende Comfy-Workflow-Abschnitt nicht konfiguriert ist.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Konfiguration und Verwendung des Tools für die Bildgenerierung.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Konfiguration und Verwendung des Tools für die Videogenerierung.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Einrichtung des Tools für Musik- und Audiogenerierung.
  </Card>
  <Card title="Anbieterverzeichnis" href="/de/providers/index" icon="layers">
    Überblick über alle Anbieter und Modellreferenzen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich der Standardwerte für Agents.
  </Card>
</CardGroup>
