---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos de forzado/cobertura
title: Pruebas
x-i18n:
    generated_at: "2026-07-05T17:40:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 17e8128198bea80e83a74cfbeb0a63056e7913ce4c7b6f976b4ec929fcfe493d
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de pruebas (suites, en vivo, Docker): [Pruebas](/es/help/testing)
- Validación de actualizaciones y paquetes de plugins: [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)

## Valor predeterminado del agente

Las sesiones de agente ejecutan pruebas y validación computacionalmente intensiva de forma remota
a través de Crabbox. El código de mantenedores de confianza usa Blacksmith Testbox de forma predeterminada. El
flujo de trabajo configurado de Testbox hidrata credenciales, por lo que el código de contribuidores o
forks no confiables debe usar CI de fork sin secretos o Crabbox directo en AWS sanitizado en su lugar.

Cuando una tarea de código confiable probablemente necesite pruebas o pruebas pesadas, precalienta
de inmediato en una sesión de comando en segundo plano, sigue trabajando mientras se hidrata,
reutiliza el id `tbx_...` devuelto, sincroniza el checkout actual en cada ejecución y
detenlo antes del traspaso:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Los comandos de prueba locales siguientes son para flujos de trabajo humanos o una reserva explícita de agente
solicitada por el usuario. La indisponibilidad del proveedor remoto debe informarse; no es
permiso para ejecutar silenciosamente una puerta local amplia.

Para código no confiable, precalienta con `--provider aws`. Cada ejecución debe establecer
`CRABBOX_ENV_ALLOW=CI`, pasar `--provider aws --no-hydrate` y usar
un `HOME` remoto temporal nuevo antes de instalar dependencias o ejecutar
pruebas. Usa un lease recién calentado dedicado a esa fuente no confiable; nunca reutilices
un lease confiable o previamente hidratado. Lanza un binario Crabbox confiable instalado
desde un checkout `main` limpio y confiable y obtiene solo el PR remoto con
`--fresh-pr`; nunca ejecutes localmente el wrapper o la configuración del checkout no confiable.
Desestablece `CRABBOX_AWS_INSTANCE_PROFILE` y falla cerrado a menos que el
`aws.instanceProfile` resuelto esté vacío. Antes de cualquier instalación/prueba, usa herramientas de
ruta absoluta confiables para exigir un token IMDSv2, demostrar que el endpoint de credenciales
IAM devuelve 404 y verificar que `git rev-parse HEAD` remoto sea igual al SHA completo
de la cabeza del PR revisada. Vincula el lease a ese SHA y detén/recalienta cuando la cabeza
cambie. Sube `scripts/crabbox-untrusted-bootstrap.sh` confiable desde `main` limpio
junto con `--fresh-pr`; instala Node/pnpm fijados, verifica el SHA
y la fijación del gestor de paquetes, aísla `HOME`, instala dependencias y luego ejecuta
la prueba solicitada. Si el broker no puede demostrar que no hay rol o que no existe PR remoto,
usa CI de fork sin secretos. No uses `hydrate-github`, `--no-sync` ni un
flujo de trabajo Testbox hidratado con credenciales.
Desestablece todas las sobrescrituras `CRABBOX_TAILSCALE*`, fuerza `--network public
--tailscale=false`, limpia las marcas de nodo de salida/LAN y exige que `crabbox inspect`
informe red pública sin estado Tailscale antes de subir cualquier script.

## Orden local rutinario

1. `pnpm test:changed` para prueba Vitest con alcance de cambios.
2. `pnpm test <path-or-filter>` para un archivo, directorio u objetivo explícito.
3. `pnpm test` solo cuando necesites intencionalmente la suite Vitest local completa.

