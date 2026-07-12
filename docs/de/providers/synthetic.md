---
read_when:
    - Sie möchten Synthetic als Modell-Provider verwenden
    - Sie benötigen einen Synthetic-API-Schlüssel oder müssen eine Basis-URL einrichten
summary: Verwenden Sie die Anthropic-kompatible API von Synthetic in OpenClaw
title: Synthetic
x-i18n:
    generated_at: "2026-07-12T15:49:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) stellt Anthropic-kompatible Endpunkte bereit.
OpenClaw bündelt Synthetic als Provider `synthetic` und verwendet die Anthropic
Messages API.

| Eigenschaft | Wert                                  |
| ----------- | ------------------------------------- |
| Provider    | `synthetic`                           |
| Authentifizierung | `SYNTHETIC_API_KEY`            |
| API         | Anthropic Messages                    |
| Basis-URL   | `https://api.synthetic.new/anthropic` |

## Erste Schritte

<Steps>
  <Step title="API-Schlüssel abrufen">
    Rufen Sie einen `SYNTHETIC_API_KEY` aus Ihrem Synthetic-Konto ab oder lassen
    Sie sich beim Onboarding zur Eingabe auffordern.
  </Step>
  <Step title="Onboarding ausführen">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="Standardmodell überprüfen">
    Das Onboarding legt folgendes Standardmodell fest:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
Der Anthropic-Client von OpenClaw hängt automatisch `/v1` an die Basis-URL an.
Verwenden Sie daher `https://api.synthetic.new/anthropic` (nicht `/anthropic/v1`).
Falls Synthetic seine Basis-URL ändert, überschreiben Sie
`models.providers.synthetic.baseUrl`.
</Warning>

## Konfigurationsbeispiel

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
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
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## Integrierter Katalog

Alle Synthetic-Modelle verwenden Kosten von `0` (Eingabe/Ausgabe/Cache).

| Modell-ID                                              | Kontextfenster | Max. Token | Reasoning | Eingabe      |
| ------------------------------------------------------ | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000        | 65,536     | nein      | Text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000        | 8,192      | ja        | Text         |
| `hf:zai-org/GLM-4.7`                                   | 198,000        | 128,000    | nein      | Text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000        | 8,192      | nein      | Text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000        | 8,192      | nein      | Text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000        | 8,192      | nein      | Text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000        | 8,192      | nein      | Text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000        | 8,192      | nein      | Text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000        | 8,192      | nein      | Text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000        | 8,192      | nein      | Text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000        | 8,192      | nein      | Text         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000        | 8,192      | ja        | Text + Bild  |
| `hf:openai/gpt-oss-120b`                               | 128,000        | 8,192      | nein      | Text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000        | 8,192      | nein      | Text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000        | 8,192      | nein      | Text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000        | 8,192      | nein      | Text + Bild  |
| `hf:zai-org/GLM-4.5`                                   | 128,000        | 128,000    | nein      | Text         |
| `hf:zai-org/GLM-4.6`                                   | 198,000        | 128,000    | nein      | Text         |
| `hf:zai-org/GLM-5`                                     | 256,000        | 128,000    | ja        | Text + Bild  |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000        | 8,192      | nein      | Text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000        | 8,192      | ja        | Text         |

<Tip>
Modellreferenzen verwenden das Format `synthetic/<modelId>`. Verwenden Sie
`openclaw models list --provider synthetic`, um alle für Ihr Konto verfügbaren
Modelle anzuzeigen.
</Tip>

<AccordionGroup>
  <Accordion title="Modell-Zulassungsliste">
    Wenn Sie eine Modell-Zulassungsliste (`agents.defaults.models`) aktivieren,
    fügen Sie jedes Synthetic-Modell hinzu, das Sie verwenden möchten. Modelle,
    die nicht in der Zulassungsliste enthalten sind, werden für den Agenten
    ausgeblendet.
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

    OpenClaw hängt weiterhin automatisch `/v1` an.

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
