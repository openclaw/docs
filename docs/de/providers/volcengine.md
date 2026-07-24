---
read_when:
    - Sie möchten Volcano-Engine- oder Doubao-Modelle mit OpenClaw verwenden
    - Sie müssen den Volcengine-API-Schlüssel einrichten
    - Sie möchten Volcengine Speech für Text-to-Speech verwenden
summary: Einrichtung von Volcano Engine (Doubao-Modelle, Coding-Endpunkte und Seed Speech TTS)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-07-24T04:04:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 89538772b704499547ecf0274c5bb9bf8f68cc267dc7f484d3236921a9c89681
    source_path: providers/volcengine.md
    workflow: 16
---

Der Volcengine-Provider ermöglicht den Zugriff auf Doubao-Modelle und auf Volcano Engine gehostete Modelle von Drittanbietern, mit separaten Endpunkten für allgemeine und Coding-Workloads. Dasselbe mitgelieferte Plugin registriert außerdem Volcengine Speech als TTS-Provider.

| Detail              | Wert                                                       |
| ------------------- | ---------------------------------------------------------- |
| Provider            | `volcengine` (allgemein + TTS), `volcengine-plan` (Coding)   |
| Modellauthentifizierung | `VOLCANO_ENGINE_API_KEY`                                   |
| TTS-Authentifizierung   | `VOLCENGINE_TTS_API_KEY` oder `BYTEPLUS_SEED_SPEECH_API_KEY` |
| API                 | OpenAI-kompatible Modelle, BytePlus Seed Speech TTS        |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel festlegen">
    Führen Sie das interaktive Onboarding aus:

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Dadurch werden sowohl der allgemeine Provider (`volcengine`) als auch der Coding-Provider (`volcengine-plan`) mit einem einzigen API-Schlüssel registriert.

  </Step>
  <Step title="Standardmodell festlegen">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Verfügbarkeit des Modells überprüfen">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Übergeben Sie den Schlüssel für eine nicht interaktive Einrichtung (CI, Skripting) direkt:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Provider und Endpunkte

| Provider          | Endpunkt                                  | Anwendungsfall       |
| ----------------- | ----------------------------------------- | -------------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Allgemeine Modelle   |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Coding-Modelle       |

<Note>
Beide Provider werden mit einem einzigen API-Schlüssel konfiguriert. Die Einrichtung registriert beide automatisch, und die Modellauswahl des Coding-Providers verwendet ebenfalls die Authentifizierung des allgemeinen Providers (`volcengine-plan` ist ein Authentifizierungsalias von `volcengine`).
</Note>

## Integrierter Katalog

<Tabs>
  <Tab title="Allgemein (volcengine)">
    | Modellreferenz                               | Name                            | Eingabe     | Kontext |
    | -------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | Text, Bild  | 128,000 |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | Text, Bild  | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | Text, Bild  | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | Text, Bild  | 200,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | Text, Bild  | 256,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Modellreferenz                                    | Name                     | Eingabe | Kontext |
    | ------------------------------------------------- | ------------------------ | ------- | ------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | Text    | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | Text    | 256,000 |
  </Tab>
</Tabs>

Beide Kataloge sind statisch (kein `/models`-Ermittlungsaufruf) und unterstützen OpenAI-kompatible Nutzungsabrechnung für Streaming. Tool-Schemas für beide Provider entfernen automatisch die Schlüsselwörter `minLength`, `maxLength`, `minItems`, `maxItems`, `minContains` und `maxContains`, da die Tool-Call-API von Volcengine sie ablehnt.

## Text-to-Speech

Volcengine TTS verwendet die BytePlus Seed Speech HTTP API (`voice.ap-southeast-1.bytepluses.com`) und wird getrennt vom API-Schlüssel der OpenAI-kompatiblen Doubao-Modell-API konfiguriert. Öffnen Sie in der BytePlus-Konsole Seed Speech > Settings > API Keys, kopieren Sie den API-Schlüssel und legen Sie anschließend Folgendes fest:

```bash
export VOLCENGINE_TTS_API_KEY="byteplus_seed_speech_api_key"
export VOLCENGINE_TTS_RESOURCE_ID="seed-tts-1.0"
```

Aktivieren Sie es anschließend in `openclaw.json`:

