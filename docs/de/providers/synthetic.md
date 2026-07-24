---
read_when:
    - Sie möchten Synthetic als Modell-Provider verwenden
    - Sie müssen einen Synthetic-API-Schlüssel oder eine Basis-URL einrichten
summary: Verwenden Sie die Anthropic-kompatible API von Synthetic in OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-07-24T04:08:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c3f6cc89a7b837f57555d176ce78e62a39095d4ef0765c96b6b7b93ffebd7388
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) stellt Anthropic-kompatible Endpunkte bereit.
OpenClaw bündelt es als Provider `synthetic` und verwendet die Anthropic
Messages API.

| Eigenschaft | Wert                                  |
| ----------- | ------------------------------------- |
| Provider    | `synthetic`                    |
| Authentifizierung | `SYNTHETIC_API_KEY`             |
| API         | Anthropic Messages                    |
| Basis-URL   | `https://api.synthetic.new/anthropic`                    |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Rufen Sie einen `SYNTHETIC_API_KEY` aus Ihrem Synthetic-Konto ab oder lassen Sie sich beim Onboarding
    zur Eingabe eines Schlüssels auffordern.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Standardmodell überprüfen">
    Das Onboarding legt folgendes Standardmodell fest:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M3
    ```
  </Step>
</Steps>

<Warning>
Der Anthropic-Client von OpenClaw hängt `/v1` automatisch an die Basis-URL an. Verwenden Sie daher
`https://api.synthetic.new/anthropic` (nicht `/anthropic/v1`). Falls Synthetic
seine Basis-URL ändert, überschreiben Sie `models.providers.synthetic.baseUrl`.
</Warning>

## Konfigurationsbeispiel

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M3" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M3": { alias: "MiniMax M3" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M3",
            name: "MiniMax M3",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Integrierter Katalog

Alle Synthetic-Modelle verwenden Kosten von `0` (Eingabe/Ausgabe/Cache). Informationen zur Dienstverfügbarkeit finden Sie in der
[aktuellen Modellliste](https://dev.synthetic.new/docs/api/models) von Synthetic.

| Modell-ID                                           | Kontextfenster | Max. Token | Reasoning | Eingabe      |
| --------------------------------------------------- | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M3`                                  | 262,144        | 65,536     | ja        | Text + Bild  |
| `hf:moonshotai/Kimi-K2.7-Code`                                  | 262,144        | 8,192      | ja        | Text + Bild  |
| `hf:nvidia/NVIDIA-Nemotron-3-Super-120B-A12B-NVFP4`                                  | 262,144        | 8,192      | ja        | Text         |
| `hf:openai/gpt-oss-120b`                                  | 131,072        | 8,192      | ja        | Text         |
| `hf:Qwen/Qwen3.6-27B`                                  | 262,144        | 81,920     | ja        | Text + Bild  |
| `hf:zai-org/GLM-4.7-Flash`                                  | 196,608        | 131,072    | ja        | Text         |
| `hf:zai-org/GLM-5.2`                                  | 524,288        | 131,072    | ja        | Text         |

<Tip>
Modellreferenzen verwenden das Format `synthetic/<modelId>`. Verwenden Sie
`openclaw models list --provider synthetic`, um alle für Ihr
Konto verfügbaren Modelle anzuzeigen.
</Tip>

<AccordionGroup>
  <Accordion title="Modell-Zulassungsliste">
    Wenn Sie eine Modell-Zulassungsliste (`agents.defaults.modelPolicy.allow`) aktivieren, fügen Sie jedes
    Synthetic-Modell hinzu, das Sie verwenden möchten. Modelle, die nicht in der Zulassungsliste enthalten sind, werden
    vor dem Agenten ausgeblendet.
  </Accordion>

  <Accordion title="Basis-URL überschreiben">
    Falls Synthetic seinen API-Endpunkt ändert, überschreiben Sie die Basis-URL:

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    OpenClaw hängt `/v1` weiterhin automatisch an.

  </Accordion>
</AccordionGroup>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Modell-Provider" href="/de/concepts/model-providers" icon="layers">
    Provider-Regeln, Modellreferenzen und Failover-Verhalten.
  </Card>
  <Card title="Konfigurationsreferenz" href="/de/gateway/configuration-reference" icon="gear">
    Vollständiges Konfigurationsschema einschließlich der Provider-Einstellungen.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic-Dashboard und API-Dokumentation.
  </Card>
</CardGroup>
