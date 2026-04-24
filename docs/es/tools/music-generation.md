---
read_when:
    - Generar música o audio mediante el agente
    - |-
      Configurar proveedores y modelos de generación de música♀♀♀assistant to=functions.read մեկնաբանություն  天天中彩票上json  天天中彩票官网ված  天天爱彩票是json
      {"path":"AGENTS.md","offset":1,"limit":80}
    - Entender los parámetros de la herramienta `music_generate`
summary: Generar música con proveedores compartidos, incluidos plugins respaldados por flujo de trabajo
title: Generación de música
x-i18n:
    generated_at: "2026-04-24T05:55:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5fe640c6b83f6f2cf5ad8e57294da147f241706c30eee0d0eb6f7d82cbbe0d3
    source_path: tools/music-generation.md
    workflow: 15
---

La herramienta `music_generate` permite que el agente cree música o audio mediante la
capacidad compartida de generación de música con proveedores configurados como Google,
MiniMax y plugins ComfyUI configurados por flujo de trabajo.

Para sesiones de agente respaldadas por proveedores compartidos, OpenClaw inicia la generación de música como una
tarea en segundo plano, la registra en el libro de tareas y luego vuelve a despertar al agente cuando
la pista está lista para que el agente pueda publicar el audio terminado de vuelta en el
canal original.

<Note>
La herramienta compartida integrada solo aparece cuando al menos un proveedor de generación de música está disponible. Si no ves `music_generate` en las herramientas de tu agente, configura `agents.defaults.musicGenerationModel` o establece una clave API de proveedor.
</Note>

## Inicio rápido

### Generación respaldada por proveedor compartido

1. Configura una clave API para al menos un proveedor, por ejemplo `GEMINI_API_KEY` o
   `MINIMAX_API_KEY`.
2. Opcionalmente configura tu modelo preferido:

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

3. Pide al agente: _"Generate an upbeat synthpop track about a night drive
   through a neon city."_

El agente llama a `music_generate` automáticamente. No se necesita allowlist de herramientas.

Para contextos sincrónicos directos sin una ejecución de agente respaldada por sesión, la herramienta integrada
sigue usando como respaldo la generación inline y devuelve la ruta final del medio en
el resultado de la herramienta.

Ejemplos de prompts:

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### Generación Comfy basada en flujo de trabajo

El Plugin integrado `comfy` se conecta a la herramienta compartida `music_generate` mediante
el registro de proveedores de generación de música.

1. Configura `models.providers.comfy.music` con un JSON de flujo de trabajo y
   nodos de prompt/salida.
2. Si usas Comfy Cloud, configura `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`.
3. Pide al agente música o llama a la herramienta directamente.

Ejemplo:

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## Compatibilidad compartida de proveedores integrados

| Proveedor | Modelo predeterminado    | Entradas de referencia | Controles admitidos                                         | Clave API                               |
| --------- | ------------------------ | ---------------------- | ----------------------------------------------------------- | --------------------------------------- |
| ComfyUI   | `workflow`               | Hasta 1 imagen         | Música o audio definidos por flujo de trabajo               | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY`  |
| Google    | `lyria-3-clip-preview`   | Hasta 10 imágenes      | `lyrics`, `instrumental`, `format`                          | `GEMINI_API_KEY`, `GOOGLE_API_KEY`      |
| MiniMax   | `music-2.5+`             | Ninguna                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3`   | `MINIMAX_API_KEY`                       |

### Matriz de capacidades declaradas

Este es el contrato explícito de modos usado por `music_generate`, las pruebas de contrato
y el barrido compartido en vivo.

| Proveedor | `generate` | `edit` | Límite de edición | Líneas compartidas en vivo                                                  |
| --------- | ---------- | ------ | ----------------- | ---------------------------------------------------------------------------- |
| ComfyUI   | Sí         | Sí     | 1 imagen          | No está en el barrido compartido; cubierto por `extensions/comfy/comfy.live.test.ts` |
| Google    | Sí         | Sí     | 10 imágenes       | `generate`, `edit`                                                           |
| MiniMax   | Sí         | No     | Ninguno           | `generate`                                                                   |

