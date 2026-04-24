---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando verificaciones fallidas de GitHub Actions
summary: Grafo de trabajos de CI, compuertas de alcance y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-04-24T08:57:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 489ac05725a316b25f56f7f754d6a8652abbd60481fbe6e692572b81581fe405
    source_path: ci.md
    workflow: 15
---

La CI se ejecuta en cada push a `main` y en cada pull request. Usa un alcance inteligente para omitir trabajos costosos cuando solo cambiaron áreas no relacionadas.

QA Lab tiene carriles de CI dedicados fuera del flujo de trabajo principal con alcance inteligente. El flujo de trabajo `Parity gate` se ejecuta en cambios de PR coincidentes y mediante despacho manual; compila el runtime privado de QA y compara los paquetes agentic simulados de GPT-5.4 y Opus 4.6. El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y mediante despacho manual; distribuye en paralelo la compuerta de paridad simulada, el carril Matrix en vivo y el carril Telegram en vivo. Los trabajos en vivo usan el entorno `qa-live-shared`, y el carril de Telegram usa concesiones de Convex. `OpenClaw Release Checks` también ejecuta esos mismos carriles de QA Lab antes de la aprobación de la versión.

El flujo de trabajo `Duplicate PRs After Merge` es un flujo de trabajo manual para mantenedores destinado a la limpieza de duplicados después de aterrizar cambios. Usa `dry-run` de forma predeterminada y solo cierra PR listados explícitamente cuando `apply=true`. Antes de modificar GitHub, verifica que el PR aterrizado esté fusionado y que cada duplicado tenga ya sea un issue referenciado compartido o fragmentos modificados superpuestos.

El flujo de trabajo `Docs Agent` es un carril de mantenimiento de Codex basado en eventos para mantener la documentación existente alineada con cambios aterrizados recientemente. No tiene una programación pura: una ejecución de CI exitosa en `main` iniciada por un push no realizado por bot puede activarlo, y el despacho manual puede ejecutarlo directamente. Las invocaciones por ejecución de flujo de trabajo se omiten cuando `main` ya avanzó o cuando se creó otra ejecución de Docs Agent no omitida en la última hora. Cuando se ejecuta, revisa el rango de commits desde el SHA fuente del Docs Agent anterior no omitido hasta el `main` actual, por lo que una ejecución por hora puede cubrir todos los cambios acumulados en main desde la última pasada de documentación.

El flujo de trabajo `Test Performance Agent` es un carril de mantenimiento de Codex basado en eventos para pruebas lentas. No tiene una programación pura: una ejecución de CI exitosa en `main` iniciada por un push no realizado por bot puede activarlo, pero se omite si otra invocación por ejecución de flujo de trabajo ya se ejecutó o está ejecutándose ese día UTC. El despacho manual omite esa compuerta diaria de actividad. El carril compila un informe de rendimiento de Vitest agrupado de toda la suite, permite que Codex haga solo pequeñas correcciones de rendimiento de pruebas que preserven la cobertura en lugar de refactorizaciones amplias, luego vuelve a ejecutar el informe de toda la suite y rechaza cambios que reduzcan la cantidad base de pruebas aprobadas. Si la base tiene pruebas fallidas, Codex solo puede corregir fallos evidentes y el informe posterior del agente sobre toda la suite debe aprobarse antes de confirmar cualquier cambio. Cuando `main` avanza antes de que llegue el push del bot, el carril hace rebase del parche validado, vuelve a ejecutar `pnpm check:changed` y reintenta el push; los parches obsoletos con conflictos se omiten. Usa Ubuntu alojado por GitHub para que la acción de Codex pueda mantener la misma postura de seguridad `drop-sudo` que el agente de documentación.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Resumen de trabajos

