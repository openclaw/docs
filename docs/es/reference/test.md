---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos de ejecución forzada/cobertura
title: Pruebas
x-i18n:
    generated_at: "2026-07-12T14:48:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- Kit completo de pruebas (suites, en vivo, Docker): [Pruebas](/es/help/testing)
- Validación de actualizaciones y paquetes de plugins: [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)

## Configuración predeterminada del agente

Las sesiones del agente ejecutan las pruebas y la validación de alta carga computacional de forma remota
mediante Crabbox. El código de mantenedores de confianza usa Blacksmith Testbox de forma predeterminada. El
flujo de trabajo de Testbox configurado carga credenciales, por lo que el código no confiable de colaboradores o
de bifurcaciones debe usar CI sin secretos en la bifurcación o una instancia directa y saneada de AWS Crabbox.

Cuando sea probable que una tarea de código de confianza necesite pruebas o una verificación intensiva, precaliente
inmediatamente en una sesión de comandos en segundo plano, continúe trabajando mientras se carga,
reutilice el identificador `tbx_...` devuelto, sincronice el checkout actual en cada ejecución y
deténgalo antes de la entrega:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Después de la primera reutilización correcta, el contenedor registra la base del arrendamiento,
las dependencias y la huella digital del flujo de trabajo de Testbox en `.crabbox/testbox-leases/`.
Las ediciones únicamente del código fuente siguen reutilizando la instancia precalentada. Un cambio en la base de fusión, el archivo de bloqueo,
la entrada del gestor de paquetes, el contenedor o el flujo de trabajo de Testbox provoca un cierre seguro y requiere un
arrendamiento nuevo. Cada ejecución continúa sincronizando el checkout actual.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` solo debe usarse para diagnósticos intencionados, no como
verificación de una versión.

Los comandos de pruebas locales que aparecen a continuación son para flujos de trabajo humanos o para una alternativa explícita del agente
solicitada por el usuario. Se debe informar de la falta de disponibilidad del proveedor remoto; esto
no constituye permiso para ejecutar silenciosamente una comprobación local amplia.

Para código no confiable, precaliente con `--provider aws`. Cada ejecución debe establecer
`CRABBOX_ENV_ALLOW=CI`, pasar `--provider aws --no-hydrate` y usar
un `HOME` remoto temporal nuevo antes de instalar dependencias o ejecutar
pruebas. Use un arrendamiento recién precalentado dedicado a ese código fuente no confiable; nunca reutilice
un arrendamiento de confianza o previamente cargado con credenciales. Inicie un binario de Crabbox de confianza instalado
desde un checkout limpio y de confianza de `main` y obtenga únicamente el PR remoto con
`--fresh-pr`; nunca ejecute localmente el contenedor ni la configuración del checkout no confiable.
Anule `CRABBOX_AWS_INSTANCE_PROFILE` y realice un cierre seguro salvo que el valor resuelto de
`aws.instanceProfile` esté vacío. Antes de cualquier instalación o prueba, use herramientas de confianza
con rutas absolutas para exigir un token de IMDSv2, demostrar que el endpoint de credenciales de IAM
devuelve 404 y verificar que el valor remoto de `git rev-parse HEAD` sea igual al SHA completo
de la cabecera revisada del PR. Vincule el arrendamiento a ese SHA y deténgalo y vuelva a precalentarlo cuando cambie la cabecera.
Cargue el archivo de confianza `scripts/crabbox-untrusted-bootstrap.sh` desde un checkout limpio de
`main` junto con `--fresh-pr`; instala las versiones fijadas de Node/pnpm, verifica el SHA
y la versión fijada del gestor de paquetes, aísla `HOME`, instala las dependencias y, después, ejecuta
la prueba solicitada. Si el intermediario no puede demostrar que no existe ningún rol o que no existe ningún PR remoto,
use CI sin secretos en la bifurcación. No use `hydrate-github`, `--no-sync` ni un
flujo de trabajo de Testbox cargado con credenciales.
Anule todas las sustituciones `CRABBOX_TAILSCALE*`, fuerce `--network public
--tailscale=false`, borre las opciones de nodo de salida/LAN y exija que `crabbox inspect`
informe de una red pública sin estado de Tailscale antes de cargar cualquier script.

## Orden local habitual

1. `pnpm test:changed` para verificar mediante Vitest el ámbito modificado.
2. `pnpm test <path-or-filter>` para un archivo, directorio u objetivo explícito.
3. `pnpm test` solo cuando se necesite intencionadamente la suite local completa de Vitest.

En un árbol de trabajo de Codex o un checkout vinculado/disperso, los agentes evitan la ejecución local directa de
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Alternativa local solicitada explícitamente por el usuario para un archivo pequeño:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Comprobaciones de cambios o verificación amplia: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed` para que pnpm se ejecute dentro de Testbox.
- El `exitCode` final y el JSON de tiempos del contenedor constituyen el resultado del comando. Una ejecución delegada de Blacksmith GitHub Actions puede aparecer como `cancelled` después de un comando SSH correcto porque Testbox se detiene desde fuera de la acción de mantenimiento; compruebe el resumen del contenedor y la salida del comando antes de considerarlo un fallo.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: mantiene la serialización de las comprobaciones intensivas dentro del árbol de trabajo actual, en lugar del directorio común de Git, para comandos como `pnpm check:changed` y ejecuciones específicas de `pnpm test ...`. Úselo únicamente en hosts locales de alta capacidad cuando se ejecuten intencionadamente comprobaciones independientes en varios árboles de trabajo vinculados.

