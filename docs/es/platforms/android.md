---
read_when:
    - Emparejar o volver a conectar el nodo Android
    - Depuración del descubrimiento o la autenticación del gateway de Android
    - Verificación de la paridad del historial de chat entre clientes
summary: 'Aplicación de Android (node): manual operativo de conexión + superficie de comandos de Connect/Chat/Voice/Canvas'
title: Aplicación para Android
x-i18n:
    generated_at: "2026-06-27T11:59:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c02d4921c3f3011c09e564d83b773a7c155d17a82a6e70d3fd3e973597142f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
La aplicación oficial de Android está disponible en [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN). Es un Node complementario y requiere un OpenClaw Gateway en ejecución. El código fuente también está disponible en el [repositorio de OpenClaw](https://github.com/openclaw/openclaw) bajo `apps/android`; consulta [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) para ver las instrucciones de compilación.
</Note>

## Resumen de soporte

- Rol: aplicación de Node complementario (Android no aloja el Gateway).
- Gateway requerido: sí (ejecútalo en macOS, Linux o Windows mediante WSL2).
- Instalación: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) para la aplicación, [Primeros pasos](/es/start/getting-started) para el Gateway y luego [Emparejamiento](/es/channels/pairing).
- Gateway: [Manual operativo](/es/gateway) + [Configuración](/es/gateway/configuration).
  - Protocolos: [protocolo de Gateway](/es/gateway/protocol) (Nodes + plano de control).

## Control del sistema

El control del sistema (launchd/systemd) reside en el host del Gateway. Consulta [Gateway](/es/gateway).

## Manual operativo de conexión

Aplicación de Node de Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se conecta directamente al WebSocket del Gateway y usa emparejamiento de dispositivos (`role: node`).

Para Tailscale o hosts públicos, Android requiere un endpoint seguro:

- Preferido: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- También compatible: cualquier otra URL de Gateway `wss://` con un endpoint TLS real
- `ws://` sin cifrar sigue siendo compatible en direcciones LAN privadas / hosts `.local`, además de `localhost`, `127.0.0.1` y el puente del emulador de Android (`10.0.2.2`)

### Requisitos previos

- Puedes ejecutar el Gateway en la máquina "maestra".
- El dispositivo/emulador Android puede alcanzar el WebSocket del Gateway:
  - Misma LAN con mDNS/NSD, **o**
  - Misma tailnet de Tailscale usando Bonjour de área amplia / DNS-SD unicast (consulta abajo), **o**
  - Host/puerto manual del gateway (respaldo)
- El emparejamiento móvil por tailnet/público **no** usa endpoints IP tailnet sin procesar `ws://`. Usa Tailscale Serve u otra URL `wss://` en su lugar.
- Puedes ejecutar la CLI (`openclaw`) en la máquina del gateway (o mediante SSH).

### 1) Inicia el Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirma que en los registros ves algo como:

- `listening on ws://0.0.0.0:18789`

Para el acceso remoto desde Android mediante Tailscale, prefiere Serve/Funnel en lugar de un enlace tailnet sin procesar:

```bash
openclaw gateway --tailscale serve
```

Esto proporciona a Android un endpoint seguro `wss://` / `https://`. Una configuración simple `gateway.bind: "tailnet"` no basta para el primer emparejamiento remoto de Android, a menos que también termines TLS por separado.

### 2) Verifica la detección (opcional)

Desde la máquina del gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Más notas de depuración: [Bonjour](/es/gateway/bonjour).

Si también configuraste un dominio de detección de área amplia, compara con:

```bash
openclaw gateway discover --json
```

Eso muestra `local.` más el dominio de área amplia configurado en una sola pasada y usa el endpoint de servicio resuelto en lugar de pistas solo TXT.

#### Detección en tailnet (Viena ⇄ Londres) mediante DNS-SD unicast

La detección NSD/mDNS de Android no cruza redes. Si tu Node Android y el gateway están en redes distintas pero conectadas mediante Tailscale, usa Bonjour de área amplia / DNS-SD unicast en su lugar.

La detección por sí sola no basta para el emparejamiento de Android por tailnet/público. La ruta detectada aún necesita un endpoint seguro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (ejemplo `openclaw.internal.`) en el host del gateway y publica registros `_openclaw-gw._tcp`.
2. Configura DNS dividido de Tailscale para el dominio elegido apuntando a ese servidor DNS.

