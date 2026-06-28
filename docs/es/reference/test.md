---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos de forzado/cobertura
title: Pruebas
x-i18n:
    generated_at: "2026-06-28T00:13:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de pruebas (suites, en vivo, Docker): [Pruebas](/es/help/testing)
- Validación de actualizaciones y paquetes de plugin: [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)

- Orden rutinario de pruebas locales:
  1. `pnpm test:changed` para prueba de Vitest con alcance de cambios.
  2. `pnpm test <path-or-filter>` para un archivo, directorio u objetivo explícito.
  3. `pnpm test` solo cuando necesitas intencionalmente la suite local completa de Vitest.
- `pnpm test:force`: Mata cualquier proceso de gateway persistente que retenga el puerto de control predeterminado y luego ejecuta la suite completa de Vitest con un puerto de Gateway aislado para que las pruebas de servidor no colisionen con una instancia en ejecución. Úsalo cuando una ejecución previa de Gateway haya dejado ocupado el puerto 18789.
- `pnpm test:coverage`: Ejecuta la suite unitaria con cobertura V8 (mediante `vitest.unit.config.ts`). Esta es una puerta de cobertura del carril unitario predeterminado, no cobertura de todos los archivos de todo el repositorio. Los umbrales son 70% para líneas/funciones/sentencias y 55% para ramas. Como `coverage.all` es false y el carril predeterminado limita los includes de cobertura a pruebas unitarias no rápidas con archivos fuente hermanos, la puerta mide el código fuente propiedad de este carril en lugar de cada importación transitiva que llegue a cargar.
- `pnpm test:coverage:changed`: Ejecuta cobertura unitaria solo para archivos cambiados desde `origin/main`.
- `pnpm test:changed`: ejecución barata e inteligente de pruebas modificadas. Ejecuta objetivos precisos a partir de ediciones directas de pruebas, archivos hermanos `*.test.ts`, mapeos explícitos de código fuente y el grafo local de importaciones. Los cambios amplios/de configuración/de paquete se omiten salvo que se asignen a pruebas precisas.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: ejecución explícita amplia de pruebas modificadas. Úsala cuando una edición de arnés/configuración/paquete de pruebas deba recurrir al comportamiento más amplio de pruebas modificadas de Vitest.
- `pnpm changed:lanes`: muestra los carriles arquitectónicos activados por el diff contra `origin/main`.
- `pnpm check:changed`: delega en Crabbox/Testbox de forma predeterminada fuera de CI y luego ejecuta la puerta inteligente de comprobación de cambios para el diff contra `origin/main` dentro del hijo remoto. Ejecuta typecheck, lint y comandos de guardia para los carriles arquitectónicos afectados, pero no ejecuta pruebas de Vitest. Usa `pnpm test:changed` o `pnpm test <target>` explícito para prueba de tests.
- Worktrees de Codex y checkouts enlazados/dispersos: evita `pnpm test*`, `pnpm check*` y `pnpm crabbox:run` locales directos salvo que hayas verificado que pnpm no conciliará dependencias. Para prueba diminuta de archivo explícito usa `node scripts/run-vitest.mjs <path-or-filter>`; para puertas de cambios o prueba amplia usa `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` para que pnpm se ejecute dentro de Testbox.
- Prueba de Testbox mediante Crabbox: usa el `exitCode` final del wrapper y el JSON de tiempos como resultado del comando. La ejecución delegada de Blacksmith GitHub Actions puede mostrar `cancelled` después de un comando SSH exitoso porque el Testbox se detiene desde fuera de la acción de keepalive; verifica el resumen del wrapper y la salida del comando antes de tratarlo como un fallo de prueba.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mantiene la serialización de comprobaciones pesadas dentro del worktree actual en lugar del directorio común de Git para comandos como `pnpm check:changed` y `pnpm test ...` dirigidos. Úsalo solo en hosts locales de alta capacidad cuando ejecutes intencionalmente comprobaciones independientes entre worktrees enlazados.
- `pnpm test`: enruta objetivos explícitos de archivo/directorio a través de carriles de Vitest con alcance. Las ejecuciones sin objetivo son prueba de suite completa: usan grupos de shards fijos, se expanden a configuraciones hoja para ejecución paralela local e imprimen la dispersión de shards local esperada antes de comenzar. El grupo de extensiones siempre se expande a las configuraciones de shard por extensión en lugar de a un proceso gigante de proyecto raíz.
- Las ejecuciones del wrapper de pruebas terminan con un resumen breve `[test] passed|failed|skipped ... in ...`. La línea de duración propia de Vitest permanece como detalle por shard.
- Estado de pruebas compartido de OpenClaw: usa `src/test-utils/openclaw-test-state.ts` desde Vitest cuando una prueba necesite un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuración, workspace, directorio de agente o almacén de perfiles de autenticación aislados.
- `pnpm test:env-mutations:report`: informe no bloqueante de pruebas y arneses que mutan directamente `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` o claves de entorno relacionadas de OpenClaw. Úsalo para encontrar candidatos para migración al helper compartido de estado de pruebas.
- E2E simulado de Control UI: usa `pnpm test:ui:e2e` para el carril Vitest + Playwright que inicia la Control UI de Vite y maneja una página real de Chromium contra un WebSocket de Gateway simulado. Las pruebas viven en `ui/src/**/*.e2e.test.ts`; los mocks y controles compartidos viven en `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` incluye este carril. En worktrees de Codex, prefiere `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` para prueba diminuta dirigida después de instalar dependencias, o Testbox/Crabbox para prueba GUI más amplia.
- Helpers de E2E de proceso: usa `test/helpers/openclaw-test-instance.ts` cuando una prueba E2E de nivel de proceso de Vitest necesita un Gateway en ejecución, entorno CLI, captura de logs y limpieza en un solo lugar.
- Pruebas TUI PTY: usa `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` para el carril PTY rápido de backend falso. Usa `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` o `pnpm tui:pty:test:watch --mode local` para el smoke más lento de `tui --local`, que simula solo el endpoint externo del modelo. Afirma texto visible estable o llamadas a fixtures, no snapshots ANSI sin procesar.
- Helpers de E2E Docker/Bash: los carriles que hacen source de `scripts/lib/docker-e2e-image.sh` pueden pasar `docker_e2e_test_state_shell_b64 <label> <scenario>` al contenedor y decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; los scripts multi-home pueden pasar `docker_e2e_test_state_function_b64` y llamar a `openclaw_test_state_create <label> <scenario>` en cada flujo. Los llamadores de menor nivel pueden usar `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` para un snippet de shell dentro del contenedor, o `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` para un archivo de entorno de host al que se pueda hacer source. El `--` antes de `create` evita que runtimes más nuevos de Node traten `--env-file` como una bandera de Node. Los carriles Docker/Bash que lanzan un Gateway pueden hacer source de `scripts/lib/openclaw-e2e-instance.sh` dentro del contenedor para resolución de entrypoint, arranque simulado de OpenAI, lanzamiento de Gateway en primer plano/segundo plano, sondas de readiness, exportación de entorno de estado, volcados de logs y limpieza de procesos.
- Las ejecuciones de shards completas, de extensiones y con patrón de inclusión actualizan datos de tiempos locales en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores de configuración completa usan esos tiempos para equilibrar shards lentos y rápidos. Los shards de CI con patrón de inclusión agregan el nombre del shard a la clave de tiempos, lo que mantiene visibles los tiempos de shards filtrados sin reemplazar los datos de tiempos de configuración completa. Define `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.
- Archivos de prueba seleccionados de `plugin-sdk` y `commands` ahora se enrutan por carriles ligeros dedicados que mantienen solo `test/setup.ts`, dejando los casos pesados de runtime en sus carriles existentes.
- Los archivos fuente con pruebas hermanas se asignan a ese hermano antes de recurrir a globs de directorio más amplios. Las ediciones de helpers bajo `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` y `src/plugins/contracts` usan un grafo local de importaciones para ejecutar las pruebas que importan, en lugar de ejecutar ampliamente cada shard cuando la ruta de dependencia es precisa.
- `auto-reply` ahora también se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el arnés de respuestas no domine las pruebas más ligeras de estado/token/helpers de nivel superior.
- La configuración base de Vitest ahora usa de forma predeterminada `pool: "threads"` e `isolate: false`, con el runner compartido no aislado habilitado en todas las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los shards de extensiones/plugins. Los plugins pesados de canal, el plugin de navegador y OpenAI se ejecutan como shards dedicados; otros grupos de plugins permanecen agrupados. Usa `pnpm test extensions/<id>` para un carril de un solo plugin incluido.
- `pnpm test:perf:imports`: habilita informes de duración de importaciones + desglose de importaciones de Vitest, sin dejar de usar enrutamiento por carriles con alcance para objetivos explícitos de archivo/directorio.
- `pnpm test:perf:imports:changed`: el mismo perfilado de importaciones, pero solo para archivos cambiados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mide el rendimiento de la ruta en modo de cambios enrutada frente a la ejecución nativa del proyecto raíz para el mismo diff de git confirmado.
- `pnpm test:perf:changed:bench -- --worktree` mide el rendimiento del conjunto de cambios del worktree actual sin confirmar primero.
- `pnpm test:perf:profile:main`: escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: escribe perfiles de CPU + heap para el runner unitario (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta en serie cada configuración hoja de Vitest de la suite completa y escribe datos de duración agrupados más artefactos JSON/log por configuración. El Test Performance Agent usa esto como línea base antes de intentar correcciones de pruebas lentas.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara informes agrupados después de un cambio centrado en rendimiento.
- `pnpm test:docker:timings <summary.json>` inspecciona carriles Docker lentos después de una ejecución Docker completa; usa `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de repetición dirigidos desde los mismos artefactos.
- Integración de Gateway: participación opcional mediante `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: Ejecuta el agregado E2E del repositorio: pruebas smoke end-to-end de Gateway más el carril E2E de navegador simulado de Control UI.
- `pnpm test:e2e:gateway`: Ejecuta pruebas smoke end-to-end de Gateway (emparejamiento multiinstancia WS/HTTP/node). Usa de forma predeterminada `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajusta con `OPENCLAW_E2E_WORKERS=<n>` y define `OPENCLAW_E2E_VERBOSE=1` para logs detallados.
- `pnpm test:live`: Ejecuta pruebas live de proveedores (minimax/zai). Requiere claves de API y `LIVE=1` (o `*_LIVE_TEST=1` específico del proveedor) para dejar de omitirlas.
- `pnpm test:docker:all`: Compila la imagen compartida de pruebas live, empaqueta OpenClaw una vez como un tarball de npm, compila/reutiliza una imagen básica de ejecución con Node/Git más una imagen funcional que instala ese tarball en `/app`, y luego ejecuta carriles de smoke de Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` mediante un planificador ponderado. La imagen básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) se usa para carriles de instalador/actualización/dependencias de Plugin; esos carriles montan el tarball precompilado en lugar de usar fuentes copiadas del repositorio. La imagen funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) se usa para carriles normales de funcionalidad de la aplicación compilada. `scripts/package-openclaw-for-docker.mjs` es el único empaquetador local/CI y valida el tarball más `dist/postinstall-inventory.json` antes de que Docker lo consuma. Las definiciones de carriles de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. `node scripts/test-docker-all.mjs --plan-json` emite el plan de CI propiedad del planificador para carriles seleccionados, tipos de imagen, necesidades de paquete/imagen live, escenarios de estado y comprobaciones de credenciales sin compilar ni ejecutar Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla los espacios de proceso y tiene un valor predeterminado de 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla el grupo de cola sensible al proveedor y tiene un valor predeterminado de 10. Los límites de carriles pesados tienen valores predeterminados de `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; los límites de proveedor tienen como valor predeterminado un carril pesado por proveedor mediante `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` y `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` u `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts más grandes. Si un carril supera el peso efectivo o el límite de recursos en un host de bajo paralelismo, aún puede iniciarse desde un grupo vacío y se ejecutará solo hasta que libere capacidad. Los inicios de carril se escalonan 2 segundos de forma predeterminada para evitar tormentas de creación del daemon local de Docker; sobrescríbelo con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. El ejecutor realiza preflight de Docker de forma predeterminada, limpia contenedores E2E obsoletos de OpenClaw, emite estado de carriles activos cada 30 segundos, comparte cachés de herramientas CLI de proveedores entre carriles compatibles, reintenta una vez de forma predeterminada los fallos transitorios de proveedores live (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) y almacena tiempos de carriles en `.artifacts/docker-tests/lane-timings.json` para ordenar primero los más largos en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto de carriles sin ejecutar Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar la salida de estado, o `OPENCLAW_DOCKER_ALL_TIMINGS=0` para deshabilitar la reutilización de tiempos. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo para carriles deterministas/locales o `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo para carriles de proveedores live; los alias de paquete son `pnpm test:docker:local:all` y `pnpm test:docker:live:all`. El modo solo live fusiona los carriles live principales y de cola en un único grupo ordenado primero por los más largos para que los buckets de proveedor puedan empaquetar juntos trabajo de Claude, Codex y Gemini. El ejecutor deja de planificar nuevos carriles agrupados después del primer fallo a menos que se establezca `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, y cada carril tiene un tiempo de espera de respaldo de 120 minutos sobrescribible con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; los carriles live/de cola seleccionados usan límites por carril más estrictos. Los comandos de configuración de Docker del backend de CLI tienen su propio tiempo de espera mediante `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predeterminado 180). Los registros por carril, `summary.json`, `failures.json` y tiempos de fase se escriben bajo `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` para inspeccionar carriles lentos y `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos de reejecución específicos y baratos.
- `pnpm test:docker:browser-cdp-snapshot`: Compila un contenedor E2E de fuentes respaldado por Chromium, inicia CDP sin procesar más un Gateway aislado, ejecuta `browser doctor --deep` y verifica que las instantáneas de roles de CDP incluyan URL de enlaces, elementos clicables promovidos por cursor, referencias de iframe y metadatos de frame.
- `pnpm test:docker:skill-install`: Instala el tarball empaquetado de OpenClaw en un ejecutor básico de Docker, deshabilita `skills.install.allowUploadedArchives`, resuelve un slug de skill actual desde la búsqueda live de ClawHub, lo instala mediante `openclaw skills install` y verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` y `skills info --json`.
- Las sondas live de Docker del backend de CLI se pueden ejecutar como carriles enfocados, por ejemplo `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` o `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini tiene alias equivalentes `:resume` y `:mcp`.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI dockerizados, inicia sesión mediante Open WebUI, comprueba `/api/models` y luego ejecuta un chat real con proxy mediante `/api/chat/completions`. Requiere una clave de modelo live utilizable, extrae una imagen externa de Open WebUI y no se espera que sea estable en CI como las suites normales unitarias/e2e.
- `pnpm test:docker:mcp-channels`: Inicia un contenedor de Gateway con datos iniciales y un segundo contenedor cliente que genera `openclaw mcp serve`, luego verifica el descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos, comportamiento de cola de eventos live, enrutamiento de envíos salientes y notificaciones de canal + permisos al estilo Claude sobre el puente stdio real. La aserción de notificación de Claude lee directamente los frames MCP stdio sin procesar para que el smoke refleje lo que el puente realmente emite.
- `pnpm test:docker:upgrade-survivor`: Instala el tarball empaquetado de OpenClaw sobre un fixture sucio de usuario antiguo, ejecuta actualización de paquete más doctor no interactivo sin claves de proveedor live ni de canal, luego inicia un Gateway de local loopback y comprueba que agentes, configuración de canal, listas de permitidos de Plugin, archivos de espacio de trabajo/sesión, estado obsoleto de dependencias de Plugin heredado, inicio y estado RPC sobrevivan.
- `pnpm test:docker:published-upgrade-survivor`: Instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente sin claves de proveedor live ni de canal, configura esa base con una receta incorporada de comando `openclaw config set`, actualiza esa instalación publicada al tarball empaquetado de OpenClaw, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway de local loopback y comprueba que intenciones configuradas, archivos de espacio de trabajo/sesión, configuración obsoleta de Plugin y estado de dependencias heredado, inicio, `/healthz`, `/readyz` y estado RPC sobrevivan o se reparen limpiamente. Sobrescribe una base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, expande una matriz local exacta con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, o agrega fixtures de escenario con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; el conjunto reported-issues incluye `configured-plugin-installs` para verificar que los Plugins externos de OpenClaw configurados se instalen automáticamente durante la actualización y `stale-source-plugin-shadow` para evitar que sombras de Plugin solo de fuente rompan el inicio. Package Acceptance expone esos valores como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`, y resuelve tokens de base meta como `last-stable-4` o `all-since-2026.4.23` antes de entregar especificaciones exactas de paquete a los carriles de Docker.
- `pnpm test:docker:update-migration`: Ejecuta el arnés de supervivencia de actualización publicada en el escenario con mucha limpieza `plugin-deps-cleanup`, comenzando en `openclaw@2026.4.23` de forma predeterminada. El flujo de trabajo separado `Update Migration` expande este carril con `baselines=all-since-2026.4.23` para que cada paquete estable publicado desde `.23` en adelante se actualice al candidato y demuestre la limpieza de dependencias de Plugin configuradas fuera de Full Release CI.
- `pnpm test:docker:plugins`: Ejecuta smoke de instalación/actualización para ruta local, `file:`, paquetes del registro npm con dependencias elevadas, refs móviles de git, fixtures de ClawHub, actualizaciones de marketplace e habilitar/inspeccionar paquete de Claude.

