---
read_when:
    - Quieres ejecutar Gateway en un servidor Linux o VPS en la nube
    - Necesitas un mapa rápido de las guías de alojamiento
    - Quieres un ajuste fino genérico de servidor Linux para OpenClaw
sidebarTitle: Linux Server
summary: 'Ejecuta OpenClaw en un servidor Linux o VPS en la nube: selector de proveedor, arquitectura y ajuste fino'
title: Servidor Linux
x-i18n:
    generated_at: "2026-04-24T05:56:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: ec71c7dcceedc20ecbeb3bdbbb7ea0047c1d1164e8049781171d3bdcac37cf95
    source_path: vps.md
    workflow: 15
---

Ejecuta Gateway de OpenClaw en cualquier servidor Linux o VPS en la nube. Esta página te ayuda a
elegir un proveedor, explica cómo funcionan los despliegues en la nube y cubre el ajuste fino genérico de Linux
que se aplica en todas partes.

## Elige un proveedor

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
  <Card title="Raspberry Pi" href="/es/install/raspberry-pi">ARM autoalojado</Card>
</CardGroup>

**AWS (EC2 / Lightsail / nivel gratuito)** también funciona bien.
Hay disponible un recorrido en video de la comunidad en
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(recurso de la comunidad; puede dejar de estar disponible).

## Cómo funcionan las configuraciones en la nube

- El **Gateway se ejecuta en el VPS** y es propietario del estado + espacio de trabajo.
- Te conectas desde tu portátil o teléfono mediante la **UI de Control** o **Tailscale/SSH**.
- Trata el VPS como la fuente de verdad y **haz copias de seguridad** del estado + espacio de trabajo con regularidad.
- Valor predeterminado seguro: mantén el Gateway en loopback y accede a él mediante túnel SSH o Tailscale Serve.
  Si haces bind a `lan` o `tailnet`, exige `gateway.auth.token` o `gateway.auth.password`.

Páginas relacionadas: [Acceso remoto de Gateway](/es/gateway/remote), [Hub de plataformas](/es/platforms).

## Agente compartido de empresa en un VPS

Ejecutar un único agente para un equipo es una configuración válida cuando todos los usuarios están dentro del mismo límite de confianza y el agente es solo para uso empresarial.

- Mantenlo en un runtime dedicado (VPS/VM/contenedor + usuario/cuentas dedicadas del SO).
- No inicies sesión en ese runtime con cuentas personales de Apple/Google ni con perfiles personales de navegador/gestor de contraseñas.
- Si los usuarios son adversarios entre sí, sepáralos por gateway/host/usuario del SO.

Detalles del modelo de seguridad: [Seguridad](/es/gateway/security).

## Usar Nodes con un VPS

Puedes mantener el Gateway en la nube y emparejar **Nodes** en tus dispositivos locales
(Mac/iOS/Android/sin interfaz). Los Nodes proporcionan pantalla/cámara/canvas locales y capacidades
de `system.run` mientras el Gateway permanece en la nube.

Documentación: [Nodes](/es/nodes), [CLI de Nodes](/es/cli/nodes).

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

- `NODE_COMPILE_CACHE` mejora los tiempos de inicio de comandos repetidos.
- `OPENCLAW_NO_RESPAWN=1` evita la sobrecarga adicional de inicio causada por una ruta de autorreinicio.
- La primera ejecución del comando calienta la caché; las ejecuciones posteriores son más rápidas.
- Para detalles específicos de Raspberry Pi, consulta [Raspberry Pi](/es/install/raspberry-pi).

### Lista de comprobación de ajuste fino de systemd (opcional)

Para hosts de VM que usan `systemd`, considera lo siguiente:

- Añade variables de entorno del servicio para una ruta de inicio estable:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Mantén explícito el comportamiento de reinicio:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Prefiere discos respaldados por SSD para las rutas de estado/caché para reducir las penalizaciones de arranque en frío por E/S aleatoria.

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

Si instalaste deliberadamente una unidad de sistema, edita
`openclaw-gateway.service` mediante `sudo systemctl edit openclaw-gateway.service`.

Cómo ayudan las políticas `Restart=` a la recuperación automatizada:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Para el comportamiento de OOM en Linux, la selección de procesos hijo como víctimas y los
diagnósticos de `exit 137`, consulta [Presión de memoria y OOM kills en Linux](/es/platforms/linux#memory-pressure-and-oom-kills).

## Relacionado

- [Resumen de instalación](/es/install)
- [DigitalOcean](/es/install/digitalocean)
- [Fly.io](/es/install/fly)
- [Hetzner](/es/install/hetzner)
