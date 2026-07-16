---
read_when:
    - Tienes problemas de conectividad o autenticación y quieres soluciones guiadas
    - Has actualizado y quieres una comprobación rápida.
summary: Referencia de la CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Doctor
x-i18n:
    generated_at: "2026-07-16T11:28:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Comprobaciones de estado y correcciones rápidas para el Gateway, los canales, los plugins, las Skills, el enrutamiento de modelos, el estado local y las migraciones de configuración. Úselo cuando algo no se comporte según lo esperado y se necesite un único comando que explique cuál es el problema.

Relacionado:

- Solución de problemas: [Solución de problemas](/es/gateway/troubleshooting)
- Auditoría de seguridad: [Seguridad](/es/gateway/security)

## Modos

Doctor tiene cinco modos:

| Modo                          | Comando                                   | Comportamiento                                                                                                   |
| ----------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Inspección                    | `openclaw doctor`                        | Comprobaciones orientadas a personas e indicaciones guiadas.                                                     |
| Reparación                    | `openclaw doctor --fix`                        | Aplica las reparaciones compatibles, con indicaciones salvo que la reparación no interactiva sea segura.        |
| Lint                          | `openclaw doctor --lint`                        | Hallazgos estructurados de solo lectura para CI, comprobaciones preliminares y puertas de revisión.              |
| Mantenimiento de SQLite compartido | `openclaw doctor --state-sqlite compact`                  | Crea explícitamente puntos de control, compacta y verifica la base de datos canónica de estado compartido.       |
| Migración de SQLite de sesiones | `openclaw doctor --session-sqlite <mode>`                     | Inspecciona, importa, valida, compacta, recupera o restaura el estado de las sesiones.                            |

Se recomienda `--lint` cuando la automatización necesite un resultado estable. Se recomienda `--fix` cuando un operador humano quiera que Doctor edite la configuración o el estado.

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

Para los permisos específicos de cada canal, use las sondas del canal en lugar de `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` informa de los permisos efectivos del bot para un destino de canal específico. `channels status --probe` audita todos los canales configurados y los destinos de incorporación automática a voz.

## Opciones

| Opción                          | Efecto                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`              | Desactiva las sugerencias de memoria y búsqueda del espacio de trabajo.                                                                                                                                 |
| `--yes`              | Acepta los valores predeterminados sin solicitar confirmación.                                                                                                                                          |
| `--repair` / `--fix` | Aplica las reparaciones recomendadas que no sean de servicios sin solicitar confirmación (`--fix` es un alias). Las instalaciones y reescrituras del servicio Gateway siguen requiriendo confirmación interactiva o comandos `gateway` explícitos. |
| `--force`              | Aplica reparaciones agresivas, incluida la sobrescritura de la configuración personalizada del servicio.                                                                                                |
| `--non-interactive`              | Se ejecuta sin indicaciones; solo migraciones seguras y reparaciones que no sean de servicios.                                                                                                          |
| `--generate-gateway-token`              | Genera y configura un token del Gateway.                                                                                                                                                                |
| `--allow-exec`              | Permite que Doctor ejecute los SecretRefs `exec` configurados durante la verificación de secretos.                                                                                          |
| `--deep`              | Examina los servicios del sistema para detectar instalaciones adicionales del Gateway; informa de transferencias recientes de reinicio del supervisor del Gateway.                                     |
| `--lint`              | Ejecuta comprobaciones de estado modernizadas en modo de solo lectura y emite hallazgos de diagnóstico.                                                                                                 |
| `--post-upgrade`              | Ejecuta sondas de compatibilidad de plugins posteriores a la actualización; los hallazgos se envían a la salida estándar; código de salida 1 si existe algún hallazgo de nivel de error.                  |
| `--state-sqlite <mode>`              | Ejecuta el mantenimiento explícito de SQLite del estado compartido. El único modo es `compact`.                                                                                                |
| `--session-sqlite <mode>`              | Ejecuta el modo específico de migración de SQLite de sesiones: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` o `restore`. |
| `--session-sqlite-store <path>`              | Con `--session-sqlite`: selecciona una ruta de almacén `sessions.json` heredado.                                                                                                                     |
| `--session-sqlite-agent <id>`              | Con `--session-sqlite`: selecciona un agente configurado.                                                                                                                                               |
| `--session-sqlite-all-agents`              | Con `--session-sqlite`: selecciona almacenes de agentes configurados y detectados.                                                                                                                      |
| `--github-issue`              | Con `--session-sqlite recover`: prepara un informe de incidencia saneado para openclaw/openclaw; Doctor lo crea con `gh` después de `--yes` o de una confirmación interactiva.          |
| `--json`              | Con `--lint`: hallazgos JSON. Con `--post-upgrade`: `{ probesRun, findings }`. Con `--state-sqlite` o `--session-sqlite`: el informe de mantenimiento como JSON.                                  |
| `--severity-min <level>`              | Con `--lint`: descarta los hallazgos inferiores a `info`, `warning` o `error`.                                                                                 |
| `--all`              | Con `--lint`: ejecuta todas las comprobaciones registradas, incluidas las de participación voluntaria excluidas del conjunto predeterminado.                                                  |
| `--skip <id>`              | Con `--lint`: omite un identificador de comprobación. Se puede repetir.                                                                                                                       |
| `--only <id>`              | Con `--lint`: ejecuta únicamente los identificadores de comprobación indicados. Se puede repetir.                                                                                            |

