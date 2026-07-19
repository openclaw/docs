---
read_when:
    - Quieres que un agente controle desde tu teléfono la sesión real de Chrome en la que has iniciado sesión
    - Te sigue apareciendo el aviso de Chrome «¿Permitir la depuración remota?» cuando no hay nadie frente al equipo
    - Quieres comprender el modelo de seguridad de la toma de control del navegador mediante la extensión
summary: 'Extensión de Chrome: permite que OpenClaw controle tu sesión iniciada en Chrome sin solicitar la depuración remota'
title: Extensión de Chrome
x-i18n:
    generated_at: "2026-07-19T13:41:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3d974f62bb5697a23dd6a6852137ce6af5a8a4a2a8ff738eec0098f259e8faa0
    source_path: tools/chrome-extension.md
    workflow: 16
---

# Extensión de Chrome

La extensión de Chrome de OpenClaw permite que un agente controle tus **pestañas
de Chrome con sesión iniciada** sin abrir un navegador administrado independiente y **sin** el
mensaje bloqueante de Chrome "Allow remote debugging?".

Esto es importante cuando controlas OpenClaw desde un teléfono (Telegram, WhatsApp, etc.):
el [perfil `user`](/es/tools/browser#profiles-openclaw-user-chrome) se conecta mediante
el puerto de depuración remota de Chrome, lo que muestra un cuadro de diálogo de consentimiento
en el escritorio que nadie puede pulsar cuando estás fuera. En su lugar, la extensión usa la API
`chrome.debugger`, por lo que la única indicación en la página es el aviso descartable de Chrome
"OpenClaw started debugging this browser".

Este es el mismo enfoque que utilizan las extensiones de Chrome de Claude de Anthropic y Codex
de OpenAI.

## Cómo funciona

Consta de tres partes:

- **Servicio de control del navegador** (Gateway o host del Node): la API a la que llama la
  herramienta `browser`.
- **Relé de la extensión** (WebSocket de bucle invertido): un pequeño servidor que el servicio de control
  inicia en `127.0.0.1`. Presenta a OpenClaw un punto de conexión del protocolo Chrome DevTools
  y se comunica con la extensión. Ambos extremos se autentican con un token
  local del host (consulta más adelante).
- **Extensión de Chrome de OpenClaw** (MV3): se conecta a las pestañas mediante `chrome.debugger`,
  reenvía el tráfico CDP y administra el **grupo de pestañas de OpenClaw**.

OpenClaw solo ve y controla las pestañas incluidas en el **grupo de pestañas de OpenClaw**. El
grupo constituye el límite de consentimiento: arrastra una pestaña dentro para compartirla y
fuera (o pulsa el botón de la barra de herramientas) para revocar el acceso de inmediato.

## Instalación y vinculación

1. Muestra la ruta de la extensión sin empaquetar:

   ```bash
   openclaw browser extension path
   ```

2. Abre `chrome://extensions`, activa **Developer mode**, pulsa **Load
   unpacked** y selecciona el directorio mostrado.

3. Muestra la cadena de vinculación:

   ```bash
   openclaw browser extension pair
   ```

4. Pulsa el icono de OpenClaw en la barra de herramientas y pega la cadena de vinculación en la ventana emergente.
   La insignia cambia a **ON** cuando la extensión se conecta al relé.

El token de vinculación es un **secreto local del host** que se crea durante el primer uso y se almacena
en `credentials/`, dentro del directorio de estado (modo `0600`). Cada máquina que
ejecuta un navegador —el host del Gateway y cada host de Node del navegador— posee su propio
token, por lo que ninguna credencial tiene que transferirse entre máquinas. Para rotarlo, elimina el archivo
`browser-extension-relay.secret` y vuelve a realizar la vinculación.

## Uso

Selecciona el perfil integrado `chrome` en una llamada a la herramienta `browser`, o configúralo como
predeterminado:

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

- Comparte una pestaña: pulsa el botón de OpenClaw en la barra de herramientas de esa pestaña (se incorporará al
  grupo de pestañas de OpenClaw), o arrastra cualquier pestaña al grupo.
- El agente también puede abrir pestañas nuevas, que se incorporan automáticamente al grupo.
- Revoca el acceso: vuelve a pulsar el botón, arrastra la pestaña fuera del grupo o descarta
  el aviso de depuración de Chrome. El agente pierde el acceso a esa pestaña de inmediato.

### Panel lateral del copiloto de pestaña

Después de vincular la extensión, pulsa **Open tab copilot** en la ventana emergente de su barra de herramientas.
OpenClaw configura `sidepanel.html` para esa pestaña concreta de Chrome; el manifiesto no tiene
una ruta global para el panel lateral. Por tanto, cada pestaña obtiene un documento de panel,
una sesión del Gateway, una suscripción a mensajes y una vinculación tipada con la herramienta del navegador independientes.

El panel no incluye la URL, el título, el DOM ni el texto visible de la página en tu
mensaje. Solo envía el texto que escribes. Las acciones del navegador llevan una vinculación independiente
autenticada por el Gateway que contiene la pestaña de Chrome y el destino CDP, y la
herramienta del navegador rechaza los intentos de reemplazar ese destino o usar acciones para todo
el navegador. Las respuestas permanecen en el panel (`deliver: false`); no heredan una ruta de
Telegram, Discord ni de ningún otro canal.

El copiloto es un dispositivo dedicado vinculado al Gateway con los ámbitos `operator.read` y
`operator.write`. Durante el primer uso, inspecciona y aprueba su solicitud:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

La extensión conserva esa identidad del dispositivo y el token de dispositivo emitido por el Gateway,
limitados al punto de conexión canónico del Gateway que los emitió. Al vincular un Gateway diferente,
se crean una identidad, un token y una custodia de sesión independientes; las credenciales y
las sesiones nunca se reutilizan entre puntos de conexión. La extensión no conserva el
secreto compartido del Gateway. Un panel solo puede suscribirse a las sesiones de su propia pestaña, y
el Gateway filtra esos eventos antes de entregarlos.

Si la conexión con el Gateway se interrumpe durante una ejecución, la extensión mantiene la custodia
persistente del ID de esa ejecución. Al volver a conectarse, cancela la ejecución no resuelta antes de
volver a habilitar cualquier panel y, después, recarga el historial de la transcripción. Este paso de cierre seguro
evita que las acciones del navegador continúen sin ser vistas durante una interrupción de la entrega.

Al cerrar una pestaña, se elimina de inmediato su suscripción activa, se cancela cualquier
ejecución visible y se marca como archivada la sesión de esa pestaña. Si el Gateway está temporalmente
sin conexión, la extensión conserva el archivado pendiente y solo vuelve a intentarlo cuando se
reconecta ese mismo punto de conexión del Gateway; nunca envía una solicitud de archivado a un
Gateway diferente. Después de un fallo del navegador, el siguiente inicio archiva las sesiones
dejadas por la instancia anterior del navegador. Las sesiones archivadas rechazan trabajos nuevos, mientras
sus transcripciones siguen disponibles en el historial de sesiones. Las claves del copiloto del navegador son
sesiones de hilo, por lo que el mantenimiento normal por antigüedad y número de entradas las conserva. El
presupuesto de disco por agente para sesiones sigue siendo aplicable (valor predeterminado: `2gb`) y puede expulsar las
sesiones más antiguas cuando hay presión de espacio; consulta el [mantenimiento de sesiones](/es/reference/session-management-compaction#store-maintenance-and-disk-controls).

Actualmente, el panel lateral requiere un relé de extensión alojado en el Gateway o un
relé directo de un Gateway remoto. Un relé de bucle invertido en un Node del navegador aún no puede
proporcionar la ruta del Node requerida por la vinculación tipada de la pestaña, por lo que el panel rechaza
esa topología en lugar de recurrir al enrutamiento de todo el navegador.

## Enviar una página a OpenClaw

Usa **Send page to OpenClaw** en la ventana emergente de la barra de herramientas para compartir texto legible de la página
con la sesión principal de OpenClaw. Puedes añadir una nota opcional, usar el menú contextual de la
página o de la selección, o pulsar `Alt+Shift+S`. OpenClaw da preferencia a la selección actual
cuando existe, pone el contenido compartido en cola como un evento del sistema y activa la
sesión principal de inmediato.

No es necesario que la pestaña esté en el grupo de pestañas de OpenClaw. Se trata de un contenido compartido
explícito y de un solo uso: no se expone ningún otro elemento de la página ni se concede acceso
continuo. Google Docs se exporta como texto sin formato mediante la sesión iniciada en el navegador,
sin configurar la API de Google. Los hilos de X y Twitter se extraen sin
la interfaz circundante.

El texto de la página se encapsula en el límite de seguridad para contenido externo de OpenClaw. La
nota opcional permanece fuera de ese límite como una instrucción propia. El texto
y las selecciones de la página tienen un límite aproximado de 120,000 caracteres e incluyen un marcador de truncamiento
cuando se acortan.

El uso compartido de páginas funciona cuando el relé de la extensión está alojado en el Gateway, mediante
la vinculación en el mismo host o la vinculación directa con el Gateway `wss://`. Por ahora, los relés alojados
en Nodes devuelven un error claro. Para reasignar el atajo de teclado, abre
`chrome://extensions/shortcuts`.

## Remoto / entre máquinas

Chrome no tiene que ejecutarse en el host del Gateway. Funcionan tres topologías:

- **Mismo host** (Gateway y Chrome en una máquina): realiza la vinculación en esa máquina con
  `openclaw browser extension pair`. El relé solo admite el bucle invertido.
  Si el Gateway local usa TLS, indica explícitamente el nombre de host de su certificado mediante
  `--gateway-url wss://gateway-host.example`; la vinculación nunca lo sustituye por una IP de bucle invertido.
- **Directamente a un Gateway remoto** (Chrome en el portátil, el Gateway en un VPS y
  **nada más en el portátil**): ejecuta en el Gateway
  `openclaw browser extension pair --gateway-url wss://your-gateway.example.com`.
  Se muestra una cadena `wss://…/browser/extension#<secret>`; carga y vincula la
  extensión en el portátil. La extensión se conecta **directamente al Gateway**
  mediante `wss://`: no se requiere instalar OpenClaw, Node ni la CLI, ni abrir un puerto de entrada en el
  portátil. Esta es la opción para el alojamiento administrado.
- **Mediante el host de un Node del navegador** (Chrome en una máquina que ya ejecuta un Node de OpenClaw):
  ejecuta `pair` en el Node y realiza la vinculación localmente; el Gateway canaliza las acciones del navegador
  al Node mediante su enlace de Node autenticado existente.

El secreto de vinculación es específico de cada host (el del Gateway, en el caso directo) y lo valida
la ruta `/browser/extension` del Gateway. Para la conexión directa, sirve el Gateway
mediante TLS (`wss://`) a fin de cifrar el secreto de vinculación y el tráfico CDP.
El secreto permanece en el fragmento de URL de la cadena de vinculación y se presenta durante
el protocolo de enlace WebSocket como una credencial de subprotocolo, por lo que los registros normales de acceso
del proxy no lo reciben en la URL de la solicitud. Asegúrate de que cualquier proxy inverso conserve
el encabezado estándar `Sec-WebSocket-Protocol`.

## Diagnóstico

```bash
openclaw browser status --browser-profile chrome
openclaw browser doctor --browser-profile chrome
```

`doctor` indica que la comprobación del **relé de la extensión de Chrome** falla hasta que la
ventana emergente de la extensión muestra **Connected**.

## Modelo de seguridad

- El relé solo se vincula al bucle invertido; ambos extremos del WebSocket se autentican con el
  token derivado y el origen del extremo de la extensión se comprueba como `chrome-extension://`.
- La vinculación directa con el Gateway no acepta el token del relé en la URL de la solicitud;
  en su lugar, la extensión incluida lo transporta en la lista de subprotocolos WebSocket.
- El agente solo puede ver y controlar las pestañas del **grupo de pestañas de OpenClaw**. Las
  demás pestañas permanecen privadas.
- Las ejecuciones del panel lateral tienen un doble ámbito: la entrega del Gateway usa una lista
  de permitidos por sesión, y las herramientas del navegador aplican la vinculación de la pestaña/destino de Chrome
  transportada fuera del prompt.
- En comparación con el perfil `user` (Chrome MCP), que expone todo el navegador
  con sesión iniciada una vez aprobado el mensaje de depuración remota, la extensión
  limita la superficie compartida a un grupo de pestañas que se puede controlar de un vistazo.

Consulta también: [Navegador](/es/tools/browser) para conocer el modelo completo de perfiles y los
perfiles administrados `openclaw` y `user` de Chrome MCP.
