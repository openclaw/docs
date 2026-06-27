---
read_when:
    - Configurar o depurar el control remoto de Mac
summary: flujo de la app de macOS para controlar un Gateway remoto de OpenClaw
title: Control remoto
x-i18n:
    generated_at: "2026-06-27T12:03:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

Este flujo permite que la app de macOS actúe como un control remoto completo para un Gateway de OpenClaw que se ejecuta en otro host (escritorio/servidor). La app puede conectarse directamente a URL de Gateway confiables de LAN/Tailnet o administrar un túnel SSH cuando el Gateway remoto solo está disponible por loopback. Las comprobaciones de estado, el reenvío de Activación por voz y el Chat web reutilizan la misma configuración remota desde _Configuración → General_.

## Modos

- **Local (este Mac)**: Todo se ejecuta en el portátil. No interviene SSH.
- **Remoto por SSH (predeterminado)**: Los comandos de OpenClaw se ejecutan en el host remoto. La app para Mac abre una conexión SSH con `-o BatchMode` más la identidad/clave elegida y un reenvío de puerto local.
- **Remoto directo (ws/wss)**: Sin túnel SSH. La app para Mac se conecta directamente a la URL del Gateway (por ejemplo, mediante LAN, Tailscale, Tailscale Serve o un proxy inverso HTTPS público).

## Transportes remotos

El modo remoto admite dos transportes:

- **Túnel SSH** (predeterminado): Usa `ssh -N -L ...` para reenviar el puerto del Gateway a localhost. El Gateway verá la IP del Node como `127.0.0.1` porque el túnel es loopback.
- **Directo (ws/wss)**: Se conecta directamente a la URL del Gateway. El Gateway ve la IP real del cliente.

En el modo de túnel SSH, los nombres de host de LAN/tailnet detectados se guardan como
`gateway.remote.sshTarget`. La app mantiene `gateway.remote.url` en el endpoint del túnel
local, por ejemplo `ws://127.0.0.1:18789`, de modo que la CLI, el Chat web y
el servicio local de host de Node usen todos el mismo transporte loopback seguro.
Si el puerto del túnel local difiere del puerto del Gateway remoto, establece
`gateway.remote.remotePort` en el puerto del host remoto.

La automatización del navegador en modo remoto pertenece al host de Node de la CLI, no al
Node nativo de la app de macOS. La app inicia el servicio de host de Node instalado cuando
es posible; si necesitas controlar el navegador desde ese Mac, instálalo/inícialo con
`openclaw node install ...` y `openclaw node start` (o ejecuta
`openclaw node run ...` en primer plano), y luego apunta a ese Node con capacidad de navegador.

## Requisitos previos en el host remoto

1. Instala Node + pnpm y compila/instala la CLI de OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Asegúrate de que `openclaw` esté en PATH para shells no interactivas (crea un symlink en `/usr/local/bin` o `/opt/homebrew/bin` si es necesario).
3. Solo para transporte SSH: habilita SSH con autenticación por clave. Recomendamos IP de **Tailscale** para tener alcance estable fuera de la LAN.

## Configuración de la app de macOS

Para preconfigurar la app sin el flujo de bienvenida:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Para un Gateway ya alcanzable en una LAN o Tailnet confiable, omite SSH por completo:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Esto escribe la configuración remota, marca el onboarding como completo y permite que la app controle
el transporte seleccionado cuando se inicia.

1. Abre _Configuración → General_.
2. En **OpenClaw se ejecuta**, elige **Remoto** y configura:
   - **Transporte**: **Túnel SSH** o **Directo (ws/wss)**.
   - **Destino SSH**: `user@host` (`:port` opcional).
     - Si el Gateway está en la misma LAN y anuncia Bonjour, selecciónalo en la lista detectada para autocompletar este campo.
   - **URL del Gateway** (solo directo): `wss://gateway.example.ts.net` (o `ws://...` para local/LAN).
   - **Archivo de identidad** (avanzado): ruta a tu clave.
   - **Raíz del proyecto** (avanzado): ruta del checkout remoto usada para comandos.
   - **Ruta de CLI** (avanzado): ruta opcional a un punto de entrada/binario `openclaw` ejecutable (se autocompleta cuando se anuncia).
