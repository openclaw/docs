---
read_when:
    - Comprender cómo encaja la pila de QA
    - Extender qa-lab, qa-channel o un adaptador de transporte
    - Añadir escenarios de QA respaldados por el repositorio
    - Desarrollar automatización de QA de mayor realismo en torno al panel de control del Gateway
summary: 'Descripción general de la pila de QA: qa-lab, qa-channel, escenarios respaldados por el repositorio, carriles de transporte en vivo, adaptadores de transporte e informes.'
title: Resumen de QA
x-i18n:
    generated_at: "2026-06-27T11:18:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8cc1e4c3f496e409b93d2ca2d3bf8107e5fe3bea37f89cc92d1936109f0f4e36
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pila privada de QA está pensada para ejercitar OpenClaw de una forma más realista,
con forma de canal, de lo que puede hacerlo una sola prueba unitaria.

Piezas actuales:

- `extensions/qa-channel`: canal de mensajes sintético con superficies de DM, canal, hilo,
  reacción, edición y eliminación.
- `extensions/qa-lab`: interfaz de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe en Markdown.
- `extensions/qa-matrix`, plugins ejecutores futuros: adaptadores de transporte en vivo que
  controlan un canal real dentro de un Gateway de QA hijo.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea de inicio y escenarios
  base de QA.
- [Mantis](/es/concepts/mantis): verificación en vivo antes y después para errores que
  necesitan transportes reales, capturas de navegador, estado de VM y evidencia de PR.

## Superficie de comandos

Cada flujo de QA se ejecuta bajo `pnpm openclaw qa <subcommand>`. Muchos tienen alias de script `pnpm qa:*`;
ambas formas son compatibles.

