---
read_when:
    - Sie möchten Qwen mit OpenClaw verwenden
    - Sie haben ein Alibaba-Cloud-Token-Plan-Abonnement
    - Sie haben zuvor Qwen OAuth verwendet
summary: Qwen Cloud über das zugehörige OpenClaw-Plugin verwenden
title: Qwen
x-i18n:
    generated_at: "2026-07-12T15:54:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 18030a70c024cd5c0713262874f5353bac50576e850f68a61bef4fa73ccf9b9c
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud ist ein offizielles externes Provider-Plugin für OpenClaw mit der kanonischen ID `qwen`. Es ist auf die Endpunkte Qwen Cloud / Alibaba DashScope Standard und Coding Plan ausgerichtet, stellt Token Plan als `qwen-token-plan` bereit, behält `modelstudio` als Kompatibilitätsalias bei, verwaltet unabhängig die von Alibaba dokumentierte benutzerdefinierte Provider-ID `bailian-token-plan` und stellt den Token-Ablauf des Qwen Portal als [`qwen-oauth`](/de/providers/qwen-oauth) bereit.

| Eigenschaft                       | Wert                                       |
| --------------------------------- | ------------------------------------------ |
| Provider                          | `qwen`                                     |
| Token-Plan-Provider               | `qwen-token-plan`                          |
| Portal-Provider                   | [`qwen-oauth`](/de/providers/qwen-oauth)      |
| Bevorzugte Umgebungsvariable      | `QWEN_API_KEY`                             |
| Token-Plan-Umgebungsvariable      | `QWEN_TOKEN_PLAN_API_KEY`                  |
| Ebenfalls akzeptiert (Kompat.)    | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| API-Stil                          | OpenAI-kompatibel                          |

<Tip>
`qwen3.7-plus` und `qwen3.6-plus` funktionieren mit Coding-Plan- und Standard-Endpunkten.
Verwenden Sie für `qwen3.7-max` oder `qwen3.6-flash` einen **Standard-Endpunkt (nutzungsbasierte Abrechnung)**.
</Tip>

## Plugin installieren

`qwen` wird als offizielles externes Plugin ausgeliefert und ist nicht im Kern gebündelt. Installieren Sie es und starten Sie den Gateway neu:

```bash
openclaw plugins install @openclaw/qwen-provider
openclaw gateway restart
```

## Erste Schritte

Wählen Sie Ihren Plantyp und führen Sie die Einrichtungsschritte aus.

