---
read_when:
    - Emparejamiento o reconexión del nodo de Android
    - Depuración del descubrimiento o la autenticación del Gateway de Android
    - Verificación de la paridad del historial de chat entre clientes
summary: 'aplicación de Android (nodo): guía operativa de conexión + superficie de comandos Conectar/Chat/Voz/Lienzo'
title: Aplicación de Android
x-i18n:
    generated_at: "2026-05-06T09:05:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: cce53df4675e01858ced3d58142512ad096ced0ef50cd617e57b65f9cf911c05
    source_path: platforms/android.md
    workflow: 16
---

<Note>
La aplicación de Android aún no se ha lanzado públicamente. El código fuente está disponible en el [repositorio de OpenClaw](https://github.com/openclaw/openclaw) bajo `apps/android`. Puedes compilarla tú mismo con Java 17 y el SDK de Android (`./gradlew :app:assemblePlayDebug`). Consulta [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) para ver las instrucciones de compilación.
</Note>

## Resumen de soporte

- Rol: aplicación Node complementaria (Android no aloja el Gateway).
- Gateway requerido: sí (ejecútalo en macOS, Linux o Windows mediante WSL2).
- Instalación: [Primeros pasos](/es/start/getting-started) + [Emparejamiento](/es/channels/pairing).
- Gateway: [Runbook](/es/gateway) + [Configuración](/es/gateway/configuration).
  - Protocolos: [Protocolo de Gateway](/es/gateway/protocol) (nodos + plano de control).

## Control del sistema

El control del sistema (launchd/systemd) reside en el host del Gateway. Consulta [Gateway](/es/gateway).

## Runbook de conexión

Aplicación Node de Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se conecta directamente al WebSocket del Gateway y usa emparejamiento de dispositivo (`role: node`).

Para Tailscale o hosts públicos, Android requiere un endpoint seguro:

- Preferido: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- También compatible: cualquier otra URL de Gateway `wss://` con un endpoint TLS real
- `ws://` en texto claro sigue siendo compatible en direcciones LAN privadas / hosts `.local`, además de `localhost`, `127.0.0.1` y el puente del emulador de Android (`10.0.2.2`)

### Requisitos previos

- Puedes ejecutar el Gateway en la máquina "maestra".
- El dispositivo/emulador Android puede alcanzar el WebSocket del gateway:
  - La misma LAN con mDNS/NSD, **o**
  - La misma tailnet de Tailscale usando Wide-Area Bonjour / DNS-SD unicast (ver abajo), **o**
  - Host/puerto de gateway manual (respaldo)
- El emparejamiento móvil por tailnet/público **no** usa endpoints `ws://` de IP tailnet sin procesar. Usa Tailscale Serve u otra URL `wss://` en su lugar.
- Puedes ejecutar la CLI (`openclaw`) en la máquina del gateway (o mediante SSH).

### 1) Iniciar el Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirma que en los registros ves algo como:

- `listening on ws://0.0.0.0:18789`

Para acceso remoto de Android mediante Tailscale, prefiere Serve/Funnel en lugar de un enlace tailnet sin procesar:

```bash
openclaw gateway --tailscale serve
```

Esto le da a Android un endpoint seguro `wss://` / `https://`. Una configuración simple `gateway.bind: "tailnet"` no basta para el emparejamiento remoto inicial de Android, a menos que también termines TLS por separado.

### 2) Verificar el descubrimiento (opcional)

Desde la máquina del gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Más notas de depuración: [Bonjour](/es/gateway/bonjour).

Si también configuraste un dominio de descubrimiento de área amplia, compara con:

```bash
openclaw gateway discover --json
```

Eso muestra `local.` más el dominio de área amplia configurado en una sola pasada y usa el
endpoint de servicio resuelto en lugar de indicios solo de TXT.

#### Descubrimiento por tailnet (Viena ⇄ Londres) mediante DNS-SD unicast

El descubrimiento NSD/mDNS de Android no cruza redes. Si tu Node de Android y el gateway están en redes distintas pero conectados mediante Tailscale, usa Wide-Area Bonjour / DNS-SD unicast en su lugar.

El descubrimiento por sí solo no es suficiente para el emparejamiento Android por tailnet/público. La ruta descubierta aún necesita un endpoint seguro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (ejemplo `openclaw.internal.`) en el host del gateway y publica registros `_openclaw-gw._tcp`.
2. Configura el DNS dividido de Tailscale para que el dominio elegido apunte a ese servidor DNS.

Detalles y ejemplo de configuración de CoreDNS: [Bonjour](/es/gateway/bonjour).

### 3) Conectarse desde Android

En la aplicación de Android:

- La aplicación mantiene activa su conexión con el gateway mediante un **servicio en primer plano** (notificación persistente).
- Abre la pestaña **Conectar**.
- Usa el modo **Código de configuración** o **Manual**.
- Si el descubrimiento está bloqueado, usa host/puerto manual en **Controles avanzados**. Para hosts de LAN privada, `ws://` aún funciona. Para hosts Tailscale/públicos, activa TLS y usa un endpoint `wss://` / Tailscale Serve.

Después del primer emparejamiento correcto, Android se reconecta automáticamente al iniciarse:

- Endpoint manual (si está activado), de lo contrario
- El último gateway descubierto (mejor esfuerzo).

### Beacons de presencia activa

Después de que se conecta la sesión Node autenticada, y cuando la aplicación pasa a segundo plano mientras el
servicio en primer plano sigue conectado, Android llama a `node.event` con
`event: "node.presence.alive"`. El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los
metadatos del nodo/dispositivo emparejado solo después de que se conoce la identidad autenticada del dispositivo Node.

La aplicación cuenta el beacon como registrado correctamente solo cuando la respuesta del gateway incluye
`handled: true`. Los gateways antiguos pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es
compatible, pero no cuenta como una actualización duradera de último visto.

### 4) Aprobar el emparejamiento (CLI)

En la máquina del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalles de emparejamiento: [Emparejamiento](/es/channels/pairing).

Opcional: si el Node de Android siempre se conecta desde una subred estrictamente controlada,
puedes optar por la aprobación automática inicial de Node con CIDR explícitos o IP exactas:

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

Esto está desactivado de forma predeterminada. Se aplica solo al emparejamiento nuevo `role: node` sin
scopes solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, scope, metadatos o
clave pública siguen requiriendo aprobación manual.

### 5) Verificar que el nodo esté conectado

- Mediante el estado de nodos:

  ```bash
  openclaw nodes status
  ```

- Mediante Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + historial

La pestaña Chat de Android admite selección de sesión (predeterminada `main`, además de otras sesiones existentes):

- Historial: `chat.history` (normalizado para visualización; las etiquetas de directiva en línea se
  eliminan del texto visible, las cargas XML de llamadas a herramientas en texto plano (incluidos
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y
  bloques de llamadas a herramientas truncados) y los tokens de control de modelo ASCII/ancho completo filtrados
  se eliminan, las filas puras de asistente con tokens silenciosos como `NO_REPLY` /
  `no_reply` exactos se omiten, y las filas sobredimensionadas pueden reemplazarse por placeholders)
- Enviar: `chat.send`
- Actualizaciones push (mejor esfuerzo): `chat.subscribe` → `event:"chat"`

### 7) Canvas + cámara

#### Host de Canvas del Gateway (recomendado para contenido web)

Si quieres que el Node muestre HTML/CSS/JS real que el agente pueda editar en disco, apunta el Node al host de canvas del Gateway.

<Note>
Los Nodes cargan canvas desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, predeterminado `18789`).
</Note>

