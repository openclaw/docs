---
read_when:
    - Quieres usar modelos abiertos en OpenClaw de forma gratuita
    - Necesitas configurar NVIDIA_API_KEY
    - Quieres usar Nemotron 3 Ultra a través de NVIDIA
summary: Usa la API compatible con OpenAI de NVIDIA en OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-11T23:27:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA ofrece modelos abiertos de forma gratuita mediante una API compatible con OpenAI en
`https://integrate.api.nvidia.com/v1`, autenticada con una clave de API de
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
configura de forma predeterminada el proveedor NVIDIA para usar Nemotron 3 Ultra, el modelo de razonamiento de NVIDIA
con 550 000 millones de parámetros totales y 55 000 millones activos, diseñado para trabajo agéntico con contextos extensos.

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
  <Step title="Establece un modelo de NVIDIA">
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
`--nvidia-api-key` deja la clave en el historial del shell y en la salida de `ps`. Siempre que sea posible, usa
la variable de entorno `NVIDIA_API_KEY`.
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

Cuando se configura una clave de API de NVIDIA, las rutas de configuración y selección de modelos obtienen
el catálogo público de modelos destacados de NVIDIA desde
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` y
almacenan el resultado en caché durante 24 horas (las primeras 32 entradas, importadas como filas gratuitas
de entrada de texto). Por lo tanto, los nuevos modelos destacados de build.nvidia.com aparecen en las superficies
de configuración y selección de modelos sin tener que esperar a una versión de OpenClaw. Cuando la fuente
en vivo está disponible, el primer modelo devuelto es la opción preseleccionada
durante la configuración de NVIDIA.

La obtención utiliza una política fija de host HTTPS para `assets.ngc.nvidia.com`. Si no se
configuró ninguna clave de API de NVIDIA, o si la fuente no está disponible o tiene un formato incorrecto,
OpenClaw recurre al catálogo incluido y al valor predeterminado incluido que se muestran a continuación.

## Nemotron 3 Ultra

Nemotron 3 Ultra es el modelo de NVIDIA predeterminado en OpenClaw. La página de build de NVIDIA para
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
lo presenta como un endpoint gratuito disponible con una especificación de contexto de 1 millón de tokens.

La fila incluida de Ultra envía
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`
de forma predeterminada para que la salida normal del chat permanezca en la respuesta visible en lugar de
exponer el texto de razonamiento.

Usa Ultra como la opción predeterminada de NVIDIA con mayor capacidad. Mantén Super seleccionado cuando
quieras la opción Nemotron 3 más pequeña, o elige uno de los modelos de terceros
alojados en el catálogo de NVIDIA cuando su contexto, latencia o comportamiento se adapte mejor.

## Catálogo alternativo incluido

Las filas seleccionables incluidas son una instantánea del catálogo de modelos destacados de NVIDIA. Las filas de
compatibilidad obsoletas siguen siendo resolubles mediante la referencia exacta, pero no aparecen en los selectores
de modelos.

| Referencia del modelo                      | Nombre                | Contexto  | Salida máxima |
| ------------------------------------------ | --------------------- | --------- | ------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192         |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192         |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192         |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192         |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192         |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384        |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384        |

El catálogo completo de compatibilidad también conserva estas referencias publicadas para las configuraciones
existentes: `nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`,
`nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` y
`nvidia/minimaxai/minimax-m2.7`. Siguen disponibles mediante su referencia exacta, pero
nunca aparecen durante la incorporación ni en los selectores de modelos.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Comportamiento de activación automática">
    El proveedor se activa automáticamente cuando se establece la variable de entorno `NVIDIA_API_KEY`
    o cuando se almacenó una clave durante la incorporación. No se requiere ninguna configuración explícita del proveedor
    además de la clave.
  </Accordion>

  <Accordion title="Catálogo y precios">
    OpenClaw da preferencia al catálogo público de modelos destacados de NVIDIA cuando se configura la autenticación de NVIDIA
    y lo almacena en caché durante 24 horas. La alternativa seleccionable incluida es una
    instantánea estática del catálogo de modelos destacados de NVIDIA; las filas de compatibilidad obsoletas
    por referencia exacta se ocultan de los selectores de modelos. Los costos tienen un valor predeterminado de `0` en
    el código fuente porque NVIDIA ofrece actualmente acceso gratuito a la API para los modelos indicados.
  </Accordion>

  <Accordion title="Endpoint compatible con OpenAI">
    OpenClaw se comunica con NVIDIA mediante el adaptador `openai-completions` a través de la
    ruta estándar `/v1` de finalizaciones de chat. Cualquier herramienta compatible con OpenAI debería
    funcionar directamente con la URL base de NVIDIA.
  </Accordion>

  <Accordion title="Parámetros de razonamiento de Nemotron 3 Ultra">
    La solicitud de ejemplo de Ultra de NVIDIA utiliza `chat_template_kwargs.enable_thinking`
    y `reasoning_budget` para la salida de razonamiento. La fila incluida de Ultra de OpenClaw
    desactiva de forma predeterminada el razonamiento de la plantilla para el uso normal del chat. Si necesitas
    habilitar la salida de razonamiento de NVIDIA o forzar otros campos de solicitud
    específicos de NVIDIA, establece parámetros por modelo y limita las anulaciones específicas del proveedor
    al modelo de NVIDIA:

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

    `params.chat_template_kwargs` se combina con cualquier `chat_template_kwargs`
    que ya esté presente en la solicitud, en lugar de reemplazar el objeto completo.
    `params.extra_body` es la anulación final del cuerpo de la solicitud compatible con OpenAI
    y sobrescribe las claves de la carga útil que coincidan; por lo tanto, úsalo solo para los campos que NVIDIA
    documenta para el endpoint seleccionado.

  </Accordion>

  <Accordion title="Respuestas lentas de proveedores personalizados">
    Algunos modelos personalizados alojados por NVIDIA pueden tardar más que los aproximadamente 120 segundos predeterminados
    del supervisor de inactividad del modelo antes de emitir el primer fragmento de respuesta. Para las entradas
    personalizadas del proveedor NVIDIA, aumenta el tiempo de espera del proveedor en lugar del tiempo de espera de todo
    el entorno de ejecución del agente; `timeoutSeconds` abarca las solicitudes HTTP del proveedor y
    eleva el límite del supervisor de inactividad o transmisión para ese proveedor:

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
Actualmente, los modelos de NVIDIA se pueden usar de forma gratuita. Consulta
[build.nvidia.com](https://build.nvidia.com/) para conocer la disponibilidad más reciente y
los detalles de los límites de uso.
</Tip>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Selección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
