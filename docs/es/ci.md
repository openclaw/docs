---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no.
    - Está depurando una comprobación fallida de GitHub Actions
    - Está coordinando una ejecución o repetición de la validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, puertas de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-06-28T00:10:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95e38a0777d15b06fe50a1800ecc901d00078d6e970d3bc9e221b664bfced8b5
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. Los pushes
canónicos a `main` primero pasan por una ventana de admisión de ejecutor hospedado
de 90 segundos. El grupo de concurrencia `CI` existente cancela esa ejecución en
espera cuando llega un commit más nuevo, por lo que las fusiones secuenciales no
registran cada una una matriz Blacksmith completa. Las pull requests y los
despachos manuales omiten la espera. Luego, el job `preflight` clasifica el diff
y desactiva lanes costosas cuando solo cambiaron áreas no relacionadas. Las
ejecuciones manuales de `workflow_dispatch` omiten deliberadamente el alcance
inteligente y despliegan todo el grafo para candidatos de lanzamiento y
validación amplia. Las lanes de Android siguen siendo opt-in mediante
`include_android`. La cobertura de plugins solo para lanzamientos vive en el
workflow separado [`Prelanzamiento de Plugin`](#plugin-prerelease) y solo se
ejecuta desde [`Validación completa de lanzamiento`](#full-release-validation) o
un despacho manual explícito.

## Resumen del pipeline

| Job                                | Propósito                                                                                                 | Cuándo se ejecuta                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Detectar cambios solo de docs, alcances cambiados, extensiones cambiadas y compilar el manifiesto de CI   | Siempre en pushes y PRs no draft                    |
| `runner-admission`                 | Debounce hospedado de 90 segundos para pushes canónicos a `main` antes de registrar trabajo de Blacksmith | En cada ejecución de CI; duerme solo en pushes canónicos a `main` |
| `security-fast`                    | Detección de claves privadas, auditoría de workflows cambiados mediante `zizmor` y auditoría de lockfile de producción | Siempre en pushes y PRs no draft                    |
| `check-dependencies`               | Pase de Knip solo para dependencias de producción más la guarda de allowlist de archivos no usados         | Cambios relevantes para Node                        |
| `build-artifacts`                  | Compilar `dist/`, Control UI, smoke checks de CLI compilada, checks de artefactos compilados integrados y artefactos reutilizables | Cambios relevantes para Node                        |
| `checks-fast-core`                 | Lanes rápidas de corrección en Linux, como bundled, protocolo, QA Smoke CI y checks de enrutamiento de CI | Cambios relevantes para Node                        |
| `checks-fast-contracts-plugins-*`  | Dos checks fragmentados de contratos de plugins                                                           | Cambios relevantes para Node                        |
| `checks-fast-contracts-channels-*` | Dos checks fragmentados de contratos de canales                                                           | Cambios relevantes para Node                        |
| `checks-node-core-*`               | Shards de pruebas core de Node, excluyendo lanes de canales, bundled, contrato y extensiones              | Cambios relevantes para Node                        |
| `check-*`                          | Equivalente de puerta local principal fragmentada: tipos de prod, lint, guardas, tipos de prueba y smoke estricto | Cambios relevantes para Node                        |
| `check-additional-*`               | Arquitectura, drift fragmentado de límites/prompts, guardas de extensiones, límite de paquetes y topología de runtime | Cambios relevantes para Node                        |
| `checks-node-compat-node22`        | Build de compatibilidad con Node 22 y lane de smoke                                                       | Despacho manual de CI para lanzamientos             |
| `check-docs`                       | Formato de docs, lint y checks de enlaces rotos                                                           | Docs cambiadas                                      |
| `skills-python`                    | Ruff + pytest para Skills respaldadas por Python                                                          | Cambios relevantes para Skills de Python            |
| `checks-windows`                   | Pruebas específicas de Windows para procesos/rutas más regresiones compartidas de especificadores de importación de runtime | Cambios relevantes para Windows                     |
| `macos-node`                       | Lane de pruebas TypeScript en macOS usando los artefactos compilados compartidos                          | Cambios relevantes para macOS                       |
| `macos-swift`                      | Lint, build y pruebas de Swift para la app de macOS                                                       | Cambios relevantes para macOS                       |
| `ios-build`                        | Generación de proyecto Xcode más build de simulador de la app iOS                                         | App iOS, kit de app compartido o cambios en Swabble |
| `android`                          | Pruebas unitarias de Android para ambos flavors más un build de APK de debug                              | Cambios relevantes para Android                     |
| `test-performance-agent`           | Optimización diaria de pruebas lentas de Codex tras actividad confiable                                   | Éxito de CI principal o despacho manual             |
| `openclaw-performance`             | Informes diarios/bajo demanda de rendimiento del runtime Kova con lanes de proveedor mock, perfil profundo y GPT 5.5 live | Programado y despacho manual                        |

## Orden fail-fast

1. `runner-admission` espera solo para pushes canónicos a `main`; un push más nuevo cancela la ejecución antes del registro en Blacksmith.
2. `preflight` decide qué lanes existen. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este job, no jobs independientes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` y `skills-python` fallan rápido sin esperar a los jobs más pesados de artefactos y matriz de plataformas.
4. `build-artifacts` se solapa con las lanes rápidas de Linux para que los consumidores descendentes puedan empezar en cuanto el build compartido esté listo.
5. Las lanes más pesadas de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` y `android`.

GitHub puede marcar jobs reemplazados como `cancelled` cuando llega un push más nuevo a la misma PR o ref de `main`. Trátalo como ruido de CI salvo que la ejecución más nueva para la misma ref también esté fallando. Los jobs de matriz usan `fail-fast: false`, y `build-artifacts` informa directamente los fallos integrados de canal, core-support-boundary y gateway-watch en vez de poner en cola jobs verificadores diminutos. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente las ejecuciones más nuevas de main. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en progreso.

Usa `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` para resumir tiempo de pared, tiempo de cola, jobs más lentos, fallos y la barrera de fanout `pnpm-store-warmup` desde GitHub Actions. CI también sube el mismo resumen de ejecución como artefacto `ci-timings-summary`. Para tiempos de build, revisa el paso `Build dist` del job `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e incluye `ui:build`; el job también sube el artefacto `startup-memory`.

Para ejecuciones de pull request, el job terminal de resumen de tiempos ejecuta el helper desde la revisión base confiable antes de pasar `GH_TOKEN` a `gh run view`. Eso mantiene la consulta con token fuera del código controlado por la rama mientras sigue resumiendo la ejecución de CI actual de la pull request.

## Contexto y evidencia de PR

Las PRs de colaboradores externos ejecutan una puerta de contexto y evidencia de PR desde
`.github/workflows/real-behavior-proof.yml`. El workflow hace checkout del commit base confiable
y evalúa solo el cuerpo de la PR; no ejecuta código de la rama del colaborador.

La puerta se aplica a autores de PR que no son propietarios del repositorio, miembros,
colaboradores ni bots. Pasa cuando el cuerpo de la PR contiene secciones escritas
`What Problem This Solves` y `Evidence`. La evidencia puede ser una prueba enfocada,
resultado de CI, captura de pantalla, grabación, salida de terminal, observación en vivo,
log redactado o enlace a artefacto. El cuerpo proporciona intención y validación útil;
los revisores inspeccionan el código, las pruebas y CI para evaluar la corrección.

Cuando el check falla, actualiza el cuerpo de la PR en vez de hacer push de otro commit de código.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. El despacho manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si cada área con alcance hubiera cambiado.

- **Ediciones de workflow de CI** validan el grafo de CI de Node más el linting de workflows, pero no fuerzan por sí solas builds nativos de Windows, iOS, Android o macOS; esas lanes de plataforma siguen acotadas a cambios de código fuente de plataforma.
- **Workflow Sanity** ejecuta `actionlint`, `zizmor` sobre todos los archivos YAML de workflow, la guarda de interpolación de acciones compuestas y la guarda de marcadores de conflicto. El job `security-fast` acotado a PR también ejecuta `zizmor` sobre archivos de workflow cambiados para que los hallazgos de seguridad de workflow fallen temprano en el grafo principal de CI.
- **Docs en pushes a `main`** se revisan con el workflow independiente `Docs` usando el mismo espejo de docs de ClawHub que CI, por lo que los pushes mixtos de código+docs no ponen también en cola el shard `check-docs` de CI. Las pull requests y CI manual siguen ejecutando `check-docs` desde CI cuando cambian docs.
- **TUI PTY** se ejecuta en el shard de Linux Node `checks-node-core-runtime-tui-pty` para cambios de TUI. El shard ejecuta `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, por lo que cubre tanto la lane determinista de fixture `TuiBackend` como el smoke más lento `tui --local`, que solo mockea el endpoint externo del modelo.
- **Ediciones solo de enrutamiento de CI, ediciones seleccionadas y baratas de fixtures de pruebas core, y ediciones estrechas de helpers/enrutamiento de pruebas de contratos de plugins** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una única tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canales, shards core completos, shards de plugins bundled y matrices adicionales de guardas cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Checks de Windows Node** están acotados a wrappers específicos de Windows para procesos/rutas, helpers de ejecutores npm/pnpm/UI, configuración del gestor de paquetes y las superficies de workflow de CI que ejecutan esa lane; los cambios no relacionados de código fuente, plugins, install-smoke y solo pruebas permanecen en las lanes de Linux Node.

Las familias de pruebas de Node más lentas están divididas o balanceadas para que cada trabajo permanezca pequeño sin reservar runners de más: los contratos de plugin y los contratos de canal se ejecutan cada uno como dos shards ponderados respaldados por Blacksmith con el fallback estándar de runner de GitHub, los lanes rápidos/de soporte de unidades core se ejecutan por separado, la infraestructura de runtime core se divide entre estado, proceso/configuración, compartido y tres shards de dominio cron, auto-reply se ejecuta como workers balanceados (con el subárbol de respuestas dividido en shards de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic de gateway/server se dividen entre lanes de chat/auth/model/http-plugin/runtime/startup en lugar de esperar artefactos construidos. Luego, la CI normal empaqueta solo shards aislados de patrones de inclusión de infraestructura en paquetes deterministas de como máximo 64 archivos de prueba, lo que reduce la matriz de Node sin fusionar las suites no aisladas de command/cron, agents-core con estado, o gateway/server; las suites fijas pesadas permanecen en 8 vCPU mientras que los lanes empaquetados y de menor peso usan 4 vCPU. Las pull requests en el repositorio canónico usan un plan adicional compacto de admisión: los mismos grupos por configuración se ejecutan en subprocesos aislados dentro del plan actual de 34 trabajos Linux Node, por lo que una sola PR no registra la matriz completa de más de 70 trabajos de Node. Los pushes a `main`, los dispatches manuales y las puertas de release conservan la matriz completa. Las pruebas amplias de navegador, QA, medios y plugins varios usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los shards de patrones de inclusión registran entradas de tiempos usando el nombre del shard de CI, por lo que `.artifacts/vitest-shard-timings.json` puede distinguir una configuración completa de un shard filtrado. `check-additional-*` mantiene junto el trabajo de compilación/canary de límites de paquetes y separa la arquitectura de topología de runtime de la cobertura de gateway watch; la lista de guardas de límites se reparte en un shard intensivo en prompts y un shard combinado para las franjas restantes de guardas, cada uno ejecutando guardas independientes seleccionados de forma concurrente e imprimiendo tiempos por comprobación. La costosa comprobación de drift del snapshot de prompt del happy path de Codex se ejecuta como su propio trabajo adicional solo para CI manual y para cambios que afectan prompts, por lo que los cambios normales no relacionados de Node no esperan detrás de la generación fría de snapshots de prompt y los shards de límites permanecen balanceados mientras el drift de prompt sigue fijado a la PR que lo causó; la misma flag omite la generación de Vitest de snapshots de prompt dentro del shard construido de artefactos de límite de soporte core. Gateway watch, las pruebas de canal y el shard de límite de soporte core se ejecutan de forma concurrente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya están construidos.

Una vez admitida, la CI canónica de Linux permite hasta 24 trabajos de prueba de Node concurrentes y
12 para los lanes más pequeños fast/check; Windows y Android permanecen en dos porque
esos pools de runners son más estrechos.

El plan compacto de PR emite 18 trabajos de Node para la suite actual: los grupos
de configuración completa se agrupan en subprocesos aislados con un timeout de lote de 120 minutos,
mientras que los grupos de patrones de inclusión comparten el mismo presupuesto acotado de trabajos.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego construye el APK de depuración de Play. El flavor de terceros no tiene source set ni manifest separados; su lane de pruebas unitarias todavía compila el flavor con las flags BuildConfig de SMS/call-log, mientras evita un trabajo duplicado de empaquetado del APK de depuración en cada push relevante para Android.

El shard `check-dependencies` ejecuta `pnpm deadcode:dependencies` (un pase de Knip de solo dependencias de producción fijado a la última versión de Knip, con la edad mínima de release de pnpm deshabilitada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de Knip sobre archivos no usados en producción contra `scripts/deadcode-unused-files.allowlist.mjs`. El guard de archivos no usados falla cuando una PR agrega un nuevo archivo no usado sin revisar o deja una entrada obsoleta en la allowlist, mientras preserva superficies intencionales de plugins dinámicos, generadas, de build, de pruebas live y de puente de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado de destino desde la actividad del repositorio OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código de pull requests no confiables. El workflow crea un token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` y luego envía payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El workflow tiene cuatro lanes:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

El lane `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de ítem, URL, título, estado y extractos breves de comentarios o revisiones cuando están presentes. Evita intencionalmente reenviar el cuerpo completo del webhook. El workflow receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente ClawSweeper recibe el destino de Discord en su prompt y debe publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Aperturas rutinarias, ediciones, churn de bots, ruido duplicado de webhooks y tráfico normal de revisiones deben resultar en `NO_REPLY`.

Trata títulos, comentarios, cuerpos, texto de revisiones, nombres de ramas y mensajes de commit de GitHub como datos no confiables en todo este camino. Son entrada para resumen y triaje, no instrucciones para el workflow ni para el runtime del agente.

## Dispatches manuales

Los dispatches manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de todos los lanes con alcance no Android: shards Linux Node, shards de plugins empaquetados, shards de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones smoke de artefactos construidos, comprobaciones de docs, Skills de Python, Windows, macOS, build de iOS y i18n de Control UI. Los dispatches manuales independientes de CI ejecutan Android solo con `include_android=true`; el paraguas completo de release habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prerelease de plugins, el shard `agentic-plugins` solo de release, el barrido completo de lote de extensiones y los lanes Docker de prerelease de plugins se excluyen de CI. La suite Docker de prerelease se ejecuta solo cuando `Full Release Validation` despacha el workflow separado `Plugin Prerelease` con la puerta de validación de release habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de release candidate no sea cancelada por otro push o ejecución de PR en la misma ref. La entrada opcional `target_ref` permite que un llamador confiable ejecute ese grafo contra una rama, etiqueta o SHA completo de commit mientras usa el archivo de workflow de la ref de dispatch seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Trabajos                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch manual de CI y fallbacks de repositorios no canónicos, escaneos de calidad CodeQL de JavaScript/actions, workflow-sanity, labeler, auto-response, workflows de docs fuera de CI y preflight de install-smoke para que la matriz de Blacksmith pueda encolarse antes                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards de extensiones de menor peso, `checks-fast-core`, shards de contratos de plugins/canales, la mayoría de shards Linux Node empaquetados/de menor peso, `check-guards`, `check-prod-types`, `check-test-types`, shards seleccionados de `check-additional-*` y `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites pesadas conservadas de Linux Node, shards `check-additional-*` intensivos en límites/extensiones y `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); builds Docker de install-smoke (el tiempo de cola de 32 vCPU costaba más de lo que ahorraba)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` en `openclaw/openclaw`; los forks usan fallback a `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` en `openclaw/openclaw`; los forks usan fallback a `macos-26`                                                                                                                                                                                                  |

## Presupuesto de registro de runners

El bucket actual de registro de runners de GitHub de OpenClaw permite 3000
registros de runners self-hosted cada 5 minutos. El límite es compartido por todos los registros
de runners de Blacksmith en la organización `openclaw`, por lo que agregar otra instalación
de Blacksmith no agrega un bucket nuevo.

Trata las etiquetas de Blacksmith como el recurso escaso para el control de ráfagas. Los trabajos que
solo enrutan, notifican, resumen, seleccionan shards o ejecutan escaneos breves de CodeQL deben
permanecer en runners hospedados por GitHub salvo que tengan necesidades medidas específicas de Blacksmith.
Cualquier matriz nueva de Blacksmith, `max-parallel` más grande o workflow de alta frecuencia
debe mostrar su conteo de registros en el peor caso y mantener el objetivo a nivel de organización
por debajo de 2000 registros cada 5 minutos, dejando margen para repositorios concurrentes
y trabajos reintentados.

La CI del repositorio canónico mantiene Blacksmith como la ruta predeterminada de runners para ejecuciones normales de push y pull request. `workflow_dispatch` y las ejecuciones de repositorios no canónicos usan runners hospedados por GitHub, pero las ejecuciones canónicas normales actualmente no sondean la salud de la cola de Blacksmith ni hacen fallback automáticamente a etiquetas hospedadas por GitHub cuando Blacksmith no está disponible.

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

`OpenClaw Performance` es el flujo de trabajo de rendimiento del producto/runtime. Se ejecuta a diario en `main` y puede despacharse manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

El despacho manual normalmente ejecuta benchmarks contra la ref del flujo de trabajo. Define `target_ref` para ejecutar benchmarks contra una etiqueta de lanzamiento u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros más recientes se indexan por la ref probada, y cada `index.md` registra la ref/SHA probada, la ref/SHA del flujo de trabajo, la ref de Kova, el perfil, el modo de autenticación del lane, el modelo, el recuento de repeticiones y los filtros de escenarios.

El flujo de trabajo instala OCM desde un lanzamiento fijado y Kova desde `openclaw/Kova` en la entrada `kova_ref` fijada, y luego ejecuta tres lanes:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa compatible con OpenAI y determinista.
- `mock-deep-profile`: perfilado de CPU/heap/trazas para puntos críticos de arranque, gateway y turnos de agente.
- `live-openai-candidate`: un turno de agente real de OpenAI `openai/gpt-5.5`, omitido cuando `OPENAI_API_KEY` no está disponible.

El lane mock-provider también ejecuta sondas de código fuente nativas de OpenClaw después del pase de Kova: tiempo de arranque y memoria del gateway en casos de arranque predeterminado, con hook y con 50 plugins; RSS de importación de plugins empaquetados, bucles de saludo repetidos de `channel-chat-baseline` con mock de OpenAI, comandos de arranque de CLI contra el gateway iniciado y la sonda de rendimiento smoke del estado SQLite. Cuando el informe fuente mock-provider publicado previamente está disponible para la ref probada, el resumen fuente compara los valores actuales de RSS y heap con esa línea base y marca los aumentos grandes de RSS como `watch`. El resumen Markdown de la sonda fuente vive en `source/index.md` dentro del paquete de informe, con JSON sin procesar junto a él.

Cada lane sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondas fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la ref probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación completa de lanzamiento

`Full Release Validation` es el flujo de trabajo manual general para “ejecutar todo antes del lanzamiento”. Acepta una rama, etiqueta o SHA completo de commit, despacha el flujo de trabajo manual `CI` con ese objetivo, despacha `Plugin Prerelease` para pruebas exclusivas de lanzamiento de plugin/paquete/estático/Docker, y despacha `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, renderizado de la scorecard de madurez desde evidencia de perfiles QA, paridad de QA Lab, Matrix y lanes de Telegram. Los perfiles stable y full siempre incluyen cobertura exhaustiva live/E2E y soak de ruta de lanzamiento Docker; el perfil beta puede optar por incluirla con `run_release_soak=true`. El E2E canónico de Telegram para paquetes se ejecuta dentro de Package Acceptance, así que un candidato completo no inicia un poller live duplicado. Después de publicar, pasa `release_package_spec` para reutilizar el paquete npm enviado en las comprobaciones de lanzamiento, Package Acceptance, Docker, entre sistemas operativos y Telegram sin recompilar. Usa `npm_telegram_package_spec` solo para una repetición enfocada de Telegram con paquete publicado. El lane de paquete live del plugin Codex usa el mismo estado seleccionado de forma predeterminada: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mientras que las ejecuciones por SHA/artefacto empaquetan `extensions/codex` desde la ref seleccionada. Define `codex_plugin_spec` explícitamente para fuentes de plugin personalizadas como especificaciones `npm:`, `npm-pack:` o `git:`.

Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para la matriz de etapas, los nombres exactos de jobs del flujo de trabajo, diferencias de perfiles, artefactos y manejadores de repetición enfocada.

`OpenClaw Release Publish` es el flujo de trabajo manual mutante de lanzamiento. Despáchalo desde `release/YYYY.M.PATCH` o `main` después de que exista la etiqueta de lanzamiento y después de que la preflight de OpenClaw npm haya tenido éxito. Verifica `pnpm plugins:sync:check`, despacha `Plugin NPM Release` para todos los paquetes de plugin publicables, despacha `Plugin ClawHub Release` para el mismo SHA de lanzamiento, y solo entonces despacha `OpenClaw NPM Release` con el `preflight_run_id` guardado. La publicación stable también requiere un `windows_node_tag` exacto; el flujo de trabajo verifica el lanzamiento fuente de Windows y compara sus instaladores x64/ARM64 con la entrada `windows_node_installer_digests` aprobada por el candidato antes de cualquier hijo de publicación, luego promociona y verifica esos mismos digests de instalador fijados más el activo complementario exacto y el contrato de checksum antes de publicar el borrador de lanzamiento de GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Para prueba de commit fijado en una rama de movimiento rápido, usa el ayudante en lugar de `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las refs de despacho de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA sin procesar de commits. El ayudante empuja una rama temporal `release-ci/<sha>-...` en el SHA objetivo, despacha `Full Release Validation` desde esa ref fijada, verifica que cada `headSha` de flujo de trabajo hijo coincida con el objetivo y elimina la rama temporal cuando la ejecución completa. El verificador general también falla si algún flujo de trabajo hijo se ejecutó en un SHA distinto.

`release_profile` controla la amplitud live/proveedor pasada a las comprobaciones de lanzamiento. Los flujos de trabajo manuales de lanzamiento usan `stable` de forma predeterminada; usa `full` solo cuando quieras intencionalmente la matriz amplia consultiva de proveedores/medios. Las comprobaciones de lanzamiento stable y full siempre ejecutan el soak exhaustivo live/E2E y Docker de ruta de lanzamiento; el perfil beta puede optar por incluirlo con `run_release_soak=true`.

- `minimum` conserva los lanes más rápidos críticos para el lanzamiento de OpenAI/core.
- `stable` añade el conjunto stable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedores/medios.

El flujo general registra los ids de ejecuciones hijas despachadas, y el job final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y añade tablas de jobs más lentos para cada ejecución hija. Si un flujo de trabajo hijo se vuelve a ejecutar y queda verde, vuelve a ejecutar solo el job verificador padre para refrescar el resultado general y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de lanzamiento, `ci` solo para el hijo de CI completo normal, `plugin-prerelease` solo para el hijo de prerelease de plugins, `release-checks` para cada hijo de lanzamiento, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el flujo general. Esto mantiene acotada la repetición de una caja de lanzamiento fallida tras una corrección enfocada. Para un lane entre sistemas operativos fallido, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos largos entre sistemas operativos emiten líneas de Heartbeat y los resúmenes de packaged-upgrade incluyen tiempos por fase. Los lanes de comprobación de lanzamiento QA son consultivos salvo la puerta estándar de cobertura de herramientas de runtime, que bloquea cuando las herramientas dinámicas requeridas de OpenClaw se desvían o desaparecen del resumen de tier estándar.

`OpenClaw Release Checks` usa la ref confiable del flujo de trabajo para resolver la ref seleccionada una sola vez en un tarball `release-package-under-test`, y luego pasa ese artefacto a comprobaciones entre sistemas operativos y Package Acceptance, además del flujo de trabajo Docker live/E2E de ruta de lanzamiento cuando se ejecuta la cobertura soak. Eso mantiene los bytes del paquete consistentes entre cajas de lanzamiento y evita reempaquetar el mismo candidato en varios jobs hijos. Para el lane live de plugin npm de Codex, las comprobaciones de lanzamiento pasan una especificación de plugin publicado coincidente derivada de `release_package_spec`, pasan el `codex_plugin_spec` proporcionado por el operador, o dejan la entrada en blanco para que el script Docker empaquete el plugin Codex del checkout seleccionado.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all` reemplazan al flujo general anterior. El monitor padre cancela cualquier flujo de trabajo hijo que ya haya despachado cuando el padre se cancela, así que la validación main más nueva no queda detrás de una ejecución obsoleta de comprobaciones de lanzamiento de dos horas. La validación de ramas/etiquetas de lanzamiento y los grupos de repetición enfocados mantienen `cancel-in-progress: false`.

## Shards live y E2E

El hijo live/E2E de lanzamiento conserva la cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como shards con nombre mediante `scripts/test-live-shard.mjs` en lugar de un job serial:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- jobs `native-live-src-gateway-profiles` filtrados por proveedor
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shards divididos de audio/vídeo de medios y shards de música filtrados por proveedor

Eso mantiene la misma cobertura de archivos y a la vez hace que los fallos lentos de proveedores live sean más fáciles de repetir y diagnosticar. Los nombres agregados de shards `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales de una sola ejecución.

Los shards nativos de medios live se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los jobs de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners Blacksmith normales: los jobs de contenedor no son el lugar adecuado para lanzar pruebas Docker anidadas.

Los shards de modelo/backend en vivo respaldados por Docker usan una imagen compartida `ghcr.io/openclaw/openclaw-live-test:<sha>` separada por cada commit seleccionado. El flujo de trabajo de versión en vivo compila y publica esa imagen una vez; luego los shards de modelo en vivo de Docker, Gateway fragmentado por proveedor, backend de CLI, enlace ACP y arnés Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards de Docker de Gateway llevan límites `timeout` explícitos a nivel de script por debajo del timeout del trabajo del flujo de trabajo, de modo que un contenedor atascado o una ruta de limpieza fallen rápido en lugar de consumir todo el presupuesto de comprobación de versión. Si esos shards reconstruyen de forma independiente el objetivo Docker completo del código fuente, la ejecución de versión está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de paquetes

Usa `Package Acceptance` cuando la pregunta sea: "¿este paquete instalable de OpenClaw funciona como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo arnés E2E de Docker que los usuarios ejercitan después de instalar o actualizar.

### Trabajos

1. `resolve_package` extrae `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime el origen, la ref del flujo de trabajo, la ref del paquete, la versión, el SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con digest del paquete cuando es necesario y ejecuta las rutas Docker seleccionadas contra ese paquete en lugar de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego distribuye esas rutas como trabajos Docker dirigidos en paralelo con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando la aceptación de paquetes resolvió uno; una ejecución independiente de Telegram todavía puede instalar una especificación npm publicada.
4. `summary` hace fallar el flujo de trabajo si falló la resolución del paquete, la aceptación de Docker o la ruta opcional de Telegram.

### Orígenes candidatos

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de OpenClaw como `openclaw@2026.4.27-beta.2`. Úsalo para aceptación de versiones preliminares/estables publicadas.
- `source=ref` empaqueta una rama, etiqueta o SHA de commit completo de confianza en `package_ref`. El resolvedor obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o desde una etiqueta de versión, instala dependencias en un worktree separado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS público; `package_sha256` es obligatorio. Esta ruta rechaza credenciales en la URL, puertos HTTPS no predeterminados, nombres de host o IP resueltas privadas/internas/de uso especial, y redirecciones fuera de la misma política de seguridad pública.
- `source=trusted-url` descarga un `.tgz` HTTPS desde una política de origen confiable con nombre en `.github/package-trusted-sources.json`; `package_sha256` y `trusted_source_id` son obligatorios. Úsalo solo para espejos empresariales propiedad de mantenedores o repositorios de paquetes privados que necesiten hosts, puertos, prefijos de ruta, hosts de redirección o resolución de red privada configurados. Si la política declara autenticación bearer, el flujo de trabajo usa el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; las credenciales incrustadas en URL siguen rechazándose.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debe proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de flujo de trabajo/arnés de confianza que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de prueba actual valide commits de origen confiables más antiguos sin ejecutar lógica de flujo de trabajo antigua.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de versión Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad en vivo de ClawHub. La ruta opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, y mantiene la ruta de especificación npm publicada para ejecuciones independientes.

Para la política dedicada de pruebas de actualización y plugins, incluidos comandos locales,
rutas Docker, entradas de aceptación de paquetes, valores predeterminados de versión y triaje de fallos,
consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de versión llaman a la aceptación de paquetes con `source=artifact`, el artefacto preparado del paquete de versión, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` y `telegram_mode=mock-openai`. Esto mantiene la migración del paquete, la actualización, la instalación de Skill de ClawHub en vivo, la limpieza de dependencias de Plugin obsoletas, la reparación de instalación de Plugin configurado, el Plugin sin conexión, la actualización de Plugin y la prueba de Telegram sobre el mismo tarball de paquete resuelto. Configura `release_package_spec` en Validación completa de versión o Comprobaciones de versión de OpenClaw después de publicar una beta para ejecutar la misma matriz contra el paquete npm distribuido sin reconstruir; configura `package_acceptance_package_spec` solo cuando la aceptación de paquetes necesite un paquete distinto al del resto de la validación de versión. Las comprobaciones de versión multiplataforma siguen cubriendo el onboarding, instalador y comportamiento de plataforma específicos de cada SO; la validación de producto de paquete/actualización debe comenzar con la aceptación de paquetes. La ruta Docker `published-upgrade-survivor` valida una referencia base de paquete publicado por ejecución en la ruta bloqueante de versión. En la aceptación de paquetes, el tarball resuelto `package-under-test` siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la referencia base publicada alternativa, con valor predeterminado `openclaw@latest`; los comandos de repetición de rutas fallidas conservan esa referencia base. La Validación completa de versión con `run_release_soak=true` o `release_profile=full` configura `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para expandirse sobre las cuatro versiones estables npm más recientes, más versiones fijadas de frontera de compatibilidad de plugins y fixtures con forma de incidencias para configuración de Feishu, archivos de bootstrap/persona preservados, instalaciones configuradas de Plugin de OpenClaw, rutas de log con tilde y raíces obsoletas de dependencias de plugins heredados. Las selecciones multi-referencia base de published-upgrade survivor se fragmentan por referencia base en trabajos separados de ejecutor Docker dirigido. El flujo de trabajo separado `Update Migration` usa la ruta Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es una limpieza exhaustiva de actualización publicada, no la amplitud normal de la CI de versión completa. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquete con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantener una sola ruta con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o configurar `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. La ruta publicada configura la referencia base con una receta integrada de comando `openclaw config set`, registra los pasos de la receta en `summary.json` y prueba `/healthz`, `/readyz`, además del estado RPC después del inicio de Gateway. Las rutas nuevas empaquetadas e instaladoras de Windows también verifican que un paquete instalado pueda importar una anulación de control de navegador desde una ruta Windows absoluta sin procesar. El smoke multiplataforma de turno de agente OpenAI usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está configurado; de lo contrario, `openai/gpt-5.5`, de modo que la prueba de instalación y Gateway permanece en un modelo de prueba GPT-5 mientras evita valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

La aceptación de paquetes tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- entradas QA privadas conocidas en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa flag;
- `update-channel-switch` puede podar `patchedDependencies` de pnpm faltantes desde el fixture git falso derivado del tarball y puede registrar la ausencia de `update.channel` persistido;
- los smokes de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar la ausencia de persistencia de registros de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración mientras sigue exigiendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir por archivos de sello de metadatos de compilación local que ya se distribuyeron. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquetes, empieza por el resumen de `resolve_package` para confirmar el origen, la versión y el SHA-256 del paquete. Luego inspecciona la ejecución hija de `docker_acceptance` y sus artefactos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de ruta, tiempos de fase y comandos de repetición. Prefiere repetir el perfil de paquete fallido o las rutas Docker exactas en lugar de repetir la validación completa de versión.

## Smoke de instalación

El flujo de trabajo separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio trabajo `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies de Docker/paquete, cambios de paquete/manifiesto de Plugin incluido, o superficies del núcleo de Plugin/canal/gateway/Plugin SDK que ejercitan los trabajos de humo de Docker. Los cambios de Plugin incluido solo de código fuente, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida compila una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agents shared-workspace, ejecuta el e2e de gateway-network del contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil Docker acotado de Plugin incluido bajo un timeout agregado de comando de 240 segundos (cada ejecución Docker de escenario se limita por separado).
- **Ruta completa** mantiene la cobertura de instalación de paquete QR y Docker/actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de release por workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen de humo GHCR del Dockerfile raíz para un SHA objetivo, luego ejecuta la instalación de paquete QR, smokes del Dockerfile raíz/gateway, smokes de instalador/actualización y el E2E Docker rápido de Plugin incluido como trabajos separados para que el trabajo del instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos los commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance cambiado solicitaría cobertura completa en un push, el workflow mantiene el smoke Docker rápido y deja el smoke de instalación completo para la validación nocturna o de release.

El smoke lento de proveedor de imagen con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de comprobaciones de release, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero los pull requests y pushes a `main` no. La CI normal de PR sigue ejecutando la lane rápida de regresión del lanzador Bun para cambios relevantes de Node. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles centrados en instalación.

## E2E Docker local

`pnpm test:docker:all` precompila una imagen compartida de pruebas live, empaqueta OpenClaw una vez como tarball npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner básico de Node/Git para lanes de instalador/actualización/dependencia de Plugin;
- una imagen funcional que instala el mismo tarball en `/app` para lanes de funcionalidad normal.

Las definiciones de lanes Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`, y el runner solo ejecuta el plan seleccionado. El programador selecciona la imagen por lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta lanes con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustables

| Variable                               | Predeterminado | Propósito                                                                                     |
| -------------------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Cantidad de slots del pool principal para lanes normales.                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Cantidad de slots del pool de cola sensible a proveedores.                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de lanes live concurrentes para que los proveedores no apliquen throttling.            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5              | Límite de lanes concurrentes de instalación npm.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de lanes concurrentes multiservicio.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de lanes para evitar tormentas de creación del daemon Docker; establece `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Timeout de respaldo por lane (120 minutos); lanes live/de cola seleccionadas usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin definir    | `1` imprime el plan del programador sin ejecutar lanes.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin definir    | Lista exacta de lanes separada por comas; omite el smoke de limpieza para que los agentes puedan reproducir una lane fallida. |

Una lane más pesada que su límite efectivo aún puede iniciar desde un pool vacío, y luego se ejecuta sola hasta que libera capacidad. El agregado local precomprueba Docker, elimina contenedores E2E obsoletos de OpenClaw, emite el estado de lanes activas, conserva tiempos de lanes para ordenamiento de mayor a menor duración y deja de programar nuevas lanes agrupadas tras el primer fallo de forma predeterminada.

### Workflow live/E2E reutilizable

El workflow live/E2E reutilizable pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen live, lane y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y publica imágenes Docker E2E GHCR básicas/funcionales etiquetadas por digest de paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita lanes con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de recompilar. Las descargas de imágenes Docker se reintentan con un timeout acotado de 180 segundos por intento para que un flujo de registro/caché atascado reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de release

La cobertura Docker de release ejecuta trabajos fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento descargue solo el tipo de imagen que necesita y ejecute múltiples lanes mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos Docker de release actuales son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y `plugins-runtime-install-a` hasta `plugins-runtime-install-h`. `package-update-openai` incluye la lane live de paquete del Plugin Codex, que instala el paquete candidato de OpenClaw, instala el Plugin Codex desde `codex_plugin_spec` o un tarball de la misma ref con aprobación explícita de instalación de Codex CLI, ejecuta el preflight de Codex CLI y luego ejecuta múltiples turnos de agente de OpenClaw en la misma sesión contra OpenAI. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de Plugin/runtime. El alias de lane `install-e2e` sigue siendo el alias agregado de reejecución manual para ambas lanes de instalador de proveedor.

OpenWebUI se integra en `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y mantiene un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Las lanes de actualización de canales incluidos reintentan una vez ante fallos transitorios de red npm.

Cada fragmento sube `.artifacts/docker-tests/` con logs de lanes, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del programador, tablas de lanes lentas y comandos de reejecución por lane. La entrada `docker_lanes` del workflow ejecuta lanes seleccionadas contra las imágenes preparadas en lugar de los trabajos de fragmento, lo que mantiene la depuración de lanes fallidas acotada a un único trabajo Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si una lane seleccionada es una lane Docker live, el trabajo dirigido compila localmente la imagen de pruebas live para esa reejecución. Los comandos generados de reejecución de GitHub por lane incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imagen preparadas cuando esos valores existen, para que una lane fallida pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El workflow live/E2E programado ejecuta diariamente la suite Docker completa de release-path.

## Prerelease de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un workflow separado despachado por `Full Release Validation` o por un operador explícito. Los pull requests normales, pushes a `main` y despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de Plugins incluidos entre ocho workers de extensiones; esos trabajos de shards de extensiones ejecutan hasta dos grupos de configuración de Plugin a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de Plugins con muchas importaciones no creen trabajos de CI adicionales. La ruta Docker de prerelease exclusiva de release agrupa lanes Docker dirigidas en grupos pequeños para evitar reservar decenas de runners para trabajos de uno a tres minutos. El workflow también sube un artefacto informativo `plugin-inspector-advisory` desde `@openclaw/plugin-inspector`; los hallazgos del inspector son entrada de triage y no cambian la puerta bloqueante de Plugin Prerelease.

## QA Lab

QA Lab tiene lanes de CI dedicadas fuera del workflow principal de alcance inteligente. La paridad agéntica está anidada bajo los harnesses amplios de QA y release, no como un workflow independiente de PR. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba ir junto con una ejecución amplia de validación.

- El workflow `QA-Lab - All Lanes` se ejecuta todas las noches en `main` y en despacho manual; distribuye la lane de paridad mock, la lane live de Matrix y las lanes live de Telegram y Discord como trabajos paralelos. Los trabajos live usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de release ejecutan lanes de transporte live de Matrix y Telegram con el proveedor mock determinista y modelos calificados como mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato del canal quede aislado de la latencia de modelos live y del arranque normal de provider-plugin. El gateway de transporte live deshabilita la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores está cubierta por las suites separadas de modelo live, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de release, agregando `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del workflow siguen siendo `all`; el despacho manual `matrix_profile=all` siempre particiona la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta las lanes críticas de release de QA Lab antes de aprobar la release; su puerta de paridad de QA ejecuta los paquetes candidato y baseline como trabajos de lanes paralelos, y luego descarga ambos artefactos en un pequeño trabajo de informe para la comparación final de paridad.

Para PRs normales, sigue la evidencia de CI/comprobación con alcance en lugar de tratar la paridad como un estado requerido.

## CodeQL

El workflow `CodeQL` es intencionadamente un escáner de seguridad estrecho de primera pasada, no el barrido completo del repositorio. Las ejecuciones de guarda diarias, manuales y de pull requests no draft escanean código de workflows de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La guarda de pull requests se mantiene ligera: solo se inicia para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el workflow programado. CodeQL de Android y macOS quedan fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                          | Superficie                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticación, secretos, entorno aislado, Cron y base de referencia de Gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del núcleo, más el runtime de Plugin de canal, Gateway, Plugin SDK, secretos y puntos de contacto de auditoría              |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies de SSRF del núcleo, análisis de IP, protección de red, web-fetch y política SSRF del Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, ayudantes de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas del agente                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, instalación del gestor de paquetes, carga de fuentes y contrato de paquete del Plugin SDK |

### Fragmentos de seguridad específicos de la plataforma

- `CodeQL Android Critical Security` — fragmento de seguridad programado para Android. Compila manualmente la aplicación de Android para CodeQL en el ejecutor Linux de Blacksmith más pequeño aceptado por la comprobación de cordura del workflow. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento de seguridad semanal/manual para macOS. Compila manualmente la aplicación de macOS para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento equivalente no relacionado con seguridad. Ejecuta solo consultas de calidad JavaScript/TypeScript sin seguridad y con severidad de error sobre superficies estrechas de alto valor en ejecutores Linux alojados en GitHub para que los escaneos de calidad no consuman presupuesto de registro de ejecutores de Blacksmith. Su guardia de pull request es intencionalmente más pequeña que el perfil programado: los PR que no son borradores solo ejecutan los fragmentos correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agentes y despacho de respuestas, código de esquema/migración/IO de configuración, código de autenticación/secretos/entorno aislado/seguridad, runtime de canales del núcleo y Plugin de canal incluido, protocolo Gateway/método de servidor, runtime de memoria/enlace SDK, MCP/proceso/entrega saliente, catálogo de runtime/modelos de proveedores, diagnósticos de sesión/colas de entrega, cargador de Plugin, Plugin SDK/contrato de paquete o runtime de respuestas del Plugin SDK. Los cambios en la configuración de CodeQL y el workflow de calidad ejecutan los doce fragmentos de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son enlaces de enseñanza/iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                                | Superficie                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límites de seguridad de autenticación, secretos, entorno aislado, Cron y Gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización e IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo Gateway y contratos de métodos de servidor                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canales del núcleo y Plugin de canal incluido                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuesta automática, y contratos de runtime del plano de control ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, ayudantes de supervisión de procesos y contratos de entrega saliente                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas de runtime de memoria, alias de memoria del Plugin SDK, enlace de activación de runtime de memoria y comandos doctor de memoria                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Componentes internos de la cola de respuestas, colas de entrega de sesión, ayudantes de vinculación/entrega de sesión saliente, superficies de eventos de diagnóstico/paquetes de logs y contratos de CLI doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del Plugin SDK, ayudantes de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y ayudantes de vinculación de sesión/hilo             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros de web/search/fetch/embedding    |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de la interfaz de control, persistencia local, flujos de control de Gateway y contratos de runtime del plano de control de tareas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/search web del núcleo, IO de medios, comprensión de medios, generación de imágenes y generación de medios                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y punto de entrada del Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fuente publicada del Plugin SDK del lado del paquete y ayudantes de contrato de paquete de Plugin                                                                                      |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad se puedan programar, medir, desactivar o ampliar sin ocultar la señal de seguridad. La expansión de CodeQL para Swift, Python y Plugins incluidos debe volver a añadirse como trabajo de seguimiento acotado o fragmentado solo después de que los perfiles estrechos tengan runtime y señal estables.

## Workflows de mantenimiento

### Docs Agent

El workflow `Docs Agent` es un carril de mantenimiento Codex impulsado por eventos para mantener la documentación existente alineada con los cambios aterrizados recientemente. No tiene una programación pura: una ejecución de CI de push no bot correcta en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por workflow-run se omiten cuando `main` ha avanzado o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen anterior no omitido de Docs Agent hasta el `main` actual, de modo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Test Performance Agent

El workflow `Test Performance Agent` es un carril de mantenimiento Codex impulsado por eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI de push no bot correcta en `main` puede activarlo, pero se omite si otra invocación por workflow-run ya se ejecutó o se está ejecutando ese día UTC. El despacho manual omite esa puerta de actividad diaria. El carril genera un informe de rendimiento de Vitest agrupado para toda la suite, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de toda la suite y rechaza cambios que reduzcan el recuento base de pruebas que pasan. El informe agrupado registra tiempo de pared por configuración y RSS máximo en Linux y macOS, de modo que la comparación antes/después muestra los deltas de memoria de pruebas junto a los deltas de duración. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe posterior del agente para toda la suite debe pasar antes de que se confirme nada. Cuando `main` avanza antes de que aterrice el push del bot, el carril rebasea el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado en GitHub para que la acción Codex pueda mantener la misma postura de seguridad drop-sudo que el agente de documentación.

### PR duplicados después del merge

El workflow `Duplicate PRs After Merge` es un workflow manual de mantenedor para limpieza de duplicados posterior al aterrizaje. Por defecto ejecuta una simulación y solo cierra PR listados explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que el PR aterrizado esté fusionado y que cada duplicado tenga un issue referenciado compartido o fragmentos modificados solapados.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Puertas de comprobación locales y enrutamiento de cambios

La lógica local de carriles modificados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa puerta de comprobación local es más estricta sobre límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan typecheck de producción del núcleo y de pruebas del núcleo, más lint/guardias del núcleo;
- los cambios del núcleo solo de pruebas ejecutan únicamente typecheck de pruebas del núcleo, más lint del núcleo;
- los cambios de producción de extensiones ejecutan typecheck de producción de extensiones y de pruebas de extensiones, más lint de extensiones;
- los cambios de extensiones solo de pruebas ejecutan typecheck de pruebas de extensiones, más lint de extensiones;
- los cambios públicos del Plugin SDK o del contrato de Plugin se amplían a typecheck de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de prueba explícito);
- los aumentos de versión solo de metadatos de release ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todos los carriles de comprobación.

El enrutamiento local de pruebas modificadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de fuente prefieren asignaciones explícitas y luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega a salas de grupo es una de las asignaciones explícitas: los cambios en la configuración de respuesta visible para el grupo, el modo de entrega de respuestas de origen o el prompt del sistema de message-tool pasan por las pruebas de respuestas del núcleo más regresiones de entrega de Discord y Slack, de modo que un cambio predeterminado compartido falle antes del primer push del PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el arnés como para que el conjunto mapeado barato no sea un proxy confiable.

## Validación de Testbox

Crabbox es el wrapper de caja remota propiedad del repositorio para pruebas Linux de mantenedores. Úsalo
desde la raíz del repositorio cuando una comprobación sea demasiado amplia para un ciclo local de edición, cuando importe
la paridad con CI o cuando la prueba necesite secretos, Docker, carriles de paquete,
cajas reutilizables o logs remotos. El backend normal de OpenClaw es
`blacksmith-testbox`; la capacidad propia en AWS/Hetzner es una alternativa para interrupciones de Blacksmith,
problemas de cuota o pruebas explícitas con capacidad propia.

Las ejecuciones de Blacksmith respaldadas por Crabbox preparan, reclaman, sincronizan, ejecutan, informan y limpian
Testboxes de un solo uso. La comprobación de integridad de sincronización integrada falla rápido cuando desaparecen archivos
raíz requeridos como `pnpm-lock.yaml` o cuando `git status --short`
muestra al menos 200 eliminaciones rastreadas. Para PRs intencionales con eliminaciones masivas, configura
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para el comando remoto.

Crabbox también termina una invocación local de la CLI de Blacksmith que permanezca en la
fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Configura
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor
en milisegundos para diffs locales inusualmente grandes.

Antes de una primera ejecución, comprueba el wrapper desde la raíz del repositorio:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El wrapper del repositorio rechaza un binario obsoleto de Crabbox que no anuncie `blacksmith-testbox`. Pasa el proveedor explícitamente aunque `.crabbox.yaml` tenga valores predeterminados de nube propia. En worktrees de Codex o checkouts enlazados/parciales, evita el script local `pnpm crabbox:run` porque pnpm puede reconciliar dependencias antes de que Crabbox arranque; invoca directamente el wrapper de node en su lugar:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Las ejecuciones respaldadas por Blacksmith requieren Crabbox 0.22.0 o posterior para que el wrapper obtenga el comportamiento actual de sincronización, cola y limpieza de Testbox. Cuando uses el checkout hermano, recompila el binario local ignorado antes de trabajos de temporización o prueba:

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
`syncDelegated`, `exitCode`, `commandMs` y `totalMs`. Para ejecuciones delegadas de
Blacksmith Testbox, el código de salida del wrapper de Crabbox y el resumen JSON son el
resultado del comando. La ejecución enlazada de GitHub Actions controla la hidratación y el keepalive; puede
terminar como `cancelled` cuando el Testbox se detiene externamente después de que el comando SSH
ya haya devuelto resultado. Trata eso como un artefacto de limpieza/estado salvo que
el `exitCode` del wrapper sea distinto de cero o que la salida del comando muestre una prueba fallida.
Las ejecuciones de Crabbox de un solo uso respaldadas por Blacksmith deberían detener el Testbox automáticamente;
si una ejecución se interrumpe o la limpieza no está clara, inspecciona las cajas activas y detén solo
las cajas que creaste:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Usa la reutilización solo cuando necesites intencionalmente varios comandos en la misma caja hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox es la capa rota pero Blacksmith en sí funciona, usa Blacksmith directo
solo para diagnósticos como `list`, `status` y limpieza. Arregla la ruta de
Crabbox antes de tratar una ejecución directa de Blacksmith como prueba de mantenedor.

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan pero los nuevos
warmups quedan en `queued` sin IP ni URL de ejecución de Actions después de un par de minutos,
trátalo como presión del proveedor, la cola, la facturación o los límites de organización de Blacksmith. Detén los
ids en cola que creaste, evita iniciar más Testboxes y mueve la prueba a la
ruta de capacidad propia de Crabbox siguiente mientras alguien revisa el panel de Blacksmith,
la facturación y los límites de la organización.

Escala a capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, no tenga el entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Bajo presión de AWS, evita `class=beast` salvo que la tarea realmente necesite CPU de clase 48xlarge. Una solicitud `beast` empieza en 192 vCPU y es la forma más fácil de activar la cuota regional de EC2 Spot u On-Demand Standard. El `.crabbox.yaml` propiedad del repositorio usa por defecto `standard`, varias regiones de capacidad y `capacity.hints: true`, de modo que las concesiones de AWS intermediadas imprimen la región/mercado seleccionados, presión de cuota, fallback a Spot y advertencias de clase de alta presión. Usa `fast` para comprobaciones amplias más pesadas, `large` solo después de que standard/fast no sean suficientes y `beast` solo para lanes excepcionales ligadas a CPU, como matrices Docker de suite completa o todos los plugins, validación explícita de release/bloqueador o perfilado de rendimiento con muchos núcleos. No uses `beast` para `pnpm check:changed`, pruebas enfocadas, trabajo solo de documentación, lint/typecheck ordinario, repros E2E pequeños ni triaje de caídas de Blacksmith. Usa `--market on-demand` para diagnóstico de capacidad, de modo que la variación del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` controla los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para lanes de nube propia. Excluye el `.git` local para que el checkout hidratado de Actions mantenga sus propios metadatos Git remotos en lugar de sincronizar remotos y almacenes de objetos locales del mantenedor, y excluye artefactos locales de runtime/build que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` controla el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y la entrega del entorno no secreto para comandos de nube propia `crabbox run --id <cbx_id>`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