`--severity-min`, `--all`, `--only` y `--skip` solo se aceptan junto con `--lint`; `--json` se acepta con `--lint`, `--post-upgrade`, `--state-sqlite` y `--session-sqlite`.

## Modo Lint

`openclaw doctor --lint` es de solo lectura: sin indicaciones, reparaciones ni reescrituras de configuración o estado.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

La salida para personas es compacta:

```text
doctor --lint: se ejecutaron 6 comprobaciones, 1 hallazgo
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
| `2` | Fallo del comando o del entorno de ejecución antes de poder generar hallazgos de Lint. |

`--severity-min` controla tanto los hallazgos que se muestran como el umbral de salida: `openclaw doctor --lint --severity-min error` puede no mostrar nada y terminar con `0` incluso cuando existan hallazgos `info`/`warning` de menor gravedad.

`--all` controla las comprobaciones que se seleccionan antes del filtrado por gravedad. La ejecución predeterminada de Lint excluye las comprobaciones profundas, históricas o con mayor probabilidad de revelar residuos heredados reparables; use `--all` para obtener el inventario completo. `--only <id>` es el selector más preciso y puede ejecutar cualquier comprobación registrada por identificador.

`core/doctor/local-audio-acceleration` informa del comando STT local seleccionado automáticamente, las pruebas independientes del backend disponible/solicitado/observado y el orden de reserva sin cargar un modelo de voz. Emite un hallazgo informativo, por lo que debe incluirse `--severity-min info` para mostrarlo.

## Comprobaciones de estado estructuradas

Las comprobaciones modernas de Doctor usan un pequeño contrato dividido:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` sustenta `doctor --lint`. `repair()` es opcional y solo se ejecuta con `doctor --fix` / `doctor --repair`. Las comprobaciones que todavía no se hayan migrado a esta estructura siguen utilizando el flujo heredado de contribuciones de Doctor.

Los contextos de reparación pueden transportar solicitudes `dryRun`/`diff`; los resultados de reparación pueden devolver `diffs` estructuradas (ediciones de configuración/archivos) y `effects` estructurados (servicio, proceso, paquete, estado u otros efectos secundarios), por lo que las comprobaciones convertidas pueden evolucionar hacia `doctor --fix --dry-run` sin trasladar la planificación de mutaciones a `detect()`.

`repair()` informa `status: "repaired" | "skipped" | "failed"` (si se omite el estado, significa `repaired`). Cuando la reparación devuelve `skipped` o `failed`, doctor informa el motivo y omite la validación de esa comprobación. Tras una reparación correcta, doctor vuelve a ejecutar `detect()` con el ámbito limitado a los hallazgos reparados; si el hallazgo sigue presente, doctor informa una advertencia de reparación en lugar de considerar que el cambio está completo.

Un hallazgo incluye:

| Campo             | Finalidad                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Id estable para filtros de omisión/selección exclusiva y listas de permitidos de CI.     |
| `severity`        | `info`, `warning` o `error`.                         |
| `message`         | Descripción legible del problema.                      |
| `path`            | Ruta de configuración, de archivo o lógica, cuando esté disponible.          |
| `line` / `column` | Ubicación de origen, cuando esté disponible.                        |
| `ocPath`          | Dirección `oc://` precisa cuando una comprobación puede señalar una. |
| `fixHint`         | Acción sugerida para el operador o resumen de la reparación.           |