| Comando                                             | Propósito                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autocomprobación de QA incluida sin `--qa-profile`; ejecutor de perfil de madurez respaldado por taxonomía con `--qa-profile smoke-ci`, `--qa-profile release` o `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Ejecuta escenarios respaldados por el repositorio contra el carril del Gateway de QA. Alias: `pnpm openclaw qa suite --runner multipass` para una VM Linux desechable.                                                                                                                                  |
| `qa coverage`                                       | Imprime el inventario de cobertura de escenarios YAML (`--json` para salida de máquina).                                                                                                                                                                                               |
| `qa parity-report`                                  | Compara dos archivos `qa-suite-summary.json` y escribe el informe de paridad agéntico, o usa `--runtime-axis --token-efficiency` para escribir informes de paridad de runtime y eficiencia de tokens Codex-vs-OpenClaw desde un resumen de par de runtimes.                                         |
| `qa character-eval`                                 | Ejecuta el escenario de QA de personaje en varios modelos en vivo con un informe evaluado. Consulta [Informes](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Ejecuta un prompt puntual contra el carril de proveedor/modelo seleccionado.                                                                                                                                                                                                          |
| `qa ui`                                             | Inicia la interfaz de depuración de QA y el bus de QA local (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Construye la imagen Docker de QA prehorneada.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Escribe un andamiaje de docker-compose para el panel de QA + el carril del Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Construye el sitio de QA, inicia la pila respaldada por Docker e imprime la URL (alias: `pnpm qa:lab:up`; la variante `:fast` añade `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Inicia solo el servidor del proveedor AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Inicia solo el servidor del proveedor `mock-openai` consciente de escenarios.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Gestiona el grupo compartido de credenciales Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Carril de transporte en vivo contra un homeserver Tuwunel desechable. Consulta [QA de Matrix](/es/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Carril de transporte en vivo contra un grupo privado real de Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Carril de transporte en vivo contra un canal de guild privado real de Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | Carril de transporte en vivo contra un canal privado real de Slack.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Carril de transporte en vivo contra cuentas reales de WhatsApp Web.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Ejecutor de verificación antes y después para errores de transporte en vivo, con evidencia de reacciones de estado de Discord, smoke de escritorio/navegador Crabbox y smoke de Slack-en-VNC. Consulta [Mantis](/es/concepts/mantis) y [Runbook de Mantis Slack Desktop](/es/concepts/mantis-slack-desktop-runbook). |

`qa run` respaldado por perfiles lee la pertenencia desde `taxonomy.yaml` y luego despacha
los escenarios resueltos mediante `qa suite`. `--surface` y
`--category` filtran el perfil seleccionado en lugar de definir carriles separados.
El `qa-evidence.json` resultante incluye un resumen de cuadro de mando del perfil con
recuentos de categorías seleccionadas e IDs de cobertura faltantes; las entradas de evidencia
individuales siguen siendo la fuente de verdad para las pruebas, roles de cobertura y resultados.
Los IDs de cobertura de características de la taxonomía son objetivos de prueba exactos, no alias. La cobertura
principal de escenarios satisface los IDs coincidentes; la cobertura secundaria sigue siendo orientativa.
Los IDs de cobertura usan la forma punteada `namespace.behavior` con segmentos alfanuméricos/en guion
en minúsculas; los IDs de perfil, superficie y categoría aún pueden usar
los IDs de taxonomía existentes con guiones o puntos.
La evidencia ligera omite `execution` por entrada y establece `evidenceMode: "slim"`;
`smoke-ci` usa ligera de forma predeterminada, y `--evidence-mode full` restaura entradas completas:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Usa `smoke-ci` para prueba determinista de perfil con proveedores de modelo simulados y
servidores de proveedor falso Crabline. Usa `release` para prueba Stable/LTS contra canales en vivo.
Usa `all` solo para ejecuciones explícitas de evidencia de taxonomía completa; selecciona
todas las categorías de madurez activas y puede despacharse mediante el flujo de trabajo `QA Profile
Evidence` con `qa_profile=all`. Cuando un comando también necesita un perfil raíz de OpenClaw,
pon el perfil raíz antes del comando de QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Flujo de operador

El flujo actual de operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel de Gateway (Control UI) con el agente.
- Derecha: QA Lab, mostrando la transcripción tipo Slack y el plan de escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso construye el sitio de QA, inicia el carril de Gateway respaldado por Docker y expone la
página de QA Lab donde un operador o bucle de automatización puede dar al agente una misión de QA,
observar el comportamiento real del canal y registrar qué funcionó, qué falló o
qué quedó bloqueado.

Para iterar más rápido en la interfaz de QA Lab sin reconstruir la imagen Docker cada vez,
inicia la pila con un paquete de QA Lab montado por enlace:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios Docker en una imagen precompilada y monta por enlace
`extensions/qa-lab/web/dist` en el contenedor `qa-lab`. `qa:lab:watch`
reconstruye ese paquete al cambiar, y el navegador se recarga automáticamente cuando cambia el hash
de recursos de QA Lab.

Para un smoke local de señal OpenTelemetry, ejecuta:

```bash
pnpm qa:otel:smoke
```

Ese script inicia un receptor OTLP/HTTP local, ejecuta el escenario de QA `otel-trace-smoke`
con el Plugin `diagnostics-otel` habilitado, y luego comprueba que trazas,
métricas y logs se exportan. Decodifica los spans de traza protobuf exportados
y comprueba la forma crítica para la versión:
`openclaw.run`, `openclaw.harness.run`, un span de llamada a modelo con la convención semántica GenAI más reciente,
`openclaw.context.assembled` y `openclaw.message.delivery`
deben estar presentes. El smoke fuerza
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, por lo que el span de llamada a modelo
debe usar el nombre `{gen_ai.operation.name} {gen_ai.request.model}`;
las llamadas a modelos no deben exportar `StreamAbandoned` en turnos correctos; los IDs de diagnóstico sin procesar y
los atributos `openclaw.content.*` deben quedar fuera de la traza. Las cargas OTLP sin procesar
no deben contener el centinela del prompt, el centinela de respuesta ni la clave de sesión de QA.
Escribe `otel-smoke-summary.json` junto a los artefactos de la suite de QA.

Para un smoke de OpenTelemetry respaldado por collector, ejecuta:

```bash
pnpm qa:otel:collector-smoke
```

Ese carril coloca un contenedor Docker real de OpenTelemetry Collector delante del
mismo receptor local. Úsalo al cambiar el cableado de endpoints, la
compatibilidad del collector o el comportamiento de exportación OTLP que el receptor en proceso podría ocultar.

Para el smoke protegido de scrape de Prometheus, ejecuta:

```bash
pnpm qa:prometheus:smoke
```

Ese alias ejecuta el escenario de QA `docker-prometheus-smoke` con
`diagnostics-prometheus` habilitado, verifica que los scrapes no autenticados se rechacen
y luego comprueba que el scrape autenticado incluya familias de métricas críticas para la versión
sin contenido de prompts, contenido de respuestas, identificadores de diagnóstico sin procesar, tokens
de autenticación ni rutas locales.

Para ejecutar ambos smokes de observabilidad seguidos, usa:

```bash
pnpm qa:observability:smoke
```

Para la ruta OpenTelemetry respaldada por collector más el smoke de scrape Prometheus protegido,
usa:

```bash
pnpm qa:observability:collector-smoke
```

La QA de observabilidad permanece solo para checkout de código fuente. El tarball de npm omite
intencionalmente QA Lab, por lo que las rutas de versión Docker de paquete no ejecutan comandos `qa`. Usa
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` o
`pnpm qa:observability:smoke` desde un checkout de código fuente compilado al cambiar
la instrumentación de diagnóstico.

Para una ruta smoke Matrix con transporte real que no requiere credenciales de proveedor
de modelos, ejecuta el perfil rápido con el proveedor OpenAI simulado determinista:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Para la ruta con proveedor live-frontier, proporciona credenciales compatibles con OpenAI
explícitamente:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

La referencia completa de CLI, el catálogo de perfiles/escenarios, las variables de entorno y el diseño de artefactos para esta ruta están en [QA de Matrix](/es/concepts/qa-matrix). En resumen: aprovisiona un homeserver Tuwunel desechable en Docker, registra usuarios temporales de driver/SUT/observador, ejecuta el Plugin Matrix real dentro de un Gateway de QA hijo limitado a ese transporte (sin `qa-channel`) y luego escribe un informe Markdown, un resumen JSON, un artefacto de eventos observados y un registro de salida combinado en `.artifacts/qa-e2e/matrix-<timestamp>/`.

Los escenarios cubren comportamiento de transporte que las pruebas unitarias no pueden demostrar de extremo a extremo: control por menciones, políticas allow-bot, listas de permitidos, respuestas de nivel superior y en hilos, enrutamiento de DM, manejo de reacciones, supresión de ediciones entrantes, deduplicación de reproducción tras reinicio, recuperación ante interrupción del homeserver, entrega de metadatos de aprobación, manejo de medios y flujos de arranque/recuperación/verificación de E2EE en Matrix. El perfil CLI de E2EE también ejecuta `openclaw matrix encryption setup` y comandos de verificación a través del mismo homeserver desechable antes de comprobar las respuestas del Gateway.

Discord también tiene escenarios opcionales solo para Mantis destinados a reproducir bugs. Usa
`--scenario discord-status-reactions-tool-only` para la línea de tiempo explícita de reacciones de estado,
o `--scenario discord-thread-reply-filepath-attachment` para crear un
hilo real de Discord y verificar que `message.thread-reply` conserve un adjunto
`filePath`. Estos escenarios quedan fuera de la ruta predeterminada de Discord en vivo
porque son sondas de reproducción antes/después en lugar de cobertura smoke amplia.
El flujo de trabajo Mantis de adjuntos en hilos también puede añadir un video testigo de Discord Web
con sesión iniciada cuando `MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` o
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` está configurado en el entorno de QA.
Ese perfil de visor es solo para captura visual; la decisión de correcto/incorrecto
sigue viniendo del oráculo REST de Discord.

CI usa la misma superficie de comandos en `.github/workflows/qa-live-transports-convex.yml`.
Las ejecuciones programadas y manuales predeterminadas ejecutan el perfil rápido de Matrix con
credenciales live-frontier proporcionadas por QA, `--fast` y
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. El valor manual `matrix_profile=all` se
distribuye en cinco shards de perfil.

Para rutas smoke con transporte real de Telegram, Discord, Slack y WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Apuntan a un canal real preexistente con dos bots o cuentas (driver + SUT). Las variables de entorno requeridas, las listas de escenarios, los artefactos de salida y el pool de credenciales Convex están documentados en la [referencia de QA de Telegram, Discord, Slack y WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) más abajo.

Para una ejecución completa de VM de escritorio Slack con rescate por VNC, ejecuta:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ese comando arrienda una máquina Crabbox de escritorio/navegador, ejecuta la ruta Slack en vivo
dentro de la VM, abre Slack Web en el navegador VNC, captura el escritorio y
copia `slack-qa/`, `slack-desktop-smoke.png` y `slack-desktop-smoke.mp4`
cuando la captura de video está disponible, de vuelta al directorio de artefactos Mantis. Los
arrendamientos Crabbox de escritorio/navegador proporcionan por adelantado las herramientas de captura y los paquetes
auxiliares de navegador/compilación nativa, por lo que el escenario solo debería instalar alternativas en
arrendamientos antiguos. Mantis informa tiempos totales y por fase en
`mantis-slack-desktop-smoke-report.md`, para que las ejecuciones lentas muestren si el tiempo se fue en
calentamiento del arrendamiento, adquisición de credenciales, configuración remota o copia de artefactos. Reutiliza
`--lease-id <cbx_...>` después de iniciar sesión manualmente en Slack Web mediante VNC;
los arrendamientos reutilizados también mantienen caliente la caché de pnpm store de Crabbox. El valor predeterminado
`--hydrate-mode source` verifica desde un checkout de código fuente y ejecuta install/build
dentro de la VM. Usa `--hydrate-mode prehydrated` solo cuando el espacio de trabajo remoto reutilizado
ya tenga `node_modules` y un `dist/` compilado; ese modo omite el paso costoso
de install/build y falla de forma cerrada cuando el espacio de trabajo no está listo.
Con `--gateway-setup`, Mantis deja un Gateway Slack de OpenClaw persistente
ejecutándose dentro de la VM en el puerto `38973`; sin él, el comando ejecuta la ruta
normal de QA de Slack bot a bot y sale después de capturar artefactos.

Para demostrar la interfaz de aprobación nativa de Slack con evidencia de escritorio, ejecuta el modo de
puntos de control de aprobación de Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Este modo es mutuamente excluyente con `--gateway-setup`. Ejecuta los escenarios de aprobación de Slack,
rechaza ids de escenarios que no sean de aprobación, espera en cada estado de aprobación pendiente y
resuelto, renderiza el mensaje observado de la API de Slack en
`approval-checkpoints/<scenario>-pending.png` y
`approval-checkpoints/<scenario>-resolved.png`, y luego falla si falta o está vacío cualquier punto de control,
evidencia de mensaje, acuse de recibo o captura renderizada.
Los arrendamientos fríos de CI todavía pueden mostrar el inicio de sesión de Slack en `slack-desktop-smoke.png`; las
imágenes de puntos de control de aprobación son la prueba visual para esta ruta.

La lista de comprobación del operador, el comando de despacho de GitHub workflow, el contrato de
comentario de evidencia, la tabla de decisión de hydrate-mode, la interpretación de tiempos y los pasos de
manejo de fallos están en el [runbook de escritorio Slack de Mantis](/es/concepts/mantis-slack-desktop-runbook).

Para una tarea de escritorio estilo agente/CV, ejecuta:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` arrienda o reutiliza una máquina Crabbox de escritorio/navegador, inicia
`crabbox record --while`, controla el navegador visible mediante un
`visual-driver` anidado, captura `visual-task.png`, ejecuta `openclaw infer image describe`
contra la captura de pantalla cuando se selecciona `--vision-mode image-describe`, y
escribe `visual-task.mp4`, `mantis-visual-task-summary.json`,
`mantis-visual-task-driver-result.json` y `mantis-visual-task-report.md`.
Cuando se establece `--expect-text`, el prompt de visión pide un veredicto JSON estructurado
y solo pasa cuando el modelo informa evidencia visible positiva; una
respuesta negativa que simplemente cite el texto objetivo falla la aserción.
Usa `--vision-mode metadata` para un smoke sin modelo que demuestre el escritorio,
el navegador, la captura de pantalla y la canalización de video sin llamar a un proveedor
de comprensión de imágenes. La grabación es un artefacto requerido para `visual-task`; si Crabbox graba
un `visual-task.mp4` vacío o inexistente, la tarea falla aunque el driver visual
haya pasado. En caso de fallo, Mantis conserva el arrendamiento para VNC salvo que la tarea ya
hubiera pasado y `--keep-lease` no estuviera establecido.

Antes de usar credenciales en vivo agrupadas, ejecuta:

```bash
pnpm openclaw qa credentials doctor
```

El doctor comprueba el entorno del broker Convex, valida la configuración de endpoints y verifica la accesibilidad admin/list cuando el secreto de maintainer está presente. Solo informa el estado establecido/faltante de los secretos.

## Cobertura de transportes en vivo

Las rutas de transportes en vivo comparten un contrato en lugar de que cada una invente su propia forma de lista de escenarios. `qa-channel` es la suite sintética amplia de comportamiento de producto y no forma parte de la matriz de cobertura de transportes en vivo.

Los runners de transportes en vivo deben importar los ids de escenarios compartidos, los helpers de
cobertura de línea base y el helper de selección de escenarios desde
`openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Ruta     | Canario | Control por menciones | Bot a bot | Bloqueo de lista de permitidos | Respuesta de nivel superior | Respuesta con cita | Reanudación tras reinicio | Seguimiento de hilo | Aislamiento de hilo | Observación de reacciones | Comando de ayuda | Registro de comandos nativos |
| -------- | ------ | -------------- | ---------- | --------------- | --------------- | ----------- | -------------- | ---------------- | ---------------- | -------------------- | ------------ | --------------------------- |
| Matrix   | x      | x              | x          | x               | x               |             | x              | x                | x                | x                    |              |                             |
| Telegram | x      | x              | x          |                 |                 |             |                |                  |                  |                      | x            |                             |
| Discord  | x      | x              | x          |                 |                 |             |                |                  |                  |                      |              | x                           |
| Slack    | x      | x              | x          | x               | x               |             | x              | x                | x                |                      |              |                             |
| WhatsApp | x      | x              |            | x               | x               | x           | x              |                  |                  | x                    | x            |                             |

Esto mantiene `qa-channel` como la suite amplia de comportamiento de producto mientras Matrix,
Telegram y otros transportes en vivo comparten una lista de comprobación explícita de contrato de transporte.

Para una ruta de VM Linux desechable sin introducir Docker en la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto arranca un invitado Multipass nuevo, instala dependencias, compila OpenClaw
dentro del invitado, ejecuta `qa suite` y luego copia el informe de QA y el
resumen normales de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en el host.
Las ejecuciones de suite en host y Multipass ejecutan varios escenarios seleccionados en paralelo
con workers de Gateway aislados de forma predeterminada. `qa-channel` usa concurrencia
4 de forma predeterminada, limitada por el recuento de escenarios seleccionados. Usa `--concurrency <count>` para ajustar
el número de workers, o `--concurrency 1` para ejecución serial.
Usa `--pack personal-agent` para ejecutar el pack de benchmark de asistente personal. El
selector de pack es aditivo con flags `--scenario` repetidos: los escenarios explícitos
se ejecutan primero, luego los escenarios del pack se ejecutan en orden de pack con duplicados eliminados.
Usa `--pack observability` cuando un runner de QA personalizado ya proporcione la
configuración del collector OpenTelemetry y quiera seleccionar juntos los escenarios smoke
de diagnóstico de OpenTelemetry y Prometheus.
El comando sale con un código distinto de cero cuando falla cualquier escenario. Usa `--allow-failures` cuando
quieras artefactos sin un código de salida fallido.
Las ejecuciones en vivo reenvían las entradas de autenticación de QA compatibles que son prácticas para el
invitado: claves de proveedor basadas en entorno, la ruta de configuración del proveedor en vivo de QA y
`CODEX_HOME` cuando está presente. Mantén `--output-dir` bajo la raíz del repo para que el invitado
pueda escribir de vuelta a través del espacio de trabajo montado.

## Referencia de QA para Telegram, Discord, Slack y WhatsApp

Matrix tiene una [página dedicada](/es/concepts/qa-matrix) debido a su cantidad de escenarios y al aprovisionamiento de homeserver respaldado por Docker. Telegram, Discord, Slack y WhatsApp se ejecutan contra transportes reales preexistentes, por lo que su referencia está aquí.

### Banderas compartidas de la CLI

Estos carriles se registran mediante `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` y aceptan las mismas banderas:

| Bandera                               | Valor predeterminado                              | Descripción                                                                                                                                                         |
| ------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                  | Ejecuta solo este escenario. Repetible.                                                                                                                             |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Donde se escriben los informes, resúmenes, evidencias, artefactos específicos del transporte y el registro de salida. Las rutas relativas se resuelven contra `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                    | Raíz del repositorio al invocar desde un cwd neutral.                                                                                                               |
| `--sut-account <id>`                  | `sut`                                              | Id de cuenta temporal dentro de la configuración del Gateway de QA.                                                                                                 |
| `--provider-mode <mode>`              | `live-frontier`                                    | `mock-openai` o `live-frontier` (`live-openai` heredado aún funciona).                                                                                              |
| `--model <ref>` / `--alt-model <ref>` | valor predeterminado del proveedor                 | Referencias del modelo primario/alternativo.                                                                                                                        |
| `--fast`                              | desactivado                                        | Modo rápido del proveedor donde sea compatible.                                                                                                                     |
| `--credential-source <env\|convex>`   | `env`                                              | Consulta [grupo de credenciales de Convex](#convex-credential-pool).                                                                                                |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, `maintainer` en otros casos            | Rol usado cuando `--credential-source convex`.                                                                                                                      |

Cada carril sale con código distinto de cero ante cualquier escenario fallido. `--allow-failures` escribe artefactos sin establecer un código de salida fallido.

### QA de Telegram

```bash
pnpm openclaw qa telegram
```

Apunta a un grupo privado real de Telegram con dos bots distintos (controlador + SUT). El bot SUT debe tener un nombre de usuario de Telegram; la observación bot a bot funciona mejor cuando ambos bots tienen habilitado **Bot-to-Bot Communication Mode** en `@BotFather`.

Entorno requerido cuando `--credential-source env`:

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

El conjunto predeterminado implícito siempre cubre canary, compuerta de menciones, respuestas a comandos nativos, direccionamiento de comandos y respuestas de grupo bot a bot. Los valores predeterminados de `mock-openai` también incluyen comprobaciones deterministas de cadena de respuestas y streaming de mensaje final. `telegram-current-session-status-tool` sigue siendo opt-in porque solo es estable cuando se encadena directamente después de canary, no después de respuestas arbitrarias a comandos nativos. Usa `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` para imprimir la división actual predeterminada/opcional con referencias de regresión.

Artefactos de salida:

- `telegram-qa-report.md`
- `qa-evidence.json` - entradas de evidencia para las comprobaciones del transporte en vivo, incluidos campos de perfil, cobertura, proveedor, canal, artefactos, resultado y RTT.

Las ejecuciones de paquetes de Telegram usan el mismo contrato de credenciales de Telegram. La medición repetida de RTT forma parte del carril en vivo normal de paquetes de Telegram; la distribución de RTT se incorpora en `qa-evidence.json` bajo `result.timing` para la comprobación de RTT seleccionada.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Cuando `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` está establecido, el envoltorio en vivo del paquete alquila una credencial `kind: "telegram"`, exporta el entorno del grupo/controlador/bot SUT alquilado a la ejecución del paquete instalado, envía Heartbeat al alquiler y lo libera al apagarse. El envoltorio de paquete usa de forma predeterminada 20 comprobaciones de RTT de `telegram-mentioned-message-reply`, un tiempo de espera de RTT de 30 s y el rol de Convex `maintainer` fuera de CI cuando Convex está seleccionado. Sobrescribe `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` o `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar la medición de RTT sin crear un comando de RTT separado ni un formato de resumen específico de Telegram.

### QA de Discord

```bash
pnpm openclaw qa discord
```

Apunta a un canal real de guild privado de Discord con dos bots: un bot controlador controlado por el arnés y un bot SUT iniciado por el Gateway hijo de OpenClaw mediante el plugin incluido de Discord. Verifica el manejo de menciones de canal, que el bot SUT haya registrado el comando nativo `/help` con Discord, y escenarios de evidencia opt-in de Mantis.

Entorno requerido cuando `--credential-source env`:

- `OPENCLAW_QA_DISCORD_GUILD_ID`
- `OPENCLAW_QA_DISCORD_CHANNEL_ID`
- `OPENCLAW_QA_DISCORD_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_BOT_TOKEN`
- `OPENCLAW_QA_DISCORD_SUT_APPLICATION_ID` - debe coincidir con el id de usuario del bot SUT devuelto por Discord (de lo contrario, el carril falla rápido).

Opcional:

- `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados.
- `OPENCLAW_QA_DISCORD_VOICE_CHANNEL_ID` selecciona el canal de voz/escenario para `discord-voice-autojoin`; sin él, el escenario elige el primer canal de voz/escenario visible para el bot SUT.

Escenarios (`extensions/qa-lab/src/live-transports/discord/discord-live.runtime.ts:36`):

- `discord-canary`
- `discord-mention-gating`
- `discord-native-help-command-registration`
- `discord-voice-autojoin` - escenario de voz opt-in. Se ejecuta por sí solo, habilita `channels.discord.voice.autoJoin` y verifica que el estado de voz actual de Discord del bot SUT sea el canal de voz/escenario de destino. Las credenciales de Convex para Discord pueden incluir `voiceChannelId` opcional; de lo contrario, el ejecutor descubre el primer canal de voz/escenario visible en el guild.
- `discord-status-reactions-tool-only` - escenario opt-in de Mantis. Se ejecuta por sí solo porque cambia el SUT a respuestas de guild siempre activas y solo de herramientas con `messages.statusReactions.enabled=true`, luego captura una cronología de reacciones REST más artefactos visuales HTML/PNG. Los informes antes/después de Mantis también preservan artefactos MP4 proporcionados por el escenario como `baseline.mp4` y `candidate.mp4`.

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

Apunta a un canal privado real de Slack con dos bots distintos: un bot controlador controlado por el arnés y un bot SUT iniciado por el Gateway hijo de OpenClaw mediante el plugin incluido de Slack.

Entorno requerido cuando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` habilita puntos de control visuales de aprobación para Mantis. El ejecutor escribe `<scenario>.pending.json` y `<scenario>.resolved.json`, luego espera archivos `.ack.json` coincidentes.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` sobrescribe el tiempo de espera de confirmación del punto de control. El valor predeterminado es `120000`.

Escenarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - escenario opt-in de aprobación nativa de exec en Slack. Solicita una aprobación de exec mediante el Gateway, verifica que el mensaje de Slack tenga botones de aprobación nativos, la resuelve y verifica la actualización resuelta de Slack.
- `slack-approval-plugin-native` - escenario opt-in de aprobación nativa de plugin en Slack. Habilita conjuntamente el reenvío de aprobación de exec y plugin para que los eventos de plugin no sean suprimidos por el enrutamiento de aprobación de exec, luego verifica la misma ruta de UI nativa de Slack pendiente/resuelta.

Artefactos de salida:

- `slack-qa-report.md`
- `qa-evidence.json` - entradas de evidencia para las comprobaciones del transporte en vivo.
- `slack-qa-observed-messages.json` - cuerpos redactados salvo que `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - solo cuando Mantis establece `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; contiene JSON de puntos de control, JSON de confirmación y capturas de pantalla pendientes/resueltas.

#### Configurar el espacio de trabajo de Slack

El carril necesita dos apps distintas de Slack en un espacio de trabajo, además de un canal del que ambos bots sean miembros:

- `channelId` - el id `Cxxxxxxxxxx` de un canal al que ambos bots hayan sido invitados. Usa un canal dedicado; el carril publica en cada ejecución.
- `driverBotToken` - token de bot (`xoxb-...`) de la app **Driver**.
- `sutBotToken` - token de bot (`xoxb-...`) de la app **SUT**, que debe ser una app de Slack separada del controlador para que su id de usuario de bot sea distinto.
- `sutAppToken` - token de nivel de app (`xapp-...`) de la app SUT con `connections:write`, usado por Socket Mode para que la app SUT pueda recibir eventos.

Prefiere un espacio de trabajo de Slack dedicado a QA en lugar de reutilizar un espacio de trabajo de producción.

El manifiesto SUT siguiente limita intencionalmente la instalación de producción del plugin incluido de Slack (`extensions/slack/src/setup-shared.ts:10`) a los permisos y eventos cubiertos por la suite de QA en vivo de Slack. Para la configuración del canal de producción tal como la ven los usuarios, consulta [configuración rápida del canal Slack](/es/channels/slack#quick-setup); el par QA Driver/SUT está separado intencionalmente porque el carril necesita dos ids de usuario de bot distintos en un espacio de trabajo.

**1. Crea la app Driver**

Ve a [api.slack.com/apps](https://api.slack.com/apps) → _Crear nueva aplicación_ → _Desde un manifiesto_ → elige el espacio de trabajo de QA, pega el siguiente manifiesto y luego _Instalar en el espacio de trabajo_:

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

Copia el _Bot User OAuth Token_ (`xoxb-...`); ese pasa a ser `driverBotToken`. El controlador solo necesita publicar mensajes e identificarse; sin eventos, sin Socket Mode.

**2. Crea la aplicación SUT**

Repite _Crear nueva aplicación → Desde un manifiesto_ en el mismo espacio de trabajo. Esta aplicación de QA usa intencionalmente una versión más estrecha del manifiesto de producción del Plugin de Slack incluido (`extensions/slack/src/setup-shared.ts:10`): se omiten los ámbitos y eventos de reacciones porque la suite de QA en vivo de Slack aún no cubre el manejo de reacciones.

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

Después de que Slack cree la aplicación, haz dos cosas en su página de configuración:

- _Instalar en el espacio de trabajo_ → copia el _Bot User OAuth Token_ → ese pasa a ser `sutBotToken`.
- _Información básica → Tokens de nivel de aplicación → Generar token y ámbitos_ → agrega el ámbito `connections:write` → guarda → copia el valor `xapp-...` → ese pasa a ser `sutAppToken`.

Verifica que los dos bots tengan ids de usuario distintos llamando a `auth.test` en cada token. El runtime distingue el controlador y el SUT por id de usuario; reutilizar una aplicación para ambos fallará inmediatamente en la compuerta de menciones.

**3. Crea el canal**

En el espacio de trabajo de QA, crea un canal (por ejemplo, `#openclaw-qa`) e invita a ambos bots desde dentro del canal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia el id `Cxxxxxxxxxx` de _información del canal → Acerca de → ID del canal_; ese pasa a ser `channelId`. Un canal público funciona; si usas un canal privado, ambas aplicaciones ya tienen `groups:history`, así que las lecturas de historial del arnés seguirán funcionando.

**4. Registra las credenciales**

Dos opciones. Usa variables de entorno para depuración en una sola máquina (define las cuatro variables `OPENCLAW_QA_SLACK_*` y pasa `--credential-source env`), o inicializa el grupo compartido de Convex para que CI y otros mantenedores puedan arrendarlas.

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

**5. Verifica de extremo a extremo**

Ejecuta el carril localmente para confirmar que ambos bots puedan hablar entre sí a través del intermediario:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Una ejecución verde se completa en bastante menos de 30 segundos y `slack-qa-report.md` muestra tanto `slack-canary` como `slack-mention-gating` con estado `pass`. Si el carril se queda colgado durante ~90 segundos y sale con `Convex credential pool exhausted for kind "slack"`, el grupo está vacío o todas las filas están arrendadas; `qa credentials list --kind slack --status all --json` te dirá cuál de las dos cosas ocurre.

### QA de WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Apunta a dos cuentas dedicadas de WhatsApp Web: una cuenta de controlador gestionada por
el arnés y una cuenta SUT iniciada por el Gateway hijo de OpenClaw a través del
Plugin de WhatsApp incluido.

Entorno requerido cuando se usa `--credential-source env`:

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

- Línea base y compuerta de grupo: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-top-level-reply-shape`,
  `whatsapp-restart-resume`, `whatsapp-group-allowlist-block`.
- Comandos nativos: `whatsapp-help-command`, `whatsapp-status-command`,
  `whatsapp-commands-command`, `whatsapp-tools-compact-command`,
  `whatsapp-whoami-command`, `whatsapp-context-command`,
  `whatsapp-native-new-command`.
- Comportamiento de respuestas y salida final: `whatsapp-tool-only-usage-footer`,
  `whatsapp-reply-to-message`, `whatsapp-group-reply-to-message`,
  `whatsapp-reply-context-isolation`, `whatsapp-reply-delivery-shape`,
  `whatsapp-stream-final-message-accounting`.
- Medios entrantes y mensajes estructurados: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`. Estos envían eventos reales de imagen, audio,
  documento, ubicación, contacto y sticker de WhatsApp a través del controlador.
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
mantiene pequeño, con 10 escenarios, para una cobertura rápida de smoke. El carril
predeterminado `mock-openai` ejecuta 31 escenarios deterministas a través del transporte
real de WhatsApp, simulando solo la salida del modelo. Los escenarios de aprobación y
algunas comprobaciones más pesadas o bloqueantes siguen siendo explícitos por id de escenario.

El controlador de QA de WhatsApp observa eventos en vivo estructurados (`text`, `media`,
`location`, `reaction` y `poll`) y puede enviar activamente medios, encuestas,
contactos, ubicaciones y stickers. QA Lab importa ese controlador a través de la
superficie de paquete `@openclaw/whatsapp/api.js` en lugar de acceder a archivos privados
del runtime de WhatsApp. El contenido de los mensajes se redacta de forma predeterminada. La cobertura de
encuestas salientes y subida de archivos se ejecuta mediante llamadas deterministas de Gateway `poll` y
`message.action` en lugar de invocación de herramientas solo por prompt del modelo.

Artefactos de salida:

- `whatsapp-qa-report.md`
- `qa-evidence.json`: entradas de evidencia para las comprobaciones del transporte en vivo.
- `whatsapp-qa-observed-messages.json`: cuerpos redactados salvo que `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Grupo de credenciales de Convex

Los carriles de Telegram, Discord, Slack y WhatsApp pueden arrendar credenciales desde un grupo compartido de Convex en lugar de leer las variables de entorno anteriores. Pasa `--credential-source convex` (o define `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab adquiere un arrendamiento exclusivo, envía Heartbeat durante la ejecución y lo libera al cerrarse. Los tipos de grupo son `"telegram"`, `"discord"`, `"slack"` y `"whatsapp"`.

Formas de payload que el intermediario valida en `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }`; `groupId` debe ser una cadena numérica de id de chat.
- Usuario real de Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }`; solo prueba de Mantis Telegram Desktop. Los carriles genéricos de QA Lab no deben adquirir este tipo.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }`; los números de teléfono deben ser cadenas E.164 distintas.

