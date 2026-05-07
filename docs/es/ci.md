---
read_when:
    - Necesita comprender por qué un trabajo de CI se ejecutó o no
    - Estás depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o una nueva ejecución de validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de la actividad de GitHub
summary: Grafo de trabajos de CI, controles de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-05-07T01:50:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada envío a `main` y en cada solicitud de extracción. El trabajo `preflight` clasifica la diferencia y desactiva los carriles costosos cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y despliegan el grafo completo para candidatos de versión y validación amplia. Los carriles de Android siguen siendo optativos mediante `include_android`. La cobertura de Plugin solo para versiones vive en el flujo de trabajo separado [`Prelanzamiento de Plugin`](#plugin-prerelease) y solo se ejecuta desde [`Validación de versión completa`](#full-release-validation) o una ejecución manual explícita.

## Resumen del pipeline

| Trabajo                          | Propósito                                                                                                 | Cuándo se ejecuta                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detectar cambios solo de documentación, alcances cambiados, extensiones cambiadas y compilar el manifiesto de CI | Siempre en envíos y PR que no son borradores |
| `security-scm-fast`              | Detección de claves privadas y auditoría de flujos de trabajo mediante `zizmor`                            | Siempre en envíos y PR que no son borradores |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias contra avisos de npm                                 | Siempre en envíos y PR que no son borradores |
| `security-fast`                  | Agregado requerido para los trabajos rápidos de seguridad                                                  | Siempre en envíos y PR que no son borradores |
| `check-dependencies`             | Pasada de Knip solo para dependencias de producción más la guarda de la lista de permitidos de archivos no usados | Cambios relevantes para Node       |
| `build-artifacts`                | Compilar `dist/`, Control UI, comprobaciones de artefactos compilados y artefactos descendentes reutilizables | Cambios relevantes para Node       |
| `checks-fast-core`               | Carriles rápidos de corrección en Linux, como comprobaciones de Plugin incluido/contrato de Plugin/protocolo | Cambios relevantes para Node       |
| `checks-fast-contracts-channels` | Comprobaciones fragmentadas de contratos de canales con un resultado de comprobación agregado estable       | Cambios relevantes para Node       |
| `checks-node-core-test`          | Fragmentos de pruebas de Node del núcleo, excluyendo carriles de canal, incluidos, contrato y extensión     | Cambios relevantes para Node       |
| `check`                          | Equivalente fragmentado de la puerta local principal: tipos de producción, lint, guardas, tipos de prueba y smoke estricto | Cambios relevantes para Node       |
| `check-additional`               | Arquitectura, deriva fragmentada de límites/prompts, guardas de extensión, límite de paquete y vigilancia de Gateway | Cambios relevantes para Node       |
| `build-smoke`                    | Pruebas smoke de la CLI compilada y smoke de memoria de inicio                                             | Cambios relevantes para Node       |
| `checks`                         | Verificador para pruebas de canales de artefactos compilados                                               | Cambios relevantes para Node       |
| `checks-node-compat-node22`      | Carril de compilación y smoke de compatibilidad con Node 22                                                | Ejecución manual de CI para versiones |
| `check-docs`                     | Formato, lint y comprobaciones de enlaces rotos de documentación                                           | Documentación cambiada             |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                                          | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Pruebas específicas de Windows de procesos/rutas más regresiones compartidas de especificadores de importación en runtime | Cambios relevantes para Windows    |
| `macos-node`                     | Carril de pruebas TypeScript en macOS usando los artefactos compilados compartidos                         | Cambios relevantes para macOS      |
| `macos-swift`                    | Lint, compilación y pruebas de Swift para la app de macOS                                                  | Cambios relevantes para macOS      |
| `android`                        | Pruebas unitarias de Android para ambos sabores más una compilación de APK debug                           | Cambios relevantes para Android    |
| `test-performance-agent`         | Optimización diaria de pruebas lentas de Codex después de actividad de confianza                           | Éxito de CI principal o ejecución manual |
| `openclaw-performance`           | Informes de rendimiento diarios/bajo demanda del runtime Kova con carriles de proveedor simulado, perfil profundo y GPT 5.4 en vivo | Ejecución programada y manual      |

## Orden de fallo rápido

1. `preflight` decide qué carriles existen en absoluto. La lógica `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de artefactos y matriz de plataformas.
3. `build-artifacts` se solapa con los carriles rápidos de Linux para que los consumidores descendentes puedan comenzar en cuanto la compilación compartida esté lista.
4. Los carriles más pesados de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un envío más nuevo a la misma PR o referencia `main`. Trátalo como ruido de CI salvo que la ejecución más reciente para la misma referencia también esté fallando. Las comprobaciones agregadas de fragmentos usan `!cancelled() && always()` para que sigan informando fallos normales de fragmentos, pero no se encolen después de que todo el flujo de trabajo ya haya sido reemplazado. La clave automática de concurrencia de CI está versionada (`CI-v7-*`), por lo que un proceso zombi del lado de GitHub en un grupo de cola antiguo no puede bloquear indefinidamente ejecuciones más nuevas de main. Las ejecuciones manuales de la suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

El trabajo `ci-timings-summary` sube un artefacto compacto `ci-timings-summary` para cada ejecución de CI que no sea borrador. Registra tiempo total, tiempo de cola, trabajos más lentos y trabajos fallidos para la ejecución actual, de modo que las comprobaciones de salud de CI no necesiten extraer repetidamente toda la carga de Actions.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. La ejecución manual omite la detección de alcance cambiado y hace que el manifiesto de preflight actúe como si cada área con alcance hubiera cambiado.

- **Las ediciones del flujo de trabajo de CI** validan el grafo de CI de Node más el lint de flujos de trabajo, pero no fuerzan por sí solas compilaciones nativas de Windows, Android o macOS; esos carriles de plataforma siguen limitados a cambios en el código fuente de plataforma.
- **Las ediciones solo de enrutamiento de CI, ediciones seleccionadas de fixtures baratos de pruebas del núcleo y ediciones estrechas de helpers/enrutamiento de pruebas de contrato de Plugin** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una sola tarea `checks-fast-core`. Esa ruta omite artefactos de compilación, compatibilidad con Node 22, contratos de canales, fragmentos completos del núcleo, fragmentos de Plugins incluidos y matrices de guardas adicionales cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Las comprobaciones de Node en Windows** se limitan a wrappers específicos de Windows de procesos/rutas, helpers de ejecución de npm/pnpm/UI, configuración del gestor de paquetes y las superficies del flujo de trabajo de CI que ejecutan ese carril; los cambios no relacionados de código fuente, Plugin, smoke de instalación y solo de pruebas permanecen en los carriles de Node en Linux.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo se mantenga pequeño sin reservar corredores en exceso: los contratos de canales se ejecutan como tres fragmentos ponderados, los carriles rápidos/de soporte de unidades del núcleo se ejecutan por separado, la infraestructura de runtime del núcleo se divide entre fragmentos de estado, proceso/configuración, cron y compartidos, la respuesta automática se ejecuta como trabajadores equilibrados (con el subárbol de respuestas dividido en fragmentos de ejecutor de agente, dispatch y comandos/enrutamiento de estado), y las configuraciones agénticas de Gateway/servidor se dividen entre carriles de chat/auth/modelo/http-plugin/runtime/inicio en lugar de esperar artefactos compilados. Las pruebas amplias de navegador, QA, medios y Plugins varios usan sus configuraciones dedicadas de Vitest en lugar del comodín compartido de Plugin. Los fragmentos de patrones de inclusión registran entradas de tiempos usando el nombre del fragmento de CI, de modo que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un fragmento filtrado. `check-additional` mantiene juntos el trabajo de compilación/canario de límite de paquetes y separa la arquitectura de topología de runtime de la cobertura de vigilancia de Gateway; la lista de guardas de límites se reparte en cuatro fragmentos de matriz, cada uno ejecutando guardas independientes seleccionadas en paralelo e imprimiendo tiempos por comprobación. La costosa comprobación de deriva de snapshots de prompts de la ruta feliz de Codex se ejecuta solo para CI manual y para cambios que afectan prompts, de modo que los cambios normales no relacionados de Node no esperen a la generación fría de snapshots de prompts mientras la deriva de prompts sigue fijada a la PR que la causó; la misma bandera omite la generación de Vitest de snapshots de prompts dentro del fragmento de límite de soporte del núcleo de artefactos compilados. La vigilancia de Gateway, las pruebas de canales y el fragmento de límite de soporte del núcleo se ejecutan en paralelo dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén compilados.

Android CI ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego compila el APK debug de Play. El sabor de terceros no tiene un conjunto de fuentes ni manifiesto separado; su carril de pruebas unitarias aún compila el sabor con las banderas BuildConfig de SMS/registro de llamadas, evitando a la vez un trabajo duplicado de empaquetado de APK debug en cada envío relevante para Android.

El fragmento `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una pasada de Knip solo para dependencias de producción fijada a la última versión de Knip, con la edad mínima de publicación de pnpm desactivada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos de producción no usados de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. La guarda de archivos no usados falla cuando una PR agrega un nuevo archivo no usado sin revisar o deja una entrada obsoleta en la lista de permitidos, preservando a la vez superficies intencionales de Plugin dinámico, generadas, de compilación, pruebas en vivo y puente de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado de destino desde la actividad del repositorio de OpenClaw hacia ClawSweeper. No clona ni ejecuta código de solicitudes de extracción no confiables. El flujo de trabajo crea un token de GitHub App a partir de `CLAWSWEEPER_APP_PRIVATE_KEY` y luego envía cargas compactas de `repository_dispatch` a `openclaw/clawsweeper`.

El flujo de trabajo tiene cuatro carriles:

- `clawsweeper_item` para solicitudes exactas de revisión de incidencias y solicitudes de extracción;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de incidencias;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en envíos a `main`;
- `github_activity` para actividad general de GitHub que el agente de ClawSweeper puede inspeccionar.

El carril `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando están presentes. Evita intencionalmente reenviar el cuerpo completo del Webhook. El flujo de trabajo receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente de ClawSweeper.

La actividad general es observación, no entrega predeterminada. El agente de ClawSweeper recibe el destino de Discord en su prompt y debe publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Las aperturas rutinarias, ediciones, ruido de bots, ruido de Webhook duplicado y tráfico normal de revisión deben dar como resultado `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisión, nombres de ramas y mensajes de commit de GitHub como datos no confiables en toda esta ruta. Son entradas para resumen y triage, no instrucciones para el flujo de trabajo ni para el runtime del agente.

## Despachos manuales

Los despachos manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de todos los lanes con alcance que no sean Android: shards de Linux Node, shards de plugins incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de docs, Python skills, Windows, macOS y la i18n de Control UI. Los despachos manuales independientes de CI ejecutan solo Android con `include_android=true`; el paraguas completo de release habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prerelease de plugins, el shard `agentic-plugins` exclusivo de release, el barrido completo por lotes de extensiones y los lanes de Docker de prerelease de plugins se excluyen de CI. La suite de prerelease de Docker se ejecuta solo cuando `Full Release Validation` despacha el flujo de trabajo `Plugin Prerelease` separado con la puerta de validación de release habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidata a release no sea cancelada por otra ejecución de push o PR en la misma ref. La entrada opcional `target_ref` permite que un llamador de confianza ejecute ese grafo contra una rama, etiqueta o SHA completo de commit mientras usa el archivo de flujo de trabajo de la ref de despacho seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Runner                           | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, trabajos de seguridad rápidos y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidos, comprobaciones fragmentadas de contratos de canales, shards de `check` excepto lint, agregados de `check-additional`, verificadores agregados de pruebas Node, comprobaciones de docs, Python skills, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu alojado en GitHub para que la matriz de Blacksmith pueda ponerse en cola antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, shards de extensiones de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                    |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, shards de pruebas Linux Node, shards de pruebas de plugins incluidos, shards de `check-additional`, `android`                                                                                                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el tiempo en cola de 32 vCPU costaba más de lo que ahorraba)                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |

