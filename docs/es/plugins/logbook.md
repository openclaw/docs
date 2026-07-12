---
read_when:
    - Quieres una cronología de tu día al estilo de Dayflow en la interfaz de control
    - Estás habilitando o configurando el Plugin Logbook incluido
    - Quieres resúmenes de reuniones diarias o recordar lo ocurrido durante el día a partir de la actividad en pantalla.
summary: Diario de trabajo automático opcional creado a partir de capturas de pantalla periódicas
title: Plugin de bitácora
x-i18n:
    generated_at: "2026-07-11T23:17:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

El Plugin Logbook convierte la actividad de la pantalla en un diario de trabajo automático. Captura instantáneas periódicas de la pantalla desde un Node emparejado, las resume en observaciones con marcas de tiempo y crea tarjetas de cronología en la [interfaz de control](/es/web/control-ui). También puede generar notas diarias para la reunión de seguimiento y responder preguntas sobre un día registrado.

El estado propiedad de OpenClaw permanece en el Gateway, en `<state-dir>/logbook/`, pero el procesamiento de los modelos no es necesariamente local. Las capturas de pantalla muestreadas se envían a la ruta de visión configurada; las observaciones y el texto de la cronología se envían al modelo predeterminado del agente. Use rutas de modelos locales para ambas etapas si el contenido de la pantalla y el texto de actividad derivado deben permanecer en la máquina.

Logbook viene incluido y está deshabilitado de forma predeterminada. Al habilitar el Plugin, se autoriza al Gateway a capturar la pantalla, ya que `captureEnabled` tiene como valor predeterminado `true`.

## Antes de comenzar

Necesita:

- Un Node conectado que exponga `screen.snapshot` o `logbook.snapshot`. El Node de la aplicación para macOS necesita permiso de grabación de pantalla. Un host de Node macOS sin interfaz gráfica (`openclaw node host run`) obtiene el comando `logbook.snapshot` proporcionado por el Plugin y respaldado por la herramienta del sistema `screencapture`.
- El Plugin Codex incluido habilitado y autenticado. Actualmente, Codex proporciona el contrato de extracción estructurada de imágenes que requiere Logbook. Inicie sesión con `openclaw models auth login --provider openai`; consulte el [entorno de ejecución de Codex](/es/plugins/codex-harness) para conocer otras vías de autenticación.
- Un modelo predeterminado de agente que funcione. Logbook lo usa para sintetizar tarjetas, notas para la reunión de seguimiento y preguntas y respuestas sobre el día después de la etapa de visión.

## Inicio rápido

Habilite los Plugins Codex y Logbook:

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

Configure un modelo de visión explícito para que el inicio sea determinista:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          visionModel: "codex/gpt-5.6-sol",
        },
      },
    },
  },
}
```

Si usa `plugins.allow`, incluya tanto `codex` como `logbook`. Reinicie el Gateway después de cambiar la configuración de los Plugins; luego inspeccione los registros y abra el panel:

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

La descripción del Node debe incluir `screen.snapshot` o `logbook.snapshot`. Los Nodes sin interfaz gráfica anuncian `logbook.snapshot` solo después de que el Plugin esté activo. Consulte la [solución de problemas de Nodes](/es/nodes/troubleshooting) si falta el comando.

La pestaña Logbook solo aparece cuando el Plugin está habilitado y la sesión de la interfaz de control tiene `operator.write`. La fila de estado debe mostrar **Capturando** sin errores. Aparece una tarjeta de cronología cuando se cierra la ventana de análisis; también puede seleccionar **Analizar ahora** después de capturar actividad.

## Cómo funciona

1. **Captura**: cada `captureIntervalSeconds` (30 s de forma predeterminada), Logbook invoca el comando de captura del Node seleccionado y almacena un fotograma JPEG escalado. Los fotogramas consecutivos idénticos se marcan como inactivos y se excluyen del análisis.
2. **Observación**: cuando transcurre una ventana de análisis (15 minutos de forma predeterminada), el Plugin muestrea hasta 16 fotogramas activos y los envía al modelo de visión, que devuelve observaciones de actividad con marcas de tiempo ("VS Code: editando store.ts, corrigiendo un error de tipo"). Un intervalo de captura superior a dos minutos o la medianoche local también cierran la ventana actual.
3. **Síntesis**: las observaciones, junto con los últimos 45 minutos de tarjetas existentes, se revisan para convertirlas en tarjetas de cronología (de 10 a 60 minutos cada una) con título, resumen, categoría, aplicación principal y cualquier distracción breve.
4. **Depuración**: se eliminan los fotogramas anteriores a `retentionDays` (14 de forma predeterminada). Se conservan las tarjetas, las observaciones y las notas para la reunión de seguimiento almacenadas en caché.

Los límites de los días y los relojes de la cronología usan la zona horaria local del Gateway, no la del navegador. Los fotogramas y la base de datos SQLite de la cronología se encuentran en `<state-dir>/logbook/`.

## Flujo de modelos y datos

Logbook usa dos rutas de modelos independientes:

| Etapa                          | Datos enviados                                                        | Ruta del modelo                                                              |
| ------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Observación                    | Hasta 16 fotogramas JPEG muestreados y sus horas de captura           | `visionModel` o una entrada Codex `tools.media` compatible tomada en préstamo |
| Síntesis de tarjetas           | Observaciones con marcas de tiempo y tarjetas recientes de cronología | Modelo predeterminado del agente mediante el entorno de ejecución LLM del Plugin |
| Generación de nota de seguimiento | Tarjetas del día seleccionado y del día anterior                   | Modelo predeterminado del agente mediante el entorno de ejecución LLM del Plugin |
| Preguntas sobre su día         | La pregunta, las tarjetas del día seleccionado y observaciones recientes | Modelo predeterminado del agente mediante el entorno de ejecución LLM del Plugin |

La base de datos SQLite completa no se envía a ninguno de los modelos. Las capturas de pantalla sin procesar solo se envían a la etapa de observación; la síntesis de tarjetas, la nota de seguimiento y las preguntas y respuestas reciben texto derivado.

## Configuración

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
      logbook: {
        enabled: true,
        config: {
          captureEnabled: true,
          captureIntervalSeconds: 30,
          analysisIntervalMinutes: 15,
          nodeId: "my-mac",
          screenIndex: 0,
          maxWidth: 1440,
          visionModel: "codex/gpt-5.6-sol",
          retentionDays: 14,
        },
      },
    },
  },
}
```

