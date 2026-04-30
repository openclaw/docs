---
read_when:
    - Sie möchten Chutes mit OpenClaw verwenden
    - Sie benötigen den Einrichtungsweg für OAuth oder einen API-Schlüssel.
    - Sie möchten das Standardmodell, Aliasnamen oder das Erkennungsverhalten
summary: Chutes-Einrichtung (OAuth oder API-Schlüssel, Modellerkennung, Aliasse)
title: Chutes
x-i18n:
    generated_at: "2026-04-30T07:10:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52e2c767604ff50cc7fe1a5fcfac03c35345facf2225e80f62476bbc3852199a
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) stellt Open-Source-Modellkataloge über eine
OpenAI-kompatible API bereit. OpenClaw unterstützt sowohl Browser-OAuth als auch direkte API-Schlüssel-
Authentifizierung für den gebündelten `chutes`-Provider.

| Eigenschaft | Wert                         |
| ----------- | ---------------------------- |
| Provider    | `chutes`                     |
| API         | OpenAI-kompatibel            |
| Basis-URL   | `https://llm.chutes.ai/v1`   |
| Auth        | OAuth oder API-Schlüssel (siehe unten) |

## Erste Schritte

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth-Onboarding-Ablauf ausführen">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw startet den Browser-Ablauf lokal oder zeigt auf Remote-/Headless-Hosts
        einen Ablauf mit URL und Einfügen der Weiterleitung an. OAuth-Token werden automatisch über OpenClaw-Auth-
        Profile aktualisiert.
      </Step>
      <Step title="Standardmodell überprüfen">
        Nach dem Onboarding ist das Standardmodell auf
        `chutes/zai-org/GLM-4.7-TEE` gesetzt und der gebündelte Chutes-Katalog ist
        registriert.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API-Schlüssel">
    <Steps>
      <Step title="API-Schlüssel abrufen">
        Erstellen Sie einen Schlüssel unter
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="API-Schlüssel-Onboarding-Ablauf ausführen">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Standardmodell überprüfen">
        Nach dem Onboarding ist das Standardmodell auf
        `chutes/zai-org/GLM-4.7-TEE` gesetzt und der gebündelte Chutes-Katalog ist
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
Anmeldedaten ab und verwendet die gefundenen Modelle. Wenn die Discovery fehlschlägt, greift OpenClaw
auf einen gebündelten statischen Katalog zurück, sodass Onboarding und Start weiterhin funktionieren.

## Standard-Aliasse

OpenClaw registriert drei praktische Aliasse für den gebündelten Chutes-Katalog:

| Alias           | Zielmodell                                            |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Integrierter Starterkatalog

Der gebündelte Fallback-Katalog enthält aktuelle Chutes-Refs:

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

## Config-Beispiel

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
    | `CHUTES_OAUTH_REDIRECT_URI` | Benutzerdefinierte Weiterleitungs-URI |
    | `CHUTES_OAUTH_SCOPES` | Benutzerdefinierte OAuth-Scopes |

    Informationen zu Anforderungen für Weiterleitungs-Apps und Hilfe finden Sie in der [Chutes-OAuth-Dokumentation](https://chutes.ai/docs/sign-in-with-chutes/overview).

  </Accordion>

  <Accordion title="Hinweise">
    - API-Schlüssel- und OAuth-Discovery verwenden beide dieselbe `chutes`-Provider-ID.
    - Chutes-Modelle werden als `chutes/<model-id>` registriert.
    - Wenn die Discovery beim Start fehlschlägt, wird automatisch der gebündelte statische Katalog verwendet.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Provider-Regeln, Modell-Refs und Failover-Verhalten.
  </Card>
  <Card title="Config-Referenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Config-Schema einschließlich Provider-Einstellungen.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Chutes-Dashboard und API-Dokumentation.
  </Card>
  <Card title="Chutes-API-Schlüssel" href="https://chutes.ai/settings/api-keys" icon="key">
    Chutes-API-Schlüssel erstellen und verwalten.
  </Card>
</CardGroup>
