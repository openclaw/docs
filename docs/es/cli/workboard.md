---
read_when:
    - Quieres inspeccionar o crear tarjetas de Workboard desde la terminal
    - Quieres despachar ejecuciones de workers de Workboard desde la CLI
    - Estás depurando el comportamiento de la CLI de Workboard o de los comandos de barra.
summary: Referencia de la CLI para tarjetas `openclaw workboard`, envío y ejecuciones de trabajadores
title: CLI de Workboard
x-i18n:
    generated_at: "2026-06-27T11:08:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb6f5ab36b3f1f4d0eb06e5dfa9adbbe9bb14bf2ac389630da7725811ac6f47f
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` es la superficie de terminal para el
[Plugin Workboard](/es/plugins/workboard) incluido. Permite a un operador listar tarjetas, crear una
tarjeta, inspeccionar una tarjeta y pedir al Gateway en ejecución que despache trabajo listo hacia
ejecuciones de trabajadores subagentes.

Habilita el plugin antes de usar el comando:

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

El comando lee y escribe en la misma base de datos SQLite propiedad del plugin que usan el
panel y las herramientas de agente de Workboard. Los identificadores de tarjeta se pueden pasar como identificador completo o como
prefijo inequívoco cuando un comando acepta un identificador de tarjeta.

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

Las columnas son prefijo del identificador, estado, prioridad, identificador del tablero, identificador opcional del agente y título.

Indicadores:

| Indicador            | Propósito                                         |
| -------------------- | ------------------------------------------------- |
| `--board <id>`       | Limita los resultados a un espacio de nombres de tablero |
| `--status <status>`  | Limita los resultados a un estado de Workboard    |
| `--include-archived` | Incluye tarjetas archivadas en la salida de texto compacta |
| `--json`             | Imprime la lista completa de tarjetas como JSON de máquina |

La salida de texto compacta oculta las tarjetas archivadas de forma predeterminada para que la CLI coincida con el
comando `/workboard list`. Pasa `--include-archived` para mostrarlas. La salida JSON
mantiene la lista completa de tarjetas, incluidas las archivadas, para la automatización existente.

## `create`

```bash
openclaw workboard create "Fix stale worker heartbeat" --priority high --labels bug,workboard
openclaw workboard create "Write Workboard docs" --status ready --agent docs-agent --board docs --notes "Cover CLI, slash command, dispatch, and SQLite state."
```

Indicadores:

| Indicador              | Propósito                                      |
| ---------------------- | ---------------------------------------------- |
| `--notes <text>`       | Notas iniciales de la tarjeta                  |
| `--status <status>`    | Estado inicial, predeterminado `todo`          |
| `--priority <priority>` | Prioridad, predeterminada `normal`            |
| `--agent <id>`         | Asigna la tarjeta a un agente o identificador de propietario |
| `--board <id>`         | Almacena la tarjeta en un espacio de nombres de tablero |
| `--labels <items>`     | Etiquetas separadas por comas                  |
| `--json`               | Imprime la tarjeta creada como JSON de máquina |

`create` escribe directamente en el estado SQLite de Workboard. La tarjeta queda inmediatamente
visible en la pestaña Workboard de la IU de Control y para las herramientas de Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

La salida de texto imprime la línea compacta de la tarjeta y las notas. La salida JSON devuelve el registro completo
de la tarjeta, incluidos metadatos de ejecución, intentos, comentarios, enlaces, prueba,
artefactos, registros de trabajador, estado del protocolo, diagnósticos y metadatos de automatización.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` primero llama al método RPC del Gateway en ejecución
`workboard.cards.dispatch`. Esa ruta usa el mismo entorno de ejecución de subagentes que la
acción de despacho del panel, de modo que las tarjetas listas se convierten en ejecuciones de trabajadores con seguimiento de tareas
y claves de sesión enlazadas. Las tarjetas con un agente asignado usan claves de sesión de subagente
con alcance de agente; las tarjetas sin asignar mantienen una clave de subagente sin alcance para que se conserve el
agente predeterminado configurado del Gateway.

El bucle de despacho:

1. Promueve los hijos con dependencias listas a `ready`.
2. Bloquea reclamaciones vencidas o ejecuciones de trabajadores agotadas por tiempo.
3. Registra metadatos de despacho en las tarjetas listas.
4. Selecciona un lote pequeño de tarjetas listas no reclamadas.
5. Reclama cada tarjeta seleccionada para el despachador o el agente asignado.
6. Inicia una ejecución de trabajador subagente con contexto acotado de la tarjeta y el token de
   reclamación de la tarjeta.
