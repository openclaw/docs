---
read_when:
    - Configuración de grupos de difusión
    - Depurar respuestas multiagente en WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Difunde un mensaje de WhatsApp a varios agentes
title: Grupos de difusión
x-i18n:
    generated_at: "2026-07-05T11:01:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Estado:** Experimental. Añadido en 2026.1.9. Solo WhatsApp (canal web).
</Note>

## Descripción general

Los grupos de difusión ejecutan **múltiples agentes** sobre el mismo mensaje entrante. Cada agente procesa el mensaje en su propia sesión aislada y publica su propia respuesta, de modo que un número de WhatsApp puede alojar un equipo de agentes especializados en un único chat de grupo o DM.

Los grupos de difusión se evalúan después de las listas de permitidos del canal y las reglas de activación de grupo. En los grupos de WhatsApp, las difusiones ocurren cuando OpenClaw respondería normalmente (por ejemplo: ante una mención, según la configuración del grupo). Solo cambian **qué agentes se ejecutan**, nunca si un mensaje es apto para procesarse.

La ruta de QA en vivo de WhatsApp incluye `whatsapp-broadcast-group-fanout`, que verifica que un mensaje de grupo con mención pueda producir respuestas visibles distintas de dos agentes configurados.

## Configuración

### Configuración básica

Añade una sección `broadcast` de nivel superior (junto a `bindings`). Las claves son ids de pares de WhatsApp; los valores son matrices de ids de agentes:

