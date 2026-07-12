---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por qué se bloquea una herramienta: entorno de ejecución del sandbox, política de permisos y denegaciones de herramientas y controles de ejecución con privilegios elevados'
title: Entorno aislado frente a política de herramientas frente a privilegios elevados
x-i18n:
    generated_at: "2026-07-12T14:35:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2fce3dab337e89fc2b196f59e763a169d76206ce2695744e00252c158b161260
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw tiene tres controles relacionados pero diferentes:

1. **Entorno aislado** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) determina **dónde se ejecutan las herramientas** (backend del entorno aislado o host).
2. **Política de herramientas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) determina **qué herramientas están disponibles o permitidas**.
3. **Privilegios elevados** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) es una **vía de escape exclusiva para exec** que permite ejecutar fuera del entorno aislado cuando se utiliza uno (`gateway` de forma predeterminada, o `node` cuando el destino de exec está configurado como `node`).

## Depuración rápida

Utilice el inspector para ver qué está haciendo _realmente_ OpenClaw:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Imprime:

- el modo, el ámbito y el acceso al espacio de trabajo efectivos del entorno aislado
- si la sesión se encuentra actualmente en un entorno aislado (principal frente a no principal)
- las reglas efectivas de autorización o denegación de herramientas del entorno aislado (y si proceden del agente, de la configuración global o de los valores predeterminados)
- los controles de elevación y las rutas de claves para corregirlos

## Entorno aislado: dónde se ejecutan las herramientas

El aislamiento se controla mediante `agents.defaults.sandbox.mode`:

- `"off"`: todo se ejecuta en el host.
- `"non-main"`: solo las sesiones no principales se ejecutan en un entorno aislado (una «sorpresa» habitual en grupos o canales).
- `"all"`: todo se ejecuta en un entorno aislado.

`agents.defaults.sandbox.workspaceAccess` controla qué puede ver el entorno aislado: `"none"`, `"ro"` o `"rw"`.

Consulte [Entornos aislados](/es/gateway/sandboxing) para ver la matriz completa (ámbito, montajes del espacio de trabajo, imágenes).

### Montajes de enlace (comprobación rápida de seguridad)

- `docker.binds` _atraviesa_ el sistema de archivos del entorno aislado: todo lo que se monte será visible dentro del contenedor con el modo establecido (`:ro` o `:rw`).
- Si se omite el modo, el valor predeterminado es lectura y escritura; se recomienda `:ro` para código fuente y secretos.
- `scope: "shared"` ignora los montajes de enlace por agente (solo se aplican los montajes globales).
- OpenClaw valida dos veces los orígenes de los montajes de enlace: primero en la ruta de origen normalizada y, después, nuevamente tras resolverla mediante el ancestro existente más profundo. Los escapes mediante padres que sean enlaces simbólicos no eluden las comprobaciones de rutas bloqueadas ni de raíces permitidas.
- Las rutas finales inexistentes también se comprueban de forma segura. Si `/workspace/alias-out/new-file` se resuelve mediante un padre que sea un enlace simbólico hacia una ruta bloqueada o fuera de las raíces permitidas configuradas, se rechaza el montaje de enlace.
- Montar `/var/run/docker.sock` otorga de hecho al entorno aislado el control del host; hágalo únicamente de forma intencional.
- El acceso al espacio de trabajo (`workspaceAccess`) es independiente de los modos de montaje de enlace.

## Política de herramientas: qué herramientas existen o se pueden invocar

Hay dos capas importantes:

