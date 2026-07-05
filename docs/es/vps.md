---
read_when:
    - Quieres ejecutar el Gateway en un servidor Linux o VPS en la nube
    - Necesitas un mapa rápido de las guías de alojamiento
    - Quieres ajustes genéricos de servidor Linux para OpenClaw
sidebarTitle: Linux Server
summary: 'Ejecutar OpenClaw en un servidor Linux o VPS en la nube: selector de proveedor, arquitectura y ajuste'
title: Servidor Linux
x-i18n:
    generated_at: "2026-07-05T11:46:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 634a246850ab8b854c2c799688fd368ebed3a02124baa85bf38d5ff6ef8cec64
    source_path: vps.md
    workflow: 16
---

Ejecuta el Gateway de OpenClaw en cualquier servidor Linux o VPS en la nube. Esta página te ayuda a
elegir un proveedor, explica cómo funcionan los despliegues en la nube y cubre el ajuste genérico de Linux
que se aplica en todas partes.

## Elige un proveedor

<CardGroup cols={2}>
  <Card title="Azure" href="/es/install/azure">VM Linux</Card>
  <Card title="DigitalOcean" href="/es/install/digitalocean">VPS de pago simple</Card>
  <Card title="exe.dev" href="/es/install/exe-dev">VM con proxy HTTPS</Card>
  <Card title="Fly.io" href="/es/install/fly">Fly Machines</Card>
  <Card title="GCP" href="/es/install/gcp">Compute Engine</Card>
  <Card title="Hetzner" href="/es/install/hetzner">Docker en VPS de Hetzner</Card>
  <Card title="Hostinger" href="/es/install/hostinger">VPS con configuración en un clic</Card>
  <Card title="Northflank" href="/es/install/northflank">Configuración en un clic, desde el navegador</Card>
  <Card title="Oracle Cloud" href="/es/install/oracle">Nivel ARM Always Free</Card>
  <Card title="Railway" href="/es/install/railway">Configuración en un clic, desde el navegador</Card>
  <Card title="Raspberry Pi" href="/es/install/raspberry-pi">ARM autohospedado</Card>
</CardGroup>

**AWS (EC2 / Lightsail / nivel gratuito)** también funciona bien.
Hay disponible un video tutorial de la comunidad en
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(recurso de la comunidad; puede dejar de estar disponible).

## Cómo funcionan las configuraciones en la nube

- El **Gateway se ejecuta en el VPS** y posee el estado + el espacio de trabajo.
- Te conectas desde tu portátil o teléfono mediante la **Control UI** o **Tailscale/SSH**.
- Trata el VPS como la fuente de verdad y **haz copias de seguridad** del estado + el espacio de trabajo con regularidad.
- Valor predeterminado seguro: mantén el Gateway en loopback y accede a él mediante un túnel SSH o Tailscale Serve.
  Si lo enlazas a `lan` o `tailnet`, el Gateway requiere un secreto compartido
  (`gateway.auth.token` o `gateway.auth.password`) a menos que la autenticación se delegue en un
  proxy de confianza.

Páginas relacionadas: [acceso remoto al Gateway](/es/gateway/remote), [centro de plataformas](/es/platforms).

## Refuerza primero el acceso de administración

Antes de instalar OpenClaw en un VPS público, decide cómo quieres administrar
la propia máquina.

- Para acceso de administración solo por Tailnet: instala Tailscale primero, une el VPS a tu
  tailnet, verifica una segunda sesión SSH sobre la IP de Tailscale o el nombre MagicDNS,
  y luego restringe el SSH público.
- Sin Tailscale: aplica el refuerzo equivalente para tu ruta SSH antes de
  exponer más servicios.
- Esto está separado del acceso al Gateway. Aún puedes mantener OpenClaw enlazado a
  loopback y usar un túnel SSH o Tailscale Serve para el panel.

Las opciones específicas de Tailscale para el Gateway están en [Tailscale](/es/gateway/tailscale).

## Agente compartido de empresa en un VPS

Ejecutar un único agente para un equipo es una configuración válida cuando todos los usuarios están en el
mismo límite de confianza y el agente es solo para uso empresarial.

- Mantenlo en un runtime dedicado (VPS/VM/contenedor + usuario/cuentas de SO dedicados).
- No inicies sesión en ese runtime con cuentas personales de Apple/Google ni con perfiles personales de navegador/gestor de contraseñas.
- Si los usuarios son adversarios entre sí, sepáralos por Gateway/host/usuario de SO.

Detalles del modelo de seguridad: [Seguridad](/es/gateway/security).

## Uso de nodos con un VPS

Puedes mantener el Gateway en la nube y emparejar **nodos** en tus dispositivos locales
(Mac/iOS/Android/sin interfaz). Los nodos proporcionan capacidades locales de pantalla/cámara/lienzo y `system.run`
mientras el Gateway permanece en la nube.

Docs: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes).

## Ajuste de inicio para VM pequeñas y hosts ARM

Si los comandos de CLI se sienten lentos en VM de baja potencia (o hosts ARM), habilita la caché de compilación de módulos de Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` mejora los tiempos de inicio de comandos repetidos; la primera ejecución calienta la caché.
- `OPENCLAW_NO_RESPAWN=1` mantiene los reinicios rutinarios del Gateway dentro del proceso, lo que evita traspasos adicionales entre procesos y mantiene simple el seguimiento del PID en hosts pequeños.
- Para detalles específicos de Raspberry Pi, consulta [Raspberry Pi](/es/install/raspberry-pi).

### Lista de comprobación de ajuste de systemd (opcional)

Para hosts de VM que usan `systemd`, considera:

- Entorno del servicio para una ruta de inicio estable: `OPENCLAW_NO_RESPAWN=1` y
  `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Comportamiento de reinicio explícito: `Restart=always`, `RestartSec=2`, `TimeoutStartSec=90`
- Discos con respaldo SSD para rutas de estado/caché para reducir las penalizaciones de arranque en frío por E/S aleatoria.

La ruta estándar `openclaw onboard --install-daemon` instala una unidad de usuario de systemd;
edítala con:

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

Si instalaste deliberadamente una unidad de sistema en su lugar, edítala mediante
`sudo systemctl edit openclaw-gateway.service`.

Cómo ayudan las políticas `Restart=` a la recuperación automatizada:
[systemd puede automatizar la recuperación de servicios](https://www.redhat.com/en/blog/systemd-automate-recovery).

Para el comportamiento OOM de Linux, la selección de víctimas de procesos secundarios y los diagnósticos de `exit 137`,
consulta [presión de memoria de Linux y terminaciones OOM](/es/platforms/linux#memory-pressure-and-oom-kills).

## Relacionado

- [Resumen de instalación](/es/install)
- [DigitalOcean](/es/install/digitalocean)
- [Fly.io](/es/install/fly)
- [Hetzner](/es/install/hetzner)
