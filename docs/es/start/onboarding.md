---
read_when:
    - Diseño del asistente de incorporación de macOS
    - Implementación de la configuración de autenticación o identidad
sidebarTitle: 'Onboarding: macOS App'
summary: Flujo de configuración inicial de OpenClaw (aplicación para macOS)
title: Incorporación (aplicación para macOS)
x-i18n:
    generated_at: "2026-07-19T02:26:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 19527a001bf4e06a214a03872d1a60f66cc90067dbebf87a7798eb46ff0260d5
    source_path: start/onboarding.md
    workflow: 16
---

El flujo de primera ejecución de la aplicación para macOS: elegir dónde se ejecuta el Gateway, conectar un backend de IA verificado, conceder permisos y pasar al ritual de arranque propio del agente.
Para obtener información sobre la incorporación mediante la CLI y una comparación de ambas rutas, consulte [Descripción general de la incorporación](/es/start/onboarding-overview).

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
<Frame caption="Lea el aviso de seguridad mostrado y decida en consecuencia">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modelo de confianza de seguridad:

- De forma predeterminada, OpenClaw es un agente personal: un único límite de confianza para un operador de confianza.
- Las configuraciones compartidas o multiusuario deben protegerse: separe los límites de confianza, mantenga al mínimo el acceso a las herramientas y siga las indicaciones de [Seguridad](/es/gateway/security).
- De forma predeterminada, la incorporación local establece las configuraciones nuevas en `tools.profile: "coding"`, para que las instalaciones nuevas conserven las herramientas del sistema de archivos y del entorno de ejecución sin el perfil `full` sin restricciones.
- Si se habilitan hooks, webhooks u otras fuentes de contenido que no sean de confianza, use un nivel de modelo moderno y potente, y mantenga una política de herramientas y un aislamiento estrictos.

</Step>
<Step title="Local o remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

¿Dónde se ejecuta el **Gateway**?

- **Este Mac (solo local):** la incorporación configura la autenticación y guarda las credenciales localmente.
- **Remoto (mediante SSH/Tailnet):** la incorporación **no** configura la autenticación local;
  las credenciales ya deben existir en el host del Gateway. El campo del token
  del Gateway remoto almacena el token que utiliza la aplicación para macOS
  para conectarse a ese Gateway; los valores SecretRef `gateway.remote.token`
  existentes se conservan hasta que se sustituyan.
- **Configurar más tarde:** omita la configuración y deje la aplicación sin configurar.

<Tip>
**Consejo sobre la autenticación del Gateway:**

- El modo de autenticación del Gateway se establece de forma predeterminada en `token` incluso para enlaces de bucle invertido, por lo que los clientes WS locales deben autenticarse.
- Establecer `gateway.auth.mode: "none"` permite que se conecte cualquier proceso local; úselo únicamente en máquinas totalmente fiables.
- Use un token para el acceso desde varias máquinas o para enlaces que no sean de bucle invertido.

</Tip>
</Step>
<Step title="CLI">
  La configuración local instala la CLI global `openclaw` mediante npm, pnpm o bun,
  dando prioridad a npm. Node sigue siendo el entorno de ejecución recomendado para el propio Gateway.
  Se reutilizan las instalaciones compatibles existentes.
</Step>
<Step title="Conecte su IA">
  Un Gateway conectado que ya tenga configurado un modelo de agente omite esta
  página por completo y abre la interfaz habitual del agente. La configuración
  de OpenClaw y del proveedor solo se ejecuta para un Gateway nuevo o incompleto.

Cuando el Gateway está listo, la incorporación busca el acceso a IA que ya esté disponible:
un inicio de sesión de Claude Code o Codex, `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`, o un
modelo con capacidad para usar herramientas ya instalado en un servidor Ollama o LM Studio accesible.
La detección se ejecuta en el host del Gateway, incluso cuando la aplicación para macOS se conecta a un
Gateway de Linux. La mejor opción se prueba con una finalización real y solo se guarda
después de que responda; cuando una prueba falla, la aplicación prueba automáticamente la siguiente opción
y muestra por qué falló la anterior. Si se encuentran varias opciones, se puede
cambiar entre ellas antes de continuar. La detección local automática nunca obtiene
ni descarga un modelo.

