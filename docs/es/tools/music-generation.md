---
read_when:
    - Generar música o audio mediante el agente
    - Configurar proveedores y modelos de generación de música
    - Comprender los parámetros de la herramienta `music_generate`
sidebarTitle: Music generation
summary: Genera música mediante `music_generate` en flujos de trabajo de Google Lyria, MiniMax y ComfyUI
title: Generación de música
x-i18n:
    generated_at: "2026-04-26T11:39:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4eda549dbb93cbfe15e04462e08b7c86ff0718160244e3e5de3b041c62ee81ea
    source_path: tools/music-generation.md
    workflow: 15
---

La herramienta `music_generate` permite al agente crear música o audio mediante la
capacidad compartida de generación musical con proveedores configurados: Google,
MiniMax y ComfyUI configurado por flujos de trabajo actualmente.

Para ejecuciones del agente respaldadas por sesión, OpenClaw inicia la generación de música como una
tarea en segundo plano, la registra en el libro mayor de tareas y luego vuelve a activar al agente
cuando la pista está lista para que el agente pueda publicar el audio terminado de vuelta en
el canal original.

<Note>
La herramienta compartida integrada solo aparece cuando al menos un proveedor de generación musical
está disponible. Si no ves `music_generate` en las herramientas de tu agente,
configura `agents.defaults.musicGenerationModel` o establece una
clave de API del proveedor.
</Note>

## Inicio rápido

<Tabs>
  <Tab title="Respaldado por proveedor compartido">
    <Steps>
      <Step title="Configura la autenticación">
        Establece una clave de API para al menos un proveedor; por ejemplo,
        `GEMINI_API_KEY` o `MINIMAX_API_KEY`.
      </Step>
      <Step title="Elige un modelo predeterminado (opcional)">
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
      <Step title="Pídele al agente">
        _"Genera una pista synthpop animada sobre un viaje nocturno por una
        ciudad de neón."_

        El agente llama a `music_generate` automáticamente. No se necesita
        lista de herramientas permitidas.
      </Step>
    </Steps>

    Para contextos síncronos directos sin una ejecución del agente respaldada por sesión,
    la herramienta integrada sigue recurriendo a la generación en línea y devuelve
    la ruta final del medio en el resultado de la herramienta.

  </Tab>
  <Tab title="Flujo de trabajo de ComfyUI">
    <Steps>
      <Step title="Configura el flujo de trabajo">
        Configura `plugins.entries.comfy.config.music` con un flujo de trabajo
        JSON y nodos de prompt/salida.
      </Step>
      <Step title="Autenticación en la nube (opcional)">
        Para Comfy Cloud, establece `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`.
      </Step>
      <Step title="Llama a la herramienta">
        ```text
        /tool music_generate prompt="Bucle synth ambiental cálido con textura suave de cinta"
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

Ejemplos de prompts:

```text
Genera una pista cinematográfica de piano con cuerdas suaves y sin voces.
```

```text
Genera un bucle chiptune enérgico sobre el lanzamiento de un cohete al amanecer.
```

## Proveedores compatibles

| Proveedor | Modelo predeterminado    | Entradas de referencia | Controles admitidos                                      | Autenticación                         |
| --------- | ------------------------ | ---------------------- | -------------------------------------------------------- | ------------------------------------- |
| ComfyUI   | `workflow`               | Hasta 1 imagen         | Música o audio definidos por el flujo de trabajo         | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google    | `lyria-3-clip-preview`   | Hasta 10 imágenes      | `lyrics`, `instrumental`, `format`                       | `GEMINI_API_KEY`, `GOOGLE_API_KEY`    |
| MiniMax   | `music-2.6`              | Ninguna                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3` | `MINIMAX_API_KEY` o MiniMax OAuth     |

### Matriz de capacidades

El contrato explícito de modos usado por `music_generate`, las pruebas de contrato y el
barrido compartido en vivo:

