---
read_when:
    - Ejecutar pruebas localmente o en CI
    - Agregar regresiones para errores de modelo/proveedor
    - Depurar el comportamiento del gateway + agente
summary: 'Kit de pruebas: suites unitarias/e2e/live, ejecutores de Docker y qué cubre cada prueba'
title: Pruebas
x-i18n:
    generated_at: "2026-04-12T23:28:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: a66ea672c386094ab4a8035a082c8a85d508a14301ad44b628d2a10d9cec3a52
    source_path: help/testing.md
    workflow: 15
---

# Pruebas

OpenClaw tiene tres suites de Vitest (unit/integration, e2e, live) y un pequeño conjunto de ejecutores de Docker.

Este documento es una guía de “cómo probamos”:

- Qué cubre cada suite (y qué deliberadamente _no_ cubre)
- Qué comandos ejecutar para flujos comunes (local, antes de hacer push, depuración)
- Cómo las pruebas live descubren credenciales y seleccionan modelos/proveedores
- Cómo agregar regresiones para problemas reales de modelos/proveedores

## Inicio rápido

La mayoría de los días:

- Compuerta completa (esperada antes de hacer push): `pnpm build && pnpm check && pnpm test`
- Ejecución local más rápida de la suite completa en una máquina con buenos recursos: `pnpm test:max`
- Bucle directo de vigilancia de Vitest: `pnpm test:watch`
- El direccionamiento directo a archivos ahora también enruta rutas de extensiones/canales: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefiere primero ejecuciones dirigidas cuando estés iterando sobre un solo fallo.
- Sitio de QA respaldado por Docker: `pnpm qa:lab:up`
- Línea de QA respaldada por VM de Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Cuando toques pruebas o quieras más confianza:

- Compuerta de cobertura: `pnpm test:coverage`
- Suite e2e: `pnpm test:e2e`

Al depurar proveedores/modelos reales (requiere credenciales reales):

- Suite live (modelos + sondeos de herramientas/imágenes del gateway): `pnpm test:live`
- Dirigir un solo archivo live en silencio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Consejo: cuando solo necesites un caso fallido, prefiere acotar las pruebas live mediante las variables de entorno de allowlist descritas abajo.

## Ejecutores específicos de QA

Estos comandos se ubican junto a las suites de prueba principales cuando necesitas el realismo de qa-lab:

- `pnpm openclaw qa suite`
  - Ejecuta escenarios de QA respaldados por el repositorio directamente en el host.
  - Ejecuta varios escenarios seleccionados en paralelo de forma predeterminada con workers de gateway aislados, hasta 64 workers o la cantidad de escenarios seleccionados. Usa `--concurrency <count>` para ajustar la cantidad de workers, o `--concurrency 1` para el carril serial anterior.
- `pnpm openclaw qa suite --runner multipass`
  - Ejecuta la misma suite de QA dentro de una VM Linux desechable de Multipass.
  - Mantiene el mismo comportamiento de selección de escenarios que `qa suite` en el host.
  - Reutiliza las mismas banderas de selección de proveedor/modelo que `qa suite`.
  - Las ejecuciones live reenvían las entradas de autenticación de QA compatibles que son prácticas para el invitado:
    claves de proveedor basadas en env, la ruta de configuración del proveedor live de QA y `CODEX_HOME` cuando está presente.
  - Los directorios de salida deben permanecer bajo la raíz del repositorio para que el invitado pueda escribir de vuelta a través del espacio de trabajo montado.
  - Escribe el informe + resumen de QA normales, además de los registros de Multipass, en
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia el sitio de QA respaldado por Docker para trabajo de QA estilo operador.
- `pnpm openclaw qa matrix`
  - Ejecuta la línea de QA live de Matrix contra un homeserver Tuwunel desechable respaldado por Docker.
  - Aprovisiona tres usuarios temporales de Matrix (`driver`, `sut`, `observer`) más una sala privada, y luego inicia un proceso hijo de gateway de QA con el plugin real de Matrix como transporte SUT.
  - Usa de forma predeterminada la imagen estable fijada de Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Anúlala con `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` cuando necesites probar una imagen diferente.
  - Escribe un informe de QA de Matrix, un resumen y un artefacto de eventos observados en `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Ejecuta la línea de QA live de Telegram contra un grupo privado real usando los tokens de bot del driver y del SUT desde env.
  - Requiere `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` y `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. El id del grupo debe ser el id numérico del chat de Telegram.
  - Requiere dos bots distintos en el mismo grupo privado, con el bot SUT exponiendo un nombre de usuario de Telegram.
  - Para una observación estable entre bots, habilita el modo de comunicación bot a bot en `@BotFather` para ambos bots y asegúrate de que el bot driver pueda observar el tráfico de bots del grupo.
  - Escribe un informe de QA de Telegram, un resumen y un artefacto de mensajes observados en `.artifacts/qa-e2e/...`.

Las líneas de transporte live comparten un contrato estándar para que los nuevos transportes no se desvíen:

`qa-channel` sigue siendo la amplia suite de QA sintética y no forma parte de la matriz de cobertura de transporte live.

| Línea    | Canary | Mention gating | Allowlist block | Respuesta de nivel superior | Reanudación tras reinicio | Seguimiento en hilo | Aislamiento de hilo | Observación de reacciones | Comando help |
| -------- | ------ | -------------- | --------------- | --------------------------- | ------------------------- | ------------------- | ------------------- | ------------------------- | ------------ |
| Matrix   | x      | x              | x               | x                           | x                         | x                   | x                   | x                         |              |
| Telegram | x      |                |                 |                             |                           |                     |                     |                           | x            |

### Agregar un canal a QA

Agregar un canal al sistema de QA en Markdown requiere exactamente dos cosas:

1. Un adaptador de transporte para el canal.
2. Un paquete de escenarios que ejerza el contrato del canal.

No agregues un ejecutor de QA específico del canal cuando el ejecutor compartido `qa-lab` pueda hacerse cargo del flujo.

`qa-lab` es responsable de la mecánica compartida:

- inicio y desmontaje de la suite
- concurrencia de workers
- escritura de artefactos
- generación de informes
- ejecución de escenarios
- alias de compatibilidad para escenarios antiguos de `qa-channel`

El adaptador del canal es responsable del contrato de transporte:

- cómo se configura el gateway para ese transporte
- cómo se verifica la preparación
- cómo se inyectan los eventos entrantes
- cómo se observan los mensajes salientes
- cómo se exponen las transcripciones y el estado normalizado del transporte
- cómo se ejecutan las acciones respaldadas por el transporte
- cómo se maneja el restablecimiento o la limpieza específicos del transporte

El umbral mínimo de adopción para un nuevo canal es:

1. Implementar el adaptador de transporte sobre la interfaz compartida de `qa-lab`.
2. Registrar el adaptador en el registro de transportes.
3. Mantener la mecánica específica del transporte dentro del adaptador o del arnés del canal.
4. Crear o adaptar escenarios en Markdown bajo `qa/scenarios/`.
5. Usar los ayudantes genéricos de escenarios para los nuevos escenarios.
6. Mantener funcionando los alias de compatibilidad existentes, a menos que el repositorio esté realizando una migración intencional.

La regla de decisión es estricta:

- Si el comportamiento puede expresarse una sola vez en `qa-lab`, colócalo en `qa-lab`.
- Si el comportamiento depende de un transporte de canal, mantenlo en ese adaptador o arnés del plugin.
- Si un escenario necesita una nueva capacidad que más de un canal puede usar, agrega un ayudante genérico en lugar de una rama específica de canal en `suite.ts`.
- Si un comportamiento solo tiene sentido para un transporte, mantén el escenario específico del transporte y hazlo explícito en el contrato del escenario.

Los nombres preferidos de ayudantes genéricos para escenarios nuevos son:

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

Los alias de compatibilidad siguen disponibles para escenarios existentes, incluidos:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

El trabajo en canales nuevos debe usar los nombres genéricos de ayudantes.
Los alias de compatibilidad existen para evitar una migración de golpe, no como modelo para
la creación de escenarios nuevos.

## Suites de prueba (qué se ejecuta dónde)

Piensa en las suites como “realismo creciente” (y mayor inestabilidad/costo):

### Unit / integration

- Comando: `pnpm test`
- Configuración: diez ejecuciones secuenciales de fragmentos (`vitest.full-*.config.ts`) sobre los proyectos de Vitest acotados existentes
- Archivos: inventarios core/unit bajo `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` y las pruebas node de `ui` incluidas en allowlist cubiertas por `vitest.unit.config.ts`
- Alcance:
  - Pruebas unitarias puras
  - Pruebas de integración en proceso (autenticación del gateway, enrutamiento, herramientas, análisis, configuración)
  - Regresiones deterministas para errores conocidos
- Expectativas:
  - Se ejecuta en CI
  - No requiere claves reales
  - Debe ser rápida y estable