El flujo de trabajo de prueba de Mantis Telegram Desktop mantiene un arrendamiento exclusivo de Convex
`telegram-user` tanto para el controlador CLI de TDLib como para el testigo de Telegram Desktop,
y luego lo libera tras publicar la prueba.

Cuando un PR necesita una diferencia visual determinista, Mantis puede usar la misma respuesta de modelo simulada
en `main` y en la cabeza del PR mientras cambia el formateador o la capa de entrega de Telegram.
Los valores predeterminados de captura están ajustados para comentarios de PR: clase estándar de Crabbox,
grabación de escritorio a 24 fps, GIF de movimiento a 24 fps y ancho de vista previa de 1920 px.
Los comentarios de antes/después deben publicar un paquete limpio que contenga solo los
GIF previstos.

Los carriles de Slack también pueden usar el grupo. Las comprobaciones de forma del payload de Slack viven actualmente en el ejecutor de QA de Slack en lugar de en el intermediario; usa `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, con un id de canal de Slack como `Cxxxxxxxxxx`. Consulta [Configuración del espacio de trabajo de Slack](#setting-up-the-slack-workspace) para el aprovisionamiento de aplicaciones y ámbitos.

Las variables de entorno operativas y el contrato del endpoint del intermediario de Convex viven en [Pruebas → Credenciales compartidas de Telegram mediante Convex](/es/help/testing#shared-telegram-credentials-via-convex-v1) (el nombre de la sección es anterior al grupo multicanal; la semántica de arrendamiento se comparte entre tipos).

## Seeds respaldados por el repositorio

Los recursos seed viven en `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Estos están intencionalmente en git para que el plan de QA sea visible tanto para humanos como para el
agente.

