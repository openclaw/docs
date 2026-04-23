---
read_when:
    - Necesitas entender por qué se ejecutó o no un trabajo de CI.
    - Estás depurando verificaciones fallidas de GitHub Actions.
summary: Grafo de trabajos de CI, puertas de alcance y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-04-23T14:56:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9a03440ae28a15167fc08d9c66bb1fd719ddfa1517aaecb119c80f2ad826c0d
    source_path: ci.md
    workflow: 15
---

# Canalización de CI

La CI se ejecuta en cada push a `main` y en cada pull request. Usa un alcance inteligente para omitir trabajos costosos cuando solo cambiaron áreas no relacionadas.

QA Lab tiene carriles de CI dedicados fuera del flujo de trabajo principal con alcance inteligente. El flujo de trabajo `Parity gate` se ejecuta en cambios coincidentes de PR y en ejecución manual; compila el runtime privado de QA y compara los paquetes agentic simulados de GPT-5.4 y Opus 4.6. El flujo de trabajo `QA-Lab - All Lanes` se ejecuta cada noche en `main` y en ejecución manual; distribuye en paralelo el parity gate simulado, el carril en vivo de Matrix y el carril en vivo de Telegram. Los trabajos en vivo usan el entorno `qa-live-shared`, y el carril de Telegram usa leases de Convex. `OpenClaw Release Checks` también ejecuta los mismos carriles de QA Lab antes de la aprobación de la versión.

## Resumen de trabajos

| Trabajo                          | Propósito                                                                                    | Cuándo se ejecuta                    |
| -------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Detectar cambios solo de documentación, alcances modificados, extensiones modificadas y compilar el manifiesto de CI | Siempre en pushes y PR no marcados como draft |
| `security-scm-fast`              | Detección de claves privadas y auditoría de flujos de trabajo mediante `zizmor`              | Siempre en pushes y PR no marcados como draft |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias frente a avisos de npm                 | Siempre en pushes y PR no marcados como draft |
| `security-fast`                  | Agregado requerido para los trabajos rápidos de seguridad                                    | Siempre en pushes y PR no marcados como draft |
| `build-artifacts`                | Compilar `dist/`, la IU de Control, comprobaciones de artefactos compilados y artefactos reutilizables posteriores | Cambios relevantes para Node         |
| `checks-fast-core`               | Carriles rápidos de corrección en Linux, como comprobaciones de paquetes incluidos/contrato de plugins/protocolo | Cambios relevantes para Node         |
| `checks-fast-contracts-channels` | Comprobaciones fragmentadas de contratos de canales con un resultado de comprobación agregado estable | Cambios relevantes para Node         |
| `checks-node-extensions`         | Fragmentos completos de pruebas de plugins incluidos en toda la suite de extensiones         | Cambios relevantes para Node         |
| `checks-node-core-test`          | Fragmentos de pruebas principales de Node, excluyendo carriles de canales, incluidos, contratos y extensiones | Cambios relevantes para Node         |
| `extension-fast`                 | Pruebas focalizadas solo para los plugins incluidos modificados                              | Pull requests con cambios en extensiones |
| `check`                          | Equivalente local principal fragmentado: tipos de prod, lint, guardas, tipos de prueba y smoke estricto | Cambios relevantes para Node         |
| `check-additional`               | Guardas de arquitectura, límites, superficie de extensiones, límites de paquetes y fragmentos de gateway-watch | Cambios relevantes para Node         |
| `build-smoke`                    | Pruebas smoke de CLI compilada y smoke de memoria al arranque                                | Cambios relevantes para Node         |
| `checks`                         | Verificador para pruebas de canales con artefactos compilados más compatibilidad de Node 22 solo en push | Cambios relevantes para Node         |
| `check-docs`                     | Formato, lint y comprobaciones de enlaces rotos de la documentación                          | La documentación cambió              |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                             | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Carriles de prueba específicos de Windows                                                    | Cambios relevantes para Windows      |
| `macos-node`                     | Carril de pruebas de TypeScript en macOS usando los artefactos compilados compartidos        | Cambios relevantes para macOS        |
| `macos-swift`                    | Lint, compilación y pruebas de Swift para la app de macOS                                    | Cambios relevantes para macOS        |
| `android`                        | Pruebas unitarias de Android para ambos sabores más una compilación de APK de depuración     | Cambios relevantes para Android      |

## Orden de fail-fast

Los trabajos se ordenan para que las comprobaciones baratas fallen antes de que se ejecuten las costosas:

