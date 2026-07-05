---
read_when:
    - Quieres una línea de tiempo de tu día al estilo Dayflow en la Control UI
    - Estás habilitando o configurando el Plugin Logbook incluido
    - Quieres resúmenes de standup o recordar el día basados en la actividad de pantalla
summary: Registro automático opcional de trabajo creado a partir de capturas periódicas de pantalla
title: Plugin de bitácora
x-i18n:
    generated_at: "2026-07-05T20:18:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d15a6e0835d6916c1ad5d203d6d85d6a7946b2bcb9c2985ce53a803d471c389
    source_path: plugins/logbook.md
    workflow: 16
---

El Plugin Logbook convierte la actividad de la pantalla en un diario de trabajo automático. Captura instantáneas periódicas de pantalla desde un nodo emparejado, las resume en observaciones con marca de tiempo y crea tarjetas de cronología en la [interfaz de control](/es/web/control-ui).

También puede generar notas diarias de reunión y responder preguntas sobre un día registrado.

El estado propiedad de OpenClaw permanece en el Gateway bajo `<state-dir>/logbook/`, pero el procesamiento del modelo no necesariamente es local. Las capturas muestreadas se envían a la ruta de visión configurada; las observaciones y el texto de la cronología se envían al modelo de agente predeterminado. Usa rutas de modelo locales para ambas etapas si el contenido de pantalla y el texto de actividad derivado deben permanecer en la máquina.

Logbook viene incluido y está deshabilitado de forma predeterminada. Habilitar el Plugin hace que el Gateway permita la captura de pantalla porque `captureEnabled` tiene `true` como valor predeterminado.

## Antes de empezar

Necesitas:

- Un nodo conectado que exponga `screen.snapshot` o `logbook.snapshot`. El nodo de la app de macOS necesita permiso de Grabación de pantalla. Un host de nodo macOS sin interfaz gráfica (`openclaw node host run`) obtiene el comando `logbook.snapshot` proporcionado por el Plugin, respaldado por la herramienta del sistema `screencapture`.
- El Plugin Codex incluido habilitado y autenticado. Codex actualmente proporciona el contrato de extracción estructurada de imágenes que Logbook requiere. Inicia sesión con `openclaw models auth login --provider openai`; consulta [arnés de Codex](/es/plugins/codex-harness) para otras rutas de autenticación.
- Un modelo de agente predeterminado funcional. Logbook lo usa para sintetizar tarjetas, notas de reunión y preguntas y respuestas del día después de la pasada de visión.

## Inicio rápido

Habilita los Plugins Codex y Logbook:

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

Configura un modelo de visión explícito para un inicio determinista:

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
          visionModel: "codex/gpt-5.5",
        },
      },
    },
  },
}
```

Si usas `plugins.allow`, incluye tanto `codex` como `logbook`. Reinicia el Gateway después de cambiar la configuración de Plugins; luego inspecciona los registros y abre el panel:

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

La descripción del nodo debe incluir `screen.snapshot` o `logbook.snapshot`. Los nodos sin interfaz gráfica anuncian `logbook.snapshot` solo después de que el Plugin esté activo. Consulta [solución de problemas de nodos](/es/nodes/troubleshooting) si falta el comando.

La pestaña Logbook aparece solo para un Plugin habilitado y una sesión de la interfaz de control con `operator.write`. La fila de estado debería mostrar **Capturando** sin errores. Aparece una tarjeta de cronología cuando se cierra la ventana de análisis, o puedes seleccionar **Analizar ahora** después de que se haya capturado actividad.

## Cómo funciona

1. **Captura**: cada `captureIntervalSeconds` (30 s de forma predeterminada), Logbook invoca el comando de captura del nodo seleccionado y almacena un fotograma JPEG escalado. Los fotogramas consecutivos idénticos se marcan como inactivos y se excluyen del análisis.
2. **Observación**: una vez que transcurre una ventana de análisis (15 minutos de forma predeterminada), el Plugin muestrea hasta 16 fotogramas activos y los envía al modelo de visión, que devuelve observaciones de actividad con marca de tiempo ("VS Code: editando store.ts, corrigiendo un error de tipo"). Una brecha de captura superior a dos minutos o la medianoche local también cierra la ventana actual.
3. **Síntesis**: las observaciones más los últimos 45 minutos de tarjetas existentes se revisan para formar tarjetas de cronología (de 10 a 60 minutos cada una) con título, resumen, categoría, app principal y cualquier distracción breve.
4. **Poda**: se eliminan los fotogramas más antiguos que `retentionDays` (14 de forma predeterminada). Las tarjetas, observaciones y notas de reunión en caché se conservan.

Los límites del día y los relojes de la cronología usan la zona horaria local del Gateway, no la zona horaria del navegador. Los fotogramas y la base de datos SQLite de la cronología residen bajo `<state-dir>/logbook/`.

## Modelo y flujo de datos

Logbook usa dos rutas de modelo separadas:

| Etapa             | Datos enviados                                             | Ruta de modelo                                                    |
| ----------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| Observación       | Hasta 16 fotogramas JPEG muestreados y sus horas de captura | `visionModel`, o una entrada Codex compatible prestada de `tools.media` |
| Sintetizar tarjetas | Observaciones con marca de tiempo y tarjetas recientes de cronología | Modelo de agente predeterminado mediante el runtime LLM del Plugin |
| Generar reunión   | Tarjetas del día seleccionado y del día anterior            | Modelo de agente predeterminado mediante el runtime LLM del Plugin |
| Preguntar por tu día | La pregunta, tarjetas del día seleccionado y observaciones recientes | Modelo de agente predeterminado mediante el runtime LLM del Plugin |

La base de datos SQLite completa no se envía a ningún modelo. Las capturas sin procesar van solo a la etapa de observación; la síntesis de tarjetas, la reunión y las preguntas y respuestas reciben texto derivado.

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
          visionModel: "codex/gpt-5.5",
          retentionDays: 14,
        },
      },
    },
  },
}
```

