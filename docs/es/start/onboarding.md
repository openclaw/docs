---
read_when:
    - Diseño del asistente de incorporación de macOS
    - Implementación de la configuración de autenticación o identidad
sidebarTitle: 'Onboarding: macOS App'
summary: Flujo de configuración de primera ejecución de OpenClaw (app de macOS)
title: Configuración inicial (aplicación para macOS)
x-i18n:
    generated_at: "2026-05-06T05:49:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6dc7ebea5de7b1398d7b64c00245255c59af8a7ef51315cdd0ef1cb4898a41a4
    source_path: start/onboarding.md
    workflow: 16
---

Este documento describe el flujo de configuración de primer uso **actual**. El objetivo es una
experiencia fluida de "día 0": elegir dónde se ejecuta el Gateway, conectar la autenticación, ejecutar el
asistente y dejar que el agente se inicialice por sí mismo.
Para una descripción general de las rutas de incorporación, consulta [Descripción general de la incorporación](/es/start/onboarding-overview).

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

- De forma predeterminada, OpenClaw es un agente personal: un único límite de operador de confianza.
- Las configuraciones compartidas/multiusuario requieren endurecimiento (separar límites de confianza, mantener el acceso a herramientas al mínimo y seguir [Seguridad](/es/gateway/security)).
- La incorporación local ahora establece de forma predeterminada las configuraciones nuevas en `tools.profile: "coding"` para que las configuraciones locales nuevas mantengan las herramientas de sistema de archivos/runtime sin forzar el perfil `full` sin restricciones.
- Si se habilitan hooks/webhooks u otros feeds de contenido no confiable, usa un nivel de modelo moderno y potente, y mantén una política de herramientas/sandboxing estricta.

</Step>
<Step title="Local vs remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

¿Dónde se ejecuta el **Gateway**?

- **Este Mac (solo local):** la incorporación puede configurar la autenticación y escribir credenciales
  localmente.
- **Remoto (por SSH/Tailnet):** la incorporación **no** configura la autenticación local;
  las credenciales deben existir en el host del gateway.
- **Configurar más tarde:** omite la configuración y deja la app sin configurar.

<Tip>
**Consejo de autenticación del Gateway:**

- El asistente ahora genera un **token** incluso para loopback, por lo que los clientes WS locales deben autenticarse.
- Si deshabilitas la autenticación, cualquier proceso local puede conectarse; úsalo solo en máquinas completamente confiables.
- Usa un **token** para acceso entre varias máquinas o enlaces que no sean loopback.

</Tip>
</Step>
<Step title="Permisos">
<Frame caption="Elige qué permisos quieres conceder a OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

La incorporación solicita los permisos de TCC necesarios para:

- Automatización (AppleScript)
- Notificaciones
- Accesibilidad
- Grabación de pantalla
- Micrófono
- Reconocimiento de voz
- Cámara
- Ubicación

</Step>
<Step title="CLI">
  <Info>Este paso es opcional</Info>
  La app puede instalar la CLI global `openclaw` mediante npm, pnpm o bun.
  Prefiere npm primero, luego pnpm y después bun si ese es el único
  gestor de paquetes detectado. Para el runtime del Gateway, Node sigue siendo la ruta recomendada.
</Step>
<Step title="Chat de incorporación (sesión dedicada)">
  Después de la configuración, la app abre una sesión de chat de incorporación dedicada para que el agente pueda
  presentarse y guiar los siguientes pasos. Esto mantiene la guía de primer uso separada
  de tu conversación normal. Consulta [Inicialización](/es/start/bootstrapping) para saber
  qué ocurre en el host del gateway durante la primera ejecución del agente.
</Step>
</Steps>

## Relacionado

- [Descripción general de la incorporación](/es/start/onboarding-overview)
- [Primeros pasos](/es/start/getting-started)
