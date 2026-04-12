---
read_when:
    - Quieres usar modelos de Mistral en OpenClaw
    - Necesitas el onboarding con clave de API de Mistral y las refs de modelos
summary: Usa modelos de Mistral y transcripción Voxtral con OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-12T23:31:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0474f55587909ce9bbdd47b881262edbeb1b07eb3ed52de1090a8ec4d260c97b
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

OpenClaw admite Mistral tanto para el enrutamiento de modelos de texto/imagen (`mistral/...`) como para la transcripción de audio mediante Voxtral en comprensión de medios.
Mistral también puede usarse para embeddings de memoria (`memorySearch.provider = "mistral"`).

- Proveedor: `mistral`
- Autenticación: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Primeros pasos

<Steps>
  <Step title="Get your API key">
    Crea una clave de API en la [Consola de Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    O pasa la clave directamente:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Set a default model">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Catálogo integrado de LLM

OpenClaw actualmente incluye este catálogo integrado de Mistral:

| Ref del modelo                    | Entrada     | Contexto | Salida máxima | Notas                                                            |
| --------------------------------- | ----------- | -------- | ------------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`    | texto, imagen | 262,144 | 16,384        | Modelo predeterminado                                            |
| `mistral/mistral-medium-2508`     | texto, imagen | 262,144 | 8,192         | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`    | texto, imagen | 128,000 | 16,384        | Mistral Small 4; reasoning ajustable mediante la API `reasoning_effort` |
| `mistral/pixtral-large-latest`    | texto, imagen | 128,000 | 32,768        | Pixtral                                                          |
| `mistral/codestral-latest`        | texto       | 256,000 | 4,096         | Programación                                                     |
| `mistral/devstral-medium-latest`  | texto       | 262,144 | 32,768        | Devstral 2                                                       |
| `mistral/magistral-small`         | texto       | 128,000 | 40,000        | Con reasoning habilitado                                         |

## Transcripción de audio (Voxtral)

Usa Voxtral para la transcripción de audio mediante la canalización de comprensión de medios.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
La ruta de transcripción de medios usa `/v1/audio/transcriptions`. El modelo de audio predeterminado para Mistral es `voxtral-mini-latest`.
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Adjustable reasoning (mistral-small-latest)">
    `mistral/mistral-small-latest` corresponde a Mistral Small 4 y admite [reasoning ajustable](https://docs.mistral.ai/capabilities/reasoning/adjustable) en la API de Chat Completions mediante `reasoning_effort` (`none` minimiza el pensamiento adicional en la salida; `high` muestra trazas completas de pensamiento antes de la respuesta final).

    OpenClaw asigna el nivel de **thinking** de la sesión a la API de Mistral:

    | Nivel de thinking de OpenClaw                    | `reasoning_effort` de Mistral |
    | ------------------------------------------------ | ----------------------------- |
    | **off** / **minimal**                            | `none`                        |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** | `high`                |

    <Note>
    Los demás modelos del catálogo integrado de Mistral no usan este parámetro. Sigue usando modelos `magistral-*` cuando quieras el comportamiento nativo de Mistral centrado primero en reasoning.
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
    Mistral puede servir embeddings de memoria mediante `/v1/embeddings` (modelo predeterminado: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth and base URL">
    - La autenticación de Mistral usa `MISTRAL_API_KEY`.
    - La URL base del proveedor usa por defecto `https://api.mistral.ai/v1`.
    - El modelo predeterminado del onboarding es `mistral/mistral-large-latest`.
    - Z.AI usa autenticación Bearer con tu clave de API.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Cómo elegir proveedores, refs de modelos y comportamiento de failover.
  </Card>
  <Card title="Media understanding" href="/tools/media-understanding" icon="microphone">
    Configuración de transcripción de audio y selección de proveedor.
  </Card>
</CardGroup>
