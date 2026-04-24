---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando comprobaciones fallidas de GitHub Actions
summary: Grafo de trabajos de CI, restricciones de alcance y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-04-24T05:21:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e24efec145ff144b007e248ef0f9c56287619eb9af204d45d49984909a6136b
    source_path: ci.md
    workflow: 15
---

La CI se ejecuta en cada push a `main` y en cada pull request. Usa un alcance inteligente para omitir trabajos costosos cuando solo cambiaron áreas no relacionadas.

QA Lab tiene vías de CI dedicadas fuera del flujo principal con alcance inteligente. El
flujo `Parity gate` se ejecuta en cambios coincidentes de PR y en dispatch manual; compila
el tiempo de ejecución privado de QA y compara los paquetes agénticos simulados de GPT-5.4 y Opus 4.6.
El flujo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y en
dispatch manual; distribuye en paralelo la puerta de paridad simulada, la vía en vivo de Matrix y la vía en vivo de
Telegram. Los trabajos en vivo usan el entorno `qa-live-shared`,
y la vía de Telegram usa arrendamientos de Convex. `OpenClaw Release
Checks` también ejecuta las mismas vías de QA Lab antes de la aprobación de la versión.

El flujo `Duplicate PRs After Merge` es un flujo manual de mantenimiento para
limpieza de duplicados después de aterrizar. Usa dry-run de forma predeterminada y solo cierra los PR
indicados explícitamente cuando `apply=true`. Antes de modificar GitHub,
verifica que el PR aterrizado esté fusionado y que cada duplicado tenga ya sea un issue
referenciado compartido o fragmentos modificados superpuestos.

El flujo `Docs Agent` es una vía de mantenimiento de Codex impulsada por eventos para mantener
la documentación existente alineada con los cambios aterrizados recientemente. No tiene una programación pura:
una ejecución exitosa de CI en push no bot sobre `main` puede activarlo, y
el dispatch manual puede ejecutarlo directamente. Las invocaciones por workflow-run se omiten cuando
`main` ya avanzó o cuando se creó otra ejecución de Docs Agent no omitida en la última hora.
Cuando se ejecuta, revisa el rango de commits desde el SHA fuente del anterior Docs Agent no omitido hasta
el `main` actual, por lo que una ejecución por hora puede cubrir todos los cambios de main
acumulados desde el último paso de documentación.

El flujo `Test Performance Agent` es una vía de mantenimiento de Codex impulsada por eventos
para pruebas lentas. No tiene una programación pura: una ejecución exitosa de CI en push no bot sobre
`main` puede activarlo, pero se omite si otra invocación por workflow-run ya se ejecutó o está en ejecución
ese día UTC. El dispatch manual omite esa restricción diaria de actividad.
La vía compila un informe de rendimiento de Vitest de suite completa agrupado, permite que Codex
haga solo pequeños arreglos de rendimiento de pruebas que conserven cobertura en lugar de refactorizaciones amplias,
luego vuelve a ejecutar el informe de suite completa y rechaza cambios que reduzcan la cantidad
base de pruebas aprobadas. Si la base tiene pruebas fallidas, Codex puede corregir
solo fallos obvios y el informe posterior del agente de suite completa debe aprobarse antes de que
se confirme nada. Cuando `main` avanza antes de que llegue el push del bot, la vía
rebasea el parche validado, vuelve a ejecutar `pnpm check:changed` e intenta de nuevo el push;
los parches obsoletos en conflicto se omiten. Usa Ubuntu alojado por GitHub para que la acción de Codex
pueda mantener la misma postura de seguridad de eliminación de sudo que el agente de documentación.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Resumen de trabajos

