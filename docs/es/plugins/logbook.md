---
read_when:
    - Quieres una cronología de tu día al estilo de Dayflow en la interfaz de control
    - Está habilitando o configurando el plugin Logbook incluido
    - Se necesitan resúmenes de reuniones diarias o recordar el día basándose en la actividad de la pantalla
summary: Diario de trabajo automático opcional creado a partir de capturas de pantalla periódicas
title: Plugin de bitácora
x-i18n:
    generated_at: "2026-07-22T10:44:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 19197e580421dfe81f82f8599578e4c68a15004813bb2b6c3de761c14f426b08
    source_path: plugins/logbook.md
    workflow: 16
---

El Plugin Logbook convierte la actividad de la pantalla en un diario de trabajo automático.
Captura periódicamente instantáneas de pantalla de un Node emparejado, las resume como
observaciones con marcas de tiempo y crea tarjetas cronológicas en la
[interfaz de control](/es/web/control-ui). También puede generar notas para la reunión diaria y
responder preguntas sobre un día registrado.

El estado propiedad de OpenClaw permanece en el Gateway, en `<state-dir>/logbook/`, pero
el procesamiento de los modelos no es necesariamente local. Las capturas de pantalla muestreadas se envían a la
ruta de visión configurada; las observaciones y el texto de la cronología se envían al modelo
predeterminado del agente. Se deben usar rutas de modelos locales para ambas etapas si el contenido de la pantalla y
el texto de actividad derivado deben permanecer en el equipo.

Logbook viene incluido y está desactivado de forma predeterminada. Al habilitar el Plugin, se autoriza al
Gateway a realizar capturas de pantalla porque `captureEnabled` tiene como valor predeterminado `true`.

## Antes de comenzar

Se necesita:

- Un Node conectado que exponga `screen.snapshot` o `logbook.snapshot`. El
  Node de la aplicación para macOS necesita permiso de Screen Recording. Un host de Node macOS sin interfaz gráfica
  (`openclaw node host run`) obtiene el comando `logbook.snapshot` proporcionado por el Plugin,
  respaldado por la herramienta del sistema `screencapture`.
- El Plugin Codex incluido debe estar habilitado y autenticado. Actualmente, Codex proporciona
  el contrato de extracción estructurada de imágenes que Logbook necesita. Inicie sesión con
  `openclaw models auth login --provider openai`; consulte
  [Entorno de Codex](/es/plugins/codex-harness) para conocer otras vías de autenticación.
- Un modelo predeterminado de agente que funcione. Logbook lo utiliza para sintetizar tarjetas, notas
  para la reunión diaria y preguntas y respuestas sobre el día después de la fase de visión.

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

Si se utiliza `plugins.allow`, incluya tanto `codex` como `logbook`. Reinicie el
Gateway después de cambiar la configuración del Plugin, inspeccione los registros
y abra el panel:

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

La descripción del Node debe incluir `screen.snapshot` o `logbook.snapshot`.
Los Nodes sin interfaz gráfica anuncian `logbook.snapshot` solo después de activar el Plugin.
Consulte [Solución de problemas de Nodes](/es/nodes/troubleshooting) si falta el comando.

La pestaña Logbook aparece únicamente cuando el Plugin está habilitado y hay una sesión de la
interfaz de control con `operator.write`. La fila de estado debe mostrar **Capturando** sin errores.
Cuando se cierre la ventana de análisis, aparecerá una tarjeta cronológica; también se puede seleccionar
**Analizar ahora** después de capturar actividad.

## Cómo funciona

1. **Captura**: cada `captureIntervalSeconds` (30 s de forma predeterminada), Logbook invoca
   el comando de captura del Node seleccionado y almacena un fotograma JPEG escalado.
   Los fotogramas consecutivos idénticos se marcan como inactivos y se excluyen del análisis.
2. **Observación**: una vez transcurrida una ventana de análisis (15 minutos de forma predeterminada), el
   Plugin muestrea hasta 16 fotogramas activos y los envía al modelo de visión,
   que devuelve observaciones de actividad con marcas de tiempo («VS Code: editando
   store.ts, corrigiendo un error de tipo»). Una interrupción de captura superior a dos minutos o
   la medianoche local también cierra la ventana actual.
3. **Síntesis**: las observaciones, junto con los últimos 45 minutos de tarjetas existentes, se
   revisan para crear tarjetas cronológicas (de 10 a 60 minutos cada una) con título, resumen,
   categoría, aplicación principal y cualquier distracción breve.
4. **Depuración**: se eliminan los fotogramas con más de `retentionDays` (14 de forma predeterminada).
   Se conservan las tarjetas, las observaciones y las reuniones diarias almacenadas en caché.

Los límites de los días y los relojes de la cronología usan la zona horaria local del Gateway, no la
zona horaria del navegador. Los fotogramas y la base de datos SQLite de la cronología se almacenan en
`<state-dir>/logbook/`.

## Flujo de modelos y datos

