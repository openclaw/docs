---
read_when:
    - Quieres varios agentes aislados (espacios de trabajo + enrutamiento + autenticación)
summary: Referencia de CLI para `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: agentes
x-i18n:
    generated_at: "2026-04-23T14:00:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: f328d9f4ce636ce27defdcbcc48b1ca041bc25d0888c3e4df0dd79840f44ca8f
    source_path: cli/agents.md
    workflow: 15
---

# `openclaw agents`

Gestiona agentes aislados (espacios de trabajo + autenticación + enrutamiento).

Relacionado:

- Enrutamiento de varios agentes: [Enrutamiento de varios agentes](/es/concepts/multi-agent)
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

## Enlaces de enrutamiento

Usa enlaces de enrutamiento para fijar el tráfico entrante del canal a un agente específico.

Si además quieres diferentes Skills visibles por agente, configura
`agents.defaults.skills` y `agents.list[].skills` en `openclaw.json`. Consulta
[Configuración de Skills](/es/tools/skills-config) y
[Referencia de configuración](/es/gateway/configuration-reference#agents-defaults-skills).

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

Si omites `accountId` (`--bind <channel>`), OpenClaw lo resuelve a partir de los valores predeterminados del canal y los hooks de configuración del Plugin cuando están disponibles.

Si omites `--agent` para `bind` o `unbind`, OpenClaw usa el agente predeterminado actual.

### Comportamiento del ámbito del enlace

- Un enlace sin `accountId` coincide solo con la cuenta predeterminada del canal.
- `accountId: "*"` es el respaldo para todo el canal (todas las cuentas) y es menos específico que un enlace de cuenta explícito.
- Si el mismo agente ya tiene un enlace de canal coincidente sin `accountId`, y más tarde enlazas con un `accountId` explícito o resuelto, OpenClaw actualiza ese enlace existente in situ en lugar de añadir un duplicado.

Ejemplo:

```bash
# enlace inicial solo de canal
openclaw agents bind --agent work --bind telegram

# más tarde, actualización a enlace con ámbito de cuenta
openclaw agents bind --agent work --bind telegram:ops
```

Después de la actualización, el enrutamiento para ese enlace queda limitado a `telegram:ops`. Si además quieres el enrutamiento de la cuenta predeterminada, añádelo explícitamente (por ejemplo, `--bind telegram:default`).

Eliminar enlaces:

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
- `--bindings`: incluye reglas completas de enrutamiento, no solo recuentos/resúmenes por agente

### `agents add [name]`

Opciones:

- `--workspace <dir>`
- `--model <id>`
- `--agent-dir <dir>`
- `--bind <channel[:accountId]>` (repetible)
- `--non-interactive`
- `--json`

Notas:

- Pasar cualquier indicador explícito de add cambia el comando a la ruta no interactiva.
- El modo no interactivo requiere tanto un nombre de agente como `--workspace`.
- `main` está reservado y no puede usarse como nuevo id de agente.

### `agents bindings`

Opciones:

- `--agent <id>`
- `--json`

### `agents bind`

Opciones:

- `--agent <id>` (usa por defecto el agente predeterminado actual)
- `--bind <channel[:accountId]>` (repetible)
- `--json`

### `agents unbind`

Opciones:

- `--agent <id>` (usa por defecto el agente predeterminado actual)
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
- Los directorios del espacio de trabajo, el estado del agente y las transcripciones de sesión se mueven a la Papelera, no se eliminan de forma definitiva.

## Archivos de identidad

Cada espacio de trabajo de agente puede incluir un `IDENTITY.md` en la raíz del espacio de trabajo:

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

- Se puede usar `--agent` o `--workspace` para seleccionar el agente de destino.
- Si dependes de `--workspace` y varios agentes comparten ese espacio de trabajo, el comando falla y te pide que pases `--agent`.
- Cuando no se proporcionan campos de identidad explícitos, el comando lee los datos de identidad desde `IDENTITY.md`.

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
          theme: "langosta espacial",
          emoji: "🦞",
          avatar: "avatars/openclaw.png",
        },
      },
    ],
  },
}
```
