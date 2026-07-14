---
read_when:
    - Comprender cómo encaja la pila de control de calidad en su conjunto
    - Ampliación de qa-lab, qa-channel o un adaptador de transporte
    - Adición de escenarios de control de calidad respaldados por el repositorio
    - Creación de una automatización de control de calidad más realista para el panel del Gateway
summary: 'Descripción general de la pila de control de calidad: qa-lab, qa-channel, escenarios respaldados por el repositorio, canales de transporte en vivo, adaptadores de transporte e informes.'
title: Descripción general de QA
x-i18n:
    generated_at: "2026-07-14T13:34:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 2a217d9aed313db5b57c3d9709b2b976138604ab19ce2c13d8ea279d17df2bb8
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pila privada de QA ejercita OpenClaw de una forma realista, con la estructura propia de un canal, que
una prueba unitaria no puede reproducir.

Componentes:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de mensajes directos, canales, hilos,
  reacciones, ediciones y eliminaciones.
- `extensions/qa-lab`: interfaz de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe en Markdown.
- `extensions/qa-matrix`: adaptador de transporte en vivo que controla el Plugin real de Matrix
  dentro de un gateway de QA secundario.
- `qa/`: recursos iniciales respaldados por el repositorio para la tarea de inicio y los escenarios de QA
  de referencia.
- [Mantis](/es/concepts/mantis): verificación en vivo previa y posterior para errores que
  requieren transportes reales, capturas de pantalla del navegador, estado de la máquina virtual y evidencias para la PR.

## Superficie de comandos

Todos los flujos de QA se ejecutan mediante `pnpm openclaw qa <subcommand>`. Muchos tienen alias de script
`pnpm qa:*`; ambas formas funcionan.

