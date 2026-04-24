---
read_when:
    - Emparejar o volver a conectar el Node de Android
    - Depurar el descubrimiento o la autenticación del gateway en Android
    - Verificar la paridad del historial de chat entre clientes
summary: 'App de Android (Node): runbook de conexión + superficie de comandos de Connect/Chat/Voice/Canvas'
title: app de Android
x-i18n:
    generated_at: "2026-04-24T05:37:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 31b538a5bf45e78fde34e77a31384295b3e96f2fff6b3adfe37e5c569d858472
    source_path: platforms/android.md
    workflow: 15
---

> **Nota:** La app de Android aún no se ha publicado públicamente. El código fuente está disponible en el [repositorio de OpenClaw](https://github.com/openclaw/openclaw) en `apps/android`. Puedes compilarla tú mismo con Java 17 y el Android SDK (`./gradlew :app:assemblePlayDebug`). Consulta [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) para ver las instrucciones de compilación.

## Resumen de compatibilidad

- Rol: app complementaria de Node (Android no aloja el Gateway).
- Gateway requerido: sí (ejecútalo en macOS, Linux o Windows mediante WSL2).
- Instalación: [Getting Started](/es/start/getting-started) + [Pairing](/es/channels/pairing).
- Gateway: [Runbook](/es/gateway) + [Configuration](/es/gateway/configuration).
  - Protocolos: [Gateway protocol](/es/gateway/protocol) (Nodes + plano de control).

## Control del sistema

El control del sistema (launchd/systemd) vive en el host del Gateway. Consulta [Gateway](/es/gateway).

## Runbook de conexión

App de Android Node ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se conecta directamente al Gateway WebSocket y usa emparejamiento de dispositivos (`role: node`).

Para Tailscale o hosts públicos, Android requiere un endpoint seguro:

- Preferido: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- También compatible: cualquier otra URL de Gateway `wss://` con un endpoint TLS real
- `ws://` en texto plano sigue siendo compatible en direcciones privadas de LAN / hosts `.local`, además de `localhost`, `127.0.0.1` y el puente del emulador de Android (`10.0.2.2`)

### Requisitos previos

- Puedes ejecutar el Gateway en la máquina “maestra”.
- El dispositivo/emulador Android puede alcanzar el Gateway WebSocket:
  - Misma LAN con mDNS/NSD, **o**
  - Misma tailnet de Tailscale usando Wide-Area Bonjour / unicast DNS-SD (consulta abajo), **o**
  - Host/puerto manual del gateway (alternativa)
- El emparejamiento móvil por tailnet/público **no** usa endpoints `ws://` con IP tailnet sin procesar. Usa Tailscale Serve u otra URL `wss://` en su lugar.
- Puedes ejecutar la CLI (`openclaw`) en la máquina del gateway (o mediante SSH).

### 1) Iniciar el Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirma en los registros que ves algo como:

- `listening on ws://0.0.0.0:18789`

Para acceso remoto desde Android mediante Tailscale, prefiere Serve/Funnel en lugar de un bind tailnet sin procesar:

```bash
openclaw gateway --tailscale serve
```

Esto da a Android un endpoint seguro `wss://` / `https://`. Una configuración simple `gateway.bind: "tailnet"` no basta para el primer emparejamiento remoto de Android a menos que también termines TLS por separado.

### 2) Verificar descubrimiento (opcional)

Desde la máquina del gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Más notas de depuración: [Bonjour](/es/gateway/bonjour).

Si también configuraste un dominio de descubrimiento de área amplia, compáralo con:

```bash
openclaw gateway discover --json
```

Esto muestra `local.` más el dominio de área amplia configurado en una sola pasada y usa el endpoint del servicio resuelto en lugar de sugerencias solo TXT.

#### Descubrimiento por tailnet (Viena ⇄ Londres) mediante unicast DNS-SD

El descubrimiento NSD/mDNS de Android no cruza redes. Si tu Node de Android y el gateway están en redes distintas pero conectados mediante Tailscale, usa Wide-Area Bonjour / unicast DNS-SD en su lugar.

El descubrimiento por sí solo no basta para el emparejamiento de Android por tailnet/público. La ruta descubierta sigue necesitando un endpoint seguro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (ejemplo `openclaw.internal.`) en el host del gateway y publica registros `_openclaw-gw._tcp`.
2. Configura DNS dividido de Tailscale para tu dominio elegido apuntando a ese servidor DNS.

Detalles y ejemplo de configuración de CoreDNS: [Bonjour](/es/gateway/bonjour).

### 3) Conectarse desde Android

En la app de Android:

- La app mantiene viva su conexión al gateway mediante un **servicio en primer plano** (notificación persistente).
- Abre la pestaña **Connect**.
- Usa el modo **Setup Code** o **Manual**.
- Si el descubrimiento está bloqueado, usa host/puerto manual en **Advanced controls**. Para hosts de LAN privada, `ws://` sigue funcionando. Para hosts Tailscale/públicos, activa TLS y usa un endpoint `wss://` / Tailscale Serve.

Después del primer emparejamiento correcto, Android se vuelve a conectar automáticamente al iniciarse:

- Endpoint manual (si está habilitado), en caso contrario
- El último gateway descubierto (según mejor esfuerzo).

### 4) Aprobar el emparejamiento (CLI)

En la máquina del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalles de emparejamiento: [Pairing](/es/channels/pairing).

### 5) Verificar que el Node está conectado

- Mediante el estado de Nodes:

  ```bash
  openclaw nodes status
  ```

- Mediante el Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + historial

La pestaña Chat de Android admite selección de sesión (predeterminada `main`, además de otras sesiones existentes):

- Historial: `chat.history` (normalizado para visualización; las etiquetas inline de directivas se eliminan del texto visible, las cargas útiles XML de llamadas de herramientas en texto plano (incluidos
  `<tool_call>...</tool_call>`, `<function_call>...</function_call>`,
  `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>`, y
  bloques truncados de llamadas de herramientas) y los tokens de control del modelo filtrados en ASCII/ancho completo
  se eliminan, las filas puras del asistente con token silencioso como exactos `NO_REPLY` /
  `no_reply` se omiten, y las filas sobredimensionadas pueden reemplazarse con marcadores)
- Enviar: `chat.send`
- Actualizaciones push (según mejor esfuerzo): `chat.subscribe` → `event:"chat"`

### 7) Canvas + cámara

#### Host Canvas del Gateway (recomendado para contenido web)

Si quieres que el Node muestre HTML/CSS/JS real que el agente pueda editar en disco, apunta el Node al host Canvas del Gateway.

Nota: los Nodes cargan Canvas desde el servidor HTTP del Gateway (mismo puerto que `gateway.port`, predeterminado `18789`).

1. Crea `~/.openclaw/workspace/canvas/index.html` en el host del gateway.

2. Navega el Node hacia él (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): si ambos dispositivos están en Tailscale, usa un nombre MagicDNS o una IP tailnet en lugar de `.local`, por ejemplo `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Este servidor inyecta un cliente de recarga en vivo en el HTML y recarga al cambiar archivos.
El host A2UI vive en `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandos Canvas (solo en primer plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` o `{"url":"/"}` para volver al scaffold predeterminado). `canvas.snapshot` devuelve `{ format, base64 }` (predeterminado `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias heredado `canvas.a2ui.pushJSONL`)

Comandos de cámara (solo en primer plano; restringidos por permisos):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consulta [Camera node](/es/nodes/camera) para ver parámetros y ayudas de CLI.

### 8) Voice + superficie ampliada de comandos de Android

- Voice: Android usa un único flujo de micrófono encendido/apagado en la pestaña Voice con captura de transcripción y reproducción `talk.speak`. El TTS local del sistema solo se usa cuando `talk.speak` no está disponible. Voice se detiene cuando la app sale del primer plano.
- Los toggles de activación por voz/modo talk están actualmente eliminados de la UX/tiempo de ejecución de Android.
- Familias adicionales de comandos de Android (la disponibilidad depende del dispositivo + permisos):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (consulta [Reenvío de notificaciones](#notification-forwarding) abajo)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Puntos de entrada del asistente

Android admite iniciar OpenClaw desde el disparador del asistente del sistema (Google
Assistant). Cuando está configurado, mantener pulsado el botón de inicio o decir "Hey Google, ask
OpenClaw..." abre la app y entrega el prompt al compositor del chat.

Esto usa metadatos de **App Actions** de Android declarados en el manifiesto de la app. No
se necesita configuración adicional en el gateway: la intención del asistente la maneja totalmente la app de Android y la reenvía como un mensaje normal de chat.

<Note>
La disponibilidad de App Actions depende del dispositivo, de la versión de Google Play Services
y de si el usuario ha configurado OpenClaw como app de asistente predeterminada.
</Note>

## Reenvío de notificaciones

Android puede reenviar notificaciones del dispositivo al gateway como eventos. Varios controles te permiten limitar qué notificaciones se reenvían y cuándo.

| Clave                            | Tipo           | Descripción                                                                                      |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| `notifications.allowPackages`    | string[]       | Solo reenvía notificaciones de estos nombres de paquete. Si se establece, todos los demás paquetes se ignoran. |
| `notifications.denyPackages`     | string[]       | Nunca reenvía notificaciones de estos nombres de paquete. Se aplica después de `allowPackages`. |
| `notifications.quietHours.start` | string (HH:mm) | Inicio de la ventana de horas de silencio (hora local del dispositivo). Las notificaciones se suprimen durante esta ventana. |
| `notifications.quietHours.end`   | string (HH:mm) | Fin de la ventana de horas de silencio.                                                          |
| `notifications.rateLimit`        | number         | Máximo de notificaciones reenviadas por paquete por minuto. Las notificaciones en exceso se descartan. |

El selector de notificaciones también usa un comportamiento más seguro para eventos de notificación reenviados, evitando el reenvío accidental de notificaciones sensibles del sistema.

Ejemplo de configuración:

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
El reenvío de notificaciones requiere el permiso Android Notification Listener. La app lo solicita durante la configuración.
</Note>

## Relacionado

- [app de iOS](/es/platforms/ios)
- [Nodes](/es/nodes)
- [Solución de problemas de Node de Android](/es/nodes/troubleshooting)
