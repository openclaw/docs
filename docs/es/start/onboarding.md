---
read_when:
    - Diseñar el asistente de incorporación de macOS
    - Implementando la configuración de autenticación o identidad
sidebarTitle: 'Onboarding: macOS App'
summary: Flujo de configuración inicial de OpenClaw (aplicación para macOS)
title: Incorporación (app de macOS)
x-i18n:
    generated_at: "2026-07-06T21:54:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1cdd8600b0d86ec598266671715cebbbe1c86e951b6a95b3e166f2309d2a9130
    source_path: start/onboarding.md
    workflow: 16
---

El flujo de primera ejecución de la app de macOS: elige dónde se ejecuta el Gateway, conecta un
backend de IA verificado, concede permisos y cede el control al ritual de
bootstrap propio del agente.
Para el onboarding por CLI y una comparación de ambas rutas, consulta [Resumen del onboarding](/es/start/onboarding-overview).

<Steps>
<Step title="Aprobar advertencia de macOS">
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

- De forma predeterminada, OpenClaw es un agente personal: un límite de operador de confianza.
- Las configuraciones compartidas/multiusuario necesitan bloqueo: separa los límites de confianza, mantén el acceso a herramientas al mínimo y sigue [Seguridad](/es/gateway/security).
- El onboarding local establece las configuraciones nuevas en `tools.profile: "coding"` de forma predeterminada, para que las instalaciones nuevas conserven las herramientas de sistema de archivos/runtime sin el perfil `full` sin restricciones.
- Si se habilitan hooks/webhooks u otras fuentes de contenido no confiables, usa un nivel de modelo moderno y potente, y mantén una política de herramientas/sandboxing estricta.

</Step>
<Step title="Local vs remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

¿Dónde se ejecuta el **Gateway**?

- **Este Mac (solo local):** el onboarding configura la autenticación y escribe las credenciales localmente.
- **Remoto (por SSH/Tailnet):** el onboarding **no** configura la autenticación local;
  las credenciales ya deben existir en el host del Gateway. El campo del token
  del Gateway remoto almacena el token que usa la app de macOS para conectarse a ese Gateway;
  los valores SecretRef existentes de `gateway.remote.token` se conservan hasta que los
  reemplaces.
- **Configurar más tarde:** omite la configuración y deja la app sin configurar.

<Tip>
**Consejo de autenticación del Gateway:**

- El modo de autenticación del Gateway usa `token` de forma predeterminada incluso para enlaces loopback, por lo que los clientes WS locales deben autenticarse.
- Configurar `gateway.auth.mode: "none"` permite que cualquier proceso local se conecte; úsalo solo en máquinas completamente confiables.
- Usa un token para el acceso entre varias máquinas o enlaces que no sean loopback.

</Tip>
</Step>
<Step title="CLI">
  La configuración local instala la CLI global `openclaw` mediante npm, pnpm o bun,
  con preferencia por npm primero. Node sigue siendo el runtime recomendado para el propio
  Gateway. Las instalaciones compatibles existentes se reutilizan.
</Step>
<Step title="Conecta tu IA">
  Una vez que el Gateway está listo, el onboarding busca el acceso a IA que ya tienes:
  un inicio de sesión de Claude Code, Codex o Gemini CLI, o `OPENAI_API_KEY` /
  `ANTHROPIC_API_KEY`. La mejor opción se prueba con una completion real y
  solo se guarda después de responder; cuando una prueba falla, la app intenta automáticamente
  la siguiente opción y muestra por qué falló la anterior. Si se encuentran varias opciones,
  puedes alternar entre ellas antes de continuar.

Si no se encuentra nada (o nada funciona), el selector manual de clave/token carga los
plugins activos de proveedor de inferencia de texto del Gateway en lugar de usar una lista
fija de la app. El proveedor seleccionado aporta su modelo inicial y configuración; OpenClaw
verifica la credencial con la misma prueba en vivo antes de almacenar su perfil de autenticación. Siguiente
permanece bloqueado hasta que un backend haya pasado, por lo que el primer chat del agente no puede
iniciarse sin inferencia funcional. El chat de Crestodian sigue disponible desde esta
página (y más adelante en Configuración → Crestodian) para obtener ayuda en lenguaje sencillo.

Configurar más tarde omite este paso.
</Step>
<Step title="Permisos">

<Frame caption="Elige qué permisos quieres dar a OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

El onboarding solicita permisos TCC para: Automatización (AppleScript), Notificaciones, Accesibilidad, Grabación de pantalla, Micrófono, Reconocimiento de voz, Cámara y Ubicación.

</Step>
<Step title="Chat de onboarding (sesión dedicada)">
  Después de la configuración, la app abre un chat de onboarding de agente separado para que el agente pueda
  presentarse y guiar los siguientes pasos sin mezclar ese intercambio en el
  historial normal de conversación. Esto sigue a la conversación de configuración de Crestodian;
  no la reemplaza. Consulta [Bootstrapping](/es/start/bootstrapping) para ver qué
  ocurre en el host del Gateway durante el primer turno real del agente.
</Step>
</Steps>

## Relacionado

- [Resumen del onboarding](/es/start/onboarding-overview)
- [Primeros pasos](/es/start/getting-started)
