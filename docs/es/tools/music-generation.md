---
read_when:
    - Generar música o audio mediante el agente
    - Configuración de proveedores y modelos de generación de música
    - Comprender los parámetros de la herramienta music_generate
sidebarTitle: Music generation
summary: Genera música mediante `music_generate` en flujos de trabajo de ComfyUI, fal, Google Lyria, MiniMax y OpenRouter
title: Generación de música
x-i18n:
    generated_at: "2026-07-11T23:35:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

La herramienta `music_generate` crea música o audio mediante la capacidad
compartida de generación de música, respaldada por ComfyUI, fal, Google,
MiniMax y OpenRouter.

<Note>
`music_generate` solo aparece cuando hay al menos un proveedor de generación
de música disponible: una configuración explícita de
`agents.defaults.musicGenerationModel` o un proveedor con autenticación
configurada (por ejemplo, una clave de API establecida).
</Note>

Para las ejecuciones de agentes respaldadas por sesión, `music_generate` se
inicia como una tarea en segundo plano, registra el progreso en el libro de
tareas y, cuando la pista está lista, reactiva al agente para que pueda
informar al usuario y adjuntar el audio terminado. El agente de finalización
sigue el contrato de respuesta visible de la sesión: una respuesta final
automática cuando está configurada o `message(action="send")` cuando la
sesión requiere la herramienta de mensajes. Si la sesión solicitante está
inactiva o falla su reactivación y el audio generado aún no aparece en la
respuesta, OpenClaw envía un respaldo directo e idempotente que contiene
únicamente el audio faltante.

## Inicio rápido

<Tabs>
  <Tab title="Respaldado por un proveedor compartido">
    <Steps>
      <Step title="Configurar la autenticación">
        Establezca una clave de API para al menos un proveedor; por ejemplo,
        `GEMINI_API_KEY` o `MINIMAX_API_KEY`.
      </Step>
      <Step title="Elegir un modelo predeterminado (opcional)">
        ```json5
        {
          agents: {
            defaults: {
              musicGenerationModel: {
                primary: "google/lyria-3-clip-preview",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="Pedir al agente">
        _«Genera una pista de synthpop animada sobre un viaje nocturno en
        automóvil por una ciudad de neón»._

        El agente llama a `music_generate` automáticamente. No es necesario
        incluir la herramienta en una lista de permitidas.
      </Step>
    </Steps>

    Sin una ejecución de agente respaldada por sesión (en contextos directos
    o locales), la herramienta se ejecuta en línea y devuelve la ruta final
    del archivo multimedia en el mismo resultado de la herramienta.

  </Tab>
  <Tab title="Flujo de trabajo de ComfyUI">
    <Steps>
      <Step title="Configurar el flujo de trabajo">
        Configure `plugins.entries.comfy.config.music` con un flujo de trabajo
        en formato JSON y nodos de instrucción y salida.
      </Step>
      <Step title="Autenticación en la nube (opcional)">
        Para Comfy Cloud, establezca `COMFY_API_KEY` o
        `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Llamar a la herramienta">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Ejemplos de instrucciones:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

Use `action: "list"` para consultar los proveedores y modelos disponibles, y
`action: "status"` para consultar la tarea musical activa respaldada por
sesión:

```text
/tool music_generate action=list
/tool music_generate action=status
```

Ejemplo de generación directa:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Proveedores compatibles