- Nota sobre proyectos:
  - `pnpm test` sin objetivo ahora ejecuta once configuraciones de fragmentos más pequeñas (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) en lugar de un único proceso gigante del proyecto raíz nativo. Esto reduce el RSS máximo en máquinas cargadas y evita que el trabajo de auto-reply/extensiones deje sin recursos a suites no relacionadas.
  - `pnpm test --watch` sigue usando el grafo de proyectos nativo del root `vitest.config.ts`, porque un bucle de observación con múltiples fragmentos no es práctico.
  - `pnpm test`, `pnpm test:watch` y `pnpm test:perf:imports` enrutan primero los objetivos explícitos de archivo/directorio a través de carriles acotados, así que `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar el costo de inicio completo del proyecto raíz.
  - `pnpm test:changed` expande las rutas modificadas de git en esos mismos carriles acotados cuando el diff solo toca archivos enrutable de código fuente/prueba; las ediciones de configuración/preparación siguen recurriendo a la reejecución amplia del proyecto raíz.
  - Las pruebas unitarias ligeras en importación de agentes, comandos, plugins, ayudantes de auto-reply, `plugin-sdk` y áreas similares de utilidades puras se enrutan por el carril `unit-fast`, que omite `test/setup-openclaw-runtime.ts`; los archivos con estado o pesados en runtime permanecen en los carriles existentes.
  - Los archivos fuente de ayudantes seleccionados de `plugin-sdk` y `commands` también asignan las ejecuciones en modo changed a pruebas hermanas explícitas en esos carriles ligeros, de modo que las ediciones de ayudantes evitan volver a ejecutar la suite pesada completa para ese directorio.
  - `auto-reply` ahora tiene tres grupos dedicados: ayudantes core de nivel superior, pruebas de integración `reply.*` de nivel superior y el subárbol `src/auto-reply/reply/**`. Esto mantiene el trabajo más pesado del arnés de respuesta fuera de las pruebas baratas de estado/fragmentos/tokens.
- Nota sobre el ejecutor embebido:
  - Cuando cambies las entradas de descubrimiento de herramientas de mensajes o el contexto de runtime de Compaction,
    mantén ambos niveles de cobertura.
  - Agrega regresiones enfocadas de ayudantes para límites puros de enrutamiento/normalización.
  - También mantén sanas las suites de integración del ejecutor embebido:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` y
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Esas suites verifican que los ids acotados y el comportamiento de Compaction sigan fluyendo
    por las rutas reales `run.ts` / `compact.ts`; las pruebas solo de ayudantes no son un
    sustituto suficiente de esas rutas de integración.
- Nota sobre pool:
  - La configuración base de Vitest ahora usa `threads` de forma predeterminada.
  - La configuración compartida de Vitest también fija `isolate: false` y usa el ejecutor no aislado en los proyectos root, las configuraciones e2e y live.
  - El carril UI raíz mantiene su configuración `jsdom` y optimizador, pero ahora también se ejecuta en el ejecutor compartido no aislado.
  - Cada fragmento de `pnpm test` hereda los mismos valores predeterminados `threads` + `isolate: false` de la configuración compartida de Vitest.
  - El lanzador compartido `scripts/run-vitest.mjs` ahora también agrega `--no-maglev` de forma predeterminada para los procesos Node hijo de Vitest para reducir la agitación de compilación de V8 durante ejecuciones locales grandes. Establece `OPENCLAW_VITEST_ENABLE_MAGLEV=1` si necesitas comparar con el comportamiento estándar de V8.
- Nota sobre iteración local rápida:
  - `pnpm test:changed` se enruta por carriles acotados cuando las rutas modificadas se asignan limpiamente a una suite más pequeña.
  - `pnpm test:max` y `pnpm test:changed:max` mantienen el mismo comportamiento de enrutamiento, solo con un límite de workers más alto.
  - El autoescalado local de workers ahora es intencionalmente conservador y también reduce el ritmo cuando la carga promedio del host ya es alta, de modo que múltiples ejecuciones concurrentes de Vitest hagan menos daño de forma predeterminada.
  - La configuración base de Vitest marca los archivos de proyectos/configuración como `forceRerunTriggers` para que las reejecuciones en modo changed sigan siendo correctas cuando cambie el cableado de pruebas.
  - La configuración mantiene `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado en hosts compatibles; establece `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` si quieres una ubicación de caché explícita para perfiles directos.
- Nota sobre depuración de rendimiento:
  - `pnpm test:perf:imports` habilita los informes de duración de importación de Vitest más la salida de desglose de importaciones.
  - `pnpm test:perf:imports:changed` acota esa misma vista de perfiles a los archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` enrutado contra la ruta nativa del proyecto raíz para ese diff confirmado e imprime el tiempo total más el RSS máximo de macOS.
- `pnpm test:perf:changed:bench -- --worktree` evalúa el árbol sucio actual enrutando la lista de archivos modificados a través de `scripts/test-projects.mjs` y la configuración raíz de Vitest.
  - `pnpm test:perf:profile:main` escribe un perfil de CPU del hilo principal para la sobrecarga de inicio y transformación de Vitest/Vite.
  - `pnpm test:perf:profile:runner` escribe perfiles de CPU+heap del ejecutor para la suite unitaria con el paralelismo de archivos deshabilitado.

### E2E (smoke del gateway)

- Comando: `pnpm test:e2e`
- Configuración: `vitest.e2e.config.ts`
- Archivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Valores predeterminados del runtime:
  - Usa `threads` de Vitest con `isolate: false`, en línea con el resto del repositorio.
  - Usa workers adaptativos (CI: hasta 2, local: 1 de forma predeterminada).
  - Se ejecuta en modo silencioso de forma predeterminada para reducir la sobrecarga de E/S de consola.
- Anulaciones útiles:
  - `OPENCLAW_E2E_WORKERS=<n>` para forzar la cantidad de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para volver a habilitar la salida detallada de consola.
- Alcance:
  - Comportamiento end-to-end del gateway en múltiples instancias
  - Superficies WebSocket/HTTP, emparejamiento de nodos y redes más pesadas
- Expectativas:
  - Se ejecuta en CI (cuando está habilitado en el pipeline)
  - No requiere claves reales
  - Tiene más partes móviles que las pruebas unitarias (puede ser más lenta)

### E2E: smoke del backend de OpenShell

- Comando: `pnpm test:e2e:openshell`
- Archivo: `test/openshell-sandbox.e2e.test.ts`
- Alcance:
  - Inicia un gateway aislado de OpenShell en el host mediante Docker
  - Crea un sandbox a partir de un Dockerfile local temporal
  - Ejercita el backend de OpenShell de OpenClaw sobre `sandbox ssh-config` + ejecución SSH reales
  - Verifica el comportamiento canónico remoto del sistema de archivos a través del puente fs del sandbox
- Expectativas:
  - Solo opt-in; no forma parte de la ejecución predeterminada de `pnpm test:e2e`
  - Requiere un CLI `openshell` local y un daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` aislados, luego destruye el gateway de prueba y el sandbox
- Anulaciones útiles:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar la prueba al ejecutar manualmente la suite e2e más amplia
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apuntar a un binario CLI o script wrapper no predeterminado

### Live (proveedores reales + modelos reales)

- Comando: `pnpm test:live`
- Configuración: `vitest.live.config.ts`
- Archivos: `src/**/*.live.test.ts`
- Predeterminado: **habilitado** por `pnpm test:live` (establece `OPENCLAW_LIVE_TEST=1`)
- Alcance:
  - “¿Este proveedor/modelo realmente funciona _hoy_ con credenciales reales?”
  - Detectar cambios de formato del proveedor, particularidades de llamadas a herramientas, problemas de autenticación y comportamiento de límites de tasa
- Expectativas:
  - No es estable en CI por diseño (redes reales, políticas reales de proveedores, cuotas, caídas)
  - Cuesta dinero / usa límites de tasa
  - Prefiere ejecutar subconjuntos acotados en lugar de “todo”
- Las ejecuciones live cargan `~/.profile` para recoger claves API faltantes.
- De forma predeterminada, las ejecuciones live siguen aislando `HOME` y copian el material de configuración/autenticación a un home temporal de prueba para que las fixtures unitarias no puedan mutar tu `~/.openclaw` real.
- Establece `OPENCLAW_LIVE_USE_REAL_HOME=1` solo cuando necesites intencionalmente que las pruebas live usen tu directorio home real.
- `pnpm test:live` ahora usa por defecto un modo más silencioso: mantiene la salida de progreso `[live] ...`, pero suprime el aviso extra de `~/.profile` y silencia los registros de arranque del gateway y el ruido de Bonjour. Establece `OPENCLAW_LIVE_TEST_QUIET=0` si quieres recuperar los registros completos de inicio.
- Rotación de claves API (específica por proveedor): establece `*_API_KEYS` con formato separado por comas/punto y coma o `*_API_KEY_1`, `*_API_KEY_2` (por ejemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) o una anulación por live mediante `OPENCLAW_LIVE_*_KEY`; las pruebas reintentan ante respuestas de límite de tasa.
- Salida de progreso/Heartbeat:
  - Las suites live ahora emiten líneas de progreso a stderr para que las llamadas largas al proveedor se vean activas incluso cuando la captura de consola de Vitest está en silencio.
  - `vitest.live.config.ts` deshabilita la interceptación de consola de Vitest para que las líneas de progreso del proveedor/gateway se transmitan de inmediato durante las ejecuciones live.
  - Ajusta los Heartbeat de modelo directo con `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajusta los Heartbeat de gateway/sondeo con `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## ¿Qué suite debo ejecutar?

Usa esta tabla de decisión:

- Si editas lógica/pruebas: ejecuta `pnpm test` (y `pnpm test:coverage` si cambiaste mucho)
- Si tocas redes del gateway / protocolo WS / emparejamiento: agrega `pnpm test:e2e`
- Si depuras “mi bot está caído” / fallos específicos de proveedor / llamadas a herramientas: ejecuta un `pnpm test:live` acotado

## Live: barrido de capacidades del nodo Android

- Prueba: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **cada comando anunciado actualmente** por un nodo Android conectado y verificar el comportamiento del contrato de comandos.
- Alcance:
  - Configuración manual/precondicionada (la suite no instala, ejecuta ni empareja la app).
  - Validación `node.invoke` del gateway comando por comando para el nodo Android seleccionado.
- Preconfiguración obligatoria:
  - App Android ya conectada y emparejada con el gateway.
  - App mantenida en primer plano.
  - Permisos/consentimiento de captura concedidos para las capacidades que esperas que pasen.
- Anulaciones de destino opcionales:
  - `OPENCLAW_ANDROID_NODE_ID` o `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalles completos de configuración de Android: [App Android](/es/platforms/android)

