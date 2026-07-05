---
read_when:
    - Ejecutar pnpm openclaw qa matrix localmente
    - Añadir o seleccionar escenarios de QA de Matrix
    - Clasificación de fallos, tiempos de espera o limpieza atascada de Matrix QA
summary: 'Referencia para mantenedores del carril de QA en vivo de Matrix respaldado por Docker: CLI, perfiles, variables de entorno, escenarios y artefactos de salida.'
title: Matriz de control de calidad
x-i18n:
    generated_at: "2026-07-05T11:16:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 012b07c4453cd2a206192e2c8caec6e0a7377796f94839a00282a6779a6cab88
    source_path: concepts/qa-matrix.md
    workflow: 16
---

El carril de QA de Matrix ejecuta el Plugin incluido `@openclaw/matrix` contra un homeserver Tuwunel desechable en Docker, con cuentas temporales de controlador, SUT y observador, además de salas presembradas. Es la cobertura real del transporte en vivo para Matrix.

Herramientas solo para mantenedores. Las versiones empaquetadas de OpenClaw omiten `qa-lab`, por lo que `openclaw qa` solo se ejecuta desde un checkout de código fuente, que carga directamente el runner incluido sin paso de instalación de Plugin.

Para obtener más contexto del marco de QA, consulta [descripción general de QA](/es/concepts/qa-e2e-automation).

