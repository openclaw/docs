---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por qué se bloquea una herramienta: entorno de ejecución del sandbox, política de permisos y denegaciones de herramientas, y controles de ejecución con privilegios elevados'
title: Sandbox frente a política de herramientas frente a privilegios elevados
x-i18n:
    generated_at: "2026-07-19T01:54:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 572157b184c48f0ac7f97d3151726f8975b16306261c7209c39c2fdd344efef9
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw tiene tres controles relacionados pero diferentes:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dónde se ejecutan las herramientas** (backend del Sandbox frente al host).
2. **Política de herramientas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **qué herramientas están disponibles/permitidas**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) es una **vía de escape exclusiva para exec** que permite ejecutar fuera del Sandbox cuando se está en un entorno aislado (`gateway` de forma predeterminada, o `node` cuando el destino de exec está configurado como `node`).

## Depuración rápida

Use el inspector para ver qué está haciendo OpenClaw _realmente_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Muestra:

- modo, ámbito y acceso al espacio de trabajo efectivos del Sandbox
- si la sesión se encuentra actualmente en un entorno aislado (principal frente a no principal)
- permisos y denegaciones efectivos de herramientas del Sandbox (y si proceden del agente, de la configuración global o de la predeterminada)
- controles de Elevated y rutas de claves para corregirlos

## Sandbox: dónde se ejecutan las herramientas

El aislamiento se controla mediante `agents.defaults.sandbox.mode`:

- `"off"`: todo se ejecuta en el host.
- `"non-main"`: solo las sesiones no principales se ejecutan en un entorno aislado (una «sorpresa» habitual en grupos/canales).
- `"all"`: todo se ejecuta en un entorno aislado.

`agents.defaults.sandbox.workspaceAccess` controla qué puede ver el Sandbox: `"none"`, `"ro"` o `"rw"`.

Consulte [Aislamiento](/es/gateway/sandboxing) para ver la matriz completa (ámbito, montajes del espacio de trabajo e imágenes).

### Montajes bind (comprobación rápida de seguridad)

- `docker.binds` _atraviesa_ el sistema de archivos del Sandbox: todo lo que se monte será visible dentro del contenedor con el modo establecido (`:ro` o `:rw`).
- Si se omite el modo, el valor predeterminado es lectura y escritura; se recomienda `:ro` para código fuente y secretos.
- `scope: "shared"` ignora los montajes bind por agente (solo se aplican los globales).
- OpenClaw valida dos veces los orígenes de los montajes bind: primero en la ruta de origen normalizada y, después, de nuevo tras resolverla mediante el ancestro existente más profundo. Los escapes mediante un padre que sea un enlace simbólico no eluden las comprobaciones de rutas bloqueadas ni de raíces permitidas.
- Las rutas de hoja inexistentes también se comprueban de forma segura. Si `/workspace/alias-out/new-file` se resuelve mediante un padre que sea un enlace simbólico hacia una ruta bloqueada o fuera de las raíces permitidas configuradas, se rechaza el montaje bind.
- Montar `/var/run/docker.sock` concede de hecho al Sandbox el control del host; hágalo únicamente de forma intencionada.
- El acceso al espacio de trabajo (`workspaceAccess`) es independiente de los modos de los montajes bind.

