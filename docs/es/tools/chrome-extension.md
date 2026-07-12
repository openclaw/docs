---
read_when:
    - Quieres que un agente controle tu Chrome real con la sesión iniciada desde tu teléfono
    - Sigues encontrándote con el aviso de Chrome «Allow remote debugging?» cuando no hay nadie frente al equipo
    - Quiere comprender el modelo de seguridad de la toma de control del navegador mediante la extensión
summary: 'Extensión de Chrome: permite que OpenClaw controle tu sesión iniciada en Chrome sin mostrar el aviso de depuración remota'
title: Extensión de Chrome
x-i18n:
    generated_at: "2026-07-12T14:52:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: cb3f7d4bd9d933e0e876d21a1edf07bafbdc18d0196ce636981bd11ad5f2facd
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Extensión de Chrome

La extensión de Chrome de OpenClaw permite que un agente controle las **pestañas de Chrome
con sesión iniciada** sin abrir un navegador administrado independiente y **sin** el
aviso bloqueante de Chrome «Allow remote debugging?».

Esto es importante cuando se controla OpenClaw desde un teléfono (Telegram, WhatsApp, etc.):
el [perfil `user`](/es/tools/browser#profiles-openclaw-user-chrome) se conecta mediante
el puerto de depuración remota de Chrome, lo que muestra un cuadro de diálogo de consentimiento
en el escritorio que nadie puede pulsar cuando no se está presente. En su lugar, la extensión
utiliza la API `chrome.debugger`, por lo que la única indicación dentro de la página es el
banner descartable de Chrome «OpenClaw started debugging this browser».

Esta es la misma arquitectura que utilizan las extensiones de Chrome de Claude de Anthropic
y Codex de OpenAI.

## Cómo funciona

Consta de tres partes:

- **Servicio de control del navegador** (Gateway o host del Node): la API a la que llama
  la herramienta `browser`.
- **Relé de la extensión** (WebSocket de bucle invertido): un pequeño servidor que el servicio
  de control inicia en `127.0.0.1`. Proporciona a OpenClaw un punto de conexión del
  protocolo Chrome DevTools y se comunica con la extensión. Ambas partes se autentican con
  un token local del host (véase más adelante).
- **Extensión de Chrome de OpenClaw** (MV3): se conecta a las pestañas mediante `chrome.debugger`,
  reenvía el tráfico CDP y administra el **grupo de pestañas de OpenClaw**.

OpenClaw solo puede ver y controlar las pestañas que están en el **grupo de pestañas de OpenClaw**.
El grupo es el límite de consentimiento: arrastre una pestaña dentro para compartirla y arrástrela
fuera (o haga clic en el botón de la barra de herramientas) para revocar el acceso al instante.

## Instalación y vinculación

1. Muestre la ruta de la extensión sin empaquetar:

   ```bash
   openclaw browser extension path
   ```

2. Abra `chrome://extensions`, active **Developer mode**, haga clic en **Load
   unpacked** y seleccione el directorio mostrado.

3. Muestre la cadena de vinculación:

   ```bash
   openclaw browser extension pair
   ```

4. Haga clic en el icono de OpenClaw de la barra de herramientas y pegue la cadena de vinculación
   en la ventana emergente. La insignia cambia a **ON** cuando la extensión se conecta al relé.

El token de vinculación es un **secreto local del host** que se crea la primera vez que se usa y se
almacena en `credentials/`, dentro del directorio de estado (modo `0600`). Cada máquina que
ejecuta un navegador —el host del Gateway y cada host del Node del navegador— tiene su propio
token, por lo que no es necesario transferir credenciales entre máquinas. Para rotarlo, elimine el
archivo `browser-extension-relay.secret` y vuelva a realizar la vinculación.

## Uso

Seleccione el perfil integrado `chrome` en una llamada a la herramienta `browser` o establézcalo
como predeterminado:

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

- Para compartir una pestaña: haga clic en el botón de OpenClaw de la barra de herramientas
  de esa pestaña (se unirá al grupo de pestañas de OpenClaw), o arrastre cualquier pestaña al grupo.
- El agente también puede abrir pestañas nuevas, que se añaden automáticamente al grupo.
- Para revocar el acceso: vuelva a hacer clic en el botón, arrastre la pestaña fuera del grupo
  o descarte el banner de depuración de Chrome. El agente pierde el acceso a esa pestaña de inmediato.

## Acceso remoto o entre máquinas

Chrome no tiene que ejecutarse en el host del Gateway. Se admiten tres topologías:

- **Mismo host** (Gateway y Chrome en una sola máquina): realice la vinculación en esa máquina
  con `openclaw browser extension pair`. El relé solo admite conexiones de bucle invertido.
- **Conexión directa a un Gateway remoto** (Chrome en el portátil, Gateway en un VPS y
  **nada más en el portátil**): en el Gateway, ejecute
  `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`.
  Esto muestra una cadena `wss://…/browser/extension#<secret>`; cargue y vincule la
  extensión en el portátil. La extensión se conecta **directamente al Gateway**
  mediante `wss://`: no se requiere ninguna instalación de OpenClaw, Node, CLI ni ningún
  puerto de entrada abierto en el portátil. Esta es la opción para el alojamiento administrado.
- **Mediante un host del Node del navegador** (Chrome en una máquina que ya ejecuta un Node
  de OpenClaw): ejecute `pair` en el Node y realice la vinculación localmente; el Gateway
  redirige las acciones del navegador al Node mediante su enlace de Node autenticado existente.

El secreto de vinculación es específico de cada host (el del Gateway en el caso directo) y lo
valida la ruta `/browser/extension` del Gateway. Para la conexión directa, publique el Gateway
mediante TLS (`wss://`) para que el secreto de vinculación y el tráfico CDP estén cifrados.
El secreto permanece en el fragmento de URL de la cadena de vinculación y se presenta durante
el protocolo de enlace de WebSocket como una credencial de subprotocolo, por lo que los registros
de acceso habituales del proxy no lo reciben en la URL de la solicitud. Asegúrese de que cualquier
proxy inverso conserve el encabezado estándar `Sec-WebSocket-Protocol`.

## Diagnóstico

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` indica que la comprobación del **relé de la extensión de Chrome** falla hasta que la
ventana emergente de la extensión muestra **Connected**.

## Modelo de seguridad

- El relé solo escucha en la interfaz de bucle invertido; ambos extremos de WebSocket se autentican
  con el token derivado y se comprueba que el origen de la extensión sea `chrome-extension://`.
- La vinculación directa con el Gateway no acepta el token del relé en la URL de la solicitud;
  la extensión incluida lo transporta en la lista de subprotocolos de WebSocket.
- El agente solo puede ver y controlar las pestañas del **grupo de pestañas de OpenClaw**. Las
  demás pestañas permanecen privadas.
- En comparación con el perfil `user` (Chrome MCP), que expone todo el navegador con sesión
  iniciada una vez aprobado el aviso de depuración remota, la extensión limita la superficie
  compartida a un grupo de pestañas que se puede controlar de un vistazo.

Consulte también: [Navegador](/es/tools/browser) para conocer el modelo completo de perfiles y los
perfiles administrados `openclaw` y `user` de Chrome MCP.
