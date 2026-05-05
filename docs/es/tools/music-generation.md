---
read_when:
    - Generar música o audio mediante el agente
    - Configuración de proveedores y modelos de generación de música
    - Comprender los parámetros de la herramienta music_generate
sidebarTitle: Music generation
summary: Generar música mediante music_generate en flujos de trabajo de Google Lyria, MiniMax y ComfyUI
title: Generación de música
x-i18n:
    generated_at: "2026-05-05T05:25:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: f5e74aa7d43ffe00adb6d6c170d36dbc107f2baf0069243733c5dd6e4582175a
    source_path: tools/music-generation.md
    workflow: 16
---

La herramienta `music_generate` permite que el agente cree música o audio mediante la
capacidad compartida de generación musical con proveedores configurados: Google,
MiniMax y ComfyUI configurado por flujo de trabajo actualmente.

Para ejecuciones de agente respaldadas por sesión, OpenClaw inicia la generación musical como una
tarea en segundo plano, la registra en el libro de tareas y luego despierta de nuevo al agente
cuando la pista está lista para que pueda avisar al usuario y adjuntar el audio
terminado. En chats de grupo/canal que usan entrega visible solo mediante herramienta de mensajes,
el agente retransmite el resultado mediante la herramienta de mensajes. Si el
agente de finalización escribe solo una respuesta final privada, OpenClaw recurre a un
envío directo al canal con los medios generados. El despertar de finalización advierte explícitamente
al agente de que las respuestas finales normales son privadas en esas rutas.

<Note>
La herramienta compartida integrada solo aparece cuando hay al menos un proveedor de generación
musical disponible. Si no ves `music_generate` en las herramientas de tu agente,
configura `agents.defaults.musicGenerationModel` o configura una clave de API de
proveedor.
</Note>

## Inicio rápido

<Tabs>
  <Tab title="Respaldado por proveedor compartido">
    <Steps>
      <Step title="Configurar autenticación">
        Define una clave de API para al menos un proveedor; por ejemplo,
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
      <Step title="Pedirle al agente">
        _"Genera una pista synthpop animada sobre un viaje nocturno en coche por una
        ciudad de neón."_

        El agente llama a `music_generate` automáticamente. No hace falta
        incluir la herramienta en una lista de permitidas.
      </Step>
    </Steps>

    Para contextos síncronos directos sin una ejecución de agente respaldada por sesión,
    la herramienta integrada sigue recurriendo a la generación en línea y devuelve
    la ruta final del medio en el resultado de la herramienta.

  </Tab>
  <Tab title="Flujo de trabajo de ComfyUI">
    <Steps>
      <Step title="Configurar el flujo de trabajo">
        Configura `plugins.entries.comfy.config.music` con un flujo de trabajo
        JSON y nodos de prompt/salida.
      </Step>
      <Step title="Autenticación en la nube (opcional)">
        Para Comfy Cloud, define `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Llamar a la herramienta">
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

## Proveedores admitidos

| Proveedor | Modelo predeterminado  | Entradas de referencia | Controles admitidos                                      | Autenticación                          |
| -------- | ---------------------- | ---------------------- | -------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Hasta 1 imagen         | Música o audio definidos por el flujo de trabajo         | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Hasta 10 imágenes      | `lyrics`, `instrumental`, `format`                       | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.6`            | Ninguna                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` o MiniMax OAuth      |

### Matriz de capacidades

El contrato de modo explícito usado por `music_generate`, las pruebas de contrato y el
barrido en vivo compartido:

| Proveedor | `generate` | `edit` | Límite de edición | Carriles en vivo compartidos                                               |
| -------- | :--------: | :----: | ----------------- | -------------------------------------------------------------------------- |
| ComfyUI  |     ✓      |   ✓    | 1 imagen          | No está en el barrido compartido; cubierto por `extensions/comfy/comfy.live.test.ts` |
| Google   |     ✓      |   ✓    | 10 imágenes       | `generate`, `edit`                                                         |
| MiniMax  |     ✓      |   —    | Ninguno           | `generate`                                                                 |

Usa `action: "list"` para inspeccionar los proveedores y modelos compartidos disponibles en
tiempo de ejecución:

```text
/tool music_generate action=list
```

Usa `action: "status"` para inspeccionar la tarea musical activa respaldada por sesión:

```text
/tool music_generate action=status
```

Ejemplo de generación directa:

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parámetros de la herramienta

<ParamField path="prompt" type="string" required>
  Prompt de generación musical. Obligatorio para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` devuelve la tarea de sesión actual; `"list"` inspecciona los proveedores.
