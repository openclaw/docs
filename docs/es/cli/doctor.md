---
read_when:
    - Tiene problemas de conectividad o autenticación y necesita soluciones guiadas
    - Has actualizado y quieres una comprobación rápida.
summary: Referencia de la CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Doctor
x-i18n:
    generated_at: "2026-07-19T01:53:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2b0aa9b51d7bccd4357d3ec747be514a0245b44a90e6e6c7ea789ab68420465
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Comprobaciones de estado y correcciones rápidas para el Gateway, los canales, los plugins, las Skills, el enrutamiento de modelos, el estado local y las migraciones de configuración. Úselo cuando algo no funcione según lo esperado y se necesite un solo comando que explique qué está mal.

Cuando el estado del Gateway informa de propietarios de SecretRef degradados, doctor muestra una advertencia de **Degradación del entorno de ejecución de secretos** con cada propietario inactivo o desactualizado, la ruta de configuración afectada, el motivo censurado y el comando de reintento `openclaw secrets reload`.

Cuando los eventos de entrada de un canal se envían a la cola de mensajes fallidos, doctor indica cada cuenta de canal afectada y remite a [`openclaw channels dead-letters list`](/es/cli/channels#inbound-dead-letters) para su inspección y recuperación.

Relacionado:

- Solución de problemas: [Solución de problemas](/es/gateway/troubleshooting)
- Auditoría de seguridad: [Seguridad](/es/gateway/security)

## Modos

Doctor tiene cinco modos:

| Modo                            | Comando                                   | Comportamiento                                                                                                      |
| ------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Inspección                      | `openclaw doctor`                        | Comprobaciones orientadas a personas e indicaciones guiadas.                                                        |
| Reparación                      | `openclaw doctor --fix`                        | Aplica las reparaciones compatibles mediante indicaciones, salvo cuando la reparación no interactiva sea segura.   |
| Lint                            | `openclaw doctor --lint`                        | Hallazgos estructurados de solo lectura para la CI, las comprobaciones preliminares y las puertas de revisión.      |
| Mantenimiento de SQLite compartido | `openclaw doctor --state-sqlite compact`                     | Ejecuta explícitamente un punto de control, compacta y verifica la base de datos canónica de estado compartido.     |
| Migración de SQLite de sesiones | `openclaw doctor --session-sqlite <mode>`                        | Inspecciona, importa, valida, compacta, recupera o restaura el estado de las sesiones.                              |

Es preferible usar `--lint` cuando la automatización necesite un resultado estable. Es preferible usar `--fix` cuando un operador humano quiera que doctor modifique la configuración o el estado.

## Ejemplos

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Para los permisos específicos de un canal, use las pruebas de canal en lugar de `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` informa de los permisos efectivos del bot para un destino de canal específico. `channels status --probe` audita todos los canales configurados y los destinos de conexión automática a voz.

## Opciones

| Opción                          | Efecto                                                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`              | Desactiva las sugerencias de memoria y búsqueda del espacio de trabajo.                                                                                                                 |
| `--yes`              | Acepta los valores predeterminados sin solicitar confirmación.                                                                                                                          |
| `--repair` / `--fix` | Aplica las reparaciones recomendadas no relacionadas con servicios sin solicitar confirmación (`--fix` es un alias). Las instalaciones o reescrituras del servicio del Gateway aún requieren confirmación interactiva o comandos `gateway` explícitos. |
| `--force`              | Aplica reparaciones agresivas, incluida la sobrescritura de la configuración personalizada del servicio.                                                                                |
| `--non-interactive`              | Se ejecuta sin indicaciones; solo migraciones seguras y reparaciones no relacionadas con servicios.                                                                                     |
| `--generate-gateway-token`              | Genera y configura un token del Gateway.                                                                                                                                                |
| `--allow-exec`              | Permite que doctor ejecute los SecretRef `exec` configurados al verificar los secretos.                                                                                     |
| `--deep`              | Examina los servicios del sistema para detectar instalaciones adicionales del Gateway e informa de las transferencias recientes de reinicio del supervisor del Gateway.                  |
| `--lint`              | Ejecuta comprobaciones de estado modernizadas en modo de solo lectura y emite hallazgos de diagnóstico.                                                                                 |
| `--post-upgrade`              | Ejecuta pruebas de compatibilidad de plugins posteriores a una actualización; los hallazgos se envían a la salida estándar; el código de salida es 1 si existe algún hallazgo de nivel de error. |
| `--state-sqlite <mode>`              | Ejecuta el mantenimiento explícito de SQLite para el estado compartido. El único modo es `compact`.                                                                             |
| `--session-sqlite <mode>`              | Ejecuta el modo específico de migración de SQLite de sesiones: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` o `restore`. |
| `--session-sqlite-store <path>`              | Con `--session-sqlite`: selecciona una ruta del almacén `sessions.json` heredado.                                                                                                    |
| `--session-sqlite-agent <id>`              | Con `--session-sqlite`: selecciona un agente configurado.                                                                                                                               |
| `--session-sqlite-all-agents`              | Con `--session-sqlite`: selecciona los almacenes de agentes configurados y detectados.                                                                                                  |
| `--github-issue`              | Con `--session-sqlite recover`: prepara un informe de incidencia depurado para openclaw/openclaw; doctor lo crea con `gh` después de `--yes` o de una confirmación interactiva. |
| `--json`              | Con `--lint`: hallazgos JSON. Con `--post-upgrade`: `{ probesRun, findings }`. Con `--state-sqlite` o `--session-sqlite`: el informe de mantenimiento en formato JSON.             |
| `--severity-min <level>`              | Con `--lint`: descarta los hallazgos inferiores a `info`, `warning` o `error`.                                                                |
| `--all`              | Con `--lint`: ejecuta todas las comprobaciones registradas, incluidas las comprobaciones opcionales excluidas del conjunto predeterminado.                                     |
| `--skip <id>`              | Con `--lint`: omite un identificador de comprobación. Se puede repetir.                                                                                                       |
| `--only <id>`              | Con `--lint`: ejecuta únicamente los identificadores de comprobación indicados. Se puede repetir.                                                                             |

`--severity-min`, `--all`, `--only` y `--skip` solo se aceptan junto con `--lint`; `--json` se acepta con `--lint`, `--post-upgrade`, `--state-sqlite` y `--session-sqlite`.

## Modo Lint

`openclaw doctor --lint` es de solo lectura: sin indicaciones, reparaciones ni reescrituras de la configuración o el estado.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

La salida legible es compacta:

```text
doctor --lint: se ejecutaron 6 comprobaciones y se encontró 1 hallazgo
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode no está definido; se bloqueará el inicio del Gateway.
    corrección: Ejecute `openclaw configure` y establezca el modo del Gateway (local/remoto), o ejecute `openclaw config set gateway.mode local`.
```

La salida JSON es la interfaz para scripts:

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode no está definido; se bloqueará el inicio del Gateway.",
      "path": "gateway.mode",
      "fixHint": "Ejecute `openclaw configure` y establezca el modo del Gateway (local/remoto), o ejecute `openclaw config set gateway.mode local`."
    }
  ]
}
```

Códigos de salida:

| Código | Significado                                                                 |
| ------ | --------------------------------------------------------------------------- |
| `0` | No hay hallazgos iguales o superiores al umbral de gravedad seleccionado.   |
| `1` | Al menos un hallazgo alcanza el umbral seleccionado.                        |
| `2` | Fallo del comando o del entorno de ejecución antes de poder generar hallazgos de lint. |

`--severity-min` controla tanto los hallazgos que se muestran como el umbral de salida: `openclaw doctor --lint --severity-min error` puede no mostrar nada y finalizar con `0` aunque existan hallazgos `info`/`warning` de menor gravedad.

`--all` controla qué comprobaciones se seleccionan antes de filtrar por gravedad. La ejecución predeterminada de lint excluye las comprobaciones exhaustivas, históricas o con mayor probabilidad de detectar residuos heredados reparables; use `--all` para obtener el inventario completo. `--only <id>` es el selector más preciso y puede ejecutar cualquier comprobación registrada mediante su identificador.

`core/doctor/local-audio-acceleration` informa del comando STT local seleccionado automáticamente, de las evidencias independientes de los backends compatibles, solicitados y observados, y del orden de reserva sin cargar un modelo de voz. Emite un hallazgo informativo, por lo que debe incluirse `--severity-min info` para mostrarlo.

## Comprobaciones de estado estructuradas

Las comprobaciones modernas de doctor usan un pequeño contrato dividido:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` sustenta `doctor --lint`. `repair()` es opcional y solo se ejecuta con `doctor --fix` / `doctor --repair`. Las comprobaciones que aún no se han migrado a esta estructura siguen usando el flujo heredado de contribuciones de doctor.