Todas las claves de configuración de Logbook son opcionales. Los valores numéricos se redondean a enteros y se limitan al intervalo admitido.

| Clave                     | Valor predeterminado | Intervalo o valores        | Comportamiento                                                                                                      |
| ------------------------- | -------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`               | booleano                    | Interruptor maestro persistente para nuevas instantáneas; la cronología sigue disponible cuando es `false`          |
| `captureIntervalSeconds`  | `30`                 | `5`-`600`                  | Demora entre intentos de captura                                                                                    |
| `analysisIntervalMinutes` | `15`                 | `3`-`120`                  | Ventana de observación objetivo; los intervalos y la medianoche pueden cerrarla antes                               |
| `nodeId`                  | sin definir          | id o nombre visible del Node | Fija la captura a un Node conectado; la coincidencia no distingue mayúsculas de minúsculas                         |
| `screenIndex`             | `0`                  | `0`-`16`                   | Índice de pantalla basado en cero                                                                                   |
| `maxWidth`                | `1440`               | `480`-`3840`               | Límite solicitado para el tamaño de captura; macOS sin interfaz gráfica lo aplica a la dimensión más grande         |
| `visionModel`             | sin definir          | `provider/model`           | Ruta estructurada explícita; las referencias mal formadas pausan el análisis y los proveedores no admitidos hacen fallar los lotes |
| `retentionDays`           | `14`                 | `1`-`365`                  | Elimina fotogramas antiguos; se conservan las tarjetas, observaciones y notas de seguimiento                        |

Sin `nodeId`, Logbook prefiere un Node de aplicación conectado que exponga `screen.snapshot` y luego recurre a un Node sin interfaz gráfica que exponga `logbook.snapshot`. En una configuración sin fijar, un Node que falla pasa detrás de los demás Nodes aptos en la rotación. El conmutador de pausa del panel solo se aplica a la sesión y se restablece al reiniciar el Gateway; use `captureEnabled: false` para una detención persistente.

### Selección del modelo de visión

Logbook resuelve el modelo de observación en este orden:

1. `plugins.entries.logbook.config.visionModel`
2. la primera entrada Codex compatible con imágenes en `tools.media.image.models`
3. la primera entrada Codex compatible con imágenes en `tools.media.models`

Se omiten otros proveedores multimedia porque actualmente no exponen el contrato de extracción estructurada que requiere Logbook. Establecer `tools.media.image.enabled: false` deshabilita los valores predeterminados multimedia tomados en préstamo, pero un `visionModel` explícito de Logbook sigue aplicándose.

## Pestaña del panel

- **Cronología**: tarjetas expandibles por actividad con colores de categoría, la aplicación principal, etiquetas de distracciones y un fotograma clave de instantánea.
- **Resumen del día**: proporción de concentración, desglose por categorías y aplicaciones principales.
- **Nota diaria de seguimiento**: convierte el día de ayer y el de hoy en una actualización lista para pegar.
- **Preguntas sobre su día**: preguntas en lenguaje natural respondidas a partir de la cronología registrada ("¿cuándo revisé la PR del Gateway?").
- **Analizar ahora**: cierra de inmediato la ventana de captura actual en lugar de esperar al intervalo de análisis.

## Métodos del Gateway

Logbook registra estos métodos RPC del Gateway:

| Método                | Parámetros               | Ámbito           | Resultado                                                                         |
| --------------------- | ------------------------ | ---------------- | --------------------------------------------------------------------------------- |
| `logbook.status`      | ninguno                  | `operator.read`  | Estado de captura, análisis, modelo, Node, día del Gateway y zona horaria del Gateway |
| `logbook.days`        | ninguno                  | `operator.read`  | Días con recuentos de tarjetas de cronología y límites temporales de las tarjetas |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | Tarjetas derivadas y estadísticas del día; usa de forma predeterminada el día actual del Gateway |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | Metadatos de fotogramas en el intervalo solicitado de milisegundos desde la época |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | Un fotograma JPEG sin procesar en base64                                           |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | Texto de seguimiento almacenado en caché o regenerado para un día                 |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | Respuesta para un día basada en la cronología                                      |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | Estado de pausa solo para la sesión y estado actualizado                           |
| `logbook.analyze.now` | ninguno                  | `operator.write` | Inicia el análisis pendiente o devuelve el motivo por el que no pudo iniciarse     |

Los métodos de lectura devuelven el estado operativo o texto derivado. Los píxeles de las capturas de pantalla sin procesar, las acciones que generan gasto del modelo y las mutaciones del entorno de ejecución requieren `operator.write`. La pestaña de la interfaz de control también requiere `operator.write` porque expone esas acciones y vistas previas de fotogramas sin procesar; un cliente de solo lectura puede seguir llamando directamente a los métodos de texto derivado.

## Notas de privacidad

- Las instantáneas pueden contener cualquier elemento de la pantalla, incluidos secretos. Los fotogramas nunca salen de la máquina, salvo como entrada muestreada para el modelo de observación configurado.
- Las observaciones, las tarjetas recientes y las preguntas pueden salir de la máquina mediante el modelo predeterminado del agente durante la síntesis de tarjetas, la generación de notas de seguimiento o las preguntas y respuestas. Aplique la política de tratamiento de datos del proveedor a ambas rutas de modelos.
- Use rutas locales tanto para el modelo de observación estructurada como para el modelo predeterminado del agente cuando necesite un flujo de procesamiento completamente local.
- Los fotogramas, la base de datos de la cronología y las capturas temporales se escriben con permisos de archivo exclusivos para el propietario.
- Añadir `screen.snapshot` a `gateway.nodes.denyCommands` es el interruptor de desactivación de la captura de pantalla: bloquea tanto la captura del Node de aplicación como el comando `logbook.snapshot` propio de Logbook.
- Establecer `tools.media.image.enabled: false` también impide que Logbook tome prestados los modelos multimedia de imágenes para el análisis; en ese caso, solo se usa un `visionModel` explícito en la configuración del Plugin.

## Solución de problemas

### Falta la pestaña Logbook

Compruebe las tres condiciones:

1. `openclaw plugins list --enabled` incluye `logbook`.
2. El Gateway se reinició después del cambio del Plugin o de la lista de permitidos.
3. La conexión de la interfaz de control tiene `operator.write`; las sesiones de solo lectura no reciben el descriptor de la pestaña interactiva.

Si se establece `plugins.allow`, debe incluir tanto `logbook` como `codex` para la
configuración recomendada.

### La captura informa de un error

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Confirme que el Node exponga `screen.snapshot` o `logbook.snapshot`.
- Conceda permiso de grabación de pantalla en el Mac de captura.
- Si `nodeId` está configurado, confirme que coincida con el identificador o el nombre para mostrar del Node.
- Compruebe que `gateway.nodes.denyCommands` no contenga
  `screen.snapshot`.

Después de tres fallos consecutivos, Logbook espera durante diez ciclos de captura y
luego vuelve a intentarlo. Una configuración sin fijar puede cambiar a otro Node apto.

### Las capturas se realizan correctamente, pero no aparecen tarjetas

- Un estado **Falta el modelo** significa que no se encontró ninguna ruta de visión
  estructurada compatible. Habilite y autentique el Plugin Codex, o establezca un
  `visionModel` explícito válido. Los fotogramas capturados permanecen pendientes mientras
  falte el modelo y pueden analizarse después de corregir la configuración.
- Espere el tiempo indicado por `analysisIntervalMinutes` o seleccione **Analizar ahora** después de
  que se haya capturado actividad.
- Los fotogramas idénticos consecutivos constituyen evidencia de inactividad y no se incluyen en los
  lotes de análisis. Cambie la pantalla visible antes de realizar la prueba.
- Si el lote más reciente muestra un error, corrija el problema del modelo o de autenticación y seleccione
  **Analizar ahora**. Los lotes fallidos solo vuelven a intentarse mediante esa acción explícita para
  evitar gastos repetidos del modelo.

## Contenido relacionado

- [Gestionar plugins](/es/plugins/manage-plugins)
- [Entorno de ejecución de Codex](/es/plugins/codex-harness)
- [Comprensión de contenido multimedia](/es/nodes/media-understanding)
- [Nodes](/es/nodes)
- [Solución de problemas de Nodes](/es/nodes/troubleshooting)
- [Interfaz de control](/es/web/control-ui)
