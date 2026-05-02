---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no
    - Estás depurando una comprobación fallida de GitHub Actions
    - Está coordinando una ejecución o reejecución de validación de lanzamiento
    - Estás cambiando el despacho de ClawSweeper o el reenvío de actividad de GitHub
summary: Grafo de trabajos de CI, controles de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-05-02T05:21:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2da3014e67b8d2d4bb4c1c9d4c6134eed29309bb176544864df568809ae3ac7
    source_path: ci.md
    workflow: 16
---

OpenClaw CI se ejecuta en cada push a `main` y en cada pull request. El trabajo `preflight` clasifica el diff y desactiva las vías costosas cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y despliegan todo el grafo para candidatos de release y validación amplia. Las vías de Android permanecen opt-in mediante `include_android`. La cobertura de Plugin solo de release vive en el flujo de trabajo separado [`Prerrelanzamiento de Plugin`](#plugin-prerelease) y solo se ejecuta desde [`Validación completa de release`](#full-release-validation) o un despacho manual explícito.

## Resumen del pipeline

| Trabajo                          | Propósito                                                                                    | Cuándo se ejecuta                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Detectar cambios solo de docs, alcances cambiados, extensiones cambiadas y crear el manifiesto de CI | Siempre en pushes y PRs no draft |
| `security-scm-fast`              | Detección de claves privadas y auditoría de flujos de trabajo mediante `zizmor`              | Siempre en pushes y PRs no draft |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias contra avisos de npm                   | Siempre en pushes y PRs no draft |
| `security-fast`                  | Agregado requerido para los trabajos rápidos de seguridad                                    | Siempre en pushes y PRs no draft |
| `check-dependencies`             | Pase de Knip solo de dependencias de producción más la guarda de la allowlist de archivos sin usar | Cambios relevantes para Node      |
| `build-artifacts`                | Compilar `dist/`, Control UI, comprobaciones de artefactos compilados y artefactos downstream reutilizables | Cambios relevantes para Node      |
| `checks-fast-core`               | Vías rápidas de corrección en Linux, como comprobaciones bundled/contrato de Plugin/protocolo | Cambios relevantes para Node      |
| `checks-fast-contracts-channels` | Comprobaciones fragmentadas de contrato de canal con un resultado agregado estable           | Cambios relevantes para Node      |
| `checks-node-core-test`          | Shards de pruebas core de Node, excluyendo vías de canal, bundled, contrato y extensión      | Cambios relevantes para Node      |
| `check`                          | Equivalente fragmentado de la puerta local principal: tipos prod, lint, guardas, tipos de prueba y smoke estricto | Cambios relevantes para Node      |
| `check-additional`               | Arquitectura, límites, guardas de superficie de extensión, límite de paquete y shards de gateway-watch | Cambios relevantes para Node      |
| `build-smoke`                    | Pruebas smoke de la CLI compilada y smoke de memoria de arranque                             | Cambios relevantes para Node      |
| `checks`                         | Verificador para pruebas de canal de artefactos compilados                                   | Cambios relevantes para Node      |
| `checks-node-compat-node22`      | Vía de compilación y smoke de compatibilidad con Node 22                                     | Despacho manual de CI para releases |
| `check-docs`                     | Formato de docs, lint y comprobaciones de enlaces rotos                                      | Docs cambiadas                    |
| `skills-python`                  | Ruff + pytest para skills respaldadas por Python                                             | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Pruebas específicas de proceso/rutas de Windows más regresiones compartidas de especificadores de importación de runtime | Cambios relevantes para Windows   |
| `macos-node`                     | Vía de pruebas TypeScript de macOS usando los artefactos compilados compartidos              | Cambios relevantes para macOS     |
| `macos-swift`                    | Lint, compilación y pruebas de Swift para la app de macOS                                    | Cambios relevantes para macOS     |
| `android`                        | Pruebas unitarias de Android para ambos sabores más una compilación de APK debug             | Cambios relevantes para Android   |
| `test-performance-agent`         | Optimización diaria de pruebas lentas de Codex después de actividad confiable                | Éxito de CI principal o despacho manual |

## Orden fail-fast

1. `preflight` decide qué vías existen. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar los trabajos más pesados de artefactos y matriz de plataformas.
3. `build-artifacts` se solapa con las vías rápidas de Linux para que los consumidores downstream puedan empezar en cuanto la compilación compartida esté lista.
4. Las vías más pesadas de plataforma y runtime se despliegan después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un push más nuevo al mismo PR o ref `main`. Trátalo como ruido de CI salvo que la ejecución más reciente para el mismo ref también esté fallando. Las comprobaciones agregadas de shards usan `!cancelled() && always()` para que sigan informando fallos normales de shards, pero no se encolen después de que todo el flujo de trabajo ya haya sido reemplazado. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones principales más nuevas. Las ejecuciones manuales de suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en progreso.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. El despacho manual omite la detección de changed-scope y hace que el manifiesto de preflight actúe como si cada área con alcance hubiera cambiado.

- Las **ediciones del flujo de trabajo de CI** validan el grafo de CI de Node más el linting de flujos de trabajo, pero no fuerzan por sí solas compilaciones nativas de Windows, Android o macOS; esas vías de plataforma permanecen acotadas a cambios en código fuente de plataforma.
- Las **ediciones solo de enrutamiento de CI, ediciones seleccionadas y baratas de fixtures de pruebas core, y ediciones estrechas de helpers/enrutamiento de pruebas de contrato de Plugin** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una única tarea `checks-fast-core`. Esa ruta omite artefactos de compilación, compatibilidad con Node 22, contratos de canal, shards core completos, shards de plugins bundled y matrices adicionales de guardas cuando el cambio se limita a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- Las **comprobaciones de Node en Windows** se acotan a wrappers específicos de procesos/rutas de Windows, helpers de runner npm/pnpm/UI, configuración del gestor de paquetes y las superficies del flujo de trabajo de CI que ejecutan esa vía; los cambios no relacionados de código fuente, Plugin, install-smoke y solo pruebas permanecen en las vías de Node en Linux.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo se mantenga pequeño sin reservar runners en exceso: los contratos de canal se ejecutan como tres shards ponderados, las vías unitarias core pequeñas se emparejan, auto-reply se ejecuta como cuatro workers equilibrados (con el subárbol reply dividido en shards de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic de Gateway/Plugin se distribuyen entre los trabajos existentes de Node agentic solo de código fuente en lugar de esperar artefactos compilados. Las pruebas amplias de navegador, QA, media y plugins misceláneos usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los shards de patrón de inclusión registran entradas de tiempos usando el nombre del shard de CI, para que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un shard filtrado. `check-additional` mantiene juntas las tareas de compilación/canary de límite de paquete y separa la arquitectura de topología de runtime de la cobertura de gateway watch; el shard de guarda de límites ejecuta sus guardas pequeñas e independientes concurrentemente dentro de un trabajo. Gateway watch, las pruebas de canal y el shard core support-boundary se ejecutan concurrentemente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya están compilados.

Android CI ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego compila el APK debug de Play. El sabor third-party no tiene un source set ni manifiesto separado; su vía de pruebas unitarias aún compila el sabor con las flags BuildConfig de SMS/call-log, mientras evita un trabajo duplicado de empaquetado de APK debug en cada push relevante para Android.

El shard `check-dependencies` ejecuta `pnpm deadcode:dependencies` (un pase de Knip solo de dependencias de producción fijado a la versión más reciente de Knip, con la edad mínima de release de pnpm desactivada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos de producción sin usar de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. La guarda de archivos sin usar falla cuando un PR agrega un nuevo archivo sin usar no revisado o deja una entrada obsoleta en la allowlist, mientras preserva superficies intencionales de Plugin dinámico, generadas, de build, pruebas live y puentes de paquetes que Knip no puede resolver estáticamente.

## Reenvío de actividad de ClawSweeper

`.github/workflows/clawsweeper-dispatch.yml` es el puente del lado destino desde la actividad del repositorio OpenClaw hacia ClawSweeper. No hace checkout ni ejecuta código no confiable de pull requests. El flujo de trabajo crea un token de GitHub App desde `CLAWSWEEPER_APP_PRIVATE_KEY` y luego despacha payloads compactos de `repository_dispatch` a `openclaw/clawsweeper`.

El flujo de trabajo tiene cuatro vías:

- `clawsweeper_item` para solicitudes exactas de revisión de issues y pull requests;
- `clawsweeper_comment` para comandos explícitos de ClawSweeper en comentarios de issues;
- `clawsweeper_commit_review` para solicitudes de revisión a nivel de commit en pushes a `main`;
- `github_activity` para actividad general de GitHub que el agente ClawSweeper puede inspeccionar.

La vía `github_activity` reenvía solo metadatos normalizados: tipo de evento, acción, actor, repositorio, número de elemento, URL, título, estado y extractos cortos de comentarios o revisiones cuando existen. Evita intencionalmente reenviar el cuerpo completo del Webhook. El flujo de trabajo receptor en `openclaw/clawsweeper` es `.github/workflows/github-activity.yml`, que publica el evento normalizado en el hook de OpenClaw Gateway para el agente ClawSweeper.

La actividad general es observación, no entrega por defecto. El agente ClawSweeper recibe el destino de Discord en su prompt y solo debería publicar en `#clawsweeper` cuando el evento sea sorprendente, accionable, riesgoso u operativamente útil. Aperturas rutinarias, ediciones, ruido de bots, ruido de Webhook duplicado y tráfico normal de revisiones deberían dar como resultado `NO_REPLY`.

Trata títulos, comentarios, cuerpos, texto de revisión, nombres de ramas y mensajes de commit de GitHub como datos no confiables en toda esta ruta. Son entrada para resumen y triage, no instrucciones para el flujo de trabajo ni el runtime del agente.

## Despachos manuales

Los despachos manuales de CI ejecutan el mismo grafo de trabajos que la CI normal, pero fuerzan la activación de cada vía con alcance que no sea Android: shards de Node en Linux, shards de plugins bundled, contratos de canal, compatibilidad con Node 22, `check`, `check-additional`, build smoke, comprobaciones de docs, Skills de Python, Windows, macOS e i18n de Control UI. Los despachos manuales independientes de CI ejecutan Android solo con `include_android=true`; el paraguas de release completo habilita Android pasando `include_android=true`. Las comprobaciones estáticas de prerrelanzamiento de Plugin, el shard `agentic-plugins` solo de release, el barrido completo por lotes de extensiones y las vías Docker de prerrelanzamiento de Plugin están excluidas de CI. La suite de prerrelanzamiento de Docker se ejecuta solo cuando `Full Release Validation` despacha el flujo de trabajo separado `Plugin Prerelease` con la puerta de validación de release habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidato de release no sea cancelada por otro push o ejecución de PR en el mismo ref. La entrada opcional `target_ref` permite que un llamador confiable ejecute ese grafo contra una rama, etiqueta o SHA completo de commit mientras usa el archivo de flujo de trabajo del ref de despacho seleccionado.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, trabajos y agregados de seguridad rápidos (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidas, comprobaciones de contrato de canales fragmentadas, fragmentos de `check` excepto lint, fragmentos y agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de documentación, Skills de Python, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu hospedado en GitHub para que la matriz de Blacksmith pueda ponerse en cola antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragmentos de plugins de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de pruebas de Node en Linux, fragmentos de pruebas de plugins incluidos, `android`                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a la CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones Docker de install-smoke (el tiempo de cola de 32 vCPU costaba más de lo que ahorraba)                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |

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
```

## Validación completa de lanzamiento

`Full Release Validation` es el workflow general manual para "ejecutar todo antes del lanzamiento". Acepta una rama, etiqueta o SHA completo de commit, despacha el workflow manual `CI` con ese objetivo, despacha `Plugin Prerelease` para pruebas exclusivas de lanzamiento de plugin/paquete/estático/Docker, y despacha `OpenClaw Release Checks` para humo de instalación, aceptación de paquetes, suites de ruta de lanzamiento de Docker, live/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram. Con `rerun_group=all` y `release_profile=full`, también ejecuta `NPM Telegram Beta E2E` contra el artefacto `release-package-under-test` de las comprobaciones de lanzamiento. Después de publicar, pasa `npm_telegram_package_spec` para volver a ejecutar el mismo carril de paquete de Telegram contra el paquete npm publicado.

Consulta [Validación completa de lanzamiento](/es/reference/full-release-validation) para la
matriz de etapas, los nombres exactos de trabajos de workflow, las diferencias de perfil, los artefactos y los
manejadores de reejecución enfocados.

Para una prueba de commit fijado en una rama que avanza rápido, usa el helper en lugar de
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

Las refs de despacho de workflows de GitHub deben ser ramas o etiquetas, no SHA de commit sin procesar. El
helper sube una rama temporal `release-ci/<sha>-...` en el SHA objetivo,
despacha `Full Release Validation` desde esa ref fijada, verifica que cada
workflow hijo `headSha` coincida con el objetivo y elimina la rama temporal cuando la
ejecución termina. El verificador general también falla si algún workflow hijo se ejecutó en un
SHA diferente.

`release_profile` controla la amplitud live/de proveedor pasada a las comprobaciones de lanzamiento. Los
workflows manuales de lanzamiento usan `stable` por defecto; usa `full` solo cuando
quieras intencionadamente la matriz amplia de proveedores/medios de asesoría.

- `minimum` conserva los carriles críticos de lanzamiento de OpenAI/core más rápidos.
- `stable` añade el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia de proveedores/medios de asesoría.

El general registra los ids de ejecuciones hijas despachadas, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijas y añade tablas de trabajos más lentos para cada ejecución hija. Si un workflow hijo se vuelve a ejecutar y pasa a verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado general y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de lanzamiento, `ci` solo para el hijo de CI completo normal, `plugin-prerelease` solo para el hijo de prelanzamiento de plugin, `release-checks` para todos los hijos de lanzamiento, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el general. Esto mantiene acotada la reejecución de una caja de lanzamiento fallida después de una corrección enfocada.

`OpenClaw Release Checks` usa la ref de workflow de confianza para resolver la ref seleccionada una vez en un tarball `release-package-under-test`, y luego pasa ese artefacto tanto al workflow Docker live/E2E de ruta de lanzamiento como al fragmento de aceptación de paquete. Esto mantiene coherentes los bytes del paquete entre cajas de lanzamiento y evita reempaquetar el mismo candidato en varios trabajos hijos.

Las ejecuciones duplicadas de `Full Release Validation` para `ref=main` y `rerun_group=all`
reemplazan al general anterior. El monitor padre cancela cualquier workflow hijo que
ya haya despachado cuando se cancela el padre, de modo que una validación nueva de main
no queda detrás de una ejecución obsoleta de dos horas de comprobaciones de lanzamiento. La validación de ramas/etiquetas de lanzamiento
y los grupos de reejecución enfocados mantienen `cancel-in-progress: false`.

## Fragmentos live y E2E

El hijo live/E2E de lanzamiento conserva una cobertura nativa amplia de `pnpm test:live`, pero la ejecuta como fragmentos con nombre mediante `scripts/test-live-shard.mjs` en lugar de un único trabajo serial:

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

Esto mantiene la misma cobertura de archivos y hace que los fallos lentos de proveedores live sean más fáciles de reejecutar y diagnosticar. Los nombres de fragmento agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para reejecuciones manuales de una sola vez.

Los fragmentos nativos live de medios se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, construido por el workflow `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en ejecutores Blacksmith normales: los trabajos de contenedor no son el lugar adecuado para lanzar pruebas Docker anidadas.

Los fragmentos live de modelo/backend respaldados por Docker usan una imagen compartida independiente `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit seleccionado. El workflow live de lanzamiento construye y sube esa imagen una vez, y luego los fragmentos de modelo live Docker, Gateway fragmentado por proveedor, backend de CLI, enlace ACP y arnés Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Los fragmentos Docker de Gateway llevan límites explícitos de `timeout` a nivel de script por debajo del timeout del trabajo de workflow, para que un contenedor atascado o una ruta de limpieza falle rápido en lugar de consumir todo el presupuesto de comprobación de lanzamiento. Si esos fragmentos reconstruyen de forma independiente el objetivo Docker de código fuente completo, la ejecución de lanzamiento está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de paquetes

Usa `Package Acceptance` cuando la pregunta sea "¿funciona este paquete instalable de OpenClaw como producto?" Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquetes valida un único tarball mediante el mismo arnés E2E de Docker que los usuarios ejercitan después de instalar o actualizar.

### Trabajos

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime el origen, la referencia de flujo de trabajo, la referencia de paquete, la versión, SHA-256 y el perfil en el resumen de paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El flujo de trabajo reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker de resumen de paquete cuando es necesario y ejecuta los carriles Docker seleccionados contra ese paquete en lugar de empaquetar el checkout del flujo de trabajo. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el flujo de trabajo reutilizable prepara el paquete y las imágenes compartidas una vez, y luego distribuye esos carriles como trabajos Docker dirigidos paralelos con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; un despacho independiente de Telegram todavía puede instalar una especificación npm publicada.
4. `summary` hace fallar el flujo de trabajo si fallaron la resolución de paquete, la aceptación Docker o el carril opcional de Telegram.

### Orígenes de candidatos

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw como `openclaw@2026.4.27-beta.2`. Usa esto para la aceptación beta/estable publicada.
- `source=ref` empaqueta una rama, etiqueta o SHA de commit completo de confianza de `package_ref`. El resolvedor obtiene ramas/etiquetas de OpenClaw, verifica que el commit seleccionado sea alcanzable desde el historial de ramas del repositorio o una etiqueta de lanzamiento, instala dependencias en un árbol de trabajo separado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debe proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de flujo de trabajo/arnés de confianza que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits de origen de confianza más antiguos sin ejecutar lógica de flujo de trabajo antigua.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de lanzamiento Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura de Plugin sin conexión para que la validación de paquetes publicados no dependa de la disponibilidad en vivo de ClawHub. El carril opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, con la ruta de especificación npm publicada conservada para despachos independientes.

Para la política dedicada de pruebas de actualización y Plugin, incluidos comandos locales,
carriles Docker, entradas de Package Acceptance, valores predeterminados de lanzamiento y triaje de fallos,
consulta [Pruebas de actualizaciones y plugins](/es/help/testing-updates-plugins).

Las comprobaciones de lanzamiento llaman a Package Acceptance con `source=artifact`, el artefacto de paquete de lanzamiento preparado, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=release-history`, `published_upgrade_survivor_scenarios=reported-issues` y `telegram_mode=mock-openai`. Esto mantiene la migración de paquetes, la actualización, la limpieza de dependencias de Plugin obsoletas, el Plugin sin conexión, la actualización de Plugin y la prueba de Telegram en el mismo tarball de paquete resuelto. Las comprobaciones de lanzamiento entre sistemas operativos todavía cubren el onboarding específico del SO, el instalador y el comportamiento de plataforma; la validación de producto de paquete/actualización debe comenzar con Package Acceptance. El carril Docker `published-upgrade-survivor` valida una referencia de paquete publicada por ejecución. En Package Acceptance, el tarball resuelto `package-under-test` siempre es el candidato y `published_upgrade_survivor_baseline` selecciona la referencia publicada de reserva, con valor predeterminado `openclaw@latest`; los comandos de nueva ejecución de carriles fallidos conservan esa referencia. Establece `published_upgrade_survivor_baselines=release-history` para expandir el carril por una matriz de historial deduplicada: los últimos seis lanzamientos estables, `2026.4.23` y el último lanzamiento estable anterior a `2026-03-15`. Establece `published_upgrade_survivor_scenarios=reported-issues` para expandir las mismas referencias por fixtures con forma de incidencias para configuración de Feishu, archivos de bootstrap/persona conservados, rutas de registro con tilde y raíces de dependencias de Plugin heredadas obsoletas. El flujo de trabajo separado `Update Migration` usa el carril Docker `update-migration` con `all-since-2026.4.23` y `plugin-deps-cleanup` cuando la pregunta es una limpieza exhaustiva de actualizaciones publicadas, no la amplitud normal de Full Release CI. Las ejecuciones agregadas locales pueden pasar especificaciones exactas de paquetes con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS`, conservar un solo carril con `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` como `openclaw@2026.4.15`, o establecer `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` para la matriz de escenarios. El carril publicado configura la referencia con una receta integrada de comando `openclaw config set`, registra los pasos de receta en `summary.json` y prueba `/healthz`, `/readyz`, además del estado RPC después de iniciar Gateway. Los carriles de Windows empaquetado y de instalador limpio también verifican que un paquete instalado pueda importar una anulación de control de navegador desde una ruta absoluta Windows sin procesar. El smoke de turno de agente OpenAI entre sistemas operativos usa de forma predeterminada `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está establecido; de lo contrario, `openai/gpt-5.5`, para que la prueba de instalación y Gateway permanezca en el modelo de prueba GPT-5 preferido.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas conocidas de QA privadas en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa marca;
- `update-channel-switch` puede podar `pnpm.patchedDependencies` faltantes del fixture git falso derivado del tarball y puede registrar la falta de `update.channel` persistido;
- los smokes de Plugin pueden leer ubicaciones de registro de instalación heredadas o aceptar la falta de persistencia del registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración mientras sigue exigiendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

El paquete publicado `2026.4.26` también puede advertir por archivos de marca de metadatos de compilación local que ya se enviaron. Los paquetes posteriores deben satisfacer los contratos modernos; las mismas condiciones fallan en lugar de advertir u omitirse.

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

Al depurar una ejecución fallida de aceptación de paquetes, empieza por el resumen de `resolve_package` para confirmar el origen del paquete, la versión y SHA-256. Luego inspecciona la ejecución hija de `docker_acceptance` y sus artefactos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de carril, tiempos de fase y comandos de nueva ejecución. Prefiere volver a ejecutar el perfil de paquete fallido o los carriles Docker exactos en lugar de volver a ejecutar la validación completa de lanzamiento.

## Smoke de instalación

El flujo de trabajo separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio trabajo `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies Docker/paquete, cambios de paquete/manifiesto de Plugin incluido o superficies centrales de Plugin/canal/gateway/Plugin SDK que ejercitan los trabajos smoke Docker. Los cambios de Plugin incluido solo de origen, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers Docker. La ruta rápida construye la imagen del Dockerfile raíz una vez, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agentes en espacio de trabajo compartido, ejecuta el e2e gateway-network del contenedor, verifica un argumento de compilación de plugin incluido y ejecuta el perfil Docker acotado de Plugin incluido bajo un tiempo de espera agregado de comando de 240 segundos (cada ejecución Docker de escenario limitada por separado).
- **Ruta completa** conserva la cobertura de instalación de paquete QR y Docker/actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de lanzamiento por workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen smoke GHCR de Dockerfile raíz de SHA objetivo, luego ejecuta instalación de paquete QR, smokes de Dockerfile raíz/Gateway, smokes de instalador/actualización y el E2E Docker rápido de Plugin incluido como trabajos separados para que el trabajo de instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance cambiado solicitaría cobertura completa en un push, el flujo de trabajo conserva el smoke Docker rápido y deja el smoke completo de instalación para la validación nocturna o de lanzamiento.

El smoke lento de proveedor de imagen con instalación global de Bun se controla por separado con `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el flujo de trabajo de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero los pull requests y los pushes a `main` no. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles centrados en la instalación.

## E2E Docker local

`pnpm test:docker:all` preconstruye una imagen compartida de prueba en vivo, empaqueta OpenClaw una vez como tarball npm y construye dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un ejecutor básico de Node/Git para carriles de instalador/actualización/dependencias de Plugin;
- una imagen funcional que instala el mismo tarball en `/app` para carriles de funcionalidad normal.

Las definiciones de carriles Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica de planificador vive en `scripts/lib/docker-e2e-plan.mjs`, y el ejecutor solo ejecuta el plan seleccionado. El programador selecciona la imagen por carril con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta carriles con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes

| Variable                               | Valor predeterminado | Propósito                                                                                       |
| -------------------------------------- | ------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10      | Recuento de espacios del grupo principal para carriles normales.                                                        |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10      | Recuento de espacios del grupo final sensible a proveedores.                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9       | Límite de carriles en vivo concurrentes para que los proveedores no apliquen limitaciones.                                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10      | Límite de carriles concurrentes de instalación de npm.                                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7       | Límite de carriles multiservicio concurrentes.                                                            |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000    | Escalonamiento entre inicios de carriles para evitar tormentas de creación del daemon de Docker; define `0` para no escalonar.     |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000 | Tiempo de espera de respaldo por carril (120 minutos); determinados carriles en vivo/finales usan límites más estrictos.           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin definir   | `1` imprime el plan del planificador sin ejecutar carriles.                                          |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin definir   | Lista exacta de carriles separada por comas; omite la prueba rápida de limpieza para que los agentes puedan reproducir un carril fallido. |

Un carril más pesado que su límite efectivo todavía puede iniciarse desde un grupo vacío y luego ejecutarse solo hasta que libere capacidad. El agregado local realiza comprobaciones previas de Docker, elimina contenedores E2E obsoletos de OpenClaw, emite el estado de los carriles activos, persiste los tiempos de los carriles para el ordenamiento de más largo primero y, de forma predeterminada, deja de planificar nuevos carriles agrupados después del primer fallo.

### Flujo de trabajo reutilizable en vivo/E2E

El flujo de trabajo reutilizable en vivo/E2E pregunta a `scripts/test-docker-all.mjs --plan-json` qué paquete, tipo de imagen, imagen en vivo, carril y cobertura de credenciales se requieren. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. O bien empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila y publica imágenes GHCR Docker E2E básicas/funcionales etiquetadas por digest de paquete mediante la caché de capas de Docker de Blacksmith cuando el plan necesita carriles con paquete instalado; y reutiliza entradas `docker_e2e_bare_image`/`docker_e2e_functional_image` proporcionadas o imágenes existentes por digest de paquete en lugar de recompilar. Las extracciones de imágenes de Docker se reintentan con un tiempo de espera limitado de 180 segundos por intento para que un flujo de registro/caché bloqueado se reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de lanzamiento

La cobertura Docker de lanzamiento ejecuta trabajos fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento extraiga solo el tipo de imagen que necesita y ejecute varios carriles mediante el mismo planificador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Los fragmentos Docker de lanzamiento actuales son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` y de `plugins-runtime-install-a` a `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de plugin/runtime. El alias de carril `install-e2e` sigue siendo el alias agregado de repetición manual para ambos carriles de instalador de proveedor.

OpenWebUI se incorpora a `plugins-runtime-services` cuando la cobertura completa de release-path lo solicita, y conserva un fragmento independiente `openwebui` solo para ejecuciones exclusivas de OpenWebUI. Los carriles de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de carril, tiempos, `summary.json`, `failures.json`, tiempos de fase, JSON del plan del planificador, tablas de carriles lentos y comandos de repetición por carril. La entrada `docker_lanes` del flujo de trabajo ejecuta los carriles seleccionados contra las imágenes preparadas en lugar de los trabajos de fragmentos, lo que mantiene la depuración de carriles fallidos acotada a un trabajo Docker dirigido y prepara, descarga o reutiliza el artefacto de paquete para esa ejecución; si un carril seleccionado es un carril Docker en vivo, el trabajo dirigido compila localmente la imagen de pruebas en vivo para esa repetición. Los comandos generados de repetición por carril en GitHub incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imagen preparadas cuando esos valores existen, para que un carril fallido pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El flujo de trabajo programado en vivo/E2E ejecuta a diario la suite Docker completa de release-path.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un flujo de trabajo separado ejecutado por `Full Release Validation` o por un operador explícito. Las solicitudes de incorporación normales, los envíos a `main` y las ejecuciones manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de plugins incluidos entre ocho workers de extensión; esos trabajos de fragmento de extensión ejecutan hasta dos grupos de configuración de plugins a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de plugins con muchas importaciones no creen trabajos adicionales de CI. La ruta de prelanzamiento Docker exclusiva de lanzamiento agrupa carriles Docker dirigidos en grupos pequeños para evitar reservar decenas de runners para trabajos de uno a tres minutos.

## Laboratorio de QA

El laboratorio de QA tiene carriles dedicados de CI fuera del flujo de trabajo principal con alcance inteligente.

- El flujo de trabajo `Parity gate` se ejecuta en cambios de PR coincidentes y en ejecución manual; compila el runtime privado de QA y compara los paquetes agénticos simulados de GPT-5.5 y Opus 4.6.
- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y en ejecución manual; despliega como trabajos paralelos la puerta de paridad simulada, el carril Matrix en vivo y los carriles Telegram y Discord en vivo. Los trabajos en vivo usan el entorno `qa-live-shared`, y Telegram/Discord usan arrendamientos de Convex.

Las comprobaciones de lanzamiento ejecutan carriles de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos calificados como simulados (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato del canal quede aislado de la latencia del modelo en vivo y del inicio normal del plugin de proveedor. El Gateway de transporte en vivo desactiva la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores está cubierta por las suites separadas de modelo en vivo, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para puertas programadas y de lanzamiento, y añade `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del flujo de trabajo siguen siendo `all`; una ejecución manual `matrix_profile=all` siempre divide la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta los carriles críticos de lanzamiento del laboratorio de QA antes de la aprobación del lanzamiento; su puerta de paridad de QA ejecuta los paquetes candidato y de referencia como trabajos de carril paralelos, y luego descarga ambos artefactos en un trabajo pequeño de informe para la comparación final de paridad.

No pongas la ruta de aterrizaje de PR detrás de `Parity gate` a menos que el cambio realmente toque el runtime de QA, la paridad de paquetes de modelo o una superficie que posea el flujo de trabajo de paridad. Para correcciones normales de canales, configuración, docs o pruebas unitarias, trátalo como una señal opcional y sigue la evidencia de CI/comprobaciones con alcance.

## CodeQL

El flujo de trabajo `CodeQL` es intencionadamente un escáner de seguridad estrecho de primera pasada, no un barrido completo del repositorio. Las ejecuciones diarias, manuales y de protección de solicitudes de incorporación no borrador escanean código de flujos de trabajo de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas por `security-severity` alta/crítica.

La protección de solicitudes de incorporación se mantiene ligera: solo se inicia para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. Android y macOS CodeQL quedan fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                          | Superficie                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Autenticación, secretos, sandbox, cron y línea base de gateway                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales core más el runtime de plugins de canal, gateway, Plugin SDK, secretos y puntos de contacto de auditoría              |
| `/codeql-security-high/network-ssrf-boundary`     | Superficies core de SSRF, análisis de IP, guardia de red, web-fetch y política SSRF de Plugin SDK                                                |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y puertas de ejecución de herramientas de agentes                                           |
| `/codeql-security-high/plugin-trust-boundary`     | Instalación de plugins, loader, manifiesto, registro, instalación del gestor de paquetes, carga de fuentes y superficies de confianza del contrato de paquete de Plugin SDK |

### Fragmentos de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — fragmento programado de seguridad de Android. Compila la app de Android manualmente para CodeQL en el runner Linux más pequeño de Blacksmith aceptado por la cordura del flujo de trabajo. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — fragmento de seguridad de macOS semanal/manual. Compila la app de macOS manualmente para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el fragmento equivalente no relacionado con seguridad. Ejecuta solo consultas de calidad JavaScript/TypeScript sin seguridad y de severidad de error sobre superficies estrechas de alto valor en el runner Linux más pequeño de Blacksmith. Su protección de solicitudes de incorporación es intencionadamente más pequeña que el perfil programado: los PR no borrador solo ejecutan los fragmentos coincidentes `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` y `plugin-sdk-reply-runtime` para cambios en código de ejecución de comandos/modelos/herramientas de agentes y despacho de respuestas, código de esquema/migración/IO de configuración, código de auth/secretos/sandbox/seguridad, runtime de canales core y de plugins de canal incluidos, protocolo de gateway/métodos de servidor, runtime de memoria/pegamento de SDK, MCP/procesos/entrega saliente, runtime de proveedores/catálogo de modelos, diagnósticos de sesión/colas de entrega, loader de plugins, contrato de paquete de Plugin SDK o runtime de respuestas de Plugin SDK. Los cambios en la configuración de CodeQL y en el flujo de trabajo de calidad ejecutan los doce fragmentos de calidad de PR.

La ejecución manual acepta:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son hooks de enseñanza/iteración para ejecutar un fragmento de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Código de límite de seguridad de autenticación, secretos, entorno aislado, Cron y Gateway                                                                                             |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuración, migración, normalización y contratos de E/S                                                                                                                 |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas del protocolo Gateway y contratos de métodos del servidor                                                                                                                    |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación del canal principal y del Plugin de canal incluido                                                                                                         |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuesta automática, y contratos de tiempo de ejecución del plano de control ACP                         |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, ayudantes de supervisión de procesos y contratos de entrega saliente                                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de host de memoria, fachadas de tiempo de ejecución de memoria, alias del SDK de Plugin de memoria, integración de activación del tiempo de ejecución de memoria y comandos doctor de memoria |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de la cola de respuestas, colas de entrega de sesión, ayudantes de vinculación/entrega de sesiones salientes, superficies de eventos de diagnóstico/paquetes de registros y contratos CLI de doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes del SDK de Plugin, ayudantes de carga útil/fragmentación/tiempo de ejecución de respuestas, opciones de respuesta de canal, colas de entrega y ayudantes de vinculación de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización del catálogo de modelos, autenticación y descubrimiento de proveedores, registro de tiempo de ejecución de proveedores, valores predeterminados/catálogos de proveedores y registros web/búsqueda/obtención/incrustación |
| `/codeql-critical-quality/ui-control-plane`             | Arranque de la interfaz de control, persistencia local, flujos de control de Gateway y contratos de tiempo de ejecución del plano de control de tareas                                |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Contratos de tiempo de ejecución de obtención/búsqueda web principal, E/S de medios, comprensión de medios, generación de imágenes y generación de medios                             |
| `/codeql-critical-quality/plugin-boundary`              | Contratos de cargador, registro, superficie pública y puntos de entrada del SDK de Plugin                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Código fuente publicado del SDK de Plugin del lado del paquete y ayudantes de contrato de paquetes de plugins                                                                         |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin ocultar la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe volver a añadirse como trabajo de seguimiento con alcance limitado o fragmentado solo después de que los perfiles estrechos tengan tiempo de ejecución y señal estables.

## Flujos de trabajo de mantenimiento

### Agente de documentación

El flujo de trabajo `Docs Agent` es una vía de mantenimiento de Codex controlada por eventos para mantener la documentación existente alineada con los cambios aterrizados recientemente. No tiene una programación pura: una ejecución correcta de CI por inserción no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por ejecución de flujo de trabajo se omiten cuando `main` ya avanzó o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el intervalo de commits desde el SHA de origen anterior no omitido de Docs Agent hasta el `main` actual, de modo que una ejecución horaria puede cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Agente de rendimiento de pruebas

El flujo de trabajo `Test Performance Agent` es una vía de mantenimiento de Codex controlada por eventos para pruebas lentas. No tiene una programación pura: una ejecución correcta de CI por inserción no bot en `main` puede activarlo, pero se omite si otra invocación por ejecución de flujo de trabajo ya se ejecutó o se está ejecutando ese día UTC. El despacho manual omite esa compuerta de actividad diaria. La vía crea un informe de rendimiento de Vitest agrupado para la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de suite completa y rechaza cambios que reduzcan el recuento base de pruebas aprobadas. Si la línea base tiene pruebas fallidas, Codex solo puede corregir fallos obvios y el informe de suite completa posterior al agente debe aprobarse antes de que se confirme cualquier cambio. Cuando `main` avanza antes de que aterrice la inserción del bot, la vía rebasa el parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta la inserción; los parches obsoletos con conflictos se omiten. Usa Ubuntu hospedado por GitHub para que la acción de Codex pueda mantener la misma postura de seguridad de eliminación de sudo que el agente de documentación.

### PR duplicados después de la fusión

El flujo de trabajo `Duplicate PRs After Merge` es un flujo manual de mantenedor para la limpieza de duplicados después del aterrizaje. De forma predeterminada se ejecuta en modo de simulación y solo cierra los PR enumerados explícitamente cuando `apply=true`. Antes de modificar GitHub, verifica que el PR aterrizado esté fusionado y que cada duplicado tenga una incidencia referenciada compartida o fragmentos modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Compuertas de comprobación local y enrutamiento de cambios

La lógica local de vías modificadas reside en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa compuerta de comprobación local es más estricta con los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan la comprobación de tipos de producción del núcleo y pruebas del núcleo, además de lint/guardas del núcleo;
- los cambios solo de pruebas del núcleo ejecutan solo la comprobación de tipos de pruebas del núcleo, además de lint del núcleo;
- los cambios de producción de extensión ejecutan la comprobación de tipos de producción de extensión y pruebas de extensión, además de lint de extensión;
- los cambios solo de pruebas de extensión ejecutan la comprobación de tipos de pruebas de extensión, además de lint de extensión;
- los cambios públicos del SDK de Plugin o de contrato de Plugin se expanden a la comprobación de tipos de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los incrementos de versión solo de metadatos de lanzamiento ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todas las vías de comprobación.

El enrutamiento local de pruebas modificadas reside en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren asignaciones explícitas y luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega en salas de grupo es una de las asignaciones explícitas: los cambios en la configuración de respuesta visible de grupo, el modo de entrega de respuestas de origen o el prompt de sistema de la herramienta de mensajes pasan por las pruebas de respuestas del núcleo, además de regresiones de entrega de Discord y Slack, para que un cambio predeterminado compartido falle antes de la primera inserción del PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio afecte tanto al arnés que el conjunto mapeado barato no sea un proxy confiable.

## Validación con Testbox

Ejecuta Testbox desde la raíz del repositorio y prefiere una caja calentada nueva para pruebas amplias. Antes de gastar una compuerta lenta en una caja reutilizada, expirada o que acaba de informar una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro de la caja.

La comprobación de cordura falla rápido cuando archivos raíz requeridos como `pnpm-lock.yaml` desaparecieron o cuando `git status --short` muestra al menos 200 eliminaciones rastreadas. Eso normalmente significa que el estado de sincronización remota no es una copia confiable del PR; detén esa caja y calienta una nueva en lugar de depurar el fallo de prueba del producto. Para PR intencionales con eliminaciones grandes, define `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de cordura.

`pnpm testbox:run` también termina una invocación local de la CLI de Blacksmith que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Define `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para deshabilitar esa guarda, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

Crabbox es la segunda ruta de caja remota propiedad del repositorio para pruebas en Linux cuando Blacksmith no está disponible o cuando se prefiere capacidad de nube propia. Calienta una caja, hidrátala mediante el flujo de trabajo del proyecto y luego ejecuta comandos mediante la CLI de Crabbox:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` posee los valores predeterminados de proveedor, sincronización e hidratación de GitHub Actions. Excluye `.git` local para que el checkout hidratado de Actions conserve sus propios metadatos remotos de Git en lugar de sincronizar remotos y almacenes de objetos locales del mantenedor, y excluye artefactos locales de tiempo de ejecución/compilación que nunca deben transferirse. `.github/workflows/crabbox-hydrate.yml` posee el checkout, la configuración de Node/pnpm, la obtención de `origin/main` y la transferencia de entorno no secreto que luego usan como fuente los comandos `crabbox run --id <cbx_id>`.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
