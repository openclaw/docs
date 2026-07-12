---
read_when:
    - Diseño del asistente de incorporación de macOS
    - Implementación de la configuración de autenticación o identidad
sidebarTitle: 'Onboarding: macOS App'
summary: Flujo de configuración inicial de OpenClaw (aplicación para macOS)
title: Incorporación (aplicación para macOS)
x-i18n:
    generated_at: "2026-07-12T14:51:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cced671a375bd80cbdf920383add8cf01f75a85259963a4286e9ce49913d8b47
    source_path: start/onboarding.md
    workflow: 16
---

Flujo de primera ejecución de la aplicación para macOS: elegir dónde se ejecuta el Gateway, conectar un backend de IA verificado, conceder permisos y transferir el control al ritual de arranque propio del agente.
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
<Frame caption="Lea el aviso de seguridad mostrado y decida en consecuencia">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

Modelo de confianza de seguridad:

- De forma predeterminada, OpenClaw es un agente personal: un único límite de confianza para un operador de confianza.
- Las configuraciones compartidas o multiusuario deben restringirse: separe los límites de confianza, mantenga al mínimo el acceso a las herramientas y siga las indicaciones de [Seguridad](/es/gateway/security).
- La incorporación local establece de forma predeterminada `tools.profile: "coding"` en las configuraciones nuevas, para que las instalaciones nuevas conserven las herramientas del sistema de archivos y del entorno de ejecución sin el perfil `full` sin restricciones.
- Si se habilitan hooks/webhooks u otras fuentes de contenido no confiable, utilice un nivel de modelo moderno y potente, y mantenga políticas de herramientas y aislamiento estrictos.

</Step>
<Step title="Local frente a remoto">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

¿Dónde se ejecuta el **Gateway**?

- **Este Mac (solo local):** la incorporación configura la autenticación y almacena las credenciales localmente.
- **Remoto (mediante SSH/Tailnet):** la incorporación **no** configura la autenticación local;
  las credenciales deben existir previamente en el host del Gateway. El campo del token del Gateway remoto
  almacena el token que la aplicación para macOS utiliza para conectarse a ese Gateway;
  los valores SecretRef existentes de `gateway.remote.token` se conservan hasta que se
  sustituyan.
- **Configurar más tarde:** omite la configuración y deja la aplicación sin configurar.

<Tip>
**Consejo sobre la autenticación del Gateway:**

- El modo de autenticación del Gateway utiliza `token` de forma predeterminada incluso para enlaces de bucle invertido, por lo que los clientes WS locales deben autenticarse.
- Establecer `gateway.auth.mode: "none"` permite que cualquier proceso local se conecte; utilícelo únicamente en máquinas totalmente confiables.
- Utilice un token para el acceso desde varias máquinas o para enlaces que no sean de bucle invertido.

</Tip>
</Step>
<Step title="CLI">
  La configuración local instala la CLI global `openclaw` mediante npm, pnpm o bun,
  con preferencia por npm. Node sigue siendo el entorno de ejecución recomendado para el propio
  Gateway. Se reutilizan las instalaciones compatibles existentes.
</Step>
<Step title="Conectar la IA">
  Si un Gateway conectado ya tiene configurado un modelo de agente, se omite por completo
  esta página y se abre la interfaz normal del agente. La configuración de Crestodian y del proveedor
  solo se ejecuta en un Gateway nuevo o incompleto.

Una vez que el Gateway está listo, la incorporación busca accesos a IA que ya estén disponibles:
un inicio de sesión de Claude Code o Codex, o `OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`. La mejor opción se prueba con una finalización real y
solo se guarda después de que responda; cuando una prueba falla, la aplicación intenta automáticamente
la siguiente opción y muestra por qué falló la anterior. Si se encuentran varias opciones,
es posible alternar entre ellas antes de continuar.

Gemini CLI sigue estando disponible para los agentes normales después de la configuración, pero no se
ofrece aquí porque no puede aplicar la prueba de inferencia sin herramientas.

También es posible iniciar sesión mediante el flujo OAuth o de emparejamiento de dispositivos propio del proveedor.
Las opciones integradas incluyen OpenAI/ChatGPT, OpenRouter, GitHub Copilot, Google
Gemini CLI, xAI, MiniMax Global y CN, y Chutes. La lista procede de los
plugins activos de proveedores de inferencia de texto del Gateway, en lugar de una lista fija de la aplicación,
por lo que otro proveedor puede participar sin añadir código de macOS específico del proveedor.

El selector manual de claves o tokens utiliza el mismo registro de proveedores. En todas las rutas,
el proveedor suministra su modelo inicial y su configuración; OpenClaw verifica
la credencial con la misma prueba en vivo antes de almacenar su perfil de autenticación. El botón Next
permanece bloqueado hasta que un backend haya superado la prueba, por lo que el primer chat del agente no puede
iniciarse sin una inferencia funcional. Después de superar esa comprobación en vivo, Crestodian pasa a estar
disponible para ayudar a configurar el resto del espacio de trabajo, el Gateway, los canales y
otras funciones opcionales; también está disponible más adelante en Settings → Crestodian.
</Step>
<Step title="Permisos">

<Frame caption="Elija qué permisos desea conceder a OpenClaw">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

La incorporación solicita permisos de TCC para: automatización (AppleScript), notificaciones, accesibilidad, grabación de pantalla, micrófono, reconocimiento de voz, cámara y ubicación.

</Step>
<Step title="Finalizar">
  Una vez superada la prueba de inferencia, Crestodian se encarga del resto de la configuración opcional y puede
  transferir el control al chat normal del agente. Al finalizar el recorrido de permisos,
  se abre ese mismo chat; la aplicación no crea un espacio de trabajo ni inicia una conversación independiente
  de configuración del agente antes de Crestodian. Consulte
  [Arranque](/es/start/bootstrapping) para saber qué sucede en el host del Gateway
  durante el primer turno real del agente.
</Step>
</Steps>

## Contenido relacionado

- [Descripción general de la incorporación](/es/start/onboarding-overview)
- [Primeros pasos](/es/start/getting-started)