## Puerta local de PR

Para comprobaciones locales de aterrizaje/puerta de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla de forma intermitente en un host cargado, vuelve a ejecutarlo una vez antes de tratarlo como una regresión y luego aísla con `pnpm test <path/to/test>`. Para hosts con memoria limitada, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banco de latencia de modelos (claves locales)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Entorno opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predeterminado: "Responde con una sola palabra: ok. Sin puntuación ni texto adicional."

Última ejecución (2025-12-31, 20 ejecuciones):

- mediana de minimax 1279ms (mín. 1114, máx. 2431)
- mediana de opus 2454ms (mín. 1224, máx. 3170)

## Banco de arranque de CLI

Script: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Uso:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preajustes:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambos preajustes

La salida incluye `sampleCount`, promedio, p50, p95, mín./máx., distribución de códigos de salida/señales y resúmenes de RSS máximo para cada comando. Opcionalmente, `--cpu-prof-dir` / `--heap-prof-dir` escribe perfiles V8 por ejecución para que la temporización y la captura de perfiles usen el mismo arnés.

Convenciones de salida guardada:

- `pnpm test:startup:bench:smoke` escribe el artefacto de smoke dirigido en `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` escribe el artefacto de la suite completa en `.artifacts/cli-startup-bench-all.json` usando `runs=5` y `warmup=1`
- `pnpm test:startup:bench:update` actualiza el fixture base versionado en `test/fixtures/cli-startup-bench.json` usando `runs=5` y `warmup=1`

