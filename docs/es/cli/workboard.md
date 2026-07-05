---
read_when:
    - Quieres inspeccionar o crear tarjetas de Workboard desde la terminal
    - Quieres iniciar ejecuciones de trabajadores de Workboard desde la CLI
    - Estás depurando el comportamiento de la CLI de Workboard o de comandos slash
summary: Referencia de la CLI para tarjetas `openclaw workboard`, despacho y ejecuciones de trabajadores
title: CLI del tablero de trabajo
x-i18n:
    generated_at: "2026-07-05T11:13:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3c62dd10aff146cae9f7475423148cf61fedb39983b065a9815c629349b4e233
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` es la superficie de terminal del [Plugin Workboard](/es/plugins/workboard) incluido. Permite a un operador listar tarjetas, crear una tarjeta, inspeccionar una tarjeta y pedir al Gateway en ejecución que despache trabajo listo hacia ejecuciones de trabajadores de subagente.

Habilita el Plugin antes de usar el comando:

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

El comando lee y escribe la misma base de datos SQLite propiedad del Plugin que usan el panel y las herramientas de agente de Workboard. Los ids de tarjeta son UUID; los comandos que aceptan un id de tarjeta también aceptan un prefijo de id inequívoco (la salida de texto compacta muestra los primeros 8 caracteres).

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

Las columnas son prefijo de id, estado, prioridad, id de tablero, id de agente opcional y título.

| Opción               | Propósito                                           |
| -------------------- | --------------------------------------------------- |
| `--board <id>`       | Limitar los resultados a un espacio de nombres de tablero |
| `--status <status>`  | Limitar los resultados a un estado de Workboard     |
| `--include-archived` | Incluir tarjetas archivadas en la salida de texto compacta |
| `--json`             | Imprimir la lista completa de tarjetas como JSON para máquina |

La salida de texto compacta oculta las tarjetas archivadas de forma predeterminada para que la CLI coincida con `/workboard list`. Pasa `--include-archived` para mostrarlas. La salida JSON siempre conserva la lista completa de tarjetas, incluidas las tarjetas archivadas, para la automatización existente.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

| Opción                  | Propósito                                      |
| ----------------------- | ---------------------------------------------- |
| `--notes <text>`        | Notas iniciales de la tarjeta                  |
| `--status <status>`     | Estado inicial, predeterminado `todo`          |
| `--priority <priority>` | Prioridad, predeterminada `normal`             |
| `--agent <id>`          | Asignar la tarjeta a un agente o id de propietario |
| `--board <id>`          | Almacenar la tarjeta en un espacio de nombres de tablero |
| `--labels <items>`      | Etiquetas separadas por comas                  |
| `--json`                | Imprimir la tarjeta creada como JSON para máquina |

`create` escribe directamente en el estado SQLite de Workboard. La tarjeta queda visible de inmediato en la pestaña Workboard de Control UI y para las herramientas de Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

La salida de texto imprime la línea compacta de la tarjeta y las notas. La salida JSON devuelve el registro completo de la tarjeta, incluidos metadatos de ejecución, intentos, comentarios, enlaces, pruebas, artefactos, registros del trabajador, estado del protocolo, diagnósticos y metadatos de automatización.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` primero llama al método RPC `workboard.cards.dispatch` del Gateway en ejecución, que usa el mismo runtime de subagente que la acción de despacho del panel, por lo que las tarjetas listas se convierten en ejecuciones de trabajadores con seguimiento de tareas y claves de sesión vinculadas. Las tarjetas con un agente asignado usan claves de sesión de subagente con alcance de agente; las tarjetas sin asignar conservan una clave de subagente sin alcance para que se preserve el agente predeterminado configurado del Gateway.

El bucle de despacho:

1. Promueve los hijos con dependencias listas a `ready`.
2. Bloquea reclamaciones vencidas o ejecuciones de trabajadores agotadas por tiempo.
3. Registra metadatos de despacho en tarjetas listas.
4. Selecciona un lote pequeño de tarjetas listas sin reclamar.
5. Reclama cada tarjeta seleccionada para el despachador o agente asignado.
6. Inicia una ejecución de trabajador de subagente con contexto acotado de la tarjeta y el token de reclamación de la tarjeta.
7. Almacena en la tarjeta el id de ejecución del trabajador, la clave de sesión, el enlace de tarea cuando el libro mayor de tareas del Gateway lo informa, el estado de ejecución y el registro del trabajador.

