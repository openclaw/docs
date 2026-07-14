---
read_when:
    - Ejecución o corrección de pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos forzado/de cobertura
title: Pruebas
x-i18n:
    generated_at: "2026-07-14T14:09:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de pruebas (suites, en vivo, Docker): [Pruebas](/es/help/testing)
- Validación de actualizaciones y paquetes de plugins: [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)

## Configuración predeterminada del agente

Las sesiones de agente ejecutan localmente una o unas pocas pruebas específicas y comprobaciones estáticas económicas solo
para código fuente de confianza y cuando la instalación de dependencias existente está lista. Nunca
se deben ejecutar localmente herramientas de repositorios que no sean de confianza. Las suites más grandes, las puertas de cambios con
ejecución en abanico de comprobación de tipos/lint, las compilaciones, Docker, las vías de paquetes, las pruebas E2E, las pruebas en vivo y
la validación multiplataforma se ejecutan de forma remota mediante Crabbox. Para las
pruebas pesadas de mantenedores de confianza se usa Blacksmith Testbox de forma predeterminada. El flujo de trabajo de Testbox configurado
carga credenciales, por lo que el código de colaboradores o bifurcaciones que no sea de confianza debe usar
CI de bifurcación sin secretos o un Crabbox de AWS directo y saneado.

No se debe precalentar para trabajo previsto. Se debe adquirir el backend de forma diferida cuando
esté listo el primer comando pesado, reutilizar el id `tbx_...` devuelto para los comandos pesados
posteriores, sincronizar la copia de trabajo actual en cada ejecución y detenerlo antes de la entrega.

