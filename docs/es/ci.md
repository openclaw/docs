---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando una comprobación fallida de GitHub Actions
    - Está coordinando una ejecución o repetición de validación de lanzamiento
summary: Grafo de trabajos de CI, puertas de alcance, paraguas de lanzamiento y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-04-30T05:32:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 80e0edd99f9832bed0c50d2f66b56163e32859e627090e6bf6b9ad7aa5f63d43
    source_path: ci.md
    workflow: 16
---

La CI de OpenClaw se ejecuta en cada push a `main` y en cada pull request. El job `preflight` clasifica el diff y desactiva los carriles costosos cuando solo cambiaron áreas no relacionadas. Las ejecuciones manuales de `workflow_dispatch` omiten intencionalmente el alcance inteligente y despliegan todo el grafo para candidatos de lanzamiento y validación amplia. Los carriles de Android siguen siendo opt-in mediante `include_android`. La cobertura de plugins solo de lanzamiento vive en el flujo de trabajo separado [`Prelanzamiento de Plugin`](#plugin-prerelease) y solo se ejecuta desde [`Validación completa de lanzamiento`](#full-release-validation) o desde un despacho manual explícito.

## Resumen del pipeline

| Job                              | Propósito                                                                                    | Cuándo se ejecuta                 |
| -------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------- |
| `preflight`                      | Detectar cambios solo de docs, alcances cambiados, extensiones cambiadas y construir el manifiesto de CI | Siempre en pushes y PRs que no sean borrador |
| `security-scm-fast`              | Detección de claves privadas y auditoría de flujos de trabajo mediante `zizmor`              | Siempre en pushes y PRs que no sean borrador |
| `security-dependency-audit`      | Auditoría sin dependencias del lockfile de producción contra avisos de npm                   | Siempre en pushes y PRs que no sean borrador |
| `security-fast`                  | Agregado requerido para los jobs rápidos de seguridad                                        | Siempre en pushes y PRs que no sean borrador |
| `check-dependencies`             | Pasada de Knip solo para dependencias de producción más la guarda de la lista permitida de archivos sin usar | Cambios relevantes para Node      |
| `build-artifacts`                | Construir `dist/`, la IU de control, verificaciones de artefactos construidos y artefactos reutilizables para consumidores posteriores | Cambios relevantes para Node      |
| `checks-fast-core`               | Carriles rápidos de corrección en Linux, como verificaciones de paquetes incluidos/contratos de plugins/protocolo | Cambios relevantes para Node      |
| `checks-fast-contracts-channels` | Verificaciones fragmentadas de contratos de canales con un resultado de verificación agregado estable | Cambios relevantes para Node      |
| `checks-node-core-test`          | Fragmentos de pruebas de Node del núcleo, excluyendo carriles de canales, paquetes incluidos, contratos y extensiones | Cambios relevantes para Node      |
| `check`                          | Equivalente fragmentado de la puerta local principal: tipos de producción, lint, guardas, tipos de pruebas y smoke estricto | Cambios relevantes para Node      |
| `check-additional`               | Fragmentos de arquitectura, límites, guardas de superficie de extensiones, límite de paquetes y observación del Gateway | Cambios relevantes para Node      |
| `build-smoke`                    | Pruebas smoke de la CLI construida y smoke de memoria de arranque                            | Cambios relevantes para Node      |
| `checks`                         | Verificador para pruebas de canales con artefactos construidos                               | Cambios relevantes para Node      |
| `checks-node-compat-node22`      | Carril de build y smoke de compatibilidad con Node 22                                        | Despacho manual de CI para lanzamientos |
| `check-docs`                     | Formato, lint y verificaciones de enlaces rotos de docs                                      | Docs cambiados                    |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                             | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Pruebas específicas de procesos/rutas de Windows más regresiones compartidas de especificadores de importación en tiempo de ejecución | Cambios relevantes para Windows   |
| `macos-node`                     | Carril de pruebas de TypeScript en macOS usando los artefactos construidos compartidos        | Cambios relevantes para macOS     |
| `macos-swift`                    | Lint, build y pruebas de Swift para la app de macOS                                          | Cambios relevantes para macOS     |
| `android`                        | Pruebas unitarias de Android para ambos sabores más una build de APK de depuración           | Cambios relevantes para Android   |
| `test-performance-agent`         | Optimización diaria de pruebas lentas de Codex después de actividad confiable                | Éxito de CI principal o despacho manual |

## Orden de fallo rápido

1. `preflight` decide qué carriles existen realmente. La lógica de `docs-scope` y `changed-scope` son pasos dentro de este job, no jobs independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápido sin esperar a los jobs más pesados de artefactos y matriz de plataformas.
3. `build-artifacts` se solapa con los carriles rápidos de Linux para que los consumidores posteriores puedan empezar en cuanto la build compartida esté lista.
4. Los carriles más pesados de plataforma y tiempo de ejecución se despliegan después: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

GitHub puede marcar jobs reemplazados como `cancelled` cuando llega un push más nuevo al mismo PR o ref de `main`. Trátalo como ruido de CI a menos que la ejecución más nueva para el mismo ref también esté fallando. Las verificaciones agregadas de fragmentos usan `!cancelled() && always()` para que sigan informando fallos normales de fragmentos, pero no se encolen después de que todo el flujo de trabajo ya haya sido reemplazado. La clave automática de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones principales más nuevas. Las ejecuciones manuales de la suite completa usan `CI-manual-v1-*` y no cancelan ejecuciones en curso.

## Alcance y enrutamiento

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`. El despacho manual omite la detección de alcance cambiado y hace que el manifiesto de preflight actúe como si todas las áreas con alcance hubieran cambiado.

- **Las ediciones del flujo de trabajo de CI** validan el grafo de CI de Node más el linting del flujo de trabajo, pero no fuerzan por sí solas builds nativas de Windows, Android o macOS; esos carriles de plataforma siguen limitados a cambios en el código fuente de plataforma.
- **Las ediciones solo de enrutamiento de CI, ediciones seleccionadas de fixtures baratas de pruebas del núcleo y ediciones estrechas de helpers/enrutamiento de pruebas de contratos de plugins** usan una ruta rápida de manifiesto solo de Node: `preflight`, seguridad y una única tarea `checks-fast-core`. Esa ruta omite artefactos de build, compatibilidad con Node 22, contratos de canales, fragmentos completos del núcleo, fragmentos de plugins incluidos y matrices adicionales de guardas cuando el cambio está limitado a las superficies de enrutamiento o helpers que la tarea rápida ejercita directamente.
- **Las verificaciones de Node en Windows** se limitan a wrappers de procesos/rutas específicos de Windows, helpers de runner de npm/pnpm/IU, configuración del gestor de paquetes y las superficies del flujo de trabajo de CI que ejecutan ese carril; los cambios no relacionados de código fuente, plugins, install-smoke y solo pruebas permanecen en los carriles de Node en Linux.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada job se mantenga pequeño sin reservar en exceso los runners: los contratos de canales se ejecutan como tres fragmentos ponderados, los carriles unitarios pequeños del núcleo se emparejan, auto-reply se ejecuta como cuatro workers equilibrados (con el subárbol de reply dividido en fragmentos de agent-runner, dispatch y commands/state-routing), y las configuraciones agentic de Gateway/plugins se distribuyen entre los jobs de Node agentic existentes solo de código fuente en lugar de esperar a los artefactos construidos. Las pruebas amplias de navegador, QA, medios y plugins misceláneos usan sus configuraciones dedicadas de Vitest en lugar del catch-all compartido de plugins. Los fragmentos con patrones de inclusión registran entradas de tiempo usando el nombre del fragmento de CI, de modo que `.artifacts/vitest-shard-timings.json` pueda distinguir una configuración completa de un fragmento filtrado. `check-additional` mantiene juntas las tareas de compilación/canary de límites de paquetes y separa la arquitectura de topología de tiempo de ejecución de la cobertura de observación del Gateway; el fragmento de guarda de límites ejecuta sus pequeñas guardas independientes de forma concurrente dentro de un job. La observación del Gateway, las pruebas de canales y el fragmento de límites de soporte del núcleo se ejecutan de forma concurrente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén construidos.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest` y luego construye el APK de depuración Play. El sabor de terceros no tiene un source set ni manifiesto separados; su carril de pruebas unitarias sigue compilando el sabor con las flags de BuildConfig de SMS/registro de llamadas, mientras evita un job duplicado de empaquetado de APK de depuración en cada push relevante para Android.

El fragmento `check-dependencies` ejecuta `pnpm deadcode:dependencies` (una pasada de Knip solo para dependencias de producción fijada a la versión más reciente de Knip, con la edad mínima de lanzamiento de pnpm desactivada para la instalación `dlx`) y `pnpm deadcode:unused-files`, que compara los hallazgos de archivos de producción sin usar de Knip contra `scripts/deadcode-unused-files.allowlist.mjs`. La guarda de archivos sin usar falla cuando un PR agrega un nuevo archivo sin usar no revisado o deja una entrada obsoleta en la lista permitida, a la vez que conserva superficies intencionales de plugins dinámicos, generadas, de build, de live-test y de puentes de paquetes que Knip no puede resolver estáticamente.

## Despachos manuales

Los despachos manuales de CI ejecutan el mismo grafo de jobs que la CI normal, pero fuerzan la activación de todos los carriles con alcance que no sean Android: fragmentos de Node en Linux, fragmentos de plugins incluidos, contratos de canales, compatibilidad con Node 22, `check`, `check-additional`, build smoke, verificaciones de docs, Skills de Python, Windows, macOS e i18n de la IU de control. Los despachos manuales independientes de CI ejecutan Android solo con `include_android=true`; el paraguas completo de lanzamiento habilita Android pasando `include_android=true`. Las verificaciones estáticas de prelanzamiento de plugins, el fragmento `agentic-plugins` solo de lanzamiento, el barrido completo por lotes de extensiones y los carriles Docker de prelanzamiento de plugins están excluidos de CI. La suite Docker de prelanzamiento se ejecuta solo cuando `Full Release Validation` despacha el flujo de trabajo separado `Plugin Prerelease` con la puerta de validación de lanzamiento habilitada.

Las ejecuciones manuales usan un grupo de concurrencia único para que una suite completa de candidato de lanzamiento no sea cancelada por otro push o ejecución de PR en el mismo ref. La entrada opcional `target_ref` permite que un llamador confiable ejecute ese grafo contra una rama, etiqueta o SHA completo de commit usando el archivo de flujo de trabajo del ref de despacho seleccionado.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runners

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, trabajos de seguridad rápidos y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidas, comprobaciones fragmentadas de contratos de canal, fragmentos de `check` excepto lint, fragmentos y agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de documentación, Skills de Python, workflow-sanity, labeler, auto-response; la preflight de install-smoke también usa Ubuntu hospedado en GitHub para que la matriz de Blacksmith pueda ponerse en cola antes |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, fragmentos de Plugin de menor peso, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` y `check-test-types`                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de pruebas de Linux Node, fragmentos de pruebas de Plugin incluido, `android`                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban); compilaciones de Docker de install-smoke (el coste de tiempo de cola de 32 vCPU fue mayor que lo que ahorró)                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                          |

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

## Validación completa de versión

`Full Release Validation` es el workflow paraguas manual para "ejecutar todo antes de la versión". Acepta una rama, etiqueta o SHA de commit completo, despacha el workflow manual `CI` con ese destino, despacha `Plugin Prerelease` para la prueba exclusiva de versión de Plugin/paquete/estática/Docker, y despacha `OpenClaw Release Checks` para install smoke, aceptación de paquete, suites de ruta de versión de Docker, live/E2E, OpenWebUI, paridad de QA Lab, Matrix y carriles de Telegram. También puede ejecutar el workflow posterior a la publicación `NPM Telegram Beta E2E` cuando se proporciona una especificación de paquete publicada.

`release_profile` controla la amplitud live/proveedor pasada a las comprobaciones de versión:

- `minimum` conserva los carriles críticos de versión de OpenAI/core más rápidos.
- `stable` añade el conjunto estable de proveedores/backends.
- `full` ejecuta la matriz amplia consultiva de proveedores/medios.

El paraguas registra los ids de ejecución de los workflows hijo despachados, y el trabajo final `Verify full validation` vuelve a comprobar las conclusiones actuales de las ejecuciones hijo y añade tablas de trabajos más lentos para cada ejecución hijo. Si un workflow hijo se vuelve a ejecutar y queda en verde, vuelve a ejecutar solo el trabajo verificador padre para actualizar el resultado del paraguas y el resumen de tiempos.

Para recuperación, tanto `Full Release Validation` como `OpenClaw Release Checks` aceptan `rerun_group`. Usa `all` para un candidato de versión, `ci` solo para el hijo de CI completo normal, `release-checks` para cada hijo de versión, o un grupo más estrecho: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` o `npm-telegram` en el paraguas. Esto mantiene acotada la nueva ejecución de una caja de versión fallida después de una corrección enfocada.

`OpenClaw Release Checks` usa la ref de workflow confiable para resolver la ref seleccionada una vez en un tarball `release-package-under-test`, y luego pasa ese artefacto tanto al workflow Docker de ruta de versión live/E2E como al fragmento de aceptación de paquete. Eso mantiene consistentes los bytes del paquete entre cajas de versión y evita reempaquetar el mismo candidato en varios trabajos hijo.

## Fragmentos live y E2E

El hijo live/E2E de versión mantiene cobertura amplia nativa de `pnpm test:live`, pero la ejecuta como fragmentos con nombre mediante `scripts/test-live-shard.mjs` en lugar de un trabajo serial:

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
- fragmentos divididos de medios de audio/vídeo y fragmentos de música filtrados por proveedor

Eso conserva la misma cobertura de archivos y facilita volver a ejecutar y diagnosticar fallos lentos de proveedores live. Los nombres de fragmento agregados `native-live-extensions-o-z`, `native-live-extensions-media` y `native-live-extensions-media-music` siguen siendo válidos para nuevas ejecuciones manuales de una sola vez.

Los fragmentos nativos de medios live se ejecutan en `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, compilado por el workflow `Live Media Runner Image`. Esa imagen preinstala `ffmpeg` y `ffprobe`; los trabajos de medios solo verifican los binarios antes de la configuración. Mantén las suites live respaldadas por Docker en ejecutores normales de Blacksmith: los trabajos de contenedor son el lugar equivocado para lanzar pruebas Docker anidadas.

Los fragmentos live de modelo/backend respaldados por Docker usan una imagen compartida separada `ghcr.io/openclaw/openclaw-live-test:<sha>` por commit seleccionado. El workflow live de versión compila y publica esa imagen una vez, y luego los fragmentos de modelo live Docker, Gateway, backend de CLI, enlace ACP y arnés Codex se ejecutan con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Si esos fragmentos reconstruyen independientemente el destino Docker de código fuente completo, la ejecución de versión está mal configurada y desperdiciará tiempo de reloj en compilaciones de imagen duplicadas.

## Aceptación de paquete

Usa `Package Acceptance` cuando la pregunta sea "¿funciona este paquete instalable de OpenClaw como producto?". Es diferente de la CI normal: la CI normal valida el árbol de código fuente, mientras que la aceptación de paquete valida un único tarball mediante el mismo arnés Docker E2E que los usuarios ejercitan después de instalar o actualizar.

### Trabajos

1. `resolve_package` hace checkout de `workflow_ref`, resuelve un candidato de paquete, escribe `.artifacts/docker-e2e-package/openclaw-current.tgz`, escribe `.artifacts/docker-e2e-package/package-candidate.json`, sube ambos como el artefacto `package-under-test` e imprime la fuente, la ref de workflow, la ref de paquete, la versión, el SHA-256 y el perfil en el resumen de paso de GitHub.
2. `docker_acceptance` llama a `openclaw-live-and-e2e-checks-reusable.yml` con `ref=workflow_ref` y `package_artifact_name=package-under-test`. El workflow reutilizable descarga ese artefacto, valida el inventario del tarball, prepara imágenes Docker de digest de paquete cuando hace falta y ejecuta los carriles Docker seleccionados contra ese paquete en lugar de empaquetar el checkout del workflow. Cuando un perfil selecciona varios `docker_lanes` dirigidos, el workflow reutilizable prepara el paquete y las imágenes compartidas una vez, y luego despliega esos carriles como trabajos Docker dirigidos paralelos con artefactos únicos.
3. `package_telegram` llama opcionalmente a `NPM Telegram Beta E2E`. Se ejecuta cuando `telegram_mode` no es `none` e instala el mismo artefacto `package-under-test` cuando Package Acceptance resolvió uno; un despacho independiente de Telegram aún puede instalar una especificación npm publicada.
4. `summary` falla el workflow si fallaron la resolución del paquete, la aceptación Docker o el carril opcional de Telegram.

### Fuentes candidatas

- `source=npm` acepta solo `openclaw@beta`, `openclaw@latest` o una versión exacta de lanzamiento de OpenClaw, como `openclaw@2026.4.27-beta.2`. Usa esto para la aceptación beta/estable publicada.
- `source=ref` empaqueta una rama, etiqueta o SHA completo de commit de `package_ref` de confianza. El resolvedor obtiene ramas/etiquetas de OpenClaw, verifica que se pueda llegar al commit seleccionado desde el historial de ramas del repositorio o desde una etiqueta de lanzamiento, instala dependencias en un worktree separado y lo empaqueta con `scripts/package-openclaw-for-docker.mjs`.
- `source=url` descarga un `.tgz` HTTPS; `package_sha256` es obligatorio.
- `source=artifact` descarga un `.tgz` desde `artifact_run_id` y `artifact_name`; `package_sha256` es opcional, pero debería proporcionarse para artefactos compartidos externamente.

Mantén `workflow_ref` y `package_ref` separados. `workflow_ref` es el código de workflow/arnés de confianza que ejecuta la prueba. `package_ref` es el commit de origen que se empaqueta cuando `source=ref`. Esto permite que el arnés de pruebas actual valide commits de origen confiables más antiguos sin ejecutar lógica de workflow antigua.

### Perfiles de suite

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `bundled-channel-deps-compat`, `plugins-offline`, `plugin-update`
- `product` — `package` más `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — fragmentos completos de la ruta de lanzamiento Docker con OpenWebUI
- `custom` — `docker_lanes` exactos; obligatorio cuando `suite_profile=custom`

El perfil `package` usa cobertura offline de plugins para que la validación de paquetes publicados no dependa de la disponibilidad en vivo de ClawHub. La ruta opcional de Telegram reutiliza el artefacto `package-under-test` en `NPM Telegram Beta E2E`, con la ruta de especificación npm publicada conservada para ejecuciones independientes.

Las comprobaciones de lanzamiento llaman a Package Acceptance con `source=ref`, `package_ref=<release-ref>`, `workflow_ref=<release workflow ref>`, `suite_profile=custom`, `docker_lanes='bundled-channel-deps-compat plugins-offline'` y `telegram_mode=mock-openai`. Los fragmentos Docker de la ruta de lanzamiento cubren las rutas superpuestas de paquete/actualización/plugin; Package Acceptance mantiene la prueba de compatibilidad de canales incluidos nativa del artefacto, el plugin offline y Telegram contra el mismo tarball de paquete resuelto. Las comprobaciones de lanzamiento entre sistemas operativos siguen cubriendo el onboarding específico del sistema operativo, el instalador y el comportamiento de la plataforma; la validación de producto de paquete/actualización debería empezar con Package Acceptance. Las rutas nuevas de paquete e instalador en Windows también verifican que un paquete instalado pueda importar una sobrescritura de control del navegador desde una ruta absoluta Windows sin procesar. El smoke entre sistemas operativos del turno de agente de OpenAI usa por defecto `OPENCLAW_CROSS_OS_OPENAI_MODEL` cuando está definido; de lo contrario, `openai/gpt-5.4-mini`, para que la prueba de instalación y Gateway se mantenga rápida y determinista.

### Ventanas de compatibilidad heredada

Package Acceptance tiene ventanas acotadas de compatibilidad heredada para paquetes ya publicados. Los paquetes hasta `2026.4.25`, incluido `2026.4.25-beta.*`, pueden usar la ruta de compatibilidad:

- las entradas privadas conocidas de QA en `dist/postinstall-inventory.json` pueden apuntar a archivos omitidos del tarball;
- `doctor-switch` puede omitir el subcaso de persistencia `gateway install --wrapper` cuando el paquete no expone esa marca;
- `update-channel-switch` puede podar `pnpm.patchedDependencies` faltantes del fixture git falso derivado del tarball y puede registrar `update.channel` persistido faltante;
- los smokes de plugins pueden leer ubicaciones heredadas de registros de instalación o aceptar la persistencia faltante del registro de instalación del marketplace;
- `plugin-update` puede permitir la migración de metadatos de configuración y seguir exigiendo que el registro de instalación y el comportamiento sin reinstalación permanezcan sin cambios.

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

Al depurar una ejecución fallida de aceptación de paquete, empieza por el resumen de `resolve_package` para confirmar el origen, la versión y el SHA-256 del paquete. Luego inspecciona la ejecución hija `docker_acceptance` y sus artefactos Docker: `.artifacts/docker-tests/**/summary.json`, `failures.json`, registros de ruta, tiempos de fase y comandos de repetición. Prefiere volver a ejecutar el perfil de paquete fallido o las rutas Docker exactas en lugar de volver a ejecutar toda la validación de lanzamiento.

## Smoke de instalación

El workflow separado `Install Smoke` reutiliza el mismo script de alcance mediante su propio job `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`.

- **Ruta rápida** se ejecuta para pull requests que tocan superficies Docker/paquete, cambios de paquete/manifiesto de plugin incluido o superficies principales de plugin/canal/Gateway/Plugin SDK que ejercitan los jobs de smoke Docker. Los cambios solo de origen en plugins incluidos, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers Docker. La ruta rápida compila una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta el smoke de CLI de eliminación de agentes en workspace compartido, ejecuta el e2e de gateway-network del contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil Docker acotado de plugins incluidos con un timeout agregado de comando de 240 segundos (cada ejecución Docker de escenario está limitada por separado).
- **Ruta completa** conserva la instalación de paquete QR y la cobertura Docker/actualización del instalador para ejecuciones nocturnas programadas, despachos manuales, comprobaciones de lanzamiento por workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. En modo completo, install-smoke prepara o reutiliza una imagen de smoke GHCR del Dockerfile raíz de SHA objetivo, luego ejecuta la instalación de paquete QR, smokes del Dockerfile raíz/Gateway, smokes de instalador/actualización y el E2E Docker rápido de plugins incluidos como jobs separados para que el trabajo del instalador no espere detrás de los smokes de la imagen raíz.

Los pushes a `main` (incluidos los commits de merge) no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el workflow mantiene el smoke Docker rápido y deja el smoke completo de instalación para la validación nocturna o de lanzamiento.

El smoke lento de proveedor de imagen con instalación global de Bun está regulado por separado mediante `run_bun_global_install_smoke`. Se ejecuta en la programación nocturna y desde el workflow de comprobaciones de lanzamiento, y los despachos manuales de `Install Smoke` pueden optar por incluirlo, pero los pull requests y los pushes a `main` no. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles centrados en instalación.

## E2E Docker local

`pnpm test:docker:all` precompila una imagen compartida de prueba en vivo, empaqueta OpenClaw una vez como tarball npm y compila dos imágenes compartidas de `scripts/e2e/Dockerfile`:

- un ejecutor Node/Git básico para rutas de instalador/actualización/dependencias de plugins;
- una imagen funcional que instala el mismo tarball en `/app` para rutas de funcionalidad normal.

Las definiciones de rutas Docker viven en `scripts/lib/docker-e2e-scenarios.mjs`, la lógica del planificador vive en `scripts/lib/docker-e2e-plan.mjs` y el ejecutor solo ejecuta el plan seleccionado. El programador selecciona la imagen por ruta con `OPENCLAW_DOCKER_E2E_BARE_IMAGE` y `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`, luego ejecuta rutas con `OPENCLAW_SKIP_DOCKER_BUILD=1`.

### Ajustes configurables

| Variable                               | Predeterminado | Propósito                                                                                     |
| -------------------------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10             | Cantidad de ranuras del pool principal para rutas normales.                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10             | Cantidad de ranuras del pool final sensible a proveedores.                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9              | Límite de rutas en vivo concurrentes para que los proveedores no apliquen throttling.         |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10             | Límite de rutas de instalación npm concurrentes.                                              |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7              | Límite de rutas multiservicio concurrentes.                                                   |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000           | Escalonamiento entre inicios de rutas para evitar tormentas de creación del daemon Docker; establece `0` para no escalonar. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000        | Timeout de reserva por ruta (120 minutos); las rutas en vivo/finales seleccionadas usan límites más estrictos. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | sin definir    | `1` imprime el plan del programador sin ejecutar rutas.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | sin definir    | Lista exacta de rutas separadas por comas; omite el smoke de limpieza para que los agentes puedan reproducir una ruta fallida. |

Una ruta más pesada que su límite efectivo todavía puede iniciar desde un pool vacío y luego se ejecuta sola hasta que libera capacidad. Los preflights agregados locales verifican Docker, eliminan contenedores E2E obsoletos de OpenClaw, emiten estado de rutas activas, persisten tiempos de ruta para ordenar de mayor a menor duración y, de forma predeterminada, dejan de programar nuevas rutas agrupadas tras el primer fallo.

### Workflow reutilizable en vivo/E2E

El workflow reutilizable en vivo/E2E pregunta a `scripts/test-docker-all.mjs --plan-json` qué cobertura de paquete, tipo de imagen, imagen en vivo, ruta y credenciales se requiere. Luego `scripts/docker-e2e.mjs` convierte ese plan en salidas y resúmenes de GitHub. Empaqueta OpenClaw mediante `scripts/package-openclaw-for-docker.mjs`, descarga un artefacto de paquete de la ejecución actual o descarga un artefacto de paquete desde `package_artifact_run_id`; valida el inventario del tarball; compila e inserta imágenes GHCR Docker E2E básicas/funcionales etiquetadas por digest de paquete mediante la caché de capas Docker de Blacksmith cuando el plan necesita rutas con paquete instalado; y reutiliza las entradas proporcionadas `docker_e2e_bare_image`/`docker_e2e_functional_image` o imágenes existentes por digest de paquete en lugar de recompilar. Los pulls de imágenes Docker se reintentan con un timeout acotado de 180 segundos por intento para que un flujo de registro/caché bloqueado reintente rápido en lugar de consumir la mayor parte de la ruta crítica de CI.

### Fragmentos de ruta de lanzamiento

La cobertura Docker de lanzamiento ejecuta jobs fragmentados más pequeños con `OPENCLAW_SKIP_DOCKER_BUILD=1` para que cada fragmento descargue solo el tipo de imagen que necesita y ejecute varias rutas mediante el mismo programador ponderado:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h | bundled-channels`

Los fragmentos Docker de la versión actual son `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services`, `plugins-runtime-install-a` hasta `plugins-runtime-install-h`, `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-discord`, `bundled-channels-update-b` y `bundled-channels-contracts`. El fragmento agregado `bundled-channels` sigue disponible para repeticiones manuales de una sola vez, y `plugins-runtime-core`, `plugins-runtime` y `plugins-integrations` siguen siendo alias agregados de plugin/runtime. El alias de vía `install-e2e` sigue siendo el alias agregado de repetición manual para ambas vías de instaladores de proveedores. El fragmento `bundled-channels` ejecuta vías divididas `bundled-channel-*` y `bundled-channel-update-*` en lugar de la vía serial todo en uno `bundled-channel-deps`.

OpenWebUI se integra en `plugins-runtime-services` cuando la cobertura completa de la ruta de lanzamiento lo solicita, y conserva un fragmento independiente `openwebui` solo para despachos exclusivos de OpenWebUI. Las vías de actualización de canales incluidos reintentan una vez ante fallos transitorios de red de npm.

Cada fragmento sube `.artifacts/docker-tests/` con registros de vías, tiempos, `summary.json`, `failures.json`, tiempos de fases, JSON del planificador, tablas de vías lentas y comandos de repetición por vía. La entrada `docker_lanes` del flujo de trabajo ejecuta las vías seleccionadas contra las imágenes preparadas en lugar de los trabajos de fragmentos, lo que mantiene la depuración de vías fallidas acotada a un trabajo Docker dirigido y prepara, descarga o reutiliza el artefacto del paquete para esa ejecución; si una vía seleccionada es una vía Docker en vivo, el trabajo dirigido compila localmente la imagen de pruebas en vivo para esa repetición. Los comandos generados de GitHub para repetir por vía incluyen `package_artifact_run_id`, `package_artifact_name` y entradas de imágenes preparadas cuando esos valores existen, de modo que una vía fallida pueda reutilizar el paquete y las imágenes exactos de la ejecución fallida.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

El flujo de trabajo programado en vivo/E2E ejecuta a diario la suite Docker completa de la ruta de lanzamiento.

## Prelanzamiento de Plugin

`Plugin Prerelease` es una cobertura de producto/paquete más costosa, por lo que es un flujo de trabajo separado despachado por `Full Release Validation` o por un operador explícito. Las pull requests normales, los pushes a `main` y los despachos manuales independientes de CI mantienen esa suite desactivada. Equilibra las pruebas de plugins incluidos entre ocho workers de extensiones; esos trabajos de shards de extensiones ejecutan hasta dos grupos de configuración de plugins a la vez con un worker de Vitest por grupo y un heap de Node más grande para que los lotes de plugins con muchas importaciones no creen trabajos adicionales de CI.

## Laboratorio de QA

El laboratorio de QA tiene vías dedicadas de CI fuera del flujo de trabajo principal con alcance inteligente.

- El flujo de trabajo `Parity gate` se ejecuta en cambios coincidentes de PR y en despacho manual; compila el runtime privado de QA y compara los paquetes agénticos simulados de GPT-5.5 y Opus 4.6.
- El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y en despacho manual; despliega en abanico la compuerta de paridad simulada, la vía Matrix en vivo y las vías Telegram y Discord en vivo como trabajos paralelos. Los trabajos en vivo usan el entorno `qa-live-shared`, y Telegram/Discord usan leases de Convex.

Las comprobaciones de lanzamiento ejecutan las vías de transporte en vivo de Matrix y Telegram con el proveedor simulado determinista y modelos calificados como simulados (`mock-openai/gpt-5.5` y `mock-openai/gpt-5.5-alt`) para que el contrato del canal quede aislado de la latencia de modelos en vivo y del inicio normal de plugins de proveedor. El Gateway de transporte en vivo desactiva la búsqueda de memoria porque la paridad de QA cubre el comportamiento de memoria por separado; la conectividad de proveedores está cubierta por las suites separadas de modelo en vivo, proveedor nativo y proveedor Docker.

Matrix usa `--profile fast` para compuertas programadas y de lanzamiento, y agrega `--fail-fast` solo cuando la CLI extraída lo admite. El valor predeterminado de la CLI y la entrada manual del flujo de trabajo siguen siendo `all`; el despacho manual `matrix_profile=all` siempre divide la cobertura completa de Matrix en trabajos `transport`, `media`, `e2ee-smoke`, `e2ee-deep` y `e2ee-cli`.

`OpenClaw Release Checks` también ejecuta las vías críticas de lanzamiento del laboratorio de QA antes de la aprobación del lanzamiento; su compuerta de paridad de QA ejecuta los paquetes candidato y base como trabajos de vías paralelas, luego descarga ambos artefactos en un pequeño trabajo de informe para la comparación final de paridad.

No pongas la ruta de integración de PR detrás de `Parity gate` a menos que el cambio realmente toque el runtime de QA, la paridad de paquetes de modelos o una superficie propiedad del flujo de trabajo de paridad. Para correcciones normales de canales, configuración, documentación o pruebas unitarias, trátalo como una señal opcional y sigue la evidencia de CI/comprobaciones con alcance.

## CodeQL

El flujo de trabajo `CodeQL` es intencionalmente un escáner de seguridad estrecho de primera pasada, no el barrido completo del repositorio. Las ejecuciones diarias, manuales y de protección de pull requests que no son borrador escanean código de flujos de trabajo de Actions más las superficies JavaScript/TypeScript de mayor riesgo con consultas de seguridad de alta confianza filtradas por `security-severity` alta/crítica.

La protección de pull requests se mantiene ligera: solo empieza para cambios bajo `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` o `src`, y ejecuta la misma matriz de seguridad de alta confianza que el flujo de trabajo programado. Android y macOS CodeQL quedan fuera de los valores predeterminados de PR.

### Categorías de seguridad

| Categoría                                         | Superficie                                                                                                                            |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, secretos, sandbox, cron y línea base del gateway                                                                                |
| `/codeql-security-high/channel-runtime-boundary`  | Contratos de implementación de canales del core más runtime de plugins de canal, gateway, Plugin SDK, secretos, puntos de auditoría  |
| `/codeql-security-high/network-ssrf-boundary`     | Core SSRF, análisis de IP, guardia de red, web-fetch y superficies de política SSRF de Plugin SDK                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | Servidores MCP, helpers de ejecución de procesos, entrega saliente y compuertas de ejecución de herramientas de agentes              |
| `/codeql-security-high/plugin-trust-boundary`     | Instalación de Plugin, loader, manifiesto, registro, preparación de dependencias de runtime, carga de fuentes y superficies de confianza del contrato de paquete de Plugin SDK |

### Shards de seguridad específicos de plataforma

- `CodeQL Android Critical Security` — shard programado de seguridad de Android. Compila manualmente la app de Android para CodeQL en el runner Blacksmith Linux más pequeño aceptado por la sanidad del flujo de trabajo. Sube bajo `/codeql-critical-security/android`.
- `CodeQL macOS Critical Security` — shard semanal/manual de seguridad de macOS. Compila manualmente la app de macOS para CodeQL en Blacksmith macOS, filtra los resultados de compilación de dependencias fuera del SARIF subido y sube bajo `/codeql-critical-security/macos`. Se mantiene fuera de los valores predeterminados diarios porque la compilación de macOS domina el tiempo de ejecución incluso cuando está limpia.

### Categorías de calidad crítica

`CodeQL Critical Quality` es el shard correspondiente no relacionado con seguridad. Ejecuta únicamente consultas de calidad JavaScript/TypeScript de severidad de error y no relacionadas con seguridad sobre superficies estrechas de alto valor en el runner Blacksmith Linux más pequeño. Su protección de pull requests es intencionalmente más pequeña que el perfil programado: las PR que no son borrador solo ejecutan los shards de calidad coincidentes `channel-runtime-boundary`, `gateway-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `plugin-boundary` y `plugin-sdk-package-contract` para cambios de runtime de canal, protocolo/método de servidor de gateway, MCP/proceso/entrega saliente, runtime de proveedor/catálogo de modelos, loader de Plugin, Plugin SDK o contrato de paquete. Los cambios de configuración de CodeQL y de flujo de trabajo de calidad ejecutan los seis shards de calidad de PR.

El despacho manual acepta:

```
profile=all|channel-runtime-boundary|gateway-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Los perfiles estrechos son ganchos de enseñanza/iteración para ejecutar un shard de calidad de forma aislada.

| Categoría                                               | Superficie                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, secretos, sandbox, cron y código del límite de seguridad del gateway                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Esquema de configuración, migración, normalización y contratos de IO                                                                                              |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Esquemas del protocolo Gateway y contratos de métodos de servidor                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Contratos de implementación de canales del core                                                                                                                   |
| `/codeql-critical-quality/agent-runtime-boundary`       | Ejecución de comandos, despacho de modelos/proveedores, despacho y colas de respuesta automática, y contratos de runtime del plano de control ACP                  |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | Servidores MCP y puentes de herramientas, helpers de supervisión de procesos y contratos de entrega saliente                                                       |
| `/codeql-critical-quality/memory-runtime-boundary`      | SDK de host de memoria, fachadas de runtime de memoria, alias de Plugin SDK de memoria, pegamento de activación de runtime de memoria y comandos de doctor de memoria |
| `/codeql-critical-quality/session-diagnostics-boundary` | Internos de cola de respuestas, colas de entrega de sesiones, helpers de enlace/entrega de sesiones salientes, superficies de paquetes de eventos/registros de diagnóstico y contratos de CLI de doctor de sesión |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Despacho de respuestas entrantes de Plugin SDK, helpers de payload/fragmentación/runtime de respuestas, opciones de respuesta de canal, colas de entrega y helpers de enlace de sesión/hilo |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalización de catálogo de modelos, autenticación y descubrimiento de proveedores, registro de runtime de proveedores, valores predeterminados/catálogos de proveedores y registros de web/search/fetch/embedding |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap de la UI de control, persistencia local, flujos de control de gateway y contratos de runtime del plano de control de tareas                              |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Fetch/search web del core, IO de medios, comprensión de medios, generación de imágenes y contratos de runtime de generación de medios                              |
| `/codeql-critical-quality/plugin-boundary`              | Loader, registro, superficie pública y contratos de entrypoint de Plugin SDK                                                                                       |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Fuente publicada de Plugin SDK del lado del paquete y helpers de contrato de paquete de plugin                                                                     |

La calidad se mantiene separada de la seguridad para que los hallazgos de calidad puedan programarse, medirse, deshabilitarse o ampliarse sin ocultar la señal de seguridad. La expansión de CodeQL para Swift, Python y plugins incluidos debe volver a añadirse como trabajo de seguimiento acotado o fragmentado solo después de que los perfiles estrechos tengan tiempo de ejecución y señal estables.

## Flujos de trabajo de mantenimiento

### Agente de documentación

El flujo de trabajo `Docs Agent` es un carril de mantenimiento de Codex impulsado por eventos para mantener la documentación existente alineada con los cambios integrados recientemente. No tiene una programación pura: una ejecución correcta de CI por push no bot en `main` puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por ejecución de flujo de trabajo se omiten cuando `main` ha avanzado o cuando se creó otra ejecución no omitida de Docs Agent en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA de origen anterior no omitido de Docs Agent hasta el `main` actual, de modo que una ejecución por hora puede cubrir todos los cambios de main acumulados desde la última pasada de documentación.

### Agente de rendimiento de pruebas

El flujo de trabajo `Test Performance Agent` es un carril de mantenimiento de Codex impulsado por eventos para pruebas lentas. No tiene una programación pura: una ejecución correcta de CI por push no bot en `main` puede activarlo, pero se omite si otra invocación por ejecución de flujo de trabajo ya se ejecutó o se está ejecutando ese día UTC. El despacho manual omite esa compuerta de actividad diaria. El carril crea un informe de rendimiento agrupado de Vitest de la suite completa, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de la suite completa y rechaza los cambios que reduzcan el recuento base de pruebas que pasan. Si la base tiene pruebas fallidas, Codex puede corregir solo fallos evidentes y el informe de suite completa posterior al agente debe pasar antes de confirmar nada. Cuando `main` avanza antes de que llegue el push del bot, el carril hace rebase del parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado en GitHub para que la acción de Codex pueda mantener la misma postura de seguridad sin sudo que el agente de documentación.

### PR duplicadas después de la fusión

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual de mantenedor para limpiar duplicados después de integrar. De forma predeterminada usa dry-run y solo cierra las PR listadas explícitamente cuando `apply=true`. Antes de modificar GitHub, verifica que la PR integrada esté fusionada y que cada duplicado tenga una incidencia referenciada compartida o hunks modificados superpuestos.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Compuertas de comprobación locales y enrutamiento de cambios

La lógica local de carriles cambiados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa compuerta de comprobación local es más estricta con los límites de arquitectura que el alcance amplio de la plataforma de CI:

- los cambios de producción del núcleo ejecutan la comprobación de tipos de producción del núcleo y de pruebas del núcleo, además del lint y las guardas del núcleo;
- los cambios solo de pruebas del núcleo ejecutan solo la comprobación de tipos de pruebas del núcleo, además del lint del núcleo;
- los cambios de producción de extensión ejecutan la comprobación de tipos de producción de extensión y de pruebas de extensión, además del lint de extensión;
- los cambios solo de pruebas de extensión ejecutan la comprobación de tipos de pruebas de extensión, además del lint de extensión;
- los cambios públicos del SDK de Plugin o del contrato de plugin se expanden a la comprobación de tipos de extensiones porque las extensiones dependen de esos contratos del núcleo (los barridos de extensiones de Vitest siguen siendo trabajo de pruebas explícito);
- los aumentos de versión solo de metadatos de lanzamiento ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz;
- los cambios desconocidos de raíz/configuración fallan de forma segura hacia todos los carriles de comprobación.

El enrutamiento local de pruebas cambiadas vive en `scripts/test-projects.test-support.mjs` y es intencionalmente más barato que `check:changed`: las ediciones directas de pruebas se ejecutan a sí mismas, las ediciones de código fuente prefieren mapeos explícitos, luego pruebas hermanas y dependientes del grafo de importación. La configuración compartida de entrega de salas de grupo es uno de los mapeos explícitos: los cambios en la configuración de respuesta visible del grupo, el modo de entrega de respuestas de origen o el prompt del sistema de la herramienta de mensajes se enrutan por las pruebas de respuesta del núcleo, además de regresiones de entrega de Discord y Slack, para que un cambio predeterminado compartido falle antes del primer push de PR. Usa `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` solo cuando el cambio sea tan amplio en el arnés que el conjunto mapeado barato no sea un proxy confiable.

## Validación de Testbox

Ejecuta Testbox desde la raíz del repo y prefiere una caja nueva precalentada para pruebas amplias. Antes de gastar una compuerta lenta en una caja reutilizada, vencida o que acaba de informar una sincronización inesperadamente grande, ejecuta primero `pnpm testbox:sanity` dentro de la caja.

La comprobación de cordura falla rápido cuando desaparecen archivos raíz requeridos como `pnpm-lock.yaml` o cuando `git status --short` muestra al menos 200 eliminaciones rastreadas. Eso normalmente significa que el estado de sincronización remota no es una copia confiable de la PR; detén esa caja y precalienta una nueva en lugar de depurar el fallo de prueba del producto. Para PR intencionales con eliminaciones grandes, establece `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` para esa ejecución de cordura.

`pnpm testbox:run` también termina una invocación local de Blacksmith CLI que permanece en la fase de sincronización durante más de cinco minutos sin salida posterior a la sincronización. Establece `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` para deshabilitar esa guarda, o usa un valor mayor en milisegundos para diffs locales inusualmente grandes.

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de desarrollo](/es/install/development-channels)