1. Crea `~/.openclaw/workspace/canvas/index.html` en el host del gateway.

2. Navega el Node hasta él (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): si ambos dispositivos están en Tailscale, usa un nombre MagicDNS o una IP de tailnet en lugar de `.local`, por ejemplo `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Este servidor inyecta un cliente de recarga en vivo en HTML y recarga cuando cambian los archivos.
El host A2UI reside en `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandos de Canvas (solo en primer plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` o `{"url":"/"}` para volver al scaffold predeterminado). `canvas.snapshot` devuelve `{ format, base64 }` (predeterminado `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` alias heredado)

Comandos de cámara (solo en primer plano; sujetos a permisos):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consulta [Node de cámara](/es/nodes/camera) para ver parámetros y ayudantes de CLI.

### 8) Voz + superficie ampliada de comandos de Android

- Pestaña Voz: Android tiene dos modos explícitos de captura. **Mic** es una sesión manual de la pestaña Voz que envía cada pausa como un turno de chat y se detiene cuando la aplicación sale del primer plano o el usuario abandona la pestaña Voz. **Talk** es el Modo Talk continuo y sigue escuchando hasta que se desactiva o el Node se desconecta.
- El Modo Talk promociona el servicio en primer plano existente de `dataSync` a `dataSync|microphone` antes de que comience la captura, y luego lo degrada cuando el Modo Talk se detiene. Android 14+ requiere la declaración `FOREGROUND_SERVICE_MICROPHONE`, la concesión de runtime `RECORD_AUDIO` y el tipo de servicio de micrófono en runtime.
- Las respuestas habladas usan `talk.speak` mediante el proveedor Talk configurado del gateway. El TTS del sistema local se usa solo cuando `talk.speak` no está disponible.
- La activación por voz permanece desactivada en la UX/runtime de Android.
- Familias adicionales de comandos de Android (la disponibilidad depende del dispositivo + permisos):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (consulta [Reenvío de notificaciones](#notification-forwarding) abajo)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Entrypoints del asistente

Android admite iniciar OpenClaw desde el disparador del asistente del sistema (Google
Assistant). Cuando está configurado, mantener pulsado el botón de inicio o decir "Hey Google, ask
OpenClaw..." abre la aplicación y pasa el prompt al compositor del chat.

Esto usa metadatos de Android **App Actions** declarados en el manifiesto de la aplicación. No
se necesita configuración adicional en el lado del gateway: el intent del asistente se
gestiona íntegramente por la aplicación de Android y se reenvía como un mensaje de chat normal.

<Note>
La disponibilidad de App Actions depende del dispositivo, la versión de Google Play Services
y si el usuario ha configurado OpenClaw como aplicación de asistente predeterminada.
</Note>

## Reenvío de notificaciones

Android puede reenviar notificaciones del dispositivo al gateway como eventos. Varios controles permiten delimitar qué notificaciones se reenvían y cuándo.

| Clave                            | Tipo           | Descripción                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Reenviar solo notificaciones de estos nombres de paquete. Si se establece, todos los demás paquetes se ignoran. |
| `notifications.denyPackages`     | string[]       | Nunca reenviar notificaciones de estos nombres de paquete. Se aplica después de `allowPackages`.  |
| `notifications.quietHours.start` | string (HH:mm) | Inicio de la ventana de horas silenciosas (hora local del dispositivo). Las notificaciones se suprimen durante esta ventana. |
| `notifications.quietHours.end`   | string (HH:mm) | Fin de la ventana de horas silenciosas.                                                          |
| `notifications.rateLimit`        | number         | Máximo de notificaciones reenviadas por paquete por minuto. Las notificaciones excedentes se descartan. |

El selector de notificaciones también usa un comportamiento más seguro para los eventos de notificaciones reenviadas, lo que evita el reenvío accidental de notificaciones sensibles del sistema.

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
El reenvío de notificaciones requiere el permiso de Android Notification Listener. La aplicación lo solicita durante la configuración.
</Note>

## Relacionado

- [Aplicación iOS](/es/platforms/ios)
- [Nodos](/es/nodes)
- [Solución de problemas de Node de Android](/es/nodes/troubleshooting)
