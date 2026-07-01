---
read_when:
    - Quieres usar modelos abiertos en OpenClaw gratis
    - Necesitas configurar NVIDIA_API_KEY
    - Quieres usar Nemotron 3 Ultra a través de NVIDIA
summary: Usa la API compatible con OpenAI de NVIDIA en OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:12:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA proporciona una API compatible con OpenAI en `https://integrate.api.nvidia.com/v1` para
modelos abiertos de forma gratuita. Autentícate con una clave de API de
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
configura de forma predeterminada el proveedor NVIDIA en Nemotron 3 Ultra, el modelo de razonamiento
activo de NVIDIA con 550B totales / 55B activos para trabajo agéntico de contexto largo.

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave de API">
    Crea una clave de API en [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exporta la clave y ejecuta la incorporación">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Define un modelo NVIDIA">
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

Cuando se configura una clave de API de NVIDIA, las rutas de configuración y selección de modelos
de OpenClaw intentan usar el catálogo público de modelos destacados de NVIDIA desde
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` y
almacenan en caché el resultado clasificado durante 24 horas. Por lo tanto, los nuevos modelos destacados de build.nvidia.com
aparecen en las superficies de configuración y selección de modelos sin esperar a una
versión de OpenClaw. Cuando el feed en vivo está disponible, el primer modelo devuelto es
la opción predeterminada que se muestra durante la configuración de NVIDIA.

La obtención usa una política fija de host HTTPS para `assets.ngc.nvidia.com`. Si no
hay una clave de API de NVIDIA configurada, o si ese catálogo público no está disponible o
tiene formato incorrecto, OpenClaw recurre al catálogo incluido y al valor predeterminado incluido a continuación.

## Nemotron 3 Ultra

Nemotron 3 Ultra es el modelo NVIDIA predeterminado en OpenClaw. La página de build de NVIDIA para
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
lo enumera como un endpoint gratuito disponible con una especificación de contexto de 1M de tokens.
El catálogo incluido registra una salida máxima de 16,384 tokens para coincidir con la solicitud de ejemplo
compatible con OpenAI actual de NVIDIA para el endpoint alojado.

Usa Ultra para obtener el valor predeterminado de NVIDIA con mayor capacidad. Mantén Super seleccionado cuando
quieras la opción Nemotron 3 más pequeña, o elige uno de los modelos de terceros
alojados en el catálogo de NVIDIA cuando su contexto, latencia o comportamiento encaje mejor.
La fila Ultra incluida envía `chat_template_kwargs.enable_thinking: false` y
`force_nonempty_content: true` de forma predeterminada para que la salida normal del chat permanezca en la
respuesta visible en lugar de exponer texto de razonamiento.

## Catálogo de respaldo incluido

| Referencia del modelo                        | Nombre                       | Contexto  | Salida máxima | Notas                                      |
| -------------------------------------------- | ---------------------------- | --------- | ------------- | ------------------------------------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b`   | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384        | Predeterminado                             |
| `nvidia/nvidia/nemotron-3-super-120b-a12b`   | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192         | Respaldo destacado                         |
| `nvidia/moonshotai/kimi-k2.5`                | Kimi K2.5                    | 262,144   | 8,192         | Respaldo destacado                         |
| `nvidia/minimaxai/minimax-m2.7`              | Minimax M2.7                 | 196,608   | 8,192         | Respaldo destacado                         |
| `nvidia/z-ai/glm-5.1`                        | GLM 5.1                      | 202,752   | 8,192         | Respaldo destacado                         |
| `nvidia/minimaxai/minimax-m2.5`              | MiniMax M2.5                 | 196,608   | 8,192         | Obsoleto, compatibilidad de actualización  |
| `nvidia/z-ai/glm5`                           | GLM-5                        | 202,752   | 8,192         | Obsoleto, compatibilidad de actualización  |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Comportamiento de activación automática">
    El proveedor se activa automáticamente cuando se establece la variable de entorno `NVIDIA_API_KEY`.
    No se requiere configuración explícita del proveedor más allá de la clave.
  </Accordion>

  <Accordion title="Catálogo y precios">
    OpenClaw prefiere el catálogo público de modelos destacados de NVIDIA cuando la autenticación de NVIDIA está
    configurada y lo almacena en caché durante 24 horas. El catálogo de respaldo incluido es estático
    y conserva referencias enviadas obsoletas para compatibilidad de actualización. Los costos tienen el valor predeterminado
    `0` en el código fuente, ya que NVIDIA actualmente ofrece acceso gratuito a la API para los
    modelos enumerados.
  </Accordion>

  <Accordion title="Endpoint compatible con OpenAI">
    NVIDIA usa el endpoint estándar de finalizaciones `/v1`. Cualquier herramienta compatible con OpenAI
    debería funcionar de inmediato con la URL base de NVIDIA.
  </Accordion>

  <Accordion title="Parámetros de razonamiento de Nemotron 3 Ultra">
    La solicitud de ejemplo de Ultra de NVIDIA usa `chat_template_kwargs.enable_thinking`
    y `reasoning_budget` para la salida de razonamiento. La fila Ultra incluida de OpenClaw
    deshabilita el pensamiento de plantilla de forma predeterminada para el uso normal de chat. Si necesitas
    optar por la salida de razonamiento de NVIDIA o forzar otros campos de solicitud específicos de NVIDIA,
    establece parámetros por modelo y mantén las sobrescrituras específicas del proveedor limitadas al
    modelo NVIDIA:

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

    `params.extra_body` es la sobrescritura final del cuerpo de solicitud compatible con OpenAI, así que
    úsala solo para campos que NVIDIA documente para el endpoint seleccionado.

  </Accordion>

  <Accordion title="Respuestas lentas de proveedores personalizados">
    Algunos modelos personalizados alojados en NVIDIA pueden tardar más que el watchdog de inactividad
    predeterminado del modelo antes de emitir el primer fragmento de respuesta. Para entradas de proveedores NVIDIA
    personalizados, aumenta el tiempo de espera del proveedor en lugar de aumentar el tiempo de espera de todo el
    tiempo de ejecución del agente:

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
Los modelos NVIDIA son actualmente gratuitos. Consulta
[build.nvidia.com](https://build.nvidia.com/) para obtener los detalles más recientes de disponibilidad y
límites de tasa.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia de configuración completa para agentes, modelos y proveedores.
  </Card>
</CardGroup>
