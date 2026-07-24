---
read_when:
    - Sie möchten Qwen mit OpenClaw verwenden
    - Sie verfügen über ein Alibaba-Cloud-Token-Plan-Abonnement
summary: Qwen Cloud über das zugehörige OpenClaw-Plugin verwenden
title: Qwen
x-i18n:
    generated_at: "2026-07-24T04:53:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74f94a35631dcdf8c9afc12e86d7a9d6b51a359411ba36f8820f8b1e7c03a27a
    source_path: providers/qwen.md
    workflow: 16
---

Qwen Cloud ist ein offizielles externes OpenClaw-Provider-Plugin mit der kanonischen ID `qwen`. Es ist für die Endpunkte Qwen Cloud / Alibaba DashScope Standard und Coding Plan ausgelegt, stellt Token Plan als `qwen-token-plan` bereit, behält `modelstudio` als Kompatibilitätsalias bei und verwaltet unabhängig Alibabas dokumentierte benutzerdefinierte Provider-ID `bailian-token-plan`.

| Eigenschaft                  | Wert                                       |
| ---------------------------- | ------------------------------------------ |
| Provider                     | `qwen`                         |
| Token-Plan-Provider          | `qwen-token-plan`                         |
| Bevorzugte Umgebungsvariable | `QWEN_API_KEY`                         |
| Token-Plan-Umgebungsvariable | `QWEN_TOKEN_PLAN_API_KEY`                         |
| Ebenfalls akzeptiert (Kompatibilität) | `MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY` |
| API-Stil                     | OpenAI-kompatibel                          |

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

