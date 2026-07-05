---
read_when:
    - Diseño del asistente de incorporación de macOS
    - Implementar la configuración de autenticación o identidad
sidebarTitle: 'Onboarding: macOS App'
summary: Flujo de configuración inicial para OpenClaw (aplicación de macOS)
title: Incorporación (app de macOS)
x-i18n:
    generated_at: "2026-07-05T11:42:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cc363e013ae9921e9fde489ca856739037dd8b19bdcef55cf0466171968159af
    source_path: start/onboarding.md
    workflow: 16
---

El flujo de primera ejecución de la app de macOS: elige dónde se ejecuta el Gateway, completa la configuración local mediante una conversación con Crestodian, concede permisos y pasa al ritual de arranque propio del agente.
Para la incorporación mediante CLI y una comparación de ambas rutas, consulta [Resumen de incorporación](/es/start/onboarding-overview).

<Steps>
<Step title="Aprobar advertencia de macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Aprobar búsqueda de redes locales">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="Bienvenida y aviso de seguridad">
<Frame caption="Lee el aviso de seguridad mostrado y decide en consecuencia">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modelo de confianza de seguridad:

- De forma predeterminada, OpenClaw es un agente personal: un límite de operador de confianza.
- Las configuraciones compartidas o multiusuario necesitan bloqueo: separa los límites de confianza, mantén el acceso a herramientas al mínimo y sigue [Seguridad](/es/gateway/security).
- La incorporación local configura de forma predeterminada las configuraciones nuevas en `tools.profile: "coding"` para que las instalaciones nuevas conserven las herramientas de sistema de archivos y runtime sin el perfil `full` sin restricciones.
- Si están habilitados hooks/webhooks u otros canales de contenido no confiable, usa un nivel de modelo moderno y potente, y mantén una política estricta de herramientas y sandboxing.

</Step>
<Step title="Local frente a remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

¿Dónde se ejecuta el **Gateway**?

- **Este Mac (solo local):** la incorporación configura la autenticación y escribe las credenciales localmente.
- **Remoto (por SSH/Tailnet):** la incorporación **no** configura la autenticación local;
  las credenciales ya deben existir en el host del gateway. El campo de token
  del gateway remoto almacena el token que la app de macOS usa para conectarse a ese Gateway;
  los valores SecretRef existentes de `gateway.remote.token` se conservan hasta que los
  reemplaces.
- **Configurar más tarde:** omite la configuración y deja la app sin configurar.

<Tip>
**Consejo de autenticación del Gateway:**

- El modo de autenticación del Gateway se configura de forma predeterminada como `token` incluso para enlaces de loopback, por lo que los clientes WS locales deben autenticarse.
- Configurar `gateway.auth.mode: "none"` permite que cualquier proceso local se conecte; úsalo solo en máquinas totalmente confiables.
- Usa un token para acceso desde varias máquinas o enlaces que no sean de loopback.

</Tip>
</Step>
<Step title="CLI">
  La configuración local instala la CLI global `openclaw` mediante npm, pnpm o bun,
  con preferencia por npm primero. Node sigue siendo el runtime recomendado para el Gateway
  en sí. Se reutilizan las instalaciones compatibles existentes.
</Step>
<Step title="Hablar con Crestodian">
  La configuración local abre una conversación dedicada con Crestodian después de que el Gateway
  esté listo. Crestodian detecta un inicio de sesión existente de Claude Code o Codex y
  claves de API compatibles, propone el espacio de trabajo y la configuración, y luego espera la
  aprobación antes de escribir nada. Siguiente permanece bloqueado hasta que la conversación
  haya creado el estado de configuración. Las solicitudes de credenciales usan entrada enmascarada; después de un
  fallo de transporte ambiguo, reinicia la conversación de configuración en lugar de
  reproducir el turno anterior.

Los flujos Remoto y Configurar más tarde omiten esta conversación de configuración local.
</Step>
<Step title="Permisos">

<Frame caption="Elige qué permisos quieres conceder a OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

La incorporación solicita permisos TCC para: Automatización (AppleScript), Notificaciones, Accesibilidad, Grabación de pantalla, Micrófono, Reconocimiento de voz, Cámara y Ubicación.

</Step>
<Step title="Chat de incorporación (sesión dedicada)">
  Después de la configuración, la app abre un chat de incorporación del agente separado para que el agente pueda
  presentarse y guiar los siguientes pasos sin mezclar ese intercambio en el
  historial normal de conversación. Esto sigue a la conversación de configuración de Crestodian;
  no la reemplaza. Consulta [Arranque](/es/start/bootstrapping) para saber qué
  ocurre en el host del gateway durante el primer turno real del agente.
</Step>
</Steps>

## Relacionado

- [Resumen de incorporación](/es/start/onboarding-overview)
- [Primeros pasos](/es/start/getting-started)
