---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos de forzado/cobertura
title: Pruebas
x-i18n:
    generated_at: "2026-05-06T05:48:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de pruebas (suites, en vivo, Docker): [Pruebas](/es/help/testing)
- Validación de actualizaciones y paquetes de Plugin: [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)

- `pnpm test:force`: Finaliza cualquier proceso de Gateway persistente que mantenga ocupado el puerto de control predeterminado y luego ejecuta la suite completa de Vitest con un puerto de Gateway aislado para que las pruebas del servidor no entren en conflicto con una instancia en ejecución. Usa esto cuando una ejecución anterior de Gateway haya dejado ocupado el puerto 18789.
- `pnpm test:coverage`: Ejecuta la suite unitaria con cobertura de V8 (mediante `vitest.unit.config.ts`). Esta es una puerta de cobertura del carril unitario predeterminado, no una cobertura de todos los archivos de todo el repositorio. Los umbrales son 70% en líneas/funciones/sentencias y 55% en ramas. Debido a que `coverage.all` es false y el carril predeterminado limita los includes de cobertura a pruebas unitarias no rápidas con archivos fuente hermanos, la puerta mide el código fuente propiedad de este carril en lugar de cada importación transitiva que llegue a cargar.
- `pnpm test:coverage:changed`: Ejecuta cobertura unitaria solo para archivos cambiados desde `origin/main`.
- `pnpm test:changed`: ejecución barata e inteligente de pruebas cambiadas. Ejecuta objetivos precisos a partir de ediciones directas de pruebas, archivos hermanos `*.test.ts`, mapeos explícitos de código fuente y el grafo local de importaciones. Los cambios amplios de configuración/paquetes se omiten salvo que se asignen a pruebas precisas.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: ejecución amplia explícita de pruebas cambiadas. Úsala cuando una edición del arnés/configuración/paquete de pruebas deba recurrir al comportamiento más amplio de pruebas cambiadas de Vitest.
- `pnpm changed:lanes`: muestra los carriles arquitectónicos activados por el diff contra `origin/main`.
- `pnpm check:changed`: ejecuta la puerta inteligente de comprobación de cambios para el diff contra `origin/main`. Ejecuta typecheck, lint y comandos de guardia para los carriles arquitectónicos afectados, pero no ejecuta pruebas Vitest. Usa `pnpm test:changed` o `pnpm test <target>` explícito como prueba de tests.
- `pnpm test`: enruta objetivos explícitos de archivos/directorios a través de carriles Vitest acotados. Las ejecuciones sin objetivo usan grupos de shards fijos y se expanden a configuraciones hoja para ejecución paralela local; el grupo de extensiones siempre se expande a las configuraciones shard por extensión en lugar de un único proceso gigante del proyecto raíz.
- Las ejecuciones del wrapper de pruebas terminan con un resumen breve `[test] passed|failed|skipped ... in ...`. La línea de duración propia de Vitest se mantiene como detalle por shard.
- Estado compartido de pruebas de OpenClaw: usa `src/test-utils/openclaw-test-state.ts` desde Vitest cuando una prueba necesite un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuración, workspace, directorio de agente o almacén de perfiles de autenticación aislados.
- Helpers E2E de proceso: usa `test/helpers/openclaw-test-instance.ts` cuando una prueba E2E de nivel de proceso de Vitest necesite un Gateway en ejecución, entorno de CLI, captura de logs y limpieza en un solo lugar.
- Helpers E2E de Docker/Bash: los carriles que hacen source de `scripts/lib/docker-e2e-image.sh` pueden pasar `docker_e2e_test_state_shell_b64 <label> <scenario>` al contenedor y decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; los scripts multi-home pueden pasar `docker_e2e_test_state_function_b64` y llamar a `openclaw_test_state_create <label> <scenario>` en cada flujo. Los llamadores de nivel inferior pueden usar `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` para un fragmento shell dentro del contenedor, o `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` para un archivo de entorno del host que pueda cargarse con source. El `--` antes de `create` impide que runtimes de Node más recientes traten `--env-file` como una flag de Node. Los carriles Docker/Bash que lanzan un Gateway pueden hacer source de `scripts/lib/openclaw-e2e-instance.sh` dentro del contenedor para resolución de entrypoint, arranque de OpenAI simulado, lanzamiento de Gateway en primer plano/segundo plano, sondeos de readiness, exportación del entorno de estado, volcados de logs y limpieza de procesos.
- Las ejecuciones de shards completa, de extensiones y con patrón include actualizan datos de tiempos locales en `.artifacts/vitest-shard-timings.json`; ejecuciones posteriores de configuración completa usan esos tiempos para equilibrar shards lentos y rápidos. Los shards de CI con patrón include agregan el nombre del shard a la clave de tiempos, lo que mantiene visibles los tiempos de shards filtrados sin reemplazar los datos de tiempos de configuración completa. Define `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.
- Algunos archivos de prueba de `plugin-sdk` y `commands` ahora se enrutan por carriles ligeros dedicados que mantienen solo `test/setup.ts`, dejando los casos pesados en runtime en sus carriles existentes.
- Los archivos fuente con pruebas hermanas se asignan a ese hermano antes de recurrir a globs de directorio más amplios. Las ediciones de helpers bajo `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` y `src/plugins/contracts` usan un grafo local de importaciones para ejecutar pruebas importadoras en lugar de ejecutar ampliamente cada shard cuando la ruta de dependencia es precisa.
- `auto-reply` ahora también se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el arnés de respuesta no domine las pruebas más ligeras de estado/token/helpers de nivel superior.
- La configuración base de Vitest ahora usa por defecto `pool: "threads"` e `isolate: false`, con el runner compartido no aislado habilitado en todas las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los shards de extensiones/plugins. Los plugins de canales pesados, el plugin de navegador y OpenAI se ejecutan como shards dedicados; otros grupos de plugins permanecen agrupados. Usa `pnpm test extensions/<id>` para un carril de un plugin incluido.
- `pnpm test:perf:imports`: habilita informes de duración de importaciones y desglose de importaciones de Vitest, mientras sigue usando enrutamiento de carriles acotados para objetivos explícitos de archivo/directorio.
- `pnpm test:perf:imports:changed`: el mismo perfilado de importaciones, pero solo para archivos cambiados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el rendimiento de la ruta enrutada en modo changed contra la ejecución nativa del proyecto raíz para el mismo diff de git confirmado.
- `pnpm test:perf:changed:bench -- --worktree` compara el rendimiento del conjunto de cambios del worktree actual sin confirmar primero.
- `pnpm test:perf:profile:main`: escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: escribe perfiles de CPU + heap para el runner unitario (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta en serie cada configuración hoja de Vitest de la suite completa y escribe datos de duración agrupados más artefactos JSON/log por configuración. El Test Performance Agent usa esto como línea base antes de intentar arreglos de pruebas lentas.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara informes agrupados después de un cambio centrado en rendimiento.
- Integración de Gateway: opt-in mediante `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: Ejecuta pruebas smoke end-to-end de Gateway (emparejamiento multiinstancia WS/HTTP/node). Usa por defecto `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajusta con `OPENCLAW_E2E_WORKERS=<n>` y define `OPENCLAW_E2E_VERBOSE=1` para logs detallados.
- `pnpm test:live`: Ejecuta pruebas live de proveedores (minimax/zai). Requiere claves API y `LIVE=1` (o `*_LIVE_TEST=1` específico del proveedor) para dejar de omitirlas.
- `pnpm test:docker:all`: Construye la imagen compartida de pruebas live, empaqueta OpenClaw una vez como tarball npm, construye/reutiliza una imagen runner mínima de Node/Git más una imagen funcional que instala ese tarball en `/app`, y luego ejecuta carriles smoke de Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` mediante un planificador ponderado. La imagen mínima (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) se usa para carriles de instalador/actualización/dependencias de plugin; esos carriles montan el tarball preconstruido en lugar de usar fuentes copiadas del repositorio. La imagen funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) se usa para carriles normales de funcionalidad de app construida. `scripts/package-openclaw-for-docker.mjs` es el empaquetador único local/CI y valida el tarball más `dist/postinstall-inventory.json` antes de que Docker lo consuma. Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. `node scripts/test-docker-all.mjs --plan-json` emite el plan de CI propiedad del planificador para carriles seleccionados, tipos de imagen, necesidades de paquete/imagen live, escenarios de estado y comprobaciones de credenciales sin construir ni ejecutar Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla los slots de proceso y su valor predeterminado es 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla el pool final sensible a proveedores y su valor predeterminado es 10. Los límites de carriles pesados usan por defecto `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; los límites de proveedores usan por defecto un carril pesado por proveedor mediante `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` y `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` u `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts más grandes. Si un carril supera el límite efectivo de peso o recursos en un host con bajo paralelismo, aún puede arrancar desde un pool vacío y se ejecutará solo hasta que libere capacidad. Los arranques de carriles se escalonan por defecto 2 segundos para evitar ráfagas de creación del daemon Docker local; anula con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. El runner hace preflight de Docker por defecto, limpia contenedores E2E obsoletos de OpenClaw, emite estado de carriles activos cada 30 segundos, comparte cachés de herramientas CLI de proveedores entre carriles compatibles, reintenta fallos transitorios de proveedores live una vez por defecto (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) y almacena tiempos de carriles en `.artifacts/docker-tests/lane-timings.json` para ordenar de mayor a menor duración en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto de carriles sin ejecutar Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar la salida de estado, o `OPENCLAW_DOCKER_ALL_TIMINGS=0` para desactivar la reutilización de tiempos. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo para carriles deterministas/locales o `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo para carriles de proveedores live; los alias de paquete son `pnpm test:docker:local:all` y `pnpm test:docker:live:all`. El modo solo live fusiona los carriles live principales y finales en un solo pool de mayor a menor duración para que los buckets de proveedores puedan empaquetar juntos trabajos de Claude, Codex y Gemini. El runner deja de programar carriles agrupados nuevos tras el primer fallo salvo que se defina `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, y cada carril tiene un timeout de respaldo de 120 minutos anulable con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; algunos carriles live/finales seleccionados usan límites por carril más estrictos. Los comandos de configuración Docker del backend de CLI tienen su propio timeout mediante `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predeterminado 180). Los logs por carril, `summary.json`, `failures.json` y tiempos de fases se escriben bajo `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` para inspeccionar carriles lentos y `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de repetición dirigida.
- `pnpm test:docker:browser-cdp-snapshot`: Construye un contenedor E2E de código fuente respaldado por Chromium, inicia CDP sin procesar más un Gateway aislado, ejecuta `browser doctor --deep` y verifica que las instantáneas de roles CDP incluyan URLs de enlaces, elementos clicables promovidos por cursor, refs de iframe y metadatos de frame.
- Las sondas Docker live del backend de CLI pueden ejecutarse como carriles enfocados, por ejemplo `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude y Gemini tienen alias `:resume` y `:mcp` correspondientes.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI en Docker, inicia sesión mediante Open WebUI, comprueba `/api/models` y luego ejecuta un chat real proxied a través de `/api/chat/completions`. Requiere una clave de modelo live utilizable (por ejemplo OpenAI en `~/.profile`), descarga una imagen externa de Open WebUI y no se espera que sea estable en CI como las suites unitarias/e2e normales.
- `pnpm test:docker:mcp-channels`: Inicia un contenedor Gateway sembrado y un segundo contenedor cliente que lanza `openclaw mcp serve`; luego verifica el descubrimiento de conversaciones enrutadas, las lecturas de transcripción, los metadatos de adjuntos, el comportamiento de la cola de eventos en vivo, el enrutamiento de envío saliente y las notificaciones de canal + permisos estilo Claude sobre el puente stdio real. La aserción de notificación de Claude lee directamente los marcos MCP stdio sin procesar, de modo que la prueba de humo refleja lo que el puente realmente emite.
- `pnpm test:docker:upgrade-survivor`: Instala el tarball empaquetado de OpenClaw sobre un fixture sucio de usuario antiguo, ejecuta la actualización del paquete y doctor no interactivo sin claves de proveedor ni de canal en vivo; luego inicia un Gateway de loopback y comprueba que los agentes, la configuración de canales, las listas de permitidos de plugins, los archivos de espacio de trabajo/sesión, el estado obsoleto de dependencias de plugins heredados, el arranque y el estado RPC sobrevivan.
- `pnpm test:docker:published-upgrade-survivor`: Instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente sin claves de proveedor ni de canal en vivo, configura esa línea base con una receta integrada del comando `openclaw config set`, actualiza esa instalación publicada al tarball empaquetado de OpenClaw, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`; luego inicia un Gateway de loopback y comprueba que las intenciones configuradas, los archivos de espacio de trabajo/sesión, la configuración obsoleta de plugins y el estado de dependencias heredadas, el arranque, `/healthz`, `/readyz` y el estado RPC sobrevivan o se reparen limpiamente. Sobrescribe una línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, expande una matriz local exacta con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, o agrega fixtures de escenario con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; el conjunto reported-issues incluye `configured-plugin-installs` para verificar que los plugins externos configurados de OpenClaw se instalen automáticamente durante la actualización y `stale-source-plugin-shadow` para evitar que las sombras de plugins solo de código fuente rompan el arranque. Package Acceptance expone esos valores como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`, y resuelve tokens de línea base meta como `last-stable-4` o `all-since-2026.4.23` antes de entregar especificaciones exactas de paquetes a las pistas de Docker.
- `pnpm test:docker:update-migration`: Ejecuta el arnés published-upgrade survivor en el escenario `plugin-deps-cleanup`, que requiere mucha limpieza, empezando en `openclaw@2026.4.23` de forma predeterminada. El flujo de trabajo separado `Update Migration` expande esta pista con `baselines=all-since-2026.4.23` para que cada paquete estable publicado desde `.23` en adelante se actualice al candidato y demuestre la limpieza de dependencias de plugins configurados fuera de Full Release CI.
- `pnpm test:docker:plugins`: Ejecuta una prueba de humo de instalación/actualización para ruta local, `file:`, paquetes del registro npm con dependencias elevadas, referencias móviles de git, fixtures de ClawHub, actualizaciones del marketplace y habilitación/inspección del paquete de Claude.

## Control local de PR

Para las comprobaciones locales de integración/control de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla de forma intermitente en un host cargado, vuelve a ejecutarlo una vez antes de tratarlo como una regresión; luego aísla con `pnpm test <path/to/test>`. Para hosts con memoria limitada, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banco de latencia del modelo (claves locales)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
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

La salida incluye `sampleCount`, promedio, p50, p95, mínimo/máximo, distribución de código de salida/señal y resúmenes de RSS máximo para cada comando. Los opcionales `--cpu-prof-dir` / `--heap-prof-dir` escriben perfiles de V8 por ejecución para que la medición de tiempos y la captura de perfiles usen el mismo arnés.

Convenciones de salida guardada:

- `pnpm test:startup:bench:smoke` escribe el artefacto de smoke dirigido en `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` escribe el artefacto de la suite completa en `.artifacts/cli-startup-bench-all.json` usando `runs=5` y `warmup=1`
- `pnpm test:startup:bench:update` actualiza el fixture base registrado en `test/fixtures/cli-startup-bench.json` usando `runs=5` y `warmup=1`

Fixture registrado:

- `test/fixtures/cli-startup-bench.json`
- Actualiza con `pnpm test:startup:bench:update`
- Compara los resultados actuales con el fixture usando `pnpm test:startup:bench:check`

## E2E de incorporación (Docker)

Docker es opcional; esto solo es necesario para pruebas smoke de incorporación en contenedores.

Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Este script controla el asistente interactivo mediante un pseudo-tty, verifica los archivos de configuración/área de trabajo/sesión, luego inicia el Gateway y ejecuta `openclaw health`.

## Smoke de importación QR (Docker)

Garantiza que el helper mantenido de runtime QR se cargue bajo los runtimes Node de Docker compatibles (Node 24 predeterminado, Node 22 compatible):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
