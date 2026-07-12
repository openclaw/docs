---
read_when:
    - Configuración o depuración del control remoto de Mac
summary: Flujo de la aplicación para macOS para controlar un Gateway remoto de OpenClaw
title: Control remoto
x-i18n:
    generated_at: "2026-07-11T23:16:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

Este flujo permite que la aplicación de macOS actúe como un control remoto completo para un Gateway de OpenClaw que se ejecuta en otro host (equipo de escritorio/servidor). La aplicación se conecta directamente a URL de Gateway de confianza en la LAN/Tailnet o gestiona un túnel SSH cuando el Gateway remoto solo está disponible mediante local loopback. Las comprobaciones de estado, el reenvío de la activación por voz y el chat web reutilizan la misma configuración remota de _Settings -> General_.

## Modos

- **Local (este Mac)**: todo se ejecuta en el portátil; no interviene SSH.
- **Remoto mediante SSH (predeterminado)**: los comandos de OpenClaw se ejecutan en el host remoto. La aplicación abre una conexión SSH con `-o BatchMode`, la identidad/clave elegida y un reenvío de puerto local.
- **Remoto directo (ws/wss)**: sin túnel SSH; la aplicación se conecta directamente a la URL del Gateway (LAN, Tailscale, Tailscale Serve o un proxy inverso HTTPS público).

## Transportes remotos

- **Túnel SSH** (predeterminado): usa `ssh -N -L ...` para reenviar el puerto del Gateway a localhost. El Gateway ve la IP del Node como `127.0.0.1` porque el túnel utiliza local loopback.
- **Directo (ws/wss)**: se conecta directamente a la URL del Gateway. El Gateway ve la IP real del cliente.

La aplicación desactiva la multiplexación de conexiones SSH y la ejecución en segundo plano posterior a la autenticación para sus propios procesos SSH, de modo que pueda supervisar y reiniciar el proceso exacto, aunque el alias seleccionado habilite `ControlMaster` o `ForkAfterAuthentication`.

La verificación de la clave de host SSH es estricta de forma predeterminada porque las credenciales del Gateway pasan por este túnel. Para adoptar el comportamiento de confianza propio de un alias SSH gestionado, establece `--ssh-host-key-policy openssh` mediante `openclaw-mac configure-remote` o establece directamente `gateway.remote.sshHostKeyPolicy` en `"openssh"`. Revisa el alias y cualquier configuración coincidente de `Host *` o del sistema antes de habilitar esta opción. Al cambiar el destino SSH (en la aplicación o mediante `configure-remote`), la política vuelve a `strict`, salvo que vuelvas a habilitarla explícitamente para el nuevo destino.

En el modo de túnel SSH, los nombres de host de LAN/Tailnet descubiertos se guardan como `gateway.remote.sshTarget`. La aplicación mantiene `gateway.remote.url` en el punto de conexión del túnel local (por ejemplo, `ws://127.0.0.1:18789`) para que la CLI, el chat web y el servicio local del host del Node utilicen el mismo transporte de local loopback. Cuando la detección devuelve tanto IP sin procesar de Tailnet como nombres de host estables, la aplicación prefiere los nombres de Tailscale MagicDNS o de la LAN para que las conexiones resistan mejor los cambios de dirección. Si el puerto del túnel local difiere del puerto del Gateway remoto, establece `gateway.remote.remotePort` en el puerto del host remoto.

En el modo remoto, la automatización del navegador pertenece al host del Node de la CLI, no al Node de la aplicación nativa de macOS. La aplicación inicia el servicio instalado del host del Node cuando es posible; para habilitar el control del navegador desde ese Mac, instálalo/inícialo con `openclaw node install ...` y `openclaw node start` (o ejecuta `openclaw node run ...` en primer plano) y, a continuación, selecciona ese Node con capacidad de navegador.

## Requisitos previos en el host remoto

1. Instala Node + pnpm y compila/instala la CLI de OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Asegúrate de que `openclaw` esté en PATH para los shells no interactivos (crea un enlace simbólico en `/usr/local/bin` o `/opt/homebrew/bin` si es necesario).
3. Para el transporte SSH: configura la autenticación SSH mediante claves. Se recomiendan las IP de Tailscale para mantener un acceso estable fuera de la LAN.

## Configuración de la aplicación de macOS

Para preconfigurar la aplicación sin el flujo de bienvenida, mediante SSH:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

O, para un Gateway que ya esté accesible en una LAN o Tailnet de confianza, omite SSH por completo:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Ambas formas escriben `~/.openclaw/openclaw.json`, marcan la incorporación como completada y permiten que la aplicación gestione el transporte seleccionado en el siguiente inicio. `--local-port`/`--remote-port` tienen como valor predeterminado `18789`. Otras opciones: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Ejecuta `openclaw-mac configure-remote --help` para consultar la referencia completa.

Para configurarlo desde la interfaz de usuario:

1. Abre _Settings -> General_.
2. En **OpenClaw runs**, selecciona **Remote** y configura:
   - **Transport**: **SSH tunnel** o **Direct (ws/wss)**.
   - **SSH target**: `user@host` (`:port` opcional). Si el Gateway está en la misma LAN y se anuncia mediante Bonjour, selecciónalo en la lista de dispositivos detectados para rellenar automáticamente este campo.
   - **Gateway URL** (solo para Direct): `wss://gateway.example.ts.net` (o `ws://...` para conexiones locales/LAN).
   - **Identity file** (opciones avanzadas): ruta de la clave.
   - **Project root** (opciones avanzadas): ruta remota del repositorio usada para los comandos.
   - **CLI path** (opciones avanzadas): ruta opcional a un punto de entrada/binario ejecutable de `openclaw` (se rellena automáticamente cuando se anuncia).
3. Pulsa **Test remote**. Si se completa correctamente, significa que el comando remoto `openclaw status --json` se ejecutó sin problemas. Los fallos suelen indicar problemas con PATH o la CLI; el código de salida 127 significa que no se encontró la CLI en el host remoto.
4. Las comprobaciones de estado y el chat web ahora se ejecutan automáticamente mediante el transporte seleccionado.

## Chat web

- **Túnel SSH**: se conecta al Gateway mediante el puerto de control WebSocket reenviado (18789 de forma predeterminada).
- **Directo (ws/wss)**: se conecta directamente a la URL configurada del Gateway.
- No hay ningún servidor HTTP independiente para el chat web.

## Permisos

- El host remoto necesita las mismas autorizaciones de TCC que el local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Ejecuta una vez el proceso de incorporación en ese equipo para concederlas.
- Los Nodes anuncian el estado de sus permisos mediante `node.list` / `node.describe` para que los agentes sepan qué está disponible.

## Notas de seguridad

- Prefiere enlaces de local loopback en el host remoto y conéctate mediante SSH, Tailscale Serve o una URL directa de Tailnet/LAN de confianza.
- De forma predeterminada, el túnel SSH requiere una clave de host que ya sea de confianza. Confía primero en la clave del host (añádela al archivo configurado de hosts conocidos) o establece explícitamente `gateway.remote.sshHostKeyPolicy: "openssh"` para un alias gestionado cuya política de confianza de OpenSSH aceptes.
- Si vinculas el Gateway a una interfaz distinta de local loopback, exige una autenticación válida del Gateway: token, contraseña o un proxy inverso con reconocimiento de identidad y `gateway.auth.mode: "trusted-proxy"`.
- Consulta [Seguridad](/es/gateway/security) y [Tailscale](/es/gateway/tailscale).

## Flujo de inicio de sesión de WhatsApp (remoto)

- Ejecuta `openclaw channels login --channel whatsapp --verbose` **en el host remoto**. Escanea el código QR con WhatsApp en el teléfono.
- Vuelve a iniciar sesión en ese host si caduca la autenticación. La comprobación de estado muestra los problemas de vinculación.

## Solución de problemas

| Síntoma                                          | Causa / solución                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / no encontrado                       | `openclaw` no está en PATH para los shells sin inicio de sesión. Añádalo a `/etc/paths` o al archivo rc de su shell, o cree un enlace simbólico en `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Error en la comprobación de estado               | Compruebe la conectividad SSH, PATH y que Baileys (WhatsApp) tenga la sesión iniciada (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| El chat web no responde                          | Confirme que el Gateway se esté ejecutando en el host remoto y que el puerto reenviado coincida con el puerto WS del Gateway; la interfaz de usuario requiere una conexión WS en buen estado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| La IP del Node muestra `127.0.0.1`               | Es el comportamiento esperado con el túnel SSH. Cambie **Transporte** a **Direct (ws/wss)** si desea que el Gateway vea la IP real del cliente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| El panel funciona, pero las prestaciones del Mac están sin conexión | La conexión de operación/control está en buen estado, pero la conexión del Node complementario no está conectada o no dispone de su interfaz de comandos. Abra la sección de dispositivos de la barra de menús y compruebe si el Mac aparece como `paired · disconnected`. Para los extremos de Tailscale Serve `wss://*.ts.net`, la aplicación detecta los pines de certificados TLS hoja heredados y obsoletos después de la rotación del certificado, borra el pin obsoleto cuando macOS confía en el nuevo certificado y vuelve a intentarlo automáticamente. Si el sistema no confía en el certificado o el host no es un nombre de Tailscale Serve, establezca `gateway.remote.tlsFingerprint` en la huella digital esperada del certificado, revise el certificado o cambie a **Remoto mediante SSH**. |
| Activación por voz                               | Las frases de activación se reenvían automáticamente en modo remoto; no se necesita un reenviador independiente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

## Sonidos de notificación

Elija los sonidos para cada notificación desde scripts con `openclaw nodes notify`, por ejemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

No hay un selector global de sonido predeterminado en la aplicación; los llamadores eligen un sonido (o ninguno) para cada solicitud.

## Contenido relacionado

- [Aplicación para macOS](/es/platforms/macos)
- [Acceso remoto](/es/gateway/remote)