## Comandos principales

Las ejecuciones del contenedor de pruebas terminan con un breve resumen `[test] passed|failed|skipped ... in ...`; la línea de duración propia de Vitest conserva los detalles por fragmento.

| Comando                                           | Qué hace                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Los objetivos explícitos de archivos o directorios se dirigen mediante carriles de Vitest con ámbito limitado. Las ejecuciones sin objetivo constituyen una verificación de la suite completa: los grupos fijos de fragmentos se expanden a configuraciones hoja para su ejecución local en paralelo, y la distribución esperada de fragmentos se muestra antes de comenzar. El grupo de extensiones siempre se expande a configuraciones de fragmentos por extensión, en lugar de un único proceso gigante del proyecto raíz. |
| `pnpm test:changed`                               | Ejecución económica e inteligente de pruebas de cambios: objetivos precisos derivados de ediciones directas de pruebas, archivos `*.test.ts` hermanos, asignaciones explícitas del código fuente y el grafo de importaciones local. Los cambios amplios, de configuración o de paquetes se omiten salvo que correspondan a pruebas precisas.                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Ejecución amplia y explícita de pruebas de cambios; úsela cuando una edición de un entorno de pruebas, una configuración o un paquete deba recurrir al comportamiento más amplio de Vitest para pruebas de cambios.                                                                                                                                                                                                              |
| `pnpm test:force`                                 | Libera el puerto configurado del Gateway de OpenClaw (valor predeterminado: `18789`) y, después, ejecuta la suite completa con un puerto de Gateway aislado para que las pruebas del servidor no entren en conflicto con una instancia en ejecución.                                                                                                                                                                          |
| `pnpm test:coverage`                              | Emite un informe informativo de cobertura de V8 para el carril de unidades predeterminado (`vitest.unit.config.ts`); no se aplican umbrales de cobertura.                                                                                                                                                                                                                   |
| `pnpm test:coverage:changed`                      | Cobertura de unidades únicamente para los archivos modificados desde `origin/main`.                                                                                                                                                                                                                                                                                             |
| `pnpm changed:lanes`                              | Muestra los carriles arquitectónicos activados por las diferencias respecto a `origin/main`.                                                                                                                                                                                                                                                                            |
| `pnpm check:changed`                              | Delega en Crabbox/Testbox de forma predeterminada fuera de CI y, después, ejecuta la comprobación inteligente de cambios dentro del proceso secundario remoto: formato, además de comprobación de tipos, lint y comandos de protección para los carriles afectados. No ejecuta Vitest; use `pnpm test:changed` o `pnpm test <target>` como verificación de pruebas.                                                                      |

