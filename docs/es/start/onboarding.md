---
read_when:
    - Diseñar el asistente de incorporación de macOS
    - Implementar configuración de autenticación o identidad
sidebarTitle: 'Onboarding: macOS App'
summary: Flujo de configuración de primera ejecución para OpenClaw (app de macOS)
title: Incorporación (app de macOS)
x-i18n:
    generated_at: "2026-04-24T05:50:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: aa516f8f5b4c7318f27a5af4e7ac12f5685aef6f84579a68496c2497d6f9041d
    source_path: start/onboarding.md
    workflow: 15
---

Este documento describe el flujo **actual** de configuración de primera ejecución. El objetivo es una
experiencia fluida de “día 0”: elegir dónde se ejecuta el Gateway, conectar la autenticación, ejecutar el
asistente y dejar que el agente se inicialice por sí mismo.
Para una descripción general de las rutas de incorporación, consulta [Descripción general de la incorporación](/es/start/onboarding-overview).

<Steps>
<Step title="Aprobar la advertencia de macOS">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="Aprobar la búsqueda de redes locales">
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
- Las configuraciones compartidas/multiusuario requieren endurecimiento (dividir límites de confianza, mantener el acceso a herramientas al mínimo y seguir [Seguridad](/es/gateway/security)).
- La incorporación local ahora usa por defecto en las configuraciones nuevas `tools.profile: "coding"` para que las configuraciones locales nuevas mantengan herramientas de sistema de archivos/tiempo de ejecución sin forzar el perfil sin restricciones `full`.
- Si se habilitan hooks/webhooks u otras fuentes de contenido no fiable, usa un nivel de modelo moderno sólido y mantén una política estricta de herramientas/sandboxing.

</Step>
<Step title="Local vs Remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

¿Dónde se ejecuta el **Gateway**?

- **This Mac (Local only):** la incorporación puede configurar la autenticación y escribir credenciales
  localmente.
- **Remote (over SSH/Tailnet):** la incorporación **no** configura la autenticación local;
  las credenciales deben existir en el host del gateway.
- **Configure later:** omite la configuración y deja la app sin configurar.

<Tip>
**Consejo sobre autenticación del Gateway:**

- El asistente ahora genera un **token** incluso para loopback, por lo que los clientes WS locales deben autenticarse.
- Si desactivas la autenticación, cualquier proceso local puede conectarse; usa eso solo en máquinas completamente fiables.
- Usa un **token** para acceso desde varias máquinas o binds que no sean loopback.

</Tip>
</Step>
<Step title="Permisos">
<Frame caption="Elige qué permisos quieres dar a OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

La incorporación solicita los permisos TCC necesarios para:

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
  gestor de paquetes detectado. Para el tiempo de ejecución del Gateway, Node sigue siendo la ruta recomendada.
</Step>
<Step title="Chat de incorporación (sesión dedicada)">
  Después de la configuración, la app abre una sesión dedicada de chat de incorporación para que el agente pueda
  presentarse y guiar los siguientes pasos. Esto mantiene la guía de primera ejecución separada
  de tu conversación normal. Consulta [Inicialización](/es/start/bootstrapping) para ver
  qué sucede en el host del gateway durante la primera ejecución del agente.
</Step>
</Steps>

## Relacionado

- [Descripción general de la incorporación](/es/start/onboarding-overview)
- [Primeros pasos](/es/start/getting-started)