En un worktree de Codex o un checkout enlazado/disperso, los agentes evitan
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run` locales directos:

- Reserva local explícitamente solicitada por el usuario para un archivo pequeño:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Puertas de cambios o prueba amplia: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` para que pnpm se ejecute dentro de Testbox.
- El `exitCode` final del wrapper y el JSON de tiempos son el resultado del comando. Una ejecución delegada de Blacksmith GitHub Actions puede mostrar `cancelled` después de un comando SSH exitoso porque el Testbox se detiene desde fuera de la acción keepalive; revisa el resumen del wrapper y la salida del comando antes de tratarlo como un fallo.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mantiene la serialización de comprobaciones pesadas dentro del worktree actual en lugar del directorio común de Git para comandos como `pnpm check:changed` y `pnpm test ...` dirigidos. Úsalo solo en hosts locales de alta capacidad cuando ejecutes intencionalmente comprobaciones independientes en worktrees enlazados.

## Comandos principales

Las ejecuciones del wrapper de pruebas terminan con un breve resumen `[test] passed|failed|skipped ... in ...`; la línea de duración propia de Vitest queda como detalle por shard.

| Comando                                           | Qué hace                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm test`                                       | Los objetivos explícitos de archivo/directorio se enrutan por lanes Vitest con alcance. Las ejecuciones sin objetivo son prueba de suite completa: los grupos de shards fijos se expanden a configuraciones hoja para ejecución paralela local, con el fanout de shards esperado impreso antes de empezar. El grupo de extensiones siempre se expande a configuraciones de shard por extensión en lugar de un proceso gigante de proyecto raíz. |
| `pnpm test:changed`                               | Ejecución inteligente barata de pruebas cambiadas: objetivos precisos a partir de ediciones directas de pruebas, archivos hermanos `*.test.ts`, mapeos de fuente explícitos y el grafo local de importaciones. Los cambios amplios/de configuración/paquete se omiten a menos que se asignen a pruebas precisas.                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Ejecución amplia explícita de pruebas cambiadas; úsala cuando una edición de arnés/configuración/paquete de pruebas deba recurrir al comportamiento más amplio de pruebas cambiadas de Vitest.                                                                                                                                                                |
| `pnpm test:force`                                 | Libera el puerto configurado del Gateway de OpenClaw (predeterminado `18789`) y luego ejecuta la suite completa con un puerto de Gateway aislado para que las pruebas de servidor no colisionen con una instancia en ejecución.                                                                                                                                  |
| `pnpm test:coverage`                              | Suite unitaria con cobertura V8 (`vitest.unit.config.ts`). Puerta de lane unitaria predeterminada, no cobertura de todo el repositorio: `coverage.all` es `false` y los umbrales son líneas/funciones/sentencias 70%, ramas 55%, con alcance a pruebas unitarias no rápidas con archivos fuente hermanos.                                                     |
| `pnpm test:coverage:changed`                      | Cobertura unitaria solo para archivos cambiados desde `origin/main`.                                                                                                                                                                                                                                                                                          |
| `pnpm changed:lanes`                              | Muestra las lanes arquitectónicas activadas por el diff contra `origin/main`.                                                                                                                                                                                                                                                                                  |
| `pnpm check:changed`                              | Delega en Crabbox/Testbox de forma predeterminada fuera de CI y luego ejecuta la puerta inteligente de comprobación de cambios dentro del hijo remoto: typecheck, lint y comandos de guardia para lanes afectadas. No ejecuta Vitest; usa `pnpm test:changed` o `pnpm test <target>` para prueba de tests.                                                     |

## Estado de prueba compartido y helpers de proceso

- `src/test-utils/openclaw-test-state.ts`: úsalo desde Vitest cuando una prueba necesite un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, fixture de configuración, workspace, directorio de agente o almacén de perfiles de auth aislados.
- `pnpm test:env-mutations:report`: informe no bloqueante de pruebas/arneses que mutan directamente `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` o claves de env relacionadas. Úsalo para encontrar candidatos de migración al helper de estado de prueba compartido.
- `test/helpers/openclaw-test-instance.ts`: pruebas E2E a nivel de proceso que necesitan un Gateway en ejecución, env de CLI, captura de logs y limpieza en un solo lugar.
- Las lanes Docker/Bash E2E que hacen source de `scripts/lib/docker-e2e-image.sh` pueden pasar `docker_e2e_test_state_shell_b64 <label> <scenario>` al contenedor y decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; los scripts multi-home pueden pasar `docker_e2e_test_state_function_b64` y llamar a `openclaw_test_state_create <label> <scenario>` en cada flujo. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` escribe un archivo env de host que puede cargarse con source (el `--` antes de `create` evita que runtimes de Node más nuevos traten `--env-file` como una marca de Node). Las lanes que lanzan un Gateway pueden hacer source de `scripts/lib/openclaw-e2e-instance.sh` para resolución de entrypoint, arranque simulado de OpenAI, lanzamiento en primer plano/segundo plano, sondas de preparación, exportación de env de estado, volcados de logs y limpieza de procesos.