Después de la primera reutilización correcta, el contenedor registra la base,
las dependencias y la huella digital del flujo de trabajo de Testbox del arrendamiento en `.crabbox/testbox-leases/`.
Las ediciones que solo afectan al código fuente siguen reutilizando la instancia precalentada. Un cambio en la base de fusión, el archivo de bloqueo,
la entrada del gestor de paquetes, el contenedor o el flujo de trabajo de Testbox provoca un cierre seguro y requiere un
arrendamiento nuevo. Cada ejecución continúa sincronizando la copia de trabajo actual.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` se usa solo para diagnósticos intencionales, no
para pruebas de publicación.

Los comandos de prueba locales que aparecen a continuación son para flujos de trabajo humanos y pruebas acotadas del agente.
Debe informarse de la falta de disponibilidad del proveedor remoto; no es un permiso para
ejecutar silenciosamente una puerta local amplia.

Para pruebas pesadas que no sean de confianza, se debe precalentar de forma diferida con `--provider aws`. Cada ejecución debe establecer
`CRABBOX_ENV_ALLOW=CI`, pasar `--provider aws --no-hydrate` y usar
un `HOME` remoto temporal nuevo antes de instalar dependencias o ejecutar
pruebas. Se debe usar un arrendamiento recién precalentado dedicado a ese código fuente que no sea de confianza; nunca se debe reutilizar
un arrendamiento de confianza o cargado previamente con credenciales. Se debe iniciar un binario de Crabbox
de confianza instalado desde una copia de trabajo limpia y de confianza de `main` y obtener únicamente el PR remoto con
`--fresh-pr`; nunca se debe ejecutar localmente el contenedor ni la configuración de la copia de trabajo que no sea de confianza.
Se debe anular `CRABBOX_AWS_INSTANCE_PROFILE` y provocar un cierre seguro salvo que el valor resuelto de
`aws.instanceProfile` esté vacío. Antes de cualquier instalación o prueba, se deben usar herramientas de confianza
con rutas absolutas para exigir un token IMDSv2, demostrar que el endpoint de credenciales de IAM
devuelve 404 y verificar que el `git rev-parse HEAD` remoto sea igual al SHA completo
de la cabecera del PR revisado. Se debe vincular el arrendamiento a ese SHA y detenerlo y volverlo a precalentar cuando cambie la cabecera.
Se debe cargar el `scripts/crabbox-untrusted-bootstrap.sh` de confianza desde un
`main` limpio junto con `--fresh-pr`; este instala versiones fijadas de Node/pnpm, verifica el SHA
y la versión fijada del gestor de paquetes, aísla `HOME`, instala las dependencias y, a continuación, ejecuta
la prueba solicitada. Si el intermediario no puede demostrar que no hay ningún rol o que no existe ningún PR remoto,
se debe usar CI de bifurcación sin secretos. No se deben usar `hydrate-github`, `--no-sync` ni un
flujo de trabajo de Testbox cargado con credenciales.
Se deben anular todas las sustituciones de `CRABBOX_TAILSCALE*`, forzar `--network public
--tailscale=false`, borrar los indicadores de nodo de salida/LAN y exigir que `crabbox inspect`
informe de redes públicas sin estado de Tailscale antes de cargar cualquier script.

## Orden local habitual

1. `pnpm test:changed` para pruebas de Vitest del ámbito modificado.
2. `pnpm test <path-or-filter>` para un archivo, directorio u objetivo explícito.
3. `pnpm test` solo cuando se necesita intencionalmente la suite local completa de Vitest.

En un árbol de trabajo de Codex o una copia de trabajo vinculada/dispersa, los agentes evitan el uso local directo de
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Prueba específica acotada con las dependencias listas:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Comprobación de cambios con clasificación previa: `node scripts/check-changed.mjs`; los planes que solo afectan a la documentación,
  sin cambios y con pocos metadatos permanecen locales cuando las dependencias están listas,
  mientras que los planes pesados o con dependencias ausentes se delegan a Testbox.
- Prueba amplia explícita con arrendamiento conservado: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` para que pnpm se ejecute dentro de Testbox.
- El `exitCode` final del contenedor y el JSON de tiempos constituyen el resultado del comando. Una ejecución delegada de GitHub Actions de Blacksmith puede mostrar `cancelled` después de un comando SSH correcto porque Testbox se detiene desde fuera de la acción de mantenimiento de actividad; se debe comprobar el resumen del contenedor y la salida del comando antes de considerarlo un fallo.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mantiene la serialización de comprobaciones pesadas dentro del árbol de trabajo actual en lugar del directorio común de Git para comandos como `pnpm check:changed` y `pnpm test ...` dirigidos. Se debe usar solo en hosts locales de alta capacidad cuando se ejecutan intencionalmente comprobaciones independientes en varios árboles de trabajo vinculados.

## Comandos principales

Las ejecuciones del contenedor de pruebas terminan con un breve resumen `[test] passed|failed|skipped ... in ...`; la línea de duración propia de Vitest sigue siendo el detalle por fragmento.

| Comando                                           | Función                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Los objetivos explícitos de archivo/directorio se encaminan mediante vías de Vitest con ámbito definido. Las ejecuciones sin objetivo son pruebas de la suite completa: los grupos de fragmentos fijos se expanden a configuraciones hoja para la ejecución local en paralelo y el abanico de fragmentos esperado se imprime antes de comenzar. El grupo de extensiones siempre se expande a configuraciones de fragmentos por extensión en lugar de usar un único proceso gigante del proyecto raíz.           |
| `pnpm test:changed`                               | Ejecución inteligente y económica de pruebas modificadas: objetivos precisos a partir de ediciones directas de pruebas, archivos `*.test.ts` hermanos, asignaciones explícitas de código fuente y el grafo de importaciones local. Los cambios amplios o de configuración/paquetes se omiten salvo que se asignen a pruebas precisas.                                                                                                                               |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Ejecución amplia explícita de pruebas modificadas; se usa cuando una edición del arnés de pruebas, la configuración o el paquete debe recurrir al comportamiento más amplio de pruebas modificadas de Vitest.                                                                                                                                                                                                                        |
| `pnpm test:force`                                 | Libera el puerto de Gateway de OpenClaw configurado (valor predeterminado: `18789`) y, a continuación, ejecuta la suite completa con un puerto de Gateway aislado para que las pruebas del servidor no entren en conflicto con una instancia en ejecución.                                                                                                                                                                                    |
| `pnpm test:coverage`                              | Emite un informe informativo de cobertura de V8 para la vía de pruebas unitarias predeterminada (`vitest.unit.config.ts`); no se aplican umbrales de cobertura.                                                                                                                                                                                                                             |
| `pnpm test:coverage:changed`                      | Cobertura de pruebas unitarias únicamente para los archivos modificados desde `origin/main`.                                                                                                                                                                                                                                                                                                       |
| `pnpm changed:lanes`                              | Muestra las vías arquitectónicas activadas por las diferencias respecto a `origin/main`.                                                                                                                                                                                                                                                                                      |
| `pnpm check:changed`                              | Clasifica las vías modificadas antes de elegir la ejecución. Los planes que solo afectan a la documentación, sin cambios y con pocos metadatos permanecen locales cuando las dependencias están listas; los planes con ejecución en abanico de comprobación de tipos/lint, otras vías pesadas o dependencias locales ausentes se delegan a Crabbox/Testbox fuera de CI. No ejecuta Vitest; se debe usar `pnpm test:changed` o `pnpm test <target>` como prueba. |

