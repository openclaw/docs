---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando comprobaciones fallidas de GitHub Actions
summary: Grafo de trabajos de CI, restricciones por alcance y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-04-23T13:59:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a8ea0d8e428826169b0e6aced1caeb993106fe79904002125ace86b48cae1f
    source_path: ci.md
    workflow: 15
---

# Canalización de CI

La CI se ejecuta en cada push a `main` y en cada pull request. Usa restricciones inteligentes por alcance para omitir trabajos costosos cuando solo cambian áreas no relacionadas.

QA Lab tiene carriles de CI dedicados fuera del flujo de trabajo principal con restricción inteligente por alcance. El flujo de trabajo `Parity gate` se ejecuta en cambios coincidentes de PR y en ejecución manual; compila el runtime privado de QA y compara los paquetes agentic simulados de GPT-5.4 y Opus 4.6. El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y en ejecución manual; distribuye en paralelo el parity gate simulado, el carril Matrix en vivo y el carril Telegram en vivo. Los trabajos en vivo usan el entorno `qa-live-shared`, y el carril de Telegram usa arrendamientos de Convex. `OpenClaw Release Checks` también ejecuta estos mismos carriles de QA Lab antes de la aprobación de la versión.

## Descripción general de trabajos

| Trabajo                          | Propósito                                                                                    | Cuándo se ejecuta                     |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Detectar cambios solo de documentación, alcances modificados, extensiones modificadas y compilar el manifiesto de CI | Siempre en pushes y PR no borrador   |
| `security-scm-fast`              | Detección de claves privadas y auditoría de flujos de trabajo mediante `zizmor`             | Siempre en pushes y PR no borrador   |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias frente a avisos de npm                | Siempre en pushes y PR no borrador   |
| `security-fast`                  | Agregado obligatorio para los trabajos rápidos de seguridad                                  | Siempre en pushes y PR no borrador   |
| `build-artifacts`                | Compilar `dist/`, la interfaz Control UI, comprobaciones de artefactos compilados y artefactos reutilizables posteriores | Cambios relevantes para Node         |
| `checks-fast-core`               | Carriles rápidos de corrección en Linux, como comprobaciones de plugin incluido/contrato de plugin/protocolo | Cambios relevantes para Node         |
| `checks-fast-contracts-channels` | Comprobaciones fragmentadas de contratos de canal con un resultado agregado estable          | Cambios relevantes para Node         |
| `checks-node-extensions`         | Fragmentos completos de pruebas de plugins incluidos en toda la suite de extensiones        | Cambios relevantes para Node         |
| `checks-node-core-test`          | Fragmentos de pruebas del núcleo Node, excluyendo carriles de canal, incluidos, contrato y extensión | Cambios relevantes para Node         |
| `extension-fast`                 | Pruebas focalizadas solo para los plugins incluidos modificados                              | Pull requests con cambios en extensiones |
| `check`                          | Equivalente local principal fragmentado: tipos prod, lint, guardas, tipos de prueba y smoke estricto | Cambios relevantes para Node         |
| `check-additional`               | Guardas de arquitectura, límites, superficie de extensiones, límites de paquetes y fragmentos de gateway-watch | Cambios relevantes para Node         |
| `build-smoke`                    | Pruebas smoke de la CLI compilada y smoke de memoria al inicio                              | Cambios relevantes para Node         |
| `checks`                         | Verificador para pruebas de canal con artefactos compilados más compatibilidad Node 22 solo en push | Cambios relevantes para Node         |
| `check-docs`                     | Formato de documentación, lint y comprobaciones de enlaces rotos                             | Documentación modificada             |
| `skills-python`                  | Ruff + pytest para Skills con backend en Python                                              | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Carriles de pruebas específicos de Windows                                                   | Cambios relevantes para Windows      |
| `macos-node`                     | Carril de pruebas TypeScript en macOS usando los artefactos compilados compartidos          | Cambios relevantes para macOS        |
| `macos-swift`                    | Lint, compilación y pruebas de Swift para la app macOS                                      | Cambios relevantes para macOS        |
| `android`                        | Pruebas unitarias de Android para ambos sabores más una compilación de APK debug            | Cambios relevantes para Android      |

## Orden de fallo rápido

Los trabajos se ordenan para que las comprobaciones baratas fallen antes de que se ejecuten las más costosas:

1. `preflight` decide qué carriles existen en absoluto. La lógica `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápido sin esperar a los trabajos más pesados de artefactos y matrices de plataforma.
3. `build-artifacts` se superpone con los carriles rápidos de Linux para que los consumidores posteriores puedan empezar en cuanto la compilación compartida esté lista.
4. Después se distribuyen los carriles más pesados de plataforma y runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` solo para PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`.
Las ediciones del flujo de trabajo de CI validan el grafo de CI de Node más el lint de flujos de trabajo, pero por sí solas no fuerzan compilaciones nativas de Windows, Android o macOS; esos carriles de plataforma siguen restringidos a cambios en el código fuente de la plataforma.
Las comprobaciones de Node en Windows se restringen a envoltorios de procesos/rutas específicos de Windows, ayudantes npm/pnpm/UI runner, configuración del gestor de paquetes y las superficies del flujo de trabajo de CI que ejecutan ese carril; los cambios no relacionados de fuente, plugin, install-smoke y solo pruebas permanecen en los carriles Linux Node para no reservar un worker Windows de 16 vCPU para cobertura ya ejercida por los fragmentos normales de pruebas.
El flujo de trabajo separado `install-smoke` reutiliza el mismo script de alcance mediante su propio trabajo `preflight`. Calcula `run_install_smoke` a partir de la señal más estrecha de changed-smoke, por lo que el smoke de Docker/instalación se ejecuta para cambios de instalación, empaquetado, contenedores, cambios de producción en extensiones incluidas y las superficies principales de plugin/canal/gateway/Plugin SDK que ejercen los trabajos smoke de Docker. Las ediciones solo de pruebas y solo de documentación no reservan workers de Docker. Su smoke de paquete QR obliga a que la capa Docker `pnpm install` se vuelva a ejecutar mientras preserva la caché del almacén pnpm de BuildKit, de modo que sigue ejercitando la instalación sin volver a descargar dependencias en cada ejecución. Su e2e `gateway-network` reutiliza la imagen runtime compilada antes en el trabajo, por lo que añade cobertura real de WebSocket entre contenedores sin añadir otra compilación Docker. El comando local `test:docker:all` precompila una imagen compartida de pruebas en vivo y una imagen compartida de app compilada `scripts/e2e/Dockerfile`, y luego ejecuta en paralelo los carriles smoke live/E2E con `OPENCLAW_SKIP_DOCKER_BUILD=1`; ajusta el paralelismo predeterminado de 4 con `OPENCLAW_DOCKER_ALL_PARALLELISM`. El agregado local deja de programar nuevos carriles agrupados tras el primer fallo de forma predeterminada, y cada carril tiene un tiempo límite de 120 minutos modificable con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Los carriles sensibles al arranque o al proveedor se ejecutan en exclusiva después del grupo paralelo. El flujo de trabajo reutilizable live/E2E refleja el patrón de imagen compartida compilando y publicando una imagen Docker E2E GHCR con etiqueta SHA antes de la matriz Docker, y luego ejecutando la matriz con `OPENCLAW_SKIP_DOCKER_BUILD=1`. El flujo de trabajo programado live/E2E ejecuta diariamente la suite completa de Docker de la ruta de versión. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles centrados en instalación. Un trabajo separado `docker-e2e-fast` ejecuta el perfil Docker acotado de plugins incluidos bajo un tiempo límite de comando de 120 segundos: reparación de dependencias setup-entry más aislamiento sintético de fallos del bundled-loader. La matriz completa de actualización/canal de plugins incluidos sigue siendo manual/de suite completa porque realiza repetidos pasos reales de actualización npm y reparación con doctor.

La lógica local de carriles modificados vive en `scripts/changed-lanes.mjs` y se ejecuta mediante `scripts/check-changed.mjs`. Ese control local es más estricto respecto a los límites de arquitectura que el alcance amplio de CI por plataforma: los cambios de producción del núcleo ejecutan typecheck prod del núcleo más pruebas del núcleo; los cambios solo de pruebas del núcleo ejecutan solo typecheck/pruebas de pruebas del núcleo; los cambios de producción de extensiones ejecutan typecheck prod de extensiones más pruebas de extensiones; y los cambios solo de pruebas de extensiones ejecutan solo typecheck/pruebas de pruebas de extensiones. Los cambios del Plugin SDK público o del contrato de plugin amplían la validación a extensiones porque las extensiones dependen de esos contratos del núcleo. Los incrementos de versión solo de metadatos de versión ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz. Los cambios desconocidos en raíz/configuración fallan de forma segura hacia todos los carriles.

En los pushes, la matriz `checks` añade el carril `compat-node22` solo para push. En pull requests, ese carril se omite y la matriz sigue centrada en los carriles normales de pruebas/canales.

Las familias de pruebas Node más lentas se dividen o equilibran para que cada trabajo siga siendo pequeño: los contratos de canal dividen la cobertura del registro y del núcleo en seis fragmentos ponderados en total, las pruebas de plugins incluidos se equilibran entre seis workers de extensiones, auto-reply se ejecuta como tres workers equilibrados en lugar de seis workers pequeños, y las configuraciones agentic de gateway/plugin se distribuyen entre los trabajos Node agentic existentes solo de fuente en lugar de esperar a artefactos compilados. Las pruebas amplias de navegador, QA, multimedia y plugins varios usan sus configuraciones Vitest dedicadas en lugar del conjunto compartido general de plugins. El carril amplio de agentes usa el programador compartido de archivos en paralelo de Vitest porque está dominado por importaciones/programación en lugar de pertenecer a un solo archivo de prueba lento. `runtime-config` se ejecuta con el fragmento infra core-runtime para evitar que el fragmento compartido de runtime cargue con la cola final. `check-additional` mantiene juntas las tareas compile/canary de límite de paquete y separa la arquitectura de topología runtime de la cobertura de gateway watch; el fragmento de guardas de límites ejecuta sus pequeñas guardas independientes en paralelo dentro de un solo trabajo. Gateway watch, pruebas de canal y el fragmento de límite de soporte del núcleo se ejecutan en paralelo dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya están compilados, manteniendo sus antiguos nombres de comprobación como trabajos verificadores ligeros mientras se evitan dos workers Blacksmith extra y una segunda cola de consumidor de artefactos.
La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest`, y luego compila el APK debug de Play. El sabor de terceros no tiene un source set ni manifest separados; su carril de pruebas unitarias sigue compilando ese sabor con las marcas BuildConfig de SMS/call-log, mientras evita un trabajo duplicado de empaquetado de APK debug en cada push relevante para Android.
`extension-fast` es solo para PR porque los pushes ya ejecutan los fragmentos completos de plugins incluidos. Eso mantiene la retroalimentación de plugins modificados para las revisiones sin reservar un worker Blacksmith extra en `main` para cobertura ya presente en `checks-node-extensions`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un push más reciente al mismo PR o ref `main`. Trátalo como ruido de CI a menos que la ejecución más reciente para la misma ref también esté fallando. Las comprobaciones agregadas de fragmentos usan `!cancelled() && always()` para que sigan informando fallos normales de fragmentos, pero no se pongan en cola después de que todo el flujo de trabajo ya haya sido reemplazado.
La clave de concurrencia de CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente las nuevas ejecuciones en main.

