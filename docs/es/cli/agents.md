---
read_when:
    - Se necesitan varios agentes aislados (espacios de trabajo + enrutamiento + autenticación)
summary: Referencia de la CLI para `openclaw agents` (listar/añadir/eliminar/vinculaciones/vincular/desvincular/establecer identidad)
title: Agentes
x-i18n:
    generated_at: "2026-07-22T10:26:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 76a2e50462f6a52760dcb639405ed5f23857f2fa429469281e3acfa1eb61e974
    source_path: cli/agents.md
    workflow: 16
---

# `openclaw agents`

Gestiona agentes aislados (espacios de trabajo + autenticación + enrutamiento). Ejecutar `openclaw agents` sin subcomando equivale a `openclaw agents list`.

Relacionado:

- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Configuración de Skills](/es/tools/skills-config): configuración de la visibilidad de las Skills.

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

- Pasar cualquier indicador de adición explícito cambia el comando a la ruta no interactiva.
- El modo no interactivo requiere tanto un nombre de agente como `--workspace`.
- `main` está reservado y no se puede usar como id del nuevo agente.
- El modo interactivo inicializa la autenticación copiando únicamente credenciales estáticas portátiles (perfiles `api_key` y perfiles `token` estáticos), salvo que una credencial opte por no participar mediante `copyToAgents: false`; los perfiles OAuth con token de actualización no se copian, salvo que un proveedor opte por participar mediante `copyToAgents: true`. Si no hay copia, OAuth permanece disponible únicamente mediante herencia de lectura del almacén real del agente `main`. Si el agente predeterminado configurado no es `main`, inicia sesión por separado en los perfiles OAuth del nuevo agente.

### `agents bindings`

Opciones: `--agent <id>`, `--json`.

### `agents bind`

Opciones: `--agent <id>` (de forma predeterminada, el agente predeterminado actual), `--bind <channel[:accountId]>` (repetible), `--json`.

### `agents unbind`

Opciones: `--agent <id>` (de forma predeterminada, el agente predeterminado actual), `--bind <channel[:accountId]>` (repetible), `--all`, `--json`. Acepta `--all` o uno o más valores `--bind`, pero no ambos.

### `agents set-identity`

Opciones: `--agent <id>`, `--workspace <dir>`, `--identity-file <path>`, `--from-identity`, `--name <name>`, `--theme <theme>`, `--emoji <emoji>`, `--avatar <value>`, `--json`. Consulta [Establecer la identidad](#set-identity) más adelante.

### `agents delete <id>`

Opciones: `--force`, `--json`.

- `main` no se puede eliminar.
- Sin `--force`, se requiere confirmación interactiva (falla en una sesión sin TTY; vuelve a ejecutar con `--force`).
- Los directorios del espacio de trabajo, del estado del agente y de las transcripciones de sesión se mueven a la Papelera, no se eliminan definitivamente. Si la Papelera no está disponible, la eliminación de la configuración del agente se realiza de todos modos y se indican las rutas que requieren una limpieza manual.
- Cuando el Gateway está accesible, la eliminación se enruta a través del Gateway para que la limpieza de la configuración y del almacén de sesiones utilice el mismo escritor que el tráfico en tiempo de ejecución. Si el Gateway no está accesible, la CLI recurre a la ruta local sin conexión.
- Si el espacio de trabajo de otro agente es la misma ruta, está dentro de este espacio de trabajo o contiene este espacio de trabajo, el espacio de trabajo se conserva, y `--json` informa de `workspaceRetained`, `workspaceRetainedReason` y `workspaceSharedWith`.

## Vinculaciones de enrutamiento

Usa vinculaciones de enrutamiento para fijar el tráfico entrante de un canal a un agente específico.

Si también se necesitan Skills visibles distintas para cada agente, configura `agents.defaults.skills` y `agents.entries.*.skills` en `openclaw.json`. Consulta [Configuración de Skills](/es/tools/skills-config) y [Referencia de configuración](/es/gateway/config-agents#agentsdefaultsskills).

Enumerar las vinculaciones:

```bash
openclaw agents bindings
openclaw agents bindings --agent work
openclaw agents bindings --json
```

Añadir vinculaciones:

```bash
openclaw agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

También se pueden añadir vinculaciones al crear un agente:

```bash
openclaw agents add work --workspace ~/.openclaw/workspace-work --bind telegram:* --bind discord:*
```

Si se omite `accountId` (`--bind <channel>`), OpenClaw lo resuelve a partir de los enlaces de configuración del plugin, de una vinculación forzada de cuenta o del número de cuentas configuradas del canal.

Si se omite `--agent` para `bind` o `unbind`, OpenClaw utiliza como destino el agente predeterminado actual.

### Formato de `--bind`

| Formato                       | Significado                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| `--bind <channel>:*`         | Coincide con todas las cuentas del canal.                                                          |
| `--bind <channel>:<account>` | Coincide con una cuenta.                                                                           |
| `--bind <channel>`           | Coincide solo con la cuenta predeterminada, salvo que la CLI pueda resolver de forma segura un ámbito de cuenta específico del plugin. |

### Comportamiento del ámbito de las vinculaciones

- Una vinculación almacenada sin `accountId` coincide únicamente con la cuenta predeterminada del canal.
- `accountId: "*"` es la alternativa para todo el canal (todas las cuentas) y es menos específica que una vinculación explícita de cuenta.
- Si el mismo agente ya tiene una vinculación de canal coincidente sin `accountId` y posteriormente se vincula con un `accountId` explícito o resuelto, OpenClaw actualiza esa vinculación existente en el mismo lugar en vez de añadir un duplicado.

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

Después de la actualización, el enrutamiento de esa vinculación queda limitado a `telegram:alerts`. Si también se desea el enrutamiento de la cuenta predeterminada, añádelo explícitamente (por ejemplo, `--bind telegram:default`).

Eliminar vinculaciones:

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

`set-identity` escribe campos en `agents.entries.*.identity`: `name`, `theme`, `emoji`, `avatar` (ruta relativa al espacio de trabajo, URL http(s) o URI de datos).

- `--agent` o `--workspace` selecciona el agente de destino. Si `--workspace` coincide con más de un agente, el comando falla y solicita que se pase `--agent`.
- Los archivos de imagen de avatar locales con rutas relativas al espacio de trabajo tienen un límite de 2 MB. Las URL HTTP(S) y los URI `data:` no se comprueban respecto al límite de tamaño de archivo local.
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
