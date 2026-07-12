---
read_when:
    - Sie möchten lokale ComfyUI-Workflows mit OpenClaw verwenden
    - Sie möchten Comfy Cloud mit Bild-, Video- oder Musik-Workflows verwenden
    - Sie benötigen die Konfigurationsschlüssel des mitgelieferten comfy-Plugins
summary: Einrichtung der Bild-, Video- und Musikgenerierung mit ComfyUI-Workflows in OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T15:52:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw enthält ein gebündeltes `comfy`-Plugin für workflowgesteuerte ComfyUI-Ausführungen. Das
Plugin wird vollständig durch Workflows gesteuert: OpenClaw bildet generische Einstellungen wie `size`,
`aspectRatio`, `resolution`, `durationSeconds` oder TTS-ähnliche Steuerelemente nicht auf
Ihren Graphen ab.

| Eigenschaft        | Details                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| Provider           | `comfy`                                                                          |
| Modell             | `comfy/workflow`                                                                 |
| Gemeinsame Tools   | `image_generate`, `video_generate`, `music_generate`                             |
| Authentifizierung  | Keine für lokales ComfyUI; `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für Comfy Cloud |
| API                | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*`                   |

## Unterstützte Funktionen

- Bildgenerierung und -bearbeitung anhand einer Workflow-JSON-Datei (für die Bearbeitung ist 1 hochgeladenes Referenzbild erforderlich)
- Videogenerierung anhand einer Workflow-JSON-Datei, Text-zu-Video oder Bild-zu-Video (1 Referenzbild)
- Musik-/Audiogenerierung über das gemeinsame Tool `music_generate` mit optional 1 Referenzbild
- Herunterladen der Ausgabe von einer konfigurierten Node oder von allen passenden Ausgabe-Nodes, wenn keine konfiguriert ist

## Erste Schritte

Wählen Sie zwischen der Ausführung von ComfyUI auf Ihrem eigenen Computer und der Verwendung von Comfy Cloud.