`qa-lab` debe seguir siendo un ejecutor genérico de escenarios YAML. Cada archivo YAML de escenario es
la fuente de verdad para una ejecución de prueba y debe definir:

- `title` de nivel superior
- metadatos de `scenario`
- metadatos opcionales de categoría, capacidad, carril y riesgo en `scenario`
- referencias de documentación y código en `scenario`
- requisitos opcionales de Plugin en `scenario`
- parche opcional de configuración de Gateway en `scenario`
- `flow` ejecutable de nivel superior para escenarios de flujo, o `scenario.execution.kind` /
  `scenario.execution.path` para escenarios de Vitest y Playwright

La superficie de runtime reutilizable que respalda `flow` puede seguir siendo genérica
y transversal. Por ejemplo, los escenarios YAML pueden combinar ayudantes del lado
del transporte con ayudantes del lado del navegador que controlan la Control UI incrustada a través de la
seam `browser.request` del Gateway sin añadir un ejecutor de caso especial.

Los archivos de escenario deben agruparse por capacidad de producto en lugar de por carpeta
del árbol de código fuente. Mantén estables los ID de escenario cuando se muevan archivos; usa `docsRefs` y `codeRefs`
para la trazabilidad de implementación.

La lista base debe seguir siendo lo bastante amplia para cubrir:

