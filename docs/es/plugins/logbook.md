---
read_when:
    - Quieres una cronología de tu día al estilo de Dayflow en la interfaz de control
    - Está habilitando o configurando el plugin Logbook incluido
    - Quieres resúmenes de reuniones diarias o recordar el día basándote en la actividad de la pantalla
summary: Diario de trabajo automático opcional creado a partir de capturas de pantalla periódicas
title: Plugin de registro
x-i18n:
    generated_at: "2026-07-12T14:39:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a3ea1d40d62041417d047fbaf6b02aeb86e76314b8f620f7b9939e2e0c3b9f7e
    source_path: plugins/logbook.md
    workflow: 16
---

El plugin Logbook convierte la actividad de la pantalla en un diario de trabajo automático. Captura
instantáneas periódicas de la pantalla desde un Node emparejado, las resume en
observaciones con marca de tiempo y crea tarjetas de cronología en la
[interfaz de control](/es/web/control-ui). También puede generar notas para la reunión diaria y
responder preguntas sobre un día registrado.

El estado propiedad de OpenClaw permanece en el Gateway, en `<state-dir>/logbook/`, pero
el procesamiento del modelo no es necesariamente local. Las capturas de pantalla muestreadas se envían a la
ruta de visión configurada; las observaciones y el texto de la cronología se envían al modelo
predeterminado del agente. Use rutas de modelos locales para ambas etapas si el contenido de la pantalla y
el texto de actividad derivado deben permanecer en el equipo.

Logbook viene incluido y está deshabilitado de forma predeterminada. Al habilitar el plugin, se autoriza al
Gateway a capturar la pantalla porque `captureEnabled` tiene como valor predeterminado `true`.

## Antes de comenzar

Necesita:

- Un Node conectado que exponga `screen.snapshot` o `logbook.snapshot`. El
  Node de la aplicación de macOS necesita permiso de grabación de pantalla. Un host de Node de macOS sin interfaz gráfica
  (`openclaw node host run`) obtiene el comando `logbook.snapshot`
  proporcionado por el plugin, respaldado por la herramienta del sistema `screencapture`.
- El plugin Codex incluido habilitado y autenticado. Actualmente, Codex proporciona
  el contrato de extracción estructurada de imágenes que requiere Logbook. Inicie sesión con
  `openclaw models auth login --provider openai`; consulte
  [Entorno de ejecución de Codex](/es/plugins/codex-harness) para conocer otras vías de autenticación.
- Un modelo predeterminado de agente que funcione. Logbook lo usa para sintetizar tarjetas, notas
  para la reunión diaria y preguntas y respuestas sobre el día después del procesamiento de visión.

## Inicio rápido

Habilite los plugins Codex y Logbook:

```bash
openclaw plugins enable codex
openclaw plugins enable logbook
```

Configure un modelo de visión explícito para un inicio determinista:

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

Si usa `plugins.allow`, incluya tanto `codex` como `logbook`. Reinicie el
Gateway después de cambiar la configuración del plugin, inspeccione los registros
y abra el panel:

```bash
openclaw gateway restart
openclaw plugins inspect logbook --runtime --json
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw dashboard
```

La descripción del Node debe incluir `screen.snapshot` o `logbook.snapshot`.
Los Nodes sin interfaz gráfica anuncian `logbook.snapshot` solo después de que el plugin esté activo.
Consulte [Solución de problemas de Nodes](/es/nodes/troubleshooting) si falta el comando.

La pestaña Logbook solo aparece si el plugin está habilitado y la sesión de la
interfaz de control tiene `operator.write`. La fila de estado debe mostrar **Capturando** sin errores.
Aparece una tarjeta de cronología cuando se cierra la ventana de análisis, o puede seleccionar
**Analizar ahora** después de que se haya capturado actividad.

## Cómo funciona

1. **Captura**: cada `captureIntervalSeconds` (30 s de forma predeterminada), Logbook invoca
   el comando de captura del Node seleccionado y almacena un fotograma JPEG escalado.
   Los fotogramas idénticos consecutivos se marcan como inactivos y se excluyen del análisis.
2. **Observación**: una vez transcurrida una ventana de análisis (15 minutos de forma predeterminada), el
   plugin muestrea hasta 16 fotogramas activos y los envía al modelo de visión,
   que devuelve observaciones de actividad con marca de tiempo («VS Code: editando
   store.ts, corrigiendo un error de tipo»). Una interrupción de captura superior a dos minutos o
   la medianoche local también cierra la ventana actual.
3. **Síntesis**: las observaciones, junto con los últimos 45 minutos de las tarjetas existentes, se
   revisan para convertirlas en tarjetas de cronología (de 10 a 60 minutos cada una) con título, resumen,
   categoría, aplicación principal y cualquier distracción breve.
4. **Depuración**: se eliminan los fotogramas con una antigüedad superior a `retentionDays` (14 de forma predeterminada).
   Se conservan las tarjetas, las observaciones y las notas para reuniones diarias almacenadas en caché.

Los límites del día y los relojes de la cronología usan la zona horaria local del Gateway, no la
del navegador. Los fotogramas y la base de datos SQLite de la cronología se encuentran en
`<state-dir>/logbook/`.