Los contextos de reparación pueden llevar solicitudes `dryRun`/`diff`; los resultados de reparación pueden devolver `diffs` estructurados (ediciones de configuración/archivos) y `effects` (efectos secundarios de servicios, procesos, paquetes, estado u otros), por lo que las comprobaciones convertidas pueden evolucionar hacia `doctor --fix --dry-run` sin trasladar la planificación de mutaciones a `detect()`.

`repair()` informa `status: "repaired" | "skipped" | "failed"` (si se omite el estado, significa `repaired`). Cuando la reparación devuelve `skipped` o `failed`, doctor informa del motivo y omite la validación de esa comprobación. Tras una reparación correcta, doctor vuelve a ejecutar `detect()` limitado a los hallazgos reparados; si el hallazgo sigue presente, doctor informa de una advertencia de reparación en lugar de considerar el cambio como completado.

Un hallazgo incluye:

| Campo             | Finalidad                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Id estable para filtros de omisión/selección y listas de permitidos de CI.     |
| `severity`        | `info`, `warning` o `error`.                         |
| `message`         | Descripción legible del problema.                      |
| `path`            | Ruta de configuración, archivo o lógica, cuando esté disponible.          |
| `line` / `column` | Ubicación de origen, cuando esté disponible.                        |
| `ocPath`          | Dirección `oc://` precisa cuando una comprobación pueda señalar una. |
| `fixHint`         | Acción sugerida para el operador o resumen de la reparación.           |

