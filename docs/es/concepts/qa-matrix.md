---
read_when:
    - Ejecución de pnpm openclaw qa matrix localmente
    - Agregar o seleccionar escenarios de QA de Matrix
    - Triaje de fallos de Matrix QA, tiempos de espera agotados o limpieza bloqueada
summary: 'Referencia para mantenedores para el carril de QA en vivo de Matrix respaldado por Docker: CLI, perfiles, variables de entorno, escenarios y artefactos de salida.'
title: Control de calidad de Matrix
x-i18n:
    generated_at: "2026-04-30T05:38:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ab862474e2abe45a1dcd66f025e3a3dd52a3417b0c1f42a26cd7944dd4053f5
    source_path: concepts/qa-matrix.md
    workflow: 16
---

El carril de QA de Matrix ejecuta el plugin `@openclaw/matrix` incluido contra un homeserver Tuwunel desechable en Docker, con cuentas temporales de controlador, SUT y observador, además de salas presembradas. Es la cobertura real de transporte en vivo para Matrix.

Esta herramienta es solo para mantenedores. Las versiones empaquetadas de OpenClaw omiten intencionalmente `qa-lab`, por lo que `openclaw qa` solo está disponible desde un checkout del código fuente. Los checkouts del código fuente cargan directamente el runner incluido; no se necesita ningún paso de instalación de plugin.

Para obtener contexto más amplio del framework de QA, consulta [descripción general de QA](/es/concepts/qa-e2e-automation).

## Inicio rápido

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

`pnpm openclaw qa matrix` sin más opciones ejecuta `--profile all` y no se detiene en el primer fallo. Usa `--profile fast --fail-fast` para una puerta de lanzamiento; divide el catálogo con `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli` cuando ejecutes el inventario completo en paralelo.

## Qué hace el carril

