---
read_when:
    - Comprender cómo encaja la pila de QA
    - Ampliar qa-lab, qa-channel o un adaptador de transporte
    - Agregar escenarios de QA respaldados por repositorio
    - Creación de automatización de QA de mayor realismo en torno al panel del Gateway
summary: 'Resumen de la pila de QA: qa-lab, qa-channel, escenarios respaldados por el repositorio, carriles de transporte en vivo, adaptadores de transporte e informes.'
title: Resumen de control de calidad
x-i18n:
    generated_at: "2026-07-06T10:48:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a2d0f1edc82e778dbecf91c798cca5ef58468579248c40818715aa5c1cb5207
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pila privada de QA ejercita OpenClaw de una forma realista y con forma de canal que
una prueba unitaria no puede.

Piezas:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de DM, canal, hilo,
  reacción, edición y eliminación.
- `extensions/qa-lab`: interfaz de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe en Markdown.
- `extensions/qa-matrix`: adaptador de transporte en vivo que controla el Plugin real de Matrix
  dentro de un Gateway de QA hijo.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea de inicio y los escenarios
  de QA de referencia.
- [Mantis](/es/concepts/mantis): verificación en vivo antes/después para errores que
  necesitan transportes reales, capturas de pantalla del navegador, estado de VM y evidencia de PR.

## Superficie de comandos

Cada flujo de QA se ejecuta bajo `pnpm openclaw qa <subcommand>`. Muchos tienen alias de script `pnpm qa:*`;
ambas formas funcionan.

