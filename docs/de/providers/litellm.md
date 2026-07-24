---
read_when:
    - Sie möchten OpenClaw über einen LiteLLM-Proxy leiten
    - Sie benötigen Kostenverfolgung, Protokollierung oder Modell-Routing über LiteLLM
summary: OpenClaw über LiteLLM Proxy ausführen, um einheitlichen Modellzugriff und Kostenverfolgung zu ermöglichen
title: LiteLLM
x-i18n:
    generated_at: "2026-07-24T05:19:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 22451f0eefcf991a602409701fc752f97600a67752c67304137c7f17f3dd1a16
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) ist ein quelloffenes LLM-Gateway mit einer einheitlichen API für mehr als 100 Modell-
Provider. Leiten Sie OpenClaw über LiteLLM, um Kosten zentral zu verfolgen, Protokolle zu erfassen, virtuelle Schlüssel mit
Ausgabenlimits zu verwenden und ein Backend-Failover zu ermöglichen, ohne die OpenClaw-Konfiguration zu ändern.

## Schnellstart

<Tabs>
  <Tab title="Onboarding (empfohlen)">
    ```bash
    openclaw onboard --auth-choice litellm-api-key
    ```

    Übergeben Sie für eine nicht interaktive Einrichtung mit einem Remote-Proxy die Proxy-URL ausdrücklich:

    ```bash
    openclaw onboard --non-interactive --accept-risk --auth-choice litellm-api-key \
      --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
    ```

  </Tab>

  <Tab title="Manuelle Einrichtung">
    <Steps>
      <Step title="LiteLLM-Proxy starten">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="OpenClaw auf LiteLLM ausrichten">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"
        openclaw
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Konfiguration

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

Das beim Onboarding geschriebene Standardmodell ist `litellm/claude-opus-4-6`.

## Bilderzeugung

LiteLLM kann das Tool `image_generate` über die OpenAI-kompatiblen Routen `/images/generations` und
`/images/edits` bereitstellen. Das Standard-Bildmodell ist `gpt-image-2`; konfigurieren Sie ein anderes unter
`agents.defaults.mediaModels.image`:

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

Loopback-LiteLLM-URLs (`http://localhost:4000`, `127.0.0.1`, `::1`, `host.docker.internal`) funktionieren
ohne eine globale Außerkraftsetzung für private Netzwerke. Legen Sie für einen im LAN gehosteten Proxy
`models.providers.litellm.request.allowPrivateNetwork: true` fest, da der API-Schlüssel an diesen Host gesendet wird.

## Erweitert

<AccordionGroup>
  <Accordion title="Virtuelle Schlüssel">
    Erstellen Sie für OpenClaw einen eigenen Schlüssel mit Ausgabenlimits:

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

  <Accordion title="Modell-Routing">
    LiteLLM kann Modellanfragen an unterschiedliche Backends weiterleiten. Konfigurieren Sie dies in Ihrer LiteLLM-Datei `config.yaml`:

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

    OpenClaw fordert weiterhin `claude-opus-4-6` an; LiteLLM übernimmt das Routing.

  </Accordion>

  <Accordion title="Nutzung anzeigen">
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
    - LiteLLM wird standardmäßig auf `http://localhost:4000` ausgeführt.
    - OpenClaw stellt die Verbindung über LiteLLMs OpenAI-kompatiblen Proxy-Endpunkt `/v1` her.
    - Die ausschließlich für natives OpenAI vorgesehene Anfrageaufbereitung gilt bei Verwendung einer konfigurierten LiteLLM-Basis-URL nicht:
      kein `service_tier`, kein Responses-`store`, keine Hinweise für den Prompt-Cache und keine
      Aufbereitung der Nutzlast für den OpenAI-Reasoning-Aufwand.
    - Verborgene OpenClaw-Attributionsheader (`originator`, `version`, `User-Agent`) werden nur an
      verifizierte native OpenAI-Endpunkte gesendet und daher bei einer benutzerdefinierten LiteLLM-Basis-URL nicht eingefügt.
  </Accordion>
</AccordionGroup>

<Note>
Allgemeine Informationen zur Provider-Konfiguration und zum Failover-Verhalten finden Sie unter [Modell-Provider](/de/concepts/model-providers).
</Note>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="LiteLLM-Dokumentation" href="https://docs.litellm.ai" icon="book">
    Offizielle LiteLLM-Dokumentation und API-Referenz.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/model-providers" icon="layers">
    Übersicht über alle Provider, Modellreferenzen und das Failover-Verhalten.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Modelle" href="/de/concepts/models" icon="brain">
    Auswahl und Konfiguration von Modellen.
  </Card>
</CardGroup>