7. Almacena en la tarjeta el identificador de la ejecución del trabajador, la clave de sesión, el enlace de tarea cuando el libro mayor de tareas del Gateway
   lo informa, el estado de ejecución y el registro del trabajador.

La selección es intencionalmente conservadora. Un despacho inicia como máximo tres
trabajadores de forma predeterminada, omite tarjetas archivadas o ya reclamadas e inicia solo una
tarjeta por propietario o agente en una sola pasada. Las tarjetas que ya pertenecen a trabajo activo en ejecución
o en revisión se dejan para un despacho posterior.

Si el inicio del trabajador falla después de reclamar una tarjeta, Workboard bloquea esa tarjeta,
borra la reclamación y registra el fallo en la ejecución de la tarjeta y en los metadatos de registro del trabajador.
Esto mantiene visibles los inicios fallidos en lugar de devolver silenciosamente la
tarjeta a la cola.

Si no se proporciona un destino Gateway explícito y el Gateway local no está disponible
o aún no expone el método de despacho de Workboard, la CLI recurre al despacho
solo de datos contra el estado local de Workboard. El despacho solo de datos aún puede
promover dependencias, limpiar reclamaciones obsoletas y bloquear ejecuciones agotadas por tiempo, pero no
inicia trabajadores. Los fallos de autenticación, permiso, validación y los fallos para un
destino explícito `--url` o `--token` se informan directamente.

La salida de texto informa los inicios de trabajadores:

```text
dispatch complete: started=2 failures=0
```

La salida de reserva es explícita:

```text
gateway unavailable; data dispatch only: promoted=1 blocked=0
```

La salida JSON incluye el resultado del despacho. El despacho respaldado por Gateway puede incluir
`started` y `startFailures`; la reserva solo de datos incluye
`gatewayUnavailable: true`. Los tokens de reclamación se redactan de la salida JSON de tarjetas.

En el panel, el mismo resultado de despacho se muestra como un resumen breve para que un
operador pueda ver cuántas tarjetas se iniciaron, promovieron, bloquearon, recuperaron o
fallaron sin abrir los detalles de la tarjeta.

## Paridad con comandos slash

Los canales compatibles con comandos pueden usar el comando slash correspondiente:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Fix stale worker heartbeat
/workboard dispatch
```

El despacho con comando slash también usa el entorno de ejecución de subagentes del Gateway, por lo que sigue el
mismo comportamiento de reclamación, inicio de trabajador y fallos que la ruta del Gateway del panel y la CLI.

`/workboard list` y `/workboard show` son comandos de lectura para remitentes de comandos autorizados.
`/workboard create` y `/workboard dispatch` modifican el estado del tablero y
requieren estado de propietario en superficies de chat o un cliente Gateway con `operator.write`
u `operator.admin`.

## Permisos

La ruta de despacho de la CLI llama a RPC del Gateway con alcances `operator.read` y
`operator.write`. Un token Gateway de solo lectura puede inspeccionar datos de Workboard
mediante métodos de lectura, pero no puede crear tarjetas ni despachar trabajadores.

Los comandos locales `list`, `create` y `show` operan sobre el directorio de estado local de OpenClaw
usado por el perfil actual. Usa `--dev` o `--profile <name>` en el comando
`openclaw` de nivel superior cuando necesites una raíz de estado diferente.

## Solución de problemas

### No aparecen tarjetas

Confirma que el plugin esté habilitado para el mismo perfil y la misma raíz de estado:

```bash
openclaw plugins inspect workboard --runtime --json
```

Si el panel muestra tarjetas pero la CLI no, comprueba que ambos comandos usen
la misma configuración de `--dev` o `--profile`.

### Dispatch indica solo datos

Inicia o reinicia el Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

Luego reintenta `openclaw workboard dispatch`. La reserva solo de datos es útil para la limpieza
del estado local, pero las ejecuciones de trabajadores necesitan un Gateway activo.

### Dispatch no inicia nada

Comprueba que haya al menos una tarjeta `ready` sin una reclamación activa:

```bash
openclaw workboard list --status ready
```

Las tarjetas también se pueden omitir cuando el mismo propietario ya tiene trabajo en ejecución o en revisión.
Mueve el trabajo completado a `done`, libera reclamaciones obsoletas mediante las herramientas de Workboard
o ejecuta el despacho de nuevo después de que finalice el trabajador activo.

## Relacionado

- [Plugin Workboard](/es/plugins/workboard)
- [Referencia de la CLI](/es/cli)
- [Comandos slash](/es/tools/slash-commands)
- [IU de Control](/es/web/control-ui)
