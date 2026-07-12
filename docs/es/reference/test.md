---
read_when:
    - Ejecución o corrección de pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos de ejecución forzada o cobertura
title: Pruebas
x-i18n:
    generated_at: "2026-07-11T23:31:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de pruebas (suites, en vivo, Docker): [Pruebas](/es/help/testing)
- Validación de actualizaciones y paquetes de plugins: [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)

## Configuración predeterminada del agente

Las sesiones de agente ejecutan las pruebas y las validaciones computacionalmente intensivas de forma remota
mediante Crabbox. El código de mantenedores de confianza utiliza Blacksmith Testbox de forma predeterminada. El
flujo de trabajo de Testbox configurado carga credenciales, por lo que el código no confiable de colaboradores o
bifurcaciones debe usar en su lugar la CI de la bifurcación sin secretos o un Crabbox directo en AWS saneado.

Cuando sea probable que una tarea con código de confianza necesite pruebas o comprobaciones intensivas, precalienta
inmediatamente en una sesión de comandos en segundo plano, sigue trabajando mientras se carga,
reutiliza el id `tbx_...` devuelto, sincroniza el checkout actual en cada ejecución y
detenlo antes de la entrega:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Tras la primera reutilización correcta, el contenedor registra la base, las dependencias
y la huella digital del flujo de trabajo de Testbox del arrendamiento en `.crabbox/testbox-leases/`.
Las ediciones exclusivas del código fuente siguen reutilizando el entorno precalentado. Un cambio en la base de fusión, el archivo de bloqueo,
la entrada del gestor de paquetes, el contenedor o el flujo de trabajo de Testbox provoca un cierre seguro y requiere un
arrendamiento nuevo. Cada ejecución sigue sincronizando el checkout actual.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` se usa únicamente para diagnósticos intencionados, no
como comprobación para una versión.

Los comandos de pruebas locales que aparecen a continuación están destinados a flujos de trabajo humanos o a una alternativa explícita para el agente
solicitada por el usuario. La indisponibilidad del proveedor remoto debe notificarse; no
autoriza a ejecutar silenciosamente una validación local amplia.

Para código no confiable, precalienta con `--provider aws`. Cada ejecución debe establecer
`CRABBOX_ENV_ALLOW=CI`, pasar `--provider aws --no-hydrate` y usar
un `HOME` remoto temporal nuevo antes de instalar dependencias o ejecutar
pruebas. Usa un arrendamiento recién precalentado dedicado a ese código fuente no confiable; nunca reutilices
un arrendamiento de confianza o cargado previamente. Inicia un binario Crabbox de confianza instalado
desde un checkout limpio y de confianza de `main` y obtén únicamente la PR remota con
`--fresh-pr`; nunca ejecutes localmente el contenedor ni la configuración del checkout no confiable.
Elimina `CRABBOX_AWS_INSTANCE_PROFILE` y aplica un cierre seguro salvo que el valor resuelto de
`aws.instanceProfile` esté vacío. Antes de cualquier instalación o prueba, usa herramientas de confianza
con rutas absolutas para exigir un token IMDSv2, demostrar que el endpoint de credenciales de IAM
devuelve 404 y verificar que `git rev-parse HEAD` remoto coincide con el SHA completo
de la cabecera de la PR revisada. Vincula el arrendamiento a ese SHA y detenlo o vuelve a precalentarlo cuando cambie la cabecera.
Carga el archivo de confianza `scripts/crabbox-untrusted-bootstrap.sh` desde un checkout limpio de
`main` junto con `--fresh-pr`; instala versiones fijadas de Node/pnpm, verifica el SHA
y la versión fijada del gestor de paquetes, aísla `HOME`, instala las dependencias y después ejecuta
la prueba solicitada. Si el intermediario no puede demostrar que no hay ningún rol o que no existe ninguna PR remota,
usa la CI de la bifurcación sin secretos. No uses `hydrate-github`, `--no-sync` ni un
flujo de trabajo de Testbox cargado con credenciales.
Elimina todas las anulaciones `CRABBOX_TAILSCALE*`, fuerza `--network public
--tailscale=false`, borra las opciones de nodo de salida/LAN y exige que `crabbox inspect`
indique una red pública sin estado de Tailscale antes de cargar cualquier script.

## Orden local habitual

1. `pnpm test:changed` para comprobar con Vitest el ámbito modificado.
2. `pnpm test <path-or-filter>` para un archivo, directorio u objetivo explícito.
3. `pnpm test` solo cuando necesites intencionadamente la suite local completa de Vitest.

En un árbol de trabajo de Codex o un checkout enlazado/disperso, los agentes evitan ejecutar directamente de forma local
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Alternativa local solicitada explícitamente por el usuario para un archivo pequeño:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Validaciones de cambios o comprobaciones amplias: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` para que pnpm se ejecute dentro de Testbox.
- El `exitCode` final del contenedor y el JSON de tiempos constituyen el resultado del comando. Una ejecución delegada de Blacksmith GitHub Actions puede mostrarse como `cancelled` tras un comando SSH correcto porque Testbox se detiene desde fuera de la acción de mantenimiento; comprueba el resumen del contenedor y la salida del comando antes de considerarlo un fallo.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mantiene la serialización de comprobaciones intensivas dentro del árbol de trabajo actual en lugar de usar el directorio común de Git para comandos como `pnpm check:changed` y ejecuciones específicas de `pnpm test ...`. Úsalo únicamente en hosts locales de alta capacidad cuando ejecutes intencionadamente comprobaciones independientes en varios árboles de trabajo enlazados.