## Control UI, TUI y lanes de extensiones

- **E2E simulado de Control UI:** `pnpm test:ui:e2e` ejecuta la lane Vitest + Playwright que inicia la Control UI de Vite y controla una página Chromium real contra un Gateway WebSocket simulado. Las pruebas viven en `ui/src/**/*.e2e.test.ts`; los mocks/controles compartidos viven en `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` incluye esta lane. Las ejecuciones de agente usan Testbox/Crabbox de forma predeterminada, incluida la prueba dirigida; usa `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` solo para una reserva local explícita.
- **Pruebas PTY de TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` ejecuta la lane PTY rápida de backend falso. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` o `pnpm tui:pty:test:watch --mode local` ejecuta el smoke más lento `tui --local`, que simula solo el endpoint externo del modelo. Verifica texto visible estable o llamadas a fixtures, no snapshots ANSI en bruto.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los shards de extensiones/plugins. Los plugins de canal pesados, el plugin del navegador y OpenAI se ejecutan como shards dedicados; otros grupos de plugins permanecen agrupados. `pnpm test extensions/<id>` ejecuta una lane de un plugin incluido.
- Los archivos fuente con pruebas hermanas se asignan a esa hermana antes de recurrir a globs de directorio más amplios. Las ediciones de helpers bajo `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` y `src/plugins/contracts` usan un grafo local de importaciones para ejecutar pruebas importadoras en lugar de ejecutar ampliamente cada shard cuando la ruta de dependencia es precisa.
- `auto-reply` se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el arnés de respuesta no domine las pruebas más ligeras de estado/token/helpers de nivel superior.
- Los archivos de prueba seleccionados de `plugin-sdk` y `commands` se enrutan por lanes ligeras dedicadas que mantienen solo `test/setup.ts`, dejando los casos pesados de runtime en sus lanes existentes.
- La configuración base de Vitest usa de forma predeterminada `pool: "threads"` e `isolate: false`, con el runner compartido no aislado habilitado en todas las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.

## Gateway y E2E

- La integración de Gateway es opcional: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: agregado E2E del repositorio = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: pruebas de humo de extremo a extremo de Gateway (emparejamiento multiinstancia WS/HTTP/Node). Usa de forma predeterminada `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajusta con `OPENCLAW_E2E_WORKERS=<n>`, registros detallados con `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: pruebas en vivo de proveedores (Claude/Minimax/DeepSeek/z.ai/etc., controladas por `*.live.test.ts`). Requiere claves de API y `LIVE=1` (o `OPENCLAW_LIVE_TEST=1`) para dejar de omitirlas; salida detallada con `OPENCLAW_LIVE_TEST_QUIET=0`.

## Suite completa de Docker (`pnpm test:docker:all`)

Compila la imagen compartida de pruebas en vivo, empaqueta OpenClaw una vez como un tarball de npm, compila/reutiliza una imagen básica de ejecutor Node/Git más una imagen funcional que instala ese tarball en `/app`, y luego ejecuta carriles de humo de Docker mediante un planificador ponderado. `scripts/package-openclaw-for-docker.mjs` es el único empaquetador de paquetes local/CI y valida el tarball más `dist/postinstall-inventory.json` antes de que Docker lo consuma.

