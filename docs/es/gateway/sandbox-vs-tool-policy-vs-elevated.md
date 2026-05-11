---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por qué se bloquea una herramienta: entorno de ejecución de sandbox, política de permitir/denegar herramientas y controles de ejecución elevada'
title: Entorno aislado frente a política de herramientas frente a permisos elevados
x-i18n:
    generated_at: "2026-05-11T20:36:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d670aa4f2e0f2265590e0de6198de841e744d210bbc54d291cb448d368e63b6
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 16
---

OpenClaw tiene tres controles relacionados (pero diferentes):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dónde se ejecutan las herramientas** (backend de sandbox frente al host).
2. **Política de herramientas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **qué herramientas están disponibles/permitidas**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) es una **salida de emergencia solo para exec** para ejecutarse fuera del sandbox cuando estás en sandbox (`gateway` de forma predeterminada, o `node` cuando el destino de exec está configurado como `node`).

## Depuración rápida

Usa el inspector para ver qué está haciendo OpenClaw _realmente_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Imprime:

- modo/alcance/acceso al espacio de trabajo efectivos del sandbox
- si la sesión está actualmente en sandbox (principal frente a no principal)
- permiso/denegación efectivos de herramientas de sandbox (y si provienen del agente/global/predeterminado)
- compuertas de elevated y rutas de claves para solucionarlo

## Sandbox: dónde se ejecutan las herramientas

El sandbox se controla mediante `agents.defaults.sandbox.mode`:

- `"off"`: todo se ejecuta en el host.
- `"non-main"`: solo las sesiones no principales están en sandbox (una "sorpresa" común en grupos/canales).
- `"all"`: todo está en sandbox.

Consulta [Sandboxing](/es/gateway/sandboxing) para ver la matriz completa (alcance, montajes del espacio de trabajo, imágenes).

### Montajes bind (comprobación rápida de seguridad)

- `docker.binds` _perfora_ el sistema de archivos del sandbox: lo que montes será visible dentro del contenedor con el modo que establezcas (`:ro` o `:rw`).
- El valor predeterminado es lectura-escritura si omites el modo; prefiere `:ro` para código fuente/secretos.
- `scope: "shared"` ignora los binds por agente (solo se aplican los binds globales).
- OpenClaw valida las fuentes de bind dos veces: primero en la ruta de origen normalizada y luego de nuevo tras resolver mediante el ancestro existente más profundo. Los escapes mediante padres con symlink no eluden las comprobaciones de rutas bloqueadas o raíces permitidas.
- Las rutas hoja inexistentes siguen comprobándose de forma segura. Si `/workspace/alias-out/new-file` se resuelve mediante un padre con symlink hacia una ruta bloqueada o fuera de las raíces permitidas configuradas, el bind se rechaza.
- Vincular `/var/run/docker.sock` entrega de forma efectiva el control del host al sandbox; hazlo solo intencionalmente.
- El acceso al espacio de trabajo (`workspaceAccess: "ro"`/`"rw"`) es independiente de los modos de bind.

## Política de herramientas: qué herramientas existen/se pueden invocar

Importan dos capas:

- **Perfil de herramientas**: `tools.profile` y `agents.list[].tools.profile` (lista base de permisos)
- **Perfil de herramientas del proveedor**: `tools.byProvider[provider].profile` y `agents.list[].tools.byProvider[provider].profile`
- **Política de herramientas global/por agente**: `tools.allow`/`tools.deny` y `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de herramientas del proveedor**: `tools.byProvider[provider].allow/deny` y `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de herramientas de sandbox** (solo se aplica cuando se está en sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` y `agents.list[].tools.sandbox.tools.*`

Reglas prácticas:

- `deny` siempre gana.
- Si `allow` no está vacío, todo lo demás se trata como bloqueado.
- La política de herramientas es el bloqueo definitivo: `/exec` no puede anular una herramienta `exec` denegada.
- La política de herramientas filtra la disponibilidad de herramientas por nombre; no inspecciona efectos secundarios dentro de `exec`. Si `exec` está permitido, denegar `write`, `edit` o `apply_patch` no hace que los comandos de shell sean de solo lectura.
- `/exec` solo cambia los valores predeterminados de sesión para remitentes autorizados; no concede acceso a herramientas.
  Las claves de herramientas de proveedor aceptan `provider` (por ejemplo, `google-antigravity`) o `provider/model` (por ejemplo, `openai/gpt-5.4`).

### Grupos de herramientas (atajos)

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
  Para agentes de solo lectura, deniega `group:runtime` además de las herramientas mutadoras del sistema de archivos, a menos que la política del sistema de archivos del sandbox o un límite de host separado aplique la restricción de solo lectura.
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

- Si estás en sandbox, `/elevated on` (o `exec` con `elevated: true`) se ejecuta fuera del sandbox (las aprobaciones pueden seguir aplicándose).
- Usa `/elevated full` para omitir las aprobaciones de exec en la sesión.
- Si ya estás ejecutando directamente, elevated es efectivamente una no-op (sigue estando controlado por compuertas).
- Elevated **no** tiene alcance de Skills y **no** anula allow/deny de herramientas.
- Elevated no concede anulaciones arbitrarias entre hosts desde `host=auto`; sigue las reglas normales del destino de exec y solo conserva `node` cuando el destino configurado/de sesión ya es `node`.
- `/exec` está separado de elevated. Solo ajusta los valores predeterminados de exec por sesión para remitentes autorizados.

Compuertas:

- Habilitación: `tools.elevated.enabled` (y opcionalmente `agents.list[].tools.elevated.enabled`)
- Listas de remitentes permitidos: `tools.elevated.allowFrom.<provider>` (y opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulta [Modo Elevated](/es/tools/elevated).

## Correcciones comunes de "cárcel de sandbox"

### "Herramienta X bloqueada por la política de herramientas de sandbox"

Claves para solucionarlo (elige una):

- Deshabilitar sandbox: `agents.defaults.sandbox.mode=off` (o por agente `agents.list[].sandbox.mode=off`)
- Permitir la herramienta dentro del sandbox:
  - eliminarla de `tools.sandbox.tools.deny` (o por agente `agents.list[].tools.sandbox.tools.deny`)
  - o añadirla a `tools.sandbox.tools.allow` (o permiso por agente)

### "Pensé que esto era principal, ¿por qué está en sandbox?"

En modo `"non-main"`, las claves de grupo/canal _no_ son principales. Usa la clave de sesión principal (mostrada por `sandbox explain`) o cambia el modo a `"off"`.

## Relacionado

- [Sandboxing](/es/gateway/sandboxing) -- referencia completa de sandbox (modos, alcances, backends, imágenes)
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente y precedencia
- [Modo Elevated](/es/tools/elevated)
