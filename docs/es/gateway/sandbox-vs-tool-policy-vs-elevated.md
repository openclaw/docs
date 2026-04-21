---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por qué una herramienta está bloqueada: entorno de ejecución de sandbox, política de permitir/denegar herramientas y controles de ejecución elevada'
title: Sandbox frente a política de herramientas frente a Elevated
x-i18n:
    generated_at: "2026-04-21T05:14:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: a85378343df0594be451212cb4c95b349a0cc7cd1f242b9306be89903a450db1
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

# Sandbox frente a política de herramientas frente a Elevated

OpenClaw tiene tres controles relacionados, pero distintos:

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dónde se ejecutan las herramientas** (backend de sandbox frente a host).
2. **Política de herramientas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **qué herramientas están disponibles/permitidas**.
3. **Elevated** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) es una **vía de escape solo para `exec`** para ejecutar fuera del sandbox cuando estás en sandbox (`gateway` de forma predeterminada, o `node` cuando el destino de ejecución está configurado como `node`).

## Depuración rápida

Usa el inspector para ver lo que OpenClaw está haciendo _realmente_:

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Muestra:

- modo/ámbito/acceso al Workspace efectivos del sandbox
- si la sesión está actualmente en sandbox (principal frente a no principal)
- permitir/denegar efectivo de herramientas en sandbox (y si vino de agente/global/predeterminado)
- controles de Elevated y rutas de claves para corregirlo

## Sandbox: dónde se ejecutan las herramientas

El sandbox se controla con `agents.defaults.sandbox.mode`:

- `"off"`: todo se ejecuta en el host.
- `"non-main"`: solo las sesiones no principales están en sandbox (sorpresa habitual en grupos/canales).
- `"all"`: todo está en sandbox.

Consulta [Sandboxing](/es/gateway/sandboxing) para ver la matriz completa (ámbito, montajes del Workspace, imágenes).

### Montajes bind (comprobación rápida de seguridad)

- `docker.binds` _atraviesa_ el sistema de archivos del sandbox: lo que montes será visible dentro del contenedor con el modo que configures (`:ro` o `:rw`).
- El valor predeterminado es lectura-escritura si omites el modo; prefiere `:ro` para código fuente/secretos.
- `scope: "shared"` ignora los montajes bind por agente (solo se aplican los montajes bind globales).
- OpenClaw valida las fuentes bind dos veces: primero en la ruta de origen normalizada y luego otra vez después de resolver a través del ancestro existente más profundo. Las fugas a través de padres con symlink no evitan las comprobaciones de rutas bloqueadas o raíces permitidas.
- Las rutas hoja inexistentes también se comprueban de forma segura. Si `/workspace/alias-out/new-file` se resuelve a través de un padre con symlink hacia una ruta bloqueada o fuera de las raíces permitidas configuradas, el bind se rechaza.
- Vincular `/var/run/docker.sock` equivale en la práctica a ceder el control del host al sandbox; hazlo solo intencionadamente.
- El acceso al Workspace (`workspaceAccess: "ro"`/`"rw"`) es independiente de los modos de bind.

## Política de herramientas: qué herramientas existen o pueden llamarse

Importan dos capas:

- **Perfil de herramientas**: `tools.profile` y `agents.list[].tools.profile` (lista base de permitidas)
- **Perfil de herramientas por proveedor**: `tools.byProvider[provider].profile` y `agents.list[].tools.byProvider[provider].profile`
- **Política global/por agente de herramientas**: `tools.allow`/`tools.deny` y `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de herramientas por proveedor**: `tools.byProvider[provider].allow/deny` y `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de herramientas de sandbox** (solo se aplica cuando hay sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` y `agents.list[].tools.sandbox.tools.*`

Reglas prácticas:

- `deny` siempre prevalece.
- Si `allow` no está vacío, todo lo demás se considera bloqueado.
- La política de herramientas es la barrera definitiva: `/exec` no puede anular una herramienta `exec` denegada.
- `/exec` solo cambia los valores predeterminados de sesión para remitentes autorizados; no concede acceso a herramientas.
  Las claves de herramientas por proveedor aceptan `provider` (por ejemplo, `google-antigravity`) o `provider/model` (por ejemplo, `openai/gpt-5.4`).

### Grupos de herramientas (abreviaturas)

Las políticas de herramientas (globales, por agente, de sandbox) admiten entradas `group:*` que se expanden a varias herramientas:

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

- `group:runtime`: `exec`, `process`, `code_execution` (`bash` se acepta como alias de `exec`)
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `x_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: todas las herramientas integradas de OpenClaw (excluye plugins de proveedor)

## Elevated: "ejecutar en el host" solo para exec

Elevated **no** concede herramientas adicionales; solo afecta a `exec`.

- Si estás en sandbox, `/elevated on` (o `exec` con `elevated: true`) se ejecuta fuera del sandbox (las aprobaciones pueden seguir aplicándose).
- Usa `/elevated full` para omitir aprobaciones de ejecución en la sesión.
- Si ya te estás ejecutando directamente, Elevated en la práctica no hace nada (aunque sigue estando controlado).
- Elevated **no** tiene alcance de Skills y **no** anula `allow`/`deny` de herramientas.
- Elevated no concede anulaciones arbitrarias entre hosts desde `host=auto`; sigue las reglas normales del destino de ejecución y solo preserva `node` cuando el destino configurado/de sesión ya es `node`.
- `/exec` es independiente de Elevated. Solo ajusta los valores predeterminados de `exec` por sesión para remitentes autorizados.

Controles:

- Habilitación: `tools.elevated.enabled` (y opcionalmente `agents.list[].tools.elevated.enabled`)
- Listas permitidas de remitentes: `tools.elevated.allowFrom.<provider>` (y opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulta [Elevated Mode](/es/tools/elevated).

## Soluciones habituales para la "cárcel del sandbox"

### "La herramienta X está bloqueada por la política de herramientas del sandbox"

Claves para corregirlo (elige una):

- Desactivar el sandbox: `agents.defaults.sandbox.mode=off` (o por agente `agents.list[].sandbox.mode=off`)
- Permitir la herramienta dentro del sandbox:
  - quitarla de `tools.sandbox.tools.deny` (o por agente `agents.list[].tools.sandbox.tools.deny`)
  - o añadirla a `tools.sandbox.tools.allow` (o a la lista permitida por agente)

### "Creía que esto era principal, ¿por qué está en sandbox?"

En el modo `"non-main"`, las claves de grupo/canal _no_ son principales. Usa la clave de sesión principal (mostrada por `sandbox explain`) o cambia el modo a `"off"`.

## Consulta también

- [Sandboxing](/es/gateway/sandboxing) -- referencia completa de sandbox (modos, ámbitos, backends, imágenes)
- [Multi-Agent Sandbox & Tools](/es/tools/multi-agent-sandbox-tools) -- anulaciones por agente y precedencia
- [Elevated Mode](/es/tools/elevated)
