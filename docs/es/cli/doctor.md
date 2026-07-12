---
read_when:
    - Tiene problemas de conectividad o autenticación y desea soluciones guiadas
    - Has realizado una actualización y quieres hacer una comprobación rápida
summary: Referencia de la CLI para `openclaw doctor` (comprobaciones de estado + reparaciones guiadas)
title: Doctor
x-i18n:
    generated_at: "2026-07-12T14:24:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4e616fd0843183167662292acf501297f44520050b664796fbb15a117cb68905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Comprobaciones de estado y correcciones rápidas para el Gateway, los canales, los plugins, las Skills, el enrutamiento de modelos, el estado local y las migraciones de configuración. Úselo siempre que algo no se comporte como se espera y quiera que un solo comando explique qué ocurre.

Relacionado:

- Solución de problemas: [Solución de problemas](/es/gateway/troubleshooting)
- Auditoría de seguridad: [Seguridad](/es/gateway/security)

## Modos

Doctor tiene cinco modos:

| Modo                           | Comando                                   | Comportamiento                                                                                                   |
| ------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Inspección                     | `openclaw doctor`                         | Comprobaciones orientadas a personas e indicaciones guiadas.                                                     |
| Reparación                     | `openclaw doctor --fix`                   | Aplica las reparaciones compatibles y solicita confirmación, salvo cuando la reparación no interactiva es segura. |
| Lint                           | `openclaw doctor --lint`                  | Hallazgos estructurados de solo lectura para CI, comprobaciones previas y controles de revisión.                 |
| Mantenimiento de SQLite compartido | `openclaw doctor --state-sqlite compact`  | Ejecuta explícitamente un punto de control, compacta y verifica la base de datos canónica de estado compartido.   |
| Migración de SQLite de sesiones | `openclaw doctor --session-sqlite <mode>` | Inspecciona, importa, valida, compacta, recupera o restaura el estado de las sesiones.                            |

Prefiera `--lint` cuando la automatización necesite un resultado estable. Prefiera `--fix` cuando un operador humano quiera que doctor edite la configuración o el estado.

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

Para los permisos específicos de un canal, use las sondas de canales en lugar de `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` informa de los permisos efectivos del bot para un destino de canal específico. `channels status --probe` audita todos los canales configurados y los destinos de conexión automática de voz.

## Opciones

