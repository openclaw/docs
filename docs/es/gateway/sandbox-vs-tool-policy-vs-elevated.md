---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por qué se bloquea una herramienta: runtime de sandbox, política de permitir/denegar herramientas y controles de ejecución elevada'
title: Entorno aislado frente a política de herramientas frente a permisos elevados
x-i18n:
    generated_at: "2026-05-06T05:35:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 516632295f10c29f87047ad3eebd842e35ab2a8effa4f8a6108e87f58cea3e1b
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw tiene tres controles relacionados (pero diferentes):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dónde se ejecutan las herramientas** (backend de sandbox frente a host).
2. **Política de herramientas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **qué herramientas están disponibles/permitidas**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) es una **vía de escape solo para exec** para ejecutarse fuera del sandbox cuando estás en sandbox (`gateway` de forma predeterminada, o `node` cuando el destino de exec está configurado como `node`).

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
- si la sesión está actualmente en sandbox (principal frente a no principal)
- permiso/denegación efectivos de herramientas de sandbox (y si provienen de agente/global/predeterminado)
- puertas de Elevated y rutas de claves para corregir

## Sandbox: dónde se ejecutan las herramientas

El sandbox se controla mediante `agents.defaults.sandbox.mode`:

- `"off"`: todo se ejecuta en el host.
- `"non-main"`: solo las sesiones no principales están en sandbox (una “sorpresa” común para grupos/canales).
- `"all"`: todo está en sandbox.

Consulta [Sandbox](/es/gateway/sandboxing) para ver la matriz completa (ámbito, montajes de espacio de trabajo, imágenes).

### Montajes bind (comprobación rápida de seguridad)

- `docker.binds` _perfora_ el sistema de archivos del sandbox: todo lo que montes queda visible dentro del contenedor con el modo que definas (`:ro` o `:rw`).
- El valor predeterminado es lectura-escritura si omites el modo; prefiere `:ro` para código fuente/secretos.
- `scope: "shared"` ignora los binds por agente (solo se aplican los binds globales).
- OpenClaw valida las fuentes de bind dos veces: primero en la ruta de origen normalizada, y luego de nuevo tras resolver a través del ancestro existente más profundo. Los escapes por padre con symlink no omiten las comprobaciones de rutas bloqueadas ni de raíces permitidas.
- Las rutas hoja inexistentes se comprueban igualmente de forma segura. Si `/workspace/alias-out/new-file` se resuelve a través de un padre con symlink a una ruta bloqueada o fuera de las raíces permitidas configuradas, el bind se rechaza.
- Vincular `/var/run/docker.sock` entrega efectivamente el control del host al sandbox; hazlo solo de forma intencional.
- El acceso al espacio de trabajo (`workspaceAccess: "ro"`/`"rw"`) es independiente de los modos de bind.

## Política de herramientas: qué herramientas existen/se pueden invocar

Importan dos capas:

- **Perfil de herramientas**: `tools.profile` y `agents.list[].tools.profile` (lista base de permisos)
- **Perfil de herramientas del proveedor**: `tools.byProvider[provider].profile` y `agents.list[].tools.byProvider[provider].profile`
- **Política de herramientas global/por agente**: `tools.allow`/`tools.deny` y `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de herramientas del proveedor**: `tools.byProvider[provider].allow/deny` y `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de herramientas del sandbox** (solo se aplica cuando se está en sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` y `agents.list[].tools.sandbox.tools.*`

Reglas prácticas:

- `deny` siempre gana.
- Si `allow` no está vacío, todo lo demás se trata como bloqueado.
- La política de herramientas es el límite definitivo: `/exec` no puede anular una herramienta `exec` denegada.
- `/exec` solo cambia los valores predeterminados de sesión para remitentes autorizados; no concede acceso a herramientas.
  Las claves de herramientas del proveedor aceptan `provider` (p. ej., `google-antigravity`) o `provider/model` (p. ej., `openai/gpt-5.4`).

### Grupos de herramientas (abreviaturas)

Las políticas de herramientas (global, agente, sandbox) admiten entradas `group:*` que se expanden a varias herramientas:

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
- `group:openclaw`: todas las herramientas integradas de OpenClaw (excluye los plugins de proveedor)

## Elevated: "ejecutar en host" solo para exec

Elevated **no** concede herramientas adicionales; solo afecta a `exec`.

- Si estás en sandbox, `/elevated on` (o `exec` con `elevated: true`) se ejecuta fuera del sandbox (pueden seguir aplicándose aprobaciones).
- Usa `/elevated full` para omitir las aprobaciones de exec en la sesión.
- Si ya estás ejecutando directamente, Elevated es efectivamente una operación sin efecto (sigue sujeto a puertas).
- Elevated **no** está limitado por Skills y **no** anula allow/deny de herramientas.
- Elevated no concede anulaciones arbitrarias entre hosts desde `host=auto`; sigue las reglas normales del destino de exec y solo preserva `node` cuando el destino configurado/de sesión ya es `node`.
- `/exec` es independiente de Elevated. Solo ajusta los valores predeterminados de exec por sesión para remitentes autorizados.

Puertas:

- Habilitación: `tools.elevated.enabled` (y opcionalmente `agents.list[].tools.elevated.enabled`)
- Listas de remitentes permitidos: `tools.elevated.allowFrom.<provider>` (y opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulta [Modo Elevated](/es/tools/elevated).

## Correcciones comunes de "cárcel de sandbox"

### "Herramienta X bloqueada por la política de herramientas del sandbox"

Claves de corrección (elige una):

- Deshabilitar sandbox: `agents.defaults.sandbox.mode=off` (o por agente `agents.list[].sandbox.mode=off`)
- Permitir la herramienta dentro del sandbox:
  - eliminarla de `tools.sandbox.tools.deny` (o por agente `agents.list[].tools.sandbox.tools.deny`)
  - o agregarla a `tools.sandbox.tools.allow` (o al allow por agente)

### "Creía que esto era principal, ¿por qué está en sandbox?"

En modo `"non-main"`, las claves de grupo/canal _no_ son principales. Usa la clave de sesión principal (mostrada por `sandbox explain`) o cambia el modo a `"off"`.

## Relacionado

- [Sandbox](/es/gateway/sandboxing) -- referencia completa del sandbox (modos, ámbitos, backends, imágenes)
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente y precedencia
- [Modo Elevated](/es/tools/elevated)
