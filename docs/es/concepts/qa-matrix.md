---
read_when:
    - Ejecución local de pnpm openclaw qa matrix
    - Añadir o seleccionar escenarios de control de calidad de Matrix
    - Clasificación de fallos de QA, tiempos de espera agotados o limpieza bloqueada de Matrix
summary: 'Referencia para mantenedores del proceso de control de calidad en vivo de Matrix basado en Docker: CLI, perfiles, variables de entorno, escenarios y artefactos de salida.'
title: Control de calidad de Matrix
x-i18n:
    generated_at: "2026-07-12T14:26:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: a8034570f5a52619c88bee1f6708bd710744d3cb52a1eb82726aa118844045ef
    source_path: concepts/qa-matrix.md
    workflow: 16
---

El canal de QA de Matrix ejecuta el plugin incluido `@openclaw/matrix` contra un homeserver Tuwunel desechable en Docker, con cuentas temporales de controlador, SUT y observador, además de salas preconfiguradas. Proporciona la cobertura en vivo con transporte real para Matrix.

Herramientas exclusivas para mantenedores. Las versiones empaquetadas de OpenClaw omiten `qa-lab`, por lo que `openclaw qa` solo se ejecuta desde un checkout del código fuente, que carga directamente el ejecutor incluido sin ningún paso de instalación del plugin.

Para obtener un contexto más amplio sobre el marco de QA, consulte [Descripción general de QA](/es/concepts/qa-e2e-automation).

## Inicio rápido

```bash
pnpm openclaw qa matrix --profile fast --fail-fast
```

La ejecución simple de `pnpm openclaw qa matrix` usa `--profile all` y no se detiene tras el primer fallo. Distribuya el inventario completo entre trabajos paralelos con `--profile transport|media|e2ee-smoke|e2ee-deep|e2ee-cli`.

## Qué hace el canal

