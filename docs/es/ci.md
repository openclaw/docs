---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando una comprobación fallida de GitHub Actions
    - Está coordinando una ejecución o repetición de validación de lanzamiento
    - Estás cambiando el envío de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, puertas de alcance, paraguas de release y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-07-05T01:54:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1420bd233290e4377b73dea864253eeb3e57b5cd626698305546bcac691840c0
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. Los pushes canónicos a `main` primero pasan por una ventana de admisión de 90 segundos en un runner hospedado. El grupo de concurrencia `CI` existente cancela esa ejecución en espera cuando llega un commit más nuevo, por lo que las fusiones secuenciales no registran cada una una matriz completa de Blacksmith. Las pull requests y los despachos manuales omiten la espera. Luego, el job `preflight` clasifica el diff y desactiva las lanes costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y despliegan todo el grafo para candidatos de lanzamiento y validación amplia. Las lanes de Android siguen siendo opcionales mediante `include_android`. La cobertura de plugins solo para lanzamientos vive en el workflow separado [`Prelanzamiento de Plugin`](#plugin-prerelease) y solo se ejecuta desde [`Validación completa de lanzamiento`](#full-release-validation) o un despacho manual explícito.

## Resumen del pipeline

| Job                                | Propósito                                                                                                  | Cuándo se ejecuta                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `preflight`                        | Detectar cambios solo de docs, alcances cambiados, extensiones cambiadas y construir el manifiesto de CI   | Siempre en pushes y PRs que no son borrador            |
| `runner-admission`                 | Debounce hospedado de 90 segundos para pushes canónicos a `main` antes de registrar trabajo en Blacksmith  | Cada ejecución de CI; duerme solo en pushes canónicos a `main` |
| `security-fast`                    | Detección de claves privadas, auditoría de workflows cambiados mediante `zizmor` y auditoría del lockfile de producción | Siempre en pushes y PRs que no son borrador            |
| `check-dependencies`               | Pasada de Knip solo para dependencias de producción más el guard de allowlist de archivos sin usar         | Cambios relevantes para Node                           |
| `build-artifacts`                  | Construir `dist/`, Control UI, smokes de CLI construida, comprobaciones de artefactos construidos embebidos y artefactos reutilizables | Cambios relevantes para Node                           |
| `checks-fast-core`                 | Lanes rápidas de corrección en Linux, como bundled, protocol, QA Smoke CI y comprobaciones de enrutamiento de CI | Cambios relevantes para Node                           |
| `checks-fast-contracts-plugins-*`  | Dos comprobaciones fragmentadas de contratos de plugins                                                    | Cambios relevantes para Node                           |
| `checks-fast-contracts-channels-*` | Dos comprobaciones fragmentadas de contratos de canales                                                    | Cambios relevantes para Node                           |
| `checks-node-core-*`               | Shards de tests de Node core, excluyendo lanes de canal, bundled, contrato y extensión                     | Cambios relevantes para Node                           |
| `check-*`                          | Equivalente fragmentado de la puerta local principal: tipos de prod, lint, guards, tipos de test y smoke estricto | Cambios relevantes para Node                           |
| `check-additional-*`               | Arquitectura, deriva fragmentada de boundaries/prompts, guards de extensión, boundary de paquete y topología de runtime | Cambios relevantes para Node                           |
| `checks-node-compat-node22`        | Lane de build de compatibilidad con Node 22 y smoke                                                        | Despacho manual de CI para lanzamientos                |
| `check-docs`                       | Formato de docs, lint y comprobaciones de enlaces rotos                                                    | Docs cambiadas                                         |
| `skills-python`                    | Ruff + pytest para skills respaldadas por Python                                                           | Cambios relevantes para skills de Python               |
| `checks-windows`                   | Tests específicos de Windows para procesos/rutas más regresiones compartidas de especificadores de import de runtime | Cambios relevantes para Windows                        |
| `macos-node`                       | Lane de tests TypeScript de macOS usando los artefactos construidos compartidos                            | Cambios relevantes para macOS                          |
| `macos-swift`                      | Lint, build y tests de Swift para la app de macOS                                                          | Cambios relevantes para macOS                          |
| `ios-build`                        | Generación del proyecto Xcode más build de simulador de la app iOS                                         | App iOS, kit de app compartido o cambios de Swabble    |
| `android`                          | Tests unitarios de Android para ambos sabores más un build APK debug                                       | Cambios relevantes para Android                        |
| `test-performance-agent`           | Optimización diaria de tests lentos de Codex después de actividad confiable                                | Éxito de CI principal o despacho manual                |
| `openclaw-performance`             | Informes diarios/bajo demanda de rendimiento de runtime Kova con mock-provider, deep-profile y lanes live de GPT 5.5 | Programado y despacho manual                           |

## Orden de fail-fast

1. `runner-admission` espera solo para pushes canónicos a `main`; un push más nuevo cancela la ejecución antes del registro en Blacksmith.
2. `preflight` decide qué lanes existen en absoluto. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este job, no jobs independientes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los jobs más pesados de artefactos y matrices de plataforma.
4. `build-artifacts` se solapa con las lanes rápidas de Linux para que los consumidores posteriores puedan comenzar en cuanto el build compartido esté listo.
5. Las lanes más pesadas de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` y `android`.

GitHub puede marcar jobs reemplazados como `cancelled` cuando llega un push más nuevo al mismo PR o ref `main`. Trátalo como ruido de CI salvo que la ejecución más nueva para el mismo ref también esté fallando. Los jobs de matriz usan `fail-fast: false`, y `build-artifacts` informa fallos embebidos de channel, core-support-boundary y gateway-watch directamente en lugar de poner en cola jobs verificadores pequeños. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones más nuevas de main. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en progreso.

Usa `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` para resumir tiempo total, tiempo en cola, jobs más lentos, fallos y la barrera de fanout `pnpm-store-warmup` desde GitHub Actions. CI también sube el mismo resumen de ejecución como artefacto `ci-timings-summary`. Para tiempos de build, revisa el paso `Build dist` del job `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e incluye `ui:build`; el job también sube el artefacto `startup-memory`.

Para ejecuciones de pull request, el job terminal de resumen de tiempos ejecuta el helper desde la revisión base confiable antes de pasar `GH_TOKEN` a `gh run view`. Eso mantiene la consulta con token fuera del código controlado por la rama y aun así resume la ejecución actual de CI de la pull request.

## Contexto y evidencia de PR

Las PRs de contribuidores externos ejecutan una puerta de contexto y evidencia de PR desde `.github/workflows/real-behavior-proof.yml`. El workflow hace checkout del commit base confiable y evalúa solo el cuerpo de la PR; no ejecuta código de la rama del contribuidor.

La puerta se aplica a autores de PR que no son propietarios, miembros, colaboradores ni bots del repositorio. Pasa cuando el cuerpo de la PR contiene secciones redactadas por el autor `What Problem This Solves` y `Evidence`. La evidencia puede ser un test enfocado, resultado de CI, captura de pantalla, grabación, salida de terminal, observación live, log redactado o enlace a artefacto. El cuerpo proporciona intención y validación útil; los revisores inspeccionan el código, los tests y CI para evaluar la corrección.

Cuando la comprobación falla, actualiza el cuerpo de la PR en lugar de subir otro commit de código.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por tests unitarios en `src/scripts/ci-changed-scope.test.ts`. El despacho manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si cada área con alcance hubiera cambiado.

- **Ediciones del workflow de CI** validan el grafo de CI de Node más linting de workflow, pero no fuerzan por sí mismas builds nativos de Windows, iOS, Android o macOS; esas lanes de plataforma siguen limitadas a cambios en fuentes de plataforma.
- **Workflow Sanity** ejecuta `actionlint`, `zizmor` sobre todos los archivos YAML de workflow, el guard de interpolación de composite-action y el guard de marcadores de conflicto. El job `security-fast` con alcance de PR también ejecuta `zizmor` sobre archivos de workflow cambiados para que los hallazgos de seguridad de workflow fallen temprano en el grafo principal de CI.
- **Docs en pushes a `main`** se comprueban mediante el workflow independiente `Docs` con el mismo espejo de docs de ClawHub usado por CI, de modo que los pushes mixtos de código+docs no pongan también en cola el shard `check-docs` de CI. Las pull requests y la CI manual siguen ejecutando `check-docs` desde CI cuando cambiaron docs.
- **TUI PTY** se ejecuta en el shard Linux Node `checks-node-core-runtime-tui-pty` para cambios de TUI. El shard ejecuta `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, por lo que cubre tanto la lane determinista del fixture `TuiBackend` como el smoke más lento `tui --local` que simula solo el endpoint externo del modelo.
- **Ediciones solo de enrutamiento de CI, ediciones seleccionadas baratas de fixtures de core-test y ediciones estrechas de helpers/enrutamiento de tests de contratos de plugins** usan una ruta rápida de manifiesto solo Node: `preflight`, seguridad y una sola tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canal, shards completos de core, shards de bundled-plugin y matrices de guards adicionales cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Comprobaciones Node de Windows** están limitadas a wrappers específicos de Windows para procesos/rutas, helpers de runner npm/pnpm/UI, configuración del gestor de paquetes y las superficies de workflow de CI que ejecutan esa lane; cambios no relacionados de fuente, plugin, install-smoke y solo tests permanecen en las lanes Linux Node.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo se mantenga pequeño sin sobrerreservar ejecutores: los contratos de plugins y los contratos de canales se ejecutan cada uno como dos fragmentos ponderados respaldados por Blacksmith con la reserva estándar de ejecutor de GitHub, los carriles rápidos/de soporte de unidades del núcleo se ejecutan por separado, la infraestructura de runtime del núcleo se divide entre estado, proceso/configuración, compartido y tres fragmentos de dominio cron, auto-reply se ejecuta como workers equilibrados (con el subárbol de respuestas dividido en fragmentos de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic gateway/server se dividen entre carriles chat/auth/model/http-plugin/runtime/startup en lugar de esperar artefactos compilados. Luego, la CI normal empaqueta solo fragmentos aislados de patrones de inclusión de infraestructura en paquetes deterministas de como máximo 64 archivos de prueba, lo que reduce la matriz de Node sin fusionar suites no aisladas de command/cron, agents-core con estado ni gateway/server; las suites fijas pesadas permanecen en 8 vCPU, mientras que los carriles empaquetados y de menor peso usan 4 vCPU. Las solicitudes de incorporación de cambios en el repositorio canónico usan un plan de admisión compacto adicional: los mismos grupos por configuración se ejecutan en subprocesos aislados dentro del plan actual de 34 trabajos Linux Node, de modo que una sola PR no registra la matriz completa de Node de más de 70 trabajos. Los envíos a `main`, las ejecuciones manuales y las puertas de release conservan la matriz completa. Las pruebas amplias de navegador, QA, medios y plugins varios usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los fragmentos de patrones de inclusión registran entradas de tiempos usando el nombre del fragmento de CI, de modo que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un fragmento filtrado. `check-additional-*` mantiene juntas las tareas de compilación/canary de límites de paquetes y separa la arquitectura de topología de runtime de la cobertura de gateway watch; la lista de guards de límites se distribuye en un fragmento con mucha carga de prompts y un fragmento combinado para las tiras de guards restantes, cada uno ejecutando guards independientes seleccionados en paralelo e imprimiendo tiempos por comprobación. La costosa comprobación de desviación de snapshot de prompts del happy-path de Codex se ejecuta como su propio trabajo adicional solo para CI manual y para cambios que afectan prompts, de modo que los cambios normales no relacionados de Node no esperen detrás de la generación en frío de snapshots de prompts y los fragmentos de límites se mantengan equilibrados, mientras la desviación de prompts sigue anclada a la PR que la causó; la misma marca omite la generación de snapshots de prompts de Vitest dentro del fragmento core support-boundary de artefactos compilados. Gateway watch, las pruebas de canales y el fragmento core support-boundary se ejecutan en paralelo dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén compilados.

Una vez admitida, la CI Linux canónica permite hasta 24 trabajos de prueba de Node simultáneos y
12 para los carriles rápidos/de comprobación más pequeños; Windows y Android se mantienen en dos porque
esos pools de ejecutores son más estrechos.

El plan compacto de PR emite 18 trabajos de Node para la suite actual: los grupos
de configuración completa se agrupan en lotes en subprocesos aislados con un timeout de lote de 120 minutos,
mientras que los grupos de patrones de inclusión comparten el mismo presupuesto acotado de trabajos.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego compila el APK de depuración de Play. El flavor third-party no tiene un source set ni manifiesto separado; su carril de pruebas unitarias todavía compila el flavor con las marcas BuildConfig de SMS/call-log, mientras evita un trabajo duplicado de empaquetado de APK de depuración en cada push relevante para Android.

El fragmento `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una pasada de solo dependencias de producción de Knip fijada a la versión más reciente de Knip, con la edad mínima de release de pnpm desactivada para la instalación con `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos no usados de producción de Knip con `scripts/deadcode-unused-files.allowlist.mjs`. El guard de archivos no usados falla cuando una PR agrega un nuevo archivo no usado sin revisar o deja una entrada obsoleta en la allowlist, mientras conserva superficies intencionales dinámicas de plugins, generadas, de compilación, de pruebas live y de puentes de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado de destino desde la actividad del repositorio de OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código no confiable de solicitudes de incorporación de cambios. El flujo de trabajo crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego envía payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El flujo de trabajo tiene cuatro carriles:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y solicitudes de incorporación de cambios;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente de ClawSweeper puede inspeccionar.

El carril `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando están presentes. Evita intencionalmente reenviar el cuerpo completo del Webhook. El flujo de trabajo receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente de ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente de ClawSweeper recibe el destino de Discord en su prompt y debe publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Aperturas rutinarias, ediciones, ruido de bots, ruido duplicado de Webhook y tráfico normal de revisiones deben resultar en `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisiones, nombres de ramas y mensajes de commit de GitHub como datos no confiables en todo este camino. Son entrada para resumen y triage, no instrucciones para el flujo de trabajo ni para el runtime del agente.

## Ejecuciones manuales

Las ejecuciones manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan todos los carriles con alcance no Android: fragmentos Linux Node, fragmentos de plugins incluidos, fragmentos de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones smoke de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS, compilación de iOS y Control UI i18n. Las ejecuciones manuales independientes de CI ejecutan Android solo con `include_android=true`; el paraguas completo de release habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prerelease de plugins, el fragmento solo de release `agentic-plugins`, el barrido completo por lotes de extensiones y los carriles Docker de prerelease de plugins quedan excluidos de la CI. La suite Docker de prerelease se ejecuta solo cuando `Full Release Validation` lanza el flujo de trabajo separado `Plugin Prerelease` con la puerta de validación de release habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidato de release no sea cancelada por otro push o ejecución de PR en la misma ref. La entrada opcional `target_ref` permite que un llamador confiable ejecute ese grafo contra una rama, etiqueta o SHA completo de commit usando el archivo de flujo de trabajo desde la ref de dispatch seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

La ruta mensual extended-stable solo para npm es la excepción: ejecuta tanto el preflight de `OpenClaw NPM
Release` como `Full Release Validation` desde la rama exacta
`extended-stable/YYYY.M.33`, conserva sus IDs de ejecución y pasa ambos IDs a la
ejecución directa de publicación npm. Consulta [Publicación mensual extended-stable
solo para npm](/es/reference/RELEASING#monthly-npm-only-extended-stable-publication) para
los comandos, los requisitos exactos de identidad, la lectura de vuelta del registro y el procedimiento de reparación
del selector. Esta ruta no ejecuta publicación de plugins, macOS, Windows, GitHub
Release, dist-tag privado ni otras plataformas.

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Ejecución manual de CI y fallbacks de repositorios no canónicos, escaneos de calidad de CodeQL JavaScript/actions, workflow-sanity, labeler, auto-response, flujos de documentación fuera de CI y preflight de install-smoke para que la matriz de Blacksmith pueda encolarse antes                    |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, fragmentos de extensiones de menor peso, `checks-fast-core` excepto QA Smoke CI, fragmentos de contratos de plugins/canales, la mayoría de los fragmentos Linux Node incluidos/de menor peso, `check-guards`, `check-prod-types`, `check-test-types`, fragmentos `check-additional-*` seleccionados y `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites pesadas Linux Node retenidas, fragmentos `check-additional-*` pesados de límites/extensiones y `android`                                                                                                                                                                                        |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` en CI y Testbox, `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el tiempo de cola de 32 vCPU costó más de lo que ahorró)                                                        |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-15`     | `macos-node` en `openclaw/openclaw`; los forks usan fallback a `macos-15`                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` en `openclaw/openclaw`; los forks usan fallback a `macos-26`                                                                                                                                                                                                                |