| Trabajo | Propósito | Cuándo se ejecuta |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight` | Detectar cambios solo de docs, alcances cambiados, extensiones cambiadas y compilar el manifiesto de CI | Siempre en pushes y PRs no draft |
| `security-scm-fast` | Detección de claves privadas y auditoría de flujos mediante `zizmor` | Siempre en pushes y PRs no draft |
| `security-dependency-audit` | Auditoría del lockfile de producción sin dependencias contra avisos de npm | Siempre en pushes y PRs no draft |
| `security-fast` | Agregado obligatorio para los trabajos rápidos de seguridad | Siempre en pushes y PRs no draft |
| `build-artifacts` | Compilar `dist/`, Control UI, comprobaciones de artefactos compilados y artefactos reutilizables descendentes | Cambios relevantes para Node |
| `checks-fast-core` | Vías rápidas de corrección en Linux, como comprobaciones de incluidos/contratos de Plugin/protocolo | Cambios relevantes para Node |
| `checks-fast-contracts-channels` | Comprobaciones fragmentadas de contratos de canales con un resultado agregado estable | Cambios relevantes para Node |
| `checks-node-extensions` | Fragmentos completos de pruebas de Plugins incluidos en toda la suite de extensiones | Cambios relevantes para Node |
| `checks-node-core-test` | Fragmentos de pruebas principales de Node, excluyendo vías de canal, incluidos, contratos y extensiones | Cambios relevantes para Node |
| `extension-fast` | Pruebas focalizadas solo para los Plugins incluidos modificados | Pull requests con cambios en extensiones |
| `check` | Equivalente fragmentado de la puerta local principal: tipos de prod, lint, guards, tipos de prueba y smoke estricto | Cambios relevantes para Node |
| `check-additional` | Shards de arquitectura, límites, guards de superficie de extensiones, límites de paquetes y gateway-watch | Cambios relevantes para Node |
| `build-smoke` | Pruebas smoke de la CLI compilada y smoke de memoria al inicio | Cambios relevantes para Node |
| `checks` | Verificador para pruebas de canales de artefactos compilados más compatibilidad de Node 22 solo en push | Cambios relevantes para Node |
| `check-docs` | Formato, lint y comprobaciones de enlaces rotos de docs | Cuando cambian docs |
| `skills-python` | Ruff + pytest para Skills respaldadas por Python | Cambios relevantes para Skills de Python |
| `checks-windows` | Vías de prueba específicas de Windows | Cambios relevantes para Windows |
| `macos-node` | Vía de pruebas TypeScript en macOS usando los artefactos compilados compartidos | Cambios relevantes para macOS |
| `macos-swift` | Lint, compilación y pruebas de Swift para la app de macOS | Cambios relevantes para macOS |
| `android` | Pruebas unitarias de Android para ambos sabores más una compilación de APK de depuración | Cambios relevantes para Android |
| `test-performance-agent` | Optimización diaria de pruebas lentas por Codex tras actividad confiable | Éxito de CI en main o dispatch manual |

## Orden de fallo rápido

Los trabajos se ordenan para que las comprobaciones baratas fallen antes de que se ejecuten las costosas:

1. `preflight` decide qué vías existen en absoluto. La lógica `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápidamente sin esperar a los trabajos más pesados de artefactos y matriz de plataformas.
3. `build-artifacts` se superpone con las vías rápidas de Linux para que los consumidores descendentes puedan empezar tan pronto como la compilación compartida esté lista.
4. Después se distribuyen las vías más pesadas de plataforma y tiempo de ejecución: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` solo para PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`.
Las ediciones del flujo de CI validan el grafo de CI de Node más el lint del flujo, pero no fuerzan por sí mismas compilaciones nativas de Windows, Android o macOS; esas vías de plataforma siguen limitadas a cambios en código fuente de la plataforma.
Las comprobaciones de Node en Windows se limitan a wrappers específicos de procesos/rutas de Windows, helpers del ejecutor npm/pnpm/UI, configuración del gestor de paquetes y las superficies del flujo de CI que ejecutan esa vía; los cambios no relacionados en código fuente, Plugin, install-smoke y solo pruebas permanecen en las vías de Node en Linux para que no reserven un worker de Windows de 16 vCPU para cobertura que ya ejercen los fragmentos normales de prueba.
El flujo separado `install-smoke` reutiliza el mismo script de alcance mediante su propio trabajo `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`. Los pull requests ejecutan la ruta rápida para superficies Docker/paquete, cambios de paquete/manifiesto de Plugin incluido y superficies principales de Plugin/canal/Gateway/Plugin SDK que ejercen los trabajos smoke de Docker. Los cambios solo de código fuente de Plugins incluidos, ediciones solo de pruebas y ediciones solo de docs no reservan workers de Docker. La ruta rápida compila una vez la imagen del Dockerfile raíz, comprueba la CLI, ejecuta el e2e de red de gateway en contenedor, verifica un argumento de compilación de extensión incluida y ejecuta el perfil limitado de Plugin incluido en Docker bajo un tiempo de espera de comando de 120 segundos. La ruta completa mantiene la cobertura de instalación de paquetes QR y Docker/actualización del instalador para ejecuciones programadas nocturnas, dispatches manuales, comprobaciones de versión por workflow-call y pull requests que realmente tocan superficies de instalador/paquete/Docker. Los pushes a `main`, incluidos los merge commits, no fuerzan la ruta completa; cuando la lógica de alcance cambiado solicitaría cobertura completa en un push, el flujo mantiene el smoke rápido de Docker y deja el smoke completo de instalación para validación nocturna o de versión. El smoke lento del proveedor de imágenes de instalación global de Bun se controla aparte mediante `run_bun_global_install_smoke`; se ejecuta en la programación nocturna y desde el flujo de comprobaciones de versión, y los dispatches manuales de `install-smoke` pueden optar por incluirlo, pero los pull requests y pushes a `main` no lo ejecutan. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles centrados en instalación. El agregado local `test:docker:all` precompila una imagen compartida de pruebas en vivo y una imagen compartida de app compilada `scripts/e2e/Dockerfile`, luego ejecuta en paralelo las vías smoke live/E2E con `OPENCLAW_SKIP_DOCKER_BUILD=1`; ajusta la concurrencia predeterminada del pool principal de 8 con `OPENCLAW_DOCKER_ALL_PARALLELISM` y la concurrencia del pool final sensible al proveedor de 8 con `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. El agregado local deja de programar nuevas vías agrupadas tras el primer fallo de forma predeterminada, y cada vía tiene un tiempo de espera de 120 minutos anulable con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. El flujo reutilizable live/E2E refleja el patrón de imagen compartida al compilar y publicar una única imagen Docker E2E etiquetada por SHA en GHCR antes de la matriz Docker, y luego ejecuta la matriz con `OPENCLAW_SKIP_DOCKER_BUILD=1`. El flujo programado live/E2E ejecuta diariamente la suite completa de Docker de la ruta de versión. La matriz completa de actualización/canal incluido sigue siendo manual/de suite completa porque realiza pasadas repetidas reales de actualización npm y reparación doctor.

La lógica local de vías cambiadas vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa puerta local es más estricta respecto a límites de arquitectura que el alcance amplio de plataformas de CI: los cambios de producción del núcleo ejecutan typecheck de prod del núcleo más pruebas del núcleo, los cambios solo de pruebas del núcleo ejecutan solo typecheck/pruebas del núcleo, los cambios de producción de extensiones ejecutan typecheck de prod de extensiones más pruebas de extensiones, y los cambios solo de pruebas de extensiones ejecutan solo typecheck/pruebas de extensiones. Los cambios del SDK público de Plugin o del contrato de Plugin amplían la validación a extensiones porque las extensiones dependen de esos contratos principales. Los incrementos de versión solo de metadatos de versión ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz. Los cambios desconocidos en raíz/configuración fallan de forma segura hacia todas las vías.

En pushes, la matriz `checks` agrega la vía `compat-node22` solo para push. En pull requests, esa vía se omite y la matriz sigue centrada en las vías normales de pruebas/canales.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo siga siendo pequeño sin reservar runners en exceso: los contratos de canales se ejecutan como tres shards ponderados, las pruebas de Plugins incluidos se equilibran entre seis workers de extensiones, las vías pequeñas de unidades del núcleo se emparejan, auto-reply se ejecuta como tres workers equilibrados en lugar de seis workers diminutos, y las configuraciones agénticas de gateway/Plugin se distribuyen entre los trabajos Node agénticos existentes de solo código fuente en lugar de esperar a los artefactos compilados. Las pruebas amplias de navegador, QA, multimedia y Plugins diversos usan sus configuraciones Vitest dedicadas en lugar del conjunto compartido general de Plugins. Los trabajos de shards de extensiones ejecutan grupos de configuración de Plugin en serie con un worker de Vitest y un heap de Node más grande para que los lotes de Plugins con muchas importaciones no saturen runners pequeños de CI. La vía amplia de agentes usa el planificador compartido de Vitest en paralelo por archivo porque está dominada por importación/programación en lugar de pertenecer a un único archivo de prueba lento. `runtime-config` se ejecuta con el shard `infra core-runtime` para evitar que el shard compartido de tiempo de ejecución se quede con la cola final. `check-additional` mantiene juntos el trabajo de compilación/canary de límites de paquetes y separa la arquitectura de topología de tiempo de ejecución de la cobertura de gateway watch; el shard de guardias de límites ejecuta sus pequeños guardias independientes concurrentemente dentro de un solo trabajo. Gateway watch, pruebas de canales y el shard principal de support-boundary se ejecutan concurrentemente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén compilados, manteniendo sus nombres antiguos de comprobación como trabajos ligeros de verificación mientras se evitan dos workers Blacksmith extra y una segunda cola de consumidores de artefactos.
La CI de Android ejecuta `testPlayDebugUnitTest` y `testThirdPartyDebugUnitTest`, y luego compila el APK de depuración Play. El sabor third-party no tiene un conjunto de código fuente ni un manifiesto separados; su vía de pruebas unitarias aun así compila ese sabor con las flags SMS/call-log de BuildConfig, evitando a la vez un trabajo duplicado de empaquetado de APK de depuración en cada push relevante para Android.
`extension-fast` es solo para PR porque las ejecuciones de push ya ejecutan los shards completos de Plugins incluidos. Eso mantiene la retroalimentación de Plugins cambiados para revisiones sin reservar un worker Blacksmith extra en `main` para cobertura ya presente en `checks-node-extensions`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando un push más nuevo llega al mismo PR o a la misma referencia `main`. Trátalo como ruido de CI salvo que la ejecución más reciente para esa misma referencia también esté fallando. Las comprobaciones agregadas de shards usan `!cancelled() && always()` para que sigan informando fallos normales de shards, pero no se pongan en cola después de que todo el flujo ya haya sido reemplazado.
La clave de concurrencia de CI está versionada (`CI-v7-*`) para que un zombie del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente nuevas ejecuciones de main.

## Runners

| Runner | Trabajos |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04` | `preflight`, trabajos rápidos de seguridad y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidos, comprobaciones fragmentadas de contratos de canales, shards de `check` excepto lint, shards y agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de docs, Skills de Python, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu alojado por GitHub para que la matriz Blacksmith pueda ponerse en cola antes |
| `blacksmith-8vcpu-ubuntu-2404` | `build-artifacts`, build-smoke, shards de pruebas de Node en Linux, shards de pruebas de Plugins incluidos, `android` |
| `blacksmith-16vcpu-ubuntu-2404` | `check-lint`, que sigue siendo lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban; compilaciones Docker de install-smoke, donde el tiempo de cola de 32 vCPU costaba más de lo que ahorraba |
| `blacksmith-16vcpu-windows-2025` | `checks-windows` |
| `blacksmith-6vcpu-macos-latest` | `macos-node` en `openclaw/openclaw`; los forks vuelven a `macos-latest` |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks vuelven a `macos-latest` |

## Equivalentes locales

```bash
pnpm changed:lanes   # inspeccionar el clasificador local de vías cambiadas para origin/main...HEAD
pnpm check:changed   # puerta local inteligente: typecheck/lint/pruebas cambiadas por vía de límite
pnpm check          # puerta local rápida: tsgo de producción + lint fragmentado + guards rápidos en paralelo
pnpm check:test-types
pnpm check:timed    # misma puerta con tiempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # pruebas de vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato + lint + enlaces rotos de docs
pnpm build          # compilar dist cuando importan las vías de artefactos/build-smoke de CI
node scripts/ci-run-timings.mjs <run-id>      # resumir tiempo total, tiempo en cola y trabajos más lentos
node scripts/ci-run-timings.mjs --recent 10   # comparar ejecuciones recientes exitosas de CI en main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de versión](/es/install/development-channels)