| Trabajo                          | Propósito                                                                                     | Cuándo se ejecuta                    |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Detectar cambios solo en docs, alcances modificados, extensiones modificadas y compilar el manifiesto de CI | Siempre en pushes y PR no borrador   |
| `security-scm-fast`              | Detección de claves privadas y auditoría de flujos de trabajo mediante `zizmor`              | Siempre en pushes y PR no borrador   |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias contra avisos de npm                    | Siempre en pushes y PR no borrador   |
| `security-fast`                  | Agregado obligatorio para los trabajos rápidos de seguridad                                   | Siempre en pushes y PR no borrador   |
| `build-artifacts`                | Compilar `dist/`, la interfaz Control UI, verificaciones de artefactos compilados y artefactos reutilizables para fases posteriores | Cambios relevantes para Node         |
| `checks-fast-core`               | Carriles rápidos de corrección en Linux como verificaciones de bundled/plugin-contract/protocol | Cambios relevantes para Node         |
| `checks-fast-contracts-channels` | Verificaciones fragmentadas de contratos de canales con un resultado agregado estable         | Cambios relevantes para Node         |
| `checks-node-extensions`         | Fragmentos completos de pruebas de bundled-plugin en toda la suite de extensiones             | Cambios relevantes para Node         |
| `checks-node-core-test`          | Fragmentos de pruebas Node del núcleo, excluyendo canales, bundled, contratos y carriles de extensiones | Cambios relevantes para Node         |
| `extension-fast`                 | Pruebas enfocadas solo para los bundled plugins modificados                                   | Pull requests con cambios en extensiones |
| `check`                          | Equivalente fragmentado del carril principal local: tipos de prod, lint, guardas, tipos de prueba y smoke estricto | Cambios relevantes para Node         |
| `check-additional`               | Arquitectura, límites, guardas de superficie de extensiones, límites de paquetes y fragmentos de gateway-watch | Cambios relevantes para Node         |
| `build-smoke`                    | Pruebas smoke de la CLI compilada y smoke de memoria al inicio                               | Cambios relevantes para Node         |
| `checks`                         | Verificador para pruebas de canales con artefactos compilados más compatibilidad Node 22 solo en push | Cambios relevantes para Node         |
| `check-docs`                     | Verificaciones de formato, lint y enlaces rotos de la documentación                           | Cuando cambian las docs              |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                              | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Carriles de pruebas específicos de Windows                                                    | Cambios relevantes para Windows      |
| `macos-node`                     | Carril de pruebas TypeScript en macOS usando artefactos compilados compartidos                | Cambios relevantes para macOS        |
| `macos-swift`                    | Lint, compilación y pruebas de Swift para la app de macOS                                     | Cambios relevantes para macOS        |
| `android`                        | Pruebas unitarias de Android para ambas variantes más una compilación de APK de depuración    | Cambios relevantes para Android      |
| `test-performance-agent`         | Optimización diaria de pruebas lentas por Codex tras actividad confiable                      | Éxito de CI en main o despacho manual |

## Orden de fallo rápido

Los trabajos se ordenan para que las verificaciones baratas fallen antes de que se ejecuten las costosas:

1. `preflight` decide qué carriles existen en absoluto. La lógica `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápido sin esperar a los trabajos más pesados de artefactos y matrices de plataforma.
3. `build-artifacts` se superpone con los carriles rápidos de Linux para que los consumidores posteriores puedan comenzar en cuanto la compilación compartida esté lista.
4. Después de eso se distribuyen los carriles más pesados de plataforma y runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` solo para PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