1. Aprovisiona un homeserver Tuwunel desechable en Docker (imagen predeterminada `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nombre de servidor `matrix-qa.test`, puerto `28008`).
2. Registra tres usuarios temporales: `driver` (envía tráfico entrante), `sut` (la cuenta de OpenClaw Matrix bajo prueba), `observer` (captura tráfico de terceros).
3. Prepara las salas requeridas por los escenarios seleccionados (principal, hilos, medios, reinicio, secundaria, allowlist, E2EE, DM de verificación, etc.).
4. Inicia un gateway hijo de OpenClaw con el plugin real de Matrix limitado a la cuenta SUT; `qa-channel` no se carga en el hijo.
5. Ejecuta los escenarios en secuencia, observando eventos mediante los clientes Matrix del controlador y del observador.
6. Derriba el homeserver, escribe artefactos de informe y resumen, y luego sale.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Flags comunes

| Flag                  | Predeterminado                               | Descripción                                                                                                                      |
| --------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                       | Perfil de escenarios. Consulta [Perfiles](#profiles).                                                                            |
| `--fail-fast`         | desactivado                                 | Detenerse después de la primera comprobación o escenario fallidos.                                                               |
| `--scenario <id>`     | —                                           | Ejecutar solo este escenario. Repetible. Consulta [Escenarios](#scenarios).                                                      |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` | Dónde se escriben los informes, el resumen, los eventos observados y el registro de salida. Las rutas relativas se resuelven contra `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                             | Raíz del repositorio al invocar desde un directorio de trabajo neutral.                                                          |
| `--sut-account <id>`  | `sut`                                       | Id. de cuenta de Matrix dentro de la configuración del gateway de QA.                                                            |

### Flags del proveedor

El carril usa un transporte real de Matrix, pero el proveedor del modelo es configurable:

| Flag                     | Predeterminado     | Descripción                                                                                                                                 |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>` | `live-frontier`    | `mock-openai` para despacho mock determinista o `live-frontier` para proveedores frontier en vivo. El alias heredado `live-openai` todavía funciona. |
| `--model <ref>`          | predeterminado del proveedor | Ref. principal `provider/model`.                                                                                                            |
| `--alt-model <ref>`      | predeterminado del proveedor | Ref. alternativa `provider/model` cuando los escenarios cambian a mitad de ejecución.                                                        |
| `--fast`                 | desactivado        | Habilitar el modo rápido del proveedor cuando sea compatible.                                                                               |

Matrix QA no acepta `--credential-source` ni `--credential-role`. El carril aprovisiona usuarios desechables localmente; no hay un pool compartido de credenciales contra el cual alquilar.

## Perfiles

El perfil seleccionado decide qué escenarios se ejecutan.

| Perfil          | Úsalo para                                                                                                                                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (predeterminado) | Catálogo completo. Lento, pero exhaustivo.                                                                                                                                                                                             |
| `fast`          | Subconjunto de puerta de lanzamiento que ejercita el contrato de transporte en vivo: canary, control por menciones, bloqueo de allowlist, forma de respuesta, reanudación tras reinicio, seguimiento de hilo, aislamiento de hilo, observación de reacciones y entrega de metadatos de aprobación de exec. |
| `transport`     | Escenarios de hilos, DM, sala, autojoin, mención/allowlist, aprobación y reacciones a nivel de transporte.                                                                                                                             |
| `media`         | Cobertura de adjuntos de imagen, audio, video, PDF y EPUB.                                                                                                                                                                              |
| `e2ee-smoke`    | Cobertura E2EE mínima: respuesta cifrada básica, seguimiento de hilo, bootstrap exitoso.                                                                                                                                                |
| `e2ee-deep`     | Escenarios exhaustivos de pérdida de estado, copia de seguridad, claves y recuperación de E2EE.                                                                                                                                        |
| `e2ee-cli`      | Escenarios de CLI `openclaw matrix encryption setup` y `verify *` ejecutados mediante el arnés de QA.                                                                                                                                   |

El mapeo exacto vive en `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Escenarios

La lista completa de ids de escenario es la unión `MatrixQaScenarioId` en `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts:15`. Las categorías incluyen:

- hilos — `matrix-thread-*`, `matrix-subagent-thread-spawn`
- nivel superior / DM / sala — `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- streaming y progreso de herramientas — `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- medios — `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- enrutamiento — `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reacciones — `matrix-reaction-*`
- aprobaciones — `matrix-approval-*` (metadatos de exec/plugin, fallback en fragmentos, reacciones de denegación, hilos y enrutamiento `target: "both"`)
- reinicio y reproducción — `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- control por menciones, bot a bot y allowlists — `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE — `matrix-e2ee-*` (respuesta básica, seguimiento de hilo, bootstrap, ciclo de vida de clave de recuperación, variantes de pérdida de estado, comportamiento de copia de seguridad del servidor, higiene de dispositivos, verificación SAS / QR / DM, reinicio, redacción de artefactos)
- CLI de E2EE — `matrix-e2ee-cli-*` (configuración de cifrado, configuración idempotente, fallo de bootstrap, ciclo de vida de clave de recuperación, múltiples cuentas, ida y vuelta de respuesta del gateway, autoverificación)

Pasa `--scenario <id>` (repetible) para ejecutar un conjunto seleccionado manualmente; combínalo con `--profile all` para ignorar el control por perfil.

## Variables de entorno

| Variable                                | Predeterminado                            | Efecto                                                                                                                                                                                                 |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                        | Límite superior estricto para toda la ejecución.                                                                                                                                                       |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                   | Límite para la respuesta canary inicial. La CI de lanzamiento aumenta esto en runners compartidos para que un primer turno lento del Gateway no falle antes de que comience la cobertura de escenarios. |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                    | Ventana de silencio para aserciones negativas de ausencia de respuesta. Restringida a `≤` el tiempo de espera de la ejecución.                                                                         |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                   | Límite para el desmontaje de Docker. Las superficies de fallo incluyen el comando de recuperación `docker compose ... down --remove-orphans`.                                                          |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1` | Sobrescribe la imagen del homeserver al validar contra una versión distinta de Tuwunel.                                                                                                                 |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | activado                                  | `0` silencia las líneas de progreso `[matrix-qa] ...` en stderr. `1` las fuerza a estar activadas.                                                                                                      |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | redactado                                 | `1` conserva el cuerpo del mensaje y `formatted_body` en `matrix-qa-observed-events.json`. El valor predeterminado redacta para mantener seguros los artefactos de CI.                                 |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | desactivado                               | `1` omite el `process.exit` determinista después de escribir el artefacto. El valor predeterminado fuerza la salida porque los manejadores criptográficos nativos de matrix-js-sdk pueden mantener activo el bucle de eventos tras completarse el artefacto. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | sin definir                               | Cuando lo define un lanzador externo (por ejemplo, `scripts/run-node.mjs`), Matrix QA reutiliza esa ruta de registro en lugar de iniciar su propio tee.                                                 |

## Artefactos de salida

Escritos en `--output-dir`:

- `matrix-qa-report.md` — Informe de protocolo en Markdown (qué pasó, falló, se omitió y por qué).
- `matrix-qa-summary.json` — Resumen estructurado adecuado para el análisis de CI y paneles de control.
- `matrix-qa-observed-events.json` — Eventos de Matrix observados desde los clientes controlador y observador. Los cuerpos se redactan a menos que `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; los metadatos de aprobación se resumen con campos seguros seleccionados y una vista previa truncada del comando.
- `matrix-qa-output.log` — stdout/stderr combinados de la ejecución. Si `OPENCLAW_RUN_NODE_OUTPUT_LOG` está definido, se reutiliza el registro del lanzador externo.

El directorio de salida predeterminado es `<repo>/.artifacts/qa-e2e/matrix-<timestamp>` para que las ejecuciones sucesivas no se sobrescriban entre sí.

## Consejos de triaje

- **La ejecución se queda colgada cerca del final:** los manejadores criptográficos nativos de `matrix-js-sdk` pueden sobrevivir al arnés. El valor predeterminado fuerza un `process.exit` limpio después de escribir el artefacto; si has desactivado `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, espera que el proceso permanezca activo.
- **Error de limpieza:** busca el comando de recuperación impreso (una invocación `docker compose ... down --remove-orphans`) y ejecútalo manualmente para liberar el puerto del homeserver.
- **Ventanas de aserción negativa inestables en CI:** reduce `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (predeterminado 8 s) cuando CI sea rápida; auméntalo en runners compartidos lentos.
- **Necesitas cuerpos redactados para un informe de error:** vuelve a ejecutar con `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` y adjunta `matrix-qa-observed-events.json`. Trata el artefacto resultante como sensible.
- **Versión distinta de Tuwunel:** apunta `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` a la versión bajo prueba. El carril comprueba solo la imagen predeterminada fijada.

## Contrato de transporte en vivo

Matrix es uno de los tres carriles de transporte en vivo (Matrix, Telegram, Discord) que comparten una única lista de verificación de contrato definida en [Resumen de QA → Cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` sigue siendo la suite sintética amplia e intencionalmente no forma parte de esa matriz.

## Relacionado

- [Resumen de QA](/es/concepts/qa-e2e-automation) — pila general de QA y contrato de transporte en vivo
- [Canal de QA](/es/channels/qa-channel) — adaptador de canal sintético para escenarios respaldados por el repositorio
- [Pruebas](/es/help/testing) — ejecución de pruebas y adición de cobertura de QA
- [Matrix](/es/channels/matrix) — el plugin de canal bajo prueba
