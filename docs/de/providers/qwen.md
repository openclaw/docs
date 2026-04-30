---
read_when:
    - Sie möchten Qwen mit OpenClaw verwenden
    - Sie haben zuvor Qwen OAuth verwendet
summary: Qwen Cloud über den mit OpenClaw gebündelten qwen-Provider verwenden
title: Qwen
x-i18n:
    generated_at: "2026-04-30T07:11:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 898a7ef1f071c838f3bd877632dd06cf0e6112adfa2833895280f99642df56e6
    source_path: providers/qwen.md
    workflow: 16
---

<Warning>

**Qwen OAuth wurde entfernt.** Die OAuth-Integration der kostenlosen Stufe
(`qwen-portal`), die `portal.qwen.ai`-Endpunkte verwendete, ist nicht mehr verfügbar.
Siehe [Issue #49557](https://github.com/openclaw/openclaw/issues/49557) für
Hintergrundinformationen.

</Warning>

OpenClaw behandelt Qwen jetzt als erstklassigen gebündelten Provider mit der kanonischen ID
`qwen`. Der gebündelte Provider zielt auf die Endpunkte von Qwen Cloud / Alibaba DashScope und
Coding Plan ab und sorgt dafür, dass ältere `modelstudio`-IDs als
Kompatibilitätsalias weiter funktionieren.

- Provider: `qwen`
- Bevorzugte Umgebungsvariable: `QWEN_API_KEY`
- Aus Kompatibilitätsgründen ebenfalls akzeptiert: `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`
- API-Stil: OpenAI-kompatibel

<Tip>
Wenn Sie `qwen3.6-plus` verwenden möchten, bevorzugen Sie den **Standard-Endpunkt (Pay-as-you-go)**.
Die Unterstützung im Coding Plan kann hinter dem öffentlichen Katalog zurückbleiben.
</Tip>

## Erste Schritte

Wählen Sie Ihren Plantyp aus und folgen Sie den Einrichtungsschritten.

<Tabs>
  <Tab title="Coding Plan (Abonnement)">
    **Am besten geeignet für:** abonnementbasierten Zugriff über den Qwen Coding Plan.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel von [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        Für den **globalen** Endpunkt:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Für den **China**-Endpunkt:

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="Standardmodell festlegen">
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
      <Step title="Verfügbarkeit des Modells prüfen">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Ältere `modelstudio-*`-Auth-Choice-IDs und `modelstudio/...`-Modellreferenzen funktionieren weiterhin
    als Kompatibilitätsalias, aber neue Einrichtungsabläufe sollten die kanonischen
    `qwen-*`-Auth-Choice-IDs und `qwen/...`-Modellreferenzen bevorzugen. Wenn Sie einen exakt passenden
    benutzerdefinierten Eintrag `models.providers.modelstudio` mit einem anderen `api`-Wert definieren, besitzt dieser
    benutzerdefinierte Provider die `modelstudio/...`-Referenzen anstelle des Qwen-Kompatibilitätsalias.
    </Note>

  </Tab>

  <Tab title="Standard (Pay-as-you-go)">
    **Am besten geeignet für:** nutzungsabhängigen Zugriff über den Standard-Model-Studio-Endpunkt, einschließlich Modellen wie `qwen3.6-plus`, die im Coding Plan möglicherweise nicht verfügbar sind.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel von [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        Für den **globalen** Endpunkt:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Für den **China**-Endpunkt:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="Standardmodell festlegen">
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
      <Step title="Verfügbarkeit des Modells prüfen">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Ältere `modelstudio-*`-Auth-Choice-IDs und `modelstudio/...`-Modellreferenzen funktionieren weiterhin
    als Kompatibilitätsalias, aber neue Einrichtungsabläufe sollten die kanonischen
    `qwen-*`-Auth-Choice-IDs und `qwen/...`-Modellreferenzen bevorzugen. Wenn Sie einen exakt passenden
    benutzerdefinierten Eintrag `models.providers.modelstudio` mit einem anderen `api`-Wert definieren, besitzt dieser
    benutzerdefinierte Provider die `modelstudio/...`-Referenzen anstelle des Qwen-Kompatibilitätsalias.
    </Note>

  </Tab>
</Tabs>

## Plantypen und Endpunkte

| Plan                       | Region | Auth-Choice                | Endpunkt                                         |
| -------------------------- | ------ | -------------------------- | ------------------------------------------------ |
| Standard (Pay-as-you-go)   | China  | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| Standard (Pay-as-you-go)   | Global | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan (Abonnement) | China  | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan (Abonnement) | Global | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Der Provider wählt den Endpunkt automatisch anhand Ihrer Auth-Choice aus. Kanonische
Optionen verwenden die `qwen-*`-Familie; `modelstudio-*` bleibt nur für Kompatibilität erhalten.
Sie können dies mit einer benutzerdefinierten `baseUrl` in der Konfiguration überschreiben.

<Tip>
**Schlüssel verwalten:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentation:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Integrierter Katalog

OpenClaw liefert derzeit diesen gebündelten Qwen-Katalog aus. Der konfigurierte Katalog ist
endpunktbewusst: Coding-Plan-Konfigurationen lassen Modelle aus, von denen nur bekannt ist, dass sie am
Standard-Endpunkt funktionieren.

| Modellreferenz                   | Eingabe       | Kontext   | Hinweise                                              |
| --------------------------- | ----------- | --------- | -------------------------------------------------- |
| `qwen/qwen3.5-plus`         | Text, Bild | 1,000,000 | Standardmodell                                      |
| `qwen/qwen3.6-plus`         | Text, Bild | 1,000,000 | Bevorzugen Sie Standard-Endpunkte, wenn Sie dieses Modell benötigen |
| `qwen/qwen3-max-2026-01-23` | Text        | 262,144   | Qwen-Max-Reihe                                      |
| `qwen/qwen3-coder-next`     | Text        | 262,144   | Coding                                             |
| `qwen/qwen3-coder-plus`     | Text        | 1,000,000 | Coding                                             |
| `qwen/MiniMax-M2.5`         | Text        | 1,000,000 | Reasoning aktiviert                                  |
| `qwen/glm-5`                | Text        | 202,752   | GLM                                                |
| `qwen/glm-4.7`              | Text        | 202,752   | GLM                                                |
| `qwen/kimi-k2.5`            | Text, Bild | 262,144   | Moonshot AI über Alibaba                            |

<Note>
Die Verfügbarkeit kann weiterhin je nach Endpunkt und Abrechnungsplan variieren, auch wenn ein Modell im
gebündelten Katalog vorhanden ist.
</Note>

## Thinking-Steuerung

Für Qwen-Cloud-Modelle mit Reasoning-Unterstützung ordnet der gebündelte Provider die
Thinking-Stufen von OpenClaw dem DashScope-Anfrageflag `enable_thinking` auf oberster Ebene zu. Deaktiviertes
Thinking sendet `enable_thinking: false`; andere Thinking-Stufen senden
`enable_thinking: true`.

## Multimodale Add-ons

Das `qwen`-Plugin stellt außerdem multimodale Funktionen auf den **Standard**-
DashScope-Endpunkten bereit (nicht auf den Coding-Plan-Endpunkten):

- **Videoverstehen** über `qwen-vl-max-latest`
- **Wan-Videogenerierung** über `wan2.6-t2v` (Standard), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

So verwenden Sie Qwen als Standard-Provider für Video:

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
  <Accordion title="Bild- und Videoverstehen">
    Das gebündelte Qwen-Plugin registriert Medienverstehen für Bilder und Videos
    auf den **Standard**-DashScope-Endpunkten (nicht auf den Coding-Plan-Endpunkten).

    | Eigenschaft      | Wert                 |
    | ------------- | --------------------- |
    | Modell         | `qwen-vl-max-latest`  |
    | Unterstützte Eingabe | Bilder, Video       |

    Medienverstehen wird automatisch aus der konfigurierten Qwen-Authentifizierung aufgelöst — es ist keine
    zusätzliche Konfiguration erforderlich. Stellen Sie sicher, dass Sie einen Standard-Endpunkt (Pay-as-you-go)
    für Unterstützung beim Medienverstehen verwenden.

  </Accordion>

  <Accordion title="Verfügbarkeit von Qwen 3.6 Plus">
    `qwen3.6-plus` ist auf den Standard-Model-Studio-Endpunkten (Pay-as-you-go)
    verfügbar:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    Wenn die Coding-Plan-Endpunkte für `qwen3.6-plus` einen Fehler wegen eines „nicht unterstützten Modells“
    zurückgeben, wechseln Sie zu Standard (Pay-as-you-go) statt zum Endpunkt-/Schlüsselpaar des Coding Plan.

    Der gebündelte Qwen-Katalog von OpenClaw bewirbt `qwen3.6-plus` nicht auf Coding-
    Plan-Endpunkten, aber explizit konfigurierte `qwen/qwen3.6-plus`-Einträge unter
    `models.providers.qwen.models` werden auf Coding-Plan-BaseUrls berücksichtigt, sodass Sie
    dieses Modell aktivieren können, falls Aliyun es für Ihr Abonnement freischaltet. Die
    Upstream-API entscheidet weiterhin, ob der Aufruf erfolgreich ist.

  </Accordion>

  <Accordion title="Fähigkeitsplan">
    Das `qwen`-Plugin wird als Hersteller-Home für die gesamte Qwen-
    Cloud-Oberfläche positioniert, nicht nur für Coding-/Textmodelle.

    - **Text-/Chatmodelle:** jetzt gebündelt
    - **Tool-Aufrufe, strukturierte Ausgabe, Thinking:** vom OpenAI-kompatiblen Transport geerbt
    - **Bildgenerierung:** auf der Provider-Plugin-Ebene geplant
    - **Bild-/Videoverstehen:** jetzt auf dem Standard-Endpunkt gebündelt
    - **Sprache/Audio:** auf der Provider-Plugin-Ebene geplant
    - **Memory Embeddings/Reranking:** über die Embedding-Adapter-Oberfläche geplant
    - **Videogenerierung:** jetzt über die gemeinsame Videogenerierungsfunktion gebündelt

  </Accordion>

  <Accordion title="Details zur Videogenerierung">
    Für die Videogenerierung ordnet OpenClaw die konfigurierte Qwen-Region dem passenden
    DashScope-AIGC-Host zu, bevor der Auftrag übermittelt wird:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Das bedeutet, dass eine normale `models.providers.qwen.baseUrl`, die entweder auf die
    Coding-Plan- oder Standard-Qwen-Hosts zeigt, die Videogenerierung weiterhin auf dem korrekten
    regionalen DashScope-Videoendpunkt hält.

    Aktuelle gebündelte Limits für Qwen-Videogenerierung:

    - Bis zu **1** Ausgabevideo pro Anfrage
    - Bis zu **1** Eingabebild
    - Bis zu **4** Eingabevideos
    - Bis zu **10 Sekunden** Dauer
    - Unterstützt `size`, `aspectRatio`, `resolution`, `audio` und `watermark`
    - Der Referenzbild-/Referenzvideomodus erfordert derzeit **entfernte http(s)-URLs**. Lokale
      Dateipfade werden frühzeitig abgelehnt, weil der DashScope-Videoendpunkt keine
      hochgeladenen lokalen Buffer für diese Referenzen akzeptiert.

  </Accordion>

  <Accordion title="Kompatibilität der Streaming-Nutzung">
    Native Model-Studio-Endpunkte geben die Kompatibilität der Streaming-Nutzung für den
    gemeinsamen `openai-completions`-Transport an. OpenClaw leitet dies jetzt aus den
    Endpunktfähigkeiten ab, sodass DashScope-kompatible benutzerdefinierte Provider-IDs, die auf dieselben
    nativen Hosts zielen, dasselbe Streaming-Nutzungsverhalten erben, anstatt
    speziell die integrierte `qwen`-Provider-ID zu benötigen.

    Die Kompatibilität der nativen Streaming-Nutzung gilt sowohl für die Coding-Plan-Hosts als auch
    für die Standard-DashScope-kompatiblen Hosts:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Regionen für multimodale Endpunkte">
    Multimodale Oberflächen (Videoverstehen und Wan-Videogenerierung) verwenden die
    **Standard**-DashScope-Endpunkte, nicht die Coding-Plan-Endpunkte:

    - Globale/Intl-Standard-Basis-URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - China-Standard-Basis-URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Umgebungs- und Daemon-Einrichtung">
    Wenn der Gateway als Daemon ausgeführt wird (launchd/systemd), stellen Sie sicher, dass `QWEN_API_KEY` für
    diesen Prozess verfügbar ist (zum Beispiel in `~/.openclaw/.env` oder über
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter für Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="Alibaba (ModelStudio)" href="/de/providers/alibaba" icon="cloud">
    Legacy-ModelStudio-Provider und Migrationshinweise.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und FAQ.
  </Card>
</CardGroup>
