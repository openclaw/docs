---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos de forzado/cobertura
title: Pruebas
x-i18n:
    generated_at: "2026-05-11T20:52:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: be939951f186df407aca8b3e4abbdbbd50f2f87c538c28c91745f9c6833df0d7
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de pruebas (conjuntos, en vivo, Docker): [Pruebas](/es/help/testing)
- Validación de actualizaciones y paquetes de Plugin: [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)

- `pnpm test:force`: Finaliza cualquier proceso de Gateway persistente que mantenga ocupado el puerto de control predeterminado y luego ejecuta la suite completa de Vitest con un puerto de Gateway aislado para que las pruebas del servidor no colisionen con una instancia en ejecución. Usa esto cuando una ejecución anterior de Gateway haya dejado ocupado el puerto 18789.
- `pnpm test:coverage`: Ejecuta la suite de unidades con cobertura de V8 (mediante `vitest.unit.config.ts`). Esta es una puerta de cobertura del carril de unidades predeterminado, no cobertura de todos los archivos de todo el repositorio. Los umbrales son 70% para líneas/funciones/sentencias y 55% para ramas. Como `coverage.all` es false y el carril predeterminado limita los includes de cobertura a pruebas unitarias no rápidas con archivos fuente hermanos, la puerta mide el código fuente propiedad de este carril en lugar de cada import transitivo que llegue a cargar.
- `pnpm test:coverage:changed`: Ejecuta cobertura unitaria solo para archivos cambiados desde `origin/main`.
- `pnpm test:changed`: ejecución barata de pruebas cambiadas inteligentes. Ejecuta objetivos precisos a partir de ediciones directas de pruebas, archivos hermanos `*.test.ts`, mapeos explícitos de código fuente y el grafo de importaciones local. Los cambios amplios de configuración/paquetes se omiten a menos que se asignen a pruebas precisas.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: ejecución amplia explícita de pruebas cambiadas. Úsala cuando una edición del arnés de pruebas/configuración/paquete deba recurrir al comportamiento más amplio de pruebas cambiadas de Vitest.
- `pnpm changed:lanes`: muestra los carriles arquitectónicos activados por el diff contra `origin/main`.
- `pnpm check:changed`: ejecuta la puerta inteligente de comprobación de cambios para el diff contra `origin/main`. Ejecuta comandos de typecheck, lint y guardia para los carriles arquitectónicos afectados, pero no ejecuta pruebas de Vitest. Usa `pnpm test:changed` o `pnpm test <target>` explícito para prueba de pruebas.
- `pnpm test`: enruta objetivos explícitos de archivo/directorio a través de carriles de Vitest con alcance. Las ejecuciones sin objetivo usan grupos de shards fijos y se expanden a configuraciones hoja para ejecución paralela local; el grupo de extensiones siempre se expande a las configuraciones de shard por extensión en lugar de un único proceso gigante de proyecto raíz.
- Las ejecuciones del wrapper de pruebas terminan con un breve resumen `[test] passed|failed|skipped ... in ...`. La propia línea de duración de Vitest queda como detalle por shard.
- Estado de pruebas compartido de OpenClaw: usa `src/test-utils/openclaw-test-state.ts` desde Vitest cuando una prueba necesita un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuración, workspace, directorio de agente o almacén de perfiles de autenticación aislado.
- Helpers E2E de proceso: usa `test/helpers/openclaw-test-instance.ts` cuando una prueba E2E a nivel de proceso de Vitest necesita un Gateway en ejecución, entorno de CLI, captura de logs y limpieza en un solo lugar.
- Helpers E2E de Docker/Bash: los carriles que hacen source de `scripts/lib/docker-e2e-image.sh` pueden pasar `docker_e2e_test_state_shell_b64 <label> <scenario>` al contenedor y decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; los scripts multi-home pueden pasar `docker_e2e_test_state_function_b64` y llamar a `openclaw_test_state_create <label> <scenario>` en cada flujo. Los llamadores de menor nivel pueden usar `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` para un snippet de shell dentro del contenedor, o `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` para un archivo de entorno del host al que se pueda hacer source. El `--` antes de `create` evita que runtimes de Node más nuevos traten `--env-file` como una flag de Node. Los carriles Docker/Bash que lanzan un Gateway pueden hacer source de `scripts/lib/openclaw-e2e-instance.sh` dentro del contenedor para resolución de entrypoint, arranque de OpenAI simulado, lanzamiento de Gateway en primer plano/segundo plano, sondas de disponibilidad, exportación del entorno de estado, volcados de logs y limpieza de procesos.
- Las ejecuciones de shards completas, de extensión y con patrón de inclusión actualizan datos locales de tiempos en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores de configuración completa usan esos tiempos para equilibrar shards lentos y rápidos. Los shards de CI con patrón de inclusión añaden el nombre del shard a la clave de tiempos, lo que mantiene visibles los tiempos de shards filtrados sin reemplazar los datos de tiempos de configuración completa. Establece `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.
- Los archivos de prueba seleccionados de `plugin-sdk` y `commands` ahora se enrutan por carriles ligeros dedicados que conservan solo `test/setup.ts`, dejando los casos pesados de runtime en sus carriles existentes.
- Los archivos fuente con pruebas hermanas se asignan a esa prueba hermana antes de recurrir a globs de directorio más amplios. Las ediciones de helpers bajo `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` y `src/plugins/contracts` usan un grafo de importaciones local para ejecutar las pruebas que los importan en lugar de ejecutar ampliamente cada shard cuando la ruta de dependencia es precisa.
- `auto-reply` ahora también se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el arnés de respuesta no domine las pruebas más ligeras de estado/token/helper de nivel superior.
- La configuración base de Vitest ahora usa de forma predeterminada `pool: "threads"` e `isolate: false`, con el runner compartido no aislado habilitado en las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los shards de extensiones/plugins. Los plugins de canal pesados, el plugin de navegador y OpenAI se ejecutan como shards dedicados; otros grupos de plugins permanecen agrupados. Usa `pnpm test extensions/<id>` para un carril de un plugin incluido.
- `pnpm test:perf:imports`: habilita informes de duración de importaciones y desglose de importaciones de Vitest, mientras sigue usando enrutamiento de carriles con alcance para objetivos explícitos de archivo/directorio.
- `pnpm test:perf:imports:changed`: el mismo perfilado de importaciones, pero solo para archivos cambiados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` mide el rendimiento de la ruta enrutada en modo cambiado frente a la ejecución nativa del proyecto raíz para el mismo diff de git confirmado.
- `pnpm test:perf:changed:bench -- --worktree` mide el rendimiento del conjunto de cambios actual del worktree sin confirmar primero.
- `pnpm test:perf:profile:main`: escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: escribe perfiles de CPU + heap para el runner unitario (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta en serie cada configuración hoja de Vitest de suite completa y escribe datos de duración agrupados más artefactos JSON/log por configuración. El agente de rendimiento de pruebas usa esto como su línea base antes de intentar arreglos de pruebas lentas.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara informes agrupados después de un cambio enfocado en rendimiento.
- Integración de Gateway: habilitación opcional mediante `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: Ejecuta pruebas smoke end-to-end de Gateway (emparejamiento multiinstancia WS/HTTP/node). Usa de forma predeterminada `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajusta con `OPENCLAW_E2E_WORKERS=<n>` y establece `OPENCLAW_E2E_VERBOSE=1` para logs detallados.
- `pnpm test:live`: Ejecuta pruebas live de proveedores (minimax/zai). Requiere claves de API y `LIVE=1` (o `*_LIVE_TEST=1` específico del proveedor) para no omitirlas.
- `pnpm test:docker:all`: Construye la imagen compartida de pruebas live, empaqueta OpenClaw una vez como tarball de npm, construye/reutiliza una imagen runner básica de Node/Git más una imagen funcional que instala ese tarball en `/app`, y luego ejecuta carriles smoke de Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` mediante un planificador ponderado. La imagen básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) se usa para carriles de instalador/actualización/dependencias de plugin; esos carriles montan el tarball preconstruido en lugar de usar fuentes copiadas del repositorio. La imagen funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) se usa para carriles normales de funcionalidad de la aplicación construida. `scripts/package-openclaw-for-docker.mjs` es el único empaquetador local/CI y valida el tarball más `dist/postinstall-inventory.json` antes de que Docker lo consuma. Las definiciones de carriles de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`; la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` ejecuta el plan seleccionado. `node scripts/test-docker-all.mjs --plan-json` emite el plan de CI propiedad del planificador para carriles seleccionados, tipos de imagen, necesidades de paquete/imagen live, escenarios de estado y comprobaciones de credenciales sin construir ni ejecutar Docker. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` controla los slots de proceso y por defecto es 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` controla el pool final sensible a proveedores y por defecto es 10. Los límites de carriles pesados usan por defecto `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` y `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; los límites de proveedores usan por defecto un carril pesado por proveedor mediante `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` y `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Usa `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` u `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` para hosts más grandes. Si un carril supera el límite efectivo de peso o recursos en un host de bajo paralelismo, aún puede empezar desde un pool vacío y se ejecutará solo hasta que libere capacidad. Los inicios de carril se escalonan 2 segundos por defecto para evitar tormentas de creación del demonio local de Docker; sobrescribe con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. El runner hace preflight de Docker por defecto, limpia contenedores E2E obsoletos de OpenClaw, emite estado de carriles activos cada 30 segundos, comparte cachés de herramientas CLI de proveedores entre carriles compatibles, reintenta fallos transitorios de proveedores live una vez por defecto (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) y almacena tiempos de carriles en `.artifacts/docker-tests/lane-timings.json` para ordenación del más largo al más corto en ejecuciones posteriores. Usa `OPENCLAW_DOCKER_ALL_DRY_RUN=1` para imprimir el manifiesto de carriles sin ejecutar Docker, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` para ajustar la salida de estado, o `OPENCLAW_DOCKER_ALL_TIMINGS=0` para deshabilitar la reutilización de tiempos. Usa `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` solo para carriles deterministas/locales o `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` solo para carriles de proveedores live; los alias de paquete son `pnpm test:docker:local:all` y `pnpm test:docker:live:all`. El modo solo live fusiona los carriles live principales y finales en un único pool del más largo al más corto para que los buckets de proveedores puedan empaquetar juntos el trabajo de Claude, Codex y Gemini. El runner deja de programar nuevos carriles agrupados después del primer fallo a menos que se establezca `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, y cada carril tiene un timeout de respaldo de 120 minutos sobrescribible con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; los carriles live/finales seleccionados usan límites por carril más estrictos. Los comandos de configuración de Docker del backend de CLI tienen su propio timeout mediante `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (predeterminado 180). Los logs por carril, `summary.json`, `failures.json` y tiempos de fase se escriben bajo `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` para inspeccionar carriles lentos y `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de reejecución dirigida.
- `pnpm test:docker:browser-cdp-snapshot`: Construye un contenedor E2E de código fuente respaldado por Chromium, inicia CDP sin procesar más un Gateway aislado, ejecuta `browser doctor --deep` y verifica que las snapshots de roles de CDP incluyan URL de enlaces, elementos clicables promovidos por cursor, referencias de iframe y metadatos de frame.
- `pnpm test:docker:skill-install`: Instala el tarball empaquetado de OpenClaw en un runner básico de Docker, deshabilita `skills.install.allowUploadedArchives`, resuelve un slug de skill actual desde una búsqueda live de ClawHub, lo instala mediante `openclaw skills install` y verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` y `skills info --json`.
- Las sondas live de Docker del backend de CLI pueden ejecutarse como carriles enfocados, por ejemplo `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` o `pnpm test:docker:live-cli-backend:codex:mcp`. Claude y Gemini tienen alias `:resume` y `:mcp` equivalentes.
- `pnpm test:docker:openwebui`: Inicia OpenClaw + Open WebUI dockerizados, inicia sesión mediante Open WebUI, comprueba `/api/models` y luego ejecuta un chat real proxy a través de `/api/chat/completions`. Requiere una clave de modelo live utilizable (por ejemplo OpenAI en `~/.profile`), descarga una imagen externa de Open WebUI y no se espera que sea estable en CI como las suites unit/e2e normales.
- `pnpm test:docker:mcp-channels`: Inicia un contenedor Gateway sembrado y un segundo contenedor cliente que genera `openclaw mcp serve`; luego verifica el descubrimiento de conversaciones enrutadas, las lecturas de transcripciones, los metadatos de adjuntos, el comportamiento de la cola de eventos en vivo, el enrutamiento de envíos salientes y las notificaciones de canal y permisos al estilo Claude sobre el puente stdio real. La aserción de notificación de Claude lee directamente las tramas MCP stdio sin procesar, de modo que el smoke refleje lo que realmente emite el puente.
- `pnpm test:docker:upgrade-survivor`: Instala el tarball empaquetado de OpenClaw sobre un fixture de usuario antiguo con estado sucio, ejecuta la actualización del paquete más doctor no interactivo sin claves de proveedor ni de canal en vivo, luego inicia un Gateway loopback y comprueba que los agentes, la configuración de canal, las listas de permitidos de Plugin, los archivos de workspace/sesión, el estado obsoleto de dependencias de Plugin heredado, el inicio y el estado RPC sobrevivan.
- `pnpm test:docker:published-upgrade-survivor`: Instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente sin claves de proveedor ni de canal en vivo, configura esa línea base con una receta integrada de comando `openclaw config set`, actualiza esa instalación publicada al tarball empaquetado de OpenClaw, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, luego inicia un Gateway loopback y comprueba que las intenciones configuradas, los archivos de workspace/sesión, la configuración obsoleta de Plugin y el estado de dependencias heredado, el inicio, `/healthz`, `/readyz` y el estado RPC sobrevivan o se reparen limpiamente. Sobrescribe una línea base con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, expande una matriz local exacta con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` como `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, o agrega fixtures de escenario con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`; el conjunto reported-issues incluye `configured-plugin-installs` para verificar que los plugins externos configurados de OpenClaw se instalen automáticamente durante la actualización y `stale-source-plugin-shadow` para evitar que las sombras de plugins solo de código fuente rompan el inicio. Package Acceptance expone esos valores como `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` y `published_upgrade_survivor_scenarios`, y resuelve tokens meta de línea base como `last-stable-4` o `all-since-2026.4.23` antes de entregar especificaciones exactas de paquete a las rutas de Docker.
- `pnpm test:docker:update-migration`: Ejecuta el arnés published-upgrade survivor en el escenario `plugin-deps-cleanup`, intensivo en limpieza, comenzando en `openclaw@2026.4.23` de forma predeterminada. El workflow separado `Update Migration` expande esta ruta con `baselines=all-since-2026.4.23` para que cada paquete estable publicado desde `.23` en adelante se actualice al candidato y demuestre la limpieza de dependencias de plugins configurados fuera de Full Release CI.
- `pnpm test:docker:plugins`: Ejecuta smoke de instalación/actualización para rutas locales, `file:`, paquetes de registro npm con dependencias elevadas, referencias móviles de git, fixtures de ClawHub, actualizaciones de marketplace y habilitación/inspección del paquete Claude.

## Control local de PR

Para comprobaciones locales de control/aterrizaje de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla intermitentemente en un host con mucha carga, vuelve a ejecutarlo una vez antes de tratarlo como una regresión; luego aísla con `pnpm test <path/to/test>`. Para hosts con memoria limitada, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Banco de latencia de modelos (claves locales)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Entorno opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predeterminado: "Responde con una sola palabra: ok. Sin puntuación ni texto adicional."

Última ejecución (2025-12-31, 20 ejecuciones):

- minimax mediana 1279ms (mín. 1114, máx. 2431)
- opus mediana 2454ms (mín. 1224, máx. 3170)

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

La salida incluye `sampleCount`, promedio, p50, p95, mín./máx., distribución de códigos de salida/señales y resúmenes de RSS máxima para cada comando. El `--cpu-prof-dir` / `--heap-prof-dir` opcional escribe perfiles de V8 por ejecución para que la medición de tiempos y la captura de perfiles usen el mismo arnés.

Convenciones de salida guardada:

- `pnpm test:startup:bench:smoke` escribe el artefacto smoke dirigido en `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` escribe el artefacto de la suite completa en `.artifacts/cli-startup-bench-all.json` usando `runs=5` y `warmup=1`
- `pnpm test:startup:bench:update` actualiza el fixture de referencia incluido en el repositorio en `test/fixtures/cli-startup-bench.json` usando `runs=5` y `warmup=1`

Fixture incluido en el repositorio:

- `test/fixtures/cli-startup-bench.json`
- Actualiza con `pnpm test:startup:bench:update`
- Compara los resultados actuales con el fixture mediante `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker es opcional; esto solo es necesario para pruebas smoke de onboarding en contenedor.

Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Este script controla el asistente interactivo mediante una pseudo-tty, verifica archivos de configuración/espacio de trabajo/sesión, luego inicia el Gateway y ejecuta `openclaw health`.

## Smoke de importación QR (Docker)

Garantiza que el helper mantenido de runtime QR cargue en los runtimes Node de Docker compatibles (Node 24 predeterminado, Node 22 compatible):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
