---
read_when:
    - Emparejar o volver a conectar el Node Android
    - Depuración de la detección o autenticación del gateway de Android
    - Verificar la paridad del historial de chat entre clientes
summary: 'Aplicación Android (Node): manual de conexión + superficie de comandos de Connect/Chat/Voice/Canvas'
title: Aplicación Android
x-i18n:
    generated_at: "2026-04-26T11:33:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a47c07e3301ad7b98f4827c9c34c42b7ba2f92c55aabd7b49606ab688191b66
    source_path: platforms/android.md
    workflow: 15
---

> **Nota:** La aplicación Android todavía no se ha publicado públicamente. El código fuente está disponible en el [repositorio de OpenClaw](https://github.com/openclaw/openclaw) bajo `apps/android`. Puedes compilarla tú mismo con Java 17 y el SDK de Android (`./gradlew :app:assemblePlayDebug`). Consulta [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md) para ver las instrucciones de compilación.

## Resumen de compatibilidad

- Función: aplicación Node complementaria (Android no aloja el Gateway).
- Gateway requerido: sí (ejecútalo en macOS, Linux o Windows mediante WSL2).
- Instalación: [Getting Started](/es/start/getting-started) + [Pairing](/es/channels/pairing).
- Gateway: [Runbook](/es/gateway) + [Configuration](/es/gateway/configuration).
  - Protocolos: [Gateway protocol](/es/gateway/protocol) (Nodes + plano de control).

## Control del sistema

El control del sistema (launchd/systemd) vive en el host del Gateway. Consulta [Gateway](/es/gateway).

## Manual de conexión

Aplicación Node Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se conecta directamente al WebSocket del Gateway y usa emparejamiento de dispositivos (`role: node`).

Para hosts Tailscale o públicos, Android requiere un endpoint seguro:

- Preferido: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- También compatible: cualquier otra URL `wss://` de Gateway con un endpoint TLS real
- `ws://` en texto claro sigue siendo compatible en direcciones LAN privadas / hosts `.local`, además de `localhost`, `127.0.0.1` y el puente del emulador de Android (`10.0.2.2`)

### Requisitos previos

- Puedes ejecutar el Gateway en la máquina “maestra”.
- El dispositivo/emulador Android puede llegar al WebSocket del gateway:
  - Misma LAN con mDNS/NSD, **o**
  - La misma tailnet de Tailscale usando Wide-Area Bonjour / unicast DNS-SD (consulta abajo), **o**
  - Host/puerto manual del gateway (respaldo)
- El emparejamiento móvil por tailnet/público **no** usa endpoints `ws://` de IP tailnet sin procesar. Usa Tailscale Serve u otra URL `wss://` en su lugar.
- Puedes ejecutar la CLI (`openclaw`) en la máquina del gateway (o mediante SSH).

### 1) Iniciar el Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirma en los logs que veas algo como:

- `listening on ws://0.0.0.0:18789`

Para acceso remoto de Android mediante Tailscale, prefiere Serve/Funnel en lugar de un bind tailnet sin procesar:

```bash
openclaw gateway --tailscale serve
```

Esto da a Android un endpoint seguro `wss://` / `https://`. Una configuración simple `gateway.bind: "tailnet"` no es suficiente para el primer emparejamiento remoto de Android, a menos que también termines TLS por separado.

### 2) Verificar detección (opcional)

Desde la máquina del gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Más notas de depuración: [Bonjour](/es/gateway/bonjour).

Si también configuraste un dominio de detección de área amplia, compáralo con:

```bash
openclaw gateway discover --json
```

Eso muestra `local.` más el dominio de área amplia configurado en una sola pasada y usa el endpoint de servicio resuelto en lugar de pistas solo TXT.

#### Detección por tailnet (Viena ⇄ Londres) mediante unicast DNS-SD

La detección NSD/mDNS de Android no cruza redes. Si tu Node Android y el gateway están en redes distintas pero conectados mediante Tailscale, usa Wide-Area Bonjour / unicast DNS-SD en su lugar.

La detección por sí sola no es suficiente para el emparejamiento Android por tailnet/público. La ruta detectada aún necesita un endpoint seguro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (ejemplo `openclaw.internal.`) en el host del gateway y publica registros `_openclaw-gw._tcp`.
2. Configura DNS dividido de Tailscale para tu dominio elegido apuntando a ese servidor DNS.

Detalles y ejemplo de configuración de CoreDNS: [Bonjour](/es/gateway/bonjour).

### 3) Conectarse desde Android

En la aplicación Android:

- La aplicación mantiene viva su conexión con el gateway mediante un **servicio en primer plano** (notificación persistente).
- Abre la pestaña **Connect**.
- Usa el modo **Setup Code** o **Manual**.
- Si la detección está bloqueada, usa host/puerto manual en **Advanced controls**. Para hosts LAN privados, `ws://` sigue funcionando. Para hosts Tailscale/públicos, activa TLS y usa un endpoint `wss://` / Tailscale Serve.

Después del primer emparejamiento correcto, Android se reconecta automáticamente al iniciarse:

- Endpoint manual (si está habilitado), o si no
- El último gateway detectado (mejor esfuerzo).

### 4) Aprobar el emparejamiento (CLI)

En la máquina del gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalles del emparejamiento: [Pairing](/es/channels/pairing).

Opcional: si el Node Android siempre se conecta desde una subred muy controlada,
puedes habilitar opcionalmente la autoaprobación del primer emparejamiento de Node con CIDR explícitos o IP exactas:

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

Esto está deshabilitado por defecto. Se aplica solo a emparejamiento nuevo `role: node` sin
alcances solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, alcance, metadatos o clave pública siguen requiriendo aprobación manual.

### 5) Verificar que el Node esté conectado

- Mediante el estado de Nodes:

  ```bash
  openclaw nodes status
  ```

- Mediante Gateway:

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) Chat + historial

