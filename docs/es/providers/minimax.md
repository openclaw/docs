---
read_when:
    - Quieres usar modelos de MiniMax en OpenClaw
    - Necesitas una guía de configuración de MiniMax
summary: Usa modelos de MiniMax en OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-12T23:31:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9c89faf57384feb66cda30934000e5746996f24b59122db309318f42c22389
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

El proveedor MiniMax de OpenClaw usa por defecto **MiniMax M2.7**.

MiniMax también proporciona:

- Síntesis de voz integrada mediante T2A v2
- Comprensión de imágenes integrada mediante `MiniMax-VL-01`
- Generación de música integrada mediante `music-2.5+`
- `web_search` integrado mediante la API de búsqueda Coding Plan de MiniMax

Separación de proveedores:

| Provider ID      | Auth    | Capabilities                                                    |
| ---------------- | ------- | --------------------------------------------------------------- |
| `minimax`        | Clave de API | Texto, generación de imágenes, comprensión de imágenes, speech, búsqueda web |
| `minimax-portal` | OAuth   | Texto, generación de imágenes, comprensión de imágenes          |

## Línea de modelos

| Model                    | Type             | Description                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Modelo de razonamiento alojado predeterminado |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Nivel de razonamiento M2.7 más rápido    |
| `MiniMax-VL-01`          | Vision           | Modelo de comprensión de imágenes        |
| `image-01`               | Image generation | Texto a imagen y edición de imagen a imagen |
| `music-2.5+`             | Music generation | Modelo de música predeterminado          |
| `music-2.5`              | Music generation | Nivel anterior de generación de música   |
| `music-2.0`              | Music generation | Nivel heredado de generación de música   |
| `MiniMax-Hailuo-2.3`     | Video generation | Flujos de texto a video y de referencia de imagen |

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Ideal para:** configuración rápida con MiniMax Coding Plan mediante OAuth, sin necesidad de clave de API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Esto autentica contra `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Esto autentica contra `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Las configuraciones con OAuth usan el id de proveedor `minimax-portal`. Las referencias de modelo siguen la forma `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Enlace de referidos para MiniMax Coding Plan (10% de descuento): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Ideal para:** MiniMax alojado con API compatible con Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Esto configura `api.minimax.io` como la URL base.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Esto configura `api.minimaxi.com` como la URL base.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Ejemplo de configuración

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    En la ruta de streaming compatible con Anthropic, OpenClaw desactiva MiniMax thinking de forma predeterminada a menos que configures `thinking` explícitamente tú mismo. El endpoint de streaming de MiniMax emite `reasoning_content` en fragmentos delta con estilo OpenAI en lugar de bloques nativos de thinking de Anthropic, lo que puede filtrar razonamiento interno a la salida visible si se deja habilitado de forma implícita.
    </Warning>

    <Note>
    Las configuraciones con clave de API usan el id de proveedor `minimax`. Las referencias de modelo siguen la forma `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configurar mediante `openclaw configure`

Usa el asistente interactivo de configuración para establecer MiniMax sin editar JSON:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    Elige **Model/auth** en el menú.
  </Step>
  <Step title="Choose a MiniMax auth option">
    Elige una de las opciones disponibles de MiniMax:

    | Auth choice | Description |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internacional (Coding Plan) |
    | `minimax-cn-oauth` | OAuth de China (Coding Plan) |
    | `minimax-global-api` | Clave de API internacional |
    | `minimax-cn-api` | Clave de API de China |

  </Step>
  <Step title="Pick your default model">
    Selecciona tu modelo predeterminado cuando se te solicite.
  </Step>
</Steps>

## Capacidades

### Generación de imágenes

El Plugin de MiniMax registra el modelo `image-01` para la herramienta `image_generate`. Admite:

- **Generación de texto a imagen** con control de relación de aspecto
- **Edición de imagen a imagen** (referencia de sujeto) con control de relación de aspecto
- Hasta **9 imágenes de salida** por solicitud
- Hasta **1 imagen de referencia** por solicitud de edición
- Relaciones de aspecto compatibles: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Para usar MiniMax para generación de imágenes, establécelo como proveedor de generación de imágenes:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

El plugin usa la misma autenticación `MINIMAX_API_KEY` u OAuth que los modelos de texto. No se necesita configuración adicional si MiniMax ya está configurado.