| Proveedor  | Modelo predeterminado         | Entradas de referencia | Controles compatibles                                  | Autenticación                          |
| ---------- | ----------------------------- | ---------------------- | ------------------------------------------------------ | -------------------------------------- |
| ComfyUI    | `workflow`                    | Hasta 1 imagen         | Música o audio definidos por el flujo de trabajo       | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`   | Ninguna                | `lyrics`, `instrumental`, `durationSeconds`, `format`  | `FAL_KEY` o `FAL_API_KEY`              |
| Google     | `lyria-3-clip-preview`        | Hasta 10 imágenes      | `lyrics`, `instrumental`, `format`                     | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                   | Ninguna                | `lyrics`, `instrumental`, `format` (solo mp3)          | `MINIMAX_API_KEY` o OAuth de MiniMax   |
| OpenRouter | `google/lyria-3-pro-preview`  | Hasta 1 imagen         | `lyrics`, `instrumental`, `durationSeconds`, `format`  | `OPENROUTER_API_KEY`                   |

MiniMax registra dos identificadores de proveedor que comparten los mismos
modelos: `minimax` para la autenticación mediante clave de API y
`minimax-portal` para OAuth. Las referencias de modelos siguen la ruta de
autenticación (`minimax/music-2.6` frente a
`minimax-portal/music-2.6`); consulte
[MiniMax](/es/providers/minimax#music-generation).

fal también ofrece `fal-ai/ace-step/prompt-to-audio` (wav, sin letra ni
opción de activar o desactivar el modo instrumental) y
`fal-ai/stable-audio-25/text-to-audio` (wav, solo instrucción), además de su
modelo predeterminado respaldado por MiniMax. El modelo predeterminado de
Google, `lyria-3-clip-preview`, solo genera archivos mp3;
`lyria-3-pro-preview` también admite wav. MiniMax también ofrece
`music-2.6-free`, `music-cover` y `music-cover-free`. OpenRouter también
ofrece `google/lyria-3-clip-preview`.

### Matriz de capacidades

El contrato de modos explícito que utilizan `music_generate`, las pruebas de
contrato y el barrido compartido en vivo:

| Proveedor  | `generate` | `edit` | Límite de edición | Canales compartidos en vivo                                                |
| ---------- | :--------: | :----: | ----------------- | -------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 imagen          | No está en el barrido compartido; cubierto por `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Ninguno           | `generate`                                                                 |
| Google     |     ✓      |   ✓    | 10 imágenes       | `generate`, `edit`                                                         |
| MiniMax    |     ✓      |   —    | Ninguno           | `generate`                                                                 |
| OpenRouter |     ✓      |   ✓    | 1 imagen          | `generate`, `edit`                                                         |

## Parámetros de la herramienta

<ParamField path="prompt" type="string" required>
  Instrucción para generar música. Es obligatoria para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` devuelve la tarea actual de la sesión; `"list"` consulta los proveedores.
</ParamField>
<ParamField path="model" type="string">
  Sustitución del proveedor o modelo (por ejemplo,
  `google/lyria-3-pro-preview`, `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Letra opcional cuando el proveedor admite una entrada explícita de letra.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Solicita una salida exclusivamente instrumental cuando el proveedor lo admite.
</ParamField>
<ParamField path="image" type="string">
  Ruta o URL de una única imagen de referencia.
</ParamField>
<ParamField path="images" type="string[]">
  Varias imágenes de referencia (hasta 10 en los proveedores compatibles).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Duración objetivo en segundos cuando el proveedor admite indicaciones de duración.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Indicación del formato de salida cuando el proveedor lo admite.
</ParamField>
<ParamField path="filename" type="string">Indicación del nombre del archivo de salida.</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. OpenClaw sigue
validando límites estrictos, como la cantidad de entradas, antes del envío.
Cuando un proveedor admite la duración, pero utiliza un máximo inferior al
valor solicitado, OpenClaw lo limita a la duración compatible más cercana.
Las indicaciones opcionales que realmente no son compatibles se ignoran con
una advertencia cuando el proveedor o modelo seleccionado no puede
respetarlas. Los resultados de la herramienta informan de la configuración
aplicada; `details.normalization` registra cualquier correspondencia entre
los valores solicitados y los aplicados.
</Note>

Los tiempos de espera de las solicitudes a proveedores son exclusivamente
una configuración del operador. OpenClaw utiliza
`agents.defaults.musicGenerationModel.timeoutMs` cuando está configurado,
eleva los valores inferiores a 120000ms hasta 120000ms y, en caso contrario,
establece de forma predeterminada un tiempo de espera de 300000ms para las
solicitudes a proveedores.

## Comportamiento asíncrono

La generación de música respaldada por sesión se ejecuta como una tarea en
segundo plano:

