---
read_when:
    - Sie möchten Chutes mit OpenClaw verwenden
    - Sie benötigen den Einrichtungsweg für OAuth oder API-Schlüssel
    - Sie möchten das Standardmodell, Aliase oder das Ermittlungsverhalten festlegen
summary: Chutes-Einrichtung (OAuth oder API-Schlüssel, Modellerkennung, Aliasse)
title: Chutes
x-i18n:
    generated_at: "2026-07-12T15:42:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) stellt Kataloge mit Open-Source-Modellen über eine
OpenAI-kompatible API bereit. OpenClaw unterstützt sowohl Browser-OAuth als auch die Authentifizierung per API-Schlüssel.

| Eigenschaft      | Wert                                                    |
| ---------------- | ------------------------------------------------------- |
| Provider         | `chutes`                                                |
| Plugin           | offizielles externes Paket (`@openclaw/chutes-provider`) |
| API              | OpenAI-kompatibel                                       |
| Basis-URL        | `https://llm.chutes.ai/v1`                              |
| Authentifizierung | OAuth oder API-Schlüssel (siehe unten)                 |
| Laufzeit-Umgebungsvariablen | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`        |

`CHUTES_OAUTH_TOKEN` stellt ein bereits abgerufenes OAuth-Zugriffstoken direkt
bereit (beispielsweise in CI) und umgeht damit den nachfolgend beschriebenen interaktiven Browser-Ablauf.

## Plugin installieren

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Erste Schritte

Beide Wege legen `chutes/zai-org/GLM-4.7-TEE` als Standardmodell fest und registrieren
den Chutes-Katalog.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth-Onboarding-Ablauf ausführen">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw startet den Browser-Ablauf lokal oder zeigt auf entfernten/headless Hosts
        eine URL sowie einen Ablauf zum Einfügen der Weiterleitungs-URL an. OAuth-Tokens werden über die
        Authentifizierungsprofile von OpenClaw automatisch aktualisiert.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API-Schlüssel">
    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen Sie einen Schlüssel unter
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
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

Wenn eine Chutes-Authentifizierung verfügbar ist, fragt OpenClaw mit diesen
Anmeldedaten `GET /v1/models` ab und verwendet die erkannten Modelle, die pro
Anmeldedatensatz 5 Minuten lang zwischengespeichert werden. Bei einem abgelaufenen/nicht autorisierten Schlüssel (HTTP 401) versucht OpenClaw die Anfrage einmal
ohne Anmeldedaten erneut. Wenn die Erkennung weiterhin keine Zeilen zurückgibt, fehlschlägt oder einen
anderen Nicht-2xx-Status zurückgibt, greift OpenClaw auf den mitgelieferten statischen Katalog zurück (sowohl die Erkennung
per API-Schlüssel als auch per OAuth verwendet denselben Pfad). Falls die Erkennung beim Start fehlschlägt, wird
automatisch der statische Katalog verwendet.

## Standardaliase

OpenClaw registriert drei praktische Aliase für den Chutes-Katalog:

| Alias           | Zielmodell                                            |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Integrierter Einstiegskatalog

Der mitgelieferte Ausweichkatalog enthält 47 Modelle. Eine repräsentative Auswahl aktueller Referenzen:

| Modellreferenz                                        |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

Führen Sie `openclaw models list --all --provider chutes` aus, um die vollständige Liste anzuzeigen.

## Konfigurationsbeispiel

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
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
    | `CHUTES_CLIENT_SECRET` | OAuth-Client-Secret |
    | `CHUTES_OAUTH_REDIRECT_URI` | Weiterleitungs-URI (Standardwert `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Durch Leerzeichen getrennte Bereiche (Standardwert `openid profile chutes:invoke`) |

    Informationen zu den Anforderungen an Weiterleitungsanwendungen und weitere Hilfe finden Sie in der
    [Chutes-OAuth-Dokumentation](https://chutes.ai/docs/sign-in-with-chutes/overview).

  </Accordion>

  <Accordion title="Hinweise">
    - Chutes-Modelle werden als `chutes/<model-id>` registriert.
    - Chutes meldet während des Streamings keine Token-Nutzung (`supportsUsageInStreaming: false`); die Gesamtnutzung wird dennoch angezeigt, sobald der Stream abgeschlossen ist.

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
    Erstellen und verwalten Sie Chutes-API-Schlüssel.
  </Card>
</CardGroup>