<Tabs>
  <Tab title="Coding Plan (Abonnement)">
    **Am besten geeignet für:** abonnementbasierten Zugriff über den Qwen Coding Plan.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel unter [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        Für den **globalen** Endpunkt:

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        Für den Endpunkt in **China**:

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
      <Step title="Verfügbarkeit des Modells überprüfen">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Ältere `modelstudio-*`-IDs für die Authentifizierungsauswahl und
    `modelstudio/...`-Modellreferenzen funktionieren weiterhin als
    Kompatibilitätsaliasnamen, neue Einrichtungsabläufe sollten jedoch die
    kanonischen `qwen-*`-IDs für die Authentifizierungsauswahl und
    `qwen/...`-Modellreferenzen bevorzugen. Wenn Sie einen exakten
    benutzerdefinierten Eintrag `models.providers.modelstudio` mit einem anderen
    `api`-Wert definieren, verwaltet dieser benutzerdefinierte Provider die
    `modelstudio/...`-Referenzen anstelle des Qwen-Kompatibilitätsalias.
    </Note>

  </Tab>

  <Tab title="Standard (nutzungsbasierte Abrechnung)">
    **Am besten geeignet für:** nutzungsbasierten Zugriff über den Standard-Endpunkt von Model Studio, einschließlich `qwen3.7-max` und `qwen3.6-flash`, die im Coding Plan nicht verfügbar sind.

    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen oder kopieren Sie einen API-Schlüssel unter [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys).
      </Step>
      <Step title="Onboarding ausführen">
        Für den **globalen** Endpunkt:

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        Für den Endpunkt in **China**:

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
      <Step title="Verfügbarkeit des Modells überprüfen">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    Ältere `modelstudio-*`-IDs für die Authentifizierungsauswahl und
    `modelstudio/...`-Modellreferenzen funktionieren weiterhin als
    Kompatibilitätsaliasnamen, neue Einrichtungsabläufe sollten jedoch die
    kanonischen `qwen-*`-IDs für die Authentifizierungsauswahl und
    `qwen/...`-Modellreferenzen bevorzugen. Wenn Sie einen exakten
    benutzerdefinierten Eintrag `models.providers.modelstudio` mit einem anderen
    `api`-Wert definieren, verwaltet dieser benutzerdefinierte Provider die
    `modelstudio/...`-Referenzen anstelle des Qwen-Kompatibilitätsalias.
    </Note>

  </Tab>

  <Tab title="Token Plan (Team Edition)">
    **Am besten geeignet für:** guthabenbasierten Team-Abonnementzugriff auf Qwen und unterstützte Modelle von Drittanbietern über Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Dedizierten Schlüssel abrufen">
        Weisen Sie einen Token-Plan-Platz zu und erstellen Sie den zugehörigen dedizierten Schlüssel `sk-sp-...`. Schlüssel für Token Plan, Coding Plan und nutzungsbasierte Abrechnung sind nicht austauschbar. Weitere Informationen finden Sie in der [Übersicht zum globalen Token Plan](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) oder der [Übersicht zum Token Plan für China](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Onboarding ausführen">
        Für den Endpunkt **Global / International** in Singapur:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan
        ```

        Für den Endpunkt in **China** in Peking:

        ```bash
        openclaw onboard --auth-choice qwen-token-plan-cn
        ```
      </Step>
      <Step title="Provider überprüfen">
        ```bash
        openclaw models list --provider qwen-token-plan
        openclaw agent --model qwen-token-plan/qwen3.7-plus --message "Antworten Sie mit: Token Plan bereit"
        ```
      </Step>
    </Steps>

    <Note>
    Alibabas OpenClaw-Leitfaden verwendet `bailian-token-plan` für einen manuell
    konfigurierten benutzerdefinierten Provider. Das Plugin registriert diese ID
    als Kompatibilitätseigentümer, neue Konfigurationen sollten jedoch
    `qwen-token-plan` verwenden. Ein exakter benutzerdefinierter Eintrag
    `models.providers.bailian-token-plan` behält die Kontrolle über den
    konfigurierten Transport und Katalog; er wird niemals mit dem kanonischen
    OpenAI-Katalog zusammengeführt.
    </Note>

    <Warning>
    Verwenden Sie Token Plan nur für interaktive OpenClaw-Sitzungen. Wählen Sie
    ihn nicht für Cron-Aufträge, unbeaufsichtigte Skripte oder
    Anwendungs-Backends aus. Alibaba weist darauf hin, dass eine nicht
    interaktive Nutzung zur Sperrung des Abonnements oder zum Widerruf des
    API-Schlüssels führen kann.
    </Warning>

  </Tab>

  <Tab title="Qwen OAuth / Portal">
    **Am besten geeignet für:** ein Qwen-Portal-Token für `https://portal.qwen.ai/v1`.

    Informationen zum dedizierten Provider und Hinweise zur Migration finden Sie
    unter [Qwen OAuth / Portal](/de/providers/qwen-oauth).

    <Steps>
      <Step title="Portal-Token angeben">
        ```bash
        openclaw onboard --auth-choice qwen-oauth
        ```
      </Step>
      <Step title="Standardmodell festlegen">
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
      <Step title="Verfügbarkeit des Modells überprüfen">
        ```bash
        openclaw models list --provider qwen-oauth
        ```
      </Step>
    </Steps>

    <Note>
    `qwen-oauth` verwendet denselben Namen der Umgebungsvariable `QWEN_API_KEY`
    wie der Qwen-Cloud-Provider, speichert die Authentifizierung bei einer
    Konfiguration über das OpenClaw-Onboarding jedoch unter der Provider-ID
    `qwen-oauth`.
    </Note>

  </Tab>
</Tabs>

## Plantypen und Endpunkte

| Plan                                | Region | Authentifizierungsauswahl   | Endpunkt                                                         |
| ----------------------------------- | ------ | --------------------------- | ---------------------------------------------------------------- |
| Coding Plan (Abonnement)            | China  | `qwen-api-key-cn`           | `coding.dashscope.aliyuncs.com/v1`                               |
| Coding Plan (Abonnement)            | Global | `qwen-api-key`              | `coding-intl.dashscope.aliyuncs.com/v1`                          |
| Qwen Portal                         | Global | `qwen-oauth`                | `portal.qwen.ai/v1`                                              |
| Standard (nutzungsbasierte Abrechnung) | China  | `qwen-standard-api-key-cn`  | `dashscope.aliyuncs.com/compatible-mode/v1`                      |
| Standard (nutzungsbasierte Abrechnung) | Global | `qwen-standard-api-key`     | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                 |
| Token Plan (Team Edition)           | China  | `qwen-token-plan-cn`        | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`     |
| Token Plan (Team Edition)           | Global | `qwen-token-plan`           | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1` |

Der Provider wählt den Endpunkt automatisch anhand Ihrer Authentifizierungsauswahl aus. Kanonische Auswahlmöglichkeiten verwenden die `qwen-*`-Familie; `modelstudio-*` dient nur der Kompatibilität.
Sie können dies in der Konfiguration mit einer benutzerdefinierten `baseUrl` überschreiben.

<Tip>
**Schlüssel verwalten:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentation:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Integrierter Katalog

OpenClaw liefert diesen statischen Qwen-Katalog aus. Der Katalog berücksichtigt den Endpunkt: Coding-Plan-Konfigurationen lassen Modelle aus, die nur mit dem Standard-Endpunkt funktionieren.

| Modellreferenz              | Eingabe     | Kontext   | Hinweise                          |
| --------------------------- | ----------- | --------- | --------------------------------- |
| `qwen/qwen3.5-plus`         | Text, Bild  | 1,000,000 | Standardmodell                    |
| `qwen/qwen3.6-flash`        | Text, Bild  | 1,000,000 | Nur Standard-Endpunkte            |
| `qwen/qwen3.6-plus`         | Text, Bild  | 1,000,000 | Coding Plan + Standard            |
| `qwen/qwen3.7-max`          | Text        | 1,000,000 | Nur Standard-Endpunkte            |
| `qwen/qwen3.7-plus`         | Text, Bild  | 1,000,000 | Coding Plan + Standard            |
| `qwen/qwen3-max-2026-01-23` | Text        | 262,144   | Qwen-Max-Reihe                    |
| `qwen/qwen3-coder-next`     | Text        | 262,144   | Programmierung                    |
| `qwen/qwen3-coder-plus`     | Text        | 1,000,000 | Programmierung                    |
| `qwen/MiniMax-M2.5`         | Text        | 1,000,000 | Schlussfolgerungen aktiviert      |
| `qwen/glm-5`                | Text        | 202,752   | GLM                               |
| `qwen/glm-4.7`              | Text        | 202,752   | GLM                               |
| `qwen/kimi-k2.5`            | Text, Bild  | 262,144   | Moonshot AI über Alibaba          |
| `qwen-oauth/qwen3.5-plus`   | Text, Bild  | 1,000,000 | Qwen-Portal-Standard              |

<Note>
Die Verfügbarkeit kann je nach Endpunkt und Abrechnungsplan weiterhin variieren, selbst wenn ein Modell im statischen Katalog enthalten ist.
</Note>

### Token-Plan-Katalog

Token Plan verwendet eine separate Positivliste mit exakten Zeichenfolgen. Planmodelle, die ausschließlich der Bilderzeugung dienen, sind hier nicht enthalten, da sie andere APIs verwenden.

| Modellreferenz                      | Eingabe     | Kontext   |
| ----------------------------------- | ----------- | --------- |
| `qwen-token-plan/qwen3.7-max`       | Text        | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`      | Text, Bild  | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`      | Text, Bild  | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`     | Text, Bild  | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`   | Text        | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash` | Text        | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`     | Text        | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`    | Text, Bild  | 262,144   |
| `qwen-token-plan/kimi-k2.6`         | Text, Bild  | 262,144   |
| `qwen-token-plan/kimi-k2.5`         | Text, Bild  | 262,144   |
| `qwen-token-plan/glm-5.2`           | Text        | 1,000,000 |
| `qwen-token-plan/glm-5.1`           | Text        | 202,752   |
| `qwen-token-plan/glm-5`             | Text        | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`      | Text        | 196,608   |

## Steuerung des Denkprozesses

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` und `qwen3.6-plus` sind
im integrierten Katalog für Reasoning aktiviert. Bei Reasoning-Modellen der
`qwen`-Familie ordnet der Provider die Thinking-Stufen von OpenClaw dem
Top-Level-Anfrage-Flag `enable_thinking` von DashScope zu: Bei deaktiviertem
Thinking wird `enable_thinking: false` gesendet, bei jeder anderen Stufe
`enable_thinking: true`. Benutzerdefinierte Modelle können ein alternatives
Thinking-Payload für Chat-Templates aktivieren, indem im Modelleintrag
`compat.thinkingFormat: "qwen-chat-template"` festgelegt wird.

Token-Plan-Modelle sind ebenfalls als Reasoning-fähig gekennzeichnet.
`kimi-k2.7-code` und `MiniMax-M2.5` unterstützen ausschließlich Thinking.
Daher lässt OpenClaw Thinking aktiviert, selbst wenn die Sitzung `/think off`
anfordert. DeepSeek V4 ordnet `minimal` bis `high` der Aufwandsstufe `high` des
Dienstes und `xhigh` oder `max` der Stufe `max` zu. GLM 5.2 akzeptiert den
gesamten Bereich von `minimal` bis `max`; GLM 5.1 und GLM 5 akzeptieren Stufen
bis `xhigh`, wobei alle drei standardmäßig `high` verwenden. Andere
Hybridmodelle folgen dem angeforderten Ein-/Aus-Zustand.

## Multimodale Erweiterungen

Das `qwen`-Plugin stellt multimodale Funktionen ausschließlich an den
**Standard**-Endpunkten von DashScope bereit, nicht an den
Coding-Plan-Endpunkten:

- **Bild- und Videoverständnis** über `qwen-vl-max-latest`
- **Wan-Videogenerierung** über `wan2.6-t2v` (Standard), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Die Medienanalyse wird automatisch anhand der konfigurierten
Qwen-Authentifizierung aufgelöst; es ist keine zusätzliche Konfiguration
erforderlich. Stellen Sie sicher, dass Sie einen Standard-Endpunkt
(nutzungsabhängige Abrechnung) verwenden, damit die Medienanalyse funktioniert.

So legen Sie Qwen als Standard-Provider für Videos fest:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Beschränkungen der Videogenerierung: 1 Ausgabevideo pro Anfrage, bis zu
1 Eingabebild (Bild-zu-Video), bis zu 4 Eingabevideos (Video-zu-Video),
maximal 10 Sekunden Dauer. Unterstützt `size`, `aspectRatio`, `resolution`,
`audio` und `watermark`. Referenzbilder und -videos müssen über entfernte
http(s)-URLs bereitgestellt werden; lokale Dateipfade werden vorab abgelehnt,
da der DashScope-Videoendpunkt für diese Referenzen keine hochgeladenen lokalen
Puffer akzeptiert.

<Note>
Unter [Videogenerierung](/de/tools/video-generation) finden Sie gemeinsame Tool-Parameter, die Provider-Auswahl und das Failover-Verhalten.
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Verfügbarkeit von Qwen 3.6 und 3.7">
    `qwen3.7-plus` und `qwen3.6-plus` sind an Coding-Plan- und Standard-Endpunkten verfügbar. `qwen3.7-max` und `qwen3.6-flash` sind nur an Standard-Endpunkten verfügbar. Die Standard-Endpunkte (nutzungsabhängige Abrechnung) sind:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw lässt `qwen3.7-max` und `qwen3.6-flash` in Coding-Plan-Katalogen aus.
    Wenn ein Coding-Plan-Endpunkt für eines der Modelle den Fehler „unsupported model“ zurückgibt,
    wechseln Sie zum entsprechenden Standard-Endpunkt und Schlüssel.

  </Accordion>

  <Accordion title="Regionsrouting für die Videogenerierung">
    OpenClaw ordnet die konfigurierte Qwen-Region dem entsprechenden AIGC-Host
    von DashScope zu, bevor ein Videoauftrag übermittelt wird:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Eine normale `models.providers.qwen.baseUrl`, die auf einen Coding-Plan-
    oder Standard-Qwen-Host verweist, leitet die Videogenerierung weiterhin
    an den entsprechenden regionalen DashScope-Videoendpunkt weiter.

  </Accordion>

  <Accordion title="Kompatibilität der Streaming-Nutzungsdaten">
    Native Qwen-Endpunkte weisen für den gemeinsamen
    `openai-completions`-Transport Kompatibilität mit Streaming-Nutzungsdaten
    aus. Daher übernehmen DashScope-kompatible benutzerdefinierte Provider-IDs,
    die auf dieselben nativen Hosts verweisen, dieses Verhalten, ohne dass
    speziell die integrierte Provider-ID `qwen` erforderlich ist. Dies gilt für
    Coding-Plan-, Standard- und Token-Plan-Endpunkte:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Funktionsplan">
    Das `qwen`-Plugin wird als zentrale Provider-Komponente für den gesamten
    Qwen-Cloud-Funktionsumfang positioniert, nicht nur für Coding-/Textmodelle.

    - **Text-/Chatmodelle:** über das Plugin verfügbar
    - **Tool-Aufrufe, strukturierte Ausgabe, Thinking:** vom OpenAI-kompatiblen Transport übernommen
    - **Bildgenerierung:** auf Ebene des Provider-Plugins geplant
    - **Bild-/Videoverständnis:** über das Plugin am Standard-Endpunkt verfügbar
    - **Sprache/Audio:** auf Ebene des Provider-Plugins geplant
    - **Speicher-Embeddings/Neusortierung:** über die Oberfläche des Embedding-Adapters geplant
    - **Videogenerierung:** über das Plugin und die gemeinsame Videogenerierungsfunktion verfügbar

  </Accordion>

  <Accordion title="Einrichtung von Umgebung und Daemon">
    Wenn das Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie
    sicher, dass `QWEN_API_KEY` oder `QWEN_TOKEN_PLAN_API_KEY` für diesen Prozess
    verfügbar ist (beispielsweise in `~/.openclaw/.env` oder über
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Videogenerierung" href="/de/tools/video-generation" icon="video">
    Gemeinsame Parameter des Video-Tools und Provider-Auswahl.
  </Card>
  <Card title="Alibaba Model Studio" href="/de/providers/alibaba" icon="cloud">
    Mitgelieferter Provider für die Wan-Videogenerierung auf derselben DashScope-Plattform.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Allgemeine Fehlerbehebung und häufig gestellte Fragen.
  </Card>
</CardGroup>