## Flujo de modelos y datos

Logbook usa dos rutas de modelos independientes:

| Etapa                      | Datos enviados                                                     | Ruta del modelo                                                              |
| -------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Observación                | Hasta 16 fotogramas JPEG muestreados y sus horas de captura        | `visionModel` o una entrada compatible de Codex `tools.media` tomada prestada |
| Síntesis de tarjetas       | Observaciones con marca de tiempo y tarjetas recientes             | Modelo predeterminado del agente mediante el entorno de ejecución LLM del plugin |
| Generación de reunión diaria | Tarjetas del día seleccionado y del día anterior                 | Modelo predeterminado del agente mediante el entorno de ejecución LLM del plugin |
| Preguntas sobre el día     | La pregunta, las tarjetas del día seleccionado y observaciones recientes | Modelo predeterminado del agente mediante el entorno de ejecución LLM del plugin |

La base de datos SQLite completa no se envía a ninguno de los modelos. Las capturas de pantalla sin procesar se envían únicamente
a la etapa de observación; la síntesis de tarjetas, la reunión diaria y las preguntas y respuestas reciben texto
derivado.

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

Todas las claves de configuración de Logbook son opcionales. Los valores numéricos se redondean a enteros
y se limitan al intervalo admitido.

| Clave                     | Valor predeterminado | Intervalo o valores          | Comportamiento                                                                                                     |
| ------------------------- | -------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `captureEnabled`          | `true`               | booleano                     | Interruptor maestro persistente para nuevas instantáneas; la cronología sigue disponible cuando es `false`         |
| `captureIntervalSeconds`  | `30`                 | `5`-`600`                    | Intervalo entre intentos de captura                                                                                 |
| `analysisIntervalMinutes` | `15`                 | `3`-`120`                    | Ventana de observación objetivo; las interrupciones y la medianoche pueden cerrarla antes                           |
| `nodeId`                  | sin definir          | id o nombre visible del Node | Fija la captura a un Node conectado; la comparación no distingue entre mayúsculas y minúsculas                     |
| `screenIndex`             | `0`                  | `0`-`16`                     | Índice de pantalla basado en cero                                                                                   |
| `maxWidth`                | `1440`               | `480`-`3840`                 | Límite solicitado para el tamaño de captura; macOS sin interfaz gráfica lo aplica a la dimensión más grande         |
| `visionModel`             | sin definir          | `provider/model`             | Ruta estructurada explícita; las referencias mal formadas pausan el análisis y los proveedores no admitidos hacen fallar los lotes |
| `retentionDays`           | `14`                 | `1`-`365`                    | Elimina fotogramas antiguos; las tarjetas, observaciones y reuniones diarias permanecen                            |

Sin `nodeId`, Logbook prefiere un Node de aplicación conectado que exponga
`screen.snapshot` y, si no hay ninguno, recurre a un Node sin interfaz gráfica que exponga
`logbook.snapshot`. En una configuración sin fijar, un Node que falla pasa detrás de otros
Nodes aptos. El conmutador de pausa del panel solo se aplica a la sesión y se restablece cuando se
reinicia el Gateway; use `captureEnabled: false` para detenerlo de forma persistente.

### Selección del modelo de visión

Logbook resuelve el modelo de observación en este orden:

1. `plugins.entries.logbook.config.visionModel`
2. la primera entrada de Codex compatible con imágenes en `tools.media.image.models`
3. la primera entrada de Codex compatible con imágenes en `tools.media.models`

Se omiten otros proveedores multimedia porque actualmente no exponen el
contrato de extracción estructurada que requiere Logbook. Establecer
`tools.media.image.enabled: false` deshabilita los valores predeterminados multimedia tomados prestados, pero un
`visionModel` explícito de Logbook sigue aplicándose.

## Pestaña del panel

- **Cronología**: tarjetas expandibles por actividad con colores de categoría, la aplicación
  principal, etiquetas de distracciones y un fotograma clave de instantánea.
- **Resumen del día**: proporción de concentración, desglose por categorías y aplicaciones principales.
- **Reunión diaria**: convierte ayer y hoy en una actualización lista para pegar.
- **Preguntas sobre el día**: preguntas en lenguaje natural respondidas a partir de la
  cronología registrada («¿cuándo revisé la PR del Gateway?»).
- **Analizar ahora**: cierra de inmediato la ventana de captura actual en lugar de
  esperar al intervalo de análisis.

## Métodos del Gateway

Logbook registra estos métodos RPC del Gateway:

