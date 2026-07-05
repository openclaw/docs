---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Está depurando una comprobación fallida de GitHub Actions
    - Está coordinando una ejecución o repetición de validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, puertas de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-07-05T11:06:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0462c4fe6ce0aacac5fe303cea1181b11822fc44b2d6a2fe4102ca59ce68539e
    source_path: ci.md
    workflow: 16
---

La CI de OpenClaw se ejecuta en los envíos a `main` (las rutas Markdown y `docs/**` se ignoran
en el disparador), en solicitudes de extracción que no están en borrador (se ignoran los diffs
solo de CHANGELOG) y en despachos manuales. Los envíos canónicos a `main` pasan primero por una
ventana de admisión de 90 segundos en el runner alojado; el grupo de concurrencia `CI` cancela esa
ejecución en espera cuando llega un commit más nuevo, de modo que las fusiones secuenciales no
registran cada una una matriz completa de Blacksmith. Las solicitudes de extracción y los despachos
manuales omiten la espera. Luego, el trabajo `preflight` clasifica el diff y desactiva los carriles
costosos cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de
`workflow_dispatch` omiten deliberadamente el alcance inteligente y expanden todo el grafo para
candidatos de versión y validación amplia. Los carriles de Android siguen siendo opcionales mediante
`include_android` (o la entrada `release_gate`). La cobertura de Plugins solo para lanzamientos vive
en el flujo de trabajo separado [`Prelanzamiento de Plugin`](#plugin-prerelease) y solo se ejecuta
desde [`Validación completa de lanzamiento`](#full-release-validation) o un despacho manual explícito.

## Descripción general de la canalización

| Trabajo                            | Propósito                                                                                                                                                                                             | Cuándo se ejecuta                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `preflight`                        | Detectar cambios solo de docs, alcances modificados, extensiones modificadas y construir el manifiesto de CI                                                                                          | Siempre en envíos y PRs que no están en borrador    |
| `runner-admission`                 | Antirrebote alojado de 90 segundos para envíos canónicos a `main` antes de registrar trabajo de Blacksmith                                                                                            | Cada ejecución de CI; espera solo en envíos canónicos a `main` |
| `security-fast`                    | Detección de claves privadas, auditoría de flujos de trabajo modificados mediante `zizmor` y auditoría del lockfile de producción                                                                     | Siempre en envíos y PRs que no están en borrador    |
| `pnpm-store-warmup`                | Preparar la caché del almacén pnpm fijado por lockfile sin bloquear los shards Linux Node                                                                                                             | Carriles Node o de comprobación de docs seleccionados |
| `build-artifacts`                  | Compilar `dist/`, Control UI, comprobaciones smoke de CLI compilada, memoria de arranque y comprobaciones incrustadas de artefactos compilados                                                        | Cambios relevantes para Node                        |
| `checks-fast-core`                 | Carriles rápidos de corrección en Linux: bundled + protocol, QA Smoke CI, lanzador Bun y la tarea rápida de enrutamiento de CI                                                                        | Cambios relevantes para Node                        |
| `checks-fast-contracts-plugins-*`  | Dos shards ponderados de contratos de Plugins                                                                                                                                                         | Cambios relevantes para Node                        |
| `checks-fast-contracts-channels-*` | Dos shards ponderados de contratos de canales                                                                                                                                                         | Cambios relevantes para Node                        |
| `checks-node-*`                    | Shards de pruebas Node del núcleo, excluyendo carriles de canales, bundled, contratos y extensiones                                                                                                   | Cambios relevantes para Node                        |
| `check-*`                          | Equivalente shardado de la puerta local principal: guardias, shrinkwrap, metadatos de configuración de canales bundled, tipos de prod, lint, dependencias, tipos de pruebas                          | Cambios relevantes para Node                        |
| `check-additional-*`               | Franjas de comprobación de límites (incluida deriva de snapshots de prompts), límites de accessor de sesión/lector de transcripciones, grupos de lint de extensiones, compilación/canary de límites de paquetes y arquitectura de topología de runtime | Cambios relevantes para Node                        |
| `checks-node-compat-node22`        | Carril de compilación y smoke de compatibilidad con Node 22                                                                                                                                           | Despacho manual de CI para lanzamientos             |
| `check-docs`                       | Formato, lint y comprobaciones de enlaces rotos de docs                                                                                                                                               | Docs modificados (PRs y despacho manual)            |
| `native-i18n`                      | Comprobaciones de inventario i18n de la aplicación nativa, Android y Apple                                                                                                                            | Cambios relevantes para i18n nativo                 |
| `skills-python`                    | Ruff + pytest para Skills respaldadas por Python                                                                                                                                                      | Cambios relevantes para Skills de Python            |
| `checks-windows`                   | Pruebas específicas de procesos/rutas de Windows más regresiones compartidas de especificadores de importación del runtime                                                                            | Cambios relevantes para Windows                     |
| `macos-node`                       | Pruebas TypeScript enfocadas en macOS: launchd, Homebrew, rutas de runtime, scripts de empaquetado, wrapper de grupos de procesos                                                                     | Cambios relevantes para macOS                       |
| `macos-swift`                      | Lint, compilación y pruebas Swift para la aplicación macOS                                                                                                                                            | Cambios relevantes para macOS                       |
| `ios-build`                        | Generación del proyecto Xcode más compilación de la aplicación iOS en simulador                                                                                                                       | Aplicación iOS, kit de app compartido o cambios de Swabble |
| `android`                          | Pruebas unitarias de Android para ambos flavors más una compilación APK debug                                                                                                                         | Cambios relevantes para Android                     |
| `test-performance-agent`           | Flujo de trabajo separado: optimización diaria de pruebas lentas de Codex después de actividad confiable                                                                                              | Éxito de CI principal o despacho manual             |
| `openclaw-performance`             | Flujo de trabajo separado: informes diarios/bajo demanda de rendimiento del runtime Kova con carriles mock-provider, deep-profile y GPT 5.5 en vivo                                                   | Programado y despacho manual                        |

## Orden fail-fast

1. `runner-admission` espera solo para envíos canónicos a `main`; un envío más nuevo cancela la ejecución antes del registro de Blacksmith.
2. `preflight` decide qué carriles existen. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` y `skills-python` fallan rápido sin esperar a los trabajos más pesados de artefactos y matriz de plataformas.
4. `build-artifacts` se solapa con los carriles rápidos de Linux para que los consumidores posteriores puedan empezar tan pronto como la compilación compartida esté lista.
5. Los carriles más pesados de plataforma y runtime se expanden después de eso: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` y `android`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un envío más nuevo al mismo PR o ref `main`. Trátalo como ruido de CI salvo que la ejecución más reciente para el mismo ref también esté fallando. Los trabajos de matriz usan `fail-fast: false`, y `build-artifacts` informa directamente fallos de canal incrustado, límite de soporte del núcleo y gateway-watch en lugar de poner en cola pequeños trabajos verificadores. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombie del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones nuevas de main. Las ejecuciones manuales de la suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

Usa `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` para resumir el tiempo de reloj, tiempo de cola, trabajos más lentos, fallos y la barrera de fanout de `pnpm-store-warmup` desde GitHub Actions. El trabajo dentro del flujo `ci-timings-summary` existe en `ci.yml`, pero actualmente está deshabilitado (`if: false`); ejecuta en su lugar el helper de tiempos localmente. Para tiempos de compilación, revisa el paso `Build dist` del trabajo `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e incluye `ui:build`; el trabajo también sube el artefacto `startup-memory`.

## Contexto y evidencia de PR

Los PRs de colaboradores externos ejecutan una puerta de contexto y evidencia de PR desde
`.github/workflows/real-behavior-proof.yml`. El flujo de trabajo hace checkout de la
revisión confiable del flujo (`github.workflow_sha`) y evalúa solo el cuerpo del PR;
no ejecuta código de la rama del colaborador.

La puerta se aplica a autores de PR que no son propietarios, miembros,
colaboradores ni bots del repositorio. Pasa cuando el cuerpo del PR contiene
secciones redactadas por el autor `What Problem This Solves` y `Evidence`.
La evidencia puede ser una prueba enfocada, resultado de CI, captura de pantalla,
grabación, salida de terminal, observación en vivo, log redactado o enlace a artefacto.
El cuerpo aporta intención y validación útil; los revisores inspeccionan el código,
las pruebas y la CI para evaluar la corrección.

Cuando la comprobación falle, actualiza el cuerpo del PR en lugar de enviar otro commit de código.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. El despacho manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si cada área con alcance hubiera cambiado.

- **Las ediciones del flujo de trabajo de CI** validan el grafo de CI de Node, el linting de flujos de trabajo y la lane de Windows (`ci.yml` la ejecuta), pero no fuerzan por sí solas las compilaciones nativas de iOS, Android o macOS; esas lanes de plataforma permanecen acotadas a los cambios de código fuente de plataforma.
- **Workflow Sanity** ejecuta `actionlint`, `zizmor` sobre todos los archivos YAML de flujos de trabajo, la guarda de interpolación de acciones compuestas y la guarda de marcadores de conflicto. El job `security-fast` acotado a PR también ejecuta `zizmor` sobre los archivos de flujo de trabajo modificados para que los hallazgos de seguridad de flujos de trabajo fallen pronto en el grafo principal de CI.
- **La documentación en pushes a `main`** se comprueba mediante el flujo de trabajo independiente `Docs` con el mismo espejo de documentación de ClawHub que usa CI, de modo que los pushes mixtos de código+documentación no ponen también en cola el shard `check-docs` de CI. Las pull requests y la CI manual siguen ejecutando `check-docs` desde CI cuando la documentación cambió.
- **TUI PTY** se ejecuta en el shard Linux Node `checks-node-core-runtime-tui-pty` para cambios de TUI. El shard ejecuta `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, por lo que cubre tanto la lane determinista de fixture `TuiBackend` como el smoke más lento `tui --local`, que simula solo el endpoint externo del modelo.
- **Las ediciones solo de enrutamiento de CI, el pequeño conjunto de fixtures de pruebas core que la tarea rápida ejecuta directamente y las ediciones estrechas de helpers de contratos de plugins** usan una ruta rápida de manifiesto solo de Node: `preflight`, `security-fast` y solo las lanes rápidas que toca el cambio — una única tarea de enrutamiento de CI `checks-fast-core`, los dos shards de contratos de plugins o ambos. Esa ruta omite artefactos de compilación, compatibilidad con Node 22, contratos de canales, shards core completos, shards de plugins empaquetados y matrices de guardas adicionales.
- **Las comprobaciones de Windows Node** están acotadas a wrappers específicos de procesos/rutas de Windows, helpers de runners npm/pnpm/UI, configuración del gestor de paquetes y las superficies de flujos de trabajo de CI que ejecutan esa lane; los cambios no relacionados de código fuente, plugins, install-smoke y solo pruebas permanecen en las lanes Linux Node.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada job siga siendo pequeño sin sobrerreservar runners:

- Los contratos de plugins y los contratos de canales se ejecutan cada uno como dos shards ponderados respaldados por Blacksmith con el fallback estándar del runner de GitHub.
- Las lanes rápidas/de soporte de unidades core se ejecutan por separado; la infraestructura de runtime core se divide en shards de proceso, compartidos, hooks, secretos y tres dominios cron.
- Auto-reply se ejecuta como workers equilibrados, con el subárbol de respuestas dividido en shards de agent-runner, comandos, dispatch, sesión y enrutamiento de estado.
- Las configuraciones de agentic gateway/server (plano de control) se dividen entre lanes de chat, autenticación, modelo, HTTP/plugin, runtime y arranque en lugar de esperar a artefactos compilados.
- La CI normal empaqueta solo shards aislados de patrones de inclusión de infraestructura en paquetes deterministas de como máximo 64 archivos de prueba, reduciendo la matriz de Node sin fusionar suites no aisladas de comandos/cron, agents-core con estado o gateway/server. Las suites fijas pesadas permanecen en 8 vCPU, mientras que las lanes empaquetadas y de menor peso usan 4 vCPU.
- Las pull requests en el repositorio canónico usan un plan de admisión compacto: los mismos grupos por configuración se ejecutan en subprocesos aislados, actualmente 18 jobs de pruebas Node en lugar de la matriz completa de 74 jobs. Los pushes a `main`, los dispatches manuales y las puertas de release conservan la matriz completa.
- Las pruebas amplias de navegador, QA, medios y plugins varios usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los shards de patrones de inclusión registran entradas de tiempos usando el nombre del shard de CI, de modo que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un shard filtrado.
- `check-additional-*` reparte la lista suplementaria de guardas de límites (`scripts/run-additional-boundary-checks.mjs`) en un shard con mucha carga de prompts (`check-additional-boundaries-a`, que incluye la comprobación de deriva de snapshots de prompts de Codex) y un shard combinado para las franjas restantes (`check-additional-boundaries-bcd`), cada uno ejecutando guardas independientes en paralelo e imprimiendo tiempos por comprobación. El trabajo de compilación/canary de límites de paquetes permanece junto, y la arquitectura de topología de runtime se ejecuta por separado de la cobertura de vigilancia de Gateway integrada en `build-artifacts`.
- Gateway watch, las pruebas de canales y el shard de límites de soporte core se ejecutan en paralelo dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén compilados.

Una vez admitida, la CI canónica de Linux permite hasta 24 jobs concurrentes de pruebas Node y
12 para las lanes rápidas/de comprobación más pequeñas; Windows y Android permanecen en dos porque
esos pools de runners son más estrechos. Los lotes compactos de configuraciones completas se ejecutan con un
timeout de lote de 120 minutos, mientras que los grupos de patrones de inclusión comparten el mismo presupuesto
acotado de jobs.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego compila el APK de depuración Play. El flavor de terceros no tiene un source set ni un manifiesto separados; su lane de pruebas unitarias sigue compilando el flavor con las flags BuildConfig de SMS/call-log, mientras evita un job duplicado de empaquetado de APK de depuración en cada push relevante para Android.

El shard `check-dependencies` ejecuta `pnpm deadcode:dependencies` (un pase de dependencias únicamente de producción de Knip fijado a una versión exacta de Knip, con la edad mínima de release de pnpm deshabilitada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos no usados de producción de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`, además de un informe consultivo `pnpm deadcode:report:ci:ts-unused` subido como el artefacto `deadcode-reports`. La guarda de archivos no usados falla cuando una PR agrega un nuevo archivo no usado sin revisar o deja una entrada obsoleta en la allowlist, mientras preserva superficies intencionales de plugins dinámicos, generadas, de compilación, de pruebas live y de puentes de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado destino desde la actividad del repositorio OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código no confiable de pull requests. El flujo de trabajo crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego envía payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El flujo de trabajo tiene cuatro lanes:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

La lane `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando están presentes. Evita intencionalmente reenviar el cuerpo completo del Webhook. El flujo de trabajo receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente ClawSweeper recibe el destino de Discord en su prompt y debe publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Aperturas rutinarias, ediciones, ruido de bots, ruido de Webhooks duplicados y tráfico normal de revisiones deben producir `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisiones, nombres de ramas y mensajes de commits de GitHub como datos no confiables a lo largo de toda esta ruta. Son entrada para resumen y triage, no instrucciones para el flujo de trabajo ni para el runtime del agente.

## Ejecuciones manuales

Las ejecuciones manuales de CI ejecutan el mismo grafo de jobs que la CI normal, pero fuerzan todas las lanes acotadas que no son Android: shards Linux Node, shards de plugins empaquetados, shards de contratos de plugins y canales, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones smoke de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS, compilación de iOS y Control UI i18n. Las ejecuciones manuales independientes de CI ejecutan Android solo con `include_android=true` (la entrada `release_gate` también fuerza Android); el paraguas completo de release habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prerelease de plugins, el shard exclusivo de release `agentic-plugins`, el barrido completo por lotes de plugins y las lanes Docker de prerelease de plugins están excluidos de CI. La suite Docker de prerelease se ejecuta solo cuando `Full Release Validation` despacha el flujo de trabajo separado `Plugin Prerelease` con la puerta de validación de release habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidato a release no sea cancelada por otra ejecución de push o PR en la misma ref. La entrada opcional `target_ref` permite que un invocador confiable ejecute ese grafo contra una rama, etiqueta o SHA de commit completo usando el archivo de flujo de trabajo de la ref de dispatch seleccionada. La entrada `release_gate` es un fallback de mantenedor con SHA exacto para CI de PR estancada por capacidad: requiere que `target_ref` sea un SHA de commit completo que coincida con la cabeza de la rama despachada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

La ruta mensual extended-stable solo para npm es la excepción: despacha tanto el preflight de `OpenClaw NPM
Release` como `Full Release Validation` desde la rama exacta
`extended-stable/YYYY.M.33`, preserva sus IDs de ejecución y pasa ambos IDs a la
ejecución directa de publicación npm. Consulta [Publicación mensual extended-stable
solo para npm](/es/reference/RELEASING#monthly-npm-only-extended-stable-publication) para
los comandos, los requisitos exactos de identidad, la lectura de vuelta del registro y el procedimiento de
reparación del selector. Esta ruta no despacha plugins, macOS, Windows, GitHub
Release, private dist-tag ni otra publicación de plataforma.

## Ejecutores

| Ejecutor                        | Trabajos                                                                                                                                                                                                                                                                                                   |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Despacho manual de CI y alternativas para repositorios no canónicos, análisis de seguridad y calidad de CodeQL, workflow-sanity, labeler, auto-response, el flujo de trabajo independiente de Docs y todo el flujo de trabajo Install Smoke                                                                 |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `pnpm-store-warmup`, `native-i18n`, `checks-fast-core` excepto QA Smoke CI, fragmentos de contrato de plugin/canal, la mayoría de los fragmentos Linux Node incluidos/de menor peso, carriles `check-*` excepto `check-lint`, fragmentos `check-additional-*` seleccionados, `check-docs` y `skills-python` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites pesadas de Linux Node conservadas, fragmentos `check-additional-*` con mucha carga de límites/extensiones y `android`                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` en CI y Testbox, y `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban)                                                                                                                                                         |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-15`     | `macos-node` en `openclaw/openclaw`; los forks recurren a `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` en `openclaw/openclaw`; los forks recurren a `macos-26`                                                                                                                                                                                                                       |

## Presupuesto de registro de ejecutores

El bucket actual de registro de ejecutores de GitHub de OpenClaw informa 10.000
registros de ejecutores self-hosted cada 5 minutos en `ghx api rate_limit`.
Vuelve a comprobar `actions_runner_registration` antes de cada pasada de ajuste
porque GitHub puede cambiar este bucket. El límite se comparte entre todos los
registros de ejecutores de Blacksmith en la organización `openclaw`, por lo que
agregar otra instalación de Blacksmith no añade un bucket nuevo.

Trata las etiquetas de Blacksmith como el recurso escaso para el control de ráfagas. Los trabajos que
solo enrutan, notifican, resumen, seleccionan fragmentos o ejecutan análisis cortos de CodeQL deben
permanecer en ejecutores hospedados por GitHub a menos que tengan necesidades
específicas de Blacksmith medidas. Cualquier matriz nueva de Blacksmith, `max-parallel` más grande
o flujo de trabajo de alta frecuencia debe mostrar su peor recuento de registros y mantener el objetivo
a nivel de organización por debajo de aproximadamente el 60% del bucket activo. Con el bucket actual
de 10.000 registros, eso significa un objetivo operativo de 6.000 registros, dejando margen para
repositorios concurrentes, reintentos y solapamiento de ráfagas.

La CI del repositorio canónico mantiene Blacksmith como la ruta predeterminada de ejecutor para ejecuciones normales de push y pull request. `workflow_dispatch` y las ejecuciones de repositorios no canónicos usan ejecutores hospedados por GitHub, pero las ejecuciones canónicas normales no sondean actualmente la salud de la cola de Blacksmith ni vuelven automáticamente a etiquetas hospedadas por GitHub cuando Blacksmith no está disponible.

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

## OpenClaw Performance

`OpenClaw Performance` es el flujo de trabajo de rendimiento del producto/runtime. Se ejecuta diariamente en `main` y puede despacharse manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_openai_candidate=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

El despacho manual normalmente compara el rendimiento de la referencia del flujo de trabajo. Define `target_ref` para comparar una etiqueta de versión u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros más recientes se indexan por la referencia probada, y cada `index.md` registra la referencia/SHA probada, la referencia/SHA del flujo de trabajo, la referencia de Kova, el perfil, el modo de autenticación del carril, el modelo, el recuento de repeticiones y los filtros de escenarios.

El flujo de trabajo instala OCM desde una versión fijada y Kova desde `openclaw/Kova` en la entrada `kova_ref` fijada, y luego ejecuta tres carriles:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfilado de CPU/heap/trazas para puntos calientes de arranque, Gateway y turnos de agente. Se ejecuta según programación, o por despacho con `deep_profile=true`.
- `live-openai-candidate`: un turno de agente real de OpenAI `openai/gpt-5.5`, omitido cuando `OPENAI_API_KEY` no está disponible. Se ejecuta según programación, o por despacho con `live_openai_candidate=true`.

El carril mock-provider también ejecuta sondas de código fuente nativas de OpenClaw después de la pasada de Kova: tiempo de arranque y memoria del Gateway en casos de arranque predeterminado, con canal omitido, con hook interno y con cincuenta plugins; RSS de importación de plugins incluidos, bucles repetidos de saludo mock-OpenAI `channel-chat-baseline`, comandos de arranque de CLI contra el Gateway iniciado y la sonda de rendimiento smoke del estado SQLite. Cuando el informe de código fuente mock-provider publicado previamente está disponible para la referencia probada, el resumen de código fuente compara los valores actuales de RSS y heap con esa línea base y marca los aumentos grandes de RSS como `watch`. El resumen Markdown de la sonda de código fuente vive en `source/index.md` en el paquete de informe, con JSON sin procesar junto a él.

Cada carril carga artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondas de código fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la referencia probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación completa de versión

`Full Release Validation` es el flujo de trabajo manual paraguas para "ejecutar todo antes de la versión". Acepta una rama, etiqueta o SHA de commit completo, despacha el flujo de trabajo manual `CI` con ese objetivo (incluido Android), despacha `Plugin Prerelease` para pruebas exclusivas de versión de plugin/paquete/estáticas/Docker, despacha `OpenClaw Performance` contra el SHA objetivo y despacha `OpenClaw Release Checks` para install smoke, aceptación de paquetes, comprobaciones de paquetes entre sistemas operativos, paridad de QA Lab, Matrix y carriles de Telegram (el renderizado consultivo del cuadro de mando de madurez es opcional mediante `run_maturity_scorecard`). Los perfiles estable y completo siempre incluyen cobertura exhaustiva live/E2E y soak de ruta de versión Docker; el perfil beta puede optar por incluirla con `run_release_soak=true`. El E2E de Telegram del paquete canónico se ejecuta dentro de Package Acceptance, por lo que un candidato completo no inicia un sondeador live duplicado. Después de publicar, pasa `release_package_spec` para reutilizar el paquete npm enviado en comprobaciones de versión, Package Acceptance, Docker, comprobaciones entre sistemas operativos y Telegram sin recompilar. Usa `npm_telegram_package_spec` solo para una repetición enfocada de Telegram con paquete publicado. El carril de paquete live del Plugin de Codex usa por defecto el mismo estado seleccionado: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mientras que las ejecuciones por SHA/artefacto empaquetan `extensions/codex` desde la referencia seleccionada. Define `codex_plugin_spec` explícitamente para fuentes de plugin personalizadas como especificaciones `npm:`, `npm-pack:` o `git:`.

Consulta [Validación completa de versión](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos del flujo de trabajo, las diferencias de perfil, los artefactos y
los manejadores de repetición enfocada.

`OpenClaw Release Publish` es el flujo de trabajo manual mutante de publicación de versión. Despáchalo
desde `release/YYYY.M.PATCH` o `main` después de que exista la etiqueta de versión y después de que
la preflight de npm de OpenClaw haya tenido éxito (la preflight ejecuta `pnpm plugins:sync:check`
entre sus comprobaciones). Requiere el `preflight_run_id` guardado y un
`full_release_validation_run_id` exitoso, despacha `Plugin NPM Release` para todos
los paquetes de plugin publicables, despacha `Plugin ClawHub Release` para el mismo
SHA de versión, y solo entonces despacha `OpenClaw NPM Release`. La publicación estable también
requiere un `windows_node_tag` exacto; el flujo de trabajo verifica la versión de código fuente de Windows
y compara sus instaladores x64/ARM64 con la entrada
`windows_node_installer_digests` aprobada por el candidato antes de cualquier hijo de publicación, luego promociona
y verifica esos mismos resúmenes de instalador fijados más el contrato exacto de recurso complementario
y checksum antes de publicar el borrador de versión de GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Para pruebas de commit fijado en una rama que avanza rápido, usa el ayudante en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las refs de despacho de workflows de GitHub deben ser ramas o etiquetas, no SHA de commits sin procesar. El
ayudante empuja una rama temporal `release-ci/<sha>-...` en el SHA de destino,
despacha `Full Release Validation` desde esa ref fijada, verifica que cada
workflow hijo `headSha` coincida con el destino y elimina la rama temporal cuando la
ejecución termina. El verificador general también falla si algún workflow hijo se ejecutó en un
SHA diferente.

`release_profile` controla la amplitud en vivo/de proveedores que se pasa a las comprobaciones de lanzamiento. Los
workflows manuales de lanzamiento usan `stable` de forma predeterminada; usa `full` solo cuando
quieras intencionalmente la matriz amplia de asesoría de proveedores/medios. Las comprobaciones de lanzamiento
stable y full siempre ejecutan el soak exhaustivo en vivo/E2E y de ruta de lanzamiento Docker;
el perfil beta puede optar por incluirlo con `run_release_soak=true`.

- `minimum` conserva las rutas críticas de lanzamiento de OpenAI/core más rápidas.
- `stable` agrega el conjunto stable de proveedores/backends.
- `full` ejecuta la matriz amplia de asesoría de proveedores/medios.

El general registra los ids de ejecución hijos despachados, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y agrega tablas de los trabajos más lentos para cada ejecución hija. Si un workflow hijo se vuelve a ejecutar y pasa a verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado general y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de lanzamiento, `ci` solo para el hijo normal de CI completa, `plugin-prerelease` solo para el hijo de prelanzamiento de plugins, `performance` solo para el hijo de OpenClaw Performance, `release-checks` para cada hijo de lanzamiento, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el general. Esto mantiene acotada la repetición de una caja de lanzamiento fallida después de una corrección enfocada. Para una ruta cross-OS fallida, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos cross-OS largos emiten líneas de Heartbeat y los resúmenes de packaged-upgrade incluyen tiempos por fase. Las rutas de comprobaciones de lanzamiento de QA son de asesoría, salvo la puerta estándar de cobertura de herramientas de runtime, que bloquea cuando las herramientas dinámicas requeridas de OpenClaw se desvían o desaparecen del resumen del nivel estándar.

`OpenClaw Release Checks` usa la ref de workflow confiable para resolver la ref seleccionada una vez en un tarball `release-package-under-test`, luego pasa ese artefacto a comprobaciones cross-OS y Package Acceptance, además del workflow Docker de ruta de lanzamiento en vivo/E2E cuando se ejecuta cobertura de soak. Eso mantiene los bytes del paquete coherentes entre cajas de lanzamiento y evita reempaquetar el mismo candidato en varios trabajos hijos. Para la ruta en vivo del plugin npm de Codex, las comprobaciones de lanzamiento pasan una especificación de plugin publicada coincidente derivada de `release_package_spec`, pasan el `codex_plugin_spec` suministrado por el operador, o dejan la entrada en blanco para que el script Docker empaquete el plugin Codex del checkout seleccionado.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
sustituyen al general anterior. El monitor padre cancela cualquier workflow hijo que
ya haya despachado cuando se cancela el padre, por lo que la validación más nueva de main
no queda detrás de una ejecución obsoleta de comprobaciones de lanzamiento de dos horas. La validación de ramas/etiquetas
de lanzamiento y los grupos de repetición enfocados mantienen `cancel-in-progress: false`.

## Shards en vivo y E2E

El hijo en vivo/E2E de lanzamiento mantiene una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como shards nombrados mediante `scripts/test-live-shard.mjs` en lugar de un solo trabajo serial:

- `native-live-src-agents` y `native-live-src-agents-zai-coding`
- `native-live-src-gateway-core`
- trabajos `native-live-src-gateway-profiles` filtrados por proveedor
- `native-live-src-gateway-backends`
- `native-live-src-infra`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-moonshot`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- shards divididos de audio/video de medios y shards de música filtrados por proveedor

Eso conserva la misma cobertura de archivos mientras facilita volver a ejecutar y diagnosticar fallos lentos de proveedores en vivo. Los nombres de shard agregados `native-live-src-gateway`, `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales de una sola ejecución.

Los shards nativos de medios en vivo se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el workflow `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites en vivo respaldadas por Docker en runners normales de Blacksmith: los trabajos en contenedores son el lugar equivocado para lanzar pruebas Docker anidadas.

Los shards de modelos/backends en vivo respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>-<extensions>` por commit seleccionado. El workflow de lanzamiento en vivo construye y empuja esa imagen una vez, luego los shards del modelo en vivo Docker, Gateway por proveedor, backend de CLI, enlace ACP y arnés de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards Docker de Gateway llevan límites explícitos de `timeout` a nivel de script por debajo del timeout del trabajo de workflow para que un contenedor atascado o una ruta de limpieza falle rápido en lugar de consumir todo el presupuesto de comprobaciones de lanzamiento. Si esos shards reconstruyen de forma independiente el destino Docker completo del código fuente, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de paquetes

Usa `Package Acceptance` cuando la pregunta sea "¿funciona este paquete instalable de OpenClaw como producto?" Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un solo tarball mediante el mismo arnés Docker E2E que los usuarios ejercitan después de instalar o actualizar.

### Trabajos

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime el origen, la ref de workflow, la ref de paquete, la versión, SHA-256 y el perfil en el resumen del paso de GitHub.
2. `package_integrity` descarga el artefacto `package-under-test` y aplica el contrato público del tarball del paquete con `scripts/check-openclaw-package-tarball.mjs`.
3. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con el SHA de origen del paquete resuelto (retrocediendo a `workflow_ref`) y `package_artifact_name=package-under-test`. El workflow reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con digest de paquete cuando es necesario y ejecuta las rutas Docker seleccionadas contra ese paquete en lugar de empaquetar el checkout del workflow. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el workflow reutilizable prepara el paquete y las imágenes compartidas una vez, luego distribuye esas rutas como trabajos Docker dirigidos paralelos con artefactos únicos.
4. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; un despacho independiente de Telegram aún puede instalar una especificación npm publicada.
5. `summary` hace fallar el workflow si fallaron la resolución del paquete, la integridad, la aceptación Docker o la ruta opcional de Telegram. La entrada `advisory` rebaja los fallos de aceptación a advertencias para llamadores de asesoría.

### Fuentes candidatas

- `source=npm` acepta solo `openclaw@extended-stable`, `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para aceptación publicada de extended-stable, prelanzamiento o stable.
- `source=ref` empaqueta una rama, etiqueta o SHA completo de commit confiable de `package_ref`. El resolutor obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o una etiqueta de lanzamiento, instala dependencias en un worktree separado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS público; `package_sha256` es obligatorio. Esta ruta rechaza credenciales de URL, puertos HTTPS no predeterminados, nombres de host o IP resueltas privadas/internas/de uso especial, y redirecciones fuera de la misma política pública de seguridad.
- `source=trusted-url` descarga un `.tgz` HTTPS desde una política de origen confiable nombrada en `.github/package-trusted-sources.json`; `package_sha256` y `trusted_source_id` son obligatorios. Usa esto solo para mirrors empresariales propiedad de mantenedores o repositorios de paquetes privados que necesiten hosts, puertos, prefijos de ruta, hosts de redirección o resolución de red privada configurados. Si la política declara autenticación bearer, el workflow usa el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; las credenciales incrustadas en URL siguen siendo rechazadas.
- `source=artifact` descarga un `.tgz` de `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería suministrarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de workflow/arnés confiable que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits de origen confiables anteriores sin ejecutar lógica de workflow antigua.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `root-managed-vps-upgrade`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — el conjunto `package` con cobertura en vivo de `plugins` en lugar de `plugins-offline`, además de `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos Docker de ruta de lanzamiento con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura offline de plugins para que la validación de paquetes publicados no quede bloqueada por la disponibilidad en vivo de ClawHub. La ruta opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, y la ruta de especificación npm publicada se conserva para despachos independientes.

Para la política dedicada de pruebas de actualización y plugins, incluidos comandos locales,
rutas Docker, entradas de Package Acceptance, valores predeterminados de lanzamiento y triaje de fallos,
consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a Package Acceptance con `source=artifact`, el artefacto preparado del paquete de lanzamiento, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape'` y `telegram_mode=mock-openai`. Esto mantiene la migración de paquetes, actualización, instalación en vivo de Skills de ClawHub, limpieza de dependencias de plugins obsoletos, reparación de instalación de plugins configurados, plugin offline, actualización de plugins y prueba de Telegram en el mismo tarball de paquete resuelto. Establece `release_package_spec` en Full Release Validation u OpenClaw Release Checks después de publicar una beta para ejecutar la misma matriz contra el paquete npm enviado sin reconstruir; establece `package_acceptance_package_spec` solo cuando Package Acceptance necesite un paquete diferente del resto de la validación de lanzamiento. Las comprobaciones de lanzamiento cross-OS siguen cubriendo onboarding específico de SO, instalador y comportamiento de plataforma; la validación de producto de paquete/actualización debería empezar con Package Acceptance.

La lane de Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución en la ruta de versión bloqueante. En Aceptación de paquetes, el tarball resuelto de `package-under-test` siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de respaldo, con valor predeterminado `openclaw@latest`; los comandos de repetición de lanes fallidas preservan esa línea base. La Validación completa de la versión con `run_release_soak=true` o `release_profile=full` establece `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para expandirse por las cuatro versiones estables más recientes de npm, además de versiones límite fijadas de compatibilidad de plugins y fixtures con forma de incidencias para la configuración de Feishu, archivos bootstrap/persona preservados, instalaciones configuradas de plugins de OpenClaw, rutas de logs con tilde y raíces obsoletas de dependencias de plugins heredados. Las selecciones de supervivencia de actualización publicada con varias líneas base se fragmentan por línea base en trabajos separados y dirigidos de runner Docker. El workflow separado `Update Migration` usa la lane de Docker `update-migration` con líneas base `all-since-2026.4.23` y escenarios `plugin-deps-cleanup` cuando la pregunta es la limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de CI de Validación completa de la versión. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquetes con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conservar una sola lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o establecer `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. La lane publicada configura la línea base con una receta integrada de comando `openclaw config set`, registra los pasos de la receta en `summary.json` y prueba `/healthz`, `/readyz`, además del estado RPC después del inicio de Gateway. Las lanes fresh de paquete e instalador de Windows también verifican que un paquete instalado pueda importar una anulación de browser-control desde una ruta absoluta sin procesar de Windows. El smoke de turnos de agente de OpenAI entre sistemas operativos usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está establecido; de lo contrario, `openai/gpt-5.5`, de modo que la prueba de instalación y gateway permanezca en un modelo de prueba GPT-5 mientras evita los valores predeterminados de GPT-4.x.

### Ventanas de compatibilidad heredada

Aceptación de paquetes tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas conocidas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa flag;
- `update-channel-switch` puede podar `patchedDependencies` faltantes de pnpm desde el fixture git falso derivado del tarball y puede registrar la falta de `update.channel` persistido;
- los smokes de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar la falta de persistencia de registros de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración mientras sigue exigiendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir sobre archivos de sello de metadatos de compilación local que ya se habían distribuido, y los paquetes hasta `2026.5.20` pueden advertir en lugar de fallar cuando falta `npm-shrinkwrap.json`. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquetes, empieza por el resumen `resolve_package` para confirmar el origen, la versión y el SHA-256 del paquete. Luego inspecciona la ejecución hija `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tiempos de fase y comandos de repetición. Prefiere repetir el perfil de paquete fallido o las lanes exactas de Docker en lugar de repetir la validación completa de la versión.

## Smoke de instalación

El workflow separado `Install Smoke` ya no se ejecuta en pull requests ni en pushes a `main`. Se ejecuta con una programación nocturna, por despacho manual y como llamada de workflow desde la validación de versión, y cada ejecución toma la ruta completa de install-smoke en runners alojados en GitHub:

- La imagen smoke del Dockerfile raíz se compila una vez por SHA objetivo (o se reutiliza desde GHCR como `ghcr.io/openclaw/openclaw-dockerfile-smoke:<sha>`); luego el smoke de CLI, el smoke de CLI de eliminación de espacio de trabajo compartido de agentes, el E2E de gateway-network en contenedor y el smoke de argumento de compilación del plugin `matrix` incluido se ejecutan contra ella. El smoke del plugin verifica el reflejo de instalación de dependencias en tiempo de ejecución y que el plugin cargue sin diagnósticos de escape de entrada.
- La instalación del paquete QR y los smokes Docker de instalador/actualización (incluidas las lanes del instalador de Rocky Linux y una lane de actualización contra una línea base npm configurable `update_baseline_version`) se ejecutan como trabajos separados para que el trabajo del instalador no espere detrás de los smokes de la imagen raíz.

El smoke lento de proveedor de imagen con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna, se activa de forma predeterminada para llamadas de workflow desde comprobaciones de versión, y los despachos manuales de `Install Smoke` pueden optar por incluirlo. La CI normal de PR sigue ejecutando la lane rápida de regresión del launcher de Bun para cambios relevantes para Node. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles centrados en instalación.

## E2E local de Docker

`pnpm test:docker:all` precompila una imagen compartida de prueba en vivo, empaqueta OpenClaw una vez como tarball npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner básico de Node/Git para lanes de instalador/actualización/dependencias de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para lanes de funcionalidad normal.

Las definiciones de lanes de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`, y el runner solo ejecuta el plan seleccionado. El planificador selecciona la imagen por lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta lanes con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Parámetros ajustables

| Variable                               | Predeterminado | Propósito                                                                                     |
| -------------------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Recuento de slots del pool principal para lanes normales.                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Recuento de slots del pool de cola sensible a proveedores.                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de lanes en vivo concurrentes para que los proveedores no apliquen throttling.         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5              | Límite de lanes concurrentes de instalación npm.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de lanes concurrentes multiservicio.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Separación entre inicios de lanes para evitar tormentas de creación del demonio Docker; establece `0` para no separar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Tiempo de espera de respaldo por lane (120 minutos); lanes en vivo/cola seleccionadas usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin definir    | `1` imprime el plan del planificador sin ejecutar lanes.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin definir    | Lista separada por comas de lanes exactas; omite el smoke de limpieza para que los agentes puedan reproducir una lane fallida. |

Una lane más pesada que su límite efectivo aún puede iniciar desde un pool vacío y luego se ejecuta sola hasta que libera capacidad. El agregado local hace preflight de Docker, elimina contenedores E2E obsoletos de OpenClaw, emite el estado de lanes activas, persiste tiempos de lanes para ordenarlas de mayor a menor duración y deja de programar nuevas lanes agrupadas después del primer fallo de forma predeterminada.

### Workflow reutilizable en vivo/E2E

El workflow reutilizable en vivo/E2E pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen en vivo, lane y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y publica imágenes GHCR Docker E2E básicas/funcionales etiquetadas por digest de paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita lanes con paquetes instalados; y reutiliza entradas proporcionadas `docker_e2e_bare_image`/`docker_e2e_functional_image` o imágenes existentes por digest de paquete en lugar de recompilar. Las extracciones de imágenes Docker se reintentan con un tiempo de espera acotado de 180 segundos por intento para que un flujo atascado de registry/caché reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de la ruta de versión

La cobertura Docker de versión ejecuta trabajos fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento extraiga solo el tipo de imagen que necesita y ejecute varias lanes mediante el mismo planificador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos Docker actuales de versión son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y `plugins-runtime-install-a` hasta `plugins-runtime-install-h`. `package-update-openai` incluye la lane en vivo de paquete del plugin Codex, que instala el paquete candidato de OpenClaw, instala el plugin Codex desde `codex_plugin_spec` o un tarball de la misma ref con aprobación explícita de instalación de Codex CLI, ejecuta el preflight de Codex CLI y luego ejecuta varios turnos de agente de OpenClaw en la misma sesión contra OpenAI. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de plugin/runtime. El alias de lane `install-e2e` sigue siendo el alias agregado de repetición manual para ambas lanes de instalador de proveedores.

OpenWebUI se integra en `plugins-runtime-services` cuando la cobertura completa de la ruta de lanzamiento lo solicita, y conserva un fragmento independiente `openwebui` solo para ejecuciones exclusivas de OpenWebUI. Los carriles de actualización de canales agrupados reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de carril, tiempos, `summary.json`, `failures.json`, tiempos de fase, JSON del plan del programador, tablas de carriles lentos y comandos de repetición por carril. La entrada `docker_lanes` del flujo de trabajo ejecuta los carriles seleccionados contra las imágenes preparadas en lugar de los trabajos de fragmento, lo que mantiene la depuración de carriles fallidos acotada a un trabajo Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si un carril seleccionado es un carril Docker en vivo, el trabajo dirigido compila localmente la imagen de prueba en vivo para esa repetición. Los comandos generados por carril para repetir ejecuciones en GitHub incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imagen preparada cuando esos valores existen, de modo que un carril fallido pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El flujo de trabajo programado en vivo/E2E ejecuta diariamente la suite Docker completa de la ruta de lanzamiento.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un flujo de trabajo separado ejecutado por `Full Release Validation` o por un operador explícito. Las solicitudes de incorporación normales, los envíos a `main` y las ejecuciones manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de Plugin agrupados entre ocho trabajadores de extensión; esos trabajos de fragmento de extensión ejecutan hasta dos grupos de configuración de Plugin a la vez con un trabajador Vitest por grupo y un heap de Node más grande para que los lotes de Plugin con muchas importaciones no creen trabajos de CI adicionales. La ruta Docker de prelanzamiento solo para lanzamiento (habilitada por la entrada `full_release_validation`) agrupa carriles Docker dirigidos en grupos de cuatro para evitar reservar docenas de ejecutores para trabajos de uno a tres minutos. El flujo de trabajo también sube un artefacto informativo `plugin-inspector-advisory` desde `@openclaw/plugin-inspector`; los hallazgos del inspector son entrada de triaje y no cambian la puerta bloqueante de Prelanzamiento de Plugin.

## Laboratorio de QA

El Laboratorio de QA tiene carriles de CI dedicados fuera del flujo de trabajo principal con alcance inteligente. La paridad agéntica está anidada bajo los arneses amplios de QA y lanzamiento, no como un flujo de trabajo independiente para PR. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba acompañar una ejecución de validación amplia.

- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y por ejecución manual; distribuye el carril de paridad simulado, el carril Matrix en vivo y los carriles Telegram y Discord en vivo como trabajos paralelos. Los trabajos en vivo usan el entorno `qa-live-shared`, y Telegram/Discord usan concesiones de Convex.

Las comprobaciones de lanzamiento ejecutan carriles de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos calificados como simulados (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato del canal quede aislado de la latencia del modelo en vivo y del inicio normal del Plugin de proveedor. El Gateway de transporte en vivo desactiva la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedor está cubierta por las suites separadas de modelo en vivo, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de lanzamiento, y añade `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del flujo de trabajo siguen siendo `all`; la ejecución manual `matrix_profile=all` siempre divide la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles críticos de lanzamiento del Laboratorio de QA antes de la aprobación de lanzamiento; su puerta de paridad de QA ejecuta los paquetes candidato y de línea base como trabajos de carril paralelos, y luego descarga ambos artefactos en un pequeño trabajo de informe para la comparación final de paridad.

Para PR normales, sigue la evidencia de CI/comprobaciones con alcance en lugar de tratar la paridad como un estado requerido.

## CodeQL

El flujo de trabajo `CodeQL` es intencionalmente un escáner de seguridad de primera pasada estrecho, no un barrido completo del repositorio. Las ejecuciones diarias, manuales, por envío a `main` y de guardia para solicitudes de incorporación que no sean borrador escanean el código de flujos de trabajo de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La guardia de solicitudes de incorporación se mantiene ligera: solo empieza para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` o rutas de runtime de Plugin agrupados que poseen procesos, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. CodeQL para Android y macOS queda fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticación, secretos, sandbox, cron y línea base de gateway                                                                       |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del core más el runtime de Plugin de canal, Gateway, SDK de Plugin, secretos, puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies del core para SSRF, análisis de IP, guardia de red, web-fetch y política SSRF del SDK de Plugin                         |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, ayudantes de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agente                |
| `/codeql-security-high/process-exec-boundary`     | Shell local, ayudantes de generación de procesos, runtimes de Plugin agrupados que poseen subprocesos y pegamento de scripts de flujo de trabajo |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, instalación del gestor de paquetes, carga de código fuente y contrato de paquete del SDK de Plugin |

### Fragmentos de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — fragmento programado de seguridad de Android. Compila la aplicación Android manualmente para CodeQL en el ejecutor Blacksmith Linux más pequeño aceptado por la comprobación de coherencia del flujo de trabajo. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento semanal/manual de seguridad de macOS. Compila la aplicación macOS manualmente para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento correspondiente no relacionado con seguridad. Ejecuta solo consultas de calidad JavaScript/TypeScript de severidad de error y no relacionadas con seguridad sobre superficies estrechas de alto valor en ejecutores Linux alojados en GitHub para que los escaneos de calidad no gasten presupuesto de registro de ejecutores de Blacksmith. Su guardia de solicitudes de incorporación es intencionalmente más pequeña que el perfil programado: los PR que no son borrador ejecutan solo los fragmentos correspondientes a las superficies que tocan, de trece fragmentos enrutable por PR: `agent-runtime-boundary`, `channel-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `memory-runtime-boundary`, `network-runtime-boundary`, `plugin-boundary`, `plugin-sdk-package-contract`, `plugin-sdk-reply-runtime`, `provider-runtime-boundary` y `session-diagnostics-boundary`. `ui-control-plane` y `web-media-runtime-boundary` quedan fuera de las ejecuciones de PR. Los cambios en la configuración de CodeQL y en el flujo de trabajo de calidad ejecutan el conjunto completo de fragmentos de PR (el fragmento de runtime de red se activa por sus propios archivos de configuración de CodeQL y rutas de código fuente que poseen red).

La ejecución manual acepta:

```text
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|network-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son puntos de apoyo para enseñanza/iteración al ejecutar un fragmento de calidad de forma aislada.

| Categoría                                              | Superficie                                                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`           | Auth, secretos, sandbox, cron y código de límites de seguridad de Gateway                                                                                          |
| `/codeql-critical-quality/config-boundary`             | Esquema de configuración, migración, normalización y contratos de IO                                                                                                |
| `/codeql-critical-quality/gateway-runtime-boundary`    | Esquemas del protocolo Gateway y contratos de métodos del servidor                                                                                                  |
| `/codeql-critical-quality/channel-runtime-boundary`    | Contratos de implementación del canal principal y del plugin de canal incluido                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`      | Ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuesta automática, y contratos de runtime del plano de control ACP                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`     | SDK del host de memoria, fachadas del runtime de memoria, alias del SDK de Plugin de memoria, unión de activación del runtime de memoria y comandos doctor de memoria |
| `/codeql-critical-quality/network-runtime-boundary`    | Paquete de política de red, runtime de socket sin procesar y captura de proxy, túnel SSH, bloqueo de Gateway, socket JSONL y superficies de transporte push         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Componentes internos de la cola de respuestas, colas de entrega de sesiones, helpers de vinculación/entrega de sesiones salientes, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`    | Despacho de respuestas entrantes del SDK de Plugin, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de vinculación de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`   | Normalización del catálogo de modelos, auth y descubrimiento de proveedores, registro del runtime de proveedores, valores predeterminados/catálogos de proveedores y registros web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`            | Arranque de la UI de control, persistencia local, flujos de control de Gateway y contratos de runtime del plano de control de tareas                                |
| `/codeql-critical-quality/web-media-runtime-boundary`  | Contratos de runtime de fetch/search web principal, IO de medios, comprensión de medios, generación de imágenes y generación de medios                              |
| `/codeql-critical-quality/plugin-boundary`             | Contratos del loader, registro, superficie pública y puntos de entrada del SDK de Plugin                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract` | Fuente del SDK de Plugin del lado del paquete publicado y helpers de contrato de paquete de plugin                                                                  |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin ocultar la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe volver a añadirse como trabajo de seguimiento acotado o fragmentado solo después de que los perfiles estrechos tengan runtime y señal estables.

## Flujos de trabajo de mantenimiento

### Agente de documentación

El flujo de trabajo `Docs Agent` es una vía de mantenimiento de Codex basada en eventos para mantener la documentación existente alineada con los cambios integrados recientemente. No tiene una programación pura: una ejecución de CI correcta por push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por workflow-run se omiten cuando `main` ya avanzó o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA fuente del Docs Agent no omitido anterior hasta el `main` actual, por lo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Agente de rendimiento de pruebas

El flujo de trabajo `Test Performance Agent` es una vía de mantenimiento de Codex basada en eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI correcta por push no bot en `main` puede activarlo, pero se omite si otra invocación por workflow-run ya se ejecutó o se está ejecutando ese día UTC. El despacho manual omite esa barrera de actividad diaria. La vía construye un informe de rendimiento de Vitest agrupado para toda la suite, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de toda la suite y rechaza cambios que reduzcan el recuento base de pruebas aprobadas. El informe agrupado registra tiempo de pared por configuración y RSS máximo en Linux y macOS, por lo que la comparación antes/después muestra los deltas de memoria de las pruebas junto a los deltas de duración. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe posterior del agente para toda la suite debe pasar antes de que se confirme nada. Cuando `main` avanza antes de que llegue el push del bot, la vía aplica rebase al parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad drop-sudo que el agente de documentación.

### PR duplicadas después de la fusión

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual de mantenimiento para la limpieza de duplicados posterior a la integración. Por defecto es dry-run y solo cierra las PR indicadas explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que la PR integrada esté fusionada y que cada duplicada tenga una incidencia referenciada compartida o hunks cambiados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Barreras de comprobación locales y enrutamiento de cambios

La lógica local de carriles de cambios vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa barrera de comprobación local es más estricta con los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del core ejecutan typecheck de producción del core y de pruebas del core, además de lint/guards del core;
- los cambios solo de pruebas del core ejecutan solo typecheck de pruebas del core, además de lint del core;
- los cambios de producción de extensiones ejecutan typecheck de producción de extensiones y de pruebas de extensiones, además de lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan typecheck de pruebas de extensiones, además de lint de extensiones;
- los cambios públicos del SDK de Plugin o de contratos de plugins se amplían al typecheck de extensiones porque las extensiones dependen de esos contratos del core (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los incrementos de versión solo de metadatos de lanzamiento ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todos los carriles de comprobación.

El enrutamiento local de pruebas cambiadas vive en `scripts/test-projects.test-support.mjs` y es intencionadamente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren asignaciones explícitas, luego pruebas hermanas y dependientes del grafo de imports. La configuración compartida de entrega de salas de grupo es una de las asignaciones explícitas: los cambios en la configuración de respuesta visible del grupo, el modo de entrega de respuesta fuente o el prompt del sistema de la herramienta de mensajes pasan por las pruebas de respuesta del core, además de regresiones de entrega de Discord y Slack, para que un cambio predeterminado compartido falle antes del primer push de la PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el harness como para que el conjunto mapeado barato no sea un proxy fiable.

## Validación de Testbox

Crabbox es el wrapper de caja remota propiedad del repo para pruebas Linux de mantenimiento. Las sesiones de agente lo usan por defecto para pruebas y trabajo computacionalmente intensivo, incluidos builds, typechecks, fan-out de lint, Docker, carriles de paquetes, E2E, pruebas en vivo y paridad de CI. El código de mantenedores de confianza usa por defecto `blacksmith-testbox`, y `.crabbox.yaml` ahora lo usa por defecto. Su workflow configurado hidrata credenciales de proveedor y agente, por lo que el código no confiable de contribuyentes o forks debe usar CI de fork sin secretos o Crabbox directo en AWS sanitizado. Las ejecuciones en AWS sanitizado establecen `CRABBOX_ENV_ALLOW=CI`, pasan `--no-hydrate` y usan un `HOME` remoto temporal nuevo; esto impide que la allowlist `OPENCLAW_*` del repo y los perfiles de auth existentes lleguen a código no confiable. Usan un lease recién preparado dedicado a esa fuente no confiable, nunca un lease de confianza o hidratado previamente. Lanza un binario Crabbox de confianza instalado desde un checkout `main` limpio y de confianza, y obtiene solo la PR remota con `--fresh-pr`; nunca ejecutes localmente el wrapper ni la configuración del checkout no confiable. Desactiva `CRABBOX_AWS_INSTANCE_PROFILE` y falla cerrado salvo que `aws.instanceProfile` resuelto esté vacío. Antes de cualquier instalación/prueba, usa herramientas de ruta absoluta de confianza para requerir un token IMDSv2, demostrar que el endpoint de credenciales IAM devuelve 404 y comparar `git rev-parse HEAD` remoto con el SHA completo de la cabeza de PR revisada. Vincula el lease a ese SHA y detén/vuelve a preparar cuando cambie la cabeza. Sube `scripts/crabbox-untrusted-bootstrap.sh` de confianza desde `main` limpio junto con `--fresh-pr`; instala Node/pnpm fijados, verifica el SHA y el pin del gestor de paquetes, aísla `HOME`, instala dependencias y luego ejecuta la prueba solicitada.
Desactiva todos los overrides `CRABBOX_TAILSCALE*`, fuerza `--network public --tailscale=false`, limpia las flags de exit-node/LAN y exige que `crabbox inspect` informe red pública sin estado de Tailscale antes de subir cualquier script. La capacidad propia de AWS/Hetzner también sigue siendo el fallback para caídas de Blacksmith, problemas de cuota o pruebas explícitas en capacidad propia.

Al inicio de una tarea de código de confianza que probablemente necesite pruebas o pruebas pesadas, los agentes deben pre-warm de inmediato en una sesión de comandos en segundo plano, continuar la inspección y edición mientras se ejecuta la hidratación, reutilizar el id `tbx_...` devuelto, sincronizar el checkout actual en cada ejecución y detenerlo antes de la entrega:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Las ejecuciones de Blacksmith respaldadas por Crabbox preparan, reclaman, sincronizan, ejecutan, informan y limpian Testboxes de un solo uso. La comprobación de cordura de sincronización integrada falla rápido cuando `git status --short` en la caja sincronizada muestra al menos 200 eliminaciones rastreadas, lo que detecta archivos raíz que desaparecen, como `pnpm-lock.yaml`. Para PR con eliminaciones grandes intencionales, establece `CRABBOX_ALLOW_MASS_DELETIONS=1` para el comando remoto.

Crabbox también termina una invocación local de la CLI de Blacksmith que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Establece `CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para deshabilitar esa guarda, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

Antes de una primera ejecución, comprueba el wrapper desde la raíz del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El wrapper del repo rechaza un binario Crabbox obsoleto que no anuncia el proveedor seleccionado, y las ejecuciones respaldadas por Blacksmith requieren Crabbox 0.22.0 o posterior para que el wrapper obtenga el comportamiento actual de sincronización, cola y limpieza de Testbox. En worktrees de Codex o checkouts vinculados/dispersos, evita el script local `pnpm crabbox:run` porque pnpm puede reconciliar dependencias antes de que Crabbox arranque; invoca directamente el wrapper de node en su lugar:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Cuando uses el checkout hermano, reconstruye el binario local ignorado antes de trabajos de medición o prueba:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

El bloque `blacksmith:` en `.crabbox.yaml` ya fija los valores predeterminados de organización, workflow, trabajo y ref, así que las marcas explícitas siguientes son opcionales. Control de cambios:

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
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test <path-or-filter>"
```

Suite completa:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "corepack pnpm test"
```

Lee el resumen JSON final. Los campos útiles son `provider`, `leaseId`,
`syncDelegated`, `exitCode`, `commandMs` y `totalMs`. Para ejecuciones delegadas de
Blacksmith Testbox, el código de salida del envoltorio de Crabbox y el resumen JSON son el
resultado del comando. La ejecución enlazada de GitHub Actions es responsable de la hidratación y del mantenimiento de actividad; puede
terminar como `cancelled` cuando el Testbox se detiene externamente después de que el comando
SSH ya haya devuelto resultado. Trata eso como un artefacto de limpieza/estado salvo que
el `exitCode` del envoltorio sea distinto de cero o que la salida del comando muestre una prueba fallida.
Las ejecuciones únicas de Crabbox respaldadas por Blacksmith deberían detener el Testbox automáticamente;
si una ejecución se interrumpe o la limpieza no está clara, inspecciona las cajas activas y detén solo
las cajas que creaste:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Usa la reutilización solo cuando necesites intencionalmente varios comandos en la misma caja hidratada:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --id <tbx_id> --timing-json --shell -- "corepack pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Reutiliza la asignación, no código fuente obsoleto. Omite `--no-sync` para que cada ejecución suba el
checkout actual; úsalo solo para volver a ejecutar intencionalmente un árbol
sin cambios y ya sincronizado. El código de colaboradores o forks no confiables debe usar
`CRABBOX_ENV_ALLOW=CI`, `--provider aws --no-hydrate` y un `HOME` remoto
temporal nuevo para cada comando; instala las dependencias dentro de ese
comando sanitizado antes de probar. Reutiliza solo una asignación recién preparada dedicada al
mismo código fuente no confiable; nunca una asignación confiable o previamente hidratada. Nunca
ejecutes localmente el wrapper o la configuración del checkout no confiable: inicia el binario
confiable instalado de Crabbox desde un `main` limpio y confiable, y pasa `--fresh-pr` en cada
ejecución. Mantén `CRABBOX_AWS_INSTANCE_PROFILE` sin definir, rechaza un perfil de instancia
resuelto no vacío, exige una prueba IMDS remota confiable sin rol, y verifica el SHA del head
revisado antes de instalar/probar. Vincula la asignación a ese SHA; detén y
vuelve a preparar después de cualquier cambio de head. Si no existe un PR remoto, usa CI de fork sin secretos.
Nunca selecciones `hydrate-github` ni el flujo de trabajo Blacksmith hidratado con credenciales
para código fuente no confiable.

Si Crabbox es la capa rota pero Blacksmith en sí funciona, usa Blacksmith directo
solo para diagnósticos como `list`, `status` y limpieza. Arregla la
ruta de Crabbox antes de tratar una ejecución directa de Blacksmith como prueba de mantenedor.

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan pero los nuevos
precalentamientos quedan en `queued` sin IP ni URL de ejecución de Actions después de un par de minutos,
trátalo como presión del proveedor Blacksmith, la cola, la facturación o los límites de la organización. Detén los
ids en cola que creaste, evita iniciar más Testboxes y mueve la prueba a la
ruta de capacidad propia de Crabbox de abajo mientras alguien revisa el panel de Blacksmith,
la facturación y los límites de la organización.

Escala a capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, no tenga el entorno necesario, o la capacidad propia sea explícitamente el objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --provider aws --id <cbx_id-or-slug>
pnpm crabbox:run -- --provider aws --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- --provider aws <cbx_id-or-slug>
```

Bajo presión de AWS, evita `class=beast` salvo que la tarea realmente necesite CPU de clase 48xlarge. Una solicitud `beast` empieza en 192 vCPU y es la forma más fácil de activar la cuota regional de EC2 Spot o On-Demand Standard. El `.crabbox.yaml` propiedad del repo usa de forma predeterminada `class: standard`, mercado on-demand y `capacity.hints: true`, de modo que las asignaciones de AWS intermediadas impriman la región/mercado seleccionados, la presión de cuota, el fallback de Spot y advertencias de clase de alta presión. Usa `fast` para comprobaciones amplias más pesadas, `large` solo después de que standard/fast no sean suficientes, y `beast` solo para carriles excepcionales limitados por CPU, como matrices Docker de suite completa o todos los plugins, validación explícita de release/bloqueador, o perfilado de rendimiento con muchos núcleos. No uses `beast` para `pnpm check:changed`, pruebas enfocadas, trabajo solo de documentación, lint/typecheck ordinario, pequeñas reproducciones E2E, o triage de caída de Blacksmith. Usa `--market on-demand` para el diagnóstico de capacidad, de modo que la inestabilidad del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` define los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions. La sincronización de Crabbox nunca transfiere `.git`, por lo que el checkout hidratado de Actions conserva sus propios metadatos Git remotos en lugar de sincronizar remotos y almacenes de objetos locales del mantenedor, y la configuración del repo además excluye artefactos locales de runtime/build (como `.artifacts` e informes de pruebas) que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` define el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y el traspaso del entorno sin secretos para comandos `crabbox run --id <cbx_id>` en nube propia.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
