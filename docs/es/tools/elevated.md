---
read_when:
    - Ajustar los valores predeterminados del modo elevado, las listas de permitidos o el comportamiento de los comandos de barra
    - Comprender cómo los agentes en sandbox pueden acceder al host
summary: 'Modo de ejecución elevada: ejecutar comandos fuera del sandbox desde un agente en sandbox'
title: Modo elevado
x-i18n:
    generated_at: "2026-07-05T11:48:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab035f2f0d0074da4e7661d9d690d89aa5eea25b7920ce48a2a03dffccded85b
    source_path: tools/elevated.md
    workflow: 16
---

Cuando un agente se ejecuta dentro de un entorno aislado, sus comandos `exec` quedan confinados al entorno del entorno aislado. El **modo elevado** permite que el agente salga de él y ejecute comandos fuera del entorno aislado, con puertas de aprobación configurables.

<Info>
  El modo elevado solo cambia el comportamiento cuando el agente está **en un entorno aislado**. Para agentes sin entorno aislado, exec ya se ejecuta en el host.
</Info>

## Directivas

Controla el modo elevado por sesión con comandos de barra:

| Directiva        | Qué hace                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/elevated on`   | Ejecuta fuera del entorno aislado en la ruta del host configurada, mantiene las aprobaciones                                                             |
| `/elevated ask`  | Igual que `on` (alias)                                                                                                            |
| `/elevated full` | Ejecuta fuera del entorno aislado en la ruta del host configurada y omite las aprobaciones cuando la política de aprobación de modo/host ya es permisiva |
| `/elevated off`  | Vuelve a la ejecución confinada al entorno aislado                                                                                            |

También disponible como `/elev on|off|ask|full`.

Envía `/elevated` sin argumentos para ver el nivel actual.

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
    Con el modo elevado activo, las llamadas `exec` salen del entorno aislado. El host efectivo es
    `gateway` de forma predeterminada, o `node` cuando el destino de exec configurado/de la sesión es
    `node`. En modo `full`, las aprobaciones de exec se omiten cuando la política de aprobación de
    modo/host de exec resuelta ya es totalmente permisiva (security `full`,
    ask `off`); de lo contrario, se sigue aplicando la política de aprobación normal. En
    modo `on`/`ask`, siempre se aplican las reglas de aprobación configuradas.
  </Step>
</Steps>

## Orden de resolución

1. **Directiva en línea** en el mensaje (se aplica solo a ese mensaje)
2. **Anulación de sesión** (establecida al enviar un mensaje que contiene solo una directiva)
3. **Valor predeterminado global** (`agents.defaults.elevatedDefault` en la configuración)

## Disponibilidad y listas de permitidos

- **Puerta global**: `tools.elevated.enabled` (debe ser `true`)
- **Lista de permitidos de remitentes**: `tools.elevated.allowFrom` con listas por canal
- **Puerta por agente**: `agents.list[].tools.elevated.enabled` (solo puede restringir más; tanto la puerta global como la puerta por agente deben ser `true`)
- **Lista de permitidos por agente**: `agents.list[].tools.elevated.allowFrom` (el remitente debe coincidir tanto con la global como con la del agente)
- **Lista de permitidos de reserva proporcionada por el canal**: los plugins de canal pueden suministrar opcionalmente una lista de permitidos de reserva mediante un hook de adaptador del SDK, usada cuando `tools.elevated.allowFrom.<provider>` no está configurado. Ningún canal incluido implementa actualmente este hook, así que en la práctica cada proveedor necesita hoy una entrada explícita `tools.elevated.allowFrom.<provider>`.
- **Todas las puertas deben pasar**; de lo contrario, el modo elevado se trata como no disponible

Formatos de entrada de la lista de permitidos:

| Prefijo                  | Coincide con                         |
| ----------------------- | ------------------------------- |
| (ninguno)                  | ID del remitente, E.164 o campo From |
| `name:`                 | Nombre visible del remitente             |
| `username:`             | Nombre de usuario del remitente                 |
| `tag:`                  | Etiqueta del remitente                      |
| `id:`, `from:`, `e164:` | Selección explícita de identidad     |

## Qué no controla el modo elevado

- **Política de herramientas**: si la política de herramientas deniega `exec`, el modo elevado no puede anularla.
- **Política de selección de host**: el modo elevado no convierte `auto` en una anulación libre entre hosts. Usa las reglas configuradas/de sesión del destino de exec y elige `node` solo cuando el destino ya es `node`.
- **Separado de `/exec`**: la directiva `/exec` ajusta los valores predeterminados de exec por sesión (host, security, ask, node) para remitentes autorizados y no requiere el modo elevado.

<Note>
  El comando de chat de bash (prefijo `!`; alias `/bash`) es una puerta independiente que requiere que `tools.elevated` esté habilitado además de su propia marca `tools.bash.enabled`. Deshabilitar el modo elevado también bloquea los comandos de shell `!`.
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
    Configuración de entorno aislado a nivel de Gateway.
  </Card>
  <Card title="Sandbox vs Tool Policy vs Elevated" href="/es/gateway/sandbox-vs-tool-policy-vs-elevated" icon="scale-balanced">
    Cómo se combinan las tres puertas durante una llamada de herramienta.
  </Card>
</CardGroup>
