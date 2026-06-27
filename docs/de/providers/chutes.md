---
read_when:
    - Sie möchten Chutes mit OpenClaw verwenden
    - Sie benötigen den OAuth- oder API-Schlüssel-Einrichtungspfad
    - Sie möchten das Standardmodell, Aliasse oder das Erkennungsverhalten
summary: Chutes-Einrichtung (OAuth oder API-Schlüssel, Modellerkennung, Aliasse)
title: Chutes
x-i18n:
    generated_at: "2026-06-27T18:02:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f1898c568fd664303a8bb5c2e46228c75f9c217bec5a65e752d9c7e10b980bb
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) stellt Open-Source-Modellkataloge über eine
OpenAI-kompatible API bereit. OpenClaw unterstützt sowohl Browser-OAuth als auch direkte API-Schlüssel-
Authentifizierung für den Provider `chutes`.

| Eigenschaft | Wert                         |
| ----------- | ---------------------------- |
| Provider    | `chutes`                     |
| API         | OpenAI-kompatibel            |
| Basis-URL   | `https://llm.chutes.ai/v1`   |
| Auth        | OAuth oder API-Schlüssel (siehe unten) |

## Plugin installieren

Installieren Sie das offizielle Plugin und starten Sie anschließend den Gateway neu:

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Erste Schritte

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="OAuth-Onboarding-Flow ausführen">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw startet den Browser-Flow lokal oder zeigt auf entfernten/headless Hosts
        eine URL und einen Flow zum Einfügen der Weiterleitung an. OAuth-Token werden über OpenClaw-Auth-
        Profile automatisch aktualisiert.
      </Step>
      <Step title="Standardmodell prüfen">
        Nach dem Onboarding wird das Standardmodell auf
        `chutes/zai-org/GLM-4.7-TEE` gesetzt und der statische Chutes-Katalog
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
      <Step title="API-Schlüssel-Onboarding-Flow ausführen">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Standardmodell prüfen">
        Nach dem Onboarding wird das Standardmodell auf
        `chutes/zai-org/GLM-4.7-TEE` gesetzt und der statische Chutes-Katalog
        registriert.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
Beide Authentifizierungspfade registrieren den statischen Chutes-Katalog und setzen das Standardmodell auf
`chutes/zai-org/GLM-4.7-TEE`. Runtime-Umgebungsvariablen: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## Discovery-Verhalten

Wenn Chutes-Authentifizierung verfügbar ist, fragt OpenClaw den Chutes-Katalog mit diesen
Anmeldedaten ab und verwendet die erkannten Modelle. Wenn Discovery fehlschlägt, fällt OpenClaw
auf einen statischen Katalog zurück, sodass Onboarding und Start weiterhin funktionieren.

## Standard-Aliasse

OpenClaw registriert drei praktische Aliasse für den statischen Chutes-Katalog:

| Alias           | Zielmodell                                            |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Integrierter Starter-Katalog

Der statische Fallback-Katalog enthält aktuelle Chutes-Refs:

| Modell-Ref                                           |
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
    Sie können den OAuth-Flow mit optionalen Umgebungsvariablen anpassen:

    | Variable | Zweck |
    | -------- | ----- |
    | `CHUTES_CLIENT_ID` | Benutzerdefinierte OAuth-Client-ID |
    | `CHUTES_CLIENT_SECRET` | Benutzerdefinierter OAuth-Client-Secret |
    | `CHUTES_OAUTH_REDIRECT_URI` | Benutzerdefinierte Weiterleitungs-URI |
    | `CHUTES_OAUTH_SCOPES` | Benutzerdefinierte OAuth-Scopes |

    Weitere Informationen zu Anforderungen an Weiterleitungs-Apps und Hilfe finden Sie in der [Chutes-OAuth-Dokumentation](https://chutes.ai/docs/sign-in-with-chutes/overview).

  </Accordion>

  <Accordion title="Hinweise">
    - API-Schlüssel- und OAuth-Discovery verwenden beide dieselbe `chutes`-Provider-ID.
    - Chutes-Modelle werden als `chutes/<model-id>` registriert.
    - Wenn Discovery beim Start fehlschlägt, wird automatisch der statische Katalog verwendet.

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
    Chutes-API-Schlüssel erstellen und verwalten.
  </Card>
</CardGroup>
