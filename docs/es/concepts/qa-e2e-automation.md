---
read_when:
    - Comprender cómo encaja la pila de QA
    - Extender qa-lab, qa-channel o un adaptador de transporte
    - Agregar escenarios de QA respaldados por repositorio
    - Creación de automatización de QA de mayor realismo en torno al panel del Gateway
summary: 'Descripción general de la pila de QA: qa-lab, qa-channel, escenarios respaldados por repositorio, carriles de transporte en vivo, adaptadores de transporte e informes.'
title: Resumen de QA
x-i18n:
    generated_at: "2026-07-01T05:28:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 33dc2c7ac1751c8728dda332476cd41cf39c3e9d1582f8c652c2670c2549b34c
    source_path: concepts/qa-e2e-automation.md
    workflow: 16
---

La pila privada de QA está pensada para ejercitar OpenClaw de una forma más realista,
con forma de canal, que lo que permite una sola prueba unitaria.

Piezas actuales:

- `extensions/qa-channel`: canal sintético de mensajes con superficies de DM, canal, hilo,
  reacción, edición y eliminación.
- `extensions/qa-lab`: UI de depuración y bus de QA para observar la transcripción,
  inyectar mensajes entrantes y exportar un informe Markdown.
- `extensions/qa-matrix`, futuros plugins ejecutores: adaptadores de transporte en vivo que
  controlan un canal real dentro de un gateway de QA hijo.
- `qa/`: recursos semilla respaldados por el repositorio para la tarea inicial y los escenarios de QA
  base.
- [Mantis](/es/concepts/mantis): verificación en vivo antes y después para errores que
  necesitan transportes reales, capturas de pantalla del navegador, estado de VM y evidencia de PR.

## Superficie de comandos

Todo flujo de QA se ejecuta bajo `pnpm openclaw qa <subcommand>`. Muchos tienen alias de scripts `pnpm qa:*`;
ambas formas son compatibles.

