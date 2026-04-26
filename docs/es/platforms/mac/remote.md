---
read_when:
    - Setting up or debugging remote mac control
summary: Flujo de la app de macOS para controlar un Gateway remoto de OpenClaw mediante SSH
title: Control remoto
x-i18n:
    generated_at: "2026-04-26T11:33:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw remoto (macOS ⇄ host remoto)

Este flujo permite que la app de macOS actúe como un control remoto completo para un gateway de OpenClaw que se ejecuta en otro host (escritorio/servidor). Es la función **Remote over SSH** (ejecución remota) de la app. Todas las funciones —comprobaciones de salud, reenvío de Voice Wake y Web Chat— reutilizan la misma configuración remota de SSH desde _Settings → General_.

## Modos

- **Local (este Mac)**: Todo se ejecuta en el portátil. No interviene SSH.
- **Remote over SSH (predeterminado)**: Los comandos de OpenClaw se ejecutan en el host remoto. La app para Mac abre una conexión SSH con `-o BatchMode` más la identidad/clave que elijas y un reenvío de puerto local.
- **Remote direct (ws/wss)**: Sin túnel SSH. La app para Mac se conecta directamente a la URL del gateway (por ejemplo, mediante Tailscale Serve o un proxy inverso HTTPS público).

## Transportes remotos

El modo remoto admite dos transportes:

- **Túnel SSH** (predeterminado): Usa `ssh -N -L ...` para reenviar el puerto del gateway a localhost. El gateway verá la IP del Node como `127.0.0.1` porque el túnel es loopback.
- **Direct (ws/wss)**: Se conecta directamente a la URL del gateway. El gateway ve la IP real del cliente.

En el modo de túnel SSH, los nombres de host LAN/tailnet descubiertos se guardan como
`gateway.remote.sshTarget`. La app mantiene `gateway.remote.url` en el endpoint
del túnel local, por ejemplo `ws://127.0.0.1:18789`, para que la CLI, Web Chat y
el servicio local de host Node usen el mismo transporte loopback seguro.

La automatización del navegador en modo remoto es propiedad del host Node de la CLI, no del
Node nativo de la app de macOS. La app inicia el servicio de host Node instalado cuando
es posible; si necesitas control del navegador desde ese Mac, instálalo/inícialo con
`openclaw node install ...` y `openclaw node start` (o ejecuta
`openclaw node run ...` en primer plano), y luego apunta a ese
Node con capacidad de navegador.

## Requisitos previos en el host remoto

1. Instala Node + pnpm y compila/instala la CLI de OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Asegúrate de que `openclaw` esté en PATH para shells no interactivos (symlink en `/usr/local/bin` o `/opt/homebrew/bin` si hace falta).
3. Abre SSH con autenticación por clave. Recomendamos IP de **Tailscale** para una accesibilidad estable fuera de la LAN.

## Configuración de la app de macOS

1. Abre _Settings → General_.
2. En **OpenClaw runs**, elige **Remote over SSH** y configura:
   - **Transport**: **SSH tunnel** o **Direct (ws/wss)**.
   - **SSH target**: `user@host` (opcional `:port`).
     - Si el gateway está en la misma LAN y anuncia Bonjour, selecciónalo de la lista detectada para rellenar este campo automáticamente.
   - **Gateway URL** (solo Direct): `wss://gateway.example.ts.net` (o `ws://...` para local/LAN).
   - **Identity file** (avanzado): ruta a tu clave.
   - **Project root** (avanzado): ruta del checkout remoto usada para los comandos.
   - **CLI path** (avanzado): ruta opcional a un binario/punto de entrada `openclaw` ejecutable (se rellena automáticamente cuando se anuncia).
3. Pulsa **Test remote**. El éxito indica que `openclaw status --json` remoto se ejecuta correctamente. Los fallos suelen significar problemas de PATH/CLI; la salida 127 significa que la CLI no se encuentra en el host remoto.
4. Las comprobaciones de salud y Web Chat ahora se ejecutarán automáticamente a través de este túnel SSH.

## Web Chat

- **Túnel SSH**: Web Chat se conecta al gateway mediante el puerto de control WebSocket reenviado (predeterminado 18789).
- **Direct (ws/wss)**: Web Chat se conecta directamente a la URL configurada del gateway.
- Ya no hay un servidor HTTP separado de WebChat.

## Permisos

- El host remoto necesita las mismas aprobaciones TCC que el local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Ejecuta el onboarding en esa máquina para concederlas una vez.
- Los Node anuncian su estado de permisos mediante `node.list` / `node.describe` para que los agentes sepan qué hay disponible.

## Notas de seguridad

- Prefiere binds loopback en el host remoto y conéctate mediante SSH o Tailscale.
- El túnel SSH usa verificación estricta de clave de host; confía primero en la clave del host para que exista en `~/.ssh/known_hosts`.
- Si enlazas el Gateway a una interfaz no loopback, exige autenticación válida del Gateway: token, contraseña o un proxy inverso con reconocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`.
- Consulta [Seguridad](/es/gateway/security) y [Tailscale](/es/gateway/tailscale).

## Flujo de inicio de sesión de WhatsApp (remoto)

- Ejecuta `openclaw channels login --verbose` **en el host remoto**. Escanea el QR con WhatsApp en tu teléfono.
- Vuelve a ejecutar el inicio de sesión en ese host si la autenticación caduca. La comprobación de salud mostrará los problemas del vínculo.

## Solución de problemas

- **exit 127 / not found**: `openclaw` no está en PATH para shells que no inician sesión. Agrégalo a `/etc/paths`, al rc de tu shell, o crea un symlink en `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: comprueba la accesibilidad por SSH, PATH y que Baileys haya iniciado sesión (`openclaw status --json`).
- **Web Chat bloqueado**: confirma que el gateway esté en ejecución en el host remoto y que el puerto reenviado coincida con el puerto WS del gateway; la IU requiere una conexión WS saludable.
- **La IP del Node muestra 127.0.0.1**: es lo esperado con el túnel SSH. Cambia **Transport** a **Direct (ws/wss)** si quieres que el gateway vea la IP real del cliente.
- **Voice Wake**: las frases de activación se reenvían automáticamente en modo remoto; no hace falta un reenviador independiente.

## Sonidos de notificación

Elige sonidos por notificación desde scripts con `openclaw` y `node.invoke`, por ejemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Ya no hay un conmutador global de “sonido predeterminado” en la app; los llamadores eligen un sonido (o ninguno) por solicitud.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [Acceso remoto](/es/gateway/remote)