Las comprobaciones modernizadas del doctor del núcleo permanecen asociadas a la contribución ordenada de doctor propietaria de su comportamiento humano de `doctor` / `doctor --fix`. El registro compartido de estado estructurado es el punto de extensión: las comprobaciones integradas y respaldadas por plugins se ejecutan después de las comprobaciones del doctor del núcleo una vez que su paquete propietario las registra en la ruta de comandos activa. `openclaw/plugin-sdk/health` expone el mismo contrato para los autores de plugins.

## Selección de comprobaciones

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` y `--skip` aceptan identificadores completos de comprobación y pueden repetirse. Si un identificador `--only` no está registrado, no se ejecuta ninguna comprobación para ese identificador; use `checksRun`/`checksSkipped` en la salida para confirmar que una puerta específica selecciona las comprobaciones esperadas.

## Modo posterior a la actualización

`openclaw doctor --post-upgrade` ejecuta sondeos de compatibilidad de plugins para encadenarlos después de una compilación o actualización. Los hallazgos se envían a stdout; el código de salida es 1 si algún hallazgo tiene `level: "error"`. Añada `--json` para obtener un contenedor legible por máquina (`{ probesRun, findings }`), adecuado para CI, la skill comunitaria `fork-upgrade` y otras herramientas de pruebas de humo posteriores a una actualización. Si falta el índice de plugins instalados o está mal formado, el modo JSON sigue emitiendo el contenedor con un hallazgo de error `plugin.index_unavailable`.

El inicio de la imagen de contenedor es la excepción al flujo habitual de «ejecutar doctor después de
actualizar». Cuando `openclaw gateway run` se inicia con una versión nueva de OpenClaw,
ejecuta reparaciones seguras del estado y los plugins antes de indicar que está listo. Si la reparación no puede
finalizar de forma segura, el inicio termina e indica que se ejecute una vez la misma imagen con
`openclaw doctor --fix` sobre el mismo estado/configuración montado antes de reiniciar
el contenedor con normalidad.

## Compaction de SQLite del estado compartido

`openclaw doctor --state-sqlite compact` es mantenimiento explícito sin conexión para
la base de datos canónica de estado compartido en
`<state-dir>/state/openclaw.sqlite`. No acepta una ruta arbitraria de base de datos,
nunca lo invoca el funcionamiento normal del Gateway y no forma parte de
`openclaw doctor --fix`. El comando adquiere el mismo bloqueo de propiedad del estado que
el inicio del Gateway y lo mantiene durante la validación, la creación de puntos de control, `VACUUM` y
las comprobaciones finales de integridad. Se niega a ejecutarse mientras un Gateway u otro
comando de mantenimiento de SQLite sea propietario de ese bloqueo. El bloqueo del estado permanece activo cuando
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` omite la instancia única de Gateway por configuración, por lo que un
shell del operador no necesita heredar el entorno del servicio Gateway para
que el mantenimiento lo detecte.

Detenga el Gateway y cree primero una copia de seguridad verificada:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

El comando:

1. Requiere un archivo normal en la ruta canónica del estado compartido. La ausencia de
   la base de datos se informa como `skipped` y finaliza correctamente.
2. Valida la versión actual admitida del esquema y
   `schema_meta.role = "global"` antes de crear un punto de control o modificar el archivo.
3. Requiere un `wal_checkpoint(TRUNCATE)` no ocupado. Detenga cualquier proceso de OpenClaw
   restante y vuelva a intentarlo si el punto de control está ocupado.
4. Establece `auto_vacuum` en `INCREMENTAL`, ejecuta un `VACUUM` completo y vuelve a crear
   un punto de control.
5. Ejecuta `quick_check`, `integrity_check` y `foreign_key_check`, y luego
   vuelve a aplicar permisos exclusivos del propietario a la base de datos y a los archivos auxiliares de SQLite.

La salida JSON informa los tamaños de la base de datos y del WAL, las páginas de la lista libre, el tamaño de página y
el valor de `auto_vacuum` antes y después de la Compaction, además de los bytes recuperados y los
resultados de `quick_check` y `integrity_check`. `foreign_key_check` se aplica
con cierre seguro y no tiene un campo de éxito independiente. SQLite informa `auto_vacuum` como
`0` para ninguno, `1` para completo y `2` para incremental.

