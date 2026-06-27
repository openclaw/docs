---
read_when:
    - Ajustar los valores predeterminados del modo elevado, las listas de permitidos o el comportamiento de los comandos de barra
    - Comprender cómo los agentes aislados pueden acceder al sistema anfitrión
summary: 'Modo de ejecución elevada: ejecutar comandos fuera del entorno aislado desde un agente en entorno aislado'
title: Modo elevado
x-i18n:
    generated_at: "2026-05-06T05:50:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 91aab7c105643d8e5d07d89cd5ab176f0a40cd3d23e2b20b3986cbf76f575d64
    source_path: tools/elevated.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Cuando un agente se ejecuta dentro de un sandbox, sus comandos `exec` quedan confinados al
entorno del sandbox. El **modo elevado** permite que el agente salga y ejecute comandos
fuera del sandbox en su lugar, con puertas de aprobación configurables.

<Info>
  El modo elevado solo cambia el comportamiento cuando el agente está **en sandbox**. Para
  agentes sin sandbox, exec ya se ejecuta en el host.
</Info>

## Directivas

Controla el modo elevado por sesión con comandos de barra:

| Directiva        | Qué hace                                                           |
| ---------------- | ---------------------------------------------------------------------- |
| `/elevated on`   | Ejecuta fuera del sandbox en la ruta del host configurada, mantiene las aprobaciones    |
| `/elevated ask`  | Igual que `on` (alias)                                                   |
| `/elevated full` | Ejecuta fuera del sandbox en la ruta del host configurada y omite las aprobaciones |
| `/elevated off`  | Vuelve a la ejecución confinada al sandbox                                   |

También disponible como `/elev on|off|ask|full`.

Envía `/elevated` sin argumento para ver el nivel actual.

## Cómo funciona

<Steps>
  <Step title="Check availability">
    Elevated debe estar habilitado en la configuración y el remitente debe estar en la lista de permitidos:

    ```json5
    {
      tools: {
        elevated: {
          enabled: true,
          allowFrom: {
            discord: ["user-id-123"],
            whatsapp: ["+15555550123"],
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Set the level">
    Envía un mensaje que contenga solo la directiva para establecer el valor predeterminado de la sesión:

    ```
    /elevated full
    ```

    O úsala en línea (se aplica solo a ese mensaje):

    ```
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Commands run outside the sandbox">
    Con elevated activo, las llamadas `exec` salen del sandbox. El host efectivo es
    `gateway` de forma predeterminada, o `node` cuando el destino exec configurado/de sesión es
    `node`. En modo `full`, se omiten las aprobaciones de exec. En modo `on`/`ask`,
    las reglas de aprobación configuradas siguen aplicándose.
  </Step>
</Steps>

## Orden de resolución

1. **Directiva en línea** en el mensaje (se aplica solo a ese mensaje)
2. **Anulación de sesión** (establecida al enviar un mensaje que contiene solo la directiva)
3. **Valor predeterminado global** (`agents.defaults.elevatedDefault` en la configuración)

## Disponibilidad y listas de permitidos

- **Puerta global**: `tools.elevated.enabled` (debe ser `true`)
- **Lista de permitidos de remitentes**: `tools.elevated.allowFrom` con listas por canal
- **Puerta por agente**: `agents.list[].tools.elevated.enabled` (solo puede restringir más)
- **Lista de permitidos por agente**: `agents.list[].tools.elevated.allowFrom` (el remitente debe coincidir tanto con la global como con la del agente)
- **Reserva de Discord**: si se omite `tools.elevated.allowFrom.discord`, se usa `channels.discord.allowFrom` como reserva
- **Todas las puertas deben pasar**; de lo contrario, elevated se trata como no disponible

Formatos de entradas de la lista de permitidos:

| Prefijo                  | Coincide con                         |
| ----------------------- | ------------------------------- |
| (ninguno)                  | ID del remitente, E.164 o campo From |
| `name:`                 | Nombre visible del remitente             |
| `username:`             | Nombre de usuario del remitente                 |
| `tag:`                  | Etiqueta del remitente                      |
| `id:`, `from:`, `e164:` | Selección explícita de identidad     |

## Lo que elevated no controla

- **Política de herramientas**: si `exec` es denegado por la política de herramientas, elevated no puede anularlo.
- **Política de selección de host**: elevated no convierte `auto` en una anulación libre entre hosts. Usa las reglas del destino exec configurado/de sesión, eligiendo `node` solo cuando el destino ya es `node`.
- **Separado de `/exec`**: la directiva `/exec` ajusta los valores predeterminados de exec por sesión para remitentes autorizados y no requiere modo elevado.

<Note>
  El comando de chat de bash (prefijo `!`; alias `/bash`) es una puerta separada que requiere que `tools.elevated` esté habilitado además de su propia marca `tools.bash.enabled`. Deshabilitar elevated también bloquea los comandos de shell `!`.
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Exec tool" href="/es/tools/exec" icon="terminal">
    Ejecución de comandos de shell desde el agente.
  </Card>
  <Card title="Exec approvals" href="/es/tools/exec-approvals" icon="shield">
    Sistema de aprobación y lista de permitidos para `exec`.
  </Card>
  <Card title="Sandboxing" href="/es/gateway/sandboxing" icon="box">
    Configuración de sandbox a nivel de Gateway.
  </Card>
  <Card title="Sandbox vs Tool Policy vs Elevated" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Cómo se componen las tres puertas durante una llamada de herramienta.
  </Card>
</CardGroup>
