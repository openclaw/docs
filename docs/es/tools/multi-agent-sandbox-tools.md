---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: “Sandbox por agente + restricciones de herramientas, precedencia y ejemplos”
title: Sandbox y herramientas multiagente
x-i18n:
    generated_at: "2026-04-24T05:55:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7239e28825759efb060b821f87f5ebd9a7f3b720b30ff16dc076b186e47fcde9
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Configuración multiagente de sandbox y herramientas

Cada agente en una configuración multiagente puede sobrescribir la política global de sandbox y herramientas. Esta página cubre la configuración por agente, reglas de precedencia y ejemplos.

- **Backends y modos de sandbox**: consulta [Sandboxing](/es/gateway/sandboxing).
- **Depurar herramientas bloqueadas**: consulta [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) y `openclaw sandbox explain`.
- **Exec elevado**: consulta [Modo elevado](/es/tools/elevated).

La autenticación es por agente: cada agente lee de su propio almacén de autenticación `agentDir` en
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Las credenciales **no** se comparten entre agentes. Nunca reutilices `agentDir` entre agentes.
Si quieres compartir credenciales, copia `auth-profiles.json` en el `agentDir` del otro agente.

---

## Ejemplos de configuración

### Ejemplo 1: agente personal + agente familiar restringido

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**Resultado:**

- Agente `main`: se ejecuta en el host, acceso completo a herramientas
- Agente `family`: se ejecuta en Docker (un contenedor por agente), solo herramienta `read`

---

### Ejemplo 2: agente de trabajo con sandbox compartido

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### Ejemplo 2b: perfil global de coding + agente solo de mensajería

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**Resultado:**

- los agentes predeterminados obtienen herramientas de coding
- el agente `support` es solo de mensajería (+ herramienta Slack)

---

### Ejemplo 3: distintos modos de sandbox por agente

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // valor predeterminado global
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // sobrescritura: main nunca usa sandbox
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // sobrescritura: public siempre usa sandbox
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## Precedencia de configuración

Cuando existen configuraciones globales (`agents.defaults.*`) y específicas del agente (`agents.list[].*`):

### Configuración de sandbox

Los ajustes específicos del agente sobrescriben los globales:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Notas:**

- `agents.list[].sandbox.{docker,browser,prune}.*` sobrescribe `agents.defaults.sandbox.{docker,browser,prune}.*` para ese agente (se ignora cuando el alcance del sandbox se resuelve como `"shared"`).

### Restricciones de herramientas

El orden de filtrado es:

1. **Perfil de herramientas** (`tools.profile` o `agents.list[].tools.profile`)
2. **Perfil de herramientas del proveedor** (`tools.byProvider[provider].profile` o `agents.list[].tools.byProvider[provider].profile`)
3. **Política global de herramientas** (`tools.allow` / `tools.deny`)
4. **Política de herramientas del proveedor** (`tools.byProvider[provider].allow/deny`)
5. **Política de herramientas específica del agente** (`agents.list[].tools.allow/deny`)
6. **Política de proveedor del agente** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Política de herramientas del sandbox** (`tools.sandbox.tools` o `agents.list[].tools.sandbox.tools`)
8. **Política de herramientas de subagente** (`tools.subagents.tools`, si corresponde)

Cada nivel puede restringir más las herramientas, pero no puede volver a conceder herramientas denegadas por niveles anteriores.
Si `agents.list[].tools.sandbox.tools` está establecido, reemplaza `tools.sandbox.tools` para ese agente.
Si `agents.list[].tools.profile` está establecido, sobrescribe `tools.profile` para ese agente.
Las claves de herramientas por proveedor aceptan `provider` (por ejemplo `google-antigravity`) o `provider/model` (por ejemplo `openai/gpt-5.4`).

Las políticas de herramientas admiten abreviaturas `group:*` que se expanden a múltiples herramientas. Consulta [Grupos de herramientas](/es/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) para ver la lista completa.

Las sobrescrituras elevadas por agente (`agents.list[].tools.elevated`) pueden restringir aún más el exec elevado para agentes específicos. Consulta [Modo elevado](/es/tools/elevated) para ver detalles.

---

## Migración desde agente único

**Antes (agente único):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**Después (multiagente con perfiles diferentes):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

Las configuraciones heredadas `agent.*` son migradas por `openclaw doctor`; de ahora en adelante prefiere `agents.defaults` + `agents.list`.

---

## Ejemplos de restricción de herramientas

### Agente de solo lectura

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agente de ejecución segura (sin modificaciones de archivos)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agente solo de comunicación

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

`sessions_history` en este perfil sigue devolviendo una vista de recuperación acotada y saneada
en lugar de un volcado sin procesar de la transcripción. La recuperación del asistente elimina etiquetas de pensamiento,
scaffolding `<relevant-memories>`, cargas XML de llamada a herramientas en texto plano
(incluidas `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas),
scaffolding degradado de llamadas a herramientas, tokens de control del modelo
ASCII/de ancho completo filtrados y XML malformado de llamadas a herramientas de MiniMax antes de la redacción/truncado.

---

## Error habitual: "non-main"

`agents.defaults.sandbox.mode: "non-main"` se basa en `session.mainKey` (predeterminado `"main"`),
no en el id del agente. Las sesiones de grupo/canal siempre obtienen sus propias claves, así que
se tratan como no principales y usarán sandbox. Si quieres que un agente nunca use
sandbox, establece `agents.list[].sandbox.mode: "off"`.

---

## Pruebas

Después de configurar sandbox y herramientas multiagente:

1. **Comprobar la resolución del agente:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Verificar contenedores sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Probar restricciones de herramientas:**
   - Envía un mensaje que requiera herramientas restringidas
   - Verifica que el agente no pueda usar herramientas denegadas

4. **Supervisar logs:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Solución de problemas

### El agente no usa sandbox a pesar de `mode: "all"`

- Comprueba si hay un `agents.defaults.sandbox.mode` global que lo sobrescriba
- La configuración específica del agente tiene prioridad, así que establece `agents.list[].sandbox.mode: "all"`

### Las herramientas siguen disponibles a pesar de la lista deny

- Comprueba el orden de filtrado de herramientas: global → agente → sandbox → subagente
- Cada nivel solo puede restringir más, no volver a conceder
- Verifícalo con logs: `[tools] filtering tools for agent:${agentId}`

### El contenedor no está aislado por agente

- Establece `scope: "agent"` en la configuración específica del sandbox del agente
- El valor predeterminado es `"session"`, que crea un contenedor por sesión

---

## Relacionado

- [Sandboxing](/es/gateway/sandboxing) -- referencia completa de sandbox (modos, alcances, backends, imágenes)
- [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) -- depurar “¿por qué está bloqueado esto?”
- [Modo elevado](/es/tools/elevated)
- [Enrutamiento Multi-Agent](/es/concepts/multi-agent)
- [Configuración de Sandbox](/es/gateway/config-agents#agentsdefaultssandbox)
- [Gestión de sesiones](/es/concepts/session)
