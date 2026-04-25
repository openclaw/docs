---
read_when:
    - Sie möchten OpenClaw über einen LiteLLM-Proxy routen
    - Sie benötigen Kostenverfolgung, Logging oder Modellrouting über LiteLLM
summary: OpenClaw über LiteLLM Proxy ausführen für einheitlichen Modellzugriff und Kostenverfolgung
title: LiteLLM
x-i18n:
    generated_at: "2026-04-25T18:21:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: f4e2cdddff8dd953b989beb4f2ed1c31dae09298dacd0cf809ef07b41358623b
    source_path: providers/litellm.md
    workflow: 15
---

[LiteLLM](https://litellm.ai) ist ein Open-Source-LLM-Gateway, das eine einheitliche API für mehr als 100 Modell-Provider bereitstellt. Leiten Sie OpenClaw über LiteLLM, um zentrale Kostenverfolgung, Logging und die Flexibilität zu erhalten, Backends zu wechseln, ohne Ihre OpenClaw-Konfiguration zu ändern.

<Tip>
**Warum LiteLLM mit OpenClaw verwenden?**

- **Kostenverfolgung** — Sehen Sie genau, was OpenClaw für alle Modelle ausgibt
- **Modellrouting** — Wechseln Sie zwischen Claude, GPT-4, Gemini, Bedrock ohne Konfigurationsänderungen
- **Virtuelle Schlüssel** — Erstellen Sie Schlüssel mit Ausgabenlimits für OpenClaw
- **Logging** — Vollständige Anfrage-/Antwort-Logs für die Fehlerbehebung
- **Fallbacks** — Automatisches Failover, wenn Ihr primärer Provider ausfällt

</Tip>

## Schnellstart

<Tabs>
  <Tab title="Onboarding (empfohlen)">
    **Am besten geeignet für:** den schnellsten Weg zu einer funktionierenden LiteLLM-Einrichtung.

    <Steps>
      <Step title="Onboarding ausführen">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manuelle Einrichtung">
    **Am besten geeignet für:** volle Kontrolle über Installation und Konfiguration.

    <Steps>
      <Step title="LiteLLM Proxy starten">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="OpenClaw auf LiteLLM verweisen">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        Das ist alles. OpenClaw wird jetzt über LiteLLM geroutet.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Konfiguration

### Umgebungsvariablen

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Konfigurationsdatei

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Erweiterte Konfiguration

### Bilderzeugung

LiteLLM kann auch das Werkzeug `image_generate` über OpenAI-kompatible
Routen `/images/generations` und `/images/edits` unterstützen. Konfigurieren Sie ein LiteLLM-Bild-
modell unter `agents.defaults.imageGenerationModel`:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

Loopback-LiteLLM-URLs wie `http://localhost:4000` funktionieren ohne globale
Überschreibung für private Netzwerke. Für einen im LAN gehosteten Proxy setzen Sie
`models.providers.litellm.request.allowPrivateNetwork: true`, da der API-Schlüssel
an den konfigurierten Proxy-Host gesendet wird.

<AccordionGroup>
  <Accordion title="Virtuelle Schlüssel">
    Erstellen Sie einen dedizierten Schlüssel für OpenClaw mit Ausgabenlimits:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Verwenden Sie den generierten Schlüssel als `LITELLM_API_KEY`.

  </Accordion>

  <Accordion title="Modellrouting">
    LiteLLM kann Modellanfragen an verschiedene Backends weiterleiten. Konfigurieren Sie dies in Ihrer LiteLLM-`config.yaml`:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw fordert weiterhin `claude-opus-4-6` an — LiteLLM übernimmt das Routing.

  </Accordion>

  <Accordion title="Nutzung anzeigen">
    Prüfen Sie das Dashboard oder die API von LiteLLM:

    ```bash
    # Schlüsselinformationen
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Ausgabenprotokolle
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Hinweise zum Proxy-Verhalten">
    - LiteLLM läuft standardmäßig auf `http://localhost:4000`
    - OpenClaw verbindet sich über den proxyartigen OpenAI-kompatiblen `/v1`-
      Endpunkt von LiteLLM
    - Native ausschließlich auf OpenAI bezogene Anfrageformung gilt nicht über LiteLLM:
      kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und keine
      OpenAI-Reasoning-Kompatibilitäts-Payload-Formung
    - Versteckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`)
      werden bei benutzerdefinierten LiteLLM-Base-URLs nicht eingefügt
  </Accordion>
</AccordionGroup>

<Note>
Für allgemeine Provider-Konfiguration und Failover-Verhalten siehe [Modell-Provider](/de/concepts/model-providers).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="LiteLLM-Dokumentation" href="https://docs.litellm.ai" icon="book">
    Offizielle LiteLLM-Dokumentation und API-Referenz.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/models" icon="brain">
    Wie Sie Modelle auswählen und konfigurieren.
  </Card>
</CardGroup>