Todas las claves de configuración de Logbook son opcionales. Los valores numéricos se redondean a enteros y se limitan al rango admitido.

| Clave                     | Valor predeterminado | Rango o valores         | Comportamiento                                                                              |
| ------------------------- | -------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| `captureEnabled`          | `true`               | boolean                 | Interruptor maestro persistente para nuevas instantáneas; la cronología permanece disponible cuando es `false` |
| `captureIntervalSeconds`  | `30`                 | `5`-`600`               | Demora entre intentos de captura                                                            |
| `analysisIntervalMinutes` | `15`                 | `3`-`120`               | Ventana de observación objetivo; las brechas y la medianoche pueden cerrarla antes          |
| `nodeId`                  | sin configurar       | id de nodo o nombre visible | Fija la captura a un nodo conectado; la coincidencia no distingue mayúsculas de minúsculas |
| `screenIndex`             | `0`                  | `0`-`16`                | Índice de pantalla basado en cero                                                           |
| `maxWidth`                | `1440`               | `480`-`3840`            | Límite solicitado de tamaño de captura; macOS sin interfaz gráfica lo aplica a la dimensión mayor |
| `visionModel`             | sin configurar       | `provider/model`        | Ruta estructurada explícita; las referencias mal formadas pausan el análisis, los proveedores no admitidos fallan lotes |
| `retentionDays`           | `14`                 | `1`-`365`               | Elimina fotogramas antiguos; las tarjetas, observaciones y reuniones permanecen             |

Sin `nodeId`, Logbook prefiere un nodo de app conectado que exponga `screen.snapshot`, luego recurre a un nodo sin interfaz gráfica que exponga `logbook.snapshot`. En una configuración sin fijar, un nodo fallido rota detrás de otros nodos elegibles. El interruptor de pausa del panel es solo de sesión y se restablece cuando el Gateway se reinicia; usa `captureEnabled: false` para una detención persistente.

### Selección del modelo de visión

Logbook resuelve el modelo de observación en este orden:

1. `plugins.entries.logbook.config.visionModel`
2. la primera entrada Codex con capacidad de imagen bajo `tools.media.image.models`
3. la primera entrada Codex con capacidad de imagen bajo `tools.media.models`

Otros proveedores de medios se omiten porque actualmente no exponen el contrato de extracción estructurada que Logbook requiere. Establecer `tools.media.image.enabled: false` deshabilita los valores predeterminados de medios prestados, pero un `visionModel` explícito de Logbook sigue aplicándose.

## Pestaña del panel

- **Cronología**: tarjetas expandibles por actividad con colores de categoría, la app principal, etiquetas de distracción y un fotograma clave de instantánea.
- **El día de un vistazo**: proporción de foco, desglose por categoría, apps principales.
- **Reunión diaria**: convierte ayer y hoy en una actualización lista para pegar.
- **Preguntar por tu día**: preguntas en lenguaje natural respondidas a partir de la cronología registrada ("¿cuándo revisé el PR del gateway?").
- **Analizar ahora**: cierra la ventana de captura actual inmediatamente en lugar de esperar el intervalo de análisis.

## Métodos del Gateway

Logbook registra estos métodos RPC del Gateway:

