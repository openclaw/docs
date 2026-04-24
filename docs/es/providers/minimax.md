---
read_when:
    - Quieres modelos MiniMax en OpenClaw
    - Necesitas orientación para configurar MiniMax
summary: Usar modelos MiniMax en OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-24T05:45:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: f2729e9e9f866e66a6587d6c58f6116abae2fc09a1f50e5038e1c25bed0a82f2
    source_path: providers/minimax.md
    workflow: 15
---

El proveedor MiniMax de OpenClaw usa por defecto **MiniMax M2.7**.

MiniMax también proporciona:

- Síntesis de voz integrada mediante T2A v2
- Comprensión de imágenes integrada mediante `MiniMax-VL-01`
- Generación de música integrada mediante `music-2.5+`
- `web_search` integrado mediante la API de búsqueda del plan de codificación de MiniMax

División de proveedores:

| ID del proveedor | Autenticación | Capacidades                                                    |
| ---------------- | ------------- | -------------------------------------------------------------- |
| `minimax`        | Clave API     | Texto, generación de imágenes, comprensión de imágenes, voz, búsqueda web |
| `minimax-portal` | OAuth         | Texto, generación de imágenes, comprensión de imágenes         |

## Catálogo integrado

| Modelo                   | Tipo             | Descripción                                 |
| ------------------------ | ---------------- | ------------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Modelo predeterminado de razonamiento alojado |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Nivel más rápido de razonamiento M2.7       |
| `MiniMax-VL-01`          | Visión           | Modelo de comprensión de imágenes           |
| `image-01`               | Generación de imágenes | Texto a imagen y edición de imagen a imagen |
| `music-2.5+`             | Generación de música | Modelo de música predeterminado             |
| `music-2.5`              | Generación de música | Nivel anterior de generación de música      |
| `music-2.0`              | Generación de música | Nivel heredado de generación de música      |
| `MiniMax-Hailuo-2.3`     | Generación de video | Flujos de texto a video y referencia de imagen |

## Primeros pasos

Elige tu método de autenticación preferido y sigue los pasos de configuración.

<Tabs>
  <Tab title="OAuth (plan de codificación)">
    **Ideal para:** configuración rápida con MiniMax Coding Plan mediante OAuth, sin clave API.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Ejecutar la incorporación">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Esto autentica contra `api.minimax.io`.
          </Step>
          <Step title="Verificar que el modelo está disponible">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Ejecutar la incorporación">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Esto autentica contra `api.minimaxi.com`.
          </Step>
          <Step title="Verificar que el modelo está disponible">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Las configuraciones OAuth usan el ID de proveedor `minimax-portal`. Las referencias de modelo siguen la forma `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Enlace de referido para MiniMax Coding Plan (10% de descuento): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Clave API">
    **Ideal para:** MiniMax alojado con API compatible con Anthropic.

    <Tabs>
      <Tab title="Internacional">
        <Steps>
          <Step title="Ejecutar la incorporación">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Esto configura `api.minimax.io` como la URL base.
          </Step>
          <Step title="Verificar que el modelo está disponible">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Ejecutar la incorporación">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Esto configura `api.minimaxi.com` como la URL base.
          </Step>
          <Step title="Verificar que el modelo está disponible">
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
    En la ruta de streaming compatible con Anthropic, OpenClaw desactiva por defecto el thinking de MiniMax a menos que configures explícitamente `thinking` tú mismo. El endpoint de streaming de MiniMax emite `reasoning_content` en fragmentos delta estilo OpenAI en lugar de bloques nativos de thinking de Anthropic, lo que puede filtrar el razonamiento interno a la salida visible si se deja habilitado implícitamente.
    </Warning>

    <Note>
    Las configuraciones con clave API usan el ID de proveedor `minimax`. Las referencias de modelo siguen la forma `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configurar mediante `openclaw configure`

Usa el asistente interactivo de configuración para establecer MiniMax sin editar JSON:

<Steps>
  <Step title="Iniciar el asistente">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Seleccionar modelo/autenticación">
    Elige **Model/auth** en el menú.
  </Step>
  <Step title="Elegir una opción de autenticación de MiniMax">
    Selecciona una de las opciones disponibles de MiniMax:

    | Opción de autenticación | Descripción |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internacional (plan de codificación) |
    | `minimax-cn-oauth` | OAuth China (plan de codificación) |
    | `minimax-global-api` | Clave API internacional |
    | `minimax-cn-api` | Clave API China |

  </Step>
  <Step title="Elegir tu modelo predeterminado">
    Selecciona tu modelo predeterminado cuando se te solicite.
  </Step>
</Steps>

## Capacidades

### Generación de imágenes

El Plugin MiniMax registra el modelo `image-01` para la herramienta `image_generate`. Admite:

