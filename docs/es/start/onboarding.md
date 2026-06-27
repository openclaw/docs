---
read_when:
    - Diseñar el asistente de incorporación de macOS
    - Implementar la configuración de autenticación o identidad
sidebarTitle: 'Onboarding: macOS App'
summary: Flujo de configuración inicial de OpenClaw (app de macOS)
title: Incorporación (aplicación de macOS)
x-i18n:
    generated_at: "2026-06-27T12:58:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 73f902bcbb7ef782d4a5fbe442a8855a8fcb426d45167c4d2fc1fc050263b5f1
    source_path: start/onboarding.md
    workflow: 16
---

Este documento describe el flujo de configuración de primera ejecución **actual**. El objetivo es una experiencia de "día 0"
fluida: elegir dónde se ejecuta el Gateway, conectar la autenticación, ejecutar el
asistente y dejar que el agente se inicialice por sí mismo.
Para obtener una descripción general de las rutas de incorporación, consulta [Descripción general de la incorporación](/es/start/onboarding-overview).

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
<Frame caption="Lee el aviso de seguridad mostrado y decide según corresponda">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modelo de confianza de seguridad:

- De forma predeterminada, OpenClaw es un agente personal: un límite de operador de confianza.
- Las configuraciones compartidas/multiusuario requieren bloqueo estricto (separar límites de confianza, mantener el acceso a herramientas al mínimo y seguir [Seguridad](/es/gateway/security)).
- La incorporación local ahora establece de forma predeterminada las configuraciones nuevas en `tools.profile: "coding"` para que las configuraciones locales nuevas mantengan las herramientas de sistema de archivos/tiempo de ejecución sin forzar el perfil `full` sin restricciones.
- Si los hooks/webhooks u otras fuentes de contenido no confiables están habilitados, usa un nivel de modelo moderno y potente, y mantén una política de herramientas/sandboxing estricta.

</Step>
<Step title="Local vs. remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

¿Dónde se ejecuta el **Gateway**?

- **Este Mac (solo local):** la incorporación puede configurar la autenticación y escribir credenciales
  localmente.
- **Remoto (por SSH/Tailnet):** la incorporación **no** configura la autenticación local;
  las credenciales deben existir en el host del gateway. El campo de token del gateway remoto
  almacena el token usado por la app de macOS para conectarse a ese Gateway; los valores
  `gateway.remote.token` no en texto plano existentes se conservan hasta que los reemplaces.
- **Configurar más tarde:** omitir la configuración y dejar la app sin configurar.

<Tip>
**Consejo de autenticación del Gateway:**

- El asistente ahora genera un **token** incluso para loopback, por lo que los clientes WS locales deben autenticarse.
- Si deshabilitas la autenticación, cualquier proceso local puede conectarse; úsalo solo en máquinas totalmente confiables.
- Usa un **token** para acceso desde varias máquinas o enlaces que no sean loopback.

</Tip>
</Step>
<Step title="Permisos">
<Frame caption="Elige qué permisos quieres otorgar a OpenClaw">
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
  Prefiere npm primero, luego pnpm y luego bun si es el único gestor de paquetes
  detectado. Para el tiempo de ejecución del Gateway, Node sigue siendo la ruta recomendada.
</Step>
<Step title="Chat de incorporación (sesión dedicada)">
  Después de la configuración, la app abre una sesión de chat de incorporación dedicada para que el agente pueda
  presentarse y guiar los siguientes pasos. Esto mantiene la guía de primera ejecución separada
  de tu conversación normal. Consulta [Inicialización](/es/start/bootstrapping) para ver
  qué ocurre en el host del gateway durante la primera ejecución del agente.
</Step>
</Steps>

## Relacionado

- [Descripción general de la incorporación](/es/start/onboarding-overview)
- [Primeros pasos](/es/start/getting-started)
