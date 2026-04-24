---
read_when:
    - Ejecutar o corregir pruebas
summary: Cómo ejecutar pruebas localmente (vitest) y cuándo usar los modos force/coverage
title: Pruebas
x-i18n:
    generated_at: "2026-04-24T09:01:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- Kit completo de pruebas (suites, live, Docker): [Pruebas](/es/help/testing)

- `pnpm test:force`: mata cualquier proceso residual de Gateway que esté reteniendo el puerto de control predeterminado, y luego ejecuta la suite completa de Vitest con un puerto de Gateway aislado para que las pruebas de servidor no colisionen con una instancia en ejecución. Úsalo cuando una ejecución previa de Gateway haya dejado ocupado el puerto 18789.
- `pnpm test:coverage`: ejecuta la suite unitaria con cobertura V8 (mediante `vitest.unit.config.ts`). Esta es una compuerta de cobertura unitaria de archivos cargados, no una cobertura de todo el repositorio sobre todos los archivos. Los umbrales son 70 % para líneas/funciones/instrucciones y 55 % para ramas. Como `coverage.all` es false, la compuerta mide los archivos cargados por la suite de cobertura unitaria en lugar de tratar cada archivo fuente de carril dividido como no cubierto.
- `pnpm test:coverage:changed`: ejecuta cobertura unitaria solo para archivos modificados desde `origin/main`.
- `pnpm test:changed`: expande las rutas git modificadas en carriles de Vitest con alcance cuando la diferencia solo toca archivos fuente/de prueba enrutable. Los cambios de configuración/setup siguen recurriendo a la ejecución nativa de proyectos raíz para que las ediciones de cableado vuelvan a ejecutarse ampliamente cuando sea necesario.
- `pnpm changed:lanes`: muestra los carriles de arquitectura activados por la diferencia contra `origin/main`.
- `pnpm check:changed`: ejecuta la compuerta inteligente de cambios para la diferencia contra `origin/main`. Ejecuta trabajo del núcleo con carriles de prueba del núcleo, trabajo de extensiones con carriles de prueba de extensiones, trabajo solo de pruebas con solo typecheck/pruebas de pruebas, amplía cambios del Plugin SDK público o de plugin-contract a una pasada de validación de extensiones, y mantiene los incrementos de versión solo de metadatos de versión en verificaciones dirigidas de versión/configuración/dependencias raíz.
- `pnpm test`: enruta objetivos explícitos de archivo/directorio mediante carriles de Vitest con alcance. Las ejecuciones sin objetivo usan grupos fijos de fragmentos y se expanden a configuraciones hoja para ejecución local en paralelo; el grupo de extensiones siempre se expande a las configuraciones fragmentadas por extensión en lugar de a un único proceso gigante de proyecto raíz.
- Las ejecuciones completas y fragmentadas de extensiones actualizan los datos locales de tiempos en `.artifacts/vitest-shard-timings.json`; ejecuciones posteriores usan esos tiempos para equilibrar fragmentos lentos y rápidos. Configura `OPENCLAW_TEST_PROJECTS_TIMINGS=0` para ignorar el artefacto local de tiempos.
- Algunos archivos de prueba de `plugin-sdk` y `commands` ahora se enrutan por carriles ligeros dedicados que conservan solo `test/setup.ts`, dejando los casos pesados de runtime en sus carriles existentes.
- Algunos archivos fuente auxiliares de `plugin-sdk` y `commands` también asignan `pnpm test:changed` a pruebas hermanas explícitas en esos carriles ligeros, de modo que pequeñas ediciones en helpers evitan volver a ejecutar las suites pesadas respaldadas por runtime.
- `auto-reply` ahora también se divide en tres configuraciones dedicadas (`core`, `top-level`, `reply`) para que el arnés de respuesta no domine las pruebas más ligeras de estado/token/helper de nivel superior.
- La configuración base de Vitest ahora usa por defecto `pool: "threads"` e `isolate: false`, con el runner compartido no aislado habilitado en todas las configuraciones del repositorio.
- `pnpm test:channels` ejecuta `vitest.channels.config.ts`.
- `pnpm test:extensions` y `pnpm test extensions` ejecutan todos los fragmentos de extensiones/plugins. Los plugins de canales pesados, el plugin de navegador y OpenAI se ejecutan como fragmentos dedicados; otros grupos de plugins siguen agrupados. Usa `pnpm test extensions/<id>` para un carril de un solo bundled plugin.
- `pnpm test:perf:imports`: habilita informes de duración de importación + desglose de importaciones de Vitest, mientras sigue usando enrutamiento por carriles con alcance para objetivos explícitos de archivo/directorio.
- `pnpm test:perf:imports:changed`: el mismo perfilado de importaciones, pero solo para archivos modificados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara mediante benchmark la ruta en modo cambios enrutado frente a la ejecución nativa de proyecto raíz para la misma diferencia git confirmada.
- `pnpm test:perf:changed:bench -- --worktree` compara mediante benchmark el conjunto actual de cambios del worktree sin confirmar primero.
- `pnpm test:perf:profile:main`: escribe un perfil de CPU para el hilo principal de Vitest (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: escribe perfiles de CPU + heap para el runner unitario (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: ejecuta serialmente cada configuración hoja de Vitest de la suite completa y escribe datos agrupados de duración junto con artefactos JSON/log por configuración. Test Performance Agent usa esto como línea base antes de intentar correcciones de pruebas lentas.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: compara informes agrupados después de un cambio centrado en rendimiento.
- Integración de Gateway: activación opcional mediante `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` o `pnpm test:gateway`.
- `pnpm test:e2e`: ejecuta pruebas smoke end-to-end de Gateway (multiinstancia WS/HTTP/emparejamiento de node). Usa por defecto `threads` + `isolate: false` con workers adaptativos en `vitest.e2e.config.ts`; ajústalo con `OPENCLAW_E2E_WORKERS=<n>` y configura `OPENCLAW_E2E_VERBOSE=1` para logs detallados.
- `pnpm test:live`: ejecuta pruebas live de proveedor (minimax/zai). Requiere claves de API y `LIVE=1` (o `*_LIVE_TEST=1` específico del proveedor) para dejar de omitirlas.
- `pnpm test:docker:all`: compila una vez la imagen compartida de pruebas live y la imagen Docker E2E, luego ejecuta los carriles smoke de Docker con `OPENCLAW_SKIP_DOCKER_BUILD=1` con simultaneidad 8 de forma predeterminada. Ajusta el grupo principal con `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` y el grupo final sensible al proveedor con `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>`; ambos usan 8 de forma predeterminada. El inicio de carriles se escalona 2 segundos de forma predeterminada para evitar tormentas locales de creación en el daemon de Docker; reemplázalo con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. El runner deja de programar nuevos carriles agrupados tras el primer fallo salvo que se configure `OPENCLAW_DOCKER_ALL_FAIL_FAST=0`, y cada carril tiene un tiempo límite de 120 minutos reemplazable con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Los logs por carril se escriben en `.artifacts/docker-tests/<run-id>/`.
- `pnpm test:docker:openwebui`: inicia OpenClaw + Open WebUI en Docker, inicia sesión a través de Open WebUI, comprueba `/api/models`, y luego ejecuta un chat proxy real mediante `/api/chat/completions`. Requiere una clave de modelo live utilizable (por ejemplo OpenAI en `~/.profile`), extrae una imagen externa de Open WebUI y no se espera que sea estable en CI como las suites normales unitarias/e2e.
- `pnpm test:docker:mcp-channels`: inicia un contenedor Gateway sembrado y un segundo contenedor cliente que lanza `openclaw mcp serve`, y luego verifica descubrimiento de conversaciones enrutadas, lecturas de transcripciones, metadatos de adjuntos, comportamiento de la cola de eventos live, enrutamiento de envíos salientes y notificaciones de canal + permisos estilo Claude sobre el puente stdio real. La aserción de notificación de Claude lee directamente los marcos MCP stdio sin procesar para que la prueba smoke refleje lo que el puente realmente emite.

## Compuerta local de PR

Para verificaciones locales de aterrizaje/compuerta de PR, ejecuta:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Si `pnpm test` falla de forma intermitente en un host cargado, vuelve a ejecutarlo una vez antes de tratarlo como una regresión, y luego aísla con `pnpm test <path/to/test>`. Para hosts con memoria limitada, usa:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark de latencia de modelo (claves locales)

Script: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Uso:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Variables de entorno opcionales: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Prompt predeterminado: “Reply with a single word: ok. No punctuation or extra text.”

Última ejecución (2025-12-31, 20 ejecuciones):

- minimax mediana 1279ms (mín 1114, máx 2431)
- opus mediana 2454ms (mín 1224, máx 3170)

## Benchmark de inicio de la CLI

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
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Preajustes:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: ambos preajustes

La salida incluye `sampleCount`, media, p50, p95, mínimo/máximo, distribución de códigos de salida/señales y resúmenes de RSS máximo para cada comando. `--cpu-prof-dir` / `--heap-prof-dir` opcionales escriben perfiles V8 por ejecución para que la captura de tiempos y perfiles use el mismo arnés.

Convenciones de salida guardada:

- `pnpm test:startup:bench:smoke` escribe el artefacto smoke dirigido en `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` escribe el artefacto de suite completa en `.artifacts/cli-startup-bench-all.json` usando `runs=5` y `warmup=1`
- `pnpm test:startup:bench:update` actualiza el fixture base incluido en `test/fixtures/cli-startup-bench.json` usando `runs=5` y `warmup=1`

Fixture incluido:

- `test/fixtures/cli-startup-bench.json`
- Actualízalo con `pnpm test:startup:bench:update`
- Compara los resultados actuales con el fixture mediante `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker es opcional; esto solo se necesita para pruebas smoke de onboarding en contenedores.

Flujo completo de arranque en frío en un contenedor Linux limpio:

```bash
scripts/e2e/onboard-docker.sh
```

Este script maneja el asistente interactivo mediante una pseudo-tty, verifica archivos de configuración/workspace/sesión, luego inicia el gateway y ejecuta `openclaw health`.

## Prueba smoke de importación de QR (Docker)

Garantiza que el helper de runtime de QR mantenido cargue bajo los runtimes de Node en Docker compatibles (Node 24 predeterminado, Node 22 compatible):

```bash
pnpm test:docker:qr
```

## Relacionado

- [Pruebas](/es/help/testing)
- [Pruebas live](/es/help/testing-live)
