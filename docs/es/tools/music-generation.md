---
read_when:
    - Generación de música o audio mediante el agente
    - Configuración de proveedores y modelos de generación musical
    - Entender los parámetros de la herramienta music_generate
sidebarTitle: Music generation
summary: Genera música mediante music_generate en flujos de trabajo de ComfyUI, fal, Google Lyria, MiniMax y OpenRouter
title: Generación de música
x-i18n:
    generated_at: "2026-06-27T13:06:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4fe6ad09b6e2cfae03bc5d5ef4368e80845a9e4a8c25c6303e181a6436a17c7e
    source_path: tools/music-generation.md
    workflow: 16
---

La herramienta `music_generate` permite que el agente cree música o audio mediante la
capacidad compartida de generación de música con proveedores configurados: ComfyUI,
fal, Google, MiniMax y OpenRouter actualmente.

Para ejecuciones de agente respaldadas por sesión, OpenClaw inicia la generación de música como una
tarea en segundo plano, la registra en el libro mayor de tareas y luego vuelve a despertar al agente
cuando la pista está lista para que el agente pueda avisar al usuario y adjuntar el
audio terminado. El agente de finalización sigue el modo normal de respuesta visible
de la sesión: entrega automática de la respuesta final cuando está configurada, o `message(action="send")`
cuando la sesión requiere la herramienta de mensajes. Si la sesión solicitante está
inactiva o su activación falla, y todavía falta algún audio generado
en la respuesta de finalización, OpenClaw envía una reserva directa idempotente con
solo el audio faltante.

<Note>
La herramienta compartida integrada solo aparece cuando hay al menos un proveedor de
generación de música disponible. Si no ves `music_generate` en las herramientas de tu agente,
configura `agents.defaults.musicGenerationModel` o define una
clave de API de proveedor.
</Note>

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
        _"Genera una pista synthpop animada sobre un viaje nocturno en coche por una
        ciudad de neón."_

        El agente llama a `music_generate` automáticamente. No es necesario
        incluir la herramienta en una lista de permitidas.
      </Step>
    </Steps>

    Para contextos síncronos directos sin una ejecución de agente respaldada por sesión,
    la herramienta integrada sigue recurriendo a la generación en línea y devuelve
    la ruta final del medio en el resultado de la herramienta.

  </Tab>
  <Tab title="ComfyUI workflow">
    <Steps>
      <Step title="Configure the workflow">
        Configura `plugins.entries.comfy.config.music` con un flujo de trabajo
        JSON y nodos de prompt/salida.
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

## Proveedores compatibles

| Proveedor  | Modelo predeterminado         | Entradas de referencia | Controles compatibles                               | Autenticación                          |
| ---------- | ---------------------------- | ---------------------- | --------------------------------------------------- | -------------------------------------- |
| ComfyUI    | `workflow`                   | Hasta 1 imagen         | Música o audio definidos por el flujo de trabajo    | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| fal        | `fal-ai/minimax-music/v2.6`  | Ninguna                | `lyrics`, `instrumental`, `durationSeconds`, `format` | `FAL_KEY` o `FAL_API_KEY`              |
| Google     | `lyria-3-clip-preview`       | Hasta 10 imágenes      | `lyrics`, `instrumental`, `format`                  | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax    | `music-2.6`                  | Ninguna                | `lyrics`, `instrumental`, `format=mp3`              | `MINIMAX_API_KEY` o MiniMax OAuth      |
| OpenRouter | `google/lyria-3-pro-preview` | Hasta 1 imagen         | `lyrics`, `instrumental`, `durationSeconds`, `format` | `OPENROUTER_API_KEY`                   |

### Matriz de capacidades

El contrato de modo explícito usado por `music_generate`, las pruebas de contrato y el
barrido compartido en vivo:

| Proveedor  | `generate` | `edit` | Límite de edición | Carriles compartidos en vivo                                              |
| ---------- | :--------: | :----: | ----------------- | ------------------------------------------------------------------------- |
| ComfyUI    |     ✓      |   ✓    | 1 imagen          | No está en el barrido compartido; cubierto por `extensions/comfy/comfy.live.test.ts` |
| fal        |     ✓      |   —    | Ninguno           | `generate`                                                                |
| Google     |     ✓      |   ✓    | 10 imágenes       | `generate`, `edit`                                                        |
| MiniMax    |     ✓      |   —    | Ninguno           | `generate`                                                                |
| OpenRouter |     ✓      |   ✓    | 1 imagen          | `generate`, `edit`                                                        |

