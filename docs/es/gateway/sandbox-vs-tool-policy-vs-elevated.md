---
read_when: You hit 'sandbox jail' or see a tool/elevated refusal and want the exact config key to change.
status: active
summary: 'Por qué una herramienta está bloqueada: entorno de ejecución de sandbox, política de permitir/denegar herramientas y controles de exec elevado'
title: Sandbox vs política de herramientas vs elevado
x-i18n:
    generated_at: "2026-04-24T05:30:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 74bb73023a3f7a85a0c020b2e8df69610ab8f8e60f8ab6142f8da7810dc08429
    source_path: gateway/sandbox-vs-tool-policy-vs-elevated.md
    workflow: 15
---

OpenClaw tiene tres controles relacionados (pero distintos):

1. **Sandbox** (`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`) decide **dónde se ejecutan las herramientas** (backend sandbox vs host).
2. **Política de herramientas** (`tools.*`, `tools.sandbox.tools.*`, `agents.list[].tools.*`) decide **qué herramientas están disponibles/permitidas**.
3. **Elevado** (`tools.elevated.*`, `agents.list[].tools.elevated.*`) es una **vía de escape solo para exec** para ejecutar fuera del sandbox cuando estás en sandbox (`gateway` de forma predeterminada, o `node` cuando el destino de exec está configurado en `node`).

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
- si la sesión está actualmente en sandbox (principal vs no principal)
- permitir/denegar efectivo de herramientas en sandbox (y si provino de agente/global/predeterminado)
- controles elevados y rutas de clave para corregir

## Sandbox: dónde se ejecutan las herramientas

El sandboxing se controla con `agents.defaults.sandbox.mode`:

- `"off"`: todo se ejecuta en el host.
- `"non-main"`: solo las sesiones no principales están en sandbox (la “sorpresa” común en grupos/canales).
- `"all"`: todo está en sandbox.

Consulta [Sandboxing](/es/gateway/sandboxing) para ver la matriz completa (alcance, montajes del espacio de trabajo, imágenes).

### Montajes bind (comprobación rápida de seguridad)

- `docker.binds` _atraviesa_ el sistema de archivos del sandbox: todo lo que montes será visible dentro del contenedor con el modo que establezcas (`:ro` o `:rw`).
- El valor predeterminado es lectura-escritura si omites el modo; prefiere `:ro` para código fuente/secretos.
- `scope: "shared"` ignora montajes por agente (solo se aplican los montajes globales).
- OpenClaw valida los orígenes bind dos veces: primero en la ruta de origen normalizada y luego otra vez después de resolver a través del ancestro existente más profundo. Los escapes mediante symlink-parent no eluden las comprobaciones de ruta bloqueada o raíz permitida.
- Las rutas hoja no existentes siguen comprobándose de forma segura. Si `/workspace/alias-out/new-file` se resuelve a través de un padre con symlink hacia una ruta bloqueada o fuera de las raíces permitidas configuradas, el bind se rechaza.
- Vincular `/var/run/docker.sock` entrega de hecho el control del host al sandbox; hazlo solo intencionalmente.
- El acceso al espacio de trabajo (`workspaceAccess: "ro"`/`"rw"`) es independiente de los modos bind.

## Política de herramientas: qué herramientas existen/se pueden llamar

Importan dos capas:

- **Perfil de herramientas**: `tools.profile` y `agents.list[].tools.profile` (allowlist base)
- **Perfil de herramientas por proveedor**: `tools.byProvider[provider].profile` y `agents.list[].tools.byProvider[provider].profile`
- **Política global/por agente de herramientas**: `tools.allow`/`tools.deny` y `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **Política de herramientas por proveedor**: `tools.byProvider[provider].allow/deny` y `agents.list[].tools.byProvider[provider].allow/deny`
- **Política de herramientas de sandbox** (solo se aplica cuando hay sandbox): `tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` y `agents.list[].tools.sandbox.tools.*`

Reglas generales:

- `deny` siempre gana.
- Si `allow` no está vacío, todo lo demás se trata como bloqueado.
- La política de herramientas es la parada definitiva: `/exec` no puede sobrescribir una herramienta `exec` denegada.
- `/exec` solo cambia valores predeterminados de sesión para remitentes autorizados; no concede acceso a herramientas.
  Las claves de herramientas por proveedor aceptan `provider` (p. ej. `google-antigravity`) o `provider/model` (p. ej. `openai/gpt-5.4`).

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
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:agents`: `agents_list`
- `group:media`: `image`, `image_generate`, `video_generate`, `tts`
- `group:openclaw`: todas las herramientas integradas de OpenClaw (excluye Plugins de proveedor)

## Elevado: solo exec "ejecutar en host"

El modo elevado **no** concede herramientas adicionales; solo afecta a `exec`.

- Si estás en sandbox, `/elevated on` (o `exec` con `elevated: true`) se ejecuta fuera del sandbox (puede seguir requiriendo aprobaciones).
- Usa `/elevated full` para omitir aprobaciones de exec para la sesión.
- Si ya estás ejecutándote directamente, elevado es en la práctica un no-op (aunque sigue teniendo controles).
- Elevado **no** tiene alcance de Skill y **no** sobrescribe permitir/denegar de herramientas.
- Elevado no concede sobrescrituras arbitrarias entre hosts desde `host=auto`; sigue las reglas normales del destino de exec y solo conserva `node` cuando el destino configurado/de sesión ya es `node`.
- `/exec` es independiente de elevado. Solo ajusta valores predeterminados de exec por sesión para remitentes autorizados.

Controles:

- Habilitación: `tools.elevated.enabled` (y opcionalmente `agents.list[].tools.elevated.enabled`)
- Allowlists de remitentes: `tools.elevated.allowFrom.<provider>` (y opcionalmente `agents.list[].tools.elevated.allowFrom.<provider>`)

Consulta [Modo elevado](/es/tools/elevated).

## Correcciones comunes de "sandbox jail"

### "La herramienta X está bloqueada por la política de herramientas del sandbox"

Claves de corrección (elige una):

- Deshabilitar sandbox: `agents.defaults.sandbox.mode=off` (o por agente `agents.list[].sandbox.mode=off`)
- Permitir la herramienta dentro del sandbox:
  - eliminarla de `tools.sandbox.tools.deny` (o por agente `agents.list[].tools.sandbox.tools.deny`)
  - o añadirla a `tools.sandbox.tools.allow` (o al allow por agente)

### "Pensé que esto era main, ¿por qué está en sandbox?"

En modo `"non-main"`, las claves de grupo/canal _no_ son principales. Usa la clave de sesión principal (mostrada por `sandbox explain`) o cambia el modo a `"off"`.

## Relacionado

- [Sandboxing](/es/gateway/sandboxing) -- referencia completa de sandbox (modos, alcances, backends, imágenes)
- [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) -- sobrescrituras por agente y precedencia
- [Modo elevado](/es/tools/elevated)