## Presupuesto de registro de ejecutores

El bucket actual de registro de ejecutores de GitHub de OpenClaw informa 10.000 registros de
ejecutores self-hosted cada 5 minutos en `ghx api rate_limit`. Vuelve a comprobar
`actions_runner_registration` antes de cada pasada de ajuste porque GitHub puede cambiar
este bucket. El límite es compartido por todos los registros de ejecutores de Blacksmith en la
organización `openclaw`, por lo que agregar otra instalación de Blacksmith no agrega
un bucket nuevo.

Trata las etiquetas de Blacksmith como el recurso escaso para control de ráfagas. Los trabajos que
solo enrutan, notifican, resumen, seleccionan fragmentos o ejecutan escaneos breves de CodeQL deben
permanecer en ejecutores hospedados por GitHub salvo que tengan necesidades específicas de Blacksmith
medidas. Cualquier matriz nueva de Blacksmith, `max-parallel` mayor o flujo de trabajo de alta frecuencia
debe mostrar su conteo de registros en el peor caso y mantener el objetivo a nivel de organización
por debajo de aproximadamente el 60% del bucket en vivo. Con el bucket actual de 10.000 registros,
eso significa un objetivo operativo de 6.000 registros, dejando margen para
repositorios concurrentes, reintentos y superposición de ráfagas.