Fixture versionado:

- `test/fixtures/cli-startup-bench.json`
- Actualiza con `pnpm test:startup:bench:update`
- Compara los resultados actuales con el fixture usando `pnpm test:startup:bench:check`

## Banco de arranque de Gateway

Script: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

El benchmark usa de forma predeterminada la entrada de CLI compilada en `dist/entry.js`; ejecuta
`pnpm build` antes de usar los comandos de script del paquete. Para medir el ejecutor de código fuente
en su lugar, pasa `--entry scripts/run-node.mjs` y mantén esos resultados
separados de las líneas base de la entrada compilada.

Uso:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

IDs de casos:

- `default`: arranque normal de Gateway.
- `skipChannels`: arranque de Gateway con el arranque de canales omitido.
- `oneInternalHook`: un hook interno configurado.
- `allInternalHooks`: todos los hooks internos.
- `fiftyPlugins`: 50 plugins de manifiesto.
- `fiftyStartupLazyPlugins`: 50 plugins de manifiesto con arranque diferido.

La salida incluye la primera salida del proceso, `/healthz`, `/readyz`, tiempo del log de escucha HTTP,
tiempo del log de Gateway listo, tiempo de CPU, proporción de núcleos de CPU, RSS máximo, heap, métricas
de traza de arranque, retraso del bucle de eventos y métricas detalladas de la tabla de búsqueda de plugins. El script
habilita `OPENCLAW_GATEWAY_STARTUP_TRACE=1` en el entorno del Gateway hijo.

