---
read_when:
    - Configurar grupos de difusión
    - Depurar respuestas de varios agentes en WhatsApp
status: experimental
summary: Transmitir un mensaje de WhatsApp a varios agentes
title: Grupos de difusión
x-i18n:
    generated_at: "2026-04-24T05:18:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f3991348570170855158e82089fa073ca62b98855f443d4a227829d7c945ee
    source_path: channels/broadcast-groups.md
    workflow: 15
---

**Estado:** Experimental  
**Versión:** Añadido en 2026.1.9

## Resumen

Los grupos de difusión permiten que varios agentes procesen y respondan al mismo mensaje simultáneamente. Esto te permite crear equipos de agentes especializados que trabajan juntos en un solo grupo o DM de WhatsApp, todo usando un solo número de teléfono.

Alcance actual: **solo WhatsApp** (canal web).

Los grupos de difusión se evalúan después de las listas de permitidos del canal y las reglas de activación del grupo. En grupos de WhatsApp, esto significa que las difusiones ocurren cuando OpenClaw normalmente respondería (por ejemplo, ante una mención, según la configuración de tu grupo).

## Casos de uso

### 1. Equipos de agentes especializados

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

### 2. Soporte multilingüe

```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. Flujos de trabajo de aseguramiento de la calidad

```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. Automatización de tareas

```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## Configuración

### Configuración básica

Agrega una sección `broadcast` de nivel superior (junto a `bindings`). Las claves son IDs de peer de WhatsApp:

- chats de grupo: JID del grupo (por ejemplo, `120363403215116621@g.us`)
- DMs: número de teléfono E.164 (por ejemplo, `+15551234567`)

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

#### Paralelo (predeterminado)

Todos los agentes procesan simultáneamente:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Secuencial

Los agentes procesan en orden (uno espera a que termine el anterior):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

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

1. **Llega un mensaje entrante** a un grupo de WhatsApp
2. **Comprobación de difusión**: el sistema verifica si el ID del peer está en `broadcast`
3. **Si está en la lista de difusión**:
   - Todos los agentes listados procesan el mensaje
   - Cada agente tiene su propia clave de sesión y contexto aislado
   - Los agentes procesan en paralelo (predeterminado) o secuencialmente
4. **Si no está en la lista de difusión**:
   - Se aplica el enrutamiento normal (primer binding coincidente)

Nota: los grupos de difusión no omiten las listas de permitidos del canal ni las reglas de activación del grupo (menciones/comandos/etc.). Solo cambian _qué agentes se ejecutan_ cuando un mensaje es apto para procesarse.

### Aislamiento de sesiones

Cada agente en un grupo de difusión mantiene completamente separados:

- **Claves de sesión** (`agent:alfred:whatsapp:group:120363...` frente a `agent:baerbel:whatsapp:group:120363...`)
- **Historial de conversación** (el agente no ve los mensajes de otros agentes)
- **Espacio de trabajo** (sandboxes separados si están configurados)
- **Acceso a herramientas** (distintas listas de permitir/denegar)
- **Memoria/contexto** (`IDENTITY.md`, `SOUL.md`, etc. separados)
- **Búfer de contexto del grupo** (mensajes recientes del grupo usados como contexto) se comparte por peer, por lo que todos los agentes de difusión ven el mismo contexto cuando se activan

Esto permite que cada agente tenga:

- Personalidades diferentes
- Diferente acceso a herramientas (por ejemplo, solo lectura frente a lectura-escritura)
- Modelos diferentes (por ejemplo, opus frente a sonnet)
- Distintas Skills instaladas

### Ejemplo: sesiones aisladas

En el grupo `120363403215116621@g.us` con agentes `["alfred", "baerbel"]`:

**Contexto de Alfred:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**Contexto de Bärbel:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/user/openclaw-baerbel/
Tools: read only
```

## Buenas prácticas

### 1. Mantén a los agentes enfocados

Diseña cada agente con una responsabilidad única y clara:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Bien:** cada agente tiene un trabajo  
❌ **Mal:** un agente genérico "dev-helper"

### 2. Usa nombres descriptivos

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

### 3. Configura diferente acceso a herramientas

Da a los agentes solo las herramientas que necesitan:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Solo lectura
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Lectura-escritura
    }
  }
}
```

### 4. Supervisa el rendimiento

Con muchos agentes, considera:

- Usar `"strategy": "parallel"` (predeterminado) por velocidad
- Limitar los grupos de difusión a 5-10 agentes
- Usar modelos más rápidos para agentes más simples

### 5. Gestiona los fallos con elegancia

Los agentes fallan de forma independiente. El error de un agente no bloquea a los demás:

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## Compatibilidad

### Proveedores

Los grupos de difusión actualmente funcionan con:

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

- `GROUP_A`: solo responde alfred (enrutamiento normal)
- `GROUP_B`: responden agent1 Y agent2 (difusión)

**Precedencia:** `broadcast` tiene prioridad sobre `bindings`.

## Solución de problemas

### Los agentes no responden

**Comprueba:**

1. Los IDs de agente existen en `agents.list`
2. El formato del ID del peer es correcto (por ejemplo, `120363403215116621@g.us`)
3. Los agentes no están en listas de denegación

**Depuración:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Solo responde un agente

**Causa:** el ID del peer podría estar en `bindings` pero no en `broadcast`.

**Solución:** agrégalo a la configuración de difusión o elimínalo de `bindings`.

### Problemas de rendimiento

**Si va lento con muchos agentes:**

- Reduce el número de agentes por grupo
- Usa modelos más ligeros (sonnet en lugar de opus)
- Comprueba el tiempo de arranque del sandbox

## Ejemplos

### Ejemplo 1: equipo de revisión de código

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

**El usuario envía:** fragmento de código  
**Respuestas:**

- code-formatter: "Corregí la indentación y añadí anotaciones de tipo"
- security-scanner: "⚠️ Vulnerabilidad de inyección SQL en la línea 12"
- test-coverage: "La cobertura es del 45%; faltan pruebas para casos de error"
- docs-checker: "Falta un docstring para la función `process_data`"

### Ejemplo 2: soporte multilingüe

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

## Referencia de la API

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

- `strategy` (opcional): cómo procesar los agentes
  - `"parallel"` (predeterminado): todos los agentes procesan simultáneamente
  - `"sequential"`: los agentes procesan en el orden del array
- `[peerId]`: JID de grupo de WhatsApp, número E.164 u otro ID de peer
  - Valor: array de IDs de agente que deben procesar mensajes

## Limitaciones

1. **Máximo de agentes:** no hay un límite estricto, pero 10+ agentes pueden ir lentos
2. **Contexto compartido:** los agentes no ven las respuestas de los demás (por diseño)
3. **Orden de los mensajes:** las respuestas en paralelo pueden llegar en cualquier orden
4. **Límites de tasa:** todos los agentes cuentan para los límites de tasa de WhatsApp

## Mejoras futuras

Funciones planificadas:

- [ ] Modo de contexto compartido (los agentes ven las respuestas de los demás)
- [ ] Coordinación entre agentes (los agentes pueden enviarse señales entre sí)
- [ ] Selección dinámica de agentes (elegir agentes según el contenido del mensaje)
- [ ] Prioridades de agentes (algunos agentes responden antes que otros)

## Relacionado

- [Groups](/es/channels/groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Emparejamiento](/es/channels/pairing)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [Gestión de sesiones](/es/concepts/session)