## Estado compartido de pruebas y auxiliares de procesos

- `src/test-utils/openclaw-test-state.ts`: úselo desde Vitest cuando una prueba necesite valores aislados de `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, un fixture de configuración, un espacio de trabajo, un directorio de agente o un almacén de perfiles de autenticación.
- `pnpm test:env-mutations:report`: informe no bloqueante de las pruebas o entornos que modifican directamente `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` o claves de entorno relacionadas. Úselo para encontrar candidatos de migración al auxiliar de estado compartido de pruebas.
- `test/helpers/openclaw-test-instance.ts`: para pruebas E2E a nivel de proceso que necesiten en un único lugar un Gateway en ejecución, el entorno de la CLI, la captura de registros y la limpieza.
- Los carriles E2E de Docker/Bash que cargan `scripts/lib/docker-e2e-image.sh` pueden pasar `docker_e2e_test_state_shell_b64 <label> <scenario>` al contenedor y descodificarlo con `scripts/lib/openclaw-e2e-instance.sh`; los scripts con varios directorios personales pueden pasar `docker_e2e_test_state_function_b64` y llamar a `openclaw_test_state_create <label> <scenario>` en cada flujo. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` escribe un archivo de entorno del host que puede cargarse (el `--` anterior a `create` evita que las versiones más recientes de Node interpreten `--env-file` como una opción de Node). Los carriles que inician un Gateway pueden cargar `scripts/lib/openclaw-e2e-instance.sh` para resolver el punto de entrada, iniciar el simulador de OpenAI, ejecutar en primer o segundo plano, realizar sondeos de disponibilidad, exportar el entorno de estado, volcar registros y limpiar procesos.

## Carriles de Control UI, TUI y extensiones

- **E2E simuladas de la interfaz de control:** `pnpm test:ui:e2e` ejecuta la vía de Vitest + Playwright que inicia la interfaz de control de Vite y controla una página real de Chromium conectada a un WebSocket de Gateway simulado. Las pruebas se encuentran en `ui/src/**/*.e2e.test.ts`; las simulaciones y los controles compartidos se encuentran en `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` incluye esta vía. Las ejecuciones del agente usan Testbox/Crabbox de forma predeterminada, incluida la verificación específica; use `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` únicamente como alternativa local explícita.
- **Pruebas de PTY de la TUI:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` ejecuta la vía rápida de PTY con un backend simulado. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` o `pnpm tui:pty:test:watch --mode local` ejecuta la prueba de humo más lenta de `tui --local`, que solo simula el endpoint externo del modelo. Compruebe texto visible estable o llamadas a fixtures, no instantáneas ANSI sin procesar.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los fragmentos de extensiones/plugins. Los plugins de canales pesados, el plugin del navegador y OpenAI se ejecutan como fragmentos dedicados; los demás grupos de plugins permanecen agrupados. `pnpm test extensions/<id>` ejecuta la vía de un plugin incluido.
- Los archivos fuente con pruebas hermanas se asignan a esas pruebas antes de recurrir a patrones glob de directorios más amplios. Las modificaciones de auxiliares en `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` y `src/plugins/contracts` usan un grafo de importaciones local para ejecutar las pruebas que los importan, en lugar de ejecutar ampliamente todos los fragmentos cuando la ruta de dependencia es precisa.
- Los objetivos de directorios de contratos se distribuyen entre sus vías de contratos: `pnpm test src/channels/plugins/contracts` ejecuta las cuatro configuraciones de contratos de canales y `pnpm test src/plugins/contracts` ejecuta la configuración de contratos de plugins, ya que los proyectos genéricos `channels`/`plugins` excluyen `contracts/**`.
- `auto-reply` se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el entorno de pruebas de respuestas no domine las pruebas más ligeras de estado, tokens y auxiliares de nivel superior.
- Algunos archivos de prueba de `plugin-sdk` y `commands` se encaminan mediante vías ligeras dedicadas que conservan únicamente `test/setup.ts`, mientras que los casos con mayor carga de ejecución permanecen en sus vías existentes.
- La configuración base de Vitest usa de forma predeterminada `pool: "threads"` e `isolate: false`, con el ejecutor compartido sin aislamiento habilitado en todas las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.

