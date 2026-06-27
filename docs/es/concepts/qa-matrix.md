---
read_when:
    - Ejecutar pnpm openclaw qa matrix localmente
    - Añadir o seleccionar escenarios de control de calidad de Matrix
    - Triaje de fallos, tiempos de espera o limpieza bloqueada de Matrix QA
summary: 'Referencia para mantenedores de la vía de QA en vivo de Matrix respaldada por Docker: CLI, perfiles, variables de entorno, escenarios y artefactos de salida.'
title: Control de calidad de Matrix
x-i18n:
    generated_at: "2026-05-06T05:32:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c6d836492368c470468547950d3765a64187694852222a5a1f0ae4185569abe
    source_path: concepts/qa-matrix.md
    workflow: 16
    postprocess_version: locale-links-v1
---

El carril de QA de Matrix ejecuta el Plugin `@openclaw/matrix` incluido contra un homeserver Tuwunel desechable en Docker, con cuentas temporales de controlador, SUT y observador, además de salas inicializadas. Es la cobertura en vivo con transporte real para Matrix.

Esta herramienta es solo para mantenedores. Las versiones empaquetadas de OpenClaw omiten intencionalmente `qa-lab`, por lo que `openclaw qa` solo está disponible desde un checkout de código fuente. Los checkouts de código fuente cargan directamente el ejecutor incluido; no se necesita ningún paso de instalación del Plugin.

Para obtener más contexto sobre el marco de QA, consulta la [descripción general de QA](/es/concepts/qa-e2e-automation).

## Inicio rápido

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` simple ejecuta `--profile all` y no se detiene en el primer fallo. Usa `--profile fast --fail-fast` para una puerta de lanzamiento; divide el catálogo con `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` al ejecutar el inventario completo en paralelo.

## Qué hace el carril

1. Aprovisiona un homeserver Tuwunel desechable en Docker (imagen predeterminada `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nombre del servidor `matrix-qa.test`, puerto `28008`).
2. Registra tres usuarios temporales: `driver` (envía tráfico entrante), `sut` (la cuenta de Matrix de OpenClaw bajo prueba), `observer` (captura de tráfico de terceros).
3. Inicializa las salas requeridas por los escenarios seleccionados (principal, hilos, medios, reinicio, secundaria, lista de permitidos, E2EE, DM de verificación, etc.).
4. Inicia un Gateway hijo de OpenClaw con el Plugin real de Matrix limitado a la cuenta SUT; `qa-channel` no se carga en el hijo.
5. Ejecuta los escenarios en secuencia y observa eventos mediante los clientes de Matrix del controlador/observador.
6. Desmonta el homeserver, escribe los artefactos de informe y resumen, y luego sale.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Marcas comunes

