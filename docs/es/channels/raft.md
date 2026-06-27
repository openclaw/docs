---
read_when:
    - Quieres conectar OpenClaw a un espacio de trabajo de Raft
    - Estás configurando un agente externo de Raft
    - Estás depurando la entrega de activación de Raft
sidebarTitle: Raft
summary: Compatibilidad con Raft External Agent mediante el puente de activación de la CLI de Raft
title: Balsa
x-i18n:
    generated_at: "2026-06-27T10:44:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

La compatibilidad con Raft conecta un agente de OpenClaw a un External Agent de Raft mediante la CLI local de Raft. Raft envía indicios de activación autenticados al Gateway. Después, el agente usa la CLI de Raft para comprobar y enviar mensajes.

## Instalación

Raft es un Plugin externo oficial. Instálalo en el host del Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Detalles: [Plugins](/es/tools/plugin)

## Requisitos previos

- Un espacio de trabajo de Raft con un External Agent.
- La CLI de Raft instalada en el mismo host que el Gateway de OpenClaw.
- Un perfil de la CLI de Raft que ya haya iniciado sesión y esté asociado con ese External Agent.

El Plugin no almacena credenciales de Raft. La CLI de Raft conserva esa autenticación en su propio perfil.

## Configuración

Define el perfil en la configuración:

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

Para la cuenta predeterminada, también puedes definir `RAFT_PROFILE` en el entorno del Gateway:

```bash
RAFT_PROFILE=openclaw
```

Usa una cuenta con nombre cuando un Gateway se conecta a más de un External Agent de Raft:

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

El flujo de configuración interactivo registra el mismo perfil:

```bash
openclaw channels setup raft
```

## Cómo funciona

Cuando el Gateway se inicia, el Plugin:

1. Abre un endpoint HTTP de activación solo de loopback en un puerto efímero.
2. Inicia `raft --profile <profile> agent bridge` con ese endpoint y un token por proceso.
3. Acepta solo indicios de activación autenticados y sin contenido con una identidad de repetición desde el bridge local.
4. Requiere uno de `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id` o `id`.
5. Deduplica las entregas de activación reintentadas recientes por identificador de evento del bridge, incluso entre reinicios del Gateway.
6. Devuelve una sesión de tiempo de ejecución estable para el bridge actual y un lote vacío de drenaje de actividad para el protocolo de la CLI de Raft.
7. Inicia un turno serializado de agente de OpenClaw por cada activación aceptada.

El bridge es responsable de los reintentos de entrega y las reconexiones de Raft. El turno de OpenClaw recibe solo un aviso de activación, no una copia del cuerpo del mensaje de Raft. Usa la CLI para leer los mensajes pendientes y enviar su respuesta:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft no es un transporte normal de mensajes push. OpenClaw no envía automáticamente el texto final del modelo de vuelta a través del bridge, por lo que el agente debe usar la CLI de Raft después de procesar una activación.
</Note>

## Verificación

Comprueba que OpenClaw pueda encontrar la CLI y tenga un perfil configurado:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Después, envía un mensaje al External Agent de Raft. El registro del Gateway debería mostrar el inicio del bridge de Raft, seguido de una activación entrante. El agente debería usar el perfil de Raft configurado para comprobar sus mensajes pendientes.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Falta la CLI de Raft">
    Instala la CLI de Raft en el host del Gateway y haz que `raft` esté disponible en el `PATH` del servicio. Verifícalo con `raft --help` y después reinicia el Gateway.
  </Accordion>
  <Accordion title="El bridge se cierra de inmediato">
    Verifica que el perfil configurado haya iniciado sesión y pertenezca al External Agent de Raft previsto. Ejecuta `raft --profile <profile> agent bridge` directamente para ver el diagnóstico de la CLI.
  </Accordion>
  <Accordion title="Llega una activación, pero no se envía ninguna respuesta de Raft">
    Esto es esperado cuando el agente no invoca la CLI de Raft. El bridge de activación no transporta cuerpos de mensaje ni respuestas finales automáticas. Comprueba la política de herramientas del agente y asegúrate de que pueda ejecutar `raft --profile <profile> message check` y `message send`.
  </Accordion>
</AccordionGroup>

## Referencias

- [Raft](https://raft.build/)
- [Documentación de Raft](https://docs.raft.build/welcome/)
- [Integración de Hermes con Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