## Gateway y E2E

- La integración de Gateway es opcional: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: conjunto E2E del repositorio = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: pruebas de humo de extremo a extremo de Gateway (emparejamiento multiinstancia de WS/HTTP/Node). Usa de forma predeterminada `threads` + `isolate: false` con procesos de trabajo adaptativos en `vitest.e2e.config.ts`; ajuste la cantidad con `OPENCLAW_E2E_WORKERS=<n>` y habilite registros detallados con `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: pruebas en vivo de proveedores (Claude/Minimax/DeepSeek/z.ai/etc., controladas por `*.live.test.ts`). Requieren claves de API y `LIVE=1` (o `OPENCLAW_LIVE_TEST=1`) para dejar de omitirse; habilite la salida detallada con `OPENCLAW_LIVE_TEST_QUIET=0`.

## Conjunto completo de Docker (`pnpm test:docker:all`)

Compila la imagen compartida de pruebas en vivo, empaqueta OpenClaw una sola vez como un archivo tar de npm, compila o reutiliza una imagen básica de ejecución con Node/Git y una imagen funcional que instala ese archivo tar en `/app`, y después ejecuta las vías de pruebas de humo de Docker mediante un planificador ponderado. `scripts/package-openclaw-for-docker.mjs` es el único empaquetador local/de CI y valida el archivo tar y `dist/postinstall-inventory.json` antes de que Docker lo consuma.

- Imagen básica (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): vías de instalación, actualización y dependencias de plugins; monta el archivo tar precompilado en lugar de fuentes copiadas del repositorio.
- Imagen funcional (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): vías normales de funcionalidad de la aplicación compilada.
- Definiciones de vías: `scripts/lib/docker-e2e-scenarios.mjs`. Planificador: `scripts/lib/docker-e2e-plan.mjs`. Ejecutor: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` emite el plan de CI gestionado por el planificador (vías, tipos de imagen, necesidades de paquete/imagen en vivo, escenarios de estado y comprobaciones de credenciales) sin compilar ni ejecutar Docker.

Opciones de planificación (variables de entorno, valores predeterminados entre paréntesis):

| Variable de entorno                                                                                             | Valor predeterminado | Propósito                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                   | Espacios de procesos.                                                                                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                   | Grupo final sensible al proveedor.                                                                                                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                    | Límite de vías pesadas de proveedores en vivo.                                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                    | Límite de vías que usan recursos de npm.                                                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                    | Límite de vías que usan recursos de servicios.                                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                    | Límites de vías pesadas por proveedor.                                                                                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                    | Límites más restrictivos por proveedor.                                                                                                                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                    | Sustitución para hosts de mayor capacidad.                                                                                                                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                 | Retraso entre los inicios de las vías; evita avalanchas de creación en el daemon local de Docker.                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min)  | Tiempo de espera alternativo por vía; algunas vías en vivo/finales usan límites más estrictos.                                                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                    | Reintentos para fallos transitorios de proveedores en vivo.                                                                                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                  | Imprime el manifiesto de vías sin ejecutar Docker.                                                                                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000                | Intervalo de impresión del estado de las vías activas.                                                                                                                                                                                                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                   | Reutiliza `.artifacts/docker-tests/lane-timings.json` para ordenar primero las vías más largas; establézcalo en `0` para deshabilitarlo.                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                    | `skip` para ejecutar únicamente vías deterministas/locales, `only` para ejecutar únicamente vías de proveedores en vivo. Alias: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. El modo solo en vivo combina las vías en vivo principales y finales en un único grupo ordenado de mayor a menor duración para que los grupos de proveedores agrupen el trabajo de Claude/Codex/Gemini. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                  | Tiempo de espera para la configuración del backend de la CLI en Docker.                                                                                                                                                                                                                                                                                                       |