Logbook utiliza dos rutas de modelos independientes:

| Etapa                  | Datos enviados                                                      | Ruta del modelo                                                               |
| ---------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Observación            | Hasta 16 fotogramas JPEG muestreados y sus horas de captura         | `visionModel` o una entrada Codex `tools.media` compatible prestada |
| Sintetizar tarjetas    | Observaciones con marcas de tiempo y tarjetas cronológicas recientes | Modelo predeterminado del agente mediante el entorno de ejecución LLM del Plugin |
| Generar reunión diaria | Tarjetas del día seleccionado y del día anterior                    | Modelo predeterminado del agente mediante el entorno de ejecución LLM del Plugin |
| Preguntar sobre el día | La pregunta, las tarjetas del día seleccionado y observaciones recientes | Modelo predeterminado del agente mediante el entorno de ejecución LLM del Plugin |

La base de datos SQLite completa no se envía a ninguno de los modelos. Las capturas de pantalla sin procesar se envían solo
a la etapa de observación; la síntesis de tarjetas, la reunión diaria y las preguntas y respuestas reciben
texto derivado.

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

Todas las claves de configuración de Logbook son opcionales. Los valores numéricos se redondean a números enteros
y se limitan al intervalo admitido.

| Clave                     | Valor predeterminado | Intervalo o valores       | Comportamiento                                                                                       |
| ------------------------- | -------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `captureEnabled`        | `true`   | boolean                   | Interruptor principal persistente para nuevas instantáneas; la cronología sigue disponible cuando `false` |
| `captureIntervalSeconds`        | `30`   | `5`-`600` | Demora entre intentos de captura                                                                     |
| `analysisIntervalMinutes`        | `15`   | `3`-`120` | Ventana de observación objetivo; las interrupciones y la medianoche pueden cerrarla antes             |
| `nodeId`        | sin establecer       | id o nombre visible del Node | Fija la captura a un Node conectado; la coincidencia no distingue entre mayúsculas y minúsculas       |
| `screenIndex`        | `0`   | `0`-`16` | Índice de pantalla de base cero                                                                       |
| `maxWidth`        | `1440`   | `480`-`3840` | Límite solicitado para el tamaño de captura; macOS sin interfaz gráfica lo aplica a la dimensión mayor |
| `visionModel`        | sin establecer       | `provider/model`        | Ruta estructurada explícita; las referencias con formato incorrecto pausan el análisis y los proveedores no compatibles hacen que fallen los lotes |
| `retentionDays`        | `14`   | `1`-`365` | Elimina fotogramas antiguos; se conservan las tarjetas, observaciones y reuniones diarias              |

Sin `nodeId`, Logbook prefiere un Node de aplicación conectado que exponga
`screen.snapshot` y, si no está disponible, recurre a un Node sin interfaz gráfica que exponga
`logbook.snapshot`. En una configuración no fijada, un Node que falla pasa detrás de los demás
Nodes aptos. El control de pausa del panel se aplica solo a la sesión y se restablece cuando se
reinicia el Gateway; utilice `captureEnabled: false` para una detención persistente.

### Selección del modelo de visión

Logbook resuelve el modelo de observación en este orden:

1. `plugins.entries.logbook.config.visionModel`
2. la primera entrada Codex compatible con imágenes en `tools.media.models`

Los demás proveedores multimedia se omiten porque actualmente no exponen el
contrato de extracción estructurada que Logbook necesita. Establecer
`tools.media.image.enabled: false` desactiva los valores predeterminados multimedia prestados, pero un valor
`visionModel` explícito de Logbook sigue aplicándose.

## Pestaña del panel

- **Cronología**: tarjetas ampliables para cada actividad, con colores por categoría, la aplicación
  principal, etiquetas de distracciones y un fotograma clave de la instantánea.
- **Resumen del día**: proporción de concentración, desglose por categorías y aplicaciones principales.
- **Reunión diaria**: convierte el día de ayer y el de hoy en una actualización lista para pegar.
- **Preguntar sobre el día**: preguntas en lenguaje natural respondidas a partir de la cronología
  registrada («¿cuándo revisé el pull request del Gateway?»).
- **Analizar ahora**: cierra inmediatamente la ventana de captura actual en lugar de
  esperar al intervalo de análisis.

## Métodos del Gateway

Logbook registra estos métodos RPC del Gateway:

| Método                    | Parámetros               | Ámbito           | Resultado                                                                       |
| ------------------------- | ------------------------ | ---------------- | ------------------------------------------------------------------------------- |
| `logbook.status`        | ninguno                  | `operator.read` | Estado de captura, análisis, modelo, Node, día del Gateway y zona horaria del Gateway |
| `logbook.days`        | ninguno                  | `operator.read` | Días con recuentos de tarjetas cronológicas y límites temporales de las tarjetas |
| `logbook.timeline`        | `{ day?: "YYYY-MM-DD" }`       | `operator.read` | Tarjetas derivadas y estadísticas del día; usa de forma predeterminada el día actual del Gateway |
| `logbook.frames`        | `{ startMs, endMs }`       | `operator.write` | Metadatos de fotogramas en el intervalo solicitado de milisegundos desde la época |
| `logbook.frame`        | `{ frameId }`       | `operator.write` | Un fotograma JPEG sin procesar en base64                                         |
| `logbook.standup`        | `{ day?, refresh? }`       | `operator.write` | Texto de la reunión diaria almacenado en caché o regenerado para un día           |
| `logbook.ask`        | `{ day?, question }`       | `operator.write` | Respuesta basada en la cronología para un día                                    |
| `logbook.capture.set`        | `{ paused }`       | `operator.write` | Estado de pausa exclusivo de la sesión y estado actualizado                      |
| `logbook.analyze.now`        | ninguno                  | `operator.write` | Inicia el análisis pendiente o devuelve el motivo por el que no pudo iniciarse   |

Los métodos de lectura devuelven el estado operativo o texto derivado. Los píxeles de las capturas de pantalla
sin procesar, las acciones que generan gasto de modelos y las mutaciones del entorno de ejecución requieren
`operator.write`. La pestaña de la interfaz de control también requiere `operator.write` porque
expone esas acciones y vistas previas de fotogramas sin procesar; un cliente de solo lectura puede seguir llamando
directamente a los métodos de texto derivado.

## Notas de privacidad

- Las instantáneas pueden contener cualquier elemento visible en pantalla, incluidos secretos. Los fotogramas nunca
  salen de la máquina, excepto como entrada muestreada para el modelo de observación
  configurado.
- Las observaciones, las tarjetas recientes y las preguntas pueden salir de la máquina a través del
  modelo de agente predeterminado durante la síntesis de tarjetas, la generación de reuniones de seguimiento o las preguntas y respuestas. Aplique
  la política de tratamiento de datos del proveedor a ambas rutas de modelos.
- Use rutas locales tanto para el modelo de observación estructurada como para el modelo de agente
  predeterminado cuando necesite un pipeline completamente local.
- Los fotogramas, la base de datos de la línea temporal y las capturas temporales se escriben con
  permisos de archivo exclusivos para el propietario.
- Añadir `screen.snapshot` a `gateway.nodes.commands.deny` es el
  interruptor de desactivación de la captura de pantalla: bloquea tanto la captura del nodo de la aplicación como el propio comando
  `logbook.snapshot` de Logbook.
- Configurar `tools.media.image.enabled: false` también impide que Logbook tome prestados
  los modelos de imágenes multimedia para el análisis; en ese caso, solo se usa un `visionModel` explícito en la
  configuración del plugin.

## Solución de problemas

### Falta la pestaña Logbook

Compruebe las tres condiciones:

1. `openclaw plugins list --enabled` incluye `logbook`.
2. El Gateway se reinició después del cambio en el plugin o la lista de permitidos.
3. La conexión de la interfaz de control tiene `operator.write`; las sesiones de solo lectura no
   reciben el descriptor de la pestaña interactiva.

Si se configura `plugins.allow`, debe incluir tanto `logbook` como `codex` para la
configuración recomendada.

### La captura informa de un error

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Confirme que el nodo expone `screen.snapshot` o `logbook.snapshot`.
- Conceda permiso de grabación de pantalla en el Mac de captura.
- Si se configura `nodeId`, confirme que coincide con el identificador del nodo o el nombre para mostrar.
- Compruebe que `gateway.nodes.commands.deny` no contiene
  `screen.snapshot`.

Después de tres errores consecutivos, Logbook entra en espera durante diez ciclos de captura y
luego vuelve a intentarlo. Una configuración sin anclar puede cambiar a otro nodo apto.

### Las capturas se realizan correctamente, pero no aparecen tarjetas

- El estado **Falta el modelo** significa que no se encontró ninguna ruta de visión estructurada
  compatible. Active y autentique el plugin Codex, o establezca un
  `visionModel` explícito válido. Los fotogramas capturados permanecen pendientes mientras falta el modelo y
  pueden analizarse una vez corregida la configuración.
- Espere a `analysisIntervalMinutes` o seleccione **Analizar ahora** después de que se
  haya capturado actividad.
- Los fotogramas idénticos consecutivos indican inactividad y no entran en los lotes de
  análisis. Cambie la pantalla visible antes de realizar la prueba.
- Si el lote más reciente muestra un error, corrija el problema del modelo o de autenticación y seleccione
  **Analizar ahora**. Los lotes fallidos solo vuelven a intentarse mediante esa acción explícita para
  evitar gastos repetidos del modelo.

## Contenido relacionado

- [Gestionar plugins](/es/plugins/manage-plugins)
- [Entorno de ejecución de Codex](/es/plugins/codex-harness)
- [Comprensión multimedia](/es/nodes/media-understanding)
- [Nodos](/es/nodes)
- [Solución de problemas de nodos](/es/nodes/troubleshooting)
- [Interfaz de control](/es/web/control-ui)
