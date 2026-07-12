---
read_when:
    - Diseño del asistente de incorporación de macOS
    - Implementación de la configuración de autenticación o identidad
sidebarTitle: 'Onboarding: macOS App'
summary: Flujo de configuración inicial de OpenClaw (aplicación para macOS)
title: Incorporación (aplicación para macOS)
x-i18n:
    generated_at: "2026-07-11T23:32:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

Flujo de primera ejecución de la aplicación para macOS: elige dónde se ejecuta el Gateway, conecta un backend de IA verificado, concede permisos y da paso al ritual de arranque del propio agente.
Para la incorporación mediante la CLI y una comparación de ambas rutas, consulta [Descripción general de la incorporación](/es/start/onboarding-overview).

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

- De forma predeterminada, OpenClaw es un agente personal: un único límite de confianza para un operador de confianza.
- Las configuraciones compartidas o multiusuario deben reforzarse: separa los límites de confianza, reduce al mínimo el acceso a herramientas y sigue las indicaciones de [Seguridad](/es/gateway/security).
- De forma predeterminada, la incorporación local establece `tools.profile: "coding"` en las configuraciones nuevas, para que las instalaciones nuevas conserven las herramientas del sistema de archivos y del entorno de ejecución sin usar el perfil `full` sin restricciones.
- Si se habilitan hooks, webhooks u otras fuentes de contenido no confiable, usa un nivel de modelo moderno y potente, y mantén políticas de herramientas y aislamiento estrictos.

</Step>
<Step title="Local o remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

¿Dónde se ejecuta el **Gateway**?

- **This Mac (Local only):** la incorporación configura la autenticación y guarda las credenciales localmente.
- **Remote (over SSH/Tailnet):** la incorporación **no** configura la autenticación local;
  las credenciales ya deben existir en el host del Gateway. El campo del token
  del Gateway remoto almacena el token que la aplicación para macOS usa para conectarse
  a ese Gateway; los valores SecretRef existentes de `gateway.remote.token` se conservan
  hasta que los reemplaces.
- **Configure later:** omite la configuración y deja la aplicación sin configurar.

<Tip>
**Consejo sobre la autenticación del Gateway:**

- El modo de autenticación del Gateway usa `token` de forma predeterminada, incluso para enlaces de local loopback, por lo que los clientes WS locales deben autenticarse.
- Establecer `gateway.auth.mode: "none"` permite conectarse a cualquier proceso local; úsalo únicamente en equipos de plena confianza.
- Usa un token para el acceso desde varios equipos o para enlaces que no sean de local loopback.

</Tip>
</Step>
<Step title="CLI">
  La configuración local instala globalmente la CLI `openclaw` mediante npm, pnpm o bun,
  con preferencia por npm. Node sigue siendo el entorno de ejecución recomendado para el propio
  Gateway. Las instalaciones compatibles existentes se reutilizan.
</Step>
<Step title="Conecta tu IA">
  Un Gateway conectado que ya tenga configurado un modelo de agente omite esta
  página por completo y abre la interfaz normal del agente. La configuración de
  Crestodian y del proveedor solo se ejecuta para un Gateway nuevo o incompleto.

Cuando el Gateway está listo, la incorporación busca accesos a IA que ya tengas:
un inicio de sesión de Claude Code o Codex, o `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`. La mejor opción se prueba con una finalización real y
solo se guarda después de responder; cuando una prueba falla, la aplicación intenta
automáticamente la siguiente opción y muestra por qué falló la anterior. Si se
encuentran varias opciones, puedes cambiar entre ellas antes de continuar.

Gemini CLI sigue estando disponible para los agentes normales después de la configuración,
pero no se ofrece aquí porque no puede aplicar la prueba de inferencia sin herramientas.

También puedes iniciar sesión mediante el flujo OAuth o de emparejamiento de dispositivos
del propio proveedor. Las opciones integradas incluyen OpenAI/ChatGPT, OpenRouter,
GitHub Copilot, Google Gemini CLI, xAI, MiniMax Global y CN, y Chutes. La lista
procede de los plugins de proveedores de inferencia de texto activos del Gateway, en lugar
de una lista fija de la aplicación, por lo que otro proveedor puede participar sin añadir
código específico del proveedor para macOS.

El selector manual de clave o token utiliza el mismo registro de proveedores. En todas las
rutas, el proveedor proporciona su modelo inicial y su configuración; OpenClaw verifica
la credencial con la misma prueba en vivo antes de almacenar su perfil de autenticación.
Siguiente permanece bloqueado hasta que un backend haya superado la prueba, por lo que
el primer chat del agente no puede comenzar sin una inferencia funcional. Cuando se supera
esa comprobación en vivo, Crestodian pasa a estar disponible para ayudar a configurar el resto
del espacio de trabajo, el Gateway, los canales y otras funciones opcionales; también está
disponible más adelante en Settings → Crestodian.
</Step>
<Step title="Permisos">

<Frame caption="Elige qué permisos quieres conceder a OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

La incorporación solicita permisos de TCC para: Automatización (AppleScript), Notificaciones, Accesibilidad, Grabación de pantalla, Micrófono, Reconocimiento de voz, Cámara y Ubicación.

</Step>
<Step title="Finalizar">
  Después de que la inferencia supere la prueba, Crestodian se encarga del resto de la
  configuración opcional y puede llevarte al chat normal del agente. Al finalizar el
  recorrido por los permisos, se abre ese mismo chat; la aplicación no crea un espacio
  de trabajo ni inicia una conversación independiente de configuración del agente antes
  de Crestodian. Consulta [Arranque](/es/start/bootstrapping) para saber qué sucede en el host
  del Gateway durante el primer turno real del agente.
</Step>
</Steps>

## Contenido relacionado

- [Descripción general de la incorporación](/es/start/onboarding-overview)
- [Primeros pasos](/es/start/getting-started)
