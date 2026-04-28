---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox y restricciones de herramientas por agente, precedencia y ejemplos
title: Sandbox y herramientas multiagente
x-i18n:
    generated_at: "2026-04-26T11:39:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

Cada agente en una configuración multiagente puede reemplazar la política global de sandbox y herramientas. Esta página cubre la configuración por agente, las reglas de precedencia y ejemplos.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/es/gateway/sandboxing">
    Backends y modos — referencia completa del sandbox.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated">
    Depura “¿por qué está bloqueado esto?”
  </Card>
  <Card title="Elevated mode" href="/es/tools/elevated">
    Ejecución elevated para remitentes de confianza.
  </Card>
</CardGroup>

<Warning>
La autenticación es por agente: cada agente lee de su propio almacén de autenticación `agentDir` en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Las credenciales **no** se comparten entre agentes. Nunca reutilices `agentDir` entre agentes. Si quieres compartir credenciales, copia `auth-profiles.json` en el `agentDir` del otro agente.
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

    - agente `main`: se ejecuta en el host, acceso completo a herramientas.
    - agente `family`: se ejecuta en Docker (un contenedor por agente), solo la herramienta `read`.

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

    - los agentes predeterminados obtienen herramientas de programación.
    - el agente `support` es solo de mensajería (+ herramienta Slack).

  </Accordion>
  <Accordion title="Ejemplo 3: Diferentes modos de sandbox por agente">
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

Cuando existen configuraciones globales (`agents.defaults.*`) y específicas del agente (`agents.list[].*`):

### Configuración de sandbox

Los ajustes específicos del agente reemplazan a los globales:

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
`agents.list[].sandbox.{docker,browser,prune}.*` reemplaza a `agents.defaults.sandbox.{docker,browser,prune}.*` para ese agente (se ignora cuando el alcance del sandbox se resuelve a `"shared"`).
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
  <Step title="Política de herramientas del sandbox">
    `tools.sandbox.tools` o `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Política de herramientas de subagente">
    `tools.subagents.tools`, si corresponde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Reglas de precedencia">
    - Cada nivel puede restringir más las herramientas, pero no puede volver a conceder herramientas denegadas por niveles anteriores.
    - Si `agents.list[].tools.sandbox.tools` está establecido, reemplaza a `tools.sandbox.tools` para ese agente.
    - Si `agents.list[].tools.profile` está establecido, reemplaza a `tools.profile` para ese agente.
    - Las claves de herramientas del proveedor aceptan `provider` (por ejemplo, `google-antigravity`) o `provider/model` (por ejemplo, `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Comportamiento de una lista de permitidos vacía">
    Si alguna lista de permitidos explícita en esa cadena deja la ejecución sin herramientas invocables, OpenClaw se detiene antes de enviar el prompt al modelo. Esto es intencional: un agente configurado con una herramienta inexistente como `agents.list[].tools.allow: ["query_db"]` debe fallar de forma explícita hasta que esté habilitado el plugin que registra `query_db`, y no continuar como un agente solo de texto.
  </Accordion>
</AccordionGroup>

Las políticas de herramientas admiten abreviaturas `group:*` que se expanden a varias herramientas. Consulta [Grupos de herramientas](/es/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) para ver la lista completa.

Los reemplazos per-agent de elevated (`agents.list[].tools.elevated`) pueden restringir aún más la ejecución elevated para agentes específicos. Consulta [Elevated mode](/es/tools/elevated) para más detalles.

---

## Migración desde un solo agente

<Tabs>
  <Tab title="Antes (un solo agente)">
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
Las configuraciones heredadas `agent.*` son migradas por `openclaw doctor`; en adelante, prefiere `agents.defaults` + `agents.list`.
</Note>

---

## Ejemplos de restricción de herramientas

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

    `sessions_history` en este perfil sigue devolviendo una vista de recuperación delimitada y saneada en lugar de un volcado sin procesar de la transcripción. La recuperación del asistente elimina etiquetas de razonamiento, andamiaje de `<relevant-memories>`, cargas XML de llamadas de herramientas en texto sin formato (incluyendo `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques de llamadas de herramientas truncados), andamiaje degradado de llamadas de herramientas, tokens de control del modelo filtrados en ASCII/de ancho completo y XML malformado de llamadas de herramientas de MiniMax antes de la redacción/truncamiento.

  </Tab>
</Tabs>

---

## Error común: `"non-main"`

<Warning>
`agents.defaults.sandbox.mode: "non-main"` se basa en `session.mainKey` (predeterminado: `"main"`), no en el id del agente. Las sesiones de grupo/canal siempre obtienen sus propias claves, por lo que se tratan como no principales y se aislarán en sandbox. Si quieres que un agente nunca use sandbox, establece `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Pruebas

Después de configurar el sandbox multiagente y las herramientas:

<Steps>
  <Step title="Comprobar resolución del agente">
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
    - Comprueba si hay un `agents.defaults.sandbox.mode` global que lo reemplace.
    - La configuración específica del agente tiene prioridad, así que establece `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Las herramientas siguen disponibles a pesar de la lista deny">
    - Comprueba el orden de filtrado de herramientas: global → agente → sandbox → subagente.
    - Cada nivel solo puede restringir más, no volver a conceder acceso.
    - Verifica con los registros: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="El contenedor no está aislado por agente">
    - Establece `scope: "agent"` en la configuración de sandbox específica del agente.
    - El valor predeterminado es `"session"`, que crea un contenedor por sesión.

  </Accordion>
</AccordionGroup>

---

## Relacionado

- [Elevated mode](/es/tools/elevated)
- [Enrutamiento multiagente](/es/concepts/multi-agent)
- [Configuración de sandbox](/es/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs tool policy vs elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated) — depuración de “¿por qué está bloqueado esto?”
- [Sandboxing](/es/gateway/sandboxing) — referencia completa del sandbox (modos, alcances, backends, imágenes)
- [Gestión de sesiones](/es/concepts/session)
