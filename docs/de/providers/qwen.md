---
read_when:
    - Sie möchten Qwen mit OpenClaw verwenden
    - Sie haben zuvor Qwen OAuth verwendet
summary: Qwen Cloud über das OpenClaw Plugin verwenden
title: Qwen
x-i18n:
    generated_at: "2026-06-27T18:06:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e42a38f3e7f2db54092886f2ef8c3ab27163c3c3d0f9b4d95affd58555f58d3
    source_path: providers/qwen.md
    workflow: 16
---

OpenClaw behandelt Qwen jetzt als vollwertiges Provider-Plugin mit der kanonischen ID
`qwen`. Das Provider-Plugin zielt auf die Endpunkte Qwen Cloud / Alibaba DashScope und
Coding Plan ab, hält ältere `modelstudio`-IDs als Kompatibilitätsalias funktionsfähig
und stellt außerdem den Token-Ablauf des Qwen Portals als Provider `qwen-oauth` bereit.

- Provider: `qwen`
- Portal-Provider: [`qwen-oauth`](/de/providers/qwen-oauth)
- Bevorzugte Umgebungsvariable: `QWEN_API_KEY`
- Aus Kompatibilitätsgründen ebenfalls akzeptiert: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API-Stil: OpenAI-kompatibel

<Tip>
Wenn Sie `qwen3.6-plus` verwenden möchten, bevorzugen Sie den Endpunkt **Standard (nutzungsbasierte Abrechnung)**.
Die Unterstützung im Coding Plan kann hinter dem öffentlichen Katalog zurückliegen.
</Tip>

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie dann den Gateway neu:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Erste Schritte

