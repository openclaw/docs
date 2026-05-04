---
read_when:
    - Configuración de grupos de difusión
    - Depuración de respuestas multiagente en WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Difundir un mensaje de WhatsApp a varios agentes
title: Grupos de difusión
x-i18n:
    generated_at: "2026-05-04T02:21:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab43d3c3ffddb360340469433d74a380fbab98e662b2463a54f62eafc375b55
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Estado:** Experimental. Añadido en 2026.1.9.
</Note>

## Descripción general

Los grupos de difusión permiten que varios agentes procesen y respondan al mismo mensaje simultáneamente. Esto te permite crear equipos de agentes especializados que trabajan juntos en un único grupo o DM de WhatsApp, todo usando un solo número de teléfono.

Alcance actual: **solo WhatsApp** (canal web).

Los grupos de difusión se evalúan después de las listas de permitidos del canal y las reglas de activación de grupos. En los grupos de WhatsApp, esto significa que las difusiones ocurren cuando OpenClaw normalmente respondería (por ejemplo: al mencionarlo, según la configuración de tu grupo).

## Casos de uso

<AccordionGroup>
  <Accordion title="1. Equipos de agentes especializados">
    Implementa varios agentes con responsabilidades atómicas y enfocadas:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Cada agente procesa el mismo mensaje y aporta su perspectiva especializada.

  </Accordion>
  <Accordion title="2. Soporte multilingüe">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Flujos de aseguramiento de calidad">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Automatización de tareas">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## Configuración

### Configuración básica

Añade una sección `broadcast` de nivel superior (junto a `bindings`). Las claves son ids de pares de WhatsApp:

- chats grupales: JID del grupo (p. ej., `120363403215116621@g.us`)
- DM: número de teléfono E.164 (p. ej., `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Resultado:** Cuando OpenClaw respondería en este chat, ejecutará los tres agentes.

### Estrategia de procesamiento

Controla cómo los agentes procesan los mensajes:

<Tabs>
  <Tab title="parallel (predeterminado)">
    Todos los agentes procesan simultáneamente:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    Los agentes procesan en orden (uno espera a que el anterior termine):

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

### Ejemplo completo

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Cómo funciona

### Flujo de mensajes

<Steps>
  <Step title="Llega un mensaje entrante">
    Llega un mensaje de un grupo o DM de WhatsApp.
  </Step>
  <Step title="Comprobación de difusión">
    El sistema comprueba si el ID de par está en `broadcast`.
  </Step>
  <Step title="Si está en la lista de difusión">
    - Todos los agentes listados procesan el mensaje.
    - Cada agente tiene su propia clave de sesión y contexto aislado.
    - Los agentes procesan en paralelo (predeterminado) o secuencialmente.

  </Step>
  <Step title="Si no está en la lista de difusión">
    Se aplica el enrutamiento normal (primer binding coincidente).
  </Step>
</Steps>

<Note>
Los grupos de difusión no omiten las listas de permitidos del canal ni las reglas de activación de grupos (menciones/comandos/etc.). Solo cambian _qué agentes se ejecutan_ cuando un mensaje es apto para procesamiento.
</Note>

### Aislamiento de sesiones

Cada agente en un grupo de difusión mantiene completamente separados:

- **Claves de sesión** (`agent:alfred:whatsapp:group:120363...` frente a `agent:baerbel:whatsapp:group:120363...`)
- **Historial de conversación** (el agente no ve los mensajes de otros agentes)
- **Workspace** (sandboxes separados si están configurados)
- **Acceso a herramientas** (listas de permitir/denegar diferentes)
- **Memoria/contexto** (IDENTITY.md, SOUL.md, etc. separados)
- **Búfer de contexto del grupo** (mensajes recientes del grupo usados como contexto) se comparte por par, por lo que todos los agentes de difusión ven el mismo contexto cuando se activan

Esto permite que cada agente tenga:

- Personalidades diferentes
- Acceso a herramientas diferente (p. ej., solo lectura frente a lectura y escritura)
- Modelos diferentes (p. ej., opus frente a sonnet)
- Skills diferentes instaladas

### Ejemplo: sesiones aisladas

En el grupo `120363403215116621@g.us` con los agentes `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Contexto de Alfred">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Contexto de Bärbel">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Mejores prácticas

<AccordionGroup>
  <Accordion title="1. Mantén los agentes enfocados">
    Diseña cada agente con una responsabilidad única y clara:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Bueno:** Cada agente tiene una tarea. ❌ **Malo:** Un agente genérico "dev-helper".

  </Accordion>
  <Accordion title="2. Usa nombres descriptivos">
    Deja claro qué hace cada agente:

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. Configura acceso diferente a herramientas">
    Da a los agentes solo las herramientas que necesitan:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` es de solo lectura. `fixer` puede leer y escribir.

  </Accordion>
  <Accordion title="4. Supervisa el rendimiento">
    Con muchos agentes, considera:

    - Usar `"strategy": "parallel"` (predeterminado) para mayor velocidad
    - Limitar los grupos de difusión a 5-10 agentes
    - Usar modelos más rápidos para agentes más simples

  </Accordion>
  <Accordion title="5. Gestiona los fallos con elegancia">
    Los agentes fallan de forma independiente. El error de un agente no bloquea a los demás:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Compatibilidad

### Proveedores

Actualmente, los grupos de difusión funcionan con:

- ✅ WhatsApp (implementado)
- 🚧 Telegram (planificado)
- 🚧 Discord (planificado)
- 🚧 Slack (planificado)

### Enrutamiento

Los grupos de difusión funcionan junto con el enrutamiento existente:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: Solo responde alfred (enrutamiento normal).
- `GROUP_B`: agent1 Y agent2 responden (difusión).

<Note>
**Precedencia:** `broadcast` tiene prioridad sobre `bindings`.
</Note>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Los agentes no responden">
    **Comprueba:**

    1. Los IDs de agentes existen en `agents.list`.
    2. El formato del ID de par es correcto (p. ej., `120363403215116621@g.us`).
    3. Los agentes no están en listas de denegación.

    **Depuración:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Solo responde un agente">
    **Causa:** Es posible que el ID de par esté en `bindings`, pero no en `broadcast`.

    **Solución:** Añádelo a la configuración de difusión o elimínalo de los bindings.

  </Accordion>
  <Accordion title="Problemas de rendimiento">
    Si va lento con muchos agentes:

    - Reduce el número de agentes por grupo.
    - Usa modelos más ligeros (sonnet en lugar de opus).
    - Comprueba el tiempo de inicio del sandbox.

  </Accordion>
</AccordionGroup>

## Ejemplos

<AccordionGroup>
  <Accordion title="Ejemplo 1: Equipo de revisión de código">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    **El usuario envía:** Fragmento de código.

    **Respuestas:**

    - code-formatter: "Fixed indentation and added type hints"
    - security-scanner: "⚠️ SQL injection vulnerability in line 12"
    - test-coverage: "Coverage is 45%, missing tests for error cases"
    - docs-checker: "Missing docstring for function `process_data`"

  </Accordion>
  <Accordion title="Ejemplo 2: Soporte multilingüe">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## Referencia de API

### Esquema de configuración

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Campos

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  Cómo procesar los agentes. `parallel` ejecuta todos los agentes simultáneamente; `sequential` los ejecuta en orden de array.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID de grupo de WhatsApp, número E.164 u otro ID de par. El valor es el array de IDs de agentes que deben procesar los mensajes.
</ParamField>

## Limitaciones

1. **Máximo de agentes:** No hay un límite estricto, pero 10+ agentes pueden ser lentos.
2. **Contexto compartido:** Los agentes no ven las respuestas de los demás (por diseño).
3. **Orden de mensajes:** Las respuestas en paralelo pueden llegar en cualquier orden.
4. **Límites de tasa:** Todos los agentes cuentan para los límites de tasa de WhatsApp.

## Mejoras futuras

Funciones planificadas:

- [ ] Modo de contexto compartido (los agentes ven las respuestas de los demás)
- [ ] Coordinación de agentes (los agentes pueden enviarse señales entre sí)
- [ ] Selección dinámica de agentes (elige agentes según el contenido del mensaje)
- [ ] Prioridades de agentes (algunos agentes responden antes que otros)

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing)
- [Grupos](/es/channels/groups)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [Emparejamiento](/es/channels/pairing)
- [Gestión de sesiones](/es/concepts/session)