- chats de grupo: JID de grupo (p. ej., `120363403215116621@g.us`)
- DM: número de teléfono E.164 del remitente (p. ej., `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Resultado:** cuando OpenClaw respondería en este chat, ejecuta los tres agentes.

Cada id de agente listado debe existir en `agents.list`: la validación de configuración informa los ids desconocidos, y el runtime los omite con una advertencia `Broadcast agent <id> not found in agents.list; skipping`.

### Estrategia de procesamiento

`broadcast.strategy` define cómo procesan los agentes el mensaje:

| Estrategia             | Comportamiento                                                              |
| -------------------- | --------------------------------------------------------------------- |
| `parallel` (predeterminada) | Todos los agentes procesan simultáneamente; las respuestas llegan en cualquier orden.       |
| `sequential`         | Los agentes procesan en el orden de la matriz; cada uno espera a que termine el anterior. |

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

<Steps>
  <Step title="Llega un mensaje entrante">
    Llega un mensaje de grupo o DM de WhatsApp.
  </Step>
  <Step title="Enrutamiento y admisión">
    OpenClaw aplica las listas de permitidos del canal, las reglas de activación de grupo y la propiedad de bindings ACP configurada.
  </Step>
  <Step title="Comprobación de difusión">
    Si ningún binding ACP configurado es propietario de la ruta, OpenClaw comprueba si el ID de par está en `broadcast`.
  </Step>
  <Step title="Si se aplica la difusión">
    - Todos los agentes listados procesan el mensaje.
    - Cada agente tiene su propia clave de sesión y contexto aislado.
    - Los agentes procesan en paralelo (predeterminado) o secuencialmente.
    - Los adjuntos de audio se transcriben una sola vez antes de la distribución, por lo que los agentes comparten una transcripción en lugar de realizar llamadas STT separadas.

  </Step>
  <Step title="Si no se aplica la difusión">
    OpenClaw despacha la ruta ordinaria o la ruta de sesión ACP configurada seleccionada durante el enrutamiento.
  </Step>
</Steps>

<Note>
Los grupos de difusión no omiten las listas de permitidos del canal ni las reglas de activación de grupo (menciones/comandos/etc.). Solo cambian _qué agentes se ejecutan_ cuando un mensaje es apto para procesarse.
</Note>

### Aislamiento de sesión

Cada agente en un grupo de difusión mantiene completamente separados:

- **Claves de sesión** (`agent:alfred:whatsapp:group:120363...` frente a `agent:baerbel:whatsapp:group:120363...`)
- **Historial de conversación** (un agente no ve las respuestas de otros agentes)
- **Workspace** (sandboxes separadas si están configuradas)
- **Acceso a herramientas** (listas de permitir/denegar diferentes)
- **Memoria/contexto** (`IDENTITY.md`, `SOUL.md`, etc. separados)

Una excepción es compartida a propósito: el **búfer de contexto de grupo** (mensajes recientes del grupo usados como contexto) se comparte por par, por lo que todos los agentes de difusión ven el mismo contexto cuando se activan. Se borra una vez después de que la distribución se completa.

Esto permite que cada agente tenga personalidades, modelos, Skills y acceso a herramientas diferentes (por ejemplo, solo lectura frente a lectura-escritura).

### Ejemplo: sesiones aisladas

En el grupo `120363403215116621@g.us` con los agentes `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Contexto de Alfred">
    ```text
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: ~/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Contexto de Baerbel">
    ```text
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: ~/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Casos de uso

- **Equipos de agentes especializados**: un grupo de desarrollo en el que `code-reviewer`, `security-auditor`, `test-generator` y `docs-checker` responden cada uno al mismo mensaje desde su propio ángulo.
- **Soporte multilingüe**: un chat de soporte con `support-en`, `support-de`, `support-es` que responden en sus idiomas.
- **Aseguramiento de calidad**: `support-agent` responde mientras `qa-agent` revisa y solo responde cuando encuentra problemas.
- **Automatización de tareas**: `task-tracker`, `time-logger` y `report-generator` consumen todos la misma actualización de estado.

## Prácticas recomendadas

<AccordionGroup>
  <Accordion title="1. Mantén los agentes enfocados">
    Da a cada agente una única responsabilidad clara (`formatter`, `linter`, `tester`) en lugar de un agente genérico "dev-helper".
  </Accordion>
  <Accordion title="2. Usa ids y nombres descriptivos">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. Configura accesos a herramientas diferentes">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` es de solo lectura. `fixer` puede leer y escribir.

  </Accordion>
  <Accordion title="4. Supervisa el rendimiento">
    Con muchos agentes, prefiere `"strategy": "parallel"` (predeterminada), limita los grupos de difusión a unos pocos agentes y usa modelos más rápidos para agentes más simples.
  </Accordion>
  <Accordion title="5. Los fallos permanecen aislados">
    Los agentes fallan de forma independiente. El error de un agente se registra (`Broadcast agent <id> failed: ...`) y no bloquea a los demás.
  </Accordion>
</AccordionGroup>

## Compatibilidad

### Proveedores

Actualmente, los grupos de difusión están implementados solo para WhatsApp (canal web). Otros canales ignoran la configuración `broadcast`.

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

- `GROUP_A`: solo responde alfred (enrutamiento normal).
- `GROUP_B`: responden agent1 Y agent2 (difusión).

<Note>
**Precedencia:** `broadcast` tiene prioridad sobre los bindings de ruta ordinarios. Los bindings ACP configurados (`bindings[].type="acp"`) son exclusivos: cuando uno coincide, OpenClaw despacha a la sesión ACP configurada en lugar de la difusión distribuida.
</Note>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Los agentes no responden">
    **Comprobar:**

    1. Los ID de agente existen en `agents.list` (la validación de configuración rechaza ids desconocidos).
    2. El formato de ID de par es correcto (JID de grupo como `120363403215116621@g.us`, o E.164 como `+15551234567` para DM).
    3. El mensaje pasó el filtrado normal (las reglas de mención/activación siguen aplicándose).

    **Depurar:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    Una distribución correcta registra `Broadcasting message to <n> agents (<strategy>)`.

  </Accordion>
  <Accordion title="Solo responde un agente">
    **Causa:** el ID de par podría estar en bindings de ruta ordinarios pero no en `broadcast`, o podría coincidir con un binding ACP configurado exclusivo.

    **Corrección:** añade los pares enlazados a rutas ordinarias a la configuración de difusión, o elimina/cambia el binding ACP configurado si se desea la difusión distribuida.

  </Accordion>
  <Accordion title="Problemas de rendimiento">
    Si va lento con muchos agentes: reduce el número de agentes por grupo, usa modelos más ligeros y comprueba el tiempo de inicio de la sandbox.
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

    Un fragmento de código en el grupo produce cuatro respuestas: correcciones de formato, un hallazgo de seguridad, una brecha de cobertura y una observación de documentación.

  </Accordion>
  <Accordion title="Ejemplo 2: Pipeline multilingüe">
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
  Cómo procesar agentes. `parallel` ejecuta todos los agentes simultáneamente; `sequential` los ejecuta en el orden de la matriz.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID de grupo de WhatsApp o número de teléfono E.164. El valor es la matriz de IDs de agente que deben procesar todos los mensajes de ese par.
</ParamField>

## Limitaciones

1. **Máximo de agentes:** sin límite estricto, pero muchos agentes (10+) pueden ser lentos.
2. **Contexto compartido:** los agentes no ven las respuestas de los demás (por diseño).
3. **Orden de mensajes:** las respuestas paralelas pueden llegar en cualquier orden.
4. **Límites de tasa:** todas las respuestas provienen de una cuenta de WhatsApp, por lo que la respuesta de cada agente cuenta para los mismos límites de tasa de WhatsApp.

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing)
- [Grupos](/es/channels/groups)
- [Herramientas de sandbox multiagente](/es/tools/multi-agent-sandbox-tools)
- [Emparejamiento](/es/channels/pairing)
- [Gestión de sesiones](/es/concepts/session)