La CI del repositorio canónico mantiene Blacksmith como la ruta de runner predeterminada. Durante `preflight`, `scripts/ci-runner-labels.mjs` comprueba ejecuciones recientes en cola y en progreso de Actions para trabajos Blacksmith en cola. Si una etiqueta específica de Blacksmith ya tiene trabajos en cola, los trabajos posteriores que usarían esa etiqueta exacta vuelven al runner alojado en GitHub correspondiente (`ubuntu-24.04`, `windows-2025` o `macos-latest`) solo para esa ejecución. Otros tamaños de Blacksmith en la misma familia de SO permanecen en sus etiquetas principales. Si la sonda de API falla, no se aplica ningún fallback.

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
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Rendimiento de OpenClaw

`OpenClaw Performance` es el flujo de trabajo de rendimiento de producto/runtime. Se ejecuta a diario en `main` y puede despacharse manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

El despacho manual normalmente mide el rendimiento de la ref del flujo de trabajo. Define `target_ref` para medir una etiqueta de release u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros latest se indexan por la ref probada, y cada `index.md` registra la ref/SHA probada, la ref/SHA del flujo de trabajo, la ref de Kova, el perfil, el modo de autenticación del lane, el modelo, el recuento de repeticiones y los filtros de escenario.

El flujo de trabajo instala OCM desde una release fijada y Kova desde `openclaw/Kova` en la entrada `kova_ref` fijada, y luego ejecuta tres lanes:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfilado de CPU/heap/trazas para hotspots de arranque, gateway y turnos de agente.
- `live-gpt54`: un turno real de agente OpenAI `openai/gpt-5.4`, omitido cuando `OPENAI_API_KEY` no está disponible.