Usa `action: "list"` para inspeccionar proveedores y modelos compartidos disponibles en
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

## Parámetros integrados de la herramienta

| Parámetro         | Tipo       | Descripción                                                                                         |
| ----------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `prompt`          | string     | Prompt de generación de música (obligatorio para `action: "generate"`)                              |
| `action`          | string     | `"generate"` (predeterminado), `"status"` para la tarea actual de la sesión, o `"list"` para inspeccionar proveedores |
| `model`           | string     | Sobrescritura de proveedor/modelo, por ejemplo `google/lyria-3-pro-preview` o `comfy/workflow`     |
| `lyrics`          | string     | Letras opcionales cuando el proveedor admite entrada explícita de letras                            |
| `instrumental`    | boolean    | Solicitar salida solo instrumental cuando el proveedor lo admite                                    |
| `image`           | string     | Ruta o URL de una sola imagen de referencia                                                         |
| `images`          | string[]   | Varias imágenes de referencia (hasta 10)                                                            |
| `durationSeconds` | number     | Duración objetivo en segundos cuando el proveedor admite sugerencias de duración                    |
| `timeoutMs`       | number     | Tiempo de espera opcional de la solicitud al proveedor en milisegundos                              |
| `format`          | string     | Sugerencia de formato de salida (`mp3` o `wav`) cuando el proveedor lo admite                       |
| `filename`        | string     | Sugerencia de nombre de archivo de salida                                                           |

No todos los proveedores admiten todos los parámetros. OpenClaw sigue validando límites estrictos
como el número de entradas antes del envío. Cuando un proveedor admite duración pero
usa un máximo menor que el valor solicitado, OpenClaw ajusta automáticamente
al valor compatible más cercano. Las sugerencias opcionales realmente no compatibles se ignoran
con una advertencia cuando el proveedor o modelo seleccionado no puede respetarlas.

Los resultados de la herramienta informan de la configuración aplicada. Cuando OpenClaw ajusta la duración durante el failover del proveedor, el `durationSeconds` devuelto refleja el valor enviado y `details.normalization.durationSeconds` muestra el mapeo de solicitado a aplicado.

## Comportamiento asíncrono para la ruta compartida respaldada por proveedor

- Ejecuciones de agente respaldadas por sesión: `music_generate` crea una tarea en segundo plano, devuelve inmediatamente una respuesta de inicio/tarea y publica la pista terminada más tarde en un mensaje de seguimiento del agente.
- Prevención de duplicados: mientras esa tarea en segundo plano siga `queued` o `running`, las llamadas posteriores a `music_generate` en la misma sesión devuelven el estado de la tarea en lugar de iniciar otra generación.
- Consulta de estado: usa `action: "status"` para inspeccionar la tarea de música activa respaldada por sesión sin iniciar una nueva.
- Seguimiento de tareas: usa `openclaw tasks list` o `openclaw tasks show <taskId>` para inspeccionar el estado en cola, en ejecución y terminal de la generación.
- Reactivación al completarse: OpenClaw inyecta un evento interno de finalización de vuelta en la misma sesión para que el modelo pueda escribir por sí mismo el seguimiento orientado al usuario.
- Sugerencia de prompt: los turnos posteriores de usuario/manual en la misma sesión reciben una pequeña sugerencia de entorno de ejecución cuando ya hay una tarea de música en curso para que el modelo no vuelva a llamar ciegamente a `music_generate`.
- Respaldo sin sesión: los contextos directos/locales sin una sesión real de agente siguen ejecutándose inline y devuelven el resultado final de audio en el mismo turno.

### Ciclo de vida de la tarea

Cada solicitud `music_generate` pasa por cuatro estados:

1. **queued** -- tarea creada, esperando a que el proveedor la acepte.
2. **running** -- el proveedor está procesando (normalmente entre 30 segundos y 3 minutos según el proveedor y la duración).
3. **succeeded** -- la pista está lista; el agente se reactiva y la publica en la conversación.
4. **failed** -- error del proveedor o tiempo de espera agotado; el agente se reactiva con detalles del error.

