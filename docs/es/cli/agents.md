---
read_when:
    - Se necesitan varios agentes aislados (espacios de trabajo + enrutamiento + autenticación)
summary: Referencia de la CLI para `openclaw agents` (listar/añadir/eliminar/asignaciones/vincular/desvincular/establecer identidad)
title: Agentes
x-i18n:
    generated_at: "2026-07-19T01:53:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c8863b502b018e760a55e5efbac8f7221848fa511b97250c23cd4681c9d71e38
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
- `main` está reservado y no puede usarse como id. del nuevo agente.
- El modo interactivo inicializa la autenticación copiando únicamente credenciales estáticas portátiles (perfiles `api_key` y `token` estáticos), salvo que una credencial desactive la copia mediante `copyToAgents: false`; los perfiles OAuth con token de actualización no se copian, salvo que un proveedor lo habilite mediante `copyToAgents: true`. Si no se realiza la copia, OAuth solo sigue disponible mediante herencia de lectura desde el almacén del agente `main` real. Si el agente predeterminado configurado no es `main`, inicia sesión por separado en los perfiles OAuth del nuevo agente.

### `agents bindings`

Opciones: `--agent <id>`, `--json`.

### `agents bind`

Opciones: `--agent <id>` (el valor predeterminado es el agente predeterminado actual), `--bind <channel[:accountId]>` (repetible), `--json`.

### `agents unbind`

Opciones: `--agent <id>` (el valor predeterminado es el agente predeterminado actual), `--bind <channel[:accountId]>` (repetible), `--all`, `--json`. Acepta `--all` o uno o más valores `--bind`, pero no ambos.

### `agents set-identity`

Opciones: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Consulta [Establecer la identidad](#set-identity) más adelante.

### `agents delete <id>`

Opciones: `--force`, `--json`.

- `main` no se puede eliminar.
- Sin `--force`, se requiere confirmación interactiva (falla en una sesión sin TTY; vuelve a ejecutar el comando con `--force`).
- Los directorios del espacio de trabajo, el estado del agente y las transcripciones de sesión se mueven a la papelera, no se eliminan definitivamente. Si la papelera no está disponible, la eliminación de la configuración del agente se realiza igualmente y se indican las rutas que requieren limpieza manual.
- Cuando el Gateway está accesible, la eliminación se enruta a través del Gateway para que la limpieza de la configuración y del almacén de sesiones utilice el mismo escritor que el tráfico en tiempo de ejecución. Si el Gateway no está accesible, la CLI recurre a la ruta local sin conexión.
- Si el espacio de trabajo de otro agente tiene la misma ruta, está dentro de este espacio de trabajo o contiene este espacio de trabajo, el espacio de trabajo se conserva y `--json` informa de `workspaceRetained`, `workspaceRetainedReason` y `workspaceSharedWith`.

## Enlaces de enrutamiento

Usa enlaces de enrutamiento para asignar el tráfico entrante de un canal a un agente específico.

Si también se necesitan distintas Skills visibles por agente, configura `agents.defaults.skills` y `agents.list[].skills` en `openclaw.json`. Consulta [Configuración de Skills](/es/tools/skills-config) y [Referencia de configuración](/es/gateway/config-agents#agentsdefaultsskills).

Mostrar los enlaces:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Añadir enlaces:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

También se pueden añadir enlaces al crear un agente:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Si se omite `accountId` (`--bind <channel>`), OpenClaw lo resuelve mediante los hooks de configuración del plugin, el enlace forzado de cuentas o el número de cuentas configuradas para el canal.

Si se omite `--agent` para `bind` o `unbind`, OpenClaw selecciona el agente predeterminado actual.

### Formato de `--bind`

| Formato                       | Significado                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Coincide con todas las cuentas del canal.                                                          |
| `--bind <channel>:<account>` | Coincide con una cuenta.                                                                           |
| `--bind <channel>`           | Coincide únicamente con la cuenta predeterminada, salvo que la CLI pueda resolver de forma segura un ámbito de cuenta específico del plugin. |

### Comportamiento del ámbito de los enlaces

- Un enlace almacenado sin `accountId` coincide únicamente con la cuenta predeterminada del canal.
- `accountId: "*"` es la alternativa para todo el canal (todas las cuentas) y es menos específico que un enlace de cuenta explícito.
- Si el mismo agente ya tiene un enlace de canal coincidente sin `accountId` y posteriormente se crea un enlace con un `accountId` explícito o resuelto, OpenClaw actualiza el enlace existente sin crear uno duplicado.

Ejemplos:

```bash
# coincidir con todas las cuentas del canal
openclaw agents bind --agent work --bind telegram:*

# coincidir con una cuenta específica
openclaw agents bind --agent work --bind telegram:ops

# enlace inicial solo al canal
openclaw agents bind --agent work --bind telegram

# actualizar posteriormente a un enlace limitado a una cuenta
openclaw agents bind --agent work --bind telegram:alerts
```

Tras la actualización, el enrutamiento de ese enlace queda limitado a `telegram:alerts`. Si también se desea enrutar la cuenta predeterminada, añádelo explícitamente (por ejemplo, `--bind telegram:default`).

Eliminar enlaces:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Archivos de identidad

Cada espacio de trabajo de agente puede incluir un `IDENTITY.md` en la raíz del espacio de trabajo:

- Ruta de ejemplo: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lee desde la raíz del espacio de trabajo (o desde un `--identity-file` explícito).

Las rutas de los avatares se resuelven con respecto a la raíz del espacio de trabajo y no pueden salir de ella, ni siquiera mediante un enlace simbólico.

## Establecer la identidad

`set-identity` escribe campos en `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (ruta relativa al espacio de trabajo, URL http(s) o URI de datos).

- `--agent` o `--workspace` selecciona el agente de destino. Si `--workspace` coincide con más de un agente, el comando falla y solicita que se pase `--agent`.
- Los archivos de imagen de avatar locales con rutas relativas al espacio de trabajo están limitados a 2 MB. Las URL HTTP(S) y los URI `data:` no se comprueban con respecto al límite de tamaño de los archivos locales.
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
