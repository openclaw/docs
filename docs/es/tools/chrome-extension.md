---
read_when:
    - Quieres que un agente controle desde tu teléfono tu Chrome real con la sesión iniciada
    - Sigue apareciendo el aviso de Chrome «Allow remote debugging?» cuando no hay nadie frente al equipo
    - Quieres comprender el modelo de seguridad de la toma de control del navegador mediante la extensión
summary: 'Extensión de Chrome: permite que OpenClaw controle tu sesión iniciada de Chrome sin mostrar el aviso de depuración remota'
title: Extensión de Chrome
x-i18n:
    generated_at: "2026-07-11T23:33:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Extensión de Chrome

La extensión de Chrome de OpenClaw permite que un agente controle tus **pestañas de Chrome con sesión iniciada** sin abrir un navegador administrado independiente y **sin** el mensaje bloqueante de Chrome "Allow remote debugging?".

Esto es importante cuando controlas OpenClaw desde un teléfono (Telegram, WhatsApp, etc.): el [perfil `user`](/es/tools/browser#profiles-openclaw-user-chrome) se conecta mediante el puerto de depuración remota de Chrome, lo que muestra un cuadro de diálogo de consentimiento en el escritorio que nadie puede pulsar cuando estás fuera. En su lugar, la extensión usa la API `chrome.debugger`, por lo que la única indicación dentro de la página es el aviso descartable de Chrome "OpenClaw started debugging this browser".

Este es el mismo enfoque que utilizan las extensiones de Chrome de Claude de Anthropic y Codex de OpenAI.

## Cómo funciona

Consta de tres partes:

- **Servicio de control del navegador** (Gateway o host de Node): la API que invoca la herramienta `browser`.
- **Relay de la extensión** (WebSocket de local loopback): un pequeño servidor que el servicio de control inicia en `127.0.0.1`. Proporciona a OpenClaw un extremo del protocolo Chrome DevTools y se comunica con la extensión. Ambos extremos se autentican con un token local del host (consulta la información más adelante).
- **Extensión de Chrome de OpenClaw** (MV3): se conecta a las pestañas mediante `chrome.debugger`, reenvía el tráfico CDP y administra el **grupo de pestañas de OpenClaw**.

OpenClaw solo ve y controla las pestañas que están en el **grupo de pestañas de OpenClaw**. El grupo constituye el límite de consentimiento: arrastra una pestaña al grupo para compartirla y arrástrala fuera de él (o pulsa el botón de la barra de herramientas) para revocar el acceso de inmediato.

## Instalación y emparejamiento

1. Muestra la ruta de la extensión desempaquetada:

   ```bash
   openclaw browser extension path
   ```

2. Abre `chrome://extensions`, activa **Developer mode**, pulsa **Load unpacked** y selecciona el directorio mostrado.

3. Muestra la cadena de emparejamiento:

   ```bash
   openclaw browser extension pair
   ```

4. Pulsa el icono de OpenClaw en la barra de herramientas y pega la cadena de emparejamiento en la ventana emergente. La insignia cambia a **ON** cuando la extensión se conecta al relay.

El token de emparejamiento es un **secreto local del host** que se crea la primera vez que se usa y se almacena en `credentials/`, dentro del directorio de estado (modo `0600`). Cada máquina que ejecuta un navegador —el host del Gateway y cada host de Node del navegador— posee su propio token, por lo que ninguna credencial tiene que transferirse entre máquinas. Para rotarlo, elimina el archivo `browser-extension-relay.secret` y vuelve a realizar el emparejamiento.

## Uso

Selecciona el perfil integrado `chrome` en una llamada a la herramienta `browser` o configúralo como predeterminado:

```bash
openclaw config set browser.defaultProfile chrome
```

```json5
{
  browser: {
    profiles: {
      chrome: { driver: "extension", color: "#FF4500" },
    },
  },
}
```

- Para compartir una pestaña, pulsa el botón de OpenClaw en la barra de herramientas de esa pestaña (se unirá al grupo de pestañas de OpenClaw) o arrastra cualquier pestaña al grupo.
- El agente también puede abrir pestañas nuevas, que se incorporarán automáticamente al grupo.
- Para revocar el acceso, vuelve a pulsar el botón, arrastra la pestaña fuera del grupo o descarta el aviso de depuración de Chrome. El agente pierde inmediatamente el acceso a esa pestaña.

## Acceso remoto o entre máquinas

Chrome no tiene que ejecutarse en el host del Gateway. Se admiten tres topologías:

- **Mismo host** (Gateway y Chrome en una sola máquina): realiza el emparejamiento en esa máquina con `openclaw browser extension pair`. El relay solo está disponible mediante local loopback.
- **Conexión directa a un Gateway remoto** (Chrome en tu portátil, Gateway en un VPS y **nada más en el portátil**): ejecuta en el Gateway `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`. El comando muestra una cadena `wss://…/browser/extension#<secret>`; carga y empareja la extensión en el portátil. La extensión se conecta **directamente al Gateway** mediante `wss://`, sin necesidad de instalar OpenClaw, Node ni la CLI, ni de abrir un puerto de entrada en el portátil. Esta es la opción para alojamiento administrado.
- **Mediante un host de Node del navegador** (Chrome en una máquina que ya ejecuta un Node de OpenClaw): ejecuta `pair` en el Node y realiza el emparejamiento localmente; el Gateway redirige las acciones del navegador al Node mediante su enlace de Node autenticado existente.

El secreto de emparejamiento es específico de cada host (el del Gateway en el caso de la conexión directa) y la ruta `/browser/extension` del Gateway lo valida. Para la conexión directa, sirve el Gateway mediante TLS (`wss://`) para cifrar el secreto de emparejamiento y el tráfico CDP.
El secreto permanece en el fragmento de URL de la cadena de emparejamiento y se presenta durante el protocolo de enlace WebSocket como una credencial de subprotocolo, por lo que los registros de acceso habituales del proxy no lo reciben en la URL de la solicitud. Asegúrate de que cualquier proxy inverso conserve el encabezado estándar `Sec-WebSocket-Protocol`.

## Diagnóstico

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` indica que la comprobación del **relay de la extensión de Chrome** falla hasta que la ventana emergente de la extensión muestra **Connected**.

## Modelo de seguridad

- El relay solo se vincula a local loopback; ambos extremos de WebSocket se autentican con el token derivado y se comprueba que el origen del extremo de la extensión sea `chrome-extension://`.
- El emparejamiento directo con el Gateway no acepta el token del relay en la URL de la solicitud; la extensión incluida lo transporta en la lista de subprotocolos de WebSocket.
- El agente solo puede ver y controlar las pestañas del **grupo de pestañas de OpenClaw**. Las demás pestañas permanecen privadas.
- En comparación con el perfil `user` (MCP de Chrome), que expone todo el navegador con sesión iniciada una vez que apruebas el mensaje de depuración remota, la extensión limita la superficie compartida a un grupo de pestañas que puedes controlar de un vistazo.

Consulta también: [Navegador](/es/tools/browser) para obtener información sobre el modelo completo de perfiles y los perfiles administrados `openclaw` y `user` de MCP de Chrome.
