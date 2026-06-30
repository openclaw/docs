---
read_when:
    - Entender cómo se integra la pila de QA
    - Extender qa-lab, qa-channel o un adaptador de transporte
    - Agregar escenarios de QA respaldados por el repositorio
    - Creación de automatización de QA de mayor realismo en torno al panel del Gateway
summary: 'Resumen de la pila de QA: qa-lab, qa-channel, escenarios respaldados por repositorio, carriles de transporte en vivo, adaptadores de transporte e informes.'
title: Resumen de QA
x-i18n:
    generated_at: "2026-06-30T13:47:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bffd191f985255f5c830d4e3d1c4ffa250097848195bc58d74104474448e3e1
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pila privada de QA está pensada para ejercitar OpenClaw de una forma más realista,
con forma de canal, de lo que puede lograr una sola prueba unitaria.

Piezas actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de DM, canal, hilo,
  reacción, edición y eliminación.
- `extensions/qa-lab`: UI de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe en Markdown.
- `extensions/qa-matrix`, plugins ejecutores futuros: adaptadores de transporte en vivo que
  controlan un canal real dentro de un Gateway de QA hijo.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea de inicio y los escenarios
  base de QA.
- [Mantis](/es/concepts/mantis): verificación en vivo antes y después para errores que
  necesitan transportes reales, capturas del navegador, estado de VM y evidencia de PR.

## Superficie de comandos

Cada flujo de QA se ejecuta bajo `pnpm openclaw qa <subcommand>`. Muchos tienen alias de script `pnpm qa:*`;
ambas formas son compatibles.

