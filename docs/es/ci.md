---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o repetición de una validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, compuertas de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-06-30T13:45:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 885202dd0f52b237e93a520999ac98ef3ad0fc1f8a03ccaceae9d38a2a4aca3b
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. Los pushes canónicos a `main` pasan primero por una ventana de admisión de 90 segundos en runners alojados. El grupo de concurrencia `CI` existente cancela esa ejecución en espera cuando llega un commit más reciente, por lo que las fusiones secuenciales no registran cada una una matriz completa de Blacksmith. Las pull requests y las ejecuciones manuales omiten la espera. Luego, el trabajo `preflight` clasifica el diff y desactiva las lanes costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y despliegan el grafo completo para candidatos de lanzamiento y validación amplia. Las lanes de Android siguen siendo opcionales mediante `include_android`. La cobertura de plugins solo para lanzamiento vive en el workflow separado [`Plugin Prerelease`](#plugin-prerelease) y solo se ejecuta desde [`Full Release Validation`](#full-release-validation) o mediante una ejecución manual explícita.

## Resumen del pipeline

| Trabajo                           | Propósito                                                                                                  | Cuándo se ejecuta                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `preflight`                       | Detectar cambios solo de docs, alcances cambiados, extensiones cambiadas y construir el manifiesto de CI   | Siempre en pushes y PRs que no sean borrador           |
| `runner-admission`                | Antirrebote alojado de 90 segundos para pushes canónicos a `main` antes de registrar trabajo de Blacksmith | Cada ejecución de CI; espera solo en pushes canónicos a `main` |
| `security-fast`                   | Detección de claves privadas, auditoría de workflows cambiados mediante `zizmor` y auditoría de lockfile de producción | Siempre en pushes y PRs que no sean borrador           |
| `check-dependencies`              | Pasada de Knip solo para dependencias de producción más la guarda de lista permitida de archivos no usados | Cambios relevantes para Node                           |
| `build-artifacts`                 | Construir `dist/`, Control UI, smokes de CLI construida, comprobaciones de artefactos construidos embebidos y artefactos reutilizables | Cambios relevantes para Node                           |
| `checks-fast-core`                | Lanes rápidas de corrección en Linux, como bundled, protocol, QA Smoke CI y comprobaciones de enrutamiento de CI | Cambios relevantes para Node                           |
| `checks-fast-contracts-plugins-*` | Dos comprobaciones fragmentadas de contratos de Plugin                                                     | Cambios relevantes para Node                           |
| `checks-fast-contracts-channels-*` | Dos comprobaciones fragmentadas de contratos de canal                                                     | Cambios relevantes para Node                           |
| `checks-node-core-*`              | Fragmentos de pruebas de Node del núcleo, excluidas las lanes de canal, bundled, contrato y extensión      | Cambios relevantes para Node                           |
| `check-*`                         | Equivalente fragmentado de la puerta local principal: tipos de producción, lint, guardas, tipos de prueba y smoke estricto | Cambios relevantes para Node                           |
| `check-additional-*`              | Arquitectura, drift fragmentado de límites/prompts, guardas de extensión, límite de paquetes y topología de runtime | Cambios relevantes para Node                           |
| `checks-node-compat-node22`       | Build de compatibilidad con Node 22 y lane smoke                                                           | Ejecución manual de CI para lanzamientos               |
| `check-docs`                      | Formato de docs, lint y comprobaciones de enlaces rotos                                                    | Docs cambiadas                                         |
| `skills-python`                   | Ruff + pytest para Skills respaldadas por Python                                                           | Cambios relevantes para Skills de Python               |
| `checks-windows`                  | Pruebas específicas de Windows para procesos/rutas más regresiones compartidas de especificadores de importación de runtime | Cambios relevantes para Windows                        |
| `macos-node`                      | Lane de pruebas TypeScript en macOS usando los artefactos construidos compartidos                          | Cambios relevantes para macOS                          |
| `macos-swift`                     | Lint, build y pruebas de Swift para la app de macOS                                                        | Cambios relevantes para macOS                          |
| `ios-build`                       | Generación del proyecto Xcode más build de la app iOS en simulador                                        | App iOS, kit de app compartido o cambios de Swabble    |
| `android`                         | Pruebas unitarias de Android para ambos flavors más un build de APK de depuración                          | Cambios relevantes para Android                        |
| `test-performance-agent`          | Optimización diaria de pruebas lentas de Codex tras actividad confiable                                   | Éxito de CI principal o ejecución manual               |
| `openclaw-performance`            | Informes diarios/bajo demanda de rendimiento del runtime de Kova con lanes de proveedor simulado, perfil profundo y GPT 5.5 en vivo | Ejecución programada y manual                          |

## Orden de fail-fast

1. `runner-admission` espera solo para pushes canónicos a `main`; un push más reciente cancela la ejecución antes del registro de Blacksmith.
2. `preflight` decide qué lanes existen en absoluto. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` y `skills-python` fallan rápido sin esperar a los trabajos más pesados de artefactos y matriz de plataformas.
4. `build-artifacts` se solapa con las lanes rápidas de Linux para que los consumidores posteriores puedan empezar en cuanto el build compartido esté listo.
5. Las lanes más pesadas de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` y `android`.

GitHub puede marcar trabajos sustituidos como `cancelled` cuando llega un push más reciente a la misma PR o ref de `main`. Trátalo como ruido de CI salvo que la ejecución más reciente para la misma ref también esté fallando. Los trabajos de matriz usan `fail-fast: false`, y `build-artifacts` informa fallos embebidos de channel, core-support-boundary y gateway-watch directamente en lugar de poner en cola trabajos verificadores pequeños. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones más nuevas de main. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

Usa `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` para resumir el tiempo total, el tiempo en cola, los trabajos más lentos, los fallos y la barrera de fanout `pnpm-store-warmup` desde GitHub Actions. CI también sube el mismo resumen de ejecución como artefacto `ci-timings-summary`. Para tiempos de build, revisa el paso `Build dist` del trabajo `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e incluye `ui:build`; el trabajo también sube el artefacto `startup-memory`.

Para ejecuciones de pull request, el trabajo terminal timing-summary ejecuta el helper desde la revisión base confiable antes de pasar `GH_TOKEN` a `gh run view`. Eso mantiene la consulta con token fuera del código controlado por la rama, mientras sigue resumiendo la ejecución de CI actual de la pull request.

## Contexto y evidencia de PR

Las PRs de colaboradores externos ejecutan una puerta de contexto y evidencia de PR desde `.github/workflows/real-behavior-proof.yml`. El workflow hace checkout del commit base confiable y evalúa solo el cuerpo de la PR; no ejecuta código de la rama del colaborador.

La puerta se aplica a autores de PR que no son propietarios, miembros, colaboradores ni bots del repositorio. Pasa cuando el cuerpo de la PR contiene secciones redactadas `What Problem This Solves` y `Evidence`. La evidencia puede ser una prueba enfocada, resultado de CI, captura de pantalla, grabación, salida de terminal, observación en vivo, log redactado o enlace a artefacto. El cuerpo aporta intención y validación útil; los revisores inspeccionan el código, las pruebas y CI para evaluar la corrección.

Cuando la comprobación falla, actualiza el cuerpo de la PR en lugar de subir otro commit de código.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. La ejecución manual omite la detección changed-scope y hace que el manifiesto preflight actúe como si todas las áreas con alcance hubieran cambiado.

- **Ediciones de workflows de CI** validan el grafo de CI de Node más el lint de workflows, pero no fuerzan por sí solas builds nativos de Windows, iOS, Android o macOS; esas lanes de plataforma siguen limitadas a cambios de código fuente de plataforma.
- **Workflow Sanity** ejecuta `actionlint`, `zizmor` sobre todos los archivos YAML de workflows, la guarda de interpolación de acciones compuestas y la guarda de marcadores de conflicto. El trabajo `security-fast` con alcance de PR también ejecuta `zizmor` sobre archivos de workflow cambiados para que los hallazgos de seguridad de workflows fallen pronto en el grafo principal de CI.
- **Docs en pushes a `main`** se comprueban mediante el workflow independiente `Docs` con el mismo espejo de docs de ClawHub usado por CI, por lo que los pushes mixtos de código+docs no ponen también en cola el fragmento `check-docs` de CI. Las pull requests y la CI manual siguen ejecutando `check-docs` desde CI cuando las docs cambiaron.
- **TUI PTY** se ejecuta en el fragmento Linux Node `checks-node-core-runtime-tui-pty` para cambios de TUI. El fragmento ejecuta `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, por lo que cubre tanto la lane determinista de fixture `TuiBackend` como el smoke más lento `tui --local` que simula solo el endpoint externo del modelo.
- **Ediciones solo de enrutamiento de CI, ediciones seleccionadas y baratas de fixtures de pruebas del núcleo, y ediciones estrechas de helpers/enrutamiento de pruebas de contratos de plugins** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una única tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canal, fragmentos completos del núcleo, fragmentos de bundled-plugin y matrices de guardas adicionales cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Comprobaciones de Node en Windows** se limitan a wrappers específicos de Windows para procesos/rutas, helpers de runners npm/pnpm/UI, configuración del gestor de paquetes y las superficies de workflows de CI que ejecutan esa lane; los cambios no relacionados de código fuente, Plugin, install-smoke y solo de pruebas permanecen en las lanes de Linux Node.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo se mantenga pequeño sin reservar runners en exceso: los contratos de Plugin y los contratos de canales se ejecutan cada uno como dos shards ponderados respaldados por Blacksmith con el respaldo estándar del runner de GitHub, los carriles rápidos/de soporte de unidades core se ejecutan por separado, la infraestructura de runtime core se divide entre estado, proceso/configuración, compartido y tres shards de dominio cron, la respuesta automática se ejecuta como workers equilibrados (con el subárbol de respuestas dividido en shards de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic de Gateway/servidor se dividen entre carriles de chat/auth/model/http-plugin/runtime/startup en lugar de esperar artefactos construidos. Luego, la CI normal empaqueta solo shards aislados de patrones include de infraestructura en paquetes deterministas de como máximo 64 archivos de prueba, lo que reduce la matriz de Node sin fusionar suites no aisladas de command/cron, agents-core con estado, o Gateway/servidor; las suites fijas pesadas permanecen en 8 vCPU, mientras que los carriles agrupados y de menor peso usan 4 vCPU. Las pull requests en el repositorio canónico usan un plan compacto de admisión adicional: los mismos grupos por configuración se ejecutan en subprocesos aislados dentro del plan actual de 34 trabajos Linux Node, de modo que una sola PR no registra la matriz completa de Node de más de 70 trabajos. Los pushes a `main`, los dispatches manuales y las puertas de release conservan la matriz completa. Las pruebas amplias de navegador, QA, medios y plugins misceláneos usan sus configuraciones Vitest dedicadas en lugar del catch-all compartido de plugins. Los shards de patrones include registran entradas de tiempos usando el nombre del shard de CI, por lo que `.artifacts/vitest-shard-timings.json` puede distinguir una configuración completa de un shard filtrado. `check-additional-*` mantiene juntas las tareas de compilación/canary de límites de paquete y separa la arquitectura de topología de runtime de la cobertura de vigilancia de Gateway; la lista de guardas de límites se distribuye en un shard pesado de prompts y un shard combinado para las franjas de guardas restantes, cada uno ejecutando guardas independientes seleccionados de forma concurrente e imprimiendo tiempos por comprobación. La costosa comprobación de deriva de snapshots de prompts del camino feliz de Codex se ejecuta como su propio trabajo adicional solo para CI manual y para cambios que afectan prompts, de modo que los cambios normales no relacionados de Node no esperan detrás de la generación fría de snapshots de prompts y los shards de límites permanecen equilibrados mientras la deriva de prompts sigue anclada a la PR que la causó; la misma bandera omite la generación Vitest de snapshots de prompts dentro del shard construido de artefactos de límites de soporte core. La vigilancia de Gateway, las pruebas de canales y el shard de límites de soporte core se ejecutan de forma concurrente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén construidos.

Una vez admitida, la CI canónica de Linux permite hasta 24 trabajos concurrentes de pruebas Node y
12 para los carriles rápidos/de comprobación más pequeños; Windows y Android permanecen en dos porque
esos pools de runners son más estrechos.

El plan compacto de PR emite 18 trabajos de Node para la suite actual: los grupos
de configuración completa se agrupan en subprocesos aislados con un timeout de lote de 120 minutos,
mientras que los grupos de patrones include comparten el mismo presupuesto acotado de trabajos.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego construye el APK de depuración Play. El flavor de terceros no tiene un source set ni manifiesto separado; su carril de pruebas unitarias aún compila el flavor con las banderas BuildConfig de SMS/registro de llamadas, mientras evita un trabajo duplicado de empaquetado del APK de depuración en cada push relevante para Android.

El shard `check-dependencies` ejecuta `pnpm deadcode:dependencies` (un pase de Knip solo de dependencias de producción fijado a la versión más reciente de Knip, con la edad mínima de release de pnpm deshabilitada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos sin usar en producción de Knip con `scripts/deadcode-unused-files.allowlist.mjs`. El guarda de archivos sin usar falla cuando una PR agrega un nuevo archivo sin usar no revisado o deja una entrada obsoleta en la allowlist, mientras preserva superficies intencionales de Plugin dinámico, generadas, de build, live-test y puente de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado de destino desde la actividad del repositorio OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código de pull requests no confiables. El workflow crea un token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY`, y luego despacha payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El workflow tiene cuatro carriles:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

El carril `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves para comentarios o revisiones cuando están presentes. Evita intencionalmente reenviar el cuerpo completo del webhook. El workflow receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente ClawSweeper recibe el destino de Discord en su prompt y debería publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Aperturas rutinarias, ediciones, ruido de bots, ruido de webhooks duplicados y tráfico normal de revisiones deberían resultar en `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, textos de revisión, nombres de ramas y mensajes de commit de GitHub como datos no confiables en todo este camino. Son entrada para resumen y triaje, no instrucciones para el workflow ni para el runtime del agente.

## Dispatches manuales

Los dispatches manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan todos los carriles con scope que no son Android: shards Linux Node, shards de plugins agrupados, shards de contratos de Plugin y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones smoke de artefactos construidos, comprobaciones de documentación, Skills de Python, Windows, macOS, build de iOS y la i18n de Control UI. Los dispatches manuales independientes de CI ejecutan Android solo con `include_android=true`; el paraguas completo de release habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prerelease de Plugin, el shard exclusivo de release `agentic-plugins`, el barrido completo por lotes de extensiones y los carriles Docker de prerelease de Plugin se excluyen de CI. La suite Docker de prerelease se ejecuta solo cuando `Full Release Validation` despacha el workflow separado `Plugin Prerelease` con la puerta de validación de release habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidato a release no sea cancelada por otro push o ejecución de PR en la misma ref. La entrada opcional `target_ref` permite que un llamador confiable ejecute ese grafo contra una rama, etiqueta o SHA de commit completo mientras usa el archivo de workflow desde la ref de dispatch seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Trabajos                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch manual de CI y respaldos de repositorios no canónicos, escaneos de calidad CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows de documentación fuera de CI, y preflight de install-smoke para que la matriz Blacksmith pueda encolarse antes                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards de extensiones de menor peso, `checks-fast-core`, shards de contratos de Plugin/canales, la mayoría de shards agrupados/de menor peso de Linux Node, `check-guards`, `check-prod-types`, `check-test-types`, shards `check-additional-*` seleccionados y `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites pesadas retenidas de Linux Node, shards `check-additional-*` pesados de límites/extensiones, y `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); builds Docker de install-smoke (el tiempo de cola de 32 vCPU costó más de lo que ahorró)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` en `openclaw/openclaw`; los forks recurren a `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` y `ios-build` en `openclaw/openclaw`; los forks recurren a `macos-26`                                                                                                                                                                                                  |

## Presupuesto de registro de runners

El bucket actual de registros de runners de GitHub de OpenClaw informa 10.000 registros de runners
self-hosted por 5 minutos en `ghx api rate_limit`. Vuelve a comprobar
`actions_runner_registration` antes de cada pase de ajuste porque GitHub puede cambiar
este bucket. El límite es compartido por todos los registros de runners Blacksmith en la
organización `openclaw`, por lo que agregar otra instalación de Blacksmith no agrega
un bucket nuevo.

Trata las etiquetas Blacksmith como el recurso escaso para el control de ráfagas. Los trabajos que
solo enrutan, notifican, resumen, seleccionan shards o ejecutan escaneos cortos de CodeQL deberían
permanecer en runners alojados por GitHub salvo que tengan necesidades específicas de Blacksmith
medidas. Cualquier matriz Blacksmith nueva, `max-parallel` más grande o workflow de alta frecuencia
debe mostrar su conteo de registros en el peor caso y mantener el objetivo a nivel de organización
por debajo de aproximadamente el 60% del bucket en vivo. Con el bucket actual de 10.000 registros,
eso significa un objetivo operativo de 6.000 registros, dejando margen para
repositorios concurrentes, reintentos y superposición de ráfagas.

La CI del repositorio canónico mantiene Blacksmith como la ruta de runner predeterminada para ejecuciones normales de push y pull-request. `workflow_dispatch` y las ejecuciones de repositorios no canónicos usan runners alojados por GitHub, pero las ejecuciones canónicas normales no sondean actualmente la salud de la cola de Blacksmith ni recurren automáticamente a etiquetas alojadas por GitHub cuando Blacksmith no está disponible.

## Equivalentes locales

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1 node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/smoke checks matter
pnpm ios:build                                # generate and build the iOS app project
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm test:startup:memory
pnpm test:extensions:memory -- --json .artifacts/openclaw-performance/source/mock-provider/extension-memory.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Rendimiento de OpenClaw

`OpenClaw Performance` es el flujo de trabajo de rendimiento del producto/runtime. Se ejecuta a diario en `main` y puede lanzarse manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

El lanzamiento manual normalmente evalúa el rendimiento de la referencia del flujo de trabajo. Define `target_ref` para evaluar una etiqueta de versión o otra rama con la implementación actual del flujo de trabajo. Las rutas de los informes publicados y los punteros más recientes se indexan por la referencia probada, y cada `index.md` registra la referencia/SHA probada, la referencia/SHA del flujo de trabajo, la referencia de Kova, el perfil, el modo de autenticación del carril, el modelo, el recuento de repeticiones y los filtros de escenarios.

El flujo de trabajo instala OCM desde una versión fijada y Kova desde `openclaw/Kova` en la entrada `kova_ref` fijada, y luego ejecuta tres carriles:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfiles de CPU/heap/traza para puntos críticos de arranque, Gateway y turnos de agente.
- `live-openai-candidate`: un turno de agente real de OpenAI `openai/gpt-5.5`, omitido cuando `OPENAI_API_KEY` no está disponible.

El carril mock-provider también ejecuta sondas de código fuente nativas de OpenClaw después del pase de Kova: tiempo de arranque y memoria del Gateway en casos de arranque predeterminado, con hook y con 50 Plugins; RSS de importación de Plugins incluidos, bucles de saludo repetidos de `channel-chat-baseline` con OpenAI simulado, comandos de arranque de CLI contra el Gateway iniciado y la sonda de rendimiento smoke del estado SQLite. Cuando el informe de origen mock-provider publicado anteriormente está disponible para la referencia probada, el resumen de origen compara los valores actuales de RSS y heap con esa línea base y marca los aumentos grandes de RSS como `watch`. El resumen Markdown de la sonda de origen vive en `source/index.md` dentro del paquete de informe, con el JSON sin procesar al lado.

Cada carril sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondas de origen en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la referencia probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación completa de la versión

`Full Release Validation` es el flujo de trabajo manual paraguas para "ejecutarlo todo antes de la versión". Acepta una rama, etiqueta o SHA de commit completo, lanza el flujo de trabajo manual `CI` con ese objetivo, lanza `Plugin Prerelease` para pruebas solo de versión de Plugins/paquetes/estáticas/Docker, y lanza `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, renderización de la tarjeta de puntuación de madurez desde evidencia de perfiles de QA, paridad de QA Lab, Matrix y carriles de Telegram. Los perfiles estable y completo siempre incluyen cobertura exhaustiva live/E2E y soak de ruta de versión Docker; el perfil beta puede habilitarla con `run_release_soak=true`. El E2E canónico de paquete Telegram se ejecuta dentro de Package Acceptance, por lo que un candidato completo no inicia un sondeador live duplicado. Después de publicar, pasa `release_package_spec` para reutilizar el paquete npm enviado en las comprobaciones de versión, Package Acceptance, Docker, sistemas operativos cruzados y Telegram sin recompilar. Usa `npm_telegram_package_spec` solo para una nueva ejecución enfocada de Telegram con paquete publicado. El carril de paquete live del Plugin Codex usa el mismo estado seleccionado de forma predeterminada: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mientras que las ejecuciones por SHA/artefacto empaquetan `extensions/codex` desde la referencia seleccionada. Define `codex_plugin_spec` explícitamente para fuentes de Plugin personalizadas, como especificaciones `npm:`, `npm-pack:` o `git:`.

Consulta [validación completa de la versión](/es/reference/full-release-validation) para la matriz de etapas, los nombres exactos de trabajos del flujo de trabajo, las diferencias entre perfiles, los artefactos y los identificadores de nuevas ejecuciones enfocadas.

`OpenClaw Release Publish` es el flujo de trabajo manual mutante de publicación de versiones. Lánzalo desde `release/YYYY.M.PATCH` o `main` después de que exista la etiqueta de versión y después de que la comprobación previa npm de OpenClaw haya terminado correctamente. Verifica `pnpm plugins:sync:check`, lanza `Plugin NPM Release` para todos los paquetes de Plugin publicables, lanza `Plugin ClawHub Release` para el mismo SHA de versión, y solo entonces lanza `OpenClaw NPM Release` con el `preflight_run_id` guardado. La publicación estable también requiere un `windows_node_tag` exacto; el flujo de trabajo verifica la versión fuente de Windows y compara sus instaladores x64/ARM64 con la entrada `windows_node_installer_digests` aprobada por el candidato antes de cualquier publicación hija, y luego promueve y verifica esos mismos hashes de instalador fijados más el contrato exacto de recurso complementario y suma de comprobación antes de publicar el borrador de versión de GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Para prueba de commit fijado en una rama que avanza rápido, usa el asistente en lugar de `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las referencias de lanzamiento de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA de commit sin procesar. El asistente empuja una rama temporal `release-ci/<sha>-...` en el SHA objetivo, lanza `Full Release Validation` desde esa referencia fijada, verifica que cada `headSha` de flujo de trabajo hijo coincida con el objetivo y elimina la rama temporal cuando finaliza la ejecución. El verificador paraguas también falla si algún flujo de trabajo hijo se ejecutó en un SHA diferente.

`release_profile` controla la amplitud live/proveedor que se pasa a las comprobaciones de versión. Los flujos de trabajo manuales de versión usan `stable` de forma predeterminada; usa `full` solo cuando quieras intencionadamente la matriz amplia consultiva de proveedores/medios. Las comprobaciones de versión estable y completa siempre ejecutan el soak exhaustivo live/E2E y Docker de ruta de versión; el perfil beta puede habilitarlo con `run_release_soak=true`.

- `minimum` conserva los carriles más rápidos críticos para la versión de OpenAI/core.
- `stable` añade el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedores/medios.

El paraguas registra los ids de ejecución hijos lanzados, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y añade tablas de trabajos más lentos para cada ejecución hija. Si un flujo de trabajo hijo se vuelve a ejecutar y pasa a verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado paraguas y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de versión, `ci` solo para el hijo de CI completo normal, `plugin-prerelease` solo para el hijo de preversión de Plugins, `release-checks` para cada hijo de versión, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la nueva ejecución de una caja de versión fallida después de una corrección enfocada. Para un carril de sistema operativo cruzado fallido, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos largos de sistemas operativos cruzados emiten líneas de Heartbeat y los resúmenes de packaged-upgrade incluyen tiempos por fase. Los carriles de comprobación de versión de QA son consultivos, excepto la puerta estándar de cobertura de herramientas de runtime, que bloquea cuando las herramientas dinámicas requeridas de OpenClaw se desvían o desaparecen del resumen de nivel estándar.

`OpenClaw Release Checks` usa la referencia confiable del flujo de trabajo para resolver una vez la referencia seleccionada en un tarball `release-package-under-test`, y luego pasa ese artefacto a las comprobaciones entre sistemas operativos y Package Acceptance, además del flujo de trabajo Docker live/E2E de ruta de versión cuando se ejecuta la cobertura soak. Eso mantiene los bytes del paquete consistentes entre cajas de versión y evita reempaquetar el mismo candidato en varios trabajos hijos. Para el carril live de Plugin npm de Codex, las comprobaciones de versión pasan una especificación de Plugin publicado coincidente derivada de `release_package_spec`, pasan el `codex_plugin_spec` suministrado por el operador, o dejan la entrada en blanco para que el script Docker empaquete el Plugin Codex del checkout seleccionado.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all` sustituyen al paraguas anterior. El monitor padre cancela cualquier flujo de trabajo hijo que ya haya lanzado cuando se cancela el padre, por lo que la validación de main más reciente no queda detrás de una ejecución obsoleta de comprobación de versión de dos horas. La validación de ramas/etiquetas de versión y los grupos de nueva ejecución enfocada mantienen `cancel-in-progress: false`.

## Fragmentos live y E2E

El hijo live/E2E de versión conserva una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como fragmentos con nombre mediante `scripts/test-live-shard.mjs` en lugar de un trabajo serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- trabajos `native-live-src-gateway-profiles` filtrados por proveedor
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- fragmentos separados de medios de audio/video y fragmentos de música filtrados por proveedor

Esto mantiene la misma cobertura de archivos y facilita volver a ejecutar y diagnosticar fallos lentos de proveedores live. Los nombres de fragmento agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para nuevas ejecuciones manuales de una sola vez.

Los fragmentos nativos live de medios se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners normales de Blacksmith: los trabajos de contenedor no son el lugar adecuado para lanzar pruebas Docker anidadas.

Los shards de modelo/backend en vivo respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por cada commit seleccionado. El flujo de trabajo de release en vivo compila y publica esa imagen una vez; luego los shards de modelo en vivo de Docker, Gateway fragmentado por proveedor, backend de CLI, enlace ACP y arnés de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards de Docker de Gateway llevan límites explícitos de `timeout` a nivel de script por debajo del tiempo de espera del job del flujo de trabajo, de modo que un contenedor bloqueado o una ruta de limpieza falle rápido en lugar de consumir todo el presupuesto de verificación de release. Si esos shards reconstruyen de forma independiente el destino Docker completo del código fuente, la ejecución de release está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de paquetes

Usa `Package Acceptance` cuando la pregunta sea "¿funciona este paquete instalable de OpenClaw como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo arnés Docker E2E que los usuarios ejercitan después de instalar o actualizar.

### Jobs

1. `resolve_package` extrae `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime el origen, la ref del flujo de trabajo, la ref del paquete, la versión, el SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con digest del paquete cuando es necesario y ejecuta las lanes Docker seleccionadas contra ese paquete en lugar de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego distribuye esas lanes como jobs Docker dirigidos en paralelo con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; una ejecución independiente de Telegram todavía puede instalar una especificación npm publicada.
4. `summary` hace fallar el flujo de trabajo si falló la resolución del paquete, la aceptación Docker o la lane opcional de Telegram.

### Orígenes de candidatos

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de release de OpenClaw, como `openclaw@2026.4.27-beta.2`. Usa esto para la aceptación de versiones preliminares/estables publicadas.
- `source=ref` empaqueta una rama, etiqueta o SHA de commit completo de confianza de `package_ref`. El resolvedor recupera ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o desde una etiqueta de release, instala dependencias en un worktree desconectado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS público; `package_sha256` es obligatorio. Esta ruta rechaza credenciales en la URL, puertos HTTPS no predeterminados, nombres de host o IP resueltas privadas/internas/de uso especial, y redirecciones fuera de la misma política de seguridad pública.
- `source=trusted-url` descarga un `.tgz` HTTPS desde una política de origen confiable con nombre en `.github/package-trusted-sources.json`; `package_sha256` y `trusted_source_id` son obligatorios. Usa esto solo para espejos empresariales propiedad de mantenedores o repositorios privados de paquetes que necesiten hosts, puertos, prefijos de ruta, hosts de redirección o resolución de red privada configurados. Si la política declara autenticación bearer, el flujo de trabajo usa el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; las credenciales incrustadas en la URL siguen siendo rechazadas.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código confiable del flujo de trabajo/arnés que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de prueba actual valide commits de origen confiables más antiguos sin ejecutar lógica de flujo de trabajo antigua.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de release de Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad en vivo de ClawHub. La lane opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, y la ruta de especificación npm publicada se conserva para ejecuciones independientes.

Para la política dedicada de pruebas de actualización y plugins, incluidos comandos locales,
lanes Docker, entradas de Package Acceptance, valores predeterminados de release y triaje de fallos,
consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las verificaciones de release llaman a Package Acceptance con `source=artifact`, el artefacto de paquete de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` y `telegram_mode=mock-openai`. Esto mantiene la migración de paquetes, la actualización, la instalación de Skills en ClawHub en vivo, la limpieza de dependencias de plugins obsoletas, la reparación de instalación de plugins configurados, el plugin sin conexión, la actualización de plugins y la prueba de Telegram sobre el mismo tarball de paquete resuelto. Configura `release_package_spec` en Full Release Validation u OpenClaw Release Checks después de publicar una beta para ejecutar la misma matriz contra el paquete npm enviado sin reconstruir; configura `package_acceptance_package_spec` solo cuando Package Acceptance necesite un paquete distinto al del resto de la validación de release. Las verificaciones de release entre sistemas operativos siguen cubriendo el onboarding específico del SO, el instalador y el comportamiento de plataforma; la validación de producto de paquete/actualización debería empezar con Package Acceptance. La lane Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución en la ruta de release bloqueante. En Package Acceptance, el tarball `package-under-test` resuelto siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de respaldo, con valor predeterminado `openclaw@latest`; los comandos de reejecución de lanes fallidas conservan esa línea base. Full Release Validation con `run_release_soak=true` o `release_profile=full` configura `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para ampliar la cobertura a las cuatro releases npm estables más recientes, más releases fijadas de límite de compatibilidad de plugins y fixtures con forma de incidencias para configuración de Feishu, archivos bootstrap/persona preservados, instalaciones configuradas de plugins de OpenClaw, rutas de logs con tilde y raíces obsoletas de dependencias de plugins heredados. Las selecciones de superviviente de actualización publicada con múltiples líneas base se fragmentan por línea base en jobs separados dirigidos de runner Docker. El flujo de trabajo separado `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es una limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de la CI de Full Release. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquete con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conservar una única lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o configurar `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. La lane publicada configura la línea base con una receta integrada de comando `openclaw config set`, registra los pasos de la receta en `summary.json` y sondea `/healthz`, `/readyz`, además del estado RPC después de iniciar Gateway. Las lanes frescas de paquete e instalador en Windows también verifican que un paquete instalado pueda importar una anulación de control de navegador desde una ruta absoluta sin procesar de Windows. El smoke de turno de agente OpenAI entre sistemas operativos usa por defecto `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está configurado; de lo contrario, `openai/gpt-5.5`, de modo que la prueba de instalación y Gateway permanezca en un modelo de prueba GPT-5 y evite valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas conocidas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa flag;
- `update-channel-switch` puede podar `patchedDependencies` de pnpm faltantes del fixture git falso derivado del tarball y puede registrar la falta de `update.channel` persistido;
- los smokes de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar que falte la persistencia del registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración mientras sigue exigiendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir por archivos de sello de metadatos de compilación local que ya se enviaron. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

### Ejemplos

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.PATCH \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Validate a tarball from a named trusted private mirror policy.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=trusted-url \
  -f trusted_source_id=enterprise-artifactory \
  -f package_url=https://packages.example.internal:8443/artifactory/openclaw/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Al depurar una ejecución fallida de aceptación de paquetes, empieza por el resumen de `resolve_package` para confirmar el origen del paquete, la versión y el SHA-256. Luego inspecciona la ejecución hija `docker_acceptance` y sus artefactos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tiempos de fases y comandos de reejecución. Prefiere volver a ejecutar el perfil de paquete fallido o las lanes Docker exactas en lugar de volver a ejecutar toda la validación de release.

## Smoke de instalación

El flujo de trabajo separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies de Docker/paquetes, cambios de paquete/manifiesto de plugins incluidos, o superficies del core de plugins/canales/gateway/Plugin SDK que ejercitan los trabajos de smoke de Docker. Los cambios solo de fuente en plugins incluidos, ediciones solo de pruebas y ediciones solo de documentación no reservan workers de Docker. La ruta rápida compila una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agents en workspace compartido, ejecuta el e2e de gateway-network del contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil Docker acotado de plugins incluidos bajo un timeout agregado de comando de 240 segundos (cada ejecución de Docker de escenario se limita por separado).
- **Ruta completa** mantiene la cobertura de instalación de paquete QR y de instalador/Docker/update para ejecuciones nocturnas programadas, dispatches manuales, comprobaciones de release por workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen de smoke de Dockerfile raíz de GHCR para el SHA objetivo, luego ejecuta la instalación de paquete QR, smokes de Dockerfile raíz/gateway, smokes de instalador/update y el Docker E2E rápido de plugins incluidos como trabajos separados para que el trabajo de instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos merge commits) no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el workflow mantiene el smoke rápido de Docker y deja el smoke de instalación completo para la validación nocturna o de release.

El smoke lento de proveedor de imagen con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de comprobaciones de release, y los dispatches manuales de `Install Smoke` pueden optar por incluirlo, pero los pull requests y los pushes a `main` no. La CI normal de PR todavía ejecuta la vía rápida de regresión del launcher de Bun para cambios relevantes para Node. Las pruebas QR y de Docker del instalador mantienen sus propios Dockerfiles centrados en instalación.

## Docker E2E local

`pnpm test:docker:all` precompila una imagen compartida de live-test, empaqueta OpenClaw una vez como tarball de npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner mínimo de Node/Git para vías de instalador/update/dependencias de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para vías de funcionalidad normal.

Las definiciones de vías de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el runner solo ejecuta el plan seleccionado. El programador selecciona la imagen por vía con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, y luego ejecuta las vías con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parámetros ajustables

| Variable                               | Predeterminado | Propósito                                                                                       |
| -------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Recuento de slots del pool principal para vías normales.                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Recuento de slots del pool final sensible a proveedores.                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de vías live concurrentes para que los proveedores no apliquen throttling.               |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5              | Límite de vías concurrentes de instalación npm.                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de vías multiservicio concurrentes.                                                       |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de vías para evitar tormentas de creación del daemon de Docker; define `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Timeout de reserva por vía (120 minutos); las vías live/final seleccionadas usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset          | `1` imprime el plan del programador sin ejecutar vías.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset          | Lista exacta de vías separadas por comas; omite el smoke de limpieza para que agents puedan reproducir una vía fallida. |

Una vía más pesada que su límite efectivo aún puede comenzar desde un pool vacío y luego se ejecuta sola hasta que libera capacidad. El agregado local hace preflight de Docker, elimina contenedores OpenClaw E2E obsoletos, emite estado de vías activas, persiste tiempos de vías para ordenamiento de más larga primero y, de forma predeterminada, deja de programar nuevas vías agrupadas después del primer fallo.

### Workflow live/E2E reutilizable

El workflow live/E2E reutilizable pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen live, vía y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y publica imágenes Docker E2E bare/functional de GHCR etiquetadas por digest de paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita vías con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de recompilar. Los pulls de imágenes Docker se reintentan con un timeout acotado de 180 segundos por intento para que un stream atascado de registro/caché se reintente rápidamente en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de release

La cobertura Docker de release ejecuta trabajos fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento descargue solo el tipo de imagen que necesita y ejecute múltiples vías mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos Docker de release actuales son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y `plugins-runtime-install-a` hasta `plugins-runtime-install-h`. `package-update-openai` incluye la vía live del paquete del plugin Codex, que instala el paquete candidato de OpenClaw, instala el plugin Codex desde `codex_plugin_spec` o un tarball de la misma ref con aprobación explícita de instalación de Codex CLI, ejecuta el preflight de Codex CLI y luego ejecuta múltiples turnos de agent de OpenClaw de la misma sesión contra OpenAI. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo aliases agregados de plugin/runtime. El alias de vía `install-e2e` sigue siendo el alias agregado de reejecución manual para ambas vías de instalador de proveedor.

OpenWebUI se integra en `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y mantiene un fragmento independiente `openwebui` solo para dispatches exclusivos de OpenWebUI. Las vías de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento sube `.artifacts/docker-tests/` con logs de vías, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del programador, tablas de vías lentas y comandos de reejecución por vía. La entrada `docker_lanes` del workflow ejecuta vías seleccionadas contra las imágenes preparadas en lugar de los trabajos de fragmentos, lo que mantiene la depuración de vías fallidas acotada a un trabajo Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si una vía seleccionada es una vía Docker live, el trabajo dirigido compila localmente la imagen live-test para esa reejecución. Los comandos generados de reejecución de GitHub por vía incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imagen preparadas cuando esos valores existen, para que una vía fallida pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # descargar artefactos Docker e imprimir comandos de reejecución dirigidos combinados/por vía
pnpm test:docker:timings <summary>   # resúmenes de vía lenta y ruta crítica de fases
```

El workflow live/E2E programado ejecuta diariamente la suite Docker completa de release-path.

## Prelanzamiento de Plugin

`Plugin Prerelease` es cobertura de producto/paquete más costosa, así que es un workflow separado despachado por `Full Release Validation` o por un operador explícito. Los pull requests normales, los pushes a `main` y los dispatches manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de plugins incluidos entre ocho workers de extensiones; esos trabajos de shards de extensiones ejecutan hasta dos grupos de configuración de plugins a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de plugins con muchas importaciones no creen trabajos adicionales de CI. La ruta de prerelease Docker solo para release agrupa vías Docker dirigidas en grupos pequeños para evitar reservar decenas de runners para trabajos de uno a tres minutos. El workflow también sube un artefacto informativo `plugin-inspector-advisory` desde `@openclaw/plugin-inspector`; los hallazgos del inspector son entrada de triage y no cambian la puerta bloqueante de Plugin Prerelease.

## QA Lab

QA Lab tiene vías de CI dedicadas fuera del workflow principal de alcance inteligente. La paridad agéntica está anidada bajo los harnesses amplios de QA y release, no como un workflow de PR independiente. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba acompañar una ejecución amplia de validación.

- El workflow `QA-Lab - All Lanes` se ejecuta todas las noches en `main` y por dispatch manual; distribuye la vía de paridad mock, la vía Matrix live y las vías live de Telegram y Discord como trabajos paralelos. Los trabajos live usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de release ejecutan las vías de transporte live de Matrix y Telegram con el proveedor mock determinista y modelos calificados como mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato del canal quede aislado de la latencia de modelos live y del inicio normal de plugins de proveedor. El gateway de transporte live desactiva la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores está cubierta por las suites separadas de modelo live, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de release, y añade `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del workflow siguen siendo `all`; el dispatch manual `matrix_profile=all` siempre divide la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta las vías críticas de release de QA Lab antes de la aprobación de release; su puerta de paridad de QA ejecuta los paquetes candidato y baseline como trabajos de vías paralelas, luego descarga ambos artefactos en un trabajo pequeño de informe para la comparación final de paridad.

Para PRs normales, sigue la evidencia de CI/comprobación con alcance en lugar de tratar la paridad como un estado requerido.

## CodeQL

El workflow `CodeQL` es intencionalmente un escáner de seguridad estrecho de primera pasada, no el barrido completo del repositorio. Las ejecuciones diarias, manuales y de guardia de pull requests que no son draft escanean código de workflows de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La guardia de pull requests se mantiene ligera: solo comienza para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el workflow programado. Android y macOS CodeQL quedan fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secretos, sandbox, Cron y línea base de Gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del núcleo más el runtime de plugins de canal, Gateway, Plugin SDK, secretos y puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies de SSRF del núcleo, análisis de IP, protección de red, web-fetch y política de SSRF de Plugin SDK                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y compuertas de ejecución de herramientas de agentes             |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, instalación de gestor de paquetes, carga de código fuente y contrato de paquete de Plugin SDK |

### Shards de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — shard de seguridad programado para Android. Compila la app de Android manualmente para CodeQL en el runner Linux de Blacksmith más pequeño aceptado por la validación básica del workflow. Sube en `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de seguridad semanal/manual para macOS. Compila la app de macOS manualmente para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube en `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el shard no relacionado con seguridad correspondiente. Ejecuta solo consultas de calidad de JavaScript/TypeScript sin seguridad y con severidad de error sobre superficies estrechas de alto valor en runners Linux alojados en GitHub para que los escaneos de calidad no gasten presupuesto de registro de runners de Blacksmith. Su protección de pull request es intencionalmente más pequeña que el perfil programado: los PR que no son borradores solo ejecutan los shards correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agentes y despacho de respuestas, código de esquema/migración/IO de configuración, código de auth/secretos/sandbox/seguridad, runtime de canales del núcleo y plugins de canal incluidos, protocolo/métodos de servidor de Gateway, runtime de memoria/enlace de SDK, MCP/procesos/entrega saliente, runtime de proveedores/catálogo de modelos, diagnósticos de sesión/colas de entrega, cargador de plugins, Plugin SDK/contrato de paquete o runtime de respuestas de Plugin SDK. Los cambios de configuración de CodeQL y de workflow de calidad ejecutan los doce shards de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son hooks de enseñanza/iteración para ejecutar un shard de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de Auth, secretos, sandbox, Cron y Gateway                                                                                          |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización e IO                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo de Gateway y contratos de métodos de servidor                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canales del núcleo y plugins de canal incluidos                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuestas automáticas, y contratos de runtime del plano de control de ACP             |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de host de memoria, fachadas de runtime de memoria, alias de Plugin SDK de memoria, enlace de activación del runtime de memoria y comandos doctor de memoria   |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de cola de respuestas, colas de entrega de sesión, helpers de vinculación/entrega de sesión saliente, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI de doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes de Plugin SDK, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de vinculación de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización de catálogo de modelos, auth y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de la UI de control, persistencia local, flujos de control de Gateway y contratos de runtime del plano de control de tareas                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/search web del núcleo, IO de medios, comprensión de medios, generación de imágenes y generación de medios                            |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y punto de entrada de Plugin SDK                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente publicado de Plugin SDK del lado del paquete y helpers de contrato de paquete de plugin                                                             |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin oscurecer la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe reincorporarse como trabajo de seguimiento acotado o dividido en shards solo después de que los perfiles estrechos tengan runtime y señal estables.

## Workflows de mantenimiento

### Docs Agent

El workflow `Docs Agent` es un carril de mantenimiento de Codex basado en eventos para mantener la documentación existente alineada con cambios integrados recientemente. No tiene una programación pura: una ejecución de CI exitosa de push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por workflow-run se omiten cuando `main` avanzó o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA fuente anterior de Docs Agent no omitido hasta el `main` actual, de modo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de docs.

### Test Performance Agent

El workflow `Test Performance Agent` es un carril de mantenimiento de Codex basado en eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI exitosa de push no bot en `main` puede activarlo, pero se omite si otra invocación por workflow-run ya se ejecutó o se está ejecutando ese día UTC. El despacho manual omite esa compuerta de actividad diaria. El carril genera un informe agrupado de rendimiento de Vitest para la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactors amplios, luego vuelve a ejecutar el informe de suite completa y rechaza cambios que reduzcan el recuento base de pruebas que pasan. El informe agrupado registra el tiempo de pared por configuración y el RSS máximo en Linux y macOS, por lo que la comparación antes/después muestra deltas de memoria de pruebas junto a deltas de duración. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe de suite completa posterior al agente debe pasar antes de que se confirme nada. Cuando `main` avanza antes de que llegue el push del bot, el carril rebasa el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad drop-sudo que el agente de docs.

### PR duplicados después del merge

El workflow `Duplicate PRs After Merge` es un workflow manual de mantenimiento para limpieza de duplicados posterior a la integración. Por defecto es dry-run y solo cierra los PR listados explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que el PR integrado tenga merge y que cada duplicado tenga un issue referenciado compartido o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Compuertas de comprobación local y enrutamiento de cambios

La lógica local de carriles modificados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa compuerta de comprobación local es más estricta respecto a límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan typecheck de prod y pruebas del núcleo más lint/protecciones del núcleo;
- los cambios solo de pruebas del núcleo ejecutan solo typecheck de pruebas del núcleo más lint del núcleo;
- los cambios de producción de extensiones ejecutan typecheck de prod y pruebas de extensiones más lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan typecheck de pruebas de extensiones más lint de extensiones;
- los cambios públicos de Plugin SDK o contrato de plugin se expanden a typecheck de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de prueba explícito);
- los incrementos de versión solo de metadatos de release ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura a todos los carriles de comprobación.

El enrutamiento local de pruebas modificadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren mapeos explícitos, luego pruebas hermanas y dependientes del grafo de imports. La configuración compartida de entrega a salas de grupo es uno de los mapeos explícitos: los cambios en la configuración de respuesta visible para grupos, el modo de entrega de respuestas de origen o el prompt de sistema de la herramienta de mensajes se enrutan por las pruebas de respuestas del núcleo más regresiones de entrega de Discord y Slack para que un cambio de valor predeterminado compartido falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el harness como para que el conjunto mapeado barato no sea un proxy confiable.

## Validación de Testbox

Crabbox es el wrapper de cajas remotas propiedad del repo para prueba de Linux de mantenimiento. Úsalo
desde la raíz del repo cuando una comprobación sea demasiado amplia para un bucle local de edición, cuando importe
la paridad con CI o cuando la prueba necesite secretos, Docker, carriles de paquetes,
cajas reutilizables o logs remotos. El backend normal de OpenClaw es
`blacksmith-testbox`; la capacidad propia de AWS/Hetzner es una alternativa para interrupciones de Blacksmith,
problemas de cuota o pruebas explícitas con capacidad propia.

Crabbox respaldado por Blacksmith calienta, reclama, sincroniza, ejecuta, informa y limpia
Testboxes de un solo uso. La comprobación de cordura de sincronización integrada falla rápido cuando desaparecen
archivos raíz requeridos como `pnpm-lock.yaml` o cuando `git status --short`
muestra al menos 200 eliminaciones rastreadas. Para PRs intencionales con eliminaciones masivas, define
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para el comando remoto.

Crabbox también termina una invocación local de la CLI de Blacksmith que permanece en la
fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Define
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor
en milisegundos para diffs locales inusualmente grandes.

Antes de una primera ejecución, comprueba el wrapper desde la raíz del repositorio:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El wrapper del repositorio rechaza un binario de Crabbox obsoleto que no anuncie `blacksmith-testbox`. Pasa el proveedor explícitamente aunque `.crabbox.yaml` tenga valores predeterminados de nube propia. En worktrees de Codex o checkouts enlazados/dispersos, evita el script local `pnpm crabbox:run` porque pnpm puede reconciliar dependencias antes de que Crabbox se inicie; invoca directamente el wrapper de node en su lugar:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Las ejecuciones respaldadas por Blacksmith requieren Crabbox 0.22.0 o posterior para que el wrapper obtenga el comportamiento actual de sincronización, cola y limpieza de Testbox. Al usar el checkout hermano, reconstruye el binario local ignorado antes de trabajos de medición o prueba:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Puerta de cambios:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm check:changed"
```

Reejecución de prueba enfocada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Suite completa:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Lee el resumen JSON final. Los campos útiles son `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` y `totalMs`. Para ejecuciones delegadas
de Blacksmith Testbox, el código de salida del wrapper de Crabbox y el resumen JSON son el
resultado del comando. La ejecución enlazada de GitHub Actions se encarga de la hidratación y del keepalive; puede
terminar como `cancelled` cuando el Testbox se detiene externamente después de que el comando SSH
ya haya devuelto resultado. Trátalo como un artefacto de limpieza/estado salvo que
el `exitCode` del wrapper sea distinto de cero o que la salida del comando muestre una prueba fallida.
Las ejecuciones de Crabbox de un solo uso respaldadas por Blacksmith deberían detener el Testbox automáticamente;
si se interrumpe una ejecución o la limpieza no está clara, inspecciona las cajas activas y detén solo
las cajas que creaste:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Usa reutilización solo cuando necesites intencionalmente varios comandos en la misma caja hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox es la capa rota pero Blacksmith en sí funciona, usa Blacksmith directo
solo para diagnósticos como `list`, `status` y limpieza. Corrige la ruta de
Crabbox antes de tratar una ejecución directa de Blacksmith como prueba de mantenedor.

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan pero los nuevos
calentamientos quedan en `queued` sin IP ni URL de ejecución de Actions después de un par de minutos,
trátalo como presión del proveedor, cola, facturación o límite de organización de Blacksmith. Detén los
ids en cola que creaste, evita iniciar más Testboxes y mueve la prueba a la
ruta de capacidad propia de Crabbox de abajo mientras alguien revisa el panel de Blacksmith,
la facturación y los límites de la organización.

Escala a capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, no tenga el entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Bajo presión de AWS, evita `class=beast` salvo que la tarea realmente necesite CPU de clase 48xlarge. Una solicitud `beast` comienza en 192 vCPU y es la forma más fácil de activar cuotas regionales de EC2 Spot o On-Demand Standard. El `.crabbox.yaml` propiedad del repositorio usa por defecto `standard`, varias regiones de capacidad y `capacity.hints: true`, de modo que los arrendamientos AWS intermediados imprimen la región/mercado seleccionados, la presión de cuota, la alternativa de Spot y advertencias de clase de alta presión. Usa `fast` para comprobaciones amplias más pesadas, `large` solo después de que standard/fast no sean suficientes, y `beast` solo para lanes excepcionales limitados por CPU, como suite completa o matrices Docker de todos los plugins, validación explícita de release/bloqueador, o perfilado de rendimiento con muchos núcleos. No uses `beast` para `pnpm check:changed`, pruebas enfocadas, trabajo solo de documentación, lint/typecheck ordinarios, pequeñas reproducciones E2E o triage de caídas de Blacksmith. Usa `--market on-demand` para diagnóstico de capacidad, de modo que la volatilidad del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` posee los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para lanes de nube propia. Excluye `.git` local para que el checkout hidratado de Actions mantenga sus propios metadatos Git remotos en lugar de sincronizar remotos y almacenes de objetos locales de mantenedor, y excluye artefactos locales de runtime/build que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` posee el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y el traspaso de entorno no secreto para comandos de nube propia `crabbox run --id <cbx_id>`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
