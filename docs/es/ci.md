---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó.
    - Estás depurando comprobaciones fallidas de GitHub Actions.
summary: Grafo de trabajos de CI, puertas de alcance y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-04-23T05:14:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: b3c2cf85b45405fdd5cc1d74c7cc07c4f16c3d9dcf8ca93286a0ba78ba4b6dd1
    source_path: ci.md
    workflow: 15
---

# Canalización de CI

La CI se ejecuta en cada push a `main` y en cada pull request. Usa un alcance inteligente para omitir trabajos costosos cuando solo cambiaron áreas no relacionadas.

QA Lab tiene dos carriles de CI dedicados fuera del flujo principal con alcance inteligente. El flujo `Parity gate` se ejecuta en cambios coincidentes de PR, cada noche en `main` y mediante ejecución manual; compila el entorno privado de QA y compara los paquetes agentic simulados de GPT-5.4 y Opus 4.6. El flujo `QA-Lab - Live Telegram, Live Frontier` se ejecuta cada noche en `main` y mediante ejecución manual; usa el entorno `qa-live-shared` más concesiones de Convex para el carril de Telegram en vivo. `OpenClaw Release Checks` también ejecuta ambos carriles de QA Lab antes de la aprobación de la versión.

## Resumen de trabajos

| Trabajo                          | Propósito                                                                                     | Cuándo se ejecuta                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Detectar cambios solo de documentación, alcances modificados, extensiones modificadas y compilar el manifiesto de CI | Siempre en pushes y PR no borrador   |
| `security-scm-fast`              | Detección de claves privadas y auditoría de flujos mediante `zizmor`                           | Siempre en pushes y PR no borrador   |
| `security-dependency-audit`      | Auditoría del lockfile de producción sin dependencias contra avisos de npm                     | Siempre en pushes y PR no borrador   |
| `security-fast`                  | Agregado requerido para los trabajos rápidos de seguridad                                      | Siempre en pushes y PR no borrador   |
| `build-artifacts`                | Compilar `dist/`, la UI de Control, comprobaciones de artefactos compilados y artefactos reutilizables aguas abajo | Cambios relevantes para Node         |
| `checks-fast-core`               | Carriles rápidos de corrección en Linux, como comprobaciones de bundled/plugin-contract/protocol | Cambios relevantes para Node         |
| `checks-fast-contracts-channels` | Comprobaciones fragmentadas de contratos de canales con un resultado agregado estable          | Cambios relevantes para Node         |
| `checks-node-extensions`         | Fragmentos completos de pruebas de plugins integrados en todo el conjunto de extensiones       | Cambios relevantes para Node         |
| `checks-node-core-test`          | Fragmentos de pruebas del núcleo de Node, excluyendo carriles de canales, integrados, contratos y extensiones | Cambios relevantes para Node         |
| `extension-fast`                 | Pruebas enfocadas solo para los plugins integrados modificados                                 | Pull requests con cambios en extensiones |
| `check`                          | Equivalente principal local fragmentado: tipos de producción, lint, guardas, tipos de prueba y smoke estricto | Cambios relevantes para Node         |
| `check-additional`               | Guardas de arquitectura, límites, superficie de extensiones, límites de paquetes y fragmentos de gateway-watch | Cambios relevantes para Node         |
| `build-smoke`                    | Pruebas smoke de la CLI compilada y smoke de memoria al inicio                                | Cambios relevantes para Node         |
| `checks`                         | Verificador para pruebas de canales con artefactos compilados más compatibilidad con Node 22 solo en pushes | Cambios relevantes para Node         |
| `check-docs`                     | Formato, lint y comprobaciones de enlaces rotos de la documentación                            | La documentación cambió              |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                               | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Carriles de prueba específicos de Windows                                                      | Cambios relevantes para Windows      |
| `macos-node`                     | Carril de pruebas de TypeScript en macOS usando los artefactos compilados compartidos          | Cambios relevantes para macOS        |
| `macos-swift`                    | Lint, compilación y pruebas de Swift para la app de macOS                                     | Cambios relevantes para macOS        |
| `android`                        | Pruebas unitarias de Android para ambos sabores más una compilación del APK de depuración     | Cambios relevantes para Android      |

## Orden de fallo rápido

Los trabajos están ordenados para que las comprobaciones baratas fallen antes de que se ejecuten las costosas:

