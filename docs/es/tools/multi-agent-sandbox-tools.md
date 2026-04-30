---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Entorno aislado por agente + restricciones de herramientas, precedencia y ejemplos
title: Entorno aislado y herramientas multiagente
x-i18n:
    generated_at: "2026-04-30T06:05:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Cada agente en una configuración multiagente puede anular la política global de sandbox y herramientas. Esta página cubre la configuración por agente, las reglas de precedencia y ejemplos.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/es/gateway/sandboxing">
    Backends y modos: referencia completa de sandbox.
  </Card>
  <Card title="Sandbox frente a política de herramientas frente a elevado" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated">
    Depurar "¿por qué está bloqueado esto?"
  </Card>
  <Card title="Modo elevado" href="/es/tools/elevated">
    Exec elevado para remitentes de confianza.
  </Card>
</CardGroup>

<Warning>
La autenticación está delimitada por agente: cada agente tiene su propio almacén de autenticación `agentDir` en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Nunca reutilices `agentDir` entre agentes. Los agentes pueden leer los perfiles de autenticación del agente predeterminado/principal cuando no tienen un perfil local, pero los tokens de actualización OAuth no se clonan en los almacenes de agentes secundarios. Si copias credenciales manualmente, copia solo perfiles estáticos portátiles `api_key` o `token`.
</Warning>

---

## Ejemplos de configuración

<AccordionGroup>
  <Accordion title="Ejemplo 1: Agente personal + agente familiar restringido">
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

    - Agente `main`: se ejecuta en el host, acceso completo a herramientas.
    - Agente `family`: se ejecuta en Docker (un contenedor por agente), solo la herramienta `read`.

  </Accordion>
  <Accordion title="Ejemplo 2: Agente de trabajo con sandbox compartido">
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
  </Accordion>
  <Accordion title="Ejemplo 2b: Perfil global de programación + agente solo de mensajería">
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

    - Los agentes predeterminados reciben herramientas de programación.
    - El agente `support` es solo de mensajería (+ herramienta Slack).

  </Accordion>
  <Accordion title="Ejemplo 3: Modos de sandbox diferentes por agente">
    ```json
    {
      "agents": {
        "defaults": {
          "sandbox": {
            "mode": "non-main",
            "scope": "session"
          }
        },
        "list": [
          {
            "id": "main",
            "workspace": "~/.openclaw/workspace",
            "sandbox": {
              "mode": "off"
            }
          },
          {
            "id": "public",
            "workspace": "~/.openclaw/workspace-public",
            "sandbox": {
              "mode": "all",
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
  </Accordion>
</AccordionGroup>

---

## Precedencia de configuración

Cuando existen configuraciones globales (`agents.defaults.*`) y específicas de agente (`agents.list[].*`):

### Configuración de sandbox

La configuración específica del agente anula la global:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` anula `agents.defaults.sandbox.{docker,browser,prune}.*` para ese agente (se ignora cuando el ámbito de sandbox se resuelve como `"shared"`).
</Note>

### Restricciones de herramientas

El orden de filtrado es:

<Steps>
  <Step title="Perfil de herramientas">
    `tools.profile` o `agents.list[].tools.profile`.
  </Step>
  <Step title="Perfil de herramientas del proveedor">
    `tools.byProvider[provider].profile` o `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Política global de herramientas">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Política de herramientas del proveedor">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Política de herramientas específica del agente">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Política de proveedor del agente">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Política de herramientas de sandbox">
    `tools.sandbox.tools` o `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Política de herramientas de subagente">
    `tools.subagents.tools`, si corresponde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Reglas de precedencia">
    - Cada nivel puede restringir más las herramientas, pero no puede volver a conceder herramientas denegadas en niveles anteriores.
    - Si se establece `agents.list[].tools.sandbox.tools`, reemplaza `tools.sandbox.tools` para ese agente.
    - Si se establece `agents.list[].tools.profile`, anula `tools.profile` para ese agente.
    - Las claves de herramientas de proveedor aceptan `provider` (por ejemplo, `google-antigravity`) o `provider/model` (por ejemplo, `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Comportamiento de una lista de permitidos vacía">
    Si alguna lista de permitidos explícita en esa cadena deja la ejecución sin herramientas invocables, OpenClaw se detiene antes de enviar el prompt al modelo. Esto es intencional: un agente configurado con una herramienta ausente como `agents.list[].tools.allow: ["query_db"]` debe fallar de forma evidente hasta que el Plugin que registra `query_db` esté habilitado, no continuar como agente solo de texto.
  </Accordion>
</AccordionGroup>

Las políticas de herramientas admiten abreviaturas `group:*` que se expanden a varias herramientas. Consulta [Grupos de herramientas](/es/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) para ver la lista completa.

Las anulaciones elevadas por agente (`agents.list[].tools.elevated`) pueden restringir aún más exec elevado para agentes específicos. Consulta [Modo elevado](/es/tools/elevated) para más detalles.

---

## Migración desde un agente único

<Tabs>
  <Tab title="Antes (agente único)">
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
  </Tab>
  <Tab title="Después (multiagente)">
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
  </Tab>
</Tabs>

<Note>
Las configuraciones heredadas `agent.*` se migran mediante `openclaw doctor`; de ahora en adelante, prefiere `agents.defaults` + `agents.list`.
</Note>

---

## Ejemplos de restricciones de herramientas

<Tabs>
  <Tab title="Agente de solo lectura">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Ejecución segura (sin modificaciones de archivos)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="Solo comunicación">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` en este perfil sigue devolviendo una vista de recuperación delimitada y saneada en lugar de un volcado sin procesar de la transcripción. La recuperación del asistente elimina etiquetas de pensamiento, andamiaje `<relevant-memories>`, cargas útiles XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), andamiaje degradado de llamadas a herramientas, tokens de control de modelo ASCII/de ancho completo filtrados y XML de llamadas a herramientas MiniMax mal formado antes de la redacción/truncamiento.

  </Tab>
</Tabs>

---

## Problema común: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` se basa en `session.mainKey` (valor predeterminado `"main"`), no en el id del agente. Las sesiones de grupo/canal siempre reciben sus propias claves, por lo que se tratan como no principales y se ejecutarán en sandbox. Si quieres que un agente nunca se ejecute en sandbox, establece `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Pruebas

Después de configurar sandbox y herramientas multiagente:

<Steps>
  <Step title="Comprobar la resolución de agentes">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Verificar contenedores de sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Probar restricciones de herramientas">
    - Envía un mensaje que requiera herramientas restringidas.
    - Verifica que el agente no pueda usar herramientas denegadas.

  </Step>
  <Step title="Supervisar registros">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Solución de problemas

<AccordionGroup>
  <Accordion title="El agente no está en sandbox a pesar de `mode: 'all'`">
    - Comprueba si hay un `agents.defaults.sandbox.mode` global que lo anule.
    - La configuración específica del agente tiene precedencia, así que establece `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Las herramientas siguen disponibles a pesar de la lista de denegados">
    - Comprueba el orden de filtrado de herramientas: global → agente → sandbox → subagente.
    - Cada nivel solo puede restringir más, no volver a conceder.
    - Verifica con registros: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="El contenedor no está aislado por agente">
    - Establece `scope: "agent"` en la configuración de sandbox específica del agente.
    - El valor predeterminado es `"session"`, que crea un contenedor por sesión.

  </Accordion>
</AccordionGroup>

---

## Relacionado

- [Modo elevado](/es/tools/elevated)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Configuración de sandbox](/es/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox frente a política de herramientas frente a elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated) — depuración de "¿por qué está bloqueado esto?"
- [Sandboxing](/es/gateway/sandboxing) — referencia completa de sandbox (modos, ámbitos, backends, imágenes)
- [Gestión de sesiones](/es/concepts/session)