1. `preflight` decide qué carriles existen en primer lugar. La lógica `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápido sin esperar a los trabajos más pesados de artefactos y matrices de plataforma.
3. `build-artifacts` se superpone con los carriles rápidos de Linux para que los consumidores posteriores puedan comenzar tan pronto como la compilación compartida esté lista.
4. Después se distribuyen los carriles más pesados de plataforma y runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` solo para PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`.
Las ediciones del flujo de trabajo de CI validan el grafo de CI de Node más el lint del flujo de trabajo, pero no fuerzan por sí solas compilaciones nativas de Windows, Android o macOS; esos carriles de plataforma siguen limitados a cambios en el código fuente de la plataforma.
Las comprobaciones de Node para Windows se limitan a wrappers específicos de procesos/rutas de Windows, ayudantes de ejecución de npm/pnpm/IU, configuración del gestor de paquetes y las superficies del flujo de trabajo de CI que ejecutan ese carril; los cambios no relacionados de código fuente, plugins, install-smoke y solo de pruebas permanecen en los carriles de Node para Linux para que no reserven un worker de Windows de 16 vCPU para cobertura que ya ejercen los fragmentos normales de pruebas.
El flujo de trabajo separado `install-smoke` reutiliza el mismo script de alcance mediante su propio trabajo `preflight`. Calcula `run_install_smoke` a partir de la señal más estrecha changed-smoke, de modo que el smoke de Docker/instalación se ejecuta para cambios relevantes de instalación, empaquetado, contenedores, cambios de producción en extensiones incluidas y las superficies principales de plugin/canal/gateway/Plugin SDK que ejercen los trabajos smoke de Docker. Las ediciones solo de pruebas y solo de documentación no reservan workers de Docker. Su smoke de paquete QR fuerza a que la capa Docker de `pnpm install` se vuelva a ejecutar mientras preserva la caché del almacén pnpm de BuildKit, por lo que sigue ejercitando la instalación sin volver a descargar dependencias en cada ejecución. Su e2e de gateway-network reutiliza la imagen de runtime compilada antes en el trabajo, por lo que añade cobertura real de WebSocket entre contenedores sin añadir otra compilación de Docker. El `test:docker:all` local precompila una imagen compartida de live-test y una imagen compartida de app compilada `scripts/e2e/Dockerfile`, y luego ejecuta en paralelo los carriles smoke live/E2E con `OPENCLAW_SKIP_DOCKER_BUILD=1`; ajusta la concurrencia predeterminada de 4 con `OPENCLAW_DOCKER_ALL_PARALLELISM`. El agregado local deja de programar nuevos carriles agrupados tras el primer fallo de manera predeterminada, y cada carril tiene un tiempo de espera de 120 minutos que puede sustituirse con `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`. Los carriles sensibles al arranque o al proveedor se ejecutan en exclusiva después del grupo paralelo. El flujo de trabajo reutilizable live/E2E refleja el patrón de imagen compartida al compilar y subir una imagen Docker E2E GHCR etiquetada con SHA antes de la matriz de Docker, y luego ejecuta la matriz con `OPENCLAW_SKIP_DOCKER_BUILD=1`. El flujo de trabajo programado live/E2E ejecuta diariamente la suite completa de Docker de la ruta de versión. Las pruebas Docker de QR y del instalador mantienen sus propios Dockerfiles centrados en la instalación. Un trabajo `docker-e2e-fast` independiente ejecuta el perfil acotado de plugins incluidos de Docker con un tiempo de espera de comando de 120 segundos: reparación de dependencias de setup-entry más aislamiento sintético de fallos del bundled-loader. La matriz completa de actualización de incluidos/canales permanece manual/de suite completa porque realiza pases repetidos reales de actualización de npm y reparación con doctor.

La lógica local de carriles modificados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa puerta local es más estricta con los límites de arquitectura que el alcance amplio de plataformas de la CI: los cambios de producción del núcleo ejecutan typecheck de producción del núcleo más pruebas del núcleo, los cambios solo en pruebas del núcleo ejecutan únicamente typecheck/pruebas del núcleo, los cambios de producción de extensiones ejecutan typecheck de producción de extensiones más pruebas de extensiones, y los cambios solo en pruebas de extensiones ejecutan únicamente typecheck/pruebas de extensiones. Los cambios en el Plugin SDK público o en plugin-contract amplían la validación a extensiones porque las extensiones dependen de esos contratos principales. Los aumentos de versión solo de metadatos de versión ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz. Los cambios raíz/configuración desconocidos fallan de forma segura hacia todos los carriles.

En los pushes, la matriz `checks` añade el carril `compat-node22` solo para push. En las pull requests, ese carril se omite y la matriz se mantiene centrada en los carriles normales de pruebas/canales.

Las familias de pruebas de Node más lentas se dividen o equilibran para que cada trabajo siga siendo pequeño sin sobrerreservar runners: los contratos de canales se ejecutan como tres fragmentos ponderados, las pruebas de plugins incluidos se equilibran en seis workers de extensión, los carriles pequeños de unidades principales se emparejan, auto-reply se ejecuta como tres workers equilibrados en lugar de seis workers diminutos, y las configuraciones agentic de gateway/plugin se distribuyen entre los trabajos agentic Node existentes solo de código fuente en lugar de esperar a los artefactos compilados. Las pruebas amplias de navegador, QA, medios y plugins diversos usan sus configuraciones dedicadas de Vitest en lugar del conjunto compartido genérico de plugins. El carril amplio de agentes usa el programador compartido de paralelismo por archivo de Vitest porque está dominado por importación/programación y no pertenece a un único archivo de prueba lento. `runtime-config` se ejecuta con el fragmento infra core-runtime para evitar que el fragmento de runtime compartido cargue con la cola final. `check-additional` mantiene juntos el trabajo compile/canary de límites de paquete y separa la arquitectura de topología de runtime de la cobertura de gateway watch; el fragmento de guardas de límites ejecuta sus pequeñas guardas independientes de forma concurrente dentro de un mismo trabajo. Gateway watch, pruebas de canales y el fragmento principal de límites de soporte se ejecutan de forma concurrente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén compilados, manteniendo sus antiguos nombres de comprobación como trabajos verificadores ligeros mientras se evitan dos workers Blacksmith extra y una segunda cola de consumidores de artefactos.
La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest`, y luego compila el APK de depuración Play. El sabor third-party no tiene un conjunto de fuentes ni un manifiesto separado; su carril de pruebas unitarias sigue compilando ese sabor con los indicadores BuildConfig de SMS/registro de llamadas, al tiempo que evita un trabajo duplicado de empaquetado de APK de depuración en cada push relevante para Android.
`extension-fast` es solo para PR porque las ejecuciones en push ya ejecutan los fragmentos completos de plugins incluidos. Eso mantiene la retroalimentación de plugins modificados para revisiones sin reservar un worker Blacksmith adicional en `main` para cobertura ya presente en `checks-node-extensions`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un push más reciente en la misma referencia de PR o `main`. Trátalo como ruido de CI a menos que también esté fallando la ejecución más reciente para esa misma referencia. Las comprobaciones agregadas de fragmentos usan `!cancelled() && always()` para que sigan informando fallos normales de fragmentos, pero no se pongan en cola después de que todo el flujo de trabajo ya haya sido reemplazado.
La clave de concurrencia de CI está versionada (`CI-v7-*`) para que un proceso zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente las ejecuciones más nuevas de main.