1. Aprovisiona un homeserver Tuwunel desechable en Docker (imagen predeterminada `ghcr.io/matrix-construct/tuwunel:v1.5.1`, nombre del servidor `matrix-qa.test`, puerto `28008`) detrás de un registrador acotado de solicitudes y respuestas que oculta datos confidenciales.
2. Registra tres usuarios temporales: `driver` (envía tráfico entrante), `sut` (la cuenta de Matrix de OpenClaw sometida a prueba) y `observer` (captura tráfico de terceros).
3. Preconfigura las salas requeridas por los escenarios seleccionados (principal, hilos, contenido multimedia, reinicio, secundaria, lista de permitidos, E2EE, mensaje directo de verificación, etc.).
4. Ejecuta la sonda del protocolo `matrix-qa-v1`, independiente del sustrato, contra el límite registrado de Tuwunel. Las pruebas unitarias demuestran el contrato de la sonda con el fixture del protocolo Matrix; el host canónico del adaptador de transporte de QA en [#99707](https://github.com/openclaw/openclaw/pull/99707) gestiona la conexión con destinos Crabline reales.
5. Inicia un Gateway secundario de OpenClaw con el plugin real de Matrix limitado a la cuenta SUT.
6. Ejecuta los escenarios secuencialmente, observa los eventos mediante los clientes Matrix del controlador y el observador, y deriva las expectativas de enrutamiento y estado a partir del tráfico registrado.
7. Desmonta el homeserver, escribe los artefactos de informe y evidencias, y finaliza.

## CLI

```text
pnpm openclaw qa matrix [options]
```

### Opciones comunes

| Opción                | Valor predeterminado                           | Descripción                                                                                                                                                            |
| --------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--profile <profile>` | `all`                                          | Perfil de escenarios. Consulte [Perfiles](#profiles).                                                                                                                   |
| `--fail-fast`         | desactivado                                    | Se detiene después de la primera comprobación o el primer escenario fallidos.                                                                                           |
| `--scenario <id>`     | -                                              | Ejecuta solo este escenario. Se puede repetir. Consulte [Escenarios](#scenarios).                                                                                        |
| `--output-dir <path>` | `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`  | Ubicación donde se escriben los informes, el resumen, el inventario de rutas y estados, los eventos observados y el registro de salida. Las rutas relativas se resuelven respecto a `--repo-root`. |
| `--repo-root <path>`  | `process.cwd()`                                | Raíz del repositorio al invocar desde un directorio de trabajo neutral.                                                                                                 |
| `--sut-account <id>`  | `sut`                                          | Id. de la cuenta de Matrix dentro de la configuración del Gateway de QA.                                                                                                |

### Opciones del proveedor

El canal usa un transporte Matrix real, pero el proveedor del modelo es configurable:

| Opción                     | Valor predeterminado       | Descripción                                                                                                                                                                               |
| -------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--provider-mode <mode>`   | `live-frontier`            | `mock-openai` para el envío simulado determinista o `live-frontier` para proveedores de vanguardia en vivo. El alias heredado `live-openai` sigue funcionando.                              |
| `--model <ref>`            | predeterminado del proveedor | Referencia principal `provider/model`.                                                                                                                                                    |
| `--alt-model <ref>`        | predeterminado del proveedor | Referencia alternativa `provider/model` cuando los escenarios cambian a mitad de la ejecución.                                                                                            |
| `--fast`                   | desactivado                | Activa el modo rápido del proveedor cuando sea compatible.                                                                                                                                |

QA de Matrix no acepta `--credential-source` ni `--credential-role`. El canal aprovisiona usuarios desechables localmente; no hay ningún grupo compartido de credenciales del que obtener una asignación.

## Perfiles

| Perfil          | Uso                                                                                                                                                                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all` (predeterminado) | Catálogo completo. Lento, pero exhaustivo.                                                                                                                                                                                            |
| `fast`          | Subconjunto de la puerta de lanzamiento que ejercita el contrato imperativo del transporte en vivo: control por menciones, bloqueo por lista de permitidos, formato de respuesta, reanudación tras reinicio, observación de reacciones, entrega de metadatos de aprobación de ejecución y respuesta E2EE básica. |
| `transport`     | Escenarios de hilos, mensajes directos, salas, unión automática, menciones/listas de permitidos, aprobaciones y reacciones en el nivel de transporte.                                                                                          |
| `media`         | Cobertura de archivos adjuntos de imagen, audio, vídeo, PDF y EPUB.                                                                                                                                                                           |
| `e2ee-smoke`    | Cobertura E2EE mínima: respuesta cifrada básica, seguimiento en hilo e inicialización correcta.                                                                                                                                               |
| `e2ee-deep`     | Escenarios exhaustivos de pérdida de estado, copias de seguridad, claves y recuperación de E2EE.                                                                                                                                              |
| `e2ee-cli`      | Escenarios de CLI de `openclaw matrix encryption setup` y `verify *` ejecutados mediante el entorno de QA.                                                                                                                                    |

La asignación exacta se encuentra en `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`.

## Escenarios

El adaptador compartido de Matrix expone estos escenarios YAML canónicos mediante `openclaw qa suite --channel-driver live --channel matrix`:

- `channel-chat-baseline`
- `thread-follow-up`
- `thread-isolation`
- `thread-reply-override`
- `dm-shared-session`
- `dm-per-room-session`

`subagent-thread-spawn` sigue disponible mediante la selección explícita `--scenario subagent-thread-spawn`,
pero no forma parte del conjunto compartido predeterminado de Matrix hasta que la prueba en vivo de finalización de procesos secundarios sea estable.

La lista restante de identificadores de escenarios imperativos es la unión `MatrixQaScenarioId` en `extensions/qa-matrix/src/runners/contract/scenario-catalog.ts`. Categorías:

- hilos: `matrix-thread-root-preservation`, `matrix-thread-nested-reply-shape`
- nivel superior / mensaje directo / sala: `matrix-top-level-reply-shape`, `matrix-room-*`, `matrix-dm-*`
- transmisión y progreso de herramientas: `matrix-room-partial-streaming-preview`, `matrix-room-quiet-streaming-preview`, `matrix-room-tool-progress-*`, `matrix-room-block-streaming`
- contenido multimedia: `matrix-media-type-coverage`, `matrix-room-image-understanding-attachment`, `matrix-attachment-only-ignored`, `matrix-unsupported-media-safe`
- enrutamiento: `matrix-room-autojoin-invite`, `matrix-secondary-room-*`
- reacciones: `matrix-reaction-*`
- aprobaciones: `matrix-approval-*` (metadatos de ejecución/plugin, alternativa fragmentada, reacciones de denegación, hilos y enrutamiento `target: "both"`)
- reinicio y reproducción: `matrix-restart-*`, `matrix-stale-sync-replay-dedupe`, `matrix-room-membership-loss`, `matrix-homeserver-restart-resume`, `matrix-initial-catchup-then-incremental`
- control por menciones, comunicación entre bots y listas de permitidos: `matrix-mention-*`, `matrix-allowbots-*`, `matrix-allowlist-*`, `matrix-multi-actor-ordering`, `matrix-inbound-edit-*`, `matrix-mxid-prefixed-command-block`, `matrix-observer-allowlist-override`
- E2EE: `matrix-e2ee-*` (respuesta básica, seguimiento en hilo, inicialización, ciclo de vida de la clave de recuperación, variantes de pérdida de estado, comportamiento de copias de seguridad del servidor, higiene de dispositivos, verificación SAS / QR / mensaje directo, reinicio y ocultación de datos confidenciales en artefactos)
- CLI de E2EE: `matrix-e2ee-cli-*` (configuración de cifrado, configuración idempotente, fallo de inicialización, ciclo de vida de la clave de recuperación, varias cuentas, recorrido de ida y vuelta de respuesta del Gateway y autoverificación)

Pase `--scenario <id>` (se puede repetir) para ejecutar un conjunto seleccionado manualmente; combínelo con `--profile all` para ignorar el filtrado por perfil.

## Variables de entorno

| Variable                                | Valor predeterminado                       | Efecto                                                                                                                                                                                                                  |
| --------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_QA_MATRIX_TIMEOUT_MS`         | `1800000` (30 min)                         | Límite máximo estricto para toda la ejecución.                                                                                                                                                                          |
| `OPENCLAW_QA_MATRIX_CANARY_TIMEOUT_MS`  | `45000`                                    | Límite para la respuesta canaria inicial. La CI de lanzamiento lo aumenta en ejecutores compartidos para que un primer turno lento del Gateway no falle antes de que comience la cobertura de escenarios.               |
| `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` | `8000`                                     | Ventana de inactividad para aserciones negativas de ausencia de respuesta. Se limita a `<=` el tiempo de espera de la ejecución.                                                                                         |
| `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` | `90000`                                    | Límite para el desmontaje de Docker. Las superficies de fallo incluyen el comando de recuperación `docker compose ... down --remove-orphans`.                                                                           |
| `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`      | `ghcr.io/matrix-construct/tuwunel:v1.5.1`  | Sustituye la imagen del servidor doméstico al validar con una versión diferente de Tuwunel.                                                                                                                              |
| `OPENCLAW_QA_MATRIX_PROGRESS`           | activado                                   | `0` silencia las líneas de progreso `[matrix-qa] ...` en stderr. `1` fuerza su visualización.                                                                                                                            |
| `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT`    | censurado                                  | `1` conserva el cuerpo del mensaje y `formatted_body` en `matrix-qa-observed-events.json`. De forma predeterminada se censuran para mantener seguros los artefactos de CI.                                               |
| `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT` | desactivado                                | `1` omite el `process.exit` determinista después de escribir los artefactos. El valor predeterminado fuerza la salida porque los manejadores criptográficos nativos de matrix-js-sdk pueden mantener activo el bucle de eventos después de que finalice la escritura de los artefactos. |
| `OPENCLAW_RUN_NODE_OUTPUT_LOG`          | sin definir                                | Cuando lo establece un iniciador externo (p. ej., `scripts/run-node.mjs`), el control de calidad de Matrix reutiliza esa ruta de registro en lugar de iniciar su propio tee.                                              |

## Artefactos de salida

Se escriben en `--output-dir` (valor predeterminado: `<repo>/.artifacts/qa-e2e/matrix-<timestamp>`, para que las ejecuciones sucesivas no se sobrescriban):

- `matrix-qa-report.md`: informe de protocolo en Markdown (qué se aprobó, falló o se omitió, y por qué).
- `matrix-qa-summary.json`: resumen estructurado adecuado para el análisis de CI y los paneles.
- `matrix-qa-route-state-manifest.json`: inventario dinámico `matrix-qa-v1` indexado por id. de escenario. Registra las formas censuradas de las rutas y los cuerpos, el orden de las solicitudes, los reintentos observados, los errores, la continuidad de los tokens de sincronización y las familias de estados de dispositivos, claves, contenido multimedia y copias de seguridad observadas durante esa ejecución. Se trata de evidencia ejecutable, no de una referencia base incorporada al repositorio.
- `matrix-qa-observed-events.json`: eventos de Matrix observados por los clientes controlador y observador. Los cuerpos se censuran a menos que se defina `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1`; los metadatos de aprobación se resumen con campos seguros seleccionados y una vista previa truncada del comando.
- `matrix-qa-output.log`: stdout/stderr combinados de la ejecución. Si se define `OPENCLAW_RUN_NODE_OUTPUT_LOG`, se reutiliza en su lugar el registro del iniciador externo.

## Consejos para el diagnóstico

- **La ejecución se bloquea cerca del final:** los manejadores criptográficos nativos de `matrix-js-sdk` pueden sobrevivir al entorno de pruebas. De forma predeterminada, se fuerza un `process.exit` limpio después de escribir los artefactos; si se define `OPENCLAW_QA_MATRIX_DISABLE_FORCE_EXIT=1`, es previsible que el proceso permanezca activo.
- **Error de limpieza:** busque el comando de recuperación mostrado (una invocación de `docker compose ... down --remove-orphans`) y ejecútelo manualmente para liberar el puerto del servidor doméstico.
- **Ventanas inestables de aserciones negativas en CI:** reduzca `OPENCLAW_QA_MATRIX_NO_REPLY_WINDOW_MS` (valor predeterminado: 8 s) cuando la CI sea rápida; auméntelo en ejecutores compartidos lentos.
- **Se necesitan cuerpos sin censurar para un informe de errores:** vuelva a ejecutar con `OPENCLAW_QA_MATRIX_CAPTURE_CONTENT=1` y adjunte `matrix-qa-observed-events.json`. Trate el artefacto resultante como información sensible.
- **Versión diferente de Tuwunel:** configure `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` para que apunte a la versión sometida a pruebas. La vía solo incorpora la imagen predeterminada fijada.

## Contrato de transporte en vivo

Matrix es una de las tres vías de transporte en vivo (Matrix, Telegram y Discord) que comparten una única lista de comprobación del contrato, definida en [Descripción general del control de calidad: cobertura de transporte en vivo](/es/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` sigue siendo el conjunto sintético amplio y, de forma intencionada, no forma parte de esa matriz.

## Relacionado

- [Descripción general del control de calidad](/es/concepts/qa-e2e-automation): pila general de control de calidad y contrato de transporte en vivo
- [Canal de control de calidad](/es/channels/qa-channel): adaptador de canal sintético para escenarios respaldados por el repositorio
- [Pruebas](/es/help/testing): ejecución de pruebas y adición de cobertura de control de calidad
- [Matrix](/es/channels/matrix): el plugin de canal sometido a pruebas