La CI del repositorio canónico mantiene Blacksmith como la ruta predeterminada de ejecutores para ejecuciones normales de push y solicitudes de incorporación de cambios. `workflow_dispatch` y las ejecuciones de repositorios no canónicos usan ejecutores hospedados por GitHub, pero las ejecuciones canónicas normales actualmente no prueban el estado de cola de Blacksmith ni hacen fallback automáticamente a etiquetas hospedadas por GitHub cuando Blacksmith no está disponible.

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

El lanzamiento manual normalmente mide el rendimiento de la referencia del flujo de trabajo. Define `target_ref` para medir una etiqueta de versión u otra rama con la implementación actual del flujo de trabajo. Las rutas de los informes publicados y los punteros más recientes se indexan por la referencia probada, y cada `index.md` registra la referencia/SHA probada, la referencia/SHA del flujo de trabajo, la referencia de Kova, el perfil, el modo de autenticación del carril, el modelo, el recuento de repeticiones y los filtros de escenarios.

El flujo de trabajo instala OCM desde una versión fijada y Kova desde `openclaw/Kova` en la entrada `kova_ref` fijada, y luego ejecuta tres carriles:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfiles de CPU, heap y trazas para puntos críticos de arranque, gateway y turnos de agente.
- `live-openai-candidate`: un turno real de agente OpenAI `openai/gpt-5.5`, omitido cuando `OPENAI_API_KEY` no está disponible.