</ParamField>
<ParamField path="model" type="string">
  Anulación de proveedor/modelo (por ejemplo, `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Letra opcional cuando el proveedor admite una entrada explícita de letra.
</ParamField>
<ParamField path="instrumental" type="boolean">
  Solicita una salida solo instrumental cuando el proveedor lo admite.
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
  Indicación de formato de salida cuando el proveedor lo admite.
</ParamField>
<ParamField path="filename" type="string">Indicación de nombre de archivo de salida.</ParamField>
<ParamField path="timeoutMs" type="number">Tiempo de espera opcional para la solicitud al proveedor, en milisegundos. Los valores inferiores a 10000ms se elevan a 10000ms y se informan en el resultado de la herramienta.</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. OpenClaw sigue validando los
límites estrictos, como los recuentos de entrada, antes del envío. Cuando un proveedor admite
duración pero usa un máximo más corto que el valor solicitado, OpenClaw
lo ajusta a la duración compatible más cercana. Las indicaciones opcionales realmente no admitidas
se ignoran con una advertencia cuando el proveedor o modelo seleccionado no puede respetarlas.
Los resultados de la herramienta informan la configuración aplicada; `details.normalization`
captura cualquier asignación de solicitado a aplicado.
</Note>

## Comportamiento asíncrono

La generación musical respaldada por sesión se ejecuta como una tarea en segundo plano:

- **Tarea en segundo plano:** `music_generate` crea una tarea en segundo plano, devuelve una
  respuesta de inicio/tarea inmediatamente y publica la pista terminada más tarde en
  un mensaje de seguimiento del agente.
- **Prevención de duplicados:** mientras una tarea está `queued` o `running`, las llamadas
  posteriores a `music_generate` en la misma sesión devuelven el estado de la tarea en lugar de
  iniciar otra generación. Usa `action: "status"` para comprobarlo explícitamente.
- **Consulta de estado:** `openclaw tasks list` u `openclaw tasks show <taskId>`
  inspecciona los estados en cola, en ejecución y terminales.
- **Despertar de finalización:** OpenClaw inyecta un evento interno de finalización de vuelta
  en la misma sesión para que el modelo pueda escribir por sí mismo el seguimiento visible para el usuario.
- **Indicación de prompt:** los turnos posteriores de usuario/manual en la misma sesión reciben una pequeña
  indicación de tiempo de ejecución cuando ya hay una tarea musical en curso, para que el modelo
  no vuelva a llamar a `music_generate` a ciegas.
- **Alternativa sin sesión:** los contextos directos/locales sin una sesión real de agente
  se ejecutan en línea y devuelven el resultado de audio final en el mismo turno.

### Ciclo de vida de la tarea

| Estado      | Significado                                                                                    |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `queued`    | Tarea creada, esperando a que el proveedor la acepte.                                          |
| `running`   | El proveedor está procesando (normalmente de 30 segundos a 3 minutos según el proveedor y la duración). |
| `succeeded` | Pista lista; el agente despierta y la publica en la conversación.                              |
| `failed`    | Error del proveedor o tiempo de espera agotado; el agente despierta con detalles del error.    |

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
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Orden de selección de proveedor

OpenClaw prueba los proveedores en este orden:

1. Parámetro `model` de la llamada a la herramienta (si el agente especifica uno).
2. `musicGenerationModel.primary` de la configuración.
3. `musicGenerationModel.fallbacks` en orden.
4. Detección automática usando solo valores predeterminados de proveedores respaldados por autenticación:
   - primero el proveedor predeterminado actual;
   - los demás proveedores de generación musical registrados en orden de id de proveedor.

Si un proveedor falla, se prueba automáticamente el siguiente candidato. Si todos
fallan, el error incluye detalles de cada intento.

Define `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar solo
entradas explícitas de `model`, `primary` y `fallbacks`.

## Notas de proveedores

<AccordionGroup>
  <Accordion title="ComfyUI">
    Se basa en flujos de trabajo y depende del grafo configurado más el mapeo de nodos
    para campos de prompt/salida. El plugin `comfy` incluido se conecta a la
    herramienta compartida `music_generate` mediante el registro de proveedores de generación
    musical.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa generación por lotes de Lyria 3. El flujo incluido actual admite
    prompt, texto opcional de letra e imágenes de referencia opcionales.
  </Accordion>
  <Accordion title="MiniMax">
    Usa el endpoint por lotes `music_generation`. Admite prompt, letra opcional,
    modo instrumental, orientación de duración y salida mp3 mediante
    autenticación con clave de API de `minimax` u OAuth de `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Elegir la ruta adecuada

- **Respaldado por proveedor compartido** cuando quieres selección de modelo, conmutación por error
  de proveedor y el flujo integrado asíncrono de tarea/estado.
- **Ruta de Plugin (ComfyUI)** cuando necesitas un grafo de flujo de trabajo personalizado o un
  proveedor que no forma parte de la capacidad musical compartida incluida.

Si estás depurando comportamiento específico de ComfyUI, consulta
[ComfyUI](/es/providers/comfy). Si estás depurando comportamiento de proveedor
compartido, empieza por [Google (Gemini)](/es/providers/google) o
[MiniMax](/es/providers/minimax).

## Modos de capacidad de proveedor

El contrato compartido de generación musical admite declaraciones de modo explícitas:

- `generate` para generación solo con prompt.
- `edit` cuando la solicitud incluye una o más imágenes de referencia.

Las nuevas implementaciones de proveedores deberían preferir bloques de modo explícitos:

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
`supportsFormat` **no** bastan para anunciar compatibilidad con edición. Los proveedores
deberían declarar `generate` y `edit` explícitamente para que las pruebas en vivo, las pruebas de contrato
y la herramienta compartida `music_generate` puedan validar la compatibilidad de modo
de forma determinista.

## Pruebas en vivo

Cobertura en vivo opcional para los proveedores compartidos incluidos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper del repositorio:

```bash
pnpm test:live:media music
```

Este archivo en vivo carga variables de entorno de proveedor faltantes desde `~/.profile`, prefiere
claves de API en vivo/del entorno antes que perfiles de autenticación almacenados de forma predeterminada, y ejecuta tanto
cobertura de `generate` como de `edit` declarada cuando el proveedor habilita el modo de edición.
Cobertura actual:

- `google`: `generate` más `edit`
- `minimax`: solo `generate`
- `comfy`: cobertura en vivo de Comfy separada, no el barrido compartido de proveedores

Cobertura en vivo opcional para la ruta de música de ComfyUI incluida:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

El archivo de pruebas en vivo de Comfy también cubre los flujos de trabajo de imagen y video de comfy cuando esas
secciones están configuradas.

## Relacionado

- [Tareas en segundo plano](/es/automation/tasks) — seguimiento de tareas para ejecuciones desacopladas de `music_generate`
- [ComfyUI](/es/providers/comfy)
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — configuración de `musicGenerationModel`
- [Google (Gemini)](/es/providers/google)
- [MiniMax](/es/providers/minimax)
- [Modelos](/es/concepts/models) — configuración de modelos y conmutación por error
- [Resumen de herramientas](/es/tools)