3. Pulsa **Probar remoto**. El éxito indica que el `openclaw status --json` remoto se ejecuta correctamente. Los fallos suelen significar problemas de PATH/CLI; la salida 127 significa que la CLI no se encuentra remotamente.
4. Las comprobaciones de estado y el Chat web ahora se ejecutarán automáticamente a través del transporte seleccionado.

## Chat web

- **Túnel SSH**: El Chat web se conecta al Gateway por el puerto de control WebSocket reenviado (18789 de forma predeterminada).
- **Directo (ws/wss)**: El Chat web se conecta directamente a la URL del Gateway configurada.
- Ya no hay un servidor HTTP de WebChat separado.

## Permisos

- El host remoto necesita las mismas aprobaciones de TCC que en local (Automatización, Accesibilidad, Grabación de pantalla, Micrófono, Reconocimiento de voz, Notificaciones). Ejecuta el onboarding en esa máquina para concederlas una vez.
- Los Nodes anuncian su estado de permisos mediante `node.list` / `node.describe` para que los agentes sepan qué está disponible.

## Notas de seguridad

- Prefiere enlaces loopback en el host remoto y conéctate mediante SSH, Tailscale Serve o una URL directa confiable de Tailnet/LAN.
- El túnel SSH usa comprobación estricta de clave de host; confía primero en la clave del host para que exista en `~/.ssh/known_hosts`.
- Si enlazas el Gateway a una interfaz que no sea loopback, exige autenticación válida del Gateway: token, contraseña o un proxy inverso con identidad con `gateway.auth.mode: "trusted-proxy"`.
- Consulta [Seguridad](/es/gateway/security) y [Tailscale](/es/gateway/tailscale).

## Flujo de inicio de sesión de WhatsApp (remoto)

- Ejecuta `openclaw channels login --verbose` **en el host remoto**. Escanea el QR con WhatsApp en tu teléfono.
- Vuelve a ejecutar el inicio de sesión en ese host si la autenticación caduca. La comprobación de estado mostrará problemas de enlace.

## Solución de problemas

- **salida 127 / no encontrado**: `openclaw` no está en PATH para shells sin inicio de sesión. Añádelo a `/etc/paths`, al rc de tu shell, o crea un symlink en `/usr/local/bin`/`/opt/homebrew/bin`.
- **Falló la sonda de estado**: comprueba la accesibilidad SSH, PATH y que Baileys tenga sesión iniciada (`openclaw status --json`).
- **Chat web bloqueado**: confirma que el Gateway se está ejecutando en el host remoto y que el puerto reenviado coincide con el puerto WS del Gateway; la UI requiere una conexión WS sana.
- **La IP del Node muestra 127.0.0.1**: esperado con el túnel SSH. Cambia **Transporte** a **Directo (ws/wss)** si quieres que el Gateway vea la IP real del cliente.
- **El panel funciona, pero las capacidades del Mac están sin conexión**: esto significa que la conexión de operador/control de la app está sana, pero la conexión del Node complementario no está conectada o le falta su superficie de comandos. Abre la sección de dispositivo de la barra de menús y comprueba si el Mac está `paired · disconnected`. Para endpoints de Tailscale Serve `wss://*.ts.net`, la app detecta pins TLS de hoja heredados obsoletos tras la rotación de certificados, borra el pin obsoleto cuando macOS confía en el nuevo certificado y reintenta automáticamente. Si el certificado no es de confianza del sistema o el host no es un nombre de Tailscale Serve, establece `gateway.remote.tlsFingerprint` en la huella esperada del certificado, revisa el certificado o cambia a **Remoto por SSH**.
- **Activación por voz**: las frases de activación se reenvían automáticamente en modo remoto; no se necesita un reenviador separado.

## Sonidos de notificación

Elige sonidos por notificación desde scripts con `openclaw` y `node.invoke`, por ejemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Ya no hay un interruptor global de "sonido predeterminado" en la app; los llamadores eligen un sonido (o ninguno) por solicitud.

## Relacionado

- [App de macOS](/es/platforms/macos)
- [Acceso remoto](/es/gateway/remote)