Lee `/healthz` como vivacidad: el servidor HTTP puede responder. Lee `/readyz` como
preparación utilizable: los sidecars de plugins de arranque, los canales y el trabajo
posterior al adjunto crítico para estar listo se han estabilizado. Los hooks de arranque de Gateway se despachan
de forma asíncrona y no forman parte de la garantía de preparación. El tiempo del log de listo es la
marca de tiempo interna del log de listo de Gateway; es útil para atribución del lado del proceso,
pero no sustituye la sonda externa `/readyz`.

Usa salida JSON o `--output` al comparar cambios. Usa `--cpu-prof-dir` solo
después de que la salida de traza apunte a importación, compilación o trabajo ligado a CPU que no pueda
explicarse solo con las temporizaciones de fase. No compares resultados del ejecutor de código fuente con
resultados compilados de `dist/entry.js` como si fueran la misma línea base.

## Banco de reinicio de Gateway

Script: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

El benchmark de reinicio solo es compatible con macOS y Linux. Usa SIGUSR1 para
reinicios dentro del proceso y falla inmediatamente en Windows.

El benchmark usa de forma predeterminada la entrada de CLI compilada en `dist/entry.js`; ejecuta
`pnpm build` antes de usar los comandos de script del paquete. Para medir el ejecutor de código fuente
en su lugar, pasa `--entry scripts/run-node.mjs` y mantén esos resultados
separados de las líneas base de la entrada compilada.

