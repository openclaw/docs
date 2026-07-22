---
read_when:
    - Quieres ejecutar Inkling de Thinking Machines Lab en OpenClaw
    - Quieres una API compatible con OpenAI para los modelos alojados de Baseten
summary: Configuración de Baseten para Inkling y las API de modelos alojadas
title: Baseten
x-i18n:
    generated_at: "2026-07-22T10:45:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2ccc3b5cf64b01859f9f022d7bc15a69a1cb42c87d4f914c118276c1151020de
    source_path: providers/baseten.md
    workflow: 16
---

[Las API de modelos de Baseten](https://docs.baseten.co/inference/model-apis/overview) proporcionan acceso alojado y compatible con OpenAI a modelos de frontera. El Plugin externo oficial usa descubrimiento autenticado, por lo que OpenClaw utiliza el conjunto completo de modelos habilitados para la cuenta de Baseten. Su alternativa sin conexión contiene todas las API de modelos disponibles cuando se compiló esta versión de OpenClaw.

| Propiedad                     | Valor                                                    |
| ----------------------------- | -------------------------------------------------------- |
| Id. del proveedor             | `baseten`                                       |
| Plugin                        | paquete externo oficial (`@openclaw/baseten-provider`)             |
| Variable de entorno de auth   | `BASETEN_API_KEY`                                       |
| Indicador de incorporación    | `--auth-choice baseten-api-key`                                       |
| Indicador directo de la CLI   | `--baseten-api-key <key>`                                       |
| API                           | compatible con OpenAI (`openai-completions`)               |
| URL base                      | `https://inference.baseten.co/v1`                                       |
| Modelo predeterminado         | `baseten/thinkingmachines/inkling`                                       |

## Instalar el Plugin

```bash
openclaw plugins install @openclaw/baseten-provider
openclaw gateway restart
```

## Primeros pasos

<Steps>
  <Step title="Crear una cuenta de Baseten y una clave de API">
    El plan Basic de Baseten no tiene ninguna tarifa mensual de plataforma; las llamadas a la API de modelos se cobran según el uso. Cree una clave en la [configuración de claves de API de Baseten](https://app.baseten.co/settings/api_keys) y consulte las tarifas actuales en la [página de precios](https://www.baseten.co/pricing).
  </Step>
  <Step title="Ejecutar la incorporación">
    <CodeGroup>

```bash Incorporación
openclaw onboard --auth-choice baseten-api-key
```

```bash Indicador directo
openclaw onboard --non-interactive \
  --auth-choice baseten-api-key \
  --baseten-api-key "$BASETEN_API_KEY"
```

```bash Solo entorno
export BASETEN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Verificar el catálogo en vivo">
    ```bash
    openclaw models list --provider baseten
    ```

    Con una autenticación válida, el Plugin solicita `GET /v1/models` y enumera todos los modelos devueltos para la cuenta. Sin autenticación, permanece sin conexión y usa la alternativa incluida.

  </Step>
</Steps>

## Inkling

[Inkling de Thinking Machines Lab](https://thinkingmachines.ai/news/introducing-inkling/) es el modelo predeterminado. En OpenClaw admite entrada de texto e imágenes, llamadas a herramientas, esquemas estructurados de herramientas, esfuerzo de razonamiento configurable, una ventana de contexto de 1.048M tokens y hasta 32k tokens de salida:

```json5
{
  agents: {
    defaults: {
      model: { primary: "baseten/thinkingmachines/inkling" },
    },
  },
}
```

Use `/model baseten/thinkingmachines/inkling` para cambiar un chat existente.

## Catálogo alternativo incluido

El catálogo autenticado en vivo es la fuente autoritativa. Estas filas mantienen útiles la configuración y la selección de modelos antes de que el descubrimiento se complete correctamente:

| Referencia del modelo                               | Entrada        | Contexto | Salida máxima |
| --------------------------------------------------- | -------------- | -------: | ------------: |
| `baseten/deepseek-ai/DeepSeek-V4-Pro`                                  | texto          |     262k |          262k |
| `baseten/zai-org/GLM-4.7`                                  | texto          |     200k |          200k |
| `baseten/zai-org/GLM-5`                                  | texto          |     202k |          202k |
| `baseten/zai-org/GLM-5.1`                                  | texto          |     202k |          202k |
| `baseten/zai-org/GLM-5.2`                                  | texto          |     202k |          202k |
| `baseten/thinkingmachines/inkling`                                  | texto, imagen  |   1.048M |           32k |
| `baseten/moonshotai/Kimi-K2.5`                                  | texto, imagen  |     262k |          262k |
| `baseten/moonshotai/Kimi-K2.6`                                  | texto, imagen  |     262k |          262k |
| `baseten/moonshotai/Kimi-K2.7-Code`                                  | texto, imagen  |     262k |          262k |
| `baseten/nvidia/Nemotron-120B-A12B`                                  | texto          |     202k |          202k |
| `baseten/nvidia/NVIDIA-Nemotron-3-Ultra-550B-A55B`                                  | texto          |     202k |          202k |
| `baseten/openai/gpt-oss-120b`                                  | texto          |     128k |          128k |

Todos los modelos incluidos admiten llamadas a herramientas y razonamiento. OpenClaw asigna sus niveles de pensamiento a modelos con `reasoning_effort` nativo. Los modelos GLM, Kimi y Nemotron de activación voluntaria de Baseten tienen el pensamiento desactivado de forma predeterminada; la mayoría ofrece un control binario de desactivado/activado, mientras que GLM 5.2 ofrece desactivado, alto y máximo. OpenClaw envía estas opciones mediante el control `chat_template_args.enable_thinking` de Baseten y, para GLM 5.2, mediante el parámetro validado de nivel superior `reasoning_effort`.

<Note>
Baseten puede añadir, eliminar o cambiar las API de modelos independientemente de las versiones de OpenClaw. El Plugin actualiza los identificadores de modelos, los límites de contexto, los límites de salida y los precios de entrada, entrada almacenada en caché y salida desde la API autenticada, al tiempo que conserva la política de transporte de OpenClaw específica de cada modelo.
</Note>

## Configuración manual

La mayoría de las configuraciones solo necesitan la clave de API. Para fijar explícitamente el proveedor:

```json5
{
  env: { BASETEN_API_KEY: "..." },
  agents: {
    defaults: {
      model: { primary: "baseten/thinkingmachines/inkling" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      baseten: {
        baseUrl: "https://inference.baseten.co/v1",
        apiKey: "${BASETEN_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "thinkingmachines/inkling",
            name: "Inkling",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 1048000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<Note>
Si el Gateway se ejecuta como demonio (launchd, systemd, Docker), asegúrese de que `BASETEN_API_KEY` esté disponible para ese proceso. Una clave exportada únicamente en un shell interactivo no es visible para un servicio administrado que ya está en ejecución.
</Note>

## Contenido relacionado

<CardGroup cols={2}>
  <Card title="Proveedores de modelos" href="/es/concepts/model-providers" icon="layers">
    Selección de proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Modos de pensamiento" href="/es/tools/thinking" icon="brain">
    Seleccione los niveles de esfuerzo de razonamiento de OpenClaw.
  </Card>
  <Card title="CLI de modelos" href="/es/cli/models" icon="terminal">
    Enumere, inspeccione y seleccione los modelos descubiertos.
  </Card>
  <Card title="Preguntas frecuentes sobre modelos" href="/es/help/faq-models" icon="circle-question">
    Solución de problemas de perfiles de autenticación y selección de modelos.
  </Card>
</CardGroup>