| Comando                                             | Propósito                                                                                                                                                                                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autocomprobación de QA incluida sin `--qa-profile`; ejecutor de perfil de madurez respaldado por taxonomía con `--qa-profile smoke-ci`, `--qa-profile release` o `--qa-profile all`.                                                                                |
| `qa suite`                                          | Ejecuta escenarios respaldados por el repositorio contra la vía del Gateway de QA. `--runner multipass` usa una VM Linux desechable en lugar del host.                                                                                                             |
| `qa coverage`                                       | Imprime el inventario YAML de cobertura de escenarios (`--json` para salida de máquina; `--match <query>` para encontrar escenarios de un comportamiento tocado; `--tools` para cobertura de fixtures de herramientas en tiempo de ejecución).                      |
| `qa parity-report`                                  | Compara dos archivos `qa-suite-summary.json` para una puerta de paridad del eje de modelo, o usa `--runtime-axis --token-efficiency` para escribir informes de paridad en tiempo de ejecución y eficiencia de tokens entre Codex y OpenClaw.                         |
| `qa confidence-report`                              | Clasifica artefactos de prueba de QA contra un manifiesto en un informe de confianza sin desconocidos.                                                                                                                                                              |
| `qa confidence-self-test`                           | Escribe canarios de control negativo sembrados que demuestran que la puerta de confianza detecta la deriva.                                                                                                                                                         |
| `qa jsonl-replay`                                   | Reproduce transcripciones JSONL seleccionadas mediante el arnés de reproducción de paridad en tiempo de ejecución.                                                                                                                                                  |
| `qa character-eval`                                 | Ejecuta el escenario de QA de personaje en varios modelos en vivo con un informe evaluado. Consulta [Informes](#reporting).                                                                                                                                         |
| `qa manual`                                         | Ejecuta un prompt puntual contra la vía del proveedor/modelo seleccionado.                                                                                                                                                                                           |
| `qa ui`                                             | Inicia la interfaz de depuración de QA y el bus local de QA (alias: `pnpm qa:lab:ui`).                                                                                                                                                                              |
| `qa docker-build-image`                             | Compila la imagen Docker de QA prehorneada.                                                                                                                                                                                                                         |
| `qa docker-scaffold`                                | Escribe un andamiaje de docker-compose para el panel de QA + vía de Gateway.                                                                                                                                                                                        |
| `qa up`                                             | Compila el sitio de QA, inicia la pila respaldada por Docker e imprime la URL (alias: `pnpm qa:lab:up`; la variante `:fast` agrega `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                           |
| `qa aimock`                                         | Inicia solo el servidor del proveedor AIMock.                                                                                                                                                                                                                       |
| `qa mock-openai`                                    | Inicia solo el servidor del proveedor `mock-openai` consciente de escenarios.                                                                                                                                                                                       |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestiona el grupo compartido de credenciales de Convex.                                                                                                                                                                                                             |
| `qa discord`                                        | Vía de transporte en vivo contra un canal de guild privado real de Discord.                                                                                                                                                                                         |
| `qa matrix`                                         | Vía de transporte en vivo contra un homeserver Tuwunel desechable. Consulta [QA de Matrix](/es/concepts/qa-matrix).                                                                                                                                                  |
| `qa slack`                                          | Vía de transporte en vivo contra un canal privado real de Slack.                                                                                                                                                                                                    |
| `qa telegram`                                       | Vía de transporte en vivo contra un grupo privado real de Telegram.                                                                                                                                                                                                 |
| `qa whatsapp`                                       | Vía de transporte en vivo contra cuentas reales de WhatsApp Web.                                                                                                                                                                                                    |
| `qa mantis`                                         | Ejecutor de verificación antes/después para errores de transporte en vivo, con evidencia de reacciones de estado en Discord, smoke de escritorio/navegador en Crabbox y smoke de Slack en VNC. Consulta [Mantis](/es/concepts/mantis) y [Runbook de Mantis Slack Desktop](/es/concepts/mantis-slack-desktop-runbook). |

`qa matrix` se registra como un Plugin ejecutor (`extensions/qa-matrix`); cada
otra vía anterior está integrada directamente en `qa-lab`.

### `qa run` respaldado por perfil

`qa run` respaldado por perfil lee la membresía desde `taxonomy.yaml` y luego despacha
los escenarios resueltos mediante `qa suite`. `--surface` y `--category` filtran
el perfil seleccionado en lugar de definir vías separadas. El
`qa-evidence.json` resultante incluye un resumen de cuadro de mando del perfil con conteos de categorías seleccionadas
e IDs de cobertura faltantes; las entradas de evidencia individuales siguen siendo la
fuente de verdad para las pruebas, los roles de cobertura y los resultados. Los IDs de cobertura de funciones de taxonomía
son objetivos de prueba exactos, no alias: la cobertura de escenarios primaria
satisface los IDs coincidentes; la cobertura secundaria sigue siendo orientativa. Los IDs de cobertura usan
la forma punteada `namespace.behavior` con segmentos alfanuméricos en minúscula o con guiones;
los IDs de perfil, superficie y categoría aún pueden usar los IDs de taxonomía existentes con guiones o puntos.

La evidencia reducida omite `execution` por entrada y establece `evidenceMode: "slim"`;
`smoke-ci` usa evidencia reducida de forma predeterminada, y `--evidence-mode full` restaura entradas completas:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Usa `smoke-ci` para pruebas de perfil deterministas con proveedores de modelos simulados y
servidores de proveedor local Crabline. Usa `release` para pruebas Stable/LTS contra
canales en vivo. Usa `all` solo para ejecuciones explícitas de evidencia de taxonomía completa; selecciona
cada categoría de madurez activa y se puede despachar mediante el flujo de trabajo de GitHub Actions `QA
Profile Evidence` con `qa_profile=all`. Cuando un comando también necesite un perfil raíz de OpenClaw, coloca el perfil raíz antes del
comando de QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Flujo del operador

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel de Gateway (Control UI) con el agente.
- Derecha: QA Lab, que muestra la transcripción estilo Slack y el plan del escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso compila el sitio de QA, inicia la vía de Gateway respaldada por Docker y expone
la página de QA Lab donde un operador o bucle de automatización puede dar al agente una
misión de QA, observar comportamiento real del canal y registrar qué funcionó, falló o
permaneció bloqueado.

Para iterar más rápido en la interfaz de QA Lab sin recompilar la imagen Docker cada vez,
inicia la pila con un paquete de QA Lab montado con bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios Docker en una imagen precompilada y
monta con bind `extensions/qa-lab/web/dist` en el contenedor `qa-lab`.
`qa:lab:watch` recompila ese paquete al cambiar, y el navegador se recarga automáticamente
cuando cambia el hash de recursos de QA Lab.

### Smokes de observabilidad

<Note>
La QA de observabilidad sigue siendo solo para checkouts de código fuente. El tarball de npm omite intencionalmente
QA Lab (y `qa-channel`/`qa-matrix`), por lo que las vías de lanzamiento Docker de paquetes
no ejecutan comandos `qa`. Ejecútalos desde un checkout de código fuente compilado al
cambiar la instrumentación de diagnósticos.
</Note>

| Alias                                   | Lo que ejecuta                                                                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Receptor OpenTelemetry local más el escenario `otel-trace-smoke` con `diagnostics-otel` habilitado.                                     |
| `pnpm qa:otel:collector-smoke`          | El mismo carril detrás de un contenedor Docker real de OpenTelemetry Collector. Úsalo al cambiar el cableado de endpoints o la compatibilidad de collector/OTLP. |
| `pnpm qa:prometheus:smoke`              | El escenario `docker-prometheus-smoke` con `diagnostics-prometheus` habilitado.                                                         |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` seguido de `qa:prometheus:smoke`.                                                                                       |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` seguido de `qa:prometheus:smoke`.                                                                             |

`qa:otel:smoke` inicia un receptor OTLP/HTTP local, ejecuta un turno mínimo de
agente de canal QA y luego comprueba que se exporten trazas, métricas y logs.
Decodifica los tramos de traza protobuf exportados y comprueba la forma crítica
para la versión: `openclaw.run`, `openclaw.harness.run`, un tramo de llamada al
modelo de la convención semántica GenAI más reciente, `openclaw.context.assembled`
y `openclaw.message.delivery` deben estar todos presentes. El smoke fuerza
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, por lo que el tramo
de llamada al modelo debe usar el nombre `{gen_ai.operation.name} {gen_ai.request.model}`;
las llamadas al modelo no deben exportar `StreamAbandoned` en turnos correctos;
los ID de diagnóstico sin procesar y los atributos `openclaw.content.*` deben
quedar fuera de la traza. El prompt del escenario pide al modelo que responda
con un marcador fijo y que retenga una cadena secreta fija; las cargas útiles
OTLP sin procesar no deben contener ninguno de los dos, ni la clave de sesión QA
derivada del id del escenario. Escribe `otel-smoke-summary.json` junto a los
artefactos de la suite QA.

`qa:prometheus:smoke` verifica que se rechacen los scrapes no autenticados y
luego comprueba que el scrape autenticado incluya familias de métricas críticas
para la versión sin contenido de prompts, contenido de respuestas,
identificadores de diagnóstico sin procesar, tokens de autenticación ni rutas
locales.

### Carriles smoke de matriz

Para un carril smoke Matrix con transporte real que no requiere credenciales
de proveedor de modelos, ejecuta el perfil rápido con el proveedor mock
OpenAI determinista:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Para el carril de proveedor live-frontier, proporciona credenciales compatibles
con OpenAI explícitamente:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

La referencia completa de la CLI, el catálogo de perfiles/escenarios, las
variables de entorno y la disposición de artefactos de este carril están en
[Matrix QA](/es/concepts/qa-matrix). En resumen: aprovisiona un homeserver Tuwunel
desechable en Docker, registra usuarios temporales de driver/SUT/observer,
ejecuta el Plugin Matrix real dentro de un gateway QA hijo limitado a ese
transporte (sin `qa-channel`) y luego escribe un informe Markdown, un resumen
JSON, un artefacto de eventos observados y un log de salida combinado bajo
`.artifacts/qa-e2e/matrix-<timestamp>/`.

Los escenarios cubren comportamiento de transporte que las pruebas unitarias no
pueden demostrar de extremo a extremo: control de menciones, políticas
allow-bot, allowlists, respuestas de nivel superior y en hilos, enrutamiento de
DM, manejo de reacciones, supresión de ediciones entrantes, deduplicación de
reproducción tras reinicio, recuperación de interrupción del homeserver, entrega
de metadatos de aprobación, manejo de medios y flujos de arranque, recuperación
y verificación de Matrix E2EE. El perfil E2EE de la CLI también ejecuta
`openclaw matrix encryption setup` y comandos de verificación a través del
mismo homeserver desechable antes de comprobar las respuestas del Gateway.

CI usa la misma superficie de comandos en
`.github/workflows/qa-live-transports-convex.yml`. Las ejecuciones programadas
y manuales predeterminadas ejecutan el perfil rápido de Matrix con credenciales
live-frontier proporcionadas por QA, `--fast` y
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. La ejecución manual
`matrix_profile=all` se distribuye en cinco shards de perfil: `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

### Escenarios Mantis de Discord

Discord también tiene escenarios de suscripción solo Mantis para reproducción de
bugs. Usa `--scenario discord-status-reactions-tool-only` para la línea de tiempo
explícita de reacciones de estado, o
`--scenario discord-thread-reply-filepath-attachment` para crear un hilo real de
Discord y verificar que `message.thread-reply` preserve un adjunto `filePath`.
Estos escenarios quedan fuera del carril live Discord predeterminado porque son
sondas de reproducción antes/después en lugar de cobertura smoke amplia. El
flujo de trabajo Mantis de adjunto en hilo también puede agregar un video
testigo de Discord Web con sesión iniciada cuando
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` o
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` está configurado en el entorno
QA. Ese perfil de visor es solo para captura visual; la decisión de aprobado/no
aprobado sigue viniendo del oráculo REST de Discord.

Para carriles smoke con transporte real de Discord, Slack, Telegram y WhatsApp:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Apuntan a un canal real preexistente con dos bots o cuentas (driver + SUT). Las
variables de entorno requeridas, las listas de escenarios, los artefactos de
salida y el pool de credenciales Convex están documentados en la
[referencia QA de Discord, Slack, Telegram y WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference)
más abajo.

### Ejecutores Mantis de escritorio Slack y tareas visuales

Para una ejecución completa en VM de escritorio Slack con rescate VNC, ejecuta:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ese comando alquila una máquina Crabbox de escritorio/navegador, ejecuta el
carril live de Slack dentro de la VM, abre Slack Web en el navegador VNC,
captura el escritorio y copia `slack-qa/`, `slack-desktop-smoke.png` y
`slack-desktop-smoke.mp4` (cuando la captura de video está disponible) de vuelta
al directorio de artefactos Mantis. Los alquileres de escritorio/navegador de
Crabbox proporcionan por adelantado las herramientas de captura y los paquetes
auxiliares de navegador/compilación nativa, por lo que el escenario solo debería
instalar alternativas en alquileres más antiguos. Mantis informa los tiempos
totales y por fase en `mantis-slack-desktop-smoke-report.md` para que las
ejecuciones lentas muestren si el tiempo se fue en el calentamiento del alquiler,
la adquisición de credenciales, la configuración remota o la copia de
artefactos. Reutiliza `--lease-id <cbx_...>` después de iniciar sesión
manualmente en Slack Web mediante VNC; los alquileres reutilizados también
mantienen caliente la caché de store pnpm de Crabbox. El valor predeterminado
`--hydrate-mode source` verifica desde un checkout de código fuente y ejecuta
install/build dentro de la VM. Usa `--hydrate-mode prehydrated` solo cuando el
espacio de trabajo remoto reutilizado ya tiene `node_modules` y un `dist/`
compilado; ese modo omite el paso caro de install/build y falla de forma cerrada
cuando el espacio de trabajo no está listo. Con `--gateway-setup`, Mantis deja
un Gateway Slack de OpenClaw persistente ejecutándose dentro de la VM en el
puerto `38973`; sin él, el comando ejecuta el carril QA normal de Slack de bot a
bot y sale después de capturar artefactos.

Para demostrar la UI de aprobación nativa de Slack con evidencia de escritorio,
ejecuta el modo de checkpoints de aprobación de Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Este modo es mutuamente excluyente con `--gateway-setup`. Ejecuta los escenarios
de aprobación de Slack, rechaza ids de escenario que no sean de aprobación,
espera en cada estado de aprobación pendiente y resuelto, renderiza el mensaje
observado de la API de Slack en
`approval-checkpoints/<scenario>-pending.png` y
`approval-checkpoints/<scenario>-resolved.png`, y luego falla si falta algún
checkpoint, evidencia de mensaje, acuse o captura renderizada, o si está vacío.
Los alquileres CI fríos aún pueden mostrar el inicio de sesión de Slack en
`slack-desktop-smoke.png`; las imágenes de checkpoints de aprobación son la
prueba visual para este carril.

La ejecución predeterminada de checkpoints conserva los dos escenarios estándar
de aprobación de Slack. Para capturar cualquiera de las rutas de aprobación
Codex opcionales, selecciónala explícitamente con
`--scenario slack-codex-approval-exec-native` o
`--scenario slack-codex-approval-plugin-native`; Mantis acepta ambas y emite el
mismo par de capturas pendiente/resuelto. El ejecutor amplía sus deadlines de
checkpoint y de comando remoto para cada ruta Codex seleccionada, de modo que la
secuencia completa de aprobación, finalización del agente y actualización
resuelta pueda terminar.

La checklist del operador, el comando de dispatch del workflow de GitHub, el
contrato de comentario de evidencia, la tabla de decisión de hydrate-mode, la
interpretación de tiempos y los pasos de manejo de fallos están en
[Mantis Slack Desktop Runbook](/es/concepts/mantis-slack-desktop-runbook).

Para una tarea de escritorio de estilo agente/CV, ejecuta:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` alquila o reutiliza una máquina Crabbox de escritorio/navegador,
inicia `crabbox record --while`, controla el navegador visible mediante un
`visual-driver` anidado, captura `visual-task.png`, ejecuta `openclaw infer image
describe` contra la captura cuando se selecciona `--vision-mode image-describe`,
y escribe `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` y `mantis-visual-task-report.md`. Cuando
se establece `--expect-text`, el prompt de visión solicita un veredicto JSON
estructurado (`visible`, `evidence`, `reason`) y solo pasa cuando el modelo
informa `visible: true` con evidencia que cita el texto esperado; una respuesta
`visible: false` que simplemente cite el texto objetivo aún falla la aserción.
Usa `--vision-mode metadata` para un smoke sin modelo que demuestra la plomería
de escritorio, navegador, captura y video sin llamar a un proveedor de
comprensión de imágenes. La grabación es un artefacto obligatorio para
`visual-task`; si Crabbox no graba un `visual-task.mp4` no vacío, la tarea falla
aunque el driver visual haya pasado. En caso de fallo, Mantis conserva el
alquiler para VNC salvo que la tarea ya hubiera pasado y no se hubiera
establecido `--keep-lease`.

### Health check del pool de credenciales

Antes de usar credenciales live agrupadas, ejecuta:

```bash
pnpm openclaw qa credentials doctor
```

El doctor comprueba el env del broker Convex (`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), valida la configuración de endpoints,
informa solo el estado establecido/faltante para `OPENCLAW_QA_CONVEX_SECRET_CI`
y `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`, y verifica el alcance de admin/list
cuando el secreto maintainer está presente.

## Cobertura de transportes live

Los carriles de transporte live comparten un contrato en lugar de inventar cada
uno su propia forma de lista de escenarios. `qa-channel` es la suite sintética
amplia de comportamiento del producto y no forma parte de la matriz de cobertura
de transportes live.

Los ejecutores de transporte live importan los ids de escenario compartidos, los
helpers de cobertura base y el helper de selección de escenarios desde
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Carril   | Canary | Control de menciones | De bot a bot | Bloqueo de lista de permitidos | Respuesta de nivel superior | Respuesta con cita | Reanudación tras reinicio | Seguimiento de hilo | Aislamiento de hilo | Observación de reacciones | Comando de ayuda | Registro de comandos nativos |
| -------- | ------ | -------------------- | ------------ | ------------------------------- | --------------------------- | ------------------ | -------------------------- | ------------------- | -------------------- | -------------------------- | ---------------- | ----------------------------- |
| Discord  | x      | x                    | x            |                                 |                             |                    |                            |                     |                      |                            |                  | x                             |
| Matrix   | x      | x                    | x            | x                               | x                           |                    | x                          | x                   | x                    | x                          |                  |                               |
| Slack    | x      | x                    | x            | x                               | x                           |                    | x                          | x                   | x                    |                            |                  |                               |
| Telegram | x      | x                    | x            |                                 |                             |                    |                            |                     |                      |                            | x                |                               |
| WhatsApp | x      | x                    |              | x                               | x                           | x                  | x                          |                     |                      | x                          | x                |                               |

Esto mantiene `qa-channel` como el conjunto amplio de pruebas de comportamiento
del producto, mientras Matrix, Telegram y los demás transportes en vivo
comparten una lista de comprobación explícita del contrato de transporte.

Para un carril de VM Linux desechable sin introducir Docker en la ruta de QA,
ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto arranca un invitado Multipass nuevo, instala dependencias, compila
OpenClaw dentro del invitado, ejecuta `qa suite` y luego copia el informe de QA
normal y el resumen de vuelta a `.artifacts/qa-e2e/...` en el host. Reutiliza
el mismo comportamiento de selección de escenarios que `qa suite` en el host.

Las ejecuciones de suite en host y Multipass ejecutan varios escenarios
seleccionados en paralelo con workers de gateway aislados de forma
predeterminada. `qa-channel` usa de forma predeterminada concurrencia 4,
limitada por el recuento de escenarios seleccionados. Usa `--concurrency
<count>` para ajustar el recuento de workers, o `--concurrency 1` para la
ejecución serial. Usa `--pack personal-agent` para ejecutar el paquete de
benchmarks del asistente personal (10 escenarios). El selector de paquete es
aditivo con flags `--scenario` repetidos: primero se ejecutan los escenarios
explícitos y luego los escenarios del paquete en el orden del paquete, con los
duplicados eliminados. Usa `--pack observability` para seleccionar juntos los
escenarios `otel-trace-smoke` y `docker-prometheus-smoke` cuando un ejecutor de
QA personalizado ya proporciona la configuración del recopilador de
OpenTelemetry.

El comando sale con un valor distinto de cero cuando falla algún escenario. Usa
`--allow-failures` cuando quieras artefactos sin un código de salida fallido.

Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles
que son prácticas para el invitado: claves de proveedor basadas en env, la ruta
de configuración del proveedor en vivo de QA y `CODEX_HOME` cuando esté
presente. Mantén `--output-dir` bajo la raíz del repositorio para que el
invitado pueda escribir de vuelta a través del espacio de trabajo montado.

## Referencia de QA de Discord, Slack, Telegram y WhatsApp

Matrix tiene una [página dedicada](/es/concepts/qa-matrix) por su cantidad de
escenarios y el aprovisionamiento de homeserver respaldado por Docker. Discord,
Slack, Telegram y WhatsApp se ejecutan contra transportes reales preexistentes,
por lo que su referencia vive aquí.

### Flags de CLI compartidos

Estos carriles se registran mediante
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` y aceptan
los mismos flags:

| Flag                                  | Valor predeterminado                               | Descripción                                                                                                                                         |
| ------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Ejecuta solo este escenario. Repetible.                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Donde se escriben informes, resúmenes, evidencias, artefactos específicos del transporte y el registro de salida. Las rutas relativas se resuelven contra `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Raíz del repositorio al invocar desde un cwd neutral.                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | Id de cuenta temporal dentro de la configuración del gateway de QA.                                                                                 |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` o `live-frontier` (`live-openai` heredado todavía funciona).                                                                          |
| `--model <ref>` / `--alt-model <ref>` | valor predeterminado del proveedor                 | Refs de modelo principal/alternativo.                                                                                                               |
| `--fast`                              | desactivado                                        | Modo rápido del proveedor donde sea compatible.                                                                                                     |
| `--credential-source <env\|convex>`   | `env`                                              | Consulta [pool de credenciales de Convex](#convex-credential-pool).                                                                                 |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, `maintainer` en caso contrario         | Rol usado cuando `--credential-source convex`.                                                                                                      |

Cada carril sale con un valor distinto de cero ante cualquier escenario
fallido. `--allow-failures` escribe artefactos sin establecer un código de
salida fallido. Telegram también acepta `--list-scenarios` para imprimir los
ids de escenarios disponibles y salir; los otros carriles no exponen ese flag.

### QA de Telegram

```bash
pnpm openclaw qa telegram
```

Apunta a un grupo privado real de Telegram con dos bots distintos (driver +
SUT). El bot SUT debe tener un nombre de usuario de Telegram; la observación de
bot a bot funciona mejor cuando ambos bots tienen **Bot-to-Bot Communication
Mode** habilitado en `@BotFather`.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id numérico del chat (string).
- `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`

Escenarios (`extensions/qa-lab/src/live-transports/telegram/telegram-live.runtime.ts`):

- `telegram-canary`
- `telegram-mention-gating`
- `telegram-mentioned-message-reply`
- `telegram-help-command`
- `telegram-commands-command`
- `telegram-tools-compact-command`
- `telegram-whoami-command`
- `telegram-status-command`
- `telegram-repeated-command-authorization`
- `telegram-other-bot-command-gating`
- `telegram-context-command`
- `telegram-current-session-status-tool`
- `telegram-tool-only-usage-footer`
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

El conjunto predeterminado implícito siempre cubre canary, control de
menciones, respuestas de comandos nativos, direccionamiento de comandos y
respuestas de grupo de bot a bot. Los valores predeterminados de `mock-openai`
también incluyen comprobaciones deterministas de cadena de respuestas y
streaming de mensaje final. `telegram-current-session-status-tool` y
`telegram-tool-only-usage-footer` siguen siendo opcionales: el primero solo es
estable cuando se encadena directamente después de canary, y el segundo es una
prueba con Telegram real del pie de `/usage` en respuestas solo de herramientas.
Usa `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai`
para imprimir la división actual predeterminada/opcional con refs de regresión.

Artefactos de salida:

- `telegram-qa-report.md`
- `qa-evidence.json` - entradas de evidencia para las comprobaciones del
  transporte en vivo, incluidos campos de perfil, cobertura, proveedor, canal,
  artefactos, resultado y RTT.

Las ejecuciones de paquete de Telegram usan el mismo contrato de credenciales
de Telegram. La medición repetida de RTT forma parte del carril en vivo normal
de paquete de Telegram; la distribución de RTT se integra en `qa-evidence.json`
bajo `result.timing` para la comprobación de RTT seleccionada.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Cuando se establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, el wrapper en vivo
del paquete alquila una credencial `kind: "telegram"`, exporta el env de
grupo/driver/bot SUT alquilado a la ejecución del paquete instalado, envía
heartbeats del lease y lo libera al apagarse. El wrapper de paquete usa de
forma predeterminada 20 comprobaciones de RTT de
`telegram-mentioned-message-reply`, un tiempo de espera de RTT de 30 s y el rol
de Convex `maintainer` fuera de CI cuando se selecciona Convex. Sobrescribe
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` o
`OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar la medición de RTT sin
crear un comando de RTT separado ni un formato de resumen específico de
Telegram.

### QA de Discord

```bash
pnpm openclaw qa discord
```

Apunta a un canal de guild privado real de Discord con dos bots: un bot driver
controlado por el harness y un bot SUT iniciado por el gateway hijo de OpenClaw
mediante el plugin de Discord incluido. Verifica el manejo de menciones del
canal, que el bot SUT haya registrado el comando nativo `/help` con Discord y
escenarios de evidencia Mantis opcionales.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - debe coincidir con el id de
  usuario del bot SUT devuelto por Discord (de lo contrario, el carril falla
  rápido).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserva los cuerpos de mensajes en
  los artefactos de mensajes observados.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` selecciona el canal de voz/escenario
  para `discord-voice-autojoin`; sin él, el escenario elige el primer canal de
  voz/escenario visible para el bot SUT.

Escenarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - escenario de voz opcional. Se ejecuta por sí
  solo, habilita `channels.discord.voice.autoJoin` y verifica que el estado de
  voz actual de Discord del bot SUT sea el canal de voz/escenario objetivo. Las
  credenciales de Convex para Discord pueden incluir `voiceChannelId` opcional;
  de lo contrario, el runner descubre el primer canal de voz/escenario visible
  en el guild.
- `discord-status-reactions-tool-only` - escenario Mantis opcional. Se ejecuta
  por sí solo porque cambia el SUT a respuestas de guild siempre activas y solo
  de herramientas con `messages.statusReactions.enabled=true`, y luego captura
  una línea de tiempo de reacciones REST más artefactos visuales HTML/PNG. Los
  informes antes/después de Mantis también conservan artefactos MP4
  proporcionados por el escenario como `baseline.mp4` y `candidate.mp4`.
- `discord-thread-reply-filepath-attachment` - escenario Mantis opcional;
  consulta [escenarios Mantis de Discord](#discord-mantis-scenarios).

Ejecuta explícitamente el escenario de auto-unión a voz de Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Ejecuta explícitamente el escenario de reacciones de estado de Mantis:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.5 \
  --alt-model openai/gpt-5.5 \
  --fast
```

Artefactos de salida:

- `discord-qa-report.md`
- `qa-evidence.json` - entradas de evidencia para las comprobaciones de transporte en vivo.
- `discord-qa-observed-messages.json` - cuerpos redactados salvo que
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` y
  `discord-status-reactions-tool-only-timeline.png` cuando se ejecuta el
  escenario de reacciones de estado.

### QA de Slack

```bash
pnpm openclaw qa slack
```

Apunta a un canal privado real de Slack con dos bots distintos: un bot
controlador gestionado por el entorno de pruebas y un bot SUT iniciado por el
Gateway de OpenClaw secundario mediante el Plugin de Slack incluido.

Entorno requerido cuando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes
  en los artefactos de mensajes observados.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` habilita puntos de control de
  aprobación visual para Mantis. El ejecutor escribe `<scenario>.pending.json` y
  `<scenario>.resolved.json`, y luego espera archivos `.ack.json`
  coincidentes.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` sobrescribe el tiempo de
  espera de reconocimiento del punto de control. El valor predeterminado es
  `120000`.

Escenarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-reaction-glyph-native` - escenario opcional de reacción con
  herramienta de mensajes en vivo. Indica al agente que pase el glifo exacto
  `✅` y confirma que Slack almacenó `white_check_mark` para el bot SUT en el
  mensaje de destino.
- `slack-approval-exec-native` - escenario opcional de aprobación nativa de
  ejecución en Slack. Solicita una aprobación de ejecución mediante el Gateway,
  verifica que el mensaje de Slack tenga botones de aprobación nativos, la
  resuelve y verifica la actualización de Slack resuelta.
- `slack-approval-plugin-native` - escenario opcional de aprobación nativa de
  Plugin de Slack. Habilita juntas la ejecución y el reenvío de aprobación de
  Plugin para que los eventos de Plugin no se supriman por el enrutamiento de
  aprobación de ejecución, y luego verifica la misma ruta de interfaz nativa de
  Slack pendiente/resuelta.
- `slack-codex-approval-exec-native` - escenario opcional de aprobación de
  comandos de Codex Guardian. Habilita el Plugin de Codex en modo Guardian,
  enruta un turno de agente del Gateway originado en Slack mediante el entorno
  de pruebas del servidor de aplicaciones de Codex, espera el aviso nativo de
  aprobación de Plugin de Slack para `openclaw-codex-app-server`, lo resuelve y
  verifica que el turno de Codex termine con la salida de comando y los
  marcadores de asistente esperados.
- `slack-codex-approval-plugin-native` - escenario opcional de aprobación de
  archivos de Codex Guardian. Usa una instrucción `apply_patch` fuera del
  espacio de trabajo para que Codex emita la ruta de aprobación de cambios de
  archivo del servidor de aplicaciones, y luego verifica la misma ruta de
  aprobación nativa de Slack pendiente/resuelta, el marcador final de asistente
  y el contenido exacto del archivo antes de la limpieza.

Los escenarios de aprobación de Codex requieren un `--model` `openai/*` o
`codex/*`, las credenciales normales del modelo en vivo y autenticación de
Codex o autenticación con clave de API aceptada por el Plugin de Codex.
El informe de Slack incluye el método del servidor de aplicaciones de Codex,
la clave de modelo de Codex seleccionada, el estado final del turno de Codex y
la verificación de marcador de operación junto con los metadatos redactados de
aprobación de Slack.

Artefactos de salida:

- `slack-qa-report.md`
- `qa-evidence.json` - entradas de evidencia para las comprobaciones de transporte en vivo.
- `slack-qa-observed-messages.json` - cuerpos redactados salvo que
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - solo cuando Mantis establece
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; contiene JSON de puntos de
  control, JSON de reconocimiento y capturas de pantalla pendientes/resueltas.

#### Configurar el espacio de trabajo de Slack

La línea necesita dos aplicaciones distintas de Slack en un espacio de trabajo,
más un canal del que ambos bots sean miembros:

- `channelId` - el id `Cxxxxxxxxxx` de un canal al que ambos bots hayan sido
  invitados. Usa un canal dedicado; la línea publica en cada ejecución.
- `driverBotToken` - token de bot (`xoxb-...`) de la aplicación **Driver**.
- `sutBotToken` - token de bot (`xoxb-...`) de la aplicación **SUT**, que debe
  ser una aplicación de Slack separada del controlador para que su id de usuario
  de bot sea distinto.
- `sutAppToken` - token de nivel de aplicación (`xapp-...`) de la aplicación SUT
  con `connections:write`, usado por Socket Mode para que la aplicación SUT
  pueda recibir eventos.

Prefiere un espacio de trabajo de Slack dedicado a QA en lugar de reutilizar un
espacio de trabajo de producción.

El manifiesto SUT siguiente reduce intencionadamente la instalación de
producción del Plugin de Slack incluido (`extensions/slack/src/setup-shared.ts:12`)
a los permisos y eventos cubiertos por la suite de QA en vivo de Slack. Para la
configuración del canal de producción tal como la ven los usuarios, consulta
[configuración rápida del canal de Slack](/es/channels/slack#quick-setup); el par
Driver/SUT de QA está intencionadamente separado porque la línea necesita dos
ids de usuario de bot distintos en un espacio de trabajo.

**1. Crea la aplicación Driver**

Ve a [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → elige el espacio de trabajo de QA, pega el siguiente
manifiesto y luego _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Test driver bot for OpenClaw QA Slack live lane"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA Driver",
      "always_online": true
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": ["chat:write", "channels:history", "groups:history", "users:read"]
    }
  },
  "settings": {
    "socket_mode_enabled": false
  }
}
```

Copia el _Bot User OAuth Token_ (`xoxb-...`); ese se convierte en
`driverBotToken`. El controlador solo necesita publicar mensajes e
identificarse; sin eventos, sin Socket Mode.

**2. Crea la aplicación SUT**

Repite _Create New App → From a manifest_ en el mismo espacio de trabajo. Esta
aplicación de QA usa intencionadamente una versión más limitada del manifiesto
de producción del Plugin de Slack incluido
(`extensions/slack/src/setup-shared.ts:12`): los ámbitos y eventos de reacción
se omiten porque la suite de QA en vivo de Slack aún no cubre el manejo de
reacciones.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "OpenClaw QA SUT connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw QA SUT",
      "always_online": true
    },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

Después de que Slack cree la aplicación, haz dos cosas en su página de
configuración:

- _Install to Workspace_ → copia el _Bot User OAuth Token_ → ese se convierte en
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → añade el
  ámbito `connections:write` → guarda → copia el valor `xapp-...` → ese se
  convierte en `sutAppToken`.

Verifica que los dos bots tengan ids de usuario distintos llamando a
`auth.test` en cada token. El runtime distingue entre controlador y SUT por id
de usuario; reutilizar una aplicación para ambos fallará de inmediato en
mention-gating.

**3. Crea el canal**

En el espacio de trabajo de QA, crea un canal (por ejemplo, `#openclaw-qa`) e
invita a ambos bots desde dentro del canal:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia el id `Cxxxxxxxxxx` desde _channel info → About → Channel ID_; ese se
convierte en `channelId`. Un canal público funciona; si usas un canal privado,
ambas aplicaciones ya tienen `groups:history`, así que las lecturas de historial
del entorno de pruebas seguirán funcionando.

**4. Registra las credenciales**

Hay dos opciones. Usa variables de entorno para depuración en una sola máquina
(establece las cuatro variables `OPENCLAW_QA_SLACK_*` y pasa
`--credential-source env`), o inicializa el grupo compartido de Convex para que
CI y otros mantenedores puedan arrendarlas.

Para el grupo de Convex, escribe los cuatro campos en un archivo JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Con `OPENCLAW_QA_CONVEX_SITE_URL` y `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
exportados en tu shell, registra y verifica:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Espera `count: 1`, `status: "active"`, sin campo `lease`.

**5. Verifica de extremo a extremo**

Ejecuta la línea localmente para confirmar que ambos bots puedan hablar entre
sí mediante el intermediario:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Una ejecución verde se completa en bastante menos de 30 segundos y
`slack-qa-report.md` muestra tanto `slack-canary` como `slack-mention-gating`
con estado `pass`. Si la línea se queda esperando durante ~90 segundos y sale
con `Convex credential pool exhausted for kind "slack"`, el grupo está vacío o
todas las filas están arrendadas; `qa credentials list --kind slack --status all
--json` te dirá cuál de los dos casos es.

### QA de WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Apunta a dos cuentas dedicadas de WhatsApp Web: una cuenta controladora
gestionada por el entorno de pruebas y una cuenta SUT iniciada por el Gateway de
OpenClaw secundario mediante el Plugin de WhatsApp incluido.

Entorno requerido cuando `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opcional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` habilita escenarios de grupo como
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, escenarios de acción/medios/encuestas
  de grupo y `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes
  en los artefactos de mensajes observados.

Catálogo de escenarios (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Puerta de referencia y de grupo: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Comandos nativos: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportamiento de respuesta y salida final: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Acciones de mensajes de ruta de usuario: `whatsapp-agent-message-action-react` comienza
  desde un DM real del controlador, permite que el modelo llame a la herramienta `message` y
  observa la reacción nativa de WhatsApp. `whatsapp-agent-message-action-upload-file`
  usa la misma postura para `message(action=upload-file)` y observa
  medios nativos de WhatsApp. `whatsapp-group-agent-message-action-react` y
  `whatsapp-group-agent-message-action-upload-file` prueban las mismas
  acciones visibles para el usuario en un grupo real de WhatsApp.
- Difusión a grupos: `whatsapp-broadcast-group-fanout` comienza desde un mensaje
  de grupo de WhatsApp con mención y verifica respuestas visibles distintas de `main`
  y `qa-second`.
- Activación de grupo: `whatsapp-group-activation-always` cambia una sesión de grupo real
  a `/activation always`, prueba que un mensaje de grupo sin mención despierta
  al agente y luego restaura `/activation mention`.
  `whatsapp-group-reply-to-bot-triggers` siembra una respuesta del bot, envía una
  respuesta citada nativa a ella sin una mención explícita y verifica que el agente
  se despierta desde ese contexto de respuesta.
- Medios entrantes y mensajes estructurados: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Estos envían eventos reales de imagen, audio, documento, ubicación, contacto,
  sticker y reacción de WhatsApp a través del controlador.
- Pruebas directas del contrato de Gateway: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Estas omiten deliberadamente la solicitud al modelo
  y prueban contratos deterministas de Gateway/canal para `send`, `poll` y
  `message.action`.
- Cobertura de control de acceso: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Aprobaciones nativas: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reacciones de estado: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

El catálogo contiene actualmente 52 escenarios. El carril predeterminado
`live-frontier` se mantiene pequeño, con 10 escenarios, para una cobertura de humo rápida. El carril predeterminado
`mock-openai` ejecuta 45 escenarios de forma determinista a través del transporte real de WhatsApp
mientras simula solo la salida del modelo; los escenarios de aprobación y algunas comprobaciones
más pesadas/bloqueantes siguen siendo explícitos por id. de escenario.

El controlador de QA de WhatsApp observa eventos en vivo estructurados (`text`, `media`,
`location`, `reaction` y `poll`) y puede enviar activamente medios, encuestas,
contactos, ubicaciones y stickers. QA Lab importa ese controlador a través de la
superficie de paquete `@openclaw/whatsapp/api.js` en lugar de acceder a archivos privados
del runtime de WhatsApp. Para observaciones de grupo, `fromJid` es el JID del grupo,
mientras que `participantJid` y `fromPhoneE164` identifican al remitente participante.
El contenido de los mensajes se redacta de forma predeterminada. Las pruebas directas de Gateway de encuesta,
upload-file, medios, encuesta de grupo, medios de grupo y forma de respuesta son comprobaciones del contrato de transporte/API;
no se tratan como prueba de que una solicitud de usuario hizo que el
agente eligiera la misma acción. La prueba de acciones de ruta de usuario proviene de escenarios
como `whatsapp-agent-message-action-react` y
`whatsapp-group-agent-message-action-react`, donde el controlador envía un mensaje normal
de WhatsApp y QA Lab observa el artefacto nativo de WhatsApp resultante.
Los informes de WhatsApp incluyen la postura de cada escenario (`user-path`,
`direct-gateway` o `native-approval`) para que la evidencia no pueda confundirse con un
contrato más fuerte que el que realmente prueba.

Artefactos de salida:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - entradas de evidencia para las comprobaciones de transporte en vivo.
- `whatsapp-qa-observed-messages.json` - cuerpos redactados salvo que
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool de credenciales de Convex

Los carriles de Discord, Slack, Telegram y WhatsApp pueden alquilar credenciales desde un
pool compartido de Convex en lugar de leer las variables de entorno anteriores. Pasa
`--credential-source convex` (o define `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`);
QA Lab adquiere un alquiler exclusivo, le envía Heartbeats durante la duración de la
ejecución y lo libera al cerrar. Los tipos de pool son `"discord"`, `"slack"`,
`"telegram"` y `"whatsapp"`.

Formas de payload que el broker valida en `admin/add`:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` debe ser una cadena numérica de id. de chat.
- Usuario real de Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  Solo prueba de Mantis Telegram Desktop. Los carriles genéricos de QA Lab no deben adquirir
  este tipo.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - los números de teléfono deben ser cadenas E.164 distintas.

El flujo de trabajo de prueba de Mantis Telegram Desktop retiene un alquiler exclusivo de Convex
`telegram-user` tanto para el controlador CLI de TDLib como para el testigo de Telegram Desktop,
y luego lo libera después de publicar la prueba.

Cuando un PR necesita una diferencia visual determinista, Mantis puede usar la misma respuesta
del modelo simulado en `main` y en la cabecera del PR mientras cambia el formateador de Telegram o
la capa de entrega. Los valores predeterminados de captura están ajustados para comentarios de PR: clase estándar de
Crabbox, grabación de escritorio a 24fps, GIF de movimiento a 24fps y ancho de vista previa de
1920px. Los comentarios de antes/después deben publicar un paquete limpio que contenga
solo los GIF previstos.

Los carriles de Slack también pueden usar el pool. Las comprobaciones de forma de payload de Slack actualmente viven
en el ejecutor de QA de Slack en lugar del broker; usa `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`, con un
id. de canal de Slack como `Cxxxxxxxxxx`. Consulta
[Configurar el espacio de trabajo de Slack](#setting-up-the-slack-workspace) para el aprovisionamiento de la app
y los alcances.

Las variables de entorno operativas y el contrato de endpoint del broker de Convex viven en
[Pruebas → Credenciales compartidas de Telegram mediante Convex](/es/help/testing#shared-telegram-credentials-via-convex-v1)
(el nombre de la sección es anterior al pool multicanal; la semántica de alquiler se
comparte entre tipos).

## Semillas respaldadas por el repositorio

Los recursos semilla viven en `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Estos están intencionalmente en git para que el plan de QA sea visible tanto para humanos como para
el agente.

`qa-lab` sigue siendo un ejecutor genérico de escenarios YAML. Cada archivo YAML de escenario es la
fuente de verdad para una ejecución de prueba y debe definir:

- `title` de nivel superior
- metadatos `scenario`
- metadatos opcionales de categoría, capacidad, carril y riesgo en `scenario`
- referencias de documentación y código en `scenario`
- requisitos opcionales de Plugin en `scenario`
- parche opcional de configuración de Gateway en `scenario`
- `flow` ejecutable de nivel superior para escenarios de flujo, o
  `scenario.execution.kind` / `scenario.execution.path` para escenarios de Vitest y
  Playwright

La superficie de runtime reutilizable que respalda `flow` sigue siendo genérica y
transversal. Por ejemplo, los escenarios YAML pueden combinar helpers del lado del transporte
con helpers del lado del navegador que controlan la Control UI incrustada a través de
la frontera `browser.request` de Gateway sin añadir un ejecutor de caso especial.

Los archivos de escenario deben agruparse por capacidad del producto en lugar de por carpeta
del árbol fuente. Mantén estables los ID de escenario cuando los archivos se muevan; usa `docsRefs` y
`codeRefs` para la trazabilidad de la implementación.

La lista de referencia debe seguir siendo lo bastante amplia para cubrir:

- chat de DM y canal
- comportamiento de hilos
- ciclo de vida de acciones de mensaje
- callbacks de cron
- recuperación de memoria
- cambio de modelo
- traspaso a subagente
- lectura del repositorio y lectura de documentación
- una pequeña tarea de compilación como Lobster Invaders

## Carriles mock de proveedor

`qa suite` tiene dos carriles mock de proveedor locales:

- `mock-openai` es el mock de OpenClaw consciente del escenario. Sigue siendo el carril mock
  determinista predeterminado para QA respaldada por el repositorio y puertas de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental
  de protocolo, fixture, grabación/reproducción y caos. Es aditivo y
  no reemplaza el despachador de escenarios `mock-openai`.

La implementación de carriles de proveedor vive bajo `extensions/qa-lab/src/providers/`.
Cada proveedor posee sus valores predeterminados, inicio de servidor local, configuración de modelo de Gateway,
necesidades de preparación de perfiles de auth y banderas de capacidad en vivo/mock. El código compartido de suite y
Gateway enruta a través del registro de proveedores en lugar de ramificar por
nombres de proveedor.

## Adaptadores de transporte

`qa-lab` posee una frontera de transporte genérica para escenarios de QA YAML. `qa-channel` es
el valor predeterminado sintético. `crabline` inicia servidores locales con forma de proveedor y
ejecuta los plugins de canal normales de OpenClaw contra ellos. `live` está reservado para
credenciales reales de proveedor y canales externos.

En el nivel de arquitectura, la división es:

- `qa-lab` posee la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos
  y los informes.
- El adaptador de transporte posee la configuración de Gateway, la preparación, la observación entrante y saliente,
  las acciones de transporte y el estado de transporte normalizado.
- Los archivos de escenario YAML bajo `qa/scenarios/` definen la ejecución de prueba; `qa-lab`
  proporciona la superficie de runtime reutilizable que los ejecuta.

### Añadir un canal

Añadir un canal al sistema de QA YAML requiere la implementación del canal
más un paquete de escenarios que ejercite el contrato del canal. Para cobertura de humo en CI,
añade el servidor local de proveedor Crabline correspondiente y expónlo a
través del controlador `crabline`.

No añadas una nueva raíz de comando de QA de nivel superior cuando el host compartido `qa-lab` pueda
poseer el flujo.

`qa-lab` posee la mecánica compartida del host:

- la raíz de comando `openclaw qa`
- inicio y desmontaje de la suite
- concurrencia de workers
- escritura de artefactos
- generación de informes
- ejecución de escenarios
- alias de compatibilidad para escenarios antiguos de `qa-channel`

Los plugins ejecutores poseen el contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura el gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan los eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado de transporte normalizado
- cómo se ejecutan las acciones respaldadas por transporte
- cómo se gestiona el restablecimiento o la limpieza específicos del transporte

El umbral mínimo de adopción para un canal nuevo:

1. Mantén `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementa el ejecutor de transporte en la unión compartida del host `qa-lab`.
3. Mantén la mecánica específica de transporte dentro del plugin ejecutor o del
   arnés de canal.
4. Monta el ejecutor como `openclaw qa <runner>` en lugar de registrar un
   comando raíz competidor. Los plugins ejecutores deben declarar `qaRunners` en
   `openclaw.plugin.json` y exportar un arreglo `qaRunnerCliRegistrations`
   coincidente desde `runtime-api.ts`. Mantén `runtime-api.ts` ligero; la CLI
   diferida y la ejecución del ejecutor deben permanecer detrás de puntos de
   entrada separados.
5. Crea o adapta escenarios YAML bajo los directorios temáticos
   `qa/scenarios/`.
6. Usa los ayudantes genéricos de escenario para escenarios nuevos.
7. Mantén funcionando los alias de compatibilidad existentes salvo que el repo
   esté haciendo una migración intencional.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una vez en `qa-lab`, ponlo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, mantenlo en ese plugin
  ejecutor o arnés de plugin.
- Si un escenario necesita una capacidad nueva que más de un canal pueda usar,
  agrega un ayudante genérico en lugar de una rama específica de canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario
  específico de transporte y hazlo explícito en el contrato del escenario.

### Nombres de ayudantes de escenario

Ayudantes genéricos preferidos para escenarios nuevos:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Los alias de compatibilidad siguen disponibles para escenarios existentes:
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus`; pero la creación de escenarios
nuevos debe usar los nombres genéricos. Los alias existen para evitar una
migración de una sola vez, no como el modelo a seguir en adelante.

## Informes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la línea de
tiempo observada del bus. El informe debe responder:

- Qué funcionó
- Qué falló
- Qué quedó bloqueado
- Qué escenarios de seguimiento vale la pena agregar

Para el inventario de escenarios disponibles, útil al dimensionar trabajo de
seguimiento o cablear un transporte nuevo, ejecuta `pnpm openclaw qa coverage`
(agrega `--json` para salida legible por máquina). Al elegir una prueba enfocada
para un comportamiento o ruta de archivo tocados, ejecuta
`pnpm openclaw qa coverage --match <query>`. El informe de coincidencias busca
en metadatos de escenarios, referencias de docs, referencias de código, IDs de
cobertura, plugins y requisitos de proveedor, y luego imprime objetivos
coincidentes de `qa suite --scenario ...`.

Cada ejecución de `qa suite` escribe artefactos de nivel superior
`qa-evidence.json`, `qa-suite-summary.json` y `qa-suite-report.md` para el
conjunto de escenarios seleccionado. Los escenarios que declaran
`execution.kind: vitest` o `execution.kind: playwright` ejecutan la ruta de
prueba coincidente y también escriben registros por escenario. Los escenarios
que declaran `execution.kind: script` ejecutan el productor de evidencia en
`execution.path` mediante `node --import tsx` (con `${outputDir}` y
`${scenarioId}` expandidos en `execution.args`); el productor escribe su propio
`qa-evidence.json`, cuyas entradas se importan en la salida de la suite y cuyas
rutas de artefacto se resuelven en relación con ese `qa-evidence.json` del
productor. Cuando se llega a `qa suite` mediante `qa run --qa-profile`, el mismo
`qa-evidence.json` también incluye el resumen de la tarjeta de puntuación del
perfil para las categorías de taxonomía seleccionadas.

Trata la salida de cobertura como una ayuda de descubrimiento, no como sustituto
de una compuerta; el escenario seleccionado aún necesita el modo de proveedor,
el transporte en vivo, Multipass, Testbox o el carril de lanzamiento correctos
para el comportamiento bajo prueba. Para contexto de la tarjeta de puntuación,
consulta [Tarjeta de puntuación de madurez](/es/maturity/scorecard).

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario en varias
referencias de modelos en vivo y escribe un informe Markdown evaluado:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.5,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.5,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

El comando ejecuta procesos hijos locales de QA gateway, no Docker. Los
escenarios de evaluación de carácter deben establecer la personalidad mediante
`SOUL.md` y luego ejecutar turnos ordinarios de usuario, como chat, ayuda de
workspace y pequeñas tareas de archivos. No se debe indicar al modelo candidato
que está siendo evaluado. El comando conserva cada transcripción completa,
registra estadísticas básicas de ejecución y luego pide a los modelos jueces, en
modo rápido con razonamiento `xhigh` donde sea compatible, que clasifiquen las
ejecuciones por naturalidad, estilo y humor. Usa `--blind-judge-models` al
comparar proveedores: el prompt del juez sigue recibiendo cada transcripción y
estado de ejecución, pero las referencias candidatas se reemplazan por etiquetas
neutras como `candidate-01`; el informe asigna las clasificaciones de vuelta a
las referencias reales después del análisis.

Las ejecuciones candidatas usan `high` thinking de forma predeterminada, con
`medium` para GPT-5.5 y `xhigh` para refs de evaluación de OpenAI más antiguas
que lo admiten. Sobrescribe un candidato específico en línea con
`--model provider/model,thinking=<level>`; las opciones en línea también admiten
`fast`, `no-fast` y `fast=<bool>`. `--thinking <level>` todavía establece una
alternativa global, y la forma anterior `--model-thinking <provider/model=level>`
se conserva por compatibilidad. Las refs candidatas de OpenAI usan modo rápido
de forma predeterminada para que se use el procesamiento prioritario cuando el
proveedor lo admita. Pasa `--fast` solo cuando quieras forzar el modo rápido para
todos los modelos candidatos. Las duraciones de candidatos y jueces se registran
en el informe para el análisis de benchmarks, pero los prompts de jueces dicen
explícitamente que no clasifiquen por velocidad. Las ejecuciones de modelos
candidatos y jueces usan ambas concurrencia 16 de forma predeterminada. Reduce
`--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la
presión del gateway local hagan que una ejecución sea demasiado ruidosa.

Cuando no se pasa ningún candidato `--model`, la evaluación de carácter usa de
forma predeterminada `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y `google/gemini-3.1-pro-preview`. Cuando no se pasa ningún
`--judge-model`, los jueces usan de forma predeterminada
`openai/gpt-5.5,thinking=xhigh,fast` y
`anthropic/claude-opus-4-8,thinking=high`.

## Docs relacionados

- [QA de matriz](/es/concepts/qa-matrix)
- [Tarjeta de puntuación de madurez](/es/maturity/scorecard)
- [Paquete de benchmark de agente personal](/es/concepts/personal-agent-benchmark-pack)
- [Canal QA](/es/channels/qa-channel)
- [Pruebas](/es/help/testing)
- [Dashboard](/es/web/dashboard)
