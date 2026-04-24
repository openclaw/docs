---
read_when:
    - Ajustar valores predeterminados del modo elevado, listas de permitidos o comportamiento de comandos de barra
    - Understanding how sandboxed agents can access the host
summary: 'Modo exec elevado: ejecutar comandos fuera del sandbox desde un agente aislado en sandbox'
title: Modo elevado
x-i18n:
    generated_at: "2026-04-24T05:53:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b91b4af36f9485695f2afebe9bf8d7274d7aad6d0d88e762e581b0d091e04f7
    source_path: tools/elevated.md
    workflow: 15
---

Cuando un agente se ejecuta dentro de un sandbox, sus comandos `exec` quedan confinados al
entorno del sandbox. El **modo elevado** permite que el agente salga de ahí y ejecute comandos
fuera del sandbox, con barreras de aprobación configurables.

<Info>
  El modo elevado solo cambia el comportamiento cuando el agente está **aislado en sandbox**. Para
  agentes sin sandbox, `exec` ya se ejecuta en el host.
</Info>

## Directivas

Controla el modo elevado por sesión con comandos de barra:

| Directiva        | Qué hace                                                              |
| ---------------- | --------------------------------------------------------------------- |
| `/elevated on`   | Ejecuta fuera del sandbox en la ruta de host configurada, manteniendo aprobaciones |
| `/elevated ask`  | Igual que `on` (alias)                                                |
| `/elevated full` | Ejecuta fuera del sandbox en la ruta de host configurada y omite aprobaciones |
| `/elevated off`  | Vuelve a la ejecución confinada al sandbox                            |

También disponible como `/elev on|off|ask|full`.

Envía `/elevated` sin argumento para ver el nivel actual.

## Cómo funciona

<Steps>
  <Step title="Comprobar disponibilidad">
    El modo elevado debe estar habilitado en la configuración y el remitente debe estar en la lista de permitidos:

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

  <Step title="Establecer el nivel">
    Envía un mensaje solo con la directiva para establecer el valor predeterminado de la sesión:

    ```text
    /elevated full
    ```

    O úsalo en línea (se aplica solo a ese mensaje):

    ```text
    /elevated on run the deployment script
    ```

  </Step>

  <Step title="Los comandos se ejecutan fuera del sandbox">
    Con el modo elevado activo, las llamadas `exec` salen del sandbox. El host efectivo es
    `gateway` de forma predeterminada, o `node` cuando el destino exec configurado/de sesión es
    `node`. En modo `full`, se omiten las aprobaciones de exec. En modo `on`/`ask`,
    siguen aplicándose las reglas de aprobación configuradas.
  </Step>
</Steps>

## Orden de resolución

1. **Directiva en línea** en el mensaje (se aplica solo a ese mensaje)
2. **Anulación de sesión** (establecida al enviar un mensaje solo con directiva)
3. **Valor predeterminado global** (`agents.defaults.elevatedDefault` en la configuración)

## Disponibilidad y listas de permitidos

- **Barrera global**: `tools.elevated.enabled` (debe ser `true`)
- **Lista de permitidos de remitente**: `tools.elevated.allowFrom` con listas por canal
- **Barrera por agente**: `agents.list[].tools.elevated.enabled` (solo puede restringir más)
- **Lista de permitidos por agente**: `agents.list[].tools.elevated.allowFrom` (el remitente debe coincidir tanto con la global como con la del agente)
- **Alternativa de Discord**: si se omite `tools.elevated.allowFrom.discord`, se usa `channels.discord.allowFrom` como alternativa
- **Todas las barreras deben superarse**; en caso contrario, el modo elevado se considera no disponible

Formatos de entrada de la lista de permitidos:

| Prefijo                 | Coincide con                    |
| ----------------------- | ------------------------------- |
| (ninguno)               | ID del remitente, E.164 o campo From |
| `name:`                 | Nombre para mostrar del remitente |
| `username:`             | Nombre de usuario del remitente |
| `tag:`                  | Etiqueta del remitente          |
| `id:`, `from:`, `e164:` | Destino explícito de identidad  |

## Lo que el modo elevado no controla

- **Política de herramientas**: si `exec` está denegado por la política de herramientas, el modo elevado no puede anularlo
- **Política de selección de host**: el modo elevado no convierte `auto` en una anulación libre entre hosts. Usa las reglas de destino exec configuradas/de sesión, eligiendo `node` solo cuando el destino ya es `node`.
- **Independiente de `/exec`**: la directiva `/exec` ajusta los valores predeterminados de exec por sesión para remitentes autorizados y no requiere modo elevado

## Relacionado

- [Herramienta Exec](/es/tools/exec) — ejecución de comandos de shell
- [Aprobaciones de Exec](/es/tools/exec-approvals) — sistema de aprobación y lista de permitidos
- [Sandboxing](/es/gateway/sandboxing) — configuración del sandbox
- [Sandbox frente a política de herramientas frente a modo elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