## Runners

| Runner                           | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, trabajos rápidos de seguridad y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidos, comprobaciones fragmentadas de contratos de canal, fragmentos de `check` excepto lint, fragmentos y agregados de `check-additional`, verificadores agregados de pruebas Node, comprobaciones de documentación, Skills de Python, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu alojado por GitHub para que la matriz de Blacksmith pueda ponerse en cola antes |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de pruebas Node en Linux, fragmentos de pruebas de plugins incluidos, `android`                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, que sigue siendo lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban; compilaciones Docker de install-smoke, donde el coste en tiempo de cola de 32 vCPU era mayor que el ahorro                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |

## Equivalentes locales

```bash
pnpm changed:lanes   # inspeccionar el clasificador local de carriles modificados para origin/main...HEAD
pnpm check:changed   # control local inteligente: typecheck/lint/pruebas modificados por carril de límite
pnpm check          # control local rápido: tsgo de producción + lint fragmentado + guardas rápidas en paralelo
pnpm check:test-types
pnpm check:timed    # el mismo control con tiempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # pruebas de vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato de documentación + lint + enlaces rotos
pnpm build          # compilar dist cuando importan los carriles de artefactos/build-smoke de CI
node scripts/ci-run-timings.mjs <run-id>  # resumir tiempo total, tiempo en cola y trabajos más lentos
```