## Live: smoke de modelos (claves de perfil)

Las pruebas live se dividen en dos capas para poder aislar fallos:

- “Modelo directo” nos dice si el proveedor/modelo puede responder en absoluto con la clave dada.
- “Smoke del gateway” nos dice si funciona el pipeline completo gateway+agente para ese modelo (sesiones, historial, herramientas, política de sandbox, etc.).

### Capa 1: finalización directa del modelo (sin gateway)

- Prueba: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar los modelos descubiertos
  - Usar `getApiKeyForModel` para seleccionar modelos para los que tienes credenciales
  - Ejecutar una pequeña finalización por modelo (y regresiones dirigidas cuando sea necesario)
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Establece `OPENCLAW_LIVE_MODELS=modern` (o `all`, alias de modern) para ejecutar realmente esta suite; de lo contrario se omite para mantener `pnpm test:live` centrado en el smoke del gateway
- Cómo seleccionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para ejecutar la allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` es un alias de la allowlist moderna
  - o `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por comas)
  - Los barridos modern/all usan por defecto un límite curado de alta señal; establece `OPENCLAW_LIVE_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
- Cómo seleccionar proveedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por comas)
- De dónde vienen las claves:
  - De forma predeterminada: almacén de perfiles y alternativas de env
  - Establece `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para imponer **solo** el almacén de perfiles
- Por qué existe:
  - Separa “la API del proveedor está rota / la clave no es válida” de “el pipeline del agente gateway está roto”
  - Contiene regresiones pequeñas y aisladas (ejemplo: flujos de repetición de razonamiento y llamadas a herramientas de OpenAI Responses/Codex Responses)

### Capa 2: smoke del gateway + agente dev (lo que realmente hace "@openclaw")

- Prueba: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Levantar un gateway en proceso
  - Crear/parchear una sesión `agent:dev:*` (anulación de modelo por ejecución)
  - Iterar modelos-con-claves y verificar:
    - respuesta “significativa” (sin herramientas)
    - que funcione una invocación real de herramienta (sondeo de lectura)
    - sondeos opcionales de herramientas extra (sondeo exec+read)
    - que sigan funcionando las rutas de regresión de OpenAI (solo llamada a herramienta → seguimiento)
- Detalles de los sondeos (para que puedas explicar fallos rápidamente):
  - Sondeo `read`: la prueba escribe un archivo nonce en el espacio de trabajo y le pide al agente que lo `read` y devuelva el nonce.
  - Sondeo `exec+read`: la prueba le pide al agente que escriba mediante `exec` un nonce en un archivo temporal y luego lo lea con `read`.
  - Sondeo de imagen: la prueba adjunta un PNG generado (gato + código aleatorio) y espera que el modelo devuelva `cat <CODE>`.
  - Referencia de implementación: `src/gateway/gateway-models.profiles.live.test.ts` y `src/gateway/live-image-probe.ts`.
