---
read_when:
    - Quiere ejecutar el Gateway en un servidor Linux o VPS en la nube
    - Necesita un mapa rápido de las guías de alojamiento
    - Quiere ajuste fino genérico de OpenClaw para servidores Linux
sidebarTitle: Linux Server
summary: 'Ejecutar OpenClaw en un servidor Linux o VPS en la nube: selector de proveedor, arquitectura y ajuste fino'
title: Servidor Linux
x-i18n:
    generated_at: "2026-04-23T05:21:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 759428cf20204207a5505a73c880aa776ddd0eabf969fc0dcf444fc8ce6991b2
    source_path: vps.md
    workflow: 15
---

# Servidor Linux

Ejecute el Gateway de OpenClaw en cualquier servidor Linux o VPS en la nube. Esta página le ayuda a
elegir un proveedor, explica cómo funcionan las implementaciones en la nube y cubre el ajuste fino genérico de Linux
que se aplica en todas partes.

## Elegir un proveedor

<CardGroup cols={2}>
  <Card title="Railway" href="/es/install/railway">Configuración en el navegador con un clic</Card>
  <Card title="Northflank" href="/es/install/northflank">Configuración en el navegador con un clic</Card>
  <Card title="DigitalOcean" href="/es/install/digitalocean">VPS de pago sencillo</Card>
  <Card title="Oracle Cloud" href="/es/install/oracle">Nivel ARM Always Free</Card>
  <Card title="Fly.io" href="/es/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/es/install/hetzner">Docker en VPS de Hetzner</Card>
  <Card title="Hostinger" href="/es/install/hostinger">VPS con configuración en un clic</Card>
  <Card title="GCP" href="/es/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/es/install/azure">VM Linux</Card>
  <Card title="exe.dev" href="/es/install/exe-dev">VM con proxy HTTPS</Card>
  <Card title="Raspberry Pi" href="/es/install/raspberry-pi">ARM autohospedado</Card>
</CardGroup>

**AWS (EC2 / Lightsail / nivel gratuito)** también funciona bien.
Hay un video de la comunidad con una guía paso a paso disponible en
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
(recurso de la comunidad; puede dejar de estar disponible).

## Cómo funcionan las configuraciones en la nube

- El **Gateway se ejecuta en el VPS** y controla el estado + espacio de trabajo.
- Se conecta desde su portátil o teléfono mediante la **Control UI** o **Tailscale/SSH**.
- Trate el VPS como la fuente de verdad y haga **copias de seguridad** del estado + espacio de trabajo con regularidad.
- Valor predeterminado seguro: mantenga el Gateway en loopback y acceda a él mediante túnel SSH o Tailscale Serve.
  Si enlaza a `lan` o `tailnet`, exija `gateway.auth.token` o `gateway.auth.password`.

Páginas relacionadas: [Acceso remoto al Gateway](/es/gateway/remote), [Centro de plataformas](/es/platforms).

## Agente compartido de empresa en un VPS

Ejecutar un solo agente para un equipo es una configuración válida cuando todos los usuarios están dentro del mismo límite de confianza y el agente es solo para uso empresarial.

- Manténgalo en un tiempo de ejecución dedicado (VPS/VM/contenedor + usuario/cuentas dedicados del sistema operativo).
- No inicie sesión en ese tiempo de ejecución con cuentas personales de Apple/Google ni con perfiles personales de navegador/gestor de contraseñas.
- Si los usuarios son adversarios entre sí, divida por Gateway/host/usuario del sistema operativo.

Detalles del modelo de seguridad: [Seguridad](/es/gateway/security).

## Uso de nodes con un VPS

Puede mantener el Gateway en la nube y emparejar **nodes** en sus dispositivos locales
(Mac/iOS/Android/sin interfaz). Los Nodes proporcionan capacidades locales de pantalla/cámara/canvas y `system.run`
mientras el Gateway permanece en la nube.

Documentación: [Nodes](/es/nodes), [CLI de Nodes](/cli/nodes).

## Ajuste fino del inicio para VM pequeñas y hosts ARM

Si los comandos de la CLI se sienten lentos en VM de baja potencia (o hosts ARM), habilite la caché de compilación de módulos de Node:

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` mejora los tiempos de inicio de comandos repetidos.
- `OPENCLAW_NO_RESPAWN=1` evita sobrecarga adicional de inicio por una ruta de autoreinicio.
- La primera ejecución del comando calienta la caché; las siguientes ejecuciones son más rápidas.
- Para detalles específicos de Raspberry Pi, consulte [Raspberry Pi](/es/install/raspberry-pi).

### Lista de comprobación de ajuste fino de systemd (opcional)

Para hosts VM que usan `systemd`, considere:

- Agregar variables de entorno al servicio para una ruta de inicio estable:
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- Mantener explícito el comportamiento de reinicio:
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- Preferir discos respaldados por SSD para rutas de estado/caché a fin de reducir las penalizaciones de inicio en frío por E/S aleatoria.

Para la ruta estándar `openclaw onboard --install-daemon`, edite la unidad de usuario:

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

Si instaló deliberadamente una unidad del sistema, edite en su lugar
`openclaw-gateway.service` mediante `sudo systemctl edit openclaw-gateway.service`.

Cómo ayudan las políticas `Restart=` a la recuperación automatizada:
[systemd can automate service recovery](https://www.redhat.com/en/blog/systemd-automate-recovery).

Para el comportamiento de OOM en Linux, la selección de procesos hijos como víctima y el diagnóstico de `exit 137`,
consulte [Presión de memoria y finalizaciones por OOM en Linux](/es/platforms/linux#memory-pressure-and-oom-kills).
