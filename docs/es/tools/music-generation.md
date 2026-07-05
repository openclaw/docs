---
read_when:
    - Generar música o audio mediante el agente
    - Configuración de proveedores y modelos de generación musical
    - Comprender los parámetros de la herramienta music_generate
sidebarTitle: Music generation
summary: Generar música mediante `music_generate` en flujos de trabajo de ComfyUI, fal, Google Lyria, MiniMax y OpenRouter
title: Generación de música
x-i18n:
    generated_at: "2026-07-05T11:50:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5a540f537141f0d97b264420aae9e986c1f0c3927b8988ebbaf3798b8afd5dd2
    source_path: tools/music-generation.md
    workflow: 16
---

La herramienta `music_generate` crea música o audio mediante la capacidad compartida de generación de música, respaldada por ComfyUI, fal, Google, MiniMax y OpenRouter.

<Note>
`music_generate` solo aparece cuando hay al menos un proveedor de generación de música disponible: una configuración explícita de `agents.defaults.musicGenerationModel` o un proveedor configurado con autenticación (por ejemplo, una clave de API definida).
</Note>

Para ejecuciones de agente respaldadas por sesión, `music_generate` comienza como una tarea en segundo plano, registra el progreso en el registro de tareas y luego despierta al agente cuando la pista está lista para que pueda avisar al usuario y adjuntar el audio terminado. El agente de finalización sigue el contrato de respuesta visible de la sesión: respuesta final automática cuando está configurada, o `message(action="send")` cuando la sesión requiere la herramienta de mensajes. Si la sesión solicitante está inactiva o su activación falla y el audio generado aún falta en la respuesta, OpenClaw envía una alternativa directa idempotente solo con el audio faltante.

## Inicio rápido

<Tabs>
  <Tab title="Shared provider-backed">
    <Steps>
      <Step title="Configure auth">
        Define una clave de API para al menos un proveedor, por ejemplo
        `GEMINI_API_KEY` o `MINIMAX_API_KEY`.
      </Step>
      <Step title="Pick a default model (optional)">
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
      <Step title="Ask the agent">
        _"Genera una pista synthpop animada sobre un viaje nocturno en coche por una ciudad de neón."_

        El agente llama a `music_generate` automáticamente. No es necesario incluir la herramienta en una lista de permitidos.
      </Step>
    </Steps>

    Sin una ejecución de agente respaldada por sesión (contextos directos/locales), la herramienta se ejecuta en línea y devuelve la ruta final del contenido multimedia en el mismo resultado de herramienta.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Configura `plugins.entries.comfy.config.music` con un flujo de trabajo JSON y nodos de prompt/salida.
      </Step>
      <Step title="Cloud auth (optional)">
        Para Comfy Cloud, define `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Call the tool">
        ```text
        /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Prompts de ejemplo:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

Usa `action: "list"` para inspeccionar los proveedores/modelos disponibles y `action: "status"` para inspeccionar la tarea de música activa respaldada por sesión:

```text
/tool music_generate action=list
/tool music_generate action=status
```

Ejemplo de generación directa:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Proveedores compatibles

| Proveedor  | Modelo predeterminado         | Entradas de referencia | Controles compatibles                               | Autenticación                         |
| ---------- | ---------------------------- | ---------------------- | --------------------------------------------------- | ------------------------------------- |
| ComfyUI    | `workflow`                   | Hasta 1 imagen         | Música o audio definidos por el flujo de trabajo    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Ninguna                | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` o `FAL_API_KEY`             |
| Google     | `lyria-3-clip-preview`       | Hasta 10 imágenes      | `lyrics`, `instrumental`, `format`                  | `GEMINI_API_KEY`, `GOOGLE_API_KEY`    |
| MiniMax    | `music-2.6`                  | Ninguna                | `lyrics`, `instrumental`, `format` (solo mp3)       | `MINIMAX_API_KEY` o MiniMax OAuth     |
| OpenRouter | `google/lyria-3-pro-preview` | Hasta 1 imagen         | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                  |

MiniMax registra dos id. de proveedor que comparten los mismos modelos: `minimax` para autenticación con clave de API y `minimax-portal` para OAuth. Las referencias de modelo siguen la ruta de autenticación (`minimax/music-2.6` frente a `minimax-portal/music-2.6`); consulta [MiniMax](/es/providers/minimax#music-generation).

fal también expone `fal-ai/ace-step/prompt-to-audio` (wav, sin letras, sin selector instrumental) y `fal-ai/stable-audio-25/text-to-audio` (wav, solo prompt) junto con su modelo predeterminado respaldado por MiniMax. El valor predeterminado de Google, `lyria-3-clip-preview`, solo genera mp3; `lyria-3-pro-preview` también admite wav. MiniMax también expone `music-2.6-free`, `music-cover` y `music-cover-free`. OpenRouter también expone `google/lyria-3-clip-preview`.

### Matriz de capacidades

El contrato de modo explícito usado por `music_generate`, las pruebas de contrato y el barrido en vivo compartido:

| Proveedor  | `generate` | `edit` | Límite de edición | Carriles en vivo compartidos                                             |
| ---------- | :--------: | :----: | ----------------- | ------------------------------------------------------------------------ |
| ComfyUI    |     ✓      |   ✓    | 1 imagen          | No está en el barrido compartido; cubierto por `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Ninguno           | `generate`                                                               |
| Google     |     ✓      |   ✓    | 10 imágenes       | `generate`, `edit`                                                       |
| MiniMax    |     ✓      |   —    | Ninguno           | `generate`                                                               |
| OpenRouter |     ✓      |   ✓    | 1 imagen          | `generate`, `edit`                                                       |