- Cómo habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
- Cómo seleccionar modelos:
  - Predeterminado: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` es un alias de la allowlist moderna
  - O establece `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (o una lista separada por comas) para acotar
  - Los barridos modern/all del gateway usan por defecto un límite curado de alta señal; establece `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para un barrido moderno exhaustivo o un número positivo para un límite menor.
- Cómo seleccionar proveedores (evitar “todo OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por comas)
- Los sondeos de herramientas + imagen siempre están activados en esta prueba live:
  - sondeo `read` + sondeo `exec+read` (estrés de herramientas)
  - el sondeo de imagen se ejecuta cuando el modelo anuncia compatibilidad con entrada de imagen
  - Flujo (alto nivel):
    - La prueba genera un PNG diminuto con “CAT” + código aleatorio (`src/gateway/live-image-probe.ts`)
    - Lo envía mediante `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - El Gateway analiza los adjuntos en `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - El agente embebido reenvía un mensaje de usuario multimodal al modelo
    - Verificación: la respuesta contiene `cat` + el código (tolerancia OCR: se permiten errores menores)

Consejo: para ver qué puedes probar en tu máquina (y los ids exactos `provider/model`), ejecuta:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke del backend CLI (Claude, Codex, Gemini u otros CLI locales)

- Prueba: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar el pipeline del Gateway + agente usando un backend CLI local, sin tocar tu configuración predeterminada.
- Los valores predeterminados de smoke específicos del backend viven con la definición `cli-backend.ts` de la extensión propietaria.
- Habilitar:
  - `pnpm test:live` (o `OPENCLAW_LIVE_TEST=1` si invocas Vitest directamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Valores predeterminados:
  - Proveedor/modelo predeterminado: `claude-cli/claude-sonnet-4-6`
  - El comportamiento de comando/args/imagen proviene de los metadatos del plugin propietario del backend CLI.
- Anulaciones (opcionales):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar un adjunto de imagen real (las rutas se inyectan en el prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para pasar rutas de archivos de imagen como args del CLI en lugar de inyección en el prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (o `"list"`) para controlar cómo se pasan los args de imagen cuando `IMAGE_ARG` está establecido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar un segundo turno y validar el flujo de reanudación.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para desactivar el sondeo predeterminado de continuidad en la misma sesión Claude Sonnet -> Opus (establécelo en `1` para forzarlo cuando el modelo seleccionado admita un destino de cambio).

Ejemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Receta de Docker:

```bash
pnpm test:docker:live-cli-backend
```

Recetas Docker de proveedor único:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Notas:

- El ejecutor Docker está en `scripts/test-live-cli-backend-docker.sh`.
- Ejecuta el smoke live del backend CLI dentro de la imagen Docker del repositorio como el usuario no root `node`.
- Resuelve los metadatos de smoke del CLI desde la extensión propietaria, luego instala el paquete CLI Linux correspondiente (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) en un prefijo escribible con caché en `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (predeterminado: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requiere OAuth portable de suscripción de Claude Code a través de `~/.claude/.credentials.json` con `claudeAiOauth.subscriptionType` o `CLAUDE_CODE_OAUTH_TOKEN` desde `claude setup-token`. Primero demuestra `claude -p` directo en Docker, luego ejecuta dos turnos del backend CLI de Gateway sin preservar las variables de entorno de clave API de Anthropic. Esta línea de suscripción desactiva por defecto los sondeos MCP/herramientas e imagen de Claude porque Claude actualmente enruta el uso de apps de terceros mediante facturación por uso extra en lugar de los límites normales del plan de suscripción.
- El smoke live del backend CLI ahora ejercita el mismo flujo end-to-end para Claude, Codex y Gemini: turno de texto, turno de clasificación de imagen y luego llamada a herramienta `cron` de MCP verificada a través del CLI del gateway.
- El smoke predeterminado de Claude también parchea la sesión de Sonnet a Opus y verifica que la sesión reanudada todavía recuerde una nota anterior.

## Live: smoke de enlace ACP (`/acp spawn ... --bind here`)

- Prueba: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar el flujo real de conversation-bind de ACP con un agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - enlazar en su lugar una conversación sintética de canal de mensajes
  - enviar un seguimiento normal en esa misma conversación
  - verificar que el seguimiento llegue a la transcripción de la sesión ACP enlazada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Valores predeterminados:
  - Agentes ACP en Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` directo: `claude`
  - Canal sintético: contexto de conversación estilo DM de Slack
  - Backend ACP: `acpx`
- Anulaciones:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Notas:
  - Esta línea usa la superficie `chat.send` del gateway con campos sintéticos de originating-route solo para administradores para que las pruebas puedan adjuntar contexto de canal de mensajes sin fingir entrega externa.
  - Cuando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` no está establecido, la prueba usa el registro de agentes integrado del plugin embebido `acpx` para el agente de arnés ACP seleccionado.

Ejemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receta de Docker:

```bash
pnpm test:docker:live-acp-bind
```

Recetas Docker de agente único:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Notas de Docker:

- El ejecutor Docker está en `scripts/test-live-acp-bind-docker.sh`.
- De forma predeterminada, ejecuta el smoke de enlace ACP contra todos los agentes CLI live compatibles en secuencia: `claude`, `codex` y luego `gemini`.
- Usa `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` o `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para acotar la matriz.
- Carga `~/.profile`, prepara el material de autenticación CLI correspondiente dentro del contenedor, instala `acpx` en un prefijo npm escribible y luego instala el CLI live solicitado (`@anthropic-ai/claude-code`, `@openai/codex` o `@google/gemini-cli`) si falta.
- Dentro de Docker, el ejecutor establece `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que `acpx` mantenga disponibles para el CLI hijo del arnés las variables de entorno del proveedor provenientes del perfil cargado.

## Live: smoke del arnés app-server de Codex

- Objetivo: validar el arnés de Codex propiedad del plugin a través del método
  `agent` normal del gateway:
  - cargar el plugin empaquetado `codex`
  - seleccionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar un primer turno de agente del gateway a `codex/gpt-5.4`
  - enviar un segundo turno a la misma sesión de OpenClaw y verificar que el hilo del app-server
    pueda reanudarse
  - ejecutar `/codex status` y `/codex models` mediante la misma ruta de comando del gateway
- Prueba: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo predeterminado: `codex/gpt-5.4`
- Sondeo opcional de imagen: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sondeo opcional de MCP/herramienta: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- El smoke establece `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que un arnés
  de Codex roto no pueda pasar recurriendo silenciosamente a PI.
- Autenticación: `OPENAI_API_KEY` desde el shell/perfil, más `~/.codex/auth.json` y `~/.codex/config.toml`
  copiados opcionalmente

Receta local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receta de Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Notas de Docker:

- El ejecutor Docker está en `scripts/test-live-codex-harness-docker.sh`.
- Carga el `~/.profile` montado, pasa `OPENAI_API_KEY`, copia los archivos de autenticación del CLI de Codex cuando están presentes, instala `@openai/codex` en un prefijo npm montado y escribible, prepara el árbol de código fuente y luego ejecuta solo la prueba live del arnés de Codex.
- Docker habilita por defecto los sondeos de imagen y MCP/herramienta. Establece
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` o
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` cuando necesites una ejecución de depuración más acotada.
- Docker también exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, en línea con la
  configuración de la prueba live, para que el fallback de `openai-codex/*` o PI no pueda ocultar una regresión del arnés de Codex.

### Recetas live recomendadas

Las allowlist explícitas y acotadas son las más rápidas y las menos inestables:

- Un solo modelo, directo (sin gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Un solo modelo, smoke del gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Llamada a herramientas en varios proveedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Enfoque en Google (clave API de Gemini + Antigravity):
  - Gemini (clave API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Notas:

- `google/...` usa la API de Gemini (clave API).
- `google-antigravity/...` usa el puente OAuth de Antigravity (endpoint de agente estilo Cloud Code Assist).
- `google-gemini-cli/...` usa el CLI local de Gemini en tu máquina (autenticación separada + particularidades de herramientas).
- API de Gemini vs CLI de Gemini:
  - API: OpenClaw llama a la API alojada de Gemini de Google por HTTP (autenticación por clave API / perfil); esto es lo que la mayoría de los usuarios quiere decir con “Gemini”.
  - CLI: OpenClaw ejecuta un binario local `gemini`; tiene su propia autenticación y puede comportarse de forma distinta (streaming/compatibilidad con herramientas/desajuste de versiones).

## Live: matriz de modelos (qué cubrimos)

No hay una “lista fija de modelos de CI” (live es opt-in), pero estos son los modelos **recomendados** para cubrir regularmente en una máquina de desarrollo con claves.

### Conjunto smoke moderno (llamada a herramientas + imagen)

Esta es la ejecución de “modelos comunes” que esperamos mantener funcionando:

- OpenAI (no Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google (API de Gemini): `google/gemini-3.1-pro-preview` y `google/gemini-3-flash-preview` (evita modelos Gemini 2.x más antiguos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` y `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Ejecuta el smoke del gateway con herramientas + imagen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Línea base: llamada a herramientas (Read + Exec opcional)

Elige al menos uno por familia de proveedores:

- OpenAI: `openai/gpt-5.4` (o `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (o `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (o `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (deseable):

- xAI: `xai/grok-4` (o la versión más reciente disponible)
- Mistral: `mistral/`… (elige un modelo con capacidad de `tools` que tengas habilitado)
- Cerebras: `cerebras/`… (si tienes acceso)
- LM Studio: `lmstudio/`… (local; la llamada a herramientas depende del modo API)

### Visión: envío de imagen (adjunto → mensaje multimodal)

Incluye al menos un modelo con capacidad de imagen en `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes de Claude/Gemini/OpenAI con capacidad de visión, etc.) para ejercitar el sondeo de imagen.

### Agregadores / gateways alternativos

Si tienes claves habilitadas, también admitimos pruebas mediante:

- OpenRouter: `openrouter/...` (cientos de modelos; usa `openclaw models scan` para encontrar candidatos con capacidad de herramientas+imagen)
- OpenCode: `opencode/...` para Zen y `opencode-go/...` para Go (autenticación mediante `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Más proveedores que puedes incluir en la matriz live (si tienes credenciales/configuración):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Mediante `models.providers` (endpoints personalizados): `minimax` (cloud/API), más cualquier proxy compatible con OpenAI/Anthropic (LM Studio, vLLM, LiteLLM, etc.)

Consejo: no intentes codificar “todos los modelos” en la documentación. La lista autoritativa es lo que `discoverModels(...)` devuelve en tu máquina + las claves que estén disponibles.

## Credenciales (nunca confirmar en git)

Las pruebas live descubren credenciales de la misma manera que la CLI. Implicaciones prácticas:

- Si la CLI funciona, las pruebas live deberían encontrar las mismas claves.
- Si una prueba live dice “sin credenciales”, depúralo igual que depurarías `openclaw models list` / la selección de modelo.

- Perfiles de autenticación por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (esto es lo que significa “claves de perfil” en las pruebas live)
- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado heredado: `~/.openclaw/credentials/` (se copia al home live preparado cuando está presente, pero no es el almacén principal de claves de perfil)
- Las ejecuciones live locales copian por defecto la configuración activa, los archivos `auth-profiles.json` por agente, `credentials/` heredado y los directorios de autenticación CLI externos compatibles a un home temporal de prueba; los homes live preparados omiten `workspace/` y `sandboxes/`, y se eliminan las anulaciones de ruta `agents.*.workspace` / `agentDir` para que los sondeos no toquen tu espacio de trabajo real del host.

Si quieres depender de claves env (por ejemplo, exportadas en tu `~/.profile`), ejecuta las pruebas locales después de `source ~/.profile`, o usa los ejecutores Docker de abajo (pueden montar `~/.profile` dentro del contenedor).

## Live de Deepgram (transcripción de audio)

- Prueba: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live del plan de codificación de BytePlus

- Prueba: `src/agents/byteplus.live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Anulación opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live de medios de flujo de trabajo de ComfyUI

- Prueba: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Alcance:
  - Ejercita las rutas empaquetadas de imagen, video y `music_generate` de comfy
  - Omite cada capacidad salvo que `models.providers.comfy.<capability>` esté configurado
  - Es útil después de cambiar el envío de flujos de trabajo de comfy, el sondeo, las descargas o el registro del plugin

## Live de generación de imágenes

- Prueba: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Arnés: `pnpm test:live:media image`
- Alcance:
  - Enumera cada plugin de proveedor de generación de imágenes registrado
  - Carga variables env de proveedor faltantes desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API live/env por delante de los perfiles de autenticación almacenados, para que las claves de prueba obsoletas en `auth-profiles.json` no enmascaren credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizables
  - Ejecuta las variantes estándar de generación de imágenes a través de la capacidad compartida de runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Proveedores empaquetados cubiertos actualmente:
  - `openai`
  - `google`
- Acotación opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar anulaciones solo-env

## Live de generación de música

- Prueba: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media music`
- Alcance:
  - Ejercita la ruta compartida empaquetada del proveedor de generación de música
  - Actualmente cubre Google y MiniMax
  - Carga variables env del proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API live/env por delante de los perfiles de autenticación almacenados, para que las claves de prueba obsoletas en `auth-profiles.json` no enmascaren credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizables
  - Ejecuta ambos modos de runtime declarados cuando están disponibles:
    - `generate` con entrada solo de prompt
    - `edit` cuando el proveedor declara `capabilities.edit.enabled`
  - Cobertura actual del carril compartido:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: archivo live separado de Comfy, no este barrido compartido
- Acotación opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar anulaciones solo-env

## Live de generación de video

- Prueba: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Arnés: `pnpm test:live:media video`
- Alcance:
  - Ejercita la ruta compartida empaquetada del proveedor de generación de video
  - Carga variables env del proveedor desde tu shell de inicio de sesión (`~/.profile`) antes de sondear
  - Usa por defecto claves API live/env por delante de los perfiles de autenticación almacenados, para que las claves de prueba obsoletas en `auth-profiles.json` no enmascaren credenciales reales del shell
  - Omite proveedores sin autenticación/perfil/modelo utilizables
  - Ejecuta ambos modos de runtime declarados cuando están disponibles:
    - `generate` con entrada solo de prompt
    - `imageToVideo` cuando el proveedor declara `capabilities.imageToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de imagen local respaldada por buffer en el barrido compartido
    - `videoToVideo` cuando el proveedor declara `capabilities.videoToVideo.enabled` y el proveedor/modelo seleccionado acepta entrada de video local respaldada por buffer en el barrido compartido
  - Proveedores `imageToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `vydra` porque el `veo3` empaquetado es solo texto y el `kling` empaquetado requiere una URL remota de imagen
  - Cobertura específica del proveedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - ese archivo ejecuta `veo3` de texto a video más un carril `kling` que usa por defecto una fixture de URL remota de imagen
  - Cobertura live actual de `videoToVideo`:
    - solo `runway` cuando el modelo seleccionado es `runway/gen4_aleph`
  - Proveedores `videoToVideo` actualmente declarados pero omitidos en el barrido compartido:
    - `alibaba`, `qwen`, `xai` porque esas rutas actualmente requieren URLs de referencia remotas `http(s)` / MP4
    - `google` porque el carril compartido actual Gemini/Veo usa entrada local respaldada por buffer y esa ruta no se acepta en el barrido compartido
    - `openai` porque el carril compartido actual carece de garantías de acceso por organización para inpaint/remix de video
- Acotación opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Comportamiento de autenticación opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forzar autenticación del almacén de perfiles e ignorar anulaciones solo-env

## Arnés live de medios

- Comando: `pnpm test:live:media`
- Propósito:
  - Ejecuta las suites live compartidas de imagen, música y video mediante un único punto de entrada nativo del repositorio
  - Carga automáticamente variables env faltantes del proveedor desde `~/.profile`
  - Acota automáticamente por defecto cada suite a los proveedores que actualmente tienen autenticación utilizable
  - Reutiliza `scripts/test-live.mjs`, para que el comportamiento de Heartbeat y modo silencioso siga siendo consistente
- Ejemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Ejecutores Docker (comprobaciones opcionales de "funciona en Linux")

Estos ejecutores Docker se dividen en dos grupos:

- Ejecutores de modelos live: `test:docker:live-models` y `test:docker:live-gateway` ejecutan solo su archivo live de claves de perfil correspondiente dentro de la imagen Docker del repositorio (`src/agents/models.profiles.live.test.ts` y `src/gateway/gateway-models.profiles.live.test.ts`), montando tu directorio de configuración y espacio de trabajo locales (y cargando `~/.profile` si está montado). Los puntos de entrada locales correspondientes son `test:live:models-profiles` y `test:live:gateway-profiles`.
- Los ejecutores live de Docker usan por defecto un límite smoke más pequeño para que un barrido Docker completo siga siendo práctico:
  `test:docker:live-models` usa por defecto `OPENCLAW_LIVE_MAX_MODELS=12`, y
  `test:docker:live-gateway` usa por defecto `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` y
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Anula esas variables env cuando
  explícitamente quieras el análisis exhaustivo más grande.
- `test:docker:all` construye una vez la imagen Docker live mediante `test:docker:live-build`, y luego la reutiliza para las dos líneas Docker live.
- Ejecutores smoke de contenedor: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` y `test:docker:plugins` arrancan uno o más contenedores reales y verifican rutas de integración de nivel superior.

Los ejecutores Docker de modelos live también montan por bind solo los homes de autenticación CLI necesarios (o todos los compatibles cuando la ejecución no está acotada), y luego los copian al home del contenedor antes de la ejecución para que el OAuth del CLI externo pueda renovar tokens sin mutar el almacén de autenticación del host:

- Modelos directos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de enlace ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke del backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke del arnés app-server de Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live de Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Asistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Redes del gateway (dos contenedores, autenticación WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Puente de canal MCP (Gateway precargado + puente stdio + smoke en bruto de frame de notificación de Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke de instalación + alias `/plugin` + semántica de reinicio del paquete Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Los ejecutores Docker de modelos live también montan por bind la copia de trabajo actual en solo lectura y
la preparan en un directorio de trabajo temporal dentro del contenedor. Esto mantiene ligera la imagen de runtime
mientras sigue ejecutando Vitest contra tu código fuente/configuración locales exactos.
El paso de preparación omite cachés locales grandes y salidas de compilación de apps como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` y directorios de salida locales de app `.build` o
Gradle para que las ejecuciones Docker live no pasen minutos copiando
artefactos específicos de la máquina.
También establecen `OPENCLAW_SKIP_CHANNELS=1` para que los sondeos live del gateway no inicien
workers reales de canales Telegram/Discord/etc. dentro del contenedor.
`test:docker:live-models` sigue ejecutando `pnpm test:live`, así que pasa también
`OPENCLAW_LIVE_GATEWAY_*` cuando necesites acotar o excluir la cobertura
live del gateway de esa línea Docker.
`test:docker:openwebui` es un smoke de compatibilidad de nivel superior: inicia un
contenedor de gateway de OpenClaw con los endpoints HTTP compatibles con OpenAI habilitados,
inicia un contenedor fijado de Open WebUI contra ese gateway, inicia sesión mediante
Open WebUI, verifica que `/api/models` expone `openclaw/default`, y luego envía una
solicitud de chat real a través del proxy `/api/chat/completions` de Open WebUI.
La primera ejecución puede ser notablemente más lenta porque Docker puede necesitar descargar la
imagen de Open WebUI y Open WebUI puede necesitar completar su propio arranque en frío.
Esta línea espera una clave de modelo live utilizable, y `OPENCLAW_PROFILE_FILE`
(`~/.profile` de forma predeterminada) es la forma principal de proporcionarla en ejecuciones dockerizadas.
Las ejecuciones exitosas imprimen un pequeño payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` es intencionalmente determinista y no necesita una
cuenta real de Telegram, Discord o iMessage. Arranca un contenedor de Gateway
precargado, inicia un segundo contenedor que ejecuta `openclaw mcp serve`, y luego
verifica el descubrimiento de conversaciones enrutadas, lecturas de transcripción, metadatos de adjuntos,
comportamiento de cola de eventos live, enrutamiento de envíos salientes y notificaciones de canal +
permisos estilo Claude sobre el puente MCP stdio real. La comprobación de notificaciones
inspecciona directamente los frames MCP stdio en bruto, de modo que el smoke valida lo que
el puente realmente emite, no solo lo que una SDK cliente específica expone casualmente.

Smoke manual de hilo ACP en lenguaje natural (no CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Conserva este script para flujos de regresión/depuración. Puede volver a ser necesario para validar el enrutamiento de hilos ACP, así que no lo elimines.

Variables env útiles:

- `OPENCLAW_CONFIG_DIR=...` (predeterminado: `~/.openclaw`) montado en `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (predeterminado: `~/.openclaw/workspace`) montado en `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (predeterminado: `~/.profile`) montado en `/home/node/.profile` y cargado antes de ejecutar las pruebas
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (predeterminado: `~/.cache/openclaw/docker-cli-tools`) montado en `/home/node/.npm-global` para instalaciones CLI en caché dentro de Docker
- Los directorios/archivos de autenticación CLI externos bajo `$HOME` se montan en solo lectura bajo `/host-auth...`, luego se copian a `/home/node/...` antes de que comiencen las pruebas
  - Directorios predeterminados: `.minimax`
  - Archivos predeterminados: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Las ejecuciones acotadas por proveedor montan solo los directorios/archivos necesarios inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Anúlalo manualmente con `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` o una lista separada por comas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para acotar la ejecución
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar proveedores dentro del contenedor
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar una imagen `openclaw:local-live` existente en reejecuciones que no necesiten reconstrucción
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para asegurar que las credenciales provengan del almacén de perfiles (no de env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para elegir el modelo expuesto por el gateway para el smoke de Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para anular el prompt de verificación de nonce usado por el smoke de Open WebUI
- `OPENWEBUI_IMAGE=...` para anular la etiqueta fijada de imagen de Open WebUI

## Verificación de documentación

Ejecuta comprobaciones de documentación después de editar docs: `pnpm check:docs`.
Ejecuta la validación completa de anchors de Mintlify cuando también necesites comprobar encabezados dentro de la página: `pnpm docs:check-links:anchors`.

## Regresión sin conexión (segura para CI)

Estas son regresiones de “pipeline real” sin proveedores reales:

- Llamada a herramientas del gateway (OpenAI simulado, gateway real + bucle de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Asistente del gateway (WS `wizard.start`/`wizard.next`, escritura de configuración + autenticación aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de fiabilidad del agente (Skills)

Ya tenemos algunas pruebas seguras para CI que se comportan como “evals de fiabilidad del agente”:

- Llamada simulada a herramientas a través del gateway real + bucle de agente (`src/gateway/gateway.test.ts`).
- Flujos end-to-end del asistente que validan el cableado de sesión y los efectos de configuración (`src/gateway/gateway.test.ts`).

Qué sigue faltando para Skills (consulta [Skills](/es/tools/skills)):

- **Toma de decisiones:** cuando Skills aparece en el prompt, ¿el agente elige la Skill correcta (o evita las irrelevantes)?
- **Cumplimiento:** ¿el agente lee `SKILL.md` antes de usarlo y sigue los pasos/args requeridos?
- **Contratos de flujo de trabajo:** escenarios de varios turnos que verifiquen orden de herramientas, arrastre del historial de sesión y límites del sandbox.

Los evals futuros deben seguir siendo deterministas primero:

- Un ejecutor de escenarios que use proveedores simulados para verificar llamadas + orden de herramientas, lecturas de archivos de Skill y cableado de sesión.
- Una pequeña suite de escenarios centrados en Skills (usar vs evitar, compuertas, inyección de prompt).
- Evals live opcionales (opt-in, protegidos por env) solo después de que la suite segura para CI esté lista.

## Pruebas de contrato (forma de Plugin y canal)

Las pruebas de contrato verifican que cada plugin y canal registrado se ajuste a su
contrato de interfaz. Iteran sobre todos los plugins descubiertos y ejecutan una suite de
verificaciones de forma y comportamiento. El carril unitario predeterminado de `pnpm test`
omite intencionalmente estos archivos compartidos de interfaz y smoke; ejecuta los comandos de contrato explícitamente
cuando toques superficies compartidas de canal o proveedor.

### Comandos

- Todos los contratos: `pnpm test:contracts`
- Solo contratos de canal: `pnpm test:contracts:channels`
- Solo contratos de proveedor: `pnpm test:contracts:plugins`

### Contratos de canal

Ubicados en `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica del plugin (id, name, capabilities)
- **setup** - Contrato del asistente de configuración
- **session-binding** - Comportamiento del enlace de sesión
- **outbound-payload** - Estructura del payload del mensaje
- **inbound** - Manejo de mensajes entrantes
- **actions** - Controladores de acciones del canal
- **threading** - Manejo de ids de hilo
- **directory** - API de directorio/listado
- **group-policy** - Aplicación de política de grupo

### Contratos de estado del proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondeos de estado del canal
- **registry** - Forma del registro de plugins

### Contratos de proveedor

Ubicados en `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de flujo de autenticación
- **auth-choice** - Elección/selección de autenticación
- **catalog** - API del catálogo de modelos
- **discovery** - Descubrimiento de plugins
- **loader** - Carga de plugins
- **runtime** - Runtime del proveedor
- **shape** - Forma/interfaz del plugin
- **wizard** - Asistente de configuración

### Cuándo ejecutarlas

- Después de cambiar exportaciones o subrutas de plugin-sdk
- Después de agregar o modificar un plugin de canal o proveedor
- Después de refactorizar el registro o descubrimiento de plugins

Las pruebas de contrato se ejecutan en CI y no requieren claves API reales.

## Agregar regresiones (guía)

Cuando corrijas un problema de proveedor/modelo descubierto en live:

- Agrega una regresión segura para CI si es posible (proveedor simulado/stub, o captura la transformación exacta de forma de solicitud)
- Si es inherentemente solo live (límites de tasa, políticas de autenticación), mantén la prueba live acotada y opt-in mediante variables env
- Prefiere apuntar a la capa más pequeña que detecte el error:
  - error de conversión/repetición de solicitud del proveedor → prueba de modelos directos
  - error del pipeline de sesión/historial/herramientas del gateway → smoke live del gateway o prueba simulada del gateway segura para CI
- Protección de recorrido de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva un objetivo de muestra por clase de SecretRef a partir de los metadatos del registro (`listSecretTargetRegistryEntries()`), y luego verifica que se rechacen los ids exec de segmentos de recorrido.
  - Si agregas una nueva familia de objetivos SecretRef `includeInPlan` en `src/secrets/target-registry-data.ts`, actualiza `classifyTargetClass` en esa prueba. La prueba falla intencionalmente con ids de objetivo no clasificados para que las clases nuevas no puedan omitirse silenciosamente.
