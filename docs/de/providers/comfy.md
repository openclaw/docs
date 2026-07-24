---
read_when:
    - Sie möchten lokale ComfyUI-Workflows mit OpenClaw verwenden
    - Sie möchten Comfy Cloud mit Bild-, Video- oder Musik-Workflows verwenden
    - Sie benötigen die Konfigurationsschlüssel des mitgelieferten comfy-Plugins.
summary: Einrichtung der Bild-, Video- und Musikgenerierung mit ComfyUI-Workflows in OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-24T04:02:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw enthält ein gebündeltes `comfy`-Plugin für workflowgesteuerte ComfyUI-Ausführungen. Das
Plugin ist vollständig workflowgesteuert: OpenClaw bildet generische `size`-,
`aspectRatio`-, `resolution`-, `durationSeconds`- oder TTS-artige Steuerelemente nicht auf
Ihren Graphen ab.

| Eigenschaft          | Detail                                                                           |
| -------------------- | -------------------------------------------------------------------------------- |
| Provider             | `comfy`                                                               |
| Modell               | `comfy/workflow`                                                               |
| Gemeinsame Tools     | `image_generate`, `video_generate`, `music_generate`                       |
| Authentifizierung    | Keine für lokales ComfyUI; `COMFY_API_KEY` oder `COMFY_CLOUD_API_KEY` für Comfy Cloud |
| API                  | ComfyUI `/prompt` / `/history` / `/view`; Comfy Cloud `/api/*` |

## Unterstützte Funktionen

- Bilderzeugung und -bearbeitung anhand einer Workflow-JSON-Datei (für die Bearbeitung ist 1 hochgeladenes Referenzbild erforderlich)
- Videoerzeugung anhand einer Workflow-JSON-Datei, Text-zu-Video oder Bild-zu-Video (1 Referenzbild)
- Musik-/Audioerzeugung über das gemeinsame Tool `music_generate`, optional mit 1 Referenzbild
- Herunterladen der Ausgabe von einem konfigurierten Node oder von allen passenden Ausgabe-Nodes, wenn keiner konfiguriert ist

## Erste Schritte

Wählen Sie, ob Sie ComfyUI auf Ihrem eigenen Computer ausführen oder Comfy Cloud verwenden möchten.

