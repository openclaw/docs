---
read_when:
    - Sie möchten Chutes mit OpenClaw verwenden
    - Sie benötigen den Einrichtungsweg für OAuth oder API-Schlüssel
    - Sie möchten das Standardmodell, Aliasse oder das Erkennungsverhalten וויסן
summary: Einrichtung von Chutes (OAuth oder API-Schlüssel, Modellerkennung, Aliasse)
title: Chutes
x-i18n:
    generated_at: "2026-04-24T06:53:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4e5189cfe32affbd23cce6c626adacd90f435c0cfe4866e2c96ac8bd0312f23
    source_path: providers/chutes.md
    workflow: 15
---

[Chutes](https://chutes.ai) stellt Open-Source-Modellkataloge über eine
OpenAI-kompatible API bereit. OpenClaw unterstützt sowohl Browser-OAuth als auch direkte API-Key-
Authentifizierung für den gebündelten Provider `chutes`.

| Eigenschaft | Wert                         |
| ----------- | ---------------------------- |
| Provider    | `chutes`                     |
| API         | OpenAI-kompatibel            |
| Base-URL    | `https://llm.chutes.ai/v1`   |
| Auth        | OAuth oder API key (siehe unten) |

## Erste Schritte

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Den OAuth-Onboarding-Ablauf ausführen">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw startet den Browser-Ablauf lokal oder zeigt auf entfernten/headless
        Hosts einen URL- plus Redirect-Einfüge-Ablauf an. OAuth-Tokens werden über OpenClaw-Auth-
        Profile automatisch aktualisiert.
      </Step>
      <Step title="Das Standardmodell prüfen">
        Nach dem Onboarding wird das Standardmodell auf
        `chutes/zai-org/GLM-4.7-TEE` gesetzt und der gebündelte Chutes-Katalog
        registriert.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Einen API key abrufen">
        Erstellen Sie einen Schlüssel unter
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Den API-key-Onboarding-Ablauf ausführen">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Das Standardmodell prüfen">
        Nach dem Onboarding wird das Standardmodell auf
        `chutes/zai-org/GLM-4.7-TEE` gesetzt und der gebündelte Chutes-Katalog
        registriert.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Beide Auth-Pfade registrieren den gebündelten Chutes-Katalog und setzen das Standardmodell auf
`chutes/zai-org/GLM-4.7-TEE`. Laufzeit-Umgebungsvariablen: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Discovery-Verhalten

Wenn Chutes-Auth verfügbar ist, fragt OpenClaw den Chutes-Katalog mit diesen
Zugangsdaten ab und verwendet die entdeckten Modelle. Wenn die Discovery fehlschlägt, fällt OpenClaw
auf einen gebündelten statischen Katalog zurück, sodass Onboarding und Start weiterhin funktionieren.

## Standard-Aliasse

OpenClaw registriert drei praktische Aliasse für den gebündelten Chutes-Katalog:

| Alias           | Zielmodell                                            |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Integrierter Starter-Katalog

Der gebündelte Fallback-Katalog enthält aktuelle Chutes-Referenzen:

| Modell-Ref                                            |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

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
  <Accordion title="OAuth-Überschreibungen">
    Sie können den OAuth-Ablauf mit optionalen Umgebungsvariablen anpassen:

    | Variable | Zweck |
    | -------- | ----- |
    | `CHUTES_CLIENT_ID` | Benutzerdefinierte OAuth-Client-ID |
    | `CHUTES_CLIENT_SECRET` | Benutzerdefiniertes OAuth-Client-Secret |
    | `CHUTES_OAUTH_REDIRECT_URI` | Benutzerdefinierte Redirect-URI |
    | `CHUTES_OAUTH_SCOPES` | Benutzerdefinierte OAuth-Scopes |

    Siehe die [Chutes OAuth-Dokumentation](https://chutes.ai/docs/sign-in-with-chutes/overview)
    für Anforderungen an Redirect-Apps und Hilfe.

  </Accordion>

  <Accordion title="Hinweise">
    - Discovery mit API key und OAuth verwendet beide dieselbe Provider-ID `chutes`.
    - Chutes-Modelle werden als `chutes/<model-id>` registriert.
    - Wenn die Discovery beim Start fehlschlägt, wird automatisch der gebündelte statische Katalog verwendet.

  </Accordion>
</AccordionGroup>

## Verwandt

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider-Regeln, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich Provider-Einstellungen.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes-Dashboard und API-Dokumentation.
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes API keys erstellen und verwalten.
  </Card>
</CardGroup>
