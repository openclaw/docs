---
read_when:
    - Emparejar o reconectar el Node de Android
    - Depuración del descubrimiento o la autenticación del Gateway de Android
    - Verificar la paridad del historial de chat entre clientes
summary: 'Aplicación de Android (nodo): guía operativa de conexión + superficie de comandos Conectar/Chat/Voz/Lienzo'
title: Aplicación Android
x-i18n:
    generated_at: "2026-04-30T05:50:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae8bec406a006165f124f305e00c848f5527d43dba3cbcd07bd0d7e6f0dcc247
    source_path: platforms/android.md
    workflow: 16
---

<Note>
La aplicación de Android aún no se ha publicado públicamente. El código fuente está disponible en el [repositorio de OpenClaw](https://github.com/openclaw/openclaw) en `apps/android`. Puedes compilarla tú mismo con Java 17 y el SDK de Android (`./gradlew :app:assemblePlayDebug`). Consulta [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) para ver las instrucciones de compilación.
</Note>

## Instantánea de soporte

- Rol: aplicación Node complementaria (Android no aloja el Gateway).
- Gateway requerido: sí (ejecútalo en macOS, Linux o Windows mediante WSL2).
- Instalación: [Primeros pasos](/es/start/getting-started) + [Emparejamiento](/es/channels/pairing).
- Gateway: [Guía operativa](/es/gateway) + [Configuración](/es/gateway/configuration).
  - Protocolos: [Protocolo de Gateway](/es/gateway/protocol) (nodos + plano de control).

## Control del sistema

El control del sistema (launchd/systemd) reside en el host del Gateway. Consulta [Gateway](/es/gateway).

## Guía operativa de conexión

Aplicación Node de Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se conecta directamente al WebSocket del Gateway y usa emparejamiento de dispositivos (`role: node`).

Para Tailscale o hosts públicos, Android requiere un endpoint seguro:

- Preferido: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- También compatible: cualquier otra URL de Gateway `wss://` con un endpoint TLS real
- Cleartext `ws://` sigue siendo compatible en direcciones LAN privadas / hosts `.local`, además de `localhost`, `127.0.0.1` y el puente del emulador de Android (`10.0.2.2`)

### Requisitos previos

- Puedes ejecutar el Gateway en la máquina “maestra”.
- El dispositivo/emulador Android puede alcanzar el WebSocket del gateway:
  - Misma LAN con mDNS/NSD, **o**
  - Misma tailnet de Tailscale usando Bonjour de área amplia / DNS-SD unicast (consulta más abajo), **o**
  - Host/puerto de gateway manual (alternativa)
- El emparejamiento móvil por tailnet/público **no** usa endpoints de IP tailnet sin procesar `ws://`. Usa Tailscale Serve u otra URL `wss://` en su lugar.
- Puedes ejecutar la CLI (`openclaw`) en la máquina del gateway (o mediante SSH).

### 1) Iniciar el Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirma en los registros que ves algo como:

- `listening on ws://0.0.0.0:18789`

Para acceso remoto de Android mediante Tailscale, prefiere Serve/Funnel en lugar de enlazar una tailnet sin procesar:

```bash
openclaw gateway --tailscale serve
```

Esto proporciona a Android un endpoint seguro `wss://` / `https://`. Una configuración simple `gateway.bind: "tailnet"` no es suficiente para el primer emparejamiento remoto de Android, a menos que también termines TLS por separado.

### 2) Verificar el descubrimiento (opcional)

Desde la máquina del gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Más notas de depuración: [Bonjour](/es/gateway/bonjour).

Si también configuraste un dominio de descubrimiento de área amplia, compáralo con:

```bash
openclaw gateway discover --json
```

Eso muestra `local.` más el dominio de área amplia configurado en una sola pasada y usa el endpoint
de servicio resuelto en lugar de pistas solo TXT.

#### Descubrimiento por tailnet (Viena ⇄ Londres) mediante DNS-SD unicast

El descubrimiento NSD/mDNS de Android no cruza redes. Si tu Node de Android y el gateway están en redes diferentes pero conectados mediante Tailscale, usa Bonjour de área amplia / DNS-SD unicast en su lugar.

El descubrimiento por sí solo no es suficiente para el emparejamiento de Android por tailnet/público. La ruta descubierta aún necesita un endpoint seguro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (ejemplo `openclaw.internal.`) en el host del gateway y publica registros `_openclaw-gw._tcp`.
2. Configura el DNS dividido de Tailscale para el dominio elegido apuntando a ese servidor DNS.

Detalles y configuración de ejemplo de CoreDNS: [Bonjour](/es/gateway/bonjour).

### 3) Conectar desde Android

En la aplicación de Android:

- La aplicación mantiene activa su conexión con el gateway mediante un **servicio en primer plano** (notificación persistente).
- Abre la pestaña **Conectar**.
- Usa el modo **Código de configuración** o **Manual**.
- Si el descubrimiento está bloqueado, usa host/puerto manual en **Controles avanzados**. Para hosts de LAN privada, `ws://` sigue funcionando. Para hosts de Tailscale/públicos, activa TLS y usa un endpoint `wss://` / Tailscale Serve.

Después del primer emparejamiento correcto, Android se reconecta automáticamente al iniciarse:

- Endpoint manual (si está habilitado), de lo contrario
- El último gateway descubierto (mejor esfuerzo).

### Beacons de presencia activa

Después de que se conecte la sesión Node autenticada, y cuando la aplicación pase a segundo plano mientras el
servicio en primer plano siga conectado, Android llama a `node.event` con
`event: "node.presence.alive"`. El gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los
metadatos del nodo/dispositivo emparejado solo después de que se conozca la identidad autenticada del dispositivo Node.

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
puedes habilitar la aprobación automática inicial de Node con CIDR explícitos o IP exactas:

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

Esto está deshabilitado de forma predeterminada. Se aplica solo al emparejamiento nuevo `role: node` sin
ámbitos solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, ámbito, metadatos o
clave pública sigue requiriendo aprobación manual.

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

La pestaña Chat de Android admite selección de sesión (valor predeterminado `main`, además de otras sesiones existentes):

- Historial: `chat.history` (normalizado para visualización; las etiquetas de directivas en línea se
  eliminan del texto visible, las cargas XML de llamadas a herramientas en texto sin formato (incluidas
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y
  bloques truncados de llamadas a herramientas) y los tokens filtrados de control de modelo ASCII/de ancho completo
  se eliminan, las filas puras de asistente con tokens silenciosos como exactamente `NO_REPLY` /
  `no_reply` se omiten, y las filas demasiado grandes pueden reemplazarse por marcadores de posición)
- Enviar: `chat.send`
- Actualizaciones push (mejor esfuerzo): `chat.subscribe` → `event:"chat"`

### 7) Canvas + cámara

#### Host Canvas de Gateway (recomendado para contenido web)

Si quieres que el Node muestre HTML/CSS/JS real que el agente pueda editar en disco, apunta el Node al host Canvas de Gateway.

<Note>
Los nodos cargan Canvas desde el servidor HTTP del Gateway (el mismo puerto que `gateway.port`, valor predeterminado `18789`).
</Note>

1. Crea `~/.openclaw/workspace/canvas/index.html` en el host del gateway.

2. Navega el Node hacia él (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): si ambos dispositivos están en Tailscale, usa un nombre MagicDNS o una IP tailnet en lugar de `.local`, por ejemplo `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Este servidor inyecta un cliente de recarga en vivo en HTML y recarga cuando cambian los archivos.
El host A2UI reside en `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandos de Canvas (solo en primer plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` o `{"url":"/"}` para volver al andamiaje predeterminado). `canvas.snapshot` devuelve `{ format, base64 }` (valor predeterminado `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` alias heredado)

Comandos de cámara (solo en primer plano; controlados por permisos):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consulta [Node de cámara](/es/nodes/camera) para ver parámetros y asistentes de CLI.

### 8) Voz + superficie ampliada de comandos de Android

- Pestaña Voz: Android tiene dos modos explícitos de captura. **Mic** es una sesión manual de la pestaña Voz que envía cada pausa como un turno de chat y se detiene cuando la aplicación sale del primer plano o el usuario sale de la pestaña Voz. **Talk** es el Modo Talk continuo y sigue escuchando hasta que se desactiva o el Node se desconecta.
- El Modo Talk promueve el servicio en primer plano existente de `dataSync` a `dataSync|microphone` antes de que comience la captura, y luego lo degrada cuando el Modo Talk se detiene. Android 14+ requiere la declaración `FOREGROUND_SERVICE_MICROPHONE`, el permiso de ejecución `RECORD_AUDIO` y el tipo de servicio de micrófono en tiempo de ejecución.
- Las respuestas habladas usan `talk.speak` mediante el proveedor Talk configurado del gateway. El TTS del sistema local se usa solo cuando `talk.speak` no está disponible.
- La activación por voz permanece deshabilitada en la UX/runtime de Android.
- Familias adicionales de comandos de Android (la disponibilidad depende del dispositivo y los permisos):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (consulta [Reenvío de notificaciones](#notification-forwarding) más abajo)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Puntos de entrada del asistente

Android permite iniciar OpenClaw desde el disparador del asistente del sistema (Google
Assistant). Cuando está configurado, mantener pulsado el botón de inicio o decir "Hey Google, ask
OpenClaw..." abre la aplicación y entrega el prompt al compositor del chat.

Esto usa metadatos de **App Actions** de Android declarados en el manifiesto de la aplicación. No se
necesita configuración adicional en el lado del gateway: el intent del asistente se
gestiona por completo en la aplicación de Android y se reenvía como un mensaje de chat normal.

<Note>
La disponibilidad de App Actions depende del dispositivo, de la versión de Google Play Services
y de si el usuario ha establecido OpenClaw como aplicación de asistente predeterminada.
</Note>

## Reenvío de notificaciones

Android puede reenviar notificaciones del dispositivo al gateway como eventos. Varios controles te permiten delimitar qué notificaciones se reenvían y cuándo.

| Clave                            | Tipo           | Descripción                                                                                          |
| -------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Reenviar solo notificaciones de estos nombres de paquete. Si se define, se ignoran todos los demás paquetes. |
| `notifications.denyPackages`     | string[]       | Nunca reenviar notificaciones de estos nombres de paquete. Se aplica después de `allowPackages`.       |
| `notifications.quietHours.start` | string (HH:mm) | Inicio de la ventana de horas silenciosas (hora local del dispositivo). Las notificaciones se suprimen durante esta ventana. |
| `notifications.quietHours.end`   | string (HH:mm) | Fin de la ventana de horas silenciosas.                                                               |
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
El reenvío de notificaciones requiere el permiso de escucha de notificaciones de Android. La aplicación lo solicita durante la configuración.
</Note>

## Relacionado

- [Aplicación iOS](/es/platforms/ios)
- [Nodos](/es/nodes)
- [Solución de problemas de Node de Android](/es/nodes/troubleshooting)
