---
read_when:
    - Quieres usar modelos abiertos en OpenClaw de forma gratuita
    - Necesitas configurar NVIDIA_API_KEY
    - Quieres usar Nemotron 3 Ultra mediante NVIDIA
summary: Usa la API de NVIDIA compatible con OpenAI en OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-07-12T14:47:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b5ac7bcc19400a661b2f2861a1dd4d2306c94e445783929e342e9184003314e9
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA ofrece modelos abiertos de forma gratuita mediante una API compatible con OpenAI en
`https://integrate.api.nvidia.com/v1`, autenticada con una clave de API de
[build.nvidia.com](https://build.nvidia.com/settings/api-keys). OpenClaw
utiliza de forma predeterminada Nemotron 3 Ultra para el proveedor NVIDIA, el modelo de
razonamiento de NVIDIA con 550B de parámetros totales / 55B activos para trabajo con agentes
y contextos extensos.

## Primeros pasos

<Steps>
  <Step title="Obtener la clave de API">
    Cree una clave de API en [build.nvidia.com](https://build.nvidia.com/settings/api-keys).
  </Step>
  <Step title="Exportar la clave y ejecutar la incorporación">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Establecer un modelo de NVIDIA">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

Para una configuración no interactiva, proporcione la clave directamente:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

<Warning>
`--nvidia-api-key` deja la clave en el historial del shell y en la salida de `ps`. Siempre que sea posible, es preferible utilizar la
variable de entorno `NVIDIA_API_KEY`.
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
almacenan el resultado en caché durante 24 horas (las primeras 32 entradas, importadas como
filas gratuitas con entrada de texto). Por lo tanto, los nuevos modelos destacados de build.nvidia.com aparecen en las superficies de configuración y
selección de modelos sin tener que esperar a una versión de OpenClaw. Cuando el
canal en vivo está disponible, el primer modelo devuelto es la opción preseleccionada
durante la configuración de NVIDIA.

La obtención utiliza una política de host HTTPS fija para `assets.ngc.nvidia.com`. Si no
se configura ninguna clave de API de NVIDIA, o si el canal no está disponible o presenta un formato incorrecto,
OpenClaw recurre al catálogo incluido y al valor predeterminado incluido que se indican a continuación.

## Nemotron 3 Ultra

Nemotron 3 Ultra es el modelo predeterminado de NVIDIA en OpenClaw. La página de compilación de NVIDIA para
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
lo enumera como un endpoint gratuito disponible con una especificación de contexto de 1M de tokens.

La fila de Ultra incluida envía
`chat_template_kwargs: { enable_thinking: false, force_nonempty_content: true }`
de forma predeterminada para que la salida normal del chat permanezca en la respuesta visible en lugar de
exponer el texto de razonamiento.

Utilice Ultra como opción predeterminada de NVIDIA con la mayor capacidad. Mantenga seleccionado Super cuando
desee la opción Nemotron 3 más pequeña, o elija uno de los modelos de terceros
alojados en el catálogo de NVIDIA cuando su contexto, latencia o comportamiento sean más adecuados.

## Catálogo alternativo incluido

Las filas seleccionables incluidas son una instantánea del catálogo de modelos destacados de NVIDIA. Las filas
de compatibilidad obsoletas siguen pudiendo resolverse mediante la referencia exacta, pero no aparecen en los
selectores de modelos.

| Referencia del modelo                      | Nombre                | Contexto  | Salida máxima |
| ------------------------------------------ | --------------------- | --------- | ------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | Nemotron 3 Ultra 550B | 1,048,576 | 8,192         |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | Nemotron 3 Super 120B | 1,000,000 | 8,192         |
| `nvidia/z-ai/glm-5.2`                      | GLM 5.2               | 202,752   | 8,192         |
| `nvidia/moonshotai/kimi-k2.6`              | Kimi K2.6             | 262,144   | 8,192         |
| `nvidia/minimaxai/minimax-m3`              | Minimax M3            | 196,608   | 8,192         |
| `nvidia/deepseek-ai/deepseek-v4-pro`       | DeepSeek V4 Pro       | 262,144   | 16,384        |
| `nvidia/qwen/qwen3.5-397b-a17b`            | Qwen3.5 397B A17B     | 262,144   | 16,384        |

El catálogo de compatibilidad completo también conserva estas referencias publicadas para las configuraciones
existentes: `nvidia/moonshotai/kimi-k2.5`, `nvidia/z-ai/glm-5.1`,
`nvidia/minimaxai/minimax-m2.5`, `nvidia/z-ai/glm5` y
`nvidia/minimaxai/minimax-m2.7`. Siguen estando disponibles mediante la referencia exacta, pero
nunca aparecen durante la incorporación ni en los selectores de modelos.

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Comportamiento de activación automática">
    El proveedor se activa automáticamente cuando se establece la variable de entorno `NVIDIA_API_KEY`
    o cuando se almacenó una clave durante la incorporación. No se requiere ninguna configuración explícita del proveedor
    aparte de la clave.
  </Accordion>

  <Accordion title="Catálogo y precios">
    OpenClaw da preferencia al catálogo público de modelos destacados de NVIDIA cuando la autenticación de NVIDIA está
    configurada y lo almacena en caché durante 24 horas. La alternativa seleccionable incluida es una
    instantánea estática del catálogo de modelos destacados de NVIDIA; las filas de compatibilidad obsoletas
    que requieren una referencia exacta se ocultan de los selectores de modelos. Los costes tienen un valor predeterminado de `0` en
    el código fuente, ya que actualmente NVIDIA ofrece acceso gratuito mediante API a los modelos enumerados.
  </Accordion>

  <Accordion title="Endpoint compatible con OpenAI">
    OpenClaw se comunica con NVIDIA mediante el adaptador `openai-completions` a través de la
    ruta estándar de finalizaciones de chat `/v1`. Cualquier herramienta compatible con OpenAI debería
    funcionar directamente con la URL base de NVIDIA.
  </Accordion>

  <Accordion title="Parámetros de razonamiento de Nemotron 3 Ultra">
    La solicitud de ejemplo de Ultra de NVIDIA utiliza `chat_template_kwargs.enable_thinking`
    y `reasoning_budget` para la salida de razonamiento. La fila de Ultra incluida en OpenClaw
    desactiva de forma predeterminada el razonamiento de la plantilla para el uso normal del chat. Si necesita
    activar la salida de razonamiento de NVIDIA o forzar otros campos de solicitud
    específicos de NVIDIA, establezca parámetros por modelo y limite las sustituciones específicas del proveedor
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
    que ya esté presente en la solicitud, en lugar de sustituir el objeto completo.
    `params.extra_body` es la sustitución final del cuerpo de la solicitud compatible con OpenAI
    y sobrescribe las claves coincidentes de la carga útil, por lo que debe utilizarse únicamente para los campos que NVIDIA
    documenta para el endpoint seleccionado.

  </Accordion>

  <Accordion title="Respuestas lentas de proveedores personalizados">
    Algunos modelos personalizados alojados por NVIDIA pueden tardar más que los ~120s predeterminados
    del mecanismo de vigilancia de inactividad del modelo antes de emitir el primer fragmento de respuesta. Para las entradas
    personalizadas del proveedor NVIDIA, aumente el tiempo de espera del proveedor en lugar del tiempo de espera de todo
    el entorno de ejecución del agente; `timeoutSeconds` abarca las solicitudes HTTP del proveedor y
    aumenta el límite del mecanismo de vigilancia de inactividad/transmisión para ese proveedor:

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
Actualmente, los modelos de NVIDIA se pueden utilizar de forma gratuita. Consulte
[build.nvidia.com](https://build.nvidia.com/) para obtener la información más reciente sobre disponibilidad y
límites de frecuencia.
</Tip>

## Temas relacionados

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