- **Generación de texto a imagen** con control de relación de aspecto
- **Edición de imagen a imagen** (referencia de sujeto) con control de relación de aspecto
- Hasta **9 imágenes de salida** por solicitud
- Hasta **1 imagen de referencia** por solicitud de edición
- Relaciones de aspecto admitidas: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

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

El Plugin usa la misma autenticación `MINIMAX_API_KEY` u OAuth que los modelos de texto. No se necesita configuración adicional si MiniMax ya está configurado.

Tanto `minimax` como `minimax-portal` registran `image_generate` con el mismo
modelo `image-01`. Las configuraciones con clave API usan `MINIMAX_API_KEY`; las configuraciones OAuth pueden usar
en su lugar la ruta de autenticación integrada `minimax-portal`.

Cuando la incorporación o la configuración con clave API escriben entradas explícitas `models.providers.minimax`,
OpenClaw materializa `MiniMax-M2.7` y
`MiniMax-M2.7-highspeed` con `input: ["text", "image"]`.

El catálogo de texto integrado de MiniMax en sí mismo sigue siendo metadatos solo de texto hasta
que existe esa configuración explícita del proveedor. La comprensión de imágenes se expone por separado
mediante el proveedor de medios `MiniMax-VL-01` propiedad del Plugin.

<Note>
Consulta [Generación de imágenes](/es/tools/image-generation) para ver los parámetros compartidos de herramienta, selección de proveedor y comportamiento de failover.
</Note>

### Generación de música

El Plugin integrado `minimax` también registra generación de música mediante la herramienta compartida
`music_generate`.

- Modelo musical predeterminado: `minimax/music-2.5+`
- También admite `minimax/music-2.5` y `minimax/music-2.0`
- Controles del prompt: `lyrics`, `instrumental`, `durationSeconds`
- Formato de salida: `mp3`
- Las ejecuciones respaldadas por sesión se desacoplan mediante el flujo compartido de tarea/estado, incluido `action: "status"`

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
Consulta [Generación de música](/es/tools/music-generation) para ver los parámetros compartidos de herramienta, selección de proveedor y comportamiento de failover.
</Note>

### Generación de video

El Plugin integrado `minimax` también registra generación de video mediante la herramienta compartida
`video_generate`.

- Modelo de video predeterminado: `minimax/MiniMax-Hailuo-2.3`
- Modos: flujos de texto a video y de referencia de imagen única
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
Consulta [Generación de video](/es/tools/video-generation) para ver los parámetros compartidos de herramienta, selección de proveedor y comportamiento de failover.
</Note>

### Comprensión de imágenes

El Plugin MiniMax registra la comprensión de imágenes por separado del catálogo
de texto:

| ID del proveedor | Modelo de imagen predeterminado |
| ---------------- | ------------------------------- |
| `minimax`        | `MiniMax-VL-01`                 |
| `minimax-portal` | `MiniMax-VL-01`                 |

Por eso el enrutamiento automático de medios puede usar la comprensión de imágenes de MiniMax incluso
cuando el catálogo integrado del proveedor de texto aún muestra referencias de chat M2.7 solo de texto.

### Búsqueda web

El Plugin MiniMax también registra `web_search` mediante la API de búsqueda del
plan de codificación de MiniMax.

- ID de proveedor: `minimax`
- Resultados estructurados: títulos, URL, fragmentos, consultas relacionadas
- Variable env preferida: `MINIMAX_CODE_PLAN_KEY`
- Alias env aceptado: `MINIMAX_CODING_API_KEY`
- Respaldo de compatibilidad: `MINIMAX_API_KEY` cuando ya apunta a un token del plan de codificación
- Reutilización de región: `plugins.entries.minimax.config.webSearch.region`, luego `MINIMAX_API_HOST`, luego las URLs base del proveedor MiniMax
- La búsqueda permanece en el ID de proveedor `minimax`; la configuración OAuth CN/global puede seguir orientando indirectamente la región mediante `models.providers.minimax-portal.baseUrl`

