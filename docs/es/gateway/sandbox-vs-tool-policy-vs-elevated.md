---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por qué se bloquea una herramienta: entorno de ejecución sandbox, política de permitir/denegar herramientas y controles de ejecución elevada'
title: Sandbox frente a política de herramientas frente a privilegios elevados
x-i18n:
    generated_at: "2026-06-27T11:34:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f4156cc494a6aff4fb9c44cbca8fdfde10a3343dde624c485833dd7508e4c4d6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw tiene tres controles relacionados (pero diferentes):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dónde se ejecutan las herramientas** (backend de sandbox frente al host).
2. **Política de herramientas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **qué herramientas están disponibles/permitidas**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) es una **vía de escape solo para exec** para ejecutar fuera del sandbox cuando estás en sandbox (`gateway` de forma predeterminada, o `node` cuando el destino de exec está configurado como `node`).

## Depuración rápida

Usa el inspector para ver qué está haciendo OpenClaw _realmente_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Imprime:

- modo/ámbito/acceso al espacio de trabajo efectivos del sandbox
- si la sesión está actualmente en sandbox (main frente a non-main)
- allow/deny efectivos de herramientas del sandbox (y si provienen del agente/global/predeterminado)
- compuertas de Elevated y rutas de claves de corrección

## Sandbox: dónde se ejecutan las herramientas

El sandbox se controla mediante `agents.defaults.sandbox.mode`:

- `"off"`: todo se ejecuta en el host.
- `"non-main"`: solo las sesiones non-main están en sandbox (una "sorpresa" común para grupos/canales).
- `"all"`: todo está en sandbox.

Consulta [Sandboxing](/es/gateway/sandboxing) para ver la matriz completa (ámbito, montajes de espacio de trabajo, imágenes).

### Montajes bind (comprobación rápida de seguridad)

- `docker.binds` _perfora_ el sistema de archivos del sandbox: cualquier cosa que montes será visible dentro del contenedor con el modo que definas (`:ro` o `:rw`).
- El valor predeterminado es lectura-escritura si omites el modo; prefiere `:ro` para código fuente/secretos.
- `scope: "shared"` ignora los binds por agente (solo se aplican los binds globales).
- OpenClaw valida las fuentes de bind dos veces: primero en la ruta de origen normalizada y luego otra vez después de resolver a través del ancestro existente más profundo. Los escapes por padres con enlaces simbólicos no eluden las comprobaciones de rutas bloqueadas ni de raíces permitidas.
- Las rutas hoja inexistentes se siguen comprobando de forma segura. Si `/workspace/alias-out/new-file` se resuelve a través de un padre con enlace simbólico a una ruta bloqueada o fuera de las raíces permitidas configuradas, el bind se rechaza.
- Vincular `/var/run/docker.sock` entrega efectivamente el control del host al sandbox; hazlo solo de forma intencional.
- El acceso al espacio de trabajo (`workspaceAccess: "ro"`/`"rw"`) es independiente de los modos de bind.

## Política de herramientas: qué herramientas existen/pueden invocarse

Importan dos capas:

- **Perfil de herramientas**: `tools.profile` y `agents.list[].tools.profile` (lista base de permitidos)
- **Perfil de herramientas del proveedor**: `tools.byProvider[provider].profile` y `agents.list[].tools.byProvider[provider].profile`
- **Política de herramientas global/por agente**: `tools.allow`/`tools.deny` y `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de herramientas del proveedor**: `tools.byProvider[provider].allow/deny` y `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de herramientas del sandbox** (solo se aplica cuando está en sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` y `agents.list[].tools.sandbox.tools.*`

Reglas generales:

- `deny` siempre gana.
- Si `allow` no está vacío, todo lo demás se trata como bloqueado.
- La política de herramientas es el bloqueo definitivo: `/exec` no puede anular una herramienta `exec` denegada.
- La política de herramientas filtra la disponibilidad de herramientas por nombre; no inspecciona efectos secundarios dentro de `exec`. Si `exec` está permitido, denegar `write`, `edit` o `apply_patch` no hace que los comandos de shell sean de solo lectura.
- `/exec` solo cambia los valores predeterminados de sesión para remitentes autorizados; no concede acceso a herramientas.
  Las claves de herramientas del proveedor aceptan `provider` (por ejemplo, `google-antigravity`) o `provider/model` (por ejemplo, `openai/gpt-5.4`).
- Los registros del Gateway incluyen entradas de auditoría `agents/tool-policy` cuando un paso de política de herramientas elimina herramientas o una política de herramientas del sandbox bloquea una llamada. Usa `openclaw logs` para ver la etiqueta de la regla, la clave de configuración y los nombres de herramientas afectados.

### Grupos de herramientas (abreviaturas)

Las políticas de herramientas (globales, de agente, de sandbox) admiten entradas `group:*` que se expanden a varias herramientas:

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` se acepta como
  alias de `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
  Para agentes de solo lectura, deniega `group:runtime` además de las herramientas de sistema de archivos que mutan, salvo que la política de sistema de archivos del sandbox o un límite de host separado imponga la restricción de solo lectura.
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `heartbeat_respond`, `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`, `update_plan`
- `group:media`: `image`, `image_generate`, `music_generate`, `video_generate`, `tts`
- `group:openclaw`: todas las herramientas integradas de OpenClaw (excluye plugins de proveedor)
- `group:plugins`: todas las herramientas cargadas propiedad de plugins, incluidos los servidores MCP configurados expuestos mediante `bundle-mcp`

Para servidores MCP en sandbox, la política de herramientas del sandbox es una segunda compuerta de permiso. Si `mcp.servers` está configurado pero los turnos en sandbox solo muestran herramientas integradas, añade `bundle-mcp`, `group:plugins` o un nombre/glob de herramienta MCP con prefijo de servidor, como `outlook__send_mail` u `outlook__*`, a `tools.sandbox.tools.alsoAllow`; luego reinicia/recarga el gateway y vuelve a capturar la lista de herramientas. Los globs de servidor usan el prefijo de servidor MCP seguro para proveedores: los caracteres que no sean `[A-Za-z0-9_-]` se convierten en `-`, los nombres que no empiezan con una letra reciben el prefijo `mcp-`, y los prefijos largos o duplicados pueden truncarse o recibir un sufijo.

`openclaw doctor` actualmente comprueba esta forma para servidores administrados por OpenClaw en `mcp.servers`. Los servidores MCP cargados desde manifiestos de plugins incluidos o desde `.mcp.json` de Claude usan la misma compuerta de sandbox, pero este diagnóstico aún no enumera esas fuentes; usa las mismas entradas de lista de permitidos si sus herramientas desaparecen en turnos en sandbox.

## Elevated: "ejecutar en el host" solo para exec

Elevated **no** concede herramientas adicionales; solo afecta a `exec`.

- Si estás en sandbox, `/elevated on` (o `exec` con `elevated: true`) se ejecuta fuera del sandbox (es posible que aún se apliquen aprobaciones).
- Usa `/elevated full` para omitir las aprobaciones de exec en la sesión.
- Si ya estás ejecutando directamente, Elevated es efectivamente un no-op (sigue estando sujeto a compuertas).
- Elevated **no** está limitado por Skills y **no** anula allow/deny de herramientas.
- Elevated no concede anulaciones arbitrarias entre hosts desde `host=auto`; sigue las reglas normales de destino de exec y solo preserva `node` cuando el destino configurado/de sesión ya es `node`.
- `/exec` está separado de Elevated. Solo ajusta los valores predeterminados de exec por sesión para remitentes autorizados.

Compuertas:

- Habilitación: `tools.elevated.enabled` (y opcionalmente `agents.list[].tools.elevated.enabled`)
- Listas de remitentes permitidos: `tools.elevated.allowFrom.<provider>` (y opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulta [Modo Elevated](/es/tools/elevated).

## Correcciones comunes de "cárcel de sandbox"

### "Herramienta X bloqueada por la política de herramientas del sandbox"

Claves de corrección (elige una):

- Deshabilitar sandbox: `agents.defaults.sandbox.mode=off` (o por agente `agents.list[].sandbox.mode=off`)
- Permitir la herramienta dentro del sandbox:
  - quitarla de `tools.sandbox.tools.deny` (o por agente `agents.list[].tools.sandbox.tools.deny`)
  - o añadirla a `tools.sandbox.tools.allow` (o a allow por agente)
- Comprueba `openclaw logs` para ver la entrada `agents/tool-policy`. Registra el modo de sandbox y si la regla allow o deny bloqueó la herramienta.

### "Pensé que esto era main, ¿por qué está en sandbox?"

En modo `"non-main"`, las claves de grupo/canal _no_ son main. Usa la clave de sesión main (mostrada por `sandbox explain`) o cambia el modo a `"off"`.

## Relacionado

- [Sandboxing](/es/gateway/sandboxing) -- referencia completa de sandbox (modos, ámbitos, backends, imágenes)
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente y precedencia
- [Modo Elevated](/es/tools/elevated)
