---
read_when:
    - Quieres consultar o crear tarjetas de Workboard desde la terminal
    - Se desea iniciar ejecuciones de trabajadores de Workboard desde la CLI
    - Está depurando el comportamiento de la CLI de Workboard o de los comandos con barra diagonal
summary: Referencia de la CLI para tarjetas de `openclaw workboard`, asignación y ejecuciones de trabajadores
title: CLI de Workboard
x-i18n:
    generated_at: "2026-07-14T13:37:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: c109402dad26a44a277febf895e4f4305060e3b6c8ecc024aca5f255de8b5717
    source_path: cli/workboard.md
    workflow: 16
---

`openclaw workboard` es la interfaz de terminal del [Plugin Workboard](/es/plugins/workboard) incluido. Permite a un operador enumerar tarjetas, crear una tarjeta, inspeccionar una tarjeta y solicitar al Gateway en ejecución que asigne el trabajo listo a ejecuciones de trabajadores subagentes.

Active el Plugin antes de usar el comando:

```bash
openclaw plugins enable workboard
openclaw gateway restart
```

## Uso

```bash
openclaw workboard list [--board <id>] [--status <status>] [--include-archived] [--json]
openclaw workboard create <title...> [--notes <text>] [--status <status>] [--priority <priority>] [--agent <id>] [--board <id>] [--labels <items>] [--json]
openclaw workboard show <id> [--json]
openclaw workboard move <id> --status <status> [--json]
openclaw workboard dispatch [--board <id>] [--max-starts <count>] [--admin] [--url <url>] [--token <token>] [--timeout <ms>] [--json]
```

El comando lee y escribe en la misma base de datos SQLite propiedad del Plugin que utilizan el panel y las herramientas de agente de Workboard. Los identificadores de las tarjetas son UUID; los comandos que aceptan un identificador de tarjeta también aceptan un prefijo de identificador inequívoco (la salida de texto compacta muestra los primeros 8 caracteres).

Valores válidos de `status`: `triage`, `backlog`, `todo`, `scheduled`, `ready`, `running`, `review`, `blocked`, `done`. Valores válidos de `priority`: `low`, `normal`, `high`, `urgent`.

## `list`

```bash
openclaw workboard list
openclaw workboard list --board default --status ready
openclaw workboard list --json
```

La salida de texto es compacta:

```text
7f4a2c10  ready     high    default agent-a  Corregir el Heartbeat obsoleto del trabajador
```

Las columnas son el prefijo del identificador, el estado, la prioridad, el identificador del tablero, el identificador opcional del agente y el título.

| Indicador                 | Propósito                                       |
| -------------------- | --------------------------------------------- |
| `--board <id>`       | Limitar los resultados al espacio de nombres de un tablero          |
| `--status <status>`  | Limitar los resultados a un estado de Workboard         |
| `--include-archived` | Incluir las tarjetas archivadas en la salida de texto compacta |
| `--json`             | Imprimir la lista completa de tarjetas como JSON para máquinas      |

De forma predeterminada, la salida de texto compacta oculta las tarjetas archivadas para que la CLI coincida con `/workboard list`. Use `--include-archived` para mostrarlas. La salida JSON siempre conserva la lista completa de tarjetas, incluidas las archivadas, para la automatización existente.

## `create`

```bash
openclaw workboard create "Corregir el Heartbeat obsoleto del trabajador" --priority high --labels bug,workboard
openclaw workboard create "Escribir la documentación de Workboard" --status ready --agent docs-agent --board docs --notes "Describir la CLI, el comando de barra diagonal, la asignación y el estado de SQLite."
```

| Indicador                    | Propósito                                 |
| ----------------------- | --------------------------------------- |
| `--notes <text>`        | Notas iniciales de la tarjeta                      |
| `--status <status>`     | Estado inicial, valor predeterminado `todo`          |
| `--priority <priority>` | Prioridad, valor predeterminado `normal`              |
| `--agent <id>`          | Asignar la tarjeta a un identificador de agente o propietario |
| `--board <id>`          | Almacenar la tarjeta en el espacio de nombres de un tablero     |
| `--labels <items>`      | Etiquetas separadas por comas                  |
| `--json`                | Imprimir la tarjeta creada como JSON para máquinas  |

`create` escribe directamente en el estado SQLite de Workboard. La tarjeta aparece inmediatamente en la pestaña Workboard de la interfaz de control y en las herramientas de Workboard.