## Estado de pruebas compartido y auxiliares de procesos

- `src/test-utils/openclaw-test-state.ts`: se usa desde Vitest cuando una prueba necesita un `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, accesorio de configuración, espacio de trabajo, directorio del agente o almacén de perfiles de autenticación aislado.
- `pnpm test:env-mutations:report`: informe no bloqueante de pruebas/arneses que modifican directamente `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` o claves de entorno relacionadas. Se usa para encontrar candidatos de migración al auxiliar de estado de pruebas compartido.
- `test/helpers/openclaw-test-instance.ts`: pruebas E2E a nivel de proceso que necesitan un Gateway en ejecución, entorno de CLI, captura de registros y limpieza en un solo lugar.
- Las vías E2E de Docker/Bash que cargan `scripts/lib/docker-e2e-image.sh` pueden pasar `docker_e2e_test_state_shell_b64 <label> <scenario>` al contenedor y decodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; los scripts con varios directorios personales pueden pasar `docker_e2e_test_state_function_b64` y llamar a `openclaw_test_state_create <label> <scenario>` en cada flujo. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` escribe un archivo de entorno del host que se puede cargar (el `--` antes de `create` evita que las versiones más recientes de Node traten `--env-file` como un indicador de Node). Las vías que inician un Gateway pueden cargar `scripts/lib/openclaw-e2e-instance.sh` para resolver el punto de entrada, simular el inicio de OpenAI, iniciar en primer plano o en segundo plano, realizar sondeos de disponibilidad, exportar el entorno de estado, volcar registros y limpiar procesos.

## Vías de la interfaz de control, la TUI y las extensiones

