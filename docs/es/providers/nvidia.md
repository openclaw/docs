---
read_when:
    - Quieres usar modelos abiertos en OpenClaw gratis
    - Necesitas configurar NVIDIA_API_KEY
    - Quieres usar Nemotron 3 Ultra a través de NVIDIA
summary: Usa la API compatible con OpenAI de NVIDIA en OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T12:39:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA proporciona una API compatible con OpenAI en `https://integrate.api.nvidia.com/v1` para
modelos abiertos de forma gratuita. Autentícate con una clave de API de
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
establece de forma predeterminada el proveedor NVIDIA en Nemotron 3 Ultra, el modelo de razonamiento
activo de NVIDIA de 550B totales / 55B activos para trabajo agéntico de contexto largo.

## Primeros pasos

<Steps>
  <Step title="Get your API key">
    Crea una clave de API en [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
Si pasas `--nvidia-api-key` en lugar de la variable de entorno, el valor queda en el historial
del shell y en la salida de `ps`. Prefiere la variable de entorno `NVIDIA_API_KEY` cuando
sea posible.
</Warning>

Para una configuración no interactiva, también puedes pasar la clave directamente:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## Ejemplo de configuración

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## Catálogo destacado

Cuando hay una clave de API de NVIDIA configurada, las rutas de configuración y selección de modelos de OpenClaw
intentan usar el catálogo público de modelos destacados de NVIDIA desde
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` y
almacenan en caché el resultado clasificado durante 24 horas. Por lo tanto, los nuevos modelos destacados de build.nvidia.com
aparecen en las superficies de configuración y selección de modelos sin esperar una
versión de OpenClaw. Cuando la fuente en vivo está disponible, el primer modelo devuelto es
la opción predeterminada que se muestra durante la configuración de NVIDIA.

La obtención usa una política fija de host HTTPS para `assets.ngc.nvidia.com`. Si no hay
ninguna clave de API de NVIDIA configurada, o si ese catálogo público no está disponible o
está mal formado, OpenClaw recurre al catálogo incluido y al valor predeterminado incluido a continuación.

## Nemotron 3 Ultra

Nemotron 3 Ultra es el modelo NVIDIA predeterminado en OpenClaw. La página de compilación de NVIDIA para
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
lo enumera como un endpoint gratuito disponible con una especificación de contexto de 1M de tokens.
El catálogo incluido registra una salida máxima de 16.384 tokens para coincidir con la solicitud de ejemplo actual
compatible con OpenAI de NVIDIA para el endpoint alojado.

Usa Ultra para el valor predeterminado de NVIDIA con mayor capacidad. Mantén Super seleccionado cuando
quieras la opción más pequeña de Nemotron 3, o elige uno de los modelos de terceros
alojados en el catálogo de NVIDIA cuando su contexto, latencia o comportamiento encajen mejor.
La fila Ultra incluida envía `chat_template_kwargs.enable_thinking: false` y
`force_nonempty_content: true` de forma predeterminada para que la salida normal del chat permanezca en la
respuesta visible en lugar de exponer texto de razonamiento.

## Catálogo alternativo incluido

| Referencia de modelo                       | Nombre                       | Contexto  | Salida máxima | Notas                                      |
| ------------------------------------------ | ---------------------------- | --------- | ------------- | ------------------------------------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384        | Predeterminado                             |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192         | Alternativa destacada                      |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192         | Alternativa destacada                      |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192         | Alternativa destacada                      |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192         | Alternativa destacada                      |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192         | Obsoleto, compatibilidad de actualización  |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192         | Obsoleto, compatibilidad de actualización  |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    El proveedor se habilita automáticamente cuando la variable de entorno `NVIDIA_API_KEY` está configurada.
    No se requiere configuración explícita del proveedor más allá de la clave.
  </Accordion>

  <Accordion title="Catalog and pricing">
    OpenClaw prefiere el catálogo público de modelos destacados de NVIDIA cuando la autenticación de NVIDIA está
    configurada y lo almacena en caché durante 24 horas. El catálogo alternativo incluido es estático
    y mantiene referencias distribuidas obsoletas para compatibilidad de actualización. Los costos tienen como valor predeterminado
    `0` en el código fuente porque NVIDIA actualmente ofrece acceso gratuito a la API para los
    modelos enumerados.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA usa el endpoint estándar de completions `/v1`. Cualquier herramienta compatible con OpenAI
    debería funcionar sin configuración adicional con la URL base de NVIDIA.
  </Accordion>

  <Accordion title="Nemotron 3 Ultra reasoning params">
    La solicitud de ejemplo de Ultra de NVIDIA usa `chat_template_kwargs.enable_thinking`
    y `reasoning_budget` para la salida de razonamiento. La fila Ultra incluida de OpenClaw
    deshabilita el pensamiento de plantilla de forma predeterminada para el uso normal de chat. Si necesitas
    optar por la salida de razonamiento de NVIDIA o forzar otros campos de solicitud específicos de NVIDIA,
    configura parámetros por modelo y mantén las anulaciones específicas del proveedor limitadas al
    modelo de NVIDIA:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` es la anulación final del cuerpo de solicitud compatible con OpenAI, así que
    úsala solo para campos que NVIDIA documente para el endpoint seleccionado.

  </Accordion>

  <Accordion title="Slow custom provider responses">
    Algunos modelos personalizados alojados por NVIDIA pueden tardar más que el watchdog de inactividad predeterminado
    del modelo antes de emitir el primer fragmento de respuesta. Para entradas personalizadas del proveedor NVIDIA,
    aumenta el timeout del proveedor en lugar de aumentar el timeout de todo el runtime
    del agente:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
Los modelos de NVIDIA actualmente son gratuitos. Consulta
[build.nvidia.com](https://build.nvidia.com/) para conocer la disponibilidad más reciente y
los detalles de límites de tasa.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Configuration reference" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
