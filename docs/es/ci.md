---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o repetición de validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, puertas de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-07-02T13:57:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc5ce77eadea695e98926326767dde4c8ea2d19c69a4c782d164e0f87201b227
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada solicitud de extracción. Los pushes canónicos a
`main` pasan primero por una ventana de admisión de 90 segundos en ejecutores alojados.
El grupo de concurrencia `CI` existente cancela esa ejecución en espera cuando llega un commit
más nuevo, por lo que las fusiones secuenciales no registran cada una una matriz completa de Blacksmith.
Las solicitudes de extracción y los despachos manuales omiten la espera. Luego, la tarea `preflight`
clasifica el diff y desactiva los carriles costosos cuando solo cambiaron áreas no relacionadas.
Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente
y despliegan el grafo completo para candidatos de lanzamiento y validación amplia. Los carriles de Android
siguen siendo optativos mediante `include_android`. La cobertura de Plugin solo para lanzamientos
vive en el flujo de trabajo separado [`Prelanzamiento de Plugin`](#plugin-prerelease)
y solo se ejecuta desde [`Validación de lanzamiento completo`](#full-release-validation)
o un despacho manual explícito.

## Descripción general del pipeline

| Tarea                              | Propósito                                                                                                 | Cuándo se ejecuta                                  |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `preflight`                        | Detectar cambios solo de documentación, alcances cambiados, extensiones cambiadas y crear el manifiesto de CI | Siempre en pushes y PRs que no sean borradores     |
| `runner-admission`                 | Debounce alojado de 90 segundos para pushes canónicos a `main` antes de registrar trabajo de Blacksmith    | En cada ejecución de CI; espera solo en pushes canónicos a `main` |
| `security-fast`                    | Detección de claves privadas, auditoría de flujos de trabajo cambiados mediante `zizmor` y auditoría del lockfile de producción | Siempre en pushes y PRs que no sean borradores     |
| `check-dependencies`               | Pasada de Knip solo para dependencias de producción más la guarda de lista permitida de archivos sin usar  | Cambios relevantes para Node                       |
| `build-artifacts`                  | Crear `dist/`, Control UI, comprobaciones rápidas de CLI compilada, comprobaciones de artefactos compilados embebidos y artefactos reutilizables | Cambios relevantes para Node                       |
| `checks-fast-core`                 | Carriles rápidos de corrección en Linux, como bundled, protocolo, QA Smoke CI y comprobaciones de enrutamiento de CI | Cambios relevantes para Node                       |
| `checks-fast-contracts-plugins-*`  | Dos comprobaciones fragmentadas de contratos de Plugin                                                     | Cambios relevantes para Node                       |
| `checks-fast-contracts-channels-*` | Dos comprobaciones fragmentadas de contratos de canales                                                    | Cambios relevantes para Node                       |
| `checks-node-core-*`               | Fragmentos de pruebas de Node del núcleo, excluyendo carriles de canal, bundled, contrato y extensión      | Cambios relevantes para Node                       |
| `check-*`                          | Equivalente fragmentado de la puerta local principal: tipos de producción, lint, guardas, tipos de pruebas y smoke estricto | Cambios relevantes para Node                       |
| `check-additional-*`               | Arquitectura, drift fragmentado de límites/prompts, guardas de extensión, límite de paquetes y topología de runtime | Cambios relevantes para Node                       |
| `checks-node-compat-node22`        | Carril de compilación y smoke de compatibilidad con Node 22                                                | Despacho manual de CI para lanzamientos            |
| `check-docs`                       | Formato, lint y comprobaciones de enlaces rotos de la documentación                                        | Documentación cambiada                             |
| `skills-python`                    | Ruff + pytest para Skills respaldadas por Python                                                          | Cambios relevantes para Skills de Python           |
| `checks-windows`                   | Pruebas específicas de Windows para procesos/rutas más regresiones compartidas de especificadores de importación de runtime | Cambios relevantes para Windows                    |
| `macos-node`                       | Carril de pruebas TypeScript de macOS usando los artefactos compilados compartidos                         | Cambios relevantes para macOS                      |
| `macos-swift`                      | Lint, compilación y pruebas de Swift para la app de macOS                                                  | Cambios relevantes para macOS                      |
| `ios-build`                        | Generación del proyecto Xcode más compilación de la app iOS en simulador                                  | App iOS, kit de app compartido o cambios en Swabble |
| `android`                          | Pruebas unitarias de Android para ambos sabores más una compilación de APK de depuración                   | Cambios relevantes para Android                    |
| `test-performance-agent`           | Optimización diaria de pruebas lentas de Codex después de actividad confiable                             | Éxito de CI principal o despacho manual            |
| `openclaw-performance`             | Informes diarios/bajo demanda de rendimiento del runtime de Kova con carriles de proveedor simulado, perfil profundo y GPT 5.5 en vivo | Programado y despacho manual                       |

## Orden de fail-fast

1. `runner-admission` espera solo para pushes canónicos a `main`; un push más nuevo cancela la ejecución antes del registro de Blacksmith.
2. `preflight` decide qué carriles existen. La lógica de `docs-scope` y `changed-scope` son pasos dentro de esta tarea, no tareas independientes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` y `skills-python` fallan rápidamente sin esperar a las tareas más pesadas de artefactos y matriz de plataformas.
4. `build-artifacts` se solapa con los carriles rápidos de Linux para que los consumidores posteriores puedan empezar en cuanto la compilación compartida esté lista.
5. Los carriles más pesados de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` y `android`.

GitHub puede marcar tareas reemplazadas como `cancelled` cuando llega un push más nuevo al mismo PR o ref de `main`. Trata eso como ruido de CI a menos que la ejecución más nueva para el mismo ref también esté fallando. Las tareas de matriz usan `fail-fast: false`, y `build-artifacts` informa directamente los fallos embebidos de channel, core-support-boundary y gateway-watch en lugar de poner en cola tareas verificadoras pequeñas. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones más nuevas de main. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

Usa `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` para resumir tiempo de pared, tiempo de cola, tareas más lentas, fallos y la barrera de despliegue `pnpm-store-warmup` desde GitHub Actions. CI también sube el mismo resumen de ejecución como artefacto `ci-timings-summary`. Para tiempos de compilación, revisa el paso `Build dist` de la tarea `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e incluye `ui:build`; la tarea también sube el artefacto `startup-memory`.

Para ejecuciones de solicitudes de extracción, la tarea terminal de resumen de tiempos ejecuta el helper desde la revisión base confiable antes de pasar `GH_TOKEN` a `gh run view`. Eso mantiene la consulta con token fuera del código controlado por la rama mientras sigue resumiendo la ejecución de CI actual de la solicitud de extracción.

## Contexto y evidencia de PR

Los PRs de contribuidores externos ejecutan una puerta de contexto y evidencia de PR desde
`.github/workflows/real-behavior-proof.yml`. El flujo de trabajo hace checkout del commit base confiable
y evalúa solo el cuerpo del PR; no ejecuta código de la rama del contribuidor.

La puerta se aplica a autores de PR que no son propietarios, miembros,
colaboradores ni bots del repositorio. Pasa cuando el cuerpo del PR contiene secciones redactadas por el autor
`What Problem This Solves` y `Evidence`. La evidencia puede ser una prueba enfocada,
resultado de CI, captura de pantalla, grabación, salida de terminal, observación en vivo,
registro redactado o enlace de artefacto. El cuerpo proporciona intención y validación útil;
los revisores inspeccionan el código, las pruebas y CI para evaluar la corrección.

Cuando la comprobación falla, actualiza el cuerpo del PR en lugar de enviar otro commit de código.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. El despacho manual omite la detección de alcance cambiado y hace que el manifiesto de preflight actúe como si todas las áreas con alcance hubieran cambiado.

- **Ediciones de flujos de trabajo de CI** validan el grafo de CI de Node más el lint de flujos de trabajo, pero no fuerzan por sí solas compilaciones nativas de Windows, iOS, Android o macOS; esos carriles de plataforma siguen limitados a cambios de código fuente de plataforma.
- **Sanidad de flujos de trabajo** ejecuta `actionlint`, `zizmor` sobre todos los archivos YAML de flujos de trabajo, la guarda de interpolación de acciones compuestas y la guarda de marcadores de conflicto. La tarea `security-fast` con alcance de PR también ejecuta `zizmor` sobre archivos de flujo de trabajo cambiados para que los hallazgos de seguridad de flujos de trabajo fallen temprano en el grafo principal de CI.
- **Documentación en pushes a `main`** se comprueba mediante el flujo de trabajo independiente `Docs` con el mismo espejo de documentación de ClawHub usado por CI, por lo que los pushes mixtos de código+documentación no ponen también en cola el fragmento `check-docs` de CI. Las solicitudes de extracción y la CI manual siguen ejecutando `check-docs` desde CI cuando cambió la documentación.
- **TUI PTY** se ejecuta en el fragmento Linux Node `checks-node-core-runtime-tui-pty` para cambios de TUI. El fragmento ejecuta `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, por lo que cubre tanto el carril determinista de fixture `TuiBackend` como el smoke más lento `tui --local` que simula solo el endpoint externo del modelo.
- **Ediciones solo de enrutamiento de CI, ediciones seleccionadas y baratas de fixtures de pruebas del núcleo, y ediciones acotadas de helpers/enrutamiento de pruebas de contratos de Plugin** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una única tarea `checks-fast-core`. Esa ruta omite artefactos de compilación, compatibilidad con Node 22, contratos de canal, fragmentos completos del núcleo, fragmentos de plugins bundled y matrices adicionales de guardas cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Comprobaciones de Node en Windows** se limitan a wrappers de procesos/rutas específicos de Windows, helpers de ejecutores npm/pnpm/UI, configuración del gestor de paquetes y superficies de flujos de trabajo de CI que ejecutan ese carril; los cambios no relacionados de código fuente, Plugin, smoke de instalación y solo de pruebas permanecen en los carriles Linux Node.

La familias de pruebas de Node más lentas se dividen o equilibran para que cada job se mantenga pequeño sin reservar runners en exceso: los contratos de plugins y los contratos de canales se ejecutan cada uno como dos shards ponderados respaldados por Blacksmith con el fallback estándar de runners de GitHub, las lanes rápidas/de soporte de unidades core se ejecutan por separado, la infraestructura de runtime core se divide entre estado, proceso/configuración, compartido y tres shards de dominio cron, auto-reply se ejecuta como workers equilibrados (con el subárbol de respuestas dividido en shards de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic de gateway/server se dividen entre lanes de chat/auth/model/http-plugin/runtime/startup en lugar de esperar a artefactos construidos. Luego la CI normal empaqueta solo shards aislados de patrones de inclusión de infraestructura en bundles deterministas de como máximo 64 archivos de prueba, lo que reduce la matriz de Node sin fusionar suites no aisladas de comandos/cron, agents-core con estado ni gateway/server; las suites fijas pesadas permanecen en 8 vCPU, mientras que las lanes empaquetadas y de menor peso usan 4 vCPU. Las solicitudes de incorporación de cambios en el repositorio canónico usan un plan compacto adicional de admisión: los mismos grupos por configuración se ejecutan en subprocesos aislados dentro del plan actual de 34 jobs de Linux Node, por lo que una sola PR no registra la matriz completa de Node de más de 70 jobs. Los pushes a `main`, los despachos manuales y las puertas de release conservan la matriz completa. Las pruebas amplias de navegador, QA, medios y plugins misceláneos usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los shards de patrones de inclusión registran entradas de tiempos usando el nombre del shard de CI, por lo que `.artifacts/vitest-shard-timings.json` puede distinguir una configuración completa de un shard filtrado. `check-additional-*` mantiene junto el trabajo de compilación/canary de límites de paquete y separa la arquitectura de topología de runtime de la cobertura de observación del Gateway; la lista de guards de límites se reparte en un shard con mucha carga de prompts y un shard combinado para las franjas de guards restantes, cada uno ejecutando guards independientes seleccionados de forma concurrente e imprimiendo tiempos por comprobación. La costosa comprobación de deriva de snapshots de prompts del happy path de Codex se ejecuta como su propio job adicional solo para CI manual y para cambios que afectan prompts, por lo que los cambios normales no relacionados de Node no esperan detrás de la generación fría de snapshots de prompts y los shards de límites permanecen equilibrados, mientras que la deriva de prompts sigue fijada a la PR que la causó; la misma flag omite la generación de Vitest para snapshots de prompts dentro del shard de límites de soporte core con artefactos construidos. Gateway watch, las pruebas de canales y el shard de límites de soporte core se ejecutan de forma concurrente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya están construidos.

Una vez admitida, la CI canónica de Linux permite hasta 24 jobs concurrentes de pruebas de Node y
12 para las lanes rápidas/de comprobación más pequeñas; Windows y Android se mantienen en dos porque
esos pools de runners son más estrechos.

El plan compacto de PR emite 18 jobs de Node para la suite actual: los grupos de configuración completa
se agrupan en lotes en subprocesos aislados con un timeout de lote de 120 minutos,
mientras que los grupos de patrones de inclusión comparten el mismo presupuesto acotado de jobs.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego construye el APK de depuración de Play. El flavor de terceros no tiene un source set ni manifest separados; su lane de pruebas unitarias sigue compilando el flavor con las flags de BuildConfig de SMS/call-log, mientras evita un job duplicado de empaquetado de APK de depuración en cada push relevante para Android.

El shard `check-dependencies` ejecuta `pnpm deadcode:dependencies` (un pase de Knip solo de dependencias de producción fijado a la versión más reciente de Knip, con la edad mínima de release de pnpm deshabilitada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos sin usar de producción de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. El guard de archivos sin usar falla cuando una PR añade un nuevo archivo sin usar no revisado o deja una entrada obsoleta en la allowlist, mientras preserva superficies intencionales de plugins dinámicos, generadas, de build, pruebas live y puentes de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado destino desde la actividad del repositorio OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código de pull requests no confiables. El workflow crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego despacha payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El workflow tiene cuatro lanes:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

La lane `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando están presentes. Evita intencionalmente reenviar el cuerpo completo del Webhook. El workflow receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente ClawSweeper.

La actividad general es observación, no entrega predeterminada. El agente ClawSweeper recibe el destino de Discord en su prompt y debe publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Las aperturas rutinarias, ediciones, churn de bots, ruido duplicado de Webhook y tráfico normal de revisión deben resultar en `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisión, nombres de ramas y mensajes de commit de GitHub como datos no confiables en toda esta ruta. Son entrada para resumen y triaje, no instrucciones para el workflow ni el runtime del agente.

## Despachos manuales

Los despachos manuales de CI ejecutan el mismo grafo de jobs que la CI normal, pero fuerzan la activación de cada lane con alcance no Android: shards de Linux Node, shards de plugins empaquetados, shards de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones smoke de artefactos construidos, comprobaciones de docs, Skills de Python, Windows, macOS, build de iOS y i18n de Control UI. Los despachos manuales independientes de CI ejecutan Android solo con `include_android=true`; el paraguas completo de release habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prerelease de plugins, el shard exclusivo de release `agentic-plugins`, el barrido completo por lotes de extensiones y las lanes Docker de prerelease de plugins se excluyen de la CI. La suite Docker de prerelease se ejecuta solo cuando `Full Release Validation` despacha el workflow separado `Plugin Prerelease` con la puerta de validación de release habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidato a release no sea cancelada por otro push o ejecución de PR en la misma ref. La entrada opcional `target_ref` permite que un llamador confiable ejecute ese grafo contra una rama, etiqueta o SHA de commit completo mientras usa el archivo de workflow desde la ref de dispatch seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                          | Jobs                                                                                                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                  | Despacho manual de CI y fallbacks de repositorios no canónicos, escaneos de calidad CodeQL de JavaScript/actions, workflow-sanity, labeler, auto-response, workflows de docs fuera de CI y preflight de install-smoke para que la matriz de Blacksmith pueda encolarse antes                                       |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, shards de extensiones de menor peso, `checks-fast-core`, shards de contratos de plugins/canales, la mayoría de shards empaquetados/de menor peso de Linux Node, `check-guards`, `check-prod-types`, `check-test-types`, shards seleccionados de `check-additional-*` y `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites pesadas de Linux Node retenidas, shards `check-additional-*` pesados en límites/extensiones, y `android`                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404` | `build-artifacts`, `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); builds Docker de install-smoke (el tiempo de cola de 32 vCPU costó más de lo que ahorró)                                                                                                               |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-15`     | `macos-node` en `openclaw/openclaw`; los forks hacen fallback a `macos-15`                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` en `openclaw/openclaw`; los forks hacen fallback a `macos-26`                                                                                                                                                                                                  |

## Presupuesto de registro de runners

El bucket actual de registro de runners de GitHub de OpenClaw informa 10.000 registros de runners
self-hosted por 5 minutos en `ghx api rate_limit`. Vuelve a comprobar
`actions_runner_registration` antes de cada pase de ajuste porque GitHub puede cambiar
este bucket. El límite es compartido por todos los registros de runners de Blacksmith en la
organización `openclaw`, por lo que añadir otra instalación de Blacksmith no añade
un bucket nuevo.

Trata las labels de Blacksmith como el recurso escaso para el control de ráfagas. Los jobs que
solo enrutan, notifican, resumen, seleccionan shards o ejecutan escaneos cortos de CodeQL deben
permanecer en runners alojados en GitHub a menos que tengan necesidades medidas específicas de Blacksmith.
Cualquier matriz nueva de Blacksmith, `max-parallel` más grande o workflow de alta frecuencia
debe mostrar su conteo de registros en el peor caso y mantener el objetivo a nivel de organización
por debajo de aproximadamente el 60% del bucket en vivo. Con el bucket actual de 10.000 registros,
eso significa un objetivo operativo de 6.000 registros, dejando margen para
repositorios concurrentes, reintentos y solapamiento de ráfagas.

La CI del repositorio canónico mantiene Blacksmith como la ruta de runners predeterminada para ejecuciones normales de push y pull request. `workflow_dispatch` y las ejecuciones de repositorios no canónicos usan runners alojados en GitHub, pero las ejecuciones canónicas normales no sondean actualmente el estado de la cola de Blacksmith ni hacen fallback automáticamente a labels alojadas en GitHub cuando Blacksmith no está disponible.

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

`OpenClaw Performance` es el flujo de trabajo de rendimiento del producto/runtime. Se ejecuta a diario en `main` y se puede despachar manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

El despacho manual normalmente mide el ref del flujo de trabajo. Define `target_ref` para medir una etiqueta de release u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros más recientes se indexan por el ref probado, y cada `index.md` registra el ref/SHA probado, el ref/SHA del flujo de trabajo, el ref de Kova, el perfil, el modo de autorización de lane, el modelo, el recuento de repeticiones y los filtros de escenarios.

El flujo de trabajo instala OCM desde una release fijada y Kova desde `openclaw/Kova` en la entrada `kova_ref` fijada, y luego ejecuta tres lanes:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfilado de CPU/heap/trazas para puntos críticos de arranque, gateway y turnos de agente.
- `live-openai-candidate`: un turno real de agente OpenAI `openai/gpt-5.5`, omitido cuando `OPENAI_API_KEY` no está disponible.

La lane mock-provider también ejecuta sondeos de código fuente nativos de OpenClaw después del paso de Kova: tiempos de arranque del gateway y memoria en casos de arranque predeterminado, con hook y con 50 Plugins; RSS de importación de Plugins incluidos; bucles repetidos de saludo `channel-chat-baseline` con OpenAI simulado; comandos de arranque de CLI contra el gateway iniciado; y el sondeo de rendimiento smoke del estado SQLite. Cuando el informe de código fuente mock-provider publicado anteriormente está disponible para el ref probado, el resumen de código fuente compara los valores actuales de RSS y heap contra esa línea base y marca los aumentos grandes de RSS como `watch`. El resumen Markdown del sondeo de código fuente vive en `source/index.md` dentro del paquete de informe, con el JSON sin procesar junto a él.

Cada lane sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondeo de código fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual del ref probado se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación completa de release

`Full Release Validation` es el flujo de trabajo manual paraguas para "ejecutar todo antes de la release". Acepta una rama, etiqueta o SHA completo de commit, despacha el flujo de trabajo manual `CI` con ese objetivo, despacha `Plugin Prerelease` para prueba de Plugins/paquetes/estáticos/Docker exclusiva de release, y despacha `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, renderizado del cuadro de puntuación de madurez desde evidencia de perfil QA, paridad de QA Lab, Matrix y lanes de Telegram. Los perfiles stable y full siempre incluyen cobertura exhaustiva de live/E2E y soak de ruta de release en Docker; el perfil beta puede optar por incluirla con `run_release_soak=true`. El E2E canónico de Telegram de paquete se ejecuta dentro de Package Acceptance, por lo que un candidato completo no inicia un sondeador live duplicado. Después de publicar, pasa `release_package_spec` para reutilizar el paquete npm enviado en release checks, Package Acceptance, Docker, entre sistemas operativos y Telegram sin recompilar. Usa `npm_telegram_package_spec` solo para una repetición enfocada de Telegram con paquete publicado. La lane de paquete live del Plugin Codex usa el mismo estado seleccionado de forma predeterminada: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mientras que las ejecuciones SHA/artefacto empaquetan `extensions/codex` desde el ref seleccionado. Define `codex_plugin_spec` explícitamente para fuentes de Plugin personalizadas como especificaciones `npm:`, `npm-pack:` o `git:`.

Consulta [Validación completa de release](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos del flujo de trabajo, las diferencias de perfil, los artefactos y
los identificadores de repetición enfocada.

`OpenClaw Release Publish` es el flujo de trabajo manual mutante de release. Despáchalo
desde `release/YYYY.M.PATCH` o `main` después de que exista la etiqueta de release y después de que la
preflight de npm de OpenClaw haya tenido éxito. Verifica `pnpm plugins:sync:check`,
despacha `Plugin NPM Release` para todos los paquetes de Plugins publicables, despacha
`Plugin ClawHub Release` para el mismo SHA de release, y solo entonces despacha
`OpenClaw NPM Release` con el `preflight_run_id` guardado. La publicación stable también
requiere un `windows_node_tag` exacto; el flujo de trabajo verifica la release fuente de Windows
y compara sus instaladores x64/ARM64 con la entrada
`windows_node_installer_digests` aprobada para el candidato antes de cualquier hijo de publicación, luego promociona
y verifica esos mismos resúmenes de instalador fijados más el contrato exacto de activo complementario
y suma de comprobación antes de publicar el borrador de release de GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Para prueba de commit fijado en una rama que avanza rápido, usa el helper en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Los refs de despacho de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA de commit sin procesar. El
helper empuja una rama temporal `release-ci/<sha>-...` en el SHA objetivo,
despacha `Full Release Validation` desde ese ref fijado, verifica que cada
`headSha` de flujo de trabajo hijo coincida con el objetivo y elimina la rama temporal cuando la
ejecución se completa. El verificador paraguas también falla si algún flujo de trabajo hijo se ejecutó en un
SHA diferente.

`release_profile` controla la amplitud live/proveedor pasada a las comprobaciones de release. Los
flujos de trabajo manuales de release tienen `stable` como valor predeterminado; usa `full` solo cuando
quieras intencionalmente la matriz amplia consultiva de proveedor/medios. Las comprobaciones de release
stable y full siempre ejecutan el soak exhaustivo live/E2E y Docker de ruta de release;
el perfil beta puede optar por incluirlo con `run_release_soak=true`.

- `minimum` conserva las lanes más rápidas críticas para release de OpenAI/core.
- `stable` agrega el conjunto stable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedor/medios.

El paraguas registra los ids de ejecución de los hijos despachados, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y añade tablas de trabajos más lentos para cada ejecución hija. Si un flujo de trabajo hijo se vuelve a ejecutar y queda verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado paraguas y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de release, `ci` solo para el hijo normal de CI completo, `plugin-prerelease` solo para el hijo de prerelease de Plugins, `release-checks` para cada hijo de release, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la repetición de una caja de release fallida después de una corrección enfocada. Para una lane entre sistemas operativos fallida, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos largos entre sistemas operativos emiten líneas Heartbeat y los resúmenes packaged-upgrade incluyen tiempos por fase. Las lanes de QA de release-check son consultivas, excepto la puerta estándar de cobertura de herramientas de runtime, que bloquea cuando las herramientas dinámicas requeridas de OpenClaw derivan o desaparecen del resumen de nivel estándar.

`OpenClaw Release Checks` usa el ref confiable del flujo de trabajo para resolver el ref seleccionado una vez en un tarball `release-package-under-test`, y luego pasa ese artefacto a comprobaciones entre sistemas operativos y a Package Acceptance, además del flujo de trabajo Docker live/E2E de ruta de release cuando se ejecuta la cobertura soak. Eso mantiene los bytes del paquete consistentes entre cajas de release y evita reempaquetar el mismo candidato en varios trabajos hijos. Para la lane live del Plugin npm de Codex, las comprobaciones de release pasan una especificación de Plugin publicado coincidente derivada de `release_package_spec`, pasan el `codex_plugin_spec` suministrado por el operador, o dejan la entrada en blanco para que el script Docker empaquete el Plugin Codex del checkout seleccionado.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
sustituyen al paraguas anterior. El monitor padre cancela cualquier flujo de trabajo hijo que
ya haya despachado cuando se cancela el padre, así que la validación más nueva de main
no queda detrás de una ejecución obsoleta de release-check de dos horas. La validación de ramas/etiquetas
de release y los grupos de repetición enfocada mantienen `cancel-in-progress: false`.

## Fragmentos live y E2E

El hijo live/E2E de release mantiene una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como fragmentos nombrados mediante `scripts/test-live-shard.mjs` en lugar de un solo trabajo serial:

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
- fragmentos divididos de audio/vídeo de medios y fragmentos de música filtrados por proveedor

Eso mantiene la misma cobertura de archivos y al mismo tiempo hace que los fallos lentos de proveedores live sean más fáciles de volver a ejecutar y diagnosticar. Los nombres de fragmento agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales de una sola ejecución.

Los fragmentos nativos live de medios se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, compilado por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners normales de Blacksmith: los trabajos en contenedor son el lugar incorrecto para lanzar pruebas Docker anidadas.

Los shards de modelo/backend en vivo respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por cada commit seleccionado. El flujo de trabajo de release en vivo compila y publica esa imagen una vez; luego los shards de modelo en vivo de Docker, Gateway fragmentado por proveedor, backend de CLI, enlace ACP y arnés Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards de Docker de Gateway llevan topes explícitos de `timeout` a nivel de script por debajo del timeout del job del flujo de trabajo, para que un contenedor atascado o una ruta de limpieza falle rápido en vez de consumir todo el presupuesto de comprobación de release. Si esos shards recompilan de forma independiente el destino Docker completo del código fuente, la ejecución de release está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de paquetes

Usa `Package Acceptance` cuando la pregunta sea "¿este paquete instalable de OpenClaw funciona como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo arnés E2E de Docker que los usuarios ejercitan después de instalar o actualizar.

### Jobs

1. `resolve_package` extrae `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime el origen, la referencia del flujo de trabajo, la referencia del paquete, la versión, el SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con digest de paquete cuando hace falta y ejecuta los carriles Docker seleccionados contra ese paquete en vez de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego distribuye esos carriles como jobs Docker dirigidos paralelos con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; una ejecución independiente de Telegram todavía puede instalar una especificación npm publicada.
4. `summary` hace fallar el flujo de trabajo si falló la resolución del paquete, la aceptación Docker o el carril opcional de Telegram.

### Orígenes de candidatos

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de release de OpenClaw como `openclaw@2026.4.27-beta.2`. Úsalo para aceptación de prerelease/estable publicada.
- `source=ref` empaqueta una rama, etiqueta o SHA de commit completo de confianza en `package_ref`. El resolutor obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o desde una etiqueta de release, instala dependencias en un worktree separado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS público; `package_sha256` es obligatorio. Esta ruta rechaza credenciales en URL, puertos HTTPS no predeterminados, nombres de host o IP resueltas privadas/internas/de uso especial, y redirecciones fuera de la misma política de seguridad pública.
- `source=trusted-url` descarga un `.tgz` HTTPS desde una política de origen de confianza con nombre en `.github/package-trusted-sources.json`; `package_sha256` y `trusted_source_id` son obligatorios. Úsalo solo para espejos empresariales propiedad de mantenedores o repositorios privados de paquetes que necesiten hosts, puertos, prefijos de ruta, hosts de redirección o resolución de red privada configurados. Si la política declara autenticación bearer, el flujo de trabajo usa el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; las credenciales incrustadas en URL se siguen rechazando.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de flujo de trabajo/arnés de confianza que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de prueba actual valide commits de origen de confianza más antiguos sin ejecutar lógica de flujo de trabajo antigua.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de release de Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de Plugin sin conexión para que la validación del paquete publicado no dependa de la disponibilidad en vivo de ClawHub. El carril opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, con la ruta de especificación npm publicada conservada para ejecuciones independientes.

Para la política dedicada de pruebas de actualización y Plugin, incluidos comandos locales,
carriles Docker, entradas de Package Acceptance, valores predeterminados de release y triaje de fallos,
consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de release llaman a Package Acceptance con `source=artifact`, el artefacto de paquete de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` y `telegram_mode=mock-openai`. Esto mantiene la migración de paquetes, actualización, instalación de Skills en vivo de ClawHub, limpieza de dependencias obsoletas de Plugin, reparación de instalación de Plugin configurado, Plugin sin conexión, actualización de Plugin y prueba de Telegram sobre el mismo tarball de paquete resuelto. Define `release_package_spec` en Full Release Validation u OpenClaw Release Checks después de publicar una beta para ejecutar la misma matriz contra el paquete npm publicado sin recompilar; define `package_acceptance_package_spec` solo cuando Package Acceptance necesita un paquete diferente del resto de la validación de release. Las comprobaciones de release multiplataforma siguen cubriendo onboarding, instalador y comportamiento de plataforma específicos del sistema operativo; la validación de producto de paquete/actualización debería empezar con Package Acceptance. El carril Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución en la ruta bloqueante de release. En Package Acceptance, el tarball resuelto `package-under-test` siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de respaldo, con valor predeterminado `openclaw@latest`; los comandos de repetición de carriles fallidos conservan esa línea base. Full Release Validation con `run_release_soak=true` o `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para expandirse por las cuatro releases npm estables más recientes, más releases fijadas de límite de compatibilidad de Plugin y fixtures con forma de issue para configuración de Feishu, archivos bootstrap/persona preservados, instalaciones configuradas de Plugin de OpenClaw, rutas de log con tilde y raíces obsoletas de dependencias heredadas de Plugin. Las selecciones de published-upgrade survivor con varias líneas base se fragmentan por línea base en jobs separados de ejecutor Docker dirigido. El flujo de trabajo separado `Update Migration` usa el carril Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es limpieza exhaustiva de actualización publicada, no la amplitud normal de la CI de Full Release. Las ejecuciones agregadas locales pueden pasar especificaciones de paquete exactas con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantener un único carril con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El carril publicado configura la línea base con una receta incorporada de comando `openclaw config set`, registra los pasos de la receta en `summary.json` y sondea `/healthz`, `/readyz`, además del estado RPC después del inicio de Gateway. Los carriles frescos de paquete e instalador en Windows también verifican que un paquete instalado pueda importar una sustitución de control de navegador desde una ruta absoluta cruda de Windows. El smoke de turno de agente multiplataforma de OpenAI usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definido; de lo contrario, `openai/gpt-5.5`, para que la prueba de instalación y Gateway permanezca en un modelo de prueba GPT-5 y evite valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas conocidas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa flag;
- `update-channel-switch` puede podar `patchedDependencies` de pnpm faltantes del fixture git falso derivado del tarball y puede registrar la falta de `update.channel` persistido;
- los smokes de Plugin pueden leer ubicaciones heredadas de registros de instalación o aceptar que falte la persistencia del registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración y aun así exigir que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir sobre archivos de marca de metadatos de compilación local que ya se habían enviado. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en vez de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquete, empieza por el resumen de `resolve_package` para confirmar el origen del paquete, la versión y el SHA-256. Luego inspecciona la ejecución hija de `docker_acceptance` y sus artefactos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de carril, tiempos de fase y comandos de repetición. Prefiere repetir el perfil de paquete fallido o los carriles Docker exactos en vez de volver a ejecutar la validación completa de release.

## Smoke de instalación

El flujo de trabajo separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura de smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para solicitudes de incorporación de cambios que tocan superficies de Docker/paquetes, cambios en paquetes/manifiestos de plugins incluidos, o superficies principales de plugins/canales/gateway/Plugin SDK que ejercitan los trabajos de humo de Docker. Los cambios de solo código fuente en plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida compila la imagen del Dockerfile raíz una vez, comprueba la CLI, ejecuta el humo de CLI de eliminación de agentes del espacio de trabajo compartido, ejecuta el e2e de gateway-network en contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil de Docker acotado de plugins incluidos bajo un timeout agregado de comando de 240 segundos (cada ejecución de Docker del escenario se limita por separado).
- **Ruta completa** mantiene la instalación del paquete QR y la cobertura de Docker/actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de lanzamiento mediante workflow-call y solicitudes de incorporación de cambios que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen de humo GHCR del Dockerfile raíz para el SHA objetivo, luego ejecuta instalación del paquete QR, humos del Dockerfile raíz/gateway, humos de instalador/actualización y el E2E rápido de Docker para plugins incluidos como trabajos separados para que el trabajo del instalador no espere detrás de los humos de la imagen raíz.

Los pushes a `main` (incluidos los commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el workflow mantiene el humo rápido de Docker y deja el humo de instalación completo para la validación nocturna o de lanzamiento.

El humo lento de proveedor de imágenes con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero las solicitudes de incorporación de cambios y los pushes a `main` no lo hacen. La CI normal de PR sigue ejecutando el carril rápido de regresión del launcher de Bun para cambios relevantes para Node. Las pruebas de Docker de QR e instalador conservan sus propios Dockerfiles centrados en instalación.

## E2E local de Docker

`pnpm test:docker:all` precompila una imagen de prueba en vivo compartida, empaqueta OpenClaw una vez como tarball npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner básico de Node/Git para carriles de instalador/actualización/dependencias de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para carriles de funcionalidad normal.

Las definiciones de carriles de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`, y el runner solo ejecuta el plan seleccionado. El planificador selecciona la imagen por carril con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta carriles con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustables

| Variable                               | Predeterminado | Propósito                                                                                             |
| -------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Número de slots del pool principal para carriles normales.                                            |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Número de slots del pool final sensible a proveedores.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de carriles en vivo concurrentes para que los proveedores no apliquen throttling.              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5              | Límite de carriles concurrentes de instalación npm.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de carriles multi-servicio concurrentes.                                                       |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de carril para evitar tormentas de creación del daemon de Docker; define `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Timeout de reserva por carril (120 minutos); los carriles en vivo/finales seleccionados usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin definir    | `1` imprime el plan del planificador sin ejecutar carriles.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin definir    | Lista exacta de carriles separada por comas; omite el humo de limpieza para que los agentes puedan reproducir un carril fallido. |

Un carril más pesado que su límite efectivo aún puede arrancar desde un pool vacío, luego se ejecuta solo hasta liberar capacidad. Los preflights agregados locales comprueban Docker, eliminan contenedores E2E de OpenClaw obsoletos, emiten estado de carriles activos, persisten tiempos de carril para ordenamiento de más largo primero y dejan de programar carriles agrupados nuevos después del primer fallo de forma predeterminada.

### Workflow reutilizable en vivo/E2E

El workflow reutilizable en vivo/E2E pregunta a `scripts/test-docker-all.mjs --plan-json` qué cobertura de paquete, tipo de imagen, imagen en vivo, carril y credenciales se requiere. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y publica imágenes Docker E2E GHCR básicas/funcionales etiquetadas por digest de paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita carriles con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de recompilar. Los pulls de imágenes Docker se reintentan con un timeout acotado de 180 segundos por intento para que un flujo atascado de registro/caché reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de lanzamiento

La cobertura de Docker de lanzamiento ejecuta trabajos más pequeños en fragmentos con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento solo descargue el tipo de imagen que necesita y ejecute varios carriles mediante el mismo planificador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos actuales de Docker de lanzamiento son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y `plugins-runtime-install-a` hasta `plugins-runtime-install-h`. `package-update-openai` incluye el carril en vivo del paquete del Plugin Codex, que instala el paquete candidato de OpenClaw, instala el Plugin Codex desde `codex_plugin_spec` o un tarball de la misma referencia con aprobación explícita de instalación de la CLI de Codex, ejecuta el preflight de la CLI de Codex y luego ejecuta varios turnos de agente de OpenClaw en la misma sesión contra OpenAI. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de plugins/runtime. El alias de carril `install-e2e` sigue siendo el alias agregado de repetición manual para ambos carriles de instalador de proveedores.

OpenWebUI se integra en `plugins-runtime-services` cuando la cobertura completa de la ruta de lanzamiento lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Los carriles de actualización de canales incluidos reintentan una vez ante fallos transitorios de red npm.

Cada fragmento sube `.artifacts/docker-tests/` con logs de carril, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del planificador, tablas de carriles lentos y comandos de repetición por carril. La entrada `docker_lanes` del workflow ejecuta carriles seleccionados contra las imágenes preparadas en lugar de los trabajos de fragmentos, lo que mantiene la depuración de carriles fallidos acotada a un trabajo Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si un carril seleccionado es un carril Docker en vivo, el trabajo dirigido compila localmente la imagen de prueba en vivo para esa repetición. Los comandos generados de repetición de GitHub por carril incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imagen preparadas cuando esos valores existen, para que un carril fallido pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # descarga artefactos de Docker e imprime comandos de repetición dirigidos combinados/por carril
pnpm test:docker:timings <summary>   # resúmenes de carriles lentos y ruta crítica de fases
```

El workflow programado en vivo/E2E ejecuta diariamente la suite completa de Docker de la ruta de lanzamiento.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un workflow separado despachado por `Full Release Validation` o por un operador explícito. Las solicitudes de incorporación de cambios normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de plugins incluidos entre ocho workers de extensiones; esos trabajos de shards de extensiones ejecutan hasta dos grupos de configuración de plugins a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de plugins con muchas importaciones no creen trabajos adicionales de CI. La ruta de prelanzamiento de Docker exclusiva de lanzamiento agrupa carriles Docker dirigidos en grupos pequeños para evitar reservar docenas de runners para trabajos de uno a tres minutos. El workflow también sube un artefacto informativo `plugin-inspector-advisory` de `@openclaw/plugin-inspector`; los hallazgos del inspector son entrada de triaje y no cambian la puerta bloqueante de Plugin Prerelease.

## QA Lab

QA Lab tiene carriles de CI dedicados fuera del workflow principal con alcance inteligente. La paridad agéntica está anidada bajo los arneses amplios de QA y lanzamiento, no como workflow de PR independiente. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba acompañar una ejecución de validación amplia.

- El workflow `QA-Lab - All Lanes` se ejecuta nocturnamente en `main` y por despacho manual; despliega el carril de paridad mock, el carril Matrix en vivo y los carriles Telegram y Discord en vivo como trabajos paralelos. Los trabajos en vivo usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de lanzamiento ejecutan carriles de transporte en vivo de Matrix y Telegram con el proveedor mock determinista y modelos calificados como mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato de canal quede aislado de la latencia de modelos en vivo y del arranque normal de plugins de proveedores. El gateway de transporte en vivo desactiva la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores está cubierta por las suites separadas de modelo en vivo, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de lanzamiento, agregando `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del workflow siguen siendo `all`; el despacho manual `matrix_profile=all` siempre divide la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles de QA Lab críticos para el lanzamiento antes de la aprobación de lanzamiento; su puerta de paridad de QA ejecuta los paquetes candidato y de referencia como trabajos de carril paralelos, luego descarga ambos artefactos en un trabajo de informe pequeño para la comparación final de paridad.

Para PRs normales, sigue la evidencia de CI/comprobación con alcance en lugar de tratar la paridad como un estado requerido.

## CodeQL

El workflow `CodeQL` es intencionalmente un escáner de seguridad estrecho de primera pasada, no el barrido completo del repositorio. Las ejecuciones diarias, manuales y de guardia de solicitudes de incorporación de cambios no borrador escanean código de workflows de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La guardia de solicitudes de incorporación de cambios se mantiene ligera: solo empieza para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` o rutas de runtime de plugins incluidos que poseen proceso, y ejecuta la misma matriz de seguridad de alta confianza que el workflow programado. CodeQL de Android y macOS quedan fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                        | Superficie                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticación, secretos, sandbox, cron y línea base de gateway                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación del canal del núcleo, además del runtime del plugin de canal, gateway, Plugin SDK, secretos y puntos de contacto de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies de SSRF del núcleo, análisis de IP, protección de red, web-fetch y política de SSRF del Plugin SDK                      |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agentes                |
| `/codeql-security-high/process-exec-boundary`     | Shell local, helpers de creación de procesos, runtimes de plugins incluidos que poseen subprocesos y enlace de scripts de workflow  |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, instalación con gestor de paquetes, carga de código fuente y contrato de paquete del Plugin SDK |

### Fragmentos de seguridad específicos de la plataforma

- `CodeQL Android Critical Security` — fragmento de seguridad Android programado. Compila la aplicación Android manualmente para CodeQL en el runner Linux de Blacksmith más pequeño aceptado por la comprobación de sensatez del workflow. Sube los resultados bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento de seguridad macOS semanal/manual. Compila la aplicación macOS manualmente para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube los resultados bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento equivalente no relacionado con seguridad. Ejecuta solo consultas de calidad de JavaScript/TypeScript sin seguridad y con severidad de error sobre superficies estrechas de alto valor en runners Linux hospedados en GitHub, para que los análisis de calidad no gasten el presupuesto de registro de runners de Blacksmith. Su guardia de pull request es intencionalmente más pequeña que el perfil programado: los PR que no son borradores solo ejecutan los fragmentos correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agentes y despacho de respuestas, código de esquema/migración/IO de configuración, código de autenticación/secretos/sandbox/seguridad, runtime del canal del núcleo y del plugin de canal incluido, protocolo/método de servidor de Gateway, runtime de memoria/enlace de SDK, MCP/proceso/entrega saliente, catálogo de runtime/modelos de proveedor, diagnósticos de sesión/colas de entrega, cargador de plugins, contrato de Plugin SDK/paquete o runtime de respuestas del Plugin SDK. Los cambios de configuración de CodeQL y del workflow de calidad ejecutan los doce fragmentos de calidad para PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son ganchos de enseñanza/iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                              | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de autenticación, secretos, sandbox, cron y gateway                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización e IO                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo de Gateway y contratos de métodos de servidor                                                                                                |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación del canal del núcleo y del plugin de canal incluido                                                                                    |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos de runtime de ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuestas automáticas, y plano de control ACP                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas de runtime de memoria, alias del Plugin SDK de memoria, enlace de activación del runtime de memoria y comandos doctor de memoria |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de la cola de respuestas, colas de entrega de sesiones, helpers de vinculación/entrega de sesiones salientes, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del Plugin SDK, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canales, colas de entrega y helpers de vinculación de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros de web/búsqueda/fetch/embeddings |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de la UI de control, persistencia local, flujos de control de Gateway y contratos de runtime del plano de control de tareas                               |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/búsqueda web del núcleo, IO de medios, comprensión de medios, generación de imágenes y generación de medios                          |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y punto de entrada del Plugin SDK                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente publicado del Plugin SDK del lado del paquete y helpers del contrato de paquete de plugin                                                            |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin ocultar la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe añadirse de nuevo como trabajo de seguimiento acotado o fragmentado solo después de que los perfiles estrechos tengan runtime y señal estables.

## Workflows de mantenimiento

### Docs Agent

El workflow `Docs Agent` es una vía de mantenimiento de Codex basada en eventos para mantener la documentación existente alineada con cambios aterrizados recientemente. No tiene una programación pura: una ejecución de CI exitosa por push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por workflow-run se omiten cuando `main` ha avanzado o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen del Docs Agent no omitido anterior hasta el `main` actual, por lo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde el último pase de documentación.

### Test Performance Agent

El workflow `Test Performance Agent` es una vía de mantenimiento de Codex basada en eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI exitosa por push no bot en `main` puede activarlo, pero se omite si otra invocación por workflow-run ya se ejecutó o está ejecutándose ese día UTC. El despacho manual omite esa puerta de actividad diaria. La vía crea un informe de rendimiento de Vitest agrupado de la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactors amplios, luego vuelve a ejecutar el informe de la suite completa y rechaza cambios que reduzcan el recuento base de pruebas aprobadas. El informe agrupado registra el tiempo de pared por configuración y el RSS máximo en Linux y macOS, por lo que la comparación antes/después muestra deltas de memoria de pruebas junto a deltas de duración. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe de suite completa posterior al agente debe aprobar antes de confirmar nada. Cuando `main` avanza antes de que aterrice el push del bot, la vía rebasea el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu hospedado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad drop-sudo que el agente de documentación.

### PR duplicados después de merge

El workflow `Duplicate PRs After Merge` es un workflow manual de mantenedores para limpieza de duplicados posterior al aterrizaje. De forma predeterminada usa dry-run y solo cierra los PR listados explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que el PR aterrizado esté fusionado y que cada duplicado tenga un issue referenciado compartido o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Puertas de comprobación locales y enrutamiento de cambios

La lógica local de vías modificadas vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa puerta de comprobación local es más estricta sobre los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan typecheck de producción y de pruebas del núcleo, además de lint/guardias del núcleo;
- los cambios solo de pruebas del núcleo ejecutan solo typecheck de pruebas del núcleo, además de lint del núcleo;
- los cambios de producción de extensiones ejecutan typecheck de producción y de pruebas de extensiones, además de lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan typecheck de pruebas de extensiones, además de lint de extensiones;
- los cambios públicos del Plugin SDK o del contrato de plugins se amplían al typecheck de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones con Vitest siguen siendo trabajo de prueba explícito);
- los aumentos de versión solo de metadatos de lanzamiento ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todas las vías de comprobación.

El enrutamiento local de pruebas modificadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren mapeos explícitos y luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega de salas de grupo es uno de los mapeos explícitos: los cambios a la configuración de respuestas visibles para el grupo, el modo de entrega de respuestas de origen o el prompt del sistema de la herramienta de mensajes pasan por las pruebas de respuestas del núcleo, además de regresiones de entrega de Discord y Slack, para que un cambio predeterminado compartido falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el harness como para que el conjunto mapeado barato no sea un proxy confiable.

## Validación de Testbox

Crabbox es el envoltorio de caja remota propiedad del repositorio para pruebas de Linux de mantenedores. Úsalo
desde la raíz del repositorio cuando una comprobación sea demasiado amplia para un ciclo local de edición, cuando importe
la paridad con CI, o cuando la prueba necesite secretos, Docker, vías de paquetes,
cajas reutilizables o registros remotos. El backend normal de OpenClaw es
`blacksmith-testbox`; la capacidad propia de AWS/Hetzner es un respaldo para interrupciones de Blacksmith,
problemas de cuota o pruebas explícitas con capacidad propia.

Las ejecuciones de Blacksmith respaldadas por Crabbox preparan, reclaman, sincronizan, ejecutan, informan y limpian
Testboxes de un solo uso. La comprobación de coherencia de sincronización integrada falla rápido cuando desaparecen
archivos raíz requeridos como `pnpm-lock.yaml` o cuando `git status --short`
muestra al menos 200 eliminaciones rastreadas. Para PRs intencionales con eliminaciones masivas, define
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para el comando remoto.

Crabbox también termina una invocación local de la CLI de Blacksmith que permanece en la
fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Define
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor
en milisegundos para diffs locales inusualmente grandes.

Antes de una primera ejecución, comprueba el envoltorio desde la raíz del repositorio:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El envoltorio del repositorio rechaza un binario de Crabbox obsoleto que no anuncia `blacksmith-testbox`. Pasa el proveedor explícitamente aunque `.crabbox.yaml` tenga valores predeterminados de nube propia. En worktrees de Codex o checkouts enlazados/dispersos, evita el script local `pnpm crabbox:run` porque pnpm puede reconciliar dependencias antes de que Crabbox arranque; invoca directamente el envoltorio de node en su lugar:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Las ejecuciones respaldadas por Blacksmith requieren Crabbox 0.22.0 o posterior para que el envoltorio obtenga el comportamiento actual de sincronización, cola y limpieza de Testbox. Cuando uses el checkout hermano, reconstruye el binario local ignorado antes de trabajos de medición o prueba:

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
de Blacksmith Testbox, el código de salida del envoltorio Crabbox y el resumen JSON son el
resultado del comando. La ejecución enlazada de GitHub Actions es responsable de la hidratación y el keepalive; puede
terminar como `cancelled` cuando el Testbox se detiene externamente después de que el comando SSH
ya haya devuelto. Trátalo como un artefacto de limpieza/estado salvo que
el `exitCode` del envoltorio sea distinto de cero o la salida del comando muestre una prueba fallida.
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
solo para diagnósticos como `list`, `status` y limpieza. Corrige la ruta de
Crabbox antes de tratar una ejecución directa de Blacksmith como prueba de mantenedor.

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan pero los nuevos
precalentamientos quedan en `queued` sin IP ni URL de ejecución de Actions después de un par de minutos,
trátalo como presión del proveedor Blacksmith, cola, facturación o límite de la organización. Detén los
ids en cola que creaste, evita iniciar más Testboxes y mueve la prueba a la
ruta de capacidad propia de Crabbox de abajo mientras alguien comprueba el panel de Blacksmith,
la facturación y los límites de la organización.

Escala a la capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, no tenga el entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Bajo presión de AWS, evita `class=beast` salvo que la tarea realmente necesite CPU de clase 48xlarge. Una solicitud `beast` empieza en 192 vCPU y es la forma más fácil de activar la cuota regional de EC2 Spot o Standard On-Demand. El `.crabbox.yaml` propiedad del repositorio usa de forma predeterminada `standard`, varias regiones de capacidad y `capacity.hints: true` para que las concesiones AWS intermediadas impriman la región/mercado seleccionados, la presión de cuota, el respaldo Spot y advertencias de clase de alta presión. Usa `fast` para comprobaciones amplias más pesadas, `large` solo después de que standard/fast no basten, y `beast` solo para vías excepcionales ligadas a CPU como suites completas o matrices Docker de todos los plugins, validación explícita de release/bloqueo, o perfiles de rendimiento de muchos núcleos. No uses `beast` para `pnpm check:changed`, pruebas enfocadas, trabajo solo de documentación, lint/typecheck ordinarios, reproducciones E2E pequeñas o triaje de interrupciones de Blacksmith. Usa `--market on-demand` para diagnóstico de capacidad para que la rotación del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` es responsable de los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para vías de nube propia. Excluye `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos Git remotos en vez de sincronizar remotos y almacenes de objetos locales del mantenedor, y excluye artefactos locales de runtime/compilación que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` es responsable del checkout, la configuración de Node/pnpm, la obtención de `origin/main` y la transferencia de entorno no secreto para comandos de nube propia `crabbox run --id <cbx_id>`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