Uso:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

IDs de casos:

- `skipChannels`: reinicio con canales omitidos.
- `skipChannelsAcpxProbe`: reinicio con canales omitidos y sonda de arranque ACPX activada.
- `skipChannelsNoAcpxProbe`: reinicio con canales omitidos y sonda de arranque ACPX desactivada.
- `default`: reinicio normal.
- `fiftyPlugins`: reinicio con 50 plugins de manifiesto.

La salida incluye el siguiente `/healthz`, el siguiente `/readyz`, tiempo de inactividad, temporización
de listo tras reinicio, CPU, RSS, métricas de traza de arranque para el proceso de reemplazo y métricas
de traza de reinicio para manejo de señales, drenaje de trabajo activo, fases de cierre, siguiente arranque,
temporización de listo e instantáneas de memoria. El script habilita
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` y `OPENCLAW_GATEWAY_RESTART_TRACE=1` en el
entorno del Gateway hijo.

Usa este benchmark cuando un cambio toca señalización de reinicio, manejadores de cierre,
arranque tras reinicio, apagado de sidecars, traspaso de servicio o preparación después del
reinicio. Empieza con `skipChannels` al aislar la mecánica de Gateway del arranque de canales.
Usa `default` o casos con muchos plugins solo después de que el caso estrecho explique
la ruta de reinicio.

Las métricas de traza son pistas de atribución, no veredictos. Un cambio de reinicio debe
juzgarse a partir de varias muestras, el tramo de propietario correspondiente, el comportamiento de `/healthz` y `/readyz`,
y el contrato de reinicio visible para el usuario.

## E2E de incorporación (Docker)

Docker es opcional; esto solo se necesita para pruebas smoke de incorporación en contenedores.

Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Este script controla el asistente interactivo mediante una pseudo-tty, verifica archivos de configuración/espacio de trabajo/sesión, luego inicia el gateway y ejecuta `openclaw health`.

## Smoke de importación QR (Docker)

Garantiza que el helper de runtime QR mantenido se cargue bajo los runtimes Docker Node compatibles (Node 24 predeterminado, Node 22 compatible):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