La lógica de alcance está en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`.
Las ediciones del flujo de trabajo de CI validan el grafo de CI de Node más el lint de flujos de trabajo, pero no fuerzan por sí mismas compilaciones nativas de Windows, Android o macOS; esos carriles de plataforma siguen limitados a cambios en el código fuente de cada plataforma.
Las verificaciones de Node en Windows se limitan a envoltorios de proceso/ruta específicos de Windows, helpers de ejecución npm/pnpm/UI, configuración del gestor de paquetes y las superficies del flujo de trabajo de CI que ejecutan ese carril; los cambios no relacionados en código fuente, Plugin, install-smoke y solo pruebas permanecen en los carriles Linux Node para que no reserven un worker de Windows de 16 vCPU para cobertura que ya ejercen los fragmentos normales de prueba.
El flujo de trabajo separado `install-smoke` reutiliza el mismo script de alcance a través de su propio trabajo `preflight`. Divide la cobertura smoke en `run_fast_install_smoke` y `run_full_install_smoke`. Los pull requests ejecutan la ruta rápida para superficies de Docker/paquetes, cambios de paquete/manifiesto de bundled plugin y superficies del núcleo Plugin/canal/Gateway/Plugin SDK que ejercen los trabajos smoke de Docker. Los cambios solo de código fuente en bundled plugin, las ediciones solo de pruebas y las ediciones solo de documentación no reservan workers de Docker. La ruta rápida compila una vez la imagen raíz de Dockerfile, verifica la CLI, ejecuta el e2e del contenedor gateway-network, verifica un argumento de compilación de extensión bundled y ejecuta el perfil Docker acotado de bundled-plugin con un tiempo límite de comando de 120 segundos. La ruta completa conserva la instalación de paquetes QR y la cobertura del instalador Docker/actualización para ejecuciones nocturnas programadas, despachos manuales, verificaciones de versión por workflow-call y pull requests que realmente tocan superficies de instalador/paquetes/Docker. Los pushes a `main`, incluidos los commits de fusión, no fuerzan la ruta completa; cuando la lógica de alcance de cambios solicitaría cobertura completa en un push, el flujo de trabajo conserva el smoke rápido de Docker y deja el smoke de instalación completo para la validación nocturna o de versión. El smoke lento del proveedor de imágenes con instalación global de Bun está controlado aparte por `run_bun_global_install_smoke`; se ejecuta en la programación nocturna y desde el flujo de trabajo de verificaciones de versión, y los despachos manuales de `install-smoke` pueden activarlo, pero los pull requests y los pushes a `main` no lo ejecutan. Las pruebas Docker de QR e instalador conservan sus propios Dockerfiles centrados en instalación. El `test:docker:all` local precompila una imagen compartida para pruebas en vivo y una imagen de app compilada compartida de `scripts/e2e/Dockerfile`, luego ejecuta en paralelo los carriles smoke live/E2E con `OPENCLAW_SKIP_DOCKER_BUILD=1`; ajusta la simultaneidad predeterminada de 8 del grupo principal con `OPENCLAW_DOCKER_ALL_PARALLELISM` y la simultaneidad predeterminada de 8 del grupo final sensible al proveedor con `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`. El inicio de carriles se escalona 2 segundos de forma predeterminada para evitar tormentas locales de creación en el daemon de Docker; reemplázalo con `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` u otro valor en milisegundos. El agregado local deja de programar nuevos carriles agrupados tras el primer fallo de forma predeterminada, y cada carril tiene un tiempo límite de 120 minutos reemplazable con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. El flujo de trabajo reutilizable live/E2E refleja el patrón de imagen compartida al compilar y publicar una imagen Docker E2E en GHCR etiquetada por SHA antes de la matriz de Docker, y luego ejecuta la matriz con `OPENCLAW_SKIP_DOCKER_BUILD=1`. El flujo de trabajo programado live/E2E ejecuta diariamente la suite completa de Docker de la ruta de versión. La matriz completa de actualización/canal bundled sigue siendo manual/de suite completa porque realiza pases repetidos reales de actualización npm y reparación con doctor.

La lógica local de carriles modificados está en `scripts/changed-lanes.mjs` y es ejecutada por `scripts/check-changed.mjs`. Esa compuerta local es más estricta respecto a límites de arquitectura que el amplio alcance de plataforma de CI: los cambios de producción del núcleo ejecutan typecheck de producción del núcleo más pruebas del núcleo, los cambios solo en pruebas del núcleo ejecutan solo typecheck/pruebas del núcleo para pruebas, los cambios de producción de extensiones ejecutan typecheck de producción de extensiones más pruebas de extensiones, y los cambios solo en pruebas de extensiones ejecutan solo typecheck/pruebas de extensiones para pruebas. Los cambios en el Plugin SDK público o en plugin-contract amplían la validación a extensiones porque las extensiones dependen de esos contratos del núcleo. Los incrementos de versión solo en metadatos de versión ejecutan verificaciones dirigidas de versión/configuración/dependencias raíz. Los cambios desconocidos en raíz/configuración fallan de forma segura hacia todos los carriles.

En pushes, la matriz `checks` agrega el carril `compat-node22`, que solo se ejecuta en push. En pull requests, ese carril se omite y la matriz se mantiene enfocada en los carriles normales de pruebas/canales.

Las familias de pruebas Node más lentas se dividen o equilibran para que cada trabajo siga siendo pequeño sin reservar runners en exceso: los contratos de canales se ejecutan como tres fragmentos ponderados, las pruebas de bundled plugin se equilibran entre seis workers de extensiones, los carriles pequeños de unidades del núcleo se emparejan, auto-reply se ejecuta como tres workers equilibrados en lugar de seis workers diminutos, y las configuraciones agentic de gateway/plugin se distribuyen entre los trabajos Node agentic existentes de solo código fuente en lugar de esperar a artefactos compilados. Las pruebas amplias de navegador, QA, medios y plugins varios usan sus configuraciones dedicadas de Vitest en lugar del conjunto compartido general de plugins. Los trabajos fragmentados de extensiones ejecutan los grupos de configuración de plugins en serie con un worker de Vitest y un heap de Node más grande para que los lotes de plugins con muchas importaciones no sobrecomprometan los pequeños runners de CI. El carril amplio de agentes usa el programador compartido de Vitest con paralelismo por archivo porque está dominado por importaciones/programación en lugar de pertenecer a un único archivo de prueba lento. `runtime-config` se ejecuta con el fragmento infra core-runtime para evitar que el fragmento compartido de runtime se quede con la cola final. `check-additional` mantiene juntos el trabajo de compilación/canary de límites de paquetes y separa la arquitectura de topología de runtime de la cobertura de gateway watch; el fragmento de guardas de límites ejecuta sus pequeñas guardas independientes de forma concurrente dentro de un solo trabajo. Gateway watch, pruebas de canales y el fragmento de límites de soporte del núcleo se ejecutan concurrentemente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya están compilados, conservando sus nombres antiguos de verificación como trabajos verificadores ligeros mientras se evitan dos workers Blacksmith adicionales y una segunda cola de consumidores de artefactos.

La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest`, y luego compila el APK Play de depuración. La variante third-party no tiene un conjunto de fuentes ni un manifiesto separados; su carril de pruebas unitarias aun así compila esa variante con las banderas SMS/call-log de BuildConfig, mientras evita un trabajo duplicado de empaquetado de APK de depuración en cada push relevante para Android.
`extension-fast` es solo para PR porque las ejecuciones de push ya ejecutan los fragmentos completos de bundled plugin. Eso mantiene la retroalimentación de plugins modificados para las revisiones sin reservar un worker Blacksmith adicional en `main` para cobertura que ya existe en `checks-node-extensions`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando un push más reciente llega al mismo PR o a la misma referencia `main`. Trata eso como ruido de CI a menos que la ejecución más reciente para esa misma referencia también esté fallando. Las verificaciones agregadas de fragmentos usan `!cancelled() && always()` para que sigan informando fallos normales de fragmentos pero no se pongan en cola después de que todo el flujo de trabajo ya haya sido reemplazado.
La clave de simultaneidad de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente las nuevas ejecuciones de main.

