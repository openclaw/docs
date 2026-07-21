---
read_when:
    - Diseño del asistente de incorporación de macOS
    - Implementación de la configuración de autenticación o identidad
sidebarTitle: 'Onboarding: macOS App'
summary: Flujo de configuración inicial de OpenClaw (aplicación para macOS)
title: Incorporación (aplicación para macOS)
x-i18n:
    generated_at: "2026-07-21T09:13:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 55154774886c530de92b2110d367af24e2142fac48b901f288582d8552a6ca10
    source_path: start/onboarding.md
    workflow: 16
---

Flujo de primera ejecución de la aplicación para macOS: elija dónde se ejecuta el Gateway, conecte un backend de IA verificado, conceda permisos y dé paso al ritual de inicialización propio del agente.
Para conocer la incorporación mediante la CLI y comparar ambas rutas, consulte [Descripción general de la incorporación](/es/start/onboarding-overview).

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
<Frame caption="Lea el aviso de seguridad que se muestra y decida en consecuencia">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modelo de confianza de seguridad:

- De forma predeterminada, OpenClaw es un agente personal: un único límite de confianza para un operador de confianza.
- Las configuraciones compartidas o multiusuario deben restringirse: separe los límites de confianza, mantenga al mínimo el acceso a herramientas y siga las indicaciones de [Seguridad](/es/gateway/security).
- La incorporación local establece de forma predeterminada las configuraciones nuevas en `tools.profile: "coding"`, para que las instalaciones nuevas conserven las herramientas del sistema de archivos y del entorno de ejecución sin el perfil `full` sin restricciones.
- Si se habilitan hooks/webhooks u otras fuentes de contenido que no sean de confianza, utilice un nivel de modelo moderno y potente, y mantenga políticas de herramientas y aislamiento estrictos.

</Step>
<Step title="Local o remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

¿Dónde se ejecuta el **Gateway**?

- **Este Mac (solo local):** la incorporación configura la autenticación y guarda las credenciales localmente.
- **Remoto (mediante SSH/Tailnet):** la incorporación **no** configura la autenticación local;
  las credenciales ya deben existir en el host del Gateway. El campo del token
  del Gateway remoto almacena el token que la aplicación para macOS utiliza para conectarse a ese Gateway;
  los valores SecretRef `gateway.remote.token` existentes se conservan hasta que
  se sustituyan.
- **Configurar más tarde:** omita la configuración y deje la aplicación sin configurar.

<Tip>
**Consejo sobre la autenticación del Gateway:**

- El modo de autenticación del Gateway se establece de forma predeterminada en `token` incluso para enlaces de bucle invertido, por lo que los clientes WS locales deben autenticarse.
- Establecer `gateway.auth.mode: "none"` permite que cualquier proceso local se conecte; utilícelo únicamente en equipos totalmente fiables.
- Utilice un token para el acceso desde varios equipos o los enlaces que no sean de bucle invertido.

</Tip>
</Step>
<Step title="CLI">
  La configuración local instala la CLI global `openclaw` mediante npm, pnpm o bun,
  con preferencia por npm. Node sigue siendo el entorno de ejecución recomendado para el propio Gateway.
  Las instalaciones compatibles existentes se reutilizan.
</Step>
<Step title="Conectar la IA">
  Un Gateway conectado que ya tenga configurado un modelo de agente omite esta
  página por completo y abre la interfaz normal del agente. La configuración de OpenClaw y del proveedor
  solo se ejecuta en un Gateway nuevo o incompleto.

Cuando el Gateway está listo, la incorporación busca accesos de IA que ya estén disponibles:
un inicio de sesión de Claude Code o Codex, `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`, o un
modelo compatible con herramientas que tenga al menos 16K de contexto efectivo medido y ya esté
instalado en un servidor Ollama o LM Studio accesible. La detección se ejecuta en el
host del Gateway, incluso cuando la aplicación para macOS se conecta a un Gateway de Linux. La mejor
opción se prueba con una finalización real y solo se guarda
después de responder; cuando una prueba falla, la aplicación intenta automáticamente la siguiente opción
y muestra por qué falló la anterior. Si se encuentran varias opciones, es posible
cambiar entre ellas antes de continuar. La detección local automática nunca obtiene
ni descarga un modelo.

