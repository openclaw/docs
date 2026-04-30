---
read_when:
    - Quieres ejecutar el Gateway en un servidor Linux o un VPS en la nube
    - Necesitas un mapa rápido de las guías de alojamiento
    - Desea ajustes genéricos para servidores Linux para OpenClaw
sidebarTitle: Linux Server
summary: Ejecuta OpenClaw en un servidor Linux o un VPS en la nube — selector de proveedor, arquitectura y optimización
title: Servidor Linux
x-i18n:
    generated_at: "2026-04-30T06:07:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e8535af0b6d14123acd46436c2e942008cdb8485ae680fb42e9b175723b2232
    source_path: vps.md
    workflow: 16
---

Ejecuta el Gateway de OpenClaw en cualquier servidor Linux o VPS en la nube. Esta página te ayuda a
elegir un proveedor, explica cómo funcionan los despliegues en la nube y cubre el ajuste genérico de Linux
que se aplica en todas partes.

## Elegir un proveedor

<CardGroup cols={2}>
  <Card title="Railway" href="/es/install/railway">Configuración en el navegador con un clic</Card>
  <Card title="Northflank" href="/es/install/northflank">Configuración en el navegador con un clic</Card>
  <Card title="DigitalOcean" href="/es/install/digitalocean">VPS de pago sencillo</Card>
  <Card title="Oracle Cloud" href="/es/install/oracle">Nivel ARM Always Free</Card>
  <Card title="Fly.io" href="/es/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/es/install/hetzner">Docker en VPS de Hetzner</Card>
  <Card title="Hostinger" href="/es/install/hostinger">VPS con configuración de un clic</Card>
  <Card title="GCP" href="/es/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/es/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/es/install/exe-dev">VM con proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/es/install/raspberry-pi">Autohospedado en ARM</Card>
</CardGroup>

**AWS (EC2 / Lightsail / nivel gratuito)** también funciona bien.
Hay disponible un tutorial en video de la comunidad en
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(recurso de la comunidad -- puede dejar de estar disponible).

## Cómo funcionan las configuraciones en la nube

- El **Gateway se ejecuta en el VPS** y es propietario del estado + el espacio de trabajo.
- Te conectas desde tu portátil o teléfono mediante la **IU de control** o **Tailscale/SSH**.
- Trata el VPS como la fuente de verdad y **haz copias de seguridad** del estado + el espacio de trabajo con regularidad.
- Opción predeterminada segura: mantén el Gateway en loopback y accede a él mediante un túnel SSH o Tailscale Serve.
  Si enlazas a `lan` o `tailnet`, exige `gateway.auth.token` o `gateway.auth.password`.

Páginas relacionadas: [Acceso remoto al Gateway](/es/gateway/remote), [Centro de plataformas](/es/platforms).

## Refuerza primero el acceso de administración

Antes de instalar OpenClaw en un VPS público, decide cómo quieres administrar
la propia máquina.

- Si quieres acceso de administración solo por tailnet, instala Tailscale primero, une el VPS
  a tu tailnet, verifica una segunda sesión SSH por la IP de Tailscale o
  el nombre de MagicDNS, y luego restringe el SSH público.
- Si no usas Tailscale, aplica el refuerzo equivalente para tu ruta SSH
  antes de exponer más servicios.
- Esto es independiente del acceso al Gateway. Aun así puedes mantener OpenClaw enlazado a
  loopback y usar un túnel SSH o Tailscale Serve para el panel.

Las opciones del Gateway específicas de Tailscale están en [Tailscale](/es/gateway/tailscale).

## Agente compartido de empresa en un VPS

Ejecutar un único agente para un equipo es una configuración válida cuando todos los usuarios están en el mismo límite de confianza y el agente es solo para uso empresarial.

- Manténlo en un entorno de ejecución dedicado (VPS/VM/contenedor + usuario/cuentas del SO dedicados).
- No inicies sesión en ese entorno de ejecución con cuentas personales de Apple/Google ni con perfiles personales de navegador/gestor de contraseñas.
- Si los usuarios son adversarios entre sí, sepáralos por gateway/host/usuario del SO.

Detalles del modelo de seguridad: [Seguridad](/es/gateway/security).

## Usar nodos con un VPS

Puedes mantener el Gateway en la nube y emparejar **nodos** en tus dispositivos locales
(Mac/iOS/Android/sin interfaz). Los nodos proporcionan pantalla/cámara/lienzo locales y capacidades de `system.run`
mientras el Gateway permanece en la nube.

Documentación: [Nodos](/es/nodes), [CLI de nodos](/es/cli/nodes).

## Ajuste de inicio para VM pequeñas y hosts ARM

Si los comandos de la CLI se sienten lentos en VM de baja potencia (o hosts ARM), habilita la caché de compilación de módulos de Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` mejora los tiempos de inicio de comandos repetidos.
- `OPENCLAW_NO_RESPAWN=1` evita una sobrecarga adicional de inicio desde una ruta de autorrespawn.
- La primera ejecución de un comando calienta la caché; las ejecuciones posteriores son más rápidas.
- Para detalles específicos de Raspberry Pi, consulta [Raspberry Pi](/es/install/raspberry-pi).

### Lista de comprobación de ajuste de systemd (opcional)

Para hosts de VM que usan `systemd`, considera:

- Añadir variables de entorno de servicio para una ruta de inicio estable:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Mantener explícito el comportamiento de reinicio:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferir discos respaldados por SSD para las rutas de estado/caché a fin de reducir las penalizaciones de arranque en frío por E/S aleatoria.

Para la ruta estándar `openclaw onboard --install-daemon`, edita la unidad de usuario:

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

Si instalaste deliberadamente una unidad de sistema en su lugar, edita
`openclaw-gateway.service` mediante `sudo systemctl edit openclaw-gateway.service`.

Cómo ayudan las políticas `Restart=` con la recuperación automatizada:
[systemd puede automatizar la recuperación de servicios](https://www.redhat.com/en/blog/systemd-automate-recovery).

Para el comportamiento de OOM en Linux, la selección de víctimas de procesos secundarios y los diagnósticos de `exit 137`,
consulta [Presión de memoria en Linux y terminaciones por OOM](/es/platforms/linux#memory-pressure-and-oom-kills).

## Relacionado

- [Resumen de instalación](/es/install)
- [DigitalOcean](/es/install/digitalocean)
- [Fly.io](/es/install/fly)
- [Hetzner](/es/install/hetzner)