- **Tarea en segundo plano:** `music_generate` crea una tarea en segundo
  plano, devuelve inmediatamente una respuesta de inicio o de tarea y
  publica posteriormente la pista terminada en un mensaje de seguimiento
  del agente.
- **Prevención de duplicados:** mientras una tarea está en estado `queued` o
  `running`, las llamadas posteriores a `music_generate` en la misma sesión
  devuelven el estado de la tarea en lugar de iniciar otra generación. Use
  `action: "status"` para comprobarlo explícitamente. También se elimina la
  duplicación de una solicitud coincidente completada recientemente durante
  2 minutos.
- **Consulta de estado:** `openclaw tasks list` u
  `openclaw tasks show <taskId>` consulta los estados en cola, en ejecución
  y terminales.
- **Reactivación al finalizar:** OpenClaw inyecta un evento interno de
  finalización en la misma sesión para que el propio modelo pueda redactar
  el seguimiento dirigido al usuario.
- **Indicación en la instrucción:** los turnos posteriores del usuario o
  manuales en la misma sesión reciben una breve indicación en tiempo de
  ejecución cuando ya hay una tarea musical en curso, para evitar que el
  modelo vuelva a llamar a `music_generate` sin comprobarlo.
- **Respaldo sin sesión:** los contextos directos o locales sin una sesión
  real de agente se ejecutan en línea y devuelven el resultado final de
  audio en el mismo turno.

### Ciclo de vida de la tarea