La selección es conservadora: un despacho inicia como máximo tres trabajadores de forma predeterminada, omite tarjetas archivadas o ya reclamadas e inicia solo una tarjeta por propietario o agente en una sola pasada. Las tarjetas que ya pertenecen a trabajo activo en ejecución o revisión se dejan para un despacho posterior.

Si el inicio del trabajador falla después de reclamar una tarjeta, Workboard bloquea esa tarjeta, borra la reclamación y registra el fallo en los metadatos de ejecución de la tarjeta y de registro del trabajador, manteniendo visibles los inicios fallidos en lugar de devolver silenciosamente la tarjeta a la cola.

Si no se proporciona un destino explícito de Gateway y el Gateway local no está disponible o aún no expone el método de despacho de Workboard, la CLI recurre a un despacho solo de datos contra el estado local de Workboard. El despacho solo de datos aún puede promover dependencias, limpiar reclamaciones obsoletas y bloquear ejecuciones agotadas por tiempo, pero no inicia trabajadores. Los fallos de autenticación, permisos y validación, y los fallos para un destino explícito `--url` o `--token`, se informan directamente en lugar de activar la alternativa.

La salida de texto informa los inicios de workers:

```text
dispatch complete: started=2 failures=0
```

La salida de reserva es explícita:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

La salida JSON incluye el resultado de dispatch. El dispatch respaldado por Gateway puede incluir `started` y `startFailures`; la reserva solo de datos incluye `gatewayUnavailable: true`. Los tokens de reclamación se redactan de la salida JSON de las tarjetas.

En el panel, el mismo resultado de dispatch se muestra como un breve resumen para que un operador pueda ver cuántas tarjetas se iniciaron, promocionaron, bloquearon, recuperaron o fallaron sin abrir los detalles de las tarjetas.

## Paridad de comandos slash

Los canales con capacidad de comandos pueden usar el comando slash correspondiente:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

El dispatch mediante comando slash también usa el runtime de subagente de Gateway, por lo que sigue el mismo comportamiento de reclamación, inicio de worker y fallos que el panel y la ruta Gateway de la CLI.

`/workboard list` y `/workboard show` son comandos de lectura para emisores de comandos autorizados. `/workboard create` y `/workboard dispatch` modifican el estado del tablero y requieren estado de propietario en superficies de chat o un cliente Gateway con `operator.write` u `operator.admin`.

## Permisos

La ruta de dispatch de la CLI llama a RPC de Gateway con los ámbitos `operator.read` y `operator.write`. Un token Gateway de solo lectura puede inspeccionar los datos de Workboard mediante métodos de lectura, pero no puede crear tarjetas ni despachar workers.

Los comandos locales `list`, `create` y `show` operan sobre el directorio de estado local de OpenClaw usado por el perfil actual. Usa `--dev` o `--profile <name>` en el comando `openclaw` de nivel superior cuando necesites una raíz de estado diferente.

## Solución de problemas

### No aparecen tarjetas

Confirma que el Plugin esté habilitado para el mismo perfil y la misma raíz de estado:

```bash
openclaw plugins inspect workboard --runtime --json
```

Si el panel muestra tarjetas pero la CLI no, comprueba que ambos comandos usen la misma configuración de `--dev` o `--profile`.

### Dispatch indica solo datos

Inicia o reinicia el Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Luego vuelve a intentar `openclaw workboard dispatch`. La reserva solo de datos es útil para la limpieza del estado local, pero las ejecuciones de workers necesitan un Gateway activo.

### Dispatch no inicia nada

Comprueba que haya al menos una tarjeta `ready` sin una reclamación activa:

```bash
openclaw workboard list --status ready
```

Las tarjetas también pueden omitirse cuando el mismo propietario ya tiene trabajo en ejecución o en revisión. Mueve el trabajo completado a `done`, libera reclamaciones obsoletas mediante las herramientas de Workboard o vuelve a ejecutar dispatch después de que termine el worker activo.

## Relacionado

- [Plugin de Workboard](/es/plugins/workboard)
- [Referencia de la CLI](/es/cli)
- [Comandos slash](/es/tools/slash-commands)
- [IU de control](/es/web/control-ui)
