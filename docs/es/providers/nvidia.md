---
read_when:
    - Quieres usar modelos abiertos en OpenClaw gratis
    - Debe configurar NVIDIA_API_KEY
    - Quieres usar Nemotron 3 Ultra a través de NVIDIA
summary: Usar la API compatible con OpenAI de NVIDIA en OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-05T11:36:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3300395fdaf9baf22476f9b4d5a5b217ddab1aa10042c5959ffa059c3a258de4
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA ofrece modelos abiertos gratis mediante una API compatible con OpenAI en
`https://integrate.api.nvidia.com/v1`, autenticada con una clave de API de
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
configura de forma predeterminada el proveedor NVIDIA en Nemotron 3 Ultra, el
modelo de razonamiento de NVIDIA de 550B totales / 55B activos para trabajo
agéntico de contexto largo.

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
  <Step title="Configura un modelo NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

Para una configuración no interactiva, pasa la clave directamente:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` deja la clave en el historial del shell y en la salida de `ps`.
Prefiere la variable de entorno `NVIDIA_API_KEY` cuando sea posible.
</Warning>

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

Cuando se configura una clave de API de NVIDIA, las rutas de configuración y
selección de modelos obtienen el catálogo público de modelos destacados de
NVIDIA desde
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` y
almacenan el resultado en caché durante 24 horas (las primeras 32 entradas,
importadas como filas gratuitas de entrada de texto). Por lo tanto, los nuevos
modelos destacados de build.nvidia.com aparecen en las superficies de
configuración y selección de modelos sin esperar a una versión de OpenClaw.
Cuando la fuente en vivo está disponible, el primer modelo devuelto es la opción
preseleccionada durante la configuración de NVIDIA.

La obtención usa una política fija de host HTTPS para `assets.ngc.nvidia.com`.
Si no hay una clave de API de NVIDIA configurada, o si la fuente no está
disponible o tiene formato incorrecto, OpenClaw recurre al catálogo incluido y al
valor predeterminado incluido que se muestran abajo.

## Nemotron 3 Ultra

Nemotron 3 Ultra es el modelo NVIDIA predeterminado en OpenClaw. La página de
compilación de NVIDIA para
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
lo enumera como un endpoint gratuito disponible con una especificación de
contexto de 1M de tokens. El catálogo incluido registra una salida máxima de
16,384 tokens para coincidir con la solicitud de ejemplo actual compatible con
OpenAI de NVIDIA para el endpoint alojado.

La fila Ultra incluida envía
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`
de forma predeterminada para que la salida normal de chat permanezca en la
respuesta visible en lugar de exponer texto de razonamiento.

Usa Ultra para el valor predeterminado de NVIDIA con mayor capacidad. Mantén
Super seleccionado cuando quieras la opción Nemotron 3 más pequeña, o elige uno
de los modelos de terceros alojados en el catálogo de NVIDIA cuando su contexto,
latencia o comportamiento encajen mejor.

## Catálogo de respaldo incluido

| Ref. de modelo                              | Nombre                       | Contexto  | Salida máxima | Notas                                      |
| ------------------------------------------ | ---------------------------- | --------- | ------------- | ------------------------------------------ |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384        | Predeterminado                             |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192         |                                            |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192         |                                            |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192         |                                            |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192         |                                            |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192         | Obsoleto; usa `minimaxai/minimax-m2.7`     |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192         | Obsoleto; usa `z-ai/glm-5.1`               |

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Comportamiento de activación automática">
    El proveedor se activa automáticamente cuando la variable de entorno
    `NVIDIA_API_KEY` está configurada o se almacenó una clave durante la
    incorporación. No se requiere configuración explícita del proveedor más allá
    de la clave.
  </Accordion>

  <Accordion title="Catálogo y precios">
    OpenClaw prefiere el catálogo público de modelos destacados de NVIDIA cuando
    la autenticación de NVIDIA está configurada y lo almacena en caché durante 24
    horas. El catálogo de respaldo incluido es estático y conserva refs
    obsoletas enviadas para compatibilidad de actualización. Los costos tienen
    el valor predeterminado `0` en el código fuente, ya que NVIDIA actualmente
    ofrece acceso gratuito a la API para los modelos enumerados.
  </Accordion>

  <Accordion title="Endpoint compatible con OpenAI">
    OpenClaw se comunica con NVIDIA mediante el adaptador `openai-completions`
    contra la ruta estándar `/v1` de completions de chat. Cualquier herramienta
    compatible con OpenAI debería funcionar directamente con la URL base de
    NVIDIA.
  </Accordion>

  <Accordion title="Parámetros de razonamiento de Nemotron 3 Ultra">
    La solicitud de ejemplo de Ultra de NVIDIA usa
    `chat_template_kwargs.enable_thinking` y `reasoning_budget` para la salida de
    razonamiento. La fila Ultra incluida de OpenClaw desactiva el pensamiento de
    plantilla de forma predeterminada para el uso normal de chat. Si necesitas
    optar por la salida de razonamiento de NVIDIA o forzar otros campos de
    solicitud específicos de NVIDIA, configura parámetros por modelo y mantén las
    sobrescrituras específicas del proveedor limitadas al modelo NVIDIA:

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

    `params.chat_template_kwargs` se fusiona con cualquier
    `chat_template_kwargs` que ya esté en la solicitud en lugar de reemplazar el
    objeto completo. `params.extra_body` es la sobrescritura final del cuerpo de
    solicitud compatible con OpenAI y sobrescribe las claves de carga útil que
    colisionen, así que úsalo solo para campos que NVIDIA documente para el
    endpoint seleccionado.

  </Accordion>

  <Accordion title="Respuestas lentas de proveedores personalizados">
    Algunos modelos personalizados alojados por NVIDIA pueden tardar más que el
    watchdog de inactividad de modelo predeterminado de ~120 s antes de emitir el
    primer fragmento de respuesta. Para entradas personalizadas del proveedor
    NVIDIA, aumenta el tiempo de espera del proveedor en lugar del tiempo de
    espera de todo el runtime del agente; `timeoutSeconds` cubre las solicitudes
    HTTP del proveedor y eleva el límite del watchdog de inactividad/stream para
    ese proveedor:

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
[build.nvidia.com](https://build.nvidia.com/) para ver la disponibilidad más
reciente y los detalles de límites de tasa.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, refs de modelo y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