| Opción                          | Efecto                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--no-workspace-suggestions`    | Desactiva las sugerencias de memoria/búsqueda del espacio de trabajo.                                                                                                                                  |
| `--yes`                         | Acepta los valores predeterminados sin solicitar confirmación.                                                                                                                                         |
| `--repair` / `--fix`            | Aplica las reparaciones recomendadas no relacionadas con servicios sin solicitar confirmación (`--fix` es un alias). Las instalaciones o reescrituras del servicio Gateway siguen requiriendo confirmación interactiva o comandos `gateway` explícitos. |
| `--force`                       | Aplica reparaciones agresivas, incluida la sobrescritura de la configuración personalizada del servicio.                                                                                              |
| `--non-interactive`             | Se ejecuta sin solicitudes de confirmación; solo realiza migraciones seguras y reparaciones no relacionadas con servicios.                                                                            |
| `--generate-gateway-token`      | Genera y configura un token del Gateway.                                                                                                                                                               |
| `--allow-exec`                  | Permite que doctor ejecute las SecretRefs `exec` configuradas al verificar secretos.                                                                                                                   |
| `--deep`                        | Analiza los servicios del sistema para detectar instalaciones adicionales del Gateway e informa de las transferencias recientes de reinicio del supervisor del Gateway.                              |
| `--lint`                        | Ejecuta comprobaciones de estado modernizadas en modo de solo lectura y emite hallazgos de diagnóstico.                                                                                               |
| `--post-upgrade`                | Ejecuta sondas de compatibilidad de plugins posteriores a la actualización; los hallazgos se envían a stdout; código de salida 1 si existe algún hallazgo de nivel de error.                           |
| `--state-sqlite <mode>`         | Ejecuta el mantenimiento explícito de SQLite del estado compartido. El único modo es `compact`.                                                                                                        |
| `--session-sqlite <mode>`       | Ejecuta el modo de migración de SQLite de sesiones seleccionado: `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` o `restore`.                                                         |
| `--session-sqlite-store <path>` | Con `--session-sqlite`: selecciona una ruta de almacén `sessions.json` heredado.                                                                                                                       |
| `--session-sqlite-agent <id>`   | Con `--session-sqlite`: selecciona un agente configurado.                                                                                                                                              |
| `--session-sqlite-all-agents`   | Con `--session-sqlite`: selecciona los almacenes de agentes configurados y detectados.                                                                                                                 |
| `--github-issue`                | Con `--session-sqlite recover`: prepara un informe de incidencia saneado para openclaw/openclaw; doctor lo crea con `gh` después de `--yes` o de una confirmación interactiva.                         |
| `--json`                        | Con `--lint`: hallazgos JSON. Con `--post-upgrade`: `{ probesRun, findings }`. Con `--state-sqlite` o `--session-sqlite`: el informe de mantenimiento en formato JSON.                                |
| `--severity-min <level>`        | Con `--lint`: descarta los hallazgos por debajo de `info`, `warning` o `error`.                                                                                                                        |
| `--all`                         | Con `--lint`: ejecuta todas las comprobaciones registradas, incluidas las comprobaciones opcionales excluidas del conjunto predeterminado.                                                            |
| `--skip <id>`                   | Con `--lint`: omite un identificador de comprobación. Se puede repetir.                                                                                                                               |
| `--only <id>`                   | Con `--lint`: ejecuta solo los identificadores de comprobación indicados. Se puede repetir.                                                                                                           |

`--severity-min`, `--all`, `--only` y `--skip` solo se aceptan junto con `--lint`; `--json` se acepta con `--lint`, `--post-upgrade`, `--state-sqlite` y `--session-sqlite`.

## Modo Lint

`openclaw doctor --lint` es de solo lectura: no solicita confirmación, no repara ni reescribe la configuración o el estado.

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
doctor --lint: se ejecutaron 6 comprobación(es), 1 hallazgo(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode no está definido; se bloqueará el inicio del gateway.
    corrección: Ejecute `openclaw configure` y defina el modo del Gateway (local/remoto), o `openclaw config set gateway.mode local`.
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
      "message": "gateway.mode no está definido; se bloqueará el inicio del gateway.",
      "path": "gateway.mode",
      "fixHint": "Ejecute `openclaw configure` y defina el modo del Gateway (local/remoto), o `openclaw config set gateway.mode local`."
    }
  ]
}
```

Códigos de salida:

| Código | Significado                                                                 |
| ------ | --------------------------------------------------------------------------- |
| `0`    | No hay hallazgos iguales o superiores al umbral de gravedad seleccionado.   |
| `1`    | Al menos un hallazgo alcanza el umbral seleccionado.                        |
| `2`    | Fallo del comando o del entorno de ejecución antes de poder generar hallazgos de lint. |

`--severity-min` controla tanto qué hallazgos se muestran como el umbral de salida: `openclaw doctor --lint --severity-min error` puede no mostrar nada y finalizar con `0` incluso cuando existan hallazgos `info`/`warning` de menor gravedad.

`--all` controla qué comprobaciones se seleccionan antes del filtrado por gravedad. La ejecución predeterminada de lint excluye las comprobaciones profundas, históricas o con mayor probabilidad de detectar residuos heredados reparables; use `--all` para obtener el inventario completo. `--only <id>` es el selector más preciso y puede ejecutar cualquier comprobación registrada por identificador.

`core/doctor/local-audio-acceleration` informa del comando STT local seleccionado automáticamente, de las pruebas separadas del backend disponible/solicitado/observado y del orden de respaldo sin cargar un modelo de voz. Emite un hallazgo informativo, por lo que debe incluir `--severity-min info` para mostrarlo.

## Comprobaciones de estado estructuradas