Wählen Sie Ihren Plantyp und befolgen Sie die Einrichtungsschritte.

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
    Veraltete Auth-Choice-IDs `modelstudio-*` und Modellreferenzen `modelstudio/...`
    funktionieren weiterhin als Kompatibilitätsaliasse, neue Einrichtungsabläufe sollten jedoch
    die kanonischen Auth-Choice-IDs `qwen-*` und Modellreferenzen
    `qwen/...` bevorzugen. Wenn Sie einen exakten benutzerdefinierten Eintrag
    `models.providers.modelstudio` mit einem anderen Wert für `api` definieren, verwaltet
    dieser benutzerdefinierte Provider die Referenzen `modelstudio/...` anstelle des
    Qwen-Kompatibilitätsalias.
    </Note>

  </Tab>

  <Tab title="Standard (nutzungsbasierte Abrechnung)">
    **Am besten geeignet für:** nutzungsbasierten Zugriff über den Standard-Model-Studio-Endpunkt, einschließlich `qwen3.7-max` und `qwen3.6-flash`, die im Coding Plan nicht verfügbar sind.

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
    Veraltete Auth-Choice-IDs `modelstudio-*` und Modellreferenzen `modelstudio/...`
    funktionieren weiterhin als Kompatibilitätsaliasse, neue Einrichtungsabläufe sollten jedoch
    die kanonischen Auth-Choice-IDs `qwen-*` und Modellreferenzen
    `qwen/...` bevorzugen. Wenn Sie einen exakten benutzerdefinierten Eintrag
    `models.providers.modelstudio` mit einem anderen Wert für `api` definieren, verwaltet
    dieser benutzerdefinierte Provider die Referenzen `modelstudio/...` anstelle des
    Qwen-Kompatibilitätsalias.
    </Note>

  </Tab>

  <Tab title="Token Plan (Team Edition)">
    **Am besten geeignet für:** guthabenbasierten Team-Abonnementzugriff auf Qwen und unterstützte Drittanbietermodelle über Alibaba Cloud Model Studio.

    <Steps>
      <Step title="Dedizierten Schlüssel abrufen">
        Weisen Sie einen Token-Plan-Platz zu und erstellen Sie den zugehörigen dedizierten Schlüssel `sk-sp-...`. Schlüssel für Token Plan, Coding Plan und nutzungsbasierte Abrechnung sind nicht austauschbar. Weitere Informationen finden Sie in der [Übersicht zum globalen Token Plan](https://www.alibabacloud.com/help/en/model-studio/token-plan-overview) oder der [Übersicht zum Token Plan für China](https://help.aliyun.com/zh/model-studio/token-plan-overview).
      </Step>
      <Step title="Onboarding ausführen">
        Für den **globalen/internationalen** Endpunkt in Singapur:

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
    Alibabas OpenClaw-Leitfaden verwendet `bailian-token-plan` für einen manuellen
    benutzerdefinierten Provider. Das Plugin registriert diese ID als Kompatibilitätsinhaber,
    neue Konfigurationen sollten jedoch `qwen-token-plan` verwenden. Ein exakter
    benutzerdefinierter Eintrag `models.providers.bailian-token-plan` behält die Zuständigkeit für den
    konfigurierten Transport und Katalog; er wird niemals mit dem kanonischen OpenAI-Katalog
    zusammengeführt.
    </Note>

    <Warning>
    Verwenden Sie Token Plan nur für interaktive OpenClaw-Sitzungen. Wählen Sie ihn nicht für
    Cron-Aufträge, unbeaufsichtigte Skripte oder Anwendungs-Backends aus. Alibaba gibt an, dass
    eine nicht interaktive Nutzung zur Sperrung des Abonnements oder zum Widerruf des
    API-Schlüssels führen kann.
    </Warning>

  </Tab>

</Tabs>

## Plantypen und Endpunkte

| Plan                                 | Region | Authentifizierungsauswahl | Endpunkt                                                         |
| ------------------------------------ | ------ | -------------------------- | ---------------------------------------------------------------- |
| Coding Plan (Abonnement)             | China  | `qwen-api-key-cn`         | `coding.dashscope.aliyuncs.com/v1`                                               |
| Coding Plan (Abonnement)             | Global | `qwen-api-key`         | `coding-intl.dashscope.aliyuncs.com/v1`                                               |
| Standard (nutzungsbasierte Abrechnung) | China  | `qwen-standard-api-key-cn`       | `dashscope.aliyuncs.com/compatible-mode/v1`                                               |
| Standard (nutzungsbasierte Abrechnung) | Global | `qwen-standard-api-key`      | `dashscope-intl.aliyuncs.com/compatible-mode/v1`                                               |
| Token Plan (Team Edition)            | China  | `qwen-token-plan-cn`         | `token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`                                               |
| Token Plan (Team Edition)            | Global | `qwen-token-plan`         | `token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`                                               |

Der Provider wählt den Endpunkt anhand Ihrer Authentifizierungsauswahl automatisch aus. Kanonische
Auswahlmöglichkeiten verwenden die Familie `qwen-*`; `modelstudio-*` bleibt ausschließlich
der Kompatibilität vorbehalten. Überschreiben Sie dies mit einem benutzerdefinierten `baseUrl`
in der Konfiguration.

<Tip>
**Schlüssel verwalten:** [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**Dokumentation:** [docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## Integrierter Katalog

OpenClaw liefert diesen statischen Qwen-Katalog mit. Der Katalog berücksichtigt den Endpunkt:
Coding-Plan-Konfigurationen lassen Modelle aus, die nur am Standard-Endpunkt funktionieren.

| Modellreferenz              | Eingabe     | Kontext   | Hinweise                        |
| --------------------------- | ----------- | --------- | ------------------------------- |
| `qwen/qwen3.5-plus`          | Text, Bild  | 1,000,000 | Standardmodell                  |
| `qwen/qwen3.6-flash`          | Text, Bild  | 1,000,000 | Nur Standard-Endpunkte          |
| `qwen/qwen3.6-plus`          | Text, Bild  | 1,000,000 | Coding Plan + Standard          |
| `qwen/qwen3.7-max`          | Text        | 1,000,000 | Nur Standard-Endpunkte          |
| `qwen/qwen3.7-plus`          | Text, Bild  | 1,000,000 | Coding Plan + Standard          |
| `qwen/qwen3-max-2026-01-23`          | Text        | 262,144   | Qwen-Max-Reihe                  |
| `qwen/qwen3-coder-next`          | Text        | 262,144   | Programmierung                  |
| `qwen/qwen3-coder-plus`          | Text        | 1,000,000 | Programmierung                  |
| `qwen/MiniMax-M2.5`          | Text        | 1,000,000 | Schlussfolgerung aktiviert      |
| `qwen/glm-5`          | Text        | 202,752   | GLM                             |
| `qwen/glm-4.7`          | Text        | 202,752   | GLM                             |
| `qwen/kimi-k2.5`          | Text, Bild  | 262,144   | Moonshot AI über Alibaba        |

<Note>
Die Verfügbarkeit kann je nach Endpunkt und Abrechnungsplan weiterhin variieren, selbst wenn ein
Modell im statischen Katalog vorhanden ist.
</Note>

### Token-Plan-Katalog

Token Plan verwendet eine separate Positivliste mit exakter Zeichenfolgenübereinstimmung. Planmodelle,
die ausschließlich Bilder generieren, sind hier nicht enthalten, da sie andere APIs verwenden.

| Modellreferenz              | Eingabe     | Kontext   |
| --------------------------- | ----------- | --------- |
| `qwen-token-plan/qwen3.7-max`          | Text        | 1,000,000 |
| `qwen-token-plan/qwen3.7-plus`          | Text, Bild  | 1,000,000 |
| `qwen-token-plan/qwen3.6-plus`          | Text, Bild  | 1,000,000 |
| `qwen-token-plan/qwen3.6-flash`          | Text, Bild  | 1,000,000 |
| `qwen-token-plan/deepseek-v4-pro`          | Text        | 1,000,000 |
| `qwen-token-plan/deepseek-v4-flash`          | Text        | 1,000,000 |
| `qwen-token-plan/deepseek-v3.2`          | Text        | 131,072   |
| `qwen-token-plan/kimi-k2.7-code`          | Text, Bild  | 262,144   |
| `qwen-token-plan/kimi-k2.6`          | Text, Bild  | 262,144   |
| `qwen-token-plan/kimi-k2.5`          | Text, Bild  | 262,144   |
| `qwen-token-plan/glm-5.2`          | Text        | 1,000,000 |
| `qwen-token-plan/glm-5.1`          | Text        | 202,752   |
| `qwen-token-plan/glm-5`          | Text        | 202,752   |
| `qwen-token-plan/MiniMax-M2.5`          | Text        | 196,608   |

## Steuerung der Schlussfolgerung

`qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-flash` und `qwen3.6-plus`
sind im integrierten Katalog für Schlussfolgerungen aktiviert. Bei Schlussfolgerungsmodellen der
Familie `qwen` ordnet der Provider die OpenClaw-Denkstufen dem
DashScope-Anforderungsflag `enable_thinking` auf oberster Ebene zu: Bei deaktiviertem Denken
wird `enable_thinking: false` gesendet, bei jeder anderen Stufe `enable_thinking: true`.
Benutzerdefinierte Modelle können eine alternative Denknutzlast für Chatvorlagen aktivieren,
indem im Modelleintrag `compat.thinkingFormat: "qwen-chat-template"` festgelegt wird.

Token-Plan-Modelle sind ebenfalls als schlussfolgerungsfähig gekennzeichnet. `kimi-k2.7-code` und
`MiniMax-M2.5` unterstützen ausschließlich Denken, daher lässt OpenClaw das Denken aktiviert,
selbst wenn die Sitzung `/think off` anfordert. DeepSeek V4 ordnet `minimal` bis
`high` dem Aufwand `high` des Dienstes und `xhigh` oder
`max` dem Wert `max` zu. GLM 5.2 akzeptiert den gesamten Bereich von
`minimal` bis `max`; GLM 5.1 und GLM 5 akzeptieren Werte bis
`xhigh`, und alle drei verwenden standardmäßig `high`. Andere Hybridmodelle
folgen dem angeforderten Ein-/Aus-Zustand.

## Multimodale Erweiterungen

Das Plugin `qwen` stellt multimodale Funktionen ausschließlich an den
**Standard**-DashScope-Endpunkten bereit, nicht an den Coding-Plan-Endpunkten:

- **Bild- und Videoverständnis** über `qwen3.6-plus`
- **Wan-Videogenerierung** über `wan2.6-t2v` (Standard), `wan2.6-i2v`, `wan2.6-r2v`, `wan2.6-r2v-flash`, `wan2.7-r2v`

Das Medienverständnis wird automatisch anhand der konfigurierten Qwen-Authentifizierung aufgelöst;
es ist keine zusätzliche Konfiguration erforderlich. Stellen Sie sicher, dass Sie einen
Standard-Endpunkt (nutzungsbasierte Abrechnung) verwenden, damit das Medienverständnis funktioniert.

So legen Sie Qwen als Standard-Video-Provider fest:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

Beschränkungen für die Videogenerierung: 1 Ausgabevideo pro Anfrage, bis zu 1 Eingabebild
(Bild-zu-Video), bis zu 4 Eingabevideos (Video-zu-Video), maximal 10 Sekunden
Dauer. Unterstützt `size`, `aspectRatio`, `resolution`, `audio` und
`watermark`. Eingaben mit Referenzbildern/-videos erfordern entfernte http(s)-URLs; lokale
Dateipfade werden vorab abgelehnt, da der DashScope-Videoendpunkt keine
hochgeladenen lokalen Puffer für diese Referenzen akzeptiert.

<Note>
Informationen zu gemeinsamen Tool-Parametern, zur Provider-Auswahl und zum Failover-Verhalten finden Sie unter [Videogenerierung](/de/tools/video-generation).
</Note>

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Verfügbarkeit von Qwen 3.6 und 3.7">
    `qwen3.7-plus` und `qwen3.6-plus` sind über Coding-Plan- und Standard-Endpunkte verfügbar. `qwen3.7-max` und `qwen3.6-flash` sind ausschließlich über Standard verfügbar. Die Standard-Endpunkte (nutzungsbasierte Abrechnung) sind:

    - China: `dashscope.aliyuncs.com/compatible-mode/v1`
    - Global: `dashscope-intl.aliyuncs.com/compatible-mode/v1`

    OpenClaw lässt `qwen3.7-max` und `qwen3.6-flash` in Coding-Plan-Katalogen aus.
    Wenn ein Coding-Plan-Endpunkt für eines der Modelle den Fehler „unsupported model“ zurückgibt,
    wechseln Sie zum entsprechenden Standard-Endpunkt und Schlüssel.

  </Accordion>

  <Accordion title="Regionale Weiterleitung der Videogenerierung">
    OpenClaw ordnet die konfigurierte Qwen-Region dem entsprechenden DashScope-AIGC-Host zu,
    bevor ein Videoauftrag übermittelt wird:

    - Global/Intl: `https://dashscope-intl.aliyuncs.com`
    - China: `https://dashscope.aliyuncs.com`

    Ein normaler `models.providers.qwen.baseUrl`, der entweder auf die Coding-Plan-
    oder die Standard-Qwen-Hosts verweist, leitet die Videogenerierung weiterhin an den entsprechenden
    regionalen DashScope-Videoendpunkt weiter.

  </Accordion>

  <Accordion title="Kompatibilität der Streaming-Nutzungsdaten">
    Native Qwen-Endpunkte geben die Kompatibilität mit Streaming-Nutzungsdaten für den gemeinsamen
    `openai-completions`-Transport an. Daher übernehmen DashScope-kompatible benutzerdefinierte Provider-IDs,
    die dieselben nativen Hosts ansprechen, dasselbe Verhalten, ohne dass speziell
    die integrierte Provider-ID `qwen` erforderlich ist. Dies gilt für Coding-Plan-,
    Standard- und Token-Plan-Endpunkte:

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`
    - `https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="Funktionsplan">
    Das Plugin `qwen` wird als zentrale Anlaufstelle des Anbieters für den gesamten Qwen-
    Cloud-Funktionsumfang positioniert, nicht nur für Coding-/Textmodelle.

    - **Text-/Chatmodelle:** über das Plugin verfügbar
    - **Tool-Aufrufe, strukturierte Ausgabe, Denkprozess:** vom OpenAI-kompatiblen Transport übernommen
    - **Bildgenerierung:** auf der Provider-Plugin-Ebene geplant
    - **Bild-/Videoverständnis:** über das Plugin am Standard-Endpunkt verfügbar
    - **Sprache/Audio:** auf der Provider-Plugin-Ebene geplant
    - **Speicher-Embeddings/Neusortierung:** über die Embedding-Adapter-Schnittstelle geplant
    - **Videogenerierung:** über das Plugin und die gemeinsame Videogenerierungsfunktion verfügbar

  </Accordion>

  <Accordion title="Umgebungs- und Daemon-Einrichtung">
    Wenn das Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass `QWEN_API_KEY`
    oder `QWEN_TOKEN_PLAN_API_KEY` für diesen Prozess verfügbar ist (beispielsweise in
    `~/.openclaw/.env` oder über `env.shellEnv`).
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
