---
read_when:
    - Sie möchten Chutes mit OpenClaw verwenden
    - Sie benötigen den Einrichtungsweg für OAuth oder den API-Schlüssel.
    - Sie möchten das Standardmodell, Aliasse oder das Erkennungsverhalten festlegen
summary: Chutes-Einrichtung (OAuth oder API-Schlüssel, Modellerkennung, Aliasse)
title: Chutes
x-i18n:
    generated_at: "2026-07-24T04:37:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 57ea5112105f19028c1a348b4d7fec4cf7ef12de00b1b2de9c152057bf5033a9
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) stellt Open-Source-Modellkataloge über eine
OpenAI-kompatible API bereit. OpenClaw unterstützt sowohl Browser-OAuth als auch die Authentifizierung per API-Schlüssel.

| Eigenschaft      | Wert                                                    |
| ---------------- | ------------------------------------------------------- |
| Provider         | `chutes`                                                |
| Plugin           | offizielles externes Paket (`@openclaw/chutes-provider`) |
| API              | OpenAI-kompatibel                                       |
| Basis-URL        | `https://llm.chutes.ai/v1`                              |
| Authentifizierung | OAuth oder API-Schlüssel (siehe unten)                 |
| Laufzeit-Umgebungsvariablen | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` stellt ein bereits abgerufenes OAuth-Zugriffstoken direkt bereit
(beispielsweise in CI) und umgeht damit den nachfolgend beschriebenen interaktiven Browser-Ablauf.

## Plugin installieren

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Erste Schritte

Beide Wege legen `chutes/zai-org/GLM-5-TEE` als Standardmodell fest und registrieren
den Chutes-Katalog.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth-Onboarding-Ablauf ausführen">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw startet den Browser-Ablauf lokal oder zeigt auf entfernten bzw. monitorlosen
        Hosts eine URL und einen Ablauf zum Einfügen der Weiterleitungsadresse an. OAuth-Tokens werden über die
        Authentifizierungsprofile von OpenClaw automatisch aktualisiert.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API-Schlüssel">
    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen Sie unter
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys) einen Schlüssel.
      </Step>
      <Step title="Onboarding-Ablauf für API-Schlüssel ausführen">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Erkennungsverhalten

Wenn eine Chutes-Authentifizierung verfügbar ist, fragt OpenClaw `GET /v1/models` mit diesen
Anmeldedaten ab und verwendet die erkannten Modelle, die pro
Anmeldedatensatz 5 Minuten zwischengespeichert werden. Bei einem abgelaufenen oder nicht autorisierten Schlüssel (HTTP 401) wiederholt OpenClaw die Anfrage einmal
ohne Anmeldedaten. Wenn die Erkennung weiterhin keine Zeilen zurückgibt, fehlschlägt oder einen
anderen Nicht-2xx-Status zurückgibt, greift OpenClaw auf den mitgelieferten statischen Katalog zurück (sowohl die Erkennung per API-Schlüssel
als auch per OAuth verwendet denselben Ablauf). Wenn die Erkennung beim Start fehlschlägt, wird
automatisch der statische Katalog verwendet.

## Standardaliase

OpenClaw registriert zwei praktische Aliase für den Chutes-Katalog:

| Alias           | Zielmodell                             |
| --------------- | -------------------------------------- |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes-vision` | `chutes/moonshotai/Kimi-K2.5-TEE`      |

## Integrierter Einstiegskatalog

Der mitgelieferte Ausweichkatalog enthält diese fünf derzeit bereitgestellten Modelle:

| Modellreferenz                         |
| -------------------------------------- |
| `chutes/zai-org/GLM-5-TEE`             |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE` |
| `chutes/moonshotai/Kimi-K2.5-TEE`      |
| `chutes/MiniMaxAI/MiniMax-M2.5-TEE`    |
| `chutes/Qwen/Qwen3.5-397B-A17B-TEE`    |

Führen Sie `openclaw models list --all --provider chutes` aus, um die vollständige Liste anzuzeigen.

## Konfigurationsbeispiel

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-5-TEE" },
      models: {
        "chutes/zai-org/GLM-5-TEE": { alias: "Chutes GLM 5" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="OAuth-Anpassungen">
    Passen Sie den OAuth-Ablauf mit optionalen Umgebungsvariablen an:

    | Variable | Zweck |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | OAuth-Client-ID (wird abgefragt, wenn nicht festgelegt) |
    | `CHUTES_CLIENT_SECRET` | OAuth-Client-Geheimnis |
    | `CHUTES_OAUTH_REDIRECT_URI` | Weiterleitungs-URI (Standardwert: `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Durch Leerzeichen getrennte Geltungsbereiche (Standardwert: `openid profile chutes:invoke`) |

    Informationen zu den Anforderungen an Weiterleitungsanwendungen und weitere Hilfe finden Sie in der
    [Chutes-OAuth-Dokumentation](https://chutes.ai/docs/sign-in-with-chutes/overview).

  </Accordion>

  <Accordion title="Hinweise">
    - Chutes-Modelle werden als `chutes/<model-id>` registriert.
    - Chutes meldet während des Streamings keine Token-Nutzung (`supportsUsageInStreaming: false`); nach Abschluss des Streams werden die Nutzungssummen dennoch angezeigt.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider-Regeln, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider-Einstellungen.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes-Dashboard und API-Dokumentation.
  </Card>
  <Card title="Chutes-API-Schlüssel" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes-API-Schlüssel erstellen und verwalten.
  </Card>
</CardGroup>