1. `preflight` decide qué carriles existen en absoluto. La lógica `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápido sin esperar a los trabajos más pesados de artefactos y matriz de plataforma.
3. `build-artifacts` se superpone con los carriles rápidos de Linux para que los consumidores aguas abajo puedan empezar en cuanto la compilación compartida esté lista.
4. Después se abren en abanico los carriles más pesados de plataforma y entorno de ejecución: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast` solo para PR, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`.
Las ediciones del flujo de CI validan el grafo de CI de Node más el lint de flujos, pero no fuerzan por sí mismas compilaciones nativas de Windows, Android o macOS; esos carriles de plataforma siguen limitados a cambios en el código fuente de la plataforma.
Las comprobaciones de Node para Windows se limitan a envoltorios de proceso/ruta específicos de Windows, ayudas de ejecución de npm/pnpm/UI, configuración del gestor de paquetes y las superficies del flujo de CI que ejecutan ese carril; los cambios no relacionados en código fuente, plugins, install-smoke y solo pruebas permanecen en los carriles de Node para Linux para no reservar un worker de Windows de 16 vCPU para una cobertura que ya ejercen los fragmentos de prueba normales.
El flujo separado `install-smoke` reutiliza el mismo script de alcance mediante su propio trabajo `preflight`. Calcula `run_install_smoke` a partir de la señal más estrecha changed-smoke, por lo que el smoke de Docker/instalación se ejecuta para cambios de instalación, empaquetado, relevantes para contenedores, cambios de producción en extensiones integradas y las superficies del núcleo de plugin/channel/gateway/Plugin SDK que ejercen los trabajos smoke de Docker. Las ediciones solo de pruebas y solo de documentación no reservan workers de Docker. Su smoke de paquete QR fuerza a que la capa Docker `pnpm install` se vuelva a ejecutar mientras preserva la caché del almacén pnpm de BuildKit, por lo que sigue ejercitando la instalación sin volver a descargar dependencias en cada ejecución. Su gateway-network e2e reutiliza la imagen de entorno de ejecución compilada antes en el trabajo, por lo que añade cobertura WebSocket real entre contenedores sin añadir otra compilación de Docker. El comando local `test:docker:all` precompila una imagen compartida de app compilada `scripts/e2e/Dockerfile` y la reutiliza en los ejecutores smoke de contenedores E2E; el flujo reutilizable live/E2E refleja ese patrón al compilar y publicar una imagen Docker E2E de GHCR etiquetada con SHA antes de la matriz Docker, y luego ejecuta la matriz con `OPENCLAW_SKIP_DOCKER_BUILD=1`. Las pruebas Docker de QR e instalador mantienen sus propios Dockerfiles centrados en la instalación. Un trabajo separado `docker-e2e-fast` ejecuta el perfil Docker acotado de plugins integrados bajo un tiempo límite de comando de 120 segundos: reparación de dependencias setup-entry más aislamiento sintético de fallos del bundled-loader. La matriz completa de actualización/canales integrados sigue siendo manual/de conjunto completo porque realiza pases repetidos reales de actualización npm y reparación con doctor.

La lógica local de carriles modificados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa puerta local es más estricta con los límites de arquitectura que el amplio alcance de plataformas de la CI: los cambios de producción del núcleo ejecutan typecheck de producción del núcleo más pruebas del núcleo, los cambios solo de pruebas del núcleo ejecutan solo typecheck/pruebas del núcleo para pruebas, los cambios de producción de extensiones ejecutan typecheck de producción de extensiones más pruebas de extensiones, y los cambios solo de pruebas de extensiones ejecutan solo typecheck/pruebas de extensiones para pruebas. Los cambios en Plugin SDK público o plugin-contract se amplían a validación de extensiones porque las extensiones dependen de esos contratos del núcleo. Los incrementos de versión solo de metadatos de versión de lanzamiento ejecutan comprobaciones dirigidas de versión/configuración/dependencias raíz. Los cambios desconocidos en raíz/configuración fallan de forma segura hacia todos los carriles.

En los pushes, la matriz `checks` añade el carril `compat-node22`, solo para pushes. En las pull requests, ese carril se omite y la matriz permanece centrada en los carriles normales de prueba/canales.

Las familias de pruebas de Node más lentas están divididas o equilibradas para que cada trabajo siga siendo pequeño: los contratos de canales dividen la cobertura de registro y del núcleo en seis fragmentos ponderados en total, las pruebas de plugins integrados se equilibran en seis workers de extensiones, auto-reply se ejecuta como tres workers equilibrados en lugar de seis workers diminutos, y las configuraciones agentic de gateway/plugin se distribuyen entre los trabajos de Node agentic existentes de solo código fuente en lugar de esperar a artefactos compilados. Las pruebas amplias de navegador, QA, medios y plugins diversos usan sus configuraciones Vitest dedicadas en lugar del comodín compartido de plugins. El carril amplio de agentes usa el programador compartido de Vitest en paralelo por archivo porque está dominado por importación/programación más que por un único archivo de prueba lento. `runtime-config` se ejecuta con el fragmento infra core-runtime para evitar que el fragmento compartido de runtime posea la cola. `check-additional` mantiene juntos el trabajo de compilación/canary de límites de paquete y separa la arquitectura de topología de runtime de la cobertura gateway watch; el fragmento de guardas de límites ejecuta sus pequeñas guardas independientes de forma concurrente dentro de un solo trabajo. Gateway watch, las pruebas de canales y el fragmento de límites de soporte del núcleo se ejecutan de forma concurrente dentro de `build-artifacts` después de que `dist/` y `dist-runtime/` ya estén compilados, manteniendo sus nombres antiguos de comprobación como trabajos verificadores ligeros mientras se evitan dos workers adicionales de Blacksmith y una segunda cola de consumidores de artefactos.
La CI de Android ejecuta tanto `testPlayDebugUnitTest` como `testThirdPartyDebugUnitTest`, y después compila el APK Play de depuración. El sabor third-party no tiene un conjunto de fuentes ni un manifiesto independientes; su carril de pruebas unitarias sigue compilando ese sabor con las flags BuildConfig de SMS/registro de llamadas, mientras evita un trabajo duplicado de empaquetado de APK de depuración en cada push relevante para Android.
`extension-fast` es solo para PR porque las ejecuciones en push ya ejecutan todos los fragmentos completos de plugins integrados. Eso mantiene la retroalimentación sobre plugins modificados para las revisiones sin reservar un worker adicional de Blacksmith en `main` para una cobertura ya presente en `checks-node-extensions`.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un push más reciente al mismo PR o ref `main`. Trátalo como ruido de CI a menos que la ejecución más reciente para la misma ref también esté fallando. Las comprobaciones agregadas de fragmentos usan `!cancelled() && always()` para que sigan informando de fallos normales de fragmentos, pero no entren en cola después de que todo el flujo ya haya sido reemplazado.
La clave de concurrencia de la CI está versionada (`CI-v7-*`) para que un zombi del lado de GitHub en un grupo de cola antiguo no pueda bloquear indefinidamente ejecuciones más nuevas de main.

## Ejecutores

| Ejecutor                         | Trabajos                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, trabajos rápidos de seguridad y agregados (`security-scm-fast`, `security-dependency-audit`, `security-fast`), comprobaciones rápidas de protocol/contract/bundled, comprobaciones fragmentadas de contratos de canales, fragmentos de `check` excepto lint, fragmentos y agregados de `check-additional`, verificadores agregados de pruebas de Node, comprobaciones de documentación, Skills de Python, workflow-sanity, labeler, auto-response; el preflight de install-smoke también usa Ubuntu alojado por GitHub para que la matriz de Blacksmith pueda entrar en cola antes |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, fragmentos de pruebas de Node en Linux, fragmentos de pruebas de plugins integrados, `android`                                                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, que sigue siendo lo bastante sensible a CPU como para que 8 vCPU costaran más de lo que ahorraban; compilaciones Docker de install-smoke, donde el tiempo de cola de 32 vCPU costaba más de lo que ahorraba                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` en `openclaw/openclaw`; los forks vuelven a `macos-latest`                                                                                                                                                                                                                                                                                                                                                                                                |

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
pnpm check:docs     # formato de documentación + lint + enlaces rotos
pnpm build          # compilar dist cuando importan los carriles de artefactos/compilación smoke de la CI
node scripts/ci-run-timings.mjs <run-id>  # resumir tiempo total, tiempo en cola y trabajos más lentos
```