| Comando                                             | Propósito                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autocomprobación de QA incluida sin `--qa-profile`; ejecutor de perfiles de madurez respaldados por taxonomía con `--qa-profile smoke-ci`, `--qa-profile release` o `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Ejecuta escenarios respaldados por el repositorio contra la vía del Gateway de QA. Alias: `pnpm openclaw qa suite --runner multipass` para una VM Linux desechable.                                                                                                                                  |
| `qa coverage`                                       | Imprime el inventario de cobertura de escenarios YAML (`--json` para salida de máquina).                                                                                                                                                                                               |
| `qa parity-report`                                  | Compara dos archivos `qa-suite-summary.json` y escribe el informe de paridad agéntica, o usa `--runtime-axis --token-efficiency` para escribir informes de paridad de runtime y eficiencia de tokens entre Codex y OpenClaw desde un resumen de par de runtimes.                                         |
| `qa character-eval`                                 | Ejecuta el escenario de QA de personaje en varios modelos en vivo con un informe evaluado. Consulta [Informes](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Ejecuta un prompt puntual contra la vía del proveedor/modelo seleccionado.                                                                                                                                                                                                          |
| `qa ui`                                             | Inicia la UI de depuración de QA y el bus de QA local (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Construye la imagen Docker de QA prehorneada.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Escribe una plantilla docker-compose para el panel de QA + la vía del Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Construye el sitio de QA, inicia la pila respaldada por Docker e imprime la URL (alias: `pnpm qa:lab:up`; la variante `:fast` añade `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Inicia solo el servidor del proveedor AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Inicia solo el servidor del proveedor `mock-openai` con conocimiento de escenarios.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestiona el grupo compartido de credenciales de Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Vía de transporte en vivo contra un servidor doméstico Tuwunel desechable. Consulta [QA de Matrix](/es/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Vía de transporte en vivo contra un grupo privado real de Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Vía de transporte en vivo contra un canal real de un servidor privado de Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | Vía de transporte en vivo contra un canal privado real de Slack.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Vía de transporte en vivo contra cuentas reales de WhatsApp Web.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Ejecutor de verificación antes y después para errores de transporte en vivo, con evidencia de reacciones de estado de Discord, smoke de escritorio/navegador de Crabbox y smoke de Slack en VNC. Consulta [Mantis](/es/concepts/mantis) y [Manual operativo de Mantis Slack Desktop](/es/concepts/mantis-slack-desktop-runbook). |

`qa run` respaldado por perfiles lee la pertenencia desde `taxonomy.yaml` y luego despacha
los escenarios resueltos a través de `qa suite`. `--surface` y
`--category` filtran el perfil seleccionado en lugar de definir vías separadas.
El `qa-evidence.json` resultante incluye un resumen de cuadro de mando del perfil con
recuentos de categorías seleccionadas e IDs de cobertura faltantes; las entradas de evidencia
individuales siguen siendo la fuente de verdad para las pruebas, los roles de cobertura y los resultados.
Los IDs de cobertura de características de la taxonomía son objetivos de prueba exactos, no alias. La cobertura
de escenario primaria satisface los IDs coincidentes; la cobertura secundaria sigue siendo orientativa.
Los IDs de cobertura usan la forma punteada `namespace.behavior` con segmentos en minúsculas
alfanuméricos/con guiones; los IDs de perfil, superficie y categoría aún pueden usar
los IDs de taxonomía existentes con guiones o puntos.
La evidencia reducida omite `execution` por entrada y establece `evidenceMode: "slim"`;
`smoke-ci` usa el modo reducido por defecto, y `--evidence-mode full` restaura las entradas completas:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Usa `smoke-ci` para pruebas deterministas de perfil con proveedores de modelo simulados y
servidores de proveedor local Crabline. Usa `release` para pruebas Stable/LTS contra canales
en vivo. Usa `all` solo para ejecuciones explícitas de evidencia de taxonomía completa; selecciona
cada categoría de madurez activa y puede despacharse mediante el workflow `QA Profile
Evidence` con `qa_profile=all`. Cuando un comando también necesita un perfil raíz de OpenClaw,
coloca el perfil raíz antes del comando de QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Flujo del operador

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel del Gateway (Control UI) con el agente.
- Derecha: QA Lab, que muestra la transcripción estilo Slack y el plan de escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso construye el sitio de QA, inicia la vía del Gateway respaldada por Docker y expone la
página de QA Lab donde un operador o bucle de automatización puede darle al agente una
misión de QA, observar el comportamiento real del canal y registrar qué funcionó, falló o
permaneció bloqueado.

Para iterar más rápido sobre la UI de QA Lab sin reconstruir la imagen Docker cada vez,
inicia la pila con un paquete de QA Lab montado por bind:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios Docker sobre una imagen preconstruida y monta por bind
`extensions/qa-lab/web/dist` en el contenedor `qa-lab`. `qa:lab:watch`
reconstruye ese paquete al cambiar, y el navegador se recarga automáticamente cuando cambia el hash
de recursos de QA Lab.

Para una prueba smoke de señal local de OpenTelemetry, ejecuta:

```bash
pnpm qa:otel:smoke
```

Ese script inicia un receptor OTLP/HTTP local, ejecuta el escenario de QA `otel-trace-smoke`
con el plugin `diagnostics-otel` habilitado, y luego comprueba que se exporten trazas,
métricas y registros. Decodifica los spans de traza protobuf exportados
y comprueba la forma crítica para la release:
`openclaw.run`, `openclaw.harness.run`, un span de llamada de modelo de la convención semántica
GenAI más reciente, `openclaw.context.assembled` y `openclaw.message.delivery`
deben estar presentes. La prueba smoke fuerza
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, por lo que el span de llamada de modelo
debe usar el nombre `{gen_ai.operation.name} {gen_ai.request.model}`;
las llamadas de modelo no deben exportar `StreamAbandoned` en turnos exitosos; los IDs diagnósticos sin procesar y
los atributos `openclaw.content.*` deben permanecer fuera de la traza. Los payloads OTLP sin procesar
no deben contener el centinela de prompt, el centinela de respuesta ni la clave de sesión de QA.
Escribe `otel-smoke-summary.json` junto a los artefactos de la suite de QA.

Para una prueba smoke de OpenTelemetry respaldada por un collector, ejecuta:

```bash
pnpm qa:otel:collector-smoke
```

Esa vía coloca un contenedor Docker real de OpenTelemetry Collector delante del
mismo receptor local. Úsala al cambiar el cableado de endpoints, la compatibilidad con collector
o el comportamiento de exportación OTLP que el receptor en proceso podría ocultar.

Para la prueba smoke protegida de scraping de Prometheus, ejecuta:

```bash
pnpm qa:prometheus:smoke
```

Ese alias ejecuta el escenario de QA `docker-prometheus-smoke` con
`diagnostics-prometheus` habilitado, verifica que los scrapes no autenticados se
rechacen y luego comprueba que el scrape autenticado incluya familias de métricas
críticas para la versión sin contenido de prompts, contenido de respuestas,
identificadores de diagnóstico sin procesar, tokens de autenticación ni rutas
locales.

Para ejecutar ambas pruebas smoke de observabilidad de forma consecutiva, usa:

```bash
pnpm qa:observability:smoke
```

Para la ruta de OpenTelemetry respaldada por collector junto con la prueba smoke
de scrape protegido de Prometheus, usa:

```bash
pnpm qa:observability:collector-smoke
```

La QA de observabilidad sigue estando disponible solo desde un checkout del
código fuente. El tarball de npm omite QA Lab intencionalmente, por lo que las
rutas de lanzamiento Docker del paquete no ejecutan comandos `qa`. Usa
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` o
`pnpm qa:observability:smoke` desde un checkout del código fuente compilado al
cambiar la instrumentación de diagnósticos.

Para una ruta smoke de Matrix con transporte real que no requiera credenciales de
proveedor de modelos, ejecuta el perfil rápido con el proveedor OpenAI simulado y
determinista:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Para la ruta con proveedor live-frontier, proporciona credenciales compatibles
con OpenAI explícitamente:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

La referencia completa de la CLI, el catálogo de perfiles/escenarios, las variables de entorno y la disposición de artefactos de esta ruta están en [QA de Matrix](/es/concepts/qa-matrix). En resumen: aprovisiona un homeserver Tuwunel desechable en Docker, registra usuarios temporales de controlador/SUT/observador, ejecuta el Plugin real de Matrix dentro de un gateway de QA hijo limitado a ese transporte (sin `qa-channel`) y luego escribe un informe Markdown, un resumen JSON, un artefacto de eventos observados y un registro de salida combinado en `.artifacts/qa-e2e/matrix-<timestamp>/`.

Los escenarios cubren comportamientos de transporte que las pruebas unitarias no pueden demostrar de extremo a extremo: control por menciones, políticas allow-bot, allowlists, respuestas de nivel superior y en hilos, enrutamiento de DM, manejo de reacciones, supresión de ediciones entrantes, deduplicación de reproducción tras reinicio, recuperación ante interrupciones del homeserver, entrega de metadatos de aprobación, manejo de medios y flujos de arranque/recuperación/verificación de E2EE de Matrix. El perfil de CLI de E2EE también ejecuta `openclaw matrix encryption setup` y comandos de verificación mediante el mismo homeserver desechable antes de comprobar las respuestas del gateway.

Discord también tiene escenarios opcionales solo de Mantis para reproducción de bugs. Usa
`--scenario discord-status-reactions-tool-only` para la línea de tiempo explícita
de reacciones de estado, o `--scenario discord-thread-reply-filepath-attachment`
para crear un hilo real de Discord y verificar que `message.thread-reply`
conserva un adjunto `filePath`. Estos escenarios permanecen fuera de la ruta
predeterminada de Discord en vivo porque son sondas de reproducción antes/después
en lugar de cobertura smoke amplia. El flujo de trabajo de Mantis para adjuntos
en hilos también puede añadir un video testigo de Discord Web con sesión iniciada
cuando `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` o
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` está configurado en el entorno de
QA. Ese perfil de visor solo se usa para captura visual; la decisión de
aprobación/fallo sigue viniendo del oráculo REST de Discord.

CI usa la misma superficie de comandos en `.github/workflows/qa-live-transports-convex.yml`.
Las ejecuciones programadas y manuales predeterminadas ejecutan el perfil rápido
de Matrix con credenciales live-frontier proporcionadas por QA, `--fast` y
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. El modo manual `matrix_profile=all`
se distribuye entre los cinco shards de perfil.

Para rutas smoke con transporte real de Telegram, Discord, Slack y WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Apuntan a un canal real preexistente con dos bots o cuentas (controlador + SUT). Las variables de entorno requeridas, listas de escenarios, artefactos de salida y el pool de credenciales de Convex están documentados en la [referencia de QA de Telegram, Discord, Slack y WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) más abajo.

Para una ejecución completa de VM de escritorio de Slack con rescate por VNC, ejecuta:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ese comando arrienda una máquina de escritorio/navegador de Crabbox, ejecuta el carril en vivo de Slack
dentro de la VM, abre Slack Web en el navegador VNC, captura el escritorio y
copia `slack-qa/`, `slack-desktop-smoke.png` y `slack-desktop-smoke.mp4`
cuando la captura de video está disponible de vuelta al directorio de artefactos de Mantis. Los arriendos de
escritorio/navegador de Crabbox proporcionan por adelantado las herramientas de captura y los paquetes auxiliares
de navegador/compilación nativa, por lo que el escenario solo debería instalar alternativas en arriendos
más antiguos. Mantis informa los tiempos totales y por fase en
`mantis-slack-desktop-smoke-report.md` para que las ejecuciones lentas muestren si el tiempo se invirtió en
el calentamiento del arriendo, la adquisición de credenciales, la configuración remota o la copia de artefactos. Reutiliza
`--lease-id <cbx_...>` después de iniciar sesión en Slack Web manualmente mediante VNC;
los arriendos reutilizados también mantienen caliente la caché de pnpm store de Crabbox. El valor predeterminado
`--hydrate-mode source` verifica desde un checkout de origen y ejecuta la instalación/compilación
dentro de la VM. Usa `--hydrate-mode prehydrated` solo cuando el workspace remoto reutilizado
ya tenga `node_modules` y un `dist/` compilado; ese modo omite el
costoso paso de instalación/compilación y falla de forma cerrada cuando el workspace no está listo.
Con `--gateway-setup`, Mantis deja un Gateway persistente de Slack de OpenClaw
ejecutándose dentro de la VM en el puerto `38973`; sin él, el comando ejecuta el carril normal
de QA de Slack de bot a bot y sale después de capturar artefactos.

Para demostrar la interfaz de aprobación nativa de Slack con evidencia de escritorio, ejecuta el modo de
puntos de control de aprobación de Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Este modo es mutuamente excluyente con `--gateway-setup`. Ejecuta los escenarios de
aprobación de Slack, rechaza ids de escenario que no sean de aprobación, espera en cada estado de aprobación
pendiente y resuelto, renderiza el mensaje observado de la API de Slack en
`approval-checkpoints/<scenario>-pending.png` y
`approval-checkpoints/<scenario>-resolved.png`, y luego falla si falta algún punto de control,
evidencia de mensaje, acuse de recibo o captura renderizada, o si están vacíos.
Los arriendos fríos de CI aún pueden mostrar el inicio de sesión de Slack en `slack-desktop-smoke.png`; las
imágenes de puntos de control de aprobación son la prueba visual para este carril.

La lista de verificación del operador, el comando de despacho del workflow de GitHub, el contrato de
comentario de evidencia, la tabla de decisión de hydrate-mode, la interpretación de tiempos y los pasos de
gestión de fallos están en [Runbook de escritorio de Mantis Slack](/es/concepts/mantis-slack-desktop-runbook).

Para una tarea de escritorio estilo agente/CV, ejecuta:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` arrienda o reutiliza una máquina de escritorio/navegador de Crabbox, inicia
`crabbox record --while`, controla el navegador visible mediante un
`visual-driver` anidado, captura `visual-task.png`, ejecuta `openclaw infer image describe`
sobre la captura cuando se selecciona `--vision-mode image-describe`, y
escribe `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` y `mantis-visual-task-report.md`.
Cuando se establece `--expect-text`, el prompt de visión solicita un veredicto JSON
estructurado y solo pasa cuando el modelo informa evidencia visible positiva; una
respuesta negativa que solo cite el texto objetivo falla la aserción.
Usa `--vision-mode metadata` para un smoke sin modelo que demuestre el escritorio,
el navegador, la captura de pantalla y la canalización de video sin llamar a un proveedor
de comprensión de imágenes. La grabación es un artefacto obligatorio para `visual-task`; si Crabbox no graba
un `visual-task.mp4` no vacío, la tarea falla incluso cuando el controlador visual
haya pasado. En caso de fallo, Mantis conserva el arriendo para VNC salvo que la tarea ya
haya pasado y `--keep-lease` no se haya establecido.

Antes de usar credenciales en vivo agrupadas, ejecuta:

```bash
pnpm openclaw qa credentials doctor
```

El doctor comprueba el entorno del broker de Convex, valida la configuración de endpoints y verifica la accesibilidad de admin/list cuando el secreto de mantenedor está presente. Informa solo el estado establecido/faltante de los secretos.

## Cobertura de transportes en vivo

Los carriles de transporte en vivo comparten un único contrato en lugar de que cada uno invente su propia forma de lista de escenarios. `qa-channel` es la suite sintética amplia de comportamiento del producto y no forma parte de la matriz de cobertura de transportes en vivo.

Los runners de transporte en vivo deberían importar los ids de escenario compartidos, los helpers de cobertura
base y el helper de selección de escenarios desde
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Carril   | Canary | Control por mención | Bot a bot | Bloqueo por lista permitida | Respuesta de nivel superior | Respuesta con cita | Reanudación tras reinicio | Seguimiento en hilo | Aislamiento de hilo | Observación de reacciones | Comando de ayuda | Registro de comandos nativos |
| -------- | ------ | ------------------- | --------- | --------------------------- | --------------------------- | ------------------ | ------------------------- | ------------------- | ------------------- | -------------------------- | ---------------- | ----------------------------- |
| Matrix   | x      | x                   | x         | x                           | x                           |                    | x                         | x                   | x                   | x                          |                  |                               |
| Telegram | x      | x                   | x         |                             |                             |                    |                           |                     |                     |                            | x                |                               |
| Discord  | x      | x                   | x         |                             |                             |                    |                           |                     |                     |                            |                  | x                             |
| Slack    | x      | x                   | x         | x                           | x                           |                    | x                         | x                   | x                   |                            |                  |                               |
| WhatsApp | x      | x                   |           | x                           | x                           | x                  | x                         |                     |                     | x                          | x                |                               |

Esto mantiene `qa-channel` como la suite amplia de comportamiento del producto, mientras Matrix,
Telegram y otros transportes en vivo comparten una lista de verificación explícita del contrato de transporte.

Para un carril de VM Linux desechable sin introducir Docker en la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto arranca un guest nuevo de Multipass, instala dependencias, compila OpenClaw
dentro del guest, ejecuta `qa suite` y luego copia el informe y el
resumen normales de QA de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de suite en host y Multipass ejecutan varios escenarios seleccionados en paralelo
con workers de Gateway aislados de forma predeterminada. `qa-channel` usa por defecto una concurrencia
de 4, limitada por el recuento de escenarios seleccionados. Usa `--concurrency <count>` para ajustar
el número de workers, o `--concurrency 1` para la ejecución en serie.
Usa `--pack personal-agent` para ejecutar el paquete de benchmark de asistente personal. El
selector de paquete es aditivo con flags `--scenario` repetidas: los escenarios explícitos
se ejecutan primero, luego los escenarios del paquete se ejecutan en orden de paquete con los duplicados eliminados.
Usa `--pack observability` cuando un runner de QA personalizado ya proporciona la
configuración del colector de OpenTelemetry y quiere seleccionar juntos los escenarios smoke
de diagnósticos de OpenTelemetry y Prometheus.
El comando sale con estado distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida fallido.
Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles que son prácticas para el
guest: claves de proveedor basadas en entorno, la ruta de configuración del proveedor en vivo de QA y
`CODEX_HOME` cuando está presente. Mantén `--output-dir` bajo la raíz del repo para que el guest
pueda escribir de vuelta a través del workspace montado.

## Referencia de QA para Telegram, Discord, Slack y WhatsApp

Matrix tiene una [página dedicada](/es/concepts/qa-matrix) debido a su cantidad de escenarios y al aprovisionamiento de homeserver respaldado por Docker. Telegram, Discord, Slack y WhatsApp se ejecutan contra transportes reales preexistentes, por lo que su referencia vive aquí.

### Flags compartidos de la CLI

Estas vías se registran mediante `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` y aceptan los mismos flags:

| Flag                                  | Predeterminado                                    | Descripción                                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                 | Ejecuta solo este escenario. Repetible.                                                                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Donde se escriben los informes, resúmenes, evidencias, artefactos específicos del transporte y el log de salida. Las rutas relativas se resuelven contra `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                   | Raíz del repositorio al invocar desde un cwd neutral.                                                                                                          |
| `--sut-account <id>`                  | `sut`                                             | Id de cuenta temporal dentro de la configuración del Gateway de QA.                                                                                            |
| `--provider-mode <mode>`              | `live-frontier`                                   | `mock-openai` o `live-frontier` (`live-openai` heredado aún funciona).                                                                                         |
| `--model <ref>` / `--alt-model <ref>` | valor predeterminado del proveedor                | Referencias del modelo principal/alternativo.                                                                                                                  |
| `--fast`                              | desactivado                                       | Modo rápido del proveedor donde sea compatible.                                                                                                                |
| `--credential-source <env\|convex>`   | `env`                                             | Consulta [pool de credenciales de Convex](#convex-credential-pool).                                                                                            |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, `maintainer` en caso contrario        | Rol usado cuando `--credential-source convex`.                                                                                                                 |

Cada vía sale con código distinto de cero ante cualquier escenario fallido. `--allow-failures` escribe artefactos sin establecer un código de salida fallido.

### QA de Telegram

```bash
pnpm openclaw qa telegram
```

Apunta a un grupo privado real de Telegram con dos bots distintos (driver + SUT). El bot SUT debe tener un nombre de usuario de Telegram; la observación bot a bot funciona mejor cuando ambos bots tienen **Bot-to-Bot Communication Mode** habilitado en `@BotFather`.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_TELEGRAM_GROUP_ID` - id numérico del chat (cadena).
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
- `telegram-reply-chain-exact-marker`
- `telegram-stream-final-single-message`
- `telegram-long-final-reuses-preview`
- `telegram-long-final-three-chunks`

El conjunto predeterminado implícito siempre cubre canary, control por mención, respuestas a comandos nativos, direccionamiento de comandos y respuestas de grupo bot a bot. Los valores predeterminados de `mock-openai` también incluyen comprobaciones deterministas de cadena de respuestas y streaming del mensaje final. `telegram-current-session-status-tool` sigue siendo opt-in porque solo es estable cuando se encadena directamente después de canary, no después de respuestas arbitrarias a comandos nativos. Usa `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` para imprimir la división actual entre predeterminado/opcional con referencias de regresión.

Artefactos de salida:

- `telegram-qa-report.md`
- `qa-evidence.json` - entradas de evidencia para las comprobaciones del transporte en vivo, incluidos campos de perfil, cobertura, proveedor, canal, artefactos, resultado y RTT.

Las ejecuciones de paquete de Telegram usan el mismo contrato de credenciales de Telegram. La medición repetida de RTT forma parte de la vía normal en vivo de paquete de Telegram; la distribución de RTT se incorpora en `qa-evidence.json` bajo `result.timing` para la comprobación RTT seleccionada.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Cuando `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` está definido, el wrapper en vivo de paquete alquila una credencial `kind: "telegram"`, exporta el grupo/driver/bot SUT alquilados al entorno de la ejecución del paquete instalado, envía Heartbeats al alquiler y lo libera al apagarse. El wrapper de paquete usa de forma predeterminada 20 comprobaciones RTT de `telegram-mentioned-message-reply`, un timeout RTT de 30 s y rol de Convex `maintainer` fuera de CI cuando Convex está seleccionado. Sobrescribe `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` o `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar la medición RTT sin crear un comando RTT separado ni un formato de resumen específico de Telegram.

### QA de Discord

```bash
pnpm openclaw qa discord
```

Apunta a un canal privado real de guild de Discord con dos bots: un bot driver controlado por el arnés y un bot SUT iniciado por el Gateway hijo de OpenClaw mediante el Plugin de Discord incluido. Verifica el manejo de menciones de canal, que el bot SUT haya registrado el comando nativo `/help` con Discord y escenarios de evidencia Mantis opt-in.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - debe coincidir con el id de usuario del bot SUT devuelto por Discord (de lo contrario, la vía falla rápido).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` selecciona el canal de voz/escenario para `discord-voice-autojoin`; sin él, el escenario elige el primer canal de voz/escenario visible para el bot SUT.

Escenarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - escenario de voz opt-in. Se ejecuta por sí solo, habilita `channels.discord.voice.autoJoin` y verifica que el estado de voz actual del bot SUT en Discord sea el canal de voz/escenario objetivo. Las credenciales de Discord de Convex pueden incluir `voiceChannelId` opcional; de lo contrario, el ejecutor descubre el primer canal de voz/escenario visible en la guild.
- `discord-status-reactions-tool-only` - escenario Mantis opt-in. Se ejecuta por sí solo porque cambia el SUT a respuestas de guild siempre activas y solo con herramientas con `messages.statusReactions.enabled=true`, luego captura una línea de tiempo de reacciones REST más artefactos visuales HTML/PNG. Los informes antes/después de Mantis también conservan artefactos MP4 proporcionados por el escenario como `baseline.mp4` y `candidate.mp4`.

Ejecuta explícitamente el escenario de unión automática a voz de Discord:

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
- `qa-evidence.json` - entradas de evidencia para las comprobaciones del transporte en vivo.
- `discord-qa-observed-messages.json` - cuerpos redactados salvo que `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` y `discord-status-reactions-tool-only-timeline.png` cuando se ejecuta el escenario de reacciones de estado.

### QA de Slack

```bash
pnpm openclaw qa slack
```

Apunta a un canal privado real de Slack con dos bots distintos: un bot driver controlado por el arnés y un bot SUT iniciado por el Gateway hijo de OpenClaw mediante el Plugin de Slack incluido.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` habilita checkpoints visuales de aprobación para Mantis. El ejecutor escribe `<scenario>.pending.json` y `<scenario>.resolved.json`, y luego espera archivos `.ack.json` coincidentes.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` sobrescribe el timeout de acuse de recibo del checkpoint. El valor predeterminado es `120000`.

Escenarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - escenario opt-in de aprobación exec nativa de Slack.
  Solicita una aprobación exec mediante el Gateway, verifica que el mensaje de Slack tenga botones de aprobación nativos, la resuelve y verifica la actualización resuelta de Slack.
- `slack-approval-plugin-native` - escenario opt-in de aprobación nativa de Plugin en Slack.
  Habilita conjuntamente el reenvío de aprobación exec y de Plugin para que los eventos de Plugin no sean suprimidos por el enrutamiento de aprobación exec, y luego verifica la misma ruta de UI nativa de Slack pendiente/resuelta.

Artefactos de salida:

- `slack-qa-report.md`
- `qa-evidence.json` - entradas de evidencia para las comprobaciones del transporte en vivo.
- `slack-qa-observed-messages.json` - cuerpos redactados salvo que `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - solo cuando Mantis define `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; contiene JSON de checkpoint, JSON de acuse de recibo y capturas de pantalla pendientes/resueltas.

#### Configurar el espacio de trabajo de Slack

La vía necesita dos apps distintas de Slack en un espacio de trabajo, además de un canal del que ambos bots sean miembros:

- `channelId` - el id `Cxxxxxxxxxx` de un canal al que ambos bots hayan sido invitados. Usa un canal dedicado; la vía publica en cada ejecución.
- `driverBotToken` - token de bot (`xoxb-...`) de la app **Driver**.
- `sutBotToken` - token de bot (`xoxb-...`) de la app **SUT**, que debe ser una app de Slack separada del driver para que su id de usuario de bot sea distinto.
- `sutAppToken` - token de nivel de app (`xapp-...`) de la app SUT con `connections:write`, usado por Socket Mode para que la app SUT pueda recibir eventos.

Prefiere un espacio de trabajo de Slack dedicado a QA en lugar de reutilizar un espacio de trabajo de producción.

El manifiesto SUT siguiente estrecha intencionalmente la instalación de producción del Plugin de Slack incluido (`extensions/slack/src/setup-shared.ts:10`) a los permisos y eventos cubiertos por la suite QA en vivo de Slack. Para la configuración del canal de producción tal como la ven los usuarios, consulta [configuración rápida del canal de Slack](/es/channels/slack#quick-setup); el par Driver/SUT de QA está intencionalmente separado porque la vía necesita dos ids de usuario de bot distintos en un espacio de trabajo.

**1. Crea la app Driver**

Ve a [api.slack.com/apps](https://api.slack.com/apps) → _Crear nueva app_ → _Desde un manifiesto_ → elige el espacio de trabajo de QA, pega el siguiente manifiesto y luego _Instalar en el espacio de trabajo_:

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

Copia el _Bot User OAuth Token_ (`xoxb-...`): ese será `driverBotToken`. El controlador solo necesita publicar mensajes e identificarse; no necesita eventos ni Socket Mode.

**2. Crear la app SUT**

Repite _Crear nueva app → Desde un manifiesto_ en el mismo espacio de trabajo. Esta app de QA usa intencionalmente una versión más restringida del manifiesto de producción del Plugin de Slack incluido (`extensions/slack/src/setup-shared.ts:10`): los alcances y eventos de reacciones se omiten porque la suite de QA en vivo de Slack todavía no cubre el manejo de reacciones.

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

Después de que Slack cree la app, haz dos cosas en su página de configuración:

- _Instalar en el espacio de trabajo_ → copia el _Bot User OAuth Token_ → ese será `sutBotToken`.
- _Información básica → Tokens de nivel de app → Generar token y alcances_ → añade el alcance `connections:write` → guarda → copia el valor `xapp-...` → ese será `sutAppToken`.

Verifica que los dos bots tengan identificadores de usuario distintos llamando a `auth.test` en cada token. El runtime distingue el controlador y el SUT por identificador de usuario; reutilizar una app para ambos hará que el control de menciones falle de inmediato.

**3. Crear el canal**

En el espacio de trabajo de QA, crea un canal (por ejemplo, `#openclaw-qa`) e invita a ambos bots desde dentro del canal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia el identificador `Cxxxxxxxxxx` desde _información del canal → Acerca de → ID de canal_: ese será `channelId`. Un canal público funciona; si usas un canal privado, ambas apps ya tienen `groups:history`, por lo que las lecturas de historial del arnés seguirán funcionando.

**4. Registrar las credenciales**

Hay dos opciones. Usa variables de entorno para depurar en una sola máquina (configura las cuatro variables `OPENCLAW_QA_SLACK_*` y pasa `--credential-source env`), o siembra el grupo compartido de Convex para que CI y otros mantenedores puedan arrendarlas.

Para el grupo de Convex, escribe los cuatro campos en un archivo JSON:

```json
{
  "channelId": "Cxxxxxxxxxx",
  "driverBotToken": "xoxb-...",
  "sutBotToken": "xoxb-...",
  "sutAppToken": "xapp-..."
}
```

Con `OPENCLAW_QA_CONVEX_SITE_URL` y `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` exportadas en tu shell, registra y verifica:

```bash
pnpm openclaw qa credentials add \
  --kind slack \
  --payload-file slack-creds.json \
  --note "QA Slack pool seed"

pnpm openclaw qa credentials list --kind slack --status all --json
```

Espera `count: 1`, `status: "active"`, sin campo `lease`.

**5. Verificar de extremo a extremo**

Ejecuta el carril localmente para confirmar que ambos bots puedan hablar entre sí a través del intermediario:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Una ejecución correcta se completa en bastante menos de 30 segundos y `slack-qa-report.md` muestra tanto `slack-canary` como `slack-mention-gating` con estado `pass`. Si el carril se queda bloqueado durante ~90 segundos y sale con `Convex credential pool exhausted for kind "slack"`, el grupo está vacío o todas las filas están arrendadas: `qa credentials list --kind slack --status all --json` te dirá cuál de las dos cosas ocurre.

### QA de WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Apunta a dos cuentas dedicadas de WhatsApp Web: una cuenta de controlador administrada por
el arnés y una cuenta SUT iniciada por el Gateway secundario de OpenClaw mediante el
Plugin de WhatsApp incluido.

Entorno requerido cuando `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opcional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` habilita escenarios de grupo como
  `whatsapp-mention-gating` y `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en
  los artefactos de mensajes observados.

Catálogo de escenarios (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Base y control de grupos: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Comandos nativos: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportamiento de respuesta y salida final: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Medios entrantes y mensajes estructurados: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Estos envían eventos reales de imagen, audio,
  documento, ubicación, contacto y sticker de WhatsApp mediante el controlador.
- Cobertura de Gateway saliente y acciones de mensaje:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-message-actions`.
- Cobertura de control de acceso: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Aprobaciones nativas: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reacciones de estado: `whatsapp-status-reactions`.

El catálogo contiene actualmente 36 escenarios. El carril predeterminado `live-frontier` se
mantiene pequeño, con 10 escenarios, para una cobertura rápida de humo. El carril predeterminado
`mock-openai` ejecuta 31 escenarios deterministas a través del transporte real de WhatsApp mientras
simula solo la salida del modelo. Los escenarios de aprobación y algunas comprobaciones más pesadas o bloqueantes
siguen siendo explícitos por identificador de escenario.

El controlador de QA de WhatsApp observa eventos estructurados en vivo (`text`, `media`,
`location`, `reaction` y `poll`) y puede enviar activamente medios, encuestas,
contactos, ubicaciones y stickers. QA Lab importa ese controlador mediante la
superficie del paquete `@openclaw/whatsapp/api.js` en lugar de acceder a archivos privados del
runtime de WhatsApp. El contenido de los mensajes se redacta de forma predeterminada. La cobertura de
encuesta saliente y carga de archivo se ejecuta mediante llamadas deterministas de Gateway `poll` y
`message.action` en lugar de invocación de herramientas solo por prompt de modelo.

Artefactos de salida:

- `whatsapp-qa-report.md`
- `qa-evidence.json`: entradas de evidencia para las comprobaciones de transporte en vivo.
- `whatsapp-qa-observed-messages.json`: cuerpos redactados salvo que `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Grupo de credenciales de Convex

Los carriles de Telegram, Discord, Slack y WhatsApp pueden arrendar credenciales de un grupo compartido de Convex en lugar de leer las variables de entorno anteriores. Pasa `--credential-source convex` (o configura `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab adquiere un arrendamiento exclusivo, le envía Heartbeat durante la ejecución y lo libera al apagarse. Los tipos del grupo son `"telegram"`, `"discord"`, `"slack"` y `"whatsapp"`.

Formas de payload que el intermediario valida en `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }`: `groupId` debe ser una cadena de identificador de chat numérica.
- Usuario real de Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`: solo para prueba de Mantis Telegram Desktop. Los carriles genéricos de QA Lab no deben adquirir este tipo.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`: los números de teléfono deben ser cadenas E.164 distintas.

El flujo de trabajo de prueba de Mantis Telegram Desktop mantiene un arrendamiento exclusivo de Convex
`telegram-user` tanto para el controlador CLI de TDLib como para el testigo de Telegram Desktop,
y luego lo libera después de publicar la prueba.

Cuando un PR necesita una diferencia visual determinista, Mantis puede usar la misma respuesta simulada del modelo
en `main` y en la cabecera del PR mientras cambia el formateador de Telegram o la capa de entrega.
Los valores predeterminados de captura están ajustados para comentarios de PR: clase Crabbox
estándar, grabación de escritorio a 24 fps, GIF de movimiento a 24 fps y ancho de vista previa de 1920 px.
Los comentarios de antes/después deben publicar un paquete limpio que contenga solo los
GIF previstos.

Los carriles de Slack también pueden usar el grupo. Las comprobaciones de forma del payload de Slack viven actualmente en el ejecutor de QA de Slack en lugar del intermediario; usa `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, con un identificador de canal de Slack como `Cxxxxxxxxxx`. Consulta [Configurar el espacio de trabajo de Slack](#setting-up-the-slack-workspace) para el aprovisionamiento de apps y alcances.

Las variables de entorno operativas y el contrato del endpoint del intermediario de Convex viven en [Pruebas → Credenciales compartidas de Telegram mediante Convex](/es/help/testing#shared-telegram-credentials-via-convex-v1) (el nombre de la sección es anterior al grupo multicanal; la semántica de arrendamiento se comparte entre tipos).

## Semillas respaldadas por el repositorio

Los activos de semilla viven en `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Estos están intencionalmente en git para que el plan de QA sea visible tanto para humanos como para el
agente.

`qa-lab` debe seguir siendo un ejecutor genérico de escenarios YAML. Cada archivo YAML de escenario es
la fuente de verdad para una ejecución de prueba y debe definir:

- `title` de nivel superior
- metadatos `scenario`
- metadatos opcionales de categoría, capacidad, carril y riesgo en `scenario`
- referencias de documentación y código en `scenario`
- requisitos opcionales de Plugin en `scenario`
- parche opcional de configuración de Gateway en `scenario`
- `flow` ejecutable de nivel superior para escenarios de flujo, o `scenario.execution.kind` /
  `scenario.execution.path` para escenarios de Vitest y Playwright

La superficie de runtime reutilizable que respalda `flow` puede permanecer genérica
y transversal. Por ejemplo, los escenarios YAML pueden combinar helpers del lado del transporte
con helpers del lado del navegador que controlan la Control UI integrada a través de la
costura `browser.request` del Gateway sin añadir un runner de caso especial.

Los archivos de escenarios deben agruparse por capacidad del producto en lugar de por carpeta
del árbol de código fuente. Mantén estables los ID de escenario cuando los archivos se muevan; usa `docsRefs` y `codeRefs`
para la trazabilidad de la implementación.

La lista base debe mantenerse lo bastante amplia para cubrir:

- chat por DM y canal
- comportamiento de hilos
- ciclo de vida de acciones de mensaje
- callbacks de cron
- recuperación de memoria
- cambio de modelo
- transferencia a subagente
- lectura de repos y lectura de docs
- una tarea de compilación pequeña, como Lobster Invaders

## Carriles mock de proveedor

`qa suite` tiene dos carriles mock de proveedor locales:

- `mock-openai` es el mock de OpenClaw consciente del escenario. Sigue siendo el carril mock
  determinista predeterminado para QA respaldada por repo y compuertas de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo,
  fixtures, grabación/reproducción y caos. Es aditivo y no
  reemplaza el despachador de escenarios `mock-openai`.

La implementación de carriles de proveedor vive bajo `extensions/qa-lab/src/providers/`.
Cada proveedor posee sus valores predeterminados, el arranque del servidor local, la configuración de modelos del Gateway,
las necesidades de preparación de perfiles de autenticación y las flags de capacidad live/mock. El código compartido de suite y
gateway debe enrutar a través del registro de proveedores en lugar de ramificar por
nombres de proveedor.

## Adaptadores de transporte

`qa-lab` posee una costura de transporte genérica para escenarios QA YAML. `qa-channel` es
el valor predeterminado sintético. `crabline` inicia servidores locales con forma de proveedor y ejecuta
los plugins de canal normales de OpenClaw contra ellos. `live` se reserva para credenciales de proveedor reales
y canales externos.

A nivel de arquitectura, la división es:

- `qa-lab` posee la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y los reportes.
- El adaptador de transporte posee la configuración del gateway, la preparación, la observación entrante y saliente, las acciones de transporte y el estado de transporte normalizado.
- Los archivos de escenarios YAML bajo `qa/scenarios/` definen la ejecución de pruebas; `qa-lab` proporciona la superficie de runtime reutilizable que los ejecuta.

### Añadir un canal

Añadir un canal al sistema de QA YAML requiere la implementación del canal más
un paquete de escenarios que ejercite el contrato del canal. Para cobertura smoke en CI, añade
el servidor de proveedor local Crabline correspondiente y exponlo a través del driver `crabline`.

No añadas una nueva raíz de comando QA de nivel superior cuando el host compartido `qa-lab` puede poseer el flujo.

`qa-lab` posee la mecánica compartida del host:

- la raíz de comando `openclaw qa`
- inicio y desmontaje de suite
- concurrencia de workers
- escritura de artefactos
- generación de reportes
- ejecución de escenarios
- alias de compatibilidad para escenarios `qa-channel` más antiguos

Los plugins runner poseen el contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura el Gateway para ese transporte
- cómo se comprueba la preparación
- cómo se inyectan los eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado de transporte normalizado
- cómo se ejecutan las acciones respaldadas por transporte
- cómo se gestiona el restablecimiento o la limpieza específica del transporte

El requisito mínimo de adopción para un canal nuevo:

1. Mantén `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementa el ejecutor de transporte en el punto de integración de host compartido de `qa-lab`.
3. Mantén la mecánica específica del transporte dentro del Plugin ejecutor o del arnés del canal.
4. Monta el ejecutor como `openclaw qa <runner>` en lugar de registrar un comando raíz competidor. Los Plugins ejecutores deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un arreglo `qaRunnerCliRegistrations` coincidente desde `runtime-api.ts`. Mantén `runtime-api.ts` ligero; la CLI diferida y la ejecución del ejecutor deben permanecer detrás de puntos de entrada separados.
5. Crea o adapta escenarios YAML bajo los directorios temáticos `qa/scenarios/`.
6. Usa los asistentes de escenario genéricos para escenarios nuevos.
7. Mantén funcionando los alias de compatibilidad existentes salvo que el repositorio esté haciendo una migración intencional.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una sola vez en `qa-lab`, ponlo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, mantenlo en ese Plugin ejecutor o arnés del Plugin.
- Si un escenario necesita una capacidad nueva que puede usar más de un canal, añade un asistente genérico en lugar de una rama específica del canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico del transporte y hazlo explícito en el contrato del escenario.

### Nombres de asistentes de escenario

Asistentes genéricos preferidos para escenarios nuevos:

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

Los alias de compatibilidad siguen disponibles para escenarios existentes: `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`, pero la autoría de escenarios nuevos debe usar los nombres genéricos. Los alias existen para evitar una migración en un único momento, no como el modelo a seguir.

## Informes

`qa-lab` exporta un informe de protocolo en Markdown a partir de la línea temporal observada del bus.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué permaneció bloqueado
- Qué escenarios de seguimiento vale la pena añadir

Para el inventario de escenarios disponibles, útil al dimensionar trabajo de seguimiento o cablear un transporte nuevo, ejecuta `pnpm openclaw qa coverage` (añade `--json` para obtener salida legible por máquina).
Al elegir una prueba enfocada para un comportamiento o ruta de archivo tocados, ejecuta `pnpm openclaw qa coverage --match <query>`.
El informe de coincidencias busca en metadatos de escenarios, referencias de documentación, referencias de código, ID de cobertura, Plugins y requisitos de proveedor, y luego imprime objetivos `qa suite --scenario ...` coincidentes.
Cada ejecución de `qa suite` escribe artefactos de nivel superior `qa-evidence.json`,
`qa-suite-summary.json` y `qa-suite-report.md` para el conjunto de escenarios seleccionado. Los escenarios que declaran `execution.kind: vitest` o
`execution.kind: playwright` ejecutan la ruta de prueba coincidente y también escriben
registros por escenario. Los escenarios que declaran `execution.kind: script` ejecutan el
productor de evidencia en `execution.path` mediante `node --import tsx` (con
`${outputDir}` y `${scenarioId}` expandidos en `execution.args`); el productor
escribe su propio `qa-evidence.json`, cuyas entradas se importan en la salida de la suite
y cuyas rutas de artefactos se resuelven en relación con ese
`qa-evidence.json` del productor. Cuando se llega a `qa suite` mediante
`qa run --qa-profile`, el mismo `qa-evidence.json` también incluye el resumen de la
tarjeta de puntuación del perfil para las categorías de taxonomía seleccionadas.
Trátalo como una ayuda de descubrimiento, no como un reemplazo de compuerta; el escenario seleccionado aún necesita el modo de proveedor, el transporte en vivo, Multipass, Testbox o la línea de lanzamiento adecuados para el comportamiento bajo prueba.
Para el contexto de la tarjeta de puntuación, consulta [Tarjeta de puntuación de madurez](/es/maturity/scorecard).

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario en varias referencias de modelos en vivo
y escribe un informe Markdown evaluado:

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

El comando ejecuta procesos hijo locales del Gateway de QA, no Docker. Los escenarios de evaluación de carácter
deben establecer la personalidad mediante `SOUL.md` y luego ejecutar turnos de usuario ordinarios,
como chat, ayuda con el espacio de trabajo y tareas pequeñas de archivo. No se debe decir al modelo candidato
que está siendo evaluado. El comando conserva cada transcripción completa,
registra estadísticas básicas de ejecución y luego pide a los modelos jueces en modo rápido con
razonamiento `xhigh` donde sea compatible que clasifiquen las ejecuciones por naturalidad, vibra y humor.
Usa `--blind-judge-models` al comparar proveedores: el prompt del juez aún recibe
cada transcripción y estado de ejecución, pero las referencias candidatas se sustituyen por etiquetas
neutras como `candidate-01`; el informe vuelve a asignar las clasificaciones a las referencias reales después
del análisis.
Las ejecuciones candidatas usan `high` thinking de forma predeterminada, con `medium` para GPT-5.5 y `xhigh`
para referencias de evaluación de OpenAI anteriores que lo admitan. Sobrescribe un candidato específico en línea con
`--model provider/model,thinking=<level>`. `--thinking <level>` todavía establece una
reserva global, y la forma anterior `--model-thinking <provider/model=level>` se
mantiene por compatibilidad.
Las referencias candidatas de OpenAI usan modo rápido de forma predeterminada para que se use el procesamiento prioritario donde
el proveedor lo admita. Añade `,fast`, `,no-fast` o `,fast=false` en línea cuando un
candidato o juez individual necesite una sobrescritura. Pasa `--fast` solo cuando quieras
forzar el modo rápido para todos los modelos candidatos. Las duraciones de candidatos y jueces se
registran en el informe para análisis comparativo, pero los prompts de juez indican explícitamente
que no se clasifique por velocidad.
Las ejecuciones de modelos candidatos y jueces usan ambas concurrencia 16 de forma predeterminada. Reduce
`--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión local del Gateway
hagan que una ejecución sea demasiado ruidosa.
Cuando no se pasa ningún candidato `--model`, la evaluación de carácter usa de forma predeterminada
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa ningún `--model`.
Cuando no se pasa ningún `--judge-model`, los jueces usan de forma predeterminada
`openai/gpt-5.5,thinking=xhigh,fast` y
`anthropic/claude-opus-4-8,thinking=high`.

## Documentos relacionados

- [QA de matriz](/es/concepts/qa-matrix)
- [Tarjeta de puntuación de madurez](/es/maturity/scorecard)
- [Paquete de benchmark de agente personal](/es/concepts/personal-agent-benchmark-pack)
- [Canal de QA](/es/channels/qa-channel)
- [Pruebas](/es/help/testing)
- [Panel](/es/web/dashboard)