El carril mock-provider también ejecuta sondeos de código fuente nativos de OpenClaw después de la pasada de Kova: tiempo de arranque y memoria del gateway en los casos de arranque predeterminado, con hook y con 50 plugins; RSS de importación de plugins incluidos, bucles de saludo repetidos `channel-chat-baseline` con OpenAI simulado, comandos de arranque de CLI contra el gateway iniciado y el sondeo de rendimiento smoke del estado SQLite. Cuando el informe de código fuente mock-provider publicado anteriormente está disponible para la referencia probada, el resumen de código fuente compara los valores actuales de RSS y heap con esa línea base y marca los aumentos grandes de RSS como `watch`. El resumen Markdown del sondeo de código fuente vive en `source/index.md` dentro del paquete de informes, con el JSON sin procesar junto a él.

Cada carril sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondeo de código fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la referencia probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación de versión completa

`Full Release Validation` es el flujo de trabajo paraguas manual para "ejecutarlo todo antes de la versión". Acepta una rama, etiqueta o SHA de commit completo, lanza el flujo de trabajo manual `CI` con ese objetivo, lanza `Plugin Prerelease` para pruebas de plugins/paquetes/estáticos/Docker solo de versión, y lanza `OpenClaw Release Checks` para smoke de instalación, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, renderizado del scorecard de madurez desde evidencia de perfil QA, paridad de QA Lab, Matrix y carriles de Telegram. Los perfiles stable y full siempre incluyen cobertura exhaustiva live/E2E y de soak de ruta de versión en Docker; el perfil beta puede activarla con `run_release_soak=true`. El E2E canónico de Telegram del paquete se ejecuta dentro de Package Acceptance, así que un candidato completo no inicia un segundo poller live. Después de publicar, pasa `release_package_spec` para reutilizar el paquete npm enviado en las comprobaciones de versión, Package Acceptance, Docker, entre sistemas operativos y Telegram sin recompilar. Usa `npm_telegram_package_spec` solo para una repetición enfocada de Telegram con paquete publicado. El carril de paquete live del plugin Codex usa el mismo estado seleccionado de forma predeterminada: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mientras que las ejecuciones por SHA/artefacto empaquetan `extensions/codex` desde la referencia seleccionada. Define `codex_plugin_spec` explícitamente para fuentes de plugin personalizadas, como especificaciones `npm:`, `npm-pack:` o `git:`.

