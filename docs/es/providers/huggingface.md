---
read_when:
    - Quieres usar Hugging Face Inference con OpenClaw
    - Necesitas la variable de entorno del token de HF o la opción de autenticación de la CLI
summary: Configuración de Hugging Face Inference (autenticación + selección de modelo)
title: Hugging Face (inferencia)
x-i18n:
    generated_at: "2026-07-05T11:36:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) expone un enrutador de completions de chat compatible con OpenAI delante de muchos modelos alojados (DeepSeek, Llama y más) bajo un único token. OpenClaw se comunica **solo con el endpoint de completions de chat**; para texto a imagen, embeddings o voz, usa directamente los [clientes de inferencia de HF](https://huggingface.co/docs/api-inference/quicktour).

| Propiedad    | Valor                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| ID de proveedor | `huggingface`                                                                                                            |
| Plugin       | incluido (habilitado de forma predeterminada, sin paso de instalación)                                                      |
| Variable de entorno de autenticación | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN` (token de granularidad fina)                                      |
| API          | compatible con OpenAI (`https://router.huggingface.co/v1`)                                                                 |
| Facturación  | Token único de HF; los [precios](https://huggingface.co/docs/inference-providers/pricing) siguen las tarifas del proveedor con un nivel gratuito |

## Primeros pasos

<Steps>
  <Step title="Create a fine-grained token">
    Ve a [Tokens de configuración de Hugging Face](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) y crea un nuevo token de granularidad fina.

    <Warning>
    El token debe tener habilitado el permiso **Make calls to Inference Providers** o las solicitudes de API se rechazarán.
    </Warning>

  </Step>
  <Step title="Run onboarding">
    Elige **Hugging Face** en el menú desplegable de proveedores y luego introduce tu clave de API cuando se te solicite:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Select a default model">
    En el menú desplegable **Default Hugging Face model**, elige un modelo. La lista se carga desde la Inference API cuando tu token es válido; de lo contrario, OpenClaw muestra el catálogo integrado de abajo. Tu elección se guarda como `agents.defaults.model.primary`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### Configuración no interactiva

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

Establece `huggingface/deepseek-ai/DeepSeek-R1` como modelo predeterminado.

## IDs de modelo

Las referencias de modelo usan la forma `huggingface/<org>/<model>` (IDs estilo Hub). Catálogo integrado de OpenClaw:

| Modelo                       | Ref (prefijo con `huggingface/`)          |
| ---------------------------- | ----------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                 |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`               |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                     |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |

<Tip>
Cuando tu token es válido, OpenClaw también descubre cualquier otro modelo desde **GET** `https://router.huggingface.co/v1/models` durante el onboarding y el arranque del Gateway, por lo que tu catálogo puede incluir muchos más que los cuatro modelos anteriores. Puedes añadir `:fastest` o `:cheapest` a cualquier ID de modelo; el enrutador de HF dirige la solicitud al proveedor de inferencia correspondiente. Define tu orden predeterminado de proveedores en la [configuración de Inference Provider](https://hf.co/settings/inference-providers).
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Model discovery and onboarding dropdown">
    OpenClaw descubre modelos con:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # or $HF_TOKEN
    ```

    La respuesta tiene estilo OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Con una clave configurada (onboarding, `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`), el menú desplegable **Default Hugging Face model** durante la configuración interactiva se rellena desde este endpoint. El arranque del Gateway repite la misma llamada para actualizar el catálogo. Los modelos descubiertos se combinan con el catálogo integrado anterior (usado para metadatos como ventana de contexto y costo cuando un ID coincide). Si la solicitud falla, no devuelve datos o no hay una clave configurada, OpenClaw recurre solo al catálogo integrado.

    Deshabilita el descubrimiento sin quitar el proveedor:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Model names, aliases, and policy suffixes">
    - **Nombre desde la API:** los modelos descubiertos usan `name`, `title` o `display_name` de la API cuando están presentes; de lo contrario, OpenClaw deriva un nombre del ID del modelo (por ejemplo, `deepseek-ai/DeepSeek-R1` se convierte en "DeepSeek R1").
    - **Anular nombre mostrado:** define una etiqueta personalizada por modelo en la configuración:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **Sufijos de política:** `:fastest` y `:cheapest` son convenciones del enrutador de HF, no algo que OpenClaw reescriba: el sufijo se envía literalmente como parte del ID de modelo y el enrutador de HF elige el proveedor de inferencia correspondiente. Añade cada variante como su propia entrada bajo `models.providers.huggingface.models` (o en `model.primary`) si quieres un alias distinto por sufijo.
    - **Combinación de configuración:** las entradas existentes en `models.providers.huggingface.models` (por ejemplo, en `models.json`) se mantienen al combinar la configuración, por lo que cualquier `name`, `alias` u opción de modelo personalizada que definas allí persiste entre reinicios.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN` esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Note>
    OpenClaw acepta tanto `HUGGINGFACE_HUB_TOKEN` como `HF_TOKEN`. Si ambos están definidos, `HUGGINGFACE_HUB_TOKEN` tiene prioridad.
    </Note>

  </Accordion>

  <Accordion title="Config: DeepSeek R1 with fallback">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: DeepSeek with cheapest and fastest variants">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: DeepSeek + Llama + GPT-OSS with aliases">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Model selection" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Inference Providers docs" href="https://huggingface.co/docs/inference-providers" icon="book">
    Documentación oficial de Hugging Face Inference Providers.
  </Card>
  <Card title="Configuration" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
