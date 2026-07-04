---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o repetición de validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Gráfico de trabajos de CI, puertas de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-07-04T06:21:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e97c378598fadcbaef12e5f9abd1d99261dd4594ce88ce4aa3293af0744fc5a
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. Los pushes canónicos a
`main` pasan primero por una ventana de admisión de 90 segundos en runner hospedado.
El grupo de concurrencia `CI` existente cancela esa ejecución en espera cuando llega un commit
más nuevo, de modo que las fusiones secuenciales no registran cada una una matriz completa de
Blacksmith. Los pull requests y las ejecuciones manuales omiten la espera. El job `preflight`
luego clasifica el diff y desactiva lanes costosos cuando solo cambiaron áreas no relacionadas.
Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente
y despliegan todo el grafo para release candidates y validación amplia. Los lanes de Android
siguen siendo opt-in mediante `include_android`. La cobertura de Plugin solo para releases vive
en el workflow separado [`Prerelease de Plugin`](#plugin-prerelease) y solo se ejecuta desde
[`Validación completa de release`](#full-release-validation) o una ejecución manual explícita.

## Descripción general del pipeline

| Job                                | Propósito                                                                                                   | Cuándo se ejecuta                                        |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Detecta cambios solo de docs, alcances cambiados, extensiones cambiadas y construye el manifiesto de CI                   | Siempre en pushes y PRs que no sean borrador                  |
| `runner-admission`                 | Debounce hospedado de 90 segundos para pushes canónicos a `main` antes de registrar trabajo de Blacksmith                | Cada ejecución de CI; duerme solo en pushes canónicos a `main` |
| `security-fast`                    | Detección de claves privadas, auditoría de workflows cambiados mediante `zizmor` y auditoría del lockfile de producción                 | Siempre en pushes y PRs que no sean borrador                  |
| `check-dependencies`               | Pasada de Knip solo para dependencias de producción más la guarda de allowlist de archivos no usados                                 | Cambios relevantes para Node                               |
| `build-artifacts`                  | Construye `dist/`, Control UI, smoke checks de CLI construida, comprobaciones de artefactos construidos incrustados y artefactos reutilizables | Cambios relevantes para Node                               |
| `checks-fast-core`                 | Lanes rápidos de corrección en Linux como bundled, protocolo, QA Smoke CI y comprobaciones de enrutamiento de CI                | Cambios relevantes para Node                               |
| `checks-fast-contracts-plugins-*`  | Dos comprobaciones fragmentadas de contratos de Plugin                                                                        | Cambios relevantes para Node                               |
| `checks-fast-contracts-channels-*` | Dos comprobaciones fragmentadas de contratos de canales                                                                       | Cambios relevantes para Node                               |
| `checks-node-core-*`               | Fragmentos de pruebas de Node core, excluyendo lanes de canal, bundled, contrato y extensión                          | Cambios relevantes para Node                               |
| `check-*`                          | Equivalente fragmentado de la puerta local principal: tipos de producción, lint, guardas, tipos de prueba y smoke estricto                | Cambios relevantes para Node                               |
| `check-additional-*`               | Arquitectura, drift de límites/prompts fragmentado, guardas de extensiones, límite de paquetes y topología de runtime     | Cambios relevantes para Node                               |
| `checks-node-compat-node22`        | Build de compatibilidad con Node 22 y lane de smoke                                                                | Ejecución manual de CI para releases                     |
| `check-docs`                       | Formato, lint y comprobaciones de enlaces rotos de docs                                                             | Docs cambiadas                                        |
| `skills-python`                    | Ruff + pytest para Skills respaldadas por Python                                                                    | Cambios relevantes para Skills de Python                       |
| `checks-windows`                   | Pruebas específicas de Windows de procesos/rutas más regresiones compartidas de especificadores de importación de runtime                      | Cambios relevantes para Windows                            |
| `macos-node`                       | Lane de pruebas TypeScript en macOS usando los artefactos construidos compartidos                                               | Cambios relevantes para macOS                              |
| `macos-swift`                      | Lint, build y pruebas de Swift para la app de macOS                                                            | Cambios relevantes para macOS                              |
| `ios-build`                        | Generación del proyecto Xcode más build de la app de iOS en simulador                                                 | App de iOS, kit compartido de app o cambios de Swabble         |
| `android`                          | Pruebas unitarias de Android para ambos sabores más un build de APK debug                                              | Cambios relevantes para Android                            |
| `test-performance-agent`           | Optimización diaria de pruebas lentas de Codex después de actividad confiable                                                 | Éxito de CI principal o ejecución manual                  |
| `openclaw-performance`             | Informes diarios/bajo demanda de rendimiento del runtime Kova con mock-provider, deep-profile y lanes live de GPT 5.5 | Programado y ejecución manual                       |

## Orden fail-fast

1. `runner-admission` espera solo para pushes canónicos a `main`; un push más nuevo cancela la ejecución antes del registro de Blacksmith.
2. `preflight` decide qué lanes existen siquiera. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este job, no jobs independientes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` y `skills-python` fallan rápido sin esperar a los jobs más pesados de artefactos y matriz de plataformas.
4. `build-artifacts` se solapa con los lanes rápidos de Linux para que los consumidores descendentes puedan empezar en cuanto el build compartido esté listo.
5. Los lanes más pesados de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` y `android`.

GitHub puede marcar jobs reemplazados como `cancelled` cuando llega un push más nuevo al mismo PR o ref de `main`. Trátalo como ruido de CI salvo que la ejecución más reciente para el mismo ref también esté fallando. Los jobs de matriz usan `fail-fast: false`, y `build-artifacts` informa fallos incrustados de channel, core-support-boundary y gateway-watch directamente en lugar de poner en cola jobs verificadores pequeños. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones más nuevas de main. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en progreso.

Usa `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` para resumir tiempo total, tiempo de cola, jobs más lentos, fallos y la barrera de fanout `pnpm-store-warmup` desde GitHub Actions. CI también sube el mismo resumen de ejecución como artefacto `ci-timings-summary`. Para tiempos de build, revisa el paso `Build dist` del job `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e incluye `ui:build`; el job también sube el artefacto `startup-memory`.

Para ejecuciones de pull request, el job terminal de resumen de tiempos ejecuta el helper desde la revisión base confiable antes de pasar `GH_TOKEN` a `gh run view`. Eso mantiene la consulta con token fuera del código controlado por la rama mientras sigue resumiendo la ejecución de CI actual del pull request.

## Contexto de PR y evidencia

Los PRs de contribuidores externos ejecutan una puerta de contexto y evidencia de PR desde
`.github/workflows/real-behavior-proof.yml`. El workflow hace checkout del commit base confiable
y evalúa solo el cuerpo del PR; no ejecuta código de la rama del contribuidor.

La puerta se aplica a autores de PR que no sean propietarios, miembros,
colaboradores o bots del repositorio. Pasa cuando el cuerpo del PR contiene secciones escritas por el autor
`What Problem This Solves` y `Evidence`. La evidencia puede ser una prueba enfocada,
resultado de CI, captura de pantalla, grabación, salida de terminal, observación live,
log redactado o enlace a artefacto. El cuerpo aporta intención y validación útil;
los revisores inspeccionan el código, las pruebas y CI para evaluar la corrección.

Cuando la comprobación falla, actualiza el cuerpo del PR en lugar de empujar otro commit de código.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. La ejecución manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si cada área con alcance hubiera cambiado.

- **Ediciones del workflow de CI** validan el grafo de CI de Node más el linting de workflows, pero no fuerzan por sí solas builds nativos de Windows, iOS, Android o macOS; esos lanes de plataforma siguen limitados a cambios de código fuente de plataforma.
- **Workflow Sanity** ejecuta `actionlint`, `zizmor` sobre todos los archivos YAML de workflow, la guarda de interpolación de composite-action y la guarda de marcadores de conflicto. El job `security-fast` con alcance de PR también ejecuta `zizmor` sobre archivos de workflow cambiados para que los hallazgos de seguridad de workflow fallen temprano en el grafo principal de CI.
- **Docs en pushes a `main`** se comprueban mediante el workflow independiente `Docs` con el mismo espejo de docs de ClawHub usado por CI, por lo que los pushes mixtos de código+docs no ponen también en cola el fragmento `check-docs` de CI. Los pull requests y CI manual aún ejecutan `check-docs` desde CI cuando cambiaron docs.
- **TUI PTY** se ejecuta en el fragmento Linux Node `checks-node-core-runtime-tui-pty` para cambios de TUI. El fragmento ejecuta `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, por lo que cubre tanto el lane determinista de fixture `TuiBackend` como el smoke más lento de `tui --local` que mockea solo el endpoint externo del modelo.
- **Ediciones solo de enrutamiento de CI, ediciones seleccionadas baratas de fixtures de pruebas core y ediciones estrechas de helpers/enrutamiento de pruebas de contratos de Plugin** usan una ruta rápida de manifiesto solo Node: `preflight`, seguridad y una única tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canal, fragmentos core completos, fragmentos de bundled-plugin y matrices adicionales de guardas cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Comprobaciones de Windows Node** se limitan a wrappers específicos de Windows de procesos/rutas, helpers de runners npm/pnpm/UI, configuración del gestor de paquetes y las superficies de workflow de CI que ejecutan ese lane; los cambios no relacionados de código fuente, Plugin, install-smoke y solo pruebas permanecen en los lanes Linux Node.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo se mantenga pequeño sin reservar ejecutores en exceso: los contratos de plugins y los contratos de canales se ejecutan cada uno como dos fragmentos ponderados respaldados por Blacksmith con el respaldo estándar de ejecutor de GitHub, los carriles rápidos/de soporte de unidades centrales se ejecutan por separado, la infraestructura de runtime central se divide entre estado, proceso/configuración, compartido y tres fragmentos de dominio cron, la respuesta automática se ejecuta como workers equilibrados (con el subárbol de respuestas dividido en fragmentos de agent-runner, dispatch y comandos/enrutamiento de estado), y las configuraciones agénticas de Gateway/servidor se dividen en carriles chat/auth/model/http-plugin/runtime/startup en lugar de esperar artefactos compilados. Luego, la CI normal empaqueta solo fragmentos de patrones de inclusión de infraestructura aislada en paquetes deterministas de como máximo 64 archivos de prueba, lo que reduce la matriz de Node sin fusionar suites no aisladas de command/cron, agents-core con estado, ni Gateway/servidor; las suites fijas pesadas permanecen en 8 vCPU, mientras que los carriles empaquetados y de menor peso usan 4 vCPU. Las pull requests en el repositorio canónico usan un plan de admisión compacto adicional: los mismos grupos por configuración se ejecutan en subprocesos aislados dentro del plan actual de 34 trabajos de Linux Node, por lo que una sola PR no registra la matriz completa de Node de más de 70 trabajos. Los pushes a `main`, los dispatches manuales y las compuertas de release conservan la matriz completa. Las pruebas amplias de navegador, QA, medios y plugins varios usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los fragmentos de patrones de inclusión registran entradas de tiempos usando el nombre del fragmento de CI, por lo que `.artifacts/vitest-shard-timings.json` puede distinguir una configuración completa de un fragmento filtrado. `check-additional-*` mantiene juntas las tareas de compilación/canary de límites de paquetes y separa la arquitectura de topología de runtime de la cobertura de vigilancia de Gateway; la lista de guardas de límites se divide en un fragmento con alta carga de instrucciones y un fragmento combinado para las bandas de guardas restantes, cada uno ejecutando guardas independientes seleccionadas en paralelo e imprimiendo tiempos por comprobación. La costosa comprobación de deriva de instantáneas de instrucciones de la ruta feliz de Codex se ejecuta como su propio trabajo adicional solo para CI manual y para cambios que afectan las instrucciones de modelo, por lo que los cambios normales no relacionados de Node no esperan detrás de la generación en frío de instantáneas de instrucciones y los fragmentos de límites permanecen equilibrados mientras la deriva de instrucciones sigue vinculada a la PR que la causó; la misma bandera omite la generación de instantáneas de instrucciones de Vitest dentro del fragmento de artefactos compilados de límite de soporte central. La vigilancia de Gateway, las pruebas de canal y el fragmento de límite de soporte central se ejecutan en paralelo dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya están compilados.

Una vez admitida, la CI canónica de Linux permite hasta 24 trabajos de prueba de Node simultáneos y
12 para los carriles rápidos/de comprobación más pequeños; Windows y Android permanecen en dos porque
esos grupos de ejecutores son más limitados.

El plan compacto de PR emite 18 trabajos de Node para la suite actual: los grupos de configuración completa
se agrupan en subprocesos aislados con un tiempo límite de lote de 120 minutos,
mientras que los grupos de patrones de inclusión comparten el mismo presupuesto acotado de trabajos.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego compila el APK de depuración de Play. La variante de terceros no tiene un conjunto de código fuente ni manifiesto separado; su carril de pruebas unitarias todavía compila la variante con las banderas BuildConfig de SMS/registro de llamadas, evitando a la vez un trabajo duplicado de empaquetado del APK de depuración en cada push relevante para Android.

El fragmento `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una pasada de Knip solo para dependencias de producción fijada a la versión más reciente de Knip, con la edad mínima de release de pnpm deshabilitada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos no usados de producción de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. La guarda de archivos no usados falla cuando una PR agrega un nuevo archivo no usado sin revisar o deja una entrada obsoleta en la allowlist, preservando a la vez superficies intencionales de plugins dinámicos, generadas, de compilación, de pruebas live y de puente de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado destino desde la actividad del repositorio de OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código no confiable de pull requests. El workflow crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego despacha payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El workflow tiene cuatro carriles:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

El carril `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando están presentes. Evita intencionalmente reenviar el cuerpo completo del webhook. El workflow receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente ClawSweeper recibe el destino de Discord en su instrucción y debe publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Aperturas rutinarias, ediciones, ruido de bots, ruido de webhooks duplicados y tráfico normal de revisiones deben producir `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisión, nombres de ramas y mensajes de commit de GitHub como datos no confiables en todo este recorrido. Son entradas para resumen y triaje, no instrucciones para el workflow ni para el runtime del agente.

## Dispatches manuales

Los dispatches manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de cada carril con alcance no Android: fragmentos de Linux Node, fragmentos de plugins empaquetados, fragmentos de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones smoke de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS, compilación iOS y i18n de Control UI. Los dispatches manuales independientes de CI ejecutan Android solo con `include_android=true`; el paraguas completo de release habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prerelease de plugins, el fragmento solo de release `agentic-plugins`, el barrido completo por lotes de extensiones y los carriles Docker de prerelease de plugins se excluyen de la CI. La suite Docker de prerelease se ejecuta solo cuando `Full Release Validation` despacha el workflow separado `Plugin Prerelease` con la compuerta de validación de release habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de release candidate no sea cancelada por otro push o ejecución de PR en la misma ref. La entrada opcional `target_ref` permite que un llamador confiable ejecute ese grafo contra una rama, etiqueta o SHA completo de commit mientras usa el archivo de workflow de la ref de dispatch seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Dispatch manual de CI y respaldos de repositorios no canónicos, escaneos de calidad de CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, workflows de documentación fuera de CI e install-smoke preflight para que la matriz de Blacksmith pueda encolarse antes                 |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, fragmentos de extensiones de menor peso, `checks-fast-core` excepto QA Smoke CI, fragmentos de contratos de plugins/canales, la mayoría de fragmentos Linux Node empaquetados/de menor peso, `check-guards`, `check-prod-types`, `check-test-types`, fragmentos seleccionados de `check-additional-*` y `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites pesadas conservadas de Linux Node, fragmentos `check-additional-*` pesados de límites/extensiones y `android`                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` en CI y Testbox, `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el tiempo de cola de 32 vCPU costó más de lo que ahorró)                                                    |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                      |
| `blacksmith-6vcpu-macos-15`     | `macos-node` en `openclaw/openclaw`; los forks recurren a `macos-15`                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` en `openclaw/openclaw`; los forks recurren a `macos-26`                                                                                                                                                                                                                    |

## Presupuesto de registro de ejecutores

El bucket actual de registro de ejecutores de GitHub de OpenClaw informa 10.000 registros de ejecutores
self-hosted por cada 5 minutos en `ghx api rate_limit`. Vuelve a comprobar
`actions_runner_registration` antes de cada pasada de ajuste porque GitHub puede cambiar
este bucket. El límite lo comparten todos los registros de ejecutores de Blacksmith en la
organización `openclaw`, por lo que agregar otra instalación de Blacksmith no agrega
un bucket nuevo.

Trata las etiquetas de Blacksmith como el recurso escaso para el control de ráfagas. Los trabajos que
solo enrutan, notifican, resumen, seleccionan fragmentos o ejecutan escaneos breves de CodeQL deben
permanecer en ejecutores hospedados por GitHub salvo que tengan necesidades específicas de Blacksmith
medidas. Cualquier matriz nueva de Blacksmith, `max-parallel` más grande o workflow de alta frecuencia
debe mostrar su conteo de registros en el peor caso y mantener el objetivo de nivel de organización
por debajo de aproximadamente el 60% del bucket live. Con el bucket actual de 10.000 registros,
eso significa un objetivo operativo de 6.000 registros, dejando margen para
repositorios concurrentes, reintentos y superposición de ráfagas.

La CI del repositorio canónico mantiene Blacksmith como la ruta de ejecutor predeterminada para ejecuciones normales de push y pull request. `workflow_dispatch` y las ejecuciones de repositorios no canónicos usan ejecutores hospedados por GitHub, pero las ejecuciones canónicas normales no sondean actualmente la salud de la cola de Blacksmith ni retroceden automáticamente a etiquetas hospedadas por GitHub cuando Blacksmith no está disponible.

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

`OpenClaw Performance` es el flujo de trabajo de rendimiento del producto/runtime. Se ejecuta diariamente en `main` y se puede lanzar manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

El lanzamiento manual normalmente mide el rendimiento de la referencia del flujo de trabajo. Configura `target_ref` para medir un tag de lanzamiento u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros más recientes se indexan por la referencia probada, y cada `index.md` registra la referencia/SHA probada, la referencia/SHA del flujo de trabajo, la referencia de Kova, el perfil, el modo de autenticación de la lane, el modelo, el número de repeticiones y los filtros de escenario.

El flujo de trabajo instala OCM desde una versión fijada y Kova desde `openclaw/Kova` en la entrada fijada `kova_ref`, y luego ejecuta tres lanes:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfilado de CPU/heap/trazas para puntos calientes de arranque, gateway y turnos de agente.
- `live-openai-candidate`: un turno de agente real de OpenAI `openai/gpt-5.5`, omitido cuando `OPENAI_API_KEY` no está disponible.

La lane mock-provider también ejecuta sondeos nativos de OpenClaw en el código fuente después de la pasada de Kova: tiempo de arranque del gateway y memoria en casos de arranque predeterminado, con hooks y con 50 Plugins; RSS de importación de Plugins incluidos, bucles de saludo repetidos de mock-OpenAI `channel-chat-baseline`, comandos de arranque de la CLI contra el gateway iniciado y el sondeo de rendimiento smoke de estado SQLite. Cuando el informe fuente mock-provider publicado anterior está disponible para la referencia probada, el resumen de código fuente compara los valores actuales de RSS y heap con esa línea base y marca los aumentos grandes de RSS como `watch`. El resumen Markdown del sondeo de código fuente vive en `source/index.md` dentro del paquete de informe, con el JSON sin procesar junto a él.

Cada lane sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondeo de código fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la referencia probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación completa de lanzamiento

`Full Release Validation` es el flujo de trabajo paraguas manual para "ejecutar todo antes del lanzamiento". Acepta una rama, tag o SHA de commit completo, lanza el flujo de trabajo manual `CI` con ese destino, lanza `Plugin Prerelease` para pruebas exclusivas de lanzamiento de Plugin/paquete/estático/Docker, y lanza `OpenClaw Release Checks` para smoke de instalación, aceptación de paquete, comprobaciones de paquete entre sistemas operativos, renderizado de la tarjeta de madurez a partir de evidencia de perfil de QA, paridad de QA Lab, Matrix y lanes de Telegram. Los perfiles stable y full siempre incluyen cobertura exhaustiva live/E2E y de soak de ruta de lanzamiento de Docker; el perfil beta puede optar por incluirla con `run_release_soak=true`. El E2E canónico de Telegram de paquete se ejecuta dentro de Package Acceptance, por lo que un candidato completo no inicia un poller live duplicado. Después de publicar, pasa `release_package_spec` para reutilizar el paquete npm enviado en las comprobaciones de lanzamiento, Package Acceptance, Docker, comprobaciones entre sistemas operativos y Telegram sin recompilar. Usa `npm_telegram_package_spec` solo para una repetición enfocada de Telegram con paquete publicado. La lane de paquete live del Plugin Codex usa el mismo estado seleccionado de forma predeterminada: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mientras que las ejecuciones con SHA/artefacto empaquetan `extensions/codex` desde la referencia seleccionada. Configura `codex_plugin_spec` explícitamente para fuentes de Plugin personalizadas como especificaciones `npm:`, `npm-pack:` o `git:`.

Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para la matriz de etapas, los nombres exactos de jobs del flujo de trabajo, las diferencias de perfiles, los artefactos y los identificadores de repetición enfocada.

`OpenClaw Release Publish` es el flujo de trabajo manual de lanzamiento con cambios. Lánzalo desde `release/YYYY.M.PATCH` o `main` después de que exista el tag de lanzamiento y después de que el preflight npm de OpenClaw haya tenido éxito. Verifica `pnpm plugins:sync:check`, lanza `Plugin NPM Release` para todos los paquetes de Plugin publicables, lanza `Plugin ClawHub Release` para el mismo SHA de lanzamiento, y solo entonces lanza `OpenClaw NPM Release` con el `preflight_run_id` guardado. La publicación stable también requiere un `windows_node_tag` exacto; el flujo de trabajo verifica la versión fuente de Windows y compara sus instaladores x64/ARM64 con la entrada `windows_node_installer_digests` aprobada por el candidato antes de cualquier flujo hijo de publicación, luego promociona y verifica esos mismos resúmenes de instalador fijados más el contrato exacto de asset complementario y suma de comprobación antes de publicar el borrador de lanzamiento de GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Para prueba de commit fijado en una rama que avanza rápido, usa el helper en lugar de `gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las referencias de dispatch de flujos de trabajo de GitHub deben ser ramas o tags, no SHA de commit sin procesar. El helper empuja una rama temporal `release-ci/<sha>-...` en el SHA objetivo, lanza `Full Release Validation` desde esa referencia fijada, verifica que cada `headSha` de flujo de trabajo hijo coincida con el objetivo y elimina la rama temporal cuando la ejecución termina. El verificador paraguas también falla si algún flujo de trabajo hijo se ejecutó en un SHA distinto.

`release_profile` controla la amplitud live/proveedor pasada a las comprobaciones de lanzamiento. Los flujos de trabajo manuales de lanzamiento usan `stable` de forma predeterminada; usa `full` solo cuando quieras intencionalmente la matriz amplia consultiva de proveedores/medios. Las comprobaciones de lanzamiento stable y full siempre ejecutan el soak exhaustivo live/E2E y de ruta de lanzamiento de Docker; el perfil beta puede optar por incluirlo con `run_release_soak=true`.

- `minimum` conserva las lanes más rápidas críticas para el lanzamiento de OpenAI/core.
- `stable` añade el conjunto stable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedores/medios.

El paraguas registra los ids de ejecución de los hijos lanzados, y el job final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y agrega tablas de jobs más lentos para cada ejecución hija. Si se vuelve a ejecutar un flujo de trabajo hijo y pasa a verde, vuelve a ejecutar solo el job verificador padre para refrescar el resultado paraguas y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de lanzamiento, `ci` solo para el hijo de CI completa normal, `plugin-prerelease` solo para el hijo de prerelease de Plugins, `release-checks` para cada hijo de lanzamiento, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la repetición de una caja de lanzamiento fallida después de una corrección enfocada. Para una lane entre sistemas operativos fallida, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos largos entre sistemas operativos emiten líneas de Heartbeat y los resúmenes de packaged-upgrade incluyen tiempos por fase. Las lanes de comprobación de lanzamiento de QA son consultivas, excepto la puerta estándar de cobertura de herramientas de runtime, que bloquea cuando las herramientas dinámicas requeridas de OpenClaw derivan o desaparecen del resumen de nivel estándar.

`OpenClaw Release Checks` usa la referencia confiable del flujo de trabajo para resolver la referencia seleccionada una sola vez en un tarball `release-package-under-test`, luego pasa ese artefacto a las comprobaciones entre sistemas operativos y Package Acceptance, además del flujo de trabajo Docker live/E2E de ruta de lanzamiento cuando se ejecuta la cobertura de soak. Eso mantiene los bytes del paquete consistentes entre cajas de lanzamiento y evita reempaquetar el mismo candidato en múltiples jobs hijos. Para la lane live del Plugin npm de Codex, las comprobaciones de lanzamiento pasan una especificación de Plugin publicado coincidente derivada de `release_package_spec`, pasan el `codex_plugin_spec` suministrado por el operador, o dejan la entrada en blanco para que el script de Docker empaquete el Plugin Codex del checkout seleccionado.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all` reemplazan al paraguas anterior. El monitor padre cancela cualquier flujo de trabajo hijo que ya haya lanzado cuando el padre se cancela, por lo que una validación más nueva de main no queda detrás de una ejecución obsoleta de dos horas de comprobaciones de lanzamiento. La validación de rama/tag de lanzamiento y los grupos de repetición enfocada mantienen `cancel-in-progress: false`.

## Fragmentos live y E2E

El hijo live/E2E de lanzamiento mantiene una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como fragmentos nombrados mediante `scripts/test-live-shard.mjs` en lugar de un job serial:

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
- fragmentos de audio/vídeo de medios divididos y fragmentos de música filtrados por proveedor

Eso mantiene la misma cobertura de archivos mientras facilita volver a ejecutar y diagnosticar fallos lentos de proveedores live. Los nombres agregados de fragmentos `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales puntuales.

Los fragmentos nativos de medios live se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los jobs de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners normales de Blacksmith: los jobs de contenedor son el lugar equivocado para lanzar pruebas Docker anidadas.

Los shards de modelo/backend en vivo respaldados por Docker usan una imagen compartida independiente `ghcr.io/openclaw/openclaw-live-test:<sha>` por cada commit seleccionado. El flujo de trabajo de lanzamiento en vivo compila y sube esa imagen una vez; después, los shards del modelo en vivo de Docker, el Gateway dividido por proveedor, el backend de CLI, el enlace ACP y el harness de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards de Docker de Gateway llevan límites explícitos de `timeout` a nivel de script por debajo del tiempo de espera del trabajo del flujo, de modo que un contenedor atascado o una ruta de limpieza falle rápido en lugar de consumir todo el presupuesto de comprobaciones de lanzamiento. Si esos shards reconstruyen de forma independiente el objetivo Docker completo del código fuente, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de paquetes

Usa `Package Acceptance` cuando la pregunta sea "¿este paquete instalable de OpenClaw funciona como producto?". Es distinto de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo harness E2E de Docker que los usuarios ejercitan después de instalar o actualizar.

### Trabajos

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime el origen, la ref del flujo de trabajo, la ref del paquete, la versión, SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con resumen del paquete cuando hace falta y ejecuta las lanes de Docker seleccionadas contra ese paquete en lugar de empaquetar el checkout del flujo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo reutilizable prepara el paquete y las imágenes compartidas una vez, y después distribuye esas lanes como trabajos Docker dirigidos en paralelo con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; un despacho independiente de Telegram todavía puede instalar una especificación publicada de npm.
4. `summary` hace fallar el flujo de trabajo si falló la resolución del paquete, la aceptación de Docker o la lane opcional de Telegram.

### Orígenes de candidatos

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw, como `openclaw@2026.4.27-beta.2`. Usa esto para la aceptación de prelanzamientos o versiones estables publicadas.
- `source=ref` empaqueta una rama, etiqueta o SHA completo de commit de confianza de `package_ref`. El resolvedor obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o desde una etiqueta de lanzamiento, instala dependencias en un worktree desacoplado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS público; `package_sha256` es obligatorio. Esta ruta rechaza credenciales en la URL, puertos HTTPS no predeterminados, nombres de host o IP resueltas privadas/internas/de uso especial, y redirecciones fuera de la misma política pública de seguridad.
- `source=trusted-url` descarga un `.tgz` HTTPS desde una política de origen confiable con nombre en `.github/package-trusted-sources.json`; `package_sha256` y `trusted_source_id` son obligatorios. Usa esto solo para espejos empresariales propiedad de mantenedores o repositorios privados de paquetes que necesiten hosts, puertos, prefijos de ruta, hosts de redirección o resolución de red privada configurados. Si la política declara autenticación bearer, el flujo de trabajo usa el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; las credenciales incrustadas en la URL se siguen rechazando.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de confianza del flujo de trabajo/harness que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el harness de pruebas actual valide commits de origen confiables más antiguos sin ejecutar lógica antigua del flujo de trabajo.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de lanzamiento Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura offline de plugins para que la validación de paquetes publicados no dependa de la disponibilidad en vivo de ClawHub. La lane opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, y mantiene la ruta de especificación publicada de npm para despachos independientes.

Para la política dedicada de pruebas de actualización y plugins, incluidos comandos locales,
lanes de Docker, entradas de Package Acceptance, valores predeterminados de lanzamiento y triage de fallos,
consulta [Probar actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a Package Acceptance con `source=artifact`, el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` y `telegram_mode=mock-openai`. Esto mantiene la migración del paquete, la actualización, la instalación en vivo de Skills de ClawHub, la limpieza de dependencias obsoletas de plugins, la reparación de instalación de plugins configurados, los plugins offline, la actualización de plugins y la prueba de Telegram sobre el mismo tarball de paquete resuelto. Establece `release_package_spec` en Full Release Validation u OpenClaw Release Checks después de publicar una beta para ejecutar la misma matriz contra el paquete npm publicado sin reconstruir; establece `package_acceptance_package_spec` solo cuando Package Acceptance necesite un paquete distinto al del resto de la validación de lanzamiento. Las comprobaciones de lanzamiento entre sistemas operativos aún cubren el onboarding, el instalador y el comportamiento de plataforma específicos de cada sistema operativo; la validación de producto de paquete/actualización debería comenzar con Package Acceptance. La lane Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución en la ruta bloqueante de lanzamiento. En Package Acceptance, el tarball resuelto `package-under-test` siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada alternativa, con valor predeterminado `openclaw@latest`; los comandos de reejecución de lanes fallidas conservan esa línea base. Full Release Validation con `run_release_soak=true` o `release_profile=full` establece `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para ampliar la cobertura a las cuatro versiones estables más recientes de npm, además de versiones fijadas de límite de compatibilidad de plugins y fixtures con forma de incidencias para la configuración de Feishu, archivos de bootstrap/persona preservados, instalaciones configuradas de plugins de OpenClaw, rutas de logs con tilde y raíces obsoletas de dependencias de plugins heredados. Las selecciones multibase de published-upgrade survivor se dividen por línea base en trabajos separados de ejecutor Docker dirigido. El flujo de trabajo separado `Update Migration` usa la lane Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es una limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de la CI de Full Release. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquete con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantener una sola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o establecer `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. La lane publicada configura la línea base con una receta integrada de comando `openclaw config set`, registra los pasos de la receta en `summary.json` y sondea `/healthz`, `/readyz`, además del estado RPC después del inicio de Gateway. Las lanes fresh del paquete y del instalador de Windows también verifican que un paquete instalado pueda importar una anulación de control de navegador desde una ruta absoluta sin procesar de Windows. La prueba smoke del turno de agente OpenAI entre sistemas operativos usa por defecto `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está establecido; de lo contrario, `openai/gpt-5.5`, de modo que la prueba de instalación y Gateway permanezca en un modelo de prueba GPT-5 y evite valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas conocidas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa marca;
- `update-channel-switch` puede podar `patchedDependencies` de pnpm faltantes del fixture git falso derivado del tarball y puede registrar la falta de `update.channel` persistido;
- las pruebas smoke de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar la falta de persistencia de registros de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración, aunque sigue requiriendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

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

Al depurar una ejecución fallida de aceptación de paquetes, comienza por el resumen de `resolve_package` para confirmar el origen del paquete, la versión y el SHA-256. Después inspecciona la ejecución hija `docker_acceptance` y sus artefactos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tiempos de fases y comandos de reejecución. Prefiere volver a ejecutar el perfil de paquete fallido o las lanes Docker exactas en lugar de volver a ejecutar toda la validación de lanzamiento.

## Prueba smoke de instalación

El flujo de trabajo separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio trabajo `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies de Docker/paquetes, cambios de paquete/manifiesto de Plugins incluidos, o superficies del núcleo de Plugins/canales/Gateway/Plugin SDK que ejercitan los trabajos de humo de Docker. Los cambios solo de código fuente en Plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida compila la imagen del Dockerfile raíz una vez, comprueba la CLI, ejecuta el humo de CLI de eliminación de agentes en espacio de trabajo compartido, ejecuta el e2e de gateway-network del contenedor, verifica un argumento de compilación de una extensión incluida y ejecuta el perfil Docker acotado de Plugins incluidos bajo un tiempo de espera agregado de comando de 240 segundos (cada ejecución de Docker de escenario se limita por separado).
- **Ruta completa** conserva la instalación de paquetes QR y la cobertura Docker/de actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de lanzamiento mediante workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen de humo GHCR del Dockerfile raíz para un SHA de destino, luego ejecuta la instalación de paquete QR, humos del Dockerfile raíz/Gateway, humos de instalador/actualización y el E2E Docker rápido de Plugins incluidos como trabajos separados para que el trabajo del instalador no espere detrás de los humos de la imagen raíz.

Los pushes a `main` (incluidos los commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el flujo de trabajo conserva el humo Docker rápido y deja el humo completo de instalación para la validación nocturna o de lanzamiento.

El humo lento del proveedor de imágenes con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el flujo de trabajo de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden habilitarlo, pero los pull requests y los pushes a `main` no. La CI normal de PR aún ejecuta el carril rápido de regresión del lanzador Bun para cambios relevantes de Node. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles centrados en instalación.

## E2E Docker local

`pnpm test:docker:all` precompila una imagen compartida de pruebas live, empaqueta OpenClaw una vez como tarball npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner básico de Node/Git para carriles de instalador/actualización/dependencias de Plugin;
- una imagen funcional que instala el mismo tarball en `/app` para carriles de funcionalidad normal.

Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el runner solo ejecuta el plan seleccionado. El programador selecciona la imagen por carril con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta carriles con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustables

| Variable                               | Valor predeterminado | Propósito                                                                                                  |
| -------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10                   | Número de ranuras del grupo principal para carriles normales.                                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10                   | Número de ranuras del grupo de cola sensible al proveedor.                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9                    | Límite de carriles live concurrentes para que los proveedores no apliquen limitación.                      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5                    | Límite de carriles concurrentes de instalación npm.                                                        |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7                    | Límite de carriles concurrentes multiservicio.                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000                 | Desfase entre inicios de carril para evitar tormentas de creación del daemon Docker; establece `0` para no desfase. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000              | Tiempo de espera de respaldo por carril (120 minutos); algunos carriles live/de cola usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin definir          | `1` imprime el plan del programador sin ejecutar carriles.                                                 |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin definir          | Lista exacta de carriles separada por comas; omite el humo de limpieza para que los agentes puedan reproducir un carril fallido. |

Un carril más pesado que su límite efectivo aún puede iniciar desde un grupo vacío y luego se ejecuta solo hasta que libera capacidad. Los preflights agregados locales comprueban Docker, eliminan contenedores E2E obsoletos de OpenClaw, emiten estado de carril activo, conservan tiempos de carril para ordenar primero los más largos y, de forma predeterminada, dejan de programar nuevos carriles agrupados tras el primer fallo.

### Flujo de trabajo live/E2E reutilizable

El flujo de trabajo live/E2E reutilizable pregunta a `scripts/test-docker-all.mjs --plan-json` qué cobertura de paquete, tipo de imagen, imagen live, carril y credenciales se requiere. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y publica imágenes GHCR Docker E2E bare/funcionales etiquetadas por digest de paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita carriles con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de recompilar. Las descargas de imágenes Docker se reintentan con un tiempo de espera acotado de 180 segundos por intento para que un flujo atascado de registry/caché reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de lanzamiento

La cobertura Docker de lanzamiento ejecuta trabajos fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1`, de modo que cada fragmento descarga solo el tipo de imagen que necesita y ejecuta varios carriles mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos Docker de lanzamiento actuales son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y de `plugins-runtime-install-a` a `plugins-runtime-install-h`. `package-update-openai` incluye el carril live del paquete del Plugin Codex, que instala el paquete candidato de OpenClaw, instala el Plugin Codex desde `codex_plugin_spec` o un tarball de la misma referencia con aprobación explícita de instalación de Codex CLI, ejecuta el preflight de Codex CLI y luego ejecuta varios turnos de agente de OpenClaw en la misma sesión contra OpenAI. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de Plugin/runtime. El alias de carril `install-e2e` sigue siendo el alias agregado de reejecución manual para ambos carriles de instalador de proveedor.

OpenWebUI se integra en `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Los carriles de actualización de canales incluidos reintentan una vez ante fallos transitorios de red npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de carril, tiempos, `summary.json`, `failures.json`, tiempos de fase, JSON del plan del programador, tablas de carriles lentos y comandos de reejecución por carril. La entrada `docker_lanes` del flujo de trabajo ejecuta los carriles seleccionados contra las imágenes preparadas en lugar de los trabajos de fragmento, lo que mantiene la depuración de carriles fallidos acotada a un trabajo Docker específico y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si un carril seleccionado es un carril Docker live, el trabajo dirigido compila localmente la imagen de pruebas live para esa reejecución. Los comandos de reejecución de GitHub generados por carril incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imagen preparadas cuando esos valores existen, para que un carril fallido pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # descargar artefactos Docker e imprimir comandos de reejecución dirigidos combinados/por carril
pnpm test:docker:timings <summary>   # resúmenes de carriles lentos y ruta crítica de fases
```

El flujo de trabajo live/E2E programado ejecuta diariamente la suite Docker completa de release-path.

## Prelanzamiento de Plugins

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un flujo de trabajo separado despachado por `Full Release Validation` o por un operador explícito. Los pull requests normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de Plugins incluidos entre ocho workers de extensiones; esos trabajos de shards de extensiones ejecutan hasta dos grupos de configuración de Plugins a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de Plugins con muchas importaciones no creen trabajos de CI adicionales. La ruta de prelanzamiento Docker solo de lanzamiento agrupa carriles Docker dirigidos en grupos pequeños para evitar reservar decenas de runners para trabajos de uno a tres minutos. El flujo de trabajo también sube un artefacto informativo `plugin-inspector-advisory` desde `@openclaw/plugin-inspector`; los hallazgos del inspector son entrada de triaje y no cambian la puerta bloqueante de Plugin Prerelease.

## QA Lab

QA Lab tiene carriles de CI dedicados fuera del flujo de trabajo principal de alcance inteligente. La paridad agéntica está anidada bajo los harnesses amplios de QA y lanzamiento, no como un flujo de trabajo de PR independiente. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba acompañar una ejecución de validación amplia.

- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y con despacho manual; distribuye el carril de paridad mock, el carril live Matrix y los carriles live Telegram y Discord como trabajos paralelos. Los trabajos live usan el entorno `qa-live-shared`, y Telegram/Discord usan concesiones de Convex.

Las comprobaciones de lanzamiento ejecutan carriles de transporte live Matrix y Telegram con el proveedor mock determinista y modelos cualificados por mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para aislar el contrato de canal de la latencia de modelos live y del arranque normal de Plugins de proveedor. El Gateway de transporte live desactiva la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores está cubierta por las suites separadas de modelo live, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de lanzamiento, añadiendo `--fail-fast` solo cuando la CLI en checkout lo admite. El valor predeterminado de la CLI y la entrada manual del flujo de trabajo siguen siendo `all`; el despacho manual con `matrix_profile=all` siempre divide la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles críticos de lanzamiento de QA Lab antes de la aprobación de lanzamiento; su puerta de paridad de QA ejecuta los paquetes candidato y base como trabajos de carril paralelos, luego descarga ambos artefactos en un trabajo de informe pequeño para la comparación final de paridad.

Para PRs normales, sigue la evidencia de CI/comprobaciones con alcance en lugar de tratar la paridad como un estado requerido.

## CodeQL

El flujo de trabajo `CodeQL` es intencionalmente un escáner de seguridad estrecho de primera pasada, no un barrido completo del repositorio. Las ejecuciones diarias, manuales y de protección de pull requests no draft escanean código de flujos de trabajo de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La protección de pull requests se mantiene ligera: solo se inicia para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` o rutas runtime de Plugins incluidos que son dueñas de procesos, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. CodeQL de Android y macOS quedan fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                          | Superficie                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticación, secretos, sandbox, cron y línea base de gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del núcleo, además del runtime de Plugin de canal, gateway, Plugin SDK, secretos y puntos de contacto de auditoría              |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies de SSRF del núcleo, análisis de IP, protección de red, web-fetch y política de SSRF del Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, auxiliares de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agente                                           |
| `/codeql-security-high/process-exec-boundary`     | Shell local, auxiliares de creación de procesos, runtimes de plugins empaquetados que poseen subprocesos y pegamento de scripts de flujo de trabajo                             |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, instalación con gestor de paquetes, carga desde código fuente y contrato de paquete del Plugin SDK |

### Fragmentos de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — fragmento programado de seguridad de Android. Compila la app de Android manualmente para CodeQL en el runner Linux de Blacksmith más pequeño aceptado por la comprobación de cordura del flujo de trabajo. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento semanal/manual de seguridad de macOS. Compila la app de macOS manualmente para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el runtime incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento no relacionado con seguridad correspondiente. Ejecuta solo consultas de calidad JavaScript/TypeScript sin seguridad y de severidad de error sobre superficies estrechas de alto valor en runners Linux alojados en GitHub para que los análisis de calidad no consuman el presupuesto de registro de runners de Blacksmith. Su guarda de pull requests es intencionalmente más pequeña que el perfil programado: los PR no borrador solo ejecutan los fragmentos correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agentes y despacho de respuestas, código de esquema/migración/IO de configuración, código de autenticación/secretos/sandbox/seguridad, canal del núcleo y runtime de Plugin de canal empaquetado, protocolo Gateway/método de servidor, runtime de memoria/pegamento de SDK, MCP/proceso/entrega saliente, runtime de proveedor/catálogo de modelos, diagnósticos de sesión/colas de entrega, cargador de plugins, Plugin SDK/contrato de paquete o runtime de respuestas del Plugin SDK. Los cambios en la configuración de CodeQL y en el flujo de trabajo de calidad ejecutan los doce fragmentos de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son ganchos de enseñanza/iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                                | Superficie                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Autenticación, secretos, sandbox, cron y código de frontera de seguridad del gateway                                                                                                  |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización e IO                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo Gateway y contratos de métodos de servidor                                                                                                              |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canales del núcleo y Plugin de canal empaquetado                                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuesta automática, y contratos de runtime del plano de control ACP                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, auxiliares de supervisión de procesos y contratos de entrega saliente                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de host de memoria, fachadas de runtime de memoria, alias de memoria del Plugin SDK, pegamento de activación de runtime de memoria y comandos doctor de memoria                                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de cola de respuestas, colas de entrega de sesiones, auxiliares de enlace/entrega de sesiones salientes, superficies de eventos diagnósticos/paquetes de logs y contratos CLI de doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del Plugin SDK, auxiliares de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y auxiliares de enlace de sesión/hilo             |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización de catálogo de modelos, autenticación y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros de web/búsqueda/fetch/embeddings    |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de Control UI, persistencia local, flujos de control de gateway y contratos de runtime del plano de control de tareas                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/búsqueda web del núcleo, IO de medios, comprensión de medios, generación de imágenes y contratos de runtime de generación de medios                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y punto de entrada del Plugin SDK                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente publicado del Plugin SDK del lado del paquete y auxiliares de contrato de paquete de plugin                                                                                      |

La calidad permanece separada de la seguridad para que los hallazgos de calidad se puedan programar, medir, deshabilitar o ampliar sin ocultar la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins empaquetados debe volver a añadirse como trabajo de seguimiento acotado o fragmentado solo después de que los perfiles estrechos tengan runtime y señal estables.

## Flujos de trabajo de mantenimiento

### Agente de documentación

El flujo de trabajo `Docs Agent` es una vía de mantenimiento de Codex impulsada por eventos para mantener la documentación existente alineada con cambios recientes que han aterrizado. No tiene programación pura: una ejecución de CI exitosa de un push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por workflow-run se omiten cuando `main` ha avanzado o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen anterior no omitido de Docs Agent hasta el `main` actual, de modo que una ejecución horaria pueda cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Agente de rendimiento de pruebas

El flujo de trabajo `Test Performance Agent` es una vía de mantenimiento de Codex impulsada por eventos para pruebas lentas. No tiene programación pura: una ejecución de CI exitosa de un push no bot en `main` puede activarlo, pero se omite si otra invocación por workflow-run ya se ejecutó o se está ejecutando ese día UTC. El despacho manual omite esa puerta de actividad diaria. La vía crea un informe de rendimiento de Vitest agrupado de suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de suite completa y rechaza cambios que reduzcan el conteo base de pruebas aprobadas. El informe agrupado registra tiempo de reloj por configuración y RSS máximo en Linux y macOS, por lo que la comparación antes/después muestra deltas de memoria de pruebas junto a deltas de duración. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe de suite completa posterior al agente debe pasar antes de que se confirme nada. Cuando `main` avanza antes de que aterrice el push del bot, la vía hace rebase del parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad sin sudo que el agente de documentación.

### PR duplicados después de la fusión

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual de mantenedor para limpieza de duplicados posterior al aterrizaje. Por defecto usa dry-run y solo cierra los PR listados explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que el PR aterrizado esté fusionado y que cada duplicado tenga un issue referenciado compartido o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Puertas de comprobación local y enrutamiento de cambios

La lógica local de vías modificadas vive en `scripts/changed-lanes.mjs` y se ejecuta mediante `scripts/check-changed.mjs`. Esa puerta de comprobación local es más estricta con las fronteras de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan typecheck de producción del núcleo y de pruebas del núcleo, además de lint/guardas del núcleo;
- los cambios solo de pruebas del núcleo ejecutan solo typecheck de pruebas del núcleo, además de lint del núcleo;
- los cambios de producción de extensiones ejecutan typecheck de producción de extensiones y de pruebas de extensiones, además de lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan typecheck de pruebas de extensiones, además de lint de extensiones;
- los cambios públicos del Plugin SDK o de contrato de plugin amplían a typecheck de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los incrementos de versión solo de metadatos de lanzamiento ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todas las vías de comprobación.

El enrutamiento local de pruebas modificadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren mapeos explícitos, luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega de salas de grupo es uno de los mapeos explícitos: los cambios a la configuración de respuesta visible en grupo, el modo de entrega de respuesta de origen o el prompt del sistema de la herramienta de mensajes se enrutan por las pruebas de respuesta del núcleo más regresiones de entrega de Discord y Slack para que un cambio predeterminado compartido falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el arnés como para que el conjunto mapeado barato no sea un proxy confiable.

## Validación de Testbox

Crabbox es el wrapper de cajas remotas propiedad del repo para pruebas de Linux de mantenedores. Úsalo
desde la raíz del repo cuando una comprobación sea demasiado amplia para un ciclo local de edición, cuando importe
la paridad con CI, o cuando la prueba necesite secretos, Docker, lanes de paquetes,
cajas reutilizables o logs remotos. El backend normal de OpenClaw es
`blacksmith-testbox`; la capacidad propia de AWS/Hetzner es una alternativa para caídas de Blacksmith,
problemas de cuota o pruebas explícitas con capacidad propia.

Las ejecuciones de Blacksmith respaldadas por Crabbox calientan, reclaman, sincronizan, ejecutan, informan y limpian
Testboxes de un solo uso. La comprobación de cordura de sincronización integrada falla rápido cuando desaparecen
archivos raíz obligatorios como `pnpm-lock.yaml` o cuando `git status --short`
muestra al menos 200 eliminaciones con seguimiento. Para PRs intencionales con eliminaciones masivas, establece
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para el comando remoto.

Crabbox también finaliza una invocación local de la CLI de Blacksmith que permanezca en la
fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Establece
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor
en milisegundos para diffs locales inusualmente grandes.

Antes de una primera ejecución, comprueba el wrapper desde la raíz del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El wrapper del repo rechaza un binario de Crabbox obsoleto que no anuncie `blacksmith-testbox`. Pasa el proveedor explícitamente aunque `.crabbox.yaml` tenga valores predeterminados de nube propia. En worktrees de Codex o checkouts enlazados/dispersos, evita el script local `pnpm crabbox:run` porque pnpm puede reconciliar dependencias antes de que Crabbox arranque; invoca en su lugar el wrapper de node directamente:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Las ejecuciones respaldadas por Blacksmith requieren Crabbox 0.22.0 o posterior para que el wrapper obtenga el comportamiento actual de sincronización, cola y limpieza de Testbox. Al usar el checkout hermano, recompila el binario local ignorado antes de trabajo de tiempos o pruebas:

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
ya haya devuelto. Trátalo como un artefacto de limpieza/estado salvo que
el `exitCode` del wrapper sea distinto de cero o la salida del comando muestre una prueba fallida.
Las ejecuciones de Crabbox de un solo uso respaldadas por Blacksmith deberían detener el Testbox automáticamente;
si una ejecución se interrumpe o la limpieza no está clara, inspecciona las cajas activas y detén solo
las cajas que creaste:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Usa la reutilización solo cuando necesites intencionalmente múltiples comandos en la misma caja hidratada:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Si Crabbox es la capa rota pero Blacksmith en sí funciona, usa Blacksmith directo
solo para diagnósticos como `list`, `status` y limpieza. Arregla la
ruta de Crabbox antes de tratar una ejecución directa de Blacksmith como prueba de mantenedor.

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan pero los nuevos
precalentamientos quedan en `queued` sin IP ni URL de ejecución de Actions tras un par de minutos,
trátalo como presión del proveedor, cola, facturación o límite de organización de Blacksmith. Detén los
ids en cola que creaste, evita iniciar más Testboxes y mueve la prueba a la
ruta de capacidad propia de Crabbox que aparece abajo mientras alguien revisa el panel de Blacksmith,
la facturación y los límites de la organización.

Escala a capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, no tenga el entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Bajo presión de AWS, evita `class=beast` salvo que la tarea realmente necesite CPU de clase 48xlarge. Una solicitud `beast` empieza en 192 vCPU y es la forma más fácil de activar la cuota regional de EC2 Spot u On-Demand Standard. El `.crabbox.yaml` propiedad del repo usa por defecto `standard`, múltiples regiones de capacidad y `capacity.hints: true`, para que los leases de AWS intermediados impriman la región/mercado seleccionado, la presión de cuota, la alternativa de Spot y advertencias de clase con alta presión. Usa `fast` para comprobaciones amplias más pesadas, `large` solo después de que standard/fast no sean suficientes, y `beast` solo para lanes excepcionales limitados por CPU, como suite completa o matrices Docker de todos los plugins, validación explícita de release/bloqueador o profiling de rendimiento con muchos núcleos. No uses `beast` para `pnpm check:changed`, pruebas enfocadas, trabajo solo de docs, lint/typecheck ordinario, reproducciones E2E pequeñas o triaje de caída de Blacksmith. Usa `--market on-demand` para diagnóstico de capacidad, de modo que la variación del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` controla los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para lanes de nube propia. Excluye `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos remotos de Git en lugar de sincronizar remotos y almacenes de objetos locales del mantenedor, y excluye artefactos locales de runtime/compilación que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` controla el checkout, la configuración de Node/pnpm, el fetch de `origin/main` y la entrega del entorno no secreto para comandos de nube propia `crabbox run --id <cbx_id>`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
