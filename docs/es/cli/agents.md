---
read_when:
    - Quieres varios agentes aislados (espacios de trabajo + enrutamiento + autenticación)
summary: Referencia de la CLI para `openclaw agents` (listar/añadir/eliminar/asignaciones/asignar/desasignar/establecer identidad)
title: Agentes
x-i18n:
    generated_at: "2026-07-11T22:57:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gestiona agentes aislados (espacios de trabajo + autenticación + enrutamiento). Ejecutar `openclaw agents` sin ningún subcomando equivale a `openclaw agents list`.

Relacionado:

- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Configuración de Skills](/es/tools/skills-config): configuración de la visibilidad de Skills.

## Ejemplos

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:*
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Superficie de comandos

### `agents list`

Opciones: `--json`, `--bindings` (incluye las reglas de enrutamiento completas, no solo los recuentos o resúmenes por agente).

### `agents add [name]`

Opciones: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (repetible), `--non-interactive`, `--json`.

- Pasar cualquier indicador explícito de adición cambia el comando a la ruta no interactiva.
- El modo no interactivo requiere tanto un nombre de agente como `--workspace`.
- `main` está reservado y no se puede usar como id del nuevo agente.
- El modo interactivo inicializa la autenticación copiando únicamente credenciales estáticas portátiles (perfiles `api_key` y `token` estáticos), salvo que una credencial lo impida mediante `copyToAgents: false`; los perfiles OAuth con token de actualización no se copian, salvo que un proveedor lo permita mediante `copyToAgents: true`. Sin una copia, OAuth solo permanece disponible mediante herencia de lectura desde el almacén del agente `main` real. Si el agente predeterminado configurado no es `main`, inicia sesión por separado para los perfiles OAuth en el agente nuevo.

### `agents bindings`

Opciones: `--agent <id>`, `--json`.

### `agents bind`

Opciones: `--agent <id>` (el valor predeterminado es el agente predeterminado actual), `--bind <channel[:accountId]>` (repetible), `--json`.

### `agents unbind`

Opciones: `--agent <id>` (el valor predeterminado es el agente predeterminado actual), `--bind <channel[:accountId]>` (repetible), `--all`, `--json`. Acepta `--all` o uno o varios valores `--bind`, pero no ambos.

### `agents set-identity`

Opciones: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Consulta [Establecer la identidad](#set-identity) más adelante.

### `agents delete <id>`

Opciones: `--force`, `--json`.

- `main` no se puede eliminar.
- Sin `--force`, se requiere confirmación interactiva (falla en una sesión sin TTY; vuelve a ejecutar el comando con `--force`).
- El espacio de trabajo, el estado del agente y los directorios de transcripciones de sesiones se mueven a la papelera, no se eliminan de forma permanente.
- Cuando el Gateway está disponible, la eliminación se enruta a través del Gateway para que la limpieza de la configuración y del almacén de sesiones utilice el mismo proceso de escritura que el tráfico en tiempo de ejecución. Si el Gateway no está disponible, la CLI recurre a la ruta local sin conexión.
- Si el espacio de trabajo de otro agente tiene la misma ruta, se encuentra dentro de este espacio de trabajo o contiene este espacio de trabajo, el espacio de trabajo se conserva y `--json` informa de `workspaceRetained`, `workspaceRetainedReason` y `workspaceSharedWith`.

## Vinculaciones de enrutamiento

Usa vinculaciones de enrutamiento para asignar el tráfico entrante de un canal a un agente específico.

Si también quieres que cada agente tenga diferentes Skills visibles, configura `agents.defaults.skills` y `agents.list[].skills` en `openclaw.json`. Consulta [Configuración de Skills](/es/tools/skills-config) y [Referencia de configuración](/es/gateway/config-agents#agentsdefaultsskills).

Enumerar vinculaciones:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Añadir vinculaciones:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

También puedes añadir vinculaciones al crear un agente:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Si omites `accountId` (`--bind <channel>`), OpenClaw lo determina mediante los hooks de configuración del Plugin, la vinculación forzada de cuentas o el número de cuentas configuradas del canal.

Si omites `--agent` en `bind` o `unbind`, OpenClaw selecciona el agente predeterminado actual.

### Formato de `--bind`

| Formato                      | Significado                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Coincide con todas las cuentas del canal.                                                                                         |
| `--bind <channel>:<account>` | Coincide con una cuenta.                                                                                                          |
| `--bind <channel>`           | Coincide únicamente con la cuenta predeterminada, salvo que la CLI pueda determinar de forma segura un ámbito de cuenta específico del Plugin. |

### Comportamiento del ámbito de las vinculaciones

- Una vinculación almacenada sin `accountId` coincide únicamente con la cuenta predeterminada del canal.
- `accountId: "*"` es la alternativa para todo el canal (todas las cuentas) y es menos específica que una vinculación explícita de cuenta.
- Si el mismo agente ya tiene una vinculación de canal coincidente sin `accountId` y posteriormente realizas una vinculación con un `accountId` explícito o determinado, OpenClaw actualiza esa vinculación existente directamente en lugar de añadir un duplicado.

Ejemplos:

```bash
# coincidir con todas las cuentas del canal
openclaw agents bind --agent work --bind telegram:*

# coincidir con una cuenta específica
openclaw agents bind --agent work --bind telegram:ops

# vinculación inicial solo al canal
openclaw agents bind --agent work --bind telegram

# actualización posterior a una vinculación con ámbito de cuenta
openclaw agents bind --agent work --bind telegram:alerts
```

Después de la actualización, el enrutamiento de esa vinculación queda limitado a `telegram:alerts`. Si también quieres enrutamiento para la cuenta predeterminada, añádelo explícitamente (por ejemplo, `--bind telegram:default`).

Eliminar vinculaciones:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Archivos de identidad

Cada espacio de trabajo de agente puede incluir un archivo `IDENTITY.md` en la raíz del espacio de trabajo:

- Ruta de ejemplo: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lee desde la raíz del espacio de trabajo (o desde un archivo indicado explícitamente mediante `--identity-file`).

Las rutas de los avatares se resuelven con respecto a la raíz del espacio de trabajo y no pueden salir de ella, ni siquiera mediante un enlace simbólico.

## Establecer la identidad

`set-identity` escribe campos en `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (ruta relativa al espacio de trabajo, URL http(s) o URI de datos).

- `--agent` o `--workspace` selecciona el agente de destino. Si `--workspace` coincide con más de un agente, el comando falla y solicita que pases `--agent`.
- Los archivos locales de imagen de avatar con rutas relativas al espacio de trabajo están limitados a 2 MB. Las URL HTTP(S) y los URI `data:` no se comprueban respecto al límite de tamaño de los archivos locales.
- Cuando no se proporcionan campos de identidad explícitos, el comando lee los datos de identidad de `IDENTITY.md`.

Cargar desde `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Sobrescribir campos explícitamente:

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

Ejemplo de configuración:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
