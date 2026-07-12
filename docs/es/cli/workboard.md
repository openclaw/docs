---
read_when:
    - Quieres inspeccionar o crear tarjetas de Workboard desde la terminal
    - Quieres iniciar ejecuciones de trabajadores de Workboard desde la CLI
    - Estás depurando el comportamiento de la CLI de Workboard o de los comandos con barra diagonal
summary: Referencia de la CLI para tarjetas, asignación y ejecuciones de trabajadores de `openclaw workboard`
title: CLI de Workboard
x-i18n:
    generated_at: "2026-07-11T22:58:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` es la interfaz de terminal del [Plugin Workboard](/es/plugins/workboard) incluido. Permite a un operador enumerar tarjetas, crear una tarjeta, inspeccionar una tarjeta y solicitar al Gateway en ejecución que despache el trabajo listo a ejecuciones de trabajadores subagentes.

Habilite el Plugin antes de usar el comando:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Uso

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard dispatch [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

El comando lee y escribe en la misma base de datos SQLite propiedad del Plugin que utilizan el panel y las herramientas de agente de Workboard. Los identificadores de tarjeta son UUID; los comandos que aceptan un identificador de tarjeta también admiten un prefijo de identificador inequívoco (la salida de texto compacta muestra los primeros 8 caracteres).

Valores válidos de `status`: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Valores válidos de `priority`: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

La salida de texto es compacta:

```text
7f4a2c10  ready     high    default agent-a  Fix stale worker heartbeat
```

Las columnas son el prefijo del identificador, el estado, la prioridad, el identificador del tablero, el identificador opcional del agente y el título.

| Opción                 | Finalidad                                                       |
| ---------------------- | --------------------------------------------------------------- |
| `--board <id>`         | Limitar los resultados a un espacio de nombres de tablero       |
| `--status <status>`    | Limitar los resultados a un estado de Workboard                 |
| `--include-archived`   | Incluir tarjetas archivadas en la salida de texto compacta       |
| `--json`               | Imprimir la lista completa de tarjetas como JSON para máquinas  |

La salida de texto compacta oculta de forma predeterminada las tarjetas archivadas para que la CLI coincida con `/workboard list`. Pase `--include-archived` para mostrarlas. La salida JSON siempre conserva la lista completa de tarjetas, incluidas las archivadas, para la automatización existente.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Opción                    | Finalidad                                             |
| ------------------------- | ----------------------------------------------------- |
| `--notes <text>`          | Notas iniciales de la tarjeta                         |
| `--status <status>`       | Estado inicial; valor predeterminado: `todo`          |
| `--priority <priority>`   | Prioridad; valor predeterminado: `normal`             |
| `--agent <id>`            | Asignar la tarjeta a un agente o identificador de propietario |
| `--board <id>`            | Almacenar la tarjeta en un espacio de nombres de tablero |
| `--labels <items>`        | Etiquetas separadas por comas                         |
| `--json`                  | Imprimir la tarjeta creada como JSON para máquinas    |

`create` escribe directamente en el estado SQLite de Workboard. La tarjeta aparece de inmediato en la pestaña Workboard de la interfaz de control y para las herramientas de Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

La salida de texto imprime la línea compacta de la tarjeta y las notas. La salida JSON devuelve el registro completo de la tarjeta, incluidos los metadatos de ejecución, intentos, comentarios, enlaces, pruebas, artefactos, registros del trabajador, estado del protocolo, diagnósticos y metadatos de automatización.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` llama primero al método RPC `workboard.cards.dispatch` del Gateway en ejecución, que utiliza el mismo entorno de ejecución de subagentes que la acción de despacho del panel. De este modo, las tarjetas listas se convierten en ejecuciones de trabajadores con seguimiento de tareas y claves de sesión vinculadas. Las tarjetas con un agente asignado utilizan claves de sesión de subagente con ámbito de agente; las tarjetas sin asignar conservan una clave de subagente sin ámbito para mantener el agente predeterminado configurado en el Gateway.

El bucle de despacho:

1. Promueve a `ready` los elementos secundarios cuyas dependencias están listas.
2. Bloquea las asignaciones vencidas o las ejecuciones de trabajadores que superaron el tiempo de espera.
3. Registra los metadatos de despacho en las tarjetas listas.
4. Selecciona un pequeño lote de tarjetas listas sin asignar.
5. Asigna cada tarjeta seleccionada al despachador o al agente asignado.
6. Inicia una ejecución de trabajador subagente con un contexto de tarjeta limitado y el token de asignación de la tarjeta.
7. Almacena en la tarjeta el identificador de la ejecución del trabajador, la clave de sesión, la vinculación de la tarea cuando el registro de tareas del Gateway la proporciona, el estado de ejecución y el registro del trabajador.

La selección es conservadora: de forma predeterminada, un despacho inicia como máximo tres trabajadores, omite las tarjetas archivadas o ya asignadas e inicia solo una tarjeta por propietario o agente en una misma pasada. Las tarjetas que ya pertenecen a trabajos activos en ejecución o revisión se dejan para un despacho posterior.

Si el inicio del trabajador falla después de asignar una tarjeta, Workboard bloquea esa tarjeta, elimina la asignación y registra el fallo en los metadatos de ejecución y del registro del trabajador de la tarjeta. Así, los inicios fallidos permanecen visibles en lugar de devolver silenciosamente la tarjeta a la cola.

Si no se proporciona un destino explícito para el Gateway y el Gateway local no está disponible o todavía no expone el método de despacho de Workboard, la CLI recurre al despacho solo de datos sobre el estado local de Workboard. El despacho solo de datos aún puede promover dependencias, limpiar asignaciones obsoletas y bloquear ejecuciones que superaron el tiempo de espera, pero no inicia trabajadores. Los fallos de autenticación, permisos y validación, así como los fallos de un destino `--url` o `--token` explícito, se notifican directamente en lugar de activar el mecanismo alternativo.

La salida de texto informa de los inicios de trabajadores:

```text
dispatch complete: started=2 failures=0
```

La salida del mecanismo alternativo es explícita:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

La salida JSON incluye el resultado del despacho. El despacho respaldado por el Gateway puede incluir `started` y `startFailures`; el mecanismo alternativo solo de datos incluye `gatewayUnavailable: true`. Los tokens de asignación se ocultan en la salida JSON de las tarjetas.

En el panel, el mismo resultado del despacho se muestra como un breve resumen para que un operador pueda ver cuántas tarjetas se iniciaron, promovieron, bloquearon, reasignaron o fallaron sin abrir los detalles de cada tarjeta.

## Paridad de comandos con barra

Los canales que admiten comandos pueden utilizar el comando con barra equivalente:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

El despacho mediante comandos con barra también utiliza el entorno de ejecución de subagentes del Gateway, por lo que sigue el mismo comportamiento de asignación, inicio de trabajadores y fallos que el panel y la ruta del Gateway de la CLI.

`/workboard list` y `/workboard show` son comandos de lectura para remitentes de comandos autorizados. `/workboard create` y `/workboard dispatch` modifican el estado del tablero y requieren la condición de propietario en las interfaces de chat o un cliente del Gateway con `operator.write` u `operator.admin`.

## Permisos

La ruta de despacho de la CLI llama al RPC del Gateway con los ámbitos `operator.read` y `operator.write`. Un token del Gateway de solo lectura puede inspeccionar los datos de Workboard mediante métodos de lectura, pero no puede crear tarjetas ni despachar trabajadores.

Los comandos locales `list`, `create` y `show` operan en el directorio de estado local de OpenClaw utilizado por el perfil actual. Use `--dev` o `--profile <name>` en el comando `openclaw` de nivel superior cuando necesite una raíz de estado diferente.

## Solución de problemas

### No aparece ninguna tarjeta

Confirme que el Plugin esté habilitado para el mismo perfil y la misma raíz de estado:

```bash
openclaw plugins inspect workboard --runtime --json
```

Si el panel muestra tarjetas pero la CLI no, compruebe que ambos comandos utilicen la misma configuración de `--dev` o `--profile`.

### El despacho indica que es solo de datos

Inicie o reinicie el Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

A continuación, vuelva a intentar `openclaw workboard dispatch`. El mecanismo alternativo solo de datos es útil para limpiar el estado local, pero las ejecuciones de trabajadores necesitan un Gateway activo.

### El despacho no inicia nada

Compruebe que haya al menos una tarjeta `ready` sin una asignación activa:

```bash
openclaw workboard list --status ready
```

También pueden omitirse tarjetas cuando el mismo propietario ya tiene trabajo en ejecución o revisión. Mueva el trabajo completado a `done`, libere las asignaciones obsoletas mediante las herramientas de Workboard o vuelva a ejecutar el despacho después de que finalice el trabajador activo.

## Contenido relacionado

- [Plugin Workboard](/es/plugins/workboard)
- [Referencia de la CLI](/es/cli)
- [Comandos con barra](/es/tools/slash-commands)
- [Interfaz de control](/es/web/control-ui)