El lane mock-provider también ejecuta sondas de código fuente nativas de OpenClaw después del pase de Kova: tiempos de arranque de Gateway y memoria en casos de inicio predeterminado, con hook y con 50 plugins; bucles hello repetidos de `channel-chat-baseline` con mock-OpenAI; y comandos de arranque de CLI contra el Gateway iniciado. El resumen Markdown de la sonda de código fuente vive en `source/index.md` dentro del paquete de informe, con el JSON sin procesar junto a él.

Cada lane sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sonda de código fuente en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la ref probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación completa de release

`Full Release Validation` es el flujo de trabajo paraguas manual para "ejecutarlo todo antes de la release". Acepta una rama, etiqueta o SHA completo de commit, despacha el flujo de trabajo manual `CI` con ese objetivo, despacha `Plugin Prerelease` para pruebas exclusivas de release de plugin/paquete/estáticas/Docker, y despacha `OpenClaw Release Checks` para install smoke, aceptación de paquetes, comprobaciones de paquetes entre SO, paridad de QA Lab, Matrix y lanes de Telegram. Las ejecuciones estables/predeterminadas mantienen la cobertura exhaustiva live/E2E y de ruta de release Docker detrás de `run_release_soak=true`; `release_profile=full` fuerza esa cobertura de soak para que la validación amplia de advisory siga siendo amplia. Con `rerun_group=all` y `release_profile=full`, también ejecuta `NPM Telegram Beta E2E` contra el artefacto `release-package-under-test` de las comprobaciones de release. Después de publicar, pasa `npm_telegram_package_spec` para volver a ejecutar el mismo lane de paquete de Telegram contra el paquete npm publicado.