Para utilizar una suscripción de Claude cuando el host del Gateway no tiene un inicio de sesión de la CLI de Claude, ejecute
`claude setup-token` en cualquier equipo que tenga Claude Code instalado y pegue después el
token impreso como **Anthropic setup-token** en **Connect with an API key or
token**.

Las CLI instaladas de Gemini CLI, Antigravity, Pi y OpenCode se muestran como contexto
cuando no pueden seleccionarse como ruta reutilizable de inferencia para la configuración guiada.
Gemini y Antigravity no pueden aplicar la prueba de inferencia sin herramientas. Pi y
OpenCode son sistemas completos de agentes, no rutas de inferencia para la configuración; sus
integraciones de sesión requieren una configuración separada del entorno de ejecución y del Plugin.

También es posible iniciar sesión mediante el flujo de OAuth o de emparejamiento de dispositivos propio del proveedor.
Las opciones integradas incluyen OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global y CN, y Chutes. La lista procede de los
plugins de proveedores de inferencia de texto activos del Gateway, no de una lista fija de la aplicación,
por lo que otro proveedor puede participar sin añadir código para macOS específico del proveedor.

El selector manual de clave o token utiliza el mismo registro de proveedores. En todas las rutas,
el proveedor suministra su modelo inicial y su configuración; OpenClaw verifica
la credencial con la misma prueba en vivo antes de almacenar su perfil de autenticación. La opción Siguiente
permanece bloqueada hasta que un backend la haya superado, por lo que el primer chat del agente no puede
iniciarse sin una inferencia operativa. Después de que se supere esa comprobación en vivo, OpenClaw queda
disponible para ayudar a configurar el resto del espacio de trabajo, el Gateway, los canales y
otras funciones opcionales. Cuando OpenClaw ofrece una lista breve de opciones, la aplicación
muestra tarjetas de opciones nativas; al elegir una se envía la selección, y **Skip for
now** siempre mantiene la elección como opcional. OpenClaw también está disponible más adelante en
Settings → OpenClaw.
</Step>
<Step title="Importar recuerdos (se muestra cuando se detectan)">
Para un Gateway local, la incorporación comprueba si el Mac contiene recuerdos de herramientas de IA
compatibles: la memoria automática de Claude Code, los recuerdos consolidados de Codex y los archivos de memoria
de Hermes. Cuando se encuentra alguno, esta página enumera cada origen con su cantidad de recuerdos
y permite importar los orígenes seleccionados al espacio de trabajo del agente en
`memory/imports/` para su recuperación indexada. Los archivos ya importados se omiten y
la página nunca aparece cuando no hay nada que importar. Omitir este paso es seguro; la
página de importación de memoria del panel ofrece la misma importación más adelante con control
por archivo.
</Step>
<Step title="Permisos">

<Frame caption="Elija qué permisos desea conceder a OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

La incorporación solicita permisos de TCC para: Automatización (AppleScript), Notificaciones, Accesibilidad, Grabación de pantalla, Micrófono, Reconocimiento de voz, Cámara y Ubicación.

</Step>
<Step title="Finalizar">
  Después de superar la inferencia, OpenClaw se encarga del resto de la configuración opcional y puede
  dar paso al chat normal del agente. Al finalizar el recorrido por los permisos,
  se abre ese mismo chat; la aplicación no crea un espacio de trabajo ni inicia una conversación
  independiente de configuración del agente antes de OpenClaw. Consulte
  [Inicialización](/es/start/bootstrapping) para saber qué ocurre en el host del Gateway
  durante el primer turno real del agente.
</Step>
</Steps>

## Contenido relacionado

- [Descripción general de la incorporación](/es/start/onboarding-overview)
- [Primeros pasos](/es/start/getting-started)
