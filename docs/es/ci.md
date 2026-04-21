---
read_when:
    - Necesitas entender por qué un trabajo de CI se ejecutó o no se ejecutó
    - Estás depurando comprobaciones fallidas de GitHub Actions
summary: Grafo de trabajos de CI, compuertas por alcance y equivalentes de comandos locales
title: Canalización de CI
x-i18n:
    generated_at: "2026-04-21T05:13:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88a98d777fd61be1603417b71779aaf42a24d602b2437ad549f0075f22494cec
    source_path: ci.md
    workflow: 15
---

# Canalización de CI

La CI se ejecuta en cada push a `main` y en cada pull request. Usa alcance inteligente para omitir trabajos costosos cuando solo cambiaron áreas no relacionadas.

## Resumen de trabajos

| Trabajo                          | Propósito                                                                                   | Cuándo se ejecuta                  |
| -------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Detectar cambios solo en docs, alcances cambiados, extensiones cambiadas y construir el manifiesto de CI | Siempre en pushes y PR no borrador |
| `security-scm-fast`              | Detección de claves privadas y auditoría de workflows mediante `zizmor`                     | Siempre en pushes y PR no borrador |
| `security-dependency-audit`      | Auditoría sin dependencias del lockfile de producción contra avisos de npm                  | Siempre en pushes y PR no borrador |
| `security-fast`                  | Agregado requerido para los trabajos rápidos de seguridad                                   | Siempre en pushes y PR no borrador |
| `build-artifacts`                | Construir `dist/` y la UI de Control una vez, subir artifacts reutilizables para trabajos descendientes | Cambios relevantes para Node       |
| `checks-fast-core`               | Carriles rápidos de corrección en Linux, como verificaciones de bundled/plugin-contract/protocol | Cambios relevantes para Node       |
| `checks-fast-contracts-channels` | Verificaciones fragmentadas de contratos de canales con un resultado agregado estable       | Cambios relevantes para Node       |
| `checks-node-extensions`         | Fragmentos completos de pruebas de bundled-plugin en toda la suite de extensiones           | Cambios relevantes para Node       |
| `checks-node-core-test`          | Fragmentos de pruebas Node del núcleo, excluyendo carriles de canales, bundled, contratos y extensiones | Cambios relevantes para Node       |
| `extension-fast`                 | Pruebas focalizadas solo para los bundled plugins cambiados                                 | Cuando se detectan cambios en extensiones |
| `check`                          | Equivalente principal fragmentado de la compuerta local: tipos prod, lint, guardas, tipos de prueba y smoke estricto | Cambios relevantes para Node       |
| `check-additional`               | Guardas de arquitectura, límites, superficie de extensiones, límites de paquetes y fragmentos de gateway-watch | Cambios relevantes para Node       |
| `build-smoke`                    | Pruebas smoke del CLI construido y smoke de memoria al inicio                               | Cambios relevantes para Node       |
| `checks`                         | Carriles restantes de Linux Node: pruebas de canales y compatibilidad Node 22 solo para push | Cambios relevantes para Node       |
| `check-docs`                     | Formato, lint y verificación de enlaces rotos de docs                                       | Cuando cambian las docs            |
| `skills-python`                  | Ruff + pytest para Skills respaldadas por Python                                            | Cambios relevantes para Skills de Python |
| `checks-windows`                 | Carriles de prueba específicos de Windows                                                   | Cambios relevantes para Windows    |
| `macos-node`                     | Carril de pruebas TypeScript en macOS usando los artifacts compartidos ya construidos       | Cambios relevantes para macOS      |
| `macos-swift`                    | Lint, compilación y pruebas Swift para la app de macOS                                      | Cambios relevantes para macOS      |
| `android`                        | Matriz de compilación y pruebas de Android                                                  | Cambios relevantes para Android    |

## Orden de fallo rápido

Los trabajos se ordenan para que las verificaciones baratas fallen antes de que se ejecuten las costosas:

1. `preflight` decide qué carriles existen en absoluto. La lógica `docs-scope` y `changed-scope` son pasos dentro de este trabajo, no trabajos independientes.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` y `skills-python` fallan rápido sin esperar a los trabajos más pesados de artifacts y matrices de plataforma.
3. `build-artifacts` se superpone con los carriles rápidos de Linux para que los consumidores descendientes puedan empezar en cuanto la compilación compartida esté lista.
4. Después se expanden los carriles más pesados de plataforma y runtime: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` y `android`.

La lógica de alcance vive en `scripts/ci-changed-scope.mjs` y está cubierta por pruebas unitarias en `src/scripts/ci-changed-scope.test.ts`.
El workflow separado `install-smoke` reutiliza el mismo script de alcance mediante su propio trabajo `preflight`. Calcula `run_install_smoke` a partir de la señal más acotada changed-smoke, por lo que el smoke de Docker/install solo se ejecuta para cambios relevantes de instalación, empaquetado y contenedores.

La lógica local de carriles cambiados vive en `scripts/changed-lanes.mjs` y la ejecuta `scripts/check-changed.mjs`. Esa compuerta local es más estricta con los límites de arquitectura que el alcance amplio de plataforma de CI: los cambios de producción del núcleo ejecutan typecheck prod del núcleo más pruebas del núcleo, los cambios solo en pruebas del núcleo ejecutan solo typecheck/pruebas del núcleo, los cambios de producción de extensiones ejecutan typecheck prod de extensiones más pruebas de extensiones, y los cambios solo en pruebas de extensiones ejecutan solo typecheck/pruebas de extensiones. Los cambios en el Plugin SDK público o en plugin-contract amplían la validación a extensiones porque las extensiones dependen de esos contratos del núcleo. Los cambios desconocidos en raíz/config fallan de forma segura hacia todos los carriles.

En los pushes, la matriz `checks` agrega el carril `compat-node22`, solo para push. En los pull requests, ese carril se omite y la matriz se mantiene enfocada en los carriles normales de prueba/canales.

Las familias de pruebas Node más lentas se dividen en fragmentos por archivos incluidos para que cada trabajo siga siendo pequeño: los contratos de canales dividen la cobertura de registro y núcleo en ocho fragmentos ponderados cada uno, las pruebas del comando de respuesta de auto-reply se dividen en cuatro fragmentos por patrón de inclusión, y los demás grupos grandes de prefijos de respuesta de auto-reply se dividen en dos fragmentos cada uno. `check-additional` también separa el trabajo de compilación/canary de límites de paquetes del trabajo de topología de runtime de gateway/architecture.

GitHub puede marcar trabajos reemplazados como `cancelled` cuando llega un push más nuevo al mismo PR o ref `main`. Trátalo como ruido de CI, a menos que la ejecución más reciente para la misma ref también esté fallando. Las verificaciones agregadas de fragmentos destacan explícitamente este caso de cancelación para que sea más fácil distinguirlo de un fallo de prueba.

## Runners

| Runner                           | Trabajos                                                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, verificaciones de Linux, verificaciones de docs, Skills de Python, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                      |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                           |

## Equivalentes locales

```bash
pnpm changed:lanes   # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed   # smart local gate: changed typecheck/lint/tests by boundary lane
pnpm check          # fast local gate: production tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed    # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs format + lint + broken links
pnpm build          # build dist when CI artifact/build-smoke lanes matter
```
