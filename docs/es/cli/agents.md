---
read_when:
    - Quieres varios agentes aislados (espacios de trabajo + enrutamiento + autenticación)
summary: Referencia de la CLI para `openclaw agents` (`list`/`add`/`delete`/`bindings`/`bind`/`unbind`/`set identity`)
title: Agentes
x-i18n:
    generated_at: "2026-04-24T05:21:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04d0ce4f3fb3d0c0ba8ffb3676674cda7d9a60441a012bc94ff24a17105632f1
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Gestiona agentes aislados (espacios de trabajo + autenticación + enrutamiento).

Relacionado:

- Enrutamiento multiagente: [Enrutamiento multiagente](/es/concepts/multi-agent)
- Espacio de trabajo del agente: [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- Configuración de visibilidad de Skills: [Configuración de Skills](/es/tools/skills-config)

## Ejemplos

```bash
openclaw agents list
openclaw agents list --bindings
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Vinculaciones de enrutamiento

Usa vinculaciones de enrutamiento para fijar el tráfico entrante del canal a un agente específico.

Si también quieres diferentes Skills visibles por agente, configura
`agents.defaults.skills` y `agents.list[].skills` en `openclaw.json`. Consulta
[Configuración de Skills](/es/tools/skills-config) y
[Referencia de configuración](/es/gateway/config-agents#agents-defaults-skills).

Listar vinculaciones:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Añadir vinculaciones:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Si omites `accountId` (`--bind <channel>`), OpenClaw lo resuelve a partir de los valores predeterminados del canal y los hooks de configuración del Plugin cuando están disponibles.

Si omites `--agent` para `bind` o `unbind`, OpenClaw usa como destino el agente predeterminado actual.

### Comportamiento del alcance de las vinculaciones

- Una vinculación sin `accountId` coincide solo con la cuenta predeterminada del canal.
- `accountId: "*"` es el respaldo a nivel de canal (todas las cuentas) y es menos específico que una vinculación explícita a una cuenta.
- Si el mismo agente ya tiene una vinculación de canal coincidente sin `accountId`, y luego haces una vinculación con un `accountId` explícito o resuelto, OpenClaw actualiza esa vinculación existente en su lugar en vez de añadir un duplicado.

Ejemplo:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Después de la actualización, el enrutamiento de esa vinculación queda limitado a `telegram:ops`. Si también quieres el enrutamiento de la cuenta predeterminada, añádelo explícitamente (por ejemplo, `--bind telegram:default`).

Eliminar vinculaciones:

```bash
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents unbind --agent work --all
```

`unbind` acepta `--all` o uno o más valores `--bind`, pero no ambos.

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

- Pasar cualquier opción explícita de add cambia el comando al modo no interactivo.
- El modo no interactivo requiere tanto un nombre de agente como `--workspace`.
- `main` está reservado y no puede usarse como el nuevo id del agente.

### `agents bindings`

Opciones:

- `--agent <id>`
- `--json`

### `agents bind`

Opciones:

- `--agent <id>` (de forma predeterminada, el agente predeterminado actual)
- `--bind <channel[:accountId]>` (repetible)
- `--json`

### `agents unbind`

Opciones:

- `--agent <id>` (de forma predeterminada, el agente predeterminado actual)
- `--bind <channel[:accountId]>` (repetible)
- `--all`
- `--json`

### `agents delete <id>`

Opciones:

- `--force`
- `--json`

Notas:

- `main` no puede eliminarse.
- Sin `--force`, se requiere confirmación interactiva.
- Los directorios del espacio de trabajo, el estado del agente y la transcripción de la sesión se mueven a la Papelera, no se eliminan de forma permanente.

## Archivos de identidad

Cada espacio de trabajo del agente puede incluir un `IDENTITY.md` en la raíz del espacio de trabajo:

- Ruta de ejemplo: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lee desde la raíz del espacio de trabajo (o desde un `--identity-file` explícito)

Las rutas del avatar se resuelven en relación con la raíz del espacio de trabajo.

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

- `--agent` o `--workspace` pueden usarse para seleccionar el agente de destino.
- Si dependes de `--workspace` y varios agentes comparten ese espacio de trabajo, el comando falla y te pide que pases `--agent`.
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