La pestaña Chat de Android admite selección de sesión (predeterminada `main`, además de otras sesiones existentes):

- Historial: `chat.history` (normalizado para visualización; las etiquetas directivas en línea se eliminan del texto visible, las cargas útiles XML de llamadas a herramientas en texto plano (incluidas `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas) y los tokens de control del modelo filtrados en ASCII/ancho completo se eliminan, las filas puras del asistente con token silencioso como `NO_REPLY` / `no_reply` exactos se omiten, y las filas sobredimensionadas pueden sustituirse por marcadores)
- Enviar: `chat.send`
- Actualizaciones push (mejor esfuerzo): `chat.subscribe` → `event:"chat"`

### 7) Canvas + cámara

#### Host Canvas del Gateway (recomendado para contenido web)

Si quieres que el Node muestre HTML/CSS/JS real que el agente pueda editar en disco, apunta el Node al host canvas del Gateway.

Nota: los Nodes cargan canvas desde el servidor HTTP del Gateway (mismo puerto que `gateway.port`, predeterminado `18789`).

1. Crea `~/.openclaw/workspace/canvas/index.html` en el host del gateway.

2. Navega el Node a esa ruta (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): si ambos dispositivos están en Tailscale, usa un nombre MagicDNS o una IP tailnet en lugar de `.local`, por ejemplo `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Este servidor inyecta un cliente de recarga en vivo en el HTML y recarga con cambios de archivo.
El host A2UI vive en `http://<gateway-host>:18789/__openclaw__/a2ui/`.

Comandos de Canvas (solo en primer plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` o `{"url":"/"}` para volver al scaffold predeterminado). `canvas.snapshot` devuelve `{ format, base64 }` (predeterminado `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (alias heredado `canvas.a2ui.pushJSONL`)

Comandos de cámara (solo en primer plano; sujetos a permisos):

- `camera.snap` (jpg)
- `camera.clip` (mp4)

Consulta [Camera node](/es/nodes/camera) para parámetros y ayudantes de CLI.

### 8) Voice + superficie ampliada de comandos Android

- Pestaña Voice: Android tiene dos modos explícitos de captura. **Mic** es una sesión manual de la pestaña Voice que envía cada pausa como un turno de chat y se detiene cuando la aplicación sale del primer plano o el usuario sale de la pestaña Voice. **Talk** es el modo Talk continuo y sigue escuchando hasta que se desactive o el Node se desconecte.
- El modo Talk asciende el servicio en primer plano existente de `dataSync` a `dataSync|microphone` antes de iniciar la captura y luego lo reduce cuando el modo Talk se detiene. Android 14+ requiere la declaración `FOREGROUND_SERVICE_MICROPHONE`, el permiso de runtime `RECORD_AUDIO` y el tipo de servicio de micrófono en runtime.
- Las respuestas habladas usan `talk.speak` a través del proveedor Talk configurado en el gateway. El TTS local del sistema se usa solo cuando `talk.speak` no está disponible.
- La activación por voz sigue deshabilitada en la UX/runtime de Android.
- Familias adicionales de comandos Android (la disponibilidad depende del dispositivo + permisos):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `notifications.list`, `notifications.actions` (consulta [Notification forwarding](#notification-forwarding) abajo)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Puntos de entrada del asistente

Android admite iniciar OpenClaw desde el disparador del asistente del sistema (Google
Assistant). Cuando está configurado, mantener pulsado el botón de inicio o decir "Hey Google, ask
OpenClaw..." abre la aplicación y pasa el prompt al compositor del chat.

Esto usa metadatos de **App Actions** de Android declarados en el manifiesto de la aplicación. No
se necesita configuración adicional en el lado del gateway: la intención del asistente la gestiona completamente la aplicación Android y se reenvía como un mensaje de chat normal.

<Note>
La disponibilidad de App Actions depende del dispositivo, de la versión de Google Play Services
y de si el usuario ha configurado OpenClaw como aplicación de asistente predeterminada.
</Note>

## Reenvío de notificaciones

Android puede reenviar notificaciones del dispositivo al gateway como eventos. Varios controles permiten limitar qué notificaciones se reenvían y cuándo.

| Clave                            | Tipo           | Descripción                                                                                       |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | Reenviar solo notificaciones de estos nombres de paquete. Si se define, todos los demás paquetes se ignoran. |
| `notifications.denyPackages`     | string[]       | No reenviar nunca notificaciones de estos nombres de paquete. Se aplica después de `allowPackages`. |
| `notifications.quietHours.start` | string (HH:mm) | Inicio de la ventana de horas silenciosas (hora local del dispositivo). Las notificaciones se suprimen durante esta ventana. |
| `notifications.quietHours.end`   | string (HH:mm) | Fin de la ventana de horas silenciosas.                                                           |
| `notifications.rateLimit`        | number         | Máximo de notificaciones reenviadas por paquete y por minuto. Las notificaciones excedentes se descartan. |

El selector de notificaciones también usa un comportamiento más seguro para eventos de notificaciones reenviadas, evitando el reenvío accidental de notificaciones sensibles del sistema.

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
El reenvío de notificaciones requiere el permiso Android Notification Listener. La aplicación lo solicita durante la configuración.
</Note>

## Relacionado

- [iOS app](/es/platforms/ios)
- [Nodes](/es/nodes)
- [Android node troubleshooting](/es/nodes/troubleshooting)