Detalles y configuración de ejemplo de CoreDNS: [Bonjour](/es/gateway/bonjour).

### 3) Conéctate desde Android

En la aplicación Android:

- La aplicación mantiene activa su conexión con el gateway mediante un **servicio en primer plano** (notificación persistente).
- Abre la pestaña **Conectar**.
- Usa el modo **Código de configuración** o **Manual**.
- Si la detección está bloqueada, usa host/puerto manual en **Controles avanzados**. Para hosts LAN privados, `ws://` sigue funcionando. Para hosts Tailscale/públicos, activa TLS y usa un endpoint `wss://` / Tailscale Serve.

Tras el primer emparejamiento correcto, Android se reconecta automáticamente al iniciarse:

- Endpoint manual (si está activado), de lo contrario
- El último gateway detectado (mejor esfuerzo).

### Señales de presencia activa

Después de que se conecta la sesión de Node autenticada, y cuando la aplicación pasa a segundo plano mientras el servicio en primer plano sigue conectado, Android llama a `node.event` con `event: "node.presence.alive"`. El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del Node/dispositivo emparejado solo después de conocer la identidad del dispositivo Node autenticado.

La aplicación cuenta la señal como registrada correctamente solo cuando la respuesta del gateway incluye `handled: true`. Los gateways antiguos pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es compatible, pero no cuenta como una actualización duradera de último visto.

### 4) Aprueba el emparejamiento (CLI)

En la máquina del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalles del emparejamiento: [Emparejamiento](/es/channels/pairing).

Opcional: si el Node Android siempre se conecta desde una subred estrictamente controlada, puedes activar la aprobación automática del Node en el primer uso con CIDR explícitos o IP exactas:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Esto está desactivado de forma predeterminada. Se aplica solo al emparejamiento nuevo con `role: node` sin scopes solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, scope, metadatos o clave pública aún requieren aprobación manual.

### 5) Verifica que el Node esté conectado

- Mediante el estado de los Nodes:

  ```bash
  openclaw nodes status
  ```

- Mediante Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + historial

La pestaña Chat de Android admite selección de sesión (predeterminada `main`, además de otras sesiones existentes):