Tanto `minimax` como `minimax-portal` registran `image_generate` con el mismo
modelo `image-01`. Las configuraciones con clave de API usan `MINIMAX_API_KEY`; las configuraciones con OAuth pueden usar
en su lugar la ruta de autenticación integrada `minimax-portal`.

Cuando la incorporación o la configuración con clave de API escribe entradas explícitas `models.providers.minimax`,
OpenClaw materializa `MiniMax-M2.7` y
`MiniMax-M2.7-highspeed` con `input: ["text", "image"]`.

El catálogo de texto integrado de MiniMax en sí mismo sigue siendo metadatos solo de texto hasta
que exista esa configuración explícita del proveedor. La comprensión de imágenes se expone por separado
a través del proveedor multimedia `MiniMax-VL-01` propiedad del plugin.

<Note>
Consulta [Generación de imágenes](/es/tools/image-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de failover.
</Note>

### Generación de música

El plugin `minimax` integrado también registra la generación de música mediante la herramienta compartida
`music_generate`.

- Modelo de música predeterminado: `minimax/music-2.5+`
- También admite `minimax/music-2.5` y `minimax/music-2.0`
- Controles del prompt: `lyrics`, `instrumental`, `durationSeconds`
- Formato de salida: `mp3`
- Las ejecuciones con respaldo de sesión se desacoplan mediante el flujo compartido de tarea/estado, incluido `action: "status"`

Para usar MiniMax como proveedor de música predeterminado:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
Consulta [Generación de música](/es/tools/music-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de failover.
</Note>

### Generación de video

El plugin `minimax` integrado también registra la generación de video mediante la herramienta compartida
`video_generate`.

- Modelo de video predeterminado: `minimax/MiniMax-Hailuo-2.3`
- Modos: texto a video y flujos de referencia de una sola imagen
- Admite `aspectRatio` y `resolution`

Para usar MiniMax como proveedor de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Consulta [Generación de video](/es/tools/video-generation) para ver parámetros compartidos de herramientas, selección de proveedor y comportamiento de failover.
</Note>

### Comprensión de imágenes

El plugin MiniMax registra la comprensión de imágenes por separado del
catálogo de texto:

| Provider ID      | Default image model |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Por eso el enrutamiento automático de multimedia puede usar la comprensión de imágenes de MiniMax incluso
cuando el catálogo integrado del proveedor de texto todavía muestra referencias de chat M2.7 solo de texto.

### Búsqueda web

El plugin MiniMax también registra `web_search` mediante la API de búsqueda
Coding Plan de MiniMax.

- Id del proveedor: `minimax`
- Resultados estructurados: títulos, URL, fragmentos, consultas relacionadas
- Variable de entorno preferida: `MINIMAX_CODE_PLAN_KEY`
- Alias de entorno aceptado: `MINIMAX_CODING_API_KEY`
- Fallback de compatibilidad: `MINIMAX_API_KEY` cuando ya apunta a un token de coding-plan
- Reutilización de región: `plugins.entries.minimax.config.webSearch.region`, luego `MINIMAX_API_HOST`, y después las URL base del proveedor MiniMax
- La búsqueda se mantiene en el id de proveedor `minimax`; la configuración OAuth CN/global aún puede dirigir indirectamente la región mediante `models.providers.minimax-portal.baseUrl`

La configuración vive en `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consulta [MiniMax Search](/es/tools/minimax-search) para ver la configuración y el uso completos de la búsqueda web.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Opciones de configuración">
    | Option | Description |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Prefiere `https://api.minimax.io/anthropic` (compatible con Anthropic); `https://api.minimax.io/v1` es opcional para payloads compatibles con OpenAI |
    | `models.providers.minimax.api` | Prefiere `anthropic-messages`; `openai-completions` es opcional para payloads compatibles con OpenAI |
    | `models.providers.minimax.apiKey` | Clave de API de MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Define `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Alias de modelos que quieres en la allowlist |
    | `models.mode` | Mantén `merge` si quieres agregar MiniMax junto con los integrados |
  </Accordion>

  <Accordion title="Valores predeterminados de thinking">
    En `api: "anthropic-messages"`, OpenClaw inyecta `thinking: { type: "disabled" }` a menos que thinking ya esté configurado explícitamente en params/config.

    Esto evita que el endpoint de streaming de MiniMax emita `reasoning_content` en fragmentos delta con estilo OpenAI, lo que filtraría razonamiento interno a la salida visible.

  </Accordion>

  <Accordion title="Modo rápido">
    `/fast on` o `params.fastMode: true` reescribe `MiniMax-M2.7` a `MiniMax-M2.7-highspeed` en la ruta de stream compatible con Anthropic.
  </Accordion>

  <Accordion title="Ejemplo de fallback">
    **Ideal para:** mantener como principal tu modelo más potente de última generación y usar MiniMax M2.7 como fallback. El ejemplo siguiente usa Opus como principal concreto; cámbialo por tu modelo principal de última generación preferido.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Detalles de uso de Coding Plan">
    - API de uso de Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (requiere una clave de coding plan).
    - OpenClaw normaliza el uso de coding-plan de MiniMax al mismo formato de visualización de `% restante` usado por otros proveedores. Los campos sin procesar de MiniMax `usage_percent` / `usagePercent` representan cuota restante, no cuota consumida, por lo que OpenClaw los invierte. Los campos basados en conteo tienen prioridad cuando están presentes.
    - Cuando la API devuelve `model_remains`, OpenClaw prefiere la entrada del modelo de chat, deriva la etiqueta de ventana a partir de `start_time` / `end_time` cuando es necesario e incluye el nombre del modelo seleccionado en la etiqueta del plan para que las ventanas de coding-plan sean más fáciles de distinguir.
    - Las instantáneas de uso tratan `minimax`, `minimax-cn` y `minimax-portal` como la misma superficie de cuota de MiniMax, y priorizan el OAuth almacenado de MiniMax antes de recurrir a las variables de entorno de clave de Coding Plan.
  </Accordion>
</AccordionGroup>

## Notas

- Las referencias de modelo siguen la ruta de autenticación:
  - Configuración con clave de API: `minimax/<model>`
  - Configuración con OAuth: `minimax-portal/<model>`
- Modelo de chat predeterminado: `MiniMax-M2.7`
- Modelo de chat alternativo: `MiniMax-M2.7-highspeed`
- La incorporación y la configuración directa con clave de API escriben definiciones explícitas de modelo con `input: ["text", "image"]` para ambas variantes de M2.7
- El catálogo integrado del proveedor actualmente expone las referencias de chat como metadatos solo de texto hasta que exista una configuración explícita del proveedor MiniMax
- Actualiza los valores de precios en `models.json` si necesitas un seguimiento exacto de costes
- Usa `openclaw models list` para confirmar el id de proveedor actual y luego cambia con `openclaw models set minimax/MiniMax-M2.7` o `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Enlace de referidos para MiniMax Coding Plan (10% de descuento): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Consulta [Proveedores de modelos](/es/concepts/model-providers) para ver las reglas de proveedores.
</Note>

## Solución de problemas

<AccordionGroup>
  <Accordion title='"Modelo desconocido: minimax/MiniMax-M2.7"'>
    Esto normalmente significa que el **proveedor MiniMax no está configurado** (no hay ninguna entrada de proveedor coincidente ni ninguna clave/env perfil de autenticación de MiniMax encontrada). Hay una corrección para esta detección en **2026.1.12**. Soluciónalo de una de estas formas:

    - Actualiza a **2026.1.12** (o ejecuta desde la rama `main` del código fuente) y luego reinicia el Gateway.
    - Ejecuta `openclaw configure` y selecciona una opción de autenticación de **MiniMax**, o
    - Agrega manualmente el bloque coincidente `models.providers.minimax` o `models.providers.minimax-portal`, o
    - Establece `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un perfil de autenticación de MiniMax para que se pueda inyectar el proveedor correspondiente.

    Asegúrate de que el id del modelo distingue entre mayúsculas y minúsculas:

    - Ruta con clave de API: `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed`
    - Ruta con OAuth: `minimax-portal/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7-highspeed`

    Luego vuelve a comprobar con:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imágenes y selección de proveedor.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="MiniMax Search" href="/es/tools/minimax-search" icon="magnifying-glass">
    Configuración de búsqueda web mediante MiniMax Coding Plan.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