## Runners

| Runner                           | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, trabajos rápidos de seguridad y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocolo/contrato/incluidos, comprobaciones fragmentadas de contratos de canales, fragmentos de `check` excepto lint, fragmentos y agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de documentación, Skills de Python, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu alojado por GitHub para que la matriz de Blacksmith pueda entrar en cola antes |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de pruebas de Linux Node, fragmentos de pruebas de plugins incluidos, `android`                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, que sigue siendo lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban; compilaciones Docker de install-smoke, donde el costo en tiempo de cola de 32 vCPU fue mayor que el ahorro                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                    |

## Equivalentes locales

```bash
pnpm changed:lanes   # inspeccionar el clasificador local de carriles modificados para origin/main...HEAD
pnpm check:changed   # puerta local inteligente: typecheck/lint/pruebas modificados por carril de límites
pnpm check          # puerta local rápida: tsgo de producción + lint fragmentado + guardas rápidas en paralelo
pnpm check:test-types
pnpm check:timed    # la misma puerta con tiempos por etapa
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # pruebas de vitest
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # formato + lint + enlaces rotos de la documentación
pnpm build          # compilar dist cuando importan los carriles de artefactos/compilación-smoke de la CI
node scripts/ci-run-timings.mjs <run-id>      # resumir tiempo total, tiempo en cola y los trabajos más lentos
node scripts/ci-run-timings.mjs --recent 10   # comparar ejecuciones recientes exitosas de la CI de main
```
