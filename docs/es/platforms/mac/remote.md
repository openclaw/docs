---
read_when:
    - Configurar o depurar el control remoto de Mac
summary: flujo de la app de macOS para controlar un Gateway remoto de OpenClaw
title: Control remoto
x-i18n:
    generated_at: "2026-07-03T23:26:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

Este flujo permite que la app de macOS actúe como un control remoto completo para un Gateway de OpenClaw que se ejecuta en otro host (escritorio/servidor). La app puede conectarse directamente a URL de Gateway de LAN/Tailnet de confianza o gestionar un túnel SSH cuando el Gateway remoto es solo loopback. Las comprobaciones de estado, el reenvío de activación por voz y el Chat web reutilizan la misma configuración remota de _Settings → General_.

## Modos

- **Local (este Mac)**: Todo se ejecuta en el portátil. No interviene SSH.
- **Remoto por SSH (predeterminado)**: Los comandos de OpenClaw se ejecutan en el host remoto. La app de Mac abre una conexión SSH con `-o BatchMode`, además de la identidad/clave que elijas y un reenvío de puerto local.
- **Remoto directo (ws/wss)**: Sin túnel SSH. La app de Mac se conecta directamente a la URL del Gateway (por ejemplo, mediante LAN, Tailscale, Tailscale Serve o un proxy inverso HTTPS público).

## Transportes remotos

El modo remoto admite dos transportes:

- **Túnel SSH** (predeterminado): Usa `ssh -N -L ...` para reenviar el puerto del Gateway a localhost. El Gateway verá la IP del nodo como `127.0.0.1` porque el túnel es loopback.
- **Directo (ws/wss)**: Se conecta directamente a la URL del Gateway. El Gateway ve la IP real del cliente.

La app deshabilita la multiplexación de conexiones SSH y el paso a segundo plano después de la autenticación para los procesos SSH propiedad de la app, de modo que pueda supervisar y reiniciar el proceso exacto incluso cuando el alias seleccionado habilita `ControlMaster` o `ForkAfterAuthentication`.

La verificación de claves de host SSH es estricta de forma predeterminada porque las credenciales del Gateway viajan por este túnel. Para un alias SSH gestionado cuyo comportamiento de confianza quieras usar explícitamente, actívalo con `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` o establece `gateway.remote.sshHostKeyPolicy` en `"openssh"`. Esta activación usa la política efectiva de claves de host de OpenSSH; revisa primero el alias y cualquier configuración coincidente de `Host *` o del sistema. Cambiar el destino SSH en la app o con `configure-remote` restablece la política a `strict`, salvo que la actives explícitamente de nuevo.

En modo de túnel SSH, los nombres de host LAN/tailnet detectados se guardan como
`gateway.remote.sshTarget`. La app mantiene `gateway.remote.url` en el endpoint
local del túnel, por ejemplo `ws://127.0.0.1:18789`, para que la CLI, el Chat web y
el servicio local de host de nodo usen todos el mismo transporte loopback seguro.
Cuando la detección devuelve tanto IPs de Tailnet sin procesar como nombres de host estables, la app
prefiere nombres de Tailscale MagicDNS o LAN para que las conexiones remotas sobrevivan mejor
a los cambios de dirección.
Si el puerto local del túnel difiere del puerto remoto del Gateway, establece
`gateway.remote.remotePort` en el puerto del host remoto.

La automatización del navegador en modo remoto pertenece al host de nodo de la CLI, no al
nodo nativo de la app de macOS. La app inicia el servicio de host de nodo instalado cuando
es posible; si necesitas control del navegador desde ese Mac, instálalo/inícialo con
`openclaw node install ...` y `openclaw node start` (o ejecuta
`openclaw node run ...` en primer plano), y luego apunta a ese nodo con capacidad de navegador.

## Requisitos previos en el host remoto

1. Instala Node + pnpm y compila/instala la CLI de OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Asegúrate de que `openclaw` esté en PATH para shells no interactivos (crea un symlink en `/usr/local/bin` o `/opt/homebrew/bin` si hace falta).
3. Solo para transporte SSH: abre SSH con autenticación por clave. Recomendamos IPs de **Tailscale** para una accesibilidad estable fuera de la LAN.

## Configuración de la app de macOS

Para preconfigurar la app sin el flujo de bienvenida:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Para un Gateway que ya sea accesible en una LAN o Tailnet de confianza, omite SSH por completo:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Esto escribe la configuración remota, marca la incorporación como completada y permite que la app controle
el transporte seleccionado cuando se inicia.