- Historial: `chat.history` (normalizado para visualización; las etiquetas de directivas en línea se eliminan del texto visible, las cargas XML de llamadas a herramientas en texto sin formato (incluidas `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques de llamadas a herramientas truncados) y los tokens de control de modelo ASCII/ancho completo filtrados se eliminan, las filas de asistente compuestas solo por tokens silenciosos, como `NO_REPLY` / `no_reply` exactos, se omiten, y las filas demasiado grandes pueden reemplazarse por marcadores de posición)
- Enviar: `chat.send`
- Actualizaciones push (mejor esfuerzo): `chat.subscribe` → `event:"chat"`

### 7) Canvas + cámara

#### Host de Gateway Canvas (recomendado para contenido web)

Si quieres que el Node muestre HTML/CSS/JS real que el agente pueda editar en disco, apunta el Node al host de canvas del Gateway.

<Note>
Los Nodes cargan canvas desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, predeterminado `18789`).
</Note>

1. Crea `~/.openclaw/workspace/canvas/index.html` en el host del gateway.

2. Navega el Node hasta él (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): si ambos dispositivos están en Tailscale, usa un nombre MagicDNS o una IP tailnet en lugar de `.local`, por ejemplo, `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Este servidor inyecta un cliente de recarga en vivo en HTML y recarga cuando cambian los archivos.
El Gateway también sirve `/__openclaw__/a2ui/`, pero la aplicación Android trata las páginas A2UI remotas como solo renderizado. Los comandos A2UI con capacidad de acción usan la página A2UI incluida y propiedad de la aplicación antes de aplicar mensajes.

Comandos de Canvas (solo en primer plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` o `{"url":"/"}` para volver al andamiaje predeterminado). `canvas.snapshot` devuelve `{ format, base64 }` (predeterminado `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias heredado `canvas.a2ui.pushJSONL`). Estos comandos usan la página A2UI incluida y propiedad de la aplicación para renderizado con capacidad de acción.

Comandos de cámara (solo en primer plano; protegidos por permisos):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consulta [Node de cámara](/es/nodes/camera) para ver parámetros y ayudantes de CLI.

### 8) Voz + superficie ampliada de comandos de Android

- Pestaña Voz: Android tiene dos modos explícitos de captura. **Mic** es una sesión manual de la pestaña Voz que envía cada pausa como un turno de chat y se detiene cuando la aplicación sale del primer plano o el usuario abandona la pestaña Voz. **Talk** es Talk Mode continuo y sigue escuchando hasta que se desactiva o el Node se desconecta.
- Talk Mode promueve el servicio en primer plano existente de `connectedDevice` a `connectedDevice|microphone` antes de iniciar la captura y luego lo degrada cuando Talk Mode se detiene. El servicio de Node declara `FOREGROUND_SERVICE_CONNECTED_DEVICE` con `CHANGE_NETWORK_STATE`; Android 14+ también requiere la declaración `FOREGROUND_SERVICE_MICROPHONE`, el permiso en tiempo de ejecución `RECORD_AUDIO` y el tipo de servicio de micrófono en tiempo de ejecución.
- De forma predeterminada, Android Talk usa reconocimiento de voz nativo, chat de Gateway y `talk.speak` mediante el proveedor Talk configurado del gateway. El TTS local del sistema solo se usa cuando `talk.speak` no está disponible.
- Android Talk usa la retransmisión Gateway en tiempo real solo cuando `talk.realtime.mode` es `realtime` y `talk.realtime.transport` es `gateway-relay`.
- La activación por voz permanece desactivada en la UX/runtime de Android.
- Familias adicionales de comandos de Android (la disponibilidad depende del dispositivo, los permisos y la configuración del usuario):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` solo cuando **Configuración > Capacidades del teléfono > Aplicaciones instaladas** está activado; lista de forma predeterminada las aplicaciones visibles en el lanzador.
  - `notifications.list`, `notifications.actions` (consulta [Reenvío de notificaciones](#notification-forwarding) abajo)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Puntos de entrada del asistente

Android admite iniciar OpenClaw desde el disparador de asistente del sistema (Google Assistant). Cuando está configurado, mantener pulsado el botón de inicio o decir "Hey Google, ask OpenClaw..." abre la aplicación y pasa el prompt al compositor del chat.

Esto usa metadatos de **App Actions** de Android declarados en el manifiesto de la aplicación. No se necesita configuración adicional en el lado del gateway: la intención del asistente la maneja por completo la aplicación Android y se reenvía como un mensaje de chat normal.

<Note>
La disponibilidad de App Actions depende del dispositivo, la versión de Google Play Services y de si el usuario ha configurado OpenClaw como aplicación de asistente predeterminada.
</Note>

## Reenvío de notificaciones

Android puede reenviar notificaciones del dispositivo al gateway como eventos. Varios controles permiten delimitar qué notificaciones se reenvían y cuándo.

| Clave                            | Tipo           | Descripción                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Reenvía solo notificaciones de estos nombres de paquete. Si se establece, todos los demás paquetes se ignoran. |
| `notifications.denyPackages`     | string[]       | Nunca reenvía notificaciones de estos nombres de paquete. Se aplica después de `allowPackages`.   |
| `notifications.quietHours.start` | string (HH:mm) | Inicio de la ventana de horas de silencio (hora local del dispositivo). Las notificaciones se suprimen durante esta ventana. |
| `notifications.quietHours.end`   | string (HH:mm) | Fin de la ventana de horas de silencio.                                                          |
| `notifications.rateLimit`        | number         | Máximo de notificaciones reenviadas por paquete por minuto. Las notificaciones excedentes se descartan. |

El selector de notificaciones también usa un comportamiento más seguro para los eventos de notificación reenviados, lo que evita el reenvío accidental de notificaciones sensibles del sistema.

Configuración de ejemplo:

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
El reenvío de notificaciones requiere el permiso de escucha de notificaciones de Android. La aplicación lo solicita durante la configuración.
</Note>

## Relacionado

- [Aplicación de iOS](/es/platforms/ios)
- [Nodes](/es/nodes)
- [Solución de problemas del Node Android](/es/nodes/troubleshooting)
