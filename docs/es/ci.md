---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o repetición de validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Gráfico de trabajos de CI, controles de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-06-27T10:49:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 630a787d9855000d49902445982c4d9b458604c2556214afa3f7e90a87804c71
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. Los pushes canónicos a `main` pasan primero por una ventana de admisión de corredor hospedado de 90 segundos.
El grupo de concurrencia `CI` existente cancela esa ejecución en espera cuando llega un commit más nuevo, por lo que las fusiones secuenciales no registran cada una una matriz completa de Blacksmith.
Las pull requests y los despachos manuales omiten la espera. Luego el trabajo `preflight` clasifica el diff y desactiva los carriles costosos cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y expanden el grafo completo para candidatos de versión y validación amplia. Los carriles de Android siguen siendo opcionales mediante `include_android`. La cobertura de plugins solo para lanzamientos vive en el workflow separado [`Prelanzamiento de Plugin`](#plugin-prerelease) y solo se ejecuta desde [`Validación completa de lanzamiento`](#full-release-validation) o un despacho manual explícito.

## Resumen del pipeline

| Trabajo                            | Propósito                                                                                                 | Cuándo se ejecuta                                   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Detectar cambios solo de docs, alcances modificados, extensiones modificadas y crear el manifiesto de CI | Siempre en pushes no borrador y PRs                 |
| `runner-admission`                 | Antirrebote hospedado de 90 segundos para pushes canónicos a `main` antes de registrar trabajo de Blacksmith | Cada ejecución de CI; duerme solo en pushes canónicos a `main` |
| `security-fast`                    | Detección de claves privadas, auditoría de workflows modificados mediante `zizmor` y auditoría de lockfile de producción | Siempre en pushes no borrador y PRs                 |
| `check-dependencies`               | Pasada de Knip solo para dependencias de producción más la guarda de la lista permitida de archivos no usados | Cambios relevantes para Node                        |
| `build-artifacts`                  | Crear `dist/`, Control UI, comprobaciones smoke de CLI compilada, comprobaciones de artefactos compilados embebidos y artefactos reutilizables | Cambios relevantes para Node                        |
| `checks-fast-core`                 | Carriles rápidos de corrección en Linux como bundled, protocol, QA Smoke CI y comprobaciones de enrutamiento de CI | Cambios relevantes para Node                        |
| `checks-fast-contracts-plugins-*`  | Dos comprobaciones fragmentadas de contratos de plugins                                                   | Cambios relevantes para Node                        |
| `checks-fast-contracts-channels-*` | Dos comprobaciones fragmentadas de contratos de canales                                                   | Cambios relevantes para Node                        |
| `checks-node-core-*`               | Fragmentos de pruebas de Node core, excluidos los carriles de canales, bundled, contratos y extensiones  | Cambios relevantes para Node                        |
| `check-*`                          | Equivalente fragmentado de la puerta local principal: tipos de producción, lint, guardas, tipos de pruebas y smoke estricto | Cambios relevantes para Node                        |
| `check-additional-*`               | Arquitectura, drift fragmentado de límites/prompts, guardas de extensiones, límites de paquetes y topología de runtime | Cambios relevantes para Node                        |
| `checks-node-compat-node22`        | Carril de build y smoke de compatibilidad con Node 22                                                     | Despacho manual de CI para lanzamientos             |
| `check-docs`                       | Formato de docs, lint y comprobaciones de enlaces rotos                                                   | Docs modificadas                                    |
| `skills-python`                    | Ruff + pytest para skills respaldadas por Python                                                          | Cambios relevantes para Skills de Python            |
| `checks-windows`                   | Pruebas específicas de proceso/ruta en Windows más regresiones compartidas de especificadores de importación de runtime | Cambios relevantes para Windows                     |
| `macos-node`                       | Carril de pruebas TypeScript en macOS usando los artefactos compilados compartidos                        | Cambios relevantes para macOS                       |
| `macos-swift`                      | Swift lint, build y pruebas para la app de macOS                                                          | Cambios relevantes para macOS                       |
| `ios-build`                        | Generación del proyecto Xcode más build del simulador de la app iOS                                       | App iOS, kit compartido de app o cambios de Swabble |
| `android`                          | Pruebas unitarias de Android para ambos sabores más un build de APK de depuración                         | Cambios relevantes para Android                     |
| `test-performance-agent`           | Optimización diaria de pruebas lentas de Codex después de actividad de confianza                          | Éxito de CI principal o despacho manual             |
| `openclaw-performance`             | Informes de rendimiento diarios/bajo demanda del runtime Kova con carriles mock-provider, deep-profile y live de GPT 5.5 | Programado y despacho manual                        |

## Orden fail-fast

1. `runner-admission` espera solo para pushes canónicos a `main`; un push más nuevo cancela la ejecución antes del registro en Blacksmith.
2. `preflight` decide qué carriles existen. La lógica `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` y `skills-python` fallan rápido sin esperar a los trabajos más pesados de artefactos y matriz de plataformas.
4. `build-artifacts` se superpone con los carriles rápidos de Linux para que los consumidores posteriores puedan empezar en cuanto el build compartido esté listo.
5. Los carriles más pesados de plataformas y runtime se expanden después: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` y `android`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un push más nuevo al mismo PR o ref `main`. Trátalo como ruido de CI salvo que la ejecución más nueva para la misma ref también esté fallando. Los trabajos de matriz usan `fail-fast: false`, y `build-artifacts` informa directamente los fallos embebidos de channel, core-support-boundary y gateway-watch en lugar de encolar trabajos verificadores pequeños. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones principales más nuevas. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

Usa `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` para resumir tiempo de reloj, tiempo de cola, trabajos más lentos, fallos y la barrera de expansión `pnpm-store-warmup` desde GitHub Actions. CI también sube el mismo resumen de ejecución como artefacto `ci-timings-summary`. Para tiempos de build, revisa el paso `Build dist` del trabajo `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e incluye `ui:build`; el trabajo también sube el artefacto `startup-memory`.

Para ejecuciones de pull request, el trabajo terminal de resumen de tiempos ejecuta el helper desde la revisión base de confianza antes de pasar `GH_TOKEN` a `gh run view`. Eso mantiene la consulta con token fuera del código controlado por la rama y aun así resume la ejecución de CI actual de la pull request.

## Contexto y evidencia de PR

Las PRs de contribuidores externos ejecutan una puerta de contexto y evidencia de PR desde
`.github/workflows/real-behavior-proof.yml`. El workflow hace checkout del commit base de confianza y evalúa solo el cuerpo del PR; no ejecuta código de la rama del contribuidor.

La puerta se aplica a autores de PR que no son propietarios, miembros, colaboradores ni bots del repositorio. Pasa cuando el cuerpo del PR contiene secciones redactadas por el autor `What Problem This Solves` y `Evidence`. La evidencia puede ser una prueba enfocada, resultado de CI, captura de pantalla, grabación, salida de terminal, observación en vivo, log redactado o enlace de artefacto. El cuerpo proporciona intención y validación útil; los revisores inspeccionan el código, las pruebas y CI para evaluar la corrección.

Cuando la comprobación falla, actualiza el cuerpo del PR en lugar de enviar otro commit de código.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. El despacho manual omite la detección de alcance modificado y hace que el manifiesto de preflight actúe como si todas las áreas con alcance hubieran cambiado.

- **Ediciones de workflow de CI** validan el grafo de CI de Node más linting de workflows, pero no fuerzan por sí solas builds nativos de Windows, iOS, Android o macOS; esos carriles de plataforma siguen estando acotados a cambios de fuente de plataforma.
- **Workflow Sanity** ejecuta `actionlint`, `zizmor` sobre todos los archivos YAML de workflow, la guarda de interpolación de acciones compuestas y la guarda de marcadores de conflicto. El trabajo `security-fast` acotado al PR también ejecuta `zizmor` sobre archivos de workflow modificados para que los hallazgos de seguridad de workflows fallen temprano en el grafo principal de CI.
- **Docs en pushes a `main`** son comprobadas por el workflow independiente `Docs` con el mismo espejo de docs de ClawHub usado por CI, por lo que los pushes mixtos de código+docs no encolan también el fragmento `check-docs` de CI. Las pull requests y CI manual siguen ejecutando `check-docs` desde CI cuando las docs cambiaron.
- **TUI PTY** se ejecuta en el fragmento Linux Node `checks-node-core-runtime-tui-pty` para cambios de TUI. El fragmento ejecuta `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, por lo que cubre tanto el carril determinista de fixture `TuiBackend` como el smoke más lento `tui --local` que simula solo el endpoint del modelo externo.
- **Ediciones solo de enrutamiento de CI, ediciones seleccionadas y baratas de fixtures de pruebas core, y ediciones estrechas de helpers/enrutamiento de pruebas de contratos de plugins** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una sola tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canales, fragmentos core completos, fragmentos de plugins bundled y matrices de guardas adicionales cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Comprobaciones Node de Windows** están acotadas a wrappers específicos de proceso/ruta de Windows, helpers de runners npm/pnpm/UI, configuración del gestor de paquetes y las superficies de workflow de CI que ejecutan ese carril; los cambios no relacionados de fuente, Plugin, install-smoke y solo de pruebas permanecen en los carriles Linux Node.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada job siga siendo pequeño sin reservar runners en exceso: los contratos de plugins y los contratos de canales se ejecutan cada uno como dos shards ponderados respaldados por Blacksmith con el fallback estándar del runner de GitHub, las lanes rápidas/de soporte de unidades core se ejecutan por separado, la infraestructura runtime core se divide entre state, process/config, shared y tres shards de dominio cron, auto-reply se ejecuta como workers equilibrados (con el subárbol reply dividido en shards agent-runner, dispatch y commands/state-routing), y las configuraciones agentic gateway/server se dividen en lanes chat/auth/model/http-plugin/runtime/startup en lugar de esperar a artefactos compilados. Luego, la CI normal empaqueta solo shards de patrones include de infraestructura aislada en bundles deterministas de como máximo 64 archivos de prueba, reduciendo la matriz de Node sin fusionar suites no aisladas de command/cron, agents-core con estado, o gateway/server; las suites fijas pesadas se mantienen en 8 vCPU mientras que las lanes agrupadas y de menor peso usan 4 vCPU. Las pull requests en el repositorio canónico usan un plan de admisión compacto adicional: los mismos grupos por configuración se ejecutan en subprocesos aislados dentro del plan actual de Linux Node de 34 jobs, por lo que una sola PR no registra la matriz completa de Node de más de 70 jobs. Los pushes a `main`, los dispatches manuales y las puertas de release conservan la matriz completa. Las pruebas amplias de navegador, QA, medios y plugins varios usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los shards de patrones include registran entradas de tiempos usando el nombre del shard de CI, de modo que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un shard filtrado. `check-additional-*` mantiene juntos el trabajo de compilación/canary de límites de paquetes y separa la arquitectura de topología runtime de la cobertura gateway watch; la lista de guardas de límites se distribuye en un shard intensivo en prompts y un shard combinado para las franjas de guardas restantes, cada uno ejecutando guardas independientes seleccionados en paralelo e imprimiendo tiempos por comprobación. La costosa comprobación de drift del snapshot de prompt de la ruta feliz de Codex se ejecuta como su propio job adicional solo para CI manual y para cambios que afectan prompts, por lo que los cambios normales no relacionados de Node no esperan detrás de la generación fría de snapshots de prompt y los shards de límites se mantienen equilibrados mientras el drift de prompt sigue fijado a la PR que lo causó; la misma flag omite la generación Vitest de snapshots de prompt dentro del shard core support-boundary de artefactos compilados. Gateway watch, las pruebas de canales y el shard core support-boundary se ejecutan en paralelo dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén compilados.

Una vez admitida, la CI Linux canónica permite hasta 24 jobs de pruebas de Node
simultáneos y 12 para las lanes rápidas/de checks más pequeñas; Windows y Android
se quedan en dos porque esos grupos de runners son más estrechos.

El plan compacto de PR emite 18 jobs de Node para la suite actual: los grupos
de configuración completa se agrupan en subprocesos aislados con un timeout de
batch de 120 minutos, mientras que los grupos de patrones include comparten el
mismo presupuesto acotado de jobs.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego compila el APK debug de Play. El flavor de terceros no tiene un source set ni manifest separados; su lane de pruebas unitarias aún compila el flavor con las flags BuildConfig de SMS/call-log, mientras evita un job duplicado de empaquetado de APK debug en cada push relevante para Android.

El shard `check-dependencies` ejecuta `pnpm deadcode:dependencies` (un pase de Knip solo de dependencias de producción fijado a la versión más reciente de Knip, con la edad mínima de release de pnpm deshabilitada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos sin usar de producción de Knip con `scripts/deadcode-unused-files.allowlist.mjs`. El guarda de archivos sin usar falla cuando una PR agrega un nuevo archivo sin usar no revisado o deja una entrada obsoleta en la allowlist, mientras preserva superficies intencionales de plugins dinámicos, generadas, de build, de live-test y de puente de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado de destino desde la actividad del repositorio OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código no confiable de pull requests. El workflow crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego despacha payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El workflow tiene cuatro lanes:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

La lane `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de item, URL, título, estado y extractos breves de comentarios o revisiones cuando están presentes. Evita intencionalmente reenviar el cuerpo completo del Webhook. El workflow receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente ClawSweeper recibe el destino de Discord en su prompt y debería publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Aperturas rutinarias, ediciones, ruido de bots, ruido duplicado de Webhook y tráfico normal de revisiones deberían resultar en `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, textos de revisión, nombres de ramas y mensajes de commit de GitHub como datos no confiables a lo largo de esta ruta. Son entrada para resumen y triage, no instrucciones para el workflow ni para el runtime del agente.

## Dispatches manuales

Los dispatches manuales de CI ejecutan el mismo grafo de jobs que la CI normal, pero fuerzan la activación de cada lane con alcance no Android: shards Linux Node, shards de plugins agrupados, shards de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, smoke checks de artefactos compilados, checks de documentación, Skills de Python, Windows, macOS, build de iOS y i18n de Control UI. Los dispatches manuales independientes de CI ejecutan Android solo con `include_android=true`; el paraguas completo de release habilita Android pasando `include_android=true`. Los checks estáticos de prerelease de plugins, el shard solo de release `agentic-plugins`, el barrido completo por lotes de extensiones y las lanes Docker de prerelease de plugins se excluyen de CI. La suite Docker de prerelease se ejecuta solo cuando `Full Release Validation` despacha el workflow separado `Plugin Prerelease` con la puerta de validación de release habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de release candidate no sea cancelada por otro push o ejecución de PR en la misma ref. La entrada opcional `target_ref` permite que un llamador confiable ejecute ese grafo contra una rama, tag o SHA completo de commit mientras usa el archivo de workflow de la ref de dispatch seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Dispatch manual de CI y fallbacks de repositorios no canónicos, escaneos de calidad CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows de documentación fuera de CI, y preflight install-smoke para que la matriz Blacksmith pueda encolarse antes                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards de extensiones de menor peso, `checks-fast-core`, shards de contratos de plugins/canales, la mayoría de shards Linux Node agrupados/de menor peso, `check-guards`, `check-prod-types`, `check-test-types`, shards seleccionados de `check-additional-*` y `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites pesadas retenidas de Linux Node, shards `check-additional-*` intensivos en límites/extensiones y `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); builds Docker de install-smoke (el tiempo de cola de 32 vCPU costaba más de lo que ahorraba)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` en `openclaw/openclaw`; los forks hacen fallback a `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` en `openclaw/openclaw`; los forks hacen fallback a `macos-26`                                                                                                                                                                                                  |

## Presupuesto de registro de runners

El bucket actual de registro de runners de GitHub de OpenClaw permite 3.000
registros de runners self-hosted cada 5 minutos. El límite se comparte entre todos
los registros de runners Blacksmith en la organización `openclaw`, por lo que agregar
otra instalación de Blacksmith no agrega un bucket nuevo.

Trata las etiquetas de Blacksmith como el recurso escaso para el control de ráfagas. Los jobs que
solo enrutan, notifican, resumen, seleccionan shards o ejecutan escaneos breves de CodeQL deberían
mantenerse en runners alojados por GitHub a menos que tengan necesidades específicas de Blacksmith
medidas. Cualquier nueva matriz Blacksmith, `max-parallel` mayor o workflow de alta frecuencia
debe mostrar su conteo de registros en el peor caso y mantener el objetivo a nivel de organización
por debajo de 2.000 registros cada 5 minutos, dejando margen para repositorios concurrentes
y jobs reintentados.

La CI del repositorio canónico mantiene Blacksmith como la ruta de runners predeterminada para ejecuciones normales de push y pull request. Las ejecuciones `workflow_dispatch` y de repositorios no canónicos usan runners alojados por GitHub, pero las ejecuciones canónicas normales actualmente no prueban la salud de la cola de Blacksmith ni hacen fallback automáticamente a etiquetas alojadas por GitHub cuando Blacksmith no está disponible.

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

`OpenClaw Performance` es el flujo de trabajo de rendimiento del producto/runtime. Se ejecuta a diario en `main` y se puede lanzar manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

El lanzamiento manual normalmente mide el ref del flujo de trabajo. Define `target_ref` para medir una etiqueta de versión u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros más recientes se indexan por el ref probado, y cada `index.md` registra el ref/SHA probado, el ref/SHA del flujo de trabajo, el ref de Kova, el perfil, el modo de autorización del carril, el modelo, el número de repeticiones y los filtros de escenario.

El flujo de trabajo instala OCM desde una versión fijada y Kova desde `openclaw/Kova` en la entrada `kova_ref` fijada, y luego ejecuta tres carriles:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autorización falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfilado de CPU/heap/trazas para puntos críticos de arranque, Gateway y turnos de agente.
- `live-openai-candidate`: un turno real de agente OpenAI `openai/gpt-5.5`, omitido cuando `OPENAI_API_KEY` no está disponible.

El carril mock-provider también ejecuta sondas nativas de código fuente de OpenClaw después de la pasada de Kova: tiempos de arranque del Gateway y memoria en casos de inicio predeterminado, con hook y con 50 plugins; RSS de importación de plugins incluidos, bucles repetidos de saludo mock-OpenAI `channel-chat-baseline`, comandos de arranque de la CLI contra el Gateway iniciado y la sonda de rendimiento smoke de estado SQLite. Cuando el informe de código fuente mock-provider publicado anteriormente está disponible para el ref probado, el resumen de código fuente compara los valores actuales de RSS y heap con esa línea base y marca los aumentos grandes de RSS como `watch`. El resumen Markdown de la sonda de código fuente está en `source/index.md` dentro del paquete de informe, con el JSON sin procesar junto a él.

Cada carril sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sonda de código fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual del ref probado se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación de versión completa

`Full Release Validation` es el flujo de trabajo manual paraguas para "ejecutarlo todo antes de la versión". Acepta una rama, etiqueta o SHA de commit completo, lanza el flujo de trabajo manual `CI` con ese objetivo, lanza `Plugin Prerelease` para pruebas exclusivas de versión de plugin/paquete/estático/Docker, y lanza `OpenClaw Release Checks` para smoke de instalación, aceptación de paquete, comprobaciones de paquetes entre sistemas operativos, renderizado de la tarjeta de puntuación de madurez a partir de evidencia del perfil de QA, paridad de QA Lab, Matrix y carriles de Telegram. Los perfiles estable y completo siempre incluyen cobertura exhaustiva live/E2E y soak de la ruta de versión Docker; el perfil beta puede activarla con `run_release_soak=true`. El E2E canónico de Telegram del paquete se ejecuta dentro de Package Acceptance, por lo que un candidato completo no inicia un sondeador live duplicado. Después de publicar, pasa `release_package_spec` para reutilizar el paquete npm enviado en las comprobaciones de versión, Package Acceptance, Docker, entre sistemas operativos y Telegram sin recompilar. Usa `npm_telegram_package_spec` solo para una repetición enfocada de Telegram con paquete publicado. El carril de paquete live del plugin Codex usa el mismo estado seleccionado de forma predeterminada: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mientras que las ejecuciones por SHA/artefacto empaquetan `extensions/codex` desde el ref seleccionado. Define `codex_plugin_spec` explícitamente para fuentes de plugin personalizadas como especificaciones `npm:`, `npm-pack:` o `git:`.

Consulta [Validación de versión completa](/es/reference/full-release-validation) para la matriz de etapas, los nombres exactos de trabajos del flujo de trabajo, las diferencias de perfil, los artefactos y los identificadores de repetición enfocada.

`OpenClaw Release Publish` es el flujo de trabajo manual mutante de publicación de versión. Lánzalo desde `release/YYYY.M.PATCH` o `main` después de que exista la etiqueta de versión y después de que la comprobación preliminar de npm de OpenClaw haya tenido éxito. Verifica `pnpm plugins:sync:check`, lanza `Plugin NPM Release` para todos los paquetes de plugin publicables, lanza `Plugin ClawHub Release` para el mismo SHA de versión y solo entonces lanza `OpenClaw NPM Release` con el `preflight_run_id` guardado. La publicación estable también requiere un `windows_node_tag` exacto; el flujo de trabajo verifica la versión de código fuente de Windows y compara sus instaladores x64/ARM64 con la entrada `windows_node_installer_digests` aprobada para el candidato antes de cualquier hijo de publicación, y luego promociona y verifica esos mismos digests de instaladores fijados junto con el contrato exacto de recurso complementario y suma de verificación antes de publicar el borrador de versión de GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Para pruebas de commit fijado en una rama que avanza rápido, usa el helper en lugar de `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Los refs de lanzamiento de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA de commit sin procesar. El helper sube una rama temporal `release-ci/<sha>-...` en el SHA objetivo, lanza `Full Release Validation` desde ese ref fijado, verifica que cada `headSha` de flujo de trabajo hijo coincida con el objetivo y elimina la rama temporal cuando la ejecución termina. El verificador paraguas también falla si algún flujo de trabajo hijo se ejecutó en un SHA diferente.

`release_profile` controla la amplitud live/proveedor pasada a las comprobaciones de versión. Los flujos de trabajo manuales de versión usan `stable` de forma predeterminada; usa `full` solo cuando quieras intencionalmente la amplia matriz consultiva de proveedores/medios. Las comprobaciones de versión estable y completa siempre ejecutan el soak exhaustivo live/E2E y de la ruta de versión Docker; el perfil beta puede activarlo con `run_release_soak=true`.

- `minimum` conserva los carriles más rápidos críticos para la versión de OpenAI/core.
- `stable` agrega el conjunto estable de proveedores/backends.
- `full` ejecuta la amplia matriz consultiva de proveedores/medios.

El paraguas registra los ids de ejecución hijos lanzados, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y agrega tablas de trabajos más lentos para cada ejecución hija. Si un flujo de trabajo hijo se vuelve a ejecutar y queda en verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado paraguas y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de versión, `ci` solo para el hijo normal de CI completo, `plugin-prerelease` solo para el hijo de prerelease de plugins, `release-checks` para cada hijo de versión, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la repetición de una caja de versión fallida después de una corrección enfocada. Para un carril cross-OS fallido, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos cross-OS largos emiten líneas de Heartbeat y los resúmenes packaged-upgrade incluyen tiempos por fase. Los carriles de comprobación de versión de QA son consultivos, excepto la puerta estándar de cobertura de herramientas de runtime, que bloquea cuando las herramientas dinámicas requeridas de OpenClaw se desvían o desaparecen del resumen del nivel estándar.

`OpenClaw Release Checks` usa el ref confiable del flujo de trabajo para resolver el ref seleccionado una vez en un tarball `release-package-under-test`, y luego pasa ese artefacto a las comprobaciones cross-OS y a Package Acceptance, además del flujo de trabajo Docker live/E2E de ruta de versión cuando se ejecuta la cobertura soak. Eso mantiene consistentes los bytes del paquete entre cajas de versión y evita reempaquetar el mismo candidato en varios trabajos hijos. Para el carril live del plugin npm de Codex, las comprobaciones de versión pasan una especificación de plugin publicado coincidente derivada de `release_package_spec`, pasan el `codex_plugin_spec` suministrado por el operador o dejan la entrada en blanco para que el script Docker empaquete el plugin Codex del checkout seleccionado.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all` sustituyen al paraguas anterior. El monitor padre cancela cualquier flujo de trabajo hijo que ya haya lanzado cuando se cancela el padre, por lo que la validación de main más reciente no queda detrás de una ejecución obsoleta de comprobación de versión de dos horas. La validación de rama/etiqueta de versión y los grupos de repetición enfocada mantienen `cancel-in-progress: false`.

## Shards live y E2E

El hijo live/E2E de versión mantiene una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como shards con nombre mediante `scripts/test-live-shard.mjs` en lugar de un único trabajo serial:

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
- shards de audio/video multimedia divididos y shards de música filtrados por proveedor

Eso mantiene la misma cobertura de archivos a la vez que facilita repetir y diagnosticar fallos lentos de proveedores live. Los nombres de shard agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales de una sola ejecución.

Los shards multimedia nativos live se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, compilado por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos multimedia solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners normales de Blacksmith: los trabajos de contenedor no son el lugar adecuado para iniciar pruebas Docker anidadas.

Los shards de modelo/backend en vivo respaldados por Docker usan una imagen compartida `ghcr.io/openclaw/openclaw-live-test:<sha>` separada por cada commit seleccionado. El flujo de trabajo de lanzamiento en vivo compila y publica esa imagen una vez; luego los shards del modelo en vivo de Docker, Gateway segmentado por proveedor, backend de CLI, enlace ACP y arnés de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards Docker de Gateway llevan límites `timeout` explícitos a nivel de script por debajo del tiempo de espera del job del flujo de trabajo para que un contenedor bloqueado o una ruta de limpieza fallen rápido en lugar de consumir todo el presupuesto de comprobación de lanzamiento. Si esos shards recompilan de forma independiente el destino Docker completo desde el código fuente, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de paquetes

Usa `Package Acceptance` cuando la pregunta sea "¿este paquete instalable de OpenClaw funciona como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo arnés E2E de Docker que los usuarios ejercitan después de instalar o actualizar.

### Jobs

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime la fuente, la ref del flujo de trabajo, la ref del paquete, la versión, el SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con digest del paquete cuando hace falta y ejecuta los carriles Docker seleccionados contra ese paquete en lugar de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego distribuye esos carriles como jobs Docker dirigidos en paralelo con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando la aceptación de paquetes resolvió uno; una ejecución independiente de Telegram todavía puede instalar una especificación npm publicada.
4. `summary` falla el flujo de trabajo si falló la resolución del paquete, la aceptación de Docker o el carril opcional de Telegram.

### Fuentes candidatas

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw como `openclaw@2026.4.27-beta.2`. Úsalo para aceptación de prelanzamientos/estables publicados.
- `source=ref` empaqueta una rama, etiqueta o SHA de commit completo de `package_ref` de confianza. El resolutor obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o desde una etiqueta de lanzamiento, instala dependencias en un worktree separado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS público; `package_sha256` es obligatorio. Esta ruta rechaza credenciales en la URL, puertos HTTPS no predeterminados, nombres de host o IP resueltas privadas/internas/de uso especial, y redirecciones fuera de la misma política de seguridad pública.
- `source=trusted-url` descarga un `.tgz` HTTPS desde una política de fuente confiable con nombre en `.github/package-trusted-sources.json`; `package_sha256` y `trusted_source_id` son obligatorios. Úsalo solo para espejos empresariales propiedad de mantenedores o repositorios de paquetes privados que necesitan hosts, puertos, prefijos de ruta, hosts de redirección o resolución de red privada configurados. Si la política declara autenticación bearer, el flujo de trabajo usa el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; las credenciales incrustadas en la URL siguen rechazándose.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de flujo de trabajo/arnés de confianza que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits de origen confiables más antiguos sin ejecutar lógica antigua del flujo de trabajo.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de lanzamiento Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de Plugin sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad en vivo de ClawHub. El carril opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, y mantiene la ruta de especificación npm publicada para ejecuciones independientes.

Para la política dedicada de pruebas de actualización y Plugin, incluidos comandos locales,
carriles Docker, entradas de aceptación de paquetes, valores predeterminados de lanzamiento y triaje de fallos,
consulta [Probar actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a la aceptación de paquetes con `source=artifact`, el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` y `telegram_mode=mock-openai`. Esto mantiene la migración del paquete, la actualización, la instalación en vivo de Skills de ClawHub, la limpieza de dependencias de Plugin obsoletas, la reparación de instalación de Plugin configurado, el Plugin sin conexión, la actualización de Plugin y la prueba de Telegram sobre el mismo tarball de paquete resuelto. Establece `release_package_spec` en Full Release Validation u OpenClaw Release Checks después de publicar una beta para ejecutar la misma matriz contra el paquete npm enviado sin recompilar; establece `package_acceptance_package_spec` solo cuando la aceptación de paquetes necesita un paquete diferente del resto de la validación de lanzamiento. Las comprobaciones de lanzamiento entre sistemas operativos todavía cubren incorporación, instalador y comportamiento de plataforma específicos del SO; la validación de producto de paquete/actualización debería empezar con la aceptación de paquetes. El carril Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución en la ruta de lanzamiento bloqueante. En la aceptación de paquetes, el tarball `package-under-test` resuelto siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de respaldo, con valor predeterminado `openclaw@latest`; los comandos de reejecución de carriles fallidos preservan esa línea base. Full Release Validation con `run_release_soak=true` o `release_profile=full` establece `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para expandirse por las cuatro versiones estables npm más recientes, además de versiones límite fijadas de compatibilidad de Plugin y fixtures con forma de issues para configuración de Feishu, archivos de bootstrap/persona preservados, instalaciones configuradas de Plugin de OpenClaw, rutas de log con tilde y raíces de dependencias de Plugin heredadas obsoletas. Las selecciones de superviviente de actualización publicada con varias líneas base se dividen por línea base en jobs separados de runner Docker dirigido. El flujo de trabajo separado `Update Migration` usa el carril Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es una limpieza exhaustiva de actualización publicada, no la amplitud normal de CI de Full Release. Las ejecuciones agregadas locales pueden pasar especificaciones de paquete exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantener un solo carril con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o establecer `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El carril publicado configura la línea base con una receta integrada de comando `openclaw config set`, registra los pasos de la receta en `summary.json` y sondea `/healthz`, `/readyz`, además del estado RPC después de iniciar Gateway. Los carriles nuevos de paquete e instalador en Windows también verifican que un paquete instalado pueda importar una sobrescritura de control de navegador desde una ruta absoluta sin procesar de Windows. El smoke de turno de agente OpenAI entre sistemas operativos usa por defecto `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está establecido; de lo contrario, `openai/gpt-5.5`, de modo que la prueba de instalación y Gateway permanezca en un modelo de prueba GPT-5 y evite valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

La aceptación de paquetes tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas QA privadas conocidas en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa marca;
- `update-channel-switch` puede podar `patchedDependencies` de pnpm faltantes desde el fixture de git falso derivado del tarball y puede registrar `update.channel` persistido faltante;
- los smokes de Plugin pueden leer ubicaciones heredadas de registros de instalación o aceptar persistencia faltante de registros de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración mientras sigue exigiendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir sobre archivos de sello de metadatos de compilación local que ya se enviaron. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquetes, empieza por el resumen de `resolve_package` para confirmar la fuente, la versión y el SHA-256 del paquete. Luego inspecciona la ejecución hija de `docker_acceptance` y sus artefactos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de carril, tiempos de fase y comandos de reejecución. Prefiere volver a ejecutar el perfil de paquete fallido o los carriles Docker exactos en lugar de volver a ejecutar la validación completa de lanzamiento.

## Smoke de instalación

El flujo de trabajo separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para solicitudes de incorporación que tocan superficies de Docker/paquetes, cambios de paquete/manifiesto de plugins incluidos, o superficies principales de plugin/canal/gateway/Plugin SDK que ejercitan los trabajos de smoke de Docker. Los cambios de solo código fuente en plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida compila la imagen del Dockerfile raíz una vez, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agentes con workspace compartido, ejecuta el e2e de gateway-network del contenedor, verifica un argumento de compilación de una extensión incluida y ejecuta el perfil acotado de Docker de plugins incluidos bajo un timeout agregado de comando de 240 segundos (cada ejecución de Docker del escenario se limita por separado).
- **Ruta completa** conserva la cobertura de instalación de paquete QR y Docker/actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de lanzamiento con workflow-call y solicitudes de incorporación que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen smoke de GHCR del Dockerfile raíz de un SHA objetivo, luego ejecuta la instalación del paquete QR, smokes del Dockerfile raíz/gateway, smokes de instalador/actualización y el E2E rápido de Docker de plugins incluidos como trabajos separados para que el trabajo del instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos los commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el workflow conserva el smoke rápido de Docker y deja el smoke completo de instalación para la validación nocturna o de lanzamiento.

El smoke lento de proveedor de imagen con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero las solicitudes de incorporación y los pushes a `main` no. La CI normal de PR sigue ejecutando el carril rápido de regresión del lanzador de Bun para cambios relevantes para Node. Las pruebas de Docker de QR e instalador conservan sus propios Dockerfiles enfocados en instalación.

## E2E local de Docker

`pnpm test:docker:all` precompila una imagen compartida de prueba en vivo, empaqueta OpenClaw una vez como tarball de npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner básico de Node/Git para carriles de instalador/actualización/dependencias de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para carriles de funcionalidad normal.

Las definiciones de carriles de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`, y el runner solo ejecuta el plan seleccionado. El programador selecciona la imagen por carril con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, y luego ejecuta carriles con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variable                               | Predeterminado | Propósito                                                                                     |
| -------------------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Cantidad de slots del pool principal para carriles normales.                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Cantidad de slots del pool de cola sensible al proveedor.                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de carriles en vivo concurrentes para que los proveedores no limiten el tráfico.       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5              | Límite de carriles concurrentes de instalación npm.                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de carriles concurrentes multiservicio.                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de carriles para evitar tormentas de creación del demonio Docker; establece `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Timeout de reserva por carril (120 minutos); algunos carriles en vivo/de cola usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin establecer | `1` imprime el plan del programador sin ejecutar carriles.                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin establecer | Lista exacta de carriles separada por comas; omite el smoke de limpieza para que los agentes puedan reproducir un carril fallido. |

Un carril más pesado que su límite efectivo aún puede iniciarse desde un pool vacío y luego ejecutarse solo hasta que libere capacidad. El agregado local hace preflights de Docker, elimina contenedores E2E obsoletos de OpenClaw, emite el estado de carriles activos, persiste tiempos de carriles para ordenar primero los más largos y deja de programar nuevos carriles agrupados tras el primer fallo de forma predeterminada.

### Workflow live/E2E reutilizable

El workflow live/E2E reutilizable pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen live, carril y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y publica imágenes E2E de Docker bare/funcionales de GHCR etiquetadas por digest de paquete mediante la caché de capas de Docker de Blacksmith cuando el plan necesita carriles con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de recompilar. Las descargas de imágenes de Docker se reintentan con un timeout acotado de 180 segundos por intento para que un flujo de registry/caché atascado reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de lanzamiento

La cobertura de Docker de lanzamiento ejecuta trabajos fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento descargue solo el tipo de imagen que necesita y ejecute varios carriles mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos actuales de Docker de lanzamiento son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y `plugins-runtime-install-a` hasta `plugins-runtime-install-h`. `package-update-openai` incluye el carril de paquete live del plugin Codex, que instala el paquete candidato de OpenClaw, instala el plugin Codex desde `codex_plugin_spec` o un tarball de la misma referencia con aprobación explícita de instalación de la CLI de Codex, ejecuta el preflight de la CLI de Codex y luego ejecuta múltiples turnos de agente de OpenClaw en la misma sesión contra OpenAI. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de plugin/runtime. El alias de carril `install-e2e` sigue siendo el alias agregado de reejecución manual para ambos carriles de instalador de proveedor.

OpenWebUI se incorpora en `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Los carriles de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento carga `.artifacts/docker-tests/` con logs de carriles, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del programador, tablas de carriles lentos y comandos de reejecución por carril. La entrada `docker_lanes` del workflow ejecuta carriles seleccionados contra las imágenes preparadas en lugar de los trabajos de fragmentos, lo que mantiene la depuración de carriles fallidos acotada a un trabajo de Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si un carril seleccionado es un carril live de Docker, el trabajo dirigido compila localmente la imagen live-test para esa reejecución. Los comandos de reejecución de GitHub generados por carril incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imágenes preparadas cuando esos valores existen, para que un carril fallido pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # descarga artefactos de Docker e imprime comandos de reejecución dirigidos combinados/por carril
pnpm test:docker:timings <summary>   # resúmenes de carriles lentos y ruta crítica de fases
```

El workflow live/E2E programado ejecuta diariamente el conjunto completo de Docker release-path.

## Prelanzamiento de plugins

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un workflow separado despachado por `Full Release Validation` o por un operador explícito. Las solicitudes de incorporación normales, los pushes a `main` y los despachos manuales independientes de CI mantienen ese conjunto desactivado. Equilibra pruebas de plugins incluidos entre ocho workers de extensiones; esos trabajos de shard de extensiones ejecutan hasta dos grupos de configuración de plugins a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de plugins con muchas importaciones no creen trabajos de CI adicionales. La ruta de prelanzamiento de Docker solo de lanzamiento agrupa carriles de Docker dirigidos en grupos pequeños para evitar reservar docenas de runners para trabajos de uno a tres minutos. El workflow también carga un artefacto informativo `plugin-inspector-advisory` de `@openclaw/plugin-inspector`; los hallazgos del inspector son entrada de triaje y no cambian la puerta bloqueante de Plugin Prerelease.

## QA Lab

QA Lab tiene carriles de CI dedicados fuera del workflow principal de alcance inteligente. La paridad agéntica está anidada bajo los arneses amplios de QA y lanzamiento, no en un workflow independiente de PR. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba acompañar una ejecución amplia de validación.

- El workflow `QA-Lab - All Lanes` se ejecuta cada noche en `main` y en despacho manual; distribuye el carril de paridad mock, el carril live de Matrix y los carriles live de Telegram y Discord como trabajos paralelos. Los trabajos live usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de lanzamiento ejecutan carriles de transporte live de Matrix y Telegram con el proveedor mock determinista y modelos calificados como mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato del canal quede aislado de la latencia del modelo live y del arranque normal del plugin de proveedor. El gateway de transporte live desactiva la búsqueda en memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad del proveedor está cubierta por los conjuntos separados de modelo live, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de lanzamiento, y agrega `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del workflow siguen siendo `all`; el despacho manual `matrix_profile=all` siempre divide la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles críticos de lanzamiento de QA Lab antes de la aprobación del lanzamiento; su puerta de paridad de QA ejecuta los paquetes candidato y de referencia como trabajos de carril paralelos, luego descarga ambos artefactos en un pequeño trabajo de informe para la comparación final de paridad.

Para PRs normales, sigue evidencia de CI/comprobaciones con alcance en lugar de tratar la paridad como un estado requerido.

## CodeQL

El workflow `CodeQL` es intencionalmente un escáner de seguridad de primera pasada acotado, no el barrido completo del repositorio. Las ejecuciones diarias, manuales y de protección de solicitudes de incorporación no borrador escanean código de workflows de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La protección de solicitudes de incorporación se mantiene ligera: solo se inicia para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el workflow programado. CodeQL de Android y macOS queda fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticación, secretos, sandbox, Cron y línea base de Gateway                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del núcleo, más el runtime del Plugin de canal, Gateway, Plugin SDK, secretos y puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies de SSRF del núcleo, análisis de IP, protección de red, web-fetch y política SSRF de Plugin SDK                          |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y compuertas de ejecución de herramientas de agente              |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, instalación con gestor de paquetes, carga de fuentes y contrato de paquete de Plugin SDK |

### Shards de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — shard de seguridad Android programado. Compila manualmente la app de Android para CodeQL en el runner Linux de Blacksmith más pequeño aceptado por la validación básica del workflow. Sube los resultados bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de seguridad macOS semanal/manual. Compila manualmente la app de macOS para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube los resultados bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el shard no relacionado con seguridad correspondiente. Ejecuta solo consultas de calidad JavaScript/TypeScript no relacionadas con seguridad y de severidad de error sobre superficies estrechas de alto valor en runners Linux alojados en GitHub, para que los escaneos de calidad no consuman presupuesto de registro de runners de Blacksmith. Su protección de pull request es intencionalmente más pequeña que el perfil programado: las PR que no son borradores solo ejecutan los shards correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agente y despacho de respuestas, código de esquema/migración/IO de configuración, código de autenticación/secretos/sandbox/seguridad, runtime de canales del núcleo y Plugins de canal incluidos, protocolo Gateway/método de servidor, runtime de memoria/pegamento SDK, MCP/proceso/entrega saliente, runtime de proveedor/catálogo de modelos, diagnósticos de sesión/colas de entrega, cargador de Plugins, contrato de paquete/Plugin SDK o runtime de respuestas de Plugin SDK. Los cambios de configuración de CodeQL y del workflow de calidad ejecutan los doce shards de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son hooks de enseñanza/iteración para ejecutar un shard de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de autenticación, secretos, sandbox, Cron y Gateway                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización e IO                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo Gateway y contratos de métodos de servidor                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canales del núcleo y Plugins de canal incluidos                                                                                     |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos de runtime de ejecución de comandos, despacho de modelo/proveedor, despacho y colas de respuesta automática, y plano de control ACP                       |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de host de memoria, fachadas de runtime de memoria, alias de memoria de Plugin SDK, pegamento de activación de runtime de memoria y comandos doctor de memoria |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de cola de respuestas, colas de entrega de sesión, helpers de vinculación/entrega de sesión saliente, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI de doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes de Plugin SDK, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de vinculación de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización de catálogo de modelos, autenticación y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap de Control UI, persistencia local, flujos de control de Gateway y contratos de runtime del plano de control de tareas                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/search web del núcleo, IO de medios, comprensión de medios, generación de imágenes y generación de medios                            |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y puntos de entrada de Plugin SDK                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fuente publicada del lado del paquete de Plugin SDK y helpers de contrato de paquete de Plugin                                                                     |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin ocultar la señal de seguridad. La expansión de CodeQL para Swift, Python y Plugins incluidos debe agregarse de nuevo como trabajo de seguimiento acotado o fragmentado solo después de que los perfiles estrechos tengan runtime y señal estables.

## Workflows de mantenimiento

### Docs Agent

El workflow `Docs Agent` es un carril de mantenimiento de Codex dirigido por eventos para mantener los documentos existentes alineados con cambios integrados recientemente. No tiene una programación pura: una ejecución de CI exitosa de push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por ejecución de workflow se omiten cuando `main` avanzó o cuando otra ejecución de Docs Agent no omitida fue creada en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA fuente anterior no omitido de Docs Agent hasta el `main` actual, de modo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de docs.

### Test Performance Agent

El workflow `Test Performance Agent` es un carril de mantenimiento de Codex dirigido por eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI exitosa de push no bot en `main` puede activarlo, pero se omite si otra invocación por ejecución de workflow ya se ejecutó o está ejecutándose ese día UTC. El despacho manual evita esa compuerta de actividad diaria. El carril genera un informe de rendimiento agrupado de Vitest para la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven cobertura en lugar de refactors amplios, luego vuelve a ejecutar el informe de la suite completa y rechaza cambios que reduzcan el conteo base de pruebas aprobadas. El informe agrupado registra tiempo de pared por configuración y RSS máximo en Linux y macOS, por lo que la comparación antes/después muestra deltas de memoria de pruebas junto a deltas de duración. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe posterior del agente para la suite completa debe pasar antes de confirmar cualquier cambio. Cuando `main` avanza antes de que aterrice el push del bot, el carril rebasa el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflicto se omiten. Usa Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad drop-sudo que el agente de docs.

### PR duplicadas después del merge

El workflow `Duplicate PRs After Merge` es un workflow manual de mantenedor para limpieza de duplicados posterior al aterrizaje. De forma predeterminada ejecuta en modo dry-run y solo cierra las PR listadas explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que la PR aterrizada esté fusionada y que cada duplicado tenga un issue referenciado compartido o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Compuertas de checks locales y enrutamiento de cambios

La lógica local de carriles modificados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa compuerta local de checks es más estricta sobre límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan typecheck de producción del núcleo y pruebas del núcleo, más lint/guardas del núcleo;
- los cambios solo de pruebas del núcleo ejecutan solo typecheck de pruebas del núcleo, más lint del núcleo;
- los cambios de producción de extensiones ejecutan typecheck de producción de extensiones y pruebas de extensiones, más lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan typecheck de pruebas de extensiones, más lint de extensiones;
- los cambios públicos de Plugin SDK o contrato de Plugin se expanden al typecheck de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los incrementos de versión solo de metadatos de release ejecutan checks dirigidos de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todos los carriles de checks.

El enrutamiento local de pruebas modificadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas; las ediciones de fuente prefieren mapeos explícitos, luego pruebas hermanas y dependientes del grafo de imports. La configuración compartida de entrega de salas de grupo es uno de los mapeos explícitos: los cambios en la configuración de respuestas visibles para el grupo, el modo de entrega de respuestas de fuente o el prompt de sistema de la herramienta de mensajes pasan por las pruebas de respuestas del núcleo, más regresiones de entrega de Discord y Slack, para que un cambio predeterminado compartido falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el harness como para que el conjunto mapeado barato no sea un proxy confiable.

## Validación con Testbox

Crabbox es el wrapper de caja remota propiedad del repo para prueba de Linux de mantenedores. Úsalo
desde la raíz del repo cuando un check sea demasiado amplio para un ciclo local de edición, cuando importe
la paridad con CI, o cuando la prueba necesite secretos, Docker, carriles de paquetes,
cajas reutilizables o logs remotos. El backend normal de OpenClaw es
`blacksmith-testbox`; la capacidad propia de AWS/Hetzner es una reserva para interrupciones de Blacksmith,
problemas de cuota o pruebas explícitas con capacidad propia.

Crabbox respaldado por Blacksmith calienta, reclama, sincroniza, ejecuta, informa y limpia
Testboxes de un solo uso. La comprobación de coherencia de sincronización integrada falla rápido cuando desaparecen archivos raíz requeridos
como `pnpm-lock.yaml` o cuando `git status --short`
muestra al menos 200 eliminaciones rastreadas. Para PRs intencionales con muchas eliminaciones, define
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para el comando remoto.

Crabbox también termina una invocación local de la CLI de Blacksmith que permanece en la
fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Define
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor
en milisegundos para diffs locales inusualmente grandes.

Antes de una primera ejecución, comprueba el wrapper desde la raíz del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El wrapper del repo rechaza un binario de Crabbox obsoleto que no anuncia `blacksmith-testbox`. Pasa el proveedor explícitamente aunque `.crabbox.yaml` tenga valores predeterminados de nube propia. En worktrees de Codex o checkouts enlazados/dispersos, evita el script local `pnpm crabbox:run` porque pnpm puede reconciliar dependencias antes de que Crabbox arranque; invoca directamente el wrapper de Node en su lugar:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Las ejecuciones respaldadas por Blacksmith requieren Crabbox 0.22.0 o posterior para que el wrapper obtenga el comportamiento actual de sincronización, cola y limpieza de Testbox. Al usar el checkout hermano, recompila el binario local ignorado antes de trabajos de medición o prueba:

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

Lee el resumen JSON final. Los campos útiles son `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` y `totalMs`. Las ejecuciones de Crabbox de un solo uso respaldadas por Blacksmith deberían detener el Testbox automáticamente; si una ejecución se interrumpe o la limpieza no está clara, inspecciona las cajas activas y detén solo las cajas que creaste:

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
solo para diagnósticos como `list`, `status` y limpieza. Arregla la
ruta de Crabbox antes de tratar una ejecución directa de Blacksmith como prueba de mantenedor.

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan pero los nuevos
calentamientos quedan `queued` sin IP ni URL de ejecución de Actions después de un par de minutos,
trátalo como presión del proveedor Blacksmith, cola, facturación o límite de organización. Detén los
ids en cola que creaste, evita iniciar más Testboxes y mueve la prueba a la
ruta de capacidad propia de Crabbox de abajo mientras alguien revisa el panel de Blacksmith,
la facturación y los límites de la organización.

Escala a capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, le falte el entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Bajo presión de AWS, evita `class=beast` a menos que la tarea realmente necesite CPU de clase 48xlarge. Una solicitud `beast` empieza en 192 vCPU y es la forma más fácil de activar la cuota regional de EC2 Spot u On-Demand Standard. El `.crabbox.yaml` propiedad del repo usa por defecto `standard`, varias regiones de capacidad y `capacity.hints: true`, de modo que los arrendamientos de AWS intermediados imprimen la región/mercado seleccionado, la presión de cuota, el fallback de Spot y advertencias de clase de alta presión. Usa `fast` para comprobaciones amplias más pesadas, `large` solo después de que standard/fast no sean suficientes, y `beast` solo para carriles excepcionales dependientes de CPU, como matrices Docker de suite completa o todos los plugins, validación explícita de release/bloqueador o perfilado de rendimiento con muchos núcleos. No uses `beast` para `pnpm check:changed`, pruebas enfocadas, trabajo solo de docs, lint/typecheck ordinario, reproducciones E2E pequeñas o triaje de caída de Blacksmith. Usa `--market on-demand` para diagnóstico de capacidad, para que la rotación del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` posee los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para carriles de nube propia. Excluye `.git` local para que el checkout hidratado de Actions mantenga sus propios metadatos Git remotos en lugar de sincronizar remotos y almacenes de objetos locales de mantenedor, y excluye artefactos locales de runtime/build que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` posee el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y el traspaso de entorno no secreto para comandos de nube propia `crabbox run --id <cbx_id>`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