Las comprobaciones modernas de doctor usan un contrato dividido y reducido:

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` sustenta `doctor --lint`. `repair()` es opcional y solo se ejecuta con `doctor --fix` / `doctor --repair`. Las comprobaciones que aún no se han migrado a esta forma siguen usando el flujo heredado de contribuciones de doctor.

Los contextos de reparación pueden incluir solicitudes `dryRun`/`diff`; los resultados de reparación pueden devolver `diffs` estructurados (ediciones de configuración/archivos) y `effects` (efectos secundarios en servicios, procesos, paquetes, estado u otros), de modo que las comprobaciones convertidas puedan evolucionar hacia `doctor --fix --dry-run` sin trasladar la planificación de mutaciones a `detect()`.

`repair()` informa de `status: "repaired" | "skipped" | "failed"` (si se omite el estado, significa `repaired`). Cuando la reparación devuelve `skipped` o `failed`, doctor informa del motivo y omite la validación de esa comprobación. Tras una reparación correcta, doctor vuelve a ejecutar `detect()` limitado a los hallazgos reparados; si el hallazgo sigue presente, doctor informa de una advertencia de reparación en lugar de considerar que el cambio está completo.

Un hallazgo incluye:

| Campo             | Propósito                                                                 |
| ----------------- | ------------------------------------------------------------------------- |
| `checkId`         | Id. estable para filtros de omisión/exclusividad y listas permitidas de CI. |
| `severity`        | `info`, `warning` o `error`.                                               |
| `message`         | Descripción del problema legible para personas.                            |
| `path`            | Ruta de configuración, archivo o lógica, cuando esté disponible.           |
| `line` / `column` | Ubicación en el código fuente, cuando esté disponible.                     |
| `ocPath`          | Dirección `oc://` precisa cuando una comprobación pueda señalar una.       |
| `fixHint`         | Acción sugerida para el operador o resumen de la reparación.               |

Las comprobaciones modernizadas del doctor del núcleo permanecen asociadas a la contribución ordenada del doctor que controla su comportamiento visible de `doctor` / `doctor --fix`. El registro compartido de estado estructurado es el punto de extensión: las comprobaciones integradas y respaldadas por plugins se ejecutan después de las comprobaciones del doctor del núcleo una vez que su paquete propietario las registra en la ruta de comandos activa. `openclaw/plugin-sdk/health` expone el mismo contrato para los autores de plugins.