- Imagen básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): carriles de instalador/actualización/dependencias de Plugin; monta el tarball precompilado en lugar de fuentes copiadas del repositorio.
- Imagen funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): carriles de funcionalidad normal de la aplicación compilada.
- Definiciones de carriles: `scripts/lib/docker-e2e-scenarios.mjs`. Planificador: `scripts/lib/docker-e2e-plan.mjs`. Ejecutor: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` emite el plan de CI propiedad del planificador (carriles, tipos de imagen, necesidades de paquete/imagen en vivo, escenarios de estado, comprobaciones de credenciales) sin compilar ni ejecutar Docker.

Controles de planificación (variables de entorno, valores predeterminados entre paréntesis):

| Variable de entorno                                                                                             | Predeterminado      | Propósito                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Ranuras de proceso.                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Grupo de cola sensible al proveedor.                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Límite de carriles pesados de proveedores en vivo.                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Límite de carriles de recursos de npm.                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Límite de carriles de recursos de servicio.                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Límites por proveedor para carriles pesados.                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Límites más estrechos por proveedor.                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Anulación para hosts más grandes.                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Retraso entre inicios de carriles; evita tormentas de creación en el daemon local de Docker.                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Tiempo de espera de respaldo por carril; algunos carriles en vivo/de cola usan límites más estrictos.                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Reintentos para fallos transitorios de proveedores en vivo.                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | Imprime el manifiesto de carriles sin ejecutar Docker.                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Intervalo de impresión de estado de carriles activos.                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | Reutiliza `.artifacts/docker-tests/lane-timings.json` para ordenar primero los más largos; configúralo en `0` para desactivarlo.                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` solo para carriles deterministas/locales, `only` solo para carriles de proveedores en vivo. Alias: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. El modo solo en vivo fusiona los carriles principales y de cola en vivo en un único grupo de más largos primero para que los grupos de proveedores empaqueten juntos el trabajo de Claude/Codex/Gemini. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Tiempo de espera de configuración de Docker del backend de CLI.                                                                                                                                                                                                                            |

El patrón de variables de entorno para límites de recursos es `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nombre del recurso en mayúsculas, caracteres no alfanuméricos colapsados a `_`).

Otro comportamiento: el ejecutor realiza preflight de Docker de forma predeterminada, limpia contenedores E2E obsoletos de OpenClaw, comparte cachés de herramientas CLI de proveedores entre carriles compatibles y deja de planificar nuevos carriles agrupados tras el primer fallo salvo que se configure `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`. Si un carril supera el límite efectivo de peso/recurso en un host con poco paralelismo, aún puede iniciarse desde un grupo vacío y ejecutarse solo hasta que libere capacidad. Los registros por carril, `summary.json`, `failures.json` y los tiempos de fase se escriben en `.artifacts/docker-tests/<run-id>/`; usa `pnpm test:docker:timings <summary.json>` para inspeccionar carriles lentos y `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos baratos de reejecución dirigida.

### Carriles destacados de Docker