- **E2E simulado de la interfaz de control:** `pnpm test:ui:e2e` ejecuta la vía de Vitest + Playwright que inicia la interfaz de control de Vite y controla una página real de Chromium contra un WebSocket simulado del Gateway. Las pruebas se encuentran en `ui/src/**/*.e2e.test.ts`; las simulaciones y los controles compartidos se encuentran en `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` incluye esta vía. Las ejecuciones de agentes usan Testbox/Crabbox de forma predeterminada, incluida la verificación dirigida; use `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` solo como alternativa local explícita.
- **Pruebas PTY de la TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` ejecuta la vía PTY rápida con un backend simulado. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` o `pnpm tui:pty:test:watch --mode local` ejecuta la prueba de humo más lenta de `tui --local`, que solo simula el endpoint externo del modelo. Compruebe texto visible estable o llamadas a fixtures, no instantáneas ANSI sin procesar.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los fragmentos de extensiones/plugins. Los plugins de canales pesados, el plugin del navegador y OpenAI se ejecutan como fragmentos dedicados; los demás grupos de plugins permanecen agrupados. `pnpm test extensions/<id>` ejecuta la vía de un plugin incluido.
- Los archivos fuente con pruebas hermanas se asignan a esas pruebas antes de recurrir a patrones glob de directorios más amplios. Las modificaciones de auxiliares en `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` y `src/plugins/contracts` usan un grafo de importaciones local para ejecutar las pruebas que los importan, en lugar de ejecutar ampliamente todos los fragmentos cuando la ruta de dependencia es precisa.
- Los destinos de directorios de contratos se distribuyen entre sus vías de contratos: `pnpm test src/channels/plugins/contracts` ejecuta las cuatro configuraciones de contratos de canales y `pnpm test src/plugins/contracts` ejecuta la configuración de contratos de plugins, ya que los proyectos genéricos `channels`/`plugins` excluyen `contracts/**`.
- `auto-reply` se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el arnés de respuestas no domine las pruebas más ligeras de estado, tokens y auxiliares de nivel superior.
- Los archivos de prueba seleccionados de `plugin-sdk` y `commands` se encaminan por vías ligeras dedicadas que conservan solo `test/setup.ts`, dejando los casos con mayor carga de ejecución en sus vías existentes.
- La configuración base de Vitest usa de forma predeterminada `pool: "threads"` y `isolate: false`, con el ejecutor compartido no aislado habilitado en todas las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.

## Gateway y E2E

- La integración del Gateway es opcional: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: conjunto E2E del repositorio = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: pruebas de humo de extremo a extremo del Gateway (emparejamiento de múltiples instancias WS/HTTP/Node). Usa de forma predeterminada `threads` + `isolate: false` con ejecutores adaptativos en `vitest.e2e.config.ts`; ajuste con `OPENCLAW_E2E_WORKERS=<n>` y active los registros detallados con `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: pruebas en vivo de proveedores (Claude/Minimax/DeepSeek/z.ai/etc., condicionadas por `*.live.test.ts`). Requiere claves de API y `LIVE=1` (o `OPENCLAW_LIVE_TEST=1`) para dejar de omitirlas; salida detallada con `OPENCLAW_LIVE_TEST_QUIET=0`.

## Suite completa de Docker (`pnpm test:docker:all`)

Compila la imagen compartida de pruebas en vivo, empaqueta OpenClaw una vez como un tarball de npm, compila o reutiliza una imagen de ejecución básica con Node/Git y una imagen funcional que instala ese tarball en `/app`, y luego ejecuta las vías de pruebas de humo de Docker mediante un planificador ponderado. `scripts/package-openclaw-for-docker.mjs` es el único empaquetador local/de CI y valida el tarball junto con `dist/postinstall-inventory.json` antes de que Docker lo utilice.

- Imagen básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): vías de instalación, actualización y dependencias de plugins; monta el tarball precompilado en lugar de copiar el código fuente del repositorio.
- Imagen funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): vías normales de funcionalidad de la aplicación compilada.
- Definiciones de vías: `scripts/lib/docker-e2e-scenarios.mjs`. Planificador: `scripts/lib/docker-e2e-plan.mjs`. Ejecutor: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` emite el plan de CI administrado por el planificador (vías, tipos de imagen, necesidades de paquetes/imágenes en vivo, escenarios de estado y comprobaciones de credenciales) sin compilar ni ejecutar Docker.

Parámetros de planificación (variables de entorno, valores predeterminados entre paréntesis):