Wählen Sie Ihren Plantyp aus und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Coding Plan (subscription)">
    **Am besten geeignet für:** abonnementbasierten Zugriff über den Qwen Coding Plan.

    <Steps>
      <Step title="Get your API key">
        Erstellen oder kopieren Sie einen API-Schlüssel unter [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Für den **Global**-Endpunkt:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Für den **China**-Endpunkt:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Ältere `modelstudio-*`-IDs für Authentifizierungsoptionen und `modelstudio/...`-Modellreferenzen
    funktionieren weiterhin als Kompatibilitätsalias, aber neue Einrichtungsabläufe sollten die kanonischen
    `qwen-*`-IDs für Authentifizierungsoptionen und `qwen/...`-Modellreferenzen bevorzugen. Wenn Sie einen exakten
    benutzerdefinierten `models.providers.modelstudio`-Eintrag mit einem anderen `api`-Wert definieren, besitzt dieser
    benutzerdefinierte Provider die `modelstudio/...`-Referenzen statt des Qwen-Kompatibilitätsalias.
    </Note>

  </Tab>

  <Tab title="Standard (pay-as-you-go)">
    **Am besten geeignet für:** nutzungsbasierten Zugriff über den Standard-Model-Studio-Endpunkt, einschließlich Modellen wie `qwen3.6-plus`, die im Coding Plan möglicherweise nicht verfügbar sind.

    <Steps>
      <Step title="Get your API key">
        Erstellen oder kopieren Sie einen API-Schlüssel unter [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Run onboarding">
        Für den **Global**-Endpunkt:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Für den **China**-Endpunkt:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Ältere `modelstudio-*`-IDs für Authentifizierungsoptionen und `modelstudio/...`-Modellreferenzen
    funktionieren weiterhin als Kompatibilitätsalias, aber neue Einrichtungsabläufe sollten die kanonischen
    `qwen-*`-IDs für Authentifizierungsoptionen und `qwen/...`-Modellreferenzen bevorzugen. Wenn Sie einen exakten
    benutzerdefinierten `models.providers.modelstudio`-Eintrag mit einem anderen `api`-Wert definieren, besitzt dieser
    benutzerdefinierte Provider die `modelstudio/...`-Referenzen statt des Qwen-Kompatibilitätsalias.
    </Note>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Am besten geeignet für:** ein Qwen-Portal-Token für `https://portal.qwen.ai/v1`.

    Informationen zur dedizierten Provider-Seite und zu Migrationshinweisen finden Sie unter
    [Qwen OAuth / Portal](/de/providers/qwen-oauth).

    <Steps>
      <Step title="Provide your portal token">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen-oauth/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` verwendet denselben Namen der Umgebungsvariable `QWEN_API_KEY` wie der DashScope-
    Provider, speichert die Authentifizierung aber unter der Provider-ID `qwen-oauth`, wenn sie
    über das OpenClaw-Onboarding konfiguriert wird.
    </Note>

  </Tab>
</Tabs>

## Plantypen und Endpunkte

| Plan                              | Region | Authentifizierungsoption   | Endpunkt                                         |
| --------------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (nutzungsbasierte Abrechnung) | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (nutzungsbasierte Abrechnung) | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (Abonnement)          | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (Abonnement)          | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |
| Qwen Portal                       | Global | `qwen-oauth`               | `portal.qwen.ai/v1`                              |

Der Provider wählt den Endpunkt automatisch anhand Ihrer Authentifizierungsoption aus. Kanonische
Optionen verwenden die `qwen-*`-Familie; `modelstudio-*` bleibt ausschließlich für Kompatibilität erhalten.
Sie können dies mit einer benutzerdefinierten `baseUrl` in der Konfiguration überschreiben.

<Tip>
**Schlüssel verwalten:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentation:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Integrierter Katalog

OpenClaw liefert derzeit diesen statischen Qwen-Katalog aus. Der konfigurierte Katalog berücksichtigt
Endpoints: Coding-Plan-Konfigurationen lassen Modelle aus, von denen nur bekannt ist, dass sie auf dem
Standard-Endpoint funktionieren.

| Modellreferenz             | Eingabe     | Kontext   | Hinweise                                           |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | Text, Bild  | 1,000,000 | Standardmodell                                     |
| `qwen/qwen3.6-plus`         | Text, Bild  | 1,000,000 | Bevorzugen Sie Standard-Endpoints, wenn Sie dieses Modell benötigen |
| `qwen/qwen3-max-2026-01-23` | Text        | 262,144   | Qwen-Max-Reihe                                     |
| `qwen/qwen3-coder-next`     | Text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | Text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | Text        | 1,000,000 | Reasoning aktiviert                                |
| `qwen/glm-5`                | Text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | Text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | Text, Bild  | 262,144   | Moonshot AI über Alibaba                           |
| `qwen-oauth/qwen3.5-plus`   | Text, Bild  | 1,000,000 | Qwen-Portal-Standard                               |

<Note>
Die Verfügbarkeit kann je nach Endpoint und Abrechnungsplan weiterhin variieren, selbst wenn ein Modell
im statischen Katalog vorhanden ist.
</Note>

## Thinking-Steuerung

Für Reasoning-fähige Qwen-Cloud-Modelle ordnet der Provider die OpenClaw-
Thinking-Stufen dem übergeordneten DashScope-Anfrageflag `enable_thinking` zu. Deaktiviertes
Thinking sendet `enable_thinking: false`; andere Thinking-Stufen senden
`enable_thinking: true`.

## Multimodale Erweiterungen

Das `qwen`-Plugin stellt außerdem multimodale Fähigkeiten auf den **Standard**-
DashScope-Endpoints bereit (nicht auf den Coding-Plan-Endpoints):

- **Videoverständnis** über `qwen-vl-max-latest`
- **Wan-Videogenerierung** über `wan2.6-t2v` (Standard), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

So verwenden Sie Qwen als Standard-Video-Provider:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
Siehe [Videogenerierung](/de/tools/video-generation) für gemeinsame Tool-Parameter, Provider-Auswahl und Failover-Verhalten.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Image and video understanding">
    Das Qwen-Plugin registriert Medienverständnis für Bilder und Videos
    auf den **Standard**-DashScope-Endpoints (nicht auf den Coding-Plan-Endpoints).

    | Eigenschaft      | Wert                  |
    | ------------- | --------------------- |
    | Modell         | `qwen-vl-max-latest`  |
    | Unterstützte Eingabe | Bilder, Video       |

    Medienverständnis wird automatisch aus der konfigurierten Qwen-Authentifizierung aufgelöst — es ist keine
    zusätzliche Konfiguration erforderlich. Stellen Sie sicher, dass Sie einen Standard-Endpoint (nutzungsbasierte Abrechnung)
    für Unterstützung von Medienverständnis verwenden.

  </Accordion>

  <Accordion title="Qwen 3.6 Plus availability">
    `qwen3.6-plus` ist auf den Standard-Endpoints (nutzungsbasierte Abrechnung) von Model Studio
    verfügbar:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Wenn die Coding-Plan-Endpoints für `qwen3.6-plus` einen Fehler „nicht unterstütztes Modell“ zurückgeben,
    wechseln Sie zu Standard (nutzungsbasierte Abrechnung) statt zum Endpoint-/Schlüsselpaar des Coding-Plans.

    Der statische Qwen-Katalog von OpenClaw bewirbt `qwen3.6-plus` nicht auf Coding-
    Plan-Endpoints, aber explizit konfigurierte `qwen/qwen3.6-plus`-Einträge unter
    `models.providers.qwen.models` werden auf Coding-Plan-`baseUrls` berücksichtigt, sodass Sie
    dieses Modell aktivieren können, falls Aliyun es für Ihr Abonnement freischaltet. Die
    vorgelagerte API entscheidet weiterhin, ob der Aufruf erfolgreich ist.

  </Accordion>

  <Accordion title="Capability plan">
    Das `qwen`-Plugin wird als Vendor-Heimat für die gesamte Qwen-
    Cloud-Oberfläche positioniert, nicht nur für Coding-/Textmodelle.

    - **Text-/Chatmodelle:** über das Plugin verfügbar
    - **Tool-Aufrufe, strukturierte Ausgabe, Thinking:** vom OpenAI-kompatiblen Transport geerbt
    - **Bildgenerierung:** auf der Provider-Plugin-Ebene geplant
    - **Bild-/Videoverständnis:** über das Plugin auf dem Standard-Endpoint verfügbar
    - **Sprache/Audio:** auf der Provider-Plugin-Ebene geplant
    - **Memory-Embeddings/Reranking:** über die Embedding-Adapter-Oberfläche geplant
    - **Videogenerierung:** über das Plugin über die gemeinsame Videogenerierungsfähigkeit verfügbar

  </Accordion>

  <Accordion title="Video generation details">
    Für die Videogenerierung ordnet OpenClaw die konfigurierte Qwen-Region dem passenden
    DashScope-AIGC-Host zu, bevor der Auftrag gesendet wird:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Das bedeutet, dass eine normale `models.providers.qwen.baseUrl`, die entweder auf die
    Coding-Plan- oder Standard-Qwen-Hosts zeigt, die Videogenerierung weiterhin auf dem richtigen
    regionalen DashScope-Video-Endpoint hält.

    Aktuelle Qwen-Limits für die Videogenerierung:

    - Bis zu **1** Ausgabevideo pro Anfrage
    - Bis zu **1** Eingabebild
    - Bis zu **4** Eingabevideos
    - Bis zu **10 Sekunden** Dauer
    - Unterstützt `size`, `aspectRatio`, `resolution`, `audio` und `watermark`
    - Der Referenzbild-/Referenzvideomodus erfordert derzeit **remote http(s)-URLs**. Lokale
      Dateipfade werden im Voraus abgelehnt, da der DashScope-Video-Endpoint für diese Referenzen keine
      hochgeladenen lokalen Puffer akzeptiert.

  </Accordion>

  <Accordion title="Kompatibilität der Streaming-Nutzung">
    Native Model-Studio-Endpunkte weisen Kompatibilität für Streaming-Nutzung über den
    gemeinsamen `openai-completions`-Transport aus. OpenClaw richtet sich jetzt nach den
    Endpunktfunktionen, sodass DashScope-kompatible benutzerdefinierte Provider-IDs, die auf dieselben
    nativen Hosts abzielen, dasselbe Verhalten für Streaming-Nutzung erben, statt
    speziell die integrierte Provider-ID `qwen` zu erfordern.

    Die Kompatibilität der nativen Streaming-Nutzung gilt sowohl für die Coding-Plan-Hosts als auch
    für die Standard-DashScope-kompatiblen Hosts:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regionen multimodaler Endpunkte">
    Multimodale Oberflächen (Videoverständnis und Wan-Videogenerierung) verwenden die
    **Standard**-DashScope-Endpunkte, nicht die Coding-Plan-Endpunkte:

    - Globale/Intl-Standard-Basis-URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China-Standard-Basis-URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Einrichtung von Umgebung und Daemon">
    Wenn der Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass `QWEN_API_KEY` für
    diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/de/providers/alibaba" icon="cloud">
    Legacy-ModelStudio-Provider und Migrationshinweise.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