## `show`

```bash
openclaw workboard show 7f4a2c10
openclaw workboard show 7f4a2c10 --json
```

La salida de texto imprime la línea compacta de la tarjeta y sus notas. La salida JSON devuelve el registro completo de la tarjeta, incluidos los metadatos de ejecución, los intentos, los comentarios, los enlaces, las pruebas, los artefactos, los registros del trabajador, el estado del protocolo, los diagnósticos y los metadatos de automatización.

## `move`

```bash
openclaw workboard move 7f4a2c10 --status review
openclaw workboard move 7f4a2c10 --status done --json
```

`move` cambia el estado de la tarjeta mediante la misma ruta de operador manual que se utiliza al arrastrar una tarjeta en el panel. Acepta un identificador de tarjeta completo o un prefijo inequívoco. Las retenciones activas por dependencias y programación siguen aplicándose. Los operadores pueden mover una tarjeta reclamada sin el token de reclamación de su agente; los tokens de reclamación siguen limitados a las modificaciones realizadas mediante herramientas de agente y se ocultan en la salida JSON.

## `dispatch`

```bash
openclaw workboard dispatch
openclaw workboard dispatch --json
openclaw workboard dispatch --max-starts 10
openclaw workboard dispatch --admin
openclaw workboard dispatch --url http://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

`dispatch` llama primero al método RPC `workboard.cards.dispatch` del Gateway en ejecución, que utiliza el mismo entorno de ejecución de subagentes que la acción de asignación del panel, por lo que las tarjetas listas se convierten en ejecuciones de trabajadores con seguimiento de tareas y claves de sesión vinculadas. `--max-starts` utiliza el método aditivo `workboard.cards.dispatchWithOptions` para que un Gateway antiguo rechace la opción antes de iniciar trabajadores; reinicie el Gateway después de actualizarlo y antes de usar el indicador. Las tarjetas con un agente asignado utilizan claves de sesión de subagente limitadas al agente; las tarjetas sin asignar mantienen una clave de subagente sin ámbito para conservar el agente predeterminado configurado en el Gateway.

El bucle de asignación:

1. Promueve los elementos secundarios cuyas dependencias están listas a `ready`.
2. Bloquea las reclamaciones vencidas o las ejecuciones de trabajadores que han agotado el tiempo de espera.
3. Registra los metadatos de asignación en las tarjetas listas.
4. Selecciona un pequeño lote de tarjetas listas sin reclamar.
5. Reclama cada tarjeta seleccionada para el asignador o el agente asignado.
6. Inicia una ejecución de trabajador subagente con un contexto de tarjeta acotado y el token de reclamación de la tarjeta.
7. Almacena en la tarjeta el identificador de la ejecución del trabajador, la clave de sesión, la vinculación de tareas cuando el registro de tareas del Gateway la informa, el estado de ejecución y el registro del trabajador.

La selección es conservadora: de forma predeterminada, una asignación inicia como máximo tres trabajadores, omite las tarjetas archivadas o ya reclamadas e inicia solo una tarjeta por propietario o agente en cada pasada. Las tarjetas que ya pertenecen a trabajos activos en ejecución o revisión se dejan para una asignación posterior. Use `--max-starts <count>` con un entero positivo para cambiar el límite por pasada; la regla de una tarjeta por propietario sigue aplicándose, por lo que el número efectivo de inicios puede ser menor.

Si el inicio del trabajador falla después de reclamar una tarjeta, Workboard bloquea esa tarjeta, elimina la reclamación y registra el fallo en los metadatos de ejecución y del registro del trabajador de la tarjeta, lo que mantiene visibles los inicios fallidos en lugar de devolver silenciosamente la tarjeta a la cola.

Si no se especifica un destino de Gateway y el Gateway local no está disponible o todavía no expone el método de asignación de Workboard, la CLI recurre a una asignación basada solo en datos contra el estado local de Workboard. La asignación basada solo en datos puede seguir promoviendo dependencias, limpiando reclamaciones obsoletas y bloqueando ejecuciones que agoten el tiempo de espera, pero no inicia trabajadores. Los fallos de autenticación, permisos y validación, así como los fallos de un destino `--url` o `--token` explícito, se informan directamente en lugar de activar el mecanismo alternativo.

La salida de texto informa de los inicios de trabajadores:

```text
asignación completada: iniciados=2 fallos=0
```

La salida del mecanismo alternativo es explícita:

```text
Gateway no disponible; solo asignación de datos: promovidos=1 bloqueados=0
```

La salida JSON incluye el resultado de la asignación. La asignación respaldada por el Gateway puede incluir `started` y `startFailures`; el mecanismo alternativo basado solo en datos incluye `gatewayUnavailable: true`. Los tokens de reclamación se ocultan en la salida JSON de las tarjetas.

En el panel, el mismo resultado de asignación se muestra como un breve resumen para que un operador pueda ver cuántas tarjetas se iniciaron, promovieron, bloquearon, recuperaron o fallaron sin abrir los detalles de las tarjetas.

## Equivalencia con los comandos de barra diagonal

Los canales compatibles con comandos pueden utilizar el comando de barra diagonal correspondiente:

```text
/workboard list
/workboard show 7f4a2c10
/workboard create Corregir el Heartbeat obsoleto del trabajador
/workboard move 7f4a2c10 --status review
/workboard dispatch
```

La asignación mediante comandos de barra diagonal también utiliza el entorno de ejecución de subagentes del Gateway, por lo que sigue el mismo comportamiento de reclamación, inicio de trabajadores y fallos que el panel y la ruta del Gateway de la CLI.

`/workboard list` y `/workboard show` son comandos de lectura para remitentes de comandos autorizados. `/workboard create`, `/workboard move` y `/workboard dispatch` modifican el estado del tablero y requieren la condición de propietario en las interfaces de chat o un cliente de Gateway con `operator.write` o `operator.admin`.

## Permisos

La ruta de asignación de la CLI normalmente solicita los ámbitos `operator.write` y `operator.read` del Gateway. Las tarjetas vinculadas a un espacio de trabajo se ejecutan directamente en un espacio de trabajo de agente configurado de forma exacta; una solicitud de árbol de trabajo se limita a ese directorio en lugar de permitir que el host materialice código controlado por el repositorio. El trabajador seleccionado debe disponer de acceso de escritura mediante un entorno aislado de Docker no compartido a ese espacio de trabajo exacto, un hash de contenedor activo que coincida con los montajes y la política solicitados, y ninguna capacidad de escape al host. Use `--admin` para solicitar explícitamente `operator.admin`, permitir otro repositorio de trabajo del host y utilizar la configuración normal de árboles de trabajo administrados; la conexión falla si ese ámbito no está aprobado para el cliente. Un token de Gateway de solo lectura puede inspeccionar los datos de Workboard mediante métodos de lectura, pero no puede crear tarjetas ni asignar trabajadores. Por lo demás, los límites del espacio de trabajo no modifican el movimiento manual de tarjetas para los autores de llamadas con permiso de modificación de Workboard.

Los comandos locales `list`, `create`, `show` y `move` operan en el directorio de estado local de OpenClaw utilizado por el perfil actual. Use `--dev` o `--profile <name>` en el comando de nivel superior `openclaw` cuando necesite una raíz de estado diferente.

## Solución de problemas

### No aparece ninguna tarjeta

Confirme que el Plugin esté activado para el mismo perfil y la misma raíz de estado:

```bash
openclaw plugins inspect workboard --runtime --json
```

Si el panel muestra tarjetas pero la CLI no, compruebe que ambos comandos utilicen la misma configuración de `--dev` o `--profile`.

### La asignación indica que solo se procesan datos

Inicie o reinicie el Gateway:

```bash
openclaw gateway restart
openclaw gateway status --deep
```

A continuación, vuelva a intentar `openclaw workboard dispatch`. El mecanismo alternativo basado solo en datos resulta útil para limpiar el estado local, pero las ejecuciones de trabajadores necesitan un Gateway activo.

### La asignación no inicia nada

Compruebe que haya al menos una tarjeta `ready` sin una reclamación activa:

```bash
openclaw workboard list --status ready
```

Las tarjetas también pueden omitirse cuando el mismo propietario ya tiene trabajo en ejecución o revisión. Mueva el trabajo completado a `done`, libere las reclamaciones obsoletas mediante las herramientas de Workboard o vuelva a ejecutar la asignación después de que termine el trabajador activo.

## Contenido relacionado

- [Plugin Workboard](/es/plugins/workboard)
- [Referencia de la CLI](/es/cli)
- [Comandos de barra diagonal](/es/tools/slash-commands)
- [Interfaz de control](/es/web/control-ui)