- chat de DM y de canal
- comportamiento de hilos
- ciclo de vida de acciones de mensaje
- callbacks de cron
- recuperación de memoria
- cambio de modelo
- traspaso a subagente
- lectura de repositorios y lectura de documentación
- una pequeña tarea de compilación como Lobster Invaders

## Carriles mock de proveedor

`qa suite` tiene dos carriles mock de proveedor locales:

- `mock-openai` es el mock de OpenClaw consciente de escenarios. Sigue siendo el carril mock
  determinista predeterminado para QA respaldado por repositorio y puertas de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo,
  fixtures, grabación/reproducción y caos. Es aditivo y no
  reemplaza al despachador de escenarios `mock-openai`.

La implementación de carriles de proveedor vive en `extensions/qa-lab/src/providers/`.
Cada proveedor posee sus valores predeterminados, el arranque del servidor local, la configuración de modelo del gateway,
las necesidades de preparación del perfil de autenticación y las marcas de capacidad live/mock. El código compartido de suite y
gateway debe enrutar a través del registro de proveedores en lugar de ramificar por
nombres de proveedor.

## Adaptadores de transporte

`qa-lab` posee una seam de transporte genérica para escenarios QA en YAML. `qa-channel` es
el valor predeterminado sintético. `crabline` inicia servidores locales con forma de proveedor y ejecuta
los plugins de canal normales de OpenClaw contra ellos. `live` se reserva para credenciales de proveedor
reales y canales externos.