```json5
{
  tts: {
    auto: "always",
    provider: "volcengine",
    providers: {
      volcengine: {
        apiKey: "byteplus_seed_speech_api_key",
        voice: "en_female_anna_mars_bigtts",
        speedRatio: 1.0,
      },
    },
  },
}
```

Verfügbare Felder unter `tts.providers.volcengine`: `apiKey`, `voice`, `speedRatio` (0.2-3.0), `emotion`, `cluster`, `resourceId`, `appKey` und `baseUrl`. `!emotion=<value>` funktioniert ebenfalls als Inline-Stimmanweisung, wenn Überschreibungen der Stimmeinstellung zulässig sind.

Für Ziele mit Sprachnachrichten fordert OpenClaw das native Format `ogg_opus` des Providers an. Für normale Audioanhänge fordert es `mp3` an. Die Provider-Aliasse `bytedance` und `doubao` werden ebenfalls diesem Sprach-Provider zugeordnet.

Die Standardressourcen-ID lautet `seed-tts-1.0`; dies ist die Berechtigung, die BytePlus neu erstellten Seed-Speech-API-Schlüsseln standardmäßig gewährt. Wenn Ihr Projekt über eine TTS-2.0-Berechtigung verfügt, legen Sie `VOLCENGINE_TTS_RESOURCE_ID=seed-tts-2.0` fest.

<Warning>
`VOLCANO_ENGINE_API_KEY` ist für die ModelArk-/Doubao-Modellendpunkte vorgesehen und kein Seed-Speech-API-Schlüssel. TTS benötigt einen Seed-Speech-API-Schlüssel aus der BytePlus Speech Console oder ein Legacy-Paar aus AppID und Token der Speech Console.
</Warning>

Die Legacy-Authentifizierung mit AppID und Token wird für ältere Speech-Console-Anwendungen weiterhin unterstützt:

```bash
export VOLCENGINE_TTS_APPID="speech_app_id"
export VOLCENGINE_TTS_TOKEN="speech_access_token"
export VOLCENGINE_TTS_CLUSTER="volcano_tts"
```

Weitere optionale TTS-Umgebungsvariablen: `VOLCENGINE_TTS_VOICE`, `VOLCENGINE_TTS_APP_KEY` und `VOLCENGINE_TTS_BASE_URL` überschreiben, sofern gesetzt, die entsprechenden `tts.providers.volcengine`-Konfigurationsfelder.

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Standardmodell nach dem Onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` legt `volcengine-plan/ark-code-latest` als Standardmodell fest und registriert zugleich den allgemeinen Katalog `volcengine`.
  </Accordion>

  <Accordion title="Fallback-Verhalten der Modellauswahl">
    Bei der Modellauswahl während des Onboardings oder der Konfiguration bevorzugt die Volcengine-Authentifizierungsoption sowohl die Zeilen `volcengine/*` als auch `volcengine-plan/*`. Wenn diese Modelle noch nicht geladen sind, greift OpenClaw auf den ungefilterten Katalog zurück, statt eine leere, auf den Provider beschränkte Auswahl anzuzeigen.
  </Accordion>

  <Accordion title="Umgebungsvariablen für Daemon-Prozesse">
    Wenn das Gateway als Daemon (launchd/systemd) ausgeführt wird, stellen Sie sicher, dass Modell- und TTS-Umgebungsvariablen wie `VOLCANO_ENGINE_API_KEY`, `VOLCENGINE_TTS_API_KEY`, `BYTEPLUS_SEED_SPEECH_API_KEY`, `VOLCENGINE_TTS_APPID` und `VOLCENGINE_TTS_TOKEN` für diesen Prozess verfügbar sind (beispielsweise in `~/.openclaw/.env` oder über `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Wenn OpenClaw als Hintergrunddienst ausgeführt wird, werden die in Ihrer interaktiven Shell festgelegten Umgebungsvariablen nicht automatisch übernommen. Beachten Sie den obigen Hinweis zum Daemon.
</Warning>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Auswahl von Providern, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz für Agenten, Modelle und Provider.
  </Card>
  <Card title="Fehlerbehebung" href="/de/help/troubleshooting" icon="wrench">
    Häufige Probleme und Schritte zur Fehlerdiagnose.
  </Card>
  <Card title="FAQ" href="/de/help/faq" icon="circle-question">
    Häufig gestellte Fragen zur Einrichtung von OpenClaw.
  </Card>
</CardGroup>