| Marca                 | Predeterminado                               | Descripción                                                                                                                    |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `--profile <profile>` | `all`                                         | Perfil de escenario. Consulta [Perfiles](#profiles).                                                                           |
| `--fail-fast`         | desactivado                                  | Detener después de la primera comprobación o escenario fallido.                                                                |
| `--scenario <id>`     | -                                             | Ejecutar solo este escenario. Repetible. Consulta [Escenarios](#scenarios).                                                    |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Dónde se escriben los informes, el resumen, los eventos observados y el registro de salida. Las rutas relativas se resuelven respecto a `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Raíz del repositorio al invocar desde un directorio de trabajo neutral.                                                        |
| `--sut-account <id>`  | `sut`                                         | ID de cuenta de Matrix dentro de la configuración del Gateway de QA.                                                           |

### Marcas de proveedor

El carril usa un transporte real de Matrix, pero el proveedor de modelo es configurable:

| Marca                    | Predeterminado             | Descripción                                                                                                                                           |
| ------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`            | `mock-openai` para despacho simulado determinista o `live-frontier` para proveedores frontier en vivo. El alias heredado `live-openai` aún funciona. |
| `--model <ref>`          | predeterminado del proveedor | Ref principal `provider/model`.                                                                                                                       |
| `--alt-model <ref>`      | predeterminado del proveedor | Ref alternativo `provider/model` cuando los escenarios cambian a mitad de ejecución.                                                                  |
| `--fast`                 | desactivado                | Activar el modo rápido del proveedor donde sea compatible.                                                                                            |

QA de Matrix no acepta `--credential-source` ni `--credential-role`. El carril aprovisiona usuarios desechables localmente; no hay un conjunto compartido de credenciales contra el cual alquilar.

## Perfiles

El perfil seleccionado decide qué escenarios se ejecutan.

| Perfil          | Úsalo para                                                                                                                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (predeterminado) | Catálogo completo. Lento pero exhaustivo.                                                                                                                                                                                                |
| `fast`          | Subconjunto de puerta de lanzamiento que ejercita el contrato de transporte en vivo: canary, control por menciones, bloqueo de lista de permitidos, forma de respuesta, reanudación tras reinicio, seguimiento de hilo, aislamiento de hilo, observación de reacciones y entrega de metadatos de aprobación de exec. |
| `transport`     | Escenarios de hilos, DM, sala, autojoin, mención/lista de permitidos, aprobación y reacciones a nivel de transporte.                                                                                                                           |
| `media`         | Cobertura de adjuntos de imagen, audio, video, PDF y EPUB.                                                                                                                                                                                      |
| `e2ee-smoke`    | Cobertura mínima de E2EE: respuesta cifrada básica, seguimiento de hilo, éxito de bootstrap.                                                                                                                                                    |
| `e2ee-deep`     | Escenarios exhaustivos de pérdida de estado, copia de seguridad, claves y recuperación de E2EE.                                                                                                                                                 |
| `e2ee-cli`      | Escenarios de CLI `openclaw matrix encryption setup` y `verify *` ejecutados mediante el arnés de QA.                                                                                                                                           |

El mapeo exacto está en `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Escenarios

La lista completa de ID de escenario es la unión `MatrixQaScenarioId` en `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Las categorías incluyen:

- hilos: `matrix-thread-*`, `matrix-subagent-thread-spawn`
- nivel superior / DM / sala: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming y progreso de herramientas: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- medios: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- enrutamiento: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reacciones: `matrix-reaction-*`
- aprobaciones: `matrix-approval-*` (metadatos de exec/Plugin, reserva fragmentada, reacciones de denegación, hilos y enrutamiento `target: "both"`)
- reinicio y reproducción: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- control por menciones, bot a bot y listas de permitidos: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*` (respuesta básica, seguimiento de hilo, bootstrap, ciclo de vida de clave de recuperación, variantes de pérdida de estado, comportamiento de copia de seguridad del servidor, higiene de dispositivos, verificación SAS / QR / DM, reinicio, redacción de artefactos)
- CLI de E2EE: `matrix-e2ee-cli-*` (configuración de cifrado, configuración idempotente, fallo de bootstrap, ciclo de vida de clave de recuperación, múltiples cuentas, ida y vuelta de respuesta del Gateway, autoverificación)

Pasa `--scenario <id>` (repetible) para ejecutar un conjunto elegido manualmente; combínalo con `--profile all` para ignorar el control por perfil.

## Variables de entorno

| Variable                                | Predeterminado                            | Efecto                                                                                                                                                                                                    |
| --------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Límite superior estricto para toda la ejecución.                                                                                                                                                          |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Límite para la respuesta canaria inicial. La CI de publicación aumenta esto en runners compartidos para que un primer turno lento de Gateway no falle antes de que comience la cobertura de escenarios.   |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Ventana silenciosa para aserciones negativas sin respuesta. Se limita a `≤` el tiempo de espera de la ejecución.                                                                                          |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Límite para el desmontaje de Docker. Las superficies de fallo incluyen el comando de recuperación `docker compose ... down --remove-orphans`.                                                              |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Sobrescribe la imagen del servidor doméstico al validar con una versión distinta de Tuwunel.                                                                                                               |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | activado                                  | `0` silencia las líneas de progreso `[matrix-qa] ...` en stderr. `1` las fuerza.                                                                                                                           |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redactado                                 | `1` conserva el cuerpo del mensaje y `formatted_body` en `matrix-qa-observed-events.json`. De forma predeterminada, se redacta para mantener seguros los artefactos de CI.                                |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | desactivado                               | `1` omite el `process.exit` determinista después de escribir el artefacto. El valor predeterminado fuerza la salida porque los manejadores de criptografía nativa de matrix-js-sdk pueden mantener activo el bucle de eventos después de completar los artefactos. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | sin establecer                            | Cuando lo establece un lanzador externo (por ejemplo, `scripts/run-node.mjs`), QA de Matrix reutiliza esa ruta de registro en lugar de iniciar su propio tee.                                             |

## Artefactos de salida

Se escriben en `--output-dir`:

- `matrix-qa-report.md` - Informe de protocolo en Markdown (qué pasó, falló, se omitió y por qué).
- `matrix-qa-summary.json` - Resumen estructurado apto para análisis de CI y paneles.
- `matrix-qa-observed-events.json` - Eventos de Matrix observados desde los clientes controlador y observador. Los cuerpos se redactan salvo que `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; los metadatos de aprobación se resumen con campos seguros seleccionados y una vista previa truncada del comando.
- `matrix-qa-output.log` - stdout/stderr combinados de la ejecución. Si `OPENCLAW_RUN_NODE_OUTPUT_LOG` está establecido, se reutiliza el registro del lanzador externo.

El directorio de salida predeterminado es `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` para que las ejecuciones sucesivas no se sobrescriban entre sí.

## Consejos de triaje

- **La ejecución se bloquea cerca del final:** los manejadores de criptografía nativa de `matrix-js-sdk` pueden sobrevivir al arnés. El valor predeterminado fuerza un `process.exit` limpio después de escribir el artefacto; si has desactivado `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, espera que el proceso permanezca activo.
- **Error de limpieza:** busca el comando de recuperación impreso (una invocación `docker compose ... down --remove-orphans`) y ejecútalo manualmente para liberar el puerto del servidor doméstico.
- **Ventanas de aserción negativa inestables en CI:** reduce `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (valor predeterminado: 8 s) cuando CI sea rápida; auméntalo en runners compartidos lentos.
- **Necesitas cuerpos redactados para un informe de error:** vuelve a ejecutar con `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` y adjunta `matrix-qa-observed-events.json`. Trata el artefacto resultante como sensible.
- **Versión diferente de Tuwunel:** apunta `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` a la versión bajo prueba. La vía solo verifica la imagen predeterminada fijada.

## Contrato de transporte en vivo

Matrix es una de las tres vías de transporte en vivo (Matrix, Telegram, Discord) que comparten una única lista de verificación de contrato definida en [Resumen de QA → Cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` sigue siendo la suite sintética amplia y no forma parte intencionadamente de esa matriz.

## Relacionado

- [Resumen de QA](/es/concepts/qa-e2e-automation) - pila general de QA y contrato de transporte en vivo
- [Canal de QA](/es/channels/qa-channel) - adaptador de canal sintético para escenarios respaldados por el repositorio
- [Pruebas](/es/help/testing) - ejecutar pruebas y añadir cobertura de QA
- [Matrix](/es/channels/matrix) - el Plugin de canal bajo prueba