| Método                | Parámetros               | Alcance          | Resultado                                                                |
| --------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------ |
| `logbook.status`      | ninguno                  | `operator.read`  | Estado de captura, análisis, modelo, nodo, día del Gateway y zona horaria del Gateway |
| `logbook.days`        | ninguno                  | `operator.read`  | Días con recuentos de tarjetas de cronología y límites temporales de tarjetas |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | Tarjetas derivadas y estadísticas del día; usa de forma predeterminada el día actual del Gateway |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | Metadatos de fotogramas en el rango solicitado de milisegundos desde época |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | Un fotograma JPEG sin procesar como base64                               |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | Texto de reunión en caché o regenerado para un día                       |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | Respuesta basada en la cronología para un día                            |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | Estado de pausa solo de sesión y estado actualizado                      |
| `logbook.analyze.now` | ninguno                  | `operator.write` | Inicia análisis pendiente o devuelve una razón por la que no pudo iniciar |

Los métodos de lectura devuelven estado operativo o texto derivado. Los píxeles de capturas sin procesar, las acciones con gasto de modelo y las mutaciones en runtime requieren `operator.write`. La pestaña de la interfaz de control también requiere `operator.write` porque expone esas acciones y vistas previas de fotogramas sin procesar; un cliente de solo lectura aún puede llamar directamente a los métodos de texto derivado.

## Notas de privacidad

- Las instantáneas pueden contener cualquier cosa en pantalla, incluidos secretos. Los fotogramas nunca salen de la máquina excepto como entrada muestreada para el modelo de observación configurado.
- Las observaciones, tarjetas recientes y preguntas pueden salir de la máquina mediante el modelo de agente predeterminado durante la síntesis de tarjetas, la generación de reuniones o las preguntas y respuestas. Aplica la política de manejo de datos del proveedor a ambas rutas de modelo.
- Usa rutas locales tanto para el modelo de observación estructurada como para el modelo de agente predeterminado cuando necesites una canalización completamente local.
- Los fotogramas, la base de datos de cronología y las capturas temporales se escriben con permisos de archivo solo para el propietario.
- Agregar `screen.snapshot` a `gateway.nodes.denyCommands` es el interruptor de apagado de la captura de pantalla: bloquea tanto la captura del nodo de app como el propio comando `logbook.snapshot` de Logbook.
- Establecer `tools.media.image.enabled: false` también impide que Logbook tome prestados los modelos de imagen de medios para el análisis; entonces solo se usa un `visionModel` explícito en la configuración del Plugin.

## Solución de problemas

### Falta la pestaña Logbook

Revisa las tres condiciones:

1. `openclaw plugins list --enabled` incluye `logbook`.
2. El Gateway se reinició después del cambio del Plugin o de la lista de permitidos.
3. La conexión de la interfaz de control tiene `operator.write`; las sesiones de solo lectura no reciben el descriptor de pestaña interactiva.

Si `plugins.allow` está configurado, debe incluir tanto `logbook` como `codex` para la
configuración recomendada.

### La captura informa de un error

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Confirma que el nodo expone `screen.snapshot` o `logbook.snapshot`.
- Concede permiso de grabación de pantalla en el Mac de captura.
- Si `nodeId` está configurado, confirma que coincide con el id del nodo o el nombre para mostrar.
- Comprueba que `gateway.nodes.denyCommands` no contenga
  `screen.snapshot`.

Después de tres fallos consecutivos, Logbook espera diez ticks de captura y
luego vuelve a intentarlo. Una configuración sin fijar puede rotar a otro nodo apto.

### Las capturas se completan, pero no aparecen tarjetas

- Un estado **Falta el modelo** significa que no se encontró una ruta de visión estructurada compatible. Activa y autentica el plugin de Codex, o establece un `visionModel` explícito válido. Los fotogramas capturados permanecen pendientes mientras falta el modelo y pueden analizarse después de corregir la configuración.
- Espera a `analysisIntervalMinutes`, o selecciona **Analizar ahora** después de que se haya capturado actividad.
- Los fotogramas idénticos consecutivos son evidencia de inactividad y no entran en los lotes de análisis. Cambia la pantalla visible antes de probar.
- Si el lote más reciente muestra un error, corrige el problema del modelo o de autenticación y selecciona **Analizar ahora**. Los lotes fallidos se reintentan solo con esa acción explícita para evitar gasto repetido del modelo.

## Relacionado

- [Gestionar plugins](/es/plugins/manage-plugins)
- [Arnés de Codex](/es/plugins/codex-harness)
- [Comprensión de medios](/es/nodes/media-understanding)
- [Nodos](/es/nodes)
- [Solución de problemas de nodos](/es/nodes/troubleshooting)
- [Interfaz de control](/es/web/control-ui)
