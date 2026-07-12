---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por qué se bloquea una herramienta: entorno de ejecución aislado, política de autorización/denegación de herramientas y controles de ejecución con privilegios elevados'
title: Sandbox frente a política de herramientas frente a modo elevado
x-i18n:
    generated_at: "2026-07-11T23:09:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw tiene tres controles relacionados, pero diferentes:

1. **Entorno aislado** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dónde se ejecutan las herramientas** (backend del entorno aislado o host).
2. **Política de herramientas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **qué herramientas están disponibles o permitidas**.
3. **Modo elevado** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) es una **vía de escape exclusiva para `exec`** que permite ejecutar fuera del entorno aislado cuando la sesión está aislada (`gateway` de forma predeterminada, o `node` cuando el destino de ejecución está configurado como `node`).

## Depuración rápida

Use el inspector para ver qué está haciendo _realmente_ OpenClaw:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Muestra:

- el modo, el ámbito y el acceso al espacio de trabajo efectivos del entorno aislado
- si la sesión se encuentra actualmente en un entorno aislado (principal o no principal)
- las reglas efectivas de permitir/denegar herramientas en el entorno aislado (y si proceden del agente, de la configuración global o de la predeterminada)
- los controles del modo elevado y las rutas de claves para corregirlos

## Entorno aislado: dónde se ejecutan las herramientas

El aislamiento se controla mediante `agents.defaults.sandbox.mode`:

- `"off"`: todo se ejecuta en el host.
- `"non-main"`: solo las sesiones no principales se ejecutan en un entorno aislado (una «sorpresa» habitual en grupos y canales).
- `"all"`: todo se ejecuta en un entorno aislado.

`agents.defaults.sandbox.workspaceAccess` controla qué puede ver el entorno aislado: `"none"`, `"ro"` o `"rw"`.

Consulte [Aislamiento](/es/gateway/sandboxing) para ver la matriz completa (ámbito, montajes del espacio de trabajo e imágenes).

### Montajes vinculados (comprobación rápida de seguridad)

- `docker.binds` _atraviesa_ el sistema de archivos del entorno aislado: todo lo que monte será visible dentro del contenedor con el modo que establezca (`:ro` o `:rw`).
- Si omite el modo, el valor predeterminado es lectura y escritura; prefiera `:ro` para código fuente y secretos.
- `scope: "shared"` ignora los montajes por agente (solo se aplican los montajes globales).
- OpenClaw valida dos veces los orígenes de los montajes: primero en la ruta de origen normalizada y después de nuevo tras resolverla a través del antecesor existente más profundo. Los escapes mediante un directorio padre que sea un enlace simbólico no eluden las comprobaciones de rutas bloqueadas ni de raíces permitidas.
- Las rutas finales inexistentes también se comprueban de forma segura. Si `/workspace/alias-out/new-file` se resuelve a través de un directorio padre enlazado simbólicamente hacia una ruta bloqueada o fuera de las raíces permitidas configuradas, el montaje se rechaza.
- Vincular `/var/run/docker.sock` concede en la práctica el control del host al entorno aislado; hágalo solo de forma intencionada.
- El acceso al espacio de trabajo (`workspaceAccess`) es independiente de los modos de montaje.

## Política de herramientas: qué herramientas existen y se pueden invocar

Importan varias capas:

- **Perfil de herramientas**: `tools.profile` y `agents.list[].tools.profile` (lista base de permitidos)
- **Perfil de herramientas del proveedor**: `tools.byProvider[provider].profile` y `agents.list[].tools.byProvider[provider].profile`
- **Política de herramientas global o por agente**: `tools.allow`/`tools.deny` y `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de herramientas del proveedor**: `tools.byProvider[provider].allow/deny` y `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de herramientas del entorno aislado** (solo se aplica en sesiones aisladas): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` y `agents.list[].tools.sandbox.tools.*`

Reglas generales:

- `deny` siempre prevalece.
- Si `allow` no está vacío, todo lo demás se considera bloqueado.
- La política de herramientas es el límite definitivo: `/exec` no puede anular la denegación de la herramienta `exec`.
- La política de herramientas filtra su disponibilidad por nombre; no inspecciona los efectos secundarios dentro de `exec`. Si `exec` está permitido, denegar `write`, `edit` o `apply_patch` no convierte los comandos de shell en operaciones de solo lectura.
- `/exec` solo cambia los valores predeterminados de la sesión para remitentes autorizados; no concede acceso a herramientas.
- Las claves de herramientas del proveedor aceptan tanto `provider` (por ejemplo, `google-antigravity`) como `provider/model` (por ejemplo, `openai/gpt-5.4`).
- Los registros del Gateway incluyen entradas de auditoría `agents/tool-policy` cuando un paso de la política de herramientas elimina herramientas o una política de herramientas del entorno aislado bloquea una llamada. Use `openclaw logs` para ver la etiqueta de la regla, la clave de configuración y los nombres de las herramientas afectadas.

### Grupos de herramientas (abreviaturas)

Las políticas de herramientas (globales, por agente y del entorno aislado) admiten entradas `group:*` que se expanden a varias herramientas:

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

| Grupo              | Herramientas                                                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` se acepta como alias de `exec`)                                                                                                                                                           |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                                                                |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`                                                                                                               |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                                                         |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                                                 |
| `group:ui`         | `browser`, `canvas`                                                                                                                                                                                                                   |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                                                                |
| `group:messaging`  | `message`                                                                                                                                                                                                                             |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                                                   |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                                                                                                              |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                                                  |
| `group:openclaw`   | la mayoría de las herramientas integradas de OpenClaw (excluye las primitivas de sistema de archivos y ejecución `read`/`write`/`edit`/`apply_patch`/`exec`/`process`, `canvas` y los plugins de proveedores)                           |
| `group:plugins`    | todas las herramientas cargadas que pertenecen a plugins, incluidos los servidores MCP configurados que se exponen mediante `bundle-mcp`                                                                                             |

Para los agentes de solo lectura, deniegue `group:runtime`, además de las herramientas que modifican el sistema de archivos, salvo que la política del sistema de archivos del entorno aislado o un límite independiente del host imponga la restricción de solo lectura.

Para los servidores MCP aislados, la política de herramientas del entorno aislado constituye un segundo control de permisos. Si `mcp.servers` está configurado, pero los turnos aislados solo muestran herramientas integradas, añada `bundle-mcp`, `group:plugins` o un nombre o patrón global de herramienta MCP con el prefijo del servidor, como `outlook__send_mail` u `outlook__*`, a `tools.sandbox.tools.alsoAllow`; después, reinicie o recargue el Gateway y vuelva a capturar la lista de herramientas. Los patrones globales de servidores usan el prefijo del servidor MCP seguro para proveedores: los caracteres que no pertenezcan a `[A-Za-z0-9_-]` se convierten en `-`, los nombres que no comiencen por una letra reciben el prefijo `mcp-`, y los prefijos largos o duplicados pueden truncarse o recibir un sufijo.

Actualmente, `openclaw doctor` comprueba esta estructura para los servidores administrados por OpenClaw en `mcp.servers`. Los servidores MCP cargados desde manifiestos de plugins incluidos o desde `.mcp.json` de Claude usan el mismo control del entorno aislado, pero este diagnóstico todavía no enumera esas fuentes; use las mismas entradas de la lista de permitidos si sus herramientas desaparecen en los turnos aislados.

## Modo elevado: «ejecutar en el host» solo para `exec`

El modo elevado **no** concede herramientas adicionales; solo afecta a `exec`.

- Si la sesión está aislada, `/elevated on` (o `exec` con `elevated: true`) se ejecuta fuera del entorno aislado (las aprobaciones aún pueden aplicarse).
- Use `/elevated full` para omitir las aprobaciones de ejecución durante la sesión.
- Si ya se está ejecutando directamente, el modo elevado no tiene ningún efecto práctico (aunque sigue sujeto a controles).
- El modo elevado **no** está limitado al ámbito de una Skill y **no** anula las reglas de permitir/denegar herramientas.
- El modo elevado no concede anulaciones arbitrarias entre hosts desde `host=auto`; sigue las reglas normales del destino de ejecución y solo conserva `node` cuando el destino configurado o el de la sesión ya es `node`.
- `/exec` es independiente del modo elevado. Solo ajusta los valores predeterminados de ejecución de cada sesión para remitentes autorizados.

Controles:

- Activación: `tools.elevated.enabled` (y, opcionalmente, `agents.list[].tools.elevated.enabled`)
- Listas de remitentes permitidos: `tools.elevated.allowFrom.<provider>` (y, opcionalmente, `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulte [Modo elevado](/es/tools/elevated).

## Soluciones habituales para el «confinamiento en el entorno aislado»

### «La herramienta X está bloqueada por la política de herramientas del entorno aislado»

Claves para corregirlo (elija una):

- Desactive el entorno aislado: `agents.defaults.sandbox.mode=off` (o, por agente, `agents.list[].sandbox.mode=off`)
- Permita la herramienta dentro del entorno aislado:
  - elimínela de `tools.sandbox.tools.deny` (o, por agente, de `agents.list[].tools.sandbox.tools.deny`)
  - o añádala a `tools.sandbox.tools.allow` (o a la lista de permitidos por agente)
- Consulte `openclaw logs` para encontrar la entrada `agents/tool-policy`. Esta registra el modo del entorno aislado y si la herramienta fue bloqueada por la regla de permisos o de denegaciones.

### «Pensaba que esta era la sesión principal; ¿por qué está aislada?»

En el modo `"non-main"`, las claves de grupos y canales _no_ son principales. Use la clave de la sesión principal (que muestra `sandbox explain`) o cambie el modo a `"off"`.

## Contenido relacionado

- [Aislamiento](/es/gateway/sandboxing) -- referencia completa del entorno aislado (modos, ámbitos, backends e imágenes)
- [Entorno aislado y herramientas para varios agentes](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente y precedencia
- [Modo elevado](/es/tools/elevated)