Consulta [Validación de versión completa](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos del flujo de trabajo, las diferencias de perfil, los artefactos y
los identificadores de repetición enfocada.

`OpenClaw Release Publish` es el flujo de trabajo manual mutante de publicación de versiones. Lánzalo
desde `release/YYYY.M.PATCH` o `main` después de que exista la etiqueta de versión y después de que
el preflight de npm de OpenClaw haya tenido éxito. Verifica `pnpm plugins:sync:check`,
lanza `Plugin NPM Release` para todos los paquetes de plugins publicables, lanza
`Plugin ClawHub Release` para el mismo SHA de versión y solo entonces lanza
`OpenClaw NPM Release` con el `preflight_run_id` guardado. La publicación stable también
requiere un `windows_node_tag` exacto; el flujo de trabajo verifica la versión de código fuente de Windows
y compara sus instaladores x64/ARM64 con la entrada
`windows_node_installer_digests` aprobada como candidata antes de cualquier hijo de publicación, luego promociona
y verifica esos mismos resúmenes de instalador fijados más el activo acompañante exacto
y el contrato de suma de comprobación antes de publicar el borrador de versión de GitHub.

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

Las referencias de lanzamiento de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHAs de commit sin procesar. El
helper empuja una rama temporal `release-ci/<sha>-...` en el SHA objetivo,
lanza `Full Release Validation` desde esa referencia fijada, verifica que cada `headSha`
de flujo de trabajo hijo coincida con el objetivo y elimina la rama temporal cuando la
ejecución completa. El verificador paraguas también falla si algún flujo de trabajo hijo se ejecutó en un
SHA diferente.

`release_profile` controla la amplitud live/proveedor pasada a las comprobaciones de versión. Los
flujos de trabajo manuales de versión usan `stable` de forma predeterminada; usa `full` solo cuando
quieras intencionadamente la matriz amplia consultiva de proveedor/medios. Las comprobaciones de versión stable y full
siempre ejecutan el soak exhaustivo live/E2E y Docker de ruta de versión;
el perfil beta puede activarlo con `run_release_soak=true`.

- `minimum` mantiene los carriles más rápidos críticos para la versión de OpenAI/core.
- `stable` añade el conjunto stable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedor/medios.

El paraguas registra los identificadores de ejecución de los hijos lanzados, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y añade tablas de los trabajos más lentos para cada ejecución hija. Si un flujo de trabajo hijo se vuelve a ejecutar y pasa a verde, vuelve a ejecutar solo el trabajo verificador padre para refrescar el resultado paraguas y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de versión, `ci` solo para el hijo de CI completo normal, `plugin-prerelease` solo para el hijo de prerelease de plugins, `release-checks` para todos los hijos de versión, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la repetición de una caja de versión fallida después de una corrección enfocada. Para un carril cross-OS fallido, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos cross-OS largos emiten líneas de heartbeat y los resúmenes de packaged-upgrade incluyen tiempos por fase. Los carriles de release-check de QA son consultivos excepto la puerta estándar de cobertura de herramientas runtime, que bloquea cuando las herramientas dinámicas requeridas de OpenClaw se desvían o desaparecen del resumen del nivel estándar.

`OpenClaw Release Checks` usa la referencia confiable del flujo de trabajo para resolver la referencia seleccionada una vez en un tarball `release-package-under-test`, luego pasa ese artefacto a las comprobaciones cross-OS y a Package Acceptance, además del flujo de trabajo Docker live/E2E de ruta de versión cuando se ejecuta cobertura soak. Eso mantiene coherentes los bytes del paquete entre cajas de versión y evita volver a empaquetar el mismo candidato en varios trabajos hijos. Para el carril live de plugin npm de Codex, las comprobaciones de versión pasan una especificación de plugin publicado coincidente derivada de `release_package_spec`, pasan el `codex_plugin_spec` suministrado por el operador o dejan la entrada en blanco para que el script Docker empaquete el plugin Codex del checkout seleccionado.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
sustituyen al paraguas anterior. El monitor padre cancela cualquier flujo de trabajo hijo que
ya haya lanzado cuando se cancela el padre, así que la validación más reciente de main
no queda detrás de una ejecución stale de dos horas de release-check. La validación de rama/etiqueta de versión
y los grupos de repetición enfocada mantienen `cancel-in-progress: false`.

## Fragmentos live y E2E

El hijo live/E2E de versión mantiene una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como fragmentos con nombre mediante `scripts/test-live-shard.mjs` en lugar de un único trabajo serial:

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
- fragmentos separados de audio/video de medios y fragmentos de música filtrados por proveedor

Esto mantiene la misma cobertura de archivos mientras facilita repetir y diagnosticar fallos lentos de proveedores live. Los nombres agregados de fragmentos `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales de una sola vez.

Los fragmentos nativos live de medios se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners normales de Blacksmith: los trabajos de contenedor no son el lugar correcto para lanzar pruebas Docker anidadas.

Los shards de modelo/backend en vivo respaldados por Docker usan una imagen compartida independiente `ghcr.io/openclaw/openclaw-live-test:<sha>` por cada commit seleccionado. El flujo de trabajo de lanzamiento en vivo construye y publica esa imagen una vez; luego los shards del modelo en vivo de Docker, el Gateway segmentado por proveedor, el backend de CLI, el enlace ACP y el arnés de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards de Gateway Docker llevan límites `timeout` explícitos a nivel de script por debajo del timeout del job del flujo de trabajo, de modo que un contenedor bloqueado o una ruta de limpieza falla rápido en vez de consumir todo el presupuesto de comprobación de lanzamiento. Si esos shards reconstruyen de forma independiente el destino Docker completo desde el código fuente, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo de reloj en construcciones de imagen duplicadas.

## Aceptación de paquetes

Usa `Package Acceptance` cuando la pregunta sea "¿este paquete instalable de OpenClaw funciona como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo arnés E2E de Docker que los usuarios ejercitan después de instalar o actualizar.

### Jobs

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime el origen, la ref del flujo de trabajo, la ref del paquete, la versión, SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con digest del paquete cuando hace falta y ejecuta los lanes Docker seleccionados contra ese paquete en vez de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego distribuye esos lanes como jobs Docker dirigidos en paralelo con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; el dispatch independiente de Telegram todavía puede instalar una especificación npm publicada.
4. `summary` hace fallar el flujo de trabajo si falló la resolución del paquete, la aceptación Docker o el lane opcional de Telegram.

### Orígenes de candidatos

- `source=npm` acepta solo `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para aceptación publicada extended-stable, preliminar o estable.
- `source=ref` empaqueta una rama, etiqueta o SHA de commit completo `package_ref` de confianza. El resolvedor obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o desde una etiqueta de lanzamiento, instala dependencias en un worktree separado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS público; `package_sha256` es obligatorio. Esta ruta rechaza credenciales en URL, puertos HTTPS no predeterminados, nombres de host o IP resueltas privadas/internas/de uso especial, y redirecciones fuera de la misma política pública de seguridad.
- `source=trusted-url` descarga un `.tgz` HTTPS desde una política de origen de confianza con nombre en `.github/package-trusted-sources.json`; `package_sha256` y `trusted_source_id` son obligatorios. Usa esto solo para espejos empresariales propiedad de mantenedores o repositorios de paquetes privados que necesitan hosts, puertos, prefijos de ruta, hosts de redirección o resolución de red privada configurados. Si la política declara autenticación bearer, el flujo de trabajo usa el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; las credenciales incrustadas en URL siguen siendo rechazadas.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de flujo de trabajo/arnés de confianza que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits de origen de confianza más antiguos sin ejecutar lógica antigua del flujo de trabajo.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de lanzamiento Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de Plugin sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad en vivo de ClawHub. El lane opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, manteniendo la ruta de especificación npm publicada para dispatches independientes.

Para la política dedicada de pruebas de actualizaciones y plugins, incluidos comandos locales,
lanes Docker, entradas de Package Acceptance, valores predeterminados de lanzamiento y triaje de fallos,
consulta [Probar actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a Package Acceptance con `source=artifact`, el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` y `telegram_mode=mock-openai`. Esto mantiene la prueba de migración de paquetes, actualización, instalación de Skills de ClawHub en vivo, limpieza de dependencias obsoletas de plugins, reparación de instalación de plugins configurados, Plugin sin conexión, actualización de Plugin y Telegram sobre el mismo tarball de paquete resuelto. Define `release_package_spec` en Full Release Validation u OpenClaw Release Checks después de publicar una beta para ejecutar la misma matriz contra el paquete npm enviado sin reconstruir; define `package_acceptance_package_spec` solo cuando Package Acceptance necesita un paquete distinto al del resto de la validación de lanzamiento. Las comprobaciones de lanzamiento multiplataforma todavía cubren el onboarding, instalador y comportamiento de plataforma específicos de cada sistema operativo; la validación de producto de paquete/actualización debe empezar con Package Acceptance. El lane Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución en la ruta de lanzamiento bloqueante. En Package Acceptance, el tarball `package-under-test` resuelto siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de fallback, con valor predeterminado `openclaw@latest`; los comandos de reejecución de lanes fallidos conservan esa línea base. Full Release Validation con `run_release_soak=true` o `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para expandirse por las cuatro últimas versiones npm estables más versiones de frontera fijadas de compatibilidad de plugins y fixtures con forma de incidencias para configuración de Feishu, archivos bootstrap/persona preservados, instalaciones configuradas de plugins de OpenClaw, rutas de log con tilde y raíces de dependencias heredadas obsoletas de plugins. Las selecciones publicadas multi-línea base de upgrade survivor se dividen por línea base en jobs de runner Docker dirigidos separados. El flujo de trabajo independiente `Update Migration` usa el lane Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de CI de Full Release. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquetes con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantener un único lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El lane publicado configura la línea base con una receta de comando `openclaw config set` integrada, registra los pasos de la receta en `summary.json` y prueba `/healthz`, `/readyz`, además del estado RPC después del inicio de Gateway. Los lanes frescos de paquete e instalador en Windows también verifican que un paquete instalado pueda importar una anulación de control de navegador desde una ruta absoluta Windows sin procesar. El smoke de turno de agente OpenAI multiplataforma usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definido; de lo contrario, `openai/gpt-5.5`, para que la prueba de instalación y Gateway permanezca en un modelo de prueba GPT-5 mientras evita valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas conocidas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa flag;
- `update-channel-switch` puede podar `patchedDependencies` de pnpm ausentes desde el fixture de git falso derivado del tarball y puede registrar la falta de `update.channel` persistido;
- los smokes de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar que falte la persistencia del registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración mientras sigue exigiendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir por archivos de sello de metadatos de compilación local que ya fueron enviados. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en vez de advertir u omitirse.

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

# Validate the published extended-stable package with package coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@extended-stable \
  -f suite_profile=package \
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

Al depurar una ejecución fallida de aceptación de paquetes, empieza por el resumen de `resolve_package` para confirmar el origen del paquete, la versión y SHA-256. Luego inspecciona la ejecución hija `docker_acceptance` y sus artefactos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tiempos de fases y comandos de reejecución. Prefiere volver a ejecutar el perfil de paquete fallido o los lanes Docker exactos en vez de volver a ejecutar la validación completa de lanzamiento.

## Smoke de instalación

El flujo de trabajo independiente `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies de Docker/paquetes, cambios de paquete/manifiesto de Plugin incluido, o superficies del Plugin SDK/core plugin/canal/gateway que ejercitan los jobs smoke de Docker. Los cambios de solo código fuente en Plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida construye una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agentes en workspace compartido, ejecuta el e2e del gateway-network del contenedor, verifica un argumento de build de extensión incluida y ejecuta el perfil Docker acotado de Plugins incluidos bajo un timeout agregado de comando de 240 segundos (cada ejecución Docker de escenario se limita por separado).
- **Ruta completa** conserva la instalación del paquete QR y la cobertura Docker/de actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de lanzamiento por workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen smoke GHCR del Dockerfile raíz con SHA objetivo, luego ejecuta la instalación del paquete QR, smokes del Dockerfile raíz/gateway, smokes de instalador/actualización y el E2E Docker rápido de Plugins incluidos como jobs separados para que el trabajo del instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el workflow mantiene el smoke Docker rápido y deja el smoke de instalación completo para la validación nocturna o de lanzamiento.

El smoke lento de proveedor de imagen con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero los pull requests y pushes a `main` no. La CI normal de PR todavía ejecuta el carril rápido de regresión del lanzador Bun para cambios relevantes para Node. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles centrados en instalación.

## E2E Docker local

`pnpm test:docker:all` preconstruye una imagen de pruebas en vivo compartida, empaqueta OpenClaw una vez como tarball de npm y construye dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner básico de Node/Git para carriles de instalador/actualización/dependencias de Plugins;
- una imagen funcional que instala el mismo tarball en `/app` para carriles de funcionalidad normal.

Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el runner solo ejecuta el plan seleccionado. El planificador selecciona la imagen por carril con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta carriles con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustables

| Variable                               | Predeterminado | Propósito                                                                                     |
| -------------------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Recuento de slots del pool principal para carriles normales.                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Recuento de slots del pool final sensible a proveedores.                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de carriles en vivo concurrentes para que los proveedores no apliquen throttling.      |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5              | Límite de carriles concurrentes de instalación npm.                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de carriles concurrentes multiservicio.                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de carril para evitar tormentas de creación del daemon Docker; establece `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Timeout de respaldo por carril (120 minutos); los carriles en vivo/finales seleccionados usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset          | `1` imprime el plan del planificador sin ejecutar carriles.                                   |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset          | Lista exacta de carriles separada por comas; omite el smoke de limpieza para que los agentes puedan reproducir un carril fallido. |

Un carril más pesado que su límite efectivo aún puede iniciar desde un pool vacío, y luego se ejecuta solo hasta que libera capacidad. El agregado local hace preflights de Docker, elimina contenedores E2E obsoletos de OpenClaw, emite estado de carriles activos, persiste tiempos de carril para ordenar del más largo al más corto y deja de programar nuevos carriles agrupados después del primer fallo de forma predeterminada.

### Workflow reutilizable en vivo/E2E

El workflow reutilizable en vivo/E2E pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen en vivo, carril y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en outputs y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; construye y publica imágenes GHCR Docker E2E básicas/funcionales etiquetadas con el digest del paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita carriles con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de reconstruir. Los pulls de imágenes Docker se reintentan con un timeout acotado de 180 segundos por intento para que un stream de registro/caché atascado reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de lanzamiento

La cobertura Docker de lanzamiento ejecuta jobs fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento solo descargue el tipo de imagen que necesita y ejecute varios carriles mediante el mismo planificador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos Docker de lanzamiento actuales son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y de `plugins-runtime-install-a` a `plugins-runtime-install-h`. `package-update-openai` incluye el carril en vivo de paquete del Plugin Codex, que instala el paquete candidato de OpenClaw, instala el Plugin Codex desde `codex_plugin_spec` o un tarball de la misma ref con aprobación explícita de instalación de Codex CLI, ejecuta el preflight de Codex CLI y luego ejecuta varios turnos de agente de OpenClaw en la misma sesión contra OpenAI. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de Plugins/runtime. El alias de carril `install-e2e` sigue siendo el alias agregado de repetición manual para ambos carriles de instalador de proveedores.

OpenWebUI se integra en `plugins-runtime-services` cuando la cobertura completa de ruta de lanzamiento lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Los carriles de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento sube `.artifacts/docker-tests/` con logs de carril, tiempos, `summary.json`, `failures.json`, tiempos de fase, JSON del plan del planificador, tablas de carriles lentos y comandos de repetición por carril. La entrada `docker_lanes` del workflow ejecuta carriles seleccionados contra las imágenes preparadas en lugar de los jobs de fragmento, lo que mantiene la depuración de carriles fallidos acotada a un job Docker específico y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si un carril seleccionado es un carril Docker en vivo, el job específico construye la imagen de pruebas en vivo localmente para esa repetición. Los comandos generados de repetición por carril en GitHub incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imagen preparadas cuando esos valores existen, para que un carril fallido pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El workflow programado en vivo/E2E ejecuta diariamente la suite Docker completa de ruta de lanzamiento.

## Prelanzamiento de Plugins

`Plugin Prerelease` es cobertura de producto/paquete más costosa, por lo que es un workflow separado despachado por `Full Release Validation` o por un operador explícito. Los pull requests normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de Plugins incluidos entre ocho workers de extensiones; esos jobs de shards de extensiones ejecutan hasta dos grupos de configuración de Plugins a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de Plugins con muchas importaciones no creen jobs de CI adicionales. La ruta Docker de prelanzamiento solo de lanzamiento agrupa carriles Docker específicos en grupos pequeños para evitar reservar docenas de runners para jobs de uno a tres minutos. El workflow también sube un artefacto informativo `plugin-inspector-advisory` desde `@openclaw/plugin-inspector`; los hallazgos del inspector son entrada de triage y no cambian la compuerta bloqueante de Plugin Prerelease.

## QA Lab

QA Lab tiene carriles de CI dedicados fuera del workflow principal con alcance inteligente. La paridad agéntica está anidada bajo los arneses amplios de QA y lanzamiento, no como workflow de PR independiente. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba viajar con una ejecución amplia de validación.

- El workflow `QA-Lab - All Lanes` se ejecuta cada noche en `main` y bajo despacho manual; distribuye el carril de paridad mock, el carril Matrix en vivo y los carriles en vivo de Telegram y Discord como jobs paralelos. Los jobs en vivo usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de lanzamiento ejecutan carriles de transporte en vivo de Matrix y Telegram con el proveedor mock determinista y modelos calificados como mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato del canal quede aislado de la latencia de modelos en vivo y del arranque normal de Plugins de proveedor. El Gateway de transporte en vivo desactiva la búsqueda en memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores está cubierta por las suites separadas de modelo en vivo, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para compuertas programadas y de lanzamiento, añadiendo `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del workflow siguen siendo `all`; el despacho manual con `matrix_profile=all` siempre divide la cobertura completa de Matrix en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles críticos de lanzamiento de QA Lab antes de la aprobación del lanzamiento; su compuerta de paridad QA ejecuta los paquetes candidato y baseline como jobs de carril paralelos, luego descarga ambos artefactos en un job pequeño de informe para la comparación final de paridad.

Para PRs normales, sigue la evidencia de CI/comprobaciones con alcance en lugar de tratar la paridad como un estado requerido.

## CodeQL

El workflow `CodeQL` es intencionalmente un escáner de seguridad estrecho de primera pasada, no el barrido completo del repositorio. Las ejecuciones diarias, manuales y de guardia de pull requests que no están en borrador escanean código de workflows de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La guardia de pull request se mantiene ligera: solo inicia para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` o rutas de runtime de Plugins incluidos que poseen procesos, y ejecuta la misma matriz de seguridad de alta confianza que el workflow programado. CodeQL de Android y macOS queda fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Línea base de autenticación, secretos, sandbox, cron y Gateway                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación del canal central, además del runtime del plugin de canal, Gateway, Plugin SDK, secretos y puntos de contacto de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies centrales de SSRF, análisis de IP, guardia de red, web-fetch y política de SSRF del Plugin SDK                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y compuertas de ejecución de herramientas de agente              |
| `/codeql-security-high/process-exec-boundary`     | Shell local, helpers de creación de procesos, runtimes de plugins empaquetados que poseen subprocesos y pegamento de scripts de workflow |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, instalación del gestor de paquetes, carga de fuentes y contrato de paquete del Plugin SDK |

### Fragmentos de seguridad específicos de la plataforma

- `CodeQL Android Critical Security` — fragmento programado de seguridad de Android. Compila manualmente la aplicación Android para CodeQL en el runner Blacksmith Linux más pequeño aceptado por la comprobación de cordura del workflow. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento semanal/manual de seguridad de macOS. Compila manualmente la aplicación macOS para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores diarios predeterminados porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento no relacionado con seguridad correspondiente. Ejecuta solo consultas de calidad JavaScript/TypeScript de severidad de error y no relacionadas con seguridad sobre superficies estrechas de alto valor en runners Linux alojados en GitHub, de modo que los escaneos de calidad no consuman presupuesto de registro de runners de Blacksmith. Su guardia de pull request es intencionalmente más pequeña que el perfil programado: los PR no borrador solo ejecutan los fragmentos coincidentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agente y despacho de respuestas, código de esquema/migración/IO de configuración, código de autenticación/secretos/sandbox/seguridad, canal central y runtime del plugin de canal empaquetado, protocolo Gateway/método de servidor, pegamento de runtime de memoria/SDK, MCP/proceso/entrega saliente, catálogo de runtime/modelos de proveedor, colas de diagnóstico/entrega de sesiones, cargador de plugins, Plugin SDK/contrato de paquete o runtime de respuesta del Plugin SDK. Los cambios de configuración de CodeQL y del workflow de calidad ejecutan los doce fragmentos de calidad de PR.

El dispatch manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son ganchos de enseñanza/iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de autenticación, secretos, sandbox, cron y Gateway                                                                                 |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización e IO                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo Gateway y contratos de métodos de servidor                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación del canal central y del plugin de canal empaquetado                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Contratos de runtime de ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuesta automática, y plano de control ACP                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas de runtime de memoria, alias de memoria del Plugin SDK, pegamento de activación del runtime de memoria y comandos doctor de memoria |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de la cola de respuestas, colas de entrega de sesiones, helpers de enlace/entrega de sesiones salientes, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI de doctor de sesiones |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del Plugin SDK, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de enlace de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros web/búsqueda/fetch/embeddings |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de la UI de control, persistencia local, flujos de control de Gateway y contratos de runtime del plano de control de tareas                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime centrales de fetch/búsqueda web, IO de medios, comprensión de medios, generación de imágenes y generación de medios                         |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y punto de entrada del Plugin SDK                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fuente del Plugin SDK del lado del paquete publicado y helpers de contrato de paquete de plugin                                                                   |

La calidad permanece separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin ocultar la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins empaquetados debe volver a agregarse como trabajo de seguimiento acotado o fragmentado solo después de que los perfiles estrechos tengan runtime y señal estables.

## Workflows de mantenimiento

### Agente de documentación

El workflow `Docs Agent` es un carril de mantenimiento de Codex controlado por eventos para mantener la documentación existente alineada con los cambios incorporados recientemente. No tiene una programación pura: una ejecución de CI exitosa de push no bot en `main` puede activarlo, y el dispatch manual puede ejecutarlo directamente. Las invocaciones workflow-run se omiten cuando `main` ha avanzado o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen anterior no omitido de Docs Agent hasta el `main` actual, por lo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Agente de rendimiento de pruebas

El workflow `Test Performance Agent` es un carril de mantenimiento de Codex controlado por eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI exitosa de push no bot en `main` puede activarlo, pero se omite si otra invocación workflow-run ya se ejecutó o se está ejecutando ese día UTC. El dispatch manual evita esa compuerta de actividad diaria. El carril genera un informe de rendimiento agrupado de Vitest de la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de la suite completa y rechaza cambios que reduzcan el recuento base de pruebas aprobadas. El informe agrupado registra tiempo de pared por configuración y RSS máximo en Linux y macOS, de modo que la comparación antes/después muestre deltas de memoria de pruebas junto a deltas de duración. Si la línea base tiene pruebas fallidas, Codex solo puede corregir fallos obvios y el informe de la suite completa posterior al agente debe aprobar antes de que se confirme algo. Cuando `main` avanza antes de que llegue el push del bot, el carril rebasea el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad sin sudo que el agente de documentación.

### PR duplicados después del merge

El workflow `Duplicate PRs After Merge` es un workflow manual de mantenedor para limpieza posterior al aterrizaje de duplicados. Su valor predeterminado es dry-run y solo cierra los PR listados explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que el PR aterrizado esté fusionado y que cada duplicado tenga una incidencia referenciada compartida o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Compuertas de comprobación locales y enrutamiento de cambios

La lógica local de carriles modificados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa compuerta local de comprobación es más estricta con los límites de arquitectura que el alcance amplio de plataforma de CI:

- los cambios de producción del núcleo ejecutan typecheck de producción del núcleo y de pruebas del núcleo, además de lint/guardias del núcleo;
- los cambios solo de pruebas del núcleo ejecutan únicamente typecheck de pruebas del núcleo, además de lint del núcleo;
- los cambios de producción de extensiones ejecutan typecheck de producción y de pruebas de extensiones, además de lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan typecheck de pruebas de extensiones, además de lint de extensiones;
- los cambios públicos del Plugin SDK o de contrato de plugin se amplían a typecheck de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los aumentos de versión solo de metadatos de release ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todos los carriles de comprobación.

El enrutamiento local de pruebas modificadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de fuente prefieren mapeos explícitos, luego pruebas hermanas y dependientes del grafo de importaciones. La configuración compartida de entrega de sala de grupo es uno de los mapeos explícitos: los cambios en la configuración de respuesta visible de grupo, el modo de entrega de respuesta de fuente o el prompt del sistema de la herramienta de mensajes se enrutan por las pruebas centrales de respuesta, además de regresiones de entrega de Discord y Slack, para que un cambio predeterminado compartido falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el harness como para que el conjunto mapeado barato no sea un proxy confiable.

## Validación de Testbox

Crabbox es el wrapper de caja remota propiedad del repo para pruebas de Linux de mantenedores. Úsalo
desde la raíz del repo cuando una comprobación sea demasiado amplia para un ciclo local de edición, cuando importe la paridad con CI
o cuando la prueba necesite secretos, Docker, carriles de paquetes,
cajas reutilizables o registros remotos. El backend normal de OpenClaw es
`blacksmith-testbox`; la capacidad propia en AWS/Hetzner es una alternativa para caídas de Blacksmith,
problemas de cuota o pruebas explícitas con capacidad propia.

Las ejecuciones de Blacksmith respaldadas por Crabbox calientan, reclaman, sincronizan, ejecutan, informan y limpian
Testboxes de un solo uso. La comprobación de cordura de sincronización integrada falla rápido cuando desaparecen
archivos raíz requeridos como `pnpm-lock.yaml` o cuando `git status --short`
muestra al menos 200 eliminaciones rastreadas. Para PRs intencionales con eliminaciones masivas, establece
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para el comando remoto.

Crabbox también termina una invocación local de la CLI de Blacksmith que permanece en la
fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Establece
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor
en milisegundos para diffs locales inusualmente grandes.

Antes de una primera ejecución, comprueba el wrapper desde la raíz del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El wrapper del repo rechaza un binario de Crabbox obsoleto que no anuncie `blacksmith-testbox`. Pasa el proveedor explícitamente aunque `.crabbox.yaml` tenga valores predeterminados de nube propia. En worktrees de Codex o checkouts enlazados/dispersos, evita el script local `pnpm crabbox:run` porque pnpm puede reconciliar dependencias antes de que Crabbox arranque; invoca directamente el wrapper de Node en su lugar:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Las ejecuciones respaldadas por Blacksmith requieren Crabbox 0.22.0 o posterior para que el wrapper obtenga el comportamiento actual de sincronización, cola y limpieza de Testbox. Al usar el checkout hermano, recompila el binario local ignorado antes de trabajos de temporización o prueba:

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
resultado del comando. La ejecución enlazada de GitHub Actions es responsable de la hidratación y keepalive; puede
terminar como `cancelled` cuando el Testbox se detiene externamente después de que el comando SSH
ya haya devuelto. Trata eso como un artefacto de limpieza/estado salvo que
el `exitCode` del wrapper sea distinto de cero o la salida del comando muestre una prueba fallida.
Las ejecuciones de Crabbox de un solo uso respaldadas por Blacksmith deberían detener el Testbox automáticamente;
si una ejecución se interrumpe o la limpieza no está clara, inspecciona las cajas activas y detén solo
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
solo para diagnósticos como `list`, `status` y limpieza. Arregla la
ruta de Crabbox antes de tratar una ejecución directa de Blacksmith como prueba de mantenedor.

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan pero nuevos
calentamientos quedan en `queued` sin IP ni URL de ejecución de Actions tras un par de minutos,
trátalo como presión del proveedor, cola, facturación o límite de organización de Blacksmith. Detén los
ids en cola que creaste, evita iniciar más Testboxes y mueve la prueba a la
ruta de capacidad propia de Crabbox indicada abajo mientras alguien revisa el panel de Blacksmith,
la facturación y los límites de la organización.

Escala a capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, no tenga el entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Bajo presión de AWS, evita `class=beast` salvo que la tarea realmente necesite CPU de clase 48xlarge. Una solicitud `beast` empieza en 192 vCPU y es la forma más fácil de disparar la cuota regional de EC2 Spot o Estándar On-Demand. El `.crabbox.yaml` propiedad del repo tiene valores predeterminados de `standard`, varias regiones de capacidad y `capacity.hints: true`, de modo que los leases intermediados de AWS imprimen la región/mercado seleccionados, presión de cuota, alternativa Spot y advertencias de clase de alta presión. Usa `fast` para comprobaciones amplias más pesadas, `large` solo después de que standard/fast no basten, y `beast` solo para carriles excepcionales limitados por CPU, como suites completas o matrices Docker de todos los plugins, validación explícita de release/bloqueador o perfilado de rendimiento con muchos núcleos. No uses `beast` para `pnpm check:changed`, pruebas enfocadas, trabajo solo de documentación, lint/typecheck ordinarios, reproducciones E2E pequeñas o triaje de caídas de Blacksmith. Usa `--market on-demand` para diagnóstico de capacidad, de modo que la volatilidad del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` es responsable de los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para carriles de nube propia. Excluye `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos Git remotos en lugar de sincronizar remotos y almacenes de objetos locales del mantenedor, y excluye artefactos locales de runtime/compilación que nunca deberían transferirse. `.github/workflows/crabbox-hydrate.yml` es responsable del checkout, la configuración de Node/pnpm, la obtención de `origin/main` y el traspaso de entorno no secreto para comandos de nube propia `crabbox run --id <cbx_id>`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