Para consultar una configuración por agente con varias carpetas del host, modos de acceso y la aceptación explícita de seguridad para fuentes externas, consulte [Varias carpetas para un agente](/es/gateway/sandboxing#multiple-folders-for-one-agent).

## Política de herramientas: qué herramientas existen o pueden invocarse

Hay dos capas relevantes:

- **Perfil de herramientas**: `tools.profile` y `agents.list[].tools.profile` (lista de permitidos base)
- **Perfil de herramientas del proveedor**: `tools.byProvider[provider].profile` y `agents.list[].tools.byProvider[provider].profile`
- **Política de herramientas global/por agente**: `tools.allow`/`tools.deny` y `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de herramientas del proveedor**: `tools.byProvider[provider].allow/deny` y `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de herramientas del Sandbox** (solo se aplica cuando se ejecuta en un entorno aislado): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` y `agents.list[].tools.sandbox.tools.*`

Reglas generales:

- `deny` siempre prevalece.
- Si `allow` no está vacío, todo lo demás se considera bloqueado.
- La política de herramientas es el límite definitivo: `/exec` no puede anular la denegación de una herramienta `exec`.
- La política de herramientas filtra la disponibilidad de las herramientas por nombre; no inspecciona los efectos secundarios dentro de `exec`. Si `exec` está permitido, denegar `write`, `edit` o `apply_patch` no convierte los comandos de shell en operaciones de solo lectura.
- `/exec` solo cambia los valores predeterminados de la sesión para remitentes autorizados; no concede acceso a herramientas.
- Las claves de herramientas del proveedor aceptan tanto `provider` (por ejemplo, `google-antigravity`) como `provider/model` (por ejemplo, `openai/gpt-5.4`).
- Los registros del Gateway incluyen entradas de auditoría `agents/tool-policy` cuando un paso de la política de herramientas elimina herramientas o cuando una política de herramientas del Sandbox bloquea una llamada. Use `openclaw logs` para ver la etiqueta de la regla, la clave de configuración y los nombres de las herramientas afectadas.

### Grupos de herramientas (abreviaturas)

Las políticas de herramientas (globales, del agente y del Sandbox) admiten entradas `group:*` que se expanden a varias herramientas:

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"],
      },
    },
  },
}
```

Grupos disponibles:

| Grupo              | Herramientas                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` se acepta como alias de `exec`)                                                                                                                                                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                                                                                 |
| `group:sessions`   | `sessions`, `sessions_list`, `sessions_history`, `sessions_search`, `conversations_list`, `conversations_send`, `conversations_turn`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`, `spawn_task`, `dismiss_task` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                                                                  |
| `group:ui`         | `browser`, `screen`, `terminal`, `canvas`, `show_widget`                                                                                                                                                                                               |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                                                                                 |
| `group:messaging`  | `message`                                                                                                                                                                                                                                              |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                                                                    |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `ask_user`, `skill_workshop`                                                                                                                                                   |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                                                                   |
| `group:openclaw`   | la mayoría de las herramientas integradas de OpenClaw (excluye las primitivas de sistema de archivos y entorno de ejecución `read`/`write`/`edit`/`apply_patch`/`exec`/`process`, `canvas` y los plugins de proveedores)                                                                                             |
| `group:plugins`    | todas las herramientas cargadas que pertenecen a plugins, incluidos los servidores MCP configurados expuestos mediante `bundle-mcp`                                                                                                                                                           |

Para los agentes de solo lectura, deniegue `group:runtime`, además de las herramientas que modifican el sistema de archivos, a menos que la política del sistema de archivos del Sandbox o un límite independiente del host imponga la restricción de solo lectura.

Para los servidores MCP en entornos aislados, la política de herramientas del Sandbox constituye un segundo control de permisos. Si `mcp.servers` está configurado, pero los turnos en entornos aislados solo muestran herramientas integradas, añada `bundle-mcp`, `group:plugins` o un nombre/glob de herramienta MCP con prefijo de servidor, como `outlook__send_mail` o `outlook__*`, a `tools.sandbox.tools.alsoAllow`; después, reinicie o recargue el Gateway y vuelva a capturar la lista de herramientas. Los globs de servidor utilizan el prefijo del servidor MCP seguro para proveedores: los caracteres que no sean `[A-Za-z0-9_-]` se convierten en `-`, los nombres que no comienzan por una letra reciben el prefijo `mcp-`, y los prefijos largos o duplicados pueden truncarse o recibir un sufijo.

`openclaw doctor` comprueba actualmente esta estructura para los servidores administrados por OpenClaw en `mcp.servers`. Los servidores MCP cargados desde manifiestos de plugins incluidos o desde `.mcp.json` de Claude utilizan el mismo control del Sandbox, pero este diagnóstico todavía no enumera esas fuentes; utilice las mismas entradas de la lista de permitidos si sus herramientas desaparecen en los turnos en entornos aislados.

## Elevated: «ejecutar en el host» solo para exec

Elevated **no** concede herramientas adicionales; solo afecta a `exec`.

- Si se está en un entorno aislado, `/elevated on` (o `exec` con `elevated: true`) se ejecuta fuera del Sandbox (puede que las aprobaciones sigan siendo necesarias).
- Use `/elevated full` para omitir las aprobaciones de exec durante la sesión.
- Si ya se está ejecutando directamente, Elevated no produce ningún efecto en la práctica (sigue sujeto a controles).
- Elevated **no** tiene ámbito de Skills y **no** anula los permisos ni las denegaciones de herramientas.
- Elevated no concede anulaciones arbitrarias entre hosts desde `host=auto`; sigue las reglas normales del destino de exec y solo conserva `node` cuando el destino configurado o de la sesión ya es `node`.
- `/exec` es independiente de Elevated. Solo ajusta los valores predeterminados de exec por sesión para remitentes autorizados.

Controles:

- Activación: `tools.elevated.enabled` (y, opcionalmente, `agents.list[].tools.elevated.enabled`)
- Listas de remitentes permitidos: `tools.elevated.allowFrom.<provider>` (y, opcionalmente, `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulte [Modo Elevated](/es/tools/elevated).

## Soluciones habituales para el «encierro del Sandbox»

### «Herramienta X bloqueada por la política de herramientas del Sandbox»

Claves para corregirlo (elija una):

- Desactivar el entorno aislado: `agents.defaults.sandbox.mode=off` (o por agente, `agents.list[].sandbox.mode=off`)
- Permitir la herramienta dentro del entorno aislado:
  - elimínela de `tools.sandbox.tools.deny` (o, por agente, de `agents.list[].tools.sandbox.tools.deny`)
  - o añádala a `tools.sandbox.tools.allow` (o a la lista de permitidas por agente)
- Compruebe la entrada `agents/tool-policy` en `openclaw logs`. Esta registra el modo del entorno aislado y si la regla de permiso o denegación bloqueó la herramienta.

### «Creía que esta era la sesión principal, ¿por qué está en un entorno aislado?»

En el modo `"non-main"`, las claves de grupo/canal _no_ son la sesión principal. Use la clave de la sesión principal (mostrada por `sandbox explain`) o cambie el modo a `"off"`.

## Relacionado

- [Entorno aislado](/es/gateway/sandboxing) -- referencia completa del entorno aislado (modos, ámbitos, backends e imágenes)
- [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- sustituciones por agente y precedencia
- [Modo elevado](/es/tools/elevated)
