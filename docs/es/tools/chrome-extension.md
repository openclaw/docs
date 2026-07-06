---
read_when:
    - Quieres que un agente controle tu Chrome real con sesión iniciada desde tu teléfono
    - Sigues encontrándote con el aviso de Chrome "¿Permitir la depuración remota?" sin nadie en el escritorio
    - Quieres entender el modelo de seguridad de la toma de control del navegador mediante la extensión.
summary: 'Extensión de Chrome: permite que OpenClaw controle tu Chrome con sesión iniciada sin aviso de depuración remota'
title: Extensión de Chrome
x-i18n:
    generated_at: "2026-07-06T10:53:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c189e8f5585fb28544190690a2177e247d6f7e213b1e33c0534d74dde2eeae62
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Extensión de Chrome

La extensión de Chrome de OpenClaw permite que un agente controle tus **pestañas
de Chrome con sesión iniciada** sin lanzar un navegador gestionado separado y
**sin** el aviso bloqueante de Chrome "¿Permitir depuración remota?".

Esto importa cuando controlas OpenClaw desde un teléfono (Telegram, WhatsApp,
etc.): el perfil [`user`](/es/tools/browser#profiles-openclaw-user-chrome) se
conecta mediante el puerto de depuración remota de Chrome, lo que muestra un
diálogo de consentimiento en el escritorio que nadie puede pulsar cuando estás
lejos. En su lugar, la extensión usa la API `chrome.debugger`, así que la única
señal dentro de la página es el banner descartable de Chrome "OpenClaw empezó a
depurar este navegador".

Esta es la misma estructura que usan las extensiones de Chrome de Claude de
Anthropic y Codex de OpenAI.

## Cómo funciona

Tres partes:

- **Servicio de control del navegador** (Gateway o host de nodo): la API a la
  que llama la herramienta `browser`.
- **Relay de la extensión** (WebSocket loopback): un servidor pequeño que el
  servicio de control inicia en `127.0.0.1`. Presenta a OpenClaw un endpoint de
  Chrome DevTools Protocol y se comunica con la extensión. Ambos lados se
  autentican con un token local del host (ver abajo).
- **Extensión de Chrome de OpenClaw** (MV3): se adjunta a las pestañas con
  `chrome.debugger`, reenvía el tráfico CDP y gestiona el **grupo de pestañas
  de OpenClaw**.

OpenClaw solo ve y controla las pestañas que están en el **grupo de pestañas de
OpenClaw**. El grupo es el límite de consentimiento: arrastra una pestaña dentro
para compartirla, arrástrala fuera (o pulsa el botón de la barra de
herramientas) para revocar el acceso al instante.

## Instalar y emparejar

1. Imprime la ruta de la extensión sin empaquetar:

   ```bash
   openclaw browser extension path
   ```

2. Abre `chrome://extensions`, activa **Modo de desarrollador**, haz clic en
   **Cargar sin empaquetar** y selecciona el directorio impreso.

3. Imprime la cadena de emparejamiento:

   ```bash
   openclaw browser extension pair
   ```

4. Haz clic en el icono de OpenClaw en la barra de herramientas y pega la cadena
   de emparejamiento en el popup. La insignia cambia a **ACTIVADO** cuando la
   extensión se conecta al relay.

El token de emparejamiento es un **secreto local del host** creado en el primer
uso y almacenado bajo `credentials/` en el directorio de estado (modo `0600`).
Cada máquina que ejecuta un navegador —el host de Gateway y cada host de nodo de
navegador— tiene su propio token, así que ninguna credencial tiene que viajar
entre máquinas. Para rotarlo, elimina el archivo `browser-extension-relay.secret`
y empareja de nuevo.

## Usarlo

Selecciona el perfil integrado `chrome` en una llamada a la herramienta
`browser`, o conviértelo en el predeterminado:

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

- Compartir una pestaña: haz clic en el botón de OpenClaw en la barra de
  herramientas en esa pestaña (se une al grupo de pestañas de OpenClaw), o
  arrastra cualquier pestaña al grupo.
- El agente también puede abrir pestañas nuevas; estas entran automáticamente en
  el grupo.
- Revocar: haz clic de nuevo en el botón, arrastra la pestaña fuera del grupo o
  descarta el banner de depuración de Chrome. El agente pierde el acceso a esa
  pestaña de inmediato.

## Nodos de navegador remotos

La extensión funciona tanto si Chrome se ejecuta en el host de Gateway como en
un [host de nodo de navegador](/es/tools/browser#local-vs-remote-control) separado.
El relay siempre es solo loopback y se ejecuta **en la máquina con el
navegador**:

- **Mismo host** (Gateway + Chrome en una máquina): empareja en esa máquina.
- **Nodo remoto** (Chrome en un nodo, Gateway en otro lugar): ejecuta
  `openclaw browser extension path` / `pair` **en el nodo**, carga y empareja la
  extensión allí. Gateway proxifica las acciones del navegador hacia el nodo
  mediante su enlace de nodo autenticado existente; el relay local del nodo
  controla la extensión. No se abre ningún puerto entrante nuevo en el nodo.

El token de emparejamiento es por host, así que cada nodo imprime su propia
cadena.

## Diagnóstico

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` informa que la comprobación del **relay de la extensión de Chrome**
falla hasta que el popup de la extensión muestra **Conectado**.

## Modelo de seguridad

- El relay se vincula solo a loopback; ambos lados del WebSocket se autentican
  con el token derivado, y el lado de la extensión se verifica por origen como
  `chrome-extension://`.
- El agente solo puede ver y controlar pestañas en el **grupo de pestañas de
  OpenClaw**. Tus otras pestañas permanecen privadas.
- En comparación con el perfil `user` (Chrome MCP), que expone todo tu navegador
  con sesión iniciada una vez que apruebas el aviso de depuración remota, la
  extensión mantiene la superficie compartida limitada a un grupo de pestañas
  que controlas de un vistazo.

Ver también: [Navegador](/es/tools/browser) para el modelo completo de perfiles y
los perfiles gestionados `openclaw` y `user` de Chrome MCP.
