---
read_when:
    - Diseño del asistente de incorporación de macOS
    - Implementar la configuración de autenticación o identidad
sidebarTitle: 'Onboarding: macOS App'
summary: Configuración inicial de OpenClaw (app de macOS)
title: Incorporación (aplicación para macOS)
x-i18n:
    generated_at: "2026-07-05T17:41:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2784a013164bd07780378915643c1409bfe2217eb15ec5da3992d6d60c69bf59
    source_path: start/onboarding.md
    workflow: 16
---

El flujo de primera ejecución de la app de macOS: elige dónde se ejecuta el Gateway, conecta un
backend de IA verificado, concede permisos y cede el control al ritual de
arranque propio del agente.
Para el onboarding por CLI y una comparación de ambas rutas, consulta [Resumen de onboarding](/es/start/onboarding-overview).

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
- Las configuraciones compartidas/multiusuario necesitan endurecimiento: separa los límites de confianza, mantén el acceso a herramientas al mínimo y sigue [Seguridad](/es/gateway/security).
- El onboarding local establece de forma predeterminada las nuevas configuraciones en `tools.profile: "coding"` para que las configuraciones nuevas conserven las herramientas de sistema de archivos/runtime sin el perfil `full` sin restricciones.
- Si están habilitados hooks/webhooks u otros feeds de contenido no confiable, usa un nivel de modelo moderno y potente, y mantén una política de herramientas/sandboxing estricta.

</Step>
<Step title="Local frente a remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

¿Dónde se ejecuta el **Gateway**?

- **Este Mac (solo local):** el onboarding configura la autenticación y escribe las credenciales localmente.
- **Remoto (por SSH/Tailnet):** el onboarding **no** configura la autenticación local;
  las credenciales ya deben existir en el host del gateway. El campo de token
  del gateway remoto almacena el token que la app de macOS usa para conectarse a ese Gateway;
  los valores SecretRef existentes de `gateway.remote.token` se conservan hasta que los
  reemplaces.
- **Configurar más tarde:** omite la configuración y deja la app sin configurar.

<Tip>
**Consejo de autenticación del Gateway:**

- El modo de autenticación del Gateway usa `token` de forma predeterminada incluso para binds de loopback, por lo que los clientes WS locales deben autenticarse.
- Establecer `gateway.auth.mode: "none"` permite que cualquier proceso local se conecte; úsalo solo en máquinas totalmente confiables.
- Usa un token para acceso desde varias máquinas o binds que no sean de loopback.

</Tip>
</Step>
<Step title="CLI">
  La configuración local instala la CLI global `openclaw` mediante npm, pnpm o bun,
  con preferencia por npm primero. Node sigue siendo el runtime recomendado para el Gateway
  en sí. Las instalaciones compatibles existentes se reutilizan.
</Step>
<Step title="Conecta tu IA">
  Cuando el Gateway está listo, el onboarding busca acceso a IA que ya tengas:
  un inicio de sesión de Claude Code, Codex o Gemini CLI, o `OPENAI_API_KEY` /
  `ANTHROPIC_API_KEY`. La mejor opción se prueba con una finalización real y
  solo se guarda después de responder; cuando una prueba falla, la app intenta automáticamente
  la siguiente opción y muestra por qué falló la anterior. Si se encuentran varias opciones,
  puedes cambiar entre ellas antes de continuar.

Si no se encuentra nada (o nada funciona), un paso manual acepta una clave de API para
Anthropic, OpenAI o Google, la verifica de la misma manera y la almacena como
perfil de autenticación. Siguiente permanece bloqueado hasta que un backend haya superado su prueba en vivo,
por lo que el primer chat del agente nunca puede iniciarse sin inferencia funcional. El
chat de Crestodian sigue disponible desde esta página (y más adelante en
Configuración → Crestodian) para obtener ayuda en lenguaje claro.

Configurar más tarde omite este paso.
</Step>
<Step title="Permisos">

<Frame caption="Elige qué permisos quieres conceder a OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

El onboarding solicita permisos TCC para: Automatización (AppleScript), Notificaciones, Accesibilidad, Grabación de pantalla, Micrófono, Reconocimiento de voz, Cámara y Ubicación.

</Step>
<Step title="Chat de onboarding (sesión dedicada)">
  Después de la configuración, la app abre un chat de onboarding de agente separado para que el agente pueda
  presentarse y guiar los siguientes pasos sin mezclar ese intercambio en el
  historial normal de conversación. Esto sigue a la conversación de configuración de Crestodian;
  no la reemplaza. Consulta [Arranque](/es/start/bootstrapping) para ver qué
  ocurre en el host del gateway durante el primer turno real del agente.
</Step>
</Steps>

## Relacionado

- [Resumen de onboarding](/es/start/onboarding-overview)
- [Primeros pasos](/es/start/getting-started)
