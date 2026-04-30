---
read_when:
    - Configurar o depurar el control remoto de Mac
summary: Flujo de la aplicación de macOS para controlar un Gateway remoto de OpenClaw mediante SSH
title: Control remoto
x-i18n:
    generated_at: "2026-04-30T16:28:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c63f752c3636a253220310c7c8e57a28549704b74b2f0370bac432bae28a7d3
    source_path: platforms/mac/remote.md
    workflow: 16
---

# OpenClaw remoto (macOS ⇄ host remoto)

Este flujo permite que la aplicación de macOS actúe como un control remoto completo para un Gateway de OpenClaw que se ejecuta en otro host (equipo de escritorio/servidor). Es la función **Remoto por SSH** (ejecución remota) de la aplicación. Todas las funciones —comprobaciones de estado, reenvío de Activación por voz y Chat web— reutilizan la misma configuración SSH remota de _Configuración → General_.

## Modos

- **Local (este Mac)**: Todo se ejecuta en el portátil. No interviene SSH.
- **Remoto por SSH (predeterminado)**: Los comandos de OpenClaw se ejecutan en el host remoto. La aplicación para Mac abre una conexión SSH con `-o BatchMode`, junto con la identidad/clave elegida y un reenvío de puerto local.
- **Remoto directo (ws/wss)**: Sin túnel SSH. La aplicación para Mac se conecta directamente a la URL del Gateway (por ejemplo, mediante Tailscale Serve o un proxy inverso HTTPS público).

## Transportes remotos

El modo remoto admite dos transportes:

- **Túnel SSH** (predeterminado): Usa `ssh -N -L ...` para reenviar el puerto del Gateway a localhost. El Gateway verá la IP del Node como `127.0.0.1` porque el túnel usa loopback.
- **Directo (ws/wss)**: Se conecta directamente a la URL del Gateway. El Gateway ve la IP real del cliente.

En el modo de túnel SSH, los nombres de host de LAN/tailnet descubiertos se guardan como
`gateway.remote.sshTarget`. La aplicación mantiene `gateway.remote.url` en el endpoint del túnel
local, por ejemplo `ws://127.0.0.1:18789`, de modo que la CLI, el Chat web y
el servicio local de host Node usen todos el mismo transporte seguro de loopback.

La automatización del navegador en modo remoto pertenece al host Node de la CLI, no al
Node nativo de la aplicación de macOS. La aplicación inicia el servicio de host Node instalado cuando
es posible; si necesitas control del navegador desde ese Mac, instálalo/inícialo con
`openclaw node install ...` y `openclaw node start` (o ejecuta
`openclaw node run ...` en primer plano) y luego apunta a ese
Node con capacidad de navegador.

## Requisitos previos en el host remoto

1. Instala Node + pnpm y compila/instala la CLI de OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Asegúrate de que `openclaw` esté en PATH para shells no interactivos (crea un symlink en `/usr/local/bin` u `/opt/homebrew/bin` si es necesario).
3. Abre SSH con autenticación por clave. Recomendamos IPs de **Tailscale** para una accesibilidad estable fuera de la LAN.

## Configuración de la aplicación de macOS

1. Abre _Configuración → General_.
2. En **OpenClaw se ejecuta**, elige **Remoto por SSH** y configura:
   - **Transporte**: **Túnel SSH** o **Directo (ws/wss)**.
   - **Destino SSH**: `user@host` (`:port` opcional).
     - Si el Gateway está en la misma LAN y anuncia Bonjour, selecciónalo en la lista descubierta para completar este campo automáticamente.
   - **URL del Gateway** (solo Directo): `wss://gateway.example.ts.net` (o `ws://...` para local/LAN).
   - **Archivo de identidad** (avanzado): ruta a tu clave.
   - **Raíz del proyecto** (avanzado): ruta del checkout remoto usada para comandos.
   - **Ruta de la CLI** (avanzado): ruta opcional a un entrypoint/binario `openclaw` ejecutable (se completa automáticamente cuando se anuncia).
3. Pulsa **Probar remoto**. El éxito indica que el `openclaw status --json` remoto se ejecuta correctamente. Los fallos suelen indicar problemas de PATH/CLI; el código de salida 127 significa que la CLI no se encuentra remotamente.
4. Las comprobaciones de estado y el Chat web ahora se ejecutarán automáticamente a través de este túnel SSH.

## Chat web

- **Túnel SSH**: El Chat web se conecta al Gateway mediante el puerto de control WebSocket reenviado (predeterminado 18789).
- **Directo (ws/wss)**: El Chat web se conecta directamente a la URL configurada del Gateway.
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
- Vuelve a ejecutar el inicio de sesión en ese host si la autenticación caduca. La comprobación de estado mostrará los problemas de enlace.

## Solución de problemas

- **salida 127 / no encontrado**: `openclaw` no está en PATH para shells que no son de login. Añádelo a `/etc/paths`, a tu rc de shell o crea un symlink en `/usr/local/bin`/`/opt/homebrew/bin`.
- **Falló la sonda de estado**: comprueba la accesibilidad SSH, PATH y que Baileys tenga la sesión iniciada (`openclaw status --json`).
- **Chat web bloqueado**: confirma que el Gateway se esté ejecutando en el host remoto y que el puerto reenviado coincida con el puerto WS del Gateway; la UI requiere una conexión WS saludable.
- **La IP del Node muestra 127.0.0.1**: es lo esperado con el túnel SSH. Cambia **Transporte** a **Directo (ws/wss)** si quieres que el Gateway vea la IP real del cliente.
- **El panel funciona pero las capacidades del Mac están desconectadas**: esto significa que la conexión de operador/control de la aplicación está saludable, pero la conexión del Node complementario no está conectada o le falta su superficie de comandos. Abre la sección de dispositivos de la barra de menús y comprueba si el Mac está `paired · disconnected`. Para endpoints de Tailscale Serve `wss://*.ts.net`, la aplicación detecta pines TLS hoja heredados obsoletos tras la rotación de certificados, borra el pin obsoleto cuando macOS confía en el nuevo certificado y reintenta automáticamente. Si el certificado no es de confianza para el sistema o el host no es un nombre de Tailscale Serve, revisa el certificado o cambia a **Remoto por SSH**.
- **Activación por voz**: las frases de activación se reenvían automáticamente en modo remoto; no se necesita un reenviador separado.

## Sonidos de notificación

Elige sonidos por notificación desde scripts con `openclaw` y `node.invoke`, por ejemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Ya no hay un interruptor global de “sonido predeterminado” en la aplicación; los llamadores eligen un sonido (o ninguno) por solicitud.

## Relacionado

- [Aplicación de macOS](/es/platforms/macos)
- [Acceso remoto](/es/gateway/remote)