| Comando                                                                     | Verifica                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Contenedor E2E de origen respaldado por Chromium con CDP sin procesar + Gateway aislado; las instantáneas de roles CDP de `browser doctor --deep` incluyen URL de enlaces, elementos clicables promovidos por cursor, referencias de iframe y metadatos de marcos.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:skill-install`                                            | Instala el tarball empaquetado en un ejecutor Docker básico con `skills.install.allowUploadedArchives: false`, resuelve un slug de skill actual desde la búsqueda en vivo de ClawHub, instala mediante `openclaw skills install` y verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` y `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Sondeos en vivo enfocados del backend de CLI; Gemini tiene alias `:resume` y `:mcp` equivalentes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI dockerizados: iniciar sesión, comprobar `/api/models`, ejecutar un chat real proxyficado mediante `/api/chat/completions`. Requiere una clave de modelo en vivo utilizable y descarga una imagen externa; no se espera que sea estable en CI como las suites unitarias/e2e.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:mcp-channels`                                             | Contenedor Gateway sembrado más un contenedor cliente que inicia `openclaw mcp serve`: descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos, comportamiento de cola de eventos en vivo, enrutamiento de envíos salientes y notificaciones de canal + permisos estilo Claude sobre el puente stdio real (la aserción lee directamente marcos MCP stdio sin procesar).                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:upgrade-survivor`                                         | Instala el tarball empaquetado sobre un fixture sucio de usuario antiguo, ejecuta actualización de paquete más doctor no interactivo sin claves de proveedor/canal en vivo, inicia un Gateway de local loopback y comprueba que sobrevivan agentes/configuración de canal/listas de permitidos de plugins/espacio de trabajo/archivos de sesión/estado de dependencia de plugin heredado obsoleto/estado de arranque/RPC.                                                                                                                                                                                                                                                                                                                          |
| `pnpm test:docker:published-upgrade-survivor`                               | Instala `openclaw@latest` de forma predeterminada, siembra archivos realistas de usuario existente, configura mediante una receta integrada de `openclaw config set`, actualiza al tarball empaquetado, ejecuta doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json`, comprueba `/healthz`, `/readyz` y estado RPC. Sobrescribe con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, amplía una matriz con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` o agrega fixtures de escenarios con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (incluye `configured-plugin-installs` y `stale-source-plugin-shadow`). Package Acceptance expone estos como `published_upgrade_survivor_baseline(s)` / `_scenarios` y resuelve tokens meta como `last-stable-4` o `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Arnés de supervivencia de actualización publicada en el escenario `plugin-deps-cleanup`, comenzando en `openclaw@2026.4.23` de forma predeterminada. El flujo de trabajo `Update Migration` amplía esto con `baselines=all-since-2026.4.23` para demostrar la limpieza de dependencias de plugins configurados fuera de Full Release CI.                                                                                                                                                                                                                                                                                                                                                                                                             |
| `pnpm test:docker:plugins`                                                  | Smoke de instalación/actualización para ruta local, `file:`, paquetes del registro npm con dependencias elevadas, referencias móviles de git, fixtures de ClawHub, actualizaciones del marketplace y habilitación/inspección del paquete Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Puerta de PR local

Para comprobaciones locales de aterrizaje/puerta de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` presenta flakes en un host cargado, vuelve a ejecutarlo una vez antes de tratarlo como una regresión y luego aísla con `pnpm test <path/to/test>`. Para hosts con memoria limitada:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Herramientas de rendimiento de pruebas

- `pnpm test:perf:imports`: habilita los informes de duración de importaciones + desglose de importaciones de Vitest, mientras sigue usando el enrutamiento de lanes con alcance para objetivos explícitos de archivo/directorio. `pnpm test:perf:imports:changed` limita el mismo perfilado a los archivos cambiados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el rendimiento de la ruta enrutada de modo cambiado contra la ejecución nativa del proyecto raíz para el mismo diff de git confirmado; `pnpm test:perf:changed:bench -- --worktree` compara el conjunto de cambios del worktree actual sin confirmar primero.
- `pnpm test:perf:profile:main` escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` escribe perfiles de CPU + heap para el ejecutor unitario (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta en serie cada configuración hoja de Vitest de suite completa y escribe datos de duración agrupados más artefactos JSON/log por configuración. Los informes de suite completa aíslan archivos de forma predeterminada para que los grafos de módulos retenidos y las pausas de GC de archivos anteriores no se carguen a aserciones posteriores; pasa `-- --no-isolate` solo cuando perfiles intencionalmente la acumulación de workers compartidos. El Test Performance Agent usa esto como su línea base antes de intentar correcciones de pruebas lentas. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` compara informes agrupados después de un cambio enfocado en el rendimiento.
- Las ejecuciones de shards completas, de extensión y con patrón de inclusión actualizan los datos de tiempos locales en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores de configuración completa usan esos tiempos para equilibrar shards lentos y rápidos. Los shards de CI con patrón de inclusión anexan el nombre del shard a la clave de tiempos, lo que mantiene visibles los tiempos de shards filtrados sin reemplazar los datos de tiempos de configuración completa. Configura `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto de tiempos local.

## Benchmarks

<Accordion title="Latencia del modelo (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Env opcional: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Prompt predeterminado: "Responde con una sola palabra: ok. Sin puntuación ni texto adicional."

</Accordion>

<Accordion title="Arranque de CLI (scripts/bench-cli-startup.ts)">

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

La salida incluye `sampleCount`, promedio, p50, p95, mínimo/máximo, distribución de código de salida/señal y RSS máximo por comando. `--cpu-prof-dir` / `--heap-prof-dir` escriben perfiles de V8 por ejecución.

Salida guardada: `pnpm test:startup:bench:smoke` escribe `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` escribe `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Fixture registrada: `test/fixtures/cli-startup-bench.json`, actualizada por `pnpm test:startup:bench:update`, comparada por `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Inicio de Gateway (scripts/bench-gateway-startup.ts)">

Usa de forma predeterminada la entrada CLI compilada en `dist/entry.js`; ejecuta primero `pnpm build`. Pasa `--entry scripts/run-node.mjs` para medir en su lugar el ejecutor de origen, y mantén esos resultados separados de las líneas base de entrada compilada.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Ids de caso: `default`, `skipChannels` (inicio de canales omitido), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 plugins de manifiesto), `fiftyStartupLazyPlugins` (50 plugins de manifiesto con inicio diferido).

