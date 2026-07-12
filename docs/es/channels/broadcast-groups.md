---
read_when:
    - Configuración de grupos de difusión
    - Depuración de respuestas multiagente en WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Difundir un mensaje de WhatsApp a varios agentes
title: Grupos de difusión
x-i18n:
    generated_at: "2026-07-11T22:52:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Estado:** Experimental. Añadido en 2026.1.9. Solo para WhatsApp (canal web).
</Note>

## Descripción general

Los grupos de difusión ejecutan **varios agentes** con el mismo mensaje entrante. Cada agente procesa el mensaje en su propia sesión aislada y publica su propia respuesta, por lo que un número de WhatsApp puede alojar un equipo de agentes especializados en un único chat grupal o mensaje directo.

Los grupos de difusión se evalúan después de las listas de permitidos del canal y las reglas de activación del grupo. En los grupos de WhatsApp, las difusiones se producen cuando OpenClaw respondería normalmente (por ejemplo, al recibir una mención, según la configuración del grupo). Solo cambian **qué agentes se ejecutan**, nunca si un mensaje cumple los requisitos para procesarse.

La vía activa de control de calidad de WhatsApp incluye `whatsapp-broadcast-group-fanout`, que verifica que un mensaje grupal con una mención pueda generar respuestas visibles distintas de dos agentes configurados.

## Configuración

### Configuración básica

Añada una sección `broadcast` de nivel superior (junto a `bindings`). Las claves son identificadores de pares de WhatsApp y los valores son matrices de identificadores de agentes:

- chats grupales: JID del grupo (por ejemplo, `120363403215116621@g.us`)
- mensajes directos: número de teléfono E.164 del remitente (por ejemplo, `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Resultado:** cuando OpenClaw respondería en este chat, ejecuta los tres agentes.

Cada identificador de agente enumerado debe existir en `agents.list`: la validación de la configuración informa de los identificadores desconocidos y el entorno de ejecución los omite con una advertencia `Broadcast agent <id> not found in agents.list; skipping`.

### Estrategia de procesamiento

`broadcast.strategy` establece cómo procesan los agentes el mensaje:

| Estrategia           | Comportamiento                                                                |
| -------------------- | ----------------------------------------------------------------------------- |
| `parallel` (predeterminada) | Todos los agentes procesan simultáneamente; las respuestas llegan en cualquier orden. |
| `sequential`         | Los agentes procesan según el orden de la matriz; cada uno espera a que termine el anterior. |

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
    Llega un mensaje de un grupo de WhatsApp o un mensaje directo.
  </Step>
  <Step title="Enrutamiento y admisión">
    OpenClaw aplica las listas de permitidos del canal, las reglas de activación del grupo y la propiedad de los enlaces ACP configurados.
  </Step>
  <Step title="Comprobación de difusión">
    Si ningún enlace ACP configurado es propietario de la ruta, OpenClaw comprueba si el identificador del par está en `broadcast`.
  </Step>
  <Step title="Si se aplica la difusión">
    - Todos los agentes enumerados procesan el mensaje.
    - Cada agente tiene su propia clave de sesión y su contexto aislado.
    - Los agentes procesan en paralelo (opción predeterminada) o secuencialmente.
    - Los archivos de audio adjuntos se transcriben una vez antes de la distribución, por lo que los agentes comparten una única transcripción en lugar de realizar llamadas STT independientes.

  </Step>
  <Step title="Si no se aplica la difusión">
    OpenClaw envía el mensaje por la ruta ordinaria o la ruta de sesión ACP configurada que se seleccionó durante el enrutamiento.
  </Step>
</Steps>

<Note>
Los grupos de difusión no omiten las listas de permitidos del canal ni las reglas de activación del grupo (menciones, comandos, etc.). Solo cambian _qué agentes se ejecutan_ cuando un mensaje cumple los requisitos para procesarse.
</Note>

### Aislamiento de sesiones

Cada agente de un grupo de difusión mantiene completamente separados:

- **Claves de sesión** (`agent:alfred:whatsapp:group:120363...` frente a `agent:baerbel:whatsapp:group:120363...`)
- **Historial de conversaciones** (un agente no ve las respuestas de los demás agentes)
- **Espacio de trabajo** (entornos aislados separados, si se configuran)
- **Acceso a herramientas** (listas de permitidos y denegados distintas)
- **Memoria/contexto** (`IDENTITY.md`, `SOUL.md`, etc., separados)

Hay una excepción compartida de forma intencionada: el **búfer de contexto del grupo** (mensajes recientes del grupo usados como contexto) se comparte por par, por lo que todos los agentes de difusión ven el mismo contexto cuando se activan. Se borra una vez finalizada la distribución.

Esto permite que cada agente tenga diferentes personalidades, modelos, Skills y acceso a herramientas (por ejemplo, solo lectura frente a lectura y escritura).

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

- **Equipos de agentes especializados**: un grupo de desarrollo donde `code-reviewer`, `security-auditor`, `test-generator` y `docs-checker` responden al mismo mensaje, cada uno desde su propia perspectiva.
- **Asistencia multilingüe**: un único chat de asistencia con `support-en`, `support-de` y `support-es` respondiendo en sus respectivos idiomas.
- **Control de calidad**: `support-agent` responde mientras `qa-agent` revisa y solo responde cuando encuentra problemas.
- **Automatización de tareas**: `task-tracker`, `time-logger` y `report-generator` consumen la misma actualización de estado.

## Prácticas recomendadas

<AccordionGroup>
  <Accordion title="1. Mantenga a los agentes centrados">
    Asigne a cada agente una única responsabilidad clara (`formatter`, `linter`, `tester`) en lugar de usar un agente genérico "dev-helper".
  </Accordion>
  <Accordion title="2. Use identificadores y nombres descriptivos">
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
  <Accordion title="3. Configure distintos accesos a herramientas">
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
  <Accordion title="4. Supervise el rendimiento">
    Con muchos agentes, prefiera `"strategy": "parallel"` (opción predeterminada), limite los grupos de difusión a unos pocos agentes y use modelos más rápidos para los agentes más sencillos.
  </Accordion>
  <Accordion title="5. Los fallos permanecen aislados">
    Los agentes fallan de forma independiente. El error de un agente se registra (`Broadcast agent <id> failed: ...`) y no bloquea a los demás.
  </Accordion>
</AccordionGroup>

## Compatibilidad

### Proveedores

Actualmente, los grupos de difusión solo están implementados para WhatsApp (canal web). Los demás canales ignoran la configuración `broadcast`.

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
**Precedencia:** `broadcast` tiene prioridad sobre los enlaces de rutas ordinarios. Los enlaces ACP configurados (`bindings[].type="acp"`) son exclusivos: cuando uno coincide, OpenClaw envía el mensaje a la sesión ACP configurada en lugar de realizar una difusión distribuida.
</Note>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Los agentes no responden">
    **Compruebe lo siguiente:**

    1. Los identificadores de los agentes existen en `agents.list` (la validación de la configuración rechaza los identificadores desconocidos).
    2. El formato del identificador del par es correcto (un JID de grupo como `120363403215116621@g.us` o un número E.164 como `+15551234567` para los mensajes directos).
    3. El mensaje superó los filtros normales (las reglas de mención y activación siguen aplicándose).

    **Depuración:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    Una distribución correcta registra `Broadcasting message to <n> agents (<strategy>)`.

  </Accordion>
  <Accordion title="Solo responde un agente">
    **Causa:** el identificador del par podría estar en los enlaces de rutas ordinarios, pero no en `broadcast`, o podría coincidir con un enlace ACP configurado exclusivo.

    **Solución:** añada los pares enlazados a rutas ordinarias a la configuración de difusión, o elimine/cambie el enlace ACP configurado si desea una difusión distribuida.

  </Accordion>
  <Accordion title="Problemas de rendimiento">
    Si el funcionamiento es lento con muchos agentes: reduzca el número de agentes por grupo, use modelos más ligeros y compruebe el tiempo de inicio del entorno aislado.
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

    Un fragmento de código en el grupo genera cuatro respuestas: correcciones de formato, un hallazgo de seguridad, una carencia de cobertura y una observación menor sobre la documentación.

  </Accordion>
  <Accordion title="Ejemplo 2: Canalización multilingüe">
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

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  Cómo procesar los agentes. `parallel` ejecuta todos los agentes simultáneamente; `sequential` los ejecuta según el orden de la matriz.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID del grupo de WhatsApp o número de teléfono E.164. El valor es la matriz de identificadores de agentes que deben procesar todos los mensajes de ese par.
</ParamField>

## Limitaciones

1. **Número máximo de agentes:** no hay un límite estricto, pero una gran cantidad de agentes (10 o más) puede ralentizar el procesamiento.
2. **Contexto compartido:** los agentes no ven las respuestas de los demás (por diseño).
3. **Orden de los mensajes:** las respuestas en paralelo pueden llegar en cualquier orden.
4. **Límites de frecuencia:** todas las respuestas proceden de una única cuenta de WhatsApp, por lo que la respuesta de cada agente cuenta para los mismos límites de frecuencia de WhatsApp.

## Contenido relacionado

- [Enrutamiento de canales](/es/channels/channel-routing)
- [Grupos](/es/channels/groups)
- [Herramientas de entorno aislado multiagente](/es/tools/multi-agent-sandbox-tools)
- [Emparejamiento](/es/channels/pairing)
- [Gestión de sesiones](/es/concepts/session)