## Runners

| Runner                           | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, trabajos rápidos de seguridad y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), verificaciones rápidas de protocolo/contrato/bundled, verificaciones fragmentadas de contratos de canales, fragmentos de `check` excepto lint, fragmentos y agregados de `check-additional`, verificadores agregados de pruebas Node, verificaciones de docs, Skills de Python, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu alojado por GitHub para que la matriz de Blacksmith pueda entrar en cola antes |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de pruebas Node en Linux, fragmentos de pruebas de bundled plugin, `android`                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, que sigue siendo lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban; compilaciones Docker de install-smoke, donde el tiempo en cola de 32 vCPU costaba más de lo que ahorraba                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |

## Equivalentes locales

```bash
pnpm changed:lanes   # inspeccionar el clasificador local de carriles modificados para origin/main...HEAD
pnpm check:changed   # compuerta local inteligente: typecheck/lint/pruebas modificados por carril de límite
pnpm check          # compuerta local rápida: tsgo de producción + lint fragmentado + guardas rápidas en paralelo
pnpm check:test-types
pnpm check:timed    # la misma compuerta con tiempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # pruebas de vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato + lint + enlaces rotos de docs
pnpm build          # compilar dist cuando importan los carriles CI de artefactos/build-smoke
node scripts/ci-run-timings.mjs <run-id>      # resumir tiempo total, tiempo en cola y los trabajos más lentos
node scripts/ci-run-timings.mjs --recent 10   # comparar ejecuciones recientes exitosas de CI en main
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Relacionado

- [Resumen de instalación](/es/install)
- [Canales de versión](/es/install/development-channels)