La tarea musical presenta los mismos estados que el registro general de
tareas (consulte [Tareas en segundo plano](/es/automation/tasks#task-lifecycle)
para ver la máquina de estados completa, incluidos `timed_out`, `cancelled`
y `lost`). La mayoría de las ejecuciones musicales pasan por:

| Estado      | Significado                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| `queued`    | Tarea creada, a la espera de que el proveedor la acepte.                                                 |
| `running`   | El proveedor la está procesando (normalmente entre 30 segundos y 3 minutos, según el proveedor y la duración). |
| `succeeded` | La pista está lista; el agente se reactiva y la publica en la conversación.                              |
| `failed`    | Error o tiempo de espera agotado del proveedor; el agente se reactiva con los detalles del error.        |

Compruebe el estado desde la CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Configuración

### Selección del modelo

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["fal/fal-ai/minimax-music/v2.6", "minimax/music-2.6"],
      },
    },
  },
}
```

### Orden de selección de proveedores

OpenClaw prueba los proveedores en este orden:

1. El parámetro `model` de la llamada a la herramienta (si el agente
   especifica uno).
2. `musicGenerationModel.primary` de la configuración.
3. Los valores de `musicGenerationModel.fallbacks`, en orden.
4. Detección automática utilizando únicamente los valores predeterminados de
   proveedores respaldados por autenticación:
   - primero, el proveedor predeterminado actual del modelo de texto, si
     también ofrece generación de música;
   - después, los demás proveedores de generación de música registrados,
     ordenados alfabéticamente por identificador de proveedor.

Si un proveedor falla, se prueba automáticamente el siguiente candidato. Si
todos fallan, el error incluye los detalles de cada intento.

Establezca `agents.defaults.mediaGenerationAutoProviderFallback: false` para
usar únicamente las entradas explícitas `model`, `primary` y `fallbacks`.

## Notas sobre los proveedores

<AccordionGroup>
  <Accordion title="ComfyUI">
    Se basa en flujos de trabajo y depende del grafo configurado y de la asignación de nodos
    para los campos de indicaciones y salida. El Plugin `comfy` incluido se integra con la
    herramienta compartida `music_generate` mediante el registro de proveedores
    de generación de música.
  </Accordion>
  <Accordion title="fal">
    Usa los endpoints de modelos de fal mediante la ruta compartida de autenticación de proveedores. El
    proveedor incluido utiliza de forma predeterminada `fal-ai/minimax-music/v2.6` y también expone
    `fal-ai/ace-step/prompt-to-audio` y
    `fal-ai/stable-audio-25/text-to-audio` para solicitudes de conversión de indicaciones en audio.
    Las letras y el modo instrumental solo están disponibles para el modelo MiniMax; los otros dos
    modelos solo admiten indicaciones.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa la generación por lotes de Lyria 3. El flujo incluido actualmente admite
    indicaciones, texto opcional para las letras e imágenes de referencia opcionales. El
    modelo predeterminado `lyria-3-clip-preview` solo genera mp3; el
    modelo `lyria-3-pro-preview` también admite wav.
  </Accordion>
  <Accordion title="MiniMax">
    Usa el endpoint por lotes `music_generation`. Admite indicaciones, letras
    opcionales, modo instrumental y salida mp3 mediante autenticación con clave de API
    `minimax` u OAuth de `minimax-portal`. También expone los modelos `music-2.6-free`,
    `music-cover` y `music-cover-free`.
  </Accordion>
  <Accordion title="OpenRouter">
    Usa la salida de audio de las finalizaciones de chat de OpenRouter con la transmisión habilitada. El
    proveedor incluido utiliza de forma predeterminada `google/lyria-3-pro-preview` y también expone
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Elegir la ruta adecuada

- **Respaldada por proveedores compartidos** cuando se necesita selección de modelos, conmutación por error
  entre proveedores y el flujo integrado de tareas asíncronas y estados.
- **Ruta de Plugin (ComfyUI)** cuando se necesita un grafo de flujo de trabajo personalizado o un
  proveedor que no forma parte de la capacidad musical compartida incluida.

Si está depurando un comportamiento específico de ComfyUI, consulte
[ComfyUI](/es/providers/comfy). Si está depurando el comportamiento de proveedores
compartidos, comience por [fal](/es/providers/fal), [Google (Gemini)](/es/providers/google),
[MiniMax](/es/providers/minimax) u [OpenRouter](/es/providers/openrouter).

## Modos de capacidad de los proveedores

El contrato compartido de generación de música admite declaraciones explícitas de modos:

- `generate` para la generación solo a partir de indicaciones.
- `edit` cuando la solicitud incluye una o más imágenes de referencia.

Las nuevas implementaciones de proveedores deben preferir bloques de modo explícitos:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Los campos planos heredados como `maxInputImages`, `supportsLyrics` y
`supportsFormat` **no** bastan para anunciar la compatibilidad con la edición. Los proveedores
deben declarar `generate` y `edit` explícitamente para que las pruebas en vivo, las pruebas
de contrato y la herramienta compartida `music_generate` puedan validar la compatibilidad con los modos
de forma determinista.

## Pruebas en vivo

Cobertura en vivo opcional para los proveedores compartidos incluidos (fal, Google, MiniMax,
OpenRouter):

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Comando equivalente del repositorio, que ejecuta el mismo archivo de pruebas:

```bash
pnpm test:live:media:music
```

De forma predeterminada, este archivo de pruebas en vivo usa las variables de entorno de proveedores ya exportadas
antes que los perfiles de autenticación almacenados, y ejecuta tanto la cobertura de `generate` como la
declarada para `edit` cuando el proveedor habilita el modo de edición. Cobertura actual:

- `google`: `generate` más `edit`
- `fal`: solo `generate`
- `minimax`: solo `generate`
- `openrouter`: `generate` más `edit`
- `comfy`: cobertura en vivo independiente de Comfy, no incluida en el recorrido de proveedores compartidos

Cobertura en vivo opcional para la ruta de música de ComfyUI incluida:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

El archivo de pruebas en vivo de Comfy también cubre los flujos de trabajo de imágenes y vídeos de comfy cuando esas
secciones están configuradas.

## Temas relacionados

- [Tareas en segundo plano](/es/automation/tasks) — seguimiento de tareas para ejecuciones desacopladas de `music_generate`
- [ComfyUI](/es/providers/comfy)
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — configuración de `musicGenerationModel`
- [Google (Gemini)](/es/providers/google)
- [MiniMax](/es/providers/minimax)
- [Modelos](/es/concepts/models) — configuración y conmutación por error de modelos
- [Descripción general de las herramientas](/es/tools)
