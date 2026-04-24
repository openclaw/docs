---
read_when:
    - Configurar o depurar el control remoto desde macOS
summary: Flujo de la app de macOS para controlar un Gateway remoto de OpenClaw mediante SSH
title: Control remoto
x-i18n:
    generated_at: "2026-04-24T05:38:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b436fe35db300f719cf3e72530e74914df6023509907d485670746c29656d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw remoto (macOS ⇄ host remoto)

Este flujo permite que la app de macOS actúe como un control remoto completo para un Gateway de OpenClaw ejecutándose en otro host (escritorio/servidor). Es la función **Remote over SSH** (ejecución remota) de la app. Todas las funciones—comprobaciones de estado de salud, reenvío de Voice Wake y Web Chat—reutilizan la misma configuración SSH remota de _Settings → General_.

## Modos

- **Local (este Mac)**: todo se ejecuta en el portátil. No interviene SSH.
- **Remote over SSH (predeterminado)**: los comandos de OpenClaw se ejecutan en el host remoto. La app de macOS abre una conexión SSH con `-o BatchMode` más tu identidad/clave elegida y un reenvío de puerto local.
- **Remote direct (ws/wss)**: sin túnel SSH. La app de macOS se conecta directamente a la URL del gateway (por ejemplo, mediante Tailscale Serve o un proxy inverso HTTPS público).

## Transportes remotos

El modo remoto admite dos transportes:

- **Túnel SSH** (predeterminado): usa `ssh -N -L ...` para reenviar el puerto del gateway a localhost. Gateway verá la IP del nodo como `127.0.0.1` porque el túnel es loopback.
- **Direct (ws/wss)**: se conecta directamente a la URL del gateway. Gateway ve la IP real del cliente.

## Requisitos previos en el host remoto

1. Instala Node + pnpm y compila/instala la CLI de OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Asegúrate de que `openclaw` esté en PATH para shells no interactivos (haz symlink en `/usr/local/bin` o `/opt/homebrew/bin` si es necesario).
3. Abre SSH con autenticación por clave. Recomendamos IPs de **Tailscale** para una accesibilidad estable fuera de la LAN.

## Configuración de la app de macOS

1. Abre _Settings → General_.
2. En **OpenClaw runs**, elige **Remote over SSH** y configura:
   - **Transport**: **SSH tunnel** o **Direct (ws/wss)**.
   - **SSH target**: `user@host` (`:port` opcional).
     - Si el gateway está en la misma LAN y anuncia Bonjour, elígelo de la lista descubierta para completar automáticamente este campo.
   - **Gateway URL** (solo Direct): `wss://gateway.example.ts.net` (o `ws://...` para local/LAN).
   - **Identity file** (avanzado): ruta a tu clave.
   - **Project root** (avanzado): ruta del checkout remoto usada para comandos.
   - **CLI path** (avanzado): ruta opcional a un entrypoint/binario ejecutable de `openclaw` (se completa automáticamente cuando se anuncia).
3. Pulsa **Test remote**. El éxito indica que `openclaw status --json` remoto se ejecuta correctamente. Los fallos suelen significar problemas de PATH/CLI; una salida 127 significa que la CLI no se encuentra remotamente.
4. Las comprobaciones de estado de salud y Web Chat ahora se ejecutarán automáticamente a través de este túnel SSH.

## Web Chat

- **Túnel SSH**: Web Chat se conecta al gateway mediante el puerto de control WebSocket reenviado (predeterminado 18789).
- **Direct (ws/wss)**: Web Chat se conecta directamente a la URL configurada del gateway.
- Ya no existe un servidor HTTP independiente de WebChat.

## Permisos

- El host remoto necesita las mismas aprobaciones TCC que el local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Ejecuta la incorporación en esa máquina para concederlas una sola vez.
- Los nodos anuncian su estado de permisos mediante `node.list` / `node.describe` para que los agentes sepan qué está disponible.

## Notas de seguridad

- Prefiere binds de loopback en el host remoto y conéctate mediante SSH o Tailscale.
- El túnel SSH usa comprobación estricta de clave de host; confía primero en la clave del host para que exista en `~/.ssh/known_hosts`.
- Si enlazas Gateway a una interfaz no loopback, exige autenticación válida de Gateway: token, contraseña o un proxy inverso con reconocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`.
- Consulta [Seguridad](/es/gateway/security) y [Tailscale](/es/gateway/tailscale).

## Flujo de inicio de sesión de WhatsApp (remoto)

- Ejecuta `openclaw channels login --verbose` **en el host remoto**. Escanea el QR con WhatsApp en tu teléfono.
- Vuelve a ejecutar el inicio de sesión en ese host si la autenticación caduca. La comprobación de estado de salud mostrará los problemas de vinculación.

## Solución de problemas

- **exit 127 / not found**: `openclaw` no está en PATH para shells no login. Agrégalo a `/etc/paths`, al rc de tu shell o haz symlink en `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: comprueba la accesibilidad SSH, PATH y que Baileys haya iniciado sesión (`openclaw status --json`).
- **Web Chat atascado**: confirma que Gateway se esté ejecutando en el host remoto y que el puerto reenviado coincida con el puerto WS del gateway; la UI requiere una conexión WS en buen estado.
- **La IP del nodo muestra 127.0.0.1**: es lo esperado con el túnel SSH. Cambia **Transport** a **Direct (ws/wss)** si quieres que Gateway vea la IP real del cliente.
- **Voice Wake**: las frases de activación se reenvían automáticamente en modo remoto; no hace falta un reenviador independiente.

## Sonidos de notificación

Elige sonidos por notificación desde scripts con `openclaw` y `node.invoke`, por ejemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Ya no hay una alternancia global de “sonido predeterminado” en la app; quien llama elige un sonido (o ninguno) por solicitud.

## Relacionado

- [App de macOS](/es/platforms/macos)
- [Acceso remoto](/es/gateway/remote)
