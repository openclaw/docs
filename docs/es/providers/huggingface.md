---
read_when:
    - Quieres usar Hugging Face Inference con OpenClaw
    - Necesitas la variable de entorno del token de HF o la opción de autenticación de la CLI
summary: Configuración de Hugging Face Inference (autenticación + selección de modelo)
title: Hugging Face (inference)
x-i18n:
    generated_at: "2026-04-24T05:44:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93b3049e8d42787acba12ec3ddf70603159251dae1d870047f8ffc9242f202a5
    source_path: providers/huggingface.md
    workflow: 15
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) ofrecen chat completions compatibles con OpenAI a través de una única API de router. Obtienes acceso a muchos modelos (DeepSeek, Llama y más) con un solo token. OpenClaw usa el **endpoint compatible con OpenAI** (solo chat completions); para texto a imagen, embeddings o speech usa directamente los [clientes de inferencia de HF](https://huggingface.co/docs/api-inference/quicktour).

- Proveedor: `huggingface`
- Auth: `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN` (token de granularidad fina con **Make calls to Inference Providers**)
- API: compatible con OpenAI (`https://router.huggingface.co/v1`)
- Facturación: un único token de HF; el [precio](https://huggingface.co/docs/inference-providers/pricing) sigue las tarifas del proveedor con un nivel gratuito.

## Primeros pasos

<Steps>
  <Step title="Crear un token de granularidad fina">
    Ve a [Hugging Face Settings Tokens](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) y crea un nuevo token de granularidad fina.

    <Warning>
    El token debe tener habilitado el permiso **Make calls to Inference Providers** o las solicitudes de API serán rechazadas.
    </Warning>

  </Step>
  <Step title="Ejecutar la incorporación">
    Elige **Hugging Face** en el desplegable de proveedores y luego introduce tu clave API cuando se te solicite:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Seleccionar un modelo predeterminado">
    En el desplegable **Default Hugging Face model**, elige el modelo que quieras. La lista se carga desde la API de Inference cuando tienes un token válido; de lo contrario se muestra una lista integrada. Tu elección se guarda como modelo predeterminado.

    También puedes establecer o cambiar el modelo predeterminado más tarde en la configuración:

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
  <Step title="Verificar que el modelo está disponible">
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

Esto establecerá `huggingface/deepseek-ai/DeepSeek-R1` como modelo predeterminado.

## IDs de modelo

Las referencias de modelo usan la forma `huggingface/<org>/<model>` (IDs estilo Hub). La lista de abajo proviene de **GET** `https://router.huggingface.co/v1/models`; tu catálogo puede incluir más.

| Modelo                 | Ref (anteponer `huggingface/`)      |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

<Tip>
Puedes agregar `:fastest` o `:cheapest` a cualquier id de modelo. Establece tu orden predeterminado en [Inference Provider settings](https://hf.co/settings/inference-providers); consulta [Inference Providers](https://huggingface.co/docs/inference-providers) y **GET** `https://router.huggingface.co/v1/models` para ver la lista completa.
</Tip>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Descubrimiento de modelos y desplegable de incorporación">
    OpenClaw descubre modelos llamando directamente al **endpoint de Inference**:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    (Opcional: envía `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` o `$HF_TOKEN` para la lista completa; algunos endpoints devuelven un subconjunto sin autenticación). La respuesta es de estilo OpenAI `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    Cuando configuras una clave API de Hugging Face (mediante incorporación, `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN`), OpenClaw usa este GET para descubrir modelos disponibles de chat completion. Durante la **configuración interactiva**, después de introducir tu token ves un desplegable **Default Hugging Face model** rellenado con esa lista (o con el catálogo integrado si la solicitud falla). En tiempo de ejecución (por ejemplo al iniciar el Gateway), cuando hay una clave presente, OpenClaw vuelve a llamar a **GET** `https://router.huggingface.co/v1/models` para actualizar el catálogo. La lista se fusiona con un catálogo integrado (para metadatos como ventana de contexto y coste). Si la solicitud falla o no se establece ninguna clave, solo se usa el catálogo integrado.

  </Accordion>

  <Accordion title="Nombres de modelo, aliases y sufijos de política">
    - **Nombre desde API:** el nombre visible del modelo se **hidrata desde GET /v1/models** cuando la API devuelve `name`, `title` o `display_name`; en caso contrario se deriva del id del modelo (por ejemplo `deepseek-ai/DeepSeek-R1` pasa a ser "DeepSeek R1").
    - **Sobrescribir nombre visible:** puedes establecer una etiqueta personalizada por modelo en la configuración para que aparezca como quieras en la CLI y la IU:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (rápido)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (barato)" },
          },
        },
      },
    }
    ```

    - **Sufijos de política:** la documentación y las ayudas integradas de Hugging Face en OpenClaw actualmente tratan estos dos sufijos como variantes integradas de política:
      - **`:fastest`** — mayor rendimiento.
      - **`:cheapest`** — menor coste por token de salida.

      Puedes agregarlos como entradas separadas en `models.providers.huggingface.models` o establecer `model.primary` con el sufijo. También puedes definir tu orden predeterminado de proveedor en [Inference Provider settings](https://hf.co/settings/inference-providers) (sin sufijo = usar ese orden).

    - **Fusión de configuración:** las entradas existentes en `models.providers.huggingface.models` (por ejemplo en `models.json`) se conservan cuando se fusiona la configuración. Así que cualquier `name`, `alias` u opción de modelo personalizada que establezcas ahí se preserva.

  </Accordion>

  <Accordion title="Entorno y configuración del daemon">
    Si el Gateway se ejecuta como daemon (launchd/systemd), asegúrate de que `HUGGINGFACE_HUB_TOKEN` o `HF_TOKEN` esté disponible para ese proceso (por ejemplo, en `~/.openclaw/.env` o mediante `env.shellEnv`).

    <Note>
    OpenClaw acepta tanto `HUGGINGFACE_HUB_TOKEN` como `HF_TOKEN` como aliases de variable de entorno. Cualquiera de los dos funciona; si ambos están definidos, `HUGGINGFACE_HUB_TOKEN` tiene prioridad.
    </Note>

  </Accordion>

  <Accordion title="Configuración: DeepSeek R1 con fallback a Qwen">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/Qwen/Qwen3-8B"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Configuración: Qwen con variantes cheapest y fastest">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen3-8B" },
          models: {
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
            "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (más barato)" },
            "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (más rápido)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Configuración: DeepSeek + Llama + GPT-OSS con aliases">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Configuración: varios Qwen y DeepSeek con sufijos de política">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
          models: {
            "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
            "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (barato)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (rápido)" },
            "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Resumen de todos los proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Selección de modelos" href="/es/concepts/models" icon="brain">
    Cómo elegir y configurar modelos.
  </Card>
  <Card title="Documentación de Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    Documentación oficial de Hugging Face Inference Providers.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración.
  </Card>
</CardGroup>