| Proveedor | `generate` | `edit` | Límite de edición | Lanes compartidos en vivo                                                     |
| --------- | :--------: | :----: | ----------------- | ----------------------------------------------------------------------------- |
| ComfyUI   |     ✓      |   ✓    | 1 imagen          | No está en el barrido compartido; lo cubre `extensions/comfy/comfy.live.test.ts` |
| Google    |     ✓      |   ✓    | 10 imágenes       | `generate`, `edit`                                                            |
| MiniMax   |     ✓      |   —    | Ninguno           | `generate`                                                                    |

Usa `action: "list"` para inspeccionar en tiempo de ejecución los proveedores y modelos compartidos disponibles:

```text
/tool music_generate action=list
```

Usa `action: "status"` para inspeccionar la tarea musical activa respaldada por sesión:

```text
/tool music_generate action=status
```

Ejemplo de generación directa:

```text
/tool music_generate prompt="Lo-fi hip hop onírico con textura de vinilo y lluvia suave" instrumental=true
```

## Parámetros de la herramienta

<ParamField path="prompt" type="string" required>
  Prompt de generación musical. Obligatorio para `action: "generate"`.
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` devuelve la tarea actual de la sesión; `"list"` inspecciona los proveedores.
</ParamField>
<ParamField path="model" type="string">
  Reemplazo de proveedor/modelo (por ejemplo, `google/lyria-3-pro-preview`,
  `comfy/workflow`).
</ParamField>
<ParamField path="lyrics" type="string">
  Letras opcionales cuando el proveedor admite entrada explícita de letras.
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
  Sugerencia de formato de salida cuando el proveedor lo admite.
</ParamField>
<ParamField path="filename" type="string">Sugerencia de nombre del archivo de salida.</ParamField>
<ParamField path="timeoutMs" type="number">Tiempo de espera opcional de la solicitud al proveedor en milisegundos.</ParamField>

<Note>
No todos los proveedores admiten todos los parámetros. OpenClaw sigue validando límites estrictos
como la cantidad de entradas antes del envío. Cuando un proveedor admite
duración pero usa un máximo más corto que el valor solicitado, OpenClaw
lo ajusta a la duración compatible más cercana. Las sugerencias opcionales realmente no admitidas
se ignoran con una advertencia cuando el proveedor o modelo seleccionado no puede aplicarlas.
Los resultados de la herramienta informan la configuración aplicada; `details.normalization`
captura cualquier asignación de solicitado a aplicado.
</Note>

## Comportamiento asíncrono

La generación musical respaldada por sesión se ejecuta como una tarea en segundo plano:

- **Tarea en segundo plano:** `music_generate` crea una tarea en segundo plano, devuelve una
  respuesta de inicio/tarea inmediatamente y publica la pista terminada después en
  un mensaje de seguimiento del agente.
- **Prevención de duplicados:** mientras una tarea esté en `queued` o `running`, las llamadas posteriores a
  `music_generate` en la misma sesión devuelven el estado de la tarea en lugar de
  iniciar otra generación. Usa `action: "status"` para comprobarlo explícitamente.
- **Consulta de estado:** `openclaw tasks list` o `openclaw tasks show <taskId>`
  inspecciona el estado en cola, en ejecución y terminal.
- **Activación al completar:** OpenClaw inyecta un evento interno de finalización de vuelta
  en la misma sesión para que el modelo pueda escribir por sí mismo el seguimiento orientado al usuario.
- **Sugerencia del prompt:** los turnos posteriores del usuario/manuales en la misma sesión reciben una pequeña
  sugerencia de tiempo de ejecución cuando ya hay una tarea musical en curso, para que el modelo no
  llame ciegamente a `music_generate` otra vez.
- **Alternativa sin sesión:** los contextos directos/locales sin una sesión real del agente
  se ejecutan en línea y devuelven el resultado final de audio en el mismo turno.

### Ciclo de vida de la tarea

| Estado      | Significado                                                                                   |
| ----------- | --------------------------------------------------------------------------------------------- |
| `queued`    | Tarea creada, esperando que el proveedor la acepte.                                           |
| `running`   | El proveedor está procesando (normalmente entre 30 segundos y 3 minutos según el proveedor y la duración). |
| `succeeded` | La pista está lista; el agente se activa y la publica en la conversación.                     |
| `failed`    | Error o tiempo de espera del proveedor; el agente se activa con detalles del error.           |

Consulta el estado desde la CLI:

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
4. Detección automática usando solo valores predeterminados del proveedor respaldados por autenticación:
   - primero el proveedor predeterminado actual;
   - después los proveedores de generación musical registrados restantes en orden de ID de proveedor.

Si un proveedor falla, se prueba automáticamente el siguiente candidato. Si todos
fallan, el error incluye detalles de cada intento.

Establece `agents.defaults.mediaGenerationAutoProviderFallback: false` para usar solo
las entradas explícitas `model`, `primary` y `fallbacks`.

## Notas sobre proveedores

<AccordionGroup>
  <Accordion title="ComfyUI">
    Está impulsado por flujos de trabajo y depende del grafo configurado más la asignación de nodos
    para campos de prompt/salida. El plugin `comfy` integrado se conecta a la
    herramienta compartida `music_generate` mediante el registro de proveedores
    de generación musical.
  </Accordion>
  <Accordion title="Google (Lyria 3)">
    Usa generación por lotes de Lyria 3. El flujo integrado actual admite
    prompt, texto de letras opcional e imágenes de referencia opcionales.
  </Accordion>
  <Accordion title="MiniMax">
    Usa el endpoint por lotes `music_generation`. Admite prompt, letras opcionales,
    modo instrumental, control de duración y salida mp3 mediante
    autenticación por clave de API `minimax` o OAuth `minimax-portal`.
  </Accordion>
</AccordionGroup>

## Elegir la ruta correcta

- **Respaldado por proveedor compartido** cuando quieras selección de modelo, conmutación por error del proveedor y el flujo integrado de tarea/estado asíncronos.
- **Ruta de plugin (ComfyUI)** cuando necesites un grafo de flujo de trabajo personalizado o un
  proveedor que no forme parte de la capacidad musical compartida integrada.

Si estás depurando un comportamiento específico de ComfyUI, consulta
[ComfyUI](/es/providers/comfy). Si estás depurando un comportamiento compartido del proveedor,
empieza por [Google (Gemini)](/es/providers/google) o
[MiniMax](/es/providers/minimax).

## Modos de capacidad del proveedor

El contrato compartido de generación musical admite declaraciones explícitas de modo:

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
`supportsFormat` **no** son suficientes para anunciar compatibilidad con edición. Los proveedores
deben declarar `generate` y `edit` explícitamente para que las pruebas en vivo, las pruebas de contrato
y la herramienta compartida `music_generate` puedan validar la compatibilidad de modos
de forma determinista.

## Pruebas en vivo

Cobertura en vivo opcional para los proveedores compartidos integrados:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper del repositorio:

```bash
pnpm test:live:media music
```

Este archivo en vivo carga las variables de entorno del proveedor que falten desde `~/.profile`, prioriza
las claves de API en vivo/del entorno por encima de los perfiles de autenticación almacenados de forma predeterminada y ejecuta cobertura tanto de
`generate` como de `edit` declarado cuando el proveedor habilita el modo de edición.
Cobertura actual:

- `google`: `generate` más `edit`
- `minimax`: solo `generate`
- `comfy`: cobertura en vivo separada de Comfy, no en el barrido compartido de proveedores

Cobertura en vivo opcional para la ruta musical integrada de ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

El archivo en vivo de Comfy también cubre los flujos de trabajo de imágenes y video de comfy cuando esas
secciones están configuradas.

## Relacionado

- [Tareas en segundo plano](/es/automation/tasks) — seguimiento de tareas para ejecuciones desacopladas de `music_generate`
- [ComfyUI](/es/providers/comfy)
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) — configuración de `musicGenerationModel`
- [Google (Gemini)](/es/providers/google)
- [MiniMax](/es/providers/minimax)
- [Modelos](/es/concepts/models) — configuración de modelos y conmutación por error
- [Resumen de herramientas](/es/tools)