| Comando                                             | Propósito                                                                                                                                                                                                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autocomprobación de QA incluida sin `--qa-profile`; ejecutor de perfiles de madurez respaldados por la taxonomía con `--qa-profile smoke-ci`, `--qa-profile release` o `--qa-profile all`.                                                                                                  |
| `qa suite`                                          | Ejecutar escenarios respaldados por el repositorio en el carril del gateway de QA. `--runner multipass` utiliza una máquina virtual Linux desechable en lugar del host.                                                                                                                                         |
| `qa coverage`                                       | Imprimir el inventario YAML de cobertura de escenarios (`--json` para salida procesable por máquinas; `--match <query>` para buscar escenarios de un comportamiento modificado; `--tools` para la cobertura de fixtures de herramientas del entorno de ejecución).                                                                                  |
| `qa parity-report`                                  | Comparar dos archivos `qa-suite-summary.json` para una puerta de paridad del eje de modelos, o utilizar `--runtime-axis --token-efficiency` para generar informes de paridad del entorno de ejecución y eficiencia de tokens entre Codex y OpenClaw.                                                                          |
| `qa confidence-report`                              | Clasificar los artefactos de prueba de QA respecto a un manifiesto en un informe de confianza sin elementos desconocidos.                                                                                                                                                                               |
| `qa confidence-self-test`                           | Generar canarios de control negativo con datos iniciales que demuestren que la puerta de confianza detecta desviaciones.                                                                                                                                                                                   |
| `qa jsonl-replay`                                   | Reproducir transcripciones JSONL seleccionadas mediante el sistema de reproducción de paridad del entorno de ejecución.                                                                                                                                                                                         |
| `qa character-eval`                                 | Ejecutar el escenario de QA de personajes en varios modelos en vivo con un informe evaluado. Véase [Informes](#reporting).                                                                                                                                                        |
| `qa manual`                                         | Ejecutar un prompt único en el carril del proveedor/modelo seleccionado.                                                                                                                                                                                                      |
| `qa ui`                                             | Iniciar la interfaz de depuración de QA y el bus de QA local (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                |
| `qa docker-build-image`                             | Crear la imagen de Docker de QA precompilada.                                                                                                                                                                                                                                 |
| `qa docker-scaffold`                                | Generar una estructura inicial de docker-compose para el panel de QA y el carril del gateway.                                                                                                                                                                                                |
| `qa up`                                             | Crear el sitio de QA, iniciar la pila respaldada por Docker e imprimir la URL (alias: `pnpm qa:lab:up`; la variante `:fast` añade `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                              |
| `qa aimock`                                         | Iniciar únicamente el servidor del proveedor AIMock.                                                                                                                                                                                                                              |
| `qa mock-openai`                                    | Iniciar únicamente el servidor del proveedor `mock-openai` compatible con escenarios.                                                                                                                                                                                                        |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestionar el grupo compartido de credenciales de Convex.                                                                                                                                                                                                                           |
| `qa discord`                                        | Carril de transporte en vivo contra un canal real de un servidor privado de Discord.                                                                                                                                                                                                   |
| `qa matrix`                                         | Carril de transporte en vivo contra un servidor doméstico Tuwunel desechable. Véase [QA de Matrix](/es/concepts/qa-matrix).                                                                                                                                                                  |
| `qa slack`                                          | Carril de transporte en vivo contra un canal privado real de Slack.                                                                                                                                                                                                           |
| `qa telegram`                                       | Carril de transporte en vivo contra un grupo privado real de Telegram.                                                                                                                                                                                                          |
| `qa whatsapp`                                       | Carril de transporte en vivo contra cuentas reales de WhatsApp Web.                                                                                                                                                                                                             |
| `qa mantis`                                         | Ejecutor de verificación previa y posterior para errores de transporte en vivo, con evidencias de reacciones de estado de Discord, pruebas de humo de escritorio/navegador de Crabbox y pruebas de humo de Slack en VNC. Véanse [Mantis](/es/concepts/mantis) y [Manual de ejecución de Mantis con Slack Desktop](/es/concepts/mantis-slack-desktop-runbook). |

`qa matrix` está registrado como Plugin ejecutor (`extensions/qa-matrix`); todos los
demás carriles anteriores están integrados directamente en `qa-lab`.

### `qa run` respaldado por perfiles

El `qa run` respaldado por perfiles lee la pertenencia desde `taxonomy.yaml` y, a continuación, envía
los escenarios resueltos mediante `qa suite`. `--surface` y `--category` filtran
el perfil seleccionado en lugar de definir carriles separados. El
`qa-evidence.json` resultante incluye un resumen del cuadro de indicadores del perfil con recuentos
de las categorías seleccionadas e identificadores de cobertura faltantes; las entradas de evidencia individuales siguen siendo la
fuente de verdad para las pruebas, las funciones de cobertura y los resultados. Los identificadores de cobertura
de características de la taxonomía son objetivos de prueba exactos, no alias: la cobertura de escenarios primarios
satisface los identificadores coincidentes, mientras que la cobertura secundaria sigue siendo orientativa. Los identificadores de cobertura utilizan
el formato `namespace.behavior` con puntos y segmentos alfanuméricos en minúsculas o con guiones;
los identificadores de perfil, superficie y categoría aún pueden utilizar los identificadores existentes de la
taxonomía con guiones o puntos.

La evidencia reducida omite el `execution` de cada entrada y establece `evidenceMode: "slim"`;
`smoke-ci` utiliza el formato reducido de forma predeterminada y `--evidence-mode full` restaura las entradas completas:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Utilice `smoke-ci` para pruebas deterministas de perfiles con proveedores de modelos simulados y
servidores de proveedores locales de Crabline. Utilice `release` para pruebas Stable/LTS contra
canales en vivo. Utilice `all` únicamente para ejecuciones explícitas de evidencia de la taxonomía completa; este
selecciona todas las categorías de madurez activas y puede ejecutarse mediante el flujo de trabajo `QA
Profile Evidence` de GitHub Actions con `qa_profile=all`. Cuando un
comando también necesite un perfil raíz de OpenClaw, coloque el perfil raíz antes del
comando de QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Flujo del operador

El flujo actual del operador de QA es un sitio de QA con dos paneles:

- Izquierda: panel del Gateway (interfaz de control) con el agente.
- Derecha: laboratorio de QA, que muestra la transcripción similar a Slack y el plan de escenarios.

Ejecútelo con:

```bash
pnpm qa:lab:up
```

Esto crea el sitio de QA, inicia el carril del gateway respaldado por Docker y expone
la página del laboratorio de QA, donde un operador o un bucle de automatización puede asignar al agente una misión de
QA, observar el comportamiento real del canal y registrar qué funcionó, qué falló o
qué permaneció bloqueado.

Para iterar más rápidamente en la interfaz del laboratorio de QA sin volver a crear la imagen de Docker cada vez,
inicie la pila con un paquete del laboratorio de QA montado mediante enlace:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios de Docker en una imagen precompilada y
monta mediante enlace `extensions/qa-lab/web/dist` en el contenedor `qa-lab`.
`qa:lab:watch` vuelve a crear ese paquete cuando hay cambios y el navegador se recarga automáticamente
cuando cambia el hash de los recursos del laboratorio de QA.

### Pruebas de humo de observabilidad

<Note>
El QA de observabilidad sigue estando disponible únicamente desde el checkout del código fuente. El paquete tar de npm omite
intencionadamente el laboratorio de QA (y `qa-channel`/`qa-matrix`), por lo que los carriles de publicación de paquetes
en Docker no ejecutan comandos `qa`. Ejecútelos desde un checkout compilado del código fuente cuando
se modifique la instrumentación de diagnóstico.
</Note>

| Alias                                   | Qué ejecuta                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm qa:otel:smoke`                    | Receptor local de OpenTelemetry más el escenario `otel-trace-smoke` con `diagnostics-otel` habilitado.                                      |
| `pnpm qa:otel:collector-smoke`          | La misma vía detrás de un contenedor Docker real de OpenTelemetry Collector. Úsela al cambiar el cableado de endpoints o la compatibilidad con el recopilador/OTLP. |
| `pnpm qa:prometheus:smoke`              | El escenario `docker-prometheus-smoke` con `diagnostics-prometheus` habilitado.                                                           |
| `pnpm qa:observability:smoke`           | `qa:otel:smoke` seguido de `qa:prometheus:smoke`.                                                                                      |
| `pnpm qa:observability:collector-smoke` | `qa:otel:collector-smoke` seguido de `qa:prometheus:smoke`.                                                                            |

`qa:otel:smoke` inicia un receptor OTLP/HTTP local, ejecuta un turno mínimo
del agente del canal de control de calidad y, a continuación, comprueba que se exporten trazas, métricas y registros. Decodifica
los intervalos de traza protobuf exportados y comprueba la estructura crítica para la versión:
`openclaw.run`, `openclaw.harness.run`, un intervalo de llamada al modelo con la convención semántica
GenAI más reciente, `openclaw.context.assembled` y `openclaw.message.delivery`
deben estar presentes. La prueba de humo fuerza
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, por lo que el intervalo de llamada al
modelo debe usar el nombre `{gen_ai.operation.name} {gen_ai.request.model}`; las llamadas al modelo
no deben exportar `StreamAbandoned` en turnos correctos; los identificadores de diagnóstico
sin procesar y los atributos `openclaw.content.*` deben quedar fuera de la traza. El mensaje del escenario
pide al modelo que responda con un marcador fijo y que no revele una cadena
secreta fija; las cargas útiles OTLP sin procesar no deben contener ninguno de los dos, ni la clave de
sesión de control de calidad derivada del identificador del escenario. Escribe `otel-smoke-summary.json`
junto a los artefactos del conjunto de control de calidad.

`qa:prometheus:smoke` verifica que se rechacen las extracciones no autenticadas y, a continuación,
comprueba que la extracción autenticada incluya las familias de métricas críticas para la versión
sin contenido del mensaje, contenido de la respuesta, identificadores de diagnóstico sin procesar, tokens
de autenticación ni rutas locales.

### Vías de prueba de humo de Matrix

Para una vía de prueba de humo de Matrix con transporte real que no requiera credenciales
del proveedor de modelos, ejecute el perfil rápido con el proveedor OpenAI simulado determinista:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Para la vía del proveedor de frontera en vivo, proporcione explícitamente credenciales
compatibles con OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

La referencia completa de la CLI, el catálogo de perfiles/escenarios, las variables de entorno y la
disposición de artefactos de esta vía se encuentran en [Control de calidad de Matrix](/es/concepts/qa-matrix). En resumen:
aprovisiona un servidor doméstico Tuwunel desechable en Docker, registra usuarios temporales
de controlador/SUT/observador, ejecuta el Plugin real de Matrix dentro de un Gateway secundario de
control de calidad limitado a ese transporte (sin `qa-channel`) y, a continuación, escribe un informe
Markdown, un resumen JSON, un artefacto de eventos observados y un registro de salida combinado en
`.artifacts/qa-e2e/matrix-<timestamp>/`.

Los escenarios abarcan comportamientos del transporte que las pruebas unitarias no pueden demostrar de
extremo a extremo: control por menciones, políticas de permitir bots, listas de permitidos, respuestas
de nivel superior y en hilos, enrutamiento de mensajes directos, gestión de reacciones, supresión de
ediciones entrantes, deduplicación de reproducciones tras reinicios, recuperación de interrupciones del
servidor doméstico, entrega de metadatos de aprobación, gestión de archivos multimedia y flujos de
arranque/recuperación/verificación de E2EE de Matrix. El perfil E2EE de la CLI también ejecuta
`openclaw matrix encryption setup` y comandos de
verificación mediante el mismo servidor doméstico desechable antes de comprobar las
respuestas del Gateway.

La CI utiliza la misma superficie de comandos en
`.github/workflows/qa-live-transports-convex.yml`. Las ejecuciones programadas y las manuales
predeterminadas ejecutan el perfil rápido de Matrix con credenciales de frontera en vivo
proporcionadas por el control de calidad, `--fast` y `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`.
La ejecución manual `matrix_profile=all` se distribuye en cinco fragmentos de perfil: `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

### Escenarios de Discord para Mantis

Discord también dispone de escenarios opcionales exclusivos de Mantis para reproducir errores. Use
`--scenario discord-status-reactions-tool-only` para la cronología explícita de
reacciones de estado, o `--scenario discord-thread-reply-filepath-attachment`
para crear un hilo real de Discord y verificar que `message.thread-reply`
conserve un archivo adjunto `filePath`. Estos escenarios no forman parte de la vía predeterminada
de Discord en vivo porque son pruebas de reproducción del antes y el después, en lugar de una
cobertura amplia de pruebas de humo. El flujo de trabajo de Mantis para archivos adjuntos en hilos también puede añadir un
vídeo de testigo de Discord Web con la sesión iniciada cuando
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` o
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` está configurado en el entorno de
control de calidad. Ese perfil de visualización solo sirve para la captura visual; la decisión de
aprobación o fallo sigue procediendo del oráculo REST de Discord.

Para vías de prueba de humo con transporte real de Discord, Slack, Telegram y WhatsApp:

```bash
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa telegram
pnpm openclaw qa whatsapp
```

Se dirigen a un canal real preexistente con dos bots o cuentas (controlador +
SUT). Las variables de entorno requeridas, las listas de escenarios, los artefactos de salida y el grupo de
credenciales de Convex se documentan en la
[referencia de control de calidad de Discord, Slack, Telegram y WhatsApp](#discord-slack-telegram-and-whatsapp-qa-reference)
que aparece más adelante.

### Ejecutores de escritorio de Slack y tareas visuales de Mantis

Para una ejecución completa en una máquina virtual de escritorio de Slack con recuperación mediante VNC, ejecute:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ese comando arrienda una máquina de escritorio/navegador de Crabbox, ejecuta la vía de Slack en vivo
dentro de la máquina virtual, abre Slack Web en el navegador VNC, captura el escritorio
y copia `slack-qa/`, `slack-desktop-smoke.png` y
`slack-desktop-smoke.mp4` (cuando la captura de vídeo está disponible) de vuelta al
directorio de artefactos de Mantis. Los arrendamientos de escritorio/navegador de Crabbox proporcionan de antemano las
herramientas de captura y los paquetes auxiliares del navegador/compilación nativa, por lo que el escenario
solo debería instalar alternativas en arrendamientos antiguos. Mantis informa de los tiempos totales y
por fase en `mantis-slack-desktop-smoke-report.md`, de modo que las ejecuciones lentas muestran
si el tiempo se dedicó a preparar el arrendamiento, adquirir credenciales, configurar el entorno remoto o
copiar artefactos. Reutilice `--lease-id <cbx_...>` después de iniciar sesión manualmente
en Slack Web mediante VNC; los arrendamientos reutilizados también mantienen activa la caché del almacén
pnpm de Crabbox. El valor predeterminado `--hydrate-mode source` realiza la verificación desde un repositorio de código fuente y
ejecuta la instalación/compilación dentro de la máquina virtual. Use `--hydrate-mode prehydrated` solo cuando
el espacio de trabajo remoto reutilizado ya tenga `node_modules` y un `dist/` compilado;
ese modo omite el costoso paso de instalación/compilación y falla de forma cerrada cuando el
espacio de trabajo no está listo. Con `--gateway-setup`, Mantis deja un
Gateway de Slack de OpenClaw persistente ejecutándose dentro de la máquina virtual en el puerto `38973`; sin esta opción, el
comando ejecuta la vía normal de control de calidad de Slack entre bots y finaliza después de capturar los
artefactos.

Para demostrar la interfaz nativa de aprobación de Slack con pruebas de escritorio, ejecute el modo de
puntos de control de aprobación de Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Este modo es mutuamente excluyente con `--gateway-setup`. Ejecuta los escenarios de
aprobación de Slack, rechaza los identificadores de escenarios que no sean de aprobación, espera en cada
estado de aprobación pendiente y resuelto, representa el mensaje observado de la API de Slack en
`approval-checkpoints/<scenario>-pending.png` y
`approval-checkpoints/<scenario>-resolved.png` y, a continuación, falla si falta o está vacío algún punto de control,
prueba del mensaje, acuse de recibo o captura de pantalla representada.
Los arrendamientos nuevos de CI aún pueden mostrar el inicio de sesión de Slack en
`slack-desktop-smoke.png`; las imágenes de los puntos de control de aprobación constituyen la prueba visual
de esta vía.

La ejecución predeterminada de puntos de control conserva los dos escenarios estándar de aprobación de Slack.
Para capturar cualquiera de las rutas opcionales de aprobación de Codex, selecciónela explícitamente con
`--scenario slack-codex-approval-exec-native` o
`--scenario slack-codex-approval-plugin-native`; Mantis acepta ambas y emite
el mismo par de capturas de pantalla de estado pendiente/resuelto. El ejecutor amplía los plazos de sus puntos de control
y comandos remotos para cada ruta de Codex seleccionada, de modo que pueda finalizar toda la
secuencia de aprobación, finalización del agente y actualización del estado resuelto.

La lista de comprobación del operador, el comando de ejecución del flujo de trabajo de GitHub, el contrato de
comentarios de pruebas, la tabla de decisiones del modo de hidratación, la interpretación de tiempos y los pasos para
gestionar fallos se encuentran en el
[manual de ejecución de escritorio de Slack con Mantis](/es/concepts/mantis-slack-desktop-runbook).

Para una tarea de escritorio al estilo de agente/CV, ejecute:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.6-luna
```

`visual-task` arrienda o reutiliza una máquina de escritorio/navegador de Crabbox, inicia
`crabbox record --while`, controla el navegador visible mediante un
`visual-driver` anidado, captura `visual-task.png`, ejecuta `openclaw infer image
describe` en la captura de pantalla cuando se
selecciona `--vision-mode image-describe` y escribe `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` y
`mantis-visual-task-report.md`. Cuando se establece `--expect-text`, el mensaje de visión
solicita un veredicto JSON estructurado (`visible`, `evidence`, `reason`)
y solo se aprueba cuando el modelo informa de `visible: true` con pruebas que
citan el texto esperado; una respuesta `visible: false` que se limita a citar el
texto objetivo sigue haciendo que la comprobación falle. Use `--vision-mode metadata` para una
prueba de humo sin modelo que demuestre el funcionamiento del escritorio, el navegador, la captura de pantalla y la
canalización de vídeo sin llamar a un proveedor de comprensión de imágenes. La grabación es un
artefacto obligatorio para `visual-task`; si Crabbox no graba ningún
`visual-task.mp4` que no esté vacío, la tarea falla aunque el controlador visual se haya ejecutado correctamente. En caso de
fallo, Mantis conserva el arrendamiento para VNC, salvo que la tarea ya se hubiera completado correctamente
y no se hubiera establecido `--keep-lease`.

### Comprobación del estado del grupo de credenciales

Antes de utilizar credenciales en vivo agrupadas, ejecute:

```bash
pnpm openclaw qa credentials doctor
```

El diagnóstico comprueba el entorno del intermediario de Convex (`OPENCLAW_QA_CONVEX_SITE_URL`,
`OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX`), valida la configuración de los endpoints, informa
únicamente del estado establecido/ausente de `OPENCLAW_QA_CONVEX_SECRET_CI` y
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`, y verifica la accesibilidad de administración/listado
cuando está presente el secreto del mantenedor.

## Cobertura de transportes en vivo

Las vías de transporte en vivo comparten un único contrato, en lugar de que cada una invente su propia
estructura de lista de escenarios. `qa-channel` es el conjunto sintético amplio de
comportamiento del producto y no forma parte de la matriz de cobertura de transportes en vivo.

Los ejecutores de transportes en vivo importan los identificadores de escenarios compartidos, los asistentes de cobertura
de referencia y el asistente de selección de escenarios desde
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Canal     | Canary | Restricción por mención | Bot a bot | Bloqueo por lista de permitidos | Respuesta de nivel superior | Respuesta con cita | Reanudación tras reinicio | Seguimiento de hilo | Aislamiento de hilos | Observación de reacciones | Comando de ayuda | Registro de comandos nativos |
| -------- | ------ | ----------------------- | --------- | -------------------------------- | ---------------------------- | ------------------ | -------------------------- | --------------------- | --------------------- | -------------------------- | ----------------- | ---------------------------- |
| Discord  | x      | x                       | x         |                                  |                              |                    |                            |                       |                       |                            |                   | x                            |
| Matrix   | x      | x                       | x         | x                                | x                            |                    | x                          | x                     | x                     | x                          |                   |                              |
| Slack    | x      | x                       | x         | x                                | x                            |                    | x                          | x                     | x                     |                            |                   |                              |
| Telegram | x      | x                       |           |                                  |                              |                    |                            |                       |                       |                            | x                 |                              |
| WhatsApp | x      | x                       |           | x                                | x                            | x                  | x                          |                       |                       | x                          | x                 |                              |

Esto mantiene `qa-channel` como el conjunto amplio de pruebas de comportamiento del producto, mientras que Matrix,
Telegram y los demás transportes reales comparten una única lista de comprobación
explícita del contrato de transporte.

Para ejecutar un canal de VM Linux desechable sin incorporar Docker a la ruta de control de calidad, ejecute:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto inicia un invitado de Multipass nuevo, instala las dependencias, compila OpenClaw
dentro del invitado, ejecuta `qa suite` y, a continuación, copia el informe y
el resumen normales de control de calidad en `.artifacts/qa-e2e/...` en el host. Reutiliza el mismo
comportamiento de selección de escenarios que `qa suite` en el host.

Las ejecuciones del conjunto en el host y en Multipass ejecutan varios escenarios seleccionados en
paralelo con procesos de trabajo aislados del Gateway de forma predeterminada. `qa-channel` utiliza de forma predeterminada
una concurrencia de 4, limitada por el número de escenarios seleccionados. Use `--concurrency
<count>` para ajustar el número de procesos de trabajo, o `--concurrency 1` para la ejecución en serie.
Use `--pack personal-agent` para ejecutar el paquete de pruebas comparativas del asistente personal (10
escenarios). El selector de paquetes se combina con indicadores `--scenario` repetidos:
primero se ejecutan los escenarios explícitos y, después, los escenarios del paquete en el orden del paquete,
eliminando los duplicados. Use `--pack observability` para seleccionar conjuntamente los escenarios
`otel-trace-smoke` y `docker-prometheus-smoke` cuando un
ejecutor de control de calidad personalizado ya proporcione la configuración del recopilador de OpenTelemetry.

El comando termina con un código distinto de cero cuando falla algún escenario. Use `--allow-failures`
cuando necesite los artefactos sin un código de salida de error.

Las ejecuciones reales reenvían las entradas de autenticación de control de calidad compatibles que resultan prácticas para el
invitado: claves del proveedor basadas en variables de entorno, la ruta de configuración del proveedor real de control de calidad y
`CODEX_HOME` cuando esté presente. Mantenga `--output-dir` bajo la raíz del repositorio para que el
invitado pueda volver a escribir mediante el espacio de trabajo montado.

## Referencia de control de calidad de Discord, Slack, Telegram y WhatsApp

Matrix tiene una [página específica](/es/concepts/qa-matrix) debido a su cantidad de escenarios
y al aprovisionamiento de su servidor doméstico respaldado por Docker. Discord, Slack, Telegram
y WhatsApp se ejecutan contra transportes reales preexistentes, por lo que su referencia
se encuentra aquí.

### Indicadores compartidos de la CLI

Estos canales se registran mediante
`extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` y
aceptan los mismos indicadores:

| Indicador                             | Valor predeterminado                                | Descripción                                                                                                                                     |
| ------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                    | -                                                   | Ejecuta únicamente este escenario. Se puede repetir.                                                                                            |
| `--output-dir <path>`                    | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>`                                  | Ubicación donde se escriben los informes, resúmenes, pruebas, artefactos específicos del transporte y el registro de salida. Las rutas relativas se resuelven con respecto a `--repo-root`. |
| `--repo-root <path>`                    | `process.cwd()`                                  | Raíz del repositorio cuando se invoca desde un directorio de trabajo neutral.                                                                   |
| `--sut-account <id>`                    | `sut`                                  | Identificador de cuenta temporal dentro de la configuración del Gateway de control de calidad.                                                  |
| `--provider-mode <mode>`                    | `live-frontier`                                  | `mock-openai` o `live-frontier` (el valor heredado `live-openai` todavía funciona).                                                |
| `--model <ref>` / `--alt-model <ref>` | valor predeterminado del proveedor                | Referencias de los modelos principal y alternativo.                                                                                             |
| `--fast`                    | desactivado                                         | Modo rápido del proveedor cuando sea compatible.                                                                                                |
| `--credential-source <env\|convex>`                    | `env`                                  | Consulte [Grupo de credenciales de Convex](#convex-credential-pool).                                                                             |
| `--credential-role <maintainer\|ci>`                    | `ci` en CI, `maintainer` en caso contrario | Rol utilizado cuando `--credential-source convex`.                                                                                                |

Cada canal termina con un código distinto de cero si falla algún escenario. `--allow-failures` escribe
los artefactos sin establecer un código de salida de error. Telegram también acepta
`--list-scenarios` para mostrar los identificadores de escenarios disponibles y salir; los demás canales
no ofrecen ese indicador.

### Control de calidad de Telegram

```bash
pnpm openclaw qa telegram
```

Se dirige a un grupo privado real de Telegram con dos bots distintos (controlador +
SUT). El bot SUT debe tener un nombre de usuario de Telegram; la observación de bot a bot funciona
mejor cuando ambos bots tienen **Bot-to-Bot Communication Mode** activado en
`@BotFather`.

Variables de entorno obligatorias cuando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - identificador numérico del chat (cadena).
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

El conjunto predeterminado implícito siempre cubre Canary, la restricción por mención, las respuestas a comandos
nativos, el direccionamiento de comandos y las respuestas de grupo de bot a bot. Los valores predeterminados de `mock-openai`
también incluyen comprobaciones deterministas de la cadena de respuestas y de la transmisión
del mensaje final. `telegram-current-session-status-tool` y
`telegram-tool-only-usage-footer` siguen siendo opcionales: el primero solo es estable
cuando se ejecuta en hilo directamente después de Canary, y el segundo es una prueba en Telegram real
del pie `/usage` en respuestas que solo contienen herramientas. Use `pnpm openclaw qa telegram
--list-scenarios --provider-mode mock-openai` para mostrar la división
actual entre valores predeterminados y opcionales con referencias de regresión.

Artefactos de salida:

- `telegram-qa-report.md`
- `qa-evidence.json` - entradas de pruebas para las comprobaciones del transporte real,
  incluidos los campos de perfil, cobertura, proveedor, canal, artefactos, resultado y RTT.

Las ejecuciones de Telegram del paquete utilizan el mismo contrato de credenciales de Telegram. La medición
repetida de RTT forma parte del canal real normal de Telegram del paquete; la distribución
de RTT se incorpora en `qa-evidence.json` bajo `result.timing` para la
comprobación de RTT seleccionada.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Cuando se establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, el contenedor de ejecución real del paquete
alquila una credencial `kind: "telegram"`, exporta las variables de entorno del grupo y de los bots
controlador/SUT alquilados a la ejecución del paquete instalado, envía el Heartbeat del alquiler y lo libera
al apagarse. El contenedor de ejecución del paquete utiliza de forma predeterminada 20 comprobaciones de RTT de
`telegram-mentioned-message-reply`, un tiempo de espera de RTT de 30s y el rol de Convex
`maintainer` fuera de CI cuando se selecciona Convex. Sobrescriba
`OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS`
o `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar la medición de RTT sin
crear un comando de RTT independiente ni un formato de resumen específico de Telegram.

### Control de calidad de Discord

```bash
pnpm openclaw qa discord
```

Se dirige a un canal real de un servidor privado de Discord con dos bots: un bot controlador
administrado por el entorno de pruebas y un bot SUT iniciado por el Gateway secundario de OpenClaw
mediante el Plugin incluido de Discord. Verifica la gestión de menciones del canal, que
el bot SUT haya registrado el comando nativo `/help` con Discord y
los escenarios opcionales de pruebas de Mantis.

Variables de entorno obligatorias cuando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - debe coincidir con el identificador de usuario del bot SUT
  devuelto por Discord (de lo contrario, el canal falla inmediatamente).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en
  los artefactos de mensajes observados.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` selecciona el canal de voz/escenario para
  `discord-voice-autojoin`; sin esta opción, el escenario elige el primer canal
  de voz/escenario visible para el bot SUT.

Escenarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - escenario de voz opcional. Se ejecuta por sí solo, habilita
  `channels.discord.voice.autoJoin` y verifica que el estado de voz actual del bot SUT
  en Discord corresponda al canal de voz/escenario de destino. Las credenciales de Discord de Convex
  pueden incluir el valor opcional `voiceChannelId`; de lo contrario, el ejecutor
  detecta el primer canal de voz/escenario visible del servidor.
- `discord-status-reactions-tool-only` - escenario opcional de Mantis. Se ejecuta por
  sí solo porque cambia el SUT a respuestas del servidor siempre activas y solo de herramientas
  con `messages.statusReactions.enabled=true`, y después captura una cronología
  de reacciones REST, además de artefactos visuales HTML/PNG. Los informes anterior/posterior
  de Mantis también conservan los artefactos MP4 proporcionados por el escenario como `baseline.mp4`
  y `candidate.mp4`.
- `discord-thread-reply-filepath-attachment` - escenario opcional de Mantis; consulte
  [Escenarios de Mantis para Discord](#discord-mantis-scenarios).

Ejecute explícitamente el escenario de conexión automática a voz de Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Ejecute explícitamente el escenario de reacciones de estado de Mantis:

```bash
pnpm openclaw qa discord \
  --scenario discord-status-reactions-tool-only \
  --provider-mode live-frontier \
  --model openai/gpt-5.6-luna \
  --alt-model openai/gpt-5.6-luna \
  --fast
```

Artefactos de salida:

- `discord-qa-report.md`
- `qa-evidence.json` - entradas de evidencia para las comprobaciones del transporte en vivo.
- `discord-qa-observed-messages.json` - cuerpos censurados, salvo que
  `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` y
  `discord-status-reactions-tool-only-timeline.png` cuando se ejecuta el escenario
  de reacción de estado.

### QA de Slack

```bash
pnpm openclaw qa slack
```

Se dirige a un canal privado real de Slack con dos bots distintos: un bot controlador
gestionado por el arnés y un bot SUT iniciado por el Gateway secundario de OpenClaw
mediante el plugin de Slack incluido.

Variables de entorno obligatorias cuando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en
  los artefactos de mensajes observados.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` habilita puntos de control de aprobación
  visual para Mantis. El ejecutor escribe `<scenario>.pending.json` y
  `<scenario>.resolved.json` y, a continuación, espera archivos `.ack.json` coincidentes.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` anula el tiempo de espera de
  confirmación del punto de control. El valor predeterminado es `120000`.

Escenarios YAML canónicos expuestos mediante el adaptador en vivo de Slack:

- `thread-follow-up`
- `thread-isolation`

Escenarios imperativos de Slack (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-channel-disabled-warning` - prueba opcional en Slack real que confirma que un
  canal configurado como deshabilitado emite una advertencia estructurada sin responder.
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-progress-commentary-true`, `slack-progress-commentary-false`,
  `slack-progress-commentary-omitted` y
  `slack-progress-commentary-verbose-dedupe` - pruebas opcionales en Slack real para
  los controles independientes de comentarios y progreso de herramientas, el valor predeterminado
  heredado cuando se omite la clave y el comportamiento de entrega única cuando está habilitado
  el progreso detallado persistente.
- `slack-reaction-glyph-native` - escenario opcional de reacción con la herramienta de mensajes en vivo.
  Indica al agente que proporcione el glifo exacto `✅` y confirma que Slack almacenó
  `white_check_mark` para el bot SUT en el mensaje de destino.
- `slack-chart-presentation-native` - escenario opcional de gráfico portátil que
  verifica el bloque nativo `data_visualization` y el texto accesible exacto.
- `slack-table-presentation-native` - escenario opcional de tabla portátil que
  verifica el bloque nativo `data_table`, las filas exactas y el texto accesible.
- `slack-table-invalid-blocks-fallback` - escenario opcional de transporte directo
  que envía una tabla sin procesar estructuralmente legible que supera el límite, con 101 filas de datos
  además de su encabezado, mediante la
  ruta de envío de Slack de producción; demuestra que el propio Slack devuelve `invalid_blocks`
  y verifica que la alternativa almacenada con el formato deshabilitado está completa y no contiene
  ningún bloque de datos nativo. El informe conserva únicamente evidencia segura de códigos de error,
  recuentos y valores booleanos; el texto sin procesar de la tabla sintética sigue
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT`.
- `slack-approval-exec-native` - escenario opcional de aprobación de ejecución nativa de Slack.
  Solicita una aprobación de ejecución mediante el Gateway, verifica que el mensaje de Slack
  tenga botones de aprobación nativos, la resuelve y verifica la actualización de Slack
  resuelta.
- `slack-approval-plugin-native` - escenario opcional de aprobación nativa de plugins de Slack.
  Habilita conjuntamente el reenvío de aprobaciones de ejecución y de plugins para que los eventos
  de plugins no sean suprimidos por el enrutamiento de aprobaciones de ejecución y, a continuación,
  verifica la misma ruta de interfaz nativa de Slack pendiente/resuelta.
- `slack-codex-approval-exec-native` - escenario opcional de aprobación de comandos de Codex Guardian.
  Habilita el plugin de Codex en modo Guardian, enruta un turno del agente de Gateway
  originado en Slack mediante el arnés del servidor de aplicaciones de Codex,
  espera la solicitud nativa de aprobación del plugin de Slack para
  `openclaw-codex-app-server`, la resuelve y verifica que el turno de Codex
  finalice con los marcadores esperados de salida del comando y del asistente.
- `slack-codex-approval-plugin-native` - escenario opcional de aprobación de archivos de Codex Guardian.
  Utiliza una instrucción `apply_patch` externa al espacio de trabajo para que Codex emita
  la ruta de aprobación de cambios de archivos del servidor de aplicaciones y, a continuación, verifica
  la misma ruta nativa de aprobación pendiente/resuelta de Slack, el marcador final del asistente y el
  contenido exacto del archivo antes de la limpieza.

Los escenarios de aprobación de Codex requieren un `openai/*` o `codex/*` `--model`, las
credenciales normales del modelo en vivo y una autenticación de Codex o mediante clave de API aceptada por el plugin de Codex.
El informe de Slack incluye el método del servidor de aplicaciones de Codex, la clave del modelo de Codex seleccionada,
el estado final del turno de Codex y la verificación del marcador de operación, además de los
metadatos censurados de aprobación de Slack.

Artefactos de salida:

- `slack-qa-report.md`
- `qa-evidence.json` - entradas de evidencia para las comprobaciones del transporte en vivo.
- `slack-qa-observed-messages.json` - cuerpos censurados, salvo que
  `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - solo cuando Mantis establece
  `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; contiene el JSON del punto de control,
  el JSON de confirmación y capturas de pantalla de los estados pendiente/resuelto.

#### Configuración del espacio de trabajo de Slack

La vía necesita dos aplicaciones de Slack distintas en un mismo espacio de trabajo, además de un canal
del que ambos bots sean miembros:

- `channelId` - el id `Cxxxxxxxxxx` de un canal al que se haya invitado a ambos bots.
  Utilice un canal dedicado; la vía publica contenido en cada ejecución.
- `driverBotToken` - token del bot (`xoxb-...`) de la aplicación **Driver**.
- `sutBotToken` - token del bot (`xoxb-...`) de la aplicación **SUT**, que debe ser una
  aplicación de Slack distinta de la del controlador para que su id de usuario de bot sea diferente.
- `sutAppToken` - token de nivel de aplicación (`xapp-...`) de la aplicación SUT con
  `connections:write`, utilizado por Socket Mode para que la aplicación SUT pueda recibir eventos.

Es preferible utilizar un espacio de trabajo de Slack dedicado a QA en lugar de reutilizar uno de
producción.

El manifiesto del SUT que aparece a continuación restringe intencionadamente la instalación de producción
del plugin de Slack incluido (`extensions/slack/src/setup-shared.ts:12`) a los
permisos y eventos cubiertos por el conjunto de QA en vivo de Slack. Para consultar la
configuración del canal de producción tal como la ven los usuarios, véase
[Configuración rápida del canal de Slack](/es/channels/slack#quick-setup); el par QA Driver/SUT
se mantiene separado intencionadamente porque la vía necesita dos ids de usuario de bot
distintos en un mismo espacio de trabajo.

**1. Crear la aplicación Driver**

Vaya a [api.slack.com/apps](https://api.slack.com/apps) → _Create New App_ →
_From a manifest_ → seleccione el espacio de trabajo de QA, pegue el siguiente manifiesto
y, a continuación, seleccione _Install to Workspace_:

```json
{
  "display_information": {
    "name": "OpenClaw QA Driver",
    "description": "Bot controlador de pruebas para la vía en vivo de QA de Slack de OpenClaw"
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

Copie el _Bot User OAuth Token_ (`xoxb-...`); este pasa a ser
`driverBotToken`. El controlador solo necesita publicar mensajes e identificarse;
no necesita eventos ni Socket Mode.

**2. Crear la aplicación SUT**

Repita _Create New App → From a manifest_ en el mismo espacio de trabajo. Esta aplicación de QA
utiliza intencionadamente una versión más restringida del manifiesto de producción
del plugin de Slack incluido (`extensions/slack/src/setup-shared.ts:12`): se omiten los
ámbitos y eventos de reacciones porque el conjunto de QA en vivo de Slack todavía no cubre
la gestión de reacciones.

```json
{
  "display_information": {
    "name": "OpenClaw QA SUT",
    "description": "Conector SUT de QA de OpenClaw para OpenClaw"
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

Después de que Slack cree la aplicación, realice dos acciones en su página de configuración:

- _Install to Workspace_ → copie el _Bot User OAuth Token_ → este pasa a ser
  `sutBotToken`.
- _Basic Information → App-Level Tokens → Generate Token and Scopes_ → añada el
  ámbito `connections:write` → guarde → copie el valor `xapp-...` → este
  pasa a ser `sutAppToken`.

Verifique que los dos bots tengan ids de usuario distintos llamando a `auth.test` con cada
token. El entorno de ejecución distingue el controlador y el SUT por el id de usuario; reutilizar una
misma aplicación para ambos hará que la restricción de menciones falle inmediatamente.

**3. Crear el canal**

En el espacio de trabajo de QA, cree un canal (p. ej., `#openclaw-qa`) e invite a ambos
bots desde el propio canal:

```text
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copie el id `Cxxxxxxxxxx` de _channel info → About → Channel ID_; este
pasa a ser `channelId`. Un canal público funciona; si utiliza un canal privado,
ambas aplicaciones ya tienen `groups:history`, por lo que las lecturas del historial del arnés
también se realizarán correctamente.

**4. Registrar las credenciales**

Hay dos opciones. Utilice variables de entorno para depurar en una sola máquina (establezca las cuatro
variables `OPENCLAW_QA_SLACK_*` y proporcione `--credential-source env`) o inicialice
el grupo compartido de Convex para que CI y otros mantenedores puedan obtenerlas mediante arrendamiento.

Para el grupo de Convex, escriba los cuatro campos en un archivo JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Con `OPENCLAW_QA_CONVEX_SITE_URL` y `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`
exportados en el shell, registre y verifique:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "Inicialización del grupo de QA de Slack"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Se esperan `count: 1`, `status: "active"` y ningún campo `lease`.

**5. Verificar de extremo a extremo**

Ejecute la vía localmente para confirmar que ambos bots pueden comunicarse entre sí mediante el
intermediario:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Una ejecución correcta finaliza en bastante menos de 30 segundos y `slack-qa-report.md`
muestra tanto `slack-canary` como `slack-mention-gating` con el estado `pass`. Si la
vía se bloquea durante ~90 segundos y finaliza con `Convex credential pool exhausted
for kind "slack"`, el grupo está vacío o todas las filas están arrendadas; `qa
credentials list --kind slack --status all --json` indicará cuál de los dos casos se aplica.

### QA de WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Se dirige a dos cuentas dedicadas de WhatsApp Web: una cuenta controladora gestionada por
el arnés y una cuenta SUT iniciada por el Gateway secundario de OpenClaw mediante
el plugin de WhatsApp incluido.

Variables de entorno obligatorias cuando `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opcional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` habilita escenarios de grupo como
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, escenarios de acciones, contenido multimedia y encuestas de grupo,
  y `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en
  los artefactos de mensajes observados.

Catálogo de escenarios (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Línea base y control por grupos: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`, `whatsapp-group-reply-to-bot-triggers`,
  `whatsapp-top-level-reply-shape`, `whatsapp-restart-resume`,
  `whatsapp-group-allowlist-block`.
- Comandos nativos: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportamiento de las respuestas y de la salida final: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-to-mode-batched`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`, `whatsapp-stream-final-message-accounting`.
- Acciones de mensajes en el recorrido del usuario: `whatsapp-agent-message-action-react` comienza
  desde un MD real del controlador, permite que el modelo invoque la herramienta `message` y
  observa la reacción nativa de WhatsApp. `whatsapp-agent-message-action-upload-file`
  adopta el mismo enfoque para `message(action=upload-file)` y observa
  contenido multimedia nativo de WhatsApp. `whatsapp-group-agent-message-action-react` y
  `whatsapp-group-agent-message-action-upload-file` demuestran las mismas
  acciones visibles para el usuario en un grupo real de WhatsApp.
- Distribución en grupos: `whatsapp-broadcast-group-fanout` comienza a partir de un mensaje
  con mención en un grupo de WhatsApp y verifica respuestas visibles distintas de `main`
  y `qa-second`.
- Activación de grupos: `whatsapp-group-activation-always` cambia una sesión de grupo real
  a `/activation always`, demuestra que un mensaje de grupo sin mención activa
  al agente y después restaura `/activation mention`.
  `whatsapp-group-reply-to-bot-triggers` prepara una respuesta del bot, le envía una
  respuesta citada nativa sin una mención explícita y verifica que el agente
  se activa a partir del contexto de esa respuesta.
- Contenido multimedia entrante y mensajes estructurados: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Estos envían eventos reales de imagen, audio, documento, ubicación, contacto,
  adhesivo y reacción de WhatsApp mediante el controlador.
- Sondeos directos del contrato del Gateway: `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-outbound-send-serialization`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Estos omiten deliberadamente las instrucciones al modelo
  y demuestran de forma determinista los contratos `send`, `poll` y
  `message.action` del Gateway/canal.
- Cobertura del control de acceso: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Aprobaciones nativas: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reacciones de estado: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

Actualmente, el catálogo contiene 52 escenarios. La vía predeterminada `live-frontier`
se mantiene reducida a 10 escenarios para ofrecer una cobertura rápida de pruebas de humo. La vía
predeterminada `mock-openai` ejecuta 45 escenarios de forma determinista mediante el transporte
real de WhatsApp y solo simula la salida del modelo; los escenarios de aprobación y algunas
comprobaciones más pesadas o bloqueantes siguen siendo explícitos mediante el id del escenario.

El controlador de control de calidad de WhatsApp observa eventos activos estructurados (`text`, `media`,
`location`, `reaction` y `poll`) y puede enviar activamente contenido multimedia, encuestas,
contactos, ubicaciones y adhesivos. QA Lab importa ese controlador mediante la
superficie del paquete `@openclaw/whatsapp/api.js`, en lugar de acceder a archivos privados
del entorno de ejecución de WhatsApp. Para las observaciones de grupos, `fromJid` es el JID del grupo,
mientras que `participantJid` y `fromPhoneE164` identifican al participante remitente.
El contenido de los mensajes se censura de forma predeterminada. Los sondeos directos del Gateway de encuestas, carga de archivos,
contenido multimedia, encuestas de grupo, contenido multimedia de grupo y forma de las respuestas son comprobaciones
del contrato de transporte/API; no se consideran una demostración de que una instrucción de usuario hizo que el
agente eligiera la misma acción. La demostración de acciones en el recorrido del usuario procede de escenarios
como `whatsapp-agent-message-action-react` y
`whatsapp-group-agent-message-action-react`, en los que el controlador envía un mensaje normal
de WhatsApp y QA Lab observa el artefacto nativo de WhatsApp resultante.
Los informes de WhatsApp incluyen el enfoque de cada escenario (`user-path`,
`direct-gateway` o `native-approval`) para que la evidencia no se confunda con un
contrato más sólido de lo que realmente demuestra.

Artefactos de salida:

- `whatsapp-qa-report.md`
- `qa-evidence.json` - entradas de evidencia de las comprobaciones del transporte activo.
- `whatsapp-qa-observed-messages.json` - cuerpos censurados a menos que
  `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Grupo de credenciales de Convex

Las vías de Discord, Slack, Telegram y WhatsApp pueden obtener credenciales mediante arrendamiento de un
grupo compartido de Convex en lugar de leer las variables de entorno anteriores. Pase
`--credential-source convex` (o establezca `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`);
QA Lab adquiere un arrendamiento exclusivo, envía Heartbeat durante toda la
ejecución y lo libera al cerrarse. Los tipos del grupo son `"discord"`, `"slack"`,
`"telegram"` y `"whatsapp"`.

Formas de carga útil que el intermediario valida en `admin/add`:

- Discord (`kind: "discord"`): `{ guildId: string, channelId: string,
driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string,
sutToken: string }` - `groupId` debe ser una cadena numérica de id de chat.
- Usuario real de Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken:
string, testerUserId: string, testerUsername: string, telegramApiId:
string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string,
tdlibArchiveBase64: string, tdlibArchiveSha256: string,
desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` -
  solo para demostraciones de Mantis con Telegram Desktop. Las vías genéricas de QA Lab no deben adquirir
  este tipo.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164:
string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string,
groupJid?: string }` - los números de teléfono deben ser cadenas E.164 distintas.

El flujo de trabajo de demostración de Mantis con Telegram Desktop mantiene un único arrendamiento exclusivo de Convex
`telegram-user` tanto para el controlador CLI de TDLib como para el testigo de Telegram Desktop
y después lo libera tras publicar la demostración.

Cuando una PR necesita una diferencia visual determinista, Mantis puede usar la misma respuesta
del modelo simulado en `main` y en la cabecera de la PR mientras cambia el formateador
o la capa de entrega de Telegram. Los valores predeterminados de captura están ajustados para los comentarios de PR: clase
Crabbox estándar, grabación de escritorio a 24fps, GIF de movimiento a 24fps y ancho de vista previa
de 1920px. Los comentarios de antes/después deben publicar un paquete limpio que contenga
solo los GIF previstos.

Las vías de Slack también pueden usar el grupo. Actualmente, las comprobaciones de la forma de la carga útil de Slack residen
en el ejecutor de control de calidad de Slack y no en el intermediario; use `{ channelId: string,
driverBotToken: string, sutBotToken: string, sutAppToken: string }`, con un
id de canal de Slack como `Cxxxxxxxxxx`. Consulte
[Configuración del espacio de trabajo de Slack](#setting-up-the-slack-workspace) para el aprovisionamiento
de la aplicación y los ámbitos.

Las variables de entorno operativas y el contrato del punto de conexión del intermediario de Convex se encuentran en
[Pruebas → Credenciales compartidas de Telegram mediante Convex](/es/help/testing#shared-telegram-credentials-via-convex-v1)
(el nombre de la sección es anterior al grupo multicanal; la semántica del arrendamiento es
compartida entre los tipos).

## Datos iniciales respaldados por el repositorio

Los recursos de datos iniciales se encuentran en `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Estos se incluyen intencionadamente en git para que el plan de control de calidad sea visible tanto para las personas como para
el agente.

`qa-lab` sigue siendo un ejecutor genérico de escenarios YAML. Cada archivo YAML de escenario es la
fuente de verdad de una ejecución de prueba y debe definir:

- `title` de nivel superior
- metadatos `scenario`
- metadatos opcionales de categoría, capacidad, vía y riesgo en `scenario`
- referencias de documentación y código en `scenario`
- requisitos opcionales de plugins en `scenario`
- parche opcional de configuración del Gateway en `scenario`
- `flow` ejecutable de nivel superior para escenarios de flujo, o
  `scenario.execution.kind` / `scenario.execution.path` para escenarios de Vitest y
  Playwright

La superficie reutilizable del entorno de ejecución que sustenta `flow` sigue siendo genérica y
transversal. Por ejemplo, los escenarios YAML pueden combinar auxiliares del lado
del transporte con auxiliares del lado del navegador que controlan la interfaz de control integrada mediante
la unión `browser.request` del Gateway, sin añadir un ejecutor para un caso especial.

Los archivos de escenarios deben agruparse por capacidad del producto en lugar de por carpeta
del árbol de fuentes. Mantenga estables los id de escenario cuando se muevan los archivos; use `docsRefs` y
`codeRefs` para la trazabilidad de la implementación.

La lista de línea base debe ser lo bastante amplia como para abarcar:

- MD y chat de canal
- comportamiento de los hilos
- ciclo de vida de las acciones de mensajes
- devoluciones de llamada de Cron
- recuperación de memoria
- cambio de modelo
- transferencia a subagentes
- lectura del repositorio y de la documentación
- una pequeña tarea de compilación, como Lobster Invaders

## Vías de simulación de proveedores

`qa suite` tiene dos vías locales de simulación de proveedores:

- `mock-openai` es la simulación de OpenClaw consciente del escenario. Sigue siendo la vía
  de simulación determinista predeterminada para el control de calidad respaldado por el repositorio y las comprobaciones de paridad.
- `aimock` inicia un servidor de proveedor basado en AIMock para la cobertura experimental
  de protocolos, datos de prueba, grabación/reproducción y caos. Es una adición y
  no sustituye al despachador de escenarios `mock-openai`.

La implementación de las vías de proveedores se encuentra en `extensions/qa-lab/src/providers/`.
Cada proveedor posee sus valores predeterminados, el inicio de su servidor local, la configuración del modelo
del Gateway, las necesidades de preparación del perfil de autenticación y los indicadores de capacidad activa/simulada. El código compartido
del conjunto y del Gateway pasa por el registro de proveedores en lugar de bifurcarse según
los nombres de los proveedores.

## Adaptadores de transporte

`qa-lab` posee una unión de transporte genérica para los escenarios de control de calidad YAML. `qa-channel` es
el valor predeterminado sintético. `crabline` inicia servidores locales con forma de proveedor y
ejecuta los plugins de canal normales de OpenClaw con ellos. `live` está reservado para
credenciales reales de proveedores y canales externos.

En el ámbito de la arquitectura, la división es:

- `qa-lab` posee la ejecución genérica de escenarios, la concurrencia de trabajadores, la escritura
  de artefactos y la generación de informes.
- El adaptador de transporte posee la configuración del Gateway, la disponibilidad, la observación
  de entradas y salidas, las acciones de transporte y el estado normalizado del transporte.
- Los archivos de escenarios YAML de `qa/scenarios/` definen la ejecución de prueba; `qa-lab`
  proporciona la superficie reutilizable del entorno de ejecución que los ejecuta.

### Adición de un canal

Añadir un canal al sistema de control de calidad YAML requiere la implementación del canal
más un paquete de escenarios que pruebe el contrato del canal. Para la cobertura de pruebas de humo de CI,
añada el servidor local de proveedor Crabline correspondiente y expóngalo
mediante el controlador `crabline`.

No añada una nueva raíz de comandos de control de calidad de nivel superior cuando el host compartido `qa-lab` pueda
gestionar el flujo.

`qa-lab` posee los mecanismos compartidos del host:

- la raíz del comando `openclaw qa`
- inicio y cierre del conjunto
- concurrencia de trabajadores
- escritura de artefactos
- generación de informes
- ejecución de escenarios
- alias de compatibilidad para escenarios `qa-channel` anteriores

Los plugins del ejecutor poseen el contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura el Gateway para ese transporte
- cómo se comprueba la disponibilidad
- cómo se inyectan los eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado normalizado del transporte
- cómo se ejecutan las acciones respaldadas por el transporte
- cómo se gestiona el restablecimiento o la limpieza específicos del transporte

El umbral mínimo de adopción para un canal nuevo:

1. Mantén `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementa el ejecutor de transporte en el punto de integración compartido del host `qa-lab`.
3. Mantén los mecanismos específicos del transporte dentro del plugin del ejecutor o del arnés
   del canal.
4. Monta el ejecutor como `openclaw qa <runner>` en lugar de registrar un
   comando raíz que compita. Los plugins de ejecutores deben declarar `qaRunners` en
   `openclaw.plugin.json` y exportar un array `qaRunnerCliRegistrations`
   correspondiente desde `runtime-api.ts`. Mantén `runtime-api.ts` ligero; la CLI diferida y
   la ejecución del ejecutor deben permanecer detrás de puntos de entrada separados. Un
   `adapterFactory` opcional expone el transporte a escenarios compartidos sin cambiar
   el catálogo de escenarios existente del comando.
5. Crea o adapta escenarios YAML en los directorios temáticos `qa/scenarios/`.
6. Usa los auxiliares de escenarios genéricos para los escenarios nuevos.
7. Mantén operativos los alias de compatibilidad existentes, salvo que el repositorio esté realizando una
   migración intencionada.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una sola vez en `qa-lab`, colócalo en `qa-lab`.
- Si el comportamiento depende del transporte de un canal, mantenlo en el plugin de ese ejecutor
  o en el arnés del plugin.
- Si un escenario necesita una capacidad nueva que pueda utilizar más de un canal,
  añade un auxiliar genérico en lugar de una rama específica del canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario
  específico del transporte e indícalo explícitamente en el contrato del escenario.

### Nombres de los auxiliares de escenarios

Auxiliares genéricos preferidos para escenarios nuevos:

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

Los alias de compatibilidad siguen disponibles para los escenarios existentes:
`waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`,
`formatConversationTranscript`, `resetBus`, pero los escenarios nuevos
deben usar los nombres genéricos. Los alias existen para evitar una
migración simultánea de todo el sistema, no como modelo futuro.

## Informes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la cronología observada del bus.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué permaneció bloqueado
- Qué escenarios de seguimiento conviene añadir

Para obtener el inventario de escenarios disponibles, útil al dimensionar el trabajo de seguimiento
o conectar un transporte nuevo, ejecuta `pnpm openclaw qa coverage` (añade `--json`
para obtener una salida legible por máquinas). Al elegir una prueba específica para un
comportamiento o una ruta de archivo modificados, ejecuta `pnpm openclaw qa coverage --match <query>`. El
informe de coincidencias busca en los metadatos de escenarios, referencias de documentación, referencias de código, identificadores de cobertura,
plugins y requisitos de proveedores, y después muestra los objetivos `qa suite
--scenario ...` coincidentes.

Cada ejecución de `qa suite` escribe los artefactos de nivel superior `qa-evidence.json`,
`qa-suite-summary.json` y `qa-suite-report.md` para el conjunto de
escenarios seleccionado. Los escenarios que declaran `execution.kind: vitest` o
`execution.kind: playwright` ejecutan la ruta de prueba correspondiente y también escriben
registros por escenario. Los escenarios que declaran `execution.kind: script` ejecutan el
productor de evidencias en `execution.path` mediante `node --import tsx` (con
`${outputDir}` y `${scenarioId}` expandidos en `execution.args`); el
productor escribe su propio `qa-evidence.json`, cuyas entradas se importan en
la salida de la suite y cuyas rutas de artefactos se resuelven con respecto a ese
`qa-evidence.json` del productor. Cuando se llega a `qa suite` mediante `qa run
--qa-profile`, el mismo `qa-evidence.json` también incluye el resumen de la
tabla de puntuación del perfil para las categorías taxonómicas seleccionadas.

Considera la salida de cobertura como una ayuda para el descubrimiento, no como un sustituto de las puertas de validación; el
escenario seleccionado aún necesita el modo de proveedor, transporte activo,
Multipass, Testbox o flujo de lanzamiento adecuados para el comportamiento sometido a prueba. Para
conocer el contexto de la tabla de puntuación, consulta [Tabla de puntuación de madurez](/es/maturity/scorecard).

Para las comprobaciones de carácter y estilo, ejecuta el mismo escenario con varias
referencias de modelos activos y genera un informe Markdown evaluado:

```bash
pnpm openclaw qa character-eval \
  --model openai/gpt-5.6-luna,thinking=medium,fast \
  --model openai/gpt-5.2,thinking=xhigh \
  --model openai/gpt-5,thinking=xhigh \
  --model anthropic/claude-opus-4-8,thinking=high \
  --model anthropic/claude-sonnet-4-6,thinking=high \
  --model zai/glm-5.1,thinking=high \
  --model moonshot/kimi-k2.5,thinking=high \
  --model google/gemini-3.1-pro-preview,thinking=high \
  --judge-model openai/gpt-5.6-sol,thinking=xhigh,fast \
  --judge-model anthropic/claude-opus-4-8,thinking=high \
  --blind-judge-models \
  --concurrency 16 \
  --judge-concurrency 16
```

El comando ejecuta procesos secundarios locales del Gateway de control de calidad, no Docker. Los escenarios de
evaluación de carácter deben establecer la personalidad mediante `SOUL.md` y después ejecutar turnos
ordinarios del usuario, como conversaciones, ayuda con el espacio de trabajo y pequeñas tareas con archivos. No se
debe informar al modelo candidato de que está siendo evaluado. El comando conserva
cada transcripción completa, registra estadísticas básicas de ejecución y después pide a los modelos evaluadores, en
modo rápido y con razonamiento `xhigh` cuando sea compatible, que clasifiquen las ejecuciones por
naturalidad, estilo y humor. Usa `--blind-judge-models` al comparar
proveedores: la solicitud del evaluador sigue recibiendo todas las transcripciones y estados de ejecución, pero
las referencias de los candidatos se sustituyen por etiquetas neutras como `candidate-01`; tras el
análisis, el informe vuelve a asociar las clasificaciones con las referencias reales.

Las ejecuciones de candidatos usan de forma predeterminada el razonamiento `high`, con `medium` para GPT-5.6 Luna y
`xhigh` para referencias de evaluación de OpenAI más antiguas que lo admitan. Sobrescribe un
candidato específico en línea con `--model provider/model,thinking=<level>`; las
opciones en línea también admiten `fast`, `no-fast` y `fast=<bool>`. `--thinking
<level>` sigue estableciendo un valor alternativo global y la forma anterior `--model-thinking
<provider/model=level>` se conserva por compatibilidad. Las referencias de candidatos de OpenAI
usan de forma predeterminada el modo rápido para utilizar el procesamiento prioritario cuando el proveedor
lo admite. Pasa `--fast` solo cuando quieras forzar la activación del modo rápido para
todos los modelos candidatos. Las duraciones de los candidatos y los evaluadores se registran en el
informe para el análisis comparativo, pero las solicitudes a los evaluadores indican explícitamente que no deben clasificar
por velocidad. Las ejecuciones de modelos candidatos y evaluadores usan de forma predeterminada una concurrencia de 16.
Reduce `--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión sobre el
Gateway local generen demasiado ruido en una ejecución.

Cuando no se pasa ningún `--model` candidato, la evaluación de carácter utiliza de forma predeterminada
`openai/gpt-5.6-luna`, `openai/gpt-5.2`, `openai/gpt-5`,
`anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y `google/gemini-3.1-pro-preview`. Cuando no se
pasa ningún `--judge-model`, los evaluadores predeterminados son
`openai/gpt-5.6-sol,thinking=xhigh,fast` y
`anthropic/claude-opus-4-8,thinking=high`.

## Documentación relacionada

- [Control de calidad de Matrix](/es/concepts/qa-matrix)
- [Tabla de puntuación de madurez](/es/maturity/scorecard)
- [Paquete de pruebas comparativas para agentes personales](/es/concepts/personal-agent-benchmark-pack)
- [Canal de control de calidad](/es/channels/qa-channel)
- [Pruebas](/es/help/testing)
- [Panel](/es/web/dashboard)
