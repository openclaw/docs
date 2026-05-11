---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Está depurando una comprobación fallida de GitHub Actions
    - Estás coordinando una ejecución o reejecución de validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, controles de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-05-11T20:23:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

La CI de OpenClaw se ejecuta en cada push a `main` y en cada pull request. El trabajo `preflight` clasifica el diff y desactiva las lanes costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionadamente el alcance inteligente y despliegan el grafo completo para candidatos de lanzamiento y validación amplia. Las lanes de Android siguen siendo opcionales mediante `include_android`. La cobertura de plugins solo para lanzamientos vive en el workflow separado [`Prelanzamiento de plugins`](#plugin-prerelease) y solo se ejecuta desde [`Validación completa de lanzamiento`](#full-release-validation) o una ejecución manual explícita.

## Resumen de la canalización

| Trabajo                         | Propósito                                                                                                      | Cuándo se ejecuta                          |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `preflight`                      | Detecta cambios solo de documentación, alcances modificados, extensiones modificadas y construye el manifiesto de CI | Siempre en pushes y PRs que no son borrador |
| `security-scm-fast`              | Detección de claves privadas y auditoría de workflows mediante `zizmor`                                        | Siempre en pushes y PRs que no son borrador |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias contra avisos de npm                                     | Siempre en pushes y PRs que no son borrador |
| `security-fast`                  | Agregado requerido para los trabajos rápidos de seguridad                                                      | Siempre en pushes y PRs que no son borrador |
| `check-dependencies`             | Pasada de Knip solo para dependencias de producción más la guardia de la lista permitida de archivos sin usar  | Cambios relevantes para Node               |
| `build-artifacts`                | Construye `dist/`, la interfaz de control, comprobaciones de artefactos construidos y artefactos reutilizables posteriores | Cambios relevantes para Node               |
| `checks-fast-core`               | Lanes rápidas de corrección en Linux, como comprobaciones de bundled/contrato de plugin/protocolo              | Cambios relevantes para Node               |
| `checks-fast-contracts-channels` | Comprobaciones de contratos de canales fragmentadas con un resultado agregado estable                          | Cambios relevantes para Node               |
| `checks-node-core-test`          | Fragmentos de pruebas centrales de Node, excluyendo lanes de canales, bundled, contratos y extensiones         | Cambios relevantes para Node               |
| `check`                          | Equivalente fragmentado de la puerta local principal: tipos de producción, lint, guardias, tipos de prueba y smoke estricto | Cambios relevantes para Node               |
| `check-additional`               | Arquitectura, drift fragmentado de límites/prompts, guardias de extensiones, límite de paquete y watch del Gateway | Cambios relevantes para Node               |
| `build-smoke`                    | Pruebas smoke de la CLI construida y smoke de memoria de arranque                                              | Cambios relevantes para Node               |
| `checks`                         | Verificador para pruebas de canales con artefactos construidos                                                 | Cambios relevantes para Node               |
| `checks-node-compat-node22`      | Lane de build y smoke de compatibilidad con Node 22                                                            | Ejecución manual de CI para lanzamientos   |
| `check-docs`                     | Formato, lint y comprobaciones de enlaces rotos de la documentación                                            | Documentación modificada                   |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                                               | Cambios relevantes para Skills de Python   |
| `checks-windows`                 | Pruebas específicas de Windows para procesos/rutas más regresiones compartidas de especificadores de importación en runtime | Cambios relevantes para Windows            |
| `macos-node`                     | Lane de pruebas TypeScript en macOS usando los artefactos construidos compartidos                              | Cambios relevantes para macOS              |
| `macos-swift`                    | Lint, build y pruebas de Swift para la app de macOS                                                            | Cambios relevantes para macOS              |
| `android`                        | Pruebas unitarias de Android para ambos sabores más una build de APK de depuración                             | Cambios relevantes para Android            |
| `test-performance-agent`         | Optimización diaria de pruebas lentas de Codex tras actividad de confianza                                    | Éxito de CI principal o ejecución manual   |
| `openclaw-performance`           | Informes diarios/bajo demanda de rendimiento del runtime Kova con lanes de proveedor simulado, perfil profundo y GPT 5.4 en vivo | Ejecución programada y manual              |

## Orden de fallo rápido

1. `preflight` decide qué lanes existen. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de artefactos y matriz de plataformas.
3. `build-artifacts` se superpone con las lanes rápidas de Linux para que los consumidores posteriores puedan comenzar en cuanto la build compartida esté lista.
4. Las lanes más pesadas de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando un push más reciente llega al mismo PR o ref de `main`. Trata eso como ruido de CI salvo que la ejecución más reciente para la misma ref también esté fallando. Las comprobaciones agregadas de fragmentos usan `!cancelled() && always()` para que sigan informando fallos normales de fragmentos, pero no se encolen después de que todo el workflow ya haya sido reemplazado. La clave de concurrencia automática de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones más recientes de main. Las ejecuciones manuales de la suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

El trabajo `ci-timings-summary` sube un artefacto compacto `ci-timings-summary` para cada ejecución de CI que no sea borrador. Registra tiempo de pared, tiempo de cola, trabajos más lentos y trabajos fallidos para la ejecución actual, de modo que las comprobaciones de salud de CI no tengan que extraer repetidamente todo el payload de Actions.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. La ejecución manual omite la detección de alcance modificado y hace que el manifiesto de preflight actúe como si todas las áreas con alcance hubieran cambiado.

- **Las ediciones del workflow de CI** validan el grafo de CI de Node más el lint de workflows, pero no fuerzan por sí solas builds nativas de Windows, Android o macOS; esas lanes de plataforma siguen estando acotadas a cambios en el código fuente de plataforma.
- **Las ediciones solo de enrutamiento de CI, ciertas ediciones baratas de fixtures de pruebas centrales y ediciones estrechas de helpers/enrutamiento de pruebas de contratos de plugins** usan una ruta rápida de manifiesto solo para Node: `preflight`, seguridad y una sola tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canales, fragmentos centrales completos, fragmentos de plugins bundled y matrices de guardias adicionales cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Las comprobaciones de Node en Windows** están acotadas a wrappers específicos de procesos/rutas de Windows, helpers de runners npm/pnpm/UI, configuración del gestor de paquetes y las superficies del workflow de CI que ejecutan esa lane; los cambios no relacionados de código fuente, plugins, install-smoke y solo pruebas permanecen en las lanes de Node en Linux.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo permanezca pequeño sin reservar runners de más: los contratos de canales se ejecutan como tres fragmentos ponderados respaldados por Blacksmith con el fallback estándar del runner de GitHub, las lanes rápidas/de soporte de unidades centrales se ejecutan por separado, la infraestructura de runtime central se divide entre fragmentos de estado, proceso/configuración, cron y compartidos, auto-reply se ejecuta como workers equilibrados (con el subárbol de respuestas dividido en fragmentos de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic de gateway/servidor se dividen entre lanes de chat/auth/model/http-plugin/runtime/startup en lugar de esperar a artefactos construidos. Las pruebas amplias de navegador, QA, medios y plugins varios usan sus configuraciones Vitest dedicadas en lugar del catch-all compartido de plugins. Los fragmentos con patrones de inclusión registran entradas de tiempo usando el nombre del fragmento de CI, de modo que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un fragmento filtrado. `check-additional` mantiene juntos el trabajo de compilación/canario de límites de paquete y separa la arquitectura de topología de runtime de la cobertura de watch del Gateway; la lista de guardias de límites se reparte en cuatro fragmentos de matriz, cada uno ejecutando guardias independientes seleccionadas de forma concurrente e imprimiendo tiempos por comprobación. La costosa comprobación de drift del snapshot de prompts del happy path de Codex se ejecuta como su propio trabajo adicional solo para CI manual y para cambios que afectan prompts, de modo que los cambios normales de Node no relacionados no esperen detrás de la generación en frío de snapshots de prompts y los fragmentos de límites permanezcan equilibrados mientras el drift de prompts sigue fijado al PR que lo causó; la misma bandera omite la generación Vitest de snapshots de prompts dentro del fragmento de límites de soporte central con artefactos construidos. El watch del Gateway, las pruebas de canales y el fragmento de límites de soporte central se ejecutan de forma concurrente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén construidos.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego construye el APK de depuración Play. El sabor third-party no tiene un source set ni un manifiesto separados; su lane de pruebas unitarias aún compila el sabor con las banderas BuildConfig de SMS/call-log, mientras evita un trabajo duplicado de empaquetado de APK de depuración en cada push relevante para Android.

El fragmento `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una pasada de Knip solo para dependencias de producción fijada a la versión más reciente de Knip, con la edad mínima de lanzamiento de pnpm deshabilitada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de Knip sobre archivos de producción sin usar contra `scripts/deadcode-unused-files.allowlist.mjs`. La guardia de archivos sin usar falla cuando un PR añade un archivo sin usar nuevo y no revisado o deja una entrada obsoleta en la lista permitida, mientras preserva superficies intencionales de plugins dinámicos, generadas, de build, pruebas en vivo y puentes de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado de destino desde la actividad del repositorio de OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código no confiable de pull requests. El workflow crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego envía payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El workflow tiene cuatro lanes:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente de ClawSweeper puede inspeccionar.

La lane `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos breves de comentarios o revisiones cuando existen. Evita intencionadamente reenviar el cuerpo completo del webhook. El workflow receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook del Gateway de OpenClaw para el agente de ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente de ClawSweeper recibe el destino de Discord en su prompt y debe publicar en `#clawsweeper` solo cuando el evento sea sorprendente, accionable, riesgoso u operacionalmente útil. Aperturas rutinarias, ediciones, actividad de bots, ruido duplicado de webhooks y tráfico normal de revisiones deben resultar en `NO_REPLY`.

Trata los títulos, comentarios, cuerpos, texto de revisión, nombres de ramas y mensajes de commit de GitHub como datos no confiables en toda esta ruta. Son entradas para resumen y triaje, no instrucciones para el flujo de trabajo ni para el runtime del agente.

## Despachos manuales

Los despachos manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de todos los carriles con alcance no Android: fragmentos de Linux Node, fragmentos de plugins incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, smoke de compilación, comprobaciones de docs, Skills de Python, Windows, macOS e i18n de Control UI. Los despachos manuales independientes de CI ejecutan solo Android con `include_android=true`; el paraguas completo de lanzamiento habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prelanzamiento de plugins, el fragmento solo de lanzamiento `agentic-plugins`, el barrido completo por lotes de extensiones y los carriles Docker de prelanzamiento de plugins se excluyen de CI. La suite Docker de prelanzamiento se ejecuta solo cuando `Full Release Validation` despacha el flujo de trabajo separado `Plugin Prerelease` con la puerta de validación de lanzamiento habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único, por lo que una suite completa de candidato de lanzamiento no se cancela por otra ejecución de push o PR en la misma referencia. La entrada opcional `target_ref` permite que un llamador de confianza ejecute ese grafo contra una rama, etiqueta o SHA completo de commit mientras usa el archivo de flujo de trabajo de la referencia de despacho seleccionada.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, trabajos rápidos de seguridad y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidos, comprobaciones fragmentadas de contratos de canales, fragmentos de `check` excepto lint, agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de docs, Skills de Python, workflow-sanity, labeler, auto-response; la preflight de install-smoke también usa Ubuntu hospedado en GitHub para que la matriz de Blacksmith pueda ponerse en cola antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragmentos de extensiones de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | build-smoke, fragmentos de pruebas de Linux Node, fragmentos de pruebas de plugins incluidos, fragmentos de `check-additional`, `android`                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el tiempo de cola de 32 vCPU costaba más de lo que ahorraba)                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks recurren a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                     |

La CI del repositorio canónico mantiene Blacksmith como ruta de ejecutores predeterminada. Durante `preflight`, `scripts/ci-runner-labels.mjs` comprueba las ejecuciones recientes de Actions en cola y en curso para encontrar trabajos de Blacksmith en cola. Si una etiqueta específica de Blacksmith ya tiene trabajos en cola, los trabajos posteriores que usarían esa etiqueta exacta recurren al ejecutor hospedado en GitHub correspondiente (`ubuntu-24.04`, `windows-2025` o `macos-latest`) solo para esa ejecución. Otros tamaños de Blacksmith en la misma familia de SO permanecen en sus etiquetas principales. Si falla la sonda de API, no se aplica ningún respaldo.

## Equivalentes locales

```bash
pnpm changed:lanes                            # inspeccionar el clasificador local de carriles modificados para origin/main...HEAD
pnpm check:changed                            # puerta de comprobación local inteligente: typecheck/lint/guards modificados por carril de límite
pnpm check                                    # puerta local rápida: prod tsgo + lint fragmentado + guards rápidos en paralelo
pnpm check:test-types
pnpm check:timed                              # la misma puerta con tiempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # pruebas de vitest
pnpm test:changed                             # objetivos Vitest modificados inteligentes y baratos
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # formato de docs + lint + enlaces rotos
pnpm build                                    # compilar dist cuando importan los carriles de artefactos/smoke de compilación de CI
pnpm ci:timings                               # resumir la última ejecución de CI de push a origin/main
pnpm ci:timings:recent                        # comparar ejecuciones recientes exitosas de CI de main
node scripts/ci-run-timings.mjs <run-id>      # resumir tiempo total, tiempo de cola y trabajos más lentos
node scripts/ci-run-timings.mjs --latest-main # ignorar ruido de issues/comentarios y elegir CI de push a origin/main
node scripts/ci-run-timings.mjs --recent 10   # comparar ejecuciones recientes exitosas de CI de main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## Rendimiento de OpenClaw

`OpenClaw Performance` es el flujo de trabajo de rendimiento del producto/runtime. Se ejecuta a diario en `main` y puede despacharse manualmente:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

El despacho manual normalmente mide la referencia del flujo de trabajo. Configura `target_ref` para medir una etiqueta de lanzamiento u otra rama con la implementación actual del flujo de trabajo. Las rutas de informes publicados y los punteros latest se indexan por la referencia probada, y cada `index.md` registra la referencia/SHA probados, la referencia/SHA del flujo de trabajo, la referencia de Kova, el perfil, el modo de autenticación del carril, el modelo, el número de repeticiones y los filtros de escenarios.

El flujo de trabajo instala OCM desde una versión fijada y Kova desde `openclaw/Kova` en la entrada `kova_ref` fijada, y luego ejecuta tres carriles:

- `mock-provider`: escenarios de diagnóstico de Kova contra un runtime de compilación local con autenticación falsa determinista compatible con OpenAI.
- `mock-deep-profile`: perfilado de CPU/heap/traza para puntos críticos de arranque, Gateway y turnos de agente.
- `live-gpt54`: un turno real de agente OpenAI `openai/gpt-5.4`, omitido cuando `OPENAI_API_KEY` no está disponible.

El carril mock-provider también ejecuta sondas de origen nativas de OpenClaw después de la pasada de Kova: tiempos de arranque y memoria del Gateway en casos de arranque predeterminado, con hook y con 50 plugins; bucles repetidos de hola `channel-chat-baseline` con mock-OpenAI; y comandos de arranque de CLI contra el Gateway iniciado. El resumen Markdown de la sonda de origen vive en `source/index.md` dentro del paquete de informe, con JSON sin procesar junto a él.

Cada carril sube artefactos de GitHub. Cuando `CLAWGRIT_REPORTS_TOKEN` está configurado, el flujo de trabajo también confirma `report.json`, `report.md`, paquetes, `index.md` y artefactos de sondas de origen en `openclaw/clawgrit-reports` bajo `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. El puntero actual de la referencia probada se escribe como `openclaw-performance/<tested-ref>/latest-<lane>.json`.

## Validación completa de lanzamiento

`Full Release Validation` es el flujo de trabajo paraguas manual para "ejecutarlo todo antes del lanzamiento". Acepta una rama, etiqueta o SHA completo de commit, despacha el flujo de trabajo manual `CI` con ese objetivo, despacha `Plugin Prerelease` para pruebas solo de lanzamiento de plugins/paquetes/estáticas/Docker, y despacha `OpenClaw Release Checks` para install smoke, aceptación de paquetes, comprobaciones de paquetes entre SO, paridad de QA Lab, Matrix y carriles de Telegram. Las ejecuciones estables/predeterminadas mantienen la cobertura exhaustiva live/E2E y de ruta de lanzamiento Docker detrás de `run_release_soak=true`; `release_profile=full` fuerza esa cobertura de soak, de modo que la validación amplia de avisos siga siendo amplia. Con `rerun_group=all` y `release_profile=full`, también ejecuta `NPM Telegram Beta E2E` contra el artefacto `release-package-under-test` de las comprobaciones de lanzamiento. Después de publicar, pasa `release_package_spec` para reutilizar el paquete npm enviado en comprobaciones de lanzamiento, Package Acceptance, Docker, entre SO y Telegram sin recompilar. Usa `npm_telegram_package_spec` solo cuando Telegram deba probar un paquete distinto.

Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos de flujo de trabajo, las diferencias de perfiles, los artefactos y
los identificadores de reejecución enfocada.

`OpenClaw Release Publish` es el flujo de trabajo manual de lanzamiento con mutaciones. Despáchalo
desde `release/YYYY.M.D` o `main` después de que exista la etiqueta de lanzamiento y después de que
la preflight npm de OpenClaw haya tenido éxito. Verifica `pnpm plugins:sync:check`,
despacha `Plugin NPM Release` para todos los paquetes de plugins publicables, despacha
`Plugin ClawHub Release` para el mismo SHA de lanzamiento, y solo entonces despacha
`OpenClaw NPM Release` con el `preflight_run_id` guardado.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Para la prueba de commit fijado en una rama que avanza rápido, usa el asistente en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las referencias de despacho de workflows de GitHub deben ser ramas o etiquetas, no SHA de commit sin procesar. El
asistente empuja una rama temporal `release-ci/<sha>-...` en el SHA objetivo,
despacha `Full Release Validation` desde esa referencia fijada, verifica que cada
`headSha` de workflow hijo coincida con el objetivo y elimina la rama temporal cuando
la ejecución se completa. El verificador paraguas también falla si algún workflow hijo se ejecutó en un
SHA diferente.

`release_profile` controla la amplitud live/proveedor que se pasa a las comprobaciones de release. Los
workflows manuales de release usan `stable` de forma predeterminada; usa `full` solo cuando
quieras intencionadamente la matriz amplia consultiva de proveedores/medios. `run_release_soak`
controla si las comprobaciones de release estables/predeterminadas ejecutan el soak exhaustivo live/E2E y
Docker de la ruta de release; `full` fuerza la activación del soak.

- `minimum` mantiene los carriles críticos de release de OpenAI/core más rápidos.
- `stable` añade el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedores/medios.

El paraguas registra los ids de ejecución de los hijos despachados, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y agrega tablas de los trabajos más lentos para cada ejecución hija. Si se vuelve a ejecutar un workflow hijo y pasa a verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado paraguas y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de release, `ci` solo para el hijo normal de CI completo, `plugin-prerelease` solo para el hijo de prerelease de plugins, `release-checks` para cada hijo de release, o un grupo más acotado: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la repetición de una caja de release fallida después de una corrección enfocada. Para un carril cross-OS fallido, combina `rerun_group=cross-os` con `cross_os_suite_filter`, por ejemplo `windows/packaged-upgrade`; los comandos cross-OS largos emiten líneas de Heartbeat y los resúmenes de packaged-upgrade incluyen tiempos por fase. Los carriles QA de release-check son consultivos, así que los fallos solo de QA advierten, pero no bloquean el verificador de release-check.

`OpenClaw Release Checks` usa la referencia de workflow de confianza para resolver la referencia seleccionada una vez en un tarball `release-package-under-test`, y luego pasa ese artefacto a las comprobaciones cross-OS y a Package Acceptance, además del workflow Docker live/E2E de la ruta de release cuando se ejecuta cobertura de soak. Eso mantiene consistentes los bytes del paquete entre las cajas de release y evita reempaquetar el mismo candidato en varios trabajos hijos.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
reemplazan al paraguas más antiguo. El monitor padre cancela cualquier workflow hijo que
ya haya despachado cuando se cancela el padre, de modo que la validación nueva de main
no queda detrás de una ejecución obsoleta de release-check de dos horas. La validación de ramas/etiquetas
de release y los grupos de repetición enfocados mantienen `cancel-in-progress: false`.

## Shards live y E2E

El hijo live/E2E de release conserva una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como shards con nombre mediante `scripts/test-live-shard.mjs` en lugar de un trabajo serial:

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
- shards separados de medios de audio/video y shards de música filtrados por proveedor

Eso mantiene la misma cobertura de archivos y facilita volver a ejecutar y diagnosticar fallos lentos de proveedores live. Los nombres agregados de shard `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para repeticiones manuales de una sola vez.

Los shards nativos live de medios se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el workflow `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en runners normales de Blacksmith: los trabajos de contenedor no son el lugar adecuado para iniciar pruebas Docker anidadas.

Los shards live de modelo/backend respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por cada commit seleccionado. El workflow live de release construye y empuja esa imagen una vez, y luego los shards Docker live de modelo, Gateway fragmentado por proveedor, backend CLI, enlace ACP y arnés de Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los shards Docker de Gateway llevan límites explícitos de `timeout` a nivel de script por debajo del timeout del trabajo de workflow para que un contenedor atascado o una ruta de limpieza falle rápido en lugar de consumir todo el presupuesto de release-check. Si esos shards reconstruyen de forma independiente el objetivo Docker completo desde el código fuente, la ejecución de release está mal configurada y desperdiciará tiempo de reloj en construcciones de imagen duplicadas.

## Package Acceptance

Usa `Package Acceptance` cuando la pregunta sea "¿este paquete instalable de OpenClaw funciona como producto?" Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que package acceptance valida un único tarball mediante el mismo arnés Docker E2E que los usuarios ejercitan después de instalar o actualizar.

### Trabajos

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime el origen, la referencia de workflow, la referencia de paquete, la versión, el SHA-256 y el perfil en el resumen de pasos de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El workflow reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker con digest de paquete cuando es necesario y ejecuta los carriles Docker seleccionados contra ese paquete en lugar de empaquetar el checkout del workflow. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el workflow reutilizable prepara el paquete y las imágenes compartidas una vez, y luego despliega esos carriles como trabajos Docker dirigidos paralelos con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; el despacho independiente de Telegram todavía puede instalar una especificación npm publicada.
4. `summary` falla el workflow si falló la resolución del paquete, la aceptación Docker o el carril opcional de Telegram.

### Orígenes de candidatos

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de release de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para la aceptación de prerelease/estable publicada.
- `source=ref` empaqueta una rama, etiqueta o SHA completo de commit `package_ref` de confianza. El resolver obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o desde una etiqueta de release, instala dependencias en un worktree desvinculado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debe proporcionarse para artefactos compartidos externamente.

Mantén separados `workflow_ref` y `package_ref`. `workflow_ref` es el código de workflow/arnés de confianza que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits de origen confiables más antiguos sin ejecutar lógica de workflow antigua.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos Docker de la ruta de release con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura offline de plugins, de modo que la validación de paquetes publicados no dependa de la disponibilidad live de ClawHub. El carril opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, y la ruta de especificación npm publicada se mantiene para despachos independientes.

Para la política dedicada de pruebas de actualizaciones y plugins, incluidos comandos locales,
carriles Docker, entradas de Package Acceptance, valores predeterminados de release y triaje de fallos,
consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a Aceptación de paquetes con `source=artifact`, el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` y `telegram_mode=mock-openai`. Esto mantiene la migración de paquetes, la actualización, la instalación activa de Skills de ClawHub, la limpieza de dependencias obsoletas de Plugin, la reparación de instalación de Plugins configurados, el Plugin sin conexión, la actualización de Plugins y la prueba de Telegram en el mismo tarball de paquete resuelto. Configura `release_package_spec` en la Validación completa de lanzamiento o en las comprobaciones de lanzamiento de OpenClaw después de publicar una beta para ejecutar la misma matriz contra el paquete npm publicado sin reconstruir; configura `package_acceptance_package_spec` solo cuando Aceptación de paquetes necesite un paquete distinto del resto de la validación de lanzamiento. Las comprobaciones de lanzamiento entre sistemas operativos siguen cubriendo la incorporación específica del sistema operativo, el instalador y el comportamiento de plataforma; la validación de producto de paquete/actualización debe empezar con Aceptación de paquetes. El carril Docker `published-upgrade-survivor` valida una línea base de paquete publicado por ejecución en la ruta bloqueante de lanzamiento. En Aceptación de paquetes, el tarball `package-under-test` resuelto siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la línea base publicada de respaldo, con valor predeterminado `openclaw@latest`; los comandos de reejecución de carriles fallidos conservan esa línea base. La Validación completa de lanzamiento con `run_release_soak=true` o `release_profile=full` configura `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` y `published_upgrade_survivor_scenarios=reported-issues` para expandirse a las cuatro versiones estables más recientes de npm, más versiones fijadas de límite de compatibilidad de Plugins y fixtures modelados como incidencias para configuración de Feishu, archivos de arranque/persona conservados, instalaciones configuradas de Plugins de OpenClaw, rutas de registro con tilde y raíces obsoletas de dependencias heredadas de Plugins. Las selecciones de supervivencia a actualización publicada con varias líneas base se fragmentan por línea base en trabajos de ejecutor Docker dirigidos separados. El flujo de trabajo separado `Update Migration` usa el carril Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando lo que se busca es una limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de CI de la Validación completa de lanzamiento. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquetes con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, mantener un único carril con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o configurar `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El carril publicado configura la línea base con una receta integrada de comandos `openclaw config set`, registra los pasos de la receta en `summary.json` y sondea `/healthz`, `/readyz`, además del estado RPC después del inicio del Gateway. Los carriles de instalación limpia empaquetada e instalador de Windows también verifican que un paquete instalado pueda importar una anulación de browser-control desde una ruta absoluta de Windows sin procesar. La prueba smoke de turno de agente entre sistemas operativos de OpenAI usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está configurado; de lo contrario, usa `openai/gpt-5.4`, de modo que la prueba de instalación y Gateway se mantenga en un modelo de prueba GPT-5 y evite valores predeterminados GPT-4.x.

### Ventanas de compatibilidad heredada

Aceptación de paquetes tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas de QA privadas conocidas en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia de `gateway install --wrapper` cuando el paquete no expone esa bandera;
- `update-channel-switch` puede eliminar las `patchedDependencies` de pnpm faltantes del fixture git falso derivado del tarball y puede registrar la falta de `update.channel` persistido;
- las pruebas smoke de Plugins pueden leer ubicaciones heredadas del registro de instalación o aceptar la falta de persistencia del registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración, sin dejar de requerir que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

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

Al depurar una ejecución fallida de aceptación de paquetes, empieza por el resumen `resolve_package` para confirmar la fuente del paquete, la versión y el SHA-256. Luego inspecciona la ejecución hija `docker_acceptance` y sus artefactos de Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de carril, tiempos de fase y comandos de reejecución. Prefiere volver a ejecutar el perfil de paquete fallido o los carriles Docker exactos en lugar de volver a ejecutar la validación completa de lanzamiento.

## Prueba smoke de instalación

El flujo de trabajo separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio trabajo `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para solicitudes de cambios que tocan superficies de Docker/paquete, cambios de paquete/manifiesto de Plugins incluidos o superficies centrales de Plugin/canal/Gateway/Plugin SDK que ejercitan los trabajos smoke de Docker. Los cambios solo de código fuente en Plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida construye una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta la prueba smoke de CLI agents delete shared-workspace, ejecuta el e2e de gateway-network en contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil Docker acotado de bundled-plugin bajo un tiempo de espera agregado de comando de 240 segundos (cada ejecución Docker de escenario se limita por separado).
- **Ruta completa** conserva la instalación de paquetes QR y la cobertura de Docker/actualización del instalador para ejecuciones programadas nocturnas, despachos manuales, comprobaciones de lanzamiento mediante workflow-call y solicitudes de cambios que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen smoke GHCR del Dockerfile raíz para el SHA objetivo, y luego ejecuta la instalación de paquetes QR, pruebas smoke del Dockerfile raíz/Gateway, pruebas smoke del instalador/actualización y el E2E Docker rápido de Plugins incluidos como trabajos separados para que el trabajo del instalador no espere detrás de las pruebas smoke de imagen raíz.

Los envíos a `main` (incluidos los commits de fusión) no fuerzan la ruta completa; cuando la lógica de alcance modificado solicitaría cobertura completa en un envío, el flujo de trabajo conserva la prueba smoke rápida de Docker y deja la prueba smoke completa de instalación para la validación nocturna o de lanzamiento.

La prueba smoke lenta de proveedor de imagen con instalación global de Bun se controla por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el flujo de trabajo de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por habilitarla, pero las solicitudes de cambios y los envíos a `main` no. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles centrados en instalación.

## E2E local de Docker

`pnpm test:docker:all` preconstruye una imagen compartida de pruebas en vivo, empaqueta OpenClaw una vez como tarball de npm y construye dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un ejecutor Node/Git mínimo para carriles de instalador/actualización/dependencias de Plugins;
- una imagen funcional que instala el mismo tarball en `/app` para carriles de funcionalidad normal.

Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el ejecutor solo ejecuta el plan seleccionado. El programador selecciona la imagen por carril con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, y luego ejecuta carriles con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustables

| Variable                               | Predeterminado | Propósito                                                                                     |
| -------------------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Recuento de espacios del grupo principal para carriles normales.                              |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Recuento de espacios del grupo de cola sensible al proveedor.                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de carriles en vivo concurrentes para que los proveedores no limiten.                  |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10             | Límite de carriles concurrentes de instalación npm.                                           |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de carriles multiservicio concurrentes.                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de carriles para evitar tormentas de creación del daemon de Docker; configura `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Tiempo de espera de respaldo por carril (120 minutos); los carriles en vivo/de cola seleccionados usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin definir    | `1` imprime el plan del programador sin ejecutar carriles.                                    |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin definir    | Lista exacta de carriles separados por comas; omite la prueba smoke de limpieza para que los agentes puedan reproducir un carril fallido. |

Un carril más pesado que su límite efectivo aún puede iniciarse desde un grupo vacío y luego ejecutarse solo hasta que libere capacidad. El agregado local ejecuta comprobaciones previas de Docker, elimina contenedores E2E obsoletos de OpenClaw, emite el estado de carriles activos, persiste tiempos de carril para ordenar primero los más largos y deja de programar carriles agrupados nuevos después del primer fallo de forma predeterminada.

### Flujo de trabajo reutilizable en vivo/E2E

El flujo de trabajo reutilizable en vivo/E2E pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen en vivo, carril y cobertura de credenciales se requieren. `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; construye y publica imágenes E2E Docker GHCR mínimas/funcionales etiquetadas con el digest del paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita carriles con paquete instalado; y reutiliza las entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de reconstruir. Las descargas de imágenes Docker se reintentan con un tiempo de espera acotado de 180 segundos por intento para que un flujo de registro/caché bloqueado reintente rápido en vez de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de la ruta de lanzamiento

La cobertura Docker de lanzamiento ejecuta trabajos fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento descargue solo el tipo de imagen que necesita y ejecute varios carriles mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos Docker de la versión actual son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y de `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de Plugin/runtime. El alias de carril `install-e2e` sigue siendo el alias agregado de repetición manual para ambos carriles del instalador de proveedores.

OpenWebUI se integra en `plugins-runtime-services` cuando la cobertura completa de la ruta de versión lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Los carriles de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de carril, tiempos, `summary.json`, `failures.json`, tiempos de fase, JSON del planificador, tablas de carriles lentos y comandos de repetición por carril. La entrada `docker_lanes` del workflow ejecuta los carriles seleccionados contra las imágenes preparadas en lugar de los trabajos de fragmentos, lo que mantiene la depuración de carriles fallidos acotada a un único trabajo Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si un carril seleccionado es un carril Docker en vivo, el trabajo dirigido compila localmente la imagen de prueba en vivo para esa repetición. Los comandos generados de repetición por carril de GitHub incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imágenes preparadas cuando esos valores existen, para que un carril fallido pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El workflow programado en vivo/E2E ejecuta a diario la suite Docker completa de la ruta de versión.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un workflow separado despachado por `Full Release Validation` o por un operador explícito. Las pull requests normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de Plugins incluidos entre ocho workers de extensiones; esos trabajos de fragmentación de extensiones ejecutan hasta dos grupos de configuración de Plugin a la vez, con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de Plugins con muchas importaciones no generen trabajos adicionales de CI. La ruta de prelanzamiento Docker exclusiva de versión agrupa carriles Docker dirigidos en grupos pequeños para evitar reservar decenas de runners para trabajos de uno a tres minutos. El workflow también sube un artefacto informativo `plugin-inspector-advisory` de `@openclaw/plugin-inspector`; los hallazgos del inspector son insumos de triaje y no modifican la puerta bloqueante de Plugin Prerelease.

## Laboratorio de QA

El laboratorio de QA tiene carriles de CI dedicados fuera del workflow principal de alcance inteligente. La paridad agéntica está anidada bajo los arneses amplios de QA y versión, no es un workflow independiente de PR. Usa `Full Release Validation` con `rerun_group=qa-parity` cuando la paridad deba acompañar una ejecución amplia de validación.

- El workflow `QA-Lab - All Lanes` se ejecuta cada noche en `main` y por despacho manual; distribuye el carril de paridad simulada, el carril Matrix en vivo y los carriles en vivo de Telegram y Discord como trabajos paralelos. Los trabajos en vivo usan el entorno `qa-live-shared`, y Telegram/Discord usan concesiones de Convex.

Las comprobaciones de versión ejecutan carriles de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos cualificados para simulación (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato del canal quede aislado de la latencia del modelo en vivo y del inicio normal del Plugin de proveedor. El Gateway de transporte en vivo desactiva la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores está cubierta por las suites separadas de modelo en vivo, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de versión, añadiendo `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del workflow siguen siendo `all`; el despacho manual `matrix_profile=all` siempre fragmenta la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles críticos de versión del laboratorio de QA antes de aprobar la versión; su puerta de paridad de QA ejecuta los paquetes candidato y base como trabajos de carril paralelos, y luego descarga ambos artefactos en un pequeño trabajo de informe para la comparación final de paridad.

Para PRs normales, sigue la evidencia de CI/comprobación con alcance específico en lugar de tratar la paridad como un estado obligatorio.

## CodeQL

El workflow `CodeQL` es intencionalmente un escáner de seguridad estrecho de primera pasada, no un barrido completo del repositorio. Las ejecuciones diarias, manuales y de protección de pull requests que no son borrador escanean código de workflows de Actions y las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas a `security-severity` alta/crítica.

La protección de pull requests se mantiene ligera: solo se inicia para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el workflow programado. CodeQL de Android y macOS queda fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticación, secretos, sandbox, cron y línea base de Gateway                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del core más runtime de Plugin de canal, Gateway, SDK de Plugin, secretos y puntos de auditoría |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies SSRF del core, análisis de IP, protección de red, obtención web y política SSRF del SDK de Plugin                       |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agente                 |
| `/codeql-security-high/plugin-trust-boundary`     | Superficies de confianza de instalación de Plugin, cargador, manifiesto, registro, instalación del gestor de paquetes, carga de fuentes y contrato de paquete del SDK de Plugin |

### Fragmentos de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — fragmento programado de seguridad de Android. Compila la app Android manualmente para CodeQL en el runner Linux Blacksmith más pequeño aceptado por la cordura del workflow. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento de seguridad macOS semanal/manual. Compila la app macOS manualmente para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores diarios predeterminados porque la compilación macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento no relacionado con seguridad correspondiente. Ejecuta solo consultas de calidad JavaScript/TypeScript sin seguridad y con severidad de error sobre superficies estrechas de alto valor en el runner Linux Blacksmith más pequeño. Su protección de pull requests es intencionalmente menor que el perfil programado: las PRs que no son borrador solo ejecutan los fragmentos correspondientes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agente y despacho de respuestas, esquema/migración/IO de configuración, autenticación/secretos/sandbox/seguridad, core de canal y runtime de Plugin de canales incluidos, protocolo/método de servidor de Gateway, runtime de memoria/pegamento de SDK, MCP/proceso/entrega saliente, runtime de proveedor/catálogo de modelos, diagnósticos de sesión/colas de entrega, cargador de Plugins, contrato de paquete/SDK de Plugin o runtime de respuestas del SDK de Plugin. Los cambios de configuración de CodeQL y del workflow de calidad ejecutan los doce fragmentos de calidad de PR.

El despacho manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son ganchos de enseñanza/iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                              |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de autenticación, secretos, sandbox, cron y Gateway                                                                                       |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuración, migración, normalización y contratos de E/S                                                                                                   |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas de protocolo de Gateway y contratos de métodos del servidor                                                                                                    |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación del canal central y del plugin de canal incluido                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelo/proveedor, despacho y colas de respuesta automática, y contratos de runtime del plano de control ACP                           |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                            |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de host de memoria, fachadas de runtime de memoria, alias del SDK de memoria de Plugin, glue de activación del runtime de memoria y comandos de doctor de memoria    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Componentes internos de la cola de respuestas, colas de entrega de sesión, helpers de enlace/entrega de sesiones salientes, superficies de eventos diagnósticos/paquetes de logs y contratos de CLI de doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del SDK de Plugin, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de enlace de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y descubrimiento de proveedores, registro del runtime de proveedores, valores predeterminados/catálogos de proveedores y registros web/búsqueda/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de la interfaz de control, persistencia local, flujos de control del Gateway y contratos de runtime del plano de control de tareas                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de runtime de fetch/búsqueda web centrales, E/S de medios, comprensión de medios, generación de imágenes y generación de medios                                |
| `/codeql-critical-quality/plugin-boundary`              | Contratos del cargador, registro, superficie pública y puntos de entrada del SDK de Plugin                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente del SDK de Plugin del lado del paquete publicado y helpers de contrato del paquete de plugin                                                              |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin oscurecer la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe volver a añadirse como trabajo de seguimiento acotado o fragmentado solo después de que los perfiles estrechos tengan runtime y señal estables.

## Flujos de trabajo de mantenimiento

### Docs Agent

El flujo de trabajo `Docs Agent` es un carril de mantenimiento de Codex basado en eventos para mantener la documentación existente alineada con cambios integrados recientemente. No tiene una programación pura: una ejecución de CI exitosa de push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones workflow-run se omiten cuando `main` ha avanzado o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen del Docs Agent no omitido anterior hasta el `main` actual, de modo que una ejecución horaria pueda cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Test Performance Agent

El flujo de trabajo `Test Performance Agent` es un carril de mantenimiento de Codex basado en eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI exitosa de push no bot en `main` puede activarlo, pero se omite si otra invocación workflow-run ya se ejecutó o se está ejecutando ese día UTC. El despacho manual evita esa puerta de actividad diaria. El carril genera un informe agrupado de rendimiento de Vitest de la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de la suite completa y rechaza cambios que reduzcan el recuento base de pruebas aprobadas. Si la línea base tiene pruebas fallidas, Codex puede corregir solo fallos obvios y el informe de suite completa posterior al agente debe aprobar antes de que se confirme nada. Cuando `main` avanza antes de que aterrice el push del bot, el carril rebasa el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu hospedado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad drop-sudo que el agente de documentación.

### PR duplicados después de merge

El flujo de trabajo `Duplicate PRs After Merge` es un flujo manual de mantenedor para limpieza de duplicados posterior a la integración. De forma predeterminada es dry-run y solo cierra los PR listados explícitamente cuando `apply=true`. Antes de mutar GitHub, verifica que el PR integrado esté fusionado y que cada duplicado tenga un issue referenciado compartido o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Puertas de verificación locales y enrutamiento de cambios

La lógica local de carriles modificados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa puerta de verificación local es más estricta con los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan typecheck de producción del núcleo y de pruebas del núcleo, además de lint/guards del núcleo;
- los cambios solo de pruebas del núcleo ejecutan solo typecheck de pruebas del núcleo, además de lint del núcleo;
- los cambios de producción de extensiones ejecutan typecheck de producción de extensiones y de pruebas de extensiones, además de lint de extensiones;
- los cambios solo de pruebas de extensiones ejecutan typecheck de pruebas de extensiones, además de lint de extensiones;
- los cambios públicos del SDK de Plugin o del contrato de plugins se expanden al typecheck de extensiones porque las extensiones dependen de esos contratos centrales (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los incrementos de versión solo de metadatos de release ejecutan verificaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todos los carriles de verificación.

El enrutamiento local de pruebas modificadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren mapeos explícitos, luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega de salas de grupo es uno de los mapeos explícitos: los cambios en la configuración de respuesta visible de grupo, el modo de entrega de respuestas de origen o el prompt del sistema de la herramienta de mensajes pasan por las pruebas de respuestas del núcleo más regresiones de entrega de Discord y Slack, para que un cambio predeterminado compartido falle antes del primer push del PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea lo bastante amplio en el harness como para que el conjunto mapeado barato no sea un proxy confiable.

## Validación con Testbox

Crabbox es el wrapper de cajas remotas propiedad del repo para prueba Linux de mantenedor. Úsalo
desde la raíz del repo cuando una verificación sea demasiado amplia para un ciclo de edición local, cuando importe
la paridad con CI, o cuando la prueba necesite secretos, Docker, carriles de paquete,
cajas reutilizables o logs remotos. El backend normal de OpenClaw es
`blacksmith-testbox`; la capacidad AWS/Hetzner propia es un respaldo para caídas de Blacksmith,
problemas de cuota o pruebas explícitas en capacidad propia.

Las ejecuciones de Blacksmith respaldadas por Crabbox calientan, reclaman, sincronizan, ejecutan, informan y limpian
Testboxes de un solo uso. La verificación de cordura de sincronización integrada falla rápido cuando archivos raíz
obligatorios como `pnpm-lock.yaml` desaparecen o cuando `git status --short`
muestra al menos 200 eliminaciones rastreadas. Para PRs intencionales con muchas eliminaciones, establece
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para el comando remoto.

Crabbox también termina una invocación local de la CLI de Blacksmith que permanece en la
fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Establece
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0` para deshabilitar esa guardia, o usa un valor mayor
en milisegundos para diffs locales inusualmente grandes.

Antes de una primera ejecución, comprueba el wrapper desde la raíz del repo:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

El wrapper del repo rechaza un binario de Crabbox obsoleto que no anuncie `blacksmith-testbox`. Pasa el proveedor explícitamente aunque `.crabbox.yaml` tenga valores predeterminados de nube propia.

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

Lee el resumen JSON final. Los campos útiles son `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` y `totalMs`. Las ejecuciones Crabbox de un solo uso respaldadas por Blacksmith deberían detener el Testbox automáticamente; si una ejecución se interrumpe o la limpieza no está clara, inspecciona las cajas activas y detén solo las cajas que creaste:

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
calentamientos quedan `queued` sin IP ni URL de ejecución de Actions después de un par de minutos,
trátalo como presión del proveedor, cola, facturación o límite de org de Blacksmith. Detén los
ids en cola que creaste, evita iniciar más Testboxes y mueve la prueba a la
ruta de capacidad propia de Crabbox a continuación mientras alguien revisa el panel de Blacksmith,
la facturación y los límites de la org.

Escala a la capacidad propia de Crabbox solo cuando Blacksmith esté caído, limitado por cuota, le falte el entorno necesario o la capacidad propia sea explícitamente el objetivo:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Bajo presión de AWS, evita `class=beast` a menos que la tarea realmente necesite CPU de clase 48xlarge. Una solicitud `beast` comienza en 192 vCPU y es la forma más fácil de activar una cuota regional de EC2 Spot o On-Demand Standard. El `.crabbox.yaml` propiedad del repositorio usa de forma predeterminada `standard`, varias regiones de capacidad y `capacity.hints: true`, de modo que las concesiones AWS intermediadas imprimen la región/mercado seleccionados, la presión de cuota, la alternativa de Spot y advertencias de clase de alta presión. Usa `fast` para comprobaciones amplias más pesadas, `large` solo después de que standard/fast no sean suficientes, y `beast` solo para carriles excepcionales ligados a CPU, como matrices Docker de suite completa o de todos los Plugin, validación explícita de release/bloqueador, o perfilado de rendimiento con muchos núcleos. No uses `beast` para `pnpm check:changed`, pruebas enfocadas, trabajo solo de documentación, lint/typecheck ordinarios, reproducciones E2E pequeñas o triaje de interrupciones de Blacksmith. Usa `--market on-demand` para el diagnóstico de capacidad, de modo que la fluctuación del mercado Spot no se mezcle con la señal.

`.crabbox.yaml` controla los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions para los carriles de nube propia. Excluye el `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos Git remotos en lugar de sincronizar remotos y almacenes de objetos locales del mantenedor, y excluye artefactos locales de ejecución/compilación que nunca deberían transferirse. `.github/workflows/crabbox-hydrate.yml` controla el checkout, la configuración de Node/pnpm, la recuperación de `origin/main` y la transferencia de entorno no secreta para comandos `crabbox run --id <cbx_id>` de nube propia.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
