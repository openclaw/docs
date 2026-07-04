---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o reejecución de validación de lanzamiento
    - Está modificando el dispatch de ClawSweeper o el reenvío de actividad de GitHub
summary: Gráfico de trabajos de CI, compuertas de alcance, paraguas de release y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-07-04T17:47:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af8650cc7f194a7770c0f997d3c7a6a8f0307a9ce0a00525250e6a853ddecef1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada envío a `main` y en cada pull request. Los envíos canónicos a `main` primero pasan por una ventana de admisión de 90 segundos en runners alojados. El grupo de concurrencia `CI` existente cancela esa ejecución en espera cuando llega un commit más reciente, por lo que las fusiones secuenciales no registran cada una una matriz completa de Blacksmith. Las pull requests y los despachos manuales omiten la espera. Luego, el trabajo `preflight` clasifica el diff y desactiva las vías costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y despliegan el grafo completo para candidatos de versión y validación amplia. Las vías de Android siguen siendo opcionales mediante `include_android`. La cobertura de Plugins solo para lanzamientos vive en el workflow separado [`Plugin Prerelease`](#plugin-prerelease) y solo se ejecuta desde [`Full Release Validation`](#full-release-validation) o un despacho manual explícito.

## Resumen del pipeline

| Trabajo                            | Propósito                                                                                                      | Cuándo se ejecuta                                      |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `preflight`                        | Detectar cambios solo de docs, alcances cambiados, extensiones cambiadas y crear el manifiesto de CI           | Siempre en envíos y PRs no borrador                    |
| `runner-admission`                 | Debounce alojado de 90 segundos para envíos canónicos a `main` antes de registrar trabajo de Blacksmith        | Cada ejecución de CI; duerme solo en envíos canónicos a `main` |
| `security-fast`                    | Detección de claves privadas, auditoría de workflows cambiados mediante `zizmor` y auditoría del lockfile de producción | Siempre en envíos y PRs no borrador                    |
| `check-dependencies`               | Pasada de Knip solo para dependencias de producción más la guarda de lista permitida de archivos no usados      | Cambios relevantes para Node                           |
| `build-artifacts`                  | Crear `dist/`, Control UI, comprobaciones smoke de CLI compilada, comprobaciones de artefactos compilados incrustados y artefactos reutilizables | Cambios relevantes para Node                           |
| `checks-fast-core`                 | Vías rápidas de corrección en Linux, como bundled, protocolo, QA Smoke CI y comprobaciones de enrutamiento de CI | Cambios relevantes para Node                           |
| `checks-fast-contracts-plugins-*`  | Dos comprobaciones fragmentadas de contratos de Plugins                                                        | Cambios relevantes para Node                           |
| `checks-fast-contracts-channels-*` | Dos comprobaciones fragmentadas de contratos de canales                                                        | Cambios relevantes para Node                           |
| `checks-node-core-*`               | Fragmentos de pruebas de Node del core, excluyendo vías de canales, bundled, contratos y extensiones           | Cambios relevantes para Node                           |
| `check-*`                          | Equivalente fragmentado de la puerta local principal: tipos de producción, lint, guardas, tipos de pruebas y smoke estricto | Cambios relevantes para Node                           |
| `check-additional-*`               | Arquitectura, drift de límites/prompts fragmentado, guardas de extensiones, límite de paquetes y topología de runtime | Cambios relevantes para Node                           |
| `checks-node-compat-node22`        | Vía de build y smoke de compatibilidad con Node 22                                                             | Despacho manual de CI para lanzamientos                |
| `check-docs`                       | Formato, lint y comprobaciones de enlaces rotos de la documentación                                            | Docs cambiadas                                         |
| `skills-python`                    | Ruff + pytest para Skills respaldadas por Python                                                               | Cambios relevantes para Skills de Python               |
| `checks-windows`                   | Pruebas específicas de procesos/rutas de Windows más regresiones compartidas de especificadores de importación de runtime | Cambios relevantes para Windows                        |
| `macos-node`                       | Vía de pruebas TypeScript en macOS usando los artefactos compilados compartidos                                | Cambios relevantes para macOS                          |
| `macos-swift`                      | Lint, build y pruebas de Swift para la app de macOS                                                            | Cambios relevantes para macOS                          |
| `ios-build`                        | Generación del proyecto Xcode más build de la app iOS en simulador                                             | App iOS, kit de app compartido o cambios de Swabble    |
| `android`                          | Pruebas unitarias de Android para ambos sabores más un build de APK debug                                      | Cambios relevantes para Android                        |
| `test-performance-agent`           | Optimización diaria de pruebas lentas de Codex después de actividad confiable                                  | Éxito de CI principal o despacho manual                |
| `openclaw-performance`             | Informes diarios/bajo demanda de rendimiento del runtime Kova con proveedor simulado, perfil profundo y vías live de GPT 5.5 | Programado y despacho manual                           |

## Orden de fallo rápido

1. `runner-admission` espera solo para envíos canónicos a `main`; un envío más reciente cancela la ejecución antes del registro en Blacksmith.
2. `preflight` decide qué vías existen. La lógica `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
3. `security-fast`, `check-*`, `check-additional-*`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de artefactos y matriz de plataformas.
4. `build-artifacts` se solapa con las vías rápidas de Linux para que los consumidores posteriores puedan empezar en cuanto el build compartido esté listo.
5. Las vías más pesadas de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-plugins-*`, `checks-fast-contracts-channels-*`, `checks-node-core-*`, `checks-windows`, `macos-node`, `macos-swift`, `ios-build` y `android`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un envío más reciente al mismo PR o ref de `main`. Trátalo como ruido de CI salvo que la ejecución más reciente para la misma ref también esté fallando. Los trabajos de matriz usan `fail-fast: false`, y `build-artifacts` informa directamente los fallos incrustados de canal, core-support-boundary y gateway-watch en lugar de poner en cola trabajos verificadores diminutos. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente las ejecuciones más recientes de main. Las ejecuciones manuales de la suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

Usa `pnpm ci:timings`, `pnpm ci:timings:recent` o `node scripts/ci-run-timings.mjs <run-id>` para resumir tiempo de pared, tiempo en cola, trabajos más lentos, fallos y la barrera de despliegue `pnpm-store-warmup` desde GitHub Actions. CI también sube el mismo resumen de ejecución como artefacto `ci-timings-summary`. Para tiempos de build, revisa el paso `Build dist` del trabajo `build-artifacts`: `pnpm build:ci-artifacts` imprime `[build-all] phase timings:` e incluye `ui:build`; el trabajo también sube el artefacto `startup-memory`.

Para ejecuciones de pull requests, el trabajo terminal de resumen de tiempos ejecuta el helper desde la revisión base confiable antes de pasar `GH_TOKEN` a `gh run view`. Eso mantiene la consulta con token fuera del código controlado por la rama, mientras sigue resumiendo la ejecución de CI actual de la pull request.

## Contexto y evidencia de PR

Las PRs de contribuidores externos ejecutan una puerta de contexto y evidencia de PR desde `.github/workflows/real-behavior-proof.yml`. El workflow hace checkout del commit base confiable y evalúa solo el cuerpo del PR; no ejecuta código de la rama del contribuidor.

La puerta se aplica a autores de PR que no son propietarios, miembros, colaboradores ni bots del repositorio. Pasa cuando el cuerpo del PR contiene secciones redactadas por el autor `What Problem This Solves` y `Evidence`. La evidencia puede ser una prueba enfocada, resultado de CI, captura de pantalla, grabación, salida de terminal, observación live, log redactado o enlace a artefacto. El cuerpo aporta intención y validación útil; los revisores inspeccionan el código, las pruebas y CI para evaluar la corrección.

Cuando la comprobación falla, actualiza el cuerpo del PR en lugar de enviar otro commit de código.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. El despacho manual omite la detección de alcance cambiado y hace que el manifiesto de preflight actúe como si cada área con alcance hubiera cambiado.

- **Ediciones del workflow de CI** validan el grafo de CI de Node más el lint de workflows, pero no fuerzan por sí solas builds nativos de Windows, iOS, Android o macOS; esas vías de plataforma permanecen acotadas a cambios de código fuente de plataforma.
- **Workflow Sanity** ejecuta `actionlint`, `zizmor` sobre todos los archivos YAML de workflow, la guarda de interpolación de acciones compuestas y la guarda de marcadores de conflicto. El trabajo `security-fast` acotado al PR también ejecuta `zizmor` sobre archivos de workflow cambiados para que los hallazgos de seguridad de workflows fallen temprano en el grafo principal de CI.
- **Docs en envíos a `main`** se comprueban mediante el workflow independiente `Docs` con el mismo espejo de docs de ClawHub usado por CI, por lo que los envíos mixtos de código+docs no ponen también en cola el fragmento `check-docs` de CI. Las pull requests y CI manual siguen ejecutando `check-docs` desde CI cuando cambiaron docs.
- **TUI PTY** se ejecuta en el fragmento Linux Node `checks-node-core-runtime-tui-pty` para cambios de TUI. El fragmento ejecuta `test/vitest/vitest.tui-pty.config.ts` con `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1`, por lo que cubre tanto la vía determinista del fixture `TuiBackend` como el smoke más lento `tui --local` que simula solo el endpoint externo del modelo.
- **Ediciones solo de enrutamiento de CI, ediciones seleccionadas y baratas de fixtures de pruebas del core, y ediciones estrechas de helpers/enrutamiento de pruebas de contratos de Plugins** usan una ruta rápida de manifiesto solo Node: `preflight`, seguridad y una única tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canales, fragmentos completos del core, fragmentos de Plugins bundled y matrices de guardas adicionales cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Comprobaciones Node de Windows** están acotadas a wrappers específicos de procesos/rutas de Windows, helpers de runners npm/pnpm/UI, configuración del gestor de paquetes y las superficies del workflow de CI que ejecutan esa vía; los cambios no relacionados de código fuente, Plugin, install-smoke y solo pruebas permanecen en las vías Linux Node.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo se mantenga pequeño sin reservar ejecutores en exceso: los contratos de Plugin y los contratos de canal se ejecutan cada uno como dos fragmentos ponderados respaldados por Blacksmith con la reserva estándar del ejecutor de GitHub, los carriles rápidos/de soporte de unidades del núcleo se ejecutan por separado, la infraestructura de runtime del núcleo se divide entre estado, proceso/configuración, compartido y tres fragmentos de dominio cron, auto-reply se ejecuta como trabajadores equilibrados (con el subárbol de respuesta dividido en fragmentos de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic de gateway/servidor se dividen entre carriles de chat/auth/model/http-plugin/runtime/startup en lugar de esperar artefactos compilados. Luego, el CI normal empaqueta solo fragmentos aislados de patrones de inclusión de infraestructura en paquetes deterministas de como máximo 64 archivos de prueba, reduciendo la matriz de Node sin fusionar suites no aisladas de command/cron, agents-core con estado ni gateway/servidor; las suites fijas pesadas permanecen en 8 vCPU mientras que los carriles empaquetados y de menor peso usan 4 vCPU. Las solicitudes de extracción en el repositorio canónico usan un plan de admisión compacto adicional: los mismos grupos por configuración se ejecutan en subprocesos aislados dentro del plan actual de 34 trabajos Linux Node, de modo que una sola solicitud de extracción no registra la matriz completa de Node de más de 70 trabajos. Los envíos a `main`, los dispatch manuales y las puertas de lanzamiento conservan la matriz completa. Las pruebas amplias de navegador, QA, medios y Plugins varios usan sus configuraciones dedicadas de Vitest en lugar del comodín compartido de Plugin. Los fragmentos de patrones de inclusión registran entradas de tiempos usando el nombre de fragmento de CI, de modo que `.artifacts/vitest-shard-timings.json` puede distinguir una configuración completa de un fragmento filtrado. `check-additional-*` mantiene juntos el trabajo de compilación/canary de límites de paquete y separa la arquitectura de topología de runtime de la cobertura de observación de Gateway; la lista de guardas de límites se distribuye en un fragmento pesado en prompts y un fragmento combinado para las franjas de guardas restantes, cada uno ejecutando guardas independientes seleccionados de forma concurrente e imprimiendo tiempos por comprobación. La costosa comprobación de deriva de instantáneas de prompts de la ruta feliz de Codex se ejecuta como su propio trabajo adicional solo para CI manual y para cambios que afectan prompts, de modo que los cambios normales de Node no relacionados no esperan detrás de la generación en frío de instantáneas de prompts y los fragmentos de límites se mantienen equilibrados mientras la deriva de prompts sigue anclada a la solicitud de extracción que la causó; la misma marca omite la generación Vitest de instantáneas de prompts dentro del fragmento de límites de soporte del núcleo con artefactos compilados. La observación de Gateway, las pruebas de canal y el fragmento de límites de soporte del núcleo se ejecutan de forma concurrente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya se hayan compilado.

Una vez admitido, el CI canónico de Linux permite hasta 24 trabajos de prueba de Node concurrentes y
12 para los carriles rápidos/de comprobación más pequeños; Windows y Android permanecen en dos porque
esos grupos de ejecutores son más estrechos.

El plan compacto de solicitudes de extracción emite 18 trabajos de Node para la suite actual: los grupos
de configuración completa se agrupan en subprocesos aislados con un tiempo de espera de lote de 120 minutos,
mientras que los grupos de patrones de inclusión comparten el mismo presupuesto de trabajos acotado.

El CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego compila el APK de depuración de Play. El sabor de terceros no tiene un conjunto de fuentes ni manifiesto separado; su carril de pruebas unitarias aún compila el sabor con las marcas BuildConfig de SMS/registro de llamadas, mientras evita un trabajo duplicado de empaquetado de APK de depuración en cada envío relevante para Android.

El fragmento `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una pasada de Knip solo de dependencias de producción fijada a la versión más reciente de Knip, con la edad mínima de lanzamiento de pnpm deshabilitada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos no usados de producción de Knip con `scripts/deadcode-unused-files.allowlist.mjs`. El guarda de archivos no usados falla cuando una solicitud de extracción agrega un nuevo archivo no usado sin revisar o deja una entrada obsoleta en la lista de permitidos, mientras conserva superficies intencionales de Plugin dinámico, generadas, de compilación, de pruebas en vivo y de puente de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado de destino desde la actividad del repositorio OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código de solicitudes de extracción no confiable. El workflow crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego despacha cargas útiles compactas de `repository_dispatch` a `openclaw/clawsweeper`.

El workflow tiene cuatro carriles:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y solicitudes de extracción;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en envíos a `main`;
- `github_activity` para actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

El carril `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando existen. Evita intencionalmente reenviar el cuerpo completo del Webhook. El workflow receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook del Gateway de OpenClaw para el agente ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente ClawSweeper recibe el destino de Discord en su prompt y debe publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Las aperturas rutinarias, ediciones, ruido de bots, ruido duplicado de Webhook y tráfico normal de revisiones deben dar como resultado `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisión, nombres de ramas y mensajes de commit de GitHub como datos no confiables en toda esta ruta. Son entrada para resumir y clasificar, no instrucciones para el workflow ni para el runtime del agente.

## Dispatch manuales

Los dispatch manuales de CI ejecutan el mismo grafo de trabajos que el CI normal, pero fuerzan todos los carriles con alcance que no son de Android: fragmentos Linux Node, fragmentos de Plugins empaquetados, fragmentos de contratos de Plugin y canal, compatibilidad con Node 22, `check-*`, `check-additional-*`, comprobaciones smoke de artefactos compilados, comprobaciones de documentación, Skills de Python, Windows, macOS, compilación iOS e i18n de Control UI. Los dispatch manuales independientes de CI ejecutan Android solo con `include_android=true`; el paraguas completo de lanzamiento habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prelanzamiento de Plugin, el fragmento `agentic-plugins` solo de lanzamiento, el barrido completo por lotes de extensiones y los carriles Docker de prelanzamiento de Plugin quedan excluidos del CI. La suite Docker de prelanzamiento se ejecuta solo cuando `Full Release Validation` despacha el workflow separado `Plugin Prerelease` con la puerta de validación de lanzamiento habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidato de lanzamiento no sea cancelada por otro envío o ejecución de solicitud de extracción en la misma referencia. La entrada opcional `target_ref` permite que un llamador confiable ejecute ese grafo contra una rama, etiqueta o SHA de commit completo mientras usa el archivo de workflow desde la referencia de dispatch seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.PATCH
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

La ruta mensual extended-stable solo de npm es la excepción: despacha tanto la verificación previa de `OpenClaw NPM
Release` como `Full Release Validation` desde la rama exacta
`extended-stable/YYYY.M.33`, conserva sus ID de ejecución y pasa ambos ID a la
ejecución directa de publicación npm. Consulta [Publicación mensual extended-stable
solo de npm](/es/reference/RELEASING#monthly-npm-only-extended-stable-publication) para
los comandos, requisitos exactos de identidad, lectura de retorno del registro y procedimiento de reparación
del selector. Esta ruta no despacha Plugin, macOS, Windows, GitHub
Release, dist-tag privada ni otra publicación de plataforma.

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                  | Dispatch manual de CI y reservas para repositorios no canónicos, escaneos de calidad de JavaScript/actions de CodeQL, workflow-sanity, labeler, auto-response, workflows de documentación fuera de CI y verificación previa install-smoke para que la matriz de Blacksmith pueda ponerse en cola antes |
| `blacksmith-4vcpu-ubuntu-2404`  | `preflight`, `security-fast`, fragmentos de extensión de menor peso, `checks-fast-core` excepto QA Smoke CI, fragmentos de contratos de Plugin/canal, la mayoría de fragmentos Linux Node empaquetados/de menor peso, `check-guards`, `check-prod-types`, `check-test-types`, fragmentos `check-additional-*` seleccionados y `check-dependencies` |
| `blacksmith-8vcpu-ubuntu-2404`  | Suites Linux Node pesadas retenidas, fragmentos `check-additional-*` pesados en límites/extensiones y `android`                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404` | QA Smoke CI, `build-artifacts` en CI y Testbox, `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker install-smoke (el tiempo de cola de 32 vCPU costaba más de lo que ahorraba)                                                       |
| `blacksmith-8vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-15`     | `macos-node` en `openclaw/openclaw`; los forks recurren a `macos-15`                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-26`    | `macos-swift` e `ios-build` en `openclaw/openclaw`; los forks recurren a `macos-26`                                                                                                                                                                                                                       |

## Presupuesto de registro de ejecutores

El bucket actual de registro de ejecutores de GitHub de OpenClaw informa 10.000 registros de ejecutores
self-hosted por 5 minutos en `ghx api rate_limit`. Vuelve a comprobar
`actions_runner_registration` antes de cada pasada de ajuste porque GitHub puede cambiar
este bucket. El límite lo comparten todos los registros de ejecutores de Blacksmith en la
organización `openclaw`, por lo que agregar otra instalación de Blacksmith no agrega
un nuevo bucket.

Trata las etiquetas de Blacksmith como el recurso escaso para el control de ráfagas. Los trabajos que
solo enrutan, notifican, resumen, seleccionan fragmentos o ejecutan escaneos breves de CodeQL deben
permanecer en ejecutores hospedados por GitHub salvo que tengan necesidades específicas de Blacksmith
medidas. Cualquier nueva matriz de Blacksmith, `max-parallel` mayor o workflow de alta frecuencia
debe mostrar su recuento de registros en el peor caso y mantener el objetivo a nivel de organización
por debajo de aproximadamente el 60% del bucket en vivo. Con el bucket actual de 10.000 registros,
eso significa un objetivo operativo de 6.000 registros, dejando margen para
repositorios concurrentes, reintentos y solapamiento de ráfagas.

El CI del repositorio canónico mantiene Blacksmith como la ruta predeterminada de ejecutor para ejecuciones normales de push y solicitudes de extracción. `workflow_dispatch` y las ejecuciones de repositorios no canónicos usan ejecutores hospedados por GitHub, pero las ejecuciones canónicas normales no comprueban actualmente la salud de la cola de Blacksmith ni vuelven automáticamente a etiquetas hospedadas por GitHub cuando Blacksmith no está disponible.

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

El lanzamiento manual normalmente mide el rendimiento de la referencia del flujo de trabajo. Define `target_ref` para medir una etiqueta de versión u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros más recientes se indexan por la referencia probada, y cada `index.md` registra la referencia/SHA probados, la referencia/SHA del flujo de trabajo, la referencia de Kova, el perfil, el modo de autenticación del carril, el modelo, el recuento de repeticiones y los filtros de escenario.

El flujo de trabajo instala OCM desde una versión anclada y Kova desde `openclaw/Kova` en la entrada `kova_ref` anclada, y luego ejecuta tres carriles:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfilado de CPU/heap/trazas para puntos críticos de arranque, Gateway y turnos de agente.
- `live-openai-candidate`: un turno real de agente OpenAI `openai/gpt-5.5`, omitido cuando `OPENAI_API_KEY` no está disponible.

El carril mock-provider también ejecuta sondas de código fuente nativas de OpenClaw después de la pasada de Kova: tiempos de arranque del Gateway y memoria en los casos de inicio predeterminado, con hook y con 50 plugins; RSS de importación de plugins empaquetados, bucles repetidos de saludo `channel-chat-baseline` con OpenAI simulado, comandos de inicio de CLI contra el Gateway arrancado y la sonda rápida de rendimiento del estado SQLite. Cuando el informe fuente mock-provider publicado anterior está disponible para la referencia probada, el resumen de código fuente compara los valores actuales de RSS y heap con esa línea base y marca los aumentos grandes de RSS como `watch`. El resumen Markdown de la sonda de código fuente se encuentra en `source/index.md` dentro del paquete de informe, con el JSON sin procesar al lado.

Cada carril sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondas de código fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la referencia probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación completa de la versión

`Full Release Validation` es el flujo de trabajo paraguas manual para "ejecutar todo antes de la versión". Acepta una rama, etiqueta o SHA completo de commit, lanza el flujo de trabajo manual `CI` con ese objetivo, lanza `Plugin Prerelease` para la prueba solo de versión de plugin/paquete/estático/Docker y lanza `OpenClaw Release Checks` para comprobación rápida de instalación, aceptación de paquete, comprobaciones de paquete entre sistemas operativos, renderizado del cuadro de madurez desde evidencia de perfiles de QA, paridad de QA Lab, Matrix y carriles de Telegram. Los perfiles stable y full siempre incluyen cobertura exhaustiva live/E2E y soak de ruta de versión Docker; el perfil beta puede optar por incluirla con `run_release_soak=true`. El E2E canónico de Telegram del paquete se ejecuta dentro de Package Acceptance, por lo que un candidato completo no inicia un poller live duplicado. Después de publicar, pasa `release_package_spec` para reutilizar el paquete npm publicado en comprobaciones de versión, Package Acceptance, Docker, entre sistemas operativos y Telegram sin recompilar. Usa `npm_telegram_package_spec` solo para una repetición enfocada de Telegram con paquete publicado. El carril de paquete live del plugin Codex usa el mismo estado seleccionado de forma predeterminada: `release_package_spec=openclaw@<tag>` publicado deriva `codex_plugin_spec=npm:@openclaw/codex@<tag>`, mientras que las ejecuciones con SHA/artefacto empaquetan `extensions/codex` desde la referencia seleccionada. Define `codex_plugin_spec` explícitamente para fuentes de plugin personalizadas, como especificaciones `npm:`, `npm-pack:` o `git:`.

Consulta [Validación completa de la versión](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos del flujo de trabajo, diferencias entre perfiles, artefactos y
selectores de repetición enfocada.

`OpenClaw Release Publish` es el flujo de trabajo manual mutante de publicación de versiones. Lánzalo
desde `release/YYYY.M.PATCH` o `main` después de que exista la etiqueta de versión y después de que la
preflight npm de OpenClaw haya terminado correctamente. Verifica `pnpm plugins:sync:check`,
lanza `Plugin NPM Release` para todos los paquetes de plugin publicables, lanza
`Plugin ClawHub Release` para el mismo SHA de versión y solo entonces lanza
`OpenClaw NPM Release` con el `preflight_run_id` guardado. La publicación stable también
requiere un `windows_node_tag` exacto; el flujo de trabajo verifica la versión fuente de Windows
y compara sus instaladores x64/ARM64 con la entrada
`windows_node_installer_digests` aprobada para el candidato antes de cualquier flujo hijo de publicación; después promociona
y verifica esos mismos digests de instalador anclados más el contrato exacto de artefacto complementario
y suma de comprobación antes de publicar el borrador de la versión en GitHub.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.PATCH \
  -f tag=vYYYY.M.PATCH-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f full_release_validation_run_id=<successful-full-release-validation-run-id> \
  -f npm_dist_tag=beta
```

Para prueba de commit anclado en una rama que avanza rápido, usa el asistente en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las referencias de lanzamiento de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA de commit sin procesar. El
asistente sube una rama temporal `release-ci/<sha>-...` en el SHA objetivo,
lanza `Full Release Validation` desde esa referencia anclada, verifica que cada `headSha` de flujo hijo
coincida con el objetivo y elimina la rama temporal cuando la
ejecución termina. El verificador paraguas también falla si algún flujo hijo se ejecutó en un
SHA distinto.

`release_profile` controla la amplitud live/proveedor pasada a las comprobaciones de versión. Los
flujos de trabajo manuales de versión usan `stable` de forma predeterminada; usa `full` solo cuando
quieras intencionalmente la matriz amplia consultiva de proveedores/medios. Las comprobaciones de versión
stable y full siempre ejecutan el soak exhaustivo live/E2E y Docker de ruta de versión;
el perfil beta puede optar por incluirlo con `run_release_soak=true`.

- `minimum` conserva los carriles críticos de versión de OpenAI/núcleo más rápidos.
- `stable` añade el conjunto stable de proveedor/backend.
- `full` ejecuta la matriz amplia consultiva de proveedores/medios.

El paraguas registra los ids de las ejecuciones hijas lanzadas, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y añade tablas de los trabajos más lentos para cada ejecución hija. Si un flujo hijo se vuelve a ejecutar y pasa a verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado paraguas y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de versión, `ci` solo para el hijo de CI completo normal, `plugin-prerelease` solo para el hijo de prerelease de plugins, `release-checks` para cada hijo de versión, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la repetición de una caja de versión fallida después de una corrección enfocada. Para un carril entre sistemas operativos fallido, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos largos entre sistemas operativos emiten líneas de Heartbeat y los resúmenes de packaged-upgrade incluyen tiempos por fase. Los carriles de comprobación de versión de QA son consultivos excepto la puerta estándar de cobertura de herramientas del runtime, que bloquea cuando las herramientas dinámicas requeridas de OpenClaw se desvían o desaparecen del resumen del nivel estándar.

`OpenClaw Release Checks` usa la referencia confiable del flujo de trabajo para resolver una vez la referencia seleccionada en un tarball `release-package-under-test`; después pasa ese artefacto a las comprobaciones entre sistemas operativos y Package Acceptance, además del flujo de trabajo Docker live/E2E de ruta de versión cuando se ejecuta la cobertura soak. Eso mantiene los bytes del paquete coherentes entre cajas de versión y evita reempaquetar el mismo candidato en varios trabajos hijos. Para el carril live del plugin npm Codex, las comprobaciones de versión pasan una especificación de plugin publicado coincidente derivada de `release_package_spec`, pasan el `codex_plugin_spec` suministrado por el operador o dejan la entrada en blanco para que el script Docker empaquete el plugin Codex del checkout seleccionado.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
sustituyen al paraguas anterior. El monitor padre cancela cualquier flujo hijo que
ya haya lanzado cuando se cancela el padre, por lo que la validación más nueva de main
no queda detrás de una ejecución obsoleta de dos horas de comprobaciones de versión. La validación de ramas/etiquetas
de versión y los grupos de repetición enfocada mantienen `cancel-in-progress: false`.

## Shards live y E2E

El hijo live/E2E de versión conserva una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como shards con nombre mediante `scripts/test-live-shard.mjs` en lugar de un trabajo serial:

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
- shards separados de audio/vídeo de medios y shards de música filtrados por proveedor

Esto conserva la misma cobertura de archivos y, a la vez, facilita repetir y diagnosticar fallos lentos de proveedores live. Los nombres de shard agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales de una sola pasada.

Los shards nativos live de medios se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, creado por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners normales de Blacksmith: los trabajos de contenedor no son el lugar correcto para lanzar pruebas Docker anidadas.

Los shards de modelo/backend en vivo respaldados por Docker usan una imagen compartida `ghcr.io/openclaw/openclaw-live-test:<sha>` separada por cada commit seleccionado. El flujo de trabajo de release en vivo compila y publica esa imagen una vez; después, los shards del modelo en vivo de Docker, el Gateway dividido por proveedor, el backend de CLI, el enlace ACP y el arnés Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards de Gateway Docker llevan límites explícitos de `timeout` a nivel de script por debajo del tiempo de espera del job del flujo de trabajo, de modo que un contenedor bloqueado o una ruta de limpieza falle rápido en vez de consumir todo el presupuesto de comprobaciones de release. Si esos shards recompilan de forma independiente el objetivo Docker completo del código fuente, la ejecución de release está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de paquetes

Usa `Package Acceptance` cuando la pregunta sea "¿este paquete instalable de OpenClaw funciona como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo arnés E2E de Docker que los usuarios ejercitan después de instalar o actualizar.

### Jobs

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime el origen, la ref del flujo de trabajo, la ref del paquete, la versión, el SHA-256 y el perfil en el resumen del paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con digest del paquete cuando es necesario y ejecuta los lanes de Docker seleccionados contra ese paquete en vez de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego distribuye esos lanes como jobs Docker dirigidos paralelos con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando la Aceptación de paquetes resolvió uno; el dispatch independiente de Telegram todavía puede instalar una especificación npm publicada.
4. `summary` hace fallar el flujo de trabajo si falló la resolución del paquete, la aceptación Docker o el lane opcional de Telegram.

### Orígenes de candidatos

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de release de OpenClaw como `openclaw@2026.4.27-beta.2`. Úsalo para la aceptación de prereleases/estables publicados.
- `source=ref` empaqueta una rama, etiqueta o SHA de commit completo de confianza en `package_ref`. El resolvedor obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o desde una etiqueta de release, instala dependencias en un worktree desacoplado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS público; `package_sha256` es obligatorio. Esta ruta rechaza credenciales en la URL, puertos HTTPS no predeterminados, nombres de host o IP resueltas privadas/internas/de uso especial, y redirecciones fuera de la misma política pública de seguridad.
- `source=trusted-url` descarga un `.tgz` HTTPS desde una política de origen de confianza con nombre en `.github/package-trusted-sources.json`; `package_sha256` y `trusted_source_id` son obligatorios. Usa esto solo para mirrors empresariales propiedad de mantenedores o repositorios de paquetes privados que necesiten hosts, puertos, prefijos de ruta, hosts de redirección o resolución de red privada configurados. Si la política declara autenticación bearer, el flujo de trabajo usa el secreto fijo `OPENCLAW_TRUSTED_PACKAGE_TOKEN`; las credenciales incrustadas en la URL todavía se rechazan.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de flujo de trabajo/arnés de confianza que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits de origen de confianza más antiguos sin ejecutar lógica antigua de flujos de trabajo.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de release de Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad en vivo de ClawHub. El lane opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, con la ruta de especificación npm publicada conservada para dispatches independientes.

Para la política dedicada de pruebas de actualización y plugins, incluidos comandos locales,
lanes de Docker, entradas de Aceptación de paquetes, valores predeterminados de release y triaje de fallos,
consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de release llaman a Aceptación de paquetes con `source=artifact`, el artefacto de paquete de release preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` y `telegram_mode=mock-openai`. Esto mantiene la migración de paquetes, la actualización, la instalación de Skills de ClawHub en vivo, la limpieza de dependencias obsoletas de plugins, la reparación de instalación de plugins configurados, los plugins sin conexión, la actualización de plugins y la prueba de Telegram sobre el mismo tarball de paquete resuelto. Define `release_package_spec` en Validación de release completa u OpenClaw Release Checks después de publicar una beta para ejecutar la misma matriz contra el paquete npm enviado sin recompilar; define `package_acceptance_package_spec` solo cuando Aceptación de paquetes necesite un paquete diferente al del resto de la validación de release. Las comprobaciones de release entre sistemas operativos aún cubren onboarding, instalador y comportamiento de plataforma específicos de cada sistema operativo; la validación de producto de paquete/actualización debería empezar con Aceptación de paquetes. El lane Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución en la ruta de release bloqueante. En Aceptación de paquetes, el tarball resuelto `package-under-test` siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de fallback, con valor predeterminado `openclaw@latest`; los comandos de repetición de lanes fallidos preservan esa línea base. La Validación de release completa con `run_release_soak=true` o `release_profile=full` define `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para expandirse por las cuatro releases npm estables más recientes, además de releases fijadas de límite de compatibilidad de plugins y fixtures con forma de issue para la configuración de Feishu, archivos bootstrap/persona preservados, instalaciones configuradas del Plugin de OpenClaw, rutas de log con tilde y raíces obsoletas de dependencias de plugins heredados. Las selecciones publicadas multi-línea base de upgrade survivor se dividen por línea base en jobs de runner Docker dirigidos separados. El flujo de trabajo separado `Update Migration` usa el lane Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es una limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de CI de release completa. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquete con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantener un solo lane con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o definir `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El lane publicado configura la línea base con una receta integrada de comando `openclaw config set`, registra los pasos de la receta en `summary.json` y prueba `/healthz`, `/readyz`, además del estado RPC después del inicio de Gateway. Los lanes frescos de paquete e instalador de Windows también verifican que un paquete instalado pueda importar una sobrescritura de control de navegador desde una ruta absoluta sin procesar de Windows. El smoke de turno de agente OpenAI entre sistemas operativos usa por defecto `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definido; de lo contrario, `openai/gpt-5.5`, para que la prueba de instalación y gateway permanezca en un modelo de prueba GPT-5 y evite valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

Aceptación de paquetes tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas QA privadas conocidas en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone ese flag;
- `update-channel-switch` puede podar `patchedDependencies` de pnpm faltantes del fixture git falso derivado del tarball y puede registrar la falta de `update.channel` persistido;
- los smokes de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar la falta de persistencia de registros de instalación del marketplace;
- `plugin-update` puede permitir migración de metadatos de configuración mientras sigue requiriendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir por archivos de sello de metadatos de compilación local que ya se enviaron. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en vez de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquetes, empieza por el resumen de `resolve_package` para confirmar el origen, la versión y el SHA-256 del paquete. Luego inspecciona la ejecución hija de `docker_acceptance` y sus artefactos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, logs de lanes, tiempos de fase y comandos de repetición. Prefiere repetir el perfil de paquete fallido o los lanes Docker exactos en vez de repetir la validación de release completa.

## Smoke de instalación

El flujo de trabajo separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para solicitudes de extracción que tocan superficies de Docker/paquetes, cambios de paquete/manifiesto de Plugin incluido, o superficies centrales de Plugin/canal/Gateway/SDK de Plugin que ejercitan los trabajos de smoke de Docker. Los cambios de Plugin incluido solo de código fuente, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida compila una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agentes en workspace compartido, ejecuta el e2e de gateway-network de contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil Docker acotado de Plugin incluido bajo un timeout agregado de comando de 240 segundos (cada ejecución de Docker de escenario se limita por separado).
- **Ruta completa** mantiene la cobertura de instalación de paquetes QR y Docker/actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de lanzamiento de workflow-call y solicitudes de extracción que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen de smoke del Dockerfile raíz de GHCR para el SHA objetivo, y luego ejecuta instalación de paquete QR, smokes de Dockerfile raíz/Gateway, smokes de instalador/actualización y el E2E rápido de Docker de Plugin incluido como trabajos separados para que el trabajo del instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance cambiado solicitaría cobertura completa en un push, el workflow mantiene el smoke rápido de Docker y deja el smoke completo de instalación para la validación nocturna o de lanzamiento.

El smoke lento de proveedor de imagen con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero las solicitudes de extracción y los pushes a `main` no. La CI normal de PR aún ejecuta la vía rápida de regresión del lanzador Bun para cambios relevantes para Node. Las pruebas de Docker de QR e instalador mantienen sus propios Dockerfiles centrados en instalación.

## E2E local de Docker

`pnpm test:docker:all` precompila una imagen compartida de pruebas live, empaqueta OpenClaw una vez como tarball de npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner básico de Node/Git para vías de instalador/actualización/dependencias de Plugin;
- una imagen funcional que instala el mismo tarball en `/app` para vías de funcionalidad normal.

Las definiciones de vías de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`, y el runner solo ejecuta el plan seleccionado. El planificador selecciona la imagen por vía con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta vías con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variable                               | Predeterminado | Propósito                                                                                     |
| -------------------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Conteo de slots del pool principal para vías normales.                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Conteo de slots del pool final sensible al proveedor.                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de vías live concurrentes para que los proveedores no apliquen throttling.             |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 5              | Límite de vías concurrentes de instalación npm.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de vías multiservicio concurrentes.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de vías para evitar tormentas de creación del daemon Docker; establece `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Timeout de reserva por vía (120 minutos); las vías live/final seleccionadas usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin definir    | `1` imprime el plan del planificador sin ejecutar vías.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin definir    | Lista exacta de vías separadas por comas; omite el smoke de limpieza para que los agentes puedan reproducir una vía fallida. |

Una vía más pesada que su límite efectivo aún puede iniciar desde un pool vacío y luego se ejecuta sola hasta que libera capacidad. El agregado local hace preflights de Docker, elimina contenedores E2E obsoletos de OpenClaw, emite el estado de vías activas, persiste tiempos de vías para ordenar de más largas a más cortas y, de forma predeterminada, deja de programar nuevas vías en pool después del primer fallo.

### Workflow live/E2E reutilizable

El workflow live/E2E reutilizable pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen live, vía y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. O empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual, o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y sube imágenes E2E de Docker bare/functional de GHCR etiquetadas por digest de paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita vías con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de recompilar. Los pulls de imágenes Docker se reintentan con un timeout acotado de 180 segundos por intento para que un stream de registro/caché bloqueado reintente rápido en vez de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de lanzamiento

La cobertura Docker de lanzamiento ejecuta trabajos fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento solo descargue el tipo de imagen que necesita y ejecute varias vías mediante el mismo planificador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos Docker de lanzamiento actuales son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y `plugins-runtime-install-a` hasta `plugins-runtime-install-h`. `package-update-openai` incluye la vía live del paquete del Plugin Codex, que instala el paquete candidato de OpenClaw, instala el Plugin Codex desde `codex_plugin_spec` o un tarball de la misma ref con aprobación explícita de instalación de CLI de Codex, ejecuta el preflight de CLI de Codex y luego ejecuta varios turnos de agente de OpenClaw en la misma sesión contra OpenAI. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de Plugin/runtime. El alias de vía `install-e2e` sigue siendo el alias agregado de repetición manual para ambas vías de instalador de proveedor.

OpenWebUI se pliega en `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y mantiene un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Las vías de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento sube `.artifacts/docker-tests/` con logs de vías, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del planificador, tablas de vías lentas y comandos de repetición por vía. La entrada `docker_lanes` del workflow ejecuta las vías seleccionadas contra las imágenes preparadas en lugar de los trabajos de fragmentos, lo que mantiene la depuración de vías fallidas acotada a un trabajo Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si una vía seleccionada es una vía Docker live, el trabajo dirigido compila localmente la imagen de pruebas live para esa repetición. Los comandos generados de repetición por vía de GitHub incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imágenes preparadas cuando esos valores existen, para que una vía fallida pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El workflow live/E2E programado ejecuta diariamente la suite Docker completa de release-path.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un workflow separado despachado por `Full Release Validation` o por un operador explícito. Las solicitudes de extracción normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de Plugins incluidos entre ocho workers de extensiones; esos trabajos de shard de extensiones ejecutan hasta dos grupos de configuración de Plugin a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de Plugins con muchas importaciones no creen trabajos de CI adicionales. La ruta de prelanzamiento Docker exclusiva de lanzamiento agrupa vías Docker dirigidas en grupos pequeños para evitar reservar decenas de runners para trabajos de uno a tres minutos. El workflow también sube un artefacto informativo `plugin-inspector-advisory` desde `@openclaw/plugin-inspector`; los hallazgos del inspector son entrada de triage y no cambian la puerta bloqueante de Plugin Prerelease.

## QA Lab

QA Lab tiene vías de CI dedicadas fuera del workflow principal con alcance inteligente. La paridad agéntica está anidada bajo los arneses amplios de QA y lanzamiento, no como un workflow independiente de PR. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba acompañar una ejecución amplia de validación.

- El workflow `QA-Lab - All Lanes` se ejecuta cada noche en `main` y por despacho manual; distribuye en paralelo la vía de paridad mock, la vía live de Matrix y las vías live de Telegram y Discord como trabajos paralelos. Los trabajos live usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de lanzamiento ejecutan vías live de transporte de Matrix y Telegram con el proveedor mock determinista y modelos calificados como mock (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato de canal quede aislado de la latencia del modelo live y del arranque normal del Plugin de proveedor. El Gateway de transporte live desactiva la búsqueda de memoria porque la paridad QA cubre el comportamiento de memoria por separado; la conectividad de proveedor está cubierta por las suites separadas de modelo live, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de lanzamiento, añadiendo `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del workflow siguen siendo `all`; el despacho manual `matrix_profile=all` siempre divide la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta las vías críticas de lanzamiento de QA Lab antes de la aprobación del lanzamiento; su puerta de paridad QA ejecuta los packs candidato y baseline como trabajos de vía paralelos, luego descarga ambos artefactos en un pequeño trabajo de informe para la comparación final de paridad.

Para PRs normales, sigue la evidencia de CI/comprobación con alcance en lugar de tratar la paridad como un estado requerido.

## CodeQL

El workflow `CodeQL` es intencionalmente un escáner de seguridad estrecho de primera pasada, no el barrido completo del repositorio. Las ejecuciones diarias, manuales y de guardia de solicitudes de extracción no borrador escanean el código de workflows de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La guardia de solicitudes de extracción se mantiene ligera: solo inicia para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages`, `scripts`, `src` o rutas runtime de Plugins incluidos que poseen procesos, y ejecuta la misma matriz de seguridad de alta confianza que el workflow programado. CodeQL de Android y macOS quedan fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secretos, sandbox, Cron y línea base de Gateway                                                                               |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales centrales, además del runtime de plugins de canal, Gateway, Plugin SDK, secretos y puntos de contacto de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies centrales de SSRF, análisis de IP, guardia de red, web-fetch y política SSRF del Plugin SDK                            |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, ayudantes de ejecución de procesos, entrega saliente y compuertas de ejecución de herramientas de agente            |
| `/codeql-security-high/process-exec-boundary`     | Shell local, ayudantes de creación de procesos, runtimes de plugins empaquetados que poseen subprocesos y pegamento de scripts de flujo de trabajo |
| `/codeql-security-high/plugin-trust-boundary`     | Instalación de Plugin, cargador, manifiesto, registro, instalación del gestor de paquetes, carga de código fuente y superficies de confianza del contrato de paquete del Plugin SDK |

### Fragmentos de seguridad específicos de la plataforma

- `CodeQL Android Critical Security` — fragmento programado de seguridad de Android. Compila manualmente la aplicación de Android para CodeQL en el runner Linux de Blacksmith más pequeño aceptado por la comprobación de cordura del flujo de trabajo. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento de seguridad de macOS semanal/manual. Compila manualmente la aplicación de macOS para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el runtime incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento no relacionado con seguridad equivalente. Ejecuta solo consultas de calidad de JavaScript/TypeScript de severidad de error y no relacionadas con seguridad sobre superficies estrechas de alto valor en runners Linux alojados en GitHub para que los escaneos de calidad no consuman el presupuesto de registro de runners de Blacksmith. Su guardia para solicitudes de extracción es intencionadamente más pequeña que el perfil programado: las solicitudes de extracción que no son borradores solo ejecutan los fragmentos coincidentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de comandos de agente/ejecución de modelos/herramientas y despacho de respuestas, código de esquema/migración/IO de configuración, código de auth/secretos/sandbox/seguridad, runtime de canales centrales y plugins de canal empaquetados, método de servidor/protocolo de Gateway, pegamento de runtime/SDK de memoria, MCP/proceso/entrega saliente, runtime de proveedor/catálogo de modelos, diagnósticos de sesión/colas de entrega, cargador de plugins, Plugin SDK/contrato de paquete o runtime de respuestas del Plugin SDK. Los cambios de configuración de CodeQL y de flujo de trabajo de calidad ejecutan los doce fragmentos de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son ganchos de enseñanza/iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secretos, sandbox, Cron y código de límite de seguridad de Gateway                                                                                         |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuración, migración, normalización y contratos de IO                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo de Gateway y contratos de métodos de servidor                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canales centrales y plugins de canal empaquetados                                                                                  |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelo/proveedor, despacho y colas de respuesta automática, y contratos de runtime del plano de control de ACP                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, ayudantes de supervisión de procesos y contratos de entrega saliente                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas del runtime de memoria, alias de memoria del Plugin SDK, pegamento de activación del runtime de memoria y comandos doctor de memoria |
| `/codeql-critical-quality/session-diagnostics-boundary` | Componentes internos de la cola de respuestas, colas de entrega de sesión, ayudantes de vinculación/entrega de sesión saliente, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del Plugin SDK, ayudantes de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y ayudantes de vinculación de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, auth y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros de web/búsqueda/fetch/embeddings |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de Control UI, persistencia local, flujos de control de Gateway y contratos de runtime del plano de control de tareas                                    |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime centrales de web fetch/búsqueda, IO de medios, comprensión de medios, generación de imágenes y generación de medios                         |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y punto de entrada del Plugin SDK                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente publicado del lado del paquete del Plugin SDK y ayudantes del contrato de paquete de plugins                                                        |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin ocultar la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins empaquetados debe volver a añadirse como trabajo de seguimiento acotado o fragmentado solo después de que los perfiles estrechos tengan runtime y señal estables.

## Flujos de trabajo de mantenimiento

### Docs Agent

El flujo de trabajo `Docs Agent` es un carril de mantenimiento de Codex basado en eventos para mantener la documentación existente alineada con los cambios incorporados recientemente. No tiene programación pura: una ejecución correcta de CI por push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por ejecución de flujo de trabajo se omiten cuando `main` ha avanzado o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen del Docs Agent no omitido anterior hasta el `main` actual, de modo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Test Performance Agent

El flujo de trabajo `Test Performance Agent` es un carril de mantenimiento de Codex basado en eventos para pruebas lentas. No tiene programación pura: una ejecución correcta de CI por push no bot en `main` puede activarlo, pero se omite si otra invocación por ejecución de flujo de trabajo ya se ejecutó o está en ejecución ese día UTC. El despacho manual omite esa compuerta de actividad diaria. El carril construye un informe de rendimiento de Vitest agrupado de la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de la suite completa y rechaza los cambios que reduzcan el recuento base de pruebas que pasan. El informe agrupado registra el tiempo de reloj por configuración y el RSS máximo en Linux y macOS, por lo que la comparación antes/después muestra deltas de memoria de pruebas junto a deltas de duración. Si la línea base tiene pruebas fallidas, Codex solo puede corregir fallos obvios y el informe posterior a la acción del agente de la suite completa debe pasar antes de que se confirme nada. Cuando `main` avanza antes de que llegue el push del bot, el carril rebasea el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad drop-sudo que el agente de documentación.

### PR duplicadas después del merge

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual de mantenedor para limpieza de duplicados posterior a la integración. Por defecto es dry-run y solo cierra las PR listadas explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que la PR integrada esté mergeada y que cada duplicado tenga un issue referenciado compartido o hunks modificados solapados.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Compuertas de comprobación locales y enrutamiento de cambios

La lógica local de carriles modificados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa compuerta de comprobación local es más estricta sobre límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan typecheck de producción del núcleo y pruebas del núcleo, además de lint/guardias del núcleo;
- los cambios solo de pruebas del núcleo ejecutan únicamente typecheck de pruebas del núcleo, además de lint del núcleo;
- los cambios de producción de extensiones ejecutan typecheck de producción y pruebas de extensiones, además de lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan typecheck de pruebas de extensiones, además de lint de extensiones;
- los cambios públicos del Plugin SDK o del contrato de plugins se expanden a typecheck de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones con Vitest siguen siendo trabajo de pruebas explícito);
- los incrementos de versión solo de metadatos de lanzamiento ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todos los carriles de comprobación.

El enrutamiento local de pruebas modificadas vive en `scripts/test-projects.test-support.mjs` y es intencionadamente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren asignaciones explícitas, luego pruebas hermanas y dependientes del grafo de imports. La configuración compartida de entrega de salas de grupo es una de las asignaciones explícitas: los cambios en la configuración de respuesta visible para el grupo, el modo de entrega de respuestas de origen o el prompt del sistema de herramientas de mensajes se enrutan por las pruebas centrales de respuesta, además de regresiones de entrega de Discord y Slack, para que un cambio compartido de valor predeterminado falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el arnés como para que el conjunto barato asignado no sea un proxy fiable.

## Validación con Testbox

Crabbox es el wrapper de caja remota propiedad del repositorio para pruebas de Linux de mantenedores. Úsalo
desde la raíz del repositorio cuando una comprobación sea demasiado amplia para un bucle de edición local, cuando importe
la paridad con CI, o cuando la prueba necesite secretos, Docker, carriles de paquetes,
cajas reutilizables o registros remotos. El backend normal de OpenClaw es
`blacksmith-testbox`; la capacidad propia de AWS/Hetzner es una alternativa para interrupciones de Blacksmith,
problemas de cuota o pruebas explícitas con capacidad propia.

Las ejecuciones de Blacksmith respaldadas por Crabbox calientan, reclaman, sincronizan, ejecutan, informan y limpian
Testboxes de un solo uso. La comprobación de cordura de sincronización integrada falla rápido cuando desaparecen archivos
raíz requeridos como `pnpm-lock.yaml` o cuando `git status --short`
muestra al menos 200 eliminaciones rastreadas. Para PRs intencionales de eliminación masiva, establece
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para el comando remoto.

Crabbox también termina una invocación local de la CLI de Blacksmith que permanece en la
fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Establece
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para desactivar esa protección, o usa un valor mayor
en milisegundos para diffs locales inusualmente grandes.

Antes de una primera ejecución, comprueba el wrapper desde la raíz del repositorio:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El wrapper del repositorio rechaza un binario de Crabbox obsoleto que no anuncie `blacksmith-testbox`. Pasa el proveedor explícitamente aunque `.crabbox.yaml` tenga valores predeterminados de nube propia. En worktrees de Codex o checkouts enlazados/dispersos, evita el script local `pnpm crabbox:run` porque pnpm puede reconciliar dependencias antes de que Crabbox arranque; invoca directamente el wrapper de node en su lugar:

```bash
node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox --timing-json --shell -- "pnpm test <path-or-filter>"
```

Las ejecuciones respaldadas por Blacksmith requieren Crabbox 0.22.0 o posterior para que el wrapper obtenga el comportamiento actual de sincronización, cola y limpieza de Testbox. Al usar el checkout hermano, reconstruye el binario local ignorado antes de trabajos de temporización o prueba:

```bash
version="$(git -C ../crabbox describe --tags --always --dirty | sed 's/^v//')" \
  && go build -C ../crabbox -trimpath -ldflags "-s -w -X github.com/openclaw/crabbox/internal/cli.version=${version}" -o bin/crabbox ./cmd/crabbox
```

Gate de cambios:

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
resultado del comando. La ejecución enlazada de GitHub Actions es responsable de la hidratación y el keepalive; puede
terminar como `cancelled` cuando el Testbox se detiene externamente después de que el comando SSH
ya haya devuelto. Trátalo como un artefacto de limpieza/estado salvo que
el `exitCode` del wrapper sea distinto de cero o que la salida del comando muestre una prueba fallida.
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
solo para diagnósticos como `list`, `status` y limpieza. Corrige la
ruta de Crabbox antes de tratar una ejecución directa de Blacksmith como prueba de mantenedor.

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan pero los nuevos
calentamientos quedan en `queued` sin IP ni URL de ejecución de Actions después de un par de minutos,
trátalo como presión del proveedor, la cola, la facturación o el límite de organización de Blacksmith. Detén los
ids en cola que creaste, evita iniciar más Testboxes y mueve la prueba a la
ruta de capacidad propia de Crabbox que sigue mientras alguien revisa el panel de Blacksmith,
la facturación y los límites de la organización.

Escala a capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, carezca del entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Bajo presión de AWS, evita `class=beast` salvo que la tarea realmente necesite CPU de clase 48xlarge. Una solicitud `beast` empieza en 192 vCPU y es la forma más fácil de activar límites regionales de EC2 Spot u On-Demand Standard. El `.crabbox.yaml` propiedad del repositorio usa por defecto `standard`, varias regiones de capacidad y `capacity.hints: true` para que los arrendamientos negociados de AWS impriman la región/mercado seleccionados, la presión de cuota, la alternativa Spot y advertencias de clase de alta presión. Usa `fast` para comprobaciones amplias más pesadas, `large` solo después de que standard/fast no sean suficientes, y `beast` solo para carriles excepcionales ligados a CPU, como matrices Docker de suite completa o todos los plugins, validación explícita de release/bloqueador, o perfilado de rendimiento con muchos núcleos. No uses `beast` para `pnpm check:changed`, pruebas enfocadas, trabajo solo de docs, lint/typecheck ordinario, repros E2E pequeños o triaje de interrupciones de Blacksmith. Usa `--market on-demand` para diagnóstico de capacidad, de modo que la fluctuación del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` controla los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para carriles de nube propia. Excluye el `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos remotos de Git en lugar de sincronizar remotos y almacenes de objetos locales de mantenedor, y excluye artefactos locales de runtime/build que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` controla el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y el traspaso de entorno no secreto para comandos de nube propia `crabbox run --id <cbx_id>`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