1. Abre _Settings → General_.
2. En **OpenClaw runs**, elige **Remote** y configura:
   - **Transport**: **SSH tunnel** o **Direct (ws/wss)**.
   - **SSH target**: `user@host` (`:port` opcional).
     - Si el Gateway está en la misma LAN y anuncia Bonjour, selecciónalo en la lista detectada para rellenar automáticamente este campo.
   - **Gateway URL** (solo directo): `wss://gateway.example.ts.net` (o `ws://...` para local/LAN).
   - **Identity file** (avanzado): ruta a tu clave.
   - **Project root** (avanzado): ruta del checkout remoto usada para comandos.
   - **CLI path** (avanzado): ruta opcional a un entrypoint/binario `openclaw` ejecutable (se rellena automáticamente cuando se anuncia).
3. Pulsa **Test remote**. El éxito indica que el `openclaw status --json` remoto se ejecuta correctamente. Los fallos suelen indicar problemas de PATH/CLI; el código de salida 127 significa que la CLI no se encuentra en remoto.
4. Las comprobaciones de estado y el Chat web ahora se ejecutarán automáticamente mediante el transporte seleccionado.

## Chat web

- **Túnel SSH**: El Chat web se conecta al Gateway por el puerto de control WebSocket reenviado (predeterminado 18789).
- **Directo (ws/wss)**: El Chat web se conecta directamente a la URL configurada del Gateway.
- Ya no hay un servidor HTTP de WebChat separado.

## Permisos

- El host remoto necesita las mismas aprobaciones de TCC que el local (Automatización, Accesibilidad, Grabación de pantalla, Micrófono, Reconocimiento de voz, Notificaciones). Ejecuta la incorporación en esa máquina para concederlas una vez.
- Los nodos anuncian su estado de permisos mediante `node.list` / `node.describe` para que los agentes sepan qué está disponible.

## Notas de seguridad

- Prefiere enlaces loopback en el host remoto y conéctate mediante SSH, Tailscale Serve o una URL directa de Tailnet/LAN de confianza.
- El túnel SSH requiere de forma predeterminada una clave de host ya confiable. Confía primero en la clave de host para que exista en el archivo known-hosts configurado, o elige explícitamente `gateway.remote.sshHostKeyPolicy: "openssh"` para un alias gestionado cuya política de confianza de OpenSSH aceptes.
- Si enlazas el Gateway a una interfaz que no sea loopback, exige autenticación válida del Gateway: token, contraseña o un proxy inverso consciente de identidad con `gateway.auth.mode: "trusted-proxy"`.
- Consulta [Seguridad](/es/gateway/security) y [Tailscale](/es/gateway/tailscale).

## Flujo de inicio de sesión de WhatsApp (remoto)

- Ejecuta `openclaw channels login --verbose` **en el host remoto**. Escanea el QR con WhatsApp en tu teléfono.
- Vuelve a ejecutar el inicio de sesión en ese host si la autenticación caduca. La comprobación de estado mostrará problemas de enlace.

## Solución de problemas

- **salida 127 / no encontrado**: `openclaw` no está en PATH para shells que no son de inicio de sesión. Añádelo a `/etc/paths`, a tu rc de shell, o crea un symlink en `/usr/local/bin`/`/opt/homebrew/bin`.
- **Falló la sonda de estado**: comprueba la accesibilidad SSH, PATH y que Baileys haya iniciado sesión (`openclaw status --json`).
- **Chat web bloqueado**: confirma que el Gateway se esté ejecutando en el host remoto y que el puerto reenviado coincida con el puerto WS del Gateway; la UI requiere una conexión WS saludable.
- **La IP del nodo muestra 127.0.0.1**: es lo esperado con el túnel SSH. Cambia **Transport** a **Direct (ws/wss)** si quieres que el Gateway vea la IP real del cliente.
- **El panel funciona pero las capacidades de Mac están sin conexión**: esto significa que la conexión de operador/control de la app está saludable, pero la conexión del nodo complementario no está conectada o le falta su superficie de comandos. Abre la sección de dispositivo de la barra de menús y comprueba si el Mac está `paired · disconnected`. Para endpoints de Tailscale Serve `wss://*.ts.net`, la app detecta pins TLS leaf heredados obsoletos tras la rotación de certificados, borra el pin obsoleto cuando macOS confía en el nuevo certificado y reintenta automáticamente. Si el certificado no es de confianza del sistema o el host no es un nombre de Tailscale Serve, establece `gateway.remote.tlsFingerprint` en la huella esperada del certificado, revisa el certificado o cambia a **Remote over SSH**.
- **Activación por voz**: las frases de activación se reenvían automáticamente en modo remoto; no se necesita un reenviador separado.

## Sonidos de notificación

Elige sonidos por notificación desde scripts con `openclaw` y `node.invoke`, por ejemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Ya no hay un interruptor global de "sonido predeterminado" en la app; los llamadores eligen un sonido (o ninguno) por solicitud.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [Acceso remoto](/es/gateway/remote)
