---
read_when:
    - Quieres varios agentes aislados (espacios de trabajo + enrutamiento + autenticación)
summary: Referencia de CLI para `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agentes
x-i18n:
    generated_at: "2026-06-27T10:56:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7905bc2465c48b5bfee4ce90fdf96dcd92b304a9fb29de93f8f49afdff0e6672
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gestiona agentes aislados (espacios de trabajo + autenticación + enrutamiento).

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

## Enlaces de enrutamiento

Usa enlaces de enrutamiento para fijar el tráfico entrante de un canal a un agente específico.

Si también quieres Skills visibles diferentes por agente, configura `agents.defaults.skills` y `agents.list[].skills` en `openclaw.json`. Consulta [Configuración de Skills](/es/tools/skills-config) y [Referencia de configuración](/es/gateway/config-agents#agents-defaults-skills).

Listar enlaces:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Agregar enlaces:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

También puedes agregar enlaces al crear un agente:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Si omites `accountId` (`--bind <channel>`), OpenClaw lo resuelve a partir de hooks de configuración del Plugin, el enlace de cuenta forzado o el recuento de cuentas configurado del canal.

Si omites `--agent` para `bind` o `unbind`, OpenClaw apunta al agente predeterminado actual.

### Formato de `--bind`

| Formato                     | Significado                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Coincide con todas las cuentas del canal.                                                                        |
| `--bind <channel>:<account>` | Coincide con una cuenta.                                                                                         |
| `--bind <channel>`           | Coincide solo con la cuenta predeterminada, a menos que la CLI pueda resolver de forma segura un alcance de cuenta específico del Plugin. |

### Comportamiento del alcance de enlace

- Un enlace almacenado sin `accountId` coincide solo con la cuenta predeterminada del canal.
- `accountId: "*"` es el respaldo para todo el canal (todas las cuentas) y es menos específico que un enlace de cuenta explícito.
- Si el mismo agente ya tiene un enlace de canal coincidente sin `accountId`, y más adelante enlazas con un `accountId` explícito o resuelto, OpenClaw actualiza ese enlace existente en su lugar en vez de agregar un duplicado.

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

Después de la actualización, el enrutamiento para ese enlace queda limitado a `telegram:alerts`. Si también quieres enrutamiento de la cuenta predeterminada, agrégalo explícitamente (por ejemplo `--bind telegram:default`).

Quitar enlaces:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` acepta `--all` o uno o más valores `--bind`, no ambos.

## Superficie de comandos

### `agents`

Ejecutar `openclaw agents` sin subcomando equivale a `openclaw agents list`.

### `agents list`

Opciones:

- `--json`
- `--bindings`: incluye reglas de enrutamiento completas, no solo recuentos/resúmenes por agente

### `agents add [name]`

Opciones:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (repetible)
- `--non-interactive`
- `--json`

Notas:

- Pasar cualquier marca explícita de agregado cambia el comando a la ruta no interactiva.
- El modo no interactivo requiere tanto un nombre de agente como `--workspace`.
- `main` está reservado y no se puede usar como el nuevo id de agente.
- En modo interactivo, la inicialización de autenticación copia solo perfiles estáticos portables
  (`api_key` y `token` estático de forma predeterminada). Los perfiles OAuth con token de actualización permanecen
  disponibles solo mediante herencia de lectura desde el almacén real del agente `main`.
  Si el agente predeterminado configurado no es `main`, inicia sesión por separado para los
  perfiles OAuth en el nuevo agente.

### `agents bindings`

Opciones:

- `--agent <id>`
- `--json`

### `agents bind`

Opciones:

- `--agent <id>` (usa el agente predeterminado actual de forma predeterminada)
- `--bind <channel[:accountId]>` (repetible)
- `--json`

### `agents unbind`

Opciones:

- `--agent <id>` (usa el agente predeterminado actual de forma predeterminada)
- `--bind <channel[:accountId]>` (repetible)
- `--all`
- `--json`

### `agents delete <id>`

Opciones:

- `--force`
- `--json`

Notas:

- `main` no se puede eliminar.
- Sin `--force`, se requiere confirmación interactiva.
- El espacio de trabajo, el estado del agente y los directorios de transcripciones de sesión se mueven a la Papelera, no se eliminan definitivamente.
- Cuando se puede acceder al Gateway, la eliminación se envía a través del Gateway para que la limpieza de configuración y del almacén de sesiones comparta el mismo escritor que el tráfico de runtime. Si no se puede acceder al Gateway, la CLI recurre a la ruta local sin conexión.
- Si el espacio de trabajo de otro agente es la misma ruta, está dentro de este espacio de trabajo o contiene este espacio de trabajo,
  el espacio de trabajo se conserva y `--json` informa `workspaceRetained`,
  `workspaceRetainedReason` y `workspaceSharedWith`.

## Archivos de identidad

Cada espacio de trabajo de agente puede incluir un `IDENTITY.md` en la raíz del espacio de trabajo:

- Ruta de ejemplo: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lee desde la raíz del espacio de trabajo (o desde un `--identity-file` explícito)

Las rutas de avatar se resuelven en relación con la raíz del espacio de trabajo.

## Establecer identidad

`set-identity` escribe campos en `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (ruta relativa al espacio de trabajo, URL http(s) o URI de datos)

Opciones:

- `--agent <id>`
- `--workspace <dir>`
- `--identity-file <path>`
- `--from-identity`
- `--name <name>`
- `--theme <theme>`
- `--emoji <emoji>`
- `--avatar <value>`
- `--json`

Notas:

- Se puede usar `--agent` o `--workspace` para seleccionar el agente de destino.
- Si dependes de `--workspace` y varios agentes comparten ese espacio de trabajo, el comando falla y te pide pasar `--agent`.
- Los archivos de imagen de avatar locales relativos al espacio de trabajo están limitados a 2 MB. Las URL HTTP(S) y los URI `data:` no se comprueban con el límite de tamaño de archivo local.
- Cuando no se proporcionan campos de identidad explícitos, el comando lee los datos de identidad desde `IDENTITY.md`.

Cargar desde `IDENTITY.md`:

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

Anular campos explícitamente:

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