Usa `action: "list"` para inspeccionar los proveedores y modelos compartidos disponibles en
tiempo de ejecución:

```text
/tool music_generate action=list
```

Usa `action: "status"` para inspeccionar la tarea de música activa respaldada por sesión:

```text
/tool music_generate action=status
```

Ejemplo de generación directa:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parámetros de la herramienta

<ParamField path="prompt" type="string" required>
  Prompt de generación de música. Obligatorio para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` devuelve la tarea de sesión actual; `"list"` inspecciona los proveedores.
</ParamField>
<ParamField path="model" type="string">
  Anulación de proveedor/modelo (por ejemplo, `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Letra opcional cuando el proveedor admite entrada explícita de letras.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Solicita salida solo instrumental cuando el proveedor la admite.
</ParamField>
<ParamField path="image" type="string">
  Ruta o URL de una sola imagen de referencia.
</ParamField>
<ParamField path="images" type="string[]">
  Varias imágenes de referencia (hasta 10 en proveedores compatibles).
</ParamField>
<ParamField path="durationSeconds" type="number">
  Duración objetivo en segundos cuando el proveedor admite sugerencias de duración.
</ParamField>
<ParamField path="format" type='"mp3" | "wav"'>
  Sugerencia de formato de salida cuando el proveedor la admite.
</ParamField>
<ParamField path="filename" type="string">Sugerencia de nombre de archivo de salida.</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. OpenClaw sigue validando límites
estrictos, como los conteos de entrada, antes del envío. Cuando un proveedor admite
duración pero usa un máximo menor que el valor solicitado, OpenClaw
la limita a la duración compatible más cercana. Las sugerencias opcionales realmente no compatibles
se ignoran con una advertencia cuando el proveedor o modelo seleccionado no puede respetarlas.
Los resultados de la herramienta informan la configuración aplicada; `details.normalization`
captura cualquier asignación de solicitado a aplicado.
</Note>

Los tiempos de espera de solicitudes al proveedor son solo configuración del operador. OpenClaw usa
`agents.defaults.musicGenerationModel.timeoutMs` cuando está configurado, eleva los valores
inferiores a 120000ms a 120000ms y, de lo contrario, usa de forma predeterminada
300000ms para las solicitudes al proveedor.

## Comportamiento asíncrono

La generación de música respaldada por sesión se ejecuta como una tarea en segundo plano:

- **Tarea en segundo plano:** `music_generate` crea una tarea en segundo plano, devuelve una
  respuesta de inicio/tarea inmediatamente y publica la pista terminada más tarde en
  un mensaje de seguimiento del agente.
- **Prevención de duplicados:** mientras una tarea está `queued` o `running`, las llamadas posteriores a
  `music_generate` en la misma sesión devuelven el estado de la tarea en lugar de
  iniciar otra generación. Usa `action: "status"` para comprobarlo explícitamente.
- **Consulta de estado:** `openclaw tasks list` u `openclaw tasks show <taskId>`
  inspecciona estados en cola, en ejecución y terminales.
- **Activación de finalización:** OpenClaw inyecta un evento interno de finalización de nuevo
  en la misma sesión para que el modelo pueda escribir por sí mismo el seguimiento
  orientado al usuario.
- **Sugerencia de prompt:** turnos posteriores de usuario/manuales en la misma sesión reciben una pequeña
  sugerencia de tiempo de ejecución cuando una tarea de música ya está en curso, para que el modelo
  no llame a `music_generate` a ciegas otra vez.
- **Reserva sin sesión:** los contextos directos/locales sin una sesión de agente real
  se ejecutan en línea y devuelven el resultado final de audio en el mismo turno.

### Ciclo de vida de la tarea

| Estado      | Significado                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Tarea creada, en espera de que el proveedor la acepte.                                        |
| `running`   | El proveedor está procesando (normalmente de 30 segundos a 3 minutos según proveedor y duración). |
| `succeeded` | Pista lista; el agente se despierta y la publica en la conversación.                          |
| `failed`    | Error del proveedor o tiempo de espera agotado; el agente se despierta con detalles del error. |

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

### Orden de selección de proveedores

OpenClaw prueba proveedores en este orden:

1. Parámetro `model` de la llamada a la herramienta (si el agente especifica uno).
2. `musicGenerationModel.primary` de la configuración.
3. `musicGenerationModel.fallbacks` en orden.
4. Detección automática usando solo valores predeterminados de proveedores respaldados por autenticación:
   - primero el proveedor predeterminado actual;
   - los demás proveedores registrados de generación de música en orden de id de proveedor.