| Método                | Parámetros               | Ámbito           | Resultado                                                                           |
| --------------------- | ------------------------ | ---------------- | ----------------------------------------------------------------------------------- |
| `logbook.status`      | ninguno                  | `operator.read`  | Estado de captura, análisis, modelo, Node, día del Gateway y zona horaria del Gateway |
| `logbook.days`        | ninguno                  | `operator.read`  | Días con recuentos de tarjetas de cronología y límites temporales de las tarjetas   |
| `logbook.timeline`    | `{ day?: "YYYY-MM-DD" }` | `operator.read`  | Tarjetas derivadas y estadísticas del día; usa de forma predeterminada el día actual del Gateway |
| `logbook.frames`      | `{ startMs, endMs }`     | `operator.write` | Metadatos de fotogramas en el intervalo solicitado de milisegundos desde la época   |
| `logbook.frame`       | `{ frameId }`            | `operator.write` | Un fotograma JPEG sin procesar en base64                                             |
| `logbook.standup`     | `{ day?, refresh? }`     | `operator.write` | Texto de reunión diaria almacenado en caché o regenerado para un día                 |
| `logbook.ask`         | `{ day?, question }`     | `operator.write` | Respuesta basada en la cronología para un día                                        |
| `logbook.capture.set` | `{ paused }`             | `operator.write` | Estado de pausa exclusivo de la sesión y estado actualizado                          |
| `logbook.analyze.now` | ninguno                  | `operator.write` | Inicia el análisis pendiente o devuelve el motivo por el que no pudo iniciarse       |

Los métodos de lectura devuelven el estado operativo o texto derivado. Los píxeles de capturas de pantalla
sin procesar, las acciones que consumen recursos del modelo y las mutaciones del entorno de ejecución requieren
`operator.write`. La pestaña de la interfaz de control también requiere `operator.write` porque
expone esas acciones y vistas previas de fotogramas sin procesar; un cliente de solo lectura aún puede invocar
directamente los métodos de texto derivado.

## Notas de privacidad

- Las instantáneas pueden contener cualquier elemento visible en pantalla, incluidos secretos. Los fotogramas nunca
  salen del equipo, excepto como entrada muestreada para el modelo de observación configurado.
- Las observaciones, las tarjetas recientes y las preguntas pueden salir del equipo mediante el
  modelo predeterminado del agente durante la síntesis de tarjetas, la generación de la reunión diaria o las preguntas y respuestas. Aplique
  la política de tratamiento de datos del proveedor a ambas rutas de modelos.
- Use rutas locales tanto para el modelo de observación estructurada como para el modelo predeterminado del agente
  cuando necesite un flujo de procesamiento completamente local.
- Los fotogramas, la base de datos de la cronología y las capturas temporales se escriben con
  permisos de archivo exclusivos del propietario.
- Añadir `screen.snapshot` a `gateway.nodes.denyCommands` es el
  interruptor de desactivación de la captura de pantalla: bloquea tanto la captura del Node de aplicación como el propio
  comando `logbook.snapshot` de Logbook.
- Establecer `tools.media.image.enabled: false` también impide que Logbook tome prestados
  los modelos de imagen multimedia para el análisis; en ese caso, solo se usa un `visionModel` explícito en la
  configuración del plugin.

## Solución de problemas

### Falta la pestaña Logbook

Compruebe los tres requisitos:

1. `openclaw plugins list --enabled` incluye `logbook`.
2. El Gateway se reinició después del cambio del plugin o de la lista de permitidos.
3. La conexión de la interfaz de control tiene `operator.write`; las sesiones de solo lectura no
   reciben el descriptor de la pestaña interactiva.

Si se establece `plugins.allow`, debe incluir tanto `logbook` como `codex` para la
configuración recomendada.

### La captura informa de un error

```bash
openclaw nodes status --connected
openclaw nodes describe --node <idOrNameOrIp>
openclaw logs --follow
```

- Confirme que el Node exponga `screen.snapshot` o `logbook.snapshot`.
- Conceda permiso de Screen Recording en el Mac de captura.
- Si se configura `nodeId`, confirme que coincida con el id. del Node o el nombre para mostrar.
- Compruebe que `gateway.nodes.denyCommands` no contenga
  `screen.snapshot`.

Después de tres fallos consecutivos, Logbook espera durante diez ciclos de captura y
luego vuelve a intentarlo. Una configuración sin Node fijado puede cambiar a otro Node apto.

### Las capturas se realizan correctamente, pero no aparecen tarjetas

- Un estado **Falta el modelo** significa que no se encontró ninguna ruta de visión
  estructurada compatible. Habilite y autentique el Plugin Codex, o establezca un
  `visionModel` explícito válido. Los fotogramas capturados permanecen pendientes mientras
  falta el modelo y pueden analizarse después de corregir la configuración.
- Espere el valor de `analysisIntervalMinutes` o seleccione **Analizar ahora** después de
  que se haya capturado actividad.
- Los fotogramas idénticos consecutivos son indicios de inactividad y no se incluyen en los lotes
  de análisis. Cambie la pantalla visible antes de realizar la prueba.
- Si el lote más reciente muestra un error, corrija el problema del modelo o de autenticación y seleccione
  **Analizar ahora**. Los lotes fallidos solo vuelven a intentarse mediante esa acción explícita para
  evitar gastos reiterados del modelo.

## Relacionado

- [Gestionar plugins](/es/plugins/manage-plugins)
- [Entorno de ejecución de Codex](/es/plugins/codex-harness)
- [Comprensión multimedia](/es/nodes/media-understanding)
- [Nodes](/es/nodes)
- [Solución de problemas de Nodes](/es/nodes/troubleshooting)
- [Interfaz de control](/es/web/control-ui)