La Compaction falla sin realizar modificaciones cuando el esquema es antiguo, más reciente que la
compilación de OpenClaw en ejecución o pertenece a una base de datos de agente. Ejecute
primero `openclaw doctor --fix` para un esquema antiguo de estado compartido. Restaure una
copia de seguridad compatible o actualice OpenClaw para un esquema más reciente.

## Migración de SQLite de sesiones

OpenClaw importa automáticamente las filas de sesiones heredadas y el historial de transcripciones en la
base de datos SQLite de cada agente durante el inicio del Gateway y durante
`openclaw doctor --fix`. `openclaw doctor --session-sqlite <mode>` es la
herramienta específica de inspección y validación para esa migración. Las filas actuales de
sesiones en tiempo de ejecución residen en
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Los archivos
`sessions.json` heredados son fuentes de migración. Los archivos JSONL de transcripciones activas se
importan y archivan fuera del directorio de sesiones activas después de una
importación correcta; los archivos JSONL del nivel de archivo permanecen como artefactos de soporte, no como
alternativas de reserva en tiempo de ejecución.

Modos:

| Modo       | Comportamiento                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Lee los recuentos heredados y de SQLite, además de los archivos JSONL sin referencias, sin importar.                                       |
| `dry-run`  | Analiza las entradas heredadas y los archivos JSONL de transcripciones, cuenta las filas importables e informa de problemas sin escribir filas de SQLite. |
| `import`   | Importa las entradas heredadas y los eventos de transcripción en SQLite para los destinos seleccionados.                                      |
| `validate` | Compara las fuentes heredadas seleccionadas con las filas de SQLite y los recuentos de eventos de transcripción.                                   |
| `compact`  | Crea puntos de control y ejecuta VACUUM en las bases de datos SQLite de los agentes seleccionados para recuperar páginas libres tras eliminaciones grandes o la limpieza de archivos.    |
| `recover`  | Restaura la última ejecución de migración fallida, valida sus destinos y prepara un informe saneado para una incidencia de GitHub.            |
| `restore`  | Restaura los artefactos de transcripción archivados a partir de los manifiestos de migración registrados sin eliminar datos de SQLite.                  |

Selectores:

- Valor predeterminado: el almacén configurado del agente predeterminado, cuando exista ese archivo de almacén heredado.
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
un historial importante. `validate` finaliza con un código distinto de cero cuando una entrada heredada seleccionada
no está presente en SQLite, un identificador de sesión difiere o un recuento de eventos de transcripción difiere.
Al usar `--session-sqlite-store <path>`, compruebe que el informe contenga el
recuento de destinos esperado; una ruta explícita de almacén que no existe no selecciona ningún destino.

Las eliminaciones de SQLite recuperan primero páginas dentro de la base de datos; no necesariamente
reducen de inmediato el archivo de la base de datos. Después de eliminar o archivar transcripciones
grandes, ejecute `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`
para crear puntos de control de los archivos WAL, ejecutar `VACUUM` e informar los tamaños de la base de datos y del WAL
antes y después. La Compaction requiere un archivo normal con el esquema actual del agente, los
metadatos persistentes del propietario del agente seleccionado y ningún descriptor abierto en el proceso
de doctor. Los modos destructivos `import`, `compact`, `recover` y `restore`
mantienen el mismo bloqueo de propiedad del estado que el inicio del Gateway durante toda su operación;
`inspect`, `dry-run` y `validate` permanecen en modo de solo lectura y no lo adquieren. Detenga
primero el Gateway. Los modos destructivos fallan en lugar de competir con escrituras activas o
con otro comando de mantenimiento. Un destino destructivo `--session-sqlite-store`
debe estar dentro del directorio de estado activo; establezca `OPENCLAW_STATE_DIR` en
el directorio de estado propietario del almacén antes de mantener otra instalación.
Los destinos existentes con enlaces físicos se rechazan porque otra ruta puede compartir el
mismo inodo de base de datos fuera del directorio de estado bloqueado. Las mismas comprobaciones de
propiedad abarcan los archivos auxiliares WAL, de memoria compartida y de diario de reversión de SQLite.

Cada importación escribe un manifiesto en
`~/.openclaw/session-sqlite-migration-runs/` antes de mover los artefactos de transcripción
al archivo. Si el inicio informa de una migración fallida de SQLite de sesiones después de
haber movido los artefactos, ejecute la recuperación:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