- **Perfil de herramientas**: `tools.profile` y `agents.list[].tools.profile` (lista de permitidas base)
- **Perfil de herramientas del proveedor**: `tools.byProvider[provider].profile` y `agents.list[].tools.byProvider[provider].profile`
- **Política de herramientas global/por agente**: `tools.allow`/`tools.deny` y `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de herramientas del proveedor**: `tools.byProvider[provider].allow/deny` y `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de herramientas del entorno aislado** (solo se aplica cuando se usa un entorno aislado): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` y `agents.list[].tools.sandbox.tools.*`

Reglas generales:

- `deny` siempre prevalece.
- Si `allow` no está vacío, todo lo demás se considera bloqueado.
- La política de herramientas es el límite definitivo: `/exec` no puede anular la denegación de la herramienta `exec`.
- La política de herramientas filtra su disponibilidad por nombre; no inspecciona los efectos secundarios dentro de `exec`. Si se permite `exec`, denegar `write`, `edit` o `apply_patch` no hace que los comandos del shell sean de solo lectura.
- `/exec` solo cambia los valores predeterminados de la sesión para remitentes autorizados; no concede acceso a herramientas.
- Las claves de herramientas del proveedor aceptan tanto `provider` (por ejemplo, `google-antigravity`) como `provider/model` (por ejemplo, `openai/gpt-5.4`).
- Los registros del Gateway incluyen entradas de auditoría `agents/tool-policy` cuando un paso de la política de herramientas elimina herramientas o cuando una política de herramientas del entorno aislado bloquea una llamada. Use `openclaw logs` para ver la etiqueta de la regla, la clave de configuración y los nombres de las herramientas afectadas.

### Grupos de herramientas (abreviaturas)

Las políticas de herramientas (globales, de agente y de sandbox) admiten entradas `group:*` que se expanden a varias herramientas:

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

| Grupo              | Herramientas                                                                                                                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` se acepta como alias de `exec`)                                                                                                                                                   |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                                                                                                                       |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`                                                                                                      |
| `group:memory`     | `memory_search`, `memory_get`                                                                                                                                                                                                |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                                                                                                                        |
| `group:ui`         | `browser`, `canvas`                                                                                                                                                                                                          |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                                                                                                                       |
| `group:messaging`  | `message`                                                                                                                                                                                                                    |
| `group:nodes`      | `nodes`, `computer`                                                                                                                                                                                                          |
| `group:agents`     | `agents_list`, `get_goal`, `create_goal`, `update_goal`, `update_plan`, `skill_workshop`                                                                                                                                     |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                                                                                                                         |
| `group:openclaw`   | la mayoría de las herramientas integradas de OpenClaw (excluye las primitivas de sistema de archivos y tiempo de ejecución `read`/`write`/`edit`/`apply_patch`/`exec`/`process`, `canvas` y los plugins de proveedores)       |
| `group:plugins`    | todas las herramientas cargadas que pertenecen a plugins, incluidos los servidores MCP configurados que se exponen mediante `bundle-mcp`                                                                                    |

Para los agentes de solo lectura, deniegue `group:runtime`, además de las herramientas que modifican el sistema de archivos, a menos que la política del sistema de archivos del sandbox o un límite independiente del host imponga la restricción de solo lectura.

Para los servidores MCP en sandbox, la política de herramientas del sandbox constituye una segunda puerta de autorización. Si `mcp.servers` está configurado, pero los turnos en sandbox solo muestran herramientas integradas, añada `bundle-mcp`, `group:plugins` o un nombre o patrón global de herramienta MCP con prefijo de servidor, como `outlook__send_mail` u `outlook__*`, a `tools.sandbox.tools.alsoAllow`; después, reinicie o recargue el Gateway y vuelva a capturar la lista de herramientas. Los patrones globales de servidor usan el prefijo de servidor MCP seguro para el proveedor: los caracteres que no sean `[A-Za-z0-9_-]` se convierten en `-`, los nombres que no comiencen por una letra reciben el prefijo `mcp-`, y los prefijos largos o duplicados pueden truncarse o recibir un sufijo.

Actualmente, `openclaw doctor` comprueba esta estructura para los servidores administrados por OpenClaw en `mcp.servers`. Los servidores MCP cargados desde manifiestos de plugins incluidos o desde `.mcp.json` de Claude usan la misma puerta del sandbox, pero este diagnóstico todavía no enumera esas fuentes; use las mismas entradas de la lista de permitidos si sus herramientas desaparecen en los turnos en sandbox.

## Elevado: «ejecutar en el host» solo para exec

El modo elevado **no** concede herramientas adicionales; solo afecta a `exec`.

- Si se encuentra en un sandbox, `/elevated on` (o `exec` con `elevated: true`) se ejecuta fuera del sandbox (es posible que las aprobaciones sigan aplicándose).
- Use `/elevated full` para omitir las aprobaciones de exec durante la sesión.
- Si ya se está ejecutando directamente, el modo elevado no tiene ningún efecto práctico (sigue sujeto a las puertas de autorización).
- El modo elevado **no** está limitado al ámbito de una Skill y **no** invalida las reglas de autorización o denegación de herramientas.
- El modo elevado no concede anulaciones arbitrarias entre hosts desde `host=auto`; sigue las reglas normales del destino de exec y solo conserva `node` cuando el destino configurado o de la sesión ya es `node`.
- `/exec` es independiente del modo elevado. Solo ajusta los valores predeterminados de exec por sesión para remitentes autorizados.

Puertas de autorización:

- Habilitación: `tools.elevated.enabled` (y, opcionalmente, `agents.list[].tools.elevated.enabled`)
- Listas de remitentes permitidos: `tools.elevated.allowFrom.<provider>` (y, opcionalmente, `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulte [Modo elevado](/es/tools/elevated).

## Soluciones habituales para la «cárcel del sandbox»

### «La herramienta X está bloqueada por la política de herramientas del sandbox»

Claves para solucionarlo (elija una):

- Desactive el sandbox: `agents.defaults.sandbox.mode=off` (o, por agente, `agents.list[].sandbox.mode=off`)
- Permita la herramienta dentro del sandbox:
  - elimínela de `tools.sandbox.tools.deny` (o, por agente, `agents.list[].tools.sandbox.tools.deny`)
  - o añádala a `tools.sandbox.tools.allow` (o a la lista de permitidos por agente)
- Consulte en `openclaw logs` la entrada `agents/tool-policy`. Registra el modo del sandbox y si la regla de autorización o denegación bloqueó la herramienta.

### «Pensaba que esta era la sesión principal; ¿por qué está en un sandbox?»

En el modo `"non-main"`, las claves de grupo/canal _no_ son principales. Use la clave de la sesión principal (mostrada por `sandbox explain`) o cambie el modo a `"off"`.

## Temas relacionados

- [Uso de sandbox](/es/gateway/sandboxing) -- referencia completa del sandbox (modos, ámbitos, backends e imágenes)
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente y precedencia
- [Modo elevado](/es/tools/elevated)