Si un proveedor falla, se prueba automáticamente el siguiente candidato. Si todos
fallan, el error incluye detalles de cada intento.

Define `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar solo
entradas explícitas de `model`, `primary` y `fallbacks`.

## Notas de proveedores

<AccordionGroup>
  <Accordion title="ComfyUI">
    Impulsado por flujo de trabajo y depende del grafo configurado más la asignación de nodos
    para campos de prompt/salida. El plugin `comfy` incluido se conecta a la
    herramienta compartida `music_generate` mediante el registro de proveedores de
    generación de música.
  </Accordion>
  <Accordion title="fal">
    Usa endpoints de modelos de fal mediante la ruta compartida de autenticación de proveedores. El
    proveedor incluido usa de forma predeterminada `fal-ai/minimax-music/v2.6` y también expone
    `fal-ai/ace-step/prompt-to-audio` y
    `fal-ai/stable-audio-25/text-to-audio` para solicitudes de prompt a audio.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa generación por lotes de Lyria 3. El flujo incluido actual admite
    prompt, texto de letras opcional e imágenes de referencia opcionales.
  </Accordion>
  <Accordion title="MiniMax">
    Usa el endpoint por lotes `music_generation`. Admite prompt, letras opcionales,
    modo instrumental y salida mp3 mediante autenticación con clave de API de `minimax`
    o OAuth de `minimax-portal`.
  </Accordion>
  <Accordion title="OpenRouter">
    Usa salida de audio de completions de chat de OpenRouter con streaming habilitado. El
    proveedor incluido usa de forma predeterminada `google/lyria-3-pro-preview` y también expone
    `openrouter/google/lyria-3-clip-preview`.
  </Accordion>
</AccordionGroup>

## Elegir la ruta adecuada

- **Respaldada por proveedor compartido** cuando quieres selección de modelo, conmutación por error
  de proveedor y el flujo asíncrono integrado de tarea/estado.
- **Ruta de Plugin (ComfyUI)** cuando necesitas un grafo de flujo de trabajo personalizado o un
  proveedor que no forma parte de la capacidad musical compartida incluida.

Si estás depurando comportamiento específico de ComfyUI, consulta
[ComfyUI](/es/providers/comfy). Si estás depurando comportamiento compartido de
proveedores, empieza con [fal](/es/providers/fal), [Google (Gemini)](/es/providers/google),
[MiniMax](/es/providers/minimax) u [OpenRouter](/es/providers/openrouter).

## Modos de capacidad del proveedor

El contrato compartido de generación de música admite declaraciones de modo explícitas:

- `generate` para generación solo con prompt.
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
`supportsFormat` **no** bastan para anunciar compatibilidad con edición. Los
proveedores deben declarar `generate` y `edit` explícitamente para que las pruebas
en vivo, las pruebas de contrato y la herramienta compartida `music_generate`
puedan validar la compatibilidad de modos de forma determinista.

## Pruebas en vivo

Cobertura en vivo opcional para los proveedores compartidos incluidos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper del repositorio:

```bash
pnpm test:live:media music
```

Este archivo de pruebas en vivo usa de forma predeterminada las variables de
entorno del proveedor ya exportadas antes que los perfiles de autenticación
almacenados, y ejecuta cobertura tanto de `generate` como de `edit` declarada
cuando el proveedor habilita el modo de edición. Cobertura actual:

- `google`: `generate` más `edit`
- `fal`: solo `generate`
- `minimax`: solo `generate`
- `openrouter`: `generate` más `edit`
- `comfy`: cobertura en vivo de Comfy independiente, no el barrido de proveedores compartidos

Cobertura en vivo opcional para la ruta de música ComfyUI incluida:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

El archivo de pruebas en vivo de Comfy también cubre flujos de trabajo de imagen
y video de comfy cuando esas secciones están configuradas.

## Relacionado

- [Tareas en segundo plano](/es/automation/tasks) — seguimiento de tareas para ejecuciones de `music_generate` desacopladas
- [ComfyUI](/es/providers/comfy)
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — configuración de `musicGenerationModel`
- [Google (Gemini)](/es/providers/google)
- [MiniMax](/es/providers/minimax)
- [Modelos](/es/concepts/models) — configuración de modelos y conmutación por error
- [Resumen de herramientas](/es/tools)