Consulta [Validación completa de release](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos del flujo de trabajo, las diferencias de perfil, los artefactos y
los identificadores de reejecución enfocada.

`OpenClaw Release Publish` es el flujo de trabajo manual de release con mutaciones. Despáchalo
desde `release/YYYY.M.D` o `main` después de que exista la etiqueta de release y de que el
preflight npm de OpenClaw haya tenido éxito. Verifica `pnpm plugins:sync:check`,
despacha `Plugin NPM Release` para todos los paquetes de plugins publicables, despacha
`Plugin ClawHub Release` para el mismo SHA de release, y solo entonces despacha
`OpenClaw NPM Release` con el `preflight_run_id` guardado.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para obtener prueba de un commit fijado en una rama que cambia con rapidez, usa el auxiliar en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las referencias de despacho de flujos de trabajo de GitHub deben ser ramas o etiquetas, no SHA de commits sin procesar. El
auxiliar empuja una rama temporal `release-ci/<sha>-...` en el SHA objetivo,
despacha `Full Release Validation` desde esa referencia fijada, verifica que cada
`headSha` de flujo de trabajo hijo coincida con el objetivo, y elimina la rama temporal cuando la
ejecución se completa. El verificador general también falla si algún flujo de trabajo hijo se ejecutó en un
SHA diferente.

`release_profile` controla la amplitud de pruebas en vivo/proveedor pasada a las comprobaciones de lanzamiento. Los
flujos de trabajo de lanzamiento manuales tienen `stable` como valor predeterminado; usa `full` solo cuando
quieras intencionalmente la matriz amplia de proveedores/medios consultiva. `run_release_soak`
controla si las comprobaciones de lanzamiento estables/predeterminadas ejecutan el remojo exhaustivo en vivo/E2E y
de ruta de lanzamiento Docker; `full` fuerza la activación del remojo.

- `minimum` conserva los carriles más rápidos críticos para el lanzamiento de OpenAI/núcleo.
- `stable` añade el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedores/medios.

El paraguas registra los identificadores de ejecución hijos despachados, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y anexa tablas de trabajos más lentos para cada ejecución hija. Si un flujo de trabajo hijo se vuelve a ejecutar y queda verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado del paraguas y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de lanzamiento, `ci` solo para el hijo normal de CI completo, `plugin-prerelease` solo para el hijo de prelanzamiento de plugins, `release-checks` para cada hijo de lanzamiento, o un grupo más específico: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live`, o `npm-telegram` en el paraguas. Esto mantiene acotada la nueva ejecución de una caja de lanzamiento fallida después de una corrección enfocada. Para un carril cross-OS fallido, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos cross-OS largos emiten líneas Heartbeat y los resúmenes de packaged-upgrade incluyen tiempos por fase. Los carriles QA de release-check son consultivos, así que los fallos solo de QA advierten pero no bloquean el verificador de release-check.

`OpenClaw Release Checks` usa la referencia de flujo de trabajo confiable para resolver la referencia seleccionada una vez en un tarball `release-package-under-test`, luego pasa ese artefacto a las comprobaciones cross-OS y Package Acceptance, además del flujo de trabajo Docker de ruta de lanzamiento en vivo/E2E cuando se ejecuta cobertura de remojo. Eso mantiene los bytes del paquete consistentes entre cajas de lanzamiento y evita reempaquetar el mismo candidato en múltiples trabajos hijos.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
sustituyen el paraguas anterior. El monitor padre cancela cualquier flujo de trabajo hijo que
ya haya despachado cuando se cancela el padre, así que una validación más nueva de main
no queda detrás de una ejecución obsoleta de release-check de dos horas. La validación de ramas/etiquetas
de lanzamiento y los grupos de nueva ejecución enfocados mantienen `cancel-in-progress: false`.

## Fragmentos en vivo y E2E

El hijo en vivo/E2E de lanzamiento conserva la cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como fragmentos con nombre mediante `scripts/test-live-shard.mjs` en lugar de un trabajo serial:

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

Eso mantiene la misma cobertura de archivos mientras facilita volver a ejecutar y diagnosticar fallos lentos de proveedores en vivo. Los nombres de fragmentos agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para nuevas ejecuciones manuales de una sola vez.

Los fragmentos nativos de medios en vivo se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el flujo de trabajo `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites en vivo respaldadas por Docker en runners Blacksmith normales; los trabajos de contenedor son el lugar equivocado para lanzar pruebas Docker anidadas.

Los fragmentos en vivo de modelos/backends respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit seleccionado. El flujo de trabajo de lanzamiento en vivo construye y empuja esa imagen una vez, luego los fragmentos de modelo Docker en vivo, Gateway dividido por proveedor, backend de CLI, enlace ACP y arnés Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los fragmentos Docker de Gateway llevan límites explícitos de `timeout` a nivel de script por debajo del tiempo de espera del trabajo de flujo de trabajo, para que un contenedor atascado o una ruta de limpieza fallen rápido en lugar de consumir todo el presupuesto de release-check. Si esos fragmentos reconstruyen independientemente el objetivo Docker de código fuente completo, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo real en compilaciones de imagen duplicadas.

## Aceptación de paquete

Usa `Package Acceptance` cuando la pregunta sea "¿funciona este paquete instalable de OpenClaw como producto?" Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquete valida un único tarball mediante el mismo arnés Docker E2E que los usuarios ejercitan después de instalar o actualizar.

### Trabajos

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test`, e imprime la fuente, la referencia de flujo de trabajo, la referencia de paquete, la versión, SHA-256 y el perfil en el resumen de paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker de resumen de paquete cuando es necesario, y ejecuta los carriles Docker seleccionados contra ese paquete en lugar de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona múltiples `docker_lanes` dirigidos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, luego distribuye esos carriles como trabajos Docker dirigidos en paralelo con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; un despacho independiente de Telegram todavía puede instalar una especificación npm publicada.
4. `summary` falla el flujo de trabajo si falló la resolución del paquete, la aceptación Docker o el carril opcional de Telegram.

### Fuentes candidatas

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest`, o una versión exacta de lanzamiento de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para aceptación de prelanzamiento/estable publicada.
- `source=ref` empaqueta una rama, etiqueta o SHA de commit completo confiable de `package_ref`. El resolvedor obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o una etiqueta de lanzamiento, instala dependencias en un worktree separado, y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` de `artifact_run_id` y `artifact_name`; `package_sha256` es opcional pero debe suministrarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código confiable de flujo de trabajo/arnés que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits de código fuente confiables más antiguos sin ejecutar lógica antigua de flujos de trabajo.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de ruta de lanzamiento Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de plugins sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad en vivo de ClawHub. El carril opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, y la ruta de especificación npm publicada se mantiene para despachos independientes.

Para la política dedicada de pruebas de actualización y plugins, incluidos comandos locales,
carriles Docker, entradas de Package Acceptance, valores predeterminados de lanzamiento y triaje de fallos,
consulta [Probar actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a Package Acceptance con `source=artifact`, el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` y `telegram_mode=mock-openai`. Esto mantiene la migración de paquetes, la actualización, la limpieza de dependencias de plugins obsoletas, la reparación de instalación de plugins configurados, la prueba de plugins sin conexión, plugin-update y Telegram sobre el mismo tarball de paquete resuelto. Configura `package_acceptance_package_spec` en Full Release Validation u OpenClaw Release Checks para ejecutar esa misma matriz contra un paquete npm publicado en lugar del artefacto construido desde SHA. Las comprobaciones de lanzamiento cross-OS todavía cubren la incorporación, el instalador y el comportamiento de plataforma específicos del sistema operativo; la validación de producto de paquete/actualización debe comenzar con Package Acceptance. El carril Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución en la ruta de lanzamiento bloqueante. En Package Acceptance, el tarball resuelto `package-under-test` siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de respaldo, con valor predeterminado `openclaw@latest`; los comandos de nueva ejecución de carriles fallidos conservan esa línea base. Full Release Validation con `run_release_soak=true` o `release_profile=full` configura `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para expandirse por los cuatro lanzamientos npm estables más recientes, además de lanzamientos fijados de límite de compatibilidad de plugins y fixtures con forma de incidencias para configuración de Feishu, archivos bootstrap/persona preservados, instalaciones configuradas de plugins de OpenClaw, rutas de registros con tilde y raíces de dependencias de plugins heredadas obsoletas. Las selecciones multi-línea base de published-upgrade survivor se fragmentan por línea base en trabajos de runner Docker dirigidos separados. El flujo de trabajo separado `Update Migration` usa el carril Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es limpieza exhaustiva de actualización publicada, no amplitud normal de CI de Full Release. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquete con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantener un solo carril con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o configurar `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El carril publicado configura la línea base con una receta integrada de comando `openclaw config set`, registra los pasos de la receta en `summary.json`, y prueba `/healthz`, `/readyz`, además del estado RPC después del inicio de Gateway. Los carriles frescos empaquetado e instalador de Windows también verifican que un paquete instalado pueda importar una anulación de control de navegador desde una ruta absoluta sin procesar de Windows. El smoke cross-OS de turno de agente OpenAI usa `OPENCLAW_CROSS_OS_OPENAI_MODEL` de forma predeterminada cuando está configurado; de lo contrario, `openai/gpt-5.4`, para que la prueba de instalación y Gateway permanezca en un modelo de prueba GPT-5 y evite valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas conocidas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia de `gateway install --wrapper` cuando el paquete no expone esa marca;
- `update-channel-switch` puede podar `pnpm.patchedDependencies` faltantes del fixture git falso derivado del tarball y puede registrar `update.channel` persistido faltante;
- las pruebas smoke de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar que falte la persistencia de registros de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración mientras sigue exigiendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir sobre archivos de sello de metadatos de compilación local que ya se habían distribuido. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

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
  -f package_ref=release/YYYY.M.D \
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

Al depurar una ejecución fallida de aceptación de paquete, empieza por el resumen de `resolve_package` para confirmar el origen del paquete, la versión y el SHA-256. Después inspecciona la ejecución hija `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de lanes, tiempos de fases y comandos de reejecución. Prefiere volver a ejecutar el perfil de paquete fallido o las lanes exactas de Docker en lugar de volver a ejecutar la validación completa de release.

## Prueba smoke de instalación

El workflow separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies de Docker/paquetes, cambios en paquetes/manifiestos de plugins incluidos, o superficies del núcleo de plugins/canales/Gateway/Plugin SDK que ejercitan los jobs smoke de Docker. Los cambios de solo código fuente en plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida compila una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta la prueba smoke de CLI de eliminación de agents con workspace compartido, ejecuta el e2e de gateway-network en contenedor, verifica un argumento de compilación de plugin incluido y ejecuta el perfil acotado de Docker para plugins incluidos bajo un tiempo de espera agregado de comando de 240 segundos (con cada ejecución de Docker de escenario limitada por separado).
- **Ruta completa** mantiene la instalación de paquetes QR y la cobertura Docker/de actualización del instalador para ejecuciones programadas nocturnas, despachos manuales, comprobaciones de release con workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen smoke GHCR del Dockerfile raíz para el SHA objetivo, y después ejecuta la instalación de paquete QR, pruebas smoke del Dockerfile raíz/Gateway, pruebas smoke del instalador/actualización y el E2E rápido de Docker de plugins incluidos como jobs separados para que el trabajo del instalador no espere detrás de las pruebas smoke de la imagen raíz.

Los pushes a `main` (incluidos los commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el workflow mantiene la prueba smoke rápida de Docker y deja la prueba smoke completa de instalación para la validación nocturna o de release.

La prueba smoke lenta del proveedor de imágenes con instalación global de Bun está controlada por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de comprobaciones de release, y los despachos manuales de `Install Smoke` pueden optar por incluirla, pero los pull requests y los pushes a `main` no. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles centrados en instalación.

## E2E local de Docker

`pnpm test:docker:all` precompila una imagen compartida de pruebas live, empaqueta OpenClaw una vez como un tarball npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un runner básico de Node/Git para lanes de instalador/actualización/dependencias de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para lanes de funcionalidad normal.

Las definiciones de lanes de Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs`, y el runner solo ejecuta el plan seleccionado. El planificador selecciona la imagen por lane con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, y después ejecuta lanes con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variable                               | Valor predeterminado | Propósito                                                                                     |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Recuento de slots del pool principal para lanes normales.                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Recuento de slots del pool final sensible a proveedores.                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Límite de lanes live concurrentes para que los proveedores no limiten la velocidad.            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Límite de lanes concurrentes de instalación npm.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Límite de lanes multiservicio concurrentes.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Escalonamiento entre inicios de lanes para evitar tormentas de creación del daemon de Docker; establece `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Tiempo de espera de reserva por lane (120 minutos); algunas lanes live/finales usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset   | `1` imprime el plan del planificador sin ejecutar lanes.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset   | Lista separada por comas de lanes exactas; omite la prueba smoke de limpieza para que los agents puedan reproducir una lane fallida. |

Una lane más pesada que su límite efectivo aún puede empezar desde un pool vacío, y luego se ejecuta sola hasta que libera capacidad. Los preflights agregados locales comprueban Docker, eliminan contenedores E2E obsoletos de OpenClaw, emiten el estado de lanes activas, persisten tiempos de lanes para ordenación de mayor duración primero y, de forma predeterminada, dejan de programar nuevas lanes agrupadas tras el primer fallo.

### Workflow live/E2E reutilizable

El workflow live/E2E reutilizable pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen live, lane y cobertura de credenciales se requieren. `scripts/docker-e2e.mjs` convierte después ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y publica imágenes E2E de Docker GHCR básicas/funcionales etiquetadas por digest de paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita lanes con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de recompilar. Las descargas de imágenes Docker se reintentan con un tiempo de espera acotado de 180 segundos por intento para que un flujo atascado de registro/caché reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de release

La cobertura Docker de release ejecuta jobs fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento solo descargue el tipo de imagen que necesita y ejecute múltiples lanes mediante el mismo planificador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos Docker de release actuales son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y `plugins-runtime-install-a` hasta `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de plugins/runtime. El alias de lane `install-e2e` sigue siendo el alias agregado de reejecución manual para ambas lanes de instalador de proveedores.

OpenWebUI se integra en `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Las lanes de actualización de canales incluidos reintentan una vez ante fallos transitorios de red npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de lanes, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del plan del planificador, tablas de lanes lentas y comandos de reejecución por lane. La entrada `docker_lanes` del workflow ejecuta lanes seleccionadas contra las imágenes preparadas en lugar de los jobs de fragmentos, lo que mantiene la depuración de lanes fallidas acotada a un job Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si una lane seleccionada es una lane live de Docker, el job dirigido compila localmente la imagen de pruebas live para esa reejecución. Los comandos de reejecución de GitHub generados por lane incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imágenes preparadas cuando esos valores existen, para que una lane fallida pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El workflow live/E2E programado ejecuta diariamente la suite Docker completa de release-path.

## Prerrelease de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un workflow separado despachado por `Full Release Validation` o por un operador explícito. Los pull requests normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de plugins incluidos entre ocho workers de plugins; esos jobs de fragmentos de plugins ejecutan hasta dos grupos de configuración de plugins a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de plugins con muchas importaciones no creen jobs adicionales de CI. La ruta Docker de prerelease solo de release agrupa lanes Docker dirigidas en grupos pequeños para evitar reservar decenas de runners para jobs de uno a tres minutos.

## QA Lab

QA Lab tiene lanes de CI dedicadas fuera del workflow principal con alcance inteligente. La paridad agentic está anidada bajo los arneses amplios de QA y release, no como un workflow de PR independiente. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba ir junto con una ejecución de validación amplia.

- El workflow `QA-Lab - All Lanes` se ejecuta cada noche en `main` y por despacho manual; distribuye la lane de paridad mock, la lane live de Matrix y las lanes live de Telegram y Discord como jobs paralelos. Los jobs live usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de lanzamiento ejecutan carriles de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos calificados como simulados (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato del canal quede aislado de la latencia del modelo en vivo y del arranque normal del plugin de proveedor. El Gateway de transporte en vivo desactiva la búsqueda en memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad del proveedor está cubierta por las suites separadas de modelo en vivo, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para las puertas programadas y de lanzamiento, y añade `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del workflow siguen siendo `all`; el despacho manual con `matrix_profile=all` siempre divide la cobertura completa de Matrix en jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles de QA Lab críticos para el lanzamiento antes de la aprobación del lanzamiento; su puerta de paridad de QA ejecuta los paquetes candidato y de referencia como jobs de carril paralelos, y luego descarga ambos artefactos en un pequeño job de informe para la comparación final de paridad.

Para PRs normales, sigue la evidencia acotada de CI/comprobaciones en lugar de tratar la paridad como un estado requerido.

## CodeQL

El workflow `CodeQL` es intencionalmente un escáner de seguridad estrecho de primera pasada, no el barrido completo del repositorio. Las ejecuciones diarias, manuales y de protección para pull requests que no son borradores escanean código de workflows de Actions más las superficies de JavaScript/TypeScript de mayor riesgo, con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La protección de pull requests se mantiene ligera: solo se inicia para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el workflow programado. Android y macOS CodeQL quedan fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticación, secretos, sandbox, cron y línea base del Gateway                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del core más el runtime de plugins de canal, Gateway, Plugin SDK, secretos y puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies de SSRF del core, análisis de IP, protección de red, web-fetch y política SSRF del Plugin SDK                           |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agentes                 |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de plugins, cargador, manifiesto, registro, instalación del gestor de paquetes, carga de código fuente y contrato de paquetes del Plugin SDK |

### Shards de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — shard de seguridad Android programado. Compila manualmente la app de Android para CodeQL en el runner Blacksmith Linux más pequeño aceptado por la cordura del workflow. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard de seguridad macOS semanal/manual. Compila manualmente la app de macOS para CodeQL en Blacksmith macOS, filtra de los SARIF subidos los resultados de compilación de dependencias y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el shard no relacionado con seguridad correspondiente. Ejecuta solo consultas de calidad JavaScript/TypeScript sin seguridad y con severidad de error sobre superficies estrechas de alto valor en el runner Blacksmith Linux más pequeño. Su protección de pull requests es intencionalmente menor que el perfil programado: los PRs que no son borradores solo ejecutan los shards correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agentes y despacho de respuestas, código de esquema/migración/IO de configuración, código de autenticación/secretos/sandbox/seguridad, runtime de canales del core y plugins de canal incluidos, protocolo Gateway/método de servidor, runtime de memoria/pegamento del SDK, MCP/proceso/entrega saliente, catálogo de runtime/modelos de proveedores, diagnósticos de sesión/colas de entrega, cargador de plugins, contrato de Plugin SDK/paquete o runtime de respuestas del Plugin SDK. Los cambios de configuración de CodeQL y del workflow de calidad ejecutan los doce shards de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son ganchos de enseñanza/iteración para ejecutar un shard de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de autenticación, secretos, sandbox, cron y límite de seguridad del Gateway                                                                                 |
| `/codeql-critical-quality/config-boundary`              | Contratos de esquema de configuración, migración, normalización e IO                                                                                               |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo Gateway y contratos de métodos de servidor                                                                                                   |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canales del core y plugins de canal incluidos                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelos/proveedores, despacho y colas de autorrespuesta, y contratos de runtime del plano de control ACP                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK del host de memoria, fachadas de runtime de memoria, alias de memoria del Plugin SDK, pegamento de activación del runtime de memoria y comandos doctor de memoria |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de la cola de respuestas, colas de entrega de sesión, helpers de vinculación/entrega de sesiones salientes, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI de doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del Plugin SDK, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de vinculación de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap de la interfaz de control, persistencia local, flujos de control del Gateway y contratos de runtime del plano de control de tareas                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/search web del core, IO de medios, comprensión de medios, generación de imágenes y generación de medios                              |
| `/codeql-critical-quality/plugin-boundary`              | Contratos del cargador, registro, superficie pública y entrypoint del Plugin SDK                                                                                   |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente del Plugin SDK del lado del paquete publicado y helpers del contrato de paquete de plugin                                                            |

La calidad permanece separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, desactivarse o ampliarse sin oscurecer la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe volver a añadirse como trabajo de seguimiento acotado o dividido en shards solo después de que los perfiles estrechos tengan runtime y señal estables.

## Workflows de mantenimiento

### Docs Agent

El workflow `Docs Agent` es un carril de mantenimiento de Codex impulsado por eventos para mantener la documentación existente alineada con los cambios aterrizados recientemente. No tiene una programación pura: una ejecución exitosa de CI por push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por workflow-run se omiten cuando `main` ha avanzado o cuando se creó otra ejecución de Docs Agent no omitida en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen del Docs Agent no omitido anterior hasta el `main` actual, de modo que una ejecución horaria pueda cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Test Performance Agent

El workflow `Test Performance Agent` es un carril de mantenimiento de Codex impulsado por eventos para pruebas lentas. No tiene una programación pura: una ejecución exitosa de CI por push no bot en `main` puede activarlo, pero se omite si otra invocación por workflow-run ya se ejecutó o está ejecutándose ese día UTC. El despacho manual omite esa puerta de actividad diaria. El carril genera un informe de rendimiento Vitest agrupado de la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactors amplios, luego vuelve a ejecutar el informe de la suite completa y rechaza cambios que reduzcan el recuento base de pruebas aprobadas. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe de suite completa posterior al agente debe aprobar antes de que se confirme algo. Cuando `main` avanza antes de que aterrice el push del bot, el carril rebasea el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad drop-sudo que el agente de documentación.

### PRs duplicados después de merge

El workflow `Duplicate PRs After Merge` es un workflow manual de mantenedor para limpieza de duplicados después del aterrizaje. Su valor predeterminado es dry-run y solo cierra PRs listados explícitamente cuando `apply=true`. Antes de modificar GitHub, verifica que el PR aterrizado se haya mergeado y que cada duplicado tenga un issue referenciado compartido o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Puertas de comprobación local y enrutamiento de cambios

La lógica local de carriles modificados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa puerta de comprobación local es más estricta respecto a los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan la comprobación de tipos de producción del núcleo y de pruebas del núcleo, más lint/guards del núcleo;
- los cambios solo de pruebas del núcleo ejecutan solo la comprobación de tipos de pruebas del núcleo, más lint del núcleo;
- los cambios de producción de extensiones ejecutan la comprobación de tipos de producción de extensiones y de pruebas de extensiones, más lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan la comprobación de tipos de pruebas de extensiones, más lint de extensiones;
- los cambios públicos del SDK de Plugin o del contrato de plugins se amplían a la comprobación de tipos de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los incrementos de versión solo de metadatos de lanzamiento ejecutan verificaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios raíz/configuración desconocidos fallan de forma segura a todos los carriles de comprobación.

El enrutamiento local de pruebas cambiadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas; las ediciones de código fuente prefieren mapeos explícitos, luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega en salas de grupo es uno de los mapeos explícitos: los cambios en la configuración de respuesta visible para el grupo, el modo de entrega de respuestas desde código fuente o el prompt del sistema de la herramienta de mensajes se enrutan por las pruebas de respuesta del núcleo más regresiones de entrega de Discord y Slack, de modo que un cambio compartido predeterminado falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el arnés como para que el conjunto barato mapeado no sea un proxy confiable.

## Validación con Testbox

Ejecuta Testbox desde la raíz del repositorio y prefiere una caja recién preparada para pruebas amplias. Antes de gastar una puerta lenta en una caja que fue reutilizada, expiró o acaba de informar una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro de la caja.

La verificación de cordura falla rápido cuando desaparecen archivos raíz requeridos como `pnpm-lock.yaml` o cuando `git status --short` muestra al menos 200 eliminaciones rastreadas. Eso normalmente significa que el estado de sincronización remoto no es una copia confiable del PR; detén esa caja y prepara una nueva en lugar de depurar el fallo de prueba del producto. Para PRs intencionales con grandes eliminaciones, configura `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de cordura.

`pnpm testbox:run` también termina una invocación local de la CLI de Blacksmith que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Configura `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para desactivar esa guarda, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

Crabbox es el wrapper de cajas remotas propiedad del repositorio para pruebas Linux de mantenedores. Úsalo cuando una comprobación sea demasiado amplia para un bucle local de edición, cuando importe la paridad con CI o cuando la prueba necesite secretos, Docker, carriles de paquetes, cajas reutilizables o logs remotos. El backend normal de OpenClaw es `blacksmith-testbox`; la capacidad propia de AWS/Hetzner es un respaldo para caídas de Blacksmith, problemas de cuota o pruebas explícitas con capacidad propia.

Antes de una primera ejecución, revisa el wrapper desde la raíz del repositorio:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El wrapper del repositorio rechaza un binario obsoleto de Crabbox que no anuncia `blacksmith-testbox`. Pasa el proveedor explícitamente aunque `.crabbox.yaml` tenga valores predeterminados de nube propia.

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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
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
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Lee el resumen JSON final. Los campos útiles son `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` y `totalMs`. Las ejecuciones únicas de Crabbox respaldadas por Blacksmith deberían detener el Testbox automáticamente; si una ejecución se interrumpe o la limpieza no está clara, inspecciona las cajas activas y detén solo las cajas que creaste:

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

Si Crabbox es la capa rota pero Blacksmith funciona, usa Blacksmith directo como respaldo estrecho:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Si `blacksmith testbox list --all` y `blacksmith testbox status` funcionan pero las nuevas preparaciones quedan en `queued` sin IP ni URL de ejecución de Actions después de un par de minutos, trátalo como presión del proveedor Blacksmith, la cola, la facturación o el límite de la organización. Detén los ids en cola que creaste, evita iniciar más Testboxes y mueve la prueba a la ruta de capacidad propia de Crabbox siguiente mientras alguien revisa el panel de Blacksmith, la facturación y los límites de la organización.

Escala a capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, le falte el entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Bajo presión de AWS, evita `class=beast` salvo que la tarea realmente necesite CPU de clase 48xlarge. Una solicitud `beast` empieza en 192 vCPU y es la forma más fácil de activar una cuota regional de EC2 Spot u On-Demand Standard. Los valores predeterminados de `.crabbox.yaml`, propiedad del repositorio, son `standard`, varias regiones de capacidad y `capacity.hints: true`, de modo que las concesiones de AWS intermediadas imprimen la región/mercado seleccionado, presión de cuota, respaldo Spot y advertencias de clase de alta presión. Usa `fast` para comprobaciones amplias más pesadas, `large` solo después de que standard/fast no sean suficientes, y `beast` solo para carriles excepcionales limitados por CPU, como matrices Docker de suite completa o de todos los plugins, validación explícita de lanzamiento/bloqueador o perfilado de rendimiento con muchos núcleos. No uses `beast` para `pnpm check:changed`, pruebas enfocadas, trabajo solo de documentación, lint/comprobación de tipos ordinarios, reproducciones E2E pequeñas o triaje de caídas de Blacksmith. Usa `--market on-demand` para diagnóstico de capacidad, para que la fluctuación del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` controla los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para carriles de nube propia. Excluye `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos remotos de Git en lugar de sincronizar remotos y almacenes de objetos locales del mantenedor, y excluye artefactos locales de runtime/build que nunca deberían transferirse. `.github/workflows/crabbox-hydrate.yml` controla el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y la entrega de entorno no secreto para comandos de nube propia `crabbox run --id <cbx_id>`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
