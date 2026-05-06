---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por qué se bloquea una herramienta: entorno de ejecución sandbox, política de permitir/denegar herramientas y controles de exec elevado'
title: Entorno aislado vs. política de herramientas vs. privilegios elevados
x-i18n:
    generated_at: "2026-05-06T09:04:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd303355774e3d73161b5704ba664d7418160e9b6792a904c7d5092e0351b320
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw tiene tres controles relacionados (pero diferentes):

1. **Entorno aislado** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dónde se ejecutan las herramientas** (backend del entorno aislado frente al host).
2. **Política de herramientas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **qué herramientas están disponibles/permitidas**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) es una **salida de emergencia solo para exec** para ejecutar fuera del entorno aislado cuando estás en un entorno aislado (`gateway` de forma predeterminada, o `node` cuando el destino de exec está configurado como `node`).

## Depuración rápida

Usa el inspector para ver qué está haciendo OpenClaw _realmente_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Imprime:

- modo/alcance/acceso al espacio de trabajo efectivo del entorno aislado
- si la sesión está actualmente en un entorno aislado (principal frente a no principal)
- allow/deny efectivo de herramientas del entorno aislado (y si provino del agente/global/predeterminado)
- compuertas de elevated y rutas de claves de corrección

## Entorno aislado: dónde se ejecutan las herramientas

El aislamiento se controla mediante `agents.defaults.sandbox.mode`:

- `"off"`: todo se ejecuta en el host.
- `"non-main"`: solo las sesiones no principales están aisladas (una "sorpresa" común para grupos/canales).
- `"all"`: todo está aislado.

Consulta [Aislamiento](/es/gateway/sandboxing) para ver la matriz completa (alcance, montajes del espacio de trabajo, imágenes).

### Montajes bind (comprobación rápida de seguridad)

- `docker.binds` _perfora_ el sistema de archivos del entorno aislado: todo lo que montes será visible dentro del contenedor con el modo que establezcas (`:ro` o `:rw`).
- El valor predeterminado es lectura-escritura si omites el modo; prefiere `:ro` para código fuente/secretos.
- `scope: "shared"` ignora los binds por agente (solo se aplican los binds globales).
- OpenClaw valida las fuentes de bind dos veces: primero en la ruta de origen normalizada y luego de nuevo tras resolver mediante el ancestro existente más profundo. Los escapes por padres con symlink no omiten las comprobaciones de rutas bloqueadas o raíces permitidas.
- Las rutas hoja inexistentes siguen comprobándose de forma segura. Si `/workspace/alias-out/new-file` se resuelve mediante un padre con symlink hacia una ruta bloqueada o fuera de las raíces permitidas configuradas, el bind se rechaza.
- Vincular `/var/run/docker.sock` entrega efectivamente el control del host al entorno aislado; hazlo solo de forma intencionada.
- El acceso al espacio de trabajo (`workspaceAccess: "ro"`/`"rw"`) es independiente de los modos de bind.

## Política de herramientas: qué herramientas existen/pueden llamarse

Importan dos capas:

- **Perfil de herramientas**: `tools.profile` y `agents.list[].tools.profile` (allowlist base)
- **Perfil de herramientas del proveedor**: `tools.byProvider[provider].profile` y `agents.list[].tools.byProvider[provider].profile`
- **Política de herramientas global/por agente**: `tools.allow`/`tools.deny` y `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de herramientas del proveedor**: `tools.byProvider[provider].allow/deny` y `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de herramientas del entorno aislado** (solo se aplica cuando está aislado): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` y `agents.list[].tools.sandbox.tools.*`

Reglas prácticas:

- `deny` siempre gana.
- Si `allow` no está vacío, todo lo demás se trata como bloqueado.
- La política de herramientas es el bloqueo definitivo: `/exec` no puede anular una herramienta `exec` denegada.
- `/exec` solo cambia los valores predeterminados de la sesión para remitentes autorizados; no concede acceso a herramientas.
  Las claves de herramientas de proveedor aceptan `provider` (por ejemplo, `google-antigravity`) o `provider/model` (por ejemplo, `openai/gpt-5.4`).

### Grupos de herramientas (abreviaturas)

Las políticas de herramientas (globales, de agente, de entorno aislado) admiten entradas `group:*` que se expanden a varias herramientas:

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

## Elevated: "ejecutar en el host" solo para exec

Elevated **no** concede herramientas adicionales; solo afecta a `exec`.

- Si estás en un entorno aislado, `/elevated on` (o `exec` con `elevated: true`) se ejecuta fuera del entorno aislado (las aprobaciones pueden seguir aplicándose).
- Usa `/elevated full` para omitir las aprobaciones de exec en la sesión.
- Si ya estás ejecutando de forma directa, elevated es efectivamente una no-op (sigue estando sujeto a compuertas).
- Elevated **no** está limitado por Skills y **no** anula allow/deny de herramientas.
- Elevated no concede anulaciones arbitrarias entre hosts desde `host=auto`; sigue las reglas normales de destino de exec y solo conserva `node` cuando el destino configurado/de sesión ya es `node`.
- `/exec` es independiente de elevated. Solo ajusta los valores predeterminados de exec por sesión para remitentes autorizados.

Compuertas:

- Habilitación: `tools.elevated.enabled` (y opcionalmente `agents.list[].tools.elevated.enabled`)
- Allowlists de remitentes: `tools.elevated.allowFrom.<provider>` (y opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulta [Modo Elevated](/es/tools/elevated).

## Correcciones comunes de "cárcel del entorno aislado"

### "Tool X blocked by sandbox tool policy"

Claves de corrección (elige una):

- Deshabilitar el entorno aislado: `agents.defaults.sandbox.mode=off` (o por agente `agents.list[].sandbox.mode=off`)
- Permitir la herramienta dentro del entorno aislado:
  - eliminarla de `tools.sandbox.tools.deny` (o por agente `agents.list[].tools.sandbox.tools.deny`)
  - o agregarla a `tools.sandbox.tools.allow` (o al allow por agente)

### "I thought this was main, why is it sandboxed?"

En el modo `"non-main"`, las claves de grupo/canal _no_ son principales. Usa la clave de sesión principal (mostrada por `sandbox explain`) o cambia el modo a `"off"`.

## Relacionado

- [Aislamiento](/es/gateway/sandboxing) -- referencia completa del entorno aislado (modos, alcances, backends, imágenes)
- [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente y precedencia
- [Modo Elevated](/es/tools/elevated)