## Parámetros de la herramienta

<ParamField path="prompt" type="string" required>
  Prompt de generación de música. Obligatorio para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` devuelve la tarea de sesión actual; `"list"` inspecciona proveedores.
</ParamField>
<ParamField path="model" type="string">
  Sobrescritura de proveedor/modelo (p. ej., `google/lyria-3-pro-preview`, `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Letras opcionales cuando el proveedor admite entrada explícita de letras.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Solicita una salida solo instrumental cuando el proveedor la admite.
</ParamField>
<ParamField path="image" type="string">
  Ruta o URL de una única imagen de referencia.
</ParamField>
<ParamField path="images" type="string[]">
  Varias imágenes de referencia (hasta 10 en proveedores compatibles).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Duración objetivo en segundos cuando el proveedor admite indicaciones de duración.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Indicación de formato de salida cuando el proveedor la admite.
</ParamField>
<ParamField path="filename" type="string">Indicación de nombre de archivo de salida.</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. OpenClaw sigue validando límites estrictos, como recuentos de entrada, antes del envío. Cuando un proveedor admite duración pero usa un máximo menor que el valor solicitado, OpenClaw ajusta al valor de duración compatible más cercano. Las indicaciones opcionales realmente incompatibles se ignoran con una advertencia cuando el proveedor o modelo seleccionado no puede respetarlas. Los resultados de la herramienta informan la configuración aplicada; `details.normalization` captura cualquier asignación de solicitado a aplicado.
</Note>

Los tiempos de espera de solicitud del proveedor son solo configuración del operador. OpenClaw usa `agents.defaults.musicGenerationModel.timeoutMs` cuando está configurado, eleva los valores por debajo de 120000 ms a 120000 ms y, de lo contrario, usa 300000 ms como valor predeterminado para las solicitudes de proveedor.

## Comportamiento asíncrono

La generación de música respaldada por sesión se ejecuta como tarea en segundo plano:

- **Tarea en segundo plano:** `music_generate` crea una tarea en segundo plano, devuelve de inmediato una respuesta de inicio/tarea y publica la pista terminada más tarde en un mensaje de seguimiento del agente.
- **Prevención de duplicados:** mientras una tarea está en `queued` o `running`, las llamadas posteriores a `music_generate` en la misma sesión devuelven el estado de la tarea en lugar de iniciar otra generación. Usa `action: "status"` para comprobarlo explícitamente. Una solicitud coincidente completada recientemente también se desduplica durante 2 minutos.
- **Consulta de estado:** `openclaw tasks list` u `openclaw tasks show <taskId>` inspecciona estados en cola, en ejecución y terminales.
- **Activación al completar:** OpenClaw inyecta un evento interno de finalización de vuelta en la misma sesión para que el modelo pueda escribir por sí mismo el seguimiento visible para el usuario.
- **Indicación de prompt:** los turnos posteriores de usuario/manuales en la misma sesión reciben una pequeña indicación de runtime cuando una tarea de música ya está en curso, para que el modelo no vuelva a llamar a `music_generate` a ciegas.
- **Alternativa sin sesión:** los contextos directos/locales sin una sesión real de agente se ejecutan en línea y devuelven el resultado final de audio en el mismo turno.

### Ciclo de vida de la tarea

