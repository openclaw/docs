---
read_when:
    - Configurar o depurar el control remoto de Mac
summary: Flujo de la aplicación macOS para controlar un Gateway remoto de OpenClaw mediante SSH
title: Control remoto
x-i18n:
    generated_at: "2026-05-06T05:42:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd7eb110f4c3e6a52b4b9baeccce4ef9d02c01104c188940c28f245bc161894a
    source_path: platforms/mac/remote.md
    workflow: 16
---

Este flujo permite que la app de macOS actúe como un control remoto completo para un Gateway de OpenClaw que se ejecuta en otro host (equipo de escritorio/servidor). Es la función **Remoto por SSH** (ejecución remota) de la app. Todas las funciones (comprobaciones de estado, reenvío de Voice Wake y Web Chat) reutilizan la misma configuración SSH remota de _Ajustes → General_.

## Modos

- **Local (este Mac)**: Todo se ejecuta en el portátil. No interviene SSH.
- **Remoto por SSH (predeterminado)**: Los comandos de OpenClaw se ejecutan en el host remoto. La app de Mac abre una conexión SSH con `-o BatchMode`, además de la identidad/clave elegida y un reenvío de puerto local.
- **Directo remoto (ws/wss)**: Sin túnel SSH. La app de Mac se conecta directamente a la URL del Gateway (por ejemplo, mediante Tailscale Serve o un proxy inverso HTTPS público).

## Transportes remotos

El modo remoto admite dos transportes:

- **Túnel SSH** (predeterminado): Usa `ssh -N -L ...` para reenviar el puerto del Gateway a localhost. El Gateway verá la IP del Node como `127.0.0.1` porque el túnel es loopback.
- **Directo (ws/wss)**: Se conecta directamente a la URL del Gateway. El Gateway ve la IP real del cliente.

En el modo de túnel SSH, los nombres de host LAN/tailnet descubiertos se guardan como
`gateway.remote.sshTarget`. La app mantiene `gateway.remote.url` en el endpoint del túnel
local, por ejemplo `ws://127.0.0.1:18789`, para que la CLI, Web Chat y
el servicio de host Node local usen todos el mismo transporte local loopback seguro.

La automatización del navegador en modo remoto pertenece al host Node de la CLI, no al
Node nativo de la app de macOS. La app inicia el servicio de host Node instalado cuando
es posible; si necesitas control del navegador desde ese Mac, instálalo/inícialo con
`openclaw node install ...` y `openclaw node start` (o ejecuta
`openclaw node run ...` en primer plano), y luego apunta a ese Node con capacidad de navegador.

## Requisitos previos en el host remoto

1. Instala Node + pnpm y compila/instala la CLI de OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Asegúrate de que `openclaw` esté en PATH para shells no interactivos (crea un symlink en `/usr/local/bin` o `/opt/homebrew/bin` si hace falta).
3. Abre SSH con autenticación por clave. Recomendamos IPs de **Tailscale** para una conectividad estable fuera de la LAN.

## Configuración de la app de macOS

1. Abre _Ajustes → General_.
2. En **OpenClaw se ejecuta**, elige **Remoto por SSH** y configura:
   - **Transporte**: **Túnel SSH** o **Directo (ws/wss)**.
   - **Destino SSH**: `user@host` (`:port` opcional).
     - Si el Gateway está en la misma LAN y anuncia Bonjour, selecciónalo en la lista descubierta para autocompletar este campo.
   - **URL del Gateway** (solo Directo): `wss://gateway.example.ts.net` (o `ws://...` para local/LAN).
   - **Archivo de identidad** (avanzado): ruta a tu clave.
   - **Raíz del proyecto** (avanzado): ruta del checkout remoto usada para comandos.
   - **Ruta de la CLI** (avanzado): ruta opcional a un entrypoint/binario `openclaw` ejecutable (se autocompleta cuando se anuncia).