## Comandos principales

Las ejecuciones del contenedor de pruebas terminan con un breve resumen `[test] passed|failed|skipped ... in ...`; la línea de duración propia de Vitest se mantiene como detalle por fragmento.

| Comando                                           | Qué hace                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Los objetivos explícitos de archivo/directorio se encaminan mediante carriles de Vitest con ámbito limitado. Las ejecuciones sin objetivo constituyen la comprobación de la suite completa: los grupos de fragmentos fijos se expanden a configuraciones hoja para la ejecución local en paralelo, y la distribución de fragmentos esperada se muestra antes de comenzar. El grupo de extensiones siempre se expande a configuraciones de fragmentos por extensión en lugar de usar un único proceso gigante del proyecto raíz. |
| `pnpm test:changed`                               | Ejecución inteligente y económica de pruebas modificadas: objetivos precisos derivados de ediciones directas de pruebas, archivos `*.test.ts` hermanos, asignaciones explícitas de código fuente y el grafo de importación local. Los cambios amplios, de configuración o de paquetes se omiten salvo que se correspondan con pruebas precisas.                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Ejecución amplia y explícita de pruebas modificadas; úsala cuando una edición del arnés de pruebas, la configuración o un paquete deba recurrir al comportamiento más amplio de Vitest para pruebas modificadas.                                                                                                                                                                                                              |
| `pnpm test:force`                                 | Libera el puerto configurado del Gateway de OpenClaw (predeterminado: `18789`) y después ejecuta la suite completa con un puerto aislado del Gateway para que las pruebas del servidor no colisionen con una instancia en ejecución.                                                                                                                                                                          |
| `pnpm test:coverage`                              | Genera un informe informativo de cobertura V8 para el carril de pruebas unitarias predeterminado (`vitest.unit.config.ts`); no se aplican umbrales de cobertura.                                                                                                                                                                                                                   |
| `pnpm test:coverage:changed`                      | Cobertura unitaria solo para los archivos modificados desde `origin/main`.                                                                                                                                                                                                                                                                                             |
| `pnpm changed:lanes`                              | Muestra los carriles arquitectónicos activados por las diferencias respecto a `origin/main`.                                                                                                                                                                                                                                                                            |
| `pnpm check:changed`                              | Delega de forma predeterminada en Crabbox/Testbox fuera de la CI y después ejecuta la validación inteligente de cambios dentro del proceso remoto secundario: formato, comprobación de tipos, lint y comandos de protección para los carriles afectados. No ejecuta Vitest; usa `pnpm test:changed` o `pnpm test <target>` para comprobar las pruebas.                                                                      |