La recuperación selecciona el manifiesto de migración fallida más reciente, restaura únicamente los
artefactos archivados del manifiesto, valida los destinos afectados, actualiza los
informes saneados `.failure.md` y `.failure.json` y prepara el cuerpo de una incidencia de GitHub
que evita el contenido de las transcripciones, el entorno sin procesar, los secretos y la
configuración sin límites. Cuando no existe ningún manifiesto de migración fallida pero una base de datos SQLite
del agente seleccionado está dañada, no es una base de datos o tiene archivos auxiliares de diario sin una base de datos
principal, la recuperación copia el conjunto completo de archivos a un directorio temporal de
inspección. SQLite puede revertir un diario activo válido en esa copia desechable
antes de ejecutar `quick_check`, `integrity_check` y `foreign_key_check`, mientras los
archivos forenses originales permanecen intactos. Las comprobaciones de integridad fallidas o los
archivos auxiliares huérfanos conservan los archivos DB, WAL, SHM y de diario de reversión cambiando el nombre del
conjunto detectado completo con un sufijo `.corrupt-<timestamp>`. Un fallo de cambio de nombre
capturado revierte los archivos ya movidos antes de informar del fallo, de modo que un
conjunto de archivos recuperable no se divide silenciosamente. Detenga el Gateway antes de la recuperación;
copiar o cambiar el nombre de un conjunto de archivos SQLite que cambia activamente no es seguro y se comporta
de forma distinta según el sistema operativo. Con `--github-issue --yes`, doctor usa
la CLI de GitHub para crear la incidencia en `openclaw/openclaw`; sin confirmación,
escribe el informe de soporte local e imprime una URL de incidencia previamente rellenada.

`restore` sigue siendo la operación de deshacer de bajo nivel. Utiliza los registros
`sourcePath -> archivePath` del manifiesto, devuelve los artefactos archivados únicamente cuando
falta la ruta original, informa de conflictos cuando existen ambas rutas y deja
la base de datos SQLite intacta.

### Reversión a una versión anterior tras la migración de SQLite de sesiones

Antes de iniciar una versión anterior de OpenClaw basada en archivos, restaure los
artefactos heredados de transcripciones archivados:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Las versiones anteriores leen las entradas `sessions.json` y las rutas `sessionFile` registradas
en esas entradas. Después de la migración a SQLite, las importaciones correctas trasladan las transcripciones JSONL
activas a `session-sqlite-import-archive/`, por lo que el entorno de ejecución anterior no puede
ver ese historial hasta que la restauración devuelva esos artefactos registrados en el manifiesto a
sus rutas originales.

La restauración no elimina los datos de SQLite. Las sesiones creadas después del cambio a SQLite
solo existen en SQLite y no aparecerán en el entorno de ejecución anterior. Si posteriormente
vuelve a actualizar, ejecute la secuencia normal de validación de la migración indicada anteriormente para que OpenClaw pueda
comparar los artefactos heredados restaurados con las filas de SQLite antes de importarlos.

## Notas