La configuración vive bajo `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consulta [Búsqueda de MiniMax](/es/tools/minimax-search) para ver la configuración completa y el uso de búsqueda web.
</Note>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Opciones de configuración">
    | Opción | Descripción |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Prefiere `https://api.minimax.io/anthropic` (compatible con Anthropic); `https://api.minimax.io/v1` es opcional para cargas útiles compatibles con OpenAI |
    | `models.providers.minimax.api` | Prefiere `anthropic-messages`; `openai-completions` es opcional para cargas útiles compatibles con OpenAI |
    | `models.providers.minimax.apiKey` | Clave API de MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Define `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Alias de los modelos que quieras en la allowlist |
    | `models.mode` | Mantén `merge` si quieres añadir MiniMax junto con los integrados |
  </Accordion>

  <Accordion title="Valores predeterminados de thinking">
    En `api: "anthropic-messages"`, OpenClaw inyecta `thinking: { type: "disabled" }` a menos que thinking ya esté configurado explícitamente en params/config.

    Esto evita que el endpoint de streaming de MiniMax emita `reasoning_content` en fragmentos delta estilo OpenAI, lo que filtraría razonamiento interno a la salida visible.

  </Accordion>

  <Accordion title="Modo rápido">
    `/fast on` o `params.fastMode: true` reescribe `MiniMax-M2.7` a `MiniMax-M2.7-highspeed` en la ruta de stream compatible con Anthropic.
  </Accordion>

  <Accordion title="Ejemplo de failover">
    **Ideal para:** mantener tu modelo de última generación más potente como primario y usar MiniMax M2.7 como failover. El ejemplo siguiente usa Opus como primario concreto; cámbialo por tu modelo primario de última generación preferido.

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
    - OpenClaw normaliza el uso de coding plan de MiniMax al mismo formato `% left` usado por otros proveedores. Los campos sin procesar `usage_percent` / `usagePercent` de MiniMax representan cuota restante, no cuota consumida, así que OpenClaw los invierte. Los campos basados en conteos tienen prioridad cuando están presentes.
    - Cuando la API devuelve `model_remains`, OpenClaw prefiere la entrada del modelo de chat, deriva la etiqueta de ventana a partir de `start_time` / `end_time` cuando es necesario e incluye el nombre del modelo seleccionado en la etiqueta del plan para que las ventanas del coding plan sean más fáciles de distinguir.
    - Las instantáneas de uso tratan `minimax`, `minimax-cn` y `minimax-portal` como la misma superficie de cuota de MiniMax, y prefieren el OAuth de MiniMax almacenado antes de usar como respaldo variables env de clave de Coding Plan.
  </Accordion>
</AccordionGroup>

## Notas

- Las referencias de modelo siguen la ruta de autenticación:
  - Configuración con clave API: `minimax/<model>`
  - Configuración OAuth: `minimax-portal/<model>`
- Modelo de chat predeterminado: `MiniMax-M2.7`
- Modelo de chat alternativo: `MiniMax-M2.7-highspeed`
- La incorporación y la configuración directa con clave API escriben definiciones explícitas de modelo con `input: ["text", "image"]` para ambas variantes M2.7
- El catálogo integrado del proveedor expone actualmente las referencias de chat como metadatos solo de texto hasta que exista una configuración explícita del proveedor MiniMax
- Actualiza los valores de precios en `models.json` si necesitas un seguimiento exacto de costos
- Usa `openclaw models list` para confirmar el ID de proveedor actual, luego cambia con `openclaw models set minimax/MiniMax-M2.7` o `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Enlace de referido para MiniMax Coding Plan (10% de descuento): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Consulta [Proveedores de modelos](/es/concepts/model-providers) para ver las reglas de proveedores.
</Note>

## Solución de problemas

<AccordionGroup>
  <Accordion title='"Modelo desconocido: minimax/MiniMax-M2.7"'>
    Esto normalmente significa que el **proveedor MiniMax no está configurado** (no hay una entrada de proveedor coincidente ni una clave env/perfil de autenticación de MiniMax). La corrección de esta detección está en **2026.1.12**. Corrígelo de una de estas formas:

    - Actualiza a **2026.1.12** (o ejecuta desde el código fuente `main`), luego reinicia el gateway.
    - Ejecuta `openclaw configure` y selecciona una opción de autenticación **MiniMax**, o
    - Añade manualmente el bloque coincidente `models.providers.minimax` o `models.providers.minimax-portal`, o
    - Configura `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un perfil de autenticación de MiniMax para que pueda inyectarse el proveedor correspondiente.

    Asegúrate de que el ID del modelo distingue entre mayúsculas y minúsculas:

    - Ruta con clave API: `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed`
    - Ruta OAuth: `minimax-portal/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7-highspeed`

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
  <Card title="Selección de modelo" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de failover.
  </Card>
  <Card title="Generación de imágenes" href="/es/tools/image-generation" icon="image">
    Parámetros compartidos de la herramienta de imagen y selección de proveedor.
  </Card>
  <Card title="Generación de música" href="/es/tools/music-generation" icon="music">
    Parámetros compartidos de la herramienta de música y selección de proveedor.
  </Card>
  <Card title="Generación de video" href="/es/tools/video-generation" icon="video">
    Parámetros compartidos de la herramienta de video y selección de proveedor.
  </Card>
  <Card title="Búsqueda de MiniMax" href="/es/tools/minimax-search" icon="magnifying-glass">
    Configuración de búsqueda web mediante MiniMax Coding Plan.
  </Card>
  <Card title="Solución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Solución general de problemas y preguntas frecuentes.
  </Card>
</CardGroup>
