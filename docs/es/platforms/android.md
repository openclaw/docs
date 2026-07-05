---
read_when:
    - Emparejar o reconectar el nodo Android
    - Depuración del descubrimiento o la autenticación del gateway de Android
    - Verificación de la paridad del historial de chat entre clientes
summary: 'Aplicación Android (node): guía operativa de conexión + superficie de comandos de Connect/Chat/Voice/Canvas'
title: Aplicación para Android
x-i18n:
    generated_at: "2026-07-05T11:30:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6eb5e4028c9b53f77f97335773adf6e7f4aec422eaad728566e0b9a98962f1
    source_path: platforms/android.md
    workflow: 16
---

<Note>
La app oficial de Android está disponible en [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN). Es un Node complementario y requiere un OpenClaw Gateway en ejecución. Fuente: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([instrucciones de compilación](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Resumen de compatibilidad

- Rol: app Node complementaria (Android no aloja el Gateway).
- Gateway requerido: sí (ejecútalo en macOS, Linux o Windows mediante WSL2).
- Instalación: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) para la app, [Primeros pasos](/es/start/getting-started) para el Gateway y luego [Emparejamiento](/es/channels/pairing).
- Gateway: [Manual operativo](/es/gateway) + [Configuración](/es/gateway/configuration).
  - Protocolos: [Protocolo de Gateway](/es/gateway/protocol) (Nodes + plano de control).

El control del sistema (launchd/systemd) reside en el host del Gateway; consulta [Gateway](/es/gateway).

## Manual operativo de conexión

App Node de Android ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android se conecta directamente al WebSocket del Gateway y usa emparejamiento de dispositivo (`role: node`).

Para Tailscale o hosts públicos, Android requiere un endpoint seguro:

- Preferido: Tailscale Serve / Funnel con `https://<magicdns>` / `wss://<magicdns>`
- También compatible: cualquier otra URL de Gateway `wss://` con un endpoint TLS real
- `ws://` sin cifrar sigue siendo compatible en direcciones de LAN privadas / hosts `.local`, además de `localhost`, `127.0.0.1` y el puente del emulador de Android (`10.0.2.2`)

### Requisitos previos

- Gateway en ejecución en otra máquina (o accesible por SSH).
- El dispositivo/emulador Android puede alcanzar el WebSocket del Gateway:
  - Misma LAN con mDNS/NSD, **o**
  - Misma tailnet de Tailscale usando Wide-Area Bonjour / DNS-SD unicast (ver abajo), **o**
  - Host/puerto del Gateway manual (alternativa)
- El emparejamiento móvil por tailnet/público **no** usa endpoints `ws://` con IP sin procesar de la tailnet. Usa Tailscale Serve u otra URL `wss://` en su lugar.
- La CLI `openclaw` disponible en la máquina del Gateway (o mediante SSH), para aprobar solicitudes de emparejamiento.

### 1. Inicia el Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Confirma que en los registros ves algo como:

- `listening on ws://0.0.0.0:18789`

Para acceso remoto de Android mediante Tailscale, prefiere Serve/Funnel en lugar de una vinculación sin procesar a la tailnet:

```bash
openclaw gateway --tailscale serve
```

Esto da a Android un endpoint seguro `wss://` / `https://`. Una configuración simple de `gateway.bind: "tailnet"` no basta para el primer emparejamiento remoto de Android a menos que también termines TLS por separado.

### 2. Verifica el descubrimiento (opcional)

Desde la máquina del Gateway:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Más notas de depuración: [Bonjour](/es/gateway/bonjour).

Si también configuraste un dominio de descubrimiento de área amplia, compáralo con:

```bash
openclaw gateway discover --json
```

Eso muestra `local.` más el dominio de área amplia configurado en una sola pasada, usando el endpoint de servicio resuelto en lugar de pistas solo TXT.

#### Descubrimiento entre redes mediante DNS-SD unicast

El descubrimiento NSD/mDNS de Android no cruza redes. Si el Node Android y el Gateway están en redes diferentes pero conectados mediante Tailscale, usa Wide-Area Bonjour / DNS-SD unicast en su lugar. El descubrimiento por sí solo no basta para el emparejamiento de Android por tailnet/público: la ruta descubierta todavía necesita un endpoint seguro (`wss://` o Tailscale Serve):

1. Configura una zona DNS-SD (ejemplo `openclaw.internal.`) en el host del Gateway y publica registros `_openclaw-gw._tcp`.
2. Configura DNS dividido de Tailscale para el dominio elegido que apunte a ese servidor DNS.

Detalles y configuración de ejemplo de CoreDNS: [Bonjour](/es/gateway/bonjour).

### 3. Conéctate desde Android

En la app de Android:

- La app mantiene activa su conexión al Gateway mediante un **servicio en primer plano** (notificación persistente).
- Abre la pestaña **Conectar**.
- Usa el modo **Código de configuración** o **Manual**.
- Si el descubrimiento está bloqueado, usa host/puerto manual en **Controles avanzados**. Para hosts de LAN privada, `ws://` sigue funcionando. Para hosts Tailscale/públicos, activa TLS y usa un endpoint `wss://` / Tailscale Serve.

Después del primer emparejamiento correcto, Android se reconecta automáticamente al iniciar: el endpoint manual (si está habilitado) o, si no, el último Gateway descubierto (mejor esfuerzo).

### Señales de presencia activa

Después de que se conecte la sesión de Node autenticada, y cuando la app pase a segundo plano mientras el servicio en primer plano siga conectado, Android llama a `node.event` con `event: "node.presence.alive"`. El Gateway registra esto como `lastSeenAtMs`/`lastSeenReason` en los metadatos del Node/dispositivo emparejado solo después de conocer la identidad autenticada del dispositivo Node.

La app cuenta la señal como registrada correctamente solo cuando la respuesta del Gateway incluye `handled: true`. Los Gateways antiguos pueden confirmar `node.event` con `{ "ok": true }`; esa respuesta es compatible, pero no cuenta como una actualización duradera de último visto.

### 4. Aprueba el emparejamiento (CLI)

En la máquina del Gateway:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Detalles de emparejamiento: [Emparejamiento](/es/channels/pairing).

Opcional: si el Node Android siempre se conecta desde una subred estrictamente controlada, puedes optar por la aprobación automática de Nodes en el primer uso con CIDR explícitos o IP exactas:

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

Esto está deshabilitado de forma predeterminada. Se aplica solo al emparejamiento nuevo con `role: node` sin ámbitos solicitados. El emparejamiento de operador/navegador y cualquier cambio de rol, ámbito, metadatos o clave pública siguen requiriendo aprobación manual.

### 5. Verifica que el Node esté conectado

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Chat + historial

La pestaña Chat de Android admite selección de sesión (`main` de forma predeterminada, además de otras sesiones existentes):

- Historial: `chat.history` (normalizado para visualización: se eliminan etiquetas de directivas en línea, cargas XML de llamadas a herramientas en texto plano (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` y variantes truncadas), y tokens de control de modelo filtrados en ASCII/ancho completo; se omiten filas de asistente con tokens silenciosos como `NO_REPLY` / `no_reply` exactos; las filas demasiado grandes pueden reemplazarse por marcadores de posición)
- Enviar: `chat.send`
- Actualizaciones push (mejor esfuerzo): `chat.subscribe` -> `event:"chat"`

### 7. Canvas + cámara

#### Host de Canvas del Gateway (recomendado para contenido web)

Para que el Node muestre HTML/CSS/JS real que el agente pueda editar en disco, apunta el Node al host de Canvas del Gateway.

<Note>
Los Nodes cargan Canvas desde el servidor HTTP del Gateway (mismo puerto que `gateway.port`, predeterminado `18789`).
</Note>

1. Crea `~/.openclaw/workspace/canvas/index.html` en el host del Gateway.
2. Navega el Node hasta él (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (opcional): si ambos dispositivos están en Tailscale, usa un nombre MagicDNS o una IP de tailnet en lugar de `.local`, por ejemplo, `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Este servidor inyecta un cliente de recarga en vivo en HTML y recarga cuando cambian los archivos. El Gateway también sirve `/__openclaw__/a2ui/`, pero la app de Android trata las páginas A2UI remotas como solo renderización. Los comandos A2UI con acciones usan la página A2UI incluida y propiedad de la app.

Comandos de Canvas (solo en primer plano):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (usa `{"url":""}` o `{"url":"/"}` para volver al andamiaje predeterminado). `canvas.snapshot` devuelve `{ format, base64 }` (`format="jpeg"` de forma predeterminada).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` alias heredado). Estos usan la página A2UI incluida y propiedad de la app para renderización con acciones.

Comandos de cámara (solo en primer plano; protegidos por permisos): `camera.snap` (jpg), `camera.clip` (mp4). Consulta [Node de cámara](/es/nodes/camera) para parámetros y ayudantes de CLI.

### 8. Voz + superficie ampliada de comandos de Android

- Pestaña Voz: Android tiene dos modos de captura explícitos. **Mic** es una sesión manual de la pestaña Voz que envía cada pausa como un turno de chat y se detiene cuando la app deja el primer plano o el usuario sale de la pestaña Voz. **Talk** es el modo Talk continuo y sigue escuchando hasta que se desactive o el Node se desconecte.
- El modo Talk promueve el servicio en primer plano existente de `connectedDevice` a `connectedDevice|microphone` antes de iniciar la captura, y luego lo degrada cuando el modo Talk se detiene. El servicio Node declara `FOREGROUND_SERVICE_CONNECTED_DEVICE` con `CHANGE_NETWORK_STATE`; Android 14+ también requiere la declaración `FOREGROUND_SERVICE_MICROPHONE`, el permiso de ejecución `RECORD_AUDIO` y el tipo de servicio de micrófono en tiempo de ejecución.
- De forma predeterminada, Android Talk usa reconocimiento de voz nativo, chat del Gateway y `talk.speak` mediante el proveedor Talk configurado del Gateway. TTS local del sistema se usa solo cuando `talk.speak` no está disponible.
- Android Talk usa el relé en tiempo real del Gateway solo cuando `talk.realtime.mode` es `realtime` y `talk.realtime.transport` es `gateway-relay`.
- La activación por voz está implementada en el código fuente (`VoiceWakeMode`), pero el entorno de ejecución de la app distribuida siempre la fuerza a `off` al conectar; hoy no hay ningún interruptor orientado al usuario.
- Familias adicionales de comandos de Android (la disponibilidad depende del dispositivo, los permisos y la configuración del usuario):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` solo cuando **Configuración > Capacidades del teléfono > Apps instaladas** está habilitado; lista de forma predeterminada las apps visibles en el lanzador (pasa `includeNonLaunchable` para la lista completa).
  - `notifications.list`, `notifications.actions` (consulta [Reenvío de notificaciones](#notification-forwarding) abajo)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

## Puntos de entrada del asistente

Android admite iniciar OpenClaw desde el disparador de asistente del sistema (Google Assistant). Mantener presionado el botón de inicio (u otro disparador `ACTION_ASSIST`) abre la app; decir "Hey Google, ask OpenClaw `<prompt>`" coincide con el patrón de consulta de App Actions declarado por la app y entrega el prompt al compositor de chat sin enviarlo automáticamente.

Esto usa **App Actions** de Android (capacidad `shortcuts.xml`) declaradas en el manifiesto de la app. No se necesita configuración del lado del Gateway: el intent del asistente lo maneja por completo la app de Android.

<Note>
La disponibilidad de App Actions depende del dispositivo, la versión de Google Play Services y si el usuario ha configurado OpenClaw como la app de asistente predeterminada.
</Note>

## Reenvío de notificaciones

Android puede reenviar notificaciones del dispositivo al Gateway como elementos `node.event`. Esto se configura **en el dispositivo**, en la hoja de Configuración de la app, no en la configuración de gateway/`openclaw.json`.

| Configuración                     | Descripción                                                                                                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reenviar eventos de notificación | Interruptor maestro. Desactivado de forma predeterminada; requiere que primero se conceda acceso al escucha de notificaciones.                                                                                                              |
| Filtro de paquetes              | **Lista de permitidos** (solo se reenvían los ID de paquete enumerados) o **Lista de bloqueados** (predeterminado: todos los paquetes excepto los ID enumerados). El paquete propio de OpenClaw siempre se excluye en modo Lista de bloqueados para evitar bucles de reenvío. |
| Horas de silencio                 | Ventana local de inicio/fin en formato HH:mm que suprime el reenvío. Desactivada de forma predeterminada; usa `22:00`-`07:00` de forma predeterminada una vez activada.                                                                                |
| Máx. eventos / minuto         | Límite de frecuencia por dispositivo para las notificaciones reenviadas. Predeterminado: 20.                                                                                                                                          |
| Clave de sesión de ruta           | Opcional. Fija los eventos de notificación reenviados en una sesión específica en lugar de usar la ruta de notificaciones predeterminada del dispositivo.                                                                               |

<Note>
El reenvío de notificaciones requiere el permiso de escucha de notificaciones de Android. La app lo solicita durante la configuración.
</Note>

## Relacionado

- [App de iOS](/es/platforms/ios)
- [Nodos](/es/nodes)
- [Solución de problemas del nodo Android](/es/nodes/troubleshooting)