Para usar una suscripción a Claude cuando el host del Gateway no tenga una sesión iniciada en la CLI de Claude, ejecute
`claude setup-token` en cualquier máquina que tenga Claude Code instalado y, a continuación, pegue el
token mostrado como **Anthropic setup-token** en **Connect with an API key or
token**.

Las CLI instaladas de Gemini CLI, Antigravity, Pi y OpenCode se muestran como contexto
cuando no se pueden seleccionar como ruta reutilizable de inferencia para la configuración guiada.
Gemini y Antigravity no pueden aplicar la prueba de inferencia sin herramientas. Pi y
OpenCode son entornos completos para agentes, no rutas de inferencia para la configuración; sus
integraciones de sesión requieren una configuración independiente del entorno de ejecución y del Plugin.

También es posible iniciar sesión mediante el flujo de OAuth o emparejamiento de dispositivos del propio proveedor.
Las opciones integradas incluyen OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global y CN, y Chutes. La lista procede de los
plugins activos de proveedores de inferencia de texto del Gateway, en lugar de una lista fija de la aplicación,
por lo que otro proveedor puede participar sin añadir código específico del proveedor para macOS.

El selector manual de claves o tokens utiliza el mismo registro de proveedores. En todas las rutas,
el proveedor suministra su modelo inicial y su configuración; OpenClaw verifica
la credencial con la misma prueba en vivo antes de almacenar su perfil de autenticación. La opción para
continuar permanece bloqueada hasta que un backend haya superado la prueba, por lo que el primer chat del agente no puede
iniciarse sin una inferencia funcional. Después de que se supere esa comprobación en vivo, OpenClaw queda
disponible para ayudar a configurar el resto del espacio de trabajo, el Gateway, los canales y
otras funciones opcionales. Cuando OpenClaw ofrece una lista breve de opciones, la aplicación
muestra tarjetas de opciones nativas; al elegir una, se envía la selección, y **Skip for
now** siempre mantiene la opción como opcional. OpenClaw también está disponible posteriormente en
Settings → OpenClaw.
</Step>
<Step title="Importar recuerdos (se muestra cuando se detectan)">
Para un Gateway local, la incorporación busca en el Mac recuerdos de herramientas de IA
compatibles: la memoria automática de Claude Code, los recuerdos consolidados de Codex y los archivos
de memoria de Hermes. Cuando se encuentra alguno, esta página muestra cada fuente con su cantidad de recuerdos
y permite importar las fuentes seleccionadas al espacio de trabajo del agente en
`memory/imports/` para su recuperación indexada. Los archivos ya importados se omiten y
la página nunca aparece cuando no hay nada que importar. Omitir este paso es seguro; la página
de importación de memoria del panel ofrece posteriormente la misma importación con control
por archivo.
</Step>
<Step title="Permisos">

<Frame caption="Elija qué permisos desea conceder a OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

La incorporación solicita permisos de TCC para: Automatización (AppleScript), Notificaciones, Accesibilidad, Grabación de pantalla, Micrófono, Reconocimiento de voz, Cámara y Ubicación.

</Step>
<Step title="Finalizar">
  Después de que la inferencia supere la prueba, OpenClaw se encarga del resto de la configuración opcional y puede
  pasar al chat habitual del agente. Al finalizar el recorrido de permisos,
  se abre ese mismo chat; la aplicación no crea un espacio de trabajo ni inicia una conversación independiente
  de configuración del agente antes de OpenClaw. Consulte
  [Arranque](/es/start/bootstrapping) para saber qué ocurre en el host del Gateway
  durante el primer turno real del agente.
</Step>
</Steps>

## Contenido relacionado

- [Descripción general de la incorporación](/es/start/onboarding-overview)
- [Primeros pasos](/es/start/getting-started)
