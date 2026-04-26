---
read_when:
    - Quieres operar el Gateway desde un navegador
    - Quieres acceso de Tailnet sin túneles SSH
sidebarTitle: Control UI
summary: Interfaz de usuario basada en navegador para el Gateway (chat, nodos, configuración)
title: Control UI
x-i18n:
    generated_at: "2026-04-26T11:40:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: a419e627c2b4e18687e946494d170b005102ba242b5f72c03ba0e55de2b8d4b3
    source_path: web/control-ui.md
    workflow: 15
---

La Control UI es una pequeña aplicación de una sola página **Vite + Lit** servida por el Gateway:

- predeterminado: `http://<host>:18789/`
- prefijo opcional: establece `gateway.controlUi.basePath` (por ejemplo, `/openclaw`)

Habla **directamente con el WebSocket del Gateway** en el mismo puerto.

## Apertura rápida (local)

Si el Gateway se está ejecutando en el mismo equipo, abre:

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (o [http://localhost:18789/](http://localhost:18789/))

Si la página no carga, inicia primero el Gateway: `openclaw gateway`.

La autenticación se proporciona durante el handshake de WebSocket mediante:

- `connect.params.auth.token`
- `connect.params.auth.password`
- encabezados de identidad de Tailscale Serve cuando `gateway.auth.allowTailscale: true`
- encabezados de identidad de proxy de confianza cuando `gateway.auth.mode: "trusted-proxy"`

El panel de configuración del dashboard conserva un token para la sesión actual de la pestaña del navegador y la URL del gateway seleccionada; las contraseñas no se conservan. La incorporación normalmente genera un token de gateway para autenticación con secreto compartido en la primera conexión, pero la autenticación por contraseña también funciona cuando `gateway.auth.mode` es `"password"`.

## Emparejamiento de dispositivos (primera conexión)

Cuando te conectas a la Control UI desde un navegador o dispositivo nuevo, el Gateway normalmente requiere una **aprobación única de emparejamiento**. Esta es una medida de seguridad para evitar accesos no autorizados.

**Lo que verás:** "disconnected (1008): pairing required"

<Steps>
  <Step title="Listar solicitudes pendientes">
    ```bash
    openclaw devices list
    ```
  </Step>
  <Step title="Aprobar por ID de solicitud">
    ```bash
    openclaw devices approve <requestId>
    ```
  </Step>
</Steps>

Si el navegador vuelve a intentar el emparejamiento con detalles de autenticación modificados (rol/permisos/clave pública), la solicitud pendiente anterior se reemplaza y se crea un nuevo `requestId`. Vuelve a ejecutar `openclaw devices list` antes de aprobar.

Si el navegador ya está emparejado y lo cambias de acceso de lectura a acceso de escritura/administración, esto se trata como una ampliación de aprobación, no como una reconexión silenciosa. OpenClaw mantiene activa la aprobación anterior, bloquea la reconexión ampliada y te pide que apruebes explícitamente el nuevo conjunto de permisos.

Una vez aprobado, el dispositivo se recuerda y no requerirá nueva aprobación a menos que lo revoques con `openclaw devices revoke --device <id> --role <role>`. Consulta [CLI de dispositivos](/es/cli/devices) para ver la rotación de tokens y la revocación.

<Note>
- Las conexiones directas del navegador por loopback local (`127.0.0.1` / `localhost`) se aprueban automáticamente.
- Tailscale Serve puede omitir el ciclo de emparejamiento para sesiones de operador de Control UI cuando `gateway.auth.allowTailscale: true`, la identidad de Tailscale se verifica y el navegador presenta su identidad de dispositivo.
- Las vinculaciones directas de Tailnet, las conexiones del navegador por LAN y los perfiles de navegador sin identidad de dispositivo siguen requiriendo aprobación explícita.
- Cada perfil de navegador genera un ID de dispositivo único, por lo que cambiar de navegador o borrar los datos del navegador requerirá volver a emparejar.
</Note>

## Identidad personal (local al navegador)

La Control UI admite una identidad personal por navegador (nombre para mostrar y avatar) adjunta a los mensajes salientes para atribución en sesiones compartidas. Vive en el almacenamiento del navegador, está limitada al perfil actual del navegador y no se sincroniza con otros dispositivos ni se conserva del lado del servidor más allá de los metadatos normales de autoría de transcripción en los mensajes que realmente envías. Borrar los datos del sitio o cambiar de navegador la restablece a vacío.

El mismo patrón local al navegador se aplica a la anulación del avatar del asistente. Los avatares del asistente cargados superponen la identidad resuelta por el gateway solo en el navegador local y nunca hacen round-trip a través de `config.patch`. El campo de configuración compartido `ui.assistant.avatar` sigue estando disponible para clientes no UI que escriban el campo directamente (como gateways con scripts o dashboards personalizados).

## Endpoint de configuración en tiempo de ejecución

La Control UI obtiene su configuración en tiempo de ejecución desde `/__openclaw/control-ui-config.json`. Ese endpoint está protegido por la misma autenticación del gateway que el resto de la superficie HTTP: los navegadores no autenticados no pueden obtenerlo, y una obtención satisfactoria requiere un token/contraseña de gateway ya válido, identidad de Tailscale Serve o una identidad de proxy de confianza.

## Compatibilidad de idioma

La Control UI puede localizarse en la primera carga según la configuración regional de tu navegador. Para cambiarla después, abre **Overview -> Gateway Access -> Language**. El selector de configuración regional está en la tarjeta Gateway Access, no en Appearance.

- Configuraciones regionales compatibles: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`, `th`
- Las traducciones no inglesas se cargan de forma diferida en el navegador.
- La configuración regional seleccionada se guarda en el almacenamiento del navegador y se reutiliza en visitas futuras.
- Las claves de traducción ausentes vuelven al inglés.

## Qué puede hacer (hoy)

<AccordionGroup>
  <Accordion title="Chat y Talk">
    - Chatear con el modelo mediante Gateway WS (`chat.history`, `chat.send`, `chat.abort`, `chat.inject`).
    - Hablar directamente con OpenAI Realtime desde el navegador mediante WebRTC. El Gateway emite un secreto efímero de cliente Realtime con `talk.realtime.session`; el navegador envía audio del micrófono directamente a OpenAI y retransmite las llamadas a herramientas `openclaw_agent_consult` de vuelta mediante `chat.send` para el modelo OpenClaw configurado más grande.
    - Transmitir llamadas a herramientas + tarjetas de salida de herramientas en vivo en Chat (eventos del agente).
  </Accordion>
  <Accordion title="Canales, instancias, sesiones, sueños">
    - Canales: estado de canales integrados más canales de plugins incluidos/externos, inicio de sesión por QR y configuración por canal (`channels.status`, `web.login.*`, `config.patch`).
    - Instancias: lista de presencia + actualización (`system-presence`).
    - Sesiones: lista + anulaciones por sesión de modelo/thinking/fast/verbose/trace/reasoning (`sessions.list`, `sessions.patch`).
    - Sueños: estado de Dreaming, interruptor de activación/desactivación y lector de Dream Diary (`doctor.memory.status`, `doctor.memory.dreamDiary`, `config.patch`).
  </Accordion>
  <Accordion title="Cron, skills, nodos, aprobaciones de exec">
    - Trabajos Cron: listar/agregar/editar/ejecutar/habilitar/deshabilitar + historial de ejecuciones (`cron.*`).
    - Skills: estado, habilitar/deshabilitar, instalar, actualizaciones de clave API (`skills.*`).
    - Nodos: lista + capacidades (`node.list`).
    - Aprobaciones de exec: editar listas de permitidos del gateway o nodo + política ask para `exec host=gateway/node` (`exec.approvals.*`).
  </Accordion>
  <Accordion title="Configuración">
    - Ver/editar `~/.openclaw/openclaw.json` (`config.get`, `config.set`).
    - Aplicar + reiniciar con validación (`config.apply`) y activar la última sesión activa.
    - Las escrituras incluyen una protección de hash base para evitar sobrescribir ediciones concurrentes.
    - Las escrituras (`config.set`/`config.apply`/`config.patch`) realizan previamente la resolución activa de SecretRef para las refs del payload de configuración enviado; las refs activas enviadas que no se puedan resolver se rechazan antes de la escritura.
    - Renderizado de esquema + formulario (`config.schema` / `config.schema.lookup`, incluidos `title` / `description` del campo, sugerencias de UI coincidentes, resúmenes inmediatos de hijos, metadatos de documentación en nodos de objeto/comodín/array/composición anidados, además de esquemas de plugin + canal cuando estén disponibles); el editor Raw JSON solo está disponible cuando la instantánea tiene un round-trip sin procesar seguro.
    - Si una instantánea no puede hacer round-trip del texto sin procesar de forma segura, la Control UI fuerza el modo Form y desactiva el modo Raw para esa instantánea.
    - "Reset to saved" del editor Raw JSON conserva la forma original escrita en bruto (formato, comentarios, diseño de `$include`) en lugar de volver a renderizar una instantánea aplanada, de modo que las ediciones externas sobrevivan a un restablecimiento cuando la instantánea pueda hacer round-trip de forma segura.
    - Los valores de objeto Structured SecretRef se renderizan como solo lectura en las entradas de texto del formulario para evitar una corrupción accidental de objeto a cadena.
  </Accordion>
  <Accordion title="Depuración, registros, actualización">
    - Depuración: instantáneas de estado/salud/modelos + registro de eventos + llamadas RPC manuales (`status`, `health`, `models.list`).
    - Registros: tail en vivo de los registros de archivos del gateway con filtro/exportación (`logs.tail`).
    - Actualización: ejecutar una actualización de paquete/git + reinicio (`update.run`) con informe de reinicio.
  </Accordion>
  <Accordion title="Notas del panel de trabajos Cron">
    - Para trabajos aislados, la entrega usa de forma predeterminada anunciar resumen. Puedes cambiarla a ninguna si quieres ejecuciones solo internas.
    - Los campos de canal/destino aparecen cuando se selecciona anunciar.
    - El modo Webhook usa `delivery.mode = "webhook"` con `delivery.to` establecido en una URL Webhook HTTP(S) válida.
    - Para trabajos de sesión principal, están disponibles los modos de entrega webhook y none.
    - Los controles de edición avanzada incluyen eliminar después de ejecutar, borrar la anulación del agente, opciones exact/stagger de Cron, anulaciones de modelo/thinking del agente y alternadores de entrega de mejor esfuerzo.
    - La validación del formulario es en línea con errores a nivel de campo; los valores no válidos desactivan el botón de guardar hasta corregirlos.
    - Establece `cron.webhookToken` para enviar un token bearer dedicado; si se omite, el webhook se envía sin encabezado de autenticación.
    - Compatibilidad obsoleta: los trabajos heredados almacenados con `notify: true` aún pueden usar `cron.webhook` hasta que se migren.
  </Accordion>
</AccordionGroup>

## Comportamiento del chat

<AccordionGroup>
  <Accordion title="Semántica de envío e historial">
    - `chat.send` es **no bloqueante**: confirma inmediatamente con `{ runId, status: "started" }` y la respuesta se transmite mediante eventos `chat`.
    - Reenviar con la misma `idempotencyKey` devuelve `{ status: "in_flight" }` mientras está en ejecución, y `{ status: "ok" }` después de completarse.
    - Las respuestas `chat.history` están limitadas en tamaño por seguridad de la UI. Cuando las entradas de transcripción son demasiado grandes, Gateway puede truncar campos de texto largos, omitir bloques pesados de metadatos y sustituir mensajes sobredimensionados por un marcador de posición (`[chat.history omitted: message too large]`).
    - Las imágenes del asistente/generadas se conservan como referencias de medios gestionados y se sirven de vuelta mediante URL de medios autenticadas del Gateway, por lo que las recargas no dependen de que las cargas útiles de imagen base64 sin procesar sigan en la respuesta del historial de chat.
    - `chat.history` también elimina etiquetas de directiva en línea visibles solo para visualización del texto visible del asistente (por ejemplo `[[reply_to_*]]` y `[[audio_as_voice]]`), cargas útiles XML de llamadas a herramientas en texto plano (incluidas `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y tokens de control del modelo filtrados en ASCII/ancho completo, y omite entradas del asistente cuyo texto visible completo sea solo el token silencioso exacto `NO_REPLY` / `no_reply`.
    - Durante un envío activo y la actualización final del historial, la vista de chat mantiene visibles los mensajes optimistas locales de usuario/asistente si `chat.history` devuelve brevemente una instantánea más antigua; la transcripción canónica reemplaza esos mensajes locales una vez que el historial del Gateway se pone al día.
    - `chat.inject` agrega una nota del asistente a la transcripción de la sesión y emite un evento `chat` para actualizaciones solo de UI (sin ejecución del agente, sin entrega por canal).
    - Los selectores de modelo y thinking del encabezado del chat actualizan inmediatamente la sesión activa mediante `sessions.patch`; son anulaciones persistentes de la sesión, no opciones de envío de un solo turno.
    - Cuando los informes recientes del Gateway sobre uso de sesión muestran alta presión de contexto, el área del editor de chat muestra un aviso de contexto y, en los niveles recomendados de compactación, un botón de compactar que ejecuta la ruta normal de Compaction de la sesión. Las instantáneas de tokens obsoletas se ocultan hasta que el Gateway vuelva a informar uso reciente.
  </Accordion>
  <Accordion title="Modo Talk (WebRTC en navegador)">
    El modo Talk usa un proveedor de voz en tiempo real registrado que admite sesiones WebRTC en navegador. Configura OpenAI con `talk.provider: "openai"` junto con `talk.providers.openai.apiKey`, o reutiliza la configuración del proveedor en tiempo real de Voice Call. El navegador nunca recibe la clave API estándar de OpenAI; recibe solo el secreto efímero de cliente Realtime. La voz en tiempo real de Google Live es compatible con Voice Call de backend y puentes de Google Meet, pero todavía no con esta ruta WebRTC de navegador. El prompt de sesión Realtime lo ensambla el Gateway; `talk.realtime.session` no acepta anulaciones de instrucciones proporcionadas por el llamador.

    En el editor de Chat, el control Talk es el botón de ondas junto al botón de dictado por micrófono. Cuando Talk se inicia, la fila de estado del editor muestra `Connecting Talk...`, luego `Talk live` mientras el audio está conectado, o `Asking OpenClaw...` mientras una llamada a herramienta en tiempo real consulta el modelo OpenClaw más grande configurado mediante `chat.send`.

  </Accordion>
  <Accordion title="Detener y abortar">
    - Haz clic en **Stop** (llama a `chat.abort`).
    - Mientras una ejecución está activa, los seguimientos normales se ponen en cola. Haz clic en **Steer** en un mensaje en cola para inyectar ese seguimiento en el turno en ejecución.
    - Escribe `/stop` (o frases independientes de cancelación como `stop`, `stop action`, `stop run`, `stop openclaw`, `please stop`) para abortar fuera de banda.
    - `chat.abort` admite `{ sessionKey }` (sin `runId`) para abortar todas las ejecuciones activas de esa sesión.
  </Accordion>
  <Accordion title="Retención parcial al abortar">
    - Cuando se aborta una ejecución, el texto parcial del asistente aún puede mostrarse en la UI.
    - Gateway conserva en el historial de transcripción el texto parcial abortado del asistente cuando existe salida almacenada en búfer.
    - Las entradas conservadas incluyen metadatos de cancelación para que los consumidores de transcripciones puedan distinguir los parciales abortados de la salida completada normal.
  </Accordion>
</AccordionGroup>

## Instalación de PWA y web push

La Control UI incluye un `manifest.webmanifest` y un service worker, por lo que los navegadores modernos pueden instalarla como una PWA independiente. Web Push permite al Gateway reactivar la PWA instalada con notificaciones incluso cuando la pestaña o la ventana del navegador no están abiertas.

| Superficie                                               | Qué hace                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------ |
| `ui/public/manifest.webmanifest`                         | Manifiesto PWA. Los navegadores ofrecen "Install app" una vez que es accesible.   |
| `ui/public/sw.js`                                        | Service worker que gestiona eventos `push` y clics en notificaciones. |
| `push/vapid-keys.json` (bajo el directorio de estado de OpenClaw) | Par de claves VAPID generado automáticamente y usado para firmar payloads de Web Push.       |
| `push/web-push-subscriptions.json`                       | Endpoints de suscripción del navegador conservados.                          |

Anula el par de claves VAPID mediante variables de entorno en el proceso Gateway cuando quieras fijar claves (para despliegues en varios hosts, rotación de secretos o pruebas):

- `OPENCLAW_VAPID_PUBLIC_KEY`
- `OPENCLAW_VAPID_PRIVATE_KEY`
- `OPENCLAW_VAPID_SUBJECT` (predeterminado: `mailto:openclaw@localhost`)

La Control UI usa estos métodos de Gateway limitados por ámbito para registrar y probar suscripciones del navegador:

- `push.web.vapidPublicKey` — obtiene la clave pública VAPID activa.
- `push.web.subscribe` — registra un `endpoint` más `keys.p256dh`/`keys.auth`.
- `push.web.unsubscribe` — elimina un endpoint registrado.
- `push.web.test` — envía una notificación de prueba a la suscripción del llamador.

<Note>
Web Push es independiente de la ruta de relay APNS de iOS (consulta [Configuración](/es/gateway/configuration) para el push respaldado por relay) y del método existente `push.test`, que apuntan al emparejamiento móvil nativo.
</Note>

## Incrustaciones alojadas

Los mensajes del asistente pueden renderizar contenido web alojado en línea con el shortcode `[embed ...]`. La política de sandbox del iframe se controla con `gateway.controlUi.embedSandbox`:

<Tabs>
  <Tab title="strict">
    Desactiva la ejecución de scripts dentro de las incrustaciones alojadas.
  </Tab>
  <Tab title="scripts (default)">
    Permite incrustaciones interactivas manteniendo el aislamiento de origen; este es el valor predeterminado y normalmente es suficiente para juegos/widgets del navegador autocontenidos.
  </Tab>
  <Tab title="trusted">
    Añade `allow-same-origin` además de `allow-scripts` para documentos del mismo sitio que intencionalmente necesitan privilegios más altos.
  </Tab>
</Tabs>

Ejemplo:

```json5
{
  gateway: {
    controlUi: {
      embedSandbox: "scripts",
    },
  },
}
```

<Warning>
Usa `trusted` solo cuando el documento incrustado realmente necesite comportamiento same-origin. Para la mayoría de los juegos generados por agentes y lienzos interactivos, `scripts` es la opción más segura.
</Warning>

Las URL de incrustación externas absolutas `http(s)` siguen bloqueadas de forma predeterminada. Si intencionalmente quieres que `[embed url="https://..."]` cargue páginas de terceros, establece `gateway.controlUi.allowExternalEmbedUrls: true`.

## Acceso de Tailnet (recomendado)

<Tabs>
  <Tab title="Tailscale Serve integrado (preferido)">
    Mantén el Gateway en loopback y deja que Tailscale Serve lo exponga con HTTPS:

    ```bash
    openclaw gateway --tailscale serve
    ```

    Abre:

    - `https://<magicdns>/` (o tu `gateway.controlUi.basePath` configurado)

    De forma predeterminada, las solicitudes de Control UI/WebSocket por Serve pueden autenticarse mediante encabezados de identidad de Tailscale (`tailscale-user-login`) cuando `gateway.auth.allowTailscale` es `true`. OpenClaw verifica la identidad resolviendo la dirección `x-forwarded-for` con `tailscale whois` y comparándola con el encabezado, y solo acepta esto cuando la solicitud llega a loopback con los encabezados `x-forwarded-*` de Tailscale. Para sesiones de operador de Control UI con identidad de dispositivo del navegador, esta ruta Serve verificada también omite el ciclo de emparejamiento del dispositivo; los navegadores sin dispositivo y las conexiones con rol de nodo siguen las comprobaciones normales de dispositivos. Establece `gateway.auth.allowTailscale: false` si quieres exigir credenciales explícitas con secreto compartido incluso para el tráfico de Serve. Luego usa `gateway.auth.mode: "token"` o `"password"`.

    Para esa ruta asíncrona de identidad de Serve, los intentos fallidos de autenticación para la misma IP de cliente y ámbito de autenticación se serializan antes de las escrituras de límite de tasa. Por lo tanto, los reintentos erróneos concurrentes desde el mismo navegador pueden mostrar `retry later` en la segunda solicitud en lugar de dos discrepancias normales compitiendo en paralelo.

    <Warning>
    La autenticación Serve sin token asume que el host del gateway es de confianza. Si puede ejecutarse código local no confiable en ese host, exige autenticación con token/contraseña.
    </Warning>

  </Tab>
  <Tab title="Vincular a Tailnet + token">
    ```bash
    openclaw gateway --bind tailnet --token "$(openssl rand -hex 32)"
    ```

    Luego abre:

    - `http://<tailscale-ip>:18789/` (o tu `gateway.controlUi.basePath` configurado)

    Pega el secreto compartido correspondiente en la configuración de la UI (enviado como `connect.params.auth.token` o `connect.params.auth.password`).

  </Tab>
</Tabs>

## HTTP inseguro

Si abres el dashboard mediante HTTP simple (`http://<lan-ip>` o `http://<tailscale-ip>`), el navegador se ejecuta en un **contexto no seguro** y bloquea WebCrypto. De forma predeterminada, OpenClaw **bloquea** las conexiones de Control UI sin identidad de dispositivo.

Excepciones documentadas:

- compatibilidad de HTTP inseguro solo para localhost con `gateway.controlUi.allowInsecureAuth=true`
- autenticación exitosa de operador de Control UI mediante `gateway.auth.mode: "trusted-proxy"`
- opción de emergencia `gateway.controlUi.dangerouslyDisableDeviceAuth=true`

**Corrección recomendada:** usa HTTPS (Tailscale Serve) o abre la UI localmente:

- `https://<magicdns>/` (Serve)
- `http://127.0.0.1:18789/` (en el host del gateway)

<AccordionGroup>
  <Accordion title="Comportamiento del interruptor de autenticación insegura">
    ```json5
    {
      gateway: {
        controlUi: { allowInsecureAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    `allowInsecureAuth` es solo un interruptor local de compatibilidad:

    - Permite que las sesiones de Control UI en localhost continúen sin identidad de dispositivo en contextos HTTP no seguros.
    - No omite las comprobaciones de emparejamiento.
    - No relaja los requisitos remotos (no localhost) de identidad de dispositivo.

  </Accordion>
  <Accordion title="Solo para emergencias">
    ```json5
    {
      gateway: {
        controlUi: { dangerouslyDisableDeviceAuth: true },
        bind: "tailnet",
        auth: { mode: "token", token: "replace-me" },
      },
    }
    ```

    <Warning>
    `dangerouslyDisableDeviceAuth` desactiva las comprobaciones de identidad de dispositivo de Control UI y supone una degradación grave de seguridad. Reviértelo rápidamente después de su uso de emergencia.
    </Warning>

  </Accordion>
  <Accordion title="Nota sobre proxy de confianza">
    - Una autenticación correcta de proxy de confianza puede admitir sesiones de Control UI de **operador** sin identidad de dispositivo.
    - Esto **no** se extiende a las sesiones de Control UI con rol de nodo.
    - Los proxies inversos loopback en el mismo host siguen sin satisfacer la autenticación de proxy de confianza; consulta [Autenticación de proxy de confianza](/es/gateway/trusted-proxy-auth).
  </Accordion>
</AccordionGroup>

Consulta [Tailscale](/es/gateway/tailscale) para la guía de configuración de HTTPS.

## Content Security Policy

La Control UI incluye una política `img-src` estricta: solo se permiten recursos **del mismo origen**, URL `data:` y URL `blob:` generadas localmente. Las URL de imágenes remotas `http(s)` y relativas al protocolo son rechazadas por el navegador y no generan solicitudes de red.

Qué significa esto en la práctica:

- Los avatares e imágenes servidos bajo rutas relativas (por ejemplo `/avatars/<id>`) siguen renderizándose, incluidas las rutas de avatar autenticadas que la UI obtiene y convierte en URL `blob:` locales.
- Las URL `data:image/...` en línea siguen renderizándose (útil para payloads en el propio protocolo).
- Las URL `blob:` locales creadas por la Control UI siguen renderizándose.
- Las URL remotas de avatar emitidas por metadatos del canal se eliminan en los helpers de avatar de la Control UI y se sustituyen por el logotipo/insignia integrados, para que un canal comprometido o malicioso no pueda forzar solicitudes remotas arbitrarias de imágenes desde el navegador de un operador.

No necesitas cambiar nada para obtener este comportamiento: siempre está activado y no es configurable.

## Autenticación de rutas de avatar

Cuando la autenticación del gateway está configurada, el endpoint de avatar de la Control UI requiere el mismo token del gateway que el resto de la API:

- `GET /avatar/<agentId>` devuelve la imagen del avatar solo a llamadores autenticados. `GET /avatar/<agentId>?meta=1` devuelve los metadatos del avatar bajo la misma regla.
- Las solicitudes no autenticadas a cualquiera de las dos rutas se rechazan (en consonancia con la ruta hermana assistant-media). Esto evita que la ruta de avatar filtre la identidad del agente en hosts que por lo demás están protegidos.
- La propia Control UI reenvía el token del gateway como encabezado bearer al obtener avatares y usa URL blob autenticadas para que la imagen siga mostrándose en los dashboards.

Si desactivas la autenticación del gateway (no recomendado en hosts compartidos), la ruta de avatar también pasa a ser no autenticada, en línea con el resto del gateway.

## Compilación de la UI

El Gateway sirve archivos estáticos desde `dist/control-ui`. Compílalos con:

```bash
pnpm ui:build
```

Base absoluta opcional (cuando quieras URL de recursos fijas):

```bash
OPENCLAW_CONTROL_UI_BASE_PATH=/openclaw/ pnpm ui:build
```

Para desarrollo local (servidor de desarrollo separado):

```bash
pnpm ui:dev
```

Luego apunta la UI a la URL WS de tu Gateway (por ejemplo `ws://127.0.0.1:18789`).

## Depuración/pruebas: servidor de desarrollo + Gateway remoto

La Control UI son archivos estáticos; el destino WebSocket es configurable y puede ser distinto del origen HTTP. Esto es útil cuando quieres el servidor de desarrollo de Vite localmente, pero el Gateway se ejecuta en otro lugar.

<Steps>
  <Step title="Iniciar el servidor de desarrollo de la UI">
    ```bash
    pnpm ui:dev
    ```
  </Step>
  <Step title="Abrir con gatewayUrl">
    ```text
    http://localhost:5173/?gatewayUrl=ws://<gateway-host>:18789
    ```

    Autenticación opcional de una sola vez (si es necesaria):

    ```text
    http://localhost:5173/?gatewayUrl=wss://<gateway-host>:18789#token=<gateway-token>
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notas">
    - `gatewayUrl` se guarda en `localStorage` después de la carga y se elimina de la URL.
    - `token` debe pasarse mediante el fragmento de la URL (`#token=...`) siempre que sea posible. Los fragmentos no se envían al servidor, lo que evita filtraciones en registros de solicitudes y en Referer. Los parámetros heredados `?token=` en la query siguen importándose una vez por compatibilidad, pero solo como mecanismo alternativo, y se eliminan inmediatamente después del arranque.
    - `password` se mantiene solo en memoria.
    - Cuando `gatewayUrl` está configurado, la UI no recurre a credenciales de configuración ni del entorno. Proporciona `token` (o `password`) explícitamente. La ausencia de credenciales explícitas es un error.
    - Usa `wss://` cuando el Gateway esté detrás de TLS (Tailscale Serve, proxy HTTPS, etc.).
    - `gatewayUrl` solo se acepta en una ventana de nivel superior (no incrustada) para evitar clickjacking.
    - Los despliegues de Control UI fuera de loopback deben establecer `gateway.controlUi.allowedOrigins` explícitamente (orígenes completos). Esto incluye configuraciones remotas de desarrollo.
    - El arranque del Gateway puede sembrar orígenes locales como `http://localhost:<port>` y `http://127.0.0.1:<port>` a partir del bind y puerto efectivos en tiempo de ejecución, pero los orígenes remotos del navegador siguen necesitando entradas explícitas.
    - No uses `gateway.controlUi.allowedOrigins: ["*"]` excepto para pruebas locales estrictamente controladas. Significa permitir cualquier origen de navegador, no “coincidir con cualquier host que esté usando”.
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita el modo alternativo de origen mediante encabezado Host, pero es un modo de seguridad peligroso.
  </Accordion>
</AccordionGroup>

Ejemplo:

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:5173"],
    },
  },
}
```

Detalles de configuración de acceso remoto: [Acceso remoto](/es/gateway/remote).

## Relacionado

- [Dashboard](/es/web/dashboard) — panel del gateway
- [Comprobaciones de estado](/es/gateway/health) — supervisión del estado del gateway
- [TUI](/es/web/tui) — interfaz de usuario de terminal
- [WebChat](/es/web/webchat) — interfaz de chat basada en navegador