3. Pulsa **Probar remoto**. Un resultado correcto indica que el `openclaw status --json` remoto se ejecuta correctamente. Los fallos normalmente significan problemas de PATH/CLI; la salida 127 significa que la CLI no se encuentra de forma remota.
4. Las comprobaciones de estado y Web Chat ahora se ejecutarán automáticamente a través de este túnel SSH.

## Web Chat

- **Túnel SSH**: Web Chat se conecta al Gateway por el puerto de control WebSocket reenviado (18789 de forma predeterminada).
- **Directo (ws/wss)**: Web Chat se conecta directamente a la URL del Gateway configurada.
- Ya no hay un servidor HTTP de WebChat separado.

## Permisos

- El host remoto necesita las mismas aprobaciones TCC que en local (Automatización, Accesibilidad, Grabación de pantalla, Micrófono, Reconocimiento de voz, Notificaciones). Ejecuta el onboarding en esa máquina para concederlas una vez.
- Los Nodes anuncian su estado de permisos mediante `node.list` / `node.describe` para que los agentes sepan qué está disponible.

## Notas de seguridad

- Prefiere enlaces loopback en el host remoto y conéctate mediante SSH o Tailscale.
- El túnel SSH usa comprobación estricta de claves de host; confía primero en la clave del host para que exista en `~/.ssh/known_hosts`.
- Si enlazas el Gateway a una interfaz que no sea loopback, exige autenticación válida del Gateway: token, contraseña o un proxy inverso con identidad y `gateway.auth.mode: "trusted-proxy"`.
- Consulta [Seguridad](/es/gateway/security) y [Tailscale](/es/gateway/tailscale).

## Flujo de inicio de sesión de WhatsApp (remoto)

- Ejecuta `openclaw channels login --verbose` **en el host remoto**. Escanea el QR con WhatsApp en tu teléfono.
- Vuelve a ejecutar el inicio de sesión en ese host si la autenticación caduca. La comprobación de estado mostrará problemas de enlace.

## Solución de problemas

- **salida 127 / no encontrado**: `openclaw` no está en PATH para shells sin login. Añádelo a `/etc/paths`, al rc de tu shell o crea un symlink en `/usr/local/bin`/`/opt/homebrew/bin`.
- **Falló la sonda de estado**: comprueba la conectividad SSH, PATH y que Baileys tenga la sesión iniciada (`openclaw status --json`).
- **Web Chat bloqueado**: confirma que el Gateway se esté ejecutando en el host remoto y que el puerto reenviado coincida con el puerto WS del Gateway; la UI requiere una conexión WS sana.
- **La IP del Node muestra 127.0.0.1**: es lo esperado con el túnel SSH. Cambia **Transporte** a **Directo (ws/wss)** si quieres que el Gateway vea la IP real del cliente.
- **El panel funciona, pero las capacidades del Mac están sin conexión**: esto significa que la conexión de operador/control de la app está sana, pero la conexión del Node complementario no está conectada o le falta su superficie de comandos. Abre la sección de dispositivo de la barra de menús y comprueba si el Mac está `paired · disconnected`. Para endpoints `wss://*.ts.net` de Tailscale Serve, la app detecta pines TLS heredados obsoletos tras la rotación de certificados, borra el pin obsoleto cuando macOS confía en el nuevo certificado y reintenta automáticamente. Si el certificado no es de confianza del sistema o el host no es un nombre de Tailscale Serve, revisa el certificado o cambia a **Remoto por SSH**.
- **Voice Wake**: las frases de activación se reenvían automáticamente en modo remoto; no hace falta un reenviador separado.

## Sonidos de notificación

Elige sonidos por notificación desde scripts con `openclaw` y `node.invoke`, por ejemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Ya no hay un conmutador global de "sonido predeterminado" en la app; los llamadores eligen un sonido (o ninguno) por solicitud.

## Relacionado

- [app de macOS](/es/platforms/macos)
- [Acceso remoto](/es/gateway/remote)