| Variable de entorno                                                                                             | Valor predeterminado | Propósito                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Espacios de procesos.                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Grupo final sensible al proveedor.                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Límite de vías pesadas de proveedores en vivo.                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Límite de vías de recursos de npm.                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Límite de vías de recursos de servicios.                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Límites de vías pesadas por proveedor.                                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Límites más estrictos por proveedor.                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Sobrescritura para hosts más grandes.                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Retraso entre inicios de vías; evita ráfagas de creación en el daemon de Docker local.                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Tiempo de espera alternativo por vía; las vías en vivo/finales seleccionadas usan límites más estrictos.                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Reintentos para fallos transitorios de proveedores en vivo.                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | Imprime el manifiesto de vías sin ejecutar Docker.                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Intervalo de impresión del estado de las vías activas.                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | Reutiliza `.artifacts/docker-tests/lane-timings.json` para ordenar primero las vías más largas; establezca `0` para deshabilitarlo.                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` solo para vías deterministas/locales, `only` solo para vías de proveedores en vivo. Alias: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. El modo solo en vivo combina las vías en vivo principales y finales en un único grupo ordenado de mayor a menor duración para que los grupos de proveedores agrupen el trabajo de Claude/Codex/Gemini. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Tiempo de espera de configuración de Docker para el backend de la CLI.                                                                                                                                                                                                                     |

El patrón de variables de entorno para los límites de recursos es `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nombre del recurso en mayúsculas, con los caracteres no alfanuméricos contraídos a `_`).

Otro comportamiento: el ejecutor realiza de forma predeterminada una comprobación previa de Docker, limpia los contenedores E2E obsoletos de OpenClaw, comparte las cachés de herramientas CLI de los proveedores entre carriles compatibles y deja de programar nuevos carriles agrupados después del primer fallo, a menos que se establezca `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`. Si un carril supera el límite efectivo de peso o recursos en un host con poco paralelismo, aún puede iniciarse desde un grupo vacío y ejecutarse en solitario hasta que libere capacidad. Los registros por carril, `summary.json`, `failures.json` y los tiempos de las fases se escriben en `.artifacts/docker-tests/<run-id>/`; use `pnpm test:docker:timings <summary.json>` para inspeccionar los carriles lentos y `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos económicos de repetición de ejecución específica.

### Carriles de Docker destacados

| Comando                                                                     | Verifica                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Contenedor E2E de código fuente respaldado por Chromium con CDP sin procesar y un Gateway aislado; las instantáneas de roles CDP de `browser doctor --deep` incluyen las URL de los enlaces, los elementos en los que se puede hacer clic promovidos por el cursor, las referencias de iframe y los metadatos de los marcos.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `pnpm test:docker:skill-install`                                            | Instala el tarball empaquetado en un ejecutor de Docker básico con `skills.install.allowUploadedArchives: false`, resuelve el slug de una skill actual mediante una búsqueda en vivo de ClawHub, la instala mediante `openclaw skills install` y verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` y `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Pruebas en vivo específicas del backend de la CLI; Gemini tiene los alias equivalentes `:resume` y `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI en Docker: inicia sesión, comprueba `/api/models` y ejecuta un chat real mediante proxy a través de `/api/chat/completions`. Requiere una clave de modelo en vivo utilizable y descarga una imagen externa; no se espera que sea estable en CI como los conjuntos de pruebas unitarias y E2E.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `pnpm test:docker:mcp-channels`                                             | Contenedor de Gateway con datos iniciales más un contenedor cliente que genera `openclaw mcp serve`: descubrimiento de conversaciones enrutadas, lectura de transcripciones, metadatos de archivos adjuntos, comportamiento de la cola de eventos en vivo, enrutamiento de envíos salientes y notificaciones de canales y permisos al estilo Claude a través del puente stdio real (la aserción lee directamente los marcos MCP de stdio sin procesar).                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:upgrade-survivor`                                         | Instala el tarball empaquetado sobre un fixture antiguo y modificado de un usuario existente, ejecuta la actualización del paquete y doctor de forma no interactiva sin claves activas de proveedores o canales, inicia un Gateway de bucle invertido y comprueba que se conserven los agentes, la configuración de canales, las listas de permitidos de plugins, los archivos del espacio de trabajo y de sesiones, el estado obsoleto de dependencias de plugins heredados, el inicio y el estado de RPC.                                                                                                                                                                                                                                              |
| `pnpm test:docker:published-upgrade-survivor`                               | Instala `openclaw@latest` de forma predeterminada, incorpora archivos realistas de usuarios existentes, configura mediante una receta `openclaw config set` integrada, actualiza al tarball empaquetado, ejecuta doctor de forma no interactiva, escribe `.artifacts/upgrade-survivor/summary.json` y comprueba `/healthz`, `/readyz` y el estado de RPC. Sobrescriba con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, amplíe una matriz con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` o añada fixtures de escenarios con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (incluye `configured-plugin-installs` y `stale-source-plugin-shadow`). Package Acceptance los expone como `published_upgrade_survivor_baseline(s)` / `_scenarios` y resuelve metatokens como `last-stable-4` o `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Entorno de supervivencia tras actualizaciones publicadas en el escenario `plugin-deps-cleanup`, que comienza en `openclaw@2026.4.23` de forma predeterminada. El flujo de trabajo `Update Migration` amplía esto con `baselines=all-since-2026.4.23` para demostrar la limpieza de dependencias de plugins configurados fuera de Full Release CI.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:plugins`                                                  | Prueba de humo de instalación y actualización para una ruta local, `file:`, paquetes del registro npm con dependencias elevadas, referencias móviles de git, fixtures de ClawHub, actualizaciones del marketplace y activación e inspección del paquete de Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Puerta de PR local