## Inicio rápido

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` sin más ejecuta `--profile all` y no se detiene en el primer fallo. Divide el inventario completo entre trabajos paralelos con `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`.

## Qué hace el carril

1. Aprovisiona un homeserver Tuwunel desechable en Docker (imagen predeterminada `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nombre de servidor `matrix-qa.test`, puerto `28008`) detrás de un grabador acotado de solicitudes/respuestas con redacción.
2. Registra tres usuarios temporales: `driver` (envía tráfico entrante), `sut` (la cuenta de Matrix de OpenClaw bajo prueba), `observer` (captura de tráfico de terceros).
3. Presembrar las salas requeridas por los escenarios seleccionados (principal, hilos, medios, reinicio, secundaria, allowlist, E2EE, DM de verificación, etc.).
4. Ejecuta la sonda de protocolo `matrix-qa-v1`, neutral respecto al sustrato, contra el límite Tuwunel grabado. Las pruebas unitarias demuestran el contrato de la sonda con el fixture del protocolo Matrix; el host canónico del adaptador de transporte de QA en [#99707](https://github.com/openclaw/openclaw/pull/99707) posee el cableado real del destino Crabline.
5. Inicia un Gateway hijo de OpenClaw con el Plugin real de Matrix limitado a la cuenta SUT.
6. Ejecuta los escenarios en secuencia, observa eventos mediante los clientes Matrix de controlador/observador y deriva expectativas de ruta/estado a partir del tráfico grabado.
7. Desmonta el homeserver, escribe el informe y los artefactos de evidencia, y luego sale.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Indicadores comunes

| Indicador             | Predeterminado                               | Descripción                                                                                                                                       |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                         | Perfil de escenario. Consulta [Perfiles](#profiles).                                                                                              |
| `--fail-fast`         | desactivado                                  | Detenerse después de la primera comprobación o escenario fallido.                                                                                 |
| `--scenario <id>`     | -                                             | Ejecutar solo este escenario. Repetible. Consulta [Escenarios](#scenarios).                                                                       |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Dónde se escriben los informes, el resumen, el inventario de rutas/estado, los eventos observados y el registro de salida. Las rutas relativas se resuelven contra `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                               | Raíz del repositorio al invocar desde un directorio de trabajo neutral.                                                                           |
| `--sut-account <id>`  | `sut`                                         | Id. de cuenta de Matrix dentro de la configuración del Gateway de QA.                                                                             |

### Indicadores de proveedor

El carril usa un transporte real de Matrix, pero el proveedor de modelo es configurable:

| Indicador                | Predeterminado          | Descripción                                                                                                                                       |
| ------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`         | `mock-openai` para despacho simulado determinista o `live-frontier` para proveedores frontier en vivo. El alias heredado `live-openai` aún funciona. |
| `--model <ref>`          | predeterminado del proveedor | Ref. principal `provider/model`.                                                                                                             |
| `--alt-model <ref>`      | predeterminado del proveedor | Ref. alternativa `provider/model` cuando los escenarios cambian a mitad de ejecución.                                                         |
| `--fast`                 | desactivado             | Habilitar el modo rápido del proveedor donde sea compatible.                                                                                      |

QA de Matrix no acepta `--credential-source` ni `--credential-role`. El carril aprovisiona usuarios desechables localmente; no hay un conjunto compartido de credenciales contra el cual arrendar.

## Perfiles

| Perfil          | Úsalo para                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `all` (predeterminado) | Catálogo completo. Lento pero exhaustivo.                                                                                                                                                                                        |
| `fast`          | Subconjunto de puerta de lanzamiento que ejercita el contrato de transporte en vivo: canary, control de menciones, bloqueo de allowlist, forma de respuesta, reanudación tras reinicio, seguimiento de hilo, aislamiento de hilo, observación de reacciones y entrega de metadatos de aprobación de exec. |
| `transport`     | Escenarios de hilos, DM, sala, autojoin, mención/allowlist, aprobación y reacciones a nivel de transporte.                                                                                                                          |
| `media`         | Cobertura de adjuntos de imagen, audio, video, PDF y EPUB.                                                                                                                                                                           |
| `e2ee-smoke`    | Cobertura mínima de E2EE: respuesta cifrada básica, seguimiento de hilo, éxito de bootstrap.                                                                                                                                         |
| `e2ee-deep`     | Escenarios exhaustivos de pérdida de estado, copia de seguridad, claves y recuperación de E2EE.                                                                                                                                      |
| `e2ee-cli`      | Escenarios de CLI `openclaw matrix encryption setup` y `verify *` ejecutados mediante el harness de QA.                                                                                                                              |

La asignación exacta vive en `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Escenarios

La lista completa de ids. de escenario es la unión `MatrixQaScenarioId` en `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`. Categorías:

- hilos: `matrix-thread-*`, `matrix-subagent-thread-spawn`
- nivel superior / DM / sala: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming y progreso de herramientas: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- medios: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- enrutamiento: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reacciones: `matrix-reaction-*`
- aprobaciones: `matrix-approval-*` (metadatos de exec/Plugin, fallback fragmentado, reacciones de denegación, hilos y enrutamiento `target: "both"`)
- reinicio y reproducción: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- control de menciones, bot a bot y allowlists: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*` (respuesta básica, seguimiento de hilo, bootstrap, ciclo de vida de clave de recuperación, variantes de pérdida de estado, comportamiento de copia de seguridad del servidor, higiene de dispositivos, verificación SAS / QR / DM, reinicio, redacción de artefactos)
- CLI de E2EE: `matrix-e2ee-cli-*` (configuración de cifrado, configuración idempotente, fallo de bootstrap, ciclo de vida de clave de recuperación, varias cuentas, ida y vuelta de respuesta del Gateway, autoverificación)

Pasa `--scenario <id>` (repetible) para ejecutar un conjunto seleccionado manualmente; combínalo con `--profile all` para ignorar el control por perfil.

## Variables de entorno

| Variable                                | Predeterminado                            | Efecto                                                                                                                                                                                                      |
| --------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Límite superior estricto para toda la ejecución.                                                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Límite para la respuesta canario inicial. La CI de lanzamiento aumenta esto en ejecutores compartidos para que un primer turno lento del Gateway no falle antes de que comience la cobertura de escenarios. |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Ventana de silencio para aserciones negativas sin respuesta. Se limita a `<=` el tiempo de espera de la ejecución.                                                                                          |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Límite para el desmontaje de Docker. Las superficies de fallo incluyen el comando de recuperación `docker compose ... down --remove-orphans`.                                                                |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Sobrescribe la imagen del servidor doméstico al validar con una versión distinta de Tuwunel.                                                                                                                 |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | activado                                  | `0` silencia las líneas de progreso `[matrix-qa] ...` en stderr. `1` las fuerza a activarse.                                                                                                                 |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redactado                                 | `1` conserva el cuerpo del mensaje y `formatted_body` en `matrix-qa-observed-events.json`. El valor predeterminado redacta para mantener seguros los artefactos de CI.                                      |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | desactivado                               | `1` omite el `process.exit` determinista después de escribir artefactos. El valor predeterminado fuerza la salida porque los manejadores criptográficos nativos de matrix-js-sdk pueden mantener activo el bucle de eventos después de completar los artefactos. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | sin definir                               | Cuando lo define un lanzador externo (por ejemplo, `scripts/run-node.mjs`), la QA de Matrix reutiliza esa ruta de registro en lugar de iniciar su propio tee.                                                |

## Artefactos de salida

Escritos en `--output-dir` (predeterminado `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` para que las ejecuciones sucesivas no se sobrescriban entre sí):

- `matrix-qa-report.md`: informe de protocolo en Markdown (qué pasó, falló, se omitió y por qué).
- `matrix-qa-summary.json`: resumen estructurado adecuado para el análisis de CI y paneles.
- `matrix-qa-route-state-manifest.json`: inventario dinámico `matrix-qa-v1` indexado por id de escenario. Registra formas de ruta/cuerpo redactadas, orden de solicitudes, reintentos observados, errores, continuidad de tokens de sincronización y familias de estado de dispositivo/clave/medios/copia de seguridad observadas durante esa ejecución. Esto es evidencia ejecutable, no una línea base registrada en el repositorio.
- `matrix-qa-observed-events.json`: eventos de Matrix observados desde los clientes controlador y observador. Los cuerpos se redactan salvo que `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; los metadatos de aprobación se resumen con campos seguros seleccionados y una vista previa truncada del comando.
- `matrix-qa-output.log`: stdout/stderr combinados de la ejecución. Si `OPENCLAW_RUN_NODE_OUTPUT_LOG` está definido, se reutiliza en su lugar el registro del lanzador externo.

## Consejos de triaje

- **La ejecución se queda colgada cerca del final:** los manejadores criptográficos nativos de `matrix-js-sdk` pueden sobrevivir al arnés. El valor predeterminado fuerza un `process.exit` limpio después de escribir artefactos; si defines `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, espera que el proceso permanezca activo.
- **Error de limpieza:** busca el comando de recuperación impreso (una invocación `docker compose ... down --remove-orphans`) y ejecútalo manualmente para liberar el puerto del servidor doméstico.
- **Ventanas inestables de aserción negativa en CI:** reduce `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (predeterminado 8 s) cuando CI sea rápida; auméntalo en ejecutores compartidos lentos.
- **Necesitas cuerpos redactados para un informe de error:** vuelve a ejecutar con `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` y adjunta `matrix-qa-observed-events.json`. Trata el artefacto resultante como sensible.
- **Versión diferente de Tuwunel:** apunta `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` a la versión bajo prueba. El carril solo registra la imagen predeterminada fijada.

## Contrato de transporte en vivo

Matrix es uno de los tres carriles de transporte en vivo (Matrix, Telegram, Discord) que comparten una única lista de comprobación de contrato definida en [Resumen de QA: cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` sigue siendo el conjunto sintético amplio y no forma parte intencionalmente de esa matriz.

## Relacionado

- [Resumen de QA](/es/concepts/qa-e2e-automation): pila general de QA y contrato de transporte en vivo
- [Canal de QA](/es/channels/qa-channel): adaptador de canal sintético para escenarios respaldados por el repositorio
- [Pruebas](/es/help/testing): ejecutar pruebas y agregar cobertura de QA
- [Matrix](/es/channels/matrix): el Plugin de canal bajo prueba