## Estado compartido de pruebas y auxiliares de procesos

- `src/test-utils/openclaw-test-state.ts`: úsalo desde Vitest cuando una prueba necesite un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuración, espacio de trabajo, directorio del agente o almacén de perfiles de autenticación aislados.
- `pnpm test:env-mutations:report`: informe no bloqueante de pruebas/arneses que modifican directamente `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` o claves de entorno relacionadas. Úsalo para encontrar candidatos de migración al auxiliar compartido de estado de pruebas.
- `test/helpers/openclaw-test-instance.ts`: para pruebas E2E a nivel de proceso que necesiten un Gateway en ejecución, entorno de CLI, captura de registros y limpieza en un solo lugar.
- Los carriles E2E de Docker/Bash que cargan `scripts/lib/docker-e2e-image.sh` pueden pasar `docker_e2e_test_state_shell_b64 <label> <scenario>` al contenedor y decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; los scripts con varios directorios personales pueden pasar `docker_e2e_test_state_function_b64` y llamar a `openclaw_test_state_create <label> <scenario>` en cada flujo. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` escribe un archivo de entorno del host que puede cargarse (el `--` anterior a `create` evita que las versiones más recientes de Node interpreten `--env-file` como una opción de Node). Los carriles que inician un Gateway pueden cargar `scripts/lib/openclaw-e2e-instance.sh` para resolver el punto de entrada, iniciar una simulación de OpenAI, ejecutar en primer o segundo plano, realizar sondeos de disponibilidad, exportar el entorno de estado, volcar registros y limpiar procesos.

## Carriles de la interfaz de control, la TUI y las extensiones

- **E2E simuladas de la interfaz de control:** `pnpm test:ui:e2e` ejecuta la vía de Vitest + Playwright que inicia la interfaz de control de Vite y controla una página real de Chromium conectada a un WebSocket del Gateway simulado. Las pruebas se encuentran en `ui/src/**/*.e2e.test.ts`; las simulaciones y los controles compartidos se encuentran en `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` incluye esta vía. Las ejecuciones de agentes usan Testbox/Crabbox de forma predeterminada, incluida la validación específica; usa `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` solo como alternativa local explícita.
- **Pruebas PTY de la TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` ejecuta la vía PTY rápida con un backend simulado. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` o `pnpm tui:pty:test:watch --mode local` ejecuta la prueba de humo más lenta de `tui --local`, que solo simula el punto de conexión externo del modelo. Verifica texto visible estable o llamadas a fixtures, no capturas ANSI sin procesar.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los segmentos de extensiones/plugins. Los plugins de canales pesados, el plugin del navegador y OpenAI se ejecutan como segmentos dedicados; los demás grupos de plugins permanecen agrupados. `pnpm test extensions/<id>` ejecuta la vía de un plugin incluido.
- Los archivos fuente con pruebas adyacentes se asignan primero a esas pruebas antes de recurrir a patrones glob de directorios más amplios. Las modificaciones de auxiliares en `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` y `src/plugins/contracts` usan un grafo de importaciones local para ejecutar las pruebas que los importan, en lugar de ejecutar de forma general todos los segmentos cuando la ruta de dependencias es precisa.
- Los destinos de directorios de contratos se distribuyen entre sus vías de contratos: `pnpm test src/channels/plugins/contracts` ejecuta las cuatro configuraciones de contratos de canales y `pnpm test src/plugins/contracts` ejecuta la configuración de contratos de plugins, ya que los proyectos genéricos `channels`/`plugins` excluyen `contracts/**`.
- `auto-reply` se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el arnés de respuestas no domine las pruebas más ligeras de estado, tokens y auxiliares de nivel superior.
- Determinados archivos de prueba de `plugin-sdk` y `commands` se dirigen a vías ligeras dedicadas que conservan únicamente `test/setup.ts`, mientras los casos que requieren más recursos de ejecución permanecen en sus vías existentes.
- La configuración base de Vitest usa de forma predeterminada `pool: "threads"` e `isolate: false`, con el ejecutor compartido sin aislamiento habilitado en todas las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.

## Gateway y E2E

- La integración con Gateway es opcional: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: conjunto E2E del repositorio = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: pruebas de humo de extremo a extremo del Gateway (emparejamiento de varias instancias mediante WS/HTTP/Node). Usa de forma predeterminada `threads` + `isolate: false` con trabajadores adaptativos en `vitest.e2e.config.ts`; ajusta la cantidad con `OPENCLAW_E2E_WORKERS=<n>` y habilita registros detallados con `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: pruebas en vivo de proveedores (Claude/Minimax/DeepSeek/z.ai/etc., controladas mediante `*.live.test.ts`). Requiere claves de API y `LIVE=1` (o `OPENCLAW_LIVE_TEST=1`) para dejar de omitirlas; habilita una salida detallada con `OPENCLAW_LIVE_TEST_QUIET=0`.

## Conjunto completo de Docker (`pnpm test:docker:all`)

Construye la imagen compartida para pruebas en vivo, empaqueta OpenClaw una vez como un tarball de npm, construye o reutiliza una imagen básica de ejecución con Node/Git y una imagen funcional que instala ese tarball en `/app`, y luego ejecuta las vías de pruebas de humo de Docker mediante un planificador ponderado. `scripts/package-openclaw-for-docker.mjs` es el único empaquetador local y de CI, y valida el tarball junto con `dist/postinstall-inventory.json` antes de que Docker lo utilice.

- Imagen básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): vías del instalador, actualización y dependencias de plugins; monta el tarball precompilado en lugar de fuentes copiadas del repositorio.
- Imagen funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): vías de funcionalidad normal de la aplicación compilada.
- Definiciones de vías: `scripts/lib/docker-e2e-scenarios.mjs`. Planificador: `scripts/lib/docker-e2e-plan.mjs`. Ejecutor: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` genera el plan de CI administrado por el planificador (vías, tipos de imagen, necesidades de paquetes e imágenes en vivo, escenarios de estado y comprobaciones de credenciales) sin compilar ni ejecutar Docker.

Parámetros de planificación (variables de entorno, valores predeterminados entre paréntesis):

| Variable de entorno                                                                                             | Valor predeterminado | Propósito                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                   | Espacios de procesos.                                                                                                                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                   | Grupo de cola sensible al proveedor.                                                                                                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                    | Límite de vías pesadas de proveedores en vivo.                                                                                                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                    | Límite de vías que usan recursos de npm.                                                                                                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                    | Límite de vías que usan recursos de servicios.                                                                                                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                    | Límites de vías pesadas por proveedor.                                                                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                    | Límites más reducidos por proveedor.                                                                                                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                    | Valor de reemplazo para hosts más grandes.                                                                                                                                                                                                                                                                                                                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                 | Retraso entre inicios de vías para evitar ráfagas de creación en el daemon local de Docker.                                                                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min)  | Tiempo de espera alternativo por vía; determinadas vías en vivo o de cola usan límites más estrictos.                                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                    | Reintentos para fallos transitorios de proveedores en vivo.                                                                                                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | desactivado          | Imprime el manifiesto de vías sin ejecutar Docker.                                                                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000                | Intervalo de impresión del estado de las vías activas.                                                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | activado             | Reutiliza `.artifacts/docker-tests/lane-timings.json` para ordenar de mayor a menor duración; establece el valor en `0` para deshabilitarlo.                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                    | `skip` para ejecutar únicamente vías deterministas/locales; `only` para ejecutar únicamente vías de proveedores en vivo. Alias: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. El modo exclusivo en vivo combina las vías en vivo principales y de cola en un único grupo ordenado de mayor a menor duración para que los grupos de proveedores agrupen el trabajo de Claude/Codex/Gemini. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                  | Tiempo de espera de configuración de Docker para el backend de la CLI.                                                                                                                                                                                                                                                                                                                      |

El patrón de variables de entorno para los límites de recursos es `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nombre del recurso en mayúsculas, con los caracteres no alfanuméricos convertidos en `_`).

Otro comportamiento: el ejecutor realiza de forma predeterminada una comprobación previa de Docker, limpia los contenedores E2E obsoletos de OpenClaw, comparte las cachés de herramientas CLI de proveedores entre carriles compatibles y deja de programar nuevos carriles agrupados después del primer fallo, salvo que se establezca `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`. Si un carril supera el límite efectivo de peso/recursos en un host con poco paralelismo, aun así puede iniciarse desde un grupo vacío y ejecutarse en solitario hasta que libere capacidad. Los registros de cada carril, `summary.json`, `failures.json` y los tiempos de las fases se escriben en `.artifacts/docker-tests/<run-id>/`; use `pnpm test:docker:timings <summary.json>` para inspeccionar los carriles lentos y `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para mostrar comandos económicos de reejecución dirigida.

### Carriles de Docker destacados

| Comando                                                                     | Verifica                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Contenedor E2E de código fuente respaldado por Chromium, con CDP sin procesar y un Gateway aislado; las instantáneas de roles CDP de `browser doctor --deep` incluyen las URL de los enlaces, elementos en los que se puede hacer clic promovidos por el cursor, referencias de iframe y metadatos de marcos.                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `pnpm test:docker:skill-install`                                            | Instala el archivo tar empaquetado en un ejecutor Docker básico con `skills.install.allowUploadedArchives: false`, resuelve el identificador de una skill actual mediante una búsqueda en vivo en ClawHub, la instala mediante `openclaw skills install` y verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` y `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Pruebas en vivo específicas del backend de CLI; Gemini dispone de alias equivalentes `:resume` y `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI en Docker: inicia sesión, comprueba `/api/models` y ejecuta un chat real mediante proxy a través de `/api/chat/completions`. Requiere una clave válida de un modelo en vivo y descarga una imagen externa; no se espera que sea tan estable en CI como los conjuntos de pruebas unitarias/E2E.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:mcp-channels`                                             | Contenedor de Gateway con datos iniciales más un contenedor cliente que inicia `openclaw mcp serve`: descubrimiento enrutado de conversaciones, lectura de transcripciones, metadatos de adjuntos, comportamiento de la cola de eventos en vivo, enrutamiento de envíos salientes y notificaciones de permisos y canales al estilo de Claude mediante el puente stdio real (la aserción lee directamente las tramas MCP de stdio sin procesar).                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:upgrade-survivor`                                         | Instala el archivo tar empaquetado sobre un entorno de prueba modificado de un usuario antiguo, ejecuta la actualización del paquete y el diagnóstico no interactivo sin claves activas de proveedores/canales, inicia un Gateway en local loopback y comprueba que se conserven los agentes, la configuración de canales, las listas de permitidos de plugins, los archivos del espacio de trabajo y de sesiones, el estado obsoleto de dependencias de plugins heredados, el inicio y el estado RPC.                                                                                                                                                                                                                                                   |
| `pnpm test:docker:published-upgrade-survivor`                               | Instala `openclaw@latest` de forma predeterminada, crea archivos realistas de un usuario existente, configura mediante una receta integrada de `openclaw config set`, actualiza al archivo tar empaquetado, ejecuta el diagnóstico no interactivo, escribe `.artifacts/upgrade-survivor/summary.json` y comprueba `/healthz`, `/readyz` y el estado RPC. Sobrescriba con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, amplíe una matriz con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` o añada entornos de prueba de escenarios con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (incluye `configured-plugin-installs` y `stale-source-plugin-shadow`). La aceptación de paquetes los expone como `published_upgrade_survivor_baseline(s)` / `_scenarios` y resuelve metatokens como `last-stable-4` o `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Entorno de pruebas de supervivencia a actualizaciones publicadas en el escenario `plugin-deps-cleanup`, comenzando de forma predeterminada en `openclaw@2026.4.23`. El flujo de trabajo `Update Migration` lo amplía con `baselines=all-since-2026.4.23` para demostrar la limpieza de dependencias de plugins configurados fuera de la CI de versión completa.                                                                                                                                                                                                                                                                                                                                                                                             |
| `pnpm test:docker:plugins`                                                  | Prueba de humo de instalación/actualización para rutas locales, `file:`, paquetes del registro npm con dependencias elevadas, referencias móviles de git, entornos de prueba de ClawHub, actualizaciones del mercado y activación/inspección de paquetes de Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

## Comprobación local de PR

Para las comprobaciones locales de aceptación/validación de PR, ejecute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` presenta fallos intermitentes en un host con carga, vuelva a ejecutarlo una vez antes de considerarlo una regresión y, después, aísle el problema con `pnpm test <path/to/test>`. Para hosts con memoria limitada:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Herramientas de rendimiento de pruebas

- `pnpm test:perf:imports`: habilita los informes de duración y desglose de importaciones de Vitest, mientras sigue usando el enrutamiento de carriles con ámbito para destinos explícitos de archivos/directorios. `pnpm test:perf:imports:changed` limita el mismo perfilado a los archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` evalúa el rendimiento de la ruta en modo de cambios enrutada frente a la ejecución nativa del proyecto raíz para la misma diferencia de Git confirmada; `pnpm test:perf:changed:bench -- --worktree` evalúa el rendimiento del conjunto de cambios actual del árbol de trabajo sin confirmarlo primero.
- `pnpm test:perf:profile:main` escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` escribe perfiles de CPU y memoria dinámica para el ejecutor de pruebas unitarias (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta en serie cada configuración hoja de Vitest de la suite completa y escribe datos de duración agrupados, además de artefactos JSON y registros por configuración. Los informes de la suite completa aíslan los archivos de forma predeterminada para que los grafos de módulos retenidos y las pausas del recolector de basura de archivos anteriores no se imputen a aserciones posteriores; pasa `-- --no-isolate` solo cuando se perfile intencionadamente la acumulación en trabajadores compartidos. El agente de rendimiento de pruebas usa esto como referencia inicial antes de intentar corregir pruebas lentas. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` compara los informes agrupados después de un cambio centrado en el rendimiento.
- Las ejecuciones de fragmentos completos, de extensiones y con patrones de inclusión actualizan los datos locales de tiempos en `.artifacts/vitest-shard-timings.json`; las ejecuciones completas posteriores de una configuración usan esos tiempos para equilibrar los fragmentos lentos y rápidos. Los fragmentos de CI con patrones de inclusión añaden el nombre del fragmento a la clave de tiempos, lo que mantiene visibles los tiempos de los fragmentos filtrados sin sustituir los datos de tiempos de la configuración completa. Establece `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.

## Pruebas de rendimiento

<Accordion title="Latencia del modelo (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Variables de entorno opcionales: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Instrucción predeterminada: «Responde con una sola palabra: ok. Sin puntuación ni texto adicional».

</Accordion>

<Accordion title="Inicio de la CLI (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

Preajustes:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambos preajustes combinados

La salida incluye `sampleCount`, promedio, p50, p95, mínimo/máximo, distribución de códigos de salida/señales y RSS máximo por comando. `--cpu-prof-dir` / `--heap-prof-dir` escriben perfiles de V8 por ejecución.

Salida guardada: `pnpm test:startup:bench:smoke` escribe `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` escribe `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Archivo de referencia incluido en el repositorio: `test/fixtures/cli-startup-bench.json`, actualizado mediante `pnpm test:startup:bench:update` y comparado mediante `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Inicio del Gateway (scripts/bench-gateway-startup.ts)">

De forma predeterminada, usa el punto de entrada compilado de la CLI en `dist/entry.js`; ejecuta primero `pnpm build`. Pasa `--entry scripts/run-node.mjs` para medir en su lugar el ejecutor del código fuente y mantén esos resultados separados de las referencias iniciales del punto de entrada compilado.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Identificadores de casos: `default`, `skipChannels` (se omite el inicio de los canales), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 plugins de manifiesto), `fiftyStartupLazyPlugins` (50 plugins de manifiesto con inicio diferido).

La salida incluye la primera salida del proceso, `/healthz`, `/readyz`, el tiempo del registro de escucha HTTP, el tiempo del registro de disponibilidad del Gateway, el tiempo de CPU, la proporción de núcleos de CPU, el RSS máximo, la memoria dinámica, las métricas de seguimiento del inicio, el retraso del bucle de eventos y las métricas detalladas de la tabla de búsqueda de plugins. El script establece `OPENCLAW_GATEWAY_STARTUP_TRACE=1` en el entorno del Gateway secundario.

`/healthz` indica vitalidad (el servidor HTTP puede responder). `/readyz` indica disponibilidad operativa (los procesos auxiliares de plugins de inicio, los canales y el trabajo posterior a la conexión crítico para la disponibilidad han finalizado). Los hooks de inicio se despachan de forma asíncrona y no forman parte de la garantía de disponibilidad. El tiempo del registro de disponibilidad es la marca de tiempo interna del Gateway, útil para atribuir tiempos al proceso, pero no sustituye la comprobación externa de `/readyz`.

Usa la salida JSON o `--output` al comparar cambios. Usa `--cpu-prof-dir` solo después de que la salida del seguimiento señale trabajo de importación, compilación o limitado por la CPU que los tiempos de las fases por sí solos no puedan explicar.

</Accordion>

<Accordion title="Reinicio del Gateway (scripts/bench-gateway-restart.ts)">

Solo para macOS y Linux (usa SIGUSR1 para reinicios dentro del proceso; falla inmediatamente en Windows). Tiene el mismo punto de entrada compilado predeterminado y la misma sustitución mediante `--entry scripts/run-node.mjs` que el inicio del Gateway descrito anteriormente.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Identificadores de casos: `skipChannels`, `skipChannelsAcpxProbe` (sondeo de inicio de ACPX activado), `skipChannelsNoAcpxProbe` (sondeo desactivado), `default`, `fiftyPlugins`.

La salida incluye el siguiente `/healthz`, el siguiente `/readyz`, el tiempo de inactividad, el tiempo hasta la disponibilidad tras el reinicio, la CPU, el RSS, las métricas de seguimiento del inicio del proceso de sustitución y las métricas de seguimiento del reinicio para el manejo de señales, el drenaje del trabajo activo, las fases de cierre, el siguiente inicio, el tiempo hasta la disponibilidad y las instantáneas de memoria. El script establece `OPENCLAW_GATEWAY_STARTUP_TRACE=1` y `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Usa esta prueba de rendimiento cuando un cambio afecte a la señalización de reinicio, los controladores de cierre, el inicio posterior al reinicio, el apagado de procesos auxiliares, el traspaso del servicio o la disponibilidad tras el reinicio. Empieza con `skipChannels` para aislar la mecánica del Gateway del inicio de los canales; usa `default` o casos con muchos plugins solo después de que el caso acotado explique la ruta de reinicio. Las métricas de seguimiento son indicios de atribución, no veredictos: evalúa un cambio de reinicio a partir de varias muestras, el intervalo correspondiente del propietario, el comportamiento de `/healthz`/`/readyz` y el contrato de reinicio visible para el usuario.

</Accordion>

## Incorporación E2E (Docker)

Opcional; solo es necesario para las pruebas rápidas de incorporación en contenedores. Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Controla el asistente interactivo mediante un seudoterminal, verifica los archivos de configuración, espacio de trabajo y sesión; después, inicia el Gateway y ejecuta `openclaw health`.

## Prueba rápida de importación de QR (Docker)

Garantiza que el auxiliar mantenido del entorno de ejecución de QR se cargue en los entornos de ejecución de Node compatibles con Docker (Node 24 de forma predeterminada, compatible con Node 22):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
