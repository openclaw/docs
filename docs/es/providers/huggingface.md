---
read_when:
    - Quieres usar Hugging Face Inference con OpenClaw
    - Se necesita la variable de entorno del token de HF o la opción de autenticación de la CLI
summary: Configuración de Hugging Face Inference (autenticación + selección de modelo)
title: Hugging Face (inferencia)
x-i18n:
    generated_at: "2026-07-19T02:10:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 92c400b78c5ad2cc724ad4029560dccc5bc2006fdeae400fc6b58998e727e17c
    source_path: providers/huggingface.md
    workflow: 16
---

[Proveedores de inferencia de Hugging Face](https://huggingface.co/docs/inference-providers) expone un enrutador de completado de chat compatible con OpenAI para numerosos modelos alojados (DeepSeek, Llama y otros) mediante un único token. OpenClaw se comunica **únicamente con el endpoint de completado de chat**; para texto a imagen, embeddings o voz, use directamente los [clientes de inferencia de HF](https://huggingface.co/docs/api-inference/quicktour).

| Propiedad       | Valor                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Id. del proveedor | `huggingface`                                                                                                           |
| Plugin          | incluido (habilitado de forma predeterminada, sin paso de instalación)                                                          |
| Variable de entorno de autenticación | `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN` (token con permisos específicos)                                  |
| API             | Compatible con OpenAI (`https://router.huggingface.co/v1`)                                                                                      |
| Facturación     | Un único token de HF; los [precios](https://huggingface.co/docs/inference-providers/pricing) siguen las tarifas del proveedor con un nivel gratuito |

## Primeros pasos

<Steps>
  <Step title="Crear un token con permisos específicos">
    Vaya a [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) y cree un nuevo token con permisos específicos.

    <Warning>
    El token debe tener habilitado el permiso **Make calls to Inference Providers**; de lo contrario, se rechazarán las solicitudes a la API.
    </Warning>

  </Step>
  <Step title="Ejecutar la incorporación">
    Elija **Hugging Face** en la lista desplegable de proveedores y, cuando se solicite, introduzca su clave de API:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Seleccionar un modelo predeterminado">
    En la lista desplegable **Default Hugging Face model**, elija un modelo. La lista se carga desde la API de inferencia cuando el token es válido; de lo contrario, OpenClaw muestra el catálogo integrado que aparece a continuación. La selección se guarda como `agents.defaults.model.primary`:

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

Las referencias de modelos usan el formato `huggingface/<org>/<model>` (identificadores con el estilo de Hub). Catálogo integrado de OpenClaw:

| Modelo        | Referencia (con el prefijo `huggingface/`) |
| ------------- | ---------------------------------------------- |
| DeepSeek R1   | `deepseek-ai/DeepSeek-R1`                             |
| DeepSeek V3.1 | `deepseek-ai/DeepSeek-V3.1`                             |
| GPT-OSS 120B  | `openai/gpt-oss-120b`                             |

<Tip>
Cuando el token es válido, OpenClaw también detecta cualquier otro modelo mediante **GET** `https://router.huggingface.co/v1/models` durante la incorporación y el inicio del Gateway, por lo que el catálogo puede incluir muchos más modelos que los tres anteriores. Puede añadir `:fastest` o `:cheapest` a cualquier identificador de modelo; el enrutador de HF lo dirige al proveedor de inferencia correspondiente. Establezca el orden predeterminado de proveedores en [Inference Provider settings](https://hf.co/settings/inference-providers).
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Detección de modelos y lista desplegable de incorporación">
    OpenClaw detecta modelos mediante:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # o $HF_TOKEN
    ```

    La respuesta sigue el formato de OpenAI: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Con una clave configurada (mediante la incorporación, `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`), la lista desplegable **Default Hugging Face model** de la configuración interactiva se rellena desde este endpoint. Al iniciarse, el Gateway repite la misma llamada para actualizar el catálogo. Los modelos detectados se combinan con el catálogo integrado anterior (que se usa para metadatos como la ventana de contexto y el coste cuando coincide un identificador). Si la solicitud falla, no devuelve datos o no se ha establecido ninguna clave, OpenClaw recurre únicamente al catálogo integrado.

    Para deshabilitar la detección sin eliminar el proveedor:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Nombres de modelos, alias y sufijos de políticas">
    - **Nombre de la API:** los modelos detectados usan `name`, `title` o `display_name` de la API cuando están presentes; de lo contrario, OpenClaw deriva un nombre del identificador del modelo (por ejemplo, `deepseek-ai/DeepSeek-R1` se convierte en "DeepSeek R1").
    - **Anular el nombre mostrado:** establezca una etiqueta personalizada por modelo en la configuración:

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

    - **Sufijos de políticas:** `:fastest` y `:cheapest` son convenciones del enrutador de HF, no elementos que OpenClaw reescriba: el sufijo se envía literalmente como parte del identificador del modelo y el enrutador de HF selecciona el proveedor de inferencia correspondiente. Añada cada variante como una entrada independiente en `models.providers.huggingface.models` (o en `model.primary`) si desea un alias distinto para cada sufijo.
    - **Combinación de configuración:** las entradas existentes en `models.providers.huggingface.models` (por ejemplo, en `models.json`) se conservan al combinar la configuración, por lo que cualquier `name`, `alias` u opción de modelo personalizada que se establezca allí persiste entre reinicios.

  </Accordion>

  <Accordion title="Configuración del entorno y del daemon">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrese de que `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN` estén disponibles para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Note>
    OpenClaw acepta tanto `HUGGINGFACE_HUB_TOKEN` como `HF_TOKEN`. Si se establecen ambas, `HUGGINGFACE_HUB_TOKEN` tiene prioridad.
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

  <Accordion title="Configuración: DeepSeek + GPT-OSS con alias">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
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
  <Card title="Documentación de los proveedores de inferencia" href="https://huggingface.co/docs/inference-providers" icon="book">
    Documentación oficial de los proveedores de inferencia de Hugging Face.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
