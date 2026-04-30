---
read_when:
    - Configurar grupos de difusión
    - Depuración de respuestas multiagente en WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Difunde un mensaje de WhatsApp a varios agentes
title: Grupos de difusión
x-i18n:
    generated_at: "2026-04-30T05:27:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0de4ccc85bf79e2ceb1dddd60db067309b15b7f876c92e7d591ff0b4b4315ec
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Estado:** Experimental. Añadido en 2026.1.9.
</Note>

## Descripción general

Los grupos de difusión permiten que varios agentes procesen y respondan al mismo mensaje simultáneamente. Esto te permite crear equipos de agentes especializados que trabajan juntos en un único grupo de WhatsApp o DM — todos usando un solo número de teléfono.

Alcance actual: **solo WhatsApp** (canal web).

Los grupos de difusión se evalúan después de las listas de permitidos del canal y las reglas de activación de grupos. En los grupos de WhatsApp, esto significa que las difusiones ocurren cuando OpenClaw normalmente respondería (por ejemplo: al recibir una mención, según la configuración de tu grupo).

## Casos de uso

<AccordionGroup>
  <Accordion title="1. Equipos de agentes especializados">
    Despliega varios agentes con responsabilidades atómicas y enfocadas:

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
  <Accordion title="2. Compatibilidad multilingüe">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Flujos de trabajo de control de calidad">
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

Añade una sección `broadcast` de nivel superior (junto a `bindings`). Las claves son los IDs de pares de WhatsApp:

- chats de grupo: JID de grupo (p. ej. `120363403215116621@g.us`)
- DMs: número de teléfono E.164 (p. ej. `+15551234567`)

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
    Llega un mensaje de grupo de WhatsApp o DM.
  </Step>
  <Step title="Comprobación de difusión">
    El sistema comprueba si el ID del par está en `broadcast`.
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
Los grupos de difusión no omiten las listas de permitidos del canal ni las reglas de activación de grupos (menciones/comandos/etc.). Solo cambian _qué agentes se ejecutan_ cuando un mensaje es elegible para procesamiento.
</Note>

### Aislamiento de sesiones

Cada agente en un grupo de difusión mantiene completamente separados:

- **Claves de sesión** (`agent:alfred:whatsapp:group:120363...` frente a `agent:baerbel:whatsapp:group:120363...`)
- **Historial de conversación** (el agente no ve los mensajes de otros agentes)
- **Workspace** (sandboxes separados si están configurados)
- **Acceso a herramientas** (diferentes listas de permitir/denegar)
- **Memoria/contexto** (IDENTITY.md, SOUL.md, etc. separados)
- **Búfer de contexto de grupo** (mensajes recientes del grupo usados como contexto) se comparte por par, por lo que todos los agentes de difusión ven el mismo contexto cuando se activan

Esto permite que cada agente tenga:

- Personalidades diferentes
- Acceso a herramientas diferente (p. ej., solo lectura frente a lectura y escritura)
- Modelos diferentes (p. ej., opus frente a sonnet)
- Skills diferentes instaladas

### Ejemplo: sesiones aisladas

En el grupo `120363403215116621@g.us` con agentes `["alfred", "baerbel"]`:

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

## Prácticas recomendadas

<AccordionGroup>
  <Accordion title="1. Mantén los agentes enfocados">
    Diseña cada agente con una única responsabilidad clara:

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
  <Accordion title="3. Configura distintos accesos a herramientas">
    Da a los agentes solo las herramientas que necesitan:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Read-only
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
        }
      }
    }
    ```

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
- `GROUP_B`: responden agent1 Y agent2 (difusión).

<Note>
**Precedencia:** `broadcast` tiene prioridad sobre `bindings`.
</Note>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Los agentes no responden">
    **Comprueba:**

    1. Los IDs de agente existen en `agents.list`.
    2. El formato del ID del par es correcto (p. ej., `120363403215116621@g.us`).
    3. Los agentes no están en listas de denegación.

    **Depuración:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Solo responde un agente">
    **Causa:** Puede que el ID del par esté en `bindings` pero no en `broadcast`.

    **Solución:** Añádelo a la configuración de difusión o elimínalo de bindings.

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

    - code-formatter: "Se corrigió la sangría y se añadieron anotaciones de tipo"
    - security-scanner: "⚠️ Vulnerabilidad de inyección SQL en la línea 12"
    - test-coverage: "La cobertura es del 45 %, faltan pruebas para casos de error"
    - docs-checker: "Falta docstring para la función `process_data`"

  </Accordion>
  <Accordion title="Ejemplo 2: Compatibilidad multilingüe">
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
  Cómo procesar agentes. `parallel` ejecuta todos los agentes simultáneamente; `sequential` los ejecuta en el orden del array.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID de grupo de WhatsApp, número E.164 u otro ID de par. El valor es el array de IDs de agentes que deben procesar mensajes.
</ParamField>

## Limitaciones

1. **Máximo de agentes:** No hay límite estricto, pero más de 10 agentes puede ser lento.
2. **Contexto compartido:** Los agentes no ven las respuestas de los demás (por diseño).
3. **Orden de mensajes:** Las respuestas paralelas pueden llegar en cualquier orden.
4. **Límites de frecuencia:** Todos los agentes cuentan para los límites de frecuencia de WhatsApp.

## Mejoras futuras

Funciones planificadas:

- [ ] Modo de contexto compartido (los agentes ven las respuestas de los demás)
- [ ] Coordinación de agentes (los agentes pueden enviarse señales entre sí)
- [ ] Selección dinámica de agentes (elegir agentes según el contenido del mensaje)
- [ ] Prioridades de agentes (algunos agentes responden antes que otros)

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing)
- [Grupos](/es/channels/groups)
- [Herramientas de entorno aislado multiagente](/es/tools/multi-agent-sandbox-tools)
- [Emparejamiento](/es/channels/pairing)
- [Gestión de sesiones](/es/concepts/session)
