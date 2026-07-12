---
read_when:
    - Quieres conectar OpenClaw a un espacio de trabajo de Raft
    - Está configurando un agente externo de Raft
    - Estás depurando la entrega de activación de Raft
sidebarTitle: Raft
summary: Compatibilidad con agentes externos de Raft mediante el puente de activación de la CLI de Raft
title: Balsa
x-i18n:
    generated_at: "2026-07-11T22:55:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft conecta un agente de OpenClaw con un agente externo de Raft mediante la
CLI local de Raft. Raft envía avisos de activación autenticados al Gateway; después, el agente
usa la CLI de Raft para consultar y enviar mensajes. Solo chat directo (sin grupos).

## Instalación

Raft es un plugin externo oficial. Instálelo en el host del Gateway:

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Detalles: [Plugins](/es/tools/plugin)

## Requisitos previos

- Un espacio de trabajo de Raft con un agente externo.
- La CLI de Raft instalada en el mismo host que el Gateway de OpenClaw y disponible en el
  `PATH` del servicio.
- Un perfil de la CLI de Raft que ya tenga una sesión iniciada y esté asociado con ese
  agente externo.

El plugin no almacena las credenciales de Raft; la CLI de Raft mantiene esa
autenticación en su propio perfil.

## Configuración

Establezca el perfil en la configuración:

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

Para la cuenta predeterminada, también puede establecer `RAFT_PROFILE` en el entorno
del Gateway:

```bash
RAFT_PROFILE=openclaw
```

Use una cuenta con nombre cuando un Gateway se conecte a más de un agente externo de Raft:

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

La configuración interactiva registra el mismo perfil:

```bash
openclaw channels add --channel raft
```

## Funcionamiento

Cuando se inicia el Gateway, el plugin:

1. Abre un punto de conexión HTTP de activación accesible solo mediante local loopback en un puerto efímero.
2. Inicia `raft --profile <profile> agent bridge` con ese punto de conexión y un
   token por proceso.
3. Acepta únicamente avisos de activación autenticados, sin contenido y con una identidad
   de repetición procedentes del puente local.
4. Exige uno de `eventId`, `attemptId`, `messageId`, `delivery_id`,
   `wake_id` o `id` en cada carga útil de activación.
5. Deduplica durante 24 horas las entregas de activación reintentadas según el identificador de evento del puente,
   incluso tras reinicios del Gateway.
6. Devuelve una sesión de ejecución estable para el puente actual y un lote vacío
   de vaciado de actividad para el protocolo de la CLI de Raft.
7. Inicia un turno serializado del agente de OpenClaw por cada activación aceptada.

El puente gestiona los reintentos de entrega y las reconexiones de Raft. El turno de OpenClaw
solo recibe un aviso de activación, no una copia del cuerpo del mensaje de Raft. Usa la CLI
para leer los mensajes pendientes y enviar su respuesta:

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft no es un transporte de mensajes push. OpenClaw no devuelve automáticamente el texto final del modelo mediante el puente, por lo que el agente debe usar la CLI de Raft después de procesar una activación.
</Note>

## Verificación

Compruebe que OpenClaw pueda encontrar la CLI y tenga un perfil configurado:

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Después, envíe un mensaje al agente externo de Raft. El registro del Gateway debería mostrar
el inicio del puente de Raft, seguido de una activación entrante. El agente debería usar
el perfil de Raft configurado para consultar sus mensajes pendientes.

## Solución de problemas

<AccordionGroup>
  <Accordion title="Falta la CLI de Raft">
    Instale la CLI de Raft en el host del Gateway y haga que `raft` esté disponible en el
    `PATH` del servicio. Verifíquelo con `raft --help` y, después, reinicie el Gateway.
  </Accordion>
  <Accordion title="El puente se cierra inmediatamente">
    Verifique que el perfil configurado tenga una sesión iniciada y pertenezca al
    agente externo de Raft previsto. Ejecute directamente `raft --profile <profile> agent bridge`
    para ver el diagnóstico de la CLI.
  </Accordion>
  <Accordion title="Llega una activación, pero no se envía ninguna respuesta de Raft">
    Este comportamiento es el esperado cuando el agente no invoca la CLI de Raft. El puente de
    activación no transporta cuerpos de mensajes ni respuestas finales automáticas. Compruebe la
    política de herramientas del agente y asegúrese de que pueda ejecutar `raft --profile <profile>
    message check` y `message send`.
  </Accordion>
</AccordionGroup>

## Referencias

- [Raft](https://raft.build/)
- [Documentación de Raft](https://docs.raft.build/welcome/)
- [Integración de Hermes con Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
