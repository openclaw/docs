---
read_when:
    - Sie möchten Chutes mit OpenClaw verwenden
    - Sie benötigen den Einrichtungsweg für OAuth oder einen API-Schlüssel.
    - Sie möchten das Standardmodell, Aliasse oder das Erkennungsverhalten festlegen
summary: Chutes-Einrichtung (OAuth oder API-Schlüssel, Modellerkennung, Aliasse)
title: Chutes
x-i18n:
    generated_at: "2026-07-12T02:02:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
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
| Laufzeit-Umgebungsvariablen | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`         |

`CHUTES_OAUTH_TOKEN` stellt ein bereits abgerufenes OAuth-Zugriffstoken direkt
bereit (beispielsweise in CI) und umgeht damit den nachfolgend beschriebenen interaktiven Browserablauf.

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
      <Step title="OAuth-Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw startet den Browserablauf lokal oder zeigt auf entfernten/headless
        Hosts eine URL und einen Ablauf zum Einfügen der Weiterleitungs-URL an. OAuth-Token
        werden über die OpenClaw-Authentifizierungsprofile automatisch aktualisiert.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API-Schlüssel">
    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen Sie einen Schlüssel unter
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Onboarding für API-Schlüssel ausführen">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Ermittlungsverhalten

Wenn eine Chutes-Authentifizierung verfügbar ist, fragt OpenClaw `GET /v1/models`
mit diesen Anmeldedaten ab und verwendet die ermittelten Modelle, die pro
Anmeldedatensatz fünf Minuten lang zwischengespeichert werden. Bei einem abgelaufenen oder nicht autorisierten
Schlüssel (HTTP 401) versucht OpenClaw die Abfrage einmal ohne Anmeldedaten
erneut. Wenn die Ermittlung weiterhin keine Einträge liefert, fehlschlägt oder einen
anderen Nicht-2xx-Status zurückgibt, greift OpenClaw auf den mitgelieferten statischen Katalog zurück (die
Ermittlung per API-Schlüssel und OAuth verwendet denselben Ablauf). Wenn die Ermittlung beim Start fehlschlägt, wird
der statische Katalog automatisch verwendet.

## Standard-Aliasse

OpenClaw registriert drei praktische Aliasse für den Chutes-Katalog:

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
    | -------- | ----- |
    | `CHUTES_CLIENT_ID` | OAuth-Client-ID (wird abgefragt, wenn nicht festgelegt) |
    | `CHUTES_CLIENT_SECRET` | OAuth-Client-Secret |
    | `CHUTES_OAUTH_REDIRECT_URI` | Weiterleitungs-URI (Standard: `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Durch Leerzeichen getrennte Berechtigungsbereiche (Standard: `openid profile chutes:invoke`) |

    Weitere Informationen zu den Anforderungen für Weiterleitungs-Apps und Hilfestellung finden Sie in der
    [Chutes-OAuth-Dokumentation](https://chutes.ai/docs/sign-in-with-chutes/overview).

  </Accordion>

  <Accordion title="Hinweise">
    - Chutes-Modelle werden als `chutes/<model-id>` registriert.
    - Chutes meldet die Token-Nutzung während des Streamings nicht (`supportsUsageInStreaming: false`); die Gesamtnutzung wird dennoch angezeigt, sobald der Stream abgeschlossen ist.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider-Regeln, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich der Provider-Einstellungen.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes-Dashboard und API-Dokumentation.
  </Card>
  <Card title="Chutes-API-Schlüssel" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes-API-Schlüssel erstellen und verwalten.
  </Card>
</CardGroup>