El patrón de las variables de entorno para los límites de recursos es `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (nombre del recurso en mayúsculas, con los caracteres no alfanuméricos sustituidos por `_`).

Otro comportamiento: el ejecutor realiza de forma predeterminada una comprobación previa de Docker, limpia los contenedores E2E obsoletos de OpenClaw, comparte las cachés de herramientas CLI del proveedor entre carriles compatibles y deja de programar nuevos carriles agrupados después del primer fallo, a menos que se establezca `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`. Si un carril supera el límite efectivo de peso/recursos en un host con poco paralelismo, aun así puede iniciarse desde un grupo vacío y ejecutarse por sí solo hasta que libere capacidad. Los registros por carril, `summary.json`, `failures.json` y los tiempos de las fases se escriben en `.artifacts/docker-tests/<run-id>/`; use `pnpm test:docker:timings <summary.json>` para inspeccionar los carriles lentos y `pnpm test:docker:rerun <run-id|summary.json|failures.json>` para imprimir comandos económicos de repetición dirigida.

### Carriles de Docker destacados

| Comando                                                                     | Verifica                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Contenedor E2E de código fuente respaldado por Chromium con CDP sin procesar + Gateway aislado; las instantáneas de roles de CDP de `browser doctor --deep` incluyen las URL de los enlaces, los elementos en los que se puede hacer clic promovidos por el cursor, las referencias de iframe y los metadatos de los marcos.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:docker:skill-install`                                            | Instala el archivo tar empaquetado en un ejecutor de Docker básico con `skills.install.allowUploadedArchives: false`, resuelve el slug de una habilidad actual mediante una búsqueda en vivo en ClawHub, la instala mediante `openclaw skills install` y verifica `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` y `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Pruebas en vivo específicas del backend de CLI; Gemini tiene alias equivalentes `:resume` y `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI en Docker: inicia sesión, comprueba `/api/models` y ejecuta un chat real mediante proxy a través de `/api/chat/completions`. Requiere una clave de modelo en vivo utilizable y descarga una imagen externa; no se espera que sea estable en CI como las suites de pruebas unitarias/E2E.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:docker:mcp-channels`                                             | Contenedor de Gateway con datos precargados y un contenedor cliente que inicia `openclaw mcp serve`: descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de archivos adjuntos, comportamiento de la cola de eventos en vivo, enrutamiento de envíos salientes y notificaciones de canales + permisos al estilo de Claude a través del puente stdio real (la aserción lee directamente las tramas MCP de stdio sin procesar).                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:upgrade-survivor`                                         | Instala el archivo tar empaquetado sobre un entorno de prueba antiguo y modificado de un usuario, ejecuta la actualización del paquete y el doctor no interactivo sin claves activas de proveedores/canales, inicia un Gateway de bucle invertido y comprueba que se conserven los agentes, la configuración de canales, las listas de permitidos de plugins, los archivos del espacio de trabajo/sesión, el estado obsoleto de dependencias de plugins heredados, el inicio y el estado de RPC.                                                                                                                                                                                                                                                            |
| `pnpm test:docker:published-upgrade-survivor`                               | Instala `openclaw@latest` de forma predeterminada, prepara archivos realistas de un usuario existente, configura mediante una receta integrada de `openclaw config set`, actualiza al archivo tar empaquetado, ejecuta el doctor no interactivo, escribe `.artifacts/upgrade-survivor/summary.json` y comprueba `/healthz`, `/readyz` y el estado de RPC. Sobrescriba con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, amplíe una matriz con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` o añada entornos de prueba de escenarios con `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` (incluye `configured-plugin-installs` y `stale-source-plugin-shadow`). Package Acceptance los expone como `published_upgrade_survivor_baseline(s)` / `_scenarios` y resuelve metatokens como `last-stable-4` o `all-since-2026.4.23`. |
| `pnpm test:docker:update-migration`                                         | Entorno de pruebas de supervivencia a una actualización publicada en el escenario `plugin-deps-cleanup`, que parte de `openclaw@2026.4.23` de forma predeterminada. El flujo de trabajo `Update Migration` lo amplía con `baselines=all-since-2026.4.23` para demostrar la limpieza de dependencias de plugins configurados fuera de Full Release CI.                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:plugins`                                                  | Prueba de humo de instalación/actualización para rutas locales, `file:`, paquetes del registro npm con dependencias elevadas, referencias móviles de git, entornos de prueba de ClawHub, actualizaciones del marketplace y habilitación/inspección del paquete de Claude.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Puerta local para PR