<Tabs>
  <Tab title="Lokal">
    **Am besten geeignet für:** die Ausführung Ihrer eigenen ComfyUI-Instanz auf Ihrem Computer oder im LAN.

    <Steps>
      <Step title="ComfyUI lokal starten">
        Stellen Sie sicher, dass Ihre lokale ComfyUI-Instanz ausgeführt wird (Standard: `http://127.0.0.1:8188`).
      </Step>
      <Step title="Workflow-JSON vorbereiten">
        Exportieren oder erstellen Sie eine ComfyUI-Workflow-JSON-Datei. Notieren Sie die Node-IDs der Prompt-Eingabe-Node und der Ausgabe-Node, aus der OpenClaw lesen soll.
      </Step>
      <Step title="Provider konfigurieren">
        Legen Sie `mode: "local"` fest und verweisen Sie auf Ihre Workflow-Datei. Minimales Bildbeispiel:

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
      <Step title="Standardmodell festlegen">
        Verweisen Sie OpenClaw für die konfigurierte Funktion auf das Modell `comfy/workflow`:

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
      <Step title="Überprüfen">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **Am besten geeignet für:** die Ausführung von Workflows in Comfy Cloud, ohne lokale GPU-Ressourcen verwalten zu müssen.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Registrieren Sie sich unter [comfy.org](https://comfy.org) und erzeugen Sie über Ihr Konto-Dashboard einen API-Schlüssel.
      </Step>
      <Step title="API-Schlüssel festlegen">
        Stellen Sie Ihren Schlüssel mit einer der folgenden Methoden bereit:

        ```bash
        # Onboarding-Flag
        openclaw onboard --comfy-api-key "your-key"

        # Umgebungsvariable (für Daemons bevorzugt)
        export COMFY_API_KEY="your-key"

        # Alternative Umgebungsvariable
        export COMFY_CLOUD_API_KEY="your-key"

        # Oder direkt in der Konfiguration
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Workflow-JSON vorbereiten">
        Exportieren oder erstellen Sie eine ComfyUI-Workflow-JSON-Datei. Notieren Sie die Node-IDs der Prompt-Eingabe-Node und der Ausgabe-Node.
      </Step>
      <Step title="Provider konfigurieren">
        Legen Sie `mode: "cloud"` fest und verweisen Sie auf Ihre Workflow-Datei:

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
        Im Cloud-Modus verwendet `baseUrl` standardmäßig `https://cloud.comfy.org`. Legen Sie `baseUrl` nur für einen benutzerdefinierten Cloud-Endpunkt fest.
        </Tip>
      </Step>
      <Step title="Standardmodell festlegen">
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
      <Step title="Überprüfen">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfiguration

Comfy unterstützt gemeinsame Verbindungseinstellungen auf oberster Ebene sowie Workflow-Abschnitte für einzelne Funktionen (`image`, `video`, `music`):

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

| Schlüssel              | Typ                      | Beschreibung                                                                         |
| ---------------------- | ------------------------ | ------------------------------------------------------------------------------------ |
| `mode`                 | `"local"` oder `"cloud"` | Verbindungsmodus. Standardmäßig `"local"`.                                           |
| `baseUrl`              | Zeichenfolge             | Standardmäßig `http://127.0.0.1:8188` für lokal oder `https://cloud.comfy.org` für die Cloud. |
| `apiKey`               | Zeichenfolge             | Optionaler direkt angegebener Schlüssel, alternativ zu den Umgebungsvariablen `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork`  | boolesch                 | Erlaubt eine private/LAN-`baseUrl` im Cloud-Modus oder einen lokalen privaten DNS-FQDN. |

<Note>
Im Modus `local` funktionieren Loopback-/private IP-Literale und einteilige Dienstnamen wie `http://comfyui:8188` ohne `allowPrivateNetwork`. Öffentlich erscheinende private DNS-FQDNs wie `https://comfy.local.example.com` erfordern `allowPrivateNetwork: true`. Das Vertrauen in private Ursprünge bleibt auf das konfigurierte Schema, den Hostnamen und den Port beschränkt; lokale Weiterleitungen dürfen den konfigurierten Hostnamen nicht verlassen, während Cloud-Weiterleitungen zu öffentlichen CDNs anhand der standardmäßigen SSRF-Richtlinie geprüft werden.
</Note>

### Funktionsspezifische Schlüssel

Diese Schlüssel gelten innerhalb der Abschnitte `image`, `video` oder `music`:

| Schlüssel                     | Erforderlich | Standard | Beschreibung                                                                |
| ----------------------------- | ------------ | -------- | --------------------------------------------------------------------------- |
| `workflow` oder `workflowPath` | Ja          | --       | Direkt angegebene Workflow-JSON oder Pfad zur ComfyUI-Workflow-JSON-Datei.  |
| `promptNodeId`                | Ja           | --       | Node-ID, die den Text-Prompt empfängt.                                      |
| `promptInputName`             | Nein         | `"text"` | Eingabename an der Prompt-Node.                                             |
| `outputNodeId`                | Nein         | --       | Node-ID, von der die Ausgabe gelesen wird. Bei Auslassung werden alle passenden Ausgabe-Nodes verwendet. |
| `pollIntervalMs`              | Nein         | `1500`   | Abfrageintervall in Millisekunden für den Abschluss des Auftrags.           |
| `timeoutMs`                   | Nein         | `300000` | Zeitüberschreitung in Millisekunden für die Workflow-Ausführung.            |

Die Abschnitte `image` und `video` unterstützen außerdem eine Eingabe-Node für Referenzbilder:

| Schlüssel                  | Erforderlich                            | Standard  | Beschreibung                                          |
| -------------------------- | --------------------------------------- | --------- | ----------------------------------------------------- |
| `inputImageNodeId`         | Ja (bei Übergabe eines Referenzbildes)  | --        | Node-ID, die das hochgeladene Referenzbild empfängt.  |
| `inputImageInputName`      | Nein                                    | `"image"` | Eingabename an der Bild-Node.                         |

`apiKey` akzeptiert entweder eine literale Zeichenfolge oder ein [Secret-Referenzobjekt](/de/gateway/configuration-reference#secrets).

## Workflow-Details

<AccordionGroup>
  <Accordion title="Bild-Workflows">
    Legen Sie das Standardbildmodell auf `comfy/workflow` fest:

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

    Um die Bildbearbeitung mit einem hochgeladenen Referenzbild zu aktivieren, fügen Sie Ihrer Bildkonfiguration `inputImageNodeId` hinzu:

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

  <Accordion title="Video-Workflows">
    Legen Sie das Standardvideomodell auf `comfy/workflow` fest:

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

  <Accordion title="Musik-Workflows">
    Das gebündelte Plugin registriert einen Provider zur Musikgenerierung für workflowdefinierte Audio- oder Musikausgaben, der über das gemeinsame Tool `music_generate` verfügbar ist. Es akzeptiert ein optionales Referenzbild (bis zu 1):

    ```text
    /tool music_generate prompt="Warmer Ambient-Synthesizer-Loop mit sanfter Bandtextur"
    ```

    Verwenden Sie den Konfigurationsabschnitt `music`, um auf Ihre Audio-Workflow-JSON und die Ausgabe-Node zu verweisen.

  </Accordion>

  <Accordion title="Abwärtskompatibilität">
    Die vorhandene Bildkonfiguration auf oberster Ebene (ohne den verschachtelten Abschnitt `image`) funktioniert weiterhin:

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

    OpenClaw behandelt diese Legacy-Struktur als Bild-Workflow-Konfiguration. Sie müssen nicht sofort migrieren, für neue Einrichtungen werden jedoch die verschachtelten Abschnitte `image` / `video` / `music` empfohlen. Wenn Sie ausschließlich die Bildgenerierung verwenden, sind die flache Legacy-Konfiguration und der neue verschachtelte Abschnitt `image` funktional gleichwertig.

  </Accordion>

  <Accordion title="Live-Tests">
    Für das gebündelte Plugin ist eine optionale Live-Testabdeckung verfügbar:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Der Live-Test überspringt einzelne Bild-, Video- oder Musikfälle, sofern der entsprechende Abschnitt des Comfy-Workflows nicht konfiguriert ist.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Konfiguration und Verwendung des Bildgenerierungs-Tools.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Konfiguration und Verwendung des Videogenerierungs-Tools.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Einrichtung des Tools zur Musik- und Audiogenerierung.
  </Card>
  <Card title="Provider-Verzeichnis" href="/de/providers/index" icon="layers">
    Übersicht über alle Provider und Modellreferenzen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich der Agent-Standardeinstellungen.
  </Card>
</CardGroup>
