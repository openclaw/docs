---
read_when:
    - Sie möchten OpenClaw über einen LiteLLM-Proxy routen
    - Sie benötigen Kostentracking, Logging oder Modell-Routing über LiteLLM
summary: OpenClaw über LiteLLM Proxy für einheitlichen Modellzugriff und Kostenverfolgung ausführen
title: LiteLLM
x-i18n:
    generated_at: "2026-04-30T07:10:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai) ist ein Open-Source-LLM-Gateway, das eine einheitliche API für mehr als 100 Modell-Provider bereitstellt. Leiten Sie OpenClaw über LiteLLM, um zentrale Kostenerfassung, Logging und die Flexibilität zu erhalten, Backends zu wechseln, ohne Ihre OpenClaw-Konfiguration zu ändern.

<Tip>
**Warum LiteLLM mit OpenClaw verwenden?**

- **Kostenerfassung** — Sehen Sie genau, was OpenClaw über alle Modelle hinweg ausgibt
- **Modell-Routing** — Wechseln Sie zwischen Claude, GPT-4, Gemini und Bedrock ohne Konfigurationsänderungen
- **Virtuelle Schlüssel** — Erstellen Sie Schlüssel mit Ausgabenlimits für OpenClaw
- **Logging** — Vollständige Anfrage-/Antwort-Logs für das Debugging
- **Fallbacks** — Automatische Ausfallsicherung, falls Ihr primärer Provider nicht verfügbar ist

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

        Für eine nicht interaktive Einrichtung mit einem Remote-Proxy übergeben Sie die Proxy-URL explizit:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manuelle Einrichtung">
    **Am besten geeignet für:** vollständige Kontrolle über Installation und Konfiguration.

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

        Das war's. OpenClaw leitet jetzt über LiteLLM weiter.
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

LiteLLM kann auch das Tool `image_generate` über OpenAI-kompatible
`/images/generations`- und `/images/edits`-Routen für OpenClaw bereitstellen. Konfigurieren Sie ein LiteLLM-Bildmodell
unter `agents.defaults.imageGenerationModel`:

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
Private-Network-Überschreibung. Legen Sie für einen im LAN gehosteten Proxy
`models.providers.litellm.request.allowPrivateNetwork: true` fest, da der API-Schlüssel
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

  <Accordion title="Modell-Routing">
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
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Hinweise zum Proxy-Verhalten">
    - LiteLLM läuft standardmäßig auf `http://localhost:4000`
    - OpenClaw verbindet sich über den Proxy-artigen OpenAI-kompatiblen `/v1`-Endpunkt von LiteLLM
    - Reine native OpenAI-Anfrageformung gilt nicht über LiteLLM:
      kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und keine
      OpenAI-Reasoning-Kompatibilitäts-Payload-Formung
    - Verdeckte OpenClaw-Attributions-Header (`originator`, `version`, `User-Agent`)
      werden bei benutzerdefinierten LiteLLM-Basis-URLs nicht eingefügt
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
    Überblick über alle Provider, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfiguration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
  <Card title="Modellauswahl" href="/de/concepts/models" icon="brain">
    So wählen und konfigurieren Sie Modelle.
  </Card>
</CardGroup>