Para las comprobaciones locales de puerta e integración de PR, ejecute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` presenta fallos intermitentes en un host con carga, vuelva a ejecutarlo una vez antes de considerarlo una regresión y, después, aíslelo con `pnpm test <path/to/test>`. Para hosts con memoria limitada:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Herramientas de rendimiento de pruebas

- `pnpm test:perf:imports`: habilita los informes de duración y desglose de importaciones de Vitest, mientras sigue usando el enrutamiento de carriles delimitado para destinos explícitos de archivos o directorios. `pnpm test:perf:imports:changed` limita el mismo perfilado a los archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el rendimiento de la ruta en modo de cambios enrutada con la ejecución nativa del proyecto raíz para la misma diferencia de git confirmada; `pnpm test:perf:changed:bench -- --worktree` compara el conjunto de cambios del árbol de trabajo actual sin realizar primero una confirmación.
- `pnpm test:perf:profile:main` escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` escribe perfiles de CPU y de memoria dinámica para el ejecutor de pruebas unitarias (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta en serie cada configuración hoja de Vitest del conjunto completo de pruebas y escribe datos agrupados de duración, además de artefactos JSON y registros por configuración. Los informes del conjunto completo de pruebas aíslan los archivos de forma predeterminada para que los gráficos de módulos retenidos y las pausas de GC de archivos anteriores no se imputen a aserciones posteriores; pase `-- --no-isolate` solo cuando se perfile intencionadamente la acumulación de trabajadores compartidos. El agente de rendimiento de pruebas usa esto como referencia antes de intentar corregir pruebas lentas. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` compara informes agrupados después de un cambio centrado en el rendimiento.
- Las ejecuciones completas, de extensiones y de fragmentos con patrones de inclusión actualizan los datos de tiempos locales en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores de configuraciones completas usan esos tiempos para equilibrar los fragmentos lentos y rápidos. Los fragmentos de CI con patrones de inclusión añaden el nombre del fragmento a la clave de tiempo, lo que mantiene visibles los tiempos de los fragmentos filtrados sin sustituir los datos de tiempos de la configuración completa. Establezca `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto de tiempos local.

## Pruebas de rendimiento

<Accordion title="Latencia del modelo (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Variables de entorno opcionales: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Prompt predeterminado: "Responde con una sola palabra: ok. Sin puntuación ni texto adicional."

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

Salida guardada: `pnpm test:startup:bench:smoke` escribe `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` escribe `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Fixture incluida en el repositorio: `test/fixtures/cli-startup-bench.json`, actualizada mediante `pnpm test:startup:bench:update` y comparada mediante `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Inicio del Gateway (scripts/bench-gateway-startup.ts)">

De forma predeterminada, usa el punto de entrada de la CLI compilada en `dist/entry.js`; ejecute primero `pnpm build`. Pase `--entry scripts/run-node.mjs` para medir en su lugar el ejecutor del código fuente y mantenga esos resultados separados de las líneas base del punto de entrada compilado.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Identificadores de casos: `default`, `skipChannels` (se omite el inicio de los canales), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 plugins de manifiesto), `fiftyStartupLazyPlugins` (50 plugins de manifiesto con carga diferida durante el inicio).