La salida incluye la primera salida del proceso, `/healthz`, `/readyz`, tiempo del registro de escucha HTTP, tiempo del registro de Gateway listo, tiempo de CPU, proporción de núcleos de CPU, RSS máximo, heap, métricas de traza de inicio, retraso del bucle de eventos y métricas detalladas de la tabla de búsqueda de plugins. El script establece `OPENCLAW_GATEWAY_STARTUP_TRACE=1` en el entorno del Gateway hijo.

`/healthz` es vivacidad (el servidor HTTP puede responder). `/readyz` es preparación utilizable (los sidecars de plugins de inicio, los canales y el trabajo posadjunción crítico para estar listo se han estabilizado). Los hooks de inicio se despachan de forma asíncrona y no forman parte de la garantía de preparación. El tiempo del registro de listo es la marca de tiempo interna del Gateway, útil para atribución del lado del proceso, pero no sustituye a la sonda externa `/readyz`.

Usa salida JSON o `--output` al comparar cambios. Usa `--cpu-prof-dir` solo después de que la salida de traza apunte a trabajo de importación, compilación o limitado por CPU que los tiempos de fase por sí solos no puedan explicar.

</Accordion>

<Accordion title="Reinicio de Gateway (scripts/bench-gateway-restart.ts)">

Solo macOS y Linux (usa SIGUSR1 para reinicios dentro del proceso; falla inmediatamente en Windows). El mismo valor predeterminado de entrada compilada y la misma anulación `--entry scripts/run-node.mjs` que en el inicio de Gateway anterior.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Ids de caso: `skipChannels`, `skipChannelsAcpxProbe` (sonda de inicio ACPX activada), `skipChannelsNoAcpxProbe` (sonda desactivada), `default`, `fiftyPlugins`.

La salida incluye el siguiente `/healthz`, el siguiente `/readyz`, tiempo de inactividad, temporización de listo tras reinicio, CPU, RSS, métricas de traza de inicio para el proceso de reemplazo y métricas de traza de reinicio para manejo de señales, drenaje de trabajo activo, fases de cierre, siguiente inicio, temporización de listo e instantáneas de memoria. El script establece `OPENCLAW_GATEWAY_STARTUP_TRACE=1` y `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Usa este benchmark cuando un cambio toque señalización de reinicio, manejadores de cierre, inicio tras reinicio, apagado de sidecars, traspaso de servicios o preparación después del reinicio. Empieza con `skipChannels` para aislar la mecánica de Gateway del inicio de canales; usa `default` o casos con muchos plugins solo después de que el caso estrecho explique la ruta de reinicio. Las métricas de traza son indicios de atribución, no veredictos: evalúa un cambio de reinicio a partir de varias muestras, el tramo de propietario correspondiente, el comportamiento de `/healthz`/`/readyz` y el contrato de reinicio visible para el usuario.

</Accordion>

## E2E de incorporación (Docker)

Opcional; solo necesario para pruebas de humo de incorporación en contenedores. Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Conduce el asistente interactivo mediante una pseudo-tty, verifica archivos de configuración/espacio de trabajo/sesión, luego inicia el Gateway y ejecuta `openclaw health`.

## Prueba de humo de importación QR (Docker)

Garantiza que el ayudante de runtime QR mantenido se cargue bajo los runtimes de Node compatibles con Docker (Node 24 predeterminado, Node 22 compatible):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