Para las comprobaciones locales de puerta/integración de PR, ejecute:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla de forma intermitente en un host con mucha carga, vuelva a ejecutarlo una vez antes de tratarlo como una regresión y, después, aísle el problema con `pnpm test <path/to/test>`. Para hosts con memoria limitada:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Herramientas de rendimiento de pruebas

- `pnpm test:perf:imports`: habilita los informes de duración y desglose de importaciones de Vitest, mientras sigue usando el enrutamiento de carriles con alcance limitado para destinos explícitos de archivos/directorios. `pnpm test:perf:imports:changed` limita el mismo análisis a los archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara el rendimiento de la ruta en modo de cambios enrutada con la ejecución nativa del proyecto raíz para la misma diferencia de git confirmada; `pnpm test:perf:changed:bench -- --worktree` compara el conjunto de cambios actual del árbol de trabajo sin confirmarlo primero.
- `pnpm test:perf:profile:main` escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` escribe perfiles de CPU y memoria dinámica para el ejecutor de pruebas unitarias (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta en serie cada configuración hoja de Vitest de la suite completa y escribe datos de duración agrupados, además de artefactos JSON y de registro por configuración. Los informes de la suite completa aíslan los archivos de forma predeterminada para que los grafos de módulos retenidos y las pausas del recolector de basura de archivos anteriores no se atribuyan a aserciones posteriores; use `-- --no-isolate` solo cuando se analice intencionadamente la acumulación en trabajadores compartidos. El agente de rendimiento de pruebas usa esto como referencia antes de intentar corregir pruebas lentas. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` compara informes agrupados después de un cambio centrado en el rendimiento.
- Las ejecuciones de fragmentos completas, de extensiones y con patrones de inclusión actualizan los datos locales de tiempos en `.artifacts/vitest-shard-timings.json`; las ejecuciones posteriores de configuraciones completas usan esos tiempos para equilibrar los fragmentos lentos y rápidos. Los fragmentos de CI con patrones de inclusión añaden el nombre del fragmento a la clave de tiempos, lo que mantiene visibles los tiempos de los fragmentos filtrados sin sustituir los datos de tiempos de configuraciones completas. Establezca `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.

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

Salida guardada: `pnpm test:startup:bench:smoke` escribe `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` escribe `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Recurso de prueba versionado: `test/fixtures/cli-startup-bench.json`, actualizado mediante `pnpm test:startup:bench:update` y comparado mediante `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Inicio del Gateway (scripts/bench-gateway-startup.ts)">

De forma predeterminada, usa el punto de entrada de la CLI compilada en `dist/entry.js`; ejecute primero `pnpm build`. Pase `--entry scripts/run-node.mjs` para medir en su lugar el ejecutor del código fuente y mantenga esos resultados separados de las referencias del punto de entrada compilado.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Identificadores de casos: `default`, `skipChannels` (se omite el inicio de canales), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 plugins de manifiesto), `fiftyStartupLazyPlugins` (50 plugins de manifiesto con carga diferida al inicio).

La salida incluye la primera salida del proceso, `/healthz`, `/readyz`, el tiempo del registro de escucha HTTP, el tiempo del registro de disponibilidad del Gateway, el tiempo de CPU, la proporción de núcleos de CPU, el RSS máximo, la memoria dinámica, las métricas de trazado del inicio, el retraso del bucle de eventos y las métricas detalladas de la tabla de consulta de plugins. El script establece `OPENCLAW_GATEWAY_STARTUP_TRACE=1` en el entorno del Gateway secundario.

`/healthz` indica actividad (el servidor HTTP puede responder). `/readyz` indica disponibilidad operativa (los procesos auxiliares de plugins al inicio, los canales y el trabajo posterior a la asociación crítico para la disponibilidad han finalizado). Los hooks de inicio se despachan de forma asíncrona y no forman parte de la garantía de disponibilidad. El tiempo del registro de disponibilidad es la marca de tiempo interna del Gateway, útil para la atribución del lado del proceso, pero no sustituye la comprobación externa de `/readyz`.

Use la salida JSON o `--output` al comparar cambios. Use `--cpu-prof-dir` solo después de que la salida de trazado señale importaciones, compilación o trabajo limitado por la CPU que los tiempos de las fases por sí solos no puedan explicar.

</Accordion>

<Accordion title="Reinicio del Gateway (scripts/bench-gateway-restart.ts)">

Solo macOS y Linux (usa SIGUSR1 para reinicios dentro del proceso; falla inmediatamente en Windows). Tiene el mismo punto de entrada compilado predeterminado y la misma sustitución mediante `--entry scripts/run-node.mjs` que el inicio del Gateway descrito anteriormente.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Identificadores de casos: `skipChannels`, `skipChannelsAcpxProbe` (sondeo de inicio de ACPX activado), `skipChannelsNoAcpxProbe` (sondeo desactivado), `default`, `fiftyPlugins`.

La salida incluye los siguientes `/healthz` y `/readyz`, el tiempo de inactividad, el tiempo de disponibilidad tras el reinicio, la CPU, el RSS, las métricas de trazado del inicio del proceso de sustitución y las métricas de trazado del reinicio para el tratamiento de señales, el vaciado del trabajo activo, las fases de cierre, el siguiente inicio, el tiempo de disponibilidad y las instantáneas de memoria. El script establece `OPENCLAW_GATEWAY_STARTUP_TRACE=1` y `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Use esta prueba de rendimiento cuando un cambio afecte a la señalización de reinicio, los controladores de cierre, el inicio después del reinicio, el cierre de procesos auxiliares, la transferencia de servicios o la disponibilidad después del reinicio. Comience con `skipChannels` para aislar la mecánica del Gateway del inicio de canales; use `default` o casos con muchos plugins solo después de que el caso específico explique la ruta de reinicio. Las métricas de trazado son indicios de atribución, no veredictos: evalúe un cambio de reinicio a partir de varias muestras, el intervalo del propietario correspondiente, el comportamiento de `/healthz`/`/readyz` y el contrato de reinicio visible para el usuario.

</Accordion>

## E2E de incorporación (Docker)

Opcional; solo se necesita para pruebas de humo de incorporación en contenedores. Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Controla el asistente interactivo mediante un seudoterminal, verifica los archivos de configuración, espacio de trabajo y sesión, luego inicia el Gateway y ejecuta `openclaw health`.

## Prueba de humo de importación de QR (Docker)

Garantiza que el asistente de entorno de ejecución de QR mantenido se cargue en los entornos de ejecución de Node compatibles con Docker (Node 24 de forma predeterminada, compatible con Node 22):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas en vivo](/es/help/testing-live)
- [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins)
