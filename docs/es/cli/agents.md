---
read_when:
    - Quieres varios agentes aislados (espacios de trabajo + enrutamiento + autenticación)
summary: Referencia de la CLI para `openclaw agents` (listar/agregar/eliminar/asociaciones/asociar/desasociar/establecer identidad)
title: Agentes
x-i18n:
    generated_at: "2026-07-05T11:06:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89b6c59a9ce0fd0514343cc3fa66ae5e6d963cdfa5c6f58ffe6b9a6b5e943f09
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gestiona agentes aislados (espacios de trabajo + autenticación + enrutamiento). Ejecutar `openclaw agents` sin subcomando equivale a `openclaw agents list`.

Relacionado:

- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Configuración de Skills](/es/tools/skills-config): configuración de visibilidad de Skills.

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

Opciones: `--json`, `--bindings` (incluye reglas de enrutamiento completas, no solo recuentos/resúmenes por agente).

### `agents add [name]`

Opciones: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (repetible), `--non-interactive`, `--json`.

- Pasar cualquier marca explícita de adición cambia el comando a la ruta no interactiva.
- El modo no interactivo requiere tanto un nombre de agente como `--workspace`.
- `main` está reservado y no se puede usar como id del nuevo agente.
- El modo interactivo inicializa la autenticación copiando solo credenciales estáticas portátiles (perfiles `api_key` y `token` estáticos), salvo que una credencial opte por excluirse con `copyToAgents: false`; los perfiles OAuth con token de actualización no se copian salvo que un proveedor opte por incluirlos con `copyToAgents: true`. Sin una copia, OAuth sigue disponible solo mediante herencia de lectura directa desde el almacén real del agente `main`. Si el agente predeterminado configurado no es `main`, inicia sesión por separado para los perfiles OAuth en el nuevo agente.

### `agents bindings`

Opciones: `--agent <id>`, `--json`.

### `agents bind`

Opciones: `--agent <id>` (predeterminado: el agente predeterminado actual), `--bind <channel[:accountId]>` (repetible), `--json`.

### `agents unbind`

Opciones: `--agent <id>` (predeterminado: el agente predeterminado actual), `--bind <channel[:accountId]>` (repetible), `--all`, `--json`. Acepta `--all` o uno o más valores `--bind`, pero no ambos.

### `agents set-identity`

Opciones: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Consulta [Establecer identidad](#set-identity) más abajo.

### `agents delete <id>`

Opciones: `--force`, `--json`.

- `main` no se puede eliminar.
- Sin `--force`, se requiere confirmación interactiva (falla en una sesión que no sea TTY; vuelve a ejecutar con `--force`).
- El espacio de trabajo, el estado del agente y los directorios de transcripciones de sesión se mueven a la papelera, no se eliminan permanentemente.
- Cuando el Gateway está accesible, la eliminación se enruta a través del Gateway para que la limpieza de la configuración y del almacén de sesiones comparta el mismo escritor que el tráfico de runtime. Si el Gateway no está accesible, la CLI recurre a la ruta local sin conexión.
- Si el espacio de trabajo de otro agente es la misma ruta, está dentro de este espacio de trabajo o contiene este espacio de trabajo, el espacio de trabajo se conserva, y `--json` informa `workspaceRetained`, `workspaceRetainedReason` y `workspaceSharedWith`.

## Enlaces de enrutamiento

Usa enlaces de enrutamiento para fijar el tráfico entrante de canales a un agente específico.

Si también quieres Skills visibles distintos por agente, configura `agents.defaults.skills` y `agents.list[].skills` en `openclaw.json`. Consulta [Configuración de Skills](/es/tools/skills-config) y [Referencia de configuración](/es/gateway/config-agents#agentsdefaultsskills).

Listar enlaces:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Añadir enlaces:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

También puedes añadir enlaces al crear un agente:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Si omites `accountId` (`--bind <channel>`), OpenClaw lo resuelve desde los hooks de configuración del plugin, el enlace forzado de cuenta o el recuento de cuentas configurado del canal.

Si omites `--agent` para `bind` o `unbind`, OpenClaw usa como destino el agente predeterminado actual.

### Formato de `--bind`

| Formato                     | Significado                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `--bind <channel>:*`         | Coincide con todas las cuentas del canal.                                                                    |
| `--bind <channel>:<account>` | Coincide con una cuenta.                                                                                     |
| `--bind <channel>`           | Coincide solo con la cuenta predeterminada, salvo que la CLI pueda resolver de forma segura un ámbito de cuenta específico del plugin. |

### Comportamiento del ámbito de enlace

- Un enlace almacenado sin `accountId` coincide solo con la cuenta predeterminada del canal.
- `accountId: "*"` es la alternativa para todo el canal (todas las cuentas) y es menos específica que un enlace de cuenta explícito.
- Si el mismo agente ya tiene un enlace de canal coincidente sin `accountId`, y más tarde enlazas con un `accountId` explícito o resuelto, OpenClaw actualiza ese enlace existente en el mismo lugar en vez de añadir un duplicado.

Ejemplos:

```bash
# match all accounts on the channel
openclaw agents bind --agent work --bind telegram:*

# match a specific account
openclaw agents bind --agent work --bind telegram:ops

# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:alerts
```

Después de la actualización, el enrutamiento de ese enlace queda limitado a `telegram:alerts`. Si también quieres enrutamiento para la cuenta predeterminada, añádelo explícitamente (por ejemplo, `--bind telegram:default`).

Eliminar enlaces:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

## Archivos de identidad

Cada espacio de trabajo de agente puede incluir un `IDENTITY.md` en la raíz del espacio de trabajo:

- Ruta de ejemplo: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lee desde la raíz del espacio de trabajo (o un `--identity-file` explícito).

Las rutas de avatar se resuelven en relación con la raíz del espacio de trabajo y no pueden salir de ella, ni siquiera mediante un enlace simbólico.

## Establecer identidad

`set-identity` escribe campos en `agents.list[].identity`: `name`, `theme`, `emoji`, `avatar` (ruta relativa al espacio de trabajo, URL http(s) o URI de datos).

- `--agent` o `--workspace` selecciona el agente de destino. Si `--workspace` coincide con más de un agente, el comando falla y te pide que pases `--agent`.
- Los archivos de imagen de avatar locales relativos al espacio de trabajo están limitados a 2 MB. Las URL HTTP(S) y los URI `data:` no se comprueban contra el límite de tamaño de archivo local.
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

- [Referencia de CLI](/es/cli)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