## Selección de comprobaciones

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` y `--skip` aceptan identificadores completos de comprobación y pueden repetirse. Si un identificador de `--only` no está registrado, no se ejecuta ninguna comprobación para ese identificador; use `checksRun`/`checksSkipped` en la salida para confirmar que una puerta de control específica selecciona las comprobaciones esperadas.

## Modo posterior a la actualización

`openclaw doctor --post-upgrade` ejecuta sondeos de compatibilidad de plugins para encadenarlos después de una compilación o actualización. Los hallazgos se envían a stdout; el código de salida es 1 si algún hallazgo tiene `level: "error"`. Añada `--json` para obtener un contenedor legible por máquina (`{ probesRun, findings }`), adecuado para CI, la skill comunitaria `fork-upgrade` y otras herramientas de comprobación rápida posteriores a una actualización. Si falta el índice de plugins instalados o tiene un formato incorrecto, el modo JSON sigue emitiendo el contenedor con un hallazgo de error `plugin.index_unavailable`.

El inicio de una imagen de contenedor es la excepción al flujo habitual de «ejecutar doctor después de
actualizar». Cuando `openclaw gateway run` se inicia con una nueva versión de OpenClaw,
ejecuta reparaciones seguras del estado y de los plugins antes de indicar que está listo. Si la reparación no puede
finalizar de forma segura, el inicio termina e indica que se ejecute una vez la misma imagen con
`openclaw doctor --fix` sobre el mismo estado/configuración montado antes de reiniciar
el contenedor normalmente.

## Compaction de SQLite del estado compartido

`openclaw doctor --state-sqlite compact` es un mantenimiento explícito sin conexión para
la base de datos canónica de estado compartido ubicada en
`<state-dir>/state/openclaw.sqlite`. No acepta una ruta arbitraria de base de datos,
nunca se invoca durante el funcionamiento normal del Gateway y no forma parte de
`openclaw doctor --fix`.

Detenga el Gateway y cree primero una copia de seguridad verificada:

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

El comando:

1. Requiere un archivo normal en la ruta canónica del estado compartido. Si falta la
   base de datos, se informa como `skipped` y el comando finaliza correctamente.
2. Valida la versión actual compatible del esquema y
   `schema_meta.role = "global"` antes de crear un punto de control o modificar el archivo.
3. Requiere un `wal_checkpoint(TRUNCATE)` que no esté ocupado. Detenga cualquier proceso restante de OpenClaw
   y vuelva a intentarlo si el punto de control está ocupado.
4. Establece `auto_vacuum` en `INCREMENTAL`, ejecuta un `VACUUM` completo y vuelve a crear
   un punto de control.
5. Ejecuta `quick_check`, `integrity_check` y `foreign_key_check`, y después
   vuelve a aplicar permisos exclusivos del propietario a la base de datos y a los archivos auxiliares de SQLite.

La salida JSON informa de los tamaños de la base de datos y del WAL, las páginas de la lista libre, el tamaño de página y
el valor de `auto_vacuum` antes y después de la compactación, además de los bytes recuperados y los
resultados de `quick_check` e `integrity_check`. `foreign_key_check` se aplica
con cierre ante fallos y no tiene un campo de éxito independiente. SQLite informa de `auto_vacuum` como
`0` para ninguno, `1` para completo y `2` para incremental.

La compactación falla sin realizar modificaciones cuando el esquema es antiguo, más reciente que la
compilación de OpenClaw en ejecución o pertenece a una base de datos de agente. Ejecute primero
`openclaw doctor --fix` para un esquema antiguo del estado compartido. Restaure una
copia de seguridad compatible o actualice OpenClaw si el esquema es más reciente.

## Migración de SQLite de sesiones

OpenClaw importa automáticamente las filas de sesiones heredadas y el historial de transcripciones en la
base de datos SQLite de cada agente durante el inicio del Gateway y durante
`openclaw doctor --fix`. `openclaw doctor --session-sqlite <mode>` es la
herramienta específica de inspección y validación para esa migración. Las filas de sesiones actuales en tiempo de ejecución
se encuentran en
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Los archivos
`sessions.json` heredados son fuentes de migración. Los archivos JSONL de transcripciones activas se
importan y archivan fuera del directorio de sesiones activas tras una
importación correcta; los archivos JSONL del nivel de archivo permanecen como artefactos de soporte, no como mecanismos
alternativos en tiempo de ejecución.

Modos:

| Modo       | Comportamiento                                                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Lee los recuentos heredados y de SQLite, además de los archivos JSONL sin referencia, sin importar.                                  |
| `dry-run`  | Analiza las entradas heredadas y los archivos JSONL de transcripciones, cuenta las filas importables e informa de problemas sin escribir filas de SQLite. |
| `import`   | Importa entradas heredadas y eventos de transcripción en SQLite para los destinos seleccionados.                                    |
| `validate` | Compara las fuentes heredadas seleccionadas con las filas de SQLite y los recuentos de eventos de transcripción.                     |
| `compact`  | Crea puntos de control y ejecuta VACUUM en las bases de datos SQLite de agentes seleccionadas para recuperar páginas libres tras eliminaciones grandes o limpieza de archivos. |
| `recover`  | Restaura la última ejecución de migración fallida, valida sus destinos y prepara un informe saneado de incidencia de GitHub.          |
| `restore`  | Restaura artefactos de transcripción archivados desde los manifiestos de migración registrados sin eliminar datos de SQLite.         |

Selectores:

- Valor predeterminado: el almacén configurado del agente predeterminado, cuando exista ese archivo de almacén heredado.
- `--session-sqlite-agent <id>`: un agente configurado.
- `--session-sqlite-all-agents`: almacenes de agentes configurados más los almacenes de agentes detectados.
- `--session-sqlite-store <path>`: una ruta explícita a un archivo `sessions.json` heredado.

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
un historial importante. `validate` finaliza con un código distinto de cero cuando falta en
SQLite una entrada heredada seleccionada, difiere un identificador de sesión o difiere un recuento de eventos de transcripción.
Cuando use `--session-sqlite-store <path>`, compruebe que el informe contiene el
número esperado de destinos; una ruta explícita de almacén inexistente no selecciona ningún destino.

Las eliminaciones de SQLite recuperan primero páginas dentro de la base de datos; no necesariamente
reducen de inmediato el archivo de la base de datos. Después de eliminar o archivar
transcripciones grandes, ejecute `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`
para crear puntos de control de los archivos WAL, ejecutar `VACUUM` e informar de los tamaños
de la base de datos y del WAL antes y después. La compactación requiere un archivo normal con el esquema actual del agente, los
metadatos persistentes del propietario del agente seleccionado y ningún identificador de archivo abierto en el proceso del doctor.
Este es un mantenimiento explícito sin conexión: detenga primero el Gateway para que las escrituras
normales no puedan entrar en conflicto con el punto de control ni con `VACUUM`.

Cada importación escribe un manifiesto en
`~/.openclaw/session-sqlite-migration-runs/` antes de mover los artefactos de transcripción
al archivo. Si el inicio informa de un fallo en la migración de SQLite de sesiones después de
mover los artefactos, ejecute la recuperación:

```bash
openclaw doctor --session-sqlite recover --github-issue
```

La recuperación selecciona el manifiesto de migración fallida más reciente, restaura únicamente los
artefactos archivados del manifiesto, valida los destinos afectados, actualiza los
informes saneados `.failure.md` y `.failure.json`, y prepara el cuerpo de una incidencia de GitHub
que evita el contenido de las transcripciones, el entorno sin procesar, los secretos y la configuración
sin límites. Cuando no existe ningún manifiesto de migración fallida, pero la base de datos SQLite
de un agente seleccionado está dañada, no es una base de datos o tiene archivos auxiliares de diario sin una
base de datos principal, la recuperación copia el conjunto completo de archivos en un directorio temporal
de inspección. SQLite puede revertir un diario activo válido en esa copia desechable
antes de ejecutar `quick_check`, `integrity_check` y `foreign_key_check`, mientras que los
archivos forenses originales permanecen intactos. Las comprobaciones de integridad fallidas o los
archivos auxiliares huérfanos preservan los archivos de DB, WAL, SHM y del diario de reversión cambiando el nombre de
todo el conjunto detectado con un único sufijo `.corrupt-<timestamp>`. Si se detecta un fallo al cambiar el nombre,
se revierten los archivos ya movidos antes de informar del fallo, para que un
conjunto de archivos recuperable no quede dividido silenciosamente. Detenga el Gateway antes de la recuperación;
copiar o cambiar el nombre de un conjunto de archivos SQLite que está cambiando activamente no es seguro y se comporta
de manera diferente según el sistema operativo. Con `--github-issue --yes`, el doctor utiliza
la CLI de GitHub para crear la incidencia en `openclaw/openclaw`; sin confirmación,
escribe el informe de soporte local e imprime una URL de incidencia prerrellenada.

`restore` sigue siendo la operación de deshacer de bajo nivel. Utiliza los registros
`sourcePath -> archivePath` del manifiesto, devuelve los artefactos archivados únicamente cuando
falta la ruta original, informa de conflictos cuando existen ambas rutas y deja
la base de datos SQLite en su lugar.

### Reversión a una versión anterior tras la migración de SQLite de sesiones

Antes de iniciar una versión anterior de OpenClaw basada en archivos, restaure los artefactos
heredados de transcripción archivados:

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Las versiones anteriores leen las entradas de `sessions.json` y las rutas `sessionFile` registradas
en esas entradas. Después de la migración de SQLite, las importaciones correctas mueven las transcripciones JSONL
activas a `session-sqlite-import-archive/`, por lo que el entorno de ejecución anterior no puede
ver ese historial hasta que la restauración devuelva esos artefactos registrados en el manifiesto a
sus rutas originales.

La restauración no elimina datos de SQLite. Las sesiones creadas después del cambio a SQLite
solo existen en SQLite y no aparecerán en el entorno de ejecución anterior. Si posteriormente
vuelve a actualizar, ejecute la secuencia normal de validación de la migración anterior para que OpenClaw pueda
comparar los artefactos heredados restaurados con las filas de SQLite antes de importar.

## Notas

- En el modo Nix (`OPENCLAW_NIX_MODE=1`), las comprobaciones de solo lectura de doctor siguen funcionando, pero `doctor --fix`, `doctor --repair`, `doctor --yes` y `doctor --generate-gateway-token` están deshabilitados porque `openclaw.json` es inmutable. Edite en su lugar la fuente de Nix de esta instalación; para nix-openclaw, use el [Inicio rápido](https://github.com/openclaw/nix-openclaw#quick-start) orientado primero al agente.
- Los mensajes interactivos (correcciones del llavero/OAuth, etc.) solo se ejecutan cuando stdin es una TTY y **no** se establece `--non-interactive`. Las ejecuciones sin interfaz (cron, Telegram, sin terminal) omiten los mensajes.
- Las ejecuciones no interactivas de `doctor` omiten la carga anticipada de plugins para que las comprobaciones de estado sin interfaz sigan siendo rápidas. Las sesiones interactivas aún cargan las superficies de plugins necesarias para el flujo heredado de estado y reparación.
- `--lint` es más estricto que `--non-interactive`: siempre es de solo lectura, nunca muestra mensajes ni aplica migraciones seguras. Use `doctor --fix` o `doctor --repair` cuando quiera que doctor realice cambios.
- De forma predeterminada, doctor no ejecuta SecretRefs de `exec` al comprobar secretos. Use `--allow-exec` (con o sin `--lint`) solo cuando quiera intencionadamente que doctor ejecute esos resolutores de secretos configurados.
- Cualquier escritura de configuración (incluida una reparación con `--fix`) rota una copia de seguridad a `~/.openclaw/openclaw.json.bak` (con un anillo numerado `.bak.1`..`.bak.4`). `--fix` también elimina las claves de configuración desconocidas notificadas por la validación del esquema y enumera cada eliminación; omite esta operación mientras hay una actualización en curso para no eliminar el estado de actualización escrito parcialmente antes de que finalice su migración.
- Establezca `OPENCLAW_SERVICE_REPAIR_POLICY=external` cuando otro supervisor gestione el ciclo de vida del Gateway. Doctor sigue informando sobre el estado del Gateway/servicio y aplica reparaciones ajenas al servicio, pero omite la instalación, el inicio, el reinicio y la inicialización del servicio, así como la limpieza del servicio heredado.
- En Linux, doctor ignora las unidades adicionales inactivas de systemd similares al Gateway y no reescribe los metadatos del comando/punto de entrada de un servicio Gateway de systemd en ejecución durante la reparación. Detenga primero el servicio o use `openclaw gateway install --force` para reemplazar el iniciador activo.
- `doctor --fix --non-interactive` informa sobre definiciones ausentes u obsoletas del servicio Gateway, pero no las instala ni reescribe fuera del modo de reparación de actualizaciones. Ejecute `openclaw gateway install` si falta un servicio o `openclaw gateway install --force` para reemplazar el iniciador.
- Las comprobaciones de integridad del estado detectan archivos de transcripción huérfanos en el directorio de sesiones. Archivarlos como `.deleted.<timestamp>` requiere confirmación interactiva; `--fix`, `--yes` y las ejecuciones sin interfaz los dejan en su lugar.
- Doctor examina `~/.openclaw/cron/jobs.json` (o `cron.store`) en busca de formatos heredados de trabajos cron y los reescribe antes de importar filas canónicas en SQLite.
- Doctor informa sobre los trabajos cron con una sustitución explícita de `payload.model`, incluidos los recuentos por espacio de nombres del proveedor y las discrepancias con `agents.defaults.model`, para que los trabajos programados que no heredan el modelo predeterminado sean visibles durante las investigaciones de autenticación o facturación.
- Doctor informa sobre los trabajos cron que aún están marcados como en curso (`state.runningAtMs`), lo que puede hacer que `openclaw cron list` los muestre como `running`. Esta comprobación es de solo lectura: si ningún Gateway está ejecutando actualmente un trabajo marcado, el siguiente inicio del servicio cron registra la ejecución interrumpida y borra el marcador.
- En Linux, doctor advierte cuando el crontab del usuario aún ejecuta el script heredado sin mantenimiento `~/.openclaw/bin/ensure-whatsapp.sh`, que puede informar erróneamente `Gateway inactive` cuando cron carece del entorno del bus de usuario de systemd.
- Cuando WhatsApp está habilitado, doctor comprueba si hay un bucle de eventos del Gateway degradado mientras aún se ejecutan clientes locales de `openclaw-tui`. `doctor --fix` detiene únicamente los clientes TUI locales verificados para que las respuestas de WhatsApp no queden en cola detrás de bucles de actualización TUI obsoletos.
- Doctor reescribe las referencias heredadas de modelos `openai-codex/*` como referencias canónicas `openai/*` en los modelos principales, las alternativas, los modelos de generación de imágenes/vídeos, las sustituciones de heartbeat/subagente/compaction, los hooks, las sustituciones de modelos de canales y los anclajes obsoletos de rutas de sesión. `--fix` también migra los perfiles de autenticación heredados `openai-codex:*` y las entradas `auth.order.openai-codex` a `openai:*`, traslada la intención de Codex a entradas `agentRuntime.id: "codex"` con ámbito de proveedor/modelo, elimina anclajes obsoletos del entorno de ejecución para agentes completos/sesiones y mantiene las referencias reparadas de agentes OpenAI en el enrutamiento de autenticación de Codex en vez de usar directamente la autenticación mediante clave de API de OpenAI.
- Doctor informa sobre las listas no vacías `auth.order.<provider>` cuyos perfiles referenciados ya no existen, pero para las que hay credenciales almacenadas compatibles. `doctor --fix` elimina únicamente esas sustituciones obsoletas y restablece la selección automática de credenciales por agente; los órdenes explícitamente vacíos, las listas parcialmente vigentes y los órdenes sin credenciales almacenadas compatibles permanecen sin cambios. Si un almacén de autenticación SQLite activo no se puede leer o tiene un formato incorrecto, doctor explica por qué omitió esta reparación. Reinicie un Gateway en ejecución antes de volver a comprobar el estado de autenticación si su modo de recarga de configuración no aplica automáticamente la escritura.
- Doctor limpia el estado heredado de preparación de dependencias de plugins de versiones anteriores de OpenClaw y vuelve a enlazar el paquete `openclaw` del host para los plugins npm gestionados que lo declaran como dependencia de pares. También repara los plugins descargables ausentes a los que hace referencia la configuración (`plugins.entries`, canales configurados, ajustes configurados de proveedor/búsqueda y entornos de ejecución de agentes configurados). Durante las actualizaciones de paquetes, doctor omite la reparación de plugins mediante el gestor de paquetes hasta que finaliza el intercambio de paquetes; vuelva a ejecutar `openclaw doctor --fix` después si un plugin configurado aún necesita recuperación. Si una descarga falla, doctor informa del error de instalación y conserva la entrada del plugin configurado para el siguiente intento de reparación.
- Doctor repara la configuración obsoleta de plugins eliminando los identificadores de plugins ausentes de `plugins.allow`/`plugins.deny`/`plugins.entries`, además de la configuración de canal, los destinos de heartbeat y las sustituciones de modelos de canales correspondientes que hayan quedado colgando, cuando la detección de plugins funciona correctamente.
- Doctor pone en cuarentena la configuración no válida de un plugin deshabilitando la entrada `plugins.entries.<id>` afectada y eliminando su carga útil `config` no válida. El inicio del Gateway ya omite únicamente ese plugin defectuoso, de modo que los demás plugins y canales siguen funcionando.
- Doctor elimina el valor retirado `plugins.entries.codex.config.codexDynamicToolsProfile`; el servidor de aplicaciones de Codex siempre mantiene como nativas las herramientas de espacio de trabajo propias de Codex.
- Doctor migra automáticamente la configuración plana heredada de Talk (`talk.voiceId`, `talk.modelId` y otras relacionadas) a `talk.provider` + `talk.providers.<provider>`. Las ejecuciones repetidas de `doctor --fix` ya no informan ni aplican la normalización de Talk cuando la única diferencia es el orden de las claves del objeto.
- Doctor incluye una comprobación de preparación de la búsqueda en memoria y puede recomendar `openclaw configure --section model` cuando faltan las credenciales de embeddings.
- Doctor advierte cuando no hay ningún propietario de comandos configurado. El propietario de comandos es la cuenta del operador humano autorizada para ejecutar comandos exclusivos del propietario y aprobar acciones peligrosas. El emparejamiento por mensaje directo solo permite que alguien hable con el bot; si aprobó a un remitente antes de que existiera la inicialización del primer propietario, establezca `commands.ownerAllowFrom` explícitamente.
- Doctor muestra una nota informativa cuando hay agentes en modo Codex configurados y existen recursos personales de la CLI de Codex en el directorio principal de Codex del operador. Los inicios locales del servidor de aplicaciones de Codex usan directorios principales aislados por agente; instale primero el plugin de Codex si es necesario y luego use `openclaw migrate plan codex` para inventariar los recursos que deban promoverse deliberadamente.
- Doctor advierte cuando las Skills permitidas para el agente predeterminado no están disponibles en el entorno de ejecución actual (faltan binarios, variables de entorno, configuración o requisitos del sistema operativo). `doctor --fix` puede deshabilitar esas Skills no disponibles con `skills.entries.<skill>.enabled=false`; instale o configure el requisito que falta si quiere mantener activa la Skill.
- Si el modo de sandbox está habilitado pero Docker no está disponible, doctor muestra una advertencia destacada con medidas correctivas (`install Docker` o `openclaw config set agents.defaults.sandbox.mode off`).
- Si existen archivos heredados del registro del sandbox o directorios de fragmentos (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` o `~/.openclaw/sandbox/browsers/`), doctor informa sobre ellos; `--fix` migra las entradas válidas a SQLite y pone en cuarentena los archivos heredados no válidos.
- Si `gateway.auth.token`/`gateway.auth.password` están gestionados mediante SecretRef y no están disponibles en la ruta del comando actual, doctor muestra una advertencia de solo lectura y no escribe credenciales alternativas en texto sin formato. Para las SecretRefs respaldadas por exec, doctor omite la ejecución salvo que se incluya `--allow-exec`.
- Si falla la inspección de SecretRef de un canal en una ruta de corrección, doctor continúa e informa de una advertencia en lugar de finalizar antes de tiempo.
- Después de las migraciones del directorio de estado, doctor advierte cuando las cuentas predeterminadas habilitadas de Telegram o Discord dependen de la alternativa mediante variables de entorno y `TELEGRAM_BOT_TOKEN` o `DISCORD_BOT_TOKEN` no están disponibles para el proceso de doctor.
- La resolución automática de nombres de usuario de `allowFrom` de Telegram (`doctor --fix`) requiere un token de Telegram resoluble en la ruta del comando actual. Si la inspección del token no está disponible, doctor informa de una advertencia y omite la resolución automática en esa pasada.

## macOS: sustituciones del entorno de `launchctl`

Si anteriormente ejecutó `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (o `...PASSWORD`), ese valor prevalece sobre el archivo de configuración y puede provocar errores persistentes de "no autorizado".

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Doctor del Gateway](/es/gateway/doctor)