<Tabs>
  <Tab title="Lokal">
    **Am besten geeignet für:** die Ausführung Ihrer eigenen ComfyUI-Instanz auf Ihrem Computer oder im LAN.

    <Steps>
      <Step title="ComfyUI lokal starten">
        Stellen Sie sicher, dass Ihre lokale ComfyUI-Instanz ausgeführt wird (Standard: `http://127.0.0.1:8188`).
      </Step>
      <Step title="Workflow-JSON vorbereiten">
        Exportieren oder erstellen Sie eine ComfyUI-Workflow-JSON-Datei. Notieren Sie sich die Node-IDs des Nodes für die Prompt-Eingabe und des Ausgabe-Nodes, aus dem OpenClaw lesen soll.
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
        Richten Sie OpenClaw für die konfigurierte Funktion auf das Modell `comfy/workflow` aus:

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
        Registrieren Sie sich bei [comfy.org](https://comfy.org) und erstellen Sie im Dashboard Ihres Kontos einen API-Schlüssel.
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

        # Oder inline in der Konfiguration
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="Workflow-JSON vorbereiten">
        Exportieren oder erstellen Sie eine ComfyUI-Workflow-JSON-Datei. Notieren Sie sich die Node-IDs des Nodes für die Prompt-Eingabe und des Ausgabe-Nodes.
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
        Im Cloud-Modus ist der Standardwert von `baseUrl` `https://cloud.comfy.org`. Legen Sie `baseUrl` nur für einen benutzerdefinierten Cloud-Endpunkt fest.
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

Comfy unterstützt gemeinsame Verbindungseinstellungen auf oberster Ebene sowie Workflow-Abschnitte für die einzelnen Funktionen (`image`, `video`, `music`):

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

| Schlüssel             | Typ                    | Beschreibung                                                                          |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`    | `"local"` oder `"cloud"` | Verbindungsmodus. Standardwert ist `"local"`.                                |
| `baseUrl`    | Zeichenfolge           | Standardwert ist `http://127.0.0.1:8188` für lokal oder `https://cloud.comfy.org` für die Cloud. |
| `apiKey`    | Zeichenfolge           | Optionaler Inline-Schlüssel, alternativ zu den Umgebungsvariablen `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork`    | boolescher Wert        | Ermöglicht eine private/LAN-`baseUrl` im Cloud-Modus oder einen lokalen Private-DNS-FQDN. |

<Note>
Im Modus `local` funktionieren Loopback-/private IP-Literale und Dienstnamen mit einem einzigen Label wie `http://comfyui:8188` ohne `allowPrivateNetwork`. Öffentlich wirkende Private-DNS-FQDNs wie `https://comfy.local.example.com` erfordern `allowPrivateNetwork: true`. Das Vertrauen in private Ursprünge bleibt auf das konfigurierte Schema, den Hostnamen und den Port beschränkt; lokale Weiterleitungen dürfen den konfigurierten Hostnamen nicht verlassen, während Cloud-Weiterleitungen zu öffentlichen CDNs anhand der standardmäßigen SSRF-Richtlinie geprüft werden.
</Note>

### Funktionsspezifische Schlüssel

Diese Schlüssel gelten innerhalb der Abschnitte `image`, `video` oder `music`:

| Schlüssel                    | Erforderlich | Standardwert | Beschreibung                                                               |
| ---------------------------- | ------------ | ------------ | -------------------------------------------------------------------------- |
| `workflow` oder `workflowPath` | Ja           | --           | Inline-Workflow-JSON oder Pfad zur ComfyUI-Workflow-JSON-Datei.            |
| `promptNodeId`           | Ja           | --           | Node-ID, die den Text-Prompt empfängt.                                     |
| `promptInputName`           | Nein         | `"text"` | Eingabename am Prompt-Node.                                                |
| `outputNodeId`           | Nein         | --           | Node-ID, aus der die Ausgabe gelesen wird. Falls nicht angegeben, werden alle passenden Ausgabe-Nodes verwendet. |
| `pollIntervalMs`           | Nein         | `1500` | Abfrageintervall für den Auftragsabschluss in Millisekunden.               |
| `timeoutMs`           | Nein         | `300000` | Zeitüberschreitung für die Workflow-Ausführung in Millisekunden.           |

Die Abschnitte `image` und `video` unterstützen außerdem einen Eingabe-Node für ein Referenzbild:

| Schlüssel             | Erforderlich                                  | Standardwert | Beschreibung                                          |
| --------------------- | --------------------------------------------- | ------------ | ----------------------------------------------------- |
| `inputImageNodeId`    | Ja (bei Übergabe eines Referenzbildes)        | --           | Node-ID, die das hochgeladene Referenzbild empfängt.  |
| `inputImageInputName`    | Nein                                          | `"image"` | Eingabename am Bild-Node.                             |

`apiKey` akzeptiert entweder eine literale Zeichenfolge oder ein [Geheimnisreferenz](/de/gateway/configuration-reference#secrets)-Objekt.

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

    **Beispiel für die Bearbeitung mit einem Referenzbild:**

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
    Das gebündelte Plugin registriert einen Provider zur Musikerzeugung für workflowdefinierte Audio- oder Musikausgaben, der über das gemeinsame Tool `music_generate` bereitgestellt wird. Es akzeptiert optional ein Referenzbild (bis zu 1):

    ```text
    /tool music_generate prompt="Warme Ambient-Synthesizer-Schleife mit sanfter Bandtextur"
    ```

    Verwenden Sie den Konfigurationsabschnitt `music`, um auf die JSON-Datei Ihres Audio-Workflows und den Ausgabe-Node zu verweisen.

  </Accordion>

  <Accordion title="Abwärtskompatibilität">
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

    OpenClaw behandelt diese veraltete Struktur als Konfiguration für den Bild-Workflow. Sie müssen nicht sofort migrieren, für neue Einrichtungen werden jedoch die verschachtelten Abschnitte `image` / `video` / `music` empfohlen. Wenn Sie nur die Bildgenerierung verwenden, sind die veraltete flache Konfiguration und der neue verschachtelte Abschnitt `image` funktional gleichwertig.

  </Accordion>

  <Accordion title="Live-Tests">
    Für das gebündelte Plugin ist eine optionale Live-Testabdeckung verfügbar:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    Der Live-Test überspringt einzelne Bild-, Video- oder Musikfälle, sofern der entsprechende Comfy-Workflow-Abschnitt nicht konfiguriert ist.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Bildgenerierung" href="/de/tools/image-generation" icon="image">
    Konfiguration und Verwendung des Bildgenerierungswerkzeugs.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Konfiguration und Verwendung des Videogenerierungswerkzeugs.
  </Card>
  <Card title="Musikgenerierung" href="/de/tools/music-generation" icon="music">
    Einrichtung des Werkzeugs zur Musik- und Audiogenerierung.
  </Card>
  <Card title="Provider-Verzeichnis" href="/de/providers/index" icon="layers">
    Übersicht über alle Provider und Modellreferenzen.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/config-agents#agent-defaults" icon="gear">
    Vollständige Konfigurationsreferenz einschließlich der Agentenstandards.
  </Card>
</CardGroup>