A nivel de arquitectura, la división es:

- `qa-lab` posee la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y los informes.
- El adaptador de transporte posee la configuración del gateway, la disponibilidad, la observación entrante y saliente, las acciones de transporte y el estado de transporte normalizado.
- Los archivos de escenario YAML bajo `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie de runtime reutilizable que los ejecuta.

### Añadir un canal

Añadir un canal al sistema QA YAML requiere la implementación del canal más
un paquete de escenarios que ejercite el contrato del canal. Para cobertura smoke en CI, añade
el servidor de proveedor falso Crabline correspondiente y expónlo a través del driver `crabline`.

No añadas una nueva raíz de comando QA de nivel superior cuando el host compartido `qa-lab` pueda poseer el flujo.

`qa-lab` posee la mecánica compartida del host:

- la raíz de comando `openclaw qa`
- arranque y cierre de la suite
- concurrencia de workers
- escritura de artefactos
- generación de informes
- ejecución de escenarios
- aliases de compatibilidad para escenarios `qa-channel` antiguos

Los plugins de ejecutor poseen el contrato de transporte:

- cómo se monta `openclaw qa <runner>` bajo la raíz compartida `qa`
- cómo se configura el gateway para ese transporte
- cómo se comprueba la disponibilidad
- cómo se inyectan los eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado de transporte normalizado
- cómo se ejecutan las acciones respaldadas por transporte
- cómo se maneja el restablecimiento o la limpieza específicos del transporte

La barra mínima de adopción para un canal nuevo:

1. Mantén `qa-lab` como propietario de la raíz compartida `qa`.
2. Implementa el ejecutor de transporte en la seam del host compartido `qa-lab`.
3. Mantén la mecánica específica del transporte dentro del plugin de ejecutor o del harness de canal.
4. Monta el ejecutor como `openclaw qa <runner>` en lugar de registrar un comando raíz competidor. Los plugins de ejecutor deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un arreglo `qaRunnerCliRegistrations` coincidente desde `runtime-api.ts`. Mantén `runtime-api.ts` ligero; la CLI perezosa y la ejecución del runner deben permanecer detrás de entrypoints separados.
5. Crea o adapta escenarios YAML bajo los directorios temáticos `qa/scenarios/`.
6. Usa los ayudantes genéricos de escenario para escenarios nuevos.
7. Mantén funcionando los aliases de compatibilidad existentes salvo que el repositorio esté haciendo una migración intencional.

La regla de decisión es estricta:

- Si un comportamiento puede expresarse una sola vez en `qa-lab`, ponlo en `qa-lab`.
- Si un comportamiento depende de un transporte de canal, mantenlo en ese plugin de ejecutor o harness de plugin.
- Si un escenario necesita una capacidad nueva que más de un canal pueda usar, añade un ayudante genérico en lugar de una rama específica de canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico del transporte y hazlo explícito en el contrato del escenario.

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

Los aliases de compatibilidad siguen disponibles para escenarios existentes: `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus`, pero la autoría de escenarios nuevos debe usar los nombres genéricos. Los aliases existen para evitar una migración de día único, no como el modelo a seguir.

## Informes

`qa-lab` exporta un informe de protocolo en Markdown desde la línea de tiempo observada del bus.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué quedó bloqueado
- Qué escenarios de seguimiento vale la pena añadir

Para el inventario de escenarios disponibles, útil al dimensionar trabajo de seguimiento o conectar un transporte nuevo, ejecuta `pnpm openclaw qa coverage` (añade `--json` para salida legible por máquina).
Al elegir prueba enfocada para un comportamiento o ruta de archivo tocados, ejecuta `pnpm openclaw qa coverage --match <query>`.
El informe de coincidencias busca en metadatos de escenario, refs de docs, refs de código, ID de cobertura, plugins y requisitos de proveedor, y luego imprime objetivos `qa suite --scenario ...` coincidentes.
Cada ejecución de `qa suite` escribe artefactos de nivel superior `qa-evidence.json`,
`qa-suite-summary.json` y `qa-suite-report.md` para el conjunto de
escenarios seleccionado. Los escenarios que declaran `execution.kind: vitest` o
`execution.kind: playwright` ejecutan la ruta de prueba correspondiente y también escriben
logs por escenario. Los escenarios que declaran `execution.kind: script` ejecutan el
productor de evidencia en `execution.path` mediante `node --import tsx` (con
`${outputDir}` y `${scenarioId}` expandidos en `execution.args`); el productor
escribe su propio `qa-evidence.json`, cuyas entradas se importan en la salida de
la suite y cuyas rutas de artefactos se resuelven relativas a ese
`qa-evidence.json` del productor. Cuando se llega a `qa suite` a través de
`qa run --qa-profile`, el mismo `qa-evidence.json` también incluye el resumen de
scorecard del perfil para las categorías de taxonomía seleccionadas.
Trátalo como una ayuda de descubrimiento, no como reemplazo de una puerta; el escenario seleccionado aún necesita el modo de proveedor correcto, transporte live, Multipass, Testbox o carril de release para el comportamiento bajo prueba.
Para contexto del scorecard, consulta [Scorecard de madurez](/es/maturity/scorecard).

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario en varios refs de modelo live
y escribe un informe Markdown juzgado:

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

El comando ejecuta procesos hijo locales de gateway QA, no Docker. Los escenarios de evaluación de carácter
deben establecer la persona mediante `SOUL.md`, y luego ejecutar turnos de usuario ordinarios
como chat, ayuda de workspace y tareas pequeñas de archivos. Al modelo candidato no se le debe
decir que está siendo evaluado. El comando conserva cada transcripción completa,
registra estadísticas básicas de ejecución y luego pide a los modelos juez en modo rápido con
razonamiento `xhigh` donde esté soportado que clasifiquen las ejecuciones por naturalidad, vibra y humor.
Usa `--blind-judge-models` al comparar proveedores: el prompt del juez aún recibe
cada transcripción y estado de ejecución, pero los refs de candidatos se reemplazan por etiquetas
neutrales como `candidate-01`; el informe mapea las clasificaciones de vuelta a los refs reales después del
parseo.
Las ejecuciones candidatas usan de forma predeterminada pensamiento `high`, con `medium` para GPT-5.5 y `xhigh`
para refs de evaluación OpenAI antiguos que lo soportan. Sobrescribe un candidato específico en línea con
`--model provider/model,thinking=<level>`. `--thinking <level>` todavía establece un
fallback global, y la forma antigua `--model-thinking <provider/model=level>` se
mantiene por compatibilidad.
Los refs candidatos de OpenAI usan de forma predeterminada el modo rápido para que se use
procesamiento prioritario donde el proveedor lo soporte. Añade `,fast`, `,no-fast` o `,fast=false` en línea cuando un
candidato o juez individual necesite un override. Pasa `--fast` solo cuando quieras
forzar el modo rápido para todos los modelos candidatos. Las duraciones de candidatos y jueces se
registran en el informe para análisis de benchmarks, pero los prompts del juez dicen explícitamente
que no clasifiquen por velocidad.
Las ejecuciones de modelos candidatos y jueces usan ambas concurrencia 16 de forma predeterminada. Reduce
`--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión del gateway local
hagan que una ejecución tenga demasiado ruido.
Cuando no se pasa ningún candidato `--model`, la evaluación de carácter usa de forma predeterminada
`openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`,
`anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa ningún `--model`.
Cuando no se pasa ningún `--judge-model`, los jueces usan de forma predeterminada
`openai/gpt-5.5,thinking=xhigh,fast` y
`anthropic/claude-opus-4-8,thinking=high`.

## Documentación relacionada

- [Matriz QA](/es/concepts/qa-matrix)
- [Scorecard de madurez](/es/maturity/scorecard)
- [Paquete de benchmark para agente personal](/es/concepts/personal-agent-benchmark-pack)
- [Canal QA](/es/channels/qa-channel)
- [Pruebas](/es/help/testing)
- [Panel de control](/es/web/dashboard)
