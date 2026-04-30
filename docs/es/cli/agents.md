---
read_when:
    - Quieres varios agentes aislados (espacios de trabajo + enrutamiento + autenticación)
summary: Referencia de CLI para `openclaw agents` (list/add/delete/bindings/bind/unbind/set identity)
title: Agentes
x-i18n:
    generated_at: "2026-04-30T05:32:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 46742a890a57cb1035a053f14fe574044e4a3d7dcc04812cd11c633bd808819b
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
openclaw agents add ops --workspace ~/.openclaw/workspace-ops --bind telegram:ops --non-interactive
openclaw agents bindings
openclaw agents bind --agent work --bind telegram:ops
openclaw agents unbind --agent work --bind telegram:ops
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## Vinculaciones de enrutamiento

Usa vinculaciones de enrutamiento para fijar el tráfico entrante de canales a un agente específico.

Si también quieres distintas Skills visibles por agente, configura `agents.defaults.skills` y `agents.list[].skills` en `openclaw.json`. Consulta [Configuración de Skills](/es/tools/skills-config) y [Referencia de configuración](/es/gateway/config-agents#agents-defaults-skills).

Lista vinculaciones:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Añade vinculaciones:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

Si omites `accountId` (`--bind <channel>`), OpenClaw lo resuelve a partir de los valores predeterminados del canal y los hooks de configuración del Plugin cuando están disponibles.

Si omites `--agent` para `bind` o `unbind`, OpenClaw usa como destino el agente predeterminado actual.

### Comportamiento del alcance de las vinculaciones

- Una vinculación sin `accountId` solo coincide con la cuenta predeterminada del canal.
- `accountId: "*"` es la alternativa de canal completo (todas las cuentas) y es menos específica que una vinculación de cuenta explícita.
- Si el mismo agente ya tiene una vinculación de canal coincidente sin `accountId`, y luego vinculas con un `accountId` explícito o resuelto, OpenClaw actualiza esa vinculación existente en el lugar en vez de añadir un duplicado.

Ejemplo:

```bash
# initial channel-only binding
openclaw agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
openclaw agents bind --agent work --bind telegram:ops
```

Después de la actualización, el enrutamiento de esa vinculación queda limitado a `telegram:ops`. Si también quieres enrutamiento para la cuenta predeterminada, añádelo explícitamente (por ejemplo `--bind telegram:default`).

Elimina vinculaciones:

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

- Pasar cualquier flag de adición explícito cambia el comando a la ruta no interactiva.
- El modo no interactivo requiere un nombre de agente y `--workspace`.
- `main` está reservado y no se puede usar como el nuevo id de agente.
- En modo interactivo, la inicialización de autenticación copia solo perfiles estáticos portátiles
  (`api_key` y `token` estático de forma predeterminada). Los perfiles OAuth con token de actualización siguen
  disponibles solo mediante herencia de lectura desde el almacén real del agente `main`.
  Si el agente predeterminado configurado no es `main`, inicia sesión por separado para los perfiles OAuth
  en el nuevo agente.

### `agents bindings`

Opciones:

- `--agent <id>`
- `--json`

### `agents bind`

Opciones:

- `--agent <id>` (usa de forma predeterminada el agente predeterminado actual)
- `--bind <channel[:accountId]>` (repetible)
- `--json`

### `agents unbind`

Opciones:

- `--agent <id>` (usa de forma predeterminada el agente predeterminado actual)
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
- Los directorios del espacio de trabajo, el estado del agente y las transcripciones de sesión se mueven a la papelera, no se eliminan definitivamente.
- Si el espacio de trabajo de otro agente es la misma ruta, está dentro de este espacio de trabajo o contiene este espacio de trabajo,
  el espacio de trabajo se conserva y `--json` informa `workspaceRetained`,
  `workspaceRetainedReason` y `workspaceSharedWith`.

## Archivos de identidad

Cada espacio de trabajo de agente puede incluir un `IDENTITY.md` en la raíz del espacio de trabajo:

- Ruta de ejemplo: `~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` lee desde la raíz del espacio de trabajo (o un `--identity-file` explícito)

Las rutas de avatar se resuelven en relación con la raíz del espacio de trabajo.

## Definir identidad

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

- `--agent` o `--workspace` se pueden usar para seleccionar el agente de destino.
- Si dependes de `--workspace` y varios agentes comparten ese espacio de trabajo, el comando falla y te pide pasar `--agent`.
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
