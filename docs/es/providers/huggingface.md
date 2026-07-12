---
read_when:
    - Quieres usar Hugging Face Inference con OpenClaw
    - Necesitas la variable de entorno del token de HF o la opción de autenticación de la CLI
summary: Configuración de Hugging Face Inference (autenticación + selección del modelo)
title: Hugging Face (inferencia)
x-i18n:
    generated_at: "2026-07-11T23:29:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) ofrece un enrutador de finalizaciones de chat compatible con OpenAI para numerosos modelos alojados (DeepSeek, Llama y otros) mediante un único token. OpenClaw se comunica **únicamente con el endpoint de finalizaciones de chat**; para texto a imagen, embeddings o voz, utiliza directamente los [clientes de inferencia de HF](https://huggingface.co/docs/api-inference/quicktour).

| Propiedad             | Valor                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Id. del proveedor     | `huggingface`                                                                                                                      |
| Plugin                | incluido (habilitado de forma predeterminada, sin ningún paso de instalación)                                                      |
| Variable de entorno de autenticación | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN` (token con permisos específicos)                                                   |
| API                   | Compatible con OpenAI (`https://router.huggingface.co/v1`)                                                                         |
| Facturación           | Un único token de HF; los [precios](https://huggingface.co/docs/inference-providers/pricing) siguen las tarifas del proveedor e incluyen un nivel gratuito |

## Primeros pasos

<Steps>
  <Step title="Crear un token con permisos específicos">
    Ve a [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) y crea un nuevo token con permisos específicos.

    <Warning>
    El token debe tener habilitado el permiso **Make calls to Inference Providers**; de lo contrario, se rechazarán las solicitudes a la API.
    </Warning>

  </Step>
  <Step title="Ejecutar la incorporación">
    Elige **Hugging Face** en la lista desplegable de proveedores y, cuando se te solicite, introduce tu clave de API:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Seleccionar un modelo predeterminado">
    En la lista desplegable **Default Hugging Face model**, selecciona un modelo. La lista se carga desde la API de inferencia cuando tu token es válido; de lo contrario, OpenClaw muestra el catálogo integrado que aparece a continuación. Tu selección se guarda como `agents.defaults.model.primary`:

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
  <Step title="Verificar que el modelo esté disponible">
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

## Identificadores de modelos

Las referencias de modelos utilizan el formato `huggingface/<org>/<model>` (identificadores al estilo de Hub). Catálogo integrado de OpenClaw:

| Modelo                       | Referencia (con el prefijo `huggingface/`) |
| ---------------------------- | ------------------------------------------ |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                  |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`                |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                      |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo`  |

<Tip>
Cuando tu token es válido, OpenClaw también descubre cualquier otro modelo mediante **GET** `https://router.huggingface.co/v1/models` durante la incorporación y el inicio del Gateway, por lo que tu catálogo puede incluir muchos más que los cuatro modelos anteriores. Puedes añadir `:fastest` o `:cheapest` a cualquier identificador de modelo; el enrutador de HF lo dirige al proveedor de inferencia correspondiente. Define el orden predeterminado de proveedores en [Inference Provider settings](https://hf.co/settings/inference-providers).
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Descubrimiento de modelos y lista desplegable de incorporación">
    OpenClaw descubre modelos mediante:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # or $HF_TOKEN
    ```

    La respuesta sigue el formato de OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Con una clave configurada (mediante la incorporación, `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`), la lista desplegable **Default Hugging Face model** de la configuración interactiva se rellena desde este endpoint. Al iniciarse, el Gateway repite la misma llamada para actualizar el catálogo. Los modelos descubiertos se combinan con el catálogo integrado anterior (que se utiliza para metadatos como la ventana de contexto y el coste cuando coincide un identificador). Si la solicitud falla, no devuelve datos o no se ha definido ninguna clave, OpenClaw utiliza únicamente el catálogo integrado.

    Deshabilita el descubrimiento sin eliminar el proveedor:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Nombres de modelos, alias y sufijos de política">
    - **Nombre procedente de la API:** los modelos descubiertos utilizan el valor `name`, `title` o `display_name` de la API cuando está disponible; de lo contrario, OpenClaw deriva un nombre del identificador del modelo (por ejemplo, `deepseek-ai/DeepSeek-R1` se convierte en "DeepSeek R1").
    - **Sobrescribir el nombre mostrado:** define una etiqueta personalizada para cada modelo en la configuración:

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

    - **Sufijos de política:** `:fastest` y `:cheapest` son convenciones del enrutador de HF, no elementos que OpenClaw reescriba: el sufijo se envía literalmente como parte del identificador del modelo y el enrutador de HF selecciona el proveedor de inferencia correspondiente. Añade cada variante como una entrada independiente en `models.providers.huggingface.models` (o en `model.primary`) si quieres un alias distinto para cada sufijo.
    - **Combinación de la configuración:** las entradas existentes en `models.providers.huggingface.models` (por ejemplo, en `models.json`) se conservan al combinar la configuración, por lo que cualquier valor personalizado de `name`, `alias` u opción de modelo que definas allí persiste entre reinicios.

  </Accordion>

  <Accordion title="Configuración del entorno y del daemon">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN` esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Note>
    OpenClaw acepta tanto `HUGGINGFACE_HUB_TOKEN` como `HF_TOKEN`. Si ambos están definidos, `HUGGINGFACE_HUB_TOKEN` tiene prioridad.
    </Note>

  </Accordion>

  <Accordion title="Configuración: DeepSeek R1 con modelo alternativo">
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

  <Accordion title="Configuración: DeepSeek con las variantes más barata y más rápida">
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

  <Accordion title="Configuración: DeepSeek + Llama + GPT-OSS con alias">
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

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Descripción general de todos los proveedores, las referencias de modelos y el comportamiento de conmutación por error.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Documentación de Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    Documentación oficial de Hugging Face Inference Providers.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de la configuración.
  </Card>
</CardGroup>