La salida incluye la primera salida del proceso, `/healthz`, `/readyz`, la hora del registro de escucha HTTP, la hora del registro de disponibilidad del Gateway, el tiempo de CPU, la proporción de núcleos de CPU, el RSS máximo, el montón, las métricas de seguimiento del inicio, el retraso del bucle de eventos y las métricas detalladas de la tabla de consulta de plugins. El script establece `OPENCLAW_GATEWAY_STARTUP_TRACE=1` en el entorno del Gateway secundario.

`/healthz` indica actividad (el servidor HTTP puede responder). `/readyz` indica disponibilidad operativa (los procesos auxiliares de plugins de inicio, los canales y el trabajo posterior a la conexión crítico para la disponibilidad han terminado de estabilizarse). Los hooks de inicio se despachan de forma asíncrona y no forman parte de la garantía de disponibilidad. La hora del registro de disponibilidad es la marca de tiempo interna del Gateway, útil para la atribución dentro del proceso, pero no sustituye la sonda externa `/readyz`.

Use la salida JSON o `--output` al comparar cambios. Use `--cpu-prof-dir` solo cuando la salida de seguimiento señale trabajo de importación, compilación o limitado por la CPU que los tiempos de las fases por sí solos no puedan explicar.

</Accordion>

<Accordion title="Reinicio del Gateway (scripts/bench-gateway-restart.ts)">

Solo para macOS y Linux (usa SIGUSR1 para los reinicios dentro del proceso; falla de inmediato en Windows). Tiene el mismo punto de entrada compilado predeterminado y la misma sustitución mediante `--entry scripts/run-node.mjs` que el inicio del Gateway descrito anteriormente.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Identificadores de casos: `skipChannels`, `skipChannelsAcpxProbe` (sonda de inicio de ACPX activada), `skipChannelsNoAcpxProbe` (sonda desactivada), `default`, `fiftyPlugins`.

La salida incluye el siguiente `/healthz`, el siguiente `/readyz`, el tiempo de inactividad, el tiempo de disponibilidad tras el reinicio, la CPU, el RSS, las métricas de seguimiento del inicio del proceso de reemplazo y las métricas de seguimiento del reinicio para el manejo de señales, el drenaje del trabajo activo, las fases de cierre, el siguiente inicio, el tiempo de disponibilidad y las instantáneas de memoria. El script establece `OPENCLAW_GATEWAY_STARTUP_TRACE=1` y `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Use esta prueba de rendimiento cuando un cambio afecte a la señalización de reinicio, los manejadores de cierre, el inicio después del reinicio, el apagado de procesos auxiliares, el traspaso del servicio o la disponibilidad después del reinicio. Comience con `skipChannels` para aislar la mecánica del Gateway del inicio de los canales; use `default` o casos con muchos plugins solo después de que el caso acotado explique la ruta de reinicio. Las métricas de seguimiento son indicios de atribución, no veredictos: evalúe un cambio de reinicio a partir de varias muestras, el intervalo correspondiente del propietario, el comportamiento de `/healthz`/`/readyz` y el contrato de reinicio visible para el usuario.

</Accordion>

## E2E de incorporación (Docker)

Opcional; solo es necesario para las pruebas rápidas de incorporación en contenedores. Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Controla el asistente interactivo mediante una pseudoterminal, verifica los archivos de configuración, espacio de trabajo y sesión, inicia el Gateway y, a continuación, ejecuta `openclaw health`.

## Prueba rápida de importación de QR (Docker)

Garantiza que el helper mantenido del entorno de ejecución de QR se cargue en los entornos de ejecución de Node compatibles con Docker (Node 24 de forma predeterminada, compatible con Node 22):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