La tarea de música expone los mismos estados que el registro general de tareas (consulta [Tareas en segundo plano](/es/automation/tasks#task-lifecycle) para ver la máquina de estados completa, incluidos `timed_out`, `cancelled` y `lost`). La mayoría de las ejecuciones de música pasan por:

| Estado      | Significado                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Tarea creada, esperando a que el proveedor la acepte.                                         |
| `running`   | El proveedor está procesando (normalmente de 30 segundos a 3 minutos según el proveedor y la duración). |
| `succeeded` | Pista lista; el agente se despierta y la publica en la conversación.                          |
| `failed`    | Error o tiempo de espera del proveedor; el agente se despierta con detalles del error.         |

Comprueba el estado desde la CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

## Configuración

### Selección de modelo

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

### Orden de selección de proveedor

OpenClaw prueba los proveedores en este orden:

1. Parámetro `model` de la llamada a la herramienta (si el agente especifica uno).
2. `musicGenerationModel.primary` desde la configuración.
3. `musicGenerationModel.fallbacks` en orden.
4. Detección automática usando solo valores predeterminados de proveedores respaldados por autenticación:
   - primero el proveedor de modelo de texto predeterminado actual, si también ofrece generación de música;
   - los proveedores de generación de música registrados restantes, alfabéticamente por id. de proveedor.

Si un proveedor falla, el siguiente candidato se intenta automáticamente. Si todos fallan, el error incluye detalles de cada intento.

Define `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar solo entradas explícitas de `model`, `primary` y `fallbacks`.

## Notas de proveedores

<AccordionGroup>
  <Accordion title="ComfyUI">
    Se basa en flujos de trabajo y depende del grafo configurado más la
    asignación de nodos para los campos de prompt/salida. El Plugin `comfy`
    incluido se conecta a la herramienta compartida `music_generate` a través
    del registro de proveedores de generación musical.
  </Accordion>
  <Accordion title="fal">
    Usa endpoints de modelos fal a través de la ruta compartida de autenticación
    de proveedores. El proveedor incluido usa `fal-ai/minimax-music/v2.6` de
    forma predeterminada y también expone `fal-ai/ace-step/prompt-to-audio` y
    `fal-ai/stable-audio-25/text-to-audio` para solicitudes de prompt a audio.
    Las letras y el modo instrumental son solo para modelos MiniMax; los otros
    dos modelos son solo de prompt.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa generación por lotes de Lyria 3. El flujo incluido actual admite
    prompt, texto de letras opcional e imágenes de referencia opcionales. El
    modelo predeterminado `lyria-3-clip-preview` solo genera mp3; el modelo
    `lyria-3-pro-preview` también admite wav.
  </Accordion>
  <Accordion title="MiniMax">
    Usa el endpoint por lotes `music_generation`. Admite prompt, letras
    opcionales, modo instrumental y salida mp3 mediante autenticación con clave
    de API de `minimax` o OAuth de `minimax-portal`. También expone los modelos
    `music-2.6-free`, `music-cover` y `music-cover-free`.
  </Accordion>
  <Accordion title="OpenRouter">
    Usa salida de audio de completions de chat de OpenRouter con streaming
    habilitado. El proveedor incluido usa `google/lyria-3-pro-preview` de forma
    predeterminada y también expone `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Elegir la ruta correcta

- **Respaldado por proveedor compartido** cuando quieres selección de modelos,
  conmutación por error de proveedores y el flujo asíncrono integrado de
  tareas/estado.
- **Ruta de Plugin (ComfyUI)** cuando necesitas un grafo de flujo de trabajo
  personalizado o un proveedor que no forma parte de la capacidad musical
  compartida incluida.

Si estás depurando comportamiento específico de ComfyUI, consulta
[ComfyUI](/es/providers/comfy). Si estás depurando comportamiento de proveedores
compartidos, empieza por [fal](/es/providers/fal), [Google (Gemini)](/es/providers/google),
[MiniMax](/es/providers/minimax) u [OpenRouter](/es/providers/openrouter).

## Modos de capacidad de proveedor

El contrato compartido de generación musical admite declaraciones de modo
explícitas:

- `generate` para generación solo con prompt.
- `edit` cuando la solicitud incluye una o más imágenes de referencia.

Las nuevas implementaciones de proveedores deberían preferir bloques de modo
explícitos:

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
`supportsFormat` **no** son suficientes para anunciar compatibilidad con edición.
Los proveedores deberían declarar `generate` y `edit` explícitamente para que
las pruebas en vivo, las pruebas de contrato y la herramienta compartida
`music_generate` puedan validar la compatibilidad de modos de forma
determinista.

## Pruebas en vivo

Cobertura en vivo opcional para los proveedores compartidos incluidos (fal,
Google, MiniMax, OpenRouter):

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper equivalente del repositorio, que ejecuta el mismo archivo de prueba:

```bash
pnpm test:live:media:music
```

Este archivo en vivo usa de forma predeterminada las variables de entorno de
proveedores ya exportadas antes que los perfiles de autenticación almacenados,
y ejecuta tanto cobertura de `generate` como de `edit` declarado cuando el
proveedor habilita el modo de edición. Cobertura actual:

- `google`: `generate` más `edit`
- `fal`: solo `generate`
- `minimax`: solo `generate`
- `openrouter`: `generate` más `edit`
- `comfy`: cobertura en vivo de Comfy separada, no el barrido de proveedores compartidos

Cobertura en vivo opcional para la ruta musical de ComfyUI incluida:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

El archivo en vivo de Comfy también cubre los flujos de trabajo de imagen y
video de comfy cuando esas secciones están configuradas.

## Relacionado

- [Tareas en segundo plano](/es/automation/tasks) — seguimiento de tareas para ejecuciones desacopladas de `music_generate`
- [ComfyUI](/es/providers/comfy)
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — configuración de `musicGenerationModel`
- [Google (Gemini)](/es/providers/google)
- [MiniMax](/es/providers/minimax)
- [Modelos](/es/concepts/models) — configuración de modelos y conmutación por error
- [Resumen de herramientas](/es/tools)