Comprueba el estado desde la CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prevención de duplicados: si ya hay una tarea de música `queued` o `running` para la sesión actual, `music_generate` devuelve el estado de la tarea existente en lugar de iniciar una nueva. Usa `action: "status"` para comprobarlo explícitamente sin activar una nueva generación.

## Configuración

### Selección de modelo

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Orden de selección de proveedores

Al generar música, OpenClaw prueba los proveedores en este orden:

1. parámetro `model` de la llamada a la herramienta, si el agente especifica uno
2. `musicGenerationModel.primary` de la configuración
3. `musicGenerationModel.fallbacks` en orden
4. detección automática usando solo valores predeterminados de proveedores respaldados por autenticación:
   - primero el proveedor predeterminado actual
   - luego los proveedores restantes registrados de generación de música en orden de ID de proveedor

Si un proveedor falla, el siguiente candidato se prueba automáticamente. Si todos fallan, el
error incluye detalles de cada intento.

Configura `agents.defaults.mediaGenerationAutoProviderFallback: false` si quieres que la
generación de música use solo las entradas explícitas `model`, `primary` y `fallbacks`.

## Notas de proveedores

- Google usa generación por lotes de Lyria 3. El flujo integrado actual admite
  prompt, texto opcional de letras e imágenes de referencia opcionales.
- MiniMax usa el endpoint por lotes `music_generation`. El flujo integrado actual
  admite prompt, letras opcionales, modo instrumental, ajuste de duración y
  salida mp3.
- La compatibilidad con ComfyUI está impulsada por flujo de trabajo y depende del grafo configurado más
  el mapeo de nodos para campos de prompt/salida.

## Modos de capacidad del proveedor

El contrato compartido de generación de música ahora admite declaraciones explícitas de modo:

- `generate` para generación solo con prompt
- `edit` cuando la solicitud incluye una o más imágenes de referencia

Las nuevas implementaciones de proveedores deberían preferir bloques explícitos de modo:

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
`supportsFormat` no bastan para anunciar compatibilidad con edición. Los proveedores deberían
declarar `generate` y `edit` explícitamente para que las pruebas en vivo, pruebas de contrato y
la herramienta compartida `music_generate` puedan validar la compatibilidad de modos de forma determinista.

## Elegir la ruta adecuada

- Usa la ruta compartida respaldada por proveedor cuando quieras selección de modelo, failover de proveedor y el flujo asíncrono integrado de tarea/estado.
- Usa una ruta de plugin como ComfyUI cuando necesites un grafo de flujo de trabajo personalizado o un proveedor que no forme parte de la capacidad integrada compartida de música.
- Si estás depurando comportamiento específico de ComfyUI, consulta [ComfyUI](/es/providers/comfy). Si estás depurando comportamiento de proveedor compartido, empieza por [Google (Gemini)](/es/providers/google) o [MiniMax](/es/providers/minimax).

## Pruebas en vivo

Cobertura en vivo opcional para los proveedores integrados compartidos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Wrapper del repositorio:

```bash
pnpm test:live:media music
```

Este archivo en vivo carga variables env de proveedor que faltan desde `~/.profile`, prefiere
por defecto claves API activas/env sobre perfiles de autenticación almacenados y ejecuta cobertura tanto de
`generate` como de `edit` declarado cuando el proveedor habilita el modo edit.

Hoy eso significa:

- `google`: `generate` más `edit`
- `minimax`: solo `generate`
- `comfy`: cobertura en vivo separada de Comfy, no el barrido de proveedor compartido

Cobertura en vivo opcional para la ruta integrada de música de ComfyUI:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

El archivo en vivo de Comfy también cubre flujos de trabajo de imagen y video de comfy cuando esas
secciones están configuradas.

## Relacionado

- [Tareas en segundo plano](/es/automation/tasks) - seguimiento de tareas para ejecuciones desacopladas de `music_generate`
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) - configuración de `musicGenerationModel`
- [ComfyUI](/es/providers/comfy)
- [Google (Gemini)](/es/providers/google)
- [MiniMax](/es/providers/minimax)
- [Modelos](/es/concepts/models) - configuración de modelos y failover
- [Resumen de herramientas](/es/tools)