- En modo Nix (`OPENCLAW_NIX_MODE=1`), las comprobaciones de doctor de solo lectura siguen funcionando, pero `doctor --fix`, `doctor --repair`, `doctor --yes` y `doctor --generate-gateway-token` están deshabilitados porque `openclaw.json` es inmutable. En su lugar, edite la fuente de Nix de esta instalación; para nix-openclaw, utilice la [Guía de inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientada primero al agente.
- Las solicitudes interactivas (correcciones del llavero/OAuth, etc.) solo se ejecutan cuando stdin es una TTY y `--non-interactive` **no** está definido. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omiten las solicitudes.
- Las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de estado sin interfaz sigan siendo rápidas. Las sesiones interactivas siguen cargando las superficies de plugins que necesita el flujo heredado de estado y reparación.
- `--lint` es más estricto que `--non-interactive`: siempre es de solo lectura, nunca solicita datos y nunca aplica migraciones seguras. Utilice `doctor --fix` o `doctor --repair` cuando quiera que doctor realice cambios.
- De forma predeterminada, doctor no ejecuta los SecretRefs de `exec` al comprobar secretos. Utilice `--allow-exec` (con o sin `--lint`) únicamente cuando quiera deliberadamente que doctor ejecute esos solucionadores de secretos configurados.
- Cualquier escritura de configuración (incluida una reparación de `--fix`) rota una copia de seguridad a `~/.openclaw/openclaw.json.bak` (con un anillo numerado de `.bak.1` a `.bak.4`). `--fix` también elimina las claves de configuración desconocidas notificadas por la validación del esquema y enumera cada eliminación; omite esta acción mientras hay una actualización en curso para que el estado de actualización parcialmente escrito no se elimine antes de que finalice su migración.
- Defina `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor controle el ciclo de vida del Gateway. Doctor continúa informando sobre el estado del Gateway y del servicio y aplica reparaciones ajenas al servicio, pero omite la instalación, el inicio, el reinicio y la inicialización del servicio, así como la limpieza del servicio heredado.
- En Linux, doctor ignora las unidades systemd adicionales inactivas similares al Gateway y no reescribe los metadatos del comando o del punto de entrada de un servicio Gateway de systemd en ejecución durante la reparación. Detenga primero el servicio o utilice `openclaw gateway install --force` para sustituir el iniciador activo.
- `doctor --fix --non-interactive` informa sobre definiciones ausentes u obsoletas del servicio Gateway, pero no las instala ni las reescribe fuera del modo de reparación de actualizaciones. Ejecute `openclaw gateway install` para un servicio ausente o `openclaw gateway install --force` para sustituir el iniciador.
- Las comprobaciones de integridad del estado detectan archivos de transcripciones huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor examina `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formatos heredados de tareas cron y los reescribe antes de importar las filas canónicas a SQLite.
- Doctor informa sobre las tareas cron que tienen una anulación explícita de `payload.model`, incluidos los recuentos por espacio de nombres del proveedor y las discrepancias con `agents.defaults.model`, de modo que las tareas programadas que no heredan el modelo predeterminado sean visibles durante las investigaciones de autenticación o facturación.
- Doctor informa sobre las tareas cron que siguen marcadas como en curso (`state.runningAtMs`), lo que puede hacer que `openclaw cron list` las muestre como `running`. Esta comprobación es de solo lectura: si ningún Gateway está ejecutando actualmente una tarea marcada, el siguiente inicio del servicio cron registra la ejecución interrumpida y borra el marcador.
- En Linux, doctor advierte cuando el crontab del usuario aún ejecuta el `~/.openclaw/bin/ensure-whatsapp.sh` heredado y sin mantenimiento, que puede informar erróneamente de `Gateway inactive` cuando cron carece del entorno del bus de usuario de systemd.
- Cuando WhatsApp está habilitado, doctor comprueba si el bucle de eventos del Gateway está degradado y aún hay clientes `openclaw-tui` locales en ejecución. `doctor --fix` detiene únicamente los clientes TUI locales verificados para que las respuestas de WhatsApp no queden en cola detrás de bucles obsoletos de actualización de la TUI.
- Doctor reescribe las referencias de modelos heredadas `codex/*` y `openai-codex/*` como referencias canónicas `openai/*` en modelos principales, alternativas, listas de modelos permitidos, modelos de generación de imágenes y vídeos, anulaciones de heartbeat/subagente/compaction, hooks, anulaciones de modelos de canales, cargas útiles de cron y anclajes obsoletos de rutas de sesiones/transcripciones. `--fix` también combina de forma segura la configuración heredada `models.providers.codex` y `models.providers.openai-codex`, migra los perfiles de autenticación heredados `openai-codex:*` y las entradas `auth.order.openai-codex` a `openai:*`, traslada la intención de Codex a entradas `agentRuntime.id: "codex"` con ámbito de proveedor/modelo, elimina los anclajes obsoletos del entorno de ejecución de agentes completos/sesiones y mantiene las referencias reparadas de agentes de OpenAI en el enrutamiento de autenticación de Codex en lugar de usar la autenticación directa mediante clave de API de OpenAI.
- Doctor informa sobre listas `auth.order.<provider>` no vacías cuyos perfiles referenciados han desaparecido por completo mientras existen credenciales almacenadas compatibles. `doctor --fix` elimina únicamente esas anulaciones obsoletas y restaura la selección automática de credenciales por agente; los órdenes explícitamente vacíos, las listas parcialmente vigentes y los órdenes sin credenciales almacenadas compatibles permanecen sin cambios. Si un almacén de autenticación SQLite activo no se puede leer o tiene un formato incorrecto, doctor explica por qué omitió esta reparación. Reinicie un Gateway en ejecución antes de volver a comprobar el estado de autenticación si su modo de recarga de configuración no aplica automáticamente la escritura.
- Doctor limpia el estado heredado de preparación de dependencias de plugins de versiones anteriores de OpenClaw y vuelve a vincular el paquete `openclaw` del host para los plugins npm administrados que lo declaran como dependencia de pares. También repara los plugins descargables ausentes a los que hace referencia la configuración (`plugins.entries`, canales configurados, ajustes configurados de proveedor/búsqueda y entornos de ejecución de agentes configurados). Durante las actualizaciones de paquetes, doctor omite la reparación de plugins mediante el gestor de paquetes hasta que finalice el intercambio de paquetes; después, vuelva a ejecutar `openclaw doctor --fix` si un plugin configurado todavía necesita recuperación. Si una descarga falla, doctor informa del error de instalación y conserva la entrada del plugin configurado para el siguiente intento de reparación.
- Doctor repara la configuración obsoleta de plugins eliminando los identificadores de plugins ausentes de `plugins.allow`/`plugins.deny`/`plugins.entries`, junto con la configuración de canales sin destino, los destinos de heartbeat y las anulaciones de modelos de canales correspondientes, cuando la detección de plugins funciona correctamente.
- Doctor pone en cuarentena la configuración no válida de un plugin deshabilitando la entrada `plugins.entries.<id>` afectada y eliminando su carga útil `config` no válida. El inicio del Gateway ya omite únicamente ese plugin defectuoso para que los demás plugins y canales sigan funcionando.
- Doctor elimina el `plugins.entries.codex.config.codexDynamicToolsProfile` retirado; el servidor de aplicaciones de Codex siempre mantiene como nativas las herramientas de espacio de trabajo nativas de Codex.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y similares) a `talk.provider` + `talk.providers.<provider>`. Las ejecuciones repetidas de `doctor --fix` ya no informan ni aplican la normalización de Talk cuando la única diferencia es el orden de las claves del objeto.
- Doctor incluye una comprobación de preparación de la búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan las credenciales de incrustación.
- Doctor advierte cuando no hay ningún propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas. El emparejamiento por mensaje directo solo permite que alguien hable con el bot; si aprobó a un remitente antes de que existiera la inicialización del primer propietario, defina explícitamente `commands.ownerAllowFrom`.
- Doctor muestra una nota informativa cuando hay agentes en modo Codex configurados y existen recursos personales de la CLI de Codex en el directorio principal de Codex del operador. Los inicios locales del servidor de aplicaciones de Codex utilizan directorios principales aislados por agente; instale primero el plugin de Codex si es necesario y después utilice `openclaw migrate plan codex` para inventariar los recursos que deben promocionarse deliberadamente.
- Doctor advierte cuando las Skills permitidas para el agente predeterminado no están disponibles en el entorno de ejecución actual (faltan binarios, variables de entorno, configuración o requisitos del sistema operativo). `doctor --fix` puede deshabilitar esas Skills no disponibles mediante `skills.entries.<skill>.enabled=false`; si desea mantener activa la Skill, instale o configure el requisito ausente.
- Si el modo de entorno aislado está habilitado pero Docker no está disponible, doctor muestra una advertencia muy relevante con medidas correctivas (`install Docker` o `openclaw config set agents.defaults.sandbox.mode off`).
- Si existen archivos heredados del registro del entorno aislado o directorios de fragmentos (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`), doctor informa de ellos; `--fix` migra las entradas válidas a SQLite y pone en cuarentena los archivos heredados no válidos.
- Si `gateway.auth.token`/`gateway.auth.password` están administrados mediante SecretRef y no están disponibles en la ruta de comandos actual, doctor muestra una advertencia de solo lectura y no escribe credenciales alternativas en texto sin formato. Para los SecretRefs respaldados por exec, doctor omite la ejecución salvo que esté presente `--allow-exec`.
- Si la inspección de SecretRef de un canal falla en una ruta de corrección, doctor continúa e informa de una advertencia en lugar de finalizar anticipadamente.
- Después de las migraciones del directorio de estado, doctor advierte cuando las cuentas predeterminadas habilitadas de Telegram o Discord dependen de una alternativa del entorno y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no está disponible para el proceso de doctor.
- La resolución automática del nombre de usuario `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram que pueda resolverse en la ruta de comandos actual. Si la inspección del token no está disponible, doctor muestra una advertencia y omite la resolución automática en esa ejecución.

## macOS: anulaciones de entorno de `launchctl`

Si anteriormente ejecutó `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor anula el archivo de configuración y puede provocar errores persistentes de «no autorizado».

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Doctor del Gateway](/es/gateway/doctor)