| Comando                                             | Propósito                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `qa run`                                            | Autocomprobación de QA incluida sin `--qa-profile`; ejecutor de perfiles de madurez respaldados por taxonomía con `--qa-profile smoke-ci`, `--qa-profile release` o `--qa-profile all`.                                                                                                      |
| `qa suite`                                          | Ejecuta escenarios respaldados por el repositorio contra el carril del Gateway de QA. Alias: `pnpm openclaw qa suite --runner multipass` para una VM Linux desechable.                                                                                                                                  |
| `qa coverage`                                       | Imprime el inventario de cobertura de escenarios YAML (`--json` para salida legible por máquinas).                                                                                                                                                                                               |
| `qa parity-report`                                  | Compara dos archivos `qa-suite-summary.json` y escribe el informe de paridad agéntico, o usa `--runtime-axis --token-efficiency` para escribir informes de paridad de runtime y eficiencia de tokens Codex-vs-OpenClaw a partir de un resumen de par de runtimes.                                         |
| `qa character-eval`                                 | Ejecuta el escenario de QA de carácter en varios modelos en vivo con un informe evaluado. Consulta [Informes](#reporting).                                                                                                                                                            |
| `qa manual`                                         | Ejecuta un prompt único contra el carril de proveedor/modelo seleccionado.                                                                                                                                                                                                          |
| `qa ui`                                             | Inicia la UI de depuración de QA y el bus de QA local (alias: `pnpm qa:lab:ui`).                                                                                                                                                                                                    |
| `qa docker-build-image`                             | Construye la imagen Docker de QA prehorneada.                                                                                                                                                                                                                                     |
| `qa docker-scaffold`                                | Escribe un andamiaje de docker-compose para el panel de QA + el carril del Gateway.                                                                                                                                                                                                    |
| `qa up`                                             | Construye el sitio de QA, inicia la pila respaldada por Docker e imprime la URL (alias: `pnpm qa:lab:up`; la variante `:fast` agrega `--use-prebuilt-image --bind-ui-dist --skip-ui-build`).                                                                                                  |
| `qa aimock`                                         | Inicia solo el servidor del proveedor AIMock.                                                                                                                                                                                                                                  |
| `qa mock-openai`                                    | Inicia solo el servidor del proveedor `mock-openai` consciente del escenario.                                                                                                                                                                                                            |
| `qa credentials doctor` / `add` / `list` / `remove` | Administra el grupo compartido de credenciales Convex.                                                                                                                                                                                                                               |
| `qa matrix`                                         | Carril de transporte en vivo contra un homeserver Tuwunel desechable. Consulta [QA de Matrix](/es/concepts/qa-matrix).                                                                                                                                                                      |
| `qa telegram`                                       | Carril de transporte en vivo contra un grupo privado real de Telegram.                                                                                                                                                                                                              |
| `qa discord`                                        | Carril de transporte en vivo contra un canal de guild privado real de Discord.                                                                                                                                                                                                       |
| `qa slack`                                          | Carril de transporte en vivo contra un canal privado real de Slack.                                                                                                                                                                                                               |
| `qa whatsapp`                                       | Carril de transporte en vivo contra cuentas reales de WhatsApp Web.                                                                                                                                                                                                                 |
| `qa mantis`                                         | Ejecutor de verificación antes y después para errores de transporte en vivo, con evidencia de reacciones de estado de Discord, smoke de escritorio/navegador de Crabbox y smoke de Slack-en-VNC. Consulta [Mantis](/es/concepts/mantis) y [Runbook de Mantis Slack Desktop](/es/concepts/mantis-slack-desktop-runbook). |

`qa run` respaldado por perfiles lee la pertenencia desde `taxonomy.yaml` y luego despacha
los escenarios resueltos a través de `qa suite`. `--surface` y
`--category` filtran el perfil seleccionado en lugar de definir carriles separados.
El `qa-evidence.json` resultante incluye un resumen de cuadro de mando del perfil con
recuentos de categorías seleccionadas e IDs de cobertura faltantes; las entradas individuales de evidencia
siguen siendo la fuente de verdad para las pruebas, los roles de cobertura y los resultados.
Los IDs de cobertura de características de la taxonomía son objetivos exactos de prueba, no alias. La cobertura
primaria del escenario cumple los IDs coincidentes; la cobertura secundaria sigue siendo orientativa.
Los IDs de cobertura usan la forma con puntos `namespace.behavior` con segmentos alfanuméricos/guiones
en minúsculas; los IDs de perfil, superficie y categoría aún pueden usar
los IDs de taxonomía existentes con guiones o puntos.
La evidencia reducida omite `execution` por entrada y establece `evidenceMode: "slim"`;
`smoke-ci` usa reducida de forma predeterminada, y `--evidence-mode full` restaura las entradas completas:

```bash
pnpm openclaw qa run \
  --qa-profile smoke-ci \
  --category channel-framework.conversation-routing-and-delivery \
  --provider-mode mock-openai \
  --output-dir .artifacts/qa-e2e/smoke-ci-profile-dispatch
```

Usa `smoke-ci` para prueba determinista de perfiles con proveedores de modelos simulados y
servidores de proveedor local Crabline. Usa `release` para prueba Stable/LTS contra canales
en vivo. Usa `all` solo para ejecuciones explícitas de evidencia de taxonomía completa; selecciona
todas las categorías de madurez activas y se puede despachar mediante el workflow `QA Profile
Evidence` con `qa_profile=all`. Cuando un comando también necesita un perfil raíz de OpenClaw,
coloca el perfil raíz antes del comando de QA:

```bash
pnpm openclaw --profile work qa run --qa-profile smoke-ci
```

## Flujo del operador

El flujo actual del operador de QA es un sitio de QA de dos paneles:

- Izquierda: panel del Gateway (Control UI) con el agente.
- Derecha: QA Lab, que muestra la transcripción tipo Slack y el plan del escenario.

Ejecútalo con:

```bash
pnpm qa:lab:up
```

Eso construye el sitio de QA, inicia el carril de Gateway respaldado por Docker y expone la
página de QA Lab donde un operador o bucle de automatización puede dar al agente una misión de QA,
observar el comportamiento real del canal y registrar qué funcionó, falló o
quedó bloqueado.

Para una iteración más rápida de la UI de QA Lab local sin reconstruir la imagen Docker cada vez,
inicia la pila con un paquete de QA Lab montado por bind mount:

```bash
pnpm openclaw qa docker-build-image
pnpm qa:lab:build
pnpm qa:lab:up:fast
pnpm qa:lab:watch
```

`qa:lab:up:fast` mantiene los servicios Docker en una imagen preconstruida y monta por bind mount
`extensions/qa-lab/web/dist` en el contenedor `qa-lab`. `qa:lab:watch`
reconstruye ese paquete al cambiar, y el navegador se recarga automáticamente cuando cambia el hash
de recursos de QA Lab.

Para un smoke local de señal OpenTelemetry, ejecuta:

```bash
pnpm qa:otel:smoke
```

Ese script inicia un receptor OTLP/HTTP local, ejecuta el escenario de QA `otel-trace-smoke`
con el plugin `diagnostics-otel` habilitado, y luego verifica que se exporten trazas,
métricas y registros. Decodifica los spans de traza protobuf exportados
y comprueba la forma crítica para la release:
`openclaw.run`, `openclaw.harness.run`, un span de llamada de modelo de la convención semántica GenAI más reciente,
`openclaw.context.assembled` y `openclaw.message.delivery`
deben estar presentes. El smoke fuerza
`OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, por lo que el span de llamada de modelo
debe usar el nombre `{gen_ai.operation.name} {gen_ai.request.model}`;
las llamadas de modelo no deben exportar `StreamAbandoned` en turnos correctos; los IDs de diagnóstico sin procesar y
los atributos `openclaw.content.*` deben quedar fuera de la traza. Las cargas OTLP sin procesar
no deben contener el centinela del prompt, el centinela de respuesta ni la clave de sesión de QA.
Escribe `otel-smoke-summary.json` junto a los artefactos de la suite de QA.

Para un smoke de OpenTelemetry respaldado por collector, ejecuta:

```bash
pnpm qa:otel:collector-smoke
```

Ese carril coloca un contenedor Docker real de OpenTelemetry Collector delante del
mismo receptor local. Úsalo al cambiar el cableado de endpoints, la compatibilidad con collector
o el comportamiento de exportación OTLP que el receptor en proceso podría enmascarar.

Para el smoke de scrape protegido de Prometheus, ejecuta:

```bash
pnpm qa:prometheus:smoke
```

Ese alias ejecuta el escenario de QA `docker-prometheus-smoke` con
`diagnostics-prometheus` habilitado, verifica que los scrapes no autenticados se
rechacen, y luego comprueba que el scrape autenticado incluya familias de
métricas críticas para la versión sin contenido de prompts, contenido de
respuestas, identificadores de diagnóstico sin procesar, tokens de autenticación
ni rutas locales.

Para ejecutar ambos smokes de observabilidad seguidos, usa:

```bash
pnpm qa:observability:smoke
```

Para el carril de OpenTelemetry respaldado por collector más el smoke de scrape
protegido de Prometheus, usa:

```bash
pnpm qa:observability:collector-smoke
```

La QA de observabilidad sigue siendo solo para checkouts de código fuente. El
tarball de npm omite intencionalmente QA Lab, por lo que los carriles Docker de
lanzamiento de paquetes no ejecutan comandos `qa`. Usa
`pnpm qa:otel:smoke`, `pnpm qa:prometheus:smoke` o
`pnpm qa:observability:smoke` desde un checkout de código fuente compilado
cuando cambies la instrumentación de diagnósticos.

Para un carril de smoke Matrix con transporte real que no requiere credenciales
de proveedor de modelos, ejecuta el perfil rápido con el proveedor OpenAI mock
determinista:

```bash
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode mock-openai --profile fast --fail-fast
```

Para el carril del proveedor live-frontier, proporciona explícitamente
credenciales compatibles con OpenAI:

```bash
OPENCLAW_LIVE_OPENAI_KEY="${OPENAI_API_KEY}" \
OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000 \
  pnpm openclaw qa matrix --provider-mode live-frontier --profile fast --fail-fast
```

La referencia completa de la CLI, el catálogo de perfiles/escenarios, las variables de entorno y el diseño de artefactos para este carril están en [QA de Matrix](/es/concepts/qa-matrix). En resumen: aprovisiona un homeserver Tuwunel desechable en Docker, registra usuarios temporales de controlador/SUT/observador, ejecuta el Plugin Matrix real dentro de un Gateway de QA hijo acotado a ese transporte (sin `qa-channel`), y luego escribe un informe Markdown, un resumen JSON, un artefacto de eventos observados y un registro combinado de salida en `.artifacts/qa-e2e/matrix-<timestamp>/`.

Los escenarios cubren comportamiento de transporte que las pruebas unitarias no pueden demostrar de punta a punta: control de menciones, políticas allow-bot, listas de permitidos, respuestas de nivel superior y en hilos, enrutamiento de DM, manejo de reacciones, supresión de ediciones entrantes, deduplicación de replay al reiniciar, recuperación ante interrupciones del homeserver, entrega de metadatos de aprobación, manejo de medios y flujos de arranque/recuperación/verificación de E2EE de Matrix. El perfil CLI de E2EE también ejecuta `openclaw matrix encryption setup` y comandos de verificación a través del mismo homeserver desechable antes de comprobar las respuestas del Gateway.

Discord también tiene escenarios opcionales solo de Mantis para reproducción de
errores. Usa `--scenario discord-status-reactions-tool-only` para la línea de
tiempo explícita de reacciones de estado, o
`--scenario discord-thread-reply-filepath-attachment` para crear un hilo real
de Discord y verificar que `message.thread-reply` preserve un adjunto
`filePath`. Estos escenarios quedan fuera del carril Discord live
predeterminado porque son sondas de reproducción de antes/después, no cobertura
amplia de smoke. El flujo de trabajo Mantis de adjuntos en hilos también puede
agregar un video testigo de Discord Web con sesión iniciada cuando
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_DIR` o
`MANTIS_DISCORD_VIEWER_CHROME_PROFILE_TGZ_B64` está configurado en el entorno de
QA. Ese perfil de visor es solo para captura visual; la decisión de aprobado o
fallido sigue viniendo del oráculo REST de Discord.

CI usa la misma superficie de comandos en `.github/workflows/qa-live-transports-convex.yml`.
Las ejecuciones programadas y manuales predeterminadas ejecutan el perfil Matrix
rápido con credenciales live-frontier proporcionadas por QA, `--fast` y
`OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS=3000`. El `matrix_profile=all` manual se
distribuye en los cinco shards de perfil.

Para carriles de smoke con transporte real de Telegram, Discord, Slack y WhatsApp:

```bash
pnpm openclaw qa telegram
pnpm openclaw qa discord
pnpm openclaw qa slack
pnpm openclaw qa whatsapp
```

Apuntan a un canal real preexistente con dos bots o cuentas (controlador + SUT). Las variables de entorno requeridas, las listas de escenarios, los artefactos de salida y el pool de credenciales de Convex están documentados en la [referencia de QA de Telegram, Discord, Slack y WhatsApp](#telegram-discord-slack-and-whatsapp-qa-reference) más abajo.

Para una ejecución completa de VM de escritorio Slack con rescate por VNC, ejecuta:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --gateway-setup \
  --scenario slack-canary \
  --keep-lease
```

Ese comando arrienda una máquina Crabbox de escritorio/navegador, ejecuta el
carril live de Slack dentro de la VM, abre Slack Web en el navegador VNC,
captura el escritorio y copia `slack-qa/`, `slack-desktop-smoke.png` y
`slack-desktop-smoke.mp4` cuando hay captura de video disponible de vuelta al
directorio de artefactos de Mantis. Los arriendos de escritorio/navegador de
Crabbox proporcionan por adelantado las herramientas de captura y los paquetes
auxiliares de navegador/compilación nativa, por lo que el escenario solo debería
instalar alternativas en arriendos antiguos. Mantis informa tiempos totales y
por fase en `mantis-slack-desktop-smoke-report.md`, de modo que las ejecuciones
lentas muestran si el tiempo se fue en el calentamiento del arriendo, la
adquisición de credenciales, la configuración remota o la copia de artefactos.
Reutiliza `--lease-id <cbx_...>` después de iniciar sesión manualmente en Slack
Web mediante VNC; los arriendos reutilizados también mantienen caliente la caché
de la tienda pnpm de Crabbox. El valor predeterminado `--hydrate-mode source`
verifica desde un checkout de código fuente y ejecuta install/build dentro de la
VM. Usa `--hydrate-mode prehydrated` solo cuando el workspace remoto reutilizado
ya tiene `node_modules` y un `dist/` compilado; ese modo omite el paso costoso de
install/build y falla cerrado cuando el workspace no está listo. Con
`--gateway-setup`, Mantis deja un Gateway persistente de OpenClaw para Slack
ejecutándose dentro de la VM en el puerto `38973`; sin eso, el comando ejecuta
el carril normal de QA de Slack bot a bot y sale después de capturar artefactos.

Para demostrar la UI nativa de aprobación de Slack con evidencia de escritorio,
ejecuta el modo de checkpoints de aprobación de Mantis:

```bash
pnpm openclaw qa mantis slack-desktop-smoke \
  --approval-checkpoints \
  --credential-source convex \
  --credential-role maintainer
```

Este modo es mutuamente excluyente con `--gateway-setup`. Ejecuta los escenarios
de aprobación de Slack, rechaza ids de escenarios que no sean de aprobación,
espera en cada estado de aprobación pendiente y resuelto, renderiza el mensaje
observado de la API de Slack en `approval-checkpoints/<scenario>-pending.png` y
`approval-checkpoints/<scenario>-resolved.png`, y luego falla si falta o está
vacío algún checkpoint, evidencia de mensaje, acuse de recibo o captura
renderizada. Los arriendos fríos de CI aún pueden mostrar el inicio de sesión de
Slack en `slack-desktop-smoke.png`; las imágenes de checkpoints de aprobación
son la prueba visual de este carril.

La lista de verificación del operador, el comando de dispatch del flujo de trabajo de GitHub, el contrato de comentarios de evidencia, la tabla de decisión de hydrate-mode, la interpretación de tiempos y los pasos de manejo de fallos están en el [runbook de Mantis Slack Desktop](/es/concepts/mantis-slack-desktop-runbook).

Para una tarea de escritorio de estilo agente/CV, ejecuta:

```bash
pnpm openclaw qa mantis visual-task \
  --browser-url https://example.net \
  --expect-text "Example Domain" \
  --vision-model openai/gpt-5.5
```

`visual-task` arrienda o reutiliza una máquina Crabbox de escritorio/navegador,
inicia `crabbox record --while`, controla el navegador visible mediante un
`visual-driver` anidado, captura `visual-task.png`, ejecuta
`openclaw infer image describe` contra la captura cuando se selecciona
`--vision-mode image-describe`, y escribe `visual-task.mp4`,
`mantis-visual-task-summary.json`, `mantis-visual-task-driver-result.json` y
`mantis-visual-task-report.md`. Cuando `--expect-text` está configurado, el
prompt de visión pide un veredicto JSON estructurado y solo aprueba cuando el
modelo informa evidencia visible positiva; una respuesta negativa que solo cita
el texto objetivo falla la aserción. Usa `--vision-mode metadata` para un smoke
sin modelo que demuestre la plomería de escritorio, navegador, captura y video
sin llamar a un proveedor de comprensión de imágenes. La grabación es un
artefacto obligatorio para `visual-task`; si Crabbox no graba un
`visual-task.mp4` no vacío, la tarea falla incluso si el controlador visual
aprobó. En caso de fallo, Mantis conserva el arriendo para VNC salvo que la
tarea ya hubiera aprobado y `--keep-lease` no estuviera configurado.

Antes de usar credenciales live agrupadas, ejecuta:

```bash
pnpm openclaw qa credentials doctor
```

El doctor comprueba el entorno del broker de Convex, valida la configuración de endpoints y verifica la accesibilidad de admin/list cuando el secreto de maintainer está presente. Solo informa el estado configurado/faltante de los secretos.

## Cobertura de transportes live

Los carriles de transporte live comparten un contrato en lugar de que cada uno invente su propia forma de lista de escenarios. `qa-channel` es la suite sintética amplia de comportamiento de producto y no forma parte de la matriz de cobertura de transportes live.

Los runners de transporte live deberían importar los ids de escenarios
compartidos, los helpers de cobertura base y el helper de selección de
escenarios desde `openclaw/plugin-sdk/qa-live-transport-scenarios`.

| Carril   | Canary | Control de menciones | Bot a bot | Bloqueo por lista de permitidos | Respuesta de nivel superior | Respuesta citada | Reanudación tras reinicio | Seguimiento de hilo | Aislamiento de hilos | Observación de reacciones | Comando de ayuda | Registro de comandos nativos |
| -------- | ------ | -------------------- | --------- | ------------------------------- | --------------------------- | ---------------- | -------------------------- | ------------------- | -------------------- | -------------------------- | ---------------- | ---------------------------- |
| Matrix   | x      | x                    | x         | x                               | x                           |                  | x                          | x                   | x                    | x                          |                  |                              |
| Telegram | x      | x                    | x         |                                 |                             |                  |                            |                     |                      |                            | x                |                              |
| Discord  | x      | x                    | x         |                                 |                             |                  |                            |                     |                      |                            |                  | x                            |
| Slack    | x      | x                    | x         | x                               | x                           |                  | x                          | x                   | x                    |                            |                  |                              |
| WhatsApp | x      | x                    |           | x                               | x                           | x                | x                          |                     |                      | x                          | x                |                              |

Esto mantiene `qa-channel` como la suite amplia de comportamiento de producto mientras Matrix,
Telegram y otros transportes live comparten una única lista explícita de comprobación del contrato de transporte.

Para un carril de VM Linux desechable sin introducir Docker en la ruta de QA, ejecuta:

```bash
pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline
```

Esto arranca un invitado Multipass nuevo, instala dependencias, compila OpenClaw
dentro del invitado, ejecuta `qa suite` y luego copia el informe normal de QA y
el resumen de vuelta a `.artifacts/qa-e2e/...` en el host.
Reutiliza el mismo comportamiento de selección de escenarios que `qa suite` en
el host. Las ejecuciones de suite en host y Multipass ejecutan varios escenarios
seleccionados en paralelo con workers de Gateway aislados de forma
predeterminada. `qa-channel` usa concurrencia 4 de forma predeterminada, limitada
por el número de escenarios seleccionados. Usa `--concurrency <count>` para
ajustar el número de workers, o `--concurrency 1` para ejecución serial.
Usa `--pack personal-agent` para ejecutar el pack de benchmark de asistente
personal. El selector de pack es aditivo con flags `--scenario` repetidos: los
escenarios explícitos se ejecutan primero, luego los escenarios del pack se
ejecutan en orden del pack con duplicados eliminados. Usa `--pack observability`
cuando un runner de QA personalizado ya proporciona la configuración del
collector de OpenTelemetry y quiere seleccionar juntos los escenarios de smoke
de diagnósticos de OpenTelemetry y Prometheus.
El comando sale con un código distinto de cero cuando falla algún escenario. Usa
`--allow-failures` cuando quieras artefactos sin un código de salida fallido.
Las ejecuciones live reenvían las entradas de autenticación de QA compatibles
que son prácticas para el invitado: claves de proveedor basadas en entorno, la
ruta de configuración del proveedor live de QA y `CODEX_HOME` cuando está
presente. Mantén `--output-dir` bajo la raíz del repositorio para que el
invitado pueda escribir de vuelta a través del workspace montado.

## Referencia de QA para Telegram, Discord, Slack y WhatsApp

Matrix tiene una [página dedicada](/es/concepts/qa-matrix) debido a su cantidad de escenarios y al aprovisionamiento de homeserver respaldado por Docker. Telegram, Discord, Slack y WhatsApp se ejecutan contra transportes reales preexistentes, por lo que su referencia vive aquí.

### Flags de CLI compartidos

Estos carriles se registran mediante `extensions/qa-lab/src/live-transports/shared/live-transport-cli.ts` y aceptan los mismos flags:

| Flag                                  | Predeterminado                                    | Descripción                                                                                                                                                    |
| ------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--scenario <id>`                     | -                                                 | Ejecuta solo este escenario. Repetible.                                                                                                                        |
| `--output-dir <path>`                 | `<repo>/.artifacts/qa-e2e/<transport>-<timestamp>` | Dónde se escriben los informes, resúmenes, evidencias, artefactos específicos del transporte y el log de salida. Las rutas relativas se resuelven contra `--repo-root`. |
| `--repo-root <path>`                  | `process.cwd()`                                   | Raíz del repositorio al invocar desde un cwd neutro.                                                                                                           |
| `--sut-account <id>`                  | `sut`                                             | Id de cuenta temporal dentro de la configuración del Gateway de QA.                                                                                            |
| `--provider-mode <mode>`              | `live-frontier`                                   | `mock-openai` o `live-frontier` (`live-openai` heredado aún funciona).                                                                                         |
| `--model <ref>` / `--alt-model <ref>` | predeterminado del proveedor                      | Refs de modelo primario/alternativo.                                                                                                                          |
| `--fast`                              | desactivado                                       | Modo rápido del proveedor cuando está soportado.                                                                                                               |
| `--credential-source <env\|convex>`   | `env`                                             | Consulta [pool de credenciales de Convex](#convex-credential-pool).                                                                                            |
| `--credential-role <maintainer\|ci>`  | `ci` en CI, `maintainer` en caso contrario        | Rol usado cuando `--credential-source convex`.                                                                                                                 |

Cada carril sale con código distinto de cero ante cualquier escenario fallido. `--allow-failures` escribe artefactos sin establecer un código de salida fallido.

### QA de Telegram

```bash
pnpm openclaw qa telegram
```

Apunta a un grupo privado real de Telegram con dos bots distintos (controlador + SUT). El bot SUT debe tener un nombre de usuario de Telegram; la observación bot a bot funciona mejor cuando ambos bots tienen **Bot-to-Bot Communication Mode** habilitado en `@BotFather`.

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

El conjunto predeterminado implícito siempre cubre canary, control de menciones, respuestas de comandos nativos, direccionamiento de comandos y respuestas de grupo bot a bot. Los valores predeterminados de `mock-openai` también incluyen verificaciones deterministas de cadena de respuestas y streaming de mensaje final. `telegram-current-session-status-tool` permanece opt-in porque solo es estable cuando se encadena directamente después de canary, no después de respuestas arbitrarias de comandos nativos. Usa `pnpm openclaw qa telegram --list-scenarios --provider-mode mock-openai` para imprimir la división actual predeterminada/opcional con refs de regresión.

Artefactos de salida:

- `telegram-qa-report.md`
- `qa-evidence.json` - entradas de evidencia para las verificaciones del transporte en vivo, incluidos los campos de perfil, cobertura, proveedor, canal, artefactos, resultado y RTT.

Las ejecuciones de paquete de Telegram usan el mismo contrato de credenciales de Telegram. La medición repetida de RTT forma parte del carril en vivo normal de paquete de Telegram; la distribución de RTT se incorpora en `qa-evidence.json` bajo `result.timing` para la verificación RTT seleccionada.

```bash
OPENCLAW_QA_CREDENTIAL_SOURCE=convex \
pnpm test:docker:npm-telegram-live
```

Cuando se establece `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, el wrapper en vivo de paquete arrienda una credencial `kind: "telegram"`, exporta los env de grupo/controlador/bot SUT arrendados a la ejecución del paquete instalado, hace Heartbeat del arriendo y lo libera al apagarse. El wrapper de paquete usa por defecto 20 verificaciones RTT de `telegram-mentioned-message-reply`, un timeout RTT de 30s y el rol de Convex `maintainer` fuera de CI cuando se selecciona Convex. Sobrescribe `OPENCLAW_NPM_TELEGRAM_RTT_SAMPLES`, `OPENCLAW_NPM_TELEGRAM_RTT_TIMEOUT_MS` o `OPENCLAW_NPM_TELEGRAM_RTT_MAX_FAILURES` para ajustar la medición RTT sin crear un comando RTT separado ni un formato de resumen específico de Telegram.

### QA de Discord

```bash
pnpm openclaw qa discord
```

Apunta a un canal de guild privado real de Discord con dos bots: un bot controlador controlado por el harness y un bot SUT iniciado por el Gateway hijo de OpenClaw mediante el Plugin de Discord incluido. Verifica el manejo de menciones de canal, que el bot SUT haya registrado el comando nativo `/help` con Discord y escenarios de evidencia Mantis opt-in.

Env requerido cuando `--credential-source env`:

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
- `discord-voice-autojoin` - escenario de voz opt-in. Se ejecuta por sí solo, habilita `channels.discord.voice.autoJoin` y verifica que el estado de voz actual de Discord del bot SUT sea el canal de voz/escenario objetivo. Las credenciales de Discord de Convex pueden incluir `voiceChannelId` opcional; de lo contrario, el runner descubre el primer canal de voz/escenario visible en la guild.
- `discord-status-reactions-tool-only` - escenario Mantis opt-in. Se ejecuta por sí solo porque cambia el SUT a respuestas de guild siempre activas y solo con herramientas con `messages.statusReactions.enabled=true`; luego captura una línea de tiempo de reacciones REST además de artefactos visuales HTML/PNG. Los informes antes/después de Mantis también preservan artefactos MP4 proporcionados por el escenario como `baseline.mp4` y `candidate.mp4`.

Ejecuta explícitamente el escenario de unión automática a voz de Discord:

```bash
pnpm openclaw qa discord \
  --scenario discord-voice-autojoin \
  --provider-mode mock-openai
```

Ejecuta explícitamente el escenario de reacción de estado de Mantis:

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
- `qa-evidence.json` - entradas de evidencia para las verificaciones del transporte en vivo.
- `discord-qa-observed-messages.json` - cuerpos redactados salvo que `OPENCLAW_QA_DISCORD_CAPTURE_CONTENT=1`.
- `discord-qa-reaction-timelines.json` y `discord-status-reactions-tool-only-timeline.png` cuando se ejecuta el escenario de reacción de estado.

### QA de Slack

```bash
pnpm openclaw qa slack
```

Apunta a un canal privado real de Slack con dos bots distintos: un bot controlador controlado por el harness y un bot SUT iniciado por el Gateway hijo de OpenClaw mediante el Plugin de Slack incluido.

Env requerido cuando `--credential-source env`:

- `OPENCLAW_QA_SLACK_CHANNEL_ID`
- `OPENCLAW_QA_SLACK_DRIVER_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_BOT_TOKEN`
- `OPENCLAW_QA_SLACK_SUT_APP_TOKEN`

Opcional:

- `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en los artefactos de mensajes observados.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR` habilita puntos de control de aprobación visual para Mantis. El runner escribe `<scenario>.pending.json` y `<scenario>.resolved.json`, luego espera archivos `.ack.json` coincidentes.
- `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_TIMEOUT_MS` sobrescribe el timeout de reconocimiento del punto de control. El valor predeterminado es `120000`.

Escenarios (`extensions/qa-lab/src/live-transports/slack/slack-live.runtime.ts`):

- `slack-canary`
- `slack-mention-gating`
- `slack-allowlist-block`
- `slack-top-level-reply-shape`
- `slack-restart-resume`
- `slack-thread-follow-up`
- `slack-thread-isolation`
- `slack-approval-exec-native` - escenario opt-in de aprobación exec nativa de Slack. Solicita una aprobación exec mediante el Gateway, verifica que el mensaje de Slack tenga botones de aprobación nativos, la resuelve y verifica la actualización resuelta de Slack.
- `slack-approval-plugin-native` - escenario opt-in de aprobación nativa de Plugin de Slack. Habilita conjuntamente el reenvío de aprobación exec y de Plugin para que los eventos de Plugin no sean suprimidos por el enrutamiento de aprobación exec; luego verifica la misma ruta de UI nativa de Slack pendiente/resuelta.

Artefactos de salida:

- `slack-qa-report.md`
- `qa-evidence.json` - entradas de evidencia para las verificaciones del transporte en vivo.
- `slack-qa-observed-messages.json` - cuerpos redactados salvo que `OPENCLAW_QA_SLACK_CAPTURE_CONTENT=1`.
- `approval-checkpoints/` - solo cuando Mantis establece `OPENCLAW_QA_SLACK_APPROVAL_CHECKPOINT_DIR`; contiene JSON de puntos de control, JSON de reconocimiento y capturas de pantalla pendientes/resueltas.

#### Configurar el workspace de Slack

El carril necesita dos apps de Slack distintas en un workspace, además de un canal del que ambos bots sean miembros:

- `channelId` - el id `Cxxxxxxxxxx` de un canal al que ambos bots hayan sido invitados. Usa un canal dedicado; el carril publica en cada ejecución.
- `driverBotToken` - token de bot (`xoxb-...`) de la app **Driver**.
- `sutBotToken` - token de bot (`xoxb-...`) de la app **SUT**, que debe ser una app de Slack separada del controlador para que su id de usuario de bot sea distinto.
- `sutAppToken` - token de nivel de app (`xapp-...`) de la app SUT con `connections:write`, usado por Socket Mode para que la app SUT pueda recibir eventos.

Prefiere un workspace de Slack dedicado a QA en lugar de reutilizar un workspace de producción.

El manifiesto SUT siguiente reduce intencionalmente la instalación de producción del Plugin de Slack incluido (`extensions/slack/src/setup-shared.ts:10`) a los permisos y eventos cubiertos por la suite QA en vivo de Slack. Para la configuración de canal de producción tal como la ven los usuarios, consulta [configuración rápida del canal de Slack](/es/channels/slack#quick-setup); el par QA Driver/SUT es intencionalmente separado porque el carril necesita dos ids de usuario de bot distintos en un workspace.

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

Copia el _Token OAuth de usuario de bot_ (`xoxb-...`); eso se convierte en `driverBotToken`. El controlador solo necesita publicar mensajes e identificarse; sin eventos, sin Socket Mode.

**2. Crea la app SUT**

Repite _Crear nueva app → Desde un manifiesto_ en el mismo espacio de trabajo. Esta app de QA usa intencionalmente una versión más acotada del manifiesto de producción del Plugin de Slack incluido (`extensions/slack/src/setup-shared.ts:10`): se omiten los alcances y eventos de reacciones porque el conjunto de QA en vivo de Slack aún no cubre el manejo de reacciones.

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

- _Instalar en el espacio de trabajo_ → copia el _Token OAuth de usuario de bot_ → eso se convierte en `sutBotToken`.
- _Información básica → Tokens de nivel de app → Generar token y alcances_ → agrega el alcance `connections:write` → guarda → copia el valor `xapp-...` → eso se convierte en `sutAppToken`.

Verifica que los dos bots tengan identificadores de usuario distintos llamando a `auth.test` en cada token. El runtime distingue entre el controlador y el SUT por el identificador de usuario; reutilizar una app para ambos fallará de inmediato en la compuerta de menciones.

**3. Crea el canal**

En el espacio de trabajo de QA, crea un canal (por ejemplo, `#openclaw-qa`) e invita a ambos bots desde dentro del canal:

```
/invite @OpenClaw QA Driver
/invite @OpenClaw QA SUT
```

Copia el identificador `Cxxxxxxxxxx` de _información del canal → Acerca de → ID del canal_; eso se convierte en `channelId`. Un canal público funciona; si usas un canal privado, ambas apps ya tienen `groups:history`, así que las lecturas de historial del arnés seguirán funcionando.

**4. Registra las credenciales**

Hay dos opciones. Usa variables de entorno para depuración en una sola máquina (define las cuatro variables `OPENCLAW_QA_SLACK_*` y pasa `--credential-source env`), o siembra el pool compartido de Convex para que CI y otros mantenedores puedan arrendarlas.

Para el pool de Convex, escribe los cuatro campos en un archivo JSON:

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

Ejecuta el carril localmente para confirmar que ambos bots pueden hablar entre sí a través del broker:

```bash
pnpm openclaw qa slack \
  --credential-source convex \
  --credential-role maintainer \
  --output-dir .artifacts/qa-e2e/slack-local
```

Una ejecución verde se completa en mucho menos de 30 segundos y `slack-qa-report.md` muestra tanto `slack-canary` como `slack-mention-gating` con estado `pass`. Si el carril se queda colgado durante ~90 segundos y sale con `Convex credential pool exhausted for kind "slack"`, o el pool está vacío o todas las filas están arrendadas; `qa credentials list --kind slack --status all --json` te dirá cuál.

### QA de WhatsApp

```bash
pnpm openclaw qa whatsapp
```

Apunta a dos cuentas dedicadas de WhatsApp Web: una cuenta controladora manejada por
el arnés y una cuenta SUT iniciada por el Gateway hijo de OpenClaw a través del
Plugin de WhatsApp incluido.

Entorno requerido cuando `--credential-source env`:

- `OPENCLAW_QA_WHATSAPP_DRIVER_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_SUT_PHONE_E164`
- `OPENCLAW_QA_WHATSAPP_DRIVER_AUTH_ARCHIVE_BASE64`
- `OPENCLAW_QA_WHATSAPP_SUT_AUTH_ARCHIVE_BASE64`

Opcional:

- `OPENCLAW_QA_WHATSAPP_GROUP_JID` habilita escenarios de grupo como
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-broadcast-group-fanout`, `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`, escenarios de acción, medios y encuestas de grupo, y
  `whatsapp-group-allowlist-block`.
- `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1` conserva los cuerpos de los mensajes en
  artefactos de mensajes observados.

Catálogo de escenarios (`extensions/qa-lab/src/live-transports/whatsapp/whatsapp-live.runtime.ts`):

- Línea base y compuerta de grupo: `whatsapp-canary`, `whatsapp-pairing-block`,
  `whatsapp-mention-gating`, `whatsapp-group-pending-history-context`,
  `whatsapp-group-activation-always`,
  `whatsapp-group-reply-to-bot-triggers`,
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
- Acciones de mensajes en la ruta de usuario: `whatsapp-agent-message-action-react` parte de
  un DM real del controlador, permite que el modelo llame a la herramienta `message` y observa la
  reacción nativa de WhatsApp. `whatsapp-agent-message-action-upload-file` usa
  la misma postura para `message(action=upload-file)` y observa medios nativos de
  WhatsApp. `whatsapp-group-agent-message-action-react` y
  `whatsapp-group-agent-message-action-upload-file` prueban las mismas acciones visibles para el usuario
  en un grupo real de WhatsApp.
- Difusión a grupo: `whatsapp-broadcast-group-fanout` parte de un mensaje mencionado
  de grupo de WhatsApp y verifica respuestas visibles distintas de `main` y
  `qa-second`.
- Activación de grupo: `whatsapp-group-activation-always` cambia una sesión real de grupo
  a `/activation always`, prueba que un mensaje de grupo sin mención despierta
  al agente y luego restaura `/activation mention`. `whatsapp-group-reply-to-bot-triggers`
  siembra una respuesta del bot, envía una respuesta nativa citada a ella sin una mención
  explícita y verifica que el agente despierta desde ese contexto de respuesta.
- Medios entrantes y mensajes estructurados: `whatsapp-inbound-image-caption`,
  `whatsapp-audio-preflight`, `whatsapp-inbound-structured-messages`,
  `whatsapp-group-audio-gating`, `whatsapp-inbound-reaction-no-trigger`.
  Estos envían eventos reales de imagen, audio, documento, ubicación, contacto, sticker
  y reacción de WhatsApp a través del controlador.
- Sondas directas de contrato de Gateway:
  `whatsapp-outbound-media-matrix`,
  `whatsapp-outbound-document-preserves-filename`, `whatsapp-outbound-poll`,
  `whatsapp-group-outbound-media`, `whatsapp-group-outbound-poll`,
  `whatsapp-message-actions`, `whatsapp-reply-context-isolation`,
  `whatsapp-reply-delivery-shape`. Estas omiten a propósito la solicitud al modelo y
  prueban contratos deterministas de `send`, `poll` y `message.action` de Gateway/canal.
- Cobertura de control de acceso: `whatsapp-access-control-dm-open`,
  `whatsapp-access-control-dm-disabled`, `whatsapp-access-control-group-open`,
  `whatsapp-access-control-group-disabled`, `whatsapp-group-allowlist-block`.
- Aprobaciones nativas: `whatsapp-approval-exec-deny-native`,
  `whatsapp-approval-exec-native`, `whatsapp-approval-exec-reaction-native`,
  `whatsapp-approval-exec-group-reaction-native`,
  `whatsapp-approval-plugin-native`.
- Reacciones de estado: `whatsapp-status-reactions`,
  `whatsapp-status-reaction-lifecycle`.

El catálogo contiene actualmente 50 escenarios. El carril predeterminado `live-frontier` se
mantiene pequeño, con 10 escenarios, para una cobertura smoke rápida. El carril predeterminado
`mock-openai` ejecuta 44 escenarios deterministas a través del transporte real de WhatsApp mientras
simula únicamente la salida del modelo. Los escenarios de aprobación y algunas comprobaciones más pesadas o bloqueantes
siguen siendo explícitos por identificador de escenario.

El controlador de QA de WhatsApp observa eventos en vivo estructurados (`text`, `media`,
`location`, `reaction` y `poll`) y puede enviar activamente medios, encuestas,
contactos, ubicaciones y stickers. QA Lab importa ese controlador a través de la
superficie de paquete `@openclaw/whatsapp/api.js` en lugar de acceder a archivos privados
del runtime de WhatsApp. Para observaciones de grupo, `fromJid` es el JID del grupo, mientras
`participantJid` y `fromPhoneE164` identifican al participante remitente. El contenido de los
mensajes se redacta por defecto. Las sondas directas de Gateway de
encuesta, upload-file, medios, encuesta de grupo, medios de grupo y forma de respuesta son comprobaciones de contrato de transporte/API;
no se tratan como prueba de que una solicitud de usuario hizo que el agente eligiera
la misma acción. La prueba de acción en la ruta de usuario proviene de escenarios como
`whatsapp-agent-message-action-react` y
`whatsapp-group-agent-message-action-react`, donde el controlador envía un mensaje normal de
WhatsApp y QA Lab observa el artefacto nativo de WhatsApp resultante.
Los informes de WhatsApp incluyen la postura de cada escenario (`user-path`, `direct-gateway`,
o `native-approval`) para que la evidencia no se confunda con un contrato más fuerte
de lo que realmente prueba.

Artefactos de salida:

- `whatsapp-qa-report.md`
- `qa-evidence.json`: entradas de evidencia para las comprobaciones de transporte en vivo.
- `whatsapp-qa-observed-messages.json`: cuerpos redactados salvo que `OPENCLAW_QA_WHATSAPP_CAPTURE_CONTENT=1`.

### Pool de credenciales de Convex

Los carriles de Telegram, Discord, Slack y WhatsApp pueden arrendar credenciales de un pool compartido de Convex en lugar de leer las variables de entorno anteriores. Pasa `--credential-source convex` (o define `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`); QA Lab adquiere un arrendamiento exclusivo, le envía Heartbeat durante la ejecución y lo libera al apagarse. Los tipos de pool son `"telegram"`, `"discord"`, `"slack"` y `"whatsapp"`.

Formas de payload que el broker valida en `admin/add`:

- Telegram (`kind: "telegram"`): `{ groupId: string, driverToken: string, sutToken: string }` - `groupId` debe ser una cadena de chat-id numérica.
- Usuario real de Telegram (`kind: "telegram-user"`): `{ groupId: string, sutToken: string, testerUserId: string, testerUsername: string, telegramApiId: string, telegramApiHash: string, tdlibDatabaseEncryptionKey: string, tdlibArchiveBase64: string, tdlibArchiveSha256: string, desktopTdataArchiveBase64: string, desktopTdataArchiveSha256: string }` - Solo prueba de Mantis Telegram Desktop. Los carriles genéricos de QA Lab no deben adquirir este tipo.
- Discord (`kind: "discord"`): `{ guildId: string, channelId: string, driverBotToken: string, sutBotToken: string, sutApplicationId: string }`.
- WhatsApp (`kind: "whatsapp"`): `{ driverPhoneE164: string, sutPhoneE164: string, driverAuthArchiveBase64: string, sutAuthArchiveBase64: string, groupJid?: string }` - los números de teléfono deben ser cadenas E.164 distintas.

El flujo de prueba de Mantis Telegram Desktop mantiene una concesión exclusiva de Convex
`telegram-user` tanto para el controlador CLI de TDLib como para el testigo de Telegram Desktop,
y luego la libera después de publicar la prueba.

Cuando un PR necesita una diferencia visual determinista, Mantis puede usar la misma respuesta
de modelo simulado en `main` y en la cabecera del PR mientras cambia el formateador de Telegram
o la capa de entrega. Los valores predeterminados de captura están ajustados para comentarios de PR:
clase Crabbox estándar, grabación de escritorio a 24 fps, GIF de movimiento a 24 fps y ancho de
vista previa de 1920 px. Los comentarios de antes/después deben publicar un paquete limpio que
contenga solo los GIF previstos.

Los carriles de Slack también pueden usar el grupo. Las comprobaciones de forma de carga útil de Slack actualmente viven en el ejecutor de QA de Slack en lugar del broker; usa `{ channelId: string, driverBotToken: string, sutBotToken: string, sutAppToken: string }`, con un id de canal de Slack como `Cxxxxxxxxxx`. Consulta [Configurar el espacio de trabajo de Slack](#setting-up-the-slack-workspace) para el aprovisionamiento de la app y los alcances.

Las variables de entorno operativas y el contrato del endpoint del broker Convex viven en [Pruebas → Credenciales compartidas de Telegram mediante Convex](/es/help/testing#shared-telegram-credentials-via-convex-v1) (el nombre de la sección es anterior al grupo multicanal; la semántica de concesión se comparte entre tipos).

## Semillas respaldadas por el repo

Los recursos semilla viven en `qa/`:

- `qa/scenarios/index.yaml`
- `qa/scenarios/<theme>/*.yaml`

Están intencionalmente en git para que el plan de QA sea visible tanto para humanos como para el
agente.

`qa-lab` debe seguir siendo un ejecutor genérico de escenarios YAML. Cada archivo YAML de escenario es
la fuente de verdad de una ejecución de prueba y debe definir:

- `title` de nivel superior
- metadatos de `scenario`
- metadatos opcionales de categoría, capacidad, carril y riesgo en `scenario`
- referencias de docs y código en `scenario`
- requisitos opcionales de plugin en `scenario`
- parche opcional de configuración del gateway en `scenario`
- `flow` ejecutable de nivel superior para escenarios de flujo, o `scenario.execution.kind` /
  `scenario.execution.path` para escenarios de Vitest y Playwright

La superficie de runtime reutilizable que respalda `flow` puede seguir siendo genérica
y transversal. Por ejemplo, los escenarios YAML pueden combinar helpers del lado del transporte
con helpers del lado del navegador que controlan la Control UI embebida mediante la costura
`browser.request` del Gateway sin agregar un ejecutor de caso especial.

Los archivos de escenario deben agruparse por capacidad de producto en lugar de por carpeta
del árbol de código fuente. Mantén estables los IDs de escenario cuando los archivos se muevan; usa `docsRefs` y `codeRefs`
para la trazabilidad de implementación.

La lista de base debe seguir siendo lo bastante amplia para cubrir:

- chat de DM y de canal
- comportamiento de hilos
- ciclo de vida de acciones de mensaje
- callbacks de cron
- recuperación de memoria
- cambio de modelo
- transferencia a subagente
- lectura de repos y lectura de docs
- una tarea pequeña de build como Lobster Invaders

## Carriles de proveedor simulado

`qa suite` tiene dos carriles locales de proveedor simulado:

- `mock-openai` es el mock de OpenClaw consciente de escenarios. Sigue siendo el carril mock
  determinista predeterminado para QA respaldado por el repo y puertas de paridad.
- `aimock` inicia un servidor de proveedor respaldado por AIMock para cobertura experimental de protocolo,
  fixture, grabación/reproducción y caos. Es aditivo y no reemplaza
  el despachador de escenarios `mock-openai`.

La implementación de carriles de proveedor vive bajo `extensions/qa-lab/src/providers/`.
Cada proveedor es dueño de sus valores predeterminados, inicio de servidor local, configuración de modelo del gateway,
necesidades de preparación de perfil de auth y flags de capacidad live/mock. El código compartido de suite y
gateway debe enrutar mediante el registro de proveedores en lugar de ramificarse por nombres de proveedor.

## Adaptadores de transporte

`qa-lab` posee una costura de transporte genérica para escenarios QA YAML. `qa-channel` es
el valor predeterminado sintético. `crabline` inicia servidores locales con forma de proveedor y ejecuta
los plugins de canal normales de OpenClaw contra ellos. `live` se reserva para credenciales de
proveedor reales y canales externos.

En el nivel de arquitectura, la división es:

- `qa-lab` posee la ejecución genérica de escenarios, la concurrencia de workers, la escritura de artefactos y los informes.
- El adaptador de transporte posee la configuración del gateway, la preparación, la observación de entrada y salida, las acciones de transporte y el estado de transporte normalizado.
- Los archivos de escenario YAML bajo `qa/scenarios/` definen la ejecución de prueba; `qa-lab` proporciona la superficie de runtime reutilizable que los ejecuta.

### Agregar un canal

Agregar un canal al sistema QA YAML requiere la implementación del canal más
un paquete de escenarios que ejercite el contrato del canal. Para cobertura de CI smoke, agrega
el servidor local de proveedor Crabline correspondiente y expónlo mediante el controlador `crabline`.

No agregues una nueva raíz de comando QA de nivel superior cuando el host compartido `qa-lab` pueda poseer el flujo.

`qa-lab` posee la mecánica de host compartida:

- la raíz de comando `openclaw qa`
- inicio y cierre de la suite
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
- cómo se gestiona el reinicio o la limpieza específicos del transporte

La barra mínima de adopción para un nuevo canal:

1. Mantén `qa-lab` como dueño de la raíz compartida `qa`.
2. Implementa el ejecutor de transporte en la costura de host compartido de `qa-lab`.
3. Mantén la mecánica específica del transporte dentro del plugin ejecutor o del arnés de canal.
4. Monta el ejecutor como `openclaw qa <runner>` en lugar de registrar un comando raíz competidor. Los plugins ejecutores deben declarar `qaRunners` en `openclaw.plugin.json` y exportar un arreglo `qaRunnerCliRegistrations` correspondiente desde `runtime-api.ts`. Mantén `runtime-api.ts` ligero; la CLI lazy y la ejecución del ejecutor deben permanecer detrás de entrypoints separados.
5. Crea o adapta escenarios YAML bajo los directorios temáticos `qa/scenarios/`.
6. Usa los helpers genéricos de escenario para nuevos escenarios.
7. Mantén funcionando los alias de compatibilidad existentes salvo que el repo esté haciendo una migración intencional.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una vez en `qa-lab`, ponlo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, mantenlo en ese plugin ejecutor o arnés de plugin.
- Si un escenario necesita una nueva capacidad que más de un canal puede usar, agrega un helper genérico en lugar de una rama específica de canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico del transporte y hazlo explícito en el contrato del escenario.

### Nombres de helpers de escenario

Helpers genéricos preferidos para nuevos escenarios:

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

Los alias de compatibilidad siguen disponibles para escenarios existentes - `waitForQaChannelReady`, `waitForOutboundMessage`, `waitForNoOutbound`, `formatConversationTranscript`, `resetBus` - pero la creación de nuevos escenarios debe usar los nombres genéricos. Los alias existen para evitar una migración de día señalado, no como el modelo de aquí en adelante.

## Informes

`qa-lab` exporta un informe de protocolo Markdown desde la cronología observada del bus.
El informe debe responder:

- Qué funcionó
- Qué falló
- Qué siguió bloqueado
- Qué escenarios de seguimiento vale la pena agregar

Para el inventario de escenarios disponibles - útil al dimensionar trabajo de seguimiento o conectar un nuevo transporte - ejecuta `pnpm openclaw qa coverage` (agrega `--json` para salida legible por máquina).
Al elegir prueba enfocada para un comportamiento o ruta de archivo tocados, ejecuta `pnpm openclaw qa coverage --match <query>`.
El informe de coincidencias busca metadatos de escenario, refs de docs, refs de código, IDs de cobertura, plugins y requisitos de proveedor, y luego imprime objetivos `qa suite --scenario ...` coincidentes.
Cada ejecución de `qa suite` escribe artefactos de nivel superior `qa-evidence.json`,
`qa-suite-summary.json` y `qa-suite-report.md` para el conjunto de
escenarios seleccionado. Los escenarios que declaran `execution.kind: vitest` o
`execution.kind: playwright` ejecutan la ruta de prueba correspondiente y también escriben
logs por escenario. Los escenarios que declaran `execution.kind: script` ejecutan el
productor de evidencia en `execution.path` mediante `node --import tsx` (con
`${outputDir}` y `${scenarioId}` expandidos en `execution.args`); el productor
escribe su propio `qa-evidence.json`, cuyas entradas se importan en la salida
de la suite y cuyas rutas de artefactos se resuelven en relación con ese
`qa-evidence.json` del productor. Cuando se llega a `qa suite` mediante
`qa run --qa-profile`, el mismo `qa-evidence.json` también incluye el resumen
de la scorecard del perfil para las categorías de taxonomía seleccionadas.
Trátalo como una ayuda de descubrimiento, no como reemplazo de una puerta; el escenario seleccionado aún necesita el modo de proveedor, transporte live, Multipass, Testbox o carril de release adecuados para el comportamiento bajo prueba.
Para contexto de scorecard, consulta [Scorecard de madurez](/es/maturity/scorecard).

Para comprobaciones de carácter y estilo, ejecuta el mismo escenario en varias refs de modelo live
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

El comando ejecuta procesos secundarios del gateway de QA local, no Docker. Los escenarios de evaluación de personajes deben configurar la persona mediante `SOUL.md` y luego ejecutar turnos de usuario ordinarios como chat, ayuda con el espacio de trabajo y pequeñas tareas de archivos. No se debe informar al modelo candidato de que está siendo evaluado. El comando conserva cada transcripción completa, registra estadísticas básicas de ejecución y luego pide a los modelos jueces en modo rápido con razonamiento `xhigh` donde sea compatible que clasifiquen las ejecuciones por naturalidad, estilo y humor.
Use `--blind-judge-models` al comparar proveedores: el prompt del juez sigue recibiendo cada transcripción y estado de ejecución, pero las referencias de candidatos se sustituyen por etiquetas neutras como `candidate-01`; el informe vuelve a asociar las clasificaciones con las referencias reales después del análisis.
Las ejecuciones candidatas usan de forma predeterminada pensamiento `high`, con `medium` para GPT-5.5 y `xhigh` para referencias de evaluación de OpenAI más antiguas que lo admiten. Anule un candidato específico en línea con `--model provider/model,thinking=<level>`. `--thinking <level>` sigue estableciendo una alternativa global, y la forma anterior `--model-thinking <provider/model=level>` se conserva por compatibilidad.
Las referencias candidatas de OpenAI usan de forma predeterminada el modo rápido para que se use el procesamiento prioritario donde el proveedor lo admita. Agregue `,fast`, `,no-fast` o `,fast=false` en línea cuando un único candidato o juez necesite una anulación. Pase `--fast` solo cuando quiera forzar el modo rápido para todos los modelos candidatos. Las duraciones de candidatos y jueces se registran en el informe para el análisis de benchmarks, pero los prompts de los jueces indican explícitamente que no clasifiquen por velocidad.
Las ejecuciones de modelos candidatos y jueces usan ambas de forma predeterminada concurrencia 16. Reduzca `--concurrency` o `--judge-concurrency` cuando los límites del proveedor o la presión del gateway local hagan que una ejecución tenga demasiado ruido.
Cuando no se pasa ningún candidato `--model`, la evaluación de personajes usa de forma predeterminada `openai/gpt-5.5`, `openai/gpt-5.2`, `openai/gpt-5`, `anthropic/claude-opus-4-8`, `anthropic/claude-sonnet-4-6`, `zai/glm-5.1`,
`moonshot/kimi-k2.5` y
`google/gemini-3.1-pro-preview` cuando no se pasa ningún `--model`.
Cuando no se pasa `--judge-model`, los jueces usan de forma predeterminada
`openai/gpt-5.5,thinking=xhigh,fast` y
`anthropic/claude-opus-4-8,thinking=high`.

## Documentos relacionados

- [QA de matriz](/es/concepts/qa-matrix)
- [Cuadro de mando de madurez](/es/maturity/scorecard)
- [Paquete de benchmarks de agentes personales](/es/concepts/personal-agent-benchmark-pack)
- [Canal de QA](/es/channels/qa-channel)
- [Pruebas](/es/help/testing)
- [Panel](/es/web/dashboard)