Las comprobaciones modernizadas del doctor del núcleo permanecen vinculadas a la contribución ordenada de doctor que controla su comportamiento `doctor` / `doctor --fix` para personas. El registro compartido de estado estructurado es el punto de extensión: las comprobaciones integradas y respaldadas por plugins se ejecutan después de las comprobaciones de doctor del núcleo una vez que su paquete propietario las registra en la ruta de comandos activa. `openclaw/plugin-sdk/health` expone el mismo contrato para los autores de plugins.

## Selección de comprobaciones

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` y `--skip` aceptan identificadores completos de comprobación y pueden repetirse. Si un identificador `--only` no está registrado, no se ejecuta ninguna comprobación para ese identificador; use `checksRun`/`checksSkipped` en la salida para confirmar que una puerta específica selecciona las comprobaciones esperadas.

## Modo posterior a la actualización

`openclaw doctor --post-upgrade` ejecuta pruebas de compatibilidad de plugins para encadenarlas después de una compilación o actualización. Los hallazgos se envían a stdout; el código de salida es 1 si algún hallazgo tiene `level: "error"`. Añada `--json` para obtener un contenedor legible por máquinas (`{ probesRun, findings }`), adecuado para CI, la skill comunitaria `fork-upgrade` y otras herramientas de prueba rápida posteriores a la actualización. Si falta el índice de plugins instalados o está mal formado, el modo JSON sigue emitiendo el contenedor con un hallazgo de error `plugin.index_unavailable`.

El inicio de una imagen de contenedor es la excepción al flujo habitual de «ejecutar doctor después de
actualizar». Cuando `openclaw gateway run` se inicia con una nueva versión de OpenClaw,
ejecuta reparaciones seguras del estado y los plugins antes de indicar que está listo. Si la reparación no puede
finalizar de forma segura, el inicio termina y le indica que ejecute la misma imagen una vez con
`openclaw doctor --fix` sobre el mismo estado y configuración montados antes de reiniciar
el contenedor normalmente.

## Migración del estado heredado

`openclaw doctor --fix` es el único propietario de las migraciones persistentes de archivos a SQLite. Valida y reclama cada origen reconocido, escribe y verifica las filas canónicas, registra un recibo de migración y, después, elimina el origen retirado. El código en tiempo de ejecución no realiza importaciones diferidas ni lecturas de respaldo.

Esto incluye los archivos OAuth de MCP retirados bajo `<state-dir>/mcp-oauth/*.json`. Detenga el Gateway antes de la reparación. Doctor importa las credenciales válidas en `<state-dir>/state/openclaw.sqlite`, conserva una sesión SQLite canónica existente cuando existen ambos almacenes, elimina el valor OAuth persistente obsoleto `state` y utiliza su recibo para impedir que un archivo obsoleto recreado reactive credenciales cuya sesión se cerró. Los archivos auxiliares `.lock` retirados fallan de forma cerrada: si Doctor informa de un propietario obsoleto, compruebe que no se esté ejecutando ningún proceso antiguo de OpenClaw, elimine ese archivo auxiliar y vuelva a ejecutar Doctor.

## Compaction de SQLite del estado compartido

Consulte [Esquemas de bases de datos](/es/reference/database-schemas) para obtener información sobre el versionado de esquemas, las comprobaciones de integridad y la recuperación tras una reversión de versión.

`openclaw doctor --state-sqlite compact` es un mantenimiento explícito sin conexión para
la base de datos canónica del estado compartido en
`<state-dir>/state/openclaw.sqlite`. No acepta una ruta arbitraria de base de datos,
nunca se invoca durante el funcionamiento normal del Gateway y no forma parte de
`openclaw doctor --fix`. El comando adquiere el mismo bloqueo de propiedad del estado que
el inicio del Gateway y lo mantiene durante la validación, la creación del punto de control, `VACUUM` y
las comprobaciones finales de integridad. Se niega a ejecutarse mientras un Gateway u otro
comando de mantenimiento de SQLite posea ese bloqueo. El bloqueo del estado permanece activo cuando
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` omite la instancia única del Gateway por configuración, de modo que un
shell del operador no necesita heredar el entorno del servicio Gateway para que
el mantenimiento lo detecte.

Detenga el Gateway y cree primero una copia de seguridad verificada:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

El comando:

1. Requiere un archivo normal en la ruta canónica del estado compartido. La ausencia de la
   base de datos se informa como `skipped` y finaliza correctamente.
2. Valida la versión actual admitida del esquema y
   `schema_meta.role = "global"` antes de crear un punto de control o modificar el archivo.
3. Requiere un `wal_checkpoint(TRUNCATE)` que no esté ocupado. Detenga cualquier proceso restante de OpenClaw
   y vuelva a intentarlo si el punto de control está ocupado.
4. Establece `auto_vacuum` en `INCREMENTAL`, ejecuta un `VACUUM` completo y vuelve a crear
   un punto de control.
5. Ejecuta `quick_check`, `integrity_check` y `foreign_key_check` y, después,
   vuelve a aplicar permisos exclusivos del propietario a la base de datos y a los archivos auxiliares de SQLite.

La salida JSON informa de los tamaños de la base de datos y el WAL, las páginas de la lista libre, el tamaño de página y el
valor `auto_vacuum` antes y después de la Compaction, además de los bytes recuperados y los
resultados de `quick_check` y `integrity_check`. `foreign_key_check` se aplica
con cierre ante fallos y no tiene un campo de éxito independiente. SQLite informa `auto_vacuum` como
`0` para ninguno, `1` para completo y `2` para incremental.

La Compaction falla sin realizar mutaciones cuando el esquema es antiguo, más reciente que la
compilación de OpenClaw en ejecución o pertenece a una base de datos de agente. Ejecute
primero `openclaw doctor --fix` para un esquema antiguo del estado compartido. Restaure una
copia de seguridad compatible o actualice OpenClaw para un esquema más reciente.

## Migración de SQLite de sesiones

OpenClaw importa automáticamente las filas de sesiones heredadas y el historial de transcripciones en la
base de datos SQLite de cada agente durante el inicio del Gateway y durante
`openclaw doctor --fix`. `openclaw doctor --session-sqlite <mode>` es la
herramienta específica de inspección y validación para esa migración. Las filas de sesiones actuales en
tiempo de ejecución residen en
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Los archivos
`sessions.json` heredados son orígenes de migración. Los archivos JSONL de transcripciones activas se
importan y archivan fuera del directorio de sesiones activas tras una
importación correcta; los archivos JSONL del nivel de archivo permanecen como artefactos de soporte, no como
alternativas en tiempo de ejecución.

Modos:

| Modo       | Comportamiento                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Lee los recuentos heredados y de SQLite, además de los archivos JSONL sin referencias, sin importar.                                       |
| `dry-run`  | Analiza las entradas heredadas y los archivos JSONL de transcripciones, cuenta las filas importables e informa de problemas sin escribir filas de SQLite. |
| `import`   | Importa entradas heredadas y eventos de transcripción en SQLite para los destinos seleccionados.                                      |
| `validate` | Compara los orígenes heredados seleccionados con las filas de SQLite y los recuentos de eventos de transcripción.                                   |
| `compact`  | Crea puntos de control y ejecuta VACUUM en las bases de datos SQLite de agentes seleccionadas para recuperar páginas libres tras eliminaciones grandes o limpiezas de archivos.    |
| `recover`  | Restaura la última ejecución de migración fallida, valida sus destinos y prepara un informe de incidencia de GitHub saneado.            |
| `restore`  | Restaura artefactos de transcripción archivados a partir de manifiestos de migración registrados sin eliminar datos de SQLite.                  |

Selectores:

- Valor predeterminado: el almacén configurado del agente predeterminado, cuando existe ese archivo de almacén heredado.
- `--session-sqlite-agent <id>`: un agente configurado.
- `--session-sqlite-all-agents`: almacenes de agentes configurados más almacenes de agentes detectados.
- `--session-sqlite-store <path>`: una ruta explícita de `sessions.json` heredada.

Secuencia de inspección manual:

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

Realice una copia de seguridad del directorio de estado de OpenClaw antes de ejecutar `import` en una instalación con
un historial importante. `validate` termina con un código distinto de cero cuando una entrada heredada seleccionada
falta en SQLite, un identificador de sesión difiere o un recuento de eventos de transcripción difiere.
Al utilizar `--session-sqlite-store <path>`, compruebe que el informe contenga el
recuento de destinos esperado; una ruta explícita inexistente de almacén no selecciona ningún destino.

Las eliminaciones de SQLite recuperan primero páginas dentro de la base de datos; no necesariamente
reducen el archivo de la base de datos de inmediato. Después de eliminar o archivar transcripciones
grandes, ejecute `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`
para crear puntos de control de los archivos WAL, ejecute `VACUUM` e informe de los tamaños de la base de datos y el WAL
antes y después. La Compaction requiere un archivo normal con el esquema actual del agente, los
metadatos duraderos del propietario del agente seleccionado y ningún identificador abierto en el proceso
de doctor. Los modos destructivos `import`, `compact`, `recover` y `restore`
mantienen el mismo bloqueo de propiedad del estado que el inicio del Gateway durante toda su operación;
`inspect`, `dry-run` y `validate` permanecen en modo de solo lectura y no lo adquieren. Detenga
primero el Gateway. Los modos destructivos fallan en lugar de competir con escrituras activas o
con otro comando de mantenimiento. Un destino destructivo `--session-sqlite-store`
debe estar dentro del directorio de estado activo; establezca `OPENCLAW_STATE_DIR` en
el directorio de estado propietario del almacén antes de realizar el mantenimiento de otra instalación.
Los destinos existentes con enlaces físicos se rechazan porque otra ruta puede compartir el
mismo inodo de la base de datos fuera del directorio de estado bloqueado. Las mismas comprobaciones de
propiedad abarcan los archivos auxiliares WAL, de memoria compartida y de diario de reversión de SQLite.

Cada importación escribe un manifiesto bajo
`~/.openclaw/session-sqlite-migration-runs/` antes de trasladar los artefactos de transcripción
al archivo. Si el inicio informa de una migración fallida de SQLite de sesiones después de
trasladar los artefactos, ejecute la recuperación:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

La recuperación selecciona el manifiesto de migración fallida más reciente, restaura únicamente los
artefactos archivados del manifiesto, valida los destinos afectados, actualiza los
informes saneados `.failure.md` y `.failure.json`, y prepara el cuerpo de una incidencia de GitHub
que evita incluir el contenido de las transcripciones, el entorno sin procesar, secretos y
configuración sin límites. Cuando no existe ningún manifiesto de migración fallida, pero una base de datos
SQLite del agente seleccionado está dañada, no es una base de datos o tiene archivos auxiliares de diario sin una
base de datos principal, la recuperación copia el conjunto completo de archivos en un directorio temporal
de inspección. SQLite puede revertir un diario activo válido en esa copia desechable
antes de que se ejecuten `quick_check`, `integrity_check` y `foreign_key_check`, mientras que los
archivos forenses originales permanecen intactos. Los errores en las comprobaciones de integridad o los
archivos auxiliares huérfanos conservan los archivos de la base de datos, WAL, SHM y del diario de reversión al cambiar el nombre de
todo el conjunto detectado con un único sufijo `.corrupt-<timestamp>`. Si se detecta un error al
cambiar el nombre, se revierten los archivos ya movidos antes de informar del fallo, para que un
conjunto de archivos recuperable no quede dividido de forma silenciosa. Detenga el Gateway antes de la recuperación;
copiar o cambiar el nombre de un conjunto de archivos SQLite que está cambiando activamente no es seguro y se comporta
de forma diferente según el sistema operativo. Con `--github-issue --yes`, doctor utiliza
la CLI de GitHub para crear la incidencia en `openclaw/openclaw`; sin confirmación,
escribe el informe de soporte local e imprime una URL de incidencia prerrellenada.

`restore` sigue siendo la operación de deshacer de bajo nivel. Utiliza los registros
`sourcePath -> archivePath` del manifiesto, devuelve los artefactos archivados únicamente cuando falta la
ruta original, informa de conflictos cuando existen ambas rutas y mantiene
la base de datos SQLite en su lugar.

### Volver a una versión anterior después de la migración de sesiones a SQLite

Antes de iniciar una versión anterior de OpenClaw basada en archivos, restaure los artefactos
archivados de las transcripciones heredadas:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Las versiones anteriores leen las entradas `sessions.json` y las rutas `sessionFile` registradas
en esas entradas. Después de la migración a SQLite, las importaciones correctas trasladan las transcripciones JSONL
activas a `session-sqlite-import-archive/`, por lo que el entorno de ejecución anterior no puede
ver ese historial hasta que la restauración devuelva los artefactos registrados en el manifiesto a
sus rutas originales.

La restauración no elimina los datos de SQLite. Las sesiones creadas después del cambio a SQLite
solo existen en SQLite y no aparecerán en el entorno de ejecución anterior. Si posteriormente
vuelve a actualizar, ejecute la secuencia normal de validación de la migración descrita anteriormente para que OpenClaw pueda
comparar los artefactos heredados restaurados con las filas de SQLite antes de importarlos.

## Notas

- En el modo Nix (`OPENCLAW_NIX_MODE=1`), las comprobaciones de solo lectura de doctor siguen funcionando, pero `doctor --fix`, `doctor --repair`, `doctor --yes` y `doctor --generate-gateway-token` están deshabilitados porque `openclaw.json` es inmutable. En su lugar, edite la fuente de Nix de esta instalación; para nix-openclaw, use el [inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado primero al agente.
- Los mensajes interactivos (correcciones del llavero/OAuth, etc.) solo se ejecutan cuando la entrada estándar es una TTY y `--non-interactive` **no** está definido. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omiten los mensajes.
- Las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de estado sin interfaz sigan siendo rápidas. Las sesiones interactivas siguen cargando las superficies de plugins necesarias para el flujo heredado de estado/reparación.
- `--lint` es más estricto que `--non-interactive`: siempre es de solo lectura, nunca muestra mensajes ni aplica migraciones seguras. Use `doctor --fix` o `doctor --repair` cuando quiera que doctor realice cambios.
- De forma predeterminada, doctor no ejecuta los SecretRefs `exec` al comprobar secretos. Use `--allow-exec` (con o sin `--lint`) solo cuando quiera intencionadamente que doctor ejecute esos solucionadores de secretos configurados.
- Cualquier escritura de configuración (incluida una reparación de `--fix`) rota una copia de seguridad a `~/.openclaw/openclaw.json.bak` (con un anillo numerado `.bak.1`..`.bak.4`). `--fix` también elimina las claves de configuración desconocidas notificadas por la validación del esquema y enumera cada eliminación; omite este paso mientras hay una actualización en curso para evitar que se elimine un estado de actualización escrito parcialmente antes de que finalice su migración.
- Si `openclaw.json` no se puede analizar y no se puede recuperar ninguna configuración válida conocida, `doctor --fix` conserva el original como `openclaw.json.clobbered.<timestamp>`, deja el archivo actual sin cambios y finaliza con un error en lugar de escribir un reemplazo parcial.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor controle el ciclo de vida del Gateway. Doctor sigue informando del estado del Gateway/servicio y aplicando reparaciones ajenas al servicio, pero omite la instalación, el inicio, el reinicio y la inicialización del servicio, así como la limpieza de servicios heredados.
- Doctor informa del límite de memoria dinámica aplicado al Gateway administrado y de la derivación adaptativa utilizada para el límite de memoria actual del host o contenedor. Use `openclaw gateway status` para obtener el mismo informe fuera de una ejecución de reparación.
- En Linux, doctor ignora las unidades systemd adicionales inactivas similares al Gateway y no reescribe los metadatos de comando/punto de entrada de un servicio Gateway de systemd en ejecución durante la reparación. Detenga primero el servicio o use `openclaw gateway install --force` para reemplazar el iniciador activo.
- `doctor --fix --non-interactive` informa de las definiciones del servicio Gateway ausentes u obsoletas, pero no las instala ni reescribe fuera del modo de reparación de actualizaciones. Ejecute `openclaw gateway install` para un servicio ausente o `openclaw gateway install --force` para reemplazar el iniciador.
- Las comprobaciones de integridad del estado detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor examina `~/.openclaw/cron/jobs.json` (o `cron.store`) para detectar formatos heredados de trabajos cron y los reescribe antes de importar filas canónicas en SQLite.
- Doctor informa de los trabajos cron con una sustitución explícita de `payload.model`, incluidos los recuentos por espacio de nombres del proveedor y las discrepancias con `agents.defaults.model`, de modo que los trabajos programados que no heredan el modelo predeterminado sean visibles durante las investigaciones de autenticación o facturación.
- Doctor informa de los trabajos cron que aún están marcados como en curso (`state.runningAtMs`), lo que puede hacer que `openclaw cron list` los muestre como `running`. Esta comprobación es de solo lectura: si ningún Gateway está ejecutando actualmente un trabajo marcado, el siguiente inicio del servicio cron registra la ejecución interrumpida y borra el marcador.
- En Linux, doctor advierte cuando el crontab del usuario todavía ejecuta el `~/.openclaw/bin/ensure-whatsapp.sh` heredado y sin mantenimiento, que puede informar erróneamente de `Gateway inactive` cuando cron carece del entorno del bus de usuario de systemd.
- Cuando WhatsApp está habilitado, doctor comprueba si existe un bucle de eventos del Gateway degradado con clientes `openclaw-tui` locales aún en ejecución. `doctor --fix` detiene únicamente los clientes TUI locales verificados para que las respuestas de WhatsApp no queden en cola detrás de bucles de actualización TUI obsoletos.
- Cuando hay variables de entorno de proxy HTTP(S) pero `tools.web.fetch.useTrustedEnvProxy` está deshabilitado, doctor explica que `web_fetch` sigue usando enrutamiento directo, ejecuta una breve prueba de conectividad TLS directa e indica la activación voluntaria explícita. Nunca habilita automáticamente la confianza en el proxy.
- Doctor reescribe las referencias de modelos heredadas `codex/*` y `openai-codex/*` como referencias canónicas `openai/*` en modelos principales, alternativas, listas de modelos permitidos, modelos de generación de imágenes/vídeos, sustituciones de heartbeat/subagente/compaction, hooks, sustituciones de modelos de canales, cargas útiles de cron y anclajes obsoletos de rutas de sesiones/transcripciones. `--fix` también combina de forma segura la configuración heredada `models.providers.codex` y `models.providers.openai-codex`, migra los perfiles de autenticación heredados `openai-codex:*` y las entradas `auth.order.openai-codex` a `openai:*`, traslada la intención de Codex a entradas `agentRuntime.id: "codex"` limitadas por proveedor/modelo, elimina los anclajes obsoletos de ejecución de agentes completos/sesiones y mantiene las referencias reparadas de agentes OpenAI en el enrutamiento de autenticación de Codex en lugar de usar la autenticación directa mediante clave de API de OpenAI.
- Doctor informa de las listas `auth.order.<provider>` no vacías cuyos perfiles referenciados han desaparecido por completo mientras existen credenciales almacenadas compatibles. `doctor --fix` elimina únicamente esas sustituciones obsoletas y restaura la selección automática de credenciales por agente; los órdenes vacíos explícitos, las listas parcialmente vigentes y los órdenes sin credenciales almacenadas compatibles permanecen sin cambios. Si un almacén de autenticación SQLite activo es ilegible o tiene un formato incorrecto, doctor explica por qué omitió esta reparación. Reinicie un Gateway en ejecución antes de volver a comprobar el estado de autenticación si su modo de recarga de configuración no aplica la escritura automáticamente.
- Doctor limpia el estado heredado de preparación de dependencias de plugins de versiones anteriores de OpenClaw y vuelve a enlazar el paquete `openclaw` del host para los plugins npm administrados que lo declaran como dependencia par. También repara los plugins descargables ausentes a los que hace referencia la configuración (`plugins.entries`, canales configurados, ajustes configurados del proveedor/búsqueda y entornos de ejecución de agentes configurados). Durante las actualizaciones de paquetes, doctor omite la reparación de plugins mediante el gestor de paquetes hasta que finaliza el intercambio de paquetes; después, vuelva a ejecutar `openclaw doctor --fix` si un plugin configurado aún necesita recuperación. Si una descarga falla, doctor informa del error de instalación y conserva la entrada del plugin configurado para el siguiente intento de reparación.
- Doctor repara la configuración obsoleta de plugins eliminando los identificadores de plugins ausentes de `plugins.allow`/`plugins.deny`/`plugins.entries`, además de la configuración de canales pendiente correspondiente, los destinos de heartbeat y las sustituciones de modelos de canales, cuando la detección de plugins funciona correctamente.
- Doctor pone en cuarentena la configuración no válida de plugins deshabilitando la entrada `plugins.entries.<id>` afectada y eliminando su carga útil `config` no válida. El inicio del Gateway ya omite únicamente ese plugin defectuoso, por lo que los demás plugins y canales siguen funcionando.
- Doctor elimina el `plugins.entries.codex.config.codexDynamicToolsProfile` retirado; el servidor de aplicaciones de Codex siempre mantiene como nativas las herramientas de espacio de trabajo nativas de Codex.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`. Las ejecuciones repetidas de `doctor --fix` ya no informan ni aplican la normalización de Talk cuando la única diferencia es el orden de las claves del objeto.
- Doctor incluye una comprobación de preparación de búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan las credenciales de incrustación.
- Doctor advierte cuando no hay ningún propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas. El emparejamiento mediante mensajes directos solo permite que alguien hable con el bot; si aprobó un remitente antes de que existiera la inicialización del primer propietario, defina `commands.ownerAllowFrom` explícitamente.
- Doctor muestra una nota informativa cuando hay agentes en modo Codex configurados y existen recursos personales de la CLI de Codex en el directorio de inicio de Codex del operador. Los inicios locales del servidor de aplicaciones de Codex usan directorios de inicio aislados por agente; instale primero el plugin de Codex si es necesario y después use `openclaw migrate plan codex` para inventariar los recursos que deban promoverse deliberadamente.
- Doctor advierte cuando las Skills permitidas para el agente predeterminado no están disponibles en el entorno de ejecución actual (faltan binarios, variables de entorno, configuración o requisitos del sistema operativo). `doctor --fix` puede deshabilitar esas Skills no disponibles con `skills.entries.<skill>.enabled=false`; si desea mantener activa la Skill, instale o configure el requisito ausente.
- Si el modo de sandbox está habilitado pero Docker no está disponible, doctor muestra una advertencia de alta relevancia con medidas correctivas (`install Docker` o `openclaw config set agents.defaults.sandbox.mode off`).
- Si existen archivos heredados del registro de sandbox o directorios de fragmentos (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`), doctor informa de ellos; `--fix` migra las entradas válidas a SQLite y pone en cuarentena los archivos heredados no válidos.
- Si `gateway.auth.token`/`gateway.auth.password` están administrados mediante SecretRef y no están disponibles en la ruta de comandos actual, doctor muestra una advertencia de solo lectura y no escribe credenciales alternativas en texto sin formato. En el caso de SecretRefs respaldados por ejecución, doctor omite la ejecución salvo que `--allow-exec` esté presente.
- Si la inspección de SecretRef de un canal falla en una ruta de corrección, doctor continúa y muestra una advertencia en lugar de finalizar anticipadamente.
- Después de las migraciones del directorio de estado, doctor advierte cuando las cuentas predeterminadas habilitadas de Telegram o Discord dependen de una alternativa del entorno y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no está disponible para el proceso de doctor.
- La resolución automática del nombre de usuario `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram que pueda resolverse en la ruta de comandos actual. Si la inspección del token no está disponible, doctor muestra una advertencia y omite la resolución automática durante esa ejecución.

## macOS: sustituciones del entorno `launchctl`

Si anteriormente ejecutó `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor sustituye el archivo de configuración y puede provocar errores persistentes de «no autorizado».

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Doctor del Gateway](/es/gateway/doctor)
