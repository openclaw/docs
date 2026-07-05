---
read_when:
    - Configurar o depurar el control remoto de Mac
summary: Flujo de la aplicación de macOS para controlar un Gateway remoto de OpenClaw
title: Control remoto
x-i18n:
    generated_at: "2026-07-05T11:32:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

Este flujo permite que la app de macOS actúe como un control remoto completo para un Gateway de OpenClaw que se ejecuta en otro host (equipo de escritorio/servidor). La app se conecta directamente a URL de Gateway de LAN/Tailnet de confianza, o administra un túnel SSH cuando el Gateway remoto es solo loopback. Las comprobaciones de estado, el reenvío de activación por voz y el Chat web reutilizan la misma configuración remota de _Configuración -> General_.

## Modos

- **Local (este Mac)**: todo se ejecuta en el portátil; no interviene SSH.
- **Remoto por SSH (predeterminado)**: los comandos de OpenClaw se ejecutan en el host remoto. La app abre una conexión SSH con `-o BatchMode`, la identidad/clave elegida y un reenvío de puerto local.
- **Remoto directo (ws/wss)**: sin túnel SSH; la app se conecta directamente a la URL del Gateway (LAN, Tailscale, Tailscale Serve o un proxy inverso HTTPS público).

## Transportes remotos

- **Túnel SSH** (predeterminado): usa `ssh -N -L ...` para reenviar el puerto del Gateway a localhost. El Gateway ve la IP del nodo como `127.0.0.1` porque el túnel es loopback.
- **Directo (ws/wss)**: se conecta directamente a la URL del Gateway. El Gateway ve la IP real del cliente.

La app desactiva la multiplexación de conexiones SSH y el paso a segundo plano posterior a la autenticación para sus propios procesos SSH, de modo que pueda supervisar y reiniciar el proceso exacto, incluso si el alias seleccionado habilita `ControlMaster` o `ForkAfterAuthentication`.

La verificación de claves de host SSH es estricta de forma predeterminada porque las credenciales del Gateway viajan por este túnel. Para aceptar el comportamiento de confianza propio de un alias SSH administrado, establece `--ssh-host-key-policy openssh` mediante `openclaw-mac configure-remote`, o establece `gateway.remote.sshHostKeyPolicy` en `"openssh"` directamente. Revisa el alias y cualquier configuración `Host *` coincidente o del sistema antes de aceptarlo. Cambiar el destino SSH (en la app o mediante `configure-remote`) restablece la política a `strict`, a menos que la aceptes explícitamente de nuevo para el nuevo destino.

En el modo de túnel SSH, los nombres de host LAN/tailnet detectados se guardan como `gateway.remote.sshTarget`. La app mantiene `gateway.remote.url` en el punto de conexión del túnel local (por ejemplo, `ws://127.0.0.1:18789`) para que CLI, Chat web y el servicio de host de nodo local usen todos el mismo transporte loopback. Cuando la detección devuelve tanto IPs Tailnet sin procesar como nombres de host estables, la app prefiere Tailscale MagicDNS o nombres LAN para que las conexiones sobrevivan mejor a los cambios de dirección. Si el puerto del túnel local difiere del puerto remoto del Gateway, establece `gateway.remote.remotePort` en el puerto del host remoto.

La automatización del navegador en modo remoto pertenece al host de nodo de la CLI, no al nodo nativo de la app de macOS. La app inicia el servicio de host de nodo instalado cuando es posible; para habilitar el control del navegador desde ese Mac, instálalo/inícialo con `openclaw node install ...` y `openclaw node start` (o ejecuta `openclaw node run ...` en primer plano), y luego apunta a ese nodo con capacidad de navegador.

## Requisitos previos en el host remoto

1. Instala Node + pnpm y compila/instala la CLI de OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Asegúrate de que `openclaw` esté en PATH para shells no interactivos (crea un symlink en `/usr/local/bin` o `/opt/homebrew/bin` si es necesario).
3. Para el transporte SSH: configura la autenticación SSH basada en claves. Se recomiendan las IPs de Tailscale para una accesibilidad estable fuera de la LAN.

## Configuración de la app de macOS

Para preconfigurar la app sin el flujo de bienvenida, por SSH:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

O, para un Gateway que ya sea accesible en una LAN o Tailnet de confianza, omite SSH por completo:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Ambas formas escriben `~/.openclaw/openclaw.json`, marcan el onboarding como completado y permiten que la app controle el transporte seleccionado en el siguiente inicio. `--local-port`/`--remote-port` usan `18789` de forma predeterminada. Otras flags: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Ejecuta `openclaw-mac configure-remote --help` para ver la referencia completa.

Para configurar desde la interfaz de usuario en su lugar:

1. Abre _Configuración -> General_.
2. En **OpenClaw se ejecuta**, elige **Remoto** y establece:
   - **Transporte**: **Túnel SSH** o **Directo (ws/wss)**.
   - **Destino SSH**: `user@host` (`:port` opcional). Si el Gateway está en la misma LAN y anuncia Bonjour, selecciónalo en la lista detectada para rellenar este campo automáticamente.
   - **URL del Gateway** (solo Directo): `wss://gateway.example.ts.net` (o `ws://...` para local/LAN).
   - **Archivo de identidad** (avanzado): ruta a tu clave.
   - **Raíz del proyecto** (avanzado): ruta del checkout remoto usada para comandos.
   - **Ruta de la CLI** (avanzado): ruta opcional a un punto de entrada/binario `openclaw` ejecutable (se rellena automáticamente cuando se anuncia).
3. Pulsa **Probar remoto**. El éxito significa que el `openclaw status --json` remoto se ejecutó correctamente. Los fallos suelen indicar problemas de PATH/CLI; el código de salida 127 significa que la CLI no se encontró en el remoto.
4. Las comprobaciones de estado y el Chat web ahora se ejecutan automáticamente a través del transporte seleccionado.

## Chat web

- **Túnel SSH**: se conecta al Gateway por el puerto de control WebSocket reenviado (18789 de forma predeterminada).
- **Directo (ws/wss)**: se conecta directamente a la URL configurada del Gateway.
- No hay un servidor HTTP de Chat web separado.

## Permisos

- El host remoto necesita las mismas aprobaciones de TCC que el local (Automatización, Accesibilidad, Grabación de pantalla, Micrófono, Reconocimiento de voz, Notificaciones). Ejecuta el onboarding una vez en esa máquina para concederlas.
- Los nodos anuncian su estado de permisos mediante `node.list` / `node.describe`, para que los agentes sepan qué está disponible.

## Notas de seguridad

- Prefiere enlaces loopback en el host remoto y conéctate mediante SSH, Tailscale Serve o una URL directa Tailnet/LAN de confianza.
- El túnel SSH requiere una clave de host ya confiable de forma predeterminada. Confía primero en la clave de host (agrégala al archivo known-hosts configurado), o establece explícitamente `gateway.remote.sshHostKeyPolicy: "openssh"` para un alias administrado cuya política de confianza de OpenSSH aceptes.
- Si vinculas el Gateway a una interfaz que no sea loopback, exige autenticación válida del Gateway: token, contraseña o un proxy inverso consciente de identidad con `gateway.auth.mode: "trusted-proxy"`.
- Consulta [Seguridad](/es/gateway/security) y [Tailscale](/es/gateway/tailscale).

## Flujo de inicio de sesión de WhatsApp (remoto)

- Ejecuta `openclaw channels login --channel whatsapp --verbose` **en el host remoto**. Escanea el QR con WhatsApp en tu teléfono.
- Vuelve a ejecutar el inicio de sesión en ese host si la autenticación caduca. La comprobación de estado muestra problemas de enlace.

## Solución de problemas

| Síntoma                                          | Causa / solución                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / no encontrado                       | `openclaw` no está en el PATH para shells que no son de inicio de sesión. Agrégalo a `/etc/paths`, al rc de tu shell, o crea un enlace simbólico en `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Falló la sonda de estado                         | Comprueba la conectividad SSH, el PATH y que Baileys (WhatsApp) haya iniciado sesión (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Web Chat atascado                                | Confirma que el gateway se esté ejecutando en el host remoto y que el puerto reenviado coincida con el puerto WS del gateway; la UI requiere una conexión WS saludable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| La IP del nodo muestra `127.0.0.1`               | Es lo esperado con el túnel SSH. Cambia **Transporte** a **Directo (ws/wss)** si quieres que el gateway vea la IP real del cliente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| El panel funciona, pero las capacidades de Mac están sin conexión | La conexión de operador/control está saludable, pero la conexión del nodo complementario no está conectada o le falta su superficie de comandos. Abre la sección del dispositivo en la barra de menús y comprueba si el Mac está `paired · disconnected`. Para endpoints Tailscale Serve `wss://*.ts.net`, la app detecta pines de hoja TLS heredados obsoletos después de la rotación del certificado, borra el pin obsoleto cuando macOS confía en el certificado nuevo y reintenta automáticamente. Si el sistema no confía en el certificado o el host no es un nombre de Tailscale Serve, establece `gateway.remote.tlsFingerprint` en la huella digital esperada del certificado, revisa el certificado o cambia a **Remoto por SSH**. |
| Voice Wake                                       | Las frases de activación se reenvían automáticamente en modo remoto; no se necesita un reenviador aparte.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Sonidos de notificación

Elige sonidos por notificación desde scripts con `openclaw nodes notify`, por ejemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

No hay un interruptor global de sonido predeterminado en la app; los llamadores eligen un sonido (o ninguno) por solicitud.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [Acceso remoto](/es/gateway/remote)
